import { verifyAccessToken } from '../utils/tokens.js';

/**
 * Express middleware that requires a valid JWT access token.
 *
 * Expects an `Authorization: Bearer <token>` header. On success, attaches the
 * decoded token payload to `req.user` and calls `next()`. On failure,
 * responds with a 401 JSON error in a consistent format.
 */
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      error: 'AuthenticationError',
      message: 'Missing or malformed Authorization header',
    });
  }

  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'AuthenticationError',
        message: 'Access token has expired',
      });
    }
    return res.status(401).json({
      error: 'AuthenticationError',
      message: 'Invalid access token',
    });
  }
}
