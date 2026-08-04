import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_DB_PATH = path.resolve(__dirname, '..', 'prisma', 'cards-test.db');

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

async function createDeck(token, title = 'Test Deck') {
  const res = await request(app)
    .post('/api/decks')
    .set('Authorization', `Bearer ${token}`)
    .send({ title });
  return res.body.deck.id;
}

describe('Card CRUD API', () => {
  let accessToken;
  let deckId;

  beforeEach(async () => {
    accessToken = await registerUser('card-owner@example.com');
    deckId = await createDeck(accessToken);
  });

  it('creates a card nested under a deck and round-trips tags', async () => {
    const res = await request(app)
      .post(`/api/decks/${deckId}/cards`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ question: 'What is 2+2?', answer: '4', tags: ['math', 'easy'] });

    expect(res.status).toBe(201);
    expect(res.body.card.question).toBe('What is 2+2?');
    expect(res.body.card.tags).toEqual(['math', 'easy']);
    expect(res.body.card.deckId).toBe(deckId);

    const stored = await prisma.card.findUnique({ where: { id: res.body.card.id } });
    expect(stored.tags).toBe('["math","easy"]');
  });

  it('defaults tags to an empty array when omitted', async () => {
    const res = await request(app)
      .post(`/api/decks/${deckId}/cards`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ question: 'Q', answer: 'A' });

    expect(res.status).toBe(201);
    expect(res.body.card.tags).toEqual([]);
  });

  it('returns 400 for a missing answer', async () => {
    const res = await request(app)
      .post(`/api/decks/${deckId}/cards`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ question: 'Q' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('ValidationError');
    expect(res.body.details.answer).toBeDefined();
  });

  it("returns 404 when creating a card under another user's deck", async () => {
    const otherToken = await registerUser('card-intruder@example.com');
    const res = await request(app)
      .post(`/api/decks/${deckId}/cards`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ question: 'Q', answer: 'A' });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('NotFoundError');
  });

  it('lists cards for a deck', async () => {
    await request(app)
      .post(`/api/decks/${deckId}/cards`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ question: 'Q1', answer: 'A1' });
    await request(app)
      .post(`/api/decks/${deckId}/cards`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ question: 'Q2', answer: 'A2' });

    const res = await request(app)
      .get(`/api/decks/${deckId}/cards`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.cards).toHaveLength(2);
  });

  it('gets a single card by id', async () => {
    const createRes = await request(app)
      .post(`/api/decks/${deckId}/cards`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ question: 'Q', answer: 'A' });
    const cardId = createRes.body.card.id;

    const res = await request(app)
      .get(`/api/cards/${cardId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.card.id).toBe(cardId);
  });

  it("returns 404 when fetching another user's card", async () => {
    const createRes = await request(app)
      .post(`/api/decks/${deckId}/cards`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ question: 'Q', answer: 'A' });
    const cardId = createRes.body.card.id;

    const otherToken = await registerUser('getter-intruder@example.com');
    const res = await request(app)
      .get(`/api/cards/${cardId}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('NotFoundError');
  });

  it('updates a card', async () => {
    const createRes = await request(app)
      .post(`/api/decks/${deckId}/cards`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ question: 'Q', answer: 'A', tags: ['old'] });
    const cardId = createRes.body.card.id;

    const res = await request(app)
      .put(`/api/cards/${cardId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ answer: 'Updated Answer', tags: ['new'] });

    expect(res.status).toBe(200);
    expect(res.body.card.question).toBe('Q');
    expect(res.body.card.answer).toBe('Updated Answer');
    expect(res.body.card.tags).toEqual(['new']);
  });

  it('returns 400 when updating with an empty body', async () => {
    const createRes = await request(app)
      .post(`/api/decks/${deckId}/cards`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ question: 'Q', answer: 'A' });
    const cardId = createRes.body.card.id;

    const res = await request(app)
      .put(`/api/cards/${cardId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('ValidationError');
  });

  it("returns 404 when updating another user's card", async () => {
    const createRes = await request(app)
      .post(`/api/decks/${deckId}/cards`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ question: 'Q', answer: 'A' });
    const cardId = createRes.body.card.id;

    const otherToken = await registerUser('updater-intruder2@example.com');
    const res = await request(app)
      .put(`/api/cards/${cardId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ answer: 'Hijacked' });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('NotFoundError');
  });

  it('deletes a card', async () => {
    const createRes = await request(app)
      .post(`/api/decks/${deckId}/cards`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ question: 'Q', answer: 'A' });
    const cardId = createRes.body.card.id;

    const res = await request(app)
      .delete(`/api/cards/${cardId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();

    const stored = await prisma.card.findUnique({ where: { id: cardId } });
    expect(stored).toBeNull();
  });

  it("returns 404 when deleting another user's card", async () => {
    const createRes = await request(app)
      .post(`/api/decks/${deckId}/cards`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ question: 'Q', answer: 'A' });
    const cardId = createRes.body.card.id;

    const otherToken = await registerUser('deleter-intruder2@example.com');
    const res = await request(app)
      .delete(`/api/cards/${cardId}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('NotFoundError');

    const stillExists = await prisma.card.findUnique({ where: { id: cardId } });
    expect(stillExists).not.toBeNull();
  });
});
