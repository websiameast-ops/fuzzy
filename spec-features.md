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
