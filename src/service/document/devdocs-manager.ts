import {OrderRule} from '../../domain/types';
import { Logger } from '../../utils/logger';
import {ServerConfig} from "../../utils/config";
import {Slug} from "../../domain/values/Slug.js";
import {Query} from "../../domain/values/Query.js";
import {Limit} from "../../domain/values/Limit.js";
import {Language} from "../../domain/values/Language.js";
import {Version} from "../../domain/values/Version.js";
import {DevDocsRepository} from "../../domain/repository/devdocs-repository";
import {HttpDevDocsRepository} from "../../infrastructure/devdocs-repository-impl.js";
import {SearchHits} from "../../domain/SearchHits";
import {DocumentLanguageCollection} from "../../domain/values/DocumentLanguageCollection.js";
import {FuzeFuzzySearchStrategy} from "../../domain/FuzzySearchStrategy.js";

export class DevDocsManager {
  private config: ServerConfig;
  private logger: Logger;
  private devdocsBaseUrl: string;
  public readonly devDocsRepository: DevDocsRepository

  constructor(config: ServerConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.devdocsBaseUrl = config.devdocs.baseUrl;
    this.devDocsRepository = new HttpDevDocsRepository(config.devdocs.baseUrl, logger)
  }

  /**
   * Resolve a language input using DocumentLanguageCollection
   * Returns the top 20 sorted candidates with fluent interface
   */
  async getAvailableList(language: Language, version?: Version): Promise<DocumentLanguageCollection> {
    const availableLanguages = await this.devDocsRepository.fetchAvailableLanguages();
    if (!availableLanguages || availableLanguages.length === 0) {
      throw new Error('No available languages found from DevDocs');
    }

    // Create collection and perform fluent search
    const collection = DocumentLanguageCollection.from(availableLanguages);

    const rules: OrderRule[] = [
      { key: 'name', direction: 'asc', matcher: new ExactMatcher() },
      { key: 'type', direction: 'asc', matcher: new ExactMatcher() },
      { key: 'alias', direction: 'asc', matcher: new ExactMatcher() },
      { key: 'name', direction: 'asc', matcher: new PartialMatcher() },
      { key: 'type', direction: 'asc', matcher: new PartialMatcher() },
      { key: 'alias', direction: 'asc', matcher: new PartialMatcher() },
      { key: 'version', direction: 'desc', matcher: new ExactMatcher() },
      { key: 'version', direction: 'desc', matcher: new PartialMatcher() },
    ]
    let searchResult = collection.orderByRules(rules);

    // If no priority matches, fall back to fuzzy search
    if (searchResult.isEmpty()) {
      const fuzzySearchStrategy = new FuzeFuzzySearchStrategy();
      searchResult = collection.findByFuzzySearch(language, fuzzySearchStrategy);
    }

    if (searchResult.isEmpty()) {
      throw new Error(`No matching language found for input: "${language.toString()}"`);
    }

    return  searchResult.take(20);
  }


  /**
   * Search documentation by explicit slug (no language resolution heuristic)
   */
  async searchDocumentationBySlug(slug: Slug, query: Query, limit: Limit): Promise<SearchHits> {
    try {
      this.logger.info('document-manager', `Searching by slug "${slug.toString()}" for query "${query}"`);
      const searchHits = await this.devDocsRepository.searchDocumentationBySlug(slug);
      const extractedSearchHits = searchHits.extract(query, limit);
      this.logger.info('document-manager', `Found ${extractedSearchHits.searchHits.length} search results by slug`);
      return extractedSearchHits;
    } catch (error) {
      this.logger.error('document-manager', `Error searching by slug: ${error}`);
      throw error;
    }
  }

}