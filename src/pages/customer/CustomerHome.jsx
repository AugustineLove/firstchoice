'use client';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ShoppingBag, Star, MapPin, Loader2, Store, Search, X, Flame, TrendingUp, Package, Truck, ArrowRight, Tag, ArrowUpRight } from 'lucide-react';
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

// Looks for `q` in a product's own name/category as well as every variant
// and addon name nested under it, and returns one match descriptor per
// hit. This is what lets "extra cheese" or "large" surface a vendor even
// when neither word appears in the product's own name — and each match
// carries enough (productId + variantId/addonId) for VendorPage to open
// straight to that exact thing instead of just the vendor's front page.
function findProductMatches(product, q) {
  const matches = [];

  const nameHit = product.name?.toLowerCase().includes(q) || product.category?.toLowerCase().includes(q);
  if (nameHit) {
    matches.push({ type: 'product', label: product.name, productId: product.id });
  }

  (product.variantGroups || []).forEach((g) => {
    (g.variants || []).forEach((v) => {
      if (v.name?.toLowerCase().includes(q)) {
        matches.push({ type: 'variant', label: `${product.name} — ${v.name}`, productId: product.id, variantId: v.id });
      }
    });
  });

  (product.addonGroups || []).forEach((g) => {
    (g.addons || []).forEach((a) => {
      if (a.name?.toLowerCase().includes(q)) {
        matches.push({ type: 'addon', label: `${product.name} — ${a.name}`, productId: product.id, addonId: a.id });
      }
    });
  });

  return matches;
}

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

  // Builds the searchable product index. The bulk `/products` endpoint
  // doesn't depend on `allVendors` at all, so it's attempted regardless of
  // whether the vendor list has loaded yet. Only the per-vendor *fallback*
  // (used when there's no bulk endpoint) actually needs `allVendors` — if
  // that isn't ready yet, we bail WITHOUT marking the index as built, so
  // the effect below can retry automatically once vendors do arrive.
  //
  // Previously this bailed out (and was never retried) if `allVendors` was
  // still empty when the search box was first focused — e.g. tapping
  // search while the `/vendors` request was still in flight. That left
  // `productIndexBuilt` stuck `false` with an empty `allProducts`, so every
  // search silently returned nothing until a full page reload reset state
  // and happened to let `/vendors` resolve before search was touched again.
  const buildProductIndex = useCallback(async () => {
    if (productIndexBuilt || productIndexLoading) return;
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
      if (allVendors.length === 0) {
        // Nothing to build the per-vendor fallback from yet — leave
        // productIndexBuilt false so the retry effect below tries again
        // once allVendors is populated, instead of giving up permanently.
        setProductIndexLoading(false);
        return;
      }
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

  // Retry net: if the search box was opened before allVendors finished
  // loading (buildProductIndex bailed out above without setting
  // productIndexBuilt), this fires again as soon as allVendors is ready —
  // so search recovers on its own instead of requiring a page refresh.
  useEffect(() => {
    if (searchOpen && !productIndexBuilt && !productIndexLoading) {
      buildProductIndex();
    }
  }, [searchOpen, allVendors, productIndexBuilt, productIndexLoading, buildProductIndex]);

  // Every match (product name, variant name, or addon name) found across
  // a vendor's product catalog, grouped back under that vendor. `matches`
  // is null for a vendor that only matched on its own name/type, so the
  // UI can tell "matched as a vendor" apart from "matched because of a
  // specific item in their menu".
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const vendorNameMatches = allVendors.filter(
      (v) => v.businessName?.toLowerCase().includes(q) || v.businessType?.toLowerCase().includes(q)
    );

    const productsByVendor = new Map();
    allProducts.forEach((p) => {
      if (!p.vendorId) return;
      const matches = findProductMatches(p, q);
      if (matches.length === 0) return;
      if (!productsByVendor.has(p.vendorId)) productsByVendor.set(p.vendorId, []);
      productsByVendor.get(p.vendorId).push(...matches);
    });

    const seen = new Set();
    const merged = vendorNameMatches.map((v) => {
      seen.add(v.id);
      return { vendor: v, matches: productsByVendor.get(v.id) || null };
    });
    productsByVendor.forEach((matches, vendorId) => {
      if (seen.has(vendorId)) return;
      const vendor = allVendors.find((v) => v.id === vendorId);
      if (vendor) {
        merged.push({ vendor, matches });
        seen.add(vendorId);
      }
    });

    return merged;
  }, [query, allVendors, allProducts]);

  const showingSearch = searchOpen && query.trim().length > 0;

  // Takes the customer straight to the vendor page, and — when the hit
  // that was clicked came from a specific product/variant/addon rather
  // than just the vendor's own name — carries that along as router state
  // so VendorPage can open right to it instead of leaving the customer to
  // find it again themselves.
  function goToVendor(vendorId, match) {
    navigate(
      `/vendor/${vendorId}`,
      match ? { state: { focusProductId: match.productId, focusVariantId: match.variantId, focusAddonId: match.addonId } } : undefined
    );
  }

  // Responsive grid columns without relying on window.innerWidth at render
  // time (that only evaluates once per render pass and never reacts to an
  // actual resize — CSS handles this correctly on its own).
  const gridColsStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 };

return (
  <div className="app-container">
    {/* ─── TOPBAR ─── */}
    <header className="topbar">
      <div className="topbar__inner">
        {/* Brand & Actions */}
        <div className="topbar__row topbar__row--primary">
          <div className="topbar__brand">
            <div className="topbar__avatar">
              <img src="/icons/logo.png" alt="FirstChoice" />
            </div>
            <div className="topbar__wordmark">
              <span>First<span className="topbar__accent">Choice</span></span>
              <span className="topbar__dots" aria-hidden="true">
                <span /><span /><span />
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/notifications')}
            className="topbar__notif"
            aria-label="Notifications"
          >
            <Bell size={20} strokeWidth={2.2} />
            <span className="topbar__notif-dot" />
          </button>
        </div>

        {/* Greeting */}
        <div className="topbar__greeting">
          <h1>Yo, {firstName} <span aria-hidden="true">👋</span></h1>
          <p>Make some taps, let's get it delivered.</p>
        </div>

        {/* Search */}
        <div className="topbar__search">
          <Search size={18} className="topbar__search-icon" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={openSearch}
            placeholder="Search vendors, products, or extras..."
            className="topbar__search-input"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="topbar__search-clear"
              aria-label="Clear search"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Service Area */}
        <div className="topbar__service">
          <div className="service-card">
            <div className="service-card__pin">
              <MapPin size={20} strokeWidth={1.4} />
              <div className="service-card__pin-shadow" />
            </div>
            <div className="service-card__text">
              <span className="service-card__label">Proudly serving</span>
              <strong className="service-card__location">Agona Nkwanta</strong>
              <span className="service-card__sub">and beyond.</span>
            </div>
          </div>
        </div>
      </div>
    </header>

    {/* ─── MAIN CONTENT ─── */}
    <main className="main-content">
      {/* Categories */}
      <section className="section">
        <h2 className="section__title">Shop by Category</h2>
        <div className="category-grid">
          {CATEGORIES.map((cat) => {
            const active = category === cat.value;
            return (
              <button
                key={cat.label}
                onClick={() => setCategory(cat.value)}
                className={`category-btn ${active ? 'category-btn--active' : ''}`}
                style={{
                  '--cat-bg': cat.bg ?? `${theme.green}18`,
                  '--cat-fg': cat.fg ?? theme.green,
                }}
              >
                <span className="category-btn__icon">{cat.icon}</span>
                <span className="category-btn__label">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Pickup CTA */}
      <section className="pickup-cta" style={{ '--cta-color': theme.green }}>
        <Truck size={120} className="pickup-cta__bg-icon" />
        <div className="pickup-cta__content">
          <h3>Need something picked up?</h3>
          <p>
            No need to shop. We can pick up and deliver any item for you.
            E.g. A document, a gift for a friend, or any personal item.
          </p>
          <button
            onClick={() => navigate('/deliveries')}
            className="pickup-cta__btn"
          >
            Request a Pick-up <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Search Results or Feed */}
      {showingSearch ? (
        <SearchResults
          loading={productIndexLoading}
          query={query}
          results={searchResults}
          theme={theme}
          onVendorClick={goToVendor}
        />
      ) : (
        <>
          {/* Popular & Trending */}
          {!loading && popular.length > 0 && (
            <RailSection
              title="Popular"
              icon={<Flame size={18} color="#f97316" />}
              items={popular}
              onItemClick={(v) => navigate(`/vendor/${v.id}`)}
            />
          )}

          {!loading && trending.length > 0 && (
            <RailSection
              title="Trending Now"
              icon={<TrendingUp size={18} color="#3b82f6" />}
              items={trending}
              onItemClick={(v) => navigate(`/vendor/${v.id}`)}
            />
          )}

          {/* Vendors Grid */}
          <section className="section">
            <div className="section__header">
              <h2 className="section__title">
                {category ? `${category} Vendors` : 'All Vendors'}
              </h2>
              {!loading && !error && (
                <span className="section__count">{vendors.length} found</span>
              )}
            </div>

            {loading && (
              <div className="vendor-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <VendorCardSkeleton key={i} />
                ))}
              </div>
            )}

            {!loading && error && (
              <div className="state-message">
                <p>{error}</p>
                <button onClick={loadVendors} className="state-message__retry">
                  Try again
                </button>
              </div>
            )}

            {!loading && !error && vendors.length === 0 && (
              <div className="state-message state-message--empty">
                <Store size={48} />
                <p>No vendors found</p>
              </div>
            )}

            {!loading && !error && vendors.length > 0 && (
              <div className="vendor-grid">
                {vendors.map((v) => (
                  <VendorCard
                    key={v.id}
                    vendor={v}
                    onClick={() => navigate(`/vendor/${v.id}`)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>

    {/* ─── STYLES ─── */}
    <style jsx>{`
      /* ── Reset & Base ── */
      .app-container {
        min-height: 100vh;
        background: #f5f7f6;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        padding-bottom: 80px;
      }

      /* ── Topbar ── */
      .topbar {
        position: sticky;
        top: 0;
        z-index: 50;
        background: linear-gradient(145deg, #0c3324, #0a2a1e);
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.18);
      }

      .topbar__inner {
        max-width: 1200px;
        margin: 0 auto;
        padding: 14px 16px 18px;
      }

      .topbar__row--primary {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .topbar__brand {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }

      .topbar__avatar {
        flex-shrink: 0;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        overflow: hidden;
        border: 2px solid rgba(255, 255, 255, 0.5);
      }

      .topbar__avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .topbar__wordmark {
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 700;
        font-size: clamp(16px, 4vw, 20px);
        color: #fff;
        letter-spacing: -0.4px;
        white-space: nowrap;
      }

      .topbar__accent {
        background: linear-gradient(135deg, #f6c453, #e8b84a);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .topbar__dots {
        display: flex;
        gap: 3px;
        margin-left: 2px;
      }

      .topbar__dots span {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #f6c453;
        opacity: 0.5;
        animation: dotPulse 1.4s ease-in-out infinite;
      }

      .topbar__dots span:nth-child(2) { animation-delay: 0.2s; }
      .topbar__dots span:nth-child(3) { animation-delay: 0.4s; }

      @keyframes dotPulse {
        0%, 100% { opacity: 0.4; transform: scale(0.9); }
        50% { opacity: 1; transform: scale(1.2); box-shadow: 0 0 8px rgba(246, 196, 83, 0.4); }
      }

      .topbar__notif {
        position: relative;
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 1px solid rgba(242, 197, 114, 0.2);
        background: rgba(255, 255, 255, 0.06);
        color: #fdfbf6;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .topbar__notif:hover {
        background: rgba(255, 255, 255, 0.12);
        transform: scale(1.04);
      }

      .topbar__notif:active {
        transform: scale(0.92);
      }

      .topbar__notif-dot {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #e74c3c;
        border: 2px solid #0c3324;
        animation: notificationPulse 2s ease-in-out infinite;
      }

      @keyframes notificationPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }

      /* ── Greeting ── */
      .topbar__greeting {
        margin-top: 14px;
      }

      .topbar__greeting h1 {
        font-family: 'Fraunces', Georgia, serif;
        font-weight: 600;
        font-size: clamp(20px, 5vw, 28px);
        color: #fdfbf6;
        margin: 0;
        line-height: 1.2;
        font-style: italic;
      }

      .topbar__greeting p {
        margin: 2px 0 0;
        font-size: clamp(12px, 1.8vw, 14px);
        color: rgba(253, 251, 246, 0.55);
        font-weight: 500;
      }

      /* ── Search ── */
      .topbar__search {
        position: relative;
        margin-top: 14px;
      }

      .topbar__search-icon {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        color: rgba(18, 32, 26, 0.35);
        pointer-events: none;
      }

      .topbar__search-input {
        width: 100%;
        height: 48px;
        padding: 0 44px 0 44px;
        border: none;
        border-radius: 14px;
        background: #f7f4ec;
        font-family: inherit;
        font-size: 15px;
        color: #12201a;
        outline: none;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        transition: box-shadow 0.25s ease, transform 0.2s ease;
      }

      .topbar__search-input::placeholder {
        color: rgba(18, 32, 26, 0.35);
      }

      .topbar__search-input:focus {
        box-shadow: 0 0 0 4px rgba(217, 169, 74, 0.2), 0 4px 20px rgba(0, 0, 0, 0.12);
        transform: scale(1.005);
      }

      .topbar__search-clear {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        padding: 4px;
        cursor: pointer;
        color: rgba(18, 32, 26, 0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background 0.2s;
      }

      .topbar__search-clear:hover {
        background: rgba(18, 32, 26, 0.06);
        color: rgba(18, 32, 26, 0.6);
      }

      /* ── Service Card ── */
      .topbar__service {
        margin-top: 14px;
        display: flex;
        justify-items: center;
        align-items: center;
        width: 100%;
        height: 48px;
      }

      .service-card {
        display: flex;
        width: 100%;
        height: 48px;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 14px 20px;
        border-radius: 14px;
        background: rgba(8, 67, 39, 0.6);
        backdrop-filter: blur(4px);
        border: 1px solid rgba(255, 255, 255, 0.04);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03), 0 8px 32px rgba(0, 0, 0, 0.06);
        overflow: hidden;
        position: relative;
      }

      .service-card::before {
        content: '';
        position: absolute;
        width: 300px;
        height: 300px;
        top: -120px;
        left: -80px;
        background: radial-gradient(circle, rgba(97, 255, 22, 0.04), transparent 70%);
        pointer-events: none;
      }

      .service-card__pin {
        position: relative;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 66px;
        height: 70px;
      }

      .service-card__pin svg {
        color: #5dff19;
        // filter: drop-shadow(0 0 8px rgba(93, 255, 25, 0.25));
        width: 20px;
        height: 20px;
      }

      .service-card__pin-shadow {
        position: absolute;
        bottom: 16px;
        left: 50%;
        transform: translateX(-50%);
        width: 20px;
        height: 3px;
        border-radius: 50%;
        background: rgba(93, 255, 25, 0.35);
        // filter: blur(2px);
        opacity: 0.7;
      }

      .service-card__text {
        position: relative;
        z-index: 2;
        line-height: 1.3;
      }

      .service-card__label {
        display: block;
        font-size: clamp(8px, 1.4vw, 5px);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: rgba(245, 247, 245, 0.5);
      }

      .service-card__location {
        display: block;
        font-size: clamp(8px, 4vw, 16px);
        font-weight: 800;
        color: #5dff19;
        letter-spacing: -0.8px;
        margin: -2px 0 0;
        text-shadow: 0 0 20px rgba(93, 255, 25, 0.08);
      }

      .service-card__sub {
        display: block;
        font-size: clamp(8px, 1.4vw, 5px);
        font-weight: 500;
        color: rgba(245, 247, 245, 0.5);
        letter-spacing: -0.1px;
        margin-top: -2px;
      }

      /* ── Main Content ── */
      .main-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 16px 32px;
      }

      .section {
        margin-top: 28px;
      }

      .section__title {
        font-size: clamp(12px, 1.6vw, 14px);
        font-weight: 800;
        letter-spacing: 0.04em;
        color: #1a1a2e;
        margin: 0 0 12px;
        text-transform: uppercase;
      }

      .section__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }

      .section__count {
        font-size: 13px;
        color: #6b7280;
        font-weight: 500;
      }

      /* ── Category Grid ── */
      .category-grid {
        display: flex;
        gap: 10px;
        overflow-x: auto;
        padding: 4px 0 8px;
        scrollbar-width: thin;
        -webkit-overflow-scrolling: touch;
      }

      .category-grid::-webkit-scrollbar {
        height: 3px;
      }

      .category-grid::-webkit-scrollbar-thumb {
        background: #d1d5db;
        border-radius: 4px;
      }

      .category-btn {
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        width: 80px;
        height: 80px;
        border-radius: 20px;
        background: var(--cat-bg);
        border: 2px solid transparent;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        font-family: inherit;
        padding: 0;
      }

      .category-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
      }

      .category-btn--active {
        border-color: var(--cat-fg);
        transform: scale(1.04);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      }

      .category-btn__icon {
        font-size: 24px;
        line-height: 1;
      }

      .category-btn__label {
        font-size: 10px;
        font-weight: 700;
        color: var(--cat-fg);
        text-align: center;
        line-height: 1.2;
        max-width: 64px;
      }

      /* ── Pickup CTA ── */
      .pickup-cta {
        position: relative;
        margin-top: 20px;
        padding: 24px 20px;
        border-radius: 24px;
        background: linear-gradient(145deg, var(--cta-color), #0d9488);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
        overflow: hidden;
      }

      .pickup-cta__bg-icon {
        position: absolute;
        right: -10px;
        bottom: -20px;
        color: rgba(255, 255, 255, 0.08);
        transform: rotate(-6deg);
        pointer-events: none;
      }

      .pickup-cta__content {
        position: relative;
        z-index: 2;
      }

      .pickup-cta__content h3 {
        color: #fff;
        font-size: clamp(16px, 2.8vw, 20px);
        font-weight: 800;
        margin: 0;
        letter-spacing: -0.3px;
      }

      .pickup-cta__content p {
        color: rgba(255, 255, 255, 0.8);
        font-size: clamp(12px, 1.6vw, 14px);
        margin: 6px 0 14px;
        max-width: 380px;
        line-height: 1.5;
      }

      .pickup-cta__btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 22px;
        border: none;
        border-radius: 50px;
        background: #fff;
        color: var(--cta-color);
        font-weight: 800;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.25s ease;
        font-family: inherit;
      }

      .pickup-cta__btn:hover {
        transform: scale(1.03);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      }

      .pickup-cta__btn:active {
        transform: scale(0.95);
      }

      /* ── Vendor Grid ── */
      .vendor-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 14px;
      }

      /* ── State Messages ── */
      .state-message {
        text-align: center;
        padding: 48px 16px;
        color: #6b7280;
      }

      .state-message p {
        margin: 0 0 12px;
        font-size: 15px;
      }

      .state-message__retry {
        background: none;
        border: none;
        color: var(--cta-color, #1d5b3d);
        font-weight: 700;
        font-size: 14px;
        cursor: pointer;
        font-family: inherit;
        text-decoration: underline;
        transition: opacity 0.2s;
      }

      .state-message__retry:hover {
        opacity: 0.7;
      }

      .state-message--empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        color: #9ca3af;
      }

      .state-message--empty svg {
        color: #d1d5db;
      }

      /* ── Responsive ── */
      @media (max-width: 640px) {
        .topbar__inner {
          padding: 12px 14px 16px;
        }

        .category-btn {
          width: 68px;
          height: 68px;
          border-radius: 16px;
        }

        .category-btn__icon {
          font-size: 20px;
        }

        .category-btn__label {
          font-size: 9px;
        }

        .vendor-grid {
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 12px;
        }

        .service-card {
          padding: 12px 16px;
          border-radius: 20px;
        }

        .service-card__pin {
          width: 44px;
        }

        .service-card__pin svg {
          width: 28px;
          height: 28px;
        }

        .pickup-cta {
          padding: 20px 16px;
        }
      }

      @media (max-width: 400px) {
        .category-btn {
          width: 60px;
          height: 60px;
          border-radius: 14px;
        }

        .category-btn__icon {
          font-size: 18px;
        }

        .vendor-grid {
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 10px;
        }

        .topbar__search-input {
          height: 42px;
          font-size: 14px;
          padding: 0 38px 0 38px;
        }

        .service-card {
          padding: 10px 14px;
        }
      }

      @media (min-width: 768px) {
        .topbar__inner {
          padding: 18px 24px 22px;
        }

        .topbar__row--primary {
          gap: 16px;
        }

        .vendor-grid {
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 18px;
        }

        .category-grid {
          gap: 14px;
        }

        .category-btn {
          width: 92px;
          height: 92px;
          border-radius: 24px;
        }

        .category-btn__icon {
          font-size: 28px;
        }
      }

      @media (min-width: 1024px) {
        .vendor-grid {
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 22px;
        }

        .category-btn {
          width: 100px;
          height: 100px;
        }
      }
    `}</style>
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

// A small badge distinguishing what kind of thing matched — a plain
// product, a variant ("Large"), or an addon ("Extra cheese") — so the
// customer can tell at a glance why a vendor showed up.
function MatchTypeIcon({ type }) {
  if (type === 'variant') return <Tag size={11} />;
  if (type === 'addon') return <Package size={11} />;
  return null;
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
            {results.map(({ vendor, matches }) => (
              <div key={vendor.id} style={{
                padding: 12, borderRadius: 14, border: '1px solid #f0f0f0', background: '#fff',
              }}>
                {/* Tapping the vendor row itself: go to the vendor, focused
                    on the first match if there is one (e.g. searched "egg"
                    and this vendor's top hit is an addon called Egg). */}
                <div
                  onClick={() => onVendorClick(vendor.id, matches?.[0] || null)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                >
                  <div style={{
                    width: 50, height: 50, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, background: vendor.logo ? `url(${vendor.logo}) center/cover` : 'linear-gradient(135deg, #10b981, #34d399)',
                  }}>
                    {!vendor.logo && '🏪'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0f1117' }}>{vendor.businessName}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{vendor.businessType}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                    <Star size={12} fill="#f59e0b" color="#f59e0b" />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>{(vendor.rating ?? 0).toFixed(1)}</span>
                  </div>
                </div>

                {/* Individual chips per matched product/variant/addon — each
                    tappable on its own, so a search that hit three different
                    items at the same vendor can jump straight to any one. */}
                {matches && matches.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                    {matches.slice(0, 5).map((m, i) => (
                      <button
                        key={`${m.productId}-${m.variantId || m.addonId || 'p'}-${i}`}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onVendorClick(vendor.id, m); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5, border: 'none', cursor: 'pointer',
                          background: `${theme.green}14`, color: theme.green, fontSize: 11, fontWeight: 700,
                          padding: '5px 10px', borderRadius: 50, fontFamily: 'inherit',
                        }}
                      >
                        <MatchTypeIcon type={m.type} />
                        {m.label}
                      </button>
                    ))}
                    {matches.length > 5 && (
                      <span style={{ fontSize: 11, color: '#9ca3af', alignSelf: 'center' }}>+{matches.length - 5} more</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}