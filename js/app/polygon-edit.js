/* ======================================================================
 * POLYGON EDITING
 *
 * 100% bemap-js-api. Sidebar button triggers bemap.LeafletMap.drawPolygon
 * which (with leaflet.draw.js loaded) uses L.Draw.Polygon for smooth
 * rubber-band drawing. On finalize (double-click), bemap automatically
 * wires editPolygon() for vertex drag / merge / delete / edge-insert.
 *
 * All visibility is centralized in ZO.UI.refresh() - this module only
 * mutates state.
 * ====================================================================== */

ZO.Polygon = {};

/**
 * Clears all extraction and routing results + start/end markers.
 * Called when polygon geometry changes after downstream work was done.
 * Also cancels any in-flight API calls so stale results don't paint.
 */
ZO.Polygon.clearAllResults = function () {
    if (ZO.dao && ZO.dao.cancel) {
        ZO.dao.cancel('extract');
        ZO.dao.cancel('optimize');
        ZO.dao.cancel('traceroute');
    }
    ZO.Map.clear('points');
    ZO.Map.clear('routing');
    ZO.Map.clear('traceroute');
    ZO.Map.clear('startEnd');
    ZO.Map.clear('animation');

    ZO.state.csvData = null;
    ZO.state.extractedPoints = [];
    ZO.state.startPoint = null;
    ZO.state.endPoint = null;
    ZO.state.startMarker = null;
    ZO.state.endMarker = null;
    ZO.state.clickMode = 'start';
    ZO.state.routeCoords = [];
    ZO.state.orderedPoints = [];
    ZO.state.traceRouteCoords = [];
    ZO.state.usedOrderByInputIndex = null;

    /* Clear status/stats text (content, not visibility) */
    $('#extract-stats').html('');
    $('#extract-status').text('').attr('class', 'status');
    $('#start-info').html('D\u00e9part: <em>cliquez sur la carte</em>');
    $('#end-info').html('Arriv\u00e9e: <em>cliquez sur la carte</em>');
    $('#route-stats').html('');
    $('#optimize-status').text('');
    $('#points-list').html('');

    if (ZO.UI) ZO.UI.refresh();
};

/**
 * Updates the sidebar bbox info panel from the current bemap.Polygon.
 */
ZO.Polygon.updateBboxInfo = function () {
    var poly = ZO.state.currentBemapPolygon;
    if (!poly || !poly.coords || poly.coords.length === 0) {
        $('#bbox-info').html('<em>Cliquez le bouton puis cliquez sur la carte. Double-clic pour terminer.</em>');
        return;
    }
    var lats = poly.coords.map(function (c) { return c.getLat(); });
    var lons = poly.coords.map(function (c) { return c.getLon(); });
    var n = poly.coords.length;
    $('#bbox-info').html(
        '<div>Polygone: ' + n + ' points</div>' +
        '<div>N: ' + Math.max.apply(null, lats).toFixed(5) +
              ', S: ' + Math.min.apply(null, lats).toFixed(5) + '</div>' +
        '<div>E: ' + Math.max.apply(null, lons).toFixed(5) +
              ', O: ' + Math.min.apply(null, lons).toFixed(5) + '</div>'
    );
};

/**
 * Draw event callback. Called by bemap ONCE on draw finalize AND on
 * every subsequent edit (vertex drag, right-click delete, merge,
 * middle-handle insert, edge-click insert) because bemap auto-wires
 * editPolygon() after draw when options.editable !== false.
 * @param {bemap.MapEvent} mapEvent - { bemapObject: bemap.Polygon }
 */
ZO.Polygon.onDrawEnd = function (mapEvent) {
    var shape = mapEvent.bemapObject;
    if (!shape || !bemap.inheritsof(shape, bemap.Polygon)) return;

    var hadDownstream = ZO.state.csvData || ZO.state.extractedPoints.length > 0;

    ZO.state.currentBemapPolygon = shape;
    ZO.state.currentPolygon = shape.coords.map(function (c) {
        return { lat: c.getLat(), lon: c.getLon() };
    });

    ZO.Polygon.updateBboxInfo();

    /* Geometry changed -> invalidate any previous extraction/routing */
    if (hadDownstream) {
        ZO.Polygon.clearAllResults();
    } else {
        if (ZO.UI) ZO.UI.refresh();
    }
};

/**
 * Starts polygon drawing. Triggered by the sidebar button.
 * Mirrors bemap-js-api/src/bemap-map.js:989 (Polygon toolbar button internals).
 */
ZO.Polygon.startDraw = function () {
    /* Clean up any previously drawn polygon */
    var prev = ZO.state.currentBemapPolygon;
    if (prev) {
        if (prev._vertexHandlesLayer) {
            ZO._map.native.removeLayer(prev._vertexHandlesLayer);
            prev._vertexHandlesLayer = null;
        }
        if (prev._editClickHandler && prev.native) {
            prev.native.off('click', prev._editClickHandler);
            prev._editClickHandler = null;
        }
        ZO._map.removePolygon(prev);
        ZO.state.currentBemapPolygon = null;
        ZO.state.currentPolygon = null;
    }

    /* Reset bbox panel */
    $('#bbox-info').html('<em>Cliquez sur la carte pour d\u00e9finir les sommets. Double-clic pour terminer.</em>');

    /* Downstream sections hide while drawing is in progress */
    if (ZO.UI) ZO.UI.refresh();

    /* Launch the draw. editable:true auto-wires editPolygon after finalize. */
    ZO._map.drawPolygon({ editable: true }, ZO.Polygon.onDrawEnd);
};

/**
 * Initializes the polygon feature. Binds the sidebar button.
 */
ZO.Polygon.init = function () {
    $('#draw-polygon-btn').on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        ZO.Polygon.startDraw();
    });
};
