import { getPrismaClient, serializeFsrsState, parseFsrsState } from '../db.js';
import { NotFoundError } from '../utils/errors.js';
import { createSrsEngine } from 'srs-engine';

const srsEngine = createSrsEngine();

/**
 * Shape a Card record for study responses. Unlike the CRUD card shape, this
 * includes the scheduling fields the study UI needs (nextReview, lastReview,
 * fsrsState) so a client can render and schedule the card without extra calls.
 * @param {object} card
 */
function toStudyCard(card) {
  return {
    id: card.id,
    deckId: card.deckId,
    question: card.question,
    answer: card.answer,
    tags: parseTagsSafe(card.tags),
    fsrsState: parseFsrsState(card.fsrsState),
    nextReview: card.nextReview,
    lastReview: card.lastReview,
    createdAt: card.createdAt,
  };
}

function parseTagsSafe(tags) {
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Build the Prisma `where` clause scoping due cards to a user (and optionally
 * a single deck). Cards are due when they have never been reviewed
 * (`nextReview` is null) or their next review is at or before `now`.
 * @param {string} userId
 * @param {{ deckId?: string, now?: Date }} [options]
 */
function dueWhere(userId, { deckId, now = new Date() } = {}) {
  return {
    deck: { userId },
    ...(deckId ? { deckId } : {}),
    OR: [{ nextReview: null }, { nextReview: { lte: now } }],
  };
}

/**
 * Fetch the due cards for a user, optionally scoped to a single deck.
 *
 * New cards (never reviewed) sort first, then cards by earliest due date, so
 * the most urgent card is always first. `limit` bounds the result set to keep
 * responses fast on large decks.
 *
 * @param {string} userId
 * @param {{ deckId?: string, limit?: number, now?: Date }} [options]
 * @returns {Promise<object[]>} Public study-card shapes.
 */
export async function getDueCards(userId, { deckId, limit = 50, now = new Date() } = {}) {
  const prisma = getPrismaClient();
  const cards = await prisma.card.findMany({
    where: dueWhere(userId, { deckId, now }),
    orderBy: { nextReview: 'asc' },
    take: limit,
  });
  return cards.map(toStudyCard);
}

/**
 * Fetch the single next due card for a user (or within a deck). Returns `null`
 * when there is nothing due.
 *
 * @param {string} userId
 * @param {{ deckId?: string, now?: Date }} [options]
 * @returns {Promise<object|null>}
 */
export async function getNextDueCard(userId, { deckId, now = new Date() } = {}) {
  const prisma = getPrismaClient();
  const card = await prisma.card.findFirst({
    where: dueWhere(userId, { deckId, now }),
    orderBy: { nextReview: 'asc' },
  });
  return card ? toStudyCard(card) : null;
}

/**
 * Load a card and verify it belongs to a deck owned by `userId`. Throws
 * NotFoundError if the card does not exist or is not owned by the user.
 * @param {string} cardId
 * @param {string} userId
 */
async function getOwnedCard(cardId, userId) {
  const prisma = getPrismaClient();
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { deck: true },
  });
  if (!card || card.deck.userId !== userId) {
    throw new NotFoundError('Card not found');
  }
  return card;
}

/**
 * Detect whether an error is a transient SQLite lock/busy error that is safe
 * to retry. Prisma/better-sqlite3 surface these as codes like `SQLITE_BUSY`,
 * `SQLITE_LOCKED`, or `P2034` (transaction conflict).
 * @param {Error} err
 * @returns {boolean}
 */
function isTransientLockError(err) {
  const code = err?.code ?? '';
  const message = err?.message ?? '';
  return (
    code === 'SQLITE_BUSY' ||
    code === 'SQLITE_LOCKED' ||
    code === 'P2034' ||
    /SQLITE_BUSY|SQLITE_LOCKED|database is locked|database table is locked/i.test(message)
  );
}

/**
 * Run `fn` with retry/backoff for transient SQLite lock errors. This keeps
 * rapid sequential reviews from failing when the WAL database is briefly
 * locked by a concurrent write.
 *
 * @template T
 * @param {() => Promise<T>} fn
 * @param {{ retries?: number, baseDelayMs?: number }} [options]
 * @returns {Promise<T>}
 */
async function withRetry(fn, { retries = 3, baseDelayMs = 25 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!isTransientLockError(err) || attempt === retries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, baseDelayMs * (attempt + 1)));
    }
  }
  throw lastError;
}

/**
 * Process a card review: compute the new FSRS schedule, atomically update the
 * card's state and create a Review record inside a single database
 * transaction, then return the next due card.
 *
 * The transaction guarantees that the card state update and the review history
 * insert either both commit or both roll back, so a failure mid-write can never
 * leave the card's schedule out of sync with its history.
 *
 * @param {string} userId
 * @param {{ cardId: string, rating: 'again'|'hard'|'medium'|'easy', duration?: number }} data
 * @param {{ now?: Date }} [options]
 * @returns {Promise<{ card: object|null, review: object }>} The next due card
 *   (or null when nothing is due) plus the created review.
 */
export async function submitReview(userId, data, { now = new Date() } = {}) {
  const prisma = getPrismaClient();
  const card = await getOwnedCard(data.cardId, userId);

  // Pure scheduling computation — no DB side effects.
  const result = srsEngine.scheduleReview(
    {
      id: card.id,
      nextReview: card.nextReview,
      lastReview: card.lastReview,
      fsrsState: parseFsrsState(card.fsrsState),
    },
    data.rating,
    now
  );

  const review = await withRetry(() =>
    prisma.$transaction(async (tx) => {
      const updated = await tx.card.update({
        where: { id: card.id },
        data: {
          fsrsState: serializeFsrsState(result.fsrsState),
          nextReview: result.nextReview,
          lastReview: result.lastReview,
        },
      });

      const created = await tx.review.create({
        data: {
          cardId: card.id,
          rating: mapRatingToStored(data.rating),
          duration: data.duration ?? null,
        },
      });

      return { updated, created };
    })
  );

  const nextCard = await getNextDueCard(userId, { now });

  return {
    card: nextCard,
    review: {
      id: review.created.id,
      cardId: review.created.cardId,
      rating: review.created.rating,
      duration: review.created.duration,
      createdAt: review.created.createdAt,
    },
  };
}

/**
 * Map a UI rating to the integer stored on the Review record. This mirrors the
 * FSRS 1-4 scale used by the scheduler (again=1, hard=2, medium=3, easy=4).
 * @param {string} uiRating
 * @returns {number}
 */
function mapRatingToStored(uiRating) {
  const map = { again: 1, hard: 2, medium: 3, easy: 4 };
  return map[uiRating];
}
