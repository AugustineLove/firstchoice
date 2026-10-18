'use client';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { ThemeProvider, useTheme } from '../../context/ThemeContext';
import { Footer } from './LandingSections';

// Backend base URL (no trailing slash, no "/api"). Vite assumed; for CRA use
// process.env.REACT_APP_API_URL. Match whatever your other pages already use.
const API_BASE = (import.meta.env?.VITE_API_URL || 'https://firstchoice-backend.onrender.com').replace(/\/$/, '');

const TITLES = { terms: 'Terms of Service', privacy: 'Privacy Policy' };

function LegalContent({ type }) {
  const { theme } = useTheme();
  const [params] = useSearchParams();
  const version = params.get('v'); // optional: pin a specific published version
  const [state, setState] = useState({ status: 'loading', doc: null });
  const [attempt, setAttempt] = useState(0);

  const title = TITLES[type];
  const otherType = type === 'terms' ? 'privacy' : 'terms';

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading', doc: null });

    (async () => {
      try {
        const qs = version ? `?v=${encodeURIComponent(version)}` : '';
        const res = await fetch(`${API_BASE}/legal/public/${type}${qs}`);
        if (cancelled) return;
        if (res.status === 404) return setState({ status: 'missing', doc: null });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || 'Request failed');
        setState({ status: 'ready', doc: json.data });
      } catch {
        if (!cancelled) setState({ status: 'error', doc: null });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [type, version, attempt]);

  useEffect(() => {
    document.title = `${title} · FirstChoice`;
    window.scrollTo(0, 0);
  }, [title]);

  const { status, doc } = state;

  return (
    <main style={{ background: theme.greenXpale, minHeight: '100vh', padding: '120px 5% 72px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div
          style={{
            background: '#fff',
            border: `1px solid ${theme.border}`,
            borderRadius: 18,
            padding: 'clamp(24px, 5vw, 48px)',
            boxShadow: '0 8px 28px rgba(0,0,0,0.05)',
          }}
        >
          <h1 style={{ fontSize: 'clamp(26px, 4vw, 34px)', fontWeight: 900, color: theme.dark, margin: '0 0 6px' }}>
            {title}
          </h1>

          {status === 'ready' && (
            <>
              <p style={{ fontSize: 13, color: theme.muted, margin: '0 0 28px' }}>
                FirstChoice · Version {doc.version} · Effective {doc.effectiveDate}
              </p>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.75, fontSize: 15, color: '#1f2937' }}>
                {doc.content}
              </div>
            </>
          )}

          {status === 'loading' && (
            <p style={{ fontSize: 14, color: theme.muted, margin: '24px 0' }}>Loading…</p>
          )}

          {status === 'missing' && (
            <p style={{ fontSize: 14, color: theme.muted, margin: '24px 0' }}>
              This document isn&apos;t available yet. Please check back soon.
            </p>
          )}

          {status === 'error' && (
            <div style={{ margin: '24px 0' }}>
              <p style={{ fontSize: 14, color: theme.muted, marginBottom: 14 }}>
                We couldn&apos;t load this page. Check your connection and try again.
              </p>
              <button
                onClick={() => setAttempt((n) => n + 1)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: `1.5px solid ${theme.green}`,
                  background: 'none',
                  color: theme.green,
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                Try again
              </button>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: theme.muted, marginTop: 20 }}>
          <Link to={`/${otherType}`} style={{ color: theme.green, fontWeight: 600, textDecoration: 'none' }}>
            View our {TITLES[otherType]}
          </Link>
          {' · '}
          <Link to="/" style={{ color: theme.green, fontWeight: 600, textDecoration: 'none' }}>
            Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LegalPage({ type = 'terms' }) {
  return (
    <ThemeProvider>
      <Navbar />
      <LegalContent type={type} />
      <Footer />
    </ThemeProvider>
  );
}