const express = require('express')
const { databaseStatus } = require('../config/database')

const router = express.Router()

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'skyline-api',
    database: databaseStatus(),
    timestamp: new Date().toISOString(),
  })
})

module.exports = router
