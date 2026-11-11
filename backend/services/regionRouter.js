const ApiError = require('../utils/ApiError')

const REGIONS = Object.freeze({
  north: Object.freeze({ id: 'north', name: 'North Region', collection: 'north_weather_readings', color: '#38bdf8' }),
  south: Object.freeze({ id: 'south', name: 'South Region', collection: 'south_weather_readings', color: '#a78bfa' }),
  east: Object.freeze({ id: 'east', name: 'East Region', collection: 'east_weather_readings', color: '#34d399' }),
  west: Object.freeze({ id: 'west', name: 'West Region', collection: 'west_weather_readings', color: '#fbbf24' }),
})

function normalizeRegion(region) {
  if (typeof region !== 'string') return ''
  return region.trim().toLowerCase().replace(/\s+region$/i, '')
}

function getRegion(region) {
  const regionId = normalizeRegion(region)
  const definition = REGIONS[regionId]
  if (!definition) {
    throw new ApiError(400, 'Invalid region', { allowedRegions: Object.keys(REGIONS) })
  }
  return definition
}

function getAllRegions() {
  return Object.values(REGIONS)
}

function getReadingModel(region, models) {
  const { id } = getRegion(region)
  const model = models[id]
  if (!model) throw new Error(`Reading model for region "${id}" is not registered`)
  return model
}

function getAllReadingModels(models) {
  return getAllRegions().map(({ id }) => {
    if (!models[id]) throw new Error(`Reading model for region "${id}" is not registered`)
    return models[id]
  })
}

module.exports = { REGIONS, getAllReadingModels, getAllRegions, getReadingModel, normalizeRegion, getRegion }
