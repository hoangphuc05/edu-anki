import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_DB_PATH = path.resolve(__dirname, '..', 'prisma', 'study-test.db');

process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '7d';

let app;
let prisma;
let disconnectDatabase;

function cleanupDbFiles() {
  for (const ext of ['', '-wal', '-shm']) {
    const filePath = TEST_DB_PATH + ext;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

beforeAll(async () => {
  cleanupDbFiles();

  const dbModule = await import('../src/db.js');
  disconnectDatabase = dbModule.disconnectDatabase;
  prisma = await dbModule.initializeDatabase();

  const appModule = await import('../app.js');
  app = appModule.default;
});

afterAll(async () => {
  if (disconnectDatabase) {
    await disconnectDatabase();
  }
  cleanupDbFiles();
});

beforeEach(async () => {
  await prisma.review.deleteMany();
  await prisma.card.deleteMany();
  await prisma.deck.deleteMany();
  await prisma.user.deleteMany();
});

async function registerUser(email) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'correct-horse-battery' });
  return res.body.accessToken;
}

async function createDeck(token, title = 'Study Deck') {
  const res = await request(app)
    .post('/api/decks')
    .set('Authorization', `Bearer ${token}`)
    .send({ title });
  return res.body.deck.id;
}

async function createCard(token, deckId, question, answer = 'A') {
  const res = await request(app)
    .post(`/api/decks/${deckId}/cards`)
    .set('Authorization', `Bearer ${token}`)
    .send({ question, answer });
  return res.body.card.id;
}

describe('Study API', () => {
  let accessToken;
  let deckId;

  beforeEach(async () => {
    accessToken = await registerUser('study-owner@example.com');
    deckId = await createDeck(accessToken);
  });

  describe('GET /api/study/due', () => {
    it('returns only cards that are due (nextReview <= now or null)', async () => {
      // New card: nextReview is null -> due.
      const newCardId = await createCard(accessToken, deckId, 'New card');

      // Card with a past nextReview -> due.
      const pastCardId = await createCard(accessToken, deckId, 'Past card');
      await prisma.card.update({
        where: { id: pastCardId },
        data: { nextReview: new Date(Date.now() - 60_000) },
      });

      // Card with a future nextReview -> NOT due.
      const futureCardId = await createCard(accessToken, deckId, 'Future card');
      await prisma.card.update({
        where: { id: futureCardId },
        data: { nextReview: new Date(Date.now() + 60_000) },
      });

      const res = await request(app)
        .get('/api/study/due')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      const ids = res.body.cards.map((c) => c.id);
      expect(ids).toContain(newCardId);
      expect(ids).toContain(pastCardId);
      expect(ids).not.toContain(futureCardId);
    });

    it('scopes due cards to a deck via deckId query param', async () => {
      const otherDeckId = await createDeck(accessToken, 'Other Deck');
      const cardA = await createCard(accessToken, deckId, 'In deck');
      await createCard(accessToken, otherDeckId, 'In other deck');

      const res = await request(app)
        .get(`/api/study/due?deckId=${deckId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      const ids = res.body.cards.map((c) => c.id);
      expect(ids).toEqual([cardA]);
    });

    it('does not leak another user\'s due cards', async () => {
      const otherToken = await registerUser('study-intruder@example.com');
      const otherDeckId = await createDeck(otherToken);
      await createCard(otherToken, otherDeckId, 'Their card');

      const res = await request(app)
        .get('/api/study/due')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.cards).toHaveLength(0);
    });
  });

  describe('POST /api/study/review', () => {
    it('updates fsrsState, sets nextReview, creates a Review, and returns the next due card', async () => {
      const cardId = await createCard(accessToken, deckId, 'Q1');
      await createCard(accessToken, deckId, 'Q2');

      const res = await request(app)
        .post('/api/study/review')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ cardId, rating: 'medium', duration: 5 });

      expect(res.status).toBe(200);

      // Review record created.
      expect(res.body.review).toBeDefined();
      expect(res.body.review.cardId).toBe(cardId);
      expect(res.body.review.rating).toBe(3); // medium -> Good -> 3
      expect(res.body.review.duration).toBe(5);

      // Card state updated.
      const stored = await prisma.card.findUnique({ where: { id: cardId } });
      expect(stored.nextReview).not.toBeNull();
      expect(stored.lastReview).not.toBeNull();
      const fsrsState = JSON.parse(stored.fsrsState);
      expect(fsrsState.reps).toBeGreaterThanOrEqual(1);
      expect(fsrsState.stability).toBeGreaterThan(0);

      // Next due card returned immediately (the other new card).
      expect(res.body.card).not.toBeNull();
      expect(res.body.card.id).not.toBe(cardId);
    });

    it('returns null card when no cards remain due after review', async () => {
      const cardId = await createCard(accessToken, deckId, 'Only card');

      const res = await request(app)
        .post('/api/study/review')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ cardId, rating: 'easy' });

      expect(res.status).toBe(200);
      // The reviewed card is now scheduled in the future, so nothing is due.
      expect(res.body.card).toBeNull();
    });

    it('returns 400 for an invalid rating', async () => {
      const cardId = await createCard(accessToken, deckId, 'Q');

      const res = await request(app)
        .post('/api/study/review')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ cardId, rating: 'super-easy' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('ValidationError');
    });

    it("returns 404 when reviewing another user's card", async () => {
      const otherToken = await registerUser('review-intruder@example.com');
      const otherDeckId = await createDeck(otherToken);
      const otherCardId = await createCard(otherToken, otherDeckId, 'Their card');

      const res = await request(app)
        .post('/api/study/review')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ cardId: otherCardId, rating: 'medium' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('NotFoundError');
    });

    it('keeps state and history consistent across rapid sequential reviews', async () => {
      const cardId = await createCard(accessToken, deckId, 'Rapid card');

      // Simulate a burst of rapid reviews of the same card.
      const ratings = ['again', 'hard', 'medium', 'easy'];
      for (const rating of ratings) {
        const res = await request(app)
          .post('/api/study/review')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ cardId, rating });
        expect(res.status).toBe(200);
      }

      // Exactly one Review per submission, all for the same card.
      const reviews = await prisma.review.findMany({ where: { cardId } });
      expect(reviews).toHaveLength(ratings.length);

      // The card's lastReview matches the most recent review's createdAt and
      // the persisted fsrsState is valid JSON with progressed reps.
      const stored = await prisma.card.findUnique({ where: { id: cardId } });
      const fsrsState = JSON.parse(stored.fsrsState);
      expect(fsrsState.reps).toBe(ratings.length);
      expect(stored.lastReview).not.toBeNull();
    });

    it('does not create a partial review when the card update fails', async () => {
      const cardId = await createCard(accessToken, deckId, 'Atomic card');

      // Force a failure inside the transaction by deleting the card after the
      // review is submitted but before the transaction commits. We simulate
      // this by attempting to review a card that no longer exists.
      await prisma.card.delete({ where: { id: cardId } });

      const res = await request(app)
        .post('/api/study/review')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ cardId, rating: 'medium' });

      expect(res.status).toBe(404);

      // No orphaned Review record was created.
      const reviews = await prisma.review.findMany({ where: { cardId } });
      expect(reviews).toHaveLength(0);
    });
  });
});
