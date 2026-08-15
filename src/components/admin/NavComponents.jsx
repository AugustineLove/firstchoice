import { useState } from "react";
import { fieldStyle, FormField } from "../../pages/public/AdminDashboard";
import { Loader2 } from "lucide-react";

export function BroadcastSection({ authFetch, theme }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState(''); // '' = everyone
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
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize:22, fontWeight:900, color:'#0f1117', margin:0 }}>Broadcast</h2>
        <p style={{ color:'#6b7280', fontSize:14, margin:'4px 0 0' }}>Send a push notification to your users</p>
      </div>

      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #f0f0f0', padding:'22px 24px', maxWidth:560 }}>
        <FormField label="Audience">
          <select style={fieldStyle} value={audience} onChange={e => setAudience(e.target.value)}>
            <option value="">Everyone</option>
            <option value="CUSTOMER">Customers only</option>
            <option value="VENDOR">Vendors only</option>
            <option value="RIDER">Riders only</option>
          </select>
        </FormField>

        <FormField label="Title">
          <input style={fieldStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. We miss you!" maxLength={60}/>
        </FormField>

        <FormField label="Message">
          <textarea
            value={message} onChange={e => setMessage(e.target.value)}
            placeholder="e.g. Make an order today, let's get it delivered!"
            maxLength={180}
            style={{ width:'100%', minHeight:90, border:'1.5px solid #e5e7eb', borderRadius:8, padding:'10px 12px', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit', resize:'vertical' }}
          />
          <div style={{ fontSize:11, color:'#9ca3af', marginTop:4, textAlign:'right' }}>{message.length}/180</div>
        </FormField>

        <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
          {QUICK_TEMPLATES.map((t,i) => (
            <button key={i} type="button" onClick={() => { setTitle(t.title); setMessage(t.body); }}
              style={{ fontSize:11, fontWeight:600, padding:'6px 10px', borderRadius:20, border:'1px solid #e5e7eb', background:'#f9fafb', color:'#374151', cursor:'pointer', fontFamily:'inherit' }}>
              {t.title}
            </button>
          ))}
        </div>

        {error && <div style={{ background:'#fef2f2', color:'#dc2626', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:14 }}>{error}</div>}
        {result && <div style={{ background:'#f0fdf4', color:'#16a34a', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:14 }}>Sent to {result.total} user{result.total===1?'':'s'}.</div>}

        <button onClick={send} disabled={sending || !title.trim() || !message.trim()} style={{
          height:44, padding:'0 22px', border:'none', borderRadius:10, fontWeight:800, fontSize:14, fontFamily:'inherit',
          background: (sending || !title.trim() || !message.trim()) ? '#d1d5db' : theme.green, color:'#fff',
          cursor: (sending || !title.trim() || !message.trim()) ? 'not-allowed' : 'pointer',
          display:'flex', alignItems:'center', gap:8,
        }}>
          {sending ? <><Loader2 size={16} style={{ animation:'spin 1s linear infinite' }}/> Sending...</> : 'Send Broadcast'}
        </button>
      </div>
    </div>
  );
}