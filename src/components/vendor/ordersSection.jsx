import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Loader2, Package, Pencil, Plus, RefreshCw, Search, ToggleRight, Trash2 } from "lucide-react";
import { CATEGORIES } from "../../pages/vendor/VendorDashboard";
import { ProductModal } from "./productModal";
import { StatusBadge } from "../../pages/customer/AdminDashboard";


export function Orders({ authFetch, theme }) {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [status,  setStatus]  = useState('');
  const [acting,  setActing]  = useState(null);

  const load = useCallback(async (s = status) => {
    setLoading(true);
    try {
      const res  = await authFetch('/vendors/me/orders');
      const json = await res.json();
      if (json.success) setData(s ? json.data.filter(o => o.orderStatus === s) : json.data);
    } catch {}
    setLoading(false);
  }, [authFetch, status]);

  useEffect(() => { load(status); }, [status]);

  async function updateStatus(orderId, newStatus) {
    setActing(orderId);
    try {
      await authFetch(`/orders/${orderId}/status`, { method:'PATCH', body: JSON.stringify({ status: newStatus }) });
      load(status);
    } catch {}
    setActing(null);
  }

  const NEXT       = { PENDING:'ACCEPTED', ACCEPTED:'PREPARING', PREPARING:'READY_FOR_PICKUP' };
  const NEXT_LABEL = { PENDING:'Accept', ACCEPTED:'Preparing', PREPARING:'Ready' };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <h2 style={{ fontSize:22, fontWeight:900, color:'#0f1117', margin:0 }}>Orders</h2>
        <button onClick={() => load(status)} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer', fontSize:13, fontWeight:600, color:'#374151', fontFamily:'inherit' }}>
          <RefreshCw size={13}/> Refresh
        </button>
      </div>
      <div style={{ marginBottom:14 }}>
        <select value={status} onChange={e => setStatus(e.target.value)}
          style={{ height:38, padding:'0 12px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:13, outline:'none', background:'#fff', fontFamily:'inherit', cursor:'pointer' }}>
          <option value="">All Statuses</option>
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
          <div style={{ textAlign:'center', padding:60, color:'#9ca3af', fontSize:14 }}>
            {status ? `No ${status.replace(/_/g,' ')} orders` : 'No orders yet'}
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ borderBottom:'2px solid #f3f4f6' }}>
                  {['Order ID','Customer','Items','Amount','Status','Action'].map(h => (
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:700, color:'#6b7280', fontSize:11, textTransform:'uppercase', letterSpacing:'0.04em', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map(o => (
                  <tr key={o.id} style={{ borderBottom:'1px solid #f9fafb', transition:'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background='#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'12px 14px' }}>
                      <div style={{ fontFamily:'monospace', fontSize:12, color:'#6b7280', fontWeight:700 }}>{o.id.slice(-8).toUpperCase()}</div>
                      <div style={{ fontSize:11, color:'#9ca3af' }}>{new Date(o.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td style={{ padding:'12px 14px' }}>
                      <div style={{ fontWeight:700, color:'#0f1117' }}>{o.customer?.name}</div>
                      <div style={{ color:'#9ca3af', fontSize:12 }}>{o.customer?.phone}</div>
                    </td>
                    <td style={{ padding:'12px 14px' }}>
                      {o.items?.slice(0,2).map((i,idx) => (
                        <div key={idx} style={{ fontSize:12, color:'#374151' }}>{i.product?.name} ×{i.quantity}</div>
                      ))}
                      {o.items?.length > 2 && <div style={{ fontSize:11, color:'#9ca3af' }}>+{o.items.length-2} more</div>}
                    </td>
                    <td style={{ padding:'12px 14px', fontWeight:800, color:'#10b981', fontSize:14 }}>GHS {Number(o.totalAmount).toFixed(2)}</td>
                    <td style={{ padding:'12px 14px' }}><StatusBadge status={o.orderStatus}/></td>
                    <td style={{ padding:'12px 14px' }}>
                      {NEXT[o.orderStatus] && (
                        <button onClick={() => updateStatus(o.id, NEXT[o.orderStatus])} disabled={acting===o.id}
                          style={{ padding:'5px 12px', borderRadius:7, border:`1px solid ${theme.green}50`, background:`${theme.green}10`, cursor:'pointer', fontSize:12, fontWeight:700, color:theme.green, display:'flex', alignItems:'center', gap:4, fontFamily:'inherit' }}>
                          {acting===o.id && <Loader2 size={11} style={{ animation:'spin 1s linear infinite' }}/>}
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