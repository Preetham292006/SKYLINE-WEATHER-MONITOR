require('dotenv').config({ path: require('node:path').join(__dirname, '.env') })

const cors = require('cors')
const express = require('express')
const healthRoutes = require('./routes/health.routes')
const stationRoutes = require('./routes/station.routes')
const readingRoutes = require('./routes/reading.routes')
const dashboardRoutes = require('./routes/dashboard.routes')
const regionRoutes = require('./routes/region.routes')
const alertRoutes = require('./routes/alert.routes')
const requireDatabase = require('./middleware/requireDatabase')
const errorHandler = require('./middleware/errorHandler')

const app = express()

const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(cors({ origin: allowedOrigins }))
app.use(express.json({ limit: '1mb' }))
app.use('/api', healthRoutes)
app.use('/api/stations', requireDatabase, stationRoutes)
app.use('/api/readings', requireDatabase, readingRoutes)
app.use('/api/dashboard', requireDatabase, dashboardRoutes)
app.use('/api/regions', requireDatabase, regionRoutes)
app.use('/api/alerts', requireDatabase, alertRoutes)

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.use(errorHandler)

module.exports = app
