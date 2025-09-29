import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { DevDocsManager } from '../document/devdocs-manager.js';
import { SearchDocsInput, DownloadDocsInput, ServerConfig, SearchSpecificDocsInput } from '../types/index.js';
import { Logger } from '../utils/logger.js';

export class DevDocsMCPServer {
  private server: Server;
  private devDocsManager: DevDocsManager;
  private logger: Logger;
  private config: ServerConfig;
  private httpServer?: import('http').Server;

  /**
   * Escape URL for markdown links to ensure proper rendering
   */
  private escapeUrlForMarkdown(url: string): string {
    if (!url || url === '#') return '#';
    
    // Replace spaces with %20
    let escapedUrl = url.replace(/ /g, '%20');
    
    // Ensure parentheses are properly encoded
    escapedUrl = escapedUrl.replace(/\(/g, '%28').replace(/\)/g, '%29');
    
    // Ensure other special characters are encoded
    escapedUrl = escapedUrl.replace(/\[/g, '%5B').replace(/\]/g, '%5D');
    escapedUrl = escapedUrl.replace(/\{/g, '%7B').replace(/\}/g, '%7D');
    escapedUrl = escapedUrl.replace(/\+/g, '%2B');
    escapedUrl = escapedUrl.replace(/\|/g, '%7C');
    escapedUrl = escapedUrl.replace(/\\/g, '%5C');
    escapedUrl = escapedUrl.replace(/\^/g, '%5E');
    escapedUrl = escapedUrl.replace(/`/g, '%60');
    
    return escapedUrl;
  }

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
            description: 'Search DevDocs documentation for specified language and version using HTTP API',
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
          {
            name: 'get_logs',
            description: 'Return recent MCP server logs from in-memory buffer',
            inputSchema: {
              type: 'object',
              properties: {
                limit: {
                  type: 'number',
                  description: 'Max number of recent log entries to return (most recent last)'
                }
              }
            }
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
        
        case 'view_available_docs':
          const downloadInput = this.validateDownloadDocsInput(args);
          return await this.handleDownloadDocs(downloadInput);
        
        case 'get_logs':
          const limit = (args as any)?.limit as number | undefined;
          const logs = this.logger.getRecentLogs(limit);
          return {
            content: [
              {
                type: 'text',
                text: logs.map(l => {
                  const base = `[${l.timestamp}] ${l.level.toUpperCase()} [${l.component}] ${l.message}`;
                  return l.metadata ? `${base} ${JSON.stringify(l.metadata)}` : base;
                }).join('\n') || '(no logs)'
              }
            ]
          };
        
        case 'search_specific_docs':
          const specificInput = this.validateSearchSpecificDocsInput(args);
          return await this.handleSearchSpecificDocs(specificInput);
        
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async handleSearchDocs(input: SearchDocsInput) {
    try {
      this.logger.info('mcp-server', `Searching docs for: ${input.query} in ${input.language}${input.version ? ` v${input.version}` : ''}`);
      
      const searchResults = await this.devDocsManager.searchDocumentation(
        input.query,
        input.language,
        input.version
      );
      
      if (searchResults.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                type: 'devdocs_result',
                query: input.query,
                language: input.language,
                version: input.version || 'latest',
                results: [],
              })
            },
          ],
        };
      }

      const limited = searchResults.slice(0, input.limit || this.config.search.maxResults);
      const results = limited.map((result: any) => {
        const escapedUrl = this.escapeUrlForMarkdown(result.url || '#');
        const cleanUrl = escapedUrl.replace('/docs/', '/');
        const snippet = result.content
          ? (result.content as string).substring(0, this.config.search.snippetLength) + '...'
          : 'No content';
        return {
          title: result.title || 'Untitled',
          displayUrl: cleanUrl.replace('devdocs:9292', 'localhost:9292'),
          snippet,
          language: input.language.toLowerCase(),
        };
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              type: 'devdocs_result',
              query: input.query,
              language: input.language,
              version: input.version || 'latest',
              results,
            })
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

  private validateSearchSpecificDocsInput(args: unknown): SearchSpecificDocsInput {
    const input = args as Record<string, unknown>;
    if (!input || typeof input !== 'object') {
      throw new Error('Invalid arguments: expected object');
    }
    if (typeof input.slug !== 'string') {
      throw new Error('Invalid arguments: slug must be a string');
    }
    if (typeof input.query !== 'string') {
      throw new Error('Invalid arguments: query must be a string');
    }
    return {
      slug: input.slug,
      query: input.query,
      limit: typeof input.limit === 'number' ? input.limit : undefined
    };
  }

  private async handleSearchSpecificDocs(input: SearchSpecificDocsInput) {
    try {
      this.logger.info('mcp-server', `Searching by slug: ${input.slug} for query: ${input.query}`);
      const searchResults = await this.devDocsManager.searchDocumentationBySlug(input);

      const limited = searchResults.slice(0, input.limit || this.config.search.maxResults);
      const results = limited.map((result: any) => {
        const escapedUrl = this.escapeUrlForMarkdown(result.url || '#');
        const cleanUrl = escapedUrl.replace('/docs/', '/');
        const snippet = result.content
          ? (result.content as string).substring(0, this.config.search.snippetLength) + '...'
          : 'No content';
        return {
          title: result.title || 'Untitled',
          displayUrl: cleanUrl.replace('devdocs:9292', 'localhost:9292'),
          snippet,
          language: input.slug.toLowerCase(),
        };
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              type: 'devdocs_result',
              query: input.query,
              slug: input.slug,
              results,
            })
          },
        ],
      };
    } catch (error) {
      this.logger.error('mcp-server', `Search by slug failed: ${error}`);
      return {
        content: [
          {
            type: 'text',
            text: `Search by slug failed: ${error}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleDownloadDocs(input: DownloadDocsInput) {
    try {
      this.logger.info('mcp-server', `Checking docs availability for: ${input.language}${input.version ? ` v${input.version}` : ''}`);
      
      // Resolve language using manager's resolver (supports alias/slug/type)
      let requestedLang;
      let resolved;
      try {
        resolved = await this.devDocsManager.resolveLanguage(input.language, input.version);
        requestedLang = resolved.language;
      } catch (e) {
        // Fallback to previous listing for better error message
        const availableLanguages = await this.devDocsManager.getAvailableLanguages();
        return {
          content: [
            {
              type: 'text',
              text: `❌ Language "${input.language}" not found in available documentation.

Available languages: ${availableLanguages.slice(0, 10).map(lang => lang.displayName).join(', ')}${availableLanguages.length > 10 ? ` and ${availableLanguages.length - 10} more...` : ''}

Please check the language name and try again.`,
            },
          ],
          isError: true,
        };
      }
      
      if (!requestedLang) {
        const availableLanguages = await this.devDocsManager.getAvailableLanguages();
        return {
          content: [
            {
              type: 'text',
              text: `❌ Language "${input.language}" not found in available documentation.

Available languages: ${availableLanguages.slice(0, 10).map((lang: any) => lang.displayName).join(', ')}${availableLanguages.length > 10 ? ` and ${availableLanguages.length - 10} more...` : ''}

Please check the language name and try again.`,
            },
          ],
          isError: true,
        };
      }

      // Provide instructions for manual download via browser
      const devdocsUrl = `${this.config.devdocs.baseUrl.replace('devdocs:9292', 'localhost:9292')}`;
      const languageUrl = `${devdocsUrl}/${requestedLang.name}`;
      const escapedDevdocsUrl = this.escapeUrlForMarkdown(devdocsUrl);
      const escapedLanguageUrl = this.escapeUrlForMarkdown(languageUrl);
      // Remove /docs/ from URL for cleaner display
      const cleanLanguageUrl = escapedLanguageUrl.replace('/docs/', '/');

      return {
        content: [
          {
            type: 'text',
            text: `📚 **${requestedLang.displayName} Documentation Setup**

Since DevDocs doesn't provide a direct download API, please follow these steps to access the documentation:

1. **Open DevDocs in your browser**: [${devdocsUrl}](${escapedDevdocsUrl})
2. **Navigate to ${requestedLang.displayName}**: [${languageUrl}](${cleanLanguageUrl})
3. **Browse the documentation** - it will be automatically loaded when you access it

**Available versions for ${requestedLang.displayName}:**
${requestedLang.versions.map(v => `- ${v.version}${v.isDefault ? ' (default)' : ''}`).join('\n')}

Once you've accessed the documentation in your browser, you can use the \`search_docs\` tool to search within it.

**Note**: The documentation is cached locally in the DevDocs container, so subsequent searches will be faster.`,
          },
        ],
      };
    } catch (error) {
      this.logger.error('mcp-server', `Download check failed: ${error}`);
      return {
        content: [
          {
            type: 'text',
            text: `Failed to check documentation availability: ${error}`,
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

    // Optional HTTP log server
    if (this.config.logHttp.enabled) {
      const http = await import('http');
      const host = this.config.logHttp.host;
      const port = this.config.logHttp.port;
      this.httpServer = http.createServer((req, res) => {
        if (!req.url) {
          res.statusCode = 400;
          res.end('Bad Request');
          return;
        }
        if (req.method === 'GET' && req.url.startsWith('/logs')) {
          const url = new URL(req.url, `http://${host}:${port}`);
          const limitParam = url.searchParams.get('limit');
          const limit = limitParam ? parseInt(limitParam, 10) : undefined;
          const logs = this.logger.getRecentLogs(limit);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ type: 'mcp_logs', count: logs.length, logs }));
          return;
        }
        res.statusCode = 404;
        res.end('Not Found');
      });
      this.httpServer.listen(port, host, () => {
        this.logger.info('mcp-server', `Log HTTP server listening on http://${host}:${port}/logs`);
      });
    }
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
