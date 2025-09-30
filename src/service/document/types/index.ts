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

// MCP-specific domain models (converted from external APIs)
export interface SearchHit {
  title: string;
  url: string;
  content?: string;
  language: string;
}