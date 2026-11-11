import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, History as HistoryIcon } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { EmptyState, ExportButton, SearchBox, StatusBadge } from '@/components/common';
import { ServiceReportModal } from '@/components/service/ServiceReportModal';
import { getAsset } from '@/data/mockAssets';
import { fmtDate } from '@/utils/format';
import { TICKET_STATUS } from '@/utils/status';
import {
  apiGetSites,
  apiGetTicketHistory,
  apiGetTicketTypes,
  type ServiceHistoryResponse,
  type ServiceHistorySummaryResponse,
  type SiteResponse,
  type TicketTypeResponse,
} from '@/lib/apiClient';
import { tokenStore } from '@/lib/tokenStore';

const PAGE_SIZE = 20;

export function HistoryPage() {
  const { lang, t } = useLang();
  const [params, setParams] = useSearchParams();

  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [site, setSite] = useState('');
  const [type, setType] = useState('');
  const [assetFilter, setAssetFilter] = useState('');
  const [page, setPage] = useState(1);
  const [sites, setSites] = useState<SiteResponse[] | null>(null);
  const [types, setTypes] = useState<TicketTypeResponse[] | null>(null);
  const [rows, setRows] = useState<ServiceHistoryResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<ServiceHistorySummaryResponse | null>(null);

  useEffect(() => {
    const accessToken = tokenStore.read()?.accessToken;
    if (!accessToken) return;
    apiGetSites(accessToken).then(setSites).catch(() => {});
    apiGetTicketTypes(accessToken).then(setTypes).catch(() => {});
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setQ(qInput.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(id);
  }, [qInput]);

  useEffect(() => {
    const accessToken = tokenStore.read()?.accessToken;
    if (!accessToken) return;
    let ignore = false;
    apiGetTicketHistory(accessToken, {
      q: q || undefined,
      status: 'closed', // this page is scoped to completed jobs only — see RequestsPage for open/in-progress tickets
      site: site || undefined,
      type: type || undefined,
      assetCode: assetFilter || undefined,
      page,
      size: PAGE_SIZE,
    })
      .then((res) => {
        if (ignore) return;
        setRows(res.items);
        setTotal(res.total);
        setSummary(res.summary);
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [q, site, type, assetFilter, page]);

  const selectSite = (next: string) => {
    setSite(next);
    setPage(1);
  };
  const selectType = (next: string) => {
    setType(next);
    setPage(1);
  };
  const selectAsset = (next: string) => {
    setAssetFilter(next);
    setPage(1);
  };
  const clearFilters = () => {
    setQInput('');
    setQ('');
    setSite('');
    setType('');
    setAssetFilter('');
    setPage(1);
  };

  const assetCodes = summary?.assetCodes ?? [];
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Report modal driven by ?report=<ticketNo> so browser back closes it
  const openTicketNo = params.get('report');

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
          <SearchBox value={qInput} onChange={setQInput} placeholder={t('Search report, job, issue, engineer…', 'ค้นหารายงาน งาน ปัญหา วิศวกร…')} />
          <select value={site} onChange={(e) => selectSite(e.target.value)} aria-label={t('Filter by site', 'กรองตามไซต์')}>
            <option value="">{t('All sites', 'ทุกไซต์')}</option>
            {(sites ?? []).map((s) => (
              <option key={s.site} value={s.site}>{s.site}</option>
            ))}
          </select>
          <select value={type} onChange={(e) => selectType(e.target.value)} aria-label={t('Filter by service type', 'กรองตามประเภทงาน')}>
            <option value="">{t('All service types', 'ทุกประเภทงาน')}</option>
            {(types ?? []).map((x) => <option key={x.type} value={x.type}>{x.type}</option>)}
          </select>
          <select value={assetFilter} onChange={(e) => selectAsset(e.target.value)} aria-label={t('Filter by equipment', 'กรองตามอุปกรณ์')}>
            <option value="">{t('All equipment', 'ทุกอุปกรณ์')}</option>
            {assetCodes.map((code) => {
              const a = getAsset(code);
              return <option key={code} value={code}>{a ? a.name : code}</option>;
            })}
          </select>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<HistoryIcon size={24} />}
          title={t('No service records found', 'ไม่พบประวัติการบริการ')}
          body={t('Try removing a filter or a different search term.', 'ลองลดตัวกรองหรือเปลี่ยนคำค้น')}
          action={
            <button className="btn btn-outline btn-sm" onClick={clearFilters}>
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
                {rows.map((h) => {
                  const asset = getAsset(h.assetCode);
                  const ap = TICKET_STATUS[h.status];
                  return (
                    <tr key={h.ticketNo} className="row-link" onClick={() => openReport(h.ticketNo)}>
                      <td data-label={t('Date', 'วันที่')}>{fmtDate(h.reportedAt, lang)}</td>
                      <td data-label={t('Report / Job', 'รายงาน / งาน')}>
                        <button className="btn btn-ghost btn-sm" style={{ marginLeft: -8 }} onClick={(e) => { e.stopPropagation(); openReport(h.ticketNo); }}>
                          {h.ticketNo}
                        </button>
                        <div className="muted small">{h.jobNo ?? ''}</div>
                      </td>
                      <td data-label={t('Equipment', 'อุปกรณ์')}>
                        <div className="fw-600">{asset ? asset.name : h.assetCode}</div>
                        <div className="muted small">{h.site ?? ''}</div>
                      </td>
                      <td data-label={t('Type', 'ประเภท')}>{h.type}</td>
                      <td data-label={t('Result', 'ผลงาน')}>
                        <div className="small">{h.description}</div>
                        <div className="muted small" />
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

      {rows.length > 0 && (
        <div className="between" style={{ marginTop: 16 }}>
          <span className="muted small">{t(`${total} record(s)`, `ทั้งหมด ${total} รายการ`)}</span>
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

      <p className="muted small">
        {t(
          `Open a row to read the full service report — your browser's back button closes it again.`,
          `เปิดแถวเพื่ออ่านรายงานฉบับเต็ม — ปุ่มย้อนกลับของเบราว์เซอร์จะปิดรายงาน`,
        )}
      </p>

      <ServiceReportModal ticketNo={openTicketNo} open={openTicketNo !== null} onClose={closeReport} />
    </div>
  );
}
