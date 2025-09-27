import { 
  DocumentLanguage, 
  DocumentVersion, 
  ServerConfig 
} from '../types/index.js';
import { Logger } from '../utils/logger.js';

export class DevDocsManager {
  private config: ServerConfig;
  private logger: Logger;
  private devdocsBaseUrl: string;

  constructor(config: ServerConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.devdocsBaseUrl = config.devdocs.baseUrl;
  }

  /**
   * Get list of available languages from DevDocs API
   */
  async getAvailableLanguages(): Promise<DocumentLanguage[]> {
    try {
      this.logger.info('document-manager', 'Fetching available languages from DevDocs API');
      
      const response = await fetch(`${this.devdocsBaseUrl}/docs.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch languages: ${response.statusText}`);
      }

      const languagesData = await response.json() as Record<string, any>;
      const languages = this.parseLanguagesFromAPI(languagesData);
      
      this.logger.info('document-manager', `Found ${languages.length} available languages`);
      return languages;
    } catch (error) {
      this.logger.error('document-manager', `Error fetching available languages: ${error}`);
      throw error;
    }
  }

  /**
   * Search documentation for specified query, language and version
   */
  async searchDocumentation(query: string, language: string, version?: string): Promise<any[]> {
    try {
      const langSlug = version ? `${language}~${version}` : language;
      this.logger.info('document-manager', `Searching for "${query}" in ${langSlug}`);

      // DevDocs documentation index API endpoint
      const docUrl = `${this.devdocsBaseUrl}/docs/${langSlug}/index.json`;
      
      const response = await fetch(docUrl);
      if (!response.ok) {
        throw new Error(`Documentation not available: ${response.statusText}`);
      }

      const docData = await response.json() as { entries: any[], types: any[] };
      
      // Simple text search in entries
      const searchResults = docData.entries
        .filter(entry => {
          const searchText = `${entry.name || ''} ${entry.path || ''}`.toLowerCase();
          return searchText.includes(query.toLowerCase());
        })
        .slice(0, 10) // Limit to 10 results
        .map(entry => ({
          title: entry.name || 'Untitled',
          url: `${this.devdocsBaseUrl}/docs/${langSlug}/${entry.path}`,
          content: entry.name || '',
          relevanceScore: 1.0 // Simple relevance for now
        }));

      this.logger.info('document-manager', `Found ${searchResults.length} search results`);
      
      return searchResults;
    } catch (error) {
      this.logger.error('document-manager', `Error searching documentation: ${error}`);
      throw error;
    }
  }

  /**
   * Parse languages from DevDocs API response
   */
  private parseLanguagesFromAPI(apiData: Record<string, any>): DocumentLanguage[] {
    const languages: Map<string, DocumentLanguage> = new Map();

    for (const key in apiData) {
      const item = apiData[key];
      const name = item.slug;
      const displayName = item.name;
      const version = item.version || 'latest';

      if (!languages.has(name)) {
        languages.set(name, {
          name,
          displayName,
          versions: []
        });
      }

      const lang = languages.get(name)!;
      lang.versions.push({
        version,
        isDefault: !version || version === 'latest',
        downloadStatus: 'available',
        path: `${this.devdocsBaseUrl}/docs/${name}`
      });
    }

    return Array.from(languages.values());
  }
}