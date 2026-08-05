import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Grid,
  Leaf,
  Lightbulb,
  List,
  Megaphone,
  Newspaper,
  Package,
  Search,
  Star,
  Tag,
  Wrench,
  X,
  Calendar,
} from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useCompany } from '@/contexts/CompanyContext';
import { mockNews, getArticle } from '@/data/mockNews';
import { EmptyState, SearchBox, ContactSECard } from '@/components/common';
import { fmtDate } from '@/utils/format';
import type { NewsCategory } from '@/types';

const CATS: { key: NewsCategory | 'all' | 'event' | 'service'; en: string; th: string }[] = [
  { key: 'all', en: 'All', th: 'ทั้งหมด' },
  { key: 'company', en: 'News', th: 'ข่าวสาร' },
  { key: 'products', en: 'Product', th: 'ผลิตภัณฑ์' },
  { key: 'promotions', en: 'Promotion', th: 'โปรโมชั่น' },
  { key: 'tips', en: 'Knowledge', th: 'ความรู้' },
  { key: 'service', en: 'Service', th: 'บริการ' },
];

const CAT_STYLE: Record<string, { icon: typeof Newspaper; bg: string; labelEn: string; labelTh: string }> = {
  company: { icon: Megaphone, bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', labelEn: 'NEWS', labelTh: 'ข่าวสาร' },
  products: { icon: Package, bg: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', labelEn: 'PRODUCT', labelTh: 'ผลิตภัณฑ์' },
  promotions: { icon: Tag, bg: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)', labelEn: 'PROMOTION', labelTh: 'โปรโมชั่น' },
  tips: { icon: Lightbulb, bg: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', labelEn: 'KNOWLEDGE', labelTh: 'ความรู้' },
  sustainability: { icon: Leaf, bg: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', labelEn: 'SUSTAINABILITY', labelTh: 'ความยั่งยืน' },
  event: { icon: Calendar, bg: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', labelEn: 'EVENT', labelTh: 'กิจกรรม' },
  service: { icon: Wrench, bg: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)', labelEn: 'SERVICE', labelTh: 'บริการ' },
};

function catLabel(key: string, lang: 'en' | 'th') {
  const c = CATS.find((x) => x.key === key);
  if (!c) return key;
  return lang === 'th' ? c.th : c.en;
}

export function NewsPage() {
  const { lang, t } = useLang();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [heroIndex, setHeroIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(9);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % 2);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const base = import.meta.env.BASE_URL;
  const heroItems = useMemo(() => [
    {
      id: 'NW-2026-014',
      badge: 'NEW PRODUCT',
      title: lang === 'th' ? 'New Grundfos Now Available' : 'New Grundfos Now Available',
      desc: lang === 'th'
        ? 'ปั๊มแนวตั้งหลายสเตจรุ่นใหม่ มีประสิทธิภาพสูงขึ้น ควบคุมได้ฉลาดขึ้น และมีค่าใช้จ่ายตลอดอายุการใช้งานต่ำลง'
        : 'The next generation of intelligent vertical multistage pumps. Higher efficiency, smarter control, lower life cycle cost.',
      bg: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0369a1 100%)',
      imageUrl: `${base}assets/Hero_Banner_xn.png`,
    },
    {
      id: 'NW-2026-016',
      badge: 'PROMOTION',
      title: lang === 'th' ? 'Mid-year PM Package Discount 15%' : 'Mid-Year PM Package 15% OFF',
      desc: lang === 'th'
        ? 'แพ็กเกจดูแลบำรุงรักษาเชิงป้องกันสำหรับอุปกรณ์อุตสาหกรรมในราคาพิเศษ'
        : 'Book a preventive-maintenance package covering three or more assets before 31 August 2026.',
      bg: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
    },
  ], [lang]);

  // IDs of articles featured in the hero carousel
  const heroIds = useMemo(() => new Set(heroItems.map((h) => h.id)), [heroItems]);

  const filtered = useMemo(() => {
    let result = mockNews.filter((n) => {
      if (cat !== 'all' && n.category !== cat) return false;
      const hay = `${n.title} ${n.titleTh} ${n.summary}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });

    if (sortOrder === 'oldest') {
      result = [...result].reverse();
    }
    return result;
  }, [q, cat, sortOrder]);

  const displayedArticles = useMemo(() => {
    return filtered.slice(0, visibleCount);
  }, [filtered, visibleCount]);

  const sidebarArticles = useMemo(() => {
    const picks = [
      { id: 'NW-2026-016', bg: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' },
      { id: 'NW-2026-021', bg: 'linear-gradient(135deg, #991b1b 0%, #ef4444 100%)' },
      { id: 'NW-2026-012', bg: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)' },
      { id: 'NW-2026-018', bg: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%)' },
    ];
    return picks.map(({ id, bg }) => {
      const art = mockNews.find((n) => n.id === id);
      return {
        id,
        bg,
        imageUrl: art?.imageUrl,
        tag: (art?.category ?? '').toUpperCase(),
        title: art ? (lang === 'th' ? art.titleTh : art.title) : id,
        sub: art?.summary ?? '',
      };
    });
  }, [lang]);

  const currentHero = heroItems[heroIndex % heroItems.length];

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">{t('News & Offers', 'ข่าวสารและข้อเสนอ')}</h1>
          <p className="page-sub">{t('Updates, promotions and maintenance know-how from SiamEast Solutions.', 'ข่าว โปรโมชั่น และความรู้งานซ่อมบำรุงจากสยามอีสท์ โซลูชั่น')}</p>
        </div>
      </div>

      {/* Main 2-Column Layout matching Mockup 03 */}
      <div className="news-layout">
        {/* Left Column: Hero, Toolbar, News items */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Top Hero Banner / Feature Carousel */}
          <div
            className="news-hero"
            style={{ background: currentHero.bg }}
          >
            {/* Background image — keyed so it fades on slide change */}
            {currentHero.imageUrl && (
              <img
                key={`img-${heroIndex}`}
                src={currentHero.imageUrl}
                alt=""
                aria-hidden
                className="news-hero-img"
                style={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%',
                  objectFit: 'cover', objectPosition: 'center',
                  zIndex: 0,
                }}
              />
            )}

            {/* Text content — keyed so it slides in on change */}
            <div key={heroIndex} className="news-hero-content">
              <span className="news-hero-badge">{currentHero.badge}</span>
              <h2 className="news-hero-title">{currentHero.title}</h2>
              <p className="news-hero-sub">{currentHero.desc}</p>
              <Link to={`/portal/news/${currentHero.id}`} className="news-hero-btn">
                {t('Learn More', 'เรียนรู้เพิ่มเติม')} <ArrowRight size={15} />
              </Link>
            </div>

            {/* Dots (Original Location) */}
            <div className="news-hero-dots" style={{ zIndex: 2 }}>
              {heroItems.map((_, idx) => (
                <button
                  key={idx}
                  className={`news-hero-dot ${idx === heroIndex ? 'active' : ''}`}
                  onClick={() => setHeroIndex(idx)}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Filter & View Toolbar with Integrated Search */}
          <div className="news-toolbar">
            <div className="news-chips">
              {CATS.map((c) => (
                <button
                  key={c.key}
                  className={`news-chip ${cat === c.key ? 'active' : ''}`}
                  onClick={() => { setCat(c.key); setVisibleCount(9); }}
                >
                  {lang === 'th' ? c.th : c.en}
                </button>
              ))}
            </div>

            <div className="news-controls-right">
              {/* Expandable Search (right-aligned, expands to the left without pushing select/view controls) */}
              <div
                style={{ position: 'relative', display: 'flex', alignItems: 'center', height: 32, width: 24 }}
                onMouseEnter={() => setSearchOpen(true)}
                onMouseLeave={() => { if (!q) setSearchOpen(false); }}
              >
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    borderBottom: searchOpen || q ? '1px solid var(--se-primary)' : '1px solid transparent',
                    paddingBottom: 2,
                    transition: 'border-color 0.2s ease',
                    background: searchOpen || q ? 'var(--se-surface)' : 'transparent',
                    zIndex: 5,
                  }}
                >
                  <span
                    style={{ display: 'flex', color: (searchOpen || q ? 'var(--se-primary)' : 'var(--se-text-muted)') as string, flex: '0 0 auto', cursor: 'pointer' }}
                    onClick={() => setSearchOpen(true)}
                    title={t('Search articles…', 'ค้นหาบทความ…')}
                  >
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    value={q}
                    onChange={(e) => { setQ(e.target.value); setVisibleCount(9); }}
                    placeholder={t('Search articles…', 'ค้นหาบทความ…')}
                    onFocus={() => setSearchOpen(true)}
                    onBlur={() => { if (!q) setSearchOpen(false); }}
                    style={{
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      color: 'var(--se-text)',
                      fontSize: 13.5,
                      width: searchOpen || q ? 140 : 0,
                      opacity: searchOpen || q ? 1 : 0,
                      padding: '2px 0',
                      transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease',
                      overflow: 'hidden',
                    }}
                  />
                  {q && (
                    <button onClick={() => { setQ(''); setSearchOpen(false); }} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: 'var(--se-text-muted)' }}>
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              <select
                className="news-sort-select"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
              >
                <option value="newest">{t('Newest First', 'ล่าสุดก่อน')}</option>
                <option value="oldest">{t('Oldest First', 'เก่าที่สุดก่อน')}</option>
              </select>

              <div className="view-btn-group">
                <button
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title={t('Grid view', 'มุมมองแบบการ์ด')}
                >
                  <Grid size={16} />
                </button>
                <button
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title={t('List view', 'มุมมองแบบรายการ')}
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Title Header */}
          <h3 style={{ margin: '0 0 14px', fontSize: 18, fontWeight: 800 }}>
            {t('Latest News', 'ข่าวสารล่าสุด')}
          </h3>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Newspaper size={24} />}
              title={t('No articles match your search', 'ไม่พบบทความที่ตรงกับการค้นหา')}
              body={t('Try a different keyword or category.', 'ลองใช้คำค้นหรือหมวดหมู่อื่น')}
              action={
                <button className="btn btn-outline btn-sm" onClick={() => { setQ(''); setCat('all'); setVisibleCount(9); }}>
                  {t('Clear filters', 'ล้างตัวกรอง')}
                </button>
              }
            />
          ) : viewMode === 'grid' ? (
            /* Cards Grid */
            <div className="news-grid">
              {displayedArticles.map((n) => {
                const style = CAT_STYLE[n.category] || CAT_STYLE.company;
                const Icon = style.icon;
                return (
                  <Link key={n.id} to={`/portal/news/${n.id}`} className="news-card">
                    {/* Placeholder color header icon or auto-focus cover image */}
                    <div className="news-card-thumb" style={{ background: style.bg }}>
                      {n.imageUrl ? (
                        <img src={`${base}${n.imageUrl.replace(/^\//, '')}`} alt={lang === 'th' ? n.titleTh : n.title} className="cover-img" />
                      ) : (
                        <Icon size={38} strokeWidth={1.4} />
                      )}
                      {heroIds.has(n.id) && (
                        <span className="news-featured-badge">
                          <Star size={10} fill="currentColor" />
                          {t('Featured', 'แนะนำ')}
                        </span>
                      )}
                    </div>
                    <div className="news-card-body">
                      <div className="news-card-header">
                        <span className="news-card-cat">{lang === 'th' ? style.labelTh : style.labelEn}</span>
                        <span className="news-card-date">{fmtDate(n.date, lang)}</span>
                      </div>
                      <h4 className="news-card-title">{lang === 'th' ? n.titleTh : n.title}</h4>
                      <p className="news-card-desc">{n.summary}</p>
                      <span className="news-card-link">
                        {t('Read More', 'อ่านต่อ')} <ArrowRight size={13} />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            /* Compact List View */
            <div className="card" style={{ padding: '4px 4px', marginBottom: 20 }}>
              {displayedArticles.map((n) => {
                const style = CAT_STYLE[n.category] || CAT_STYLE.company;
                const Icon = style.icon;
                return (
                  <Link key={n.id} to={`/portal/news/${n.id}`} className="news-row">
                    <span className="news-row-thumb" style={{ background: style.bg }} aria-hidden>
                      {n.imageUrl ? (
                        <img src={`${base}${n.imageUrl.replace(/^\//, '')}`} alt={lang === 'th' ? n.titleTh : n.title} className="cover-img" />
                      ) : (
                        <Icon size={20} strokeWidth={1.6} style={{ color: '#fff' }} />
                      )}
                    </span>
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <span className="fw-600" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lang === 'th' ? n.titleTh : n.title}
                      </span>
                      <span className="muted small">{lang === 'th' ? style.labelTh : style.labelEn} · {fmtDate(n.date, lang)} · {n.readMins} {t('min', 'นาที')}</span>
                    </span>
                    <ArrowRight size={15} aria-hidden style={{ color: 'var(--se-text-muted)', flex: '0 0 auto' }} />
                  </Link>
                );
              })}
            </div>
          )}

          {/* Load More Button */}
          {filtered.length > visibleCount && (
            <div style={{ textAlign: 'center', marginTop: 12, marginBottom: 24 }}>
              <button
                className="btn btn-ghost btn-sm"
                style={{ padding: '8px 24px' }}
                onClick={() => setVisibleCount((prev) => prev + 9)}
              >
                {t('Load More', 'โหลดเพิ่มเติม')} <ChevronDown size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Right Sidebar: Renamed from Campaign to 'บทความที่น่าสนใจ' / 'Featured Articles' */}
        <div className="news-sidebar-wrap">
          <div className="news-sidebar">
            <h3 className="news-sidebar-title">{t('Interesting Articles', 'บทความที่น่าสนใจ')}</h3>

            {sidebarArticles.map((item) => (
              <Link key={item.id} to={`/portal/news/${item.id}`} className="sidebar-card" style={{ background: item.bg }}>
                {item.imageUrl && (
                  <img
                    src={`${base}${item.imageUrl.replace(/^\//, '')}`}
                    alt=""
                    aria-hidden
                    className="cover-img"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', zIndex: 0 }}
                  />
                )}
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <div className="sidebar-card-tag">{item.tag}</div>
                  <h4 className="sidebar-card-title">{item.title}</h4>
                  <p className="sidebar-card-sub">{item.sub}</p>
                  <div className="sidebar-card-btn">
                    {t('Learn More', 'อ่านต่อ')} <ArrowRight size={13} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function NewsDetailPage() {
  const { id } = useParams();
  const { lang, t } = useLang();
  const { company } = useCompany();
  const navigate = useNavigate();
  const article = id ? getArticle(id) : undefined;

  const [sidebarArticles] = useState(() => {
    const pool = mockNews.filter((n) => n.id !== id);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 4).map((art) => {
      const catStyle = CAT_STYLE[art.category] || CAT_STYLE.company;
      return {
        id: art.id,
        bg: catStyle.bg,
        imageUrl: art.imageUrl,
        tag: art.category.toUpperCase(),
        title: lang === 'th' ? art.titleTh : art.title,
        sub: art.summary,
      };
    });
  });

  if (!article) {
    return (
      <EmptyState
        icon={<Newspaper size={24} />}
        title={t('Article not found', 'ไม่พบบทความ')}
        body={t('This article may have been removed.', 'บทความนี้อาจถูกลบไปแล้ว')}
        action={<Link to="/portal/news" className="btn btn-primary btn-sm">{t('Back to news', 'กลับไปหน้าข่าว')}</Link>}
      />
    );
  }

  const related = mockNews.filter((n) => n.id !== article.id && n.category === article.category).slice(0, 2);
  const more = related.length ? related : mockNews.filter((n) => n.id !== article.id).slice(0, 2);
  const Icon = CAT_STYLE[article.category]?.icon || Newspaper;
  const style = CAT_STYLE[article.category] || CAT_STYLE.company;

  return (
    <div>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/portal/news')} style={{ marginBottom: 16, marginLeft: -8 }}>
        <ArrowLeft size={16} aria-hidden />
        {t('All news', 'ข่าวทั้งหมด')}
      </button>

      {/* Main 2-Column Layout matching Example Design */}
      <div className="news-layout">
        {/* Left Main Column: Article Content */}
        <div>
          <div className="card" style={{ overflow: 'hidden', marginBottom: 20 }}>
            {/* Banner Thumbnail matching modern dark/gradient image look */}
            <div className="news-thumb" style={{ background: style.bg, height: 260, overflow: 'hidden', position: 'relative' }} aria-hidden>
              {article.imageUrl ? (
                <img src={`${import.meta.env.BASE_URL}${article.imageUrl.replace(/^\//, '')}`} alt={lang === 'th' ? article.titleTh : article.title} className="cover-img" />
              ) : (
                <Icon size={72} strokeWidth={1.2} />
              )}
            </div>

            <div style={{ padding: '28px 32px 32px' }}>
              <div className="flex" style={{ gap: 10, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="badge t-grey" style={{ background: 'var(--se-grey-soft)', padding: '4px 10px', borderRadius: 4, fontWeight: 700 }}>
                  {catLabel(article.category, lang)}
                </span>
                <span className="muted small" style={{ fontSize: 13 }}>
                  {fmtDate(article.date, lang)} · {article.readMins} {t('min read', 'นาที')}
                </span>
              </div>

              <h1 style={{ margin: '0 0 14px', fontSize: 24, fontWeight: 800, lineHeight: 1.3 }}>
                {lang === 'th' ? article.titleTh : article.title}
              </h1>

              <p className="muted" style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 20, fontWeight: 500 }}>
                {article.summary}
              </p>

              <div style={{ borderTop: '1px solid var(--se-border)', paddingTop: 18, marginTop: 18 }}>
                {article.content.map((p, i) => (
                  <p key={i} style={{ lineHeight: 1.75, fontSize: 14, color: 'var(--se-text)', marginBottom: 14 }}>
                    {p}
                  </p>
                ))}
              </div>
            </div>
          </div>



          {/* Related Articles Section */}
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>
            {t('Related articles', 'บทความที่เกี่ยวข้อง')}
          </h3>
          <div className="grid-2" style={{ marginBottom: 24 }}>
            {more.map((n) => {
              const relStyle = CAT_STYLE[n.category] || CAT_STYLE.company;
              return (
                <Link key={n.id} to={`/portal/news/${n.id}`} className="card" style={{ padding: 18, textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="flex" style={{ gap: 8, alignItems: 'center' }}>
                    <span className="badge t-grey" style={{ fontSize: 11 }}>{catLabel(n.category, lang)}</span>
                    <span className="muted small">{fmtDate(n.date, lang)}</span>
                  </div>
                  <div className="fw-600" style={{ fontSize: 14, lineHeight: 1.35 }}>{lang === 'th' ? n.titleTh : n.title}</div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right Sidebar: 'บทความที่น่าสนใจ' / 'Interesting Articles' */}
        <div className="news-sidebar-wrap">
          <div className="news-sidebar">
            <h3 className="news-sidebar-title">{t('Interesting Articles', 'บทความที่น่าสนใจ')}</h3>

            {sidebarArticles.map((item) => (
              <Link key={item.id} to={`/portal/news/${item.id}`} className="sidebar-card" style={{ background: item.bg }}>
                {item.imageUrl && (
                  <img
                    src={`${import.meta.env.BASE_URL}${item.imageUrl.replace(/^\//, '')}`}
                    alt=""
                    aria-hidden
                    className="cover-img"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', zIndex: 0 }}
                  />
                )}
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <div className="sidebar-card-tag">{item.tag}</div>
                  <h4 className="sidebar-card-title">{item.title}</h4>
                  <p className="sidebar-card-sub">{item.sub}</p>
                  <div className="sidebar-card-btn">
                    {t('Learn More', 'Learn More')} <ArrowRight size={13} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
