import { ImagePlus, Info, Layers, Package, Plus, Save, Search, SlidersHorizontal, Tag, X } from "lucide-react";

export function VariantGroupEditor({ groups, onChange }) {
  function addGroup() {
    onChange([...groups, { id: Date.now(), name:'', required:true, variants:[{ id: Date.now(), name:'', priceAdjustment:0 }] }]);
  }
  function removeGroup(gid) { onChange(groups.filter(g => g.id !== gid)); }
  function updateGroup(gid, key, val) { onChange(groups.map(g => g.id===gid ? {...g,[key]:val} : g)); }
  function addVariant(gid) { onChange(groups.map(g => g.id===gid ? {...g, variants:[...g.variants,{id:Date.now(),name:'',priceAdjustment:0}]} : g)); }
  function removeVariant(gid, vid) { onChange(groups.map(g => g.id===gid ? {...g, variants:g.variants.filter(v=>v.id!==vid)} : g)); }
  function updateVariant(gid, vid, key, val) { onChange(groups.map(g => g.id===gid ? {...g, variants:g.variants.map(v=>v.id===vid?{...v,[key]:val}:v)} : g)); }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {groups.map(g => (
        <div key={g.id} style={{ border:'1.5px solid #e5e7eb', borderRadius:10, padding:14, background:'#fafafa' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <input value={g.name} onChange={e => updateGroup(g.id,'name',e.target.value)}
              placeholder="Group name (e.g. Size, Weight)"
              style={{ flex:1, height:36, padding:'0 10px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:13, outline:'none', fontFamily:'inherit' }}/>
            <label style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color:'#374151', whiteSpace:'nowrap', cursor:'pointer' }}>
              <input type="checkbox" checked={g.required} onChange={e => updateGroup(g.id,'required',e.target.checked)} style={{ accentColor:'#16a34a' }}/>
              Required
            </label>
            <button onClick={() => removeGroup(g.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#dc2626', padding:4 }}><X size={14}/></button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {g.variants.map(v => (
              <div key={v.id} style={{ display:'flex', gap:6, alignItems:'center' }}>
                <input value={v.name} onChange={e => updateVariant(g.id,v.id,'name',e.target.value)}
                  placeholder="Option name (e.g. Large)"
                  style={{ flex:2, height:34, padding:'0 10px', border:'1.5px solid #e5e7eb', borderRadius:7, fontSize:13, outline:'none', fontFamily:'inherit', background:'#fff' }}/>
                <div style={{ display:'flex', alignItems:'center', border:'1.5px solid #e5e7eb', borderRadius:7, background:'#fff', overflow:'hidden', flex:1 }}>
                  <span style={{ padding:'0 8px', fontSize:12, color:'#9ca3af', borderRight:'1px solid #e5e7eb', height:34, display:'flex', alignItems:'center' }}>+GHS</span>
                  <input type="number" step="0.01" value={v.priceAdjustment} onChange={e => updateVariant(g.id,v.id,'priceAdjustment',parseFloat(e.target.value)||0)}
                    style={{ flex:1, height:34, padding:'0 8px', border:'none', outline:'none', fontSize:13, fontFamily:'inherit' }}/>
                </div>
                <button onClick={() => removeVariant(g.id,v.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:4 }}><X size={13}/></button>
              </div>
            ))}
          </div>
          <button onClick={() => addVariant(g.id)}
            style={{ marginTop:8, display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color:'#16a34a', background:'none', border:'none', cursor:'pointer', padding:'4px 0', fontFamily:'inherit' }}>
            <Plus size={13}/> Add Option
          </button>
        </div>
      ))}
      <button onClick={addGroup}
        style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 14px', border:'1.5px dashed #d1d5db', borderRadius:10, background:'transparent', cursor:'pointer', fontSize:13, fontWeight:600, color:'#6b7280', fontFamily:'inherit' }}>
        <Plus size={14}/> Add Variant Group
      </button>
    </div>
  );
}

/* ── Addon Group Editor ── */
export function AddonGroupEditor({ groups, onChange }) {
  function addGroup() { onChange([...groups, { id:Date.now(), name:'', minSelect:0, maxSelect:10, addons:[{id:Date.now(),name:'',price:0}] }]); }
  function removeGroup(gid) { onChange(groups.filter(g=>g.id!==gid)); }
  function updateGroup(gid,key,val) { onChange(groups.map(g=>g.id===gid?{...g,[key]:val}:g)); }
  function addAddon(gid) { onChange(groups.map(g=>g.id===gid?{...g,addons:[...g.addons,{id:Date.now(),name:'',price:0}]}:g)); }
  function removeAddon(gid,aid) { onChange(groups.map(g=>g.id===gid?{...g,addons:g.addons.filter(a=>a.id!==aid)}:g)); }
  function updateAddon(gid,aid,key,val) { onChange(groups.map(g=>g.id===gid?{...g,addons:g.addons.map(a=>a.id===aid?{...a,[key]:val}:a)}:g)); }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {groups.map(g => (
        <div key={g.id} style={{ border:'1.5px solid #e5e7eb', borderRadius:10, padding:14, background:'#fafafa' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <input value={g.name} onChange={e => updateGroup(g.id,'name',e.target.value)}
              placeholder="Group name (e.g. Extras, Toppings)"
              style={{ flex:1, height:36, padding:'0 10px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:13, outline:'none', fontFamily:'inherit' }}/>
            <button onClick={() => removeGroup(g.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#dc2626', padding:4 }}><X size={14}/></button>
          </div>
          <div style={{ display:'flex', gap:8, marginBottom:10 }}>
            {[['minSelect','Min select'],['maxSelect','Max select']].map(([k,l]) => (
              <div key={k} style={{ flex:1 }}>
                <label style={{ fontSize:11, fontWeight:600, color:'#6b7280', display:'block', marginBottom:3 }}>{l}</label>
                <input type="number" min={0} value={g[k]} onChange={e => updateGroup(g.id,k,parseInt(e.target.value)||0)}
                  style={{ width:'100%', height:34, padding:'0 10px', border:'1.5px solid #e5e7eb', borderRadius:7, fontSize:13, outline:'none', fontFamily:'inherit', background:'#fff', boxSizing:'border-box' }}/>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {g.addons.map(a => (
              <div key={a.id} style={{ display:'flex', gap:6, alignItems:'center' }}>
                <input value={a.name} onChange={e => updateAddon(g.id,a.id,'name',e.target.value)}
                  placeholder="Item name (e.g. Egg, Plantain)"
                  style={{ flex:2, height:34, padding:'0 10px', border:'1.5px solid #e5e7eb', borderRadius:7, fontSize:13, outline:'none', fontFamily:'inherit', background:'#fff' }}/>
                <div style={{ display:'flex', alignItems:'center', border:'1.5px solid #e5e7eb', borderRadius:7, background:'#fff', overflow:'hidden', flex:1 }}>
                  <span style={{ padding:'0 8px', fontSize:12, color:'#9ca3af', borderRight:'1px solid #e5e7eb', height:34, display:'flex', alignItems:'center' }}>GHS</span>
                  <input type="number" step="0.01" min={0} value={a.price} onChange={e => updateAddon(g.id,a.id,'price',parseFloat(e.target.value)||0)}
                    style={{ flex:1, height:34, padding:'0 8px', border:'none', outline:'none', fontSize:13, fontFamily:'inherit' }}/>
                </div>
                <button onClick={() => removeAddon(g.id,a.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:4 }}><X size={13}/></button>
              </div>
            ))}
          </div>
          <button onClick={() => addAddon(g.id)}
            style={{ marginTop:8, display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color:'#16a34a', background:'none', border:'none', cursor:'pointer', padding:'4px 0', fontFamily:'inherit' }}>
            <Plus size={13}/> Add Item
          </button>
        </div>
      ))}
      <button onClick={addGroup}
        style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 14px', border:'1.5px dashed #d1d5db', borderRadius:10, background:'transparent', cursor:'pointer', fontSize:13, fontWeight:600, color:'#6b7280', fontFamily:'inherit' }}>
        <Plus size={14}/> Add Add-on Group
      </button>
    </div>
  );
}

/* ── Attributes Editor ── */
export function AttributesEditor({ attributes, onChange }) {
  function add() { onChange([...attributes, { id:Date.now(), key:'', value:'' }]); }
  function remove(id) { onChange(attributes.filter(a=>a.id!==id)); }
  function update(id,k,v) { onChange(attributes.map(a=>a.id===id?{...a,[k]:v}:a)); }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {attributes.map(a => (
        <div key={a.id} style={{ display:'flex', gap:8, alignItems:'center' }}>
          <input value={a.key} onChange={e=>update(a.id,'key',e.target.value)} placeholder="Key (e.g. Brand)"
            style={{ flex:1, height:36, padding:'0 10px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:13, outline:'none', fontFamily:'inherit' }}/>
          <input value={a.value} onChange={e=>update(a.id,'value',e.target.value)} placeholder="Value (e.g. Unilever)"
            style={{ flex:2, height:36, padding:'0 10px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:13, outline:'none', fontFamily:'inherit' }}/>
          <button onClick={()=>remove(a.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:4 }}><X size={14}/></button>
        </div>
      ))}
      <button onClick={add}
        style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 14px', border:'1.5px dashed #d1d5db', borderRadius:10, background:'transparent', cursor:'pointer', fontSize:13, fontWeight:600, color:'#6b7280', fontFamily:'inherit' }}>
        <Plus size={14}/> Add Attribute
      </button>
    </div>
  );
}