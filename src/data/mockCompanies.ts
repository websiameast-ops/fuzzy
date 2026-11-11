import type { Company } from '@/types';

export const mockCompanies: Company[] = [
  {
    customerCode: '210WWCUTIX',
    name: 'Unilever Business Services Co., Ltd. (PCL)',
    nameTh: 'บริษัท ยูนิลิเวอร์ บิสิเนส เซอร์วิสเซส จำกัด (มหาชน)',
    industry: 'Consumer Goods & Manufacturing',
    sites: [
      { id: 'S-01', name: 'Gateway Plant', nameTh: 'โรงงานเกตเวย์' },
      { id: 'S-02', name: 'Minburi Plant', nameTh: 'โรงงานมีนบุรี' },
      { id: 'S-03', name: 'Bangpoo Utility', nameTh: 'อาคารสาธารณูปโภคบางปู' },
      { id: 'S-04', name: 'Chonburi Warehouse', nameTh: 'คลังสินค้าชลบุรี' },
      { id: 'S-05', name: 'Rayong Site A', nameTh: 'ไซต์ระยอง เอ' },
      { id: 'S-06', name: 'Rayong Site B', nameTh: 'ไซต์ระยอง บี' },
      { id: 'S-07', name: 'Head Office', nameTh: 'สำนักงานใหญ่' },
    ],
    accountManager: {
      name: 'Irada Apiwong',
      role: 'Sales Engineer',
      roleTh: 'วิศวกรฝ่ายขาย',
      phone: '063-3935208',
      email: 'irada.api@siameastsolutions.com',
      line: '@siameast',
    },
    serviceCoordinator: {
      name: 'Nathathai Boonwan',
      role: 'Sales Engineer',
      roleTh: 'วิศวกรฝ่ายขาย',
      phone: '063-3935090',
      email: 'nathathai.boo@siameastsolutions.com',
      line: '@siameast',
    },
  },
  {
    customerCode: 'CUS-00128',
    name: 'Demo Industrial Co., Ltd.',
    nameTh: 'บริษัท เดโม อินดัสเทรียล จำกัด',
    industry: 'Manufacturing — petrochemical supply chain',
    sites: [
      { id: 'S-RY', name: 'Rayong Factory', nameTh: 'โรงงานระยอง' },
      { id: 'S-BN', name: 'Bangna Warehouse', nameTh: 'คลังสินค้าบางนา' },
      { id: 'S-CB', name: 'Chonburi Utility Building', nameTh: 'อาคารสาธารณูปโภคชลบุรี' },
    ],
    accountManager: {
      name: 'Kittipong Suwan',
      role: 'Account Manager',
      roleTh: 'ผู้จัดการฝ่ายขายประจำบัญชี',
      phone: '+66 81 234 5678',
      email: 'kittipong.s@seconnex.co.th',
    },
    serviceCoordinator: {
      name: 'Waraporn Chaiyasit',
      role: 'Service Coordinator',
      roleTh: 'ผู้ประสานงานบริการ',
      phone: '+66 38 606 100',
      email: 'service@seconnex.co.th',
    },
  },
  {
    customerCode: 'CUS-00241',
    name: 'Eastern Water Systems Co., Ltd.',
    nameTh: 'บริษัท อีสเทิร์น วอเตอร์ ซิสเต็มส์ จำกัด',
    industry: 'Water utility — Eastern Economic Corridor',
    sites: [
      { id: 'S-CS', name: 'Chachoengsao Pump Station', nameTh: 'สถานีสูบน้ำฉะเชิงเทรา' },
      { id: 'S-MTP', name: 'Map Ta Phut Utility Site', nameTh: 'พื้นที่สาธารณูปโภคมาบตาพุด' },
    ],
    accountManager: {
      name: 'Natthaya Prasert',
      role: 'Account Manager',
      roleTh: 'ผู้จัดการฝ่ายขายประจำบัญชี',
      phone: '+66 89 456 1122',
      email: 'natthaya.p@seconnex.co.th',
    },
    serviceCoordinator: {
      name: 'Somchai Meesuk',
      role: 'Service Coordinator',
      roleTh: 'ผู้ประสานงานบริการ',
      phone: '+66 38 606 100',
      email: 'service@seconnex.co.th',
    },
  },
];

export function getCompany(code: string): Company {
  return mockCompanies.find((c) => c.customerCode === code) ?? mockCompanies[0]!;
}

export function siteName(code: string, siteId: string, lang: 'en' | 'th' = 'en'): string {
  const c = getCompany(code);
  const s = c.sites.find((x) => x.id === siteId);
  if (!s) return siteId;
  return lang === 'th' ? s.nameTh : s.name;
}
