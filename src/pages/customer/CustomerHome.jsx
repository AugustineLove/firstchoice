'use client';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ShoppingBag, Star, MapPin, Loader2, Store, Search, X, Flame, TrendingUp, Package, Truck, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';

const CATEGORIES = [
  { label: 'All',         icon: '🏪', value: null,          bg: null,      fg: null },
  { label: 'Food',        icon: '🍛', value: 'Food',        bg: '#FFEDD5', fg: '#EA580C' },
  { label: 'Grocery',     icon: '🛒', value: 'Grocery',     bg: '#DCFCE7', fg: '#16A34A' },
  { label: 'Pharmacy',    icon: '💊', value: 'Pharmacy',    bg: '#DBEAFE', fg: '#2563EB' },
  { label: 'Electronics', icon: '📱', value: 'Electronics', bg: '#EDE9FE', fg: '#7C3AED' },
];

export default function CustomerHome() {
  const { user, authFetch } = useAuth();
  const { theme } = useTheme();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const [category, setCategory] = useState(null);

  // ── ONE vendor fetch, full unfiltered list. Category filtering happens
  // entirely client-side below (see `vendors` useMemo). This used to be a
  // separate `/vendors?category=X` fetch per category click, which had two
  // real problems: (1) it trusted the button's capitalized label ("Food")
  // to exact-match whatever casing the backend actually stores businessType
  // in — every other place in this file defensively lowercases businessType
  // before comparing, which only exists because that casing isn't reliable,
  // so the server-side filter could silently return zero results depending
  // on how a given vendor's type was saved; and (2) clicking categories
  // quickly could let an older, slower request resolve after a newer one
  // and overwrite it with stale results. Filtering a single already-loaded
  // list in memory can't race and can't miss on case.
  const [allVendors, setAllVendors] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const [allProducts, setAllProducts]                 = useState([]);
  const [productIndexBuilt, setProductIndexBuilt]     = useState(false);
  const [productIndexLoading, setProductIndexLoading] = useState(false);

  const [query, setQuery]           = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const firstName = user?.name?.split(' ')[0] || 'there';

  const loadVendors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/vendors');
      const json = await res.json();
      if (json.success) setAllVendors(json.data.vendors ?? json.data);
      else setError(json.message || 'Could not load vendors');
    } catch {
      setError('Could not reach the server. Check your connection.');
    }
    setLoading(false);
  }, [authFetch]);

  useEffect(() => { loadVendors(); }, [loadVendors]);

  // Case-insensitive, whitespace-tolerant match against businessType —
  // matches the defensive .toLowerCase() pattern used everywhere else in
  // this file for the exact same reason.
  const vendors = useMemo(() => {
    if (!category) return allVendors;
    const target = category.trim().toLowerCase();
    return allVendors.filter((v) => v.businessType?.trim().toLowerCase() === target);
  }, [allVendors, category]);

  const popular = useMemo(
    () => [...vendors].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 8),
    [vendors]
  );
  const trending = useMemo(() => [...vendors].reverse().slice(0, 8), [vendors]);

  const buildProductIndex = useCallback(async () => {
    if (productIndexBuilt || productIndexLoading || allVendors.length === 0) return;
    setProductIndexLoading(true);
    try {
      const res = await authFetch('/products');
      const json = await res.json();
      if (json.success) {
        setAllProducts(json.data.products ?? json.data);
        setProductIndexBuilt(true);
        setProductIndexLoading(false);
        return;
      }
      throw new Error('no bulk products endpoint');
    } catch {
      try {
        const perVendor = await Promise.all(
          allVendors.map((v) =>
            authFetch(`/products/vendor/${v.id}`)
              .then((r) => r.json())
              .then((j) => (j.success ? (j.data.products ?? j.data).map((p) => ({ ...p, vendorId: p.vendorId ?? v.id })) : []))
              .catch(() => [])
          )
        );
        setAllProducts(perVendor.flat());
      } catch {
        setAllProducts([]);
      }
      setProductIndexBuilt(true);
    }
    setProductIndexLoading(false);
  }, [authFetch, allVendors, productIndexBuilt, productIndexLoading]);

  function openSearch() {
    setSearchOpen(true);
    buildProductIndex();
  }

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const vendorNameMatches = allVendors.filter(
      (v) => v.businessName?.toLowerCase().includes(q) || v.businessType?.toLowerCase().includes(q)
    );

    const matchedProducts = allProducts.filter(
      (p) => p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)
    );

    const productsByVendor = new Map();
    matchedProducts.forEach((p) => {
      if (!p.vendorId) return;
      if (!productsByVendor.has(p.vendorId)) productsByVendor.set(p.vendorId, []);
      productsByVendor.get(p.vendorId).push(p.name);
    });

    const seen = new Set();
    const merged = vendorNameMatches.map((v) => {
      seen.add(v.id);
      return { vendor: v, matchedProducts: productsByVendor.get(v.id) || null };
    });
    productsByVendor.forEach((names, vendorId) => {
      if (seen.has(vendorId)) return;
      const vendor = allVendors.find((v) => v.id === vendorId);
      if (vendor) {
        merged.push({ vendor, matchedProducts: names });
        seen.add(vendorId);
      }
    });

    return merged;
  }, [query, allVendors, allProducts]);

  const showingSearch = searchOpen && query.trim().length > 0;

  // Responsive grid columns without relying on window.innerWidth at render
  // time (that only evaluates once per render pass and never reacts to an
  // actual resize — CSS handles this correctly on its own).
  const gridColsStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 };

  return (
    <div style={{ minHeight: '100vh', background: '#f8faf8', fontFamily: "'DM Sans', system-ui, sans-serif", paddingBottom: 88 }}>

      {/* ── TOP BAR ── */}
      <div className="fc-topbar">
        <div className="fc-topbar__row">

          <div className="fc-topbar__brand-row">
            <div className="fc-topbar__brand">
              <div className="fc-topbar__avatar">
                <span className="fc-topbar__avatar-ring" aria-hidden="true" />
                <img src="/icons/logo.png" alt="" className="fc-topbar__avatar-img" />
              </div>

              <div className="fc-topbar__wordmark">
                <span className="fc-topbar__wordmark-text">
                  First<span className="fc-topbar__wordmark-accent">Choice</span>
                </span>
                <span className="fc-topbar__wordmark-trail" aria-hidden="true">
                  <span /><span /><span />
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className="fc-topbar__notif"
              aria-label="Notifications"
            >
              <Bell size={20} color="#fff" strokeWidth={2.25} />
            </button>
          </div>

          <div className="fc-topbar__hero">
            <div className="fc-topbar__greeting">
              Hello, {firstName} <span aria-hidden="true">👋</span>
            </div>
            <div className="fc-topbar__subtitle">What would you like today?</div>
          </div>
        </div>

        <div className="fc-topbar__search-wrap">
          <div className="fc-topbar__search">
            <Search size={17} color="#9ca3af" style={{ position: 'absolute', left: 14, top: 14 }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={openSearch}
              placeholder="Search vendors or products..."
              className="fc-topbar__search-input"
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setSearchOpen(false); }}
                className="fc-topbar__search-clear"
                aria-label="Clear search"
              >
                <X size={18} color="#9ca3af" />
              </button>
            )}
          </div>
        </div>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Fraunces:ital,wght@1,500;1,600&display=swap');

          .fc-topbar {
            position: sticky;
            top: 0;
            z-index: 20;
            background:
              radial-gradient(circle, rgba(255,255,255,0.14) 1.5px, transparent 1.5px) 0 0 / 22px 22px,
              linear-gradient(135deg, #1B5E3B 0%, #0f3d26 100%);
            box-shadow: 0 6px 18px rgba(0,0,0,0.12);
          }

          .fc-topbar__row {
            max-width: 1100px;
            margin: 0 auto;
            padding: clamp(12px, 3vw, 16px) clamp(16px, 4vw, 20px) 10px;
          }

          .fc-topbar__brand-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }

          .fc-topbar__brand {
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 0;
          }

          .fc-topbar__avatar {
            position: relative;
            flex-shrink: 0;
            width: clamp(34px, 7vw, 38px);
            height: clamp(34px, 7vw, 38px);
          }

          .fc-topbar__avatar-ring {
            position: absolute;
            inset: -4px;
            border-radius: 50%;
            border: 1.5px solid rgba(255,255,255,0.5);
            animation: fc-pulse-ring 2.4s ease-in-out infinite;
          }

          .fc-topbar__avatar-img {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
            display: block;
            background: #fff;
            border: 2px solid rgba(255,255,255,0.35);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }

          .fc-topbar__wordmark {
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 0;
          }

          .fc-topbar__wordmark-text {
            font-family: 'Space Grotesk', 'Poppins', system-ui, sans-serif;
            font-weight: 700;
            font-size: clamp(15px, 3.6vw, 18px);
            letter-spacing: -0.4px;
            color: #fff;
            transform: skewX(-6deg);
            display: inline-block;
            white-space: nowrap;
          }

          .fc-topbar__wordmark-accent {
            background: linear-gradient(90deg, #ffe3a3, #f6c453);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .fc-topbar__wordmark-trail {
            display: flex;
            align-items: center;
            gap: 3px;
          }

          .fc-topbar__wordmark-trail span {
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: #f6c453;
            opacity: 0.55;
            animation: fc-dot-shine 1.2s ease-in-out infinite;
          }

          .fc-topbar__wordmark-trail span:nth-child(1) { animation-delay: 0s; }
          .fc-topbar__wordmark-trail span:nth-child(2) { animation-delay: 0.2s; }
          .fc-topbar__wordmark-trail span:nth-child(3) { animation-delay: 0.4s; }

          @keyframes fc-dot-shine {
            0%, 100% { opacity: 0.55; box-shadow: 0 0 0 rgba(246, 196, 83, 0); }
            50% { opacity: 1; box-shadow: 0 0 6px 1px rgba(246, 196, 83, 0.65); }
          }

          .fc-topbar__notif {
            flex-shrink: 0;
            width: clamp(36px, 8vw, 40px);
            height: clamp(36px, 8vw, 40px);
            border-radius: 50%;
            border: 1px solid rgba(255,255,255,0.25);
            background: rgba(255,255,255,0.12);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background 0.2s ease, transform 0.15s ease;
          }
          .fc-topbar__notif:hover { background: rgba(255,255,255,0.2); }
          .fc-topbar__notif:active { transform: scale(0.94); }
          .fc-topbar__notif:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }

          .fc-topbar__hero {
            margin-top: clamp(14px, 3.5vw, 20px);
          }

          .fc-topbar__greeting {
            font-family: 'Fraunces', Georgia, serif;
            font-style: italic;
            font-weight: 600;
            font-size: clamp(22px, 5.8vw, 28px);
            color: #fff;
            line-height: 1.15;
            letter-spacing: -0.2px;
          }

          .fc-topbar__subtitle {
            margin-top: 4px;
            font-size: clamp(12.5px, 2.8vw, 14px);
            color: rgba(255,255,255,0.78);
            font-weight: 500;
          }

          .fc-topbar__search-wrap {
            max-width: 1100px;
            margin: 0 auto;
            padding: 14px clamp(16px, 4vw, 20px) 18px;
          }

          .fc-topbar__search { position: relative; }

          .fc-topbar__search-input {
            width: 100%;
            height: 46px;
            border-radius: 14px;
            border: 1px solid transparent;
            background: #fff;
            padding-left: 40px;
            padding-right: 14px;
            font-family: inherit;
            font-size: 14px;
            box-sizing: border-box;
            outline: none;
            box-shadow: 0 4px 14px rgba(0,0,0,0.12);
            transition: box-shadow 0.2s ease, border-color 0.2s ease;
          }
          .fc-topbar__search-input:focus {
            border-color: #1B5E3B;
            box-shadow: 0 0 0 3px rgba(255,255,255,0.35), 0 4px 14px rgba(0,0,0,0.14);
          }

          .fc-topbar__search-clear {
            position: absolute;
            right: 10px;
            top: 14px;
            background: none;
            border: none;
            cursor: pointer;
            display: flex;
          }

          @keyframes fc-pulse-ring {
            0%, 100% { opacity: 0.55; transform: scale(1); }
            50% { opacity: 0; transform: scale(1.18); }
          }

          @media (prefers-reduced-motion: reduce) {
            .fc-topbar__avatar-ring { animation: none; }
            .fc-topbar__wordmark-trail span { animation: none; opacity: 0.85; }
          }
        `}</style>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>

        {/* ── CATEGORIES ── */}
        <h3 className="text-left" style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.06em', color: '#000', margin: '24px 0 12px' }}>
          SHOP BY CATEGORY
        </h3>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
          {CATEGORIES.map((cat) => {
            const active = category === cat.value;
            const bg = cat.bg ?? `${theme.green}18`;
            const fg = cat.fg ?? theme.green;
            return (
              <button
                key={cat.label}
                onClick={() => setCategory(cat.value)}
                className="flex flex-col items-center justify-center gap-1 transition-all"
                style={{
                  width: 84, height: 84, borderRadius: 20, flexShrink: 0, cursor: 'pointer',
                  background: bg, border: active ? `2px solid ${fg}` : '2px solid transparent',
                  boxShadow: active ? `0 6px 16px ${fg}33` : '0 1px 3px rgba(0,0,0,0.04)',
                  transform: active ? 'scale(1.03)' : 'scale(1)', fontFamily: 'inherit',
                }}
              >
                <span style={{ fontSize: 24 }}>{cat.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: fg }}>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── RANDOM DELIVERY REQUEST ── */}
        <div
          className="rounded-3xl"
          style={{
            marginTop: 22, padding: 22, position: 'relative', overflow: 'hidden',
            background: `linear-gradient(135deg, ${theme.green}, #0d9488)`, boxShadow: `0 12px 28px ${theme.green}40`,
          }}
        >
          <Truck size={110} color="rgba(255,255,255,0.12)" style={{ position: 'absolute', right: -10, bottom: -18, transform: 'rotate(-8deg)' }} />
          <h2 style={{ color: '#fff', fontSize: 17, fontWeight: 900, margin: 0, position: 'relative' }}>Need something picked up?</h2>
          <p className='text-left' style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, margin: '8px 0 16px', maxWidth: 320, lineHeight: 1.5, position: 'relative' }}>
            No need to shop. We can pick up and deliver any item for you. E.g. A document, a gift for a friend, or any personal item from any address.
          </p>
          <button
            onClick={() => navigate('/deliveries')}
            className="flex items-center gap-2"
            style={{
              background: '#fff', color: theme.green, fontWeight: 800, fontSize: 13, padding: '11px 20px',
              borderRadius: 50, border: 'none', cursor: 'pointer', position: 'relative',
            }}
          >
            Request a Pick-up <ArrowRight size={15} />
          </button>
        </div>

        {showingSearch ? (
          <SearchResults
            loading={productIndexLoading}
            query={query}
            results={searchResults}
            theme={theme}
            onVendorClick={(id) => navigate(`/vendor/${id}`)}
          />
        ) : (
          <>
            {!loading && popular.length > 0 && (
              <RailSection
                title="Popular"
                icon={<Flame size={16} color="#f97316" />}
                items={popular}
                onItemClick={(v) => navigate(`/vendor/${v.id}`)}
              />
            )}

            {!loading && trending.length > 0 && (
              <RailSection
                title="Trending Now"
                icon={<TrendingUp size={16} color="#3b82f6" />}
                items={trending}
                onItemClick={(v) => navigate(`/vendor/${v.id}`)}
              />
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '28px 0 14px' }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f1117', margin: 0 }}>
                {category ? `${category} Vendors` : 'All Vendors'}
              </h3>
              {!loading && !error && <span style={{ fontSize: 13, color: '#6b7280' }}>{vendors.length} found</span>}
            </div>

            {loading && (
              <div style={gridColsStyle}>
                {Array.from({ length: 4 }).map((_, i) => <VendorCardSkeleton key={i} />)}
              </div>
            )}

            {!loading && error && (
              <div style={{ textAlign: 'center', padding: 48 }}>
                <p style={{ color: '#6b7280', marginBottom: 12 }}>{error}</p>
                <button onClick={loadVendors} style={{ color: theme.green, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>Try again</button>
              </div>
            )}

            {!loading && !error && vendors.length === 0 && (
              <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>
                <Store size={36} style={{ marginBottom: 10 }} />
                <div style={{ fontWeight: 700 }}>No vendors found</div>
              </div>
            )}

            {!loading && !error && vendors.length > 0 && (
              <div style={gridColsStyle}>
                {vendors.map((v) => (
                  <VendorCard
                    key={v.id}
                    vendor={v}
                    onClick={() => navigate(`/vendor/${v.id}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ── SUBCOMPONENTS ── */

function RailSection({ title, icon, items, onItemClick }) {
  return (
    <div style={{ marginTop: 30 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        {icon}
        <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f1117', margin: 0 }}>{title}</h3>
      </div>
      <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8, scrollSnapType: 'x proximity' }}>
        {items.map((v) => (
          <BigVendorCard key={v.id} vendor={v} onClick={() => onItemClick(v)} />
        ))}
      </div>
    </div>
  );
}

function BigVendorCard({ vendor, onClick }) {
  const emoji = { food: '🍛', grocery: '🛒', pharmacy: '💊', boutique: '👗', electronics: '📱' }[vendor.businessType?.toLowerCase()] || '🏪';
  return (
    <div
      onClick={onClick}
      className="transition-transform"
      style={{
        flexShrink: 0, width: 230, height: 190, scrollSnapAlign: 'start', borderRadius: 22,
        position: 'relative', overflow: 'hidden', cursor: 'pointer',
        background: vendor.logo ? `url(${vendor.logo}) center/cover` : 'linear-gradient(135deg, #10b981, #34d399)',
        boxShadow: '0 8px 20px rgba(0,0,0,0.10)',
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      {!vendor.logo && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 54 }}>{emoji}</div>
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)' }} />
      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.92)', padding: '4px 9px', borderRadius: 50 }}>
        <Star size={12} fill="#f59e0b" color="#f59e0b" />
        <span style={{ fontSize: 12, fontWeight: 800, color: '#0f1117' }}>{(vendor.rating ?? 0).toFixed(1)}</span>
      </div>
      <div style={{ position: 'absolute', left: 14, right: 14, bottom: 14 }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {vendor.businessName}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{vendor.businessType}</span>
          {vendor.address && (
            <>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>•</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vendor.address}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function VendorCard({ vendor, onClick }) {
  const emoji = { food: '🍛', grocery: '🛒', pharmacy: '💊', boutique: '👗', electronics: '📱' }[vendor.businessType?.toLowerCase()] || '🏪';
  return (
    <div onClick={onClick} style={{
      background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', overflow: 'hidden',
      cursor: 'pointer', transition: 'transform 0.15s',
    }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{
        height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38,
        background: vendor.logo ? `url(${vendor.logo}) center/cover` : 'linear-gradient(135deg, #10b981, #34d399)',
      }}>
        {!vendor.logo && emoji}
      </div>
      <div style={{ padding: 12 }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: '#0f1117', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {vendor.businessName}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
          <Star size={12} fill="#f59e0b" color="#f59e0b" />
          <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>{(vendor.rating ?? 0).toFixed(1)}</span>
          <span style={{ fontSize: 11, color: '#d1d5db' }}>•</span>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>{vendor.businessType}</span>
        </div>
        {vendor.address && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 4 }}>
            <MapPin size={11} color="#9ca3af" />
            <span style={{ fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vendor.address}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function VendorCardSkeleton() {
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
      <div style={{ height: 100, background: '#f3f4f6', animation: 'fc-skeleton-pulse 1.5s infinite' }} />
      <div style={{ padding: 12 }}>
        <div style={{ height: 14, width: '70%', background: '#f3f4f6', borderRadius: 6, animation: 'fc-skeleton-pulse 1.5s infinite' }} />
        <div style={{ height: 12, width: '40%', background: '#f3f4f6', borderRadius: 6, marginTop: 8, animation: 'fc-skeleton-pulse 1.5s infinite' }} />
      </div>
      <style>{`@keyframes fc-skeleton-pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );
}

function SearchResults({ loading, query, results, theme, onVendorClick }) {
  return (
    <div style={{ marginTop: 22, minHeight: 300 }}>
      {results.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>
          <Search size={32} style={{ marginBottom: 10 }} />
          <div style={{ fontWeight: 700 }}>No results for "{query}"</div>
          {loading && <div style={{ fontSize: 12, marginTop: 8 }}>Still checking products across vendors...</div>}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f1117', margin: 0 }}>{results.length} result{results.length !== 1 ? 's' : ''}</h3>
            {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', color: '#9ca3af' }} />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {results.map(({ vendor, matchedProducts }) => (
              <div key={vendor.id} onClick={() => onVendorClick(vendor.id)} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14,
                border: '1px solid #f0f0f0', background: '#fff', cursor: 'pointer',
              }}>
                <div style={{
                  width: 50, height: 50, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, background: vendor.logo ? `url(${vendor.logo}) center/cover` : 'linear-gradient(135deg, #10b981, #34d399)',
                }}>
                  {!vendor.logo && '🏪'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0f1117' }}>{vendor.businessName}</div>
                  {matchedProducts ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                      <Package size={11} color={theme.green} />
                      <span style={{ fontSize: 11, color: theme.green, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Has: {matchedProducts.slice(0, 2).join(', ')}{matchedProducts.length > 2 ? ` +${matchedProducts.length - 2} more` : ''}
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{vendor.businessType}</div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                  <Star size={12} fill="#f59e0b" color="#f59e0b" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>{(vendor.rating ?? 0).toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}