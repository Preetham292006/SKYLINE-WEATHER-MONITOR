process.env.MONGODB_URI = process.env.SKYLINE_TEST_MONGODB_URI
  || 'mongodb://127.0.0.1:27017/skyline_weather_test'

const { after, before, test } = require('node:test')
const assert = require('node:assert/strict')
const app = require('../app')
const { connectDatabase, mongoose } = require('../config/database')
const WeatherAlert = require('../models/WeatherAlert')
const WeatherStation = require('../models/WeatherStation')
const { getWeatherReadingModel, getWeatherReadingModels } = require('../models/WeatherReading')
const { getReadingModel, getRegion } = require('../services/regionRouter')

let server
let baseUrl

before(async () => {
  await connectDatabase()
  await mongoose.connection.dropDatabase()
  await Promise.all([
    WeatherStation.createIndexes(),
    WeatherAlert.createIndexes(),
    ...Object.values(getWeatherReadingModels()).map((model) => model.createIndexes()),
  ])
  server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}/api`
})

after(async () => {
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
})

test('geographical router maps all supported regions and rejects invalid regions', () => {
  const models = getWeatherReadingModels()
  assert.equal(getReadingModel('North', models).collection.name, 'north_weather_readings')
  assert.equal(getReadingModel('south region', models).collection.name, 'south_weather_readings')
  assert.equal(getReadingModel('east', models).collection.name, 'east_weather_readings')
  assert.equal(getReadingModel('WEST', models).collection.name, 'west_weather_readings')
  assert.throws(() => getRegion('central'), { status: 400 })
})

test('Mongoose station model validates coordinates and region', async () => {
  const valid = new WeatherStation({
    stationId: 'SKY-N-9001',
    stationName: 'Validation Station',
    region: 'north',
    latitude: 64,
    longitude: -147,
    location: { type: 'Point', coordinates: [-147, 64] },
  })
  await assert.doesNotReject(valid.validate())

  const invalid = new WeatherStation({
    stationId: 'SKY-X-9002',
    stationName: 'Invalid Station',
    region: 'central',
    latitude: 95,
    longitude: 0,
    location: { type: 'Point', coordinates: [0, 95] },
  })
  await assert.rejects(invalid.validate(), (error) => error.name === 'ValidationError')
})

test('reading and alert models enforce required fields, ranges, and enums', async () => {
  const readingModel = getWeatherReadingModel('south')
  const validReading = new readingModel({
    stationId: 'SKY-S-VALID',
    region: 'south',
    temperature: 18.5,
    humidity: 55,
    windSpeed: 3,
    atmosphericPressure: 1012,
    rainfall: 0.2,
  })
  await assert.doesNotReject(validReading.validate())

  const invalidReading = new readingModel({
    stationId: 'SKY-S-INVALID',
    region: 'south',
    temperature: 120,
    humidity: 101,
    windSpeed: -1,
    atmosphericPressure: 400,
    rainfall: -3,
  })
  await assert.rejects(invalidReading.validate(), (error) => error.name === 'ValidationError')

  const validAlert = new WeatherAlert({
    alertId: 'ALT-VALID',
    stationId: 'SKY-S-VALID',
    region: 'south',
    alertType: 'high_temperature',
    severity: 'warning',
    message: 'Temperature threshold reached',
  })
  await assert.doesNotReject(validAlert.validate())

  const invalidAlert = new WeatherAlert({
    alertId: 'ALT-INVALID',
    stationId: 'SKY-S-VALID',
    region: 'central',
    alertType: 'unknown',
    severity: 'urgent',
    message: '',
  })
  await assert.rejects(invalidAlert.validate(), (error) => error.name === 'ValidationError')
})

test('database schemas declare the intended non-duplicate query and geographic indexes', async () => {
  const stationIndexes = await WeatherStation.listIndexes()
  const readingIndexes = await getWeatherReadingModels().south.listIndexes()
  const stationNames = stationIndexes.map((index) => index.name)
  const readingNames = readingIndexes.map((index) => index.name)

  assert.ok(stationNames.includes('stationId_1'))
  assert.ok(stationNames.includes('location_2dsphere'))
  assert.ok(stationNames.includes('region_1_status_1'))
  assert.ok(stationNames.includes('status_1'))
  assert.equal(stationNames.includes('region_1'), false)
  assert.ok(readingNames.includes('stationId_1_recordedAt_-1'))
  assert.ok(readingNames.includes('recordedAt_-1'))
  assert.ok(readingNames.includes('region_1_recordedAt_-1'))
})

test('health endpoint stays available and reports a connected database', async () => {
  const response = await fetch(`${baseUrl}/health`)
  const body = await response.json()
  assert.equal(response.status, 200)
  assert.equal(body.status, 'ok')
  assert.equal(body.database, 'connected')
})

test('CORS policy, malformed JSON, and duplicate keys return safe responses', async () => {
  const allowedOrigin = await fetch(`${baseUrl}/health`, { headers: { origin: 'http://localhost:5173' } })
  assert.equal(allowedOrigin.headers.get('access-control-allow-origin'), 'http://localhost:5173')

  const rejectedOrigin = await fetch(`${baseUrl}/health`, { headers: { origin: 'https://untrusted.example' } })
  assert.equal(rejectedOrigin.headers.get('access-control-allow-origin'), null)

  const malformedJson = await fetch(`${baseUrl}/stations`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{"stationId":',
  })
  assert.equal(malformedJson.status, 400)
  assert.equal(typeof (await malformedJson.json()).error, 'string')

  const createStation = async () => fetch(`${baseUrl}/stations`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      stationId: 'SKY-N-DUPLICATE',
      stationName: 'Duplicate Guard',
      region: 'north',
      latitude: 61,
      longitude: -149,
    }),
  })
  assert.equal((await createStation()).status, 201)
  const duplicate = await createStation()
  const duplicateBody = await duplicate.json()
  assert.equal(duplicate.status, 409)
  assert.deepEqual(duplicateBody.details.fields, ['stationId'])
  assert.equal(JSON.stringify(duplicateBody).includes('SKY-N-DUPLICATE'), false)
  await WeatherStation.deleteOne({ stationId: 'SKY-N-DUPLICATE' })
})

test('station CRUD, regional reading routing, dashboard analytics, and alert resolution work', async () => {
  const createStation = await fetch(`${baseUrl}/stations`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      stationId: 'SKY-N-TEST1',
      stationName: 'Test Ridge',
      region: 'north',
      latitude: 64.8,
      longitude: -147.7,
      city: 'Fairbanks, Alaska',
    }),
  })
  assert.equal(createStation.status, 201)

  const stationList = await fetch(`${baseUrl}/stations?region=north`)
  const stationBody = await stationList.json()
  assert.equal(stationBody.count, 1)
  const getStation = await fetch(`${baseUrl}/stations/SKY-N-TEST1`)
  assert.equal((await getStation.json()).data.stationId, 'SKY-N-TEST1')

  const readingResponse = await fetch(`${baseUrl}/readings`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      stationId: 'SKY-N-TEST1',
      temperature: 12.4,
      humidity: 54,
      windSpeed: 3.2,
      atmosphericPressure: 1012,
      rainfall: 0.1,
    }),
  })
  assert.equal(readingResponse.status, 201)
  const routedModel = getWeatherReadingModels().north
  assert.equal(await routedModel.countDocuments({ stationId: 'SKY-N-TEST1' }), 1)
  assert.equal(await getWeatherReadingModels().east.countDocuments({ stationId: 'SKY-N-TEST1' }), 0)

  const regionalReadings = await fetch(`${baseUrl}/readings/region/North`)
  assert.equal((await regionalReadings.json()).count, 1)
  const regionsResponse = await fetch(`${baseUrl}/regions`)
  assert.equal((await regionsResponse.json()).data.length, 4)
  const statsResponse = await fetch(`${baseUrl}/dashboard/stats`)
  const stats = (await statsResponse.json()).data
  assert.equal(stats.totalStations, 1)
  assert.equal(stats.totalReadings, 1)
  assert.equal(stats.averageTemperature, 12.4)
  const trendResponse = await fetch(`${baseUrl}/dashboard/trends?range=24h`)
  assert.equal((await trendResponse.json()).count, 1)

  const alertResponse = await fetch(`${baseUrl}/alerts`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      alertId: 'ALT-TEST1',
      stationId: 'SKY-N-TEST1',
      alertType: 'high_temperature',
      severity: 'warning',
      message: 'Temperature is above threshold.',
    }),
  })
  assert.equal(alertResponse.status, 201)
  const resolveResponse = await fetch(`${baseUrl}/alerts/ALT-TEST1/resolve`, { method: 'PATCH' })
  assert.equal(resolveResponse.status, 200)
  assert.equal((await resolveResponse.json()).data.status, 'resolved')
  const persistedAlert = await fetch(`${baseUrl}/alerts?status=resolved`)
  assert.equal((await persistedAlert.json()).count, 1)

  const updateResponse = await fetch(`${baseUrl}/stations/SKY-N-TEST1`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ status: 'warning' }),
  })
  assert.equal(updateResponse.status, 200)
  const deleteResponse = await fetch(`${baseUrl}/stations/SKY-N-TEST1`, { method: 'DELETE' })
  assert.equal(deleteResponse.status, 200)
})

test('invalid input, mismatched routing, missing routes, and absent records return useful errors', async () => {
  const invalidRegion = await fetch(`${baseUrl}/regions/central`)
  assert.equal(invalidRegion.status, 400)
  const missingStation = await fetch(`${baseUrl}/stations/MISSING-STATION`)
  assert.equal(missingStation.status, 404)
  const unknownRoute = await fetch(`${baseUrl}/does-not-exist`)
  assert.equal(unknownRoute.status, 404)
  const invalidStation = await fetch(`${baseUrl}/stations`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      stationId: 'SKY-X-1',
      stationName: 'Invalid Region',
      region: 'central',
      latitude: 0,
      longitude: 0,
    }),
  })
  assert.equal(invalidStation.status, 400)

  const unsafeSearch = await fetch(`${baseUrl}/stations?search=%5E.%2A%24`)
  assert.equal(unsafeSearch.status, 200)
  assert.equal((await unsafeSearch.json()).count, 0)

  const invalidStatus = await fetch(`${baseUrl}/alerts?status=%24gt`)
  assert.equal(invalidStatus.status, 400)

  const invalidReading = await fetch(`${baseUrl}/readings/query`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ strategy: 'routed', region: { $ne: null } }),
  })
  assert.equal(invalidReading.status, 400)
})

test('geographical query routing supports routed, multi-region, global, and scatter-gather analysis', async () => {
  const queryFrom = new Date().toISOString()
  const fixtures = [
    { region: 'north', stationId: 'SKY-N-QRY1' },
    { region: 'south', stationId: 'SKY-S-QRY1' },
    { region: 'east', stationId: 'SKY-E-QRY1' },
    { region: 'west', stationId: 'SKY-W-QRY1' },
  ]

  for (const [index, fixture] of fixtures.entries()) {
    const stationResponse = await fetch(`${baseUrl}/stations`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...fixture,
        stationName: `Query Test ${fixture.region}`,
        latitude: 10 + index,
        longitude: 20 + index,
      }),
    })
    assert.equal(stationResponse.status, 201)
    for (let readingIndex = 0; readingIndex < (fixture.region === 'south' ? 2 : 1); readingIndex += 1) {
      const readingResponse = await fetch(`${baseUrl}/readings`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          stationId: fixture.stationId,
          temperature: 18 + index + readingIndex,
          humidity: 50 + index,
          windSpeed: 3,
          atmosphericPressure: 1012,
          rainfall: 0.1,
          recordedAt: new Date(Date.parse(queryFrom) + 1_000 + index * 1_000 + readingIndex * 100).toISOString(),
        }),
      })
      assert.equal(readingResponse.status, 201)
    }
  }

  const routedResponse = await fetch(`${baseUrl}/readings/query`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ strategy: 'routed', stationId: 'SKY-S-QRY1', from: queryFrom }),
  })
  assert.equal(routedResponse.status, 200)
  const routed = (await routedResponse.json()).data
  assert.equal(routed.region, 'south')
  assert.equal(routed.regionalCollectionAccessCount, 1)
  assert.deepEqual(routed.dataCollectionsAccessed, ['south_weather_readings'])
  assert.equal(routed.documentsReturned, 2)
  assert.equal(typeof routed.executionTimeMs, 'number')
  assert.equal(typeof routed.documentsExamined, 'number')
  assert.equal(routed.explainAvailable, true)
  assert.ok(routed.indexUsage.length > 0)
  assert.equal(routed.collectionMetrics[0].collection, 'south_weather_readings')
  assert.equal(typeof routed.collectionMetrics[0].documentsExamined, 'number')

  const singleCollectionList = await fetch(`${baseUrl}/readings/region/south?from=${encodeURIComponent(queryFrom)}`)
  const singleCollectionBody = await singleCollectionList.json()
  assert.equal(singleCollectionBody.collectionAccessCount, 1)
  assert.deepEqual(singleCollectionBody.collectionsAccessed, ['south_weather_readings'])

  const multiResponse = await fetch(`${baseUrl}/readings/query`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ strategy: 'multi-region', regions: ['south', 'east'], from: queryFrom }),
  })
  const multi = (await multiResponse.json()).data
  assert.equal(multi.documentsReturned, 3)
  assert.equal(multi.regionalCollectionAccessCount, 2)
  assert.deepEqual(multi.filter.regions, ['south', 'east'])

  const globalResponse = await fetch(`${baseUrl}/readings/query`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ strategy: 'global', from: queryFrom }),
  })
  const global = (await globalResponse.json()).data
  assert.equal(global.documentsReturned, 5)
  assert.equal(global.regionalCollectionAccessCount, 4)
  const globalList = await fetch(`${baseUrl}/readings?from=${encodeURIComponent(queryFrom)}&limit=50`)
  const globalListBody = await globalList.json()
  assert.equal(globalListBody.collectionAccessCount, 4)

  const comparisonResponse = await fetch(`${baseUrl}/readings/benchmark`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ region: 'south', from: queryFrom, limit: 50 }),
  })
  assert.equal(comparisonResponse.status, 200)
  const comparison = (await comparisonResponse.json()).data
  assert.equal(comparison.routed.documentsReturned, comparison.scatterGather.documentsReturned)
  assert.deepEqual(comparison.routed.filter, comparison.scatterGather.filter)
  assert.equal(comparison.routed.regionalCollectionAccessCount, 1)
  assert.equal(comparison.scatterGather.regionalCollectionAccessCount, 4)
  assert.equal(comparison.routed.executionTimeMs >= 0, true)
  assert.equal(comparison.scatterGather.executionTimeMs >= 0, true)

  const invalidMulti = await fetch(`${baseUrl}/readings/query`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ strategy: 'multi-region', regions: ['central'] }),
  })
  assert.equal(invalidMulti.status, 400)
  const invalidRouted = await fetch(`${baseUrl}/readings/query`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ strategy: 'routed' }),
  })
  assert.equal(invalidRouted.status, 400)
  const mismatch = await fetch(`${baseUrl}/readings/query`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ strategy: 'routed', region: 'north', stationId: 'SKY-S-QRY1' }),
  })
  assert.equal(mismatch.status, 400)

  const historyResponse = await fetch(`${baseUrl}/readings/query-history?limit=5`)
  const history = (await historyResponse.json()).data
  assert.ok(history.some((entry) => entry.strategy === 'scatter-gather'))
  assert.ok(history.every((entry) => entry.collectionsAccessed.length > 0))
})
