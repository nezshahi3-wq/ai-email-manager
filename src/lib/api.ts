import { auth } from './firebase';

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

const DEFAULT_MESSAGES: Record<number, string> = {
  401: 'جلسة الدخول غير صالحة. أعد تسجيل الدخول.',
  429: 'تجاوزت الحد المسموح من الطلبات. حاول لاحقاً.',
  500: 'حدث خطأ في الخادم.',
};

/** يستدعي خادم التطبيق مع Firebase ID Token للتحقق من هوية المستخدم. */
export async function apiPost<T>(route: string, body: unknown): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new ApiError(401, 'UNAUTHENTICATED', DEFAULT_MESSAGES[401]);

  const idToken = await user.getIdToken();
  const res = await fetch(`/api/${route}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify(body),
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* الرد ليس JSON */
  }

  if (!res.ok) {
    throw new ApiError(
      res.status,
      data?.error || 'ERROR',
      data?.message || DEFAULT_MESSAGES[res.status] || `فشل الطلب (${res.status}).`,
    );
  }
  return data as T;
}
