import { MapPin } from 'lucide-react'
import { regionDefinitions, timeAgo } from '../data/displayData.js'

function StatusBadge({ status }) {
  const label = status === 'online' ? 'Online' : status === 'offline' ? 'Offline' : 'Warning'
  return <span className={`status-badge status-${status}`}><span />{label}</span>
}

function StationTable({ items, onSelect }) {
  if (!items.length) {
    return <div className="empty-state"><MapPin size={24} /><strong>No stations found</strong><span>No database stations match the current search or filters.</span></div>
  }

  return (
    <div className="table-scroll">
      <table className="station-table">
        <thead>
          <tr><th>Station</th><th>Region</th><th>Temperature</th><th>Humidity</th><th>Status</th><th>Last reading</th><th /></tr>
        </thead>
        <tbody>
          {items.map((station) => {
            const region = regionDefinitions.find((item) => item.id === station.region)
            return (
              <tr key={station.id} onClick={() => onSelect?.(station)} tabIndex={onSelect ? 0 : undefined} onKeyDown={(event) => event.key === 'Enter' && onSelect?.(station)}>
                <td><div className="station-cell"><span className="station-avatar">{station.name.slice(0, 1)}</span><span><strong>{station.name}</strong><small>{station.id}</small></span></div></td>
                <td><span className="region-label"><i style={{ background: region?.color }} />{region?.name}</span><small className="table-subtext">{station.city}</small></td>
                <td className="table-value">{station.hasReading ? `${station.temperature.toFixed(1)}°C` : '—'}</td>
                <td className="table-value">{station.hasReading ? `${station.humidity}%` : '—'}</td>
                <td><StatusBadge status={station.status} /></td>
                <td className="table-muted">{timeAgo(station.minutesAgo)}{station.dataSource && <small className="table-subtext">{station.dataSource === 'seeded-demo' ? 'Seeded demonstration' : station.dataSource === 'monitoring-simulation' ? 'Simulated monitoring' : 'Unverified ingest'}</small>}</td>
                <td><span className="table-chevron">›</span></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export { StatusBadge }
export default StationTable
