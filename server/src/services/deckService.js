import { getPrismaClient } from '../db.js';
import { NotFoundError } from '../utils/errors.js';

/**
 * Shape a Deck record for API responses.
 * @param {object} deck
 */
function toPublicDeck(deck) {
  return {
    id: deck.id,
    title: deck.title,
    description: deck.description,
    userId: deck.userId,
    createdAt: deck.createdAt,
  };
}

/**
 * List all decks owned by a user.
 * @param {string} userId
 */
export async function listDecksForUser(userId) {
  const prisma = getPrismaClient();
  const decks = await prisma.deck.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return decks.map(toPublicDeck);
}

/**
 * Fetch a single deck owned by a user, optionally including its cards.
 * Throws NotFoundError if the deck does not exist or is not owned by userId.
 *
 * @param {string} deckId
 * @param {string} userId
 * @param {{ includeCards?: boolean }} [options]
 */
export async function getDeckForUser(deckId, userId, { includeCards = false } = {}) {
  const prisma = getPrismaClient();
  const deck = await prisma.deck.findUnique({
    where: { id: deckId },
    include: includeCards ? { cards: { orderBy: { createdAt: 'asc' } } } : undefined,
  });

  if (!deck || deck.userId !== userId) {
    throw new NotFoundError('Deck not found');
  }

  if (includeCards) {
    return { ...toPublicDeck(deck), cards: deck.cards };
  }
  return toPublicDeck(deck);
}

/**
 * Create a new deck for a user.
 * @param {string} userId
 * @param {{ title: string, description?: string | null }} data
 */
export async function createDeck(userId, data) {
  const prisma = getPrismaClient();
  const deck = await prisma.deck.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      userId,
    },
  });
  return toPublicDeck(deck);
}

/**
 * Update a deck owned by a user. Throws NotFoundError if not owned/missing.
 * @param {string} deckId
 * @param {string} userId
 * @param {{ title?: string, description?: string | null }} data
 */
export async function updateDeck(deckId, userId, data) {
  const prisma = getPrismaClient();
  await getDeckForUser(deckId, userId);

  const deck = await prisma.deck.update({
    where: { id: deckId },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
    },
  });
  return toPublicDeck(deck);
}

/**
 * Delete a deck owned by a user. Cascades to its cards/reviews via Prisma's
 * `onDelete: Cascade` relations. Throws NotFoundError if not owned/missing.
 * @param {string} deckId
 * @param {string} userId
 */
export async function deleteDeck(deckId, userId) {
  const prisma = getPrismaClient();
  await getDeckForUser(deckId, userId);
  await prisma.deck.delete({ where: { id: deckId } });
}
