import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './server/api.ts';
import { isSupabaseConfigured } from './server/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

// Read server-only Supabase environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (isSupabaseConfigured) {
  console.log(`[Supabase] Successfully configured with project URL: ${supabaseUrl}`);
} else {
  console.log('[Supabase] Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set or using default placeholder.');
  console.log('[Supabase] Running with resilient local memory store. Add credentials to .env to connect live Supabase project.');
}

async function startServer() {
  const app = express();

  // Support JSON payload up to 15mb for product image uploads to Supabase Storage
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Mount API endpoints
  app.use('/api', apiRouter);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mithas Sweets running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server initialization error:', err);
});
