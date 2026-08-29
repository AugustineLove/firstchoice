'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle2, Circle, Phone, Bike, StickyNote, Receipt, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';

const STEPS = ['PENDING', 'ACCEPTED', 'RIDER_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED'];
const PAYMENT_LABELS = {
  CASH: 'Cash on delivery',
  MOBILE_MONEY: 'Mobile Money',
  CARD: 'Card',
};

const PAYMENT_STATUS_STYLES = {
  PENDING: { bg: '#fff7ed', color: '#c2410c' },
  PAID: { bg: '#f0fdf4', color: '#16a34a' },
  FAILED: { bg: '#fef2f2', color: '#dc2626' },
  REFUNDED: { bg: '#eff6ff', color: '#2563eb' },
};

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
  const paymentStyle = PAYMENT_STATUS_STYLES[order.paymentStatus] || { bg: '#f3f4f6', color: '#6b7280' };
  const itemsCount = order.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) || 0;

  return (
    <div style={{ minHeight: '100vh', background: '#f8faf8', fontFamily: "'DM Sans', system-ui, sans-serif", paddingBottom: 40 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0 }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/orders')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><ArrowLeft size={20} /></button>
          <span style={{ fontWeight: 800, fontSize: 16 }}>Order #{id.slice(-8).toUpperCase()}</span>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: 20 }}>

        {/* Status timeline */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <MapPin size={15} color="#9ca3af" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ color: '#6b7280', fontSize: 14 }}>From: {order.vendor?.businessName}</div>
              {order.vendorAddress && (
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{order.vendorAddress}</div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 10 }}>
            <MapPin size={15} color={theme.green} style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ fontSize: 14, color: '#6b7280' }}>To: {order.deliveryAddress}</div>
          </div>

          {(order.recipientName || order.recipientPhone) && (
            <div style={{ marginTop: 10, fontSize: 12, color: '#9ca3af' }}>
              Recipient: {order.recipientName || '—'}
              {order.recipientPhone ? ` · ${order.recipientPhone}` : ''}
            </div>
          )}

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

        {/* Rider */}
        {order.rider && (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', padding: 16, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
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

        {/* Items */}
        {order.items?.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#6b7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Items ({itemsCount})
            </div>
            {order.items.map((item, i) => {
              const img = item.product?.images?.[0];
              const lineTotal = (item.price ?? item.product?.price ?? 0) * (item.quantity || 1);
              return (
                <div key={item.id || i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderTop: i > 0 ? '1px solid #f3f4f6' : 'none' }}>
                  {img ? (
                    <img src={img} alt={item.product?.name} style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f3f4f6', flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#0f1117' }}>{item.product?.name}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>Qty {item.quantity}</div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#0f1117', flexShrink: 0 }}>
                    GHS {lineTotal.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Notes */}
        {order.notes && (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', padding: 16, marginBottom: 16, display: 'flex', gap: 10 }}>
            <StickyNote size={16} color="#9ca3af" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 12, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Notes</div>
              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{order.notes}</div>
            </div>
          </div>
        )}

        {/* Payment + totals */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Receipt size={14} /> Payment
            </div>
            <div style={{
              fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
              background: paymentStyle.bg, color: paymentStyle.color,
            }}>
              {order.paymentStatus?.replace(/_/g, ' ')}
            </div>
          </div>

          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 14 }}>
            {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}
            {order.transaction?.reference && (
              <span style={{ color: '#9ca3af' }}> · Ref: {order.transaction.reference}</span>
            )}
          </div>

          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Row label="Subtotal" value={order.subtotal} />
            <Row label="Delivery fee" value={order.deliveryFee} />
            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 10, marginTop: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: 14, color: '#0f1117' }}>Total</span>
              <span style={{ fontSize: 20, fontWeight: 900, color: theme.green }}>GHS {((order?.subtotal ?? 0) + (order?.deliveryFee ?? 0)).toFixed(2)}</span>
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
      <span style={{ color: '#374151', fontWeight: 600 }}>GHS {(value ?? 0).toFixed(2)}</span>
    </div>
  );
}