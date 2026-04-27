/* ======================================================================
 * POINTS LIST
 *
 * Ordered waypoints display. Click to pan map to point using bemap.move.
 * ====================================================================== */

ZO.PointsList = {};

/** Updates the points list in the sidebar. */
ZO.PointsList.update = function () {
    var $container = $('#points-list');
    $container.html('');

    $.each(ZO.state.orderedPoints, function (i, point) {
        var isStart = (i === 0);
        var isEnd = (i === ZO.state.orderedPoints.length - 1);
        var cls = 'point-item' + (isStart ? ' start' : isEnd ? ' end' : '');
        var label = isStart ? 'Start' : isEnd ? 'End' : 'Point ' + i;

        var $div = $('<div>')
            .addClass(cls)
            .html('<span class="order">' + label + '</span><br>' +
                  '<span class="coords">' + point.lat.toFixed(5) + ', ' + point.lon.toFixed(5) + '</span>')
            .on('click', function () {
                /* bemap.move takes (lon, lat, zoom) */
                ZO._map.move(point.lon, point.lat, ZO._map.getZoom());
            });

        $container.append($div);
    });
};

/** Initializes the toggle button for the points list section. */
ZO.PointsList.init = function () {
    $('#toggle-points-btn').on('click', function () {
        var $section = $('#points-list-section');
        $section.toggle();
        $(this).text($section.is(':visible') ? 'Hide list' : 'Show points list');
    });
};
