import { ArrowRight, Bot, Check, Coffee, Layers, MessageSquare, ShieldAlert, Sparkles, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import heroImage from '../assets/images/hero.jpg';

interface Props {
  onLogin: () => void;
  loading: boolean;
  message: string | null;
}

const FEATURES = [
  { icon: <ShieldAlert className="text-rose-600" />, title: 'فرز الأولويات', desc: 'تصنيف الرسائل بناءً على سياق المحتوى لتمييز العمل العاجل عن غيره.' },
  { icon: <MessageSquare className="text-blue-600" />, title: 'مسودات ذكية', desc: 'توليد مسودات ردود مهنية بناءً على محتوى الرسالة الواردة لتوفير وقت الكتابة.' },
  { icon: <Coffee className="text-amber-600" />, title: 'ملخص الأعمال', desc: 'الحصول على موجز منظم للنقاط الرئيسية والطلبات المعلقة في صندوق الوارد.' },
];

export default function Landing({ onLogin, loading, message }: Props) {
  return (
    <div className="min-h-screen bg-white font-sans text-right selection:bg-blue-100" dir="rtl">
      <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900">ASSISTANT.AI</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
          <a href="#features" className="hover:text-slate-900 transition-colors">المميزات</a>
          <a href="/privacy.html" className="hover:text-slate-900 transition-colors">الخصوصية</a>
        </div>
        <button
          onClick={onLogin}
          disabled={loading}
          className="px-5 py-2.5 bg-slate-900 text-white rounded-full text-sm font-bold hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-60"
        >
          تسجيل الدخول
        </button>
      </nav>

      {message && (
        <div className="max-w-3xl mx-auto px-6">
          <div role="alert" className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-5 py-3 text-sm font-bold">
            {message}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 pt-16 pb-24 grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-600 text-xs font-bold tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            مساعد بريد يعمل بالذكاء الاصطناعي
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 leading-[1.15] tracking-tight">
            نظّم بريدك، <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-blue-600 to-indigo-500">بذكاء عملي.</span>
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed max-w-lg">
            حل تقني يساعدك على فرز الرسائل المهمة، تلخيص المحتوى، واقتراح الردود المناسبة بناءً على سياق العمل الفعلي.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <button
              onClick={onLogin}
              disabled={loading}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-[2rem] font-black text-lg hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-200 transition-all active:scale-95 group shadow-xl disabled:opacity-60"
            >
              {loading ? 'جاري تسجيل الدخول...' : 'سجّل الدخول مع Google'}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-[-4px] transition-transform" />
            </button>
            <p className="text-sm text-slate-400 font-medium">يعمل مع Gmail وGoogle Calendar</p>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-100">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <Check className="w-4 h-4 text-emerald-500" />
                لا نخزّن رسائلك
              </div>
              <p className="text-sm text-slate-400">تُعالَج الرسائل لحظياً ولا نحتفظ بنسخة منها على خوادمنا.</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <Check className="w-4 h-4 text-emerald-500" />
                بتحكّم كامل منك
              </div>
              <p className="text-sm text-slate-400">لا يُرسَل أي ردّ قبل تأكيدك، ويمكنك الاكتفاء بحفظ مسودة.</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-indigo-100/50 rounded-full blur-3xl" />
          <div className="relative bg-white rounded-[2.5rem] p-4 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden">
            <img src={heroImage} alt="" className="w-full h-auto rounded-[2rem] shadow-inner" />
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-12 -left-2 sm:-left-8 bg-white p-4 rounded-2xl shadow-xl border border-slate-50 flex items-center gap-4 max-w-[200px]"
            >
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-black">تحليل البريد</p>
                <p className="text-xs font-bold text-slate-900">تصنيف فوري عاجل</p>
              </div>
            </motion.div>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute bottom-12 -right-2 sm:-right-8 bg-white p-4 rounded-2xl shadow-xl border border-slate-50 flex items-center gap-4 max-w-[220px]"
            >
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Layers className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-black">الجدولة الذكية</p>
                <p className="text-xs font-bold text-slate-900">اقتراح مواعيد من تقويمك</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div id="features" className="bg-slate-50 py-24">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-4 mb-16">
          <h2 className="text-4xl font-black text-slate-900">نظام إدارة البريد للمحترفين</h2>
          <p className="text-slate-500 max-w-2xl mx-auto">أدوات مصممة لرفع كفاءة التعامل مع البريد الإلكتروني اليومي المزدحم.</p>
        </div>
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white p-8 rounded-[2rem] border border-slate-100 hover:border-blue-200 transition-colors group">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-50 transition-colors">{f.icon}</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
              <p className="text-slate-500 leading-relaxed text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="py-12 border-t border-slate-100 text-center text-slate-400 text-sm">
        <div className="flex items-center justify-center gap-6 mb-4">
          <a href="/privacy.html" className="hover:text-slate-900 transition-colors">سياسة الخصوصية</a>
        </div>
        <p>© {new Date().getFullYear()} Assistant.AI</p>
      </footer>
    </div>
  );
}
