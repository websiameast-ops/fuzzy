/** Seed articles for the mock news feed (see mockApi.ts::newsFeed). */
export interface NewsArticle {
  id: string;
  category: 'company' | 'products' | 'promotions' | 'sustainability' | 'tips' | string;
  title: string;
  titleTh: string;
  summary: string;
  date: string;
  readMins: number;
  featured?: boolean;
  imageUrl?: string;
  content: string[];
}

export const mockNews: NewsArticle[] = [
  // 1. Featured Hero Article (Products - Kimberly-Clark Sustainable Solutions)
  {
    id: 'NW-2026-024',
    category: 'products',
    title: 'Build a Greener Workplace with Sustainable Solutions',
    titleTh: 'สร้างสถานที่ทำงานที่เป็นมิตรต่อสิ่งแวดล้อมด้วยโซลูชันเพื่อความยั่งยืน',
    summary:
      'Sustainability is no longer an option—it is a key priority for organizations striving to achieve their ESG (Environmental, Social & Governance) goals...',
    date: '2026-08-11',
    readMins: 3,
    featured: true,
    imageUrl: '/assets/news/prd-05.jpg',
    content: [
      'Sustainability is no longer an option—it is a key priority for organizations striving to achieve their ESG (Environmental, Social & Governance) goals and build resilient industrial operations.',
      'Through our strategic partnership with Kimberly-Clark Professional, SiamEast Solutions brings industrial customers leading wiping, sanitation, and protective solutions under WypAll, Kimtech, Kimwipes, and WetTask brands.',
      'These engineered solutions reduce consumable waste by up to 25%, lower VOC emissions, and support corporate decarbonization targets across automotive, electronics, food processing, and chemical sectors.',
      'Contact our industrial solutions team to conduct a site waste-audit and start your green workplace journey.',
    ],
  },

  // 2. Grundfos Industrial Pump Solutions (Products - Main Article in Detail Page)
  {
    id: 'NW-2026-025',
    category: 'products',
    title: 'Grundfos: World-Class Pump Solutions for Industrial Applications',
    titleTh: 'Grundfos: โซลูชันปั๊มอุตสาหกรรมมาตรฐานระดับโลก',
    summary:
      'Grundfos is a global leader in the design, manufacture, and supply of high-quality pumping solutions for a wide range of industrial applications. Renowned for durability, reliability, and energy efficiency, Grundfos is committed to developing innovative solutions that meet the diverse demands of water and fluid management systems.',
    date: '2026-08-06',
    readMins: 4,
    featured: true,
    imageUrl: '/assets/news/prd-01.jpg',
    content: [
      'Grundfos is a global leader in the design, manufacture, and supply of high-quality pumping solutions for a wide range of industrial applications. Renowned for durability, reliability, and energy efficiency, Grundfos is committed to developing innovative solutions that meet the diverse demands of water and fluid management systems.',
      'Why Choose Grundfos for Industrial Applications?',
      'Built for Long-Term Performance: Grundfos pumps are engineered with advanced technology and durable materials to withstand demanding industrial operating conditions and deliver reliable performance over the long term.',
      'Energy-Efficient Operation: Equipped with Variable Frequency Drives (VFDs) and high-efficiency motors, Grundfos pumping systems help optimize energy consumption and reduce operating costs.',
      'Comprehensive Industrial Solutions: Grundfos offers products designed for a broad range of industries, including: Food & Beverage, Wastewater Treatment, Heating and Cooling Systems, Chemical Processing and Fluid Handling.',
      'Smart Monitoring with IoT: Grundfos CONNECT and Grundfos iSOLUTIONS enable real-time pump monitoring, diagnostics, and control through intelligent IoT-based technologies, helping improve operational efficiency and predictive maintenance.',
      'Grundfos Product Range: Centrifugal Pumps, Multistage Pumps, Dosing Pumps, Wastewater Pumps.',
      'Grundfos: A Smart Investment for Sustainable Industry: Choosing Grundfos means investing in more than just reliable pumping equipment. It means improving operational efficiency, reducing energy costs, and supporting long-term sustainability goals. Contact our team to learn more about the right pumping solution for your business.',
      'Learn more:\nhttps://siameastsolutions.com/en/our-products/pumping/grundfos-3/',
      'Contact Us:\nTel: 063-393-5088 | Line: @siameast | Email: info@siameastsolutions.com',
    ],
  },

  // 3. Knowledge: HDPE to PP-R
  {
    id: 'NW-2026-026',
    category: 'tips',
    title: 'FROM HDPE TO PP-R | UPGRADE YOUR PIPING SYSTEM FOR...',
    titleTh: 'จาก HDPE สู่ PP-R | อัปเกรดระบบท่อของคุณเพื่อประสิทธิภาพสูงสุด',
    summary:
      'Choosing the right piping material can significantly reduce installation time, prevent corrosion, and increase operating lifespan under high-temperature demands...',
    date: '2026-08-10',
    readMins: 3,
    featured: false,
    imageUrl: '/assets/news/knw-04.jpg',
    content: [
      'Industrial piping systems face aggressive chemical environments, thermal expansion, and pressure surges. Upgrading from conventional HDPE to PP-R (Polypropylene Random Copolymer) provides superior heat deflection and long-term chemical resistance.',
      'Key engineering advantages include smooth internal surfaces that lower pumping head losses, homogeneous fusion joints with zero leak points, and corrosion immunity against industrial cooling chemicals.',
    ],
  },

  // 4. Knowledge: Water pump care
  {
    id: 'NW-2026-027',
    category: 'tips',
    title: 'HOW TO TAKE CARE OF YOUR HOME WATER PUMP FOR...',
    titleTh: 'วิธีดูแลรักษาปั๊มน้ำบ้านเพื่ออายุการใช้งานที่ยาวนาน',
    summary:
      'Your water pump is the "heart" of your water system. Regular inspection and simple preventive steps keep it running quietly and reliably...',
    date: '2026-08-10',
    readMins: 3,
    featured: false,
    imageUrl: '/assets/news/knw-02.jpg',
    content: [
      'Maintaining reliable water delivery requires simple periodic checks. Inspect mechanical seals for weeping, monitor suction line air leaks, and verify pressure switch cut-in and cut-out calibrations.',
      'SE service engineers recommend annual pressure-tank bladder checks to avoid motor short-cycling and premature stator burnout.',
    ],
  },

  // 5. Knowledge: Why choose Grundfos genuine parts
  {
    id: 'NW-2026-028',
    category: 'tips',
    title: 'WHY CHOOSE GRUNDFOS GENUINE PARTS?',
    titleTh: 'ทำไมต้องเลือกใช้อะไหล่แท้ Grundfos?',
    summary:
      'Because "close enough" isn\'t enough — genuine parts ensure exact hydraulic tolerances, motor protection, and valid manufacturer warranty...',
    date: '2026-08-10',
    readMins: 3,
    featured: false,
    imageUrl: '/assets/news/knw-03.jpg',
    content: [
      'Imitation impellers and seals often deviate by tenths of a millimetre, causing severe hydraulic cavitation, shaft deflection, and bearing overload.',
      'SiamEast Solutions is an authorized Grundfos master distributor supplying factory-certified impellers, silicon-carbide mechanical seals, and shaft kits with full serial traceability.',
    ],
  },

  // 6. Knowledge / Featured: Threadlockers
  {
    id: 'NW-2026-029',
    category: 'tips',
    title: 'How to Choose the Right Threadlocker? Understanding...',
    titleTh: 'วิธีเลือกใช้น้ำยาล็อคเกลียวให้ถูกต้องสำหรับการใช้งานอุตสาหกรรม',
    summary:
      'Selecting the correct threadlocker for your fasteners prevents loosening under heavy vibration, stops thread corrosion, and ensures safe disassembly...',
    date: '2026-08-07',
    readMins: 3,
    featured: true,
    imageUrl: '/assets/news/prd-06.jpg',
    content: [
      'Anaerobic threadlockers cure in the absence of air between active metal surfaces. Low-strength formulations suit adjustment screws and small gauges (under M6), medium-strength blue threadlockers secure machine bolts removable with hand tools, while high-strength red adhesives lock permanent studs.',
      'Applying the correct viscosity and surface primer ensures 100% thread engagement without loosening under thermal cycles.',
    ],
  },

  // 7. Services: SE Overhaul Service
  {
    id: 'NW-2026-030',
    category: 'service',
    title: 'SE OVERHAUL SERVICE – EXTEND EQUIPMENT LIFE, REDUCE DOWNTIME',
    titleTh: 'บริการโอเวอร์ฮอล SE – ยืดอายุการใช้งานอุปกรณ์ ลดการหยุดชะงัก',
    summary:
      'A pump that is still running does not necessarily mean it is operating at its best. Comprehensive overhaul restores original factory performance.',
    date: '2026-08-06',
    readMins: 3,
    featured: true,
    imageUrl: '/assets/news/prd-02.jpg',
    content: [
      'Degraded internal clearances reduce hydraulic efficiency by up to 18% before visible failure occurs. The SE Overhaul Service includes dynamic balancing, sandblasting, protective polymer recoating, and certified hydrostatic testing at our Rayong service centre.',
    ],
  },

  // 8. Promotions: August Flash Sale
  {
    id: 'NW-2026-031',
    category: 'promotions',
    title: 'AUGUST FLASH SALE – SAVE UP TO 50%!',
    titleTh: 'โปรโมชั่น Flash Sale เดือนสิงหาคม – ลดสูงสุด 50%!',
    summary:
      'Special discounts on high-rotation spare parts, seal kits, and maintenance consumables throughout this month only.',
    date: '2026-08-01',
    readMins: 2,
    featured: true,
    imageUrl: '/assets/news/pro-01.jpg',
    content: [
      'Throughout August 2026, registered SE Connex customers receive exclusive volume rebates and up to 50% discount on selected mechanical seals, gaskets, and maintenance chemicals.',
    ],
  },

  // 9. Services: Solar Rooftop
  {
    id: 'NW-2026-032',
    category: 'service',
    title: 'SE SOLAR ROOFTOP SOLUTIONS | TURN SOLAR...',
    titleTh: 'โซลูชันโซลาร์รูฟท็อป SE | เปลี่ยนพลังงานแสงอาทิตย์เป็นความคุ้มค่า',
    summary:
      'SE Solar Rooftop Solutions on YouTube. Reduce electricity costs, improve ESG ratings, and optimize clean industrial energy with turnkey EPC.',
    date: '2026-08-05',
    readMins: 2,
    imageUrl: '/assets/news/prd-03.jpg',
    content: [
      'Turn rooftop real estate into clean electricity with SiamEast Solutions full EPC service — from structural load auditing and BOI filing to tier-1 PV inverter commissioning and zero-export grid connection.',
    ],
  },

  // 10. Services: Save Energy Boost
  {
    id: 'NW-2026-033',
    category: 'service',
    title: 'SAVE ENERGY. REDUCE COSTS. WITH BOOST ENERGY...',
    titleTh: 'ประหยัดพลังงาน ลดต้นทุน ด้วยโซลูชัน Boost Energy',
    summary:
      'Your pumping system could be consuming more energy than necessary — without proper optimization, oversized pumps waste thousands each month.',
    date: '2026-08-04',
    readMins: 2,
    imageUrl: '/assets/Hero_Banner_xn.png',
    content: [
      'Our Boost Energy audit identifies throttling losses, oversized impellers, and inefficient duty cycles, delivering typical electricity savings of 20–35% with less than 18 months payback.',
    ],
  },

  // 11. Services: Fire pump test
  {
    id: 'NW-2026-034',
    category: 'service',
    title: 'FIRE PUMP PERFORMANCE TEST | VERIFY PERFORMANCE...',
    titleTh: 'ทดสอบประสิทธิภาพปั๊มดับเพลิง | ตรวจสอบความพร้อมใช้งาน',
    summary:
      'Having a Fire Pump does not necessarily mean your system is fully prepared for an emergency. Annual NFPA-compliant flow testing proves readiness.',
    date: '2026-08-03',
    readMins: 3,
    imageUrl: '/assets/Hero_Banner_xn(4).png',
    content: [
      'SE field engineers conduct NFPA 25 flow and churn testing using calibrated pitot arrays and ultrasonic flowmeters, providing certified performance curves for plant insurance underwriters.',
    ],
  },
];

export function getArticle(id: string): NewsArticle | undefined {
  return mockNews.find((n) => n.id === id);
}
