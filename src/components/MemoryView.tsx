import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Save, Settings, X } from 'lucide-react';
import { motion } from 'motion/react';
import type { Memory } from '../types';

interface Props {
  memory: Memory;
  saving: boolean;
  onSave: (memory: Memory) => void;
}

function TagInput({
  label,
  hint,
  placeholder,
  tags,
  tagClass,
  normalize,
  onChange,
}: {
  label: string;
  hint: string;
  placeholder: string;
  tags: string[];
  tagClass: string;
  normalize?: (v: string) => string;
  onChange: (tags: string[]) => void;
}) {
  const [value, setValue] = useState('');

  const add = () => {
    const v = (normalize ? normalize(value) : value).trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setValue('');
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-black text-slate-900 tracking-wider">{label}</label>
      <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-200 min-h-[100px] items-start">
        {tags.map((tag, i) => (
          <span key={tag} className={`flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-lg text-sm font-bold ${tagClass}`}>
            {tag}
            <button type="button" aria-label={`حذف ${tag}`} onClick={() => onChange(tags.filter((_, idx) => idx !== i))}>
              <X className="w-3 h-3 text-slate-400 hover:text-rose-500" />
            </button>
          </span>
        ))}
        <div className="flex items-center gap-1 min-w-[200px] flex-1">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                add();
              }
            }}
            placeholder={placeholder}
            className="bg-transparent border-none outline-none text-sm font-medium flex-1 min-w-0"
          />
          <button type="button" onClick={add} aria-label="إضافة" className="p-1 text-slate-400 hover:text-blue-600">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
      <p className="text-xs text-slate-400">{hint}</p>
    </div>
  );
}

export default function MemoryView({ memory, saving, onSave }: Props) {
  const [draft, setDraft] = useState<Memory>(memory);
  useEffect(() => setDraft(memory), [memory]);

  const SaveButton = ({ large }: { large?: boolean }) => (
    <button
      onClick={() => onSave(draft)}
      disabled={saving}
      className={
        large
          ? 'flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-100'
          : 'flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50'
      }
    >
      {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
      حفظ التغييرات
    </button>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-8 shadow-sm space-y-8">
      <div className="flex flex-wrap gap-4 items-center justify-between border-b border-slate-100 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
            <Settings className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">تطوير مهارات المساعد</h2>
            <p className="text-sm text-slate-500">قم بتزويد المساعد بقواعد خاصة وذاكرة لعملك</p>
          </div>
        </div>
        <SaveButton />
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <TagInput
          label="الكلمات المفتاحية ذات الأولوية"
          hint="أي رسالة تحتوي إحدى هذه الكلمات في العنوان أو النص تُصنَّف «عمل عاجل» تلقائياً."
          placeholder="أضف كلمة (مثل: عاجل، عقد، طلب)..."
          tags={draft.priorityKeywords}
          tagClass="text-blue-600"
          onChange={(priorityKeywords) => setDraft((d) => ({ ...d, priorityKeywords }))}
        />
        <TagInput
          label="جهات اتصال مزعجة"
          hint="بريد كامل أو نطاق (promo@shop.com أو @shop.com). رسائلها تُصنَّف «سبام» تلقائياً ولا تُرسَل للذكاء الاصطناعي."
          placeholder="أضف بريداً أو نطاقاً..."
          tags={draft.blockedContacts}
          tagClass="text-slate-600"
          normalize={(v) => v.toLowerCase()}
          onChange={(blockedContacts) => setDraft((d) => ({ ...d, blockedContacts }))}
        />

        <div className="md:col-span-2 space-y-4">
          <label htmlFor="custom-memory" className="block text-sm font-black text-slate-900 tracking-wider">
            ذاكرة المساعد والتعليمات الخاصة
          </label>
          <textarea
            id="custom-memory"
            value={draft.customMemory}
            maxLength={4000}
            onChange={(e) => setDraft((d) => ({ ...d, customMemory: e.target.value }))}
            placeholder="مثال: اسمي أحمد، مدير مبيعات. اهتم بطلبات العملاء الجدد أكثر من أي شيء آخر. وقّع الردود باسمي."
            className="w-full h-40 p-6 bg-slate-50 rounded-3xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 leading-relaxed"
          />
          <p className="text-xs text-slate-400">يستخدم المساعد هذه المعلومات لفهم أسلوب عملك وتفضيلاتك في التحليل والرد.</p>
        </div>

        <div className="md:col-span-2 pt-4 border-t border-slate-100 flex justify-end">
          <SaveButton large />
        </div>
      </div>
    </motion.div>
  );
}
