import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Download, FileText, Package, RefreshCw, ShieldCheck, Wrench } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/contexts/ToastContext';
import { EmptyState, Modal, StatusBadge } from '@/components/common';
import { ServiceReportModal } from '@/components/service/ServiceReportModal';
import { contractsFor, getContract } from '@/data/mockContracts';
import { getAsset } from '@/data/mockAssets';
import { historyFor } from '@/data/mockHistory';
import { siteName } from '@/data/mockCompanies';
import { daysUntil, fmtDate } from '@/utils/format';
import { CONTRACT_STATUS } from '@/utils/status';
import type { ServiceRecord } from '@/types';

export function ContractsPage() {
  const { lang, t } = useLang();
  const { customerCode } = useCompany();
  const navigate = useNavigate();
  const contracts = useMemo(() => contractsFor(customerCode), [customerCode]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('Contracts & Maintenance Agreements', 'สัญญาและข้อตกลงบำรุงรักษา')}</h1>
          <p className="page-sub">
            {t('Your active MA, O&M and monitoring agreements with SiamEast Solutions.', 'สัญญา MA, O&M และมอนิเตอริ่งที่มีผลกับสยามอีสท์ โซลูชั่น')}
          </p>
        </div>
      </div>

      {contracts.length === 0 ? (
        <EmptyState
          icon={<FileText size={24} />}
          title={t('No contracts on this company profile', 'ไม่มีสัญญาในบริษัทนี้')}
          body={t('Ask your account manager about maintenance agreements that fit your equipment.', 'สอบถามผู้จัดการฝ่ายลูกค้าเกี่ยวกับสัญญาบำรุงรักษาที่เหมาะกับอุปกรณ์ของคุณ')}
          action={<Link to="/portal/requests/new" className="btn btn-primary btn-sm">{t('Contact SE', 'ติดต่อ SE')}</Link>}
        />
      ) : (
        <div className="grid-2">
          {contracts.map((c) => {
            const st = CONTRACT_STATUS[c.status];
            const remaining = daysUntil(c.end);
            return (
              <button key={c.id} className="card" style={{ padding: 18, textAlign: 'left', cursor: 'pointer' }} onClick={() => navigate(`/portal/contracts/${c.id}`)}>
                <div className="between" style={{ alignItems: 'flex-start' }}>
                  <div>
                    <div className="fw-600" style={{ fontSize: 15 }}>{lang === 'th' ? c.typeTh : c.type}</div>
                    <div className="muted small">{c.id}</div>
                  </div>
                  <StatusBadge label={lang === 'th' ? st.th : st.en} tone={st.tone} />
                </div>
                <div className="stat-line" style={{ marginTop: 10 }}>
                  <span className="k">{t('Term', 'ระยะเวลา')}</span>
                  <span className="v">{fmtDate(c.start, lang)} – {fmtDate(c.end, lang)}</span>
                </div>
                <div className="stat-line">
                  <span className="k">{t('Remaining', 'คงเหลือ')}</span>
                  <span className="v">
                    {remaining > 0
                      ? t(`${remaining} days`, `${remaining} วัน`)
                      : t(`Expired ${-remaining} days ago`, `หมดอายุมาแล้ว ${-remaining} วัน`)}
                  </span>
                </div>
                <div className="stat-line">
                  <span className="k">{t('PM visits used', 'จำนวนครั้ง PM ที่ใช้')}</span>
                  <span className="v">{c.visitsUsed} / {c.visitsTotal}</span>
                </div>
                <div className="stat-line">
                  <span className="k">{t('Covered assets', 'อุปกรณ์ในสัญญา')}</span>
                  <span className="v">{c.assetIds.length}</span>
                </div>
                {c.status === 'expiring' && (
                  <div className="alert-item a-amber" style={{ marginTop: 10 }}>
                    <Calendar size={15} aria-hidden />
                    <span className="small">{t(`Renewal recommended — expires in ${remaining} days.`, `แนะนำต่ออายุ — จะหมดอายุในอีก ${remaining} วัน`)}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ContractDetailPage() {
  const { contractId } = useParams();
  const { lang, t } = useLang();
  const { customerCode } = useCompany();
  const { addRequest } = useData();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [renewOpen, setRenewOpen] = useState(false);
  const [openRecord, setOpenRecord] = useState<ServiceRecord | null>(null);

  const contract = contractId ? getContract(contractId) : undefined;

  const relatedHistory = useMemo(
    () => (contract ? historyFor(customerCode).filter((h) => h.contractId === contract.id) : []),
    [contract, customerCode],
  );

  if (!contract || contract.customerCode !== customerCode) {
    return (
      <EmptyState
        icon={<FileText size={24} />}
        title={t('Contract not found', 'ไม่พบสัญญา')}
        body={t('The contract may belong to another company profile.', 'สัญญาอาจอยู่ในบริษัทอื่น')}
        action={<Link to="/portal/contracts" className="btn btn-primary btn-sm">{t('All contracts', 'สัญญาทั้งหมด')}</Link>}
      />
    );
  }

  const st = CONTRACT_STATUS[contract.status];
  const remaining = daysUntil(contract.end);

  const requestRenewal = () => {
    const ticketNo = addRequest({
      customerCode,
      siteId: contract.siteIds[0]!,
      category: 'Spare parts / quotation',
      title: `Renewal quotation — ${contract.id} (${contract.type})`,
      description: `We would like a renewal quotation for contract ${contract.id} (${contract.type}), current term ending ${contract.end}. Please include the same coverage scope and note any recommended changes based on this year's service history.`,
      condition: 'Not applicable',
      priority: 'medium',
      contactPerson: contract.contact,
      contactMethod: 'Email',
      attachments: [],
    });
    setRenewOpen(false);
    showToast(t(`Renewal request ${ticketNo} created — your account manager will prepare the quotation.`, `สร้างคำขอต่ออายุ ${ticketNo} แล้ว — ผู้จัดการฝ่ายลูกค้าจะจัดทำใบเสนอราคา`), 'success');
    navigate(`/portal/requests/${ticketNo}`);
  };

  return (
    <div style={{ maxWidth: 940 }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/portal/contracts')} style={{ marginBottom: 12, marginLeft: -8 }}>
        <ArrowLeft size={16} aria-hidden />
        {t('All contracts', 'สัญญาทั้งหมด')}
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">{lang === 'th' ? contract.typeTh : contract.type}</h1>
          <p className="page-sub">{contract.id} · {contract.siteIds.map((s) => siteName(customerCode, s, lang)).join(' · ')}</p>
          <div className="flex" style={{ gap: 6, marginTop: 8 }}>
            <StatusBadge label={lang === 'th' ? st.th : st.en} tone={st.tone} />
            {contract.renewalStatus && <span className="badge t-blue">{contract.renewalStatus}</span>}
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setRenewOpen(true)}>
            <RefreshCw size={16} aria-hidden />
            {t('Request renewal quotation', 'ขอใบเสนอราคาต่ออายุ')}
          </button>
        </div>
      </div>

      {contract.status === 'expiring' && (
        <div className="alert-item a-amber" style={{ marginBottom: 16 }}>
          <Calendar size={17} aria-hidden />
          <span>
            {t(
              `This agreement expires in ${remaining} days (${fmtDate(contract.end, lang)}). Renewing before expiry keeps response-time commitments unbroken.`,
              `สัญญานี้จะหมดอายุในอีก ${remaining} วัน (${fmtDate(contract.end, 'th')}) การต่ออายุก่อนหมดสัญญาช่วยให้เงื่อนไขเวลาตอบสนองต่อเนื่อง`,
            )}
          </span>
        </div>
      )}

      <div className="grid-2" style={{ alignItems: 'start', marginBottom: 16 }}>
        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ marginTop: 0 }}>{t('Agreement summary', 'สรุปสัญญา')}</h3>
          <div className="stat-line"><span className="k">{t('Term', 'ระยะเวลา')}</span><span className="v">{fmtDate(contract.start, lang)} – {fmtDate(contract.end, lang)}</span></div>
          <div className="stat-line">
            <span className="k">{t('Remaining', 'คงเหลือ')}</span>
            <span className="v">{remaining > 0 ? t(`${remaining} days`, `${remaining} วัน`) : t(`Expired ${-remaining} days ago`, `หมดอายุมาแล้ว ${-remaining} วัน`)}</span>
          </div>
          <div className="stat-line"><span className="k">{t('PM visits', 'จำนวนครั้ง PM')}</span><span className="v">{contract.visitsUsed} {t('used of', 'จาก')} {contract.visitsTotal}</span></div>
          <div className="stat-line"><span className="k">SLA</span><span className="v">{contract.sla}</span></div>
          <div className="stat-line"><span className="k">{t('Response time', 'เวลาตอบสนอง')}</span><span className="v">{contract.responseTime}</span></div>
          <div className="stat-line"><span className="k">{t('SE contact', 'ผู้ติดต่อฝั่ง SE')}</span><span className="v">{contract.contact}</span></div>

          <h4 style={{ marginBottom: 6 }}>{t('Documents', 'เอกสาร')}</h4>
          <div className="flex" style={{ gap: 8, flexWrap: 'wrap' }}>
            {contract.documents.map((d) => (
              <button key={d} className="chip" onClick={() => showToast(t('Download started (demo).', 'เริ่มดาวน์โหลดแล้ว (เดโม)'), 'info')}>
                <Download size={13} aria-hidden /> {d}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ marginTop: 0 }}><ShieldCheck size={17} aria-hidden style={{ verticalAlign: -3 }} /> {t('Coverage', 'ขอบเขตความคุ้มครอง')}</h3>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {contract.coverage.map((c) => <li key={c} style={{ marginBottom: 4 }}>{c}</li>)}
            </ul>
          </div>
          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ marginTop: 0 }}>{t('Exclusions', 'ข้อยกเว้น')}</h3>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {contract.exclusions.map((c) => <li key={c} style={{ marginBottom: 4 }}>{c}</li>)}
            </ul>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 18, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}><Package size={17} aria-hidden style={{ verticalAlign: -3 }} /> {t('Covered equipment', 'อุปกรณ์ในสัญญา')}</h3>
        <div className="grid-3">
          {contract.assetIds.map((id) => {
            const a = getAsset(id);
            if (!a) return null;
            return (
              <Link key={id} to={`/portal/equipment/${id}`} className="card" style={{ padding: 12, textDecoration: 'none', color: 'inherit' }}>
                <div className="fw-600 small">{a.name}</div>
                <div className="muted small">{a.id} · {siteName(customerCode, a.siteId, lang)}</div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="card" style={{ padding: 18 }}>
        <h3 style={{ marginTop: 0 }}><Wrench size={17} aria-hidden style={{ verticalAlign: -3 }} /> {t('Service delivered under this contract', 'งานบริการภายใต้สัญญานี้')}</h3>
        {relatedHistory.length === 0 ? (
          <p className="muted">{t('No completed jobs recorded under this contract yet.', 'ยังไม่มีงานที่เสร็จสิ้นภายใต้สัญญานี้')}</p>
        ) : (
          relatedHistory.map((h) => (
            <div key={h.id} className="between" style={{ padding: '10px 0', borderBottom: '1px dashed var(--se-border)', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div className="fw-600 small">{h.issue}</div>
                <div className="muted small">{fmtDate(h.date, lang)} · {h.type} · {getAsset(h.assetId)?.name ?? h.assetId}</div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setOpenRecord(h)}>
                {t('View report', 'ดูรายงาน')} {h.reportId}
              </button>
            </div>
          ))
        )}
      </div>

      <Modal
        open={renewOpen}
        onClose={() => setRenewOpen(false)}
        title={t('Request renewal quotation', 'ขอใบเสนอราคาต่ออายุ')}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setRenewOpen(false)}>{t('Not now', 'ยังก่อน')}</button>
            <button className="btn btn-primary" onClick={requestRenewal}>{t('Create renewal request', 'สร้างคำขอต่ออายุ')}</button>
          </>
        }
      >
        <p style={{ marginTop: 0 }}>
          {t(
            `This creates a pre-filled service request asking SE to quote a renewal for ${contract.id}. Your account manager will respond with pricing and any recommended coverage changes.`,
            `ระบบจะสร้างคำขอบริการที่กรอกข้อมูลไว้แล้วเพื่อให้ SE เสนอราคาต่ออายุสัญญา ${contract.id} ผู้จัดการฝ่ายลูกค้าจะตอบกลับพร้อมราคาและข้อเสนอแนะ`,
          )}
        </p>
      </Modal>

      <ServiceReportModal record={openRecord} open={openRecord !== null} onClose={() => setOpenRecord(null)} />
    </div>
  );
}
