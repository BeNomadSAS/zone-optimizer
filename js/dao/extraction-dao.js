/* ======================================================================
 * EXTRACTION DAO - Roads Extractor API
 *
 * Pattern from bemap_idea: bemapMainCtx.getBaseUrl() + "service/roadsextractor/1.0"
 * ====================================================================== */

/**
 * Calls the Bemap Roads Extractor API.
 * @param {Object} request - { geoserver, coordinates, transportType, adminPath, ... }
 * @param {Function} success - function(data)
 * @param {Function} failed - function(xhr, response)
 */
ZO.dao.extractRoads = function (request, success, failed) {
    var url = ZO.getContext().getBaseUrl() + 'service/roadsextractor/1.0';

    return bemap.ajax('POST', url, request, function (xhr, response) {
        success(JSON.parse(response));
    }, function (xhr, response) {
        failed(xhr, response);
    }, ZO.dao.getBasicAuth());
};
