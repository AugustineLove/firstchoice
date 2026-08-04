'use client';
import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import Navbar from '../../components/Navbar';

// ─── DATA ─────────────────────────────────────────────────────────────────────

const TEAM = [
  {
    initials: 'KS',
    name: 'Kweku Stephens',
    role: 'Chief Executive Officer (CEO)',
    bio: "An Information Technology professional from the University of Ghana with a passion for solving everyday challenges through technology. Austin leads the company's vision, strategy, and partnerships, driving FirstChoice Express toward becoming the leading on-demand delivery platform in Ghana.",
    tags: ['Leadership', 'Strategy', 'Partnerships'],
    colorKey: 'dark',
    social: { twitter: '#', linkedin: '#' },
  },

  {
    initials: 'OS',
    name: 'Oscar Stephens',
    role: 'Chief Operating Officer (COO)',
    bio: 'An Information Technology professional from Takoradi Technical University responsible for overseeing daily operations, logistics coordination, and ensuring smooth service delivery across the FirstChoice Express network.',
    tags: ['Operations', 'Logistics', 'Management'],
    colorKey: 'yellow',
    social: { linkedin: '#' },
  },

  {
  initials: 'CN',
  name: 'Collins Narh',
  role: 'Project Coordinator (PC)',
  bio: 'A dedicated member of the FirstChoice Express team who plays a key role in driving the project forward. Collins helps coordinate activities, supports team operations, and ensures plans are turned into action as the company continues to grow.',
  tags: ['Coordination', 'Execution', 'Team Support'],
  colorKey: 'black',
  social: { linkedin: '#' },
},

  {
    initials: 'AL',
    name: 'Augustine Love',
    role: 'Chief Technology Officer (CTO)',
    bio: "A Computer Science graduate from the University of Ghana and the lead architect behind the FirstChoice Express platform. Augustine designed and developed the mobile apps, backend infrastructure, and web systems that power the company's services.",
    tags: ['Flutter', 'Node.js', 'System Architecture'],
    colorKey: 'amber',
    social: { github: 'AugustineLove', linkedin: '#' },
  },

  {
  initials: 'IB',
  name: 'Isaac Brace',
  role: 'Head of Sales & Marketing (HoS)',
  bio: 'A Business Administration student at Takoradi Technical University with a passion for entrepreneurship and brand growth. Isaac leads sales and marketing initiatives, helping expand FirstChoice Express through customer engagement, strategic campaigns, and strong relationships with local businesses.',
  tags: ['Sales', 'Marketing', 'Business Development'],
  colorKey: 'blue',
  social: { linkedin: '#' },
}, {
  initials: "BB",
  name: 'Brace Benedict',
  role: 'Logistics Manger (LM)',
  bio: 'As the Logistic Manger, Brace Benedict oversee the coordination of deliveries to ensure orders are picked up and delivered efficiently and on time. Brace Benedict mange delivery schedules, optimize personnel, monitor logistics operation and work to ensure customers recieve reliable and timely service while maintaining high operational standards.',
  tags:['Smart Delivery', 'On Time Delivery', 'Fast And Reliable'],
  colorKey:'red',
  social: { instagram: 'paa_krah'},
} 
];

const VALUES = [
  {
    icon: '',
    title: 'Community First',
    desc: 'Every decision starts with what is best for the communities we serve. We\'re not building for investors — we\'re building for Agona Nkwanta.',
  },
  {
    icon: '',
    title: 'Speed & Reliability',
    desc: 'We measure ourselves on minutes, not hours. A delivery promise is sacred — and we build systems that keep it.',
  },
  {
    icon: '',
    title: 'Fair for Everyone',
    desc: 'Riders earn fairly. Vendors grow profitably. Customers get honest prices. No winner takes all — the whole ecosystem thrives together.',
  },
  {
    icon: '',
    title: 'Radical Transparency',
    desc: 'No hidden fees, no surprise charges. We tell vendors exactly what they pay, and riders exactly what they earn.',
  },
];

const TIMELINE = [
  { year: 'Jan 2025', label: 'Idea Born', desc: 'We sketched FirstChoice on a notebook at a small shop in Agona Nkwanta.' },
  { year: 'June 2026', label: 'First Rider', desc: '3 riders. 12 orders in week one. Delivered every single one on time.' },
  { year: 'July 2026', label: 'Platform Launch', desc: 'We shipped the full app. Vendors start getting digital orders for the first time.' },
  { year: 'August 2026', label: '30+ Vendors', desc: 'We hoping half the town\'s businesses will be on FirstChoice. 200+ deliveries to be completed.' },
  { year: '2026 Ending', label: 'Expansion', desc: 'Adjacent towns. Smarter dispatch. Inter-town delivery routes go live.' },
];

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function SectionHeader({ label, title, sub, center = true, theme }) {
  return (
    <div style={{ textAlign: center ? 'center' : 'left', marginBottom: 52 }}>
      <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: theme.green, marginBottom: 10 }}>
        {label}
      </p>
      <h2 style={{ fontSize: 'clamp(28px,4vw,40px)', fontWeight: 900, color: theme.dark, lineHeight: 1.1, marginBottom: 14 }}>
        {title}
      </h2>
      {sub && (
        <p style={{ fontSize: 16, color: theme.muted, lineHeight: 1.75, maxWidth: 560, margin: center ? '0 auto' : 0 }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function TeamCard({ member, theme }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        border: `1.5px solid ${hovered ? theme.greenLight : theme.border}`,
        borderRadius: 20,
        padding: '32px 28px',
        transition: 'all 0.3s',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: hovered ? `0 16px 40px rgba(0,0,0,0.09)` : '0 2px 8px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      {/* Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
        <div style={{
          width: 62, height: 62, borderRadius: '50%',
          background: theme[member.colorKey],
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontWeight: 800, color: '#fff',
          flexShrink: 0,
          boxShadow: `0 4px 14px ${theme[member.colorKey]}55`,
        }}>
          {member.initials}
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color: theme.dark }}>{member.name}</div>
          <div style={{ fontSize: 13, color: theme.green, fontWeight: 600, marginTop: 2 }}>{member.role}</div>
        </div>
      </div>

      {/* Bio */}
      <p style={{ fontSize: 14, color: theme.muted, lineHeight: 1.75, marginBottom: 18, flexGrow: 1 }}>
        {member.bio}
      </p>

      {/* Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
        {member.tags.map((tag) => (
          <span key={tag} style={{
            fontSize: 11, fontWeight: 700, padding: '4px 10px',
            background: theme.greenPale, color: theme.green, borderRadius: 50,
          }}>
            {tag}
          </span>
        ))}
      </div>

      {/* Social */}
      <div style={{ display: 'flex', gap: 8 }}>
        {member.social.linkedin && (
          <a href={member.social.linkedin} style={socialIconStyle(theme)}>in</a>
        )}
        {member.social.twitter && (
          <a href={member.social.twitter} style={socialIconStyle(theme)}>𝕏</a>
        )}
         {member.social.instagram && (
          <a href={`https://instagram.com/${member.social.instagram}`} target="_blank" rel="noopener noreferrer" class="text-pink-600 hover:text-pink-700 transition-colors duration-300 dynamic-layout-preset">
          <svg xmlns="http://w3.org" class="w-8 h-8" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
        </a>
        )}
        {member.social.github && (
          <a href={`https://github.com/${member.social.github}`} target="_blank" rel="noopener noreferrer" class="text-gray-800 hover:text-gray-600 transition-colors duration-200">
          <svg class="h-6 w-6" aria-hidden="true" fill="currentColor" viewBox="0 0 40 40">
            <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
          </svg>
          <span class="sr-only">GitHub Account</span>
        </a>

        )}
      </div>
    </div>
  );
}

function socialIconStyle(theme) {
  return {
    width: 30, height: 30, borderRadius: 8,
    background: theme.greenPale, color: theme.green,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, textDecoration: 'none',
    transition: 'all 0.2s',
  };
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const { theme } = useTheme();

  return (
    <>
      <Navbar />
    <div style={{ background: '#fff', paddingTop: 66 }}>

      {/* ── HERO ── */}
      <section style={{ padding: '80px 5% 72px', background: theme.greenXpale, position: 'relative', overflow: 'hidden' }}>
        {/* Decorative circle */}
        <div style={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          background: theme.green, opacity: 0.04,
          right: -150, top: -150, pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }} className="about-hero-grid">
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px',
              background: theme.greenPale, border: `1px solid ${theme.greenLight}`,
              borderRadius: 50, fontSize: 13, color: theme.green, fontWeight: 600, marginBottom: 22,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: theme.greenLight, display: 'inline-block' }} />
              Our Story
            </div>
            <h1 style={{ fontSize: 'clamp(34px,5vw,56px)', fontWeight: 900, lineHeight: 1.08, color: theme.dark, marginBottom: 22 }}>
              We're the team<br />
              <em style={{ fontStyle: 'normal', color: theme.green }}>rethinking local</em><br />
              commerce in Ghana.
            </h1>
            <p style={{ fontSize: 17, color: theme.muted, lineHeight: 1.8, maxWidth: 480 }}>
              FirstChoice started as a napkin sketch at a small shop in Agona Nkwanta. Today it's a growing team of builders, riders, and community operators on a mission to bring world-class logistics to every town in Ghana.
            </p>
          </div>

          {/* Stats block */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { num: '5', label: 'Core Team', sub: 'Builders & operators' },
              { num: '20+', label: 'Vendors', sub: 'On the platform' },
              { num: '5+', label: 'Active Riders', sub: 'Across all zones' },
              { num: '2026', label: 'Founded', sub: 'Agona Nkwanta, GH' },
            ].map((s) => (
              <div key={s.label} style={{
                background: '#fff', border: `1px solid ${theme.border}`,
                borderRadius: 16, padding: '24px 22px',
                transition: 'box-shadow 0.2s',
              }}>
                <div style={{ fontSize: 34, fontWeight: 900, color: theme.green, lineHeight: 1 }}>{s.num}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: theme.dark, marginTop: 6 }}>{s.label}</div>
                <div style={{ fontSize: 12, color: theme.muted, marginTop: 3 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <style>{`@media(max-width:768px){.about-hero-grid{grid-template-columns:1fr!important}}`}</style>
      </section>

      {/* ── ORIGIN STORY ── */}
      <section style={{ padding: '80px 5%', background: '#fff' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: theme.green, marginBottom: 14 }}>
            The Origin
          </p>
          <blockquote style={{
            fontSize: 'clamp(18px,2.5vw,24px)', fontWeight: 600, color: theme.dark,
            lineHeight: 1.65, borderLeft: 'none', margin: 0,
            padding: '0 0 28px',
          }}>
            "Every Saturday, I faced the exact same problem: I was starving, but living far from the market meant getting a good meal was an uphill battle. First Choice was born to solve my own craving—connecting people like me to the market, no matter how far away they live."
          </blockquote>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <div style={{
              width: 46, height: 46, borderRadius: '50%', background: theme.green,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 15, fontWeight: 800,
            }}>
              KS
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, color: theme.dark, fontSize: 14 }}>Kweku Stephens (Big God)</div>
              <div style={{ fontSize: 12, color: theme.muted }}>Co-Founder & CEO, FirstChoice</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TIMELINE ── */}
      <section style={{ padding: '80px 5%', background: theme.greenXpale }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <SectionHeader
            label="Our Journey"
            title={<>From Notebook to <em style={{ fontStyle: 'normal', color: theme.green }}>Platform</em></>}
            sub="The milestones that got us here."
            theme={theme}
          />
          <div style={{ position: 'relative', maxWidth: 820, margin: '0 auto' }}>
            {/* Vertical line */}
            <div style={{
              position: 'absolute', left: 28, top: 0, bottom: 0, width: 2,
              background: `linear-gradient(180deg, ${theme.greenLight}, ${theme.amberLight})`,
              borderRadius: 2,
            }} />
            {TIMELINE.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 28, marginBottom: 36, position: 'relative' }}>
                {/* Dot */}
                <div style={{
                  width: 58, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%',
                    background: i === TIMELINE.length - 1 ? theme.amberLight : theme.green,
                    border: `3px solid #fff`,
                    boxShadow: `0 0 0 3px ${theme.greenPale}`,
                    marginTop: 4, zIndex: 1,
                  }} />
                </div>
                {/* Content */}
                <div style={{
                  background: '#fff', borderRadius: 14, padding: '20px 24px',
                  border: `1px solid ${theme.border}`, flex: 1,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 10px',
                      background: theme.greenPale, color: theme.green, borderRadius: 50,
                    }}>
                      {item.year}
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: theme.dark }}>{item.label}</span>
                  </div>
                  <p style={{ fontSize: 14, color: theme.muted, lineHeight: 1.7, margin: 0 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM ── */}
      <section style={{ padding: '80px 5%', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <SectionHeader
            label="The Team"
            title={<>Meet the <em style={{ fontStyle: 'normal', color: theme.green }}>Builders</em></>}
            sub="Five people with one shared obsession: making local commerce work beautifully."
            theme={theme}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22 }} className="team-grid">
            {TEAM.map((member) => (
              <TeamCard key={member.name} member={member} theme={theme} />
            ))}
          </div>
        </div>
        <style>{`
          @media(max-width:900px){.team-grid{grid-template-columns:repeat(2,1fr)!important}}
          @media(max-width:580px){.team-grid{grid-template-columns:1fr!important}}
        `}</style>
      </section>

      {/* ── VALUES ── */}
      <section style={{ padding: '80px 5%', background: theme.greenXpale }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <SectionHeader
            label="What We Stand For"
            title={<>Our <em style={{ fontStyle: 'normal', color: theme.green }}>Core Values</em></>}
            sub="Not just words on a wall these are the operating principles every team member lives by."
            theme={theme}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }} className="values-grid">
            {VALUES.map((v) => (
              <div
                key={v.title}
                style={{
                  background: '#fff', border: `1px solid ${theme.border}`,
                  borderRadius: 16, padding: '28px 22px',
                  transition: 'transform 0.25s, box-shadow 0.25s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ fontSize: 32, marginBottom: 16 }}>{v.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: theme.dark, marginBottom: 10 }}>{v.title}</h3>
                <p style={{ fontSize: 13, color: theme.muted, lineHeight: 1.75 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <style>{`
          @media(max-width:900px){.values-grid{grid-template-columns:repeat(2,1fr)!important}}
          @media(max-width:520px){.values-grid{grid-template-columns:1fr!important}}
        `}</style>
      </section>

      {/* ── JOIN US CTA ── */}
      <section style={{ padding: '80px 5%', background: theme.dark, textAlign: 'center' }}>
        <div style={{ maxWidth: 660, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 900, color: '#fff', marginBottom: 14 }}>
            Want to Join the <em style={{ fontStyle: 'normal', color: theme.greenLight }}>Team</em>?
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.62)', lineHeight: 1.75, marginBottom: 36 }}>
            We're always looking for people who care deeply about local communities and want to build things that matter. Come ride with us.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <button style={{
              padding: '14px 30px', background: theme.greenLight, color: '#fff',
              border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
              fontFamily: 'inherit', cursor: 'pointer',
            }}>
              View Open Roles →
            </button>
            <a href="/contact" style={{
              padding: '14px 30px', background: 'none',
              border: '1.5px solid rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.85)',
              borderRadius: 10, fontSize: 15, fontWeight: 600,
              fontFamily: 'inherit', cursor: 'pointer', textDecoration: 'none',
              display: 'inline-block',
            }}>
              Get in Touch
            </a>
          </div>
        </div>
      </section>

    </div>
    </>
  );
}