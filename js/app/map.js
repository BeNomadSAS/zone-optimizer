/* ======================================================================
 * MAP INITIALIZATION
 *
 * 100% bemap.LeafletMap - no raw Leaflet.
 * Creates named VectorLayers for each feature group.
 * ====================================================================== */

ZO.Map = {};

/** Named VectorLayers (populated in init). */
ZO.Map.layers = {
    points:     null,
    routing:    null,
    traceroute: null,
    startEnd:   null,
    animation:  null
};

/** Base WMS layer reference (bemap.BemapLayer). */
ZO.Map._baseLayer = null;

/** Single shared popup for marker tooltips. */
ZO.Map._sharedPopup = null;

/**
 * Initializes the map. Called once at app startup.
 * Creates a bemap.LeafletMap with a context (possibly empty creds),
 * and five named VectorLayers. The WMS base layer is added/rebuilt
 * separately via rebuildBaseLayer().
 */
ZO.Map.init = function () {
    /* Always build a valid context (even empty) — required by bemap.LeafletMap */
    var context = ZO.Config.buildContext();
    ZO.setContext(context);

    /* Create the map */
    ZO._map = new bemap.LeafletMap(context, 'map');
    ZO._map.move(7.25, 43.7, 13); // lon, lat, zoom (Nice)

    /* Create a HIGH-z-index pane just for animation markers.
     * Leaflet's default markerPane sits at z-index 600 and sorts markers by
     * latitude (southern markers on top). That means a numbered routing
     * waypoint at a low latitude can cover the animation marker even though
     * the animation VectorLayer is added last. Putting animation markers in
     * their own pane (z-index 700) defeats the latitude-sort rule and keeps
     * them on top of everything else. */
    ZO._map.native.createPane('zoAnimationPane');
    ZO._map.native.getPane('zoAnimationPane').style.zIndex = 700;

    /* Create named overlay VectorLayers */
    var layerNames = ['points', 'routing', 'traceroute', 'startEnd', 'animation'];
    $.each(layerNames, function (i, name) {
        var vl = new bemap.VectorLayer({ name: name });
        ZO._map.addLayer(vl);
        ZO.Map.layers[name] = vl;
    });

    /* Add base WMS layer if credentials exist */
    ZO.Map.rebuildBaseLayer();
};

/**
 * Promotes a marker that has just been added to the animation VectorLayer
 * onto the high-z-index `zoAnimationPane` so it draws above all other
 * markers regardless of their latitude. Leaflet's default markerPane sorts
 * by latitude; a separate pane bypasses that rule entirely.
 *
 * Call this immediately after `ZO._map.addMarker(marker, { layer: animation })`.
 *
 * @param {bemap.Marker} marker - bemap marker that was just added
 */
ZO.Map.promoteAnimationMarker = function (marker) {
    if (!marker || !marker.native) return;
    var nativeMarker = marker.native;
    /* Re-assign the pane and force re-render */
    nativeMarker.options.pane = 'zoAnimationPane';
    var el = nativeMarker.getElement && nativeMarker.getElement();
    if (el) {
        var pane = ZO._map.native.getPane('zoAnimationPane');
        if (pane) pane.appendChild(el);
    }
};

/**
 * Rebuilds the base WMS layer with current credentials.
 * Called on startup and after credential save.
 * Overlays (points, routing, ...) are preserved.
 */
ZO.Map.rebuildBaseLayer = function () {
    /* Rebuild context so bemap.BemapLayer picks up new credentials */
    var context = ZO.Config.buildContext();
    ZO.setContext(context);
    ZO._map.ctx = context;

    /* Remove old base layer if present */
    if (ZO.Map._baseLayer) {
        ZO._map.removeLayer(ZO.Map._baseLayer);
        ZO.Map._baseLayer = null;
    }

    var c = ZO.Config.getCreds();
    if (!c.env || !c.user || !c.pass) return;

    /* Add new BemapLayer - credentials come from ctx.login/password */
    ZO.Map._baseLayer = new bemap.BemapLayer({
        name: 'background',
        styles: ''
    });
    ZO._map.addLayer(ZO.Map._baseLayer);
};

/**
 * Clears all features from a named VectorLayer.
 * @param {string} name - one of the keys in ZO.Map.layers
 */
ZO.Map.clear = function (name) {
    var layer = ZO.Map.layers[name];
    if (layer) ZO._map.clearLayer(layer);
};

/**
 * Shows a popup at the clicked marker's coordinate with its tooltip info.
 * Called from marker click handlers. Uses a single shared bemap.Popup
 * that is moved around instead of creating a new one each time.
 * @param {bemap.MapEvent} mapEvent
 */
ZO.Map.showTooltip = function (mapEvent) {
    var obj = mapEvent.bemapObject;
    if (!obj) return;
    var props = obj.getProperties && obj.getProperties();
    var info = props && props.tooltip;
    if (!info) return;

    if (ZO.Map._sharedPopup) {
        ZO._map.removePopup(ZO.Map._sharedPopup);
    }
    ZO.Map._sharedPopup = new bemap.Popup({
        coordinate: obj.getCoordinate(),
        information: info
    });
    ZO._map.addPopup(ZO.Map._sharedPopup);

    /* Prevent the map-click handler from firing after marker click */
    ZO.state._suppressMapClick = true;
    setTimeout(function () { ZO.state._suppressMapClick = false; }, 0);
};
