// Document metadata types based on design document
export interface DocumentLanguage {
  name: string;           // "python", "javascript"
  displayName: string;    // "Python", "JavaScript"  
  versions: DocumentVersion[];
  slug: string;          // Optional slug for API use
  type: string;          // e.g., "programming", "markup"
  alias: string;
}

export interface DocumentVersion {
  version: string;        // "3.11", "latest"
  isDefault: boolean;     // Is this the default version
  downloadStatus: 'available' | 'downloading' | 'downloaded' | 'error';
  downloadedAt?: Date;    // Download completion timestamp
  size?: number;          // Document size in bytes
  path: string;           // Local storage path
}

// Search result types
export interface SearchResult {
  language: string;
  version: string;
  title: string;
  content: string;
  url: string;
  filePath: string;
  section: string;
  relevanceScore: number;
}

// Configuration types
export interface ServerConfig {
  storage: {
    documentsPath: string;
    indexPath: string;
    cachePath: string;
  };
  devdocs: {
    baseUrl: string;
  };
  search: {
    maxResults: number;
    snippetLength: number;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'text' | 'plain';
  };
}

// Logging types moved to src/utils/types/index.ts

// MCP Tool input schemas moved to src/mcp/types/index.ts

export interface DevDocsLanguageInfo {
  name: string;
  slug: string;
  type: string;
  version?: string;
  release?: string;
  mtime?: number;
  db_size?: number;
}
