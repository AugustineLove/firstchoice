'use client';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Package, BarChart2,
  LogOut, Menu, ChevronLeft, Loader2, RefreshCw,
  Plus, Search, CheckCircle, XCircle, Clock, Pencil,
  Trash2, ChevronRight, TrendingUp, DollarSign,
  AlertCircle, Eye, ToggleLeft, ToggleRight, X, Save,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const BASE_URL = 'http://localhost:5000/api'
/* ── helpers ── */
function StatusBadge({ status }) {
  const MAP = {
    PENDING:          { color:'#92400e', bg:'#fef3c7' },
    ACCEPTED:         { color:'#065f46', bg:'#d1fae5' },
    PREPARING:        { color:'#1e40af', bg:'#dbeafe' },
    READY_FOR_PICKUP: { color:'#0369a1', bg:'#e0f2fe' },
    RIDER_ASSIGNED:   { color:'#5b21b6', bg:'#ede9fe' },
    PICKED_UP:        { color:'#1e40af', bg:'#dbeafe' },
    DELIVERED:        { color:'#065f46', bg:'#d1fae5' },
    CANCELLED:        { color:'#991b1b', bg:'#fee2e2' },
    ACTIVE:           { color:'#065f46', bg:'#d1fae5' },
    INACTIVE:         { color:'#374151', bg:'#f3f4f6' },
    PENDING_APPROVAL: { color:'#92400e', bg:'#fef3c7' },
  };
  const s = MAP[status] || { color:'#374151', bg:'#f3f4f6' };
  return (
    <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:50, background:s.bg, color:s.color, whiteSpace:'nowrap' }}>
      {status?.replace(/_/g,' ')}
    </span>
  );
}

function StatCard({ icon, label, value, sub, color, loading }) {
  return (
    <div style={{ background:'#fff', borderRadius:14, padding:'20px 22px', border:'1px solid #f0f0f0', boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
      <div style={{ width:40, height:40, borderRadius:10, background:color+'18', display:'flex', alignItems:'center', justifyContent:'center', color, marginBottom:14 }}>{icon}</div>
      {loading
        ? <div style={{ height:28, width:'55%', borderRadius:8, background:'#f3f4f6' }}/>
        : <div style={{ fontSize:26, fontWeight:900, color:'#0f1117', letterSpacing:'-1px' }}>{value ?? '—'}</div>
      }
      <div style={{ fontSize:13, color:'#6b7280', marginTop:4, fontWeight:600 }}>{label}</div>
      {sub && <div style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>{sub}</div>}
    </div>
  );
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#fff', borderRadius:18, padding:'28px 32px', width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
          <h3 style={{ fontSize:17, fontWeight:900, color:'#0f1117', margin:0 }}>{title}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:4 }}><X size={18}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const NAV = [
  { id:'overview',  label:'Overview',  icon:<LayoutDashboard size={18}/> },
  { id:'orders',    label:'Orders',    icon:<ShoppingBag size={18}/> },
  { id:'products',  label:'Products',  icon:<Package size={18}/> },
];

/* ══════════════════════════════════
   OVERVIEW
══════════════════════════════════ */
function Overview({ authFetch, theme, vendor }) {
  const [stats,   setStats]   = useState(null);
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, oRes] = await Promise.all([
        authFetch('/vendors/me/stats'),
        authFetch('/vendors/me/orders'),
      ]);
      const [s, o] = await Promise.all([sRes.json(), oRes.json()]);
      if (s.success) setStats(s.data);
      if (o.success) setOrders(o.data.slice(0, 5));
    } catch {}
    setLoading(false);
  }, [authFetch]);

  useEffect(() => { load(); }, [load]);

  const ORDER_ACTIONS = ['PENDING','ACCEPTED','PREPARING'];

  async function updateOrder(orderId, status) {
    try {
      await authFetch(`/vendors/me/orders/${orderId}/status`, { method:'PATCH', body: JSON.stringify({ status }) });
      load();
    } catch {}
  }
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:900, color:'#0f1117', margin:0 }}>
            {vendor?.businessName || 'Your Store'}
          </h2>
          <p style={{ color:'#6b7280', fontSize:14, margin:'4px 0 0' }}>
            {vendor?.status === 'ACTIVE' ? '🟢 Store is live' : vendor?.status === 'PENDING' ? '🟡 Pending admin approval' : '🔴 Store inactive'}
          </p>
        </div>
        <button onClick={load} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer', fontSize:13, fontWeight:600, color:'#374151' }}>
          <RefreshCw size={14}/> Refresh
        </button>
      </div>

      {vendor?.status !== 'ACTIVE' && (
        <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:12, padding:'14px 18px', marginBottom:24, fontSize:14, color:'#92400e', display:'flex', gap:10, alignItems:'flex-start' }}>
          <AlertCircle size={18} style={{ flexShrink:0, marginTop:1 }}/>
          <span>Your store is under review by the admin team. Once approved, you can set up your products and you'll go live.</span>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:14, marginBottom:28 }}>
        <StatCard loading={loading} icon={<ShoppingBag size={18}/>} label="Total Orders"     value={stats?.totalOrders}     color="#8b5cf6"/>
        <StatCard loading={loading} icon={<CheckCircle size={18}/>} label="Completed"        value={stats?.completedOrders} color="#10b981"/>
        <StatCard loading={loading} icon={<Clock size={18}/>}       label="Pending"          value={stats?.pendingOrders}   color="#f59e0b"/>
        <StatCard loading={loading} icon={<Package size={18}/>}     label="Products"         value={stats?.totalProducts}   color="#3b82f6"/>
        <StatCard loading={loading} icon={<DollarSign size={18}/>}  label="Total Revenue"    value={stats ? `GHS ${Number(stats.totalRevenue).toFixed(2)}` : null} color="#ec4899"/>
      </div>

      {/* Recent orders needing action */}
      {orders.filter(o => ORDER_ACTIONS.includes(o.orderStatus)).length > 0 && (
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #f0f0f0', padding:'20px 24px', marginBottom:16 }}>
          <h3 style={{ fontSize:15, fontWeight:800, color:'#0f1117', margin:'0 0 16px' }}>Orders Needing Action</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {orders.filter(o => ORDER_ACTIONS.includes(o.orderStatus)).map(o => (
              <div key={o.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:10, background:'#f9fafb', border:'1px solid #f0f0f0' }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, color:'#0f1117', fontSize:14 }}>{o.customer?.name}</div>
                  <div style={{ color:'#9ca3af', fontSize:12, marginTop:2 }}>GHS {Number(o.totalAmount).toFixed(2)} · {o.items?.length || 0} items</div>
                </div>
                <StatusBadge status={o.orderStatus}/>
                <div style={{ display:'flex', gap:6 }}>
                  {o.orderStatus === 'PENDING' && (
                    <button onClick={() => updateOrder(o.id, 'ACCEPTED')}
                      style={{ padding:'5px 12px', borderRadius:7, border:'1px solid #bbf7d0', background:'#f0fdf4', cursor:'pointer', fontSize:12, fontWeight:700, color:'#16a34a', display:'flex', alignItems:'center', gap:4 }}>
                      <CheckCircle size={12}/> Accept
                    </button>
                  )}
                  {o.orderStatus === 'ACCEPTED' && (
                    <button onClick={() => updateOrder(o.id, 'PREPARING')}
                      style={{ padding:'5px 12px', borderRadius:7, border:'1px solid #bfdbfe', background:'#eff6ff', cursor:'pointer', fontSize:12, fontWeight:700, color:'#1d4ed8', display:'flex', alignItems:'center', gap:4 }}>
                      Preparing
                    </button>
                  )}
                  {o.orderStatus === 'PREPARING' && (
                    <button onClick={() => updateOrder(o.id, 'READY_FOR_PICKUP')}
                      style={{ padding:'5px 12px', borderRadius:7, border:'1px solid #bae6fd', background:'#f0f9ff', cursor:'pointer', fontSize:12, fontWeight:700, color:'#0369a1', display:'flex', alignItems:'center', gap:4 }}>
                      Ready
                    </button>
                  )}
                  <button onClick={() => updateOrder(o.id, 'CANCELLED')}
                    style={{ padding:'5px 10px', borderRadius:7, border:'1px solid #fecaca', background:'#fef2f2', cursor:'pointer', fontSize:12, fontWeight:700, color:'#dc2626' }}>
                    <XCircle size={12}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════
   ORDERS
══════════════════════════════════ */
function Orders({ authFetch, theme }) {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [status,  setStatus]  = useState('');
  const [acting,  setActing]  = useState(null);

  const load = useCallback(async (s = status) => {
    setLoading(true);
    try {
      const res  = await authFetch('/vendors/me/orders');
      const json = await res.json();
      if (json.success) {
        const all = json.data;
        setData(s ? all.filter(o => o.orderStatus === s) : all);
      }
    } catch {}
    setLoading(false);
  }, [authFetch, status]);

  useEffect(() => { load(status); }, [status]);

  async function updateStatus(orderId, newStatus) {
    setActing(orderId);
    try {
      await authFetch(`/vendors/orders/${orderId}/status`, { method:'PATCH', body: JSON.stringify({ status: newStatus }) });
      load(status);
    } catch {}
    setActing(null);
  }

  const NEXT = { PENDING:'ACCEPTED', ACCEPTED:'PREPARING', PREPARING:'READY_FOR_PICKUP' };
  const NEXT_LABEL = { PENDING:'Accept', ACCEPTED:'Start Preparing', PREPARING:'Mark Ready' };

  return (
    <div>
      <h2 style={{ fontSize:22, fontWeight:900, color:'#0f1117', margin:'0 0 20px' }}>Orders</h2>
      <div style={{ marginBottom:16 }}>
        <select value={status} onChange={e => setStatus(e.target.value)}
          style={{ height:38, padding:'0 12px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:13, outline:'none', background:'#fff', fontFamily:'inherit' }}>
          <option value="">All</option>
          {['PENDING','ACCEPTED','PREPARING','READY_FOR_PICKUP','DELIVERED','CANCELLED'].map(s => (
            <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
          ))}
        </select>
      </div>
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #f0f0f0', overflow:'hidden' }}>
        {loading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:60, color:'#9ca3af', gap:10 }}>
            <Loader2 size={20} style={{ animation:'spin 1s linear infinite' }}/> Loading...
          </div>
        ) : !data.length ? (
          <div style={{ textAlign:'center', padding:60, color:'#9ca3af', fontSize:14 }}>No orders yet</div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ borderBottom:'2px solid #f3f4f6' }}>
                  {['Order','Customer','Items','Amount','Status','Action'].map(h => (
                    <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontWeight:700, color:'#6b7280', fontSize:11, textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map(o => (
                  <tr key={o.id} style={{ borderBottom:'1px solid #f9fafb' }}
                    onMouseEnter={e => e.currentTarget.style.background='#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'13px 16px' }}>
                      <span style={{ fontFamily:'monospace', fontSize:12, color:'#6b7280' }}>{o.id.slice(-8).toUpperCase()}</span>
                      <div style={{ fontSize:11, color:'#9ca3af' }}>{new Date(o.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td style={{ padding:'13px 16px' }}>
                      <div style={{ fontWeight:700, color:'#0f1117' }}>{o.customer?.name}</div>
                      <div style={{ color:'#9ca3af', fontSize:12 }}>{o.customer?.phone}</div>
                    </td>
                    <td style={{ padding:'13px 16px', color:'#374151' }}>
                      {o.items?.map(i => <div key={i.id} style={{ fontSize:12 }}>{i.product?.name} ×{i.quantity}</div>)}
                    </td>
                    <td style={{ padding:'13px 16px', fontWeight:700, color:'#10b981' }}>GHS {Number(o.totalAmount).toFixed(2)}</td>
                    <td style={{ padding:'13px 16px' }}><StatusBadge status={o.orderStatus}/></td>
                    <td style={{ padding:'13px 16px' }}>
                      {NEXT[o.orderStatus] && (
                        <button onClick={() => updateStatus(o.id, NEXT[o.orderStatus])} disabled={acting===o.id}
                          style={{ padding:'5px 12px', borderRadius:7, border:`1px solid ${theme.green}60`, background:`${theme.green}10`, cursor:'pointer', fontSize:12, fontWeight:700, color:theme.green, display:'flex', alignItems:'center', gap:4 }}>
                          {acting===o.id ? <Loader2 size={11} style={{ animation:'spin 1s linear infinite' }}/> : null}
                          {NEXT_LABEL[o.orderStatus]}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   PRODUCTS
══════════════════════════════════ */
function Products({ authFetch, theme }) {
  const { user, logout, loading: authLoading } = useAuth();
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [deleting,setDeleting]= useState(null);
  const [form, setForm] = useState({ name:'', description:'', price:'', stock:'', category:'', images:'' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await authFetch(`/products/vendor/${user.id}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch {}
    setLoading(false);
  }, [authFetch]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ name:'', description:'', price:'', stock:'', category:'', images:'' });
    setModal(true);
  }

  function openEdit(p) {
    setEditing(p);
    setForm({ name:p.name, description:p.description||'', price:String(p.price), stock:String(p.stock), category:p.category, images:(p.images||[]).join(', ') });
    setModal(true);
  }

  async function save() {
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: parseFloat(form.price),
        stock: parseInt(form.stock) || 0,
        category: form.category.trim(),
        images: form.images ? form.images.split(',').map(s => s.trim()).filter(Boolean) : [],
      };
      if (editing) {
        await authFetch(`/vendors/products/${editing.id}`, { method:'PATCH', body: JSON.stringify(body) });
      } else {
        await authFetch('/products', { method:'POST', body: JSON.stringify(body) });
      }
      setModal(false);
      load();
    } catch {}
    setSaving(false);
  }

  async function toggleAvail(p) {
    try {
      await authFetch(`/vendors/products/${p.id}`, { method:'PATCH', body: JSON.stringify({ available: !p.available }) });
      load();
    } catch {}
  }

  async function deleteProduct(id) {
    if (!window.confirm('Delete this product?')) return;
    setDeleting(id);
    try {
      await authFetch(`/vendors/products/${id}`, { method:'DELETE' });
      load();
    } catch {}
    setDeleting(null);
  }

  const filtered = data.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const inputStyle = { width:'100%', height:42, padding:'0 12px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit', transition:'border-color 0.2s' };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <h2 style={{ fontSize:22, fontWeight:900, color:'#0f1117', margin:0 }}>Products</h2>
        <button onClick={openCreate}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 18px', borderRadius:9, border:'none', background:`linear-gradient(135deg,${theme.green},${theme.greenMid})`, color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
          <Plus size={15}/> Add Product
        </button>
      </div>

      <div style={{ position:'relative', marginBottom:16, maxWidth:300 }}>
        <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }}/>
        <input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, paddingLeft:36, height:38 }}
          onFocus={e => e.target.style.borderColor = theme.green}
          onBlur={e => e.target.style.borderColor = '#e5e7eb'}/>
      </div>

      {loading ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:60, color:'#9ca3af', gap:10 }}>
          <Loader2 size={20} style={{ animation:'spin 1s linear infinite' }}/> Loading...
        </div>
      ) : !filtered.length ? (
        <div style={{ textAlign:'center', padding:60, color:'#9ca3af', fontSize:14 }}>
          {data.length === 0 ? 'No products yet — add your first one!' : 'No products match your search'}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:14 }}>
          {filtered.map(p => (
            <div key={p.id} style={{ background:'#fff', borderRadius:14, border:'1px solid #f0f0f0', overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
              {p.images?.[0] && (
                <div style={{ height:140, background:'#f9fafb', overflow:'hidden' }}>
                  <img src={p.images[0]} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { e.target.style.display='none'; }}/>
                </div>
              )}
              <div style={{ padding:'14px 16px' }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:6 }}>
                  <div style={{ fontWeight:800, fontSize:14, color:'#0f1117', flex:1 }}>{p.name}</div>
                  <span style={{ fontSize:12, fontWeight:700, padding:'2px 8px', borderRadius:50, background:'#f3f4f6', color:'#6b7280', whiteSpace:'nowrap' }}>{p.category}</span>
                </div>
                {p.description && <p style={{ fontSize:12, color:'#9ca3af', margin:'0 0 10px', lineHeight:1.5 }}>{p.description.slice(0,80)}{p.description.length>80?'…':''}</p>}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                  <span style={{ fontSize:16, fontWeight:900, color:'#10b981' }}>GHS {Number(p.price).toFixed(2)}</span>
                  <span style={{ fontSize:12, color: p.stock < 5 ? '#dc2626' : '#6b7280', fontWeight:600 }}>Stock: {p.stock}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <button onClick={() => toggleAvail(p)} title={p.available ? 'Deactivate' : 'Activate'}
                    style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:7, border:`1px solid ${p.available?'#bbf7d0':'#e5e7eb'}`, background: p.available?'#f0fdf4':'#f9fafb', cursor:'pointer', fontSize:12, fontWeight:700, color: p.available?'#16a34a':'#9ca3af' }}>
                    {p.available ? <ToggleRight size={14}/> : <ToggleLeft size={14}/>}
                    {p.available ? 'Live' : 'Off'}
                  </button>
                  <button onClick={() => openEdit(p)}
                    style={{ flex:1, padding:'5px 0', borderRadius:7, border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer', fontSize:12, fontWeight:700, color:'#374151', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                    <Pencil size={12}/> Edit
                  </button>
                  <button onClick={() => deleteProduct(p.id)} disabled={deleting===p.id}
                    style={{ padding:'5px 10px', borderRadius:7, border:'1px solid #fecaca', background:'#fef2f2', cursor:'pointer', color:'#dc2626', display:'flex', alignItems:'center' }}>
                    {deleting===p.id ? <Loader2 size={12} style={{ animation:'spin 1s linear infinite' }}/> : <Trash2 size={12}/>}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Product' : 'Add Product'}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {[
            { key:'name',        label:'Product Name *',     placeholder:'e.g. Jollof Rice' },
            { key:'category',    label:'Category *',         placeholder:'e.g. Main Dish' },
            { key:'price',       label:'Price (GHS) *',      placeholder:'e.g. 25.00', type:'number' },
            { key:'stock',       label:'Stock Quantity',     placeholder:'e.g. 50',    type:'number' },
            { key:'images',      label:'Image URLs (comma-separated)', placeholder:'https://...' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:5 }}>{f.label}</label>
              <input type={f.type||'text'} value={form[f.key]} placeholder={f.placeholder}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = theme.green}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}/>
            </div>
          ))}
          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:5 }}>Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Short description..." rows={3}
              style={{ ...inputStyle, height:'auto', padding:'10px 12px', resize:'vertical' }}
              onFocus={e => e.target.style.borderColor = theme.green}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}/>
          </div>
          <button onClick={save} disabled={saving || !form.name || !form.price || !form.category}
            style={{ height:46, borderRadius:10, border:'none', background: `linear-gradient(135deg,${theme.green},${theme.greenMid})`, color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:(!form.name||!form.price||!form.category)?0.5:1 }}>
            {saving ? <Loader2 size={15} style={{ animation:'spin 1s linear infinite' }}/> : <Save size={15}/>}
            {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Product'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

/* ══════════════════════════════════
   MAIN
══════════════════════════════════ */
export default function VendorDashboard() {
  const { user, logout, authFetch, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const navigate  = useNavigate();

  const [section,  setSection]  = useState('overview');
  const [sideOpen, setSideOpen] = useState(true);
  const [vendor,   setVendor]   = useState(null);

  useEffect(() => {
    if (!authLoading && (!user || !['VENDOR','ADMIN'].includes(user.role))) navigate('/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    authFetch('/vendors/me/profile').then(r => r.json()).then(j => { if (j.success) setVendor(j.data); }).catch(() => {});
  }, [user, authFetch]);

  if (authLoading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <Loader2 size={32} style={{ animation:'spin 1s linear infinite', color:theme.green }}/>
    </div>
  );
  if (!user) return null;

  const SECTIONS = {
    overview: <Overview authFetch={authFetch} theme={theme} vendor={vendor}/>,
    orders:   <Orders   authFetch={authFetch} theme={theme}/>,
    products: <Products authFetch={authFetch} theme={theme}/>,
  };

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f8faf8', fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <aside style={{ width:sideOpen?230:64, background:'#fff', borderRight:'1px solid #f0f0f0', display:'flex', flexDirection:'column', transition:'width 0.25s', overflow:'hidden', flexShrink:0, position:'sticky', top:0, height:'100vh', zIndex:100 }}>
        <div style={{ padding:sideOpen?'22px 18px 18px':'22px 12px 18px', borderBottom:'1px solid #f0f0f0', display:'flex', alignItems:'center', justifyContent:sideOpen?'space-between':'center' }}>
          {sideOpen && (
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:9, background:`linear-gradient(135deg,${theme.green},${theme.greenMid})`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:14 }}>V</div>
              <div>
                <div style={{ fontWeight:900, fontSize:13, color:'#0f1117' }}>Vendor</div>
                <div style={{ fontSize:10, color:'#9ca3af', fontWeight:600 }}>Dashboard</div>
              </div>
            </div>
          )}
          <button onClick={() => setSideOpen(!sideOpen)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:4, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center' }}>
            {sideOpen ? <ChevronLeft size={15}/> : <Menu size={15}/>}
          </button>
        </div>
        <nav style={{ flex:1, padding:'10px 8px', display:'flex', flexDirection:'column', gap:2 }}>
          {NAV.map(item => {
            const active = section === item.id;
            return (
              <button key={item.id} onClick={() => setSection(item.id)} title={!sideOpen ? item.label : undefined}
                style={{ display:'flex', alignItems:'center', gap:10, padding:sideOpen?'9px 12px':'9px 0', justifyContent:sideOpen?'flex-start':'center', borderRadius:9, border:'none', cursor:'pointer', background:active?`${theme.green}15`:'transparent', color:active?theme.green:'#6b7280', fontWeight:active?700:600, fontSize:13, transition:'all 0.15s', width:'100%', fontFamily:'inherit' }}>
                <span style={{ color:active?theme.green:'#9ca3af', flexShrink:0 }}>{item.icon}</span>
                {sideOpen && item.label}
              </button>
            );
          })}
        </nav>
        <div style={{ padding:sideOpen?'14px 12px':'14px 8px', borderTop:'1px solid #f0f0f0' }}>
          {sideOpen ? (
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:32, height:32, borderRadius:9, background:`${theme.green}20`, display:'flex', alignItems:'center', justifyContent:'center', color:theme.green, fontWeight:900, fontSize:13, flexShrink:0 }}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:12, color:'#0f1117', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user.name}</div>
                <div style={{ fontSize:10, color:'#9ca3af' }}>Vendor</div>
              </div>
              <button onClick={() => { logout(); navigate('/login'); }} title="Logout"
                style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:4 }}>
                <LogOut size={14}/>
              </button>
            </div>
          ) : (
            <button onClick={() => { logout(); navigate('/login'); }} title="Logout"
              style={{ width:'100%', background:'none', border:'none', cursor:'pointer', color:'#9ca3af', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <LogOut size={15}/>
            </button>
          )}
        </div>
      </aside>

      <main style={{ flex:1, padding:'30px 26px', overflowY:'auto', minWidth:0 }}>
        {SECTIONS[section]}
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width:640px) { main { padding: 18px 14px !important; } }
      `}</style>
    </div>
  );
}