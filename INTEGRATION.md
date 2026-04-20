# Bemap Road Extractor — Note d'integration

Demonstrateur web pour les APIs Bemap : extraction de segments routiers dans une zone polygonale, puis optimisation d'un itineraire entre ces points.

## Architecture

```
zone-optimizer/
  index.html                  (HTML - structure de page)
  css/
    app.css                   (styles de l'application)
  js/
    app/
      zone-optimizer.js       (namespace central ZO + etat partage)
      config.js               (bemap.Context + environments + modale)
      map.js                  (bemap.LeafletMap, couches)
      polygon-edit.js         (Leaflet.Draw + edition sommets)
      extraction.js           (UI extraction + affichage points)
      routing.js              (UI optimisation de route)
      traceroute.js           (calcul TraceRoute + comparaison polylines)
      animation.js            (animation parallele des parcours)
      points-list.js          (liste des waypoints)
      utils.js                (fonctions utilitaires pures)
    dao/
      dao.js                  (base AJAX + getBasicAuth)
      extraction-dao.js       (appel API roadsextractor)
      routing-dao.js          (appel API routing)
      traceroute-dao.js       (appel API traceroute)
  lib/
    bemap-js-api/             (copie de bemap-js-api/dist/)
    jquery/                   (jQuery 3.4.1)
```

**Stack technique :**
- **bemap-js-api** : carte (LeafletMap, BemapLayer, VectorLayer), geometries
- **jQuery 3.4.1** : manipulation DOM
- **Leaflet.Draw** : dessin de polygones (CDN, a integrer dans bemap-js-api)
- **bemap.ajax** : appels API directs (pattern DAO comme evmove5)

## Appels API

Les appels passent directement par `bemap.ajax()` avec Basic Auth (pas de proxy CORS).

| Usage | Endpoint | Methode | Auth |
|-------|----------|---------|------|
| Fond de carte | bemap.BemapLayer (via bemap.Context) | GET | appid/appcode |
| Roads Extractor | `/service/roadsextractor/1.0` | POST JSON | Basic Auth |
| Routing | `/service/routing/1.0` | POST JSON | Basic Auth |
| TraceRoute | `/service/routing/1.0/traceroute` | POST JSON | Basic Auth |

## Environnements

| Environnement | Host | Base URL |
|---------------|------|----------|
| Beta | `bemap-beta.benomad.com` | `https://bemap-beta.benomad.com/bgis` |
| Preprod | `bemap-preprod.benomad.com` | `https://bemap-preprod.benomad.com/bgis` |
| Prod | `bemap.benomad.com` | `https://bemap.benomad.com/bgis` |

## Demarrage

Ouvrir `index.html` avec VS Code Live Server (ou tout serveur HTTP statique).

## Flux utilisateur

1. **Configuration** : modale au premier lancement. Choix de l'environnement + identifiants. Stockes en `localStorage`.
2. **Dessin polygone** : Leaflet.Draw. Sommets editables (drag, fusion, suppression, insertion).
3. **Extraction** : appel `roadsextractor` → points (lat/lon/angle) + adresse postale. CSV telechargeable.
4. **Routing** (optionnel) : clic sur la carte pour definir depart/arrivee. Appel `routing` avec `OPTIMIZED_TRIP`.
5. **Waypoints minimaux** (optionnel) : appel `traceroute` pour obtenir le set minimal de waypoints. Indice de match entre les deux polylines.
6. **Animation** : deux marqueurs (violet=routing, rouge=traceroute) a vitesse identique.
