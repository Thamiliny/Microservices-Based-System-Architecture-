import { Router } from 'express';
import * as service from './orders.service.js';
import * as restaurantService from '../restaurants/restaurants.service.js';
import { createOrderSchema, updateStatusSchema } from './orders.schemas.js';
import { idParamSchema } from '../restaurants/restaurants.schemas.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.use(authenticate); // every order route requires a signed-in user

/** Place a new order. */
router.post('/', validate(createOrderSchema), asyncHandler(async (req, res) => {
  const order = await service.create(req.user.id, req.body);
  res.status(201).json({ success: true, data: order });
}));

/** Order history of the signed-in customer. */
router.get('/', asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.listByCustomer(req.user.id) });
}));

/** Single order - visible to its customer, the restaurant owner, or an admin. */
router.get('/:id', validate(idParamSchema, 'params'), asyncHandler(async (req, res) => {
  const order = await service.getById(req.params.id);
  await service.assertCanView(order, req.user);
  res.json({ success: true, data: order });
}));

/** Advance the order through its lifecycle (restaurant owner / admin only). */
router.patch('/:id/status',
  authorize('owner', 'admin'),
  validate(idParamSchema, 'params'), validate(updateStatusSchema),
  asyncHandler(async (req, res) => {
    const order = await service.getById(req.params.id);
    await restaurantService.assertCanManage(order.restaurant_id, req.user);
    res.json({ success: true, data: await service.updateStatus(req.params.id, req.body.status) });
  }));

export default router;
