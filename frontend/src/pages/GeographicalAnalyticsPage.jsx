import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, Clock3, Database, Gauge, Play, RefreshCw, Waypoints } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import MetricCard from '../components/MetricCard.jsx'
import PageHeader from '../components/PageHeader.jsx'
import Panel from '../components/Panel.jsx'
import { useAppData } from '../hooks/useAppData.js'
import { analyzeReadingQuery, compareReadingQueries, getQueryHistory } from '../services/api.js'

const regions = [
  { id: 'north', name: 'North', color: '#38bdf8' },
  { id: 'south', name: 'South', color: '#a78bfa' },
  { id: 'east', name: 'East', color: '#34d399' },
  { id: 'west', name: 'West', color: '#fbbf24' },
]

const strategyLabels = {
  routed: 'Geographical routed',
  'scatter-gather': 'Scatter-gather',
  'multi-region': 'Multi-region',
  global: 'Global',
}

function metricValue(value, suffix = '') {
  return Number.isFinite(value) ? `${value.toLocaleString()}${suffix}` : 'N/A'
}

function formatDuration(value) {
  return Number.isFinite(value) ? `${value.toFixed(3)} ms` : 'N/A'
}

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Unknown time' : date.toLocaleString()
}

function GeographicalAnalyticsPage() {
  const { regions: regionalStats, stations, source } = useAppData()
  const [region, setRegion] = useState('south')
  const [stationId, setStationId] = useState('')
  const [strategy, setStrategy] = useState('routed')
  const [selectedRegions, setSelectedRegions] = useState(['south', 'east'])
  const [result, setResult] = useState(null)
  const [comparison, setComparison] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const regionData = useMemo(() => regions.map((item) => ({
    ...item,
    ...(regionalStats.find((value) => value.id === item.id) || {}),
  })), [regionalStats])
  const availableStations = useMemo(
    () => stations.filter((station) => station.region === region),
    [region, stations],
  )

  const refreshHistory = useCallback(async () => {
    try {
      setHistory(await getQueryHistory())
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message || 'Could not load query history.')
    }
  }, [])

  useEffect(() => {
    if (source !== 'database') return undefined
    const timerId = window.setTimeout(() => refreshHistory(), 0)
    return () => window.clearTimeout(timerId)
  }, [refreshHistory, source])

  const queryInput = useCallback((queryStrategy = strategy, queryRegion = region) => ({
    strategy: queryStrategy,
    region: queryStrategy === 'global' ? undefined : queryRegion,
    regions: queryStrategy === 'multi-region' ? selectedRegions : undefined,
    stationId: stationId || undefined,
    limit: 50,
  }), [region, selectedRegions, stationId, strategy])

  async function executeQuery() {
    setLoading(true)
    setError('')
    setResult(null)
    setComparison(null)
    try {
      setResult(await analyzeReadingQuery(queryInput()))
      await refreshHistory()
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message || 'Query execution failed.')
    } finally {
      setLoading(false)
    }
  }

  async function runComparison(queryRegion = region) {
    setLoading(true)
    setError('')
    setResult(null)
    setComparison(null)
    try {
      const input = {
        region: queryRegion,
        stationId: queryRegion === region ? stationId || undefined : undefined,
        limit: 50,
      }
      setComparison(await compareReadingQueries(input))
      await refreshHistory()
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message || 'Benchmark comparison failed.')
    } finally {
      setLoading(false)
    }
  }

  function toggleRegion(regionId) {
    setSelectedRegions((current) => current.includes(regionId)
      ? current.filter((value) => value !== regionId)
      : [...current, regionId])
  }

  const comparisonRows = comparison ? [
    { name: 'Routed', elapsed: comparison.routed.executionTimeMs, examined: comparison.routed.documentsExamined, returned: comparison.routed.documentsReturned, collections: comparison.routed.regionalCollectionAccessCount, color: '#38bdf8' },
    { name: 'Scatter-gather', elapsed: comparison.scatterGather.executionTimeMs, examined: comparison.scatterGather.documentsExamined, returned: comparison.scatterGather.documentsReturned, collections: comparison.scatterGather.regionalCollectionAccessCount, color: '#a78bfa' },
  ] : []
  const distributionChartData = regionData.map((item) => ({
    name: item.name || `${item.id[0].toUpperCase()}${item.id.slice(1)}`,
    readings: item.readings || 0,
    fill: item.color,
  }))
  const resultScope = result?.strategy === 'global'
    ? 'all four regions'
    : result?.strategy === 'multi-region'
      ? result.regions.join(', ')
      : result?.region ? `${result.region} region` : 'all selected regions'

  return (
    <>
      <PageHeader
        eyebrow="CASE STUDY · QUERY PERFORMANCE"
        title="Geographical Analytics"
        description="Inspect regional collection routing and compare real query execution against scatter-gather reads."
        actions={<span className="architecture-tag"><Waypoints size={14} /> Logical partition analysis</span>}
      />

      <div className="disclaimer-banner">
        <span className="disclaimer-icon"><Database size={18} /></span>
        <div><strong>Application-level query routing</strong><p>These are four logical collections in one MongoDB database—not a production sharded cluster. Timings are measured from this API and vary with indexes, cache state, dataset size, and hardware.</p></div>
      </div>

      {source !== 'database' && <div className="query-inline-notice" role="status">MongoDB is not connected. Query analysis requires live database data; connect the backend and retry.</div>}
      {error && <div className="query-inline-error" role="alert">{error}</div>}

      <Panel title="Regional distribution" subtitle="Collection sizes and station coverage from the connected database">
        <div className="geo-region-grid">
          {regionData.map((item) => (
            <article className="geo-region-card" key={item.id}>
              <div className="geo-region-heading"><i style={{ background: item.color }} /><strong>{item.name || `${item.id[0].toUpperCase()}${item.id.slice(1)} Region`}</strong><span>{item.share ?? 0}%</span></div>
              <code>{item.collection || `${item.id}_weather_readings`}</code>
              <div className="geo-region-values"><span><strong>{(item.readings || 0).toLocaleString()}</strong> readings</span><span><strong>{item.stationCount || 0}</strong> stations</span></div>
              <div className="progress-track"><i style={{ width: `${Math.min(item.share || 0, 100)}%`, background: item.color }} /></div>
              <small>{item.status || 'No status data'}</small>
            </article>
          ))}
        </div>
      </Panel>

      <Panel title="Query testing panel" subtitle="Run an observed database query or a same-filter routed/scatter-gather comparison">
        <div className="geo-query-controls">
          <label>Region
            <select value={region} onChange={(event) => { setRegion(event.target.value); setStationId('') }}>
              {regions.map((item) => <option value={item.id} key={item.id}>{item.name} Region</option>)}
            </select>
          </label>
          <label>Station
            <select value={stationId} onChange={(event) => setStationId(event.target.value)}>
              <option value="">All stations in selection</option>
              {availableStations.map((station) => <option value={station.id} key={station.id}>{station.name} · {station.id}</option>)}
            </select>
          </label>
          <label>Query type
            <select value={strategy} onChange={(event) => setStrategy(event.target.value)}>
              <option value="routed">Geographical routed</option>
              <option value="scatter-gather">Scatter-gather (all 4)</option>
              <option value="multi-region">Selected multi-region</option>
              <option value="global">Global (all 4)</option>
            </select>
          </label>
          <div className="geo-query-actions">
            <button type="button" className="button button-primary" disabled={loading || source !== 'database' || (strategy === 'multi-region' && selectedRegions.length === 0)} onClick={executeQuery}>
              {loading ? <RefreshCw size={14} className="spin-icon" /> : <Play size={14} />} Run query
            </button>
            <button type="button" className="button button-secondary" disabled={loading || source !== 'database'} onClick={() => runComparison()}>
              <Activity size={14} /> Compare routed vs scatter
            </button>
            <button type="button" className="button button-secondary" disabled={loading || source !== 'database'} onClick={() => runComparison('south')}>
              <Waypoints size={14} /> Run South case study
            </button>
          </div>
        </div>
        {strategy === 'multi-region' && (
          <fieldset className="geo-region-selector">
            <legend>Collections to include</legend>
            {regions.map((item) => <label key={item.id}><input type="checkbox" checked={selectedRegions.includes(item.id)} onChange={() => toggleRegion(item.id)} />{item.name}</label>)}
          </fieldset>
        )}
        {loading && <div className="query-state" role="status"><span />Executing and collecting MongoDB explain statistics…</div>}
        {!loading && !result && !comparison && <div className="query-empty">Choose a query strategy, then run it to inspect actual records and execution metrics.</div>}
      </Panel>

      {result && (
        <Panel title="Query result and execution metrics" subtitle={`${strategyLabels[result.strategy]} · ${resultScope} · ${formatDate(result.executedAt)}`}>
          <div className="metric-grid metric-grid-four query-metric-grid">
            <MetricCard label="Execution time" value={formatDuration(result.executionTimeMs)} unit="" icon={Clock3} tone="blue" footnote="API query elapsed time" />
            <MetricCard label="Documents examined" value={metricValue(result.documentsExamined)} unit="" icon={Activity} tone="purple" footnote="MongoDB executionStats" />
            <MetricCard label="Documents returned" value={metricValue(result.documentsReturned)} unit="" icon={Database} tone="green" footnote="Returned by query" />
            <MetricCard label="Regional collections" value={metricValue(result.regionalCollectionAccessCount)} unit="" icon={Gauge} tone="amber" footnote={result.dataCollectionsAccessed.join(', ') || 'No matching collections'} />
          </div>
          <div className="query-access-list"><strong>Collections accessed</strong>{result.collectionsAccessed.length ? result.collectionsAccessed.map((name) => <code key={name}>{name}</code>) : <span>N/A</span>}</div>
          <div className="query-index-list"><strong>Index usage</strong>{result.explainAvailable && result.indexUsage.length ? result.indexUsage.map((name) => <code key={name}>{name}</code>) : <span>N/A</span>}<small>Explain execution: {formatDuration(result.explainExecutionTimeMs)}</small></div>
          <CollectionMetricTable metrics={result.collectionMetrics} />
          <ReadingResults records={result.records} />
        </Panel>
      )}

      {comparison && (
        <>
          <Panel title="Query performance comparison" subtitle={`Equivalent filters on ${comparison.query.region} region · maximum ${comparison.query.limit} records each`}>
            <div className="metric-grid metric-grid-four query-metric-grid">
              <MetricCard label="Routed elapsed" value={formatDuration(comparison.routed.executionTimeMs)} unit="" icon={Clock3} tone="blue" footnote="One regional collection" />
              <MetricCard label="Scatter elapsed" value={formatDuration(comparison.scatterGather.executionTimeMs)} unit="" icon={Clock3} tone="purple" footnote="All four collections" />
              <MetricCard label="Routed examined" value={metricValue(comparison.routed.documentsExamined)} unit="" icon={Activity} tone="green" footnote={`${comparison.routed.regionalCollectionAccessCount} regional collection`} />
              <MetricCard label="Scatter examined" value={metricValue(comparison.scatterGather.documentsExamined)} unit="" icon={Database} tone="amber" footnote={`${comparison.scatterGather.regionalCollectionAccessCount} regional collections`} />
            </div>
            <div className="query-comparison-note">{comparison.note}</div>
            <div className="query-access-list"><strong>Routed access</strong>{comparison.routed.dataCollectionsAccessed.map((name) => <code key={name}>{name}</code>)}<strong>Scatter-gather access</strong>{comparison.scatterGather.dataCollectionsAccessed.map((name) => <code key={name}>{name}</code>)}</div>
            <CollectionMetricTable metrics={[
              ...comparison.routed.collectionMetrics.map((item) => ({ ...item, strategy: 'Routed' })),
              ...comparison.scatterGather.collectionMetrics.map((item) => ({ ...item, strategy: 'Scatter-gather' })),
            ]} />
            <ReadingResults records={comparison.routed.records} title="Matching readings (routed result)" />
          </Panel>

          <div className="dashboard-grid dashboard-grid-charts geo-chart-grid">
            <Panel title="Measured execution time" subtitle="Observed query elapsed time; lower is not guaranteed for every run">
              <ComparisonChart data={comparisonRows} valueKey="elapsed" suffix=" ms" />
            </Panel>
            <Panel title="Documents examined" subtitle="MongoDB explain executionStats; N/A if unavailable">
              <ComparisonChart data={comparisonRows} valueKey="examined" />
            </Panel>
          </div>
          <Panel title="Documents returned" subtitle="The result filters and result cap are identical between strategies">
            <ComparisonChart data={comparisonRows} valueKey="returned" />
          </Panel>
        </>
      )}

      <div className="dashboard-grid dashboard-grid-charts geo-chart-grid">
        <Panel title="Regional data distribution" subtitle="Actual weather reading counts per logical collection">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={distributionChartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="#24334a" strokeDasharray="3 5" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#7789a3', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#111c2e', border: '1px solid #2b3c55', borderRadius: 10 }} />
              <Bar dataKey="readings" name="Stored readings" radius={[5, 5, 0, 0]}>{distributionChartData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Query efficiency comparison" subtitle="Records returned relative to documents examined (from explain statistics)">
          {comparison ? <ComparisonChart data={comparisonRows.map((row) => ({
            ...row,
            efficiency: Number.isFinite(row.examined) && row.examined > 0 ? Number((row.returned / row.examined * 100).toFixed(2)) : null,
          }))} valueKey="efficiency" suffix="%" /> : <div className="query-empty">Run a routed versus scatter-gather comparison to plot measured result ratios.</div>}
        </Panel>
      </div>

      <Panel title="Query execution history" subtitle="Recent analysis requests recorded by this running API process" action={<button className="icon-button" type="button" aria-label="Refresh query history" onClick={refreshHistory}><RefreshCw size={15} /></button>}>
        {history.length ? <div className="geo-history-table-wrap"><table className="geo-history-table"><thead><tr><th>Strategy</th><th>Region</th><th>Execution</th><th>Returned</th><th>Collections</th><th>Executed</th></tr></thead><tbody>
          {history.map((item) => <tr key={item.id}><td>{strategyLabels[item.strategy] || item.strategy}</td><td>{item.region || item.regions.join(', ')}</td><td>{formatDuration(item.executionTimeMs)}</td><td>{metricValue(item.documentsReturned)}</td><td>{item.regionalCollectionAccessCount} regional</td><td>{formatDate(item.executedAt)}</td></tr>)}
        </tbody></table></div> : <div className="query-empty">{source === 'database' ? 'No query executions have been recorded in this API session.' : 'Connect MongoDB to view query history.'}</div>}
      </Panel>

      <div className="disclaimer-footnote"><Database size={15} /><span>Query history is held in the running API process and clears when it restarts. Explain values are MongoDB-reported metrics; N/A means the server did not provide that metric.</span></div>
    </>
  )
}

function ComparisonChart({ data, valueKey, suffix = '' }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke="#24334a" strokeDasharray="3 5" vertical={false} />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#7789a3', fontSize: 10 }} />
        <Tooltip formatter={(value) => [Number.isFinite(value) ? `${value.toLocaleString()}${suffix}` : 'N/A', valueKey === 'elapsed' ? 'Elapsed' : valueKey === 'examined' ? 'Examined' : valueKey === 'returned' ? 'Returned' : 'Returned / examined']} contentStyle={{ background: '#111c2e', border: '1px solid #2b3c55', borderRadius: 10 }} />
        <Bar dataKey={valueKey} name={valueKey} radius={[5, 5, 0, 0]}>{data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function ReadingResults({ records, title = 'Query results' }) {
  return (
    <div className="geo-results">
      <div className="geo-results-heading"><strong>{title}</strong><span>{records.length} shown</span></div>
      {records.length ? <div className="geo-results-list">{records.slice(0, 12).map((record) => <div className="geo-result-row" key={record._id}><strong>{record.stationId}</strong><span>{record.region}</span><span>{Number(record.temperature).toFixed(1)}°C</span><span>{Number(record.humidity).toFixed(0)}% RH</span><time>{formatDate(record.recordedAt)}</time></div>)}</div> : <div className="query-empty">No readings matched the selected filters.</div>}
    </div>
  )
}

function CollectionMetricTable({ metrics }) {
  if (!metrics?.length) return null
  return (
    <div className="geo-history-table-wrap geo-collection-table">
      <table className="geo-history-table"><thead><tr><th>Strategy</th><th>Collection</th><th>Docs examined</th><th>Explain returned</th><th>Keys examined</th><th>Index</th></tr></thead><tbody>
        {metrics.map((item) => <tr key={`${item.strategy || 'Query'}-${item.collection}`}><td>{item.strategy || 'Query'}</td><td>{item.collection}</td><td>{metricValue(item.documentsExamined)}</td><td>{metricValue(item.documentsReturned)}</td><td>{metricValue(item.keysExamined)}</td><td>{item.indexUsage.length ? item.indexUsage.join(', ') : 'N/A'}</td></tr>)}
      </tbody></table>
    </div>
  )
}

export default GeographicalAnalyticsPage
