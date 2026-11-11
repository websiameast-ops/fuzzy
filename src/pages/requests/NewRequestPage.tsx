import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
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

const CATEGORIES = [
  'Equipment stopped',
  'Abnormal sound',
  'Vibration',
  'Leakage',
  'Alarm or error',
  'Performance drop',
  'Preventive maintenance request',
  'Inspection request',
  'Spare parts / quotation',
  'Installation / relocation',
  'Monitoring / IoT',
  'Other',
];

const CATEGORY_TH: Record<string, string> = {
  'Equipment stopped': 'อุปกรณ์หยุดทำงาน',
  'Abnormal sound': 'เสียงผิดปกติ',
  Vibration: 'การสั่นสะเทือน',
  Leakage: 'การรั่วซึม',
  'Alarm or error': 'สัญญาณเตือนหรือข้อผิดพลาด',
  'Performance drop': 'ประสิทธิภาพลดลง',
  'Preventive maintenance request': 'ขอรับบริการบำรุงรักษาเชิงป้องกัน',
  'Inspection request': 'ขอรับการตรวจสอบ',
  'Spare parts / quotation': 'อะไหล่ / ใบเสนอราคา',
  'Installation / relocation': 'ติดตั้ง / ย้ายตำแหน่ง',
  'Monitoring / IoT': 'มอนิเตอริ่ง / IoT',
  Other: 'อื่น ๆ',
};

const CONDITIONS = [
  'Stopped',
  'Operating with abnormal condition',
  'Intermittent fault',
  'Operating normally — preventive',
  'Safety concern',
  'Not applicable',
];

const CONDITION_TH: Record<string, string> = {
  Stopped: 'หยุดทำงาน',
  'Operating with abnormal condition': 'เดินเครื่องแต่มีอาการผิดปกติ',
  'Intermittent fault': 'อาการเป็น ๆ หาย ๆ',
  'Operating normally — preventive': 'เดินเครื่องปกติ — เชิงป้องกัน',
  'Safety concern': 'กังวลด้านความปลอดภัย',
  'Not applicable': 'ไม่เกี่ยวข้องกับอุปกรณ์',
};

const CONTACT_METHODS = [
  { key: 'Telephone', en: 'Telephone', th: 'โทรศัพท์' },
  { key: 'Email', en: 'Email', th: 'อีเมล' },
  { key: 'LINE', en: 'LINE', th: 'LINE' },
];

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

  const [step, setStep] = useState<'form' | 'review'>('form');
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

  const validate = () => {
    const errs: string[] = [];
    if (!category) errs.push(t('Choose a problem category.', 'กรุณาเลือกประเภทปัญหา'));
    if (description.trim().length < 15)
      errs.push(t('Describe the problem in at least a sentence or two.', 'กรุณาอธิบายปัญหาอย่างน้อยหนึ่งถึงสองประโยค'));
    if (!condition) errs.push(t('Tell us the current equipment condition.', 'กรุณาระบุสภาพอุปกรณ์ในปัจจุบัน'));
    if (!contactPerson.trim()) errs.push(t('Enter a contact person.', 'กรุณาระบุชื่อผู้ติดต่อ'));
    setErrors(errs);
    return errs.length === 0;
  };

  const goReview = () => {
    if (validate()) {
      setStep('review');
      window.scrollTo(0, 0);
    }
  };

  const submit = () => {
    const title = selectedAsset
      ? `${category} — ${selectedAsset.name}`
      : `${category} — ${siteName(customerCode, siteId, 'en')}`;
    const ticketNo = addRequest({
      customerCode,
      siteId,
      assetId: assetId || undefined,
      category,
      title,
      description: description.trim(),
      condition,
      priority,
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

  const catLabel = (c: string) => (lang === 'th' ? CATEGORY_TH[c] ?? c : c);
  const condLabel = (c: string) => (lang === 'th' ? CONDITION_TH[c] ?? c : c);

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
            {step === 'form'
              ? t('Tell us what happened — the more detail, the faster SE can help.', 'บอกเราว่าเกิดอะไรขึ้น — ยิ่งละเอียด SE ยิ่งช่วยได้เร็ว')
              : t('Review your request before submitting.', 'ตรวจสอบคำขอก่อนส่ง')}
          </p>
        </div>
      </div>

      {step === 'form' && (
        <div className="card" style={{ padding: 22 }}>
          {errors.length > 0 && (
            <div className="alert-item a-red" role="alert" style={{ marginBottom: 16, display: 'block' }}>
              <strong>{t('Please complete the highlighted items:', 'กรุณากรอกข้อมูลต่อไปนี้:')}</strong>
              <ul style={{ margin: '6px 0 0', paddingLeft: 20 }}>
                {errors.map((e) => <li key={e}>{e}</li>)}
              </ul>
            </div>
          )}

          {/* 1. Company & site */}
          <div className="grid-2">
            <div className="field">
              <label>{t('Company', 'บริษัท')}</label>
              <input value={`${lang === 'th' ? company.nameTh : company.name} (${company.customerCode})`} disabled />
            </div>
            <div className="field">
              <label htmlFor="nr-site">{t('Site', 'ไซต์งาน')}</label>
              <select
                id="nr-site"
                value={siteId}
                onChange={(e) => {
                  setSiteId(e.target.value);
                  setAssetId('');
                }}
              >
                {company.sites.map((s) => (
                  <option key={s.id} value={s.id}>{lang === 'th' ? s.nameTh : s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Equipment */}
          <div className="field">
            <label htmlFor="nr-asset">{t('Equipment (optional but recommended)', 'อุปกรณ์ (ไม่บังคับแต่แนะนำ)')}</label>
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

          {/* 3. Category */}
          <div className="field">
            <label>{t('What kind of problem or request is it?', 'เป็นปัญหาหรือคำขอประเภทใด?')}</label>
            <div className="grid-3" style={{ gap: 8 }}>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`radio-card ${category === c ? 'selected' : ''}`}
                  onClick={() => setCategory(c)}
                  aria-pressed={category === c}
                >
                  {catLabel(c)}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Description */}
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

          {/* 5. Condition */}
          <div className="field">
            <label>{t('Current equipment condition', 'สภาพอุปกรณ์ในปัจจุบัน')}</label>
            <div className="grid-3" style={{ gap: 8 }}>
              {CONDITIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`radio-card ${condition === c ? 'selected' : ''}`}
                  onClick={() => setCondition(c)}
                  aria-pressed={condition === c}
                >
                  {condLabel(c)}
                </button>
              ))}
            </div>
          </div>

          {/* 6. Photos */}
          <div className="field">
            <label>{t('Photos (optional)', 'รูปภาพ (ไม่บังคับ)')}</label>
            <ImageUploadMock files={photos} onChange={setPhotos} />
          </div>

          {/* 7–9. Contact method, date, urgency */}
          <div className="grid-2">
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
            <div className="field">
              <label htmlFor="nr-date">{t('Preferred service date (optional)', 'วันที่สะดวกรับบริการ (ไม่บังคับ)')}</label>
              <input id="nr-date" type="date" min="2026-07-15" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label>{t('Urgency', 'ความเร่งด่วน')}</label>
            <div className="grid-4" style={{ gap: 8 }}>
              {(Object.keys(PRIORITY) as Priority[]).map((p) => {
                const meta = PRIORITY[p];
                return (
                  <button
                    key={p}
                    type="button"
                    className={`radio-card ${priority === p ? 'selected' : ''}`}
                    onClick={() => setPriority(p)}
                    aria-pressed={priority === p}
                  >
                    <span className="fw-600">{lang === 'th' ? meta.th : meta.en}</span>
                    <span className="muted small" style={{ display: 'block' }}>
                      {p === 'low' && t('When convenient', 'เมื่อสะดวก')}
                      {p === 'medium' && t('Within the week', 'ภายในสัปดาห์นี้')}
                      {p === 'high' && t('Within 1–2 days', 'ภายใน 1–2 วัน')}
                      {p === 'urgent' && t('Production impact — ASAP', 'กระทบการผลิต — ด่วนที่สุด')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 10. Contact person */}
          <div className="field">
            <label htmlFor="nr-contact">{t('Contact person', 'ผู้ติดต่อ')}</label>
            <input id="nr-contact" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
          </div>

          <div className="flex" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <Link to="/portal/requests" className="btn btn-outline">{t('Cancel', 'ยกเลิก')}</Link>
            <button className="btn btn-primary" onClick={goReview}>
              {t('Review request', 'ตรวจสอบคำขอ')}
              <ArrowRight size={16} aria-hidden />
            </button>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="card" style={{ padding: 22 }}>
          <h3 style={{ marginTop: 0 }}>{t('Review & confirm', 'ตรวจสอบและยืนยัน')}</h3>
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
          <div style={{ margin: '14px 0' }}>
            <div className="muted small" style={{ marginBottom: 4 }}>{t('Description', 'รายละเอียด')}</div>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{description}</p>
          </div>
          <div className="alert-item a-blue" style={{ marginBottom: 16 }}>
            <CheckCircle2 size={17} aria-hidden />
            <span>
              {t(
                'After you submit, the SE service coordinator reviews the request and you will see every status change on the ticket timeline.',
                'หลังจากส่งคำขอ ผู้ประสานงานบริการของ SE จะตรวจสอบ และคุณจะเห็นทุกการอัปเดตบนไทม์ไลน์ของคำขอ',
              )}
            </span>
          </div>
          <div className="flex" style={{ justifyContent: 'flex-end', gap: 10 }}>
            <button className="btn btn-outline" onClick={() => setStep('form')}>
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
