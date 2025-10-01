import {
  DocumentLanguage, SearchHit,
} from '../../domain/types';
import { Logger } from '../../utils/logger';
import {ServerConfig} from "../../utils/config";
import {Slug} from "../../domain/values/Slug.js";
import {Query} from "../../domain/values/Query.js";
import {Limit} from "../../domain/values/Limit.js";

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
   * Resolve a language input (which may be an alias/display name/etc.) to the best matching
   * DocumentLanguage and version. If version is not provided, try to infer from input and
   * otherwise fall back to the default version.
   */
  async resolveLanguage(languageInput: string, versionInput?: string): Promise<{ language: DocumentLanguage; version?: string; langSlug: string; }> {
    const input = (languageInput || '').trim();
    const inputLower = input.toLowerCase();

    // Try to extract a version from the language input if not explicitly provided (e.g., "Java 17")
    let inferredVersion = versionInput && versionInput.trim() ? versionInput.trim() : undefined;
    if (!inferredVersion) {
      const versionMatch = inputLower.match(/\b(\d+(?:\.\d+)*)\b/);
      if (versionMatch) {
        inferredVersion = versionMatch[1];
      }
    }

    const availableLanguages = await this.getAvailableLanguages();
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
      throw new Error(`No matching language found for input: "${languageInput}"`);
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
        const partialMatch = selected.versions.find(v => v.version.includes(inferredVersion!));
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
    this.logger.info('document-manager', `resolveLanguage: input="${languageInput}" version="${versionInput || ''}"`);
    this.logger.info('document-manager', `resolveLanguage: candidates=[${scoredLanguages.map(s => `${s.language.name}:${s.score}`).join(',')}]`);
    this.logger.info('document-manager', `resolveLanguage: selected name=${selected.name} display=${selected.displayName} slug=${selected.slug}`);
    this.logger.info('document-manager', `resolveLanguage: chosenVersion="${chosenVersion || ''}" versions=[${versionStrings.join(',')}]`);
    this.logger.info('document-manager', `resolveLanguage: langSlug=${selected.slug}`);

    return { language: selected, version: chosenVersion, langSlug: selected.slug };
  }

  async getAvailableLanguages(): Promise<DocumentLanguage[]> {
    try {
      this.logger.info('document-manager', 'Fetching available languages from DevDocs API');
      
      const response = await fetch(`${this.devdocsBaseUrl}/assets/docs.json`);
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
   * Search documentation by explicit slug (no language resolution heuristic)
   */
  async searchDocumentationBySlug(slug: Slug, query: Query, limit: Limit): Promise<SearchHit[]> {
    try {
      this.logger.info('document-manager', `Searching by slug "${slug.toString()}" for query "${query}"`);

      const docUrl = `${this.devdocsBaseUrl}/docs/${slug.toString()}/index.json`;
      const response = await fetch(docUrl);
      if (!response.ok) {
        throw new Error(`Documentation not available for slug ${slug.toString()}: ${response.statusText}`);
      }

      const docData = await response.json() as { entries: any[], types: any[] };
      const results = docData.entries
        .filter(entry => {
          const searchText = `${entry.name || ''} ${entry.path || ''}`.toLowerCase();
          return searchText.includes(query.toString().toLowerCase());
        })
        .slice(0, limit.toNumber())
        .map(entry => ({
          title: entry.name || 'Untitled',
          url: `${this.devdocsBaseUrl}/docs/${slug.toString()}/${entry.path}`,
          content: entry.name || '',
          language: slug.toString()
        }));

      this.logger.info('document-manager', `Found ${results.length} search results by slug`);
      return results;
    } catch (error) {
      this.logger.error('document-manager', `Error searching by slug: ${error}`);
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
        path: `${this.devdocsBaseUrl}/docs/${name}`
      });
    }

    return Array.from(languages.values());
  }
}