import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { DevDocsManager } from '../application/document/devdocs-manager.js';
import { DownloadDocsInput, SearchSpecificDocsInput } from './types';
import { validateDownloadDocsInput, validateSearchSpecificDocsInput } from './validators.js';
import { toSearchResponse, toErrorResponse, toLanguageNotFoundError, toAvailableLanguagesJsonResponse } from './converters.js';
import { Logger } from '../utils/logger.js';
import {ServerConfig} from "../utils/config";
import { BadRequestError, NotFoundError } from "../application/error/AppError.js";

export class DevDocsMCPServer {
  private server: Server;
  private devDocsManager: DevDocsManager;
  private logger: Logger;
  private config: ServerConfig;
  private httpServer?: import('http').Server;

  constructor(config: ServerConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.devDocsManager = new DevDocsManager(config, logger);
    
    this.server = new Server(
      {
        name: 'devdocs-reference-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      this.logger.debug('mcp-server', 'Listing resources');
      
      return {
        resources: [
          {
            uri: 'devdocs://languages',
            name: 'Available Languages',
            description: 'List of languages and versions available in DevDocs',
            mimeType: 'application/json',
          },
        ],
      };
    });

    // Read specific resources
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      this.logger.debug('mcp-server', `Reading resource: ${uri}`);

      switch (uri) {
        case 'devdocs://languages':
          try {
            const languages = await this.devDocsManager.devDocsRepository.fetchAvailableLanguages();
            return {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify(languages, null, 2),
                },
              ],
            };
          } catch (error) {
            throw new Error(`Failed to get available languages: ${error}`);
          }

        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    });

    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      this.logger.debug('mcp-server', 'Listing tools');
      
      return {
        tools: [
          {
            name: 'search_specific_docs',
            description: 'Search DevDocs by explicit slug (e.g., openjdk~21) and query',
            inputSchema: {
              type: 'object',
              properties: {
                slug: {
                  type: 'string',
                  description: 'Exact DevDocs slug, e.g., openjdk~21',
                },
                query: {
                  type: 'string',
                  description: 'Text to search within the documentation index',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results',
                  default: 10
                }
              },
              required: ['slug', 'query']
            }
          },
          {
            name: 'view_available_docs',
            description: 'View available documentation languages and get instructions for accessing them via browser. If no language is specified, returns first 20 languages in JSON format with slug list.',
            inputSchema: {
              type: 'object',
              properties: {
                language: {
                  type: 'string',
                  description: 'Language to download (optional - if empty, returns all available languages)',
                },
                version: {
                  type: 'string',
                  description: 'Version to download',
                },
              },
              required: [],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      this.logger.debug('mcp-server', `Calling tool: ${name}`, { args });

      switch (name) {
        case 'view_available_docs':
          const downloadInput = validateDownloadDocsInput(args);
          return await this.handleDownloadDocs(downloadInput);

        case 'search_specific_docs':
          const specificInput = validateSearchSpecificDocsInput(args);
          return await this.handleSearchSpecificDocs(specificInput);
        
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async handleSearchSpecificDocs(input: SearchSpecificDocsInput) {
    try {
      this.logger.info('mcp-server', `Searching by slug: ${input.slug} for query: ${input.query}`);
      const searchResults = await this.devDocsManager.searchDocumentationBySlug(input.slug, input.query, input.limit);
      return toSearchResponse(searchResults.searchHits, {
        query: input.slug,
        slug: input.query
      });
    } catch (error) {
      this.logger.error('mcp-server', `Search by slug failed: ${error}`);
      if (error instanceof BadRequestError) {
        return toErrorResponse(`input parameter error: ${error}`);
      }
      return toErrorResponse(`Search by slug failed: ${error}`);
    }
  }

  private async handleDownloadDocs(input: DownloadDocsInput) {
    try {
      this.logger.info('mcp-server', `Checking docs availability for: ${input.language}${input.version ? ` v${input.version}` : ''}`);
      const resolvedCollection = await this.devDocsManager.getAvailableList();
      return toAvailableLanguagesJsonResponse(resolvedCollection);
    }  catch (e) {
      if (e instanceof NotFoundError) {
        return toLanguageNotFoundError(input.language);
      } else {
        return toErrorResponse(`Failed to check docs availability: ${e}`);
      }
    }
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    this.logger.info('mcp-server', 'Starting DevDocs MCP server');
    
    await this.server.connect(transport);
    this.logger.info('mcp-server', 'DevDocs MCP server started successfully');

    // HTTP log server removed as it is no longer needed
  }

  async stop(): Promise<void> {
    this.logger.info('mcp-server', 'Stopping DevDocs MCP server');
    await this.server.close();
    if (this.httpServer) {
      await new Promise<void>(resolve => this.httpServer!.close(() => resolve()));
      this.httpServer = undefined;
    }
  }
}