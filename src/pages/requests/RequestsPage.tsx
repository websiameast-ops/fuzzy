import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock, Filter, LayoutGrid, Plus, Rows3, Search } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useData } from '@/contexts/DataContext';
import { EmptyState, ExportButton, SearchBox, StatusBadge } from '@/components/common';
import { getAsset } from '@/data/mockAssets';
import { relTime } from '@/utils/format';
import { PRIORITY, REQUEST_STATUS } from '@/utils/status';
import { assessSla, SLA_STATUS_LABEL } from '@/utils/sla';
import type { RequestStatus } from '@/types';

const OPEN_STATUSES: RequestStatus[] = ['submitted', 'reviewing', 'scheduled', 'assigned', 'in_progress', 'waiting_parts', 'waiting_customer'];
const IN_PROGRESS_STATUSES: RequestStatus[] = ['assigned', 'in_progress'];

const PRIORITY_STRIPE: Record<string, string> = {
  low: 'p-low',
  medium: 'p-medium',
  high: 'p-high',
  urgent: 'p-urgent',
};

export function RequestsPage() {
  const { lang, t } = useLang();
  const { customerCode, company } = useCompany();
  const { requests } = useData();
  const navigate = useNavigate();

  const [q, setQ] = useState('');
  const [site, setSite] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | RequestStatus>('all');
  const [view, setView] = useState<'cards' | 'table'>('cards');

  const mine = useMemo(
    () => requests.filter((r) => r.customerCode === customerCode).sort((a, b) => (a.updated < b.updated ? 1 : -1)),
    [requests, customerCode],
  );

  const filtered = mine.filter((r) => {
    if (site && r.siteId !== site) return false;
    if (filter === 'open' && !OPEN_STATUSES.includes(r.status)) return false;
    if (filter !== 'all' && filter !== 'open' && r.status !== filter) return false;
    if (q) {
      const asset = r.assetId ? getAsset(r.assetId) : undefined;
      const hay = `${r.ticketNo} ${r.title} ${r.category} ${asset?.name ?? ''}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const openCount = mine.filter((r) => OPEN_STATUSES.includes(r.status)).length;
  const inProgressCount = mine.filter((r) => IN_PROGRESS_STATUSES.includes(r.status)).length;
  const completedCount = mine.filter((r) => r.status === 'completed' || r.status === 'closed').length;
  const slaAtRisk = mine.filter((r) => {
    const s = assessSla(r).overallStatus;
    return s === 'delayed' || s === 'completed_delayed';
  }).length;

  const statusesInUse = [...new Set(mine.map((r) => r.status))];

  return (
    <div>
      {/* Header */}
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

      {/* Telemetry Telemetry Bar (Matching EquipmentPage layout & styling) */}
      <section className="eq-telemetry-bar" style={{ marginBottom: 16 }}>
        <div className="eq-telemetry-main">
          <div className="eq-telemetry-badge">
            <Clock size={22} strokeWidth={1.75} />
          </div>
          <div>
            <div className="eq-telemetry-title">
              <span className="eq-telemetry-count">{mine.length}</span>
              <span className="eq-telemetry-unit">{t('TICKETS', 'รายการ')}</span>
            </div>
            <div className="eq-telemetry-sub">
              {t(`${openCount} active requests`, `ค้างอยู่ ${openCount} รายการ`)}
            </div>
          </div>
        </div>

        <button
          type="button"
          className={`eq-telemetry-item ${filter === 'open' ? 'active' : ''}`}
          onClick={() => setFilter(filter === 'open' ? 'all' : 'open')}
        >
          <div className="eq-item-head">
            <span className="status-indicator status-blue" />
            <span className="eq-item-label">{t('Open / Active', 'ค้างอยู่')}</span>
          </div>
          <div className="eq-item-val">{openCount}</div>
        </button>

        <button
          type="button"
          className={`eq-telemetry-item ${filter === 'in_progress' ? 'active' : ''}`}
          onClick={() => setFilter(filter === 'in_progress' ? 'all' : 'in_progress')}
        >
          <div className="eq-item-head">
            <span className="status-indicator status-amber" />
            <span className="eq-item-label">{t('In Progress', 'กำลังทำ')}</span>
          </div>
          <div className="eq-item-val">{inProgressCount}</div>
        </button>

        <button
          type="button"
          className={`eq-telemetry-item ${slaAtRisk > 0 ? 'item-attention' : ''}`}
          onClick={() => setFilter('all')}
        >
          <div className="eq-item-head">
            <span className="status-indicator status-red" />
            <span className="eq-item-label">{t('SLA Overdue', 'SLA ช้ากว่าแผน')}</span>
          </div>
          <div className="eq-item-val" style={{ color: slaAtRisk > 0 ? 'var(--se-danger)' : undefined }}>
            {slaAtRisk}
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

      {/* Integrated Control Toolbar */}
      <div className="eq-filter-container">
        <div className="eq-toolbar-single">
          <div className="eq-search-wrapper">
            <SearchBox value={q} onChange={setQ} placeholder={t('Search ticket, subject, equipment…', 'ค้นหาเลขที่ เรื่อง อุปกรณ์…')} />
          </div>

          <select
            className="eq-select"
            value={site}
            onChange={(e) => setSite(e.target.value)}
            style={{ maxWidth: 170 }}
          >
            <option value="">{t('All Sites', 'ทุกไซต์งาน')}</option>
            {company.sites.map((s) => (
              <option key={s.id} value={s.id}>{lang === 'th' ? s.nameTh : s.name}</option>
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

        {/* Status Filter Chips Row */}
        <div className="chip-row" style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed var(--se-border)' }}>
          <button className={`chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')} aria-pressed={filter === 'all'}>
            {t('All', 'ทั้งหมด')} ({mine.length})
          </button>
          <button className={`chip ${filter === 'open' ? 'active' : ''}`} onClick={() => setFilter('open')} aria-pressed={filter === 'open'}>
            {t('Open', 'ค้างอยู่')} ({openCount})
          </button>
          {statusesInUse.map((s) => {
            const meta = REQUEST_STATUS[s];
            const cnt = mine.filter((r) => r.status === s).length;
            return (
              <button key={s} className={`chip ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)} aria-pressed={filter === s}>
                {lang === 'th' ? meta.th : meta.en} ({cnt})
              </button>
            );
          })}
        </div>
      </div>

      {/* Content View */}
      {filtered.length === 0 ? (
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
          {filtered.map((r) => {
            const st = REQUEST_STATUS[r.status];
            const pr = PRIORITY[r.priority];
            const asset = r.assetId ? getAsset(r.assetId) : undefined;
            const slaMeta = SLA_STATUS_LABEL[assessSla(r).overallStatus];
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
                    <span className="tcc-category">{r.category}</span>
                  </div>
                  <div className="tcc-badges">
                    <StatusBadge label={lang === 'th' ? pr.th : pr.en} tone={pr.tone} />
                    <StatusBadge label={lang === 'th' ? st.th : st.en} tone={st.tone} />
                  </div>
                </div>

                <div className="tcc-title">{r.title}</div>

                <div className="tcc-foot">
                  <div className="tcc-asset-info">
                    {asset ? (
                      <>
                        <span className="tcc-label">{t('Equipment', 'อุปกรณ์')}:</span>
                        <span className="tcc-val">{asset.name}</span>
                      </>
                    ) : (
                      <span className="tcc-muted">{t('General service request', 'คำขอบริการทั่วไป')}</span>
                    )}
                  </div>
                  <div className="tcc-meta-right">
                    <StatusBadge label={lang === 'th' ? slaMeta.th : slaMeta.en} tone={slaMeta.tone} />
                    <span className="tcc-updated">{relTime(r.updated, lang)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
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
                {filtered.map((r) => {
                  const st = REQUEST_STATUS[r.status];
                  const pr = PRIORITY[r.priority];
                  const asset = r.assetId ? getAsset(r.assetId) : undefined;
                  const slaMeta = SLA_STATUS_LABEL[assessSla(r).overallStatus];
                  return (
                    <tr key={r.ticketNo} className="row-link" onClick={() => navigate(`/portal/requests/${r.ticketNo}`)}>
                      <td style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, color: 'var(--se-primary)' }}>
                        {r.ticketNo}
                      </td>
                      <td>
                        <div className="fw-600">{r.title}</div>
                        <div className="muted small">{r.category}</div>
                      </td>
                      <td>{asset ? asset.name : <span className="muted">{t('Not linked', 'ไม่ระบุ')}</span>}</td>
                      <td><StatusBadge label={lang === 'th' ? pr.th : pr.en} tone={pr.tone} /></td>
                      <td><StatusBadge label={lang === 'th' ? st.th : st.en} tone={st.tone} /></td>
                      <td><StatusBadge label={lang === 'th' ? slaMeta.th : slaMeta.en} tone={slaMeta.tone} /></td>
                      <td className="muted small">{relTime(r.updated, lang)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

