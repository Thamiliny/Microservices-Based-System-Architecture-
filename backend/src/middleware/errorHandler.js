import { ApiError } from '../utils/ApiError.js';
import { config } from '../config/env.js';

/** 404 handler for unmatched routes. */
export function notFound(req, _res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} does not exist`));
}

/** Central error handler - every error response has the same shape. */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;

  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error('[error]', err);
  }

  res.status(status).json({
    success: false,
    error: {
      message: status >= 500 && config.env === 'production'
        ? 'Internal server error'
        : err.message,
      ...(err.details ? { details: err.details } : {})
    }
  });
}
