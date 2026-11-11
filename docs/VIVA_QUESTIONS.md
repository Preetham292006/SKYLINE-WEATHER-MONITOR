# SKYLINE Viva Questions and Answers

The answers below describe the implemented educational project. In particular, its regional collections are logical partitions, not a MongoDB sharded cluster.

## Project and architecture

### 1. What is the objective of SKYLINE?
SKYLINE demonstrates a full-stack weather monitoring flow and how a backend can route readings to region-based MongoDB collections.

### 2. What does “geo-distributed” mean in the project title?
It describes weather stations modeled as geographically separated sources and the application's region-aware data organization. It does not mean the MongoDB deployment itself is geographically distributed.

### 3. What are the main layers?
The frontend is React/Vite, the backend is Node.js/Express with Mongoose, and MongoDB stores stations, alerts, and readings.

### 4. What is the role of the frontend?
It renders the eight dashboard pages, obtains data through the API client, and provides search, filters, charts, and user interactions.

### 5. What is the role of the backend?
It validates requests, implements REST routes, applies business rules, routes reading operations, performs aggregation, and communicates with MongoDB.

### 6. Why separate routes, controllers, services, and models?
The separation keeps HTTP routing, request handling, reusable business logic, and persistence schema responsibilities distinct and easier to maintain.

### 7. How does the frontend communicate with the backend in development?
Axios calls `/api`; Vite proxies that path to the backend at `http://localhost:5000`.

### 8. What happens when MongoDB is unavailable?
The health endpoint remains available and reports connection state; database-dependent routes return HTTP `503`. The frontend shows an API error or an empty database state and does not substitute bundled weather records.

## React and JavaScript

### 9. What is React?
React is a JavaScript library for building user interfaces from reusable components.

### 10. What is a React component?
A component is a reusable unit of UI, commonly a JavaScript function that returns JSX.

### 11. What is JSX?
JSX is syntax that lets developers describe UI markup inside JavaScript expressions. Build tools transform it into JavaScript calls.

### 12. What is React state?
State is component-managed data that can change over time. Updating it causes React to render the UI with the new value.

### 13. Why use React context in this project?
Context provides shared application data and actions to pages without manually passing the same props through every intermediate component.

### 14. What does `useEffect` do?
`useEffect` synchronizes a component with external systems, such as loading data or subscribing to events. It should include appropriate dependencies and cleanup where needed.

### 15. What is React Router used for?
It maps browser paths to page components, enabling client-side navigation among the dashboard pages.

### 16. Why are pages lazy-loaded?
Lazy loading defers downloading a page module until it is needed and can reduce the initial JavaScript work.

### 17. What is the purpose of `async`/`await`?
It provides readable syntax for asynchronous operations such as HTTP and database requests. An awaited promise can resolve or throw an error.

### 18. How are loading and error states useful?
They make the UI communicate that a request is in progress or could not complete, instead of presenting blank or misleading data.

### 19. What is the difference between `let` and `const`?
Both are block-scoped. A `let` binding can be reassigned; a `const` binding cannot be reassigned, though an object it references may still be mutable.

### 20. What is a JavaScript promise?
A promise represents the eventual completion or failure of an asynchronous operation.

## Node.js and Express

### 21. What is Node.js?
Node.js is a JavaScript runtime used to execute JavaScript outside the browser, including on a server.

### 22. What is Express?
Express is a Node.js web framework for defining routes and middleware for HTTP applications.

### 23. What is middleware?
Middleware is a function in the request/response pipeline. It can parse request bodies, enforce policies, log, or pass control to later handlers.

### 24. What is CORS?
Cross-Origin Resource Sharing is a browser-enforced mechanism controlled by response headers that determines which origins may make cross-origin requests.

### 25. How is CORS configured in SKYLINE?
The backend allows origins listed in `FRONTEND_ORIGIN`, which defaults to the local frontend origin. Credentialed cross-origin requests are not enabled.

### 26. What is centralized error handling?
It is a final Express middleware that converts thrown or forwarded errors into consistent HTTP status and JSON responses.

### 27. Why does the backend start before MongoDB is ready?
This lets the health endpoint respond and allows the server to retry the database connection while database-dependent routes remain unavailable.

### 28. What is the purpose of `.env`?
It stores environment-specific configuration such as port and database URI outside application source. Real credentials should remain private and excluded from version control.

## REST APIs and CRUD

### 29. What does REST mean in this application?
The API uses HTTP resource-oriented routes and methods to retrieve and modify stations, readings, alerts, and summaries.

### 30. What is CRUD?
CRUD means Create, Read, Update, and Delete—the basic operations used to manage records.

### 31. Which method creates a station?
`POST /api/stations`.

### 32. Which method updates a station?
`PUT /api/stations/:stationId`.

### 33. How is an alert resolved?
The client sends `PATCH /api/alerts/:alertId/resolve`; the backend marks it resolved and records the resolution time.

### 34. What does HTTP `201` mean?
It indicates that a request successfully created a resource.

### 35. What does HTTP `400` mean?
It indicates the request is invalid or cannot be processed because its input is not acceptable.

### 36. Why can a database-backed request return `503`?
The service is temporarily unable to fulfill it, in this case because the MongoDB connection is not ready.

### 37. Why use JSON for the API?
JSON is a widely supported, text-based data format that maps naturally to JavaScript objects and API payloads.

### 38. How is an invalid region handled?
The router validates it against the fixed region allowlist and rejects it with a client error rather than selecting a collection from arbitrary input.

## MongoDB and data design

### 39. What is MongoDB?
MongoDB is a document database that stores BSON documents in collections.

### 40. What is a MongoDB collection?
A collection is a group of documents, conceptually similar to a table in a relational database, though the data model differs.

### 41. Which collections does SKYLINE use?
`WeatherStations`, `WeatherAlerts`, and the four regional collections: `north_weather_readings`, `south_weather_readings`, `east_weather_readings`, and `west_weather_readings`.

### 42. What is a Mongoose schema?
A schema defines the expected fields, types, validation, and indexes for documents handled by a Mongoose model.

### 43. How are stations associated with readings?
Readings store `stationId` and region as identifying fields. The backend looks up the station to determine its assigned region; this is an application reference, not a relational foreign-key constraint.

### 44. Why store `recordedAt`?
It represents when the observation was recorded and supports time filtering, sorting, trends, and historical queries.

### 45. What is a MongoDB index?
An index is a data structure that helps MongoDB locate or order matching records without scanning every document in some query patterns. It consumes storage and has write/update costs.

### 46. Which reading indexes are used?
Regional readings declare `{ stationId: 1, recordedAt: -1 }`, `{ recordedAt: -1 }`, `{ region: 1, recordedAt: -1 }`, and a unique sparse `seedKey` index.

### 47. What is a compound index?
It is an index over multiple fields in a specified order. Its field order and prefixes affect which query shapes it can support.

### 48. What does a `2dsphere` index do?
It supports queries over spherical/geospatial data, such as GeoJSON coordinates, when using compatible geospatial query operators.

### 49. What is MongoDB aggregation?
Aggregation processes documents through pipeline stages to filter, group, sort, transform, or combine data.

### 50. What does `$group` do?
It groups documents by a key and calculates accumulators such as count, average, minimum, or maximum.

### 51. What does `$unionWith` do?
It combines documents from another collection into an aggregation pipeline. SKYLINE uses it to analyze readings across regional collections.

### 52. What does `$dateTrunc` do?
It groups or rounds dates to a selected time unit such as an hour or day, which is useful for time-series summaries.

## Geographical partitioning and query performance

### 53. How does the region router work?
It normalizes a region name, validates it against four fixed definitions, and returns the predefined Mongoose model for that region.

### 54. What determines a reading's target region?
The station record's assigned region. The API rejects a client-supplied region if it conflicts with the station.

### 55. What is logical geographical partitioning?
It is the application's organization of records into regional collections according to a routing rule. It does not by itself distribute collections across database servers.

### 56. What is MongoDB horizontal sharding?
It is a MongoDB cluster capability that distributes a collection's data across shards according to a shard key.

### 57. What is a shard key?
A shard key is a field or compound field pattern used by MongoDB to partition and target documents in a sharded collection.

### 58. Is SKYLINE a real MongoDB sharded cluster?
No. It uses four logical collections in one configured MongoDB deployment and does not configure a shard key, `shardCollection`, or `mongos`.

### 59. What is a routed query in SKYLINE?
A query that selects the appropriate region and accesses only its matching reading collection. A station-specific query first resolves that station's region.

### 60. What is a scatter-gather query?
A query strategy that accesses every regional reading collection and combines matching results. It can be useful for all-region queries but performs more collection accesses for a region-specific predicate.

### 61. What is a global query?
In this application, it searches all four reading collections without a region predicate.

### 62. What is a multi-region query?
It accesses only a validated subset of requested regional collections.

### 63. How does the benchmark compare strategies fairly?
It prepares the same region/station/time filters and limit for routed and scatter-gather retrieval, then reports results, accessed collections, and timing for each.

### 64. Does a routed query always execute faster?
No. Timings depend on indexes, data volume, cache state, system load, and the database environment. The stable structural difference is how many regional collections the strategy accesses.

### 65. What is `explain("executionStats")` used for?
It provides query-plan and execution statistics such as documents and keys examined and winning-plan details where supported. It helps investigate query behavior; it is not a substitute for an end-to-end benchmark.

### 66. Why might an explain metric be N/A?
The server or query plan may not provide that statistic, or the explain request may fail. The project reports unavailable values rather than inventing them.

### 67. Why can documents examined differ from documents returned?
The database may inspect documents that fail to match or are not returned due to sorting and limits. In a multi-collection query, the sum of per-collection explain results may also differ from the final merged result count.

### 68. What did the local South comparison show?
Three recorded runs returned the same 50 records; routed accessed one collection and scatter-gather accessed four. The observed timings varied, so they are not a universal performance claim.

## Testing and project limitations

### 69. How many backend tests passed in the documented validation?
Nine backend integration tests passed and none failed in the recorded run against the isolated test database.

### 70. Why use a separate test database?
It protects development data from destructive test setup and teardown. The integration suite uses `skyline_weather_test`.

### 71. What is simulated data?
It is generated sample weather data, labeled `simulated: true`. SKYLINE distinguishes seeded demonstrations (`dataSource: "seeded-demo"`) from monitoring-generated simulations; neither is a genuine physical sensor observation.

### 72. What are the main project limitations?
The dataset is small, no physical sensors or native MongoDB sharding are configured, query history is in memory, and no separate frontend unit-test runner is currently configured.

### 73. How can the project be extended to true sharding?
A separate MongoDB sharded deployment would need to be provisioned, a shard key selected based on workload, collections sharded, and behavior measured. This would be a distinct deployment phase, not a change implied by the current logical partitioning.

### 74. Why is the current design appropriate for a college case study?
It demonstrates the key routing, schema, API, aggregation, and query-analysis concepts without requiring costly infrastructure or excessive operational complexity.
