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
  _meta?: { [x: string]: unknown };
}

export interface McpToolResponse {
  content: McpContent[];
  _meta?: { [x: string]: unknown };
}

export interface LanguageInfo {
  name: string;
  displayName: string;
  slug: string;
  version: string;
}