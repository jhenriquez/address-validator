import {ErrorRequestHandler, NextFunction} from "express";
import {Response} from "../utils";

const globalErrorHandler: ErrorRequestHandler = (_, __, res, next: NextFunction) => {
  res.status(500).json(
    Response.fromError('An unexpected error occurred', 'InternalServerError')
  );
};

export default globalErrorHandler;
