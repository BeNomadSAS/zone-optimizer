/* ======================================================================
 * TRACEROUTE DAO - TraceRoute API
 *
 * Calls /service/routing/1.0/traceroute for minimal waypoints.
 * ====================================================================== */

/**
 * Calls the Bemap TraceRoute API.
 * @param {Object} request - traceroute request body
 * @param {Function} success - function(data)
 * @param {Function} failed - function(xhr, response)
 */
ZO.dao.traceRoute = function (request, success, failed) {
    var url = ZO.getContext().getBaseUrl() + 'service/routing/1.0/traceroute';

    return bemap.ajax('POST', url, request, function (xhr, response) {
        success(JSON.parse(response));
    }, function (xhr, response) {
        failed(xhr, response);
    }, ZO.dao.getBasicAuth());
};
