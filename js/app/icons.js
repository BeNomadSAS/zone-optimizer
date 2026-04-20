/* ======================================================================
 * ICONS - SVG data URLs for bemap.Icon
 *
 * Centralized icon factory. All application markers use these SVGs.
 * Palette (indigo-led):
 *   #4f46e5  indigo-600   (primary, route, numbered WPs)
 *   #6366f1  indigo-500   (accent, animation routing)
 *   #10b981  emerald-500  (start, extracted points)
 *   #ef4444  red-500      (end)
 *   #f43f5e  rose-500     (traceroute, animation trace)
 * ====================================================================== */

ZO.Icons = (function () {

    /**
     * Wraps SVG content in a data URL.
     * @param {string} inner - SVG inner content
     * @param {number} w - viewBox width
     * @param {number} h - viewBox height
     * @returns {string} data:image/svg+xml URL
     */
    function svg(inner, w, h) {
        return 'data:image/svg+xml;utf8,' + encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h +
            '" viewBox="0 0 ' + w + ' ' + h + '">' + inner + '</svg>'
        );
    }

    return {
        /** Start marker - emerald disc with white border */
        start: svg(
            '<circle cx="10" cy="10" r="7" fill="#10b981" stroke="#ffffff" stroke-width="3"/>',
            20, 20
        ),

        /** End marker - red disc with white border */
        end: svg(
            '<circle cx="10" cy="10" r="7" fill="#ef4444" stroke="#ffffff" stroke-width="3"/>',
            20, 20
        ),

        /** Extracted road point - small emerald circle */
        extractedPoint: svg(
            '<circle cx="6" cy="6" r="4" fill="#10b981" stroke="#064e3b" stroke-width="1.5"/>',
            12, 12
        ),

        /** TraceRoute waypoint - rose circle */
        traceWaypoint: svg(
            '<circle cx="8" cy="8" r="6" fill="#f43f5e" stroke="#ffffff" stroke-width="2"/>',
            16, 16
        ),

        /** Animation marker routing - indigo diamond with drop shadow */
        animRouting: svg(
            '<rect x="5.5" y="5.5" width="13" height="13" rx="1.5" ry="1.5"' +
            ' transform="rotate(45 12 12)"' +
            ' fill="#6366f1" stroke="#ffffff" stroke-width="3"' +
            ' style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.35));"/>' +
            '<circle cx="12" cy="12" r="2.2" fill="#ffffff"/>',
            24, 24
        ),

        /** Animation marker traceroute - rose diamond with drop shadow */
        animTrace: svg(
            '<rect x="5.5" y="5.5" width="13" height="13" rx="1.5" ry="1.5"' +
            ' transform="rotate(45 12 12)"' +
            ' fill="#f43f5e" stroke="#ffffff" stroke-width="3"' +
            ' style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.35));"/>' +
            '<circle cx="12" cy="12" r="2.2" fill="#ffffff"/>',
            24, 24
        ),

        /**
         * Numbered waypoint - indigo circle with number inside.
         * @param {number} n - number to display
         * @returns {string} SVG data URL
         */
        numberedWaypoint: function (n) {
            return svg(
                '<circle cx="14" cy="14" r="11" fill="#4f46e5" stroke="#ffffff" stroke-width="2"/>' +
                '<text x="14" y="18" text-anchor="middle" font-family="-apple-system,Segoe UI,sans-serif"' +
                ' font-size="11" font-weight="700" fill="#ffffff">' + n + '</text>',
                28, 28
            );
        }
    };
})();
