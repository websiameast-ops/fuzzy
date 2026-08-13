import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Check, CheckCircle2, ClipboardList,
  Clock, FileSignature, FileText, Paperclip, XCircle,
} from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/contexts/ToastContext';
import { EmptyState, Modal, StatusBadge } from '@/components/common';
import { ServiceReportModal } from '@/components/service/ServiceReportModal';
import { getAsset } from '@/data/mockAssets';
import { siteName } from '@/data/mockCompanies';
import { getReport } from '@/data/mockHistory';
import { fmtDate, relTime } from '@/utils/format';
import { PRIORITY, REQUEST_STATUS } from '@/utils/status';
import { assessSla, fmtHoursDelta, SLA_STATUS_LABEL } from '@/utils/sla';

const CANCELLABLE = ['submitted', 'reviewing', 'scheduled'];

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function SlaProgressBar({ sla }: { sla: ReturnType<typeof assessSla> }) {
  const { t } = useLang();
  const now = Date.now();
  const start = new Date(sla.plannedResponseAt).getTime() - 24 * 3600 * 1000; // estimate start
  const end = new Date(sla.plannedCompletionAt).getTime();
  const pct = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
  const cls = (sla.overallStatus === 'ahead' || sla.overallStatus === 'on_track' || sla.overallStatus === 'completed_ahead' || sla.overallStatus === 'completed_on_time')
    ? 'on-time'
    : 'overdue';
  return (
    <div className="sla-bar-wrap">
      <div className="sla-bar-labels">
        <span>{t('Created', 'สร้างแล้ว')}</span>
        <span>{t('Target completion', 'เป้าหมาย')}</span>
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
  const { customerCode } = useCompany();
  const { requests, cancelRequest } = useData();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [reportOpen, setReportOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const request = useMemo(() => requests.find((r) => r.ticketNo === ticketNo), [requests, ticketNo]);

  if (!request || request.customerCode !== customerCode) {
    return (
      <EmptyState
        icon={<ClipboardList size={24} />}
        title={t('Request not found', 'ไม่พบคำขอ')}
        body={t('The ticket may belong to another company profile, or the link is out of date.', 'คำขออาจอยู่ในบริษัทอื่น หรือลิงก์อาจไม่ถูกต้อง')}
        action={<Link to="/portal/requests" className="btn btn-primary btn-sm">{t('All requests', 'คำขอทั้งหมด')}</Link>}
      />
    );
  }

  const st = REQUEST_STATUS[request.status];
  const pr = PRIORITY[request.priority];
  const asset = request.assetId ? getAsset(request.assetId) : undefined;
  const record = request.reportId ? getReport(request.reportId) ?? null : null;
  const sla = assessSla(request);
  const slaMeta = SLA_STATUS_LABEL[sla.overallStatus];

  const doCancel = () => {
    cancelRequest(request.ticketNo);
    setCancelOpen(false);
    showToast(t(`Request ${request.ticketNo} was cancelled.`, `ยกเลิกคำขอ ${request.ticketNo} แล้ว`), 'info');
  };

  return (
    <div style={{ maxWidth: 1000 }}>
      {/* Back nav */}
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/portal/requests')} style={{ marginBottom: 12, marginLeft: -8 }}>
        <ArrowLeft size={16} aria-hidden />
        {t('All requests', 'คำขอทั้งหมด')}
      </button>

      {/* Core Header Card matching Equipment Detail style */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px', minWidth: 260 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 13, fontWeight: 700, color: 'var(--se-primary)' }}>
                {request.ticketNo}
              </span>
              <span className="muted small">·</span>
              <span className="muted small">{t('Created', 'สร้างเมื่อ')} {fmtDate(request.created, lang)}</span>
              <span className="muted small">·</span>
              <span className="muted small">{t('Updated', 'อัปเดต')} {relTime(request.updated, lang)}</span>
            </div>

            <h1 className="page-title" style={{ fontSize: 22, fontWeight: 700, margin: '0 0 10px' }}>
              {request.title}
            </h1>

            <div className="flex" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <StatusBadge label={lang === 'th' ? st.th : st.en} tone={st.tone} dot />
              <StatusBadge label={lang === 'th' ? pr.th : pr.en} tone={pr.tone} dot />
              <span className="badge t-grey">{request.category}</span>
              <StatusBadge label={lang === 'th' ? slaMeta.th : slaMeta.en} tone={slaMeta.tone} />
            </div>
          </div>

          {/* Quick Actions matching Equipment Detail header */}
          <div className="page-actions" style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {request.reportId && (
              <button className="btn btn-outline btn-sm" onClick={() => setReportOpen(true)}>
                <FileText size={15} aria-hidden />
                {t('Service report', 'รายงานบริการ')}
              </button>
            )}
            {request.signoffJobNo && (
              <Link to={`/portal/sign-off/${request.signoffJobNo}`} className="btn btn-primary btn-sm">
                <FileSignature size={15} aria-hidden />
                {t('Sign-off', 'ยืนยันงาน')}
              </Link>
            )}
            {CANCELLABLE.includes(request.status) && (
              <button className="btn btn-outline btn-sm" onClick={() => setCancelOpen(true)}>
                <XCircle size={15} aria-hidden />
                {t('Cancel request', 'ยกเลิกคำขอ')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Appointment banner */}
      {request.appointment && (
        <div className="appt-banner">
          <div className="appt-icon">
            <Calendar size={22} />
          </div>
          <div>
            <div className="appt-label">{t('Confirmed appointment', 'นัดหมายที่ยืนยันแล้ว')}</div>
            <div className="appt-info">{fmtDate(request.appointment.date, lang)} · {request.appointment.time}</div>
            <div className="appt-sub">{t('Engineer', 'วิศวกร')}: {request.appointment.engineer}</div>
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid-2" style={{ alignItems: 'start', gap: 16 }}>
        {/* Left column */}
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Details */}
          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ marginTop: 0, marginBottom: 14 }}>{t('Request details', 'รายละเอียดคำขอ')}</h3>
            <div className="stat-line">
              <span className="k">{t('Site', 'ไซต์')}</span>
              <span className="v">{siteName(customerCode, request.siteId, lang)}</span>
            </div>
            <div className="stat-line">
              <span className="k">{t('Equipment', 'อุปกรณ์')}</span>
              <span className="v">
                {asset ? <Link to={`/portal/equipment/${asset.id}`}>{asset.name}</Link> : t('Not linked', 'ไม่ระบุ')}
              </span>
            </div>
            {request.condition && (
              <div className="stat-line">
                <span className="k">{t('Condition', 'สภาพอุปกรณ์')}</span>
                <span className="v">{request.condition}</span>
              </div>
            )}
            <div className="stat-line">
              <span className="k">{t('SE team', 'ทีม SE')}</span>
              <span className="v">{request.team}</span>
            </div>
            <div className="stat-line">
              <span className="k">{t('Contact', 'ผู้ติดต่อ')}</span>
              <span className="v">{request.contactPerson}{request.contactMethod ? ` · ${request.contactMethod}` : ''}</span>
            </div>
            {request.preferredDate && (
              <div className="stat-line">
                <span className="k">{t('Preferred date', 'วันที่สะดวก')}</span>
                <span className="v">{fmtDate(request.preferredDate, lang)}</span>
              </div>
            )}
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px dashed var(--se-border)' }}>
              <div className="muted small" style={{ marginBottom: 6 }}>{t('Description', 'รายละเอียด')}</div>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 13.5 }}>{request.description}</p>
            </div>
          </div>

          {/* SLA card */}
          <div className="card" style={{ padding: 18 }}>
            <div className="between" style={{ marginBottom: 4 }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={16} aria-hidden /> {t('SLA vs. plan', 'SLA เทียบแผน')}
              </h3>
              <StatusBadge label={lang === 'th' ? slaMeta.th : slaMeta.en} tone={slaMeta.tone} />
            </div>
            <p className="muted small" style={{ marginTop: 0, marginBottom: 0 }}>
              {t(
                `Priority: ${pr.en} · Target first response by ${fmtDate(sla.plannedResponseAt.toISOString(), lang)}`,
                `ความเร่งด่วน: ${pr.th} · เป้าหมายตอบสนองแรกภายใน ${fmtDate(sla.plannedResponseAt.toISOString(), lang)}`,
              )}
            </p>
            <SlaProgressBar sla={sla} />
            <div className="stat-line">
              <span className="k">{t('Target completion', 'เป้าหมายงานเสร็จ')}</span>
              <span className="v">{fmtDate(sla.plannedCompletionAt.toISOString(), lang)}</span>
            </div>
            {sla.actualResponseAt && (
              <div className="stat-line">
                <span className="k">{t('Actual response', 'ตอบสนองจริง')}</span>
                <span className="v">
                  {fmtDate(sla.actualResponseAt.toISOString(), lang)}{' '}
                  {sla.responseDeltaHours !== undefined && (
                    <StatusBadge
                      label={
                        sla.responseDeltaHours <= 0
                          ? t(`${fmtHoursDelta(sla.responseDeltaHours, lang)} ahead`, `เร็วกว่า ${fmtHoursDelta(sla.responseDeltaHours, lang)}`)
                          : t(`${fmtHoursDelta(sla.responseDeltaHours, lang)} late`, `ช้ากว่า ${fmtHoursDelta(sla.responseDeltaHours, lang)}`)
                      }
                      tone={sla.responseDeltaHours <= 0 ? 'green' : 'amber'}
                    />
                  )}
                </span>
              </div>
            )}
            {sla.actualCompletionAt ? (
              <div className="stat-line">
                <span className="k">{t('Actual completion', 'เสร็จจริง')}</span>
                <span className="v">
                  {fmtDate(sla.actualCompletionAt.toISOString(), lang)}{' '}
                  <StatusBadge
                    label={
                      sla.completionDeltaHours <= 0
                        ? t(`${fmtHoursDelta(sla.completionDeltaHours, lang)} ahead`, `เร็วกว่า ${fmtHoursDelta(sla.completionDeltaHours, lang)}`)
                        : t(`${fmtHoursDelta(sla.completionDeltaHours, lang)} late`, `ช้ากว่า ${fmtHoursDelta(sla.completionDeltaHours, lang)}`)
                    }
                    tone={sla.completionDeltaHours <= 0 ? 'green' : 'amber'}
                  />
                </span>
              </div>
            ) : (
              <div className="stat-line">
                <span className="k">{t('Currently', 'ขณะนี้')}</span>
                <span className="v">
                  <StatusBadge
                    label={
                      sla.completionDeltaHours <= 0
                        ? t(`${fmtHoursDelta(-sla.completionDeltaHours, lang)} remaining`, `เหลือเวลาอีก ${fmtHoursDelta(-sla.completionDeltaHours, lang)}`)
                        : t(`${fmtHoursDelta(sla.completionDeltaHours, lang)} behind target`, `ช้ากว่าเป้าหมาย ${fmtHoursDelta(sla.completionDeltaHours, lang)}`)
                    }
                    tone={sla.completionDeltaHours <= 0 ? 'blue' : 'amber'}
                  />
                </span>
              </div>
            )}
            {sla.isClosed && (
              <div className="flex" style={{ gap: 6, marginTop: 10, color: 'var(--se-success)' }}>
                <CheckCircle2 size={15} aria-hidden />
                <span className="small muted">{t('Closed — figures are final.', 'ปิดแล้ว — ตัวเลขเป็นค่าสุดท้าย')}</span>
              </div>
            )}
          </div>

          {/* Attachments */}
          {request.attachments.length > 0 && (
            <div className="card" style={{ padding: 18 }}>
              <h3 style={{ marginTop: 0, marginBottom: 12 }}>
                <Paperclip size={15} style={{ verticalAlign: -2, marginRight: 6 }} aria-hidden />
                {t('Attachments', 'ไฟล์แนบ')} ({request.attachments.length})
              </h3>
              <div className="flex" style={{ gap: 8, flexWrap: 'wrap' }}>
                {request.attachments.map((a) => (
                  <button
                    key={a}
                    className="chip"
                    onClick={() => showToast(t('Preview not available in demo.', 'ตัวอย่างไฟล์ไม่พร้อมใช้งานในเดโม'), 'info')}
                  >
                    <Paperclip size={12} aria-hidden /> {a}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Progress timeline */}
          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ marginTop: 0, marginBottom: 18 }}>{t('Progress', 'ความคืบหน้า')}</h3>
            <ul className="timeline-v2">
              {request.timeline.map((s, i) => {
                const cls = s.current ? 'current' : s.done ? 'done' : '';
                return (
                  <li key={i} className={`tl-item ${cls}`}>
                    <div className="tl-dot">
                      {s.done || s.current ? <Check size={14} strokeWidth={3} /> : null}
                    </div>
                    <div className="tl-content">
                      <div className="tl-label">{lang === 'th' ? s.labelTh : s.label}</div>
                      <div className="tl-date">{s.date ? fmtDate(s.date, lang) : t('Pending', 'รอดำเนินการ')}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Activity feed */}
          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>{t('Updates from SE', 'อัปเดตจาก SE')}</h3>
            {request.comments.length === 0 ? (
              <p className="muted small">{t('No updates yet — SE will post here as they work on your request.', 'ยังไม่มีอัปเดต — SE จะโพสต์ที่นี่เมื่อดำเนินการ')}</p>
            ) : (
              <div className="activity-feed">
                {request.comments.map((c, i) => {
                  const isSE = c.from === 'se';
                  return (
                    <div key={i} className={`af-item ${isSE ? 'from-se' : 'from-customer'}`}>
                      <div className={`af-avatar ${isSE ? '' : 'from-customer'}`}>
                        {initials(c.author)}
                      </div>
                      <div className="af-bubble">
                        <div className="af-header">
                          <span className="af-author">{c.author}</span>
                          <span className="af-date">{fmtDate(c.date, lang)}</span>
                        </div>
                        <p className="af-text">{c.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <ServiceReportModal record={record} open={reportOpen} onClose={() => setReportOpen(false)} />

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title={t('Cancel this request?', 'ยกเลิกคำขอนี้?')}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setCancelOpen(false)}>{t('Keep request', 'เก็บคำขอไว้')}</button>
            <button className="btn btn-danger" onClick={doCancel}>{t('Yes, cancel it', 'ใช่ ยกเลิกเลย')}</button>
          </>
        }
      >
        <p style={{ marginTop: 0 }}>
          {t(
            `Request ${request.ticketNo} will be marked as cancelled and SE will stop work on it.`,
            `คำขอ ${request.ticketNo} จะถูกยกเลิก และ SE จะหยุดดำเนินการ`,
          )}
        </p>
      </Modal>
    </div>
  );
}
