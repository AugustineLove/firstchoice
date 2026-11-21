import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Empty, card, fmt, h3, useGet } from './ui';

const Stars = ({ n }) => <span style={{ color: '#f59e0b' }}>{'★'.repeat(n)}<span style={{ color: '#e5e7eb' }}>{'★'.repeat(5 - n)}</span></span>;

export function Reviews({ authFetch }) {
  const [tab, setTab] = useState('store');
  const { data: d, loading, error } = useGet(authFetch, '/vendors/me/reviews');

  if (loading) return <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />;
  if (error) return <div style={{ ...card, color: '#dc2626' }}>{error}</div>;

  const { summary: s, productSummary: ps } = d;
  const list = tab === 'store' ? d.vendorRatings : d.productReviews;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="vd-two">
        <div style={{ ...card, display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1 }}>{s.average.toFixed(1)}</div>
            <Stars n={Math.round(s.average)} />
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{s.count} store ratings</div>
          </div>
          <div style={{ flex: 1 }}>
            {[5, 4, 3, 2, 1].map(n => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, margin: '3px 0' }}>
                <span style={{ width: 10 }}>{n}</span>
                <div style={{ flex: 1, height: 8, background: '#f3f4f6', borderRadius: 4 }}>
                  <div style={{ height: 8, borderRadius: 4, background: '#f59e0b', width: `${s.count ? (s.distribution[n] / s.count) * 100 : 0}%` }} />
                </div>
                <span style={{ width: 24, textAlign: 'right', color: '#6b7280' }}>{s.distribution[n]}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ ...card, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>Product reviews</div>
          <div style={{ fontSize: 34, fontWeight: 900 }}>{ps.average.toFixed(1)} <span style={{ fontSize: 14, color: '#9ca3af', fontWeight: 600 }}>/ 5 · {ps.count} reviews</span></div>
        </div>
      </div>

      <div style={card}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {[['store', 'Store ratings'], ['products', 'Product reviews']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{ padding: '7px 14px', borderRadius: 50, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', background: tab === id ? '#16a34a' : '#f3f4f6', color: tab === id ? '#fff' : '#6b7280' }}>{label}</button>
          ))}
        </div>
        {!list.length ? <Empty text="No reviews yet" /> : list.map(r => (
          <div key={r.id} style={{ padding: '12px 0', borderTop: '1px solid #f5f5f5', display: 'flex', gap: 12 }}>
            {tab === 'products' && r.product?.images?.[0] && <img src={r.product.images[0]} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, gap: 8 }}>
                <b>{r.customer?.name || 'Customer'}{tab === 'products' && <span style={{ fontWeight: 500, color: '#6b7280' }}> on {r.product?.name}</span>}</b>
                <Stars n={r.rating} />
              </div>
              {r.comment && <div style={{ fontSize: 13, color: '#374151', marginTop: 3 }}>{r.comment}</div>}
              {r.images?.length > 0 && <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>{r.images.map(u => <img key={u} src={u} alt="" style={{ width: 52, height: 52, borderRadius: 6, objectFit: 'cover' }} />)}</div>}
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>{fmt(r.createdAt)}</div>
            </div>
          </div>
        ))}
        {tab === 'store' && s.count > list.length && <div style={{ fontSize: 12, color: '#9ca3af', paddingTop: 8 }}>Showing latest {list.length} of {s.count}</div>}
      </div>
    </div>
  );
}