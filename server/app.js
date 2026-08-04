import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import authRouter from './src/routes/auth.js';
import decksRouter from './src/routes/decks.js';
import cardsRouter from './src/routes/cards.js';
import { errorHandler } from './src/middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webPath = path.join(__dirname, '../webapp', 'dist');

const app = express();

app.use(express.json());
app.use(cookieParser());

// Authentication API routes
app.use('/api/auth', authRouter);

// Deck/card CRUD API routes
app.use('/api/decks', decksRouter);
app.use('/api/cards', cardsRouter);

// Serve static files from the compiled webapp dist directory
app.use(express.static(webPath));

// Catch-all route: return index.html for any unmatched path (SPA pattern)
app.get('/{*splat}', (req, res, next) => {
  res.sendFile(path.join(webPath, 'index.html'), (err) => {
    // No built dist (e.g. in CI) means index.html is missing — that's a 404, not a 500.
    if (err) {
      if (err.code === 'ENOENT') {
        res.status(404).end();
      } else {
        next(err);
      }
    }
  });
});

// Centralized error-handling middleware (must be registered last)
app.use(errorHandler);

export default app;
