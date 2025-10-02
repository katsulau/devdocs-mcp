export interface ServerConfig {
  storage: {
    documentsPath: string;
  };
  devdocs: {
    baseUrl: string;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'text' | 'plain';
  };
}

const DEFAULT_CONFIG: ServerConfig = {
  storage: {
    documentsPath: '/app/data/documents',
  },
  devdocs: {
    baseUrl: 'https://devdocs.io'
  },
  logging: {
    level: 'info',
    format: 'json'
  },
  
};

export function loadConfig(): ServerConfig {
  return {
    storage: {
      documentsPath: process.env.DOCUMENTS_PATH || DEFAULT_CONFIG.storage.documentsPath
    },
    devdocs: {
      baseUrl: process.env.DEVDOCS_BASE_URL || DEFAULT_CONFIG.devdocs.baseUrl
    },
    logging: {
      level: (process.env.LOG_LEVEL as any) || DEFAULT_CONFIG.logging.level,
      format: (process.env.LOG_FORMAT as any) || DEFAULT_CONFIG.logging.format
    }
  };
}
