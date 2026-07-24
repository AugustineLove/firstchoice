'use client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Bike, Bell, LogOut, ChevronRight, Phone, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme } = useTheme();

  return (
    <div style={{ minHeight: '100vh', background: '#f8faf8', fontFamily: "'DM Sans', system-ui, sans-serif", paddingBottom: 88 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><ArrowLeft size={20} /></button>
          <span style={{ fontWeight: 800, fontSize: 16 }}>Profile</span>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: 20 }}>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', padding: 20, textAlign: 'center', marginBottom: 16 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', background: `${theme.green}18`, color: theme.green,
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 24, fontWeight: 900,
          }}>{user?.name?.[0]?.toUpperCase() || 'U'}</div>
          <div style={{ fontWeight: 800, fontSize: 17 }}>{user?.name}</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 10 }}>
            {user?.phone && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6b7280' }}><Phone size={12} />{user.phone}</span>}
            {user?.email && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6b7280' }}><Mail size={12} />{user.email}</span>}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', overflow: 'hidden', marginBottom: 16 }}>
          <MenuRow icon={<ShoppingBag size={17} color={theme.green} />} label="My Orders" onClick={() => navigate('/orders')} />
          <MenuRow icon={<Bike size={17} color={theme.green} />} label="My Deliveries" onClick={() => navigate('/deliveries')} />
          <MenuRow icon={<Bell size={17} color={theme.green} />} label="Notifications" onClick={() => navigate('/notifications')} last />
          <a href={`https://whatsapp.com/channel/0029VbDE8FF6GcGDW0NETC39`} style={{
                padding: 10, background: theme.green, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
              }}>Tap to follow our WhatsApp channel</a>
        </div>

        <button onClick={() => { logout(); navigate('/login'); }} style={{
          width: '100%', height: 48, borderRadius: 12, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626',
          fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <LogOut size={16} /> Log Out
        </button>
      </div>
    </div>
  );
}

function MenuRow({ icon, label, onClick, last }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '15px 16px', cursor: 'pointer',
      borderBottom: last ? 'none' : '1px solid #f0f0f0',
    }}>
      {icon}
      <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: '#0f1117' }}>{label}</span>
      <ChevronRight size={16} color="#d1d5db" />
    </div>
  );
}