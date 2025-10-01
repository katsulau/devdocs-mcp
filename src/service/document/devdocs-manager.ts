import {
  DocumentLanguage,
} from '../../domain/types';
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
   * Resolve a language input (which may be an alias/display name/etc.) to the best matching
   * DocumentLanguage and version. If version is not provided, try to infer from input and
   * otherwise fall back to the default version.
   */
  async resolveLanguage(language: Language, version?: Version): Promise<{ language: DocumentLanguage; version?: string; langSlug: string; }> {
    const inputLower = language.toLowerCase();
    const inferredVersion = version?.toString();

    const availableLanguages = await this.devDocsRepository.fetchAvailableLanguages();
    if (!availableLanguages || availableLanguages.length === 0) {
      throw new Error('No available languages found from DevDocs');
    }

    function scoreLanguage(lang: DocumentLanguage): number {
      // Fields to compare against
      const name = lang.name || '';
      const displayName = lang.displayName || '';
      const slug = lang.slug || '';
      const type = lang.type || '';
      const alias = lang.alias || '';

      // Exact matches get highest score
      if (name.toLowerCase() === inputLower) return 100;
      if (displayName.toLowerCase() === inputLower) return 95;
      if (slug.toLowerCase() === inputLower) return 90;
      if (alias.toLowerCase() === inputLower) return 85;

      // Partial matches
      if (name.toLowerCase().includes(inputLower)) return 70;
      if (displayName.toLowerCase().includes(inputLower)) return 65;
      if (slug.toLowerCase().includes(inputLower)) return 60;
      if (type.toLowerCase().includes(inputLower)) return 50;

      // No match
      return 0;
    }

    // Find best matching language
    const scoredLanguages = availableLanguages.map(lang => ({
      language: lang,
      score: scoreLanguage(lang)
    })).filter(item => item.score > 0);

    if (scoredLanguages.length === 0) {
      throw new Error(`No matching language found for input: "${language.toString()}"`);
    }

    // Sort by score (highest first)
    scoredLanguages.sort((a, b) => b.score - a.score);
    const selected = scoredLanguages[0].language;

    // Find best matching version
    let chosenVersion: string | undefined = undefined;
    if (inferredVersion) {
      // Try to find exact version match
      const exactMatch = selected.versions.find(v => v.version === inferredVersion);
      if (exactMatch) {
        chosenVersion = exactMatch.version;
      } else {
        // Try to find partial version match
        const partialMatch = selected.versions.find(v => v.version.includes(inferredVersion));
        if (partialMatch) {
          chosenVersion = partialMatch.version;
        }
      }
    }

    // If no version found, use default
    if (!chosenVersion) {
      const defaultVersion = selected.versions.find(v => v.isDefault);
      chosenVersion = defaultVersion?.version;
    }

    const versionStrings = selected.versions.map(v => v.version);
    this.logger.info('document-manager', `resolveLanguage: input="${language.toString()}" version="${version?.toString() || ''}"`);
    this.logger.info('document-manager', `resolveLanguage: candidates=[${scoredLanguages.map(s => `${s.language.name}:${s.score}`).join(',')}]`);
    this.logger.info('document-manager', `resolveLanguage: selected name=${selected.name} display=${selected.displayName} slug=${selected.slug}`);
    this.logger.info('document-manager', `resolveLanguage: chosenVersion="${chosenVersion || ''}" versions=[${versionStrings.join(',')}]`);
    this.logger.info('document-manager', `resolveLanguage: langSlug=${selected.slug}`);

    return { language: selected, version: chosenVersion, langSlug: selected.slug };
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