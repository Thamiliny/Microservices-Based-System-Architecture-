import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { config } from './config/env.js';
import healthRoutes from './modules/health/health.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/users.routes.js';
import restaurantRoutes from './modules/restaurants/restaurants.routes.js';
import menuRoutes from './modules/menu/menu.routes.js';
import orderRoutes from './modules/orders/orders.routes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

/** Builds the Express application (exported separately so tests can import it). */
export function createApp() {
  const app = express();

  // Behind the nginx reverse proxy, so rate limiting sees the real client IP.
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  if (config.env !== 'test') app.use(morgan('combined'));

  app.use(rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false
  }));

  // ---- API surface -------------------------------------------------------
  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/restaurants', restaurantRoutes);
  app.use('/api/menu', menuRoutes);
  app.use('/api/orders', orderRoutes);

  /** Simple index describing the API, handy when opening the port directly. */
  app.get('/', (_req, res) => {
    res.json({
      success: true,
      data: {
        service: 'Food Delivery System API',
        version: '1.0.0',
        documentation: '/api/health',
        endpoints: [
          'GET    /api/health',
          'GET    /api/health/db',
          'POST   /api/auth/register',
          'POST   /api/auth/login',
          'GET    /api/auth/me',
          'PUT    /api/users/me',
          'GET    /api/users            (admin)',
          'GET    /api/restaurants',
          'GET    /api/restaurants/cuisines',
          'GET    /api/restaurants/:id',
          'GET    /api/restaurants/:id/menu',
          'POST   /api/restaurants      (owner/admin)',
          'PUT    /api/restaurants/:id  (owner/admin)',
          'DELETE /api/restaurants/:id  (owner/admin)',
          'POST   /api/restaurants/:id/menu   (owner/admin)',
          'GET    /api/restaurants/:id/orders (owner/admin)',
          'GET    /api/menu/:id',
          'PUT    /api/menu/:id         (owner/admin)',
          'DELETE /api/menu/:id         (owner/admin)',
          'POST   /api/orders',
          'GET    /api/orders',
          'GET    /api/orders/:id',
          'PATCH  /api/orders/:id/status (owner/admin)'
        ]
      }
    });
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
