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

      const languagesData: any = await response.json();
      const languages = this.parseLanguagesFromAPI(languagesData);
      
      this.logger.info('document-manager', `Found ${languages.length} available languages`);
      return languages;
    } catch (error) {
      this.logger.error('document-manager', `Error fetching available languages: ${error}`);
      throw error;
    }
  }

  /**
   * Get list of downloaded languages
   */
  async getDownloadedLanguages(): Promise<DocumentLanguage[]> {
    try {
      this.logger.info('document-manager', 'Checking downloaded languages');
      
      // For now, return empty array as we'll implement download tracking later
      // In the future, this could check local metadata or DevDocs API for downloaded docs
      return [];
    } catch (error) {
      this.logger.error('document-manager', `Error checking downloaded languages: ${error}`);
      throw error;
    }
  }

  /**
   * Download documentation for specified language and version
   */
  async downloadDocumentation(language: string, version?: string): Promise<boolean> {
    try {
      const langSlug = version ? `${language}~${version}` : language;
      this.logger.info('document-manager', `Starting download for ${langSlug}`);

      // For now, return true as DevDocs container handles downloads
      // In the future, this could trigger DevDocs API download or check status
      this.logger.info('document-manager', `Download request for ${langSlug} - handled by DevDocs container`);
      return true;
    } catch (error) {
      this.logger.error('document-manager', `Error downloading ${language}: ${error}`);
      return false;
    }
  }

  /**
   * Parse languages from DevDocs API response
   */
  private parseLanguagesFromAPI(apiData: any[]): DocumentLanguage[] {
    const languages: Map<string, DocumentLanguage> = new Map();

    for (const item of apiData) {
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
        path: `${this.devdocsBaseUrl}/${name}/${version}`
      });
    }

    return Array.from(languages.values());
  }
}