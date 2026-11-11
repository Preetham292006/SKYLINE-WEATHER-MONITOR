const express = require('express')
const controller = require('../controllers/stationController')

const router = express.Router()

router.get('/', controller.listStations)
router.post('/', controller.createStation)
router.get('/:stationId', controller.getStation)
router.put('/:stationId', controller.updateStation)
router.delete('/:stationId', controller.deleteStation)

module.exports = router
