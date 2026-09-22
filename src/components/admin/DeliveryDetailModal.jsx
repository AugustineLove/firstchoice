'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Loader2, X, CheckCircle, XCircle, Phone, User,
  MapPin, CreditCard, Package, Bike, Navigation,
} from 'lucide-react';
import {
  fieldStyle, fmtGHS, StatusBadge,
} from '../../pages/public/AdminDashboard';

/* ═══════════════════════════════════════════════
   Shared bits for the delivery detail modal
═══════════════════════════════════════════════ */
const DELIVERY_STEPS = ['PENDING', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'];
const ALL_STATUSES = [...DELIVERY_STEPS, 'CANCELLED'];

function InfoCard({ title, icon, children }) {
  return (
    <div style={{ border: '1px solid #f0f0f0', borderRadius: 14, padding: 14, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <span style={{ color: '#10b981', display: 'flex' }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#6b7280', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function PersonRow({ name, phone }) {
  if (!name) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#d1fae5', color: '#065f46', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
        {name.charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#0f1117' }}>{name}</div>
        {phone && <div style={{ fontSize: 12, color: '#9ca3af' }}>{phone}</div>}
      </div>
      {phone && (
        <a href={`tel:${phone}`} style={{ width: 32, height: 32, borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', textDecoration: 'none' }}>
          <Phone size={14} />
        </a>
      )}
    </div>
  );
}

function ProgressTracker({ status }) {
  const idx = DELIVERY_STEPS.indexOf(status);
  if (idx === -1) return null; // cancelled — no tracker
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        {DELIVERY_STEPS.map((s, i) => {
          const done = i <= idx;
          const isNow = i === idx;
          const isLast = i === DELIVERY_STEPS.length - 1;
          return (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: isLast ? '0 0 auto' : 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 64 }}>
                <div style={{
                  width: isNow ? 22 : 16, height: isNow ? 22 : 16, borderRadius: '50%',
                  background: done ? '#10b981' : '#e5e7eb',
                  border: isNow ? '2px solid #10b981' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {done && <CheckCircle size={isNow ? 12 : 9} color="#fff" />}
                </div>
                <div style={{ fontSize: 8.5, fontWeight: 700, color: isNow ? '#10b981' : done ? '#374151' : '#9ca3af', textAlign: 'center', marginTop: 5, lineHeight: 1.2 }}>
                  {s.replace(/_/g, ' ')}
                </div>
              </div>
              {!isLast && <div style={{ flex: 1, height: 2, background: i < idx ? '#10b981' : '#e5e7eb', marginTop: 8 }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RouteCard({ pickupAddress, destinationAddress }) {
  return (
    <InfoCard title="Route" icon={<Navigation size={14} />}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 3 }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MapPin size={9} color="#10b981" />
          </div>
          <div style={{ width: 2, flex: 1, minHeight: 24, background: '#d1fae5', margin: '4px 0' }} />
          <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MapPin size={9} color="#ef4444" />
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#10b981', letterSpacing: '0.05em' }}>PICKUP</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f1117', marginTop: 2 }}>{pickupAddress || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#ef4444', letterSpacing: '0.05em' }}>DESTINATION</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f1117', marginTop: 2 }}>{destinationAddress || '—'}</div>
          </div>
        </div>
      </div>
    </InfoCard>
  );
}

/* Errand items can come back either as plain strings (legacy data) or as
   { text, estimatedPrice } objects (what the booking form actually sends
   today) — normalize before rendering so React never gets a raw object. */
function ErrandItemRow({ item }) {
  const text = typeof item === 'string' ? item : item?.text;
  const price = typeof item === 'object' && item !== null ? Number(item.estimatedPrice) || 0 : 0;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13, color: '#374151' }}>
      <span>• {text || '—'}</span>
      {price > 0 && <span style={{ color: '#9ca3af', fontWeight: 600, flexShrink: 0 }}>{fmtGHS(price)}</span>}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   DELIVERY DETAIL MODAL
═══════════════════════════════════════════════ */
export function DeliveryDetailModal({ deliveryId, authFetch, theme, riders, onClose, onChanged }) {
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [busy, setBusy]         = useState(false);
  const [selectedRider, setSelectedRider] = useState('');
  const [overrideStatus, setOverrideStatus] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await authFetch(`/deliveries/${deliveryId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Could not load delivery');
      setDelivery(json.data);
      setOverrideStatus(json.data.status);
    } catch (e) {
      setError(e.message || 'Something went wrong.');
    }
    setLoading(false);
  }, [authFetch, deliveryId]);

  useEffect(() => { load(); }, [load]);

  async function assignRider() {
    if (!selectedRider) return;
    setBusy(true);
    try {
      await authFetch(`/deliveries/${deliveryId}/assign`, { method: 'PATCH', body: JSON.stringify({ riderId: selectedRider }) });
      await load();
      onChanged?.();
    } catch {}
    setBusy(false);
  }

  async function applyStatus() {
    if (!overrideStatus || overrideStatus === delivery.status) return;
    setBusy(true);
    try {
      await authFetch(`/admin/deliveries/${deliveryId}/status`, { method: 'PATCH', body: JSON.stringify({ status: overrideStatus }) });
      await load();
      onChanged?.();
    } catch {}
    setBusy(false);
  }

  async function cancelDelivery() {
    if (!window.confirm('Cancel this delivery? This cannot be undone and the customer will be notified.')) return;
    setBusy(true);
    try {
      await authFetch(`/admin/deliveries/${deliveryId}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'CANCELLED' }) });
      await load();
      onChanged?.();
    } catch {}
    setBusy(false);
  }

  const totalFee = (delivery?.deliveryFee || 0) + (delivery?.errandFee || 0);
  const assignable = delivery && ['PENDING', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT'].includes(delivery.status);

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,17,23,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '40px 16px', overflowY: 'auto' }}
    >
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 640, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #f0f0f0' }}>
          <div>
            <div style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace', fontWeight: 700 }}>
              #{deliveryId?.slice(-8).toUpperCase()}
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#0f1117', marginTop: 4 }}>
              {delivery?.type === 'ERRAND' ? 'Errand Details' : 'Delivery Details'}
            </div>
            {delivery?.createdAt && (
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{new Date(delivery.createdAt).toLocaleString()}</div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {delivery?.status && <StatusBadge status={delivery.status} />}
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div style={{ padding: '20px 24px', maxHeight: '65vh', overflowY: 'auto' }}>
          {loading && !delivery ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: theme.green }} />
            </div>
          ) : error ? (
            <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 10, padding: '14px 18px', fontSize: 13 }}>{error}</div>
          ) : (
            <>
              {delivery.status === 'CANCELLED' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
                  <XCircle size={18} color="#dc2626" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#dc2626' }}>This {delivery.type === 'ERRAND' ? 'errand' : 'delivery'} was cancelled</span>
                </div>
              ) : (
                <ProgressTracker status={delivery.status} />
              )}

              {/* Fee */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, marginBottom: 12,
                background: `linear-gradient(135deg, ${theme.green}, #04772c)`,
              }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={20} color="#fff" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>Total Fee</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{fmtGHS(totalFee)}</div>
                  {delivery.type === 'ERRAND' && delivery.itemsEstimatedTotal > 0 && (
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>+ {fmtGHS(delivery.itemsEstimatedTotal)} items</div>
                  )}
                </div>
                <div style={{ padding: '5px 10px', borderRadius: 50, background: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: 700, color: '#fff' }}>
                  {delivery.paymentMethod === 'MOMO' ? 'MoMo' : 'Cash'}
                </div>
              </div>

              <RouteCard pickupAddress={delivery.pickupAddress} destinationAddress={delivery.destinationAddress} />

              {(delivery.itemDescription || delivery.errandItems?.length > 0) && (
                <InfoCard title={delivery.type === 'ERRAND' ? 'Errand Items' : 'Item Description'} icon={<Package size={14} />}>
                  {delivery.errandItems?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {delivery.errandItems.map((it, i) => (
                        <ErrandItemRow key={i} item={it} />
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: '#374151' }}>{delivery.itemDescription}</div>
                  )}
                </InfoCard>
              )}

              <InfoCard title="Customer" icon={<User size={14} />}>
                <PersonRow name={delivery.customer?.name} phone={delivery.customer?.phone} />
              </InfoCard>

              {delivery.recipientName && delivery.recipientName !== delivery.customer?.name && (
                <InfoCard title="Recipient (ordered for a friend)" icon={<User size={14} />}>
                  <PersonRow name={delivery.recipientName} phone={delivery.recipientPhone} />
                </InfoCard>
              )}

              <InfoCard title="Rider" icon={<Bike size={14} />}>
                {delivery.rider ? (
                  <PersonRow name={delivery.rider.user?.name} phone={delivery.rider.user?.phone} />
                ) : (
                  <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>No rider assigned yet</div>
                )}

                {assignable && (
                  <div style={{ display: 'flex', gap: 8, marginTop: delivery.rider ? 12 : 0 }}>
                    <select value={selectedRider} onChange={e => setSelectedRider(e.target.value)} style={{ ...fieldStyle, height: 36, flex: 1 }}>
                      <option value="">{delivery.rider ? 'Reassign to…' : 'Select rider'}</option>
                      {riders?.map(rd => <option key={rd.id} value={rd.id}>{rd.user?.name}</option>)}
                    </select>
                    <button onClick={assignRider} disabled={!selectedRider || busy}
                      style={{ padding: '0 14px', borderRadius: 8, border: 'none', background: delivery.rider ? '#3b82f6' : theme.green, color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', opacity: !selectedRider ? 0.5 : 1 }}>
                      {busy ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : (delivery.rider ? 'Reassign' : 'Assign')}
                    </button>
                  </div>
                )}
              </InfoCard>

              {/* ADMIN OVERRIDE */}
              <InfoCard title="Update Status (admin override)" icon={<CheckCircle size={14} />}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select value={overrideStatus} onChange={e => setOverrideStatus(e.target.value)} style={{ ...fieldStyle, height: 36, flex: 1 }}>
                    {ALL_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                  <button onClick={applyStatus} disabled={busy || overrideStatus === delivery.status}
                    style={{ padding: '0 14px', borderRadius: 8, border: 'none', background: '#0f1117', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', opacity: overrideStatus === delivery.status ? 0.4 : 1 }}>
                    {busy ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : 'Apply'}
                  </button>
                </div>
              </InfoCard>
            </>
          )}
        </div>

        {/* FOOTER */}
        {delivery && delivery.status !== 'CANCELLED' && delivery.status !== 'DELIVERED' && (
          <div style={{ padding: '14px 24px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={cancelDelivery} disabled={busy}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              <XCircle size={13} /> Cancel {delivery.type === 'ERRAND' ? 'Errand' : 'Delivery'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}