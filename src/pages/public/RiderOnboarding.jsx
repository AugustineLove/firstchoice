'use client';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bike, FileText, MapPin, ArrowRight, ArrowLeft,
  Loader2, CheckCircle, Navigation, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const BIKE_TYPES = [
  { value: 'Motorcycle', label: 'Motorcycle', icon: '🏍️', desc: 'Best for speed & longer routes' },
  { value: 'Bicycle',    label: 'Bicycle',    icon: '🚲', desc: 'Eco-friendly, short distances' },
  { value: 'Tricycle',   label: 'Tricycle',   icon: '🛺', desc: 'Great for heavy loads' },
];

const STEPS = ['Bike Type', 'Details', 'Location', 'Done'];

export default function RiderOnboarding() {
  const { authFetch, user } = useAuth();
  const { theme } = useTheme();
  const navigate  = useNavigate();

  const [step,     setStep]    = useState(0);
  const [loading,  setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error,    setError]   = useState('');
  const [form, setForm] = useState({
    bikeType: '',
    licenseNumber: '',
    latitude: null,
    longitude: null,
  });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  function getLocation() {
    if (!navigator.geolocation) { setError('Geolocation not supported by your browser'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setForm(f => ({ ...f, latitude: coords.latitude, longitude: coords.longitude }));
        setLocating(false);
      },
      () => { setError('Could not get your location. You can set it from your dashboard later.'); setLocating(false); }
    );
  }

  async function submit() {
    setError('');
    setLoading(true);
    try {
      /* Create rider profile */
      const res = await authFetch('/riders/register', {
        method: 'POST',
        body: JSON.stringify({
          bikeType: form.bikeType,
          licenseNumber: form.licenseNumber.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to create rider profile');

      /* Optionally set starting location */
      if (form.latitude && form.longitude) {
        await authFetch('/api/riders/location', {
          method: 'PATCH',
          body: JSON.stringify({ latitude: form.latitude, longitude: form.longitude }),
        }).catch(() => {});
      }

      /* Set online */
      await authFetch('/riders/availability', {
        method: 'PATCH',
        body: JSON.stringify({ availability: 'ONLINE' }),
      }).catch(() => {});

      setStep(3);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    }
    setLoading(false);
  }

  const inputStyle = {
    width: '100%', height: 48, padding: '0 14px',
    border: '1.5px solid #e5e7eb', borderRadius: 10,
    fontSize: 14, color: '#0f1117', background: '#fff',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  };
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 };

  return (
    <div style={{
      minHeight: '100vh', background: '#f8faf8',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 520 }}>

        {/* Progress */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 36 }}>
          {STEPS.map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800,
                  background: step > i ? theme.green : step === i ? theme.green : '#e5e7eb',
                  color: step >= i ? '#fff' : '#9ca3af', transition: 'all 0.3s',
                }}>
                  {step > i ? <CheckCircle size={16}/> : i + 1}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: step === i ? theme.green : '#9ca3af', whiteSpace: 'nowrap' }}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 2, background: step > i ? theme.green : '#e5e7eb', margin: '-18px 6px 0', transition: 'background 0.3s' }}/>
              )}
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e5e7eb', padding: '36px 40px', boxShadow: '0 8px 40px rgba(0,0,0,0.05)' }}>

          {/* STEP 0 — Bike Type */}
          {step === 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: '#fef3c718', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏍️</div>
                <div>
                  <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f1117', margin: 0, letterSpacing: '-0.5px' }}>Set up your rider profile</h1>
                  <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>What vehicle do you ride?</p>
                </div>
              </div>

              <div style={{ height: 1, background: '#f0f0f0', margin: '20px 0' }}/>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {BIKE_TYPES.map(bt => (
                  <button key={bt.value} onClick={() => setForm(f => ({ ...f, bikeType: bt.value }))}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '16px 18px', borderRadius: 12, cursor: 'pointer',
                      border: `2px solid ${form.bikeType === bt.value ? theme.green : '#e5e7eb'}`,
                      background: form.bikeType === bt.value ? `${theme.green}08` : '#fff',
                      textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.2s',
                    }}>
                    <span style={{ fontSize: 28 }}>{bt.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: form.bikeType === bt.value ? theme.green : '#0f1117' }}>{bt.label}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{bt.desc}</div>
                    </div>
                    {form.bikeType === bt.value && (
                      <div style={{ marginLeft: 'auto', color: theme.green }}><CheckCircle size={18}/></div>
                    )}
                  </button>
                ))}
              </div>

              <button onClick={() => { if (form.bikeType) setStep(1); }} disabled={!form.bikeType}
                style={{ marginTop: 24, width: '100%', height: 50, borderRadius: 10, border: 'none', background: form.bikeType ? `linear-gradient(135deg, ${theme.green}, ${theme.greenMid})` : '#e5e7eb', color: form.bikeType ? '#fff' : '#9ca3af', fontSize: 15, fontWeight: 700, cursor: form.bikeType ? 'pointer' : 'not-allowed', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                Continue <ArrowRight size={16}/>
              </button>
            </div>
          )}

          {/* STEP 1 — Details */}
          {step === 1 && (
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f1117', margin: '0 0 4px', letterSpacing: '-0.5px' }}>Your details</h1>
              <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 24px' }}>A few more things to get you started</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelStyle}>
                    <ShieldCheck size={14} style={{ marginRight: 5, verticalAlign: 'middle', color: '#9ca3af' }}/>
                    Rider Name
                  </label>
                  <input value={user?.name || ''} disabled
                    style={{ ...inputStyle, background: '#f9fafb', color: '#6b7280' }}/>
                </div>

                <div>
                  <label style={labelStyle}>
                    <Bike size={14} style={{ marginRight: 5, verticalAlign: 'middle', color: '#9ca3af' }}/>
                    Selected Vehicle
                  </label>
                  <input value={form.bikeType} disabled
                    style={{ ...inputStyle, background: '#f9fafb', color: '#6b7280' }}/>
                </div>

                <div>
                  <label style={labelStyle}>
                    <FileText size={14} style={{ marginRight: 5, verticalAlign: 'middle', color: '#9ca3af' }}/>
                    License Number <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span>
                  </label>
                  <input value={form.licenseNumber} onChange={set('licenseNumber')}
                    placeholder="e.g. GH-MO-12345" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = theme.green}
                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}/>
                  <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 5 }}>You can add or update this later</p>
                </div>
              </div>

              {/* Perks */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '14px 16px', marginTop: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#15803d', marginBottom: 8 }}>WHAT YOU GET</div>
                {['Set your own hours — go online/offline anytime', 'Earn per delivery + tips', 'Real-time job notifications'].map(p => (
                  <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#166534', marginBottom: 5 }}>
                    <CheckCircle size={14} style={{ color: '#16a34a', flexShrink: 0 }}/> {p}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button onClick={() => setStep(0)}
                  style={{ height: 50, paddingInline: 20, borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#374151', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ArrowLeft size={15}/> Back
                </button>
                <button onClick={() => setStep(2)}
                  style={{ flex: 1, height: 50, borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${theme.green}, ${theme.greenMid})`, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  Continue <ArrowRight size={16}/>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 — Location */}
          {step === 2 && (
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f1117', margin: '0 0 4px', letterSpacing: '-0.5px' }}>Share your location</h1>
              <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 24px' }}>Helps us assign you nearby jobs</p>

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#dc2626', fontSize: 14 }}>
                  ⚠️ {error}
                </div>
              )}

              <div style={{ border: '2px dashed #e5e7eb', borderRadius: 14, padding: '32px 20px', textAlign: 'center', marginBottom: 20 }}>
                {form.latitude ? (
                  <div>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#16a34a' }}>
                      <CheckCircle size={28}/>
                    </div>
                    <div style={{ fontWeight: 800, color: '#0f1117', marginBottom: 4 }}>Location captured!</div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>
                      {form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}
                    </div>
                    <button onClick={() => setForm(f => ({ ...f, latitude: null, longitude: null }))}
                      style={{ marginTop: 12, fontSize: 13, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                      Reset
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#9ca3af' }}>
                      <MapPin size={28}/>
                    </div>
                    <div style={{ fontWeight: 700, color: '#374151', marginBottom: 6 }}>No location set</div>
                    <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 16px' }}>Allow location access for faster job matching</p>
                    <button onClick={getLocation} disabled={locating}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 10, border: `1.5px solid ${theme.green}`, background: `${theme.green}10`, color: theme.green, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {locating ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }}/> : <Navigation size={15}/>}
                      {locating ? 'Locating...' : 'Allow Location'}
                    </button>
                  </div>
                )}
              </div>

              <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', margin: '0 0 20px' }}>
                You can skip this and set your location from the dashboard
              </p>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setError(''); setStep(1); }}
                  style={{ height: 50, paddingInline: 20, borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#374151', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ArrowLeft size={15}/> Back
                </button>
                <button onClick={submit} disabled={loading}
                  style={{ flex: 1, height: 50, borderRadius: 10, border: 'none', background: loading ? '#9ca3af' : `linear-gradient(135deg, ${theme.green}, ${theme.greenMid})`, color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }}/> Setting up...</> : <>Complete Setup <ArrowRight size={16}/></>}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — Done */}
          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0f1117', margin: '0 0 10px', letterSpacing: '-0.5px' }}>You're all set!</h1>
              <p style={{ color: '#6b7280', fontSize: 15, lineHeight: 1.6, maxWidth: 340, margin: '0 auto 28px' }}>
                Your rider profile is live. Head to your dashboard to go online and start receiving delivery jobs.
              </p>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '16px 18px', marginBottom: 24, textAlign: 'left' }}>
                {[['Vehicle', form.bikeType], ['Status', 'Online & Ready']].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 8, fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: '#9ca3af', width: 70 }}>{k}</span>
                    <span style={{ fontWeight: 700, color: '#16a34a' }}>{v}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('/rider/dashboard')}
                style={{ width: '100%', height: 50, borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${theme.green}, ${theme.greenMid})`, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
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