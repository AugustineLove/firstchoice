// components/admin/AdminAppVersions.jsx
import { useState, useEffect, useCallback } from 'react';
import { Loader2, RefreshCw, Save, Smartphone, AlertTriangle } from 'lucide-react';

const card = { background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0' };
const input = {
  width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '10px 12px',
  fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
};
const labelStyle = { fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 };
const VERSION_RE = /^\d+(\.\d+){0,2}$/;

const EMPTY = {
  androidLatestVersion: '', androidMinVersion: '', androidStoreUrl: '',
  iosLatestVersion: '', iosMinVersion: '', iosStoreUrl: '',
  updateMessage: '',
};

const toForm = (d) => Object.fromEntries(Object.keys(EMPTY).map((k) => [k, d?.[k] ?? '']));

function summarize(latest, min, url) {
  if (!latest || !url) return { text: 'Off: nobody is prompted. Set a latest version and a store link to turn on.', tone: 'off' };
  const parts = [`Users below ${latest} see a "Later / Update" prompt`];
  if (min) parts.push(`users below ${min} are blocked until they update`);
  return { text: parts.join(', ') + '.', tone: 'on' };
}

function Field({ label, hint, children }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={labelStyle}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 5 }}>{hint}</div>}
    </label>
  );
}

function PlatformCard({ title, emoji, prefix, form, set, theme }) {
  const latest = form[`${prefix}LatestVersion`].trim();
  const min = form[`${prefix}MinVersion`].trim();
  const url = form[`${prefix}StoreUrl`].trim();
  const s = summarize(latest, min, url);

  return (
    <div style={{ ...card, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 18 }}>{emoji}</span>
        <div style={{ fontWeight: 900, fontSize: 16, color: '#0f1117' }}>{title}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <Field label="Latest version" hint="What's live in the store">
          <input style={input} placeholder="2.0.0" value={form[`${prefix}LatestVersion`]} onChange={set(`${prefix}LatestVersion`)} />
        </Field>
        <Field label="Minimum version" hint="Below this = forced update. Leave empty for none">
          <input style={input} placeholder="1.0.1" value={form[`${prefix}MinVersion`]} onChange={set(`${prefix}MinVersion`)} />
        </Field>
      </div>

      <Field label="Store link">
        <input style={input} value={form[`${prefix}StoreUrl`]} onChange={set(`${prefix}StoreUrl`)}
          placeholder={prefix === 'android' ? 'https://play.google.com/store/apps/details?id=com.first_choice.first_choice_mob' : 'https://apps.apple.com/us/app/first-choice/id6786762917'} />
      </Field>

      <div style={{
        marginTop: 14, padding: '10px 12px', borderRadius: 8, fontSize: 12, lineHeight: 1.5,
        background: s.tone === 'on' ? '#f0fdf4' : '#f9fafb', color: s.tone === 'on' ? '#166534' : '#6b7280',
      }}>
        {s.text}
      </div>
    </div>
  );
}

export default function AdminAppVersions({ authFetch, theme }) {
  const [form, setForm] = useState(EMPTY);
  const [saved, setSaved] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(false);

  const call = useCallback(async (path, method = 'GET', body) => {
    const res = await authFetch(path, { method, ...(body && { body: JSON.stringify(body) }) });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Request failed');
    return json.data;
  }, [authFetch]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const f = toForm(await call('/app/app-version'));
      setForm(f);
      setSaved(f);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, [call]);

  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => { setOk(false); setForm((f) => ({ ...f, [k]: e.target.value })); };
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);

  // Quick client-side check so typos are caught before the request
  function validate() {
    for (const [p, name] of [['android', 'Android'], ['ios', 'iOS']]) {
      for (const k of ['LatestVersion', 'MinVersion']) {
        const v = form[`${p}${k}`].trim();
        if (v && !VERSION_RE.test(v)) return `${name}: versions must look like 1.0.2`;
      }
    }
    return null;
  }

  async function save() {
    const v = validate();
    if (v) { setError(v); return; }
    if (!window.confirm('Save these settings? Customers on older versions will start seeing the prompt the next time they open the app.')) return;

    setSaving(true);
    setError(null);
    try {
      const f = toForm(await call('/app/app-version', 'PUT', form));
      setForm(f);
      setSaved(f);
      setOk(true);
    } catch (e) { setError(e.message); }
    setSaving(false);
  }

  const forcing = (form.androidMinVersion.trim() || form.iosMinVersion.trim());

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f1117', margin: 0 }}>App Updates</h2>
          <p style={{ color: '#6b7280', fontSize: 14, margin: '4px 0 0' }}>
            Control the "update available" prompt in the customer app.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} disabled={loading || saving}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={save} disabled={!dirty || saving || loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: theme.green, color: '#fff', fontWeight: 700, fontSize: 13, cursor: !dirty || saving ? 'not-allowed' : 'pointer', opacity: !dirty || saving ? 0.6 : 1, fontFamily: 'inherit' }}>
            {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />} Save changes
          </button>
        </div>
      </div>

      {error && <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13 }}>{error}</div>}
      {ok && <div style={{ background: '#f0fdf4', color: '#166534', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13 }}>Saved.</div>}

      {loading ? (
        <div style={{ ...card, display: 'flex', justifyContent: 'center', padding: 50 }}>
          <Loader2 size={22} style={{ animation: 'spin 1s linear infinite', color: theme.green }} />
        </div>
      ) : (
        <>
          <div style={{ background: '#fffbeb', color: '#92400e', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              Publish the new version in the store <b>first</b>, then update the numbers here. Otherwise people get sent to a store page that doesn't have the update yet.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 16 }}>
            <PlatformCard title="Android" emoji="🤖" prefix="android" form={form} set={set} theme={theme} />
            <PlatformCard title="iOS" emoji="🍎" prefix="ios" form={form} set={set} theme={theme} />
          </div>

          <div style={{ ...card, padding: 20 }}>
            <Field label="Custom message (optional)" hint={forcing ? 'Shown on both soft and forced prompts. Leave empty to use the default text.' : 'Leave empty to use the default text.'}>
              <input style={input} maxLength={200} value={form.updateMessage} onChange={set('updateMessage')}
                placeholder="A new version is available with improvements and fixes." />
            </Field>
          </div>

          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Smartphone size={12} /> Only app builds that include the update check will show the prompt, so older installs won't see it.
          </div>
        </>
      )}
    </div>
  );
}