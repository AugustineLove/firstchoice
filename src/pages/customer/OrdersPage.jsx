'use client';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, ShoppingBag, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const STATUS_STYLE = {
  PENDING:          { color: '#92400e', bg: '#fef3c7' },
  ACCEPTED:         { color: '#065f46', bg: '#d1fae5' },
  PREPARING:        { color: '#92400e', bg: '#fef3c7' },
  READY_FOR_PICKUP: { color: '#0369a1', bg: '#e0f2fe' },
  RIDER_ASSIGNED:   { color: '#5b21b6', bg: '#ede9fe' },
  PICKED_UP:        { color: '#1e40af', bg: '#dbeafe' },
  DELIVERED:        { color: '#065f46', bg: '#d1fae5' },
  CANCELLED:        { color: '#991b1b', bg: '#fee2e2' },
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const { theme } = useTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/users/me/orders');

      

      const json = await res.json();
      if (json.success) setOrders(json.data.orders ?? json.data);
      else setError(json.message || 'Could not load your orders');
    } catch {
      setError('Could not reach the server.');
    }
    setLoading(false);
  }, [authFetch]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8faf8', fontFamily: "'DM Sans', system-ui, sans-serif", paddingBottom: 88 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><ArrowLeft size={20} /></button> */}
          <span style={{ fontWeight: 800, fontSize: 16 }}>My Orders</span>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: 20 }}>
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <Loader2 size={26} style={{ animation: 'spin 1s linear infinite', color: theme.green }} />
          </div>
        )}
        {!loading && error && <p style={{ textAlign: 'center', color: '#dc2626', padding: 40 }}>{error}</p>}
        {!loading && !error && orders.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
            <ShoppingBag size={40} style={{ marginBottom: 10 }} />
            <div style={{ fontWeight: 700 }}>No orders yet</div>
          </div>
        )}
        {!loading && orders.map((o) => {
          const s = STATUS_STYLE[o.orderStatus] || { color: '#374151', bg: '#f3f4f6' };
          return (
            <div key={o.id} onClick={() => navigate(`/orders/${o.id}`)} style={{
              display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid #f0f0f0',
              borderRadius: 14, padding: 14, marginBottom: 10, cursor: 'pointer',
            }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: `${theme.green}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBag size={18} color={theme.green} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{o.vendor?.businessName || 'Order'}</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{new Date(o.createdAt).toLocaleDateString()} • GHS {o.totalAmount?.toFixed(2)}</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 50, color: s.color, background: s.bg, whiteSpace: 'nowrap' }}>
                {o.orderStatus?.replace(/_/g, ' ')}
              </span>
              <ChevronRight size={16} color="#d1d5db" />
            </div>
          );
        })}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}