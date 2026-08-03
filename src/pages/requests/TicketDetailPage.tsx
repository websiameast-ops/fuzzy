import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, CheckCircle2, ClipboardList, Clock, FileSignature, FileText, Paperclip, XCircle } from 'lucide-react';
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
    <div style={{ maxWidth: 940 }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/portal/requests')} style={{ marginBottom: 12, marginLeft: -8 }}>
        <ArrowLeft size={16} aria-hidden />
        {t('All requests', 'คำขอทั้งหมด')}
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">{request.title}</h1>
          <p className="page-sub">
            {request.ticketNo} · {t('created', 'สร้างเมื่อ')} {fmtDate(request.created, lang)} · {t('updated', 'อัปเดต')} {relTime(request.updated, lang)}
          </p>
          <div className="flex" style={{ gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <StatusBadge label={lang === 'th' ? st.th : st.en} tone={st.tone} />
            <StatusBadge label={lang === 'th' ? pr.th : pr.en} tone={pr.tone} />
            <span className="badge t-grey">{request.category}</span>
          </div>
        </div>
        <div className="page-actions">
          {request.reportId && (
            <button className="btn btn-outline" onClick={() => setReportOpen(true)}>
              <FileText size={16} aria-hidden />
              {t('Service report', 'รายงานบริการ')}
            </button>
          )}
          {request.signoffJobNo && (
            <Link to={`/portal/sign-off/${request.signoffJobNo}`} className="btn btn-primary">
              <FileSignature size={16} aria-hidden />
              {t('Go to sign-off', 'ไปหน้ายืนยันงาน')}
            </Link>
          )}
          {CANCELLABLE.includes(request.status) && (
            <button className="btn btn-outline" onClick={() => setCancelOpen(true)}>
              <XCircle size={16} aria-hidden />
              {t('Cancel request', 'ยกเลิกคำขอ')}
            </button>
          )}
        </div>
      </div>

      {request.appointment && (
        <div className="alert-item a-blue" style={{ marginBottom: 16 }}>
          <Calendar size={17} aria-hidden />
          <span>
            <strong>{t('Appointment', 'นัดหมาย')}:</strong> {fmtDate(request.appointment.date, lang)} · {request.appointment.time} — {t('engineer', 'วิศวกร')} {request.appointment.engineer}
          </span>
        </div>
      )}

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ marginTop: 0 }}>{t('Details', 'รายละเอียด')}</h3>
            <p style={{ whiteSpace: 'pre-wrap' }}>{request.description}</p>
            <div className="stat-line"><span className="k">{t('Site', 'ไซต์')}</span><span className="v">{siteName(customerCode, request.siteId, lang)}</span></div>
            <div className="stat-line">
              <span className="k">{t('Equipment', 'อุปกรณ์')}</span>
              <span className="v">
                {asset ? <Link to={`/portal/equipment/${asset.id}`}>{asset.name}</Link> : t('Not linked', 'ไม่ระบุ')}
              </span>
            </div>
            {request.condition && <div className="stat-line"><span className="k">{t('Reported condition', 'สภาพที่แจ้ง')}</span><span className="v">{request.condition}</span></div>}
            <div className="stat-line"><span className="k">{t('SE team', 'ทีม SE')}</span><span className="v">{request.team}</span></div>
            <div className="stat-line"><span className="k">{t('Contact', 'ผู้ติดต่อ')}</span><span className="v">{request.contactPerson}{request.contactMethod ? ` · ${request.contactMethod}` : ''}</span></div>
            {request.preferredDate && <div className="stat-line"><span className="k">{t('Preferred date', 'วันที่สะดวก')}</span><span className="v">{fmtDate(request.preferredDate, lang)}</span></div>}
          </div>

          {request.attachments.length > 0 && (
            <div className="card" style={{ padding: 18 }}>
              <h3 style={{ marginTop: 0 }}>{t('Attachments', 'ไฟล์แนบ')}</h3>
              <div className="flex" style={{ gap: 8, flexWrap: 'wrap' }}>
                {request.attachments.map((a) => (
                  <button
                    key={a}
                    className="chip"
                    onClick={() => showToast(t('Preview is not available in this demo.', 'ตัวอย่างไฟล์ไม่พร้อมใช้งานในเดโมนี้'), 'info')}
                  >
                    <Paperclip size={13} aria-hidden /> {a}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ marginTop: 0 }}>{t('Updates from SE', 'อัปเดตจาก SE')}</h3>
            {request.comments.length === 0 && (
              <p className="muted">{t('No comments yet — updates will appear here as SE works on your request.', 'ยังไม่มีความคิดเห็น — อัปเดตจะแสดงที่นี่เมื่อ SE ดำเนินการ')}</p>
            )}
            {request.comments.map((c, i) => (
              <div key={i} style={{ padding: '10px 0', borderBottom: i < request.comments.length - 1 ? '1px dashed var(--se-border)' : 'none' }}>
                <div className="between">
                  <span className="fw-600 small">{c.author}</span>
                  <span className="muted small">{fmtDate(c.date, lang)}</span>
                </div>
                <p style={{ margin: '4px 0 0' }}>{c.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ marginTop: 0 }}>{t('Progress timeline', 'ไทม์ไลน์ความคืบหน้า')}</h3>
          <ul className="timeline">
            {request.timeline.map((s, i) => (
              <li key={i} className={s.current ? 'current' : s.done ? 'done' : ''}>
                <span className="t-dot" aria-hidden />
                <div className="fw-600 small">{lang === 'th' ? s.labelTh : s.label}</div>
                <div className="muted small">{s.date ? fmtDate(s.date, lang) : t('Pending', 'รอดำเนินการ')}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div className="between" style={{ marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}><Clock size={17} aria-hidden style={{ verticalAlign: -3 }} /> {t('Timeline vs. plan', 'ไทม์ไลน์เทียบแผน')}</h3>
            <StatusBadge label={lang === 'th' ? slaMeta.th : slaMeta.en} tone={slaMeta.tone} />
          </div>
          <p className="muted small" style={{ marginTop: 0 }}>
            {t(
              `Based on the ${request.priority} priority target for this request type — a reference so you can see whether SE is running faster or slower than planned.`,
              `อ้างอิงเป้าหมายตามระดับความเร่งด่วน "${pr.th}" ของคำขอนี้ — เพื่อให้เห็นว่า SE ดำเนินการเร็วหรือช้ากว่าแผนที่วางไว้`,
            )}
          </p>

          <div className="stat-line">
            <span className="k">{t('Target first response', 'เป้าหมายตอบสนองครั้งแรก')}</span>
            <span className="v">{fmtDate(sla.plannedResponseAt.toISOString(), lang)}</span>
          </div>
          {sla.actualResponseAt ? (
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
          ) : (
            <div className="stat-line"><span className="k">{t('Actual response', 'ตอบสนองจริง')}</span><span className="v muted">{t('Pending', 'รอดำเนินการ')}</span></div>
          )}

          <div className="stat-line">
            <span className="k">{t('Target completion', 'เป้าหมายงานเสร็จ')}</span>
            <span className="v">{fmtDate(sla.plannedCompletionAt.toISOString(), lang)}</span>
          </div>
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
                      ? t(`${fmtHoursDelta(-sla.completionDeltaHours, lang)} of runway left`, `เหลือเวลาอีก ${fmtHoursDelta(-sla.completionDeltaHours, lang)}`)
                      : t(`${fmtHoursDelta(sla.completionDeltaHours, lang)} behind target`, `ช้ากว่าเป้าหมาย ${fmtHoursDelta(sla.completionDeltaHours, lang)}`)
                  }
                  tone={sla.completionDeltaHours <= 0 ? 'blue' : 'amber'}
                />
              </span>
            </div>
          )}

          {sla.isClosed && (
            <div className="flex" style={{ gap: 8, marginTop: 10 }}>
              <CheckCircle2 size={16} aria-hidden style={{ color: 'var(--se-success)' }} />
              <span className="small muted">{t('This request is closed — figures above are final.', 'คำขอนี้ปิดแล้ว — ตัวเลขด้านบนเป็นค่าสุดท้าย')}</span>
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
            `Request ${request.ticketNo} will be marked as cancelled and SE will stop work on it. You can always create a new request later.`,
            `คำขอ ${request.ticketNo} จะถูกยกเลิก และ SE จะหยุดดำเนินการ คุณสามารถสร้างคำขอใหม่ได้ภายหลัง`,
          )}
        </p>
      </Modal>
    </div>
  );
}
