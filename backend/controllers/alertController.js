const { randomUUID } = require('node:crypto')
const WeatherAlert = require('../models/WeatherAlert')
const WeatherStation = require('../models/WeatherStation')
const ApiError = require('../utils/ApiError')
const { getRegion } = require('../services/regionRouter')

function toClientAlert(alert) {
  const createdAt = alert.createdAt instanceof Date ? alert.createdAt : new Date(alert.createdAt)
  const minutesAgo = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 60_000))
  return {
    ...alert,
    type: alert.alertType,
    title: alert.message,
    detail: alert.message,
    resolved: alert.status === 'resolved',
    minutesAgo,
  }
}

async function listAlerts(req, res) {
  const filter = {}
  if (req.query.status) {
    const status = req.query.status === 'unresolved' ? 'active' : req.query.status
    if (!['active', 'resolved'].includes(status)) throw new ApiError(400, 'Invalid alert status')
    filter.status = status
  }
  if (req.query.severity) {
    if (!['critical', 'warning', 'information'].includes(req.query.severity)) throw new ApiError(400, 'Invalid alert severity')
    filter.severity = req.query.severity
  }
  if (req.query.region) filter.region = getRegion(req.query.region).id
  const limit = Math.min(Math.max(Number(req.query.limit) || 200, 1), 1000)
  const alerts = await WeatherAlert.find(filter).sort({ createdAt: -1 }).limit(limit).lean()
  const stationIds = [...new Set(alerts.map((alert) => alert.stationId))]
  const stationNames = new Map((await WeatherStation.find({ stationId: { $in: stationIds } }).select('stationId stationName').lean())
    .map((station) => [station.stationId, station.stationName]))
  res.json({ data: alerts.map((alert) => toClientAlert({ ...alert, stationName: stationNames.get(alert.stationId) })), count: alerts.length })
}

async function createAlert(req, res) {
  const { stationId, alertType, severity, message } = req.body
  if (!stationId) throw new ApiError(400, 'stationId is required')
  const station = await WeatherStation.findOne({ stationId: String(stationId || '').toUpperCase() })
  if (!station) throw new ApiError(404, 'Weather station not found')
  if (req.body.region && getRegion(req.body.region).id !== station.region) {
    throw new ApiError(400, 'Alert region must match the assigned station region')
  }

  const alert = await WeatherAlert.create({
    alertId: req.body.alertId || `ALT-${randomUUID().slice(0, 8).toUpperCase()}`,
    stationId: station.stationId,
    region: station.region,
    alertType,
    severity,
    message,
    status: 'active',
  })
  res.status(201).json({ data: toClientAlert({ ...alert.toObject(), stationName: station.stationName }) })
}

async function resolveAlert(req, res) {
  const alert = await WeatherAlert.findOneAndUpdate(
    { alertId: req.params.alertId.toUpperCase() },
    { $set: { status: 'resolved', resolvedAt: new Date() } },
    { returnDocument: 'after', runValidators: true },
  ).lean()
  if (!alert) throw new ApiError(404, 'Weather alert not found')
  res.json({ data: toClientAlert(alert) })
}

module.exports = { createAlert, listAlerts, resolveAlert, toClientAlert }
