import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import type { Lang } from '@/types';

export interface LanguageOption {
  code: Lang;
  label: string;
  codeLabel: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'th',
    label: 'ภาษาไทย',
    codeLabel: 'TH',
  },
  {
    code: 'en',
    label: 'English',
    codeLabel: 'EN',
  },
];

interface LanguageSelectorProps {
  className?: string;
  variant?: 'default' | 'pill' | 'header' | 'landing';
  onSelect?: () => void;
}

export function LanguageSelector({
  className = '',
  variant = 'default',
  onSelect,
}: LanguageSelectorProps) {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click and escape key
  useEffect(() => {
    if (!open) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleSelectLanguage = (newLang: Lang) => {
    setLang(newLang);
    setOpen(false);
    onSelect?.();
  };

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0]!;

  return (
    <div className={`se-lang-selector-wrap ${className}`} ref={dropdownRef}>
      <button
        type="button"
        className={`se-lang-btn ${variant} ${open ? 'is-active' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Current language: ${currentLang.label}. Click to choose language.`}
      >
        <Globe size={15} strokeWidth={1.9} className="se-lang-globe-icon" aria-hidden="true" />
        <span className="se-lang-code-text">{currentLang.codeLabel}</span>
        <ChevronDown
          size={12}
          strokeWidth={2}
          className={`se-lang-chevron ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="se-lang-dropdown-menu" role="listbox" aria-label="Available languages">
          <div className="se-lang-menu-header">
            <span>{lang === 'th' ? 'เลือกภาษา' : 'Select Language'}</span>
          </div>
          <div className="se-lang-menu-list">
            {SUPPORTED_LANGUAGES.map((item) => {
              const isSelected = item.code === lang;
              return (
                <button
                  key={item.code}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`se-lang-menu-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectLanguage(item.code)}
                >
                  <span className="se-lang-native-name">{item.label}</span>
                  {isSelected && (
                    <Check
                      size={15}
                      strokeWidth={2.5}
                      className="se-lang-check-icon"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
