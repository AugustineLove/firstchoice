'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, AlertTriangle, Clock, ShoppingBag, Truck, RefreshCw } from 'lucide-react';
import { fmtGHS } from '../../pages/public/AdminDashboard';

const URGENCY_STYLE = {
  stale: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Waiting 15+ min' },
  warn:  { color: '#b45309', bg: '#fffbeb', border: '#fde68a', label: 'Waiting 5+ min' },
  fresh: { color: '#6b7280', bg: '#f9fafb', border: '#f0f0f0', label: 'Just in' },
};

const POLL_MS = 20000;

export function DispatchQueueWidget({ authFetch, theme }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [riders, setRiders]   = useState([]);
  const [selectedRider, setSelectedRider] = useState({});
  const [assigning, setAssigning] = useState(null);
  const timerRef = useRef(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await authFetch('/admin/dispatch/queue');
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch {}
    if (!silent) setLoading(false);
  }, [authFetch]);

  useEffect(() => {
    load();
    authFetch('/riders/available').then(r => r.json()).then(j => { if (j.success) setRiders(j.data); }).catch(() => {});
    timerRef.current = setInterval(() => load(true), POLL_MS);
    return () => clearInterval(timerRef.current);
  }, [load, authFetch]);

  async function assign(item) {
    const riderId = selectedRider[item.id];
    if (!riderId) return;
    setAssigning(item.id);
    try {
      const endpoint = item.kind === 'order'
        ? `/admin/orders/${item.id}/assign`
        : `/deliveries/${item.id}/assign`;
      await authFetch(endpoint, { method: 'PATCH', body: JSON.stringify({ riderId }) });
      load(true);
    } catch {}
    setAssigning(null);
  }

  if (loading && !data) {
    return (
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #f0f0f0', padding:40, display:'flex', justifyContent:'center' }}>
        <Loader2 size={22} style={{ animation:'spin 1s linear infinite', color: theme.green }}/>
      </div>
    );
  }

  if (!data) return null;
  const { items, staleCount, warnCount, totalPending } = data;

  return (
    <div style={{ background:'#fff', borderRadius:14, border:'1px solid #f0f0f0', overflow:'hidden', marginBottom:22 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom: items.length ? '1px solid #f0f0f0' : 'none' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:9, background: staleCount ? '#fef2f2' : '#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <AlertTriangle size={16} color={staleCount ? '#dc2626' : theme.green} />
          </div>
          <div>
            <div style={{ fontWeight:900, fontSize:15, color:'#0f1117' }}>Queue</div>
            <div style={{ fontSize:12, color:'#9ca3af' }}>
              {totalPending === 0 ? 'Nothing waiting — all clear' : `${totalPending} unassigned${staleCount ? ` · ${staleCount} stale` : ''}${warnCount ? ` · ${warnCount} aging` : ''}`}
            </div>
          </div>
        </div>
        <button onClick={() => load()} style={{ background:'none', border:'1px solid #e5e7eb', borderRadius:8, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#9ca3af' }}>
          <RefreshCw size={13} />
        </button>
      </div>

      {items.length > 0 && (
        <div style={{ maxHeight:340, overflowY:'auto' }}>
          {items.map(item => {
            const u = URGENCY_STYLE[item.urgency];
            return (
              <div key={`${item.kind}-${item.id}`} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 20px', borderBottom:'1px solid #f9fafb' }}>
                <div style={{ width:32, height:32, borderRadius:8, background: item.kind === 'order' ? '#ede9fe' : '#e0f2fe', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {item.kind === 'order' ? <ShoppingBag size={14} color="#7c3aed" /> : <Truck size={14} color="#0369a1" />}
                </div>

                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontWeight:700, fontSize:13, color:'#0f1117' }}>{item.customerName || 'Customer'}</span>
                    <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:50, color:u.color, background:u.bg, border:`1px solid ${u.border}`, display:'flex', alignItems:'center', gap:3, whiteSpace:'nowrap' }}>
                      <Clock size={9}/> {item.ageMinutes}m
                    </span>
                  </div>
                  <div style={{ fontSize:12, color:'#9ca3af', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {item.from} → {item.to}
                  </div>
                </div>

                <span style={{ fontWeight:700, fontSize:13, color:'#10b981', flexShrink:0 }}>{fmtGHS(item.amount)}</span>

                <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                  <select value={selectedRider[item.id] || ''} onChange={e => setSelectedRider(p => ({ ...p, [item.id]: e.target.value }))}
                    style={{ height:30, padding:'0 8px', border:'1px solid #e5e7eb', borderRadius:6, fontSize:12, outline:'none', background:'#fff', maxWidth:120 }}>
                    <option value="">Rider…</option>
                    {riders.map(rd => <option key={rd.id} value={rd.id}>{rd.user?.name}</option>)}
                  </select>
                  <button onClick={() => assign(item)} disabled={!selectedRider[item.id] || assigning === item.id}
                    style={{ padding:'5px 12px', borderRadius:6, border:'none', background: theme.green, color:'#fff', cursor:'pointer', fontSize:11, fontWeight:700, opacity: !selectedRider[item.id] ? 0.5 : 1, display:'flex', alignItems:'center', gap:4 }}>
                    {assigning === item.id ? <Loader2 size={11} style={{ animation:'spin 1s linear infinite' }}/> : 'Go'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}