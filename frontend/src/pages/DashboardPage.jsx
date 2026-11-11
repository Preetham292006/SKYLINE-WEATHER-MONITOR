import { Activity, CloudRain, Droplets, MapPin, Radio, Thermometer, Wind, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import Panel from '../components/Panel.jsx'
import MetricCard from '../components/MetricCard.jsx'
import { HumidityChart, ReadingsChart, TemperatureChart } from '../components/WeatherCharts.jsx'
import { StatusBadge } from '../components/StationTable.jsx'
import { formatCount, regionDefinitions, timeAgo } from '../data/displayData.js'
import { useAppData } from '../hooks/useAppData.js'

const dashboardDateLabel = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
}).format(new Date())

function DashboardPage() {
  const { regions, stats, overview, trends, source } = useAppData()
  const recentStations = overview.recentStations.slice(0, 5)
  const totalHourlyReadings = trends.reduce((total, point) => total + point.readings, 0)
  const hasReadings = stats.totalReadings > 0
  const hasReadingProvenance = Number.isFinite(stats.seededDemoReadings)
    && Number.isFinite(stats.monitoringSimulationReadings)
    && Number.isFinite(stats.unverifiedReadings)

  return (
    <>
      <PageHeader eyebrow={dashboardDateLabel} title="Weather Intelligence Overview" description="A clear view of station and regional data returned by the configured database." actions={<span className="live-pill"><i /> {source === 'database' ? 'Database-backed' : 'Waiting for API'}</span>} />
      <div className="metric-grid metric-grid-four">
        <MetricCard label="Total stations" value={stats.totalStations} unit="" icon={MapPin} tone="blue" footnote="Across configured logical regions" />
        <MetricCard label="Active stations" value={`${stats.activeStations} / ${stats.totalStations}`} unit="" icon={Radio} tone="green" footnote="Not marked offline in the database" />
        <MetricCard label="Total readings" value={formatCount(stats.totalReadings)} unit="" icon={Activity} tone="purple" footnote={hasReadingProvenance ? `${formatCount(stats.seededDemoReadings)} seeded demo · ${formatCount(stats.monitoringSimulationReadings)} generated simulation · ${formatCount(stats.unverifiedReadings)} unverified` : 'Reading provenance counts unavailable'} />
        <MetricCard label="Geographic regions" value={regions.length} unit="" icon={MapPin} tone="amber" footnote="Logical data partitions" />
      </div>

      <div className="section-label"><span>DATABASE WEATHER SUMMARY</span><i /> Averages use stored readings</div>
      <div className="metric-grid metric-grid-four metric-grid-weather">
        <MetricCard label="Avg. temperature" value={hasReadings ? stats.averageTemperature.toFixed(1) : '—'} unit={hasReadings ? '°C' : ''} icon={Thermometer} tone="blue" footnote="Across stored weather readings" />
        <MetricCard label="Avg. humidity" value={hasReadings ? Math.round(stats.averageHumidity) : '—'} unit={hasReadings ? '%' : ''} icon={Droplets} tone="purple" footnote="Across stored weather readings" />
        <MetricCard label="Avg. wind speed" value={hasReadings ? stats.averageWindSpeed.toFixed(1) : '—'} unit={hasReadings ? 'm/s' : ''} icon={Wind} tone="green" footnote="Across stored weather readings" />
        <MetricCard label="Avg. rainfall" value={hasReadings ? stats.averageRainfall.toFixed(1) : '—'} unit={hasReadings ? 'mm' : ''} icon={CloudRain} tone="amber" footnote="Across stored weather readings" />
      </div>

      <div className="dashboard-grid dashboard-grid-charts">
        <Panel title="Temperature trends" subtitle="Network average · last 24 hours" action={<span className="chart-legend"><i />Temperature °C</span>}>
          <TemperatureChart data={trends} compact />
        </Panel>
        <Panel title="Humidity levels" subtitle="Relative humidity · last 24 hours" action={<span className="chart-legend legend-purple"><i />Humidity %</span>}>
          <HumidityChart data={trends} compact />
        </Panel>
      </div>

      <div className="dashboard-grid dashboard-grid-lower">
        <Panel title="Regional distribution" subtitle="Logical partition activity" action={<Link className="text-link" to="/shards">Explore regions <ChevronRight size={14} /></Link>}>
          <div className="region-distribution">
            {regions.map((region) => (
              <div className="distribution-row" key={region.id}>
                <div className="distribution-top"><span><i style={{ background: region.color }} />{region.name}</span><strong>{region.stationCount} stations</strong></div>
                <div className="progress-track"><span style={{ width: `${region.share}%`, background: region.color }} /></div>
                <div className="distribution-bottom"><span>{formatCount(region.readings)} readings</span><span>{region.share}% of data</span></div>
              </div>
            ))}
          </div>
          <div className="partition-callout"><span className="callout-icon"><Activity size={15} /></span><span>Application-level regional collections<small>Not a production MongoDB sharded cluster</small></span></div>
        </Panel>
        <Panel title="Readings over time" subtitle="Incoming station records · last 24 hours" action={<span className="panel-kicker">{formatCount(totalHourlyReadings)} records</span>}>
          <ReadingsChart data={trends} />
        </Panel>
      </div>

      <Panel title="Recent station activity" subtitle="Latest telemetry from across the network" action={<Link className="text-link" to="/stations">View all stations <ChevronRight size={14} /></Link>}>
        {recentStations.length ? <div className="activity-list">
          {recentStations.map((station) => {
            const region = regionDefinitions.find((item) => item.id === station.region)
            return <div className="activity-row" key={station.id}><span className="station-avatar">{station.name[0]}</span><span className="activity-station"><strong>{station.name}</strong><small>{station.id} · {station.city}</small></span><span className="region-label"><i style={{ background: region?.color }} />{region?.name}</span><span className="activity-reading">{station.hasReading ? `${station.temperature.toFixed(1)}°C` : 'No reading'} <small>{station.hasReading ? `${station.humidity}% RH` : '—'}</small></span><StatusBadge status={station.status} /><span className="table-muted">{timeAgo(station.minutesAgo)}</span></div>
          })}
        </div> : <div className="empty-state"><Activity size={24} /><strong>No station activity available</strong><span>The database has not returned any weather stations yet.</span></div>}
      </Panel>
    </>
  )
}

export default DashboardPage
