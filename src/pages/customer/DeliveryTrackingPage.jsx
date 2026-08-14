'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle2, Circle, Phone, Bike, StickyNote, Receipt, MapPin, ShoppingBag, Package } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';

const STEPS = ['PENDING', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'];

const STATUS_STYLE = {
  PENDING: { color: '#92400e', bg: '#fef3c7' }, ACCEPTED: { color: '#065f46', bg: '#d1fae5' },
  PICKED_UP: { color: '#1e40af', bg: '#dbeafe' }, IN_TRANSIT: { color: '#1e40af', bg: '#dbeafe' },
  DELIVERED: { color: '#065f46', bg: '#d1fae5' }, CANCELLED: { color: '#991b1b', bg: '#fee2e2' },
};

export default function DeliveryTrackingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const { theme } = useTheme();
  const { on } = useSocket();

  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/deliveries/${id}`);
      const json = await res.json();
      if (json.success) setDelivery(json.data);
    } catch {}
    setLoading(false);
  }, [authFetch, id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => on('delivery:status_update', (data) => { if (data.deliveryId === id) load(); }), [on, id, load]);
  useEffect(() => on('delivery:rider_accepted', (data) => { if (data.deliveryId === id) load(); }), [on, id, load]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8faf8' }}>
        <Loader2 size={26} style={{ animation: 'spin 1s linear infinite', color: theme.green }} />
      </div>
    );
  }
  if (!delivery) return null;

  const isErrand = delivery.type === 'ERRAND';
  const activeIndex = delivery.status === 'CANCELLED' ? -1 : STEPS.indexOf(delivery.status);
  const s = STATUS_STYLE[delivery.status] || { color: '#374151', bg: '#f3f4f6' };
  const errandItems = isErrand && Array.isArray(delivery.errandItems) ? delivery.errandItems : [];
  const deliveryFee = delivery.deliveryFee ?? delivery.estimatedFee ?? 0;
  const errandFee = delivery.errandFee ?? 0;

  return (
    <div style={{ minHeight: '100vh', background: '#f8faf8', fontFamily: "'DM Sans', system-ui, sans-serif", paddingBottom: 40 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0 }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/deliveries')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><ArrowLeft size={20} /></button>
          <span style={{ fontWeight: 800, fontSize: 16 }}>{isErrand ? 'Errand' : 'Delivery'} #{id.slice(-8).toUpperCase()}</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 50, color: s.color, background: s.bg, whiteSpace: 'nowrap' }}>
            {delivery.status?.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: 20 }}>

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            {isErrand ? <ShoppingBag size={15} color="#10b981" style={{ marginTop: 2, flexShrink: 0 }} /> : <MapPin size={15} color="#10b981" style={{ marginTop: 2, flexShrink: 0 }} />}
            <div style={{ color: '#6b7280', fontSize: 14 }}>{isErrand ? 'Errand pickup: ' : 'From: '}{delivery.pickupAddress}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 10 }}>
            <MapPin size={15} color={theme.green} style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ fontSize: 14, color: '#6b7280' }}>To: {delivery.destinationAddress}</div>
          </div>

          {(delivery.recipientName || delivery.recipientPhone) && (
            <div style={{ marginTop: 10, fontSize: 12, color: '#9ca3af' }}>
              Recipient: {delivery.recipientName || '—'}{delivery.recipientPhone ? ` · ${delivery.recipientPhone}` : ''}
            </div>
          )}

          {delivery.status === 'CANCELLED' ? (
            <div style={{ marginTop: 16, padding: 12, background: '#fef2f2', borderRadius: 10, color: '#dc2626', fontWeight: 700, fontSize: 13, textAlign: 'center' }}>
              This {isErrand ? 'errand' : 'delivery'} was cancelled
            </div>
          ) : (
            <div style={{ marginTop: 20 }}>
              {STEPS.map((step, i) => (
                <div key={step} style={{ display: 'flex', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {i <= activeIndex
                      ? <CheckCircle2 size={20} color={theme.green} fill={i < activeIndex ? theme.green : 'none'} />
                      : <Circle size={20} color="#d1d5db" />}
                    {i < STEPS.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 24, background: i < activeIndex ? theme.green : '#e5e7eb' }} />}
                  </div>
                  <div style={{ paddingBottom: 20 }}>
                    <div style={{ fontWeight: i <= activeIndex ? 700 : 500, fontSize: 13, color: i <= activeIndex ? '#0f1117' : '#9ca3af' }}>{step.replace(/_/g, ' ')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {delivery.rider && (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', padding: 16, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: `${theme.green}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bike size={18} color={theme.green} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{delivery.rider.user?.name}</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>{isErrand ? 'Your errand runner' : 'Your rider'}</div>
            </div>
            {delivery.rider.user?.phone && (
              <a href={`tel:${delivery.rider.user.phone}`} style={{ width: 38, height: 38, borderRadius: '50%', background: theme.green, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Phone size={16} />
              </a>
            )}
          </div>
        )}

       <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#6b7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.03em', display:'flex', alignItems:'center', gap:6 }}>
                <Package size={14}/> {isErrand ? `Errand list (${errandItems.length})` : 'Item'}
            </div>
            {isErrand ? (
                errandItems.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {errandItems.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: '#374151' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: theme.green, flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.text}</span>
                        </div>
                        <span style={{ fontWeight: 700, color: '#6b7280', flexShrink: 0, marginLeft: 8 }}>GHS {Number(item.estimatedPrice ?? 0).toFixed(2)}</span>
                    </div>
                    ))}
                    <div style={{ borderTop: '1px solid #f3f4f6', marginTop: 4, paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#374151' }}>Estimated items cost</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: theme.green }}>GHS {Number(delivery.itemsEstimatedTotal ?? 0).toFixed(2)}</span>
                    </div>
                </div>
                ) : <div style={{ fontSize: 13, color: '#9ca3af' }}>No items listed</div>
            ) : (
                <div style={{ fontSize: 13, color: '#374151' }}>{delivery.itemDescription}</div>
            )}
            {delivery.imageUrl && <img src={delivery.imageUrl} alt="Item" style={{ width: '100%', maxWidth: 220, borderRadius: 12, marginTop: 12 }} />}
            </div>

        {delivery.notes && (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', padding: 16, marginBottom: 16, display: 'flex', gap: 10 }}>
            <StickyNote size={16} color="#9ca3af" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 12, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Notes</div>
              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{delivery.notes}</div>
            </div>
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', padding: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: '#6b7280', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Receipt size={14} /> Payment — {delivery.paymentMethod === 'MOMO' ? 'Mobile Money' : 'Cash'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {isErrand && (
                <>
                <Row label="Delivery fee" value={deliveryFee} />
                <Row label="Errand fee" value={errandFee} />
                <Row label="Estimated items cost" value={delivery.itemsEstimatedTotal} />
                <div style={{ borderTop: '1px solid #f3f4f6', margin: '2px 0' }} />
                </>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: 14, color: '#0f1117' }}>
                {isErrand ? 'Estimated Total' : 'Total'}
                </span>
                <span style={{ fontSize: 20, fontWeight: 900, color: theme.green }}>
                GHS {Number((delivery.estimatedFee ?? 0) + (isErrand ? (delivery.itemsEstimatedTotal ?? 0) : 0)).toFixed(2)}
                </span>
            </div>
            </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
      <span style={{ color: '#6b7280' }}>{label}</span>
      <span style={{ color: '#374151', fontWeight: 600 }}>GHS {Number(value ?? 0).toFixed(2)}</span>
    </div>
  );
}