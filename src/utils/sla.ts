import type { Priority, ServiceRequest } from '@/types';
import { TODAY } from './format';

export const SLA_HOURS: Record<Priority, { response: number; resolution: number }> = {
  urgent: { response: 4, resolution: 24 },
  high: { response: 8, resolution: 72 },
  medium: { response: 24, resolution: 120 },
  low: { response: 48, resolution: 240 },
};

const CLOSED_STATUSES = ['completed', 'closed'];

function addHours(iso: string, hours: number): Date {
  return new Date(new Date(iso).getTime() + hours * 3600 * 1000);
}

export type SlaOverallStatus = 'ahead' | 'on_track' | 'delayed' | 'completed_ahead' | 'completed_on_time' | 'completed_delayed';

export interface SlaAssessment {
  plannedResponseAt: Date;
  plannedCompletionAt: Date;
  actualResponseAt?: Date;
  actualCompletionAt?: Date;
  /** Hours late (positive) or early (negative) vs the planned response target. */
  responseDeltaHours?: number;
  /** Hours late (positive) or early (negative) vs the planned completion target — or vs "now" if still open. */
  completionDeltaHours: number;
  isClosed: boolean;
  overallStatus: SlaOverallStatus;
}

/**
 * Compares a request's actual progress against the SLA target implied by its priority.
 * This is a reference line ("original plan") for the customer, not a contractual SLA.
 */
export function assessSla(request: ServiceRequest): SlaAssessment {
  const sla = SLA_HOURS[request.priority];
  const plannedResponseAt = addHours(request.created, sla.response);
  const plannedCompletionAt = addHours(request.created, sla.resolution);

  const doneSteps = request.timeline.filter((s) => s.done && s.date);
  const actualResponseAt = doneSteps.length > 1 ? new Date(doneSteps[1]!.date) : undefined;

  const isClosed = CLOSED_STATUSES.includes(request.status);
  const lastDone = doneSteps[doneSteps.length - 1];
  const actualCompletionAt = isClosed && lastDone ? new Date(lastDone.date) : undefined;

  const responseDeltaHours = actualResponseAt
    ? (actualResponseAt.getTime() - plannedResponseAt.getTime()) / 3600000
    : undefined;

  const completionDeltaHours = actualCompletionAt
    ? (actualCompletionAt.getTime() - plannedCompletionAt.getTime()) / 3600000
    : (TODAY.getTime() - plannedCompletionAt.getTime()) / 3600000;

  let overallStatus: SlaOverallStatus;
  if (isClosed) {
    overallStatus = completionDeltaHours <= -2 ? 'completed_ahead' : completionDeltaHours > 2 ? 'completed_delayed' : 'completed_on_time';
  } else {
    overallStatus = completionDeltaHours > 0 ? 'delayed' : completionDeltaHours < -2 ? 'ahead' : 'on_track';
  }

  return {
    plannedResponseAt,
    plannedCompletionAt,
    actualResponseAt,
    actualCompletionAt,
    responseDeltaHours,
    completionDeltaHours,
    isClosed,
    overallStatus,
  };
}

export const SLA_STATUS_LABEL: Record<SlaOverallStatus, { en: string; th: string; tone: 'green' | 'amber' | 'red' | 'blue' }> = {
  ahead: { en: 'Ahead of plan', th: 'เร็วกว่าแผน', tone: 'green' },
  on_track: { en: 'On track', th: 'เป็นไปตามแผน', tone: 'blue' },
  delayed: { en: 'Behind plan', th: 'ช้ากว่าแผน', tone: 'amber' },
  completed_ahead: { en: 'Completed ahead of plan', th: 'เสร็จเร็วกว่าแผน', tone: 'green' },
  completed_on_time: { en: 'Completed on plan', th: 'เสร็จตามแผน', tone: 'green' },
  completed_delayed: { en: 'Completed behind plan', th: 'เสร็จช้ากว่าแผน', tone: 'amber' },
};

export function fmtHoursDelta(hours: number, lang: 'en' | 'th'): string {
  const abs = Math.abs(hours);
  const unit = abs >= 48 ? { div: 24, en: 'day', th: 'วัน' } : { div: 1, en: 'hour', th: 'ชั่วโมง' };
  const value = Math.round((abs / unit.div) * 10) / 10;
  const plural = unit.div === 24 && value !== 1 ? 's' : abs !== 1 && unit.div === 1 ? 's' : '';
  if (lang === 'th') return `${value} ${unit.th}`;
  return `${value} ${unit.en}${plural}`;
}
