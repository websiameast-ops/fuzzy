import type { CarbonData } from '@/types';

export const mockCarbon: CarbonData[] = [
  {
    customerCode: 'CUS-00128',
    connectedAssets: 5,
    totalAssets: 12,
    monthlyKwh: 150548,
    savedKwh: 20950,
    co2AvoidedTons: 10.4,
    coveragePct: 68,
    bySite: [
      { site: 'Rayong Factory', kwh: 128414, label: 'measured' },
      { site: 'Chonburi Utility Building', kwh: 20954, label: 'measured' },
      { site: 'Bangna Warehouse', kwh: 1180, label: 'estimated' },
    ],
    byCategory: [
      { category: 'Production utilities', kwh: 96400 },
      { category: 'Cooling & pumping', kwh: 31200 },
      { category: 'Lighting & building', kwh: 15800 },
      { category: 'IT & monitoring', kwh: 198 },
      { category: 'Solar (self-consumed)', kwh: 6950 },
    ],
    trend: [
      { month: 'Aug 25', kwh: 138200, baseline: 149500 },
      { month: 'Sep 25', kwh: 141800, baseline: 150200 },
      { month: 'Oct 25', kwh: 145100, baseline: 151800 },
      { month: 'Nov 25', kwh: 139600, baseline: 149900 },
      { month: 'Dec 25', kwh: 131400, baseline: 146800 },
      { month: 'Jan 26', kwh: 134900, baseline: 148100 },
      { month: 'Feb 26', kwh: 137200, baseline: 149000 },
      { month: 'Mar 26', kwh: 149800, baseline: 158600 },
      { month: 'Apr 26', kwh: 152300, baseline: 161200 },
      { month: 'May 26', kwh: 148700, baseline: 158900 },
      { month: 'Jun 26', kwh: 151900, baseline: 160800 },
      { month: 'Jul 26', kwh: 150548, baseline: 160100 },
    ],
    incompleteAssets: [
      { assetId: 'AST-PMP-001', name: 'Vertical Multistage Pump (CR 64-2)', issue: 'Baseline required — no meter on feeder' },
      { assetId: 'AST-PMP-002', name: 'End-Suction Pump (Cooling water)', issue: 'Data unavailable — not connected' },
      { assetId: 'AST-VLV-001', name: 'Industrial Process Valve', issue: 'Not applicable — non-powered asset' },
    ],
  },
  {
    customerCode: 'CUS-00241',
    connectedAssets: 2,
    totalAssets: 5,
    monthlyKwh: 86414,
    savedKwh: 4120,
    co2AvoidedTons: 2.1,
    coveragePct: 54,
    bySite: [
      { site: 'Map Ta Phut Utility Site', kwh: 86400, label: 'measured' },
      { site: 'Chachoengsao Pump Station', kwh: 14, label: 'estimated' },
    ],
    byCategory: [
      { category: 'Pumping', kwh: 79800 },
      { category: 'Treatment process', kwh: 5400 },
      { category: 'Building & lighting', kwh: 1200 },
      { category: 'IT & monitoring', kwh: 14 },
    ],
    trend: [
      { month: 'Aug 25', kwh: 82100, baseline: 84900 },
      { month: 'Sep 25', kwh: 83400, baseline: 85600 },
      { month: 'Oct 25', kwh: 84900, baseline: 86800 },
      { month: 'Nov 25', kwh: 83100, baseline: 85900 },
      { month: 'Dec 25', kwh: 81200, baseline: 84100 },
      { month: 'Jan 26', kwh: 82600, baseline: 85200 },
      { month: 'Feb 26', kwh: 83900, baseline: 86100 },
      { month: 'Mar 26', kwh: 87200, baseline: 90100 },
      { month: 'Apr 26', kwh: 88400, baseline: 91600 },
      { month: 'May 26', kwh: 86900, baseline: 90200 },
      { month: 'Jun 26', kwh: 87100, baseline: 90600 },
      { month: 'Jul 26', kwh: 86414, baseline: 89900 },
    ],
    incompleteAssets: [
      { assetId: 'AST-PMP-101', name: 'Horizontal Split-Case Pump', issue: 'Baseline required — feeder meter planned' },
      { assetId: 'AST-PMP-102', name: 'Submersible Sewage Pump', issue: 'Data unavailable — not connected' },
    ],
  },
];

export function carbonFor(customerCode: string): CarbonData {
  return mockCarbon.find((c) => c.customerCode === customerCode) ?? mockCarbon[0]!;
}
