import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileEdit,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Paperclip,
  RefreshCw,
  Send,
  Trash2,
} from 'lucide-react';
import type { ClassifiedEmail, EmailAttachment } from '../types';
import { CATEGORY_LABELS, CATEGORY_STYLES } from '../lib/categories';
import { formatDate, formatSize } from '../lib/format';

export interface EmailActions {
  reply(email: ClassifiedEmail): void;
  schedule(email: ClassifiedEmail): void;
  sendReply(email: ClassifiedEmail, text?: string): void;
  saveDraft(email: ClassifiedEmail): void;
  dismissReply(email: ClassifiedEmail): void;
  dismissSchedule(email: ClassifiedEmail): void;
  open(email: ClassifiedEmail): void;
  markRead(email: ClassifiedEmail): void;
  remove(email: ClassifiedEmail): void;
  download(messageId: string, attachment: EmailAttachment): void;
}

export default function EmailCard({ email, actions }: { email: ClassifiedEmail; actions: EmailActions }) {
  const category = email.category;
  const sched = email.schedulingSuggestions;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 hover:shadow-md transition-shadow group relative overflow-hidden">
      <div className="absolute top-0 right-0 h-1 w-full bg-slate-100 group-hover:bg-blue-100 transition-colors">
        <div className={`h-full transition-all duration-500 ${category ? `w-full ${CATEGORY_STYLES[category].bar}` : 'w-0'}`} />
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 line-clamp-2 text-sm sm:text-base leading-tight">{email.subject || '(بدون عنوان)'}</h3>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs sm:text-sm text-slate-500 truncate">{email.from}</p>
                <span className="w-1 h-1 bg-slate-200 rounded-full shrink-0" />
                <span className="text-[10px] sm:text-xs text-slate-400 whitespace-nowrap">{formatDate(email.date)}</span>
              </div>
            </div>

            <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
              <button
                onClick={() => actions.markRead(email)}
                className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                title="تحديد كمقروء وإخفاؤها من القائمة"
                aria-label="تحديد كمقروء"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => actions.remove(email)}
                className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                title="نقل إلى سلة المهملات"
                aria-label="حذف"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed">{email.snippet}</p>

          <div className="flex flex-wrap gap-2">
            {category && (
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black tracking-wider ${CATEGORY_STYLES[category].badge}`}>
                {CATEGORY_LABELS[category]}
              </div>
            )}
            {email.reason && (
              <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-3 py-1 rounded-full">{email.reason}</span>
            )}
          </div>

          {email.attachments && email.attachments.length > 0 && (
            <div className="pt-4 mt-2 border-t border-slate-50 space-y-2">
              <p className="text-[10px] font-black text-slate-400 tracking-widest flex items-center gap-1.5">
                <Paperclip className="w-3 h-3" />
                المرفقات ({email.attachments.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {email.attachments.map((att) => (
                  <div key={att.id} className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white hover:border-blue-200 transition-all">
                    {att.mimeType.startsWith('image/') ? <ImageIcon className="w-4 h-4 text-blue-500" /> : <FileText className="w-4 h-4 text-slate-400" />}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{att.filename}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{formatSize(att.size)}</p>
                    </div>
                    <button
                      onClick={() => actions.download(email.id, att)}
                      className="p-1.5 hover:bg-blue-600 hover:text-white text-slate-400 rounded-lg transition-colors"
                      title="تحميل"
                      aria-label={`تحميل ${att.filename}`}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 md:min-w-[240px] md:max-w-[260px]">
          {!email.suggestedReply && !sched && (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => actions.reply(email)}
                disabled={email.isReplying || !email.category}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {email.isReplying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                صياغة رد مهني
              </button>
              <button
                onClick={() => actions.schedule(email)}
                disabled={email.isAnalyzingSchedule}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors border border-blue-100 disabled:opacity-50"
              >
                {email.isAnalyzingSchedule ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CalendarIcon className="w-4 h-4" />}
                تنسيق اجتماع
              </button>
            </div>
          )}

          {sched && (
            <div className="space-y-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm">
              <span className="text-xs font-black text-emerald-700 flex items-center gap-1">
                <Clock className="w-3 h-3" /> مواعيد متاحة:
              </span>
              {sched.isMeetingRequest && sched.suggestedTimes.length > 0 ? (
                <div className="space-y-2">
                  {sched.suggestedTimes.map((time, idx) => (
                    <button
                      key={idx}
                      onClick={() =>
                        actions.sendReply(
                          email,
                          `شكراً لرسالتك. يسعدني الاجتماع بك في الموعد التالي المتاح في تقويمي:\n\n- ${time}\n\nيرجى تأكيد مناسبته لك.`,
                        )
                      }
                      className="w-full text-right p-2.5 text-[11px] bg-white rounded-lg border border-emerald-200 hover:border-emerald-400 transition-colors text-slate-700 font-bold"
                      title="إرسال ردّ يقترح هذا الموعد"
                    >
                      {time}
                    </button>
                  ))}
                  <p className="text-[10px] text-emerald-600 mt-2 italic">{sched.reasoning}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">لا توجد طلبات اجتماع في هذه الرسالة.</p>
              )}
              <button onClick={() => actions.dismissSchedule(email)} className="w-full py-1.5 text-[10px] text-slate-400 hover:text-slate-600 transition-colors font-bold">
                إغلاق
              </button>
            </div>
          )}

          {email.suggestedReply && (
            <div className="space-y-3 p-4 bg-blue-50 rounded-xl border border-blue-100 shadow-sm">
              <span className="text-xs font-black text-blue-600">رد المساعد المقترح:</span>
              <div className="bg-white/70 p-3 rounded-lg text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">{email.suggestedReply}</div>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => actions.sendReply(email)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition-all active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  إرسال الرد
                </button>
                <button
                  onClick={() => actions.saveDraft(email)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-white text-slate-700 rounded-xl text-xs font-black border border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  حفظ كمسودة
                </button>
                <button onClick={() => actions.dismissReply(email)} className="w-full py-1 text-[10px] text-slate-400 hover:text-slate-600 font-bold">
                  تجاهل
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => actions.open(email)}
            className="w-full flex items-center justify-center gap-2 py-2 text-[11px] font-black text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-dashed border-slate-200"
          >
            <Eye className="w-3.5 h-3.5" />
            عرض الرسالة كاملة
          </button>
        </div>
      </div>
    </div>
  );
}
