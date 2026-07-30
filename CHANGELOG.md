# Changelog

All notable changes to the Zone Optimizer project are documented in this file.

## [1.6.0] - 2026-07-30

### NEW — Stale-cache recovery (asset versioning + version guard, EVMOVE-457 pattern)

Prevents the "silent blank map after a deployment" class of bug that hit the sibling app (EVMOVE-457). Vite already content-hashes files it processes, but everything under `public/` (`bemap-js-api/*`, `jquery/*`, `docs/*`) is copied verbatim with bare paths — browsers can cache those for months. A returning tab that boots the OLD vendored `bemap-js-api.js` next to the NEW hashed bundle used to fail invisibly with an all-grey map and no console error. Now:

- **Build token** — `vite/build-token.js` computes `<pkg version>-<git sha>` per build. Dirty tree → `-dev<ts>` suffix (so two working states of the same commit don't share a URL). Git unavailable → `<version>-<ts>` fallback. One helper, three consumers keyed to the SAME string: HTML stamping, `version.json`, and the compile-time `__BUILD_TOKEN__`.
- **Asset stamping** — `vite/plugin-asset-versioning.js` runs in build mode only. `transformIndexHtml` (post-order) appends `?v=<token>` to every LOCAL, not-Vite-processed `src`/`href` — `/bemap-js-api/…`, `/jquery/…`, `/docs/…`. External URLs, `data:` URIs, and Vite-hashed assets are left alone. Idempotent (won't stamp twice). Whitespace-anchored attribute match so `data-src` next to a real `src` isn't captured. Percent-encodes tokens containing URL-meta chars.
- **`dist/version.json`** — same plugin writes `{ token, version, commit, dirty, builtAt }` at `closeBundle`. Token is IDENTICAL to what the stamped URLs and the bundle carry (single source of truth — no separate script recomputes from current git state, which would announce a mismatch after a dirty build).
- **`src/app/versionGuard.js`** — runs FIRST in `main.js` (before any other module init). Fetches `dist/version.json` with `cache: 'no-store'`; if the deployed token differs from `__BUILD_TOKEN__`, purges scoped Cache API entries (`bemap*` / `mptiles*` / `zo*` prefixes only — foreign caches on shared origins are left alone) and reloads through a cache-busting URL via `location.replace('?_v=<token>')`. **Never** `location.reload(true)` — that flag is ignored by every modern browser.
- **Bounded retry** — max 3 reload attempts per token, 60 s apart, tracked per-token in `localStorage['zo_versionGuard']`. Deployments aren't atomic; the version manifest can lead index.html by seconds. One-shot suppression would strand the browser; unbounded retry would loop.
- **Storage-unavailable cap** — private-mode / restricted-iframe browsers where `localStorage` throws fall back to a storage-independent proof: the URL `?_v=<token>` buster itself. Cap at ONE reload. Compared as EXACT query-parameter equality (not substring) so `?other=_v=token` and `?_v=token-extra` don't get mistaken for our own buster and silently suppress the only recovery reload.
- **Cooldown re-check** — if a reload happens during an active cooldown, a single `setTimeout` re-runs `check()` when the cooldown expires so a browser that landed on a still-stale shell isn't stranded until manual refresh.
- **Fail-soft** — every error path (unbuilt / dev / offline / HTTP error / non-JSON body / manifest without a token / crippled console / opaque-origin iframe) logs one `[version-guard] …` line and proceeds to boot. `getLastClear()` returns the last CLEARED outcome (`{ from, to, at, caches }`) so callers can inspect post-reload state after the reload wipes the console.

### NEW — bemap-js-api v2.0.1 vendored

Independent of the guard, drops in the SDK fix for the OTHER half of the stale-cache class: PMTiles archive rebuilds that reuse the same URL but shift byte offsets. SDK auto-appends `?v=<archive-version-token>` (from `/api/maps.aliasVersions`) to every PMTiles slice + restores the ETag self-heal so a rebuilt tileset doesn't blank the map either.

### Version banner — now with build ISO timestamp

Existing `%c`-styled version pills carried forward from v1.5.1 (`zone-optimizer  v1.6.0  bemap-js-api v2.0.1`) — plus a second line showing the exact build timestamp:

```
 build   2026-07-30T12:36:50.490Z
```

Timestamp is baked in at build time via a new `__BUILD_DATE__` compile-time constant (same `builtAt` string as `version.json`), so the banner never fetches at runtime. Undefined in dev, so the second line is simply skipped there. Cheap forensic aid when users report "the fix isn't there" — one glance at the console reveals whether they're on the freshly deployed bundle or a stale cached one.

### Review fixes applied to the stale-cache prevention mechanism

Three issues surfaced during code review, fixed before ship:

- **Retry budget honoured for the full three attempts** (was: collapsed to one). The URL-buster short-circuit was firing ahead of the `localStorage` budget read, so once ANY reload had happened the buster was permanently in the URL and every subsequent boot fell through the short-circuit — degrading "3 attempts over 3 cooldown windows" to "1 attempt then endless cooldown re-checks". Now the buster short-circuit only applies in the storage-broken branch; when storage is available, the `localStorage` counter is authoritative and walks 1 → 2 → 3 → give up as documented.
- **Dev server no longer fetches `/version.json`**. `__BUILD_TOKEN__` was defined in both `serve` and `build` modes; the guard would fetch a non-existent manifest on every dev reload and log a spurious "manifest not JSON" line (Vite answers unknown paths with the SPA `index.html`). Now `define()` only stamps `__BUILD_TOKEN__`/`__BUILD_DATE__` when `command === 'build'`; dev substitutes the JS identifier `undefined` and the guard cleanly short-circuits with `NOT CLEARED — no __BUILD_TOKEN__ (dev / unbuilt)`.
- **Fragment-bearing URLs stamped correctly**. `/docs/USER_GUIDE_FR.md#section` was becoming `/docs/USER_GUIDE_FR.md#section?v=<token>` — the `?v=` ended up inside the fragment where browsers never send it, so the cache-buster silently no-op'd on any anchor link. `stampHtml` now splits the URL at `#` before deciding query placement, and the idempotency check is scoped to the path+query portion (a `v=` inside a fragment is not a real stamp).

### Tests — 316 → **371** across 20 files

- `tests/asset-versioning-plugin.test.js` **(27)** — token stamping (bare src, with-query, idempotent, CSS href), what MUST be left alone (external / protocol-relative / data / foreign paths / Vite-hashed), whitespace-anchored attribute discipline (data-src not stamped), URL-meta token encoding, `versionJsonPayload` shape, `buildToken` shape invariants, **fragment safety** (stamp inserts `?v=` before `#`, `&v=` before `#` when query present, never inside fragment, idempotent alongside a fragment, no false-positive skip when `v=` sits only inside the fragment, external fragmented URLs left alone).
- `tests/version-guard.test.js` **(28)** — happy-path up-to-date, reload post-completion recognized, mismatch reload flow (URL rewrite preserves params + fragment, replaces prior `_v` with only ONE `_v=` in the target), scoped cache deletion (only own prefixes, records skipped in `getLastClear`, safe when Cache API missing), exact `_v` recognition (false-positive traps: `?other=_v=…`, `?_v=…-extra`), retry budget (caps at `MAX_ATTEMPTS`, cooldown respected, allows retry after cooldown, newer token starts fresh budget), storage-unavailable cap (still reloads at most once), fail-soft outcomes (no `__BUILD_TOKEN__` / HTTP error / non-JSON / missing token / offline / no fetch), `getLastClear` semantics, **P1 regression guard** — full retry sequence walks attempts 1 → 2 → 3 → give up over three cooldown windows with the URL buster present at each boot; a genuinely newer deployed token resets the budget even when the URL still carries the previous buster.
- **Test trap patched**: assertions thrown inside the guard's callback are wrapped `try { … } catch (e) { fail(e) }` per callback so a broken return value can't pass silently through the guard's terminal `.catch`.

### Acceptance criteria (all met)

1. ✅ Post-build, every `/bemap-js-api/…` and `/jquery/…` in `dist/index.html` carries `?v=<token>`; `/src/main.js` is replaced by the hashed bundle; external URLs untouched.
2. ✅ `dist/version.json` exists, `token` equals the stamped URLs' token AND the compile-time `__BUILD_TOKEN__`.
3. ✅ Loading the built app on the deployed build logs `NOT CLEARED — already on the deployed build <token>`.
4. ✅ Deploying a new build + reloading an old tab: one reload, comes back on the new build, subsequent boot logs `CLEARED — reload completed`.
5. ✅ Reloading repeatedly afterwards never reloads again (buster present → skip).
6. ✅ With `localStorage` unavailable, stale shell reloads AT MOST once (URL buster is the fallback cap).
7. ✅ `version.json` unreachable / 500 / HTML body → app starts normally.
8. ✅ Dev server: guard is inert (no `__BUILD_TOKEN__` in dev), no `?v=` stamping, no reload.

### Deployment prerequisite

Serve `index.html` and `version.json` with `Cache-Control: no-store` (or purge them on the CDN). Everything else can be cached forever now, since every other URL changes per build. Note the limit: the guard ships INSIDE the bundle, so browsers already holding the old `index.html` + old bundle never download the new bundle and never fetch `version.json`. This protects every deployment AFTER this one reaches the browser once; for the first rollout, the `no-store` header or a purge is what repairs the users already affected.

## [1.5.1] - 2026-07-10

### CHANGED

- **`bemap-js-api` bumped to v2.0.1** (vendored under `public/bemap-js-api/`) — integrates **EVMOVE-457**, the fix for "blank/grey map after a same-name archive rebuild." The SDK now auto-appends `?v=<token>` to every PMTiles slice URL (versions come from `/api/maps.aliasVersions`) and restores the pmtiles ETag self-heal, so a rebuilt archive that reuses the same URL but shifted byte offsets no longer serves stale 30-day-cached slices. No app-side changes required — the fix is transparent; the SDK does `?v` + self-heal automatically.
- Zero-config graceful degradation on envs still running the pre-EVMOVE-457 tile Worker (preprod / prod today): SDK sees no `versions` in `/api/maps`, skips `?v`, self-heal no-ops → same behaviour as v2.0.0. The fix activates automatically once each env's Worker is upgraded.
- **Version banner** (added in the same push) — a single-line `%c`-styled console log fires on `Auth.verify` success from both boot and modal-save paths:
  ```
   zone-optimizer  v1.5.1  bemap-js-api v2.0.1
  ```
  Matches the fleex-optim pattern so cross-app debugging looks consistent. Guarded by `_versionLogged` so env-switch re-mounts don't spam the console.
- **`tilesAuth: 'header'`** on the `bemap.Context` (shipped in the same push) — opts out of the SDK's cookie-mode default. Cookie mode silently 401s in Chrome incognito / Safari / Firefox ETP because `mptiles-api-<env>.benomad.net` is a third-party origin relative to the deploy host, and browsers drop the `Set-Cookie` from the login response. Header mode carries `X-Session-Token` on every tile request instead, adds one `OPTIONS` preflight per session, works everywhere. Browser HTTP cache still applies (200-slice responses are cached by URL, not by request headers). Also isolates apps sharing the tile host — no more session leakage between fleex-optim / PAV / mp-tiles-demo / this.

### Env coverage note

EVMOVE-457 activates only on envs whose tile Worker has the matching contract (`/api/maps` returns `versions` + `aliasVersions`, ETag exposed to CORS):

- **Beta** (`mptiles-api-beta.benomad.net`) — ✅ Worker upgraded, fix live.
- **Dev**  (`mptiles-api-dev.benomad.net`) — ✅ Worker upgraded, fix live.
- **Preprod** / **Prod** — ❌ Worker not yet upgraded. SDK degrades gracefully — behaves like v2.0.0.

### Verification

- **316 tests** across 18 files still pass.
- `map.getTilesConfig()` → `serviceWorker.enabled: false`, `tilesSliceMode: '200'`, `tilesAuth.mode: 'header'`.
- Network on Beta: every archive request carries exactly one `?v=<8-hex>`. Repeat slices hit disk cache in ~1-3 ms.
- Console shows the version banner with `bemap-js-api v2.0.1` on the SDK side.

## [1.5.0] - 2026-06-09

### CHANGED — MapLibre + PMTiles backend (was Leaflet + WMS)

- Map backend swapped: `bemap.LeafletMap` + WMS basemap → `bemap.MapLibreMap` + PMTiles via BeNomad Tiles.
- `ENVIRONMENTS` carries a `tilesHost` per env (Beta / Preprod / Prod → `mptiles-api[-X].benomad.net`), with a `Config._deriveTilesHost()` fallback for non-preset BeNomad hosts.
- `ZO.Map.init()` is state-only at boot; `ZO.Map.mount()` constructs the map after `Auth.verify` succeeds (TilesAuth runs once at construction — empty creds would silently no-op). `ZO.Map.unmount()` is idempotent.
- `index.html` script + CSS swap: dropped `leaflet.*` / `leaflet.draw.*`, added `maplibre-gl.*` + `pmtiles.js`.
- `Map.rebuildBaseLayer()` and `Map.promoteAnimationMarker()` kept as safe no-ops for older call sites.

### FIXED — env-switch JWT trap

- `bemap_tiles_token` is shared across envs and `TilesAuth.destroy()` doesn't clear it — switching beta → preprod would resurrect beta's JWT in the new TilesAuth's `_restoreFromStorage()`, skip the `/api/login` POST, and 401 on the preprod tile host. `Map.unmount()` now applies the four-step recipe: `_tilesAuth.logout()` → `localStorage.removeItem(STORAGE_KEY)` → SDK `map.remove()` (chains `clearAllEffects` + `_tilesAuth.destroy` + `_browserCache.destroy` + `native.remove`) → recycle `<div id="map">`.

### FIXED — session-expiry recovery (no map = login screen)

- `Map.mount()` subscribes to the SDK's `error:auth` channel. On 401 / 403 (e.g. mid-session expiry, tiles-server rejected a stale token) → unmount + re-open the login modal with the localised `config.error.sessionExpired` reason.

### FIXED — dedicated login screen on first paint

- `<body class="zo-gated">` (set in `index.html`) hides `#sidebar` + `#map` via CSS so the user never glimpses the "Non configuré" app shell behind a translucent modal. Removed by `Map.mount()` **before** constructing the MapLibreMap (display:none at construction = 0×0 canvas that never paints). Re-added by `Map._onAuthError`.

### FIXED — `ZO.Routing._onMapClick` extracted from `Routing.init`

- The map-click binding used to live in `ZO.Routing.init()` (runs at boot) — with deferred mount, `ZO._map` is null at boot, so `ZO._map.on(...)` crashed before the login modal could even show. Handler is now a stable module-level function; `Map.mount()` wires it after construction.

### FIXED — `serviceWorkerPath` pinned

- `new MapLibreMap()` now passes `serviceWorkerPath: '/bemap-js-api/bemap-sw-tiles.js'` so the SDK's auto-fallback chain doesn't probe `/bemap-sw-tiles.js` (site root) first — that 404s under Vite's SPA fallback and emits a browser-native `"script has unsupported MIME type ('text/html')"` warning before the working path is tried.

### CHANGED — extraction click → console (no popup)

- Clicking an extracted point still toggles `disabled` + invalidates any route, but the on-map popup is gone. Full segment record (lat, lon, angle, name, disabled, postalAddress, full object) is dumped to a collapsed `console.group` named with the new state + road label. Matches the click affordance on numbered + minimal-ring waypoints. Dead `_showSegmentPopup` helper removed.

### NEW — i18n

- `config.error.sessionExpired` — "Session expirée — veuillez vous reconnecter." / "Session expired — please sign in again."

### NEW — vendored SDK refreshed

- `public/bemap-js-api/` updated to the SDK version that exposes `NO_MINIMAL_WAYPOINTS` in `RoutingOptions` and ships the MapLibre + PMTiles + TilesAuth + BrowserCache surface.

### TESTS — 285 / 17 files (was 251 / 16)

- New `tests/map-lifecycle.test.js` (25) — init() state-only, mount() passes non-empty creds + tilesHost, second mount() tears down via SDK chain (separate `sdkRemoveCalls` + `nativeRemoveCalls` spies), `logout()` runs before `remove()` (call order recorded), localStorage cleared after unmount, end-to-end beta → preprod with simulated stale JWT, defensive paths (missing `logout()` / `STORAGE_KEY`), `<div id="map">` recycled with style preserved, `body.zo-gated` removed by mount + re-applied by `_onAuthError`, auth-error handler registered + fires unmount + opens modal.
- `tests/config.test.js` +7 — `tilesHost` per ENV preset, `_deriveTilesHost` handles `bemap[-X].benomad.com` case-insensitively + returns null for non-BeNomad hosts.

## [1.4.2] - 2026-06-09

- **Minimal-waypoints CSV download** now joins all four API sources per stop (matched coord, input coord + heading we sent, road label + angle + full postal address, routing-side `confidenceValue` / `distanceFromRequest` / `duration` / `length`) AND includes Start + End rows. New `kind` column (`start` / `middle` / `end`) as the first CSV field.
- Two pure helpers extracted for testability: `ZO.Routing._buildMinimalWaypointRecords` (middles only — drives ring rendering) and `ZO.Routing._buildFullTripRecords` (start + middles + end — drives the download).
- UI flag fix — `#download-min-wp-btn` was hidden behind the legacy `hasTraceRoute` flag; new `f.hasMinimalWp = (ZO.state.minimalWaypoints.length > 0)`. Visibility: `hasRoute && wantsMinimalWp && hasMinimalWp`.
- `tests/minimal-waypoints-download.test.js` (26 cases) — merge contract per source + CSV escaping for embedded commas / quotes + start/end placement + column order.

## [1.4.1] - 2026-06-08

### NEW

- **CSV replay upload.** A new **Importer un CSV (rejouer une extraction)** button in the Zone card lets you re-hydrate `ZO.state.extractedPoints` from a previously-downloaded extraction CSV — no polygon to re-draw, no Roads-Extractor hit, exact same scenario. The wizard's guide / active-step / clear-all logic now treats `hasExtraction` as equivalent to `hasPolygon` so the upload flow has the same affordances. Status messages appear in the zone card itself; reset wipes them.
- **Click-to-inspect on numbered + minimal-ring waypoints.** Clicking a numbered or rose-ring marker opens a collapsed `console.group` that dumps the underlying `usedDestinations[]` entry, the original input destination we sent, and the matching `routingRoutes[0].waypoints[]` entry side-by-side — so the link between the two API objects is inspectable in DevTools.

### FIXED

- **Minimal-waypoint rings landed on the wrong segments after `OPTIMIZED_TRIP` reshuffled the trip.** `route.waypoints[].usedDestinationIndex` is an index into `usedDestinations` AS REORDERED BY `usedOrder`, NOT into the original input array (`inputOrder`). Refactored into a pure `ZO.Routing._computeMinimalWaypointMarkers(route, usedDestinations)` helper with regression tests.

### CHANGED

- **Start + End destinations no longer ship `avoidUTurn` / `useStartAngle` / `coordinateSat.heading`.** Those routing hints only make sense for Roads-Extractor segments where the server-authoritative `road.angle` is available. User clicks are arbitrary points, so we now send only `coordinateSat: { lat, lon }` + `keptByMinimalWp: true` for Start and End. Refactored into `ZO.Routing._buildDestinations(allPoints)` with regression tests.
- `tests/`: 225 cases across 15 files (was 189 / 13). New: `csv-upload.test.js` (18), `minimal-waypoints.test.js` (9), plus 7 added cases to `routing-options.test.js` and 5 added cases to `ui.test.js`.
- `CLAUDE.md`: dropped the "SDK enum is incomplete" caveat now that `bemap-js-api` lists `RoutingOptions.NO_MINIMAL_WAYPOINTS`; documented the inverse semantics (minimisation is the default when `WAYPOINTS` is requested) and the role of `keptByMinimalWp`.

## [1.4.0] - 2026-06-05

Major release — design-system overhaul + full migration to the 2026 baseline (Vite + ESM + SCSS + JSON i18n + Vitest), plus bilingual UI, snap-to-road, configurable login gate, and the public-dist build pipeline.

### Infrastructure
- **Vite 5 + ES modules** — `src/app/*` with the dual-export pattern (`import { ZO }` + `ZO.X = X` shim). `npm run dev` (HMR), `npm run build` (hashed bundle in `dist/`, ~63 kB JS / 22 kB CSS).
- **SCSS partials** under `src/styles/` composed via `main.scss` (`@use`), design tokens on `:root`.
- **JSON-per-language i18n** under `src/i18n/` — `fr.json` + `en.json` (122 keys each, parity-asserted by a CI test).
- **Vitest + happy-dom** — `setup.js` imports every src/ ESM, tests run against the same `ZO.X` surface as production. 172 cases / 12 files in ~1.5 s.
- **`bemap-js-api` v1.5+** vendored under `public/bemap-js-api/`. New v2 `bemap.ReverseGeocoder` at `/service/geocoding/1.0/reverse` (one call returns both snapped coord + postal address).
- **jQuery 3.4.1** as an npm dep, served as a classic `<script>` so the SDK finds `window.jQuery`.

### Routing architecture — single-call, no auto TraceRoute
- **MINIMAL_WAYPOINTS** is a sub-option of `WAYPOINTS` — minimal subset returned in `routingRoutes[0].waypoints[]` in the SAME response. Replaced the legacy Routing + TraceRoute two-call flow.
- Start + End forced via `keptByMinimalWp: true`. Minimal subset drawn as a rose-ring overlay over the numbered marker (no second polyline).
- TraceRoute kept as a diagnostic compare button ("Superposer TraceRoute").

### User-facing features
- **Bilingual UI (FR + EN)** — `data-i18n` attributes + `ZO.i18n.t('key', { params })` for dynamic strings; flag toggle in the header, persisted in `localStorage`; modules re-render on `zo:langChanged`.
- **Light / dark theme** — runtime toggle; no-flash inline pre-paint script in `<head>`; same token names, different values per theme.
- **Per-segment activation toggle** — click an extracted point to disable/re-enable; live `<strong>X</strong> / Y` counter; routing skips disabled segments.
- **Snap-to-road on Start / End** — expanding-radius reverse-geocode (50 m → 200 m → 800 m); snapped marker + verified chip; hard-fail rewinds `clickMode` for retry.
- **Configurable login gate** — `ZO.Config.AUTH` block probes `service/acl/1.0/user/details` with Basic Auth; boot re-verifies stored creds, modal forced open on failure.
- **Map highlight on points-list click** — pulsing rose ring (SMIL SVG) at the row's location + popup + map pan; one pulse at a time, auto-clears.
- **Active-step pulse** — the card needing user attention breathes a violet ring every 1.8 s alongside its gradient bar.
- **Collapsible legend** (native `<details>`), points-list refinements (compact scrollable, auto-hide when empty).

### Design system
- Glass-panel sidebar, design tokens (`--cyan` / `--violet` / `--ink` / `--panel` / ...), gradient `.solve` button with glow, role-tinted `.btn-*` variants, env badge with status colour + pulsing dot, post-route stats grid (Distance / Durée / Waypoints min. / Match), Inter + JetBrains Mono fonts. All decorative motion gated behind `prefers-reduced-motion`.

### Private/public split — `npm run github`
- `vite/plugin-scrub-environments.js` strips `ENVIRONMENTS` to `[]` at build time so internal hostnames never reach `dist/`.
- `scripts/verify-dist.mjs` — paranoid second-pass grep over the bundle for forbidden hosts.
- `scripts/build-github.mjs` — builds + verifies + assembles the `github/` artefact (dist + public README + LICENSE + `.gitignore`) + prints push commands.
- `base: './'` in production builds so the artefact works under `file://`, GitHub Pages subpaths, or any static host.
- `README.md` rewritten as the public, evaluator-friendly version (capability ↔ Bemap surface table + endpoints table); `README-INTERNAL.md` carries the BeNomad context.

### Behind the scenes
- `cfg('a.b.c')` typed config accessor — throws on typo (fail-fast).
- `Object.freeze` on `Config.ENVIRONMENTS` + `Config.AUTH`.
- `bemap.Marker.setIcon()` is a model-only setter — segment-toggle now removes + re-adds the marker to actually swap the visual.
- DAOs moved to `src/dao/{dao,extraction-dao,routing-dao,traceroute-dao}.js` with the same dual-export pattern.
- End-to-end Bemap API harness `scripts/compare-minimal-waypoints.mjs` benchmarks both minimal-waypoint flows against Bemap Beta with 4 Paris zones.
- Legacy retired: `tests/v1.0.0.js`/`v1.2.0.js`/`v1.3.0.js`/`test-runner.html`, `scripts/build.mjs` hand-rolled sanitiser.

### npm scripts
| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server, HMR at http://localhost:5173 |
| `npm run build` | Production bundle into `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm test` | Vitest suites |
| `npm run verify` | Grep `dist/` for forbidden internal hosts |
| `npm run ship` | `build` + `verify` |
| `npm run github` | Assemble the public `github/` artefact |

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
- New test category **`inputorder`** (10 assertions) covers:
  - Round-trip mapping construction from a fake `usedDestinations` array.
  - Verification that `extracted[i]` correctly maps to `inputOrder = i + 1`.
  - Edge case: an unreachable destination (`used: false`) is excluded from the map.
- Haversine test category expanded with 9 new assertions covering `getDist` lon-first signature, `getDistFromPoint` object form, `calculateDistanceFromStartForPolyline` mutation, and `convertPolylineToRegular` interpolation behavior.
- New version filter button **v1.3.0 (NEW)** in the test runner.

### DOCS

- README.md and `ZO.version` bumped to 1.3.0.
- Test runner version assertion bumped to 1.3.0.

## [1.2.0] - 2026-04-15

Production hardening release. Bug fixes, error handling, expanded test coverage (31 → 107 assertions), credential storage hardening.

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
- 7 new test categories: Haversine, Icons, Config, DAO, UI Flags, Robustness, Errors.

### REFACTORED

- Three duplicated Haversine blocks in `utils.js` (`cumulativeDistances`, `computePolylineMatch`, `samplePolyline`) consolidated to call `distPointToPoint`.
- DAOs (`extraction-dao`, `routing-dao`, `traceroute-dao`) now `return` the underlying XHR for caller-side abort.
- `ZO.Config.renderSummary` switched from `.html()` concatenation to structured `.append()` with `document.createTextNode` for XSS safety.
- Tooltip strings sanitized at source in `extraction.js` (`< > &` stripped from API-returned road names).

### TESTS

- Test count: 31 → 107 assertions across 13 categories.
- New categories cover icon SVG generation, environment lookup, credential round-trip, Basic Auth header, UI wizard state machine, edge cases on math helpers, and API error parsing.
- `tests/test-runner.html` now loads jQuery + a small `bemap.Context` stub so `config.js`, `dao.js`, `ui.js`, and `animation.js` are testable without booting the full bemap-js-api.

### DOCS

- README.md version corrected from `1.0.0` → `1.2.0`.
- README.md Tech Stack no longer claims Leaflet.Draw is loaded from CDN (it is bundled inside bemap-js-api dist).
- README.md test-categories list expanded.

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

- `app.html` (legacy single-file prototype)
- `server.py` (Python CORS proxy, no longer needed)
- `ZO.Utils.distToSegmentPx` (polygon edge math now handled by `bemap.editPolygon`)
- `ZO._leafletMap` / `ZO.getLeafletMap()` (only `ZO._map` remains)
- Leaflet.Draw CDN dependency in `index.html`

### PROJECT STRUCTURE

- Added `js/app/icons.js` for centralized SVG icon factory
- Removed drawnItems + vertexHandlesLayer from `map.js` (no longer needed)
- Simplified `polygon-edit.js` (bemap.editPolygon handles all vertex work)

## [1.0.0] - 2026-04-15

Initial structured release. Migrated from single-file prototype (`app.html`) to a modular project following BeNomad conventions (evmove5 / bemap-js-api patterns).

### FEATURES

- Separated HTML, CSS, and JavaScript into distinct files
- Introduced `ZO` namespace with shared state management (pattern from evmove5)
- jQuery 3.4.1 for DOM manipulation (replacing vanilla JavaScript)
- DAO layer with `bemap.ajax()` and `getBasicAuth()` for all API calls (pattern from evmove5)
- URL construction via `bemap.Context.getBaseUrl()` (no more manual string building)
- Removed Python proxy (`server.py`) — API calls go directly via `bemap.ajax`
- WMS base layer via `L.tileLayer.wms` with `appid`/`appcode` authentication
- Unit test suite with visual test runner (matching bemap-js-api test-runner style)
- Tests organized by category: Polyline, Distance, CSV, Animation, Sampling

### PROJECT STRUCTURE

- `js/app/` — Application modules (config, map, polygon, extraction, routing, traceroute, animation, points-list, utils)
- `js/dao/` — Data Access Objects (extraction-dao, routing-dao, traceroute-dao)
- `css/` — Extracted styles
- `lib/` — bemap-js-api + jQuery
- `tests/` — Visual test suite

### MIGRATION NOTES

- `app.html` (original prototype) kept for reference
- `server.py` (Python CORS proxy) no longer needed
- Leaflet.Draw still loaded from CDN (to be integrated into bemap-js-api)

## [0.1.0] - 2026-04-14

Prototype version — single `app.html` file with inline CSS/JS + Python proxy (`server.py`).
