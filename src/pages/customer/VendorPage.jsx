'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Clock, Loader2, Send, CheckCircle2, Package } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const TYPE_STYLE = {
  food:        { emoji: '🍛', a: '#10B981', b: '#34D399' },
  grocery:     { emoji: '🛒', a: '#10B981', b: '#34D399' },
  pharmacy:    { emoji: '💊', a: '#3B82F6', b: '#60A5FA' },
  boutique:    { emoji: '👗', a: '#EC4899', b: '#F472B6' },
  electronics: { emoji: '📱', a: '#6366F1', b: '#818CF8' },
};

// NOTE ON THE FLOW BELOW: this replaces the old add-to-cart-per-product flow.
// Products are shown for browsing/reference only — tapping one drops a line
// into the order note as a shortcut. The actual order is a single free-text
// request, submitted to POST /orders. Adjust the endpoint/payload shape to
// match whatever the backend actually expects.

export default function VendorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const { theme } = useTheme();

  const [vendor, setVendor]     = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

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

  function addProductToNote(product) {
    setNote((prev) => {
      const line = `1x ${product.name} (GHS ${product.price?.toFixed(2)})`;
      if (!prev.trim()) return line;
      return `${prev.trim()}\n${line}`;
    });
  }

  async function submitOrder() {
    if (!note.trim() || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await authFetch('/orders', {
        method: 'POST',
        body: JSON.stringify({
          vendorId: id,
          note: note.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSubmitted(true);
        setNote('');
      } else {
        setSubmitError(json.message || 'Could not submit your order.');
      }
    } catch {
      setSubmitError('Could not reach the server.');
    }
    setSubmitting(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8faf8', fontFamily: "'DM Sans', system-ui, sans-serif", paddingBottom: 40 }}>

      {/* ── PROFILE HEADER ── */}
      <div style={{ height: 190, position: 'relative', background: vendor?.logo ? `url(${vendor.logo}) center/cover` : `linear-gradient(135deg, ${style.a}, ${style.b})` }}>
        <button onClick={() => navigate(-1)} style={{
          position: 'absolute', top: 16, left: 16, width: 36, height: 36, borderRadius: '50%',
          background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}><ArrowLeft size={18} color="#0f1117" /></button>
        {!vendor?.logo && !loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52 }}>{style.emoji}</div>
        )}
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 20px' }}>

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
            {vendor.description && (
              <p style={{ fontSize: 13, color: '#6b7280', marginTop: 10, lineHeight: 1.5 }}>{vendor.description}</p>
            )}
          </div>
        )}

        {/* ── PRODUCTS (reference only — tap to drop into the order note) ── */}
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f1117', margin: '20px 0 6px' }}>Available Products</h2>
        <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 14px' }}>Tap an item to add it to your order note below</p>

        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>No products available</p>
        )}

        {!loading && products.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 8 }}>
            {products.map((p) => (
              <ProductCard key={p.id} product={p} onClick={() => addProductToNote(p)} />
            ))}
          </div>
        )}

        {/* ── ORDER NOTE + SUBMIT ── */}
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f1117', margin: '28px 0 10px' }}>What would you like to order?</h2>

        {submitted ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, background: '#ecfdf5', border: `1px solid ${theme.green}`,
            borderRadius: 14, padding: '16px 18px', marginBottom: 20,
          }}>
            <CheckCircle2 size={22} color={theme.green} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#0f1117' }}>Order sent to {vendor?.businessName}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>They'll confirm the details and total shortly.</div>
            </div>
          </div>
        ) : (
          <>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={6}
              placeholder="List everything you'd like, e.g.&#10;2x Jollof rice (large)&#10;1x Bottled water&#10;No pepper please"
              style={{
                width: '100%', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16, fontFamily: 'inherit',
                fontSize: 14, lineHeight: 1.6, resize: 'vertical', boxSizing: 'border-box', color: '#0f1117',
              }}
            />
            {submitError && (
              <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 10, padding: '10px 14px', marginTop: 10, fontSize: 13 }}>
                {submitError}
              </div>
            )}
            <button
              onClick={submitOrder}
              disabled={!note.trim() || submitting}
              style={{
                width: '100%', height: 50, border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 14, fontFamily: 'inherit',
                background: note.trim() ? theme.green : '#d1d5db', color: '#fff', cursor: note.trim() ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14,
              }}
            >
              {submitting
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Submitting...</>
                : <><Send size={16} /> Submit Order</>}
            </button>
          </>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
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