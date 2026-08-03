import { useMemo, useState } from 'react';
import { AlertTriangle, Boxes, FileWarning, MapPin, Minus, Plus, RotateCcw, ShoppingCart, TrendingUp, X } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useToast } from '@/contexts/ToastContext';
import { EmptyState, KpiCard, Modal, SearchBox, StatusBadge, Switch } from '@/components/common';
import { MATERIAL_BRANDS, materialById, materialUsageFor, mockMaterials, vmiFor } from '@/data/mockMaterials';
import type { Material, StockLevel } from '@/data/mockMaterials';
import { siteName } from '@/data/mockCompanies';
import { fmtDate } from '@/utils/format';
import type { Tone } from '@/utils/status';

/** Phase 3 — Materials & Consumables (/portal/materials). NEW: no v3/v4 equivalent. */

const STOCK_META: Record<StockLevel, { en: string; th: string; tone: Tone }> = {
  ok: { en: 'OK', th: 'ปกติ', tone: 'green' },
  low: { en: 'Low', th: 'ใกล้หมด', tone: 'amber' },
  critical: { en: 'Critical', th: 'วิกฤต', tone: 'red' },
};

type TabKey = 'catalogue' | 'vmi' | 'reorder' | 'cart';
interface CartLine { materialId: string; qty: number }

export function MaterialsPage() {
  const { lang, t } = useLang();
  const { customerCode } = useCompany();
  const { showToast } = useToast();

  const [tab, setTab] = useState<TabKey>('catalogue');
  const [q, setQ] = useState('');
  const [brand, setBrand] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [sdsItem, setSdsItem] = useState<Material | null>(null);
  const [vmi, setVmi] = useState(() => vmiFor(customerCode));

  const usage = useMemo(() => materialUsageFor(customerCode), [customerCode]);

  const filtered = useMemo(
    () =>
      mockMaterials.filter((m) => {
        if (brand && m.brand !== brand) return false;
        const hay = `${m.name} ${m.nameTh} ${m.category} ${m.brand}`.toLowerCase();
        return hay.includes(q.toLowerCase());
      }),
    [q, brand],
  );

  const addToCart = (m: Material, qty = 1) => {
    setCart((prev) => {
      const ex = prev.find((c) => c.materialId === m.id);
      if (ex) return prev.map((c) => (c.materialId === m.id ? { ...c, qty: c.qty + qty } : c));
      return [...prev, { materialId: m.id, qty }];
    });
    showToast(t(`Added "${m.name}" to cart`, `เพิ่ม "${m.nameTh}" ลงตะกร้าแล้ว`));
  };
  const setQty = (id: string, qty: number) =>
    setCart((prev) => prev.map((c) => (c.materialId === id ? { ...c, qty: Math.max(1, qty) } : c)));
  const removeLine = (id: string) => setCart((prev) => prev.filter((c) => c.materialId !== id));
  const cartTotal = cart.reduce((s, c) => s + (materialById(c.materialId)?.price ?? 0) * c.qty, 0);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  const lowStock = mockMaterials.filter((m) => m.stock !== 'ok').length;

  const TABS: { key: TabKey; en: string; th: string }[] = [
    { key: 'catalogue', en: 'Catalogue', th: 'แคตตาล็อก' },
    { key: 'vmi', en: 'VMI / CMI Stock', th: 'สต็อก VMI / CMI' },
    { key: 'reorder', en: 'Reorder from History', th: 'สั่งซ้ำจากประวัติ' },
    { key: 'cart', en: `Cart (${cartCount})`, th: `ตะกร้า (${cartCount})` },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {t('Materials & Consumables', 'วัสดุสิ้นเปลือง')}{' '}
            <span className="badge t-brand" style={{ verticalAlign: 'middle' }}>NEW · P3</span>
          </h1>
          <p className="page-sub">
            {t(
              'Innovative Material Division — 3,500+ SKUs across 12 brands, browsable and reorderable.',
              'ฝ่ายวัสดุนวัตกรรม — สินค้ากว่า 3,500 รายการจาก 12 แบรนด์ พร้อมสั่งซื้อซ้ำ',
            )}
          </p>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 18 }}>
        <KpiCard icon={<Boxes size={20} />} value="3,500+" label={t('SKUs across 12 brands', 'รายการสินค้า 12 แบรนด์')} to="/portal/materials" />
        <KpiCard icon={<TrendingUp size={20} />} value={47} label={t('Reordered this month', 'สั่งซ้ำเดือนนี้')} to="/portal/materials" tone="green" />
        <KpiCard icon={<MapPin size={20} />} value={vmi.length} label={t('VMI/CMI records tracked', 'รายการสต็อก VMI/CMI')} to="/portal/materials" tone="blue" />
        <KpiCard icon={<AlertTriangle size={20} />} value={lowStock} label={t('Low / critical stock alerts', 'แจ้งเตือนสต็อกต่ำ/วิกฤต')} to="/portal/materials" tone="amber" />
      </div>

      <div className="chip-row" style={{ marginBottom: 18 }}>
        {TABS.map((tb) => (
          <button key={tb.key} className={`chip ${tab === tb.key ? 'active' : ''}`} onClick={() => setTab(tb.key)} aria-pressed={tab === tb.key}>
            {lang === 'th' ? tb.th : tb.en}
          </button>
        ))}
      </div>

      {tab === 'catalogue' && (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
            <SearchBox value={q} onChange={setQ} placeholder={t('Search materials…', 'ค้นหาวัสดุ…')} />
            <select value={brand} onChange={(e) => setBrand(e.target.value)} aria-label={t('Brand', 'แบรนด์')}>
              <option value="">{t('All brands', 'ทุกแบรนด์')}</option>
              {MATERIAL_BRANDS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Boxes size={28} />}
              title={t('No materials match', 'ไม่พบวัสดุที่ค้นหา')}
              body={t('Try a different search or brand filter.', 'ลองค้นหาหรือเลือกแบรนด์อื่น')}
            />
          ) : (
            <div className="grid-3">
              {filtered.map((m) => {
                const sm = STOCK_META[m.stock];
                return (
                  <div key={m.id} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className="badge t-blue">{m.brand}</span>
                      {m.sdsRequired && (
                        <button className="btn btn-ghost btn-sm" onClick={() => setSdsItem(m)} title={t('SDS required', 'ต้องมี SDS')} style={{ padding: 4 }}>
                          <FileWarning size={16} style={{ color: 'var(--se-amber, #d89016)' }} />
                        </button>
                      )}
                    </div>
                    <button onClick={() => setSdsItem(m)} style={{ all: 'unset', cursor: 'pointer' }}>
                      <div style={{ fontWeight: 600 }}>{lang === 'th' ? m.nameTh : m.name}</div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {m.category} · {t('per', 'ต่อ')} {m.unit} · {t('batch', 'ล็อต')} {m.batch}
                      </div>
                    </button>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <strong>฿{m.price.toLocaleString()}</strong>
                        <StatusBadge label={lang === 'th' ? sm.th : sm.en} tone={sm.tone} />
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={() => addToCart(m)}>
                        <Plus size={14} /> {t('Add', 'เพิ่ม')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'vmi' && (
        <div className="card table-wrap" style={{ padding: 0 }}>
          <table className="se-table">
            <thead>
              <tr>
                <th>{t('Site', 'ไซต์')}</th>
                <th>{t('Material', 'วัสดุ')}</th>
                <th>{t('On hand', 'คงเหลือ')}</th>
                <th>{t('Reorder point', 'จุดสั่งซื้อ')}</th>
                <th>{t('Days of stock', 'วันคงเหลือ')}</th>
                <th>{t('Status', 'สถานะ')}</th>
                <th>{t('Auto-reorder', 'สั่งซ้ำอัตโนมัติ')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {vmi.map((v, i) => {
                const m = materialById(v.materialId);
                const sm = STOCK_META[v.status];
                return (
                  <tr key={`${v.siteId}-${v.materialId}`}>
                    <td>{siteName(customerCode, v.siteId, lang)}</td>
                    <td>{m ? (lang === 'th' ? m.nameTh : m.name) : v.materialId}</td>
                    <td>{v.onHand}</td>
                    <td>{v.reorderPoint}</td>
                    <td>{v.daysOfStock} {t('days', 'วัน')}</td>
                    <td><StatusBadge label={lang === 'th' ? sm.th : sm.en} tone={sm.tone} /></td>
                    <td>
                      <Switch
                        checked={v.autoReorder}
                        onChange={(c) => setVmi((prev) => prev.map((x, xi) => (xi === i ? { ...x, autoReorder: c } : x)))}
                        label={t('Auto-reorder', 'สั่งซ้ำอัตโนมัติ')}
                      />
                    </td>
                    <td>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => showToast(t('Replenishment requested', 'ส่งคำขอเติมสต็อกแล้ว'))}
                      >
                        <RotateCcw size={14} /> {t('Request', 'ขอเติม')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'reorder' && (
        <>
          <p className="muted" style={{ marginBottom: 12, fontSize: 13 }}>
            {t(
              'Every completed service job already lists the materials used — the same parts[] data as Service History, surfaced as a one-click reorder.',
              'งานบริการที่เสร็จแล้วทุกงานมีรายการวัสดุที่ใช้ — ข้อมูลเดียวกับประวัติการบริการ กดสั่งซ้ำได้ทันที',
            )}
          </p>
          {usage.length === 0 ? (
            <EmptyState icon={<RotateCcw size={28} />} title={t('No usage history yet', 'ยังไม่มีประวัติการใช้วัสดุ')} body={t('Materials used on completed jobs will appear here.', 'วัสดุที่ใช้ในงานที่เสร็จแล้วจะแสดงที่นี่')} />
          ) : (
            usage.map((j) => (
              <div key={j.jobId} className="card" style={{ padding: 16, marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 8 }}>
                  <strong style={{ color: 'var(--se-primary)' }}>{j.jobId}</strong>
                  <span className="muted" style={{ fontSize: 12 }}>{fmtDate(j.date, lang)} · {j.assetName}</span>
                </div>
                {j.items.map((it) => {
                  const m = materialById(it.materialId);
                  if (!m) return null;
                  return (
                    <div key={it.materialId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderTop: '1px solid var(--se-border, #e4e8ee)' }}>
                      <span style={{ fontSize: 14 }}>{it.qty}× {lang === 'th' ? m.nameTh : m.name}</span>
                      <button className="btn btn-outline btn-sm" onClick={() => addToCart(m, it.qty)}>
                        <Plus size={14} /> {t('Reorder', 'สั่งซ้ำ')}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </>
      )}

      {tab === 'cart' && (
        <div className="card" style={{ padding: 16 }}>
          {cart.length === 0 ? (
            <EmptyState
              icon={<ShoppingCart size={28} />}
              title={t('Your cart is empty', 'ตะกร้าว่างเปล่า')}
              body={t('Add materials from the Catalogue or Reorder tabs.', 'เพิ่มวัสดุจากแคตตาล็อกหรือแท็บสั่งซ้ำ')}
            />
          ) : (
            <>
              {cart.map((c) => {
                const m = materialById(c.materialId);
                if (!m) return null;
                return (
                  <div key={c.materialId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--se-border, #e4e8ee)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{lang === 'th' ? m.nameTh : m.name}</div>
                      <div className="muted" style={{ fontSize: 12 }}>฿{m.price.toLocaleString()} / {m.unit}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => setQty(m.id, c.qty - 1)} aria-label={t('Decrease', 'ลด')}><Minus size={13} /></button>
                      <strong style={{ minWidth: 20, textAlign: 'center' }}>{c.qty}</strong>
                      <button className="btn btn-outline btn-sm" onClick={() => setQty(m.id, c.qty + 1)} aria-label={t('Increase', 'เพิ่ม')}><Plus size={13} /></button>
                      <strong style={{ minWidth: 80, textAlign: 'right' }}>฿{(m.price * c.qty).toLocaleString()}</strong>
                      <button className="btn btn-ghost btn-sm" onClick={() => removeLine(m.id)} aria-label={t('Remove', 'ลบ')}><X size={15} /></button>
                    </div>
                  </div>
                );
              })}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14 }}>
                <strong>{t('Total', 'รวม')}: ฿{cartTotal.toLocaleString()}</strong>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    showToast(t('Order submitted — SE will confirm delivery by email (demo)', 'ส่งคำสั่งซื้อแล้ว — SE จะยืนยันการจัดส่งทางอีเมล (เดโม)'));
                    setCart([]);
                  }}
                >
                  {t('Checkout', 'ชำระเงิน')}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <Modal
        open={!!sdsItem}
        onClose={() => setSdsItem(null)}
        title={sdsItem ? (lang === 'th' ? sdsItem.nameTh : sdsItem.name) : ''}
        footer={
          sdsItem && (
            <button className="btn btn-primary" onClick={() => { addToCart(sdsItem); setSdsItem(null); }}>
              {t('Add to cart', 'เพิ่มลงตะกร้า')} — ฿{sdsItem.price.toLocaleString()}
            </button>
          )
        }
      >
        {sdsItem && (
          <div style={{ display: 'grid', gap: 10 }}>
            <div><span className="badge t-blue">{sdsItem.brand}</span> <span className="muted" style={{ fontSize: 13 }}>{sdsItem.category}</span></div>
            <div style={{ fontSize: 14 }}>{t('Batch / lot', 'ล็อตผลิต')}: <strong>{sdsItem.batch}</strong></div>
            <div style={{ fontSize: 14 }}>{t('Shelf life', 'อายุการเก็บ')}: <strong>{sdsItem.shelfLife}</strong></div>
            <div style={{ fontSize: 14 }}>{t('Hazard class', 'ประเภทอันตราย')}: <strong>{sdsItem.hazard}</strong></div>
            {sdsItem.sdsRequired ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, padding: '10px 12px', borderRadius: 10, background: 'var(--se-warning-soft)', color: 'var(--se-text-secondary)' }}>
                <FileWarning size={15} /> {t('Safety Data Sheet required before first use at a new site — download from the SDS library.', 'ต้องมีเอกสารข้อมูลความปลอดภัย (SDS) ก่อนใช้งานครั้งแรกที่ไซต์ใหม่')}
              </div>
            ) : (
              <div style={{ fontSize: 13, padding: '10px 12px', borderRadius: 10, background: 'var(--se-success-soft)', color: 'var(--se-success)' }}>
                {t('No SDS required for this item.', 'สินค้านี้ไม่ต้องใช้ SDS')}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
