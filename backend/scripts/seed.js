require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') })

const { connectDatabase, mongoose } = require('../config/database')
const WeatherAlert = require('../models/WeatherAlert')
const WeatherStation = require('../models/WeatherStation')
const { getWeatherReadingModels } = require('../models/WeatherReading')

const stationSeeds = [
  ['SKY-N-1042', 'Aurora Ridge', 'north', 'Fairbanks, Alaska', 64.84, -147.72, -4.8, 72, 'online'],
  ['SKY-N-1087', 'Pine Valley', 'north', 'Bergen, Norway', 60.39, 5.32, 6.2, 81, 'online'],
  ['SKY-N-1124', 'Frostline Point', 'north', 'Reykjavik, Iceland', 64.15, -21.94, 2.1, 76, 'offline'],
  ['SKY-N-1159', 'Glacier Watch', 'north', 'Tromso, Norway', 69.65, 18.96, -2.6, 70, 'online'],
  ['SKY-N-1190', 'Highland Echo', 'north', 'Inverness, Scotland', 57.48, -4.22, 8.3, 68, 'warning'],
  ['SKY-S-2031', 'Cape Meridian', 'south', 'Cape Town, South Africa', -33.92, 18.42, 24.3, 48, 'online'],
  ['SKY-S-2068', 'Southern Cross', 'south', 'Wellington, New Zealand', -41.29, 174.78, 17.8, 67, 'online'],
  ['SKY-S-2115', 'Atacama Watch', 'south', 'Antofagasta, Chile', -23.65, -70.4, 29.6, 24, 'online'],
  ['SKY-S-2152', 'Coral Coast', 'south', 'Perth, Australia', -31.95, 115.86, 27.1, 42, 'warning'],
  ['SKY-S-2194', 'Patagonia Field', 'south', 'Punta Arenas, Chile', -53.16, -70.91, 9.2, 57, 'online'],
  ['SKY-E-3014', 'Monsoon Gate', 'east', 'Mumbai, India', 19.08, 72.88, 31.4, 84, 'online'],
  ['SKY-E-3077', 'Cedar Observatory', 'east', 'Sapporo, Japan', 43.06, 141.35, 11.7, 59, 'online'],
  ['SKY-E-3129', 'Delta Field', 'east', 'Singapore', 1.35, 103.82, 28.1, 79, 'warning'],
  ['SKY-E-3162', 'Red River Station', 'east', 'Hanoi, Vietnam', 21.03, 105.85, 30.2, 81, 'online'],
  ['SKY-E-3198', 'Monsoon Ridge', 'east', 'Kathmandu, Nepal', 27.72, 85.32, 19.6, 64, 'online'],
  ['SKY-W-4018', 'Sierra Summit', 'west', 'Denver, Colorado', 39.74, -104.99, 18.6, 36, 'online'],
  ['SKY-W-4063', 'Pacific Beacon', 'west', 'Seattle, Washington', 47.61, -122.33, 13.2, 74, 'online'],
  ['SKY-W-4120', 'Desert Bloom', 'west', 'Phoenix, Arizona', 33.45, -112.07, 35.8, 19, 'offline'],
  ['SKY-W-4151', 'Coastal Watch', 'west', 'San Diego, California', 32.72, -117.16, 22.8, 58, 'online'],
  ['SKY-W-4196', 'Canyon Edge', 'west', 'Salt Lake City, Utah', 40.76, -111.89, 15.4, 43, 'online'],
].map(([stationId, stationName, region, city, latitude, longitude, temperature, humidity, status]) => ({
  stationId,
  stationName,
  region,
  city,
  latitude,
  longitude,
  temperature,
  humidity,
  status,
}))

const alertSeeds = [
  { alertId: 'ALT-SEED-2481', stationId: 'SKY-W-4120', alertType: 'high_temperature', severity: 'critical', message: 'Temperature threshold exceeded: 35.8°C recorded.' },
  { alertId: 'ALT-SEED-2479', stationId: 'SKY-N-1124', alertType: 'connectivity', severity: 'warning', message: 'Station stopped reporting; latest heartbeat is overdue.' },
  { alertId: 'ALT-SEED-2474', stationId: 'SKY-E-3014', alertType: 'heavy_rainfall', severity: 'warning', message: 'Heavy rainfall detected: 8.6 mm in the latest reporting interval.' },
  { alertId: 'ALT-SEED-2468', stationId: 'SKY-N-1042', alertType: 'low_temperature', severity: 'information', message: 'Low temperature advisory: -4.8°C recorded.' },
  { alertId: 'ALT-SEED-2455', stationId: 'SKY-S-2068', alertType: 'connectivity', severity: 'information', message: 'Intermittent connection restored after 11 minutes.' },
]

async function seed() {
  await connectDatabase()
  const readingModels = getWeatherReadingModels()
  await Promise.all([
    WeatherStation.createIndexes(),
    WeatherAlert.createIndexes(),
    ...Object.values(readingModels).map((model) => model.createIndexes()),
  ])

  const stationOperations = stationSeeds.map((station, index) => ({
    updateOne: {
      filter: { stationId: station.stationId },
      update: {
        $set: {
          stationName: station.stationName,
          region: station.region,
          city: station.city,
          latitude: station.latitude,
          longitude: station.longitude,
          location: { type: 'Point', coordinates: [station.longitude, station.latitude] },
          status: station.status,
        },
        $setOnInsert: { createdAt: new Date(Date.now() - (index + 1) * 86_400_000) },
      },
      upsert: true,
    },
  }))
  await WeatherStation.bulkWrite(stationOperations, { ordered: true })

  const readingsByRegion = { north: [], south: [], east: [], west: [] }
  const now = Date.now()
  for (const [stationIndex, station] of stationSeeds.entries()) {
    for (let readingIndex = 0; readingIndex < 10; readingIndex += 1) {
      const angle = (readingIndex / 10) * Math.PI * 2
      readingsByRegion[station.region].push({
        updateOne: {
          filter: { seedKey: `seed:${station.stationId}:${readingIndex}` },
          update: {
            $set: {
              stationId: station.stationId,
              region: station.region,
              temperature: Math.round((station.temperature + Math.sin(angle) * 2.4) * 10) / 10,
              humidity: Math.min(100, Math.max(0, Math.round(station.humidity + Math.cos(angle) * 8))),
              windSpeed: Math.round((2.5 + ((stationIndex * 3 + readingIndex) % 70) / 10) * 10) / 10,
              atmosphericPressure: 995 + ((stationIndex * 7 + readingIndex * 3) % 33),
              rainfall: readingIndex % 4 === 0 ? Math.round(((stationIndex + readingIndex) % 9) * 10) / 10 : 0,
              recordedAt: new Date(now - readingIndex * 3 * 60 * 60 * 1000),
              simulated: false,
            },
            $setOnInsert: { seedKey: `seed:${station.stationId}:${readingIndex}` },
          },
          upsert: true,
        },
      })
    }
  }

  for (const [region, operations] of Object.entries(readingsByRegion)) {
    await readingModels[region].bulkWrite(operations, { ordered: true })
  }

  const stationById = new Map(stationSeeds.map((station) => [station.stationId, station]))
  await WeatherAlert.bulkWrite(alertSeeds.map((alert, index) => ({
    updateOne: {
      filter: { alertId: alert.alertId },
      update: {
        $set: {
          ...alert,
          region: stationById.get(alert.stationId).region,
          status: index === alertSeeds.length - 1 ? 'resolved' : 'active',
          resolvedAt: index === alertSeeds.length - 1 ? new Date() : null,
        },
        $setOnInsert: { createdAt: new Date(Date.now() - (index + 1) * 30 * 60_000) },
      },
      upsert: true,
    },
  })), { ordered: true })

  const counts = await Promise.all(Object.entries(readingModels).map(async ([region, model]) => ({
    region,
    readings: await model.countDocuments(),
  })))
  console.log(`Seed complete: ${stationSeeds.length} stations, ${counts.reduce((sum, item) => sum + item.readings, 0)} regional readings`)
  for (const item of counts) console.log(`  ${item.region}: ${item.readings}`)
}

seed()
  .catch((error) => {
    console.error('Database seed failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
