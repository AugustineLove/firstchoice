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
import { fieldStyle, fmtGHS, Pagination, StatCard, Table, StatusBadge, PRODUCT_CATEGORY_EMOJI } from '../../pages/public/AdminDashboard';
import { VendorManageModal } from './VendorManageModal';
import { VendorFormModal } from './VendorFormModal';

export function VendorsSection({ authFetch, theme }) {
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

        modalTarget === 'new' ? (
          <VendorFormModal
            vendor={null}
            authFetch={authFetch}
            theme={theme}
            onClose={() => setModalTarget(null)}
            onSaved={() => load(page)}
          />
        ) : (
          <VendorManageModal
            vendor={modalTarget}
            authFetch={authFetch}
            theme={theme}
            onClose={() => setModalTarget(null)}
            onChanged={() => load(page)}
          />
        )
       )}
    </div>
  );
}