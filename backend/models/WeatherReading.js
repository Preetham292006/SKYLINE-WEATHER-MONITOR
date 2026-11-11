const mongoose = require('mongoose')
const { getAllRegions, getRegion } = require('../services/regionRouter')

const regionValues = getAllRegions().map((region) => region.id)

const weatherReadingSchema = new mongoose.Schema({
  stationId: { type: String, required: true, trim: true, uppercase: true, maxlength: 40 },
  region: { type: String, required: true, lowercase: true, enum: regionValues },
  temperature: { type: Number, required: true, min: -100, max: 80 },
  humidity: { type: Number, required: true, min: 0, max: 100 },
  windSpeed: { type: Number, required: true, min: 0, max: 200 },
  atmosphericPressure: { type: Number, required: true, min: 800, max: 1200 },
  rainfall: { type: Number, required: true, min: 0, max: 1000 },
  recordedAt: { type: Date, required: true, default: Date.now },
  simulated: { type: Boolean, default: false },
  seedKey: { type: String, trim: true },
}, {
  timestamps: true,
  versionKey: false,
})

weatherReadingSchema.index({ stationId: 1, recordedAt: -1 })
weatherReadingSchema.index({ recordedAt: -1 })
weatherReadingSchema.index({ region: 1, recordedAt: -1 })
weatherReadingSchema.index({ seedKey: 1 }, { unique: true, sparse: true })

const modelCache = new Map()

function getWeatherReadingModel(region) {
  const { id, collection } = getRegion(region)
  if (!modelCache.has(id)) {
    const modelName = `WeatherReading_${id}`
    modelCache.set(id, mongoose.models[modelName]
      || mongoose.model(modelName, weatherReadingSchema, collection))
  }
  return modelCache.get(id)
}

function getWeatherReadingModels() {
  return Object.fromEntries(getAllRegions().map(({ id }) => [id, getWeatherReadingModel(id)]))
}

module.exports = { getWeatherReadingModel, getWeatherReadingModels, weatherReadingSchema }
