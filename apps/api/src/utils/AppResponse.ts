import { AppError } from '../types';

export class AppResponse<T> {
  value?: T;
  errors: AppError[];

  private constructor(value?: T, errors: AppError[] = []) {
    this.value = value;
    this.errors = errors;
  }

  static success<T>(value: T): AppResponse<T> {
    return new AppResponse<T>(value);
  }

  static error<T = undefined>(...errors: AppError[]): AppResponse<T> {
    return new AppResponse<T>(undefined, errors);
  }

  static fromError<T = undefined>(message: string, type: AppError['type'], details?: Record<string, unknown>): AppResponse<T> {
    return new AppResponse<T>(undefined, [
      {
        message,
        type,
        ...(details ? { details } : {})
      }
    ]);
  }
}
