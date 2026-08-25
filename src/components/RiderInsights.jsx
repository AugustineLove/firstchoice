'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Star, Bike, TrendingUp, CheckCircle2, XCircle,
  Loader2, Clock, MapPin, Mail, Phone, Calendar, Filter,
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Table, StatusBadge, StatCard, Pagination } from '../pages/public/AdminDashboard';
// ^ adjust the import path/filename to wherever you exported those primitives from

export const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

export function SectionCard({ title, sub, children, style }) {
  return (
    <div style={{ background:'#fff', borderRadius:14, border:'1px solid #f0f0f0', padding:'20px 22px', ...style }}>
      <div style={{ marginBottom:16 }}>
        <h3 style={{ fontSize:15, fontWeight:800, color:'#0f1117', margin:0 }}>{title}</h3>
        {sub && <p style={{ fontSize:12, color:'#9ca3af', margin:'2px 0 0' }}>{sub}</p>}
      </div>
      {children}
    </div>
  );
}

export function ChartTooltip({ active, payload, label, prefix = 'GHS ' }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#0f1117', color:'#fff', borderRadius:8, padding:'8px 12px', fontSize:12 }}>
      <div style={{ fontWeight:700, marginBottom:4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, display:'flex', gap:8, justifyContent:'space-between' }}>
          <span>{p.name}</span>
          <span style={{ fontWeight:700 }}>{typeof p.value === 'number' && p.dataKey !== 'jobs' ? `${prefix}${p.value.toFixed(2)}` : p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function RiderInsights({ riderId, authFetch, theme, onBack }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const [jobs, setJobs]           = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [kindFilter, setKindFilter]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`/admin/riders/${riderId}/insights`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Could not load rider insights');
      setData(json.data);
    } catch (e) {
      setError(e.message || 'Something went wrong.');
    }
    setLoading(false);
  }, [authFetch, riderId]);

  const loadJobs = useCallback(async (p = 1, kind = kindFilter, status = statusFilter) => {
    setJobsLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 15, ...(kind && { kind }), ...(status && { status }) });
      const res = await authFetch(`/admin/riders/${riderId}/jobs?${params}`);
      const json = await res.json();
      if (json.success) { setJobs(json.data.jobs); setTotalPages(json.data.pagination.totalPages); }
    } catch {}
    setJobsLoading(false);
  }, [authFetch, riderId, kindFilter, statusFilter]);

  useEffect(() => { loadInsights(); }, [loadInsights]);
  useEffect(() => { setPage(1); loadJobs(1, kindFilter, statusFilter); }, [kindFilter, statusFilter]);

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:80 }}>
      <Loader2 size={28} style={{ animation:'spin 1s linear infinite', color: theme.green }}/>
    </div>
  );

  if (error || !data) return (
    <div>
      <button onClick={onBack} style={backBtnStyle}><ArrowLeft size={14}/> Back to Riders</button>
      <div style={{ background:'#fef2f2', color:'#dc2626', borderRadius:10, padding:'16px 20px', marginTop:16 }}>
        {error || 'Could not load rider insights.'}
      </div>
    </div>
  );

  const { profile, summary, charts, recentActivity } = data;

  const jobColumns = [
    { key:'kind', label:'Type', render: r => <StatusBadge status={r.kind === 'order' ? 'PICKUP' : r.status === 'CANCELLED' ? 'CANCELLED' : (r.counterparty === 'ERRAND' ? 'ERRAND' : 'PICKUP')}/> },
    { key:'counterparty', label:'From / Vendor', render: r => <span style={{ fontWeight:600 }}>{r.kind === 'order' ? r.counterparty : r.from}</span> },
    { key:'customer', label:'Customer', render: r => <div><div style={{ fontWeight:600 }}>{r.customer?.name}</div><div style={{ color:'#9ca3af', fontSize:12 }}>{r.customer?.phone}</div></div> },
    { key:'amount', label:'Fee', render: r => <span style={{ fontWeight:700, color:'#10b981' }}>GHS {Number(r.amount ?? 0).toFixed(2)}</span> },
    { key:'status', label:'Status', render: r => <StatusBadge status={r.status}/> },
    { key:'date', label:'Date', render: r => new Date(r.createdAt).toLocaleString() },
  ];

  return (
    <div>
      <button onClick={onBack} style={backBtnStyle}><ArrowLeft size={14}/> Back to Riders</button>

      {/* ── PROFILE HEADER ── */}
      <div style={{ background:'#fff', borderRadius:16, border:'1px solid #f0f0f0', padding:'24px 26px', marginTop:16, marginBottom:22, display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
        <div style={{
          width:64, height:64, borderRadius:16, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
          background: profile.profileImage ? `url(${profile.profileImage}) center/cover` : `${theme.green}18`,
          color: theme.green, fontWeight:900, fontSize:24,
        }}>
          {!profile.profileImage && profile.name?.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex:1, minWidth:200 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <h2 style={{ fontSize:20, fontWeight:900, color:'#0f1117', margin:0 }}>{profile.name}</h2>
            <StatusBadge status={profile.availability}/>
          </div>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginTop:8, fontSize:13, color:'#6b7280' }}>
            <span style={{ display:'flex', alignItems:'center', gap:5 }}><Phone size={13}/> {profile.phone}</span>
            {profile.email && <span style={{ display:'flex', alignItems:'center', gap:5 }}><Mail size={13}/> {profile.email}</span>}
            <span style={{ display:'flex', alignItems:'center', gap:5 }}><Bike size={13}/> {profile.bikeType}</span>
            <span style={{ display:'flex', alignItems:'center', gap:5 }}><Calendar size={13}/> Joined {new Date(profile.joined).toLocaleDateString()}</span>
            {profile.currentLatitude && (
              <span style={{ display:'flex', alignItems:'center', gap:5, color:'#3b82f6' }}>
                <MapPin size={13}/> {profile.currentLatitude.toFixed(3)}, {profile.currentLongitude.toFixed(3)}
              </span>
            )}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, background:'#fffbeb', padding:'10px 16px', borderRadius:12 }}>
          <Star size={18} color="#f59e0b" fill="#f59e0b"/>
          <span style={{ fontSize:20, fontWeight:900, color:'#92400e' }}>{profile.rating?.toFixed(1) || '0.0'}</span>
        </div>
      </div>

      {/* ── STAT GRID ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:16, marginBottom:22 }}>
        <StatCard icon={<TrendingUp size={20}/>}  label="Total Earnings"  value={`GHS ${summary.totalEarnings.toFixed(2)}`} color="#10b981"/>
        <StatCard icon={<Clock size={20}/>}       label="This Week"       value={`GHS ${summary.weekEarnings.toFixed(2)}`} color="#3b82f6"/>
        <StatCard icon={<Clock size={20}/>}       label="Today"           value={`GHS ${summary.todayEarnings.toFixed(2)}`} color="#8b5cf6"/>
        <StatCard icon={<CheckCircle2 size={20}/>} label="Completion Rate" value={`${summary.completionRate}%`} sub={`${summary.totalDelivered} delivered`} color="#06b6d4"/>
        <StatCard icon={<XCircle size={20}/>}      label="Cancelled"       value={summary.totalCancelled} color="#ef4444"/>
        <StatCard icon={<Bike size={20}/>}         label="Active Now"      value={summary.activeJobs} color="#f59e0b"/>
      </div>

      {/* ── CHARTS ROW 1 ── */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:16 }}>
        <SectionCard title="Earnings — last 30 days" sub="Marketplace orders vs. deliveries/errands">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={charts.dailyEarnings}>
              <defs>
                <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.green} stopOpacity={0.35}/>
                  <stop offset="95%" stopColor={theme.green} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="deliveriesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
              <XAxis dataKey="date" tick={{ fontSize:10 }} tickFormatter={d => d.slice(5)} interval={4}/>
              <YAxis tick={{ fontSize:11 }}/>
              <Tooltip content={<ChartTooltip/>}/>
              <Legend wrapperStyle={{ fontSize:12 }}/>
              <Area type="monotone" dataKey="orders" name="Orders" stroke={theme.green} fill="url(#ordersGrad)" strokeWidth={2}/>
              <Area type="monotone" dataKey="deliveries" name="Deliveries" stroke="#3b82f6" fill="url(#deliveriesGrad)" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Job Mix" sub="All-time, by type">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={charts.jobTypeBreakdown} dataKey="count" nameKey="type" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3}>
                {charts.jobTypeBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>)}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]}/>
              <Legend wrapperStyle={{ fontSize:11 }} layout="vertical" align="center" verticalAlign="bottom"/>
            </PieChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      {/* ── CHARTS ROW 2 ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <SectionCard title="Weekday Performance" sub="Completed jobs by day of week, all-time">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={charts.weekdayBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
              <XAxis dataKey="day" tick={{ fontSize:12 }}/>
              <YAxis tick={{ fontSize:11 }} allowDecimals={false}/>
              <Tooltip content={<ChartTooltip prefix=""/>}/>
              <Bar dataKey="jobs" name="Jobs" fill={theme.green} radius={[6,6,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Current Status Mix" sub="Live snapshot across orders & deliveries">
          <div style={{ display:'flex', flexWrap:'wrap', gap:10, paddingTop:6 }}>
            {charts.statusBreakdown.length === 0 && <div style={{ color:'#9ca3af', fontSize:13 }}>No job history yet.</div>}
            {charts.statusBreakdown.map(s => (
              <div key={s.status} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:10, background:'#f9fafb', border:'1px solid #f0f0f0' }}>
                <StatusBadge status={s.status}/>
                <span style={{ fontWeight:800, color:'#0f1117' }}>{s.count}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* ── RECENT ACTIVITY ── */}
      <SectionCard title="Recent Activity" sub="Last 10 updates across orders and deliveries" style={{ marginBottom:16 }}>
        {recentActivity.length === 0 ? (
          <div style={{ textAlign:'center', padding:30, color:'#9ca3af', fontSize:13 }}>No activity yet</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {recentActivity.map(a => (
              <div key={`${a.kind}-${a.id}`} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:10, background:'#f9fafb' }}>
                <StatusBadge status={a.status}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#0f1117' }}>
                    {a.kind === 'order' ? 'Order' : 'Delivery'} · {a.counterparty || '—'}{a.note ? ` (${a.note})` : ''}
                  </div>
                  <div style={{ fontSize:12, color:'#9ca3af' }}>{a.counterparty ? `Customer: ${a.counterparty}` : ''}</div>
                </div>
                <span style={{ fontWeight:700, color:'#10b981', fontSize:13 }}>GHS {Number(a.amount ?? 0).toFixed(2)}</span>
                <span style={{ fontSize:12, color:'#9ca3af', whiteSpace:'nowrap' }}>{new Date(a.date).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ── FULL JOB HISTORY ── */}
      <SectionCard title="Full Job History" sub="Every order and delivery ever assigned to this rider">
        <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
          <select value={kindFilter} onChange={e => setKindFilter(e.target.value)}
            style={{ height:38, padding:'0 12px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:13, outline:'none', background:'#fff', fontFamily:'inherit' }}>
            <option value="">All Types</option>
            <option value="order">Marketplace Orders</option>
            <option value="delivery">Deliveries / Errands</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ height:38, padding:'0 12px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:13, outline:'none', background:'#fff', fontFamily:'inherit' }}>
            <option value="">All Statuses</option>
            {['PENDING','ACCEPTED','RIDER_ASSIGNED','PICKED_UP','IN_TRANSIT','DELIVERED','CANCELLED'].map(s => (
              <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
            ))}
          </select>
        </div>
        <Table columns={jobColumns} data={jobs} loading={jobsLoading} emptyMsg="No jobs found"/>
        <Pagination page={page} totalPages={totalPages} onChange={p => { setPage(p); loadJobs(p); }}/>
      </SectionCard>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const backBtnStyle = {
  display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8,
  border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer', fontSize:13, fontWeight:700,
  color:'#374151', fontFamily:'inherit',
};