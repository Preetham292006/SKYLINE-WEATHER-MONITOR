const express = require('express')
const controller = require('../controllers/regionController')

const router = express.Router()

router.get('/', controller.listRegions)
router.get('/:region/stats', controller.getRegionStatistics)
router.get('/:region', controller.getRegionDetails)

module.exports = router
