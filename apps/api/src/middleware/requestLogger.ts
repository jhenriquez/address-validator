import {LoggerFactory} from "@address-validator/core";
import { v4 } from 'uuid';
import {RequestHandler} from "express";

const logger = LoggerFactory.create({ app: 'api', component: 'request-logger' });

const requestLogger: RequestHandler = (req, res, next) => {
  const requestStartTime = process.hrtime.bigint();
  const requestId = v4();

  logger.info(`Incoming request`, {
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - requestStartTime) / 1_000_000;
    logger.info(`Handled request`, {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: durationMs.toFixed(2),
    });
  })

  next();
};

export default requestLogger;
