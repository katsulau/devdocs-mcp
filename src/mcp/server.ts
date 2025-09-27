import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { DevDocsManager } from '../document/devdocs-manager.js';
import { SearchDocsInput, DownloadDocsInput, ServerConfig } from '../types/index.js';
import { Logger } from '../utils/logger.js';

export class DevDocsMCPServer {
  private server: Server;
  private devDocsManager: DevDocsManager;
  private logger: Logger;
  private config: ServerConfig;

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

  private validateSearchDocsInput(args: unknown): SearchDocsInput {
    const input = args as Record<string, unknown>;
    if (!input || typeof input !== 'object') {
      throw new Error('Invalid arguments: expected object');
    }
    if (typeof input.query !== 'string') {
      throw new Error('Invalid arguments: query must be a string');
    }
    if (typeof input.language !== 'string') {
      throw new Error('Invalid arguments: language must be a string');
    }
    return {
      query: input.query,
      language: input.language,
      version: typeof input.version === 'string' ? input.version : undefined,
      limit: typeof input.limit === 'number' ? input.limit : undefined,
    };
  }

  private validateDownloadDocsInput(args: unknown): DownloadDocsInput {
    const input = args as Record<string, unknown>;
    if (!input || typeof input !== 'object') {
      throw new Error('Invalid arguments: expected object');
    }
    if (typeof input.language !== 'string') {
      throw new Error('Invalid arguments: language must be a string');
    }
    return {
      language: input.language,
      version: typeof input.version === 'string' ? input.version : undefined,
    };
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
          {
            uri: 'devdocs://downloaded',
            name: 'Downloaded Languages',
            description: 'List of downloaded languages and versions',
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
            const languages = await this.devDocsManager.getAvailableLanguages();
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

        case 'devdocs://downloaded':
          try {
            const downloaded = await this.devDocsManager.getDownloadedLanguages();
            return {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify(downloaded, null, 2),
                },
              ],
            };
          } catch (error) {
            throw new Error(`Failed to get downloaded languages: ${error}`);
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
            name: 'search_docs',
            description: 'Search documentation for specified language and version',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query',
                },
                language: {
                  type: 'string',
                  description: 'Target language',
                },
                version: {
                  type: 'string',
                  description: 'Target version (default if omitted)',
                },
                limit: {
                  type: 'number',
                  default: 10,
                  description: 'Maximum number of results',
                },
              },
              required: ['query', 'language'],
            },
          },
          {
            name: 'download_docs',
            description: 'Download documentation for specified language and version',
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
        case 'search_docs':
          const searchInput = this.validateSearchDocsInput(args);
          return await this.handleSearchDocs(searchInput);
        
        case 'download_docs':
          const downloadInput = this.validateDownloadDocsInput(args);
          return await this.handleDownloadDocs(downloadInput);
        
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async handleSearchDocs(input: SearchDocsInput) {
    try {
      this.logger.info('mcp-server', `Searching docs for: ${input.query} in ${input.language}${input.version ? ` v${input.version}` : ''}`);
      
      // TODO: Implement actual search functionality in Phase 2
      // For now, return placeholder response
      return {
        content: [
          {
            type: 'text',
            text: `Search functionality not yet implemented. Would search for "${input.query}" in ${input.language}${input.version ? ` version ${input.version}` : ''}.`,
          },
        ],
      };
    } catch (error) {
      this.logger.error('mcp-server', `Search failed: ${error}`);
      return {
        content: [
          {
            type: 'text',
            text: `Search failed: ${error}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleDownloadDocs(input: DownloadDocsInput) {
    try {
      this.logger.info('mcp-server', `Downloading docs for: ${input.language}${input.version ? ` v${input.version}` : ''}`);
      
      const success = await this.devDocsManager.downloadDocumentation(input.language, input.version);
      
      if (success) {
        return {
          content: [
            {
              type: 'text',
              text: `Successfully downloaded ${input.language}${input.version ? ` version ${input.version}` : ''} documentation.`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to download ${input.language}${input.version ? ` version ${input.version}` : ''} documentation.`,
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      this.logger.error('mcp-server', `Download failed: ${error}`);
      return {
        content: [
          {
            type: 'text',
            text: `Download failed: ${error}`,
          },
        ],
        isError: true,
      };
    }
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    this.logger.info('mcp-server', 'Starting DevDocs MCP server');
    
    await this.server.connect(transport);
    this.logger.info('mcp-server', 'DevDocs MCP server started successfully');
  }

  async stop(): Promise<void> {
    this.logger.info('mcp-server', 'Stopping DevDocs MCP server');
    await this.server.close();
  }
}
