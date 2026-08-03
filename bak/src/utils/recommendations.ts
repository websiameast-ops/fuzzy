import type { Asset } from '@/types';

export interface Recommendation {
  en: string;
  th: string;
  tone: 'info' | 'amber' | 'red';
}

/**
 * Lightweight rule-based advisor over live telemetry. This mirrors the kind of guidance
 * an SE reliability engineer would give when reviewing the same readings — illustrative only.
 */
export function getAssetRecommendations(asset: Asset): Recommendation[] {
  const out: Recommendation[] = [];
  const iot = asset.iot;
  if (!iot) return out;

  const { meter, process, running, runtimeHrs } = iot;

  if (meter) {
    if (meter.powerFactor < 0.9) {
      out.push({
        en: `Power factor is ${meter.powerFactor.toFixed(2)}, below the 0.90 target — a capacitor bank or PF correction unit could cut reactive-power charges on this feeder.`,
        th: `ค่าตัวประกอบกำลังไฟฟ้าอยู่ที่ ${meter.powerFactor.toFixed(2)} ต่ำกว่าเป้าหมาย 0.90 — การติดตั้งคาปาซิเตอร์แบงก์หรือชุดปรับปรุง PF จะช่วยลดค่าไฟฟ้าจากพลังงานรีแอกทีฟของฟีดเดอร์นี้`,
        tone: 'amber',
      });
    }
    const phases = [meter.phases.l1, meter.phases.l2, meter.phases.l3];
    const maxA = Math.max(...phases.map((p) => p.currentA));
    const minA = Math.min(...phases.map((p) => p.currentA));
    const imbalance = maxA > 0 ? ((maxA - minA) / maxA) * 100 : 0;
    if (imbalance > 3) {
      out.push({
        en: `Phase current imbalance is ${imbalance.toFixed(1)}% (L1–L3) — worth checking for an uneven single-phase load or a loose termination.`,
        th: `ความไม่สมดุลของกระแสไฟฟ้าระหว่างเฟส (L1–L3) อยู่ที่ ${imbalance.toFixed(1)}% — ควรตรวจสอบโหลดเฟสเดียวที่ไม่สมดุลหรือจุดต่อสายที่หลวม`,
        tone: 'info',
      });
    }
  }

  if (process) {
    if (typeof process.temperatureC === 'number' && process.temperatureC >= 55) {
      out.push({
        en: `Bearing/casing temperature is ${process.temperatureC.toFixed(1)}°C — schedule a lubrication and bearing check before it trends higher.`,
        th: `อุณหภูมิแบริ่ง/ตัวเรือนอยู่ที่ ${process.temperatureC.toFixed(1)}°C — ควรวางแผนหล่อลื่นและตรวจแบริ่งก่อนอุณหภูมิจะสูงขึ้น`,
        tone: 'amber',
      });
    }
    if (running && typeof process.pressureBar === 'number' && process.pressureBar > 0 && process.pressureBar < 2.5) {
      out.push({
        en: `Discharge pressure is reading ${process.pressureBar.toFixed(1)} bar, lower than typical for this duty — check for a partially closed valve, worn impeller, or cavitation.`,
        th: `ความดันด้านจ่ายอยู่ที่ ${process.pressureBar.toFixed(1)} บาร์ ต่ำกว่าปกติสำหรับภาระงานนี้ — ควรตรวจสอบวาล์วที่ปิดไม่สุด ใบพัดสึก หรือภาวะคาวิเตชัน`,
        tone: 'amber',
      });
    }
    if (!running && asset.category === 'Pump') {
      out.push({
        en: 'Pump is currently stopped — confirm the standby unit is covering duty and expedite outstanding parts if this is unplanned downtime.',
        th: 'ปั๊มหยุดทำงานอยู่ในขณะนี้ — ยืนยันว่าปั๊มสำรองรับภาระงานแทน และเร่งอะไหล่ที่ค้างอยู่หากเป็นการหยุดที่ไม่ได้วางแผน',
        tone: 'red',
      });
    }
  }

  if (asset.category === 'Pump' && runtimeHrs > 25000) {
    out.push({
      en: `Cumulative runtime has passed ${runtimeHrs.toLocaleString('en-US')} hours — a major overhaul or bearing/seal replacement is typically due around this point.`,
      th: `ชั่วโมงทำงานสะสมเกิน ${runtimeHrs.toLocaleString('en-US')} ชั่วโมงแล้ว — ปกติควรพิจารณาซ่อมใหญ่หรือเปลี่ยนแบริ่ง/ซีลในช่วงนี้`,
      tone: 'info',
    });
  }

  const activeAlarms = iot.alarms.filter((a) => a.active);
  if (activeAlarms.some((a) => a.severity === 'critical')) {
    out.push({
      en: 'A critical alarm is active on this device — this takes priority over any efficiency recommendations below.',
      th: 'มีสัญญาณเตือนร้ายแรงที่ยังมีผลบนอุปกรณ์นี้ — ควรจัดการเรื่องนี้ก่อนข้อเสนอแนะด้านประสิทธิภาพอื่น ๆ',
      tone: 'red',
    });
  }

  if (out.length === 0) {
    out.push({
      en: 'Readings are within normal operating parameters — no action needed right now.',
      th: 'ค่าที่วัดได้อยู่ในเกณฑ์ปกติ — ยังไม่ต้องดำเนินการใด ๆ ในขณะนี้',
      tone: 'info',
    });
  }

  return out;
}
