'use client';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ShoppingBag, Bike, Package, User, Star, MapPin, Loader2, Store } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';

const CATEGORIES = [
  { label: 'All',         icon: '🏪', value: null },
  { label: 'Food',        icon: '🍛', value: 'Food' },
  { label: 'Grocery',     icon: '🛒', value: 'Grocery' },
  { label: 'Pharmacy',    icon: '💊', value: 'Pharmacy' },
  { label: 'Boutique',    icon: '👗', value: 'Boutique' },
  { label: 'Electronics', icon: '📱', value: 'Electronics' },
];

export default function CustomerHome() {
  const { user, authFetch } = useAuth();
  const { theme } = useTheme();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const [category, setCategory] = useState(null);
  const [vendors, setVendors]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const firstName = user?.name?.split(' ')[0] || 'there';

  const load = useCallback(async (cat = category) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(cat ? { category: cat } : {});
      const res = await authFetch(`/vendors?${params}`);
      const json = await res.json();
      if (json.success) setVendors(json.data.vendors ?? json.data);
      else setError(json.message || 'Could not load vendors');
    } catch (e) {
      setError('Could not reach the server. Check your connection.');
    }
    setLoading(false);
  }, [authFetch, category]);

  useEffect(() => { load(category); }, [category]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ minHeight: '100vh', background: '#f8faf8', fontFamily: "'DM Sans', system-ui, sans-serif", paddingBottom: 88 }}>

      {/* ── TOP BAR ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', background: `${theme.green}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: theme.green, flexShrink: 0,
          }}>{firstName[0]?.toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#0f1117' }}>Hello, {firstName} 👋</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>What would you like today?</div>
          </div>
          <button onClick={() => navigate('/notifications')} style={iconBtnStyle}><Bell size={20} color="#0f1117" /></button>
          <button onClick={() => navigate('/cart')} style={{ ...iconBtnStyle, position: 'relative' }}>
            <ShoppingBag size={20} color="#0f1117" />
            {totalItems > 0 && (
              <span style={{
                position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: '50%',
                background: theme.green, color: '#fff', fontSize: 9, fontWeight: 900,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{totalItems}</span>
            )}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>

        {/* ── QUICK ACTIONS ── */}
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <QuickAction icon={<Bike size={20} />} label="Deliveries" color={theme.green} onClick={() => navigate('/deliveries')} />
          <QuickAction icon={<ShoppingBag size={20} />} label="Orders" color="#3b82f6" onClick={() => navigate('/orders')} />
          <QuickAction icon={<User size={20} />} label="Profile" color="#8b5cf6" onClick={() => navigate('/profile')} />
        </div>

        {/* ── CATEGORIES ── */}
        <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f1117', margin: '28px 0 12px' }}>Browse</h3>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {CATEGORIES.map((cat) => {
            const active = category === cat.value;
            return (
              <button key={cat.label} onClick={() => setCategory(cat.value)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 50,
                border: `1px solid ${active ? theme.green : '#e5e7eb'}`, background: active ? theme.green : '#fff',
                color: active ? '#fff' : '#374151', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'inherit', transition: 'all 0.15s',
              }}>
                <span>{cat.icon}</span>{cat.label}
              </button>
            );
          })}
        </div>

        {/* ── VENDORS HEADER ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '24px 0 14px' }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f1117', margin: 0 }}>
            {category ? `${category} Vendors` : 'All Vendors'}
          </h3>
          {!loading && !error && <span style={{ fontSize: 13, color: '#6b7280' }}>{vendors.length} found</span>}
        </div>

        {/* ── VENDOR GRID ── */}
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            {Array.from({ length: 4 }).map((_, i) => <VendorCardSkeleton key={i} />)}
          </div>
        )}

        {!loading && error && (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <p style={{ color: '#6b7280', marginBottom: 12 }}>{error}</p>
            <button onClick={() => load()} style={{ color: theme.green, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>Try again</button>
          </div>
        )}

        {!loading && !error && vendors.length === 0 && (
          <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>
            <Store size={36} style={{ marginBottom: 10 }} />
            <div style={{ fontWeight: 700 }}>No vendors found</div>
          </div>
        )}

        {!loading && !error && vendors.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            {vendors.map((v) => <VendorCard key={v.id} vendor={v} onClick={() => navigate(`/vendor/${v.id}`)} />)}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── SUBCOMPONENTS ── */

function QuickAction({ icon, label, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      padding: '14px 0', borderRadius: 14, border: `1px solid ${color}26`, background: `${color}14`,
      cursor: 'pointer', fontFamily: 'inherit',
    }}>
      <span style={{ color }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color }}>{label}</span>
    </button>
  );
}

function VendorCard({ vendor, onClick }) {
  const emoji = { food: '🍛', grocery: '🛒', pharmacy: '💊', boutique: '👗', electronics: '📱' }[vendor.businessType?.toLowerCase()] || '🏪';
  return (
    <div onClick={onClick} style={{
      background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', overflow: 'hidden',
      cursor: 'pointer', transition: 'transform 0.15s',
    }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{
        height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38,
        background: vendor.logo ? `url(${vendor.logo}) center/cover` : 'linear-gradient(135deg, #10b981, #34d399)',
      }}>
        {!vendor.logo && emoji}
      </div>
      <div style={{ padding: 12 }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: '#0f1117', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {vendor.businessName}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
          <Star size={12} fill="#f59e0b" color="#f59e0b" />
          <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>{(vendor.rating ?? 0).toFixed(1)}</span>
          <span style={{ fontSize: 11, color: '#d1d5db' }}>•</span>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>{vendor.businessType}</span>
        </div>
        {vendor.address && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 4 }}>
            <MapPin size={11} color="#9ca3af" />
            <span style={{ fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vendor.address}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function VendorCardSkeleton() {
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
      <div style={{ height: 100, background: '#f3f4f6', animation: 'fc-pulse 1.5s infinite' }} />
      <div style={{ padding: 12 }}>
        <div style={{ height: 14, width: '70%', background: '#f3f4f6', borderRadius: 6, animation: 'fc-pulse 1.5s infinite' }} />
        <div style={{ height: 12, width: '40%', background: '#f3f4f6', borderRadius: 6, marginTop: 8, animation: 'fc-pulse 1.5s infinite' }} />
      </div>
      <style>{`@keyframes fc-pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );
}

const iconBtnStyle = {
  background: 'none', border: 'none', cursor: 'pointer', padding: 6,
  display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8,
};