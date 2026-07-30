# Zone Optimizer — Doc API (FR)

Cartographie des appels Bemap utilisés par l'application.

| Étape de l'app | Endpoint Bemap | Méthode | Module client |
|---|---|---|---|
| Connexion (gate d'authentification) | `service/acl/1.0/user/details` | `GET` | `src/app/auth.js` |
| Snap-to-road sur Start / End | `service/geocoding/1.0/reverse` | `POST` | `src/app/geocode.js` |
| Extraction des segments | `service/roadsextractor/1.0` | `POST` | `src/dao/extraction-dao.js` |
| Optimisation de tournée | `service/routing/1.0` | `POST` | `src/dao/routing-dao.js` |
| Comparaison diagnostique | `service/routing/1.0/traceroute` | `POST` | `src/dao/traceroute-dao.js` |
| Tuiles vectorielles | `mptiles-api[-X].benomad.net/...` | `GET` | `bemap.MapLibreMap` (SDK) |

Toutes les requêtes utilisent l'authentification **Basic** (`Authorization:
Basic base64(user:pass)`) avec les identifiants saisis dans le formulaire
de connexion ; pour les tuiles le SDK pose un POST `/api/login` au
démarrage du `MapLibreMap` et signe ensuite chaque tuile avec un
`X-Session-Token`.

---

## 1. `acl/1.0/user/details`

Sonde le compte Bemap. Réponse `200` = identifiants valides, sinon
rejet (`401` / `403` / réseau).

```http
GET https://<host>/bgis/service/acl/1.0/user/details
Authorization: Basic <base64(user:pass)>
Accept: application/json
```

---

## 2. `geocoding/1.0/reverse`

Snap-to-road d'un clic carte (v2). Trois tentatives successives à des
rayons croissants ; premier hit garde le segment.

**Requête** (extrait, voir `geocode.js`) :

```json
{
  "geoserver": "here",
  "coordinate":   { "lat": 43.7012, "lon": 7.2715 },
  "radius":       50,
  "transportMode": "CAR"
}
```

**Réponse utile** : `items[0].coordinate` (coord snappée) + `items[0].postalAddress`.

---

## 3. `roadsextractor/1.0`

Extrait tous les segments routiers à l'intérieur du polygone.

**Requête** :

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

**Réponse** : `roads[]` — pour chaque segment, `coordinate`, `angle`,
`label`, `postalAddress`. L'application convertit ça en CSV téléchargeable
avec, par ligne : `lat, lon, angle, name, country, state, county, city,
postalCode, street, streetNumber`.

---

## 4. `routing/1.0` — appel principal d'optimisation

Un seul appel par tournée. Les options déterminent ce que la réponse
contient.

**Destinations** :

- **Départ + Arrivée** : `coordinateSat: { lat, lon }` + `keptByMinimalWp:
  true`. Pas de `heading` / `avoidUTurn` / `useStartAngle` (ce sont des
  clics utilisateur sans angle de voirie fiable).
- **Waypoints intermédiaires** : `coordinateSat: { lat, lon, heading }` +
  `avoidUTurn: 'YES'` + `useStartAngle: 'YES'`. `heading` est l'angle
  réel du segment renvoyé par l'extracteur (`road.angle`).

**Options serveur** :

| Option | Effet |
|---|---|
| `POLYLINE` | Polyligne complète du trajet optimisé |
| `OPTIMIZED_TRIP` | Le serveur réordonne les destinations (`usedOrder`) |
| `WAYPOINTS` | Renvoie `routingRoutes[0].waypoints[]` |
| `WAYPOINTS_POLYLINE` | Polyligne passant par les waypoints (en plus de `POLYLINE`) |
| `MINIMAL_WAYPOINTS` | Sous-ensemble minimal des destinations à visiter |
| `NO_MINIMAL_WAYPOINTS` | Désactive la minimisation (par défaut active quand `WAYPOINTS` est demandé) |

Quand la case "Waypoints minimaux" est cochée, l'app envoie :

```js
options: ['POLYLINE', 'OPTIMIZED_TRIP', 'WAYPOINTS',
          'WAYPOINTS_POLYLINE', 'MINIMAL_WAYPOINTS']
```

**Réponse** :

- `routingRoutes[0].polyline` — tracé optimisé complet.
- `routingRoutes[0].length` / `.duration` — distance + durée.
- `routingRoutes[0].waypoints[]` — sous-ensemble minimal. **Attention** :
  `wp.usedDestinationIndex` est un index dans `usedDestinations` **réordonné
  par `usedOrder`**, PAS dans le tableau d'entrée original (`inputOrder`).
- `usedDestinations[]` — pour chaque destination envoyée : `inputOrder`
  (position dans le tableau d'entrée), `usedOrder` (position dans la
  tournée optimisée), `matchedCoordinateGps` (point snappé), `confidence`,
  `distanceFromRequest`, `duration`, `length`, `polylineIndex`.

---

## 5. `routing/1.0/traceroute` — diagnostic uniquement

Reconstruit le tracé entre les destinations à partir des coordonnées
snappées. **Pas utilisé dans le flow principal** — exposé via le bouton
"Superposer TraceRoute" pour comparaison visuelle.

Pièges si vous l'utilisez :

- Toujours envoyer `allowOffRoad: false` sinon le serveur ponte les fixes
  espacés par des segments hors-voirie.
- Ne PAS envoyer de `time` ni de `speed` (ils provoquent des sauts
  hors-route à vitesse implicite).
- Garder `keptByMinimalWp: true` sur le premier + dernier fix.

---

## 6. Tuiles vectorielles (MapLibre + PMTiles)

L'app instancie `new bemap.MapLibreMap(ctx, 'map', { serviceWorkerPath:
'bemap-sw-tiles.js' })` **après** une authentification réussie (le
`TilesAuth` du SDK fait son `/api/login` une seule fois à la construction
— construire avec des identifiants vides échoue silencieusement et n'est
jamais retenté).

`ctx.tilesHost` est calculé en fonction de l'environnement :

| Environnement | `tilesHost` |
|---|---|
| Beta | `mptiles-api-beta.benomad.net` |
| Préprod | `mptiles-api-preprod.benomad.net` |
| Prod | `mptiles-api.benomad.net` |

Un Service Worker (`bemap-sw-tiles.js`) sert de cache local. Il doit être
servi depuis la racine du site (sinon son scope est trop restreint et le
cache est silencieusement désactivé).

---

## Cycle d'identifiants

| Phase | Stockage |
|---|---|
| Saisie modal | DOM jusqu'à validation |
| Après validation | `sessionStorage` (par défaut) ou `localStorage` ("Se souvenir") |
| Mot de passe au repos | Obfusqué via base64 (préfixe `b64:`). **Pas un mécanisme de sécurité** — vérité ultime sur le wire HTTPS. |
| Changement d'env | `_tilesAuth.logout()` + `localStorage.removeItem(bemap_tiles_token)` + `map.remove()` puis re-mount du `MapLibreMap` avec le nouveau contexte. |

---

## Annulation des requêtes en vol

Chaque opération longue est trackée via `ZO.dao.track(key, xhr)`. Relancer
la même action avant la fin de la précédente la **cancel** automatiquement
— pas de résultats fantômes qui peignent par-dessus l'état courant.

Keys : `extract`, `optimize`, `traceroute`, `revgeo`, `auth`.
