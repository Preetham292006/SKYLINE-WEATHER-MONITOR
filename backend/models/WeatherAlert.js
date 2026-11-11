const mongoose = require('mongoose')
const { getAllRegions } = require('../services/regionRouter')

const regionValues = getAllRegions().map((region) => region.id)

const weatherAlertSchema = new mongoose.Schema({
  alertId: { type: String, required: true, trim: true, uppercase: true, unique: true, maxlength: 50 },
  stationId: { type: String, required: true, trim: true, uppercase: true, maxlength: 40 },
  region: { type: String, required: true, lowercase: true, enum: regionValues, index: true },
  alertType: { type: String, required: true, enum: ['high_temperature', 'low_temperature', 'heavy_rainfall', 'connectivity', 'other'] },
  severity: { type: String, required: true, enum: ['critical', 'warning', 'information'], index: true },
  message: { type: String, required: true, trim: true, maxlength: 500 },
  status: { type: String, enum: ['active', 'resolved'], default: 'active', index: true },
  resolvedAt: { type: Date, default: null },
}, {
  collection: 'WeatherAlerts',
  timestamps: { createdAt: true, updatedAt: false },
  versionKey: false,
})

weatherAlertSchema.index({ status: 1, createdAt: -1 })
weatherAlertSchema.index({ region: 1, status: 1, createdAt: -1 })

module.exports = mongoose.models.WeatherAlert
  || mongoose.model('WeatherAlert', weatherAlertSchema)
