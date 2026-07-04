import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webPath = path.join(__dirname, '../webapp', 'dist');

const app = express();

// Serve static files from the compiled webapp dist directory
app.use(express.static(webPath));

// Catch-all route: return index.html for any unmatched path (SPA pattern)
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(webPath, 'index.html'));
});

export default app;
