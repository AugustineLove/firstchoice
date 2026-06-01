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

/* ══════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════ */
const CATEGORIES = ['Food','Grocery','Pharmacy','Boutique','Electronics','Drinks','Other'];

const CATEGORY_ICONS = {
  Food: '🍛', Grocery: '🛒', Pharmacy: '💊',
  Boutique: '👗', Electronics: '📱', Drinks: '🥤', Other: '📦',
};

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
   SMALL HELPERS
══════════════════════════════════════════ */
const STATUS_MAP = {
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

/* ── Section Divider for Modal ── */
function ModalSection({ icon, title, subtitle, children, collapsible=false }) {
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

/* ── Variant Group Editor ── */
function VariantGroupEditor({ groups, onChange }) {
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

/* ── Full Product Modal ── */
function ProductModal({ open, onClose, editing, onSave, theme }) {
  const EMPTY = {
    name:'', description:'', price:'', stock:'', category:'Food', available:true,
    images:[''], preparationTime:'', calories:'', weight:'', volume:'',
    unit:'', brand:'', expiryInfo:'', sku:'',
    sizes:'', colors:'', tags:[],
    isPopular:false, isFeatured:false,
    variantGroups:[], addonGroups:[], attributes:[],
  };

  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);
  const [tab, setTab]         = useState('core');
  const scrollRef             = useRef(null);

  useEffect(() => {
    if (!open) return;
    setTab('core');
    if (editing) {
      setForm({
        name:            editing.name || '',
        description:     editing.description || '',
        price:           String(editing.price || ''),
        stock:           String(editing.stock || ''),
        category:        editing.category || 'Food',
        available:       editing.available ?? true,
        images:          editing.images?.length ? editing.images : [''],
        preparationTime: String(editing.preparationTime || ''),
        calories:        String(editing.calories || ''),
        weight:          String(editing.weight || ''),
        volume:          String(editing.volume || ''),
        unit:            editing.unit || '',
        brand:           editing.brand || '',
        expiryInfo:      editing.expiryInfo || '',
        sku:             editing.sku || '',
        sizes:           (editing.sizes || []).join(', '),
        colors:          (editing.colors || []).join(', '),
        tags:            editing.tags || [],
        isPopular:       editing.isPopular || false,
        isFeatured:      editing.isFeatured || false,
        variantGroups:   (editing.variantGroups || []).map(g => ({
          id: g.id, name: g.name, required: g.required,
          variants: (g.variants || []).map(v => ({ id: v.id, name: v.name, priceAdjustment: v.priceAdjustment })),
        })),
        addonGroups: (editing.addonGroups || []).map(g => ({
          id: g.id, name: g.name, minSelect: g.minSelect, maxSelect: g.maxSelect,
          addons: (g.addons || []).map(a => ({ id: a.id, name: a.name, price: a.price })),
        })),
        attributes: (editing.attributes || []).map(a => ({ id: a.id, key: a.key, value: a.value })),
      });
    } else {
      setForm(EMPTY);
    }
  }, [open, editing]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  function buildPayload() {
    return {
      name:             form.name.trim(),
      description:      form.description.trim() || undefined,
      price:            parseFloat(form.price),
      stock:            parseInt(form.stock) || 0,
      category:         form.category,
      available:        form.available,
      images:           form.images.map(s=>s.trim()).filter(Boolean),
      preparationTime:  form.preparationTime ? parseInt(form.preparationTime) : undefined,
      calories:         form.calories        ? parseInt(form.calories)        : undefined,
      weight:           form.weight          ? parseFloat(form.weight)        : undefined,
      volume:           form.volume          ? parseFloat(form.volume)        : undefined,
      unit:             form.unit.trim()     || undefined,
      brand:            form.brand.trim()    || undefined,
      expiryInfo:       form.expiryInfo.trim() || undefined,
      sku:              form.sku.trim()       || undefined,
      sizes:            form.sizes ? form.sizes.split(',').map(s=>s.trim()).filter(Boolean) : [],
      colors:           form.colors ? form.colors.split(',').map(s=>s.trim()).filter(Boolean) : [],
      tags:             form.tags,
      isPopular:        form.isPopular,
      isFeatured:       form.isFeatured,
      variantGroups:    form.variantGroups.filter(g=>g.name).map(g => ({
        name: g.name, required: g.required,
        variants: g.variants.filter(v=>v.name).map(v => ({ name:v.name, priceAdjustment: parseFloat(v.priceAdjustment)||0 })),
      })),
      addonGroups: form.addonGroups.filter(g=>g.name).map(g => ({
        name: g.name, minSelect: g.minSelect, maxSelect: g.maxSelect,
        addons: g.addons.filter(a=>a.name).map(a => ({ name:a.name, price: parseFloat(a.price)||0 })),
      })),
      attributes: form.attributes.filter(a=>a.key&&a.value).map(({ key, value }) => ({ key, value })),
    };
  }

  async function handleSave() {
    if (!form.name || !form.price || !form.category) return;
    setSaving(true);
    await onSave(buildPayload(), editing?.id);
    setSaving(false);
    onClose();
  }

  const TABS = [
    { id:'core',     label:'Core',      icon:<Package size={14}/> },
    { id:'details',  label:'Details',   icon:<Info size={14}/> },
    { id:'variants', label:'Variants',  icon:<Layers size={14}/> },
    { id:'addons',   label:'Add-ons',   icon:<Plus size={14}/> },
    { id:'attrs',    label:'Attributes',icon:<SlidersHorizontal size={14}/> },
  ];

  const catFields = CATEGORY_FIELDS[form.category] || [];
  const valid = form.name.trim() && form.price && form.category;

  if (!open) return null;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(4px)' }}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:680, maxHeight:'92vh', display:'flex', flexDirection:'column', boxShadow:'0 24px 80px rgba(0,0,0,0.18)' }}>

        {/* MODAL HEADER */}
        <div style={{ padding:'20px 24px 0', borderBottom:'1px solid #f0f0f0', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <h3 style={{ fontSize:18, fontWeight:900, color:'#0f1117', margin:0 }}>
                {editing ? 'Edit Product' : 'Add New Product'}
              </h3>
              <p style={{ fontSize:13, color:'#9ca3af', margin:'3px 0 0' }}>
                {CATEGORY_ICONS[form.category] || '📦'} {form.category || 'Select category'}
              </p>
            </div>
            <button onClick={onClose} style={{ background:'#f3f4f6', border:'none', cursor:'pointer', color:'#374151', padding:8, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}><X size={16}/></button>
          </div>

          {/* TABS */}
          <div style={{ display:'flex', gap:2, overflowX:'auto', paddingBottom:0 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 14px', border:'none', borderBottom: tab===t.id ? `2px solid #16a34a` : '2px solid transparent', background:'transparent', cursor:'pointer', fontSize:13, fontWeight: tab===t.id ? 700 : 500, color: tab===t.id ? '#16a34a' : '#6b7280', whiteSpace:'nowrap', fontFamily:'inherit', transition:'all 0.15s' }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* MODAL BODY */}
        <div ref={scrollRef} style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>

          {/* ── TAB: CORE ── */}
          {tab === 'core' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

              {/* IMAGE URLS */}
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

              {/* BASICS */}
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
                        style={{ flex:1, height:42, borderRadius:10, border:`1.5px solid ${form.available===opt.val ? '#16a34a' : '#e5e7eb'}`, background: form.available===opt.val ? '#f0fdf4' : '#fff', cursor:'pointer', fontSize:13, fontWeight:700, color: form.available===opt.val ? '#16a34a' : '#6b7280', fontFamily:'inherit', transition:'all 0.2s' }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <FInput label="Description" value={form.description} onChange={v=>set('description',v)} placeholder="Describe your product..." textarea rows={3}/>

              {/* BADGES */}
              <div style={{ display:'flex', gap:10 }}>
                {[{ key:'isFeatured', label:'⭐ Featured', hint:'Show in featured section' }, { key:'isPopular', label:'🔥 Popular', hint:'Mark as popular item' }].map(b => (
                  <button key={b.key} onClick={() => set(b.key, !form[b.key])}
                    style={{ flex:1, padding:'10px 14px', borderRadius:10, border:`1.5px solid ${form[b.key]?'#f59e0b':'#e5e7eb'}`, background: form[b.key]?'#fffbeb':'#fff', cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}>
                    <div style={{ fontSize:13, fontWeight:700, color: form[b.key]?'#92400e':'#6b7280' }}>{b.label}</div>
                    <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>{b.hint}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB: DETAILS ── */}
          {tab === 'details' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

              {/* CATEGORY-SPECIFIC */}
              {catFields.length > 0 && (
                <ModalSection icon={<Info size={15}/>} title={`${form.category} Details`} subtitle="Fields specific to this category">
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    {catFields.map(f => (
                      <div key={f.key}>
                        <label style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:700, color:'#374151', marginBottom:5 }}>
                          {f.icon} {f.label}
                        </label>
                        <input type={f.type} value={form[f.key]} onChange={e=>set(f.key,e.target.value)}
                          style={{ width:'100%', height:42, padding:'0 12px', border:'1.5px solid #e5e7eb', borderRadius:10, fontSize:14, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}/>
                      </div>
                    ))}
                  </div>
                </ModalSection>
              )}

              {/* TAGS */}
              <ModalSection icon={<Tag size={15}/>} title="Dietary & Product Tags" subtitle="Select all that apply">
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {DIETARY_TAGS.map(tag => {
                    const active = form.tags.includes(tag);
                    return (
                      <button key={tag} onClick={() => set('tags', active ? form.tags.filter(t=>t!==tag) : [...form.tags, tag])}
                        style={{ padding:'6px 14px', borderRadius:50, border:`1.5px solid ${active?'#16a34a':'#e5e7eb'}`, background: active?'#f0fdf4':'#fff', cursor:'pointer', fontSize:12, fontWeight:700, color: active?'#16a34a':'#6b7280', transition:'all 0.2s', fontFamily:'inherit' }}>
                        {tag}
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop:12 }}>
                  <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:5 }}>Custom Tags (comma-separated)</label>
                  <input
                    value={form.tags.filter(t=>!DIETARY_TAGS.includes(t)).join(', ')}
                    onChange={e => {
                      const custom = e.target.value.split(',').map(s=>s.trim()).filter(Boolean);
                      const diet   = form.tags.filter(t=>DIETARY_TAGS.includes(t));
                      set('tags', [...diet, ...custom]);
                    }}
                    placeholder="e.g. Best Seller, New Arrival"
                    style={{ width:'100%', height:38, padding:'0 12px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}/>
                </div>
              </ModalSection>

              {/* SIZES & COLORS (boutique) */}
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

          {/* ── TAB: VARIANTS ── */}
          {tab === 'variants' && (
            <div>
              <p style={{ fontSize:13, color:'#6b7280', marginBottom:16, lineHeight:1.6 }}>
                Variants let customers choose between options — like <strong>Size</strong> (Small, Medium, Large) or <strong>Weight</strong> (250g, 500g, 1kg). Each option can adjust the base price.
              </p>
              <VariantGroupEditor groups={form.variantGroups} onChange={v=>set('variantGroups',v)}/>
            </div>
          )}

          {/* ── TAB: ADD-ONS ── */}
          {tab === 'addons' && (
            <div>
              <p style={{ fontSize:13, color:'#6b7280', marginBottom:16, lineHeight:1.6 }}>
                Add-ons let customers select extras — like <strong>Extras</strong> (Egg +GHS2, Plantain +GHS3) or <strong>Toppings</strong>. Set minimum and maximum selections per group.
              </p>
              <AddonGroupEditor groups={form.addonGroups} onChange={v=>set('addonGroups',v)}/>
            </div>
          )}

          {/* ── TAB: ATTRIBUTES ── */}
          {tab === 'attrs' && (
            <div>
              <p style={{ fontSize:13, color:'#6b7280', marginBottom:16, lineHeight:1.6 }}>
                Add any extra product information as key-value pairs — like <strong>Brand</strong>: Nestlé, <strong>Storage</strong>: Keep refrigerated, <strong>Ingredients</strong>: Rice, chicken, spices.
              </p>
              <AttributesEditor attributes={form.attributes} onChange={v=>set('attributes',v)}/>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div style={{ padding:'16px 24px', borderTop:'1px solid #f0f0f0', display:'flex', alignItems:'center', gap:10, flexShrink:0, background:'#fafafa', borderRadius:'0 0 20px 20px' }}>
          <div style={{ flex:1, fontSize:12, color:'#9ca3af' }}>
            {!valid && <span style={{ color:'#f59e0b' }}>⚠ Name, price and category are required</span>}
            {valid && <span style={{ color:'#16a34a' }}>✓ Ready to save</span>}
          </div>
          <button onClick={onClose} style={{ padding:'10px 20px', borderRadius:10, border:'1.5px solid #e5e7eb', background:'#fff', cursor:'pointer', fontSize:14, fontWeight:600, color:'#374151', fontFamily:'inherit' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !valid}
            style={{ padding:'10px 24px', borderRadius:10, border:'none', background: valid ? `linear-gradient(135deg,#16a34a,#15803d)` : '#e5e7eb', color: valid ? '#fff' : '#9ca3af', fontWeight:700, fontSize:14, cursor: valid?'pointer':'not-allowed', display:'flex', alignItems:'center', gap:8, fontFamily:'inherit', transition:'all 0.2s' }}>
            {saving ? <Loader2 size={15} style={{ animation:'spin 1s linear infinite' }}/> : <Save size={15}/>}
            {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Product'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   PROFILE SECTION
══════════════════════════════════════════ */
function Profile({ authFetch, theme, vendor, onVendorUpdate }) {
  const [form, setForm]     = useState({ businessName:'', businessType:'Food', address:'', phone:'', logo:'', openingHours:'' });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    if (!vendor) return;
    setForm({
      businessName: vendor.businessName || '',
      businessType: vendor.businessType || 'Food',
      address:      vendor.address || '',
      phone:        vendor.phone || '',
      logo:         vendor.logo || '',
      openingHours: vendor.openingHours || '',
    });
  }, [vendor]);

  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  async function save() {
    setSaving(true);
    try {
      const res  = await authFetch('/vendors/me/profile', { method:'PATCH', body: JSON.stringify(form) });
      const json = await res.json();
      if (json.success) {
        onVendorUpdate(json.data);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {}
    setSaving(false);
  }

  const TYPES = ['Food','Grocery','Pharmacy','Boutique','Electronics','Drinks','Other'];

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:900, color:'#0f1117', margin:0 }}>Store Profile</h2>
          <p style={{ color:'#6b7280', fontSize:14, margin:'4px 0 0' }}>Manage your store information</p>
        </div>
        {vendor?.status && <StatusBadge status={vendor.status}/>}
      </div>

      {vendor?.status === 'PENDING' && (
        <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:12, padding:'14px 18px', marginBottom:24, fontSize:14, color:'#92400e', display:'flex', gap:10 }}>
          <AlertCircle size={18} style={{ flexShrink:0 }}/>
          Your store is pending admin approval. You can still set up your profile and products — they'll go live once approved.
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }} className="profile-grid">

        {/* LEFT */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* LOGO PREVIEW */}
          <div style={{ background:'#fff', borderRadius:14, border:'1px solid #f0f0f0', padding:20 }}>
            <h3 style={{ fontSize:14, fontWeight:800, color:'#0f1117', margin:'0 0 14px' }}>Store Logo</h3>
            <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
              <div style={{ width:72, height:72, borderRadius:14, border:'1.5px solid #e5e7eb', overflow:'hidden', flexShrink:0, background:'#f9fafb', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {form.logo
                  ? <img src={form.logo} alt="logo" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'}/>
                  : <Store size={28} style={{ color:'#d1d5db' }}/>
                }
              </div>
              <div style={{ flex:1 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:6 }}>Logo URL</label>
                <input value={form.logo} onChange={e=>set('logo',e.target.value)}
                  placeholder="https://your-logo-url.com/logo.png"
                  style={{ width:'100%', height:38, padding:'0 12px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}/>
                <p style={{ fontSize:11, color:'#9ca3af', margin:'4px 0 0' }}>Paste any image URL</p>
              </div>
            </div>
          </div>

          <div style={{ background:'#fff', borderRadius:14, border:'1px solid #f0f0f0', padding:20, display:'flex', flexDirection:'column', gap:14 }}>
            <h3 style={{ fontSize:14, fontWeight:800, color:'#0f1117', margin:0 }}>Business Info</h3>
            <FInput label="Business Name" value={form.businessName} onChange={v=>set('businessName',v)} required placeholder="e.g. Akosua Kitchen"/>
            <div>
              <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:5 }}>Business Type</label>
              <select value={form.businessType} onChange={e=>set('businessType',e.target.value)}
                style={{ width:'100%', height:42, padding:'0 12px', border:'1.5px solid #e5e7eb', borderRadius:10, fontSize:14, outline:'none', background:'#fff', fontFamily:'inherit', cursor:'pointer' }}>
                {TYPES.map(t => <option key={t} value={t}>{CATEGORY_ICONS[t]} {t}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ background:'#fff', borderRadius:14, border:'1px solid #f0f0f0', padding:20, display:'flex', flexDirection:'column', gap:14 }}>
            <h3 style={{ fontSize:14, fontWeight:800, color:'#0f1117', margin:0 }}>Contact & Location</h3>
            <FInput label="Phone Number" value={form.phone} onChange={v=>set('phone',v)} required placeholder="0241234567"/>
            <FInput label="Address" value={form.address} onChange={v=>set('address',v)} required placeholder="e.g. Market Street, Agona Nkwanta" textarea rows={2}/>
            <FInput label="Opening Hours" value={form.openingHours} onChange={v=>set('openingHours',v)} placeholder="e.g. Mon-Sat 7am-9pm"/>
          </div>

          {/* STORE STATS SUMMARY */}
          {vendor && (
            <div style={{ background:`linear-gradient(135deg, ${theme.green}12, ${theme.greenMid}08)`, borderRadius:14, border:`1px solid ${theme.green}30`, padding:20 }}>
              <h3 style={{ fontSize:14, fontWeight:800, color:'#0f1117', margin:'0 0 12px' }}>Quick Stats</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[
                  { label:'Rating', value:`⭐ ${Number(vendor.rating||0).toFixed(1)}` },
                  { label:'Status', value: vendor.status },
                ].map(s => (
                  <div key={s.label} style={{ background:'rgba(255,255,255,0.7)', borderRadius:10, padding:'10px 14px' }}>
                    <div style={{ fontSize:11, color:'#6b7280', fontWeight:600 }}>{s.label}</div>
                    <div style={{ fontSize:14, fontWeight:800, color:'#0f1117', marginTop:2 }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SAVE */}
      <div style={{ marginTop:20, display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={save} disabled={saving}
          style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 28px', borderRadius:12, border:'none', background:`linear-gradient(135deg,${theme.green},${theme.greenMid})`, color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}>
          {saving ? <Loader2 size={16} style={{ animation:'spin 1s linear infinite' }}/> : <Save size={16}/>}
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
        {saved && <span style={{ fontSize:13, color:'#16a34a', fontWeight:700, display:'flex', alignItems:'center', gap:5 }}><CheckCircle size={14}/> Saved successfully!</span>}
      </div>
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

/* ══════════════════════════════════════════
   ORDERS SECTION
══════════════════════════════════════════ */
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

/* ══════════════════════════════════════════
   PRODUCTS SECTION
══════════════════════════════════════════ */
function Products({ authFetch, theme }) {
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

/* ══════════════════════════════════════════
   MAIN VENDOR DASHBOARD
══════════════════════════════════════════ */
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