import { Bell, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function NotificationToast({ toast, onOpen, onDismiss }) {
  const { theme } = useTheme();
  if (!toast) return null;

  return (
    <div
      onClick={onOpen}
      style={{
        position: 'fixed', top: 16, right: 16, left: 16, maxWidth: 380, marginLeft: 'auto', zIndex: 1000,
        background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 14,
        display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer',
        fontFamily: "'DM Sans', system-ui, sans-serif", animation: 'fc-toast-in 0.2s ease-out',
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10, background: `${theme.green}18`, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Bell size={18} color={theme.green} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>{toast.title}</div>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{toast.body}</div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', flexShrink: 0 }}
      >
        <X size={16} />
      </button>
      <style>{`@keyframes fc-toast-in{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}