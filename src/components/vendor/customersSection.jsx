import { useState } from 'react';
import { Loader2, Phone, Search } from 'lucide-react';
import { Empty, card, fmt, inputS, money, useGet } from './ui';

export function Customers({ authFetch }) {
  const { data, loading, error } = useGet(authFetch, '/vendors/me/customers');
  console.log('customers data', data, loading, error);
  const [q, setQ] = useState('');

  if (loading) return <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />;
  if (error) return <div style={{ ...card, color: '#dc2626' }}>{error}</div>;

  const list = data.filter(c => !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q));
  const th = { padding: '10px 14px', textAlign: 'left', fontSize: 11, color: '#6b7280', textTransform: 'uppercase' };
  const td = { padding: '12px 14px' };

  return (
    <div>
      <div style={{ position: 'relative', maxWidth: 340, marginBottom: 14 }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: 13, color: '#9ca3af' }} />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name or phone…" style={{ ...inputS, paddingLeft: 34 }} />
      </div>
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        {!list.length ? <Empty text="No customers yet" /> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ borderBottom: '2px solid #f3f4f6' }}>{['Customer', 'Orders', 'Total spent', 'Last order', ''].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>{list.map(c => (
                <tr key={c.customerId} style={{ borderBottom: '1px solid #f9fafb' }}>
                  <td style={td}><b>{c.name}</b><div style={{ fontSize: 12, color: '#9ca3af' }}>{c.phone}</div></td>
                  <td style={td}>{c.orders}{c.orders > 1 && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, background: '#fef3c7', color: '#92400e', padding: '2px 7px', borderRadius: 50 }}>REGULAR</span>}</td>
                  <td style={{ ...td, fontWeight: 800, color: '#10b981' }}>{money(c.totalSpent)}</td>
                  <td style={{ ...td, color: '#6b7280' }}>{fmt(c.lastOrderAt)}</td>
                  <td style={td}>{c.phone && <a href={`tel:${c.phone}`} style={{ color: '#16a34a' }}><Phone size={14} /></a>}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>Top 100 customers by spend (cancelled orders excluded).</div>
    </div>
  );
}