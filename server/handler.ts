import { verifyFirebaseToken } from './auth.js';
import { analyzeInbox, analyzeScheduling, generateReply } from './core.js';
import { HttpError, type ApiResult } from './http.js';
import { checkRateLimit } from './limits.js';

const ROUTES = {
  'analyze-inbox': analyzeInbox,
  'generate-reply': generateReply,
  'analyze-scheduling': analyzeScheduling,
} as const;

function toResult(err: unknown): ApiResult {
  if (err instanceof HttpError) {
    return { status: err.status, body: { error: err.code, message: err.message } };
  }
  const e = err as { status?: unknown; code?: unknown; message?: unknown };
  const msg = String(e?.message ?? '');
  if (e?.status === 429 || e?.code === 429 || /quota|RESOURCE_EXHAUSTED/i.test(msg)) {
    return {
      status: 429,
      body: { error: 'QUOTA_EXCEEDED', message: 'تم تجاوز حصة الذكاء الاصطناعي. حاول لاحقاً.' },
    };
  }
  console.error('API error:', err);
  return { status: 500, body: { error: 'INTERNAL', message: 'حدث خطأ غير متوقع في الخادم.' } };
}

/** نقطة الدخول المشتركة بين Vercel (api/[route].ts) وخادم Express (server.ts). */
export async function handleApi(route: string, authorization: string | undefined, body: unknown): Promise<ApiResult> {
  try {
    if (!Object.prototype.hasOwnProperty.call(ROUTES, route)) {
      throw new HttpError(404, 'NOT_FOUND', 'المسار غير موجود.');
    }
    const { uid } = await verifyFirebaseToken(authorization);
    checkRateLimit(uid);
    const result = await ROUTES[route as keyof typeof ROUTES](body);
    return { status: 200, body: result };
  } catch (err) {
    return toResult(err);
  }
}
