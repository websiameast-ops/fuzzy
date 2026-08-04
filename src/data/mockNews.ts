import type { NewsArticle } from '@/types';

export const mockNews: NewsArticle[] = [
  {
    id: 'NW-2026-018',
    category: 'tips',
    title: '5 early warning signs your pump bearing is failing',
    titleTh: '5 สัญญาณเตือนแบริ่งปั๊มใกล้เสียหาย',
    summary:
      'Bearing failures rarely happen without notice. Learn the five signals — vibration, noise, temperature, lubricant condition and current draw — that your maintenance team can catch weeks before a breakdown.',
    date: '2026-07-08',
    readMins: 4,
    featured: true,
    imageUrl: '/assets/Hero_Banner_xn.png',
    content: [
      'Most rotating-equipment breakdowns give weeks of notice before they stop production. The problem is that the signals are easy to dismiss individually — a little more noise here, a slightly warmer housing there. Together, they tell a clear story.',
      '1. Rising vibration. A healthy pump has a stable vibration signature. When overall velocity trends upward — especially past 4.5 mm/s RMS on a mid-size pump — bearing wear is the most common cause. Envelope analysis can identify the exact defect frequency long before it is audible.',
      '2. A change in sound. Operators know their machines. A new hum, growl or periodic click at the drive end is worth logging with a date, load condition and location. This context makes an engineer’s diagnosis dramatically faster.',
      '3. Housing temperature. Bearing temperature that creeps 10°C above its normal running value at the same load usually means lubrication breakdown or increased friction. A monthly thermal photo takes seconds and builds a trend you can act on.',
      '4. Lubricant condition. Darkened, contaminated or leaking grease is a direct window into bearing health. If grease purges dark grey at the relief port, metal particles are likely present.',
      '5. Motor current. As friction increases, current draw at the same duty point rises. If your motor is on an SE monitoring gateway, this trend is captured automatically and can trigger an alert before failure.',
      'If you recognise two or more of these signs on any asset in this portal, open the equipment page and press “Report a problem”. An SE engineer can perform a vibration survey and give you a repair window that fits your production plan — instead of the breakdown choosing the time for you.',
    ],
  },
  {
    id: 'NW-2026-016',
    category: 'promotions',
    title: 'Mid-year PM package: 15% off multi-asset preventive maintenance',
    titleTh: 'โปรโมชั่นกลางปี: ส่วนลด 15% แพ็กเกจ PM หลายอุปกรณ์',
    summary:
      'Book a preventive-maintenance package covering three or more assets before 31 August 2026 and receive 15% off labour, plus a free vibration baseline for every rotating asset in the package.',
    date: '2026-07-01',
    readMins: 2,
    imageUrl: '/assets/Hero_Banner_xn.png',
    content: [
      'From now until 31 August 2026, SE customers can book a preventive-maintenance package covering three or more assets at a 15% labour discount.',
      'Every rotating asset included in the package also receives a complimentary vibration baseline measurement — the single most valuable data point for future condition monitoring.',
      'The offer applies to pumps, valves, instrumentation and solar assets registered in SE Connex, and can be combined with an existing MA contract as an expansion.',
      'To request a quotation, open Requests → New request and select “Preventive maintenance request”, or contact your account manager directly from the dashboard.',
    ],
  },
  {
    id: 'NW-2026-014',
    category: 'products',
    title: 'SE monitoring gateway V2: edge alarms and LINE OA push',
    titleTh: 'เกตเวย์มอนิเตอริ่ง V2: แจ้งเตือนที่อุปกรณ์และ push ผ่าน LINE OA',
    summary:
      'The next generation of the SE industrial monitoring gateway adds on-device alarm logic, faster sampling and direct push notifications to LINE OA — so your team hears about an abnormal condition in seconds.',
    date: '2026-06-18',
    readMins: 3,
    imageUrl: '/assets/Hero_Banner_xn.png',
    content: [
      'SE Industrial Intelligence has released version 2 of its monitoring gateway, now available for new installations and as an upgrade for existing V1 customers.',
      'The headline change is edge alarm logic: limits and rate-of-change rules now run on the gateway itself, cutting alarm latency from minutes to seconds even when the uplink is congested.',
      'Sampling has been increased to one-second resolution for critical tags, with smart compression so data costs stay flat. A built-in store-and-forward buffer covers up to 14 days of connectivity loss.',
      'Notifications can now be pushed directly to LINE OA, in addition to in-app and email alerts already available in SE Connex. Alert routing follows the notification preferences you set in this portal.',
      'Customers with an active Equipment Monitoring contract can request a free upgrade assessment from the Energy & IoT tab of any connected asset.',
    ],
  },
  {
    id: 'NW-2026-012',
    category: 'sustainability',
    title: 'From kWh to carbon: how SE reports avoided emissions',
    titleTh: 'จาก kWh สู่คาร์บอน: SE รายงานการลดการปล่อยอย่างไร',
    summary:
      'A transparent look at the methodology behind the Energy & Carbon page: what is measured, what is estimated, and what it takes to turn energy savings into a verifiable carbon claim.',
    date: '2026-06-02',
    readMins: 5,
    imageUrl: '/assets/Hero_Banner_xn.png',
    content: [
      'The Energy & Carbon page in SE Connex summarises the energy your connected assets consume and estimates the emissions avoided through solar generation and efficiency work. This article explains exactly how those numbers are produced.',
      'Measured values come from revenue-grade meters and inverter telemetry collected by SE gateways. These carry the “Measured” label and are the strongest basis for any claim.',
      'Estimated values fill the gaps where metering is not yet installed. They combine nameplate data, runtime and typical load profiles. These carry the “Estimated” label and should be treated as indicative.',
      'Avoided CO₂ is calculated by applying the current Thailand grid emission factor to measured solar generation and verified efficiency savings against a documented baseline.',
      'Importantly, none of these figures constitute carbon credits. Formal credit issuance requires an approved methodology, a verified baseline, third-party validation and registration with a recognised program. SE can support customers through that journey — talk to our Energy & Sustainability team to scope a verification-ready project.',
    ],
  },
  {
    id: 'NW-2026-009',
    category: 'company',
    title: 'SiamEast Solutions opens expanded Rayong service centre',
    titleTh: 'สยามอีสท์ โซลูชั่น เปิดศูนย์บริการระยองส่วนขยาย',
    summary:
      'A larger workshop, dedicated pump test bay and expanded parts inventory bring faster turnaround for customers across the Eastern Seaboard.',
    date: '2026-05-20',
    readMins: 3,
    imageUrl: '/assets/Hero_Banner_xn.png',
    content: [
      'SiamEast Solutions PCL has opened its expanded service centre in Rayong, tripling workshop floor space and adding a dedicated pump performance test bay rated to 400 m³/h.',
      'The expansion shortens overhaul turnaround for pumps and valves serving customers across the Eastern Seaboard industrial area, and increases on-hand inventory of high-rotation spare parts.',
      'The centre also houses the new SE Industrial Intelligence lab, where monitoring gateways are staged and configured before field installation.',
      'Customers are welcome to visit — contact your account manager to arrange a workshop tour.',
    ],
  },
  {
    id: 'NW-2026-007',
    category: 'tips',
    title: 'Preparing your site for a PM visit: a 15-minute checklist',
    titleTh: 'เตรียมหน้างานก่อนวัน PM: เช็กลิสต์ 15 นาที',
    summary:
      'PM visits go faster and safer when the site is ready. This short checklist — access, isolation, safety, representative — is the same one built into the PM Schedule page.',
    date: '2026-04-22',
    readMins: 3,
    imageUrl: '/assets/Hero_Banner_xn.png',
    content: [
      'A well-prepared site can cut an hour or more from a preventive-maintenance visit. Fifteen minutes of preparation the day before is usually all it takes.',
      'Access: confirm gate passes and contractor registration for the SE team, and reserve parking near the equipment where possible.',
      'Isolation: check that the equipment can be shut down or switched to standby in the agreed window, and that lock-out/tag-out points are accessible.',
      'Safety: review any permit-to-work requirements — hot work, confined space, working at height — and have permits ready for signature at arrival.',
      'Representative: name one person who can answer operational questions and witness the work. Their sign-off in SE Connex closes the job without paperwork.',
      'You will find this same checklist attached to every upcoming visit on the PM Schedule page, so you can tick items off as you go.',
    ],
  },
  {
    id: 'NW-2026-021',
    category: 'promotions',
    title: 'Vibration baseline week: free survey with any spare-parts order',
    titleTh: 'สัปดาห์วัดค่าฐานการสั่นสะเทือน: สำรวจฟรีเมื่อสั่งอะไหล่',
    summary:
      'Book any spare-parts order in August and add a complimentary vibration baseline survey (worth ฿6,500) for the same asset — the data that makes future condition monitoring possible.',
    date: '2026-07-15',
    readMins: 2,
    imageUrl: '/assets/Hero_Banner_xn.png',
    content: [
      'Throughout August 2026, every spare-parts order placed through SE Connex qualifies for a free vibration baseline survey on the asset being serviced — normally ฿6,500.',
      'A baseline captured while a machine is healthy is the reference every future measurement is compared against. Without it, condition monitoring starts blind.',
      'To claim, open Parts & Orders, request a quote, and note “baseline” in the cost-center field. Your coordinator will schedule the survey alongside the parts fitting.',
    ],
  },
  {
    id: 'NW-2026-020',
    category: 'promotions',
    title: 'VMI onboarding offer: three months of managed stock, no service fee',
    titleTh: 'ข้อเสนอเริ่มต้น VMI: บริหารสต็อก 3 เดือน ไม่มีค่าบริการ',
    summary:
      'Switch a consumables line to Vendor-Managed Inventory before 30 September and SE waives the management fee for the first three months, including automatic reorder points.',
    date: '2026-07-11',
    readMins: 2,
    imageUrl: '/assets/Hero_Banner_xn.png',
    content: [
      'Vendor-Managed Inventory keeps your critical consumables above their reorder point automatically, so a production line never waits on a ฿300 seal kit.',
      'Onboard any consumables line before 30 September 2026 and SE waives the VMI management fee for the first three months, including reorder-point setup and monthly stock reporting.',
      'You can see how VMI works today under Materials & Consumables → VMI / CMI Stock, where auto-reorder is already switchable per line.',
    ],
  },
  {
    id: 'NW-2026-019',
    category: 'promotions',
    title: 'Monitoring gateway trade-in: 25% off the V2 edge device',
    titleTh: 'เทิร์นเกตเวย์มอนิเตอริ่ง: ลด 25% สำหรับรุ่น V2',
    summary:
      'Trade in any first-generation monitoring gateway and receive 25% off the SE V2 edge device, with on-device alarms and LINE push notifications included.',
    date: '2026-07-04',
    readMins: 2,
    imageUrl: '/assets/Hero_Banner_xn.png',
    content: [
      'The SE monitoring gateway V2 moves alarm logic onto the device itself, so a critical trip reaches your team in seconds rather than waiting on a cloud round-trip.',
      'Until 30 September 2026, trade in any first-generation SE gateway for 25% off the V2 unit. LINE push notifications and faster sampling are included at no extra charge.',
      'Ask your account manager for a per-site quote, or open Requests → New request and select “Monitoring / IoT”.',
    ],
  },
  {
    id: 'NW-2026-017',
    category: 'promotions',
    title: 'Loyalty rewards: earn service credits on every completed job',
    titleTh: 'สิทธิพิเศษสมาชิก: รับเครดิตบริการทุกงานที่เสร็จ',
    summary:
      'SE Connex customers now earn 2% service credit on every completed and signed-off job this quarter — redeemable against future PM packages or parts.',
    date: '2026-06-25',
    readMins: 2,
    imageUrl: '/assets/Hero_Banner_xn.png',
    content: [
      'From Q3 2026, every job you complete and sign off in SE Connex earns 2% of its value back as service credit.',
      'Credits accrue automatically once you approve a service report, and can be redeemed against future PM packages, spare parts or monitoring subscriptions.',
      'Your running balance will appear on the dashboard — signing off promptly is all it takes to start earning.',
    ],
  },
];

export function getArticle(id: string): NewsArticle | undefined {
  return mockNews.find((n) => n.id === id);
}