import { useNavigate } from 'react-router-dom'

const NAV = [
  { section: 'Main' },
  { id: 'overview',   label: 'Overview',       icon: '📊', badge: null },
  { id: 'orders',     label: 'Orders',          icon: '📦', badge: 12   },
  { id: 'riders',     label: 'Riders',          icon: '🛵', badge: null },
  { id: 'vendors',    label: 'Vendors',         icon: '🏪', badge: null },
  { section: 'Management' },
  { id: 'customers',  label: 'Customers',       icon: '👥', badge: null },
  { id: 'dispatch',   label: 'Dispatch',        icon: '📍', badge: null },
  { id: 'payments',   label: 'Payments',        icon: '💰', badge: null },
  { section: 'System' },
  { id: 'analytics',  label: 'Analytics',       icon: '📈', badge: null },
  { id: 'settings',   label: 'Settings',        icon: '⚙️', badge: null },
]

export default function AdminSidebar({ activeTab, setActiveTab }) {
  const navigate = useNavigate()

  return (
    <aside className="bg-forest flex flex-col" style={{ minHeight: '100vh' }}>
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-black text-lg text-white"
               style={{ background: 'rgba(255,255,255,0.2)' }}>
            F
          </div>
          <div>
            <div className="font-display text-lg font-bold text-white leading-tight">FirstChoice</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'DM Sans', sans-serif" }}>
              Admin Dashboard
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {NAV.map((item, i) => {
          if (item.section) {
            return (
              <p key={i} className="text-xs font-semibold uppercase tracking-widest px-2.5 pt-4 pb-1.5"
                 style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.12em' }}>
                {item.section}
              </p>
            )
          }
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-0.5 text-left transition-all duration-150 cursor-pointer border-0"
              style={{
                background: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
                color: isActive ? 'white' : 'rgba(255,255,255,0.7)',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                fontWeight: 500,
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="text-white text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--accent)', fontSize: 10 }}>
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Profile + back */}
      <div className="px-4 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
        <button
          onClick={() => navigate('/')}
          className="w-full text-xs text-center mb-3 cursor-pointer border-0 bg-transparent transition-colors"
          style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'DM Sans', sans-serif" }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--fg-light)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
        >
          ← Back to Website
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
               style={{ background: 'var(--fg-light)', color: 'var(--fg)' }}>
            SA
          </div>
          <div>
            <div className="text-white text-sm font-medium" style={{ fontFamily: "'DM Sans', sans-serif" }}>Super Admin</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'DM Sans', sans-serif" }}>System Administrator</div>
          </div>
        </div>
      </div>
    </aside>
  )
}