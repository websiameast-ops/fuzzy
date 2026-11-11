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
import { EmptyState } from '@/components/common';
import { fmtDate } from '@/utils/format';
import type { NewsCategory, NewsArticle } from '@/types';

const CATS: { key: NewsCategory | 'all' | 'service'; en: string; th: string }[] = [
  { key: 'all', en: 'All', th: 'ทั้งหมด' },
  { key: 'tips', en: 'Knowledge', th: 'ความรู้' },
  { key: 'products', en: 'Products', th: 'ผลิตภัณฑ์' },
  { key: 'service', en: 'Services', th: 'บริการ' },
  { key: 'promotions', en: 'Promotions', th: 'โปรโมชั่น' },
  { key: 'company', en: 'News', th: 'ข่าวสาร' },
];

const CAT_LABELS: Record<string, { labelEn: string; labelTh: string }> = {
  company: { labelEn: 'NEWS', labelTh: 'ข่าวสาร' },
  products: { labelEn: 'PRODUCTS', labelTh: 'ผลิตภัณฑ์' },
  promotions: { labelEn: 'PROMOTIONS', labelTh: 'โปรโมชั่น' },
  tips: { labelEn: 'KNOWLEDGE', labelTh: 'ความรู้' },
  service: { labelEn: 'SERVICES', labelTh: 'บริการ' },
};

function catLabel(key: string, lang: 'en' | 'th') {
  const c = CATS.find((x) => x.key === key);
  if (!c) return key.toUpperCase();
  return lang === 'th' ? c.th : c.en;
}

function formatTitle(str: string, maxLen = 100): string {
  if (!str) return '';
  return str.length > maxLen ? `${str.slice(0, maxLen)}...` : str;
}

export function NewsPage() {
  const { lang, t } = useLang();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [heroIndex, setHeroIndex] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);

  const base = import.meta.env.BASE_URL;

  // Hero carousel slides
  const heroSlides = useMemo(
    () => [
      {
        id: 'NW-2026-024',
        badge: 'PRODUCTS',
        title: 'Build a Greener Workplace with Sustainable Solutions',
        desc: 'Sustainability is no longer an option—it is a key priority for organizations striving to achieve their ESG (Environmental, Social & Governance) goals...',
        imageUrl: `${base}assets/news/prd-05.jpg`,
      },
      {
        id: 'NW-2026-025',
        badge: 'PRODUCTS',
        title: 'Grundfos: World-Class Pump Solutions for Industrial Applications',
        desc: 'Renowned for durability, reliability, and energy efficiency, Grundfos is committed to developing innovative solutions for diverse industrial fluid systems.',
        imageUrl: `${base}assets/news/prd-01.jpg`,
      },
    ],
    [base],
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const currentHero = heroSlides[heroIndex % heroSlides.length];

  // 4 Services & Promotions items matching Image 3 & Image 4
  const promoItems = useMemo(
    () => [
      {
        id: 'NW-2026-032',
        tag: 'SERVICES',
        title: 'SE SOLAR ROOFTOP SOLUTIONS | TURN SOLAR...',
        sub: '► ชมวิดีโอ: SE Solar Rooftop Solutions บน YouTube Reduce electricity costs, improv...',
        imageUrl: `${base}assets/news/prd-03.jpg`,
      },
      {
        id: 'NW-2026-033',
        tag: 'SERVICES',
        title: 'SAVE ENERGY. REDUCE COSTS. WITH BOOST ENERGY...',
        sub: 'Your pumping system could be consuming more energy than necessary - without...',
        imageUrl: `${base}assets/news/prd-01.jpg`,
      },
      {
        id: 'NW-2026-034',
        tag: 'SERVICES',
        title: 'FIRE PUMP PERFORMANCE TEST | VERIFY PERFORMANCE...',
        sub: 'Having a Fire Pump does not necessarily mean your system is fully prepared for a...',
        imageUrl: `${base}assets/news/prd-06.jpg`,
      },
      {
        id: 'NW-2026-030',
        tag: 'SERVICES',
        title: 'SE OVERHAUL SERVICE - EXTEND EQUIPMENT LIFE,...',
        sub: 'A pump that is still running does not necessarily mean it is operating at its best...',
        imageUrl: `${base}assets/news/prd-02.jpg`,
      },
    ],
    [base],
  );

  // Filtered news articles
  const filtered = useMemo(() => {
    let result = mockNews.filter((n) => {
      // exclude main hero from bottom grid if viewing all
      if (cat === 'all') {
        if (n.id === 'NW-2026-024') return false;
      } else if (n.category !== cat) {
        return false;
      }
      const hay = `${n.title} ${n.titleTh} ${n.summary}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });

    if (sortOrder === 'oldest') {
      result = [...result].reverse();
    }
    return result;
  }, [q, cat, sortOrder]);

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Breadcrumb & Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: 'var(--se-text)' }}>
          {t('News & Offers', 'ข่าวสารและข้อเสนอ')}
        </h1>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--se-text-secondary)' }}>
          {t('Updates, promotions and maintenance know-how from SiamEast Solutions.', 'ข่าว โปรโมชั่น และความรู้งานซ่อมบำรุงจากสยามอีสท์ โซลูชั่น')}
        </p>
      </div>

      {/* Top Section: Hero Banner (72%) + Services & Promotions (28%) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: 20, marginBottom: 24 }}>
        {/* Left: Hero Banner */}
        <div
          style={{
            position: 'relative',
            borderRadius: 14,
            overflow: 'hidden',
            height: 360,
            background: '#09152b',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {/* Background image */}
          <img
            src={currentHero.imageUrl}
            alt=""
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center right',
              zIndex: 0,
            }}
          />

          {/* Left gradient overlay covering the left 60% */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, rgba(8, 22, 48, 0.96) 0%, rgba(8, 22, 48, 0.88) 45%, rgba(8, 22, 48, 0.15) 80%, transparent 100%)',
              zIndex: 1,
            }}
          />

          {/* Hero text card on the left */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              padding: '36px 36px 20px',
              maxWidth: 480,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <span
              style={{
                alignSelf: 'flex-start',
                background: '#0284c7',
                color: '#ffffff',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.06em',
                padding: '4px 10px',
                borderRadius: 4,
                textTransform: 'uppercase',
                marginBottom: 14,
              }}
            >
              {currentHero.badge}
            </span>

            <h2
              style={{
                fontSize: 26,
                fontWeight: 800,
                lineHeight: 1.25,
                color: '#ffffff',
                margin: '0 0 12px',
                textShadow: '0 2px 8px rgba(0,0,0,0.4)',
              }}
            >
              {currentHero.title}
            </h2>

            <p
              style={{
                fontSize: 13.5,
                lineHeight: 1.55,
                color: 'rgba(255, 255, 255, 0.88)',
                margin: '0 0 22px',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {currentHero.desc}
            </p>

            <div>
              <Link
                to={`/portal/news/${currentHero.id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#ffffff',
                  color: '#0f172a',
                  fontWeight: 700,
                  fontSize: 13,
                  padding: '9px 18px',
                  borderRadius: 6,
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
                  transition: 'transform 0.15s ease',
                }}
              >
                {t('Learn More', 'เรียนรู้เพิ่มเติม')} <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Bottom Bar: Brand logos & Dots */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              background: 'rgba(5, 14, 30, 0.65)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              padding: '8px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {/* Brand text / logos */}
            <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
              <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' }}>
                Kimberly-Clark <span style={{ fontWeight: 400, opacity: 0.8 }}>PROFESSIONAL</span>
              </span>
              <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 800 }}>WYPALL</span>
              <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 800 }}>KIMTECH</span>
            </div>

            {/* Carousel dots */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {[0, 1, 2, 3, 4].map((idx) => {
                const isActive = idx === (heroIndex % 5);
                return (
                  <button
                    key={idx}
                    onClick={() => setHeroIndex(idx % heroSlides.length)}
                    aria-label={`Slide ${idx + 1}`}
                    style={{
                      width: isActive ? 20 : 6,
                      height: 6,
                      borderRadius: 3,
                      background: isActive ? '#ffffff' : 'rgba(255,255,255,0.4)',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Services & Promotions (Top 3 items) */}
        <div className="card" style={{ borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 800, color: 'var(--se-text)' }}>
            {t('Services & Promotions', 'บริการและโปรโมชั่นพิเศษ')}
          </h3>

          {promoItems.slice(0, 3).map((item) => (
            <Link
              key={item.id}
              to={`/portal/news/${item.id}`}
              style={{
                position: 'relative',
                borderRadius: 10,
                overflow: 'hidden',
                background: '#0f2038',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 88,
                textDecoration: 'none',
                color: '#ffffff',
              }}
            >
              {/* Background preview image */}
              <img
                src={item.imageUrl}
                alt=""
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: 0.28,
                  zIndex: 0,
                }}
              />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    color: '#38bdf8',
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  {item.tag}
                </span>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    lineHeight: 1.35,
                    color: '#ffffff',
                    marginBottom: 4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {item.title}
                </div>
              </div>
              <div style={{ position: 'relative', zIndex: 1, marginTop: 4 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    background: '#ffffff',
                    color: '#0f172a',
                    fontWeight: 700,
                    fontSize: 10.5,
                    padding: '3px 8px',
                    borderRadius: 4,
                  }}
                >
                  {t('Learn More', 'เรียนรู้เพิ่มเติม')} <ArrowRight size={10} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Toolbar: Category Chips, Search, Sort, View */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 18,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        {/* Left Filter Pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CATS.map((c) => {
            const isActive = cat === c.key;
            return (
              <button
                key={c.key}
                onClick={() => setCat(c.key)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: isActive ? '#0284c7' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--se-text-secondary)',
                  transition: 'all 0.15s ease',
                }}
              >
                {lang === 'th' ? c.th : c.en}
              </button>
            );
          })}
        </div>

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Search size={16} style={{ color: 'var(--se-text-muted)', cursor: 'pointer' }} onClick={() => setSearchOpen((s) => !s)} />
            {(searchOpen || q) && (
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('Search…', 'ค้นหา…')}
                style={{
                  border: '1px solid var(--se-border)',
                  borderRadius: 6,
                  padding: '4px 8px',
                  fontSize: 13,
                  width: 140,
                  background: 'var(--se-surface)',
                  color: 'var(--se-text)',
                }}
              />
            )}
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid var(--se-border)',
              background: 'var(--se-surface)',
              color: 'var(--se-text)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <option value="newest">{t('Newest First', 'ล่าสุดก่อน')}</option>
            <option value="oldest">{t('Oldest First', 'เก่าที่สุดก่อน')}</option>
          </select>

          {/* View mode buttons */}
          <div style={{ display: 'flex', border: '1px solid var(--se-border)', borderRadius: 6, overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                background: viewMode === 'grid' ? '#0284c7' : 'var(--se-surface)',
                color: viewMode === 'grid' ? '#ffffff' : 'var(--se-text-muted)',
                border: 'none',
                padding: '6px 8px',
                cursor: 'pointer',
                display: 'flex',
              }}
              title="Grid view"
            >
              <Grid size={15} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                background: viewMode === 'list' ? '#0284c7' : 'var(--se-surface)',
                color: viewMode === 'list' ? '#ffffff' : 'var(--se-text-muted)',
                border: 'none',
                padding: '6px 8px',
                cursor: 'pointer',
                display: 'flex',
              }}
              title="List view"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Left Cards (72%) + Right 4th Promo Card (28%) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: 20, alignItems: 'start' }}>
        {/* Left: Articles Grid */}
        <div>
          <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800, color: 'var(--se-text)' }}>
            {cat === 'all' ? 'Knowledge' : catLabel(cat, lang)}
          </h3>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Newspaper size={24} />}
              title={t('No articles match your search', 'ไม่พบบทความที่ตรงกับการค้นหา')}
              body={t('Try a different keyword or category.', 'ลองใช้คำค้นหรือหมวดหมู่อื่น')}
            />
          ) : viewMode === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 14 }}>
              {filtered.map((item) => (
                <Link
                  key={item.id}
                  to={`/portal/news/${item.id}`}
                  className="card"
                  style={{
                    borderRadius: 12,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{ position: 'relative', height: 130, background: '#1e293b', overflow: 'hidden' }}>
                    {item.imageUrl ? (
                      <img
                        src={`${base}${item.imageUrl.replace(/^\//, '')}`}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                        <Package size={28} />
                      </div>
                    )}
                    {item.featured && (
                      <span
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          background: '#f59e0b',
                          color: '#ffffff',
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                        }}
                      >
                        <Star size={9} fill="currentColor" /> {t('Featured', 'แนะนำ')}
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--se-primary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        {item.category === 'tips' ? 'KNOWLEDGE' : (CAT_LABELS[item.category]?.labelEn || item.category.toUpperCase())}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--se-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={11} /> {fmtDate(item.date, lang)}
                      </span>
                    </div>

                    <h4
                      style={{
                        margin: '0 0 6px',
                        fontSize: 13,
                        fontWeight: 700,
                        lineHeight: 1.35,
                        color: 'var(--se-text)',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {lang === 'th' ? item.titleTh : item.title}
                    </h4>

                    <p
                      style={{
                        margin: '0 0 10px',
                        fontSize: 12,
                        lineHeight: 1.5,
                        color: 'var(--se-text-secondary)',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        flex: 1,
                      }}
                    >
                      {item.summary}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card" style={{ borderRadius: 12, padding: 6 }}>
              {filtered.map((item) => (
                <Link
                  key={item.id}
                  to={`/portal/news/${item.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    borderBottom: '1px solid var(--se-border)',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <div style={{ width: 64, height: 44, borderRadius: 6, overflow: 'hidden', background: '#0f172a', flexShrink: 0 }}>
                    {item.imageUrl && (
                      <img src={`${base}${item.imageUrl.replace(/^\//, '')}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lang === 'th' ? item.titleTh : item.title}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--se-text-muted)', marginTop: 2 }}>
                      {item.category.toUpperCase()} · {fmtDate(item.date, lang)}
                    </div>
                  </div>
                  <ArrowRight size={14} style={{ color: 'var(--se-text-muted)', flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right: Continuation of Services & Promotions (Item 4) */}
        <div>
          <Link
            to={`/portal/news/${promoItems[3].id}`}
            style={{
              position: 'relative',
              borderRadius: 12,
              overflow: 'hidden',
              background: '#0f2038',
              padding: '16px 16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 180,
              textDecoration: 'none',
              color: '#ffffff',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <img
              src={promoItems[3].imageUrl}
              alt=""
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.35,
                zIndex: 0,
              }}
            />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  color: '#38bdf8',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                {promoItems[3].tag}
              </span>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  lineHeight: 1.35,
                  color: '#ffffff',
                  marginBottom: 8,
                }}
              >
                {promoItems[3].title}
              </div>
              <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, margin: 0 }}>
                {promoItems[3].sub}
              </p>
            </div>
            <div style={{ position: 'relative', zIndex: 1, marginTop: 14 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: '#ffffff',
                  color: '#0f172a',
                  fontWeight: 700,
                  fontSize: 11,
                  padding: '5px 12px',
                  borderRadius: 4,
                }}
              >
                {t('Learn More', 'เรียนรู้เพิ่มเติม')} <ArrowRight size={11} />
              </span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function NewsDetailPage() {
  const { id } = useParams();
  const { lang, t } = useLang();
  const navigate = useNavigate();
  const base = import.meta.env.BASE_URL;

  // If id is not specified or not found, fall back to Grundfos article
  const article = (id ? getArticle(id) : undefined) || getArticle('NW-2026-025')!;

  const [relatedIndex, setRelatedIndex] = useState(0);

  // 4 Services & Promotions items for the right sidebar matching Image 4
  const promoSidebarItems = useMemo(
    () => [
      {
        id: 'NW-2026-032',
        tag: 'SERVICES',
        title: 'SE SOLAR ROOFTOP SOLUTIONS | TURN SOLAR...',
        sub: '► ชมวิดีโอ: SE Solar Rooftop Solutions บน YouTube Reduce electricity costs, improv...',
        imageUrl: `${base}assets/news/prd-03.jpg`,
      },
      {
        id: 'NW-2026-033',
        tag: 'SERVICES',
        title: 'SAVE ENERGY. REDUCE COSTS. WITH BOOST ENERGY...',
        sub: 'Your pumping system could be consuming more energy than necessary - without...',
        imageUrl: `${base}assets/news/prd-01.jpg`,
      },
      {
        id: 'NW-2026-034',
        tag: 'SERVICES',
        title: 'FIRE PUMP PERFORMANCE TEST | VERIFY PERFORMANCE...',
        sub: 'Having a Fire Pump does not necessarily mean your system is fully prepared for a...',
        imageUrl: `${base}assets/news/prd-06.jpg`,
      },
      {
        id: 'NW-2026-030',
        tag: 'SERVICES',
        title: 'SE OVERHAUL SERVICE - EXTEND EQUIPMENT LIFE,...',
        sub: 'A pump that is still running does not necessarily mean it is operating at its best...',
        imageUrl: `${base}assets/news/prd-02.jpg`,
      },
    ],
    [base],
  );

  // Related articles pool matching Image 4 bottom
  const relatedArticles = useMemo(
    () => [
      {
        id: 'NW-2026-028',
        tag: 'Knowledge',
        date: '10 Aug 2026',
        title: 'WHY CHOOSE GRUNDFOS GENUINE PARTS?',
      },
      {
        id: 'NW-2026-030',
        tag: 'Services',
        date: '6 Aug 2026',
        title: 'SE OVERHAUL SERVICE – EXTEND EQUIPMENT LIFE, REDUCE DOWNTIME',
      },
      {
        id: 'NW-2026-031',
        tag: 'Promotions',
        date: '1 Aug 2026',
        title: 'AUGUST FLASH SALE – SAVE UP TO 50%!',
      },
    ],
    [],
  );

  return (
    <div style={{ paddingBottom: 48 }}>
      {/* Back to all news */}
      <button
        onClick={() => navigate('/portal/news')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'none',
          border: 'none',
          color: 'var(--se-text-secondary)',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          padding: '6px 0',
          marginBottom: 14,
        }}
      >
        <ArrowLeft size={15} />
        {t('All news', 'ข่าวทั้งหมด')}
      </button>

      {/* Main 2-Column Layout matching Image 4 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: 20, alignItems: 'start' }}>
        {/* Left Column: Article Body + Related Articles */}
        <div>
          <div className="card" style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 24, boxShadow: 'var(--shadow-card)' }}>
            {/* Header Hero Image */}
            <div style={{ width: '100%', height: 280, background: '#0f172a', overflow: 'hidden' }}>
              <img
                src={`${base}${(article.imageUrl || 'assets/news/prd-01.jpg').replace(/^\//, '')}`}
                alt={article.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
              />
            </div>

            {/* Content Container */}
            <div style={{ padding: '24px 28px 32px' }}>
              {/* Badges row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <span
                  style={{
                    background: '#f1f5f9',
                    color: '#475569',
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 4,
                  }}
                >
                  {article.category === 'products' ? 'Products' : catLabel(article.category, lang)}
                </span>
                <span style={{ fontSize: 12.5, color: 'var(--se-text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Calendar size={13} />
                  {fmtDate(article.date, lang)}
                </span>
              </div>

              {/* Title */}
              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  lineHeight: 1.35,
                  margin: '0 0 18px',
                  color: 'var(--se-text)',
                }}
              >
                {lang === 'th' ? article.titleTh : article.title}
              </h1>

              {/* Summary lead paragraph */}
              <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--se-text)', fontWeight: 400, marginBottom: 18 }}>
                {article.summary}
              </p>

              {/* Structured Body Content matching Grundfos Document */}
              <div style={{ borderTop: '1px solid var(--se-border)', paddingTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: '6px 0 0', color: 'var(--se-text)' }}>
                  Why Choose Grundfos for Industrial Applications?
                </h3>

                <div>
                  <h4 style={{ fontSize: 13.5, fontWeight: 700, margin: '0 0 4px', color: 'var(--se-text)' }}>
                    Built for Long-Term Performance
                  </h4>
                  <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--se-text-secondary)', margin: 0 }}>
                    Grundfos pumps are engineered with advanced technology and durable materials to withstand demanding industrial operating conditions and deliver reliable performance over the long term.
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: 13.5, fontWeight: 700, margin: '0 0 4px', color: 'var(--se-text)' }}>
                    Energy-Efficient Operation
                  </h4>
                  <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--se-text-secondary)', margin: 0 }}>
                    Equipped with Variable Frequency Drives (VFDs) and high-efficiency motors, Grundfos pumping systems help optimize energy consumption and reduce operating costs.
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: 13.5, fontWeight: 700, margin: '0 0 4px', color: 'var(--se-text)' }}>
                    Comprehensive Industrial Solutions
                  </h4>
                  <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--se-text-secondary)', margin: '0 0 6px' }}>
                    Grundfos offers products designed for a broad range of industries, including:
                  </p>
                  <ul style={{ margin: '0 0 0 18px', padding: 0, fontSize: 13.5, lineHeight: 1.7, color: 'var(--se-text-secondary)' }}>
                    <li>Food & Beverage</li>
                    <li>Wastewater Treatment</li>
                    <li>Heating and Cooling Systems</li>
                    <li>Chemical Processing and Fluid Handling</li>
                  </ul>
                </div>

                <div>
                  <h4 style={{ fontSize: 13.5, fontWeight: 700, margin: '0 0 4px', color: 'var(--se-text)' }}>
                    Smart Monitoring with IoT
                  </h4>
                  <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--se-text-secondary)', margin: 0 }}>
                    Grundfos CONNECT and Grundfos iSOLUTIONS enable real-time pump monitoring, diagnostics, and control through intelligent IoT-based technologies, helping improve operational efficiency and predictive maintenance.
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: 13.5, fontWeight: 700, margin: '0 0 4px', color: 'var(--se-text)' }}>
                    Grundfos Product Range
                  </h4>
                  <ul style={{ margin: '0 0 0 18px', padding: 0, fontSize: 13.5, lineHeight: 1.7, color: 'var(--se-text-secondary)' }}>
                    <li>Centrifugal Pumps</li>
                    <li>Multistage Pumps</li>
                    <li>Dosing Pumps</li>
                    <li>Wastewater Pumps</li>
                  </ul>
                </div>

                <div>
                  <h4 style={{ fontSize: 13.5, fontWeight: 700, margin: '0 0 4px', color: 'var(--se-text)' }}>
                    Grundfos: A Smart Investment for Sustainable Industry
                  </h4>
                  <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--se-text-secondary)', margin: 0 }}>
                    Choosing Grundfos means investing in more than just reliable pumping equipment. It means improving operational efficiency, reducing energy costs, and supporting long-term sustainability goals. Contact our team to learn more about the right pumping solution for your business.
                  </p>
                </div>

                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--se-text)' }}>Learn more :</div>
                  <a
                    href="https://siameastsolutions.com/en/our-products/pumping/grundfos-3/"
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 13, color: '#0284c7', textDecoration: 'none', wordBreak: 'break-all' }}
                  >
                    https://siameastsolutions.com/en/our-products/pumping/grundfos-3/
                  </a>
                </div>

                <div style={{ marginTop: 6, fontSize: 13, color: 'var(--se-text-secondary)' }}>
                  <strong style={{ color: 'var(--se-text)' }}>Contact Us:</strong>
                  <br />
                  Tel: 063-393-5088 | Line: @siameast | Email: info@siameastsolutions.com
                </div>
              </div>
            </div>
          </div>

          {/* Related Articles Section */}
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--se-text)' }}>
              {t('Related articles', 'บทความที่เกี่ยวข้อง')}
            </h3>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setRelatedIndex((prev) => Math.max(0, prev - 1))}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  border: '1px solid var(--se-border)',
                  background: 'var(--se-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--se-text-muted)',
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setRelatedIndex((prev) => prev + 1)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  border: '1px solid var(--se-border)',
                  background: 'var(--se-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--se-text-muted)',
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {relatedArticles.map((rel) => (
              <Link
                key={rel.id}
                to={`/portal/news/${rel.id}`}
                className="card"
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--se-primary)', textTransform: 'uppercase' }}>
                    {rel.tag}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--se-text-muted)' }}>{rel.date}</span>
                </div>
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    lineHeight: 1.35,
                    color: 'var(--se-text)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {rel.title}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right Sidebar: Services & Promotions (All 4 items) */}
        <div className="card" style={{ borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 800, color: 'var(--se-text)' }}>
            {t('Services & Promotions', 'บริการและโปรโมชั่นพิเศษ')}
          </h3>

          {promoSidebarItems.map((item) => (
            <Link
              key={item.id}
              to={`/portal/news/${item.id}`}
              style={{
                position: 'relative',
                borderRadius: 10,
                overflow: 'hidden',
                background: '#0f2038',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 100,
                textDecoration: 'none',
                color: '#ffffff',
              }}
            >
              <img
                src={item.imageUrl}
                alt=""
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: 0.28,
                  zIndex: 0,
                }}
              />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    color: '#38bdf8',
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  {item.tag}
                </span>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    lineHeight: 1.35,
                    color: '#ffffff',
                    marginBottom: 4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {item.title}
                </div>
              </div>
              <div style={{ position: 'relative', zIndex: 1, marginTop: 4 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    background: '#ffffff',
                    color: '#0f172a',
                    fontWeight: 700,
                    fontSize: 10.5,
                    padding: '3px 8px',
                    borderRadius: 4,
                  }}
                >
                  {t('Learn More', 'เรียนรู้เพิ่มเติม')} <ArrowRight size={10} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer matching Image 4 */}
      <div
        style={{
          marginTop: 48,
          paddingTop: 18,
          borderTop: '1px solid var(--se-border)',
          textAlign: 'center',
          color: 'var(--se-text-muted)',
          fontSize: 12,
        }}
      >
        SE Connex - Customer Portal v1.23.0. All companies, assets, tickets and figures shown are demonstration data.
      </div>
    </div>
  );
}
