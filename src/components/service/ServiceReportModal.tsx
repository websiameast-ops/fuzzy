import { Camera, Download, User, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ServiceRecord } from '@/types';
import { useLang } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useCompany } from '@/contexts/CompanyContext';
import { Modal, StatusBadge } from '@/components/common';
import { getAsset } from '@/data/mockAssets';
import { siteName } from '@/data/mockCompanies';
import { fmtDate } from '@/utils/format';
import { APPROVAL_STATUS } from '@/utils/status';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 18 }}>
      <h4 style={{ margin: '0 0 6px', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--se-text-muted)' }}>
        {title}
      </h4>
      {children}
    </section>
  );
}

function PhotoRow({ photos }: { photos: string[] }) {
  return (
    <div className="upload-grid">
      {photos.map((p) => (
        <div key={p} className="upload-thumb" title={p}>
          <Camera size={20} aria-hidden />
          <span className="small">{p}</span>
        </div>
      ))}
    </div>
  );
}

export function ServiceReportModal({ record, open, onClose }: { record: ServiceRecord | null; open: boolean; onClose: () => void }) {
  const { lang, t } = useLang();
  const { showToast } = useToast();
  const { customerCode, company } = useCompany();
  if (!record) return null;
  const asset = getAsset(record.assetId);
  const r = record.report;
  const approval = APPROVAL_STATUS[record.approval];

  return (
    <Modal
      open={open}
      onClose={onClose}
      large
      title={
        <span className="flex" style={{ gap: 10, flexWrap: 'wrap' }}>
          {t('Service report', 'รายงานบริการ')} {record.reportId}
          <StatusBadge label={lang === 'th' ? approval.th : approval.en} tone={approval.tone} />
        </span>
      }
      footer={
        <>
          <button className="btn btn-outline" onClick={() => showToast(t('PDF download started (demo).', 'เริ่มดาวน์โหลด PDF แล้ว (เดโม)'), 'info')}>
            <Download size={16} aria-hidden />
            {t('Download PDF', 'ดาวน์โหลด PDF')}
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            {t('Close', 'ปิด')}
          </button>
        </>
      }
    >
      <Section title={t('Job information', 'ข้อมูลงาน')}>
        <div className="grid-2" style={{ gap: 4 }}>
          <div className="stat-line"><span className="k">{t('Job number', 'เลขที่งาน')}</span><span className="v">{record.jobNo}</span></div>
          <div className="stat-line"><span className="k">{t('Service date', 'วันที่ให้บริการ')}</span><span className="v">{fmtDate(record.date, lang)}</span></div>
          <div className="stat-line"><span className="k">{t('Customer', 'ลูกค้า')}</span><span className="v">{lang === 'th' ? company.nameTh : company.name}</span></div>
          <div className="stat-line"><span className="k">{t('Site', 'ไซต์งาน')}</span><span className="v">{siteName(customerCode, record.siteId, lang)}</span></div>
          <div className="stat-line">
            <span className="k">{t('Equipment', 'อุปกรณ์')}</span>
            <span className="v">
              <Link to={`/portal/equipment/${record.assetId}`} onClick={onClose}>
                {asset ? asset.name : record.assetId}
              </Link>
            </span>
          </div>
          <div className="stat-line"><span className="k">{t('Service type', 'ประเภทงาน')}</span><span className="v">{record.type}</span></div>
        </div>
      </Section>

      <Section title={t('Reported problem', 'ปัญหาที่แจ้ง')}>
        <p style={{ margin: 0 }}>{r.reportedProblem}</p>
      </Section>

      <Section title={t('Findings', 'สิ่งที่ตรวจพบ')}>
        <p style={{ margin: 0 }}>{r.findings}</p>
      </Section>

      <Section title={t('Root cause', 'สาเหตุ')}>
        <p style={{ margin: 0 }}>{r.rootCause}</p>
      </Section>

      <Section title={t('Work performed', 'งานที่ดำเนินการ')}>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {r.workPerformed.map((w) => (
            <li key={w} style={{ marginBottom: 4 }}>{w}</li>
          ))}
        </ul>
      </Section>

      <Section title={t('Parts used', 'อะไหล่ที่ใช้')}>
        {r.parts.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>{t('No parts were used on this job.', 'งานนี้ไม่มีการใช้อะไหล่')}</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {r.parts.map((p) => (
              <li key={p.name}>
                {p.name} — {t('qty', 'จำนวน')} {p.qty}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={t('Before photos', 'รูปก่อนดำเนินการ')}>
        <PhotoRow photos={r.beforePhotos} />
      </Section>
      <Section title={t('After photos', 'รูปหลังดำเนินการ')}>
        <PhotoRow photos={r.afterPhotos} />
      </Section>

      <Section title={t('Test results', 'ผลการทดสอบ')}>
        <p style={{ margin: 0 }}>{r.testResults}</p>
      </Section>

      <Section title={t('Recommendations', 'ข้อเสนอแนะ')}>
        <p style={{ margin: 0 }}>{r.recommendations}</p>
      </Section>

      <Section title={t('Engineer & acknowledgment', 'วิศวกรและการรับทราบงาน')}>
        <div className="flex" style={{ gap: 8, marginBottom: 6 }}>
          <Wrench size={15} aria-hidden className="muted" />
          <span>{record.engineer} — SiamEast Solutions PCL</span>
        </div>
        <div className="flex" style={{ gap: 8 }}>
          <User size={15} aria-hidden className="muted" />
          <span>{r.acknowledgment}</span>
        </div>
      </Section>
    </Modal>
  );
}
