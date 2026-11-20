import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { ArrowLeft, ArrowRight, Calendar, ChevronDown, ChevronLeft, ChevronRight, LayoutGrid, LayoutList, Leaf, Lightbulb, Megaphone, Newspaper, Package, Search, Star, Tag, Wrench, X } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { EmptyState } from '@/components/common';
import { fmtDate, newsExcerpt } from '@/utils/format';
import { apiGetNewsFeed, ApiError, type NewsFeedItemResponse } from '@/lib/apiClient';
import { tokenStore } from '@/lib/tokenStore';
import type { Lang } from '@/types';
import { ArticleDetailBody } from './ArticleDetailBody';

const DEFAULT_CAT_STYLE = { icon: Newspaper, bg: 'linear-gradient(140deg, #2b3038, #171a1f)' };

// Keyed by NewsCategory.label (the stable slug from se_connex.NewsCategory,
// e.g. 039_pg_se_connex_news_category.sql's seed rows) — any category an
// Admin adds later that isn't in this map falls back to DEFAULT_CAT_STYLE.
const CAT_STYLE: Record<string, { icon: typeof Newspaper; bg: string }> = {
  company: { icon: Megaphone, bg: 'linear-gradient(140deg, #2b3038, #171a1f)' },
  news: { icon: Megaphone, bg: 'linear-gradient(140deg, #2b3038, #171a1f)' },
  products: { icon: Package, bg: 'linear-gradient(140deg, #1d4ed8, #172554)' },
  promotions: { icon: Tag, bg: 'linear-gradient(140deg, var(--se-primary), #0c3c69)' },
  tips: { icon: Lightbulb, bg: 'linear-gradient(140deg, #b06a00, #6b4400)' },
  knowledge: { icon: Lightbulb, bg: 'linear-gradient(140deg, #b06a00, #6b4400)' },
  events: { icon: Calendar, bg: 'linear-gradient(140deg, #0f766e, #134e4a)' },
  service: { icon: Wrench, bg: 'linear-gradient(140deg, #0369a1, #0c4a6e)' },
  sustainability: { icon: Leaf, bg: 'linear-gradient(140deg, #15803d, #14532d)' },
};

function catStyle(slug: string) {
  return CAT_STYLE[slug] ?? DEFAULT_CAT_STYLE;
}

/** The date shown next to an article — startsAt (an admin-chosen display
 * date, see frontend-admin's NewsForm "Display from") if set, else
 * createdAt. createdAt is never null so this always resolves to a real
 * date. publishedAt is deliberately not used here — it stays purely an
 * internal ordering signal (the feed is already sorted by it server-side,
 * see backend's NewsRepository.public_feed). Exported for
 * DashboardPage.tsx's "News & offers" card, which shows the same field. */
export function newsDisplayDate(n: Pick<NewsFeedItemResponse, 'startsAt' | 'createdAt'>): string {
  return n.startsAt ?? n.createdAt;
}

/** Recency key used to rank the feed "newest first" — startsAt (admin's
 * chosen "Display from" date) if set, else publishedAt. publishedAt is
 * always present for items in the feed (public_feed() only returns
 * status='published' articles, and publishedAt is stamped the moment an
 * article is first published — see backend's services/news.py), so this
 * always resolves to a real instant; createdAt is only a last-resort guard
 * for publishedAt's nullable type. */
function newsSortTime(n: Pick<NewsFeedItemResponse, 'startsAt' | 'publishedAt' | 'createdAt'>): number {
  return new Date(n.startsAt ?? n.publishedAt ?? n.createdAt).getTime();
}

function useNewsFeed() {
  const [items, setItems] = useState<NewsFeedItemResponse[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const accessToken = tokenStore.read()?.accessToken;
    if (!accessToken) return;
    apiGetNewsFeed(accessToken)
      // Server returns published_at DESC, but "newest" here is ranked by
      // newsSortTime (startsAt, falling back to publishedAt) — re-sort once
      // here so every consumer of `items` (hero, sidebar, main list, related
      // articles) shares one consistent "newest first" order.
      .then((data) => setItems([...data].sort((a, b) => newsSortTime(b) - newsSortTime(a))))
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Could not load news.');
      });
  }, []);

  return { items, error };
}

/** Sidebar picks — only Admin-curated NewsFeedItemResponse.isSidebar
 * articles (newest first — `items` is already sorted by newsSortTime in
 * useNewsFeed), excluding whatever's already shown above the fold (e.g. the
 * article currently open on the detail page). No fallback to other
 * articles — if nothing is flagged, NewsSidebar renders nothing (see its
 * `articles.length === 0` check below). */
function pickSidebarArticles(items: NewsFeedItemResponse[], excludeIds: Set<string>, count = 4): NewsFeedItemResponse[] {
  return items.filter((n) => n.category === 'service' && n.isSidebar && !excludeIds.has(n.id)).slice(0, count);
}

/** Related-article picks for the detail page — Tag match first (ranked by
 * number of shared tags, ties broken by recency via newsSortTime), falling
 * back to same Category when the article has no tags or shares none with
 * any other article, falling back to most-recent-other when neither matches
 * (`items` is already sorted by newsSortTime in useNewsFeed, so a plain
 * slice preserves "most recent"). */
function relatedArticles(items: NewsFeedItemResponse[], article: NewsFeedItemResponse, count = 2): NewsFeedItemResponse[] {
  const others = items.filter((n) => n.id !== article.id);
  const articleTagIds = new Set(article.tags.map((tg) => tg.id));

  if (articleTagIds.size > 0) {
    const scored = others
      .map((n) => ({ n, shared: n.tags.filter((tg) => articleTagIds.has(tg.id)).length }))
      .filter((x) => x.shared > 0)
      .sort((a, b) => b.shared - a.shared || (newsSortTime(b.n) - newsSortTime(a.n)));
    if (scored.length > 0) return scored.slice(0, count).map((x) => x.n);
  }

  const sameCategory = others.filter((n) => n.category === article.category).slice(0, count);
  if (sameCategory.length > 0) return sameCategory;

  return others.slice(0, count);
}

function NewsSidebar({ articles, lang, t }: { articles: NewsFeedItemResponse[]; lang: Lang; t: (en: string, th: string) => string }) {
  if (articles.length === 0) return null;
  return (
    <div className="news-sidebar-wrap">
      <div className="news-sidebar">
        <h3 className="news-sidebar-title">{t('Services', 'บริการ')}</h3>
        {articles.map((n) => {
          const style = catStyle(n.category);
          return (
            <Link key={n.id} to={`/portal/news/${n.id}`} className="sidebar-card" style={{ background: style.bg }}>
              <div className="sidebar-card-overlay" />
              {n.imageUrl && (
                <img
                  src={n.imageUrl}
                  alt=""
                  aria-hidden
                  className="cover-img"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', zIndex: 0 }}
                />
              )}
              <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                <div>
                  <div className="sidebar-card-tag">{lang === 'th' ? n.categoryLabelTh : n.categoryLabelEn}</div>
                  <h4 className="sidebar-card-title">{lang === 'th' ? n.titleTh : n.titleEn}</h4>
                  <p className="sidebar-card-sub">{newsExcerpt(lang === 'th' ? n.contentTh : n.contentEn)}</p>
                </div>
                <div className="sidebar-card-btn">
                  {t('Learn More', 'อ่านต่อ')} <ArrowRight size={13} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function NewsPage() {
  const { lang, t } = useLang();
  const { items, error } = useNewsFeed();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [heroIndex, setHeroIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(9);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Admin-curated via NewsFeedItemResponse.isBanner (newest first — `items`
  // is already sorted by newsSortTime in useNewsFeed). Badge text is the
  // article's category label — no separate "hero badge text" column needed.
  const heroItems = useMemo(() => (items ?? [])
    .filter((n) => n.isBanner)
    .map((n) => ({
      id: n.id,
      badge: lang === 'th' ? n.categoryLabelTh : n.categoryLabelEn,
      title: lang === 'th' ? n.titleTh : n.titleEn,
      desc: newsExcerpt(lang === 'th' ? n.contentTh : n.contentEn),
      bg: catStyle(n.category).bg,
      imageUrl: n.imageUrl ?? undefined,
    })), [items, lang]);

  const currentHero = heroItems.length > 0 ? heroItems[heroIndex % heroItems.length] : undefined;

  // Auto-advance the hero carousel every 5s, same as the dots' manual step —
  // only when there's more than one banner article to cycle through.
  useEffect(() => {
    if (heroItems.length < 2) return;
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroItems.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroItems.length]);

  const cats = useMemo(() => {
    const seen = new Map<string, { key: string; en: string; th: string }>();
    for (const n of items ?? []) {
      if (!seen.has(n.category)) seen.set(n.category, { key: n.category, en: n.categoryLabelEn, th: n.categoryLabelTh });
    }
    return [{ key: 'all', en: 'All', th: 'ทั้งหมด' }, ...seen.values()];
  }, [items]);

  const filtered = useMemo(() => {
    let result = (items ?? []).filter((n) => {
      if (cat !== 'all' && n.category !== cat) return false;
      const hay = `${n.titleEn} ${n.titleTh}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
    // `items` is already sorted newest-first by newsSortTime (useNewsFeed),
    // so "oldest first" just reverses it.
    if (sortOrder === 'oldest') result = [...result].reverse();
    return result;
  }, [items, q, cat, sortOrder]);

  const displayedArticles = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  // "All" splits the visible articles into one group per category, headed by
  // the category name. Map insertion order = first appearance in
  // displayedArticles, so groups follow the active sort order.
  const groupedArticles = useMemo(() => {
    const groups = new Map<string, { key: string; en: string; th: string; items: NewsFeedItemResponse[] }>();
    for (const n of displayedArticles) {
      const g = groups.get(n.category);
      if (g) g.items.push(n);
      else groups.set(n.category, { key: n.category, en: n.categoryLabelEn, th: n.categoryLabelTh, items: [n] });
    }
    return [...groups.values()];
  }, [displayedArticles]);

  const sidebarArticles = useMemo(() => pickSidebarArticles(items ?? [], new Set<string>()), [items]);

  function resetPaging() {
    setVisibleCount(9);
  }

  function renderArticles(list: NewsFeedItemResponse[]) {
    return viewMode === 'grid' ? (
      <div className="news-grid">
        {list.map((n) => {
          const style = catStyle(n.category);
          const Icon = style.icon;
          return (
            <Link key={n.id} to={`/portal/news/${n.id}`} className="news-card">
              <div className="news-card-thumb" style={{ background: style.bg }}>
                {n.imageUrl ? (
                  <img src={n.imageUrl} alt={lang === 'th' ? n.titleTh : n.titleEn} className="cover-img" />
                ) : (
                  <Icon size={38} strokeWidth={1.4} />
                )}
                {n.isBanner && (
                  <span className="news-featured-badge">
                    <Star size={10} fill="currentColor" />
                    {t('Featured', 'แนะนำ')}
                  </span>
                )}
              </div>
              <div className="news-card-body">
                <div className="news-card-header">
                  <span className="news-card-cat">{lang === 'th' ? n.categoryLabelTh : n.categoryLabelEn}</span>
                  <span className="news-card-date">
                    <Calendar size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
                    {fmtDate(newsDisplayDate(n), lang)}
                  </span>
                </div>
                <h4 className="news-card-title">{lang === 'th' ? n.titleTh : n.titleEn}</h4>
                <p className="news-card-desc">{newsExcerpt(lang === 'th' ? n.contentTh : n.contentEn)}</p>
                <span className="news-card-link">
                  {t('Read More', 'อ่านต่อ')} <ArrowRight size={13} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    ) : (
      <div className="card" style={{ padding: '4px 4px', marginBottom: 20, overflow: 'hidden' }}>
        {list.map((n) => {
          const Icon = catStyle(n.category).icon;
          return (
            <Link key={n.id} to={`/portal/news/${n.id}`} className="news-row">
              <span className="news-row-thumb" style={{ background: catStyle(n.category).bg }} aria-hidden>
                {n.imageUrl ? (
                  <img src={n.imageUrl} alt="" className="cover-img" />
                ) : (
                  <Icon size={20} strokeWidth={1.6} style={{ color: '#fff' }} />
                )}
              </span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span className="fw-600" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {lang === 'th' ? n.titleTh : n.titleEn}
                </span>
                <span className="muted small">
                  {lang === 'th' ? n.categoryLabelTh : n.categoryLabelEn} ·{' '}
                  <Calendar size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
                  {fmtDate(newsDisplayDate(n), lang)}
                </span>
              </span>
              <ArrowRight size={15} aria-hidden style={{ color: 'var(--se-text-muted)', flex: '0 0 auto' }} />
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">{t('News & Offers', 'ข่าวสารและข้อเสนอ')}</h1>
          <p className="page-sub">{t('Updates, promotions and maintenance know-how from SiamEast Solutions.', 'ข่าว โปรโมชั่น และความรู้งานซ่อมบำรุงจากสยามอีสท์ โซลูชั่น')}</p>
        </div>
      </div>

      <div className="news-layout">
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {currentHero && (
            <div className="news-hero" style={{ background: currentHero.bg }}>
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

              <div key={heroIndex} className="news-hero-content">
                <span className="news-hero-badge">{currentHero.badge}</span>
                <h2 className="news-hero-title">{currentHero.title}</h2>
                <p className="news-hero-sub">{currentHero.desc}</p>
                <Link to={`/portal/news/${currentHero.id}`} className="news-hero-btn">
                  {t('Learn More', 'เรียนรู้เพิ่มเติม')} <ArrowRight size={15} />
                </Link>
              </div>

              {heroItems.length > 1 && (
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
              )}
            </div>
          )}

          <div className="news-toolbar">
            <div className="news-chips">
              {cats.map((c) => (
                <button
                  key={c.key}
                  className={`news-chip ${cat === c.key ? 'active' : ''}`}
                  onClick={() => { setCat(c.key); resetPaging(); }}
                >
                  {lang === 'th' ? c.th : c.en}
                </button>
              ))}
            </div>

            <div className="news-controls-right">
              <div
                className={`news-search${searchOpen || q ? ' is-open' : ''}`}
                onMouseEnter={() => setSearchOpen(true)}
                onMouseLeave={() => { if (!q) setSearchOpen(false); }}
              >
                <div className="news-search-inner">
                  <button
                    type="button"
                    className="news-search-trigger"
                    onClick={() => {
                      setSearchOpen(true);
                      requestAnimationFrame(() => searchInputRef.current?.focus());
                    }}
                    aria-label={t('Search articles…', 'ค้นหาบทความ…')}
                    title={t('Search articles…', 'ค้นหาบทความ…')}
                  >
                    <Search size={16} aria-hidden />
                  </button>
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="news-search-input"
                    value={q}
                    onChange={(e) => { setQ(e.target.value); resetPaging(); }}
                    placeholder={t('Search articles…', 'ค้นหาบทความ…')}
                    onFocus={() => setSearchOpen(true)}
                    onBlur={() => { if (!q) setSearchOpen(false); }}
                  />
                  {q && (
                    <button
                      type="button"
                      className="news-search-clear"
                      onClick={() => { setQ(''); setSearchOpen(false); }}
                      aria-label={t('Clear search', 'ล้างคำค้นหา')}
                    >
                      <X size={14} aria-hidden />
                    </button>
                  )}
                </div>
              </div>

              <select
                className="news-sort-select"
                value={sortOrder}
                onChange={(e) => { setSortOrder(e.target.value as 'newest' | 'oldest'); resetPaging(); }}
              >
                <option value="newest">{t('Newest First', 'ล่าสุดก่อน')}</option>
                <option value="oldest">{t('Oldest First', 'เก่าที่สุดก่อน')}</option>
              </select>

              <div className="news-view-group">
                <button
                  type="button"
                  className={`news-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title={t('Grid view', 'มุมมองแบบการ์ด')}
                >
                  <LayoutGrid size={17} />
                </button>
                <button
                  type="button"
                  className={`news-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title={t('List view', 'มุมมองแบบรายการ')}
                >
                  <LayoutList size={17} />
                </button>
              </div>
            </div>
          </div>

          {error && (
            <EmptyState
              icon={<Newspaper size={24} />}
              title={t('Could not load news', 'โหลดข่าวไม่สำเร็จ')}
              body={error}
            />
          )}

          {!error && items === null && <p className="muted">{t('Loading…', 'กำลังโหลด…')}</p>}

          {items !== null && filtered.length === 0 && (
            <EmptyState
              icon={<Newspaper size={24} />}
              title={t('No articles match your search', 'ไม่พบบทความที่ตรงกับการค้นหา')}
              body={t('Try a different keyword or category.', 'ลองใช้คำค้นหรือหมวดหมู่อื่น')}
              action={
                <button className="btn btn-outline btn-sm" onClick={() => { setQ(''); setCat('all'); resetPaging(); }}>
                  {t('Clear filters', 'ล้างตัวกรอง')}
                </button>
              }
            />
          )}

          {filtered.length > 0 && (
            <>
              {cat === 'all' ? (
                groupedArticles.map((g, i) => (
                  <section key={g.key} style={{ marginTop: i === 0 ? 0 : 10 }}>
                    <h3 style={{ margin: '0 0 14px', fontSize: 18, fontWeight: 800 }}>
                      {lang === 'th' ? g.th : g.en}
                    </h3>
                    {renderArticles(g.items)}
                  </section>
                ))
              ) : (
                renderArticles(displayedArticles)
              )}

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
            </>
          )}
        </div>

        <NewsSidebar articles={sidebarArticles} lang={lang} t={t} />
      </div>
    </div>
  );
}

// Must mirror backend/app/core/utils.py's _Html allowlist (bleach) and
// frontend-admin's RichTextEditor sanitizer — the editor + backend already
// sanitize on write, this is the render-side defense-in-depth copy.
// `div` + `class` back frontend-admin's "HTML block" editor node (a pasted
// vendor HTML/CSS snippet) — `data-*` needs no listing, DOMPurify allows it
// by default (`ALLOW_DATA_ATTR`).

const CONTENT_TAGS = [
  'p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'span', 'div',
  'a', 'img', 'h1', 'h2', 'h3', 'blockquote', 'pre', 'code', 'hr', 's',
  // Table support — see the matching group in frontend-admin's
  // RichTextEditor.tsx and backend/app/core/utils.py's _Html allowlist.
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
];
const CONTENT_ATTR = ['style', 'href', 'src', 'alt', 'target', 'rel', 'colspan', 'rowspan', 'class'];

function sanitizeContent(html: string): string {
  // No ALLOWED_URI_REGEXP override: DOMPurify's default safe-scheme check
  // covers http/https/mailto/tel/relative and strips javascript:/data:.
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: CONTENT_TAGS, ALLOWED_ATTR: CONTENT_ATTR });
}

export function NewsDetailPage() {
  const { id } = useParams();
  const { lang, t } = useLang();
  const navigate = useNavigate();
  const { items } = useNewsFeed();
  const [relatedIndex, setRelatedIndex] = useState(0);

  // Reset the related-articles carousel whenever the article itself changes
  // (NewsDetailPage doesn't remount between /news/:id navigations).
  useEffect(() => {
    setRelatedIndex(0);
  }, [id]);

  if (items === null) {
    return <p className="muted">{t('Loading…', 'กำลังโหลด…')}</p>;
  }

  const article = items.find((n) => n.id === id);

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

  // A larger pool than the 3-up carousel shows at once, so the chevrons have
  // something to page through — still ranked by relatedArticles' tag/category
  // match, just not truncated to a single page's worth.
  const relatedPool = relatedArticles(items, article, 9);
  const maxRelatedIndex = Math.max(0, relatedPool.length - 3);
  const clampedRelatedIndex = Math.min(relatedIndex, maxRelatedIndex);
  const visibleRelated = relatedPool.slice(clampedRelatedIndex, clampedRelatedIndex + 3);
  const style = catStyle(article.category);
  const Icon = style.icon;
  const sidebarArticles = pickSidebarArticles(items, new Set([article.id]));

  return (
    <div>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/portal/news')} style={{ marginBottom: 12, marginLeft: -8 }}>
        <ArrowLeft size={16} aria-hidden />
        {t('Back', 'กลับ')}
      </button>

      <div className="news-layout" style={{ alignItems: 'start' }}>
        <div style={{ minWidth: 0 }}>
          <ArticleDetailBody
            article={article}
            lang={lang}
            t={t}
            displayDate={newsDisplayDate(article)}
            catIcon={<Icon size={56} strokeWidth={1.2} />}
            catBg={style.bg}
            sanitizeContent={sanitizeContent}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>
              {t('Related articles', 'บทความที่เกี่ยวข้อง')}
            </h3>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="related-nav-btn"
                onClick={() => setRelatedIndex((prev) => Math.max(0, prev - 1))}
                disabled={clampedRelatedIndex === 0}
                aria-label={t('Previous', 'ก่อนหน้า')}
                title={t('Previous', 'ก่อนหน้า')}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                className="related-nav-btn"
                onClick={() => setRelatedIndex((prev) => Math.min(maxRelatedIndex, prev + 1))}
                disabled={clampedRelatedIndex >= maxRelatedIndex}
                aria-label={t('Next', 'ถัดไป')}
                title={t('Next', 'ถัดไป')}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="grid-3" style={{ marginBottom: 24 }}>
            {visibleRelated.map((n) => (
              <Link key={n.id} to={`/portal/news/${n.id}`} className="related-clean-card">
                <div className="related-clean-header">
                  <span className="related-clean-badge">{lang === 'th' ? n.categoryLabelTh : n.categoryLabelEn}</span>
                  <span className="related-clean-date">
                    <Calendar size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
                    {fmtDate(newsDisplayDate(n), lang)}
                  </span>
                </div>
                <h4 className="related-clean-title">{lang === 'th' ? n.titleTh : n.titleEn}</h4>
              </Link>
            ))}
          </div>
        </div>

        <NewsSidebar articles={sidebarArticles} lang={lang} t={t} />
      </div>
    </div>
  );
}
