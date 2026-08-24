'use client';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Package, Loader2, Bike, LocateFixed, Search, X, CheckCircle2, Camera, ImagePlus, Plus, ShoppingBag } from 'lucide-react';
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
  if (km <= 2) return 8;
  if (km <= 2.5) return 9;
  if (km <= 3) return 10;
  if (km <= 3.5) return 11;
  if (km <= 4) return 12;
  if (km <= 4.5) return 13;
  if (km <= 5) return 14;
  if (km <= 5.5) return 15;
  if (km <= 6) return 16;
  if (km <= 6.5) return 17;
  if (km <= 7) return 18;
  if (km <= 7.5) return 19;
  if (km <= 8) return 20;
  if (km <= 8.5) return 21;
  if (km <= 9) return 22;
  if (km <= 9.5) return 23;
  if (km <= 10) return 24;
  if (km <= 10.5) return 25;
  if (km <= 11) return 26;
  if (km <= 11.5) return 27;
  if (km <= 12) return 28;
  if (km <= 12.5) return 29;
  if (km <= 13) return 30;
  if (km <= 13.5) return 31;
  if (km <= 14) return 32;
  if (km <= 14.5) return 33;
  if (km <= 15) return 34;
  if (km <= 15.5) return 35;
  if (km <= 16) return 36;
  if (km <= 16.5) return 37;
  if (km <= 17) return 38;
  if (km <= 17.5) return 39;
  if (km <= 18) return 40;
  if (km <= 18.5) return 41;
  if (km <= 19) return 42;
  if (km <= 19.5) return 43;
  if (km <= 20) return 44;
  if (km <= 20.5) return 45;
  if (km <= 21) return 46;
  if (km <= 21.5) return 47;
  if (km <= 22) return 48;
  if (km <= 22.5) return 49;
  if (km <= 23) return 50;
  return 50;
}

/* ── matches backend calculateErrandFee — keep in sync ── */
export function calculateErrandFee({ pricingMode, fixedPrice, perItemPrice, itemCount }) {
  if (!pricingMode) return 0;
  if (pricingMode === 'PER_ITEM') return Math.max(itemCount, 0) * (perItemPrice || 0);
  return fixedPrice || 0;
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
  const [requestType, setRequestType] = useState('PICKUP'); // 'PICKUP' | 'ERRAND'

  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [locationsError, setLocationsError] = useState(null);

  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] = useState(null);

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

  // ── errand list + pricing settings ──
  const [errandItems, setErrandItems] = useState([{ id: 1, text: '', price: '' }]);
  const errandIdRef = useRef(2);
  const [errandSettings, setErrandSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const isErrand = requestType === 'ERRAND';

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

  const loadErrandSettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const res = await authFetch('/settings/errand');
      const json = await res.json();
      if (json.success) setErrandSettings(json.data);
    } catch {}
    setLoadingSettings(false);
  }, [authFetch]);

  useEffect(() => { loadLocations(); }, [loadLocations]);
  useEffect(() => { loadErrandSettings(); }, [loadErrandSettings]);
  useEffect(() => { if (tab === 'history') loadHistory(); }, [tab, loadHistory]);
  useEffect(() => () => { if (imagePreview) URL.revokeObjectURL(imagePreview); }, [imagePreview]);

  // ── manual (Pickup mode) pickup values ──
  const manualPickupLat = pickupUsingCurrent ? pickupCurrentPos?.latitude : pickup?.latitude;
  const manualPickupLng = pickupUsingCurrent ? pickupCurrentPos?.longitude : pickup?.longitude;
  const manualPickupAddress = pickupUsingCurrent && pickupCurrentPos
    ? `GPS: ${pickupCurrentPos.latitude.toFixed(5)}, ${pickupCurrentPos.longitude.toFixed(5)}`
    : pickup?.name ?? '';
  const manualHasPickup = pickupUsingCurrent ? !!pickupCurrentPos : !!pickup;

  // ── effective pickup: forced to errand location when in Errand mode ──
  const errandPickup = errandSettings?.pickupLocation;
  const pickupLat = isErrand ? errandPickup?.latitude : manualPickupLat;
  const pickupLng = isErrand ? errandPickup?.longitude : manualPickupLng;
  const pickupAddress = isErrand ? (errandPickup?.address || '') : manualPickupAddress;
  const hasPickup = isErrand ? !!errandPickup : manualHasPickup;

  const destLat = destUsingCurrent ? destCurrentPos?.latitude : destination?.latitude;
  const destLng = destUsingCurrent ? destCurrentPos?.longitude : destination?.longitude;
  const destAddress = destUsingCurrent && destCurrentPos
    ? `GPS: ${destCurrentPos.latitude.toFixed(5)}, ${destCurrentPos.longitude.toFixed(5)}`
    : destination?.name ?? '';
  const hasDest = destUsingCurrent ? !!destCurrentPos : !!destination;

  const filledErrandItems = useMemo(
    () => errandItems
      .map((it) => ({ text: it.text.trim(), estimatedPrice: parseFloat(it.price) || 0 }))
      .filter((it) => it.text.length > 0),
    [errandItems]
  );
  const errandItemsValid = !isErrand || filledErrandItems.length > 0;
  const itemsEstimatedTotal = useMemo(
    () => filledErrandItems.reduce((sum, it) => sum + it.estimatedPrice, 0),
    [filledErrandItems]
  );

  const deliveryFee = useMemo(
    () => calculateDeliveryEstimate({ pickupLat, pickupLng, destLat, destLng }),
    [pickupLat, pickupLng, destLat, destLng]
  );
  const errandFee = useMemo(() => {
    if (!isErrand || !errandSettings) return 0;
    return calculateErrandFee({
      pricingMode: errandSettings.pricingMode,
      fixedPrice: errandSettings.fixedPrice,
      perItemPrice: errandSettings.perItemPrice,
      itemCount: filledErrandItems.length,
    });
  }, [isErrand, errandSettings, filledErrandItems.length]);
  const fee = deliveryFee + errandFee;

  const friendDetailsValid = !forFriend || (recipientName.trim() && recipientPhone.trim());
  const canSubmit =
    hasPickup && hasDest && friendDetailsValid && !imageUploading && !submitting &&
    (isErrand ? (errandItemsValid && !!errandSettings) : description.trim());

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

  const useCurrentForDest = () => requestCurrentLocation({
    setLocating: setDestLocating, setError: setDestLocationError,
    setPos: setDestCurrentPos, setUsingCurrent: setDestUsingCurrent,
    clearSaved: () => setDestination(null),
  });

  // ── errand list handlers (single definition — text + price) ──
  function addErrandItem() {
    setErrandItems((prev) => [...prev, { id: errandIdRef.current++, text: '', price: '' }]);
  }
  function updateErrandItem(id, field, value) {
    setErrandItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  }
  function removeErrandItem(id) {
    setErrandItems((prev) => (prev.length <= 1 ? prev : prev.filter((it) => it.id !== id)));
  }

  async function onPickImage(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const validationError = validateImageFile(file);
    if (validationError) { setImageError(validationError); return; }
    setImageError(null);
    setImageUrl(null);
    setImagePreview(URL.createObjectURL(file));
    setImageUploading(true);
    setImageProgress(0);
    const url = await uploadToCloudinary(file, { folder: 'firstchoice/deliveries', onProgress: setImageProgress });
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
      const body = {
        type: requestType,
        destinationAddress: destAddress,
        notes: extraNote.trim() || undefined,
        paymentMethod: payment,
        destinationLatitude: destLat,
        destinationLongitude: destLng,
        pickupAddress,
        imageUrl: imageUrl || undefined,
        ...(forFriend ? { recipientName: recipientName.trim(), recipientPhone: recipientPhone.trim() } : {}),
        ...(isErrand
          ? { errandItems: filledErrandItems } // [{ text, estimatedPrice }]
          : {
              pickupAddress,
              pickupLatitude: pickupLat,
              pickupLongitude: pickupLng,
              itemDescription: description.trim(),
            }),
            itemDescription: description.trim(),
      };

      const res = await authFetch('/deliveries', { method: 'POST', body: JSON.stringify(body) });
      const json = await res.json();
      if (json.success) {
        setPickup(null); setDestination(null); setDescription(''); setExtraNote('');
        setPickupUsingCurrent(false); setPickupCurrentPos(null);
        setDestUsingCurrent(false); setDestCurrentPos(null);
        setForFriend(false); setRecipientName(''); setRecipientPhone('');
        setErrandItems([{ id: errandIdRef.current++, text: '', price: '' }]);
        removeImage();
        setTab('history');
        loadHistory();
      } else setError(json.message || 'Could not book this request.');
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
          <span style={{ fontWeight: 800, fontSize: 16 }}>{isErrand ? 'Run an Errand' : 'Send a Delivery'}</span>
        </div>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 20px 12px', display: 'flex', gap: 8 }}>
          <TabBtn label="Book" active={tab === 'book'} onClick={() => setTab('book')} theme={theme} />
          <TabBtn label="History" active={tab === 'history'} onClick={() => setTab('history')} theme={theme} />
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: 20 }}>
        {tab === 'book' ? (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', padding: 18 }}>
            {error && <InlineError message={error} />}
            {locationsError && <InlineError message={locationsError} />}

            {/* ── request type toggle ── */}
            <div style={{ display: 'flex', gap: 6, background: '#f3f4f6', borderRadius: 12, padding: 4, marginBottom: 16 }}>
              <SegBtn label="📦  Pickup & Drop" active={!isErrand} onClick={() => setRequestType('PICKUP')} theme={theme} />
              <SegBtn label="🛒  Errand" active={isErrand} onClick={() => setRequestType('ERRAND')} theme={theme} />
            </div>

            {!isErrand ? (
              <>
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
                  onClick={() => requestCurrentLocation({
                    setLocating: setPickupLocating, setError: setPickupLocationError,
                    setPos: setPickupCurrentPos, setUsingCurrent: setPickupUsingCurrent,
                    clearSaved: () => setPickup(null),
                  })}
                  accent="#10b981"
                />
                {pickupLocationError && <InlineError message={pickupLocationError} />}
              </>
            ) : (
              <Field label="ERRAND PICKUP POINT" icon={<ShoppingBag size={15} color="#10b981" />}>
                {loadingSettings ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', color: '#10b981' }} />
                  </div>
                ) : errandPickup ? (
                  <div style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '11px 14px', borderRadius: 12,
                    border: '1.5px solid #10b981', background: '#10b98114',
                  }}>
                    <CheckCircle2 size={16} color="#10b981" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{errandPickup.name}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{errandPickup.address}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981' }}>FIXED</span>
                  </div>
                ) : (
                  <InlineError message="Errand pickup isn't configured yet — please contact support." />
                )}
              </Field>
            )}

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
            <CurrentLocationButton active={destUsingCurrent} locating={destLocating} onClick={useCurrentForDest} accent="#ef4444" />
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
                <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Recipient's name" style={inputStyle} />
                <input value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} placeholder="Recipient's phone number" style={inputStyle} />
              </div>
            )}

            {!isErrand ? (
              <Field label="ITEM DESCRIPTION" icon={<Package size={15} color="#8b5cf6" />}>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="e.g. Documents, a small package..."
                  style={textareaStyle}
                />
              </Field>
            ) : (
              <Field label="ERRAND LIST" icon={<Package size={15} color="#8b5cf6" />}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {errandItems.map((it, idx) => (
                    <div key={it.id} style={{ display: 'flex', gap: 8 }}>
                      <input
                        value={it.text}
                        onChange={(e) => updateErrandItem(it.id, 'text', e.target.value)}
                        placeholder={idx === 0 ? 'e.g. 2 loaves of bread' : `Item ${idx + 1}`}
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      <div style={{ position: 'relative', width: 100, flexShrink: 0 }}>
                        <span style={{ position: 'absolute', left: 10, top: 0, height: 44, display: 'flex', alignItems: 'center', fontSize: 12, color: '#9ca3af', fontWeight: 700 }}>GHS</span>
                        <input
                          value={it.price}
                          onChange={(e) => updateErrandItem(it.id, 'price', e.target.value.replace(/[^0-9.]/g, ''))}
                          placeholder="0.00"
                          inputMode="decimal"
                          style={{ ...inputStyle, paddingLeft: 38 }}
                        />
                      </div>
                      {errandItems.length > 1 && (
                        <button type="button" onClick={() => removeErrandItem(it.id)} style={{
                          width: 40, height: 44, border: '1px solid #fecaca', background: '#fef2f2',
                          borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <X size={14} color="#dc2626" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addErrandItem} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '9px 0', borderRadius: 10, border: '1px dashed #d1d5db', background: '#f9fafb',
                    cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: '#6b7280',
                  }}>
                    <Plus size={14} /> Add another item
                  </button>

                  {filledErrandItems.length > 0 && (
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', borderRadius: 10, background: '#f9fafb', border: '1px solid #e5e7eb', marginTop: 2,
                    }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280' }}>Estimated items cost</span>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#374151' }}>GHS {itemsEstimatedTotal.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </Field>
            )}

            <Field label="ADDITIONAL NOTES?" icon={<Package size={15} color="#8b5cf6" />}>
              <textarea
                value={extraNote}
                onChange={(e) => setExtraNote(e.target.value)}
                rows={2}
                placeholder={isErrand ? 'e.g. Brand preference, exact quantities...' : 'e.g. Any special information for rider...'}
                style={textareaStyle}
              />
            </Field>

            <Field label="PHOTO (OPTIONAL)" icon={<Camera size={15} color="#f97316" />}>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={onPickImage} style={{ display: 'none' }} />
              {!imagePreview ? (
                <button type="button" onClick={() => fileInputRef.current?.click()} style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                  border: '1px dashed #d1d5db', background: '#f9fafb',
                }}>
                  <ImagePlus size={16} color="#9ca3af" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#6b7280' }}>
                    {isErrand ? 'Add a reference photo (e.g. product label)' : 'Add a photo — helps the rider identify it'}
                  </span>
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 12, border: '1px solid #e5e7eb', background: '#f9fafb' }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 10, flexShrink: 0, overflow: 'hidden',
                    background: `url(${imagePreview}) center/cover`, position: 'relative',
                  }}>
                    {imageUploading && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

            {/* ── fee summary ── */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 16px', marginBottom: 14,
              border: `1px solid ${theme.green}`, borderRadius: 10, background: '#f9fafb',
            }}>
              {isErrand && errandSettings ? (
                <>
                  <FeeRow label="Delivery fee" value={deliveryFee} />
                  <FeeRow
                    label={`Errand fee${errandSettings.pricingMode === 'PER_ITEM' ? ` (${filledErrandItems.length} × GHS ${errandSettings.perItemPrice})` : ''}`}
                    value={errandFee}
                  />
                  <FeeRow label="Estimated items cost" value={itemsEstimatedTotal} />
                  <div style={{ height: 1, background: '#e5e7eb', margin: '2px 0' }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#374151' }}>Estimated total:</span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: theme.green }}>GHS {(fee + itemsEstimatedTotal).toFixed(2)}</span>
                  </div>
                  <div style={{ fontSize: 10.5, color: '#9ca3af', lineHeight: 1.4 }}>
                    Item cost is an estimate, you'll settle the exact amount with your errand runner. Delivery + errand fee is what you pay FirstChoice.
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, color: '#374151' }}>Delivery Fee:</span>
                  <span style={{ fontSize: 22, fontWeight: 800, color: theme.green }}>GHS {fee.toFixed(2)}</span>
                </div>
              )}
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
              {submitting ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Booking...</> : isErrand ? 'Request Errand' : 'Request Delivery'}
            </button>
          </div>
        ) : (
          <>
            {loadingHistory && <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: theme.green }} /></div>}
            {!loadingHistory && history.length === 0 && (
              <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}><Bike size={36} style={{ marginBottom: 10 }} /><div style={{ fontWeight: 700 }}>No requests yet</div></div>
            )}
            {!loadingHistory && history.map((d) => {
              const s = STATUS_STYLE[d.status] || { color: '#374151', bg: '#f3f4f6' };
              return (
                <div
                  key={d.id}
                  onClick={() => navigate(`/deliveries/${d.id}`)}
                  style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 14, padding: 14, marginBottom: 10, cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 13, color: '#374151' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {d.type === 'ERRAND' && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 50, color: '#7c3aed', background: '#ede9fe' }}>ERRAND</span>
                        )}
                        <b>From:</b> {d.pickupAddress}
                      </div>
                      <div style={{ marginTop: 2 }}><b>To:</b> {d.destinationAddress}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 50, color: s.color, background: s.bg, whiteSpace: 'nowrap' }}>{d.status?.replace(/_/g, ' ')}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: theme.green, marginTop: 8 }}>
                    GHS {Number(d.estimatedFee ?? 0).toFixed(2)}
                    {d.type === 'ERRAND' && d.itemsEstimatedTotal > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', marginLeft: 6 }}>
                        + GHS {Number(d.itemsEstimatedTotal).toFixed(2)} items
                      </span>
                    )}
                  </div>
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
    <button onClick={onClick} disabled={locating} style={{
      display: 'flex', alignItems: 'center', gap: 8, width: '100%',
      padding: '10px 14px', borderRadius: 10, marginBottom: 14, cursor: locating ? 'default' : 'pointer',
      border: `1px solid ${active ? accent : '#e5e7eb'}`, background: active ? `${accent}14` : '#f9fafb', fontFamily: 'inherit',
    }}>
      {locating ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: accent }} /> : <LocateFixed size={16} color={active ? accent : '#9ca3af'} />}
      <span style={{ fontSize: 13, fontWeight: 600, color: active ? accent : '#6b7280' }}>
        {locating ? 'Getting location...' : active ? 'Using current location ✓' : 'Use my current location'}
      </span>
    </button>
  );
}

function InlineError({ message }) {
  return <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{message}</div>;
}

function FeeRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', width: '100%' }}>
      <span>{label}</span><span style={{ fontWeight: 700, color: '#374151' }}>GHS {Number(value ?? 0).toFixed(2)}</span>
    </div>
  );
}

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

  function pick(loc) { onPick(loc); setQuery(''); setOpen(false); }

  if (!open) {
    return (
      <div ref={wrapRef} style={{ position: 'relative' }}>
        <button type="button" onClick={() => setOpen(true)} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
          padding: '11px 14px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
          border: displayLabel ? `1.5px solid ${accent}` : '1px solid #e5e7eb',
          background: displayLabel ? `${accent}14` : '#f9fafb',
        }}>
          {displayLabel ? <CheckCircle2 size={16} color={accent} /> : <Search size={16} color="#9ca3af" />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: displayLabel ? 700 : 500, color: displayLabel ? '#111827' : '#9ca3af' }}>{displayLabel || hint}</div>
            {selected?.address && <div style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selected.address}</div>}
          </div>
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <Search size={16} color={accent} style={{ position: 'absolute', left: 12, top: 13 }} />
        <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder={hint}
          style={{ ...inputStyle, paddingLeft: 36, paddingRight: query ? 32 : 12 }} />
        {query && (
          <button type="button" onClick={() => setQuery('')} style={{ position: 'absolute', right: 10, top: 13, background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
            <X size={15} color="#9ca3af" />
          </button>
        )}
      </div>
      <div style={{
        position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6, zIndex: 20,
        background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', boxShadow: '0 4px 16px rgba(0,0,0,0.07)', maxHeight: 260, overflowY: 'auto',
      }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: accent }} />
          </div>
        ) : results.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>No locations found</div>
        ) : (
          results.map((loc, i) => (
            <button key={loc.id} type="button" onClick={() => pick(loc)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
              padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              borderTop: i === 0 ? 'none' : '1px solid #f3f4f6',
            }}>
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

function SegBtn({ label, active, onClick, theme }) {
  return (
    <button type="button" onClick={onClick} style={{
      flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 13,
      background: active ? '#fff' : 'transparent', color: active ? theme.green : '#6b7280',
      boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
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
    <button type="button" onClick={() => onSelect(value)} style={{
      padding: '10px 20px', borderRadius: 50, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
      border: `${active ? 1.5 : 1}px solid ${active ? theme.green : '#e5e7eb'}`,
      background: active ? `${theme.green}1a` : '#f9fafb', color: active ? theme.green : '#6b7280',
    }}>{label}</button>
  );
}

const inputStyle = { width: '100%', height: 44, border: '1px solid #e5e7eb', borderRadius: 10, padding: '0 12px', fontFamily: 'inherit', fontSize: 13, boxSizing: 'border-box' };
const textareaStyle = { width: '100%', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 12px', fontFamily: 'inherit', fontSize: 13, boxSizing: 'border-box', resize: 'none' };