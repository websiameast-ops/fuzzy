import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Clock, LayoutGrid, Plus, Rows3 } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { EmptyState, ExportButton, SearchBox, StatusBadge } from '@/components/common';
import { apiGetTicketHistory, type ServiceHistoryResponse, type ServiceHistorySummaryResponse } from '@/lib/apiClient';
import { tokenStore } from '@/lib/tokenStore';
import { relTime } from '@/utils/format';
import { OPEN_TICKET_STATUSES, SLA_STATUS, TICKET_PRIORITY, TICKET_STATUS, type TicketStatusValue } from '@/utils/status';

const PAGE_SIZE = 20;

export function RequestsPage() {
  const { lang, t } = useLang();
  const navigate = useNavigate();

  const [rows, setRows] = useState<ServiceHistoryResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<ServiceHistorySummaryResponse | null>(null);
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [site, setSite] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | TicketStatusValue>('all');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'cards' | 'table'>('cards');

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
      status: filter === 'all' ? 'open' : filter, // Requests never shows closed tickets — see HistoryPage for those
      site: site || undefined,
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
  }, [q, site, filter, page]);

  const selectFilter = (next: 'all' | 'open' | TicketStatusValue) => {
    setFilter(next);
    setPage(1);
  };

  const selectSite = (next: string) => {
    setSite(next);
    setPage(1);
  };

  const sites = summary?.sites ?? [];

  const openCount = summary?.statusCounts.filter((sc) => OPEN_TICKET_STATUSES.includes(sc.status)).reduce((n, sc) => n + sc.count, 0) ?? 0;
  const inProgressCount = summary?.statusCounts.find((sc) => sc.status === 'InProgress')?.count ?? 0;
  const completedCount = summary?.statusCounts.filter((sc) => sc.status === 'Resolved' || sc.status === 'Closed').reduce((n, sc) => n + sc.count, 0) ?? 0;
  const slaOverdueCount = summary?.slaOverdueCount ?? 0;
  const totalCount = openCount;

  const statusesInUse = summary?.statusCounts.filter((sc) => OPEN_TICKET_STATUSES.includes(sc.status)).map((sc) => sc.status) ?? [];
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('Service Requests', 'คำขอบริการ')}</h1>
          <p className="page-sub">
            {t('Track tickets, engineer response SLA, and service activity.', 'ติดตามตั๋วบริการ SLA การตอบสนองของวิศวกร และความคืบหน้างาน')}
          </p>
        </div>
        <div className="page-actions">
          <ExportButton label={t('Export list', 'ส่งออกรายการ')} />
          <Link to="/portal/requests/new" className="btn btn-primary">
            <Plus size={16} aria-hidden />
            {t('New request', 'สร้างคำขอใหม่')}
          </Link>
        </div>
      </div>

      <section className="eq-telemetry-bar" style={{ marginBottom: 16 }}>
        <div className="eq-telemetry-main">
          <div className="eq-telemetry-badge">
            <Clock size={22} strokeWidth={1.75} />
          </div>
          <div>
            <div className="eq-telemetry-title">
              <span className="eq-telemetry-count">{totalCount}</span>
              <span className="eq-telemetry-unit">{t('TICKETS', 'รายการ')}</span>
            </div>
            <div className="eq-telemetry-sub">{t(`${openCount} active requests`, `ค้างอยู่ ${openCount} รายการ`)}</div>
          </div>
        </div>

        <button
          type="button"
          className={`eq-telemetry-item ${filter === 'open' ? 'active' : ''}`}
          onClick={() => selectFilter(filter === 'open' ? 'all' : 'open')}
        >
          <div className="eq-item-head">
            <span className="status-indicator status-blue" />
            <span className="eq-item-label">{t('Open / Active', 'ค้างอยู่')}</span>
          </div>
          <div className="eq-item-val">{openCount}</div>
        </button>

        <button
          type="button"
          className={`eq-telemetry-item ${filter === 'InProgress' ? 'active' : ''}`}
          onClick={() => selectFilter(filter === 'InProgress' ? 'all' : 'InProgress')}
        >
          <div className="eq-item-head">
            <span className="status-indicator status-amber" />
            <span className="eq-item-label">{t('In Progress', 'กำลังทำ')}</span>
          </div>
          <div className="eq-item-val">{inProgressCount}</div>
        </button>

        <button type="button" className={`eq-telemetry-item ${slaOverdueCount > 0 ? 'item-attention' : ''}`} onClick={() => selectFilter('all')}>
          <div className="eq-item-head">
            <span className="status-indicator status-red" />
            <span className="eq-item-label">{t('SLA Overdue', 'SLA ช้ากว่าแผน')}</span>
          </div>
          <div className="eq-item-val" style={{ color: slaOverdueCount > 0 ? 'var(--se-danger)' : undefined }}>
            {slaOverdueCount}
          </div>
        </button>

        <div className="eq-telemetry-item" title={t('Completed requests', 'คำขอที่เสร็จสมบูรณ์')}>
          <div className="eq-item-head">
            <span className="status-indicator status-green" aria-hidden />
            <span className="eq-item-label">{t('Completed', 'เสร็จสมบูรณ์')}</span>
          </div>
          <div className="eq-item-val">{completedCount}</div>
        </div>
      </section>

      <div className="eq-filter-container">
        <div className="eq-toolbar-single">
          <div className="eq-search-wrapper">
            <SearchBox value={qInput} onChange={setQInput} placeholder={t('Search ticket, subject, equipment…', 'ค้นหาเลขที่ เรื่อง อุปกรณ์…')} />
          </div>

          <select className="eq-select" value={site} onChange={(e) => selectSite(e.target.value)} style={{ maxWidth: 170 }}>
            <option value="">{t('All Sites', 'ทุกไซต์งาน')}</option>
            {sites.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <div className="eq-view-seg btn-group" style={{ marginLeft: 'auto' }}>
            <button
              type="button"
              className={`btn btn-sm ${view === 'cards' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setView('cards')}
              title={t('Card View', 'มุมมองการ์ด')}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              className={`btn btn-sm ${view === 'table' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setView('table')}
              title={t('Table View', 'มุมมองตาราง')}
            >
              <Rows3 size={15} />
            </button>
          </div>
        </div>

        <div className="chip-row" style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed var(--se-border)' }}>
          <button className={`chip ${filter === 'all' ? 'active' : ''}`} onClick={() => selectFilter('all')} aria-pressed={filter === 'all'}>
            {t('All', 'ทั้งหมด')} ({totalCount})
          </button>
          <button className={`chip ${filter === 'open' ? 'active' : ''}`} onClick={() => selectFilter('open')} aria-pressed={filter === 'open'}>
            {t('Open', 'ค้างอยู่')} ({openCount})
          </button>
          {statusesInUse.map((s) => {
            const meta = TICKET_STATUS[s];
            const cnt = summary?.statusCounts.find((sc) => sc.status === s)?.count ?? 0;
            return (
              <button key={s} className={`chip ${filter === s ? 'active' : ''}`} onClick={() => selectFilter(s)} aria-pressed={filter === s}>
                {lang === 'th' ? meta.th : meta.en} ({cnt})
              </button>
            );
          })}
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Clock size={24} />}
          title={t('No requests found', 'ไม่พบรายการคำขอ')}
          body={t('No tickets match your search or selected filter.', 'ไม่มีรายการตรงกับคำค้นหาหรือตัวกรองที่เลือก')}
          action={
            <Link to="/portal/requests/new" className="btn btn-primary btn-sm">
              <Plus size={14} aria-hidden />
              {t('Report a problem', 'แจ้งปัญหา')}
            </Link>
          }
        />
      ) : view === 'cards' ? (
        <div className="ticket-list">
          {rows.map((r) => {
            const st = TICKET_STATUS[r.status];
            const pr = TICKET_PRIORITY[r.priority];
            const slaMeta = r.slaStatus ? SLA_STATUS[r.slaStatus] : null;
            return (
              <div
                key={r.ticketNo}
                className="ticket-card-clean"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/portal/requests/${r.ticketNo}`)}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/portal/requests/${r.ticketNo}`)}
              >
                <div className="tcc-head">
                  <div className="tcc-no-box">
                    <span className="tcc-no">{r.ticketNo}</span>
                    <span className="tcc-category">{r.type}</span>
                  </div>
                  <div className="tcc-badges">
                    <StatusBadge label={lang === 'th' ? pr.th : pr.en} tone={pr.tone} />
                    <StatusBadge label={lang === 'th' ? st.th : st.en} tone={st.tone} />
                  </div>
                </div>

                <div className="tcc-title">{r.description}</div>

                <div className="tcc-foot">
                  <div className="tcc-asset-info">
                    <span className="tcc-label">{t('Equipment', 'อุปกรณ์')}:</span>
                    <span className="tcc-val">{r.assetCode}</span>
                  </div>
                  <div className="tcc-meta-right">
                    {slaMeta && <StatusBadge label={lang === 'th' ? slaMeta.th : slaMeta.en} tone={slaMeta.tone} />}
                    <span className="tcc-updated">{relTime(r.reportedAt, lang, new Date())}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card table-to-cards" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="se-table">
              <thead>
                <tr>
                  <th>{t('Ticket', 'เลขที่')}</th>
                  <th>{t('Subject', 'เรื่อง')}</th>
                  <th>{t('Equipment', 'อุปกรณ์')}</th>
                  <th>{t('Priority', 'ความเร่งด่วน')}</th>
                  <th>{t('Status', 'สถานะ')}</th>
                  <th>{t('SLA', 'SLA')}</th>
                  <th>{t('Updated', 'อัปเดต')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const st = TICKET_STATUS[r.status];
                  const pr = TICKET_PRIORITY[r.priority];
                  const slaMeta = r.slaStatus ? SLA_STATUS[r.slaStatus] : null;
                  return (
                    <tr key={r.ticketNo} className="row-link" onClick={() => navigate(`/portal/requests/${r.ticketNo}`)}>
                      <td data-label={t('Ticket', 'เลขที่')}>
                        <Link to={`/portal/requests/${r.ticketNo}`} onClick={(e) => e.stopPropagation()}>{r.ticketNo}</Link>
                      </td>
                      <td data-label={t('Subject', 'เรื่อง')}>
                        <div className="fw-600">{r.description}</div>
                        <div className="muted small">{r.type}</div>
                      </td>
                      <td data-label={t('Equipment', 'อุปกรณ์')}>{r.assetCode}</td>
                      <td data-label={t('Priority', 'ความเร่งด่วน')}><StatusBadge label={lang === 'th' ? pr.th : pr.en} tone={pr.tone} /></td>
                      <td data-label={t('Status', 'สถานะ')}><StatusBadge label={lang === 'th' ? st.th : st.en} tone={st.tone} /></td>
                      <td data-label={t('SLA', 'SLA')}>{slaMeta ? <StatusBadge label={lang === 'th' ? slaMeta.th : slaMeta.en} tone={slaMeta.tone} /> : <span className="muted">—</span>}</td>
                      <td data-label={t('Updated', 'อัปเดต')}>{relTime(r.reportedAt, lang, new Date())}</td>
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
          <span className="muted small">{t(`${total} ticket(s)`, `ทั้งหมด ${total} รายการ`)}</span>
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
    </div>
  );
}
