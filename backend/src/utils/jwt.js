import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

/** Signs an access token containing the user id, email and role. */
export function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret);
}
