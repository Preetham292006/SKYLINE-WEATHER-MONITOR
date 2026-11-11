const WeatherStation = require('../models/WeatherStation')
const { getRegionalReadingAggregates } = require('../services/readingService')
const { getAllRegions, getRegion } = require('../services/regionRouter')

function buildRegionStats(region, stationCounts, readingStats) {
  const stationCount = stationCounts.get(region.id) || 0
  const regionReadings = readingStats.find((item) => item._id === region.id)
  return {
    ...region,
    stationCount,
    activeCount: stationCounts.active.get(region.id) || 0,
    readings: regionReadings?.readings || 0,
    averageTemperature: regionReadings?.averageTemperature ?? null,
    averageHumidity: regionReadings?.averageHumidity ?? null,
    status: (stationCounts.offline.get(region.id) || 0) > 0 ? 'Degraded' : 'Operational',
  }
}

async function queryRegionStats(selectedRegion) {
  const [stationData, readingStats] = await Promise.all([
    WeatherStation.aggregate([
      { $group: { _id: { region: '$region', status: '$status' }, count: { $sum: 1 } } },
    ]),
    getRegionalReadingAggregates(),
  ])
  const counts = new Map()
  const active = new Map()
  const offline = new Map()
  for (const row of stationData) {
    const region = row._id.region
    counts.set(region, (counts.get(region) || 0) + row.count)
    if (row._id.status !== 'offline') active.set(region, (active.get(region) || 0) + row.count)
    if (row._id.status === 'offline') offline.set(region, (offline.get(region) || 0) + row.count)
  }
  counts.active = active
  counts.offline = offline
  const regions = selectedRegion ? [selectedRegion] : getAllRegions()
  const records = regions.map((region) => buildRegionStats(region, counts, readingStats))
  const totalReadings = records.reduce((sum, record) => sum + record.readings, 0)
  return records.map((record) => ({
    ...record,
    share: totalReadings ? Math.round((record.readings / totalReadings) * 100) : 0,
  }))
}

async function listRegions(req, res) {
  const data = await queryRegionStats()
  res.json({ data })
}

async function getRegionDetails(req, res) {
  const region = getRegion(req.params.region)
  const [data] = await queryRegionStats(region)
  res.json({ data })
}

async function getRegionStatistics(req, res) {
  const region = getRegion(req.params.region)
  const [data] = await queryRegionStats(region)
  res.json({ data })
}

module.exports = { getRegionDetails, getRegionStatistics, listRegions, queryRegionStats }
