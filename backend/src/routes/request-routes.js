import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate.js';
import { requestService } from '../services/request-service.js';

const requestSchema = z.object({
  department: z.string().trim().min(2).max(160),
  positionTitle: z.string().trim().min(2).max(160),
  reason: z.string().trim().min(10).max(4000),
  requiredBy: z.union([z.literal(''), z.iso.date()]).optional().transform((value) => value || null),
});

export function createRequestRouter() {
  const router = Router();
  router.use(authenticate);

  router.get('/dashboard', async (req, res, next) => {
    try {
      return res.json(await requestService.getDashboard());
    } catch (error) {
      return next(error);
    }
  });

  router.post('/requests', async (req, res, next) => {
    try {
      const input = requestSchema.parse(req.body);
      const request = await requestService.create(input, req.user.id);
      return res.status(201).json({ request });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
