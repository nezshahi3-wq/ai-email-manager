import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { Memory } from '../types';
import { db } from './firebase';

export const emptyMemory: Memory = { priorityKeywords: [], blockedContacts: [], customMemory: '' };

const localKey = (uid: string) => `aimanager_memory_${uid}`;

const cleanList = (v: unknown, maxItems: number, maxLen: number): string[] =>
  Array.isArray(v)
    ? v
        .filter((x): x is string => typeof x === 'string')
        .map((x) => x.trim().slice(0, maxLen))
        .filter(Boolean)
        .slice(0, maxItems)
    : [];

/** يضمن الشكل والحدود المتوافقة مع قواعد Firestore. */
export function normalizeMemory(v: any): Memory {
  return {
    priorityKeywords: cleanList(v?.priorityKeywords, 100, 60),
    blockedContacts: cleanList(v?.blockedContacts, 200, 200).map((s) => s.toLowerCase()),
    customMemory: typeof v?.customMemory === 'string' ? v.customMemory.slice(0, 4000) : '',
  };
}

function readLocal(uid: string): Memory | null {
  try {
    const raw = localStorage.getItem(localKey(uid));
    return raw ? normalizeMemory(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function writeLocal(uid: string, memory: Memory) {
  try {
    localStorage.setItem(localKey(uid), JSON.stringify(memory));
  } catch {
    /* التخزين المحلي غير متاح */
  }
}

/** يحمّل الإعدادات من Firestore، ويرجع للنسخة المحلية إن تعذّر ذلك. لا يرمي أخطاء. */
export async function loadMemory(uid: string): Promise<Memory> {
  try {
    const snap = await getDoc(doc(db, 'preferences', uid));
    if (snap.exists()) {
      const memory = normalizeMemory(snap.data());
      writeLocal(uid, memory);
      return memory;
    }
  } catch (err) {
    console.warn('تعذّر تحميل الإعدادات من Firestore، سيتم استخدام النسخة المحلية:', err);
  }
  return readLocal(uid) ?? emptyMemory;
}

/** يحفظ محلياً أولاً ثم في Firestore. يرمي خطأ إن فشل الحفظ السحابي. */
export async function saveMemory(uid: string, memory: Memory): Promise<Memory> {
  const clean = normalizeMemory(memory);
  writeLocal(uid, clean);
  await setDoc(doc(db, 'preferences', uid), { ...clean, userId: uid, updatedAt: serverTimestamp() });
  return clean;
}
