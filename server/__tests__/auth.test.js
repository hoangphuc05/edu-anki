import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_DB_PATH = path.resolve(__dirname, '..', 'prisma', 'auth-test.db');

// Set env vars *before* dynamically importing any app modules, since the
// token utilities and db module read process.env at import/first-use time.
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

const VALID_USER = { email: 'auth-user@example.com', password: 'correct-horse-battery' };

describe('POST /api/auth/register', () => {
  it('creates a user record and returns 201 with an access token', async () => {
    const res = await request(app).post('/api/auth/register').send(VALID_USER);

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(VALID_USER.email);
    expect(res.body.user.password).toBeUndefined();
    expect(typeof res.body.accessToken).toBe('string');

    const stored = await prisma.user.findUnique({ where: { email: VALID_USER.email } });
    expect(stored).not.toBeNull();
  });

  it('hashes the password before storing it (never stores plaintext)', async () => {
    await request(app).post('/api/auth/register').send(VALID_USER);

    const stored = await prisma.user.findUnique({ where: { email: VALID_USER.email } });
    expect(stored.password).not.toBe(VALID_USER.password);
    // bcrypt hashes always start with $2a$, $2b$ or $2y$
    expect(stored.password).toMatch(/^\$2[aby]\$/);
    await expect(bcrypt.compare(VALID_USER.password, stored.password)).resolves.toBe(true);
  });

  it('rejects duplicate email registration with 409', async () => {
    await request(app).post('/api/auth/register').send(VALID_USER);
    const res = await request(app).post('/api/auth/register').send(VALID_USER);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('ConflictError');
  });

  it('returns a consistent 400 validation error for an invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'longenoughpassword' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('ValidationError');
    expect(res.body.details.email).toBeDefined();
  });

  it('returns a consistent 400 validation error for a short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'shortpw@example.com', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('ValidationError');
    expect(res.body.details.password).toBeDefined();
  });

  it('returns a consistent 400 validation error for a missing body', async () => {
    const res = await request(app).post('/api/auth/register').send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('ValidationError');
    expect(res.body.details.email).toBeDefined();
    expect(res.body.details.password).toBeDefined();
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(VALID_USER);
  });

  it('returns 200 with a valid JWT access token for correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send(VALID_USER);

    expect(res.status).toBe(200);
    expect(typeof res.body.accessToken).toBe('string');

    const decoded = jwt.verify(res.body.accessToken, process.env.JWT_ACCESS_SECRET);
    expect(decoded.email).toBe(VALID_USER.email);
  });

  it('sets an httpOnly refresh token cookie on successful login', async () => {
    const res = await request(app).post('/api/auth/login').send(VALID_USER);

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='));
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toMatch(/HttpOnly/i);
  });

  it('rejects an incorrect password with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: VALID_USER.email, password: 'totally-wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('AuthenticationError');
    expect(res.body.accessToken).toBeUndefined();
  });

  it('rejects login for a non-existent user with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'whatever-password' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('AuthenticationError');
  });

  it('returns a consistent 400 validation error for malformed login input', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('ValidationError');
  });
});

describe('Protected route: GET /api/auth/me', () => {
  let accessToken;

  beforeEach(async () => {
    const res = await request(app).post('/api/auth/register').send(VALID_USER);
    accessToken = res.body.accessToken;
  });

  it('rejects requests with no Authorization header', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('AuthenticationError');
  });

  it('rejects requests with a malformed token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not-a-real-token');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('AuthenticationError');
  });

  it('rejects requests with a token signed by the wrong secret', async () => {
    const badToken = jwt.sign({ sub: 'someone' }, 'wrong-secret', { expiresIn: '15m' });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${badToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('AuthenticationError');
  });

  it('rejects requests with an expired token', async () => {
    const expiredToken = jwt.sign(
      { sub: 'someone', email: VALID_USER.email },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: -10 } // already expired 10 seconds ago
    );
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('AuthenticationError');
    expect(res.body.message).toMatch(/expired/i);
  });

  it('accepts a valid access token and attaches the user to the request', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(VALID_USER.email);
  });
});

describe('POST /api/auth/refresh and /api/auth/logout', () => {
  it('issues a new access token when a valid refresh cookie is present', async () => {
    const loginRes = await request(app).post('/api/auth/register').send(VALID_USER);
    const cookies = loginRes.headers['set-cookie'];

    const refreshRes = await request(app).post('/api/auth/refresh').set('Cookie', cookies);

    expect(refreshRes.status).toBe(200);
    expect(typeof refreshRes.body.accessToken).toBe('string');
  });

  it('rejects refresh requests with no refresh cookie', async () => {
    const res = await request(app).post('/api/auth/refresh');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('AuthenticationError');
  });

  it('clears the refresh cookie on logout', async () => {
    const res = await request(app).post('/api/auth/logout');

    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toMatch(/refreshToken=;/);
  });
});
