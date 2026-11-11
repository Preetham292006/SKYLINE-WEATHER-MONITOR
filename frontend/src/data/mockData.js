export const regionDefinitions = [
  { id: 'north', name: 'North Region', collection: 'north_weather_readings', color: '#38bdf8' },
  { id: 'south', name: 'South Region', collection: 'south_weather_readings', color: '#a78bfa' },
  { id: 'east', name: 'East Region', collection: 'east_weather_readings', color: '#34d399' },
  { id: 'west', name: 'West Region', collection: 'west_weather_readings', color: '#fbbf24' },
]

export const stations = [
  { id: 'SKY-N-1042', name: 'Aurora Ridge', city: 'Fairbanks, Alaska', region: 'north', lat: 64.84, lon: -147.72, temperature: -4.8, humidity: 72, wind: 8.2, pressure: 1018, rainfall: 0.2, status: 'online', minutesAgo: 2, readingsStored: 128450 },
  { id: 'SKY-N-1087', name: 'Pine Valley', city: 'Bergen, Norway', region: 'north', lat: 60.39, lon: 5.32, temperature: 6.2, humidity: 81, wind: 5.7, pressure: 1009, rainfall: 2.4, status: 'online', minutesAgo: 4, readingsStored: 98620 },
  { id: 'SKY-N-1124', name: 'Frostline Point', city: 'Reykjavik, Iceland', region: 'north', lat: 64.15, lon: -21.94, temperature: 2.1, humidity: 76, wind: 12.4, pressure: 1002, rainfall: 1.8, status: 'offline', minutesAgo: 48, readingsStored: 84310 },
  { id: 'SKY-S-2031', name: 'Cape Meridian', city: 'Cape Town, South Africa', region: 'south', lat: -33.92, lon: 18.42, temperature: 24.3, humidity: 48, wind: 4.1, pressure: 1016, rainfall: 0, status: 'online', minutesAgo: 1, readingsStored: 119840 },
  { id: 'SKY-S-2068', name: 'Southern Cross', city: 'Wellington, New Zealand', region: 'south', lat: -41.29, lon: 174.78, temperature: 17.8, humidity: 67, wind: 10.3, pressure: 1007, rainfall: 3.2, status: 'online', minutesAgo: 6, readingsStored: 110560 },
  { id: 'SKY-S-2115', name: 'Atacama Watch', city: 'Antofagasta, Chile', region: 'south', lat: -23.65, lon: -70.4, temperature: 29.6, humidity: 24, wind: 3.5, pressure: 1021, rainfall: 0, status: 'online', minutesAgo: 3, readingsStored: 75420 },
  { id: 'SKY-E-3014', name: 'Monsoon Gate', city: 'Mumbai, India', region: 'east', lat: 19.08, lon: 72.88, temperature: 31.4, humidity: 84, wind: 6.8, pressure: 1004, rainfall: 8.6, status: 'online', minutesAgo: 2, readingsStored: 142300 },
  { id: 'SKY-E-3077', name: 'Cedar Observatory', city: 'Sapporo, Japan', region: 'east', lat: 43.06, lon: 141.35, temperature: 11.7, humidity: 59, wind: 7.1, pressure: 1012, rainfall: 0.8, status: 'online', minutesAgo: 8, readingsStored: 106750 },
  { id: 'SKY-E-3129', name: 'Delta Field', city: 'Singapore', region: 'east', lat: 1.35, lon: 103.82, temperature: 28.1, humidity: 79, wind: 2.8, pressure: 1008, rainfall: 4.1, status: 'warning', minutesAgo: 14, readingsStored: 134980 },
  { id: 'SKY-W-4018', name: 'Sierra Summit', city: 'Denver, Colorado', region: 'west', lat: 39.74, lon: -104.99, temperature: 18.6, humidity: 36, wind: 9.6, pressure: 1006, rainfall: 0.4, status: 'online', minutesAgo: 3, readingsStored: 121200 },
  { id: 'SKY-W-4063', name: 'Pacific Beacon', city: 'Seattle, Washington', region: 'west', lat: 47.61, lon: -122.33, temperature: 13.2, humidity: 74, wind: 5.2, pressure: 1013, rainfall: 2.7, status: 'online', minutesAgo: 5, readingsStored: 115670 },
  { id: 'SKY-W-4120', name: 'Desert Bloom', city: 'Phoenix, Arizona', region: 'west', lat: 33.45, lon: -112.07, temperature: 35.8, humidity: 19, wind: 3.9, pressure: 1001, rainfall: 0, status: 'offline', minutesAgo: 92, readingsStored: 90760 },
]

export const alerts = [
  { id: 'ALT-2481', type: 'High temperature', title: 'Temperature threshold exceeded', stationId: 'SKY-W-4120', stationName: 'Desert Bloom', region: 'west', detail: '35.8°C recorded · threshold 35°C', severity: 'critical', minutesAgo: 8, resolved: false },
  { id: 'ALT-2479', type: 'Connectivity', title: 'Station stopped reporting', stationId: 'SKY-N-1124', stationName: 'Frostline Point', region: 'north', detail: 'No heartbeat received for 48 minutes', severity: 'warning', minutesAgo: 15, resolved: false },
  { id: 'ALT-2474', type: 'Heavy rainfall', title: 'Heavy rainfall detected', stationId: 'SKY-E-3014', stationName: 'Monsoon Gate', region: 'east', detail: '8.6 mm in the latest reporting interval', severity: 'warning', minutesAgo: 32, resolved: false },
  { id: 'ALT-2468', type: 'Low temperature', title: 'Low temperature advisory', stationId: 'SKY-N-1042', stationName: 'Aurora Ridge', region: 'north', detail: '-4.8°C recorded · frost advisory at -5°C', severity: 'information', minutesAgo: 64, resolved: false },
  { id: 'ALT-2455', type: 'Connectivity', title: 'Intermittent connection restored', stationId: 'SKY-S-2068', stationName: 'Southern Cross', region: 'south', detail: 'Station connection recovered after 11 minutes', severity: 'information', minutesAgo: 138, resolved: true },
]

const trendSeries = [
  { time: '00:00', temperature: 16.8, humidity: 67, readings: 182 },
  { time: '02:00', temperature: 15.9, humidity: 71, readings: 194 },
  { time: '04:00', temperature: 15.2, humidity: 74, readings: 177 },
  { time: '06:00', temperature: 16.4, humidity: 70, readings: 205 },
  { time: '08:00', temperature: 18.1, humidity: 64, readings: 218 },
  { time: '10:00', temperature: 20.7, humidity: 58, readings: 231 },
  { time: '12:00', temperature: 22.4, humidity: 54, readings: 226 },
  { time: '14:00', temperature: 23.1, humidity: 51, readings: 242 },
  { time: '16:00', temperature: 21.8, humidity: 55, readings: 237 },
  { time: '18:00', temperature: 19.6, humidity: 60, readings: 223 },
  { time: '20:00', temperature: 18.2, humidity: 63, readings: 211 },
  { time: '22:00', temperature: 17.3, humidity: 66, readings: 199 },
]

const weeklySeries = [
  { time: 'Mon', temperature: 17.2, humidity: 67, readings: 1980 },
  { time: 'Tue', temperature: 18.4, humidity: 63, readings: 2140 },
  { time: 'Wed', temperature: 19.1, humidity: 60, readings: 2065 },
  { time: 'Thu', temperature: 18.7, humidity: 62, readings: 2230 },
  { time: 'Fri', temperature: 20.2, humidity: 57, readings: 2310 },
  { time: 'Sat', temperature: 21.1, humidity: 54, readings: 2265 },
  { time: 'Sun', temperature: 20.4, humidity: 58, readings: 2180 },
]

const monthlySeries = [
  { time: 'Oct 13', temperature: 16.8, humidity: 68, readings: 14520 },
  { time: 'Oct 17', temperature: 17.4, humidity: 65, readings: 15180 },
  { time: 'Oct 21', temperature: 18.1, humidity: 63, readings: 15740 },
  { time: 'Oct 25', temperature: 19.3, humidity: 59, readings: 16120 },
  { time: 'Oct 29', temperature: 20.2, humidity: 57, readings: 16980 },
  { time: 'Nov 02', temperature: 19.6, humidity: 60, readings: 16540 },
  { time: 'Nov 06', temperature: 21.1, humidity: 55, readings: 17410 },
  { time: 'Nov 10', temperature: 20.4, humidity: 58, readings: 17820 },
]

export function getTrend(range = '24h') {
  if (range === '7d') return weeklySeries
  if (range === '30d') return monthlySeries
  return trendSeries
}

export function getRegionStats(stationData = stations) {
  const readingTotal = stationData.reduce((total, station) => total + station.readingsStored, 0)
  return regionDefinitions.map((region) => {
    const regionStations = stationData.filter((station) => station.region === region.id)
    const readings = regionStations.reduce((total, station) => total + station.readingsStored, 0)
    return {
      ...region,
      stationCount: regionStations.length,
      activeCount: regionStations.filter((station) => station.status !== 'offline').length,
      readings,
      share: readingTotal === 0 ? 0 : Math.round((readings / readingTotal) * 100),
      status: regionStations.some((station) => station.status === 'offline') ? 'Degraded' : 'Operational',
    }
  })
}

export const totalReadings = stations.reduce((total, station) => total + station.readingsStored, 0)
export const activeStations = stations.filter((station) => station.status !== 'offline').length
export const average = (key, stationData = stations) => stationData.length
  ? stationData.reduce((total, station) => total + station[key], 0) / stationData.length
  : 0
export function timeAgo(minutes) {
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  return `${hours} hr${hours > 1 ? 's' : ''} ago`
}

export function formatCount(value) {
  return new Intl.NumberFormat('en-US').format(value)
}
