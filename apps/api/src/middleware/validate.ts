import { ZodSchema, ZodError } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { AppResponse as ApiResponse } from '../utils/AppResponse';

type ValidatorConfig = {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
};

export function validate(schemas: ValidatorConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) req.query = schemas.query.parse(req.query);
      if (schemas.params) req.params = schemas.params.parse(req.params);
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json(
          ApiResponse.fromError(
            'Validation failed',
            'Validation',
            {
              issues: err.errors.map(e => ({
                path: e.path.join('.'),
                message: e.message
              }))
            }
          )
        );
      }
    }
  };
}
