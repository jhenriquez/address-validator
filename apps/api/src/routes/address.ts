import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ValidateAddressHandler, ValidateAddressRequest } from '@address-parser/core';
import { validate } from '../middleware/validate';
import { AppResponse } from '../utils';
import asyncHandler from "../utils/asyncHandler";

const addressRouter: Router = Router();

const validateAddressSchema = z.object({
  address: z.string({
    required_error: "Address is required",
    invalid_type_error: "Address must be a string",
  }).min(1, "Address cannot be empty"),
});

addressRouter.post(
  '/validate',
  validate({ body: validateAddressSchema }),
  asyncHandler(
    async (req: Request, res: Response) => {
      try {
        const handler = new ValidateAddressHandler();
        const request = new ValidateAddressRequest(req.body.address);

        const result = await handler.handle(request);

        res.status(200).json(AppResponse.success(result));
      } catch (error) {
        res.status(500).json(
          AppResponse.fromError(
            'Failed to validate address',
            'InternalServerError',
            { message: error instanceof Error ? error.message : 'Unknown error' }
          )
        );
      }
    }
  ),
);

export default addressRouter;
