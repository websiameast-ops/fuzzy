import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Grid,
  Leaf,
  Lightbulb,
  List,
  Megaphone,
  Newspaper,
  Package,
  Tag,
  Wrench,
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
  { key: 'event', en: 'Event', th: 'กิจกรรม' },
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

  const heroItems = useMemo(() => [
    {
      id: 'NW-2026-014',
      badge: 'NEW PRODUCT',
      title: lang === 'th' ? 'New Grundfos Now Available' : 'New Grundfos Now Available',
      desc: lang === 'th'
        ? 'ปั๊มแนวตั้งหลายสเตจรุ่นใหม่ มีประสิทธิภาพสูงขึ้น ควบคุมได้ฉลาดขึ้น และมีค่าใช้จ่ายตลอดอายุการใช้งานต่ำลง'
        : 'The next generation of intelligent vertical multistage pumps. Higher efficiency, smarter control, lower life cycle cost.',
      bg: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0369a1 100%)',
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

  const sidebarArticles = useMemo(() => [
    {
      id: 'NW-2026-016',
      tag: 'PROMOTION',
      title: lang === 'th' ? 'PM PACKAGE PROMOTION' : 'PM PACKAGE PROMOTION',
      sub: lang === 'th' ? 'แพ็กเกจบำรุงรักษาตามระยะ ราคาสุดพิเศษสำหรับคุณ' : 'Special price maintenance package tailored for you',
      bg: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
    },
    {
      id: 'NW-2026-020',
      tag: 'CLEARANCE',
      title: lang === 'th' ? 'LOCTITE CLEARANCE' : 'LOCTITE CLEARANCE',
      sub: lang === 'th' ? 'สินค้าเกรดอุตสาหกรรมราคาพิเศษ ลดสูงสุด 50%' : 'Industrial grade items special price up to 50% OFF',
      bg: 'linear-gradient(135deg, #991b1b 0%, #ef4444 100%)',
    },
    {
      id: 'NW-2026-012',
      tag: 'ENERGY',
      title: lang === 'th' ? 'BEO PROGRAM' : 'BEO PROGRAM',
      sub: lang === 'th' ? 'Boost Energy Optimization ลดค่าใช้จ่ายด้านพลังงาน สร้างโรงงานอยู่อย่างยั่งยืน' : 'Boost Energy Optimization & Reduce plant operating costs',
      bg: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
    },
    {
      id: 'NW-2026-018',
      tag: 'PERFORMANCE',
      title: lang === 'th' ? 'FIRE PUMP TEST PERFORMANCE' : 'FIRE PUMP TEST PERFORMANCE',
      sub: lang === 'th' ? 'มั่นใจในระบบดับเพลิง พร้อมใช้งานในทุกสถานการณ์' : 'Ensure fire protection system reliability in all situations',
      bg: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%)',
    },
  ], [lang]);

  const currentHero = heroItems[heroIndex % heroItems.length];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('News & Offers', 'ข่าวสารและข้อเสนอ')}</h1>
          <p className="page-sub">{t('Updates, promotions and maintenance know-how from SiamEast Solutions.', 'ข่าว โปรโมชั่น และความรู้งานซ่อมบำรุงจากสยามอีสท์ โซลูชั่น')}</p>
        </div>
        <div className="page-actions">
          <SearchBox value={q} onChange={setQ} placeholder={t('Search articles…', 'ค้นหาบทความ…')} />
        </div>
      </div>

      {/* Main 2-Column Layout matching Mockup 03 */}
      <div className="news-layout">
        {/* Left Column: Hero, Toolbar, News items */}
        <div>
          {/* Top Hero Banner / Feature Carousel */}
          <div className="news-hero" style={{ background: currentHero.bg }}>
            <span className="news-hero-badge">{currentHero.badge}</span>
            <h2 className="news-hero-title">{currentHero.title}</h2>
            <p className="news-hero-sub">{currentHero.desc}</p>
            <Link to={`/portal/news/${currentHero.id}`} className="news-hero-btn">
              {t('Learn More', 'เรียนรู้เพิ่มเติม')} <ArrowRight size={15} />
            </Link>

            <div className="news-hero-dots">
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

          {/* Filter & View Toolbar */}
          <div className="news-toolbar">
            <div className="news-chips">
              {CATS.map((c) => (
                <button
                  key={c.key}
                  className={`news-chip ${cat === c.key ? 'active' : ''}`}
                  onClick={() => setCat(c.key)}
                >
                  {lang === 'th' ? c.th : c.en}
                </button>
              ))}
            </div>

            <div className="news-controls-right">
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
                <button className="btn btn-outline btn-sm" onClick={() => { setQ(''); setCat('all'); }}>
                  {t('Clear filters', 'ล้างตัวกรอง')}
                </button>
              }
            />
          ) : viewMode === 'grid' ? (
            /* Cards Grid */
            <div className="news-grid">
              {filtered.map((n) => {
                const style = CAT_STYLE[n.category] || CAT_STYLE.company;
                const Icon = style.icon;
                return (
                  <Link key={n.id} to={`/portal/news/${n.id}`} className="news-card">
                    {/* Placeholder color header icon */}
                    <div className="news-card-thumb" style={{ background: style.bg }}>
                      <Icon size={38} strokeWidth={1.4} />
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
              {filtered.map((n) => {
                const style = CAT_STYLE[n.category] || CAT_STYLE.company;
                const Icon = style.icon;
                return (
                  <Link key={n.id} to={`/portal/news/${n.id}`} className="news-row">
                    <span
                      aria-hidden
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 40, minWidth: 40, height: 40, borderRadius: 10,
                        background: style.bg, color: '#fff',
                      }}
                    >
                      <Icon size={18} strokeWidth={1.6} />
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
          {filtered.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: 12, marginBottom: 24 }}>
              <button className="btn btn-ghost btn-sm" style={{ padding: '8px 24px' }}>
                {t('Load More', 'โหลดเพิ่มเติม')} <ChevronDown size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Right Sidebar: Renamed from Campaign to 'บทความที่น่าสนใจ' / 'Featured Articles' */}
        <div className="news-sidebar">
          <h3 className="news-sidebar-title">{t('Interesting Articles', 'บทความที่น่าสนใจ')}</h3>

          {sidebarArticles.map((item) => (
            <Link key={item.id} to={`/portal/news/${item.id}`} className="sidebar-card" style={{ background: item.bg }}>
              <div className="sidebar-card-tag">{item.tag}</div>
              <h4 className="sidebar-card-title">{item.title}</h4>
              <p className="sidebar-card-sub">{item.sub}</p>
              <div className="sidebar-card-btn">
                {t('Learn More', 'กดเข้าไปอ่านต่อ')} <ArrowRight size={13} />
              </div>
            </Link>
          ))}
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
  const Icon = CAT_STYLE[article.category].icon;

  return (
    <div style={{ maxWidth: 860 }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/portal/news')} style={{ marginBottom: 12, marginLeft: -8 }}>
        <ArrowLeft size={16} aria-hidden />
        {t('All news', 'ข่าวทั้งหมด')}
      </button>

      <div className="card" style={{ overflow: 'hidden', marginBottom: 18 }}>
        <div className="news-thumb" style={{ background: CAT_STYLE[article.category].bg, height: 200 }} aria-hidden>
          <Icon size={56} strokeWidth={1.2} />
        </div>
        <div style={{ padding: '22px 24px 26px' }}>
          <div className="flex" style={{ gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <span className="badge t-grey">{catLabel(article.category, lang)}</span>
            <span className="muted small">{fmtDate(article.date, lang)} · {article.readMins} {t('min read', 'นาที')}</span>
          </div>
          <h1 style={{ margin: '0 0 6px', fontSize: 24 }}>{lang === 'th' ? article.titleTh : article.title}</h1>
          <p className="muted" style={{ marginTop: 0 }}>{article.summary}</p>
          {article.content.map((p, i) => (
            <p key={i} style={{ lineHeight: 1.7 }}>{p}</p>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 18, marginBottom: 18 }}>
        <div className="between" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="fw-600">{t('Want to act on this?', 'สนใจเรื่องนี้อยู่ใช่ไหม?')}</div>
            <div className="muted small">{t('Your account manager can scope it for your sites.', 'ผู้จัดการฝ่ายลูกค้าของคุณช่วยประเมินสำหรับไซต์ของคุณได้')}</div>
          </div>
          <Link to="/portal/requests/new" className="btn btn-primary">
            {t('Contact SE / request service', 'ติดต่อ SE / ขอรับบริการ')}
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
        <div style={{ marginTop: 14 }}>
          <ContactSECard
            name={company.accountManager.name}
            role={lang === 'th' ? company.accountManager.roleTh : company.accountManager.role}
            phone={company.accountManager.phone}
            email={company.accountManager.email}
            line={company.accountManager.line}
          />
        </div>
      </div>

      <h3>{t('Related articles', 'บทความที่เกี่ยวข้อง')}</h3>
      <div className="grid-2">
        {more.map((n) => (
          <Link key={n.id} to={`/portal/news/${n.id}`} className="card" style={{ padding: 16, textDecoration: 'none', color: 'inherit' }}>
            <div className="flex" style={{ gap: 8, marginBottom: 6 }}>
              <span className="badge t-grey">{catLabel(n.category, lang)}</span>
              <span className="muted small">{fmtDate(n.date, lang)}</span>
            </div>
            <div className="fw-600">{lang === 'th' ? n.titleTh : n.title}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
