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
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart,
  Line,
} from 'recharts';
import { fieldStyle, fmtGHS, StatCard, Table } from '../../pages/public/AdminDashboard';


export function ReportsSection({ authFetch, theme }) {
  const todayISO = new Date().toISOString().slice(0, 10);
  const weekAgoISO = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(weekAgoISO);
  const [endDate, setEndDate]     = useState(todayISO);
  const [riderId, setRiderId]     = useState('');
  const [riders, setRiders]       = useState([]);
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    authFetch('/admin/riders?limit=200').then(r => r.json()).then(j => {
      if (j.success) setRiders(j.data.riders);
    }).catch(() => {});
  }, [authFetch]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ startDate, endDate, ...(riderId && { riderId }) });
      const res = await authFetch(`/admin/reports/riders/daily?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Could not load report');
      setData(json.data);
    } catch (e) {
      setError(e.message || 'Something went wrong.');
    }
    setLoading(false);
  }, [authFetch, startDate, endDate, riderId]);

  useEffect(() => { load(); }, [load]);

  function exportCsv() {
    if (!data?.rows?.length) return;
    const headers = ['Date','Rider','Phone','Jobs','Items Subtotal','Delivery Fees','Cash Collected','MoMo Collected','Grand Total','Net To Remit'];
    const lines = data.rows.map(r => [
      r.date, r.riderName, r.riderPhone, r.jobs,
      r.itemsSubtotal.toFixed(2), r.deliveryFees.toFixed(2),
      r.cashCollected.toFixed(2), r.momoCollected.toFixed(2),
      r.grandTotal.toFixed(2), r.netToRemit.toFixed(2),
    ]);
    const csv = [headers, ...lines].map(row => row.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `rider-daily-report_${startDate}_to_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // group rows by date for display
  const byDate = {};
  (data?.rows || []).forEach(r => { (byDate[r.date] ||= []).push(r); });

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:900, color:'#0f1117', margin:0 }}>Reports</h2>
          <p style={{ color:'#6b7280', fontSize:14, margin:'4px 0 0' }}>Rider daily cash & earnings breakdown</p>
        </div>
        <button onClick={exportCsv} disabled={!data?.rows?.length} style={{
          display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, border:'1px solid #e5e7eb',
          background:'#fff', cursor: data?.rows?.length ? 'pointer' : 'not-allowed', fontSize:13, fontWeight:700, color:'#374151',
          opacity: data?.rows?.length ? 1 : 0.5,
        }}>Export CSV</button>
      </div>

      {/* filters */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={fieldStyle}/>
        <span style={{ color:'#9ca3af', fontSize:13 }}>to</span>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={fieldStyle}/>
        <select value={riderId} onChange={e => setRiderId(e.target.value)}
          style={{ ...fieldStyle, width:220 }}>
          <option value="">All Riders</option>
          {riders.map(r => <option key={r.id} value={r.id}>{r.user?.name}</option>)}
        </select>
      </div>

      {error && <div style={{ background:'#fef2f2', color:'#dc2626', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:16 }}>{error}</div>}

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
          <Loader2 size={24} style={{ animation:'spin 1s linear infinite', color: theme.green }}/>
        </div>
      ) : !data?.rows?.length ? (
        <div style={{ textAlign:'center', padding:60, color:'#9ca3af', fontSize:14 }}>No completed jobs in this range</div>
      ) : (
        <>
          {/* overall summary */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(170px, 1fr))', gap:14, marginBottom:26 }}>
            <StatCard icon={<Package size={18}/>}    label="Total Jobs"       value={data.overall.jobs}             color="#8b5cf6"/>
            <StatCard icon={<ShoppingBag size={18}/>} label="Items Subtotal"  value={fmtGHS(data.overall.itemsSubtotal)} color="#3b82f6"/>
            <StatCard icon={<Bike size={18}/>}        label="Delivery Fees"   value={fmtGHS(data.overall.deliveryFees)}  color="#f59e0b"/>
            <StatCard icon={<DollarSign size={18}/>}  label="Cash Collected"  value={fmtGHS(data.overall.cashCollected)} color="#10b981"/>
            <StatCard icon={<DollarSign size={18}/>}  label="MoMo Collected"  value={fmtGHS(data.overall.momoCollected)} color="#0ea5e9"/>
            <StatCard icon={<AlertTriangle size={18}/>} label="Net To Remit" value={fmtGHS(data.overall.netToRemit)}    color="#ec4899"/>
          </div>

          {/* per-day breakdown */}
          {Object.keys(byDate).sort((a,b) => b.localeCompare(a)).map(date => {
            const dayRows = byDate[date];
            const dayTotal = data.dailyTotals.find(d => d.date === date);
            return (
              <div key={date} style={{ background:'#fff', borderRadius:14, border:'1px solid #f0f0f0', marginBottom:16, overflow:'hidden' }}>
                <div style={{ padding:'14px 20px', background:'#f9fafb', borderBottom:'1px solid #f0f0f0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontWeight:800, fontSize:14, color:'#0f1117' }}>{new Date(date).toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short', year:'numeric' })}</span>
                  <span style={{ fontSize:12, color:'#6b7280' }}>
                    {dayTotal.jobs} jobs · Cash {fmtGHS(dayTotal.cashCollected)} · MoMo {fmtGHS(dayTotal.momoCollected)} · <strong style={{ color:'#ec4899' }}>Net to remit {fmtGHS(dayTotal.netToRemit)}</strong>
                  </span>
                </div>
                <Table
                  columns={[
                    { key:'rider', label:'Rider', render: r => <div><div style={{ fontWeight:700 }}>{r.riderName}</div><div style={{ color:'#9ca3af', fontSize:12 }}>{r.riderPhone}</div></div> },
                    { key:'jobs', label:'Jobs' },
                    { key:'itemsSubtotal', label:'Items', render: r => fmtGHS(r.itemsSubtotal) },
                    { key:'deliveryFees', label:'Fees', render: r => fmtGHS(r.deliveryFees) },
                    { key:'cashCollected', label:'Cash', render: r => fmtGHS(r.cashCollected) },
                    { key:'momoCollected', label:'MoMo', render: r => fmtGHS(r.momoCollected) },
                    { key:'netToRemit', label:'Net To Remit', render: r => <span style={{ fontWeight:700, color:'#ec4899' }}>{fmtGHS(r.netToRemit)}</span> },
                  ]}
                  data={dayRows}
                />
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}