# SKYLINE Presentation Content

## 15-slide presentation outline

| Slide | Title | Suggested content and visual |
|---:|---|---|
| 1 | **SKYLINE – Geo-Distributed Weather Monitoring System** | Project title, student/team/institution details, guide, and date. Use the actual Dashboard screenshot only if captured from the running application. |
| 2 | **Abstract** | Full-stack weather monitoring case study; React/Vite, Express, MongoDB; four logical regional reading collections; query-routing demonstration. State explicitly that this is not a physical MongoDB sharded cluster. |
| 3 | **Problem Statement** | Remote stations create time-series readings; a basic single-collection design does not make region-based routing visible. Explain the educational need without claiming centralized storage is inherently inadequate. |
| 4 | **Objectives and Scope** | Station, reading, alert APIs; regional collections; routed/scatter-gather analysis; dashboard; no sensors, production SLA, or native cluster sharding. |
| 5 | **Existing and Proposed System** | Contrast a simple centralized reading collection with the project's four application-level logical partitions. Emphasize that the solution demonstrates a design pattern, not a proven throughput improvement. |
| 6 | **Technology Stack** | React, JavaScript, Vite, Router, Axios, Recharts, Leaflet/React Leaflet, Lucide React; Node.js, Express, Mongoose; MongoDB. Add a screenshot of the actual technology/design slide, not a fabricated app capture. |
| 7 | **System Architecture** | Use the architecture diagram from `FINAL_CASE_STUDY_REPORT.md`: browser/UI → Express routes/controllers/services → Mongoose → MongoDB collections. |
| 8 | **MongoDB Database Design** | Show `WeatherStations`, `WeatherAlerts`, and all four regional collections. Include core fields and a small actual schema excerpt. |
| 9 | **Geographical Routing** | Explain station lookup → stored region → allowlisted model mapping → regional collection. Show North/South/East/West names. Label as logical partitioning. |
| 10 | **Query Strategies** | Routed (one collection), scatter-gather (four), multi-region (selected set), and global (all regions without region filter). Explain collection-access metrics. |
| 11 | **Query Performance Comparison** | Actual South-region runs: 15.768/49.702 ms, 6.549/147.760 ms, and 8.627/379.350 ms (routed/scatter-gather); same 50 records, one vs four regional collections. State that local timings vary and are not guarantees. Use values from the validation report only. |
| 12 | **Application Screenshots** | Insert real screenshots of Dashboard, Weather Stations, and Geographical Analytics. Capture them from the running app with test/demo data clearly identified. Follow `SCREENSHOT_CHECKLIST.md`. |
| 13 | **Results and Testing** | 9 backend tests passed; backend/frontend lint and frontend build passed; zero vulnerabilities reported by both audits at test time; summarize browser, routing, persistence, and fallback checks. |
| 14 | **Conclusion and Limitations** | The application demonstrates regional organization and routed query access. Limitations: small local dataset, simulated data, in-memory query history, no physical cluster sharding or sensor deployment. |
| 15 | **Future Scope and References** | Authenticated sensors, geographic boundary assignment, durable history, larger reproducible benchmarks, separate native-sharding evaluation. Cite official React, MongoDB, Node.js, Express, and Vite documentation. |

## Presenter notes

- Keep all reported measurements tied to the local test environment and the same-filter comparison methodology.
- Avoid saying that logical collections are MongoDB shards or that the project demonstrated physical data distribution.
- Use only screenshots captured from the actual application; this outline contains no synthetic screenshots.
- For full source-supported explanations and test details, see [FINAL_CASE_STUDY_REPORT.md](FINAL_CASE_STUDY_REPORT.md) and [TESTING_REPORT.md](TESTING_REPORT.md).
