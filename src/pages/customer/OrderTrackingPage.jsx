'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle2, Circle, Phone, Bike } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';

const STEPS = ['PENDING', 'ACCEPTED', 'RIDER_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'];

export default function OrderTrackingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const { theme } = useTheme();
  const { on } = useSocket();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/orders/${id}`);
      const json = await res.json();
      if (json.success) setOrder(json.data);
    } catch {}
    setLoading(false);
  }, [authFetch, id]);

  useEffect(() => { load(); }, [load]);

  // Live updates — re-fetch when a push mentions this order
  useEffect(() => on('order:status', (data) => {
    if (data.orderId === id) load();
  }), [on, id, load]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8faf8' }}>
        <Loader2 size={26} style={{ animation: 'spin 1s linear infinite', color: theme.green }} />
      </div>
    );
  }
  if (!order) return null;

  const activeIndex = order.orderStatus === 'CANCELLED' ? -1 : STEPS.indexOf(order.orderStatus);

  return (
    <div style={{ minHeight: '100vh', background: '#f8faf8', fontFamily: "'DM Sans', system-ui, sans-serif", paddingBottom: 40 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0 }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/orders')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><ArrowLeft size={20} /></button>
          <span style={{ fontWeight: 800, fontSize: 16 }}>Order #{id.slice(-8).toUpperCase()}</span>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: 20 }}>

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', padding: 20, marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{order.vendor?.businessName}</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{order.deliveryAddress}</div>

          {order.orderStatus === 'CANCELLED' ? (
            <div style={{ marginTop: 16, padding: 12, background: '#fef2f2', borderRadius: 10, color: '#dc2626', fontWeight: 700, fontSize: 13, textAlign: 'center' }}>
              This order was cancelled
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
                    <div style={{ fontWeight: i <= activeIndex ? 700 : 500, fontSize: 13, color: i <= activeIndex ? '#0f1117' : '#9ca3af' }}>
                      {step.replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {order.rider && (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: `${theme.green}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bike size={18} color={theme.green} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{order.rider.user?.name}</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>Your rider</div>
            </div>
            {order.rider.user?.phone && (
              <a href={`tel:${order.rider.user.phone}`} style={{
                width: 38, height: 38, borderRadius: '50%', background: theme.green, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
              }}><Phone size={16} /></a>
            )}
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', padding: 16, marginTop: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Order Total</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: theme.green }}>GHS {order.totalAmount?.toFixed(2)}</div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}