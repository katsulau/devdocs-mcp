import { Logger } from '../../utils/logger';
import {ServerConfig} from "../../utils/config";
import {Slug} from "../../domain/values/Slug.js";
import {Query} from "../../domain/values/Query.js";
import {Limit} from "../../domain/values/Limit.js";
import {DevDocsRepository} from "../../domain/repository/devdocs-repository";
import {HttpDevDocsRepository} from "../../infrastructure/devdocs-repository-impl.js";
import {SearchHits} from "../../domain/SearchHits";
import {DocumentLanguageCollection} from "../../domain/values/DocumentLanguageCollection.js";
import {ValidationError} from "../../domain/error/ValidationError.js";
import { AppError, BadRequestError, NotFoundError } from "../error/AppError.js";

export class DevDocsManager {
  private logger: Logger;
  public readonly devDocsRepository: DevDocsRepository

  constructor(config: ServerConfig, logger: Logger) {
    this.logger = logger;
    this.devDocsRepository = new HttpDevDocsRepository(config.devdocs.baseUrl, logger)
  }

  /**
   * get available languages from DevDocs
   */
  async getAvailableList(): Promise<DocumentLanguageCollection> {
    const availableLanguages = await this.devDocsRepository.fetchAvailableLanguages();
    if (!availableLanguages || availableLanguages.length === 0) {
      throw new NotFoundError('No available languages found from DevDocs');
    }
    return DocumentLanguageCollection.from(availableLanguages);
  }


  /**
   * Search documentation by explicit slug (no language resolution heuristic)
   */
  async searchDocumentationBySlug(slugParam: string, queryParam: string, limitParam?: number): Promise<SearchHits> {
    try {
      const slug = Slug.create(slugParam);
      const query = Query.create(queryParam);
      const limit = Limit.create(limitParam);
      this.logger.info('document-manager', `Searching by slug "${slug.toString()}" for query "${query}"`);
      const searchHits = await this.devDocsRepository.searchDocumentationBySlug(slug);
      const extractedSearchHits = searchHits.extract(query, limit);
      this.logger.info('document-manager', `Found ${extractedSearchHits.searchHits.length} search results by slug`);
      return extractedSearchHits;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new BadRequestError("validation error in searchDocumentationBySlug", error);
      }
      throw new AppError('INTERNAL_ERROR', 'Error searching by slug', error);
    }
  }

}