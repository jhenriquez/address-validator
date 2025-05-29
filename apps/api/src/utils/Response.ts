import { AppError } from '../types';

export class Response<T> {
  value?: T;
  errors: AppError[];

  private constructor(value?: T, errors: AppError[] = []) {
    this.value = value;
    this.errors = errors;
  }

  static success<T>(value: T): Response<T> {
    return new Response<T>(value);
  }

  static error<T = undefined>(...errors: AppError[]): Response<T> {
    return new Response<T>(undefined, errors);
  }

  static fromError<T = undefined>(message: string, type: AppError['type'], details?: Record<string, unknown>): Response<T> {
    return new Response<T>(undefined, [
      {
        message,
        type,
        ...(details ? { details } : {})
      }
    ]);
  }
}
