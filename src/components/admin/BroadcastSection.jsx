import { useState, useEffect, useCallback } from "react";
import { fieldStyle, FormField } from "../../pages/customer/AdminDashboard";
import { Loader2, ImagePlus, Trash2, Eye, EyeOff } from "lucide-react";
import { uploadToCloudinary, validateImageFile } from "../../utils/cloudinary";

/* ═══════════════════════════════════════════════
   BROADCAST SECTION — tabs: push + home announcements
═══════════════════════════════════════════════ */
export function BroadcastSection({ authFetch, theme }) {
  const [tab, setTab] = useState('announcements');

  const tabBtn = (id, label) => (
    <button key={id} onClick={() => setTab(id)} style={{
      padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
      fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
      background: tab === id ? `${theme.green}18` : 'transparent',
      color: tab === id ? theme.green : '#6b7280',
    }}>{label}</button>
  );

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f1117', margin: 0 }}>Broadcast</h2>
        <p style={{ color: '#6b7280', fontSize: 14, margin: '4px 0 0' }}>
          Reach your users by push notification or a card on the app home screen
        </p>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {tabBtn('announcements', 'Home Announcements')}
        {tabBtn('push', 'Push Notification')}
      </div>
      {tab === 'push'
        ? <PushForm authFetch={authFetch} theme={theme} />
        : <AnnouncementsPanel authFetch={authFetch} theme={theme} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PUSH FORM (your original, unchanged)
═══════════════════════════════════════════════ */
function PushForm({ authFetch, theme }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const QUICK_TEMPLATES = [
    { title: 'We miss you!', body: "We miss you — place an order today and let's get it delivered!" },
    { title: "There's something new", body: 'New vendors just joined FirstChoice — check them out.' },
  ];

  async function send() {
    if (!title.trim() || !message.trim()) return;
    if (!window.confirm(`Send this to ${audience ? audience.toLowerCase() + 's' : 'ALL users'}?`)) return;
    setSending(true); setError(null); setResult(null);
    try {
      const res = await authFetch('/admin/broadcast', {
        method: 'POST',
        body: JSON.stringify({ title: title.trim(), message: message.trim(), role: audience || undefined }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Could not send broadcast');
      setResult(json.data);
      setTitle(''); setMessage('');
    } catch (e) {
      setError(e.message || 'Something went wrong.');
    }
    setSending(false);
  }

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0', padding: '22px 24px', maxWidth: 560 }}>
      <FormField label="Audience">
        <select style={fieldStyle} value={audience} onChange={e => setAudience(e.target.value)}>
          <option value="">Everyone</option>
          <option value="CUSTOMER">Customers only</option>
          <option value="VENDOR">Vendors only</option>
          <option value="RIDER">Riders only</option>
        </select>
      </FormField>

      <FormField label="Title">
        <input style={fieldStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. We miss you!" maxLength={60} />
      </FormField>

      <FormField label="Message">
        <textarea
          value={message} onChange={e => setMessage(e.target.value)}
          placeholder="e.g. Make an order today, let's get it delivered!"
          maxLength={180}
          style={{ width: '100%', minHeight: 90, border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }}
        />
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, textAlign: 'right' }}>{message.length}/180</div>
      </FormField>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {QUICK_TEMPLATES.map((t, i) => (
          <button key={i} type="button" onClick={() => { setTitle(t.title); setMessage(t.body); }}
            style={{ fontSize: 11, fontWeight: 600, padding: '6px 10px', borderRadius: 20, border: '1px solid #e5e7eb', background: '#f9fafb', color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>
            {t.title}
          </button>
        ))}
      </div>

      {error && <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>{error}</div>}
      {result && <div style={{ background: '#f0fdf4', color: '#16a34a', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>Sent to {result.total} user{result.total === 1 ? '' : 's'}.</div>}

      <button onClick={send} disabled={sending || !title.trim() || !message.trim()} style={{
        height: 44, padding: '0 22px', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 14, fontFamily: 'inherit',
        background: (sending || !title.trim() || !message.trim()) ? '#d1d5db' : theme.green, color: '#fff',
        cursor: (sending || !title.trim() || !message.trim()) ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {sending ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Sending...</> : 'Send Broadcast'}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   HOME ANNOUNCEMENTS
═══════════════════════════════════════════════ */
function announcementState(a) {
  const now = Date.now();
  if (!a.isActive) return { label: 'Off', color: '#374151', bg: '#f3f4f6' };
  if (new Date(a.startsAt).getTime() > now) return { label: 'Scheduled', color: '#92400e', bg: '#fef3c7' };
  if (a.endsAt && new Date(a.endsAt).getTime() <= now) return { label: 'Expired', color: '#991b1b', bg: '#fee2e2' };
  return { label: 'Live', color: '#065f46', bg: '#d1fae5' };
}

function AnnouncementsPanel({ authFetch, theme }) {
  const [list, setList] = useState([]);
  const [listLoading, setListLoading] = useState(true);

  // form
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [targetType, setTargetType] = useState('VENDOR');
  const [vendorId, setVendorId] = useState('');
  const [productId, setProductId] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [alsoPush, setAlsoPush] = useState(false);

  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const loadList = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await authFetch('/announcements/admin');
      const json = await res.json();
      if (json.success) setList(json.data);
    } catch {}
    setListLoading(false);
  }, [authFetch]);

  useEffect(() => { loadList(); }, [loadList]);

  // vendors for the picker (load once)
  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch('/admin/vendors?limit=100&status=ACTIVE');
        const json = await res.json();
        if (json.success) setVendors(json.data.vendors);
      } catch {}
    })();
  }, [authFetch]);

  // products of the chosen vendor, only when targeting a product
  useEffect(() => {
    setProductId(''); setProducts([]);
    if (targetType !== 'PRODUCT' || !vendorId) return;
    (async () => {
      try {
        const res = await authFetch(`/announcements/admin/products?vendorId=${vendorId}`);
        const json = await res.json();
        if (json.success) setProducts(json.data);
      } catch {}
    })();
  }, [targetType, vendorId, authFetch]);

  async function onPickImage(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const problem = validateImageFile(file);   // adjust if yours returns {valid, error} instead
    if (problem) { setError(typeof problem === 'string' ? problem : 'Invalid image'); return; }
    setUploading(true); setError(null);
    try {
      const up = await uploadToCloudinary(file);
      setImageUrl(typeof up === 'string' ? up : (up?.secure_url || up?.url || ''));
    } catch (err) {
      setError(err.message || 'Image upload failed');
    }
    setUploading(false);
  }

  const canSave =
    title.trim() &&
    (targetType === 'NONE' ||
      (targetType === 'VENDOR' && vendorId) ||
      (targetType === 'PRODUCT' && vendorId && productId));

  async function save() {
    if (!canSave) return;
    setSaving(true); setError(null); setNotice(null);
    try {
      const res = await authFetch('/announcements/admin', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          subtitle: subtitle.trim() || undefined,
          imageUrl: imageUrl || undefined,
          targetType,
          vendorId: targetType === 'VENDOR' ? vendorId : undefined,
          productId: targetType === 'PRODUCT' ? productId : undefined,
          endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Could not create announcement');

      let msg = 'Announcement is live on the home screen.';
      if (alsoPush) {
        try {
          const pushRes = await authFetch('/admin/broadcast', {
            method: 'POST',
            body: JSON.stringify({
              title: title.trim(),
              message: subtitle.trim() || title.trim(),
              role: 'CUSTOMER',
              data: targetType === 'VENDOR' ? { screen: 'vendor', vendorId }
                  : targetType === 'PRODUCT' ? { screen: 'product', productId }
                  : undefined,
            }),
          });
          const pushJson = await pushRes.json();
          msg += pushJson.success
            ? ` Push sent to ${pushJson.data?.total ?? 'all'} customers.`
            : ` Push failed: ${pushJson.message || 'unknown error'}.`;
        } catch {
          msg += ' Push could not be sent.';
        }
      }
      setNotice(msg);
      setTitle(''); setSubtitle(''); setImageUrl(''); setVendorId(''); setProductId(''); setEndsAt(''); setAlsoPush(false);
      loadList();
    } catch (e) {
      setError(e.message || 'Something went wrong.');
    }
    setSaving(false);
  }

  async function toggle(a) {
    await authFetch(`/announcements/admin/${a.id}`, { method: 'PATCH', body: JSON.stringify({ isActive: !a.isActive }) });
    loadList();
  }

  async function remove(a) {
    if (!window.confirm(`Delete "${a.title}"?`)) return;
    await authFetch(`/announcements/admin/${a.id}`, { method: 'DELETE' });
    loadList();
  }

  const targetLabel = (a) =>
    a.targetType === 'VENDOR'  ? `Vendor · ${a.vendor?.businessName || 'removed'}`
  : a.targetType === 'PRODUCT' ? `Product · ${a.product?.name || 'removed'}`
  : 'No link';

  const disabled = saving || uploading || !canSave;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 520px) 1fr', gap: 20, alignItems: 'start' }}>
      {/* FORM */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0', padding: '22px 24px' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#0f1117', marginBottom: 16 }}>New announcement</div>

        <FormField label="Title">
          <input style={fieldStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. New on FirstChoice 🎉" maxLength={50} />
        </FormField>

        <FormField label="Subtitle (optional)">
          <input style={fieldStyle} value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="e.g. Fresh jollof from Mama Put, order now" maxLength={90} />
        </FormField>

        <FormField label="Banner image (optional)">
          {imageUrl ? (
            <div style={{ position: 'relative', width: '100%', height: 120, borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
              <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button type="button" onClick={() => setImageUrl('')} style={{ position: 'absolute', top: 6, right: 6, width: 28, height: 28, borderRadius: 8, border: 'none', background: 'rgba(0,0,0,0.6)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={14} />
              </button>
            </div>
          ) : (
            <label style={{ height: 80, border: '1.5px dashed #d1d5db', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#6b7280', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {uploading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Uploading...</> : <><ImagePlus size={16} /> Upload image</>}
              <input type="file" accept="image/*" onChange={onPickImage} style={{ display: 'none' }} />
            </label>
          )}
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Without an image, the card uses the green gradient.</div>
        </FormField>

        <FormField label="When tapped, open">
          <select style={fieldStyle} value={targetType} onChange={e => setTargetType(e.target.value)}>
            <option value="VENDOR">A vendor</option>
            <option value="PRODUCT">A product</option>
            <option value="NONE">Nothing (info only)</option>
          </select>
        </FormField>

        {targetType !== 'NONE' && (
          <FormField label="Vendor">
            <select style={fieldStyle} value={vendorId} onChange={e => setVendorId(e.target.value)}>
              <option value="">Select a vendor…</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.businessName}</option>)}
            </select>
          </FormField>
        )}

        {targetType === 'PRODUCT' && (
          <FormField label="Product">
            <select style={fieldStyle} value={productId} onChange={e => setProductId(e.target.value)} disabled={!vendorId}>
              <option value="">{vendorId ? 'Select a product…' : 'Pick a vendor first'}</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}{p.available ? '' : ' (unavailable)'}</option>)}
            </select>
          </FormField>
        )}

        <FormField label="Stop showing on (optional)">
          <input type="datetime-local" style={fieldStyle} value={endsAt} onChange={e => setEndsAt(e.target.value)} />
        </FormField>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', fontWeight: 600, marginBottom: 16, cursor: 'pointer' }}>
          <input type="checkbox" checked={alsoPush} onChange={e => setAlsoPush(e.target.checked)} />
          Also send a push notification to customers
        </label>

        {error && <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>{error}</div>}
        {notice && <div style={{ background: '#f0fdf4', color: '#16a34a', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>{notice}</div>}

        <button onClick={save} disabled={disabled} style={{
          height: 44, padding: '0 22px', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 14, fontFamily: 'inherit',
          background: disabled ? '#d1d5db' : theme.green, color: '#fff',
          cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {saving ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Publishing...</> : 'Publish announcement'}
        </button>
      </div>

      {/* LIST */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0', padding: '22px 24px' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#0f1117', marginBottom: 16 }}>All announcements</div>
        {listLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: theme.green }} />
          </div>
        ) : list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 14 }}>No announcements yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {list.map(a => {
              const st = announcementState(a);
              return (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: '#f9fafb', border: '1px solid #f0f0f0' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 8, flexShrink: 0, overflow: 'hidden', background: `linear-gradient(135deg, #10B981, #34D399)` }}>
                    {a.imageUrl && <img src={a.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: '#0f1117', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{targetLabel(a)}</div>
                    {a.endsAt && <div style={{ fontSize: 11, color: '#9ca3af' }}>Ends {new Date(a.endsAt).toLocaleString()}</div>}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 50, background: st.bg, color: st.color }}>{st.label}</span>
                  <button onClick={() => toggle(a)} title={a.isActive ? 'Turn off' : 'Turn on'}
                    style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151' }}>
                    {a.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button onClick={() => remove(a)} title="Delete"
                    style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}