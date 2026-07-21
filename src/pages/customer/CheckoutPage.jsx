'use client';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MapPin, User, Wallet, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { state } = useLocation(); // { address, locationName, paymentMethod, recipientName, recipientPhone }
  const { authFetch } = useAuth();
  const { theme } = useTheme();
  const { items, vendorId, subtotal, deliveryFee, total, clear } = useCart();

  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(null);

  if (!state?.address || items.length === 0) {
    // Reached directly without going through the cart — send them back
    navigate('/cart', { replace: true });
    return null;
  }

  async function placeOrder() {
    setPlacing(true);
    setError(null);
    try {
      const res = await authFetch('/orders', {
        method: 'POST',
        body: JSON.stringify({
          vendorId,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            price: i.price,
            selectedVariants: i.selectedVariants,
            selectedAddons: i.selectedAddons,
            itemNotes: i.itemNotes,
            customPrice: i.customPrice,
          })),
          deliveryAddress: state.address,
          locationName: state.locationName,
          paymentMethod: state.paymentMethod,
          recipientName: state.recipientName,
          recipientPhone: state.recipientPhone,
          subtotal, deliveryFee, totalAmount: total,
        }),
      });
      const json = await res.json();
      if (json.success) {
        clear();
        navigate(`/orders/${json.data.id}`, { replace: true });
      } else {
        setError(json.message || 'Could not place your order.');
      }
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    }
    setPlacing(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8faf8', fontFamily: "'DM Sans', system-ui, sans-serif", paddingBottom: 100 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><ArrowLeft size={20} /></button>
          <span style={{ fontWeight: 800, fontSize: 16 }}>Review Order</span>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px' }}>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, fontWeight: 500 }}>
            {error}
          </div>
        )}

        <Card icon={<MapPin size={16} color={theme.green} />} title="Delivering to">
          <div style={{ fontWeight: 700, fontSize: 14 }}>{state.locationName || 'Delivery address'}</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{state.address}</div>
        </Card>

        {state.recipientName && (
          <Card icon={<User size={16} color={theme.green} />} title="Recipient">
            <div style={{ fontWeight: 700, fontSize: 14 }}>{state.recipientName}</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{state.recipientPhone}</div>
          </Card>
        )}

        <Card icon={<Wallet size={16} color={theme.green} />} title="Payment">
          <div style={{ fontWeight: 700, fontSize: 14 }}>{state.paymentMethod === 'MOMO' ? 'Mobile Money' : 'Cash on delivery'}</div>
        </Card>

        <Card title={`Items (${items.length})`}>
          {items.map((item) => (
            <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
              <span style={{ color: '#374151' }}>{item.quantity}× {item.name}</span>
              <span style={{ fontWeight: 700 }}>GHS {(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #f0f0f0', margin: '10px 0' }} />
          <Row label="Subtotal" value={`GHS ${subtotal.toFixed(2)}`} />
          <Row label="Delivery Fee" value={`GHS ${deliveryFee.toFixed(2)}`} />
          <div style={{ borderTop: '1px solid #f0f0f0', margin: '10px 0' }} />
          <Row label="Total" value={`GHS ${total.toFixed(2)}`} bold />
        </Card>
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #f0f0f0', padding: '12px 20px 20px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <button onClick={placeOrder} disabled={placing} style={{
            width: '100%', height: 50, border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 14, fontFamily: 'inherit',
            background: theme.green, color: '#fff', cursor: placing ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: placing ? 0.7 : 1,
          }}>
            {placing ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Placing order...</> : <><CheckCircle2 size={18} /> Place Order  •  GHS {total.toFixed(2)}</>}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function Card({ icon, title, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', padding: 16, marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
        {icon}<span style={{ fontWeight: 800, fontSize: 13, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: bold ? 0 : 6 }}>
      <span style={{ fontSize: bold ? 15 : 13, fontWeight: bold ? 800 : 500, color: bold ? '#0f1117' : '#6b7280' }}>{label}</span>
      <span style={{ fontSize: bold ? 16 : 13, fontWeight: bold ? 900 : 600, color: bold ? '#10b981' : '#0f1117' }}>{value}</span>
    </div>
  );
}