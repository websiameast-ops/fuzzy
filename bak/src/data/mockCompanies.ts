import type { Company } from '@/types';

export const mockCompanies: Company[] = [
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
      email: 'kittipong.s@siameast.co.th',
      line: '@seconnex',
    },
    serviceCoordinator: {
      name: 'Waraporn Chaiyasit',
      role: 'Service Coordinator',
      roleTh: 'ผู้ประสานงานบริการ',
      phone: '+66 38 606 100',
      email: 'service@siameast.co.th',
      line: '@seconnex',
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
      email: 'natthaya.p@siameast.co.th',
      line: '@seconnex',
    },
    serviceCoordinator: {
      name: 'Somchai Meesuk',
      role: 'Service Coordinator',
      roleTh: 'ผู้ประสานงานบริการ',
      phone: '+66 38 606 100',
      email: 'service@siameast.co.th',
      line: '@seconnex',
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
