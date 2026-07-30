# Zone Optimizer — User Guide (EN)

BeNomad web app to **extract road segments inside a zone**, then **optimise
a route** through those points via the Bemap APIs.

---

## 1. Sign in

Login screen on first paint:

1. **Environment** — Beta / Préprod / Prod.
2. **Username** + **Password** — your Bemap credentials.
3. *(Optional)* **Remember me** — stores credentials (obfuscated) in
   `localStorage` instead of `sessionStorage`.

Clicking **Sign in** probes `service/acl/1.0/user/details` with Basic Auth;
only a `200` unlocks the app. Stored credentials are re-verified on every
page load.

---

## 2. Draw a zone

Full-bleed map (MapLibre + PMTiles via BeNomad Tiles). Two options:

- **Draw a polygon** — click to drop vertices, double-click to finish.
  Drag the handles to edit afterwards.
- **Upload CSV** — replay an earlier extraction exactly. No polygon
  required; segments are restored with their active/disabled state
  preserved.

---

## 3. Extract segments

**Extraction options** card:

- **Transport mode** — CAR / TRUCK / BICYCLE / MOTORCYCLE / PEDESTRIAN /
  TAXI / PUBLIC_BUS / EMERGENCY.
- **Only with street number** — drops segments without a house number.
- **Exclude features outside polygon** — clips segments that overflow
  the zone.

Click **Extract segments** → call to `roadsextractor/1.0`. Segments appear
in green. Click any point to **toggle its active/disabled state** (disabled
segments are excluded from optimisation; clicks log the full record to the
console). The **Download CSV** button exports the whole list.

---

## 4. Start and End

Once extraction is done, click on the map:

1. **First click** → start (green).
2. **Second click** → end (red).

Each point is **snap-to-road** automatically via `geocoding/1.0/reverse`
(retry radii: 50 m → 200 m → 800 m). If no road is within reach the marker
is removed and you must click closer to one. A chip shows the verification
result inline.

---

## 5. Optimise

**Route optimisation** card:

- **Minimal waypoints** — optional. When ticked the request carries
  `options: ['POLYLINE', 'OPTIMIZED_TRIP', 'WAYPOINTS', 'WAYPOINTS_POLYLINE',
  'MINIMAL_WAYPOINTS']` and the response includes the minimal subset to
  visit (rendered as rose rings).

Click **Run optimisation** → a single call to `routing/1.0`. The optimised
polyline + numbered waypoints render on the map. Stats tiles show distance,
duration, and minimal-waypoint count.

> A **Superpose TraceRoute** button next to the stats overlays the
> reconstruction polyline from `routing/1.0/traceroute` — diagnostic only.

---

## 6. Animation

**Animation** card:

- **Animate route** — an orange marker walks the polyline.
- **Speed** — slider.
- **Stop animation** — interrupt at any time.

---

## 7. Downloads

**Downloads** card:

- **Download segments + order** — the extraction CSV enriched with an
  `order` column showing each segment's position in the optimised trip.
- **Download minimal waypoints** *(visible only when the "Minimal
  waypoints" box was ticked)* — full CSV **including start + end + middle
  waypoints**, one row each with matched coord (server-snapped), input
  coord (what we sent), angle, road label, full postal address, and
  routing-side metrics.

---

## 8. Shortcuts

- **Clear all (restart)** — wipes polygon, extraction, route, start/end.
  Keeps credentials.
- **Edit** *(Configuration card)* — re-opens the login screen for an env
  or credentials change. The map is automatically rebuilt with the new
  context.

---

## Tips

- The **sticky guide** at the top of the sidebar tracks your progress
  (current step pulses violet). Click the **×** to hide it for good
  (preference persisted in `localStorage`).
- 🇫🇷 / 🇬🇧 in the header swaps the UI language on the fly.
- 🌙 / ☀️ toggles light / dark theme (preference persisted).
- All long Bemap requests (extraction, routing, traceroute, geocoding)
  **cancel the previous request** if you fire a new one before it
  finishes — no zombie results arriving late.
