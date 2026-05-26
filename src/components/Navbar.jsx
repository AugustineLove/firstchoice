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
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);

    return () =>
      window.removeEventListener(
        'scroll',
        handleScroll
      );
  }, []);

  /* =========================
      NAVIGATION
  ========================= */
  const handleNavClick = (href) => {
    setMobileOpen(false);

    // ROUTE
    if (!href.startsWith('#')) {
      navigate(href);
      return;
    }

    // SAME PAGE
    const target = document.querySelector(href);

    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    } else {
      // GO HOME FIRST
      navigate(`/${href}`);

      setTimeout(() => {
        document
          .querySelector(href)
          ?.scrollIntoView({
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
          height: 78,
          display: 'flex',
          alignItems: 'center',
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(18px)',
          background: scrolled
            ? 'rgba(255,255,255,0.82)'
            : 'rgba(255,255,255,0.55)',
          borderBottom: `1px solid ${theme.border}`,
          boxShadow: scrolled
            ? '0 10px 40px rgba(0,0,0,0.05)'
            : 'none',
        }}
      >
        <div className="nav-container">
          {/* =========================
              LOGO
          ========================= */}
          <Link
            to="/"
            className="logo-wrapper"
          >
            <div
              className="logo-icon"
              style={{
                background: `linear-gradient(135deg, ${theme.green}, ${theme.greenMid})`,
              }}
            >
              F
            </div>

            <div className="logo-text">
              <span
                style={{
                  color: theme.dark,
                }}
              >
                First
              </span>

              <span
                style={{
                  color: theme.greenLight,
                }}
              >
                Choice
              </span>
            </div>
          </Link>

          {/* =========================
              DESKTOP LINKS
          ========================= */}
          <ul className="desktop-links">
            {NAV_LINKS.map((item) => (
              <li key={item.label}>
                <button
                  className="nav-link"
                  onClick={() =>
                    handleNavClick(item.href)
                  }
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
              DESKTOP ACTIONS
          ========================= */}
          <div className="desktop-actions">
            {/* THEME SWITCHER */}
            <div className="theme-switcher">
              {Object.keys(themes).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className="theme-dot"
                  style={{
                    background:
                      themes[t].green,
                    outline:
                      themeName === t
                        ? `2px solid ${theme.dark}`
                        : 'none',
                  }}
                />
              ))}
            </div>

            {/* LOGIN */}
            <button
              className="login-btn"
              onClick={() =>
                navigate('/admin')
              }
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
            onClick={() =>
              setMobileOpen(!mobileOpen)
            }
            aria-label="Toggle Menu"
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
        className={`mobile-overlay ${
          mobileOpen ? 'open' : ''
        }`}
      >
        <div
          className="mobile-menu"
          style={{
            background:
              themeName === 'dark'
                ? '#101114'
                : 'rgba(255,255,255,0.88)',
          }}
        >
          {/* MOBILE HEADER */}
          <div className="mobile-top">
            <div className="mobile-logo">
              FirstChoice
            </div>

            <button
              className="mobile-close"
              onClick={() =>
                setMobileOpen(false)
              }
            >
              <X size={24} />
            </button>
          </div>

          {/* MOBILE LINKS */}
          <div className="mobile-links">
            {NAV_LINKS.map((item) => (
              <button
                key={item.label}
                className="mobile-link"
                onClick={() =>
                  handleNavClick(item.href)
                }
                style={{
                  color: theme.dark,
                  borderBottom: `1px solid ${theme.border}`,
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* MOBILE THEME SWITCHER */}
          <div className="mobile-theme-wrapper">
            <div className="mobile-theme-title">
              Choose Theme
            </div>

            <div className="mobile-theme-switcher">
              {Object.keys(themes).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`mobile-theme-btn ${
                    themeName === t
                      ? 'active-theme'
                      : ''
                  }`}
                  style={{
                    background:
                      themes[t].green,
                  }}
                >
                  {themeName === t && (
                    <div className="theme-active-ring" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* MOBILE ACTIONS */}
          <div className="mobile-actions">
            <button
              className="mobile-login-btn"
              onClick={() => {
                setMobileOpen(false);
                navigate('/admin');
              }}
            >
              Login
            </button>

            <button className="mobile-cta-btn">
              Get Started
            </button>
          </div>
        </div>
      </div>

      {/* =========================
          STYLES
      ========================= */}
      <style>{`
        * {
          box-sizing: border-box;
        }

        .nav-container {
          width: 100%;
          max-width: 1220px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        /* =========================
            LOGO
        ========================= */
        .logo-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
        }

        .logo-icon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 18px;
          font-weight: 800;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
        }

        .logo-text {
          display: flex;
          align-items: center;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        /* =========================
            DESKTOP LINKS
        ========================= */
        .desktop-links {
          display: flex;
          align-items: center;
          gap: 32px;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .nav-link {
          border: none;
          background: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.25s ease;
          position: relative;
          font-family: inherit;
        }

        .nav-link:hover {
          color: ${theme.green};
          transform: translateY(-1px);
        }

        /* =========================
            ACTIONS
        ========================= */
        .desktop-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .theme-switcher {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-right: 8px;
        }

        .theme-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          transition: 0.25s ease;
        }

        .theme-dot:hover {
          transform: scale(1.15);
        }

        .login-btn {
          height: 42px;
          padding: 0 18px;
          border-radius: 12px;
          border: 1.5px solid ${theme.green};
          background: transparent;
          color: ${theme.green};
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .login-btn:hover {
          background: ${theme.greenPale};
        }

        .cta-btn {
          height: 44px;
          padding: 0 22px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(
            135deg,
            ${theme.green},
            ${theme.greenMid}
          );
          color: white;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .cta-btn:hover {
          transform: translateY(-2px);
        }

        /* =========================
            MOBILE TOGGLE
        ========================= */
        .mobile-toggle {
          display: none;
          border: none;
          background: none;
          cursor: pointer;
          color: ${theme.dark};
        }

        /* =========================
            MOBILE MENU
        ========================= */
        .mobile-overlay {
          position: fixed;
          inset: 0;
          z-index: 999;
          opacity: 0;
          pointer-events: none;
          transition: all 0.35s ease;
          backdrop-filter: blur(10px);
        }

        .mobile-overlay.open {
          opacity: 1;
          pointer-events: auto;
        }

        .mobile-menu {
          position: absolute;
          inset: 0;
          padding: 24px;
          transform: translateY(-100%);
          transition: transform 0.35s ease;
          backdrop-filter: blur(18px);
        }

        .mobile-overlay.open .mobile-menu {
          transform: translateY(0);
        }

        .mobile-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 12px;
        }

        .mobile-logo {
          font-size: 22px;
          font-weight: 800;
          color: ${theme.dark};
        }

        .mobile-close {
          border: none;
          background: none;
          cursor: pointer;
          color: ${theme.dark};
        }

        .mobile-links {
          margin-top: 48px;
          display: flex;
          flex-direction: column;
        }

        .mobile-link {
          border: none;
          background: none;
          text-align: left;
          padding: 18px 0;
          font-size: 22px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
        }

        /* =========================
            MOBILE THEME
        ========================= */
        .mobile-theme-wrapper {
          margin-top: 40px;
        }

        .mobile-theme-title {
          font-size: 14px;
          font-weight: 700;
          color: ${theme.muted};
          margin-bottom: 14px;
        }

        .mobile-theme-switcher {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .mobile-theme-btn {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          border: none;
          cursor: pointer;
          position: relative;
          transition: 0.25s ease;
        }

        .mobile-theme-btn:hover {
          transform: scale(1.05);
        }

        .active-theme {
          transform: scale(1.08);
        }

        .theme-active-ring {
          position: absolute;
          inset: -5px;
          border-radius: 18px;
          border: 2px solid ${theme.dark};
        }

        /* =========================
            MOBILE ACTIONS
        ========================= */
        .mobile-actions {
          margin-top: 44px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .mobile-login-btn {
          height: 52px;
          border-radius: 14px;
          border: 1.5px solid ${theme.green};
          background: transparent;
          color: ${theme.green};
          font-weight: 700;
          cursor: pointer;
          font-size: 15px;
        }

        .mobile-cta-btn {
          height: 54px;
          border: none;
          border-radius: 14px;
          background: linear-gradient(
            135deg,
            ${theme.green},
            ${theme.greenMid}
          );
          color: white;
          font-weight: 800;
          font-size: 15px;
          cursor: pointer;
        }

        /* =========================
            RESPONSIVE
        ========================= */
        @media (max-width: 950px) {
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

        @media (max-width: 500px) {
          .nav-container {
            padding: 0 18px;
          }

          .logo-text {
            font-size: 18px;
          }

          .mobile-link {
            font-size: 20px;
          }
        }
      `}</style>
    </>
  );
}