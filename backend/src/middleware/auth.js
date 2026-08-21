import { ApiError } from '../utils/ApiError.js';
import { verifyToken } from '../utils/jwt.js';

/**
 * Validates the `Authorization: Bearer <token>` header and attaches the
 * decoded principal to `req.user`.
 */
export function authenticate(req, _res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(ApiError.unauthorized('Missing or malformed Authorization header'));
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    return next();
  } catch {
    return next(ApiError.unauthorized('Invalid or expired token'));
  }
}

/** Restricts a route to the given roles. Must run after `authenticate`. */
export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Requires role: ${roles.join(' or ')}`));
    }
    return next();
  };
}
