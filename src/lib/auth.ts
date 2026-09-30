import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth } from './firebase';

const provider = new GoogleAuthProvider();
// gmail.modify يكفي للقراءة والإرسال والمسودات والحذف إلى السلة (أقل صلاحيات ممكنة)
provider.addScope('https://www.googleapis.com/auth/gmail.modify');
provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
provider.setCustomParameters({ prompt: 'select_account' });

// توكن Google يعيش في الذاكرة فقط (لا يُخزَّن في المتصفح) ولمدة أقصاها ~ساعة
const TOKEN_TTL_MS = 55 * 60 * 1000;
let cached: { token: string; expiresAt: number } | null = null;

export const subscribeAuth = (cb: (user: User | null) => void) => onAuthStateChanged(auth, cb);

export async function googleSignIn(): Promise<{ user: User; accessToken: string }> {
  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (!credential?.accessToken) {
    throw new Error('تعذّر الحصول على صلاحية الوصول إلى Gmail من Google.');
  }
  cached = { token: credential.accessToken, expiresAt: Date.now() + TOKEN_TTL_MS };
  return { user: result.user, accessToken: credential.accessToken };
}

/** يعيد توكن Google إن كان صالحاً، وإلا null (يجب إعادة تسجيل الدخول). */
export const getAccessToken = (): string | null => (cached && cached.expiresAt > Date.now() ? cached.token : null);

export async function logout(): Promise<void> {
  cached = null;
  await signOut(auth);
}
