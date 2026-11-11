const mongoose = require('mongoose')
const ApiError = require('../utils/ApiError')

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error)

  let status = error.status || 500
  let message = error.message || 'Internal server error'
  let details = error.details

  if (error instanceof mongoose.Error.ValidationError) {
    status = 400
    message = 'Request validation failed'
    details = Object.values(error.errors).map((item) => ({ field: item.path, message: item.message }))
  } else if (error instanceof mongoose.Error.CastError) {
    status = 400
    message = `Invalid value for ${error.path}`
  } else if (error.code === 11000) {
    status = 409
    message = 'A record with that unique value already exists'
    details = { fields: Object.keys(error.keyValue || {}) }
  } else if (!(error instanceof ApiError) && status === 500) {
    console.error('Unhandled API error:', error)
  }

  res.status(status).json({ error: message, ...(details ? { details } : {}) })
}

module.exports = errorHandler
