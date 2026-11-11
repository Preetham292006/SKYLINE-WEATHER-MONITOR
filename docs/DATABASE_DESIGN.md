# Database Design

## Connection and database

- Database: `skyline_weather`
- Environment setting: `MONGODB_URI` in `backend/.env`
- Local default: `mongodb://127.0.0.1:27017/skyline_weather`
- Atlas: use the URI from the Atlas deployment and keep credentials in the
  ignored `.env` file, never in source control.

`backend/config/database.js` connects through Mongoose and uses a bounded server
selection timeout. `server.js` keeps the health route available during
connection failures and retries on a configured interval. Data routes return
`503` until the connection is ready. `GET /api/health` includes the database
connection state.

## Collections

| Mongoose model | MongoDB collection | Purpose |
|---|---|---|
| `WeatherStation` | `WeatherStations` | Station identity, assigned region, coordinates, and status |
| `WeatherAlert` | `WeatherAlerts` | Active and resolved station alerts |
| `WeatherReading_north` | `north_weather_readings` | North-region weather time series |
| `WeatherReading_south` | `south_weather_readings` | South-region weather time series |
| `WeatherReading_east` | `east_weather_readings` | East-region weather time series |
| `WeatherReading_west` | `west_weather_readings` | West-region weather time series |

The four readings collections are separate logical collections in one database
deployment. They are **not** physical MongoDB shards or a native sharded
cluster.

## Schemas

### Weather station

`stationId` (required, unique uppercase string), `stationName` (required),
`region` (required enum north/south/east/west), `latitude` (-90 to 90),
`longitude` (-180 to 180), `location` (GeoJSON Point, coordinates in
`[longitude, latitude]` order), optional `city`, `status` (online/warning/
offline), `createdAt`, and `updatedAt`.

### Weather reading

`stationId`, `region`, `temperature` (-100 to 80 °C), `humidity` (0-100%),
`windSpeed` (0-200 m/s), `atmosphericPressure` (800-1200 hPa), `rainfall`
(0-1000 mm), and `recordedAt`. `simulated` identifies generated monitoring
records. The optional unique sparse `seedKey` makes seeded observations
idempotent.

The reading region is resolved from the station record. A supplied region must
match; the client cannot route a station's observation to a different
collection.

### Weather alert

`alertId` (required, unique), `stationId`, `region`, `alertType` (high/low
temperature, heavy rainfall, connectivity, or other), `severity` (critical,
warning, information), `message`, `status` (active/resolved), `createdAt`, and
`resolvedAt`.

## Indexes

- `WeatherStations`: unique `stationId`; `2dsphere` on `location`; compound
  `{ region: 1, status: 1 }`; standalone `status` for status-only filters.
- Regional readings: `{ stationId: 1, recordedAt: -1 }`,
  `{ recordedAt: -1 }`, `{ region: 1, recordedAt: -1 }`, and a unique sparse
  index on `seedKey`.
- `WeatherAlerts`: unique `alertId`; `{ status: 1, createdAt: -1 }` and
  `{ region: 1, status: 1, createdAt: -1 }`.

Indexes are declared in Mongoose schemas and created by MongoDB as models
initialize; the seed command explicitly creates them before bulk upserts.
After changing index declarations on a database that has already been used,
run `cd backend; npm run indexes` to synchronize declared model indexes and
remove obsolete indexes. Review and back up manually managed indexes before
using this command; `syncIndexes()` removes indexes not represented by these
Mongoose schemas.
No separate reading `stationId` or `region` index is added: those fields are
the prefixes of the station/time and region/time compound indexes. The
standalone recorded-time index supports time filtering/sorting without another
leading predicate; the two compound indexes support station/time and
region/time lookups. The station region field intentionally relies on the
region/status compound index rather than duplicating its prefix with a
standalone region index.

## Routing and queries

`services/regionRouter.js` owns the allowlisted region mapping:

```text
north -> north_weather_readings
south -> south_weather_readings
east  -> east_weather_readings
west  -> west_weather_readings
```

The router returns a model, not an arbitrary collection name derived from
request input. Region reads/writes use that model. All-region operations
explicitly union the four logical collections.

`services/queryAnalysisService.js` also supports:

- `routed`: resolves a station's assigned region when `stationId` is supplied,
  then targets one regional collection.
- `multi-region`: targets only the validated collections listed in `regions`.
- `scatter-gather`: searches all four reading collections using an identical
  region/station/time filter and merges the sorted results.
- `global`: searches all four collections without a region predicate.

For every query-analysis request the result identifies regional collections
accessed and any metadata collection used for station-to-region lookup.
`POST /readings/benchmark` compares routed versus scatter-gather using the same
filter and limit. Actual query elapsed time is measured around retrieval;
MongoDB `explain("executionStats")` is then run separately to report
`totalDocsExamined`, `nReturned`, keys examined, execution time, and winning-plan
index names where available. Explain-only metrics are returned as unavailable
(`null`/empty and displayed as `N/A`) if the deployment does not provide them.

Each collection is queried with the same sort, time/region/station predicates,
and per-collection result cap. Scatter-gather retrieves up to the requested
limit from each collection, merges in recorded-time order, and applies the same
final result cap as the routed query. Consequently the compared returned records
are equivalent for the selected filters. `executionTimeMs` is actual observed
server-side query elapsed time; it is not adjusted, extrapolated, or replaced
with explain execution time. Results can vary with indexes, cache state, data
size, hardware, and concurrent activity; the routed strategy is not guaranteed
to be faster.

The API keeps the latest 100 analysis records in memory. This log is for the
academic UI demonstration and is not durable audit storage.

## Aggregation pipelines

- `$unionWith` combines regional collections for overall reading counts and
  weighted temperature, humidity, wind, and rainfall averages.
- `$unionWith` + `$group` computes per-region reading counts and average
  temperature/humidity.
- `$unionWith` + `$sort` + `$group` calculates per-station reading totals and
  latest records.
- `$match` + `$dateTrunc` + `$group` + `$project` builds hourly/daily temperature,
  humidity, and reading-count trends.
- `WeatherStations` `$group` by region/status produces station and active
  station counts.
- Regional distribution is each regional reading count divided by all
  regional readings.

## Logical partitioning versus horizontal sharding

Logical regional partitioning here selects one of four collections in a single
database based on the station's assigned region. Native MongoDB horizontal
sharding distributes a sharded collection across cluster shards using an
explicit shard key and a `mongos` query router. SKYLINE does not configure a
shard key, call `shardCollection`, or claim to be a sharded cluster.

## Seed data and observed development data

The idempotent seed script upserts 20 stations, 200 deterministic readings
(50 per region), and five sample alerts. The test report records a development
database with 201 readings because one previously generated simulated reading
remained in the North collection: 51 North, 50 South, 50 East, and 50 West.
That is an observed test-environment snapshot, not a seed-script output
guarantee. The seed data and reported development counts are intentionally
distinguished.

The integration test suite uses a separate `skyline_weather_test` database.
Its setup and teardown drop that test database; never configure the test URI to
point at data that must be retained.

## Query-analysis metric interpretation

Query analysis reports result-retrieval elapsed time measured by the API and
MongoDB `explain("executionStats")` metrics in separate fields. Explain calls
are not included as substitute elapsed times. Documents returned by the
explain plan can differ in meaning from the final merged result count when
multiple collections are queried; the API exposes both the explain figures
and actual merged result count. `null` metrics mean the database did not
provide a value; they must not be interpreted as zero.
