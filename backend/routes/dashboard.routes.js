const express = require('express')
const controller = require('../controllers/dashboardController')

const router = express.Router()

router.get('/stats', controller.stats)
router.get('/overview', controller.overview)
router.get('/trends', controller.trends)

module.exports = router
