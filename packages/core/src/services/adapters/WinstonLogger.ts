import { createLogger, format, transports } from 'winston';
import { ILogger } from '../ILogger';

export class WinstonLogger implements ILogger {
  private logger;

  constructor(context?: Record<string, unknown>) {
    this.logger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      ),
      defaultMeta: context ? { ...context } : {},
      transports: [new transports.Console()],
    });
  }

  info(message: string, meta: Record<string, unknown> = {}): void {
    this.logger.info(message, meta);
  }

  warn(message: string, meta: Record<string, unknown> = {}): void {
    this.logger.warn(message, meta);
  }

  error(message: string, meta: Record<string, unknown> = {}): void {
    this.logger.error(message, meta);
  }
}
