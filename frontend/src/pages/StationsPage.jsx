import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MapPin, Plus, Search, SlidersHorizontal } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import Panel from '../components/Panel.jsx'
import StationTable from '../components/StationTable.jsx'
import StationModal from '../components/StationModal.jsx'
import { regionDefinitions } from '../data/displayData.js'
import { useAppData } from '../hooks/useAppData.js'

function StationsPage() {
  const { stations, addStation } = useAppData()
  const location = useLocation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState('all')
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState(() => stations.find((station) => station.id === location.state?.stationId) || null)
  const [adding, setAdding] = useState(false)
  useEffect(() => {
    if (location.state?.stationId) navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate])
  const items = useMemo(() => stations.filter((station) => {
    const matchesText = `${station.name} ${station.id} ${station.city}`.toLowerCase().includes(query.toLowerCase())
    return matchesText && (region === 'all' || station.region === region) && (status === 'all' || station.status === status)
  }), [stations, query, region, status])
  const online = stations.filter((station) => station.status === 'online').length
  const warning = stations.filter((station) => station.status === 'warning').length

  async function handleAddStation(details) {
    if (await addStation(details)) setAdding(false)
  }

  return (
    <>
      <PageHeader eyebrow="NETWORK MANAGEMENT" title="Weather stations" description="Manage, search, and inspect telemetry across your distributed station network." actions={<button className="button button-primary" onClick={() => setAdding(true)}><Plus size={16} /> Add station</button>} />
      <div className="station-summary">
        <span><i className="summary-dot dot-online" /><strong>{online}</strong> online</span>
        <span><i className="summary-dot dot-warning" /><strong>{warning}</strong> warning</span>
        <span><i className="summary-dot dot-offline" /><strong>{stations.length - online - warning}</strong> offline</span>
        <span className="summary-total"><MapPin size={14} /> {stations.length} stations total</span>
      </div>
      <Panel className="station-panel">
        <div className="toolbar">
          <label className="filter-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, station ID, or location" /></label>
          <div className="filter-control"><SlidersHorizontal size={15} /><select aria-label="Filter by region" value={region} onChange={(event) => setRegion(event.target.value)}><option value="all">All regions</option>{regionDefinitions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
          <select className="filter-select" aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="online">Online</option><option value="warning">Warning</option><option value="offline">Offline</option></select>
        </div>
        <div className="result-count">Showing <strong>{items.length}</strong> of {stations.length} stations</div>
        <StationTable items={items} onSelect={setSelected} />
      </Panel>
      {selected && <StationModal station={selected} onClose={() => setSelected(null)} />}
      {adding && <StationModal onAdd={handleAddStation} onClose={() => setAdding(false)} />}
    </>
  )
}

export default StationsPage
