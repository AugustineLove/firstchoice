'use client';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Package, Loader2, Bike, LocateFixed, Search, X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const STATUS_STYLE = {
  PENDING: { color: '#92400e', bg: '#fef3c7' }, ACCEPTED: { color: '#065f46', bg: '#d1fae5' },
  PICKED_UP: { color: '#1e40af', bg: '#dbeafe' }, IN_TRANSIT: { color: '#1e40af', bg: '#dbeafe' },
  DELIVERED: { color: '#065f46', bg: '#d1fae5' }, CANCELLED: { color: '#991b1b', bg: '#fee2e2' },
};

/* ════════════════════════════════════════════
   Same tiered-by-distance estimate used in the
   mobile app (deliveries_screen.dart) — keep the
   two in sync if the pricing table changes.
════════════════════════════════════════════ */
function calculateDeliveryEstimate({ pickupLat, pickupLng, destLat, destLng }) {
  if (pickupLat == null || pickupLng == null || destLat == null || destLng == null) return 0;

  const r = 6371; // Earth's radius in km
  const toRad = (d) => (d * Math.PI) / 180;

  const dLat = toRad(destLat - pickupLat);
  const dLng = toRad(destLng - pickupLng);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(pickupLat)) * Math.cos(toRad(destLat)) * Math.sin(dLng / 2) ** 2;

  const km = r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  if (km <= 1) return 5;
  if (km <= 1.5) return 6;
  if (km <= 2) return 7;
  if (km <= 2.5) return 8;
  if (km <= 3) return 9;
  if (km <= 3.5) return 10;
  if (km <= 4) return 11;
  if (km <= 4.5) return 12;
  if (km <= 5) return 13;
  if (km <= 5.5) return 14;
  if (km <= 6) return 15;
  if (km <= 6.5) return 16;
  if (km <= 7) return 17;
  if (km <= 7.5) return 18;
  if (km <= 8) return 19;
  if (km <= 8.5) return 20;
  if (km <= 9) return 21;
  return 25;
}

function filterLocations(all, query) {
  if (!query.trim()) return all;
  const q = query.toLowerCase();
  return all.filter((l) => l.name.toLowerCase().includes(q) || l.address.toLowerCase().includes(q));
}

export default function DeliveriesPage() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const { theme } = useTheme();

  const [tab, setTab] = useState('book'); // 'book' | 'history'

  // Saved locations (loaded once, same source as the mobile "getLocations" endpoint)
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [locationsError, setLocationsError] = useState(null);

  const [pickup, setPickup] = useState(null);       // SavedLocation | null
  const [destination, setDestination] = useState(null); // SavedLocation | null

  const [usingCurrentLocation, setUsingCurrentLocation] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null); // { latitude, longitude }
  const [locating, setLocating] = useState(false);

  const [description, setDescription] = useState('');
  const [payment, setPayment] = useState('CASH');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const loadLocations = useCallback(async () => {
    setLoadingLocations(true);
    setLocationsError(null);
    try {
      const res = await authFetch('/locations'); // adjust to your saved-locations endpoint if different
      const json = await res.json();
      if (json.success) setLocations(json.data.locations ?? json.data);
      else setLocationsError(json.message || 'Could not load locations.');
    } catch {
      setLocationsError('Could not reach the server.');
    }
    setLoadingLocations(false);
  }, [authFetch]);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await authFetch('/users/me/deliveries');
      const json = await res.json();
      if (json.success) setHistory(json.data.deliveries ?? json.data);
    } catch {}
    setLoadingHistory(false);
  }, [authFetch]);

  useEffect(() => { loadLocations(); }, [loadLocations]);
  useEffect(() => { if (tab === 'history') loadHistory(); }, [tab, loadHistory]);

  const destLat = usingCurrentLocation ? currentPosition?.latitude : destination?.latitude;
  const destLng = usingCurrentLocation ? currentPosition?.longitude : destination?.longitude;
  const destAddress = usingCurrentLocation && currentPosition
    ? `GPS: ${currentPosition.latitude.toFixed(5)}, ${currentPosition.longitude.toFixed(5)}`
    : destination?.address ?? '';
  const destLabel = usingCurrentLocation ? 'Current location' : destination?.name ?? '';

  const fee = useMemo(
    () => calculateDeliveryEstimate({ pickupLat: pickup?.latitude, pickupLng: pickup?.longitude, destLat, destLng }),
    [pickup, destLat, destLng]
  );

  const canSubmit = pickup && (destination || usingCurrentLocation) && description.trim();

  function useCurrentLocation() {
    if (!('geolocation' in navigator)) {
      setError('Location is not supported by this browser.');
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentPosition({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setUsingCurrentLocation(true);
        setDestination(null);
        setLocating(false);
      },
      (err) => {
        setError(err.message || 'Could not get your location.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await authFetch('/deliveries', {
        method: 'POST',
        body: JSON.stringify({
          pickupAddress: pickup.name,
          destinationAddress: destAddress,
          itemDescription: description.trim(),
          paymentMethod: payment,
          pickupLatitude: pickup.latitude,
          pickupLongitude: pickup.longitude,
          destinationLatitude: destLat,
          destinationLongitude: destLng,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setPickup(null); setDestination(null); setDescription('');
        setUsingCurrentLocation(false); setCurrentPosition(null);
        setTab('history');
        loadHistory();
      } else setError(json.message || 'Could not book this delivery.');
    } catch {
      setError('Could not reach the server.');
    }
    setSubmitting(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8faf8', fontFamily: "'DM Sans', system-ui, sans-serif", paddingBottom: 88 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><ArrowLeft size={20} /></button>
          <span style={{ fontWeight: 800, fontSize: 16 }}>Send a Delivery</span>
        </div>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 20px 12px', display: 'flex', gap: 8 }}>
          <TabBtn label="Book" active={tab === 'book'} onClick={() => setTab('book')} theme={theme} />
          <TabBtn label="History" active={tab === 'history'} onClick={() => setTab('history')} theme={theme} />
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: 20 }}>
        {tab === 'book' ? (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', padding: 18 }}>
            {error && <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{error}</div>}
            {locationsError && <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{locationsError}</div>}

            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 14 }}>Pick from our saved locations for accurate GPS routing</div>

            <Field label="Pickup Location" icon={<MapPin size={15} color="#10b981" />}>
              <LocationPicker
                hint="Search pickup point..."
                selected={pickup}
                locations={locations}
                loading={loadingLocations}
                accent="#10b981"
                onPick={setPickup}
              />
            </Field>

            <Field label="Destination" icon={<MapPin size={15} color="#ef4444" />}>
              <LocationPicker
                hint="Search destination..."
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
                border: `1px solid ${usingCurrentLocation ? '#10b981' : '#e5e7eb'}`,
                background: usingCurrentLocation ? '#ecfdf5' : '#f9fafb',
                fontFamily: 'inherit',
              }}
            >
              {locating
                ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: '#10b981' }} />
                : <LocateFixed size={16} color={usingCurrentLocation ? '#10b981' : '#9ca3af'} />}
              <span style={{ fontSize: 13, fontWeight: 600, color: usingCurrentLocation ? '#10b981' : '#6b7280' }}>
                {locating ? 'Getting location...' : usingCurrentLocation ? 'Using current location ✓' : 'Use my current location'}
              </span>
            </button>

            <Field label="What are we delivering?" icon={<Package size={15} color="#8b5cf6" />}>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="e.g. Documents, a small package..." style={{ ...inputStyle, height: 'auto', paddingTop: 10, resize: 'none' }} />
            </Field>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', marginBottom: 14,
              border: `1px solid ${theme.green}`, borderRadius: 10, background: '#f9fafb',
            }}>
              <span style={{ fontSize: 13, color: '#374151' }}>Delivery Fee:</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: theme.green }}>GHS {fee}.00</span>
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Payment Method</div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
              <PayChip value="CASH" label="💵  Cash" selected={payment} onSelect={setPayment} theme={theme} />
              <PayChip value="MOMO" label="📱  MoMo" selected={payment} onSelect={setPayment} theme={theme} />
            </div>

            <button onClick={submit} disabled={!canSubmit || submitting} style={{
              width: '100%', height: 48, border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 14, fontFamily: 'inherit',
              background: canSubmit ? theme.green : '#d1d5db', color: '#fff', cursor: canSubmit ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              {submitting ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Booking...</> : 'Request Delivery'}
            </button>
          </div>
        ) : (
          <>
            {loadingHistory && <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: theme.green }} /></div>}
            {!loadingHistory && history.length === 0 && (
              <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}><Bike size={36} style={{ marginBottom: 10 }} /><div style={{ fontWeight: 700 }}>No deliveries yet</div></div>
            )}
            {!loadingHistory && history.map((d) => {
              const s = STATUS_STYLE[d.status] || { color: '#374151', bg: '#f3f4f6' };
              return (
                <div key={d.id} style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 14, padding: 14, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 13, color: '#374151' }}>
                      <div><b>From:</b> {d.pickupAddress}</div>
                      <div style={{ marginTop: 2 }}><b>To:</b> {d.destinationAddress}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 50, color: s.color, background: s.bg, whiteSpace: 'nowrap' }}>{d.status?.replace(/_/g, ' ')}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: theme.green, marginTop: 8 }}>GHS {d.estimatedFee}</div>
                </div>
              );
            })}
          </>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ════════════════════════════════════════════
   LocationPicker — mirrors the mobile _LocationPicker:
   shows a search box + dropdown of saved locations,
   collapses into a selected pill once one is chosen.
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

function TabBtn({ label, active, onClick, theme }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 13,
      background: active ? theme.green : '#f3f4f6', color: active ? '#fff' : '#6b7280',
    }}>{label}</button>
  );
}

function Field({ label, icon, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
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

const inputStyle = { width: '100%', height: 44, border: '1px solid #e5e7eb', borderRadius: 10, padding: '0 12px', fontFamily: 'inherit', fontSize: 13, boxSizing: 'border-box' };