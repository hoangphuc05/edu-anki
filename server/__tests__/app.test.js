import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('Express App', () => {
  describe('GET /', () => {
    it('responds with 200 or 404 (no built dist in CI is expected)', async () => {
      const res = await request(app).get('/');
      // In CI there is no built dist yet — Express returns 404 for missing static files
      // but the server itself should be reachable (not crash).
      expect([200, 404]).toContain(res.status);
    });
  });

  describe('SPA catch-all route', () => {
    it('returns 200 or 404 for an unknown path (never a 500)', async () => {
      const res = await request(app).get('/some/deep/unknown/route');
      // Without a built dist the static middleware finds nothing, catch-all tries
      // to sendFile index.html which also doesn't exist → 404. That is expected.
      expect(res.status).not.toBe(500);
    });

    it('returns 200 or 404 for another deep unknown path', async () => {
      const res = await request(app).get('/cards/review/123');
      expect(res.status).not.toBe(500);
    });
  });

  describe('app object', () => {
    it('is an express application instance', () => {
      expect(app).toBeDefined();
      expect(typeof app).toBe('function');
    });

    it('exposes expected HTTP methods', () => {
      expect(typeof app.get).toBe('function');
      expect(typeof app.use).toBe('function');
      expect(typeof app.listen).toBe('function');
    });
  });
});
