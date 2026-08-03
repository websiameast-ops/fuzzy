/** Phase 4 — Parts & Orders (capital-equipment spares).
 *  Deliberately a different commerce shape from Materials: quote-driven, no cart.
 *  Prices/lead times are placeholders — a real build would source these from ERP. */

export interface SparePart {
  id: string;
  name: string;
  nameTh: string;
  assetId: string;
  assetName: string;
  lastUsed: string | null; // ISO date or null
  leadTime: string;
  price: number; // THB, indicative
}

export interface PartOrder {
  customerCode: string;
  po: string;
  partName: string;
  stage: 'quote_approved' | 'in_production' | 'shipped' | 'delivered';
  pct: number;
}

export const mockParts: SparePart[] = [
  { id: 'P-001', name: 'Mechanical Seal Assembly, complete', nameTh: 'ชุดแมคคานิคอลซีลครบชุด', assetId: 'AST-PMP-001', assetName: 'Vertical Multistage Pump', lastUsed: '2026-06-18', leadTime: '10–14 days', price: 18400 },
  { id: 'P-003', name: 'Motor Bearing Set (DE + NDE)', nameTh: 'ชุดแบริ่งมอเตอร์ (DE + NDE)', assetId: 'AST-PMP-001', assetName: 'Vertical Multistage Pump', lastUsed: '2026-01-02', leadTime: '5–7 days', price: 9200 },
  { id: 'P-002', name: 'Impeller, 6-vane bronze', nameTh: 'ใบพัดบรอนซ์ 6 ใบ', assetId: 'AST-PMP-002', assetName: 'End-Suction Pump', lastUsed: null, leadTime: '3–4 weeks', price: 26900 },
  { id: 'P-004', name: 'VFD Control Board', nameTh: 'บอร์ดควบคุม VFD', assetId: 'AST-SLR-001', assetName: 'Solar Inverter', lastUsed: null, leadTime: '6–8 weeks', price: 64500 },
];

const mockOrders: PartOrder[] = [
  { customerCode: 'CUS-00128', po: 'PO-2026-0114', partName: 'Mechanical Seal Assembly', stage: 'shipped', pct: 75 },
  { customerCode: 'CUS-00128', po: 'PO-2026-0098', partName: 'Motor Bearing Set', stage: 'in_production', pct: 40 },
  { customerCode: 'CUS-00128', po: 'PO-2026-0066', partName: 'Impeller, 6-vane bronze', stage: 'delivered', pct: 100 },
];

export const ORDER_STAGE_LABEL: Record<PartOrder['stage'], { en: string; th: string }> = {
  quote_approved: { en: 'Quote approved', th: 'อนุมัติใบเสนอราคา' },
  in_production: { en: 'In production', th: 'กำลังผลิต' },
  shipped: { en: 'Shipped', th: 'จัดส่งแล้ว' },
  delivered: { en: 'Delivered', th: 'ส่งมอบแล้ว' },
};

export function partOrdersFor(customerCode: string): PartOrder[] {
  return mockOrders.filter((o) => o.customerCode === customerCode);
}
