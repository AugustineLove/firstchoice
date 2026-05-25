'use client';

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { themes, useTheme } from '../context/ThemeContext';
const NAV_LINKS = [
  { label: 'How it Works', href: '#how' },
  { label: 'Services', href: '#services' },
  { label: 'Partners', href: '#partners' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'About', href: '#about' },
  {label: 'Team', href: '/team'}
];


const scrollTo = (href) => {
  const el = document.querySelector(href);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
};



export default function Navbar() {
  const navigate = useNavigate();

  const handleNavClick = (href) => {
  if (!href.startsWith('#')) {
    navigate(href);
    return;
  }

  const target = document.querySelector(href);

  if (target) {
    target.scrollIntoView({ behavior: 'smooth' });
  } else {
    navigate('/');

    setTimeout(() => {
      const el = document.querySelector(href);
      el?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }
};

  const { theme, themeName, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleNav = (href) => {
    setMobileOpen(false);
    scrollTo(href);
  };

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 100,
          height: 66,
          background: scrolled ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${theme.border}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 5%',
          transition: 'all 0.3s',
          boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.06)' : 'none',
        }}
      >
        <div style={{ maxWidth: 1100, width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 38, height: 38, background: theme.green, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 18 }}>F</div>
            <span style={{ fontWeight: 700, fontSize: 18, color: theme.dark }}>
              First<span style={{ color: theme.greenLight }}>Choice</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <ul style={{ display: 'flex', gap: 28, listStyle: 'none', margin: 0, padding: 0 }} className="nav-links-desktop">
            {NAV_LINKS.map((l) => (
              <li key={l.label}>
                <button
                  onClick={() => handleNavClick(l.href)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 14, color: theme.muted, fontFamily: 'inherit',
                    padding: 0, fontWeight: 500, transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.target.style.color = theme.green)}
                  onMouseLeave={(e) => (e.target.style.color = theme.muted)}
                >
                  {l.label}
                </button>
              </li>
            ))}
          </ul>

          {/* Right: Theme + CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Theme Switcher */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {Object.keys(themes).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  title={t}
                  style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: themes[t].green,
                    border: themeName === t ? `2.5px solid ${theme.dark}` : '2.5px solid transparent',
                    cursor: 'pointer',
                    transform: themeName === t ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all 0.2s',
                    padding: 0,
                  }}
                />
              ))}
            </div>

            <button
              onClick={() => navigate('/admin')}
              style={{
                padding: '8px 18px', borderRadius: 8,
                border: `1.5px solid ${theme.green}`,
                background: 'none', color: theme.green,
                cursor: 'pointer', fontSize: 13, fontWeight: 600,
                fontFamily: 'inherit', transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = theme.greenPale)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              Login
            </button>
            <button
              style={{
                padding: '9px 20px', borderRadius: 8, border: 'none',
                background: theme.green, color: '#fff',
                cursor: 'pointer', fontSize: 13, fontWeight: 700,
                fontFamily: 'inherit', transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = theme.greenMid)}
              onMouseLeave={(e) => (e.currentTarget.style.background = theme.green)}
            >
              Get Started
            </button>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: theme.dark, padding: 4 }}
              className="mobile-toggle"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 99, background: '#fff',
            paddingTop: 66, display: 'flex', flexDirection: 'column',
            padding: '80px 24px 24px', gap: 4,
          }}
        >
          {NAV_LINKS.map((l) => (
            <button
              key={l.label}
              onClick={() => handleNav(l.href)}
              style={{
                textAlign: 'left', fontSize: 18, fontWeight: 600,
                color: theme.dark, background: 'none', border: 'none',
                borderBottom: `1px solid ${theme.border}`, cursor: 'pointer',
                padding: '14px 0', fontFamily: 'inherit',
              }}
            >
              {l.label}
            </button>
          ))}
          <button
            style={{
              marginTop: 16, padding: '12px', border: `1.5px solid ${theme.green}`,
              borderRadius: 8, background: 'none', color: theme.green,
              fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
            }}
            onClick={() => { setMobileOpen(false); navigate('/admin'); }}
          >
            Login
          </button>
          <button
            style={{
              marginTop: 10, padding: '12px', border: 'none',
              borderRadius: 8, background: theme.green, color: '#fff',
              fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
            }}
            onClick={() => setMobileOpen(false)}
          >
            Get Started
          </button>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .nav-links-desktop { display: none !important; }
          .mobile-toggle { display: flex !important; }
        }
      `}</style>
    </>
  );
}