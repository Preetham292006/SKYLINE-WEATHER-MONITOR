const { performance } = require('node:perf_hooks')
const ApiError = require('../utils/ApiError')
const { getAllRegions, getReadingModel, getRegion } = require('./regionRouter')
const { getWeatherReadingModels } = require('../models/WeatherReading')
const WeatherStation = require('../models/WeatherStation')

const HISTORY_LIMIT = 100
const queryHistory = []

function nullableNumber(value) {
  return Number.isFinite(value) ? value : null
}

function getIndexUsage(plan) {
  const indexes = new Set()
  let hasCollectionScan = false
  const pending = [plan]
  while (pending.length) {
    const node = pending.pop()
    if (!node || typeof node !== 'object') continue
    if (node.indexName) indexes.add(node.indexName)
    if (node.stage === 'COLLSCAN') hasCollectionScan = true
    for (const value of Object.values(node)) {
      if (value && typeof value === 'object') pending.push(value)
    }
  }
  if (indexes.size) return [...indexes]
  return hasCollectionScan ? ['COLLSCAN'] : []
}

function addToHistory(record) {
  queryHistory.unshift(record)
  if (queryHistory.length > HISTORY_LIMIT) queryHistory.length = HISTORY_LIMIT
  return record
}

async function prepareQuery(input) {
  const stationId = input.stationId ? String(input.stationId).trim().toUpperCase() : undefined
  const selectedRegion = input.region ? getRegion(input.region).id : undefined
  let station

  if (stationId) {
    station = await WeatherStation.findOne({ stationId }).select('stationId region').lean()
    if (!station) throw new ApiError(404, 'Weather station not found')
    if (selectedRegion && selectedRegion !== station.region) {
      throw new ApiError(400, 'Query region must match the assigned station region')
    }
  }

  const region = station?.region || selectedRegion
  const from = input.from ? new Date(input.from) : undefined
  const to = input.to ? new Date(input.to) : undefined
  if (from && Number.isNaN(from.getTime())) throw new ApiError(400, 'Invalid from date')
  if (to && Number.isNaN(to.getTime())) throw new ApiError(400, 'Invalid to date')
  if (from && to && from > to) throw new ApiError(400, 'from must be earlier than or equal to to')

  const limit = Math.min(Math.max(Number(input.limit) || 100, 1), 500)
  const filter = {}
  if (stationId) filter.stationId = stationId
  if (from || to) {
    filter.recordedAt = {}
    if (from) filter.recordedAt.$gte = from
    if (to) filter.recordedAt.$lte = to
  }
  return {
    stationId,
    region,
    filter,
    limit,
    metadataCollectionsAccessed: stationId ? ['WeatherStations'] : [],
  }
}

function selectedRegionIds(input, prepared, strategy) {
  if (strategy === 'global' || strategy === 'scatter-gather') return getAllRegions().map(({ id }) => id)
  if (strategy === 'routed') {
    if (!prepared.region) throw new ApiError(400, 'Routed queries require a region or stationId')
    return [prepared.region]
  }
  if (strategy === 'multi-region') {
    const rawRegions = Array.isArray(input.regions) && input.regions.length
      ? input.regions
      : prepared.region ? [prepared.region] : []
    if (!rawRegions.length) throw new ApiError(400, 'Multi-region queries require at least one region')
    return [...new Set(rawRegions.map((region) => getRegion(region).id))]
  }
  throw new ApiError(400, 'Invalid query strategy', {
    allowedStrategies: ['routed', 'scatter-gather', 'multi-region', 'global'],
  })
}

function buildRegionFilter(filter, regions, strategy, prepared) {
  if (strategy === 'global' || (strategy === 'scatter-gather' && !prepared.region)) return filter
  if (strategy === 'scatter-gather' || strategy === 'routed') return { ...filter, region: prepared.region }
  return { ...filter, region: { $in: regions } }
}

async function getExplainMetrics(model, filter, limit) {
  try {
    const explanation = await model.find(filter)
      .sort({ recordedAt: -1 })
      .limit(limit)
      .explain('executionStats')
    const stats = explanation.executionStats || {}
    return {
      documentsExamined: nullableNumber(stats.totalDocsExamined),
      documentsReturned: nullableNumber(stats.nReturned),
      keysExamined: nullableNumber(stats.totalKeysExamined),
      executionTimeMs: nullableNumber(stats.executionTimeMillis),
      indexUsage: getIndexUsage(explanation.queryPlanner?.winningPlan),
    }
  } catch (error) {
    console.warn(`MongoDB explain unavailable for ${model.collection.name}: ${error.message}`)
    return {
      documentsExamined: null,
      documentsReturned: null,
      keysExamined: null,
      executionTimeMs: null,
      indexUsage: [],
    }
  }
}

async function executePreparedQuery(input, prepared, strategy) {
  const regions = selectedRegionIds(input, prepared, strategy)
  const filter = buildRegionFilter(prepared.filter, regions, strategy, prepared)
  const models = getWeatherReadingModels()
  const collections = regions.map((id) => ({
    id,
    name: getReadingModel(id, models).collection.name,
    model: getReadingModel(id, models),
  }))

  const start = performance.now()
  const batches = await Promise.all(collections.map(({ model }) => model.find(filter)
    .sort({ recordedAt: -1 })
    .limit(prepared.limit)
    .lean()
    .exec()))
  const executionTimeMs = Number((performance.now() - start).toFixed(3))
  const records = batches.flat()
    .sort((left, right) => new Date(right.recordedAt) - new Date(left.recordedAt))
    .slice(0, prepared.limit)
  const explainResults = await Promise.all(collections.map(({ model }) => getExplainMetrics(model, filter, prepared.limit)))

  const sumAvailable = (key) => explainResults.every((metrics) => metrics[key] !== null)
    ? explainResults.reduce((total, metrics) => total + metrics[key], 0)
    : null
  const indexUsage = [...new Set(explainResults.flatMap((metrics) => metrics.indexUsage))]
  const collectionMetrics = collections.map(({ name }, index) => ({
    collection: name,
    ...explainResults[index],
    actualDocumentsReturned: batches[index].length,
  }))
  const accessedAt = new Date().toISOString()
  const result = {
    strategy,
    region: strategy === 'global' || (strategy === 'multi-region' && regions.length > 1)
      ? null
      : prepared.region || null,
    regions,
    stationId: prepared.stationId || null,
    filter: {
      ...(prepared.stationId ? { stationId: prepared.stationId } : {}),
      ...(prepared.region && (strategy === 'routed' || strategy === 'scatter-gather') ? { region: prepared.region } : {}),
      ...(strategy === 'multi-region' ? { regions } : {}),
      ...(input.from ? { from: new Date(input.from).toISOString() } : {}),
      ...(input.to ? { to: new Date(input.to).toISOString() } : {}),
    },
    dataCollectionsAccessed: collections.map(({ name }) => name),
    metadataCollectionsAccessed: prepared.metadataCollectionsAccessed,
    collectionsAccessed: [...prepared.metadataCollectionsAccessed, ...collections.map(({ name }) => name)],
    collectionAccessCount: collections.length + prepared.metadataCollectionsAccessed.length,
    regionalCollectionAccessCount: collections.length,
    executionTimeMs,
    documentsExamined: sumAvailable('documentsExamined'),
    documentsReturned: records.length,
    explainDocumentsReturned: sumAvailable('documentsReturned'),
    keysExamined: sumAvailable('keysExamined'),
    explainExecutionTimeMs: sumAvailable('executionTimeMs'),
    indexUsage,
    collectionMetrics,
    explainAvailable: explainResults.every((metrics) => metrics.documentsExamined !== null),
    records,
    executedAt: accessedAt,
  }

  addToHistory({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    executedAt: accessedAt,
    strategy,
    region: result.region,
    regions,
    stationId: result.stationId,
    executionTimeMs,
    documentsExamined: result.documentsExamined,
    documentsReturned: result.documentsReturned,
    collectionsAccessed: result.collectionsAccessed,
    regionalCollectionAccessCount: result.regionalCollectionAccessCount,
  })
  return result
}

async function runRegionalQuery(input) {
  const prepared = await prepareQuery(input)
  const strategy = input.strategy || 'routed'
  return executePreparedQuery(input, prepared, strategy)
}

async function compareRegionalQueries(input) {
  const prepared = await prepareQuery(input)
  if (!prepared.region) throw new ApiError(400, 'A region or stationId is required for a routed comparison')
  const comparisonInput = { ...input, region: prepared.region }
  const routed = await executePreparedQuery(comparisonInput, prepared, 'routed')
  const scatterGather = await executePreparedQuery(comparisonInput, prepared, 'scatter-gather')
  return {
    query: {
      region: prepared.region,
      stationId: prepared.stationId || null,
      filters: routed.filter,
      limit: prepared.limit,
    },
    routed,
    scatterGather,
    note: 'Measured on this MongoDB deployment. Timings depend on indexes, dataset size, cache state, and environment; either strategy may be faster for a particular run.',
  }
}

function listQueryHistory(limit = 20) {
  const count = Math.min(Math.max(Number(limit) || 20, 1), HISTORY_LIMIT)
  return queryHistory.slice(0, count)
}

module.exports = { compareRegionalQueries, executePreparedQuery, listQueryHistory, runRegionalQuery }
