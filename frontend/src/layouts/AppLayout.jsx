import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity, Bell, CalendarClock, ChevronDown, CloudSun, Command, Database, LayoutDashboard,
  MapPinned, Menu, Search, Settings, ShieldAlert, Waypoints, X,
} from 'lucide-react'
import { useAppData } from '../hooks/useAppData.js'
import { regionDefinitions } from '../data/mockData.js'

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Weather stations', path: '/stations', icon: MapPinned },
  { label: 'Live monitoring', path: '/monitoring', icon: Activity },
  { label: 'Regional shards', path: '/shards', icon: Database },
  { label: 'Analytics', path: '/analytics', icon: CloudSun },
  { label: 'Geographical analytics', path: '/geographical-analytics', icon: Waypoints },
  { label: 'Alerts', path: '/alerts', icon: ShieldAlert },
]

const initialClock = Date.now()

function AppLayout() {
  const { stations, alerts, theme, source, loadError, loading, refresh } = useAppData()
  const [clock, setClock] = useState(initialClock)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const searchInput = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const page = navItems.find((item) => item.path === location.pathname)
  const title = page?.label || 'Settings'
  const offlineCount = stations.filter((station) => station.status === 'offline').length
  const results = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return []
    return stations.filter((station) => `${station.name} ${station.id} ${station.city}`.toLowerCase().includes(query)).slice(0, 5)
  }, [search, stations])
  const pendingAlerts = alerts.filter((alert) => !alert.resolved).slice(0, 3)
  const dateTimeLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(clock)

  useEffect(() => {
    const intervalId = window.setInterval(() => setClock(Date.now()), 30_000)
    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    if (searchOpen) searchInput.current?.focus()
  }, [searchOpen])

  function selectStation(station) {
    setSearch(station.name)
    setSearchOpen(false)
    navigate('/stations', { state: { stationId: station.id } })
  }

  return (
    <div className={`app-frame theme-${theme}`}>
      {mobileOpen && <button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-lockup"><div className="brand-mark"><CloudSun size={21} /></div><div><strong>SKYLINE</strong><span>WEATHER INTELLIGENCE</span></div><button className="mobile-close icon-button" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18} /></button></div>
        <div className="workspace-switch"><span className="workspace-icon">S</span><span><strong>Skyline Research</strong><small>Academic workspace</small></span><ChevronDown size={15} /></div>
        <p className="nav-caption">WORKSPACE</p>
        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map(({ label, path, icon: Icon, badge }) => {
            const itemBadge = path === '/alerts' ? alerts.filter((alert) => !alert.resolved).length : badge
            return (
              <NavLink key={path} to={path} end={path === '/'} className={({ isActive }) => `nav-link ${isActive ? 'nav-active' : ''}`} onClick={() => setMobileOpen(false)}>
                <Icon size={18} strokeWidth={1.8} /><span>{label}</span>{itemBadge > 0 && <small className="nav-badge">{itemBadge}</small>}
              </NavLink>
            )
          })}
        </nav>
        <p className="nav-caption nav-caption-data">DATA LAYER</p>
        <div className="sidebar-region-list">
          {regionDefinitions.map((region) => (
            <div className="sidebar-region" key={region.id}><i style={{ background: region.color }} /><span>{region.name}</span><small>{stations.filter((station) => station.region === region.id).length}</small></div>
          ))}
        </div>
        <div className="sidebar-bottom">
          <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'nav-active' : ''}`} onClick={() => setMobileOpen(false)}><Settings size={18} /><span>Settings</span></NavLink>
          <div className="sidebar-note"><span className="pulse-dot" />{offlineCount ? 'Network attention needed' : 'All systems operational'}<small>{stations.length - offlineCount}/{stations.length} reporting · {loading ? 'connecting' : source === 'database' ? 'MongoDB data' : 'demo data'}</small></div>
          <div className="profile-mini"><div className="avatar">JD</div><span><strong>Jordan Davis</strong><small>Administrator</small></span><ChevronDown size={15} /></div>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-left"><button className="mobile-menu icon-button" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={20} /></button><div className="breadcrumb"><span>Workspace</span><b>/</b><strong>{title}</strong></div><div className="topbar-time"><CalendarClock size={14} /><span>{dateTimeLabel}</span></div></div>
          <div className="topbar-tools">
            <button className="mobile-search-trigger icon-button" onClick={() => { setSearchOpen(true); setNotificationsOpen(false) }} aria-label="Open station search"><Search size={17} /></button>
            <div className={`global-search ${searchOpen ? 'search-focused' : ''}`}>
              <Search size={16} /><input ref={searchInput} value={search} onFocus={() => setSearchOpen(true)} onChange={(event) => { setSearch(event.target.value); setSearchOpen(true) }} onKeyDown={(event) => event.key === 'Escape' && setSearchOpen(false)} placeholder="Search stations..." aria-label="Search stations" /><kbd><Command size={11} /> K</kbd>
              {searchOpen && search && <div className="search-results">{results.length ? results.map((station) => <button key={station.id} onMouseDown={(event) => event.preventDefault()} onClick={() => selectStation(station)}><span className="station-avatar">{station.name[0]}</span><span><strong>{station.name}</strong><small>{station.id} · {station.city}</small></span></button>) : <div className="search-empty">No stations match “{search}”</div>}</div>}
            </div>
            <div className="topbar-popover-wrap">
              <button className={`icon-button notification-button ${notificationsOpen ? 'button-selected' : ''}`} aria-label="Notifications" onClick={() => { setNotificationsOpen(!notificationsOpen); setSearchOpen(false) }}><Bell size={18} /><i /></button>
              {notificationsOpen && <div className="notification-popover"><div className="popover-head"><strong>Notifications</strong><span>{pendingAlerts.length} new</span></div>{pendingAlerts.map((alert) => <div className="notification-item" key={alert.id}><i className={`severity-dot severity-${alert.severity}`} /><span><strong>{alert.title}</strong><small>{alert.stationName} · {alert.minutesAgo}m ago</small></span></div>)}<button className="popover-link" onClick={() => { navigate('/alerts'); setNotificationsOpen(false) }}>View all alerts</button></div>}
            </div>
            <div className="topbar-divider" />
            <div className="topbar-user"><div className="avatar">JD</div><span><strong>Jordan Davis</strong><small>Admin</small></span></div>
          </div>
        </header>
        <main className="page-content" onClick={() => { if (searchOpen) setSearchOpen(false) }}>
          {loadError && <div className="data-status data-status-warning" role="status"><span><strong>{source === 'demo' ? 'Demo data active' : 'Data request failed'}</strong><small>{loadError}</small></span><button onClick={refresh} disabled={loading}>{loading ? 'Connecting…' : 'Retry connection'}</button></div>}
          {!loadError && source === 'database' && <div className="data-status data-status-live"><span><strong>MongoDB connected</strong><small>Live application data · regional collections</small></span><i /> </div>}
          {loading && <div className="data-loading" role="status"><span />Refreshing database data…</div>}
          <Outlet />
          <footer className="app-footer"><span>SKYLINE Weather Intelligence</span><span>Academic case study · logical regional partitioning</span></footer>
        </main>
      </div>
    </div>
  )
}

export default AppLayout
