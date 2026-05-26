'use client';

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { themes, useTheme } from '../context/ThemeContext';

const NAV_LINKS = [
  { label: 'How it Works', href: '#how' },
  { label: 'Services', href: '#services' },
  { label: 'Partners', href: '#partners' },
  { label: 'About', href: '#about' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const { theme, themeName, setTheme } = useTheme();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  /* =========================
     SCROLL EFFECT
  ========================= */
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* =========================
     NAVIGATION
  ========================= */
  const handleNavClick = (href) => {
    setMobileOpen(false);

    // ROUTES
    if (!href.startsWith('#')) {
      navigate(href);
      return;
    }

    // SAME PAGE SCROLL
    const target = document.querySelector(href);

    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
      });
    } else {
      // IF SECTION NOT FOUND
      navigate(`/${href}`);

      setTimeout(() => {
        document.querySelector(href)?.scrollIntoView({
          behavior: 'smooth',
        });
      }, 120);
    }
  };

  return (
    <>
      {/* =========================
          NAVBAR
      ========================= */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          height: 72,
          display: 'flex',
          alignItems: 'center',
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(18px)',
          background: scrolled
            ? 'rgba(255,255,255,0.82)'
            : 'rgba(255,255,255,0.65)',
          borderBottom: `1px solid ${theme.border}`,
          // boxShadow: scrolled
          //   ? '0 8px 30px rgba(0,0,0,0.06)'
          //   : 'none',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* =========================
              LOGO
          ========================= */}
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: theme.green,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: 18,
                // boxShadow: `0 8px 20px ${theme.green}40`,
              }}
            >
              F
            </div>

            <span
              style={{
                fontSize: 19,
                fontWeight: 800,
                color: theme.dark,
              }}
            >
              First
              <span style={{ color: theme.greenLight }}>
                Choice
              </span>
            </span>
          </Link>

          {/* =========================
              DESKTOP LINKS
          ========================= */}
          <ul className="desktop-links">
            {NAV_LINKS.map((item) => (
              <li key={item.label}>
                <button
                  onClick={() => handleNavClick(item.href)}
                  className="nav-link"
                  style={{
                    color: theme.muted,
                  }}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>

          {/* =========================
              RIGHT ACTIONS
          ========================= */}
          <div className="desktop-actions">
            {/* THEME SWITCHER */}
            <div className="theme-switcher">
              {Object.keys(themes).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    border:
                      themeName === t
                        ? `2px solid ${theme.dark}`
                        : '2px solid transparent',
                    background: themes[t].green,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    transform:
                      themeName === t
                        ? 'scale(1.15)'
                        : 'scale(1)',
                  }}
                />
              ))}
            </div>

            {/* LOGIN */}
            <button
              onClick={() => navigate('/admin')}
              className="login-btn"
            >
              Login
            </button>

            {/* CTA */}
            <button className="cta-btn">
              Get Started
            </button>
          </div>

          {/* =========================
              MOBILE TOGGLE
          ========================= */}
          <button
            className="mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X size={26} />
            ) : (
              <Menu size={26} />
            )}
          </button>
        </div>
      </nav>

      {/* =========================
          MOBILE MENU
      ========================= */}
      <div
        className={`mobile-menu ${
          mobileOpen ? 'open' : ''
        }`}
      >
        <div className="mobile-menu-content">
          {NAV_LINKS.map((item) => (
            <button
              key={item.label}
              onClick={() =>
                handleNavClick(item.href)
              }
              className="mobile-link"
            >
              {item.label}
            </button>
          ))}

          <button
            className="mobile-login"
            onClick={() => {
              setMobileOpen(false);
              navigate('/admin');
            }}
          >
            Login
          </button>

          <button className="mobile-cta">
            Get Started
          </button>
        </div>
      </div>

      {/* =========================
          STYLES
      ========================= */}
      <style>{`
        .desktop-links {
          display: flex;
          align-items: center;
          gap: 28px;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .nav-link {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: 0.25s ease;
          font-family: inherit;
        }

        .nav-link:hover {
          color: ${theme.green};
          transform: translateY(-1px);
        }

        .desktop-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .theme-switcher {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-right: 6px;
        }

        .login-btn {
          height: 42px;
          padding: 0 18px;
          border-radius: 10px;
          border: 1.5px solid ${theme.green};
          background: transparent;
          color: ${theme.green};
          font-weight: 600;
          cursor: pointer;
          transition: 0.25s ease;
        }

        .login-btn:hover {
          background: ${theme.greenPale};
        }

        .cta-btn {
          height: 42px;
          padding: 0 20px;
          border: none;
          border-radius: 10px;
          background: ${theme.green};
          color: white;
          font-weight: 700;
          cursor: pointer;
          transition: 0.25s ease;
        }

        .cta-btn:hover {
          transform: translateY(-2px);
          background: ${theme.greenMid};
        }

        .mobile-toggle {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          color: ${theme.dark};
        }

        .mobile-menu {
          position: fixed;
          inset: 0;
          z-index: 999;
          background: rgba(255,255,255,0.96);
          backdrop-filter: blur(18px);
          transform: translateY(-100%);
          opacity: 0;
          pointer-events: none;
          transition: all 0.35s ease;
        }

        .mobile-menu.open {
          transform: translateY(0);
          opacity: 1;
          pointer-events: auto;
        }

        .mobile-menu-content {
          padding: 100px 24px 40px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .mobile-link {
          background: none;
          border: none;
          text-align: left;
          padding: 16px 0;
          font-size: 20px;
          font-weight: 700;
          border-bottom: 1px solid ${theme.border};
          color: ${theme.dark};
          cursor: pointer;
        }

        .mobile-login,
        .mobile-cta {
          margin-top: 14px;
          height: 50px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
        }

        .mobile-login {
          border: 1.5px solid ${theme.green};
          background: transparent;
          color: ${theme.green};
        }

        .mobile-cta {
          border: none;
          background: ${theme.green};
          color: white;
        }

        /* =========================
           RESPONSIVE
        ========================= */
        @media (max-width: 900px) {
          .desktop-links,
          .desktop-actions {
            display: none;
          }

          .mobile-toggle {
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
}