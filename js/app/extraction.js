/* ======================================================================
 * EXTRACTION
 *
 * Road extraction UI. Calls roadsextractor DAO, displays points as
 * bemap.Marker (with SVG icon) on the 'points' VectorLayer.
 * ====================================================================== */

ZO.Extraction = {};

/** Shared icon instance for all extracted points (fixed pixel size). */
ZO.Extraction._pointIcon = null;

/**
 * Sets the extraction status message.
 */
ZO.Extraction.setStatus = function (msg, type) {
    $('#extract-status').text(msg).attr('class', 'status ' + type);
};

/**
 * Gets (or creates) the shared bemap.Icon for extracted points.
 * @returns {bemap.Icon}
 */
ZO.Extraction._getPointIcon = function () {
    if (!ZO.Extraction._pointIcon) {
        ZO.Extraction._pointIcon = new bemap.Icon({
            src: ZO.Icons.extractedPoint,
            width: 12, height: 12,
            anchorX: 0.5, anchorY: 0.5,
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction'
        });
    }
    return ZO.Extraction._pointIcon;
};

/** Initializes extraction event handlers. */
ZO.Extraction.init = function () {

    $('#extract-btn').on('click', function () {
        if (!ZO.state.currentPolygon) return;

        if (!ZO.getContext() || !ZO.Config.getCreds().user) {
            ZO.Extraction.setStatus('Veuillez configurer vos identifiants Bemap.', 'error');
            ZO.Config.openModal();
            return;
        }

        var $btn = $(this);
        $btn.prop('disabled', true);
        ZO.Extraction.setStatus('Extraction en cours...', 'loading');
        ZO.Loader.show('Extraction en cours...');
        ZO.Map.clear('points');

        /* Build request: polygon must be closed */
        var coordinates = ZO.state.currentPolygon.map(function (p) {
            return { lon: p.lon, lat: p.lat };
        });
        var first = coordinates[0], last = coordinates[coordinates.length - 1];
        if (first.lat !== last.lat || first.lon !== last.lon) {
            coordinates.push({ lon: first.lon, lat: first.lat });
        }

        var request = {
            geoserver: 'here',
            coordinates: coordinates,
            transportType: $('#transport-type').val(),
            adminPath: true,
            filterElementsHouseNumbers: $('#filter-house-numbers').is(':checked'),
            filterClippedElements: $('#filter-clipped').is(':checked')
        };

        ZO.dao.track('extract', ZO.dao.extractRoads(request,
            function (data) {
                var roads = data.roads || [];
                var csvLines = ['lat,lon,angle,name,country,state,county,city,postalCode,street,streetNumber'];
                var points = [];
                var icon = ZO.Extraction._getPointIcon();

                $.each(roads, function (i, road) {
                    var coord = road.coordinate;
                    var angle = road.angle || 0;
                    var label = road.label || '';
                    var addr = road.postalAddress || {};

                    points.push({
                        lat: coord.lat,
                        lon: coord.lon,
                        angle: angle,
                        name: label,
                        postalAddress: addr
                    });

                    var esc = ZO.Utils.escapeCsv;
                    csvLines.push([
                        coord.lat, coord.lon, angle, esc(label),
                        esc(addr.country), esc(addr.state), esc(addr.county),
                        esc(addr.city), esc(addr.postalCode), esc(addr.street),
                        esc(addr.streetNumber)
                    ].join(','));
                });

                ZO.state.csvData = csvLines.join('\n');

                /* Display points as bemap.Marker with tooltip-on-click */
                $.each(points, function (i, p) {
                    var marker = new bemap.Marker(
                        new bemap.Coordinate(p.lon, p.lat),
                        { icon: icon }
                    );
                    /* Sanitize: tooltip is rendered via bemap.Popup (HTML).
                     * Strip < > & to neutralize any HTML/script in API-returned name. */
                    var safeName = String(p.name || '').replace(/[<>&]/g, '');
                    marker.setProperties({ tooltip: safeName + ' (' + p.angle + '\u00b0)' });
                    ZO._map.addMarker(marker, { layer: ZO.Map.layers.points });
                    ZO._map.onMarker(marker, bemap.Map.EventType.CLICK, ZO.Map.showTooltip);
                });

                ZO.Extraction.setStatus('Extraction termin\u00e9e !', 'success');
                $('#extract-stats').html('<strong>' + roads.length + '</strong> segments extraits');

                ZO.state.extractedPoints = points;
                ZO.state.clickMode = 'start';
                if (ZO.UI) ZO.UI.refresh();

                $btn.prop('disabled', false);
                ZO.Loader.hide();
            },
            function (xhr, response) {
                if (xhr && xhr.status === 0) { ZO.Loader.hide(); $btn.prop('disabled', false); return; }
                var errMsg = ZO.Utils.parseApiError(xhr, response);
                ZO.Extraction.setStatus('Erreur: ' + errMsg, 'error');
                $btn.prop('disabled', false);
                if (ZO.UI) ZO.UI.refresh();
                ZO.Loader.hide();
            }
        ));
    });

    $('#download-btn').on('click', function () {
        if (!ZO.state.csvData) return;
        ZO.Utils.downloadCsv(ZO.state.csvData, ZO.Utils.timestampedFilename('segments.csv'));
    });
};
