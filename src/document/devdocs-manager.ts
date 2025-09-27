import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { 
  DevDocsLanguageInfo, 
  DocumentLanguage, 
  DocumentVersion, 
  ThorCommandResult,
  ServerConfig 
} from '../types/index.js';
import { Logger } from '../utils/logger.js';

export class DevDocsManager {
  private config: ServerConfig;
  private logger: Logger;
  private thorCommand: string;

  constructor(config: ServerConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.thorCommand = config.devdocs.thorCommand;
  }

  /**
   * Execute DevDocs thor command
   */
  private async executeThorCommand(args: string[]): Promise<ThorCommandResult> {
    return new Promise((resolve) => {
      this.logger.debug('document-manager', `Executing thor command: ${args.join(' ')}`);
      
      const process = spawn('thor', args, {
        cwd: '/app/devdocs',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      process.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        const success = code === 0;
        this.logger.debug('document-manager', `Thor command completed with code: ${code}`);
        
        resolve({
          success,
          output: stdout,
          error: stderr || undefined
        });
      });

      process.on('error', (error) => {
        this.logger.error('document-manager', `Thor command failed: ${error.message}`);
        resolve({
          success: false,
          output: '',
          error: error.message
        });
      });
    });
  }

  /**
   * Get list of available languages from DevDocs
   */
  async getAvailableLanguages(): Promise<DocumentLanguage[]> {
    try {
      this.logger.info('document-manager', 'Fetching available languages from DevDocs');
      
      const result = await this.executeThorCommand(['docs:list']);
      if (!result.success) {
        throw new Error(`Failed to get languages list: ${result.error}`);
      }

      // Parse thor output to extract language information
      const languages = this.parseLanguagesList(result.output);
      
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
      
      const docsPath = this.config.storage.documentsPath;
      
      // Check if documents directory exists
      try {
        await fs.access(docsPath);
      } catch {
        this.logger.info('document-manager', 'Documents directory does not exist, no languages downloaded');
        return [];
      }

      // Read downloaded documentation metadata
      const metadataPath = join(docsPath, 'metadata.json');
      try {
        const metadata = await fs.readFile(metadataPath, 'utf8');
        const downloadedLanguages: DocumentLanguage[] = JSON.parse(metadata);
        
        this.logger.info('document-manager', `Found ${downloadedLanguages.length} downloaded languages`);
        return downloadedLanguages;
      } catch {
        this.logger.info('document-manager', 'No metadata file found, scanning directory');
        return await this.scanDownloadedDocuments();
      }
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

      // Update status to downloading
      await this.updateDownloadStatus(language, version, 'downloading');

      const result = await this.executeThorCommand(['docs:download', langSlug]);
      
      if (result.success) {
        this.logger.info('document-manager', `Successfully downloaded ${langSlug}`);
        await this.updateDownloadStatus(language, version, 'downloaded');
        return true;
      } else {
        this.logger.error('document-manager', `Failed to download ${langSlug}: ${result.error}`);
        await this.updateDownloadStatus(language, version, 'error');
        return false;
      }
    } catch (error) {
      this.logger.error('document-manager', `Error downloading ${language}: ${error}`);
      await this.updateDownloadStatus(language, version, 'error');
      return false;
    }
  }

  /**
   * Parse thor docs:list output to extract language information
   */
  private parseLanguagesList(output: string): DocumentLanguage[] {
    const languages: Map<string, DocumentLanguage> = new Map();
    const lines = output.split('\n').filter(line => line.trim());

    for (const line of lines) {
      // Parse format: "language~version" or "language"
      const match = line.match(/^(\w+)(?:~(.+))?$/);
      if (!match) continue;

      const [, name, version] = match;
      const displayName = name;

      if (!languages.has(name)) {
        languages.set(name, {
          name,
          displayName,
          versions: []
        });
      }

      const lang = languages.get(name)!;
      lang.versions.push({
        version: version || 'latest',
        isDefault: !version || version === 'latest',
        downloadStatus: 'available',
        path: join(this.config.storage.documentsPath, version ? `${name}~${version}` : name)
      });
    }

    return Array.from(languages.values());
  }

  /**
   * Scan documents directory to find downloaded documentation
   */
  private async scanDownloadedDocuments(): Promise<DocumentLanguage[]> {
    // Implementation would scan the actual directory structure
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Update download status for a language/version
   */
  private async updateDownloadStatus(
    language: string, 
    version: string | undefined, 
    status: DocumentVersion['downloadStatus']
  ): Promise<void> {
    // Implementation would update metadata file
    this.logger.debug('document-manager', `Updated ${language}${version ? `~${version}` : ''} status to ${status}`);
  }

}
