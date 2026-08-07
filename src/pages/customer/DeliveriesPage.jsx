'use client';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Package, Loader2, Bike, LocateFixed, Search, X, CheckCircle2, Camera, ImagePlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { uploadToCloudinary, validateImageFile } from '../../utils/cloudinary';

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
export function calculateDeliveryEstimate({ pickupLat, pickupLng, destLat, destLng }) {
  if (pickupLat == null || pickupLng == null || destLat == null || destLng == null) return 0;
  const r = 6371;
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

  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [locationsError, setLocationsError] = useState(null);

  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] = useState(null);

  // ── current-location support for BOTH fields now ──
  const [pickupUsingCurrent, setPickupUsingCurrent] = useState(false);
  const [pickupCurrentPos, setPickupCurrentPos] = useState(null);
  const [pickupLocating, setPickupLocating] = useState(false);
  const [pickupLocationError, setPickupLocationError] = useState(null);

  const [destUsingCurrent, setDestUsingCurrent] = useState(false);
  const [destCurrentPos, setDestCurrentPos] = useState(null);
  const [destLocating, setDestLocating] = useState(false);
  const [destLocationError, setDestLocationError] = useState(null);

  const [description, setDescription] = useState('');
  const [extraNote, setExtraNote] = useState('');
  const [payment, setPayment] = useState('CASH');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const submittingRef = useRef(false);

  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageProgress, setImageProgress] = useState(0);
  const [imageError, setImageError] = useState(null);

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [forFriend, setForFriend] = useState(false);
const [recipientName, setRecipientName] = useState('');
const [recipientPhone, setRecipientPhone] = useState('');

  const loadLocations = useCallback(async () => {
    setLoadingLocations(true);
    setLocationsError(null);
    try {
      const res = await authFetch('/locations');
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

  useEffect(() => () => { if (imagePreview) URL.revokeObjectURL(imagePreview); }, [imagePreview]);

  const pickupLat = pickupUsingCurrent ? pickupCurrentPos?.latitude : pickup?.latitude;
  const pickupLng = pickupUsingCurrent ? pickupCurrentPos?.longitude : pickup?.longitude;
  const pickupAddress = pickupUsingCurrent && pickupCurrentPos
    ? `GPS: ${pickupCurrentPos.latitude.toFixed(5)}, ${pickupCurrentPos.longitude.toFixed(5)}`
    : pickup?.name ?? '';
  const hasPickup = pickupUsingCurrent ? !!pickupCurrentPos : !!pickup;

  const destLat = destUsingCurrent ? destCurrentPos?.latitude : destination?.latitude;
  const destLng = destUsingCurrent ? destCurrentPos?.longitude : destination?.longitude;
  const destAddress = destUsingCurrent && destCurrentPos
    ? `GPS: ${destCurrentPos.latitude.toFixed(5)}, ${destCurrentPos.longitude.toFixed(5)}`
    : destination?.name ?? '';
  const hasDest = destUsingCurrent ? !!destCurrentPos : !!destination;

  const fee = useMemo(
    () => calculateDeliveryEstimate({ pickupLat, pickupLng, destLat, destLng }),
    [pickupLat, pickupLng, destLat, destLng]
  );

  const friendDetailsValid = !forFriend || (recipientName.trim() && recipientPhone.trim());
const canSubmit = hasPickup && hasDest && description.trim() && friendDetailsValid && !imageUploading && !submitting;
  // Shared geolocation logic for both fields — same behavior, different targets.
  function requestCurrentLocation({ setLocating, setError, setPos, setUsingCurrent, clearSaved }) {
    if (!('geolocation' in navigator)) {
      setError('Location is not supported by this browser.');
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPos({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setUsingCurrent(true);
        clearSaved();
        setLocating(false);
      },
      (err) => {
        setError(err.message || 'Could not get your location.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const useCurrentForPickup = () => requestCurrentLocation({
    setLocating: setPickupLocating, setError: setPickupLocationError,
    setPos: setPickupCurrentPos, setUsingCurrent: setPickupUsingCurrent,
    clearSaved: () => setPickup(null),
  });

  const useCurrentForDest = () => requestCurrentLocation({
    setLocating: setDestLocating, setError: setDestLocationError,
    setPos: setDestCurrentPos, setUsingCurrent: setDestUsingCurrent,
    clearSaved: () => setDestination(null),
  });

  async function onPickImage(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setImageError(validationError);
      return;
    }

    setImageError(null);
    setImageUrl(null);
    setImagePreview(URL.createObjectURL(file));
    setImageUploading(true);
    setImageProgress(0);

    const url = await uploadToCloudinary(file, {
      folder: 'firstchoice/deliveries',
      onProgress: setImageProgress,
    });

    setImageUploading(false);
    if (url) setImageUrl(url);
    else setImageError('Upload failed — please try again.');
  }

  function removeImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setImageUrl(null);
    setImageUploading(false);
    setImageProgress(0);
    setImageError(null);
  }

  async function submit() {
  if (!canSubmit || submittingRef.current) return;
  submittingRef.current = true;
  setSubmitting(true);
  setError(null);
  try {
    const res = await authFetch('/deliveries', {
      method: 'POST',
      body: JSON.stringify({
        pickupAddress,
        destinationAddress: destAddress,
        itemDescription: description.trim(),
        notes: extraNote.trim() || undefined,
        paymentMethod: payment,
        pickupLatitude: pickupLat,
        pickupLongitude: pickupLng,
        destinationLatitude: destLat,
        destinationLongitude: destLng,
        imageUrl: imageUrl || undefined,
        ...(forFriend ? {
          recipientName: recipientName.trim(),
          recipientPhone: recipientPhone.trim(),
        } : {}),
      }),
    });
    const json = await res.json();
    if (json.success) {
      setPickup(null); setDestination(null); setDescription(''); setExtraNote('');
      setPickupUsingCurrent(false); setPickupCurrentPos(null);
      setDestUsingCurrent(false); setDestCurrentPos(null);
      setForFriend(false); setRecipientName(''); setRecipientPhone('');
      removeImage();
      setTab('history');
      loadHistory();
    } else setError(json.message || 'Could not book this delivery.');
  } catch {
    setError('Could not reach the server.');
  }
  submittingRef.current = false;
  setSubmitting(false);
}

  return (
    <div style={{ minHeight: '100vh', background: '#f8faf8', fontFamily: "'DM Sans', system-ui, sans-serif", paddingBottom: 88 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><ArrowLeft size={20} /></button> */}
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

            <Field label="PICK UP LOCATION" icon={<MapPin size={15} color="#10b981" />}>
              <LocationPicker
                hint="Search pickup point..."
                selected={pickup}
                locations={locations}
                loading={loadingLocations}
                accent="#10b981"
                overrideLabel={pickupUsingCurrent ? '📍 Current location' : null}
                onPick={(loc) => { setPickup(loc); setPickupUsingCurrent(false); setPickupCurrentPos(null); }}
              />
            </Field>
            <CurrentLocationButton
              active={pickupUsingCurrent}
              locating={pickupLocating}
              onClick={useCurrentForPickup}
              accent="#10b981"
            />
            {pickupLocationError && <InlineError message={pickupLocationError} />}

            <Field label="DESTINATION" icon={<MapPin size={15} color="#ef4444" />}>
              <LocationPicker
                hint="Search destination..."
                selected={destination}
                locations={locations}
                loading={loadingLocations}
                accent="#ef4444"
                overrideLabel={destUsingCurrent ? '📍 Current location' : null}
                onPick={(loc) => { setDestination(loc); setDestUsingCurrent(false); setDestCurrentPos(null); }}
              />
            </Field>
            <CurrentLocationButton
              active={destUsingCurrent}
              locating={destLocating}
              onClick={useCurrentForDest}
              accent="#ef4444"
            />
            {destLocationError && <InlineError message={destLocationError} />}
            
            <button
            type="button"
            onClick={() => setForFriend((v) => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '10px 14px', borderRadius: 10, marginBottom: forFriend ? 10 : 14, cursor: 'pointer',
              border: `1px solid ${forFriend ? theme.green : '#1e40af'}`,
              background: forFriend ? '#ecfdf5' : '#f9fafb',
              fontFamily: 'inherit',
            }}
          >
            <Bike size={16} color={forFriend ? theme.green : '#9ca3af'} />
            <span style={{ fontSize: 13, fontWeight: 600, color: forFriend ? theme.green : '#6b7280' }}>
              {forFriend ? "Delivering for someone else ✓" : "This delivery is for someone else"}
            </span>
          </button>

          {forFriend && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <input
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Recipient's name"
                style={inputStyle}
              />
              <input
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="Recipient's phone number"
                style={inputStyle}
              />
            </div>
          )}

            <Field label="ITEM DESCRIPTION" icon={<Package size={15} color="#8b5cf6" />}>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="e.g. Documents, a small package..."
              style={{ ...textareaStyle }}
            />
          </Field>

            <Field label="ADDITIONAL NOTES?" icon={<Package size={15} color="#8b5cf6" />}>
              <textarea
                value={extraNote}
                onChange={(e) => setExtraNote(e.target.value)}
                rows={2}
                placeholder="e.g. Any special information for rider..."
                style={{ ...textareaStyle }}
              />
            </Field>

            <Field label="PHOTO OF THE ITEM (OPTIONAL)" icon={<Camera size={15} color="#f97316" />}>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={onPickImage} style={{ display: 'none' }} />

              {!imagePreview ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                    padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                    border: '1px dashed #d1d5db', background: '#f9fafb',
                  }}
                >
                  <ImagePlus size={16} color="#9ca3af" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Add a photo — helps the rider identify it</span>
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 12, border: '1px solid #e5e7eb', background: '#f9fafb' }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 10, flexShrink: 0, overflow: 'hidden',
                    background: `url(${imagePreview}) center/cover`, position: 'relative',
                  }}>
                    {imageUploading && (
                      <div style={{
                        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Loader2 size={18} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {imageUploading ? (
                      <>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Uploading... {Math.round(imageProgress * 100)}%</div>
                        <div style={{ height: 5, borderRadius: 3, background: '#e5e7eb', marginTop: 6, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${imageProgress * 100}%`, background: '#f97316', transition: 'width 0.15s' }} />
                        </div>
                      </>
                    ) : imageUrl ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#10b981' }}>
                        <CheckCircle2 size={14} /> Photo attached
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: '#dc2626', fontWeight: 600 }}>Upload failed</div>
                    )}
                  </div>
                  <button type="button" onClick={removeImage} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 4 }}>
                    <X size={16} color="#9ca3af" />
                  </button>
                </div>
              )}
              {imageError && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 6 }}>{imageError}</div>}
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

            <button onClick={submit} disabled={!canSubmit} style={{
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

function CurrentLocationButton({ active, locating, onClick, accent }) {
  return (
    <button
      onClick={onClick}
      disabled={locating}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
        padding: '10px 14px', borderRadius: 10, marginBottom: 14, cursor: locating ? 'default' : 'pointer',
        border: `1px solid ${active ? accent : '#e5e7eb'}`,
        background: active ? `${accent}14` : '#f9fafb',
        fontFamily: 'inherit',
      }}
    >
      {locating
        ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: accent }} />
        : <LocateFixed size={16} color={active ? accent : '#9ca3af'} />}
      <span style={{ fontSize: 13, fontWeight: 600, color: active ? accent : '#6b7280' }}>
        {locating ? 'Getting location...' : active ? 'Using current location ✓' : 'Use my current location'}
      </span>
    </button>
  );
}

function InlineError({ message }) {
  return (
    <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>
      {message}
    </div>
  );
}

/* ════════════════════════════════════════════
   LocationPicker — three real states, not two.

   The old version rendered the search <input autoFocus>
   any time nothing was selected AND it wasn't explicitly
   open — which on page load is always true (nothing is
   selected yet), so the input mounted immediately and the
   mobile keyboard popped without anyone tapping anything.

   Now: closed+empty is a plain button (no input exists in
   the DOM), closed+selected is the pill, and the real
   autoFocus input only mounts once you deliberately tap in.
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
          style={{ ...inputStyle, paddingLeft: 36, paddingRight: query ? 32 : 12 }}
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
const textareaStyle = { width: '100%', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 12px', fontFamily: 'inherit', fontSize: 13, boxSizing: 'border-box', resize: 'none' };