import type { Category } from '../types';

export const CATEGORY_LABELS: Record<Category, string> = {
  'Urgent Business': 'عمل عاجل',
  'Personal Follow-up': 'متابعة شخصية',
  'General Query': 'استفسار عام',
  'Promotional/Spam': 'ترويجية/سبام',
};

export const CATEGORY_STYLES: Record<Category, { bar: string; badge: string }> = {
  'Urgent Business': { bar: 'bg-rose-500', badge: 'bg-rose-50 text-rose-600' },
  'Personal Follow-up': { bar: 'bg-indigo-500', badge: 'bg-indigo-50 text-indigo-600' },
  'General Query': { bar: 'bg-amber-500', badge: 'bg-amber-50 text-amber-600' },
  'Promotional/Spam': { bar: 'bg-slate-400', badge: 'bg-slate-50 text-slate-600' },
};
