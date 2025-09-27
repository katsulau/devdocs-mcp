// Document metadata types based on design document
export interface DocumentLanguage {
  name: string;           // "python", "javascript"
  displayName: string;    // "Python", "JavaScript"  
  versions: DocumentVersion[];
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
    format: 'json' | 'text';
  };
}

// Logging types
export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  component: 'mcp-server' | 'document-manager' | 'search-engine';
  message: string;
  metadata?: Record<string, any>;
}

// MCP Tool input schemas
export interface SearchDocsInput {
  query: string;
  language: string;
  version?: string;
  limit?: number;
}

export interface DownloadDocsInput {
  language: string;
  version?: string;
}

export interface DevDocsLanguageInfo {
  name: string;
  slug: string;
  type: string;
  version?: string;
  release?: string;
  mtime?: number;
  db_size?: number;
}
