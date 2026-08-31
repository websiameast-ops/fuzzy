import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';

export interface CategorySummary {
  category: string;
  categoryLabelTh: string;
  subCategories: string[];
  descriptionEn: string;
  descriptionTh: string;
  imageUrl: string;
  total: number;
  active: number;
  inactive: number;
  underWarranty: number;
  expiringSoon: number;
  expired: number;
}

interface CategoryPortalCardProps {
  data: CategorySummary;
  currentSite?: string;
  currentQ?: string;
}

export const CategoryPortalCard: React.FC<CategoryPortalCardProps> = ({
  data,
  currentSite,
  currentQ,
}) => {
  const { lang, t } = useLang();
  const navigate = useNavigate();

  const {
    category,
    categoryLabelTh,
    imageUrl,
    total,
    active,
    inactive,
    underWarranty,
    expiringSoon,
    expired,
  } = data;

  const handleExplore = (warrantyFilter?: string) => {
    const next = new URLSearchParams();
    next.set('category', category);
    if (currentSite) next.set('site', currentSite);
    if (currentQ) next.set('q', currentQ);
    if (warrantyFilter) next.set('warranty', warrantyFilter);
    navigate(`/portal/equipment/list?${next.toString()}`);
  };

  return (
    <div
      className="cat-portal-card"
      onClick={() => handleExplore()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleExplore();
        }
      }}
    >
      {/* 1. Category Top Image (16:10 with rounded corners, clean without floating pills) */}
      <div className="cat-card-media">
        <img
          src={imageUrl}
          alt={category}
          className="cat-card-img"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>

      {/* 2. Headline (24px) & Subheadline (16px) */}
      <div className="cat-card-header">
        <h2 className="cat-headline" title={category}>
          {category}
        </h2>
        <p className="cat-subheadline">
          {t(
            `${total} Total Units · ${categoryLabelTh || ''}`,
            `รวม ${total} เครื่อง · ${categoryLabelTh || ''}`
          )}
        </p>
      </div>

      {/* 3. Body Section (14px) - 2 Columns with Vertical Divider */}
      <div className="cat-card-body">
        <div className="cat-metrics-two-cols">
          {/* Column 1: Operation (Numbers Only, Large, with Divider) */}
          <div className="cat-metric-col-operation">
            <span className="cat-stat-heading">
              {t('Operation', 'การทำงาน')}
            </span>
            <div className="cat-operation-display">
              <span className="cat-operation-main-val">
                {active}/{total}
              </span>
            </div>
          </div>

          {/* Column 2: Warranty Status with Colored Dots */}
          <div className="cat-metric-col-warranty">
            <span className="cat-stat-heading">
              {t('Warranty', 'การรับประกัน')}
            </span>

            {/* Status 1: Under Warranty (Green Dot) */}
            <div
              className="cat-status-row cat-stat-clickable"
              onClick={(e) => {
                e.stopPropagation();
                handleExplore('active');
              }}
              title={t('View under warranty equipment', 'ดูอุปกรณ์ที่อยู่ในประกัน')}
            >
              <div className="cat-status-dot-label">
                <span className="cat-dot dot-green" />
                <span className="stat-label">{t('Under Warranty', 'ในประกัน')}</span>
              </div>
              <span className="stat-value val-green">{underWarranty}</span>
            </div>

            {/* Status 2: Expiring Soon (Orange Dot) */}
            <div
              className={`cat-status-row ${expiringSoon > 0 ? 'cat-stat-clickable' : ''}`}
              onClick={(e) => {
                if (expiringSoon > 0) {
                  e.stopPropagation();
                  handleExplore('expiring');
                }
              }}
              title={expiringSoon > 0 ? t('Filter expiring soon', 'กรองรายการใกล้หมดประกัน') : undefined}
            >
              <div className="cat-status-dot-label">
                <span className="cat-dot dot-orange" />
                <span className="stat-label">{t('Expiring Soon', 'ใกล้หมด')}</span>
              </div>
              <span className={`stat-value ${expiringSoon > 0 ? 'val-orange' : 'muted'}`}>
                {expiringSoon}
              </span>
            </div>

            {/* Status 3: Expired (Red Dot) */}
            <div
              className={`cat-status-row ${expired > 0 ? 'cat-stat-clickable' : ''}`}
              onClick={(e) => {
                if (expired > 0) {
                  e.stopPropagation();
                  handleExplore('expired');
                }
              }}
              title={expired > 0 ? t('Filter expired warranty', 'กรองรายการหมดประกัน') : undefined}
            >
              <div className="cat-status-dot-label">
                <span className="cat-dot dot-red" />
                <span className="stat-label">{t('Expired', 'หมดอายุ')}</span>
              </div>
              <span className={`stat-value ${expired > 0 ? 'val-red' : 'muted'}`}>
                {expired}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Action Button (16px) */}
      <div className="cat-card-actions">
        <button
          type="button"
          className="cat-btn-primary"
          onClick={(e) => {
            e.stopPropagation();
            handleExplore();
          }}
          title={t(`Explore ${category}`, `ดูรายการ ${category}`)}
        >
          <span>{t(`Explore (${total})`, `ดูรายการ (${total})`)}</span>
          <ArrowRight size={17} className="cat-btn-icon" aria-hidden />
        </button>
      </div>
    </div>
  );
};


