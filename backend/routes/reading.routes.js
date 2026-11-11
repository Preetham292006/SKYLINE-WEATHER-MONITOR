const express = require('express')
const controller = require('../controllers/readingController')

const router = express.Router()

router.get('/', controller.listReadings)
router.get('/query-history', controller.listQueryHistory)
router.get('/region/:region', controller.listRegionalReadings)
router.post('/', controller.createReading)
router.post('/simulate', controller.simulateReadings)
router.post('/query', controller.analyzeQuery)
router.post('/benchmark', controller.compareQueries)
router.get('/trends', controller.readingTrends)

module.exports = router
