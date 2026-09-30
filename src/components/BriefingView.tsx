import { Coffee, Sparkles, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import type { Briefing, ClassifiedEmail } from '../types';

interface Props {
  briefing: Briefing | null;
  emails: ClassifiedEmail[];
}

export default function BriefingView({ briefing, emails }: Props) {
  const priorities = briefing?.topPriorities ?? [];

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-6 sm:p-10 text-white shadow-2xl shadow-blue-200/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black">الموجز التنفيذي</h2>
                <p className="text-blue-100 font-medium opacity-80">تحليل الذكاء الاصطناعي لبريدك</p>
              </div>
            </div>
            {briefing ? (
              <p className="text-xl leading-relaxed font-medium text-blue-50">{briefing.executiveSummary}</p>
            ) : (
              <p className="text-lg opacity-60 italic">لا يوجد تحليل متاح حالياً. قم بتحديث البريد للبدء.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
            أهم الأولويات المقترحة
          </h3>
          <div className="space-y-4">
            {priorities.map((priority, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {i + 1}
                </div>
                <p className="text-slate-700 font-bold leading-snug">{priority}</p>
              </motion.div>
            ))}
            {priorities.length === 0 && (
              <div className="text-center py-12">
                <Coffee className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-medium">
                  {briefing ? 'لا توجد أولويات عاجلة الآن.' : 'ابدأ تحليل البريد لتظهر لك الأولويات هنا'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
          <h3 className="text-sm font-black text-slate-400 mb-4 tracking-widest text-left">INBOX STATUS</h3>
          <div className="text-4xl font-black text-blue-400">{briefing?.sentiment || '—'}</div>
          <p className="text-slate-500 text-xs mt-4 font-medium">يعتمد هذا التقييم على نبرة الرسائل التي تم تحليلها حالياً.</p>
        </div>

        <div className="bg-blue-50 rounded-[2.5rem] p-8 border border-blue-100">
          <h3 className="text-sm font-black text-blue-900 mb-4 tracking-widest text-left">QUICK STATS</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 text-sm font-bold">رسائل عاجلة</span>
              <span className="bg-rose-500 text-white px-3 py-1 rounded-full text-xs font-black">
                {emails.filter((e) => e.category === 'Urgent Business').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 text-sm font-bold">بانتظار ردك</span>
              <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-black">
                {emails.filter((e) => e.category === 'Personal Follow-up').length}
              </span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-blue-200">
              <span className="text-slate-900 text-sm font-black">الإجمالي</span>
              <span className="text-blue-700 font-black">{emails.length}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
