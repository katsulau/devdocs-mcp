import { ServerConfig } from '../types/index.js';

const DEFAULT_CONFIG: ServerConfig = {
  storage: {
    documentsPath: '/app/data/documents',
    indexPath: '/app/data/index',
    cachePath: '/app/data/cache'
  },
  devdocs: {
    baseUrl: 'https://devdocs.io'
  },
  search: {
    maxResults: 50,
    snippetLength: 200
  },
  logging: {
    level: 'info',
    format: 'json'
  },
  logHttp: {
    enabled: false,
    host: '127.0.0.1',
    port: 9293
  }
};

export function loadConfig(): ServerConfig {
  return {
    storage: {
      documentsPath: process.env.DOCUMENTS_PATH || DEFAULT_CONFIG.storage.documentsPath,
      indexPath: process.env.INDEX_PATH || DEFAULT_CONFIG.storage.indexPath,
      cachePath: process.env.CACHE_PATH || DEFAULT_CONFIG.storage.cachePath
    },
    devdocs: {
      baseUrl: process.env.DEVDOCS_BASE_URL || DEFAULT_CONFIG.devdocs.baseUrl
    },
    search: {
      maxResults: parseInt(process.env.MAX_RESULTS || '50', 10),
      snippetLength: parseInt(process.env.SNIPPET_LENGTH || '200', 10)
    },
    logging: {
      level: (process.env.LOG_LEVEL as any) || DEFAULT_CONFIG.logging.level,
      format: (process.env.LOG_FORMAT as any) || DEFAULT_CONFIG.logging.format
    },
    logHttp: {
      enabled: (process.env.LOG_HTTP_ENABLED || 'false').toLowerCase() === 'true',
      host: process.env.LOG_HTTP_HOST || DEFAULT_CONFIG.logHttp!.host,
      port: parseInt(process.env.LOG_HTTP_PORT || String(DEFAULT_CONFIG.logHttp!.port), 10)
    }
  };
}
