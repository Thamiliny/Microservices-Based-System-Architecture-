import { z } from 'zod';

export const createMenuItemSchema = z.object({
  name: z.string().min(2).max(150),
  description: z.string().max(1000).optional(),
  price: z.coerce.number().min(0),
  category: z.string().min(2).max(80).default('Main'),
  imageUrl: z.string().url().max(500).optional(),
  isAvailable: z.boolean().default(true)
});

export const updateMenuItemSchema = createMenuItemSchema.partial();
