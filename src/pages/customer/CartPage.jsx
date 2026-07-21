'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag, MapPin, User, CreditCard, Receipt, Search, X, CheckCircle2,
  LocateFixed, Loader2, Plus, Minus, Trash2, Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';

function filterLocations(all, query) {
  if (!query.trim()) return all;
  const q = query.toLowerCase();
  return all.filter((l) => l.name.toLowerCase().includes(q) || l.address.toLowerCase().includes(q));
}

export default function CartPage() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const { theme } = useTheme();
  const { items, updateQuantity, removeItem, addItem, clear, subtotal, deliveryFee, total } = useCart();

  // Saved locations
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [usingCurrentLocation, setUsingCurrentLocation] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const [deliverToSomeoneElse, setDeliverToSomeoneElse] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');

  const [paymentMethod, setPaymentMethod] = useState('CASH');

  const loadLocations = useCallback(async () => {
    setLoadingLocations(true);
    try {
      const res = await authFetch('/locations'); // adjust to your saved-locations endpoint if different
      const json = await res.json();
      if (json.success) setLocations(json.data.locations ?? json.data);
    } catch {}
    setLoadingLocations(false);
  }, [authFetch]);

  useEffect(() => { loadLocations(); }, [loadLocations]);

  const resolvedAddress = usingCurrentLocation && currentPosition
    ? `GPS: ${currentPosition.latitude.toFixed(5)}, ${currentPosition.longitude.toFixed(5)}`
    : selectedLocation?.address ?? '';
  const locationName = selectedLocation?.name ?? (usingCurrentLocation ? 'Current location' : '');
  const addressReady = !!selectedLocation || (usingCurrentLocation && !!currentPosition);

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
        setSelectedLocation(null);
        setLocating(false);
      },
      (err) => {
        setLocationError(err.message || 'Could not get your location.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function pickLocation(loc) {
    setSelectedLocation(loc);
    setUsingCurrentLocation(false);
    setCurrentPosition(null);
  }

  function placeOrder() {
    if (!addressReady) return;
    if (deliverToSomeoneElse && (!recipientName.trim() || !recipientPhone.trim())) return;
    navigate('/checkout', {
      state: {
        address: resolvedAddress,
        locationName,
        paymentMethod,
        recipientName: deliverToSomeoneElse ? recipientName.trim() : null,
        recipientPhone: deliverToSomeoneElse ? recipientPhone.trim() : null,
      },
    });
  }

  if (!items || items.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8faf8', fontFamily: "'DM Sans', system-ui, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#9ca3af' }}>
          <ShoppingBag size={48} style={{ marginBottom: 14 }} />
          <div style={{ fontSize: 17, fontWeight: 700, color: '#6b7280' }}>Your cart is empty</div>
          <div style={{ fontSize: 14, marginTop: 6 }}>Add items from a vendor to get started</div>
        </div>
      </div>
    );
  }

  const recipientReady = !deliverToSomeoneElse || (recipientName.trim() && recipientPhone.trim());
  const canPlaceOrder = addressReady && recipientReady;

  return (
    <div style={{ minHeight: '100vh', background: '#f8faf8', fontFamily: "'DM Sans', system-ui, sans-serif", paddingBottom: 120 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 800, fontSize: 16 }}>Cart ({items.length} item{items.length !== 1 ? 's' : ''})</span>
          <button onClick={clear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: 700, fontSize: 13, fontFamily: 'inherit' }}>Clear all</button>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: 20 }}>

        {/* ── ITEMS ── */}
        <SectionCard title="Your Items" icon={<ShoppingBag size={16} color={theme.green} />}>
          {items.map((item, i) => (
            <div key={item.productId}>
              <CartItemRow item={item} theme={theme} onQty={(q) => updateQuantity(item.productId, q)} onRemove={() => removeItem(item.productId)} />
              {i < items.length - 1 && <div style={{ borderTop: '1px solid #f0f0f0', margin: '4px 0' }} />}
            </div>
          ))}
        </SectionCard>

        {/* ── DELIVERY LOCATION ── */}
        <SectionCard title="Delivery Location" icon={<MapPin size={16} color={theme.green} />}>
          {locationError && <div style={{ color: '#dc2626', fontSize: 12, marginBottom: 10 }}>{locationError}</div>}

          <LocationPicker
            hint="Search delivery location..."
            selected={selectedLocation}
            locations={locations}
            loading={loadingLocations}
            accent={theme.green}
            overrideLabel={usingCurrentLocation ? '📍 Current location' : null}
            onPick={pickLocation}
          />

          <button
            onClick={useCurrentLocation}
            disabled={locating}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%', marginTop: 10,
              padding: '10px 14px', borderRadius: 10, cursor: locating ? 'default' : 'pointer',
              border: `1px solid ${usingCurrentLocation ? theme.green : '#e5e7eb'}`,
              background: usingCurrentLocation ? `${theme.green}14` : '#f9fafb',
              fontFamily: 'inherit',
            }}
          >
            {locating
              ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: theme.green }} />
              : <LocateFixed size={16} color={usingCurrentLocation ? theme.green : '#9ca3af'} />}
            <span style={{ fontSize: 13, fontWeight: 600, color: usingCurrentLocation ? theme.green : '#6b7280' }}>
              {locating ? 'Getting location...' : usingCurrentLocation ? '✓ Using current location' : 'Use my current location'}
            </span>
          </button>
        </SectionCard>

        {/* ── RECIPIENT ── */}
        <SectionCard title="Recipient" icon={<User size={16} color={theme.green} />}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Deliver to someone else</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Enter recipient details below</div>
            </div>
            <Toggle checked={deliverToSomeoneElse} onChange={setDeliverToSomeoneElse} color={theme.green} />
          </div>

          {deliverToSomeoneElse && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="e.g. Ama Mensah" style={inputStyle} />
              <input value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} placeholder="0241234567" style={inputStyle} />
              <div style={{ display: 'flex', gap: 8, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: 10 }}>
                <Info size={14} color="#92400e" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 12, color: '#92400e' }}>The rider will contact this person for delivery.</span>
              </div>
            </div>
          )}
        </SectionCard>

        {/* ── PAYMENT ── */}
        <SectionCard title="Payment Method" icon={<CreditCard size={16} color={theme.green} />}>
          <div style={{ display: 'flex', gap: 12 }}>
            <PayOption value="CASH" label="Cash" icon="💵" selected={paymentMethod} onSelect={setPaymentMethod} theme={theme} />
            <PayOption value="MOMO" label="MoMo" icon="📱" selected={paymentMethod} onSelect={setPaymentMethod} theme={theme} />
          </div>
        </SectionCard>

        {/* ── SUMMARY ── */}
        <SectionCard title="Order Summary" icon={<Receipt size={16} color={theme.green} />}>
          <SummaryRow label="Subtotal" value={`GHS ${Number(subtotal).toFixed(2)}`} />
          <SummaryRow label="Delivery Fee" value={`GHS ${Number(deliveryFee).toFixed(2)}`} />
          <div style={{ borderTop: '1px solid #f0f0f0', margin: '12px 0' }} />
          <SummaryRow label="Total" value={`GHS ${Number(total).toFixed(2)}`} bold theme={theme} />
        </SectionCard>
      </div>

      {/* ── PLACE ORDER BAR ── */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #f0f0f0', padding: '12px 20px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          {!addressReady && (
            <div style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', fontWeight: 600, marginBottom: 8 }}>
              Select a delivery location to continue
            </div>
          )}
          <button
            onClick={placeOrder}
            disabled={!canPlaceOrder}
            style={{
              width: '100%', height: 48, border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 14, fontFamily: 'inherit',
              background: canPlaceOrder ? theme.green : '#d1d5db', color: '#fff', cursor: canPlaceOrder ? 'pointer' : 'not-allowed',
            }}
          >
            Continue to Review &nbsp;•&nbsp; GHS {Number(total).toFixed(2)}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ════════════════════════════════════════════
   LocationPicker — select-only: a search box that
   filters the saved-location dropdown; there is no
   free-text address field, the user must pick a
   result to set the location.
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
            readOnly={false}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder={hint}
            style={{ ...inputStyle, paddingLeft: 36, paddingRight: query ? 32 : 12 }}
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
          boxShadow: '0 4px 16px rgba(0,0,0,0.07)', maxHeight: 240, overflowY: 'auto',
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

function SectionCard({ title, icon, children }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 16, padding: 16, marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
        {icon}
        <span style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function CartItemRow({ item, theme, onQty, onRemove }) {
  const variants = (item.selectedVariants ?? []).map((v) => v.variantName).filter(Boolean).join(', ');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
      <div style={{
        width: 54, height: 54, borderRadius: 10, flexShrink: 0, overflow: 'hidden',
        background: item.image ? `url(${item.image}) center/cover` : `${theme.green}14`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {!item.image && '🍔'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
        {variants && <div style={{ fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{variants}</div>}
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>GHS {Number(item.price).toFixed(2)} each</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: 10 }}>
        <button onClick={() => item.quantity > 1 && onQty(item.quantity - 1)} disabled={item.quantity <= 1} style={qtyBtnStyle}>
          <Minus size={14} color={item.quantity > 1 ? theme.green : '#d1d5db'} />
        </button>
        <span style={{ width: 24, textAlign: 'center', fontSize: 14, fontWeight: 800, color: '#111827' }}>{item.quantity}</span>
        <button onClick={() => onQty(item.quantity + 1)} style={qtyBtnStyle}>
          <Plus size={14} color={theme.green} />
        </button>
      </div>
      <div style={{ width: 68, textAlign: 'right', fontSize: 13, fontWeight: 800, color: theme.green }}>
        GHS {(item.price * item.quantity).toFixed(2)}
      </div>
      <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: '#9ca3af' }}>
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function Toggle({ checked, onChange, color }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 42, height: 24, borderRadius: 50, border: 'none', cursor: 'pointer', position: 'relative',
        background: checked ? color : '#d1d5db', transition: 'background 0.15s', flexShrink: 0,
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3,
        left: checked ? 21 : 3, transition: 'left 0.15s',
      }} />
    </button>
  );
}

function PayOption({ value, label, icon, selected, onSelect, theme }) {
  const active = value === selected;
  return (
    <button
      onClick={() => onSelect(value)}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        padding: '14px 0', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
        border: `${active ? 1.5 : 1}px solid ${active ? theme.green : '#e5e7eb'}`,
        background: active ? `${theme.green}14` : '#f9fafb',
      }}
    >
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: active ? theme.green : '#6b7280' }}>{label}</span>
    </button>
  );
}

function SummaryRow({ label, value, bold, theme }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
      <span style={{ fontSize: bold ? 15 : 14, fontWeight: bold ? 800 : 500, color: bold ? '#111827' : '#6b7280' }}>{label}</span>
      <span style={{ fontSize: bold ? 16 : 14, fontWeight: bold ? 900 : 600, color: bold ? theme.green : '#111827' }}>{value}</span>
    </div>
  );
}

const inputStyle = { width: '100%', height: 44, border: '1px solid #e5e7eb', borderRadius: 10, padding: '0 12px', fontFamily: 'inherit', fontSize: 13, boxSizing: 'border-box' };
const qtyBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' };