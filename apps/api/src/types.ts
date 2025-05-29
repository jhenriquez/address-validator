export type ErrorType =
  | 'BadRequest'
  | 'NotFound'
  | 'Unauthorized'
  | 'Forbidden'
  | 'InternalServerError'
  | 'Conflict'
  | 'Validation';

export interface AppError {
  message: string;
  type: ErrorType;
  details?: Record<string, unknown>;
}
