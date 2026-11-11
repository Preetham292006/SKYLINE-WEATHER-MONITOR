import { useCallback, useEffect, useMemo, useState } from 'react'
import { regionDefinitions } from '../data/displayData.js'
import {
  createStation as createStationRequest,
  createSimulatedReadings,
  getAlerts,
  getDashboardOverview,
  getDashboardStats,
  getDashboardTrends,
  getHealth,
  getRegions,
  getStations,
  resolveAlert as resolveAlertRequest,
} from '../services/api.js'
import AppDataContext from './appData.js'

const emptyRegions = regionDefinitions.map((region) => ({
  ...region,
  stationCount: 0,
  activeCount: 0,
  readings: 0,
  averageTemperature: null,
  averageHumidity: null,
  status: 'No stations',
  share: 0,
}))

function stationToClient(station) {
  const latest = station.latestReading || {}
  const recordedAt = latest.recordedAt ? new Date(latest.recordedAt) : null
  const minutesAgo = recordedAt ? Math.max(0, Math.floor((Date.now() - recordedAt.getTime()) / 60_000)) : null
  return {
    id: station.stationId,
    name: station.stationName,
    region: station.region,
    city: station.city || `${station.latitude.toFixed(2)}, ${station.longitude.toFixed(2)}`,
    lat: station.latitude,
    lon: station.longitude,
    temperature: latest.temperature ?? 0,
    humidity: latest.humidity ?? 0,
    wind: latest.windSpeed ?? 0,
    pressure: latest.atmosphericPressure ?? 0,
    rainfall: latest.rainfall ?? 0,
    status: station.status,
    minutesAgo,
    lastReadingAt: latest.recordedAt || null,
    hasReading: Boolean(latest.recordedAt),
    dataSource: latest.dataSource,
    readingsStored: station.readingsStored || 0,
  }
}

function alertToClient(alert) {
  return {
    id: alert.alertId,
    type: alert.alertType,
    title: alert.title || alert.message,
    stationId: alert.stationId,
    stationName: alert.stationName || alert.stationId,
    region: alert.region,
    detail: alert.detail || alert.message,
    severity: alert.severity,
    minutesAgo: alert.minutesAgo || 0,
    resolved: alert.resolved ?? alert.status === 'resolved',
  }
}

function apiErrorMessage(error) {
  return error.response?.data?.error || error.message || 'The API could not be reached.'
}

export function AppDataProvider({ children }) {
  const [stations, setStations] = useState([])
  const [alerts, setAlerts] = useState([])
  const [regions, setRegions] = useState(emptyRegions)
  const [stats, setStats] = useState({
    totalStations: 0,
    activeStations: 0,
    totalReadings: 0,
    regionCount: regionDefinitions.length,
    averageTemperature: 0,
    averageHumidity: 0,
    averageWindSpeed: 0,
    averageRainfall: 0,
    seededDemoReadings: 0,
    monitoringSimulationReadings: 0,
    unverifiedReadings: 0,
  })
  const [overview, setOverview] = useState({ recentStations: [], readingsTrend: [] })
  const [trends, setTrends] = useState([])
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState('loading')
  const [loadError, setLoadError] = useState('')
  const [theme, setTheme] = useState(() => localStorage.getItem('skyline-theme') === 'slate' ? 'slate' : 'navy')

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const health = await getHealth()
      if (health.database !== 'connected') {
        throw new Error(`MongoDB is ${health.database || 'not connected'}. Start MongoDB, then retry.`)
      }

      const [stationData, alertData, regionData, dashboardStats, dashboardOverview, dashboardTrends] = await Promise.all([
        getStations(),
        getAlerts(),
        getRegions(),
        getDashboardStats(),
        getDashboardOverview(),
        getDashboardTrends({ range: '24h' }),
      ])
      const mappedStations = stationData.map(stationToClient)
      setStations(mappedStations)
      setAlerts(alertData.map(alertToClient))
      setRegions(regionData.map((region) => ({
        ...region,
        shortName: region.name.replace(' Region', ''),
        color: regionDefinitions.find((item) => item.id === region.id)?.color || '#38bdf8',
        stationList: mappedStations.filter((station) => station.region === region.id),
      })))
      setStats(dashboardStats)
      setOverview({
        ...dashboardOverview,
        recentStations: dashboardOverview.recentStations.map((station) => stationToClient({
          ...station,
          readingsStored: station.readingsStored || 0,
        })),
      })
      setTrends(dashboardTrends)
      setSource('database')
      setLoadError('')
    } catch (error) {
      setSource('error')
      setLoadError(apiErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timerId = window.setTimeout(() => refresh(), 0)
    return () => window.clearTimeout(timerId)
  }, [refresh])

  const addStation = useCallback(async (details) => {
    try {
      const saved = await createStationRequest({
        stationName: details.name,
        city: details.city,
        region: details.region,
        latitude: details.lat,
        longitude: details.lon,
      })
      setStations((current) => [...current, stationToClient(saved)])
      setSource('database')
      setLoadError('')
      await refresh()
      return true
    } catch (error) {
      setLoadError(`Station was not saved: ${apiErrorMessage(error)}`)
      return false
    }
  }, [refresh])

  const resolveAlert = useCallback(async (id) => {
    try {
      const resolved = await resolveAlertRequest(id)
      setAlerts((current) => current.map((alert) => alert.id === id
        ? { ...alertToClient(resolved), stationName: alert.stationName }
        : alert))
      setStats((current) => ({ ...current, activeAlerts: Math.max(0, (current.activeAlerts || 1) - 1) }))
      setLoadError('')
    } catch (error) {
      setLoadError(`Alert was not resolved: ${apiErrorMessage(error)}`)
    }
  }, [])

  const resolveAllAlerts = useCallback(async () => {
    const activeAlerts = alerts.filter((alert) => !alert.resolved)
    if (source !== 'database') {
      setLoadError('Alerts were not changed because the database is unavailable.')
      return
    }
    const results = await Promise.allSettled(activeAlerts.map((alert) => resolveAlertRequest(alert.id)))
    await refresh()
    const failures = results.filter((result) => result.status === 'rejected')
    if (failures.length) setLoadError(`${failures.length} alert${failures.length === 1 ? '' : 's'} could not be resolved.`)
  }, [alerts, refresh, source])

  const value = useMemo(() => ({
    stations,
    alerts,
    regions,
    stats,
    overview,
    trends,
    loading,
    source,
    loadError,
    theme,
    setTheme,
    refresh,
    createSimulatedReadings,
    addStation,
    resolveAlert,
    resolveAllAlerts,
  }), [stations, alerts, regions, stats, overview, trends, loading, source, loadError, theme, refresh, addStation, resolveAlert, resolveAllAlerts])

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}
