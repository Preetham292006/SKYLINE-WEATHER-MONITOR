import { useMemo, useState } from 'react'
import { Check, CheckCheck, CircleAlert, Filter, ShieldAlert } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import Panel from '../components/Panel.jsx'
import { regionDefinitions, timeAgo } from '../data/displayData.js'
import { useAppData } from '../hooks/useAppData.js'

const severityCopy = { critical: 'Critical', warning: 'Warning', information: 'Information' }

function AlertsPage() {
  const { alerts, resolveAlert, resolveAllAlerts } = useAppData()
  const [filter, setFilter] = useState('all')
  const visible = useMemo(() => alerts.filter((alert) => filter === 'all' || (filter === 'unresolved' ? !alert.resolved : alert.severity === filter)), [alerts, filter])
  const unresolvedCount = alerts.filter((alert) => !alert.resolved).length

  return (
    <>
      <PageHeader eyebrow="NETWORK HEALTH" title="Alerts" description="Review weather thresholds and station connectivity notifications." actions={unresolvedCount > 0 && <button className="button button-quiet" onClick={resolveAllAlerts}><CheckCheck size={16} /> Resolve all</button>} />
      <div className="alert-summary-grid">
        <div className="alert-summary-card"><span className="severity-icon critical-icon"><CircleAlert size={18} /></span><span><strong>{alerts.filter((alert) => alert.severity === 'critical' && !alert.resolved).length}</strong><small>Critical</small></span></div>
        <div className="alert-summary-card"><span className="severity-icon warning-icon"><ShieldAlert size={18} /></span><span><strong>{alerts.filter((alert) => alert.severity === 'warning' && !alert.resolved).length}</strong><small>Warnings</small></span></div>
        <div className="alert-summary-card"><span className="severity-icon info-icon"><CircleAlert size={18} /></span><span><strong>{alerts.filter((alert) => alert.severity === 'information' && !alert.resolved).length}</strong><small>Information</small></span></div>
        <div className="alert-summary-card"><span className="severity-icon resolved-icon"><Check size={18} /></span><span><strong>{alerts.filter((alert) => alert.resolved).length}</strong><small>Resolved</small></span></div>
      </div>
      <Panel title="Alert activity" subtitle={`${unresolvedCount} unresolved notifications`} action={<div className="filter-control"><Filter size={14} /><select aria-label="Filter alerts" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All alerts</option><option value="unresolved">Unresolved</option><option value="critical">Critical</option><option value="warning">Warning</option><option value="information">Information</option></select></div>}>
        {visible.length ? <div className="alert-list">{visible.map((alert) => {
          const region = regionDefinitions.find((item) => item.id === alert.region)
          return <article className={`alert-row ${alert.resolved ? 'alert-resolved' : ''}`} key={alert.id}>
            <span className={`alert-severity-symbol severity-${alert.severity}`}><CircleAlert size={17} /></span>
            <div className="alert-content"><div className="alert-title-line"><h3>{alert.title}</h3><span className={`severity-badge severity-badge-${alert.severity}`}>{severityCopy[alert.severity]}</span>{alert.resolved && <span className="resolved-badge">Resolved</span>}</div><p>{alert.detail}</p><div className="alert-meta"><span>{alert.stationName}</span><span>·</span><span>{alert.stationId}</span><span>·</span><span className="region-label"><i style={{ background: region?.color }} />{region?.name}</span><span>·</span><span>{timeAgo(alert.minutesAgo)}</span></div></div>
            {!alert.resolved && <button className="resolve-button" onClick={() => resolveAlert(alert.id)}><Check size={14} /> Resolve</button>}
          </article>
        })}</div> : <div className="empty-state"><ShieldAlert size={24} /><strong>No alerts in this view</strong><span>Choose a different filter to see more notifications.</span></div>}
      </Panel>
    </>
  )
}

export default AlertsPage
