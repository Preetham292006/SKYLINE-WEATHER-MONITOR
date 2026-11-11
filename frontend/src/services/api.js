import axios from 'axios'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
  || (import.meta.env.PROD ? 'https://skyline-weather-monitor.onrender.com/api' : '/api')

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 60000,
})

api.interceptors.response.use(undefined, async (error) => {
  const config = error.config
  const method = config?.method?.toLowerCase()
  const retryable = !error.response || error.code === 'ECONNABORTED' || error.response.status >= 500

  if (method !== 'get' || !retryable || (config.__retryCount || 0) >= 1) {
    throw error
  }

  config.__retryCount = (config.__retryCount || 0) + 1
  await new Promise((resolve) => window.setTimeout(resolve, 1000))
  return api.request(config)
})

export async function getHealth() {
  const { data } = await api.get('/health')
  return data
}

export async function getStations(params = {}) {
  const { data } = await api.get('/stations', { params })
  return data.data
}

export async function createStation(station) {
  const { data } = await api.post('/stations', station)
  return data.data
}

export async function getAlerts(params = {}) {
  const { data } = await api.get('/alerts', { params })
  return data.data
}

export async function resolveAlert(alertId) {
  const { data } = await api.patch(`/alerts/${encodeURIComponent(alertId)}/resolve`)
  return data.data
}

export async function getRegions() {
  const { data } = await api.get('/regions')
  return data.data
}

export async function getDashboardStats() {
  const { data } = await api.get('/dashboard/stats')
  return data.data
}

export async function getDashboardOverview() {
  const { data } = await api.get('/dashboard/overview')
  return data.data
}

export async function getDashboardTrends(params = {}) {
  const { data } = await api.get('/dashboard/trends', { params })
  return data.data
}

export async function getRegionalReadings(region, params = {}) {
  const { data } = await api.get(`/readings/region/${encodeURIComponent(region)}`, { params })
  return data.data
}

export async function createSimulatedReadings(params = {}) {
  const { data } = await api.post('/readings/simulate', params)
  return data
}

export async function analyzeReadingQuery(params = {}) {
  const { data } = await api.post('/readings/query', params, { timeout: 60000 })
  return data.data
}

export async function compareReadingQueries(params = {}) {
  const { data } = await api.post('/readings/benchmark', params, { timeout: 90000 })
  return data.data
}

export async function getQueryHistory(limit = 20) {
  const { data } = await api.get('/readings/query-history', { params: { limit } })
  return data.data
}
