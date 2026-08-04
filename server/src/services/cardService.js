import { getPrismaClient, serializeTags, parseTags } from '../db.js';
import { NotFoundError } from '../utils/errors.js';
import { getDeckForUser } from './deckService.js';

/**
 * Shape a Card record for API responses.
 * @param {object} card
 */
function toPublicCard(card) {
  return {
    id: card.id,
    deckId: card.deckId,
    question: card.question,
    answer: card.answer,
    tags: parseTags(card.tags),
    createdAt: card.createdAt,
  };
}

/**
 * List all cards in a deck owned by a user. Throws NotFoundError if the
 * deck does not exist or is not owned by userId.
 * @param {string} deckId
 * @param {string} userId
 */
export async function listCardsForDeck(deckId, userId) {
  await getDeckForUser(deckId, userId);
  const prisma = getPrismaClient();
  const cards = await prisma.card.findMany({
    where: { deckId },
    orderBy: { createdAt: 'asc' },
  });
  return cards.map(toPublicCard);
}

/**
 * Fetch a single card, verifying it belongs to a deck owned by userId.
 * Throws NotFoundError if the card does not exist or is not owned.
 * @param {string} cardId
 * @param {string} userId
 */
export async function getCardForUser(cardId, userId) {
  const prisma = getPrismaClient();
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { deck: true },
  });

  if (!card || card.deck.userId !== userId) {
    throw new NotFoundError('Card not found');
  }

  return toPublicCard(card);
}

/**
 * Create a new card in a deck owned by userId.
 * @param {string} deckId
 * @param {string} userId
 * @param {{ question: string, answer: string, tags?: string[] }} data
 */
export async function createCard(deckId, userId, data) {
  await getDeckForUser(deckId, userId);
  const prisma = getPrismaClient();
  const card = await prisma.card.create({
    data: {
      deckId,
      question: data.question,
      answer: data.answer,
      tags: serializeTags(data.tags ?? []),
    },
  });
  return toPublicCard(card);
}

/**
 * Update a card, verifying ownership via its deck. Throws NotFoundError if
 * the card does not exist or is not owned by userId.
 * @param {string} cardId
 * @param {string} userId
 * @param {{ question?: string, answer?: string, tags?: string[] }} data
 */
export async function updateCard(cardId, userId, data) {
  const prisma = getPrismaClient();
  const existing = await prisma.card.findUnique({ where: { id: cardId }, include: { deck: true } });
  if (!existing || existing.deck.userId !== userId) {
    throw new NotFoundError('Card not found');
  }

  const card = await prisma.card.update({
    where: { id: cardId },
    data: {
      ...(data.question !== undefined ? { question: data.question } : {}),
      ...(data.answer !== undefined ? { answer: data.answer } : {}),
      ...(data.tags !== undefined ? { tags: serializeTags(data.tags) } : {}),
    },
  });
  return toPublicCard(card);
}

/**
 * Delete a card, verifying ownership via its deck. Throws NotFoundError if
 * the card does not exist or is not owned by userId.
 * @param {string} cardId
 * @param {string} userId
 */
export async function deleteCard(cardId, userId) {
  const prisma = getPrismaClient();
  const existing = await prisma.card.findUnique({ where: { id: cardId }, include: { deck: true } });
  if (!existing || existing.deck.userId !== userId) {
    throw new NotFoundError('Card not found');
  }

  await prisma.card.delete({ where: { id: cardId } });
}
