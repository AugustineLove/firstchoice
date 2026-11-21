'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Package, LogOut, Menu, ChevronLeft,
  Loader2, RefreshCw, Plus, Search, CheckCircle, XCircle, Clock,
  Pencil, Trash2, TrendingUp, DollarSign, AlertCircle, ToggleLeft,
  ToggleRight, X, Save, Store, ChevronDown, ChevronUp, ImagePlus,
  Tag, Layers, SlidersHorizontal, Info, Flame, Star, Eye, EyeOff,
  Hash, Weight, Droplets, Timer, Zap, Pill, Shirt, Smartphone,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Profile } from '../../components/vendor/profileSection';
import { Products } from '../../components/vendor/productsSection';
import { Orders } from '../../components/vendor/ordersSection';

/* ══════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════ */
export const CATEGORIES = ['Food','Grocery','Pharmacy','Boutique','Electronics','Drinks','Other'];

export const CATEGORY_ICONS = {
  Food: '🍛', Grocery: '🛒', Pharmacy: '💊',
  Boutique: '👗', Electronics: '📱', Drinks: '🥤', Other: '📦',
};

export const DIETARY_TAGS = ['Spicy','Vegan','Halal','Gluten-Free','Vegetarian','Dairy-Free','Keto','Organic'];

export const CATEGORY_FIELDS = {
  Food:        [{ key:'preparationTime', label:'Prep Time (min)', type:'number', icon:<Timer size={14}/> }, { key:'calories', label:'Calories (kcal)', type:'number', icon:<Flame size={14}/> }],
  Drinks:      [{ key:'volume', label:'Volume (ml)', type:'number', icon:<Droplets size={14}/> }, { key:'calories', label:'Calories (kcal)', type:'number', icon:<Flame size={14}/> }],
  Grocery:     [{ key:'weight', label:'Weight (g)', type:'number', icon:<Weight size={14}/> }, { key:'unit', label:'Unit (kg/pcs/pack)', type:'text', icon:<Hash size={14}/> }, { key:'brand', label:'Brand', type:'text', icon:<Tag size={14}/> }, { key:'expiryInfo', label:'Expiry Info', type:'text', icon:<Info size={14}/> }],
  Bakery:     [{ key:'weight', label:'Weight (g)', type:'number', icon:<Weight size={14}/> }, { key:'calories', label:'Calories (kcal)', type:'number', icon:<Flame size={14}/> }, { key:'expiryInfo', label:'Expiry Info', type:'text', icon:<Info size={14}/> }],
  Pharmacy:    [{ key:'brand', label:'Brand/Manufacturer', type:'text', icon:<Pill size={14}/> }, { key:'weight', label:'Weight (g)', type:'number', icon:<Weight size={14}/> }, { key:'volume', label:'Volume (ml)', type:'number', icon:<Droplets size={14}/> }, { key:'expiryInfo', label:'Expiry/Storage Info', type:'text', icon:<Info size={14}/> }],
  Boutique:    [{ key:'brand', label:'Brand', type:'text', icon:<Tag size={14}/> }, { key:'sku', label:'SKU / Product Code', type:'text', icon:<Hash size={14}/> }],
  Electronics: [{ key:'brand', label:'Brand', type:'text', icon:<Smartphone size={14}/> }, { key:'sku', label:'SKU / Model Number', type:'text', icon:<Hash size={14}/> }, { key:'weight', label:'Weight (g)', type:'number', icon:<Weight size={14}/> }],
};

/* ══════════════════════════════════════════
   SMALL HELPERS
══════════════════════════════════════════ */
export const STATUS_MAP = {
  PENDING:          { color:'#92400e', bg:'#fef3c7' },
  ACCEPTED:         { color:'#065f46', bg:'#d1fae5' },
  PREPARING:        { color:'#1e40af', bg:'#dbeafe' },
  READY_FOR_PICKUP: { color:'#0369a1', bg:'#e0f2fe' },
  RIDER_ASSIGNED:   { color:'#5b21b6', bg:'#ede9fe' },
  DELIVERED:        { color:'#065f46', bg:'#d1fae5' },
  CANCELLED:        { color:'#991b1b', bg:'#fee2e2' },
  ACTIVE:           { color:'#065f46', bg:'#d1fae5' },
  INACTIVE:         { color:'#374151', bg:'#f3f4f6' },
  PENDING_REVIEW:   { color:'#92400e', bg:'#fef3c7' },
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { color:'#374151', bg:'#f3f4f6' };
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
        ? <div style={{ height:28, width:'55%', borderRadius:8, background:'#f3f4f6', animation:'shimmer 1.5s infinite' }}/>
        : <div style={{ fontSize:26, fontWeight:900, color:'#0f1117', letterSpacing:'-1px' }}>{value ?? '—'}</div>
      }
      <div style={{ fontSize:13, color:'#6b7280', marginTop:4, fontWeight:600 }}>{label}</div>
      {sub && <div style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>{sub}</div>}
    </div>
  );
}

/* ── Input ── */
export function FInput({ label, value, onChange, type='text', placeholder='', required=false, hint='', min, step, textarea=false, rows=3, disabled=false }) {
  const [focused, setFocused] = useState(false);
  const base = {
    width:'100%', padding:'10px 12px', border:`1.5px solid ${focused ? '#16a34a' : '#e5e7eb'}`,
    borderRadius:10, fontSize:14, color:'#0f1117', background: disabled ? '#f9fafb' : '#fff',
    outline:'none', transition:'border-color 0.2s', boxSizing:'border-box', fontFamily:'inherit',
    resize: textarea ? 'vertical' : undefined,
  };
  return (
    <div>
      {label && (
        <label style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, fontWeight:700, color:'#374151', marginBottom:5 }}>
          {label}{required && <span style={{ color:'#dc2626' }}>*</span>}
        </label>
      )}
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} disabled={disabled}
            style={base} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}/>
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            min={min} step={step} disabled={disabled}
            style={{ ...base, height:42 }} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}/>
      }
      {hint && <p style={{ margin:'4px 0 0', fontSize:11, color:'#9ca3af' }}>{hint}</p>}
    </div>
  );
}

/* ── Section Divider for Modal ── */
export function ModalSection({ icon, title, subtitle, children, collapsible=false }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ border:'1.5px solid #f0f0f0', borderRadius:12, overflow:'hidden' }}>
      <div
        onClick={() => collapsible && setOpen(!open)}
        style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background:'#f9fafb', cursor: collapsible ? 'pointer' : 'default', userSelect:'none' }}>
        <div style={{ width:28, height:28, borderRadius:8, background:'#16a34a18', display:'flex', alignItems:'center', justifyContent:'center', color:'#16a34a' }}>{icon}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:800, color:'#0f1117' }}>{title}</div>
          {subtitle && <div style={{ fontSize:11, color:'#9ca3af', marginTop:1 }}>{subtitle}</div>}
        </div>
        {collapsible && (open ? <ChevronUp size={14} style={{ color:'#9ca3af' }}/> : <ChevronDown size={14} style={{ color:'#9ca3af' }}/>)}
      </div>
      {open && <div style={{ padding:'16px' }}>{children}</div>}
    </div>
  );
}

/* ══════════════════════════════════════════
   OVERVIEW
══════════════════════════════════════════ */
function Overview({ authFetch, theme, vendor }) {
  const [stats,   setStats]   = useState(null);
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, oRes] = await Promise.all([authFetch('/vendors/me/stats'), authFetch('/vendors/me/orders')]);
      const [s, o] = await Promise.all([sRes.json(), oRes.json()]);
      if (s.success) setStats(s.data);
      if (o.success) setOrders(o.data.slice(0, 6));
    } catch {}
    setLoading(false);
  }, [authFetch]);

  useEffect(() => { load(); }, [load]);

  async function updateOrder(orderId, status) {
    try {
      await authFetch(`/orders/${orderId}/status`, { method:'PATCH', body: JSON.stringify({ status }) });
      load();
    } catch {}
  }

  const actionableOrders = orders.filter(o => ['PENDING','ACCEPTED','PREPARING'].includes(o.orderStatus));

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:900, color:'#0f1117', margin:0 }}>{vendor?.businessName || 'Your Store'}</h2>
          <p style={{ color:'#6b7280', fontSize:14, margin:'4px 0 0' }}>
            {vendor?.status === 'ACTIVE' ? '🟢 Store is live' : vendor?.status === 'PENDING' ? '🟡 Pending admin approval' : '🔴 Store inactive'}
          </p>
        </div>
        <button onClick={load} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer', fontSize:13, fontWeight:600, color:'#374151', fontFamily:'inherit' }}>
          <RefreshCw size={14}/> Refresh
        </button>
      </div>

      {vendor?.status !== 'ACTIVE' && (
        <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:12, padding:'14px 18px', marginBottom:24, fontSize:14, color:'#92400e', display:'flex', gap:10 }}>
          <AlertCircle size={18} style={{ flexShrink:0, marginTop:1 }}/>
          Your store is under review. Once approved, your products will go live and customers can start ordering.
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:14, marginBottom:28 }}>
        <StatCard loading={loading} icon={<ShoppingBag size={18}/>} label="Total Orders"  value={stats?.totalOrders}     color="#8b5cf6"/>
        <StatCard loading={loading} icon={<CheckCircle size={18}/>} label="Completed"     value={stats?.completedOrders} color="#10b981"/>
        <StatCard loading={loading} icon={<Clock size={18}/>}       label="Pending"       value={stats?.pendingOrders}   color="#f59e0b"/>
        <StatCard loading={loading} icon={<Package size={18}/>}     label="Products"      value={stats?.totalProducts}   color="#3b82f6"/>
        <StatCard loading={loading} icon={<DollarSign size={18}/>}  label="Revenue (GHS)" value={stats ? Number(stats.totalRevenue).toFixed(0) : null} color="#ec4899"/>
      </div>

      {actionableOrders.length > 0 && (
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #f0f0f0', padding:'20px 24px', marginBottom:16 }}>
          <h3 style={{ fontSize:15, fontWeight:800, color:'#0f1117', margin:'0 0 16px', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:'#f59e0b', display:'inline-block', boxShadow:'0 0 0 3px #fde68a' }}/>
            Needs Your Action ({actionableOrders.length})
          </h3>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {actionableOrders.map(o => {
              const NEXT = { PENDING:'ACCEPTED', ACCEPTED:'PREPARING', PREPARING:'READY_FOR_PICKUP' };
              const NEXT_LABEL = { PENDING:'✓ Accept', ACCEPTED:'Start Preparing', PREPARING:'Mark Ready' };
              const NEXT_STYLE = {
                PENDING:   { border:'1px solid #bbf7d0', bg:'#f0fdf4', color:'#16a34a' },
                ACCEPTED:  { border:'1px solid #bfdbfe', bg:'#eff6ff', color:'#1d4ed8' },
                PREPARING: { border:'1px solid #bae6fd', bg:'#f0f9ff', color:'#0369a1' },
              };
              const ns = NEXT_STYLE[o.orderStatus] || {};
              return (
                <div key={o.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:10, background:'#f9fafb', border:'1px solid #f0f0f0' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, color:'#0f1117', fontSize:14 }}>{o.customer?.name}</div>
                    <div style={{ color:'#9ca3af', fontSize:12, marginTop:1 }}>
                      GHS {Number(o.totalAmount).toFixed(2)} · {o.items?.length || 0} item{o.items?.length !== 1 ? 's' : ''}
                      {o.items?.length > 0 && <span style={{ color:'#6b7280' }}> · {o.items.map(i=>i.product?.name).filter(Boolean).join(', ').slice(0,40)}</span>}
                    </div>
                  </div>
                  <StatusBadge status={o.orderStatus}/>
                  <div style={{ display:'flex', gap:6 }}>
                    {NEXT[o.orderStatus] && (
                      <button onClick={() => updateOrder(o.id, NEXT[o.orderStatus])}
                        style={{ padding:'5px 12px', borderRadius:7, border:ns.border, background:ns.bg, cursor:'pointer', fontSize:12, fontWeight:700, color:ns.color, fontFamily:'inherit' }}>
                        {NEXT_LABEL[o.orderStatus]}
                      </button>
                    )}
                    <button onClick={() => updateOrder(o.id, 'CANCELLED')}
                      style={{ padding:'5px 9px', borderRadius:7, border:'1px solid #fecaca', background:'#fef2f2', cursor:'pointer', color:'#dc2626', display:'flex', alignItems:'center' }}>
                      <XCircle size={13}/>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const NAV = [
  { id:'overview', label:'Overview', icon:<LayoutDashboard size={18}/> },
  { id:'orders',   label:'Orders',   icon:<ShoppingBag size={18}/> },
  { id:'products', label:'Products', icon:<Package size={18}/> },
  { id:'profile',  label:'Profile',  icon:<Store size={18}/> },
];

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
    profile:  <Profile  authFetch={authFetch} theme={theme} vendor={vendor} onVendorUpdate={setVendor}/>,
  };

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f8faf8', fontFamily:"'DM Sans',system-ui,sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <aside style={{ width:sideOpen?230:64, background:'#fff', borderRight:'1px solid #f0f0f0', display:'flex', flexDirection:'column', transition:'width 0.25s ease', overflow:'hidden', flexShrink:0, position:'sticky', top:0, height:'100vh', zIndex:100 }}>
        <div style={{ padding:sideOpen?'22px 18px 18px':'22px 12px 18px', borderBottom:'1px solid #f0f0f0', display:'flex', alignItems:'center', justifyContent:sideOpen?'space-between':'center' }}>
          {sideOpen && (
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:10, background:`linear-gradient(135deg,${theme.green},${theme.greenMid})`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:15 }}>
                {vendor?.businessName?.[0]?.toUpperCase() || 'V'}
              </div>
              <div>
                <div style={{ fontWeight:900, fontSize:13, color:'#0f1117', maxWidth:130, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {vendor?.businessName || 'Vendor'}
                </div>
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
                style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:4, display:'flex', alignItems:'center' }}>
                <LogOut size={14}/>
              </button>
            </div>
          ) : (
            <button onClick={() => { logout(); navigate('/login'); }} title="Logout"
              style={{ width:'100%', background:'none', border:'none', cursor:'pointer', color:'#9ca3af', display:'flex', alignItems:'center', justifyContent:'center', padding:'4px 0' }}>
              <LogOut size={15}/>
            </button>
          )}
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={{ flex:1, padding:'30px 28px', overflowY:'auto', minWidth:0 }}>
        {SECTIONS[section]}
      </main>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @media (max-width:640px) {
          main { padding: 18px 14px !important; }
          .profile-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}