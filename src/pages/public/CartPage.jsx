'use client';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Plus, Minus, MapPin, Locate, User, Wallet, Smartphone, Info, ShoppingCart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';

export default function CartPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { items, subtotal, deliveryFee, total, updateQuantity, removeItem, clear } = useCart();

  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [deliverToSomeoneElse, setDeliverToSomeoneElse] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');

  const [address, setAddress] = useState('');
  const [locationName, setLocationName] = useState('');
  const [locating, setLocating] = useState(false);
  const [usingCurrent, setUsingCurrent] = useState(false);

  const addressReady = address.trim().length > 0;

  function useCurrentLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setAddress(`GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        setLocationName('Current location');
        setUsingCurrent(true);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true }
    );
  }

  function goToCheckout() {
    if (!addressReady) return;
    if (deliverToSomeoneElse && (!recipientName.trim() || !recipientPhone.trim())) return;
    navigate('/checkout', {
      state: {
        address, locationName, paymentMethod,
        recipientName: deliverToSomeoneElse ? recipientName.trim() : null,
        recipientPhone: deliverToSomeoneElse ? recipientPhone.trim() : null,
      },
    });
  }

  if (items.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8faf8', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <TopBar title="Cart" onBack={() => navigate(-1)} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', textAlign: 'center' }}>
          <ShoppingCart size={56} color="#d1d5db" />
          <p style={{ fontWeight: 700, color: '#6b7280', marginTop: 16, fontSize: 17 }}>Your cart is empty</p>
          <p style={{ color: '#9ca3af', fontSize: 14, marginTop: 4 }}>Add items from a vendor to get started</p>
          <button onClick={() => navigate('/home')} style={{ marginTop: 20, background: theme.green, color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Browse vendors
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8faf8', fontFamily: "'DM Sans', system-ui, sans-serif", paddingBottom: 100 }}>
      <TopBar title={`Cart (${items.length} item${items.length !== 1 ? 's' : ''})`} onBack={() => navigate(-1)}
        action={<button onClick={clear} style={{ background: 'none', border: 'none', color: '#dc2626', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Clear all</button>} />

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 20px' }}>

        {/* Items */}
        <SectionCard title="Your Items" icon={<ShoppingCart size={16} color={theme.green} />}>
          {items.map((item, i) => (
            <div key={item.productId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: i > 0 ? '1px solid #f0f0f0' : 'none' }}>
              <div style={{
                width: 54, height: 54, borderRadius: 10, flexShrink: 0,
                background: item.image ? `url(${item.image}) center/cover` : '#ecfdf5',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              }}>{!item.image && '🍛'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                {item.selectedVariants?.length > 0 && (
                  <div style={{ fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.selectedVariants.map((v) => v.variantName).join(', ')}
                  </div>
                )}
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>GHS {item.price.toFixed(2)} each</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: 10 }}>
                <IconBtn icon={<Minus size={15} />} onClick={() => updateQuantity(item.productId, item.quantity - 1)} disabled={item.quantity <= 1} />
                <span style={{ padding: '0 10px', fontWeight: 800 }}>{item.quantity}</span>
                <IconBtn icon={<Plus size={15} />} onClick={() => updateQuantity(item.productId, item.quantity + 1)} />
              </div>
              <div style={{ width: 70, textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: theme.green }}>GHS {(item.price * item.quantity).toFixed(2)}</div>
                <button onClick={() => removeItem(item.productId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', marginTop: 4 }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </SectionCard>

        {/* Delivery location */}
        <SectionCard title="Delivery Location" icon={<MapPin size={16} color={theme.green} />}>
          <input value={address} onChange={(e) => { setAddress(e.target.value); setUsingCurrent(false); }}
            placeholder="Enter delivery address..."
            style={{ width: '100%', height: 44, border: '1px solid #e5e7eb', borderRadius: 10, padding: '0 12px', fontFamily: 'inherit', fontSize: 13, boxSizing: 'border-box' }} />
          <button onClick={useCurrentLocation} disabled={locating} style={{
            marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
            border: `1px solid ${usingCurrent ? theme.green : '#e5e7eb'}`, background: usingCurrent ? `${theme.green}12` : '#f9fafb', width: '100%',
          }}>
            <Locate size={16} color={usingCurrent ? theme.green : '#9ca3af'} />
            <span style={{ fontSize: 13, fontWeight: 600, color: usingCurrent ? theme.green : '#6b7280' }}>
              {locating ? 'Getting location...' : usingCurrent ? '✓ Using current location' : 'Use my current location'}
            </span>
          </button>
        </SectionCard>

        {/* Recipient */}
        <SectionCard title="Recipient" icon={<User size={16} color={theme.green} />}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Deliver to someone else</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>Enter recipient details below</div>
            </div>
            <Switch checked={deliverToSomeoneElse} onChange={setDeliverToSomeoneElse} color={theme.green} />
          </div>
          {deliverToSomeoneElse && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Recipient's Name" style={inputStyle} />
              <input value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} placeholder="Recipient's Phone" style={inputStyle} />
              <div style={{ display: 'flex', gap: 8, padding: 10, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10 }}>
                <Info size={14} color="#92400e" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 12, color: '#92400e' }}>The rider will contact this person for delivery.</span>
              </div>
            </div>
          )}
        </SectionCard>

        {/* Payment */}
        <SectionCard title="Payment Method" icon={<Wallet size={16} color={theme.green} />}>
          <div style={{ display: 'flex', gap: 12 }}>
            <PayOption value="CASH" label="Cash" icon={<Wallet size={20} />} active={paymentMethod === 'CASH'} onClick={setPaymentMethod} theme={theme} />
            <PayOption value="MOMO" label="MoMo" icon={<Smartphone size={20} />} active={paymentMethod === 'MOMO'} onClick={setPaymentMethod} theme={theme} />
          </div>
        </SectionCard>

        {/* Summary */}
        <SectionCard title="Order Summary" icon={null}>
          <SummaryRow label="Subtotal" value={`GHS ${subtotal.toFixed(2)}`} />
          <SummaryRow label="Delivery Fee" value={`GHS ${deliveryFee.toFixed(2)}`} />
          <div style={{ borderTop: '1px solid #f0f0f0', margin: '12px 0' }} />
          <SummaryRow label="Total" value={`GHS ${total.toFixed(2)}`} bold />
        </SectionCard>
      </div>

      {/* Bottom bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #f0f0f0', padding: '12px 20px 20px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          {!addressReady && (
            <div style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', fontWeight: 600, marginBottom: 8 }}>Select a delivery location to continue</div>
          )}
          <button onClick={goToCheckout} disabled={!addressReady} style={{
            width: '100%', height: 50, border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 14, fontFamily: 'inherit',
            background: addressReady ? theme.green : '#d1d5db', color: '#fff', cursor: addressReady ? 'pointer' : 'not-allowed',
          }}>
            Continue to Review  •  GHS {total.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── shared bits ── */
function TopBar({ title, onBack, action }) {
  return (
    <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 10 }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><ArrowLeft size={20} /></button>
        <span style={{ fontWeight: 800, fontSize: 16, flex: 1 }}>{title}</span>
        {action}
      </div>
    </div>
  );
}

function SectionCard({ title, icon, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', padding: 16, marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
        {icon}<span style={{ fontWeight: 800, fontSize: 14 }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function IconBtn({ icon, onClick, disabled }) {
  return <button onClick={onClick} disabled={disabled} style={{ background: 'none', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', padding: 8, color: disabled ? '#d1d5db' : '#10b981', display: 'flex' }}>{icon}</button>;
}

function Switch({ checked, onChange, color }) {
  return (
    <div onClick={() => onChange(!checked)} style={{
      width: 44, height: 26, borderRadius: 50, background: checked ? color : '#e5e7eb', cursor: 'pointer', padding: 3, transition: 'background 0.2s',
    }}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', transform: checked ? 'translateX(18px)' : 'translateX(0)', transition: 'transform 0.2s' }} />
    </div>
  );
}

function PayOption({ value, label, icon, active, onClick, theme }) {
  return (
    <button onClick={() => onClick(value)} style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '14px 0', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
      border: `${active ? 1.5 : 1}px solid ${active ? theme.green : '#e5e7eb'}`, background: active ? `${theme.green}12` : '#f9fafb',
      color: active ? theme.green : '#6b7280',
    }}>
      {icon}<span style={{ fontSize: 13, fontWeight: 700 }}>{label}</span>
    </button>
  );
}

function SummaryRow({ label, value, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: bold ? 0 : 8 }}>
      <span style={{ fontSize: bold ? 15 : 14, fontWeight: bold ? 800 : 500, color: bold ? '#0f1117' : '#6b7280' }}>{label}</span>
      <span style={{ fontSize: bold ? 16 : 14, fontWeight: bold ? 900 : 600, color: bold ? '#10b981' : '#0f1117' }}>{value}</span>
    </div>
  );
}

const inputStyle = { width: '100%', height: 42, border: '1px solid #e5e7eb', borderRadius: 10, padding: '0 12px', fontFamily: 'inherit', fontSize: 13, boxSizing: 'border-box' };