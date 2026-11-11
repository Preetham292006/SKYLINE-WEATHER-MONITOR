import { useState } from 'react'
import { Bell, Check, CloudSun, Gauge, Palette, RotateCcw, Save, ShieldCheck, UserRound } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import Panel from '../components/Panel.jsx'
import { useAppData } from '../hooks/useAppData.js'

function Toggle({ checked, onChange, label }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`toggle ${checked ? 'toggle-on' : ''}`} onClick={() => onChange(!checked)}><i /></button>
}

function SettingsPage() {
  const { theme, setTheme, source } = useAppData()
  const [saved, setSaved] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [profile, setProfile] = useState({ name: 'Jordan Davis', email: 'jordan.davis@skyline.edu' })
  const [preferences, setPreferences] = useState({ email: true, push: true, criticalOnly: false, compact: false, refresh: '30', unit: 'celsius' })
  function update(key, value) {
    setSaved(false)
    setPreferences((current) => ({ ...current, [key]: value }))
  }
  function save() {
    localStorage.setItem('skyline-preferences', JSON.stringify(preferences))
    localStorage.setItem('skyline-theme', theme)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2500)
  }

  function saveProfile() {
    localStorage.setItem('skyline-profile', JSON.stringify(profile))
    setEditingProfile(false)
  }

  return (
    <>
      <PageHeader eyebrow="PREFERENCES" title="Settings" description="Personalize how SKYLINE presents and notifies you about network activity." actions={<button className="button button-primary" onClick={save}>{saved ? <Check size={16} /> : <Save size={16} />}{saved ? 'Saved' : 'Save changes'}</button>} />
      <div className="settings-layout">
        <div className="settings-main">
          <Panel title="Profile settings" subtitle="Your account information">
            <div className="settings-profile"><div className="profile-large">JD</div><div><strong>{profile.name}</strong><span>{profile.email}</span><small>Administrator · Skyline Research</small></div><button className="button button-quiet" onClick={() => editingProfile ? saveProfile() : setEditingProfile(true)}>{editingProfile ? 'Save profile' : 'Edit profile'}</button></div>
            <div className="settings-fields"><label>Display name<input value={profile.name} readOnly={!editingProfile} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} /></label><label>Email address<input type="email" value={profile.email} readOnly={!editingProfile} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} /></label></div>
          </Panel>
          <Panel title="Application preferences" subtitle="Choose how weather data is displayed">
            <div className="preference-row"><span className="preference-icon"><CloudSun size={17} /></span><span><strong>Temperature units</strong><small>Choose the unit used throughout your workspace</small></span><select value={preferences.unit} onChange={(event) => update('unit', event.target.value)}><option value="celsius">Celsius (°C)</option><option value="fahrenheit">Fahrenheit (°F)</option></select></div>
            <div className="preference-row"><span className="preference-icon"><Gauge size={17} /></span><span><strong>Dashboard density</strong><small>Use compact cards to fit more information</small></span><Toggle label="Compact dashboard cards" checked={preferences.compact} onChange={(value) => update('compact', value)} /></div>
            <div className="preference-row"><span className="preference-icon"><RotateCcw size={17} /></span><span><strong>Monitoring refresh interval</strong><small>How often simulated monitoring data refreshes</small></span><select value={preferences.refresh} onChange={(event) => update('refresh', event.target.value)}><option value="15">15 seconds</option><option value="30">30 seconds</option><option value="60">1 minute</option></select></div>
          </Panel>
          <Panel title="Theme settings" subtitle="Adjust the dashboard's dark color treatment">
            <div className="preference-row"><span className="preference-icon"><Palette size={17} /></span><span><strong>Dashboard theme</strong><small>Choose the surface tone used across the workspace</small></span><select aria-label="Dashboard theme" value={theme} onChange={(event) => setTheme(event.target.value)}><option value="navy">Deep navy</option><option value="slate">Slate blue</option></select></div>
          </Panel>
          <Panel title="Notification preferences" subtitle="Control which updates reach you">
            <div className="preference-row"><span className="preference-icon"><Bell size={17} /></span><span><strong>Email notifications</strong><small>Receive alerts at your account email</small></span><Toggle label="Email notifications" checked={preferences.email} onChange={(value) => update('email', value)} /></div>
            <div className="preference-row"><span className="preference-icon"><Bell size={17} /></span><span><strong>In-app notifications</strong><small>Show alerts in the SKYLINE notification center</small></span><Toggle label="In-app notifications" checked={preferences.push} onChange={(value) => update('push', value)} /></div>
            <div className="preference-row"><span className="preference-icon"><ShieldCheck size={17} /></span><span><strong>Critical alerts only</strong><small>Hide warning and informational alert notifications</small></span><Toggle label="Critical alerts only" checked={preferences.criticalOnly} onChange={(value) => update('criticalOnly', value)} /></div>
          </Panel>
        </div>
        <aside className="settings-side">
          <div className="settings-side-card"><span className="side-card-icon"><UserRound size={18} /></span><h3>Workspace access</h3><p>Your role has access to station management, monitoring, and regional data views.</p><span className="access-role">Administrator</span></div>
          <div className="settings-side-card"><span className="side-card-icon side-card-blue"><ShieldCheck size={18} /></span><h3>Data handling</h3><p>{source === 'database' ? 'Weather records are read from your configured MongoDB deployment. Simulated monitoring readings are clearly marked.' : 'MongoDB is unavailable. The dashboard is currently showing bundled sample data; changes are temporary until the database reconnects.'}</p><span className="access-role access-info">{source === 'database' ? 'MongoDB connected' : 'Local demo environment'}</span></div>
        </aside>
      </div>
    </>
  )
}

export default SettingsPage
