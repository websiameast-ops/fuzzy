import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClipboardList, Plus } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useData } from '@/contexts/DataContext';
import { EmptyState, SearchBox, StatusBadge } from '@/components/common';
import { getAsset } from '@/data/mockAssets';
import { fmtDate, relTime } from '@/utils/format';
import { PRIORITY, REQUEST_STATUS } from '@/utils/status';
import { assessSla, SLA_STATUS_LABEL } from '@/utils/sla';
import type { RequestStatus } from '@/types';

const OPEN_STATUSES: RequestStatus[] = ['submitted', 'reviewing', 'scheduled', 'assigned', 'in_progress', 'waiting_parts', 'waiting_customer'];

export function RequestsPage() {
  const { lang, t } = useLang();
  const { customerCode } = useCompany();
  const { requests } = useData();
  const navigate = useNavigate();

  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | RequestStatus>('all');

  const mine = useMemo(
    () => requests.filter((r) => r.customerCode === customerCode).sort((a, b) => (a.updated < b.updated ? 1 : -1)),
    [requests, customerCode],
  );

  const filtered = mine.filter((r) => {
    if (filter === 'open' && !OPEN_STATUSES.includes(r.status)) return false;
    if (filter !== 'all' && filter !== 'open' && r.status !== filter) return false;
    if (q) {
      const asset = r.assetId ? getAsset(r.assetId) : undefined;
      const hay = `${r.ticketNo} ${r.title} ${r.category} ${asset?.name ?? ''}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const statusesInUse = [...new Set(mine.map((r) => r.status))];
  const openCount = mine.filter((r) => OPEN_STATUSES.includes(r.status)).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('Service Requests', 'คำขอบริการ')}</h1>
          <p className="page-sub">
            {t(`${openCount} open of ${mine.length} total requests.`, `คำขอที่ค้างอยู่ ${openCount} จากทั้งหมด ${mine.length} รายการ`)}
          </p>
        </div>
        <div className="page-actions">
          <Link to="/portal/requests/new" className="btn btn-primary">
            <Plus size={16} aria-hidden />
            {t('New request', 'สร้างคำขอใหม่')}
          </Link>
        </div>
      </div>

      <div className="chip-row" style={{ marginBottom: 12 }}>
        <button className={`chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')} aria-pressed={filter === 'all'}>
          {t('All', 'ทั้งหมด')} ({mine.length})
        </button>
        <button className={`chip ${filter === 'open' ? 'active' : ''}`} onClick={() => setFilter('open')} aria-pressed={filter === 'open'}>
          {t('Open', 'ค้างอยู่')} ({openCount})
        </button>
        {statusesInUse.map((s) => {
          const meta = REQUEST_STATUS[s];
          const count = mine.filter((r) => r.status === s).length;
          return (
            <button key={s} className={`chip ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)} aria-pressed={filter === s}>
              {lang === 'th' ? meta.th : meta.en} ({count})
            </button>
          );
        })}
      </div>

      <div style={{ marginBottom: 14, maxWidth: 420 }}>
        <SearchBox value={q} onChange={setQ} placeholder={t('Search ticket, subject, equipment…', 'ค้นหาเลขที่ เรื่อง อุปกรณ์…')} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={24} />}
          title={t('No requests to show', 'ไม่มีคำขอที่จะแสดง')}
          body={t('Nothing matches this filter yet. When something needs attention, report it in under two minutes.', 'ยังไม่มีรายการตรงกับตัวกรองนี้ หากมีปัญหา แจ้งได้ภายในไม่ถึงสองนาที')}
          action={
            <Link to="/portal/requests/new" className="btn btn-primary btn-sm">
              <Plus size={14} aria-hidden />
              {t('Report a problem', 'แจ้งปัญหา')}
            </Link>
          }
        />
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
                  <th>{t('vs. plan', 'เทียบแผน')}</th>
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
                      <td data-label={t('Ticket', 'เลขที่')}>
                        <Link to={`/portal/requests/${r.ticketNo}`} onClick={(e) => e.stopPropagation()}>{r.ticketNo}</Link>
                        <div className="muted small">{fmtDate(r.created, lang)}</div>
                      </td>
                      <td data-label={t('Subject', 'เรื่อง')}>
                        <div className="fw-600">{r.title}</div>
                        <div className="muted small">{r.category}</div>
                      </td>
                      <td data-label={t('Equipment', 'อุปกรณ์')}>{asset ? asset.name : t('Not linked', 'ไม่ระบุ')}</td>
                      <td data-label={t('Priority', 'ความเร่งด่วน')}><StatusBadge label={lang === 'th' ? pr.th : pr.en} tone={pr.tone} /></td>
                      <td data-label={t('Status', 'สถานะ')}><StatusBadge label={lang === 'th' ? st.th : st.en} tone={st.tone} /></td>
                      <td data-label={t('vs. plan', 'เทียบแผน')}><StatusBadge label={lang === 'th' ? slaMeta.th : slaMeta.en} tone={slaMeta.tone} /></td>
                      <td data-label={t('Updated', 'อัปเดต')}>{relTime(r.updated, lang)}</td>
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
