'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Clock, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';
import ProductModal from '../public/ProductModal';

const TYPE_STYLE = {
  food:        { emoji: '🍛', a: '#10B981', b: '#34D399' },
  grocery:     { emoji: '🛒', a: '#10B981', b: '#34D399' },
  pharmacy:    { emoji: '💊', a: '#3B82F6', b: '#60A5FA' },
  boutique:    { emoji: '👗', a: '#EC4899', b: '#F472B6' },
  electronics: { emoji: '📱', a: '#6366F1', b: '#818CF8' },
};

export default function VendorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const { theme } = useTheme();
  const { totalItems, total } = useCart();

  const [vendor, setVendor]     = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [activeProduct, setActiveProduct] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [vRes, pRes] = await Promise.all([
        authFetch(`/vendors/${id}`),
        authFetch(`/products/vendor/${id}`),
      ]);
      const [vJson, pJson] = await Promise.all([vRes.json(), pRes.json()]);
      if (vJson.success) setVendor(vJson.data);
      if (pJson.success) setProducts(pJson.data.products ?? pJson.data);
    } catch {
      setError('Could not load this vendor.');
    }
    setLoading(false);
  }, [authFetch, id]);

  useEffect(() => { load(); }, [load]);

  const style = TYPE_STYLE[vendor?.businessType?.toLowerCase()] || { emoji: '🏪', a: '#10B981', b: '#34D399' };

  return (
    <div style={{ minHeight: '100vh', background: '#f8faf8', fontFamily: "'DM Sans', system-ui, sans-serif", paddingBottom: totalItems ? 96 : 32 }}>

      {/* ── HERO ── */}
      <div style={{ height: 200, position: 'relative', background: vendor?.logo ? `url(${vendor.logo}) center/cover` : `linear-gradient(135deg, ${style.a}, ${style.b})` }}>
        <button onClick={() => navigate(-1)} style={{
          position: 'absolute', top: 16, left: 16, width: 36, height: 36, borderRadius: '50%',
          background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}><ArrowLeft size={18} color="#0f1117" /></button>
        {!vendor?.logo && !loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52 }}>{style.emoji}</div>
        )}
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px' }}>

        {/* ── VENDOR INFO ── */}
        {loading ? (
          <div style={{ padding: '18px 0' }}>
            <div style={{ height: 22, width: 220, background: '#f3f4f6', borderRadius: 6 }} />
          </div>
        ) : error ? (
          <p style={{ color: '#dc2626', padding: '18px 0' }}>{error}</p>
        ) : vendor && (
          <div style={{ padding: '18px 0', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f1117', margin: 0 }}>{vendor.businessName}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fef3c7', padding: '5px 10px', borderRadius: 50, flexShrink: 0 }}>
                <Star size={14} fill="#f59e0b" color="#f59e0b" />
                <span style={{ fontSize: 13, fontWeight: 800, color: '#0f1117' }}>{(vendor.rating ?? 0).toFixed(1)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: theme.green, background: `${theme.green}18`, padding: '4px 10px', borderRadius: 50 }}>
                {vendor.businessType}
              </span>
              {vendor.address && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#6b7280' }}>
                  <MapPin size={13} />{vendor.address}
                </span>
              )}
              {vendor.openingHours && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#6b7280' }}>
                  <Clock size={13} />{vendor.openingHours}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── MENU ── */}
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f1117', margin: '20px 0 14px' }}>Menu</h2>

        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>No products available</p>
        )}

        {!loading && products.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {products.map((p) => (
              <ProductCard key={p.id} product={p} onClick={() => setActiveProduct(p)} />
            ))}
          </div>
        )}
      </div>

      {activeProduct && (
        <ProductModal product={activeProduct} onClose={() => setActiveProduct(null)} />
      )}

      {/* ── CART BAR ── */}
      {totalItems > 0 && (
        <div onClick={() => navigate('/cart')} style={{
          position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 20, width: 'min(560px, calc(100% - 32px))',
          background: theme.green, borderRadius: 16, height: 58, display: 'flex', alignItems: 'center', padding: '0 20px',
          boxShadow: `0 8px 20px ${theme.green}4d`, cursor: 'pointer',
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 900,
          }}>{totalItems}</div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginLeft: 12 }}>View Cart</span>
          <span style={{ flex: 1 }} />
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 15 }}>GHS {total.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, onClick }) {
  const emoji = { food: '🍛', grocery: '🛒', pharmacy: '💊', boutique: '👗', electronics: '📱', drinks: '🥤' }[product.category?.toLowerCase()] || '📦';
  return (
    <div onClick={onClick} style={{ background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0', overflow: 'hidden', cursor: 'pointer' }}>
      <div style={{
        height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34,
        background: product.images?.[0] ? `url(${product.images[0]}) center/cover` : '#ecfdf5',
      }}>
        {!product.images?.[0] && emoji}
      </div>
      <div style={{ padding: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f1117', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</div>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#10b981', marginTop: 4 }}>
          {product.variantGroups?.some(g => g.required) ? 'from ' : ''}GHS {product.price?.toFixed(2)}
        </div>
      </div>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
      <div style={{ height: 110, background: '#f3f4f6' }} />
      <div style={{ padding: 10 }}>
        <div style={{ height: 12, width: '80%', background: '#f3f4f6', borderRadius: 6 }} />
        <div style={{ height: 12, width: '40%', background: '#f3f4f6', borderRadius: 6, marginTop: 8 }} />
      </div>
    </div>
  );
}