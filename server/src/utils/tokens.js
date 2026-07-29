import jwt from 'jsonwebtoken';

// ---------------------------------------------------------------------------
// JWT secrets & expirations
// ---------------------------------------------------------------------------
//
// Secrets should always be provided via environment variables in production.
// Fallback development secrets are provided purely for local convenience and
// must never be used outside of development/test environments.

const DEV_ACCESS_SECRET = 'dev-access-secret-change-me';
const DEV_REFRESH_SECRET = 'dev-refresh-secret-change-me';

if (
  process.env.NODE_ENV === 'production' &&
  (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET)
) {
  throw new Error(
    'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET environment variables must be set in production.'
  );
}

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || DEV_ACCESS_SECRET;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || DEV_REFRESH_SECRET;

export const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
export const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

// Name of the httpOnly cookie used to store the refresh token.
export const REFRESH_COOKIE_NAME = 'refreshToken';
// Only send the refresh cookie back to the auth endpoints that need it.
export const REFRESH_COOKIE_PATH = '/api/auth';

/**
 * Sign a short-lived access token.
 * @param {{ sub: string, email: string }} payload
 * @returns {string}
 */
export function signAccessToken(payload) {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

/**
 * Verify and decode an access token. Throws if invalid or expired.
 * @param {string} token
 * @returns {import('jsonwebtoken').JwtPayload}
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_TOKEN_SECRET);
}

/**
 * Sign a long-lived refresh token.
 * @param {{ sub: string }} payload
 * @returns {string}
 */
export function signRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

/**
 * Verify and decode a refresh token. Throws if invalid or expired.
 * @param {string} token
 * @returns {import('jsonwebtoken').JwtPayload}
 */
export function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_TOKEN_SECRET);
}

/**
 * Cookie options used when setting/clearing the refresh token cookie.
 * @returns {import('express').CookieOptions}
 */
export function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: REFRESH_COOKIE_PATH,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}
