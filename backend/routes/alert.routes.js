const express = require('express')
const controller = require('../controllers/alertController')

const router = express.Router()

router.get('/', controller.listAlerts)
router.post('/', controller.createAlert)
router.patch('/:alertId/resolve', controller.resolveAlert)

module.exports = router
