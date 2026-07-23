'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Star, MapPin, Clock, Loader2, Send, CheckCircle2, Package,
  Search, X, LocateFixed, User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const TYPE_STYLE = {
  food:        { emoji: '🍛', a: '#10B981', b: '#34D399' },
  grocery:     { emoji: '🛒', a: '#10B981', b: '#34D399' },
  pharmacy:    { emoji: '💊', a: '#3B82F6', b: '#60A5FA' },
  boutique:    { emoji: '👗', a: '#EC4899', b: '#F472B6' },
  electronics: { emoji: '📱', a: '#6366F1', b: '#818CF8' },
};

// NOTE ON THE FLOW BELOW: products are shown for browsing/reference only —
// tapping one drops a line into the order note as a shortcut. The order
// itself is a single free-text note, submitted to POST /orders along with
// a compulsory delivery location and an optional "for a friend" recipient.
// The backend also still accepts the old structured items[] flow — this
// screen just doesn't build that payload.

function filterLocations(all, query) {
  if (!query.trim()) return all;
  const q = query.toLowerCase();
  return all.filter((l) => l.name.toLowerCase().includes(q) || l.address.toLowerCase().includes(q));
}

export default function VendorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const { theme } = useTheme();

  const [vendor, setVendor]     = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const [note, setNote] = useState('');

  // ── delivery location (compulsory) ──
  // Loaded quietly in the background on mount — this is just data-fetching,
  // it never touches focus/the keyboard. Only the picker UI itself opens
  // on tap; see LocationPicker below for the actual fix.
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [destination, setDestination] = useState(null); // saved location | null
  const [usingCurrentLocation, setUsingCurrentLocation] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // ── payment ──
  const [payment, setPayment] = useState('CASH');

  // ── ordering for a friend (optional) ──
  const [forFriend, setForFriend] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const submittingRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [vRes, pRes] = await Promise.all([
        authFetch(`/vendors/${id}`),
        authFetch(`/products/vendor/${id}`),
      ]);
      const [vJson, pJson] = await Promise.all([vRes.json(), pRes.json()]);
      if (vJson.success) setVendor(vJson.data);
      if (pJson.success) setProducts(pJson.data.products ?? pJson.data);
    } catch {
      setError('Could not load this vendor.');
    }
    setLoading(false);
  }, [authFetch, id]);

  const loadLocations = useCallback(async () => {
    setLoadingLocations(true);
    try {
      const res = await authFetch('/locations');
      const json = await res.json();
      if (json.success) setLocations(json.data.locations ?? json.data);
    } catch {
      // non-fatal — user can still use current location
    }
    setLoadingLocations(false);
  }, [authFetch]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadLocations(); }, [loadLocations]);

  const style = TYPE_STYLE[vendor?.businessType?.toLowerCase()] || { emoji: '🏪', a: '#10B981', b: '#34D399' };

  const destAddress = usingCurrentLocation && currentPosition
    ? `GPS: ${currentPosition.latitude.toFixed(5)}, ${currentPosition.longitude.toFixed(5)}`
    : destination?.address ?? '';
  const destLat = usingCurrentLocation ? currentPosition?.latitude : destination?.latitude;
  const destLng = usingCurrentLocation ? currentPosition?.longitude : destination?.longitude;
  const hasDeliveryLocation = usingCurrentLocation ? !!currentPosition : !!destination;

  function addProductToNote(product) {
    setNote((prev) => {
      const line = `1x ${product.name} (GHS ${product.price?.toFixed(2)})`;
      if (!prev.trim()) return line;
      return `${prev.trim()}\n${line}`;
    });
  }

  function useCurrentLocation() {
    if (!('geolocation' in navigator)) {
      setLocationError('Location is not supported by this browser.');
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentPosition({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setUsingCurrentLocation(true);
        setDestination(null);
        setLocating(false);
      },
      (err) => {
        setLocationError(err.message || 'Could not get your location.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const friendDetailsValid = !forFriend || (recipientName.trim() && recipientPhone.trim());
  const canSubmit = note.trim() && hasDeliveryLocation && payment && friendDetailsValid && !submitting;

  async function submitOrder() {
    if (!canSubmit || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await authFetch('/orders', {
        method: 'POST',
        body: JSON.stringify({
          vendorId: id,
          note: note.trim(),
          deliveryAddress: destAddress,
          deliveryLatitude: destLat,
          deliveryLongitude: destLng,
          paymentMethod: payment,
          ...(forFriend ? {
            recipientName: recipientName.trim(),
            recipientPhone: recipientPhone.trim(),
          } : {}),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSubmitted(true);
        setNote('');
        setDestination(null);
        setUsingCurrentLocation(false);
        setCurrentPosition(null);
        setForFriend(false);
        setRecipientName('');
        setRecipientPhone('');
      } else {
        setSubmitError(json.message || 'Could not submit your order.');
      }
    } catch {
      setSubmitError('Could not reach the server.');
    }
    submittingRef.current = false;
    setSubmitting(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8faf8', fontFamily: "'DM Sans', system-ui, sans-serif", paddingBottom: 40 }}>

      {/* ── HERO ── */}
      <div className="vp-hero" style={{
        background: vendor?.logo ? `url(${vendor.logo}) center/cover` : `linear-gradient(135deg, ${style.a}, ${style.b})`,
      }}>
        <div className="vp-hero__scrim" />

        <button onClick={() => navigate(-1)} className="vp-hero__back">
          <ArrowLeft size={18} color="#0f1117" />
        </button>

        {!vendor?.logo && !loading && (
          <div className="vp-hero__emoji">{style.emoji}</div>
        )}

        {vendor && !loading && (
          <div className="vp-hero__content">
            <div className="vp-hero__toprow">
              <span className="vp-hero__type">{vendor.businessType}</span>
              <span className="vp-hero__rating">
                <Star size={13} fill="#f59e0b" color="#f59e0b" />
                {(vendor.rating ?? 0).toFixed(1)}
              </span>
            </div>
            <h1 className="vp-hero__name">{vendor.businessName}</h1>
            <div className="vp-hero__meta">
              {vendor.address && <span><MapPin size={12} />{vendor.address}</span>}
              {vendor.openingHours && <span><Clock size={12} />{vendor.openingHours}</span>}
            </div>
          </div>
        )}

        {loading && <div className="vp-hero__skeleton" />}
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 20px' }}>

        {error && <p style={{ color: '#dc2626', padding: '18px 0' }}>{error}</p>}

        {vendor?.description && (
          <p style={{ fontSize: 13, color: '#6b7280', margin: '14px 0 0', lineHeight: 1.5 }}>{vendor.description}</p>
        )}

        {/* ── PRODUCTS (reference only — tap to drop into the order note) ── */}
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f1117', margin: '20px 0 6px' }}>Available Products</h2>
        <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 14px' }}>Tap an item to add it to your order note below</p>

        {loading && (
          <div className="vp-product-grid">
            {Array.from({ length: 6 }).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>No products available</p>
        )}

        {!loading && products.length > 0 && (
          <div className="vp-product-grid" style={{ marginBottom: 8 }}>
            {products.map((p) => (
              <ProductCard key={p.id} product={p} onClick={() => addProductToNote(p)} />
            ))}
          </div>
        )}

        {/* ── ORDER NOTE ── */}
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f1117', margin: '28px 0 10px' }}>What would you like to order?</h2>

        {submitted ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, background: '#ecfdf5', border: `1px solid ${theme.green}`,
            borderRadius: 14, padding: '16px 18px', marginBottom: 20,
          }}>
            <CheckCircle2 size={22} color={theme.green} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#0f1117' }}>Order sent to {vendor?.businessName}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>They'll confirm the details and total shortly.</div>
            </div>
          </div>
        ) : (
          <>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={6}
              placeholder="List everything you'd like, e.g.&#10;2x Jollof rice (large)&#10;1x Bottled water&#10;No pepper please"
              style={{
                width: '100%', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16, fontFamily: 'inherit',
                fontSize: 14, lineHeight: 1.6, resize: 'vertical', boxSizing: 'border-box', color: '#0f1117',
              }}
            />

            {/* ── DELIVERY LOCATION (compulsory) ── */}
            <Field label="DELIVER TO" icon={<MapPin size={15} color="#ef4444" />}>
              <LocationPicker
                hint="Search a saved location..."
                selected={destination}
                locations={locations}
                loading={loadingLocations}
                accent="#ef4444"
                overrideLabel={usingCurrentLocation ? '📍 Current location' : null}
                onPick={(loc) => { setDestination(loc); setUsingCurrentLocation(false); setCurrentPosition(null); }}
              />
            </Field>

            <button
              onClick={useCurrentLocation}
              disabled={locating}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '10px 14px', borderRadius: 10, marginBottom: 14, cursor: locating ? 'default' : 'pointer',
                border: `1px solid ${usingCurrentLocation ? theme.green : '#e5e7eb'}`,
                background: usingCurrentLocation ? '#ecfdf5' : '#f9fafb',
                fontFamily: 'inherit',
              }}
            >
              {locating
                ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: theme.green }} />
                : <LocateFixed size={16} color={usingCurrentLocation ? theme.green : '#9ca3af'} />}
              <span style={{ fontSize: 13, fontWeight: 600, color: usingCurrentLocation ? theme.green : '#6b7280' }}>
                {locating ? 'Getting location...' : usingCurrentLocation ? 'Using current location ✓' : 'Use my current location'}
              </span>
            </button>
            {locationError && (
              <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>
                {locationError}
              </div>
            )}

            {/* ── ORDER FOR A FRIEND (optional) ── */}
            <button
              type="button"
              onClick={() => setForFriend((v) => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '10px 14px', borderRadius: 10, marginBottom: forFriend ? 10 : 14, cursor: 'pointer',
                border: `1px solid ${forFriend ? theme.green : '#e5e7eb'}`,
                background: forFriend ? '#ecfdf5' : '#f9fafb',
                fontFamily: 'inherit',
              }}
            >
              <User size={16} color={forFriend ? theme.green : '#9ca3af'} />
              <span style={{ fontSize: 13, fontWeight: 600, color: forFriend ? theme.green : '#6b7280' }}>
                {forFriend ? "Ordering for a friend ✓" : "This order is for someone else"}
              </span>
            </button>

            {forFriend && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <input
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Friend's name"
                  style={inputStyle}
                />
                <input
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="Friend's phone"
                  style={inputStyle}
                />
              </div>
            )}

            {/* ── PAYMENT METHOD ── */}
            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Payment Method</div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
              <PayChip value="CASH" label="💵  Cash" selected={payment} onSelect={setPayment} theme={theme} />
              <PayChip value="MOMO" label="📱  MoMo" selected={payment} onSelect={setPayment} theme={theme} />
            </div>

            {submitError && (
              <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 10, padding: '10px 14px', marginBottom: 10, fontSize: 13 }}>
                {submitError}
              </div>
            )}
            <button
              onClick={submitOrder}
              disabled={!canSubmit}
              style={{
                width: '100%', height: 50, border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 14, fontFamily: 'inherit',
                background: canSubmit ? theme.green : '#d1d5db', color: '#fff', cursor: canSubmit ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {submitting
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Submitting...</>
                : <><Send size={16} /> Submit Order</>}
            </button>
            {!hasDeliveryLocation && (
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 8, textAlign: 'center' }}>
                Choose a delivery location to continue
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── HERO ── */
        .vp-hero {
          position: relative;
          height: clamp(210px, 32vw, 250px);
          overflow: hidden;
        }
        .vp-hero__scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.78) 100%);
        }
        .vp-hero__back {
          position: absolute;
          top: 16px;
          left: 16px;
          z-index: 2;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #fff;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }
        .vp-hero__emoji {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 58px;
          z-index: 1;
        }
        .vp-hero__content {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 2;
          padding: 16px 20px;
          max-width: 700px;
          margin: 0 auto;
          box-sizing: border-box;
        }
        .vp-hero__toprow {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }
        .vp-hero__type {
          font-size: 11px;
          font-weight: 700;
          color: #fff;
          background: rgba(255,255,255,0.18);
          border: 1px solid rgba(255,255,255,0.3);
          backdrop-filter: blur(6px);
          padding: 3px 10px;
          border-radius: 50px;
          text-transform: capitalize;
        }
        .vp-hero__rating {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 800;
          color: #fff;
          background: rgba(255,255,255,0.18);
          border: 1px solid rgba(255,255,255,0.3);
          backdrop-filter: blur(6px);
          padding: 3px 9px;
          border-radius: 50px;
        }
        .vp-hero__name {
          font-size: clamp(22px, 5.5vw, 27px);
          font-weight: 900;
          color: #fff;
          margin: 0 0 6px;
          letter-spacing: -0.4px;
          text-shadow: 0 2px 10px rgba(0,0,0,0.25);
          line-height: 1.1;
        }
        .vp-hero__meta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .vp-hero__meta span {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 500;
          color: rgba(255,255,255,0.88);
        }
        .vp-hero__skeleton {
          position: absolute;
          left: 20px;
          bottom: 20px;
          width: 200px;
          height: 20px;
          background: rgba(255,255,255,0.25);
          border-radius: 6px;
        }

        /* ── PRODUCT GRID — thin, dense, works with or without images ── */
        .vp-product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
          gap: 8px;
        }
        .vp-product-card {
          background: #fff;
          border-radius: 12px;
          border: 1px solid #f0f0f0;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.12s ease, box-shadow 0.12s ease;
        }
        .vp-product-card:active {
          transform: scale(0.96);
        }
        .vp-product-card__img {
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          background: #ecfdf5;
        }
        .vp-product-card__body {
          padding: 7px 8px 8px;
        }
        .vp-product-card__name {
          font-size: 11.5px;
          font-weight: 700;
          color: #0f1117;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          line-height: 1.3;
        }
        .vp-product-card__price {
          font-size: 11.5px;
          font-weight: 800;
          color: #10b981;
          margin-top: 2px;
        }
      `}</style>
    </div>
  );
}

/* ════════════════════════════════════════════
   LocationPicker — three real states now, not two:

   1. closed + nothing selected  → a plain BUTTON (no <input> in
      the DOM at all). This is what fixed the auto-keyboard bug:
      before, "no selection yet" and "open" were the same branch,
      so an <input autoFocus> was mounted the instant the page
      loaded, and mobile browsers pop the keyboard for any
      autoFocus input the moment it mounts — even with no user
      interaction. Now nothing keyboard-triggering exists until
      the button is tapped.
   2. closed + selected           → collapsed pill (unchanged).
   3. open (only ever reached via a tap) → the real <input
      autoFocus>, which is exactly when autofocus is supposed to
      fire — right after a deliberate tap, not on page load.
════════════════════════════════════════════ */
function LocationPicker({ hint, selected, locations, loading, accent, overrideLabel, onPick }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const displayLabel = overrideLabel ?? selected?.name;
  const results = filterLocations(locations, query);

  function pick(loc) {
    onPick(loc);
    setQuery('');
    setOpen(false);
  }

  if (!open) {
    return (
      <div ref={wrapRef} style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
            padding: '11px 14px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
            border: displayLabel ? `1.5px solid ${accent}` : '1px solid #e5e7eb',
            background: displayLabel ? `${accent}14` : '#f9fafb',
          }}
        >
          {displayLabel ? <CheckCircle2 size={16} color={accent} /> : <Search size={16} color="#9ca3af" />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: displayLabel ? 700 : 500, color: displayLabel ? '#111827' : '#9ca3af' }}>
              {displayLabel || hint}
            </div>
            {selected?.address && (
              <div style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selected.address}</div>
            )}
          </div>
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <Search size={16} color={accent} style={{ position: 'absolute', left: 12, top: 13 }} />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={hint}
          style={{ ...inputStyle, paddingLeft: 36, paddingRight: query ? 32 : 12, marginBottom: 0 }}
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} style={{ position: 'absolute', right: 10, top: 13, background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
            <X size={15} color="#9ca3af" />
          </button>
        )}
      </div>

      <div style={{
        position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6, zIndex: 20,
        background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb',
        boxShadow: '0 4px 16px rgba(0,0,0,0.07)', maxHeight: 260, overflowY: 'auto',
      }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: accent }} />
          </div>
        ) : results.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>No locations found</div>
        ) : (
          results.map((loc, i) => (
            <button
              key={loc.id}
              type="button"
              onClick={() => pick(loc)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
                padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                borderTop: i === 0 ? 'none' : '1px solid #f3f4f6',
              }}
            >
              <div style={{ width: 34, height: 34, borderRadius: 8, background: `${accent}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MapPin size={16} color={accent} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{loc.name}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{loc.address}</div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function Field({ label, icon, children }) {
  return (
    <div style={{ margin: '18px 0 10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>{icon}{label}</div>
      {children}
    </div>
  );
}

function PayChip({ value, label, selected, onSelect, theme }) {
  const active = value === selected;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      style={{
        padding: '10px 20px', borderRadius: 50, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
        border: `${active ? 1.5 : 1}px solid ${active ? theme.green : '#e5e7eb'}`,
        background: active ? `${theme.green}1a` : '#f9fafb',
        color: active ? theme.green : '#6b7280',
      }}
    >
      {label}
    </button>
  );
}

function ProductCard({ product, onClick }) {
  const emoji = { food: '🍛', grocery: '🛒', pharmacy: '💊', boutique: '👗', electronics: '📱', drinks: '🥤' }[product.category?.toLowerCase()] || '📦';
  return (
    <div onClick={onClick} className="vp-product-card">
      <div className="vp-product-card__img" style={product.images?.[0] ? { background: `url(${product.images[0]}) center/cover` } : undefined}>
        {!product.images?.[0] && emoji}
      </div>
      <div className="vp-product-card__body">
        <div className="vp-product-card__name">{product.name}</div>
        <div className="vp-product-card__price">
          {product.variantGroups?.some(g => g.required) ? 'from ' : ''}GHS {product.price?.toFixed(2)}
        </div>
      </div>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="vp-product-card">
      <div className="vp-product-card__img" style={{ background: '#f3f4f6' }} />
      <div className="vp-product-card__body">
        <div style={{ height: 10, width: '80%', background: '#f3f4f6', borderRadius: 5 }} />
        <div style={{ height: 10, width: '45%', background: '#f3f4f6', borderRadius: 5, marginTop: 6 }} />
      </div>
    </div>
  );
}

const inputStyle = { width: '100%', height: 44, border: '1px solid #e5e7eb', borderRadius: 10, padding: '0 12px', fontFamily: 'inherit', fontSize: 13, boxSizing: 'border-box', marginBottom: 14 };