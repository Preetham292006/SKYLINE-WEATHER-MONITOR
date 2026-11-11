import { useEffect, useMemo, useState } from 'react'
import { Activity, CloudRain, Droplets, Gauge, Thermometer, Wind } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import MetricCard from '../components/MetricCard.jsx'
import Panel from '../components/Panel.jsx'
import { TemperatureChart, HumidityChart, ReadingsChart } from '../components/WeatherCharts.jsx'
import { regionDefinitions } from '../data/displayData.js'
import { createSimulatedReadings, getDashboardTrends } from '../services/api.js'
import { useAppData } from '../hooks/useAppData.js'

function MonitoringPage() {
  const { stations: allStations, source, refresh } = useAppData()
  const [stationId, setStationId] = useState('all')
  const [region, setRegion] = useState('all')
  const [range, setRange] = useState('24h')
  const [demoMode, setDemoMode] = useState(false)
  const [remoteTrend, setRemoteTrend] = useState(null)
  const [trendError, setTrendError] = useState('')
  const [streamMessage, setStreamMessage] = useState('')
  const stationOptions = useMemo(() => allStations.filter((station) => region === 'all' || station.region === region), [allStations, region])
  const selectedStation = allStations.find((station) => station.id === stationId && (region === 'all' || station.region === region))
  const scopeStations = selectedStation ? [selectedStation] : stationOptions
  const stationsWithReadings = scopeStations.filter((station) => station.hasReading)
  const metrics = {
    temperature: stationsWithReadings.reduce((sum, item) => sum + item.temperature, 0) / (stationsWithReadings.length || 1),
    humidity: stationsWithReadings.reduce((sum, item) => sum + item.humidity, 0) / (stationsWithReadings.length || 1),
    wind: stationsWithReadings.reduce((sum, item) => sum + item.wind, 0) / (stationsWithReadings.length || 1),
    pressure: stationsWithReadings.reduce((sum, item) => sum + item.pressure, 0) / (stationsWithReadings.length || 1),
    rainfall: stationsWithReadings.reduce((sum, item) => sum + item.rainfall, 0) / (stationsWithReadings.length || 1),
  }
  const rangeOptions = [{ value: '24h', label: '24 hours' }, { value: '7d', label: '7 days' }, { value: '30d', label: '30 days' }]
  const trendQuery = JSON.stringify({
    range,
    region: region === 'all' ? undefined : region,
    stationId: stationId === 'all' ? undefined : stationId,
  })
  const trend = source === 'database' && remoteTrend?.query === trendQuery ? remoteTrend.data : []

  useEffect(() => {
    let active = true
    if (source === 'database') {
      getDashboardTrends(JSON.parse(trendQuery)).then((data) => {
        if (active) {
          setRemoteTrend({ query: trendQuery, data })
          setTrendError('')
        }
      }).catch((error) => {
        if (active) setTrendError(error.response?.data?.error || 'Unable to load reading history.')
      })
    }
    return () => { active = false }
  }, [source, trendQuery])

  useEffect(() => {
    if (source !== 'database' || !demoMode || allStations.length === 0) return undefined
    let active = true
    const timerId = window.setInterval(async () => {
      try {
        const result = await createSimulatedReadings({
          ...(stationId === 'all' ? {} : { stationId }),
          ...(region === 'all' ? {} : { region }),
        })
        if (active) setStreamMessage(`Saved ${result.count} simulated reading${result.count === 1 ? '' : 's'} to regional collections.`)
        await refresh()
      } catch (error) {
        if (active) setStreamMessage(error.response?.data?.error || 'Simulated readings could not be saved.')
      }
    }, 30_000)
    return () => {
      active = false
      window.clearInterval(timerId)
    }
  }, [allStations.length, demoMode, region, refresh, source, stationId])

  function updateRegion(value) {
    setRegion(value)
    if (stationId !== 'all' && !allStations.some((station) => station.id === stationId && (value === 'all' || station.region === value))) setStationId('all')
  }

  return (
    <>
      <PageHeader eyebrow="WEATHER TELEMETRY" title="Live monitoring" description="Explore readings returned by the database across stations, regions, and time windows." actions={<><span className="live-pill"><i /> {demoMode ? 'Demo Mode active' : source === 'database' ? 'Database readings' : 'Waiting for API'}</span><button type="button" className={`button ${demoMode ? 'button-primary' : 'button-quiet'}`} aria-pressed={demoMode} disabled={source !== 'database' || allStations.length === 0} onClick={() => { setDemoMode((enabled) => !enabled); setStreamMessage('') }}>{demoMode ? 'Stop Demo Mode' : 'Enable Demo Mode'}</button></>} />
      <div className={`simulation-note ${trendError ? 'simulation-error' : ''}`} role="status">{trendError || streamMessage || (source !== 'database' ? 'No bundled weather samples are shown. Connect to the database API to view readings.' : !allStations.length ? 'No stations were returned by the database; Demo Mode is unavailable.' : demoMode ? 'Demo Mode is enabled. Synthetic readings are explicitly marked as simulated and are not genuine remote sensor observations.' : 'Demo Mode is off. This page displays stored database readings only and will not generate synthetic sensor data.')}</div>
      <div className="monitor-filters">
        <label><span>Region</span><select value={region} onChange={(event) => updateRegion(event.target.value)}><option value="all">All regions</option>{regionDefinitions.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
        <label><span>Weather station</span><select value={stationId} onChange={(event) => setStationId(event.target.value)}><option value="all">All stations</option>{stationOptions.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
        <div className="range-switch" aria-label="Chart time range">{rangeOptions.map((item) => <button key={item.value} className={range === item.value ? 'range-active' : ''} onClick={() => setRange(item.value)}>{item.label}</button>)}</div>
      </div>
      <div className="metric-grid metric-grid-five">
        <MetricCard label="Temperature" value={stationsWithReadings.length ? metrics.temperature.toFixed(1) : '—'} unit={stationsWithReadings.length ? '°C' : ''} icon={Thermometer} tone="blue" />
        <MetricCard label="Humidity" value={stationsWithReadings.length ? Math.round(metrics.humidity) : '—'} unit={stationsWithReadings.length ? '%' : ''} icon={Droplets} tone="purple" />
        <MetricCard label="Wind speed" value={stationsWithReadings.length ? metrics.wind.toFixed(1) : '—'} unit={stationsWithReadings.length ? 'm/s' : ''} icon={Wind} tone="green" />
        <MetricCard label="Pressure" value={stationsWithReadings.length ? Math.round(metrics.pressure) : '—'} unit={stationsWithReadings.length ? 'hPa' : ''} icon={Gauge} tone="amber" />
        <MetricCard label="Rainfall" value={stationsWithReadings.length ? metrics.rainfall.toFixed(1) : '—'} unit={stationsWithReadings.length ? 'mm' : ''} icon={CloudRain} tone="blue" />
      </div>
      <div className="dashboard-grid dashboard-grid-charts">
        <Panel title="Temperature history" subtitle={`${selectedStation?.name || (region === 'all' ? 'Network average' : regionDefinitions.find((item) => item.id === region)?.name)} · ${rangeOptions.find((item) => item.value === range)?.label}`} action={<span className="chart-legend"><i />Temperature °C</span>}><TemperatureChart data={trend} /></Panel>
        <Panel title="Humidity trend" subtitle="Relative humidity through selected period" action={<span className="chart-legend legend-purple"><i />Humidity %</span>}><HumidityChart data={trend} /></Panel>
      </div>
      <Panel title="Incoming weather readings" subtitle={`${scopeStations.length} station${scopeStations.length === 1 ? '' : 's'} in current selection`} action={<span className="panel-kicker"><Activity size={13} /> {demoMode ? 'Demo Mode stream' : 'Database readings'}</span>}><ReadingsChart data={trend} /></Panel>
    </>
  )
}

export default MonitoringPage
