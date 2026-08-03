import {
  Activity,
  Boxes,
  CalendarCheck,
  ClipboardList,
  FileSignature,
  FileText,
  History,
  LayoutDashboard,
  Leaf,
  MapPin,
  Newspaper,
  Package,
  UserCog,
  Wifi,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItemDef {
  to: string;
  en: string;
  th: string;
  icon: LucideIcon;
  end?: boolean;
  isNew?: boolean;
}

export const NAV_ITEMS: NavItemDef[] = [
  { to: '/portal', en: 'Dashboard', th: 'หน้าหลัก', icon: LayoutDashboard, end: true },
  { to: '/portal/news', en: 'News & Offers', th: 'ข่าวสารและข้อเสนอ', icon: Newspaper },
  { to: '/portal/equipment', en: 'My Equipment', th: 'อุปกรณ์ของฉัน', icon: Package },
  { to: '/portal/map', en: 'My Sites — Map', th: 'ไซต์ของฉัน — แผนที่', icon: MapPin },
  { to: '/portal/iot', en: 'Live Monitoring', th: 'มอนิเตอริ่งแบบเรียลไทม์', icon: Wifi },
  // { to: '/portal/digital-twin', en: 'Factory Digital Twin', th: 'ฝาแฝดดิจิทัลโรงงาน', icon: Activity },
  { to: '/portal/history', en: 'Service History', th: 'ประวัติการบริการ', icon: History },
  { to: '/portal/requests', en: 'Requests', th: 'คำขอบริการ', icon: ClipboardList },
  { to: '/portal/contracts', en: 'Contracts & MA', th: 'สัญญาและบริการ MA', icon: FileText },
  { to: '/portal/pm', en: 'PM Schedule', th: 'แผนบำรุงรักษา', icon: CalendarCheck },
  { to: '/portal/sign-off', en: 'Sign-off & Rating', th: 'ยืนยันงานและประเมินบริการ', icon: FileSignature },
  // { to: '/portal/carbon', en: 'Energy & Carbon', th: 'พลังงานและคาร์บอน', icon: Leaf },
  // { to: '/portal/materials', en: 'Materials & Consumables', th: 'วัสดุสิ้นเปลือง', icon: Boxes, isNew: true },
  // { to: '/portal/parts', en: 'Parts & Orders', th: 'อะไหล่และคำสั่งซื้อ', icon: Wrench, isNew: true },
  { to: '/portal/profile', en: 'Profile & Settings', th: 'โปรไฟล์และการตั้งค่า', icon: UserCog },
];

/** Breadcrumb / title metadata by path segment */
export function pageMeta(pathname: string): { en: string; th: string } {
  const map: [RegExp, { en: string; th: string }][] = [
    [/^\/portal\/news\/.+/, { en: 'Article', th: 'บทความ' }],
    [/^\/portal\/news/, { en: 'News & Offers', th: 'ข่าวสารและข้อเสนอ' }],
    [/^\/portal\/equipment\/.+/, { en: 'Equipment detail', th: 'รายละเอียดอุปกรณ์' }],
    [/^\/portal\/equipment/, { en: 'My Equipment', th: 'อุปกรณ์ของฉัน' }],
    [/^\/portal\/map\/.+/, { en: 'Site detail', th: 'รายละเอียดไซต์' }],
    [/^\/portal\/map/, { en: 'My Sites — Map', th: 'ไซต์ของฉัน — แผนที่' }],
    [/^\/portal\/iot/, { en: 'Live Monitoring', th: 'มอนิเตอริ่งแบบเรียลไทม์' }],
    [/^\/portal\/digital-twin/, { en: 'Factory Digital Twin', th: 'ฝาแฝดดิจิทัลโรงงาน' }],
    [/^\/portal\/history/, { en: 'Service History', th: 'ประวัติการบริการ' }],
    [/^\/portal\/requests\/new/, { en: 'New request', th: 'สร้างคำขอใหม่' }],
    [/^\/portal\/requests\/.+/, { en: 'Request detail', th: 'รายละเอียดคำขอ' }],
    [/^\/portal\/requests/, { en: 'Requests', th: 'คำขอบริการ' }],
    [/^\/portal\/contracts\/.+/, { en: 'Contract detail', th: 'รายละเอียดสัญญา' }],
    [/^\/portal\/contracts/, { en: 'Contracts & MA', th: 'สัญญาและบริการ MA' }],
    [/^\/portal\/pm/, { en: 'PM Schedule', th: 'แผนบำรุงรักษา' }],
    [/^\/portal\/sign-off\/.+/, { en: 'Sign-off', th: 'ยืนยันงาน' }],
    [/^\/portal\/sign-off/, { en: 'Sign-off & Rating', th: 'ยืนยันงานและประเมินบริการ' }],
    [/^\/portal\/carbon/, { en: 'Energy & Carbon', th: 'พลังงานและคาร์บอน' }],
    [/^\/portal\/materials/, { en: 'Materials & Consumables', th: 'วัสดุสิ้นเปลือง' }],
    [/^\/portal\/parts/, { en: 'Parts & Orders', th: 'อะไหล่และคำสั่งซื้อ' }],
    [/^\/portal\/profile\/users/, { en: 'User management', th: 'จัดการผู้ใช้งาน' }],
    [/^\/portal\/profile\/notifications/, { en: 'Notification preferences', th: 'การแจ้งเตือน' }],
    [/^\/portal\/profile/, { en: 'Profile & Settings', th: 'โปรไฟล์และการตั้งค่า' }],
    [/^\/portal/, { en: 'Dashboard', th: 'หน้าหลัก' }],
  ];
  for (const [re, meta] of map) if (re.test(pathname)) return meta;
  return { en: 'SE Connex', th: 'SE Connex' };
}
