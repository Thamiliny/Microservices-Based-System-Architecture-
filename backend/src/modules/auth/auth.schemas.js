import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters').max(120),
  email: z.string().email('A valid email address is required').max(180),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
  phone: z.string().max(30).optional(),
  address: z.string().max(500).optional(),
  role: z.enum(['customer', 'owner']).default('customer')
});

export const loginSchema = z.object({
  email: z.string().email('A valid email address is required'),
  password: z.string().min(1, 'Password is required')
});
