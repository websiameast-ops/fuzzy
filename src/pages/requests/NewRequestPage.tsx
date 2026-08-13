import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertOctagon, ArrowLeft, ArrowRight, BellRing, Check, CheckCircle2,
  Droplets, HardHat, MoreHorizontal, Package, Search, TrendingDown,
  Volume2, Waves, Wifi, Wrench,
} from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/contexts/ToastContext';
import { ImageUploadMock, StatusBadge } from '@/components/common';
import { assetsFor, getAsset } from '@/data/mockAssets';
import { siteName } from '@/data/mockCompanies';
import { PRIORITY } from '@/utils/status';
import type { Priority } from '@/types';

const CATEGORIES: { key: string; th: string; icon: React.ReactNode }[] = [
  { key: 'Equipment stopped',              th: 'อุปกรณ์หยุดทำงาน',               icon: <AlertOctagon size={20} /> },
  { key: 'Abnormal sound',                 th: 'เสียงผิดปกติ',                   icon: <Volume2 size={20} /> },
  { key: 'Vibration',                      th: 'การสั่นสะเทือน',                  icon: <Waves size={20} /> },
  { key: 'Leakage',                        th: 'การรั่วซึม',                      icon: <Droplets size={20} /> },
  { key: 'Alarm or error',                 th: 'สัญญาณเตือนหรือข้อผิดพลาด',     icon: <BellRing size={20} /> },
  { key: 'Performance drop',               th: 'ประสิทธิภาพลดลง',                icon: <TrendingDown size={20} /> },
  { key: 'Preventive maintenance request', th: 'ขอรับบริการบำรุงรักษาเชิงป้องกัน', icon: <Wrench size={20} /> },
  { key: 'Inspection request',             th: 'ขอรับการตรวจสอบ',                icon: <Search size={20} /> },
  { key: 'Spare parts / quotation',        th: 'อะไหล่ / ใบเสนอราคา',           icon: <Package size={20} /> },
  { key: 'Installation / relocation',      th: 'ติดตั้ง / ย้ายตำแหน่ง',         icon: <HardHat size={20} /> },
  { key: 'Monitoring / IoT',              th: 'มอนิเตอริ่ง / IoT',             icon: <Wifi size={20} /> },
  { key: 'Other',                          th: 'อื่น ๆ',                         icon: <MoreHorizontal size={20} /> },
];

const CONDITIONS = [
  { key: 'Stopped',                          th: 'หยุดทำงาน' },
  { key: 'Operating with abnormal condition', th: 'เดินเครื่องแต่มีอาการผิดปกติ' },
  { key: 'Intermittent fault',               th: 'อาการเป็น ๆ หาย ๆ' },
  { key: 'Operating normally — preventive',  th: 'เดินเครื่องปกติ — เชิงป้องกัน' },
  { key: 'Safety concern',                   th: 'กังวลด้านความปลอดภัย' },
  { key: 'Not applicable',                   th: 'ไม่เกี่ยวข้องกับอุปกรณ์' },
];

const CONTACT_METHODS = [
  { key: 'Telephone', en: 'Telephone', th: 'โทรศัพท์' },
  { key: 'Email',     en: 'Email',     th: 'อีเมล' },
  { key: 'LINE',      en: 'LINE',      th: 'LINE' },
];

const URGENCY_CLASSES: Record<string, string> = {
  low: '',
  medium: '',
  high: 'u-high',
  urgent: 'u-urgent',
};

type Step = 1 | 2 | 3;

function StepIndicator({ step }: { step: Step }) {
  const { t } = useLang();
  const steps = [
    { label: t('Location', 'สถานที่'), labelKey: 1 },
    { label: t('Problem', 'ปัญหา'), labelKey: 2 },
    { label: t('Review', 'ยืนยัน'), labelKey: 3 },
  ];
  return (
    <div className="step-wizard">
      {steps.map((s, i) => {
        const num = i + 1;
        const cls = num < step ? 'done' : num === step ? 'active' : '';
        return (
          <div key={s.labelKey} className={`sw-step ${cls}`}>
            <div className="sw-num">
              {num < step ? <Check size={14} strokeWidth={3} /> : num}
            </div>
            <div className="sw-label">{s.label}</div>
          </div>
        );
      })}
    </div>
  );
}

export function NewRequestPage() {
  const { lang, t } = useLang();
  const { customerCode, company } = useCompany();
  const { user } = useAuth();
  const { addRequest } = useData();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const assets = useMemo(() => assetsFor(customerCode), [customerCode]);
  const prefillAsset = params.get('asset') ? getAsset(params.get('asset')!) : undefined;
  const prefillTopic = params.get('topic');

  const [step, setStep] = useState<Step>(1);
  const [siteId, setSiteId] = useState(prefillAsset?.siteId ?? params.get('site') ?? company.sites[0]!.id);
  const [assetId, setAssetId] = useState(prefillAsset && prefillAsset.customerCode === customerCode ? prefillAsset.id : '');
  const [category, setCategory] = useState(
    prefillTopic === 'monitoring' ? 'Monitoring / IoT' : prefillTopic === 'alarm' ? 'Alarm or error' : '',
  );
  const [description, setDescription] = useState(
    prefillTopic === 'monitoring' && prefillAsset
      ? `We would like SE to advise on connecting ${prefillAsset.name} (${prefillAsset.id}) to the SE monitoring platform.`
      : prefillTopic === 'alarm' && prefillAsset
        ? `Following up on a monitoring alarm on ${prefillAsset.name} (${prefillAsset.id}). Please review and advise on next steps.`
        : '',
  );
  const [condition, setCondition] = useState(prefillTopic === 'monitoring' ? 'Not applicable' : '');
  const [photos, setPhotos] = useState<string[]>([]);
  const [contactMethod, setContactMethod] = useState('Telephone');
  const [preferredDate, setPreferredDate] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [contactPerson, setContactPerson] = useState(user?.name ?? '');
  const [errors, setErrors] = useState<string[]>([]);

  const selectedAsset = assetId ? getAsset(assetId) : undefined;
  const siteAssets = assets.filter((a) => a.siteId === siteId);

  const validateStep1 = () => {
    const errs: string[] = [];
    if (!siteId) errs.push(t('Choose a site.', 'กรุณาเลือกไซต์งาน'));
    setErrors(errs);
    return errs.length === 0;
  };

  const validateStep2 = () => {
    const errs: string[] = [];
    if (!category) errs.push(t('Choose a problem category.', 'กรุณาเลือกประเภทปัญหา'));
    if (description.trim().length < 15) errs.push(t('Describe the problem in at least a sentence.', 'กรุณาอธิบายปัญหาอย่างน้อยหนึ่งประโยค'));
    if (!condition) errs.push(t('Tell us the current equipment condition.', 'กรุณาระบุสภาพอุปกรณ์'));
    if (!contactPerson.trim()) errs.push(t('Enter a contact person.', 'กรุณาระบุชื่อผู้ติดต่อ'));
    setErrors(errs);
    return errs.length === 0;
  };

  const goNext = () => {
    if (step === 1 && validateStep1()) { setStep(2); window.scrollTo(0, 0); }
    else if (step === 2 && validateStep2()) { setStep(3); window.scrollTo(0, 0); }
  };

  const goBack = () => {
    setErrors([]);
    setStep((s) => (s > 1 ? (s - 1) as Step : s));
    window.scrollTo(0, 0);
  };

  const submit = () => {
    const title = selectedAsset
      ? `${category} — ${selectedAsset.name}`
      : `${category} — ${siteName(customerCode, siteId, 'en')}`;
    const ticketNo = addRequest({
      customerCode, siteId,
      assetId: assetId || undefined,
      category, title,
      description: description.trim(),
      condition, priority,
      contactPerson: contactPerson.trim(),
      contactMethod,
      preferredDate: preferredDate || undefined,
      attachments: photos,
    });
    showToast(
      t(`Request ${ticketNo} submitted — SE will review it shortly.`, `ส่งคำขอ ${ticketNo} แล้ว — SE จะตรวจสอบโดยเร็ว`),
      'success',
    );
    navigate(`/portal/requests/${ticketNo}`, { replace: true });
  };

  const catLabel = (c: string) => (lang === 'th' ? (CATEGORIES.find((x) => x.key === c)?.th ?? c) : c);
  const condLabel = (c: string) => (lang === 'th' ? (CONDITIONS.find((x) => x.key === c)?.th ?? c) : c);

  return (
    <div style={{ maxWidth: 860 }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 12, marginLeft: -8 }}>
        <ArrowLeft size={16} aria-hidden />
        {t('Back', 'ย้อนกลับ')}
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">{t('Report a problem / request service', 'แจ้งปัญหา / ขอรับบริการ')}</h1>
          <p className="page-sub">
            {step === 1 && t('Step 1 — Select location and equipment.', 'ขั้นตอนที่ 1 — เลือกสถานที่และอุปกรณ์')}
            {step === 2 && t('Step 2 — Describe the problem.', 'ขั้นตอนที่ 2 — อธิบายปัญหา')}
            {step === 3 && t('Step 3 — Review and confirm.', 'ขั้นตอนที่ 3 — ตรวจสอบและยืนยัน')}
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <StepIndicator step={step} />

      {/* Error banner */}
      {errors.length > 0 && (
        <div className="alert-item a-red" role="alert" style={{ marginBottom: 16, display: 'block' }}>
          <strong>{t('Please complete the highlighted items:', 'กรุณากรอกข้อมูลต่อไปนี้:')}</strong>
          <ul style={{ margin: '6px 0 0', paddingLeft: 20 }}>
            {errors.map((e) => <li key={e}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* ── STEP 1: Location ── */}
      {step === 1 && (
        <div className="card" style={{ padding: 24 }}>
          <div className="grid-2" style={{ marginBottom: 20 }}>
            <div className="field">
              <label>{t('Company', 'บริษัท')}</label>
              <input value={`${lang === 'th' ? company.nameTh : company.name} (${company.customerCode})`} disabled />
            </div>
            <div className="field">
              <label htmlFor="nr-site">{t('Site', 'ไซต์งาน')}</label>
              <select
                id="nr-site"
                value={siteId}
                onChange={(e) => { setSiteId(e.target.value); setAssetId(''); }}
              >
                {company.sites.map((s) => (
                  <option key={s.id} value={s.id}>{lang === 'th' ? s.nameTh : s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="nr-asset">{t('Equipment', 'อุปกรณ์')} <span className="muted small">({t('optional but recommended', 'ไม่บังคับแต่แนะนำ')})</span></label>
            <select id="nr-asset" value={assetId} onChange={(e) => setAssetId(e.target.value)}>
              <option value="">{t('Not linked to specific equipment', 'ไม่ระบุอุปกรณ์')}</option>
              {siteAssets.map((a) => (
                <option key={a.id} value={a.id}>{a.name} — {a.id}</option>
              ))}
            </select>
            {selectedAsset && (
              <p className="muted small" style={{ marginTop: 6 }}>
                {selectedAsset.brand} {selectedAsset.model} · S/N {selectedAsset.serial} · {selectedAsset.location}
              </p>
            )}
          </div>

          <div className="flex" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <Link to="/portal/requests" className="btn btn-outline">{t('Cancel', 'ยกเลิก')}</Link>
            <button className="btn btn-primary" onClick={goNext}>
              {t('Next: Problem', 'ถัดไป: ปัญหา')}
              <ArrowRight size={16} aria-hidden />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Problem ── */}
      {step === 2 && (
        <div className="card" style={{ padding: 24 }}>
          {/* Category icon grid */}
          <div className="field">
            <label>{t('What kind of problem or request?', 'เป็นปัญหาหรือคำขอประเภทใด?')}</label>
            <div className="cat-grid">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  className={`cat-card ${category === c.key ? 'selected' : ''}`}
                  onClick={() => setCategory(c.key)}
                  aria-pressed={category === c.key}
                >
                  <div className="cat-icon">{c.icon}</div>
                  <div className="cat-label">{lang === 'th' ? c.th : c.key}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Current condition */}
          <div className="field">
            <label>{t('Current equipment condition', 'สภาพอุปกรณ์ในปัจจุบัน')}</label>
            <div className="condition-grid">
              {CONDITIONS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  className={`condition-card ${condition === c.key ? 'selected' : ''}`}
                  onClick={() => setCondition(c.key)}
                  aria-pressed={condition === c.key}
                >
                  {lang === 'th' ? c.th : c.key}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="field">
            <label htmlFor="nr-desc">{t('Describe the problem', 'อธิบายปัญหา')}</label>
            <textarea
              id="nr-desc"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t(
                'What happened, when it started, any alarm codes, and how it affects your operation…',
                'เกิดอะไรขึ้น เริ่มเมื่อไร มีโค้ดแจ้งเตือนหรือไม่ และกระทบการทำงานอย่างไร…',
              )}
            />
          </div>

          {/* Photos */}
          <div className="field">
            <label>{t('Photos', 'รูปภาพ')} <span className="muted small">({t('optional', 'ไม่บังคับ')})</span></label>
            <ImageUploadMock files={photos} onChange={setPhotos} />
          </div>

          {/* Urgency */}
          <div className="field">
            <label>{t('Urgency', 'ความเร่งด่วน')}</label>
            <div className="urgency-grid">
              {(Object.keys(PRIORITY) as Priority[]).map((p) => {
                const meta = PRIORITY[p];
                return (
                  <button
                    key={p}
                    type="button"
                    className={`urgency-card ${priority === p ? `selected ${URGENCY_CLASSES[p]}` : ''}`}
                    onClick={() => setPriority(p)}
                    aria-pressed={priority === p}
                  >
                    <div className="uc-name" style={{
                      color: p === 'urgent' && priority === p ? '#ef4444'
                           : p === 'high' && priority === p ? '#f59e0b'
                           : undefined
                    }}>
                      {lang === 'th' ? meta.th : meta.en}
                    </div>
                    <div className="uc-desc">
                      {p === 'low' && t('When convenient', 'เมื่อสะดวก')}
                      {p === 'medium' && t('Within the week', 'ภายในสัปดาห์นี้')}
                      {p === 'high' && t('Within 1–2 days', 'ภายใน 1–2 วัน')}
                      {p === 'urgent' && t('Production impact — ASAP', 'กระทบการผลิต — ด่วนที่สุด')}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contact */}
          <div className="grid-2">
            <div className="field">
              <label htmlFor="nr-contact">{t('Contact person', 'ผู้ติดต่อ')}</label>
              <input id="nr-contact" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="nr-date">{t('Preferred service date', 'วันที่สะดวกรับบริการ')} <span className="muted small">({t('optional', 'ไม่บังคับ')})</span></label>
              <input id="nr-date" type="date" min="2026-07-15" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label>{t('Preferred contact method', 'ช่องทางติดต่อที่สะดวก')}</label>
            <div className="flex" style={{ gap: 8, flexWrap: 'wrap' }}>
              {CONTACT_METHODS.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  className={`chip ${contactMethod === m.key ? 'active' : ''}`}
                  onClick={() => setContactMethod(m.key)}
                  aria-pressed={contactMethod === m.key}
                >
                  {lang === 'th' ? m.th : m.en}
                </button>
              ))}
            </div>
          </div>

          <div className="flex" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button className="btn btn-outline" onClick={goBack}>
              <ArrowLeft size={16} aria-hidden />
              {t('Back', 'ย้อนกลับ')}
            </button>
            <button className="btn btn-primary" onClick={goNext}>
              {t('Review request', 'ตรวจสอบคำขอ')}
              <ArrowRight size={16} aria-hidden />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Review ── */}
      {step === 3 && (
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>{t('Review & confirm', 'ตรวจสอบและยืนยัน')}</h3>

          <div className="stat-line"><span className="k">{t('Company / site', 'บริษัท / ไซต์')}</span><span className="v">{lang === 'th' ? company.nameTh : company.name} · {siteName(customerCode, siteId, lang)}</span></div>
          <div className="stat-line"><span className="k">{t('Equipment', 'อุปกรณ์')}</span><span className="v">{selectedAsset ? `${selectedAsset.name} (${selectedAsset.id})` : t('Not linked', 'ไม่ระบุ')}</span></div>
          <div className="stat-line"><span className="k">{t('Category', 'ประเภท')}</span><span className="v">{catLabel(category)}</span></div>
          <div className="stat-line"><span className="k">{t('Condition', 'สภาพอุปกรณ์')}</span><span className="v">{condLabel(condition)}</span></div>
          <div className="stat-line">
            <span className="k">{t('Urgency', 'ความเร่งด่วน')}</span>
            <span className="v"><StatusBadge label={lang === 'th' ? PRIORITY[priority].th : PRIORITY[priority].en} tone={PRIORITY[priority].tone} /></span>
          </div>
          <div className="stat-line"><span className="k">{t('Contact', 'ผู้ติดต่อ')}</span><span className="v">{contactPerson} · {contactMethod}</span></div>
          {preferredDate && <div className="stat-line"><span className="k">{t('Preferred date', 'วันที่สะดวก')}</span><span className="v">{preferredDate}</span></div>}
          {photos.length > 0 && <div className="stat-line"><span className="k">{t('Photos', 'รูปภาพ')}</span><span className="v">{photos.join(', ')}</span></div>}

          <div style={{ margin: '16px 0', padding: '14px 16px', background: 'var(--se-background)', borderRadius: 10, border: '1px solid var(--se-border)' }}>
            <div className="muted small" style={{ marginBottom: 6 }}>{t('Description', 'รายละเอียด')}</div>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 13.5 }}>{description}</p>
          </div>

          <div className="alert-item a-blue" style={{ marginBottom: 16 }}>
            <CheckCircle2 size={17} aria-hidden />
            <span>
              {t(
                'After you submit, the SE service coordinator will review and you will see every status change on the ticket timeline.',
                'หลังจากส่ง ผู้ประสานงาน SE จะตรวจสอบ และคุณจะเห็นทุกการอัปเดตบนไทม์ไลน์',
              )}
            </span>
          </div>

          <div className="flex" style={{ justifyContent: 'flex-end', gap: 10 }}>
            <button className="btn btn-outline" onClick={goBack}>
              <ArrowLeft size={16} aria-hidden />
              {t('Edit', 'แก้ไข')}
            </button>
            <button className="btn btn-primary btn-lg" onClick={submit}>
              {t('Submit request', 'ส่งคำขอ')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
