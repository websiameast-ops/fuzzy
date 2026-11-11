import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, CheckCircle2, Clock, FileText } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { EmptyState, StatusBadge } from '@/components/common';
import { ServiceReportModal } from '@/components/service/ServiceReportModal';
import { apiGetTicketHistory, apiGetTicketReport, type ServiceHistoryResponse, type ServiceReportResponse } from '@/lib/apiClient';
import { tokenStore } from '@/lib/tokenStore';
import { fmtDate, relTime } from '@/utils/format';
import { SLA_STATUS, TICKET_PRIORITY, TICKET_STATUS, type SlaStatusValue, type TicketStatusValue } from '@/utils/status';
import { fmtHoursDelta } from '@/utils/sla';

const STATUS_FLOW: TicketStatusValue[] = ['Open', 'Assigned', 'InProgress', 'Resolved', 'Closed'];

function SlaProgressBar({
  reportedAt,
  dueAt,
  completedAt,
  slaStatus,
}: {
  reportedAt: string;
  dueAt: string;
  completedAt: string | null;
  slaStatus: SlaStatusValue | null;
}) {
  const { t } = useLang();
  const start = new Date(reportedAt).getTime();
  const end = new Date(dueAt).getTime();
  const marker = completedAt ? new Date(completedAt).getTime() : Date.now();
  const pct = end > start ? Math.min(100, Math.max(0, ((marker - start) / (end - start)) * 100)) : 100;
  const cls = slaStatus === 'breached' ? 'overdue' : slaStatus === 'approaching' ? 'at-risk' : 'on-time';
  return (
    <div className="sla-bar-wrap">
      <div className="sla-bar-labels">
        <span>{t('Reported', 'แจ้งเมื่อ')}</span>
        <span>{t('Due', 'ครบกำหนด')}</span>
      </div>
      <div className="sla-bar-track">
        <div className={`sla-bar-fill ${cls}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function TicketDetailPage() {
  const { ticketNo } = useParams();
  const { lang, t } = useLang();
  const navigate = useNavigate();
  const [reportOpen, setReportOpen] = useState(false);

  const [history, setHistory] = useState<ServiceHistoryResponse[] | null>(null);
  const [report, setReport] = useState<ServiceReportResponse | null>(null);

  useEffect(() => {
    const accessToken = tokenStore.read()?.accessToken;
    if (!accessToken || !ticketNo) return;
    apiGetTicketHistory(accessToken, { q: ticketNo, size: 1 })
      .then((res) => setHistory(res.items))
      .catch(() => {});
  }, [ticketNo]);

  useEffect(() => {
    const accessToken = tokenStore.read()?.accessToken;
    if (!accessToken || !ticketNo) return;
    apiGetTicketReport(accessToken, ticketNo).then(setReport).catch(() => {});
  }, [ticketNo]);

  const ticket = history?.find((r) => r.ticketNo === ticketNo);

  if (history && !ticket) {
    return (
      <EmptyState
        icon={<Clock size={24} />}
        title={t('Request not found', 'ไม่พบคำขอ')}
        body={t('The ticket may belong to another company profile, or the link is out of date.', 'คำขออาจอยู่ในบริษัทอื่น หรือลิงก์อาจไม่ถูกต้อง')}
        action={<Link to="/portal/requests" className="btn btn-primary btn-sm">{t('All requests', 'คำขอทั้งหมด')}</Link>}
      />
    );
  }

  if (!ticket) return null;

  const st = TICKET_STATUS[ticket.status];
  const pr = TICKET_PRIORITY[ticket.priority];
  const slaMeta = ticket.slaStatus ? SLA_STATUS[ticket.slaStatus] : null;
  const isClosed = ticket.status === 'Resolved' || ticket.status === 'Closed';

  // due_at is the deadline; completed_at is when the job actually finished.
  // deltaHours > 0 means past due_at (late/overdue), <= 0 means at-or-before it.
  const dueAt = ticket.slaDueAt ? new Date(ticket.slaDueAt) : null;
  const completedAt = ticket.slaCompletedAt ? new Date(ticket.slaCompletedAt) : null;
  const deltaHours = dueAt ? ((isClosed && completedAt ? completedAt : new Date()).getTime() - dueAt.getTime()) / 3600000 : null;

  const steps = STATUS_FLOW.filter((s) => s !== 'Closed' || ticket.status === 'Closed');
  const currentStep = steps.indexOf(ticket.status);

  return (
    <div style={{ maxWidth: 1000 }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/portal/requests')} style={{ marginBottom: 12, marginLeft: -8 }}>
        <ArrowLeft size={16} aria-hidden />
        {t('All requests', 'คำขอทั้งหมด')}
      </button>

      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px', minWidth: 260 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 13, fontWeight: 700, color: 'var(--se-primary)' }}>
                {ticket.ticketNo}
              </span>
              <span className="muted small">·</span>
              <span className="muted small">{t('Reported', 'แจ้งเมื่อ')} {fmtDate(ticket.reportedAt, lang)}</span>
              <span className="muted small">·</span>
              <span className="muted small">{relTime(ticket.reportedAt, lang, new Date())}</span>
            </div>

            <h1 className="page-title" style={{ fontSize: 22, fontWeight: 700, margin: '0 0 10px' }}>
              {ticket.description}
            </h1>

            <div className="flex" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <StatusBadge label={lang === 'th' ? st.th : st.en} tone={st.tone} dot />
              <StatusBadge label={lang === 'th' ? pr.th : pr.en} tone={pr.tone} dot />
              <span className="badge t-grey">{ticket.type}</span>
              {slaMeta && <StatusBadge label={lang === 'th' ? slaMeta.th : slaMeta.en} tone={slaMeta.tone} />}
            </div>
          </div>

          <div className="page-actions" style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="btn btn-outline btn-sm" onClick={() => setReportOpen(true)}>
              <FileText size={15} aria-hidden />
              {t('Service report', 'รายงานบริการ')}
            </button>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start', gap: 16 }}>
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ marginTop: 0, marginBottom: 14 }}>{t('Request details', 'รายละเอียดคำขอ')}</h3>
            {/* ticket.site is best-effort, not authoritative: it's sourced from
                AssetUnit.site, and a Ticket has no column linking it to one
                specific unit when its Asset owns several (see backend
                get_service_history's docstring). Still null when no unit has a
                site set. '—' matches this codebase's existing convention for
                unavailable fields (see ServiceReportModal.tsx), not a
                translated "not specified". */}
            <div className="stat-line"><span className="k">{t('Site', 'ไซต์')}</span><span className="v">{ticket.site ?? '—'}</span></div>
            <div className="stat-line"><span className="k">{t('Equipment', 'อุปกรณ์')}</span><span className="v">{ticket.assetCode}</span></div>
            <div className="stat-line"><span className="k">{t('Job No', 'เลขงาน')}</span><span className="v">{ticket.jobNo ?? '—'}</span></div>
            <div className="stat-line"><span className="k">{t('Engineer', 'วิศวกร')}</span><span className="v">{report?.engineerName ?? '—'}</span></div>
            {/* Condition/SE team/Contact/Preferred date have no backing
                column on Ticket yet (fuzzy's version fabricates them from
                mock data) — shown as '—' placeholders until the backend
                grows those fields, so this card's layout matches fuzzy's. */}
            <div className="stat-line"><span className="k">{t('Condition', 'สภาพอุปกรณ์')}</span><span className="v">—</span></div>
            <div className="stat-line"><span className="k">{t('SE team', 'ทีม SE')}</span><span className="v">—</span></div>
            <div className="stat-line"><span className="k">{t('Contact', 'ผู้ติดต่อ')}</span><span className="v">—</span></div>
            <div className="stat-line"><span className="k">{t('Preferred date', 'วันที่สะดวก')}</span><span className="v">—</span></div>
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px dashed var(--se-border)' }}>
              <div className="muted small" style={{ marginBottom: 6 }}>{t('Description', 'รายละเอียด')}</div>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 13.5 }}>{ticket.description}</p>
            </div>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <div className="between" style={{ marginBottom: 4 }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={16} aria-hidden /> {t('SLA status', 'สถานะ SLA')}
              </h3>
              {slaMeta ? <StatusBadge label={lang === 'th' ? slaMeta.th : slaMeta.en} tone={slaMeta.tone} /> : <span className="muted small">{t('N/A', 'ไม่มีข้อมูล')}</span>}
            </div>

            {ticket.slaDueAt && (
              <SlaProgressBar reportedAt={ticket.reportedAt} dueAt={ticket.slaDueAt} completedAt={ticket.slaCompletedAt} slaStatus={ticket.slaStatus} />
            )}

            {ticket.slaDueAt && (
              <div className="stat-line"><span className="k">{t('Due at', 'ครบกำหนด')}</span><span className="v">{fmtDate(ticket.slaDueAt, lang)}</span></div>
            )}
            {isClosed && ticket.slaCompletedAt && (
              <div className="stat-line">
                <span className="k">{t('Completed at', 'เสร็จเมื่อ')}</span>
                <span className="v">
                  {fmtDate(ticket.slaCompletedAt, lang)}{' '}
                  {deltaHours !== null && (
                    <StatusBadge
                      label={
                        deltaHours <= 0
                          ? t(`${fmtHoursDelta(deltaHours, lang)} ahead`, `เร็วกว่ากำหนด ${fmtHoursDelta(deltaHours, lang)}`)
                          : t(`${fmtHoursDelta(deltaHours, lang)} late`, `ช้ากว่ากำหนด ${fmtHoursDelta(deltaHours, lang)}`)
                      }
                      tone={deltaHours <= 0 ? 'green' : 'amber'}
                    />
                  )}
                </span>
              </div>
            )}
            {!isClosed && deltaHours !== null && (
              <div className="stat-line">
                <span className="k">{t('Currently', 'ขณะนี้')}</span>
                <span className="v">
                  <StatusBadge
                    label={
                      deltaHours <= 0
                        ? t(`${fmtHoursDelta(deltaHours, lang)} of runway left`, `เหลือเวลาอีก ${fmtHoursDelta(deltaHours, lang)}`)
                        : t(`${fmtHoursDelta(deltaHours, lang)} overdue`, `เกินกำหนด ${fmtHoursDelta(deltaHours, lang)}`)
                    }
                    tone={deltaHours <= 0 ? 'blue' : 'red'}
                  />
                </span>
              </div>
            )}
            {isClosed && (
              <div className="flex" style={{ gap: 6, marginTop: 10, color: 'var(--se-success)' }}>
                <CheckCircle2 size={15} aria-hidden />
                <span className="small muted">{t('Closed — figures are final.', 'ปิดแล้ว — ตัวเลขเป็นค่าสุดท้าย')}</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ marginTop: 0, marginBottom: 18 }}>{t('Progress', 'ความคืบหน้า')}</h3>
            <ul className="timeline-v2">
              {steps.map((s, i) => {
                const meta = TICKET_STATUS[s];
                const done = i < currentStep;
                const current = i === currentStep;
                const isFirst = i === 0;
                const isLast = i === steps.length - 1;
                const date = isFirst
                  ? fmtDate(ticket.reportedAt, lang)
                  : isLast && isClosed && ticket.slaCompletedAt
                    ? fmtDate(ticket.slaCompletedAt, lang)
                    // Real data only gives a date for the first/terminal step —
                    // intermediate steps have no per-step timestamp. A step
                    // already passed (done) must not say "Pending" (contradicts
                    // its checkmark); only a step not yet reached should.
                    : done
                      ? t('Completed', 'เสร็จแล้ว')
                      : t('Pending', 'รอดำเนินการ');
                return (
                  <li key={s} className={`tl-item ${current ? 'current' : done ? 'done' : ''}`}>
                    <div className="tl-dot">
                      {done || current ? <Check size={14} strokeWidth={3} /> : null}
                    </div>
                    <div className="tl-content">
                      <div className="tl-label">{lang === 'th' ? meta.th : meta.en}</div>
                      <div className="tl-date">{date}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>{t('Updates from SE', 'อัปเดตจาก SE')}</h3>
            {(!report || report.notes.length === 0) ? (
              <p className="muted small">{t('No updates yet — SE will post here as they work on your request.', 'ยังไม่มีอัปเดต — SE จะโพสต์ที่นี่เมื่อดำเนินการ')}</p>
            ) : (
              <div className="activity-feed">
                {report.notes.map((n, i) => (
                  <div key={i} className="af-item from-se">
                    <div className="af-avatar">{t('SE', 'SE')}</div>
                    <div className="af-bubble">
                      <p className="af-text">{n}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ServiceReportModal ticketNo={ticketNo ?? null} open={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  );
}
