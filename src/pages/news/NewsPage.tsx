import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { ArrowLeft, ArrowRight, Calendar, ChevronDown, ChevronLeft, ChevronRight, Grid, Leaf, Lightbulb, List, Megaphone, Newspaper, Package, Search, Star, Tag, X } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { EmptyState, ContactSECard, Modal } from '@/components/common';
import { fmtDate, newsExcerpt } from '@/utils/format';
import { apiGetNewsFeed, apiGetSEContacts, ApiError, type NewsFeedItemResponse, type SEContactResponse } from '@/lib/apiClient';
import { tokenStore } from '@/lib/tokenStore';
import type { Lang } from '@/types';

const DEFAULT_CAT_STYLE = { icon: Newspaper, bg: 'linear-gradient(140deg, #2b3038, #171a1f)' };

// Keyed by NewsCategory.label (the stable slug from se_connex.NewsCategory,
// e.g. 039_pg_se_connex_news_category.sql's seed rows) — any category an
// Admin adds later that isn't in this map falls back to DEFAULT_CAT_STYLE.
const CAT_STYLE: Record<string, { icon: typeof Newspaper; bg: string }> = {
  company: { icon: Megaphone, bg: 'linear-gradient(140deg, #2b3038, #171a1f)' },
  products: { icon: Package, bg: 'linear-gradient(140deg, #1d4ed8, #172554)' },
  promotions: { icon: Tag, bg: 'linear-gradient(140deg, var(--se-primary), #0c3c69)' },
  tips: { icon: Lightbulb, bg: 'linear-gradient(140deg, #b06a00, #6b4400)' },
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
  return items.filter((n) => n.isSidebar && !excludeIds.has(n.id)).slice(0, count);
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
        <h3 className="news-sidebar-title">{t('Services & Promotions', 'บริการและโปรโมชั่นพิเศษ')}</h3>
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
      <div className="card" style={{ padding: '4px 4px', marginBottom: 20 }}>
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
        <div style={{ display: 'flex', flexDirection: 'column' }}>
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
              {/* Expandable search — right-aligned, expands to the left on
                  hover/focus without pushing the sort/view controls. Reuses
                  the page's existing q/setQ state (was previously a static
                  SearchBox in the page header). */}
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
                    style={{ display: 'flex', color: searchOpen || q ? 'var(--se-primary)' : 'var(--se-text-muted)', flex: '0 0 auto', cursor: 'pointer' }}
                    onClick={() => setSearchOpen(true)}
                    title={t('Search articles…', 'ค้นหาบทความ…')}
                  >
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    value={q}
                    onChange={(e) => { setQ(e.target.value); resetPaging(); }}
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
                    <button
                      onClick={() => { setQ(''); setSearchOpen(false); }}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: 'var(--se-text-muted)' }}
                      aria-label={t('Clear search', 'ล้างคำค้นหา')}
                    >
                      <X size={14} />
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
  const [seContacts, setSeContacts] = useState<SEContactResponse[] | null>(null);
  const [imgOpen, setImgOpen] = useState(false);
  const [relatedIndex, setRelatedIndex] = useState(0);

  useEffect(() => {
    const accessToken = tokenStore.read()?.accessToken;
    if (!accessToken) return;
    apiGetSEContacts(accessToken).then(setSeContacts).catch(() => {});
  }, []);

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
  const Icon = catStyle(article.category).icon;
  const content = lang === 'th' ? article.contentTh : article.contentEn;
  const sidebarArticles = pickSidebarArticles(items, new Set([article.id]));

  return (
    <div>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/portal/news')} style={{ marginBottom: 12, marginLeft: -8 }}>
        <ArrowLeft size={16} aria-hidden />
        {t('All news', 'ข่าวทั้งหมด')}
      </button>

      <div className="news-layout">
        <div>
          <div className="card" style={{ overflow: 'hidden', marginBottom: 18 }}>
            <div className="news-thumb" style={{ background: catStyle(article.category).bg, height: 260 }} aria-hidden={!article.imageUrl}>
              {article.imageUrl ? (
                <button
                  type="button"
                  onClick={() => setImgOpen(true)}
                  aria-label={t('View image', 'ดูรูปภาพ')}
                  style={{ border: 'none', background: 'none', padding: 0, width: '100%', height: '100%', cursor: 'pointer', display: 'block' }}
                >
                  <img src={article.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ) : (
                <Icon size={56} strokeWidth={1.2} />
              )}
            </div>
            <div style={{ padding: '28px 32px 32px' }}>
              <div className="flex" style={{ gap: 10, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="badge t-grey" style={{ background: 'var(--se-grey-soft)', padding: '4px 10px', borderRadius: 4, fontWeight: 700 }}>
                  {lang === 'th' ? article.categoryLabelTh : article.categoryLabelEn}
                </span>
                <span className="muted small" style={{ fontSize: 13 }}>
                  <Calendar size={13} style={{ marginRight: 4, verticalAlign: -1 }} />
                  {fmtDate(newsDisplayDate(article), lang)}
                </span>
              </div>
              <h1 style={{ margin: '0 0 14px', fontSize: 24, fontWeight: 800, lineHeight: 1.3 }}>{lang === 'th' ? article.titleTh : article.titleEn}</h1>
              <div style={{ borderTop: '1px solid var(--se-border)', paddingTop: 18, marginTop: 18 }}>
                <div className="news-content" style={{ lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: sanitizeContent(content) }} />
              </div>
            </div>
          </div>

          {article.imageUrl && (
            <Modal open={imgOpen} onClose={() => setImgOpen(false)} title={lang === 'th' ? article.titleTh : article.titleEn} large>
              <img src={article.imageUrl} alt="" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 8 }} />
            </Modal>
          )}

          {/* <div className="card" style={{ padding: 18, marginBottom: 18 }}>
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
            <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
              {(seContacts ?? []).map((c) => (
                <ContactSECard
                  key={c.id}
                  name={`${c.firstName} ${c.lastName}`}
                  role={c.contactRole}
                  phone={c.phone ?? ''}
                  email={c.email ?? ''}
                  line={c.line ?? undefined}
                />
              ))}
            </div>
          </div> */}

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
