import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleApi } from '../server/handler.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'الطريقة غير مسموحة.' });
  }

  const route = Array.isArray(req.query.route) ? req.query.route[0] : req.query.route;
  const result = await handleApi(String(route ?? ''), req.headers.authorization, req.body);
  return res.status(result.status).json(result.body);
}
