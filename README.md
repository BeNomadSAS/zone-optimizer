# Zone Optimizer

> A ready-to-run code sample showing how to build a real Bemap-powered web app —
> from drawing a zone on a map to producing a navigation-ready route.

**Live demo:** https://benomadsas.github.io/zone-optimizer/

![Version](https://img.shields.io/badge/version-1.3.0-4f46e5) ![Stack](https://img.shields.io/badge/stack-bemap--js--api%20%7C%20jQuery-6366f1) ![Status](https://img.shields.io/badge/status-sample-10b981)

## What this sample shows

Drop a polygon on a map, extract every road inside it, and turn that cloud of
points into a clean, turn-by-turn-ready itinerary — all with a handful of Bemap
API calls. Meant as a starting point for integrators: fork it, swap the
credentials, adapt the UI to your product.

**You'll see how to:**

- Authenticate to Bemap and wire up a WMS base map
- Draw and freely edit a polygon (`bemap.editPolygon`)
- Pull road segments inside the zone via **Roads Extractor**
- Optimize a trip through those points via **Routing** (`OPTIMIZED_TRIP`)
- Reduce the polyline to a minimal waypoint set via **TraceRoute** — ready for
  BeNav5 or any embedded navigator
- Compare two polylines and animate the route at variable speed
- Handle credentials, abortable requests, and API errors the sane way

## Highlights

| | |
|---|---|
| Polygon editor  | Drag, merge, insert, and right-click-delete vertices — no lib needed beyond bemap-js-api |
| Road extraction | Filter by transport mode, postal address, or in-polygon strictness |
| Route optimizer | Solves the best order through N extracted points automatically |
| Minimal waypoints | TraceRoute reduces a dense polyline to the fewest waypoints needed for navigation |
| Animation       | Side-by-side playback of routing vs. traceroute paths, speed slider |
| CSV exports     | Segments, minimal waypoints, and segments-with-visit-order |

## Quick Start

```bash
# 1. Clone
git clone https://github.com/BeNomadSAS/zone-optimizer.git
cd zone-optimizer

# 2. Serve it (anything that serves static files works)
python3 -m http.server 8080
# or: npx http-server -p 8080 --cors -o

# 3. Open http://localhost:8080 and enter your Bemap credentials
```

That's it. No build step, no package to install, no framework to learn.

See [INSTALL.md](INSTALL.md) for prerequisites and the bemap-js-api copy step.

## Project layout

```
zone-optimizer/
├─ index.html                  Entry point
├─ css/app.css                 Styles
├─ js/
│  ├─ app/
│  │  ├─ zone-optimizer.js     Central namespace (ZO) + shared state
│  │  ├─ config.js             Environments, credentials, bemap.Context
│  │  ├─ map.js                bemap.LeafletMap + named VectorLayers
│  │  ├─ polygon-edit.js       Polygon drawing and vertex editing
│  │  ├─ extraction.js         Road extraction UI
│  │  ├─ routing.js            Route optimization UI
│  │  ├─ traceroute.js         Minimal waypoints + polyline comparison
│  │  ├─ animation.js          Parallel route animation
│  │  ├─ points-list.js        Ordered waypoints display
│  │  ├─ icons.js              SVG icon factory
│  │  ├─ ui.js                 Wizard state machine
│  │  ├─ loader.js             Full-map overlay for long operations
│  │  └─ utils.js              Pure helpers (polyline, Haversine, CSV…)
│  └─ dao/
│     ├─ dao.js                Base DAO: Basic Auth, inflight abort
│     ├─ extraction-dao.js     Roads Extractor call
│     ├─ routing-dao.js        Routing call
│     └─ traceroute-dao.js     TraceRoute call
└─ lib/                        bemap-js-api and jQuery (see INSTALL.md)
```

## Tech stack

- **bemap-js-api** — BeNomad's JavaScript client (map display, drawing,
  authentication context, AJAX helpers)
- **jQuery 3.4.1** — DOM manipulation
- **Plain files** — no build, no bundler, no transpiler

## API endpoints used

| Service         | Endpoint                                   | Auth            |
|-----------------|--------------------------------------------|-----------------|
| WMS tiles       | `/wms`                                     | `appid`/`appcode` |
| Roads Extractor | `/service/roadsextractor/1.0`              | Basic Auth      |
| Routing         | `/service/routing/1.0`                     | Basic Auth      |
| TraceRoute      | `/service/routing/1.0/traceroute`          | Basic Auth      |

## Going further

- Architecture and API payload shapes: [INTEGRATION.md](INTEGRATION.md)
- Release notes: [CHANGELOG.md](CHANGELOG.md)
- Need a Bemap account or have questions? Reach out to your BeNomad contact.

## License

Proprietary — © BeNomad. Provided as a reference sample; see your BeNomad
agreement for usage terms.
