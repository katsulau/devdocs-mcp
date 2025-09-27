import { LogEntry, ServerConfig } from '../types/index.js';

export class Logger {
  private config: ServerConfig['logging'];
  
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
}
