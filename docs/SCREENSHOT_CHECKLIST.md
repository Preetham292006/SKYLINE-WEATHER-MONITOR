# SKYLINE Screenshot Checklist

Capture images directly from the running SKYLINE application. This checklist
does not contain generated screenshots. Use connected MongoDB data when
available; if using the offline fallback, keep its demo-data label visible.

## Capture preparation

- [ ] Start MongoDB, run the seed script if a fresh demonstration dataset is needed, then start backend and frontend as described in [README.md](../README.md).
- [ ] Confirm the application connection status before capturing database-backed results.
- [ ] Use a consistent browser zoom and window size; capture a desktop presentation view and, if required, one responsive mobile view.
- [ ] Hide personal information and any credentials, environment variables, or browser developer tools.
- [ ] Do not edit values or fabricate chart contents. Note whether the image shows seeded, live database, or labeled demo fallback data.
- [ ] For benchmark captures, retain the query filters and strategy labels in view and record that results are environment-specific.
- [ ] Save original captures in a submission folder; document date, viewport, connection state, and any filters used.

## Required page captures

| # | Page / view | Suggested state to capture | Done |
|---:|---|---|:---:|
| 1 | Dashboard (`/`) | Weather overview, statistics, charts, regional distribution, recent station activity | [ ] |
| 2 | Weather Stations (`/stations`) | Search/filter controls and station table/cards; optionally a separate station detail capture | [ ] |
| 3 | Live Monitoring (`/monitoring`) | Selected station/region, time range, metric cards and rendered chart; identify generated readings as simulated | [ ] |
| 4 | Regional Shards (`/shards`) | North, South, East, West collection summaries and logical partitioning explanation | [ ] |
| 5 | Analytics (`/analytics`) | Regional/weather comparison charts and filters | [ ] |
| 6 | Geographical Analytics (`/geographical-analytics`) | Region summaries, query testing controls, and routing explanation | [ ] |
| 7 | Query comparison | Same region and equivalent filters for routed and scatter-gather results; show collection count and returned records | [ ] |
| 8 | Alerts (`/alerts`) | Severity/status filters and representative alert cards; avoid exposing temporary QA records | [ ] |
| 9 | Settings (`/settings`) | Preference and source/configuration information without personal or secret values | [ ] |

## Optional responsive captures

- [ ] Mobile-width dashboard with navigation menu behavior visible.
- [ ] Mobile-width station list or query panel with no clipped controls.
- [ ] Tablet-width analytics or monitoring chart.

## Submission image log

Record capture metadata alongside the actual image files:

| Image filename | Page | Capture date/time | Viewport | Data source / state | Filters or notes |
|---|---|---|---|---|---|
| _Fill in after capturing_ | | | | | |

