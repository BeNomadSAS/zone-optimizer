# Zone Optimizer

A ready-to-run code sample showing how to build a real Bemap-powered web app — from drawing a zone on a map to producing a navigation-ready route.

## What it demonstrates

You drop a polygon on the map, the app **extracts every road segment inside it**, optimises a **turn-by-turn-ready itinerary** through those points, and offers a **minimal-waypoint** distillation suitable for in-car navigation hand-off. End-to-end Bemap integration in a handful of API calls.

| Capability | Bemap surface |
|---|---|
| Render the map + draw a polygon | `bemap.LeafletMap` + Leaflet.Draw |
| Reverse-geocode + snap-to-road every placement | `bemap.ReverseGeocoder.revGeo` with an expanding radius |
| Extract every road segment inside the polygon | `/service/roadsextractor/1.0` |
| Optimise the trip + return the minimal waypoint subset | `/service/routing/1.0` with `options: [POLYLINE, OPTIMIZED_TRIP, WAYPOINTS, WAYPOINTS_POLYLINE, MINIMAL_WAYPOINTS]` |
| Force-keep start + end during minimisation | per-destination `keptByMinimalWp: true` |
| (Diagnostic) Compare with the legacy TraceRoute reconstruction | `/service/routing/1.0/traceroute` — on-demand button only |
| Authenticate against Bemap | Basic Auth via `bemap.Context` + `service/acl/1.0/user/details` probe |

## API endpoints used

| Service | Endpoint | Authentication |
|---|---|---|
| WMS tiles | `/wms` | `appid` / `appcode` |
| Auth probe | `/service/acl/1.0/user/details` | Basic Auth |
| Roads Extractor | `/service/roadsextractor/1.0` | Basic Auth |
| Routing | `/service/routing/1.0` | Basic Auth |
| TraceRoute | `/service/routing/1.0/traceroute` | Basic Auth |
| Reverse Geocoding (v2) | `/service/geocoding/1.0/reverse` | Basic Auth |

## Features in this build

- **Polygon drawing & editing** — Leaflet.Draw with vertex drag / merge / delete / insert
- **Road extraction** inside the polygon with transport-mode filtering
- **Per-segment toggle** — click any extracted point to exclude it from routing; active counter live
- **Route optimisation** through every active point — single `/service/routing/1.0` call
- **Minimal waypoints in the SAME routing response** — `MINIMAL_WAYPOINTS` sub-option of `WAYPOINTS`. The waypoints in the minimal subset get a rose ring around their numbered marker. `keptByMinimalWp: true` on start + end keeps them always.
- **Reverse-geocode + snap-to-road on every Start/End placement** with expanding-radius retry (50 m → 200 m → 800 m), then auto-reselect if no road is found
- **Route animation** at adjustable speed
- **Bilingual UI** (FR / EN), runtime toggle in the panel header
- **Light / dark theme**, persisted in `localStorage` with no-flash boot
- **Active-step ping** — current wizard card pulses to guide the user
- **CSV / ordered-CSV / minimal-waypoint downloads**
- **Diagnostic TraceRoute overlay** — on-demand button after a route is computed; superposes the legacy `/service/routing/1.0/traceroute` reconstruction on top of the routing result for A/B visual comparison. Not used in the main flow.

## Tech stack

The build artefact in this repository is the output of a Vite production pipeline. It ships as **static HTML + CSS + JavaScript** — no server, no runtime build step, no framework. Just serve it.

- **bemap-js-api** for the map, drawing tools, geocoding, routing and authentication
- **jQuery 3.4.1** for DOM/AJAX
- **Vite 5** (build time only — the artefact is a static bundle)
- **SCSS** + design tokens (CSS custom properties)
- **i18n** via JSON dictionaries

## Quick setup

Clone, serve the directory with any static server, open `index.html` in a modern browser.

```bash
git clone https://github.com/BeNomadSAS/zone-optimizer.git
cd zone-optimizer

# pick one — any static server works
python -m http.server 8000
# or:
npx serve .
# or just open index.html in your browser (file:// works thanks to relative asset paths)
```

On first launch a modal asks for:
- **Environment** — your Bemap server base URL (no presets in the public build; you supply your own)
- **Username** + **password** — your Bemap account

The app validates the credentials against the Bemap ACL endpoint and only unlocks the wizard on `200`.

## Walk-through

| Step | Action |
|---|---|
| 1. Zone | **Dessiner un polygone** → click the map to add vertices → double-click to finish |
| 2. Options | Choose transport mode + filters |
| 3. Extraction | **Extraire les segments** — green dots appear; click any to toggle off |
| 4. Départ / Arrivée | Click on the map to drop start, then end. Each click is reverse-geocoded and snapped to the nearest road |
| 5. Optimisation | **Lancer l'optimisation** — computes the optimal trip through every active point |
| 6. Animation | Replay the route on the map at adjustable speed |
| 7+ | Toggle layer visibility, browse the ordered waypoint list (click any row to spotlight it on the map), download CSV / minimal waypoints |

Switch the UI language with the flag chips in the header. Dark theme via the moon button.

## Repo layout

```
zone-optimizer/
├── index.html              entry — single <script type="module"> + classic <script> SDK loads
├── assets/                 hashed JS + CSS bundle
├── bemap-js-api/           vendored Bemap JavaScript SDK (the public dist)
├── jquery/                 jQuery 3.4.1 (classic script, loaded before the SDK)
└── README.md
```

## Browser support

Modern evergreen browsers (Chrome, Firefox, Edge, Safari). Requires JavaScript + `fetch`. Tested on the latest two majors of each.

## License

Proprietary — BeNomad.
