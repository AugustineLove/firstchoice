'use client';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ShoppingBag, Star, MapPin, Loader2, Store, Search, X, Flame, TrendingUp, Package, Truck, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';

// One curated color per category — deliberately picked, not Math.random(),
// so tiles don't reshuffle on every render. Swap freely.
const CATEGORIES = [
  { label: 'All',         icon: '🏪', value: null,          bg: null,      fg: null },
  { label: 'Food',        icon: '🍛', value: 'Food',        bg: '#FFEDD5', fg: '#EA580C' },
  { label: 'Grocery',     icon: '🛒', value: 'Grocery',     bg: '#DCFCE7', fg: '#16A34A' },
  { label: 'Pharmacy',    icon: '💊', value: 'Pharmacy',    bg: '#DBEAFE', fg: '#2563EB' },
  { label: 'Boutique',    icon: '👗', value: 'Boutique',    bg: '#FCE7F3', fg: '#DB2777' },
  { label: 'Electronics', icon: '📱', value: 'Electronics', bg: '#EDE9FE', fg: '#7C3AED' },
];

export default function CustomerHome() {
  const { user, authFetch } = useAuth();
  const { theme } = useTheme();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const [category, setCategory] = useState(null);
  const [vendors, setVendors]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  // Unfiltered vendor list, loaded once, used only for search — so search
  // works across every vendor regardless of which category chip is active.
  const [allVendorsIndex, setAllVendorsIndex] = useState([]);

  // Product index for search, built lazily (no bulk products endpoint
  // assumed) the first time someone actually searches.
  const [allProducts, setAllProducts]               = useState([]);
  const [productIndexBuilt, setProductIndexBuilt]     = useState(false);
  const [productIndexLoading, setProductIndexLoading] = useState(false);

  // ── search ──
  const [query, setQuery]           = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const firstName = user?.name?.split(' ')[0] || 'there';

  const load = useCallback(async (cat = category) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(cat ? { category: cat } : {});
      const res = await authFetch(`/vendors?${params}`);
      const json = await res.json();
      if (json.success) setVendors(json.data.vendors ?? json.data);
      else setError(json.message || 'Could not load vendors');
    } catch (e) {
      setError('Could not reach the server. Check your connection.');
    }
    setLoading(false);
  }, [authFetch, category]);

  useEffect(() => { load(category); }, [category]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    authFetch('/vendors')
      .then((r) => r.json())
      .then((j) => { if (j.success) setAllVendorsIndex(j.data.vendors ?? j.data); })
      .catch(() => {});
  }, [authFetch]);

  // Popular / Trending — derived client-side from the currently-filtered
  // vendor list. Swap for real `/vendors?sort=popular` etc. if the API
  // grows dedicated endpoints for these.
  const popular = useMemo(
    () => [...vendors].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 8),
    [vendors]
  );
  const trending = useMemo(() => [...vendors].reverse().slice(0, 8), [vendors]);

  // Builds a searchable product index the first time it's needed. Tries one
  // bulk endpoint first; if that's not there, falls back to fetching every
  // vendor's products in parallel and stitching them together — no backend
  // search endpoint required either way.
  const buildProductIndex = useCallback(async () => {
    if (productIndexBuilt || productIndexLoading || allVendorsIndex.length === 0) return;
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
          allVendorsIndex.map((v) =>
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
  }, [authFetch, allVendorsIndex, productIndexBuilt, productIndexLoading]);

  function openSearch() {
    setSearchOpen(true);
    buildProductIndex();
  }

  // Pure client-side matching — vendors by name/type, products by
  // name/category, with product matches rolled up into the vendors that
  // carry them so a product search surfaces the right shops.
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const vendorNameMatches = allVendorsIndex.filter(
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
      const vendor = allVendorsIndex.find((v) => v.id === vendorId);
      if (vendor) {
        merged.push({ vendor, matchedProducts: names });
        seen.add(vendorId);
      }
    });

    return merged;
  }, [query, allVendorsIndex, allProducts]);

  const showingSearch = searchOpen && query.trim().length > 0;

  return (
    <div style={{ minHeight: '100vh', background: '#f8faf8', fontFamily: "'DM Sans', system-ui, sans-serif", paddingBottom: 88 }}>

      {/* ── TOP BAR ── */}
      <div style={{ background: '#1B5E3B', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className='text-white' style={{
            width: 40, height: 40, borderRadius: '50%', background: `${theme.green}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: theme.green, flexShrink: 0,
          }}>{firstName[0]?.toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#ffff' }}>Hello, {firstName} 👋</div>
            <div style={{ fontSize: 12, color: '#fff' }}>What would you like today?</div>
          </div>
          <button onClick={() => navigate('/notifications')} style={iconBtnStyle}><Bell size={20} color="#fff" /></button>
          <button onClick={() => navigate('/cart')} style={{ ...iconBtnStyle, position: 'relative' }}>
            <ShoppingBag size={20} color="#fff" />
            {totalItems > 0 && (
              <span style={{
                position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: '50%',
                background: theme.green, color: '#fff', fontSize: 9, fontWeight: 900,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{totalItems}</span>
            )}
          </button>
        </div>

        {/* ── SEARCH ── */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px 14px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={17} color="#9ca3af" style={{ position: 'absolute', left: 14, top: 13 }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={openSearch}
              placeholder="Search vendors or products..."
              className="shadow-sm"
              style={{
                width: '100%', height: 46, borderRadius: 14, border: '1px solid #e5e7eb', background: '#f8faf8',
                paddingLeft: 40, paddingRight: query ? 36 : 14, fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box', outline: 'none',
              }}
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setSearchOpen(false); }}
                style={{ position: 'absolute', right: 10, top: 13, background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
              >
                <X size={18} color="#9ca3af" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>

        {/* ── CATEGORIES ── */}
        <h3 className="text-left" style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.06em', color: '#9ca3af', margin: '24px 0 12px' }}>
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
            {/* ── POPULAR (horizontal) ── */}
            {!loading && popular.length > 0 && (
              <RailSection
                title="Popular Restaurants"
                icon={<Flame size={16} color="#f97316" />}
                items={popular}
                onItemClick={(v) => navigate(`/vendor/${v.id}`)}
              />
            )}

            {/* ── TRENDING (horizontal) ── */}
            {!loading && trending.length > 0 && (
              <RailSection
                title="Trending Now"
                icon={<TrendingUp size={16} color="#3b82f6" />}
                items={trending}
                onItemClick={(v) => navigate(`/vendor/${v.id}`)}
              />
            )}

            {/* ── VENDORS HEADER ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '28px 0 14px' }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f1117', margin: 0 }}>
                {category ? `${category} Vendors` : 'All Vendors'}
              </h3>
              {!loading && !error && <span style={{ fontSize: 13, color: '#6b7280' }}>{vendors.length} found</span>}
            </div>

            {/* ── VENDOR GRID ── */}
            {loading && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
                {Array.from({ length: 4 }).map((_, i) => <VendorCardSkeleton key={i} />)}
              </div>
            )}

            {!loading && error && (
              <div style={{ textAlign: 'center', padding: 48 }}>
                <p style={{ color: '#6b7280', marginBottom: 12 }}>{error}</p>
                <button onClick={() => load()} style={{ color: theme.green, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>Try again</button>
              </div>
            )}

            {!loading && !error && vendors.length === 0 && (
              <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>
                <Store size={36} style={{ marginBottom: 10 }} />
                <div style={{ fontWeight: 700 }}>No vendors found</div>
              </div>
            )}

            {!loading && !error && vendors.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    window.innerWidth < 768
                      ? 'repeat(2, 1fr)'
                      : 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 14,
                }}
              >
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

/** Horizontally-scrolling rail of image-overlay vendor cards, used for Popular / Trending. */
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
      {/* dark gradient scrim so the text stays legible over any photo */}
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
      <div style={{ height: 100, background: '#f3f4f6', animation: 'fc-pulse 1.5s infinite' }} />
      <div style={{ padding: 12 }}>
        <div style={{ height: 14, width: '70%', background: '#f3f4f6', borderRadius: 6, animation: 'fc-pulse 1.5s infinite' }} />
        <div style={{ height: 12, width: '40%', background: '#f3f4f6', borderRadius: 6, marginTop: 8, animation: 'fc-pulse 1.5s infinite' }} />
      </div>
      <style>{`@keyframes fc-pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );
}

/** Search results — every matching vendor, with a "matches: ..." pill when it was found via a product rather than its name. */
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

const iconBtnStyle = {
  background: 'none', border: 'none', cursor: 'pointer', padding: 6,
  display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8,
};