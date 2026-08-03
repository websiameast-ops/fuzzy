import { useMemo, useState } from 'react';
import { ClipboardCheck, Clock, Truck, Wrench, X } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useToast } from '@/contexts/ToastContext';
import { EmptyState, KpiCard, StatusBadge } from '@/components/common';
import { ORDER_STAGE_LABEL, mockParts, partOrdersFor } from '@/data/mockParts';
import type { SparePart } from '@/data/mockParts';
import { fmtDate } from '@/utils/format';

/** Phase 4 — Parts & Orders (/portal/parts). NEW: capital-equipment spares.
 *  Deliberately quote-driven (no cart) — a different commerce shape from Materials. */

type TabKey = 'catalogue' | 'quote' | 'tracking';

export function PartsPage() {
  const { lang, t } = useLang();
  const { customerCode } = useCompany();
  const { showToast } = useToast();

  const [tab, setTab] = useState<TabKey>('catalogue');
  const [quote, setQuote] = useState<SparePart[]>([]);
  const [costCenter, setCostCenter] = useState('');
  const [approver, setApprover] = useState('');

  const orders = useMemo(() => partOrdersFor(customerCode), [customerCode]);
  const quoteTotal = quote.reduce((s, p) => s + p.price, 0);

  const requestQuote = (p: SparePart) => {
    if (quote.some((x) => x.id === p.id)) {
      showToast(t('Already in your quote request', 'อยู่ในใบขอเสนอราคาแล้ว'), 'info');
      return;
    }
    setQuote((prev) => [...prev, p]);
    showToast(t(`Added "${p.name}" to quote request`, `เพิ่ม "${p.nameTh}" ในใบขอเสนอราคา`));
  };

  const TABS: { key: TabKey; en: string; th: string }[] = [
    { key: 'catalogue', en: 'Parts Catalogue', th: 'แคตตาล็อกอะไหล่' },
    { key: 'quote', en: `Quote Request (${quote.length})`, th: `ขอใบเสนอราคา (${quote.length})` },
    { key: 'tracking', en: 'Order Tracking', th: 'ติดตามคำสั่งซื้อ' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {t('Parts & Orders', 'อะไหล่และคำสั่งซื้อ')}{' '}
            <span className="badge t-red" style={{ verticalAlign: 'middle' }}>NEW · P4</span>
          </h1>
          <p className="page-sub">
            {t(
              'Capital-equipment spares — quote-driven, not a cart: this is B2B procurement, not consumables shopping.',
              'อะไหล่เครื่องจักรหลัก — ขอใบเสนอราคาแทนตะกร้า เพราะเป็นการจัดซื้อแบบ B2B',
            )}
          </p>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 18 }}>
        <KpiCard icon={<ClipboardCheck size={20} />} value={quote.length} label={t('Parts in current quote request', 'อะไหล่ในใบขอเสนอราคา')} to="/portal/parts" tone="amber" />
        <KpiCard icon={<Truck size={20} />} value={orders.filter((o) => o.stage !== 'delivered').length} label={t('Orders in progress', 'คำสั่งซื้อระหว่างดำเนินการ')} to="/portal/parts" tone="blue" />
        <KpiCard icon={<Clock size={20} />} value={t('12 days', '12 วัน')} label={t('Average lead time', 'ระยะเวลาส่งมอบเฉลี่ย')} to="/portal/parts" tone="grey" />
      </div>

      <div className="chip-row" style={{ marginBottom: 18 }}>
        {TABS.map((tb) => (
          <button key={tb.key} className={`chip ${tab === tb.key ? 'active' : ''}`} onClick={() => setTab(tb.key)} aria-pressed={tab === tb.key}>
            {lang === 'th' ? tb.th : tb.en}
          </button>
        ))}
      </div>

      {tab === 'catalogue' && (
        <div className="card table-wrap" style={{ padding: 0 }}>
          <table className="se-table">
            <thead>
              <tr>
                <th>{t('Part', 'อะไหล่')}</th>
                <th>{t('Fits asset', 'ใช้กับอุปกรณ์')}</th>
                <th>{t('Last used', 'ใช้ล่าสุด')}</th>
                <th>{t('Lead time', 'ระยะส่งมอบ')}</th>
                <th>{t('Indicative price', 'ราคาโดยประมาณ')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {mockParts.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{lang === 'th' ? p.nameTh : p.name}</td>
                  <td className="muted">{p.assetName}</td>
                  <td>
                    {p.lastUsed ? (
                      <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        {fmtDate(p.lastUsed, lang)} <StatusBadge label={t('reorder match', 'เคยใช้')} tone="green" dot={false} />
                      </span>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td className="muted">{p.leadTime}</td>
                  <td>฿{p.price.toLocaleString()}</td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => requestQuote(p)}>
                      {t('Request quote', 'ขอใบเสนอราคา')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'quote' && (
        <div className="card" style={{ padding: 16 }}>
          {quote.length === 0 ? (
            <EmptyState
              icon={<Wrench size={28} />}
              title={t('No parts added yet', 'ยังไม่มีอะไหล่ในรายการ')}
              body={t('Request a quote from the Parts Catalogue tab.', 'เลือกอะไหล่จากแท็บแคตตาล็อกเพื่อขอใบเสนอราคา')}
            />
          ) : (
            <>
              {quote.map((p) => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--se-border, #e4e8ee)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{lang === 'th' ? p.nameTh : p.name}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{p.assetName} · {p.leadTime}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <strong>฿{p.price.toLocaleString()}</strong>
                    <button className="btn btn-ghost btn-sm" onClick={() => setQuote((q) => q.filter((x) => x.id !== p.id))} aria-label={t('Remove', 'ลบ')}>
                      <X size={15} />
                    </button>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontWeight: 700 }}>
                <span>{t('Estimated total', 'ยอดรวมโดยประมาณ')}</span>
                <span>฿{quoteTotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 12 }}>
                <input
                  type="text"
                  value={costCenter}
                  onChange={(e) => setCostCenter(e.target.value)}
                  placeholder={t('Cost center (e.g. MAINT-RY-01)', 'ศูนย์ต้นทุน (เช่น MAINT-RY-01)')}
                  aria-label={t('Cost center', 'ศูนย์ต้นทุน')}
                />
                <input
                  type="text"
                  value={approver}
                  onChange={(e) => setApprover(e.target.value)}
                  placeholder={t('Approver name', 'ชื่อผู้อนุมัติ')}
                  aria-label={t('Approver name', 'ชื่อผู้อนุมัติ')}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    showToast(t('Quote request sent for budget approval (demo)', 'ส่งคำขอใบเสนอราคาเพื่อขออนุมัติงบแล้ว (เดโม)'));
                    setQuote([]);
                    setCostCenter('');
                    setApprover('');
                  }}
                >
                  {t('Submit for budget approval', 'ส่งขออนุมัติงบประมาณ')}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'tracking' && (
        <div style={{ display: 'grid', gap: 12 }}>
          {orders.map((o) => {
            const st = ORDER_STAGE_LABEL[o.stage];
            return (
              <div key={o.po} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <strong style={{ color: 'var(--se-primary)' }}>{o.po}</strong>
                    <span className="muted" style={{ fontSize: 12, marginLeft: 8 }}>{o.partName}</span>
                  </div>
                  <StatusBadge label={lang === 'th' ? st.th : st.en} tone={o.pct === 100 ? 'green' : 'blue'} />
                </div>
                <div style={{ height: 8, borderRadius: 999, background: 'var(--se-border, #e4e8ee)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${o.pct}%`, borderRadius: 999, background: o.pct === 100 ? 'var(--se-green, #16855b)' : 'var(--se-primary)' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
