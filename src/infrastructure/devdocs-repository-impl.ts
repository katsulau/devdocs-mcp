import { DocumentLanguage } from '../domain/types';
import {DevDocsRepository} from "../domain/repository/devdocs-repository";
import {Slug} from "../domain/values/Slug.js";
import {SearchHit, SearchHits} from "../domain/SearchHits.js";


/**
 * HTTP implementation of DevDocsRepository
 */
export class HttpDevDocsRepository implements DevDocsRepository {
  private readonly baseUrl: string;
  private readonly logger: import('../utils/logger').Logger;

  constructor(baseUrl: string, logger: import('../utils/logger').Logger) {
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

  async searchDocumentationBySlug(slug: Slug): Promise<SearchHits> {
    try {
      const docUrl = `${this.baseUrl}/docs/${slug.toString()}/index.json`;
      const response = await fetch(docUrl);
      if (!response.ok) {
        throw new Error(`Documentation not available for slug ${slug.toString()}: ${response.statusText}`);
      }

      const docData = await response.json() as { entries: any[], types: any[] };
      const results: SearchHit[] = docData.entries
        .map(entry => ({
          title: entry.name || 'Untitled',
          url: `http://localhost:9292/${slug.toString()}/${entry.path}`,
          path: entry.path || '',
          type: entry.type || '',
          slug: slug
        }));
      this.logger.info('devdocs-repository', `Found ${results.length} search results by slug`);
      return SearchHits.create(results);
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
