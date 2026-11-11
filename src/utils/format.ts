import type { Lang } from '@/types';

export const TODAY = new Date('2026-07-14T09:00:00+07:00');

export function fmtDate(iso: string, lang: Lang = 'en'): string {
  const d = new Date(iso);
  return d.toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function fmtDateLong(iso: string, lang: Lang = 'en'): string {
  const d = new Date(iso);
  return d.toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function daysUntil(iso: string): number {
  const d = new Date(iso);
  return Math.ceil((d.getTime() - TODAY.getTime()) / 86400000);
}

export function daysSince(iso: string): number {
  return -daysUntil(iso);
}

/** `now` defaults to the fixed mock-demo anchor (TODAY) so mock-data pages keep
 * stable relative times regardless of the real clock. Real backend timestamps
 * (e.g. a Ticket's reportedAt) postdate that anchor, so callers rendering real
 * data must pass `new Date()` explicitly — otherwise the diff goes negative
 * and clamps to "1 minute ago" for everything. */
export function relTime(iso: string, lang: Lang = 'en', now: Date = TODAY): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return lang === 'th' ? `${Math.max(mins, 1)} นาทีที่แล้ว` : `${Math.max(mins, 1)}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return lang === 'th' ? `${hrs} ชั่วโมงที่แล้ว` : `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return lang === 'th' ? `${days} วันที่แล้ว` : `${days}d ago`;
}

/** News.content has no stored read-time — estimate from the rendered HTML.
 * Character-based (not word-split) so it works for Thai too, which doesn't
 * space-separate words the way English does. */
export function estimateReadMins(html: string): number {
  const text = html.replace(/<[^>]+>/g, '').trim();
  return Math.max(1, Math.round(text.length / 500));
}

/** Plain-text preview of a News.content HTML body — strips tags/collapses
 * whitespace and caps length; the visual 2-line clamp on .news-hero-sub /
 * .news-card-desc / .sidebar-card-sub (global.css) does the actual
 * truncation, this cap just keeps the DOM string from being enormous. */
export function newsExcerpt(html: string, maxLen = 200): string {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > maxLen ? `${text.slice(0, maxLen).trimEnd()}…` : text;
}

export function num(n: number): string {
  return n.toLocaleString('en-US');
}

export function fmtBytes(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function greeting(lang: Lang): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return lang === 'th' ? 'สวัสดีตอนเช้า' : 'Good morning';
  if (h >= 12 && h < 18) return lang === 'th' ? 'สวัสดีตอนบ่าย' : 'Good afternoon';
  return lang === 'th' ? 'สวัสดี' : 'Hello';
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}

export function companyDisplayName(
  preName: string | null | undefined,
  customerName: string | null | undefined,
  fallback: string,
): string {
  return [preName, customerName].filter(Boolean).join(' ') || fallback;
}
