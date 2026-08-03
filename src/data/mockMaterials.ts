/** Phase 3 — Materials & Consumables (Innovative Material Division).
 *  Same conventions as the other mock files: typed records, customerCode scoping,
 *  and a `materialsFor()` accessor. Brand roster from SE's public site — verify
 *  SKU counts and pricing with the Innovative Material team before production. */

export type StockLevel = 'ok' | 'low' | 'critical';

export interface Material {
  id: string;
  name: string;
  nameTh: string;
  brand: string;
  category: string;
  unit: string;
  price: number; // THB
  stock: StockLevel;
  sdsRequired: boolean;
  batch: string;
  shelfLife: string;
  hazard: string;
}

export interface VmiRecord {
  customerCode: string;
  siteId: string;
  materialId: string;
  onHand: number;
  reorderPoint: number;
  daysOfStock: number;
  status: StockLevel;
  autoReorder: boolean;
}

export interface MaterialUsage {
  customerCode: string;
  jobId: string;
  date: string; // ISO
  assetId: string;
  assetName: string;
  items: { materialId: string; qty: number }[];
}

export const mockMaterials: Material[] = [
  { id: 'M-005', name: 'Threadlocker 243, Medium Strength', nameTh: 'น้ำยาล็อกเกลียว 243', brand: 'Loctite', category: 'Adhesives & Sealants', unit: '50ml', price: 340, stock: 'critical', sdsRequired: true, batch: 'LT-26044', shelfLife: '24 months', hazard: 'Flammable liquid, Class 3' },
  { id: 'M-002', name: 'Coalescing Filter Element 10"', nameTh: 'ไส้กรองโคอะเลสซิ่ง 10"', brand: 'GVS', category: 'Filtration', unit: 'pc', price: 890, stock: 'low', sdsRequired: false, batch: 'GV-24902', shelfLife: '60 months', hazard: 'Non-hazardous' },
  { id: 'M-008', name: 'Mechanical Seal O-ring Kit', nameTh: 'ชุดโอริงแมคคานิคอลซีล', brand: 'Orihara & Orix', category: 'Seals', unit: 'kit', price: 560, stock: 'low', sdsRequired: false, batch: 'OO-25877', shelfLife: '48 months', hazard: 'Non-hazardous' },
  { id: 'M-001', name: 'Insulation Jacket, Pipe DN80', nameTh: 'แจ็คเก็ตฉนวนท่อ DN80', brand: 'Armacell', category: 'Insulation', unit: 'pc', price: 1250, stock: 'ok', sdsRequired: true, batch: 'AR-24118', shelfLife: '36 months', hazard: 'Non-hazardous' },
  { id: 'M-003', name: 'Flap Disc 4" Zirconia 60-grit', nameTh: 'จานทรายเรียงซ้อน 4" เบอร์ 60', brand: 'Klingspor', category: 'Abrasives', unit: 'box/10', price: 620, stock: 'ok', sdsRequired: false, batch: 'KL-25011', shelfLife: 'Unlimited', hazard: 'Non-hazardous' },
  { id: 'M-009', name: 'RTV Silicone Sealant, High-temp', nameTh: 'ซิลิโคนทนความร้อนสูง RTV', brand: 'SCI Silicone', category: 'Adhesives & Sealants', unit: '310ml', price: 295, stock: 'ok', sdsRequired: true, batch: 'SC-25690', shelfLife: '18 months', hazard: 'Irritant, Category 2' },
  { id: 'M-011', name: 'Nitrile Gloves, Powder-free', nameTh: 'ถุงมือไนไตรไม่มีแป้ง', brand: 'Sri Trang', category: 'Wipes & PPE', unit: 'box/100', price: 165, stock: 'ok', sdsRequired: false, batch: 'ST-26102', shelfLife: '60 months', hazard: 'Non-hazardous' },
  { id: 'M-010', name: 'Spiral-wound Gasket, 4" #150', nameTh: 'ปะเก็นสไปรัล 4" #150', brand: 'Valqua', category: 'Gasketing', unit: 'pc', price: 740, stock: 'ok', sdsRequired: false, batch: 'VQ-24455', shelfLife: 'Unlimited', hazard: 'Non-hazardous' },
  { id: 'M-012', name: 'Duct Tape, Industrial 48mm', nameTh: 'เทปกาวอุตสาหกรรม 48มม.', brand: '3M', category: 'Tape & Fixings', unit: 'roll', price: 210, stock: 'ok', sdsRequired: false, batch: '3M-25777', shelfLife: 'Unlimited', hazard: 'Non-hazardous' },
  { id: 'M-004', name: 'Industrial Wiper Roll, Heavy-duty', nameTh: 'กระดาษเช็ดอุตสาหกรรมแบบม้วน', brand: 'Kimberly Clark', category: 'Wipes & PPE', unit: 'roll', price: 480, stock: 'ok', sdsRequired: false, batch: 'KC-25203', shelfLife: 'Unlimited', hazard: 'Non-hazardous' },
  { id: 'M-006', name: 'Cut-resistant Gloves, Level 5', nameTh: 'ถุงมือกันบาดระดับ 5', brand: 'Ramco-Safety', category: 'Safety Equipment', unit: 'pair', price: 210, stock: 'ok', sdsRequired: false, batch: 'RS-25551', shelfLife: 'Unlimited', hazard: 'Non-hazardous' },
  { id: 'M-007', name: 'Safety Sight Glass, 2" NPT', nameTh: 'กระจกมองระดับนิรภัย 2" NPT', brand: 'MAXOS', category: 'Process Components', unit: 'pc', price: 1980, stock: 'ok', sdsRequired: false, batch: 'MX-24310', shelfLife: 'Unlimited', hazard: 'Non-hazardous' },
];

export const MATERIAL_BRANDS = [...new Set(mockMaterials.map((m) => m.brand))].sort();

const mockVmi: VmiRecord[] = [
  { customerCode: 'CUS-00128', siteId: 'S-RY', materialId: 'M-005', onHand: 4, reorderPoint: 12, daysOfStock: 6, status: 'critical', autoReorder: false },
  { customerCode: 'CUS-00128', siteId: 'S-RY', materialId: 'M-002', onHand: 9, reorderPoint: 15, daysOfStock: 18, status: 'low', autoReorder: true },
  { customerCode: 'CUS-00128', siteId: 'S-CB', materialId: 'M-011', onHand: 42, reorderPoint: 20, daysOfStock: 61, status: 'ok', autoReorder: true },
  { customerCode: 'CUS-00128', siteId: 'S-BN', materialId: 'M-008', onHand: 3, reorderPoint: 8, daysOfStock: 14, status: 'low', autoReorder: false },
];

const mockUsage: MaterialUsage[] = [
  { customerCode: 'CUS-00128', jobId: 'JOB-2026-0421', date: '2026-06-18', assetId: 'AST-PMP-001', assetName: 'Vertical Multistage Pump', items: [{ materialId: 'M-005', qty: 2 }, { materialId: 'M-008', qty: 1 }] },
  { customerCode: 'CUS-00128', jobId: 'JOB-2026-0355', date: '2026-05-14', assetId: 'AST-PMP-002', assetName: 'End-Suction Pump', items: [{ materialId: 'M-002', qty: 2 }, { materialId: 'M-009', qty: 1 }] },
];

export function materialById(id: string): Material | undefined {
  return mockMaterials.find((m) => m.id === id);
}
export function vmiFor(customerCode: string): VmiRecord[] {
  return mockVmi.filter((v) => v.customerCode === customerCode);
}
export function materialUsageFor(customerCode: string): MaterialUsage[] {
  return mockUsage.filter((u) => u.customerCode === customerCode);
}
