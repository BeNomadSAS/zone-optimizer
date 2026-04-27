/* ======================================================================
 * ZONE OPTIMIZER - Central Application Object
 *
 * Global namespace and shared state. 100% bemap-js-api (no raw Leaflet).
 * Pattern follows evmove5/js/app/evmove.js
 * ====================================================================== */

var ZO = {

    /** Application version (must match package.json) */
    version: '1.4.0',

    /* --- Shared application state --- */
    state: {
        currentPolygon: null,           // [{lat, lon}, ...] plain array (for extraction payload)
        currentBemapPolygon: null,      // bemap.Polygon instance
        csvData: null,                  // CSV content ready to download
        extractedPoints: [],            // extracted points for route optimization
        startPoint: null,               // route start {lat, lon}
        endPoint: null,                 // route end {lat, lon}
        startMarker: null,              // bemap.Marker for start
        endMarker: null,                // bemap.Marker for end
        clickMode: 'start',             // 'start', 'end' or null
        routeCoords: [],                // [[lat, lon], ...] route polyline
        orderedPoints: [],              // ordered waypoints after optimization
        traceRouteCoords: [],           // [[lat, lon], ...] traceroute polyline
        usedOrderByInputIndex: null,    // {inputOrder: usedOrder} from routing API
        animationInterval: null,        // animation timer reference
        _suppressMapClick: false        // set briefly when a marker is clicked
    },

    /* --- bemap.Context reference --- */
    _context: null,

    /**
     * Returns the current bemap.Context.
     * @returns {bemap.Context}
     */
    getContext: function () {
        return this._context;
    },

    /**
     * Sets the bemap.Context (called after config change).
     * @param {bemap.Context} ctx
     */
    setContext: function (ctx) {
        this._context = ctx;
    },

    /* --- bemap.LeafletMap reference --- */
    _map: null,

    /**
     * Returns the bemap.LeafletMap instance.
     * @returns {bemap.LeafletMap}
     */
    getMap: function () {
        return this._map;
    }
};
