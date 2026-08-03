import { useState } from 'react';

interface Props {
  phone: string;
  email: string;
}

export function ContactWidget({ phone, email }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="contact-floating-widget">
      {isOpen && (
        <div className="contact-widget-popover">
          <div className="popover-header">
            <h4>Contact SiamEast</h4>
            <button className="popover-close" onClick={() => setIsOpen(false)}>×</button>
          </div>
          <div className="popover-body">
            <a href={`tel:${phone}`} className="contact-item">
              <div className="contact-item-icon">📞</div>
              <div className="contact-item-info">
                <span className="contact-label">Call Support</span>
                <span className="contact-val">{phone}</span>
              </div>
            </a>
            <a href={`mailto:${email}`} className="contact-item">
              <div className="contact-item-icon">✉️</div>
              <div className="contact-item-info">
                <span className="contact-label">Email Us</span>
                <span className="contact-val">{email}</span>
              </div>
            </a>
          </div>
        </div>
      )}
      <button
        className={`contact-trigger-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Contact Us"
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        )}
      </button>
    </div>
  );
}
