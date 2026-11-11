const { getAllRegions, getReadingModel, getRegion } = require('./regionRouter')
const { getWeatherReadingModels } = require('../models/WeatherReading')

function unionPipeline(models, pipeline = []) {
  const collections = getAllRegions()
  const [first, ...rest] = collections
  const model = models[first.id]
  return model.aggregate([
    ...rest.map(({ id }) => ({ $unionWith: { coll: models[id].collection.name } })),
    ...pipeline,
  ])
}

function createRegionalReading(data, models = getWeatherReadingModels()) {
  const model = getReadingModel(data.region, models)
  return model.create(data)
}

function queryRegionalReadings(region, query = {}, models = getWeatherReadingModels()) {
  const model = getReadingModel(region, models)
  return model.find(query).sort({ recordedAt: -1 })
}

function queryAllRegionalReadings(query = {}, models = getWeatherReadingModels()) {
  const conditions = Object.entries(query).map(([field, value]) => ({ [field]: value }))
  const pipeline = [
    { $match: conditions.length ? { $and: conditions } : {} },
    { $sort: { recordedAt: -1 } },
  ]
  return unionPipeline(models, pipeline)
}

async function getRegionalReadingAggregates(models = getWeatherReadingModels()) {
  return unionPipeline(models, [
    {
      $group: {
        _id: '$region',
        readings: { $sum: 1 },
        averageTemperature: { $avg: '$temperature' },
        averageHumidity: { $avg: '$humidity' },
      },
    },
  ])
}

async function getAllReadingStats(models = getWeatherReadingModels()) {
  return unionPipeline(models, [
    {
      $group: {
        _id: null,
        totalReadings: { $sum: 1 },
        averageTemperature: { $avg: '$temperature' },
        averageHumidity: { $avg: '$humidity' },
        averageWindSpeed: { $avg: '$windSpeed' },
        averageRainfall: { $avg: '$rainfall' },
      },
    },
  ])
}

async function getStationReadingSummaries(models = getWeatherReadingModels()) {
  return unionPipeline(models, [
    { $sort: { recordedAt: 1 } },
    {
      $group: {
        _id: '$stationId',
        readingsStored: { $sum: 1 },
        latestReading: { $last: '$$ROOT' },
      },
    },
  ])
}

async function getReadingTrends({ region, stationId, range = '24h' } = {}, models = getWeatherReadingModels()) {
  const hoursByRange = { '24h': 24, '7d': 168, '30d': 720 }
  const hours = hoursByRange[range] || hoursByRange['24h']
  const match = { recordedAt: { $gte: new Date(Date.now() - hours * 60 * 60 * 1000) } }
  if (region) match.region = getRegion(region).id
  if (stationId) match.stationId = stationId.toUpperCase()
  const unit = hours <= 24 ? 'hour' : 'day'
  const dateTrunc = { date: '$recordedAt', unit, timezone: 'UTC' }
  if (hours <= 24) dateTrunc.binSize = 2

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: { $dateTrunc: dateTrunc },
        temperature: { $avg: '$temperature' },
        humidity: { $avg: '$humidity' },
        readings: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        recordedAt: '$_id',
        time: {
          $dateToString: {
            date: '$_id',
            format: unit === 'hour' ? '%H:%M' : '%b %d',
            timezone: 'UTC',
          },
        },
        temperature: { $round: ['$temperature', 1] },
        humidity: { $round: ['$humidity', 0] },
        readings: 1,
      },
    },
  ]
  if (region) return getReadingModel(region, models).aggregate(pipeline)
  return unionPipeline(models, pipeline)
}

function regionCollections(models = getWeatherReadingModels()) {
  return getAllRegions().map(({ id, collection }) => ({
    id,
    collection,
    model: models[id],
  }))
}

module.exports = {
  createRegionalReading,
  getAllReadingStats,
  getReadingTrends,
  getRegionalReadingAggregates,
  getStationReadingSummaries,
  queryAllRegionalReadings,
  queryRegionalReadings,
  regionCollections,
}
