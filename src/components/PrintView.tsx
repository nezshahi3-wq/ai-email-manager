import type { ClassifiedEmail } from '../types';
import { formatDate } from '../lib/format';

/** نسخة الطباعة: تظهر فقط عند الطباعة، بينما تُخفى بقية الواجهة عبر print:hidden. */
export default function PrintView({ email }: { email: ClassifiedEmail }) {
  return (
    <div className="hidden print:block bg-white p-10" dir="rtl">
      <div className="border-b-2 border-slate-900 pb-6 mb-8">
        <h1 className="text-3xl font-bold mb-2">{email.subject}</h1>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <p><strong>من:</strong> {email.from}</p>
          <p><strong>التاريخ:</strong> {formatDate(email.date)}</p>
        </div>
      </div>
      <div className="whitespace-pre-wrap text-lg leading-relaxed">{email.body || email.snippet}</div>
      <div className="mt-12 pt-6 border-t border-slate-200 text-xs text-slate-400">تمت الطباعة بواسطة المساعد الذكي</div>
    </div>
  );
}
