const mongoose = require('mongoose')
const { getAllRegions } = require('../services/regionRouter')

const regionValues = getAllRegions().map((region) => region.id)

const weatherStationSchema = new mongoose.Schema({
  stationId: { type: String, required: true, trim: true, uppercase: true, unique: true, maxlength: 40 },
  stationName: { type: String, required: true, trim: true, maxlength: 100 },
  region: { type: String, required: true, lowercase: true, enum: regionValues },
  latitude: { type: Number, required: true, min: -90, max: 90 },
  longitude: { type: Number, required: true, min: -180, max: 180 },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator(coordinates) {
          return coordinates.length === 2
            && coordinates[0] >= -180 && coordinates[0] <= 180
            && coordinates[1] >= -90 && coordinates[1] <= 90
        },
        message: 'location.coordinates must be [longitude, latitude] within valid bounds',
      },
    },
  },
  city: { type: String, trim: true, maxlength: 120, default: '' },
  status: { type: String, enum: ['online', 'warning', 'offline'], default: 'online', index: true },
}, {
  collection: 'WeatherStations',
  timestamps: true,
  versionKey: false,
})

weatherStationSchema.index({ location: '2dsphere' })
weatherStationSchema.index({ region: 1, status: 1 })

module.exports = mongoose.models.WeatherStation
  || mongoose.model('WeatherStation', weatherStationSchema)
