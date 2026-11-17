import { useState, useEffect, useCallback } from 'react';
import { Loader2, Trash2, Eye, EyeOff } from 'lucide-react';
import { fieldStyle, FormField } from '../../pages/customer/AdminDashboard'; // adjust path if needed

const card = { background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0', padding: '22px 24px', marginBottom: 20 };
const h3 = { fontSize: 15, fontWeight: 800, color: '#0f1117', margin: '0 0 4px' };
const sub = { fontSize: 12, color: '#9ca3af', margin: '0 0 18px' };
const ghs = (n) => `GHS ${Number(n || 0).toFixed(0)}`;
const toLocalInput = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

const EMPTY_PROMO = {
  name: '', code: '', type: 'FREE_DELIVERY', value: '', maxDiscount: '', minSubtotal: '',
  vendorId: '', startsAt: '', endsAt: '', usageLimit: '', perUserLimit: '',
};

function promoState(p) {
  const now = Date.now();
  if (!p.active) return { label: 'Off', color: '#374151', bg: '#f3f4f6' };
  if (new Date(p.startsAt).getTime() > now) return { label: 'Scheduled', color: '#92400e', bg: '#fef3c7' };
  if (new Date(p.endsAt).getTime() <= now) return { label: 'Expired', color: '#991b1b', bg: '#fee2e2' };
  if (p.usageLimit != null && p.usedCount >= p.usageLimit) return { label: 'Used up', color: '#991b1b', bg: '#fee2e2' };
  return { label: 'Live', color: '#065f46', bg: '#d1fae5' };
}

function promoSummary(p) {
  if (p.type === 'FREE_DELIVERY') return 'Free delivery';
  if (p.type === 'FIXED_OFF') return `${ghs(p.value)} off delivery`;
  return `${p.value}% off delivery${p.maxDiscount != null ? ` (max ${ghs(p.maxDiscount)})` : ''}`;
}

export function DeliveryPricingSection({ authFetch, theme }) {
  const [loading, setLoading] = useState(true);
  const [cfg, setCfg] = useState({ baseFee: '', perKmRate: '', minFee: '', maxFee: '', surgeMultiplier: '1', fallbackFee: '' });
  const [promos, setPromos] = useState([]);
  const [vendors, setVendors] = useState([]);

  const [savingCfg, setSavingCfg] = useState(false);
  const [cfgMsg, setCfgMsg] = useState(null);

  const [sim, setSim] = useState({ subtotal: '', promoCode: '' });
  const [rows, setRows] = useState([]);
  const [simLoading, setSimLoading] = useState(false);

  const [form, setForm] = useState(EMPTY_PROMO);
  const [savingPromo, setSavingPromo] = useState(false);
  const [promoMsg, setPromoMsg] = useState(null);

  const api = useCallback(async (path, method = 'GET', body) => {
    const res = await authFetch(path, { method, ...(body ? { body: JSON.stringify(body) } : {}) });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Request failed');
    return json.data;
  }, [authFetch]);

  const runPreview = useCallback(async (s = sim) => {
    setSimLoading(true);
    try {
      const data = await api('/admin/delivery-pricing/preview', 'POST', {
        subtotal: Number(s.subtotal) || 0,
        promoCode: s.promoCode || undefined,
      });
      setRows(data);
    } catch {}
    setSimLoading(false);
  }, [api, sim]);

  const load = useCallback(async () => {
    try {
      const data = await api('/admin/delivery-pricing');
      const c = data.config;
      setCfg({
        baseFee: String(c.baseFee), perKmRate: String(c.perKmRate), minFee: String(c.minFee),
        maxFee: c.maxFee == null ? '' : String(c.maxFee),
        surgeMultiplier: String(c.surgeMultiplier), fallbackFee: String(c.fallbackFee),
      });
      setPromos(data.promotions);
    } catch (e) {
      setCfgMsg({ ok: false, text: e.message });
    }
    setLoading(false);
  }, [api]);

  useEffect(() => { load().then(() => runPreview()); /* eslint-disable-next-line */ }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch('/admin/vendors?limit=100&status=ACTIVE');
        const json = await res.json();
        if (json.success) setVendors(json.data.vendors);
      } catch {}
    })();
  }, [authFetch]);

  async function saveConfig() {
    setSavingCfg(true); setCfgMsg(null);
    try {
      await api('/admin/delivery-pricing/config', 'PUT', cfg);
      setCfgMsg({ ok: true, text: 'Saved. New quotes and orders use these rates immediately.' });
      runPreview();
    } catch (e) {
      setCfgMsg({ ok: false, text: e.message });
    }
    setSavingCfg(false);
  }

  async function createPromo() {
    setSavingPromo(true); setPromoMsg(null);
    try {
      await api('/admin/delivery-pricing/promotions', 'POST', {
        ...form,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : '',
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : '',
      });
      setPromoMsg({ ok: true, text: 'Promotion created.' });
      setForm(EMPTY_PROMO);
      await load();
      runPreview();
    } catch (e) {
      setPromoMsg({ ok: false, text: e.message });
    }
    setSavingPromo(false);
  }

  async function toggle(p) {
    try { await api(`/admin/delivery-pricing/promotions/${p.id}`, 'PATCH', { active: !p.active }); } catch (e) { setPromoMsg({ ok: false, text: e.message }); }
    await load(); runPreview();
  }

  async function remove(p) {
    const used = p.usedCount > 0;
    if (!window.confirm(used ? `"${p.name}" has been used ${p.usedCount} times, so it will be switched off instead of deleted.` : `Delete "${p.name}"?`)) return;
    try { await api(`/admin/delivery-pricing/promotions/${p.id}`, 'DELETE'); } catch (e) { setPromoMsg({ ok: false, text: e.message }); }
    await load(); runPreview();
  }

  function preset(kind) {
    const now = new Date();
    if (kind === 'free') {
      const end = new Date(now); end.setHours(23, 59, 0, 0);
      setForm({ ...EMPTY_PROMO, name: 'Free delivery today', type: 'FREE_DELIVERY', startsAt: toLocalInput(now), endsAt: toLocalInput(end) });
    } else {
      const end = new Date(now.getTime() + 7 * 86400000);
      setForm({ ...EMPTY_PROMO, name: 'GHS 3 off delivery', type: 'FIXED_OFF', value: '3', startsAt: toLocalInput(now), endsAt: toLocalInput(end) });
    }
  }

  const setC = (k) => (e) => setCfg({ ...cfg, [k]: e.target.value });
  const setF = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const msgBox = (m) => m && (
    <div style={{ background: m.ok ? '#f0fdf4' : '#fef2f2', color: m.ok ? '#16a34a' : '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginTop: 12 }}>{m.text}</div>
  );
  const btn = (disabled) => ({
    height: 42, padding: '0 20px', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 13, fontFamily: 'inherit',
    background: disabled ? '#d1d5db' : theme.green, color: '#fff', cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', gap: 8,
  });

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: theme.green }} /></div>;
  }

  const surge = Number(cfg.surgeMultiplier) || 1;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f1117', margin: 0 }}>Delivery Pricing</h2>
        <p style={{ color: '#6b7280', fontSize: 14, margin: '4px 0 0' }}>Set delivery rates and run promotions. Existing orders keep the fee they were placed with.</p>
      </div>

      {/* RATES */}
      <div style={{ ...card, maxWidth: 720 }}>
        <h3 style={h3}>Rates</h3>
        <p style={sub}>Fee = (base + distance × per-km) × surge, then clamped to min/max and rounded to whole cedis.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <FormField label="Base fee (GHS)"><input style={fieldStyle} value={cfg.baseFee} onChange={setC('baseFee')} inputMode="decimal" /></FormField>
          <FormField label="Per km (GHS)"><input style={fieldStyle} value={cfg.perKmRate} onChange={setC('perKmRate')} inputMode="decimal" /></FormField>
          <FormField label="Fallback fee (GHS)"><input style={fieldStyle} value={cfg.fallbackFee} onChange={setC('fallbackFee')} inputMode="decimal" /></FormField>
          <FormField label="Minimum fee (GHS)"><input style={fieldStyle} value={cfg.minFee} onChange={setC('minFee')} inputMode="decimal" /></FormField>
          <FormField label="Maximum fee (optional)"><input style={fieldStyle} value={cfg.maxFee} onChange={setC('maxFee')} inputMode="decimal" placeholder="No cap" /></FormField>
          <FormField label="Surge multiplier"><input style={fieldStyle} value={cfg.surgeMultiplier} onChange={setC('surgeMultiplier')} inputMode="decimal" /></FormField>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 4 }}>
          <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>Quick surge:</span>
          {['1', '1.25', '1.5', '2'].map((v) => (
            <button key={v} type="button" onClick={() => setCfg({ ...cfg, surgeMultiplier: v })}
              style={{ fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit',
                border: `1px solid ${surge === Number(v) ? theme.green : '#e5e7eb'}`, background: surge === Number(v) ? `${theme.green}18` : '#f9fafb', color: surge === Number(v) ? theme.green : '#374151' }}>
              {v === '1' ? 'Normal' : `${v}×`}
            </button>
          ))}
        </div>

        {msgBox(cfgMsg)}
        <button onClick={saveConfig} disabled={savingCfg} style={{ ...btn(savingCfg), marginTop: 16 }}>
          {savingCfg ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : 'Save rates'}
        </button>
      </div>

      {/* SIMULATOR */}
      <div style={{ ...card, maxWidth: 720 }}>
        <h3 style={h3}>Fee simulator</h3>
        <p style={sub}>See exactly what customers would pay right now, with the real server logic. Nothing is saved.</p>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ width: 160 }}>
            <FormField label="Order subtotal (GHS)"><input style={fieldStyle} value={sim.subtotal} onChange={(e) => setSim({ ...sim, subtotal: e.target.value })} inputMode="decimal" placeholder="0" /></FormField>
          </div>
          <div style={{ width: 160 }}>
            <FormField label="Promo code (optional)"><input style={fieldStyle} value={sim.promoCode} onChange={(e) => setSim({ ...sim, promoCode: e.target.value })} placeholder="e.g. WELCOME" /></FormField>
          </div>
          <button onClick={() => runPreview()} disabled={simLoading} style={{ ...btn(simLoading), marginBottom: 16 }}>
            {simLoading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Calculating...</> : 'Simulate'}
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: '#6b7280', fontSize: 12 }}>
              <th style={{ padding: '8px 6px' }}>Distance</th>
              <th style={{ padding: '8px 6px' }}>Normal fee</th>
              <th style={{ padding: '8px 6px' }}>Discount</th>
              <th style={{ padding: '8px 6px' }}>Customer pays</th>
              <th style={{ padding: '8px 6px' }}>Promo applied</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.distanceKm} style={{ borderTop: '1px solid #f3f4f6' }}>
                <td style={{ padding: '9px 6px', fontWeight: 700 }}>{r.distanceKm} km</td>
                <td style={{ padding: '9px 6px' }}>{ghs(r.baseFee)}</td>
                <td style={{ padding: '9px 6px', color: r.discount > 0 ? '#16a34a' : '#9ca3af' }}>{r.discount > 0 ? `-${ghs(r.discount)}` : '—'}</td>
                <td style={{ padding: '9px 6px', fontWeight: 800 }}>{r.finalFee === 0 ? 'FREE' : ghs(r.finalFee)}</td>
                <td style={{ padding: '9px 6px', color: '#6b7280' }}>{r.promotionName || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PROMOTIONS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 440px) 1fr', gap: 20, alignItems: 'start' }}>
        <div style={card}>
          <h3 style={h3}>New promotion</h3>
          <p style={sub}>Promotions without a code apply automatically. Customers get the single best one, they don't stack.</p>

          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => preset('free')} style={{ fontSize: 11, fontWeight: 600, padding: '6px 10px', borderRadius: 20, border: '1px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer', fontFamily: 'inherit' }}>Free delivery today</button>
            <button type="button" onClick={() => preset('fixed')} style={{ fontSize: 11, fontWeight: 600, padding: '6px 10px', borderRadius: 20, border: '1px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer', fontFamily: 'inherit' }}>GHS 3 off, 7 days</button>
          </div>

          <FormField label="Name (shown to customers)"><input style={fieldStyle} value={form.name} onChange={setF('name')} placeholder="e.g. Free delivery weekend" maxLength={50} /></FormField>
          <FormField label="Code (optional)"><input style={fieldStyle} value={form.code} onChange={setF('code')} placeholder="Leave empty to apply automatically" /></FormField>

          <FormField label="Type">
            <select style={fieldStyle} value={form.type} onChange={setF('type')}>
              <option value="FREE_DELIVERY">Free delivery</option>
              <option value="FIXED_OFF">Fixed amount off</option>
              <option value="PERCENT_OFF">Percent off</option>
            </select>
          </FormField>

          {form.type !== 'FREE_DELIVERY' && (
            <FormField label={form.type === 'FIXED_OFF' ? 'Amount off (GHS)' : 'Percent off (1-100)'}>
              <input style={fieldStyle} value={form.value} onChange={setF('value')} inputMode="decimal" />
            </FormField>
          )}
          {form.type === 'PERCENT_OFF' && (
            <FormField label="Maximum discount (GHS, optional)"><input style={fieldStyle} value={form.maxDiscount} onChange={setF('maxDiscount')} inputMode="decimal" /></FormField>
          )}

          <FormField label="Minimum order (GHS, optional)"><input style={fieldStyle} value={form.minSubtotal} onChange={setF('minSubtotal')} inputMode="decimal" /></FormField>

          <FormField label="Vendor (optional)">
            <select style={fieldStyle} value={form.vendorId} onChange={setF('vendorId')}>
              <option value="">All vendors</option>
              {vendors.map((v) => <option key={v.id} value={v.id}>{v.businessName}</option>)}
            </select>
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Starts"><input type="datetime-local" style={fieldStyle} value={form.startsAt} onChange={setF('startsAt')} /></FormField>
            <FormField label="Ends"><input type="datetime-local" style={fieldStyle} value={form.endsAt} onChange={setF('endsAt')} /></FormField>
            <FormField label="Total uses (optional)"><input style={fieldStyle} value={form.usageLimit} onChange={setF('usageLimit')} inputMode="numeric" /></FormField>
            <FormField label="Per customer (optional)"><input style={fieldStyle} value={form.perUserLimit} onChange={setF('perUserLimit')} inputMode="numeric" /></FormField>
          </div>

          {msgBox(promoMsg)}
          <button onClick={createPromo} disabled={savingPromo || !form.name.trim() || !form.startsAt || !form.endsAt} style={{ ...btn(savingPromo || !form.name.trim() || !form.startsAt || !form.endsAt), marginTop: 16 }}>
            {savingPromo ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Creating...</> : 'Create promotion'}
          </button>
        </div>

        <div style={card}>
          <h3 style={{ ...h3, marginBottom: 16 }}>All promotions</h3>
          {promos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 14 }}>No promotions yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {promos.map((p) => {
                const st = promoState(p);
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: '#f9fafb', border: '1px solid #f0f0f0' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: '#0f1117', fontSize: 14 }}>
                        {p.name}{p.code && <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 800, background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: 6 }}>{p.code}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>
                        {promoSummary(p)}{p.minSubtotal != null ? ` · min order ${ghs(p.minSubtotal)}` : ''}{p.vendorId ? ' · one vendor' : ''}
                      </div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>
                        {new Date(p.startsAt).toLocaleString()} → {new Date(p.endsAt).toLocaleString()} · used {p.usedCount}{p.usageLimit != null ? `/${p.usageLimit}` : ''}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 50, background: st.bg, color: st.color }}>{st.label}</span>
                    <button onClick={() => toggle(p)} title={p.active ? 'Turn off' : 'Turn on'}
                      style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151' }}>
                      {p.active ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button onClick={() => remove(p)} title="Delete"
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
    </div>
  );
}