/* ======================================================================
 * TRACEROUTE
 *
 * 100% bemap-js-api. TraceRoute computation, dashed polyline, minimal
 * waypoint markers, polyline match comparison.
 * ====================================================================== */

ZO.TraceRoute = {};

/** Shared icon for traceroute waypoint markers. */
ZO.TraceRoute._wpIcon = null;

ZO.TraceRoute._getWpIcon = function () {
    if (!ZO.TraceRoute._wpIcon) {
        ZO.TraceRoute._wpIcon = new bemap.Icon({
            src: ZO.Icons.traceWaypoint,
            width: 16, height: 16,
            anchorX: 0.5, anchorY: 0.5,
            anchorXUnits: 'fraction', anchorYUnits: 'fraction'
        });
    }
    return ZO.TraceRoute._wpIcon;
};

/**
 * Runs TraceRoute computation and updates UI.
 * @param {string} statsHtml - existing stats HTML to append to
 * @param {Function} onSuccess - function(finalStatsHtml)
 * @param {Function} onError - function(errorMessage)
 */
ZO.TraceRoute.compute = function (statsHtml, onSuccess, onError) {
    var baseTime = Date.now();
    var sampledCoords = ZO.Utils.samplePolyline(ZO.state.routeCoords, 5);

    var traceDestinations = sampledCoords.map(function (coord, i) {
        return {
            coordinateSat: {
                time: baseTime + i * 3000,
                speed: '50',
                heading: '0',
                sat: 127,
                lon: String(coord[1]),
                lat: String(coord[0])
            }
        };
    });

    var request = {
        geoserver: 'here',
        language: 'en',
        allowOffRoad: false,
        routingVehicleProfile: { transportMode: 'CAR' },
        options: ['POLYLINE', 'WAYPOINTS'],
        destinations: traceDestinations
    };

    ZO.dao.track('traceroute', ZO.dao.traceRoute(request,
        function (traceData) {
            var traceRoute = traceData.routingRoutes && traceData.routingRoutes[0];
            ZO.state.traceRouteCoords = [];

            /* Dashed rose polyline */
            if (traceRoute && traceRoute.polyline) {
                var tracePoly = traceRoute.polyline;
                ZO.state.traceRouteCoords = Array.isArray(tracePoly)
                    ? tracePoly.map(function (p) { return [p.lat, p.lon]; })
                    : ZO.Utils.decodePolyline(tracePoly);

                if (ZO.state.traceRouteCoords.length > 0) {
                    var dashStyle = new bemap.LineStyle({
                        color: new bemap.Color(244, 63, 94, 0.75),   // #f43f5e
                        width: 3,
                        type: bemap.LineStyle.TYPE.DASH
                    });
                    var coords = ZO.state.traceRouteCoords.map(function (pt) {
                        return new bemap.Coordinate(pt[1], pt[0]);
                    });
                    var pline = new bemap.Polyline(coords, { style: dashStyle });
                    ZO._map.addPolyline(pline, { layer: ZO.Map.layers.traceroute });
                }
            }

            /* Minimal waypoint markers */
            var traceWaypoints = (traceRoute && traceRoute.waypoints) || [];
            if (traceWaypoints.length > 0) {
                var wpIcon = ZO.TraceRoute._getWpIcon();
                $.each(traceWaypoints, function (i, wp) {
                    var c = wp.coordinate;
                    var marker = new bemap.Marker(
                        new bemap.Coordinate(c.lon, c.lat),
                        { icon: wpIcon }
                    );
                    marker.setProperties({ tooltip: 'WP ' + (i + 1) });
                    ZO._map.addMarker(marker, { layer: ZO.Map.layers.traceroute });
                    ZO._map.onMarker(marker, bemap.Map.EventType.CLICK, ZO.Map.showTooltip);
                });

                statsHtml += '<br>Minimal waypoints: <strong>' + Number(traceWaypoints.length) +
                    '</strong> (out of ' + Number(sampledCoords.length) + ' polyline points)';

                ZO.state.orderedPoints = traceWaypoints.map(function (wp, i) {
                    return { lat: wp.coordinate.lat, lon: wp.coordinate.lon, order: i };
                });
                ZO.PointsList.update();
                /* Visibility handled by ZO.UI.refresh() in routing.js success callback */
            }

            /* Polyline match index */
            if (ZO.state.traceRouteCoords.length > 0 && ZO.state.routeCoords.length > 0) {
                var match = ZO.Utils.computePolylineMatch(ZO.state.routeCoords, ZO.state.traceRouteCoords);
                var color = match.score >= 90 ? '#155724' : match.score >= 70 ? '#856404' : '#721c24';
                statsHtml += '<br><span style="color:' + color + '">Match: <strong>' +
                    match.score.toFixed(1) + '%</strong></span>' +
                    ' (avg gap: ' + match.avgDist.toFixed(1) + 'm, max: ' +
                    match.maxDist.toFixed(1) + 'm, ' +
                    match.pctUnder10m.toFixed(0) + '% < 10m)';
            }

            onSuccess(statsHtml);
        },
        function (xhr, response) {
            if (xhr && xhr.status === 0) { return; /* aborted - silent */ }
            onError(ZO.Utils.parseApiError(xhr, response));
        }
    ));
};
