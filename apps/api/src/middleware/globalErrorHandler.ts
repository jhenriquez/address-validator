import {ErrorRequestHandler, NextFunction} from "express";
import {AppResponse} from "../utils";

const globalErrorHandler: ErrorRequestHandler = (_, __, res, next: NextFunction) => {
  res.status(500).json(
    AppResponse.fromError('An unexpected error occurred', 'InternalServerError')
  );
};

export default globalErrorHandler;
