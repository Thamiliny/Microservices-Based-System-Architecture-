import { ApiError } from '../utils/ApiError.js';

/**
 * Validates `req[source]` against a zod schema and replaces it with the
 * parsed (and coerced) value.
 */
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || source,
      message: issue.message
    }));
    return next(ApiError.badRequest('Validation failed', details));
  }
  req[source] = result.data;
  return next();
};
