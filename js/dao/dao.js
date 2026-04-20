/* ======================================================================
 * BASE DAO - Data Access Object
 *
 * Base AJAX utilities and authentication.
 * Pattern follows evmove5/js/dao/dao.js
 *
 * v1.2.0+: in-flight XHR tracking for abort/cancel on overlapping calls.
 * ====================================================================== */

ZO.dao = {};

/**
 * Encodes a string as Latin-1-safe Basic Auth value.
 * Standard btoa() throws on non-Latin-1 characters; this wraps in
 * UTF-8 -> binary conversion via TextEncoder.
 * @param {string} userPass - "user:pass"
 * @returns {string} "Basic <base64>"
 */
ZO.dao._basicAuthHeader = function (userPass) {
    var bin = '';
    var bytes = new TextEncoder().encode(userPass);
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return 'Basic ' + btoa(bin);
};

/**
 * Returns Basic Auth headers for Bemap API calls.
 * Latin-1 safe (handles unicode passwords).
 * @returns {{ headers: Array }}
 */
ZO.dao.getBasicAuth = function () {
    var context = ZO.getContext();
    var basicAuth = { headers: [] };

    basicAuth.headers.push({
        "key": "Authorization",
        "value": ZO.dao._basicAuthHeader((context.login || '') + ":" + (context.password || ''))
    });

    return basicAuth;
};

/* --- In-flight XHR tracker for abort/cancel ---------------------------- */

ZO.dao._inflight = {};

/**
 * Aborts any pending XHR registered under `key`.
 * Safe to call when no in-flight request exists.
 * @param {string} key - feature identifier ('extract', 'optimize', 'traceroute')
 */
ZO.dao.cancel = function (key) {
    var xhr = ZO.dao._inflight[key];
    if (xhr && xhr.readyState !== 4) {
        try { xhr.abort(); } catch (e) { /* ignore - some browsers throw */ }
    }
    delete ZO.dao._inflight[key];
};

/**
 * Registers an XHR under `key`, cancelling any prior in-flight request.
 * Returns the XHR for chaining.
 * @param {string} key
 * @param {XMLHttpRequest} xhr
 * @returns {XMLHttpRequest}
 */
ZO.dao.track = function (key, xhr) {
    ZO.dao.cancel(key);
    ZO.dao._inflight[key] = xhr;
    return xhr;
};
