'use client';
import { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';

function DeliveryIllustration({ theme }) {
  return (
    <svg viewBox="0 0 420 420" width="100%" style={{ maxWidth: 460 }} aria-label="Delivery rider on motorbike">
      {/* BG CIRCLES */}
      <circle cx="210" cy="210" r="185" fill={theme.greenPale} opacity="0.55" />
      <circle cx="210" cy="210" r="130" fill={theme.greenPale} opacity="0.45" />

      {/* ROAD */}
      <ellipse cx="210" cy="342" rx="155" ry="22" fill={theme.greenPale} opacity="0.9" />
      <rect x="120" y="336" width="180" height="6" rx="3" fill={theme.border} opacity="0.8" />
      <rect x="145" y="338" width="18" height="2" rx="1" fill="#fff" opacity="0.8" />
      <rect x="192" y="338" width="18" height="2" rx="1" fill="#fff" opacity="0.8" />
      <rect x="239" y="338" width="18" height="2" rx="1" fill="#fff" opacity="0.8" />

      {/* MOTORBIKE */}
      <g transform="translate(86,196)">
        {/* REAR WHEEL */}
        <circle cx="30" cy="114" r="34" fill="none" stroke={theme.green} strokeWidth="8" />
        <circle cx="30" cy="114" r="18" fill="none" stroke={theme.greenMid} strokeWidth="4" />
        <circle cx="30" cy="114" r="5" fill={theme.green} />
        <line x1="30" y1="80" x2="30" y2="96" stroke={theme.greenMid} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="30" y1="132" x2="30" y2="148" stroke={theme.greenMid} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="-4" y1="114" x2="12" y2="114" stroke={theme.greenMid} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="48" y1="114" x2="64" y2="114" stroke={theme.greenMid} strokeWidth="2.5" strokeLinecap="round" />

        {/* FRONT WHEEL */}
        <circle cx="216" cy="114" r="34" fill="none" stroke={theme.green} strokeWidth="8" />
        <circle cx="216" cy="114" r="18" fill="none" stroke={theme.greenMid} strokeWidth="4" />
        <circle cx="216" cy="114" r="5" fill={theme.green} />
        <line x1="216" y1="80" x2="216" y2="96" stroke={theme.greenMid} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="216" y1="132" x2="216" y2="148" stroke={theme.greenMid} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="182" y1="114" x2="198" y2="114" stroke={theme.greenMid} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="234" y1="114" x2="250" y2="114" stroke={theme.greenMid} strokeWidth="2.5" strokeLinecap="round" />

        {/* FRAME */}
        <path d="M30 114 L80 58 L166 58 L216 114" fill="none" stroke={theme.green} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="80" y1="58" x2="110" y2="114" stroke={theme.green} strokeWidth="6" strokeLinecap="round" />

        {/* BODY */}
        <path d="M80 54 L172 44 L202 74 L166 80 L80 75 Z" fill={theme.green} />
        <path d="M172 44 L202 74 L216 90 L210 100 L180 85 L160 65 Z" fill={theme.greenMid} />

        {/* SEAT */}
        <rect x="80" y="49" width="76" height="20" rx="10" fill={theme.dark} opacity="0.85" />

        {/* HANDLEBAR */}
        <rect x="192" y="37" width="6" height="36" rx="3" fill={theme.green} />
        <rect x="184" y="37" width="22" height="7" rx="3.5" fill={theme.dark} opacity="0.85" />

        {/* EXHAUST */}
        <path d="M40 109 Q18 120 8 130" fill="none" stroke={theme.greenMid} strokeWidth="4" strokeLinecap="round" />
      </g>

      {/* DELIVERY BOX */}
      <g transform="translate(148,148)">
        <rect x="0" y="0" width="68" height="58" rx="8" fill={theme.amber} />
        <rect x="0" y="0" width="68" height="14" rx="8" fill={theme.amber} style={{ filter: 'brightness(0.85)' }} />
        <rect x="0" y="8" width="68" height="6" fill={theme.amber} style={{ filter: 'brightness(0.82)' }} />
        <line x1="34" y1="14" x2="34" y2="58" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5" />
        <rect x="22" y="20" width="24" height="6" rx="3" fill={theme.amberLight} opacity="0.7" />
        <text x="11" y="50" fontSize="10" fontWeight="700" fill="rgba(255,255,255,0.55)">FC</text>
      </g>

      {/* RIDER */}
      <g transform="translate(178,90)">
        {/* BODY */}
        <rect x="14" y="46" width="38" height="42" rx="10" fill={theme.green} />
        <rect x="24" y="52" width="16" height="28" rx="4" fill={theme.greenMid} opacity="0.5" />
        {/* HEAD */}
        <circle cx="33" cy="32" r="22" fill="#F5C5A3" />
        {/* HELMET */}
        <path d="M11 28 Q11 6 33 6 Q55 6 55 28 Z" fill={theme.green} />
        <rect x="14" y="26" width="38" height="12" rx="6" fill={theme.dark} opacity="0.9" />
        <rect x="16" y="27" width="34" height="8" rx="4" fill={theme.dark} opacity="0.6" />
        <rect x="18" y="28" width="12" height="4" rx="2" fill="rgba(255,255,255,0.18)" />
        {/* ARM */}
        <path d="M52 56 Q75 52 80 60 Q82 66 78 70 Q70 74 52 72" fill={theme.green} />
        <circle cx="80" cy="65" r="6" fill="#F5C5A3" />
      </g>

      {/* MOTION LINES */}
      <g opacity="0.35">
        <line x1="48" y1="268" x2="80" y2="268" stroke={theme.green} strokeWidth="3" strokeLinecap="round" />
        <line x1="40" y1="279" x2="68" y2="279" stroke={theme.green} strokeWidth="2" strokeLinecap="round" />
        <line x1="53" y1="258" x2="72" y2="258" stroke={theme.green} strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* LOCATION PIN */}
      <g transform="translate(312,82)" style={{ animation: 'float 3.5s ease-in-out infinite' }}>
        <circle cx="0" cy="0" r="22" fill={theme.green} />
        <path d="M0 -14 Q10 -14 10 -4 Q10 4 0 14 Q-10 4 -10 -4 Q-10 -14 0 -14Z" fill="#fff" opacity="0.9" />
        <circle cx="0" cy="-4" r="5" fill={theme.green} />
      </g>

      {/* DECORATIVE DOTS */}
      <circle cx="70" cy="128" r="4" fill={theme.amber} opacity="0.7" style={{ animation: 'float 4s ease-in-out infinite' }} />
      <circle cx="362" cy="202" r="3" fill={theme.amberLight} opacity="0.6" style={{ animation: 'float 5s ease-in-out infinite 1s' }} />
      <circle cx="344" cy="130" r="5" fill={theme.greenLight} opacity="0.5" style={{ animation: 'float 4.5s ease-in-out infinite .5s' }} />
      <circle cx="58" cy="290" r="3" fill={theme.amber} opacity="0.5" style={{ animation: 'float 6s ease-in-out infinite 1.5s' }} />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </svg>
  );
}

function FloatCard({ style, icon, title, sub, badgeText, badgeColor, badgeBg, theme }) {
  return (
    <div
      style={{
        position: 'absolute',
        background: '#fff',
        border: `1px solid ${theme.border}`,
        borderRadius: 12,
        padding: '12px 16px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      <div style={{ width: 32, height: 32, borderRadius: 8, background: theme.greenPale, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontWeight: 700, color: theme.dark, fontSize: 12 }}>{title}</div>
        <div style={{ color: theme.muted, fontSize: 11 }}>{sub}</div>
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 50, background: badgeBg, color: badgeColor, marginLeft: 4 }}>
        {badgeText}
      </span>
    </div>
  );
}

export default function HeroSection() {
  const { theme } = useTheme();

  const scrollTo = (href) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="hero"
      style={{
        padding: '120px 5% 80px',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }} className="hero-grid">
        {/* LEFT */}
        <div>
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 14px', background: theme.greenPale,
              border: `1px solid ${theme.greenLight}`, borderRadius: 50,
              fontSize: 13, color: theme.green, fontWeight: 600, marginBottom: 22,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: theme.greenLight, display: 'inline-block', animation: 'pulse 2s infinite' }} />
            Now live in Agona Nkwanta
          </div>

          <h1 style={{ fontSize: 'clamp(36px, 5vw, 54px)', fontWeight: 900, lineHeight: 1.1, color: theme.dark, marginBottom: 20 }}>
            Your City's{' '}
            <em style={{ fontStyle: 'normal', color: theme.green }}>Delivery</em>
            {' '}&amp; Commerce Hub
          </h1>

          <p style={{ fontSize: 17, color: theme.muted, lineHeight: 1.75, maxWidth: 480, marginBottom: 36 }}>
            Order food, send parcels, run errands — FirstChoice connects customers, riders, and local businesses in one seamless platform.
          </p>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 48 }}>
            <button
              style={{
                padding: '14px 28px', borderRadius: 10, border: 'none',
                background: theme.green, color: '#fff', fontSize: 15,
                fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = theme.greenMid; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = theme.green; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Download the App →
            </button>
            <button
              onClick={() => scrollTo('#how')}
              style={{
                padding: '14px 28px', borderRadius: 10,
                border: `2px solid ${theme.border}`, background: 'none',
                color: theme.dark, fontSize: 15, fontWeight: 600,
                fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.green; e.currentTarget.style.color = theme.green; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.dark; }}
            >
              How it Works
            </button>
          </div>

          <div style={{ display: 'flex', gap: 36 }}>
            {[{ label: 'Local Vendors', value: '50+' }, { label: 'Deliveries Done', value: '200+' }, { label: 'Happy Customers', value: '98%' }].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: 26, fontWeight: 900, color: theme.dark }}>{s.value}</div>
                <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — ILLUSTRATION */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <DeliveryIllustration theme={theme} />
          <FloatCard
            theme={theme}
            style={{ top: 20, left: 0, animation: 'floatCard 4s ease-in-out infinite 0.5s' }}
            icon="🛵" title="Rider En Route" sub="Est. 8 mins"
            badgeText="Live" badgeColor={theme.green} badgeBg={theme.greenPale}
          />
          <FloatCard
            theme={theme}
            style={{ bottom: 80, right: -10, animation: 'floatCard 5s ease-in-out infinite 1.2s' }}
            icon="📦" title="Order Delivered" sub="2 min ago"
            badgeText="Done" badgeColor={theme.amber} badgeBg={theme.amberPale}
          />
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(.9)} }
        @keyframes floatCard { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-grid > div:last-child { display: none; }
        }
      `}</style>
    </section>
  );
}