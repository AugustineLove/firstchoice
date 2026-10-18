// components/admin/AdminTerms.jsx
import { useState, useEffect, useCallback } from 'react';
import { FileText, Plus, Loader2, RefreshCw, Eye, Pencil, Trash2, Rocket, X, ExternalLink, Copy, PowerOff } from 'lucide-react';

const card = { background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0' };
const input = {
  width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '10px 12px',
  fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
};
const today = () => new Date().toISOString().slice(0, 10);
const emptyForm = () => ({ version: today(), summary: '', termsContent: '', privacyContent: '' });

function Pill({ text, color, bg }) {
  return <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 50, background: bg, color, whiteSpace: 'nowrap' }}>{text}</span>;
}

function StatusPill({ v }) {
  if (v.isCurrent) return <Pill text="Live" color="#065f46" bg="#d1fae5" />;
  if (v.publishedAt) return <Pill text="Published" color="#374151" bg="#f3f4f6" />;
  return <Pill text="Draft" color="#92400e" bg="#fef3c7" />;
}

function IconBtn({ title, onClick, disabled, danger, children }) {
  return (
    <button title={title} onClick={onClick} disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, fontSize: 12, fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, fontFamily: 'inherit',
        border: `1px solid ${danger ? '#fecaca' : '#e5e7eb'}`, background: danger ? '#fef2f2' : '#fff', color: danger ? '#dc2626' : '#374151',
      }}>
      {children}
    </button>
  );
}

export default function AdminTerms({ authFetch, theme }) {
  const [list, setList] = useState([]);
  const [current, setCurrent] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acting, setActing] = useState(null);
  const [editor, setEditor] = useState(null); // { id?, readOnly, form, urls? }
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

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
      const [l, s] = await Promise.all([call('/admin/terms'), call('/admin/terms/stats')]);
      setList(l.versions);
      setCurrent(l.currentVersion);
      setStats(s);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [call]);

  useEffect(() => { load(); }, [load]);

  async function openEditor(row) {
    setFormError(null);
    setActing(row.id);
    try {
      const d = await call(`/admin/terms/${row.id}`);
      setEditor({
        id: d.id,
        readOnly: !!d.publishedAt,
        urls: d.publishedAt ? { terms: d.termsUrl, privacy: d.privacyUrl } : null,
        form: { version: d.version, summary: d.summary || '', termsContent: d.termsContent, privacyContent: d.privacyContent },
      });
    } catch (e) { setError(e.message); }
    setActing(null);
  }

  function duplicateFrom(form) {
    setFormError(null);
    setEditor({ readOnly: false, form: { ...form, version: today() + '-2' } });
  }

  async function save() {
    setSaving(true);
    setFormError(null);
    try {
      if (editor.id) await call(`/admin/terms/${editor.id}`, 'PATCH', editor.form);
      else await call('/admin/terms', 'POST', editor.form);
      setEditor(null);
      load();
    } catch (e) { setFormError(e.message); }
    setSaving(false);
  }

  async function publish(row) {
    const ok = window.confirm(
      `Publish version "${row.version}"?\n\nEvery customer will be asked to accept it the next time they open the app. ` +
      `Published versions can't be edited afterwards.`
    );
    if (!ok) return;
    setActing(row.id);
    try { await call(`/admin/terms/${row.id}/publish`, 'POST'); await load(); } catch (e) { setError(e.message); }
    setActing(null);
  }

  async function remove(row) {
    if (!window.confirm(`Delete draft "${row.version}"?`)) return;
    setActing(row.id);
    try { await call(`/admin/terms/${row.id}`, 'DELETE'); await load(); } catch (e) { setError(e.message); }
    setActing(null);
  }

  async function disableGate() {
    if (!window.confirm('Turn the terms prompt OFF? Customers will no longer be asked to accept anything until you publish a version again.')) return;
    try { await call('/admin/terms/disable', 'POST'); await load(); } catch (e) { setError(e.message); }
  }

  const pct = stats && stats.total ? Math.round((stats.accepted / stats.total) * 100) : 0;
  const set = (k) => (e) => setEditor((ed) => ({ ...ed, form: { ...ed.form, [k]: e.target.value } }));

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f1117', margin: 0 }}>Terms &amp; Privacy</h2>
          <p style={{ color: '#6b7280', fontSize: 14, margin: '4px 0 0' }}>Write a version, publish it, and customers are asked to accept it in the app.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <IconBtn title="Refresh" onClick={load}><RefreshCw size={13} /> Refresh</IconBtn>
          <button onClick={() => { setFormError(null); setEditor({ readOnly: false, form: emptyForm() }); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: theme.green, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Plus size={14} /> New version
          </button>
        </div>
      </div>

      {error && <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13 }}>{error}</div>}

      {/* Rollout status */}
      <div style={{ ...card, padding: 20, marginBottom: 20 }}>
        {current ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live version</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#0f1117' }}>{current}</div>
              </div>
              <IconBtn title="Turn the prompt off" onClick={disableGate} danger><PowerOff size={13} /> Turn prompt off</IconBtn>
            </div>
            {stats && (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#374151', marginBottom: 6 }}>
                  <span><b>{stats.accepted}</b> accepted · <b>{stats.pending}</b> still to accept</span>
                  <span>{pct}% of {stats.total} customers</span>
                </div>
                <div style={{ height: 8, borderRadius: 8, background: '#f3f4f6', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: theme.green, transition: 'width 0.4s' }} />
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FileText size={22} color="#9ca3af" />
            <div>
              <div style={{ fontWeight: 800, color: '#0f1117' }}>No terms are live</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Versions */}
      <div style={{ ...card, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}><Loader2 size={22} style={{ animation: 'spin 1s linear infinite', color: theme.green }} /></div>
        ) : list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 50, color: '#9ca3af', fontSize: 14 }}>No versions yet</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                  {['Version', 'Status', 'Accepted', 'Created', ''].map((h) => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: '#6b7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((v) => (
                  <tr key={v.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#0f1117' }}>{v.version}</div>
                      {v.summary && <div style={{ color: '#9ca3af', fontSize: 12, maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.summary}</div>}
                    </td>
                    <td style={{ padding: '13px 16px' }}><StatusPill v={v} /></td>
                    <td style={{ padding: '13px 16px', fontWeight: 700 }}>{v.publishedAt ? v.acceptedCount : '—'}</td>
                    <td style={{ padding: '13px 16px', color: '#6b7280' }}>{new Date(v.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        {v.publishedAt ? (
                          <IconBtn title="View" onClick={() => openEditor(v)} disabled={acting === v.id}><Eye size={12} /> View</IconBtn>
                        ) : (
                          <>
                            <IconBtn title="Edit" onClick={() => openEditor(v)} disabled={acting === v.id}><Pencil size={12} /> Edit</IconBtn>
                            <IconBtn title="Publish" onClick={() => publish(v)} disabled={acting === v.id}><Rocket size={12} /> Publish</IconBtn>
                            <IconBtn title="Delete" onClick={() => remove(v)} disabled={acting === v.id} danger><Trash2 size={12} /></IconBtn>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Editor modal */}
      {editor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,17,23,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => !saving && setEditor(null)}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 760, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ fontWeight: 900, fontSize: 17, color: '#0f1117' }}>
                {editor.readOnly ? `Version ${editor.form.version}` : editor.id ? 'Edit draft' : 'New version'}
              </div>
              <button onClick={() => setEditor(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={18} /></button>
            </div>

            <div style={{ padding: 22, overflowY: 'auto' }}>
              {editor.readOnly && (
                <div style={{ background: '#f0f9ff', color: '#075985', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
                  This version is published and can't be changed, because customers accepted exactly this text. To change anything, create a new version.
                  {editor.urls && (
                    <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
                      <a href={editor.urls.terms} target="_blank" rel="noreferrer" style={{ color: '#0369a1', display: 'flex', alignItems: 'center', gap: 4 }}><ExternalLink size={12} /> Public Terms page</a>
                      <a href={editor.urls.privacy} target="_blank" rel="noreferrer" style={{ color: '#0369a1', display: 'flex', alignItems: 'center', gap: 4 }}><ExternalLink size={12} /> Public Privacy page</a>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 14 }}>
                <label>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Version name</div>
                  <input style={input} value={editor.form.version} onChange={set('version')} disabled={editor.readOnly} placeholder="2026-11-01" />
                </label>
                <label>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>What changed (shown to customers)</div>
                  <input style={input} value={editor.form.summary} onChange={set('summary')} disabled={editor.readOnly} maxLength={1000}
                    placeholder="We updated our terms and conditions, and updated how we handle your data." />
                </label>
              </div>

              <label style={{ display: 'block', marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Terms of Service</div>
                <textarea style={{ ...input, minHeight: 200, resize: 'vertical', lineHeight: 1.5 }} value={editor.form.termsContent} onChange={set('termsContent')} disabled={editor.readOnly} />
              </label>
              <label style={{ display: 'block' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Privacy Policy</div>
                <textarea style={{ ...input, minHeight: 200, resize: 'vertical', lineHeight: 1.5 }} value={editor.form.privacyContent} onChange={set('privacyContent')} disabled={editor.readOnly} />
              </label>
              {/* <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>Plain text. Line breaks are kept; HTML isn't rendered.</div> */}

              {formError && <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginTop: 14 }}>{formError}</div>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 22px', borderTop: '1px solid #f0f0f0' }}>
              {editor.readOnly ? (
                <button onClick={() => duplicateFrom(editor.form)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <Copy size={13} /> Create new version from this
                </button>
              ) : (
                <>
                  <button onClick={() => setEditor(null)} disabled={saving}
                    style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                  <button onClick={save} disabled={saving}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, border: 'none', background: theme.green, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
                    {saving && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />} Save draft
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}