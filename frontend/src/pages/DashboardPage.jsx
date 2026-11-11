import { useMemo } from 'react'
import { Activity, CloudRain, Droplets, MapPin, Radio, Thermometer, Wind, ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import Panel from '../components/Panel.jsx'
import MetricCard from '../components/MetricCard.jsx'
import { HumidityChart, ReadingsChart, TemperatureChart } from '../components/WeatherCharts.jsx'
import { StatusBadge } from '../components/StationTable.jsx'
import { average, formatCount, getRegionStats, getTrend, regionDefinitions, timeAgo } from '../data/mockData.js'
import { useAppData } from '../hooks/useAppData.js'

const dashboardDateLabel = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
}).format(new Date())

function DashboardPage() {
  const { stations, regions: databaseRegions, stats, overview, trends, source } = useAppData()
  const regions = useMemo(() => source === 'database' ? databaseRegions : getRegionStats(stations), [databaseRegions, source, stations])
  const onlineCount = stations.filter((station) => station.status === 'online').length
  const activeCount = stations.filter((station) => station.status !== 'offline').length
  const totalReadings = stations.reduce((total, station) => total + station.readingsStored, 0)
  const recentStations = source === 'database' && overview.recentStations.length
    ? overview.recentStations.slice(0, 5)
    : [...stations].sort((a, b) => a.minutesAgo - b.minutesAgo).slice(0, 5)
  const trend = source === 'database' && trends.length ? trends : getTrend()
  const totalHourlyReadings = trend.reduce((total, point) => total + point.readings, 0)
  const displayedStationCount = source === 'database' ? stats.totalStations : stations.length
  const displayedActiveCount = source === 'database' ? stats.activeStations : activeCount
  const displayedReadingCount = source === 'database' ? stats.totalReadings : totalReadings

  return (
    <>
      <PageHeader eyebrow={dashboardDateLabel} title="Weather Intelligence Overview" description="A clear view of your global station network and regional data activity." actions={<span className="live-pill"><i /> Demo network</span>} />
      <div className="metric-grid metric-grid-four">
        <MetricCard label="Total stations" value={displayedStationCount} unit="" icon={MapPin} tone="blue" footnote="Across 4 logical regions" />
        <MetricCard label="Active stations" value={`${displayedActiveCount} / ${displayedStationCount}`} unit="" icon={Radio} tone="green" footnote={source === 'database' ? `${displayedActiveCount} reporting normally` : `${onlineCount} reporting normally`} />
        <MetricCard label="Total readings" value={displayedReadingCount >= 1000000 ? `${(displayedReadingCount / 1000000).toFixed(2)}M` : displayedReadingCount.toLocaleString()} unit="" icon={Activity} tone="purple" footnote="Stored across regional collections" />
        <MetricCard label="Geographic regions" value={regions.length} unit="" icon={MapPin} tone="amber" footnote="Logical data partitions" />
      </div>

      <div className="section-label"><span>LIVE WEATHER SNAPSHOT</span><i /> Updated just now</div>
      <div className="metric-grid metric-grid-four metric-grid-weather">
        <MetricCard label="Avg. temperature" value={(source === 'database' ? stats.averageTemperature : average('temperature', stations)).toFixed(1)} unit="°C" icon={Thermometer} tone="blue" footnote={<><ArrowUpRight size={13} /> 1.8° vs. yesterday</>} />
        <MetricCard label="Avg. humidity" value={Math.round(source === 'database' ? stats.averageHumidity : average('humidity', stations))} unit="%" icon={Droplets} tone="purple" footnote={<><ArrowDownRight size={13} /> 3% vs. yesterday</>} />
        <MetricCard label="Avg. wind speed" value={(source === 'database' ? stats.averageWindSpeed : average('wind', stations)).toFixed(1)} unit="m/s" icon={Wind} tone="green" footnote="Network-wide average" />
        <MetricCard label="Rainfall" value={(source === 'database' ? stats.averageRainfall : average('rainfall', stations)).toFixed(1)} unit="mm" icon={CloudRain} tone="amber" footnote="Latest station readings" />
      </div>

      <div className="dashboard-grid dashboard-grid-charts">
        <Panel title="Temperature trends" subtitle="Network average · last 24 hours" action={<span className="chart-legend"><i />Temperature °C</span>}>
          <TemperatureChart data={trend} compact />
        </Panel>
        <Panel title="Humidity levels" subtitle="Relative humidity · last 24 hours" action={<span className="chart-legend legend-purple"><i />Humidity %</span>}>
          <HumidityChart data={trend} compact />
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
        <Panel title="Readings over time" subtitle="Incoming station records · today" action={<span className="panel-kicker">{(totalHourlyReadings / 1000).toFixed(1)}k records</span>}>
          <ReadingsChart data={trend} />
        </Panel>
      </div>

      <Panel title="Recent station activity" subtitle="Latest telemetry from across the network" action={<Link className="text-link" to="/stations">View all stations <ChevronRight size={14} /></Link>}>
        <div className="activity-list">
          {recentStations.map((station) => {
            const region = regionDefinitions.find((item) => item.id === station.region)
            return <div className="activity-row" key={station.id}><span className="station-avatar">{station.name[0]}</span><span className="activity-station"><strong>{station.name}</strong><small>{station.id} · {station.city}</small></span><span className="region-label"><i style={{ background: region?.color }} />{region?.name}</span><span className="activity-reading">{station.temperature.toFixed(1)}°C <small>{station.humidity}% RH</small></span><StatusBadge status={station.status} /><span className="table-muted">{timeAgo(station.minutesAgo)}</span></div>
          })}
        </div>
      </Panel>
    </>
  )
}

export default DashboardPage
