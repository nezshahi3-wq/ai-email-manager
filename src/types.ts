export type Category = 'Urgent Business' | 'Personal Follow-up' | 'General Query' | 'Promotional/Spam';

export interface EmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
}

export interface EmailMessage {
  id: string;
  threadId: string;
  subject?: string;
  /** المرسل بعد فك ترميز MIME (للعرض) */
  from?: string;
  /** المرسل كما هو في الترويسة (للردّ) */
  fromRaw?: string;
  replyTo?: string;
  date?: string;
  snippet: string;
  body?: string;
  htmlBody?: string;
  attachments?: EmailAttachment[];
  messageIdHeader?: string;
  referencesHeader?: string;
}

export interface Briefing {
  executiveSummary: string;
  topPriorities: string[];
  sentiment: string;
}

export interface SchedulingSuggestion {
  isMeetingRequest: boolean;
  suggestedTimes: string[];
  reasoning: string;
}

export interface ClassifiedEmail extends EmailMessage {
  category?: Category;
  reason?: string;
  suggestedReply?: string;
  isReplying?: boolean;
  isAnalyzingSchedule?: boolean;
  schedulingSuggestions?: SchedulingSuggestion;
}

export interface Memory {
  priorityKeywords: string[];
  blockedContacts: string[];
  customMemory: string;
}
