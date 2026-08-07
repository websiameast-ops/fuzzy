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
