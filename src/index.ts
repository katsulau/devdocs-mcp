#!/usr/bin/env node

// Load environment variables from .env file
import 'dotenv/config';

import { DevDocsMCPServer } from './mcp/server.js';
import { loadConfig } from './utils/config.js';
import { Logger } from './utils/logger.js';

async function main() {
  try {
    // Load configuration
    const config = loadConfig();
    
    // Initialize logger
    const logger = new Logger(config.logging);
    
    logger.info('mcp-server', 'Starting DevDocs Reference MCP Server', {
      version: '1.0.0',
      config: {
        logLevel: config.logging.level,
        storageDir: config.storage.documentsPath
      }
    });

    // Create and start MCP server
    const mcpServer = new DevDocsMCPServer(config, logger);
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('mcp-server', 'Received SIGINT, shutting down gracefully');
      await mcpServer.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('mcp-server', 'Received SIGTERM, shutting down gracefully');
      await mcpServer.stop();
      process.exit(0);
    });

    // Start the server
    await mcpServer.start();
    
  } catch (error) {
    process.stderr.write(`Failed to start server: ${error}\n`);
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  process.stderr.write(`Unhandled Rejection at: ${promise}, reason: ${reason}\n`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  process.stderr.write(`Uncaught Exception: ${error}\n`);
  process.exit(1);
});

main();
