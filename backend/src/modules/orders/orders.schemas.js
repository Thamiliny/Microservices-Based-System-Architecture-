import { z } from 'zod';

export const createOrderSchema = z.object({
  restaurantId: z.coerce.number().int().positive(),
  items: z.array(z.object({
    menuItemId: z.coerce.number().int().positive(),
    quantity: z.coerce.number().int().min(1).max(50)
  })).min(1, 'An order must contain at least one item'),
  deliveryAddress: z.string().min(5, 'Delivery address is required').max(500),
  contactPhone: z.string().max(30).optional(),
  paymentMethod: z.enum(['CASH_ON_DELIVERY', 'CARD']).default('CASH_ON_DELIVERY'),
  notes: z.string().max(500).optional()
});

export const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'])
});
