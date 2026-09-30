import { HttpError } from './http.js';

/**
 * تحديد معدل الطلبات لكل مستخدم (في الذاكرة).
 * ملاحظة: على Vercel كل instance له ذاكرته الخاصة، فهذا حدّ "تقريبي" يكفي لمنع الإساءة البسيطة.
 * لحدّ صارم استبدله بـ Upstash Redis / Vercel KV.
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX || 40);

const hits = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string): void {
  const now = Date.now();

  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
  }

  const current = hits.get(key);
  if (!current || current.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }

  if (current.count >= MAX_REQUESTS) {
    const minutes = Math.max(1, Math.ceil((current.resetAt - now) / 60000));
    throw new HttpError(429, 'RATE_LIMITED', `تجاوزت الحد المسموح من الطلبات. حاول بعد ${minutes} دقيقة.`);
  }
  current.count += 1;
}
