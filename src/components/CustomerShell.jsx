'use client';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, ShoppingBag, Bike, User } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

/* Web equivalent of MainShell.dart — only rendered for the customer role,
   so it sits above /home, /orders, /deliveries, /profile in the route tree. */

const TABS = [
  { path: '/home',       label: 'Home',    icon: Home },
  { path: '/orders',     label: 'Orders',  icon: ShoppingBag },
  { path: '/deliveries', label: 'Pick Up', icon: Bike },
  { path: '/profile',    label: 'Profile', icon: User },
];

export default function CustomerShell() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeIndex = TABS.findIndex((t) => location.pathname.startsWith(t.path));
  const showBar = activeIndex !== -1;

  return (
    <>
      <Outlet />
      {showBar && (
        <nav className="fc-tabbar">
          <div className="fc-tabbar__row">
            {TABS.map((tab, i) => {
              const Icon = tab.icon;
              const active = i === activeIndex;
              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className={`fc-tabbar__btn${active ? ' fc-tabbar__btn--active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                >
                  {active && <span className="fc-tabbar__pill" aria-hidden="true" />}
                  <Icon
                    size={21}
                    color={active ? '#0f3d26' : 'rgba(255,255,255,0.75)'}
                    fill={active ? '#f6c453' : 'none'}
                    strokeWidth={active ? 0 : 1.8}
                    style={{ position: 'relative', zIndex: 1 }}
                  />
                  <span className="fc-tabbar__label">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <style>{`
            .fc-tabbar {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              z-index: 50;
              background:
                radial-gradient(circle, rgba(255,255,255,0.12) 1.5px, transparent 1.5px) 0 0 / 22px 22px,
                linear-gradient(135deg, #1B5E3B 0%, #0f3d26 100%);
              box-shadow: 0 -6px 18px rgba(0,0,0,0.14);
              padding-bottom: env(safe-area-inset-bottom, 0px);
            }

            .fc-tabbar__row {
              max-width: 1100px;
              margin: 0 auto;
              display: flex;
            }

            .fc-tabbar__btn {
              position: relative;
              flex: 1;
              background: none;
              border: none;
              cursor: pointer;
              padding: 9px 0 8px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 3px;
              font-family: 'DM Sans', system-ui, sans-serif;
              transition: transform 0.15s ease;
            }

            .fc-tabbar__btn:active {
              transform: scale(0.94);
            }

            .fc-tabbar__btn:focus-visible {
              outline: 2px solid #fff;
              outline-offset: -2px;
              border-radius: 10px;
            }

            .fc-tabbar__pill {
              position: absolute;
              top: 1px;
              width: 38px;
              height: 38px;
              border-radius: 50%;
              background: rgba(246, 196, 83, 0.16);
              animation: fc-tab-pop 0.22s ease both;
            }

            .fc-tabbar__label {
              position: relative;
              z-index: 1;
              font-size: 11px;
              color: rgba(255,255,255,0.75);
              font-weight: 500;
              transition: color 0.15s ease, font-weight 0.15s ease;
            }

            .fc-tabbar__btn--active .fc-tabbar__label {
              color: #f6c453;
              font-weight: 700;
            }

            @keyframes fc-tab-pop {
              from { transform: scale(0.5); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }

            @media (prefers-reduced-motion: reduce) {
              .fc-tabbar__pill { animation: none; }
              .fc-tabbar__btn { transition: none; }
            }
          `}</style>
        </nav>
      )}
    </>
  );
}