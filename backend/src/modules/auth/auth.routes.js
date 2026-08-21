import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as controller from './auth.controller.js';
import { loginSchema, registerSchema } from './auth.schemas.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

/** Tighter limit on credential endpoints to slow down brute-force attempts. */
const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: 'Too many attempts, please try again later' } }
});

router.post('/register', credentialLimiter, validate(registerSchema), asyncHandler(controller.register));
router.post('/login', credentialLimiter, validate(loginSchema), asyncHandler(controller.login));
router.get('/me', authenticate, asyncHandler(controller.me));

export default router;
