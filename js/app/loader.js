/* ======================================================================
 * LOADER
 *
 * Full-map overlay with animated spinner + message. Blocks map clicks
 * during long-running API operations (extraction, routing, traceroute).
 *
 * Usage:
 *   ZO.Loader.show('Extraction en cours...');
 *   ZO.Loader.update('Calcul des waypoints minimaux...');
 *   ZO.Loader.hide();
 * ====================================================================== */

ZO.Loader = {};

ZO.Loader._$overlay = null;
ZO.Loader._$message = null;

/** Lazily builds the overlay DOM once and appends it to #map. */
ZO.Loader._ensureBuilt = function () {
    if (ZO.Loader._$overlay) return;
    var $o = $(
        '<div class="zo-loader-overlay" role="status" aria-live="polite">' +
          '<div class="zo-loader-card">' +
            '<div class="zo-loader-spinner" aria-hidden="true"></div>' +
            '<div class="zo-loader-message">Chargement...</div>' +
          '</div>' +
        '</div>'
    );
    $('#map').append($o);
    ZO.Loader._$overlay = $o;
    ZO.Loader._$message = $o.find('.zo-loader-message');
};

/**
 * Shows the loader overlay with a message.
 * @param {string} message - text shown below the spinner
 */
ZO.Loader.show = function (message) {
    ZO.Loader._ensureBuilt();
    ZO.Loader._$message.text(message || 'Chargement...');
    ZO.Loader._$overlay.addClass('zo-loader-visible');
};

/**
 * Updates the loader message without flicker (overlay stays visible).
 * @param {string} message
 */
ZO.Loader.update = function (message) {
    if (!ZO.Loader._$overlay) ZO.Loader._ensureBuilt();
    ZO.Loader._$message.text(message || 'Chargement...');
};

/** Hides the loader overlay and re-enables map interaction. */
ZO.Loader.hide = function () {
    if (ZO.Loader._$overlay) ZO.Loader._$overlay.removeClass('zo-loader-visible');
};
