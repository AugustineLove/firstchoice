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

const VB_WIDTH = 1000;
const VB_HEIGHT = 120;
const BUMP_TOP = 0;
const BUMP_BASE = 42;
const BUMP_HALF_WIDTH = 88;

function hillPath(activeIndex, tabCount) {
  const tabWidth = VB_WIDTH / tabCount;
  const cx = (activeIndex + 0.5) * tabWidth;
  const l = cx - BUMP_HALF_WIDTH;
  const r = cx + BUMP_HALF_WIDTH;
  const cLeft = cx - BUMP_HALF_WIDTH / 2;
  const cRight = cx + BUMP_HALF_WIDTH / 2;

  return `M0,${BUMP_BASE} L${l},${BUMP_BASE} C${cLeft},${BUMP_BASE} ${cLeft},${BUMP_TOP} ${cx},${BUMP_TOP} C${cRight},${BUMP_TOP} ${cRight},${BUMP_BASE} ${r},${BUMP_BASE} L${VB_WIDTH},${BUMP_BASE} L${VB_WIDTH},${VB_HEIGHT} L0,${VB_HEIGHT} Z`;
}

export default function CustomerShell() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeIndex = TABS.findIndex((t) => location.pathname.startsWith(t.path));
  const showBar = activeIndex !== -1;
  const ActiveIcon = showBar ? TABS[activeIndex].icon : null;
  const pathData = showBar ? hillPath(activeIndex, TABS.length) : '';

  return (
    <>
      <Outlet />
      {showBar && (
        <nav className="fc-tabbar">
          <svg
            className="fc-tabbar__hill"
            viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="fc-tabbar-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1B5E3B" />
                <stop offset="100%" stopColor="#0f3d26" />
              </linearGradient>
            </defs>
            <path
              d={pathData}
              fill="url(#fc-tabbar-grad)"
              style={{ d: `path("${pathData}")` }}
            />
          </svg>

          <div
            className="fc-tabbar__bubble"
            style={{ left: `${((activeIndex + 0.5) / TABS.length) * 100}%` }}
          >
            <div className="fc-tabbar__bubble-inner">
              {ActiveIcon && <ActiveIcon size={19} color="#0f3d26" strokeWidth={2.2} />}
            </div>
          </div>

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
                  <Icon
                    size={19}
                    color="rgba(255,255,255,0.75)"
                    strokeWidth={1.8}
                    className="fc-tabbar__icon"
                    style={{ opacity: active ? 0 : 1 }}
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
              height: 84px;
              padding-bottom: env(safe-area-inset-bottom, 0px);
            }

            .fc-tabbar__hill {
              position: absolute;
              top: -30px;
              left: 0;
              right: 0;
              width: 100%;
              height: calc(100% + 30px);
              box-shadow: 0 -6px 18px rgba(0,0,0,0.14);
            }

            .fc-tabbar__hill path {
              transition: d 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
            }

            .fc-tabbar__bubble {
              position: absolute;
              top: -30px;
              width: 46px;
              height: 46px;
              transform: translateX(-50%);
              transition: left 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
              z-index: 2;
            }

            .fc-tabbar__bubble-inner {
              width: 100%;
              height: 100%;
              border-radius: 50%;
              background: #f6c453;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 3px 8px rgba(0,0,0,0.22);
              animation: fc-bubble-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
            }

            .fc-tabbar__row {
              position: relative;
              z-index: 1;
              max-width: 1100px;
              margin: 0 auto;
              display: flex;
              height: 100%;
              padding-top: 28px;
            }

            .fc-tabbar__btn {
              position: relative;
              flex: 1;
              background: none;
              border: none;
              cursor: pointer;
              padding: 0;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 5px;
              font-family: 'DM Sans', system-ui, sans-serif;
              transition: transform 0.15s ease;
            }

            .fc-tabbar__btn:active {
              transform: scale(0.94);
            }

            .fc-tabbar__btn:focus-visible {
              outline: 2px solid #fff;
              outline-offset: -2px;
              border-radius: 5px;
            }

            .fc-tabbar__icon {
              transition: opacity 0.2s ease;
            }

            .fc-tabbar__label {
              font-size: 11px;
              color: rgba(255,255,255,0.75);
              font-weight: 500;
              transition: color 0.25s ease, font-weight 0.25s ease;
            }

            .fc-tabbar__btn--active .fc-tabbar__label {
              color: #f6c453;
              font-weight: 700;
            }

            @keyframes fc-bubble-pop {
              0% { transform: scale(0.6); opacity: 0; }
              60% { transform: scale(1.1); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }

            @media (prefers-reduced-motion: reduce) {
              .fc-tabbar__hill path, .fc-tabbar__bubble { transition: none; }
              .fc-tabbar__bubble-inner { animation: none; }
              .fc-tabbar__btn, .fc-tabbar__label { transition: none; }
            }
          `}</style>
        </nav>
      )}
    </>
  );
}