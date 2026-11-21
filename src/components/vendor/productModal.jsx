// components/vendor/productModal.jsx — web twin of the Flutter _ProductModal.
// Replaces both productModal.jsx and productModalHelpers.jsx (editors are inside this file).
// .env: VITE_CLOUDINARY_CLOUD_NAME=<your cloud>   VITE_CLOUDINARY_PRESET=firstchoice_unsigned (optional)
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ImagePlus, Info, Layers, Loader2, Package, Plus, Save, Tag, X } from 'lucide-react';
import { CATEGORIES, CATEGORY_ICONS, DIETARY_TAGS } from '../../pages/vendor/VendorDashboard';
import { inputS } from './ui';

const CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const PRESET = import.meta.env.VITE_CLOUDINARY_PRESET || 'firstchoice_unsigned';
const G = '#16a34a';
const uid = () => `${Date.now()}${Math.random().toString(36).slice(2, 7)}`;

/* Category-specific fields — same as the Flutter Details tab */
const N = 'number', T = 'text';
const W = ['weight', 'Weight (g)', N], V = ['volume', 'Volume (ml)', N], B = ['brand', 'Brand', T];
const FIELDS = {
  Food: [['preparationTime', 'Prep time (min)', N], ['calories', 'Calories (kcal)', N]],
  Drinks: [V, ['calories', 'Calories (kcal)', N]],
  Grocery: [W, V, ['unit', 'Unit (kg, pcs, pack)', T], B, ['expiryInfo', 'Expiry / storage info', T]],
  Pharmacy: [W, V, B, ['expiryInfo', 'Expiry / storage info', T]],
  Electronics: [W, B, ['sku', 'SKU / model number', T]],
  Boutique: [B, ['sku', 'SKU / product code', T], ['sizes', 'Sizes (comma-separated)', T], ['colors', 'Colors (comma-separated)', T]],
};
const DETAIL_KEYS = ['preparationTime', 'calories', 'weight', 'volume', 'unit', 'brand', 'expiryInfo', 'sku', 'sizes', 'colors'];

/* Add-on quantity pricing — identical formulas to the Prisma schema comment */
const MODES = [
  ['multiple', 'Multiple', 'Price × Qty'],
  ['free', 'Free mode', 'Price + (Qty − 1)'],
  ['halves', 'Halves', 'Price + half per extra'],
  ['custom', 'Custom', 'Price + custom amount'],
];
export const addonPrice = (a, qty) => {
  const b = Number(a.price) || 0, c = Number(a.customIncrementValue) || 1;
  if (a.incrementMode === 'free') return b + (qty - 1);
  if (a.incrementMode === 'halves') return b + (qty - 1) * (b / 2);
  if (a.incrementMode === 'custom') return b + (qty - 1) * c;
  return b * qty;
};

/* Cloudinary upload with progress (XHR so we get real progress events) */
function upload(file, onProgress) {
  return new Promise((resolve, reject) => {
    if (!CLOUD) return reject(new Error('Set VITE_CLOUDINARY_CLOUD_NAME in your .env'));
    const fd = new FormData();
    fd.append('file', file); fd.append('upload_preset', PRESET); fd.append('folder', 'firstchoice/products');
    const x = new XMLHttpRequest();
    x.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`);
    x.upload.onprogress = e => e.lengthComputable && onProgress(e.loaded / e.total);
    x.onload = () => { try { const j = JSON.parse(x.responseText); j.secure_url ? resolve(j.secure_url) : reject(new Error(j.error?.message || 'Upload failed')); } catch { reject(new Error('Upload failed')); } };
    x.onerror = () => reject(new Error('Network error'));
    x.send(fd);
  });
}

/* ───────── small pieces ───────── */
const Label = ({ children }) => <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 5 }}>{children}</label>;
const Field = ({ label, children }) => <div>{label && <Label>{label}</Label>}{children}</div>;
const mini = { ...inputS, height: 34, padding: '0 10px', fontSize: 13, borderRadius: 8 };
const ghostBtn = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', border: '1.5px dashed #d1d5db', borderRadius: 10, background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#6b7280', fontFamily: 'inherit' };
const xBtn = { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, display: 'flex' };
const Section = ({ title, hint, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f1117' }}>{title}</div>
    {hint && <div style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 10px' }}>{hint}</div>}
    <div style={{ marginTop: hint ? 0 : 10 }}>{children}</div>
  </div>
);
const Toggle = ({ active, onClick, children, color = G }) => (
  <button type="button" onClick={onClick} style={{ flex: 1, height: 42, borderRadius: 10, border: `1.5px solid ${active ? color : '#e5e7eb'}`, background: active ? color + '14' : '#fff', color: active ? color : '#6b7280', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>{children}</button>
);

/* ───────── images ───────── */
function ImageList({ items, setItems }) {
  const ref = useRef(null);
  async function pick(files) {
    for (const file of Array.from(files)) {
      const id = uid();
      setItems(a => [...a, { id, preview: URL.createObjectURL(file), uploading: true, progress: 0 }]);
      try {
        const url = await upload(file, p => setItems(a => a.map(i => (i.id === id ? { ...i, progress: p } : i))));
        setItems(a => a.map(i => (i.id === id ? { ...i, url, uploading: false } : i)));
      } catch (e) {
        setItems(a => a.filter(i => i.id !== id));
        alert(`Upload failed: ${e.message}`);
      }
    }
  }
  const move = (i, d) => setItems(a => { const j = i + d; if (j < 0 || j >= a.length) return a; const b = [...a]; [b[i], b[j]] = [b[j], b[i]]; return b; });
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: 10 }}>
        {items.map((it, i) => (
          <div key={it.id} style={{ border: `1.5px solid ${i === 0 ? G : '#e5e7eb'}`, borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
            <div style={{ height: 100, position: 'relative', background: '#f9fafb' }}>
              <img src={it.url || it.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: it.uploading ? 0.4 : 1 }} />
              {it.uploading && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: G }}>{Math.round(it.progress * 100)}%</div>}
              {i === 0 && <span style={{ position: 'absolute', top: 6, left: 6, background: G, color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 50 }}>MAIN</span>}
              <button type="button" onClick={() => setItems(a => a.filter(x => x.id !== it.id))} style={{ ...xBtn, position: 'absolute', top: 4, right: 4, background: 'rgba(255,255,255,.9)', borderRadius: 6, color: '#dc2626' }}><X size={12} /></button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px' }}>
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} style={xBtn}><ArrowLeft size={13} /></button>
              <button type="button" disabled={i === items.length - 1} onClick={() => move(i, 1)} style={xBtn}><ArrowRight size={13} /></button>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => ref.current.click()} style={{ ...ghostBtn, flexDirection: 'column', justifyContent: 'center', height: 100 + 30, color: G, borderColor: '#bbf7d0' }}>
          <ImagePlus size={22} /> Add images
        </button>
      </div>
      <input ref={ref} type="file" accept="image/*" multiple hidden onChange={e => { pick(e.target.files); e.target.value = ''; }} />
      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>Uploaded straight to Cloudinary. The first image is the main one — use the arrows to reorder.</div>
    </div>
  );
}

/* ───────── variants ───────── */
function VariantEditor({ groups, setGroups }) {
  const upG = (gi, patch) => setGroups(gs => gs.map((g, i) => (i === gi ? { ...g, ...patch } : g)));
  const upV = (gi, vi, patch) => setGroups(gs => gs.map((g, i) => (i === gi ? { ...g, variants: g.variants.map((v, j) => (j === vi ? { ...v, ...patch } : v)) } : g)));
  const newV = () => ({ id: uid(), name: '', priceAdjustment: 0, available: true });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {groups.map((g, gi) => (
        <div key={g.id} style={{ border: '1.5px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 10, background: '#f9fafb' }}>
            <input value={g.name} onChange={e => upG(gi, { name: e.target.value })} placeholder="Group name (e.g. Size, Weight)" style={{ ...mini, flex: 1 }} />
            <label style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 12, fontWeight: 600 }}><input type="checkbox" checked={g.required} onChange={e => upG(gi, { required: e.target.checked })} style={{ accentColor: G }} />Required</label>
            <button type="button" onClick={() => setGroups(gs => gs.filter((_, i) => i !== gi))} style={{ ...xBtn, color: '#dc2626' }}><X size={15} /></button>
          </div>
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {g.variants.map((v, vi) => (
              <div key={v.id} style={{ display: 'flex', gap: 6, alignItems: 'center', opacity: v.available ? 1 : 0.5 }}>
                <input value={v.name} onChange={e => upV(gi, vi, { name: e.target.value })} placeholder="Option (e.g. Large)" style={{ ...mini, flex: 2 }} />
                <div style={{ display: 'flex', alignItems: 'center', flex: 1, border: '1.5px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                  <span style={{ padding: '0 8px', fontSize: 11, color: '#9ca3af', borderRight: '1px solid #e5e7eb', lineHeight: '31px' }}>+GHS</span>
                  <input type="number" step="0.01" value={v.priceAdjustment} onChange={e => upV(gi, vi, { priceAdjustment: parseFloat(e.target.value) || 0 })} style={{ border: 'none', outline: 'none', width: '100%', height: 31, padding: '0 8px', fontSize: 13 }} />
                </div>
                <label title="Available" style={{ display: 'flex', alignItems: 'center' }}><input type="checkbox" checked={v.available} onChange={e => upV(gi, vi, { available: e.target.checked })} style={{ accentColor: G }} /></label>
                <button type="button" onClick={() => upG(gi, { variants: g.variants.filter((_, j) => j !== vi) })} style={xBtn}><X size={14} /></button>
              </div>
            ))}
            <button type="button" onClick={() => upG(gi, { variants: [...g.variants, newV()] })} style={{ ...xBtn, color: G, fontSize: 12, fontWeight: 700, gap: 4, alignItems: 'center' }}><Plus size={13} /> Add option</button>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => setGroups(gs => [...gs, { id: uid(), name: '', required: true, variants: [newV()] }])} style={ghostBtn}><Plus size={14} /> Add variant group</button>
    </div>
  );
}

/* ───────── add-ons (with quantity pricing modes) ───────── */
function AddonEditor({ groups, setGroups }) {
  const upG = (gi, patch) => setGroups(gs => gs.map((g, i) => (i === gi ? { ...g, ...patch } : g)));
  const upA = (gi, ai, patch) => setGroups(gs => gs.map((g, i) => (i === gi ? { ...g, addons: g.addons.map((a, j) => (j === ai ? { ...a, ...patch } : a)) } : g)));
  const newA = () => ({ id: uid(), name: '', price: 0, available: true, incrementable: false, incrementMode: 'multiple', customIncrementValue: 1 });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {groups.map((g, gi) => (
        <div key={g.id} style={{ border: '1.5px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: 8, padding: 10, background: '#f9fafb' }}>
            <input value={g.name} onChange={e => upG(gi, { name: e.target.value })} placeholder="Group name (e.g. Extras, Toppings)" style={{ ...mini, flex: 1 }} />
            <button type="button" onClick={() => setGroups(gs => gs.filter((_, i) => i !== gi))} style={{ ...xBtn, color: '#dc2626' }}><X size={15} /></button>
          </div>
          <div style={{ display: 'flex', gap: 10, padding: '10px 12px 0' }}>
            {[['minSelect', 'Min select'], ['maxSelect', 'Max select']].map(([k, l]) => (
              <div key={k} style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 3 }}>{l}</div>
                <input type="number" min={0} value={g[k]} onChange={e => upG(gi, { [k]: parseInt(e.target.value) || 0 })} style={mini} />
              </div>
            ))}
          </div>
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {g.addons.map((a, ai) => (
              <div key={a.id} style={{ borderBottom: ai < g.addons.length - 1 ? '1px solid #f3f4f6' : 'none', paddingBottom: 12 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input value={a.name} onChange={e => upA(gi, ai, { name: e.target.value })} placeholder="Item (e.g. Egg)" style={{ ...mini, flex: 2 }} />
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1, border: '1.5px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                    <span style={{ padding: '0 8px', fontSize: 11, color: '#9ca3af', borderRight: '1px solid #e5e7eb', lineHeight: '31px' }}>GHS</span>
                    <input type="number" step="0.01" min={0} value={a.price} onChange={e => upA(gi, ai, { price: parseFloat(e.target.value) || 0 })} style={{ border: 'none', outline: 'none', width: '100%', height: 31, padding: '0 8px', fontSize: 13 }} />
                  </div>
                  <button type="button" onClick={() => upG(gi, { addons: g.addons.filter((_, j) => j !== ai) })} style={xBtn}><X size={14} /></button>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, margin: '8px 0 0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={a.incrementable} style={{ accentColor: G }} onChange={e => upA(gi, ai, { incrementable: e.target.checked, ...(e.target.checked ? {} : { incrementMode: 'multiple' }) })} />
                  Allow quantity selection
                </label>
                {a.incrementable && (
                  <div style={{ background: '#f9fafb', borderRadius: 10, padding: 10, marginTop: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Pricing mode</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {MODES.map(([id, title, desc]) => {
                        const sel = a.incrementMode === id;
                        const probe = { ...a, incrementMode: id };
                        return (
                          <button key={id} type="button" onClick={() => upA(gi, ai, { incrementMode: id, customIncrementValue: a.customIncrementValue || 1 })}
                            style={{ textAlign: 'left', padding: 10, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', border: `${sel ? 1.5 : 1}px solid ${sel ? G : '#e5e7eb'}`, background: sel ? '#f0fdf4' : '#fff' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: sel ? G : '#374151' }}>{sel ? '◉' : '○'} {title}</div>
                            <div style={{ fontSize: 10, color: '#6b7280' }}>{desc}</div>
                            <div style={{ fontSize: 10, color: '#9ca3af' }}>1× {addonPrice(probe, 1).toFixed(2)} → 2× {addonPrice(probe, 2).toFixed(2)} → 3× {addonPrice(probe, 3).toFixed(2)}</div>
                          </button>
                        );
                      })}
                    </div>
                    {a.incrementMode === 'custom' && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Amount added per extra unit (GHS, must be &gt; 0)</div>
                        <input type="number" step="0.01" min="0.01" value={a.customIncrementValue} onChange={e => { const v = parseFloat(e.target.value); upA(gi, ai, { customIncrementValue: v > 0 ? v : 1 }); }} style={{ ...mini, maxWidth: 160 }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            <button type="button" onClick={() => upG(gi, { addons: [...g.addons, newA()] })} style={{ ...xBtn, color: G, fontSize: 12, fontWeight: 700, gap: 4, alignItems: 'center' }}><Plus size={13} /> Add item</button>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => setGroups(gs => [...gs, { id: uid(), name: '', minSelect: 0, maxSelect: 10, addons: [newA()] }])} style={ghostBtn}><Plus size={14} /> Add add-on group</button>
    </div>
  );
}

/* ───────── modal ───────── */
const EMPTY = {
  name: '', description: '', price: '', stock: '', category: 'Food', available: true, isPopular: false, isFeatured: false,
  images: [], tags: [], variantGroups: [], addonGroups: [], attributes: [],
  ...Object.fromEntries(DETAIL_KEYS.map(k => [k, ''])),
};

export function ProductModal({ open, onClose, editing, onSave }) {
  const [f, setF] = useState(EMPTY);
  const [tab, setTab] = useState('core');
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const setList = k => fn => setF(p => ({ ...p, [k]: fn(p[k]) }));

  useEffect(() => {
    if (!open) return;
    setTab('core');
    if (!editing) return setF(EMPTY);
    const e = editing;
    setF({
      ...EMPTY,
      name: e.name || '', description: e.description || '', price: String(e.price ?? ''), stock: String(e.stock ?? ''),
      category: e.category || 'Food', available: e.available ?? true, isPopular: !!e.isPopular, isFeatured: !!e.isFeatured,
      images: (e.images || []).filter(Boolean).map(url => ({ id: uid(), url })),
      tags: e.tags || [],
      ...Object.fromEntries(DETAIL_KEYS.map(k => [k, Array.isArray(e[k]) ? e[k].join(', ') : e[k] ?? ''])),
      variantGroups: (e.variantGroups || []).map(g => ({ id: uid(), name: g.name, required: g.required, variants: (g.variants || []).map(v => ({ id: uid(), name: v.name, priceAdjustment: v.priceAdjustment ?? 0, available: v.available ?? true })) })),
      addonGroups: (e.addonGroups || []).map(g => ({ id: uid(), name: g.name, minSelect: g.minSelect ?? 0, maxSelect: g.maxSelect ?? 10, addons: (g.addons || []).map(a => ({ id: uid(), name: a.name, price: a.price ?? 0, available: a.available ?? true, incrementable: !!a.incrementable, incrementMode: a.incrementMode || 'multiple', customIncrementValue: a.customIncrementValue || 1 })) })),
      attributes: (e.attributes || []).map(a => ({ id: uid(), key: a.key, value: a.value })),
    });
  }, [open, editing]);

  const uploading = f.images.some(i => i.uploading);
  const problems = useMemo(() => {
    const p = [];
    if (!f.name.trim()) p.push('Name is required');
    if (!(parseFloat(f.price) >= 0) || f.price === '') p.push('Price is required');
    f.variantGroups.filter(g => g.name).forEach(g => { if (!g.variants.some(v => v.name)) p.push(`Variant group "${g.name}" needs an option`); });
    f.addonGroups.filter(g => g.name).forEach(g => { if (g.minSelect > g.maxSelect) p.push(`"${g.name}": min select is above max select`); });
    return p;
  }, [f]);
  const canSave = !problems.length && !uploading && !saving;

  function payload() {
    const num = (k, fn) => (f[k] !== '' ? { [k]: fn(f[k]) } : {});
    const str = k => (String(f[k]).trim() ? { [k]: String(f[k]).trim() } : {});
    const list = k => String(f[k]).split(',').map(s => s.trim()).filter(Boolean);
    return {
      name: f.name.trim(), description: f.description.trim() || null, price: parseFloat(f.price) || 0, stock: parseInt(f.stock) || 0,
      category: f.category, available: f.available, isPopular: f.isPopular, isFeatured: f.isFeatured,
      images: f.images.filter(i => i.url).map(i => i.url), tags: f.tags,
      ...num('preparationTime', parseInt), ...num('calories', parseInt), ...num('weight', parseFloat), ...num('volume', parseFloat),
      ...str('unit'), ...str('brand'), ...str('expiryInfo'), ...str('sku'), sizes: list('sizes'), colors: list('colors'),
      variantGroups: f.variantGroups.filter(g => g.name.trim()).map(g => ({
        name: g.name.trim(), required: g.required,
        variants: g.variants.filter(v => v.name.trim()).map(v => ({ name: v.name.trim(), priceAdjustment: v.priceAdjustment || 0, available: v.available })),
      })),
      addonGroups: f.addonGroups.filter(g => g.name.trim()).map(g => ({
        name: g.name.trim(), minSelect: g.minSelect, maxSelect: g.maxSelect,
        addons: g.addons.filter(a => a.name.trim()).map(a => ({
          name: a.name.trim(), price: a.price || 0, available: a.available, incrementable: a.incrementable,
          incrementMode: a.incrementable ? a.incrementMode : 'multiple', customIncrementValue: Number(a.customIncrementValue) > 0 ? Number(a.customIncrementValue) : 1,
        })),
      })),
      attributes: f.attributes.filter(a => a.key.trim() && a.value.trim()).map(a => ({ key: a.key.trim(), value: a.value.trim() })),
    };
  }

  async function save() {
    if (!canSave) return;
    setSaving(true);
    await onSave(payload(), editing?.id);
    setSaving(false);
    onClose();
  }

  if (!open) return null;
  const imgCount = f.images.filter(i => i.url).length;
  const TABS = [['core', 'Core', <Package size={14} />], ['images', `Images (${imgCount})`, <ImagePlus size={14} />], ['details', 'Details', <Info size={14} />], ['variants', `Variants${f.variantGroups.length ? ` (${f.variantGroups.length})` : ''}`, <Layers size={14} />], ['addons', `Add-ons${f.addonGroups.length ? ` (${f.addonGroups.length})` : ''}`, <Plus size={14} />]];
  const fields = FIELDS[f.category] || [];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 720, height: 'min(92vh,800px)', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,.18)' }}>
        <div style={{ padding: '18px 24px 0', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900 }}>{editing ? 'Edit product' : 'Add new product'}</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>{CATEGORY_ICONS[f.category]} {f.category} · {imgCount} image{imgCount !== 1 ? 's' : ''}</div>
            </div>
            <button type="button" onClick={onClose} style={{ ...xBtn, background: '#f3f4f6', borderRadius: 8, padding: 8, height: 32 }}><X size={16} /></button>
          </div>
          <div style={{ display: 'flex', overflowX: 'auto' }}>
            {TABS.map(([id, label, icon]) => (
              <button key={id} type="button" onClick={() => setTab(id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', border: 'none', borderBottom: `2px solid ${tab === id ? G : 'transparent'}`, background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: tab === id ? 700 : 500, color: tab === id ? G : '#6b7280', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>{icon}{label}</button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {tab === 'core' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Product name *"><input style={inputS} value={f.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Jollof Rice + Chicken" /></Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Category *"><select style={inputS} value={f.category} onChange={e => set('category', e.target.value)}>{CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}</select></Field>
                <Field label="Base price (GHS) *"><input style={inputS} type="number" min="0" step="0.01" value={f.price} onChange={e => set('price', e.target.value)} placeholder="0.00" /></Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Stock"><input style={inputS} type="number" min="0" value={f.stock} onChange={e => set('stock', e.target.value)} placeholder="0" /></Field>
                <Field label="Status"><div style={{ display: 'flex', gap: 6 }}><Toggle active={f.available} onClick={() => set('available', true)}>Live</Toggle><Toggle active={!f.available} color="#9ca3af" onClick={() => set('available', false)}>Off</Toggle></div></Field>
              </div>
              <Field label="Description"><textarea style={{ ...inputS, height: 80, padding: 10, resize: 'vertical' }} value={f.description} onChange={e => set('description', e.target.value)} placeholder="Describe your product…" /></Field>
              <div style={{ display: 'flex', gap: 10 }}>
                <Toggle active={f.isFeatured} color="#f59e0b" onClick={() => set('isFeatured', !f.isFeatured)}>⭐ Featured</Toggle>
                <Toggle active={f.isPopular} color="#ef4444" onClick={() => set('isPopular', !f.isPopular)}>🔥 Popular</Toggle>
              </div>
            </div>
          )}

          {tab === 'images' && <ImageList items={f.images} setItems={setList('images')} />}

          {tab === 'details' && (
            <>
              {fields.length > 0 && (
                <Section title={`${CATEGORY_ICONS[f.category]} ${f.category} details`}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {fields.map(([k, label, type]) => <Field key={k} label={label}><input style={inputS} type={type} value={f[k]} placeholder={k === 'sizes' ? 'XS, S, M, L' : k === 'colors' ? 'Red, Blue' : ''} onChange={e => set(k, e.target.value)} /></Field>)}
                  </div>
                </Section>
              )}
              <Section title="🏷️ Product tags">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {DIETARY_TAGS.map(t => { const on = f.tags.includes(t); return <button key={t} type="button" onClick={() => set('tags', on ? f.tags.filter(x => x !== t) : [...f.tags, t])} style={{ padding: '6px 14px', borderRadius: 50, border: `1.5px solid ${on ? G : '#e5e7eb'}`, background: on ? '#f0fdf4' : '#fff', color: on ? G : '#6b7280', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{t}</button>; })}
                </div>
                <input style={{ ...mini, marginTop: 10 }} placeholder="Custom tags, comma-separated (e.g. Best seller)" value={f.tags.filter(t => !DIETARY_TAGS.includes(t)).join(', ')}
                  onChange={e => set('tags', [...f.tags.filter(t => DIETARY_TAGS.includes(t)), ...e.target.value.split(',').map(s => s.trim()).filter(Boolean)])} />
              </Section>
              <Section title="📋 Custom attributes" hint="Key-value pairs for extra info (Brand: Nestlé, Ingredients: …)">
                {f.attributes.map((a, i) => (
                  <div key={a.id} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input style={{ ...mini, flex: 1 }} placeholder="Key" value={a.key} onChange={e => setList('attributes')(l => l.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))} />
                    <input style={{ ...mini, flex: 2 }} placeholder="Value" value={a.value} onChange={e => setList('attributes')(l => l.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                    <button type="button" style={xBtn} onClick={() => setList('attributes')(l => l.filter((_, j) => j !== i))}><X size={14} /></button>
                  </div>
                ))}
                <button type="button" style={ghostBtn} onClick={() => setList('attributes')(l => [...l, { id: uid(), key: '', value: '' }])}><Plus size={14} /> Add attribute</button>
              </Section>
            </>
          )}

          {tab === 'variants' && (<><p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginTop: 0 }}>Variants let customers choose between options like <b>Size</b> (S, M, L) or <b>Weight</b> (250g, 500g). Each option can adjust the base price; untick the box on an option to mark it unavailable.</p><VariantEditor groups={f.variantGroups} setGroups={setList('variantGroups')} /></>)}
          {tab === 'addons' && (<><p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginTop: 0 }}>Add-ons are optional extras like Egg or Plantain. Turn on <b>quantity selection</b> to let customers add several, and pick how extra units are priced.</p><AddonEditor groups={f.addonGroups} setGroups={setList('addonGroups')} /></>)}
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 10, background: '#fafafa', borderRadius: '0 0 20px 20px' }}>
          <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: uploading || problems.length ? '#f59e0b' : G }}>
            {uploading ? '⏳ Uploading images…' : problems.length ? `⚠ ${problems[0]}` : '✓ Ready to save'}
          </div>
          <button type="button" onClick={onClose} style={{ padding: '10px 18px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit' }}>Cancel</button>
          <button type="button" onClick={save} disabled={!canSave} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: canSave ? G : '#e5e7eb', color: canSave ? '#fff' : '#9ca3af', fontWeight: 700, fontSize: 14, cursor: canSave ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit' }}>
            {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}{saving ? 'Saving…' : editing ? 'Save changes' : 'Add product'}
          </button>
        </div>
      </div>
    </div>
  );
}