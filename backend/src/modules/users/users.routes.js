import { Router } from 'express';
import { z } from 'zod';
import { query } from '../../config/db.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';

const router = Router();

const updateProfileSchema = z.object({
  fullName: z.string().min(3).max(120).optional(),
  phone: z.string().max(30).nullable().optional(),
  address: z.string().max(500).nullable().optional()
});

/** Updates the signed-in user's own profile. */
router.put('/me', authenticate, validate(updateProfileSchema), asyncHandler(async (req, res) => {
  const { fullName, phone, address } = req.body;
  const { rows } = await query(
    `UPDATE users
        SET full_name = COALESCE($1, full_name),
            phone     = COALESCE($2, phone),
            address   = COALESCE($3, address)
      WHERE id = $4
      RETURNING id, full_name, email, phone, address, role, created_at`,
    [fullName ?? null, phone ?? null, address ?? null, req.user.id]
  );
  if (rows.length === 0) throw ApiError.notFound('User not found');
  res.json({ success: true, data: rows[0] });
}));

/** Administrative listing of all accounts. */
router.get('/', authenticate, authorize('admin'), asyncHandler(async (_req, res) => {
  const { rows } = await query(
    `SELECT id, full_name, email, phone, role, created_at
       FROM users ORDER BY id`
  );
  res.json({ success: true, data: rows });
}));

export default router;
