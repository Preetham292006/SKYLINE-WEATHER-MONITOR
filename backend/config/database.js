const mongoose = require('mongoose')

let connectionPromise

function connectDatabase() {
  if (mongoose.connection.readyState === 1) return Promise.resolve(mongoose.connection)
  if (connectionPromise) return connectionPromise

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/skyline_weather'

  connectionPromise = mongoose.connect(uri, {
    serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS) || 5000,
  }).then((connection) => {
    connectionPromise = null
    console.log(`MongoDB connected: ${connection.connection.name}`)
    return connection.connection
  }).catch((error) => {
    connectionPromise = null
    throw error
  })

  return connectionPromise
}

function databaseStatus() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting']
  return states[mongoose.connection.readyState] || 'unknown'
}

module.exports = { connectDatabase, databaseStatus, mongoose }
