'use client';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Store, Bike, ShoppingBag, Truck,
  ClipboardList, BarChart2, LogOut, Menu, X, ChevronDown,
  RefreshCw, CheckCircle, XCircle, Clock, AlertCircle,
  TrendingUp, Package, Loader2, Search, Filter, Eye,
  UserCheck, UserX, ChevronLeft, ChevronRight, Plus, Settings,
  ImagePlus, Trash2,
  Megaphone,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { uploadToCloudinary, validateImageFile } from '../../utils/cloudinary';
import { BroadcastSection } from '../../components/admin/NavComponents';
import { OperatingHoursCard } from '../../components/admin/OperatingHours';
import RiderInsights, { ChartTooltip, PIE_COLORS, SectionCard } from '../../components/RiderInsights';
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart,
  Line,
} from 'recharts';
import { ReportsSection } from '../../components/admin/ReportsSection';
import { OrdersSection } from '../../components/admin/OrdersSection';
import { DeliveriesSection } from '../../components/admin/DeliveriesSection';
import { SettingsSection } from '../../components/admin/SettingsSection';
/* ═══════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════ */
export function Badge({ text, color, bg }) {
  return (
    <span style={{
      fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:50,
      background: bg, color: color, whiteSpace:'nowrap',
    }}>{text}</span>
  );
}

export const STATUS_STYLES = {
  ACTIVE:          { color:'#065f46', bg:'#d1fae5' },
  PENDING:         { color:'#92400e', bg:'#fef3c7' },
  SUSPENDED:       { color:'#991b1b', bg:'#fee2e2' },
  INACTIVE:        { color:'#374151', bg:'#f3f4f6' },
  ONLINE:          { color:'#065f46', bg:'#d1fae5' },
  OFFLINE:         { color:'#374151', bg:'#f3f4f6' },
  BUSY:            { color:'#1e40af', bg:'#dbeafe' },
  DELIVERED:       { color:'#065f46', bg:'#d1fae5' },
  CANCELLED:       { color:'#991b1b', bg:'#fee2e2' },
  PICKED_UP:       { color:'#1e40af', bg:'#dbeafe' },
  PREPARING:       { color:'#92400e', bg:'#fef3c7' },
  RIDER_ASSIGNED:  { color:'#5b21b6', bg:'#ede9fe' },
  READY_FOR_PICKUP:{ color:'#0369a1', bg:'#e0f2fe' },
  ACCEPTED:        { color:'#065f46', bg:'#d1fae5' },
  IN_TRANSIT:      { color:'#1e40af', bg:'#dbeafe' },
  CUSTOMER:        { color:'#1e40af', bg:'#dbeafe' },
  VENDOR:          { color:'#065f46', bg:'#d1fae5' },
  RIDER:           { color:'#92400e', bg:'#fef3c7' },
  ADMIN:           { color:'#5b21b6', bg:'#ede9fe' },
  PICKUP: { color:'#374151', bg:'#f3f4f6' },
ERRAND: { color:'#7c3aed', bg:'#ede9fe' },
};

export function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || { color:'#374151', bg:'#f3f4f6' };
  return <Badge text={status?.replace(/_/g,' ')} color={s.color} bg={s.bg} />;
}

export function StatCard({ icon, label, value, sub, color, loading }) {
  return (
    <div style={{
      background:'#fff', borderRadius:14, padding:'22px 24px',
      border:'1px solid #f0f0f0', boxShadow:'0 2px 12px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ width:42, height:42, borderRadius:10, background: color + '18', display:'flex', alignItems:'center', justifyContent:'center', color }}>
          {icon}
        </div>
      </div>
      {loading
        ? <div style={{ height:32, width:'60%', borderRadius:8, background:'#f3f4f6', animation:'pulse 1.5s infinite' }}/>
        : <div style={{ fontSize:28, fontWeight:900, color:'#0f1117', letterSpacing:'-1px' }}>{value ?? '—'}</div>
      }
      <div style={{ fontSize:13, color:'#6b7280', marginTop:4, fontWeight:600 }}>{label}</div>
      {sub && <div style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>{sub}</div>}
    </div>
  );
}

export function Table({ columns, data, loading, emptyMsg = 'No records found' }) {
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:60, color:'#9ca3af', gap:10 }}>
      <Loader2 size={20} style={{ animation:'spin 1s linear infinite' }}/> Loading...
    </div>
  );
  if (!data?.length) return (
    <div style={{ textAlign:'center', padding:60, color:'#9ca3af', fontSize:14 }}>{emptyMsg}</div>
  );
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
        <thead>
          <tr style={{ borderBottom:'2px solid #f3f4f6' }}>
            {columns.map(c => (
              <th key={c.key} style={{ padding:'10px 16px', textAlign:'left', fontWeight:700, color:'#6b7280', fontSize:11, textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} style={{ borderBottom:'1px solid #f9fafb', transition:'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background='#fafafa'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              {columns.map(c => (
                <td key={c.key} style={{ padding:'13px 16px', color:'#374151', verticalAlign:'middle' }}>
                  {c.render ? c.render(row) : row[c.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'16px 0' }}>
      <button onClick={() => onChange(page-1)} disabled={page===1}
        style={{ width:32, height:32, borderRadius:8, border:'1px solid #e5e7eb', background:'#fff', cursor: page===1?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', opacity: page===1?0.4:1 }}>
        <ChevronLeft size={14}/>
      </button>
      <span style={{ fontSize:13, color:'#6b7280', padding:'0 8px' }}>Page {page} of {totalPages}</span>
      <button onClick={() => onChange(page+1)} disabled={page===totalPages}
        style={{ width:32, height:32, borderRadius:8, border:'1px solid #e5e7eb', background:'#fff', cursor: page===totalPages?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', opacity: page===totalPages?0.4:1 }}>
        <ChevronRight size={14}/>
      </button>
    </div>
  );
}

/* Small labeled text input, reused across the vendor form modal */
export function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

export const fieldStyle = {
  width: '100%', height: 40, border: '1.5px solid #e5e7eb', borderRadius: 8,
  padding: '0 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
};

const BUSINESS_TYPES = ['Food', 'Grocery', 'Pharmacy', 'Boutique', 'Electronics', 'Drinks', 'Other'];
const PRODUCT_CATEGORY_EMOJI = { Food:'🍛', Grocery:'🛒', Pharmacy:'💊', Boutique:'👗', Electronics:'📱', Drinks:'🥤', Other:'📦' };

/* ═══════════════════════════════════════════════
   VENDOR FORM MODAL — create a vendor / edit its
   profile / do simple (non-variant) product adds.
   Assumed endpoints (adjust to match your API):
     POST   /admin/vendors                 create vendor + owner account
     PATCH  /admin/vendors/:id             update vendor profile
     POST   /admin/vendors/:id/products     add a basic product for that vendor
     DELETE /products/:id                   remove a product (existing vendor-app endpoint)
═══════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════
   SECTION COMPONENTS
═══════════════════════════════════════════════ */

/* ── OVERVIEW ── */
function Overview({ authFetch, theme }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/admin/overview');
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Could not load overview');
      setData(json.data);
    } catch (e) {
      setError(e.message || 'Something went wrong.');
    }
    setLoading(false);
  }, [authFetch]);

  useEffect(() => { load(); }, [load]);

  if (loading && !data) return (
    <div style={{ display:'flex', justifyContent:'center', padding:80 }}>
      <Loader2 size={28} style={{ animation:'spin 1s linear infinite', color: theme.green }}/>
    </div>
  );

  if (error) return (
    <div style={{ background:'#fef2f2', color:'#dc2626', borderRadius:10, padding:'16px 20px' }}>{error}</div>
  );

  const { kpis, dailyTrend, userGrowth, orderStatusBreakdown, deliveryStatusBreakdown, orderTypeBreakdown, paymentMethodBreakdown, topVendors, topRiders } = data;

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:900, color:'#0f1117', margin:0 }}>Dashboard Overview</h2>
          <p style={{ color:'#6b7280', fontSize:14, margin:'4px 0 0' }}>Real-time platform metrics — last 30 days</p>
        </div>
        <button onClick={load} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer', fontSize:13, fontWeight:600, color:'#374151' }}>
          <RefreshCw size={14} className={loading ? 'spin' : ''}/> Refresh
        </button>
      </div>

      {/* KPI GRID */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(190px, 1fr))', gap:16, marginBottom:22 }}>
        <StatCard icon={<Users size={20}/>}       label="Total Users"      value={kpis.totalUsers}  sub={`${kpis.usersByRole.CUSTOMER||0} customers`} color="#3b82f6"/>
        <StatCard icon={<Bike size={20}/>}        label="Riders Online"    value={`${kpis.onlineRiders}/${kpis.totalRiders}`} sub="Online / Total" color="#f59e0b"/>
        <StatCard icon={<Store size={20}/>}       label="Vendors"          value={kpis.totalVendors} sub={`${kpis.pendingVendors} pending approval`} color="#10b981"/>
        <StatCard icon={<ShoppingBag size={20}/>} label="Orders Today"     value={kpis.ordersToday} color="#8b5cf6"/>
        <StatCard icon={<Truck size={20}/>}       label="Deliveries Today" value={kpis.deliveriesToday} color="#06b6d4"/>
        <StatCard icon={<TrendingUp size={20}/>}  label="Revenue Today"    value={`GHS ${kpis.revenueToday.toFixed(2)}`} color="#ec4899"/>
        <StatCard icon={<DollarSign size={20}/>}  label="All-Time Revenue" value={`GHS ${kpis.totalRevenueAllTime.toFixed(0)}`} color="#0ea5e9"/>
        <StatCard icon={<AlertTriangle size={20}/>} label="Cancellation Rate" value={`${kpis.cancellationRate}%`} sub="Last 30 days" color="#ef4444"/>
      </div>

      {/* REVENUE TREND */}
      <SectionCard title="Revenue & Volume — last 30 days" sub="Marketplace orders vs. deliveries/errands" style={{ marginBottom:16 }}>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={dailyTrend}>
            <defs>
              <linearGradient id="ordRevGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.green} stopOpacity={0.35}/>
                <stop offset="95%" stopColor={theme.green} stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="delRevGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
            <XAxis dataKey="date" tick={{ fontSize:10 }} tickFormatter={d => d.slice(5)} interval={4}/>
            <YAxis tick={{ fontSize:11 }}/>
            <Tooltip content={<ChartTooltip/>}/>
            <Legend wrapperStyle={{ fontSize:12 }}/>
            <Area type="monotone" dataKey="orderRevenue" name="Order Revenue" stroke={theme.green} fill="url(#ordRevGrad)" strokeWidth={2}/>
            <Area type="monotone" dataKey="deliveryRevenue" name="Delivery Revenue" stroke="#3b82f6" fill="url(#delRevGrad)" strokeWidth={2}/>
          </AreaChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* USER GROWTH + ORDER TYPE MIX */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:16 }}>
        <SectionCard title="User Growth" sub="New signups by role, last 30 days">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
              <XAxis dataKey="date" tick={{ fontSize:10 }} tickFormatter={d => d.slice(5)} interval={4}/>
              <YAxis tick={{ fontSize:11 }} allowDecimals={false}/>
              <Tooltip content={<ChartTooltip prefix=""/>}/>
              <Legend wrapperStyle={{ fontSize:12 }}/>
              <Line type="monotone" dataKey="customers" name="Customers" stroke="#3b82f6" strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="vendors" name="Vendors" stroke="#10b981" strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="riders" name="Riders" stroke="#f59e0b" strokeWidth={2} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Job Mix" sub="Last 30 days, by type">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={orderTypeBreakdown} dataKey="count" nameKey="type" cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3}>
                {orderTypeBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>)}
              </Pie>
              <Tooltip/>
              <Legend wrapperStyle={{ fontSize:11 }} layout="vertical" align="center" verticalAlign="bottom"/>
            </PieChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      {/* STATUS BREAKDOWNS + PAYMENT METHOD */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:16 }}>
        <SectionCard title="Orders by Status">
          <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
            {orderStatusBreakdown.map(b => (
              <div key={b.status} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', borderRadius:8, background:'#f9fafb', border:'1px solid #f0f0f0' }}>
                <StatusBadge status={b.status}/>
                <span style={{ fontWeight:800, color:'#0f1117' }}>{b.count}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Deliveries by Status">
          <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
            {deliveryStatusBreakdown.map(b => (
              <div key={b.status} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', borderRadius:8, background:'#f9fafb', border:'1px solid #f0f0f0' }}>
                <StatusBadge status={b.status}/>
                <span style={{ fontWeight:800, color:'#0f1117' }}>{b.count}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Payment Methods">
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={paymentMethodBreakdown} dataKey="count" nameKey="method" cx="50%" cy="50%" innerRadius={30} outerRadius={60} paddingAngle={3}>
                {paymentMethodBreakdown.map((_, i) => <Cell key={i} fill={i === 0 ? theme.green : '#f59e0b'}/>)}
              </Pie>
              <Tooltip/>
              <Legend wrapperStyle={{ fontSize:11 }}/>
            </PieChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      {/* LEADERBOARDS */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <SectionCard title="Top Vendors" sub="By revenue, all-time">
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {topVendors.length === 0 && <div style={{ color:'#9ca3af', fontSize:13 }}>No orders yet</div>}
            {topVendors.map((v, i) => (
              <div key={v.vendorId} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:8, background:'#f9fafb' }}>
                <span style={{ width:28, height:28, borderRadius:'50%', background:'#e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#374151', flexShrink:0 }}>{i+1}</span>
                <span style={{ fontWeight:700, color:'#0f1117', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v.businessName}</span>
                <span style={{ fontSize:13, color:'#6b7280' }}>{v.orderCount} orders</span>
                <span style={{ fontSize:13, fontWeight:700, color:'#10b981' }}>GHS {v.revenue.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Top Riders" sub="By earnings, all-time">
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {topRiders.length === 0 && <div style={{ color:'#9ca3af', fontSize:13 }}>No riders yet</div>}
            {topRiders.map((r, i) => (
              <div key={r.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:8, background:'#f9fafb' }}>
                <span style={{ width:28, height:28, borderRadius:'50%', background:'#e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#374151', flexShrink:0 }}>{i+1}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, color:'#0f1117', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.name}</div>
                  <div style={{ fontSize:11, color:'#9ca3af' }}>⭐ {r.rating?.toFixed(1) || '0.0'} · {r.totalJobs} jobs ({r.completedJobs} completed)</div>
                </div>
                <StatusBadge status={r.availability}/>
                <span style={{ fontSize:13, fontWeight:700, color:'#10b981' }}>GHS {r.totalEarnings.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ── USERS ── */
function UsersSection({ authFetch, theme }) {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const [search,  setSearch]  = useState('');
  const [role,    setRole]    = useState('');
  const [acting,  setActing]  = useState(null);

  const load = useCallback(async (p = page, s = search, r = role) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page:p, limit:15, ...(s&&{search:s}), ...(r&&{role:r}) });
      const res = await authFetch(`/admin/users?${params}`);
      const json = await res.json();
      if (json.success) { setData(json.data.users); setTotal(json.data.pagination.totalPages); }
    } catch {}
    setLoading(false);
  }, [authFetch, page, search, role]);

  useEffect(() => { load(1, search, role); }, [search, role]);

  async function toggleStatus(userId, currentStatus) {
    setActing(userId);
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await authFetch(`/admin/users/${userId}/status`, { method:'PATCH', body: JSON.stringify({ status: newStatus }) });
      load(page);
    } catch {}
    setActing(null);
  }

  const columns = [
    { key:'name',   label:'Name',   render: r => <div><div style={{ fontWeight:700, color:'#0f1117' }}>{r.name}</div><div style={{ color:'#9ca3af', fontSize:12 }}>{r.phone}</div></div> },
    { key:'email',  label:'Email',  render: r => <span style={{ color:'#6b7280' }}>{r.email || '—'}</span> },
    { key:'role',   label:'Role',   render: r => <StatusBadge status={r.role}/> },
    { key:'status', label:'Status', render: r => <StatusBadge status={r.status}/> },
    { key:'createdAt', label:'Joined', render: r => new Date(r.createdAt).toLocaleDateString() },
    { key:'actions', label:'', render: r => (
      <button onClick={() => toggleStatus(r.id, r.status)} disabled={acting === r.id}
        style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:7, border:`1px solid ${r.status==='ACTIVE'?'#fecaca':'#bbf7d0'}`, background: r.status==='ACTIVE'?'#fef2f2':'#f0fdf4', cursor:'pointer', fontSize:12, fontWeight:700, color: r.status==='ACTIVE'?'#dc2626':'#16a34a' }}>
        {acting===r.id ? <Loader2 size={12} style={{ animation:'spin 1s linear infinite' }}/> : r.status==='ACTIVE' ? <UserX size={12}/> : <UserCheck size={12}/>}
        {r.status==='ACTIVE' ? 'Suspend' : 'Activate'}
      </button>
    )},
  ];

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <h2 style={{ fontSize:22, fontWeight:900, color:'#0f1117', margin:0 }}>Users</h2>
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }}/>
          <input placeholder="Search name, phone, email..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width:'100%', height:38, paddingLeft:36, paddingRight:12, border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}
            onFocus={e => e.target.style.borderColor = theme.green} onBlur={e => e.target.style.borderColor = '#e5e7eb'}/>
        </div>
        <select value={role} onChange={e => setRole(e.target.value)}
          style={{ height:38, padding:'0 12px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:13, outline:'none', background:'#fff', fontFamily:'inherit' }}>
          <option value="">All Roles</option>
          {['CUSTOMER','VENDOR','RIDER','ADMIN'].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #f0f0f0', overflow:'hidden' }}>
        <Table columns={columns} data={data} loading={loading} emptyMsg="No users found"/>
        <Pagination page={page} totalPages={total} onChange={p => { setPage(p); load(p); }}/>
      </div>
    </div>
  );
}

/* ── VENDORS ── */
function VendorsSection({ authFetch, theme }) {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const [status,  setStatus]  = useState('');
  const [acting,  setActing]  = useState(null);

  // null = closed, 'new' = create modal, {..vendor} = manage modal
  const [modalTarget, setModalTarget] = useState(null);

  const load = useCallback(async (p=1, s=status) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page:p, limit:15, ...(s&&{status:s}) });
      const res = await authFetch(`/admin/vendors?${params}`);
      const json = await res.json();
      if (json.success) { setData(json.data.vendors); setTotal(json.data.pagination.totalPages); }
    } catch {}
    setLoading(false);
  }, [authFetch, status]);

  useEffect(() => { load(1, status); }, [status]);

  async function updateStatus(vendorId, newStatus) {
    setActing(vendorId);
    try {
      await authFetch(`/admin/vendors/${vendorId}/status`, { method:'PATCH', body: JSON.stringify({ status: newStatus }) });
      load(page);
    } catch {}
    setActing(null);
  }

  const columns = [
    { key:'businessName', label:'Business', render: r => (
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{
          width:34, height:34, borderRadius:9, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15,
          background: r.logo ? `url(${r.logo}) center/cover` : '#f3f4f6',
        }}>{!r.logo && (PRODUCT_CATEGORY_EMOJI[r.businessType] || '🏪')}</div>
        <div>
          <div style={{ fontWeight:700, color:'#0f1117' }}>{r.businessName}</div>
          <div style={{ color:'#9ca3af', fontSize:12 }}>{r.businessType}</div>
        </div>
      </div>
    )},
    { key:'owner', label:'Owner', render: r => <div><div style={{ fontWeight:600 }}>{r.user?.name}</div><div style={{ color:'#9ca3af', fontSize:12 }}>{r.user?.phone}</div></div> },
    { key:'products', label:'Products', render: r => <span style={{ fontWeight:700 }}>{r._count?.products ?? 0}</span> },
    { key:'orders',   label:'Orders',   render: r => <span style={{ fontWeight:700 }}>{r._count?.orders ?? 0}</span> },
    { key:'status',   label:'Status',   render: r => <StatusBadge status={r.status}/> },
    { key:'actions',  label:'',         render: r => (
      <div style={{ display:'flex', gap:6 }}>
        <button onClick={() => setModalTarget(r)}
          style={{ padding:'5px 10px', borderRadius:7, border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer', fontSize:11, fontWeight:700, color:'#374151', display:'flex', alignItems:'center', gap:4 }}>
          <Settings size={11}/> Manage
        </button>
        {r.status !== 'ACTIVE' && (
          <button onClick={() => updateStatus(r.id, 'ACTIVE')} disabled={acting===r.id}
            style={{ padding:'5px 10px', borderRadius:7, border:'1px solid #bbf7d0', background:'#f0fdf4', cursor:'pointer', fontSize:11, fontWeight:700, color:'#16a34a', display:'flex', alignItems:'center', gap:4 }}>
            {acting===r.id ? <Loader2 size={11} style={{ animation:'spin 1s linear infinite' }}/> : <CheckCircle size={11}/>} Approve
          </button>
        )}
        {r.status === 'ACTIVE' && (
          <button onClick={() => updateStatus(r.id, 'INACTIVE')} disabled={acting===r.id}
            style={{ padding:'5px 10px', borderRadius:7, border:'1px solid #fecaca', background:'#fef2f2', cursor:'pointer', fontSize:11, fontWeight:700, color:'#dc2626', display:'flex', alignItems:'center', gap:4 }}>
            {acting===r.id ? <Loader2 size={11} style={{ animation:'spin 1s linear infinite' }}/> : <XCircle size={11}/>} Deactivate
          </button>
        )}
      </div>
    )},
  ];

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <h2 style={{ fontSize:22, fontWeight:900, color:'#0f1117', margin:0 }}>Vendors</h2>
        <button onClick={() => setModalTarget('new')} style={{
          display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:9, border:'none',
          background: theme.green, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:'inherit',
        }}>
          <Plus size={15}/> Add Vendor
        </button>
      </div>
      <div style={{ display:'flex', gap:10, marginBottom:16 }}>
        <select value={status} onChange={e => setStatus(e.target.value)}
          style={{ height:38, padding:'0 12px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:13, outline:'none', background:'#fff', fontFamily:'inherit' }}>
          <option value="">All Statuses</option>
          {['PENDING','ACTIVE','INACTIVE'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #f0f0f0', overflow:'hidden' }}>
        <Table columns={columns} data={data} loading={loading} emptyMsg="No vendors found"/>
        <Pagination page={page} totalPages={total} onChange={p => { setPage(p); load(p); }}/>
      </div>

      {modalTarget && (
        <VendorFormModal
          vendor={modalTarget === 'new' ? null : modalTarget}
          authFetch={authFetch}
          theme={theme}
          onClose={() => setModalTarget(null)}
          onSaved={() => load(page)}
        />
      )}
    </div>
  );
}

/* ── RIDERS ── */
function RidersSection({ authFetch, theme }) {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const [avail,   setAvail]   = useState('');
  const [viewRiderId, setViewRiderId] = useState(null);

  const load = useCallback(async (p=1, a=avail) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page:p, limit:15, ...(a&&{availability:a}) });
      const res = await authFetch(`/admin/riders?${params}`);
      const json = await res.json();
      if (json.success) { setData(json.data.riders); setTotal(json.data.pagination.totalPages); }
    } catch {}
    setLoading(false);
  }, [authFetch, avail]);

  useEffect(() => { load(1, avail); }, [avail]);

  const columns = [
    { key:'rider', label:'Rider', render: r => <div><div style={{ fontWeight:700, color:'#0f1117' }}>{r.user?.name}</div><div style={{ color:'#9ca3af', fontSize:12 }}>{r.user?.phone}</div></div> },
    { key:'bikeType',        label:'Bike',        render: r => r.bikeType },
    { key:'availability',    label:'Status',      render: r => <StatusBadge status={r.availability}/> },
    { key:'totalDeliveries', label:'Deliveries',  render: r => <span style={{ fontWeight:700 }}>{r.totalDeliveries}</span> },
    { key:'rating',          label:'Rating',      render: r => <span style={{ fontWeight:700 }}>⭐ {r.rating?.toFixed(1) || '0.0'}</span> },
    { key:'earnings',        label:'Earnings',    render: r => <span style={{ fontWeight:700, color:'#10b981' }}>GHS {r.earnings?.toFixed(2) || '0.00'}</span> },
    { key:'location',        label:'Location',    render: r => r.currentLatitude ? <span style={{ fontSize:12, color:'#3b82f6' }}>📍 {r.currentLatitude.toFixed(3)}, {r.currentLongitude.toFixed(3)}</span> : <span style={{ color:'#9ca3af', fontSize:12 }}>No location</span> },
    { key:'actions', label:'', render: r => (
      <button onClick={() => setViewRiderId(r.id)}
        style={{ padding:'5px 10px', borderRadius:7, border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer', fontSize:11, fontWeight:700, color:'#374151', display:'flex', alignItems:'center', gap:4 }}>
        <Eye size={11}/> Insights
      </button>
    )},
  ];

  // ── Early return: drill into the detail view, don't render the list ──
  if (viewRiderId) {
    return <RiderInsights riderId={viewRiderId} authFetch={authFetch} theme={theme} onBack={() => setViewRiderId(null)} />;
  }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <h2 style={{ fontSize:22, fontWeight:900, color:'#0f1117', margin:0 }}>Riders</h2>
      </div>
      <div style={{ display:'flex', gap:10, marginBottom:16 }}>
        <select value={avail} onChange={e => setAvail(e.target.value)}
          style={{ height:38, padding:'0 12px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:13, outline:'none', background:'#fff', fontFamily:'inherit' }}>
          <option value="">All</option>
          {['ONLINE','OFFLINE','BUSY'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #f0f0f0', overflow:'hidden' }}>
        <Table columns={columns} data={data} loading={loading} emptyMsg="No riders found"/>
        <Pagination page={page} totalPages={total} onChange={p => { setPage(p); load(p); }}/>
      </div>
    </div>
  );
}

export function fmtGHS(n) { return `GHS ${Number(n || 0).toFixed(2)}`; }



export function PricingModeCard({ active, onClick, title, desc, theme }) {
  return (
    <button type="button" onClick={onClick} style={{
      flex:1, textAlign:'left', padding:14, borderRadius:12, cursor:'pointer', fontFamily:'inherit',
      border: `1.5px solid ${active ? theme.green : '#e5e7eb'}`,
      background: active ? `${theme.green}0f` : '#f9fafb',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
        <div style={{ width:16, height:16, borderRadius:'50%', border:`2px solid ${active?theme.green:'#d1d5db'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          {active && <div style={{ width:8, height:8, borderRadius:'50%', background:theme.green }}/>}
        </div>
        <span style={{ fontSize:13, fontWeight:700, color:'#0f1117' }}>{title}</span>
      </div>
      <div style={{ fontSize:11, color:'#9ca3af', paddingLeft:24 }}>{desc}</div>
    </button>
  );
}

/* ═══════════════════════════════════════════════
   MAIN ADMIN DASHBOARD
═══════════════════════════════════════════════ */
const NAV_ITEMS = [
  { id:'overview',    label:'Overview',    icon:<LayoutDashboard size={18}/> },
  { id:'orders',      label:'Orders',      icon:<ShoppingBag size={18}/> },
  { id:'deliveries',  label:'Deliveries',  icon:<Truck size={18}/> },
  { id:'vendors',     label:'Vendors',     icon:<Store size={18}/> },
  { id:'riders',      label:'Riders',      icon:<Bike size={18}/> },
  { id:'users',       label:'Users',       icon:<Users size={18}/> },
  { id:'reports', label:'Reports', icon:<BarChart2 size={18}/> },
  { id:'settings', label:'Settings', icon:<Settings size={18}/> },
  { id:'broadcast', label:'Broadcast', icon:<Megaphone size={18}/> },
];

export default function AdminDashboard() {
  const { user, logout, authFetch, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const navigate  = useNavigate();

  const [section, setSection]   = useState('overview');
  const [sideOpen, setSideOpen] = useState(true);

  /* Redirect if not admin */
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'system-ui' }}>
      <Loader2 size={32} style={{ animation:'spin 1s linear infinite', color: theme.green }}/>
    </div>
  );

  if (!user) return null;

  const SECTIONS = {
    overview: <Overview authFetch={authFetch} theme={theme}/>,
    users:      <UsersSection authFetch={authFetch} theme={theme}/>,
    vendors:    <VendorsSection authFetch={authFetch} theme={theme}/>,
    riders:     <RidersSection authFetch={authFetch} theme={theme}/>,
    orders:     <OrdersSection authFetch={authFetch} theme={theme}/>,
    deliveries: <DeliveriesSection authFetch={authFetch} theme={theme}/>,
    reports: <ReportsSection authFetch={authFetch} theme={theme}/>,
    settings: <SettingsSection authFetch={authFetch} theme={theme}/>,
    broadcast: <BroadcastSection authFetch={authFetch} theme={theme}/>,
  };

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f8faf8', fontFamily:"'DM Sans', system-ui, sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: sideOpen ? 240 : 64,
        background:'#fff',
        borderRight:'1px solid #f0f0f0',
        display:'flex',
        flexDirection:'column',
        transition:'width 0.25s ease',
        overflow:'hidden',
        flexShrink:0,
        position:'sticky',
        top:0,
        height:'100vh',
        zIndex:100,
      }}>
        {/* LOGO */}
        <div style={{ padding: sideOpen ? '24px 20px 20px' : '24px 12px 20px', borderBottom:'1px solid #f0f0f0', display:'flex', alignItems:'center', justifyContent: sideOpen?'space-between':'center' }}>
          {sideOpen && (
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:10, background:`linear-gradient(135deg, ${theme.green}, ${theme.greenMid})`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:15 }}>F</div>
              <div>
                <div style={{ fontWeight:900, fontSize:14, color:'#0f1117', letterSpacing:'-0.3px' }}>FirstChoice</div>
                <div style={{ fontSize:10, color:'#9ca3af', fontWeight:600 }}>Admin Panel</div>
              </div>
            </div>
          )}
          <button onClick={() => setSideOpen(!sideOpen)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:4, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:6 }}>
            {sideOpen ? <ChevronLeft size={16}/> : <Menu size={16}/>}
          </button>
        </div>

        {/* NAV */}
        <nav style={{ flex:1, padding:'12px 10px', display:'flex', flexDirection:'column', gap:2 }}>
          {NAV_ITEMS.map(item => {
            const active = section === item.id;
            return (
              <button key={item.id} onClick={() => setSection(item.id)} title={!sideOpen ? item.label : undefined}
                style={{
                  display:'flex', alignItems:'center', gap:12,
                  padding: sideOpen ? '10px 14px' : '10px 0',
                  justifyContent: sideOpen ? 'flex-start' : 'center',
                  borderRadius:10, border:'none', cursor:'pointer',
                  background: active ? `${theme.green}15` : 'transparent',
                  color: active ? theme.green : '#6b7280',
                  fontWeight: active ? 700 : 600,
                  fontSize:14, transition:'all 0.15s', width:'100%',
                  fontFamily:'inherit',
                }}>
                <span style={{ color: active ? theme.green : '#9ca3af', flexShrink:0 }}>{item.icon}</span>
                {sideOpen && item.label}
              </button>
            );
          })}
        </nav>

        {/* USER */}
        <div style={{ padding: sideOpen ? '16px 14px' : '16px 8px', borderTop:'1px solid #f0f0f0' }}>
          {sideOpen ? (
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:10, background:`${theme.green}20`, display:'flex', alignItems:'center', justifyContent:'center', color: theme.green, fontWeight:900, fontSize:14, flexShrink:0 }}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:13, color:'#0f1117', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user.name}</div>
                <div style={{ fontSize:11, color:'#9ca3af' }}>Administrator</div>
              </div>
              <button onClick={() => { logout(); navigate('/login'); }} title="Logout"
                style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:4, display:'flex', alignItems:'center' }}>
                <LogOut size={15}/>
              </button>
            </div>
          ) : (
            <button onClick={() => { logout(); navigate('/login'); }} title="Logout"
              style={{ width:'100%', background:'none', border:'none', cursor:'pointer', color:'#9ca3af', display:'flex', alignItems:'center', justifyContent:'center', padding:'6px 0' }}>
              <LogOut size={16}/>
            </button>
          )}
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={{ flex:1, padding:'32px 28px', overflowY:'auto', minWidth:0 }}>
        {SECTIONS[section]}
      </main>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @media (max-width: 640px) { main { padding: 20px 16px !important; } }
      `}</style>
    </div>
  );
}