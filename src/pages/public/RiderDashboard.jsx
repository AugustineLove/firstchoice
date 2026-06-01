'use client';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Truck, History, LogOut, Menu,
  ChevronLeft, Loader2, RefreshCw, Navigation,
  MapPin, Phone, CheckCircle, XCircle, Package,
  DollarSign, Star, ToggleLeft, ToggleRight,
  ChevronRight, AlertCircle, Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

function StatusBadge({ status }) {
  const MAP = {
    ONLINE:      { color:'#065f46', bg:'#d1fae5' },
    OFFLINE:     { color:'#374151', bg:'#f3f4f6' },
    BUSY:        { color:'#1e40af', bg:'#dbeafe' },
    PENDING:     { color:'#92400e', bg:'#fef3c7' },
    ACCEPTED:    { color:'#065f46', bg:'#d1fae5' },
    PICKED_UP:   { color:'#1e40af', bg:'#dbeafe' },
    IN_TRANSIT:  { color:'#1e40af', bg:'#dbeafe' },
    DELIVERED:   { color:'#065f46', bg:'#d1fae5' },
    CANCELLED:   { color:'#991b1b', bg:'#fee2e2' },
    RIDER_ASSIGNED: { color:'#5b21b6', bg:'#ede9fe' },
  };
  const s = MAP[status] || { color:'#374151', bg:'#f3f4f6' };
  return <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:50, background:s.bg, color:s.color, whiteSpace:'nowrap' }}>{status?.replace(/_/g,' ')}</span>;
}

function StatCard({ icon, label, value, color, loading }) {
  return (
    <div style={{ background:'#fff', borderRadius:14, padding:'18px 20px', border:'1px solid #f0f0f0', boxShadow:'0 2px 10px rgba(0,0,0,0.04)' }}>
      <div style={{ width:38, height:38, borderRadius:10, background:color+'18', display:'flex', alignItems:'center', justifyContent:'center', color, marginBottom:12 }}>{icon}</div>
      {loading ? <div style={{ height:26, width:'50%', borderRadius:6, background:'#f3f4f6' }}/> : <div style={{ fontSize:24, fontWeight:900, color:'#0f1117', letterSpacing:'-0.5px' }}>{value ?? '—'}</div>}
      <div style={{ fontSize:12, color:'#6b7280', marginTop:3, fontWeight:600 }}>{label}</div>
    </div>
  );
}

const NAV = [
  { id:'overview',  label:'Overview',       icon:<LayoutDashboard size={18}/> },
  { id:'active',    label:'Active Jobs',    icon:<Truck size={18}/> },
  { id:'history',   label:'Job History',    icon:<History size={18}/> },
];

/* ══════════════════════════════════
   OVERVIEW
══════════════════════════════════ */
function Overview({ authFetch, theme, rider, reloadRider }) {
  const [earnings, setEarnings] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [toggling, setToggling] = useState(false);
  const [locating, setLocating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await authFetch('/riders/me/earnings');
      const json = await res.json();
      if (json.success) setEarnings(json.data);
    } catch {}
    setLoading(false);
  }, [authFetch]);

  useEffect(() => { load(); }, [load]);

  async function toggleAvailability() {
    setToggling(true);
    const next = rider?.availability === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    try {
      await authFetch('/riders/me/availability', { method:'PATCH', body: JSON.stringify({ availability: next }) });
      reloadRider();
    } catch {}
    setToggling(false);
  }

  function shareLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          await authFetch('/riders/me/location', { method:'PATCH', body: JSON.stringify({ latitude: coords.latitude, longitude: coords.longitude }) });
          reloadRider();
        } catch {}
        setLocating(false);
      },
      () => setLocating(false)
    );
  }

  const isOnline = rider?.availability === 'ONLINE';

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:900, color:'#0f1117', margin:0 }}>Rider Dashboard</h2>
          <p style={{ color:'#6b7280', fontSize:14, margin:'4px 0 0' }}>Manage your deliveries & earnings</p>
        </div>
        <button onClick={load} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8, border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer', fontSize:13, fontWeight:600, color:'#374151' }}>
          <RefreshCw size={13}/> Refresh
        </button>
      </div>

      {/* Availability toggle — prominent */}
      <div style={{ background: isOnline ? '#f0fdf4' : '#f9fafb', border:`2px solid ${isOnline?'#bbf7d0':'#e5e7eb'}`, borderRadius:16, padding:'20px 24px', marginBottom:24, display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>
        <div>
          <div style={{ fontWeight:800, fontSize:16, color:'#0f1117', marginBottom:4 }}>
            {isOnline ? '🟢 You are Online' : '⚫ You are Offline'}
          </div>
          <div style={{ fontSize:13, color:'#6b7280' }}>
            {isOnline ? 'You\'re visible to dispatchers and can receive jobs' : 'Go online to start receiving delivery jobs'}
          </div>
        </div>
        <button onClick={toggleAvailability} disabled={toggling}
          style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 22px', borderRadius:10, border:'none', background: isOnline ? '#dc2626' : theme.green, color:'#fff', fontWeight:700, fontSize:14, cursor:toggling?'not-allowed':'pointer', fontFamily:'inherit', flexShrink:0 }}>
          {toggling ? <Loader2 size={15} style={{ animation:'spin 1s linear infinite' }}/> : isOnline ? <ToggleRight size={16}/> : <ToggleLeft size={16}/>}
          {toggling ? 'Updating...' : isOnline ? 'Go Offline' : 'Go Online'}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:14, marginBottom:24 }}>
        <StatCard loading={loading} icon={<DollarSign size={17}/>} label="Total Earnings"  value={`GHS ${Number(earnings?.totalEarnings||0).toFixed(2)}`}  color="#10b981"/>
        <StatCard loading={loading} icon={<Truck size={17}/>}       label="Total Deliveries" value={earnings?.totalDeliveries}  color="#3b82f6"/>
        <StatCard loading={loading} icon={<CheckCircle size={17}/>} label="Completed Orders" value={earnings?.completedOrders}  color="#8b5cf6"/>
        <StatCard loading={loading} icon={<Star size={17}/>}        label="Rating"           value={rider?.rating ? `⭐ ${Number(rider.rating).toFixed(1)}` : '—'} color="#f59e0b"/>
      </div>

      {/* Location card */}
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #f0f0f0', padding:'18px 22px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <h3 style={{ fontSize:14, fontWeight:800, color:'#0f1117', margin:0 }}>Current Location</h3>
          <button onClick={shareLocation} disabled={locating}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:8, border:`1px solid ${theme.green}50`, background:`${theme.green}0d`, color:theme.green, fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
            {locating ? <Loader2 size={13} style={{ animation:'spin 1s linear infinite' }}/> : <Navigation size={13}/>}
            {locating ? 'Locating...' : 'Update'}
          </button>
        </div>
        {rider?.currentLatitude ? (
          <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, color:'#374151' }}>
            <MapPin size={16} style={{ color:'#3b82f6' }}/>
            <span style={{ fontFamily:'monospace' }}>{Number(rider.currentLatitude).toFixed(5)}, {Number(rider.currentLongitude).toFixed(5)}</span>
          </div>
        ) : (
          <div style={{ color:'#9ca3af', fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
            <AlertCircle size={15}/> No location set — dispatchers prefer riders with live location
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   ACTIVE JOBS
══════════════════════════════════ */
function ActiveJobs({ authFetch, theme }) {
  const [jobs,    setJobs]    = useState({ activeOrders:[], activeDeliveries:[] });
  const [loading, setLoading] = useState(true);
  const [acting,  setActing]  = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await authFetch('/riders/me/jobs');
      const json = await res.json();
      if (json.success) setJobs(json.data);
    } catch {}
    setLoading(false);
  }, [authFetch]);

  useEffect(() => { load(); }, [load]);

  async function updateOrder(orderId, status) {
    setActing(orderId);
    try {
      await authFetch(`/orders/${orderId}/status`, { method:'PATCH', body: JSON.stringify({ status }) });
      load();
    } catch {}
    setActing(null);
  }

  async function updateDelivery(deliveryId, status) {
    setActing(deliveryId);
    try {
      await authFetch(`/deliveries/${deliveryId}/status`, { method:'PATCH', body: JSON.stringify({ status }) });
      load();
    } catch {}
    setActing(null);
  }

  const totalActive = jobs.activeOrders.length + jobs.activeDeliveries.length;

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:80, color:'#9ca3af', gap:10 }}>
      <Loader2 size={20} style={{ animation:'spin 1s linear infinite' }}/> Loading...
    </div>
  );

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <h2 style={{ fontSize:22, fontWeight:900, color:'#0f1117', margin:0 }}>Active Jobs
          {totalActive > 0 && <span style={{ marginLeft:10, fontSize:14, fontWeight:700, padding:'2px 10px', borderRadius:50, background:`${theme.green}18`, color:theme.green }}>{totalActive}</span>}
        </h2>
        <button onClick={load} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer', fontSize:13, fontWeight:600, color:'#374151' }}>
          <RefreshCw size={13}/> Refresh
        </button>
      </div>

      {totalActive === 0 && (
        <div style={{ textAlign:'center', padding:'60px 20px', color:'#9ca3af' }}>
          <Truck size={36} style={{ marginBottom:12, opacity:0.4 }}/>
          <div style={{ fontSize:15, fontWeight:600 }}>No active jobs</div>
          <div style={{ fontSize:13, marginTop:4 }}>Make sure you're online to receive assignments</div>
        </div>
      )}

      {/* Order deliveries */}
      {jobs.activeOrders.map(o => (
        <div key={o.id} style={{ background:'#fff', borderRadius:14, border:'1px solid #f0f0f0', padding:'18px 22px', marginBottom:12, boxShadow:'0 2px 10px rgba(0,0,0,0.04)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:34, height:34, borderRadius:9, background:'#ede9fe', display:'flex', alignItems:'center', justifyContent:'center', color:'#7c3aed' }}><Package size={16}/></div>
              <div>
                <div style={{ fontWeight:800, fontSize:14, color:'#0f1117' }}>Order Delivery</div>
                <div style={{ fontSize:12, color:'#9ca3af', fontFamily:'monospace' }}>{o.id.slice(-8).toUpperCase()}</div>
              </div>
            </div>
            <StatusBadge status={o.orderStatus}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
            <div style={{ background:'#f9fafb', borderRadius:9, padding:'10px 12px' }}>
              <div style={{ fontSize:11, color:'#9ca3af', fontWeight:700, marginBottom:4 }}>PICK UP FROM</div>
              <div style={{ fontWeight:700, fontSize:13, color:'#0f1117' }}>{o.vendor?.businessName}</div>
              <div style={{ fontSize:12, color:'#6b7280' }}>{o.vendor?.address}</div>
            </div>
            <div style={{ background:'#f9fafb', borderRadius:9, padding:'10px 12px' }}>
              <div style={{ fontSize:11, color:'#9ca3af', fontWeight:700, marginBottom:4 }}>DELIVER TO</div>
              <div style={{ fontWeight:700, fontSize:13, color:'#0f1117' }}>{o.customer?.name}</div>
              <div style={{ fontSize:12, color:'#6b7280' }}>{o.deliveryAddress}</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <a href={`tel:${o.customer?.phone}`} style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#3b82f6', textDecoration:'none', fontWeight:600 }}>
              <Phone size={13}/> {o.customer?.phone}
            </a>
            <div style={{ display:'flex', gap:8 }}>
              {o.orderStatus === 'RIDER_ASSIGNED' && (
                <button onClick={() => updateOrder(o.id, 'PICKED_UP')} disabled={acting===o.id}
                  style={{ padding:'7px 16px', borderRadius:8, border:'none', background:theme.green, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6 }}>
                  {acting===o.id ? <Loader2 size={13} style={{ animation:'spin 1s linear infinite' }}/> : <CheckCircle size={13}/>} Picked Up
                </button>
              )}
              {o.orderStatus === 'PICKED_UP' && (
                <button onClick={() => updateOrder(o.id, 'DELIVERED')} disabled={acting===o.id}
                  style={{ padding:'7px 16px', borderRadius:8, border:'none', background:theme.green, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6 }}>
                  {acting===o.id ? <Loader2 size={13} style={{ animation:'spin 1s linear infinite' }}/> : <CheckCircle size={13}/>} Delivered
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Standalone deliveries */}
      {jobs.activeDeliveries.map(d => (
        <div key={d.id} style={{ background:'#fff', borderRadius:14, border:'1px solid #f0f0f0', padding:'18px 22px', marginBottom:12, boxShadow:'0 2px 10px rgba(0,0,0,0.04)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:34, height:34, borderRadius:9, background:'#dbeafe', display:'flex', alignItems:'center', justifyContent:'center', color:'#1d4ed8' }}><Truck size={16}/></div>
              <div>
                <div style={{ fontWeight:800, fontSize:14, color:'#0f1117' }}>Package Delivery</div>
                <div style={{ fontSize:12, color:'#9ca3af', fontFamily:'monospace' }}>{d.id.slice(-8).toUpperCase()}</div>
              </div>
            </div>
            <StatusBadge status={d.status}/>
          </div>
          <div style={{ background:'#f9fafb', borderRadius:9, padding:'10px 12px', marginBottom:12 }}>
            <div style={{ fontSize:12, color:'#6b7280', marginBottom:6 }}>📦 {d.itemDescription}</div>
            <div style={{ display:'flex', gap:16, fontSize:13 }}>
              <span><span style={{ color:'#9ca3af' }}>From: </span><strong>{d.pickupAddress}</strong></span>
              <span><span style={{ color:'#9ca3af' }}>To: </span><strong>{d.destinationAddress}</strong></span>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <span style={{ fontSize:13, fontWeight:700, color:'#10b981' }}>GHS {d.estimatedFee}</span>
              <a href={`tel:${d.customer?.phone}`} style={{ marginLeft:16, display:'inline-flex', alignItems:'center', gap:5, fontSize:13, color:'#3b82f6', textDecoration:'none', fontWeight:600 }}>
                <Phone size={13}/> {d.customer?.phone}
              </a>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              {d.status === 'ACCEPTED' && (
                <button onClick={() => updateDelivery(d.id, 'PICKED_UP')} disabled={acting===d.id}
                  style={{ padding:'7px 16px', borderRadius:8, border:'none', background:theme.green, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                  Picked Up
                </button>
              )}
              {d.status === 'PICKED_UP' && (
                <button onClick={() => updateDelivery(d.id, 'IN_TRANSIT')} disabled={acting===d.id}
                  style={{ padding:'7px 16px', borderRadius:8, border:'none', background:'#3b82f6', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                  In Transit
                </button>
              )}
              {d.status === 'IN_TRANSIT' && (
                <button onClick={() => updateDelivery(d.id, 'DELIVERED')} disabled={acting===d.id}
                  style={{ padding:'7px 16px', borderRadius:8, border:'none', background:theme.green, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                  {acting===d.id ? <Loader2 size={13} style={{ animation:'spin 1s linear infinite' }}/> : null} Delivered
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════
   HISTORY
══════════════════════════════════ */
function JobHistory({ authFetch, theme }) {
  const [orders,    setOrders]    = useState([]);
  const [deliveries,setDeliveries]= useState([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('orders');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      authFetch('/orders?role=rider').then(r => r.json()),
      authFetch('/deliveries?role=rider').then(r => r.json()),
    ]).then(([o, d]) => {
      if (o.success) setOrders(o.data.orders.filter(x => x.orderStatus === 'DELIVERED'));
      if (d.success) setDeliveries(d.data.deliveries.filter(x => x.status === 'DELIVERED'));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [authFetch]);

  const data = tab === 'orders' ? orders : deliveries;

  return (
    <div>
      <h2 style={{ fontSize:22, fontWeight:900, color:'#0f1117', margin:'0 0 20px' }}>Job History</h2>
      <div style={{ display:'flex', gap:2, background:'#f3f4f6', borderRadius:10, padding:4, marginBottom:20, width:'fit-content' }}>
        {[['orders','Order Deliveries'],['deliveries','Package Deliveries']].map(([key,label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding:'7px 18px', borderRadius:8, border:'none', background:tab===key?'#fff':'transparent', fontWeight:tab===key?700:600, fontSize:13, color:tab===key?'#0f1117':'#9ca3af', cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s', boxShadow:tab===key?'0 1px 4px rgba(0,0,0,0.08)':'none' }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:60, color:'#9ca3af', gap:10 }}>
          <Loader2 size={20} style={{ animation:'spin 1s linear infinite' }}/> Loading...
        </div>
      ) : !data.length ? (
        <div style={{ textAlign:'center', padding:60, color:'#9ca3af', fontSize:14 }}>No completed {tab} yet</div>
      ) : (
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #f0f0f0', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ borderBottom:'2px solid #f3f4f6' }}>
                {tab === 'orders'
                  ? ['ID','Customer','Vendor','Amount','Date'].map(h => <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontWeight:700, color:'#6b7280', fontSize:11, textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>)
                  : ['ID','Customer','From','To','Fee','Date'].map(h => <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontWeight:700, color:'#6b7280', fontSize:11, textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>)
                }
              </tr>
            </thead>
            <tbody>
              {data.map((r, i) => (
                <tr key={i} style={{ borderBottom:'1px solid #f9fafb' }}
                  onMouseEnter={e => e.currentTarget.style.background='#fafafa'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  {tab === 'orders' ? <>
                    <td style={{ padding:'12px 16px', fontFamily:'monospace', fontSize:12, color:'#6b7280' }}>{r.id.slice(-8).toUpperCase()}</td>
                    <td style={{ padding:'12px 16px', fontWeight:600, color:'#0f1117' }}>{r.customer?.name}</td>
                    <td style={{ padding:'12px 16px', color:'#6b7280' }}>{r.vendor?.businessName}</td>
                    <td style={{ padding:'12px 16px', fontWeight:700, color:'#10b981' }}>GHS {Number(r.totalAmount).toFixed(2)}</td>
                    <td style={{ padding:'12px 16px', color:'#9ca3af' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                  </> : <>
                    <td style={{ padding:'12px 16px', fontFamily:'monospace', fontSize:12, color:'#6b7280' }}>{r.id.slice(-8).toUpperCase()}</td>
                    <td style={{ padding:'12px 16px', fontWeight:600, color:'#0f1117' }}>{r.customer?.name}</td>
                    <td style={{ padding:'12px 16px', color:'#6b7280', fontSize:12 }}>{r.pickupAddress}</td>
                    <td style={{ padding:'12px 16px', color:'#6b7280', fontSize:12 }}>{r.destinationAddress}</td>
                    <td style={{ padding:'12px 16px', fontWeight:700, color:'#10b981' }}>GHS {r.estimatedFee}</td>
                    <td style={{ padding:'12px 16px', color:'#9ca3af' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                  </>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════
   MAIN
══════════════════════════════════ */
export default function RiderDashboard() {
  const { user, logout, authFetch, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const navigate  = useNavigate();

  const [section,  setSection]  = useState('overview');
  const [sideOpen, setSideOpen] = useState(true);
  const [rider,    setRider]    = useState(null);

  useEffect(() => {
    if (!authLoading && (!user || !['RIDER','ADMIN'].includes(user.role))) navigate('/login');
  }, [user, authLoading, navigate]);

  const loadRider = useCallback(() => {
    if (!user) return;
    authFetch('/riders/me/profile').then(r => r.json()).then(j => { if (j.success) setRider(j.data); }).catch(() => {});
  }, [user, authFetch]);

  useEffect(() => { loadRider(); }, [loadRider]);

  if (authLoading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <Loader2 size={32} style={{ animation:'spin 1s linear infinite', color:theme.green }}/>
    </div>
  );
  if (!user) return null;

  const SECTIONS = {
    overview: <Overview authFetch={authFetch} theme={theme} rider={rider} reloadRider={loadRider}/>,
    active:   <ActiveJobs authFetch={authFetch} theme={theme}/>,
    history:  <JobHistory authFetch={authFetch} theme={theme}/>,
  };

  const isOnline = rider?.availability === 'ONLINE';

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f8faf8', fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <aside style={{ width:sideOpen?230:64, background:'#fff', borderRight:'1px solid #f0f0f0', display:'flex', flexDirection:'column', transition:'width 0.25s', overflow:'hidden', flexShrink:0, position:'sticky', top:0, height:'100vh', zIndex:100 }}>
        <div style={{ padding:sideOpen?'22px 18px 18px':'22px 12px 18px', borderBottom:'1px solid #f0f0f0', display:'flex', alignItems:'center', justifyContent:sideOpen?'space-between':'center' }}>
          {sideOpen && (
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:9, background:`linear-gradient(135deg,${theme.green},${theme.greenMid})`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:14 }}>R</div>
              <div>
                <div style={{ fontWeight:900, fontSize:13, color:'#0f1117' }}>Rider</div>
                <div style={{ fontSize:10, color:'#9ca3af', fontWeight:600 }}>Dashboard</div>
              </div>
            </div>
          )}
          <button onClick={() => setSideOpen(!sideOpen)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:4, borderRadius:6, display:'flex' }}>
            {sideOpen ? <ChevronLeft size={15}/> : <Menu size={15}/>}
          </button>
        </div>

        {/* Online indicator */}
        {sideOpen && (
          <div style={{ margin:'10px 10px 0', padding:'8px 12px', borderRadius:9, background: isOnline?'#f0fdf4':'#f9fafb', border:`1px solid ${isOnline?'#bbf7d0':'#e5e7eb'}`, display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:isOnline?'#16a34a':'#9ca3af', flexShrink:0 }}/>
            <span style={{ fontSize:12, fontWeight:700, color:isOnline?'#15803d':'#9ca3af' }}>{isOnline?'Online':'Offline'}</span>
          </div>
        )}

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
                <div style={{ fontSize:10, color:'#9ca3af' }}>Rider</div>
              </div>
              <button onClick={() => { logout(); navigate('/login'); }} title="Logout"
                style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:4 }}>
                <LogOut size={14}/>
              </button>
            </div>
          ) : (
            <button onClick={() => { logout(); navigate('/login'); }} style={{ width:'100%', background:'none', border:'none', cursor:'pointer', color:'#9ca3af', display:'flex', alignItems:'center', justifyContent:'center' }}>
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