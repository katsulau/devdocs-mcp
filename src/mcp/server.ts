import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { DevDocsManager } from '../service/document/devdocs-manager.js';
import { DownloadDocsInput, SearchSpecificDocsInput } from './types';
import { validateDownloadDocsInput, validateSearchSpecificDocsInput } from './validators.js';
import { toSearchResponse, toAvailabilityGuide, toErrorResponse, toLanguageNotFoundError } from './converters.js';
import { Logger } from '../utils/logger.js';
import {ServerConfig} from "../utils/config";
import {Slug} from "../domain/values/Slug.js";
import {Query} from "../domain/values/Query.js";
import {Limit} from "../domain/values/Limit.js";
import {ValidatedLanguageVersionInput} from "./input/ValidatedLanguageVersionInput.js";
import {Language} from "../domain/values/Language.js";
import {Version} from "../domain/values/Version.js";

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
            description: 'View available documentation languages and get instructions for accessing them via browser',
            inputSchema: {
              type: 'object',
              properties: {
                language: {
                  type: 'string',
                  description: 'Language to download',
                },
                version: {
                  type: 'string',
                  description: 'Version to download',
                },
              },
              required: ['language'],
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

      const slug = Slug.create(input.slug);
      const query = Query.create(input.query);
      const limit = Limit.create(input.limit);
      this.logger.info('mcp-server', `Searching by slug: ${input.slug} for query: ${input.query}`);
      const searchResults = await this.devDocsManager.searchDocumentationBySlug(slug, query, limit);
      return toSearchResponse(searchResults.searchHits, {
        query: query,
        slug: slug
      });
    } catch (error) {
      this.logger.error('mcp-server', `Search by slug failed: ${error}`);
      return toErrorResponse(`Search by slug failed: ${error}`);
    }
  }

  private async handleDownloadDocs(input: DownloadDocsInput) {
    try {
      this.logger.info('mcp-server', `Checking docs availability for: ${input.language}${input.version ? ` v${input.version}` : ''}`);
      
      // Create ValidatedLanguageVersionInput and convert to domain objects
      const validatedInput = ValidatedLanguageVersionInput.create(input.language, input.version);
      const language = new Language(validatedInput.language);
      const version = validatedInput.version ? new Version(validatedInput.version) : undefined;
      
      const resolved = await this.devDocsManager.resolveLanguage(language, version);
      return toAvailabilityGuide(resolved.language, this.config.devdocs.baseUrl);
    } catch (e) {
      const availableLanguages = await this.devDocsManager.devDocsRepository.fetchAvailableLanguages();
      return toLanguageNotFoundError(input.language, availableLanguages);
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