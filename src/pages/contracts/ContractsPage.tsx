import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, Download, Eye, FileText, Package, RefreshCw, ShieldCheck, Wrench } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/contexts/ToastContext';
import { EmptyState, Modal, StatusBadge } from '@/components/common';
import { ServiceReportModal } from '@/components/service/ServiceReportModal';
import {
  apiGetEquipmentUnitDatasheets,
  apiGetEquipmentUnits,
  type EquipmentDatasheetResponse,
  type EquipmentUnitResponse,
} from '@/lib/apiClient';
import { tokenStore } from '@/lib/tokenStore';
import { getContract } from '@/data/mockContracts';
import { getAsset } from '@/data/mockAssets';
import { historyFor } from '@/data/mockHistory';
import { siteName } from '@/data/mockCompanies';
import { daysUntil, fmtDate } from '@/utils/format';
import { CONTRACT_STATUS, WARRANTY_STATUS } from '@/utils/status';
import type { WarrantyStatus } from '@/types';

const PAGE_SIZE = 20;

// Backend vocab.WarrantyState → the portal's shared WARRANTY_STATUS badge
// tokens (same boundary translation as EquipmentPage.tsx).
const STATE_TO_WARRANTY: Record<EquipmentUnitResponse['warrantyState'], WarrantyStatus> = {
  active: 'active',
  expiringSoon: 'expiring',
  expired: 'expired',
  unknown: 'none',
};

// One row per Asset (catalog item), not per serialized AssetUnit. Data sheets
// are stored per Asset and shared by all its units, so any one unitId of the
// Asset is enough to fetch them — it's kept internal and never rendered.
interface AssetRow {
  key: string;
  id: string;
  assetCode: string | null;
  nameEn: string;
  nameTh: string;
  categoryEn: string | null;
  categoryTh: string | null;
  nextDue: string | null;
  purchaseDate: string | null;
  installDate: string | null;
  warrantyUntil: string | null;
  warrantyState: EquipmentUnitResponse['warrantyState'];
  unitId: string;
  datasheetCount: number;
}

function groupByAsset(units: EquipmentUnitResponse[]): AssetRow[] {
  const rows = new Map<string, AssetRow>();
  for (const u of units) {
    // Asset.asset_code is UNIQUE, so it identifies one Asset.
    const key = u.assetCode ?? u.id;
    const row = rows.get(key);
    if (!row) {
      rows.set(key, {
        key,
        id: u.id,
        assetCode: u.assetCode,
        nameEn: u.nameEn,
        nameTh: u.nameTh,
        categoryEn: u.categoryEn,
        categoryTh: u.categoryTh,
        nextDue: u.nextDue,
        // Purchase date comes from the Asset's invoice, so it's shared by all
        // its units; install date and warranty are per unit and aggregated
        // below (earliest install, soonest-expiring warranty).
        purchaseDate: u.purchaseDate,
        installDate: u.installDate,
        warrantyUntil: u.warrantyUntil,
        warrantyState: u.warrantyState,
        unitId: u.unitId,
        datasheetCount: u.datasheetCount,
      });
    } else {
      if (u.nextDue && (!row.nextDue || u.nextDue < row.nextDue)) row.nextDue = u.nextDue;
      if (u.installDate && (!row.installDate || u.installDate < row.installDate)) row.installDate = u.installDate;
      if (u.warrantyUntil && (!row.warrantyUntil || u.warrantyUntil < row.warrantyUntil)) {
        row.warrantyUntil = u.warrantyUntil;
        row.warrantyState = u.warrantyState;
      }
    }
  }
  return [...rows.values()];
}

export function ContractsPage() {
  const { lang, t } = useLang();

  const [units, setUnits] = useState<EquipmentUnitResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const accessToken = tokenStore.read()?.accessToken;
    if (!accessToken) {
      setLoading(false);
      return;
    }
    apiGetEquipmentUnits(accessToken)
      .then(setUnits)
      .catch(() => setUnits([]))
      .finally(() => setLoading(false));
  }, []);

  const assets = useMemo(() => groupByAsset(units), [units]);

  // Paged client-side: rows are grouped per Asset here, so server-side paging
  // of units would split an Asset across pages.
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(assets.length / PAGE_SIZE));
  const pagedAssets = useMemo(
    () => assets.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [assets, page],
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const [selectedAsset, setSelectedAsset] = useState<AssetRow | null>(null);
  const [datasheets, setDatasheets] = useState<EquipmentDatasheetResponse[]>([]);
  const [datasheetsLoading, setDatasheetsLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState<EquipmentDatasheetResponse | null>(null);

  useEffect(() => {
    setDatasheets([]);
    const accessToken = tokenStore.read()?.accessToken;
    if (!accessToken || !selectedAsset) return;
    setDatasheetsLoading(true);
    apiGetEquipmentUnitDatasheets(accessToken, selectedAsset.unitId)
      .then(setDatasheets)
      .catch(() => {})
      .finally(() => setDatasheetsLoading(false));
  }, [selectedAsset]);

  const assetName = (a: AssetRow) => (lang === 'th' ? a.nameTh : a.nameEn);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('Contracts & Maintenance Agreements', 'สัญญาและข้อตกลงบำรุงรักษา')}</h1>
          <p className="page-sub">
            {t('Equipment under service with SiamEast Solutions, with data sheets for each asset.', 'อุปกรณ์ที่อยู่ในการดูแลของสยามอีสท์ โซลูชั่น พร้อม Data Sheet ของแต่ละรายการ')}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="card text-center" style={{ padding: '60px 20px' }}>
          <p className="muted">{t('Loading equipment…', 'กำลังโหลดข้อมูลอุปกรณ์…')}</p>
        </div>
      ) : assets.length === 0 ? (
        <EmptyState
          icon={<FileText size={24} />}
          title={t('No equipment on this company profile', 'ไม่มีอุปกรณ์ในบริษัทนี้')}
          body={t('Ask your account manager about maintenance agreements that fit your equipment.', 'สอบถามผู้จัดการฝ่ายลูกค้าเกี่ยวกับสัญญาบำรุงรักษาที่เหมาะกับอุปกรณ์ของคุณ')}
          action={<Link to="/portal/requests/new" className="btn btn-primary btn-sm">{t('Contact SE', 'ติดต่อ SE')}</Link>}
        />
      ) : (
        <div className="card table-to-cards" style={{ overflow: 'hidden' }}>
          <table className="se-table">
            <thead>
              <tr>
                <th>{t('Item Code', 'รหัสสินค้า')}</th>
                <th>{t('Category', 'หมวด')}</th>
                <th>{t('Purchased', 'วันที่ซื้อ')}</th>
                <th>{t('Installed', 'ติดตั้งเมื่อ')}</th>
                <th>{t('Warranty', 'การรับประกัน')}</th>
                <th>{t('Next PM', 'PM ถัดไป')}</th>
                <th aria-label={t('Actions', 'การดำเนินการ')} />
              </tr>
            </thead>
            <tbody>
              {pagedAssets.map((a) => {
                const warrantyToken = STATE_TO_WARRANTY[a.warrantyState];
                const wa = WARRANTY_STATUS[warrantyToken];
                return (
                <tr key={a.key}>
                  <td data-label={t('Item Code', 'รหัสสินค้า')}>
                    <div className="fw-600">{a.id}</div>
                    {a.assetCode && <div className="muted small">{a.assetCode}</div>}
                  </td>
                  <td data-label={t('Category', 'หมวด')}>{(lang === 'th' ? a.categoryTh : a.categoryEn) ?? '—'}</td>
                  <td data-label={t('Purchased', 'วันที่ซื้อ')}>{a.purchaseDate ? fmtDate(a.purchaseDate, lang) : '—'}</td>
                  <td data-label={t('Installed', 'ติดตั้งเมื่อ')}>{a.installDate ? fmtDate(a.installDate, lang) : '—'}</td>
                  <td data-label={t('Warranty', 'การรับประกัน')}>
                    {warrantyToken === 'none' ? (
                      <span className="muted small">{t('No warranty', 'ไม่มีประกัน')}</span>
                    ) : (
                      <div>
                        <StatusBadge label={lang === 'th' ? wa.th : wa.en} tone={wa.tone} />
                        <div className="muted small" style={{ marginTop: 3 }}>
                          {t('Expires:', 'หมดอายุ:')} {a.warrantyUntil ? fmtDate(a.warrantyUntil, lang) : '—'}
                        </div>
                      </div>
                    )}
                  </td>
                  <td data-label={t('Next PM', 'PM ถัดไป')}>{a.nextDue ? fmtDate(a.nextDue, lang) : '—'}</td>
                  <td data-label={t('Actions', 'การดำเนินการ')}>
                    {a.datasheetCount > 0 && (
                      <div className="flex" style={{ justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => setSelectedAsset(a)}
                        >
                          <FileText size={15} aria-hidden />
                          {t('Datasheet', 'ดู Datasheet')} ({a.datasheetCount})
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && assets.length > 0 && (
        <div className="between" style={{ marginTop: 16 }}>
          <span className="muted small">{t(`${assets.length} item(s)`, `ทั้งหมด ${assets.length} รายการ`)}</span>
          <div className="flex" style={{ gap: 8 }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={14} aria-hidden />
              {t('Prev', 'ก่อนหน้า')}
            </button>
            <span className="muted small">{t(`Page ${page} / ${totalPages}`, `หน้า ${page} / ${totalPages}`)}</span>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              {t('Next', 'ถัดไป')}
              <ChevronRight size={14} aria-hidden />
            </button>
          </div>
        </div>
      )}

      <Modal
        open={selectedAsset !== null}
        onClose={() => setSelectedAsset(null)}
        title={selectedAsset ? `${t('Data Sheet', 'Data Sheet')} — ${assetName(selectedAsset)}` : t('Data Sheet', 'Data Sheet')}
      >
        {datasheetsLoading ? (
          <p className="muted small" style={{ margin: 0 }}>{t('Loading…', 'กำลังโหลด…')}</p>
        ) : datasheets.length === 0 ? (
          <p className="muted small" style={{ margin: 0 }}>
            {t('No data sheet uploaded yet.', 'ยังไม่มี Data Sheet สำหรับอุปกรณ์นี้')}
          </p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
            {datasheets.map((f) => (
              <li
                key={f.attachmentId}
                className="between"
                style={{ alignItems: 'center', gap: 8, border: '1px solid var(--se-border)', borderRadius: 'var(--radius)', padding: '8px 10px' }}
              >
                <span className="flex" style={{ alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <FileText size={16} aria-hidden />
                  <span className="fw-600 small" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.fileName}</span>
                </span>
                <span className="flex" style={{ gap: 6, flexShrink: 0 }}>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      setSelectedAsset(null);
                      setPreviewFile(f);
                    }}
                  >
                    <Eye size={15} aria-hidden />
                    {t('Preview', 'ดูตัวอย่าง')}
                  </button>
                  <a className="btn btn-ghost btn-sm" href={f.url} target="_blank" rel="noreferrer">
                    <Download size={15} aria-hidden />
                    {t('Download', 'ดาวน์โหลด')}
                  </a>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <Modal
        open={previewFile !== null}
        onClose={() => setPreviewFile(null)}
        large
        title={previewFile?.fileName ?? t('Data Sheet', 'Data Sheet')}
      >
        {previewFile && (
          previewFile.mimeType?.startsWith('application/pdf') ? (
            <iframe
              src={previewFile.url}
              title={previewFile.fileName}
              style={{ width: '100%', height: '75vh', border: 'none' }}
            />
          ) : previewFile.mimeType?.startsWith('image/') ? (
            <img src={previewFile.url} alt={previewFile.fileName} style={{ maxWidth: '100%', display: 'block', margin: '0 auto' }} />
          ) : (
            <p className="muted small">
              {t("Can't preview this file type in the browser.", 'ไม่สามารถแสดงตัวอย่างไฟล์นี้ในเบราว์เซอร์ได้')}{' '}
              <a href={previewFile.url} target="_blank" rel="noreferrer">{t('Download instead', 'ดาวน์โหลดแทน')}</a>
            </p>
          )
        )}
      </Modal>
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
  const [openTicketNo, setOpenTicketNo] = useState<string | null>(null);

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
              {h.ticketNo && (
                <button className="btn btn-outline btn-sm" onClick={() => setOpenTicketNo(h.ticketNo!)}>
                  {t('View report', 'ดูรายงาน')} {h.reportId}
                </button>
              )}
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

      <ServiceReportModal ticketNo={openTicketNo} open={openTicketNo !== null} onClose={() => setOpenTicketNo(null)} />
    </div>
  );
}
