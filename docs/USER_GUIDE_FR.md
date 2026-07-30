# Zone Optimizer — Guide utilisateur (FR)

Application web BeNomad pour **extraire les segments routiers d'une zone**
puis **optimiser une tournée** à travers ces points avec les APIs Bemap.

---

## 1. Connexion

Au démarrage l'écran de connexion s'affiche :

1. **Environnement** — sélectionnez Beta / Préprod / Prod.
2. **Identifiant** + **Mot de passe** — vos identifiants Bemap habituels.
3. *(Optionnel)* **Se souvenir** — stocke les identifiants (obfusqués) dans
   `localStorage` plutôt que `sessionStorage`.

Le bouton **Valider** sonde `service/acl/1.0/user/details` en Basic Auth ;
seul un `200` débloque l'application. À chaque rechargement les identifiants
stockés sont re-vérifiés.

---

## 2. Tracer une zone

Carte plein écran (MapLibre + PMTiles BeNomad). Deux options :

- **Dessiner un polygone** — cliquez pour poser chaque sommet, double-clic
  pour terminer. Glissez les poignées pour éditer après coup.
- **Importer un CSV** — rejouez exactement la même extraction qu'une session
  précédente. Le polygone n'est pas nécessaire ; les segments sont restaurés
  tels quels avec leur état actif/désactivé.

---

## 3. Extraction des segments

Carte **Options d'extraction** :

- **Mode de transport** — CAR / TRUCK / BICYCLE / MOTORCYCLE / PEDESTRIAN /
  TAXI / PUBLIC_BUS / EMERGENCY.
- **Seulement avec n° de rue** — filtre les segments qui ne portent pas de
  numéro de voirie.
- **Exclure éléments hors polygone** — coupe net les segments qui dépassent
  la zone.

Cliquez sur **Extraire les segments** → appel à `roadsextractor/1.0`. Les
segments apparaissent en vert sur la carte. Chaque clic sur un point
**bascule son état actif/désactivé** (les segments désactivés sont exclus
de l'optimisation, console.log à chaque clic). Le bouton
**Télécharger CSV** exporte la liste complète.

---

## 4. Départ et arrivée

Une fois l'extraction terminée, cliquez sur la carte :

1. **Premier clic** → départ (vert).
2. **Second clic** → arrivée (rouge).

Chaque point est **snap-to-road** automatiquement via `geocoding/1.0/reverse`
(rayons d'essai successifs : 50 m → 200 m → 800 m). Si aucune voirie n'est
trouvée, le marqueur est retiré et il faut recliquer plus près d'une route.
Une chip affiche le résultat de la vérification.

---

## 5. Optimisation

Carte **Optimisation de route** :

- **Waypoints minimaux** — coche optionnelle. Activée, la requête contient
  `options: ['POLYLINE', 'OPTIMIZED_TRIP', 'WAYPOINTS', 'WAYPOINTS_POLYLINE',
  'MINIMAL_WAYPOINTS']` et la réponse inclut le sous-ensemble minimal des
  segments à visiter (affichés en cerceaux roses).

Cliquez sur **Lancer l'optimisation** → un seul appel à `routing/1.0`. La
polyligne optimisée + les waypoints numérotés s'affichent. La grille de
stats donne distance / durée / nombre de waypoints minimaux.

> Un bouton **Superposer TraceRoute** apparaît à côté pour comparer le
> tracé optimisé avec le tracé reconstruit par `routing/1.0/traceroute`
> (usage diagnostique uniquement).

---

## 6. Animation

Carte **Animation** :

- **Animer le parcours** — un marqueur orange parcourt la polyligne.
- **Vitesse** — slider de réglage.
- **Stop animation** — interrompt à tout moment.

---

## 7. Téléchargements

Carte **Téléchargements** :

- **Télécharger segments + ordre** — le CSV d'extraction enrichi d'une
  colonne `order` indiquant la position dans la tournée optimisée.
- **Télécharger waypoints minimaux** *(visible uniquement si la case
  "Waypoints minimaux" était cochée)* — CSV complet **incluant départ +
  arrivée + waypoints intermédiaires** avec, par ligne, le matched coord
  (snappé par le serveur), le input coord (envoyé), l'angle, le libellé
  de voirie, l'adresse postale complète et les métriques routing.

---

## 8. Raccourcis

- **Tout effacer (recommencer)** — efface polygone, extraction, route,
  start/end. Conserve les identifiants.
- **Modifier** *(carte Configuration)* — ré-ouvre la fenêtre de connexion
  pour changer d'environnement ou d'identifiants. La carte est remontée
  automatiquement avec le nouveau contexte.

---

## Astuces

- Le **guide latéral** au sommet du panneau suit votre progression
  (étape courante en violet pulsé). Cliquez sur **×** pour le masquer
  définitivement (préférence persistée dans `localStorage`).
- 🇫🇷 / 🇬🇧 dans l'en-tête bascule la langue à chaud.
- 🌙 / ☀️ bascule entre thème clair et sombre (préférence persistée).
- Toutes les requêtes Bemap longues (extraction, optimisation, traceroute,
  géocodage) **annulent la requête précédente** si vous relancez avant la
  fin — pas de résultats fantômes qui arrivent après coup.
