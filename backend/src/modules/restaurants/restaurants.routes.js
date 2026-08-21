import { Router } from 'express';
import * as service from './restaurants.service.js';
import * as menuService from '../menu/menu.service.js';
import * as orderService from '../orders/orders.service.js';
import {
  createRestaurantSchema, updateRestaurantSchema, listQuerySchema, idParamSchema
} from './restaurants.schemas.js';
import { createMenuItemSchema } from '../menu/menu.schemas.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

/* ----------------------------- public reads ----------------------------- */

router.get('/', validate(listQuerySchema, 'query'), asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.list(req.query) });
}));

router.get('/cuisines', asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await service.cuisines() });
}));

router.get('/:id', validate(idParamSchema, 'params'), asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.getById(req.params.id) });
}));

router.get('/:id/menu', validate(idParamSchema, 'params'), asyncHandler(async (req, res) => {
  await service.getById(req.params.id); // 404 when the restaurant does not exist
  const items = await menuService.listByRestaurant(req.params.id, {
    availableOnly: req.query.availableOnly === 'true'
  });
  res.json({ success: true, data: items });
}));

/* --------------------------- owner / admin ------------------------------ */

router.post('/',
  authenticate, authorize('owner', 'admin'),
  validate(createRestaurantSchema),
  asyncHandler(async (req, res) => {
    const restaurant = await service.create(req.body, req.user.id);
    res.status(201).json({ success: true, data: restaurant });
  }));

router.put('/:id',
  authenticate, authorize('owner', 'admin'),
  validate(idParamSchema, 'params'), validate(updateRestaurantSchema),
  asyncHandler(async (req, res) => {
    await service.assertCanManage(req.params.id, req.user);
    res.json({ success: true, data: await service.update(req.params.id, req.body) });
  }));

router.delete('/:id',
  authenticate, authorize('owner', 'admin'),
  validate(idParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    await service.assertCanManage(req.params.id, req.user);
    await service.remove(req.params.id);
    res.status(204).send();
  }));

router.post('/:id/menu',
  authenticate, authorize('owner', 'admin'),
  validate(idParamSchema, 'params'), validate(createMenuItemSchema),
  asyncHandler(async (req, res) => {
    await service.assertCanManage(req.params.id, req.user);
    const item = await menuService.create(req.params.id, req.body);
    res.status(201).json({ success: true, data: item });
  }));

/** Orders received by one restaurant - powers the owner dashboard. */
router.get('/:id/orders',
  authenticate, authorize('owner', 'admin'),
  validate(idParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    await service.assertCanManage(req.params.id, req.user);
    res.json({ success: true, data: await orderService.listByRestaurant(req.params.id) });
  }));

export default router;
