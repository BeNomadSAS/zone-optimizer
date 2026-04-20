/* ======================================================================
 * UTILITY FUNCTIONS
 *
 * Pure logic: polyline decoding, distance, sampling, error parsing.
 * Distance helpers are PORTED VERBATIM from bfleet/WebContent/js/app/tool.js
 * (getDist, calculateDistanceFromStartForPolyline, convertPolylineToRegular)
 * so logic can flow back and forth between bfleet and zone-optimizer.
 *
 * IMPORTANT: bfleet uses (longitude, latitude) parameter order. We follow
 * that convention here - the small adapter functions at the bottom let
 * callers that use [lat, lon] arrays (animation.js, traceroute.js) stay
 * unchanged.
 * ====================================================================== */

ZO.Utils = {};

/**
 * Decodes a Google encoded polyline string into coordinate array.
 * @param {string} encoded - Google polyline encoded string
 * @returns {Array} [[lat, lon], ...]
 */
ZO.Utils.decodePolyline = function (encoded) {
    var points = [];
    var index = 0, lat = 0, lng = 0;
    while (index < encoded.length) {
        var b, shift = 0, result = 0;
        do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
        lat += ((result & 1) ? ~(result >> 1) : (result >> 1));
        shift = 0; result = 0;
        do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
        lng += ((result & 1) ? ~(result >> 1) : (result >> 1));
        points.push([lat / 1e5, lng / 1e5]);
    }
    return points;
};

/* ======================================================================
 * DISTANCE HELPERS (ported verbatim from bfleet/tool.js)
 * Parameter order is (longitude, latitude) for bfleet compatibility.
 * ====================================================================== */

/**
 * Haversine distance in meters between two (lon, lat) points.
 * Source: bfleet/WebContent/js/app/tool.js:92-117
 * @param {number} x1 - longitude
 * @param {number} y1 - latitude
 * @param {number} x2 - longitude
 * @param {number} y2 - latitude
 * @returns {number} distance in meters
 */
ZO.Utils.getDist = function (x1, y1, x2, y2) {
    if (x1 === x2 && y1 === y2) return 0.0;

    var conversionFact = 3.1415926535897932384626433832795 / 180;
    var EARTH_RADIUS = 6371000;
    var dx = x1 - x2;

    /* Optimization: if dx == 0, simplify to cos a*cos b + sin a*sin b = cos(a-b) */
    if (dx === 0) {
        return EARTH_RADIUS * conversionFact * (y1 > y2 ? (y1 - y2) : (y2 - y1));
    }

    var p1y = conversionFact * y1;
    var p2y = conversionFact * y2;
    var sinDLat2 = Math.sin((p1y - p2y) / 2);
    var sinDLon2 = Math.sin(conversionFact * dx / 2);
    var a = sinDLat2 * sinDLat2 + Math.cos(p1y) * Math.cos(p2y) * sinDLon2 * sinDLon2;

    return 2 * EARTH_RADIUS * Math.asin(Math.sqrt(a));
};

/**
 * Distance in meters between two points expressed as objects with
 * either {longitude, latitude} or {lon, lat}.
 * Source: bfleet/WebContent/js/app/tool.js:142-149
 */
ZO.Utils.getDistFromPoint = function (point1, point2) {
    var lon1 = point1.longitude !== undefined ? point1.longitude : point1.lon;
    var lat1 = point1.latitude  !== undefined ? point1.latitude  : point1.lat;
    var lon2 = point2.longitude !== undefined ? point2.longitude : point2.lon;
    var lat2 = point2.latitude  !== undefined ? point2.latitude  : point2.lat;
    return ZO.Utils.getDist(lon1, lat1, lon2, lat2);
};

/**
 * Walks a polyline of {longitude, latitude} (or {lon, lat}) objects and
 * attaches `distanceFromStart` (meters) on each vertex. Mutates input
 * AND returns it. First point's distanceFromStart = 0.
 * Source: bfleet/WebContent/js/app/tool.js:226-251
 * @param {Array<{longitude:number,latitude:number}>} polyline
 * @returns {Array} the same polyline
 */
ZO.Utils.calculateDistanceFromStartForPolyline = function (polyline) {
    if (!polyline || polyline.length === 0) return polyline;

    var cumulative = 0;
    polyline[0].distanceFromStart = 0;
    for (var i = 1; i < polyline.length; i++) {
        cumulative += ZO.Utils.getDistFromPoint(polyline[i - 1], polyline[i]);
        polyline[i].distanceFromStart = cumulative;
    }
    return polyline;
};

/**
 * Down-samples a polyline to one point per stepInMeter, INTERPOLATING
 * intermediate points so spacing is exact. Each output point includes
 * `polylineIndex` (the source segment it lives on). First and last
 * source points are always preserved.
 * Source: bfleet/WebContent/js/app/tool.js:486-539
 * @param {Array<{longitude:number,latitude:number}|{lon:number,lat:number}>} polyline
 * @param {number} stepInMeter - default 5
 * @returns {Array<{longitude:number, latitude:number, polylineIndex:number}>}
 */
ZO.Utils.convertPolylineToRegular = function (polyline, stepInMeter) {
    if (polyline == null || polyline.length === 0) return [];
    if (!stepInMeter || stepInMeter < 1) stepInMeter = 5;

    var getLon = function (p) { return p.longitude !== undefined ? p.longitude : p.lon; };
    var getLat = function (p) { return p.latitude  !== undefined ? p.latitude  : p.lat; };

    var regular = [];
    var dist = 0, distPrev, curLen = stepInMeter, j = 0;
    var point1 = polyline[0], point2, ratio;

    regular[j++] = {
        longitude: getLon(point1),
        latitude:  getLat(point1),
        polylineIndex: 0
    };

    for (var i = 0; i + 1 < polyline.length; i++) {
        point1 = polyline[i];
        point2 = polyline[i + 1];
        distPrev = dist;
        dist += ZO.Utils.getDistFromPoint(point1, point2);

        if (dist > 0) {
            while (curLen < dist) {
                ratio = (curLen - distPrev) / (dist - distPrev);
                regular[j++] = {
                    longitude: getLon(point1) + ratio * (getLon(point2) - getLon(point1)),
                    latitude:  getLat(point1) + ratio * (getLat(point2) - getLat(point1)),
                    polylineIndex: i
                };
                curLen += stepInMeter;
            }
        }
    }

    var p = polyline.length - 1;
    point1 = polyline[p];
    point2 = regular[j - 1];
    if (getLon(point1) !== point2.longitude || getLat(point1) !== point2.latitude) {
        regular[j] = {
            longitude: getLon(point1),
            latitude:  getLat(point1),
            polylineIndex: p
        };
    }

    return regular;
};

/* ======================================================================
 * SEGMENT DISTANCE (kept locally - bfleet has no equivalent)
 * Used by computePolylineMatch only.
 * ====================================================================== */

/**
 * Distance in meters between a point and a segment [A, B] (orthogonal projection).
 * Local Cartesian approximation - acceptable for short segments (<1km).
 * @param {Array} p - [lat, lon]
 * @param {Array} a - [lat, lon]
 * @param {Array} b - [lat, lon]
 * @returns {number} distance in meters
 */
ZO.Utils.distPointToSegment = function (p, a, b) {
    var R = 6371000;
    var toRad = function (x) { return x * Math.PI / 180; };
    var cosLat = Math.cos(toRad(p[0]));
    var px = (p[1] - a[1]) * cosLat * R * Math.PI / 180;
    var py = (p[0] - a[0]) * R * Math.PI / 180;
    var ax = 0, ay = 0;
    var bx = (b[1] - a[1]) * cosLat * R * Math.PI / 180;
    var by = (b[0] - a[0]) * R * Math.PI / 180;

    var dx = bx - ax, dy = by - ay;
    var lenSq = dx * dx + dy * dy;
    var t = lenSq > 0 ? ((px - ax) * dx + (py - ay) * dy) / lenSq : 0;
    t = Math.max(0, Math.min(1, t));
    var projX = ax + t * dx, projY = ay + t * dy;
    var ex = px - projX, ey = py - projY;
    return Math.sqrt(ex * ex + ey * ey);
};

/**
 * Minimum distance between a point and a polyline.
 * @param {Array} p - [lat, lon]
 * @param {Array} coords - [[lat, lon], ...]
 * @returns {number} meters (Infinity for empty/single-point polyline)
 */
ZO.Utils.distPointToPolyline = function (p, coords) {
    if (!coords || coords.length < 2) return Infinity;
    var minDist = Infinity;
    for (var i = 0; i < coords.length - 1; i++) {
        var d = ZO.Utils.distPointToSegment(p, coords[i], coords[i + 1]);
        if (d < minDist) minDist = d;
    }
    return minDist;
};

/**
 * Compares two polylines and returns a match index.
 * Samples the reference polyline every 10m and measures distance to target.
 * @param {Array} refCoords - [[lat, lon], ...]
 * @param {Array} targetCoords - [[lat, lon], ...]
 * @returns {{ score: number, avgDist: number, maxDist: number, pctUnder10m: number }}
 */
ZO.Utils.computePolylineMatch = function (refCoords, targetCoords) {
    var samplePoints = [refCoords[0]];
    var acc = 0;
    for (var i = 1; i < refCoords.length; i++) {
        /* getDist takes (lon, lat) */
        acc += ZO.Utils.getDist(
            refCoords[i - 1][1], refCoords[i - 1][0],
            refCoords[i][1],     refCoords[i][0]);
        if (acc >= 10) {
            samplePoints.push(refCoords[i]);
            acc = 0;
        }
    }

    var distances = samplePoints.map(function (p) { return ZO.Utils.distPointToPolyline(p, targetCoords); });
    var avgDist = distances.reduce(function (s, d) { return s + d; }, 0) / distances.length;
    var maxDist = Math.max.apply(null, distances);
    var under10m = distances.filter(function (d) { return d < 10; }).length;
    var pctUnder10m = (under10m / distances.length) * 100;
    var under20m = distances.filter(function (d) { return d < 20; }).length;
    var score = (under20m / distances.length) * 100;

    return { score: score, avgDist: avgDist, maxDist: maxDist, pctUnder10m: pctUnder10m };
};

/* ======================================================================
 * THIN ADAPTERS for [lat, lon] arrays
 * Animation.js and traceroute.js use [[lat, lon]] arrays. Rather than
 * rewrite them, we provide adapters around the bfleet helpers.
 * ====================================================================== */

/**
 * Returns parallel cumulative-distances array for a [[lat, lon]] polyline.
 * Equivalent to bfleet's calculateDistanceFromStartForPolyline but
 * (a) doesn't mutate the input and (b) returns a separate distances array.
 * Used by animation.js.
 * @param {Array} coords - [[lat, lon], ...]
 * @returns {number[]} cumulative meters, length === coords.length
 */
ZO.Utils.cumulativeDistances = function (coords) {
    var dists = [0];
    for (var i = 1; i < coords.length; i++) {
        dists.push(dists[i - 1] + ZO.Utils.getDist(
            coords[i - 1][1], coords[i - 1][0],
            coords[i][1],     coords[i][0]));
    }
    return dists;
};

/**
 * Interpolates a position on a polyline at a given distance.
 * Safe on empty/single-point polylines and zero-total-distance.
 * @param {Array} coords - [[lat, lon], ...]
 * @param {number[]} cumDist - parallel array of cumulative meters
 * @param {number} dist - target distance in meters
 * @returns {[number, number]} [lat, lon]
 */
ZO.Utils.interpolateAtDistance = function (coords, cumDist, dist) {
    if (!coords || coords.length === 0) return [0, 0];
    if (coords.length === 1) return [coords[0][0], coords[0][1]];
    var totalDist = cumDist[cumDist.length - 1];
    if (!isFinite(totalDist) || totalDist <= 0) return [coords[0][0], coords[0][1]];
    /* Wrap into [0, totalDist) - handles negative values too */
    dist = ((dist % totalDist) + totalDist) % totalDist;
    for (var i = 1; i < cumDist.length; i++) {
        if (cumDist[i] >= dist) {
            var segLen = cumDist[i] - cumDist[i - 1];
            var ratio = segLen > 0 ? (dist - cumDist[i - 1]) / segLen : 0;
            return [
                coords[i - 1][0] + ratio * (coords[i][0] - coords[i - 1][0]),
                coords[i - 1][1] + ratio * (coords[i][1] - coords[i - 1][1])
            ];
        }
    }
    return [coords[coords.length - 1][0], coords[coords.length - 1][1]];
};

/**
 * Adapter: takes a [[lat, lon]] polyline + step in meters, returns
 * [[lat, lon]] sampled. Internally calls bfleet's convertPolylineToRegular
 * (which interpolates). Drop-in replacement for the old samplePolyline.
 * @param {Array} coords - [[lat, lon], ...]
 * @param {number} stepInMeter
 * @returns {Array} [[lat, lon], ...]
 */
ZO.Utils.samplePolyline = function (coords, stepInMeter) {
    if (!coords || coords.length === 0) return [];
    if (coords.length === 1) return [coords[0]];
    /* Convert to {lon, lat} objects for bfleet's helper */
    var asObjs = coords.map(function (c) { return { latitude: c[0], longitude: c[1] }; });
    var regular = ZO.Utils.convertPolylineToRegular(asObjs, stepInMeter);
    return regular.map(function (p) { return [p.latitude, p.longitude]; });
};

/* ======================================================================
 * CSV + DOWNLOAD HELPERS
 * ====================================================================== */

/**
 * Escapes a CSV value (handles commas and quotes).
 * @param {*} v
 * @returns {string}
 */
ZO.Utils.escapeCsv = function (v) {
    v = String(v || '').replace(/"/g, '""');
    return (v.indexOf(',') !== -1 || v.indexOf('"') !== -1) ? '"' + v + '"' : v;
};

/**
 * Triggers a CSV file download.
 * @param {string} content
 * @param {string} filename
 */
ZO.Utils.downloadCsv = function (content, filename) {
    var blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
};

/**
 * Inserts a local-time ISO-like timestamp before the file extension so that
 * repeated downloads don't overwrite each other.
 * Example: `timestampedFilename('segments.csv')` -> `segments_2026-04-15_14-32-09.csv`
 * Falsy or extension-less input still gets a timestamp suffix.
 * @param {string} filename - base name (with or without extension)
 * @returns {string}
 */
ZO.Utils.timestampedFilename = function (filename) {
    var d = new Date();
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    var ts = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
             '_' + pad(d.getHours()) + '-' + pad(d.getMinutes()) + '-' + pad(d.getSeconds());
    var name = String(filename || 'download');
    var dot = name.lastIndexOf('.');
    if (dot > 0) {
        return name.slice(0, dot) + '_' + ts + name.slice(dot);
    }
    return name + '_' + ts;
};

/* ======================================================================
 * ERROR PARSING
 * ====================================================================== */

/**
 * Extracts a user-readable error message from a failed bemap.ajax response.
 * @param {XMLHttpRequest} xhr
 * @param {string} response
 * @returns {string}
 */
ZO.Utils.parseApiError = function (xhr, response) {
    if (xhr && xhr.status === 0)   return 'R\u00e9seau indisponible ou requ\u00eate annul\u00e9e.';
    if (xhr && xhr.status === 401) return 'Identifiants Bemap invalides (401).';
    if (xhr && xhr.status === 403) return 'Acc\u00e8s refus\u00e9 (403).';
    if (xhr && xhr.status === 404) return 'Service introuvable (404).';
    if (xhr && xhr.status >= 500)  return 'Erreur serveur (' + xhr.status + ').';
    if (response) {
        try {
            var j = JSON.parse(response);
            if (j && j.message) return String(j.message);
            if (j && j.error)   return String(j.error);
        } catch (e) { /* not JSON, fall through */ }
        if (typeof response === 'string' && response.length > 0 && response.length < 300) {
            return response;
        }
    }
    return 'Erreur (' + (xhr && xhr.status ? xhr.status : 'inconnue') + ').';
};
