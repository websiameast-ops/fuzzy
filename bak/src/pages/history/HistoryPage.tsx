import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { History as HistoryIcon } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useCompany } from '@/contexts/CompanyContext';
import { EmptyState, ExportButton, SearchBox, StatusBadge } from '@/components/common';
import { ServiceReportModal } from '@/components/service/ServiceReportModal';
import { historyFor, getReport } from '@/data/mockHistory';
import { getAsset } from '@/data/mockAssets';
import { siteName } from '@/data/mockCompanies';
import { fmtDate } from '@/utils/format';
import { APPROVAL_STATUS } from '@/utils/status';

export function HistoryPage() {
  const { lang, t } = useLang();
  const { customerCode, company } = useCompany();
  const [params, setParams] = useSearchParams();

  const [q, setQ] = useState('');
  const [site, setSite] = useState('');
  const [type, setType] = useState('');
  const [assetFilter, setAssetFilter] = useState('');

  const records = useMemo(() => historyFor(customerCode), [customerCode]);
  const types = [...new Set(records.map((r) => r.type))].sort();
  const assetIds = [...new Set(records.map((r) => r.assetId))];

  const filtered = useMemo(() => {
    return records
      .filter((r) => {
        if (q) {
          const asset = getAsset(r.assetId);
          const hay = `${r.reportId} ${r.jobNo} ${r.issue} ${r.work} ${r.engineer} ${asset?.name ?? ''}`.toLowerCase();
          if (!hay.includes(q.toLowerCase())) return false;
        }
        if (site && r.siteId !== site) return false;
        if (type && r.type !== type) return false;
        if (assetFilter && r.assetId !== assetFilter) return false;
        return true;
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [records, q, site, type, assetFilter]);

  // Report modal driven by ?report= so browser back closes it
  const reportId = params.get('report');
  const openRecord = reportId ? getReport(reportId) ?? null : null;

  const openReport = (id: string) => {
    const next = new URLSearchParams(params);
    next.set('report', id);
    setParams(next); // push entry — back button closes the modal
  };
  const closeReport = () => {
    const next = new URLSearchParams(params);
    next.delete('report');
    setParams(next);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('Service History', 'ประวัติการบริการ')}</h1>
          <p className="page-sub">
            {t('Every completed service job for your equipment, with full engineer reports.', 'งานบริการทั้งหมดของอุปกรณ์คุณ พร้อมรายงานฉบับเต็มจากวิศวกร')}
          </p>
        </div>
        <div className="page-actions">
          <ExportButton label={t('Export history', 'ส่งออกประวัติ')} />
        </div>
      </div>

      <div className="card" style={{ padding: 14, marginBottom: 16 }}>
        <div className="filter-grid">
          <SearchBox value={q} onChange={setQ} placeholder={t('Search report, job, issue, engineer…', 'ค้นหารายงาน งาน ปัญหา วิศวกร…')} />
          <select value={site} onChange={(e) => setSite(e.target.value)} aria-label={t('Filter by site', 'กรองตามไซต์')}>
            <option value="">{t('All sites', 'ทุกไซต์')}</option>
            {company.sites.map((s) => (
              <option key={s.id} value={s.id}>{lang === 'th' ? s.nameTh : s.name}</option>
            ))}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)} aria-label={t('Filter by service type', 'กรองตามประเภทงาน')}>
            <option value="">{t('All service types', 'ทุกประเภทงาน')}</option>
            {types.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
          <select value={assetFilter} onChange={(e) => setAssetFilter(e.target.value)} aria-label={t('Filter by equipment', 'กรองตามอุปกรณ์')}>
            <option value="">{t('All equipment', 'ทุกอุปกรณ์')}</option>
            {assetIds.map((id) => {
              const a = getAsset(id);
              return <option key={id} value={id}>{a ? a.name : id}</option>;
            })}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<HistoryIcon size={24} />}
          title={t('No service records found', 'ไม่พบประวัติการบริการ')}
          body={t('Try removing a filter or a different search term.', 'ลองลดตัวกรองหรือเปลี่ยนคำค้น')}
          action={
            <button className="btn btn-outline btn-sm" onClick={() => { setQ(''); setSite(''); setType(''); setAssetFilter(''); }}>
              {t('Clear filters', 'ล้างตัวกรอง')}
            </button>
          }
        />
      ) : (
        <div className="card table-to-cards" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="se-table">
              <thead>
                <tr>
                  <th>{t('Date', 'วันที่')}</th>
                  <th>{t('Report / Job', 'รายงาน / งาน')}</th>
                  <th>{t('Equipment', 'อุปกรณ์')}</th>
                  <th>{t('Type', 'ประเภท')}</th>
                  <th>{t('Result', 'ผลงาน')}</th>
                  <th>{t('Approval', 'การยืนยัน')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const asset = getAsset(r.assetId);
                  const ap = APPROVAL_STATUS[r.approval];
                  return (
                    <tr key={r.id} className="row-link" onClick={() => openReport(r.reportId)}>
                      <td data-label={t('Date', 'วันที่')}>{fmtDate(r.date, lang)}</td>
                      <td data-label={t('Report / Job', 'รายงาน / งาน')}>
                        <button className="btn btn-ghost btn-sm" style={{ marginLeft: -8 }} onClick={(e) => { e.stopPropagation(); openReport(r.reportId); }}>
                          {r.reportId}
                        </button>
                        <div className="muted small">{r.jobNo}</div>
                      </td>
                      <td data-label={t('Equipment', 'อุปกรณ์')}>
                        <div className="fw-600">{asset ? asset.name : r.assetId}</div>
                        <div className="muted small">{siteName(customerCode, r.siteId, lang)}</div>
                      </td>
                      <td data-label={t('Type', 'ประเภท')}>{r.type}</td>
                      <td data-label={t('Result', 'ผลงาน')}>
                        <div className="small">{r.issue}</div>
                        <div className="muted small">{r.result}</div>
                      </td>
                      <td data-label={t('Approval', 'การยืนยัน')}>
                        <StatusBadge label={lang === 'th' ? ap.th : ap.en} tone={ap.tone} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="muted small">
        {t(
          `${filtered.length} record(s) shown. Open a row to read the full service report — your browser's back button closes it again.`,
          `แสดง ${filtered.length} รายการ เปิดแถวเพื่ออ่านรายงานฉบับเต็ม — ปุ่มย้อนกลับของเบราว์เซอร์จะปิดรายงาน`,
        )}
      </p>

      <ServiceReportModal record={openRecord} open={openRecord !== null} onClose={closeReport} />
    </div>
  );
}
