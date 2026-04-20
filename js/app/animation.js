/* ======================================================================
 * ANIMATION
 *
 * 100% bemap-js-api. Smooth parallel route animation using
 * requestAnimationFrame (time-based, 60fps) and CSS fade-out on stop.
 * Markers are added to the 'animation' VectorLayer.
 * ====================================================================== */

ZO.Animation = {};

/** Shared animation icons. */
ZO.Animation._routingIcon = null;
ZO.Animation._traceIcon = null;

ZO.Animation._getRoutingIcon = function () {
    if (!ZO.Animation._routingIcon) {
        ZO.Animation._routingIcon = new bemap.Icon({
            src: ZO.Icons.animRouting,
            width: 24, height: 24,
            anchorX: 0.5, anchorY: 0.5,
            anchorXUnits: 'fraction', anchorYUnits: 'fraction'
        });
    }
    return ZO.Animation._routingIcon;
};

ZO.Animation._getTraceIcon = function () {
    if (!ZO.Animation._traceIcon) {
        ZO.Animation._traceIcon = new bemap.Icon({
            src: ZO.Icons.animTrace,
            width: 24, height: 24,
            anchorX: 0.5, anchorY: 0.5,
            anchorXUnits: 'fraction', anchorYUnits: 'fraction'
        });
    }
    return ZO.Animation._traceIcon;
};

/* Animation state */
ZO.Animation._markerRouting = null;
ZO.Animation._markerTrace = null;
ZO.Animation._distance = 0;
ZO.Animation._routeCumDist = [];
ZO.Animation._traceCumDist = [];
ZO.Animation._rafId = null;
ZO.Animation._lastTs = 0;

/* Fade-out duration in ms for smooth stop. Matches CSS transition. */
ZO.Animation._FADE_MS = 280;

/**
 * Returns animation speed from slider (x0.1 to x5.0).
 * Bounds-guarded: NaN / empty / out-of-range default to x1.0.
 */
ZO.Animation.getSpeed = function () {
    var raw = parseInt($('#anim-speed').val(), 10);
    if (!isFinite(raw) || raw < 1) raw = 10;  // default x1.0
    if (raw > 50) raw = 50;
    return raw / 10;
};

/**
 * Single animation frame. Time-based: advances distance proportional to
 * elapsed wall-clock time so motion is smooth regardless of frame rate.
 * Base speed = 100 m/s at slider x1.0 (same feel as the old 5m/tick@50ms).
 */
ZO.Animation._frame = function (ts) {
    if (!ZO.Animation._markerRouting) return;
    var last = ZO.Animation._lastTs || ts;
    var dt = Math.min(ts - last, 100); // clamp to avoid jumps after tab-blur
    ZO.Animation._lastTs = ts;

    var speed = ZO.Animation.getSpeed();     // x0.1..x5.0
    ZO.Animation._distance += speed * 0.1 * dt; // 0.1 m/ms at x1.0 = 100 m/s

    var rPos = ZO.Utils.interpolateAtDistance(
        ZO.state.routeCoords, ZO.Animation._routeCumDist, ZO.Animation._distance);
    ZO.Animation._markerRouting.setCoordinate(new bemap.Coordinate(rPos[1], rPos[0]));

    if (ZO.Animation._markerTrace && ZO.Animation._traceCumDist.length > 0) {
        var tPos = ZO.Utils.interpolateAtDistance(
            ZO.state.traceRouteCoords, ZO.Animation._traceCumDist, ZO.Animation._distance);
        ZO.Animation._markerTrace.setCoordinate(new bemap.Coordinate(tPos[1], tPos[0]));
    }

    ZO.Animation._rafId = requestAnimationFrame(ZO.Animation._frame);
};

/** Starts the animation. */
ZO.Animation.start = function () {
    if (ZO.state.routeCoords.length === 0) return;
    var map = ZO._map;

    /* Clean up any leftovers from a previous run */
    ZO.Animation._cancelRaf();
    ZO.Animation._removeMarkers();

    ZO.Animation._distance = 0;
    ZO.Animation._lastTs = 0;
    ZO.Animation._routeCumDist = ZO.Utils.cumulativeDistances(ZO.state.routeCoords);
    ZO.Animation._traceCumDist = ZO.state.traceRouteCoords.length > 0
        ? ZO.Utils.cumulativeDistances(ZO.state.traceRouteCoords) : [];

    /* Routing animation marker */
    var first = ZO.state.routeCoords[0]; // [lat, lon]
    ZO.Animation._markerRouting = new bemap.Marker(
        new bemap.Coordinate(first[1], first[0]),
        { icon: ZO.Animation._getRoutingIcon() }
    );
    map.addMarker(ZO.Animation._markerRouting, { layer: ZO.Map.layers.animation });
    /* Promote to high-z-index pane so it draws above all other markers
     * regardless of latitude (Leaflet's default markerPane sorts by lat). */
    ZO.Map.promoteAnimationMarker(ZO.Animation._markerRouting);
    ZO.Animation._markInDom(ZO.Animation._markerRouting);

    /* Traceroute animation marker */
    if (ZO.state.traceRouteCoords.length > 0) {
        var t0 = ZO.state.traceRouteCoords[0];
        ZO.Animation._markerTrace = new bemap.Marker(
            new bemap.Coordinate(t0[1], t0[0]),
            { icon: ZO.Animation._getTraceIcon() }
        );
        map.addMarker(ZO.Animation._markerTrace, { layer: ZO.Map.layers.animation });
        ZO.Map.promoteAnimationMarker(ZO.Animation._markerTrace);
        ZO.Animation._markInDom(ZO.Animation._markerTrace);
    }

    /* animationInterval is used by UI flags as an "is animating" signal.
     * We store the rafId there so ZO.UI knows the animation is running. */
    ZO.state.animationInterval = -1; // truthy marker for UI
    ZO.Animation._rafId = requestAnimationFrame(ZO.Animation._frame);
    if (ZO.UI) ZO.UI.refresh();
};

/**
 * Smoothly stops: fades markers out via CSS, then removes them.
 * This avoids the abrupt pop when the marker would otherwise just vanish.
 */
ZO.Animation.stop = function () {
    ZO.Animation._cancelRaf();
    /* UI flip is immediate so Stop hides and Animate comes back */
    ZO.state.animationInterval = null;
    if (ZO.UI) ZO.UI.refresh();

    /* Track this fade so a Start during the 280ms window cancels it */
    var token = (ZO.Animation._fadeToken = (ZO.Animation._fadeToken || 0) + 1);
    ZO.Animation._fadeOutMarkers(function () {
        if (token !== ZO.Animation._fadeToken) return; // superseded
        ZO.Animation._removeMarkers();
    });
};

/** Cancels the running requestAnimationFrame loop. */
ZO.Animation._cancelRaf = function () {
    if (ZO.Animation._rafId !== null) {
        cancelAnimationFrame(ZO.Animation._rafId);
        ZO.Animation._rafId = null;
    }
};

/** Adds a CSS class to the marker's DOM so it can be faded on stop. */
ZO.Animation._markInDom = function (marker) {
    if (!marker || !marker.native || !marker.native.getElement) return;
    var el = marker.native.getElement();
    if (el) el.classList.add('zo-anim-marker');
};

/** Triggers CSS opacity -> 0 transition on both markers, then calls cb. */
ZO.Animation._fadeOutMarkers = function (cb) {
    var fade = function (marker) {
        if (!marker || !marker.native || !marker.native.getElement) return;
        var el = marker.native.getElement();
        if (el) el.classList.add('zo-anim-marker-fade');
    };
    fade(ZO.Animation._markerRouting);
    fade(ZO.Animation._markerTrace);
    setTimeout(cb, ZO.Animation._FADE_MS);
};

/** Synchronously removes markers from the map and nulls refs. */
ZO.Animation._removeMarkers = function () {
    var map = ZO._map;
    if (ZO.Animation._markerRouting) {
        map.removeMarker(ZO.Animation._markerRouting);
        ZO.Animation._markerRouting = null;
    }
    if (ZO.Animation._markerTrace) {
        map.removeMarker(ZO.Animation._markerTrace);
        ZO.Animation._markerTrace = null;
    }
};

/** Initializes animation event handlers. */
ZO.Animation.init = function () {
    $('#animate-btn').on('click', ZO.Animation.start);
    $('#stop-animate-btn').on('click', ZO.Animation.stop);

    $('#anim-speed').on('input', function () {
        $('#speed-label').text('\u00d7' + ZO.Animation.getSpeed().toFixed(1));
    });
};
