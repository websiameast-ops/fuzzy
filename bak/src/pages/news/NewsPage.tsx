import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Leaf, Lightbulb, Megaphone, Newspaper, Package, Tag } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useCompany } from '@/contexts/CompanyContext';
import { mockNews, getArticle } from '@/data/mockNews';
import { EmptyState, SearchBox, ContactSECard } from '@/components/common';
import { fmtDate } from '@/utils/format';
import type { NewsCategory } from '@/types';

const CATS: { key: NewsCategory | 'all'; en: string; th: string }[] = [
  { key: 'all', en: 'All', th: 'ทั้งหมด' },
  { key: 'company', en: 'Company news', th: 'ข่าวบริษัท' },
  { key: 'products', en: 'Products', th: 'ผลิตภัณฑ์' },
  { key: 'promotions', en: 'Promotions', th: 'โปรโมชั่น' },
  { key: 'tips', en: 'Maintenance tips', th: 'เคล็ดลับงานซ่อมบำรุง' },
  { key: 'sustainability', en: 'Sustainability', th: 'ความยั่งยืน' },
];

const CAT_STYLE: Record<NewsCategory, { icon: typeof Newspaper; bg: string }> = {
  company: { icon: Megaphone, bg: 'linear-gradient(140deg, #2b3038, #171a1f)' },
  products: { icon: Package, bg: 'linear-gradient(140deg, #1d4ed8, #172554)' },
  promotions: { icon: Tag, bg: 'linear-gradient(140deg, var(--se-primary), #0c3c69)' },
  tips: { icon: Lightbulb, bg: 'linear-gradient(140deg, #b06a00, #6b4400)' },
  sustainability: { icon: Leaf, bg: 'linear-gradient(140deg, #15803d, #14532d)' },
};

/** Pull a punchy headline for an offer card: a percentage/discount if present, else a short label. */
function offerHeadline(n: { title: string; titleTh: string }, lang: 'en' | 'th'): string {
  const src = `${n.title} ${n.titleTh}`;
  const pct = src.match(/(\d{1,3})\s*%/);
  if (pct) return lang === 'th' ? `ลด ${pct[1]}%` : `${pct[1]}% OFF`;
  if (/free|ฟรี/i.test(src)) return lang === 'th' ? 'ฟรี' : 'FREE';
  if (/no service fee|no fee|waive|ไม่มีค่าบริการ/i.test(src)) return lang === 'th' ? 'ยกเว้นค่าบริการ' : 'FEE WAIVED';
  if (/credit|reward|เครดิต|สิทธิพิเศษ/i.test(src)) return lang === 'th' ? 'รับเครดิต' : 'EARN CREDIT';
  return lang === 'th' ? 'ข้อเสนอ' : 'OFFER';
}

function catLabel(key: NewsCategory, lang: 'en' | 'th') {
  const c = CATS.find((x) => x.key === key)!;
  return lang === 'th' ? c.th : c.en;
}

export function NewsPage() {
  const { lang, t } = useLang();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<NewsCategory | 'all'>('all');

  const filtered = useMemo(() => {
    return mockNews.filter((n) => {
      if (cat !== 'all' && n.category !== cat) return false;
      const hay = `${n.title} ${n.titleTh} ${n.summary}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [q, cat]);

  const offers = filtered.filter((n) => n.category === 'promotions');
  const nonOffers = filtered.filter((n) => n.category !== 'promotions');
  const featured = nonOffers.find((n) => n.featured);
  const rest = nonOffers.filter((n) => n !== featured);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('News & Offers', 'ข่าวสารและข้อเสนอ')}</h1>
          <p className="page-sub">{t('Updates, promotions and maintenance know-how from SiamEast Solutions.', 'ข่าว โปรโมชั่น และความรู้งานซ่อมบำรุงจากสยามอีสท์ โซลูชั่น')}</p>
        </div>
        <div className="page-actions">
          <SearchBox value={q} onChange={setQ} placeholder={t('Search articles…', 'ค้นหาบทความ…')} />
        </div>
      </div>

      <div className="chip-row" style={{ marginBottom: 18 }}>
        {CATS.map((c) => (
          <button key={c.key} className={`chip ${cat === c.key ? 'active' : ''}`} onClick={() => setCat(c.key)} aria-pressed={cat === c.key}>
            {lang === 'th' ? c.th : c.en}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
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
      )}

      {/* Offers strip — promotions surfaced first, big and scannable */}
      {offers.length > 0 && (
        <>
          <div className="flex between" style={{ marginBottom: 8 }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Tag size={17} aria-hidden style={{ color: 'var(--se-accent)' }} />
              {t('Current offers', 'ข้อเสนอปัจจุบัน')}
            </h3>
            <span className="muted small">{t(`${offers.length} live`, `${offers.length} รายการ`)}</span>
          </div>
          <div className="offers-strip">
            {offers.map((n) => (
              <Link key={n.id} to={`/portal/news/${n.id}`} className="offer-card" style={{ background: CAT_STYLE[n.category].bg }}>
                <span className="offer-tag">{offerHeadline(n, lang)}</span>
                <span className="offer-title">{lang === 'th' ? n.titleTh : n.title}</span>
                <span className="offer-until">{fmtDate(n.date, lang)} · {n.readMins} {t('min', 'นาที')}</span>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Featured long-read */}
      {featured && (
        <Link to={`/portal/news/${featured.id}`} className="card" style={{ display: 'flex', textDecoration: 'none', color: 'inherit', marginBottom: 18, overflow: 'hidden' }}>
          <div className="news-thumb" style={{ background: CAT_STYLE[featured.category].bg, width: 150, minWidth: 150, height: 'auto' }} aria-hidden>
            {(() => {
              const Icon = CAT_STYLE[featured.category].icon;
              return <Icon size={40} strokeWidth={1.2} />;
            })()}
          </div>
          <div style={{ padding: 16 }}>
            <div className="flex" style={{ gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <span className="badge t-brand">{t('Featured', 'บทความแนะนำ')}</span>
              <span className="muted small">{fmtDate(featured.date, lang)} · {featured.readMins} {t('min read', 'นาที')}</span>
            </div>
            <h3 style={{ margin: '0 0 4px' }}>{lang === 'th' ? featured.titleTh : featured.title}</h3>
            <p className="muted small" style={{ margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{featured.summary}</p>
          </div>
        </Link>
      )}

      {/* Everything else — compact list, not cards */}
      {rest.length > 0 && (
        <>
          <h3 style={{ margin: '0 0 4px' }}>{t('Latest articles', 'บทความล่าสุด')}</h3>
          <div className="card" style={{ padding: '4px 4px' }}>
            {rest.map((n) => {
              const Icon = CAT_STYLE[n.category].icon;
              return (
                <Link key={n.id} to={`/portal/news/${n.id}`} className="news-row">
                  <span
                    aria-hidden
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 40, minWidth: 40, height: 40, borderRadius: 10,
                      background: CAT_STYLE[n.category].bg, color: '#fff',
                    }}
                  >
                    <Icon size={18} strokeWidth={1.6} />
                  </span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span className="fw-600" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lang === 'th' ? n.titleTh : n.title}
                    </span>
                    <span className="muted small">{catLabel(n.category, lang)} · {fmtDate(n.date, lang)} · {n.readMins} {t('min', 'นาที')}</span>
                  </span>
                  <ArrowRight size={15} aria-hidden style={{ color: 'var(--se-text-muted)', flex: '0 0 auto' }} />
                </Link>
              );
            })}
          </div>
        </>
      )}
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
