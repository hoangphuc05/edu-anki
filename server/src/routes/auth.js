import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { registerSchema, loginSchema } from 'shared-types';
import { getPrismaClient } from '../db.js';
import { formatZodError } from '../utils/validation.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshCookieOptions,
  REFRESH_COOKIE_NAME,
} from '../utils/tokens.js';

const router = Router();

const SALT_ROUNDS = 10;

function toPublicUser(user) {
  return { id: user.id, email: user.email };
}

function issueTokens(res, user) {
  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  const refreshToken = signRefreshToken({ sub: user.id });
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
  return accessToken;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(formatZodError(parsed.error));
  }

  const { email, password } = parsed.data;
  const prisma = getPrismaClient();

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(409).json({
      error: 'ConflictError',
      message: 'An account with this email already exists',
    });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { email, password: passwordHash },
  });

  const accessToken = issueTokens(res, user);
  return res.status(201).json({ user: toPublicUser(user), accessToken });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(formatZodError(parsed.error));
  }

  const { email, password } = parsed.data;
  const prisma = getPrismaClient();

  const user = await prisma.user.findUnique({ where: { email } });
  const passwordMatches = user ? await bcrypt.compare(password, user.password) : false;

  if (!user || !passwordMatches) {
    return res.status(401).json({
      error: 'AuthenticationError',
      message: 'Invalid email or password',
    });
  }

  const accessToken = issueTokens(res, user);
  return res.status(200).json({ user: toPublicUser(user), accessToken });
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) {
    return res.status(401).json({
      error: 'AuthenticationError',
      message: 'Missing refresh token',
    });
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    return res.status(401).json({
      error: 'AuthenticationError',
      message: 'Invalid or expired refresh token',
    });
  }

  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
  if (!user) {
    return res.status(401).json({
      error: 'AuthenticationError',
      message: 'Invalid refresh token',
    });
  }

  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  return res.status(200).json({ accessToken, user: toPublicUser(user) });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
  return res.status(200).json({ message: 'Logged out successfully' });
});

// GET /api/auth/me - example protected route
router.get('/me', authMiddleware, async (req, res) => {
  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
  if (!user) {
    return res.status(404).json({ error: 'NotFoundError', message: 'User not found' });
  }
  return res.status(200).json({ user: toPublicUser(user) });
});

export default router;
