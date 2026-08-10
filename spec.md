# SE Connex — System Specification (R1-F1)

> **Source:** se-connex-r1-f1-frontend.zip — React frontend prototype  
> **Date:** 2026-07-22 (last modified)  
> **Scope:** Shell A — Customer Portal only

---

## 1. ภาพรวมระบบ

| รายการ | รายละเอียด |
|---|---|
| ชื่อระบบ | SE Connex Customer Portal v2 Preview |
| Shell | Shell A — Customer Portal (`/portal`) |
| Stack | React 18 + TypeScript (strict) + Vite + react-router-dom + Recharts |
| State Management | React Context (session-scoped, ไม่ persist ข้าม refresh) |
| Data | Mock data ทั้งหมด — ไม่มี backend |
| Bilingual | EN / TH toggle ทั้งระบบ (ทุก label มี EN+TH) |
| Responsive | Desktop sidebar / Mobile bottom nav + FAB "Report" |
| Theme | Dark / Light mode (ThemeContext) |
| Reference date | 14 July 2026 (ใช้ใน mock data ทั้งหมด) |

---

## 2. Authentication

| รายการ | รายละเอียด |
|---|---|
| Method | Email + Password |
| Demo account | `demo@seconnex.co.th` / `demo123` |
| Session | React Context (หมดเมื่อ refresh) |
| Post-login | เลือก Company ก่อนเข้าระบบ |
| Multi-company | 1 user มีได้หลาย `customerCode` — สลับได้จาก top bar |
| Guard | `RequireAuth` wrapper — redirect ไป `/login` ถ้าไม่มี session |

---

## 3. โครงสร้างหน้า (Routes)

| Path | Page | สถานะ Nav |
|---|---|---|
| `/portal` | Dashboard | ✅ Active |
| `/portal/news` | News & Offers (list) | ✅ Active |
| `/portal/news/:id` | Article detail | ✅ Active |
| `/portal/equipment` | My Equipment (list) | ✅ Active |
| `/portal/equipment/:assetId` | Asset Detail | ✅ Active |
| `/portal/map` | My Sites — Map | ✅ Active |
| `/portal/map/:siteId` | Site Detail | ✅ Active |
| `/portal/iot` | Live Monitoring (IoT) | ✅ Active |
| `/portal/digital-twin` | Factory Digital Twin | 🚧 Hidden (route มี, ไม่อยู่ใน nav) |
| `/portal/history` | Service History | ✅ Active |
| `/portal/requests` | Requests (list) | ✅ Active |
| `/portal/requests/new` | New Request (wizard) | ✅ Active |
| `/portal/requests/:ticketNo` | Ticket Detail | ✅ Active |
| `/portal/contracts` | Contracts & MA (list) | ✅ Active |
| `/portal/contracts/:contractId` | Contract Detail | ✅ Active |
| `/portal/pm` | PM Schedule | ✅ Active |
| `/portal/sign-off` | Sign-off & Rating (list) | ✅ Active |
| `/portal/sign-off/:jobNo` | Sign-off Detail (8-step flow) | ✅ Active |
| `/portal/carbon` | Energy & Carbon | 🚧 Hidden |
| `/portal/materials` | Materials & Consumables | 🚧 Hidden |
| `/portal/parts` | Parts & Orders | 🚧 Hidden |
| `/portal/profile` | Profile & Settings | ✅ Active |
| `/portal/profile/users` | User Management | ✅ Active |
| `/portal/profile/notifications` | Notification Preferences | ✅ Active |

---

## 4. Data Model

### 4.1 Company & Site

```
Company
├── customerCode        string
├── name / nameTh       string (bilingual)
├── industry            string
├── sites[]             Site[]
├── accountManager      ContactPerson
└── serviceCoordinator  ContactPerson

Site
├── id                  string
├── name / nameTh       string (bilingual)

ContactPerson
├── name, role / roleTh
├── phone, email
└── line?               (optional)
```

### 4.2 Asset (Equipment)

```
Asset
├── id, customerCode, siteId
├── name, category, brand, model, serial, customerRef
├── location, division, supplier
├── status              OperatingStatus   running|online|operating|maintenance|stopped|offline
├── warranty            WarrantyStatus    active|expiring|expired|none
├── warrantyStart/End   date string
├── installDate, commissionDate, installYear
├── lastService, lastInspection, nextPM?
├── contractId?
├── connected           boolean (IoT-enabled)
├── condition           string
├── specs[]             { label, value }
├── documents[]         AssetDocument
│   └── type: datasheet|warranty|installation|commissioning|service|manual|contract
├── events[]            AssetTimelineEvent
│   └── type: sale|delivery|installation|commissioning|pm|cm|inspection|parts|condition
└── iot?                (optional — connected assets only)
    ├── online, lastComm
    ├── runtimeHrs, powerKw, energyMonthKwh
    ├── running?
    ├── alarms[]         AssetAlarm  { time, message, severity: critical|warning|info, active }
    ├── meter?           AssetMeterReading (3-phase smart meter)
    │   ├── phases: { l1, l2, l3 } × { voltageV, currentA }
    │   ├── activePowerKw, reactivePowerKvar, apparentPowerKva
    │   ├── powerFactor, frequencyHz
    └── process?         AssetProcessReading
        ├── pressureBar?, flowM3h?, temperatureC?
```

### 4.3 Service Request (Ticket)

```
ServiceRequest
├── ticketNo, customerCode, siteId, assetId?
├── title, category, description, condition?
├── priority            low|medium|high|urgent
├── status              RequestStatus (ดู flow ด้านล่าง)
├── created, updated
├── team, contactPerson, contactMethod?, preferredDate?
├── appointment?        { date, time, engineer }
├── timeline[]          TimelineStep  { date, label/labelTh, done, current? }
├── comments[]          RequestComment  { author, from: customer|se, date, text }
├── attachments[]       string[]
├── reportId?           link to ServiceRecord
└── signoffJobNo?       link to SignoffJob
```

**Status Flow:**
```
draft → submitted → reviewing → scheduled → assigned → in_progress
                                                           ↓
                                              waiting_parts | waiting_customer
                                                           ↓
                                              completed → closed
                                              (cancelled ได้ทุก step)
```

**SLA Targets (reference, ไม่ใช่ contractual):**

| Priority | Response | Resolution |
|---|---|---|
| Urgent | 4 hrs | 24 hrs |
| High | 8 hrs | 72 hrs |
| Medium | 24 hrs | 120 hrs |
| Low | 48 hrs | 240 hrs |

**SLA Status Labels:**

| Status | EN | TH | Color |
|---|---|---|---|
| ahead | Ahead of plan | เร็วกว่าแผน | Green |
| on_track | On track | เป็นไปตามแผน | Blue |
| delayed | Behind plan | ช้ากว่าแผน | Amber |
| completed_ahead | Completed ahead of plan | เสร็จเร็วกว่าแผน | Green |
| completed_on_time | Completed on plan | เสร็จตามแผน | Green |
| completed_delayed | Completed behind plan | เสร็จช้ากว่าแผน | Amber |

### 4.4 Contract

```
Contract
├── id, customerCode
├── type / typeTh       string (bilingual)
├── siteIds[], assetIds[]
├── start, end          date
├── visitsTotal, visitsUsed
├── status              active|expiring|expired|renewal
├── sla, responseTime   string
├── coverage[]          string[]
├── exclusions[]        string[]
├── documents[]         string[]
└── renewalStatus?      string
```

### 4.5 PM Visit

```
PMVisit
├── id, customerCode, siteId
├── date, time
├── assetIds[]
├── scope, team, contact
├── status              confirmed|unconfirmed|completed|reschedule_requested
├── reportId?
└── checklist[]         { label, done }
```

### 4.6 Sign-off Job & Rating

```
SignoffJob
├── jobNo, customerCode, assetId, siteId
├── completedDate, engineer
├── summary, reportId
├── ticketNo?
├── status              pending|signed
├── signedBy?, signedTitle?, signedDate?, signComment?
└── rating?             ServiceRating

ServiceRating
├── overall, speed, quality, communication
├── professionalism, cleanliness  (1–5 scale)
├── firstTimeFix        yes|partial|no
├── comments            string
└── allowContact        boolean
```

### 4.7 Service Record (History)

```
ServiceRecord
├── id, reportId, jobNo, customerCode
├── date, assetId, siteId
├── type, issue, work, engineer, result
├── approval            approved|pending|na
├── contractId?
└── report              ServiceReportDetail
    ├── reportedProblem, findings, rootCause
    ├── workPerformed[]
    ├── parts[]          { name, qty }
    ├── testResults, recommendations
    ├── beforePhotos[], afterPhotos[]
    └── acknowledgment
```

### 4.8 User & Roles

```
PortalUser
├── id, customerCode
├── name, email, phone, jobTitle
├── role                PortalRole (ดูด้านล่าง)
├── siteIds[]           (scope ต่อ site)
├── lastActive
└── status              active|disabled|invited
```

**Portal Roles:**
- `Company administrator`
- `Maintenance manager`
- `Engineer`
- `Procurement`
- `Finance`
- `Viewer`

### 4.9 Notifications

**8 Categories:**

| Category | คำอธิบาย |
|---|---|
| serviceUpdates | อัปเดตสถานะ ticket |
| appointmentReminders | แจ้งเตือนนัดช่าง |
| warrantyExpiry | ใกล้หมดประกัน |
| contractExpiry | ใกล้หมดสัญญา |
| pmConfirmation | ขอยืนยัน PM |
| signoffPending | รอ sign-off |
| equipmentAlarms | IoT alarm |
| newsPromotions | ข่าวสารและโปรโมชั่น |

**Channels ต่อ category:** `in-app / email / LINE / SMS`

### 4.10 Energy & Carbon (CarbonData)

```
CarbonData
├── customerCode
├── connectedAssets, totalAssets
├── monthlyKwh, savedKwh, co2AvoidedTons
├── coveragePct
├── bySite[]        { site, kwh, label: measured|estimated }
├── byCategory[]    { category, kwh }
├── trend[]         { month, kwh, baseline }
└── incompleteAssets[]  { assetId, name, issue }
```

---

## 5. Feature Specifications

### 5.1 Dashboard
- Summary cards: equipment, active requests, contracts, upcoming PM
- Quick-links ไปหน้าหลักทุกส่วน

### 5.2 My Equipment
- List + filter ตาม site / category / status / warranty
- Asset Detail page:
  - Specs, documents, service history timeline
  - IoT data (ถ้า `connected: true`)
  - CTA: "Report a problem" (pre-fill request form)

### 5.3 My Sites — Map
- Schematic view (ไม่ใช่ geographic map)
- Color-coded pins ตาม site health (running / maintenance / offline)
- Search box: ค้นหา equipment by type / code / location → jump to site
- Click pin → Site 360 summary via `?site=` query param
- Deep-link: shareable URL, back-button safe
- Link through ไป Site Detail page

### 5.4 Live Monitoring (IoT)
- Tabs ตาม device type
- **Smart meter panel:**
  - Per-phase: voltage (V), current (A)
  - Active (kW), Reactive (kVAR), Apparent (kVA) power
  - Power Factor, Frequency (Hz)
- **Pump panel:**
  - Pressure (bar), Flow (m³/h), Temperature (°C)
  - ON/OFF status, Running hours
- **Rule-based Recommendations** (ตาม reading):
  - Low PF → แนะนำ capacitor bank
  - High bearing temp → แนะนำ lubrication check
  - Phase imbalance → แนะนำ wiring check
- Alarm modal: deep-link `?alarm=` → one-click "Open a request about this"
- Per-device deep-link: `?device=`

### 5.5 Factory Digital Twin (Hidden)
- Summary อุปกรณ์ SE ในโรงงาน (solar, pumps, metering, monitoring)
- แบ่งตาม area/site และ product category
- Equipment-level detail + note เรื่อง overlap ของ metering/pump

### 5.6 Requests
- **List view:** filter ตาม status/priority, compact "vs plan" column
- **New Request (wizard):**
  - Multi-step form
  - Pre-fill ได้จาก asset หรือ alarm
  - แนบไฟล์, ระบุ preferred date, contact method
- **Ticket Detail:**
  - Timeline steps (อ่าน/เขียน comment)
  - **Timeline vs. Plan card:** target response + completion vs actual progress
  - SLA badge: ahead / on track / behind plan

### 5.7 Contracts & MA
- List + status badges (active / expiring / expired / renewal)
- Contract Detail: coverage, exclusions, documents, visit counter

### 5.8 PM Schedule
- ตาราง upcoming PM visits
- Actions: ยืนยัน / ขอเลื่อน / ดู checklist
- Link ไป service report หลัง PM complete

### 5.9 Sign-off & Rating
- **8-step flow:**
  1. Review job summary
  2. Review service report detail
  3. Review before/after photos
  4. Review parts used
  5. Review engineer notes
  6. Review checklist
  7. E-signature capture
  8. Rating (6 dimensions + firstTimeFix + comments)
- Sign-off persist session (status: pending → signed)

### 5.10 Profile & Settings
- **Profile:** แก้ข้อมูลส่วนตัว (ชื่อ, โทรศัพท์, ตำแหน่ง)
- **User Management** (`/profile/users`):
  - รายชื่อ users ของบริษัท
  - Invite / disable / edit role & site scope
- **Notification Preferences** (`/profile/notifications`):
  - Toggle แต่ละ category × แต่ละ channel (in-app / email / LINE / SMS)

---

## 6. Cross-link Loops

| จาก | ไปยัง |
|---|---|
| Asset → | New request (pre-filled ด้วย assetId) |
| Alarm → | Open request (pre-filled ด้วย alarm detail) |
| Site → | Equipment list ที่ site นั้น |
| Contract renewal → | New ticket |
| PM visit → | Service report |
| Completed job → | E-signature & rating flow |

---

## 7. Layout & Navigation

### Desktop
- Sidebar (fixed left): ทุก nav items + company selector
- Top header: breadcrumb, company switcher, language toggle, theme toggle, notification bell

### Mobile
- Collapsible overlay sidebar
- Bottom navigation bar (main sections)
- FAB "Report" (orange) — shortcut ไป New Request

---

## 8. Branding

| รายการ | รายละเอียด |
|---|---|
| Primary color | `#145DA0` (SE Connex Blue) |
| Accent color | `#F2871F` (Orange) — FAB, notification badge |
| Logo path | `public/assets/se-connex-logo.svg` (fallback: `.png`) |
| Logo swap | Drop file ที่ path เดิม — ไม่ต้องแก้ code |
| Favicon | —  |

---

## 9. สิ่งที่ยังไม่ได้ build (Out of Scope)

| รายการ | หมายเหตุ |
|---|---|
| Shell B — Connected Ops (`/ops`) | แยก app สำหรับ SE Staff — ไม่ใช่ส่วนขยายของ Portal |
| Energy & Carbon | Route มี, ซ่อนจาก nav |
| Materials & Consumables | Route มี, ซ่อนจาก nav |
| Parts & Orders | Route มี, ซ่อนจาก nav |
| Backend / API | ทั้งหมดเป็น mock data |
| Real export/download | Toast confirmation เท่านั้น |
| Persistent session | หมดเมื่อ refresh |
| Real file upload | UI มี, ไม่ส่งไปไหน |

---

## 10. สภาพแวดล้อม

```bash
# Dev
npm install
npm run dev        # http://localhost:5173

# Production build
npm run build
npm run preview
```

**Config files:** `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`
