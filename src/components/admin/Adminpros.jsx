'use client';
// Admin → Professionals. Add/edit pros, publish or hide them, mark verified,
// and manage the list of trades. Same look and props as your vendor manager.
//
// Usage in AdminDashboard (next to your other tabs):
//   {activeTab === 'pros' && <AdminPros authFetch={authFetch} theme={theme} />}
// Sidebar (AdminSidebar NAV, under Management):
//   { id: 'pros', label: 'Professionals', icon: '🛠️', badge: null },

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X, Loader2, Plus, Search, Pencil, Save, Upload, Trash2, BadgeCheck, Users,
  CheckCircle, FileText, PhoneCall, Wrench, Eye, EyeOff, Tag,
} from 'lucide-react';
import { StatCard, Table } from '../../pages/customer/AdminDashboard';
const CLOUDINARY_CLOUD_NAME = import.meta?.env?.VITE_CLOUDINARY_CLOUD_NAME || 'YOUR_CLOUD_NAME';
const CLOUDINARY_UPLOAD_PRESET = import.meta?.env?.VITE_CLOUDINARY_UPLOAD_PRESET || 'firstchoice_unsigned';

// NOTE: uses CLOUD_NAME in the URL. (Your vendor file puts the upload preset there,
// which makes logo uploads fail — worth fixing the same way.)
async function uploadToCloudinary(file, folder) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  if (folder) fd.append('folder', folder);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
  const json = await res.json();
  if (!res.ok || !json.secure_url) throw new Error(json.error?.message || 'Image upload failed');
  return json.secure_url;
}

async function call(authFetch, path, method = 'GET', body) {
  const res = await authFetch(path, { method, ...(body ? { body: JSON.stringify(body) } : {}) });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Request failed');
  return json.data;
}

const STATUS_STYLE = {
  ACTIVE:   { bg: '#f0fdf4', color: '#16a34a', label: 'Live' },
  DRAFT:    { bg: '#fffbeb', color: '#b45309', label: 'Draft' },
  INACTIVE: { bg: '#f3f4f6', color: '#6b7280', label: 'Hidden' },
};

function StatusPill({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.DRAFT;
  return (
    <span style={{ padding: '3px 10px', borderRadius: 50, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function Switch({ checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      style={{ width: 40, height: 22, borderRadius: 50, border: 'none', cursor: 'pointer', padding: 2, background: checked ? '#16a34a' : '#d1d5db', transition: 'background .2s', display: 'flex', justifyContent: checked ? 'flex-end' : 'flex-start', flexShrink: 0 }}>
      <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.25)' }} />
    </button>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 5 }}>
        {label}{required && <span style={{ color: '#dc2626' }}> *</span>}
      </label>
      {children}
      {hint && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9ca3af' }}>{hint}</p>}
    </div>
  );
}

const inputCss = { width: '100%', height: 42, padding: '0 12px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff' };

function Avatar({ pro, size = 38 }) {
  const initials = (pro.name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', background: '#f0fdf4', color: '#16a34a',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.34, fontWeight: 800,
    }}>
      {pro.photo ? <img src={pro.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => (e.target.style.display = 'none')} /> : initials}
    </div>
  );
}

/* ══════════════════════════════════════════
   ADD / EDIT PROFESSIONAL
══════════════════════════════════════════ */
function ProModal({ editing, trades, authFetch, theme, onClose, onSaved }) {
  const [f, setF] = useState({
    name: editing?.name || '',
    phone: editing?.phone || '',
    whatsapp: editing?.whatsapp || '',
    area: editing?.area || '',
    yearsExp: editing?.yearsExp != null ? String(editing.yearsExp) : '',
    priceNote: editing?.priceNote || '',
    bio: editing?.bio || '',
    photo: editing?.photo || '',
    tradeIds: (editing?.trades || []).map((t) => t.id),
    verified: editing?.verified || false,
    status: editing?.status || 'ACTIVE',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const toggleTrade = (id) =>
    set('tradeIds', f.tradeIds.includes(id) ? f.tradeIds.filter((t) => t !== id) : [...f.tradeIds, id]);

  async function handlePhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Please choose an image file');
    if (file.size > 5 * 1024 * 1024) return setError('Photo must be under 5MB');
    setError(null);
    setUploading(true);
    try { set('photo', await uploadToCloudinary(file, 'firstchoice/pros')); }
    catch (err) { setError(err.message); }
    setUploading(false);
  }

  const valid = f.name.trim() && f.phone.trim() && f.tradeIds.length > 0;

  async function save() {
    if (!valid) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: f.name.trim(),
        phone: f.phone.trim(),
        whatsapp: f.whatsapp.trim() || null,
        area: f.area.trim() || null,
        bio: f.bio.trim() || null,
        photo: f.photo || null,
        priceNote: f.priceNote.trim() || null,
        yearsExp: f.yearsExp === '' ? null : Number(f.yearsExp),
        verified: f.verified,
        status: f.status,
        tradeIds: f.tradeIds,
      };
      await call(authFetch, editing ? `/admin/pros/${editing.id}` : '/admin/pros', editing ? 'PATCH' : 'POST', payload);
      onSaved();
      onClose();
    } catch (e) {
      setError(e.message || 'Could not save');
    }
    setSaving(false);
  }

  return (
    <div onClick={(e) => e.stopPropagation()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 620, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f1117', margin: 0 }}>{editing ? 'Edit Professional' : 'Add Professional'}</h3>
            <p style={{ fontSize: 13, color: '#9ca3af', margin: '3px 0 0' }}>Customers will see this in the app and can call directly</p>
          </div>
          <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 8, display: 'flex' }}><X size={16} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 13, fontWeight: 600 }}>{error}</div>}

          {/* Photo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ position: 'relative' }}>
              <Avatar pro={{ name: f.name, photo: f.photo }} size={72} />
              {uploading && (
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(255,255,255,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: '#16a34a' }} />
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, border: '1.5px solid #16a34a', color: '#16a34a', fontSize: 12, fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer' }}>
                <Upload size={13} /> {f.photo ? 'Change photo' : 'Upload photo'}
                <input type="file" accept="image/*" onChange={handlePhoto} disabled={uploading} style={{ display: 'none' }} />
              </label>
              {f.photo && (
                <button type="button" onClick={() => set('photo', '')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <Trash2 size={12} /> Remove
                </button>
              )}
            </div>
          </div>

          <Field label="Full name" required>
            <input style={inputCss} value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Kwame Mensah" />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Phone" required hint="Customers tap this to call">
              <input style={inputCss} value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="0241234567" />
            </Field>
            <Field label="WhatsApp" hint="Leave empty to use the phone number">
              <input style={inputCss} value={f.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="Optional" />
            </Field>
          </div>

          <Field label="Trades" required hint="Pick every trade this person does">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {trades.filter((t) => t.active || f.tradeIds.includes(t.id)).map((t) => {
                const on = f.tradeIds.includes(t.id);
                return (
                  <button key={t.id} type="button" onClick={() => toggleTrade(t.id)}
                    style={{ padding: '6px 14px', borderRadius: 50, border: `1.5px solid ${on ? '#16a34a' : '#e5e7eb'}`, background: on ? '#f0fdf4' : '#fff', color: on ? '#16a34a' : '#6b7280', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {t.icon} {t.name}
                  </button>
                );
              })}
              {trades.length === 0 && <span style={{ fontSize: 12, color: '#9ca3af' }}>No trades yet — add some under “Manage trades”.</span>}
            </div>
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Area">
              <input style={inputCss} value={f.area} onChange={(e) => set('area', e.target.value)} placeholder="e.g. Agona Nkwanta & surroundings" />
            </Field>
            <Field label="Years of experience">
              <input style={inputCss} type="number" min="0" value={f.yearsExp} onChange={(e) => set('yearsExp', e.target.value)} placeholder="e.g. 8" />
            </Field>
          </div>

          <Field label="Price note" hint="Free text shown on the card, e.g. “From GHS 80 per visit”">
            <input style={inputCss} value={f.priceNote} onChange={(e) => set('priceNote', e.target.value)} placeholder="Optional" />
          </Field>

          <Field label="About">
            <textarea rows={3} style={{ ...inputCss, height: 'auto', padding: '10px 12px', resize: 'vertical' }} value={f.bio} onChange={(e) => set('bio', e.target.value)} placeholder="Short description of the work they do…" />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Visibility" hint="Only “Live” professionals appear in the app">
              <select style={inputCss} value={f.status} onChange={(e) => set('status', e.target.value)}>
                <option value="ACTIVE">Live — visible to customers</option>
                <option value="DRAFT">Draft — not visible yet</option>
                <option value="INACTIVE">Hidden — taken down</option>
              </select>
            </Field>
            <Field label="Verified" hint="Shows a blue tick and ranks higher">
              <div style={{ height: 42, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Switch checked={f.verified} onChange={(v) => set('verified', v)} />
                <span style={{ fontSize: 13, color: f.verified ? '#2563eb' : '#9ca3af', fontWeight: 700 }}>{f.verified ? 'Verified' : 'Not verified'}</span>
              </div>
            </Field>
          </div>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 10, background: '#fafafa', borderRadius: '0 0 20px 20px' }}>
          <div style={{ flex: 1, fontSize: 12 }}>
            {valid ? <span style={{ color: '#16a34a' }}>✓ Ready to save</span> : <span style={{ color: '#f59e0b' }}>⚠ Name, phone and at least one trade are required</span>}
          </div>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#374151', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={save} disabled={saving || uploading || !valid}
            style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: valid ? `linear-gradient(135deg,${theme.green},${theme.greenMid})` : '#e5e7eb', color: valid ? '#fff' : '#9ca3af', fontWeight: 700, fontSize: 14, cursor: valid ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit' }}>
            {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
            {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Professional'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MANAGE TRADES
══════════════════════════════════════════ */
function TradesModal({ trades, authFetch, theme, onClose, onChanged }) {
  const [icon, setIcon] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function run(fn) {
    setBusy(true);
    setError(null);
    try { await fn(); await onChanged(); } catch (e) { setError(e.message); }
    setBusy(false);
  }

  const add = () => run(async () => {
    if (!name.trim()) throw new Error('Enter a trade name');
    await call(authFetch, '/admin/trades', 'POST', { name: name.trim(), icon: icon.trim() || null, sortOrder: trades.length + 1 });
    setName(''); setIcon('');
  });

  const patch = (id, body) => run(() => call(authFetch, `/admin/trades/${id}`, 'PATCH', body));

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,17,23,0.5)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480, maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#0f1117' }}>Manage trades</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>What customers can pick in the app</div>
          </div>
          <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 8, display: 'flex' }}><X size={16} /></button>
        </div>

        <div style={{ padding: '16px 22px', overflowY: 'auto', flex: 1 }}>
          {error && <div style={{ padding: '9px 12px', borderRadius: 10, background: '#fef2f2', color: '#b91c1c', fontSize: 12, fontWeight: 600, marginBottom: 12 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🧱" maxLength={4}
              style={{ ...inputCss, width: 54, height: 40, textAlign: 'center', padding: 0 }} />
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New trade, e.g. Welder" onKeyDown={(e) => e.key === 'Enter' && add()}
              style={{ ...inputCss, height: 40, flex: 1 }} />
            <button onClick={add} disabled={busy || !name.trim()}
              style={{ padding: '0 16px', borderRadius: 10, border: 'none', background: name.trim() ? theme.green : '#e5e7eb', color: name.trim() ? '#fff' : '#9ca3af', fontWeight: 700, fontSize: 13, cursor: name.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Plus size={14} /> Add
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {trades.map((t) => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: '1px solid #f0f0f0', borderRadius: 12, opacity: t.active ? 1 : 0.55 }}>
                <input defaultValue={t.icon || ''} maxLength={4}
                  onBlur={(e) => e.target.value !== (t.icon || '') && patch(t.id, { icon: e.target.value })}
                  style={{ width: 40, height: 34, textAlign: 'center', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 16, outline: 'none' }} />
                <input defaultValue={t.name}
                  onBlur={(e) => e.target.value.trim() && e.target.value !== t.name && patch(t.id, { name: e.target.value })}
                  style={{ flex: 1, height: 34, padding: '0 10px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, fontWeight: 600, outline: 'none', fontFamily: 'inherit' }} />
                <span style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap' }}>{t._count?.professionals ?? 0} pros</span>
                <Switch checked={t.active} onChange={(v) => patch(t.id, { active: v })} />
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 12 }}>Edit a name or icon directly and click away to save. Switching a trade off hides it from customers without deleting it.</p>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN SCREEN
══════════════════════════════════════════ */
export default function AdminPros({ authFetch, theme }) {
  const [pros, setPros] = useState([]);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [tradeFilter, setTradeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(null);        // { editing: pro | null }
  const [tradesOpen, setTradesOpen] = useState(false);
  const [actingId, setActingId] = useState(null);

  const loadTrades = useCallback(async () => {
    try { setTrades(await call(authFetch, '/admin/trades')); } catch (e) { setError(e.message); }
  }, [authFetch]);

  const loadPros = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...(statusFilter && { status: statusFilter }), ...(tradeFilter && { tradeId: tradeFilter }) });
      setPros(await call(authFetch, `/admin/pros?${params}`));
      setError(null);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, [authFetch, statusFilter, tradeFilter]);

  useEffect(() => { loadTrades(); }, [loadTrades]);
  useEffect(() => { loadPros(); }, [loadPros]);

  async function quickPatch(p, body) {
    setActingId(p.id);
    try { await call(authFetch, `/admin/pros/${p.id}`, 'PATCH', body); await loadPros(); }
    catch (e) { setError(e.message); }
    setActingId(null);
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pros;
    return pros.filter((p) => [p.name, p.phone, p.area].some((v) => (v || '').toLowerCase().includes(q)));
  }, [pros, search]);

  const stats = useMemo(() => ({
    total: pros.length,
    live: pros.filter((p) => p.status === 'ACTIVE').length,
    draft: pros.filter((p) => p.status === 'DRAFT').length,
    contacts: pros.reduce((s, p) => s + (p._count?.calls || 0), 0),
  }), [pros]);

  const columns = [
    {
      key: 'pro', label: 'Professional',
      render: (p) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar pro={p} />
          <div>
            <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              {p.name}{p.verified && <BadgeCheck size={14} color="#2563eb" />}
            </div>
            <div style={{ color: '#9ca3af', fontSize: 12 }}>{p.phone}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'trades', label: 'Trades',
      render: (p) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {(p.trades || []).map((t) => (
            <span key={t.id} style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 50, background: '#f0fdf4', color: '#16a34a' }}>{t.name}</span>
          ))}
        </div>
      ),
    },
    { key: 'area', label: 'Area', render: (p) => <span style={{ color: '#6b7280', fontSize: 12 }}>{p.area || '—'}{p.yearsExp != null ? ` · ${p.yearsExp} yrs` : ''}</span> },
    {
      key: 'rating', label: 'Rating',
      render: (p) => p.reviewCount > 0
        ? <span style={{ fontWeight: 700 }}>⭐ {Number(p.rating).toFixed(1)} <span style={{ color: '#9ca3af', fontWeight: 500 }}>({p.reviewCount})</span></span>
        : <span style={{ color: '#9ca3af' }}>New</span>,
    },
    { key: 'contacts', label: 'Contacts', render: (p) => <span style={{ fontWeight: 700 }}>{p._count?.calls ?? 0}</span> },
    { key: 'status', label: 'Status', render: (p) => <StatusPill status={p.status} /> },
    {
      key: 'actions', label: '',
      render: (p) => {
        const busy = actingId === p.id;
        const btn = { width: 30, height: 30, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
        return (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            {busy ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite', color: '#16a34a' }} /> : (
              <>
                <button title={p.verified ? 'Remove verification' : 'Mark verified'} style={btn} onClick={() => quickPatch(p, { verified: !p.verified })}>
                  <BadgeCheck size={14} color={p.verified ? '#2563eb' : '#9ca3af'} />
                </button>
                <button title={p.status === 'ACTIVE' ? 'Hide from customers' : 'Publish'} style={btn}
                  onClick={() => quickPatch(p, { status: p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}>
                  {p.status === 'ACTIVE' ? <EyeOff size={14} color="#6b7280" /> : <Eye size={14} color="#16a34a" />}
                </button>
                <button title="Edit" style={btn} onClick={() => setModal({ editing: p })}><Pencil size={13} color="#374151" /></button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12, marginBottom: 18 }}>
        <StatCard loading={loading} icon={<Users size={16} />} label="Professionals" value={stats.total} color="#8b5cf6" />
        <StatCard loading={loading} icon={<CheckCircle size={16} />} label="Live" value={stats.live} color="#10b981" />
        <StatCard loading={loading} icon={<FileText size={16} />} label="Drafts" value={stats.draft} color="#f59e0b" />
        <StatCard loading={loading} icon={<PhoneCall size={16} />} label="Customer contacts" value={stats.contacts} color="#3b82f6" />
      </div>

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input placeholder="Search name, phone or area..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', height: 36, paddingLeft: 32, paddingRight: 10, border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 12, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
        </div>
        <select value={tradeFilter} onChange={(e) => setTradeFilter(e.target.value)}
          style={{ height: 36, padding: '0 10px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 12, outline: 'none', background: '#fff', fontFamily: 'inherit' }}>
          <option value="">All trades</option>
          {trades.map((t) => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          style={{ height: 36, padding: '0 10px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 12, outline: 'none', background: '#fff', fontFamily: 'inherit' }}>
          <option value="">All statuses</option>
          <option value="ACTIVE">Live</option>
          <option value="DRAFT">Draft</option>
          <option value="INACTIVE">Hidden</option>
        </select>
        <button onClick={() => setTradesOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
          <Tag size={13} /> Manage trades
        </button>
        <button onClick={() => setModal({ editing: null })}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: 'none', background: `linear-gradient(135deg,${theme.green},${theme.greenMid})`, color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
          <Plus size={13} /> Add Professional
        </button>
      </div>

      <div style={{ border: '1px solid #f0f0f0', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
        <Table columns={columns} data={visible} loading={loading}
          emptyMsg={pros.length === 0 ? 'No professionals yet — add your first one' : 'No professionals match your filters'} />
      </div>

      {modal && (
        <ProModal editing={modal.editing} trades={trades} authFetch={authFetch} theme={theme}
          onClose={() => setModal(null)} onSaved={() => { loadPros(); loadTrades(); }} />
      )}
      {tradesOpen && (
        <TradesModal trades={trades} authFetch={authFetch} theme={theme} onClose={() => setTradesOpen(false)}
          onChanged={async () => { await Promise.all([loadTrades(), loadPros()]); }} />
      )}
    </div>
  );
}