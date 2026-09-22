'use client';
import { useState, useEffect, useCallback, useMemo, useRef, Fragment } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Loader2, Search, X, Crosshair, Bike, Store, Flag, Zap, Clock, Phone,
  RefreshCw, Maximize2, Minimize2, ClipboardPaste, PlusCircle, PanelLeftClose,
  PanelLeft, Navigation, Info, ArrowUpDown, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import 'leaflet/dist/leaflet.css';

/* ═══════════════════════════════════════════════════════════════════════
   Constants
═══════════════════════════════════════════════════════════════════════ */
const POLL_MS = 15000;
const DEFAULT_CENTER = [4.9438, -2.0908]; // Agona Nkwanta — only used before markers exist
const AVG_SPEED_KMH = 18;                 // motorbike through town, for ETA hints
const STALE_MIN = 15;
const WARN_MIN = 5;
const BOTTOM_GUTTER = 24;                 // breathing room under the card
const MIN_SHELL = 480;

const STATUS = {
  PENDING:        { color: '#7c3aed', label: 'Waiting for a rider' },
  ACCEPTED:       { color: '#2563eb', label: 'Accepted' },
  RIDER_ASSIGNED: { color: '#2563eb', label: 'Rider assigned' },
  PICKED_UP:      { color: '#f59e0b', label: 'Picked up' },
  IN_TRANSIT:     { color: '#f59e0b', label: 'On the way' },
  ARRIVED:        { color: '#10b981', label: 'At the door' },
  DELIVERED:      { color: '#059669', label: 'Delivered' },
  CANCELLED:      { color: '#dc2626', label: 'Cancelled' },
};
const statusOf = (s) => STATUS[s] || { color: '#6b7280', label: s };

const RIDER_COLORS = { ONLINE: '#10b981', BUSY: '#f59e0b', OFFLINE: '#9ca3af' };
const URGENCY_COLOR = { stale: '#dc2626', warn: '#f59e0b', fresh: '#9ca3af' };

/* ── Status machines, mirrored from the backend, used to decide which
   "mark as..." buttons make sense for the currently selected job. ── */
const ORDER_STATUSES = ['PENDING', 'ACCEPTED', 'RIDER_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED', 'CANCELLED'];
const DELIVERY_STATUSES = ['PENDING', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];
const MANUAL_TRANSITIONS = {
  PENDING: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['PICKED_UP', 'CANCELLED'],
  PICKED_UP: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};
// Statuses the backend refuses to set without a rider already on the job.
const RIDER_REQUIRED_STATUSES = ['RIDER_ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED'];

function nextStatusesFor(job) {
  if (!job) return [];
  if (job.kind === 'manual') return MANUAL_TRANSITIONS[job.status] || [];
  const all = job.kind === 'order' ? ORDER_STATUSES : DELIVERY_STATUSES;
  return all.filter((s) => s !== job.status);
}

/* ═══════════════════════════════════════════════════════════════════════
   Helpers
═══════════════════════════════════════════════════════════════════════ */
function haversineKm(a, b) {
  if (!a || !b) return null;
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
const etaMin = (km) => (km == null ? null : Math.max(1, Math.round((km / AVG_SPEED_KMH) * 60)));
const coord = (p) => (p && p.latitude != null && p.longitude != null ? [p.latitude, p.longitude] : null);
const riderPos = (r) => (r && r.latitude != null && r.longitude != null ? [r.latitude, r.longitude] : null);
const fmtAge = (m) => (m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`);
const urgencyOf = (m) => (m >= STALE_MIN ? 'stale' : m >= WARN_MIN ? 'warn' : 'fresh');
const ghs = (n) => `GHS ${Number(n || 0).toFixed(2)}`;

/* Client-side mirror of the backend paste parser — pre-fill only; server revalidates. */
function parseOffBookText(raw) {
  const text = (raw || '').trim();
  if (!text) return {};
  const phoneMatch = text.match(/(?:\+?233|0)\d{9}|\+?\d[\d\s-]{7,}\d/);
  const amountMatch = text.match(/(?:GHS|GH₵|₵)\s*([\d,]+(?:\.\d{1,2})?)/i);
  const routeMatch = text.match(/(.+?)\s*(?:->|→|-{1,2}>|\bto\b)\s*(.+)/i);
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const nameLine = lines.find((l) => !/(?:GHS|₵|\d{7,})/i.test(l) && !routeMatch?.[0]?.includes(l));
  return {
    customerName: nameLine?.replace(/^name[:\-]\s*/i, '').slice(0, 80) || '',
    customerPhone: phoneMatch ? phoneMatch[0].replace(/[\s-]+/g, '') : '',
    amount: amountMatch ? amountMatch[1].replace(/,/g, '') : '',
    pickupAddress: routeMatch ? routeMatch[1].trim().slice(0, 200) : '',
    destinationAddress: routeMatch ? routeMatch[2].trim().slice(0, 200) : '',
  };
}

/* ═══════════════════════════════════════════════════════════════════════
   Markers
═══════════════════════════════════════════════════════════════════════ */
function riderIcon(color, { dimmed, selected }) {
  const size = selected ? 36 : 30;
  return L.divIcon({
    className: 'fc-anim',
    html: `<div class="fc-rider${selected ? ' fc-rider-sel' : ''}" style="
        --fc-c:${color};width:${size}px;height:${size}px;opacity:${dimmed ? 0.28 : 1}">
        <span class="fc-rider-glyph" style="font-size:${size / 2.5}px">🏍️</span>
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function pickupIcon(color, { dimmed, pulse, index, selected }) {
  const s = selected ? 28 : 24;
  return L.divIcon({
    className: '',
    html: `<div class="fc-pin-wrap" style="opacity:${dimmed ? 0.22 : 1}">
        ${pulse ? `<span class="fc-pulse" style="background:${color}"></span>` : ''}
        <div class="fc-pin${selected ? ' fc-pin-sel' : ''}" style="
          --fc-c:${color};width:${s}px;height:${s}px;font-size:${index != null ? 11 : 0}px">
          ${index ?? ''}
        </div>
      </div>`,
    iconSize: [s, s],
    iconAnchor: [s / 2, s / 2],
  });
}

function dropoffIcon(color, { dimmed, selected }) {
  const s = selected ? 20 : 17;
  return L.divIcon({
    className: '',
    html: `<div class="fc-drop" style="
      --fc-c:${color};width:${s}px;height:${s}px;opacity:${dimmed ? 0.22 : 1}"></div>`,
    iconSize: [s, s],
    iconAnchor: [s / 2, s / 2],
  });
}

/* ═══════════════════════════════════════════════════════════════════════
   Map bridge — hands the leaflet instance back, keeps it measured
═══════════════════════════════════════════════════════════════════════ */
function MapBridge({ onReady }) {
  const map = useMap();

  useEffect(() => {
    onReady(map);
    const kick = () => map.invalidateSize({ animate: false });
    const raf = requestAnimationFrame(kick);
    const timers = [setTimeout(kick, 180), setTimeout(kick, 700)];

    const el = map.getContainer();
    const ro = new ResizeObserver(kick);
    ro.observe(el);
    if (el.parentElement) ro.observe(el.parentElement);

    window.addEventListener('resize', kick);
    document.addEventListener('visibilitychange', kick);
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      ro.disconnect();
      window.removeEventListener('resize', kick);
      document.removeEventListener('visibilitychange', kick);
    };
  }, [map, onReady]);

  return null;
}

/* ═══════════════════════════════════════════════════════════════════════
   Presentational bits
═══════════════════════════════════════════════════════════════════════ */
function Stat({ value, label, color, alert }) {
  return (
    <div className="fc-stat" style={{ borderColor: alert ? `${color}44` : '#f0f0f0', background: alert ? `${color}0a` : '#fff' }}>
      <span style={{ fontSize: 17, fontWeight: 900, color, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 10.5, color: '#9ca3af', fontWeight: 600 }}>{label}</span>
    </div>
  );
}

function Toggle({ active, onClick, color, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="fc-toggle"
      style={{
        borderColor: active ? color : '#e8e8e8',
        background: active ? `${color}12` : '#fff',
        color: active ? color : '#9ca3af',
      }}
    >
      {children}
    </button>
  );
}

function Skeleton({ h = 14, w = '100%', r = 6, mt = 0 }) {
  return <div className="fc-skel" style={{ height: h, width: w, borderRadius: r, marginTop: mt }} />;
}

/* ═══════════════════════════════════════════════════════════════════════
   Address picker — search saved Locations first, fall back to free text
═══════════════════════════════════════════════════════════════════════ */
function AddressPicker({ label, value, locations, loadingLocations, accent, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const results = useMemo(() => {
    const list = locations || [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((l) => l.name?.toLowerCase().includes(q) || l.address?.toLowerCase().includes(q));
  }, [locations, query]);

  function pickSaved(loc) {
    onChange({ address: loc.address, name: loc.name, latitude: loc.latitude, longitude: loc.longitude, custom: false });
    setQuery('');
    setOpen(false);
  }

  function useTyped() {
    if (!query.trim()) return;
    onChange({ address: query.trim(), name: null, latitude: null, longitude: null, custom: true });
    setQuery('');
    setOpen(false);
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <label className="fc-label">{label}</label>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fc-field"
          style={{
            display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', cursor: 'pointer',
            borderColor: value?.address ? accent : undefined,
            background: value?.address ? `${accent}10` : '#fff',
          }}
        >
          {value?.address ? <CheckCircle2 size={14} color={accent} /> : <Search size={14} color="#9ca3af" />}
          <span style={{
            flex: 1, minWidth: 0, fontSize: 13, color: value?.address ? '#0f1117' : '#9ca3af',
            fontWeight: value?.address ? 700 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {value?.address || 'Search a saved location or type an address…'}
          </span>
          {value?.address && !value.custom && (
            <span style={{ fontSize: 8.5, fontWeight: 900, color: accent, background: `${accent}18`, padding: '2px 6px', borderRadius: 999, flexShrink: 0 }}>PIN</span>
          )}
          {value?.address && value.custom && (
            <span style={{ fontSize: 8.5, fontWeight: 900, color: '#9ca3af', background: '#f1f2f4', padding: '2px 6px', borderRadius: 999, flexShrink: 0 }}>NO PIN</span>
          )}
        </button>
      ) : (
        <div>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') useTyped(); if (e.key === 'Escape') setOpen(false); }}
            placeholder="Search saved locations or type a new address"
            className="fc-field"
          />
          <div style={{
            marginTop: 6, maxHeight: 190, overflowY: 'auto', border: '1px solid #e9eaec',
            borderRadius: 10, background: '#fff', boxShadow: '0 4px 14px rgba(0,0,0,.08)',
          }}>
            {loadingLocations ? (
              <div style={{ padding: 14, textAlign: 'center' }}><Loader2 size={16} className="fc-spin" color={accent} /></div>
            ) : results.length === 0 ? (
              <div style={{ padding: 12, fontSize: 12, color: '#9ca3af' }}>No saved location matches.</div>
            ) : (
              results.map((loc, i) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => pickSaved(loc)}
                  style={{
                    width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 1,
                    padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    borderTop: i === 0 ? 'none' : '1px solid #f4f5f6',
                  }}
                >
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0f1117' }}>{loc.name}</span>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>{loc.address}</span>
                </button>
              ))
            )}
            {query.trim() && (
              <button
                type="button"
                onClick={useTyped}
                style={{
                  width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', borderTop: '1px solid #f4f5f6',
                  background: '#fafbfc', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, color: accent,
                }}
              >
                Use "{query.trim()}" as a typed address (no map pin)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Off-book job modal
═══════════════════════════════════════════════════════════════════════ */
function AddManualJobModal({ onClose, onSubmit, submitting, locations, loadingLocations }) {
  const [pasteText, setPasteText] = useState('');
  const [form, setForm] = useState({
    customerName: '', customerPhone: '',
    pickup: { address: '', latitude: null, longitude: null, custom: false },
    destination: { address: '', latitude: null, longitude: null, custom: false },
    amount: '', paymentMethod: 'CASH', itemDescription: '',
  });
  const [error, setError] = useState('');
  const [parsed, setParsed] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const applyParse = () => {
    const p = parseOffBookText(pasteText);
    setForm((f) => ({
      ...f,
      customerName: p.customerName || f.customerName,
      customerPhone: p.customerPhone || f.customerPhone,
      pickup: p.pickupAddress ? { address: p.pickupAddress, latitude: null, longitude: null, custom: true } : f.pickup,
      destination: p.destinationAddress ? { address: p.destinationAddress, latitude: null, longitude: null, custom: true } : f.destination,
      amount: p.amount || f.amount,
    }));
    setParsed(true);
    setTimeout(() => setParsed(false), 1800);
  };

  const handleSubmit = () => {
    if (!form.pickup.address.trim() || !form.destination.address.trim()) {
      setError('Pickup and destination addresses are both required.');
      return;
    }
    setError('');
    onSubmit({
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      pickupAddress: form.pickup.address,
      pickupLatitude: form.pickup.latitude ?? undefined,
      pickupLongitude: form.pickup.longitude ?? undefined,
      destinationAddress: form.destination.address,
      destinationLatitude: form.destination.latitude ?? undefined,
      destinationLongitude: form.destination.longitude ?? undefined,
      amount: form.amount ? Number(form.amount) : 0,
      paymentMethod: form.paymentMethod,
      itemDescription: form.itemDescription,
      rawNote: pasteText || undefined,
    });
  };

  return (
    <div className="fc-modal-bg" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="fc-modal">
        <div className="fc-modal-head">
          <div>
            <div style={{ fontWeight: 900, fontSize: 15, color: '#0f1117' }}>Add off-book job</div>
            <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 2 }}>
              For work taken outside the app — calls, walk-ins, WhatsApp
            </div>
          </div>
          <button className="fc-icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="fc-modal-body">
          <div>
            <label className="fc-label">Paste the raw message <span style={{ color: '#c4c4c4' }}>(optional)</span></label>
            <textarea
              className="fc-field"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={'Ama Owusu, 024 555 1234\nKotokuraba Market -> 15 Liberation Rd\nGHS 45'}
              rows={4}
              style={{ resize: 'vertical', lineHeight: 1.5 }}
            />
            <button className="fc-ghost-btn" onClick={applyParse} disabled={!pasteText.trim()}>
              {parsed ? <CheckCircle2 size={13} color="#10b981" /> : <ClipboardPaste size={13} />}
              {parsed ? 'Fields filled' : 'Fill fields from paste'}
            </button>
          </div>

          <div className="fc-divider" />

          <div className="fc-grid2">
            <div>
              <label className="fc-label">Customer name</label>
              <input className="fc-field" value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
            </div>
            <div>
              <label className="fc-label">Phone</label>
              <input className="fc-field" value={form.customerPhone}
                onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} />
            </div>
          </div>

          <AddressPicker
            label={<>Pickup address <span style={{ color: '#dc2626' }}>*</span></>}
            value={form.pickup}
            locations={locations}
            loadingLocations={loadingLocations}
            accent="#10b981"
            onChange={(v) => setForm((f) => ({ ...f, pickup: v }))}
          />
          <div style={{ height: 12 }} />
          <AddressPicker
            label={<>Destination address <span style={{ color: '#dc2626' }}>*</span></>}
            value={form.destination}
            locations={locations}
            loadingLocations={loadingLocations}
            accent="#ef4444"
            onChange={(v) => setForm((f) => ({ ...f, destination: v }))}
          />

          <div className="fc-grid2" style={{ marginTop: 14 }}>
            <div>
              <label className="fc-label">Amount (GHS)</label>
              <input className="fc-field" type="number" value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <label className="fc-label">Payment method</label>
              <select className="fc-field" value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                <option value="CASH">Cash</option>
                <option value="MOMO">Momo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="fc-label">Item / note</label>
            <input className="fc-field" value={form.itemDescription}
              placeholder="What's being delivered"
              onChange={(e) => setForm({ ...form, itemDescription: e.target.value })} />
          </div>

          {error && (
            <div className="fc-error">
              <AlertCircle size={13} /> {error}
            </div>
          )}
        </div>

        <div className="fc-modal-foot">
          <button className="fc-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="fc-btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 size={14} className="fc-spin" /> : <PlusCircle size={14} />}
            {submitting ? 'Adding…' : 'Add to jobs'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Main
═══════════════════════════════════════════════════════════════════════ */
export function LiveRiderMap({ authFetch, theme, assignUrl, statusUrl }) {
  const { on } = useSocket();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [feedError, setFeedError] = useState(false);

  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedRiderId, setSelectedRiderId] = useState(null);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('queue');            // queue | live | riders
  const [sortBy, setSortBy] = useState('age');        // age | value
  const [show, setShow] = useState({ riders: true, queue: true, active: true, routes: true });
  const [panelOpen, setPanelOpen] = useState(true);
  const [legendOpen, setLegendOpen] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [assigning, setAssigning] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [notice, setNotice] = useState(null);
  const [showAddManual, setShowAddManual] = useState(false);
  const [addingManual, setAddingManual] = useState(false);

  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  const mapRef = useRef(null);
  const fittedRef = useRef(false);
  const shellRef = useRef(null);
  const searchRef = useRef(null);
  const [shellHeight, setShellHeight] = useState(null);

  /* ── Size the card to the rest of the viewport ─────────────────────────
     Measuring our own offset means we don't depend on every ancestor
     having a height set, which is the usual reason a map collapses. */
  useEffect(() => {
    if (fullscreen) return undefined;
    const measure = () => {
      const el = shellRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      const vh = window.visualViewport?.height || window.innerHeight;
      setShellHeight(Math.max(MIN_SHELL, Math.round(vh - top - BOTTOM_GUTTER)));
    };
    measure();
    const raf = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('resize', measure);
    const ro = new ResizeObserver(measure);
    if (shellRef.current?.parentElement) ro.observe(shellRef.current.parentElement);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('resize', measure);
      ro.disconnect();
    };
  }, [fullscreen]);

  /* ── Load ── */
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const res = await authFetch('/admin/dispatch/map');
      const json = await res.json();
      if (json.success) { setData(json.data); setLastSync(new Date()); setFeedError(false); }
    } catch {
      setFeedError(true);
    }
    setLoading(false); setRefreshing(false);
  }, [authFetch]);

  useEffect(() => {
    load();
    const timer = setInterval(() => load(true), POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  /* ── Saved locations, for the off-book job address pickers ── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingLocations(true);
      try {
        const res = await authFetch('/locations');
        const json = await res.json();
        if (!cancelled && json.success) setLocations(json.data.locations ?? json.data);
      } catch {
        // silently falls back to typed addresses only
      }
      if (!cancelled) setLoadingLocations(false);
    })();
    return () => { cancelled = true; };
  }, [authFetch]);

  /* ── Live patches between polls ── */
  useEffect(() => {
    const subs = [
      on('admin:rider_location', (d) => setData((prev) => prev && ({
        ...prev,
        riders: prev.riders.map((r) => r.id === d.riderId
          ? { ...r, latitude: d.latitude, longitude: d.longitude } : r),
      }))),
      on('admin:rider_availability', (d) => setData((prev) => prev && ({
        ...prev,
        riders: prev.riders.map((r) => r.id === d.riderId ? { ...r, availability: d.availability } : r),
      }))),
      // Anything structural — new job, assignment, status change — is a full refetch.
      on('admin:new_delivery', () => load(true)),
      on('admin:order_ready_for_dispatch', () => load(true)),
      on('admin:delivery_assigned', () => load(true)),
      on('admin:delivery_status_changed', () => load(true)),
      on('admin:delivery_update', () => load(true)),
      on('admin:order_update', () => load(true)),
    ].filter(Boolean);
    return () => subs.forEach((u) => typeof u === 'function' && u());
  }, [on, load]);

  /* ── Derived ── */
  const jobs = data?.jobs || [];
  const riders = data?.riders || [];
  const stats = data?.stats || {};

  const mappableJobs = useMemo(() => jobs.filter((j) => coord(j.pickup) || coord(j.dropoff)), [jobs]);
  const queue = useMemo(() => jobs.filter((j) => j.unassigned), [jobs]);
  const inFlight = useMemo(() => jobs.filter((j) => !j.unassigned), [jobs]);
  const selectedJob = useMemo(() => jobs.find((j) => j.id === selectedJobId) || null, [jobs, selectedJobId]);

  const visibleJobs = useMemo(
    () => mappableJobs.filter((j) => (j.unassigned ? show.queue : show.active)),
    [mappableJobs, show],
  );

  const listed = useMemo(() => {
    const src = tab === 'queue' ? queue : tab === 'live' ? inFlight : [];
    const q = query.trim().toLowerCase();
    const filtered = !q ? src : src.filter((j) =>
      [j.label, j.customerName, j.customerPhone, j.pickup.address, j.dropoff.address]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(q)));
    return [...filtered].sort((a, b) => sortBy === 'value'
      ? Number(b.amount || 0) - Number(a.amount || 0)
      : b.ageMinutes - a.ageMinutes);
  }, [tab, queue, inFlight, query, sortBy]);

  const listedRiders = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rank = { ONLINE: 0, BUSY: 1, OFFLINE: 2 };
    const sorted = [...riders].sort((a, b) =>
      rank[a.availability] - rank[b.availability] || (a.name || '').localeCompare(b.name || ''));
    if (!q) return sorted;
    return sorted.filter((r) => `${r.name} ${r.phone}`.toLowerCase().includes(q));
  }, [riders, query]);

  const nearestRiders = useMemo(() => {
    if (!selectedJob) return [];
    const from = coord(selectedJob.pickup) || coord(selectedJob.dropoff);
    if (!from) return [];
    return riders
      .filter((r) => r.availability === 'ONLINE')
      .map((r) => {
        const km = haversineKm(riderPos(r), from);
        return { ...r, km, eta: etaMin(km) };
      })
      .sort((a, b) => (a.km ?? 1e9) - (b.km ?? 1e9))
      .slice(0, 4);
  }, [selectedJob, riders]);

  /* ── Map actions ── */
  const allPoints = useMemo(() => {
    const pts = [];
    if (show.riders) riders.forEach((r) => { const p = riderPos(r); if (p) pts.push(p); });
    visibleJobs.forEach((j) => {
      const p = coord(j.pickup); const d = coord(j.dropoff);
      if (p) pts.push(p); if (d) pts.push(d);
    });
    return pts;
  }, [riders, visibleJobs, show.riders]);

  const fitAll = useCallback(() => {
    const map = mapRef.current;
    if (!map || allPoints.length === 0) return;
    const padLeft = panelOpen && window.innerWidth > 900 ? 350 : 60;
    if (allPoints.length === 1) map.setView(allPoints[0], 14, { animate: true });
    else map.fitBounds(allPoints, { paddingTopLeft: [padLeft, 70], paddingBottomRight: [60, 70], maxZoom: 15 });
  }, [allPoints, panelOpen]);

  // Fit once, on first data — never yank the view out from under the operator afterwards.
  useEffect(() => {
    if (fittedRef.current || allPoints.length === 0 || !mapRef.current) return;
    fittedRef.current = true;
    setTimeout(fitAll, 120);
  }, [allPoints, fitAll]);

  const focusJob = useCallback((job) => {
    setSelectedJobId(job.id);
    setSelectedRiderId(null);
    const map = mapRef.current;
    if (!map) return;
    const pts = [coord(job.pickup), coord(job.dropoff)].filter(Boolean);
    const rider = riders.find((r) => r.id === job.riderId);
    const rp = riderPos(rider);
    if (rp) pts.push(rp);
    const padLeft = panelOpen && window.innerWidth > 900 ? 360 : 80;
    if (pts.length === 1) map.flyTo(pts[0], 15, { duration: 0.65 });
    else if (pts.length > 1) {
      map.flyToBounds(pts, {
        paddingTopLeft: [padLeft, 90], paddingBottomRight: [360, 90],
        maxZoom: 15, duration: 0.65,
      });
    }
  }, [riders, panelOpen]);

  const focusRider = useCallback((rider) => {
    const p = riderPos(rider);
    if (!p) return;
    setSelectedRiderId(rider.id);
    mapRef.current?.flyTo(p, 16, { duration: 0.6 });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedJobId(null);
    setSelectedRiderId(null);
  }, []);

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const onKey = (e) => {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);
      if (e.key === 'Escape') {
        if (fullscreen) setFullscreen(false);
        else clearSelection();
        return;
      }
      if (typing) return;
      if (e.key === '/') { e.preventDefault(); setPanelOpen(true); setTimeout(() => searchRef.current?.focus(), 30); }
      if (e.key === 'f') fitAll();
      if (e.key === 'r') load(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen, clearSelection, fitAll, load]);

  useEffect(() => {
    const t = setTimeout(() => mapRef.current?.invalidateSize({ animate: false }), 260);
    return () => clearTimeout(t);
  }, [panelOpen, fullscreen, shellHeight]);

  /* ── Assign ── */
  const assign = useCallback(async (job, rider) => {
    setAssigning(rider.id);
    setNotice(null);
    const url = assignUrl
      ? assignUrl(job)
      : job.kind === 'order'
        ? `/admin/orders/${job.id}/assign`
        : job.kind === 'manual'
          ? `/admin/manual-jobs/${job.id}/assign-rider`
          : `/admin/deliveries/${job.id}/assign`;
    try {
      const res = await authFetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riderId: rider.id }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success !== false) {
        setNotice({ tone: 'ok', text: `${rider.name} is on ${job.label}.` });
        clearSelection();
        await load(true);
      } else {
        setNotice({ tone: 'error', text: json.message || 'That rider could not take the job. Pick another.' });
      }
    } catch {
      setNotice({ tone: 'error', text: 'Assignment failed — check the connection and try again.' });
    }
    setAssigning(null);
  }, [authFetch, assignUrl, load, clearSelection]);

  /* ── Status updates — works for orders, deliveries and off-book jobs ── */
  const updateJobStatus = useCallback(async (job, newStatus) => {
    setUpdatingStatus(newStatus);
    setNotice(null);
    const url = statusUrl
      ? statusUrl(job, newStatus)
      : job.kind === 'order'
        ? `/admin/orders/${job.id}/status`
        : job.kind === 'manual'
          ? `/admin/manual-jobs/${job.id}/status`
          : `/admin/deliveries/${job.id}/status`;
    try {
      const res = await authFetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success !== false) {
        setNotice({ tone: 'ok', text: `${job.label} marked "${statusOf(newStatus).label}".` });
        await load(true);
      } else {
        setNotice({ tone: 'error', text: json.message || 'Could not update that status. Try again.' });
      }
    } catch {
      setNotice({ tone: 'error', text: 'Status update failed — check the connection and try again.' });
    }
    setUpdatingStatus(null);
  }, [authFetch, statusUrl, load]);

  /* ── Off-book job creation ── */
  const submitManualJob = useCallback(async (payload) => {
    setAddingManual(true);
    setNotice(null);
    try {
      const res = await authFetch('/admin/manual-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success !== false) {
        setShowAddManual(false);
        setNotice({ tone: 'ok', text: "Off-book job added — it's now in the waiting list." });
        setTab('queue');
        await load(true);
      } else {
        setNotice({ tone: 'error', text: json.message || 'Could not add that job. Check the addresses and try again.' });
      }
    } catch {
      setNotice({ tone: 'error', text: 'Could not reach the server — check the connection and try again.' });
    }
    setAddingManual(false);
  }, [authFetch, load]);

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(t);
  }, [notice]);

  const dim = (id) => !!selectedJobId && selectedJobId !== id;

  const shellStyle = fullscreen
    ? { position: 'fixed', inset: 0, zIndex: 3000, borderRadius: 0, border: 'none' }
    : { height: shellHeight ? `${shellHeight}px` : `calc(100dvh - 220px)`, minHeight: MIN_SHELL };

  /* ── Loading skeleton ── */
  if (loading && !data) {
    return (
      <div ref={shellRef} className="fc-shell" style={shellStyle}>
        <div className="fc-head">
          <div style={{ flex: 1 }}>
            <Skeleton h={15} w={120} />
            <Skeleton h={11} w={180} mt={8} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} h={40} w={62} r={10} />)}
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f8f9', gap: 10 }}>
          <Loader2 size={20} className="fc-spin" style={{ color: theme?.green || '#10b981' }} />
          <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>Loading the dispatch feed…</span>
        </div>
        <FcStyles />
      </div>
    );
  }

  return (
    <div ref={shellRef} className="fc-shell" style={shellStyle}>
      {/* ═══ Header ═══ */}
      <div className="fc-head">
        <div className="fc-head-title">
          <div style={{ fontWeight: 900, fontSize: 15, color: '#0f1117', letterSpacing: '-0.2px' }}>
            Dispatch map
          </div>
          <div className="fc-head-sub">
            {feedError
              ? <><span className="fc-dot" style={{ background: '#dc2626' }} /><span style={{ color: '#dc2626' }}>Feed unreachable — retrying</span></>
              : refreshing
                ? <><RefreshCw size={10} className="fc-spin" /> Syncing…</>
                : <><span className="fc-dot fc-dot-live" />{lastSync
                  ? `Updated ${lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                  : 'Connecting'}</>}
            {stats.unmapped > 0 && (
              <span className="fc-warn-chip">
                <AlertCircle size={10} /> {stats.unmapped} missing coordinates
              </span>
            )}
          </div>
        </div>

        <div className="fc-stats">
          <Stat value={stats.unassigned ?? 0} label="waiting" color="#7c3aed" />
          <Stat value={stats.stale ?? 0} label={`over ${STALE_MIN}m`} color="#dc2626" alert={!!stats.stale} />
          <Stat value={stats.inFlight ?? 0} label="in transit" color="#f59e0b" />
          <Stat value={stats.online ?? 0} label="free" color="#10b981" />
          <Stat value={stats.busy ?? 0} label="busy" color="#f59e0b" />
        </div>

        <div className="fc-controls">
          <button className="fc-btn-dark" onClick={() => setShowAddManual(true)}>
            <PlusCircle size={12} /> Off-book job
          </button>
          <span className="fc-vr" />
          <Toggle active={show.queue} color="#7c3aed" title="Show waiting jobs"
            onClick={() => setShow((s) => ({ ...s, queue: !s.queue }))}>
            <Zap size={12} /> Waiting
          </Toggle>
          <Toggle active={show.active} color="#f59e0b" title="Show jobs in transit"
            onClick={() => setShow((s) => ({ ...s, active: !s.active }))}>
            <Flag size={12} /> Transit
          </Toggle>
          <Toggle active={show.riders} color="#10b981" title="Show riders"
            onClick={() => setShow((s) => ({ ...s, riders: !s.riders }))}>
            <Bike size={12} /> Riders
          </Toggle>
          <Toggle active={show.routes} color="#2563eb" title="Show route lines"
            onClick={() => setShow((s) => ({ ...s, routes: !s.routes }))}>
            <Navigation size={12} /> Routes
          </Toggle>
          <span className="fc-vr" />
          <button className="fc-icon-btn" title="Fit everything (f)" onClick={fitAll}><Maximize2 size={14} /></button>
          <button className="fc-icon-btn" title={fullscreen ? 'Exit fullscreen (esc)' : 'Fullscreen'}
            onClick={() => setFullscreen((v) => !v)}>
            {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* ═══ Map + overlays ═══ */}
      <div className="fc-map-area">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={13}
          style={{ height: '100%', width: '100%', background: '#eef1f3' }}
          scrollWheelZoom
          zoomControl={false}
          preferCanvas
        >
          <MapBridge onReady={(m) => { mapRef.current = m; }} />
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
            className="fc-tiles"
            maxZoom={19}
            keepBuffer={4}
            updateWhenIdle={false}
          />

          {/* Trip legs: pickup → dropoff, plus rider → next stop */}
          {show.routes && visibleJobs.map((j) => {
            const p = coord(j.pickup); const d = coord(j.dropoff);
            const meta = statusOf(j.status);
            const faded = dim(j.id);
            const isSel = selectedJobId === j.id;
            const rider = riders.find((r) => r.id === j.riderId);
            const rp = riderPos(rider);
            const target = j.legFromRider === 'dropoff' ? d : p;
            return (
              <Fragment key={`route-${j.kind}-${j.id}`}>
                {p && d && (
                  <>
                    {isSel && (
                      <Polyline
                        positions={[p, d]}
                        pathOptions={{ color: meta.color, weight: 11, opacity: 0.16, lineCap: 'round' }}
                      />
                    )}
                    <Polyline
                      positions={[p, d]}
                      pathOptions={{
                        color: meta.color,
                        weight: isSel ? 4.5 : 3,
                        opacity: faded ? 0.1 : 0.78,
                        dashArray: j.unassigned ? '1 9' : null,
                        lineCap: 'round',
                        lineJoin: 'round',
                      }}
                      eventHandlers={{ click: () => focusJob(j) }}
                    />
                  </>
                )}
                {rp && target && (
                  <Polyline
                    positions={[rp, target]}
                    pathOptions={{ color: '#111827', weight: 2, opacity: faded ? 0.07 : 0.32, dashArray: '4 8' }}
                  />
                )}
              </Fragment>
            );
          })}

          {/* Pickups */}
          {visibleJobs.map((j) => {
            const p = coord(j.pickup);
            if (!p) return null;
            const meta = statusOf(j.status);
            return (
              <Marker
                key={`pick-${j.kind}-${j.id}`}
                position={p}
                zIndexOffset={j.unassigned ? 400 : 200}
                icon={pickupIcon(meta.color, {
                  dimmed: dim(j.id),
                  selected: selectedJobId === j.id,
                  pulse: j.unassigned && j.ageMinutes >= STALE_MIN,
                  index: j.unassigned ? queue.findIndex((q) => q.id === j.id) + 1 : null,
                })}
                eventHandlers={{ click: () => focusJob(j) }}
              >
                <Tooltip direction="top" offset={[0, -16]} className="fc-tip">
                  <strong>{j.pickup.label}</strong> · pick up{' '}
                  {j.kind === 'order' ? 'order' : j.kind === 'manual' ? 'off-book job' : String(j.subtype || '').toLowerCase()}
                </Tooltip>
              </Marker>
            );
          })}

          {/* Dropoffs */}
          {visibleJobs.map((j) => {
            const d = coord(j.dropoff);
            if (!d) return null;
            const meta = statusOf(j.status);
            return (
              <Marker
                key={`drop-${j.kind}-${j.id}`}
                position={d}
                icon={dropoffIcon(meta.color, { dimmed: dim(j.id), selected: selectedJobId === j.id })}
                eventHandlers={{ click: () => focusJob(j) }}
              >
                <Tooltip direction="top" offset={[0, -12]} className="fc-tip">
                  Drop at <strong>{j.dropoff.label}</strong>
                </Tooltip>
              </Marker>
            );
          })}

          {/* Riders */}
          {show.riders && riders.map((r) => {
            const p = riderPos(r);
            if (!p) return null;
            return (
              <Marker
                key={`rider-${r.id}`}
                position={p}
                zIndexOffset={600}
                icon={riderIcon(RIDER_COLORS[r.availability] || '#9ca3af', {
                  dimmed: !!selectedJobId && !nearestRiders.some((n) => n.id === r.id) && selectedJob?.riderId !== r.id,
                  selected: selectedRiderId === r.id,
                })}
                eventHandlers={{ click: () => setSelectedRiderId(r.id) }}
              >
                <Popup className="fc-popup">
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#0f1117' }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>{r.phone}</div>
                  <div style={{ fontSize: 11.5, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      color: RIDER_COLORS[r.availability], fontWeight: 800, fontSize: 10,
                      background: `${RIDER_COLORS[r.availability]}18`, padding: '2px 7px', borderRadius: 999,
                    }}>{r.availability}</span>
                    <span style={{ color: '#6b7280' }}>⭐ {r.rating?.toFixed(1) || '0.0'} · {r.totalDeliveries || 0} trips</span>
                  </div>
                  {r.activeJobs?.length > 0 && (
                    <div style={{ fontSize: 11.5, marginTop: 6, color: '#374151' }}>
                      Carrying {r.activeJobs.length} job{r.activeJobs.length > 1 ? 's' : ''}
                    </div>
                  )}
                  {selectedJob && r.availability === 'ONLINE' && (
                    <button className="fc-btn-primary" style={{ marginTop: 9, width: '100%' }}
                      onClick={() => assign(selectedJob, r)} disabled={assigning === r.id}>
                      {assigning === r.id ? 'Assigning…' : `Give them ${selectedJob.label}`}
                    </button>
                  )}
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* ── Panel toggle (collapsed state) ── */}
        {!panelOpen && (
          <button className="fc-panel-open" onClick={() => setPanelOpen(true)} title="Show job list">
            <PanelLeft size={15} />
            {queue.length > 0 && <span className="fc-badge">{queue.length}</span>}
          </button>
        )}

        {/* ── Left panel ── */}
        <div className={`fc-panel${panelOpen ? '' : ' fc-panel-hidden'}`}>
          <div className="fc-tabs">
            {[['queue', 'Waiting', queue.length], ['live', 'Transit', inFlight.length], ['riders', 'Riders', riders.length]]
              .map(([key, label, count]) => (
                <button key={key} onClick={() => setTab(key)}
                  className={`fc-tab${tab === key ? ' fc-tab-on' : ''}`}>
                  {label}
                  <span className="fc-tab-count" style={{
                    background: tab === key ? 'rgba(255,255,255,.18)' : '#f1f2f4',
                    color: tab === key ? '#fff' : '#9ca3af',
                  }}>{count}</span>
                </button>
              ))}
            <button className="fc-icon-btn fc-panel-close" onClick={() => setPanelOpen(false)} title="Hide panel">
              <PanelLeftClose size={14} />
            </button>
          </div>

          <div className="fc-search">
            <Search size={13} color="#9ca3af" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, phone or street  ( / )"
            />
            {query && <button className="fc-icon-btn" onClick={() => setQuery('')}><X size={12} /></button>}
            {tab !== 'riders' && (
              <button className="fc-icon-btn" title={sortBy === 'age' ? 'Sorted by wait time' : 'Sorted by value'}
                onClick={() => setSortBy((s) => (s === 'age' ? 'value' : 'age'))}>
                <ArrowUpDown size={12} />
              </button>
            )}
          </div>

          <div className="fc-scroll">
            {tab !== 'riders' && listed.length === 0 && (
              <div className="fc-empty">
                {query
                  ? 'Nothing matches that search.'
                  : tab === 'queue'
                    ? 'Nothing waiting. Every job has a rider.'
                    : 'No jobs are on the road right now.'}
              </div>
            )}

            {tab !== 'riders' && listed.map((j) => {
              const meta = statusOf(j.status);
              const urgency = urgencyOf(j.ageMinutes);
              const active = selectedJobId === j.id;
              const km = haversineKm(coord(j.pickup), coord(j.dropoff));
              const unmapped = !coord(j.pickup) || !coord(j.dropoff);
              return (
                <button key={`${j.kind}-${j.id}`} onClick={() => focusJob(j)}
                  className={`fc-row${active ? ' fc-row-on' : ''}`}
                  style={{ '--fc-c': meta.color }}>
                  <div className="fc-row-top">
                    <span className="fc-row-title">
                      {j.label}
                      {j.kind === 'manual' && <span className="fc-tag">OFF-BOOK</span>}
                      {unmapped && <span className="fc-tag fc-tag-warn">NO PIN</span>}
                    </span>
                    <span className="fc-row-age" style={{ color: j.unassigned ? URGENCY_COLOR[urgency] : '#c0c4cb' }}>
                      <Clock size={10} />{fmtAge(j.ageMinutes)}
                    </span>
                  </div>
                  <div className="fc-row-route">
                    <span className="fc-route-dot" style={{ background: meta.color }} />
                    <span className="fc-route-text">{j.pickup.address || j.pickup.label}</span>
                  </div>
                  <div className="fc-row-route">
                    <span className="fc-route-dot fc-route-dot-end" style={{ borderColor: meta.color }} />
                    <span className="fc-route-text">{j.dropoff.address || j.dropoff.label}</span>
                  </div>
                  <div className="fc-row-meta">
                    <span style={{ color: meta.color, fontWeight: 800 }}>{meta.label}</span>
                    <span>{ghs(j.amount)}</span>
                    <span>{j.paymentMethod}</span>
                    {km != null && <span>{km.toFixed(1)} km</span>}
                  </div>
                </button>
              );
            })}

            {tab === 'riders' && listedRiders.length === 0 && (
              <div className="fc-empty">No riders match that.</div>
            )}

            {tab === 'riders' && listedRiders.map((r) => (
              <button key={r.id} onClick={() => focusRider(r)}
                className={`fc-rrow${selectedRiderId === r.id ? ' fc-rrow-on' : ''}`}>
                <span className="fc-avail" style={{ background: RIDER_COLORS[r.availability] }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="fc-rrow-name">{r.name}</span>
                  <span className="fc-rrow-sub">
                    {r.phone} · ⭐ {r.rating?.toFixed(1) || '0.0'}
                    {r.activeJobs?.length ? ` · ${r.activeJobs.length} on board` : ''}
                  </span>
                </span>
                <Crosshair size={13} color="#d8dbe0" />
              </button>
            ))}
          </div>
        </div>

        {/* ── Right panel: selected job ── */}
        {selectedJob && (
          <div className="fc-detail">
            <div className="fc-detail-head">
              <div style={{ minWidth: 0 }}>
                <div className="fc-detail-title">
                  {selectedJob.label}
                  {selectedJob.kind === 'manual' && <span className="fc-tag">OFF-BOOK</span>}
                </div>
                <div style={{ fontSize: 11, color: statusOf(selectedJob.status).color, fontWeight: 800, marginTop: 3 }}>
                  {statusOf(selectedJob.status).label} · {fmtAge(selectedJob.ageMinutes)} old
                </div>
              </div>
              <button className="fc-icon-btn" onClick={clearSelection}><X size={15} /></button>
            </div>

            <div className="fc-detail-body">
              <div className="fc-leg">
                <Store size={14} color="#7c3aed" />
                <div>
                  <strong>{selectedJob.pickup.label}</strong>
                  <div>{selectedJob.pickup.address || '—'}</div>
                </div>
              </div>
              <div className="fc-leg">
                <Flag size={14} color="#10b981" />
                <div>
                  <strong>{selectedJob.dropoff.label}</strong>
                  <div>{selectedJob.dropoff.address || '—'}</div>
                </div>
              </div>
              {selectedJob.note && <div className="fc-note">{selectedJob.note}</div>}
              
              <div className="fc-detail-meta">
               
                {selectedJob.pickup.phone && (
                <>
                    <span><strong>Vendor</strong></span>
                  <a href={`tel:${selectedJob.pickup.phone}`} className="fc-tel">
                    <Phone size={11} /> {selectedJob.pickup.phone}
                  </a>
                </>
                )}
              </div>
              <div className="fc-detail-meta">
                <span><strong>{ghs(selectedJob.amount)}</strong> {selectedJob.paymentMethod}</span>
                {selectedJob.customerPhone && (
                  <a href={`tel:${selectedJob.customerPhone}`} className="fc-tel">
                    <Phone size={11} /> {selectedJob.customerPhone}
                  </a>
                )}
              </div>
            </div>

            {/* ── Status update — same control for orders, deliveries and off-book jobs ── */}
            <div className="fc-detail-foot">
              <div className="fc-detail-foot-title">Update status</div>
              {nextStatusesFor(selectedJob).length === 0 ? (
                <div style={{ fontSize: 11.5, color: '#9ca3af', lineHeight: 1.6 }}>
                  {selectedJob.status === 'DELIVERED' || selectedJob.status === 'CANCELLED'
                    ? 'This job is closed.'
                    : 'No further status change available.'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {nextStatusesFor(selectedJob).map((s) => {
                    const needsRider = RIDER_REQUIRED_STATUSES.includes(s) && !selectedJob.riderId;
                    const meta = statusOf(s);
                    return (
                      <button
                        key={s}
                        className="fc-status-btn"
                        style={{ '--fc-c': meta.color }}
                        disabled={needsRider || updatingStatus === s}
                        title={needsRider ? 'Assign a rider first' : undefined}
                        onClick={() => updateJobStatus(selectedJob, s)}
                      >
                        {updatingStatus === s
                          ? <Loader2 size={11} className="fc-spin" />
                          : s === 'CANCELLED' ? <X size={11} /> : <CheckCircle2 size={11} />}
                        {s === 'CANCELLED' ? 'Cancel' : `Mark ${meta.label}`}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="fc-detail-foot">
              <div className="fc-detail-foot-title">
                {selectedJob.unassigned ? 'Closest free riders' : 'Reassign to'}
              </div>
              {nearestRiders.length === 0 && (
                <div style={{ fontSize: 11.5, color: '#9ca3af', lineHeight: 1.6 }}>
                  No rider is online with a known position. Call someone in, then refresh.
                </div>
              )}
              {nearestRiders.map((r) => (
                <div key={r.id} className="fc-near">
                  <button onClick={() => focusRider(r)} className="fc-near-info">
                    <span className="fc-near-name">{r.name}</span>
                    <span className="fc-near-sub">
                      {r.km != null ? `${r.km.toFixed(1)} km · about ${r.eta} min away` : 'distance unknown'}
                    </span>
                  </button>
                  <button className="fc-assign" onClick={() => assign(selectedJob, r)} disabled={assigning === r.id}>
                    {assigning === r.id ? <Loader2 size={12} className="fc-spin" /> : 'Assign'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Legend ── */}
        <div className="fc-legend">
          <button className="fc-legend-head" onClick={() => setLegendOpen((v) => !v)}>
            <Info size={11} /> Legend
          </button>
          {legendOpen && (
            <div className="fc-legend-body">
              <span><i className="fc-lg-pin" /> Pickup (numbered = waiting)</span>
              <span><i className="fc-lg-drop" /> Drop-off</span>
              <span><i className="fc-lg-dotted" /> No rider yet</span>
              <span><i className="fc-lg-dashed" /> Rider to next stop</span>
            </div>
          )}
        </div>

        {/* ── Notice ── */}
        {notice && (
          <div className={`fc-notice ${notice.tone === 'ok' ? 'fc-notice-ok' : 'fc-notice-err'}`}
            onClick={() => setNotice(null)}>
            {notice.tone === 'ok' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
            {notice.text}
          </div>
        )}
      </div>

      {showAddManual && (
        <AddManualJobModal
          onClose={() => setShowAddManual(false)}
          onSubmit={submitManualJob}
          submitting={addingManual}
          locations={locations}
          loadingLocations={loadingLocations}
        />
      )}

      <FcStyles />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Styles
═══════════════════════════════════════════════════════════════════════ */
function FcStyles() {
  return (
    <style>{`
/* ── Shell ── */
.fc-shell {
  background:#fff; border-radius:16px; border:1px solid #eef0f2;
  display:flex; flex-direction:column; overflow:hidden;
  box-shadow:0 1px 3px rgba(15,17,23,.04), 0 12px 32px rgba(15,17,23,.05);
  font-family:inherit;
}
.fc-map-area { position:relative; flex:1; min-height:0; }

/* ── Header ── */
.fc-head {
  display:flex; align-items:center; justify-content:space-between; gap:18px;
  padding:13px 18px; border-bottom:1px solid #f1f2f4; flex-wrap:wrap; flex-shrink:0;
  background:linear-gradient(180deg,#fff,#fdfdfe);
}
.fc-head-title { min-width:150px; }
.fc-head-sub {
  font-size:11.5px; color:#9ca3af; margin-top:3px;
  display:flex; align-items:center; gap:6px; flex-wrap:wrap;
}
.fc-dot { width:6px; height:6px; border-radius:50%; display:inline-block; background:#10b981; }
.fc-dot-live { box-shadow:0 0 0 0 rgba(16,185,129,.55); animation:fcping 2s ease-out infinite; }
@keyframes fcping { 70%,100% { box-shadow:0 0 0 6px rgba(16,185,129,0) } }
.fc-warn-chip {
  display:inline-flex; align-items:center; gap:4px; color:#dc2626; font-weight:700;
  background:#fef2f2; padding:2px 7px; border-radius:999px; font-size:10.5px;
}

.fc-stats { display:flex; gap:7px; }
.fc-stat {
  display:flex; flex-direction:column; gap:3px; align-items:flex-start;
  padding:7px 11px; border-radius:11px; border:1px solid #f0f0f0; min-width:60px;
  transition:background .2s, border-color .2s;
}

.fc-controls { display:flex; gap:6px; flex-wrap:wrap; align-items:center; }
.fc-vr { width:1px; height:18px; background:#eceef0; margin:0 2px; }
.fc-toggle {
  display:flex; align-items:center; gap:5px; padding:6px 11px; border-radius:999px;
  border:1px solid #e8e8e8; font-size:11.5px; font-weight:700; cursor:pointer;
  font-family:inherit; transition:all .16s ease; white-space:nowrap;
}
.fc-toggle:hover { transform:translateY(-1px); box-shadow:0 2px 8px rgba(15,17,23,.07); }
.fc-toggle:active { transform:translateY(0); }
.fc-btn-dark {
  display:flex; align-items:center; gap:6px; padding:6px 13px; border-radius:999px;
  border:none; background:#0f1117; color:#fff; font-size:11.5px; font-weight:700;
  cursor:pointer; font-family:inherit; transition:all .16s ease;
}
.fc-btn-dark:hover { background:#242833; transform:translateY(-1px); box-shadow:0 4px 12px rgba(15,17,23,.22); }
.fc-icon-btn {
  display:flex; align-items:center; justify-content:center; width:28px; height:28px;
  border-radius:8px; border:none; background:transparent; color:#9ca3af; cursor:pointer;
  transition:background .15s, color .15s; flex-shrink:0;
}
.fc-icon-btn:hover { background:#f3f4f6; color:#4b5563; }

/* ── Panel ── */
.fc-panel {
  position:absolute; top:14px; left:14px; bottom:14px; width:330px; z-index:1000;
  background:rgba(255,255,255,.97); backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px);
  border-radius:15px; border:1px solid rgba(0,0,0,.05);
  box-shadow:0 8px 28px rgba(15,17,23,.13); display:flex; flex-direction:column; overflow:hidden;
  transition:transform .26s cubic-bezier(.4,0,.2,1), opacity .2s;
}
.fc-panel-hidden { transform:translateX(calc(-100% - 20px)); opacity:0; pointer-events:none; }
.fc-panel-open {
  position:absolute; top:14px; left:14px; z-index:1000; width:38px; height:38px;
  display:flex; align-items:center; justify-content:center; border-radius:11px;
  background:rgba(255,255,255,.97); border:1px solid rgba(0,0,0,.05); cursor:pointer;
  box-shadow:0 4px 14px rgba(15,17,23,.14); color:#4b5563;
}
.fc-panel-open:hover { background:#fff; }
.fc-badge {
  position:absolute; top:-5px; right:-5px; min-width:17px; height:17px; padding:0 4px;
  border-radius:999px; background:#7c3aed; color:#fff; font-size:9.5px; font-weight:900;
  display:flex; align-items:center; justify-content:center; border:2px solid #fff;
}

.fc-tabs { display:flex; padding:6px; gap:3px; border-bottom:1px solid #f4f5f6; align-items:center; }
.fc-tab {
  flex:1; display:flex; align-items:center; justify-content:center; gap:5px;
  padding:7px 4px; border-radius:9px; border:none; cursor:pointer; background:transparent;
  color:#6b7280; font-size:11.5px; font-weight:700; font-family:inherit; transition:all .15s;
}
.fc-tab:hover { background:#f6f7f8; }
.fc-tab-on { background:#0f1117; color:#fff; }
.fc-tab-on:hover { background:#0f1117; }
.fc-tab-count { font-size:9.5px; font-weight:800; padding:1px 5px; border-radius:999px; }
.fc-panel-close { width:26px; height:26px; }

.fc-search {
  padding:7px 9px; border-bottom:1px solid #f6f7f8; display:flex; align-items:center; gap:7px;
}
.fc-search input {
  border:none; outline:none; font-size:12.5px; width:100%; background:transparent;
  font-family:inherit; color:#0f1117;
}
.fc-search input::placeholder { color:#c3c7cd; }

.fc-scroll { overflow-y:auto; flex:1; overscroll-behavior:contain; }
.fc-scroll::-webkit-scrollbar { width:6px }
.fc-scroll::-webkit-scrollbar-thumb { background:#e3e5e8; border-radius:3px }
.fc-scroll::-webkit-scrollbar-thumb:hover { background:#cfd2d6 }

.fc-empty { padding:32px 22px; text-align:center; font-size:12.5px; color:#9ca3af; line-height:1.65; }

/* ── Job rows ── */
.fc-row {
  display:block; width:100%; text-align:left; cursor:pointer; font-family:inherit;
  padding:11px 13px 11px 12px; border:none; border-bottom:1px solid #f6f7f8;
  border-left:3px solid transparent; background:#fff; transition:background .15s, border-color .15s;
}
.fc-row:hover { background:#fafbfc; }
.fc-row-on { background:color-mix(in srgb, var(--fc-c) 6%, #fff); border-left-color:var(--fc-c); }
.fc-row-top { display:flex; justify-content:space-between; gap:8px; align-items:flex-start; }
.fc-row-title {
  font-size:12.5px; font-weight:800; color:#0f1117; display:flex; align-items:center;
  gap:5px; min-width:0; flex-wrap:wrap;
}
.fc-row-age {
  font-size:11px; font-weight:800; display:flex; align-items:center; gap:3px; flex-shrink:0;
}
.fc-tag {
  font-size:8.5px; font-weight:900; color:#7c3aed; background:#f1ecfe;
  padding:2px 6px; border-radius:999px; letter-spacing:.3px;
}
.fc-tag-warn { color:#dc2626; background:#fef2f2; }

.fc-row-route { display:flex; align-items:center; gap:7px; margin-top:5px; }
.fc-route-dot { width:7px; height:7px; border-radius:2px; flex-shrink:0; }
.fc-route-dot-end { border-radius:50%; background:#fff; border:2px solid; width:8px; height:8px; }
.fc-route-text {
  font-size:11.5px; color:#6b7280; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
}
.fc-row-meta {
  display:flex; gap:9px; margin-top:8px; font-size:10.5px; color:#a8adb5;
  align-items:center; flex-wrap:wrap;
}

/* ── Rider rows ── */
.fc-rrow {
  display:flex; align-items:center; gap:10px; width:100%; text-align:left; font-family:inherit;
  padding:10px 13px; border:none; border-bottom:1px solid #f6f7f8; cursor:pointer;
  background:#fff; transition:background .15s;
}
.fc-rrow:hover { background:#fafbfc; }
.fc-rrow-on { background:#f6f8fa; }
.fc-avail { width:9px; height:9px; border-radius:50%; flex-shrink:0; }
.fc-rrow-name { display:block; font-size:12.5px; font-weight:800; color:#0f1117; }
.fc-rrow-sub { display:block; font-size:11px; color:#a8adb5; margin-top:2px; }

/* ── Detail panel ── */
.fc-detail {
  position:absolute; top:14px; right:14px; width:326px; max-height:calc(100% - 28px);
  overflow-y:auto; z-index:1000; background:rgba(255,255,255,.97);
  backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px);
  border-radius:15px; border:1px solid rgba(0,0,0,.05);
  box-shadow:0 8px 28px rgba(15,17,23,.15); animation:fcslide .22s cubic-bezier(.4,0,.2,1);
}
@keyframes fcslide { from { opacity:0; transform:translateX(14px) } to { opacity:1; transform:none } }
.fc-detail::-webkit-scrollbar { width:6px }
.fc-detail::-webkit-scrollbar-thumb { background:#e3e5e8; border-radius:3px }
.fc-detail-head {
  padding:12px 12px 12px 15px; border-bottom:1px solid #f4f5f6;
  display:flex; justify-content:space-between; gap:10px; align-items:flex-start;
}
.fc-detail-title {
  font-size:13px; font-weight:900; color:#0f1117; display:flex; align-items:center; gap:6px; flex-wrap:wrap;
}
.fc-detail-body { padding:13px 15px; display:flex; flex-direction:column; gap:11px; }
.fc-leg { display:flex; gap:10px; font-size:12px; color:#6b7280; line-height:1.5; }
.fc-leg svg { margin-top:2px; flex-shrink:0; }
.fc-leg strong { color:#0f1117; font-size:12px; }
.fc-note {
  font-size:11.5px; color:#6b7280; background:#f8f9fa; border-radius:9px;
  padding:9px 11px; line-height:1.55; border:1px solid #f1f2f4;
}
.fc-detail-meta {
  display:flex; gap:14px; font-size:11.5px; color:#6b7280; flex-wrap:wrap; align-items:center;
}
.fc-detail-meta strong { color:#0f1117; }
.fc-tel {
  color:#2563eb; text-decoration:none; display:flex; align-items:center; gap:4px; font-weight:700;
}
.fc-tel:hover { text-decoration:underline; }
.fc-detail-foot { border-top:1px solid #f4f5f6; padding:11px 15px 15px; }
.fc-detail-foot-title { font-size:11.5px; font-weight:800; color:#0f1117; margin-bottom:9px; }
.fc-status-btn {
  display:flex; align-items:center; gap:5px; padding:6px 12px; border-radius:999px;
  border:1.5px solid var(--fc-c); background:color-mix(in srgb, var(--fc-c) 10%, #fff);
  color:var(--fc-c); font-size:11px; font-weight:800; cursor:pointer; font-family:inherit;
  transition:all .15s ease;
}
.fc-status-btn:hover:not(:disabled) { background:var(--fc-c); color:#fff; }
.fc-status-btn:disabled { opacity:.4; cursor:not-allowed; }
.fc-near {
  display:flex; align-items:center; gap:9px; padding:7px 0; border-bottom:1px solid #fafafa;
}
.fc-near:last-child { border-bottom:none; }
.fc-near-info {
  border:none; background:transparent; padding:0; text-align:left; flex:1; min-width:0;
  cursor:pointer; font-family:inherit;
}
.fc-near-name { display:block; font-size:12px; font-weight:800; color:#0f1117; }
.fc-near-sub { display:block; font-size:11px; color:#a8adb5; margin-top:2px; }
.fc-assign {
  padding:6px 13px; border-radius:8px; border:none; cursor:pointer; background:#0f1117;
  color:#fff; font-size:11.5px; font-weight:700; flex-shrink:0; font-family:inherit;
  display:flex; align-items:center; justify-content:center; min-width:60px; transition:background .15s;
}
.fc-assign:hover:not(:disabled) { background:#242833; }
.fc-assign:disabled { background:#b9bdc4; cursor:not-allowed; }

/* ── Legend ── */
.fc-legend {
  position:absolute; bottom:14px; right:14px; z-index:900;
  background:rgba(255,255,255,.96); backdrop-filter:blur(10px);
  border-radius:12px; border:1px solid rgba(0,0,0,.05); overflow:hidden;
  box-shadow:0 4px 16px rgba(15,17,23,.1);
}
.fc-legend-head {
  display:flex; align-items:center; gap:6px; padding:7px 11px; border:none; background:transparent;
  font-size:10.5px; font-weight:800; color:#6b7280; cursor:pointer; width:100%; font-family:inherit;
}
.fc-legend-body {
  padding:2px 11px 9px; display:flex; flex-direction:column; gap:6px;
  font-size:10.5px; color:#6b7280;
}
.fc-legend-body span { display:flex; align-items:center; gap:7px; }
.fc-lg-pin { width:11px; height:11px; border-radius:3px; background:#7c3aed; }
.fc-lg-drop { width:11px; height:11px; border-radius:50%; background:#fff; border:3px solid #f59e0b; }
.fc-lg-dotted { width:20px; border-top:2px dotted #7c3aed; }
.fc-lg-dashed { width:20px; border-top:2px dashed #111827; }

/* ── Notice ── */
.fc-notice {
  position:absolute; bottom:18px; left:50%; transform:translateX(-50%); z-index:1100;
  display:flex; align-items:center; gap:7px; color:#fff; padding:10px 17px; border-radius:999px;
  font-size:12px; font-weight:600; cursor:pointer; box-shadow:0 8px 24px rgba(0,0,0,.26);
  animation:fcrise .25s cubic-bezier(.4,0,.2,1); max-width:min(440px, 80%);
}
.fc-notice-ok { background:#0f1117; }
.fc-notice-err { background:#dc2626; }
@keyframes fcrise { from { opacity:0; transform:translate(-50%,10px) } to { opacity:1; transform:translate(-50%,0) } }

/* ── Markers ── */
.fc-rider {
  background:var(--fc-c); border:3px solid #fff; border-radius:50% 50% 50% 4px;
  transform:rotate(-45deg); box-shadow:0 2px 9px rgba(0,0,0,.32);
  display:flex; align-items:center; justify-content:center;
}
.fc-rider-glyph { transform:rotate(45deg); line-height:1; }
.fc-rider-sel { box-shadow:0 0 0 4px color-mix(in srgb, var(--fc-c) 30%, transparent), 0 3px 12px rgba(0,0,0,.3); }
.fc-pin-wrap { position:relative; }
.fc-pin {
  border-radius:8px; background:var(--fc-c); border:2.5px solid #fff;
  box-shadow:0 2px 7px rgba(0,0,0,.28); display:flex; align-items:center; justify-content:center;
  color:#fff; font-weight:800; position:relative; transition:transform .15s;
}
.fc-pin-sel { box-shadow:0 0 0 4px color-mix(in srgb, var(--fc-c) 28%, transparent), 0 3px 10px rgba(0,0,0,.3); }
.fc-drop {
  border-radius:50%; background:#fff; border:4px solid var(--fc-c);
  box-shadow:0 2px 7px rgba(0,0,0,.26);
}
.fc-pulse { position:absolute; inset:0; border-radius:50%; animation:fcpulse 1.9s ease-out infinite; }
@keyframes fcpulse { 0% { transform:scale(.8); opacity:.5 } 100% { transform:scale(2.7); opacity:0 } }
.leaflet-marker-icon.fc-anim { transition:transform .9s linear; }
.leaflet-zoom-anim .leaflet-marker-icon.fc-anim { transition:none; }

/* ── Leaflet chrome ── */
.fc-tiles { filter:saturate(.42) brightness(1.05) contrast(.98); }
.leaflet-container { font-family:inherit; }
.leaflet-container a.leaflet-popup-close-button { color:#9ca3af; }
.fc-popup .leaflet-popup-content-wrapper { border-radius:12px; box-shadow:0 8px 24px rgba(15,17,23,.18); }
.fc-popup .leaflet-popup-content { margin:12px 14px; }
.fc-tip {
  background:#0f1117 !important; color:#fff !important; border:none !important;
  border-radius:7px !important; font-size:11px !important; padding:5px 9px !important;
  box-shadow:0 4px 12px rgba(0,0,0,.25) !important;
}
.fc-tip::before { border-top-color:#0f1117 !important; }
.leaflet-control-attribution {
  background:rgba(255,255,255,.75) !important; font-size:9.5px !important; border-radius:6px 0 0 0;
}

/* ── Modal ── */
.fc-modal-bg {
  position:fixed; inset:0; z-index:4000; background:rgba(15,17,23,.5);
  backdrop-filter:blur(3px); display:flex; align-items:center; justify-content:center; padding:16px;
  animation:fcfade .18s ease;
}
@keyframes fcfade { from { opacity:0 } to { opacity:1 } }
.fc-modal {
  background:#fff; border-radius:18px; width:100%; max-width:490px; max-height:90vh;
  overflow-y:auto; box-shadow:0 24px 60px rgba(0,0,0,.3);
  animation:fcpop .22s cubic-bezier(.4,0,.2,1);
}
@keyframes fcpop { from { opacity:0; transform:translateY(12px) scale(.98) } to { opacity:1; transform:none } }
.fc-modal-head {
  padding:16px 16px 16px 20px; border-bottom:1px solid #f1f2f4;
  display:flex; align-items:flex-start; justify-content:space-between; gap:12px;
}
.fc-modal-body { padding:18px 20px; display:flex; flex-direction:column; gap:14px; }
.fc-modal-foot { padding:14px 20px; border-top:1px solid #f1f2f4; display:flex; gap:10px; }
.fc-label { font-size:11.5px; font-weight:700; color:#374151; margin-bottom:6px; display:block; }
.fc-field {
  width:100%; border:1.5px solid #e9eaec; border-radius:9px; padding:9px 11px; font-size:13px;
  outline:none; box-sizing:border-box; font-family:inherit; color:#0f1117;
  transition:border-color .15s, box-shadow .15s; background:#fff;
}
.fc-field:focus { border-color:#0f1117; box-shadow:0 0 0 3px rgba(15,17,23,.06); }
.fc-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.fc-divider { height:1px; background:#f1f2f4; }
.fc-ghost-btn {
  margin-top:8px; display:flex; align-items:center; gap:6px; padding:7px 13px; border-radius:9px;
  border:1px solid #e9eaec; background:#fafbfc; cursor:pointer; font-size:12px; font-weight:700;
  color:#374151; font-family:inherit; transition:background .15s;
}
.fc-ghost-btn:hover:not(:disabled) { background:#f3f4f6; }
.fc-ghost-btn:disabled { opacity:.45; cursor:not-allowed; }
.fc-error {
  display:flex; align-items:center; gap:6px; font-size:12px; color:#dc2626;
  background:#fef2f2; padding:9px 11px; border-radius:9px;
}
.fc-btn-primary {
  flex:1; padding:11px; border-radius:11px; border:none; background:#0f1117; color:#fff;
  cursor:pointer; font-size:13px; font-weight:700; display:flex; align-items:center;
  justify-content:center; gap:7px; font-family:inherit; transition:background .15s;
}
.fc-btn-primary:hover:not(:disabled) { background:#242833; }
.fc-btn-primary:disabled { background:#b9bdc4; cursor:not-allowed; }
.fc-btn-secondary {
  flex:1; padding:11px; border-radius:11px; border:1px solid #e9eaec; background:#fff;
  cursor:pointer; font-size:13px; font-weight:700; color:#374151; font-family:inherit;
  transition:background .15s;
}
.fc-btn-secondary:hover { background:#f8f9fa; }

/* ── Misc ── */
.fc-spin { animation:fcspin 1s linear infinite; }
@keyframes fcspin { to { transform:rotate(360deg) } }
.fc-skel {
  background:linear-gradient(90deg,#f1f2f4 25%,#f8f9fa 50%,#f1f2f4 75%);
  background-size:200% 100%; animation:fcshim 1.4s ease-in-out infinite;
}
@keyframes fcshim { to { background-position:-200% 0 } }
.fc-shell button:focus-visible, .fc-shell input:focus-visible {
  outline:2px solid #2563eb; outline-offset:2px; border-radius:6px;
}

@media (prefers-reduced-motion: reduce) {
  .fc-pulse, .fc-dot-live, .fc-skel { animation:none; }
  .fc-panel, .fc-detail, .fc-notice, .fc-modal, .leaflet-marker-icon.fc-anim { transition:none; animation:none; }
}

/* ── Responsive ── */
@media (max-width: 1180px) {
  .fc-stats { order:3; width:100%; }
  .fc-controls { order:2; }
}
@media (max-width: 900px) {
  .fc-head { padding:12px 14px; gap:12px; }
  .fc-stats { gap:5px; overflow-x:auto; padding-bottom:2px; }
  .fc-stat { min-width:54px; padding:6px 9px; }
  .fc-panel {
    top:auto; left:10px; right:10px; bottom:10px; width:auto; height:46%; max-height:340px;
  }
  .fc-panel-hidden { transform:translateY(calc(100% + 20px)); }
  .fc-panel-open { top:auto; bottom:10px; left:10px; }
  .fc-detail {
    top:10px; left:10px; right:10px; width:auto; max-height:52%;
  }
  .fc-legend { display:none; }
  .fc-notice { bottom:auto; top:14px; }
}
    `}</style>
  );
}