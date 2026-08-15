import { Badge, Loader2, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { fieldStyle } from "../../pages/public/AdminDashboard";

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DURATION_OPTIONS = [
  { label: '30 minutes', minutes: 30 },
  { label: '1 hour', minutes: 60 },
  { label: '2 hours', minutes: 120 },
  { label: '4 hours', minutes: 240 },
];

export function OperatingHoursCard({ authFetch, theme }) {
  const [hours, setHours] = useState(null); // { '0': [{start,end}], ... }
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [duration, setDuration] = useState(120);
  const [overrideBusy, setOverrideBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/operating-status');
      const json = await res.json();
      if (json.success) {
        setStatus(json.data);
        setHours(json.data.hours);
      }
    } catch {}
    setLoading(false);
  }, [authFetch]);

  useEffect(() => { load(); }, [load]);
  // Refresh every 30s so the open/closed badge and countdown stay honest
  useEffect(() => {
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  function updateWindow(day, idx, field, value) {
    setHours(prev => {
      const next = { ...prev };
      const windows = [...(next[day] || [])];
      windows[idx] = { ...windows[idx], [field]: value };
      next[day] = windows;
      return next;
    });
  }

  function addWindow(day) {
    setHours(prev => ({ ...prev, [day]: [...(prev[day] || []), { start: '09:00', end: '17:00' }] }));
  }

  function removeWindow(day, idx) {
    setHours(prev => ({ ...prev, [day]: prev[day].filter((_, i) => i !== idx) }));
  }

  async function saveHours() {
    setSaving(true); setError(null);
    try {
      const res = await authFetch('/admin/operating-hours', { method: 'PATCH', body: JSON.stringify({ hours }) });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Could not save hours');
      load();
    } catch (e) {
      setError(e.message || 'Something went wrong.');
    }
    setSaving(false);
  }

  async function activateOverride() {
    setOverrideBusy(true);
    try {
      await authFetch('/admin/operating-override', { method: 'POST', body: JSON.stringify({ durationMinutes: duration }) });
      load();
    } catch {}
    setOverrideBusy(false);
  }

  async function endOverride() {
    setOverrideBusy(true);
    try {
      await authFetch('/admin/operating-override', { method: 'DELETE' });
      load();
    } catch {}
    setOverrideBusy(false);
  }

  if (loading || !hours) {
    return <div style={{ display:'flex', justifyContent:'center', padding:40 }}><Loader2 size={20} style={{ animation:'spin 1s linear infinite', color: theme.green }}/></div>;
  }

  const minutesLeft = status?.overrideExpiresAt
    ? Math.max(0, Math.round((new Date(status.overrideExpiresAt).getTime() - Date.now()) / 60000))
    : 0;

  return (
    <>
      {/* ── live status + override ── */}
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #f0f0f0', padding:'22px 24px', marginBottom:20, maxWidth:640 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
          <h3 style={{ fontSize:15, fontWeight:800, color:'#0f1117', margin:0 }}>Order acceptance</h3>
          <Badge
            text={status?.open ? (status.overrideActive ? 'Open — override' : 'Open') : 'Closed'}
            color={status?.open ? '#065f46' : '#991b1b'}
            bg={status?.open ? '#d1fae5' : '#fee2e2'}
          />
        </div>
        <p style={{ fontSize:12, color:'#9ca3af', margin:'0 0 16px' }}>
          {status?.overrideActive
            ? `Accepting orders regardless of schedule. Reverts to normal hours in ${minutesLeft} minute${minutesLeft===1?'':'s'}.`
            : status?.open
              ? 'Currently within scheduled operating hours.'
              : `Currently outside operating hours${status?.nextWindow ? ` — reopens today at ${status.nextWindow.start}` : ''}.`}
        </p>

        {status?.overrideActive ? (
          <button onClick={endOverride} disabled={overrideBusy} style={{
            height:38, padding:'0 16px', border:'1px solid #fecaca', borderRadius:8, fontWeight:700, fontSize:13, fontFamily:'inherit',
            background:'#fef2f2', color:'#dc2626', cursor: overrideBusy ? 'default' : 'pointer', display:'flex', alignItems:'center', gap:6,
          }}>
            {overrideBusy ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> : null} End override now
          </button>
        ) : (
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <select value={duration} onChange={e => setDuration(Number(e.target.value))}
              style={{ height:38, padding:'0 10px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:13, outline:'none', background:'#fff', fontFamily:'inherit' }}>
              {DURATION_OPTIONS.map(o => <option key={o.minutes} value={o.minutes}>{o.label}</option>)}
            </select>
            <button onClick={activateOverride} disabled={overrideBusy} style={{
              height:38, padding:'0 16px', border:'none', borderRadius:8, fontWeight:700, fontSize:13, fontFamily:'inherit',
              background: theme.green, color:'#fff', cursor: overrideBusy ? 'default' : 'pointer', display:'flex', alignItems:'center', gap:6,
            }}>
              {overrideBusy ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> : null} Accept orders now
            </button>
          </div>
        )}
      </div>

      {/* ── weekly schedule editor ── */}
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #f0f0f0', padding:'22px 24px', marginBottom:20, maxWidth:640 }}>
        <h3 style={{ fontSize:15, fontWeight:800, color:'#0f1117', margin:'0 0 4px' }}>Operating hours</h3>
        <p style={{ fontSize:12, color:'#9ca3af', margin:'0 0 16px' }}>
          Times are in Ghana time. Add more than one window per day for a lunch/dinner split, like Mon/Wed/Fri here.
        </p>

        {DAY_NAMES.map((name, dayIdx) => {
          const day = String(dayIdx);
          const windows = hours[day] || [];
          return (
            <div key={day} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'10px 0', borderTop: dayIdx>0 ? '1px solid #f3f4f6' : 'none' }}>
              <div style={{ width:90, fontSize:13, fontWeight:700, color:'#374151', paddingTop:8 }}>{name}</div>
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
                {windows.length === 0 && <div style={{ fontSize:12, color:'#9ca3af', paddingTop:8 }}>Closed all day</div>}
                {windows.map((w, idx) => (
                  <div key={idx} style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <input type="time" value={w.start} onChange={e => updateWindow(day, idx, 'start', e.target.value)} style={{ ...fieldStyle, width:110 }}/>
                    <span style={{ color:'#9ca3af', fontSize:12 }}>to</span>
                    <input type="time" value={w.end} onChange={e => updateWindow(day, idx, 'end', e.target.value)} style={{ ...fieldStyle, width:110 }}/>
                    <button onClick={() => removeWindow(day, idx)} style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:6, padding:6, cursor:'pointer', display:'flex' }}>
                      <Trash2 size={12} color="#dc2626"/>
                    </button>
                  </div>
                ))}
                <button onClick={() => addWindow(day)} style={{ alignSelf:'flex-start', fontSize:12, fontWeight:700, color: theme.green, background:'none', border:'none', cursor:'pointer', padding:0, display:'flex', alignItems:'center', gap:4 }}>
                  <Plus size={12}/> Add window
                </button>
              </div>
            </div>
          );
        })}

        {error && <div style={{ background:'#fef2f2', color:'#dc2626', borderRadius:8, padding:'10px 14px', fontSize:13, marginTop:16 }}>{error}</div>}

        <button onClick={saveHours} disabled={saving} style={{
          marginTop:18, height:42, padding:'0 20px', border:'none', borderRadius:10, fontWeight:800, fontSize:13, fontFamily:'inherit',
          background: saving ? '#d1d5db' : theme.green, color:'#fff', cursor: saving ? 'not-allowed' : 'pointer',
          display:'flex', alignItems:'center', gap:8,
        }}>
          {saving ? <><Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> Saving...</> : 'Save Hours'}
        </button>
      </div>
    </>
  );
}