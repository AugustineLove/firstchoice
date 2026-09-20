'use client';
import { useState, useEffect, useRef } from 'react';
import { Bell, ShoppingBag, Truck, UserCheck, Radio } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

const MAX_NOTIFICATIONS = 50;

function timeAgo(date) {
  const diffSec = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

/*
  Maps each admin:* socket event (emitted via notifyAdmins() in
  socket.manager.ts) to how it should render in the feed and which
  dashboard section clicking it should jump to. Add new events here —
  nothing else needs to change to pick them up.
*/
const EVENT_CONFIG = {
  'admin:order_ready_for_dispatch': {
    icon: ShoppingBag, color: '#7c3aed', section: 'orders',
    build: (d) => ({ title: 'New order needs dispatch', body: `Order #${d.orderId?.slice(-6).toUpperCase() || ''}` }),
  },
  'admin:order_update': {
    icon: ShoppingBag, color: '#3b82f6', section: 'orders',
    build: (d) => ({ title: `Order ${(d.status || '').replace(/_/g, ' ')}`, body: `#${d.orderId?.slice(-6).toUpperCase() || ''}` }),
  },
  'admin:new_delivery': {
    icon: Truck, color: '#0369a1', section: 'deliveries',
    build: (d) => ({
      title: d.type === 'ERRAND' ? 'New errand request' : 'New delivery request',
      body: `${d.pickupAddress || ''} → ${d.destinationAddress || ''}`,
    }),
  },
  'admin:delivery_update': {
    icon: Truck, color: '#0ea5e9', section: 'deliveries',
    build: (d) => ({ title: `Delivery ${(d.status || '').replace(/_/g, ' ')}`, body: `#${d.deliveryId?.slice(-6).toUpperCase() || ''}` }),
  },
  'admin:delivery_accepted': {
    icon: UserCheck, color: '#16a34a', section: 'deliveries',
    build: (d) => ({ title: 'Rider accepted delivery', body: `${d.riderName ? d.riderName + ' · ' : ''}#${d.deliveryId?.slice(-6).toUpperCase() || ''}` }),
  },
  'admin:delivery_assigned': {
    icon: UserCheck, color: '#16a34a', section: 'deliveries',
    build: (d) => ({
      title: d.reassigned ? 'Delivery reassigned' : 'Delivery assigned',
      body: `${d.riderName ? d.riderName + ' · ' : ''}#${d.deliveryId?.slice(-6).toUpperCase() || ''}`,
    }),
  },
  'admin:delivery_status_changed': {
    icon: Radio, color: '#f59e0b', section: 'deliveries',
    build: (d) => ({ title: `Delivery status → ${(d.status || '').replace(/_/g, ' ')}`, body: `#${d.deliveryId?.slice(-6).toUpperCase() || ''} (admin override)` }),
  },
};

export function NotificationBell({ onNavigate }) {
  const { on, connected } = useSocket();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const unsubs = Object.entries(EVENT_CONFIG).map(([event, cfg]) =>
      on(event, (data) => {
        const { title, body } = cfg.build(data || {});
        setItems((prev) => [
          {
            id: `${event}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            title, body,
            section: cfg.section, icon: cfg.icon, color: cfg.color,
            timestamp: data?.timestamp || data?.createdAt || new Date(),
            read: false,
          },
          ...prev,
        ].slice(0, MAX_NOTIFICATIONS));
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [on]);

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const unreadCount = items.filter((i) => !i.read).length;

  function markAllRead() {
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
  }

  function clearAll() {
    setItems([]);
  }

  function handleClick(item) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, read: true } : i)));
    onNavigate?.(item.section);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        onClick={() => { setOpen((o) => !o); if (!open) markAllRead(); }}
        style={{ position: 'relative', width: 38, height: 38, borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, background: '#dc2626', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {!connected && (
          <span title="Reconnecting…" style={{ position: 'absolute', bottom: -2, right: -2, width: 8, height: 8, borderRadius: '50%', background: '#d1d5db', border: '1.5px solid #fff' }} />
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', top: '110%', right: 0, width: 340, maxHeight: 420, background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', boxShadow: '0 12px 32px rgba(0,0,0,0.12)', zIndex: 200, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ fontWeight: 800, fontSize: 13, color: '#0f1117' }}>Notifications</span>
            {items.length > 0 && (
              <button onClick={clearAll} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>Clear all</button>
            )}
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {items.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                {connected ? 'No activity yet' : 'Connecting…'}
              </div>
            ) : items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleClick(item)}
                  style={{ display: 'flex', gap: 10, width: '100%', textAlign: 'left', padding: '11px 14px', border: 'none', borderBottom: '1px solid #f9fafb', background: item.read ? '#fff' : '#f8fafc', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: `${item.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={14} color={item.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f1117' }}>{item.title}</div>
                    <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.body}</div>
                  </div>
                  <div style={{ fontSize: 10, color: '#c4c9d1', flexShrink: 0, whiteSpace: 'nowrap' }}>{timeAgo(item.timestamp)}</div>
                  {!item.read && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3b82f6', flexShrink: 0, marginTop: 4 }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}