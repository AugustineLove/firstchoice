'use client';

import { useTheme } from "../../context/ThemeContext";

// ─── PARTNERS ────────────────────────────────────────────────────────────────
const PARTNERS = [
  { icon: '🍲', name: 'Food Vendors', type: 'Restaurants & Chop Bars' },
  { icon: '💊', name: 'Pharmacies', type: 'Medicine & Health' },
  { icon: '🛒', name: 'Grocery Stores', type: 'Daily Essentials' },
  { icon: '👗', name: 'Boutiques', type: 'Clothing & Fashion' },
  { icon: '📱', name: 'Electronics', type: 'Gadgets & Accessories' },
  { icon: '🏪', name: 'General Shops', type: 'Everyday Products' },
  { icon: '🥩', name: 'Butchers & Farms', type: 'Fresh Produce' },
  { icon: '📦', name: 'Courier Partners', type: 'Bulk & Business Delivery' },
];

export function PartnersSection() {
  const { theme } = useTheme();
  return (
    <section id="partners" style={{ padding: '88px 5%', background: theme.dark }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: theme.greenLight, marginBottom: 10 }}>
            Our Network
          </p>
          <h2 style={{ fontSize: 'clamp(28px,4vw,38px)', fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: 12 }}>
            Trusted by <em style={{ fontStyle: 'normal', color: theme.greenLight }}>Local Businesses</em>
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, maxWidth: 520, margin: '0 auto' }}>
            From food to pharmaceuticals — we power commerce for every type of local business in Agona Nkwanta.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }} className="partners-grid">
          {PARTNERS.map((p) => (
            <div
              key={p.name}
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, padding: '22px 16px', textAlign: 'center',
                transition: 'all 0.25s', cursor: 'default',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.borderColor = theme.greenLight; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            >
              <div style={{ fontSize: 28, marginBottom: 10 }}>{p.icon}</div>
              <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{p.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>{p.type}</div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@media(max-width:640px){.partners-grid{grid-template-columns:repeat(2,1fr)!important}}`}</style>
    </section>
  );
}

// ─── TESTIMONIALS ─────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    stars: 5,
    text: 'FirstChoice has completely changed how I run my food joint. I get orders on my phone and riders pick them up. My sales have doubled in two months!',
    name: 'Jennifer Samevi', role: "Shalom Fast Food", initials: 'AA', colorKey: 'green',
  },
  {
    stars: 5,
    text: 'I can send a package from the market to my house without leaving work. The rider arrived in 15 minutes. Very reliable!',
    name: 'Janet Ninson', role: 'Customer — Agona Nkwanta', initials: 'KO', colorKey: 'amber',
  },
  {
    stars: 5,
    text: "As a rider, I earn more with FirstChoice than any other work I've done. Easy app, helpful support, and payments are always fair.",
    name: 'Benedict Ekrah Brace', role: 'Rider — 150+ deliveries', initials: 'YA', colorKey: 'greenMid',
  },
];

export function TestimonialsSection() {
  const { theme } = useTheme();
  return (
    <section id="testimonials" style={{ padding: '88px 5%', background: '#fff' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: theme.green, marginBottom: 10 }}>
            Real Stories
          </p>
          <h2 style={{ fontSize: 'clamp(28px,4vw,38px)', fontWeight: 900, color: theme.dark, lineHeight: 1.15 }}>
            What the <em style={{ fontStyle: 'normal', color: theme.green }}>Community Says</em>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22 }} className="testi-grid">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              style={{
                background: '#fff', border: `1px solid ${theme.border}`, borderRadius: 16,
                padding: 28, transition: 'transform 0.25s, box-shadow 0.25s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ color: theme.amber, fontSize: 15, marginBottom: 12 }}>{'★'.repeat(t.stars)}</div>
              <p style={{ fontSize: 14, color: theme.muted, lineHeight: 1.8, marginBottom: 22, fontStyle: 'italic' }}>"{t.text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', background: theme[t.colorKey],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
                }}>
                  {t.initials}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: theme.dark }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: theme.muted }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@media(max-width:768px){.testi-grid{grid-template-columns:1fr!important}}`}</style>
    </section>
  );
}

// ─── PRICING ──────────────────────────────────────────────────────────────────
const PLANS = [
  {
    name: 'Starter', pct: '12%', featured: false,
    desc: 'Perfect for small businesses just starting with online ordering.',
    features: ['Up to 30 orders/month', 'Basic vendor dashboard', 'Order notifications', 'Customer support'],
  },
  {
    name: 'Growth', pct: '10%', featured: true,
    desc: 'Best for active vendors who want more sales and full analytics.',
    features: ['Unlimited orders', 'Full analytics dashboard', 'Priority rider assignment', 'Promotional listing', 'Inventory management'],
  },
  {
    name: 'Enterprise', pct: '8%', featured: false,
    desc: 'For larger businesses needing custom logistics solutions.',
    features: ['Volume discounts', 'Dedicated account manager', 'Custom integrations', 'API access', 'Multi-location support'],
  },
];

export function PricingSection() {
  const { theme } = useTheme();
  return (
    <section id="pricing" style={{ padding: '88px 5%', background: theme.greenXpale }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: theme.green, marginBottom: 10 }}>
            For Vendors
          </p>
          <h2 style={{ fontSize: 'clamp(28px,4vw,38px)', fontWeight: 900, color: theme.dark, lineHeight: 1.15, marginBottom: 12 }}>
            Simple <em style={{ fontStyle: 'normal', color: theme.green }}>Vendor Plans</em>
          </h2>
          <p style={{ fontSize: 16, color: theme.muted, lineHeight: 1.7, maxWidth: 520, margin: '0 auto' }}>
            Transparent commissions. No hidden fees. Join hundreds of local businesses already growing with FirstChoice.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, maxWidth: 900, margin: '0 auto' }} className="pricing-grid">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              style={{
                background: '#fff', borderRadius: 18, padding: '32px 28px',
                border: `${plan.featured ? '2px' : '1.5px'} solid ${plan.featured ? theme.green : theme.border}`,
                boxShadow: plan.featured ? `0 0 0 4px ${theme.greenPale}` : 'none',
                position: 'relative', transition: 'transform 0.25s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              {plan.featured && (
                <span style={{
                  position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                  background: theme.green, color: '#fff', fontSize: 11, fontWeight: 700,
                  padding: '4px 14px', borderRadius: 50, whiteSpace: 'nowrap',
                }}>
                  Most Popular
                </span>
              )}
              <div style={{ fontSize: 16, fontWeight: 700, color: theme.dark, marginBottom: 6 }}>{plan.name}</div>
              <div style={{ fontSize: 38, fontWeight: 900, color: theme.green, margin: '8px 0' }}>
                {plan.pct} <span style={{ fontSize: 14, fontWeight: 500, color: theme.muted }}>/ order</span>
              </div>
              <p style={{ fontSize: 13, color: theme.muted, margin: '10px 0 20px', lineHeight: 1.65 }}>{plan.desc}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 8px' }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ fontSize: 13, color: theme.muted, padding: '8px 0', borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'start', gap: 8 }}>
                    <span style={{ color: theme.greenLight, fontWeight: 700, flexShrink: 0 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                style={{
                  width: '100%', marginTop: 22, padding: 12, borderRadius: 10,
                  fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: plan.featured ? theme.green : 'none',
                  color: plan.featured ? '#fff' : theme.green,
                  border: `1.5px solid ${theme.green}`,
                }}
                onMouseEnter={(e) => { if (!plan.featured) e.currentTarget.style.background = theme.greenPale; }}
                onMouseLeave={(e) => { if (!plan.featured) e.currentTarget.style.background = 'none'; }}
              >
                {plan.name === 'Enterprise' ? 'Contact Us' : 'Join Now'}
              </button>
            </div>
          ))}
        </div>
      </div>
      <style>{`@media(max-width:768px){.pricing-grid{grid-template-columns:1fr!important}}`}</style>
    </section>
  );
}

// ─── ABOUT ────────────────────────────────────────────────────────────────────
const ROADMAP = [
  { num: 1, colorKey: 'green', title: 'Launch & Validate', desc: 'Core delivery, marketplace MVP, manual dispatching in Agona Nkwanta.' },
  { num: 2, colorKey: 'greenMid', title: 'Optimize & Expand', desc: 'Smart dispatching, vendor analytics, delivery zones, nearby town expansion.' },
  { num: 3, colorKey: 'greenLight', title: 'Regional Platform', desc: 'Inter-town delivery, logistics APIs, fintech integrations, commerce infrastructure.' },
];

export function AboutSection() {
  const { theme } = useTheme();
  return (
    <section id="about" style={{ padding: '88px 5%', background: '#fff' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'center' }} className="about-grid">
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: theme.green, marginBottom: 10 }}>Our Mission</p>
          <h2 style={{ fontSize: 'clamp(26px,3.5vw,36px)', fontWeight: 900, color: theme.dark, lineHeight: 1.15, marginBottom: 20 }}>
            Built for <em style={{ fontStyle: 'normal', color: theme.green }}>Agona Nkwanta</em>,<br />Scaling Across Ghana
          </h2>
          <p style={{ fontSize: 15, color: theme.muted, lineHeight: 1.8, marginBottom: 14 }}>
            FirstChoice was built with a simple belief: small towns deserve the same logistics infrastructure as major cities. We started in Agona Nkwanta to prove that reliable, fast, and affordable delivery can work anywhere.
          </p>
          <p style={{ fontSize: 15, color: theme.muted, lineHeight: 1.8, marginBottom: 36 }}>
            We're not just a delivery app. We're building the digital commerce layer for local economies — connecting riders, vendors, and customers in one trusted ecosystem.
          </p>
          <div style={{ display: 'flex', gap: 36 }}>
            {[['2026', 'Founded'], ['2+', 'Towns Soon'], ['100%', 'Local-First']].map(([num, label]) => (
              <div key={label}>
                <div style={{ fontSize: 32, fontWeight: 900, color: theme.green }}>{num}</div>
                <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: theme.greenXpale, borderRadius: 18, padding: '36px 32px', border: `1px solid ${theme.border}` }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: theme.dark, marginBottom: 24 }}>Our 3-Phase Roadmap</h3>
          {ROADMAP.map((r) => (
            <div key={r.num} style={{ display: 'flex', gap: 16, alignItems: 'start', marginBottom: 20 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, background: theme[r.colorKey],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0,
              }}>
                {r.num}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: theme.dark, marginBottom: 4 }}>{r.title}</div>
                <div style={{ fontSize: 12, color: theme.muted, lineHeight: 1.65 }}>{r.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@media(max-width:768px){.about-grid{grid-template-columns:1fr!important}}`}</style>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
export function CTASection() {
  const { theme } = useTheme();
  return (
    <section id="cta" style={{ background: theme.dark, textAlign: 'center', padding: '88px 5%' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <h2 style={{ fontSize: 'clamp(30px,4.5vw,44px)', fontWeight: 900, color: '#fff', marginBottom: 14 }}>
          Ready to Join <em style={{ fontStyle: 'normal', color: theme.greenLight }}>FirstChoice</em>?
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', marginBottom: 36, lineHeight: 1.7 }}>
          Whether you're a customer, vendor, or rider — there's a place for you in Agona Nkwanta's most reliable delivery network.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
          {/* <button
            style={{
              padding: '14px 28px', background: theme.greenLight, color: '#fff',
              border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
              fontFamily: 'inherit', cursor: 'pointer', transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = theme.green)}
            onMouseLeave={(e) => (e.currentTarget.style.background = theme.greenLight)}
          >
            Download Customer App
          </button> */}

          <button
          style={{
            padding: '14px 28px',
            background: theme.greenLight,
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 700,
            fontFamily: 'inherit',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = theme.green)}
          onMouseLeave={(e) => (e.currentTarget.style.background = theme.greenLight)}
          onClick={() => {
            window.location.href = "https://firstchoice-ten.vercel.app/FirstChoiceRiderv1.0.0.apk";
          }}
        >
          Download Rider App
        </button>

          {['Register as a Vendor', 'Become a Rider'].map((label) => (
            <button
              key={label}
              style={{
                padding: '14px 28px', background: 'none',
                border: '1.5px solid rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.88)',
                borderRadius: 10, fontSize: 15, fontWeight: 600,
                fontFamily: 'inherit', cursor: 'pointer', transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.65)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
export function Footer() {
  const { theme } = useTheme();
  return (
    <footer style={{ background: '#0A1810', color: 'rgba(255,255,255,0.65)', padding: '56px 5% 28px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 40 }} className="footer-grid">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, background: theme.green, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 17 }}>F</div>
              <span style={{ fontWeight: 700, fontSize: 17, color: '#fff' }}>First<span style={{ color: theme.greenLight }}>Choice</span></span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.75, margin: '0 0 18px', maxWidth: 260 }}>
              The digital logistics layer for local commerce in Ghana. Connecting customers, riders, and businesses through one reliable ecosystem.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {['f', 't', 'in', '▶'].map((s) => (
                <div
                  key={s}
                  style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = theme.greenMid)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                >
                  {s}
                </div>
              ))}
            </div>
          </div>
          {[
            { title: 'Services', links: ['Marketplace', 'Package Delivery', 'Errand Services', 'Business Tools'] },
            { title: 'Company', links: ['About Us', 'Careers', 'Blog', 'Press'] },
            { title: 'Contact', links: ['Support', 'Become a Rider', 'Partner with Us', 'Agona Nkwanta, GH'] },
          ].map((col) => (
            <div key={col.title}>
              <h4 style={{ color: '#fff', fontSize: 13, fontWeight: 700, marginBottom: 14 }}>{col.title}</h4>
              {col.links.map((l) => (
                <a
                  key={l} href="#"
                  style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 9, textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = theme.greenLight)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
                >
                  {l}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', fontSize: 11, flexWrap: 'wrap', gap: 8 }}>
          <p>© 2024 FirstChoice Logistics Ltd. All rights reserved.</p>
          <p>Privacy Policy · Terms of Service</p>
        </div>
      </div>
      <style>{`@media(max-width:768px){.footer-grid{grid-template-columns:1fr 1fr!important}}`}</style>
    </footer>
  );
}