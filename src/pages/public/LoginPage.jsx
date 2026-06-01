'use client';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Phone, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function LoginPage() {
  const { login }    = useAuth();
  const { theme }    = useTheme();
  const navigate     = useNavigate();

  const [phone,    setPhone]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(phone.trim(), password);
      /* Route by role */
      if (user.role === 'ADMIN')    navigate('/admin/dashboard');
      else if (user.role === 'VENDOR') navigate('/vendor/dashboard');
      else if (user.role === 'RIDER')  navigate('/rider/dashboard');
      else                             navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: '#f8faf8',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>

      {/* ── LEFT PANEL ── */}
      <div style={{
        flex: '0 0 480px',
        background: `linear-gradient(145deg, ${theme.green} 0%, ${theme.greenMid} 100%)`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px 52px',
        position: 'relative',
        overflow: 'hidden',
      }} className="login-left">

        {/* BG CIRCLES */}
        <div style={{ position:'absolute', top:-80, right:-80, width:320, height:320, borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-60, left:-60, width:280, height:280, borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:'40%', right:'-10%', width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }} />

        {/* LOGO */}
        <div>
          <Link to="/" style={{ textDecoration:'none', display:'inline-flex', alignItems:'center', gap:12 }}>
            <div style={{
              width:48, height:48, borderRadius:14, background:'rgba(255,255,255,0.18)',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'#fff', fontSize:20, fontWeight:900,
              backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.2)',
            }}>F</div>
            <span style={{ color:'#fff', fontSize:22, fontWeight:800, letterSpacing:'-0.5px' }}>FirstChoice</span>
          </Link>
        </div>

        {/* MIDDLE TEXT */}
        <div>
          <h2 style={{ color:'#fff', fontSize:36, fontWeight:900, lineHeight:1.15, marginBottom:16, letterSpacing:'-1px' }}>
            Your city's<br/>commerce hub
          </h2>
          <p style={{ color:'rgba(255,255,255,0.72)', fontSize:16, lineHeight:1.7, maxWidth:320 }}>
            Manage orders, deliveries, and your entire operation — all in one place.
          </p>

          {/* STATS */}
          <div style={{ display:'flex', gap:32, marginTop:40 }}>
            {[['50+','Vendors'],['200+','Deliveries'],['98%','Satisfaction']].map(([v,l]) => (
              <div key={l}>
                <div style={{ color:'#fff', fontSize:22, fontWeight:900 }}>{v}</div>
                <div style={{ color:'rgba(255,255,255,0.6)', fontSize:12, marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM CARD */}
        <div style={{
          background:'rgba(255,255,255,0.12)',
          backdropFilter:'blur(12px)',
          border:'1px solid rgba(255,255,255,0.18)',
          borderRadius:16,
          padding:'18px 22px',
          display:'flex', alignItems:'center', gap:14,
        }}>
          <div style={{ width:40, height:40, borderRadius:10, background:'rgba(255,255,255,0.18)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🛵</div>
          <div>
            <div style={{ color:'#fff', fontWeight:700, fontSize:13 }}>Live in Agona Nkwanta</div>
            <div style={{ color:'rgba(255,255,255,0.6)', fontSize:12 }}>Platform is active and running</div>
          </div>
          <div style={{ marginLeft:'auto', width:8, height:8, borderRadius:'50%', background:'#4ade80', boxShadow:'0 0 0 3px rgba(74,222,128,0.3)' }} />
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{
        flex:1,
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        padding:'40px 24px',
      }}>
        <div style={{ width:'100%', maxWidth:420 }}>

          {/* HEADER */}
          <div style={{ marginBottom:40 }}>
            <h1 style={{ fontSize:30, fontWeight:900, color:'#0f1117', letterSpacing:'-0.8px', marginBottom:8 }}>
              Welcome back
            </h1>
            <p style={{ color:'#6b7280', fontSize:15 }}>
              Sign in to your FirstChoice account
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit}>

            {/* ERROR */}
            {error && (
              <div style={{
                background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10,
                padding:'12px 16px', marginBottom:20,
                color:'#dc2626', fontSize:14, fontWeight:500,
                display:'flex', alignItems:'center', gap:8,
              }}>
                <span>⚠️</span> {error}
              </div>
            )}

            {/* PHONE */}
            <div style={{ marginBottom:18 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:700, color:'#374151', marginBottom:7 }}>
                Phone Number
              </label>
              <div style={{ position:'relative' }}>
                <Phone size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }} />
                <input
                  type="tel"
                  placeholder="0241234567"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  style={{
                    width:'100%', height:48, paddingLeft:42, paddingRight:16,
                    border:'1.5px solid #e5e7eb', borderRadius:10,
                    fontSize:15, color:'#0f1117', background:'#fff',
                    outline:'none', transition:'border-color 0.2s',
                    boxSizing:'border-box',
                    fontFamily:'inherit',
                  }}
                  onFocus={e => e.target.style.borderColor = theme.green}
                  onBlur={e  => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div style={{ marginBottom:28 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:700, color:'#374151', marginBottom:7 }}>
                Password
              </label>
              <div style={{ position:'relative' }}>
                <Lock size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }} />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{
                    width:'100%', height:48, paddingLeft:42, paddingRight:48,
                    border:'1.5px solid #e5e7eb', borderRadius:10,
                    fontSize:15, color:'#0f1117', background:'#fff',
                    outline:'none', transition:'border-color 0.2s',
                    boxSizing:'border-box',
                    fontFamily:'inherit',
                  }}
                  onFocus={e => e.target.style.borderColor = theme.green}
                  onBlur={e  => e.target.style.borderColor = '#e5e7eb'}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:0 }}
                >
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width:'100%', height:50, borderRadius:10, border:'none',
                background: loading ? '#9ca3af' : `linear-gradient(135deg, ${theme.green}, ${theme.greenMid})`,
                color:'#fff', fontSize:15, fontWeight:700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                transition:'all 0.2s', fontFamily:'inherit',
              }}
            >
              {loading
                ? <><Loader2 size={18} style={{ animation:'spin 1s linear infinite' }}/> Signing in...</>
                : <>Sign In <ArrowRight size={16}/></>
              }
            </button>
          </form>

          {/* DIVIDER */}
          <div style={{ display:'flex', alignItems:'center', gap:12, margin:'28px 0' }}>
            <div style={{ flex:1, height:1, background:'#e5e7eb' }}/>
            <span style={{ color:'#9ca3af', fontSize:13 }}>New to FirstChoice?</span>
            <div style={{ flex:1, height:1, background:'#e5e7eb' }}/>
          </div>

          {/* REGISTER LINKS */}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <Link to="/register/vendor" style={{
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              height:46, border:`1.5px solid ${theme.border}`, borderRadius:10,
              color:'#374151', fontSize:14, fontWeight:600, textDecoration:'none',
              transition:'all 0.2s', background:'#fff',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = theme.green; e.currentTarget.style.color = theme.green; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = '#374151'; }}
            >
              🏪 Register as a Vendor
            </Link>
            <Link to="/register/rider" style={{
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              height:46, border:`1.5px solid ${theme.border}`, borderRadius:10,
              color:'#374151', fontSize:14, fontWeight:600, textDecoration:'none',
              transition:'all 0.2s', background:'#fff',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = theme.green; e.currentTarget.style.color = theme.green; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = '#374151'; }}
            >
              🏍️ Register as a Rider
            </Link>
            <Link to="/register" style={{
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              height:46, border:`1.5px solid ${theme.border}`, borderRadius:10,
              color:'#374151', fontSize:14, fontWeight:600, textDecoration:'none',
              transition:'all 0.2s', background:'#fff',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = theme.green; e.currentTarget.style.color = theme.green; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = '#374151'; }}
            >
              👤 Register as a Customer
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 820px) { .login-left { display: none !important; } }
      `}</style>
    </div>
  );
}