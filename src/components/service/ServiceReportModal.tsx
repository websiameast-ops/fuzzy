import { useEffect, useState } from 'react';
import { Activity, Camera, Download, Wrench } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { Modal } from '@/components/common';
import { fmtDate } from '@/utils/format';
import {
  apiGetTicketReport,
  type ServiceReportPhaseResponse,
  type ServiceReportPhotoResponse,
  type ServiceReportReadingResponse,
  type ServiceReportResponse,
} from '@/lib/apiClient';
import { tokenStore } from '@/lib/tokenStore';

/** Cycled by phase index — one solid color per phase header bar, matching
 * the reference report layout (SEAssetManagement's JobReportPage). */
const PHASE_COLORS = ['#2563eb', '#0d9488', '#d97706', '#7c3aed', '#e11d48'];

/** Swaps every <img> under `root` to a same-origin data: URI (fetched as a
 * blob) and returns a restore function. html2canvas's `useCORS` fetches its
 * own copy for canvas drawing, but that still silently no-ops (blank tile,
 * no error) on some Chrome/asset-host combinations — pre-inlining sidesteps
 * canvas tainting entirely, and doubles as the "wait for images" step since
 * every swap is awaited before capture starts. */
async function inlineImagesAsDataUrls(root: HTMLElement): Promise<() => void> {
  const imgs = Array.from(root.querySelectorAll('img'));
  const originalSrcs = imgs.map((img) => img.src);
  await Promise.all(
    imgs.map(async (img) => {
      try {
        // Cache-buster is required, not cosmetic: the <img> tag already
        // loaded this exact URL in the browser's default (no-cors) mode, and
        // fetch()-ing the same URL hits that cache entry and fails CORS
        // validation with a bare "TypeError: Failed to fetch" — a fresh,
        // distinctly-keyed request sidesteps the tainted cache entirely.
        const bustUrl = img.src + (img.src.includes('?') ? '&' : '?') + '_pdf=' + Date.now();
        const blob = await (await fetch(bustUrl, { cache: 'no-store' })).blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });
        img.src = dataUrl;
      } catch (e) {
        // Leave the original URL — html2canvas will just skip this one tile.
        console.error('[pdf-img-fail]', img.src, e);
      }
    }),
  );
  return () => imgs.forEach((img, i) => { img.src = originalSrcs[i]; });
}

const PDF_PAGE_W_MM = 210; // A4
const PDF_PAGE_H_MM = 297;
const PDF_MARGIN_MM = 10;
const PDF_UNIT_GAP_MM = 5;
const PDF_USABLE_W_MM = PDF_PAGE_W_MM - PDF_MARGIN_MM * 2;
const PDF_USABLE_H_MM = PDF_PAGE_H_MM - PDF_MARGIN_MM * 2;

/** Places one already-rendered canvas onto `doc`, advancing `cursor.y`.
 *
 * html2pdf.js's automatic page-slicing (tried first) cuts a single tall
 * screenshot into fixed-height bands: its "avoid split" logic can shift
 * *where* a band starts, but doesn't shrink the *previous* band to match,
 * so a phase header that didn't fit got drawn once (cut off) at the bottom
 * of one page and again (whole) at the top of the next — a visible
 * duplicate/cut, not just a rough edge.
 *
 * Rendering each report section as its own standalone canvas sidesteps
 * that class of bug entirely: a unit that fits goes on the current page,
 * one that doesn't starts a fresh page, and only a unit taller than a full
 * page ever gets sliced — and only within its own pixel space, never at a
 * boundary shared with another element. */
function placeUnitCanvas(doc: import('jspdf').jsPDF, canvas: HTMLCanvasElement, cursor: { y: number }): void {
  const pxPerMm = canvas.width / PDF_USABLE_W_MM;
  const unitHeightMm = canvas.height / pxPerMm;

  if (unitHeightMm <= PDF_USABLE_H_MM) {
    if (cursor.y + unitHeightMm > PDF_PAGE_H_MM - PDF_MARGIN_MM) {
      doc.addPage();
      cursor.y = PDF_MARGIN_MM;
    }
    doc.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', PDF_MARGIN_MM, cursor.y, PDF_USABLE_W_MM, unitHeightMm);
    cursor.y += unitHeightMm + PDF_UNIT_GAP_MM;
    return;
  }

  // Taller than one page (e.g. a phase with many photos): start it fresh at
  // the top of a page, then slice within its own canvas only.
  doc.addPage();
  const pageHeightPx = PDF_USABLE_H_MM * pxPerMm;
  let renderedPx = 0;
  let firstSlice = true;
  while (renderedPx < canvas.height) {
    const sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedPx);
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = sliceHeightPx;
    sliceCanvas.getContext('2d')!.drawImage(canvas, 0, renderedPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);
    if (!firstSlice) doc.addPage();
    doc.addImage(sliceCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', PDF_MARGIN_MM, PDF_MARGIN_MM, PDF_USABLE_W_MM, sliceHeightPx / pxPerMm);
    renderedPx += sliceHeightPx;
    firstSlice = false;
  }
  // Force the next unit onto a new page rather than guessing leftover space.
  cursor.y = PDF_PAGE_H_MM;
}

/** Renders the report modal's DOM straight to a PDF file and saves it — no
 * browser print preview/dialog in between. Each top-level block inside
 * `.modal-body` (job info, each phase, resolution, …) is screenshotted as
 * its own canvas via html2canvas and placed as a whole unit by
 * placeUnitCanvas — see that function for why, not html2pdf.js's built-in
 * slicing, does the pagination. Thai text renders fine since it's a
 * screenshot, not native PDF text — no font embedding needed. */
async function exportReportPdf(ticketNo: string): Promise<void> {
  const modalEl = document.querySelector<HTMLElement>('.report-print-modal');
  const bodyEl = modalEl?.querySelector<HTMLElement>('.modal-body');
  if (!modalEl || !bodyEl) return;

  // The on-screen modal caps height and scrolls internally (.modal-body {
  // overflow-y: auto }) — lift that temporarily so each unit renders at its
  // full natural size instead of whatever's currently scrolled into view.
  const prevModalMaxHeight = modalEl.style.maxHeight;
  const prevBodyOverflow = bodyEl.style.overflow;
  const prevBodyMaxHeight = bodyEl.style.maxHeight;
  modalEl.style.maxHeight = 'none';
  bodyEl.style.overflow = 'visible';
  bodyEl.style.maxHeight = 'none';

  const restoreImages = await inlineImagesAsDataUrls(modalEl);

  try {
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const cursor = { y: PDF_MARGIN_MM };

    const headerEl = modalEl.querySelector<HTMLElement>('.modal-header');
    const units = [headerEl, ...Array.from(bodyEl.children)].filter((el): el is HTMLElement => !!el);
    for (const unit of units) {
      const canvas = await html2canvas(unit, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        // Only relevant for .modal-header — drop the ✕ close button.
        ignoreElements: (el) => el.classList.contains('icon-btn'),
      });
      if (canvas.width === 0 || canvas.height === 0) continue; // e.g. a collapsed/empty node
      placeUnitCanvas(doc, canvas, cursor);
    }
    doc.save(`service-report-${ticketNo}.pdf`);
  } finally {
    restoreImages();
    modalEl.style.maxHeight = prevModalMaxHeight;
    bodyEl.style.overflow = prevBodyOverflow;
    bodyEl.style.maxHeight = prevBodyMaxHeight;
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 18 }}>
      <h4 style={{ margin: '0 0 6px', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--se-text-muted)' }}>
        {title}
      </h4>
      {children}
    </section>
  );
}

function ReadingGrid({ readings, lang }: { readings: ServiceReportReadingResponse[]; lang: 'th' | 'en' }) {
  if (readings.length === 0) return null;
  return (
    <div className="reading-grid">
      {readings.map((rd) => (
        <div className="reading-tile" key={rd.itemId}>
          <span className="reading-tile-label">{lang === 'th' ? rd.labelTh : rd.labelEn ?? rd.labelTh}</span>
          <span className="reading-tile-value">
            {rd.value != null ? `${rd.value}${rd.unit ? ` ${rd.unit}` : ''}` : rd.valueText ?? '—'}
          </span>
        </div>
      ))}
    </div>
  );
}

function PhotoGrid({ photos }: { photos: ServiceReportPhotoResponse[] }) {
  if (photos.length === 0) {
    return <p className="muted small" style={{ margin: 0 }}>—</p>;
  }
  return (
    <div className="photo-caption-grid">
      {photos.map((p, i) => (
        <div className="photo-caption-tile" key={p.attachmentId}>
          <a href={p.url} target="_blank" rel="noreferrer" className="upload-thumb" title={p.fileName}>
            <img src={p.url} alt={p.fileName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </a>
          <div className="photo-caption">{i + 1}. {p.labelTh ?? p.fileName}</div>
        </div>
      ))}
    </div>
  );
}

const PHASE_STATUS_LABEL: Record<string, [string, string]> = {
  done: ['Done', 'เสร็จ'],
  in_progress: ['In progress', 'กำลังดำเนินการ'],
  pending: ['Pending', 'รอดำเนินการ'],
};

/** One numbered, colored phase block — header bar (badge + name + status
 * pill) over its photos (numbered captions) and data readings (boxed grid).
 * exportReportPdf's `pagebreak: { avoid: '.phase-block' }` keeps a whole
 * phase together, pushing it onto a fresh PDF page whenever it doesn't fit
 * the remaining space — this gives the reference report's clear per-phase
 * split without a forced break-before, which cut headers mid-way when the
 * canvas slice landed a few px off the CSS break point. */
function PhaseBlock({ phase, index, lang, t }: {
  phase: ServiceReportPhaseResponse;
  index: number;
  lang: 'th' | 'en';
  t: (en: string, th: string) => string;
}) {
  const color = PHASE_COLORS[index % PHASE_COLORS.length];
  const statusLabel = phase.status ? PHASE_STATUS_LABEL[phase.status] : undefined;
  return (
    <div className="phase-block">
      <div className="phase-header" style={{ background: color }}>
        <span className="phase-badge" style={{ color }}>{index + 1}</span>
        <div className="phase-titles">
          <div className="phase-name">{lang === 'th' ? phase.nameTh : phase.nameEn ?? phase.nameTh}</div>
          {phase.nameEn && <div className="phase-subtitle">{lang === 'th' ? phase.nameEn : phase.nameTh}</div>}
        </div>
        {statusLabel && <span className="phase-pill">{t(...statusLabel)}</span>}
      </div>
      <div className="phase-body">
        <div className="phase-subheader">
          <Camera size={13} aria-hidden />
          {t('Photos', 'ถ่ายรูป')} ({phase.photos.length})
        </div>
        <PhotoGrid photos={phase.photos} />
        {phase.readings.length > 0 && (
          <>
            <div className="phase-subheader">
              <Activity size={13} aria-hidden />
              {t('Data', 'บันทึกค่า')} ({phase.readings.length})
            </div>
            <ReadingGrid readings={phase.readings} lang={lang} />
          </>
        )}
      </div>
    </div>
  );
}

export function ServiceReportModal({ ticketNo, open, onClose }: { ticketNo: string | null; open: boolean; onClose: () => void }) {
  const { lang, t } = useLang();
  const { showToast } = useToast();
  const [report, setReport] = useState<ServiceReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!open || !ticketNo) {
      setReport(null);
      return;
    }
    const accessToken = tokenStore.read()?.accessToken;
    if (!accessToken) return;
    setLoading(true);
    setError(false);
    apiGetTicketReport(accessToken, ticketNo)
      .then((r) => {
        setReport(r);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [open, ticketNo]);

  if (!open) return null;

  if (loading || !report) {
    return (
      <Modal open={open} onClose={onClose} large title={t('Service report', 'รายงานบริการ')}>
        {error ? (
          <p className="muted">{t('Could not load this report.', 'ไม่สามารถโหลดรายงานนี้ได้')}</p>
        ) : (
          <p className="muted">{t('Loading…', 'กำลังโหลด…')}</p>
        )}
      </Modal>
    );
  }

  const r = report;

  return (
    <Modal
      open={open}
      onClose={onClose}
      large
      className="report-print-modal"
      title={
        <span className="flex" style={{ gap: 10, flexWrap: 'wrap' }}>
          {t('Service report', 'รายงานบริการ')} {r.ticketNo}
        </span>
      }
      footer={
        <>
          <button
            className="btn btn-outline"
            disabled={exporting}
            onClick={async () => {
              setExporting(true);
              try {
                await exportReportPdf(r.ticketNo);
              } catch {
                showToast(t('Could not generate the PDF.', 'สร้างไฟล์ PDF ไม่สำเร็จ'), 'error');
              } finally {
                setExporting(false);
              }
            }}
          >
            <Download size={16} aria-hidden />
            {exporting ? t('Generating…', 'กำลังสร้างไฟล์…') : t('Download PDF', 'ดาวน์โหลด PDF')}
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            {t('Close', 'ปิด')}
          </button>
        </>
      }
    >
      <Section title={t('Job information', 'ข้อมูลงาน')}>
        <div className="grid-2" style={{ gap: 4 }}>
          <div className="stat-line"><span className="k">{t('Job number', 'เลขที่งาน')}</span><span className="v">{r.jobNo ?? '—'}</span></div>
          <div className="stat-line"><span className="k">{t('Service date', 'วันที่ให้บริการ')}</span><span className="v">{r.startedAt ? fmtDate(r.startedAt, lang) : '—'}</span></div>
          <div className="stat-line"><span className="k">{t('Customer', 'ลูกค้า')}</span><span className="v">{r.customerName ?? '—'}</span></div>
          <div className="stat-line"><span className="k">{t('Site', 'ไซต์งาน')}</span><span className="v">{r.site ?? '—'}</span></div>
          <div className="stat-line">
            <span className="k">{t('Equipment', 'อุปกรณ์')}</span>
            <span className="v">{r.assetCode}{r.serialNo ? ` (${r.serialNo})` : ''}</span>
          </div>
          <div className="stat-line"><span className="k">{t('Service type', 'ประเภทงาน')}</span><span className="v">{r.type}</span></div>
        </div>
      </Section>

      <Section title={t('Reported problem', 'ปัญหาที่แจ้ง')}>
        <p style={{ margin: 0 }}>{r.description || '—'}</p>
      </Section>

      <Section title={t('Root cause', 'สาเหตุ')}>
        <p style={{ margin: 0 }}>{r.rootCause || '—'}</p>
      </Section>

      <Section title={t('Work summary', 'สรุปงานที่ดำเนินการ')}>
        <p style={{ margin: 0 }}>{r.workSummary || '—'}</p>
      </Section>

      <Section title={t('Notes', 'บันทึกงาน')}>
        {r.notes.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>{t('No notes were logged on this job.', 'งานนี้ไม่มีบันทึกเพิ่มเติม')}</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {r.notes.map((n, i) => (
              <li key={i} style={{ marginBottom: 4 }}>{n}</li>
            ))}
          </ul>
        )}
      </Section>

      {r.phases.map((phase, i) => (
        <PhaseBlock key={phase.phaseId} phase={phase} index={i} lang={lang} t={t} />
      ))}

      <Section title={t('Resolution', 'การแก้ไข')}>
        <p style={{ margin: 0 }}>{r.resolution || '—'}</p>
      </Section>

      <Section title={t('Engineer', 'ช่างผู้รับผิดชอบ')}>
        <div className="flex" style={{ gap: 8 }}>
          <Wrench size={15} aria-hidden className="muted" />
          <span>{r.engineerName ?? '—'}</span>
        </div>
      </Section>

      <Section title={t('Customer signature', 'ลายเซ็นลูกค้า')}>
        {r.signatureUrl ? (
          <img
            src={r.signatureUrl}
            alt={t('Customer signature', 'ลายเซ็นลูกค้า')}
            className="signature-display"
          />
        ) : (
          <div className="signature-placeholder">
            {t('No signature on file yet.', 'ยังไม่มีลายเซ็น')}
          </div>
        )}
      </Section>
    </Modal>
  );
}
