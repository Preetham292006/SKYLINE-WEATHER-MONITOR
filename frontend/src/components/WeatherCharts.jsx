import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const axisProps = {
  axisLine: false,
  tickLine: false,
  tick: { fill: '#7789a3', fontSize: 11 },
  dy: 8,
}

export function TemperatureChart({ data, compact = false }) {
  if (!data.length) return <div className="chart-empty">No temperature readings for this time range.</div>
  return (
    <ResponsiveContainer width="100%" height={compact ? 220 : 300}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="temperatureFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.28} />
            <stop offset="90%" stopColor="#38bdf8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#24334a" strokeDasharray="3 5" vertical={false} />
        <XAxis dataKey="time" {...axisProps} />
        <YAxis {...axisProps} />
        <Tooltip contentStyle={{ background: '#111c2e', border: '1px solid #2b3c55', borderRadius: 10 }} />
        <Area type="monotone" dataKey="temperature" name="Temperature" stroke="#38bdf8" strokeWidth={2.5} fill="url(#temperatureFill)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function HumidityChart({ data, compact = false }) {
  if (!data.length) return <div className="chart-empty">No humidity readings for this time range.</div>
  return (
    <ResponsiveContainer width="100%" height={compact ? 220 : 300}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="#24334a" strokeDasharray="3 5" vertical={false} />
        <XAxis dataKey="time" {...axisProps} />
        <YAxis domain={[0, 100]} {...axisProps} />
        <Tooltip contentStyle={{ background: '#111c2e', border: '1px solid #2b3c55', borderRadius: 10 }} />
        <Line type="monotone" dataKey="humidity" name="Humidity" stroke="#a78bfa" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function ReadingsChart({ data }) {
  if (!data.length) return <div className="chart-empty">No readings are available for this time range.</div>
  return (
    <ResponsiveContainer width="100%" height={270}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="readingsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity={0.24} />
            <stop offset="90%" stopColor="#34d399" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#24334a" strokeDasharray="3 5" vertical={false} />
        <XAxis dataKey="time" {...axisProps} />
        <YAxis {...axisProps} />
        <Tooltip contentStyle={{ background: '#111c2e', border: '1px solid #2b3c55', borderRadius: 10 }} />
        <Area type="monotone" dataKey="readings" name="Readings" stroke="#34d399" strokeWidth={2.5} fill="url(#readingsFill)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function RegionalTemperatureChart({ regions }) {
  const data = regions.flatMap((region) => {
    const readings = (region.stationList || []).filter((station) => station.hasReading)
    const hasRegionalAverage = Number.isFinite(region.averageTemperature) && Number.isFinite(region.averageHumidity)
    if (!hasRegionalAverage && !readings.length) return []
    const temperature = region.averageTemperature
      ?? readings.reduce((total, station) => total + station.temperature, 0) / readings.length
    const humidity = region.averageHumidity
      ?? readings.reduce((total, station) => total + station.humidity, 0) / readings.length
    return [{ region: region.shortName || region.name.replace(' Region', ''), temperature: Number(temperature.toFixed(1)), humidity: Math.round(humidity) }]
  })
  if (!data.length) return <div className="chart-empty">No regional readings are available yet.</div>
  return (
    <ResponsiveContainer width="100%" height={270}>
      <LineChart data={data} margin={{ top: 8, right: 2, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="#24334a" strokeDasharray="3 5" vertical={false} />
        <XAxis dataKey="region" {...axisProps} />
        <YAxis yAxisId="temperature" {...axisProps} />
        <YAxis yAxisId="humidity" orientation="right" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#7789a3', fontSize: 11 }} />
        <Tooltip contentStyle={{ background: '#111c2e', border: '1px solid #2b3c55', borderRadius: 10 }} />
        <Line yAxisId="temperature" type="monotone" dataKey="temperature" name="Avg. temperature °C" stroke="#38bdf8" strokeWidth={2.5} />
        <Line yAxisId="humidity" type="monotone" dataKey="humidity" name="Avg. humidity %" stroke="#a78bfa" strokeWidth={2.5} />
      </LineChart>
    </ResponsiveContainer>
  )
}
