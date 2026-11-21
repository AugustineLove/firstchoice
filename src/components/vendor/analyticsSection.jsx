import { useState } from 'react';
import { BarChart3, CheckCircle, Loader2, Repeat, ShoppingBag, XCircle } from 'lucide-react';
import { Bars, Badge, Empty, Stat, card, h3, inputS, money, useGet } from './ui';

const Meter = ({ label, value, total, right, color }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span>{label}</span><b>{right}</b></div>
    <div style={{ height: 8, background: '#f3f4f6', borderRadius: 4 }}>
      <div style={{ height: 8, width: `${total ? (value / total) * 100 : 0}%`, background: color, borderRadius: 4 }} />
    </div>
  </div>
);

export function Analytics({ authFetch }) {
  const [days, setDays] = useState(30);
  const { data: d, loading, error } = useGet(authFetch, `/vendors/me/analytics?days=${days}`);
  console.log('analytics data', d, loading, error);
  if (loading && !d) return <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />;
  if (error) return <div style={{ ...card, color: '#dc2626' }}>{error}</div>;
  const s = d.summary;
  const daily = d.daily.map(x => ({ label: x.date.slice(8) + '/' + x.date.slice(5, 7), value: Math.round(x.sales) }));
  const hours = d.hours.map((v, h) => ({ label: `${h}h`, value: v }));
  const peak = d.hours.indexOf(Math.max(...d.hours));
  const catTotal = d.categories.reduce((a, c) => a + c.revenue, 0);
  const pay = d.payments;
  const payTotal = pay.CASH.orders + pay.MOMO.orders;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, opacity: loading ? 0.6 : 1 }}>
      <select value={days} onChange={e => setDays(+e.target.value)} style={{ ...inputS, width: 170 }}>
        <option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option><option value={365}>Last 12 months</option>
      </select>

      <div className="vd-grid">
        <Stat icon={<BarChart3 size={18} />} label="Sales (delivered)" value={money(s.sales)} sub="Excludes delivery fees" color="#10b981" />
        <Stat icon={<ShoppingBag size={18} />} label="Orders" value={s.orders} sub={`${s.delivered} delivered`} color="#8b5cf6" />
        <Stat icon={<CheckCircle size={18} />} label="Avg order value" value={money(s.avgOrderValue)} color="#3b82f6" />
        <Stat icon={<XCircle size={18} />} label="Cancel rate" value={`${s.cancelRate}%`} sub={`${s.cancelled} cancelled`} color="#dc2626" />
        <Stat icon={<Repeat size={18} />} label="Repeat customers" value={`${s.repeatRate}%`} sub={`${s.repeatCustomers} of ${s.customers}`} color="#f59e0b" />
      </div>

      <div className="vd-two">
        <div style={card}><h3 style={h3}>Daily sales (GHS)</h3><Bars data={daily} /></div>
        <div style={card}>
          <h3 style={h3}>Busiest hours {s.orders > 0 && <span style={{ fontWeight: 600, color: '#9ca3af' }}>· peak {peak}:00</span>}</h3>
          <Bars data={hours} color="#8b5cf6" />
        </div>
      </div>

      <div className="vd-two">
        <div style={card}>
          <h3 style={h3}>Top products</h3>
          {d.topProducts.length ? d.topProducts.map((p, i) => (
            <div key={p.productId} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, gap: 8 }}>
              <span>{i + 1}. {p.name}</span><span style={{ whiteSpace: 'nowrap' }}><b>{p.qty} sold</b> · {money(p.revenue)}</span>
            </div>
          )) : <Empty text="No delivered orders in this period" />}
        </div>
        <div style={card}>
          <h3 style={h3}>Sales by category</h3>
          {d.categories.length ? d.categories.map(c => <Meter key={c.category} label={c.category} value={c.revenue} total={catTotal} right={money(c.revenue)} color="#16a34a" />) : <Empty text="No data" />}
        </div>
      </div>

      <div className="vd-two">
        <div style={card}>
          <h3 style={h3}>Payment methods</h3>
          <Meter label="Cash" value={pay.CASH.orders} total={payTotal} right={`${pay.CASH.orders} orders · ${money(pay.CASH.sales)}`} color="#f59e0b" />
          <Meter label="MoMo" value={pay.MOMO.orders} total={payTotal} right={`${pay.MOMO.orders} orders · ${money(pay.MOMO.sales)}`} color="#16a34a" />
        </div>
        <div style={card}>
          <h3 style={h3}>Orders by status</h3>
          {Object.keys(d.statuses).length ? Object.entries(d.statuses).map(([st, n]) => (
            <div key={st} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}><Badge status={st} /><b>{n}</b></div>
          )) : <Empty text="No orders" />}
        </div>
      </div>
    </div>
  );
}