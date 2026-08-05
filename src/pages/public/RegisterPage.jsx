'use client';
import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Eye, EyeOff, Phone, Lock, User, Building2, Bike, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const ROLE_CONFIG = {
  customer: { label:'Customer', icon:'👤', role:'CUSTOMER', color:'#3b82f6', desc:'Order food, pick-up & errands' },
  vendor:   { label:'Vendor',   icon:'🏪', role:'CUSTOMER',  color:'#10b981', desc:'List products & receive orders' },
  rider:    { label:'Rider',    icon:'🏍️', role:'CUSTOMER',  color:'#f59e0b', desc:'Deliver orders & earn money'   },
};

export default function RegisterPage() {
  const { type = 'customer' } = useParams();        // /register, /register/vendor, /register/rider
  const config  = ROLE_CONFIG[type] || ROLE_CONFIG.customer;

  const { register } = useAuth();
  const { theme }    = useTheme();
  const navigate     = useNavigate();

  const [form,    setForm]    = useState({ name:'', phone:'', email:'', password:'', bikeType:'', businessName:'', businessType:'', address:'' });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    try {
      /* Step 1: register user account */
      const user = await register({
        name:     form.name.trim(),
        phone:    form.phone.trim(),
        email:    form.email.trim() || undefined,
        password: form.password,
        role:     config.role,
      });

      /* Step 2: if vendor/rider, create their profile right after */
      // Vendor and rider profile creation happens in their own dashboards
      // after admin approval (vendor) or right away (rider)
      if (type === 'vendor')   navigate('/vendor/onboarding');
      else if (type === 'rider') navigate('/rider/onboarding');
      else                       navigate('/login');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width:'100%', height:48, paddingLeft:42, paddingRight:16,
    border:'1.5px solid #e5e7eb', borderRadius:10,
    fontSize:15, color:'#0f1117', background:'#fff',
    outline:'none', transition:'border-color 0.2s',
    boxSizing:'border-box', fontFamily:'inherit',
  };

  const labelStyle = { display:'block', fontSize:13, fontWeight:700, color:'#374151', marginBottom:7 };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f8faf8', padding:'40px 24px', fontFamily:"'DM Sans', system-ui, sans-serif" }}>
      <div style={{ width:'100%', maxWidth:480, background:'#fff', borderRadius:20, border:'1px solid #e5e7eb', padding:'40px 40px', boxShadow:'0 8px 40px rgba(0,0,0,0.06)' }}>

        {/* BACK */}
        <Link to="/login" style={{ display:'inline-flex', alignItems:'center', gap:6, color:'#6b7280', fontSize:14, fontWeight:600, textDecoration:'none', marginBottom:28 }}>
          <ArrowLeft size={15}/> Back to Login
        </Link>

        {/* ROLE BADGE */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 14px', background:'#f3f4f6', borderRadius:50, fontSize:13, fontWeight:700, color:'#374151', marginBottom:20 }}>
          <span>{config.icon}</span> {config.label} Account
        </div>

        <h1 style={{ fontSize:26, fontWeight:900, color:'#0f1117', letterSpacing:'-0.6px', marginBottom:6 }}>Create your account</h1>
        <p style={{ color:'#6b7280', fontSize:14, marginBottom:32 }}>{config.desc}</p>

        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'12px 16px', marginBottom:20, color:'#dc2626', fontSize:14, fontWeight:500, display:'flex', alignItems:'center', gap:8 }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* NAME */}
          <div>
            <label style={labelStyle}>Full Name</label>
            <div style={{ position:'relative' }}>
              <User size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }}/>
              <input type="text" placeholder="Augustine Love" value={form.name} onChange={set('name')} required style={inputStyle}
                onFocus={e => e.target.style.borderColor = theme.green}
                onBlur={e  => e.target.style.borderColor = '#e5e7eb'} />
            </div>
          </div>

          {/* PHONE */}
          <div>
            <label style={labelStyle}>Phone Number</label>
            <div style={{ position:'relative' }}>
              <Phone size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }}/>
              <input type="tel" placeholder="0241234567" value={form.phone} onChange={set('phone')} required style={inputStyle}
                onFocus={e => e.target.style.borderColor = theme.green}
                onBlur={e  => e.target.style.borderColor = '#e5e7eb'} />
            </div>
          </div>

          {/* EMAIL (optional) */}
          <div>
            {/* <label style={labelStyle}>Email <span style={{ fontWeight:400, color:'#9ca3af' }}>(optional)</span></label> */}
            <label style={labelStyle}>Email</label>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#9ca3af', fontSize:15 }}>@</span>
              <input type="email" placeholder="kofi@example.com" value={form.email} onChange={set('email')} style={inputStyle}
                onFocus={e => e.target.style.borderColor = theme.green}
                onBlur={e  => e.target.style.borderColor = '#e5e7eb'} />
            </div>
          </div>

          {/* VENDOR EXTRA FIELDS */}
          {type === 'vendor' && <>
            <div>
              <label style={labelStyle}>Business Name</label>
              <div style={{ position:'relative' }}>
                <Building2 size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }}/>
                <input type="text" placeholder="Akosua Kitchen" value={form.businessName} onChange={set('businessName')} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = theme.green}
                  onBlur={e  => e.target.style.borderColor = '#e5e7eb'} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Business Type</label>
              <select value={form.businessType} onChange={set('businessType')} style={{ ...inputStyle, paddingLeft:16, appearance:'none' }}
                onFocus={e => e.target.style.borderColor = theme.green}
                onBlur={e  => e.target.style.borderColor = '#e5e7eb'}>
                <option value="">Select type...</option>
                {['Food','Grocery','Pharmacy','Boutique','Electronics','Other'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </>}

          {/* RIDER EXTRA FIELDS */}
          {type === 'rider' && (
            <div>
              <label style={labelStyle}>Bike Type</label>
              <div style={{ position:'relative' }}>
                <Bike size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }}/>
                <select value={form.bikeType} onChange={set('bikeType')} style={{ ...inputStyle, paddingLeft:42, appearance:'none' }}
                  onFocus={e => e.target.style.borderColor = theme.green}
                  onBlur={e  => e.target.style.borderColor = '#e5e7eb'}>
                  <option value="">Select bike type...</option>
                  {['Motorcycle','Bicycle','Tricycle'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* PASSWORD */}
          <div>
            <label style={labelStyle}>Password</label>
            <div style={{ position:'relative' }}>
              <Lock size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }}/>
              <input type={showPw ? 'text':'password'} placeholder="Min. 6 characters" value={form.password} onChange={set('password')} required style={{ ...inputStyle, paddingRight:48 }}
                onFocus={e => e.target.style.borderColor = theme.green}
                onBlur={e  => e.target.style.borderColor = '#e5e7eb'} />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:0 }}>
                {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>

          {/* VENDOR NOTICE */}
          {type === 'vendor' && (
            <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:10, padding:'12px 16px', fontSize:13, color:'#92400e', display:'flex', gap:8 }}>
              <span>ℹ️</span>
              <span>Your vendor account will be reviewed and approved by our team before going live.</span>
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width:'100%', height:50, borderRadius:10, border:'none', marginTop:4,
            background: loading ? '#9ca3af' : `linear-gradient(135deg, ${theme.green}, ${theme.greenMid})`,
            color:'#fff', fontSize:15, fontWeight:700,
            cursor: loading ? 'not-allowed' : 'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            transition:'all 0.2s', fontFamily:'inherit',
          }}>
            {loading
              ? <><Loader2 size={18} style={{ animation:'spin 1s linear infinite' }}/> Creating account...</>
              : <>Create Account <ArrowRight size={16}/></>
            }
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:24, fontSize:14, color:'#6b7280' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: theme.green, fontWeight:700, textDecoration:'none' }}>Sign in</Link>
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}