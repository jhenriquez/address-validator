/**
 * Minimal logging abstraction for structured JSON logs.
 */
export interface ILogger {
  /** Informational event */
  info(message: string, meta?: Record<string, any>): void;
  /** Warning event */
  warn(message: string, meta?: Record<string, any>): void;
  /** Error event */
  error(message: string, meta?: Record<string, any>): void;
}
