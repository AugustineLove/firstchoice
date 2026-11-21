import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Package, Store, BarChart3, Star, LogOut, Menu, X,
  RefreshCw, Loader2, Search, Phone, MapPin, Bike, User, StickyNote, CheckCircle,
  XCircle, Clock, AlertTriangle, Save, Crosshair, ChevronLeft,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Products } from '../../components/vendor/productsSection';
import { Analytics } from '../../components/vendor/analyticsSection';
import { Reviews } from '../../components/vendor/reviewSection';
import { Customers } from '../../components/vendor/customersSection';
import { Orders } from '../../components/vendor/ordersSection';

/* ───────── CONFIG ───────── */
// NOTE: your Prisma OrderStatus enum has no PREPARING / READY_FOR_PICKUP yet. Add them (migration)
// or edit FLOW / STEPS below to match the enum.
export const FLOW = {
  PENDING:   ['ACCEPTED', 'Accept order'],
  ACCEPTED:  ['PREPARING', 'Start preparing'],
  PREPARING: ['READY_FOR_PICKUP', 'Mark ready for pickup'],
};
const ACTIVE = ['PENDING','ACCEPTED','PREPARING','READY_FOR_PICKUP','RIDER_ASSIGNED','PICKED_UP','IN_TRANSIT','ARRIVED'];
const STEPS  = ['PENDING','ACCEPTED','PREPARING','READY_FOR_PICKUP','RIDER_ASSIGNED','PICKED_UP','DELIVERED'];
export const TABS = [
  { id: 'ALL', label: 'All' },
  { id: 'NEW', label: 'New', match: ['PENDING'] },
  { id: 'ACTIVE', label: 'In progress', match: ACTIVE.filter(s => s !== 'PENDING') },
  { id: 'DELIVERED', label: 'Delivered', match: ['DELIVERED'] },
  { id: 'CANCELLED', label: 'Cancelled', match: ['CANCELLED'] },
];
const COLORS = {
  PENDING: ['#92400e','#fef3c7'], ACCEPTED: ['#065f46','#d1fae5'], PREPARING: ['#1e40af','#dbeafe'],
  READY_FOR_PICKUP: ['#0369a1','#e0f2fe'], RIDER_ASSIGNED: ['#5b21b6','#ede9fe'], PICKED_UP: ['#5b21b6','#ede9fe'],
  IN_TRANSIT: ['#5b21b6','#ede9fe'], ARRIVED: ['#5b21b6','#ede9fe'], DELIVERED: ['#065f46','#d1fae5'],
  CANCELLED: ['#991b1b','#fee2e2'], ACTIVE: ['#065f46','#d1fae5'], INACTIVE: ['#374151','#f3f4f6'],
};
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']; // keys 0-6 (JS getDay)
const TYPES = ['Food','Grocery','Pharmacy','Boutique','Electronics','Drinks','Other'];

/* ───────── HELPERS ───────── */
export const money = n => `GHS ${Number(n || 0).toFixed(2)}`;
const short = id => id?.slice(-8).toUpperCase();
const fmt = d => new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
export const dayKey = d => new Date(d).toISOString().slice(0, 10);
const arr = v => (Array.isArray(v) ? v : []);
export const card = { background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0', padding: 20 };
const h3 = { fontSize: 14, fontWeight: 800, color: '#0f1117', margin: '0 0 14px' };
export const inputS = { width: '100%', height: 40, padding: '0 12px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };

export function Badge({ status }) {
  const [c, bg] = COLORS[status] || ['#374151', '#f3f4f6'];
  return <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 50, background: bg, color: c, whiteSpace: 'nowrap' }}>{status?.replace(/_/g, ' ')}</span>;
}
export function Stat({ icon, label, value, sub, color }) {
  return (
    <div style={card}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: color + '18', color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 900, color: '#0f1117', letterSpacing: '-1px' }}>{value ?? '—'}</div>
      <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 600, marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}
export function Bars({ data, color = '#16a34a', fmtVal = v => v }) {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 150 }}>
      {data.map(d => (
        <div key={d.label} title={`${d.label}: ${fmtVal(d.value)}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 0 }}>
          <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{d.value ? fmtVal(d.value) : ''}</div>
          <div style={{ width: '100%', maxWidth: 34, height: `${(d.value / max) * 100}px`, minHeight: 3, background: d.value ? color : '#e5e7eb', borderRadius: 6 }} />
          <div style={{ fontSize: 10, color: '#9ca3af', whiteSpace: 'nowrap' }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}
export const Empty = ({ text }) => <div style={{ color: '#9ca3af', fontSize: 13, padding: '18px 0', textAlign: 'center' }}>{text}</div>;

/* ───────── OVERVIEW ───────── */
function Overview({ vendor, orders, stats, onOpen, act, go }) {
  const today = dayKey(new Date());
  const delivered = orders.filter(o => o.orderStatus === 'DELIVERED');
  const todays = orders.filter(o => dayKey(o.createdAt) === today);
  const todaySales = todays.filter(o => o.orderStatus === 'DELIVERED').reduce((s, o) => s + o.subtotal, 0);
  const actionable = orders.filter(o => FLOW[o.orderStatus]);
  const products = arr(vendor?.products);
  const low = products.filter(p => p.available && p.stock < 5);
  const week = [...Array(7)].map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const k = dayKey(d);
    return { label: d.toLocaleDateString('en-GB', { weekday: 'short' }), value: Math.round(delivered.filter(o => dayKey(o.createdAt) === k).reduce((s, o) => s + o.subtotal, 0)) };
  });
  const byStatus = ['PENDING','ACCEPTED','PREPARING','READY_FOR_PICKUP','RIDER_ASSIGNED','PICKED_UP','DELIVERED','CANCELLED']
    .map(s => ({ s, n: orders.filter(o => o.orderStatus === s).length })).filter(x => x.n);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {vendor?.status !== 'ACTIVE' && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '14px 18px', fontSize: 14, color: '#92400e', display: 'flex', gap: 10 }}>
          <AlertTriangle size={18} style={{ flexShrink: 0 }} /> Your store is {vendor?.status === 'PENDING' ? 'pending admin approval' : 'inactive'}. Customers can't order until it is ACTIVE.
        </div>
      )}
      <div className="vd-grid">
        <Stat icon={<ShoppingBag size={18} />} label="Orders today" value={todays.length} sub={`${stats?.totalOrders ?? orders.length} all time`} color="#8b5cf6" />
        <Stat icon={<Clock size={18} />} label="Needs action" value={actionable.length} sub={`${stats?.pendingOrders ?? 0} awaiting you`} color="#f59e0b" />
        <Stat icon={<BarChart3 size={18} />} label="Sales today" value={money(todaySales)} sub="Purchased" color="#10b981" />
        <Stat icon={<CheckCircle size={18} />} label="Completed" value={stats?.completedOrders ?? delivered.length} color="#16a34a" />
        <Stat icon={<Package size={18} />} label="Products" value={stats?.totalProducts ?? products.length} sub={`${low.length} low / out of stock`} color="#3b82f6" />
        <Stat icon={<Star size={18} />} label="Rating" value={Number(vendor?.rating || 0).toFixed(1)} sub="Store average" color="#ec4899" />
      </div>

      {actionable.length > 0 && (
        <div style={card}>
          <h3 style={h3}>🔔 Needs your action ({actionable.length})</h3>
          {actionable.map(o => (
            <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: '1px solid #f5f5f5', flexWrap: 'wrap' }}>
              <div onClick={() => onOpen(o)} style={{ flex: 1, minWidth: 180, cursor: 'pointer' }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{o.customer?.name} <span style={{ color: '#9ca3af', fontWeight: 600, fontSize: 12 }}>#{short(o.id)}</span></div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>{money(o.totalAmount)} · {o.items?.map(i => `${i.product?.name} ×${i.quantity}`).join(', ').slice(0, 60)}</div>
              </div>
              <Badge status={o.orderStatus} />
              <button style={btn('#16a34a')} onClick={() => act(o.id, FLOW[o.orderStatus][0])}>{FLOW[o.orderStatus][1]}</button>
              {o.orderStatus === 'PENDING' && <button style={btn('#dc2626', true)} onClick={() => window.confirm('Reject this order?') && act(o.id, 'CANCELLED')}>Reject</button>}
            </div>
          ))}
        </div>
      )}

      <div className="vd-two">
        <div style={card}><h3 style={h3}>Sales - last 7 days (GHS)</h3><Bars data={week} /></div>
        <div style={card}>
          <h3 style={h3}>Orders by status</h3>
          {byStatus.length ? byStatus.map(x => (
            <div key={x.s} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}><Badge status={x.s} /><b>{x.n}</b></div>
          )) : <Empty text="No orders yet" />}
        </div>
      </div>

      <div className="vd-two">
        <div style={card}>
          <h3 style={h3}>⚠️ Stock alerts</h3>
          {low.length ? low.slice(0, 8).map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
              <span>{p.name}</span><b style={{ color: p.stock === 0 ? '#dc2626' : '#f59e0b' }}>{p.stock === 0 ? 'Out of stock' : `${p.stock} left`}</b>
            </div>
          )) : <Empty text="All products well stocked" />}
          {low.length > 0 && <button style={{ ...btn('#16a34a', true), marginTop: 8 }} onClick={() => go('products')}>Manage products</button>}
        </div>
        <div style={card}>
          <h3 style={h3}>Recent orders</h3>
          {orders.slice(0, 6).map(o => (
            <div key={o.id} onClick={() => onOpen(o)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid #f5f5f5', cursor: 'pointer', gap: 8 }}>
              <div><div style={{ fontSize: 13, fontWeight: 700 }}>{o.customer?.name}</div><div style={{ fontSize: 11, color: '#9ca3af' }}>{fmt(o.createdAt)}</div></div>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: 13, fontWeight: 800, color: '#10b981' }}>{money(o.totalAmount)}</div><Badge status={o.orderStatus} /></div>
            </div>
          ))}
          {!orders.length && <Empty text="No orders yet" />}
        </div>
      </div>
    </div>
  );
}
const btn = (c, ghost) => ({ padding: '6px 14px', borderRadius: 8, border: `1px solid ${c}`, background: ghost ? '#fff' : c, color: ghost ? c : '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' });

function Row({ k, v }) {
  return v ? <div style={{ display: 'flex', gap: 10, padding: '4px 0', fontSize: 13 }}><span style={{ width: 96, color: '#9ca3af', flexShrink: 0 }}>{k}</span><span style={{ fontWeight: 600, color: '#0f1117', wordBreak: 'break-word' }}>{v}</span></div> : null;
}
function Drawer({ order: o, onClose, act, acting }) {
  if (!o) return null;
  const idx = STEPS.indexOf(o.orderStatus);
  const cancelled = o.orderStatus === 'CANCELLED';
  const sec = { ...card, padding: 16, marginBottom: 12 };
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 200 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(480px,100vw)', background: '#f8faf8', zIndex: 201, overflowY: 'auto', padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div><div style={{ fontSize: 18, fontWeight: 900 }}>Order #{short(o.id)}</div><div style={{ fontSize: 12, color: '#9ca3af' }}>{fmt(o.createdAt)}</div></div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Badge status={o.orderStatus} /><button onClick={onClose} style={{ border: 'none', background: '#f3f4f6', borderRadius: 8, padding: 6, cursor: 'pointer' }}><X size={16} /></button></div>
        </div>

        {!cancelled && <div style={sec}>
          <h3 style={h3}>Progress</h3>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '3px 0', fontSize: 13, fontWeight: i === idx ? 800 : 500, color: i <= idx ? '#16a34a' : '#9ca3af' }}>
              <span style={{ width: 18, height: 18, borderRadius: '50%', background: i <= idx ? '#16a34a' : '#e5e7eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>{i < idx ? '✓' : ''}</span>
              {s.replace(/_/g, ' ')}
            </div>
          ))}
        </div>}

        <div style={sec}>
          <h3 style={h3}><User size={13} /> Customer</h3>
          <Row k="Name" v={o.customer?.name} />
          <Row k="Phone" v={o.customer?.phone && <a href={`tel:${o.customer.phone}`} style={{ color: '#16a34a' }}>{o.customer.phone}</a>} />
          {(o.recipientName || o.recipientPhone) && <><Row k="Recipient" v={o.recipientName} /><Row k="Rec. phone" v={o.recipientPhone && <a href={`tel:${o.recipientPhone}`} style={{ color: '#16a34a' }}>{o.recipientPhone}</a>} /></>}
        </div>

        <div style={sec}>
          <h3 style={h3}><ShoppingBag size={13} /> Items ({o.items?.length})</h3>
          {o.items?.map(i => (
            <div key={i.id} style={{ padding: '8px 0', borderTop: '1px solid #f5f5f5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700 }}>
                <span>{i.product?.name} ×{i.quantity}</span><span>{money(i.unitPrice * i.quantity)}</span>
              </div>
              {arr(i.selectedVariants).map((v, k) => <div key={k} style={{ fontSize: 12, color: '#6b7280' }}>{v.groupName}: {v.variantName}{v.priceAdjustment ? ` (${v.priceAdjustment > 0 ? '+' : ''}${v.priceAdjustment})` : ''}</div>)}
              {arr(i.selectedAddons).map((a, k) => <div key={k} style={{ fontSize: 12, color: '#6b7280' }}>+ {a.addonName} ×{a.quantity ?? 1}{a.price ? ` · ${money(a.price)}` : ''}</div>)}
              {i.itemNotes && <div style={{ fontSize: 12, color: '#92400e', background: '#fffbeb', padding: '3px 8px', borderRadius: 6, marginTop: 4 }}>📝 {i.itemNotes}</div>}
            </div>
          ))}
          {o.notes && <div style={{ marginTop: 8, fontSize: 13, background: '#fffbeb', color: '#92400e', padding: 10, borderRadius: 8 }}><StickyNote size={12} /> {o.notes}</div>}
        </div>

        <div style={sec}>
          <h3 style={h3}><MapPin size={13} /> Delivery</h3>
          <Row k="Address" v={o.deliveryAddress} />
          {o.deliveryLatitude && <Row k="Map" v={<a target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${o.deliveryLatitude},${o.deliveryLongitude}`} style={{ color: '#16a34a' }}>Open in Google Maps</a>} />}
          <h3 style={{ ...h3, marginTop: 12 }}><Bike size={13} /> Rider</h3>
          {o.rider ? <><Row k="Name" v={o.rider.user?.name} /><Row k="Phone" v={o.rider.user?.phone && <a href={`tel:${o.rider.user.phone}`} style={{ color: '#16a34a' }}>{o.rider.user.phone}</a>} /></> : <div style={{ fontSize: 13, color: '#9ca3af' }}>No rider assigned yet</div>}
        </div>

        <div style={sec}>
          <h3 style={h3}>Payment</h3>
          <Row k="Method" v={o.paymentMethod} /><Row k="Status" v={o.orderStatus === 'DELIVERED'? 'PAID' : o.paymentStatus} />
          <div style={{ borderTop: '1px dashed #e5e7eb', margin: '8px 0' }} />
          <Row k="Subtotal" v={money(o.subtotal)} />
          <Row k="Delivery fee" v={money(o.deliveryFee)} />
          {o.deliveryDiscount > 0 && <Row k="Discount" v={`- ${money(o.deliveryDiscount)}`} />}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900, marginTop: 6 }}><span>Total</span><span style={{ color: '#16a34a' }}>{money(o.totalAmount)}</span></div>
        </div>

        {FLOW[o.orderStatus] && <button disabled={acting === o.id} onClick={() => act(o.id, FLOW[o.orderStatus][0])} style={{ ...btn('#16a34a'), width: '100%', padding: 12, fontSize: 14 }}>{acting === o.id ? 'Updating…' : FLOW[o.orderStatus][1]}</button>}
        {['PENDING', 'ACCEPTED'].includes(o.orderStatus) && <button onClick={() => window.confirm('Cancel this order?') && act(o.id, 'CANCELLED')} style={{ ...btn('#dc2626', true), width: '100%', padding: 12, fontSize: 14, marginTop: 8 }}>Cancel order</button>}
      </div>
    </>
  );
}

/* ───────── PROFILE (with weekly hours + GPS) ───────── */
function Profile({ vendor, authFetch, onUpdate, toast }) {
  const [f, setF] = useState({ businessName: '', businessType: 'Food', address: '', phone: '', logo: '', latitude: '', longitude: '' });
  const [hours, setHours] = useState({});
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!vendor) return;
    setF({ businessName: vendor.businessName || '', businessType: vendor.businessType || 'Food', address: vendor.address || '', phone: vendor.phone || '', logo: vendor.logo || '', latitude: vendor.latitude || '', longitude: vendor.longitude || '' });
    const oh = vendor.openingHours && typeof vendor.openingHours === 'object' ? vendor.openingHours : {};
    setHours(Object.fromEntries(DAYS.map((_, d) => { const r = oh[d]?.[0]; return [d, { open: !!r, start: r?.start || '08:00', end: r?.end || '20:00' }]; })));
  }, [vendor]);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const setH = (d, k, v) => setHours(p => ({ ...p, [d]: { ...p[d], [k]: v } }));
  const gps = () => navigator.geolocation?.getCurrentPosition(p => { set('latitude', String(p.coords.latitude)); set('longitude', String(p.coords.longitude)); }, () => toast('Could not get location'));

  async function save() {
    const openingHours = {};
    for (const [d, h] of Object.entries(hours)) {
      if (!h.open) continue;
      if (h.start >= h.end) return toast(`${DAYS[d]}: opening must be before closing`);
      openingHours[d] = [{ start: h.start, end: h.end }];
    }
    setSaving(true);
    try {
      const body = { ...f, openingHours };
      if (!f.latitude) delete body.latitude;
      if (!f.longitude) delete body.longitude;
      const res = await authFetch('/vendors/me/profile', { method: 'PATCH', body: JSON.stringify(body) });
      const j = await res.json();
      if (j.success) { onUpdate({ ...vendor, ...j.data }); toast('Profile saved ✓'); } else toast(j.message || 'Save failed');
    } catch { toast('Network error'); }
    setSaving(false);
  }
  const L = ({ t, children }) => <div style={{ marginBottom: 12 }}><label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 5 }}>{t}</label>{children}</div>;
  return (
    <div className="vd-two">
      <div style={card}>
        <h3 style={h3}>Business info</h3>
        <div style={{ display: 'flex', gap: 14, marginBottom: 14, alignItems: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 14, background: '#f9fafb', border: '1.5px solid #e5e7eb', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {f.logo ? <img src={f.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => (e.target.style.display = 'none')} /> : <Store size={24} color="#d1d5db" />}
          </div>
          <input style={inputS} placeholder="Logo URL" value={f.logo} onChange={e => set('logo', e.target.value)} />
        </div>
        <L t="Business name"><input style={inputS} value={f.businessName} onChange={e => set('businessName', e.target.value)} /></L>
        <L t="Business type"><select style={inputS} value={f.businessType} onChange={e => set('businessType', e.target.value)}>{TYPES.map(t => <option key={t}>{t}</option>)}</select></L>
        <L t="Phone"><input style={inputS} value={f.phone} onChange={e => set('phone', e.target.value)} /></L>
        <L t="Address"><input style={inputS} value={f.address} onChange={e => set('address', e.target.value)} /></L>
        <div style={{ display: 'flex', gap: 8 }}>
          <L t="Latitude"><input style={inputS} value={f.latitude} onChange={e => set('latitude', e.target.value)} /></L>
          <L t="Longitude"><input style={inputS} value={f.longitude} onChange={e => set('longitude', e.target.value)} /></L>
        </div>
        <button onClick={gps} style={btn('#16a34a', true)}><Crosshair size={12} /> Use my current location</button>
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>Accurate coordinates let riders and delivery fees work correctly.</div>
      </div>
      <div style={card}>
        <h3 style={h3}>Opening hours</h3>
        {DAYS.map((name, d) => hours[d] && (
          <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 13 }}>
            <input type="checkbox" checked={hours[d].open} onChange={e => setH(d, 'open', e.target.checked)} />
            <span style={{ width: 80, fontWeight: 600 }}>{name}</span>
            {hours[d].open ? <>
              <input type="time" value={hours[d].start} onChange={e => setH(d, 'start', e.target.value)} style={{ ...inputS, width: 110, height: 34 }} /> –
              <input type="time" value={hours[d].end} onChange={e => setH(d, 'end', e.target.value)} style={{ ...inputS, width: 110, height: 34 }} />
            </> : <span style={{ color: '#9ca3af' }}>Closed</span>}
          </div>
        ))}
        <button onClick={save} disabled={saving} style={{ ...btn('#16a34a'), padding: '12px 28px', fontSize: 14, marginTop: 16 }}>
          {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />} {saving ? 'Saving…' : 'Save profile'}
        </button>
      </div>
    </div>
  );
}

/* ───────── SHELL ───────── */
export default function VendorDashboardPro() {
  const { user, logout, authFetch, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [section, setSection] = useState('overview');
  const [side, setSide] = useState(true);
  const [vendor, setVendor] = useState(null);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selId, setSelId] = useState(null);
  const [acting, setActing] = useState(null);
  const [msg, setMsg] = useState('');

  const toast = m => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  useEffect(() => { if (!authLoading && (!user || !['VENDOR', 'ADMIN'].includes(user.role))) navigate('/login'); }, [user, authLoading, navigate]);

  const loadAll = useCallback(async (silent) => {
    if (!silent) setLoading(true);
    try {
      const [p, o, s] = await Promise.all([authFetch('/vendors/me/profile'), authFetch('/vendors/me/orders'), authFetch('/vendors/me/stats')]);
      const [pj, oj, sj] = await Promise.all([p.json(), o.json(), s.json()]);
      if (pj.success) setVendor(pj.data);
      if (oj.success) setOrders(oj.data);
      if (sj.success) setStats(sj.data);
    } catch {}
    setLoading(false);
  }, [authFetch]);

  useEffect(() => { if (user) loadAll(); }, [user, loadAll]);
//   useEffect(() => { const t = setInterval(() => loadAll(true), 30000); return () => clearInterval(t); }, [loadAll]); // live-ish refresh

  async function act(id, status) {
    setActing(id);
    try {
      const r = await authFetch(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.success !== false) { toast(`Order ${status.replace(/_/g, ' ').toLowerCase()}`); await loadAll(true); }
      else toast(j.message || 'Could not update order');
    } catch { toast('Network error'); }
    setActing(null);
  }

  if (authLoading || !user) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /></div>;

  const pending = orders.filter(o => o.orderStatus === 'PENDING').length;
  const selected = orders.find(o => o.id === selId);
  const NAV = [
    ['overview', 'Overview', <LayoutDashboard size={18} />], ['orders', 'Orders', <ShoppingBag size={18} />, pending],
    ['products', 'Products', <Package size={18} />], ['analytics', 'Analytics', <BarChart3 size={18} />],
    ['reviews', 'Reviews', <Star size={18} />], ['customers', 'Customers', <Users size={18} />],  ['profile', 'Store profile', <Store size={18} />],
  ];
  const green = theme?.green || '#16a34a';
  const titles = Object.fromEntries(NAV.map(n => [n[0], n[1]]));

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8faf8', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <aside style={{ width: side ? 230 : 64, background: '#fff', borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', transition: 'width .25s', position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', flexShrink: 0, zIndex: 100 }}>
        <div style={{ padding: 16, borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {side && <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: green, color: '#fff', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{vendor?.businessName?.[0]?.toUpperCase() || 'V'}</div>
            <div style={{ minWidth: 0 }}><div style={{ fontWeight: 900, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{vendor?.businessName || 'Vendor'}</div>{vendor && <Badge status={vendor.status} />}</div>
          </div>}
          <button onClick={() => setSide(!side)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>{side ? <ChevronLeft size={16} /> : <Menu size={16} />}</button>
        </div>
        <nav style={{ flex: 1, padding: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(([id, label, icon, badge]) => (
            <button key={id} onClick={() => setSection(id)} title={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: side ? '9px 12px' : '9px 0', justifyContent: side ? 'flex-start' : 'center', borderRadius: 9, border: 'none', cursor: 'pointer', background: section === id ? green + '15' : 'transparent', color: section === id ? green : '#6b7280', fontWeight: 700, fontSize: 13, fontFamily: 'inherit', position: 'relative' }}>
              {icon}{side && label}
              {badge > 0 && <span style={{ marginLeft: 'auto', background: '#dc2626', color: '#fff', fontSize: 10, borderRadius: 50, padding: '1px 6px' }}>{badge}</span>}
            </button>
          ))}
        </nav>
        <button onClick={() => { logout(); navigate('/login'); }} style={{ margin: 10, padding: 9, border: 'none', background: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit', fontSize: 13 }}><LogOut size={16} />{side && 'Logout'}</button>
      </aside>

      <main style={{ flex: 1, padding: '26px 24px', minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div><h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>{titles[section]}</h2><p style={{ margin: '3px 0 0', fontSize: 13, color: '#6b7280' }}>Hello {user.name?.split(' ')[0]} 👋 </p></div>
          {/* <button onClick={() => loadAll()} style={btn('#6b7280', true)}><RefreshCw size={12} /> Refresh</button> */}
        </div>
        {loading ? <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} /> : <>
          {section === 'overview' && <Overview vendor={vendor} orders={orders} stats={stats} onOpen={o => setSelId(o.id)} act={act} go={setSection} />}
          {section === 'orders' && <Orders orders={orders} onOpen={o => setSelId(o.id)} act={act} acting={acting} />}
          {section === 'products' && <Products authFetch={authFetch} theme={theme} />}
          {section === 'analytics' && <Analytics authFetch={authFetch} />}
          {section === 'reviews' && <Reviews vendor={vendor} authFetch={authFetch} />}
          {section === 'customers' && <Customers authFetch={authFetch} />}
          {section === 'profile' && <Profile vendor={vendor} authFetch={authFetch} onUpdate={setVendor} toast={toast} />}
        </>}
      </main>

      <Drawer order={selected} onClose={() => setSelId(null)} act={act} acting={acting} />
      {msg && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#0f1117', color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 13, zIndex: 300 }}>{msg}</div>}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .vd-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(190px,1fr)); gap:14px; }
        .vd-two  { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        @media (max-width:820px) { .vd-two { grid-template-columns:1fr; } main { padding:16px 12px !important; } }
      `}</style>
    </div>
  );
}