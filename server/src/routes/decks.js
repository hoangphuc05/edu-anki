import { Router } from 'express';
import { deckCreateSchema, deckUpdateSchema, cardCreateSchema } from 'shared-types';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validate.js';
import { NotFoundError } from '../utils/errors.js';
import * as deckService from '../services/deckService.js';
import * as cardService from '../services/cardService.js';

const router = Router();

router.use(authMiddleware);

// GET /api/decks
router.get('/', async (req, res, next) => {
  try {
    const decks = await deckService.listDecksForUser(req.user.sub);
    return res.status(200).json({ decks });
  } catch (err) {
    return next(err);
  }
});

// POST /api/decks
router.post('/', validateBody(deckCreateSchema), async (req, res, next) => {
  try {
    const deck = await deckService.createDeck(req.user.sub, req.validatedBody);
    return res.status(201).json({ deck });
  } catch (err) {
    return next(err);
  }
});

// GET /api/decks/:deckId
router.get('/:deckId', async (req, res, next) => {
  try {
    const deck = await deckService.getDeckForUser(req.params.deckId, req.user.sub, { includeCards: true });
    return res.status(200).json({ deck });
  } catch (err) {
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: 'NotFoundError', message: err.message });
    }
    return next(err);
  }
});

// PUT /api/decks/:deckId
router.put('/:deckId', validateBody(deckUpdateSchema), async (req, res, next) => {
  try {
    const deck = await deckService.updateDeck(req.params.deckId, req.user.sub, req.validatedBody);
    return res.status(200).json({ deck });
  } catch (err) {
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: 'NotFoundError', message: err.message });
    }
    return next(err);
  }
});

// DELETE /api/decks/:deckId
router.delete('/:deckId', async (req, res, next) => {
  try {
    await deckService.deleteDeck(req.params.deckId, req.user.sub);
    return res.status(200).json({ message: 'Deck deleted successfully' });
  } catch (err) {
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: 'NotFoundError', message: err.message });
    }
    return next(err);
  }
});

// GET /api/decks/:deckId/cards
router.get('/:deckId/cards', async (req, res, next) => {
  try {
    const cards = await cardService.listCardsForDeck(req.params.deckId, req.user.sub);
    return res.status(200).json({ cards });
  } catch (err) {
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: 'NotFoundError', message: err.message });
    }
    return next(err);
  }
});

// POST /api/decks/:deckId/cards
router.post('/:deckId/cards', validateBody(cardCreateSchema), async (req, res, next) => {
  try {
    const card = await cardService.createCard(req.params.deckId, req.user.sub, req.validatedBody);
    return res.status(201).json({ card });
  } catch (err) {
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: 'NotFoundError', message: err.message });
    }
    return next(err);
  }
});

export default router;
