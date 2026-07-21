'use client';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, ShoppingBag, Bike, User } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

/* Web equivalent of MainShell.dart — only rendered for the customer role,
   so it sits above /home, /orders, /deliveries, /profile in the route tree. */

const TABS = [
  { path: '/home',       label: 'Home',       icon: Home },
  { path: '/orders',     label: 'Orders',     icon: ShoppingBag },
  { path: '/deliveries', label: 'Deliveries', icon: Bike },
  { path: '/profile',    label: 'Profile',    icon: User },
];

export default function CustomerShell() {
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Only show the bar on the four top-level tabs — not on vendor/cart/checkout/order-detail,
  // same as mobile (those push on top of the shell instead of living inside it).
  const activeIndex = TABS.findIndex((t) => location.pathname.startsWith(t.path));
  const showBar = activeIndex !== -1;

  return (
    <>
      <Outlet />
      {showBar && (
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff',
          borderTop: '1px solid #f0f0f0', display: 'flex', zIndex: 50,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}>
          {TABS.map((tab, i) => {
            const Icon = tab.icon;
            const active = i === activeIndex;
            return (
              <button key={tab.path} onClick={() => navigate(tab.path)} style={{
                flex: 1, background: 'none', border: 'none', cursor: 'pointer', padding: '10px 0 8px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, fontFamily: "'DM Sans', system-ui, sans-serif",
              }}>
                <Icon size={22} color={active ? theme.green : '#9ca3af'} fill={active ? theme.green : 'none'} strokeWidth={active ? 0 : 1.8} />
                <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: active ? theme.green : '#9ca3af' }}>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </>
  );
}