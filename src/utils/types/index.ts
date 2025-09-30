// Utility-specific types

// Logging types
export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  component: 'mcp-server' | 'document-manager' | 'search-engine';
  message: string;
  metadata?: Record<string, any>;
}
