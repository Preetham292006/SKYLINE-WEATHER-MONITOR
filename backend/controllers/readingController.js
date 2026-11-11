const WeatherStation = require('../models/WeatherStation')
const ApiError = require('../utils/ApiError')
const { REGIONS, getAllRegions, getRegion } = require('../services/regionRouter')
const {
  compareRegionalQueries,
  listQueryHistory,
  runRegionalQuery,
} = require('../services/queryAnalysisService')
const {
  createRegionalReading,
  getReadingTrends,
  queryAllRegionalReadings,
  queryRegionalReadings,
} = require('../services/readingService')

function buildFilter(query) {
  const filter = {}
  if (query.stationId) filter.stationId = String(query.stationId).toUpperCase()
  if (query.from || query.to) {
    filter.recordedAt = {}
    if (query.from) {
      const from = new Date(query.from)
      if (Number.isNaN(from.getTime())) throw new ApiError(400, 'Invalid from date')
      filter.recordedAt.$gte = from
    }
    if (query.to) {
      const to = new Date(query.to)
      if (Number.isNaN(to.getTime())) throw new ApiError(400, 'Invalid to date')
      filter.recordedAt.$lte = to
    }
  }
  return filter
}

async function listReadings(req, res) {
  const filter = buildFilter(req.query)
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 1000)
  const region = req.query.region ? getRegion(req.query.region).id : null
  const query = region
    ? await queryRegionalReadings(region, filter).limit(limit).lean()
    : await queryAllRegionalReadings(filter).limit(limit)
  const collectionsAccessed = region
    ? [REGIONS[region].collection]
    : getAllRegions().map((item) => item.collection)
  res.json({
    data: query,
    count: query.length,
    collectionsAccessed,
    collectionAccessCount: collectionsAccessed.length,
  })
}

async function listRegionalReadings(req, res) {
  const region = getRegion(req.params.region).id
  const filter = buildFilter(req.query)
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 1000)
  const readings = await queryRegionalReadings(region, filter).limit(limit).lean()
  res.json({
    region,
    collection: REGIONS[region].collection,
    data: readings,
    count: readings.length,
    collectionsAccessed: [REGIONS[region].collection],
    collectionAccessCount: 1,
  })
}

async function createReading(req, res) {
  const { stationId } = req.body
  if (!stationId) throw new ApiError(400, 'stationId is required')
  const station = await WeatherStation.findOne({ stationId: String(stationId).toUpperCase() })
  if (!station) throw new ApiError(404, 'Weather station not found')
  if (req.body.region && getRegion(req.body.region).id !== station.region) {
    throw new ApiError(400, 'Reading region must match the assigned station region')
  }

  const reading = await createRegionalReading({
    stationId: station.stationId,
    region: station.region,
    temperature: req.body.temperature,
    humidity: req.body.humidity,
    windSpeed: req.body.windSpeed,
    atmosphericPressure: req.body.atmosphericPressure,
    rainfall: req.body.rainfall,
    recordedAt: req.body.recordedAt ? new Date(req.body.recordedAt) : new Date(),
    simulated: Boolean(req.body.simulated),
  })
  res.status(201).json({ data: reading })
}

function randomBetween(min, max, digits = 1) {
  const scale = 10 ** digits
  return Math.round((min + Math.random() * (max - min)) * scale) / scale
}

async function simulateReadings(req, res) {
  const filter = {}
  if (req.body.stationId) filter.stationId = String(req.body.stationId).toUpperCase()
  if (req.body.region) filter.region = getRegion(req.body.region).id
  const candidates = await WeatherStation.find(filter).limit(req.body.stationId ? 1 : 20)
  if (!candidates.length) throw new ApiError(404, 'No matching weather stations found')

  const readings = await Promise.all(candidates.map((station) => createRegionalReading({
    stationId: station.stationId,
    region: station.region,
    temperature: randomBetween(-8, 39),
    humidity: randomBetween(18, 96, 0),
    windSpeed: randomBetween(0, 18),
    atmosphericPressure: randomBetween(990, 1032, 0),
    rainfall: randomBetween(0, 9),
    recordedAt: new Date(),
    simulated: true,
  })))
  res.status(201).json({ simulated: true, data: readings, count: readings.length })
}

async function readingTrends(req, res) {
  const region = req.query.region ? getRegion(req.query.region).id : undefined
  const data = await getReadingTrends({
    region,
    stationId: req.query.stationId,
    range: req.query.range,
  })
  res.json({ data, count: data.length, range: req.query.range || '24h' })
}

async function analyzeQuery(req, res) {
  const result = await runRegionalQuery(req.body || {})
  res.json({ data: result })
}

async function compareQueries(req, res) {
  const result = await compareRegionalQueries(req.body || {})
  res.json({ data: result })
}

function queryHistory(req, res) {
  const data = listQueryHistory(req.query.limit)
  res.json({ data, count: data.length })
}

module.exports = {
  analyzeQuery,
  compareQueries,
  createReading,
  listQueryHistory: queryHistory,
  listReadings,
  listRegionalReadings,
  readingTrends,
  simulateReadings,
}
