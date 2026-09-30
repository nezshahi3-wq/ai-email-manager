import type { EmailAttachment, EmailMessage } from '../types';
import { googleFetch, GoogleAuthError } from './google';

export type { EmailAttachment, EmailMessage };

const GMAIL = 'https://gmail.googleapis.com/gmail/v1/users/me';

/* ---------- ترميز وفك ترميز ---------- */

const bytesToBinary = (bytes: Uint8Array): string => {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return bin;
};

const base64UrlToBytes = (data: string): Uint8Array => {
  const bin = atob(data.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

const decodeBase64 = (data: string): string => {
  if (!data) return '';
  try {
    return new TextDecoder().decode(base64UrlToBytes(data));
  } catch (err) {
    console.error('Decoding error:', err);
    return '';
  }
};

const toBase64 = (text: string): string => btoa(bytesToBinary(new TextEncoder().encode(text)));
const toBase64Url = (text: string): string => toBase64(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** فك ترميز ترويسات MIME مثل =?UTF-8?B?...?= (شائعة في العناوين العربية). */
export const decodeMimeWords = (value: string): string =>
  value
    .replace(/(\?=)\s+(=\?)/g, '$1$2')
    .replace(/=\?([\w-]+)\?([bBqQ])\?([^?]*)\?=/g, (_m, charset: string, enc: string, text: string) => {
      try {
        let bytes: Uint8Array;
        if (enc.toUpperCase() === 'B') {
          bytes = Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
        } else {
          const t = text.replace(/_/g, ' ');
          const arr: number[] = [];
          for (let i = 0; i < t.length; i++) {
            if (t[i] === '=' && /^[0-9a-fA-F]{2}$/.test(t.slice(i + 1, i + 3))) {
              arr.push(parseInt(t.slice(i + 1, i + 3), 16));
              i += 2;
            } else {
              arr.push(t.charCodeAt(i));
            }
          }
          bytes = new Uint8Array(arr);
        }
        return new TextDecoder(charset).decode(bytes);
      } catch {
        return text;
      }
    });

const decodeEntities = (s: string): string =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

/* ---------- قراءة الرسائل ---------- */

const extractContent = (payload: any): { text: string; html: string } => {
  let text = '';
  let html = '';

  const traverse = (part: any) => {
    if (part.mimeType === 'text/plain' && part.body?.data) text += decodeBase64(part.body.data);
    else if (part.mimeType === 'text/html' && part.body?.data) html += decodeBase64(part.body.data);
    if (part.parts) part.parts.forEach(traverse);
  };
  traverse(payload);

  if (!text && html) {
    text = decodeEntities(
      html
        .replace(/<style[^>]*>.*?<\/style>/gis, '')
        .replace(/<script[^>]*>.*?<\/script>/gis, '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(p|div|tr|li|h[1-6])>/gi, '\n')
        .replace(/<[^>]+>/g, ' '),
    )
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n+/g, '\n\n')
      .trim();
  }
  return { text, html };
};

const collectAttachments = (part: any, out: EmailAttachment[]) => {
  if (!part) return;
  if (part.filename && part.body?.attachmentId) {
    out.push({
      id: part.body.attachmentId,
      filename: decodeMimeWords(part.filename),
      mimeType: part.mimeType || 'application/octet-stream',
      size: part.body.size || 0,
    });
  }
  if (part.parts) part.parts.forEach((p: any) => collectAttachments(p, out));
};

const header = (headers: any[], name: string): string | undefined =>
  headers.find((h) => String(h.name).toLowerCase() === name)?.value;

function parseMessage(msgData: any): EmailMessage {
  const headers: any[] = msgData.payload?.headers ?? [];
  const { text, html } = extractContent(msgData.payload ?? {});
  const attachments: EmailAttachment[] = [];
  collectAttachments(msgData.payload, attachments);

  const fromRaw = header(headers, 'from');
  const subject = header(headers, 'subject');

  return {
    id: msgData.id,
    threadId: msgData.threadId,
    subject: subject ? decodeMimeWords(subject) : undefined,
    from: fromRaw ? decodeMimeWords(fromRaw) : undefined,
    fromRaw,
    replyTo: header(headers, 'reply-to'),
    date: header(headers, 'date'),
    snippet: decodeEntities(msgData.snippet ?? ''),
    body: text,
    htmlBody: html,
    attachments: attachments.length > 0 ? attachments : undefined,
    messageIdHeader: header(headers, 'message-id'),
    referencesHeader: header(headers, 'references'),
  };
}

export interface FetchEmailsResult {
  emails: EmailMessage[];
  nextPageToken: string | null;
}

export async function fetchEmails(
  token: string,
  opts: { pageToken?: string | null; maxResults?: number } = {},
): Promise<FetchEmailsResult> {
  const params = new URLSearchParams({ maxResults: String(opts.maxResults ?? 15), labelIds: 'INBOX' });
  if (opts.pageToken) params.set('pageToken', opts.pageToken);

  const listRes = await googleFetch(token, `${GMAIL}/messages?${params}`);
  const list = await listRes.json();
  if (!list.messages?.length) return { emails: [], nextPageToken: null };

  const settled = await Promise.allSettled(
    (list.messages as { id: string }[]).map(async (m) => {
      const res = await googleFetch(token, `${GMAIL}/messages/${m.id}?format=full`);
      return parseMessage(await res.json());
    }),
  );

  const failed = settled.find((r) => r.status === 'rejected') as PromiseRejectedResult | undefined;
  if (failed && failed.reason instanceof GoogleAuthError) throw failed.reason;

  const emails = settled
    .filter((r): r is PromiseFulfilledResult<EmailMessage> => r.status === 'fulfilled')
    .map((r) => r.value);

  return { emails, nextPageToken: list.nextPageToken ?? null };
}

export async function fetchAttachment(token: string, messageId: string, attachmentId: string): Promise<Uint8Array> {
  const res = await googleFetch(token, `${GMAIL}/messages/${messageId}/attachments/${attachmentId}`);
  const data = await res.json();
  return base64UrlToBytes(data.data);
}

/* ---------- الرد والمسودات ---------- */

const cleanHeader = (v: string): string => v.replace(/[\r\n]+/g, ' ').trim();
const encodeHeader = (v: string): string => (/^[\x20-\x7E]*$/.test(v) ? v : `=?UTF-8?B?${toBase64(v)}?=`);

function buildReplyRaw(original: EmailMessage, replyText: string): string {
  const to = cleanHeader(original.replyTo || original.fromRaw || original.from || '');
  if (!to) throw new Error('تعذّر تحديد عنوان المرسل للرد.');

  const baseSubject = (original.subject || '').replace(/^\s*(re:\s*)+/i, '');
  const lines = [
    `To: ${to}`,
    `Subject: ${encodeHeader(cleanHeader(`Re: ${baseSubject}`))}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
  ];
  if (original.messageIdHeader) {
    const refs = [original.referencesHeader, original.messageIdHeader].filter(Boolean).join(' ');
    lines.push(`In-Reply-To: ${cleanHeader(original.messageIdHeader)}`, `References: ${cleanHeader(refs)}`);
  }

  const bodyB64 = (toBase64(replyText).match(/.{1,76}/g) ?? []).join('\r\n');
  return toBase64Url([...lines, '', bodyB64].join('\r\n'));
}

export async function sendReply(token: string, original: EmailMessage, replyText: string) {
  const res = await googleFetch(token, `${GMAIL}/messages/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: buildReplyRaw(original, replyText), threadId: original.threadId }),
  });
  return res.json();
}

export async function createDraft(token: string, original: EmailMessage, replyText: string) {
  const res = await googleFetch(token, `${GMAIL}/drafts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: { raw: buildReplyRaw(original, replyText), threadId: original.threadId } }),
  });
  return res.json();
}

export async function markAsRead(token: string, messageId: string) {
  const res = await googleFetch(token, `${GMAIL}/messages/${messageId}/modify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ removeLabelIds: ['UNREAD'] }),
  });
  return res.json();
}

/** ينقل الرسالة إلى سلة المهملات (قابلة للاسترجاع خلال 30 يوماً). */
export async function deleteMessage(token: string, messageId: string) {
  const res = await googleFetch(token, `${GMAIL}/messages/${messageId}/trash`, { method: 'POST' });
  return res.json();
}
