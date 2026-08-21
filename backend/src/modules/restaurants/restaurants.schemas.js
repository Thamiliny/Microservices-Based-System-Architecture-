import { z } from 'zod';

export const listQuerySchema = z.object({
  search: z.string().max(120).optional(),
  cuisine: z.string().max(80).optional(),
  openOnly: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});

export const createRestaurantSchema = z.object({
  name: z.string().min(2).max(150),
  description: z.string().max(1000).optional(),
  cuisine: z.string().min(2).max(80),
  address: z.string().min(4).max(500),
  phone: z.string().max(30).optional(),
  imageUrl: z.string().url().max(500).optional(),
  deliveryFee: z.coerce.number().min(0).default(0),
  isOpen: z.boolean().default(true)
});

export const updateRestaurantSchema = createRestaurantSchema.partial();

export const idParamSchema = z.object({ id: z.coerce.number().int().positive() });
