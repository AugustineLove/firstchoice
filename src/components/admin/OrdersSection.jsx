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
import { fieldStyle, fmtGHS, Pagination, StatCard, Table } from '../../pages/public/AdminDashboard';
import { StatusBadge } from '../../pages/public/AdminDashboard';
import { OrderDetailModal } from './OrderDetailModal';

export function OrdersSection({ authFetch, theme }) {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const [status,  setStatus]  = useState('');

  /* Available riders for assignment */
  const [riders,  setRiders]  = useState([]);
  const [assigning, setAssigning] = useState(null);
  const [selectedRider, setSelectedRider] = useState({});
  const [viewOrderId, setViewOrderId] = useState(null);

  const load = useCallback(async (p=1, s=status) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page:p, limit:15, ...(s&&{status:s}) });
      const res = await authFetch(`/orders?${params}`);
      const json = await res.json();
      if (json.success) { setData(json.data.orders); setTotal(json.data.pagination.totalPages); }
    } catch {}
    setLoading(false);
  }, [authFetch, status]);

  useEffect(() => { load(1, status); }, [status]);

  useEffect(() => {
    authFetch('/riders/available').then(r => r.json()).then(j => {
      if (j.success) setRiders(j.data);
    }).catch(() => {});
  }, [authFetch]);

  async function assignRider(orderId) {
    const riderId = selectedRider[orderId];
    if (!riderId) return;
    setAssigning(orderId);
    try {
      await authFetch(`/admin/orders/${orderId}/assign`, { method:'PATCH', body: JSON.stringify({ riderId }) });
      load(page);
    } catch {}
    setAssigning(null);
  }

  const columns = [
    { key:'id',     label:'Order ID',  render: r => <span style={{ fontFamily:'monospace', fontSize:12, color:'#6b7280' }}>{r.id.slice(-8).toUpperCase()}</span> },
    { key:'customer', label:'Customer', render: r => <div><div style={{ fontWeight:700 }}>{r.customer?.name}</div><div style={{ color:'#9ca3af', fontSize:12 }}>{r.customer?.phone}</div></div> },
    { key:'vendor',   label:'Vendor',   render: r => <span style={{ fontWeight:600 }}>{r.vendor?.businessName}</span> },
    { key:'amount',   label:'Amount',   render: r => <span style={{ fontWeight:700, color:'#10b981' }}>GHS {r.totalAmount?.toFixed(2)}</span> },
    { key:'status',   label:'Status',   render: r => <StatusBadge status={r.orderStatus}/> },
    { key:'rider',    label:'Rider',    render: r => r.rider ? <span style={{ color:'#3b82f6', fontWeight:600 }}>{r.rider.user?.name}</span> : <span style={{ color:'#9ca3af' }}>Unassigned</span> },
    { key:'date',     label:'Date',     render: r => new Date(r.createdAt).toLocaleString() },
    { key:'assign', label:'Rider', render: r => {
  const assignable = ['PENDING','RIDER_ASSIGNED','PICKED_UP','IN_TRANSIT','ARRIVED'].includes(r.orderStatus);
  if (!assignable) return null;
  const isReassign = !!r.rider;
  return (
    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
      <select value={selectedRider[r.id]||''} onChange={e => setSelectedRider(p => ({...p,[r.id]:e.target.value}))}
        style={{ height:30, padding:'0 8px', border:'1px solid #e5e7eb', borderRadius:6, fontSize:12, outline:'none', background:'#fff', maxWidth:130 }}>
        <option value="">{isReassign ? 'Reassign to…' : 'Select rider'}</option>
        {riders.map(rd => <option key={rd.id} value={rd.id}>{rd.user?.name}</option>)}
      </select>
      <button onClick={() => assignRider(r.id)} disabled={!selectedRider[r.id] || assigning===r.id}
        style={{ padding:'5px 10px', borderRadius:6, border:'none', background: isReassign ? '#3b82f6' : theme.green, color:'#fff', cursor:'pointer', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', gap:4, opacity: !selectedRider[r.id]?0.5:1 }}>
        {assigning===r.id ? <Loader2 size={11} style={{ animation:'spin 1s linear infinite' }}/> : null} {isReassign ? 'Swap' : 'Go'}
      </button>
    </div>
  );
}},
     { key:'view', label:'', render: r => (
      <button onClick={() => setViewOrderId(r.id)}
        style={{ padding:'5px 10px', borderRadius:6, border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer', fontSize:11, fontWeight:700, color:'#374151', display:'flex', alignItems:'center', gap:4 }}>
        <Eye size={11}/> View
      </button>
   )},
  ];

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <h2 style={{ fontSize:22, fontWeight:900, color:'#0f1117', margin:0 }}>Orders</h2>
      </div>
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <select value={status} onChange={e => setStatus(e.target.value)}
          style={{ height:38, padding:'0 12px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:13, outline:'none', background:'#fff', fontFamily:'inherit' }}>
          <option value="">All Statuses</option>
          {['PENDING','ACCEPTED','PREPARING','READY_FOR_PICKUP','RIDER_ASSIGNED','PICKED_UP', 'ARRIVED', 'DELIVERED','CANCELLED'].map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </select>
      </div>
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #f0f0f0', overflow:'hidden' }}>
        <Table columns={columns} data={data} loading={loading} emptyMsg="No orders found"/>
        <Pagination page={page} totalPages={total} onChange={p => { setPage(p); load(p); }}/>
      </div>
      {viewOrderId && (
       <OrderDetailModal
          orderId={viewOrderId}
          authFetch={authFetch}
          theme={theme}
          riders={riders}
          onClose={() => setViewOrderId(null)}
          onChanged={() => load(page)}
        />
      )}
    </div>
  );
}