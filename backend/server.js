require('dotenv').config({ path: require('node:path').join(__dirname, '.env') })

const app = require('./app')
const { connectDatabase, mongoose } = require('./config/database')

const port = Number(process.env.PORT) || 5000
const retryIntervalMs = Number(process.env.MONGODB_RETRY_INTERVAL_MS) || 5000
let shuttingDown = false

const server = app.listen(port, () => {
  console.log(`SKYLINE API listening on http://localhost:${port}`)
})

mongoose.connection.on('disconnected', () => {
  if (!shuttingDown) console.warn('MongoDB disconnected; database endpoints will return 503')
})

async function connectWithRetry() {
  while (!shuttingDown) {
    try {
      await connectDatabase()
      return
    } catch (error) {
      console.error(`MongoDB connection failed: ${error.message}`)
      if (!shuttingDown) await new Promise((resolve) => setTimeout(resolve, retryIntervalMs))
    }
  }
}

function shutdown(signal) {
  if (shuttingDown) return
  shuttingDown = true
  console.log(`${signal} received; shutting down SKYLINE API`)
  server.close(async (error) => {
    if (error) console.error('HTTP server shutdown failed:', error)
    await mongoose.disconnect()
    process.exitCode = error ? 1 : 0
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
connectWithRetry()
