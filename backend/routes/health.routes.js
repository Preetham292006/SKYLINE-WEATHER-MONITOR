const express = require('express')
const { databaseStatus } = require('../config/database')

const router = express.Router()

router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SKYLINE Weather Intelligence API is running',
    status: 'online',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      stations: '/api/stations',
      readings: '/api/readings',
      dashboard: '/api/dashboard',
      regions: '/api/regions',
      alerts: '/api/alerts',
    },
    database: databaseStatus(),
    timestamp: new Date().toISOString(),
  })
})

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'skyline-api',
    database: databaseStatus(),
    timestamp: new Date().toISOString(),
  })
})

module.exports = router
