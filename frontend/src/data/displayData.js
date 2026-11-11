export const regionDefinitions = [
  { id: 'north', name: 'North Region', collection: 'north_weather_readings', color: '#38bdf8' },
  { id: 'south', name: 'South Region', collection: 'south_weather_readings', color: '#a78bfa' },
  { id: 'east', name: 'East Region', collection: 'east_weather_readings', color: '#34d399' },
  { id: 'west', name: 'West Region', collection: 'west_weather_readings', color: '#fbbf24' },
]

export function timeAgo(minutes) {
  if (!Number.isFinite(minutes)) return 'No readings'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  return `${hours} hr${hours > 1 ? 's' : ''} ago`
}

export function formatCount(value) {
  return new Intl.NumberFormat('en-US').format(value)
}
