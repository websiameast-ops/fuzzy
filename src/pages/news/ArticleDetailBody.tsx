import { useMemo, useState, type ReactNode } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  Download,
  FileText,
  Hash,
  Image as ImageIcon,
  Mail,
  MapPin,
  MessageCircle,
  Newspaper,
  Package,
  Phone,
  Play,
  Wrench,
} from 'lucide-react';
import { Modal } from '@/components/common';
import { fmtDate } from '@/utils/format';
import type {
  NewsBlogBlock,
  NewsContactCard,
  NewsFeedItemResponse,
  NewsGalleryItem,
  NewsPdfFile,
} from '@/lib/apiClient';
import type { Lang } from '@/types';

interface TemplateFieldItem {
  key: string;
  icon: ReactNode;
  label: string;
  value: string;
  fullWidth?: boolean;
}

function promoEndDate(article: NewsFeedItemResponse): string {
  const base = article.startsAt ?? article.createdAt;
  const d = new Date(base);
  d.setDate(d.getDate() + 30);
  return d.toISOString();
}

function normalizeCategory(slug: string): 'products' | 'knowledge' | 'news' | 'events' | 'promotions' | 'other' {
  switch (slug) {
    case 'products':
      return 'products';
    case 'tips':
    case 'knowledge':
      return 'knowledge';
    case 'company':
    case 'news':
      return 'news';
    case 'events':
    case 'event':
      return 'events';
    case 'promotions':
      return 'promotions';
    default:
      return 'other';
  }
}

function buildTemplateFields(
  article: NewsFeedItemResponse,
  lang: Lang,
  t: (en: string, th: string) => string,
  displayDate: string,
): TemplateFieldItem[] {
  const kind = normalizeCategory(article.category);
  const items: TemplateFieldItem[] = [];

  if (kind === 'products') {
    if (article.productName) {
      items.push({
        key: 'productName',
        icon: <Package size={18} />,
        label: 'Product / Service Name',
        value: article.productName,
      });
    }
    if (article.productModel) {
      items.push({
        key: 'productModel',
        icon: <Hash size={18} />,
        label: 'Model',
        value: article.productModel,
      });
    }
  } else if (kind === 'knowledge') {
    if (article.knowledgeTopic) {
      items.push({
        key: 'knowledgeTopic',
        icon: <BookOpen size={18} />,
        label: 'Knowledge Topic',
        value: article.knowledgeTopic,
      });
    }
    if (article.relatedEquipment) {
      items.push({
        key: 'relatedEquipment',
        icon: <Wrench size={18} />,
        label: 'Related Equipment',
        value: article.relatedEquipment,
      });
    }
  } else if (kind === 'news') {
    items.push({
      key: 'newsDate',
      icon: <Calendar size={18} />,
      label: 'News Date',
      value: fmtDate(displayDate, lang),
    });
    if (article.newsSource) {
      items.push({
        key: 'newsSource',
        icon: <Newspaper size={18} />,
        label: 'News Source / Reference',
        value: article.newsSource,
      });
    }
  } else if (kind === 'events') {
    const startLabel = fmtDate(article.startsAt || displayDate, lang);
    const endLabel = article.endsAt ? fmtDate(article.endsAt, lang) : '';
    const computedEventDate =
      article.eventDateLabel ||
      (endLabel && endLabel !== startLabel ? `${startLabel} – ${endLabel}` : fmtDate(displayDate, lang));
    items.push({
      key: 'eventDate',
      icon: <Calendar size={18} />,
      label: t('Event Date (Start – End)', 'วันที่จัดงาน (Start – End)'),
      value: computedEventDate,
    });
    if (article.eventTime) {
      items.push({
        key: 'eventTime',
        icon: <Clock size={18} />,
        label: t('Time', 'เวลา'),
        value: article.eventTime,
      });
    }
    if (article.eventLocation) {
      items.push({
        key: 'eventLocation',
        icon: <MapPin size={18} />,
        label: t('Location', 'สถานที่'),
        value: article.eventLocation,
        fullWidth: true,
      });
    }
  } else if (kind === 'promotions') {
    const startDate = article.startsAt ?? article.createdAt;
    const endDate = article.endsAt ?? promoEndDate(article);
    items.push({
      key: 'promoStart',
      icon: <Calendar size={18} />,
      label: t('Promotion Start Date', 'วันเริ่มต้นโปรโมชั่น'),
      value: fmtDate(startDate, lang),
    });
    items.push({
      key: 'promoEnd',
      icon: <Clock size={18} />,
      label: t('Promotion End Date', 'วันสิ้นสุดโปรโมชั่น'),
      value: fmtDate(endDate, lang),
    });
  }

  return items;
}

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : null;
}

function getVideoEmbedUrl(url: string): string | null {
  const yt = extractYouTubeId(url);
  if (yt) return `https://www.youtube.com/embed/${yt}?autoplay=1&rel=0`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1`;
  return null;
}

function getVideoPosterUrl(url: string): string | undefined {
  const yt = extractYouTubeId(url);
  return yt ? `https://img.youtube.com/vi/${yt}/hqdefault.jpg` : undefined;
}

const DEFAULT_CORPORATE_CONTACT: NewsContactCard = {
  subtitleEn: 'Corporate Contact',
  subtitleTh: 'ติดต่อบริษัท',
  titleEn: 'SE Corporate Contact',
  titleTh: 'SE Corporate Contact',
  phone: '063-393-5088',
  line: '@siameast',
  email: 'info@siameastsolutions.com',
};

export interface ArticleDetailBodyProps {
  article: NewsFeedItemResponse;
  lang: Lang;
  t: (en: string, th: string) => string;
  displayDate: string;
  catIcon: ReactNode;
  catBg: string;
  sanitizeContent: (html: string) => string;
}

export function ArticleDetailBody({
  article,
  lang,
  t,
  displayDate,
  catIcon,
  catBg,
  sanitizeContent,
}: ArticleDetailBodyProps) {
  const [lightbox, setLightbox] = useState<{ type: 'image' | 'video'; url: string; title: string } | null>(null);

  const title = lang === 'th' ? article.titleTh : article.titleEn;
  const content = lang === 'th' ? article.contentTh : article.contentEn;
  const sanitizedHtml = useMemo(() => sanitizeContent(content), [content, sanitizeContent]);

  // Parse inline images and PDF links from HTML content as fallback
  const { parsedGallery, parsedPdfs } = useMemo(() => {
    if (typeof window === 'undefined') return { parsedGallery: [] as NewsGalleryItem[], parsedPdfs: [] as NewsPdfFile[] };
    const doc = new DOMParser().parseFromString(sanitizedHtml, 'text/html');
    const imgs: NewsGalleryItem[] = Array.from(doc.querySelectorAll('img'))
      .map((el) => ({
        type: 'image' as const,
        url: el.getAttribute('src') ?? '',
        captionEn: el.getAttribute('alt') ?? '',
        captionTh: el.getAttribute('alt') ?? '',
      }))
      .filter((x) => Boolean(x.url));
    const pdfs: NewsPdfFile[] = Array.from(doc.querySelectorAll('a[href]'))
      .filter((el) => el.getAttribute('href')?.toLowerCase().endsWith('.pdf'))
      .map((el) => ({
        url: el.getAttribute('href')!,
        name: el.textContent?.trim() || el.getAttribute('href')!,
      }));
    return { parsedGallery: imgs, parsedPdfs: pdfs };
  }, [sanitizedHtml]);

  const templateFields = useMemo(
    () => buildTemplateFields(article, lang, t, displayDate),
    [article, lang, t, displayDate],
  );

  const pdfFiles = useMemo(() => {
    const explicit = article.pdfFiles ?? [];
    const seen = new Set(explicit.map((p) => p.url));
    return [...explicit, ...parsedPdfs.filter((p) => !seen.has(p.url))];
  }, [article.pdfFiles, parsedPdfs]);

  const galleryItems = useMemo(() => {
    const explicit = article.galleryItems ?? [];
    const seen = new Set(explicit.map((g) => g.url));
    return [...explicit, ...parsedGallery.filter((g) => !seen.has(g.url))];
  }, [article.galleryItems, parsedGallery]);

  const contactCards = useMemo(() => {
    const cards: NewsContactCard[] = [DEFAULT_CORPORATE_CONTACT];
    if (article.extraContacts && article.extraContacts.length > 0) {
      cards.push(...article.extraContacts);
    }
    return cards;
  }, [article.extraContacts]);

  const blocks: NewsBlogBlock[] = article.blogBlocks ?? [];

  return (
    <article className="article-detail-card">
      {/* Hero Image */}
      <div
        className="article-hero-banner"
        style={!article.imageUrl ? { background: catBg, color: '#fff' } : undefined}
        aria-hidden={!article.imageUrl}
      >
        {article.imageUrl ? (
          <button
            type="button"
            className="article-hero-btn"
            onClick={() => setLightbox({ type: 'image', url: article.imageUrl!, title })}
            aria-label={t('View image', 'ดูรูปภาพ')}
          >
            <img src={article.imageUrl} alt={title} />
          </button>
        ) : (
          <div className="article-hero-fallback">{catIcon}</div>
        )}
      </div>

      {/* Body */}
      <div className="article-detail-body">
        {/* Header */}
        <header className="article-detail-header">
          <div className="article-meta-row">
            <span className="article-cat-pill">
              {lang === 'th' ? article.categoryLabelTh : article.categoryLabelEn}
            </span>
            <span className="article-meta-date">
              <Calendar size={14} aria-hidden />
              {fmtDate(displayDate, lang)}
            </span>
          </div>
          <h1 className="article-detail-title">{title}</h1>
        </header>

        {/* Template Fields (per-category) */}
        {templateFields.length > 0 && (
          <section className="article-section-divider" aria-label={t('Article details', 'รายละเอียดบทความ')}>
            <div className="article-template-grid">
              {templateFields.map((f) => (
                <div
                  key={f.key}
                  className={`article-field-card${f.fullWidth ? ' article-field-card--full' : ''}`}
                >
                  <div className="article-field-icon" aria-hidden>{f.icon}</div>
                  <div className="article-field-text">
                    <div className="article-field-label">{f.label}</div>
                    <div className="article-field-value">{f.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Blog Content */}
        <section className="article-blog-section">
          {blocks.length > 0 ? (
            <div className="article-blog-blocks">
              {blocks.map((block, idx) => {
                const blockTitle = (lang === 'th' ? block.titleTh : block.titleEn) || block.titleEn || block.titleTh;
                const blockHtml = (lang === 'th' ? block.contentTh : block.contentEn) || block.contentEn || block.contentTh;
                const hasImg = Boolean(block.imageUrl) && block.layout !== 'no_image';

                const textNode = (
                  <div className="article-blog-text">
                    {blockTitle && <h3 className="article-blog-heading">{blockTitle}</h3>}
                    {blockHtml && (
                      <div
                        className="news-content"
                        dangerouslySetInnerHTML={{ __html: sanitizeContent(blockHtml) }}
                      />
                    )}
                  </div>
                );

                const imgNode = hasImg ? (
                  <button
                    type="button"
                    className={`article-blog-img-wrap${block.layout === 'image_top' ? ' article-blog-img-wrap--top' : ''}`}
                    onClick={() => setLightbox({ type: 'image', url: block.imageUrl!, title: blockTitle || title })}
                    aria-label={t('View image', 'ดูรูปภาพ')}
                  >
                    <img src={block.imageUrl!} alt={blockTitle || title} />
                  </button>
                ) : null;

                if (block.layout === 'image_left' && imgNode) {
                  return (
                    <div key={idx} className="article-blog-block article-blog-block--split">
                      {imgNode}
                      {textNode}
                    </div>
                  );
                }
                if (block.layout === 'image_right' && imgNode) {
                  return (
                    <div key={idx} className="article-blog-block article-blog-block--split article-blog-block--reverse">
                      {imgNode}
                      {textNode}
                    </div>
                  );
                }
                if (block.layout === 'image_top' && imgNode) {
                  return (
                    <div key={idx} className="article-blog-block article-blog-block--stack">
                      {imgNode}
                      {textNode}
                    </div>
                  );
                }
                return (
                  <div key={idx} className="article-blog-block">
                    {textNode}
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className="news-content article-rich-content"
              dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
            />
          )}
        </section>

        {/* Section: Gallery */}
        {galleryItems.length > 0 && (
          <section className="article-section-divider">
            <div className="article-section-head">
              <h2 className="article-section-title">Gallery</h2>
              <p className="article-section-sub">{t('Related images and videos', 'รูปภาพและวิดีโอประกอบ')}</p>
            </div>
            <div className="article-gallery-grid">
              {galleryItems.map((item, i) => {
                const caption = (lang === 'th' ? item.captionTh : item.captionEn) || item.captionEn || item.captionTh || '';
                const isVideo = item.type === 'video';
                const embedUrl = isVideo ? getVideoEmbedUrl(item.url) : null;
                const thumb = item.thumbnailUrl || (isVideo ? getVideoPosterUrl(item.url) : item.url);
                return (
                  <button
                    key={i}
                    type="button"
                    className="article-gallery-card"
                    onClick={() => setLightbox({ type: item.type, url: item.url, title: caption || title })}
                  >
                    <div className={`article-gallery-thumb${isVideo ? ' article-gallery-thumb--video' : ''}`}>
                      {thumb ? (
                        <img src={thumb} alt={caption || title} />
                      ) : isVideo ? (
                        <video src={`${item.url}#t=0.5`} preload="metadata" muted playsInline />
                      ) : (
                        <div className="article-gallery-placeholder">
                          <ImageIcon size={22} />
                        </div>
                      )}
                      {isVideo && (
                        <span className="article-gallery-play" aria-hidden>
                          <Play size={14} fill="currentColor" />
                        </span>
                      )}
                    </div>
                    <div className="article-gallery-caption-wrap">
                      <span className={`article-gallery-pill${isVideo ? ' article-gallery-pill--video' : ''}`}>
                        {isVideo ? (embedUrl ? 'Video Link' : 'Video File') : 'Image'}
                      </span>
                      {caption && <div className="article-gallery-caption">{caption}</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Section: PDF References */}
        {pdfFiles.length > 0 && (
          <section className="article-section-divider">
            <div className="article-section-head">
              <h2 className="article-section-title">PDF References</h2>
              <p className="article-section-sub">{t('Supporting documents & sources', 'เอกสารประกอบพร้อมแหล่งที่มา')}</p>
            </div>
            <div className="article-pdf-list">
              {pdfFiles.map((pdf, i) => (
                <div key={i} className="article-pdf-card">
                  <div className="article-pdf-badge" aria-hidden>
                    <FileText size={18} />
                    <span>PDF</span>
                  </div>
                  <div className="article-pdf-info">
                    <div className="article-pdf-name">{pdf.name}</div>
                    {(pdf.sizeLabel || pdf.source) && (
                      <div className="article-pdf-meta">
                        {[pdf.sizeLabel, pdf.source ? `${t('Source', 'ที่มา')}: ${pdf.source}` : ''].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </div>
                  <a
                    href={pdf.url}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline btn-sm article-pdf-btn"
                  >
                    <Download size={15} aria-hidden />
                    {t('Download', 'ดาวน์โหลด')}
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section: Contact Us */}
        <section className="article-section-divider">
          <div className="article-section-head">
            <h2 className="article-section-title">Contact Us</h2>
            <p className="article-section-sub">{t('For more information', 'สอบถามข้อมูลเพิ่มเติม')}</p>
          </div>
          <div className="article-contact-grid">
            {contactCards.map((c, idx) => (
              <div key={idx} className="article-contact-card">
                {(c.subtitleEn || c.subtitleTh) && (
                  <div className="article-contact-sub">{lang === 'th' ? c.subtitleTh : c.subtitleEn}</div>
                )}
                <div className="article-contact-name">{lang === 'th' ? c.titleTh : c.titleEn}</div>
                <div className="article-contact-rows">
                  {c.phone && (
                    <div className="article-contact-row">
                      <Phone size={15} aria-hidden />
                      <span className="article-contact-key">Tel</span>
                      <a href={`tel:${c.phone.replace(/[^+\d]/g, '')}`} className="article-contact-val">{c.phone}</a>
                    </div>
                  )}
                  {c.line && (
                    <div className="article-contact-row">
                      <MessageCircle size={15} aria-hidden />
                      <span className="article-contact-key">Line</span>
                      <span className="article-contact-val">{c.line}</span>
                    </div>
                  )}
                  {c.email && (
                    <div className="article-contact-row">
                      <Mail size={15} aria-hidden />
                      <span className="article-contact-key">Email</span>
                      <a href={`mailto:${c.email}`} className="article-contact-val">{c.email}</a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Lightbox Modal */}
      {lightbox && (
        <Modal open onClose={() => setLightbox(null)} title={lightbox.title} large>
          {lightbox.type === 'video' ? (
            (() => {
              const embedUrl = getVideoEmbedUrl(lightbox.url);
              if (embedUrl) {
                return (
                  <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: 8, overflow: 'hidden', background: '#000' }}>
                    <iframe
                      src={embedUrl}
                      title={lightbox.title}
                      allow="autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
                    />
                  </div>
                );
              }
              return (
                <video
                  src={lightbox.url}
                  controls
                  autoPlay
                  style={{ width: '100%', maxHeight: '75vh', borderRadius: 8, display: 'block', background: '#000' }}
                />
              );
            })()
          ) : (
            <img src={lightbox.url} alt={lightbox.title} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 8 }} />
          )}
        </Modal>
      )}
    </article>
  );
}

