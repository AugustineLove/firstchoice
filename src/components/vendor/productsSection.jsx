import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Loader2, Package, Pencil, Plus, Search, ToggleRight, Trash2 } from "lucide-react";
import { CATEGORIES } from "../../pages/vendor/VendorDashboard";
import { ProductModal } from "./productModal";


export function Products({ authFetch, theme }) {
  const { user } = useAuth();
  const [data,     setData]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [modal,    setModal]    = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [filter,   setFilter]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await authFetch('/products/me/all');
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch {}
    setLoading(false);
  }, [authFetch]);

  useEffect(() => { load(); }, [load]);

  async function handleSave(payload, id) {
    try {
      if (id) await authFetch(`/products/${id}`, { method:'PATCH', body: JSON.stringify(payload) });
      else     await authFetch('/products', { method:'POST', body: JSON.stringify(payload) });
      load();
    } catch {}
  }

  async function toggleAvail(p) {
    try {
      await authFetch(`/products/${p.id}`, { method:'PATCH', body: JSON.stringify({ available: !p.available }) });
      load();
    } catch {}
  }

  async function deleteProduct(id) {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await authFetch(`/products/${id}`, { method:'DELETE' });
      load();
    } catch {}
    setDeleting(null);
  }

  const filtered = data
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))
    .filter(p => !filter || p.category === filter);

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <h2 style={{ fontSize:22, fontWeight:900, color:'#0f1117', margin:0 }}>Products</h2>
        <button onClick={() => { setEditing(null); setModal(true); }}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 18px', borderRadius:10, border:'none', background:`linear-gradient(135deg,${theme.green},${theme.greenMid})`, color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
          <Plus size={15}/> Add Product
        </button>
      </div>

      {/* FILTERS */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }}/>
          <input placeholder="Search products..." value={search} onChange={e=>setSearch(e.target.value)}
            style={{ width:'100%', height:38, paddingLeft:36, paddingRight:12, border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}/>
        </div>
        <select value={filter} onChange={e=>setFilter(e.target.value)}
          style={{ height:38, padding:'0 12px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:13, outline:'none', background:'#fff', fontFamily:'inherit', cursor:'pointer' }}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* SUMMARY BAR */}
      <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap' }}>
        {[
          { label:'Total', count: data.length, color:'#6b7280' },
          { label:'Live',  count: data.filter(p=>p.available).length,  color:'#16a34a' },
          { label:'Off',   count: data.filter(p=>!p.available).length, color:'#9ca3af' },
          { label:'Low Stock (<5)', count: data.filter(p=>p.stock < 5 && p.stock > 0).length, color:'#f59e0b' },
          { label:'Out of Stock',   count: data.filter(p=>p.stock === 0).length, color:'#dc2626' },
        ].map(s => s.count > 0 && (
          <div key={s.label} style={{ fontSize:12, fontWeight:700, color:s.color, display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ fontWeight:900, fontSize:16 }}>{s.count}</span> {s.label}
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:14 }}>
          {[1,2,3,4].map(i => <div key={i} style={{ height:280, borderRadius:14, background:'#f3f4f6', animation:'shimmer 1.5s infinite' }}/>)}
        </div>
      ) : !filtered.length ? (
        <div style={{ textAlign:'center', padding:'60px 20px', color:'#9ca3af' }}>
          <Package size={40} style={{ marginBottom:12, opacity:0.4 }}/>
          <div style={{ fontSize:15, fontWeight:700, marginBottom:6 }}>
            {data.length === 0 ? 'No products yet' : 'No products match your search'}
          </div>
          {data.length === 0 && (
            <button onClick={() => { setEditing(null); setModal(true); }}
              style={{ marginTop:12, padding:'9px 20px', borderRadius:9, border:'none', background:`linear-gradient(135deg,${theme.green},${theme.greenMid})`, color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
              Add your first product
            </button>
          )}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:14 }}>
          {filtered.map(p => (
            <div key={p.id} style={{ background:'#fff', borderRadius:14, border:`1px solid ${!p.available?'#f3f4f6':'#f0f0f0'}`, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.04)', opacity: p.available ? 1 : 0.75, transition:'all 0.2s' }}>

              {/* PRODUCT IMAGE */}
              <div style={{ height:150, background:'#f9fafb', overflow:'hidden', position:'relative' }}>
                {p.images?.[0]
                  ? <img src={p.images[0]} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{e.target.style.display='none'}}/>
                  : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40 }}>{CATEGORY_ICONS[p.category]||'📦'}</div>
                }
                {/* BADGES */}
                <div style={{ position:'absolute', top:8, left:8, display:'flex', gap:4 }}>
                  {p.isFeatured && <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:50, background:'rgba(245,158,11,0.9)', color:'#fff' }}>⭐ Featured</span>}
                  {p.isPopular  && <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:50, background:'rgba(239,68,68,0.9)', color:'#fff' }}>🔥 Popular</span>}
                </div>
                {/* TOGGLE */}
                <button onClick={() => toggleAvail(p)} title={p.available?'Deactivate':'Activate'}
                  style={{ position:'absolute', top:8, right:8, padding:'4px 9px', borderRadius:50, border:'none', background: p.available ? 'rgba(22,163,74,0.9)' : 'rgba(107,114,128,0.7)', color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                  {p.available ? <><ToggleRight size={12}/> Live</> : <><ToggleLeft size={12}/> Off</>}
                </button>
              </div>

              <div style={{ padding:'14px 16px' }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:6, marginBottom:4 }}>
                  <div style={{ fontWeight:800, fontSize:14, color:'#0f1117', flex:1, lineHeight:1.3 }}>{p.name}</div>
                  <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:50, background:'#f3f4f6', color:'#6b7280', whiteSpace:'nowrap', flexShrink:0 }}>{p.category}</span>
                </div>

                {p.description && <p style={{ fontSize:12, color:'#9ca3af', margin:'0 0 8px', lineHeight:1.5 }}>{p.description.slice(0,70)}{p.description.length>70?'…':''}</p>}

                {/* TAGS */}
                {p.tags?.length > 0 && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:8 }}>
                    {p.tags.slice(0,3).map(t => <span key={t} style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:50, background:'#f0fdf4', color:'#16a34a' }}>{t}</span>)}
                  </div>
                )}

                {/* RICH INDICATORS */}
                <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap' }}>
                  {p.variantGroups?.length > 0 && <span style={{ fontSize:10, color:'#6b7280', display:'flex', alignItems:'center', gap:3 }}><Layers size={10}/> {p.variantGroups.length} variant{p.variantGroups.length>1?'s':''}</span>}
                  {p.addonGroups?.length > 0   && <span style={{ fontSize:10, color:'#6b7280', display:'flex', alignItems:'center', gap:3 }}><Plus size={10}/> {p.addonGroups.length} add-on{p.addonGroups.length>1?'s':''}</span>}
                  {p.preparationTime           && <span style={{ fontSize:10, color:'#6b7280', display:'flex', alignItems:'center', gap:3 }}><Timer size={10}/> {p.preparationTime}min</span>}
                </div>

                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                  <span style={{ fontSize:17, fontWeight:900, color:'#10b981' }}>GHS {Number(p.price).toFixed(2)}</span>
                  <span style={{ fontSize:12, fontWeight:700, color: p.stock === 0 ? '#dc2626' : p.stock < 5 ? '#f59e0b' : '#6b7280' }}>
                    {p.stock === 0 ? '✗ Out of stock' : `${p.stock} in stock`}
                  </span>
                </div>

                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={() => { setEditing(p); setModal(true); }}
                    style={{ flex:1, padding:'7px 0', borderRadius:8, border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer', fontSize:12, fontWeight:700, color:'#374151', display:'flex', alignItems:'center', justifyContent:'center', gap:4, fontFamily:'inherit' }}>
                    <Pencil size={12}/> Edit
                  </button>
                  <button onClick={() => deleteProduct(p.id)} disabled={deleting===p.id}
                    style={{ padding:'7px 12px', borderRadius:8, border:'1px solid #fecaca', background:'#fef2f2', cursor:'pointer', color:'#dc2626', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {deleting===p.id ? <Loader2 size={12} style={{ animation:'spin 1s linear infinite' }}/> : <Trash2 size={12}/>}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProductModal
        open={modal}
        onClose={() => setModal(false)}
        editing={editing}
        onSave={handleSave}
        theme={theme}
      />
    </div>
  );
}