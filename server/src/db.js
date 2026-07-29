import { PrismaClient } from './generated/prisma/client.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// JSON field helpers – SQLite stores tags & fsrsState as JSON-encoded strings
// ---------------------------------------------------------------------------

/**
 * Serialize a tags array into a JSON string for storage.
 * @param {string[]} tags
 * @returns {string}
 */
export function serializeTags(tags) {
  if (!Array.isArray(tags)) {
    throw new TypeError('tags must be an array');
  }
  return JSON.stringify(tags);
}

/**
 * Parse a stored tags string back into an array.
 * @param {string} tagsString
 * @returns {string[]}
 */
export function parseTags(tagsString) {
  if (tagsString === null || tagsString === undefined) {
    return [];
  }
  try {
    const parsed = JSON.parse(tagsString);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
}

/**
 * Serialize an FSRS state object into a JSON string for storage.
 * Expected shape: { interval, ease, stability, difficulty }
 * @param {object} state
 * @returns {string}
 */
export function serializeFsrsState(state) {
  if (state === null || state === undefined || typeof state !== 'object' || Array.isArray(state)) {
    throw new TypeError('fsrsState must be a non-null object');
  }
  return JSON.stringify(state);
}

/**
 * Parse a stored FSRS state string back into an object.
 * @param {string} stateString
 * @returns {object}
 */
export function parseFsrsState(stateString) {
  if (stateString === null || stateString === undefined) {
    return {};
  }
  try {
    const parsed = JSON.parse(stateString);
    if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// PrismaClient singleton with better-sqlite3 driver adapter
// ---------------------------------------------------------------------------

let prisma = null;

/**
 * Resolve the database file path from the DATABASE_URL environment variable.
 * @param {string} [url] - Override the DATABASE_URL (for testing).
 * @returns {string} Absolute path to the SQLite database file.
 */
export function getDatabasePath(url) {
  const dbUrl = url || process.env.DATABASE_URL || 'file:./dev.db';
  // Strip the "file:" prefix
  const relativePath = dbUrl.replace(/^file:/, '');
  // Prisma resolves relative paths from the prisma/ directory
  const prismaDir = path.resolve(__dirname, '..', 'prisma');
  return path.resolve(prismaDir, relativePath);
}

/**
 * Create a PrismaClient instance configured with the better-sqlite3 adapter.
 * The adapter automatically opens the database in WAL journal mode.
 *
 * @param {string} [url] - Override the DATABASE_URL (useful for testing).
 * @returns {PrismaClient}
 */
export function createPrismaClient(url) {
  const dbUrl = url || process.env.DATABASE_URL || 'file:./dev.db';
  const adapter = new PrismaBetterSqlite3({ url: dbUrl });
  return new PrismaClient({ adapter });
}

/**
 * Returns a singleton PrismaClient instance.
 * @returns {PrismaClient}
 */
export function getPrismaClient() {
  if (!prisma) {
    prisma = createPrismaClient();
  }
  return prisma;
}

/**
 * Enable WAL journal mode and set busy timeout on the database.
 * @param {PrismaClient} client
 */
export async function enableWalMode(client) {
  await client.$executeRawUnsafe('PRAGMA journal_mode=WAL;');
  await client.$executeRawUnsafe('PRAGMA busy_timeout=5000;');
}

// ---------------------------------------------------------------------------
// Database initialisation
// ---------------------------------------------------------------------------

/**
 * Initialise the database:
 * 1. If the database file does not exist, run `prisma db push` to create it.
 * 2. Connect the PrismaClient.
 * 3. Enable WAL mode.
 *
 * @returns {Promise<PrismaClient>} The connected PrismaClient instance.
 */
export async function initializeDatabase() {
  const dbPath = getDatabasePath();
  const client = getPrismaClient();

  if (!fs.existsSync(dbPath)) {
    // Push the schema to create the database file and all tables
    const serverDir = path.resolve(__dirname, '..');
    execSync('npx prisma db push', {
      cwd: serverDir,
      stdio: 'pipe',
      env: { ...process.env },
    });
  }

  await client.$connect();
  await enableWalMode(client);

  return client;
}

/**
 * Disconnect the PrismaClient and reset the singleton.
 */
export async function disconnectDatabase() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}
