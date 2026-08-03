import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, Star, Download, QrCode, Camera, Phone, Mail, MessageCircle } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import type { Tone } from '@/utils/status';

/* ---------------- Logo ---------------- */
const BASE = import.meta.env.BASE_URL;
const LOGO_SOURCES = [
  `${BASE}assets/se-connex-logo.svg`,
  `${BASE}assets/se-connex-logo.png`,
  `${BASE}se-connex-logo.svg`,
  `${BASE}se-connex-logo.png`,
];

export function Logo({ height = 34 }: { height?: number }) {
  const [idx, setIdx] = useState(0);
  if (idx >= LOGO_SOURCES.length) {
    return (
      <span className="logo-placeholder" title="Place the official logo at public/assets/se-connex-logo.svg">
        SE Connex logo asset required
      </span>
    );
  }
  return (
    <img
      src={LOGO_SOURCES[idx]}
      alt="SE Connex"
      style={{ height, width: 'auto', display: 'block' }}
      onError={() => setIdx((i) => i + 1)}
    />
  );
}

/* ---------------- Status badge ---------------- */
export function StatusBadge({ label, tone, dot = true }: { label: string; tone: Tone; dot?: boolean }) {
  return (
    <span className={`badge t-${tone}`}>
      {dot && <span className="b-dot" aria-hidden />}
      {label}
    </span>
  );
}

/* ---------------- KPI card ---------------- */
export function KpiCard({
  icon,
  value,
  label,
  sub,
  to,
  tone = 'brand',
}: {
  icon: ReactNode;
  value: string | number;
  label: string;
  sub?: string;
  to: string;
  tone?: string;
}) {
  return (
    <Link to={to} className={`kpi-card kpi-${tone}`}>
      <div className="kpi-icon" aria-hidden>
        {icon}
      </div>
      <div>
        <div className="kpi-value">{value}</div>
        <div className="kpi-label">{label}</div>
        {sub && <div className="kpi-sub">{sub}</div>}
      </div>
    </Link>
  );
}

/* ---------------- Empty state ---------------- */
export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      {icon && <div className="es-icon" aria-hidden>{icon}</div>}
      <h3>{title}</h3>
      {body && <p className="muted">{body}</p>}
      {action}
    </div>
  );
}

/* ---------------- Modal ---------------- */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  large = false,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  large?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div className={`modal ${large ? 'modal-lg' : ''}`} role="dialog" aria-modal="true" ref={ref}>
        <div className="modal-header">
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------------- Search box ---------------- */
export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="search-box">
      <Search size={16} aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </label>
  );
}

/* ---------------- Stars ---------------- */
export function Stars({
  value,
  onChange,
  size = 26,
  readOnly = false,
  label,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readOnly?: boolean;
  label?: string;
}) {
  return (
    <div className="stars" role={readOnly ? 'img' : 'radiogroup'} aria-label={label ?? 'Rating'}>
      {[1, 2, 3, 4, 5].map((n) =>
        readOnly ? (
          <Star key={n} size={size} className={n <= value ? 'on' : ''} aria-hidden />
        ) : (
          <button
            key={n}
            type="button"
            className="star-btn"
            role="radio"
            aria-checked={n === value}
            aria-label={`${n} of 5`}
            onClick={() => onChange?.(n)}
          >
            <Star size={size} className={n <= value ? 'on' : ''} />
          </button>
        ),
      )}
    </div>
  );
}

/* ---------------- Switch ---------------- */
export function Switch({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (c: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label className="switch">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
      />
      <span className="track" aria-hidden />
    </label>
  );
}

/* ---------------- Export button (mock) ---------------- */
export function ExportButton({ label }: { label?: string }) {
  const { t } = useLang();
  const { showToast } = useToast();
  return (
    <button
      className="btn btn-outline btn-sm"
      onClick={() => showToast(t('Export started — the file will appear in your downloads (demo).', 'เริ่มส่งออกแล้ว — ไฟล์จะปรากฏในดาวน์โหลด (เดโม)'), 'info')}
    >
      <Download size={15} aria-hidden />
      {label ?? t('Export', 'ส่งออก')}
    </button>
  );
}

/* ---------------- QR scanner mock ---------------- */
export function QRScannerMock({
  open,
  onClose,
  onResult,
}: {
  open: boolean;
  onClose: () => void;
  onResult: (assetId: string) => void;
}) {
  const { t } = useLang();
  const [scanning, setScanning] = useState(false);
  useEffect(() => {
    if (!open) setScanning(false);
  }, [open]);
  useEffect(() => {
    if (!scanning) return;
    const timer = window.setTimeout(() => {
      onResult('AST-PMP-001');
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [scanning, onResult]);

  return (
    <Modal open={open} onClose={onClose} title={t('Scan equipment QR code', 'สแกน QR โค้ดอุปกรณ์')}>
      <div className="qr-scan-area">
        <div className={`qr-frame ${scanning ? 'scanning' : ''}`} aria-hidden>
          <QrCode size={64} strokeWidth={1} />
        </div>
        <p className="muted small" style={{ textAlign: 'center' }}>
          {scanning
            ? t('Scanning… hold the code inside the frame.', 'กำลังสแกน… ถือโค้ดให้อยู่ในกรอบ')
            : t(
                'In the real portal this opens the camera. In this demo, pressing the button simulates scanning the QR label on the Rayong utility pump.',
                'ในระบบจริงจะเปิดกล้อง สำหรับเดโมนี้ ปุ่มด้านล่างจะจำลองการสแกนป้าย QR ของปั๊มยูทิลิตี้ที่ระยอง',
              )}
        </p>
        {!scanning && (
          <button className="btn btn-primary btn-block" onClick={() => setScanning(true)}>
            <Camera size={16} aria-hidden />
            {t('Simulate scan', 'จำลองการสแกน')}
          </button>
        )}
      </div>
    </Modal>
  );
}

/* ---------------- Image upload mock ---------------- */
export function ImageUploadMock({
  files,
  onChange,
}: {
  files: string[];
  onChange: (files: string[]) => void;
}) {
  const { t } = useLang();
  const seq = useRef(1);
  return (
    <div>
      <div className="upload-grid">
        {files.map((f) => (
          <div key={f} className="upload-thumb">
            <Camera size={20} aria-hidden />
            <span className="small">{f}</span>
            <button
              type="button"
              className="icon-btn tiny"
              aria-label={t(`Remove ${f}`, `ลบ ${f}`)}
              onClick={() => onChange(files.filter((x) => x !== f))}
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {files.length < 5 && (
          <button
            type="button"
            className="upload-add"
            onClick={() => {
              onChange([...files, `photo-${String(seq.current++).padStart(2, '0')}.jpg`]);
            }}
          >
            <Camera size={20} aria-hidden />
            <span className="small">{t('Add photo (demo)', 'เพิ่มรูป (เดโม)')}</span>
          </button>
        )}
      </div>
      <p className="muted small">{t('Up to 5 photos. In this prototype, photos are simulated placeholders.', 'สูงสุด 5 รูป — ในต้นแบบนี้เป็นรูปจำลอง')}</p>
    </div>
  );
}

/* ---------------- SE contact card ---------------- */
export function ContactSECard({
  name,
  role,
  phone,
  email,
  line,
}: {
  name: string;
  role: string;
  phone: string;
  email: string;
  line?: string;
}) {
  return (
    <div className="contact-card">
      <div className="avatar" aria-hidden>
        {name
          .split(' ')
          .map((p) => p[0])
          .slice(0, 2)
          .join('')}
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="fw-600">{name}</div>
        <div className="muted small">{role}</div>
        <div className="contact-links">
          <a href={`tel:${phone.replace(/\s/g, '')}`} className="chip" aria-label={`Call ${name}`}>
            <Phone size={13} aria-hidden /> {phone}
          </a>
          <a href={`mailto:${email}`} className="chip" aria-label={`Email ${name}`}>
            <Mail size={13} aria-hidden /> {email}
          </a>
          {line && (
            <span className="chip" aria-label={`LINE ${line}`}>
              <MessageCircle size={13} aria-hidden /> {line}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Signature pad ---------------- */
export function SignaturePadMock({ onChange }: { onChange: (hasInk: boolean) => void }) {
  const { t } = useLang();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const inked = useRef(false);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const p = pos(e);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111827';
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    if (!inked.current) {
      inked.current = true;
      onChange(true);
    }
  };

  const end = () => {
    drawing.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    inked.current = false;
    onChange(false);
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        className="signature-canvas"
        width={520}
        height={160}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        aria-label={t('Signature area — draw your signature', 'พื้นที่ลายเซ็น — วาดลายเซ็นของคุณ')}
      />
      <div className="flex between" style={{ marginTop: 8 }}>
        <span className="muted small">{t('Draw with mouse or finger (demo e-signature).', 'วาดด้วยเมาส์หรือนิ้ว (ลายเซ็นอิเล็กทรอนิกส์จำลอง)')}</span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={clear}>
          {t('Clear', 'ล้าง')}
        </button>
      </div>
    </div>
  );
}
