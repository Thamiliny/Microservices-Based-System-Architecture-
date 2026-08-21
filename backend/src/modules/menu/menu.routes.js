import { Router } from 'express';
import * as service from './menu.service.js';
import * as restaurantService from '../restaurants/restaurants.service.js';
import { updateMenuItemSchema } from './menu.schemas.js';
import { idParamSchema } from '../restaurants/restaurants.schemas.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.get('/:id', validate(idParamSchema, 'params'), asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.getById(req.params.id) });
}));

router.put('/:id',
  authenticate, authorize('owner', 'admin'),
  validate(idParamSchema, 'params'), validate(updateMenuItemSchema),
  asyncHandler(async (req, res) => {
    const item = await service.getById(req.params.id);
    await restaurantService.assertCanManage(item.restaurant_id, req.user);
    res.json({ success: true, data: await service.update(req.params.id, req.body) });
  }));

router.delete('/:id',
  authenticate, authorize('owner', 'admin'),
  validate(idParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    const item = await service.getById(req.params.id);
    await restaurantService.assertCanManage(item.restaurant_id, req.user);
    await service.remove(req.params.id);
    res.status(204).send();
  }));

export default router;
