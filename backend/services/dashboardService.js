const WeatherStation = require('../models/WeatherStation')
const WeatherAlert = require('../models/WeatherAlert')
const { getAllRegions } = require('./regionRouter')
const {
  getReadingTrends,
  getAllReadingStats,
  getRegionalReadingAggregates,
  getStationReadingSummaries,
} = require('./readingService')

function round(value, digits = 1) {
  if (!Number.isFinite(value)) return 0
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

async function getDashboardStats() {
  const [stationCount, activeStations, allReadingStats, activeAlerts] = await Promise.all([
    WeatherStation.countDocuments(),
    WeatherStation.countDocuments({ status: { $ne: 'offline' } }),
    getAllReadingStats(),
    WeatherAlert.countDocuments({ status: 'active' }),
  ])
  const readingCount = allReadingStats[0]?.totalReadings || 0
  const regionCount = getAllRegions().length
  const readingStats = allReadingStats[0]
  if (!readingStats) {
    return {
      totalStations: stationCount,
      activeStations,
      totalReadings: 0,
      regionCount,
      averageTemperature: 0,
      averageHumidity: 0,
      averageWindSpeed: 0,
      averageRainfall: 0,
      seededDemoReadings: 0,
      monitoringSimulationReadings: 0,
      unverifiedReadings: 0,
      activeAlerts,
    }
  }

  return {
    totalStations: stationCount,
    activeStations,
    totalReadings: readingCount,
    regionCount,
    averageTemperature: round(readingStats.averageTemperature),
    averageHumidity: round(readingStats.averageHumidity),
    averageWindSpeed: round(readingStats.averageWindSpeed),
    averageRainfall: round(readingStats.averageRainfall),
    seededDemoReadings: readingStats.seededDemoReadings || 0,
    monitoringSimulationReadings: readingStats.monitoringSimulationReadings || 0,
    unverifiedReadings: readingStats.unverifiedReadings || 0,
    activeAlerts,
  }
}

async function getDashboardOverview() {
  const [stationSummaries, trends] = await Promise.all([
    getStationReadingSummaries(),
    getReadingTrends({ range: '24h' }),
  ])
  const latestByStation = new Map(stationSummaries.map((item) => [item._id, item.latestReading]))
  const [latestStations, regionalReadings] = await Promise.all([
    WeatherStation.find().sort({ updatedAt: -1 }).lean(),
    getRegionalReadingAggregates(),
  ])

  return {
    recentStations: latestStations.map((station) => ({
      ...station,
      latestReading: latestByStation.get(station.stationId) || null,
    })).sort((a, b) => {
      const aTime = a.latestReading?.recordedAt?.getTime?.() || 0
      const bTime = b.latestReading?.recordedAt?.getTime?.() || 0
      return bTime - aTime
    }).slice(0, 8),
    regionalReadings,
    readingsTrend: trends,
  }
}

async function getDashboardTrends({ region, stationId, range }) {
  return getReadingTrends({ region, stationId, range })
}

module.exports = { getDashboardOverview, getDashboardStats, getDashboardTrends }
