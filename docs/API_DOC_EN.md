# Zone Optimizer — API Doc (EN)

Map of the Bemap calls this app makes.

| App step | Bemap endpoint | Method | Client module |
|---|---|---|---|
| Sign-in (auth gate) | `service/acl/1.0/user/details` | `GET` | `src/app/auth.js` |
| Snap-to-road on Start / End | `service/geocoding/1.0/reverse` | `POST` | `src/app/geocode.js` |
| Segment extraction | `service/roadsextractor/1.0` | `POST` | `src/dao/extraction-dao.js` |
| Trip optimisation | `service/routing/1.0` | `POST` | `src/dao/routing-dao.js` |
| Diagnostic comparison | `service/routing/1.0/traceroute` | `POST` | `src/dao/traceroute-dao.js` |
| Vector tiles | `mptiles-api[-X].benomad.net/...` | `GET` | `bemap.MapLibreMap` (SDK) |

Every request uses **Basic auth** (`Authorization: Basic base64(user:pass)`)
with credentials entered in the login modal; tiles get their own token —
the SDK POSTs `/api/login` once at `MapLibreMap` construction and signs
every tile request with `X-Session-Token`.

---

## 1. `acl/1.0/user/details`

Probes the Bemap account. `200` = credentials valid; anything else
(`401` / `403` / network) bounces the user back to the login modal.

```http
GET https://<host>/bgis/service/acl/1.0/user/details
Authorization: Basic <base64(user:pass)>
Accept: application/json
```

---

## 2. `geocoding/1.0/reverse`

Snap-to-road on a map click (v2). Three retries at increasing radii;
the first hit wins.

**Request** (excerpt, see `geocode.js`):

```json
{
  "geoserver": "here",
  "coordinate":   { "lat": 43.7012, "lon": 7.2715 },
  "radius":       50,
  "transportMode": "CAR"
}
```

**What we use**: `items[0].coordinate` (snapped coord) + `items[0].postalAddress`.

---

## 3. `roadsextractor/1.0`

Returns every road segment inside the polygon.

**Request**:

```json
{
  "geoserver": "here",
  "coordinates": [ { "lon": 7.27, "lat": 43.70 }, ... ],
  "transportType": "CAR",
  "adminPath": true,
  "filterElementsHouseNumbers": false,
  "filterClippedElements": true
}
```

**Response**: `roads[]` — each segment carries `coordinate`, `angle`,
`label`, `postalAddress`. The app turns it into a downloadable CSV with
columns `lat, lon, angle, name, country, state, county, city, postalCode,
street, streetNumber`.

---

## 4. `routing/1.0` — main optimisation call

One call per optimisation. Options dictate what comes back.

**Destinations**:

- **Start + End**: `coordinateSat: { lat, lon }` + `keptByMinimalWp:
  true`. No `heading` / `avoidUTurn` / `useStartAngle` (user clicks, no
  reliable road bearing).
- **Middle waypoints**: `coordinateSat: { lat, lon, heading }` +
  `avoidUTurn: 'YES'` + `useStartAngle: 'YES'`. `heading` is the actual
  road angle from the extractor (`road.angle`).

**Server options**:

| Option | Effect |
|---|---|
| `POLYLINE` | Full optimised-trip polyline |
| `OPTIMIZED_TRIP` | Server reorders destinations (`usedOrder`) |
| `WAYPOINTS` | Returns `routingRoutes[0].waypoints[]` |
| `WAYPOINTS_POLYLINE` | Polyline through the waypoints (in addition to `POLYLINE`) |
| `MINIMAL_WAYPOINTS` | Minimal subset of destinations to actually visit |
| `NO_MINIMAL_WAYPOINTS` | Opt out of minimisation (which is default-on when `WAYPOINTS` is requested) |

When the "Minimal waypoints" box is ticked, the app sends:

```js
options: ['POLYLINE', 'OPTIMIZED_TRIP', 'WAYPOINTS',
          'WAYPOINTS_POLYLINE', 'MINIMAL_WAYPOINTS']
```

**Response**:

- `routingRoutes[0].polyline` — full optimised geometry.
- `routingRoutes[0].length` / `.duration` — distance + duration.
- `routingRoutes[0].waypoints[]` — minimal subset. **Watch out**:
  `wp.usedDestinationIndex` is an index into `usedDestinations` AS
  REORDERED BY `usedOrder`, NOT into the original input array
  (`inputOrder`).
- `usedDestinations[]` — for each destination we sent: `inputOrder`
  (position in input array), `usedOrder` (position in optimised trip),
  `matchedCoordinateGps` (snapped coord), `confidence`, `distanceFromRequest`,
  `duration`, `length`, `polylineIndex`.

---

## 5. `routing/1.0/traceroute` — diagnostic only

Reconstructs the path between destinations from the snapped coordinates.
**Not used in the main flow** — exposed via the "Superpose TraceRoute"
button for visual comparison.

Traps if you reach for it:

- Always send `allowOffRoad: false`. Otherwise the server bridges sparse
  fixes with off-road segments.
- Do NOT send `time` or `speed` on the fixes (they push the server into
  physically-realistic mode and you get implied 600 km/h jumps).
- Keep `keptByMinimalWp: true` on the first + last fixes.

---

## 6. Vector tiles (MapLibre + PMTiles)

The app builds `new bemap.MapLibreMap(ctx, 'map', { serviceWorkerPath:
'bemap-sw-tiles.js' })` **after** authentication succeeds — the SDK's
`TilesAuth` POSTs `/api/login` once at construction time and never
retries, so constructing with empty creds silently disables tile auth.

`ctx.tilesHost` per environment:

| Env | `tilesHost` |
|---|---|
| Beta | `mptiles-api-beta.benomad.net` |
| Préprod | `mptiles-api-preprod.benomad.net` |
| Prod | `mptiles-api.benomad.net` |

A Service Worker (`bemap-sw-tiles.js`) caches tiles locally. It MUST be
served at the site root (otherwise its scope is too narrow and caching
is silently OFF).

---

## Credential lifecycle

| Phase | Storage |
|---|---|
| Modal entry | DOM until submit |
| After verify | `sessionStorage` (default) or `localStorage` ("Remember me") |
| Password at rest | Base64-obfuscated (`b64:` prefix). **Not a security mechanism** — Basic Auth still travels on the HTTPS wire. |
| Env switch | `_tilesAuth.logout()` + `localStorage.removeItem(bemap_tiles_token)` + SDK `map.remove()`, then re-mount `MapLibreMap` with the new context. |

---

## In-flight request cancellation

Every long op tracks via `ZO.dao.track(key, xhr)`. Re-triggering the same
action before the previous finishes **cancels** the prior call — no
zombie results painting over the current state.

Keys: `extract`, `optimize`, `traceroute`, `revgeo`, `auth`.
