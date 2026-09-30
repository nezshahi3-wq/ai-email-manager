export default function ConfigError() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6" dir="rtl">
      <div className="max-w-lg bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-4 text-right">
        <h1 className="text-xl font-black text-slate-900">إعدادات Firebase غير مكتملة</h1>
        <p className="text-slate-600 leading-relaxed">
          لم يتم العثور على متغيرات البيئة الخاصة بـ Firebase. انسخ الملف <code dir="ltr">.env.example</code> إلى{' '}
          <code dir="ltr">.env</code> واملأ القيم (محلياً)، أو أضفها في إعدادات Environment Variables على Vercel، ثم أعد
          البناء.
        </p>
        <p className="text-sm text-slate-400" dir="ltr">
          VITE_FIREBASE_API_KEY · VITE_FIREBASE_AUTH_DOMAIN · VITE_FIREBASE_PROJECT_ID · VITE_FIREBASE_APP_ID
        </p>
      </div>
    </div>
  );
}
