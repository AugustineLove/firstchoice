'use client';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Truck, ClipboardList, ArrowRight, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const SERVICES = [
  {
    icon: <ShoppingBag size={26}/>,
    color: '#8b5cf6',
    bg: '#ede9fe',
    label: 'Order Food & Goods',
    desc: 'Browse vendors and order from local shops',
    action: '/shop',
  },
  {
    icon: <Truck size={26}/>,
    color: '#3b82f6',
    bg: '#dbeafe',
    label: 'Request a Delivery',
    desc: 'Send packages across town, fast',
    action: '/delivery',
  },
  {
    icon: <ClipboardList size={26}/>,
    color: '#f59e0b',
    bg: '#fef3c7',
    label: 'Run an Errand',
    desc: 'We pick up and bring back what you need',
    action: '/errand',
  },
];

export default function CustomerHome() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate  = useNavigate();

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div style={{
      minHeight: '100vh', background: '#f8faf8',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 520 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: `${theme.green}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: theme.green }}>
            <User size={28}/>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f1117', margin: '0 0 8px', letterSpacing: '-0.6px' }}>
            Welcome, {firstName}! 👋
          </h1>
          <p style={{ color: '#6b7280', fontSize: 15, margin: 0 }}>What would you like to do today?</p>
        </div>

        {/* Service Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
          {SERVICES.map(s => (
            <button key={s.label} onClick={() => navigate(s.action)}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '18px 20px', borderRadius: 14,
                border: '1px solid #f0f0f0', background: '#fff',
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = s.color + '50'; e.currentTarget.style.boxShadow = `0 4px 20px ${s.color}18`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0f0f0'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)'; }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
                {s.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#0f1117', marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: 13, color: '#9ca3af' }}>{s.desc}</div>
              </div>
              <ArrowRight size={18} style={{ color: '#d1d5db', flexShrink: 0 }}/>
            </button>
          ))}
        </div>

        {/* Quick stats / promo */}
        <div style={{ background: `linear-gradient(135deg, ${theme.green}, ${theme.greenMid})`, borderRadius: 14, padding: '20px 24px', color: '#fff', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 32 }}>🛵</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 3 }}>Riders are online now</div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>Average delivery in Agona Nkwanta: ~20 min</div>
          </div>
        </div>

        {/* Account link */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button onClick={() => navigate('/account')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 13, fontFamily: 'inherit' }}>
            View your account & order history →
          </button>
        </div>
      </div>
    </div>
  );
}