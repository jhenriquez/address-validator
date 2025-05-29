import {WinstonLogger} from "./adapters/WinstonLogger";

export class LoggerFactory {
  static create(context?: Record<string, unknown>) {
    return new WinstonLogger(context);
  }
}
