/* Equipment units behind the mock API (apiGetEquipment*). Categories follow the five
 * portal groups (Pump / Mixer / Service / Spare Part / Other). Statuses are the old demo vocabulary and get mapped to Active/UnderRepair in mockApi.ts. */
export interface MockUnit {
  id: string;
  customerCode: string;
  name: string;
  category: 'Pump' | 'Mixer' | 'Service' | 'Spare Part' | 'Other';
  brand: string;
  model: string;
  serial: string;
  customerRef: string;
  siteId: string;
  location: string;
  status: 'running' | 'online' | 'operating' | 'maintenance' | 'stopped' | 'offline';
  warranty: 'active' | 'expiring' | 'expired';
  warrantyEnd: string;
  purchaseDate?: string;
  installDate: string;
  nextPM?: string;
  installYear: number;
}

export const mockUnits: MockUnit[] = [
  {id:'AST-PMP-001',customerCode:'CUS-00128',name:'Vertical Multistage Pump',category:'Pump',brand:'Grundfos',model:'CR 64-2',serial:'GF-CR64-240118-0042',customerRef:'UT-PUMP-01',siteId:'S-RY',location:'Utility Building, Pump Room 1',status:'running',warranty:'active',warrantyEnd:'2027-03-15',installDate:'2024-01-15',nextPM:'2026-08-18',installYear:2024},
  {id:'AST-PMP-002',customerCode:'CUS-00128',name:'End-Suction Centrifugal Pump',category:'Pump',brand:'Ebara',model:'FSA Demo 30 kW',serial:'EB-FSA30-230601-0187',customerRef:'CW-PUMP-02',siteId:'S-RY',location:'Cooling Water System, Pump Yard B',status:'maintenance',warranty:'expiring',warrantyEnd:'2026-08-30',installDate:'2023-08-22',nextPM:'2026-07-22',installYear:2023},
  {id:'AST-PMP-003',customerCode:'CUS-00128',name:'Submersible Drainage Pump',category:'Pump',brand:'Tsurumi',model:'KTZ Demo 7.5 kW',serial:'TS-KTZ-220304-0921',customerRef:'WH-SUMP-01',siteId:'S-BN',location:'Warehouse basement, sump pit 1',status:'running',warranty:'active',warrantyEnd:'2027-02-10',installDate:'2025-02-05',nextPM:'2026-09-10',installYear:2025},
  {id:'AST-PMP-004',customerCode:'CUS-00128',name:'High-Pressure Booster Pump',category:'Pump',brand:'Grundfos',model:'CR 32-4',serial:'GF-CR32-231010-0311',customerRef:'BN-BOOST-01',siteId:'S-BN',location:'Water booster room, roof level',status:'stopped',warranty:'active',warrantyEnd:'2027-02-01',installDate:'2024-01-28',nextPM:'2026-10-05',installYear:2024},
  {id:'AST-MIX-001',customerCode:'CUS-00128',name:'Top-Entry Industrial Agitator',category:'Mixer',brand:'Ekato',model:'EM-450 Pro 15 kW',serial:'EK-EM450-240312-0019',customerRef:'TK-MIX-01',siteId:'S-RY',location:'Mixing Plant 1, Reactor Tank T-101',status:'running',warranty:'active',warrantyEnd:'2027-04-01',installDate:'2024-03-25',nextPM:'2026-12-15',installYear:2024},
  {id:'AST-MIX-002',customerCode:'CUS-00128',name:'High-Shear Inline Fluid Mixer',category:'Mixer',brand:'Silverson',model:'Flashmix FX-50',serial:'SV-FX50-230910-0084',customerRef:'INLINE-MIX-02',siteId:'S-CB',location:'Blending Bay 3, Chemical Additive Loop',status:'running',warranty:'expiring',warrantyEnd:'2026-10-01',installDate:'2023-09-20',nextPM:'2026-09-20',installYear:2023},
  {id:'AST-SRV-001',customerCode:'CUS-00128',name:'Master PLC & VFD System Control Panel',category:'Service',brand:'SiamEast Control Solutions',model:'CP-Smart 800',serial:'SE-CP800-240110-0082',customerRef:'CP-MAIN-01',siteId:'S-RY',location:'Electrical Control Room 2, Bay 4',status:'running',warranty:'active',warrantyEnd:'2027-02-01',installDate:'2024-01-20',nextPM:'2026-11-20',installYear:2024},
  {id:'AST-SRV-002',customerCode:'CUS-00128',name:'Industrial Solar Power Control System',category:'Service',brand:'Huawei / SE Energy',model:'SUN2000 Demo 100 kW Control',serial:'HW-S2K-240610-0064',customerRef:'CB-INV-01',siteId:'S-CB',location:'Rooftop plant, inverter station 1',status:'online',warranty:'active',warrantyEnd:'2029-07-01',installDate:'2024-06-20',nextPM:'2026-08-05',installYear:2024},
  {id:'AST-SRV-003',customerCode:'CUS-00128',name:'Industrial SCADA & IoT Telemetry Gateway',category:'Service',brand:'SE Industrial Intelligence',model:'Gateway Demo V1',serial:'SE-GW-240915-0031',customerRef:'RY-GW-01',siteId:'S-RY',location:'MDB room, panel IT-01',status:'online',warranty:'active',warrantyEnd:'2027-10-01',installDate:'2024-09-25',installYear:2024},
  {id:'AST-SPR-001',customerCode:'CUS-00128',name:'Cartridge Seal & Impeller Kit',category:'Spare Part',brand:'Grundfos Genuine Parts',model:'CR64 Overhaul Kit',serial:'KIT-CR64-250501-0021',customerRef:'SP-CR64-KIT',siteId:'S-RY',location:'Spare Parts Store Room, Shelf A-03',status:'running',warranty:'active',warrantyEnd:'2027-05-10',installDate:'2025-05-10',installYear:2025},
  {id:'AST-SPR-002',customerCode:'CUS-00128',name:'Process Valve Sleeve & Gasket Kit',category:'Spare Part',brand:'XOMOX Genuine Parts',model:'Series 150 DN100 Kit',serial:'KIT-XM150-241112-0044',customerRef:'SP-VLV-KIT-01',siteId:'S-RY',location:'Spare Parts Store Room, Shelf B-12',status:'operating',warranty:'expired',warrantyEnd:'2025-01-01',installDate:'2023-01-01',installYear:2023},
  {id:'AST-OTH-001',customerCode:'CUS-00128',name:'Precision Laser Alignment & Verification System',category:'Other',brand:'Fixturlaser',model:'SE-Verify Pro X',serial:'FX-VPX-241105-0012',customerRef:'TOOL-ALGN-01',siteId:'S-RY',location:'Maintenance Workshop, Calibration Cabinet 1',status:'running',warranty:'active',warrantyEnd:'2027-11-15',installDate:'2024-11-15',nextPM:'2026-11-15',installYear:2024},
  {id:'AST-OTH-002',customerCode:'CUS-00128',name:'Electrical Power Quality & Feeder Meter',category:'Other',brand:'SE Metering',model:'PM-330 Verify',serial:'SE-PM330-240915-0203',customerRef:'RY-MDB-METER',siteId:'S-RY',location:'MDB room, incoming feeder 1',status:'online',warranty:'active',warrantyEnd:'2026-10-01',installDate:'2024-09-25',installYear:2024},
  {id:'AST-OTH-003',customerCode:'CUS-00128',name:'Electromagnetic Flow Verification Unit',category:'Other',brand:'KROHNE',model:'Demo MAG DN150 Verify',serial:'KR-MAG-230501-0092',customerRef:'CB-FLW-01',siteId:'S-CB',location:'Chilled water plant, main supply line',status:'operating',warranty:'expiring',warrantyEnd:'2026-09-01',installDate:'2023-08-25',installYear:2023},
  {id:'AST-PMP-101',customerCode:'CUS-00241',name:'Horizontal Split-Case Intake Pump',category:'Pump',brand:'Ebara',model:'CSA Demo 90 kW',serial:'EB-CSA90-220310-0056',customerRef:'CS-RAW-01',siteId:'S-CS',location:'Raw water intake, pump bay 1',status:'running',warranty:'active',warrantyEnd:'2027-06-15',installDate:'2024-06-01',nextPM:'2026-12-09',installYear:2024},
  {id:'AST-PMP-102',customerCode:'CUS-00241',name:'Heavy-Duty Submersible Sewage Pump',category:'Pump',brand:'Tsurumi',model:'C Demo 22 kW',serial:'TS-C22-210715-0388',customerRef:'CS-SEW-02',siteId:'S-CS',location:'Wet well 2, duty/standby pair',status:'maintenance',warranty:'expiring',warrantyEnd:'2026-09-15',installDate:'2023-09-01',nextPM:'2026-07-28',installYear:2023},
  {id:'AST-MIX-101',customerCode:'CUS-00241',name:'Flocculation Slow-Speed Tank Agitator',category:'Mixer',brand:'SiamEast Mixing',model:'FL-200 Agitator',serial:'SE-FL200-240510-0015',customerRef:'CS-MIX-01',siteId:'S-CS',location:'Clarifier Basin 1, Flocculation Section',status:'running',warranty:'active',warrantyEnd:'2027-06-01',installDate:'2024-05-20',nextPM:'2026-11-30',installYear:2024},
  {id:'AST-SRV-101',customerCode:'CUS-00241',name:'Central Pumping Station SCADA & Control Cabinet',category:'Service',brand:'SE Industrial Intelligence',model:'SCADA-CP-600',serial:'SE-GW-250420-0088',customerRef:'CS-GW-01',siteId:'S-CS',location:'Control room, panel SCADA-02',status:'online',warranty:'active',warrantyEnd:'2028-05-01',installDate:'2025-04-20',installYear:2025},
  {id:'AST-SPR-101',customerCode:'CUS-00241',name:'Butterfly Valve Disc & Seat Replacement Kit',category:'Spare Part',brand:'XOMOX Genuine Parts',model:'Demo BF DN600 Kit',serial:'KIT-BF600-240810-0005',customerRef:'SP-BF-600-KIT',siteId:'S-MTP',location:'Central Parts Depot, Bay 6',status:'operating',warranty:'expired',warrantyEnd:'2024-06-01',installDate:'2022-05-15',installYear:2022},
  {id:'AST-OTH-101',customerCode:'CUS-00241',name:'Main Incoming Feeder Power Quality Meter',category:'Other',brand:'SE Metering',model:'PM-330 Demo',serial:'SE-PM330-250420-0290',customerRef:'MTP-MDB-METER',siteId:'S-MTP',location:'MDB room, pump feeder group',status:'online',warranty:'active',warrantyEnd:'2027-05-01',installDate:'2025-04-22',installYear:2025},
];
