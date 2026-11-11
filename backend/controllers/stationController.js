const { randomUUID } = require('node:crypto')
const WeatherStation = require('../models/WeatherStation')
const ApiError = require('../utils/ApiError')
const { getRegion } = require('../services/regionRouter')
const { getStationReadingSummaries } = require('../services/readingService')

function mapLatestReading(reading) {
  if (!reading) return {}
  return {
    temperature: reading.temperature,
    humidity: reading.humidity,
    windSpeed: reading.windSpeed,
    atmosphericPressure: reading.atmosphericPressure,
    rainfall: reading.rainfall,
    recordedAt: reading.recordedAt,
    simulated: reading.simulated,
    dataSource: reading.dataSource
      || (reading.seedKey ? 'seeded-demo' : reading.simulated ? 'monitoring-simulation' : 'unverified-ingest'),
  }
}

async function listStations(req, res) {
  const { region, status, search } = req.query
  const filter = {}
  if (region) filter.region = getRegion(region).id
  if (status) {
    if (!['online', 'warning', 'offline'].includes(status)) throw new ApiError(400, 'Invalid station status')
    filter.status = status
  }
  if (search) {
    const escaped = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    filter.$or = [
      { stationId: { $regex: escaped, $options: 'i' } },
      { stationName: { $regex: escaped, $options: 'i' } },
      { city: { $regex: escaped, $options: 'i' } },
    ]
  }

  const limit = Math.min(Math.max(Number(req.query.limit) || 500, 1), 1000)
  const [records, summaries] = await Promise.all([
    WeatherStation.find(filter).sort({ stationId: 1 }).limit(limit).lean(),
    getStationReadingSummaries(),
  ])
  const summaryByStation = new Map(summaries.map((summary) => [summary._id, summary]))
  res.json({
    data: records.map((station) => {
      const summary = summaryByStation.get(station.stationId)
      return {
        ...station,
        readingsStored: summary?.readingsStored || 0,
        latestReading: mapLatestReading(summary?.latestReading),
      }
    }),
    count: records.length,
  })
}

async function getStation(req, res) {
  const station = await WeatherStation.findOne({ stationId: req.params.stationId.toUpperCase() }).lean()
  if (!station) throw new ApiError(404, 'Weather station not found')
  const summaries = await getStationReadingSummaries()
  const summary = summaries.find((item) => item._id === station.stationId)
  res.json({
    data: {
      ...station,
      readingsStored: summary?.readingsStored || 0,
      latestReading: mapLatestReading(summary?.latestReading),
    },
  })
}

async function createStation(req, res) {
  const { stationId, stationName, name, region, latitude, longitude, lat, lon, city, status } = req.body
  const validRegion = getRegion(region).id
  const station = await WeatherStation.create({
    stationId: stationId || `SKY-${validRegion[0].toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`,
    stationName: stationName || name,
    region: validRegion,
    latitude: latitude ?? lat,
    longitude: longitude ?? lon,
    location: {
      type: 'Point',
      coordinates: [Number(longitude ?? lon), Number(latitude ?? lat)],
    },
    city,
    status,
  })
  res.status(201).json({ data: station })
}

async function updateStation(req, res) {
  const { stationName, name, region, latitude, longitude, lat, lon, city, status } = req.body
  const update = {}
  if (stationName !== undefined || name !== undefined) update.stationName = stationName ?? name
  if (region !== undefined) update.region = getRegion(region).id
  if (city !== undefined) update.city = city
  if (status !== undefined) update.status = status
  const nextLatitude = latitude ?? lat
  const nextLongitude = longitude ?? lon
  if (nextLatitude !== undefined) update.latitude = Number(nextLatitude)
  if (nextLongitude !== undefined) update.longitude = Number(nextLongitude)
  if (nextLatitude !== undefined || nextLongitude !== undefined) {
    const existing = await WeatherStation.findOne({ stationId: req.params.stationId.toUpperCase() }).lean()
    if (!existing) throw new ApiError(404, 'Weather station not found')
    update.location = {
      type: 'Point',
      coordinates: [nextLongitude ?? existing.longitude, nextLatitude ?? existing.latitude],
    }
  }
  const station = await WeatherStation.findOneAndUpdate(
    { stationId: req.params.stationId.toUpperCase() },
    { $set: update },
    { returnDocument: 'after', runValidators: true },
  )
  if (!station) throw new ApiError(404, 'Weather station not found')
  res.json({ data: station })
}

async function deleteStation(req, res) {
  const station = await WeatherStation.findOneAndDelete({ stationId: req.params.stationId.toUpperCase() })
  if (!station) throw new ApiError(404, 'Weather station not found')
  res.status(200).json({ data: station, message: 'Station removed; historical readings and alerts were retained' })
}

module.exports = { createStation, deleteStation, getStation, listStations, updateStation }
