import dotenv from 'dotenv';

dotenv.config();

/**
 * Reads an environment variable, falling back to a default.
 * Throws when a variable that has no safe default is missing.
 */
function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),

  db: {
    host: required('DB_HOST', 'localhost'),
    port: Number(required('DB_PORT', '5432')),
    name: required('DB_NAME', 'food_delivery'),
    user: required('DB_USER', 'fooddelivery'),
    password: required('DB_PASSWORD', 'fooddelivery_pass'),
    poolMax: Number(process.env.DB_POOL_MAX || 10)
  },

  jwt: {
    secret: required('JWT_SECRET', 'dev-only-insecure-secret'),
    expiresIn: process.env.JWT_EXPIRES_IN || '2h'
  },

  bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 10),
  corsOrigin: process.env.CORS_ORIGIN || '*',

  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    max: Number(process.env.RATE_LIMIT_MAX || 500)
  }
};
