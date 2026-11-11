import { Activity, Droplets, Thermometer, TrendingUp } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import Panel from '../components/Panel.jsx'
import MetricCard from '../components/MetricCard.jsx'
import { HumidityChart, ReadingsChart, RegionalTemperatureChart, TemperatureChart } from '../components/WeatherCharts.jsx'
import { formatCount } from '../data/displayData.js'
import { useAppData } from '../hooks/useAppData.js'

function AnalyticsPage() {
  const { stations, regions: databaseRegions, stats, trends } = useAppData()
  const regions = databaseRegions.map((region) => ({
    ...region,
    shortName: region.name.replace(' Region', ''),
    stationList: stations.filter((station) => station.region === region.id),
  }))
  const activeStations = stations.filter((station) => station.status !== 'offline').length
  const onlineRatio = stations.length ? (activeStations / stations.length) * 100 : 0
  const hasReadings = stats.totalReadings > 0
  const hasReadingProvenance = Number.isFinite(stats.seededDemoReadings)

  return (
    <>
      <PageHeader eyebrow="NETWORK PERFORMANCE" title="Weather analytics" description="Compare environmental patterns and station activity across all logical regions." actions={<span className="date-range-label">Last 24 hours <TrendingUp size={14} /></span>} />
      <div className="metric-grid metric-grid-four">
        <MetricCard label="Network temperature" value={hasReadings ? stats.averageTemperature.toFixed(1) : '—'} unit={hasReadings ? '°C' : ''} icon={Thermometer} tone="blue" footnote="Average across stored readings" />
        <MetricCard label="Network humidity" value={hasReadings ? Math.round(stats.averageHumidity) : '—'} unit={hasReadings ? '%' : ''} icon={Droplets} tone="purple" footnote="Average relative humidity" />
        <MetricCard label="Readings collected" value={formatCount(stats.totalReadings)} unit="" icon={Activity} tone="green" footnote={hasReadingProvenance ? `${formatCount(stats.seededDemoReadings)} seeded demo readings` : 'Reading provenance count unavailable'} />
        <MetricCard label="Station availability" value={onlineRatio.toFixed(0)} unit="%" icon={TrendingUp} tone="amber" footnote={`${activeStations} of ${stations.length} reporting`} />
      </div>
      <div className="dashboard-grid dashboard-grid-charts">
        <Panel title="Temperature by region" subtitle="Regional averages compared with relative humidity" action={<span className="chart-legend"><i />Temperature °C</span>}><RegionalTemperatureChart regions={regions} /></Panel>
        <Panel title="Temperature trend" subtitle="Network-wide changes throughout the day" action={<span className="panel-kicker">{formatCount(trends.length)} time buckets</span>}><TemperatureChart data={trends} /></Panel>
      </div>
      <div className="dashboard-grid dashboard-grid-charts">
        <Panel title="Humidity analytics" subtitle="Relative humidity across the network"><HumidityChart data={trends} /></Panel>
        <Panel title="Reading volume" subtitle="Incoming weather records over time"><ReadingsChart data={trends} /></Panel>
      </div>
      <Panel title="Station activity by region" subtitle="Telemetry availability and stored records">
        <div className="analytics-region-list">{regions.map((region) => <div className="analytics-region-row" key={region.id}><i style={{ background: region.color }} /><strong>{region.name}</strong><span>{region.stationList.filter((station) => station.status !== 'offline').length}/{region.stationList.length} active</span><span>{region.readings.toLocaleString()} readings</span><div className="progress-track"><i style={{ width: `${region.share}%`, background: region.color }} /></div><b>{region.share}%</b></div>)}</div>
      </Panel>
    </>
  )
}

export default AnalyticsPage
