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
    if (!canSubmit) return;
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
    setSubmitting(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8faf8', fontFamily: "'DM Sans', system-ui, sans-serif", paddingBottom: 40 }}>

      {/* ── PROFILE HEADER ── */}
      <div style={{ height: 190, position: 'relative', background: vendor?.logo ? `url(${vendor.logo}) center/cover` : `linear-gradient(135deg, ${style.a}, ${style.b})` }}>
        <button onClick={() => navigate(-1)} style={{
          position: 'absolute', top: 16, left: 16, width: 36, height: 36, borderRadius: '50%',
          background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}><ArrowLeft size={18} color="#0f1117" /></button>
        {!vendor?.logo && !loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52 }}>{style.emoji}</div>
        )}
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 20px' }}>

        {/* ── VENDOR INFO ── */}
        {loading ? (
          <div style={{ padding: '18px 0' }}>
            <div style={{ height: 22, width: 220, background: '#f3f4f6', borderRadius: 6 }} />
          </div>
        ) : error ? (
          <p style={{ color: '#dc2626', padding: '18px 0' }}>{error}</p>
        ) : vendor && (
          <div style={{ padding: '18px 0', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f1117', margin: 0 }}>{vendor.businessName}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fef3c7', padding: '5px 10px', borderRadius: 50, flexShrink: 0 }}>
                <Star size={14} fill="#f59e0b" color="#f59e0b" />
                <span style={{ fontSize: 13, fontWeight: 800, color: '#0f1117' }}>{(vendor.rating ?? 0).toFixed(1)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: theme.green, background: `${theme.green}18`, padding: '4px 10px', borderRadius: 50 }}>
                {vendor.businessType}
              </span>
              {vendor.address && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#6b7280' }}>
                  <MapPin size={13} />{vendor.address}
                </span>
              )}
              {vendor.openingHours && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#6b7280' }}>
                  <Clock size={13} />{vendor.openingHours}
                </span>
              )}
            </div>
            {vendor.description && (
              <p style={{ fontSize: 13, color: '#6b7280', marginTop: 10, lineHeight: 1.5 }}>{vendor.description}</p>
            )}
          </div>
        )}

        {/* ── PRODUCTS (reference only — tap to drop into the order note) ── */}
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f1117', margin: '20px 0 6px' }}>Available Products</h2>
        <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 14px' }}>Tap an item to add it to your order note below</p>

        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>No products available</p>
        )}

        {!loading && products.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 8 }}>
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
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ════════════════════════════════════════════
   LocationPicker — same pattern as the deliveries
   page: search box + dropdown of saved locations,
   collapses into a selected pill once chosen.
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

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {displayLabel && !open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
            padding: '11px 14px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
            border: `1.5px solid ${accent}`, background: `${accent}14`,
          }}
        >
          <CheckCircle2 size={16} color={accent} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{displayLabel}</div>
            {selected?.address && (
              <div style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selected.address}</div>
            )}
          </div>
        </button>
      ) : (
        <div style={{ position: 'relative' }}>
          <Search size={16} color={accent} style={{ position: 'absolute', left: 12, top: 13 }} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder={hint}
            style={{ ...inputStyle, paddingLeft: 36, paddingRight: query ? 32 : 12, marginBottom: 0 }}
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} style={{ position: 'absolute', right: 10, top: 13, background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
              <X size={15} color="#9ca3af" />
            </button>
          )}
        </div>
      )}

      {open && (
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
      )}
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
    <div onClick={onClick} style={{ background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0', overflow: 'hidden', cursor: 'pointer' }}>
      <div style={{
        height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34,
        background: product.images?.[0] ? `url(${product.images[0]}) center/cover` : '#ecfdf5',
      }}>
        {!product.images?.[0] && emoji}
      </div>
      <div style={{ padding: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f1117', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</div>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#10b981', marginTop: 4 }}>
          {product.variantGroups?.some(g => g.required) ? 'from ' : ''}GHS {product.price?.toFixed(2)}
        </div>
      </div>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
      <div style={{ height: 110, background: '#f3f4f6' }} />
      <div style={{ padding: 10 }}>
        <div style={{ height: 12, width: '80%', background: '#f3f4f6', borderRadius: 6 }} />
        <div style={{ height: 12, width: '40%', background: '#f3f4f6', borderRadius: 6, marginTop: 8 }} />
      </div>
    </div>
  );
}

const inputStyle = { width: '100%', height: 44, border: '1px solid #e5e7eb', borderRadius: 10, padding: '0 12px', fontFamily: 'inherit', fontSize: 13, boxSizing: 'border-box', marginBottom: 14 };