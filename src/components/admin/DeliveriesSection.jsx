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
import { fieldStyle, fmtGHS, Pagination, StatCard, StatusBadge, Table } from '../../pages/public/AdminDashboard';


export function DeliveriesSection({ authFetch, theme }) {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const [status,  setStatus]  = useState('');
  const [riders,  setRiders]  = useState([]);
  const [assigning, setAssigning] = useState(null);
  const [selectedRider, setSelectedRider] = useState({});

  const load = useCallback(async (p=1, s=status) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page:p, limit:15, ...(s&&{status:s}) });
      const res = await authFetch(`/deliveries?${params}`);
      const json = await res.json();
      if (json.success) { setData(json.data.deliveries); setTotal(json.data.pagination.totalPages); }
    } catch {}
    setLoading(false);
  }, [authFetch, status]);

  useEffect(() => { load(1, status); }, [status]);

  useEffect(() => {
    authFetch('/riders/available').then(r => r.json()).then(j => {
      if (j.success) setRiders(j.data);
    }).catch(() => {});
  }, [authFetch]);

  async function assignRider(deliveryId) {
    const riderId = selectedRider[deliveryId];
    if (!riderId) return;
    setAssigning(deliveryId);
    try {
      await authFetch(`/deliveries/${deliveryId}/assign`, { method:'PATCH', body: JSON.stringify({ riderId }) });
      load(page);
    } catch {}
    setAssigning(null);
  }

  const columns = [
    { key:'id',          label:'ID',          render: r => <span style={{ fontFamily:'monospace', fontSize:12, color:'#6b7280' }}>{r.id.slice(-8).toUpperCase()}</span> },
    { key:'type', label:'Type', render: r => <StatusBadge status={r.type || 'PICKUP'}/> },
    { key:'customer',    label:'Customer',    render: r => <div><div style={{ fontWeight:700 }}>{r.customer?.name}</div><div style={{ color:'#9ca3af', fontSize:12 }}>{r.customer?.phone}</div></div> },
    { key:'pickup',      label:'Pickup',      render: r => <span style={{ fontSize:12 }}>{r.pickupAddress}</span> },
    { key:'destination', label:'Destination', render: r => <span style={{ fontSize:12 }}>{r.destinationAddress}</span> },
    { key:'fee', label:'Fee', render: r => (
  <div>
    <span style={{ fontWeight:700, color:'#10b981' }}>GHS {r.estimatedFee}</span>
    {r.type === 'ERRAND' && r.itemsEstimatedTotal > 0 && (
      <div style={{ fontSize:11, color:'#9ca3af' }}>+ GHS {Number(r.itemsEstimatedTotal).toFixed(2)} items</div>
    )}
  </div>
) },
    { key:'status',      label:'Status',      render: r => <StatusBadge status={r.status}/> },
    { key:'rider',       label:'Rider',       render: r => r.rider ? <span style={{ color:'#3b82f6', fontWeight:600 }}>{r.rider.user?.name}</span> : <span style={{ color:'#9ca3af' }}>Unassigned</span> },
    { key:'assign',      label:'Assign',      render: r => r.status === 'PENDING' && !r.assignedRiderId ? (
      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
        <select value={selectedRider[r.id]||''} onChange={e => setSelectedRider(p => ({...p,[r.id]:e.target.value}))}
          style={{ height:30, padding:'0 8px', border:'1px solid #e5e7eb', borderRadius:6, fontSize:12, outline:'none', background:'#fff', maxWidth:130 }}>
          <option value="">Select rider</option>
          {riders.map(rd => <option key={rd.id} value={rd.id}>{rd.user?.name}</option>)}
        </select>
        <button onClick={() => assignRider(r.id)} disabled={!selectedRider[r.id] || assigning===r.id}
          style={{ padding:'5px 10px', borderRadius:6, border:'none', background: theme.green, color:'#fff', cursor:'pointer', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', gap:4, opacity: !selectedRider[r.id]?0.5:1 }}>
          {assigning===r.id ? <Loader2 size={11} style={{ animation:'spin 1s linear infinite' }}/> : null} Assign
        </button>
      </div>
    ) : null },
  ];

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <h2 style={{ fontSize:22, fontWeight:900, color:'#0f1117', margin:0 }}>Deliveries</h2>
      </div>
      <div style={{ marginBottom:16 }}>
        <select value={status} onChange={e => setStatus(e.target.value)}
          style={{ height:38, padding:'0 12px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:13, outline:'none', background:'#fff', fontFamily:'inherit' }}>
          <option value="">All Statuses</option>
          {['PENDING','ACCEPTED','PICKED_UP','IN_TRANSIT','DELIVERED','CANCELLED'].map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </select>
      </div>
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #f0f0f0', overflow:'hidden' }}>
        <Table columns={columns} data={data} loading={loading} emptyMsg="No deliveries found"/>
        <Pagination page={page} totalPages={total} onChange={p => { setPage(p); load(p); }}/>
      </div>
    </div>
  );
}