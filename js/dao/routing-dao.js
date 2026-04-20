/* ======================================================================
 * ROUTING DAO - Route Optimization API
 *
 * Calls /service/routing/1.0 for OPTIMIZED_TRIP routing.
 * ====================================================================== */

/**
 * Calls the Bemap Routing API.
 * @param {Object} request - full routing request body
 * @param {Function} success - function(data)
 * @param {Function} failed - function(xhr, response)
 */
ZO.dao.optimizeRoute = function (request, success, failed) {
    var url = ZO.getContext().getBaseUrl() + 'service/routing/1.0';

    return bemap.ajax('POST', url, request, function (xhr, response) {
        success(JSON.parse(response));
    }, function (xhr, response) {
        failed(xhr, response);
    }, ZO.dao.getBasicAuth());
};
