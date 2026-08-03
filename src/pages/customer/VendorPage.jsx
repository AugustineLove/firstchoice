'use client';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Star, MapPin, Clock, Loader2, Send, CheckCircle2, Package,
  Search, X, LocateFixed, User, Plus, Minus, ChevronRight, Check, MessageSquareText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { calculateDeliveryEstimate } from './DeliveriesPage';

const TYPE_STYLE = {
  food:        { emoji: '🍛', a: '#10B981', b: '#34D399' },
  grocery:     { emoji: '🛒', a: '#10B981', b: '#34D399' },
  pharmacy:    { emoji: '💊', a: '#3B82F6', b: '#60A5FA' },
  boutique:    { emoji: '👗', a: '#EC4899', b: '#F472B6' },
  electronics: { emoji: '📱', a: '#6366F1', b: '#818CF8' },
};

// Per-product-category palette used by product cards & the options
// picker. Each has a soft two-stop tint for the placeholder background
// (used when a product has no photo) plus an accent used for a tiny
// category strip that appears on EVERY card, photo or not, so the grid
// stays glanceable and colour-coded either way.
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

// NOTE ON THE FLOW BELOW: products are shown for browsing/reference —
// tapping one either (a) drops it straight into a structured "your
// order" list, if it has no variants/addons, or (b) opens the options
// picker so the customer can choose a variant (size, weight...) and any
// addons (extras) before a fully-priced item gets added to that list.
// The order note itself stays free text, reserved for anything the
// picked items don't cover (e.g. "no pepper", "call when you arrive").
// At submit time the picked items and the free-text note are combined
// into one human-readable note that's sent to POST /orders — the
// customer never has to read or edit that combined text themselves.

function money(n) {
  return `GHS ${Number(n || 0).toFixed(2)}`;
}

// A GHS 0.00 addon is a genuinely free perk, not "nothing" — label it as such.
function addonPriceLabel(price) {
  const p = Number(price || 0);
  return p === 0 ? 'Free' : `+${money(p)}`;
}

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

  // Structured list of everything picked from the product list / options
  // picker. This drives the running subtotal AND the human-readable
  // order summary shown to the customer — the note field itself is left
  // alone for free-text extras. The real total is still set by the
  // vendor once they read the order, this is an estimate.
  const [pickedItems, setPickedItems] = useState([]);
  // shape: { id, name, variantLabel, addons: string[], note, qty, unitPrice, lineTotal }

  const pickedTotal = useMemo(
    () => pickedItems.reduce((s, i) => s + i.lineTotal, 0),
    [pickedItems]
  );
  const pickedCount = pickedItems.length;

  // ── product options picker ──
  const [activeProduct, setActiveProduct] = useState(null);

  // ── delivery location (compulsory) ──
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [destination, setDestination] = useState(null);
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

  const [orderImage, setOrderImage] = useState(null);
  const [orderImagePreview, setOrderImagePreview] = useState(null);
  const orderImageInputRef = useRef(null);

  // ── vendor rating ──
  const [ratingSummary, setRatingSummary] = useState(null); // { average, count, myRating }
  const [loadingRating, setLoadingRating] = useState(true);
  const [rateModalOpen, setRateModalOpen] = useState(false);

  function handleOrderImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setSubmitError('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { setSubmitError('Image must be under 5MB'); return; }
    setOrderImage(file);
    setOrderImagePreview(URL.createObjectURL(file));
  }

  const getPlaceholder = () => {
//     if (products.length > 0) {
//       return `Anything else we should know? e.g.
// No pepper please
// Call when you arrive
// Leave with the security post`;
//     }
    switch (vendor?.businessType) {
      case 'Food':
        return `List everything you'd like, e.g.
2x Jollof Rice (Large)
1x Grilled Chicken
1x Bottled Water
No pepper please`;
      case 'Grocery':
        return `List your grocery items, e.g.
2kg Rice
1 Crate of Eggs
1 Bottle of Cooking Oil
3 Tin tomatoes`;
      case 'Pharmacy':
        return `List the medicines or health products you need, e.g.
Paracetamol 500mg
Vitamin C
Dettol 500ml
(Include prescription if required)`;
      case 'Boutique':
        return `Describe the clothing or fashion items, e.g.
Black T-shirt (Large)
Blue Jeans Size 34
White Sneakers Size 43`;
      case 'Electronics':
        return `Describe the electronic item, e.g.
Samsung 25W Charger
Type-C Cable (1m)
Wireless Mouse
HP Laptop Bag`;
      default:
        return `Describe what you'd like us to get for you, e.g.
Documents
Small Package
Birthday Gift
Any special instructions`;
    }
  };

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

  const loadRatingSummary = useCallback(async () => {
    setLoadingRating(true);
    try {
      const res = await authFetch(`/vendors/${id}/rating/summary`);
      const json = await res.json();
      if (json.success) setRatingSummary(json.data);
    } catch {
      // non-fatal — the hero still shows vendor.rating
    }
    setLoadingRating(false);
  }, [authFetch, id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadLocations(); }, [loadLocations]);
  useEffect(() => { loadRatingSummary(); }, [loadRatingSummary]);

  const style = TYPE_STYLE[vendor?.businessType?.toLowerCase()] || { emoji: '🏪', a: '#10B981', b: '#34D399' };

  const destAddress = usingCurrentLocation && currentPosition
    ? `GPS: ${currentPosition.latitude.toFixed(5)}, ${currentPosition.longitude.toFixed(5)}`
    : destination?.name ?? '';
  const destLat = usingCurrentLocation ? currentPosition?.latitude : destination?.latitude;
  const destLng = usingCurrentLocation ? currentPosition?.longitude : destination?.longitude;
  const hasDeliveryLocation = usingCurrentLocation ? !!currentPosition : !!destination;

  function addPickedItem(item) {
    setPickedItems((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ...item },
    ]);
  }

  function removePickedItem(itemId) {
    setPickedItems((prev) => prev.filter((i) => i.id !== itemId));
  }

  // Quick-add: only reached for products with no variants and no addons.
  function addProductQuick(product) {
    const price = Number(product.price || 0);
    addPickedItem({
      name: product.name,
      variantLabel: null,
      addons: [],
      note: '',
      qty: 1,
      unitPrice: price,
      lineTotal: price,
    });
  }

  function productHasOptions(product) {
    const hasVariants = (product.variantGroups || []).some(g => (g.variants || []).some(v => v.available !== false));
    const hasAddons   = (product.addonGroups   || []).some(g => (g.addons   || []).some(a => a.available !== false));
    return hasVariants || hasAddons;
  }

  function handleProductTap(product) {
    if (productHasOptions(product)) {
      setActiveProduct(product);
    } else {
      addProductQuick(product);
    }
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

  // Turns the structured picks + free-text note into the single
  // human-readable string the vendor actually reads. Built once, at
  // submit time — the customer never sees or edits this raw form.
  function buildFinalNote() {
    const itemLines = pickedItems.map((item) => {
      let line = `${item.qty}x ${item.name}`;
      if (item.variantLabel) line += ` (${item.variantLabel})`;
      if (item.addons.length) line += `\n   + ${item.addons.join(', ')}`;
      if (item.note) line += `\n   Note: ${item.note}`;
      line += `\n   ${money(item.lineTotal)}`;
      return line;
    });

    const extra = note.trim();
    const parts = [...itemLines];
    if (extra) parts.push(itemLines.length ? `Additional notes:\n${extra}` : extra);
    return parts.join('\n\n');
  }

  const hasOrderContent = pickedItems.length > 0 || note.trim().length > 0;
  const friendDetailsValid = !forFriend || (recipientName.trim() && recipientPhone.trim());
  const canSubmit = hasOrderContent && hasDeliveryLocation && payment && friendDetailsValid && !submitting;

  async function submitOrder() {
    if (!canSubmit || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError(null);
    try {
      console.log(`Subtotal: ${pickedTotal}, note: ${buildFinalNote()}`);
      const res = await authFetch('/orders', {
        method: 'POST',
        body: JSON.stringify({
          vendorId: id,
          note: buildFinalNote(),
          deliveryAddress: destAddress,
          deliveryLatitude: destLat,
          deliveryLongitude: destLng,
          paymentMethod: payment,
          subtotal: pickedTotal,
          ...(forFriend ? {
            recipientName: recipientName.trim(),
            recipientPhone: recipientPhone.trim(),
          } : {}),
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setSubmitError(json.message || 'Could not submit your order.');
        submittingRef.current = false;
        setSubmitting(false);
        return;
      }

      if (orderImage) {
        try {
          const fd = new FormData();
          fd.append('image', orderImage);
          await authFetch(`/orders/${json.data.order.id}/image`, { method: 'POST', body: fd });
        } catch {
          // silently ignore — order already exists
        }
      }

      setSubmitted(true);
      setNote('');
      setPickedItems([]);
      setDestination(null);
      setUsingCurrentLocation(false);
      setCurrentPosition(null);
      setForFriend(false);
      setRecipientName('');
      setRecipientPhone('');
      setOrderImage(null);
      setOrderImagePreview(null);
    } catch {
      setSubmitError('Could not reach the server.');
    }
    submittingRef.current = false;
    setSubmitting(false);
  }

  async function submitVendorRating(stars, comment) {
    const res = await authFetch(`/vendors/${id}/rating`, {
      method: 'POST',
      body: JSON.stringify({ rating: stars, comment }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Could not submit your rating.');
    // Optimistically fold the new vote into the summary we already have.
    setRatingSummary((prev) => {
      const prevAvg = prev?.average ?? 0;
      const prevCount = prev?.count ?? 0;
      const newCount = prevCount + 1;
      const newAvg = (prevAvg * prevCount + stars) / newCount;
      return { average: Number(newAvg.toFixed(2)), count: newCount, myRating: { rating: stars, comment } };
    });
    setVendor((v) => (v ? { ...v, rating: ratingSummary ? ratingSummary.average : v.rating } : v));
    return json;
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
              <button
                type="button"
                className="vp-hero__rating"
                onClick={() => document.getElementById('vp-ratings-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                <Star size={13} fill="#f59e0b" color="#f59e0b" />
                {(ratingSummary?.average ?? vendor.rating ?? 0).toFixed(1)}
                {ratingSummary?.count ? <span style={{ opacity: 0.85, fontWeight: 600 }}>({ratingSummary.count})</span> : null}
              </button>
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

        {/* ── PRODUCTS ── */}
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f1117', margin: '20px 0 6px' }}>Available Products</h2>
        <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 14px' }}>
          Tap an item — if it has sizes or extras you'll get to choose, otherwise it's added straight to your order
        </p>

        {loading && (
          <div className="vp-product-list">
            {Array.from({ length: 5 }).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>We're working hard to add products for easier shopping. In the meantime, simply type what you'd like us to get for you below, and we'll take care of the rest.</p>
        )}

        {!loading && products.length > 0 && (
          <div className="vp-product-list" style={{ marginBottom: 8 }}>
            {products.map((p) => (
              <ProductCard key={p.id} product={p} hasOptions={productHasOptions(p)} theme={theme} onClick={() => handleProductTap(p)} />
            ))}
          </div>
        )}

        {/* ── ORDER SUMMARY (structured, human-readable) ── */}
        {pickedItems.length > 0 && (
          <div style={{ margin: '24px 0 4px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8, letterSpacing: 0.3 }}>YOUR ORDER</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pickedItems.map((item) => (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10,
                  background: '#fff', border: '1px solid #f0f0f0', borderRadius: 12, padding: '10px 12px',
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f1117' }}>
                      {item.name}{item.variantLabel ? ` (${item.variantLabel})` : ''}
                    </div>
                    {item.addons.length > 0 && (
                      <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 2 }}>+ {item.addons.join(', ')}</div>
                    )}
                    {item.note && (
                      <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 2, fontStyle: 'italic' }}>&ldquo;{item.note}&rdquo;</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#10b981' }}>{money(item.lineTotal)}</span>
                    <button
                      type="button"
                      onClick={() => removePickedItem(item.id)}
                      aria-label={`Remove ${item.name}`}
                      style={{
                        width: 22, height: 22, borderRadius: '50%', border: 'none', background: '#f3f4f6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
                      }}
                    >
                      <X size={12} color="#6b7280" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8,
              padding: '8px 12px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0',
            }}>
              <span style={{ fontSize: 12, color: '#166534', fontWeight: 600 }}>
                Estimated subtotal · {pickedCount} item{pickedCount !== 1 ? 's' : ''}
              </span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#166534' }}>{money(pickedTotal)}</span>
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
              Estimate only — we will confirm the final total
            </div>
          </div>
        )}

        {/* ── ORDER NOTE ── */}
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f1117', margin: '28px 0 10px' }}>
          {pickedItems.length > 0 ? 'Anything else?' : 'What would you like to order?'}
        </h2>

        {submitted ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, background: '#ecfdf5', border: `1px solid ${theme.green}`,
            borderRadius: 14, padding: '16px 18px', marginBottom: 20,
          }}>
            <CheckCircle2 size={22} color={theme.green} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#0f1117' }}>Order placed</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>We'll confirm the details and total shortly.</div>
            </div>
          </div>
        ) : (
          <>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={pickedItems.length > 0 ? 3 : 6}
              placeholder={getPlaceholder()}
              style={{
                width: '100%', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16, fontFamily: 'inherit',
                fontSize: 14, lineHeight: 1.6, resize: 'vertical', boxSizing: 'border-box', color: '#0f1117',
              }}
            />

            <div style={{ margin: '12px 0 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                <Package size={15} color="#9ca3af" />
                ATTACH A PHOTO <span style={{ fontWeight: 500, color: '#9ca3af' }}>(optional)</span>
              </div>

              {orderImagePreview ? (
                <div style={{ position: 'relative', width: 96, height: 96, borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                  <img src={orderImagePreview} alt="Order reference" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => { setOrderImage(null); setOrderImagePreview(null); }}
                    style={{
                      position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <X size={13} color="#fff" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => orderImageInputRef.current?.click()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10,
                    border: '1px dashed #d1d5db', background: '#f9fafb', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <Package size={16} color="#9ca3af" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Add a photo</span>
                </button>
              )}
              <input ref={orderImageInputRef} type="file" accept="image/*" onChange={handleOrderImageSelect} style={{ display: 'none' }} />
            </div>

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
                  placeholder="Friend's phone number"
                  style={inputStyle}
                />
              </div>
            )}

            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', marginBottom: 14,
              border: `1px solid ${theme.green}`, borderRadius: 10, background: '#f9fafb',
            }}>
              <span style={{ fontSize: 13, color: '#374151' }}>Delivery Fee:</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: theme.green }}>
                {(() => {
                  const pickupLat = vendor?.latitude != null ? Number(vendor.latitude) : null;
                  const pickupLng = vendor?.longitude != null ? Number(vendor.longitude) : null;
                  const dLat = usingCurrentLocation ? currentPosition?.latitude : destination?.latitude;
                  const dLng = usingCurrentLocation ? currentPosition?.longitude : destination?.longitude;
                  if (pickupLat == null || pickupLng == null || dLat == null || dLng == null || Number.isNaN(pickupLat) || Number.isNaN(pickupLng)) {
                    return 'GHS —';
                  }

                  const fee = calculateDeliveryEstimate({ pickupLat, pickupLng, destLat: Number(dLat), destLng: Number(dLng) });
                  return Number.isNaN(fee) ? 'GHS —' : `GHS ${fee}.00`;
                })()}
              </span>
            </div>

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

        {/* ── RATINGS ── */}
        <div id="vp-ratings-section" style={{ marginTop: 36 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f1117', margin: '0 0 10px' }}>Ratings & Reviews</h2>
          <RatingSummaryCard
            summary={ratingSummary}
            loading={loadingRating}
            theme={theme}
            onRate={() => setRateModalOpen(true)}
          />
        </div>
      </div>

      {activeProduct && (
        <ProductOptionsModal
          product={activeProduct}
          theme={theme}
          onClose={() => setActiveProduct(null)}
          onConfirm={(item) => { addPickedItem(item); setActiveProduct(null); }}
        />
      )}

      {rateModalOpen && (
        <RateVendorModal
          vendorName={vendor?.businessName}
          theme={theme}
          onClose={() => setRateModalOpen(false)}
          onSubmit={async (stars, comment) => {
            await submitVendorRating(stars, comment);
            setRateModalOpen(false);
          }}
        />
      )}

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
          cursor: pointer;
          font-family: inherit;
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

        /* ── PRODUCT LIST — horizontal rows, not tiles.
           Rows read better on narrow phone widths than a square grid (no
           awkward wrapping, no orphaned single tile on the last row), and
           a no-photo product only has to fill a small 56px thumbnail
           instead of an entire tile, so the placeholder never dominates. ── */
        .vp-product-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .vp-product-row {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #fff;
          border-radius: 14px;
          border: 1px solid #f0f0f0;
          padding: 8px;
          cursor: pointer;
          transition: transform 0.1s ease, border-color 0.12s ease;
        }
        .vp-product-row:active {
          transform: scale(0.985);
        }

        .vp-row__thumb {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          flex-shrink: 0;
          overflow: hidden;
          position: relative;
        }
        .vp-row__thumb--photo {
          /* photo supplied via inline background */
        }
        .vp-row__thumb--placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }

        .vp-row__content {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: left;
          text-align: left;
        }
        .vp-row__name {
          font-size: 13.5px;
          font-weight: 700;
          color: #0f1117;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          line-height: 1.3;
        }
        .vp-row__desc {
          font-size: 11.5px;
          color: #9ca3af;
          margin-top: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          align-items: left;
        }
        .vp-row__footer {
          display: flex;
          align-items: left;
          gap: 8px;
          margin-top: 4px;
        }
        .vp-row__price {
          font-size: 12.5px;
          font-weight: 800;
          color: #10b981;
        }
        .vp-row__customize {
          font-size: 10px;
          font-weight: 700;
          color: #6b7280;
          background: #f3f4f6;
          padding: 2px 7px;
          border-radius: 50px;
        }

        .vp-row__action {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* skeleton */
        .vp-row-skel { animation: pulse 1.3s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}

/* ════════════════════════════════════════════
   PRODUCT OPTIONS MODAL
   Opened when a product has variant groups and/or addon groups.
   Lets the customer choose a variant (radio, price-adjusting),
   pick addons (checkbox or stepper, price-adjusting, "Free" when
   0), set a quantity, and add a per-item note — then hands back a
   structured, fully-priced item for the parent to add to the
   order summary (never a pre-formatted string).
════════════════════════════════════════════ */
function ProductOptionsModal({ product, theme, onClose, onConfirm }) {
  const variantGroups = (product.variantGroups || []).map(g => ({
    ...g,
    variants: (g.variants || []).filter(v => v.available !== false),
  })).filter(g => g.variants.length > 0);

  const addonGroups = (product.addonGroups || []).map(g => ({
    ...g,
    addons: (g.addons || []).filter(a => a.available !== false),
  })).filter(g => g.addons.length > 0);

  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState({}); // groupId -> variant
  const [addonQty, setAddonQty] = useState({}); // addonId -> qty (0 = not selected)
  const [itemNote, setItemNote] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  function pickVariant(groupId, variant) {
    setSelectedVariants((prev) => ({ ...prev, [groupId]: variant }));
  }

  function addonGroupSelectedCount(group) {
    return group.addons.reduce((n, a) => n + (addonQty[a.id] > 0 ? 1 : 0), 0);
  }

  function toggleAddon(group, addon) {
    setAddonQty((prev) => {
      const current = prev[addon.id] || 0;
      if (current > 0) return { ...prev, [addon.id]: 0 };
      const selectedInGroup = addonGroupSelectedCount(group);
      if (selectedInGroup >= (group.maxSelect ?? 10)) return prev; // group full
      return { ...prev, [addon.id]: 1 };
    });
  }

  function bumpAddonQty(addon, delta) {
    setAddonQty((prev) => {
      const next = Math.max(0, Math.min(20, (prev[addon.id] || 0) + delta));
      return { ...prev, [addon.id]: next };
    });
  }

  function addonExtraCost(addon, qty) {
    if (qty <= 0) return 0;
    const price = Number(addon.price || 0);
    if (!addon.incrementable) return price;
    if (addon.incrementMode === 'free') return price + (qty - 1);
    return price * qty; // 'multiple' (default)
  }

  const variantsTotal = useMemo(
    () => Object.values(selectedVariants).reduce((s, v) => s + Number(v?.priceAdjustment || 0), 0),
    [selectedVariants]
  );

  const addonsTotal = useMemo(() => {
    let total = 0;
    for (const g of addonGroups) {
      for (const a of g.addons) {
        total += addonExtraCost(a, addonQty[a.id] || 0);
      }
    }
    return total;
  }, [addonGroups, addonQty]);

  const unitPrice = Number(product.price || 0) + variantsTotal + addonsTotal;
  const lineTotal = unitPrice * quantity;

  const missingRequiredGroup = variantGroups.find(g => g.required && !selectedVariants[g.id]);
  const invalidAddonGroup = addonGroups.find(g => {
    const n = addonGroupSelectedCount(g);
    return n < (g.minSelect ?? 0);
  });
  const canConfirm = !missingRequiredGroup && !invalidAddonGroup;

  function handleConfirm() {
    setTouched(true);
    if (!canConfirm) return;

    const variantNames = Object.values(selectedVariants).filter(Boolean).map(v => v.name);

    const addons = [];
    for (const g of addonGroups) {
      for (const a of g.addons) {
        const qty = addonQty[a.id] || 0;
        if (qty <= 0) continue;
        const label = a.incrementable && qty > 1 ? `${qty}x ${a.name}` : a.name;
        const extra = addonExtraCost(a, qty);
        addons.push(`${label} (${addonPriceLabel(extra)})`);
      }
    }

    onConfirm({
      name: product.name,
      variantLabel: variantNames.length ? variantNames.join(', ') : null,
      addons,
      note: itemNote.trim(),
      qty: quantity,
      unitPrice,
      lineTotal,
    });
  }

  const cat = categoryStyle(product.category);

  return (
    <div className="pom-overlay" onClick={onClose}>
      <div className="pom-sheet" onClick={(e) => e.stopPropagation()}>

        <div className="pom-handle" />

        <div className="pom-header">
          <div
            className="pom-header__img"
            style={product.images?.[0]
              ? { background: `url(${product.images[0]}) center/cover` }
              : { background: `linear-gradient(135deg, ${cat.tintA}, ${cat.tintB})` }}
          >
            {!product.images?.[0] && product.name[0]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="pom-header__name">{product.name}</div>
            <div className="pom-header__price">Order</div>
          </div>
          <button type="button" onClick={onClose} className="pom-close"><X size={16} color="#6b7280" /></button>
        </div>

        {product.description && <p className="pom-desc">{product.description}</p>}

        <div className="pom-body">
          {variantGroups.map((g) => (
            <div key={g.id} className="pom-group">
              <div className="pom-group__header">
                <span>{g.name}</span>
                <span className={`pom-group__tag ${g.required ? 'pom-group__tag--required' : ''}`}>
                  {g.required ? 'Required · pick 1' : 'Optional'}
                </span>
              </div>
              {g.variants.map((v) => {
                const active = selectedVariants[g.id]?.id === v.id;
                return (
                  <button
                    type="button"
                    key={v.id}
                    className={`pom-option ${active ? 'pom-option--active' : ''}`}
                    onClick={() => pickVariant(g.id, active && !g.required ? null : v)}
                  >
                    <span className="pom-option__radio">{active && <Check size={11} color="#fff" />}</span>
                    <span className="pom-option__name">{v.name}</span>
                    <span className="pom-option__price">
                      {Number(v.priceAdjustment || 0) === 0 ? 'Included' : `+${money(v.priceAdjustment)}`}
                    </span>
                  </button>
                );
              })}
              {touched && g.required && !selectedVariants[g.id] && (
                <div className="pom-error">Please choose an option</div>
              )}
            </div>
          ))}

          {addonGroups.map((g) => {
            const selectedCount = addonGroupSelectedCount(g);
            const groupInvalid = touched && selectedCount < (g.minSelect ?? 0);
            return (
              <div key={g.id} className="pom-group">
                <div className="pom-group__header">
                  <span>{g.name}</span>
                  {/* <span className="pom-group__tag">
                    {g.minSelect > 0 ? `Pick ${g.minSelect}–${g.maxSelect ?? 10}` : `Up to ${g.maxSelect ?? 10}`}
                  </span> */}
                </div>
                {g.addons.map((a) => {
                  const qty = addonQty[a.id] || 0;
                  const active = qty > 0;
                  return (
                    <div key={a.id} className={`pom-addon ${active ? 'pom-addon--active' : ''}`}>
                      <button type="button" className="pom-addon__main" onClick={() => toggleAddon(g, a)}>
                        <span className="pom-option__radio pom-option__radio--square">{active && <Check size={11} color="#fff" />}</span>
                        <span className="pom-option__name">{a.name}</span>
                        <span className={`pom-option__price ${Number(a.price || 0) === 0 ? 'pom-option__price--free' : ''}`}>
                          {addonPriceLabel(a.price)}
                        </span>
                      </button>
                      {active && a.incrementable && (
                        <div className="pom-stepper pom-stepper--sm">
                          <button type="button" onClick={() => bumpAddonQty(a, -1)}><Minus size={12} /></button>
                          <span>{qty}</span>
                          <button type="button" onClick={() => bumpAddonQty(a, 1)}><Plus size={12} /></button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {groupInvalid && (
                  <div className="pom-error">Please choose at least {g.minSelect}</div>
                )}
              </div>
            );
          })}

          <div className="pom-group">
            <div className="pom-group__header"><span>Note for this item</span><span className="pom-group__tag">Optional</span></div>
            <div className="pom-note-wrap">
              <MessageSquareText size={14} color="#9ca3af" style={{ flexShrink: 0, marginTop: 2 }} />
              <input
                value={itemNote}
                onChange={(e) => setItemNote(e.target.value)}
                placeholder="e.g. No pepper, extra crispy..."
                className="pom-note-input"
              />
            </div>
          </div>
        </div>

        <div className="pom-footer">
          <div className="pom-stepper">
            <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))}><Minus size={14} /></button>
            <span>{quantity}</span>
            <button type="button" onClick={() => setQuantity((q) => Math.min(50, q + 1))}><Plus size={14} /></button>
          </div>
          <button type="button" className="pom-confirm" style={{ background: theme.green }} onClick={handleConfirm}>
            <span>Add to order</span>
            <span className="pom-confirm__price">{money(lineTotal)}</span>
          </button>
        </div>
      </div>

      <style>{`
        .pom-overlay {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(15,17,23,0.5);
          display: flex; align-items: flex-end; justify-content: center;
          animation: pomFade 0.15s ease;
        }
        @keyframes pomFade { from { opacity: 0; } to { opacity: 1; } }
        @media (min-width: 640px) {
          .pom-overlay { align-items: center; padding: 20px; }
        }
        .pom-sheet {
          background: #fff;
          width: 100%; max-width: 480px;
          max-height: 90vh;
          border-radius: 22px 22px 0 0;
          display: flex; flex-direction: column;
          animation: pomUp 0.2s ease;
        }
        @media (min-width: 640px) {
          .pom-sheet { border-radius: 22px; max-height: 85vh; }
        }
        @keyframes pomUp { from { transform: translateY(24px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .pom-handle {
          width: 40px; height: 4px; background: #e5e7eb; border-radius: 2px;
          margin: 10px auto 4px; flex-shrink: 0;
        }
        .pom-header { display: flex; align-items: center; gap: 12px; padding: 12px 18px; flex-shrink: 0; }
        .pom-header__img {
          width: 52px; height: 52px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0;
          overflow: hidden;
        }
        .pom-header__name { font-size: 15px; font-weight: 800; color: #0f1117; }
        .pom-header__price { font-size: 12px; color: #10b981; font-weight: 700; margin-top: 2px; }
        .pom-close {
          width: 30px; height: 30px; border-radius: 50%; border: none; background: #f3f4f6;
          display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;
        }
        .pom-desc { padding: 0 18px 8px; font-size: 12.5px; color: #9ca3af; line-height: 1.5; }
        .pom-body { overflow-y: auto; padding: 6px 18px 12px; flex: 1; }
        .pom-group { margin-bottom: 18px; }
        .pom-group__header {
          display: flex; align-items: center; justify-content: space-between;
          font-size: 13px; font-weight: 800; color: #0f1117; margin-bottom: 8px;
        }
        .pom-group__tag {
          font-size: 10.5px; font-weight: 700; color: #9ca3af; background: #f3f4f6;
          padding: 2px 8px; border-radius: 50px;
        }
        .pom-group__tag--required { color: #b45309; background: #fffbeb; }
        .pom-option, .pom-addon__main {
          width: 100%; display: flex; align-items: center; gap: 10px; text-align: left;
          padding: 10px 12px; border-radius: 12px; border: 1px solid #e5e7eb; background: #fff;
          cursor: pointer; font-family: inherit; margin-bottom: 7px;
        }
        .pom-option--active, .pom-addon--active .pom-addon__main {
          border-color: #10b981; background: #f0fdf4;
        }
        .pom-option__radio {
          width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid #d1d5db;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .pom-option__radio--square { border-radius: 5px; }
        .pom-option--active .pom-option__radio, .pom-addon--active .pom-option__radio {
          background: #10b981; border-color: #10b981;
        }
        .pom-option__name { flex: 1; font-size: 13px; font-weight: 700; color: #0f1117; }
        .pom-option__price { font-size: 12px; font-weight: 700; color: #6b7280; }
        .pom-option__price--free { color: #10b981; }
        .pom-addon { margin-bottom: 7px; }
        .pom-addon .pom-addon__main { margin-bottom: 0; }
        .pom-addon .pom-stepper--sm { margin: 6px 0 0 12px; }
        .pom-error { font-size: 11px; color: #dc2626; margin-top: -2px; margin-bottom: 6px; font-weight: 600; }
        .pom-note-wrap {
          display: flex; align-items: flex-start; gap: 8px; border: 1px solid #e5e7eb;
          border-radius: 12px; padding: 10px 12px;
        }
        .pom-note-input { flex: 1; border: none; outline: none; font-size: 13px; font-family: inherit; }
        .pom-footer {
          display: flex; align-items: center; gap: 10px; padding: 14px 18px;
          border-top: 1px solid #f0f0f0; flex-shrink: 0;
        }
        .pom-stepper {
          display: flex; align-items: center; gap: 10px; border: 1px solid #e5e7eb;
          border-radius: 10px; padding: 6px 10px; flex-shrink: 0;
        }
        .pom-stepper button {
          width: 22px; height: 22px; border-radius: 50%; border: none; background: #f3f4f6;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
        }
        .pom-stepper span { font-size: 13px; font-weight: 800; min-width: 16px; text-align: center; }
        .pom-confirm {
          flex: 1; height: 46px; border: none; border-radius: 12px; color: #fff; font-family: inherit;
          font-weight: 800; font-size: 13px; cursor: pointer; display: flex; align-items: center;
          justify-content: space-between; padding: 0 16px;
        }
        .pom-confirm__price { font-size: 13px; font-weight: 900; }
      `}</style>
    </div>
  );
}

/* ════════════════════════════════════════════
   VENDOR RATING — summary card + submit modal
════════════════════════════════════════════ */
function StarRow({ value, size = 14, interactive = false, onChange }) {
  const [hover, setHover] = useState(0);
  const display = interactive && hover ? hover : value;
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
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

function RatingSummaryCard({ summary, loading, theme, onRate }) {
  if (loading) {
    return <div style={{ height: 84, borderRadius: 14, background: '#f3f4f6' }} />;
  }

  const average = summary?.average ?? 0;
  const count = summary?.count ?? 0;
  const myRating = summary?.myRating;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      background: '#fff', border: '1px solid #f0f0f0', borderRadius: 16, padding: '16px 18px', marginBottom: 20,
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 26, fontWeight: 900, color: '#0f1117' }}>{average.toFixed(1)}</span>
          <StarRow value={Math.round(average)} size={16} />
        </div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
          {count > 0 ? `Based on ${count} rating${count !== 1 ? 's' : ''}` : 'No ratings yet — be the first'}
        </div>
      </div>

      {myRating ? (
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>Your rating</div>
          <StarRow value={myRating.rating} size={15} />
        </div>
      ) : (
        <button
          type="button"
          onClick={onRate}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10,
            border: 'none', background: theme.green, color: '#fff', fontWeight: 800, fontSize: 13,
            fontFamily: 'inherit', cursor: 'pointer', flexShrink: 0,
          }}
        >
          Rate vendor <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

function RateVendorModal({ vendorName, theme, onClose, onSubmit }) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit() {
    if (stars < 1) { setError('Please select a star rating'); return; }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(stars, comment.trim());
    } catch (e) {
      setError(e.message || 'Could not submit your rating.');
      setSubmitting(false);
    }
  }

  return (
    <div className="rm-overlay" onClick={onClose}>
      <div className="rm-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="rm-close"><X size={16} color="#6b7280" /></button>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#0f1117', marginBottom: 2 }}>Rate {vendorName || 'this vendor'}</div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 18 }}>You can only rate a vendor once — make it count!</div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <StarRow value={stars} size={30} interactive onChange={setStars} />
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Optional — tell others about your experience"
          rows={3}
          style={{
            width: '100%', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, fontFamily: 'inherit',
            fontSize: 13, resize: 'vertical', boxSizing: 'border-box', marginBottom: 12,
          }}
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
          {submitting ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Submitting...</> : 'Submit Rating'}
        </button>
      </div>

      <style>{`
        .rm-overlay {
          position: fixed; inset: 0; z-index: 100; background: rgba(15,17,23,0.5);
          display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .rm-card {
          background: #fff; width: 100%; max-width: 360px; border-radius: 20px;
          padding: 22px; position: relative;
        }
        .rm-close {
          position: absolute; top: 14px; right: 14px; width: 28px; height: 28px; border-radius: 50%;
          border: none; background: #f3f4f6; display: flex; align-items: center; justify-content: center; cursor: pointer;
        }
      `}</style>
    </div>
  );
}

/* ════════════════════════════════════════════
   LocationPicker — unchanged from before: three states
   (closed+empty → plain button with no <input> in the DOM,
   closed+selected → collapsed pill, open → real input with
   autoFocus, only ever reached via a deliberate tap) so mobile
   browsers never pop the keyboard on page load.
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

function ProductCard({ product, hasOptions, theme, onClick }) {
  const cat = categoryStyle(product.category);
  const hasPhoto = !!product.images?.[0];
  const actionColor = theme?.green || '#10B981';

  return (
    <div onClick={onClick} className="vp-product-row">
      <div
        className={`vp-row__thumb ${hasPhoto ? 'vp-row__thumb--photo' : 'vp-row__thumb--placeholder'}`}
        style={hasPhoto
          ? { background: `url(${product.images[0]}) center/cover` }
          : { background: `linear-gradient(135deg, ${cat.tintA}, ${cat.tintB})` }}
      >
        {hasPhoto ? '' : product.name[0]}
      </div>

      <div className="vp-row__content">
        <div className="vp-row__name">{product.name}</div>
        {product.description && <div className="vp-row__desc">{product.description}</div>}
        <div className="vp-row__footer">
          <span className="vp-row__price">Order</span>
          {hasOptions && <span className="vp-row__customize">Customize</span>}
        </div>
      </div>

      <div className="vp-row__action" style={{ background: hasOptions ? '#f3f4f6' : `${actionColor}1a` }}>
        {hasOptions
          ? <ChevronRight size={16} color="#6b7280" />
          : <Plus size={17} color={actionColor} strokeWidth={2.75} />}
      </div>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="vp-product-row vp-row-skel">
      <div className="vp-row__thumb" style={{ background: '#f3f4f6' }} />
      <div className="vp-row__content">
        <div style={{ height: 11, width: '55%', background: '#f3f4f6', borderRadius: 5 }} />
        <div style={{ height: 9, width: '30%', background: '#f3f4f6', borderRadius: 5, marginTop: 8 }} />
      </div>
      <div className="vp-row__action" style={{ background: '#f3f4f6' }} />
    </div>
  );
}

const inputStyle = { width: '100%', height: 44, border: '1px solid #e5e7eb', borderRadius: 10, padding: '0 12px', fontFamily: 'inherit', fontSize: 13, boxSizing: 'border-box', marginBottom: 14 };