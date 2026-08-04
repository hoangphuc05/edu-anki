import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_DB_PATH = path.resolve(__dirname, '..', 'prisma', 'decks-test.db');

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

describe('Deck CRUD API', () => {
  let accessToken;

  beforeEach(async () => {
    accessToken = await registerUser('deck-owner@example.com');
  });

  it('rejects all deck routes without a valid access token', async () => {
    const res = await request(app).get('/api/decks');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('AuthenticationError');
  });

  it('creates a deck and returns 201 with the deck resource', async () => {
    const res = await request(app)
      .post('/api/decks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Spanish Vocab', description: 'Basic words' });

    expect(res.status).toBe(201);
    expect(res.body.deck.title).toBe('Spanish Vocab');
    expect(res.body.deck.description).toBe('Basic words');
    expect(res.body.deck.id).toBeDefined();

    const stored = await prisma.deck.findUnique({ where: { id: res.body.deck.id } });
    expect(stored).not.toBeNull();
  });

  it('returns a 400 validation error for an empty title', async () => {
    const res = await request(app)
      .post('/api/decks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('ValidationError');
    expect(res.body.details.title).toBeDefined();

    const count = await prisma.deck.count();
    expect(count).toBe(0);
  });

  it('lists only the requesting user\'s decks', async () => {
    await request(app)
      .post('/api/decks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Mine' });

    const otherToken = await registerUser('other-user@example.com');
    await request(app)
      .post('/api/decks')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ title: 'Theirs' });

    const res = await request(app).get('/api/decks').set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.decks).toHaveLength(1);
    expect(res.body.decks[0].title).toBe('Mine');
  });

  it('gets a single deck including its cards', async () => {
    const createRes = await request(app)
      .post('/api/decks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'With Cards' });
    const deckId = createRes.body.deck.id;

    await request(app)
      .post(`/api/decks/${deckId}/cards`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ question: 'Q1', answer: 'A1', tags: ['easy'] });

    const res = await request(app)
      .get(`/api/decks/${deckId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.deck.id).toBe(deckId);
    expect(res.body.deck.cards).toHaveLength(1);
    expect(res.body.deck.cards[0].question).toBe('Q1');
  });

  it('returns 404 for a deck that does not exist', async () => {
    const res = await request(app)
      .get('/api/decks/does-not-exist')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('NotFoundError');
  });

  it("returns 404 (not 403) when accessing another user's deck, to avoid leaking existence", async () => {
    const createRes = await request(app)
      .post('/api/decks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Private' });
    const deckId = createRes.body.deck.id;

    const otherToken = await registerUser('intruder@example.com');
    const res = await request(app)
      .get(`/api/decks/${deckId}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('NotFoundError');
  });

  it('updates a deck owned by the requesting user', async () => {
    const createRes = await request(app)
      .post('/api/decks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Original' });
    const deckId = createRes.body.deck.id;

    const res = await request(app)
      .put(`/api/decks/${deckId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Updated Title' });

    expect(res.status).toBe(200);
    expect(res.body.deck.title).toBe('Updated Title');
  });

  it('returns 400 when updating with an empty body', async () => {
    const createRes = await request(app)
      .post('/api/decks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Original' });
    const deckId = createRes.body.deck.id;

    const res = await request(app)
      .put(`/api/decks/${deckId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('ValidationError');
  });

  it("returns 404 when updating another user's deck", async () => {
    const createRes = await request(app)
      .post('/api/decks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Original' });
    const deckId = createRes.body.deck.id;

    const otherToken = await registerUser('updater-intruder@example.com');
    const res = await request(app)
      .put(`/api/decks/${deckId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ title: 'Hijacked' });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('NotFoundError');
  });

  it('deletes a deck and cascades deletion to its cards', async () => {
    const createRes = await request(app)
      .post('/api/decks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'To Delete' });
    const deckId = createRes.body.deck.id;

    await request(app)
      .post(`/api/decks/${deckId}/cards`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ question: 'Q', answer: 'A' });

    const res = await request(app)
      .delete(`/api/decks/${deckId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();

    const deckStillExists = await prisma.deck.findUnique({ where: { id: deckId } });
    expect(deckStillExists).toBeNull();

    const remainingCards = await prisma.card.findMany({ where: { deckId } });
    expect(remainingCards).toHaveLength(0);
  });

  it("returns 404 when deleting another user's deck", async () => {
    const createRes = await request(app)
      .post('/api/decks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Protected' });
    const deckId = createRes.body.deck.id;

    const otherToken = await registerUser('deleter-intruder@example.com');
    const res = await request(app)
      .delete(`/api/decks/${deckId}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('NotFoundError');

    const stillExists = await prisma.deck.findUnique({ where: { id: deckId } });
    expect(stillExists).not.toBeNull();
  });
});
