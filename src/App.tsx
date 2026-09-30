import { useEffect, useRef, useState } from 'react';
import { Bot, Coffee, Inbox, LogOut, Settings } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { User } from 'firebase/auth';

import type { Briefing, ClassifiedEmail, EmailAttachment, Memory, Category, SchedulingSuggestion } from './types';
import { getAccessToken, googleSignIn, logout, subscribeAuth } from './lib/auth';
import { apiPost, ApiError } from './lib/api';
import { GoogleAuthError } from './lib/google';
import { fetchBusySlots } from './lib/calendar';
import { createDraft, deleteMessage, fetchAttachment, fetchEmails, markAsRead, sendReply } from './lib/gmail';
import { emptyMemory, loadMemory, normalizeMemory, saveMemory } from './lib/memoryStore';
import { CATEGORY_LABELS } from './lib/categories';

import Landing from './components/Landing';
import InboxView from './components/InboxView';
import BriefingView from './components/BriefingView';
import MemoryView from './components/MemoryView';
import EmailModal from './components/EmailModal';
import PrintView from './components/PrintView';
import ConfirmDialog from './components/ConfirmDialog';
import type { EmailActions } from './components/EmailCard';

type Tab = 'inbox' | 'briefing' | 'memory';
type Toast = { type: 'success' | 'error' | 'info'; text: string };

interface AnalyzeResponse {
  classifications: { id: string; category: Category; reason: string }[];
  briefing: Briefing;
}

const EMPTY_INBOX_BRIEFING: Briefing = {
  executiveSummary: 'لا توجد رسائل في صندوق الوارد حالياً.',
  topPriorities: [],
  sentiment: 'هادئ',
};

const requireToken = (): string => {
  const token = getAccessToken();
  if (!token) throw new GoogleAuthError();
  return token;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  const [emails, setEmails] = useState<ClassifiedEmail[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [briefing, setBriefing] = useState<Briefing | null>(null);

  const [tab, setTab] = useState<Tab>('inbox');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [memory, setMemory] = useState<Memory>(emptyMemory);
  const [memoryReady, setMemoryReady] = useState(false);
  const [savingMemory, setSavingMemory] = useState(false);

  const [selectedEmail, setSelectedEmail] = useState<ClassifiedEmail | null>(null);
  const [cleanTargets, setCleanTargets] = useState<ClassifiedEmail[] | null>(null);
  const [cleaning, setCleaning] = useState(false);

  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoLoaded = useRef(false);

  /* ---------- أدوات مساعدة ---------- */

  const notify = (type: Toast['type'], text: string) => {
    setToast({ type, text });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 6000);
  };

  const resetData = () => {
    setEmails([]);
    setNextPageToken(null);
    setBriefing(null);
    setSelectedEmail(null);
    setCleanTargets(null);
    autoLoaded.current = false;
  };

  const expireSession = (message: string) => {
    setSessionActive(false);
    setSessionMessage(message);
    autoLoaded.current = false;
  };

  const reportError = (prefix: string, err: unknown) => {
    if (err instanceof GoogleAuthError) return expireSession(err.message);
    if (err instanceof ApiError) return notify('error', err.message);
    console.error(prefix, err);
    notify('error', `${prefix}: ${err instanceof Error ? err.message : 'خطأ غير معروف'}`);
  };

  const updateEmail = (id: string, patch: Partial<ClassifiedEmail>) =>
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const removeEmail = (id: string) => setEmails((prev) => prev.filter((e) => e.id !== id));

  /* ---------- المصادقة والذاكرة ---------- */

  useEffect(
    () =>
      subscribeAuth((u) => {
        setUser(u);
        setAuthReady(true);
        if (!u) {
          setSessionActive(false);
          resetData();
        }
      }),
    [],
  );

  useEffect(() => {
    if (!user) {
      setMemory(emptyMemory);
      setMemoryReady(false);
      return;
    }
    let cancelled = false;
    loadMemory(user.uid).then((m) => {
      if (cancelled) return;
      setMemory(m);
      setMemoryReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  useEffect(() => {
    if (sessionActive && memoryReady && !autoLoaded.current) {
      autoLoaded.current = true;
      void loadEmails(false);
    }
  }, [sessionActive, memoryReady]);

  const handleLogin = async () => {
    try {
      setSigningIn(true);
      setSessionMessage(null);
      await googleSignIn();
      setSessionActive(true);
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        console.error('Login failed', err);
        setSessionMessage(`تعذّر تسجيل الدخول: ${err?.message || 'خطأ غير معروف'}`);
      }
    } finally {
      setSigningIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setSessionMessage(null);
  };

  const handleSaveMemory = async (m: Memory) => {
    if (!user) return;
    setSavingMemory(true);
    try {
      setMemory(await saveMemory(user.uid, m));
      notify('success', 'تم حفظ الإعدادات بنجاح.');
    } catch (err) {
      console.error('Save memory failed', err);
      setMemory(normalizeMemory(m));
      notify('error', 'حُفظت الإعدادات على هذا الجهاز فقط؛ تعذّر الحفظ السحابي (تحقق من قواعد Firestore).');
    } finally {
      setSavingMemory(false);
    }
  };

  /* ---------- جلب الرسائل وتحليلها ---------- */

  const classify = async (batch: ClassifiedEmail[], updateBriefing: boolean) => {
    setClassifying(true);
    try {
      const data = await apiPost<AnalyzeResponse>('analyze-inbox', {
        emails: batch.map((e) => ({ id: e.id, from: e.from, subject: e.subject, body: e.body || e.snippet })),
        memory,
      });
      if (updateBriefing) setBriefing(data.briefing);
      const byId = new Map(data.classifications.map((c) => [c.id, c]));
      setEmails((prev) =>
        prev.map((e) => {
          const c = byId.get(e.id);
          return c ? { ...e, category: c.category, reason: c.reason } : e;
        }),
      );
    } catch (err) {
      reportError('فشل تحليل الرسائل', err);
    } finally {
      setClassifying(false);
    }
  };

  const loadEmails = async (append: boolean) => {
    try {
      setLoading(true);
      const { emails: fetched, nextPageToken: next } = await fetchEmails(requireToken(), {
        pageToken: append ? nextPageToken : null,
      });
      setNextPageToken(next);

      if (append) {
        setEmails((prev) => [...prev, ...fetched.filter((f) => !prev.some((p) => p.id === f.id))]);
      } else {
        setEmails(fetched);
        if (fetched.length === 0) setBriefing(EMPTY_INBOX_BRIEFING);
      }
      if (fetched.length === 0) return;

      setLoading(false);
      await classify(fetched, !append);
    } catch (err) {
      reportError('تعذّر جلب الرسائل', err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- تنظيف الرسائل المزعجة (بتأكيد) ---------- */

  const requestClean = () => {
    const targets = emails.filter((e) => e.category === 'Promotional/Spam');
    if (targets.length === 0) return notify('info', 'لا توجد رسائل مصنّفة كمزعجة حالياً.');
    setCleanTargets(targets);
  };

  const confirmClean = async () => {
    if (!cleanTargets) return;
    setCleaning(true);
    try {
      const token = requireToken();
      const results = await Promise.allSettled(cleanTargets.map((e) => deleteMessage(token, e.id)));

      const authFailure = results.find(
        (r): r is PromiseRejectedResult => r.status === 'rejected' && r.reason instanceof GoogleAuthError,
      );
      if (authFailure) throw authFailure.reason;

      const okIds = cleanTargets.filter((_, i) => results[i].status === 'fulfilled').map((e) => e.id);
      const failed = cleanTargets.length - okIds.length;
      setEmails((prev) => prev.filter((e) => !okIds.includes(e.id)));

      if (okIds.length > 0) notify('success', `نُقلت ${okIds.length} رسالة إلى سلة المهملات (يمكن استرجاعها من Gmail).`);
      if (failed > 0) notify('error', `تعذّر نقل ${failed} رسالة. حاول لاحقاً.`);
    } catch (err) {
      reportError('فشل تنظيف الرسائل', err);
    } finally {
      setCleaning(false);
      setCleanTargets(null);
    }
  };

  /* ---------- إجراءات الرسالة الواحدة ---------- */

  const actions: EmailActions = {
    async reply(email) {
      updateEmail(email.id, { isReplying: true });
      try {
        const data = await apiPost<{ reply: string }>('generate-reply', {
          from: email.from,
          subject: email.subject,
          emailContent: email.body || email.snippet,
          category: email.category,
          memory: { customMemory: memory.customMemory },
        });
        updateEmail(email.id, { suggestedReply: data.reply, isReplying: false });
      } catch (err) {
        updateEmail(email.id, { isReplying: false });
        reportError('فشل توليد الرد', err);
      }
    },

    async schedule(email) {
      updateEmail(email.id, { isAnalyzingSchedule: true });
      try {
        const busy = await fetchBusySlots(requireToken());
        const data = await apiPost<SchedulingSuggestion>('analyze-scheduling', {
          from: email.from,
          subject: email.subject,
          emailContent: email.body || email.snippet,
          busy,
          currentTime: new Date().toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        updateEmail(email.id, { schedulingSuggestions: data, isAnalyzingSchedule: false });
      } catch (err) {
        updateEmail(email.id, { isAnalyzingSchedule: false });
        reportError('فشل تحليل الجدولة', err);
      }
    },

    async sendReply(email, customText) {
      const text = customText || email.suggestedReply;
      if (!text) return;
      if (!window.confirm(`هل أنت متأكد من إرسال هذا الرد إلى ${email.from}؟\n\n${text}`)) return;
      try {
        setLoading(true);
        await sendReply(requireToken(), email, text);
        notify('success', 'تم إرسال الرد بنجاح.');
        removeEmail(email.id);
      } catch (err) {
        reportError('فشل إرسال الرد', err);
      } finally {
        setLoading(false);
      }
    },

    async saveDraft(email) {
      if (!email.suggestedReply) return;
      try {
        setLoading(true);
        await createDraft(requireToken(), email, email.suggestedReply);
        notify('success', 'تم حفظ المسودة في Gmail.');
        updateEmail(email.id, { suggestedReply: undefined });
      } catch (err) {
        reportError('فشل حفظ المسودة', err);
      } finally {
        setLoading(false);
      }
    },

    dismissReply: (email) => updateEmail(email.id, { suggestedReply: undefined }),
    dismissSchedule: (email) => updateEmail(email.id, { schedulingSuggestions: undefined }),
    open: (email) => setSelectedEmail(email),

    async markRead(email) {
      try {
        await markAsRead(requireToken(), email.id);
        removeEmail(email.id);
      } catch (err) {
        reportError('فشل تحديد الرسالة كمقروءة', err);
      }
    },

    async remove(email) {
      if (!window.confirm('نقل هذه الرسالة إلى سلة المهملات؟')) return;
      try {
        await deleteMessage(requireToken(), email.id);
        removeEmail(email.id);
      } catch (err) {
        reportError('فشل حذف الرسالة', err);
      }
    },

    async download(messageId: string, attachment: EmailAttachment) {
      try {
        setLoading(true);
        const bytes = await fetchAttachment(requireToken(), messageId, attachment.id);
        const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: attachment.mimeType }));
        const a = document.createElement('a');
        a.href = url;
        a.download = attachment.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
      } catch (err) {
        reportError('فشل تحميل الملف المرفق', err);
      } finally {
        setLoading(false);
      }
    },
  };

  /* ---------- العرض ---------- */

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-bold" dir="rtl">
        جاري التحميل...
      </div>
    );
  }

  if (!user || !sessionActive) {
    return <Landing onLogin={handleLogin} loading={signingIn} message={sessionMessage} />;
  }

  const tabClass = (active: boolean) =>
    `px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap flex-1 sm:flex-none justify-center ${
      active ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
    }`;

  const toastClass: Record<Toast['type'], string> = {
    success: 'bg-emerald-600',
    error: 'bg-rose-600',
    info: 'bg-slate-800',
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50 font-sans text-right pb-24 print:hidden" dir="rtl">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-slate-900 truncate">المساعد الذكي</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden md:block text-left ml-4">
                <p className="text-sm font-medium text-slate-900">{user.displayName}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2.5 hover:bg-slate-100 rounded-full transition-colors text-slate-600 active:scale-95"
                title="تسجيل الخروج"
                aria-label="تسجيل الخروج"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          <div className="flex gap-1.5 p-1 bg-slate-200/50 rounded-2xl w-full sm:w-fit overflow-x-auto no-scrollbar" role="tablist">
            <button role="tab" aria-selected={tab === 'inbox'} onClick={() => setTab('inbox')} className={tabClass(tab === 'inbox')}>
              <Inbox className="w-4 h-4" /> البريد
            </button>
            <button role="tab" aria-selected={tab === 'briefing'} onClick={() => setTab('briefing')} className={tabClass(tab === 'briefing')}>
              <Coffee className="w-4 h-4" /> الموجز
            </button>
            <button role="tab" aria-selected={tab === 'memory'} onClick={() => setTab('memory')} className={tabClass(tab === 'memory')}>
              <Settings className="w-4 h-4" /> الذاكرة
            </button>
          </div>

          {tab === 'memory' && <MemoryView memory={memory} saving={savingMemory} onSave={handleSaveMemory} />}
          {tab === 'briefing' && <BriefingView briefing={briefing} emails={emails} />}
          {tab === 'inbox' && (
            <InboxView
              emails={emails}
              filter={filter}
              setFilter={setFilter}
              search={search}
              setSearch={setSearch}
              loading={loading}
              classifying={classifying}
              hasMore={Boolean(nextPageToken)}
              onRefresh={() => loadEmails(false)}
              onLoadMore={() => loadEmails(true)}
              onCleanRequest={requestClean}
              actions={actions}
            />
          )}
        </main>

        <AnimatePresence>
          {selectedEmail && (
            <EmailModal key={selectedEmail.id} email={selectedEmail} onClose={() => setSelectedEmail(null)} onDownload={actions.download} />
          )}

          {(loading || classifying) && (
            <motion.div
              key="busy"
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white shadow-2xl rounded-2xl px-6 py-3 border border-blue-100 flex items-center gap-4 z-50"
              role="status"
            >
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
              </div>
              <span className="text-sm font-bold text-slate-700">
                {classifying ? 'جاري تحليل وتصنيف الرسائل بالذكاء الاصطناعي...' : 'جاري المعالجة...'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <ConfirmDialog
          open={cleanTargets !== null}
          title={`نقل ${cleanTargets?.length ?? 0} رسالة إلى سلة المهملات؟`}
          confirmLabel="نقل إلى السلة"
          danger
          busy={cleaning}
          onConfirm={confirmClean}
          onCancel={() => !cleaning && setCleanTargets(null)}
        >
          <p className="mb-3">
            صنّفها الذكاء الاصطناعي كـ «{CATEGORY_LABELS['Promotional/Spam']}». قد يخطئ التصنيف أحياناً، لذا راجع القائمة. الرسائل
            تبقى في سلة Gmail ويمكن استرجاعها خلال 30 يوماً.
          </p>
          <ul className="space-y-2">
            {cleanTargets?.map((e) => (
              <li key={e.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="font-bold text-slate-800 truncate">{e.subject || '(بدون عنوان)'}</p>
                <p className="text-xs text-slate-400 truncate">{e.from}</p>
              </li>
            ))}
          </ul>
        </ConfirmDialog>

        {toast && (
          <div
            role="status"
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[150] max-w-[90vw] px-5 py-3 rounded-2xl text-sm font-bold text-white shadow-xl ${toastClass[toast.type]}`}
          >
            {toast.text}
          </div>
        )}
      </div>

      {selectedEmail && <PrintView email={selectedEmail} />}
    </>
  );
}
