'use client';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, MapPin, Phone, Clock, Image, ArrowRight,
  ArrowLeft, Loader2, CheckCircle, Store, Utensils,
  ShoppingCart, Pill, Shirt, Cpu, MoreHorizontal, Navigation,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const BUSINESS_TYPES = [
  { value: 'Food',        label: 'Food & Restaurant', icon: <Utensils size={20}/> },
  { value: 'Grocery',     label: 'Grocery Store',     icon: <ShoppingCart size={20}/> },
  { value: 'Pharmacy',    label: 'Pharmacy',          icon: <Pill size={20}/> },
  { value: 'Boutique',    label: 'Boutique / Fashion', icon: <Shirt size={20}/> },
  { value: 'Electronics', label: 'Electronics',       icon: <Cpu size={20}/> },
  { value: 'Other',       label: 'Other',             icon: <MoreHorizontal size={20}/> },
];

const STEPS = ['Business Type', 'Details', 'Location', 'Hours', 'Done'];

export default function VendorOnboarding() {
  const { authFetch, user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [step,     setStep]     = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [locating, setLocating] = useState(false);
  const [error,    setError]    = useState('');

  const [form, setForm] = useState({
    businessName: '',
    businessType: '',
    address:      '',
    phone:        user?.phone || '',
    logo:         '',
    openingHours: '',
    latitude:     null,
    longitude:    null,
  });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  function nextStep() { setError(''); setStep(s => s + 1); }
  function prevStep() { setError(''); setStep(s => s - 1); }

  function getLocation() {
    setError('');
    if (!navigator.geolocation) {
      setError('Geolocation is not supported on this device');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setForm(f => ({ ...f, latitude: coords.latitude, longitude: coords.longitude }));
        setLocating(false);
      },
      () => {
        setError('Unable to get location. You can skip this and set it later from your dashboard.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  async function submit() {
    setError('');
    setLoading(true);
    try {
      const payload = {
        businessName: form.businessName.trim(),
        businessType: form.businessType,
        address:      form.address.trim(),
        phone:        form.phone.trim(),
        ...(form.logo        && { logo:         form.logo.trim() }),
        ...(form.openingHours && { openingHours: form.openingHours.trim() }),
        ...(form.latitude != null && { latitude:  form.latitude }),
        ...(form.longitude != null && { longitude: form.longitude }),
      };
      const res  = await authFetch('/vendors/register', {
        method: 'POST',
        body:   JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to create vendor profile');
      setStep(4); // Done
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  // ── Shared styles ──────────────────────────────────────
  const inputStyle = {
    width: '100%', height: 48, padding: '0 14px',
    border: '1.5px solid #e5e7eb', borderRadius: 10,
    fontSize: 14, color: '#0f1117', background: '#fff',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  };
  const labelStyle = {
    display: 'block', fontSize: 13, fontWeight: 700,
    color: '#374151', marginBottom: 6,
  };
  const backBtn = {
    height: 50, paddingInline: 20, borderRadius: 10,
    border: '1.5px solid #e5e7eb', background: '#fff',
    cursor: 'pointer', fontSize: 14, fontWeight: 700,
    color: '#374151', fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', gap: 6,
  };
  const primaryBtn = (disabled = false) => ({
    flex: 1, height: 50, borderRadius: 10, border: 'none',
    background: disabled
      ? '#e5e7eb'
      : `linear-gradient(135deg, ${theme.green}, ${theme.greenMid})`,
    color: disabled ? '#9ca3af' : '#fff',
    fontSize: 15, fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    opacity: 1,
  });

  return (
    <div style={{
      minHeight: '100vh', background: '#f8faf8',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 560 }}>

        {/* ── Progress bar ── */}
        {step < 4 && (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 36 }}>
            {STEPS.slice(0, 4).map((label, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < 3 ? 1 : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 800,
                    background: step > i ? theme.green : step === i ? theme.green : '#e5e7eb',
                    color: step >= i ? '#fff' : '#9ca3af',
                    transition: 'all 0.3s',
                  }}>
                    {step > i ? <CheckCircle size={16}/> : i + 1}
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    color: step === i ? theme.green : '#9ca3af',
                    whiteSpace: 'nowrap',
                  }}>{label}</span>
                </div>
                {i < 3 && (
                  <div style={{
                    flex: 1, height: 2,
                    background: step > i ? theme.green : '#e5e7eb',
                    margin: '-18px 6px 0',
                    transition: 'background 0.3s',
                  }}/>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{
          background: '#fff', borderRadius: 20,
          border: '1px solid #e5e7eb', padding: '36px 40px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.05)',
        }}>

          {/* ════════════════════════════════════
              STEP 0 — Business Type
          ════════════════════════════════════ */}
          {step === 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: `${theme.green}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: theme.green,
                }}>
                  <Store size={20}/>
                </div>
                <div>
                  <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f1117', margin: 0, letterSpacing: '-0.5px' }}>
                    Set up your store
                  </h1>
                  <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>
                    What kind of business are you?
                  </p>
                </div>
              </div>

              <div style={{ height: 1, background: '#f0f0f0', margin: '20px 0' }}/>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {BUSINESS_TYPES.map(bt => (
                  <button key={bt.value}
                    onClick={() => setForm(f => ({ ...f, businessType: bt.value }))}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                      border: `2px solid ${form.businessType === bt.value ? theme.green : '#e5e7eb'}`,
                      background: form.businessType === bt.value ? `${theme.green}08` : '#fff',
                      color: form.businessType === bt.value ? theme.green : '#374151',
                      fontWeight: 600, fontSize: 14, fontFamily: 'inherit',
                      transition: 'all 0.2s',
                    }}>
                    <span style={{ color: form.businessType === bt.value ? theme.green : '#9ca3af' }}>
                      {bt.icon}
                    </span>
                    {bt.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => form.businessType && nextStep()}
                disabled={!form.businessType}
                style={{ ...primaryBtn(!form.businessType), marginTop: 24, width: '100%', flex: 'none' }}>
                Continue <ArrowRight size={16}/>
              </button>
            </div>
          )}

          {/* ════════════════════════════════════
              STEP 1 — Business Details
          ════════════════════════════════════ */}
          {step === 1 && (
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f1117', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
                Business details
              </h1>
              <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 24px' }}>
                Tell customers about your business
              </p>

              {error && <ErrorBox message={error}/>}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field label="Business Name *" icon={<Building2 size={15}/>}>
                  <input
                    value={form.businessName} onChange={set('businessName')}
                    placeholder="e.g. Akosua Kitchen"
                    style={{ ...inputStyle, paddingLeft: 38 }}
                    onFocus={e => e.target.style.borderColor = theme.green}
                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                  />
                </Field>

                <Field label="Business Address *" icon={<MapPin size={15}/>}>
                  <input
                    value={form.address} onChange={set('address')}
                    placeholder="e.g. Main Street, Agona Nkwanta"
                    style={{ ...inputStyle, paddingLeft: 38 }}
                    onFocus={e => e.target.style.borderColor = theme.green}
                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                  />
                </Field>

                <Field label="Business Phone *" icon={<Phone size={15}/>}>
                  <input
                    value={form.phone} onChange={set('phone')}
                    placeholder="0241234567" type="tel"
                    style={{ ...inputStyle, paddingLeft: 38 }}
                    onFocus={e => e.target.style.borderColor = theme.green}
                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                  />
                </Field>

                <Field
                  label={<>Logo URL <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></>}
                  icon={<Image size={15}/>}
                >
                  <input
                    value={form.logo} onChange={set('logo')}
                    placeholder="https://..."
                    style={{ ...inputStyle, paddingLeft: 38 }}
                    onFocus={e => e.target.style.borderColor = theme.green}
                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                  />
                  <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 5 }}>
                    You can add this later from your dashboard
                  </p>
                </Field>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button onClick={prevStep} style={backBtn}>
                  <ArrowLeft size={15}/> Back
                </button>
                <button
                  onClick={() => { if (form.businessName && form.address && form.phone) nextStep(); }}
                  disabled={!form.businessName || !form.address || !form.phone}
                  style={primaryBtn(!form.businessName || !form.address || !form.phone)}>
                  Continue <ArrowRight size={16}/>
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════
              STEP 2 — Location
          ════════════════════════════════════ */}
          {step === 2 && (
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f1117', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
                Share your location
              </h1>
              <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 24px' }}>
                Helps customers and riders find you faster
              </p>

              {error && <ErrorBox message={error}/>}

              <div style={{
                border: '2px dashed #e5e7eb', borderRadius: 14,
                padding: '40px 20px', textAlign: 'center', marginBottom: 20,
              }}>
                {form.latitude != null ? (
                  <div>
                    <div style={{
                      width: 60, height: 60, borderRadius: '50%',
                      background: '#f0fdf4',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 14px', color: '#16a34a',
                    }}>
                      <CheckCircle size={30}/>
                    </div>
                    <div style={{ fontWeight: 800, color: '#0f1117', fontSize: 15, marginBottom: 4 }}>
                      Location captured!
                    </div>
                    <div style={{ fontSize: 13, color: '#6b7280', fontFamily: 'monospace' }}>
                      {form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}
                    </div>
                    <button
                      onClick={() => setForm(f => ({ ...f, latitude: null, longitude: null }))}
                      style={{
                        marginTop: 14, fontSize: 13, color: '#6b7280',
                        background: 'none', border: 'none', cursor: 'pointer',
                        textDecoration: 'underline',
                      }}>
                      Reset location
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{
                      width: 60, height: 60, borderRadius: '50%', background: '#f3f4f6',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 14px', color: '#9ca3af',
                    }}>
                      <MapPin size={30}/>
                    </div>
                    <div style={{ fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                      No location set
                    </div>
                    <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 18px' }}>
                      Allow location access so customers can find you
                    </p>
                    <button onClick={getLocation} disabled={locating} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '11px 22px', borderRadius: 10,
                      border: `1.5px solid ${theme.green}`,
                      background: `${theme.green}10`, color: theme.green,
                      fontWeight: 700, fontSize: 14, cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}>
                      {locating
                        ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }}/>
                        : <Navigation size={15}/>}
                      {locating ? 'Locating...' : 'Use My Location'}
                    </button>
                  </div>
                )}
              </div>

              <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', margin: '0 0 24px' }}>
                NB: Make sure you are setting this location at the location of your store
                </p>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={prevStep} style={backBtn}>
                  <ArrowLeft size={15}/> Back
                </button>
                {/* Skip or Continue — both go to next step */}
                <button onClick={nextStep} style={primaryBtn()}>
                  {form.latitude != null ? 'Continue' : 'Skip for now'} <ArrowRight size={16}/>
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════
              STEP 3 — Opening Hours + Submit
          ════════════════════════════════════ */}
          {step === 3 && (
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f1117', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
                Opening hours
              </h1>
              <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 24px' }}>
                When are you open? <span style={{ color: '#9ca3af' }}>(optional)</span>
              </p>

              {error && <ErrorBox message={error}/>}

              <div>
                <label style={labelStyle}>
                  <Clock size={14} style={{ marginRight: 6, verticalAlign: 'middle', color: '#9ca3af' }}/>
                  Hours / Schedule
                </label>
                <textarea
                  value={form.openingHours} onChange={set('openingHours')}
                  placeholder={'Mon–Fri: 8am–8pm\nSat: 9am–6pm\nSun: Closed'}
                  rows={4}
                  style={{ ...inputStyle, height: 'auto', padding: '12px 14px', resize: 'vertical', lineHeight: 1.6 }}
                  onFocus={e => e.target.style.borderColor = theme.green}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
                <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 5 }}>
                  Free-form — write whatever works for your schedule
                </p>
              </div>

              {/* Summary */}
              <div style={{
                background: '#f9fafb', border: '1px solid #f0f0f0',
                borderRadius: 12, padding: '16px 18px', marginTop: 20,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                  Summary
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    ['Business', form.businessName],
                    ['Type',     form.businessType],
                    ['Address',  form.address],
                    ['Phone',    form.phone],
                    ['Location', form.latitude != null
                      ? `${form.latitude.toFixed(4)}, ${form.longitude.toFixed(4)}`
                      : 'Not set'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', gap: 8, fontSize: 13 }}>
                      <span style={{ color: '#9ca3af', width: 70, flexShrink: 0 }}>{k}</span>
                      <span style={{ fontWeight: 700, color: '#0f1117' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{
                background: '#fffbeb', border: '1px solid #fde68a',
                borderRadius: 10, padding: '12px 16px', marginTop: 16,
                fontSize: 13, color: '#92400e', display: 'flex', gap: 8,
              }}>
                <span>ℹ️</span>
                <span>Your store will be reviewed by our team. You'll be notified once approved — usually within 24 hours.</span>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button onClick={prevStep} style={backBtn}>
                  <ArrowLeft size={15}/> Back
                </button>
                <button onClick={submit} disabled={loading} style={primaryBtn(loading)}>
                  {loading
                    ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }}/> Submitting...</>
                    : <>Submit for Review <ArrowRight size={16}/></>}
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════
              STEP 4 — Done
          ════════════════════════════════════ */}
          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: 76, height: 76, borderRadius: '50%',
                background: `${theme.green}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', color: theme.green,
              }}>
                <CheckCircle size={38}/>
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0f1117', margin: '0 0 10px', letterSpacing: '-0.5px' }}>
                You're submitted!
              </h1>
              <p style={{ color: '#6b7280', fontSize: 15, lineHeight: 1.6, maxWidth: 360, margin: '0 auto 28px' }}>
                Your vendor profile is under review. We'll notify you once it's approved — usually within 24 hours.
              </p>

              <div style={{ background: '#f9fafb', borderRadius: 12, padding: '16px 18px', marginBottom: 24, textAlign: 'left' }}>
                {[
                  ['Business', form.businessName],
                  ['Type',     form.businessType],
                  ['Address',  form.address],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 8, fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: '#9ca3af', width: 70 }}>{k}</span>
                    <span style={{ fontWeight: 700, color: '#0f1117' }}>{v}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate('/vendor/dashboard')}
                style={{
                  width: '100%', height: 50, borderRadius: 10, border: 'none',
                  background: `linear-gradient(135deg, ${theme.green}, ${theme.greenMid})`,
                  color: '#fff', fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                Go to Dashboard <ArrowRight size={16}/>
              </button>
            </div>
          )}

        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Small helpers ──────────────────────────────────────────

function Field({ label, icon, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', display: 'flex' }}>
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}

function ErrorBox({ message }) {
  return (
    <div style={{
      background: '#fef2f2', border: '1px solid #fecaca',
      borderRadius: 10, padding: '12px 16px', marginBottom: 20,
      color: '#dc2626', fontSize: 14,
    }}>
      ⚠️ {message}
    </div>
  );
}