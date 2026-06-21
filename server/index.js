import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

// Resolve __dirname under ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webPath = path.join(__dirname, "../webapp", 'dist')

// 1. Serve static files from your TanStack compiled 'dist' directory
app.use(express.static(webPath));

// 2. Catch-all route: Send index.html for any request that doesn't match a static file
// This hands the URL handling off to TanStack Router in the browser
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(webPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});