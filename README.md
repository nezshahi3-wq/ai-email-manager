# المدير الإلكتروني الذكي (AI Email Manager)

تطبيق يصنّف رسائل Gmail ويلخّصها، ويصوغ ردوداً، ويقترح مواعيد من Google Calendar باستخدام Gemini.
**الواجهة:** React + Vite + Tailwind · **الخادم:** دوال Vercel (`api/`) أو Express (`server.ts`) · **الهوية والإعدادات:** Firebase Auth + Firestore.

## الهيكل

```
api/[route].ts      دالة Vercel تخدم: analyze-inbox / generate-reply / analyze-scheduling
server/             منطق الخادم المشترك (التحقق من الهوية، حدّ الطلبات، استدعاء Gemini)
server.ts           خادم Express للتشغيل المحلي أو الاستضافة التقليدية
src/                الواجهة (components/ و lib/)
public/privacy.html صفحة الخصوصية (مطلوبة لمراجعة Google)
firestore.rules     قواعد الأمان
```

## 1) التشغيل محلياً

```bash
npm install
cp .env.example .env      # ثم ضع GEMINI_API_KEY
npm run dev               # http://localhost:3000
```

## 2) إعداد Firebase / Google Cloud (مرة واحدة)

1. **Firebase Console → Authentication → Sign-in method:** فعّل *Google*.
2. **Authentication → Settings → Authorized domains:** أضف نطاق Vercel (مثل `your-app.vercel.app`) ونطاقك الخاص إن وُجد.
3. **Firestore Database:** أنشئ قاعدة بيانات، ثم انشر القواعد: الصق محتوى `firestore.rules` في تبويب Rules، أو نفّذ `npx firebase-tools deploy --only firestore:rules`.
4. **Google Cloud Console** (نفس مشروع Firebase) **→ APIs & Services → Library:** فعّل **Gmail API** و**Google Calendar API**.
5. **OAuth consent screen:** أضف النطاقات `gmail.modify` و`calendar.readonly` وأضف حسابك كـ Test user. رابط سياسة الخصوصية: `https://نطاقك/privacy.html`.

> صلاحية `gmail.modify` **مقيّدة (Restricted)**: للاستخدام العام خارج حسابات الاختبار تحتاج إلى مراجعة Google (وغالباً تقييم أمني CASA). أثناء التطوير استخدم وضع Testing (حتى 100 مستخدم اختبار).

## 3) النشر على Vercel

1. ارفع المشروع إلى GitHub:
   ```bash
   git init && git add . && git commit -m "init"
   git branch -M main
   git remote add origin https://github.com/USER/REPO.git && git push -u origin main
   ```
2. في Vercel: **Add New → Project** واختر المستودع (يُكتشف Vite تلقائياً).
3. **Environment Variables** أضف:
   | المتغير | ملاحظة |
   |---|---|
   | `GEMINI_API_KEY` | سرّي، للخادم فقط |
   | `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` | قيمها في `.env.example` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_STORAGE_BUCKET` | اختيارية |
4. اضغط **Deploy**. ثم أضف نطاق Vercel إلى *Authorized domains* في Firebase (الخطوة 2.2).

## 4) استضافة بديلة (Render / Railway / VPS)

```bash
npm install && npm run build
npm start        # يخدم dist + واجهة /api على المنفذ PORT
```

## ما الذي تغيّر عن النسخة الأصلية

- **أخطاء:** إصلاح انهيار تبويب «الموجز» عند صندوق فارغ، وانهيار البحث مع رسائل بلا عنوان، وحذف مسار `generate-briefing` الميت، واستيراد صورة الـ hero بشكل صحيح للبناء، وتصحيح `start`، ومعالجة انتهاء جلسة Google برسالة واضحة، وفك ترميز العناوين العربية المشفّرة (MIME).
- **أمان:** مسارات `/api/*` تتحقق الآن من Firebase ID Token وتطبّق حدّاً للطلبات وتتحقق من المدخلات؛ تعليمات منع حقن الأوامر في الـ prompts؛ تنظيف الرسائل المزعجة يتطلب تأكيداً ويعرض القائمة؛ عرض HTML للرسائل داخل iframe معزول وبلا صور خارجية افتراضياً؛ إزالة صلاحية `gmail.compose` الزائدة؛ قواعد Firestore مشدَّدة؛ لا تُرسَل عناوين أحداث التقويم إلى الذكاء الاصطناعي.
- **الجودة:** التصنيف والردود والجدولة تستخدم نص الرسالة الكامل (مقتطعاً) لا السطر القصير فقط؛ الكلمات ذات الأولوية والجهات المحظورة تُنفَّذ برمجياً؛ الردود بلغة الرسالة الأصلية؛ ترويسات `In-Reply-To`/`References` صحيحة؛ ترقيم صفحات؛ تحميل تلقائي بعد الدخول؛ الإعدادات تُحفظ في Firestore مع نسخة محلية.
- **الملفات:** تقسيم `App.tsx` إلى مكوّنات، وإزالة ادعاءات تسويقية غير صحيحة من صفحة الهبوط، وإضافة صفحة خصوصية.

## حدود معروفة

- حدّ الطلبات يعمل في ذاكرة كل instance على Vercel (تقريبي). لحدّ صارم استخدم Upstash Redis / Vercel KV.
- رمز Google صالح نحو ساعة ويُحفظ في الذاكرة فقط؛ بعد انتهائه أو إعادة تحميل الصفحة يُطلب تسجيل الدخول مجدداً (لا refresh token في تدفق Firebase من المتصفح).
- تحقق من تحميل قواعد Firestore؛ وإلا تُحفظ الإعدادات محلياً فقط.
- تحقق من اسم النموذج `gemini-3.1-flash-lite` (يمكن تغييره بـ `GEMINI_MODEL`) ومن حصص مفتاح Gemini (قد تُستخدم بيانات الواجهة المجانية لتحسين منتجات Google حسب شروطها؛ راجعها قبل معالجة بريد حقيقي).
