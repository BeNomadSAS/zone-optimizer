# Changelog

All notable changes to the Zone Optimizer project are documented in this file.

## [1.4.0] - 2026-04-27

UI translated from French to English. The sample is now consistent with the rest of zone-optimizer's documentation, READMEs, and code comments — the user-facing language was the only French part left and has been the main friction point for non-French integrators evaluating the project.

### CHANGED

- All user-facing strings translated to English in `index.html` (sidebar sections, transport mode options, legend, modal, instructions) and in the JavaScript modules that build dynamic strings: `config.js` (modal errors, summary), `ui.js` (wizard instructions), `loader.js` (overlay default), `extraction.js` (status + stats), `routing.js` (status, start/end labels, distance/duration, layer toggles), `traceroute.js` (minimal waypoints + match line), `points-list.js` (Start/End/Point labels, list toggle), `polygon-edit.js` (bbox info + drawing help), `utils.js` (`parseApiError` for 0/401/403/404/5xx and unknown).
- `<html lang="fr">` → `<html lang="en">`.
- Bbox cardinal letter `O` (Ouest) → `W` (West).
- Routing API `outputLanguage: 'fr'` → `'en'` and TraceRoute `language: 'fr'` → `'en'` so navigation instructions returned by Bemap match the UI language.

### DOCS

- `package.json`, `ZO.version`, README badge bumped to 1.4.0.

## [1.3.0] - 2026-04-15

Cross-project alignment release. Distance helpers ported verbatim from `bfleet/WebContent/js/app/tool.js` so logic can flow back and forth between zone-optimizer and bfleet. Critical CSV-mapping bug rewritten to use the API's authoritative `inputOrder` field instead of fragile client-side proximity matching.

### FIXED

- **CRITICAL**: `segments + ordre` CSV download no longer uses any client-side distance matching. The Bemap routing API returns `inputOrder` (the index of each destination as we sent it) and `usedOrder` (its position in the optimized trip) on every entry of `usedDestinations`. We now build a `Map<inputOrder, usedOrder>` once during the optimize success callback and look up the order for each extracted segment by index. This is **O(N) instead of O(N*M)** and **exact instead of proximity-approximate** (the previous Haversine match could pick the wrong waypoint when two extracted points were geographically close).
  - The v1.2.0 fix that replaced Euclidean with Haversine was correct as a stop-gap, but `inputOrder` makes it unnecessary entirely. Verified against the API documentation at `bemap_idea/.../routing-service.md` and the Java model `RoutingUsedDestination.java:16,27`.

### REFACTORED

- **`utils.js` distance helpers ported verbatim from bfleet** (`bfleet/WebContent/js/app/tool.js`):
  - `ZO.Utils.getDist(lon1, lat1, lon2, lat2)` — bfleet's Haversine with the `dx===0` short-circuit optimization (cheaper for purely east-west / north-south segments).
  - `ZO.Utils.getDistFromPoint(p1, p2)` — accepts either `{lon, lat}` or `{longitude, latitude}` objects.
  - `ZO.Utils.calculateDistanceFromStartForPolyline(polyline)` — bfleet pattern that mutates the input by attaching `distanceFromStart` (meters) on each vertex.
  - `ZO.Utils.convertPolylineToRegular(polyline, stepInMeter)` — INTERPOLATES intermediate points so spacing is exact (the previous `samplePolyline` only kept existing vertices, leaving gaps wherever the source polyline had sparse vertices).
- **Note**: bfleet uses **(longitude, latitude)** parameter order. We now follow the same convention. Thin adapter wrappers (`cumulativeDistances`, `interpolateAtDistance`, `samplePolyline`) keep the existing `[lat, lon]`-array call signatures so `animation.js` and `traceroute.js` need NO changes.
- `ZO.Utils.distPointToPoint` (added in v1.2.0) is removed - replaced by `ZO.Utils.getDist` with bfleet-compatible parameter order.
- `ZO.Utils.computePolylineMatch` rewritten internally to call the new `getDist` (no behavior change).

### ADDED

- `ZO.state.usedOrderByInputIndex` - cached `{inputOrder: usedOrder}` map populated on every routing optimize success.

### DOCS

- README.md and `ZO.version` bumped to 1.3.0.

## [1.2.0] - 2026-04-15

Production hardening release. Bug fixes, error handling, credential storage hardening.

### FIXED

- **CRITICAL**: `segments + ordre` CSV download used Euclidean distance on lat/lon degrees to match extracted points to ordered waypoints. Replaced with Haversine via the new `ZO.Utils.distPointToPoint` helper. Output is now correct.
- **HIGH**: API errors are no longer silently swallowed by empty `catch` blocks. New `ZO.Utils.parseApiError` surfaces 401 / 403 / 404 / 5xx / network-down / abort / JSON `{message}` / JSON `{error}` / plaintext fallback with French messages.
- **HIGH**: Bemap password is now base64-obfuscated at rest and defaults to `sessionStorage` (cleared on tab close). New "Se souvenir" checkbox opts in to `localStorage`. Existing v1.1.0 plaintext installs are migrated transparently on first load.
- **MEDIUM**: Animation speed slider is bounds-checked. Empty/NaN/negative/overflow values default to ×1.0 instead of producing `[NaN, NaN]` marker positions.
- **MEDIUM**: All long-running API calls (Extract, Optimize, TraceRoute) are now abortable. Re-clicking a button or clearing state cancels the in-flight XHR via the new `ZO.dao.cancel(key)` helper. Aborted requests no longer surface as "Erreur".
- `ZO.Utils.interpolateAtDistance` is safe on empty / single-point / zero-total-distance polylines.
- `ZO.Utils.distPointToPolyline` returns `Infinity` instead of misbehaving on empty / single-point input.
- `ZO.Utils.samplePolyline` handles empty and single-point input gracefully.
- `ZO.dao.getBasicAuth` no longer throws on non-Latin-1 (unicode) passwords - now uses TextEncoder for UTF-8-safe base64.
- CSV regex matching gained `isNaN()` guard on parsed lat/lon.
- Route stats coerce response numbers explicitly before display (defense-in-depth against API returning string types).

### ADDED

- `ZO.Utils.distPointToPoint(lat1, lon1, lat2, lon2)` Haversine helper - single source of truth for great-circle distance.
- `ZO.Utils.parseApiError(xhr, response)` - localized API error formatter.
- `ZO.dao._inflight`, `ZO.dao.cancel(key)`, `ZO.dao.track(key, xhr)` - in-flight XHR tracker.
- `ZO.Config._obfuscate(s)` / `_unobfuscate(s)` - base64 obfuscation with `b64:` marker prefix.
- `ZO.Config._migrate()` - one-shot transparent migration from v1.1.0 plaintext credentials.
- "Se souvenir" checkbox in the credential modal.
- Esc-to-cancel and Enter-to-save keyboard shortcuts in the credential modal.
- Inline SVG favicon (indigo disc, matches palette).
- `aria-live="polite"` on dynamic status regions.
- `aria-current="step"` on the active wizard section (managed by `ZO.UI._setActiveStep`).
- `prefers-reduced-motion` honored in `_applySection` smooth-scroll.

### REFACTORED

- Three duplicated Haversine blocks in `utils.js` (`cumulativeDistances`, `computePolylineMatch`, `samplePolyline`) consolidated to call `distPointToPoint`.
- DAOs (`extraction-dao`, `routing-dao`, `traceroute-dao`) now `return` the underlying XHR for caller-side abort.
- `ZO.Config.renderSummary` switched from `.html()` concatenation to structured `.append()` with `document.createTextNode` for XSS safety.
- Tooltip strings sanitized at source in `extraction.js` (`< > &` stripped from API-returned road names).

### DOCS

- README.md version corrected from `1.0.0` → `1.2.0`.
- README.md Tech Stack no longer claims Leaflet.Draw is loaded from CDN (it is bundled inside bemap-js-api dist).

## [1.1.0] - 2026-04-16

Full migration to 100% bemap-js-api. Zero raw Leaflet calls in application code. Unified indigo-based design language.

### FEATURES

- All map operations now go through `bemap.LeafletMap` (no raw `L.map` / `L.marker` / `L.polygon` / `L.polyline` / `L.circleMarker` / `L.tileLayer` / `L.layerGroup` / `L.divIcon`)
- Polygon drawing uses `bemap.LeafletMap.drawPolygon` + `bemap.LeafletMap.editPolygon` - all vertex editing (drag, merge, right-click delete, middle-insert, edge-click insert) handled internally by bemap
- Removed Leaflet.Draw dependency entirely (no more CDN script tag)
- Named `bemap.VectorLayer`s for each feature group: `points`, `routing`, `traceroute`, `startEnd`, `animation`
- Layer visibility toggling via `bemap.VectorLayer.setVisible()` / `isVisible()`
- Custom SVG icons centralized in `js/app/icons.js` module (`ZO.Icons` factory)
- Shared `bemap.Popup` for marker tooltips (single instance, moved around)
- Map marker animation uses `bemap.Marker.setCoordinate(new bemap.Coordinate(lon, lat))`
- Credential changes rebuild only the context + `bemap.BemapLayer` (overlays preserved)

### DESIGN

- Unified indigo-led palette across buttons, polygon, markers, and polylines:
  - `#4f46e5` indigo-600 - primary, routing
  - `#6366f1` indigo-500 - accent, polygon border
  - `#10b981` emerald - start, extracted points, success
  - `#ef4444` red - end, destructive
  - `#f43f5e` rose - traceroute
- Consistent button variants (`.btn-emerald`, `.btn-indigo`, `.btn-rose`, `.btn-amber`, `.btn-cyan`, `.btn-violet`, `.btn-red`)
- Refined modal shadow, border radius, and status colors (emerald/amber/red)

### REMOVED

- `ZO.Utils.distToSegmentPx` (polygon edge math now handled by `bemap.editPolygon`)
- `ZO._leafletMap` / `ZO.getLeafletMap()` (only `ZO._map` remains)

### PROJECT STRUCTURE

- Added `js/app/icons.js` for centralized SVG icon factory
- Removed drawnItems + vertexHandlesLayer from `map.js` (no longer needed)
- Simplified `polygon-edit.js` (bemap.editPolygon handles all vertex work)

## [1.0.0] - 2026-04-15

Initial release. Modular project following BeNomad conventions (evmove5 / bemap-js-api patterns).

### FEATURES

- Separated HTML, CSS, and JavaScript into distinct files
- Introduced `ZO` namespace with shared state management (pattern from evmove5)
- jQuery 3.4.1 for DOM manipulation
- DAO layer with `bemap.ajax()` and `getBasicAuth()` for all API calls (pattern from evmove5)
- URL construction via `bemap.Context.getBaseUrl()`
- WMS base layer via `L.tileLayer.wms` with `appid`/`appcode` authentication

### PROJECT STRUCTURE

- `js/app/` — Application modules (config, map, polygon, extraction, routing, traceroute, animation, points-list, utils)
- `js/dao/` — Data Access Objects (extraction-dao, routing-dao, traceroute-dao)
- `css/` — Extracted styles
- `lib/` — bemap-js-api + jQuery
