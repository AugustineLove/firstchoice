'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Star, X, Phone, Loader2, ChevronLeft,
  ChevronRight as ChevronRightIcon, ShieldCheck, MessageCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

// ════════════════════════════════════════════
// PRODUCT DETAIL PAGE — browse & contact, not checkout.
//
// This is a listing page, closer to Jiji than to a food-delivery item
// screen: photos, specs, price as a reference figure, and a way to
// reach the seller. There is NO cart, NO "add to order", NO addons or
// quantity — nothing here gets submitted through the platform. The
// only action on this page is contacting the vendor directly (call or
// WhatsApp), which is why it's the one thing pinned to the bottom bar.
//
// Variant groups (colour, storage, etc.) are shown as informational
// chips — tapping one just swaps the gallery to that variant's own
// photos when it has them (see ProductVariant.images in the schema).
// There's no "required" validation or price math to run, because
// nothing is being priced into an order.
// ════════════════════════════════════════════

const CATEGORY_STYLE = {
  food:        { emoji: '🍛', tintA: '#ECFDF5', tintB: '#D1FAE5', accent: '#10B981' },
  grocery:     { emoji: '🛒', tintA: '#F0FDF4', tintB: '#DCFCE7', accent: '#16A34A' },
  pharmacy:    { emoji: '💊', tintA: '#EFF6FF', tintB: '#DBEAFE', accent: '#3B82F6' },
  boutique:    { emoji: '👗', tintA: '#FDF2F8', tintB: '#FCE7F3', accent: '#EC4899' },
  electronics: { emoji: '📱', tintA: '#EEF2FF', tintB: '#E0E7FF', accent: '#6366F1' },
  drinks:      { emoji: '🥤', tintA: '#FFF7ED', tintB: '#FFEDD5', accent: '#F97316' },
  default:     { emoji: '📦', tintA: '#F9FAFB', tintB: '#F3F4F6', accent: '#9CA3AF' },
};
function categoryStyle(category) {
  return CATEGORY_STYLE[category?.toLowerCase()] || CATEGORY_STYLE.default;
}

function money(n) {
  return `GHS ${Number(n || 0).toFixed(2)}`;
}

function relativeDate(iso) {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

// Normalizes a GH phone number to international digits for tel:/wa.me
// links, e.g. "0244123456" -> "233244123456".
function toIntlPhone(phone) {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('233')) return digits;
  if (digits.startsWith('0')) return `233${digits.slice(1)}`;
  return digits;
}

// Turns the structured rich fields on Product (weight, volume, sku,
// colors, sizes...) plus any free-form ProductAttribute rows into one
// flat list of { label, value } spec lines, so the specs table doesn't
// care which of the two sources a given fact came from.
function buildSpecs(product) {
  if (!product) return [];
  const specs = [];
  if (product.brand) specs.push({ label: 'Brand', value: product.brand });
  if (product.sku) specs.push({ label: 'Model / SKU', value: product.sku });
  if (product.weight != null) specs.push({ label: 'Weight', value: `${product.weight}g` });
  if (product.volume != null) specs.push({ label: 'Volume', value: `${product.volume}ml` });
  if (product.unit) specs.push({ label: 'Unit', value: product.unit });
  if (product.colors?.length) specs.push({ label: 'Colours available', value: product.colors.join(', ') });
  if (product.sizes?.length) specs.push({ label: 'Sizes available', value: product.sizes.join(', ') });
  if (product.tags?.length) specs.push({ label: 'Tags', value: product.tags.join(', ') });
  for (const attr of product.attributes || []) specs.push({ label: attr.key, value: attr.value });
  return specs;
}

export default function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const { theme } = useTheme();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [reviewSummary, setReviewSummary] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  // Which variant's photos the gallery is currently showing — purely a
  // display choice, not a "selection" that feeds a price or a cart.
  const [activeVariant, setActiveVariant] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const scrollerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await authFetch(`/products/${productId}`);
        const json = await res.json();
        if (cancelled) return;
        if (json.success) setProduct(json.data);
        else setError(json.message || 'Could not load this product.');
      } catch {
        if (!cancelled) setError('Could not reach the server.');
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [authFetch, productId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingReviews(true);
      try {
        const [sRes, rRes] = await Promise.all([
          authFetch(`/products/${productId}/reviews/summary`),
          authFetch(`/products/${productId}/reviews`),
        ]);
        const [sJson, rJson] = await Promise.all([sRes.json(), rRes.json()]);
        if (cancelled) return;
        if (sJson.success) setReviewSummary(sJson.data);
        if (rJson.success) setReviews(rJson.data);
      } catch {
        // non-fatal — page still works without reviews
      }
      if (!cancelled) setLoadingReviews(false);
    })();
    return () => { cancelled = true; };
  }, [authFetch, productId]);

  const variantGroups = useMemo(() => (product?.variantGroups || []).map(g => ({
    ...g,
    variants: (g.variants || []).filter(v => v.available !== false),
  })).filter(g => g.variants.length > 0), [product]);

  const gallery = useMemo(() => {
    const variantImages = activeVariant?.images || [];
    if (variantImages.length > 0) return variantImages;
    return product?.images?.length ? product.images : [];
  }, [product, activeVariant]);

  useEffect(() => { setActiveImage(0); }, [activeVariant?.id]);

  const specs = useMemo(() => buildSpecs(product), [product]);

  async function submitReview(stars, comment) {
    const res = await authFetch(`/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating: stars, comment }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Could not submit your review.');
    setReviews((prev) => {
      const withoutMine = prev.filter((r) => r.id !== json.data.id);
      return [json.data, ...withoutMine];
    });
    setReviewSummary((prev) => {
      const others = reviews.filter((r) => r.customer?.id !== json.data.customer?.id);
      const allRatings = [...others.map(r => r.rating), stars];
      const count = allRatings.length;
      const average = count ? allRatings.reduce((s, r) => s + r, 0) / count : 0;
      return { ...prev, average: Number(average.toFixed(2)), count, myReview: json.data };
    });
  }

  const cat = categoryStyle(product?.category);
  const vendorPhoneIntl = toIntlPhone(product?.vendor?.phone);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8faf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={26} style={{ animation: 'spin 1s linear infinite', color: theme.green }} />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8faf8', padding: 20 }}>
        <button onClick={() => navigate(-1)} className="pdp-back-inline"><ArrowLeft size={16} /> Back</button>
        <p style={{ color: '#dc2626', marginTop: 20 }}>{error || 'Product not found.'}</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8faf8', fontFamily: "'DM Sans', system-ui, sans-serif", paddingBottom: 100 }}>

      {/* ── GALLERY ── */}
      <div className="pdp-gallery">
        <button onClick={() => navigate(-1)} className="pdp-back"><ArrowLeft size={18} color="#0f1117" /></button>

        {gallery.length > 0 ? (
          <>
            <div
              className="pdp-gallery__scroller"
              ref={scrollerRef}
              onScroll={(e) => {
                const w = e.currentTarget.clientWidth;
                const idx = Math.round(e.currentTarget.scrollLeft / w);
                if (idx !== activeImage) setActiveImage(idx);
              }}
            >
              {gallery.map((src, i) => (
                <div key={i} className="pdp-gallery__slide" style={{ backgroundImage: `url(${src})` }} />
              ))}
            </div>

            {gallery.length > 1 && (
              <>
                <div className="pdp-gallery__dots">
                  {gallery.map((_, i) => (
                    <button
                      key={i}
                      className={`pdp-gallery__dot ${i === activeImage ? 'pdp-gallery__dot--active' : ''}`}
                      onClick={() => {
                        const el = scrollerRef.current;
                        if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
                      }}
                      aria-label={`Photo ${i + 1}`}
                    />
                  ))}
                </div>
                <button
                  className="pdp-gallery__arrow pdp-gallery__arrow--left"
                  onClick={() => { const el = scrollerRef.current; if (el) el.scrollTo({ left: Math.max(0, (activeImage - 1) * el.clientWidth), behavior: 'smooth' }); }}
                ><ChevronLeft size={18} /></button>
                <button
                  className="pdp-gallery__arrow pdp-gallery__arrow--right"
                  onClick={() => { const el = scrollerRef.current; if (el) el.scrollTo({ left: Math.min((gallery.length - 1) * el.clientWidth, (activeImage + 1) * el.clientWidth), behavior: 'smooth' }); }}
                ><ChevronRightIcon size={18} /></button>
              </>
            )}
          </>
        ) : (
          <div className="pdp-gallery__placeholder" style={{ background: `linear-gradient(135deg, ${cat.tintA}, ${cat.tintB})` }}>
            <span style={{ fontSize: 64 }}>{cat.emoji}</span>
          </div>
        )}
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 20px' }}>

        {/* ── HEADER ── */}
        <div style={{ marginTop: 16 }}>
          {product.brand && <div style={{ fontSize: 12, fontWeight: 700, color: cat.accent, textTransform: 'uppercase', letterSpacing: 0.4 }}>{product.brand}</div>}
          <h1 style={{ fontSize: 21, fontWeight: 900, color: '#0f1117', margin: '4px 0 6px', lineHeight: 1.25 }}>{product.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: theme.green }}>{money(product.price)}</span>
            {reviewSummary?.count > 0 && (
              <button
                type="button"
                onClick={() => document.getElementById('pdp-reviews')?.scrollIntoView({ behavior: 'smooth' })}
                className="pdp-rating-chip"
              >
                <Star size={12} fill="#f59e0b" color="#f59e0b" />
                {reviewSummary.average.toFixed(1)} <span style={{ color: '#9ca3af' }}>({reviewSummary.count})</span>
              </button>
            )}
            {product.stock > 0 ? (
              <span className="pdp-stock-chip pdp-stock-chip--in">In stock</span>
            ) : (
              <span className="pdp-stock-chip pdp-stock-chip--out">Out of stock</span>
            )}
          </div>
          {product.description && <p style={{ fontSize: 13.5, color: '#6b7280', lineHeight: 1.6, margin: '12px 0 0' }}>{product.description}</p>}
        </div>

        {/* ── VARIANT PHOTO SWITCHER (informational only — no pricing) ── */}
        {variantGroups.map((g) => (
          <div key={g.id} className="pdp-group">
            <div className="pdp-group__header"><span>{g.name}</span></div>
            <div className="pdp-variant-grid">
              {g.variants.map((v) => {
                const active = activeVariant?.id === v.id;
                return (
                  <button
                    type="button"
                    key={v.id}
                    className={`pdp-variant-chip ${active ? 'pdp-variant-chip--active' : ''}`}
                    onClick={() => setActiveVariant(active ? null : v)}
                  >
                    {v.images?.[0] && <span className="pdp-variant-chip__swatch" style={{ backgroundImage: `url(${v.images[0]})` }} />}
                    <span className="pdp-variant-chip__name">{v.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* ── SPECS ── */}
        {specs.length > 0 && (
          <div className="pdp-group">
            <div className="pdp-group__header"><span>Specifications</span></div>
            <div className="pdp-specs">
              {specs.map((s, i) => (
                <div key={i} className="pdp-specs__row">
                  <span className="pdp-specs__label">{s.label}</span>
                  <span className="pdp-specs__value">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SELLER ── */}
        <div className="pdp-group">
          <div className="pdp-group__header"><span>Sold by</span></div>
          <div className="pdp-seller-card">
            <div className="pdp-seller-card__avatar">
              {product.vendor?.logo
                ? <img src={product.vendor.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : (product.vendor?.businessName || '?').trim()[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f1117' }}>{product.vendor?.businessName || 'Vendor'}</div>
              {product.vendor?.rating != null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <Star size={12} fill="#f59e0b" color="#f59e0b" />
                  <span style={{ fontSize: 12, color: '#6b7280' }}>{Number(product.vendor.rating).toFixed(1)} vendor rating</span>
                </div>
              )}
              {product.vendor?.address && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{product.vendor.address}</div>}
            </div>
            <ShieldCheck size={18} color="#10b981" />
          </div>
          <p style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 8, lineHeight: 1.5 }}>
            This platform doesn't process the sale — reach out to the seller directly to arrange payment and pickup or delivery.
          </p>
        </div>

        {/* ── REVIEWS ── */}
        <div id="pdp-reviews" style={{ marginTop: 32 }}>
          <div className="pdp-group__header" style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 16, fontWeight: 800 }}>Ratings & Reviews</span>
          </div>

          {loadingReviews ? (
            <div style={{ height: 80, borderRadius: 14, background: '#f3f4f6' }} />
          ) : (
            <>
              <ReviewSummaryBlock summary={reviewSummary} theme={theme} onWriteReview={() => setReviewModalOpen(true)} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
                {reviews.length === 0 && (
                  <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: '16px 0' }}>No reviews yet — be the first to share your experience.</p>
                )}
                {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── STICKY CONTACT BAR — the only action on this page ── */}
      <div className="pdp-footer">
        <a
          href={vendorPhoneIntl ? `tel:+${vendorPhoneIntl}` : undefined}
          className="pdp-contact-btn"
          style={{ opacity: vendorPhoneIntl ? 1 : 0.5, pointerEvents: vendorPhoneIntl ? 'auto' : 'none' }}
        >
          <Phone size={16} /> Call seller
        </a>
        <a
          href={vendorPhoneIntl ? `https://wa.me/${vendorPhoneIntl}?text=${encodeURIComponent(`Hi! Is "${product.name}" still available?`)}` : undefined}
          target="_blank" rel="noreferrer"
          className="pdp-contact-btn pdp-contact-btn--whatsapp"
          style={{ opacity: vendorPhoneIntl ? 1 : 0.5, pointerEvents: vendorPhoneIntl ? 'auto' : 'none' }}
        >
          <MessageCircle size={16} /> WhatsApp
        </a>
      </div>

      {reviewModalOpen && (
        <WriteReviewModal
          productName={product.name}
          existing={reviewSummary?.myReview}
          theme={theme}
          onClose={() => setReviewModalOpen(false)}
          onSubmit={async (stars, comment) => { await submitReview(stars, comment); setReviewModalOpen(false); }}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        .pdp-back-inline {
          display: flex; align-items: center; gap: 6px; background: none; border: none;
          font-family: inherit; font-size: 13px; font-weight: 700; color: #374151; cursor: pointer;
        }

        .pdp-gallery { position: relative; width: 100%; aspect-ratio: 1 / 1; max-height: 420px; background: #f3f4f6; }
        .pdp-back {
          position: absolute; top: 16px; left: 16px; z-index: 3; width: 38px; height: 38px; border-radius: 50%;
          background: #fff; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 10px rgba(0,0,0,0.15);
        }
        .pdp-gallery__scroller {
          display: flex; width: 100%; height: 100%; overflow-x: auto; scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch; scrollbar-width: none;
        }
        .pdp-gallery__scroller::-webkit-scrollbar { display: none; }
        .pdp-gallery__slide {
            flex: 0 0 100%;
            height: 100%;
            background-size: contain;
            background-position: center;
            background-repeat: no-repeat;
            scroll-snap-align: start;
            background-color: #fff;
            }
        .pdp-gallery__placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
        .pdp-gallery__dots {
          position: absolute; bottom: 14px; left: 0; right: 0; display: flex; justify-content: center; gap: 6px; z-index: 2;
        }
        .pdp-gallery__dot {
          width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.55); border: none; cursor: pointer; padding: 0;
        }
        .pdp-gallery__dot--active { background: #fff; width: 18px; border-radius: 3px; }
        .pdp-gallery__arrow {
          position: absolute; top: 50%; transform: translateY(-50%); width: 32px; height: 32px; border-radius: 50%;
          background: rgba(255,255,255,0.85); border: none; display: flex; align-items: center; justify-content: center;
          cursor: pointer; z-index: 2;
        }
        .pdp-gallery__arrow--left { left: 12px; }
        .pdp-gallery__arrow--right { right: 12px; }

        .pdp-rating-chip {
          display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; color: #0f1117;
          background: #f3f4f6; border: none; border-radius: 50px; padding: 4px 10px; cursor: pointer; font-family: inherit;
        }
        .pdp-stock-chip { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 50px; }
        .pdp-stock-chip--in { color: #166534; background: #ecfdf5; }
        .pdp-stock-chip--out { color: #b91c1c; background: #fef2f2; }

        .pdp-group { margin: 22px 0; }
        .pdp-group__header {
          display: flex; align-items: center; justify-content: space-between;
          font-size: 13px; font-weight: 800; color: #0f1117; margin-bottom: 10px;
        }

        .pdp-variant-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .pdp-variant-chip {
          display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 12px;
          border: 1px solid #e5e7eb; background: #fff; cursor: pointer; font-family: inherit;
        }
        .pdp-variant-chip--active { border-color: #10b981; background: #f0fdf4; }
        .pdp-variant-chip__swatch { width: 22px; height: 22px; border-radius: 6px; background-size: cover; background-position: center; flex-shrink: 0; }
        .pdp-variant-chip__name { font-size: 13px; font-weight: 700; color: #0f1117; }

        .pdp-specs { background: #fff; border: 1px solid #f0f0f0; border-radius: 14px; overflow: hidden; }
        .pdp-specs__row { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 10px 14px; border-bottom: 1px solid #f6f6f6; }
        .pdp-specs__row:last-child { border-bottom: none; }
        .pdp-specs__label { font-size: 12.5px; color: #9ca3af; flex-shrink: 0; }
        .pdp-specs__value { font-size: 12.5px; font-weight: 700; color: #0f1117; text-align: right; }

        .pdp-seller-card {
          display: flex; align-items: center; gap: 12px; background: #fff; border: 1px solid #f0f0f0;
          border-radius: 14px; padding: 14px;
        }
        .pdp-seller-card__avatar {
          width: 44px; height: 44px; border-radius: 50%; background: #ecfdf5; color: #10b981;
          display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px;
          flex-shrink: 0; overflow: hidden;
        }

        .pdp-contact-btn {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; height: 48px;
          border-radius: 12px; border: 1px solid #e5e7eb; background: #f9fafb; color: #374151;
          font-size: 13.5px; font-weight: 800; text-decoration: none; cursor: pointer;
        }
        .pdp-contact-btn--whatsapp { border: none; color: #fff; background: #25D366; }

        .pdp-footer {
          position: fixed; left: 0; right: 0; bottom: 0; z-index: 10;
          display: flex; align-items: center; gap: 10px; padding: 12px 20px calc(12px + env(safe-area-inset-bottom));
          background: #fff; border-top: 1px solid #f0f0f0;
        }
      `}</style>
    </div>
  );
}

/* ════════════════════════════════════════════
   REVIEWS — summary block, individual card, write-review modal
   (unchanged in behaviour — still product-level, still name + avatar
   initial only, no reviewer contact info)
════════════════════════════════════════════ */
function StarRow({ value, size = 14, interactive = false, onChange }) {
  const [hover, setHover] = useState(0);
  const display = interactive && hover ? hover : value;
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n}
          onMouseEnter={() => interactive && setHover(n)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => interactive && onChange?.(n)}
          style={{ cursor: interactive ? 'pointer' : 'default', display: 'flex' }}
        >
          <Star size={size} fill={n <= display ? '#f59e0b' : 'none'} color={n <= display ? '#f59e0b' : '#d1d5db'} />
        </span>
      ))}
    </div>
  );
}

function ReviewSummaryBlock({ summary, theme, onWriteReview }) {
  const average = summary?.average ?? 0;
  const count = summary?.count ?? 0;
  const breakdown = summary?.breakdown ?? { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const myReview = summary?.myReview;

  return (
    <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 16, padding: 18 }}>
      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#0f1117', lineHeight: 1 }}>{average.toFixed(1)}</div>
          <StarRow value={Math.round(average)} size={14} />
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{count} review{count !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {[5, 4, 3, 2, 1].map((star) => {
            const n = breakdown[star] || 0;
            const pct = count ? Math.round((n / count) * 100) : 0;
            return (
              <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, color: '#9ca3af', width: 8 }}>{star}</span>
                <div style={{ flex: 1, height: 5, borderRadius: 3, background: '#f3f4f6', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: '#f59e0b' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <button
        type="button"
        onClick={onWriteReview}
        style={{
          width: '100%', marginTop: 14, height: 40, borderRadius: 10, border: 'none',
          background: myReview ? '#f3f4f6' : theme.green, color: myReview ? '#374151' : '#fff',
          fontWeight: 800, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
        }}
      >
        {myReview ? 'Edit your review' : 'Write a review'}
      </button>
    </div>
  );
}

function ReviewCard({ review }) {
  const initial = (review.customer?.name || '?').trim()[0]?.toUpperCase() || '?';
  return (
    <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 14, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {review.customer?.profileImage ? (
          <img src={review.customer.profileImage} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: 34, height: 34, borderRadius: '50%', background: '#ecfdf5', color: '#10b981',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13,
          }}>{initial}</div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f1117' }}>{review.customer?.name || 'Customer'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
            <StarRow value={review.rating} size={11} />
            <span style={{ fontSize: 11, color: '#9ca3af' }}>{relativeDate(review.createdAt)}</span>
            {review.orderId && <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '1px 7px', borderRadius: 50 }}>Verified purchase</span>}
          </div>
        </div>
      </div>
      {review.comment && <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.5, margin: '10px 0 0' }}>{review.comment}</p>}
    </div>
  );
}

function WriteReviewModal({ productName, existing, theme, onClose, onSubmit }) {
  const [stars, setStars] = useState(existing?.rating || 0);
  const [comment, setComment] = useState(existing?.comment || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit() {
    if (stars < 1) { setError('Please select a star rating'); return; }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(stars, comment.trim());
    } catch (e) {
      setError(e.message || 'Could not submit your review.');
      setSubmitting(false);
    }
  }

  return (
    <div className="wrm-overlay" onClick={onClose}>
      <div className="wrm-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="wrm-close"><X size={16} color="#6b7280" /></button>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#0f1117', marginBottom: 2 }}>Review {productName}</div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 18 }}>You can only review a product once — make it count!</div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <StarRow value={stars} size={30} interactive onChange={setStars} />
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Optional — tell others what you thought"
          rows={3}
          style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, fontFamily: 'inherit', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', marginBottom: 12 }}
        />

        {error && <div style={{ color: '#dc2626', fontSize: 12, marginBottom: 10 }}>{error}</div>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            width: '100%', height: 46, border: 'none', borderRadius: 12, color: '#fff', fontWeight: 800,
            fontSize: 13, fontFamily: 'inherit', cursor: submitting ? 'default' : 'pointer',
            background: theme.green, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {submitting ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Submitting...</> : 'Submit Review'}
        </button>
      </div>
      <style>{`
        .wrm-overlay { position: fixed; inset: 0; z-index: 100; background: rgba(15,17,23,0.5); display: flex; align-items: center; justify-content: center; padding: 20px; }
        .wrm-card { background: #fff; width: 100%; max-width: 360px; border-radius: 20px; padding: 22px; position: relative; }
        .wrm-close { position: absolute; top: 14px; right: 14px; width: 28px; height: 28px; border-radius: 50%; border: none; background: #f3f4f6; display: flex; align-items: center; justify-content: center; cursor: pointer; }
      `}</style>
    </div>
  );
}