# SKYLINE Testing Report

**Test date:** 2026-11-11  
**Environment:** Windows development workstation, local MongoDB at
`127.0.0.1:27017`, Node.js backend, Vite frontend.

## Methodology

- Backend integration tests used the isolated `skyline_weather_test` MongoDB
  database. The test runner drops only that database before and after the
  suite; the development database was not used for tests.
- Database and API checks used the separate `skyline_weather` development
  database. Temporary UI records were removed after CRUD and persistence tests.
- Frontend checks used a real browser against the local Vite and Express
  servers. Existing routes, charts, filtering, creation/resolution actions,
  theme persistence, loading/offline fallback/retry, and multiple viewport
  widths were checked.
- Performance comparisons used the same station/region filters, sorting,
  result limit, and underlying collection contents. Query latency is timed from
  actual calls; explain statistics are reported separately. An indexed versus
  unindexed comparison used the same station filter and sort, forcing the
  unindexed case to use MongoDB's `$natural` scan.
- `npm audit` checked installed backend and frontend dependency trees. No
  credentials or `.env` values were printed as part of this check.

## Automated test cases

All automated cases ran with a live local MongoDB connection against the
isolated test database.

| Test | Expected result | Actual result | Status |
|---|---|---|---|
| Region mapping for North/South/East/West | Each maps to its regional collection | All four mapped correctly | PASS |
| Invalid region routing | HTTP 400; no query routed | HTTP 400 | PASS |
| Weather station model validation | Valid coordinates/region accepted; invalid values rejected | Expected Mongoose validation behavior | PASS |
| Weather reading model validation | Valid sample accepted; out-of-range values rejected | Expected Mongoose validation behavior | PASS |
| Weather alert model validation | Valid alert accepted; invalid enums/required values rejected | Expected Mongoose validation behavior | PASS |
| Index schema validation | Required compound, unique, status, and 2dsphere indexes declared without duplicate region prefix | Expected indexes found; duplicate standalone region index absent | PASS |
| Mongo connection and health route | Health works with connected DB | HTTP 200, database connected | PASS |
| CORS and malformed JSON | Allowed origin gets CORS header; other origin does not; malformed JSON gets 400 | Observed expected behavior | PASS |
| Duplicate station creation | HTTP 409 without echoing unique field value | HTTP 409; response identifies field only | PASS |
| Station CRUD | Create, list, get, update, and delete work | All exercised successfully | PASS |
| Reading insertion and collection routing | Reading lands only in station's assigned collection | South test reading appeared in South, not East | PASS |
| Reading query endpoints | Regional and global responses identify collection access | One and four regional collections reported respectively | PASS |
| Query-analysis strategies | Routed, scatter-gather, multi-region, and global return matching filtered data | Same-filter result counts and expected collection access counts verified | PASS |
| Explain output | Documents/keys examined and winning index reported when supported | MongoDB executionStats and index names returned | PASS |
| Dashboard aggregation | Station/readings counts and averages match fixture | Exact fixture values verified in integration test | PASS |
| Alert CRUD/resolution | Create and resolve persist state | Resolved status and timestamp verified via GET | PASS |
| Invalid user input and search | Invalid filters rejected; regex-like search treated as text | HTTP 400 or empty safe search result as expected | PASS |
| API/database failure | Health route remains up; data route returns 503 | Health HTTP 200; station route HTTP 503 when DB disconnected | PASS |

**Automated backend result:** 9 tests passed, 0 failed.  
**Backend lint:** passed (Node syntax-check script).

## Database validation

| Check | Expected | Actual | Status |
|---|---|---|---|
| Regional collection presence | Four regional reading collections | North, South, East, West collections present | PASS |
| Development data counts | Seeded stations/readings remain queryable | 20 stations and 201 readings before temporary UI test records were cleaned | PASS |
| Regional distribution | Seeded readings retained by region | North 51 (includes a previously simulated reading); South 50; East 50; West 50 | PASS |
| Indexes on deployed collections | Schema indexes present and redundant index removed | All four reading collections have station/time, recorded-time, region/time, and seed indexes; station region-only index removed by `npm run indexes` | PASS |
| Persistence across restart | Previously written station, readings, and alert survive backend restart | Temporary station, 201 readings, resolved alert, and four-region summary remained available after restarting API on port 5000 | PASS |
| Alert resolution persistence | Resolved status/time survive a new API process | Resolved record read after restart | PASS |
| Connection failure handling | Health available, data endpoints unavailable with 503 | Confirmed against unavailable local MongoDB port 27018 | PASS |

Temporary test station `SKY-W-EF4DED8A` and alert `ALT-QA-UI-TEST` were created
for UI/persistence checks and then removed. Seeded and previously simulated
readings were left intact.

## Performance observations

### South routed versus scatter-gather

Same South-region predicate, sort, filter window, and 50-record result cap.
Both returned the same 50 matching readings. Routed queried one collection;
scatter-gather queried all four regional collections.

| Observed run | Routed elapsed | Scatter-gather elapsed | Docs examined (routed / scatter) | Docs returned | Regional collections (routed / scatter) |
|---|---:|---:|---:|---:|---:|
| API run 1 | 15.768 ms | 49.702 ms | 50 / 50 | 50 / 50 | 1 / 4 |
| API run 2 | 6.549 ms | 147.760 ms | 50 / 50 | 50 / 50 | 1 / 4 |
| Browser run | 8.627 ms | 379.350 ms | 50 / 50 | 50 / 50 | 1 / 4 |

Observed timings varied materially between runs, consistent with cache,
scheduling, and environment effects. These measurements do not establish that
routed queries are always faster. The reproducible structural result is that
the South routed strategy accesses one regional collection instead of four.
All runs used MongoDB's `region_1_recordedAt_-1` index.

### Indexed versus forced collection scan

Twelve alternating executions used the same South station filter, descending
recorded-time sort, and result limit. Both strategies returned the same 10
records. The indexed strategy used `{ stationId: 1, recordedAt: -1 }`; the
unindexed comparison forced `{ $natural: 1 }`.

| Strategy | Median observed elapsed (12 runs) | Explain docs examined | Explain keys examined | Explain records returned |
|---|---:|---:|---:|---:|
| Indexed | 6.738 ms | 10 | 10 | 10 |
| Forced collection scan | 9.331 ms | 50 | 0 | 10 |

Individual measurements included outliers (indexed 4.332–67.725 ms;
collection scan 4.484–19.348 ms). Explain's own execution time was 0 ms for the
indexed query and 1 ms for the scan in this run; that metric is MongoDB-reported
with millisecond granularity and is not the API elapsed time. The small dataset
and noisy local timings are not representative of a larger deployment.

## Frontend/browser validation

| Check | Actual result | Status |
|---|---|---|
| Dashboard, Weather Stations, Live Monitoring, Regional Shards, Analytics, Geographical Analytics, Alerts, Settings routes | All eight rendered their expected page heading | PASS |
| Station search and region filter | Search narrowed the table to one match; selected region filtered results | PASS |
| Station detail and create form | Detail modal showed station identity; form created a MongoDB-backed station | PASS |
| Alert resolution | Browser resolved a temporary alert; database showed resolved state after backend restart | PASS |
| Monitoring filters and charts | Selected South station and seven-day range; three charts rendered | PASS |
| Geographical analytics | Four region cards; routed/scatter, global, and multi-region queries/results and chart data rendered | PASS |
| Global station search | Search found the expected station | PASS |
| Theme persistence | Slate theme remained selected after page reload; reset to navy afterward | PASS |
| Loading, offline fallback, and retry | Delayed health response showed the refresh indicator; offline response showed labeled fallback; clearing the test interception and retrying restored database data | PASS |
| Responsive layouts | Tested at 320, 390, 680, 768, 900, 1024, and 1280 px; no horizontal overflow | PASS |
| Browser runtime | No page errors on stable route and interaction pass | PASS |

Frontend lint passed with no warnings; the Vite production build passed.

One initial browser automation attempt searched for the alert's database ID,
which the designed alert card does not render; the test was corrected to target
its visible alert message and resolution then passed. A delayed-health test
confirmed the loading indicator, but the browser interception aborted before
its mocked recovery response; after removing the interception, a real retry
successfully restored the connected state. These were test-harness selector/
interception issues, not application test failures.

**Product test failures:** 0. The browser automation issues above were corrected
or isolated from the application and are recorded for transparency.

## Security and dependency validation

- Backend and frontend `npm audit --json`: **0 vulnerabilities** reported in
  either installed dependency tree at test time.
- `.env` is ignored; the root, backend, and frontend environment example files
  contain configuration placeholders/defaults, not database credentials.
- MongoDB connection strings are read from `MONGODB_URI`; no Atlas credential
  was configured or exposed.
- CORS allows configured frontend origins and does not enable credentialed
  cross-origin requests.
- Region names are allowlisted; client input cannot select collection names.
  Query filters are constructed from explicit fields; station search escapes
  regular-expression metacharacters.
- Duplicate-key responses report conflicting field names, not submitted values.

## Known limitations

- The seed dataset is small, so latency comparisons mainly demonstrate
  collection access patterns and index statistics, not production throughput.
- Query history is in process memory and resets on API restart.
- The project uses four logical collections in one database deployment; it
  does not configure MongoDB horizontal sharding, shard keys, or `mongos`.
- Monitoring data is simulated; no physical station or Atlas deployment was
  tested.
- Browser verification was manual/Playwright-driven; no separate frontend unit
  test runner is currently configured.
- The backend lint script is a Node syntax check, not a style linter.

For capturing authentic page images for a submission, use the
[screenshot checklist](SCREENSHOT_CHECKLIST.md). This report contains no
synthetic or fabricated application screenshots.
