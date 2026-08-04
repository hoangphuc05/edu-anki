import { Router } from 'express';
import { cardUpdateSchema } from 'shared-types';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validate.js';
import { NotFoundError } from '../utils/errors.js';
import * as cardService from '../services/cardService.js';

const router = Router();

router.use(authMiddleware);

// GET /api/cards/:cardId
router.get('/:cardId', async (req, res, next) => {
  try {
    const card = await cardService.getCardForUser(req.params.cardId, req.user.sub);
    return res.status(200).json({ card });
  } catch (err) {
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: 'NotFoundError', message: err.message });
    }
    return next(err);
  }
});

// PUT /api/cards/:cardId
router.put('/:cardId', validateBody(cardUpdateSchema), async (req, res, next) => {
  try {
    const card = await cardService.updateCard(req.params.cardId, req.user.sub, req.validatedBody);
    return res.status(200).json({ card });
  } catch (err) {
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: 'NotFoundError', message: err.message });
    }
    return next(err);
  }
});

// DELETE /api/cards/:cardId
router.delete('/:cardId', async (req, res, next) => {
  try {
    await cardService.deleteCard(req.params.cardId, req.user.sub);
    return res.status(200).json({ message: 'Card deleted successfully' });
  } catch (err) {
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: 'NotFoundError', message: err.message });
    }
    return next(err);
  }
});

export default router;
