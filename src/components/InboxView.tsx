import { Filter, HelpCircle, Inbox, RefreshCw, ShieldAlert, Trash2, User as UserIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { ClassifiedEmail } from '../types';
import EmailCard, { type EmailActions } from './EmailCard';

interface Props {
  emails: ClassifiedEmail[];
  filter: string;
  setFilter: (f: string) => void;
  search: string;
  setSearch: (s: string) => void;
  loading: boolean;
  classifying: boolean;
  hasMore: boolean;
  onRefresh: () => void;
  onLoadMore: () => void;
  onCleanRequest: () => void;
  actions: EmailActions;
}

export default function InboxView(p: Props) {
  const q = p.search.trim().toLowerCase();
  const visible = p.emails
    .filter((e) => p.filter === 'all' || e.category === p.filter)
    .filter(
      (e) =>
        !q ||
        (e.subject ?? '').toLowerCase().includes(q) ||
        (e.from ?? '').toLowerCase().includes(q) ||
        (e.snippet ?? '').toLowerCase().includes(q),
    );

  const count = (cat: string) => p.emails.filter((e) => e.category === cat).length;
  const hasSpam = p.emails.some((e) => e.category === 'Promotional/Spam');
  const busy = p.loading || p.classifying;

  const filters = [
    { id: 'all', label: 'الكل', count: p.emails.length, icon: <Inbox className="w-4 h-4" /> },
    { id: 'Urgent Business', label: 'عمل عاجل', count: count('Urgent Business'), icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'Personal Follow-up', label: 'متابعة شخصية', count: count('Personal Follow-up'), icon: <UserIcon className="w-4 h-4" /> },
    { id: 'General Query', label: 'استفسار عام', count: count('General Query'), icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'Promotional/Spam', label: 'ترويجية/سبام', count: count('Promotional/Spam'), icon: <Trash2 className="w-4 h-4" /> },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="md:col-span-1 space-y-4">
        <div className="bg-white p-5 sm:p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              placeholder="البحث في البريد..."
              value={p.search}
              onChange={(e) => p.setSearch(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-slate-400 tracking-widest mb-2">التصنيفات</h4>
            {filters.map((cat) => (
              <button
                key={cat.id}
                onClick={() => p.setFilter(cat.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-bold transition-all ${
                  p.filter === cat.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {cat.icon}
                  <span>{cat.label}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${p.filter === cat.id ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-100 space-y-2">
            <button
              onClick={p.onRefresh}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200 disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
              تحديث القائمة
            </button>
            <button
              onClick={p.onCleanRequest}
              disabled={busy || !hasSpam}
              className="w-full py-2.5 text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors disabled:opacity-40 disabled:hover:text-slate-400"
            >
              تنظيف الرسائل المزعجة
            </button>
          </div>
        </div>
      </div>

      <div className="md:col-span-3 space-y-4">
        <AnimatePresence>
          {visible.map((email) => (
            <motion.div key={email.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
              <EmailCard email={email} actions={p.actions} />
            </motion.div>
          ))}
        </AnimatePresence>

        {visible.length === 0 && !p.loading && (
          <div className="text-center py-24 text-slate-400 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Inbox className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">القائمة نظيفة</h3>
            <p className="text-slate-400 font-medium">لا توجد رسائل في هذا التصنيف حالياً.</p>
          </div>
        )}

        {p.hasMore && (
          <div className="flex justify-center pt-2">
            <button
              onClick={p.onLoadMore}
              disabled={busy}
              className="px-8 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
            >
              تحميل المزيد من الرسائل
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
