'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  X, Loader2, Plus, Search, Pencil, Trash2, ToggleLeft, ToggleRight,
  ImagePlus, Layers, SlidersHorizontal, Info, Tag, Shirt, Save,
  Store, ShoppingBag, Package, DollarSign, CheckCircle, RefreshCw,
  ChevronDown, ChevronUp, Timer, Flame, Droplets, Weight, Hash,
  Smartphone, Pill, XCircle, LayoutDashboard,
} from 'lucide-react';
import { fieldStyle, fmtGHS, StatCard, StatusBadge, Table } from '../../pages/public/AdminDashboard';

/* ══════════════════════════════════════════
   CONSTANTS (mirrors the vendor app's product taxonomy)
══════════════════════════════════════════ */
const CATEGORIES = ['Food','Grocery','Pharmacy','Boutique','Electronics','Drinks','Other'];
const CATEGORY_ICONS = { Food:'🍛', Grocery:'🛒', Pharmacy:'💊', Boutique:'👗', Electronics:'📱', Drinks:'🥤', Other:'📦' };
const DIETARY_TAGS = ['Spicy','Vegan','Halal','Gluten-Free','Vegetarian','Dairy-Free','Keto','Organic'];
const CATEGORY_FIELDS = {
  Food:        [{ key:'preparationTime', label:'Prep Time (min)', type:'number', icon:<Timer size={14}/> }, { key:'calories', label:'Calories (kcal)', type:'number', icon:<Flame size={14}/> }],
  Drinks:      [{ key:'volume', label:'Volume (ml)', type:'number', icon:<Droplets size={14}/> }, { key:'calories', label:'Calories (kcal)', type:'number', icon:<Flame size={14}/> }],
  Grocery:     [{ key:'weight', label:'Weight (g)', type:'number', icon:<Weight size={14}/> }, { key:'unit', label:'Unit (kg/pcs/pack)', type:'text', icon:<Hash size={14}/> }, { key:'brand', label:'Brand', type:'text', icon:<Tag size={14}/> }, { key:'expiryInfo', label:'Expiry Info', type:'text', icon:<Info size={14}/> }],
  Pharmacy:    [{ key:'brand', label:'Brand/Manufacturer', type:'text', icon:<Pill size={14}/> }, { key:'weight', label:'Weight (g)', type:'number', icon:<Weight size={14}/> }, { key:'volume', label:'Volume (ml)', type:'number', icon:<Droplets size={14}/> }, { key:'expiryInfo', label:'Expiry/Storage Info', type:'text', icon:<Info size={14}/> }],
  Boutique:    [{ key:'brand', label:'Brand', type:'text', icon:<Tag size={14}/> }, { key:'sku', label:'SKU / Product Code', type:'text', icon:<Hash size={14}/> }],
  Electronics: [{ key:'brand', label:'Brand', type:'text', icon:<Smartphone size={14}/> }, { key:'sku', label:'SKU / Model Number', type:'text', icon:<Hash size={14}/> }, { key:'weight', label:'Weight (g)', type:'number', icon:<Weight size={14}/> }],
};

/* ══════════════════════════════════════════
   SHARED FORM PIECES (same as vendor app)
══════════════════════════════════════════ */
function FInput({ label, value, onChange, type='text', placeholder='', required=false, hint='', min, step, textarea=false, rows=3, disabled=false }) {
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

function ModalSection({ icon, title, subtitle, children, collapsible=false }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ border:'1.5px solid #f0f0f0', borderRadius:12, overflow:'hidden' }}>
      <div onClick={() => collapsible && setOpen(!open)}
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

function VariantGroupEditor({ groups, onChange }) {
  function addGroup() { onChange([...groups, { id: Date.now(), name:'', required:true, variants:[{ id: Date.now(), name:'', priceAdjustment:0 }] }]); }
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
            <input value={g.name} onChange={e => updateGroup(g.id,'name',e.target.value)} placeholder="Group name (e.g. Size, Weight)"
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
                <input value={v.name} onChange={e => updateVariant(g.id,v.id,'name',e.target.value)} placeholder="Option name (e.g. Large)"
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

function AddonGroupEditor({ groups, onChange }) {
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
            <input value={g.name} onChange={e => updateGroup(g.id,'name',e.target.value)} placeholder="Group name (e.g. Extras, Toppings)"
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
                <input value={a.name} onChange={e => updateAddon(g.id,a.id,'name',e.target.value)} placeholder="Item name (e.g. Egg, Plantain)"
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

function AttributesEditor({ attributes, onChange }) {
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

/* ══════════════════════════════════════════
   ADMIN PRODUCT MODAL — same tabs as the
   vendor app (Core/Details/Variants/Add-ons/Attrs),
   but writes through admin-scoped endpoints.
══════════════════════════════════════════ */
export function AdminProductModal({ open, onClose, editing, vendorId, authFetch, onSave, theme }) {
  const EMPTY = {
    name:'', description:'', price:'', stock:'', category:'Food', available:true,
    images:[''], preparationTime:'', calories:'', weight:'', volume:'',
    unit:'', brand:'', expiryInfo:'', sku:'',
    sizes:'', colors:'', tags:[],
    isPopular:false, isFeatured:false,
    variantGroups:[], addonGroups:[], attributes:[],
  };

  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [tab, setTab]       = useState('core');

  useEffect(() => {
    if (!open) return;
    setTab('core');
    if (editing) {
      setForm({
        name: editing.name || '', description: editing.description || '',
        price: String(editing.price || ''), stock: String(editing.stock ?? ''),
        category: editing.category || 'Food', available: editing.available ?? true,
        images: editing.images?.length ? editing.images : [''],
        preparationTime: String(editing.preparationTime ?? ''), calories: String(editing.calories ?? ''),
        weight: String(editing.weight ?? ''), volume: String(editing.volume ?? ''),
        unit: editing.unit || '', brand: editing.brand || '', expiryInfo: editing.expiryInfo || '', sku: editing.sku || '',
        sizes: (editing.sizes || []).join(', '), colors: (editing.colors || []).join(', '),
        tags: editing.tags || [], isPopular: editing.isPopular || false, isFeatured: editing.isFeatured || false,
        variantGroups: (editing.variantGroups || []).map(g => ({ id: g.id, name: g.name, required: g.required,
          variants: (g.variants || []).map(v => ({ id: v.id, name: v.name, priceAdjustment: v.priceAdjustment })) })),
        addonGroups: (editing.addonGroups || []).map(g => ({ id: g.id, name: g.name, minSelect: g.minSelect, maxSelect: g.maxSelect,
          addons: (g.addons || []).map(a => ({ id: a.id, name: a.name, price: a.price })) })),
        attributes: (editing.attributes || []).map(a => ({ id: a.id, key: a.key, value: a.value })),
      });
    } else {
      setForm(EMPTY);
    }
  }, [open, editing]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  function buildPayload() {
    return {
      name: form.name.trim(), description: form.description.trim() || undefined,
      price: parseFloat(form.price), stock: parseInt(form.stock) || 0,
      category: form.category, available: form.available,
      images: form.images.map(s=>s.trim()).filter(Boolean),
      preparationTime: form.preparationTime ? parseInt(form.preparationTime) : undefined,
      calories: form.calories ? parseInt(form.calories) : undefined,
      weight: form.weight ? parseFloat(form.weight) : undefined,
      volume: form.volume ? parseFloat(form.volume) : undefined,
      unit: form.unit.trim() || undefined, brand: form.brand.trim() || undefined,
      expiryInfo: form.expiryInfo.trim() || undefined, sku: form.sku.trim() || undefined,
      sizes: form.sizes ? form.sizes.split(',').map(s=>s.trim()).filter(Boolean) : [],
      colors: form.colors ? form.colors.split(',').map(s=>s.trim()).filter(Boolean) : [],
      tags: form.tags, isPopular: form.isPopular, isFeatured: form.isFeatured,
      variantGroups: form.variantGroups.filter(g=>g.name).map(g => ({ name: g.name, required: g.required,
        variants: g.variants.filter(v=>v.name).map(v => ({ name:v.name, priceAdjustment: parseFloat(v.priceAdjustment)||0 })) })),
      addonGroups: form.addonGroups.filter(g=>g.name).map(g => ({ name: g.name, minSelect: g.minSelect, maxSelect: g.maxSelect,
        addons: g.addons.filter(a=>a.name).map(a => ({ name:a.name, price: parseFloat(a.price)||0 })) })),
      attributes: form.attributes.filter(a=>a.key&&a.value).map(({ key, value }) => ({ key, value })),
    };
  }

  const [saveError, setSaveError] = useState(null);

    async function handleSave() {
    if (!form.name || !form.price || !form.category) return;
    setSaving(true);
    setSaveError(null);
    try {
        const payload = buildPayload();
        const res = editing
        ? await authFetch(`/products/${editing.id}`, { method:'PATCH', body: JSON.stringify(payload) })
        : await authFetch(`/admin/vendors/${vendorId}/products`, { method:'POST', body: JSON.stringify(payload) });
        const json = await res.json();
        if (!json.success) throw new Error(json.message || 'Could not save product');
        onSave?.();
        onClose();
    } catch (e) {
        setSaveError(e.message || 'Something went wrong.');
    }
    setSaving(false);
    }

  const TABS = [
    { id:'core', label:'Core', icon:<Package size={14}/> },
    { id:'details', label:'Details', icon:<Info size={14}/> },
    { id:'variants', label:'Variants', icon:<Layers size={14}/> },
    { id:'addons', label:'Add-ons', icon:<Plus size={14}/> },
    { id:'attrs', label:'Attributes', icon:<SlidersHorizontal size={14}/> },
  ];

  const catFields = CATEGORY_FIELDS[form.category] || [];
  const valid = form.name.trim() && form.price && form.category;
  if (!open) return null;

  return (
    <div 
    onClick={(e) => e.stopPropagation()}
    style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1200, display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(4px)' }}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:680, maxHeight:'92vh', display:'flex', flexDirection:'column', boxShadow:'0 24px 80px rgba(0,0,0,0.18)' }}>
        <div style={{ padding:'20px 24px 0', borderBottom:'1px solid #f0f0f0', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <h3 style={{ fontSize:18, fontWeight:900, color:'#0f1117', margin:0 }}>{editing ? 'Edit Product' : 'Add New Product'}</h3>
              <p style={{ fontSize:13, color:'#9ca3af', margin:'3px 0 0' }}>{CATEGORY_ICONS[form.category] || '📦'} {form.category || 'Select category'}</p>
            </div>
            <button onClick={onClose} style={{ background:'#f3f4f6', border:'none', cursor:'pointer', color:'#374151', padding:8, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}><X size={16}/></button>
          </div>
          <div style={{ display:'flex', gap:2, overflowX:'auto' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 14px', border:'none', borderBottom: tab===t.id ? `2px solid #16a34a` : '2px solid transparent', background:'transparent', cursor:'pointer', fontSize:13, fontWeight: tab===t.id ? 700 : 500, color: tab===t.id ? '#16a34a' : '#6b7280', whiteSpace:'nowrap', fontFamily:'inherit' }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
          {tab === 'core' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <ModalSection icon={<ImagePlus size={15}/>} title="Product Images" subtitle="Add image URLs">
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {form.images.map((img, i) => (
                    <div key={i} style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <input value={img} onChange={e => { const imgs=[...form.images]; imgs[i]=e.target.value; set('images',imgs); }}
                        placeholder={`Image URL ${i+1} (https://...)`}
                        style={{ flex:1, height:38, padding:'0 12px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:13, outline:'none', fontFamily:'inherit' }}/>
                      {img && <img src={img} alt="" style={{ width:38, height:38, objectFit:'cover', borderRadius:6, border:'1px solid #e5e7eb' }} onError={e=>e.target.style.display='none'}/>}
                      {form.images.length > 1 && (
                        <button onClick={() => set('images', form.images.filter((_,j)=>j!==i))} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:4 }}><X size={13}/></button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => set('images',[...form.images,''])}
                    style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color:'#16a34a', background:'none', border:'none', cursor:'pointer', padding:'4px 0', fontFamily:'inherit' }}>
                    <Plus size={13}/> Add another image
                  </button>
                </div>
              </ModalSection>

              <FInput label="Product Name" value={form.name} onChange={v=>set('name',v)} placeholder="e.g. Jollof Rice + Chicken" required/>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:5 }}>Category <span style={{ color:'#dc2626' }}>*</span></label>
                  <select value={form.category} onChange={e=>set('category',e.target.value)}
                    style={{ width:'100%', height:42, padding:'0 12px', border:'1.5px solid #e5e7eb', borderRadius:10, fontSize:14, outline:'none', background:'#fff', fontFamily:'inherit', cursor:'pointer' }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
                  </select>
                </div>
                <FInput label="Base Price (GHS)" value={form.price} onChange={v=>set('price',v)} type="number" min="0" step="0.01" placeholder="0.00" required/>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <FInput label="Stock Quantity" value={form.stock} onChange={v=>set('stock',v)} type="number" min="0" placeholder="0"/>
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:5 }}>Status</label>
                  <div style={{ display:'flex', gap:8 }}>
                    {[{ val:true, label:'Available' }, { val:false, label:'Unavailable' }].map(opt => (
                      <button key={String(opt.val)} onClick={() => set('available', opt.val)}
                        style={{ flex:1, height:42, borderRadius:10, border:`1.5px solid ${form.available===opt.val ? '#16a34a' : '#e5e7eb'}`, background: form.available===opt.val ? '#f0fdf4' : '#fff', cursor:'pointer', fontSize:13, fontWeight:700, color: form.available===opt.val ? '#16a34a' : '#6b7280', fontFamily:'inherit' }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <FInput label="Description" value={form.description} onChange={v=>set('description',v)} placeholder="Describe your product..." textarea rows={3}/>

              <div style={{ display:'flex', gap:10 }}>
                {[{ key:'isFeatured', label:'⭐ Featured', hint:'Show in featured section' }, { key:'isPopular', label:'🔥 Popular', hint:'Mark as popular item' }].map(b => (
                  <button key={b.key} onClick={() => set(b.key, !form[b.key])}
                    style={{ flex:1, padding:'10px 14px', borderRadius:10, border:`1.5px solid ${form[b.key]?'#f59e0b':'#e5e7eb'}`, background: form[b.key]?'#fffbeb':'#fff', cursor:'pointer', fontFamily:'inherit' }}>
                    <div style={{ fontSize:13, fontWeight:700, color: form[b.key]?'#92400e':'#6b7280' }}>{b.label}</div>
                    <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>{b.hint}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'details' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {catFields.length > 0 && (
                <ModalSection icon={<Info size={15}/>} title={`${form.category} Details`} subtitle="Fields specific to this category">
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    {catFields.map(f => (
                      <div key={f.key}>
                        <label style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:700, color:'#374151', marginBottom:5 }}>{f.icon} {f.label}</label>
                        <input type={f.type} value={form[f.key]} onChange={e=>set(f.key,e.target.value)}
                          style={{ width:'100%', height:42, padding:'0 12px', border:'1.5px solid #e5e7eb', borderRadius:10, fontSize:14, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}/>
                      </div>
                    ))}
                  </div>
                </ModalSection>
              )}

              <ModalSection icon={<Tag size={15}/>} title="Dietary & Product Tags" subtitle="Select all that apply">
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {DIETARY_TAGS.map(tag => {
                    const active = form.tags.includes(tag);
                    return (
                      <button key={tag} onClick={() => set('tags', active ? form.tags.filter(t=>t!==tag) : [...form.tags, tag])}
                        style={{ padding:'6px 14px', borderRadius:50, border:`1.5px solid ${active?'#16a34a':'#e5e7eb'}`, background: active?'#f0fdf4':'#fff', cursor:'pointer', fontSize:12, fontWeight:700, color: active?'#16a34a':'#6b7280', fontFamily:'inherit' }}>
                        {tag}
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop:12 }}>
                  <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:5 }}>Custom Tags (comma-separated)</label>
                  <input value={form.tags.filter(t=>!DIETARY_TAGS.includes(t)).join(', ')}
                    onChange={e => {
                      const custom = e.target.value.split(',').map(s=>s.trim()).filter(Boolean);
                      const diet   = form.tags.filter(t=>DIETARY_TAGS.includes(t));
                      set('tags', [...diet, ...custom]);
                    }}
                    placeholder="e.g. Best Seller, New Arrival"
                    style={{ width:'100%', height:38, padding:'0 12px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}/>
                </div>
              </ModalSection>

              {['Boutique','Electronics'].includes(form.category) && (
                <ModalSection icon={<Shirt size={15}/>} title="Sizes & Colors" subtitle="Enter comma-separated values">
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <FInput label="Sizes" value={form.sizes} onChange={v=>set('sizes',v)} placeholder="XS, S, M, L, XL"/>
                    <FInput label="Colors" value={form.colors} onChange={v=>set('colors',v)} placeholder="Red, Blue, Black"/>
                  </div>
                </ModalSection>
              )}
            </div>
          )}

          {tab === 'variants' && (
            <div>
              <p style={{ fontSize:13, color:'#6b7280', marginBottom:16, lineHeight:1.6 }}>
                Variants let customers choose between options — like <strong>Size</strong> or <strong>Weight</strong>. Each option can adjust the base price.
              </p>
              <VariantGroupEditor groups={form.variantGroups} onChange={v=>set('variantGroups',v)}/>
            </div>
          )}

          {tab === 'addons' && (
            <div>
              <p style={{ fontSize:13, color:'#6b7280', marginBottom:16, lineHeight:1.6 }}>
                Add-ons let customers select extras. Set minimum and maximum selections per group.
              </p>
              <AddonGroupEditor groups={form.addonGroups} onChange={v=>set('addonGroups',v)}/>
            </div>
          )}

          {tab === 'attrs' && (
            <div>
              <p style={{ fontSize:13, color:'#6b7280', marginBottom:16, lineHeight:1.6 }}>
                Add any extra product information as key-value pairs.
              </p>
              <AttributesEditor attributes={form.attributes} onChange={v=>set('attributes',v)}/>
            </div>
          )}
        </div>

        <div style={{ padding:'16px 24px', borderTop:'1px solid #f0f0f0', display:'flex', alignItems:'center', gap:10, flexShrink:0, background:'#fafafa', borderRadius:'0 0 20px 20px' }}>
          <div style={{ flex:1, fontSize:12, color:'#9ca3af' }}>
            {!valid && <span style={{ color:'#f59e0b' }}>⚠ Name, price and category are required</span>}
            {valid && <span style={{ color:'#16a34a' }}>✓ Ready to save</span>}
          </div>
          <button onClick={onClose} style={{ padding:'10px 20px', borderRadius:10, border:'1.5px solid #e5e7eb', background:'#fff', cursor:'pointer', fontSize:14, fontWeight:600, color:'#374151', fontFamily:'inherit' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving || !valid}
            style={{ padding:'10px 24px', borderRadius:10, border:'none', background: valid ? `linear-gradient(135deg,#16a34a,#15803d)` : '#e5e7eb', color: valid ? '#fff' : '#9ca3af', fontWeight:700, fontSize:14, cursor: valid?'pointer':'not-allowed', display:'flex', alignItems:'center', gap:8, fontFamily:'inherit' }}>
            {saving ? <Loader2 size={15} style={{ animation:'spin 1s linear infinite' }}/> : <Save size={15}/>}
            {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Product'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB: PRODUCTS (admin-scoped, vendor grid)
══════════════════════════════════════════ */
function AdminVendorProducts({ vendorId, authFetch, theme }) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('');
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await authFetch(`/products/vendor/${vendorId}`);
      const json = await res.json();
      if (json.success) setData(json.data.products ?? json.data);
    } catch {}
    setLoading(false);
  }, [authFetch, vendorId]);

  useEffect(() => { load(); }, [load]);

  async function toggleAvail(p) {
    try { await authFetch(`/admin/products/${p.id}`, { method:'PATCH', body: JSON.stringify({ available: !p.available }) }); load(); } catch {}
  }
  async function deleteProduct(id) {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    setDeleting(id);
    try { await authFetch(`/admin/products/${id}`, { method:'DELETE' }); load(); } catch {}
    setDeleting(null);
  }

  const filtered = data
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))
    .filter(p => !filter || p.category === filter);

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ display:'flex', gap:10, flex:1 }}>
          <div style={{ position:'relative', flex:1, minWidth:160 }}>
            <Search size={13} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }}/>
            <input placeholder="Search products..." value={search} onChange={e=>setSearch(e.target.value)}
              style={{ width:'100%', height:36, paddingLeft:32, paddingRight:10, border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:12, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}/>
          </div>
          <select value={filter} onChange={e=>setFilter(e.target.value)}
            style={{ height:36, padding:'0 10px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:12, outline:'none', background:'#fff', fontFamily:'inherit' }}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button onClick={() => { setEditing(null); setModal(true); }}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:9, border:'none', background:`linear-gradient(135deg,${theme.green},${theme.greenMid})`, color:'#fff', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit', marginLeft:10, whiteSpace:'nowrap' }}>
          <Plus size={13}/> Add Product
        </button>
      </div>

      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12 }}>
          {[1,2,3].map(i => <div key={i} style={{ height:220, borderRadius:12, background:'#f3f4f6', animation:'shimmer 1.5s infinite' }}/>)}
        </div>
      ) : !filtered.length ? (
        <div style={{ textAlign:'center', padding:'40px 20px', color:'#9ca3af' }}>
          <Package size={32} style={{ marginBottom:10, opacity:0.4 }}/>
          <div style={{ fontSize:13, fontWeight:700 }}>{data.length === 0 ? 'No products yet' : 'No products match your search'}</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12 }}>
          {filtered.map(p => (
            <div key={p.id} style={{ background:'#fff', borderRadius:12, border:'1px solid #f0f0f0', overflow:'hidden', opacity: p.available ? 1 : 0.7 }}>
              <div style={{ height:100, background:'#f9fafb', position:'relative' }}>
                {p.images?.[0]
                  ? <img src={p.images[0]} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{e.target.style.display='none'}}/>
                  : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:30 }}>{CATEGORY_ICONS[p.category]||'📦'}</div>
                }
                <button onClick={() => toggleAvail(p)} title={p.available?'Deactivate':'Activate'}
                  style={{ position:'absolute', top:6, right:6, padding:'3px 7px', borderRadius:50, border:'none', background: p.available ? 'rgba(22,163,74,0.9)' : 'rgba(107,114,128,0.7)', color:'#fff', fontSize:10, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:3 }}>
                  {p.available ? <><ToggleRight size={10}/> Live</> : <><ToggleLeft size={10}/> Off</>}
                </button>
              </div>
              <div style={{ padding:'10px 12px' }}>
                <div style={{ fontWeight:800, fontSize:12, color:'#0f1117', marginBottom:4, lineHeight:1.3 }}>{p.name}</div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                  <span style={{ fontSize:13, fontWeight:900, color:'#10b981' }}>GHS {Number(p.price).toFixed(2)}</span>
                  <span style={{ fontSize:10, fontWeight:700, color: p.stock === 0 ? '#dc2626' : p.stock < 5 ? '#f59e0b' : '#9ca3af' }}>
                    {p.stock === 0 ? 'Out' : `${p.stock} in stock`}
                  </span>
                </div>
                <div style={{ display:'flex', gap:5 }}>
                  <button onClick={() => { setEditing(p); setModal(true); }}
                    style={{ flex:1, padding:'6px 0', borderRadius:7, border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer', fontSize:11, fontWeight:700, color:'#374151', display:'flex', alignItems:'center', justifyContent:'center', gap:4, fontFamily:'inherit' }}>
                    <Pencil size={11}/> Edit
                  </button>
                  <button onClick={() => deleteProduct(p.id)} disabled={deleting===p.id}
                    style={{ padding:'6px 10px', borderRadius:7, border:'1px solid #fecaca', background:'#fef2f2', cursor:'pointer', color:'#dc2626', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {deleting===p.id ? <Loader2 size={11} style={{ animation:'spin 1s linear infinite' }}/> : <Trash2 size={11}/>}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AdminProductModal open={modal} onClose={() => setModal(false)} editing={editing} vendorId={vendorId} authFetch={authFetch} theme={theme} onSave={load}/>
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB: ORDERS (this vendor's orders only)
══════════════════════════════════════════ */
function AdminVendorOrders({ vendorId, authFetch, theme }) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus]   = useState('');

  const load = useCallback(async (s = status) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...(s && { status: s }) });
      const res  = await authFetch(`/admin/vendors/${vendorId}/orders?${params}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch {}
    setLoading(false);
  }, [authFetch, vendorId]);

  useEffect(() => { load(status); }, [status]);

  const columns = [
    { key:'id', label:'Order ID', render: r => <span style={{ fontFamily:'monospace', fontSize:12, color:'#6b7280' }}>{r.id.slice(-8).toUpperCase()}</span> },
    { key:'customer', label:'Customer', render: r => <div><div style={{ fontWeight:700 }}>{r.customer?.name}</div><div style={{ color:'#9ca3af', fontSize:12 }}>{r.customer?.phone}</div></div> },
    { key:'amount', label:'Amount', render: r => <span style={{ fontWeight:700, color:'#10b981' }}>{fmtGHS(r.totalAmount)}</span> },
    { key:'status', label:'Status', render: r => <StatusBadge status={r.orderStatus}/> },
    { key:'rider', label:'Rider', render: r => r.rider ? <span style={{ color:'#3b82f6', fontWeight:600 }}>{r.rider.user?.name}</span> : <span style={{ color:'#9ca3af' }}>Unassigned</span> },
    { key:'date', label:'Date', render: r => new Date(r.createdAt).toLocaleDateString() },
  ];

  return (
    <div>
      <div style={{ marginBottom:14 }}>
        <select value={status} onChange={e => setStatus(e.target.value)}
          style={{ height:36, padding:'0 12px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:12, outline:'none', background:'#fff', fontFamily:'inherit' }}>
          <option value="">All Statuses</option>
          {['PENDING','ACCEPTED','PREPARING','READY_FOR_PICKUP','RIDER_ASSIGNED','PICKED_UP','DELIVERED','CANCELLED'].map(s => (
            <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
          ))}
        </select>
      </div>
      <div style={{ border:'1px solid #f0f0f0', borderRadius:12, overflow:'hidden' }}>
        <Table columns={columns} data={data} loading={loading} emptyMsg="No orders for this vendor"/>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB: PROFILE (admin-editable business info)
══════════════════════════════════════════ */
function AdminVendorProfile({ vendor, vendorId, authFetch, theme, onUpdated }) {
  const [form, setForm]     = useState({ businessName:'', businessType:'Food', address:'', phone:'', logo:'', openingHours:'' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  useEffect(() => {
    if (!vendor) return;
    setForm({
      businessName: vendor.businessName || '', businessType: vendor.businessType || 'Food',
      address: vendor.address || '', phone: vendor.phone || vendor.user?.phone || '',
      logo: vendor.logo || '', openingHours: vendor.openingHours || '',
    });
  }, [vendor]);

  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  async function save() {
    setSaving(true);
    try {
      const res  = await authFetch(`/admin/vendors/${vendorId}`, { method:'PATCH', body: JSON.stringify(form) });
      const json = await res.json();
      if (json.success) { onUpdated?.(json.data); setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } catch {}
    setSaving(false);
  }

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <div style={{ background:'#fff', borderRadius:12, border:'1px solid #f0f0f0', padding:16, display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
            <div style={{ width:56, height:56, borderRadius:12, border:'1.5px solid #e5e7eb', overflow:'hidden', flexShrink:0, background:'#f9fafb', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {form.logo ? <img src={form.logo} alt="logo" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'}/> : <Store size={22} style={{ color:'#d1d5db' }}/>}
            </div>
            <div style={{ flex:1 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#374151', marginBottom:5 }}>Logo URL</label>
              <input value={form.logo} onChange={e=>set('logo',e.target.value)} placeholder="https://..."
                style={{ width:'100%', height:34, padding:'0 10px', border:'1.5px solid #e5e7eb', borderRadius:7, fontSize:12, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}/>
            </div>
          </div>
          <FInput label="Business Name" value={form.businessName} onChange={v=>set('businessName',v)} required placeholder="e.g. Akosua Kitchen"/>
          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:5 }}>Business Type</label>
            <select value={form.businessType} onChange={e=>set('businessType',e.target.value)}
              style={{ width:'100%', height:40, padding:'0 12px', border:'1.5px solid #e5e7eb', borderRadius:9, fontSize:13, outline:'none', background:'#fff', fontFamily:'inherit', cursor:'pointer' }}>
              {CATEGORIES.map(t => <option key={t} value={t}>{CATEGORY_ICONS[t]} {t}</option>)}
            </select>
          </div>
        </div>

        <div style={{ background:'#fff', borderRadius:12, border:'1px solid #f0f0f0', padding:16, display:'flex', flexDirection:'column', gap:12 }}>
          <FInput label="Phone Number" value={form.phone} onChange={v=>set('phone',v)} placeholder="0241234567"/>
          <FInput label="Address" value={form.address} onChange={v=>set('address',v)} placeholder="e.g. Market Street, Agona Nkwanta" textarea rows={2}/>
          <FInput label="Opening Hours" value={form.openingHours} onChange={v=>set('openingHours',v)} placeholder="e.g. Mon-Sat 7am-9pm"/>
        </div>
      </div>

      <div style={{ marginTop:16, display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={save} disabled={saving}
          style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 22px', borderRadius:10, border:'none', background:`linear-gradient(135deg,${theme.green},${theme.greenMid})`, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
          {saving ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> : <Save size={14}/>}
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
        {saved && <span style={{ fontSize:12, color:'#16a34a', fontWeight:700, display:'flex', alignItems:'center', gap:5 }}><CheckCircle size={13}/> Saved</span>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN: VENDOR MANAGE MODAL
══════════════════════════════════════════ */
export function VendorManageModal({ vendor, authFetch, theme, onClose, onChanged }) {
  const [tab, setTab]       = useState('overview');
  const [full, setFull]     = useState(vendor);
  const [stats, setStats]   = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res  = await authFetch(`/admin/vendors/${vendor.id}/stats`);
      const json = await res.json();
      if (json.success) setStats(json.data);
    } catch {}
    setStatsLoading(false);
  }, [authFetch, vendor.id]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(newStatus) {
    setActing(true);
    try {
      await authFetch(`/admin/vendors/${vendor.id}/status`, { method:'PATCH', body: JSON.stringify({ status: newStatus }) });
      setFull(f => ({ ...f, status: newStatus }));
      onChanged?.();
    } catch {}
    setActing(false);
  }

  const TABS = [
    { id:'overview', label:'Overview', icon:<LayoutDashboard size={14}/> },
    { id:'products', label:'Products', icon:<Package size={14}/> },
    { id:'orders',   label:'Orders',   icon:<ShoppingBag size={14}/> },
    { id:'profile',  label:'Profile',  icon:<Store size={14}/> },
  ];

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(15,17,23,0.5)', zIndex:1000, display:'flex', justifyContent:'center', alignItems:'flex-start', padding:'30px 16px', overflowY:'auto' }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#f8faf8', borderRadius:16, width:'100%', maxWidth:920, minHeight:400, boxShadow:'0 20px 60px rgba(0,0,0,0.25)' }}>

        {/* HEADER */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 24px', borderBottom:'1px solid #f0f0f0', background:'#fff', borderRadius:'16px 16px 0 0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:44, height:44, borderRadius:12, background: full.logo ? `url(${full.logo}) center/cover` : '#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
              {!full.logo && (CATEGORY_ICONS[full.businessType] || '🏪')}
            </div>
            <div>
              <div style={{ fontSize:17, fontWeight:900, color:'#0f1117' }}>{full.businessName}</div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:2 }}>
                <StatusBadge status={full.status}/>
                <span style={{ fontSize:12, color:'#9ca3af' }}>{full.user?.name} · {full.user?.phone}</span>
              </div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {full.status !== 'ACTIVE' && (
              <button onClick={() => updateStatus('ACTIVE')} disabled={acting}
                style={{ padding:'7px 14px', borderRadius:8, border:'1px solid #bbf7d0', background:'#f0fdf4', cursor:'pointer', fontSize:12, fontWeight:700, color:'#16a34a', display:'flex', alignItems:'center', gap:5 }}>
                {acting ? <Loader2 size={12} style={{ animation:'spin 1s linear infinite' }}/> : <CheckCircle size={12}/>} Approve
              </button>
            )}
            {full.status === 'ACTIVE' && (
              <button onClick={() => updateStatus('INACTIVE')} disabled={acting}
                style={{ padding:'7px 14px', borderRadius:8, border:'1px solid #fecaca', background:'#fef2f2', cursor:'pointer', fontSize:12, fontWeight:700, color:'#dc2626', display:'flex', alignItems:'center', gap:5 }}>
                {acting ? <Loader2 size={12} style={{ animation:'spin 1s linear infinite' }}/> : <XCircle size={12}/>} Deactivate
              </button>
            )}
            <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#6b7280' }}>
              <X size={16}/>
            </button>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display:'flex', gap:2, padding:'0 24px', background:'#fff', borderBottom:'1px solid #f0f0f0' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'12px 16px', border:'none', borderBottom: tab===t.id ? `2px solid ${theme.green}` : '2px solid transparent', background:'transparent', cursor:'pointer', fontSize:13, fontWeight: tab===t.id ? 700 : 500, color: tab===t.id ? theme.green : '#6b7280', fontFamily:'inherit' }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* BODY */}
        <div style={{ padding:'20px 24px', maxHeight:'65vh', overflowY:'auto' }}>
          {tab === 'overview' && (
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:12, marginBottom:16 }}>
                <StatCard loading={statsLoading} icon={<ShoppingBag size={16}/>} label="Total Orders" value={stats?.totalOrders} color="#8b5cf6"/>
                <StatCard loading={statsLoading} icon={<CheckCircle size={16}/>} label="Completed" value={stats?.completedOrders} color="#10b981"/>
                <StatCard loading={statsLoading} icon={<Package size={16}/>} label="Products" value={stats?.totalProducts} color="#3b82f6"/>
                <StatCard loading={statsLoading} icon={<DollarSign size={16}/>} label="Revenue (GHS)" value={stats ? Number(stats.totalRevenue).toFixed(0) : null} color="#ec4899"/>
              </div>
              <div style={{ background:'#fff', borderRadius:12, border:'1px solid #f0f0f0', padding:16 }}>
                <div style={{ fontSize:13, fontWeight:800, color:'#0f1117', marginBottom:10 }}>Store Details</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, fontSize:13 }}>
                  <div><span style={{ color:'#9ca3af' }}>Type:</span> <strong>{full.businessType}</strong></div>
                  <div><span style={{ color:'#9ca3af' }}>Rating:</span> <strong>⭐ {Number(full.rating||0).toFixed(1)}</strong></div>
                  <div style={{ gridColumn:'1 / -1' }}><span style={{ color:'#9ca3af' }}>Address:</span> <strong>{full.address || '—'}</strong></div>
                  <div><span style={{ color:'#9ca3af' }}>Hours:</span> <strong>{full.openingHours || '—'}</strong></div>
                  <div><span style={{ color:'#9ca3af' }}>Joined:</span> <strong>{full.createdAt ? new Date(full.createdAt).toLocaleDateString() : '—'}</strong></div>
                </div>
              </div>
            </div>
          )}
          {tab === 'products' && <AdminVendorProducts vendorId={vendor.id} authFetch={authFetch} theme={theme}/>}
          {tab === 'orders'   && <AdminVendorOrders vendorId={vendor.id} authFetch={authFetch} theme={theme}/>}
          {tab === 'profile'  && <AdminVendorProfile vendor={full} vendorId={vendor.id} authFetch={authFetch} theme={theme} onUpdated={v => { setFull(v); onChanged?.(); }}/>}
        </div>
      </div>
    </div>
  );
}