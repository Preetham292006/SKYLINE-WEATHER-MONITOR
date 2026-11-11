const { databaseStatus } = require('../config/database')

function requireDatabase(req, res, next) {
  if (databaseStatus() === 'connected') return next()
  return res.status(503).json({
    error: 'Database is unavailable',
    database: databaseStatus(),
  })
}

module.exports = requireDatabase
