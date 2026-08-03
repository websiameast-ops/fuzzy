import { useMemo, useState } from 'react';
import { CalendarCheck, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/contexts/ToastContext';
import { EmptyState, Modal, StatusBadge } from '@/components/common';
import { ServiceReportModal } from '@/components/service/ServiceReportModal';
import { getAsset } from '@/data/mockAssets';
import { getReport } from '@/data/mockHistory';
import { siteName } from '@/data/mockCompanies';
import { fmtDate, fmtDateLong } from '@/utils/format';
import { PM_STATUS } from '@/utils/status';
import type { PMVisit, ServiceRecord } from '@/types';

const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_TH = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const RESCHEDULE_REASONS = [
  { key: 'production', en: 'Production schedule conflict', th: 'ชนกับแผนการผลิต' },
  { key: 'access', en: 'Site access not available', th: 'เข้าพื้นที่ไม่ได้ในวันนั้น' },
  { key: 'staff', en: 'Our staff unavailable', th: 'ทีมงานของเราไม่ว่าง' },
  { key: 'other', en: 'Other reason', th: 'เหตุผลอื่น' },
];

function VisitCard({ v, onConfirm, onReschedule, onViewReport }: {
  v: PMVisit;
  onConfirm: (v: PMVisit) => void;
  onReschedule: (v: PMVisit) => void;
  onViewReport: (v: PMVisit) => void;
}) {
  const { lang, t } = useLang();
  const { customerCode } = useCompany();
  const st = PM_STATUS[v.status];
  const [checks, setChecks] = useState<boolean[]>(v.checklist.map((c) => c.done));

  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="between" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div className="fw-600">{fmtDateLong(v.date, lang)} · {v.time}</div>
          <div className="muted small">{v.id} · {siteName(customerCode, v.siteId, lang)} · {v.team}</div>
          <div className="small" style={{ marginTop: 4 }}>{v.scope}</div>
        </div>
        <StatusBadge label={lang === 'th' ? st.th : st.en} tone={st.tone} />
      </div>

      <div className="flex" style={{ gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
        {v.assetIds.map((id) => {
          const a = getAsset(id);
          return <span key={id} className="chip">{a ? a.name : id}</span>;
        })}
      </div>

      {v.status !== 'completed' && v.checklist.length > 0 && (
        <details style={{ marginTop: 12 }}>
          <summary className="fw-600 small" style={{ cursor: 'pointer' }}>
            {t('Preparation checklist for your team', 'รายการเตรียมความพร้อมสำหรับทีมของคุณ')} ({checks.filter(Boolean).length}/{v.checklist.length})
          </summary>
          <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
            {v.checklist.map((c, i) => (
              <label key={i} className="checkbox-row">
                <input
                  type="checkbox"
                  checked={checks[i]}
                  onChange={(e) => setChecks((prev) => prev.map((x, j) => (j === i ? e.target.checked : x)))}
                />
                <span>{c.label}</span>
              </label>
            ))}
          </div>
        </details>
      )}

      <div className="flex" style={{ gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        {v.status === 'unconfirmed' && (
          <>
            <button className="btn btn-primary btn-sm" onClick={() => onConfirm(v)}>
              <CheckCircle2 size={15} aria-hidden />
              {t('Confirm appointment', 'ยืนยันนัดหมาย')}
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => onReschedule(v)}>
              {t('Request reschedule', 'ขอเลื่อนนัด')}
            </button>
          </>
        )}
        {v.status === 'confirmed' && (
          <button className="btn btn-outline btn-sm" onClick={() => onReschedule(v)}>
            {t('Request reschedule', 'ขอเลื่อนนัด')}
          </button>
        )}
        {v.status === 'reschedule_requested' && (
          <span className="muted small">{t('SE will contact you with new date options.', 'SE จะติดต่อกลับพร้อมตัวเลือกวันใหม่')}</span>
        )}
        {v.status === 'completed' && v.reportId && (
          <button className="btn btn-outline btn-sm" onClick={() => onViewReport(v)}>
            {t('View service report', 'ดูรายงานบริการ')} {v.reportId}
          </button>
        )}
      </div>
    </div>
  );
}

export function PMPage() {
  const { lang, t } = useLang();
  const { customerCode, company } = useCompany();
  const { pmVisits, confirmPM, requestReschedule } = useData();
  const { showToast } = useToast();

  const [view, setView] = useState<'calendar' | 'agenda'>('calendar');
  const [month, setMonth] = useState(6); // July (0-based)
  const [year, setYear] = useState(2026);
  const [site, setSite] = useState('');
  const [status, setStatus] = useState('');
  const [reschedVisit, setReschedVisit] = useState<PMVisit | null>(null);
  const [reschedDate, setReschedDate] = useState('');
  const [reschedTime, setReschedTime] = useState('morning');
  const [reschedReason, setReschedReason] = useState('production');
  const [reschedNotes, setReschedNotes] = useState('');
  const [openRecord, setOpenRecord] = useState<ServiceRecord | null>(null);

  const visits = useMemo(
    () =>
      pmVisits
        .filter((v) => v.customerCode === customerCode)
        .filter((v) => !site || v.siteId === site)
        .filter((v) => !status || v.status === status)
        .sort((a, b) => (a.date > b.date ? 1 : -1)),
    [pmVisits, customerCode, site, status],
  );

  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthVisits = visits.filter((v) => v.date.startsWith(monthKey));
  const upcoming = visits.filter((v) => v.date >= '2026-07-14' && v.status !== 'completed');
  const past = visits.filter((v) => v.status === 'completed').sort((a, b) => (a.date < b.date ? 1 : -1));

  const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1);
  };

  const doConfirm = (v: PMVisit) => {
    confirmPM(v.id);
    showToast(t(`Appointment ${v.id} confirmed — thank you!`, `ยืนยันนัดหมาย ${v.id} แล้ว — ขอบคุณค่ะ`), 'success');
  };

  const openResched = (v: PMVisit) => {
    setReschedVisit(v);
    setReschedDate('');
    setReschedTime('morning');
    setReschedReason('production');
    setReschedNotes('');
  };

  const submitResched = () => {
    if (!reschedVisit) return;
    if (!reschedDate) {
      showToast(t('Please choose a preferred new date.', 'กรุณาเลือกวันใหม่ที่สะดวก'), 'error');
      return;
    }
    const reason = RESCHEDULE_REASONS.find((r) => r.key === reschedReason)!;
    requestReschedule(reschedVisit.id, reschedDate, `${reason.en}${reschedNotes ? ` — ${reschedNotes}` : ''}`);
    showToast(
      t(
        `Reschedule request sent for ${reschedVisit.id}. SE will confirm a new slot within 1 business day.`,
        `ส่งคำขอเลื่อนนัด ${reschedVisit.id} แล้ว SE จะยืนยันเวลาใหม่ภายใน 1 วันทำการ`,
      ),
      'success',
    );
    setReschedVisit(null);
  };

  const viewReport = (v: PMVisit) => {
    if (v.reportId) {
      const rec = getReport(v.reportId);
      if (rec) setOpenRecord(rec);
    }
  };

  const weekdays = lang === 'th' ? ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'] : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('PM Schedule', 'แผนบำรุงรักษา')}</h1>
          <p className="page-sub">
            {t(`${upcoming.length} upcoming visit(s). Confirm appointments so SE teams arrive prepared.`, `นัดหมายที่กำลังจะถึง ${upcoming.length} รายการ ยืนยันนัดเพื่อให้ทีม SE เตรียมพร้อม`)}
          </p>
        </div>
        <div className="page-actions">
          <div className="seg" role="group" aria-label={t('View', 'มุมมอง')}>
            <button className={view === 'calendar' ? 'active' : ''} onClick={() => setView('calendar')} aria-pressed={view === 'calendar'}>
              {t('Calendar', 'ปฏิทิน')}
            </button>
            <button className={view === 'agenda' ? 'active' : ''} onClick={() => setView('agenda')} aria-pressed={view === 'agenda'}>
              {t('Agenda', 'รายการ')}
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 14, marginBottom: 16 }}>
        <div className="filter-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0,1fr))', maxWidth: 560 }}>
          <select value={site} onChange={(e) => setSite(e.target.value)} aria-label={t('Filter by site', 'กรองตามไซต์')}>
            <option value="">{t('All sites', 'ทุกไซต์')}</option>
            {company.sites.map((s) => (
              <option key={s.id} value={s.id}>{lang === 'th' ? s.nameTh : s.name}</option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label={t('Filter by status', 'กรองตามสถานะ')}>
            <option value="">{t('All statuses', 'ทุกสถานะ')}</option>
            {Object.entries(PM_STATUS).map(([k, v]) => (
              <option key={k} value={k}>{lang === 'th' ? v.th : v.en}</option>
            ))}
          </select>
        </div>
      </div>

      {view === 'calendar' && (
        <div className="card" style={{ padding: 18, marginBottom: 16 }}>
          <div className="between" style={{ marginBottom: 12 }}>
            <button className="icon-btn" onClick={prevMonth} aria-label={t('Previous month', 'เดือนก่อนหน้า')}>
              <ChevronLeft size={18} />
            </button>
            <h3 style={{ margin: 0 }}>
              {lang === 'th' ? `${MONTHS_TH[month]} ${year + 543}` : `${MONTHS_EN[month]} ${year}`}
            </h3>
            <button className="icon-btn" onClick={nextMonth} aria-label={t('Next month', 'เดือนถัดไป')}>
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="pm-cal">
            {weekdays.map((d) => (
              <div key={d} className="pm-cal-head">{d}</div>
            ))}
            {cells.map((day, i) => {
              if (day === null) return <div key={`e${i}`} className="pm-cal-cell empty" />;
              const dateStr = `${monthKey}-${String(day).padStart(2, '0')}`;
              const dayVisits = monthVisits.filter((v) => v.date === dateStr);
              const isToday = dateStr === '2026-07-14';
              return (
                <div key={dateStr} className={`pm-cal-cell ${isToday ? 'today' : ''}`}>
                  <div className="pm-cal-day">{day}</div>
                  {dayVisits.map((v) => {
                    const st = PM_STATUS[v.status];
                    return (
                      <span key={v.id} className={`badge t-${st.tone}`} style={{ fontSize: 10.5, display: 'inline-flex', maxWidth: '100%' }} title={v.scope}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.id.replace('PM-2026-', 'PM ')}</span>
                      </span>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <p className="muted small" style={{ marginBottom: 0 }}>
            {monthVisits.length > 0
              ? t(`${monthVisits.length} visit(s) scheduled this month — details below.`, `เดือนนี้มีนัดหมาย ${monthVisits.length} รายการ — รายละเอียดด้านล่าง`)
              : t('No visits scheduled in this month.', 'เดือนนี้ไม่มีนัดหมาย')}
          </p>
        </div>
      )}

      <h3 style={{ margin: '0 0 10px' }}>{t('Upcoming visits', 'นัดหมายที่กำลังจะถึง')}</h3>
      {upcoming.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck size={24} />}
          title={t('No upcoming PM visits', 'ไม่มีนัดหมาย PM ที่กำลังจะถึง')}
          body={t('New visits appear here as SE plans your preventive maintenance program.', 'นัดหมายใหม่จะแสดงที่นี่เมื่อ SE วางแผนงานบำรุงรักษาของคุณ')}
        />
      ) : (
        <div style={{ display: 'grid', gap: 12, marginBottom: 22 }}>
          {upcoming.map((v) => (
            <VisitCard key={v.id} v={v} onConfirm={doConfirm} onReschedule={openResched} onViewReport={viewReport} />
          ))}
        </div>
      )}

      <h3 style={{ margin: '0 0 10px' }}>{t('Completed visits', 'นัดหมายที่เสร็จสิ้น')}</h3>
      <div style={{ display: 'grid', gap: 12 }}>
        {past.map((v) => (
          <VisitCard key={v.id} v={v} onConfirm={doConfirm} onReschedule={openResched} onViewReport={viewReport} />
        ))}
        {past.length === 0 && <p className="muted">{t('No completed visits with the current filters.', 'ไม่มีนัดหมายที่เสร็จสิ้นตามตัวกรองปัจจุบัน')}</p>}
      </div>

      <Modal
        open={reschedVisit !== null}
        onClose={() => setReschedVisit(null)}
        title={t('Request a new appointment', 'ขอเลื่อนนัดหมาย')}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setReschedVisit(null)}>{t('Cancel', 'ยกเลิก')}</button>
            <button className="btn btn-primary" onClick={submitResched}>{t('Send request', 'ส่งคำขอ')}</button>
          </>
        }
      >
        {reschedVisit && (
          <>
            <div className="alert-item a-blue" style={{ marginBottom: 14 }}>
              <CalendarCheck size={16} aria-hidden />
              <span className="small">
                {t('Current appointment', 'นัดหมายปัจจุบัน')}: {fmtDate(reschedVisit.date, lang)} · {reschedVisit.time} — {siteName(customerCode, reschedVisit.siteId, lang)}
              </span>
            </div>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="rs-date">{t('Preferred new date', 'วันใหม่ที่สะดวก')}</label>
                <input id="rs-date" type="date" min="2026-07-15" value={reschedDate} onChange={(e) => setReschedDate(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="rs-time">{t('Preferred time', 'ช่วงเวลาที่สะดวก')}</label>
                <select id="rs-time" value={reschedTime} onChange={(e) => setReschedTime(e.target.value)}>
                  <option value="morning">{t('Morning (08:00–12:00)', 'ช่วงเช้า (08:00–12:00)')}</option>
                  <option value="afternoon">{t('Afternoon (13:00–17:00)', 'ช่วงบ่าย (13:00–17:00)')}</option>
                  <option value="any">{t('Any time', 'เวลาใดก็ได้')}</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label htmlFor="rs-reason">{t('Reason', 'เหตุผล')}</label>
              <select id="rs-reason" value={reschedReason} onChange={(e) => setReschedReason(e.target.value)}>
                {RESCHEDULE_REASONS.map((r) => (
                  <option key={r.key} value={r.key}>{lang === 'th' ? r.th : r.en}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="rs-notes">{t('Notes for SE (optional)', 'หมายเหตุถึง SE (ไม่บังคับ)')}</label>
              <textarea id="rs-notes" rows={3} value={reschedNotes} onChange={(e) => setReschedNotes(e.target.value)} />
            </div>
          </>
        )}
      </Modal>

      <ServiceReportModal record={openRecord} open={openRecord !== null} onClose={() => setOpenRecord(null)} />
    </div>
  );
}
