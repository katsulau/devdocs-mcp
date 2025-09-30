// MCP-specific types for protocol communication

// MCP Tool input schemas
export interface SearchSpecificDocsInput {
  slug: string; // e.g., "openjdk~21", "python~3.11"
  query: string; // text to search within the slug's index
  limit?: number;
}

export interface DownloadDocsInput {
  language: string;
  version?: string;
}

// MCP Response types
export interface McpContent {
  type: 'text';
  text: string;
}

export interface McpToolResponse {
  content: McpContent[];
  isError?: boolean;
}

// MCP-specific domain models (converted from external APIs)
export interface SearchHit {
  title: string;
  url: string;
  content?: string;
  language: string;
}

export interface LanguageInfo {
  name: string;
  displayName: string;
  slug: string;
  versions: Array<{
    version: string;
    isDefault: boolean;
  }>;
}
