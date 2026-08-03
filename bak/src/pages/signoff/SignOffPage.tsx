import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Camera, CheckCircle2, FileSignature, FileText, Star } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/contexts/ToastContext';
import { EmptyState, SignaturePadMock, Stars, StatusBadge } from '@/components/common';
import { ServiceReportModal } from '@/components/service/ServiceReportModal';
import { getAsset } from '@/data/mockAssets';
import { getReport } from '@/data/mockHistory';
import { siteName } from '@/data/mockCompanies';
import { daysSince, fmtDate } from '@/utils/format';
import type { ServiceRating, SignoffJob } from '@/types';

export function SignOffPage() {
  const { lang, t } = useLang();
  const { customerCode } = useCompany();
  const { signoffs } = useData();

  const mine = useMemo(() => signoffs.filter((s) => s.customerCode === customerCode), [signoffs, customerCode]);
  const pending = mine.filter((s) => s.status === 'pending');
  const signed = mine.filter((s) => s.status === 'signed');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('Work Sign-off & Service Rating', 'ยืนยันงานและประเมินบริการ')}</h1>
          <p className="page-sub">
            {t('Review completed jobs, sign digitally, and tell SE how the service went.', 'ตรวจสอบงานที่เสร็จสิ้น ลงนามดิจิทัล และบอก SE ว่าบริการเป็นอย่างไร')}
          </p>
        </div>
      </div>

      <h3 style={{ margin: '0 0 10px' }}>{t('Awaiting your sign-off', 'รอการยืนยันจากคุณ')}</h3>
      {pending.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 size={24} />}
          title={t('All caught up', 'ไม่มีงานค้างยืนยัน')}
          body={t('When SE completes a job, it will appear here for your review and signature.', 'เมื่อ SE ทำงานเสร็จ งานจะแสดงที่นี่เพื่อให้คุณตรวจสอบและลงนาม')}
        />
      ) : (
        <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
          {pending.map((s) => {
            const asset = getAsset(s.assetId);
            const waiting = daysSince(s.completedDate);
            return (
              <div key={s.jobNo} className="card" style={{ padding: 16 }}>
                <div className="between" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div className="fw-600">{s.summary}</div>
                    <div className="muted small">
                      {s.jobNo} · {asset?.name ?? s.assetId} · {siteName(customerCode, s.siteId, lang)}
                    </div>
                    <div className="muted small">
                      {t('Completed', 'เสร็จเมื่อ')} {fmtDate(s.completedDate, lang)} · {t('engineer', 'วิศวกร')} {s.engineer}
                    </div>
                    <div className="flex" style={{ gap: 6, marginTop: 6 }}>
                      <StatusBadge label={t(`Waiting ${waiting} day(s)`, `รอมาแล้ว ${waiting} วัน`)} tone={waiting > 5 ? 'amber' : 'blue'} />
                    </div>
                  </div>
                  <Link to={`/portal/sign-off/${s.jobNo}`} className="btn btn-primary">
                    <FileSignature size={16} aria-hidden />
                    {t('Review & sign', 'ตรวจสอบและลงนาม')}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <h3 style={{ margin: '0 0 10px' }}>{t('Signed & rated', 'ยืนยันแล้ว')}</h3>
      {signed.length === 0 ? (
        <p className="muted">{t('Jobs you have signed will be listed here with your rating.', 'งานที่คุณยืนยันแล้วจะแสดงที่นี่พร้อมคะแนน')}</p>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {signed.map((s) => {
            const asset = getAsset(s.assetId);
            return (
              <div key={s.jobNo} className="card" style={{ padding: 16 }}>
                <div className="between" style={{ flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div className="fw-600">{s.summary}</div>
                    <div className="muted small">{s.jobNo} · {asset?.name ?? s.assetId} · {t('signed by', 'ลงนามโดย')} {s.signedBy} · {s.signedDate && fmtDate(s.signedDate, lang)}</div>
                  </div>
                  <div className="flex" style={{ gap: 8 }}>
                    {s.rating && <Stars value={s.rating.overall} readOnly size={18} label={t('Overall rating', 'คะแนนรวม')} />}
                    <Link to={`/portal/sign-off/${s.jobNo}`} className="btn btn-outline btn-sm">{t('View', 'ดู')}</Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------- Detail: 8-step wizard ---------------- */

const STEPS = [
  { en: 'Work summary', th: 'สรุปงาน' },
  { en: 'Service report', th: 'รายงานบริการ' },
  { en: 'Photos', th: 'รูปภาพ' },
  { en: 'Satisfactory?', th: 'พอใจหรือไม่' },
  { en: 'Your details', th: 'ข้อมูลผู้ลงนาม' },
  { en: 'Signature', th: 'ลายเซ็น' },
  { en: 'Comments', th: 'ความคิดเห็น' },
  { en: 'Confirm', th: 'ยืนยัน' },
];

const RATING_ASPECTS: { key: keyof Pick<ServiceRating, 'speed' | 'quality' | 'communication' | 'professionalism' | 'cleanliness'>; en: string; th: string }[] = [
  { key: 'speed', en: 'Response speed', th: 'ความรวดเร็ว' },
  { key: 'quality', en: 'Work quality', th: 'คุณภาพงาน' },
  { key: 'communication', en: 'Communication', th: 'การสื่อสาร' },
  { key: 'professionalism', en: 'Professionalism', th: 'ความเป็นมืออาชีพ' },
  { key: 'cleanliness', en: 'Site cleanliness', th: 'ความเรียบร้อยหน้างาน' },
];

export function SignOffDetailPage() {
  const { jobNo } = useParams();
  const { lang, t } = useLang();
  const { customerCode } = useCompany();
  const { user } = useAuth();
  const { signoffs, submitSignoff } = useData();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const job: SignoffJob | undefined = useMemo(
    () => signoffs.find((s) => s.jobNo === jobNo && s.customerCode === customerCode),
    [signoffs, jobNo, customerCode],
  );

  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<'signoff' | 'rating' | 'done'>('signoff');
  const [reportOpen, setReportOpen] = useState(false);
  const [satisfactory, setSatisfactory] = useState<'yes' | 'no' | ''>('');
  const [signedBy, setSignedBy] = useState(user?.name ?? '');
  const [signedTitle, setSignedTitle] = useState('');
  const [hasInk, setHasInk] = useState(false);
  const [comment, setComment] = useState('');

  const [overall, setOverall] = useState(0);
  const [aspects, setAspects] = useState<Record<string, number>>({ speed: 0, quality: 0, communication: 0, professionalism: 0, cleanliness: 0 });
  const [firstTimeFix, setFirstTimeFix] = useState<'yes' | 'partial' | 'no' | ''>('');
  const [ratingComments, setRatingComments] = useState('');
  const [allowContact, setAllowContact] = useState(true);

  if (!job) {
    return (
      <EmptyState
        icon={<FileSignature size={24} />}
        title={t('Job not found', 'ไม่พบงาน')}
        body={t('This sign-off job may belong to another company profile.', 'งานนี้อาจอยู่ในบริษัทอื่น')}
        action={<Link to="/portal/sign-off" className="btn btn-primary btn-sm">{t('Back to sign-off', 'กลับไปหน้ายืนยันงาน')}</Link>}
      />
    );
  }

  const record = getReport(job.reportId) ?? null;
  const asset = getAsset(job.assetId);

  /* Already signed → summary view */
  if (job.status === 'signed' && phase !== 'done') {
    return (
      <div style={{ maxWidth: 760 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/portal/sign-off')} style={{ marginBottom: 12, marginLeft: -8 }}>
          <ArrowLeft size={16} aria-hidden />
          {t('All sign-offs', 'งานยืนยันทั้งหมด')}
        </button>
        <div className="card" style={{ padding: 22 }}>
          <div className="flex" style={{ gap: 10, marginBottom: 8 }}>
            <CheckCircle2 size={22} style={{ color: 'var(--se-success)' }} aria-hidden />
            <h2 style={{ margin: 0 }}>{t('This job is signed off', 'งานนี้ยืนยันเรียบร้อยแล้ว')}</h2>
          </div>
          <p className="muted" style={{ marginTop: 0 }}>{job.summary}</p>
          <div className="stat-line"><span className="k">{t('Job', 'งาน')}</span><span className="v">{job.jobNo}</span></div>
          <div className="stat-line"><span className="k">{t('Equipment', 'อุปกรณ์')}</span><span className="v">{asset?.name ?? job.assetId}</span></div>
          <div className="stat-line"><span className="k">{t('Signed by', 'ลงนามโดย')}</span><span className="v">{job.signedBy} — {job.signedTitle}</span></div>
          <div className="stat-line"><span className="k">{t('Signed on', 'วันที่ลงนาม')}</span><span className="v">{job.signedDate && fmtDate(job.signedDate, lang)}</span></div>
          {job.signComment && <div className="stat-line"><span className="k">{t('Comment', 'ความคิดเห็น')}</span><span className="v">{job.signComment}</span></div>}
          {job.rating && (
            <div style={{ marginTop: 14 }}>
              <div className="fw-600" style={{ marginBottom: 6 }}>{t('Your service rating', 'คะแนนบริการของคุณ')}</div>
              <Stars value={job.rating.overall} readOnly label={t('Overall', 'คะแนนรวม')} />
            </div>
          )}
          <div className="flex" style={{ gap: 10, marginTop: 18 }}>
            <button className="btn btn-outline" onClick={() => setReportOpen(true)}>
              <FileText size={16} aria-hidden />
              {t('View service report', 'ดูรายงานบริการ')}
            </button>
            {job.ticketNo && (
              <Link to={`/portal/requests/${job.ticketNo}`} className="btn btn-outline">
                {t('View original request', 'ดูคำขอเดิม')}
              </Link>
            )}
          </div>
        </div>
        <ServiceReportModal record={record} open={reportOpen} onClose={() => setReportOpen(false)} />
      </div>
    );
  }

  const canNext = () => {
    if (step === 3) return satisfactory !== '';
    if (step === 4) return signedBy.trim() !== '' && signedTitle.trim() !== '';
    if (step === 5) return hasInk;
    return true;
  };

  const next = () => {
    if (!canNext()) {
      if (step === 3) showToast(t('Please tell us if the work is satisfactory.', 'กรุณาระบุว่างานเป็นที่พอใจหรือไม่'), 'error');
      if (step === 4) showToast(t('Please enter your name and job title.', 'กรุณากรอกชื่อและตำแหน่ง'), 'error');
      if (step === 5) showToast(t('Please draw your signature before continuing.', 'กรุณาลงลายเซ็นก่อนดำเนินการต่อ'), 'error');
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo(0, 0);
  };

  const submitSign = () => {
    setPhase('rating');
    window.scrollTo(0, 0);
  };

  const submitRating = () => {
    if (overall === 0) {
      showToast(t('Please give an overall star rating.', 'กรุณาให้คะแนนรวม'), 'error');
      return;
    }
    if (!firstTimeFix) {
      showToast(t('Please tell us if the problem was fixed on the first visit.', 'กรุณาระบุว่าปัญหาแก้ไขได้ในครั้งแรกหรือไม่'), 'error');
      return;
    }
    submitSignoff(job.jobNo, {
      signedBy: signedBy.trim(),
      signedTitle: signedTitle.trim(),
      comment: comment.trim(),
      rating: {
        overall,
        speed: aspects.speed ?? 0,
        quality: aspects.quality ?? 0,
        communication: aspects.communication ?? 0,
        professionalism: aspects.professionalism ?? 0,
        cleanliness: aspects.cleanliness ?? 0,
        firstTimeFix,
        comments: ratingComments.trim(),
        allowContact,
      },
    });
    setPhase('done');
    showToast(t(`Job ${job.jobNo} signed off — thank you for the feedback!`, `ยืนยันงาน ${job.jobNo} แล้ว — ขอบคุณสำหรับความคิดเห็น!`), 'success');
    window.scrollTo(0, 0);
  };

  /* Confirmation screen */
  if (phase === 'done') {
    return (
      <div style={{ maxWidth: 640 }}>
        <div className="card" style={{ padding: 28, textAlign: 'center' }}>
          <CheckCircle2 size={52} style={{ color: 'var(--se-success)', margin: '0 auto 12px' }} aria-hidden />
          <h2 style={{ margin: '0 0 8px' }}>{t('All done — thank you!', 'เสร็จเรียบร้อย — ขอบคุณค่ะ!')}</h2>
          <p className="muted">
            {t(
              `Job ${job.jobNo} is signed and your rating was sent to the SE service team. The linked service request has been closed.`,
              `งาน ${job.jobNo} ได้รับการยืนยัน และคะแนนของคุณถูกส่งถึงทีมบริการ SE แล้ว คำขอที่เกี่ยวข้องถูกปิดเรียบร้อย`,
            )}
          </p>
          <div className="flex" style={{ gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 10 }}>
            {job.ticketNo && (
              <Link to={`/portal/requests/${job.ticketNo}`} className="btn btn-outline">{t('View closed request', 'ดูคำขอที่ปิดแล้ว')}</Link>
            )}
            <Link to="/portal/sign-off" className="btn btn-outline">{t('Back to sign-off', 'กลับหน้ายืนยันงาน')}</Link>
            <Link to="/portal" className="btn btn-primary">{t('Go to dashboard', 'ไปหน้าหลัก')}</Link>
          </div>
        </div>
      </div>
    );
  }

  /* Rating phase */
  if (phase === 'rating') {
    return (
      <div style={{ maxWidth: 720 }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">{t('Rate the service', 'ประเมินบริการ')}</h1>
            <p className="page-sub">{t(`One last step for ${job.jobNo} — 30 seconds of feedback helps SE improve.`, `ขั้นตอนสุดท้ายของงาน ${job.jobNo} — ความคิดเห็น 30 วินาทีช่วยให้ SE พัฒนา`)}</p>
          </div>
        </div>
        <div className="card" style={{ padding: 22 }}>
          <div className="field">
            <label>{t('Overall satisfaction', 'ความพึงพอใจโดยรวม')}</label>
            <Stars value={overall} onChange={setOverall} size={34} label={t('Overall satisfaction', 'ความพึงพอใจโดยรวม')} />
          </div>
          <div className="field">
            <label>{t('Rate each aspect', 'ให้คะแนนแต่ละด้าน')}</label>
            <div style={{ display: 'grid', gap: 8 }}>
              {RATING_ASPECTS.map((a) => (
                <div key={a.key} className="between" style={{ flexWrap: 'wrap', gap: 6 }}>
                  <span className="small">{lang === 'th' ? a.th : a.en}</span>
                  <Stars
                    value={aspects[a.key] ?? 0}
                    onChange={(v) => setAspects((prev) => ({ ...prev, [a.key]: v }))}
                    size={22}
                    label={lang === 'th' ? a.th : a.en}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="field">
            <label>{t('Was the problem fixed on the first visit?', 'ปัญหาได้รับการแก้ไขในการเข้างานครั้งแรกหรือไม่?')}</label>
            <div className="grid-3" style={{ gap: 8 }}>
              {([
                { key: 'yes', en: 'Yes, completely', th: 'ใช่ แก้ไขได้ครบถ้วน' },
                { key: 'partial', en: 'Partially', th: 'แก้ไขได้บางส่วน' },
                { key: 'no', en: 'No', th: 'ไม่ได้' },
              ] as const).map((o) => (
                <button
                  key={o.key}
                  type="button"
                  className={`radio-card ${firstTimeFix === o.key ? 'selected' : ''}`}
                  onClick={() => setFirstTimeFix(o.key)}
                  aria-pressed={firstTimeFix === o.key}
                >
                  {lang === 'th' ? o.th : o.en}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label htmlFor="rt-comments">{t('Comments for the SE team (optional)', 'ความคิดเห็นถึงทีม SE (ไม่บังคับ)')}</label>
            <textarea id="rt-comments" rows={3} value={ratingComments} onChange={(e) => setRatingComments(e.target.value)} />
          </div>
          <label className="checkbox-row" style={{ marginBottom: 16 }}>
            <input type="checkbox" checked={allowContact} onChange={(e) => setAllowContact(e.target.checked)} />
            <span className="small">{t('SE may contact me about this feedback.', 'SE สามารถติดต่อฉันเกี่ยวกับความคิดเห็นนี้ได้')}</span>
          </label>
          <div className="flex" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-primary btn-lg" onClick={submitRating}>
              <Star size={17} aria-hidden />
              {t('Submit rating & finish', 'ส่งคะแนนและเสร็จสิ้น')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* Sign-off wizard */
  return (
    <div style={{ maxWidth: 760 }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/portal/sign-off')} style={{ marginBottom: 12, marginLeft: -8 }}>
        <ArrowLeft size={16} aria-hidden />
        {t('All sign-offs', 'งานยืนยันทั้งหมด')}
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">{t('Sign off job', 'ยืนยันงาน')} {job.jobNo}</h1>
          <p className="page-sub">{job.summary}</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="chip-row" style={{ marginBottom: 16 }} aria-label={t('Progress', 'ความคืบหน้า')}>
        {STEPS.map((s, i) => (
          <span key={s.en} className={`chip ${i === step ? 'active' : ''}`} style={i < step ? { borderColor: 'var(--se-success)', color: 'var(--se-success)' } : undefined}>
            {i + 1}. {lang === 'th' ? s.th : s.en}
          </span>
        ))}
      </div>

      <div className="card" style={{ padding: 22 }}>
        {step === 0 && (
          <>
            <h3 style={{ marginTop: 0 }}>{t('1 · Review the work', 'ขั้นตอนที่ 1 · ตรวจสอบงาน')}</h3>
            <div className="stat-line"><span className="k">{t('Job', 'งาน')}</span><span className="v">{job.jobNo}</span></div>
            <div className="stat-line">
              <span className="k">{t('Equipment', 'อุปกรณ์')}</span>
              <span className="v">{asset ? <Link to={`/portal/equipment/${asset.id}`}>{asset.name}</Link> : job.assetId}</span>
            </div>
            <div className="stat-line"><span className="k">{t('Site', 'ไซต์')}</span><span className="v">{siteName(customerCode, job.siteId, lang)}</span></div>
            <div className="stat-line"><span className="k">{t('Completed', 'เสร็จเมื่อ')}</span><span className="v">{fmtDate(job.completedDate, lang)}</span></div>
            <div className="stat-line"><span className="k">{t('Engineer', 'วิศวกร')}</span><span className="v">{job.engineer}</span></div>
            {job.ticketNo && (
              <div className="stat-line">
                <span className="k">{t('Original request', 'คำขอเดิม')}</span>
                <span className="v"><Link to={`/portal/requests/${job.ticketNo}`}>{job.ticketNo}</Link></span>
              </div>
            )}
          </>
        )}

        {step === 1 && (
          <>
            <h3 style={{ marginTop: 0 }}>{t('2 · Read the service report', 'ขั้นตอนที่ 2 · อ่านรายงานบริการ')}</h3>
            <p className="muted">
              {t('The engineer documented findings, root cause, parts used and test results. Please open and review it before signing.', 'วิศวกรได้บันทึกสิ่งที่ตรวจพบ สาเหตุ อะไหล่ที่ใช้ และผลทดสอบ กรุณาเปิดอ่านก่อนลงนาม')}
            </p>
            <button className="btn btn-outline" onClick={() => setReportOpen(true)}>
              <FileText size={16} aria-hidden />
              {t('Open report', 'เปิดรายงาน')} {job.reportId}
            </button>
          </>
        )}

        {step === 2 && record && (
          <>
            <h3 style={{ marginTop: 0 }}>{t('3 · Before & after photos', 'ขั้นตอนที่ 3 · รูปก่อนและหลัง')}</h3>
            <div className="fw-600 small" style={{ marginBottom: 6 }}>{t('Before', 'ก่อนดำเนินการ')}</div>
            <div className="upload-grid">
              {record.report.beforePhotos.map((p) => (
                <div key={p} className="upload-thumb"><Camera size={20} aria-hidden /><span className="small">{p}</span></div>
              ))}
            </div>
            <div className="fw-600 small" style={{ margin: '10px 0 6px' }}>{t('After', 'หลังดำเนินการ')}</div>
            <div className="upload-grid">
              {record.report.afterPhotos.map((p) => (
                <div key={p} className="upload-thumb"><Camera size={20} aria-hidden /><span className="small">{p}</span></div>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h3 style={{ marginTop: 0 }}>{t('4 · Is the work satisfactory?', 'ขั้นตอนที่ 4 · งานเป็นที่พอใจหรือไม่?')}</h3>
            <div className="grid-2" style={{ gap: 10 }}>
              <button type="button" className={`radio-card ${satisfactory === 'yes' ? 'selected' : ''}`} onClick={() => setSatisfactory('yes')} aria-pressed={satisfactory === 'yes'}>
                <span className="fw-600">{t('Yes — accept the work', 'ใช่ — ยอมรับงาน')}</span>
                <span className="muted small" style={{ display: 'block' }}>{t('Everything is working as expected.', 'ทุกอย่างทำงานได้ตามที่คาดหวัง')}</span>
              </button>
              <button type="button" className={`radio-card ${satisfactory === 'no' ? 'selected' : ''}`} onClick={() => setSatisfactory('no')} aria-pressed={satisfactory === 'no'}>
                <span className="fw-600">{t('Not yet — something needs attention', 'ยังไม่ — มีสิ่งที่ต้องแก้ไข')}</span>
                <span className="muted small" style={{ display: 'block' }}>{t('You can still sign and describe the issue in comments — SE will follow up.', 'คุณยังลงนามได้และระบุปัญหาในความคิดเห็น — SE จะติดตามให้')}</span>
              </button>
            </div>
            {satisfactory === 'no' && (
              <div className="alert-item a-amber" style={{ marginTop: 12 }}>
                <FileSignature size={16} aria-hidden />
                <span className="small">
                  {t('Please describe what is not right in the comments step. The service coordinator will contact you within 1 business day.', 'กรุณาระบุสิ่งที่ยังไม่เรียบร้อยในขั้นตอนความคิดเห็น ผู้ประสานงานบริการจะติดต่อกลับภายใน 1 วันทำการ')}
                </span>
              </div>
            )}
          </>
        )}

        {step === 4 && (
          <>
            <h3 style={{ marginTop: 0 }}>{t('5 · Who is signing?', 'ขั้นตอนที่ 5 · ผู้ลงนามคือใคร?')}</h3>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="so-name">{t('Full name', 'ชื่อ-นามสกุล')}</label>
                <input id="so-name" value={signedBy} onChange={(e) => setSignedBy(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="so-title">{t('Job title', 'ตำแหน่ง')}</label>
                <input id="so-title" value={signedTitle} onChange={(e) => setSignedTitle(e.target.value)} placeholder={t('e.g. Maintenance Manager', 'เช่น ผู้จัดการฝ่ายซ่อมบำรุง')} />
              </div>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <h3 style={{ marginTop: 0 }}>{t('6 · Draw your signature', 'ขั้นตอนที่ 6 · ลงลายเซ็น')}</h3>
            <SignaturePadMock onChange={setHasInk} />
          </>
        )}

        {step === 6 && (
          <>
            <h3 style={{ marginTop: 0 }}>{t('7 · Comments (optional)', 'ขั้นตอนที่ 7 · ความคิดเห็น (ไม่บังคับ)')}</h3>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                satisfactory === 'no'
                  ? t('Please describe what still needs attention…', 'กรุณาระบุสิ่งที่ยังต้องแก้ไข…')
                  : t('Anything you want the SE team to know…', 'สิ่งที่อยากบอกทีม SE…')
              }
              style={{ width: '100%' }}
            />
          </>
        )}

        {step === 7 && (
          <>
            <h3 style={{ marginTop: 0 }}>{t('8 · Confirm and submit', 'ขั้นตอนที่ 8 · ยืนยันและส่ง')}</h3>
            <div className="stat-line"><span className="k">{t('Job', 'งาน')}</span><span className="v">{job.jobNo}</span></div>
            <div className="stat-line">
              <span className="k">{t('Work accepted', 'ยอมรับงาน')}</span>
              <span className="v">
                <StatusBadge
                  label={satisfactory === 'yes' ? t('Yes — satisfactory', 'ใช่ — พอใจ') : t('With reservations', 'มีข้อสังเกต')}
                  tone={satisfactory === 'yes' ? 'green' : 'amber'}
                />
              </span>
            </div>
            <div className="stat-line"><span className="k">{t('Signed by', 'ลงนามโดย')}</span><span className="v">{signedBy} — {signedTitle}</span></div>
            <div className="stat-line"><span className="k">{t('Signature', 'ลายเซ็น')}</span><span className="v">{t('Captured ✓', 'บันทึกแล้ว ✓')}</span></div>
            {comment && <div className="stat-line"><span className="k">{t('Comment', 'ความคิดเห็น')}</span><span className="v">{comment}</span></div>}
            <p className="muted small">
              {t('After submitting, you will be asked to rate the service — then the job and its request are closed.', 'หลังจากส่ง ระบบจะให้ประเมินบริการ จากนั้นงานและคำขอที่เกี่ยวข้องจะถูกปิด')}
            </p>
          </>
        )}

        <div className="between" style={{ marginTop: 20 }}>
          <button className="btn btn-outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            <ArrowLeft size={16} aria-hidden />
            {t('Back', 'ย้อนกลับ')}
          </button>
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary" onClick={next}>
              {t('Continue', 'ถัดไป')}
              <ArrowRight size={16} aria-hidden />
            </button>
          ) : (
            <button className="btn btn-primary btn-lg" onClick={submitSign}>
              <FileSignature size={17} aria-hidden />
              {t('Sign off & continue to rating', 'ลงนามและไปประเมินบริการ')}
            </button>
          )}
        </div>
      </div>

      <ServiceReportModal record={record} open={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  );
}
