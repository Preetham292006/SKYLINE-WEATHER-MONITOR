import { ArrowDown, ArrowRight, CheckCircle2, Database, MapPin, Router, Server, Waypoints } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import Panel from '../components/Panel.jsx'
import { formatCount } from '../data/displayData.js'
import { useAppData } from '../hooks/useAppData.js'

function ShardsPage() {
  const { stations, regions, stats } = useAppData()
  const totalReadings = stats.totalReadings
  return (
    <>
      <PageHeader eyebrow="CASE STUDY · DATA ARCHITECTURE" title="Regional data partitions" description="Follow weather readings from remote stations into their logical regional collections." actions={<span className="architecture-tag"><Database size={14} /> Logical partitioning</span>} />
      <div className="disclaimer-banner"><span className="disclaimer-icon"><Waypoints size={18} /></span><div><strong>Academic architecture demonstration</strong><p>These are region-routed collections in one logical database design—not an actual production MongoDB sharded cluster.</p></div></div>
      <Panel title="How regional routing works" subtitle="Each reading is routed by its configured geographic region">
        <div className="architecture-flow">
          <div className="flow-source"><div className="flow-icon"><MapPin size={20} /></div><strong>Weather stations</strong><small>{stations.length} remote sensors</small></div>
          <div className="flow-connector"><span /><ArrowRight size={16} /></div>
          <div className="flow-source"><div className="flow-icon flow-indigo"><Server size={20} /></div><strong>API server</strong><small>Validates station payload</small></div>
          <div className="flow-connector"><span /><ArrowRight size={16} /></div>
          <div className="flow-source"><div className="flow-icon flow-purple"><Router size={20} /></div><strong>Region router</strong><small>Maps region to collection</small></div>
          <div className="flow-branch"><div className="branch-stem" /><div className="branch-arrow"><ArrowDown size={15} /></div></div>
          <div className="flow-collections">{regions.map((region) => <div className="collection-node" key={region.id}><span className="collection-dot" style={{ background: region.color }} /><span><strong>{region.name} collection</strong><small>{region.collection}</small></span><CheckCircle2 size={16} className="collection-check" /></div>)}</div>
        </div>
        <div className="flow-caption">Routing decision: <code>region → weather_readings_&lt;region&gt;</code></div>
      </Panel>
      <div className="shard-overview">
        <div className="shard-total-card"><span className="summary-icon"><Database size={18} /></span><span>Total logical readings</span><strong>{formatCount(totalReadings)}</strong><small>Across {regions.length} regional collections</small></div>
        <div className="shard-total-card"><span className="summary-icon summary-indigo"><MapPin size={18} /></span><span>Stations routed</span><strong>{stations.length}</strong><small>Distributed across 4 regions</small></div>
      </div>
      <div className="region-card-grid">
        {regions.map((region) => (
          <article className="region-card" key={region.id}>
            <div className="region-card-header"><span className="region-symbol" style={{ color: region.color, background: `${region.color}16` }}><Database size={18} /></span><span className={`region-status ${region.status === 'Operational' ? 'region-ok' : region.status === 'No stations' ? 'region-empty' : 'region-degraded'}`}><i />{region.status}</span></div>
            <p className="region-id">REGION_ID · {region.id.toUpperCase()}</p>
            <h2>{region.name}</h2>
            <code className="collection-name">{region.collection}</code>
            <div className="region-stats"><div><span>Weather stations</span><strong>{region.stationCount}</strong></div><div><span>Stored readings</span><strong>{formatCount(region.readings)}</strong></div></div>
            <div className="partition-progress"><div><span>Data distribution</span><strong>{region.share}%</strong></div><span className="progress-track"><i style={{ width: `${region.share}%`, background: region.color }} /></span></div>
            <div className="region-card-footer"><span><i style={{ background: region.color }} />{region.activeCount}/{region.stationCount} stations active</span><span>{region.share}% of total</span></div>
          </article>
        ))}
      </div>
      <div className="disclaimer-footnote"><Database size={15} /><span>Collections represent application-level logical partitions. Physical storage, replication, and native MongoDB sharding are not configured in this demonstration.</span></div>
    </>
  )
}

export default ShardsPage
