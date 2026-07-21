'use client';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Package, Loader2, Bike } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const STATUS_STYLE = {
  PENDING: { color: '#92400e', bg: '#fef3c7' }, ACCEPTED: { color: '#065f46', bg: '#d1fae5' },
  PICKED_UP: { color: '#1e40af', bg: '#dbeafe' }, IN_TRANSIT: { color: '#1e40af', bg: '#dbeafe' },
  DELIVERED: { color: '#065f46', bg: '#d1fae5' }, CANCELLED: { color: '#991b1b', bg: '#fee2e2' },
};

export default function DeliveriesPage() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const { theme } = useTheme();

  const [tab, setTab] = useState('book'); // 'book' | 'history'
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [description, setDescription] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await authFetch('/deliveries/my'); // adjust to your customer-scoped deliveries endpoint
      const json = await res.json();
      if (json.success) setHistory(json.data.deliveries ?? json.data);
    } catch {}
    setLoadingHistory(false);
  }, [authFetch]);

  useEffect(() => { if (tab === 'history') loadHistory(); }, [tab, loadHistory]);

  const canSubmit = pickup.trim() && destination.trim() && description.trim();

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await authFetch('/deliveries', {
        method: 'POST',
        body: JSON.stringify({ pickupAddress: pickup, destinationAddress: destination, packageDescription: description, recipientPhone }),
      });
      const json = await res.json();
      if (json.success) {
        setPickup(''); setDestination(''); setDescription(''); setRecipientPhone('');
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

            <Field label="Pickup Location" icon={<MapPin size={15} color="#10b981" />}>
              <input value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="Where should we pick up from?" style={inputStyle} />
            </Field>
            <Field label="Destination" icon={<MapPin size={15} color="#3b82f6" />}>
              <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Where is this going?" style={inputStyle} />
            </Field>
            <Field label="What are we delivering?" icon={<Package size={15} color="#8b5cf6" />}>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="e.g. Documents, a small package..." style={{ ...inputStyle, height: 'auto', paddingTop: 10, resize: 'none' }} />
            </Field>
            <Field label="Recipient Phone (optional)">
              <input value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} placeholder="0241234567" style={inputStyle} />
            </Field>

            <button onClick={submit} disabled={!canSubmit || submitting} style={{
              width: '100%', height: 48, border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 14, fontFamily: 'inherit', marginTop: 6,
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

const inputStyle = { width: '100%', height: 44, border: '1px solid #e5e7eb', borderRadius: 10, padding: '0 12px', fontFamily: 'inherit', fontSize: 13, boxSizing: 'border-box' };