import { 
  DocumentLanguage, 
  DocumentVersion, 
  ServerConfig,
  SearchSpecificDocsInput
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

      const candidates = [
        { value: name, weight: 100 },
        { value: displayName, weight: 95 },
        { value: slug, weight: 90 },
        { value: alias, weight: 85 },
        { value: type, weight: 20 }, // type is very generic; low weight
      ];

      let maxScore = 0;
      for (const { value, weight } of candidates) {
        const v = (value || '').toLowerCase();
        if (!v) continue;
        if (v === inputLower) {
          maxScore = Math.max(maxScore, weight + 10); // exact match bonus
        } else if (v.includes(inputLower) || inputLower.includes(v)) {
          maxScore = Math.max(maxScore, weight);
        }
      }
      return maxScore;
    }

    let best: { lang: DocumentLanguage; score: number } | null = null;
    for (const lang of availableLanguages) {
      const score = scoreLanguage(lang);
      if (!best || score > best.score) {
        best = { lang, score };
      }
    }

    if (!best || best.score === 0) {
      throw new Error(`Language "${languageInput}" not found`);
    }

    const selected = best.lang;

    // Choose version: explicit > inferred > default > first available
    let chosenVersion: string | undefined = undefined;
    const versions = selected.versions || [];
    const versionStrings = versions.map(v => v.version);
    if (versionInput && versionStrings.includes(versionInput)) {
      chosenVersion = versionInput;
    } else if (inferredVersion && versionStrings.includes(inferredVersion)) {
      chosenVersion = inferredVersion;
    } else {
      const def = versions.find(v => v.isDefault);
      chosenVersion = def ? def.version : versions[0]?.version;
    }

    this.logger.info('document-manager', `resolveLanguage: selected name=${selected.name} display=${selected.displayName} slug=${selected.slug}`);
    this.logger.info('document-manager', `resolveLanguage: chosenVersion="${chosenVersion || ''}" versions=[${versionStrings.join(',')}]`);
    this.logger.info('document-manager', `resolveLanguage: langSlug=${selected.slug}`);

    return { language: selected, version: chosenVersion, langSlug: selected.slug };
  }

  /**
   * Get list of available languages from DevDocs API
   */
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
  async searchDocumentationBySlug(input: SearchSpecificDocsInput): Promise<any[]> {
    const { slug, query, limit } = input;
    try {
      const langSlug = slug.trim();
      if (!langSlug) {
        throw new Error('slug is required');
      }
      this.logger.info('document-manager', `Searching by slug "${langSlug}" for query "${query}"`);

      const docUrl = `${this.devdocsBaseUrl}/docs/${langSlug}/index.json`;
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
          url: `${this.devdocsBaseUrl}/docs/${langSlug}/${entry.path}`,
          content: entry.name || '',
          relevanceScore: 1.0
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