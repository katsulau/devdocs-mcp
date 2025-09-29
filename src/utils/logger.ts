import { LogEntry, ServerConfig } from '../types/index.js';

export class Logger {
  private config: ServerConfig['logging'];
  // In-memory ring buffer for recent logs to help with debugging in environments
  // where stderr isn't easily inspectable (e.g., docker exec child processes)
  private recentLogs: LogEntry[] = [];
  private maxBufferedEntries = 500;
  
  constructor(config: ServerConfig['logging']) {
    this.config = config;
  }

  private createLogEntry(
    level: LogEntry['level'],
    component: LogEntry['component'],
    message: string,
    metadata?: Record<string, any>
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      ...(metadata && { metadata })
    };
  }

  private shouldLog(level: LogEntry['level']): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const logLevelIndex = levels.indexOf(level);
    return logLevelIndex >= currentLevelIndex;
  }

  private formatLog(entry: LogEntry): string {
    if (this.config.format === 'json') {
      return JSON.stringify(entry);
    } else {
      const { timestamp, level, component, message, metadata } = entry;
      const metaStr = metadata ? ` ${JSON.stringify(metadata)}` : '';
      return `[${timestamp}] ${level.toUpperCase()} [${component}] ${message}${metaStr}`;
    }
  }

  private log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    // Store in-memory (bounded) for later retrieval via MCP tool
    this.recentLogs.push(entry);
    if (this.recentLogs.length > this.maxBufferedEntries) {
      this.recentLogs.splice(0, this.recentLogs.length - this.maxBufferedEntries);
    }

    const formatted = this.formatLog(entry);
    
    // Write to stderr to avoid interfering with MCP stdio communication
    process.stderr.write(formatted + '\n');
  }

  debug(component: LogEntry['component'], message: string, metadata?: Record<string, any>): void {
    this.log(this.createLogEntry('debug', component, message, metadata));
  }

  info(component: LogEntry['component'], message: string, metadata?: Record<string, any>): void {
    this.log(this.createLogEntry('info', component, message, metadata));
  }

  warn(component: LogEntry['component'], message: string, metadata?: Record<string, any>): void {
    this.log(this.createLogEntry('warn', component, message, metadata));
  }

  error(component: LogEntry['component'], message: string, metadata?: Record<string, any>): void {
    this.log(this.createLogEntry('error', component, message, metadata));
  }

  /**
   * Return recent log entries (most recent last). If limit is provided,
   * return only the last `limit` entries.
   */
  getRecentLogs(limit?: number): LogEntry[] {
    if (!limit || limit <= 0 || limit >= this.recentLogs.length) {
      return [...this.recentLogs];
    }
    return this.recentLogs.slice(this.recentLogs.length - limit);
  }
}
