import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const font = { fontFamily: "'DM Sans', sans-serif" };

export default function AdminResetPassword() {
  const { authFetch } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null); // { user, tempPassword, generated }
  const [copied, setCopied] = useState(false);

  // debounced user search
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await authFetch(`/admin/users?search=${encodeURIComponent(q)}&limit=8`);
        const json = await res.json();
        if (json.success) setResults(json.data.users ?? json.data);
      } catch { /* ignore */ }
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query, authFetch]);

  function pick(u) {
    setSelected(u); setResults([]); setQuery('');
    setPassword(''); setError(''); setDone(null); setCopied(false);
  }

  async function submit() {
    setError('');
    if (password && password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (!window.confirm(`Reset password for ${selected.name}? Their current password will stop working.`)) return;

    setBusy(true);
    try {
      const res = await authFetch(`/admin/users/${selected.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(password ? { password } : {}),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Reset failed');
      setDone({ ...json.data, tempPassword: json.data.tempPassword ?? password });
      setSelected(null); setPassword('');
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  }

  async function copy() {
    try { await navigator.clipboard.writeText(done.tempPassword); setCopied(true); } catch {}
  }

  const card = { background: '#fff', border: '1px solid #eee', borderRadius: 16, padding: 20, ...font };
  const input = { width: '100%', height: 44, padding: '0 14px', borderRadius: 12, border: '1px solid #ddd', fontSize: 14, outline: 'none', boxSizing: 'border-box', ...font };
  const btn = { height: 44, padding: '0 20px', borderRadius: 12, border: 'none', background: '#0c3324', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', ...font };

  return (
    <div style={{ maxWidth: 560 }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, ...font }}>Reset User Password</h2>
      <p style={{ margin: '0 0 18px', fontSize: 13, color: '#6b7280', ...font }}>
        Find a user by name, phone or email, then set a new password for them.
      </p>

      {/* Success panel */}
      {done && (
        <div style={{ ...card, borderColor: '#16a34a', background: '#f0fdf4', marginBottom: 16 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>
            Password reset for {done.user.name} ({done.user.phone})
          </div>
          <div style={{ fontSize: 13, color: '#4b5563', marginBottom: 10 }}>
            Share this with the user. It is shown only once; ask them to change it after logging in.
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <code style={{ flex: 1, padding: '10px 14px', background: '#fff', border: '1px dashed #86efac', borderRadius: 10, fontSize: 16, letterSpacing: 2, fontWeight: 700 }}>
              {done.tempPassword}
            </code>
            <button onClick={copy} style={{ ...btn, background: '#16a34a' }}>{copied ? 'Copied ✓' : 'Copy'}</button>
          </div>
        </div>
      )}

      {/* Step 1: find user */}
      {!selected && (
        <div style={card}>
          <input
            style={input}
            placeholder="Search name, phone or email…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          {searching && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>Searching…</div>}
          {results.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {results.map(u => (
                <button
                  key={u.id}
                  onClick={() => pick(u)}
                  style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 12, border: '1px solid #f0f0f0', background: '#fafafa', cursor: 'pointer', ...font }}
                >
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    {u.phone}{u.email ? ` · ${u.email}` : ''} · {u.role} · {u.status}
                  </div>
                </button>
              ))}
            </div>
          )}
          {query.trim().length >= 2 && !searching && results.length === 0 && (
            <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 10 }}>No users found</div>
          )}
        </div>
      )}

      {/* Step 2: set password */}
      {selected && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{selected.name}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{selected.phone} · {selected.role} · {selected.status}</div>
            </div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 13 }}>
              Change
            </button>
          </div>

          <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>New password</label>
          <input
            style={{ ...input, marginTop: 6 }}
            type="text"
            placeholder="Leave blank to auto-generate"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          {error && <div style={{ color: '#dc2626', fontSize: 13, marginTop: 10 }}>{error}</div>}

          <button onClick={submit} disabled={busy} style={{ ...btn, marginTop: 14, opacity: busy ? 0.6 : 1 }}>
            {busy ? 'Resetting…' : 'Reset Password'}
          </button>
        </div>
      )}
    </div>
  );
}