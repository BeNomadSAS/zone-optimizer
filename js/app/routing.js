/* ======================================================================
 * ROUTING
 *
 * 100% bemap-js-api. Route optimization UI: start/end selection via
 * map click, routing API call, polyline + numbered waypoint display.
 *
 * All visibility is centralized in ZO.UI.refresh() - this module only
 * mutates state and layer content.
 * ====================================================================== */

ZO.Routing = {};

/** Shared icons (created once). */
ZO.Routing._startIcon = null;
ZO.Routing._endIcon = null;

ZO.Routing._getStartIcon = function () {
    if (!ZO.Routing._startIcon) {
        ZO.Routing._startIcon = new bemap.Icon({
            src: ZO.Icons.start,
            width: 20, height: 20,
            anchorX: 0.5, anchorY: 0.5,
            anchorXUnits: 'fraction', anchorYUnits: 'fraction'
        });
    }
    return ZO.Routing._startIcon;
};

ZO.Routing._getEndIcon = function () {
    if (!ZO.Routing._endIcon) {
        ZO.Routing._endIcon = new bemap.Icon({
            src: ZO.Icons.end,
            width: 20, height: 20,
            anchorX: 0.5, anchorY: 0.5,
            anchorXUnits: 'fraction', anchorYUnits: 'fraction'
        });
    }
    return ZO.Routing._endIcon;
};

/** Sets the optimize status message. */
ZO.Routing.setStatus = function (msg, type) {
    $('#optimize-status').text(msg).attr('class', 'status ' + type);
};

/** Invalidates an existing route so the user can re-optimize. */
ZO.Routing._invalidateRoute = function () {
    if (ZO.state.routeCoords.length === 0 && ZO.state.traceRouteCoords.length === 0) return;
    /* Cancel any in-flight optimize/traceroute calls to avoid stale results */
    ZO.dao.cancel('optimize');
    ZO.dao.cancel('traceroute');
    ZO.Animation.stop();
    ZO.Map.clear('routing');
    ZO.Map.clear('traceroute');
    ZO.Map.clear('animation');
    ZO.state.routeCoords = [];
    ZO.state.orderedPoints = [];
    ZO.state.traceRouteCoords = [];
    ZO.state.usedOrderByInputIndex = null;
    $('#route-stats').html('');
    $('#optimize-status').text('').attr('class', 'status');
    $('#points-list').html('');
};

/** Places start or end marker at given lat/lon. */
ZO.Routing._placeMarker = function (which, lat, lon) {
    var map = ZO._map;
    var existing = which === 'start' ? ZO.state.startMarker : ZO.state.endMarker;
    if (existing) map.removeMarker(existing);

    var icon = which === 'start' ? ZO.Routing._getStartIcon() : ZO.Routing._getEndIcon();
    var marker = new bemap.Marker(new bemap.Coordinate(lon, lat), { icon: icon });
    map.addMarker(marker, { layer: ZO.Map.layers.startEnd });

    if (which === 'start') {
        ZO.state.startMarker = marker;
        ZO.state.startPoint = { lat: lat, lon: lon };
        $('#start-info').html('D\u00e9part: ' + lat.toFixed(5) + ', ' + lon.toFixed(5));
    } else {
        ZO.state.endMarker = marker;
        ZO.state.endPoint = { lat: lat, lon: lon };
        $('#end-info').html('Arriv\u00e9e: ' + lat.toFixed(5) + ', ' + lon.toFixed(5));
    }
};

/** Initializes routing event handlers. */
ZO.Routing.init = function () {

    /* --- Map click for start/end points --- */
    ZO._map.on(bemap.Map.EventType.CLICK, function (mapEvent) {
        if (ZO.state._suppressMapClick) return;
        /* Only active after extraction - guard by state, not by DOM visibility */
        if (ZO.state.extractedPoints.length === 0) return;
        /* Idle map click after both start+end placed (and route computed)
         * does nothing - user must use "Effacer" buttons to reset. */
        if (ZO.state.clickMode === null) return;

        var coord = mapEvent.getCoordinate();
        var lat = coord.getLat(), lon = coord.getLon();

        /* Changing start/end while still placing them invalidates the prior route */
        ZO.Routing._invalidateRoute();

        if (ZO.state.clickMode === 'start') {
            ZO.Routing._placeMarker('start', lat, lon);
            ZO.state.clickMode = 'end';
        } else if (ZO.state.clickMode === 'end') {
            ZO.Routing._placeMarker('end', lat, lon);
            ZO.state.clickMode = null;
        }

        if (ZO.UI) ZO.UI.refresh();
    });

    /* --- Optimize button --- */
    $('#optimize-btn').on('click', function () {
        if (!ZO.state.startPoint || !ZO.state.endPoint || ZO.state.extractedPoints.length === 0) return;

        if (!ZO.getContext() || !ZO.Config.getCreds().user) {
            ZO.Routing.setStatus('Veuillez configurer vos identifiants Bemap.', 'error');
            ZO.Config.openModal();
            return;
        }

        var $btn = $(this);
        $btn.prop('disabled', true);
        ZO.Routing.setStatus('Optimisation en cours...', 'loading');
        ZO.Loader.show('Optimisation en cours...');
        ZO.Map.clear('routing');
        ZO.Map.clear('traceroute');

        var allPoints = [{ lat: ZO.state.startPoint.lat, lon: ZO.state.startPoint.lon, heading: 0 }];
        $.each(ZO.state.extractedPoints, function (i, p) {
            allPoints.push({ lat: p.lat, lon: p.lon, heading: p.angle || 0 });
        });
        allPoints.push({ lat: ZO.state.endPoint.lat, lon: ZO.state.endPoint.lon, heading: 0 });

        var destinations = allPoints.map(function (p) {
            return {
                avoidUTurn: 'YES',
                useStartAngle: 'YES',
                coordinateSat: { heading: p.heading, lat: p.lat, lon: p.lon }
            };
        });

        var request = {
            departureTime: String(Date.now()),
            destinations: destinations,
            geoserver: 'here',
            maxAlternativeRoutes: 0,
            options: ['POLYLINE', 'OPTIMIZED_TRIP', 'WAYPOINTS_POLYLINE'],
            outputLanguage: 'fr',
            routingCriterias: ['FASTEST', 'AVOID_UNPAVED'],
            routingMode: 'MODE_VIAS',
            routingVehicleProfile: {
                maxSpeeds: [{ maxSpeed: 90, type: 'ALL' }],
                routingVehicleFeature: { height: 180, length: 450, weight: 20, width: 180 },
                transportMode: 'CAR'
            }
        };

        ZO.dao.track('optimize', ZO.dao.optimizeRoute(request,
            function (data) {
                /* Route polyline */
                ZO.state.routeCoords = [];
                if (data.routingRoutes && data.routingRoutes[0] && data.routingRoutes[0].polyline) {
                    var poly = data.routingRoutes[0].polyline;
                    ZO.state.routeCoords = Array.isArray(poly)
                        ? poly.map(function (p) { return [p.lat, p.lon]; })
                        : ZO.Utils.decodePolyline(poly);

                    if (ZO.state.routeCoords.length > 0) {
                        var lineStyle = new bemap.LineStyle({
                            color: new bemap.Color(79, 70, 229, 0.85),  // #4f46e5
                            width: 4,
                            type: bemap.LineStyle.TYPE.PLANE
                        });
                        var coords = ZO.state.routeCoords.map(function (pt) {
                            return new bemap.Coordinate(pt[1], pt[0]);
                        });
                        var pline = new bemap.Polyline(coords, { style: lineStyle });
                        ZO._map.addPolyline(pline, { layer: ZO.Map.layers.routing });
                    }
                }

                /* Ordered waypoints with numbered markers.
                 *
                 * The Bemap routing API echoes each input destination back with:
                 *   - inputOrder: 0..N - the index in our `destinations[]` array
                 *   - usedOrder:  0..N - the position in the OPTIMIZED trip
                 *   - matchedCoordinateGps: snapped coordinate
                 * Documented at bemap_idea/.../routing-service.md and proven by
                 * the Java model RoutingUsedDestination.java.
                 *
                 * We build a Map<inputOrder, usedOrder> here so the segments+ordre
                 * CSV download can attach the correct trip position to each
                 * extracted-segment row by index, no Haversine needed. */
                ZO.state.orderedPoints = [];
                ZO.state.usedOrderByInputIndex = {};
                if (data.usedDestinations) {
                    /* Build the inputOrder -> usedOrder map (skip unused entries) */
                    $.each(data.usedDestinations, function (idx, d) {
                        if (d && d.used !== false && typeof d.inputOrder === 'number') {
                            ZO.state.usedOrderByInputIndex[d.inputOrder] = d.usedOrder;
                        }
                    });

                    /* Display markers in optimized-trip order */
                    data.usedDestinations
                        .slice()
                        .sort(function (a, b) { return a.usedOrder - b.usedOrder; })
                        .forEach(function (d, i, arr) {
                            var c = d.matchedCoordinateGps;
                            ZO.state.orderedPoints.push({ lat: c.lat, lon: c.lon, order: i });
                            if (i > 0 && i < arr.length - 1) {
                                var numIcon = new bemap.Icon({
                                    src: ZO.Icons.numberedWaypoint(i),
                                    width: 28, height: 28,
                                    anchorX: 0.5, anchorY: 0.5,
                                    anchorXUnits: 'fraction', anchorYUnits: 'fraction'
                                });
                                var m = new bemap.Marker(new bemap.Coordinate(c.lon, c.lat), { icon: numIcon });
                                m.setProperties({ tooltip: 'Waypoint ' + i });
                                ZO._map.addMarker(m, { layer: ZO.Map.layers.routing });
                                /* Bind click so the map's "place start/end" handler
                                 * doesn't fire and wipe the route when user clicks
                                 * a numbered waypoint. ZO.Map.showTooltip flips
                                 * ZO.state._suppressMapClick for one tick. */
                                ZO._map.onMarker(m, bemap.Map.EventType.CLICK, ZO.Map.showTooltip);
                            }
                        });
                    ZO.PointsList.update();
                }

                var route = data.routingRoutes && data.routingRoutes[0];
                /* Coerce response numbers explicitly - never trust API string types. */
                var routeLength   = (route && Number(route.length))   || 0;
                var routeDuration = (route && Number(route.duration)) || 0;
                var statsHtml =
                    'Distance: <strong>' + (routeLength / 1000).toFixed(2) + ' km</strong><br>' +
                    'Dur\u00e9e: <strong>' + Math.floor(routeDuration / 60) + ' min ' +
                    (routeDuration % 60) + ' sec</strong>';

                if ($('#minimal-waypoints').is(':checked') && ZO.state.routeCoords.length > 0) {
                    ZO.Routing.setStatus('Calcul des waypoints minimaux (TraceRoute)...', 'loading');
                    ZO.Loader.update('Calcul des waypoints minimaux...');
                    ZO.TraceRoute.compute(statsHtml, function (finalStats) {
                        ZO.Routing.setStatus('Route optimis\u00e9e !', 'success');
                        $('#route-stats').html(finalStats);
                        $btn.prop('disabled', false);
                        if (ZO.UI) ZO.UI.refresh();
                        ZO.Loader.hide();
                    }, function (errMsg) {
                        ZO.Routing.setStatus('Erreur TraceRoute: ' + errMsg, 'error');
                        $('#route-stats').html(statsHtml);
                        $btn.prop('disabled', false);
                        if (ZO.UI) ZO.UI.refresh();
                        ZO.Loader.hide();
                    });
                } else {
                    ZO.Routing.setStatus('Route optimis\u00e9e !', 'success');
                    $('#route-stats').html(statsHtml);
                    $btn.prop('disabled', false);
                    if (ZO.UI) ZO.UI.refresh();
                    ZO.Loader.hide();
                }
            },
            function (xhr, response) {
                if (xhr && xhr.status === 0) { ZO.Loader.hide(); $btn.prop('disabled', false); return; }
                var errMsg = ZO.Utils.parseApiError(xhr, response);
                ZO.Routing.setStatus('Erreur: ' + errMsg, 'error');
                $btn.prop('disabled', false);
                if (ZO.UI) ZO.UI.refresh();
                ZO.Loader.hide();
            }
        ));
    });

    /* --- Clear route button (only start/end, keeps extraction) --- */
    $('#clear-route-btn').on('click', function () {
        var map = ZO._map;
        ZO.dao.cancel('optimize');
        ZO.dao.cancel('traceroute');
        ZO.Animation.stop();
        if (ZO.state.startMarker) { map.removeMarker(ZO.state.startMarker); ZO.state.startMarker = null; }
        if (ZO.state.endMarker)   { map.removeMarker(ZO.state.endMarker);   ZO.state.endMarker   = null; }
        ZO.state.startPoint = null;
        ZO.state.endPoint = null;
        ZO.Map.clear('routing');
        ZO.Map.clear('traceroute');
        ZO.Map.clear('animation');
        ZO.Map.clear('startEnd');
        ZO.state.routeCoords = [];
        ZO.state.orderedPoints = [];
        ZO.state.traceRouteCoords = [];
        ZO.state.usedOrderByInputIndex = null;
        ZO.state.clickMode = 'start';

        $('#start-info').html('D\u00e9part: <em>cliquez sur la carte</em>');
        $('#end-info').html('Arriv\u00e9e: <em>cliquez sur la carte</em>');
        $('#route-stats').html('');
        $('#optimize-status').text('').attr('class', 'status');
        $('#points-list').html('');

        if (ZO.UI) ZO.UI.refresh();
    });

    /* --- Toggle layer visibility via bemap.VectorLayer.setVisible --- */
    $('#toggle-routing-btn').on('click', function () {
        var layer = ZO.Map.layers.routing;
        var vis = !layer.isVisible();
        layer.setVisible(vis);
        $(this).text(vis ? 'Masquer Routing' : 'Afficher Routing').css('opacity', vis ? '1' : '0.6');
    });

    $('#toggle-traceroute-btn').on('click', function () {
        var layer = ZO.Map.layers.traceroute;
        var vis = !layer.isVisible();
        layer.setVisible(vis);
        $(this).text(vis ? 'Masquer TraceRoute' : 'Afficher TraceRoute').css('opacity', vis ? '1' : '0.6');
    });

    /* --- TraceRoute checkbox: clear traceroute state when unchecked --- */
    $('#minimal-waypoints').on('change', function () {
        if (!$(this).is(':checked')) {
            ZO.Map.clear('traceroute');
            ZO.state.traceRouteCoords = [];
        }
        if (ZO.UI) ZO.UI.refresh();
    });

    /* --- Download buttons --- */
    $('#download-min-wp-btn').on('click', function () {
        if (ZO.state.orderedPoints.length === 0) return;
        var lines = ['order,lat,lon'];
        $.each(ZO.state.orderedPoints, function (i, p) {
            lines.push(i + ',' + p.lat.toFixed(7) + ',' + p.lon.toFixed(7));
        });
        ZO.Utils.downloadCsv(lines.join('\n'), ZO.Utils.timestampedFilename('minimal_waypoints.csv'));
    });

    $('#download-segments-ordered-btn').on('click', function () {
        if (!ZO.state.csvData || !ZO.state.usedOrderByInputIndex) return;
        /* The CSV's row order matches ZO.state.extractedPoints (1:1, line-by-line),
         * which was sent to the routing API as destinations[1..N] (destinations[0]
         * is the start point, destinations[N+1] is the end point).
         *
         * v1.3.0: replaces the v1.2.0 Haversine proximity loop. We now use the
         * routing API's `inputOrder` field directly (verified in
         * bemap_idea/.../routing-service.md and Java model
         * RoutingUsedDestination.java). O(N) instead of O(N*M), and exact
         * instead of proximity-approximate (which could pick the wrong waypoint
         * when two extracted points are close). */
        var map = ZO.state.usedOrderByInputIndex;
        var lines = ZO.state.csvData.split('\n');
        var out = [lines[0] + ',order'];
        var dataRowIdx = 0; /* counts non-blank data rows; matches extractedPoints[i] */
        for (var i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            /* extractedPoints[dataRowIdx] was sent as destinations[dataRowIdx + 1] */
            var inputOrder = dataRowIdx + 1;
            var usedOrder = map[inputOrder];
            out.push(lines[i] + ',' + (usedOrder !== undefined ? usedOrder : ''));
            dataRowIdx++;
        }
        ZO.Utils.downloadCsv(out.join('\n'), ZO.Utils.timestampedFilename('segments_ordered.csv'));
    });
};
