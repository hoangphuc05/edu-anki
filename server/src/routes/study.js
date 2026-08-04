import { Router } from 'express';
import { reviewSchema } from 'shared-types';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validate.js';
import { NotFoundError } from '../utils/errors.js';
import * as studyService from '../services/studyService.js';

const router = Router();

router.use(authMiddleware);

// GET /api/study/due?deckId=<id>&limit=<n>
router.get('/due', async (req, res, next) => {
  try {
    const deckId = typeof req.query.deckId === 'string' && req.query.deckId ? req.query.deckId : undefined;
    const limit = req.query.limit !== undefined ? Number(req.query.limit) : 50;
    const cards = await studyService.getDueCards(req.user.sub, {
      deckId,
      limit: Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 500) : 50,
    });
    return res.status(200).json({ cards });
  } catch (err) {
    return next(err);
  }
});

// POST /api/study/review
router.post('/review', validateBody(reviewSchema), async (req, res, next) => {
  try {
    const result = await studyService.submitReview(req.user.sub, req.validatedBody);
    return res.status(200).json({ card: result.card, review: result.review });
  } catch (err) {
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: 'NotFoundError', message: err.message });
    }
    return next(err);
  }
});

export default router;
