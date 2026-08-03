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

export function relTime(iso: string, lang: Lang = 'en'): string {
  const diffMs = TODAY.getTime() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return lang === 'th' ? `${Math.max(mins, 1)} นาทีที่แล้ว` : `${Math.max(mins, 1)}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return lang === 'th' ? `${hrs} ชั่วโมงที่แล้ว` : `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return lang === 'th' ? `${days} วันที่แล้ว` : `${days}d ago`;
}

export function num(n: number): string {
  return n.toLocaleString('en-US');
}

export function greeting(lang: Lang): string {
  const h = TODAY.getHours();
  if (lang === 'th') return h < 12 ? 'สวัสดีตอนเช้า' : h < 17 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนเย็น';
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}
