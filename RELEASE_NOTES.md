# 🚀 Release Notes

## v2.2.0-preview — UI/UX sync with SE Connex portal

**วันที่:** 11 พฤศจิกายน 2026

* ปรับ Frontend ทั้งหมด (`src/`) ให้เหมือนโปรเจกต์ `se-connex` ทุกไฟล์: global/landing/equipment-portal CSS, layout (Sidebar, TopHeader, MobileBottomNav), ทุกหน้า และ component
* ปิดหน้า IoT Monitoring และ Sign-off และซ่อนเมนู Digital Twin / Carbon / Materials / Parts จาก sidebar เหมือนต้นฉบับ
* เพิ่มหน้า Forgot password / Verify email / Reset password
* ไม่มี backend: `src/lib/apiClient.ts` เป็น mock client (ชื่อฟังก์ชันและ type เหมือนต้นฉบับ) อ่านข้อมูลจาก `src/data/mockApi.ts` และ `src/data/mockUnits.ts`
* บัญชีทดลอง `demo@seconnex.co.th` / `demo123`
* เพิ่ม dependency: react-leaflet, leaflet.markercluster, dompurify, jspdf, html2canvas
* ลบไฟล์ legacy ที่ไม่ได้ใช้ (`App.jsx`, `main.jsx`, `styles.css`, `pages/equipment - Copy/` ฯลฯ)

---

# 🚀 Release Notes: SE-CONNEX Equipment Portal & Asset Management Update (v2.1.0-preview)

**Version:** `v2.1.0-preview`  
**Module:** Equipment Portal (`/portal/equipment`) & Asset List (`/portal/equipment/list`)  
**Date:** 31 สิงหาคม 2026  

---

## 🌟 ภาพรวมการอัปเดต (Key Highlights)

การอัปเดตรอบนี้มุ่งเน้นการปรับปรุงประสบการณ์การใช้งาน (UX/UI) ของระบบจัดการอุปกรณ์และหมวดหมู่สินค้า (**Equipment Portal & Asset Management**) ให้มีความเป็นมืออาชีพ สวยงาม กระชับ สะอาดตา และสอดคล้องกับมาตรฐาน Dashboard ระดับสากล (TailAdmin & Modern Enterprise Design)

---

## 📦 รายละเอียดการเปลี่ยนแปลง (Changelog)

### 1. 🗂️ หน้าหมวดหมู่สินค้า (Category Portal — `/portal/equipment`)
* **TailAdmin Integrated Control Bar**:
  * ปรับโฉมแถบควบคุมด้านบนใหม่ทั้งหมดตามสไตล์ **TailAdmin Free Dashboard** (สูง 38px เท่ากันทุกองค์ประกอบ ขอบมนกระชับ `border-radius: 6px/8px`)
  * ผสานการใช้งาน **Font Awesome 6 Free CDN** ร่วมกับไอคอนระบบ (แว่นขยายค้นหา, ปักหมุดไซต์งาน, ไอคอนหมุนรีเซ็ตตัวกรอง, และเลเยอร์กลุ่มข้อมูล)
  * แก้ไขการจัดวางไอคอนค้นหา ไม่ให้ทับข้อความ/Placeholder
  * ปรับสไตล์แท็บตัวกรองสถานะ (`All`, `Operational`, `Needs Attention`, `Warranty Alert`) และแถบสรุปจำนวนรวมเป็นสไตล์ **Human Enterprise UI** (ตัดความโค้งมนแบบ Bubble Pills ออก แสดงตัวเลขวงเล็บคมชัด อ่านง่าย)
* **Telemetry Ribbon (การ์ดสถิติด้านบน)**:
  * นำแถบขีดพลังสีเขียว (Progress Bar) ออกจากการ์ด **Operating Active** เพื่อให้ขนาดและสัดส่วนตัวเลขกลมกลืนเป็นมาตรฐานเดียวกับทั้ง 4 การ์ด
* **Category Card Redesign**:
  * ปรับโครงสร้างภายใน Body Card เป็น **2 คอลัมน์สมดุล**:
    * **ฝั่งซ้าย (Operation)**: แสดงสัดส่วนเครื่องที่ทำงานอยู่แบบตัวเลขชัดเจนโดดเด่น (เช่น `3/3`, `45/48`) พร้อมเส้นขีดคั่นสีเทาจางๆ ฝั่งขวา
    * **ฝั่งขวา (Warranty)**: แสดงสถานะการรับประกันด้วยจุดวงกลมสีมาตรฐาน (🟢 ครอบคลุมประกัน / 🟠 ประกันใกล้หมด / 🔴 หมดประกัน)
  * นำแท็กประเภทสินค้า (Types) และแถบสะสมพลังใต้ภาพออกตามความต้องการ

---

### 2. 📋 หน้ารายการอุปกรณ์ (Equipment List — `/portal/equipment/list`)
* **Clean Table-First Layout**:
  * นำปุ่ม *Category Portal* ด้านบนและปุ่มสลับมุมมอง (*eq-view-seg*) ออก เข้าหน้าหนี้แสดงเป็น **ตารางรายการอุปกรณ์ (Table View)** โดยตรงทันที
* **Dedicated Purchase Date Column**:
  * เพิ่มคอลัมน์ใหม่ **`PURCHASE DATE / วันที่ซื้อ`**:
    * **บรรทัดที่ 1**: วันที่ซื้ออุปกรณ์ (เช่น `1 Aug 2024` / `1 ส.ค. 2024`)
    * **บรรทัดที่ 2**: คำนวณจำนวนวันรวมทั้งหมดตั้งแต่ซื้อจนถึงปัจจุบัน (เช่น `รวม 703 วัน` โดยไม่มีปีกำกับ)
* **Enhanced Warranty Display**:
  * ปรับปรุงการแสดงผลในคอลัมน์ **`WARRANTY / การรับประกัน`** ให้มีความชัดเจน ไม่วางวันที่ลอยๆ โดยแสดงสถานะ Badge ควบคู่กับวันที่กำกับชัดเจน เช่น `หมดอายุ: 1 ต.ค. 2027` หรือ `Expires: 1 Oct 2027`

---

### 3. 🔍 หน้ารายละเอียดอุปกรณ์ (Asset Detail — `/portal/equipment/:assetId`)
* เพิ่มข้อมูล **วันที่ซื้อ (Purchase Date)** และ **ระยะเวลาครอบครองรวมทั้งหมด (Total Days)** ในส่วน Header Detail Box (`ac-rows`) และแท็บข้อมูลสำคัญ (Key Information)

---

## 🛠️ รายการไฟล์ที่มีการแก้ไข (Modified Files)

| ไฟล์ | รายละเอียดการแก้ไข |
|---|---|
| [`index.html`](file:///d:/laragon/www/se-connex-r1-f1-1/index.html) | ติดตั้ง Font Awesome 6.5.2 CDN |
| [`src/types/index.ts`](file:///d:/laragon/www/se-connex-r1-f1-1/src/types/index.ts) | เพิ่มฟิลด์ `purchaseDate?: string` ใน `Asset` interface |
| [`src/pages/equipment/CategoryPortalCard.tsx`](file:///d:/laragon/www/se-connex-r1-f1-1/src/pages/equipment/CategoryPortalCard.tsx) | ปรับ Card Body เป็น 2 คอลัมน์ (Fraction Operation + Status Dots Warranty) |
| [`src/pages/equipment/EquipmentPortalPage.tsx`](file:///d:/laragon/www/se-connex-r1-f1-1/src/pages/equipment/EquipmentPortalPage.tsx) | อัปเดต TailAdmin Toolbar, Tab Filter, Telemetry Ribbon |
| [`src/pages/equipment/EquipmentPage.tsx`](file:///d:/laragon/www/se-connex-r1-f1-1/src/pages/equipment/EquipmentPage.tsx) | ปรับ Table Layout, เพิ่มคอลัมน์ Purchase Date, ปรับ Warranty Column |
| [`src/pages/equipment/AssetDetailPage.tsx`](file:///d:/laragon/www/se-connex-r1-f1-1/src/pages/equipment/AssetDetailPage.tsx) | เพิ่มวันที่ซื้อและจำนวนวันรวมใน Detail Header & Overview |
| [`src/styles/equipment-portal.css`](file:///d:/laragon/www/se-connex-r1-f1-1/src/styles/equipment-portal.css) | สไตล์ชีท TailAdmin Control Bar & Dark/Light Mode Responsive |

---

## ✅ การทดสอบและตรวจสอบ (Quality Assurance)
- **TypeScript Check**: `npx tsc --noEmit` ผ่าน 100% (0 errors, 0 warnings)
- **Production Build**: `npm run build` ผ่านการ Compile และ Bundle ด้วย Vite สำเร็จเรียบร้อย
