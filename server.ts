/**
 * خادم Express للتشغيل المحلي أو الاستضافة التقليدية (Render / Railway / VPS / Docker).
 * على Vercel لا يُستخدم هذا الملف؛ تُستخدم الدوال داخل مجلد api/ بدلاً منه.
 */
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { handleApi } from './server/handler.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production' || process.argv.includes('--prod');

async function main() {
  const app = express();
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });
  app.use(express.json({ limit: '1mb' }));

  app.post('/api/:route', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const result = await handleApi(req.params.route, req.headers.authorization, req.body);
    res.status(result.status).json(result.body);
  });

  if (isProd) {
    const dist = path.join(__dirname, 'dist');
    if (!fs.existsSync(dist)) {
      console.error('المجلد dist غير موجود. شغّل "npm run build" أولاً.');
      process.exit(1);
    }
    app.use(express.static(dist));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => console.log(`Server running on http://localhost:${port} (${isProd ? 'production' : 'development'})`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
