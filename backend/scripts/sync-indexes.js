require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') })

const WeatherAlert = require('../models/WeatherAlert')
const WeatherStation = require('../models/WeatherStation')
const { getWeatherReadingModels } = require('../models/WeatherReading')
const { connectDatabase, mongoose } = require('../config/database')

async function syncIndexes() {
  await connectDatabase()
  const models = [WeatherStation, WeatherAlert, ...Object.values(getWeatherReadingModels())]
  try {
    for (const model of models) {
      const removed = await model.syncIndexes()
      console.log(`${model.collection.name}: indexes synchronized${removed.length ? `; removed ${removed.join(', ')}` : ''}`)
    }
  } finally {
    await mongoose.disconnect()
  }
}

syncIndexes().catch((error) => {
  console.error(`Index synchronization failed: ${error.message}`)
  process.exitCode = 1
})
