import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  serializeTags,
  parseTags,
  serializeFsrsState,
  parseFsrsState,
} from '../src/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use a dedicated test database
const TEST_DB_PATH = path.resolve(__dirname, '..', 'prisma', 'test.db');
const TEST_DB_URL = `file:${TEST_DB_PATH}`;

let prisma;

beforeAll(async () => {
  // Clean up any existing test database
  for (const ext of ['', '-wal', '-shm']) {
    const filePath = TEST_DB_PATH + ext;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  // Push the schema to create a fresh test database
  const serverDir = path.resolve(__dirname, '..');
  execSync(`npx prisma db push --accept-data-loss --url "${TEST_DB_URL}"`, {
    cwd: serverDir,
    stdio: 'pipe',
    env: { ...process.env, DATABASE_URL: TEST_DB_URL },
  });

  // Create a PrismaClient with the better-sqlite3 adapter
  const adapter = new PrismaBetterSqlite3({ url: TEST_DB_URL });
  prisma = new PrismaClient({ adapter });

  await prisma.$connect();

  // Enable WAL mode
  await prisma.$executeRawUnsafe('PRAGMA journal_mode=WAL;');
  await prisma.$executeRawUnsafe('PRAGMA busy_timeout=5000;');
});

afterAll(async () => {
  if (prisma) {
    await prisma.$disconnect();
  }

  // Clean up test database files
  for (const ext of ['', '-wal', '-shm']) {
    const filePath = TEST_DB_PATH + ext;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
});

// Clean all data between tests (order matters due to foreign keys)
beforeEach(async () => {
  await prisma.review.deleteMany();
  await prisma.card.deleteMany();
  await prisma.deck.deleteMany();
  await prisma.user.deleteMany();
});

// ───────────────────────────────────────────────────────────────────────────────
// Database initialisation
// ───────────────────────────────────────────────────────────────────────────────

describe('Database initialization', () => {
  it('creates the database file on disk', () => {
    expect(fs.existsSync(TEST_DB_PATH)).toBe(true);
  });

  it('has WAL journal mode enabled', async () => {
    const result = await prisma.$queryRawUnsafe('PRAGMA journal_mode;');
    expect(result[0].journal_mode).toBe('wal');
  });

  it('creates all expected tables', async () => {
    const tables = await prisma.$queryRawUnsafe(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma%' ORDER BY name;"
    );
    const tableNames = tables.map((t) => t.name).sort();
    expect(tableNames).toEqual(['Card', 'Deck', 'Review', 'User']);
  });
});

// ───────────────────────────────────────────────────────────────────────────────
// User model
// ───────────────────────────────────────────────────────────────────────────────

describe('User model', () => {
  it('creates a user with email and hashed password', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: '$2b$10$hashedpasswordvalue',
      },
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe('test@example.com');
    expect(user.password).toBe('$2b$10$hashedpasswordvalue');
  });

  it('auto-populates createdAt', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'timestamp@example.com',
        password: 'hashed',
      },
    });

    expect(user.createdAt).toBeInstanceOf(Date);
  });

  it('enforces email uniqueness', async () => {
    await prisma.user.create({
      data: { email: 'unique@example.com', password: 'hashed' },
    });

    await expect(
      prisma.user.create({
        data: { email: 'unique@example.com', password: 'hashed2' },
      })
    ).rejects.toThrow();
  });

  it('generates a UUID as the id', async () => {
    const user = await prisma.user.create({
      data: { email: 'uuid@example.com', password: 'hashed' },
    });

    // UUID v4 pattern
    expect(user.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });
});

// ───────────────────────────────────────────────────────────────────────────────
// Deck model
// ───────────────────────────────────────────────────────────────────────────────

describe('Deck model', () => {
  let testUser;

  beforeEach(async () => {
    testUser = await prisma.user.create({
      data: { email: 'deckowner@example.com', password: 'hashed' },
    });
  });

  it('creates a deck linked to a user', async () => {
    const deck = await prisma.deck.create({
      data: {
        title: 'JavaScript Basics',
        userId: testUser.id,
      },
    });

    expect(deck.id).toBeDefined();
    expect(deck.title).toBe('JavaScript Basics');
    expect(deck.userId).toBe(testUser.id);
  });

  it('allows optional description field', async () => {
    const deckWithDesc = await prisma.deck.create({
      data: {
        title: 'With Desc',
        description: 'A description',
        userId: testUser.id,
      },
    });

    const deckWithoutDesc = await prisma.deck.create({
      data: {
        title: 'No Desc',
        userId: testUser.id,
      },
    });

    expect(deckWithDesc.description).toBe('A description');
    expect(deckWithoutDesc.description).toBeNull();
  });

  it('can be queried through user relation', async () => {
    await prisma.deck.create({
      data: { title: 'Deck 1', userId: testUser.id },
    });
    await prisma.deck.create({
      data: { title: 'Deck 2', userId: testUser.id },
    });

    const userWithDecks = await prisma.user.findUnique({
      where: { id: testUser.id },
      include: { decks: true },
    });

    expect(userWithDecks.decks).toHaveLength(2);
  });
});

// ───────────────────────────────────────────────────────────────────────────────
// Card model
// ───────────────────────────────────────────────────────────────────────────────

describe('Card model', () => {
  let testDeck;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: { email: 'cardowner@example.com', password: 'hashed' },
    });
    testDeck = await prisma.deck.create({
      data: { title: 'Test Deck', userId: user.id },
    });
  });

  it('creates a card with question and answer', async () => {
    const card = await prisma.card.create({
      data: {
        question: 'What is a closure?',
        answer: 'A function with access to its outer scope',
        deckId: testDeck.id,
      },
    });

    expect(card.id).toBeDefined();
    expect(card.question).toBe('What is a closure?');
    expect(card.answer).toBe('A function with access to its outer scope');
    expect(card.deckId).toBe(testDeck.id);
  });

  it('stores tags as a JSON-serialized string', async () => {
    const tags = ['javascript', 'closures', 'scope'];
    const card = await prisma.card.create({
      data: {
        question: 'Q?',
        answer: 'A',
        deckId: testDeck.id,
        tags: serializeTags(tags),
      },
    });

    const parsedTags = parseTags(card.tags);
    expect(parsedTags).toEqual(['javascript', 'closures', 'scope']);
  });

  it('stores fsrsState as a JSON-serialized string', async () => {
    const fsrsState = {
      interval: 1,
      ease: 2.5,
      stability: 4.0,
      difficulty: 5.0,
    };

    const card = await prisma.card.create({
      data: {
        question: 'Q?',
        answer: 'A',
        deckId: testDeck.id,
        fsrsState: serializeFsrsState(fsrsState),
      },
    });

    const parsedState = parseFsrsState(card.fsrsState);
    expect(parsedState).toEqual({
      interval: 1,
      ease: 2.5,
      stability: 4.0,
      difficulty: 5.0,
    });
  });

  it('defaults tags to empty JSON array', async () => {
    const card = await prisma.card.create({
      data: {
        question: 'Q?',
        answer: 'A',
        deckId: testDeck.id,
      },
    });

    expect(parseTags(card.tags)).toEqual([]);
  });

  it('defaults fsrsState to empty JSON object', async () => {
    const card = await prisma.card.create({
      data: {
        question: 'Q?',
        answer: 'A',
        deckId: testDeck.id,
      },
    });

    expect(parseFsrsState(card.fsrsState)).toEqual({});
  });

  it('accepts optional nextReview and lastReview dates', async () => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 86400000);

    const card = await prisma.card.create({
      data: {
        question: 'Q?',
        answer: 'A',
        deckId: testDeck.id,
        nextReview: tomorrow,
        lastReview: now,
      },
    });

    expect(card.nextReview).toBeInstanceOf(Date);
    expect(card.lastReview).toBeInstanceOf(Date);
  });

  it('allows null for nextReview and lastReview', async () => {
    const card = await prisma.card.create({
      data: {
        question: 'Q?',
        answer: 'A',
        deckId: testDeck.id,
      },
    });

    expect(card.nextReview).toBeNull();
    expect(card.lastReview).toBeNull();
  });
});

// ───────────────────────────────────────────────────────────────────────────────
// Review model
// ───────────────────────────────────────────────────────────────────────────────

describe('Review model', () => {
  let testCard;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: { email: 'reviewer@example.com', password: 'hashed' },
    });
    const deck = await prisma.deck.create({
      data: { title: 'Review Deck', userId: user.id },
    });
    testCard = await prisma.card.create({
      data: {
        question: 'Q?',
        answer: 'A',
        deckId: deck.id,
      },
    });
  });

  it('creates a review with a rating', async () => {
    const review = await prisma.review.create({
      data: {
        cardId: testCard.id,
        rating: 4,
      },
    });

    expect(review.id).toBeDefined();
    expect(review.cardId).toBe(testCard.id);
    expect(review.rating).toBe(4);
  });

  it('accepts optional duration field', async () => {
    const withDuration = await prisma.review.create({
      data: { cardId: testCard.id, rating: 3, duration: 45 },
    });

    const withoutDuration = await prisma.review.create({
      data: { cardId: testCard.id, rating: 5 },
    });

    expect(withDuration.duration).toBe(45);
    expect(withoutDuration.duration).toBeNull();
  });

  it('auto-populates createdAt', async () => {
    const review = await prisma.review.create({
      data: { cardId: testCard.id, rating: 2 },
    });

    expect(review.createdAt).toBeInstanceOf(Date);
  });

  it('can be queried through card relation', async () => {
    await prisma.review.create({
      data: { cardId: testCard.id, rating: 3 },
    });
    await prisma.review.create({
      data: { cardId: testCard.id, rating: 5 },
    });

    const cardWithReviews = await prisma.card.findUnique({
      where: { id: testCard.id },
      include: { reviews: true },
    });

    expect(cardWithReviews.reviews).toHaveLength(2);
  });
});

// ───────────────────────────────────────────────────────────────────────────────
// Cascading deletes
// ───────────────────────────────────────────────────────────────────────────────

describe('Cascading deletes', () => {
  it('deleting a User cascades to Decks, Cards, and Reviews', async () => {
    const user = await prisma.user.create({
      data: { email: 'cascade@example.com', password: 'hashed' },
    });
    const deck = await prisma.deck.create({
      data: { title: 'Cascade Deck', userId: user.id },
    });
    const card = await prisma.card.create({
      data: { question: 'Q?', answer: 'A', deckId: deck.id },
    });
    await prisma.review.create({
      data: { cardId: card.id, rating: 3 },
    });

    // Delete the user
    await prisma.user.delete({ where: { id: user.id } });

    // Verify everything is gone
    expect(await prisma.deck.findUnique({ where: { id: deck.id } })).toBeNull();
    expect(await prisma.card.findUnique({ where: { id: card.id } })).toBeNull();
    expect(await prisma.review.count()).toBe(0);
  });

  it('deleting a Deck cascades to Cards and Reviews', async () => {
    const user = await prisma.user.create({
      data: { email: 'cascade2@example.com', password: 'hashed' },
    });
    const deck = await prisma.deck.create({
      data: { title: 'Cascade Deck 2', userId: user.id },
    });
    const card = await prisma.card.create({
      data: { question: 'Q?', answer: 'A', deckId: deck.id },
    });
    await prisma.review.create({
      data: { cardId: card.id, rating: 4 },
    });

    // Delete the deck
    await prisma.deck.delete({ where: { id: deck.id } });

    // User should still exist
    expect(await prisma.user.findUnique({ where: { id: user.id } })).not.toBeNull();
    // Card and review should be gone
    expect(await prisma.card.findUnique({ where: { id: card.id } })).toBeNull();
    expect(await prisma.review.count()).toBe(0);
  });

  it('deleting a Card cascades to its Reviews', async () => {
    const user = await prisma.user.create({
      data: { email: 'cascade3@example.com', password: 'hashed' },
    });
    const deck = await prisma.deck.create({
      data: { title: 'Cascade Deck 3', userId: user.id },
    });
    const card = await prisma.card.create({
      data: { question: 'Q?', answer: 'A', deckId: deck.id },
    });
    await prisma.review.create({
      data: { cardId: card.id, rating: 5 },
    });
    await prisma.review.create({
      data: { cardId: card.id, rating: 3 },
    });

    // Delete the card
    await prisma.card.delete({ where: { id: card.id } });

    // Deck and user should still exist
    expect(await prisma.deck.findUnique({ where: { id: deck.id } })).not.toBeNull();
    expect(await prisma.user.findUnique({ where: { id: user.id } })).not.toBeNull();
    // Reviews should be gone
    expect(await prisma.review.count()).toBe(0);
  });
});

// ───────────────────────────────────────────────────────────────────────────────
// JSON field helpers
// ───────────────────────────────────────────────────────────────────────────────

describe('serializeTags / parseTags', () => {
  it('round-trips an array of strings', () => {
    const tags = ['math', 'algebra', 'equations'];
    const serialized = serializeTags(tags);
    const parsed = parseTags(serialized);
    expect(parsed).toEqual(tags);
  });

  it('handles an empty array', () => {
    const serialized = serializeTags([]);
    expect(parseTags(serialized)).toEqual([]);
  });

  it('throws on non-array input to serializeTags', () => {
    expect(() => serializeTags('not-an-array')).toThrow(TypeError);
    expect(() => serializeTags(null)).toThrow(TypeError);
  });

  it('returns empty array for null/undefined input to parseTags', () => {
    expect(parseTags(null)).toEqual([]);
    expect(parseTags(undefined)).toEqual([]);
  });

  it('returns empty array for malformed JSON input to parseTags', () => {
    expect(parseTags('not-json')).toEqual([]);
    expect(parseTags('{}')).toEqual([]);
  });
});

describe('serializeFsrsState / parseFsrsState', () => {
  it('round-trips a state object', () => {
    const state = { interval: 1, ease: 2.5, stability: 4.0, difficulty: 5.0 };
    const serialized = serializeFsrsState(state);
    const parsed = parseFsrsState(serialized);
    expect(parsed).toEqual(state);
  });

  it('handles an empty object', () => {
    const serialized = serializeFsrsState({});
    expect(parseFsrsState(serialized)).toEqual({});
  });

  it('throws on null/undefined/array input to serializeFsrsState', () => {
    expect(() => serializeFsrsState(null)).toThrow(TypeError);
    expect(() => serializeFsrsState(undefined)).toThrow(TypeError);
    expect(() => serializeFsrsState([1, 2])).toThrow(TypeError);
    expect(() => serializeFsrsState('string')).toThrow(TypeError);
  });

  it('returns empty object for null/undefined input to parseFsrsState', () => {
    expect(parseFsrsState(null)).toEqual({});
    expect(parseFsrsState(undefined)).toEqual({});
  });

  it('returns empty object for malformed JSON input to parseFsrsState', () => {
    expect(parseFsrsState('not-json')).toEqual({});
    expect(parseFsrsState('[]')).toEqual({});
  });
});
