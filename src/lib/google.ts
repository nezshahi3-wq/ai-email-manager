export class GoogleAuthError extends Error {
  constructor(message = 'انتهت صلاحية جلسة Google. سجّل الدخول مرة أخرى.') {
    super(message);
    this.name = 'GoogleAuthError';
  }
}

/** fetch لواجهات Google مع معالجة موحّدة لانتهاء الجلسة والصلاحيات. */
export async function googleFetch(token: string, url: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: { ...(init.headers as Record<string, string> | undefined), Authorization: `Bearer ${token}` },
  });
  if (res.ok) return res;

  if (res.status === 401) throw new GoogleAuthError();

  const data = await res.json().catch(() => null);
  const msg: string = data?.error?.message || `HTTP ${res.status}`;

  if (res.status === 403) {
    if (/has not been used|is disabled|accessNotConfigured/i.test(msg)) {
      throw new Error('واجهة Gmail API أو Calendar API غير مفعّلة في مشروع Google Cloud. فعّلها ثم أعد المحاولة.');
    }
    if (/insufficient|scope|permission/i.test(msg)) {
      throw new GoogleAuthError('صلاحيات Google غير كافية. سجّل الدخول مجدداً ووافق على جميع الصلاحيات المطلوبة.');
    }
  }
  throw new Error(msg);
}
