'use client';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, CheckCircle2, XCircle, Phone, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const STEPS = ['PENDING', 'ACCEPTED', 'RIDER_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'];

const LABELS = {
  PENDING: 'Requested',
  ACCEPTED: 'Accepted',
  RIDER_ASSIGNED: 'Rider Assigned',
  PICKED_UP: 'Picked Up',
  IN_TRANSIT: 'On the Way',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export default function DeliveryDetailPage() {
  const { deliveryId } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const { theme } = useTheme();

  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`/deliveries/${deliveryId}`);
      const json = await res.json();
      if (json.success) setDelivery(json.data.delivery ?? json.data);
      else setError(json.message || 'Could not load this delivery.');
    } catch {
      setError('Could not reach the server.');
    }
    setLoading(false);
  }, [authFetch, deliveryId]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8faf8', fontFamily: "'DM Sans', system-ui, sans-serif", paddingBottom: 60 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><ArrowLeft size={20} /></button>
            <span style={{ fontWeight: 800, fontSize: 16 }}>Delivery Detail</span>
          </div>
          <button onClick={load} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><RefreshCw size={18} /></button>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: 20 }}>
        {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: theme.green }} /></div>}
        {!loading && error && <div style={{ color: '#dc2626', textAlign: 'center', padding: 40 }}>{error}</div>}
        {!loading && delivery && <DetailBody delivery={delivery} theme={theme} />}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function DetailBody({ delivery, theme }) {
  const isCancelled = delivery.status === 'CANCELLED';

  return (
    <>
      {!isCancelled && <StatusTracker currentStatus={delivery.status} theme={theme} />}

      {isCancelled && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fee2e2', borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <XCircle size={20} color="#dc2626" />
          <span style={{ color: '#dc2626', fontWeight: 700, fontSize: 13 }}>This delivery was cancelled</span>
        </div>
      )}

      <Section title="Delivery Info">
        <InfoRow label="Delivery ID" value={delivery.id.slice(-8).toUpperCase()} />
        <InfoRow label="Item" value={delivery.itemDescription} />
        <InfoRow label="Date" value={new Date(delivery.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })} />
      </Section>

      <Section title="Route">
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: theme.green }} />
            <div style={{ width: 2, flex: 1, minHeight: 28, background: '#e5e7eb' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 26 }}>{delivery.pickupAddress}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{delivery.destinationAddress}</div>
          </div>
        </div>
      </Section>

      {delivery.riderName && (
        <Section title="Rider">
          <InfoRow label="Name" value={delivery.riderName} />
          {delivery.riderPhone && <InfoRow label="Phone" value={delivery.riderPhone} />}
          {delivery.riderPhone && (
            <a
              href={`tel:${delivery.riderPhone}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 8,
                padding: '9px 20px', borderRadius: 10, background: theme.green, color: '#fff',
                fontWeight: 700, fontSize: 13, textDecoration: 'none',
              }}
            >
              <Phone size={14} /> Call Rider
            </a>
          )}
        </Section>
      )}

      <Section title="Fee">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>Estimated Fee</span>
          <span style={{ fontSize: 15, fontWeight: 900, color: theme.green }}>GHS {Number(delivery.estimatedFee).toFixed(2)}</span>
        </div>
      </Section>
    </>
  );
}

function StatusTracker({ currentStatus, theme }) {
  const current = STEPS.indexOf(currentStatus);
  return (
    <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 16, padding: 16, marginBottom: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', marginBottom: 16 }}>Delivery Progress</div>
      {STEPS.map((step, idx) => {
        const done = idx <= current;
        const isNow = idx === current;
        return (
          <div key={step} style={{ display: 'flex', paddingBottom: 4 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? theme.green : '#f3f4f6',
                border: isNow ? `2px solid ${theme.green}` : 'none',
              }}>
                {done && <CheckCircle2 size={14} color="#fff" />}
              </div>
              {idx < STEPS.length - 1 && <div style={{ width: 2, height: 20, background: done ? theme.green : '#e5e7eb' }} />}
            </div>
            <div style={{ marginLeft: 12, display: 'flex', alignItems: 'center', gap: 8, paddingTop: 2 }}>
              <span style={{
                fontSize: 13, fontWeight: isNow ? 800 : 500,
                color: isNow ? theme.green : done ? '#111827' : '#9ca3af',
              }}>
                {LABELS[step] || step}
              </span>
              {isNow && <div style={{ width: 6, height: 6, borderRadius: '50%', background: theme.green }} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 16, padding: 16, marginBottom: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', padding: '5px 0' }}>
      <div style={{ width: 100, fontSize: 13, color: '#9ca3af', flexShrink: 0 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{value}</div>
    </div>
  );
}