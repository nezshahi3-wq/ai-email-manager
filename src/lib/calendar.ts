import { googleFetch } from './google';

export interface BusySlot {
  start: string;
  end: string;
}

/** يجلب الفترات المشغولة فقط (بدون عناوين الأحداث) للأيام السبعة القادمة. */
export async function fetchBusySlots(token: string): Promise<BusySlot[]> {
  const now = new Date();
  const max = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    timeMin: now.toISOString(),
    timeMax: max.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '100',
  });

  const res = await googleFetch(token, `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`);
  const data = await res.json();

  return ((data.items as any[]) || [])
    .filter((ev) => ev.status !== 'cancelled' && ev.transparency !== 'transparent')
    .map((ev) => ({
      start: ev.start?.dateTime ?? ev.start?.date,
      end: ev.end?.dateTime ?? ev.end?.date,
    }))
    .filter((s): s is BusySlot => Boolean(s.start && s.end));
}
