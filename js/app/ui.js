/* ======================================================================
 * UI VISIBILITY CONTROLLER
 *
 * Single source of truth for sidebar section / button visibility.
 * Driven by ZO.state + ZO.Config.
 * All feature modules call ZO.UI.refresh() whenever they mutate state
 * instead of flipping visibility themselves.
 * ====================================================================== */

ZO.UI = {};

/* Tracks which sections were visible last refresh - used to trigger
 * highlight pulse + scrollIntoView only on hidden->visible transition. */
ZO.UI._lastVisible = {};

/**
 * Derives boolean flags from current ZO.state + config.
 * @returns {Object} flag map
 */
ZO.UI._computeFlags = function () {
    var s = ZO.state;
    var c = ZO.Config.getCreds();
    return {
        hasConfig:        !!(c.env && c.user),
        hasPolygon:       !!s.currentBemapPolygon,
        hasExtraction:    s.extractedPoints.length > 0,
        hasStart:         !!s.startPoint,
        hasEnd:           !!s.endPoint,
        hasStartEnd:      !!(s.startPoint && s.endPoint),
        hasRoute:         s.routeCoords.length > 0,
        hasTraceRoute:    s.traceRouteCoords.length > 0,
        hasCsv:           !!s.csvData,
        hasOrdered:       s.orderedPoints.length > 0,
        isAnimating:      !!s.animationInterval,
        wantsMinimalWp:   $('#minimal-waypoints').is(':checked')
    };
};

/**
 * Applies section visibility. On hidden->visible transition, smooth-scrolls
 * the section into center view. The `.highlight` pulse is no longer toggled
 * here - it is owned by `_setActiveStep()` which keeps it on the currently
 * active step until the user completes it.
 * @param {string} selector - jQuery selector
 * @param {boolean} visible
 */
ZO.UI._applySection = function (selector, visible) {
    var $el = $(selector);
    if ($el.length === 0) return;
    var wasVisible = !!ZO.UI._lastVisible[selector];
    $el.toggle(visible);
    if (visible && !wasVisible) {
        if ($el[0] && typeof $el[0].scrollIntoView === 'function') {
            /* Respect user's motion preference to avoid disorientation */
            var reduceMotion = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            $el[0].scrollIntoView({
                behavior: reduceMotion ? 'auto' : 'smooth',
                block: 'center'
            });
        }
    }
    ZO.UI._lastVisible[selector] = visible;
};

/**
 * Computes which section ID is the current "active step" that needs
 * user action. Returns null if the wizard is complete or blocked on config.
 * @param {Object} f - flag map
 * @returns {string|null} section selector (e.g. '#actions-section')
 */
ZO.UI._computeActiveStep = function (f) {
    if (!f.hasConfig)          return null;                    // modal handles it
    if (!f.hasPolygon)         return '#zone-section';         // draw a polygon
    if (!f.hasExtraction)      return '#actions-section';      // extract segments
    if (!f.hasStartEnd)        return '#startend-section';     // place start/end
    if (!f.hasRoute)           return '#optimize-section';     // run optimize
    return null;                                               // wizard complete
};

/**
 * Toggles the `.highlight` class so ONLY the active-step section pulses,
 * continuously, until the user completes the step.
 * @param {string|null} selector
 */
ZO.UI._setActiveStep = function (selector) {
    if (ZO.UI._activeStep === selector) return;
    if (ZO.UI._activeStep) {
        $(ZO.UI._activeStep).removeClass('highlight').removeAttr('aria-current');
    }
    if (selector) {
        $(selector).addClass('highlight').attr('aria-current', 'step');
    }
    ZO.UI._activeStep = selector;
};

ZO.UI._activeStep = null;

/**
 * Updates the dynamic instructions text based on current wizard step.
 * @param {Object} f - flag map from _computeFlags()
 */
ZO.UI._updateInstructions = function (f) {
    var msg;
    if (!f.hasConfig)          msg = '1. Configure your Bemap credentials (Edit button).';
    else if (!f.hasPolygon)    msg = '2. Draw a polygon on the map to define the area.';
    else if (!f.hasExtraction) msg = '3. Click "Extract segments" to fetch the roads.';
    else if (!f.hasStartEnd)   msg = '4. Click on the map to place the start, then the end.';
    else if (!f.hasRoute)      msg = '5. Click "Optimize route".';
    else                       msg = 'Done! Animate the route or download the results.';
    $('#instructions-text').text(msg);
};

/**
 * Reads ZO.state and sets visibility of every dynamic section/button.
 * Safe to call unconditionally as often as needed.
 */
ZO.UI.refresh = function () {
    var f = ZO.UI._computeFlags();

    /* Sections */
    ZO.UI._applySection('#clear-all-section',  f.hasPolygon);
    ZO.UI._applySection('#zone-section',       f.hasConfig);
    ZO.UI._applySection('#options-section',    f.hasPolygon);
    ZO.UI._applySection('#actions-section',    f.hasPolygon);
    ZO.UI._applySection('#startend-section',   f.hasExtraction);
    ZO.UI._applySection('#optimize-section',   f.hasExtraction && f.hasStartEnd);
    ZO.UI._applySection('#animation-section',  f.hasRoute);
    ZO.UI._applySection('#layers-section',     f.hasRoute);
    /* Downloads only appear after a route has been calculated (ordered points exist). */
    ZO.UI._applySection('#downloads-section',  f.hasRoute && f.hasOrdered);

    /* Individual buttons */
    $('#extract-btn').prop('disabled', !f.hasPolygon);
    $('#download-btn').toggle(f.hasCsv);
    $('#clear-route-btn').toggle(f.hasStart || f.hasEnd);
    $('#optimize-btn').prop('disabled', !(f.hasExtraction && f.hasStartEnd));

    /* Active step: the ONE section that currently needs user attention.
     * It pulses continuously until the user completes the step. */
    ZO.UI._setActiveStep(ZO.UI._computeActiveStep(f));
    $('#animate-btn').toggle(f.hasRoute && !f.isAnimating);
    $('#stop-animate-btn').toggle(f.hasRoute && f.isAnimating);
    $('#toggle-traceroute-btn').toggle(f.hasTraceRoute);
    $('#download-segments-ordered-btn').toggle(f.hasRoute && f.hasCsv && f.hasOrdered);
    $('#download-min-wp-btn').toggle(f.hasRoute && f.hasOrdered && f.wantsMinimalWp && f.hasTraceRoute);

    /* Update instructions text */
    ZO.UI._updateInstructions(f);
};

/**
 * Full reset: removes polygon, clears every layer, resets state,
 * refreshes visibility. Equivalent to a page reload but keeps config.
 */
ZO.UI.clearAll = function () {
    var s = ZO.state;

    /* Stop animation first */
    if (s.animationInterval) {
        ZO.Animation.stop();
    }

    /* Remove the drawn polygon from the map (mirrors startDraw cleanup) */
    var prev = s.currentBemapPolygon;
    if (prev) {
        if (prev._vertexHandlesLayer) {
            ZO._map.native.removeLayer(prev._vertexHandlesLayer);
            prev._vertexHandlesLayer = null;
        }
        if (prev._editClickHandler && prev.native) {
            prev.native.off('click', prev._editClickHandler);
            prev._editClickHandler = null;
        }
        ZO._map.removePolygon(prev);
    }
    s.currentBemapPolygon = null;
    s.currentPolygon = null;

    /* Tear down extraction/routing/traceroute */
    ZO.Polygon.clearAllResults();

    /* Reset bbox panel */
    $('#bbox-info').html('<em>Click the button, then click on the map. Double-click to finish.</em>');

    ZO.UI.refresh();
};

/**
 * Initializes UI event handlers and applies initial visibility.
 */
ZO.UI.init = function () {
    $('#clear-all-btn').on('click', function () {
        if (!ZO.state.currentBemapPolygon) return;
        ZO.UI.clearAll();
    });

    /* Redraw visibility when minimal-waypoints checkbox changes */
    $('#minimal-waypoints').on('change', ZO.UI.refresh);

    ZO.UI.refresh();
};
