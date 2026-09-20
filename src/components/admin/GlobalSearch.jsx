'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, CornerDownLeft, X } from 'lucide-react';

const TYPE_META = {
  order:    { label: 'Order',    color: '#8b5cf6' },
  delivery: { label: 'Delivery', color: '#06b6d4' },
  user:     { label: 'User',     color: '#3b82f6' },
  rider:    { label: 'Rider',    color: '#f59e0b' },
  vendor:   { label: 'Vendor',   color: '#10b981' },
};

export function GlobalSearch({ authFetch, onOpen, theme }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(0);

  const inputRef = useRef(null);
  const reqIdRef = useRef(0);

  /* ⌘K / Ctrl+K anywhere on the page */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 10);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* Debounced search. reqIdRef discards responses that arrive out of order. */
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setHits([]); setLoading(false); return; }

    setLoading(true);
    const id = ++reqIdRef.current;
    const timer = setTimeout(async () => {
      try {
        const res = await authFetch(`/admin/search?q=${encodeURIComponent(q)}`);
        const json = await res.json();
        if (id !== reqIdRef.current) return;   // a newer keystroke already fired
        setHits(json.success ? json.data.hits : []);
        setCursor(0);
      } catch {
        if (id === reqIdRef.current) setHits([]);
      }
      if (id === reqIdRef.current) setLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [query, authFetch]);

  const choose = useCallback((hit) => {
    onOpen(hit);
    setOpen(false);
    setQuery('');
    setHits([]);
  }, [onOpen]);

  const onInputKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(c + 1, hits.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
    if (e.key === 'Enter' && hits[cursor]) { e.preventDefault(); choose(hits[cursor]); }
  };

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 10); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, height: 36, padding: '0 12px',
          borderRadius: 9, border: '1.5px solid #e5e7eb', background: '#fff',
          cursor: 'pointer', color: '#9ca3af', fontSize: 13, fontFamily: 'inherit', minWidth: 230,
        }}
      >
        <Search size={14} />
        <span style={{ flex: 1, textAlign: 'left' }}>Search anything…</span>
        <kbd style={{
          fontSize: 10, fontWeight: 700, padding: '2px 5px', borderRadius: 4,
          background: '#f3f4f6', color: '#6b7280', fontFamily: 'inherit',
        }}>⌘K</kbd>
      </button>
    );
  }

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        style={{ position: 'fixed', inset: 0, background: 'rgba(15,17,23,0.35)', zIndex: 4000 }}
      />
      <div style={{
        position: 'fixed', top: '12vh', left: '50%', transform: 'translateX(-50%)',
        width: 'min(620px, calc(100vw - 32px))', zIndex: 4001, background: '#fff',
        borderRadius: 16, boxShadow: '0 24px 60px rgba(0,0,0,0.25)', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid #f0f0f0' }}>
          {loading
            ? <Loader2 size={17} style={{ animation: 'spin 1s linear infinite', color: theme?.green || '#10b981' }} />
            : <Search size={17} color="#9ca3af" />}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Order ID, phone number, name, address…"
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, fontFamily: 'inherit', background: 'transparent' }}
          />
          <X size={16} color="#9ca3af" style={{ cursor: 'pointer' }} onClick={() => setOpen(false)} />
        </div>

        <div style={{ maxHeight: '52vh', overflowY: 'auto' }}>
          {query.trim().length < 2 && (
            <div style={{ padding: '28px 20px', textAlign: 'center', fontSize: 13, color: '#9ca3af', lineHeight: 1.7 }}>
              Type at least two characters.<br />
              Paste an ID to jump straight to a record.
            </div>
          )}

          {query.trim().length >= 2 && !loading && hits.length === 0 && (
            <div style={{ padding: '28px 20px', textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>
              Nothing matched that.
            </div>
          )}

          {hits.map((h, i) => {
            const meta = TYPE_META[h.type] || { label: h.type, color: '#6b7280' };
            const active = i === cursor;
            return (
              <button
                key={`${h.type}-${h.id}`}
                onClick={() => choose(h)}
                onMouseEnter={() => setCursor(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
                  padding: '11px 16px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  background: active ? '#f8fafc' : '#fff',
                  borderLeft: `3px solid ${active ? meta.color : 'transparent'}`,
                }}
              >
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 50,
                  background: `${meta.color}18`, color: meta.color, flexShrink: 0, minWidth: 62, textAlign: 'center',
                }}>{meta.label}</span>

                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f1117', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {h.title}
                  </span>
                  <span style={{ display: 'block', fontSize: 11.5, color: '#9ca3af', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {h.subtitle}
                  </span>
                </span>

                <span style={{ fontSize: 11, color: '#6b7280', flexShrink: 0, textAlign: 'right' }}>
                  {h.status && <span style={{ display: 'block', fontWeight: 700 }}>{h.status.replace(/_/g, ' ')}</span>}
                  {h.meta && <span style={{ display: 'block', color: '#9ca3af', marginTop: 2 }}>{h.meta}</span>}
                </span>

                {active && <CornerDownLeft size={13} color="#d1d5db" style={{ flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>

        <div style={{ padding: '8px 16px', borderTop: '1px solid #f5f5f5', display: 'flex', gap: 14, fontSize: 10.5, color: '#9ca3af' }}>
          <span>↑↓ navigate</span><span>↵ open</span><span>esc close</span>
        </div>
      </div>
    </>
  );
}