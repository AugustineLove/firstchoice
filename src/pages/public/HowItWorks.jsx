'use client';
import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';

const STEPS = [
  {
    icon: '📱',
    title: 'Place Your Request',
    desc: 'Order food, request a delivery, or assign an errand — all in seconds from the app.',
    tag: 'Fast & Simple',
  },
  {
    icon: '🛵',
    title: 'Rider Gets Assigned',
    desc: 'Our nearest available rider is matched and dispatched with real-time GPS tracking.',
    tag: 'Live Tracking',
  },
  {
    icon: '🎉',
    title: 'Delivered to You',
    desc: 'Receive your order at your door. Pay with cash or MoMo — fully flexible.',
    tag: 'Cash or MoMo',
  },
];

export default function HowItWorks() {
  const { theme } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % STEPS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="how" style={{ padding: '88px 5%', background: theme.greenXpale }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: theme.green, marginBottom: 10 }}>
            Simple Process
          </p>
          <h2 style={{ fontSize: 'clamp(28px,4vw,38px)', fontWeight: 900, color: theme.dark, lineHeight: 1.15, marginBottom: 12 }}>
            How it <em style={{ fontStyle: 'normal', color: theme.green }}>Works</em>
          </h2>
          <p style={{ fontSize: 16, color: theme.muted, lineHeight: 1.7 }}>
            Three simple steps to get anything ordered, delivered, or handled.
          </p>
        </div>

        {/* Steps */}
        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }} className="steps-grid">
          {/* Connector line */}
          <div style={{
            position: 'absolute', top: 48, left: 'calc(16.7% + 28px)', right: 'calc(16.7% + 28px)',
            height: 2, background: `linear-gradient(90deg, ${theme.greenLight}, ${theme.amberLight})`,
            borderRadius: 2, zIndex: 0,
          }} />

          {STEPS.map((step, i) => {
            const isActive = i === activeIndex;
            return (
              <div
                key={i}
                onClick={() => setActiveIndex(i)}
                style={{
                  position: 'relative', zIndex: 1,
                  background: '#fff', borderRadius: 16,
                  border: `1.5px solid ${isActive ? theme.greenLight : theme.border}`,
                  padding: '32px 26px',
                  boxShadow: isActive ? `0 0 0 4px ${theme.greenPale}, 0 4px 20px rgba(0,0,0,0.07)` : '0 2px 8px rgba(0,0,0,0.04)',
                  transform: isActive ? 'translateY(-6px)' : 'translateY(0)',
                  transition: 'all 0.4s ease',
                  cursor: 'pointer',
                }}
              >
                {/* Step number watermark */}
                <div style={{ position: 'absolute', top: 14, right: 18, fontSize: 52, fontWeight: 900, color: theme.greenPale, lineHeight: 1, userSelect: 'none' }}>
                  0{i + 1}
                </div>

                {/* Icon */}
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: theme.greenPale, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 26, marginBottom: 20,
                  border: `1px solid ${theme.border}`,
                }}>
                  {step.icon}
                </div>

                <h3 style={{ fontSize: 18, fontWeight: 700, color: theme.dark, marginBottom: 8 }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 14, color: theme.muted, lineHeight: 1.7, marginBottom: 18 }}>
                  {step.desc}
                </p>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '4px 12px',
                  background: theme.greenPale, color: theme.green,
                  borderRadius: 50, display: 'inline-block',
                }}>
                  {step.tag}
                </span>
              </div>
            );
          })}
        </div>

        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              style={{
                width: i === activeIndex ? 24 : 8, height: 8,
                borderRadius: 4, border: 'none', cursor: 'pointer',
                background: i === activeIndex ? theme.green : theme.border,
                transition: 'all 0.3s', padding: 0,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .steps-grid { grid-template-columns: 1fr !important; }
          .steps-grid > div:first-child { display: none; }
        }
      `}</style>
    </section>
  );
}