/**
 * Minimal logging abstraction for structured JSON logs.
 */
export interface ILogger {
  /** Informational event */
  info(message: string, meta?: Record<string, unknown>): void;
  /** Warning event */
  warn(message: string, meta?: Record<string, unknown>): void;
  /** Error event */
  error(message: string, meta?: Record<string, unknown>): void;
}
