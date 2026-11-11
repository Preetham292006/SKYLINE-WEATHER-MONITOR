const { getDashboardOverview, getDashboardStats, getDashboardTrends } = require('../services/dashboardService')
const { getRegion } = require('../services/regionRouter')

async function stats(req, res) {
  res.json({ data: await getDashboardStats() })
}

async function overview(req, res) {
  res.json({ data: await getDashboardOverview() })
}

async function trends(req, res) {
  const region = req.query.region ? getRegion(req.query.region).id : undefined
  const data = await getDashboardTrends({
    region,
    stationId: req.query.stationId,
    range: req.query.range,
  })
  res.json({ data, count: data.length, range: req.query.range || '24h' })
}

module.exports = { overview, stats, trends }
