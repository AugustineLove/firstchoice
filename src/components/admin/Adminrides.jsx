'use client';
// Admin → Rides. Dispatch ride requests, manage drivers, edit fares.
//
// Usage in AdminDashboard:
//   rides: <AdminRides authFetch={authFetch} theme={theme} />
//   NAV_ITEMS: { id: 'rides', label: 'Rides', icon: <Car size={18}/> }   (import Car from lucide-react)

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X, Loader2, Plus, Search, Pencil, Save, Upload, Trash2, BadgeCheck, Eye, EyeOff,
  Car, Clock, CheckCircle, Users, UserPlus, Navigation,
} from 'lucide-react';
import { StatCard, Table } from '../../pages/customer/AdminDashboard';

const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
  console.error('Cloudinary environment variables are missing.');
}

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

const VEHICLES = {
  TRICYCLE: { label: 'Tricycle', emoji: '🛺' },
  MOTORBIKE: { label: 'Motorbike', emoji: '🏍️' },
  TAXI: { label: 'Taxi', emoji: '🚕' },
  TRUCK: { label: 'Truck', emoji: '🚚' },
  OTHER: { label: 'Other', emoji: '🚐' },
};
const vLabel = (t) => `${VEHICLES[t]?.emoji || '🚗'} ${VEHICLES[t]?.label || t}`;
const ghs = (n) => `GHS ${Number(n || 0).toFixed(Number.isInteger(Number(n)) ? 0 : 2)}`;

const RIDE_STATUS = {
  PENDING:     { bg: '#fffbeb', color: '#b45309', label: 'Pending' },
  ACCEPTED:    { bg: '#ede9fe', color: '#5b21b6', label: 'Driver assigned' },
  ARRIVED:     { bg: '#dbeafe', color: '#1e40af', label: 'Arrived' },
  IN_PROGRESS: { bg: '#e0f2fe', color: '#0369a1', label: 'On trip' },
  COMPLETED:   { bg: '#f0fdf4', color: '#16a34a', label: 'Completed' },
  CANCELLED:   { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
};
const LISTING_STATUS = {
  ACTIVE:   { bg: '#f0fdf4', color: '#16a34a', label: 'Live' },
  DRAFT:    { bg: '#fffbeb', color: '#b45309', label: 'Draft' },
  INACTIVE: { bg: '#f3f4f6', color: '#6b7280', label: 'Hidden' },
};
const AVAIL = {
  ONLINE:  { bg: '#d1fae5', color: '#065f46', label: 'Online' },
  BUSY:    { bg: '#dbeafe', color: '#1e40af', label: 'Busy' },
  OFFLINE: { bg: '#f3f4f6', color: '#374151', label: 'Offline' },
};

function Pill({ map, value }) {
  const s = map[value] || { bg: '#f3f4f6', color: '#374151', label: value };
  return <span style={{ padding: '3px 10px', borderRadius: 50, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>{s.label}</span>;
}

function Switch({ checked, onChange, disabled }) {
  return (
    <button type="button" disabled={disabled} onClick={() => onChange(!checked)}
      style={{ width: 40, height: 22, borderRadius: 50, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, padding: 2, background: checked ? '#16a34a' : '#d1d5db', transition: 'background .2s', display: 'flex', justifyContent: checked ? 'flex-end' : 'flex-start', flexShrink: 0 }}>
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
const selectCss = { height: 36, padding: '0 10px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 12, outline: 'none', background: '#fff', fontFamily: 'inherit' };
const iconBtn = { width: 30, height: 30, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const errBox = { padding: '10px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 13, fontWeight: 600 };

function Avatar({ person, size = 38 }) {
  const initials = (person.name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.34, fontWeight: 800 }}>
      {person.photo ? <img src={person.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => (e.target.style.display = 'none')} /> : initials}
    </div>
  );
}

function ModalShell({ title, sub, onClose, maxWidth = 520, children, footer }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,17,23,0.5)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#0f1117' }}>{title}</div>
            {sub && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{sub}</div>}
          </div>
          <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 8, display: 'flex' }}><X size={16} /></button>
        </div>
        <div style={{ padding: '18px 22px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
        {footer && <div style={{ padding: '14px 22px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#fafafa', borderRadius: '0 0 20px 20px' }}>{footer}</div>}
      </div>
    </div>
  );
}

const primaryBtn = (theme, enabled = true) => ({
  padding: '10px 22px', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: 14, fontFamily: 'inherit',
  cursor: enabled ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 8,
  background: enabled ? `linear-gradient(135deg,${theme.green},${theme.greenMid})` : '#e5e7eb', color: enabled ? '#fff' : '#9ca3af',
});
const ghostBtn = { padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#374151', fontFamily: 'inherit' };

/* ══════════════════════════════════════════
   REQUESTS TAB
══════════════════════════════════════════ */
const NEXT_STEP = {
  ACCEPTED:    { to: 'ARRIVED', label: 'Arrived' },
  ARRIVED:     { to: 'IN_PROGRESS', label: 'Start trip' },
  IN_PROGRESS: { to: 'COMPLETED', label: 'Complete' },
};

function AssignModal({ ride, authFetch, theme, onClose, onDone }) {
  const [drivers, setDrivers] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    call(authFetch, `/admin/drivers?status=ACTIVE&vehicleType=${ride.vehicleType}`)
      .then(setDrivers).catch((e) => { setError(e.message); setDrivers([]); });
  }, [authFetch, ride.vehicleType]);

  async function assign(d) {
    setBusyId(d.id);
    setError(null);
    try {
      await call(authFetch, `/admin/rides/${ride.id}/assign`, 'PATCH', { driverId: d.id });
      onDone();
      onClose();
    } catch (e) { setError(e.message); }
    setBusyId(null);
  }

  const sorted = (drivers || []).slice().sort((a, b) => (a.availability === 'ONLINE' ? 0 : 1) - (b.availability === 'ONLINE' ? 0 : 1));

  return (
    <ModalShell title={ride.driver ? 'Reassign driver' : 'Assign driver'} sub={`${vLabel(ride.vehicleType)} · ${ride.pickupAddress} → ${ride.destinationAddress}`} onClose={onClose}>
      {error && <div style={errBox}>{error}</div>}
      {drivers === null && <div style={{ textAlign: 'center', padding: 24 }}><Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: theme.green }} /></div>}
      {drivers && drivers.length === 0 && <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: 16 }}>No live {VEHICLES[ride.vehicleType]?.label.toLowerCase()} drivers. Add one in the Drivers tab.</div>}
      {sorted.map((d) => {
        const busy = d.availability === 'BUSY';
        const current = ride.driver?.id === d.id;
        return (
          <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid #f0f0f0', borderRadius: 12, opacity: busy || current ? 0.55 : 1 }}>
            <Avatar person={d} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{d.name}</div>
              <div style={{ color: '#9ca3af', fontSize: 12 }}>{[d.phone, d.vehicleDescription, d.plateNumber].filter(Boolean).join(' · ')}</div>
            </div>
            <Pill map={AVAIL} value={d.availability} />
            <button disabled={busy || current || busyId === d.id} onClick={() => assign(d)}
              style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: busy || current ? '#e5e7eb' : theme.green, color: busy || current ? '#9ca3af' : '#fff', fontWeight: 700, fontSize: 12, cursor: busy || current ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {busyId === d.id ? '...' : current ? 'Current' : 'Assign'}
            </button>
          </div>
        );
      })}
    </ModalShell>
  );
}

function CompleteModal({ ride, authFetch, theme, onClose, onDone }) {
  const [fare, setFare] = useState(String(ride.estimatedFare ?? ''));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function complete() {
    setBusy(true);
    setError(null);
    try {
      await call(authFetch, `/admin/rides/${ride.id}/status`, 'PATCH', { status: 'COMPLETED', finalFare: fare === '' ? undefined : Number(fare) });
      onDone();
      onClose();
    } catch (e) { setError(e.message); }
    setBusy(false);
  }

  return (
    <ModalShell title="Complete ride" sub="Confirm what the customer actually paid" onClose={onClose} maxWidth={380}
      footer={<>
        <button onClick={onClose} style={ghostBtn}>Back</button>
        <button onClick={complete} disabled={busy} style={primaryBtn(theme)}>{busy ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={15} />} Complete</button>
      </>}>
      {error && <div style={errBox}>{error}</div>}
      <Field label="Final fare (GHS)" hint={`Estimated was ${ghs(ride.estimatedFare)}. Change it if the agreed fare differed.`}>
        <input style={inputCss} type="number" min="0" step="0.5" value={fare} onChange={(e) => setFare(e.target.value)} />
      </Field>
    </ModalShell>
  );
}

function RequestsTab({ authFetch, theme }) {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [assigning, setAssigning] = useState(null);
  const [completing, setCompleting] = useState(null);
  const [actingId, setActingId] = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const q = new URLSearchParams({ limit: '100', ...(statusFilter && { status: statusFilter }) });
      const data = await call(authFetch, `/admin/rides?${q}`);
      setRides(data.rides);
      setError(null);
    } catch (e) { setError(e.message); }
    if (!silent) setLoading(false);
  }, [authFetch, statusFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setInterval(() => load(true), 15000);
    return () => clearInterval(t);
  }, [load]);

  async function setStatus(r, status) {
    setActingId(r.id);
    try { await call(authFetch, `/admin/rides/${r.id}/status`, 'PATCH', { status }); await load(true); }
    catch (e) { setError(e.message); }
    setActingId(null);
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rides;
    return rides.filter((r) => [r.id, r.customer?.name, r.customer?.phone, r.pickupAddress, r.destinationAddress, r.driver?.name]
      .some((v) => (v || '').toLowerCase().includes(q)));
  }, [rides, search]);

  const stats = useMemo(() => ({
    pending: rides.filter((r) => r.status === 'PENDING').length,
    active: rides.filter((r) => ['ACCEPTED', 'ARRIVED', 'IN_PROGRESS'].includes(r.status)).length,
    done: rides.filter((r) => r.status === 'COMPLETED').length,
    earned: rides.filter((r) => r.status === 'COMPLETED').reduce((s, r) => s + (r.finalFare ?? r.estimatedFare ?? 0), 0),
  }), [rides]);

  const columns = [
    {
      key: 'ride', label: 'Ride',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 700 }}>#{r.id.slice(-6).toUpperCase()} · {r.customer?.name}</div>
          <div style={{ color: '#9ca3af', fontSize: 12 }}>{r.customer?.phone} · {new Date(r.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      ),
    },
    {
      key: 'route', label: 'Route',
      render: (r) => (
        <div style={{ maxWidth: 260, fontSize: 12 }}>
          <div style={{ color: '#16a34a', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>● {r.pickupAddress}</div>
          <div style={{ color: '#dc2626', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>● {r.destinationAddress}</div>
          {r.notes && <div style={{ color: '#9ca3af', marginTop: 2, fontStyle: 'italic' }}>“{r.notes}”</div>}
        </div>
      ),
    },
    {
      key: 'vehicle', label: 'Vehicle',
      render: (r) => <div style={{ fontSize: 12 }}><div style={{ fontWeight: 700 }}>{vLabel(r.vehicleType)}</div><div style={{ color: '#9ca3af' }}>{r.passengers} pax · {r.paymentMethod}</div></div>,
    },
    {
      key: 'fare', label: 'Fare',
      render: (r) => <span style={{ fontWeight: 800, color: '#10b981' }}>{ghs(r.finalFare ?? r.estimatedFare)}</span>,
    },
    {
      key: 'driver', label: 'Driver',
      render: (r) => r.driver
        ? <div style={{ fontSize: 12 }}><div style={{ fontWeight: 700 }}>{r.driver.name}</div><div style={{ color: '#9ca3af' }}>{r.driver.phone}</div></div>
        : <span style={{ color: '#9ca3af' }}>—</span>,
    },
    { key: 'status', label: 'Status', render: (r) => <Pill map={RIDE_STATUS} value={r.status} /> },
    {
      key: 'actions', label: '',
      render: (r) => {
        if (actingId === r.id) return <Loader2 size={15} style={{ animation: 'spin 1s linear infinite', color: theme.green }} />;
        const next = NEXT_STEP[r.status];
        const small = (bg, color, border) => ({ padding: '5px 10px', borderRadius: 8, border: `1px solid ${border}`, background: bg, color, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' });
        return (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            {['PENDING', 'ACCEPTED', 'ARRIVED'].includes(r.status) && (
              <button style={small(r.status === 'PENDING' ? theme.green : '#fff', r.status === 'PENDING' ? '#fff' : '#374151', r.status === 'PENDING' ? theme.green : '#e5e7eb')} onClick={() => setAssigning(r)}>
                {r.driver ? 'Reassign' : 'Assign driver'}
              </button>
            )}
            {next && (
              <button style={small('#eff6ff', '#1d4ed8', '#bfdbfe')} onClick={() => (next.to === 'COMPLETED' ? setCompleting(r) : setStatus(r, next.to))}>{next.label}</button>
            )}
            {['PENDING', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS'].includes(r.status) && (
              <button style={small('#fef2f2', '#dc2626', '#fecaca')} onClick={() => window.confirm(`Cancel ride #${r.id.slice(-6).toUpperCase()}?`) && setStatus(r, 'CANCELLED')}>Cancel</button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12, marginBottom: 18 }}>
        <StatCard loading={loading} icon={<Clock size={16} />} label="Waiting for driver" value={stats.pending} color="#f59e0b" />
        <StatCard loading={loading} icon={<Navigation size={16} />} label="In progress" value={stats.active} color="#3b82f6" />
        <StatCard loading={loading} icon={<CheckCircle size={16} />} label="Completed" value={stats.done} color="#10b981" />
        <StatCard loading={loading} icon={<Car size={16} />} label="Fares (completed)" value={ghs(stats.earned)} color="#8b5cf6" />
      </div>

      {error && <div style={{ ...errBox, marginBottom: 12 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input placeholder="Search customer, address, driver or ID..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', height: 36, paddingLeft: 32, paddingRight: 10, border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 12, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectCss}>
          <option value="">All statuses</option>
          {Object.entries(RIDE_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div style={{ border: '1px solid #f0f0f0', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
        <Table columns={columns} data={visible} loading={loading} emptyMsg="No ride requests yet" />
      </div>

      {assigning && <AssignModal ride={assigning} authFetch={authFetch} theme={theme} onClose={() => setAssigning(null)} onDone={() => load(true)} />}
      {completing && <CompleteModal ride={completing} authFetch={authFetch} theme={theme} onClose={() => setCompleting(null)} onDone={() => load(true)} />}
    </div>
  );
}

/* ══════════════════════════════════════════
   DRIVERS TAB
══════════════════════════════════════════ */
function DriverModal({ editing, authFetch, theme, onClose, onSaved }) {
  const [f, setF] = useState({
    name: editing?.name || '',
    phone: editing?.phone || '',
    photo: editing?.photo || '',
    vehicleType: editing?.vehicleType || 'TRICYCLE',
    vehicleDescription: editing?.vehicleDescription || '',
    plateNumber: editing?.plateNumber || '',
    verified: editing?.verified || false,
    status: editing?.status || 'ACTIVE',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const valid = f.name.trim() && f.phone.trim();

  async function handlePhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Please choose an image file');
    if (file.size > 5 * 1024 * 1024) return setError('Photo must be under 5MB');
    setError(null);
    setUploading(true);
    try { set('photo', await uploadToCloudinary(file, 'firstchoice/drivers')); }
    catch (err) { setError(err.message); }
    setUploading(false);
  }

  async function save() {
    if (!valid) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: f.name.trim(), phone: f.phone.trim(), photo: f.photo || null, vehicleType: f.vehicleType,
        vehicleDescription: f.vehicleDescription.trim() || null, plateNumber: f.plateNumber.trim() || null,
        verified: f.verified, status: f.status,
      };
      await call(authFetch, editing ? `/admin/drivers/${editing.id}` : '/admin/drivers', editing ? 'PATCH' : 'POST', payload);
      onSaved();
      onClose();
    } catch (e) { setError(e.message || 'Could not save'); }
    setSaving(false);
  }

  return (
    <ModalShell title={editing ? 'Edit driver' : 'Add driver'} sub="Customers see the name, vehicle and phone once a ride is assigned" onClose={onClose} maxWidth={560}
      footer={<>
        <button onClick={onClose} style={ghostBtn}>Cancel</button>
        <button onClick={save} disabled={saving || uploading || !valid} style={primaryBtn(theme, !!valid)}>
          {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
          {saving ? 'Saving...' : editing ? 'Save changes' : 'Add driver'}
        </button>
      </>}>
      {error && <div style={errBox}>{error}</div>}

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Avatar person={{ name: f.name, photo: f.photo }} size={64} />
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, border: '1.5px solid #16a34a', color: '#16a34a', fontSize: 12, fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer' }}>
          {uploading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={13} />} {f.photo ? 'Change photo' : 'Upload photo'}
          <input type="file" accept="image/*" onChange={handlePhoto} disabled={uploading} style={{ display: 'none' }} />
        </label>
        {f.photo && (
          <button type="button" onClick={() => set('photo', '')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Trash2 size={12} /> Remove
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Full name" required><input style={inputCss} value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Yaw Boateng" /></Field>
        <Field label="Phone" required><input style={inputCss} value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="0241234567" /></Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Vehicle type" required>
          <select style={inputCss} value={f.vehicleType} onChange={(e) => set('vehicleType', e.target.value)}>
            {Object.entries(VEHICLES).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
          </select>
        </Field>
        <Field label="Plate number"><input style={inputCss} value={f.plateNumber} onChange={(e) => set('plateNumber', e.target.value)} placeholder="Optional" /></Field>
      </div>

      <Field label="Vehicle description" hint="e.g. Red Aboboyaa, 3-seater"><input style={inputCss} value={f.vehicleDescription} onChange={(e) => set('vehicleDescription', e.target.value)} placeholder="Optional" /></Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Visibility" hint="Only “Live” drivers can be assigned rides">
          <select style={inputCss} value={f.status} onChange={(e) => set('status', e.target.value)}>
            <option value="ACTIVE">Live</option>
            <option value="DRAFT">Draft</option>
            <option value="INACTIVE">Hidden</option>
          </select>
        </Field>
        <Field label="Verified">
          <div style={{ height: 42, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Switch checked={f.verified} onChange={(v) => set('verified', v)} />
            <span style={{ fontSize: 13, color: f.verified ? '#2563eb' : '#9ca3af', fontWeight: 700 }}>{f.verified ? 'Verified' : 'Not verified'}</span>
          </div>
        </Field>
      </div>
    </ModalShell>
  );
}

function DriversTab({ authFetch, theme }) {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [actingId, setActingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ ...(typeFilter && { vehicleType: typeFilter }), ...(statusFilter && { status: statusFilter }) });
      setDrivers(await call(authFetch, `/admin/drivers?${q}`));
      setError(null);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, [authFetch, typeFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function quickPatch(d, body) {
    setActingId(d.id);
    try { await call(authFetch, `/admin/drivers/${d.id}`, 'PATCH', body); await load(); }
    catch (e) { setError(e.message); }
    setActingId(null);
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return drivers;
    return drivers.filter((d) => [d.name, d.phone, d.plateNumber].some((v) => (v || '').toLowerCase().includes(q)));
  }, [drivers, search]);

  const columns = [
    {
      key: 'driver', label: 'Driver',
      render: (d) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar person={d} />
          <div>
            <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>{d.name}{d.verified && <BadgeCheck size={14} color="#2563eb" />}</div>
            <div style={{ color: '#9ca3af', fontSize: 12 }}>{d.phone}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'vehicle', label: 'Vehicle',
      render: (d) => <div style={{ fontSize: 12 }}><div style={{ fontWeight: 700 }}>{vLabel(d.vehicleType)}</div><div style={{ color: '#9ca3af' }}>{[d.vehicleDescription, d.plateNumber].filter(Boolean).join(' · ') || '—'}</div></div>,
    },
    { key: 'rides', label: 'Rides', render: (d) => <span style={{ fontWeight: 700 }}>{d.totalRides}</span> },
    {
      key: 'avail', label: 'Availability',
      render: (d) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Switch checked={d.availability === 'ONLINE' || d.availability === 'BUSY'} disabled={d.availability === 'BUSY' || actingId === d.id}
            onChange={(on) => quickPatch(d, { availability: on ? 'ONLINE' : 'OFFLINE' })} />
          <Pill map={AVAIL} value={d.availability} />
        </div>
      ),
    },
    { key: 'status', label: 'Status', render: (d) => <Pill map={LISTING_STATUS} value={d.status} /> },
    {
      key: 'actions', label: '',
      render: (d) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          {actingId === d.id ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite', color: '#16a34a' }} /> : (
            <>
              <button title={d.verified ? 'Remove verification' : 'Mark verified'} style={iconBtn} onClick={() => quickPatch(d, { verified: !d.verified })}>
                <BadgeCheck size={14} color={d.verified ? '#2563eb' : '#9ca3af'} />
              </button>
              <button title={d.status === 'ACTIVE' ? 'Hide' : 'Publish'} style={iconBtn} onClick={() => quickPatch(d, { status: d.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}>
                {d.status === 'ACTIVE' ? <EyeOff size={14} color="#6b7280" /> : <Eye size={14} color="#16a34a" />}
              </button>
              <button title="Edit" style={iconBtn} onClick={() => setModal({ editing: d })}><Pencil size={13} color="#374151" /></button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      {error && <div style={{ ...errBox, marginBottom: 12 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input placeholder="Search name, phone or plate..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', height: 36, paddingLeft: 32, paddingRight: 10, border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 12, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={selectCss}>
          <option value="">All vehicles</option>
          {Object.entries(VEHICLES).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectCss}>
          <option value="">All statuses</option>
          <option value="ACTIVE">Live</option>
          <option value="DRAFT">Draft</option>
          <option value="INACTIVE">Hidden</option>
        </select>
        <button onClick={() => setModal({ editing: null })}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: 'none', background: `linear-gradient(135deg,${theme.green},${theme.greenMid})`, color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
          <UserPlus size={13} /> Add driver
        </button>
      </div>

      <div style={{ border: '1px solid #f0f0f0', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
        <Table columns={columns} data={visible} loading={loading} emptyMsg={drivers.length === 0 ? 'No drivers yet. Add your first one' : 'No drivers match your filters'} />
      </div>

      {modal && <DriverModal editing={modal.editing} authFetch={authFetch} theme={theme} onClose={() => setModal(null)} onSaved={load} />}
    </div>
  );
}

/* ══════════════════════════════════════════
   FARES TAB
══════════════════════════════════════════ */
function RateCard({ rate, authFetch, theme, onSaved }) {
  const [f, setF] = useState({ baseFare: String(rate.baseFare), perKm: String(rate.perKm), minFare: String(rate.minFare), active: rate.active });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const set = (k, v) => { setF((p) => ({ ...p, [k]: v })); setSaved(false); };

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await call(authFetch, `/admin/ride-rates/${rate.vehicleType}`, 'PUT', {
        baseFare: Number(f.baseFare), perKm: Number(f.perKm), minFare: Number(f.minFare), active: f.active,
      });
      setSaved(true);
      onSaved();
    } catch (e) { setError(e.message); }
    setSaving(false);
  }

  const num = (k, label) => (
    <Field label={label}>
      <input style={{ ...inputCss, height: 38 }} type="number" min="0" step="0.5" value={f[k]} onChange={(e) => set(k, e.target.value)} />
    </Field>
  );

  return (
    <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 14, padding: 18, opacity: f.active ? 1 : 0.6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 900 }}>{vLabel(rate.vehicleType)}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>{f.active ? 'Offered' : 'Hidden'}</span>
          <Switch checked={f.active} onChange={(v) => set('active', v)} />
        </div>
      </div>
      {error && <div style={{ ...errBox, marginBottom: 10, fontSize: 12 }}>{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {num('baseFare', 'Base (GHS)')}
        {num('perKm', 'Per km')}
        {num('minFare', 'Minimum')}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
        <span style={{ fontSize: 11, color: saved ? '#16a34a' : '#9ca3af' }}>
          {saved ? '✓ Saved. Live in the app now' : `Example 5 km: ${ghs(Math.max(Number(f.minFare) || 0, Math.round((Number(f.baseFare) || 0) + (Number(f.perKm) || 0) * 5 * 1.25)))}`}
        </span>
        <button onClick={save} disabled={saving} style={{ ...primaryBtn(theme), padding: '8px 16px', fontSize: 13 }}>
          {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />} Save
        </button>
      </div>
    </div>
  );
}

function FaresTab({ authFetch, theme }) {
  const [rates, setRates] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try { setRates(await call(authFetch, '/admin/ride-rates')); setError(null); }
    catch (e) { setError(e.message); }
  }, [authFetch]);
  useEffect(() => { load(); }, [load]);

  if (!rates && !error) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: theme.green }} /></div>;

  return (
    <div>
      {error && <div style={{ ...errBox, marginBottom: 12 }}>{error}</div>}
      <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 14px' }}>
        Fare = base + per-km × distance (with a small road allowance), never below the minimum. Changes apply to new requests immediately. No redeploy needed.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 14 }}>
        {(rates || []).map((r) => <RateCard key={r.vehicleType} rate={r} authFetch={authFetch} theme={theme} onSaved={load} />)}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN SCREEN
══════════════════════════════════════════ */
export default function AdminRides({ authFetch, theme }) {
  const [tab, setTab] = useState('requests');
  const tabs = [
    { id: 'requests', label: 'Requests', icon: <Car size={14} /> },
    { id: 'drivers', label: 'Drivers', icon: <Users size={14} /> },
    { id: 'fares', label: 'Fares', icon: <Navigation size={14} /> },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f1117', margin: 0 }}>Rides</h2>
        <p style={{ color: '#6b7280', fontSize: 14, margin: '4px 0 0' }}>Dispatch ride requests, manage drivers and set fares</p>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 18, borderBottom: '1px solid #f0f0f0' }}>
        {tabs.map((t) => {
          const on = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: on ? 800 : 600, color: on ? theme.green : '#6b7280', borderBottom: `2px solid ${on ? theme.green : 'transparent'}`, marginBottom: -1 }}>
              {t.icon} {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'requests' && <RequestsTab authFetch={authFetch} theme={theme} />}
      {tab === 'drivers' && <DriversTab authFetch={authFetch} theme={theme} />}
      {tab === 'fares' && <FaresTab authFetch={authFetch} theme={theme} />}
    </div>
  );
}