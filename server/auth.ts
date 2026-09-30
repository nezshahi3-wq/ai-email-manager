import { createRemoteJWKSet, jwtVerify } from 'jose';
import { HttpError } from './http.js';

// مفاتيح Firebase العامة للتحقق من توقيع الـ ID Token (بدون الحاجة لـ firebase-admin)
const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
);

export async function verifyFirebaseToken(authorization?: string): Promise<{ uid: string }> {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new HttpError(500, 'SERVER_MISCONFIGURED', 'المتغير FIREBASE_PROJECT_ID غير مضبوط على الخادم.');
  }

  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) {
    throw new HttpError(401, 'UNAUTHENTICATED', 'يجب تسجيل الدخول أولاً.');
  }

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    if (!payload.sub) throw new Error('missing sub');
    return { uid: payload.sub };
  } catch {
    throw new HttpError(401, 'INVALID_TOKEN', 'جلسة الدخول غير صالحة أو منتهية. أعد تسجيل الدخول.');
  }
}
