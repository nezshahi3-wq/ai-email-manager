import { useEffect, useMemo, useState } from 'react';
import { Download, FileText, Mail, Paperclip, Printer, X } from 'lucide-react';
import { motion } from 'motion/react';
import type { ClassifiedEmail, EmailAttachment } from '../types';
import { formatDate, formatSize } from '../lib/format';

interface Props {
  email: ClassifiedEmail;
  onClose: () => void;
  onDownload: (messageId: string, attachment: EmailAttachment) => void;
}

export default function EmailModal({ email, onClose, onDownload }: Props) {
  const [showHtml, setShowHtml] = useState(false);
  const [showImages, setShowImages] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // عرض HTML داخل iframe معزول: بدون سكربتات، وبدون صور خارجية إلا بموافقة المستخدم (حماية من التتبع)
  const srcDoc = useMemo(() => {
    if (!email.htmlBody) return '';
    const csp = `default-src 'none'; style-src 'unsafe-inline'; font-src data:; img-src data: ${showImages ? 'https: http:' : ''}`;
    return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><base target="_blank"><style>body{font-family:system-ui,sans-serif;margin:16px;word-break:break-word}img{max-width:100%;height:auto}</style></head><body>${email.htmlBody}</body></html>`;
  }, [email.htmlBody, showImages]);

  const tabClass = (active: boolean) =>
    `px-4 py-1.5 rounded-lg text-xs font-black transition-all ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" dir="rtl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={email.subject || 'رسالة'}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="px-5 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 truncate leading-tight">{email.subject || '(بدون عنوان)'}</h2>
              <p className="text-xs text-slate-500 font-medium truncate">{email.from}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">طباعة</span>
            </button>
            <button onClick={onClose} aria-label="إغلاق" className="p-2.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 scrollbar-hide">
          <div className="flex flex-wrap gap-2 justify-between items-center text-[10px] font-black text-slate-400 tracking-widest bg-slate-50 p-4 rounded-2xl">
            <span>تاريخ الرسالة: {formatDate(email.date)}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => setShowHtml(false)} className={tabClass(!showHtml)}>نص بسيط</button>
            {email.htmlBody && (
              <button onClick={() => setShowHtml(true)} className={tabClass(showHtml)}>عرض التصميم الأصلي</button>
            )}
            {showHtml && !showImages && (
              <button onClick={() => setShowImages(true)} className="px-4 py-1.5 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100">
                عرض الصور الخارجية
              </button>
            )}
          </div>

          <div className="min-h-[300px] border border-slate-100 rounded-2xl overflow-hidden shadow-inner">
            {showHtml && email.htmlBody ? (
              <iframe
                srcDoc={srcDoc}
                className="w-full min-h-[600px] border-none bg-white"
                title="محتوى الرسالة"
                sandbox="allow-popups allow-popups-to-escape-sandbox"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="text-slate-700 leading-relaxed text-base sm:text-lg font-medium whitespace-pre-wrap font-sans p-5 sm:p-8 bg-white break-words">
                {email.body || email.snippet}
              </div>
            )}
          </div>

          {email.attachments && email.attachments.length > 0 && (
            <div className="pt-8 border-t border-slate-100">
              <h4 className="text-xs font-black text-slate-900 mb-4 flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                الملفات المرفقة ({email.attachments.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {email.attachments.map((att) => (
                  <div key={att.id} className="flex items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-5 h-5 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{att.filename}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{formatSize(att.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onDownload(email.id, att)}
                      aria-label={`تحميل ${att.filename}`}
                      className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
