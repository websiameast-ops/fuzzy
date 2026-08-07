# SE Connex — System Specification (R1-F1) - Overall

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

## 9. สิ่งที่ยังไม่ได้ build (Out of Scope)

| รายการ | หมายเหตุ |
|---|---|\
| Shell B — Connected Ops (`/ops`) | แยก app สำหรับ SE Staff — ไม่ใช่ส่วนขยายของ Portal |
| Energy & Carbon | Route มี, ซ่อนจาก nav |
| Materials & Consumables | Route มี, ซ่อนจาก nav |
| Parts & Orders | Route มี, ซ่อนจาก nav |
| Backend / API | ทั้งหมดเป็น mock data |
| Real export/download | Toast confirmation เท่านั้น |
| Persistent session | หมดเมื่อ refresh |
| Real file upload | UI มี, ไม่ส่งไปไหน |
