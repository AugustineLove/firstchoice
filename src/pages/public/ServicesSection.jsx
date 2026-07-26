const SERVICES = [
  {
    icon: '🏪',
    title: 'Marketplace Ordering',
    desc: 'Browse and order from food vendors, pharmacies, grocery stores, boutiques, and more. Full menus, live availability, real-time order tracking.',
    tag: 'Customers & Vendors',
    style: { background: 'var(--dark)', color: 'white' },
    tagStyle: { background: 'rgba(255,255,255,0.18)', color: 'white' },
  },
  {
    icon: '📦',
    title: 'Package Delivery',
    desc: 'Send parcels, documents, and packages across town. Instant pickup, transparent pricing, live rider tracking, and proof of delivery.',
    tag: 'Door-to-Door',
    style: { background: 'var(--fg-xpale)' },
    tagStyle: { background: 'var(--fg-pale)', color: 'var(--fg)' },
  },
  {
    icon: '🛒',
    title: 'Errand Services',
    desc: "Need something bought, picked up, or dropped off? Send a rider to handle personal errands while you focus on what matters.",
    tag: 'Personal Errands',
    style: { background: '#fff8f3' },
    tagStyle: { background: 'rgba(244,162,97,0.15)', color: '#c2652a' },
  },
  {
    icon: '📊',
    title: 'Vendor Commerce Tools',
    desc: 'A complete dashboard for local businesses — manage products, receive orders, track sales, view analytics, and grow your customer base digitally.',
    tag: 'Business Tools',
    style: { background: 'var(--dark)', color: 'white' },
    tagStyle: { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' },
  },
]

export default function ServicesSection() {
  return (
    <section id="services" className="py-24 px-[5%]">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <p className="section-label">What We Offer</p>
          <h2 className="section-title">
            Everything <em>Local Commerce</em><br className="hidden md:block" /> Needs in One Platform
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
          {SERVICES.map(s => (
            <div
              key={s.title}
              className="rounded-2xl p-9 relative overflow-hidden transition-transform duration-200 hover:-translate-y-1"
              style={s.style}
            >
              <div className="text-4xl mb-5">{s.icon}</div>
              <h3 className="font-display text-2xl font-bold mb-2.5">{s.title}</h3>
              <p className="text-sm leading-relaxed mb-5" style={{ opacity: 0.8 }}>{s.desc}</p>
              <span className="inline-block text-xs font-semibold px-3.5 py-1 rounded-full" style={s.tagStyle}>
                {s.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}