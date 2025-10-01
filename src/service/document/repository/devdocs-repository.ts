import { DocumentLanguage, SearchHit } from '../types';
import { SearchSpecificDocsInput } from '../../../mcp/types';

/**
 * Repository interface for DevDocs data access
 */
export interface DevDocsRepository {
  /**
   * Fetch available languages from DevDocs API
   */
  fetchAvailableLanguages(): Promise<DocumentLanguage[]>;

  /**
   * Search documentation by slug
   */
  searchDocumentationBySlug(input: SearchSpecificDocsInput): Promise<SearchHit[]>;
}

/**
 * HTTP implementation of DevDocsRepository
 */
export class HttpDevDocsRepository implements DevDocsRepository {
  private readonly baseUrl: string;
  private readonly logger: import('../../../utils/logger').Logger;

  constructor(baseUrl: string, logger: import('../../../utils/logger').Logger) {
    this.baseUrl = baseUrl;
    this.logger = logger;
  }

  async fetchAvailableLanguages(): Promise<DocumentLanguage[]> {
    try {
      this.logger.info('devdocs-repository', 'Fetching available languages from DevDocs API');
      
      const response = await fetch(`${this.baseUrl}/assets/docs.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch languages: ${response.statusText}`);
      }

      const languagesData = await response.json() as Record<string, any>;
      const languages = this.parseLanguagesFromAPI(languagesData);
      
      this.logger.info('devdocs-repository', `Found ${languages.length} available languages`);
      return languages;
    } catch (error) {
      this.logger.error('devdocs-repository', `Error fetching available languages: ${error}`);
      throw error;
    }
  }

  async searchDocumentationBySlug(input: SearchSpecificDocsInput): Promise<SearchHit[]> {
    const { slug, query, limit } = input;
    try {
      const langSlug = slug.trim();
      if (!langSlug) {
        throw new Error('slug is required');
      }
      this.logger.info('devdocs-repository', `Searching by slug "${langSlug}" for query "${query}"`);

      const docUrl = `${this.baseUrl}/docs/${langSlug}/index.json`;
      const response = await fetch(docUrl);
      if (!response.ok) {
        throw new Error(`Documentation not available for slug ${langSlug}: ${response.statusText}`);
      }

      const docData = await response.json() as { entries: any[], types: any[] };
      const results = docData.entries
        .filter(entry => {
          const searchText = `${entry.name || ''} ${entry.path || ''}`.toLowerCase();
          return searchText.includes(query.toLowerCase());
        })
        .slice(0, typeof limit === 'number' ? limit : 10)
        .map(entry => ({
          title: entry.name || 'Untitled',
          url: `${this.baseUrl}/docs/${langSlug}/${entry.path}`,
          content: entry.name || '',
          language: langSlug
        }));

      this.logger.info('devdocs-repository', `Found ${results.length} search results by slug`);
      return results;
    } catch (error) {
      this.logger.error('devdocs-repository', `Error searching by slug: ${error}`);
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
      const slug = item.slug;
      const type = item.type;
      const alias = item.alias || '';

      if (!languages.has(name)) {
        languages.set(name, {
          name,
          displayName,
          versions: [],
          slug,
          type,
          alias
        });
      }

      const lang = languages.get(name)!;
      lang.versions.push({
        version,
        isDefault: !version || version === 'latest',
        downloadStatus: 'available',
        path: `${this.baseUrl}/docs/${name}`
      });
    }

    return Array.from(languages.values());
  }
}
