/**
 * BeNomad BeMap JavaScript API
 * @projectname BeNomad BeMap JavaScript API
 */

var bemap = bemap || {};

bemap.version = '2.0.0';
bemap.olVersion = '10.8.0';
bemap.maplibreVersion = '5.21.0';

/**
 * Extends the class declaration with the parent class.
 * @param {Class} child
 * @param {Class} parent
 */
bemap.inherits = function (child, parent) {
  child.prototype = Object.create(parent.prototype);
  child.prototype.constructor = child;
};

/**
 * Test if the object is inherits of the class (type).
 * @param {Object} obj The object.
 * @param {Class} type The inherits class model.
 * @return {boolean}
 */
bemap.inheritsof = function (obj, type) {
  // return obj.prototype.isPrototypeOf(type);
  return (obj instanceof type);
};

/**
 * Fill all fields of target object with source object.
 * Only the feilds of target class model are filled.
 * @param {Object} source Source object.
 * @param {Object} target Target object.
 */
bemap.fillFields = function (source, target) {
  for (var key in target) {
    var value = source[key];
    if (value) {
      target[key] = value;
    }
  }
};

/**
 * Get absolute path of current script.
 * @return {String} Retun absolute path of current script.
 */
bemap._getCurrentPath_cache = null;
bemap.getCurrentPath = function () {
  if (bemap._getCurrentPath_cache === null) {
    var scripts = document.getElementsByTagName('script');
    var path = scripts[scripts.length - 1].src.split('?')[0];
    bemap._getCurrentPath_cache = path.split('/').slice(0, -1).join('/') + '/';
  }
  return bemap._getCurrentPath_cache;
};

/**
 * Perform a Ajax request.
 * @param {String} method HTTP method (GET, POST).
 * @param {String} url URL of request.
 * @param {String|Object} data POST data of request, can by a string or javascript object. The javascript object will be converted in JSON string.
 * @param {String} success Callback if the request is executed with success.
 * @param {String} faild Callback if the request was failled.
 * @param {Object}options Options object.*
 * @param {Object} options.headers List of HTTP headers.
 * @param {Object} options.requestFormat mime type of predefined value, json, xml or urlencoded.
 */
bemap.ajax = function (method, url, data, success, failled, options) {
  var opt = options || {};
  var xhr = new XMLHttpRequest();
  var called = false;

  xhr.open(method, url, true);

  if (data instanceof Object && !(data instanceof FormData)) {
    data = JSON.stringify(data);
    if (!opt.requestFormat) {
      opt.requestFormat = "json";
    }
  }

  if (opt.responseType) {
    xhr.responseType = opt.responseType;
  }

  if (opt.requestFormat) {
    if (!opt.headers) {
      opt.headers = [];
    }

    if (opt.requestFormat == 'json') {
      opt.headers.push({ "key": "Content-Type", "value": "application/json" });
    } else if (opt.requestFormat == 'xml') {
      opt.headers.push({ "key": "Content-Type", "value": "text/xml" });
    } else if (opt.requestFormat == 'urlencoded') {
      opt.headers.push({ "key": "Content-Type", "value": "application/x-www-form-urlencoded" });
    } else {
      opt.headers.push({ "key": "Content-Type", "value": opt.requestFormat });
    }
  }

  if (opt.headers) {
    for (var i = 0; i < opt.headers.length; i++) {
      var header = opt.headers[i];
      xhr.setRequestHeader(header.key, header.value);
    }
  }

  xhr.onreadystatechange = function () {
    if (!called && (!this.readyState || xhr.readyState === 4 || this.readyState === 'complete' || this.readyState === 'loaded')) {
      called = true;
      var doc = xhr.response || xhr.responseText || xhr.responseXML;
      if (xhr.status == 200) {
        success(xhr, doc);
      } else {
        if (typeof (failled) === 'function') {
          failled(xhr, doc);
        }
        console.error("Status " + xhr.status, url);
      }
    }
  };

  xhr.send(data);
  return xhr;
};

/**
 * Load a JavaScript file.
 * @param {String} src Script name with path.
 * @param {Object} options
 */
bemap._require_cache = [];
bemap.require = function (src, options) {
  var key, inCacheSrc, found = false;

  for (key in bemap._require_cache) {
    inCacheSrc = bemap._require_cache[key];
    if (inCacheSrc == src) {
      found = true;
    }
  }

  if (!found) {
    var head = document.head || document.getElementsByTagName('HEAD').item(0) || document.documentElement;
    var tag = document.createElement('script');

    if (!head || !tag) {
      console.error("Unsupport browser!");
    }

    tag.type = 'text/javascript';
    if (src.charAt(0) == '/') {
      tag.src = src;
    } else {
      tag.src = this.getCurrentPath() + src;
    }

    var opt = options || {};
    if (typeof (opt.success) === 'function') {
      var called = false;
      tag.onload = tag.onreadystatechange = function () {
        if (!called && (!this.readyState || xhr.readyState === 4 || this.readyState === 'complete' || this.readyState === 'loaded')) {
          called = true;
          if (xhr.Status == 200) {
            opt.success(xhr, doc);
          } else {
            if (typeof (opt.faild) === 'function') {
              faild(xhr, doc);
            }
          }
        }
      };
    }

    tag.onerror = function () {
      console.error("Cannont load the library '" + src + "'");
    };

    head.appendChild(tag);
    bemap._require_cache.push(src);
  }
};

/**
 * @classdesc
 * Base class for Exception.
 *
 * @constructor
 * @param {String} message.
 * @param {bemap.Exception} cause.
 */
bemap.Exception = function (message, cause) {
  this.message = message;
  this.cause = cause ? cause : null;
};

/**
 * Return the message of exception.
 * @return {String} Return the message of exception.
 */
bemap.Exception.prototype.getMessage = function () {
  return this.message;
};

/**
 * Return the cause of exception.
 * @return {bemap.Exception} Return the cause of exception.
 */
bemap.Exception.prototype.getCause = function () {
  return this.cause;
};

/**
 * Return stack of exceptions.
 * @return {String} Return stack of exceptions.
 */
bemap.Exception.prototype.getStack = function () {
  var exception = this,
    stack = "";
  while (true) {
    stack = exception.message + "\n";
    if (exception.cause === null) {
      break;
    } else {
      exception = exception.cause;
    }
  }
  return stack;
};

/**
 * Print stack of exceptions.
 * @return {String} Print stack of exceptions.
 */
bemap.Exception.prototype.printStack = function () {
  console.error(this.getStack());
};

/**
 * @classdesc
 * Base class for Context.
 *
 * @constructor
 * @param {object} options.
 */
bemap.Context = function (options) {
  var opts = options || {};

  /**
   * Define the protocol used. The HTTP or HTTPS, by default the HTTP.
   * @protected
   * @type {string}
   */
  this.protocol = opts.secure ? 'https' : 'http';

  /**
   * Define the host name of BeMap server. By default "bemap-beta.benomad.com".
   * @protected
   * @type {string}
   */
  this.host = opts.host || 'bemap-beta.benomad.com';

  /**
   * Define the path of bgis context. The string must be start with / character. By default "/bgis/".
   * @protected
   * @type {string}
   */
  this.path = opts.path || '/bgis/';

  /**
   * Define the login.
   * @protected
   * @type {string}
   */
  this.login = opts.login;

  /**
   * Define the Password.
   * @protected
   * @type {string}
   */
  this.password = opts.password;

  /**
   * Heap cache of full URL to BeMap context.
   * @private
   * @type {string}
   */
  this.cacheBaseUrl = null;

  /**
   * Heap cache of base 64 authentication.
   * @private
   * @type {string}
   */
  this.cacheAuth = null;

  /**
   * Set the authentication parameters in POST data of request.
   * @private
   * @type {boolean}
   */
  this.authInPost = opts.authInPost ? true : false;

  /**
   * The default BeMap Geoserver
   * @private
   * @type {string}
   */
  this.geoserver = opts.geoserver ? opts.geoserver : undefined;
};

/**
 * Return the BaMap URL.
 * @return {String} BeMap URL
 */
bemap.Context.prototype.getBaseUrl = function () {
  if (!this.cacheBaseUrl) {
    this.cacheBaseUrl = this.protocol + "://" + this.host + this.path;
  }
  return this.cacheBaseUrl;
};

/**
 * Return the BaMap Authentication.
 * @return {String} BeMap URL
 */
bemap.Context.prototype.getAuthUrlParams = function () {
  if (this.login && this.password && !this.cacheAuth) {
    this.cacheAuth = "appid=" + this.login + "&appcode=" + this.password;
  }
  return this.cacheAuth;
};

/**
 * Set to true if the authentication parameters will be write in the POST data of request.
 */
bemap.Context.prototype.setAuthInPost = function (authInPost) {
  this.authInPost = authInPost;
};

/**
 * Return true if the authentication parameters will be write in the POST data of request.
 * @return {boolean} true if the authentication parameters will be write in the POST data of request..
 */
bemap.Context.prototype.isAuthInPost = function () {
  return this.authInPost;
};

/**
 * Return the default BaMap Geoserver of context.
 * @return {String} BeMap Geoserver
 */
bemap.Context.prototype.getGeoserver = function () {
  return this.geoserver;
};

/**
 * Perform a HTTP Post request.
 * @param {Object} options
 */
bemap.Context.prototype.post = function (options) {
  var opt = options || {};
  return this;
};

/**
 * BeNomad BeMap JavaScript API - Object class
 */

/**
 * @classdesc
 * Base class for Object.
 * @public
 * @constructor
 */
bemap.Object = function() {};

/**
 * BeNomad BeMap JavaScript API - Listener class
 */

/**
 * @classdesc
 * Base class for listener.
 * @public
 * @constructor
 * @param {object} options Options object.
 * @param {object} options.native native object.
 */
bemap.Listener = function(options) {
    var opts = options || {};

    /**
     * Native map browser event.
     * @type {Object}
     * @protected
     */
    this.native = opts.native ? opts.native : null;

    /**
     * @type {Function}
     * @protected
     */
    this.callback = opts.callback ? opts.callback : null;

    /**
     * @type {String}
     * @protected
     */
    this.key = opts.key ? opts.key : null;

    /**
     * @type {Object}
     * @protected
     */
     this.bemapObject = opts.bemapObject ? opts.bemapObject : null;
};

/**
 * BeNomad BeMap JavaScript API - Coordinate class
 */

/**
 * @classdesc
 * Base class for geographical coordinate.
 * @public
 * @constructor
 * @param {double} lon Longitude in degrees decimal (WGS84).
 * @param {double} lat Latitude in degrees decimal (WGS84).
 */
bemap.Coordinate = function(lon, lat) {
    /**
     * @type {double}
     * @protected
     */
    this.lon = lon ? lon : 0;

    /**
     * @type {double}
     * @protected
     */
    this.lat = lat ? lat : 0;
};

/**
 * Return an array of composed by latitude and longitude coordinate in degrees decimal (WGS84).
 * @public
 * @return {array} Return an array of composed by latitude and longitude coordinate in degrees decimal (WGS84).
 */
bemap.Coordinate.prototype.getLonLatArray = function() {
    return [this.lon, this.lat];
};

/**
 * Return an array of composed by longitude and latitude coordinate in degrees decimal (WGS84).
 * @public
 * @return {array} Return an array of composed by longitude and latitude coordinate in degrees decimal (WGS84).
 */
bemap.Coordinate.prototype.getLatLonArray = function() {
    return [this.lat, this.lon];
};

/* Getters and setters methods */

/**
 * Return the longitude coordinate in degrees decimal (WGS84).
 * @public
 * @return {double} Return the longitude coordinate in degrees decimal (WGS84).
 */
bemap.Coordinate.prototype.getLon = function() {
    return this.lon;
};

/**
 * Set the longitude coordinate in degrees decimal (WGS84).
 * @public
 * @param {double} lon Longitude in degrees decimal (WGS84).
 * @return {bemap.Coordinate} Return this.
 */
bemap.Coordinate.prototype.setLon = function(lon) {
    this.lon = lon;
    return this;
};

/**
 * Return the latitude coordinate in degrees decimal (WGS84).
 * @public
 * @return {double} Return the latitude coordinate in degrees decimal (WGS84).
 */
bemap.Coordinate.prototype.getLat = function() {
    return this.lat;
};

/**
 * Set the latitude coordinate in degrees decimal (WGS84).
 * @public
 * @param {double} lat Latitude in degrees decimal (WGS84).
 * @return {bemap.Coordinate} Return this.
 */
bemap.Coordinate.prototype.setLat = function(lat) {
    this.lat = lat;
    return this;
};

/**
 * BeNomad BeMap JavaScript API - Layer class
 */

/**
 * @classdesc
 * Base class for layer.
 * @public
 * @constructor
 * @param options.
 */
bemap.Layer = function(options) {
  var opts = options || {};

  /**
   * @protected
   */
  this.native = null;

  /**
   * @protected
   */
  this.map = null;

  /**
   * @protected
   */
  this.visible = true;

  /**
   * @protected
   */
  this.name = opts.name ? opts.name : null;

  /**
   * @protected
   */
  this.base = opts.base ? opts.base : false;

  /**
   * @type {Boolean}
   * @protected
   */
  this.transparent = opts.transparent ? opts.transparent : false;

  /**
   * minimal zoom level
   * @protected
   */
  this.minZoom = opts.minZoom ? opts.minZoom : 2;

  /**
   * maximal zoom level
   * @protected
   */
  this.maxZoom = opts.maxZoom ? opts.maxZoom : 20;

  /**
   * @protected
   */
  this.options = opts;
};

/**
 * @classdesc
 * Base class for OSM layer.
 * @public
 * @constructor
 * @param options.
 */
bemap.OsmLayer = function(options) {
  this.url = options ? options.url : 'false';

  bemap.Layer.call(this, options);
};
bemap.inherits(bemap.OsmLayer, bemap.Layer);

/**
 * @classdesc
 * Base class for WMS layer.
 * @public
 * @constructor
 * @param {Object} options See below the available values.
 * @param {String} options.layers Name of layers separated by comma.
 * @param {String} options.styles Name of styles separated by comma.
 */
bemap.WmsLayer = function(options) {
  var opts = options || {};

  this.url = opts.url ? opts.url : 'false';
  this.layers = opts.layers ? opts.layers : 'default';
  this.styles = opts.styles ? opts.styles : '';
  this.format = opts.format ? opts.format : null;

  bemap.Layer.call(this, options);
};
bemap.inherits(bemap.WmsLayer, bemap.Layer);

/**
 * @classdesc
 * Base class for BeMap layer.
 * @public
 * @constructor
 * @param {Object} options See below the available values.
 * @param {String} options.geoserver Name of BeMap Geoserver.
 * @param {String} options.layers Name of layers separated by comma.
 * @param {String} options.styles Name of styles separated by comma.
 */
bemap.BemapLayer = function(options) {
  var opts = options || {};

  this.url = opts.url ? opts.url : 'false';
  this.geoserver = opts.geoserver ? opts.geoserver : undefined;
  this.layers = opts.layers ? opts.layers : 'default';
  this.styles = opts.styles ? opts.styles : '';
  this.format = opts.format ? opts.format : null;

  bemap.Layer.call(this, options);
};
bemap.inherits(bemap.BemapLayer, bemap.Layer);

/**
 * @classdesc
 * Base class for Vector layer.
 * @public
 * @constructor
 * @param options.
 */
bemap.VectorLayer = function(options) {
  bemap.Layer.call(this, options);
};
bemap.inherits(bemap.VectorLayer, bemap.Layer);

/**
 *
 */
bemap.ClusterLayer = function(options) {
  var opts = options || {};

  this.distance = opts.distance ? opts.distance : 40;
  this.style = opts.style ? opts.style : new bemap.clusterStyle();

  bemap.Layer.call(this, options);
};
bemap.inherits(bemap.ClusterLayer, bemap.Layer);

/**
 * Remove the layer from the map.
 * @return {bemap.Layer} this.
 */
bemap.Layer.prototype.remove = function() {
  if (this.map !== null && bemap.inheritsof(this.map, bemap.Map)) {
    this.map.removeLayer(this);
  }
  return this;
};

/**
 * Clear all features from this layer.
 * Delegates to map.clearLayer(this).
 * @public
 * @return {bemap.Layer} this
 */
bemap.Layer.prototype.clear = function() {
  if (this.map !== null && bemap.inheritsof(this.map, bemap.Map)) {
    this.map.clearLayer(this);
  }
  return this;
};

/**
 * Remove all object from the layer.
 * @return {bemap.Layer} this.
 */
bemap.Layer.prototype.clear = function() {
  if (this.map !== null && this.native !== null) {
    this.map.clearLayer(this);
  }
  return this;
};

/**
 * Set the visibility of the layer.
 * @param {boolean} visible.
 * @return {bemap.Layer} this;
 */
bemap.Layer.prototype.setVisible = function(visible) {
  if (this.map !== null && bemap.inheritsof(this.map, bemap.Map)) {
    this.map.visibleLayer(this, visible);
    this.visible = visible;
  }
  return this;
};

/**
 * Return the visibility of the layer.
 * @return {boolean} visible.
 */
bemap.Layer.prototype.isVisible = function() {
  return this.visible;
};

/**
 * Set the visibility of the layer.
 * @param {boolean} zIndex.
 * @return {boolean} zIndex.
 */
bemap.Layer.prototype.setZIndex = function(zIndex) {
  if (this.map !== null && bemap.inheritsof(this.map, bemap.Map)) {
    this.map.zIndexLayer(this, zIndex);
    this.zIndex = zIndex;
  }
  return this;
};

/**
 *
  Set get feature info call back.
 * @param {object} options options.
 * @param {function} options.beforeCallback callback called at data reception and before display the popup.
 * @param {function} options.afterCallback callback called after display the popup.
 * @return {bemap.Listener} listener;
 */
bemap.Layer.prototype.onGetFeatureInfo = function(options) {
  if (this.map !== null && bemap.inheritsof(this.map, bemap.Map)) {
    return this.map.onGetFeatureInfo(this, options);
  }
  return new bemap.Listener();
};

/**
 * BeNomad BeMap JavaScript API - Map abstract class
 */

/**
 * @classdesc
 * Base class for map.
 * @public
 * @constructor
 * @abstract
 * @param {bemap.Context} context BeMap-JS-API Context.
 * @param {object} options.
 */
bemap.Map = function (context, options) {
  /**
   * @protected
   */
  this.ctx = context;

  /**
   * @protected
   */
  this.native = null;

  /**
   * @protected
   */
  this.layers = [];

  /**
   * @protected
   */
  this.events = [];

  if (context === undefined) {
    console.error("Context is required!");
    return;
  }

  /**
   * @protected
   */
  this.callback = [];
};

/**
 * Reserved name used to store the bemap object into the native properties of OpenLayers.
 */
bemap.Map.OWNREF = '__bemap_own_ref__';

/**
 * List of available layer name by default.
 * @public
 * @enum bemap.Map.DEFAULT_LAYER
 */
bemap.Map.DEFAULT_LAYER = {
  BACKGROUND: 'background',
  CIRCLE: 'circle',
  POLYGON: 'polygon',
  POLYLINE: 'polyline',
  MARKER: 'marker',
  ROUTE: 'route'
};

/**
 * List of available projections.
 * @public
 * @enum bemap.Map.PROJ
 */
bemap.Map.PROJ = {
  EPSG_WGS84: 'EPSG:4326',
  EPSG_MERCATOR: 'EPSG:3857'
};

bemap.Map.EventType = {
  LOAD: 'load',
  CHANGE: 'change',
  CHANGE_SIZE: 'change:size',
  CHANGE_VIEW: 'change:view',
  RESIZE: 'resize',
  CLICK: 'click',
  SINGLECLICK: 'singleclick',
  DBLCLICK: 'dblclick',
  MOVESTART: 'movestart',
  MOVEEND: 'moveend',
  POINTERUP: 'pointerup',
  POINTERDOWN: 'pointerdown',
  POINTERDRAG: 'pointerdrag',
  POINTERMOVE: 'pointermove',
  POSTCOMPOSE: 'postcompose',
  POSTRENDER: 'postrender',
  PRECOMPOSE: 'precompose',
  PROPERTYCHANGE: 'propertychange',
  WHEEL: 'wheel',
  KEYDOWN: 'keydown',
  KEYPRESS: 'keypress',
  TOUCHSTART: 'touchstart',
  TOUCHMOVE: 'touchmove',
  TOUCHEND: 'touchend',
  DRAWSTART: 'drawstart',
  DRAWEND: 'drawend',
  DRAWABORT: 'drawabort'
};

/**
 * Add default layers.
 * @public
 * @param {object} options
 * @param {boolean} options.markerAsCluster
 * @return {bemap.Map} this
 */
bemap.Map.prototype.defaultLayers = function (options) {
  var opts = options || {};

  this.addLayer(new bemap.BemapLayer({
    name: bemap.Map.DEFAULT_LAYER.BACKGROUND,
    styles: opts.styles ? opts.styles : '',
  }));

  this.defaultOverlayLayers();

  return this;
};

/**
 * Add default overlay layers, like dedicated for markers or polyline, etc.
 * @public
 * @param {object} options
 * @param {boolean} options.markerAsCluster
 * @return {bemap.Map} this
 */
bemap.Map.prototype.defaultOverlayLayers = function (options) {
  var opts = options || {};

  this.addLayer(new bemap.VectorLayer({
    name: bemap.Map.DEFAULT_LAYER.POLYGON
  }));

  this.addLayer(new bemap.VectorLayer({
    name: bemap.Map.DEFAULT_LAYER.CIRCLE
  }));

  this.addLayer(new bemap.VectorLayer({
    name: bemap.Map.DEFAULT_LAYER.ROUTE
  }));

  this.addLayer(new bemap.VectorLayer({
    name: bemap.Map.DEFAULT_LAYER.POLYLINE
  }));

  if (opts.markerAsCluster) {
    this.addLayer(new bemap.ClusterLayer({
      name: bemap.Map.DEFAULT_LAYER.MARKER
    }));
  } else {
    this.addLayer(new bemap.VectorLayer({
      name: bemap.Map.DEFAULT_LAYER.MARKER
    }));
  }

  return this;
};

/**
 * Create a background layer for each geoserver name.
 * @public
 * @param {array} geoservers List of geoserver name.
 * @return {bemap.Map} this
 */
bemap.Map.prototype.backgroundLayers = function (geoservers, options) {
  var opts = options ? options : {};
  for (var i = 0; i < geoservers.length; i++) {
    var geoserver = geoservers[i];
    var layer = new bemap.BemapLayer({
      name: bemap.Map.DEFAULT_LAYER.BACKGROUND + '_' + geoserver,
      styles: opts.styles ? opts.styles : '',
      geoserver: geoserver
    });

    this.addLayer(layer);

    if (i == 0) {
      layer.setVisible(true);
    } else {
      layer.setVisible(false);
    }
  }

  return this;
};

/**
 * Switch bytween several background layers.
 * @public
 * @param {String} geoserver Name of geoserver.
 * @return {bemap.Map} this
 */
bemap.Map.prototype.switchBackgroundLayer = function (geoserver) {
  var filter = bemap.Map.DEFAULT_LAYER.BACKGROUND + '_' + geoserver;
  for (var j = 0; j < this.layers.length; j++) {
    var layer = this.layers[j];
    if (layer.name.indexOf(bemap.Map.DEFAULT_LAYER.BACKGROUND) != 0) {
      continue;
    }
    if (layer.name == filter) {
      layer.setVisible(true);
    } else {
      layer.setVisible(false);
    }
  }

  return this;
};

/**
 * Add a layer to the map
 * @public
 * @param {bemap.Layer} layer
 * @param {object} options
 * @return {bemap.Map} this
 */
bemap.Map.prototype.addLayer = function (layer, options) {
  if (layer !== null && bemap.inheritsof(layer, bemap.Layer)) {
    this.layers.push(layer);
  }
  return this;
};

/**
 * Search the layer by name.
 * @public
 * @param {String} name of layer.
 * @return {bemap.Layer} Return the layer or null if not found.
 */
bemap.Map.prototype.getLayerByName = function (name) {
  var key, l;
  for (key in this.layers) {
    l = this.layers[key];
    if (l.name == name) {
      return l;
    }
  }
  return null;
};

/**
 * Return the satus of drag pan of map.
 * @public
 * @abstract
 * @param {Object} options.dragPan.
 * @return {boolean} true to enable the drag pan of map, otherwise false.
 */
bemap.Map.prototype.isDragPan = function (options) {
  return false;
};

/**
 * Enable or disable the drag pan of map.
 * @public
 * @abstract
 * @param {boolean} active true to enable the drag pan of map, otherwise false.
 * @param {Object} options.dragPan.
 * @return {bemap.Map} this
 */
bemap.Map.prototype.setDragPan = function (active, options) {
  return this;
};


/**
 * Move map to new coordinate.
 * @public
 * @abstract
 * @param {double} lon Longitude in degres decimal (WGS84).
 * @param {double} lat Latitude in degres decimal (WGS84).
 * @param {int} zoom Zoom level (optional).
 * @param {Object} options Options (optional).
 * @return {bemap.Map} this
 */
bemap.Map.prototype.move = function (lon, lat, zoom, options) {
  return this;
};

/**
 * Fly map to new coordinate.
 * @param {double} lon longitude
 * @param {double} lat latitude
 * @param {double} zoom zoom
 * @param {Object} options options
 */
bemap.Map.prototype.flyTo = function (lon, lat, zoom, options) {
  return this;
};

/**
 * Set the center and the zoom of the map to fit the bounding box.
 * @param {bemap.BoundingBox} boundingBox the bounding box to fit.
 * @param {Object} options Options (optional).
 * @return {bemap.Map} this.
 */
bemap.Map.prototype.moveToBoundingBox = function (boundingBox, options) {
  return this;
};

/**
 * Move map and zoom on data contains in layers.
 * @public
 * @abstract
 * @param {bemap.Layer} layer Layer.
 * @param {Object} options Options (optional).
 * @return {bemap.Map} this
 */
bemap.Map.prototype.moveToLayerData = function (layer, options) {
  return this;
};

/**
 * Zoom on map, set new zoom level.
 * @public
 * @abstract
 * @param {int} zoom Zoom level (optional).
 * @param {Object} options Options (optional).
 * @return {bemap.Map} this
 */
bemap.Map.prototype.zoom = function (zoom, options) {
  return this;
};

/**
 * Get current zoom of map.
 * @public
 * @return {int} -1 if not supported.
 */
bemap.Map.prototype.getZoom = function () {
  return -1;
};

/**
 * Rotation of map, set new angle of map.
 * @public
 * @abstract
 * @param {int} angle in degrees.
 * @param {Object} options Options (optional).
 * @return {bemap.Map} this
 */
bemap.Map.prototype.rotation = function (angle, options) {
  return this;
};

/**
 * Get current rotation angle of map.
 * @public
 * @return {int} -1 if not supported.
 */
bemap.Map.prototype.getRotation = function () {
  return -1;
};

/**
 * Refresh map.
 * @public
 * @abstract
 * @param {Object} options Options (optional).
 * @return {bemap.Map} this
 */
bemap.Map.prototype.refresh = function (options) {
  return this;
};

/**
 * Build icon resource.
 * @public
 * @abstract
 * @param {bemap.Icon} icon
 * @param {object} options
 * @return {bemap.Map} this
 */
bemap.Map.prototype.buildIcon = function (icon, options) {
  return this;
};

/**
 * Add a marker to the layer
 * @public
 * @abstract
 * @param {bemap.Marker} marker
 * @param {object} options
 * @return {bemap.Map} this
 */
bemap.Map.prototype.addMarker = function (marker, options) {
  return this;
};

/**
 * Remove a marker from the layer
 * @public
 * @abstract
 * @param {bemap.Marker} marker
 * @return {bemap.Map} this
 */
bemap.Map.prototype.removeMarker = function (marker) {
  return this;
};

/**
 * Add a multipoint to the layer
 * @public
 * @abstract
 * @param {bemap.MultiPoint} multipoint
 * @param {object} options
 * @return {bemap.Map} this
 */
bemap.Map.prototype.addMultiMarker = function (multipoint, options) {
  return this;
};

/**
 * Remove a multimarker from the layer
 * @public
 * @abstract
 * @param {bemap.MultiMarker} multimarker
 * @return {bemap.Map} this
 */
bemap.Map.prototype.removeMultimarker = function (multimarker) {
  return this;
};

/**
 * Build LineStyle resource.
 * @public
 * @abstract
 * @param {bemap.LineStyle} LineStyle
 * @param {object} options
 * @return {bemap.Map} this
 */
bemap.Map.prototype.buildLineStyle = function (style, options) {
  return this;
};

/**
 * Add a Polyline to the layer
 * @public
 * @abstract
 * @param {bemap.Polyline} Polyline
 * @param {object} options
 * @return {bemap.Map} this
 */
bemap.Map.prototype.addPolyline = function (multiline, options) {
  return this;
};

/**
 * Remove a polyline from the layer
 * @public
 * @abstract
 * @param {bemap.Polyline} polyline
 * @return {bemap.Map} this
 */
bemap.Map.prototype.removePolyline = function (polyline) {
  return this;
};

/**
 * Refresh all objects from a layer.
 * @public
 * @param {bemap.Layer} layer the layer object to refresh.
 * @return {bemap.Map} this
 */
bemap.Map.prototype.refreshLayer = function (layer) {
  return this;
};

/**
 * Remove all objects from a layer.
 * @public
 * @abstract
 * @param {bemap.Layer} layer the layer object to clear.
 * @return {bemap.Map} this
 */
bemap.Map.prototype.clearLayer = function (layer) {
  return this;
};

/**
 * Set the visibility of the layer.
 * @public
 * @abstract
 * @param {bemap.Layer} layer the layer of wich to set the visibility.
 * @param {boolean} visible.
 * @return {bemap.Map} return this.
 */
bemap.Map.prototype.visibleLayer = function (layer, visible) {
  return this;
};

/**
 * Set the zIndex of the layer.
 * @public
 * @abstract
 * @param {bemap.Layer} layer the layer of wich to set the zIndex.
 * @param {boolean} zIndex.
 * @return {bemap.Map} return this.
 */
bemap.Map.prototype.zIndexLayer = function (layer, zIndex) {
  return this;
};

/**
 * Remove a layer from the map.
 * @public
 * @abstract
 * @param {bemap.Layer} layer layer to remove from the map.
 * @return {bemap.Map} this.
 */
bemap.Map.prototype.removeLayer = function (layer) {
  return this;
};

/**
 * Set the listner when an specified eventType occur on bemap.Map.
 * @public
 * @abstract
 * @param {bemap.Map.EventType} eventType Event type.
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options options.
 * @return {bemap.Listener} this.
 */
bemap.Map.prototype.on = function (eventType, callback, options) {
  return new bemap.Listener();
};

/**
 * Set the listner when an specified eventType occur on bemap.Marker.
 * @public
 * @abstract
 * @param {bemap.Marker} marker
 * @param {bemap.Map.EventType} eventType Event type.
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options options.
 * @return {bemap.Listener} this.
 */
bemap.Map.prototype.onMarker = function (marker, eventType, callback, options) {
  return new bemap.Listener();
};

/**
 * Set the listner when an specified eventType occur on all bemap.Marker.
 * @public
 * @abstract
 * @param {bemap.Map.EventType} eventType Event type.
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options options.
 * @return {bemap.Listener} this.
 */
bemap.Map.prototype.onMarkers = function (eventType, callback, options) {
  return new bemap.Listener();
};

/**
 * Set the listner when an specified eventType occur on all bemap.MultiMarker.
 * @public
 * @abstract
 * @param {bemap.Map.EventType} eventType Event type.
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options options.
 * @return {bemap.Listener} this.
 */
bemap.Map.prototype.onMultiMarkers = function (eventType, callback, options) {
  return new bemap.Listener();
};

/**
 * Set the listner when an specified eventType occur on bemap.Polyline.
 * @public
 * @abstract
 * @param {bemap.Polyline} polyline
 * @param {bemap.Map.EventType} eventType Event type.
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options options.
 * @return {bemap.Listener} this.
 */
bemap.Map.prototype.onPolyline = function (polyline, eventType, callback, options) {
  return new bemap.Listener();
};

/**
 * Set the listner when an specified eventType occur on all bemap.Polyline.
 * @public
 * @abstract
 * @param {bemap.Map.EventType} eventType Event type.
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options options.
 * @return {bemap.Listener} this.
 */
bemap.Map.prototype.onPolylines = function (eventType, callback, options) {
  return new bemap.Listener();
};

/**
 * Set get feature info call back.
 * @param {bemap.Layer} layer set the bemap layer.
 * @param {object} options options.
 * @param {function} options.beforeCallback callback called at data reception and before display the popup.
 * @param {function} options.afterCallback callback called after display the popup.
 * @return {bemap.Listener} listener;
 */
bemap.Map.prototype.onGetFeatureInfo = function (layer, options) {
  console.warn("onGetFeatureInfo is not supported by this browser");
  return new bemap.Listener();
};

/**
 * Define the draggable capability for bemap.Marker.
 * @protected
 * @param {bemap.Marker} marker bemap object.
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options Options.
 * @param {bemap.Layer} options.layerFilter set the bemap layer used as filter.
 * @return {bemap.Listener} bemap.listener.
 */
bemap.Map.prototype.draggableMarker = function (marker, callback, options) {
  return new bemap.Listener();
};

/**
 * Define the draggable capability for all bemap.Marker.
 * @protected
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options Options.
 * @param {bemap.Layer} options.layerFilter set the bemap layer used as filter.
 * @return {bemap.Listener} bemap.listener.
 */
bemap.Map.prototype.draggableMarkers = function (callback, options) {
  return new bemap.Listener();
};

/**
 * Define the draggable capability for all bemap.MultiMarkers.
 * @protected
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options Options.
 * @param {bemap.Layer} options.layerFilter set the bemap layer used as filter.
 * @return {bemap.Listener} bemap.listener.
 */
bemap.Map.prototype.draggableMultiMarkers = function (callback, options) {
  return new bemap.Listener();
};

/**
 * Define the draggable capability for bemap.Polyline.
 * @protected
 * @param {bemap.Polyline} polyline bemap object.
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options Options.
 * @param {bemap.Layer} options.layerFilter set the bemap layer used as filter.
 * @return {bemap.Listener} bemap.listener.
 */
bemap.Map.prototype.draggablePolyline = function (polyline, callback, options) {
  return new bemap.Listener();
};

/**
 * Define the draggable capability for all bemap.Polyline.
 * @protected
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options Options.
 * @param {bemap.Layer} options.layerFilter set the bemap layer used as filter.
 * @return {bemap.Listener} bemap.listener.
 */
bemap.Map.prototype.draggablePolylines = function (callback, options) {
  return new bemap.Listener();
};

/**
 * Add a popup to the map
 * @public
 * @param {bemap.Popup} popup
 * @param {object} options
 * @return {bemap.Map} this
 */
bemap.Map.prototype.addPopup = function (popup, options) {
  return this;
};

/**
 * Remove a popup from the map.
 * @public
 * @param {bemap.Popup} popup the popup to remove from the map.
 * @return {bemap.Map} this;
 */
bemap.Map.prototype.removePopup = function (popup) {
  return this;
};

/**
 * Set the visiblility of the popup.
 * @param {bemap.Popup} popup the popup.
 * @param {Boolean} visible true for visible and false for hidden.
 * @return {bemap.Popup} this.
 */
bemap.Map.prototype.setVisiblePopup = function (popup, visible) {
  return this;
};

/**
 * Remove all the popups from the map.
 * @return {bemap.Map} this;
 */
bemap.Map.prototype.clearPopup = function () {
  return this;
};

/**
 * Set the coordinate of the popup.
 * @param {bemap.Popup} popup the popup of wich to set the coordinate.
 * @param {bemap.Coordinate} coordinate the new coordinate.
 * @param {object} options Options.
 * @param {bemap.Layer} options.panningMap enable the map panning animation. move map from the current position to the popup anchor at the center of map.
 * @return {bemap.Map} this.
 */
bemap.Map.prototype.setCoordinatePopup = function (popup, coordinate, options) {
  return this;
};

/**
 * Get the center of the map in bemap.Coordinate.
 * @return {bemap.Coordinate} the center of the map.
 */
bemap.Map.prototype.getCenter = function () {
  return new bemap.Coordinate();
};

/**
 * Get the limits of the map on the current zoom.
 * @return {bemap.BoundingBox} the bounding box containing the limits.
 */
bemap.Map.prototype.getBoundingBox = function () {
  return new bemap.BoundingBox();
};

// --- MapLibre-exclusive features (no-op defaults for OlMap/LeafletMap) ---

/**
 * Set the pitch (tilt) angle of the map in degrees. MapLibre only.
 * @param {number} pitch Pitch angle (0-85).
 * @return {bemap.Map} this
 */
bemap.Map.prototype.setPitch = function (pitch) { return this; };

/**
 * Get the current pitch angle. MapLibre only.
 * @return {number} pitch in degrees (0 if not supported).
 */
bemap.Map.prototype.getPitch = function () { return 0; };

/**
 * Set the bearing (compass rotation) of the map. MapLibre only.
 * @param {number} bearing Bearing in degrees (0-360).
 * @return {bemap.Map} this
 */
bemap.Map.prototype.setBearing = function (bearing) { return this; };

/**
 * Get the current bearing. MapLibre only.
 * @return {number} bearing in degrees (0 if not supported).
 */
bemap.Map.prototype.getBearing = function () { return 0; };

/**
 * Enable 3D terrain rendering. MapLibre only.
 * @param {object} options terrain options (source, exaggeration).
 * @return {bemap.Map} this
 */
bemap.Map.prototype.setTerrain = function (options) { return this; };

/**
 * Disable 3D terrain. MapLibre only.
 * @return {bemap.Map} this
 */
bemap.Map.prototype.removeTerrain = function () { return this; };

/**
 * Set map projection ('mercator' or 'globe'). MapLibre only.
 * @param {string} type projection type.
 * @return {bemap.Map} this
 */
bemap.Map.prototype.setProjection = function (type) { return this; };

/**
 * Set sky/atmosphere effects. MapLibre only.
 * @param {object} options sky options.
 * @return {bemap.Map} this
 */
bemap.Map.prototype.setSky = function (options) { return this; };

/**
 * Set the map style URL or object. MapLibre only.
 * @param {string|object} style Style URL or JSON object.
 * @return {bemap.Map} this
 */
bemap.Map.prototype.setStyle = function (style) { return this; };

/**
 * Add a GeoJSON data source. MapLibre only.
 * @param {string} id Source identifier.
 * @param {object} data GeoJSON data.
 * @return {bemap.Map} this
 */
bemap.Map.prototype.addGeoJsonSource = function (id, data) { return this; };

/**
 * Update an existing GeoJSON source data. MapLibre only.
 * @param {string} id Source identifier.
 * @param {object} data New GeoJSON data.
 * @return {bemap.Map} this
 */
bemap.Map.prototype.updateGeoJsonSource = function (id, data) { return this; };

/**
 * Register a custom image for use in symbol layers. MapLibre only.
 * @param {string} id Image identifier.
 * @param {object} image Image data.
 * @return {bemap.Map} this
 */
bemap.Map.prototype.addImage = function (id, image) { return this; };

/**
 * Remove a registered image. MapLibre only.
 * @param {string} id Image identifier.
 * @return {bemap.Map} this
 */
bemap.Map.prototype.removeImage = function (id) { return this; };

/**
 * Instant camera change with pitch/bearing support. MapLibre only.
 * @param {object} options center, zoom, pitch, bearing.
 * @return {bemap.Map} this
 */
bemap.Map.prototype.jumpTo = function (options) { return this; };

/**
 * Smooth animated camera transition. MapLibre only.
 * @param {object} options center, zoom, pitch, bearing, duration.
 * @return {bemap.Map} this
 */
bemap.Map.prototype.easeTo = function (options) { return this; };

/**
 * Query rendered features at a point or in a box. MapLibre only.
 * @param {object} point Screen point or bounding box.
 * @param {object} options Query options (layers, filter).
 * @return {Array} Array of feature objects.
 */
bemap.Map.prototype.queryRenderedFeatures = function (point, options) { return []; };

/**
 * Add polygon to the map.
 * @param {bemap.Polygon} polygon
 * @param {object} options
 * @return {bemap.Map} this
 */
bemap.Map.prototype.addPolygon = function (polygon, options) { return this; };

/**
 * Remove polygon from the map.
 * @param {bemap.Polygon} polygon
 * @return {bemap.Map} this
 */
bemap.Map.prototype.removePolygon = function (polygon) { return this; };

/**
 * Add circle to the map.
 * @param {bemap.Circle} circle
 * @param {object} options
 * @return {bemap.Map} this
 */
bemap.Map.prototype.addCircle = function (circle, options) { return this; };

/**
 * Remove circle from the map.
 * @param {bemap.Circle} circle
 * @return {bemap.Map} this
 */
bemap.Map.prototype.removeCircle = function (circle) { return this; };

// --- Advanced MapLibre features (no-ops for OlMap/LeafletMap) ---

/**
 * Add 3D extruded buildings. MapLibre only.
 * @param {object} options Building configuration.
 * @return {bemap.Map} this
 */
bemap.Map.prototype.add3DBuildings = function (options) { console.warn('add3DBuildings() is only available with bemap.MapLibreMap'); return this; };
bemap.Map.prototype.remove3DBuildings = function () { console.warn('remove3DBuildings() is only available with bemap.MapLibreMap'); return this; };
bemap.Map.prototype.addHeatmap = function (layer) { console.warn('addHeatmap() is only available with bemap.MapLibreMap'); return this; };
bemap.Map.prototype.removeHeatmap = function (layer) { console.warn('removeHeatmap() is only available with bemap.MapLibreMap'); return this; };
bemap.Map.prototype.updateHeatmap = function (layer, data) { console.warn('updateHeatmap() is only available with bemap.MapLibreMap'); return this; };
bemap.Map.prototype.animateAlongRoute = function (options) { console.warn('animateAlongRoute() is only available with bemap.MapLibreMap'); return { stop: function(){}, resume: function(){} }; };

/**
 * Set 3D light position and properties. MapLibre only.
 * @param {object} options Light options (position, color, intensity, anchor).
 * @return {bemap.Map} this
 */
bemap.Map.prototype.setLight = function (options) { console.warn('setLight() is only available with bemap.MapLibreMap'); return this; };
bemap.Map.prototype.loadPMTiles = function (layer, callback) { console.warn('loadPMTiles() is only available with bemap.MapLibreMap'); return this; };
bemap.Map.prototype.loadBeMapTiles = function (options) { console.warn('loadBeMapTiles() is only available with bemap.MapLibreMap'); return this; };

/**
 * Draw a polygon interactively. User clicks vertices, double-clicks to finish.
 * @public
 * @param {Object} options See below.
 * @param {bemap.PolygonStyle} options.style Style for the preview polygon.
 * @param {function} callback Called with bemap.MapEvent when drawing is complete. evt.bemapObject = bemap.Polygon.
 * @return {bemap.Listener}
 */
bemap.Map.prototype.drawPolygon = function (options, callback) { return new bemap.Listener(); };
bemap.Map.prototype.drawPolyline = function (options, callback) { return new bemap.Listener(); };
bemap.Map.prototype.drawRectangle = function (options, callback) { return new bemap.Listener(); };
bemap.Map.prototype.drawCircle = function (options, callback) { return new bemap.Listener(); };
bemap.Map.prototype.drawMarker = function (options, callback) { return new bemap.Listener(); };
bemap.Map.prototype.cancelDraw = function () { return this; };
bemap.Map.prototype.editPolygon = function (polygon, callback) { return new bemap.Listener(); };

/**
 * Add a drawing toolbar to the map.
 * @public
 * @param {Object} options See below.
 * @param {boolean} options.polygon Enable polygon drawing (default: true).
 * @param {boolean} options.polyline Enable polyline drawing (default: false).
 * @param {boolean} options.rectangle Enable rectangle drawing (default: false).
 * @param {boolean} options.circle Enable circle drawing (default: false).
 * @param {boolean} options.marker Enable marker drawing (default: false).
 * @param {String} options.position Toolbar position: 'topright','topleft','bottomright','bottomleft' (default: 'topright').
 * @param {function} options.onDrawEnd Callback when a shape is drawn.
 * @return {bemap.Map} this
 */
bemap.Map.prototype.addDrawControl = function(options) {
  var opts = options || {};
  var _this = this;

  // Get the map container
  var container = typeof this.target === 'string' ? document.getElementById(this.target) : this.target;
  if (!container) return this;

  // Remove existing toolbar
  if (this._drawToolbar) {
    this._drawToolbar.parentNode.removeChild(this._drawToolbar);
    this._drawToolbar = null;
  }

  var pos = opts.position || 'topright';
  var toolbar = document.createElement('div');
  toolbar.className = 'bemap-draw-toolbar bemap-draw-' + pos;
  toolbar.style.cssText = 'position:absolute;z-index:1000;display:flex;flex-direction:column;gap:2px;padding:4px;background:rgba(255,255,255,0.95);border-radius:4px;box-shadow:0 2px 6px rgba(0,0,0,0.3);';

  if (pos.indexOf('top') > -1) toolbar.style.top = '10px';
  else toolbar.style.bottom = '10px';
  if (pos.indexOf('right') > -1) toolbar.style.right = '10px';
  else toolbar.style.left = '10px';

  // Track drawn shapes so the Clear button can remove them
  if (!this._drawnShapes) this._drawnShapes = [];
  var _self = this;
  var userCallback = opts.onDrawEnd || function() {};
  var drawCallback = function(evt) {
    if (evt && evt.bemapObject && _self._drawnShapes.indexOf(evt.bemapObject) === -1) {
      _self._drawnShapes.push(evt.bemapObject);
    }
    userCallback(evt);
  };

  var btnStyle = 'border:none;padding:6px 10px;border-radius:3px;cursor:pointer;font-size:12px;font-weight:600;display:flex;align-items:center;gap:4px;';

  // Helper: prevents button click from bubbling to the map
  var stopBubble = function(handler) {
    return function(evt) {
      if (evt) { evt.stopPropagation(); evt.preventDefault(); }
      // Delay so the map click doesn't fire in the same cycle
      setTimeout(handler, 0);
    };
  };

  if (opts.polygon !== false) {
    var btnPoly = document.createElement('button');
    btnPoly.innerHTML = '&#9650; Polygon';
    btnPoly.style.cssText = btnStyle + 'background:#27ae60;color:#fff;';
    btnPoly.title = 'Draw polygon';
    btnPoly.onclick = stopBubble(function() { _this.drawPolygon(opts, drawCallback); });
    toolbar.appendChild(btnPoly);
  }

  if (opts.polyline) {
    var btnLine = document.createElement('button');
    btnLine.innerHTML = '&#9135; Line';
    btnLine.style.cssText = btnStyle + 'background:#3498db;color:#fff;';
    btnLine.title = 'Draw polyline';
    btnLine.onclick = stopBubble(function() { _this.drawPolyline(opts, drawCallback); });
    toolbar.appendChild(btnLine);
  }

  if (opts.rectangle) {
    var btnRect = document.createElement('button');
    btnRect.innerHTML = '&#9633; Rectangle';
    btnRect.style.cssText = btnStyle + 'background:#9b59b6;color:#fff;';
    btnRect.title = 'Draw rectangle';
    btnRect.onclick = stopBubble(function() { _this.drawRectangle(opts, drawCallback); });
    toolbar.appendChild(btnRect);
  }

  if (opts.circle) {
    var btnCirc = document.createElement('button');
    btnCirc.innerHTML = '&#9675; Circle';
    btnCirc.style.cssText = btnStyle + 'background:#e67e22;color:#fff;';
    btnCirc.title = 'Draw circle';
    btnCirc.onclick = stopBubble(function() { _this.drawCircle(opts, drawCallback); });
    toolbar.appendChild(btnCirc);
  }

  if (opts.marker) {
    var btnMark = document.createElement('button');
    btnMark.innerHTML = '&#128204; Marker';
    btnMark.style.cssText = btnStyle + 'background:#e74c3c;color:#fff;';
    btnMark.title = 'Place marker';
    btnMark.onclick = stopBubble(function() { _this.drawMarker(opts, drawCallback); });
    toolbar.appendChild(btnMark);
  }

  // Clear button — removes all drawn shapes and cancels current draw
  var btnClear = document.createElement('button');
  btnClear.innerHTML = '&#128465; Clear';
  btnClear.style.cssText = btnStyle + 'background:#95a5a6;color:#fff;';
  btnClear.title = 'Clear all drawn shapes';
  btnClear.onclick = stopBubble(function() {
    _this.cancelDraw();
    if (_this._drawnShapes) {
      _this._drawnShapes.forEach(function(shape) {
        try {
          if (bemap.inheritsof(shape, bemap.Polygon)) _this.removePolygon(shape);
          else if (bemap.inheritsof(shape, bemap.Polyline)) _this.removePolyline(shape);
          else if (bemap.inheritsof(shape, bemap.Circle)) _this.removeCircle(shape);
          else if (bemap.inheritsof(shape, bemap.Marker)) _this.removeMarker(shape);
        } catch(e) {}
      });
      _this._drawnShapes = [];
    }
  });
  toolbar.appendChild(btnClear);

  container.style.position = 'relative';
  container.appendChild(toolbar);
  this._drawToolbar = toolbar;
  return this;
};
bemap.Map.prototype.addRasterLayer = function (layer) { console.warn('addRasterLayer() is only available with bemap.MapLibreMap'); return this; };
bemap.Map.prototype.addClusterPoints = function (layer, points, options) { console.warn('addClusterPoints() is only available with bemap.MapLibreMap'); return this; };
bemap.Map.prototype.animateLine = function (options) { console.warn('animateLine() is only available with bemap.MapLibreMap'); return { stop: function(){}, resume: function(){} }; };
bemap.Map.prototype.animateCameraOrbit = function (options) { console.warn('animateCameraOrbit() is only available with bemap.MapLibreMap'); return { stop: function(){}, resume: function(){} }; };
bemap.Map.prototype.animatePulse = function (options) { console.warn('animatePulse() is only available with bemap.MapLibreMap'); return { stop: function(){}, remove: function(){} }; };
bemap.Map.prototype.spinGlobe = function (options) { console.warn('spinGlobe() is only available with bemap.MapLibreMap'); return { stop: function(){}, resume: function(){} }; };

/**
 * BeNomad BeMap JavaScript API - Map - OpenLayers v10
 */

/**
 * @classdesc
 * Base class for OpenLayers.
 * @public
 * @constructor
 * @extends {bemap.Map}
 * @param {bemap.Context} context BeMap-JS-API Context.
 * @param {string} target HTML element.
 * @param options.
 */
bemap.OlMap = function (context, target, options) {
  /**
    * @protected
    */
  this.target = target;

  bemap.Map.call(this, context, options);

  var opts = options || {};

  this.native = new ol.Map({
    target: target,
    view: new ol.View({
      projection: bemap.Map.PROJ.EPSG_MERCATOR,
      center: [0, 0],
      zoom: opts.zoom || 3,
      minZoom: opts.minZoom !== undefined ? opts.minZoom : 3,
      maxZoom: opts.maxZoom !== undefined ? opts.maxZoom : 20,
      constrainRotation: opts.constrainRotation !== undefined ? opts.constrainRotation : true,
      enableRotation: opts.enableRotation !== undefined ? opts.enableRotation : false
    })
  });

  // OL v5+ natively fires 'movestart' on the map — no hack needed
};
bemap.inherits(bemap.OlMap, bemap.Map);

/**
 * Sotre the bemap object into the native OpenLayers properties.
 * @protected
 * @param {Object} bemapObject a bemap object like bemap.marker, bemap.multimarker or bemap.polyline.
 */
bemap.OlMap.prototype._addOwnToProperties = function (bemapObject) {
  var props = bemapObject.native.getProperties() || {};
  props[bemap.Map.OWNREF] = bemapObject;
  bemapObject.native.setProperties(props);
};

/**
 * Get the bemap object from the native OpenLayers properties.
 * @protected
 * @param {Object} olObject native Openlayers object like ol.Feature.
 * @return {Object} a bemap object like bemap.marker, bemap.multimarker or bemap.polyline.
 */
bemap.OlMap.prototype._getOwnFromProperties = function (olObject) {
  var props = olObject.getProperties();
  var ownRef = props[bemap.Map.OWNREF];
  if (ownRef === undefined) {
    props = props.features[0].getProperties();
    ownRef = props[bemap.Map.OWNREF];
  }
  return ownRef;
};

/**
 * @protected
 * @param {double} lon Longitude in degres decimal (WGS84).
 * @param {double} lat Latitude in degres decimal (WGS84).
 */
bemap.OlMap.prototype._fromLonLat = function (lon, lat) {
  return ol.proj.transform([lon, lat], bemap.Map.PROJ.EPSG_WGS84, this.native.getView().getProjection());
};

/**
 * @protected
 * @param {array} coordinate Array contains the longitude and latitude in format of OpenLayers Map object.
 * @return {array} Array contains the longitude and latitude in degres decimal (WGS84).
 */
bemap.OlMap.prototype._fromNativeToLonLat = function (coordinate) {
  var coords = ol.proj.transform(coordinate, this.native.getView().getProjection(), bemap.Map.PROJ.EPSG_WGS84);
  return new bemap.Coordinate(coords[0], coords[1]);
};

/**
 * Add a layer to the OpenLayers map.
 * @public
 * @param {bemap.Layer} layer
 * @param {object} options
 * @return {bemap.OlMap} this
 */
bemap.OlMap.prototype.addLayer = function (layer, options) {
  if (layer !== null && bemap.inheritsof(layer, bemap.Layer)) {
    if (bemap.inheritsof(layer, bemap.BemapLayer)) {
      layer.native = new ol.layer.Tile({
        source: new ol.source.TileWMS({
          url: this.ctx.getBaseUrl() + 'wms?' + this.ctx.getAuthUrlParams(),
          params: {
            'geoserver': layer.geoserver ? layer.geoserver : this.ctx.getGeoserver(),
            'LAYERS': layer.layers ? layer.layers : 'default',
            'STYLES': layer.styles ? layer.styles : '',
            'TILED': true,
            'TRANSPARENT': layer.transparent === true ? true : false,
            'FORMAT': layer.format ? layer.format : 'image/png'
          }
        })
      });

    } else if (bemap.inheritsof(layer, bemap.WmsLayer)) {
      layer.native = new ol.layer.Tile({
        source: new ol.source.TileWMS({
          url: layer.url,
          params: {
            'LAYERS': layer.layers ? layer.layers : '',
            'STYLES': layer.styles ? layer.styles : '',
            'TILED': layer.tiled === true ? true : false,
            'TRANSPARENT': layer.transparent === true ? true : false,
            'FORMAT': layer.format ? layer.format : 'image/png'
          }
        })
      });

    } else if (bemap.inheritsof(layer, bemap.OsmLayer)) {
      layer.native = new ol.layer.Tile({
        source: new ol.source.OSM()
      });

    } else if (bemap.inheritsof(layer, bemap.VectorLayer)) {
      layer.native = new ol.layer.Vector({
        source: new ol.source.Vector({
          features: []
        })
      });

    } else if (bemap.inheritsof(layer, bemap.ClusterLayer)) {
      var source = new ol.source.Vector({
        features: []
      });

      var clusterSource = new ol.source.Cluster({
        distance: layer.distance,
        source: source
      });

      var c = layer.style;

      layer.native = new ol.layer.Vector({
        source: clusterSource,
        style: function (feature, resolution) {
          var size = feature.get('features').length;
          var style;
          if (size > 1) {
            style = new ol.style.Style({
              image: new ol.style.Circle({
                radius: c.size,
                stroke: new ol.style.Stroke({
                  width: c.borderSize,
                  color: c.borderColor.getRgbaArray()
                }),
                fill: new ol.style.Fill({
                  color: c.color.getRgbaArray()
                })
              }),
              text: new ol.style.Text({
                text: size.toString(),
                fill: new ol.style.Fill({
                  color: c.textColor.getRgbaArray()
                }),
                scale: c.textSize
              })
            });
          } else {
            style = new ol.style.Style({
              image: new ol.style.Icon({
                anchor: [c.icon.anchorX, c.icon.anchorY],
                anchorXUnits: c.icon.anchorXUnits,
                anchorYUnits: c.icon.anchorYUnits,
                src: c.icon.src,
                scale: c.icon.scale
              })
            });
          }
          return style;
        }
      });

      var _view = this.native.getView();
      _view.on('change:resolution', function () {
        if (_view.getResolution() <= 0.14929107086948487) {
          clusterSource.setDistance(0);
        } else {
          clusterSource.setDistance(40);
        }
      });

      // Click on cluster → zoom in
      var _nativeMap = this.native;
      var _clusterLayer = layer;
      this.native.on('click', function(evt) {
        _nativeMap.forEachFeatureAtPixel(evt.pixel, function(feature, clickedLayer) {
          if (clickedLayer === _clusterLayer.native) {
            var features = feature.get('features');
            if (features && features.length > 1) {
              var extent = ol.extent.createEmpty();
              for (var fi = 0; fi < features.length; fi++) {
                ol.extent.extend(extent, features[fi].getGeometry().getExtent());
              }
              _nativeMap.getView().fit(extent, { duration: 500, padding: [50, 50, 50, 50] });
            }
          }
        });
      });

    } else {
      console.warn("Unsupport layer");
    }

    if (layer.native !== null) {
      bemap.OlMap.prototype._addOwnToProperties(layer);
      this.native.addLayer(layer.native);
      bemap.Map.prototype.addLayer.call(this, layer);
    }
  }

  if (layer.map === null) {
    layer.map = this;
  }


  return this;
};

bemap.OlMap.prototype._getDragPan = function () {
  var dragPan = null;
  this.native.getInteractions().forEach(function (interaction) {
    if (interaction instanceof ol.interaction.DragPan) {
      dragPan = interaction;
    }
  });
  return dragPan;
};

/**
 * Return the satus of drag pan of map.
 * @public
 * @abstract
 * @param {Object} options.dragPan.
 * @return {boolean} true to enable the drag pan of map, otherwise false.
 */
bemap.OlMap.prototype.isDragPan = function (options) {
  var dragPan = options && options.dragPan ? options.dragPan : null;
  if (dragPan === null) {
    dragPan = this._getDragPan();
  }
  if (dragPan) {
    return dragPan.getActive();
  }
  return false;
};

/**
 * Enable or diable the drag pan of map.
 * @public
 * @abstract
 * @param {boolean} active true to enable the drag pan of map, otherwise false.
 * @param {Object} options.dragPan.
 * @return {bemap.OlMap} this
 */
bemap.OlMap.prototype.setDragPan = function (active, options) {
  var dragPan = options && options.dragPan ? options.dragPan : null;
  if (dragPan === null) {
    dragPan = this._getDragPan();
  }
  if (dragPan) {
    dragPan.setActive(active);
  }
  return this;
};

/**
 * Move map to new coordinate.
 * @public
 * @param {double} lon Longitude in degres decimal (WGS84).
 * @param {double} lat Latitude in degres decimal (WGS84).
 * @param {int} zoom Zoom level (optional).
 * @param {Object} options Options (optional).
 * @param {String} options.animate Enable the animation.
 * @param {String} options.fly Enable the animation (same as animate).
 * @return {bemap.OlMap} this
 */
bemap.OlMap.prototype.move = function (lon, lat, zoom, options) {
  var view = this.native.getView();

  if (zoom) {
    view.setZoom(zoom);
  }

  if (options && (options.animate || options.fly)) {
    view.animate({
      center: this._fromLonLat(lon, lat),
      duration: 2000
    });
  } else {
    view.setCenter(this._fromLonLat(lon, lat));
  }

  return this;
};

/**
 * Set the center and the zoom of the map to fit the bounding box.
 * @param {bemap.BoundingBox} boundingBox the bounding box to fit.
 * @return {bemap.OlMap} this.
 */
bemap.OlMap.prototype.moveToBoundingBox = function (boundingBox, options) {
  if (boundingBox && bemap.inheritsof(boundingBox, bemap.BoundingBox) && boundingBox.maxLon && boundingBox.maxLat && boundingBox.minLon && boundingBox.minLat) {
    var ext = [boundingBox.minLon, boundingBox.minLat, boundingBox.maxLon, boundingBox.maxLat];
    ext = ol.proj.transformExtent(ext, bemap.Map.PROJ.EPSG_WGS84, this.native.getView().getProjection());
    this.native.getView().fit(ext);
  }
  return this;
};

/**
 * Move map and zoom on data contains in layers.
 * @public
 * @abstract
 * @param {bemap.Layer} layer Layer.
 * @param {Object} options Options (optional).
 * @return {bemap.Map} this
 */
bemap.OlMap.prototype.moveToLayerData = function (layer, options) {
  var extent = null;
  if (layer && bemap.inheritsof(layer, bemap.ClusterLayer)) {
    extent = layer.native.getSource().getSource().getExtent();
  } else if (layer && bemap.inheritsof(layer, bemap.Layer)) {
    extent = layer.native.getSource().getExtent();
  }
  if (extent) {
    this.native.getView().fit(extent);
  }
  return this;
};

/**
 * Zoom on map, set new zoom level.
 * @public
 * @param {int} zoom Zoom level (optional).
 * @param {Object} options Options (optional).
 * @return {bemap.OlMap} this
 */
bemap.OlMap.prototype.zoom = function (zoom, options) {
  this.native.getView().setZoom(zoom);
  return this;
};

/**
 * Get current zoom level of map.
 * @public
 * @return {int} current zoom level of map.
 */
bemap.OlMap.prototype.getZoom = function () {
  return this.native.getView().getZoom();
};

/**
 * Rotation of map, set new angle of map.
 * @public
 * @param {int} angle in degrees.
 * @param {Object} options Options (optional).
 * @return {bemap.OlMap} this
 */
bemap.OlMap.prototype.rotation = function (angle, options) {
  var angleRadian = angle * (Math.PI / 180);
  this.native.getView().setRotation(angleRadian);
  return this;
};

/**
 * Get current rotation angle of map.
 * @public
 * @return {int} current rotation angle of map in degrees.
 */
bemap.OlMap.prototype.getRotation = function () {
  return this.native.getView().getRotation();
};

/**
 * Refresh map.
 * @public
 * @abstract
 * @param {Object} options Options (optional).
 * @return {bemap.OlMap} this
 */
bemap.OlMap.prototype.refresh = function (options) {
  this.native.updateSize();
  this.native.render();
  return this;
};

/**
 * Build icon resource.
 * @public
 * @param {bemap.Icon} icon
 * @param {object} options
 * @return {bemap.OlMap} this
 */
bemap.OlMap.prototype.buildIcon = function (icon, options) {
  if (icon !== null && bemap.inheritsof(icon, bemap.Icon)) {
    icon.native = new ol.style.Icon({
      anchor: [icon.anchorX, icon.anchorY],
      anchorXUnits: (icon.anchorXUnits && icon.anchorXUnits !== '') ? icon.anchorXUnits : 'fraction',
      anchorYUnits: (icon.anchorYUnits && icon.anchorYUnits !== '') ? icon.anchorYUnits : 'fraction',
      src: icon.src,
      opacity: icon.opacity ? icon.opacity : 1,
      scale: icon.scale ? icon.scale : 1
    });
  }
  return this;
};

/**
 * Build text style resource.
 * @public
 * @param {bemap.TextStyle} text style object.
 * @param {String} name Name (label) of marker.
 * @param {object} options
 * @return {bemap.OlMap} this
 */
bemap.OlMap.prototype.buildTextStyle = function (textStyle, name, options) {
  if (textStyle && bemap.inheritsof(textStyle, bemap.TextStyle)) {
    var nativeOpts = {
      text: name,
      offsetX: textStyle.getOffsetX(),
      offsetY: textStyle.getOffsetY(),
      scale: textStyle.getSize(),
      fill: new ol.style.Fill({
        color: textStyle.getColor().getRgbArray()
      })
    };

    if (textStyle.getBorderWidth() > 0) {
      nativeOpts.stroke = new ol.style.Stroke({
        color: textStyle.getBorderColor().getRgbArray(),
        width: textStyle.getBorderWidth()
      });
    }

    textStyle.native = new ol.style.Text(nativeOpts);
  }
  return this;
};

/**
 * Build lineStyle resource.
 * @public
 * @param {bemap.LineStyle} lineStyle
 * @param {object} options
 * @return {bemap.OlMap} this
 */
bemap.OlMap.prototype.buildLineStyle = function (style, options) {
  if (style !== null && bemap.inheritsof(style, bemap.LineStyle)) {
    style.native = new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: [style.color.getRed(), style.color.getGreen(), style.color.getBlue(), style.color.getAlpha()],
        width: style.width,
        lineDash: style.type === bemap.LineStyle.TYPE.DASH ? [10] : style.type === bemap.LineStyle.TYPE.DOT_DASH ? [0.1, 10, 10] : style.type === bemap.LineStyle.TYPE.DOT ? [0.1, 10] : []
      }),
    });
  }
  return this;
};

/**
 * Build polygonStyle resource.
 * @public
 * @param {bemap.PolygonStyle} polygonStyle
 * @param {object} options
 * @return {bemap.OlMap} this
 */
bemap.OlMap.prototype.buildPolygonStyle = function (style, options) {
  if (style !== null && bemap.inheritsof(style, bemap.PolygonStyle)) {
    var fc = style.fillColor;
    var bc = style.borderColor;
    style.native = new ol.style.Style({
      fill: new ol.style.Fill({
        color: [fc.getRed(), fc.getGreen(), fc.getBlue(), fc.getAlpha()]
      }),
      stroke: new ol.style.Stroke({
        color: [bc.getRed(), bc.getGreen(), bc.getBlue(), bc.getAlpha()],
        width: style.borderWidth,
        lineDash: style.borderType === bemap.PolygonStyle.TYPE.DASH ? [10] : style.borderType === bemap.PolygonStyle.TYPE.DOT_DASH ? [0.1, 10, 10] : style.borderType === bemap.PolygonStyle.TYPE.DOT ? [0.1, 10] : []
      }),
    });
  }
  return this;
};

/**
 * Build circleStyle resource.
 * @public
 * @param {bemap.CircleStyle} circleStyle
 * @param {object} options
 * @return {bemap.OlMap} this
 */
bemap.OlMap.prototype.buildCircleStyle = function (style, options) {
  if (style !== null && bemap.inheritsof(style, bemap.CircleStyle)) {
    var fc = style.fillColor;
    var bc = style.borderColor;
    style.native = new ol.style.Style({
      fill: new ol.style.Fill({
        color: [fc.getRed(), fc.getGreen(), fc.getBlue(), fc.getAlpha()]
      }),
      stroke: new ol.style.Stroke({
        color: [bc.getRed(), bc.getGreen(), bc.getBlue(), bc.getAlpha()],
        width: style.borderWidth,
        lineDash: style.borderType === bemap.CircleStyle.TYPE.DASH ? [10] : style.borderType === bemap.CircleStyle.TYPE.DOT_DASH ? [0.1, 10, 10] : style.borderType === bemap.CircleStyle.TYPE.DOT ? [0.1, 10] : []
      }),
    });
  }
  return this;
};

/**
 * Refresh all objects from a layer.
 * @public
 * @param {bemap.Layer} layer the layer object to refresh.
 * @return {bemap.OlMap} this
 */
bemap.OlMap.prototype.refreshLayer = function (layer) {
  if (layer !== null && bemap.inheritsof(layer, bemap.Layer)) {
    if (layer.native.getSource && layer.native.getSource()) {
      layer.native.getSource().changed();
    }
  }
  return this;
};

/**
 * Remove all objects from a layer.
 * @public
 * @param {bemap.Layer} layer the layer object to clear.
 * @return {bemap.OlMap} this
 */
bemap.OlMap.prototype.clearLayer = function (layer) {
  if (layer !== null && bemap.inheritsof(layer, bemap.ClusterLayer)) {
    layer.native.getSource().getSource().clear();
  } else if (layer !== null && bemap.inheritsof(layer, bemap.Layer)) {
    layer.native.getSource().clear();
  }
  return this;
};

/**
 * Set the visibility of the layer.
 * @public
 * @param {bemap.Layer} layer the layer of wich to set the visibility.
 * @param {boolean} visible.
 * @return {bemap.OlMap} return this.
 */
bemap.OlMap.prototype.visibleLayer = function (layer, visible) {
  if (visible !== null && layer !== null && bemap.inheritsof(layer, bemap.Layer)) {
    layer.native.setVisible(visible);
    layer.visible = visible;
  }
  return this;
};

/**
 * Set the zIndex of the layer.
 * @public
 * @param {bemap.Layer} layer the layer of wich to set the zIndex.
 * @param {boolean} zIndex.
 * @return {bemap.OlMap} return this.
 */
bemap.OlMap.prototype.zIndexLayer = function (layer, zIndex) {
  if (zIndex !== null && layer !== null && bemap.inheritsof(layer, bemap.Layer)) {
    layer.native.setZIndex(zIndex);
    layer.zIndex = zIndex;
  }
  return this;
};

/**
 * Remove a layer from the map.
 * @param {bemap.Layer} layer layer to remove from the map.
 * @return {bemap.OlMap} this.
 */
bemap.OlMap.prototype.removeLayer = function (layer) {
  if (layer !== null && bemap.inheritsof(layer, bemap.Layer)) {
    this.native.removeLayer(layer.native);
    layer.map = null;
  }
  return this;
};

/**
 * Check the event mode.
 * @protected
 * @param {object} mode enable modes.
 * @param {object} bemapObject bemap object like bemap.Marker, bemap.Polyline, etc.
 * @param {object} declaredObj bemap object like bemap.Marker, bemap.Polyline, etc.
 * @return {function}
 */
bemap.OlMap.prototype._checkModeOfEvent = function (mode, bemapObject, eventType) {
  if (bemapObject && bemapObject.callback && bemapObject.callback[eventType] && typeof bemapObject.callback[eventType] === "function") {
    return bemapObject.callback[eventType];
  }
  if (this.events) {
    if (this.events[eventType + "markers"] && this.events[eventType + "markers"].callback && typeof this.events[eventType + "markers"].callback === "function" && bemap.inheritsof(bemapObject, bemap.Marker)) {
      return this.events[eventType + "markers"].callback;
    }
    if (this.events[eventType + "multiMarkers"] && this.events[eventType + "multiMarkers"].callback && typeof this.events[eventType + "multiMarkers"].callback === "function" && bemap.inheritsof(bemapObject, bemap.MultiMarker)) {
      return this.events[eventType + "multiMarkers"].callback;
    }
    if (this.events[eventType + "polylines"] && this.events[eventType + "polylines"].callback && typeof this.events[eventType + "polylines"].callback === "function" && bemap.inheritsof(bemapObject, bemap.Polyline)) {
      return this.events[eventType + "polylines"].callback;
    }
  }
  if (bemapObject && bemapObject.events.draggable && bemapObject.callback.draggable && typeof bemapObject.callback.draggable === "function") {
    return bemapObject.callback.draggable;
  }
  return null;
};

/**
 * Set the listner when a specified eventType occur on OpenLayers Feature object.
 * @protected
 * @param {bemap.Marker} marker
 * @param {bemap.Map.EventType} eventType Event type.
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options options.
 * @param {object} mode Mode of slection feature.
 * @return {bemap.Listener} listener.
 */
bemap.OlMap.prototype._onFeature = function (declaredObj, eventType, callback, options, mode) {
  var opts = options ? options : {};

  var layerFilterCallback = function (layer) {
    if (opts.layerFilter) {
      return layer === opts.layerFilter.native;
    } else {
      return true;
    }
  };

  var nativeListener;
  var _this = this;

  if (!this.events[eventType]) {
    nativeListener = this.native.on(eventType, function (evt) {
      var feature = null;
      if (evt.pixel !== undefined)
        feature = _this.native.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
          return feature;
        }, { layerFilter: layerFilterCallback });
      var bemapObject;
      if (feature) {
        bemapObject = bemap.OlMap.prototype._getOwnFromProperties(feature);
      } else {
        bemapObject = _this;
      }
      var mapEvent = new bemap.MapEvent({
        native: evt,
        bemapObject: bemapObject,
        x: evt.pixel !== undefined ? evt.pixel[0] : undefined,
        y: evt.pixel !== undefined ? evt.pixel[1] : undefined,
        coordinate: evt.coordinate !== undefined ? _this._fromNativeToLonLat(evt.coordinate) : undefined,
        properties: options,
        map: _this
      });
      callback = _this._checkModeOfEvent(mode, bemapObject, eventType);
      if (callback) {
        return callback(mapEvent);
      }
    });
  } else {
    nativeListener = this.events[eventType].native;
  }

  var listener = new bemap.Listener({
    native: nativeListener,
    callback: callback,
    key: eventType,
    bemapObject: declaredObj
  });

  this.events[eventType] = listener;

  if (declaredObj && mode.singleFeature && typeof callback === "function") {
    declaredObj.callback[eventType] = callback;
  } else if (!declaredObj && mode.markers && typeof callback === "function") {
    this.events[eventType + "markers"] = new bemap.Listener({
      callback: callback,
      key: eventType + "markers"
    });
    return this.events[eventType + "markers"];
  } else if (!declaredObj && mode.multiMarkers && typeof callback === "function") {
    this.events[eventType + "multiMarkers"] = new bemap.Listener({
      callback: callback,
      key: eventType + "multiMarkers"
    });
    return this.events[eventType + "multiMarkers"];
  } else if (!declaredObj && mode.polylines && typeof callback === "function") {
    this.events[eventType + "polylines"] = new bemap.Listener({
      callback: callback,
      key: eventType + "polylines"
    });
    return this.events[eventType + "polylines"];
  }

  return listener;
};

/**
 * Set the listner when an specified eventType occur on bemap.OlMap.
 * @public
 * @param {bemap.Map.EventType} eventType Event type.
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options options.
 * @return {bemap.Listener} listner.
 */
bemap.OlMap.prototype.on = function (eventType, callback, options) {
  return this._onFeature(this, eventType, callback, options, {
    singleFeature: true
  });
};

/**
 * Set get feature info call back.
 * @param {bemap.Layer} layer set the bemap layer.
 * @param {object} options options.
 * @param {function} options.beforeCallback callback called at data reception and before display the popup.
 * @param {function} options.afterCallback callback called after display the popup.
 * @param {function} options.panningMap enable the map panning animation. move map from the current position to the popup anchor at the center of map.
 * @return {bemap.Listener} listner;
 */
bemap.OlMap.prototype.onGetFeatureInfo = function (layer, options) {
  var opts = options ? options : {};
  var popup = new bemap.Popup({
    information: "<p>onGetFeatureInfo</p>",
    coordinate: new bemap.Coordinate(0, 0),
    visible: false
  });
  this.addPopup(popup);

  var listener = this.on(bemap.Map.EventType.SINGLECLICK, function (evt) {
    var url = layer.native
      .getSource()
      .getGetFeatureInfoUrl(
        evt.native.coordinate,
        evt.native.map.getView().getResolution(),
        evt.native.map.getView().getProjection(), {
        'INFO_FORMAT': 'text/xml',
        'propertyName': 'NAME,AREA_CODE,DESCRIPTIO'
      }
      );

    bemap.ajax('GET', url, null, function (xhr, data) {
      evt.listener = listener;
      evt.popup = popup;
      evt.xhr = xhr;
      evt.data = data;
      evt.showPopup = true;

      var info = data;
      if (opts.beforeCallback) {
        info = opts.beforeCallback(evt, opts);
      }

      if (evt.showPopup) {
        popup.setInformation(info).setCoordinate(evt.coordinate, opts);

        if (opts.afterCallback) {
          opts.afterCallback(evt, opts);
        }
      }
    });
  });

  listener.popup = popup;
  return listener;
};

/**
 * Define the draggable capability for bemap object (like bemap.Marker,  bemap.MultiMarker, bemap.Polyline, etc.).
 * @protected
 * @param {Object} declaredObj bemap object like bemap.Marker,  bemap.MultiMarker, bemap.Polyline, etc.
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options Options.
 * @param {bemap.Layer} options.layerFilter set the bemap layer used as filter.
 * @param {object} mode Mode of slection feature.
 * @return {bemap.Listener} Listener.
 */
bemap.OlMap.prototype._draggableFeature = function (declaredObj, callback, options, mode) {
  var _this = this,
    opts = options ? options : {},
    startPixel, startCoordinate, previousCoordinate,
    cursor = 'pointer',
    previousCursor, feature = null;

  var layerFilterCallback = function (layer) {
    if (opts.layerFilter) {
      return layer === opts.layerFilter.native;
    } else {
      return true;
    }
  };

  if (declaredObj && !declaredObj.events.draggable) {
    declaredObj.events.draggable = true;
    declaredObj.callback.draggable = callback;
  }

  if (!this.events.dragFeature) {
    var downFunc = function (evt) {
      var foundFeature = evt.map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
        var bemapObject = _this._getOwnFromProperties(feature);
        if (_this._checkModeOfEvent(mode, bemapObject, 'draggable')) {
          return feature;
        }
      }, { layerFilter: layerFilterCallback });

      if (foundFeature) {
        startPixel = evt.pixel;
        startCoordinate = evt.coordinate;
        previousCoordinate = evt.coordinate;
        feature = foundFeature;
        return true;
      }

      return false;
    },
      dragFunc = function (evt) {
        if (feature) {
          feature.getGeometry().translate(evt.coordinate[0] - previousCoordinate[0], evt.coordinate[1] - previousCoordinate[1]);
          previousCoordinate = evt.coordinate;

          var bemapObject = bemap.OlMap.prototype._getOwnFromProperties(feature);
          if (bemapObject) {
            var newCoords = feature.getGeometry().getCoordinates(),
              newCoord;

            if (bemap.inheritsof(bemapObject, bemap.Marker)) {
              newCoord = _this._fromNativeToLonLat(newCoords);
              bemapObject.setCoordinate(bemapObject.getCoordinate().setLon(newCoord.getLon()).setLat(newCoord.getLat()));

            } else if (bemap.inheritsof(bemapObject, bemap.MultiMarker) || bemap.inheritsof(bemapObject, bemap.Polyline)) {
              var bemapObjCoords = bemapObject.getCoordinates();
              for (var i = 0; i < newCoords.length; i++) {
                newCoord = _this._fromNativeToLonLat(newCoords[i]);
                bemapObjCoords[i].setLon(newCoord.getLon()).setLat(newCoord.getLat());
              }
            }
          }
        }
      },
      moveFunc = function (evt) {
        if (cursor) {
          var nativeMap = evt.map;
          var foundFeature = nativeMap.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
            var bemapObject = _this._getOwnFromProperties(feature);
            if (_this._checkModeOfEvent(mode, bemapObject, 'draggable')) {
              return feature;
            }
          }, { layerFilter: layerFilterCallback });

          var element = nativeMap.getTargetElement();
          if (foundFeature) {
            if (element.style.cursor != cursor) {
              previousCursor = element.style.cursor;
              element.style.cursor = cursor;
            }
          } else if (previousCursor !== undefined) {
            element.style.cursor = previousCursor;
            previousCursor = undefined;
          }
        }
      },
      upFunc = function (evt) {
        if (evt.pixel[0] == startPixel[0] && evt.pixel[1] == startPixel[1]) {
          return false;
        }
        var mapEvent = new bemap.MapEvent({
          native: evt,
          bemapObject: bemap.OlMap.prototype._getOwnFromProperties(feature),
          x: evt.pixel[0],
          y: evt.pixel[1],
          coordinate: _this._fromNativeToLonLat(evt.coordinate),
          startX: startPixel[0],
          startY: startPixel[1],
          startCoordinate: _this._fromNativeToLonLat(evt.coordinate),
          properties: options
        });

        feature = null;
        callback = _this._checkModeOfEvent(mode, mapEvent.bemapObject, 'draggable');
        if (callback) {
          callback(mapEvent);
        }

        return false;
      };

    var pointerInteraction = new ol.interaction.Pointer({
      handleDownEvent: downFunc,
      handleDragEvent: dragFunc,
      handleMoveEvent: moveFunc,
      handleUpEvent: upFunc
    });

    var nativeListener = this.native.addInteraction(pointerInteraction);

    this.events.dragFeature = new bemap.Listener({
      native: pointerInteraction,
      key: "dragFeature",
      bemapObject: declaredObj
    });

    return this.events.dragFeature;
  }
  return this.events.dragFeature;
};

/**
 * Remove listener.
 * @protected
 * @param {bemap.Listener} listener Function will be called when the specified eventType is occur.
 * @param {object} options Options.
 * @return {bemap.OlMap} this.
 */
bemap.OlMap.prototype.removeListener = function (listener, options) {
  if (listener && bemap.inheritsof(listener, bemap.Listener)) {
    if (listener.bemapObject) {
      if (listener.key == "dragFeature") {
        listener.bemapObject.events.draggable = false;
        listener.bemapObject.callback.draggable = null;
      } else {
        listener.bemapObject.callback[listener.key] = null;
      }
    }
    // ol.Observable.unByKey(listener.native);
    // this.native.removeInteraction(listener.native);
    // this.events[listener.key] = null;
  }
  return this;
};

/**
 * Get the center of the map in bemap.Coordinate.
 * @return {bemap.Coordinate} the center of the map.
 */
bemap.OlMap.prototype.getCenter = function () {
  var center = this.native.getView().getCenter();
  center = this._fromNativeToLonLat(center);
  return center;
};

/**
 * Get the limits of the map on the current zoom.
 * @return {bemap.BoundingBox} the bounding box containing the limits.
 */
bemap.OlMap.prototype.getBoundingBox = function () {
  var extent = this.native.getView().calculateExtent(this.native.getSize());
  extent = ol.proj.transformExtent(extent, this.native.getView().getProjection(), bemap.Map.PROJ.EPSG_WGS84);
  return new bemap.BoundingBox(extent[0], extent[1], extent[2], extent[3]);
};

/**
 * Get the pixel coordinate from bemap coordinate.
 * @return {Array} the corresponding XY coords.
 */
bemap.OlMap.prototype.getXYFromCoordinate = function (coordinate) {
  return this.native.getPixelFromCoordinate(
    ol.proj.transform(coordinate.getLonLatArray(), bemap.Map.PROJ.EPSG_WGS84, this.native.getView().getProjection())
  );
};

/**
 * Fly map to new coordinate.
 * @param {double} lon longitude
 * @param {double} lat latitude
 * @param {double} zoom zoom
 * @param {Object} options options
 */
bemap.OlMap.prototype.flyTo = function (lon, lat, zoom, options) {
  var view = this.native.getView();
  var duration = 2000;
  if (options && options.duration) {
    duration = options.duration;
  }
  var parts = 2;
  var called = false;
  function callback(complete) {
    --parts;
    if (called) {
      return;
    }
    if (parts === 0 || !complete) {
      called = true;
      if (options && options.listener) {
        options.listener(complete);
      }
    }
  }
  view.animate(
    {
      center: this._fromLonLat(lon, lat),
      duration: duration,
    },
    callback
  );
  view.animate(
    {
      zoom: zoom - 1,
      duration: duration / 2,
    },
    {
      zoom: zoom,
      duration: duration / 2,
    },
    callback
  );
}

/**
 * BeNomad BeMap JavaScript API - Map - OpenLayers v3
 */

//bemap.require('ol.js');

/**
 * @classdesc
 * Base class for OpenLayers v3.
 * @public
 * @constructor
 * @extends {bemap.Map}
 * @param {bemap.Context} context BeMap-JS-API Context.
 * @param {string} target HTML element.
 * @param options.
 */
bemap.Ol3Map = function(context, target, options) {
  bemap.OlMap.call(this, context, target, options);
};
bemap.inherits(bemap.Ol3Map, bemap.OlMap);

/**
 * BeNomad BeMap JavaScript API - Map - Leaflet
 */

//bemap.require('leaflet.js');

/**
 * @classdesc
 * Base class for Leaflet.
 * @public
 * @constructor
 * @extends {bemap.Map}
 * @param {bemap.Context} context BeMap-JS-API Context.
 * @param {string} target HTML element.
 * @param options.
 */
bemap.LeafletMap = function (context, target, options) {
  /**
   * @protected
   */
  this.target = target;

  bemap.Map.call(this, context, options);

  /**
   * @protected
   */
  this.native = L.map(target, options).setView([0, 0], 2);

  // overload the pointer events
  bemap.Map.EventType.POINTERUP = 'mouseup';
  bemap.Map.EventType.POINTERDOWN = 'mousedown';
  bemap.Map.EventType.POINTERMOVE = 'mouseover';
};
bemap.inherits(bemap.LeafletMap, bemap.Map);


/**
 * Add a layer to the Leaflet map.
 * @public
 * @param {bemap.Layer} layer
 * @param {object} options
 * @return {bemap.LeafletMap} this
 */
bemap.LeafletMap.prototype.addLayer = function (layer, options) {
  if (layer !== null && bemap.inheritsof(layer, bemap.Layer)) {
    if (bemap.inheritsof(layer, bemap.BemapLayer)) {
      var layerOption = {
        minZoom: layer.minZoom ? layer.minZoom : 2,
        maxZoom: layer.maxZoom ? layer.maxZoom : 20,
        'geoserver': layer.geoserver ? layer.geoserver : this.ctx.getGeoserver(),
        'layers': layer.layers ? layer.layers : 'default',
        'styles': layer.styles ? layer.styles : '',
        'tiled': true,
        'TRANSPARENT': layer.transparent === true ? true : false,
        format: layer.format ? layer.format : 'image/png'
      };

      if (this.ctx.login) {
        layerOption.appid = this.ctx.login;
      }
      if (this.ctx.password) {
        layerOption.appcode = this.ctx.password;
      }

      layer.native = L.tileLayer.wms(this.ctx.getBaseUrl() + 'wms', layerOption);

    } else if (bemap.inheritsof(layer, bemap.WmsLayer)) {
      layer.native = L.tileLayer.wms(layer.url, {
        minZoom: layer.minZoom ? layer.minZoom : 2,
        maxZoom: layer.maxZoom ? layer.maxZoom : 20,
        'geoserver': layer.geoserver ? layer.geoserver : this.ctx.getGeoserver(),
        'layers': layer.layers ? layer.layers : 'default',
        'styles': layer.styles ? layer.styles : '',
        'tiled': true,
        'TRANSPARENT': layer.transparent === true ? true : false,
        format: layer.format ? layer.format : 'image/png'
      });

    } else if (bemap.inheritsof(layer, bemap.OsmLayer)) {
      console.warn("TODO OsmLayer");

    } else if (bemap.inheritsof(layer, bemap.VectorLayer)) {
      layer.native = L.layerGroup();

    } else if (bemap.inheritsof(layer, bemap.ClusterLayer)) {
      layer.native = new L.MarkerClusterGroup({
        showCoverageOnHover: false
        //Icon Style
        /*iconCreateFunction: function(cluster) {
          return L.divIcon({
            html: cluster.getChildCount(),
            className: 'mycluster',
            iconSize: null
          });

        }*/
      });

    } else {
      console.warn("Unsupport layer");
    }

    if (layer.native !== null) {
      // TODO
      //bemap.OlMap.prototype._addOwnToProperties(layer);

      layer.native.addTo(this.native);
      bemap.Map.prototype.addLayer.call(this, layer);
    }
  }

  if (layer.map === null) {
    layer.map = this;
  }

  return this;
};

/**
 * Move map to new coordinate.
 * @public
 * @param {double} lon Longitude in degres decimal (WGS84).
 * @param {double} lat Latitude in degres decimal (WGS84).
 * @param {int} zoom Zoom level (optional).
 * @param {Object} options Options (optional).
 * @param {String} options.animate Enable the animation.
 * @param {String} options.fly Enable the animation (same as animate).
 * @return {bemap.LeafletMap} this
 */
bemap.LeafletMap.prototype.move = function (lon, lat, zoom, options) {
  if (zoom) {
    this.native.setView([lat, lon], zoom);
  } else {
    this.native.setView([lat, lon]);
  }

  return this;
};

/**
 * Fly map to new coordinate.
 * @param {double} lon longitude
 * @param {double} lat latitude
 * @param {double} zoom zoom
 * @param {Object} options options
 */
bemap.LeafletMap.prototype.flyTo = function (lon, lat, zoom, options) {
  if (zoom) {
    this.native.flyTo([lat, lon], zoom);
  } else {
    this.native.flyTo([lat, lon]);
  }

  return this;
};

/**
 * Set the center and the zoom of the map to fit the bounding box.
 * @param {bemap.BoundingBox} boundingBox the bounding box to fit.
 * @return {bemap.LeafletMap} this.
 */
bemap.LeafletMap.prototype.moveToBoundingBox = function (boundingBox, options) {
  if (boundingBox && bemap.inheritsof(boundingBox, bemap.BoundingBox) && boundingBox.maxLon && boundingBox.maxLat && boundingBox.minLon && boundingBox.minLat) {
    var ext = L.latLngBounds(
      L.latLng(boundingBox.minLat, boundingBox.minLon),
      L.latLng(boundingBox.maxLat, boundingBox.maxLon)
    );

    if (options && (options.animate || options.fly)) {
      this.native.flyToBounds(ext);
    } else {
      this.native.fitBounds(ext);
    }
  }
  return this;
};

/**
 * Zoom on map, set new zoom level.
 * @public
 * @param {int} zoom Zoom level (optional).
 * @param {Object} options Options (optional).
 * @return {bemap.LeafletMap} this
 */
bemap.LeafletMap.prototype.zoom = function (zoom, options) {
  this.native.setZoom(zoom);
  return this;
};

/**
 * Get current zoom level of map.
 * @public
 * @return {int} current zoom level of map.
 */
bemap.LeafletMap.prototype.getZoom = function () {
  return this.native.getZoom();
};

/**
 * Refresh map.
 * @public
 * @abstract
 * @param {Object} options Options (optional).
 * @return {bemap.LeafletMap} this
 */
bemap.LeafletMap.prototype.refresh = function (options) {
  this.native.invalidateSize();
  return this;
};

/**
 * Refresh all objects from a layer.
 * @public
 * @param {bemap.Layer} layer the layer object to refresh.
 * @return {bemap.LeafletMap} this
 */
bemap.LeafletMap.prototype.refreshLayer = function (layer) {
  if (layer !== null && bemap.inheritsof(layer, bemap.Layer)) {
    layer.native.redraw();
  }
  return this;
};

/**
 * Remove all objects from a layer.
 * @public
 * @param {bemap.Layer} layer the layer object to clear.
 * @return {bemap.LeafletMap} this
 */
bemap.LeafletMap.prototype.clearLayer = function (layer) {
  if (layer !== null && bemap.inheritsof(layer, bemap.Layer)) {
    layer.native.clearLayers();
  }
  return this;
};

/**
 * Set the visibility of the layer.
 * @public
 * @param {bemap.Layer} layer the layer of wich to set the visibility.
 * @param {boolean} visible.
 * @return {bemap.LeafletMap} return this.
 */
bemap.LeafletMap.prototype.visibleLayer = function (layer, visible) {
  if (visible !== null && layer !== null && layer.map !== null && bemap.inheritsof(layer, bemap.Layer)) {
    if (visible) {
      layer.native.addTo(this.native);
    } else {
      layer.native.remove();
    }

    layer.visible = visible;
  }
  return this;
};

/**
 * Remove a layer from the map.
 * @param {bemap.Layer} layer layer to remove from the map.
 * @return {bemap.LeafletMap} this.
 */
bemap.LeafletMap.prototype.removeLayer = function (layer) {
  if (layer !== null && bemap.inheritsof(layer, bemap.Layer)) {
    this.native.removeLayer(layer.native);
    layer.map = null;
  }
  return this;
};

/**
 * Set the listner when an specified eventType occur on bemap.LeafletMap.
 * @public
 * @param {bemap.Map.EventType} eventType Event type.
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options options.
 * @return {bemap.Listener} listner.
 */
bemap.LeafletMap.prototype.on = function (eventType, callback, options) {
  var opts = options ? options : {};

  var nativeListener = this.native.on(eventType, function (evt) {
    var mapEvent = new bemap.MapEvent({
      native: evt,
      bemapObject: this,
      x: evt.containerPoint ? evt.containerPoint.x : undefined,
      y: evt.containerPoint ? evt.containerPoint.y : undefined,
      coordinate: evt.latlng ? new bemap.Coordinate(evt.latlng.lng, evt.latlng.lat) : undefined,
      properties: options,
      map: this
    });
    callback(mapEvent);
  });
  var listener = new bemap.Listener({
    native: nativeListener,
    callback: callback,
    key: eventType,
    bemapObject: this
  });
  return listener;
};

/**
 * Remove listener.
 * @protected
 * @param {bemap.Listener} listener Function will be called when the specified eventType is occur.
 * @param {object} options Options.
 * @return {bemap.LeafletMap} this.
 */
bemap.LeafletMap.prototype.removeListener = function (listener, options) {
  if (listener && bemap.inheritsof(listener, bemap.Listener) && listener.bemapObject) {
    this.native.off(listener.native);
  }
  return this;
};

/**
 * Get the center of the map in bemap.Coordinate.
 * @return {bemap.Coordinate} the center of the map.
 */
bemap.LeafletMap.prototype.getCenter = function () {
  var center = this.native.getCenter();
  return new bemap.Coordinate(center.lng, center.lat);
};

/**
 * Get the limits of the map on the current zoom.
 * @return {bemap.BoundingBox} the bounding box containing the limits.
 */
bemap.LeafletMap.prototype.getBoundingBox = function () {
  var bounds = this.native.getBounds();
  var box = new bemap.BoundingBox(bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth());
  return box;
};

/**
 * Return drag pan status.
 * @return {boolean}
 */
bemap.LeafletMap.prototype.isDragPan = function () {
  return this.native.dragging ? this.native.dragging.enabled() : false;
};

/**
 * Enable or disable drag pan.
 * @param {boolean} active
 * @return {bemap.LeafletMap} this
 */
bemap.LeafletMap.prototype.setDragPan = function (active) {
  if (active) {
    this.native.dragging.enable();
  } else {
    this.native.dragging.disable();
  }
  return this;
};

/**
 * BeNomad BeMap JavaScript API - Map - MapLibre GL JS v5
 */

// Event name translation: bemap → MapLibre
bemap.MapLibreMap_eventMap = {
  'pointerup': 'mouseup',
  'pointerdown': 'mousedown',
  'pointerdrag': 'drag',
  'pointermove': 'mousemove',
  'singleclick': 'click',
  'postrender': 'render',
  'postcompose': 'render',
  'precompose': 'render',
  'propertychange': 'moveend',
  'change': 'moveend',
  'change:size': 'resize',
  'change:view': 'moveend'
};

/**
 * @classdesc
 * Map implementation using MapLibre GL JS.
 * @public
 * @constructor
 * @extends {bemap.Map}
 */
bemap.MapLibreMap = function(context, target, options) {
  if (typeof maplibregl === 'undefined') {
    console.error('MapLibre GL JS is not loaded. Add <script src="maplibre-gl.js"></script> before bemap-js-api.js');
    return;
  }

  this.target = target;
  bemap.Map.call(this, context, options);

  // Warn if maplibre-gl.css is not loaded (required for markers, canvas sizing, etc.)
  if (typeof document !== 'undefined' && !document.querySelector('link[href*="maplibre-gl"]')) {
    console.warn('maplibre-gl.css not loaded. Add <link rel="stylesheet" href="maplibre-gl.css"> to your HTML. Markers and map rendering will be broken without it.');
  }

  var opts = options || {};
  this._layerCounter = 0;
  this._hasCustomStyle = !!(opts.style || opts.tiles);
  this._featureRegistry = {};   // _bemapId → bemap object
  this._markerElements = {};    // _bemapId → { element, bemapObject }
  this._geoJsonLayerIds = [];   // track all GeoJSON layer IDs for hit-testing
  this._geoJsonData = {};       // sourceId → GeoJSON data (for drag updates)

  // Auto-register PMTiles protocol (bundled in bemap-js-api)
  if (typeof pmtiles !== 'undefined' && !bemap.MapLibreMap._pmtilesRegistered) {
    var _proto = new pmtiles.Protocol();
    maplibregl.addProtocol('pmtiles', _proto.tile);
    bemap.MapLibreMap._pmtilesRegistered = true;
  }

  // Build style: opts.style > opts.tiles (PMTiles) > empty background
  var style;
  if (opts.style) {
    style = opts.style;
  } else if (opts.tiles) {
    // PMTiles URL — build a minimal style, then load real style async
    var tilesUrl = opts.tiles.indexOf('pmtiles://') === 0 ? opts.tiles : 'pmtiles://' + opts.tiles;
    style = {
      version: 8,
      glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
      sources: { tiles: { type: 'vector', url: tilesUrl, maxzoom: 14 } },
      layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#f0f0f0' } }]
    };
    this._pendingTilesStyle = opts.tilesStyle || null;
    this._pendingTilesUrl = tilesUrl;
  } else {
    style = {
      version: 8,
      sources: {},
      layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#f0f0f0' } }]
    };
  }

  // Set up token injection for authenticated PMTiles
  if (opts.tiles && opts.tilesToken) {
    this._setupTilesAuth(opts.tiles, opts.tilesToken, opts.tilesTokenHeader || 'X-Session-Token');
  }

  this.native = new maplibregl.Map({
    container: target,
    style: style,
    center: [0, 0],
    zoom: opts.zoom || 2,
    pitch: opts.pitch || 0,
    bearing: opts.bearing || 0,
    minZoom: opts.minZoom || 0,
    maxZoom: opts.maxZoom || 22,
    maxBounds: opts.maxBounds || undefined
  });

  // Suppress WMS tile decode errors (server returns XML/text error instead of image)
  this.native.on('error', function(e) {
    if (e && e.error && e.error.message && e.error.message.indexOf('could not be decoded') !== -1) {
      return; // Silently ignore WMS tile decode errors
    }
  });

  // Cursor pointer on hover over GeoJSON features
  var _mapRef = this;
  this.native.on('mousemove', function(evt) {
    if (!_mapRef._geoJsonLayerIds.length) return;
    var existingLayers = [];
    for (var i = 0; i < _mapRef._geoJsonLayerIds.length; i++) {
      try { if (_mapRef.native.getLayer(_mapRef._geoJsonLayerIds[i])) existingLayers.push(_mapRef._geoJsonLayerIds[i]); } catch(e) {}
    }
    if (!existingLayers.length) { _mapRef.native.getCanvas().style.cursor = ''; return; }
    var features = _mapRef.native.queryRenderedFeatures(evt.point, { layers: existingLayers });
    _mapRef.native.getCanvas().style.cursor = (features && features.length > 0) ? 'pointer' : '';
  });
  // If tiles option with a style URL, load the full style async after map init
  if (this._pendingTilesStyle) {
    var _mapInst = this;
    var _tilesUrl = this._pendingTilesUrl;
    var styleUrl = this._pendingTilesStyle;
    var xhr2 = new XMLHttpRequest();
    xhr2.open('GET', styleUrl, true);
    if (opts.tilesToken) xhr2.setRequestHeader(opts.tilesTokenHeader || 'X-Session-Token', opts.tilesToken);
    xhr2.onload = function() {
      if (xhr2.status === 200) {
        try {
          var fullStyle = JSON.parse(xhr2.responseText);
          var placeholder = (fullStyle.metadata && fullStyle.metadata.source_placeholder) || 'TILES_SOURCE';
          fullStyle.sources['tiles'] = Object.assign({}, fullStyle.sources[placeholder] || {}, { type: 'vector', url: _tilesUrl, maxzoom: 14 });
          if (placeholder !== 'tiles' && fullStyle.sources[placeholder]) delete fullStyle.sources[placeholder];
          for (var si = 0; si < fullStyle.layers.length; si++) { if (fullStyle.layers[si].source === placeholder) fullStyle.layers[si].source = 'tiles'; }
          if (!fullStyle.glyphs) fullStyle.glyphs = 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf';
          _mapInst.native.setStyle(fullStyle);
        } catch(e) {}
      }
    };
    xhr2.send();
  }
};
bemap.inherits(bemap.MapLibreMap, bemap.Map);

/**
 * Run a callback when the map style is ready.
 * If the style is already loaded, executes immediately; otherwise waits for the 'load' event
 * with a safety timeout fallback.
 */
bemap.MapLibreMap.prototype._whenStyleReady = function(fn) {
  var _this = this;
  if (this.native.isStyleLoaded()) {
    fn();
  } else {
    this.native.once('load', fn);
    setTimeout(function() { if (_this.native.isStyleLoaded()) fn(); }, 200);
  }
};

/**
 * Set up fetch interceptor for authenticated PMTiles.
 * @todo WIP — PMTiles integration not fully finished. Authentication flow, service worker caching,
 *       and loadBeMapTiles need further testing with production BeMap tiles server.
 */
bemap.MapLibreMap.prototype._setupTilesAuth = function(tilesUrl, token, headerName) {
  if (bemap.MapLibreMap._fetchIntercepted) {
    // Just add/update the token for this domain
    var domain = tilesUrl.replace('pmtiles://', '').split('/')[2] || tilesUrl.split('/')[2];
    bemap.MapLibreMap._tokenMap[domain] = { header: headerName, token: token };
    return;
  }
  var domain2 = tilesUrl.replace('pmtiles://', '').split('/')[2] || tilesUrl.split('/')[2];
  bemap.MapLibreMap._tokenMap[domain2] = { header: headerName, token: token };
  var _origFetch = window.fetch;
  window.fetch = function() {
    var url = (typeof arguments[0] === 'string' ? arguments[0] : (arguments[0] && arguments[0].url)) || '';
    for (var d in bemap.MapLibreMap._tokenMap) {
      if (url.indexOf(d) !== -1) {
        var tokenInfo = bemap.MapLibreMap._tokenMap[d];
        var headers = new Headers((arguments[1] || {}).headers);
        headers.set(tokenInfo.header, tokenInfo.token);
        arguments[1] = Object.assign({}, arguments[1] || {}, { headers: headers });
        break;
      }
    }
    return _origFetch.apply(this, arguments);
  };
  bemap.MapLibreMap._fetchIntercepted = true;
};

/**
 * Add default layers. If no custom style was provided, adds WMS background
 * from the BeMap server (same as OlMap). Always adds overlay layers.
 */
bemap.MapLibreMap.prototype.defaultLayers = function(options) {
  var opts = options || {};
  if (!this._hasCustomStyle) {
    this.addLayer(new bemap.BemapLayer({
      name: bemap.Map.DEFAULT_LAYER.BACKGROUND,
      styles: opts.styles ? opts.styles : ''
    }));
  }
  bemap.Map.prototype.defaultOverlayLayers.call(this, opts);
  return this;
};

// backgroundLayers / switchBackgroundLayer not yet supported for MapLibre
bemap.MapLibreMap.prototype.backgroundLayers = function(geoservers, options) { return this; };
bemap.MapLibreMap.prototype.switchBackgroundLayer = function(geoserver) { return this; };

// =========================================================================
// Internal Helpers
// =========================================================================

bemap.MapLibreMap.prototype._uniqueId = function(prefix) {
  return (prefix || 'bemap') + '_' + (++this._layerCounter);
};

bemap.MapLibreMap.prototype._colorToRgba = function(color) {
  if (!color) return 'rgba(0,0,0,1)';
  return 'rgba(' + color.getRed() + ',' + color.getGreen() + ',' + color.getBlue() + ',' + color.getAlpha() + ')';
};

bemap.MapLibreMap.prototype._addOwnToProperties = function(bemapObject) {
  var id = this._uniqueId('obj');
  bemapObject._bemapId = id;
  this._featureRegistry[id] = bemapObject;
};

bemap.MapLibreMap.prototype._getOwnFromProperties = function(feature) {
  if (feature && feature.properties && feature.properties._bemapId) {
    return this._featureRegistry[feature.properties._bemapId] || null;
  }
  return null;
};

bemap.MapLibreMap.prototype._hitTestMarkerElements = function(point) {
  var mapContainer = this.native.getContainer();
  if (!mapContainer) return null;
  var mapRect = mapContainer.getBoundingClientRect();
  var px = point.x + mapRect.left;
  var py = point.y + mapRect.top;

  for (var id in this._markerElements) {
    var entry = this._markerElements[id];
    var el = entry.element;
    if (!el) continue;
    var rect = el.getBoundingClientRect();
    if (px >= rect.left && px <= rect.right && py >= rect.top && py <= rect.bottom) {
      return entry.bemapObject;
    }
  }
  return null;
};

// =========================================================================
// Event System — mirrors OlMap's _onFeature architecture
// =========================================================================

bemap.MapLibreMap.prototype._checkModeOfEvent = function(mode, bemapObject, eventType) {
  if (bemapObject && bemapObject.callback && bemapObject.callback[eventType] && typeof bemapObject.callback[eventType] === 'function') {
    return bemapObject.callback[eventType];
  }
  if (this.events) {
    if (this.events[eventType + 'markers'] && this.events[eventType + 'markers'].callback && typeof this.events[eventType + 'markers'].callback === 'function' && bemap.inheritsof(bemapObject, bemap.Marker)) {
      return this.events[eventType + 'markers'].callback;
    }
    if (this.events[eventType + 'multiMarkers'] && this.events[eventType + 'multiMarkers'].callback && typeof this.events[eventType + 'multiMarkers'].callback === 'function' && bemap.inheritsof(bemapObject, bemap.MultiMarker)) {
      return this.events[eventType + 'multiMarkers'].callback;
    }
    if (this.events[eventType + 'polylines'] && this.events[eventType + 'polylines'].callback && typeof this.events[eventType + 'polylines'].callback === 'function' && bemap.inheritsof(bemapObject, bemap.Polyline)) {
      return this.events[eventType + 'polylines'].callback;
    }
    if (this.events[eventType + 'polygons'] && this.events[eventType + 'polygons'].callback && typeof this.events[eventType + 'polygons'].callback === 'function' && bemap.inheritsof(bemapObject, bemap.Polygon)) {
      return this.events[eventType + 'polygons'].callback;
    }
    if (this.events[eventType + 'circles'] && this.events[eventType + 'circles'].callback && typeof this.events[eventType + 'circles'].callback === 'function' && bemap.inheritsof(bemapObject, bemap.Circle)) {
      return this.events[eventType + 'circles'].callback;
    }
  }
  if (bemapObject && bemapObject.events && bemapObject.events.draggable && bemapObject.callback && bemapObject.callback.draggable && typeof bemapObject.callback.draggable === 'function') {
    return bemapObject.callback.draggable;
  }
  return null;
};

bemap.MapLibreMap.prototype._onFeature = function(declaredObj, eventType, callback, options, mode) {
  var opts = options || {};
  var mlEvent = bemap.MapLibreMap_eventMap[eventType] || eventType;
  var _this = this;
  var nativeListener;

  if (!this.events[eventType]) {
    nativeListener = function(evt) {
      var bemapObject = null;

      // Hit-test GeoJSON layers
      if (evt.point && _this._geoJsonLayerIds.length > 0) {
        try {
          var existingLayers = [];
          for (var i = 0; i < _this._geoJsonLayerIds.length; i++) {
            if (_this.native.getLayer(_this._geoJsonLayerIds[i])) {
              existingLayers.push(_this._geoJsonLayerIds[i]);
            }
          }
          if (existingLayers.length > 0) {
            var features = _this.native.queryRenderedFeatures(evt.point, { layers: existingLayers });
            if (features && features.length > 0) {
              bemapObject = _this._getOwnFromProperties(features[0]);
            }
          }
        } catch(e) {}
      }

      // Hit-test HTML markers
      if (!bemapObject && evt.point) {
        bemapObject = _this._hitTestMarkerElements(evt.point);
      }

      // Fallback to map
      if (!bemapObject) {
        bemapObject = _this;
      }

      var coord = evt.lngLat ? new bemap.Coordinate(evt.lngLat.lng, evt.lngLat.lat) : new bemap.Coordinate();
      var mapEvent = new bemap.MapEvent({
        native: evt,
        map: _this,
        bemapObject: bemapObject,
        x: evt.point ? evt.point.x : 0,
        y: evt.point ? evt.point.y : 0,
        coordinate: coord,
        properties: opts
      });

      var cb = _this._checkModeOfEvent(mode, bemapObject, eventType);
      if (cb) { cb(mapEvent); }
    };

    this.native.on(mlEvent, nativeListener);

    this.events[eventType] = new bemap.Listener({
      native: nativeListener,
      callback: callback,
      key: mlEvent,
      bemapObject: declaredObj
    });
  } else {
    nativeListener = this.events[eventType].native;
  }

  // Store callback routing
  if (declaredObj && mode && mode.singleFeature && typeof callback === 'function') {
    if (!declaredObj.callback) declaredObj.callback = {};
    declaredObj.callback[eventType] = callback;
  } else if (!declaredObj && mode && mode.markers && typeof callback === 'function') {
    this.events[eventType + 'markers'] = new bemap.Listener({ callback: callback, key: eventType + 'markers' });
    return this.events[eventType + 'markers'];
  } else if (!declaredObj && mode && mode.multiMarkers && typeof callback === 'function') {
    this.events[eventType + 'multiMarkers'] = new bemap.Listener({ callback: callback, key: eventType + 'multiMarkers' });
    return this.events[eventType + 'multiMarkers'];
  } else if (!declaredObj && mode && mode.polylines && typeof callback === 'function') {
    this.events[eventType + 'polylines'] = new bemap.Listener({ callback: callback, key: eventType + 'polylines' });
    return this.events[eventType + 'polylines'];
  } else if (!declaredObj && mode && mode.polygons && typeof callback === 'function') {
    this.events[eventType + 'polygons'] = new bemap.Listener({ callback: callback, key: eventType + 'polygons' });
    return this.events[eventType + 'polygons'];
  } else if (!declaredObj && mode && mode.circles && typeof callback === 'function') {
    this.events[eventType + 'circles'] = new bemap.Listener({ callback: callback, key: eventType + 'circles' });
    return this.events[eventType + 'circles'];
  }

  return this.events[eventType];
};

// Public event methods — all delegate to _onFeature
bemap.MapLibreMap.prototype.on = function(eventType, callback, options) {
  return this._onFeature(this, eventType, callback, options, { singleFeature: true });
};

bemap.MapLibreMap.prototype.onMarker = function(marker, eventType, callback, options) {
  return this._onFeature(marker, eventType, callback, options, { singleFeature: true });
};

bemap.MapLibreMap.prototype.onMarkers = function(eventType, callback, options) {
  return this._onFeature(null, eventType, callback, options, { markers: true });
};

bemap.MapLibreMap.prototype.onMultiMarkers = function(eventType, callback, options) {
  return this._onFeature(null, eventType, callback, options, { multiMarkers: true });
};

bemap.MapLibreMap.prototype.onMultiMarker = function(multimarker, eventType, callback, options) {
  return this._onFeature(multimarker, eventType, callback, options, { singleFeature: true });
};

bemap.MapLibreMap.prototype.onPolyline = function(polyline, eventType, callback, options) {
  return this._onFeature(polyline, eventType, callback, options, { singleFeature: true });
};

bemap.MapLibreMap.prototype.onPolylines = function(eventType, callback, options) {
  return this._onFeature(null, eventType, callback, options, { polylines: true });
};

bemap.MapLibreMap.prototype.onPolygon = function(polygon, eventType, callback, options) {
  return this._onFeature(polygon, eventType, callback, options, { singleFeature: true });
};

bemap.MapLibreMap.prototype.onPolygons = function(eventType, callback, options) {
  return this._onFeature(null, eventType, callback, options, { polygons: true });
};

bemap.MapLibreMap.prototype.onCircle = function(circle, eventType, callback, options) {
  return this._onFeature(circle, eventType, callback, options, { singleFeature: true });
};

bemap.MapLibreMap.prototype.removeListener = function(listener, options) {
  if (listener && listener.native && listener.key) {
    this.native.off(listener.key, listener.native);
  }
  if (listener && listener.bemapObject && listener.bemapObject.callback) {
    if (listener.key === 'dragFeature') {
      listener.bemapObject.events.draggable = false;
      listener.bemapObject.callback.draggable = null;
    }
  }
  return this;
};

// =========================================================================
// Layer Management
// =========================================================================

bemap.MapLibreMap.prototype.addLayer = function(layer, options) {
  if (layer === null || !bemap.inheritsof(layer, bemap.Layer)) return this;

  var _this = this;
  var layerId = this._uniqueId('layer');
  layer._maplibreId = layerId;

  if (bemap.inheritsof(layer, bemap.BemapLayer)) {
    // Skip WMS when using custom vector style — just register the layer
    if (this._hasCustomStyle) {
      layer.native = { id: layerId, type: 'raster' };
      if (layer.map === null) layer.map = this;
      bemap.Map.prototype.addLayer.call(this, layer);
      return this;
    }
    var wmsUrl = this.ctx.getBaseUrl() + 'wms?' + this.ctx.getAuthUrlParams()
      + '&geoserver=' + (layer.geoserver ? layer.geoserver : this.ctx.getGeoserver())
      + '&LAYERS=' + (layer.layers ? layer.layers : 'default')
      + '&STYLES=' + (layer.styles ? layer.styles : '')
      + '&FORMAT=' + (layer.format ? layer.format : 'image/png')
      + '&TRANSPARENT=' + (layer.transparent ? 'true' : 'false')
      + '&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&SRS=EPSG:3857&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}';

    var addWms = function() {
      if (!_this.native.getSource(layerId)) {
        _this.native.addSource(layerId, { type: 'raster', tiles: [wmsUrl], tileSize: 256 });
        _this.native.addLayer({ id: layerId, type: 'raster', source: layerId });
      }
    };
    this._whenStyleReady(addWms);
    layer.native = { id: layerId, type: 'raster' };

  } else if (bemap.inheritsof(layer, bemap.WmsLayer)) {
    var wmsUrl2 = layer.url + '?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap'
      + '&LAYERS=' + (layer.layers || '') + '&STYLES=' + (layer.styles || '')
      + '&FORMAT=' + (layer.format || 'image/png') + '&SRS=EPSG:3857&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}';
    var addWms2 = function() {
      if (!_this.native.getSource(layerId)) {
        _this.native.addSource(layerId, { type: 'raster', tiles: [wmsUrl2], tileSize: 256 });
        _this.native.addLayer({ id: layerId, type: 'raster', source: layerId });
      }
    };
    this._whenStyleReady(addWms2);
    layer.native = { id: layerId, type: 'raster' };

  } else if (bemap.inheritsof(layer, bemap.ClusterLayer)) {
    layer.native = { id: layerId, type: 'cluster', features: [], markers: [] };
    layer._sourceId = layerId + '-src';

  } else if (bemap.inheritsof(layer, bemap.VectorTileLayer)) {
    var addVt = function() {
      if (!_this.native.getSource(layerId)) {
        _this.native.addSource(layerId, { type: 'vector', tiles: [layer.url], minzoom: layer.minZoom || 0, maxzoom: layer.maxZoom || 14 });
      }
    };
    this._whenStyleReady(addVt);
    layer.native = { id: layerId, type: 'vector' };

  } else if (bemap.inheritsof(layer, bemap.VectorLayer)) {
    layer.native = { id: layerId, type: 'vector', features: [], markers: [], geoJsonIds: [] };

  } else if (bemap.inheritsof(layer, bemap.OsmLayer)) {
    var addOsm = function() {
      if (!_this.native.getSource(layerId)) {
        _this.native.addSource(layerId, { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256 });
        _this.native.addLayer({ id: layerId, type: 'raster', source: layerId });
      }
    };
    this._whenStyleReady(addOsm);
    layer.native = { id: layerId, type: 'raster' };
  }

  if (layer.map === null) layer.map = this;
  bemap.Map.prototype.addLayer.call(this, layer);
  return this;
};

/**
 * Load PMTiles vector tiles with optional style and authentication.
 * Registers the pmtiles:// protocol, sets up token injection, loads style,
 * and applies it to the map. Requires pmtiles.js library.
 *
 * @public
 * @param {bemap.PMTilesLayer} layer PMTilesLayer with url, style, token, etc.
 * @param {function} callback Called when loading is complete (optional).
 * @return {bemap.MapLibreMap} this
 */
// @todo WIP — PMTiles loading is functional but needs further production testing.
bemap.MapLibreMap.prototype.loadPMTiles = function(layer, callback) {
  if (!layer || !bemap.inheritsof(layer, bemap.PMTilesLayer)) {
    console.warn('loadPMTiles() requires a bemap.PMTilesLayer');
    return this;
  }
  if (typeof pmtiles === 'undefined') {
    console.error('PMTiles library not loaded. Add <script src="pmtiles.js"></script>');
    return this;
  }
  if (!layer.url) {
    console.error('PMTilesLayer.url is required');
    return this;
  }

  var _this = this;
  var tilesUrl = 'pmtiles://' + layer.url;
  var sourceName = layer.sourceName || 'tiles';

  // Register PMTiles protocol (safe to call multiple times)
  if (!bemap.MapLibreMap._pmtilesRegistered) {
    var protocol = new pmtiles.Protocol();
    maplibregl.addProtocol('pmtiles', protocol.tile);
    bemap.MapLibreMap._pmtilesRegistered = true;
  }

  // Set up token injection for authenticated PMTiles
  if (layer.token) {
    this._setupTilesAuth(layer.url, layer.token, layer.tokenHeader || 'X-Session-Token');
  }

  // Load style
  var applyStyle = function(style) {
    // Inject PMTiles source into style
    var placeholder = (style.metadata && style.metadata.source_placeholder) || 'TILES_SOURCE';
    style.sources[sourceName] = Object.assign(
      {}, style.sources[placeholder] || {},
      { type: 'vector', url: tilesUrl, maxzoom: layer.pmtilesMaxZoom || 14 }
    );
    if (placeholder !== sourceName && style.sources[placeholder]) {
      delete style.sources[placeholder];
    }
    for (var i = 0; i < style.layers.length; i++) {
      if (style.layers[i].source === placeholder) style.layers[i].source = sourceName;
    }
    if (!style.glyphs) style.glyphs = layer.glyphs || 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf';

    // Register callback BEFORE setStyle so we catch the style.load event
    if (callback) {
      _this.native.once('style.load', function() { callback(_this); });
    }

    _this.native.setStyle(style);
    _this._hasCustomStyle = true;
  };

  if (typeof layer.style === 'string') {
    // Style is a URL — fetch it
    var xhr = new XMLHttpRequest();
    xhr.open('GET', layer.style, true);
    if (layer.token) {
      xhr.setRequestHeader(layer.tokenHeader || 'X-Session-Token', layer.token);
    }
    xhr.onload = function() {
      if (xhr.status === 200) {
        try {
          var style = JSON.parse(xhr.responseText);
          applyStyle(style);
        } catch(e) {
          console.error('Failed to parse PMTiles style JSON:', e);
        }
      } else {
        console.error('Failed to load PMTiles style:', xhr.status);
      }
    };
    xhr.send();
  } else if (layer.style && typeof layer.style === 'object') {
    // Style is an object — use directly
    applyStyle(JSON.parse(JSON.stringify(layer.style))); // deep clone
  } else {
    // No style — create minimal style with the PMTiles source
    applyStyle({
      version: 8,
      glyphs: layer.glyphs || 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
      sources: {},
      layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#f0f0f0' } }]
    });
  }

  layer.map = this;
  bemap.Map.prototype.addLayer.call(this, layer);
  return this;
};
bemap.MapLibreMap._pmtilesRegistered = false;
bemap.MapLibreMap._fetchIntercepted = false;
bemap.MapLibreMap._tokenMap = {};

/**
 * Load BeMap PMTiles vector tiles. Auto-authenticates using bemap.Context credentials.
 *
 * Usage:
 *   map.loadBeMapTiles();  // uses defaults + context credentials
 *   map.loadBeMapTiles({ url: 'https://tiles-api.chatalone.fr', tilesFile: 'Europe.pmtiles', style: 'style_liberty.json' });
 *   map.loadBeMapTiles({ token: 'existing-jwt' });  // skip login
 *
 * @public
 * @param {Object} options
 * @param {String} options.url Tiles API base URL (default: 'https://tiles-api.chatalone.fr').
 * @param {String} options.tilesFile PMTiles file (default: 'Here-2025-4_WORLD.pmtiles').
 * @param {String} options.style Style name (default: 'openfreemap_graylevel.json').
 * @param {String} options.token JWT token — if provided, skips login.
 * @param {String} options.login Override context login.
 * @param {String} options.password Override context password.
 * @param {function} options.onSuccess callback(map, token).
 * @param {function} options.onError callback(errorMessage).
 * @return {bemap.MapLibreMap} this
 */
// @todo WIP — loadBeMapTiles auto-auth flow needs production testing with BeMap tiles server.
bemap.MapLibreMap.prototype.loadBeMapTiles = function(options) {
  var opts = options || {};
  var _this = this;
  var tilesApi = opts.url || 'https://tiles-api.chatalone.fr';
  var tilesFile = opts.tilesFile || 'Here-2025-4_WORLD.pmtiles';
  var styleName = opts.style || 'openfreemap_graylevel.json';

  if (typeof pmtiles === 'undefined') {
    console.error('[bemap] loadBeMapTiles: pmtiles.js not loaded');
    if (opts.onError) opts.onError('PMTiles library not loaded');
    return this;
  }

  var doLoad = function(token) {
    // Register service worker for tile caching (cache-first for PMTiles range requests)
    if ('serviceWorker' in navigator && opts.cache !== false) {
      navigator.serviceWorker.register('sw-tiles.js').catch(function() {});
    }

    var tiles = new bemap.PMTilesLayer({
      url: tilesApi + '/' + tilesFile,
      style: tilesApi + '/styles/' + styleName,
      token: token,
      tokenHeader: 'X-Session-Token',
      sourceName: 'tiles',
      maxZoom: 14
    });
    _this.loadPMTiles(tiles, function(map) {
      if (opts.onSuccess) opts.onSuccess(map, token);
    });
  };

  // If token already provided, use it directly
  if (opts.token) {
    doLoad(opts.token);
    return this;
  }

  // Auto-login using context credentials
  var login = opts.login || this.ctx.login;
  var password = opts.password || this.ctx.password;
  if (!login || !password) {
    console.error('[bemap] loadBeMapTiles: no credentials — set login/password in Context or options');
    if (opts.onError) opts.onError('No credentials');
    return this;
  }

  var xhr = new XMLHttpRequest();
  xhr.open('POST', tilesApi + '/api/login', true);
  xhr.setRequestHeader('Authorization', 'Basic ' + btoa(login + ':' + password));
  xhr.onload = function() {
    try {
      var data = JSON.parse(xhr.responseText);
      if (data.ok && data.token) {
        doLoad(data.token);
      } else {
        if (opts.onError) opts.onError('Login failed');
      }
    } catch(e) {
      if (opts.onError) opts.onError('Parse error');
    }
  };
  xhr.onerror = function() {
    if (opts.onError) opts.onError('Network error');
  };
  xhr.send();

  return this;
};

bemap.MapLibreMap.prototype.removeLayer = function(layer) {
  if (layer && bemap.inheritsof(layer, bemap.Layer) && layer._maplibreId) {
    try {
      if (this.native.getLayer(layer._maplibreId)) this.native.removeLayer(layer._maplibreId);
      if (this.native.getSource(layer._maplibreId)) this.native.removeSource(layer._maplibreId);
    } catch(e) {}
    // Remove tracked GeoJSON layers
    if (layer.native && layer.native.geoJsonIds) {
      for (var i = 0; i < layer.native.geoJsonIds.length; i++) {
        try {
          var gid = layer.native.geoJsonIds[i];
          if (this.native.getLayer(gid)) this.native.removeLayer(gid);
          if (this.native.getSource(gid)) this.native.removeSource(gid);
        } catch(e2) {}
      }
    }
    layer.map = null;
  }
  return this;
};

bemap.MapLibreMap.prototype.clearLayer = function(layer) {
  if (!layer || !layer.native) return this;
  // Clear HTML markers + registries
  if (layer.native.markers) {
    for (var i = 0; i < layer.native.markers.length; i++) {
      var m = layer.native.markers[i];
      if (m.remove) m.remove();
    }
    layer.native.markers = [];
  }
  // Clean up feature registry for features in this layer
  if (layer.native.features) {
    for (var f = 0; f < layer.native.features.length; f++) {
      var feat = layer.native.features[f];
      if (feat && feat._bemapId) {
        delete this._featureRegistry[feat._bemapId];
        delete this._markerElements[feat._bemapId];
        if (feat._maplibreSourceId) delete this._geoJsonData[feat._maplibreSourceId];
      }
    }
  }
  // Clear GeoJSON layers/sources
  if (layer.native.geoJsonIds) {
    for (var j = 0; j < layer.native.geoJsonIds.length; j++) {
      try {
        var gid = layer.native.geoJsonIds[j];
        if (this.native.getLayer(gid)) this.native.removeLayer(gid);
        var srcId = gid.replace('-fill', '-src').replace('-layer', '-src');
        if (this.native.getSource(srcId)) this.native.removeSource(srcId);
        // Also clean the map-level tracking array
        var idx = this._geoJsonLayerIds.indexOf(gid);
        if (idx > -1) this._geoJsonLayerIds.splice(idx, 1);
      } catch(e) {}
    }
    layer.native.geoJsonIds = [];
  }
  layer.native.features = [];
  // Clear cluster source/layers if this is a ClusterLayer
  if (layer._clusterLayerIds) {
    for (var ci = 0; ci < layer._clusterLayerIds.length; ci++) {
      try { if (this.native.getLayer(layer._clusterLayerIds[ci])) this.native.removeLayer(layer._clusterLayerIds[ci]); } catch(e3) {}
    }
    layer._clusterLayerIds = [];
  }
  if (layer._clusterSourceId) {
    try { if (this.native.getSource(layer._clusterSourceId)) this.native.removeSource(layer._clusterSourceId); } catch(e4) {}
    layer._clusterSourceId = null;
  }
  if (layer._clusterFeatures) layer._clusterFeatures = [];
  if (layer._clusterMarkerNatives) layer._clusterMarkerNatives = {};
  if (layer._clusterBubbles) {
    for (var bi = 0; bi < layer._clusterBubbles.length; bi++) {
      layer._clusterBubbles[bi].remove();
    }
    layer._clusterBubbles = [];
  }
  layer._lastClusterKey = null;
  if (layer._clusterBemapObjects) layer._clusterBemapObjects = {};
  return this;
};

bemap.MapLibreMap.prototype.visibleLayer = function(layer, visible) {
  if (layer && bemap.inheritsof(layer, bemap.Layer)) {
    layer.visible = visible;
    if (layer._maplibreId && this.native.getLayer(layer._maplibreId)) {
      try { this.native.setLayoutProperty(layer._maplibreId, 'visibility', visible ? 'visible' : 'none'); } catch(e) {}
    }
    if (layer.native && layer.native.markers) {
      for (var i = 0; i < layer.native.markers.length; i++) {
        var el = layer.native.markers[i].getElement ? layer.native.markers[i].getElement() : null;
        if (el) el.style.display = visible ? '' : 'none';
      }
    }
    if (layer.native && layer.native.geoJsonIds) {
      for (var j = 0; j < layer.native.geoJsonIds.length; j++) {
        try { this.native.setLayoutProperty(layer.native.geoJsonIds[j], 'visibility', visible ? 'visible' : 'none'); } catch(e2) {}
      }
    }
  }
  return this;
};

bemap.MapLibreMap.prototype.zIndexLayer = function(layer, zIndex) {
  if (layer) layer.zIndex = zIndex;
  return this;
};

bemap.MapLibreMap.prototype.refreshLayer = function(layer) {
  return this;
};

// =========================================================================
// GeoJSON Feature Dragging
// =========================================================================

bemap.MapLibreMap.prototype._draggableFeature = function(declaredObj, callback, options, mode) {
  var _this = this;
  var opts = options || {};
  var dragging = false;
  var dragFeature = null;
  var dragBemapObj = null;
  var startLngLat = null;
  var prevLngLat = null;
  var canvas = this.native.getCanvasContainer();

  if (declaredObj) {
    if (!declaredObj.events) declaredObj.events = {};
    if (!declaredObj.callback) declaredObj.callback = {};
    declaredObj.events.draggable = true;
    declaredObj.callback.draggable = callback;
  }

  if (!this.events.dragFeature) {
    var onMouseDown = function(evt) {
      if (!_this._geoJsonLayerIds.length) return;
      var existingLayers = [];
      for (var i = 0; i < _this._geoJsonLayerIds.length; i++) {
        try { if (_this.native.getLayer(_this._geoJsonLayerIds[i])) existingLayers.push(_this._geoJsonLayerIds[i]); } catch(e) {}
      }
      if (!existingLayers.length) return;

      var features = _this.native.queryRenderedFeatures(evt.point, { layers: existingLayers });
      if (!features || !features.length) return;

      var bemapObj = _this._getOwnFromProperties(features[0]);
      if (!bemapObj) return;

      // Check if this object has draggable enabled
      if (bemapObj.events && bemapObj.events.draggable) {
        dragFeature = features[0];
        dragBemapObj = bemapObj;
        startLngLat = evt.lngLat;
        prevLngLat = evt.lngLat;
        dragging = true;
        _this.native.dragPan.disable();
        canvas.style.cursor = 'grabbing';
        evt.preventDefault();
      }
    };

    var onMouseMove = function(evt) {
      if (!dragging || !dragBemapObj) return;

      var dLng = evt.lngLat.lng - prevLngLat.lng;
      var dLat = evt.lngLat.lat - prevLngLat.lat;
      prevLngLat = evt.lngLat;

      // Translate the GeoJSON geometry
      var sourceId = dragBemapObj._maplibreSourceId;
      if (!sourceId) return;

      var src = _this.native.getSource(sourceId);
      if (!src) return;

      var storedData = _this._geoJsonData[sourceId];
      if (!storedData) return;

      var geojson = JSON.parse(JSON.stringify(storedData));
      _translateGeojsonCoords(geojson.geometry, dLng, dLat);
      _this._geoJsonData[sourceId] = geojson;
      src.setData(geojson);

      // Update bemap coordinates
      if (bemap.inheritsof(dragBemapObj, bemap.Polyline) || bemap.inheritsof(dragBemapObj, bemap.Polygon)) {
        var coords = dragBemapObj.getCoordinates();
        for (var i = 0; i < coords.length; i++) {
          coords[i].setLon(coords[i].getLon() + dLng).setLat(coords[i].getLat() + dLat);
        }
      } else if (bemap.inheritsof(dragBemapObj, bemap.Circle)) {
        var c = dragBemapObj.getCoordinate();
        c.setLon(c.getLon() + dLng).setLat(c.getLat() + dLat);
      }
    };

    var onMouseUp = function(evt) {
      if (!dragging) return;
      dragging = false;
      _this.native.dragPan.enable();
      canvas.style.cursor = '';

      if (dragBemapObj && dragBemapObj.callback && dragBemapObj.callback.draggable) {
        var coord = evt.lngLat ? new bemap.Coordinate(evt.lngLat.lng, evt.lngLat.lat) : new bemap.Coordinate();
        dragBemapObj.callback.draggable(new bemap.MapEvent({
          native: evt,
          bemapObject: dragBemapObj,
          coordinate: coord,
          startCoordinate: startLngLat ? new bemap.Coordinate(startLngLat.lng, startLngLat.lat) : new bemap.Coordinate(),
          map: _this
        }));
      }

      dragFeature = null;
      dragBemapObj = null;
    };

    this.native.on('mousedown', onMouseDown);
    this.native.on('mousemove', onMouseMove);
    this.native.on('mouseup', onMouseUp);

    this.events.dragFeature = new bemap.Listener({
      native: { down: onMouseDown, move: onMouseMove, up: onMouseUp },
      key: 'dragFeature',
      bemapObject: declaredObj
    });
  }

  return this.events.dragFeature;
};

// Helper: translate all coordinates in a GeoJSON geometry
function _translateGeojsonCoords(geometry, dLng, dLat) {
  if (geometry.type === 'Point') {
    geometry.coordinates[0] += dLng;
    geometry.coordinates[1] += dLat;
  } else if (geometry.type === 'LineString') {
    for (var i = 0; i < geometry.coordinates.length; i++) {
      geometry.coordinates[i][0] += dLng;
      geometry.coordinates[i][1] += dLat;
    }
  } else if (geometry.type === 'Polygon') {
    for (var r = 0; r < geometry.coordinates.length; r++) {
      for (var j = 0; j < geometry.coordinates[r].length; j++) {
        geometry.coordinates[r][j][0] += dLng;
        geometry.coordinates[r][j][1] += dLat;
      }
    }
  }
}

// =========================================================================
// Camera / Navigation
// =========================================================================

bemap.MapLibreMap.prototype.move = function(lon, lat, zoom, options) {
  var opts = options || {};
  var o = { center: [lon, lat] };
  if (zoom) o.zoom = zoom;
  if (opts.animate === false) {
    this.native.jumpTo(o);
  } else {
    o.duration = opts.duration || 800;
    o.essential = true;
    this.native.easeTo(o);
  }
  return this;
};

bemap.MapLibreMap.prototype.flyTo = function(lon, lat, zoom, options) {
  var opts = options || {};
  this.native.flyTo({
    center: [lon, lat],
    zoom: zoom || this.native.getZoom(),
    duration: opts.duration || 2000,
    essential: true,
    curve: 1.42,
    speed: 1.2
  });
  return this;
};

bemap.MapLibreMap.prototype.moveToBoundingBox = function(boundingBox, options) {
  if (boundingBox && bemap.inheritsof(boundingBox, bemap.BoundingBox)) {
    var opts = options || {};
    // Normalize: ensure min < max (callers may pass points in any order)
    var west = Math.min(boundingBox.minLon, boundingBox.maxLon);
    var south = Math.min(boundingBox.minLat, boundingBox.maxLat);
    var east = Math.max(boundingBox.minLon, boundingBox.maxLon);
    var north = Math.max(boundingBox.minLat, boundingBox.maxLat);
    var fitOpts = { padding: opts.padding || 50 };
    if (opts.fly) {
      fitOpts.duration = opts.duration || 2000;
      fitOpts.essential = true;
    } else {
      fitOpts.duration = opts.duration || 500;
    }
    this.native.fitBounds([[west, south], [east, north]], fitOpts);
  }
  return this;
};

bemap.MapLibreMap.prototype.moveToLayerData = function(layer, options) {
  // Compute bounds from registered features
  if (!layer || !layer.native || !layer.native.features) return this;
  var minLon = 180, minLat = 90, maxLon = -180, maxLat = -90;
  var found = false;
  for (var i = 0; i < layer.native.features.length; i++) {
    var obj = layer.native.features[i];
    if (obj && obj.coordinate) {
      var lon = obj.coordinate.getLon ? obj.coordinate.getLon() : obj.coordinate.lon;
      var lat = obj.coordinate.getLat ? obj.coordinate.getLat() : obj.coordinate.lat;
      if (lon < minLon) minLon = lon;
      if (lat < minLat) minLat = lat;
      if (lon > maxLon) maxLon = lon;
      if (lat > maxLat) maxLat = lat;
      found = true;
    }
  }
  if (found) {
    this.native.fitBounds([[minLon, minLat], [maxLon, maxLat]], { padding: 50 });
  }
  return this;
};

bemap.MapLibreMap.prototype.zoom = function(zoom, options) {
  this.native.setZoom(zoom);
  return this;
};

bemap.MapLibreMap.prototype.getZoom = function() {
  return Math.round(this.native.getZoom());
};

bemap.MapLibreMap.prototype.rotation = function(angle, options) {
  this.native.setBearing(angle);
  return this;
};

bemap.MapLibreMap.prototype.getRotation = function() {
  return this.native.getBearing();
};

bemap.MapLibreMap.prototype.refresh = function(options) {
  this.native.resize();
  return this;
};

bemap.MapLibreMap.prototype.getCenter = function() {
  var c = this.native.getCenter();
  return new bemap.Coordinate(c.lng, c.lat);
};

bemap.MapLibreMap.prototype.getBoundingBox = function() {
  var b = this.native.getBounds();
  return new bemap.BoundingBox(b.getWest(), b.getSouth(), b.getEast(), b.getNorth());
};

bemap.MapLibreMap.prototype.isDragPan = function() {
  return this.native.dragPan ? this.native.dragPan.isEnabled() : true;
};

bemap.MapLibreMap.prototype.setDragPan = function(active) {
  if (active) { this.native.dragPan.enable(); } else { this.native.dragPan.disable(); }
  return this;
};

// =========================================================================
// 3D Features (MapLibre-exclusive)
// =========================================================================

bemap.MapLibreMap.prototype.setPitch = function(pitch) { this.native.setPitch(pitch); return this; };
bemap.MapLibreMap.prototype.getPitch = function() { return this.native.getPitch(); };
bemap.MapLibreMap.prototype.setBearing = function(bearing) { this.native.setBearing(bearing); return this; };
bemap.MapLibreMap.prototype.getBearing = function() { return this.native.getBearing(); };

bemap.MapLibreMap.prototype.setTerrain = function(options) { try { this.native.setTerrain(options); } catch(e) {} return this; };
bemap.MapLibreMap.prototype.removeTerrain = function() { try { this.native.setTerrain(null); } catch(e) {} return this; };

bemap.MapLibreMap.prototype.setProjection = function(type) {
  try { this.native.setProjection({ type: type }); } catch(e) {}
  return this;
};

bemap.MapLibreMap.prototype.setSky = function(options) {
  try {
    if (this.native.setSky) {
      this.native.setSky(options || {});
    } else {
      var s = this.native.getStyle();
      if (options) { s.sky = options; } else { delete s.sky; }
      this.native.setStyle(s);
    }
  } catch(e) {}
  return this;
};

bemap.MapLibreMap.prototype.setStyle = function(style) { this.native.setStyle(style); return this; };

bemap.MapLibreMap.prototype.jumpTo = function(options) { this.native.jumpTo(options); return this; };
bemap.MapLibreMap.prototype.easeTo = function(options) { this.native.easeTo(options); return this; };

bemap.MapLibreMap.prototype.queryRenderedFeatures = function(point, options) {
  return this.native.queryRenderedFeatures(point, options);
};

bemap.MapLibreMap.prototype.addGeoJsonSource = function(id, data) {
  var _this = this;
  var add = function() {
    if (!_this.native.getSource(id)) {
      _this.native.addSource(id, { type: 'geojson', data: data });
    }
  };
  if (this.native.isStyleLoaded()) { add(); } else { this.native.on('load', add); }
  return this;
};

bemap.MapLibreMap.prototype.updateGeoJsonSource = function(id, data) {
  var src = this.native.getSource(id);
  if (src) src.setData(data);
  return this;
};

bemap.MapLibreMap.prototype.addImage = function(id, image) {
  var _this = this;
  var add = function() { if (!_this.native.hasImage(id)) _this.native.addImage(id, image); };
  if (this.native.isStyleLoaded()) { add(); } else { this.native.on('load', add); }
  return this;
};

bemap.MapLibreMap.prototype.removeImage = function(id) {
  try { this.native.removeImage(id); } catch(e) {}
  return this;
};

// =========================================================================
// Build Style Methods (translate bemap styles to MapLibre paint properties)
// =========================================================================

bemap.MapLibreMap.prototype.buildIcon = function(icon, options) { return this; };
bemap.MapLibreMap.prototype.buildLineStyle = function(style, options) { return this; };
bemap.MapLibreMap.prototype.buildTextStyle = function(textStyle, name, options) { return this; };
bemap.MapLibreMap.prototype.buildPolygonStyle = function(style, options) { return this; };
bemap.MapLibreMap.prototype.buildCircleStyle = function(style, options) { return this; };

// =========================================================================
// Light / Raster (MapLibre-exclusive advanced features)
// =========================================================================

bemap.MapLibreMap.prototype.setLight = function(options) {
  try {
    var style = this.native.getStyle();
    style.light = options;
    this.native.setStyle(style);
  } catch(e) {}
  return this;
};

bemap.MapLibreMap.prototype.addRasterLayer = function(layer) {
  if (!layer || !bemap.inheritsof(layer, bemap.RasterLayer)) return this;

  var _this = this;
  var layerId = this._uniqueId('raster');
  layer._maplibreId = layerId;

  var addToMap = function() {
    if (!_this.native.getSource(layerId)) {
      _this.native.addSource(layerId, {
        type: 'raster',
        tiles: [layer.url],
        tileSize: layer.tileSize || 256,
        attribution: layer.attribution || ''
      });
      _this.native.addLayer({
        id: layerId,
        type: 'raster',
        source: layerId,
        paint: { 'raster-opacity': layer.opacity !== undefined ? layer.opacity : 1 }
      });
    }
  };

  if (this.native.isStyleLoaded()) { addToMap(); } else { this.native.on('load', addToMap); }

  layer.native = { id: layerId, type: 'raster' };
  if (layer.map === null) layer.map = this;
  bemap.Map.prototype.addLayer.call(this, layer);

  return this;
};

// =========================================================================
// Popup clearPopup (real impl in popup sub-file)
// =========================================================================

/**
 * BeNomad BeMap JavaScript API - Service
 */


/**
 * @classdesc
 * Base class for BeMap service.
 * @public
 * @constructor
 * @abstract
 * @param {bemap.Context} context BeMap-JS-API Context. Mandatory.
 * @param {object} options see below the available values.
 */
bemap.Service = function(context, options) {
  var opts = options || {};

  /**
   * @type {bemap.Context}
   * @protected
   */
  this.ctx = context;

  if (context === undefined || !bemap.inheritsof(context, bemap.Context)) {
    console.error("Context is required!");
    return;
  }
};

/**
 * Check if BeMap return an error or exception.
 * @protected
 * @return {boolean} Return true if an error or exception was detected, otherwise false.
 **/
bemap.Service.prototype.checkErrorParser = function(xhr, doc, options) {
  var opts = options || {};

  if (doc.error) {
    var errorDoc = doc.error;
    var error = new bemap.Error({
      code: errorDoc.code,
      message: errorDoc.message
    });
    if (opts.failed) {
      opts.failed(error, doc, xhr);
    } else {
      console.error("Error code " + error.getCode() + ", message: " + error.getMessage());
    }
    return true;
  }

  var bnd = doc.BND;
  if (bnd) {
    if (bnd.action === 'exceptionReport') {
      var exceptionDoc = bnd.exception;
      var exception = new bemap.Error({
        code: exceptionDoc.code,
        message: exceptionDoc.message
      });
      if (opts.failed) {
        opts.failed(exception, doc, xhr);
      } else {
        console.error("Error code " + exception.getCode() + ", message: " + exception.getMessage());
      }
      return true;
    }
  } else {
    var NoBndError = new bemap.Error({
      code: "NO_BND_OBJECT",
      message: "No BND object was returned"
    });
    if (opts.failed) {
      opts.failed(NoBndError, doc, xhr);
    } else {
      console.error("Error code " + NoBndError.getCode() + ", message: " + NoBndError.getMessage());
    }
    return true;
  }

  return false;
};

/**
 * BeNomad BeMap JavaScript API - Routing
 */

/**
 * @classdesc
 * Base class for routing calculation.
 * @public
 * @constructor
 * @abstract
 * @param {bemap.Context} context BeMap-JS-API Context. Mandatory.
 * @param {object} options see below the available values.
 */
bemap.Routing = function(context, options) {
  bemap.Service.call(this, context, options);

  var opts = options || {};

  /**
   * Native parameters of BeMap server.
   * @type {String}
   * @protected
   */
  this.nativeBeMapParams = opts.nativeBeMapParams ? opts.nativeBeMapParams : null;

  /**
   * Calculated route(s).
   * @type {bemap.Route}
   * @protected
   */
  this.routes = [];

  /**
   * Marker(s) list.
   * @type {bemap.Marker}
   * @protected
   */
  this.markerMapObject = [];


  /**
   * Vias(s) list.
   * @type {Object}
   * @protected
   */
  this.stopPoints = [];


  /**
   * ID of geometry.
   * @type {String}
   * @protected
   */
  this.geometryId = 'routePolyline';

  /**
   * Draw a polygon with the polyline array.
   * @type {boolean}
   * @protected
   */
  this.poylineAsPolygon = false;

  // Internal resource.

  this.popup = undefined;

};
bemap.inherits(bemap.Routing, bemap.Service);

/**
 * Get the calculated route object.
 * @public
 * @param {integer} index of route.
 * @return {bemap.Route} the calculated route.
 */
bemap.Routing.prototype.getRoute = function(index) {
  return this.routes[index];
};

/**
 * Get the calculated route object.
 * @public
 * @param {integer} index of route.
 * @return {bemap.Route} the calculated route.
 */
bemap.Routing.prototype.getRoutes = function() {
  return this.routes;
};

/**
 * Get the calculated route object.
 * @public
 * @return {bemap.Route} the calculated route.
 */
bemap.Routing.prototype.getFirstRoute = function() {
  return this.routes[0];
};

/**
 * Reset the Routing object. Clear the previous result.
 * @public
 * @return {bemap.Routing} this
 */
bemap.Routing.prototype.reset = function() {
  if (this.routes) {
    for (var i = 0; i < this.routes.length; i++) {
      var route = this.routes[i];
      this.resetRoute(route);
    }
  }

  this.routes = [];

  this.stopPoints = [];

  if (this.popup) {
    this.popup.remove();
    this.popup = undefined;
  }

  //clear markers
  if (this.markerMapObject) {
    this.cleanMarkers();
  };

  return this;
};
/**
 * Reset the Routing object. Clear the previous result.
 * @public
 * @return {bemap.Routing} this
 */
bemap.Routing.prototype.resetRoute = function(route) {
  var i;

  if (route.chargingStationSteps) {
    for (i = 0; i < route.chargingStationSteps.length; i++) {
      var step = route.chargingStationSteps[i];
      if (step.markerMapObject) {
        step.markerMapObject.remove();
        step.markerMapObject = undefined;
      }
    }
  }

  if (route.events) {
    for (i = 0; i < route.events.length; i++) {
      var event = route.events[i];
      if (event.geometryMapObject) {
        event.geometryMapObject.remove();
        event.geometryMapObject = undefined;
      }
    }
  }

  if (route.geometryMapObject) {
    route.geometryMapObject.remove();
    route.geometryMapObject = undefined;
  }
};

/**
 * Generate the BeMap request in URL encoded format.
 * @private
 * @param {object} options See below the available values.
 * @param {String} options.geoserver Geoserver name will be used for this computation.
 * @return {String} the request URL encoded.
 */
bemap.Routing.prototype.buildRequest = function(options) {

  var opts = options || {};

  var data = '&geoserver=' + (opts.geoserver ? opts.geoserver : this.ctx.getGeoserver());

  for (i = 0; i < this.destinations.length; i++) {
    var des = this.destinations[i];
    if (des !== null && bemap.inheritsof(des, bemap.Destination)) {
      data += '&xy=' + des.getLon() + "," + des.getLat();
    } else if (des !== null && bemap.inheritsof(des, bemap.Coordinate)) {
      data += '&xy=' + des.getLon() + "," + des.getLat();
    } else {
      console.error("One of destinations is not a bemap.Destination or bemap.Coordinate object!");
      return;
    }
  }

  if (this.criterias && this.criterias !== null && this.criterias.length > 0) {
    data += '&criterias=';
    first = true;
    for (i = 0; i < this.criterias.length; i++) {
      if (first) {
        first = false;
      } else {
        data += ',';
      }
      data += this.criterias[i];
    }
  }

  if (this.departureTime > 0) {
    data += '&departureTime=' + this.departureTime;
  }

  if (this.evCnnType) {
    data += '&evCnnType=' + this.evCnnType;
  }

  if (this.evf) {
    data += '&evf=' + this.evf;
  }

  if (this.evRange) {
    data += '&evRange=' + this.evRange;
  }

  if (this.isoChroneLimit > 0) {
    data += '&isoChroneLimit=' + this.isoChroneLimit;
  }

  if (this.language) {
    data += '&language=' + this.language;
  }

  if (this.maxAlter > 0) {
    data += '&maxAlter=' + this.maxAlter;
  }

  if (this.options && this.options !== null && this.options.length > 0) {
    data += '&options=';
    first = true;
    for (i = 0; i < this.options.length; i++) {
      if (first) {
        first = false;
      } else {
        data += ',';
      }
      data += this.options[i];
    }
  }

  if (this.speed > 0) {
    data += '&speed=' + this.speed;
  }

  if (this.speedType) {
    data += '&speedType=' + this.speedType;
  }

  if (this.transportType) {
    data += '&transportType=' + this.transportType;
  }

  if (this.vf) {
    data += '&vf=' + this.vf;
  }

  if (this.xyRadius > 0) {
    data += '&xyRadius=' + this.xyRadius;
  }

  if (this.nativeBeMapParams && this.nativeBeMapParams !== null) {
    data += this.nativeBeMapParams;
  }
  return data;
};

/**
 * Execute the routing calculation.
 * @public
 * @param {object} options See below the available values.
 * @param {String} options.geoserver Geoserver name will be used for this computation.
 * @param {function} options.success the function to call in case of successed request.
 * @param {function} options.failed the function to call in case of failed request.
 * @return {bemap.Routing} this
 */
bemap.Routing.prototype.compute = function(options) {
  this.reset();

  var options = options || {};

  var opts = options.request || {};

  var geoserver = options.geoserver ? options.geoserver : this.ctx.getGeoserver();

  /**
   * Destinations
   * @type {bemap.Coordinates}
   * @protected
   */
  this.destinations = opts.destinations ? opts.destinations : [];

  /**
   * Array of route Criteria.
   * @type {bemap.Criteria}
   */
  this.criterias = opts.criterias ? opts.criterias : [];

  var d = new Date();
  var t = d.getTime();
  this.departureTime = opts.departureTime > 0 ? opts.departureTime : t;

  this.evCnnType = opts.evCnnType > 0 ? opts.evCnnType : null;

  this.evf = opts.evf > 0 ? opts.evf : null;

  this.evRange = opts.evRange > 0 ? opts.evRange : null;

  this.isoChroneLimit = opts.isoChroneLimit > 0 ? opts.isoChroneLimit : 0;

  this.language = opts.language ? opts.language : "xx";

  this.maxAlter = opts.maxAlter ? opts.maxAlter : 0;

  this.options = opts.options && opts.options.length > 0 ? opts.options : ['POLYLINE'];

  this.speed = opts.speed > 0 ? opts.speed : 0;

  this.speedType = opts.speedType > 0 ? opts.speedType : null;

  this.transportType = opts.transportType ? opts.transportType : "CAR";

  this.vf = opts.vf ? opts.vf : null;

  this.xyRadius = opts.xyRadius > 0 ? opts.xyRadius : 40;

  if (this.destinations && this.destinations.length < 2) {
    console.error("Minimum of 2 destionations are required!");
    return;
  }
  if (this.destinations && this.destinations.length > 2 && this.maxAlter !== 0) {
    console.error("For alternative roads 2 destionations are required");
    return;
  }
  var i = 0;
  var first = true;
  var url = this.ctx.getBaseUrl() + 'bnd';
  var data = 'version=1.0.0&action=routing&mode=MODE_VIAS&format=json';

  if (this.ctx.isAuthInPost()) {
    data += '&' + this.ctx.getAuthUrlParams();
  } else {
    url += '?' + this.ctx.getAuthUrlParams();
  }

  data += this.buildRequest(options);

  return this.execute(url, data, options);
};

/**
 * Excute the request by calling the BeMap server and wait the answer.
 * @private
 * @param {object} options Request options.
 * @return {bemap.Routing} this
 */
bemap.Routing.prototype.execute = function(url, data, options) {
  var opts = options || {};
  var _this = this;

  bemap.ajax(
    'POST',
    url,
    data,
    function(xhr, doc) {
      _this.responseParser(xhr, doc, opts);
    },
    function(xhr, doc) {
      _this.responseParser(xhr, doc, opts);
    }, {
      'requestFormat': 'urlencoded'
    }
  );

  return this;
};

/**
 * Convert the BeMap response to the BeMap JS API object.
 * @private
 **/
bemap.Routing.prototype.responseParser = function(xhr, doc, options) {
  var opts = options || {};

  doc = JSON.parse(doc);
  if (!doc || this.checkErrorParser(xhr, doc, options)) {
    return;
  }

  var bnd = doc.BND;
  if (!bnd) {
    return;
  }
  this.stopPointsParser(bnd);
  this.routeParser(bnd, options);

  if (opts.success) {
    opts.success(this, bnd, doc, xhr);
  }
};

/**
 * Convert the BeMap route(s) to the BeMap JS API Route object(s) and save into the routes array.
 * @private
 **/
bemap.Routing.prototype.routeParser = function(bnd, options) {
  var i = 0;
  var rts = bnd.Routes.Route;

  if (rts && rts.length > 0) {
    for (i = 0; i < rts.length; i++) {
      var r = rts[i];
      var route = new bemap.Route();

      route.length = r.Length;
      route.duration = r.Duration;
      route.averageSpeed = r.AverageSpeed;

      if (r.BoundingBox) {
        var rbbox = r.BoundingBox;
        route.extent = new bemap.BoundingBox(rbbox.minX, rbbox.minY, rbbox.maxX, rbbox.maxY);
      }

      if (r.Polyline && r.Polyline.Line && r.Polyline.Line.length > 0) {
        this.polylineParser(route, r.Polyline.Line);
      }
      if (r.Events && r.Events.length > 0) {
        this.eventsParser(route, r.Events);
      }
      this.routes.push(route);
    }
  }
};

bemap.Routing.prototype.stopPointsParser = function(bnd) {
  var sp = bnd.UsedDestinations.UsedDestination;

  if (sp && sp.length > 0) {
    for (i = 0; i < sp.length; i++) {
      var s = sp[i];

      s.hourMinute = this.toHourMinute(s.duration)
      s.dateString = this.msToDateString(s.duration * 1000 + this.departureTime)
      this.stopPoints.push(s);
    }
  }
};

/**
 * Convert the this duration to hours minutes string ex "3 h 14 min".
 * @private
 **/
bemap.Routing.prototype.toHourMinute = function(time) {
  if (!time || time == 0) {
    return '-';
  }

  var h = parseInt(time / 3600);
  var m = String(parseInt((time / 60) % 60)).padStart(2, '0');

  var v = '';
  if (h > 0) {
    v += h + ' h ';
  }

  return v + m + ' min';
};

/**
 * Convert the this duration to data string ex "23/01/2020 12:52".
 * @private
 **/
bemap.Routing.prototype.msToDateString = function(time) {
  if (!time || time == 0) {
    return '-';
  }
  var d = new Date(time);

  return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
};


/**
 * Convert the BeMap polyline to the BeMap JS API Polyline object and save into the route object.
 * @private
 **/
bemap.Routing.prototype.polylineParser = function(route, line, options) {
  route.polyline = [];
  for (var i = 0; i < line.length; i++) {
    var pts = line[i];
    route.polyline.push(new bemap.Coordinate(pts.X, pts.Y));
  }
};

/**
 * Convert the events.
 * @private
 **/
bemap.Routing.prototype.eventsParser = function(route, events, options) {
  route.events = [];
  if (!events) {
    return;
  }
  for (var i = 0; i < events.length; i++) {
    this.evtMarkersParser(route, events[i].markers, options);
  }
};

/**
 * Convert the markers.
 * @private
 **/
bemap.Routing.prototype.evtMarkersParser = function(route, markers, options) {
  if (!markers) {
    return;
  }

  for (var i = 0; i < markers.length; i++) {

    this.evtEntriesParser(route, markers[i].entries, options);
  }
};

/**
 * Convert the entries.
 * @private
 **/
bemap.Routing.prototype.evtEntriesParser = function(route, entries, options) {
  if (!entries) {
    return;
  }

  var routeEvent = new bemap.Route.Event();
  route.events.push(routeEvent);
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    if (entry.type === 'String' && entry.name === 'countryCode' && entry.value) {
      routeEvent.countryCode = entry.value;

    } else if (entry.type === 'long' && entry.name === 'length' && entry.value) {
      routeEvent.length = entry.value;

    } else if (entry.type === 'double' && entry.name === 'duration' && entry.value) {
      routeEvent.duration = entry.value;

    } else if (entry.type === 'Geometry' && entry.name === 'polyline' && entry.value) {
      if (!routeEvent.polyline) {
        routeEvent.polyline = [];
      }

      var line = entry.value.split(' ');
      for (var j = 0; j < line.length; j++) {
        var pts = line[j].split(',');
        var x = Number(pts[0]);
        var y = Number(pts[1]);
        routeEvent.polyline.push(new bemap.Coordinate(x, y));
      }

    } else if (entry.type === 'Routesheet' && entry.name === 'routesheet' && entry.instruction) {
      this.evtEntryRoutesheetInstructionParser(routeEvent, entry.instruction, options);

    } else if (entry.type === 'ChargingStationStep' && entry.name === 'chargingStationStep') {
      this.evtEntryChargingStationStepParser(routeEvent, entry, options);
    }
  }
};

/**
 * Convert the entry route-sheet instruction.
 * @private
 **/
bemap.Routing.prototype.evtEntryRoutesheetInstructionParser = function(routeEvent, instruction, options) {
  var routesheetInstruction = new bemap.Route.RoutesheetInstruction();
  var c = new bemap.Coordinate(instruction.coordinate.x, instruction.coordinate.y);
  routesheetInstruction.coordinate = c;
  bemap.fillFields(instruction, routesheetInstruction);
  routeEvent.routesheetInstruction = routesheetInstruction;
};

/**
 * Convert the entry ChargingStationStep.
 * @private
 **/
bemap.Routing.prototype.evtEntryChargingStationStepParser = function(routeEvent, chargingStationStep, options) {
  var step = new bemap.ChargingStationStep();
  step.entrance = new bemap.Coordinate(chargingStationStep.longitude, chargingStationStep.latitude);
  bemap.fillFields(chargingStationStep, step);
  routeEvent.chargingStationSteps.push(step);
};

/**
 * Show the route(s) on map.
 * @param {bemap.Map} map the new color of text border to set.
 * @param {Object} options See below the available values.
 * @param {bemap.LineStyle} options.polylineStyle Style of line used by the renderer.
 * @param {String} options.chargingStationStepImageSrc Image path of pool stations.
 * @param {String} options.chargingStationStepNoPopup If set to true, disable the popup when the icon is clicked.
 * @param {function} options.chargingStationPopupTextCallback Function called wehen a pool statiion is clicked, the called function get the step point object and return the text of popup.
 * @return {bemap.Routing} Return this.
 */
bemap.Routing.prototype.showOnMap = function(map, options, listener) {
  if (!this.routes) {
    return;
  }

  var opts = options || {};

  if (!opts.polylineStyle || !bemap.inheritsof(opts.polylineStyle, bemap.LineStyle)) {
    opts.polylineStyle = new bemap.LineStyle({
      width: 3,
      color: new bemap.Color(13, 80, 157, 1)
    });
  }

  if (!opts.polygonStyle || !bemap.inheritsof(opts.polygonStyle, bemap.PolygonStyle)) {
    opts.polygonStyle = new bemap.PolygonStyle({
      fillColor: new bemap.Color(255, 0, 255, 0.25),
      borderColor: new bemap.Color(255, 0, 255, 0.25),
      borderWidth: 3
    });
  }

  var red = 13;
  var green = 80;
  var blue = 157;
  for (var i = 0; i < this.routes.length; i++) {

    var color = new bemap.Color(red, green, blue)
    red = red + 50;
    green = green + 40;
    blue = blue + 30

    if (opts.changeColor) {
      opts.polylineStyle.color = color
    }

    var route = this.routes[i];
    opts.polylineId = i;

    if (this.poylineAsPolygon) {
      this.showPolygon(map, route, opts);
    } else {
      if (route.polyline) {
        this.showPolyline(map, route, opts, function(data) {
          if (listener) {
            listener(data);
          };
        });
      }
      if (route.events && route.events.length > 0) {
        this.showEventPolyline(map, route, opts, function(data) {
          if (listener) {
            listener(data);
          };
        });
      }
    }

    if (route.extent) {
      map.moveToBoundingBox(route.extent);
    }

    this.showChargingStationSteps(map, route.chargingStationSteps, opts);
  }

  return this;
};

/**
 * Show the destinations markers on map.
 * @public
 * @param {bemap.Map} map the new marker to set.
 * @param {Object} options See below the available values.
 * @param {bemap.Layer} options.layer Layer for markers.
 * @param {Object} options.response Optionally response from geocoding or list of coords.
 * @param {listener} listener return click on marker.
 * @return {bemap.markerMapObject} Return this.
 */
bemap.Routing.prototype.showOnMapMarkers = function(options, listener) {

  if (!options) {
    console.error("Options required");
  };
  var map = options.map ? options.map : bemap.map;
  var layer = options.layer ? options.layer : '';
  var icone = options.icon ? options.icon : {};
  var coord = options.coord ? options.coord : {};
  var doc = {};

  if (!options.response) {
    doc.destinations = this.destinations;
  } else {
    doc = options.response;
  };

  var optionsMarker = {
    map: map,
    properties: '',
    coord: coord,
    icon: icone,
    layer: layer
  }

  this.cleanMarkers();
  //create merkers from parsed response - object UsedDestinations
  if (doc.UsedDestinations) {

    for (var i = 0; i < doc.UsedDestinations.UsedDestination.length; i++) {
      e = doc.UsedDestinations.UsedDestination[i]
      optionsMarker.properties = doc.UsedDestinations.UsedDestination[i];
      optionsMarker.coord = new bemap.Coordinate(e.usedX, e.usedY)
      this.createMarker(optionsMarker, function(data) {
        if (listener) {
          listener(data);
        };
      });
    };
  }
  //create merkers from notparsed response - object destinations
  //or from this.destinations
  else if (doc.destinations) {
    for (var i = 0; i < doc.destinations.length; i++) {
      e = doc.destinations[i]
      optionsMarker.properties = doc.stopPoints[i];
      optionsMarker.coord = new bemap.Coordinate(e.lon, e.lat)
      this.createMarker(optionsMarker, function(data) {
        if (listener) {
          listener(data);
        };
      });
    };
  } else {

    optionsMarker.coord = options.coord;
    this.createMarker(optionsMarker, function(data) {
      if (listener) {
        listener(data);
      };
    });
  };

  return this.markerMapObject;
};

/**
 * Clean the markerMapObject object.
 * @public
 * @return {bemap.markerMapObject} this
 */
bemap.Routing.prototype.cleanMarkers = function() {
  if (this.markerMapObject) {
    for (i = 0; i < this.markerMapObject.length; i++) {
      var marker = this.markerMapObject[i];
      marker.remove();
      marker = undefined;
    };
    this.markerMapObject = [];
  } else {
    this.markerMapObject = [];
  };
};
/**
 * Show the destinations markers on map.
 * @public
 * @param {bemap.Map} options.map the new marker to set.
 * @param {Object} options See below the available values.
 * @param {listener} listener return click on marker.
 * @return {bemap.markerMapObject} Return this.
 */
bemap.Routing.prototype.createMarker = function(options, listener) {

  var opts = options ? options : {};
  var map = opts.map ? opts.map : bemap.map;
  var properties = opts.properties ? opts.properties : opts.coord;
  var coord = opts.coord ? opts.coord : console.error("Coords required");
  var icone = opts.icon ? opts.icon : '';
  var layer = opts.layer ? opts.layer : false;
  var icon = new bemap.Icon({
    src: icone.src ? icone.src : console.error("required icon/icon adress is wrong"),
    anchorX: icone.anchorX ? icone.anchorX : 0.25,
    anchorY: icone.anchorY ? icone.anchorY : 1,
    height: icone.height ? icone.height : '',
    width: icone.width ? icone.width : '',
    anchorXUnits: icone.anchorXUnits ? icone.anchorXUnits : 'fraction',
    anchorYUnits: icone.anchorYUnits ? icone.anchorYUnits : 'fraction',
    scale: icone.scale ? icone.scale : 1
  });

  var marker = new bemap.Marker(
    coord, {
      properties: properties,
      icon: icon
    }
  );

  if (layer) {
    map.addMarker(marker, {
      layer: layer
    });
  } else {
    map.addMarker(marker);
  };

  this.markerMapObject.push(marker);

  marker.on(bemap.Map.EventType.CLICK, function(mapEvent) {
    if (listener) {
      listener(mapEvent);
    };
  });

  return marker
};


/**
 * Show a polyline on map
 * @private
 **/
bemap.Routing.prototype.showPolyline = function(map, route, options, listener) {

  var opts = options || {};
  var layer = opts.layer ? opts.layer : '';
  var p = new bemap.Polyline(
    route.polyline, {
      style: opts.polylineStyle,
      id: this.geometryId + opts.polylineId
    }
  );
  route.geometryMapObject = p;

  if (layer) {
    map.addPolyline(p, {
      layer: layer
    });
  } else {
    map.addPolyline(p);
  };


  p.on(bemap.Map.EventType.CLICK, function(mapEvent) {
    if (listener) {
      listener(mapEvent);
    };
  })
};

/**
 * Show a polygon on map
 * @private
 **/
bemap.Routing.prototype.showPolygon = function(map, route, options) {
  var opts = options || {};
  var p = new bemap.Polygon(
    route.polyline, {
      style: opts.polygonStyle,
      id: this.geometryId + opts.polygonId
    }
  );
  route.geometryMapObject = p;
  map.addPolygon(p);

};

/**
 * Show a polyline on map
 * @private
 **/
bemap.Routing.prototype.showEventPolyline = function(map, route, options, listener) {
  var opts = options || {};
  var layer = opts.layer ? opts.layer : '';
  var events = route.events;
  for (var i = 0; i < events.length; i++) {
    var event = events[i];
    var polyline = event.polyline;

    var p = new bemap.Polyline(
      polyline, {
        style: opts.polylineStyle,
        id: this.geometryId + opts.polylineId + '#evt' + i
      }
    );
    event.geometryMapObject = p;
    if (layer) {
      map.addPolyline(p, {
        layer: layer
      });
    } else {
      map.addPolyline(p);
    };
    p.on(bemap.Map.EventType.CLICK, function(mapEvent) {
      if (listener) {
        listener(mapEvent);
      };
    })
  }
};

/**
 * Show a charging station step(s) on map
 * @param {object} options See below the available values.
 * @param {String} options.chargingStationStepImageSrc Image path of pool stations.
 * @param {String} options.chargingStationStepNoPopup If set to true, disable the popup when the icon is clicked.
 * @param {function} options.chargingStationPopupTextCallback Function called wehen a pool statiion is clicked, the called function get the step point object and return the text of popup.
 * @private
 **/
bemap.Routing.prototype.showChargingStationSteps = function(map, chargingStationSteps, options) {
  if (!chargingStationSteps || chargingStationSteps.lengh == 0) {
    return;
  }

  for (var i = 0; i < chargingStationSteps.length; i++) {
    this.showChargingStationStep(map, chargingStationSteps[i], options);
  }
};

/**
 * Show a charging station step on map
 * @private
 **/
bemap.Routing.prototype.showChargingStationStep = function(map, step, options) {
  if (!step.entrance) {
    return;
  }

  var _this = this;
  var src = options.chargingStationStepImageSrc ? options.chargingStationStepImageSrc : 'images/map-marker-red.svg';
  var marker = new bemap.Marker(
    step.entrance, {
      icon: new bemap.Icon({
        src: src,
        anchorX: options.chargingStationStepImageAnchorX ? options.chargingStationStepImageAnchorX : 0.50,
        anchorY: options.chargingStationStepImageAnchorY ? options.chargingStationStepImageAnchorY : 1,
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction'
      })
    });
  map.addMarker(marker);

  step.markerMapObject = marker;

  if (!options.chargingStationStepNoPopup) {
    marker.on(bemap.Map.EventType.CLICK, function() {
      _this.popupChargingStationStep(map, step, options);
    });
  }
};

/**
 * Show a charging station step on map
 * @param {object} options See below the available values.
 * @param {function} options.chargingStationPopupTextCallback Function called wehen a pool statiion is clicked, the called function get the step point object and return the text of popup.
 * @private
 **/
bemap.Routing.prototype.popupChargingStationStep = function(map, step, options) {
  if (!this.popup) {
    this.popup = new bemap.Popup({
      coordinate: step.entrance,
      visible: false
    });
    map.addPopup(this.popup);
  }

  var html;
  if (options.chargingStationPopupTextCallback) {
    html = options.chargingStationPopupTextCallback(step);

  } else {
    html = '<p>';

    if (step.id) {
      html += 'Id: ' + step.id + '<br/>';
    }

    if (step.entrance) {
      var entrance = step.entrance;
      html += 'Latitude, longitude: ' + entrance.getLat() + ', ' + entrance.getLon() + '<br/>';
    }

    if (step.country || step.city || step.street) {
      html += 'Address:<br/>';

      if (step.streeNumber && step.street) {
        html += step.streeNumber + ' ' + step.street + '<br/>';
      } else {
        if (step.streeNumber) {
          html += step.streeNumber;
        }
        if (step.street) {
          html += step.street;
        }
        html += '<br/>';
      }

      if (step.postalCode && step.city) {
        html += step.postalCode + ' ' + step.city + '<br/>';
      } else {
        if (step.postalCode) {
          html += step.postalCode;
        }
        if (step.city) {
          html += step.city;
        }
        html += '<br/>';
      }

      if (step.country) {
        html += step.country + '<br/>';
      }
    }

    if (step.batteryChargeLevel) {
      html += 'Battery: ' + step.batteryChargeLevel + '%<br/>';
    }
    if (step.chargingTime) {
      html += 'Charging time: ' + step.chargingTime + 'ms<br/>';
    }
    if (step.consumedFromPreviousStop) {
      html += 'Consumed: ' + step.consumedFromPreviousStop + 'kW<br/>';
    }
    if (step.maxNominalPower) {
      html += 'Maximum power: ' + step.maxNominalPower + 'kW<br/>';
    }
    if (step.numberOfChargingPoint) {
      html += 'Number of charge points: ' + step.numberOfChargingPoint + '<br/>';
    }

    html += '</p>';
  }

  this.popup.setInformation(html);
  this.popup.setCoordinate(step.entrance).show();
};

/**
 * BeNomad BeMap JavaScript API - Event class
 */

/**
 * @classdesc
 * Base class for event.
 * @public
 * @constructor
 * @param {object} options Options object.
 * @param {object} options.native native object.
 * @param {object} options.map map object.
 * @param {object} options.bemapObject bemap object.
 * @param {int} options.x X coordinate in pixels.
 * @param {int} options.y Y coordinate in pixels.
 * @param {bemap.Coordinate} options.coordinate Coordinate.
 * @param {object} options.properties object can contains custom properties.
 */
bemap.MapEvent = function(options) {
  var opts = options || {};

  /**
   * Native map browser event.
   * @type {Object}
   * @protected
   */
  this.native = opts.native ? opts.native : null;

  /**
   * Map object that generated the event.
   * @type {bemap.Map}
   * @protected
   */
  this.map = opts.map ? opts.map : null;

  /**
   * BeMap SDK object like bemap.Marker, bemap.Polyline, etc.
   * @type {bemap.Object}
   * @protected
   */
  this.bemapObject = opts.bemapObject ? opts.bemapObject : null;

  /**
   * x coordinate in pixels.
   * @type {int}
   * @protected
   */
  this.x = opts.x ? opts.x : 0;

  /**
   * y coordinate in pixels.
   * @type {int}
   * @protected
   */
  this.y = opts.y ? opts.y : 0;

  /**
   * Coordinate of event (longitude and latitude).
   * @type {bemap.Coordinate}
   * @protected
   */
  this.coordinate = opts.coordinate ? opts.coordinate : new bemap.Coordinate();

  /**
   * x coordinate before event in pixels.
   * @type {int}
   * @protected
   */
  this.startX = opts.startX ? opts.startX : 0;

  /**
   * y coordinate before event in pixels.
   * @type {int}
   * @protected
   */
  this.startY = opts.startY ? opts.startY : 0;

  /**
   * Start coordinate before event (longitude and latitude).
   * @type {bemap.Coordinate}
   * @protected
   */
  this.startCoordinate = opts.startCoordinate ? opts.startCoordinate : new bemap.Coordinate();

  /**
   * @type {Object}
   * @protected
   */
  this.properties = opts.properties ? opts.properties : null;
};

/**
 * Return the bemap.Coordinate. See bemap.Coordinate.
 * @public
 * @return {bemap.Coordinate} Return the bemap.Coordinate. See bemap.Coordinate.
 */
bemap.MapEvent.prototype.getCoordinate = function() {
  return this.coordinate;
};

/**
 * BeNomad BeMap JavaScript API - boundingBox
 */

/**
 * @classdesc
 * Base class for boudingBox.
 * @public
 * @constructor
 * @abstract
 * @param {double} minLat the minimal latitude of the bounding box.
 * @param {double} minLon the minimal longitude of the bounding box.
 * @param {double} maxLat the maximal latitude of the bounding box.
 * @param {double} maxLon the maximal longitude of the bounding box.
 */
bemap.BoundingBox = function(minLon, minLat, maxLon, maxLat) {
    /**
     * @type {double}
     * @protected
     */
    this.minLat = minLat;

    /**
     * @type {double}
     * @protected
     */
    this.maxLat = maxLat;

    /**
     * @type {double}
     * @protected
     */
    this.minLon = minLon;

    /**
     * @type {double}
     * @protected
     */
    this.maxLon = maxLon;
};

/**
 * Get the minimal longitude of the bounding box.
 * @return {double} the minimal longitude.
 */
bemap.BoundingBox.prototype.getMinLon = function() {
    return this.minLon;
};

/**
 * Get the maximal longitude of the bounding box.
 * @return {double} the maximal longitude.
 */
bemap.BoundingBox.prototype.getMaxLon = function() {
    return this.maxLon;
};

/**
 * Get the minimal latitude of the bounding box.
 * @return {double} the minimal latitude.
 */
bemap.BoundingBox.prototype.getMinLat = function() {
    return this.minLat;
};

/**
 * Get the maximal latitude of the bounding box.
 * @return {double} the maximal latitude.
 */
bemap.BoundingBox.prototype.getMaxLat = function() {
    return this.maxLat;
};

/**
 * Get the maximal coordinates of the bounding box.
 * @return {bemap.Coordinate} the maximal coordinates.
 */
bemap.BoundingBox.prototype.getMax = function() {
    return new bemap.Coordinate(this.maxLon, this.maxLat);
};

/**
 * Get the minimal coordinates of the bounding box.
 * @return {bemap.Coordinate} the minimal coordinates.
 */
bemap.BoundingBox.prototype.getMin = function() {
    return new bemap.Coordinate(this.minLon, this.minLat);
};

/**
 * Set the minimal longitude of the bounding box.
 * @param {double} minLon the new minimal longitude to set.
 * @return {bemap.BoundingBox} this;
 */
bemap.BoundingBox.prototype.setMinLon = function(minLon) {
    this.minLon = minLon;
    return this;
};

/**
 * Set the maximal longitude of the bounding box.
 * @param {double} maxLon the new maximal longitude to set.
 * @return {bemap.BoundingBox} this;
 */
bemap.BoundingBox.prototype.setMaxLon = function(maxLon) {
    this.maxLon = maxLon;
    return this;
};

/**
 * Set the minimal latitude of the bounding box.
 * @param {double} minLat the new minimal latitude to set.
 * @return {bemap.BoundingBox} this;
 */
bemap.BoundingBox.prototype.setMinLat = function(minLat) {
    this.minLat = minLat;
    return this;
};

/**
 * Set the maximal latitude of the bounding box.
 * @param {double} maxLat the new maximal latitude to set.
 * @return {bemap.BoundingBox} this;
 */
bemap.BoundingBox.prototype.setMaxLat = function(maxLat) {
    this.maxLat = maxLat;
    return this;
};

/**
 * Set the maximal coordinates of the bounding box.
 * @param {bemap.Coordinate} max the new maximal coordinates to set.
 * @return {bemap.BoundingBox} this;
 */
bemap.BoundingBox.prototype.setMax = function(max) {
    this.maxLat = max.lat;
    this.maxLon = max.lon;
    return this;
};

/**
 * Set the minimal coordinates of the bounding box.
 * @param {bemap.Coordinate} min the new minimal coordinates to set.
 * @return {bemap.BoundingBox} this;
 */
bemap.BoundingBox.prototype.setMin = function(min) {
    this.minLat = min.lat;
    this.minLon = min.lon;
    return this;
};

/**
 * BeNomad BeMap JavaScript API - BuildingsLayer class
 * MapLibre-exclusive: 3D extruded buildings from vector data.
 */

/**
 * @classdesc
 * Layer for 3D building extrusion. MapLibre only.
 * @public
 * @constructor
 * @extends {bemap.Layer}
 * @param {Object} options
 * @param {String} options.sourceId Source ID containing building data.
 * @param {String} options.sourceLayer Source layer name (for vector tiles).
 * @param {String} options.heightProperty Property name for building height (default: 'height').
 * @param {String} options.baseHeightProperty Property for base height (default: 'min_height').
 * @param {String} options.color Building color (default: '#aaa').
 * @param {Number} options.opacity Building opacity (default: 0.6).
 * @param {Number} options.minZoom Minimum zoom to show buildings (default: 14).
 */
bemap.BuildingsLayer = function(options) {
  var opts = options || {};

  this.sourceId = opts.sourceId ? opts.sourceId : null;
  this.sourceLayer = opts.sourceLayer ? opts.sourceLayer : null;
  this.heightProperty = opts.heightProperty ? opts.heightProperty : 'height';
  this.baseHeightProperty = opts.baseHeightProperty ? opts.baseHeightProperty : 'min_height';
  this.color = opts.color ? opts.color : '#aaa';
  this.opacity = opts.opacity !== undefined ? opts.opacity : 0.6;

  bemap.Layer.call(this, options);
};
bemap.inherits(bemap.BuildingsLayer, bemap.Layer);

/**
 * BeNomad BeMap JavaScript API - ChargingStationStep class
 */

/**
 * @classdesc
 * Base class for charging station step used by EVSE routing calculation.
 * @public
 * @constructor
 * @param {Object} options To set all fields of this class.
 */
bemap.ChargingStationStep = function(options) {
  var opts = options || {};

  /**
   * Unique identifier.
   * @type {String}
   * @protected
   */
  this.id = opts.id ? opts.id : undefined;

  /**
   * Provider name used by BeMap (bgis).
   * @type {String}
   * @protected
   */
  this.providerName = opts.providerName ? opts.providerName : undefined;

  /**
   * Name of the original provider.
   * @type {String}
   * @protected
   */
  this.sourceProvider = opts.sourceProvider ? opts.sourceProvider : undefined;

  /**
   * Brand of pool.
   * @type {String}
   * @protected
   */
  this.brand = opts.brand ? opts.brand : undefined;

  /**
   * Name of pool.
   * @type {String}
   * @protected
   */
  this.nameOfPool = opts.nameOfPool ? opts.nameOfPool : undefined;

  /**
   * Type of site.
   * @type {String}
   * @protected
   */
  this.siteType = opts.siteType ? opts.siteType : undefined;

  /**
   * Accessibility of pool.
   * @type {String}
   * @protected
   */
  this.accessibility = opts.accessibility ? opts.accessibility : undefined;

  /**
   * Availability status.
   * @type {String}
   * @protected
   */
  this.availabilityStatus = opts.availabilityStatus ? opts.availabilityStatus : undefined;

  /**
   * Coordinate of entrance gateway to pool access.
   * @type {bemap.Coordinate}
   * @protected
   */
  this.entrance = opts.entrance ? opts.entrance : undefined;

  /**
   * Pool address, country code.
   * @type {String}
   * @protected
   */
  this.countryCode = opts.countryCode ? opts.countryCode : undefined;

  /**
   * Pool address, country.
   * @type {String}
   * @protected
   */
  this.country = opts.country ? opts.country : undefined;

  /**
   * Pool address, state.
   * @type {String}
   * @protected
   */
  this.state = opts.state ? opts.state : undefined;

  /**
   * Pool address, county.
   * @type {String}
   * @protected
   */
  this.county = opts.county ? opts.county : undefined;

  /**
   * Pool address, city.
   * @type {String}
   * @protected
   */
  this.city = opts.city ? opts.city : undefined;

  /**
   * Pool address, postal code.
   * @type {String}
   * @protected
   */
  this.postalCode = opts.postalCode ? opts.postalCode : undefined;

  /**
   * Pool address, district.
   * @type {String}
   * @protected
   */
  this.district = opts.district ? opts.district : undefined;

  /**
   * Pool address, road number.
   * @type {String}
   * @protected
   */
  this.roadNumber = opts.roadNumber ? opts.roadNumber : undefined;

  /**
   * Pool address, street.
   * @type {String}
   * @protected
   */
  this.street = opts.street ? opts.street : undefined;

  /**
   * Pool address, street number.
   * @type {String}
   * @protected
   */
  this.streetNumber = opts.streetNumber ? opts.streetNumber : undefined;

  /**
   * Pool address, address complement.
   * @type {String}
   * @protected
   */
  this.addressComplement = opts.addressComplement ? opts.addressComplement : undefined;

  /**
   *  Address floor number.
   * @type {String}
   * @protected
   */
  this.floorNumber = opts.floorNumber ? opts.floorNumber : undefined;

  /**
   * Phone number.
   * @type {String}
   * @protected
   */
  this.phoneNumber = opts.phoneNumber ? opts.phoneNumber : undefined;

  /**
   * List of opening hours.
   * @type {String}
   * @protected
   */
  this.openingHours = opts.openingHours ? opts.openingHours : undefined;

  /**
   * @type {String}
   * @protected
   */
  this.connectorType = opts.connectorType ? opts.connectorType : undefined;

  /**
   * Nominal power in kW.
   * @type {double}
   * @protected
   */
  this.maxNominalPower = opts.maxNominalPower ? opts.maxNominalPower : undefined;

  /**
   * Summarized of number of charging point present in pool.
   * @type {int}
   * @protected
   */
  this.numberOfChargingPoint = opts.numberOfChargingPoint ? opts.numberOfChargingPoint : undefined;

  /**
   * Comment.
   * @type {String}
   * @protected
   */
  this.comment = opts.comment ? opts.comment : undefined;

  /**
   * The energy needed to come from the previous stop (in kWh).
   * @type {double}
   * @protected
   */
  this.consumedFromPreviousStop = opts.consumedFromPreviousStop ? opts.consumedFromPreviousStop : undefined;

  /**
   * The battery charge level (in %) of the vehicle at the given charge point.
   * @type {float}
   * @protected
   */
  this.batteryChargeLevel = opts.batteryChargeLevel ? opts.batteryChargeLevel : undefined;

  /**
   * The estimated charging time, based on energy vehicle profile (in seconds)
   * or -1 in case of error (that is, if battery capacity = 0, or Connector
   * power <= 0, or Maximum charge power <= 0).
   * @type {long}
   * @protected
   */
  this.chargingTime = opts.chargingTime ? opts.chargingTime : undefined;

};

/**
 * BeNomad BeMap JavaScript API - Circle class
 */

/**
 * @classdesc
 * Base class for Circle.
 * @public
 * @constructor
 * @param {bemap.Coordinate} center Array of bemap.Coordinate.
 * @param {int} radius Radius of circle.
 * @param {Object} options See below the available values.
 * @param {bemap.LineStyle} options.style Style of poyline used by the renderer.
 * @param {String} options.name Name of circle.
 * @param {Object} options.properties custom object.
 */
bemap.Circle = function(center, radius, options) {
  var opts = options || {};

  /**
   * @type {Object}
   * @protected
   */
  this.native = null;

  /**
   * @type {Object}
   * @protected
   */
  this.map = null;

  /**
   * @type {Object}
   * @protected
   */
  this.layer = null;

  /**
   * @type {bemap.Coordinate}
   * @protected
   */
  this.coordinate = center ? center : new bemap.Coordinate();

  /**
   * @type {int}
   * @protected
   */
  this.radius = radius ? radius : null;

  /**
     * @type {
     bemap.LineStyle
 }
     * @protected
     */
  this.style = opts.style ? opts.style : null;


  /**
   * @type {String}
   * @protected
   */
  this.id = opts.id ? opts.id : null;

  /**
   * @type {String}
   * @protected
   */
  this.name = opts.name ? opts.name : null;

  /**
   * @type {Array}
   * @protected
   */
  this.events = [];

  /**
   * @type {Function}
   * @protected
   */
  this.callback = [];

  /**
   * @type {Object}
   * @protected
   */
  this.properties = opts.properties ? opts.properties : null;
};


/**
 * Return the id of the circle.
 * @public
 * @return {String} Return the id of the circle.
 */
bemap.Circle.prototype.getId = function() {
  return this.id;
};

/**
 * Define the id of circle
 * @public
 * @param {String} id the new id to set.
 * @return {bemap.Circle} this
 */
bemap.Circle.prototype.setId = function(id) {
  this.id = id;
  return this;
};

/**
 * Return the name of the circle.
 * @public
 * @return {String} Return the name of the circle.
 */
bemap.Circle.prototype.getName = function() {
  return this.name;
};

/**
 * Define the name of circle
 * @public
 * @param {String} name the new name to set.
 * @return {bemap.Circle} this
 */
bemap.Circle.prototype.setName = function(name) {
  this.name = name;
  return this;
};

/**
 * Return the radius of the circle.
 * @public
 * @return {int} return radius of the circle.
 */
bemap.Circle.prototype.getRadius = function() {
  return this.radius;
};

/**
 * Return the radius of the circle.
 * @public
 * @return {int} return radius of the circle.
 */
bemap.Circle.prototype.setRadius = function(radius) {
  this.radius = radius;
  if (this.native && this.map) {
    this.map.setRadiusCircle(this);
  }
  return this;
};


/**
 * Return the coordinate. See bemap.Coordinate.
 * @public
 * @return {bemap.Coordinate} Return the coordinate. See bemap.Coordinate.
 */
bemap.Circle.prototype.getCenter = function() {
  if (this.map && this.native) {
    this.map.updateCircleCenter(this);
  }
  return this.coordinate;
};

/**
 * Return the coordinate. See bemap.Coordinate.
 * @public
 * @return {bemap.Coordinate} Return the coordinate. See bemap.Coordinate.
 */
bemap.Circle.prototype.getCoordinate = function() {
  return this.coordinate;
};

/**
 * Return the style of the circle.
 * @public
 * @return {bemap.LineStyle} Return the style of the circle.
 */
bemap.Circle.prototype.getStyle = function() {
  return this.style;
};

/** Set the center of the circle.
 * @public
 * @param {bemap.Coordinate} center the new coordinates to set.
 * @return {bemap.Marker} this
 */
bemap.Circle.prototype.setCenter = function(coordinate) {
  this.coordinate = coordinate;
  if (this.native && this.map) {
    this.map.setCoordinateCircle(this);
  }
  return this;
};

/**
 * Remove the Circle from the layer.
 * @public
 * @return {bemap.Circle} this
 */
bemap.Circle.prototype.remove = function() {
  if (this.map !== null && bemap.inheritsof(this.map, bemap.Map)) {
    this.map.removeCircle(this);
  }
  return this;
};

/**
 * Set the listner when an specified eventType occur on bemap.Circle.
 * @public
 * @param {bemap.Map.EventType} eventType Event type.
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options options.
 * @return {bemap.Circle} this.
 */
bemap.Circle.prototype.on = function(eventType, callback, options) {
  if (this.map !== null && bemap.inheritsof(this.map, bemap.Map)) {
    this.map.onCircle(this, eventType, callback, options);
  }
  return this;
};

/**
 * Define the draggable capability for bemap.Circle.
 * @protected
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options Options.
 * @param {bemap.Layer} options.layerFilter set the bemap layer used as filter.
 * @return {bemap.Listener} bemap.listener.
 */
bemap.Circle.prototype.draggable = function(callback, options) {
  if (this.map !== null && bemap.inheritsof(this.map, bemap.Map)) {
    return this.map.draggableCircle(this, callback, options);
  }
  return new bemap.Listener();
};

/**
 * BeNomad BeMap JavaScript API - CircleStyle
 */

/**
 * @classdesc
 * Base class for CircleStyle.
 * @public
 * @constructor
 * @param {Object} options See below the available values.
 * @param {bemap.Color} options.fillColor Set the fill color of the circle with a bemap.Color.
 * @param {bemap.Color} options.borderColor Set the border color of the circle with a bemap.Color.
 * @param {int} options.borderWidth Set the border width of the circle in pixels.
 * @param {bemap.CircleStyle.TYPE} options.borderType define the border type of the circle.
 */
bemap.CircleStyle = function(options) {
    var opts = options || {};

    /**
     * @type {Object}
     * @protected
     */
    this.native = null;

    /**
     * Fill color.
     * @type {Object}
     * @protected
     */
    this.fillColor = opts.fillColor ? opts.fillColor : new bemap.Color();

    /**
     * Border color.
     * @type {Object}
     * @protected
     */
    this.borderColor = opts.borderColor ? opts.borderColor : new bemap.Color();

    /**
     * Border width.
     * @type {int}
     * @protected
     */
    this.borderWidth = opts.borderWidth ? opts.borderWidth : 3;

    /**
     * Border type.
     * @type {String}
     * @protected
     */
    this.borderType = opts.borderType ? opts.borderType : bemap.CircleStyle.TYPE.PLANE;
};

/**
 * List of available type for the circle style.
 * @public
 * @enum bemap.CircleStyle.TYPE
 */
bemap.CircleStyle.TYPE = {
    DASH: "dash",
    PLANE: "plane",
    DOT: "dot",
    DOT_DASH: "dot dash"
};

/**
 * Return the bemap.Color which set the fill color of the circle.
 * @return {bemap.Color} Return the Bemap.Color which set the fill color of the circle.
 */
bemap.CircleStyle.prototype.getFillColor = function() {
    return this.fillColor;
};

/**
 * Set the bemap.Color which set the fill color of the circle.
 * @param {bemap.Color} fillColor the new bemap.Color to set the fill color.
 * @return {bemap.CircleStyle} Return this.
 */
bemap.CircleStyle.prototype.setFillColor = function(fillColor) {
    this.fillColor = fillColor;
    return this;
};

/**
 * Get the border type of the circle style.
 * @return {String} the border type of the circle.
 */
bemap.CircleStyle.prototype.getBorderType = function() {
    return this.borderType;
};


/**
* Set the border type of the circle.
* @param {String} type the new border type to set.
* @return {bemap.CircleStyle} return this.
*/
bemap.CircleStyle.prototype.setBorderType = function(borderType) {
  this.borderType = borderType;
  return this;
};

/**
 * Return the bemap.Color which set the border color of the circle.
 * @return {bemap.Color} Return the Bemap.Color which set the border color of the circle.
 */
bemap.CircleStyle.prototype.getBorderColor = function() {
    return this.borderColor;
};

/**
* Set the bemap.Color which set the border color of the circle.
* @param {bemap.Color} Color the new bemap.Color to set the border color.
* @return {bemap.CircleStyle} Return this.
*/
bemap.CircleStyle.prototype.setBorderColor = function(borderColor) {
  this.borderColor = borderColor;
  return this;
};

/**
 * Return the border width of the circle.
 * @return {int} Return the border width of the circle.
 */
bemap.CircleStyle.prototype.getBorderWidth = function() {
    return this.borderWidth;
};


/**
 * Set the border width of the circle.
 * @param {double} width the new border width of the circle to set.
 * @return {bemap.CircleStyle} Return this.
 */
bemap.CircleStyle.prototype.setBorderWidth = function(borderWidth) {
    this.borderWidth = borderWidth;
    return this;
};

/**
 * BeNomad BeMap JavaScript API - clusterStyle
 */

/**
 * @classdesc
 * Base class for clusterStyle.
 * @public
 * @constructor
 * @param {Object} options See below the available values.
 * @param {bemap.Icon} options.icon Set the style of the non clustered marker.
 * @param {Int} options.size Set the size of the clustered marker marker.
 * @param {bemap.Color} options.borderColor Set the color of the border of the clustered marker.
 * @param {Int} options.borderSize Set the size of the border of the clustered marker.
 * @param {bemap.Color} options.color Set the background color of the clustered marker.
 * @param {bemap.Color} options.textColor Set the color of the text inside the clustered marker.
 * @param {int} options.textSize Set the size of the text inside the clustered marker.
 */
bemap.clusterStyle = function(options) {
    var opts = options || {};

    /**
     * @type {bemap.Icon}
     * @protected
     */
    this.native = null;

    /**
     * @type {bemap.Icon}
     * @protected
     */
    this.icon = opts.icon ? opts.icon : new bemap.Icon();

    /**
     * @type {int}
     * @protected
     */
    this.size = opts.size ? opts.size : 20;

    /**
     * @type {bemap.Color}
     * @protected
     */
    this.borderColor = opts.borderColor ? opts.borderColor : new bemap.Color(255, 255, 255, 1);

    /**
     * @type {int}
     * @protected
     */
    this.borderSize = opts.borderSize ? opts.borderSize : 3;

    /**
     * @type {bemap.Color}
     * @protected
     */
    this.color = opts.color ? opts.color : new bemap.Color(0, 150, 255, 1);

    /**
     * @type {bemap.Color}
     * @protected
     */
    this.textColor = opts.textColor ? opts.textColor : new bemap.Color(255, 255, 255, 1);

    /**
     * @type {int}
     * @protected
     */
    this.textSize = opts.textSize ? opts.textSize : 2;

    /**
     * @type {Object}
     * @protected
     */
    this.properties = opts.properties ? opts.properties : null;
};

/**
 * BeNomad BeMap JavaScript API - Color
 */

/**
 * @classdesc
 * Base class for Color.
 * @public
 * @constructor
 * @param {int} red a number beetween 0 and 255 to define the red component of color.
 * @param {int} green a number beetween 0 and 255 to define the green component of color.
 * @param {int} blue a number beetween 0 and 255 to define the blue component of color.
 * @param {float} alpha a number between 0 and 1 to define the opacity (alpha) channel of color. 1 to full opacity and 0 to full transparency.
 */
bemap.Color = function(red, green, blue, alpha) {

  /**
   * @type {int}
   * @protected
   */
  this.r = red ? bemap.Color.prototype._check(red) : 0;

  /**
   * @type {int}
   * @protected
   */
  this.g = green ? bemap.Color.prototype._check(green) : 0;

  /**
   * @type {int}
   * @protected
   */
  this.b = blue ? bemap.Color.prototype._check(blue) : 0;

  /**
   * @type {int}
   * @protected
   */
  this.a = (alpha !== undefined && alpha !== null) ? alpha : 1;
};

bemap.Color.prototype._check = function(n) {
  return Math.min(Math.round(n), 255);
};

bemap.Color.prototype._toHexString = function(n) {
  var hex = Number(n).toString(16);
  if (hex.length < 2) {
    hex = "0" + hex;
  }
  return hex;
};

/**
 * Return an hex string composed by red, green and blue components of color.
 * @public
 * @return {array} Return an hex string composed by red, green and blue components of color.
 */
bemap.Color.prototype.getHex = function() {
  return '#' + this._toHexString(this.r) + this._toHexString(this.g) + this._toHexString(this.b);
};

/**
 * Return an array composed by red, green and blue components of color.
 * @public
 * @return {array} Return an array composed by red, green and blue components of color.
 */
bemap.Color.prototype.getRgbArray = function() {
  return [this.r, this.g, this.b];
};

/**
 * Return an array composed by red, green, blue and alpha components of color.
 * @public
 * @return {array} Return an array composed by red, green, blue and alpha components of color.
 */
bemap.Color.prototype.getRgbaArray = function() {
  return [this.r, this.g, this.b, this.a];
};

/**
 * Return the red component of color.
 * @public
 * @return {int} Return the red component of color.
 */
bemap.Color.prototype.getRed = function() {
  return this.r;
};

/**
 * Set the red component of color, a number beetween 0 and 255.
 * @public
 * @param {int} red a number beetween 0 and 255 to define the red component of color.
 * @return {bemap.Color} Return this.
 */
bemap.Color.prototype.setRed = function(red) {
  this.r = bemap.Color.prototype._check(red);
  return this;
};

/**
 * Return the green component of color.
 * @public
 * @return {int} Return the green component of color.
 */
bemap.Color.prototype.getGreen = function() {
  return this.g;
};

/**
 * Set the green component of color, a number beetween 0 and 255.
 * @public
 * @param {int} green a number beetween 0 and 255 to define the green component of color.
 * @return {bemap.Color} Return this.
 */
bemap.Color.prototype.setGreen = function(green) {
  this.g = bemap.Color.prototype._check(green);
  return this;
};

/**
 * Return the blue component of color.
 * @public
 * @return {int} Return the blue component of color.
 */
bemap.Color.prototype.getBlue = function() {
  return this.b;
};

/**
 * Set the blue component of color, a number beetween 0 and 255.
 * @public
 * @param {int} blue a number beetween 0 and 255 to define the blue component of color.
 * @return {bemap.Color} Return this.
 */
bemap.Color.prototype.setBlue = function(blue) {
  this.b = bemap.Color.prototype._check(blue);
  return this;
};

/**
 * Return the opaticy (alpha) channel of color.
 * @public
 * @return {int} Return the alpha channel of color.
 */
bemap.Color.prototype.getAlpha = function() {
  return this.a;
};

/**
 * Set the opacity (alpha) channel of color, a number beetween 0 and 255.
 * @public
 * @param {int} alpha a number beetween 0 and 1 to define the opacity (alpha) channel of color.
 * @return {bemap.Color} Return this.
 */
bemap.Color.prototype.setAlpha = function(alpha) {
  this.a = alpha;
  return this;
};

/**
 * BeNomad BeMap JavaScript API - ConadMaxSpeed
 */

/**
 * @classdesc
 * Base class for conditional max speed.
 * @public
 * @constructor
 * @abstract
 * @param {object} options see below the available values.
 * @param {String} options.Type - NONE: No speed situation.
    - HAZMAT: Hazardous material.
    - TRAILER: Trailer.
    - WEIGHT: Weight.
    - WEATHER: Weather.
    - VEHICULE_TYPE: Vehicle type (transport type).
 * @param {String|Int} options.Value Condition value (see HAZMAT, WEATHER, WEIGHT: in tenths of tons, trailer: in number of trailers, vehicle type: a mask of transportation modes).
 * @param {Int} options.Speed The speed limit in kph.
 */
bemap.CondMaxSpeed = function(options) {
    var opts = options || {};

    /**
     * @type {String}
     * @protected
     */
    this.Type = opts.Type ? opts.Type : null;

    /**
     * @type {String|Int}
     * @protected
     */
    this.Value = opts.Value ? opts.Value : null;

    /**
     * @type {Int}
     * @protected
     */
    this.Speed = opts.Speed ? opts.Speed : null;
};

/**
 * Get the type of conditional max speed.
 * @return {String} Type
 */
bemap.CondMaxSpeed.prototype.getType = function() {
    return this.Type;
};

/**
 * Get the value of condition.
 * @return {String|Int}
 */
bemap.CondMaxSpeed.prototype.getValue = function() {
    return this.Value;
};

/**
 * Get the speed conditional speed limit.
 * @return {Int}
 */
bemap.CondMaxSpeed.prototype.getSpeed = function() {
    return this.Speed;
};

/**
 * BeNomad BeMap JavaScript API - Destination class
 */

/**
 * @classdesc
 * Base class for geographical coordinate used for a routing calculation.
 * @public
 * @constructor
 * @param {double} lon Longitude in degrees decimal (WGS84).
 * @param {double} lat Latitude in degrees decimal (WGS84).
 * @param {Object} options To set all fields of this class.
 */
bemap.Destination = function(lon, lat, options) {
  var opts = options || {};

  /**
   * (optional) altitude in meters.
   */
  this.altitude = opts.altitude ? opts.altitude : undefined;

  /**
   * (optional) heading angle in degrees. For BeNomad engine: If the angle is not available, set this field and speed field to 0.
   */
  this.heading = opts.heading ? opts.heading : undefined;

  /**
   * (optional) speed in km/h. For BeNomad engine: Use this field only if the heading is available.
   */
  this.speed = opts.speed ? opts.speed : undefined;

  /**
   * (optional) time stamp of GPS coordinate in milliseconds.
   */
  this.time = opts.time ? opts.time : undefined;

  /**
   * (optional) number of available GPS satellite when the coordinate is collected.
   */
  this.satellite = opts.satellite ? opts.satellite : undefined;

  /**
   * (optional) radius in meters of the waypoint.
   */
  this.radius = opts.radius ? opts.radius : undefined;

  /**
   * (optional) defines if this waypoint is ignored by the planner for its route calculation. Available values are true or false.
   */
  this.ignorePoint = opts.ignorePoint ? opts.ignorePoint : undefined;

  /**
   * (optional) Defines if traffic directions should be ignored by route planner between this waypoint and next one. Available values are true or false.
   */
  this.ignoreTrafficDirections = opts.ignoreTrafficDirections ? opts.ignoreTrafficDirections : undefined;

  /**
   * (optional) Defines if road blocks should be ignored by route planner between this waypoint and next one. Available values are true or false.
   */
  this.ignoreRoadBlocks = opts.ignoreRoadBlocks ? opts.ignoreRoadBlocks : undefined;

  /**
   * (optional) Defines if forbidden maneuvers and blocked passages should be ignored by route planner between this waypoint and next one. Available values are true or false.
   */
  this.ignoreRestrictions = opts.ignoreRestrictions ? opts.ignoreRestrictions : undefined;

  /**
   * (optional) Defines if a UTurn should be avoided (if possible) by route planner at this location. Available values are YES, NO or UNDEF.
   */
  this.avoidUTurn = opts.avoidUTurn ? opts.avoidUTurn : undefined;

  /**
   * (optional) If true and location is on is on a 2 way road, location's angle will be used as a general direction for departure from location. Available values are YES, NO or UNDEF.
   */
  this.useStartAngle = opts.useStartAngle ? opts.useStartAngle : undefined;

  /**
   * (optional) Defines if route planner must arrive on this waypoint on waypoint's side (if waypoint is on a 2 way road). Available values are YES, NO or UNDEF.
   */
  this.useStopRoadSide = opts.useStopRoadSide ? opts.useStopRoadSide : undefined;

  /**
   * (optional) If mandatory is set to true, the coordinate will be kept in the way-points response array. Available values are true or false.
   */
  this.mandatory = opts.mandatory ? opts.mandatory : undefined;

  bemap.Coordinate.call(this, lon, lat, options);
};
bemap.inherits(bemap.Destination, bemap.Coordinate);

/**
 * BeNomad BeMap JavaScript API - Error
 */

/**
 * @classdesc
 * Base class for bemap error.
 * @public
 * @constructor
 * @abstract
 * @param {object} options see below the available values.
 * @param {String} options.code the error code.
 * @param {Int} options.message the error message.
 */
bemap.Error = function(options) {
    var opts = options || {};

    /**
     * @type {String}
     * @protected
     */
    this.code = opts.code ? opts.code : null;

    /**
     * @type {String}
     * @protected
     */
    this.message = opts.message ? opts.message : null;
};

/**
 * Get the code of the error.
 * @return {String} code
 */
bemap.Error.prototype.getCode = function() {
    return this.code;
};

/**
 * Get the message of the error.
 * @return {String} message
 */
bemap.Error.prototype.getMessage = function() {
    return this.message;
};

/**
 * BeNomad BeMap JavaScript API - GeocodingItem
 */

/**
 * @classdesc
 * Base class for geocoding items.
 * @public
 * @constructor
 * @abstract
 * @param {object} options see below the available values.
 * @param {bemap.Coordinate} options.Coordinate
 * @param {Array.<bemap.PostalAddress>} options.PostalAddress
 * @param {Int} options.Angle
 * @param {Int} options.SpeedLimit
 * @param {Double} options.RelevanceScore
 * @param {bemap.RoadFeature} options.RoadFeature
 */
bemap.GeocodingItem = function(options) {
    var opts = options || {};

    /**
     * @type {bemap.Coordinate}
     * @protected
     */
    this.Coordinate = opts.Coordinate ? opts.Coordinate : null;

    /**
     * @type {Array.<bemap.PostalAddress>}
     * @protected
     */
    this.PostalAddress = opts.PostalAddress ? opts.PostalAddress : [];

    /**
     * @type {Int}
     * @protected
     */
    this.Angle = opts.Angle ? opts.Angle : 0;

    /**
     * @type {Int}
     * @protected
     */
    this.SpeedLimit = opts.SpeedLimit ? opts.SpeedLimit : 0;

    /**
     * @type {Double}
     * @protected
     */
    this.RelevanceScore = opts.RelevanceScore ? opts.RelevanceScore : 0;

    /**
     * @type {bemap.RoadFeature}
     * @protected
     */
    this.RoadFeature = opts.RoadFeature ? opts.RoadFeature : null;
};

/**
 * Get the coordinates.
 * @return {bemap.Coordinate} Coordinate
 */
bemap.GeocodingItem.prototype.getCoordinate = function() {
    return this.Coordinate;
};

/**
 * Get the postal address.
 * @return {bemap.PostalAddress} PostalAddress
 */
bemap.GeocodingItem.prototype.getPostalAddress = function() {
    return this.PostalAddress;
};

/**
 * Get the angle.
 * @return {Int} Angle
 */
bemap.GeocodingItem.prototype.getAngle = function() {
    return this.Angle;
};

/**
 * Get the speed limit.
 * @return {Int} SpeedLimit
 */
bemap.GeocodingItem.prototype.getSpeedLimit = function() {
    return this.SpeedLimit;
};

/**
 * Get the relevance score.
 * @return {Double} RelevanceSvore
 */
bemap.GeocodingItem.prototype.getRelevanceScore = function() {
    return this.RelevanceScore;
};

/**
 * Get the road informations
 * @return {bemap.RoadFeature} RoadFeature
 */
bemap.GeocodingItem.prototype.getRoadFeature = function() {
    return this.RoadFeature;
};

/**
 * BeNomad BeMap JavaScript API - GeocodingResponse
 */

/**
 * @classdesc
 * Base class for reverse geocoding search information.
 * @public
 * @constructor
 * @abstract
 * @param {object} options see below the available values.
 * @param {bemap.BoundingBox} options.extent
 * @param {bemap.PostalAddress} options.postalAddress
 */
bemap.GeocodingResponse = function(options) {
    var opts = options || {};

    /**
     * @type {String}
     * @protected
     */
    this.action = opts.action ? opts.action : null;

    /**
     * @type {Array.<bemap.GeocodingItem>}
     * @protected
     */
    this.geocodingItems = opts.geocodingItems ? opts.geocodingItems : [];

    /**
     * @type {bemap.BoundingBox}
     * @protected
     */
    this.extent = opts.extent ? opts.extent : new bemap.BoundingBox();
};

bemap.GeocodingResponse.prototype.getAction = function() {
    return this.action;
};

/**
 * Get the geocoding items.
 * @return {Array.<bemap.GeocodingItem>} geocodingItems.
 */
bemap.GeocodingResponse.prototype.getGeocodingItems = function() {
    return this.geocodingItems;
};

/**
 * Get extent.
 * @return {bemap.BoundingBox} extent.
 */
bemap.GeocodingResponse.prototype.getExtent = function() {
    return this.extent;
};

/**
 * BeNomad BeMap JavaScript API - GeoSearchInfo
 */

/**
 * @classdesc
 * Base class for geocoding search information.
 * @public
 * @constructor
 * @abstract
 * @param {object} options see below the available values.
 * @param {String} options.state
 * @param {String} options.city
 * @param {String} options.country
 * @param {String} options.countryCode
 * @param {String} options.county
 * @param {String} options.district
 * @param {String} options.street
 * @param {String} options.streetNumber
 * @param {String} options.postalCode
 * @param {String} options.searchType Defines all the possible types of research that can be applied to a textual pattern. Available values: CONTAINS, FUZZY, KEY_SEARCH, STRICT, STRICT_BEGINNING, WORD_BEGINNING
 * @param {String} options.language Define the language that will be used to perform the address lookup.
 * @param {Int} options.maxResult The maximum number of items used to perform the research and returned items by the server. Default is 1.
 * @param {bemap.BoundingBox} options.boundingBox the bounding box that will limit the research to a specific area.
 */
bemap.GeoSearchInfo = function(options) {
    var opts = options || {};

    /**
     * @type {String}
     * @protected
     */
    this.state = opts.state ? opts.state : null;

    /**
     * @type {String}
     * @protected
     */
    this.city = opts.city ? opts.city : null;

    /**
     * @type {String}
     * @protected
     */
    this.country = opts.country ? opts.country : null;

    /**
     * @type {String}
     * @protected
     */
    this.countryCode = opts.countryCode ? opts.countryCode : null;

    /**
     * @type {String}
     * @protected
     */
    this.county = opts.county ? opts.county : null;

    /**
     * @type {String}
     * @protected
     */
    this.district = opts.district ? opts.district : null;

    /**
     * @type {String}
     * @protected
     */
    this.street = opts.street ? opts.street : null;

    /**
     * @type {String}
     * @protected
     */
    this.streetNumber = opts.streetNumber ? opts.streetNumber : null;

    /**
     * @type {String}
     * @protected
     */
    this.postalCode = opts.postalCode ? opts.postalCode : null;

    /**
     * @type {String}
     * @protected
     */
    this.searchType = opts.searchType ? opts.searchType : null;

    /**
     * @type {String}
     * @protected
     */
    this.language = opts.language ? opts.language : null;

    /**
     * @type {int}
     * @protected
     */
    this.maxResult = opts.maxResult ? opts.maxResult : null;

    /**
     * @type {bemap.BoundingBox}
     * @protected
     */
    this.bbox = opts.boundingBox ? opts.boundingBox : null;
};

/**
 * Get state informations.
 * @return {String} state.
 */
bemap.GeoSearchInfo.prototype.getState = function() {
    return this.state;
};

/**
 * Get the city information.
 * @return {String} city.
 */
bemap.GeoSearchInfo.prototype.getCity = function() {
    return this.city;
};

/**
 * Get the country information.
 * @return {String} country
 */
bemap.GeoSearchInfo.prototype.getCountry = function() {
    return this.country;
};

/**
 * Get the country information.
 * @return {String} country
 */
bemap.GeoSearchInfo.prototype.getCountryCode = function() {
    return this.countryCode;
};

/**
 * Get the county information.
 * @return {String} county.
 */
bemap.GeoSearchInfo.prototype.getCounty = function() {
    return this.county;
};

/**
 * Get the district information.
 * @return {String} district.
 */
bemap.GeoSearchInfo.prototype.getDistrict = function() {
    return this.district;
};

/**
 * Get the street information.
 * @return {String} street.
 */
bemap.GeoSearchInfo.prototype.getStreet = function() {
    return this.street;
};

/**
 * Get the street number information.
 * @return {String} streetNumber.
 */
bemap.GeoSearchInfo.prototype.getStreetNumber = function() {
    return this.streetNumber;
};
/**
 * Get the postal code information.
 * @return {String} postalCode.
 */
bemap.GeoSearchInfo.prototype.getPostalCode = function() {
    return this.postalCode;
};
/**
 * Get the search type information.
 * @return {String} searchType.
 */
bemap.GeoSearchInfo.prototype.getSearchType = function() {
    return this.searchType;
};
/**
 * Get the language information.
 * @return {String} language.
 */
bemap.GeoSearchInfo.prototype.getLanguage = function() {
    return this.language;
};
/**
 * Get the number maximum of result.
 * @return {String} maxResult.
 */
bemap.GeoSearchInfo.prototype.getMaxResult = function() {
    return this.maxResult;
};
/**
 * Get the street number maximum of result.
 * @return {String} bbox.
 */
bemap.GeoSearchInfo.prototype.getBoundingBox = function() {
    return this.bbox;
};

/**
 * Set state informations.
 * @param {String} state the new state to set.
 * @return {bemap.GeoSearchInfo} this.
 */
bemap.GeoSearchInfo.prototype.setState = function(state) {
    this.state = state;
    return this;
};

/**
 * Set the city information.
 * @param {String} city the new city to set.
 * @return {bemap.GeoSearchInfo} this.
 */
bemap.GeoSearchInfo.prototype.setCity = function(city) {
    this.city = city;
    return this;
};

/**
 * Set the country information.
 * @param {String} country the new country to set.
 * @return {bemap.GeoSearchInfo} this.
 */
bemap.GeoSearchInfo.prototype.setCountry = function(country) {
    this.country = country;
    return this;
};

/**
 * Set the country information.
 * @param {String} countryCode the new country to set.
 * @return {bemap.GeoSearchInfo} this.
 */
bemap.GeoSearchInfo.prototype.setCountryCode = function(countryCode) {
    this.countryCode = countryCode;
    return this;
};

/**
 * Set the county information.
 * @param {String} county the new county to set.
 * @return {bemap.GeoSearchInfo} this.
 */
bemap.GeoSearchInfo.prototype.setCounty = function(county) {
    this.county = county;
    return this;
};

/**
 * Set the district information.
 * @param {String} district the new district to set.
 * @return {bemap.GeoSearchInfo} this.
 */
bemap.GeoSearchInfo.prototype.setDistrict = function(district) {
    this.district = district;
    return this;
};

/**
 * Set the street information.
 * @param {String} street the new street to set.
 * @return {bemap.GeoSearchInfo} this.
 */
bemap.GeoSearchInfo.prototype.setStreet = function(street) {
    this.street = street;
    return this;
};

/**
 * Set the street number information.
 * @param {String} streetNumber the new street number to set.
 * @return {bemap.GeoSearchInfo} this.
 */
bemap.GeoSearchInfo.prototype.setStreetNumber = function(streetNumber) {
    this.streetNumber = streetNumber;
    return this;
};
/**
 * Set the postal code information.
 * @param {String} postalCode the new postal code to set.
 * @return {bemap.GeoSearchInfo} this.
 */
bemap.GeoSearchInfo.prototype.setPostalCode = function(postalCode) {
    this.postalCode = postalCode;
    return this;
};
/**
 * Set the search type information.
 * @param {String} searchType the new search type to set.
 * @return {bemap.GeoSearchInfo} this.
 */
bemap.GeoSearchInfo.prototype.setSearchType = function(searchType) {
    this.searchType = searchType;
    return this;
};
/**
 * Set the language information.
 * @param {String} language the new language to set.
 * @return {bemap.GeoSearchInfo} this.
 */
bemap.GeoSearchInfo.prototype.setLanguage = function(language) {
    this.language = language;
    return this;
};
/**
 * Set the number maximum of result.
 * @param {Int} maxResult the new maximal result to set.
 * @return {bemap.GeoSearchInfo} this.
 */
bemap.GeoSearchInfo.prototype.setMaxResult = function(maxResult) {
    this.maxResult = maxResult;
    return this;
};
/**
 * Set the street number maximum of result.
 * @param {String} bbox the boundingBox new to set.
 * @return {bemap.GeoSearchInfo} this.
 */
bemap.GeoSearchInfo.prototype.setBoundingBox = function(bbox) {
    this.bbox = bbox;
    return this;
};

/**
 * BeNomad BeMap JavaScript API - HeatmapLayer class
 * MapLibre-exclusive: visualize point density with customizable heatmap layers.
 */

/**
 * @classdesc
 * Layer for heatmap visualization from point data. MapLibre only.
 * @public
 * @constructor
 * @extends {bemap.Layer}
 * @param {Object} options
 * @param {Array} options.points Array of {lon, lat, weight} objects.
 * @param {String} options.weightProperty Property name for weight (default: 'weight').
 * @param {Number} options.radius Heatmap radius in pixels (default: 20).
 * @param {Number} options.intensity Heatmap intensity (default: 1).
 * @param {Array} options.colors Array of color strings for gradient (default: blue→red).
 */
bemap.HeatmapLayer = function(options) {
  var opts = options || {};

  this.points = opts.points ? opts.points : [];
  this.weightProperty = opts.weightProperty ? opts.weightProperty : 'weight';
  this.radius = opts.radius ? opts.radius : 20;
  this.intensity = opts.intensity ? opts.intensity : 1;
  this.colors = opts.colors ? opts.colors : ['rgba(0,0,255,0)', 'royalblue', 'cyan', 'lime', 'yellow', 'red'];
  this.opacity = opts.opacity !== undefined ? opts.opacity : 0.8;

  bemap.Layer.call(this, options);
};
bemap.inherits(bemap.HeatmapLayer, bemap.Layer);

/**
 * BeNomad BeMap JavaScript API - Icon class
 */

/**
 * @classdesc
 * Base class for icon.
 * @public
 * @constructor
 * @param {object} options See below the available values.
 * @param {String} options.src Source of the image. It can be an URL or an folder path.
 * @param {double} options.anchorX .
 * @param {double} options.anchorY .
 * @param {String} options.anchorXUnits Units of the anchorX.
 * @param {String} options.anchorYUnits Units of the anchorY.
 * @param {float} options.opacity a number between 0 and 1 to define the opacity of the icon. 1 to full opacity and 0 to full transparency.
 */
bemap.Icon = function(options) {
    var opts = options || {};

    /**
     * @type {object}
     * @protected
     */
    this.native = null;

    /**
     * @type {String}
     * @protected
     */
    this.src = opts.src ? opts.src : 'http://openlayers.org/en/v3.18.2/examples/data/icon.png';

    /**
     * @type {double}
     * @protected
     */
    this.width = opts.width ? opts.width : null;

    /**
     * @type {double}
     * @protected
     */
    this.height = opts.height ? opts.height : null;

    /**
     * @type {double}
     * @protected
     */
    this.anchorX = opts.anchorX ? opts.anchorX : 0.5;

    /**
     * @type {double}
     * @protected
     */
    this.anchorY = opts.anchorY ? opts.anchorY : 1;

    /**
     * @type {String}
     * @protected
     */
    this.anchorXUnits = opts.anchorXUnits ? opts.anchorXUnits : 'fraction';

    /**
     * {String}
     * @protected
     */
    this.anchorYUnits = opts.anchorYUnits ? opts.anchorYUnits : 'fraction';

    /**
     * @type {float}
     * @protected
     */
    this.opacity = opts.opacity ? opts.opacity : 0;

    /**
     * @type {float}
     * @protected
     */
    this.scale = opts.scale ? opts.scale : 1;
};

/**
 * Return the Source of the image.
 * @public
 * @return {String} Return the source of the image.
 */
bemap.Icon.prototype.getSrc = function() {
    return this.src;
};

/**
 * Set the Source of the image.
 * @public
 * @return {bemap.Icon} Return this.
 */
bemap.Icon.prototype.setSrc = function(src) {
    this.src = src;
    return this;
};

/**
 * Return the width of the image.
 * @public
 * @return {double} Return the width of the image.
 */
bemap.Icon.prototype.getWidth = function() {
    return this.width;
};

/**
 * Set the width of the image.
 * @public
 * @return {bemap.Icon} Return this.
 */
bemap.Icon.prototype.setWidth = function(width) {
    this.width = width;
    return this;
};

/**
 * Return the height of the image.
 * @public
 * @return {double} Return the height of the image.
 */
bemap.Icon.prototype.getHeight = function() {
    return this.height;
};

/**
 * Set the height of the image.
 * @public
 * @return {bemap.Icon} Return this.
 */
bemap.Icon.prototype.setHeight = function(height) {
    this.height = height;
    return this;
};

/**
 * Return the horizontale anchor of the image.
 * @public
 * @return {double} Return the horizontale anchor of the image.
 */
bemap.Icon.prototype.getAnchorX = function() {
    return this.anchorX;
};

/**
 * Set the horizontale anchor of the image.
 * @public
 * @return {bemap.Icon} Return this.
 */
bemap.Icon.prototype.setAnchorX = function(anchorX) {
    this.anchorX = anchorX;
    return this;
};

/**
 * Return the verticale anchor of the image.
 * @public
 * @return {double} Return the verticale anchor of the image.
 */
bemap.Icon.prototype.getAnchorY = function() {
    return this.anchorY;
};

/**
 * Set the verticale anchor of the image.
 * @public
 * @return {bemap.Icon} Return this.
 */
bemap.Icon.prototype.setAnchorY = function(anchorY) {
    this.anchorY = anchorY;
    return this;
};

/**
 * Return the units horizontale anchor of the image.
 * @public
 * @return {String} Return the units horizontale anchor of the image.
 */
bemap.Icon.prototype.getAnchorXUnits = function() {
    return this.anchorXUnits;
};

/**
 * Set the horizontale anchor units the image.
 * @public
 * @return {bemap.Icon} Return this.
 */
bemap.Icon.prototype.setAnchorXUnits = function(anchorXUnits) {
    this.anchorXUnits = anchorXUnits;
    return this;
};

/**
 * Return the units verticale anchor of the image.
 * @public
 * @return {String} Return the units verticale anchor of the image.
 */
bemap.Icon.prototype.getAnchorYUnits = function() {
    return this.anchorYUnits;
};

/**
 * Set the vertical anchor units the image.
 * @public
 * @return {bemap.Icon} Return this.
 */
bemap.Icon.prototype.setAnchorYUnits = function(anchorYUnits) {
    this.anchorYUnits = anchorYUnits;
    return this;
};

/**
 * Return the opacity the image.
 * @public
 * @return {float} Return the opacity of the image.
 */
bemap.Icon.prototype.getOpacity = function() {
    return this.opacity;
};

/**
 * Set the opacity of the image.
 * @public
 * @return {bemap.Icon} Return this.
 */
bemap.Icon.prototype.setOpacity = function(opacity) {
    this.opacity = opacity;
    return this;
};

/**
 * BeNomad BeMap JavaScript API - LineStyle
 */

/**
 * @classdesc
 * Base class for LineStyle.
 * @public
 * @constructor
 * @param {Object} options See below the available values.
 * @param {bemap.Color} options.color Set the color of the line with a bemap.Color.
 * @param {int} options.width Set the width of the line in pixels.
 * @param {bemap.LineStyle.TYPE} options.type define the type of the line.
 */
bemap.LineStyle = function(options) {
    var opts = options || {};

    /**
     * @type {Object}
     * @protected
     */
    this.native = null;

    /**
     * @type {Object}
     * @protected
     */
    this.color = opts.color ? opts.color : new bemap.Color();

    /**
     * @type {int}
     * @protected
     */
    this.width = opts.width ? opts.width : 3;

    /**
     * @type {String}
     * @protected
     */
    this.type = opts.type ? opts.type : bemap.LineStyle.TYPE.PLANE;
};

/**
 * List of available type for the line style.
 * @public
 * @enum bemap.LineStyle.TYPE
 */
bemap.LineStyle.TYPE = {
    DASH: "dash",
    PLANE: "plane",
    DOT: "dot",
    DOT_DASH: "dot dash"
};

/**
 * Get the type of the line style.
 * @return {String} the type og the polyline.
 */
bemap.LineStyle.prototype.getType = function() {
    return this.type;
};

/**
 * Return the bemap.Color which set the color of the line.
 * @return {bemap.Color} Return the Bemap.Color which set the color of the line.
 */
bemap.LineStyle.prototype.getColor = function() {
    return this.color;
};

/**
 * Return the width of the line.
 * @return {int} Return the width of the line.
 */
bemap.LineStyle.prototype.getWidth = function() {
    return this.width;
};

/**
 * Set the bemap.Color which set the color of the line.
 * @param {bemap.Color} Color the new bemap.Color to set.
 * @return {bemap.LineStyle} Return this.
 */
bemap.LineStyle.prototype.setColor = function(color) {
    this.color = color;
    return this;
};

/**
 * Set the width of the line.
 * @param {double} width the new width of the line to set.
 * @return {bemap.LineStyle} Return this.
 */
bemap.LineStyle.prototype.setWidth = function(width) {
    this.width = width;
    return this;
};

/**
 * Set the type of the polyline.
 * @param {String} type the new type to set.
 * @return {bemap.LineStyle} return this.
 */
bemap.LineStyle.prototype.setType = function(type) {
    this.type = type;
    return this;
};

/**
 * BeNomad BeMap JavaScript API - Marker
 */

/**
 * @classdesc
 * Base class for marker.
 * @public
 * @constructor
 * @param {bemap.Coordinate} coordinates in bemap.Coordinate.
 * @param {Object} options See below the available values.
 * @param {bemap.Icon} options.icon Style of marker used by the renderer.
 * @param {String} options.name Name of marker.
 * @param {Object} options.properties custom object.
 */
bemap.Marker = function(coordinate, options) {
  var opts = options || {};

  /**
   * @type {Object}
   * @protected
   */
  this.native = null;

  /**
   * @type {Object}
   * @protected
   */
  this.map = null;

  /**
   * @type {Object}
   * @protected
   */
  this.layer = null;

  /**
   * @type {bemap.Coordinate}
   * @protected
   */
  this.coordinate = coordinate ? coordinate : new bemap.Coordinate();

  /**
   * @type {bemap.Icon}
   * @protected
   */
  this.icon = opts.icon ? opts.icon : null;

  /**
   * @type {String}
   * @protected
   */
  this.id = opts.id ? opts.id : null;

  /**
   * @type {String}
   * @protected
   */
  this.name = opts.name ? opts.name : null;

  /**
   * @type {String}
   * @protected
   */
  this.textStyle = opts.textStyle ? opts.textStyle : null;

  /**
   * @type {Array}
   * @protected
   */
  this.events = [];

  /**
   * @type {Function}
   * @protected
   */
  this.callback = [];

  /**
   * @type {Object}
   * @protected
   */
  this.properties = opts.properties ? opts.properties : null;
};

/**
 * Return the bemap.Icon that define the style of the marker.
 * @public
 * @return {bemap.Icon} Return the bemap.Icon that define the style of the marker.
 */
bemap.Marker.prototype.getIcon = function() {
  return this.icon;
};

/**
 * Set the icon style of the marker.
 * @public
 * @param {bemap.Icon} icon the new icon style to set.
 * @return {bemap.Marker} this
 */
bemap.Marker.prototype.setIcon = function(icon) {
  this.icon = icon;
  return this;
};

/**
 * Return the id of the marker.
 * @public
 * @return {String} Return the id of the marker.
 */
bemap.Marker.prototype.getId = function() {
  return this.id;
};

/**
 * Define the id of marker
 * @public
 * @param {String} id the new id to set.
 * @return {bemap.Marker} this
 */
bemap.Marker.prototype.setId = function(id) {
  this.id = id;
  return this;
};

/**
 * Return the properties of the marker.
 * @public
 * @return {String} Return the properties of the marker.
 */
bemap.Marker.prototype.getProperties = function() {
  return this.properties;
};

/**
 * Define the properties of marker
 * @public
 * @param {String} properties the new properties to set.
 * @return {bemap.Marker} this
 */
bemap.Marker.prototype.setProperties = function(properties) {
  this.properties = properties;
  return this;
};

/**
 * Return the name of the marker.
 * @public
 * @return {String} Return the name of the marker.
 */
bemap.Marker.prototype.getName = function() {
  return this.name;
};

/**
 * Define the name of polyline
 * @public
 * @param {String} name the new name to set.
 * @return {bemap.Marker} this
 */
bemap.Marker.prototype.setName = function(name) {
  this.name = name;
  return this;
};

/**
 * Return the bemap.TextStyle that define the style of text.
 * @public
 * @return {bemap.TextStyle} Return the bemap.TextStyle that define the style of text.
 */
bemap.Marker.prototype.getTextStyle = function() {
  return this.textStyle;
};

/**
 * Set the text style of the marker.
 * @public
 * @param {bemap.TextStyle} icon the new text style to set.
 * @return {bemap.Marker} this
 */
bemap.Marker.prototype.setTextStyle = function(textStyle) {
  this.textStyle = textStyle;
  return this;
};

/**
 * Return the bemap.Coordinate. See bemap.Coordinate.
 * @public
 * @return {bemap.Coordinate} Return the bemap.Coordinate. See bemap.Coordinate.
 */
bemap.Marker.prototype.getCoordinate = function() {
  return this.coordinate;
};

/**
 * Set the coordinates of the marker.
 * @public
 * @param {bemap.Coordinate} coordinate the new coordinates to set.
 * @return {bemap.Marker} this
 */
bemap.Marker.prototype.setCoordinate = function(coordinate) {
  this.coordinate = coordinate;
  if (this.native && this.map) {
    this.map.setCoordinateMarker(this);
  }
  return this;
};


/**
 * Remove the Marker from the layer.
 * @public
 * @return {bemap.Marker} this
 */
bemap.Marker.prototype.remove = function() {
  if (this.map !== null && bemap.inheritsof(this.map, bemap.Map)) {
    this.map.removeMarker(this);
  }
  return this;
};

/**
 * Set the listner when an specified eventType occur on bemap.Marker.
 * @public
 * @param {bemap.Map.EventType} eventType Event type.
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options options.
 * @return {bemap.Marker} this.
 */
bemap.Marker.prototype.on = function(eventType, callback, options) {
  if (this.map !== null && bemap.inheritsof(this.map, bemap.Map)) {
    this.map.onMarker(this, eventType, callback, options);
  }
  return this;
};

/**
 * Define the draggable capability for bemap.Marker.
 * @protected
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options Options.
 * @param {bemap.Layer} options.layerFilter set the bemap layer used as filter.
 * @return {bemap.Listener} bemap.listener.
 */
bemap.Marker.prototype.draggable = function(callback, options) {
  if (this.map !== null && bemap.inheritsof(this.map, bemap.Map)) {
    return this.map.draggableMarker(this, callback, options);
  }
  return new bemap.Listener();
};

/**
 * BeNomad BeMap JavaScript API - MultiMarker
 */

/**
 * @classdesc
 * Base class for multimarker.
 * @public
 * @constructor
 * @param {bemap.Coordinate} coordinates Array of bemap.Coordinate.
 * @param {Object} options See below the available values.
 * @param {bemap.Icon} options.icon Style of marker used by the renderer.
 * @param {String} options.name Name of multimarker.
 * @param {Object} options.properties custom object.
 */
bemap.MultiMarker = function(coordinates, options) {
    var opts = options || {};

    /**
     * @type {Object}
     * @protected
     */
    this.native = null;

    /**
     * @type {Object}
     * @protected
     */
    this.map = null;

    /**
     * @type {Object}
     * @protected
     */
    this.layer = null;

    /**
     * @protected
     */
    this.coords = coordinates ? coordinates : [];

    /**
     * @type {bemap.Icon}
     * @protected
     */
    this.icon = opts.icon ? opts.icon : null;

    /**
     * @type {String}
     * @protected
     */
    this.id = opts.id ? opts.id : null;

    /**
     * @type {Array}
     * @protected
     */
    this.events = [];

    /**
     * @type {Function}
     * @protected
     */
    this.callback = [];

    /**
     * @type {String}
     * @protected
     */
    this.name = opts.name ? opts.name : null;

    /**
     * @type {String}
     * @protected
     */
    this.textStyle = opts.textStyle ? opts.textStyle : null;

    /**
     * @type {Object}
     * @protected
     */
    this.properties = opts.properties ? opts.properties : null;
};

/**
 * Add a coordinate.
 * @public
 * @param {bemap.Coordinate} coordinate bemap.Coordinate.
 */
bemap.MultiMarker.prototype.addCoordinate = function(coordinate) {
    if (coordinate === null || !bemap.inheritsof(coordinate, bemap.Coordinate)) {
        throw new bemap.Exception("coordinate is not an bemap.Coordinate object");
    }
    this.coords.push(coordinate);
    return this;
};

/**
 * Add a coordinate.
 * @public
 * @param {double} lon Longitude in degres deciaml (WGS84).
 * @param {double} lat Latitude in degres deciaml (WGS84).
 */
bemap.MultiMarker.prototype.addLonLat = function(lon, lat) {
    this.coords.push(new bemap.Coordinate(lon, lat));
    return this;
};

/**
 * Return an array with longitude and latitude in degres decimal (WGS94).
 * @public
 * @param {int} index Index of the coordinates in multimarker.
 * @return {array} Return an array with longitude and latitude in degres decimal (WGS94).
 */
bemap.MultiMarker.prototype.getLonLatArray = function(index) {
    return [this.coords[index].lon, this.coords[index].lat];
};

/**
 * Return an array with latitude and longitude in degres decimal (WGS94).
 * @public
 * @param {int} index Index of coordinate in polyline.
 * @return {array} Return an array with latitude and longitude in degres decimal (WGS94).
 */
bemap.MultiMarker.prototype.getLatLonArray = function(index) {
    return this.coords[index].getLatLonArray();
};

/**
 * Return an array with longitude and latitude in degres decimal (WGS94).
 * Example: [ [lon, lat], [lon, lat], ... ]
 * @public
 * @return {array} Return an array with longitude and latitude in degres decimal (WGS94).
 */
bemap.MultiMarker.prototype.getLonLatArrays = function() {
    var i = 0,
        iLen = this.coords.length,
        rets = [],
        c;
    for (; i < iLen; i++) {
        c = this.coords[i];
        rets.push([c.lon, c.lat]);
    }
    return rets;
};

/**
 * Return the bemap.Icon that define the style of the multimarker.
 * @public
 * @return {bemap.Icon} Return the bemap.Icon that define the style of the multimarker.
 */
bemap.MultiMarker.prototype.getIcon = function() {
    return this.icon;
};

/**
 * Set the icon style of the multimarker.
 * @public
 * @param {bemap.Icon} icon the new icon style to set.
 * @return {bemap.MultiMarker} Return this.
 */
bemap.MultiMarker.prototype.setIcon = function(icon) {
    this.icon = icon;
    return this;
};

/**
 * Return the id of the multimarker.
 * @public
 * @return {String} Return the id of the multimarker.
 */
bemap.MultiMarker.prototype.getId = function() {
    return this.id;
};

/**
 * Define the id of multimarker
 * @public
 * @param {String} id the new id to set.
 * @return {bemap.MultiMarker} this
 */
bemap.MultiMarker.prototype.setId = function(id) {
    this.id = id;
    return this;
};

/**
 * Return the name of the multimarker.
 * @public
 * @return {String} Return the name of the multimarker.
 */
bemap.MultiMarker.prototype.getName = function() {
    return this.name;
};


/**
 * Define the name of multimarker.
 * @public
 * @param {String} name the new name to set.
 * @return {bemap.MultiMarker} Return this.
 */
bemap.MultiMarker.prototype.setName = function(name) {
    this.name = name;
    return this;
};


/**
 * Return the bemap.TextStyle that define the style of text.
 * @public
 * @return {bemap.TextStyle} Return the bemap.TextStyle that define the style of text.
 */
bemap.Marker.prototype.getTextStyle = function() {
    return this.textStyle;
};

/**
 * Set the text style of the multimarker.
 * @public
 * @param {bemap.TextStyle} icon the new text style to set.
 * @return {bemap.MultiMarker} this
 */
bemap.Marker.prototype.setTextStyle = function(textStyle) {
    this.textStyle = textStyle;
    return this;
};

/**
 * Define the coordinate.
 * @public
 * @param {int} index index of coordinates in multimarker.
 * @param {bemap.Coordinate} coords new coordinates to set.
 * @return {bemap.MultiMarker} Return this.
 */
bemap.MultiMarker.prototype.setCoordinate = function(index, coords) {
    this.coords[index] = coords;
    return this;
};

/**
 * Define the coordinates.
 * @public
 * @param {bemap.Coordinate} coords new coordinates to set.
 * @return {bemap.MultiMarker} Return this.
 */
bemap.MultiMarker.prototype.setCoordinates = function(coords) {
    this.coords = coords;
    return this;
};

/**
 * Return the coordinates. See bemap.Coordinate.
 * @public
 * @return {bemap.Coordinate} Return the coordinates. See bemap.Coordinate.
 */
bemap.MultiMarker.prototype.getCoordinates = function() {
    return this.coords;
};

/**
 * Return the coordinate. See bemap.Coordinate.
 * @public
 * @param {int} index Index of coordinate in multimarker.
 * @return {bemap.Coordinate} Return the coordinate. See bemap.Coordinate.
 */
bemap.MultiMarker.prototype.getCoordinate = function(index) {
    return this.coords[index];
};

/**
 * Remove the MultiMarker from the layer.
 * @public
 */
bemap.MultiMarker.prototype.remove = function() {
    if (this.map !== null && bemap.inheritsof(this.map, bemap.Map)) {
        this.map.removeMultimarker(this);
    }
    return this;
};

/**
 * BeNomad BeMap JavaScript API - PMTilesLayer class
 * Layer for PMTiles vector tile sources. MapLibre only.
 * Requires pmtiles.js library to be loaded.
 */

/**
 * @classdesc
 * Layer for PMTiles vector tile sources.
 * Handles PMTiles protocol registration and authenticated access.
 * @public
 * @constructor
 * @extends {bemap.Layer}
 * @param {Object} options See below.
 * @param {String} options.url PMTiles file URL (e.g. 'https://server.com/tiles.pmtiles').
 * @param {String} options.style Style JSON URL or object for rendering the vector tiles.
 * @param {String} options.token Authentication token (e.g. JWT) sent as X-Session-Token header.
 * @param {String} options.tokenHeader Custom header name for authentication (default: 'X-Session-Token').
 * @param {String} options.sourceName Source name used in the style (default: 'tiles').
 * @param {Number} options.maxZoom Max zoom level for the source (default: 14).
 * @param {String} options.glyphs URL template for font glyphs.
 */
bemap.PMTilesLayer = function(options) {
  var opts = options || {};

  /** @type {String} @protected */
  this.url = opts.url ? opts.url : null;

  /** @type {Object|String} @protected */
  this.style = opts.style ? opts.style : null;

  /** @type {String} @protected */
  this.token = opts.token ? opts.token : null;

  /** @type {String} @protected */
  this.tokenHeader = opts.tokenHeader ? opts.tokenHeader : 'X-Session-Token';

  /** @type {String} @protected */
  this.sourceName = opts.sourceName ? opts.sourceName : 'tiles';

  /** @type {Number} @protected */
  this.pmtilesMaxZoom = opts.maxZoom !== undefined ? opts.maxZoom : 14;

  /** @type {String} @protected */
  this.glyphs = opts.glyphs ? opts.glyphs : 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf';

  bemap.Layer.call(this, options);
};
bemap.inherits(bemap.PMTilesLayer, bemap.Layer);

/**
 * BeNomad BeMap JavaScript API - Polygon class
 */

/**
 * @classdesc
 * Base class for Polygon.
 * @public
 * @constructor
 * @param {bemap.Coordinate} coordinates Array of bemap.Coordinate.
 * @param {Object} options See below the available values.
 * @param {bemap.LineStyle} options.style Style of poyline used by the renderer.
 * @param {String} options.name Name of polygon.
 * @param {Object} options.properties custom object.
 */
bemap.Polygon = function (coordinates, options) {
    var opts = options || {};

    /**
     * @type {Object}
     * @protected
     */
    this.native = null;

    /**
     * @type {Object}
     * @protected
     */
    this.map = null;

    /**
     * @type {Object}
     * @protected
     */
    this.layer = null;

    /**
     * @type {bemap.Coordinate[]}
     * @protected
     */
    this.coords = coordinates ? coordinates : [];

    /**
     * @type {bemap.LineStyle}
     * @protected
     */
    this.style = opts.style ? opts.style : null;


    /**
     * @type {String}
     * @protected
     */
    this.id = opts.id ? opts.id : null;

    /**
     * @type {String}
     * @protected
     */
    this.name = opts.name ? opts.name : null;

    /**
     * @type {Array}
     * @protected
     */
    this.events = [];

    /**
     * @type {Function}
     * @protected
     */
    this.callback = [];

    /**
     * @type {Object}
     * @protected
     */
    this.properties = opts.properties ? opts.properties : null;
};

/**
 * Add a coordinate.
 * @public
 * @param {bemap.Coordinate} coordinate bemap.Coordinate.
 * @return {bemap.Polygon} this
 */
bemap.Polygon.prototype.addCoordinate = function (coordinate) {
    if (coordinate === null || !bemap.inheritsof(coordinate, bemap.Coordinate)) {
        throw new bemap.Exception("coordinate is not an bemap.Coordinate object");
    }
    this.coords.push(coordinate);
    return this;
};

/**
 * Add a coordinate.
 * @public
 * @param {double} lon Longitude in degres deciaml (WGS84).
 * @param {double} lat Latitude in degres deciaml (WGS84).
 * @return {bemap.Polygon} this
 */
bemap.Polygon.prototype.addLonLat = function (lon, lat) {
    this.coords.push(new bemap.Coordinate(lon, lat));
    return this;
};

/**
 * Return an array with longitude and latitude in degres decimal (WGS94).
 * @public
 * @param {int} index Index of coordinate in polygon.
 * @return {array} Return an array with longitude and latitude in degres decimal (WGS94).
 */
bemap.Polygon.prototype.getLonLatArray = function (index) {
    return this.coords[index].getLonLatArray();
};

/**
 * Return an array with latitude and longitude in degres decimal (WGS94).
 * @public
 * @param {int} index Index of coordinate in polygon.
 * @return {array} Return an array with latitude and longitude in degres decimal (WGS94).
 */
bemap.Polygon.prototype.getLatLonArray = function (index) {
    return this.coords[index].getLatLonArray();
};

/**
 * Return an array with longitude and latitude in degres decimal (WGS94).
 * Example: [ [lon, lat], [lon, lat], ... ]
 * @public
 * @return {array} Return an array with longitude and latitude in degres decimal (WGS94).
 */
bemap.Polygon.prototype.getLonLatArrays = function () {
    var i = 0,
        iLen = this.coords.length,
        rets = [],
        c;
    for (; i < iLen; i++) {
        c = this.coords[i];
        rets.push([c.lon, c.lat]);
    }
    return rets;
};

/**
 * Return an array with latitude and longitude in degres decimal (WGS94).
 * Example: [ [lat, lon], [lat, lon], ... ]
 * @public
 * @return {array} Return an array with latitude and longitude in degres decimal (WGS94).
 */
bemap.Polygon.prototype.getLatLonArrays = function () {
    var i = 0,
        iLen = this.coords.length,
        rets = [],
        c;
    for (; i < iLen; i++) {
        c = this.coords[i];
        rets.push([c.lat, c.lon]);
    }
    return rets;
};

/**
 * Return the id of the polygon.
 * @public
 * @return {String} Return the id of the polygon.
 */
bemap.Polygon.prototype.getId = function () {
    return this.id;
};

/**
 * Define the id of polygon
 * @public
 * @param {String} id the new id to set.
 * @return {bemap.Polygon} this
 */
bemap.Polygon.prototype.setId = function (id) {
    this.id = id;
    return this;
};

/**
 * Return the name of the polygon.
 * @public
 * @return {String} Return the name of the polygon.
 */
bemap.Polygon.prototype.getName = function () {
    return this.name;
};

/**
 * Define the name of polygon
 * @public
 * @param {String} name the new name to set.
 * @return {bemap.Polygon} this
 */
bemap.Polygon.prototype.setName = function (name) {
    this.name = name;
    return this;
};

/**
 * Return the coordinate. See bemap.Coordinate.
 * @public
 * @param {int} index Index of coordinate in polygon.
 * @return {bemap.Coordinate} Return the coordinate. See bemap.Coordinate.
 */
bemap.Polygon.prototype.getCoordinate = function (index) {
    return this.coords[index];
};

/**
 * Return an array of coordinate. See bemap.Coordinate.
 * @public
 * @return {bemap.Coordinate[]} Return an array of the coordinate. See bemap.Coordinate.
 */
bemap.Polygon.prototype.getCoordinates = function () {
    if (this.map && this.native) {
        this.map.updatePolygonCoordinates(this);
    }
    return this.coords;
};

/**
 * Return the style of the polygon.
 * @public
 * @return {bemap.LineStyle} Return the style of the polygon.
 */
bemap.Polygon.prototype.getStyle = function () {
    return this.style;
};

/**
 * Remove the Polygon from the layer.
 * @public
 * @return {bemap.Polygon} this
 */
bemap.Polygon.prototype.remove = function () {
    if (this.map !== null && bemap.inheritsof(this.map, bemap.Map)) {
        this.map.removePolygon(this);
    }
    return this;
};

/**
 * Set the listner when an specified eventType occur on bemap.Polygon.
 * @public
 * @param {bemap.Map.EventType} eventType Event type.
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options options.
 * @return {bemap.Polygon} this.
 */
bemap.Polygon.prototype.on = function (eventType, callback, options) {
    if (this.map !== null && bemap.inheritsof(this.map, bemap.Map)) {
        this.map.onPolygon(this, eventType, callback, options);
    }
    return this;
};

/**
 * Define the draggable capability for bemap.Polygon.
 * @protected
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options Options.
 * @param {bemap.Layer} options.layerFilter set the bemap layer used as filter.
 * @return {bemap.Listener} bemap.listener.
 */
bemap.Polygon.prototype.draggable = function (callback, options) {
    if (this.map !== null && bemap.inheritsof(this.map, bemap.Map)) {
        return this.map.draggablePolygon(this, callback, options);
    }
    return new bemap.Listener();
};

/**
 * BeNomad BeMap JavaScript API - PolygonStyle
 */

/**
 * @classdesc
 * Base class for PolygonStyle.
 * @public
 * @constructor
 * @param {Object} options See below the available values.
 * @param {bemap.Color} options.fillColor Set the fill color of the polygon with a bemap.Color.
 * @param {bemap.Color} options.borderColor Set the border color of the polygon with a bemap.Color.
 * @param {int} options.borderWidth Set the border width of the polygon in pixels.
 * @param {bemap.PolygonStyle.TYPE} options.borderType define the border type of the polygon.
 */
bemap.PolygonStyle = function(options) {
    var opts = options || {};

    /**
     * @type {Object}
     * @protected
     */
    this.native = null;

    /**
     * Fill color.
     * @type {Object}
     * @protected
     */
    this.fillColor = opts.fillColor ? opts.fillColor : new bemap.Color();

    /**
     * Border color.
     * @type {Object}
     * @protected
     */
    this.borderColor = opts.borderColor ? opts.borderColor : new bemap.Color();

    /**
     * Border width.
     * @type {int}
     * @protected
     */
    this.borderWidth = opts.borderWidth ? opts.borderWidth : 3;

    /**
     * Border type.
     * @type {String}
     * @protected
     */
    this.borderType = opts.borderType ? opts.borderType : bemap.PolygonStyle.TYPE.PLANE;
};

/**
 * List of available type for the polygon style.
 * @public
 * @enum bemap.PolygonStyle.TYPE
 */
bemap.PolygonStyle.TYPE = {
    DASH: "dash",
    PLANE: "plane",
    DOT: "dot",
    DOT_DASH: "dot dash"
};

/**
 * Return the bemap.Color which set the fill color of the polygon.
 * @return {bemap.Color} Return the Bemap.Color which set the fill color of the polygon.
 */
bemap.PolygonStyle.prototype.getFillColor = function() {
    return this.fillColor;
};

/**
 * Set the bemap.Color which set the fill color of the polygon.
 * @param {bemap.Color} fillColor the new bemap.Color to set the fill color.
 * @return {bemap.PolygonStyle} Return this.
 */
bemap.PolygonStyle.prototype.setFillColor = function(fillColor) {
    this.fillColor = fillColor;
    return this;
};

/**
 * Get the border type of the polygon style.
 * @return {String} the border type of the polygon.
 */
bemap.PolygonStyle.prototype.getBorderType = function() {
    return this.borderType;
};

/**
 * Return the bemap.Color which set the border color of the polygon.
 * @return {bemap.Color} Return the Bemap.Color which set the border color of the polygon.
 */
bemap.PolygonStyle.prototype.getBorderColor = function() {
    return this.borderColor;
};

/**
 * Return the border width of the polygon.
 * @return {int} Return the border width of the polygon.
 */
bemap.PolygonStyle.prototype.getBorderWidth = function() {
    return this.borderWidth;
};

/**
 * Set the bemap.Color which set the border color of the polygon.
 * @param {bemap.Color} Color the new bemap.Color to set the border color.
 * @return {bemap.PolygonStyle} Return this.
 */
bemap.PolygonStyle.prototype.setBorderColor = function(borderColor) {
    this.borderColor = borderColor;
    return this;
};

/**
 * Set the border width of the polygon.
 * @param {double} width the new border width of the polygon to set.
 * @return {bemap.PolygonStyle} Return this.
 */
bemap.PolygonStyle.prototype.setBorderWidth = function(borderWidth) {
    this.borderWidth = borderWidth;
    return this;
};

/**
 * Set the border type of the polygon.
 * @param {String} type the new border type to set.
 * @return {bemap.PolygonStyle} return this.
 */
bemap.PolygonStyle.prototype.setBorderType = function(borderType) {
    this.borderType = borderType;
    return this;
};

/**
 * BeNomad BeMap JavaScript API - Polyline class
 */

/**
 * @classdesc
 * Base class for Polyline.
 * @public
 * @constructor
 * @param {bemap.Coordinate} coordinates Array of bemap.Coordinate.
 * @param {Object} options See below the available values.
 * @param {bemap.LineStyle} options.style Style of poyline used by the renderer.
 * @param {String} options.name Name of polyline.
 * @param {Object} options.properties custom object.
 */
bemap.Polyline = function(coordinates, options) {
    var opts = options || {};

    /**
     * @type {Object}
     * @protected
     */
    this.native = null;

    /**
     * @type {Object}
     * @protected
     */
    this.map = null;

    /**
     * @type {Object}
     * @protected
     */
    this.layer = null;

    /**
     * @type {bemap.Coordinate[]}
     * @protected
     */
    this.coords = coordinates ? coordinates : [];

    /**
     * @type {
     bemap.LineStyle
 }
     * @protected
     */
    this.style = opts.style ? opts.style : null;


    /**
     * @type {String}
     * @protected
     */
    this.id = opts.id ? opts.id : null;

    /**
     * @type {String}
     * @protected
     */
    this.name = opts.name ? opts.name : null;

    /**
     * @type {Array}
     * @protected
     */
    this.events = [];

    /**
     * @type {Function}
     * @protected
     */
    this.callback = [];

    /**
     * @type {Object}
     * @protected
     */
    this.properties = opts.properties ? opts.properties : null;
};

/**
 * Add a coordinate.
 * @public
 * @param {bemap.Coordinate} coordinate bemap.Coordinate.
 * @return {bemap.Polyline} this
 */
bemap.Polyline.prototype.addCoordinate = function(coordinate) {
    if (coordinate === null || !bemap.inheritsof(coordinate, bemap.Coordinate)) {
        throw new bemap.Exception("coordinate is not an bemap.Coordinate object");
    }
    this.coords.push(coordinate);
    return this;
};

/**
 * Add a coordinate.
 * @public
 * @param {double} lon Longitude in degres deciaml (WGS84).
 * @param {double} lat Latitude in degres deciaml (WGS84).
 * @return {bemap.Polyline} this
 */
bemap.Polyline.prototype.addLonLat = function(lon, lat) {
    this.coords.push(new bemap.Coordinate(lon, lat));
    return this;
};

/**
 * Return an array with longitude and latitude in degres decimal (WGS94).
 * @public
 * @param {int} index Index of coordinate in polyline.
 * @return {array} Return an array with longitude and latitude in degres decimal (WGS94).
 */
bemap.Polyline.prototype.getLonLatArray = function(index) {
    return this.coords[index].getLonLatArray();
};

/**
 * Return an array with latitude and longitude in degres decimal (WGS94).
 * @public
 * @param {int} index Index of coordinate in polyline.
 * @return {array} Return an array with latitude and longitude in degres decimal (WGS94).
 */
bemap.Polyline.prototype.getLatLonArray = function(index) {
    return this.coords[index].getLatLonArray();
};

/**
 * Return an array with longitude and latitude in degres decimal (WGS94).
 * Example: [ [lon, lat], [lon, lat], ... ]
 * @public
 * @return {array} Return an array with longitude and latitude in degres decimal (WGS94).
 */
bemap.Polyline.prototype.getLonLatArrays = function() {
    var i = 0,
        iLen = this.coords.length,
        rets = [],
        c;
    for (; i < iLen; i++) {
        c = this.coords[i];
        rets.push([c.lon, c.lat]);
    }
    return rets;
};

/**
 * Return an array with latitude and longitude in degres decimal (WGS94).
 * Example: [ [lat, lon], [lat, lon], ... ]
 * @public
 * @return {array} Return an array with latitude and longitude in degres decimal (WGS94).
 */
bemap.Polyline.prototype.getLatLonArrays = function() {
    var i = 0,
        iLen = this.coords.length,
        rets = [],
        c;
    for (; i < iLen; i++) {
        c = this.coords[i];
        rets.push([c.lat, c.lon]);
    }
    return rets;
};

/**
 * Return the id of the polyline.
 * @public
 * @return {String} Return the id of the polyline.
 */
bemap.Polyline.prototype.getId = function() {
    return this.id;
};

/**
 * Define the id of polyline
 * @public
 * @param {String} id the new id to set.
 * @return {bemap.Polyline} this
 */
bemap.Polyline.prototype.setId = function(id) {
    this.id = id;
    return this;
};

/**
 * Return the name of the polyline.
 * @public
 * @return {String} Return the name of the polyline.
 */
bemap.Polyline.prototype.getName = function() {
    return this.name;
};

/**
 * Define the name of polyline
 * @public
 * @param {String} name the new name to set.
 * @return {bemap.Polyline} this
 */
bemap.Polyline.prototype.setName = function(name) {
    this.name = name;
    return this;
};

/**
 * Return the coordinate. See bemap.Coordinate.
 * @public
 * @param {int} index Index of coordinate in polyline.
 * @return {bemap.Coordinate} Return the coordinate. See bemap.Coordinate.
 */
bemap.Polyline.prototype.getCoordinate = function(index) {
    return this.coords[index];
};

/**
 * Return an array of coordinate. See bemap.Coordinate.
 * @public
 * @return {bemap.Coordinate} Return an array of the coordinate. See bemap.Coordinate.
 */
bemap.Polyline.prototype.getCoordinates = function() {
    return this.coords;
};

/**
 * Return the style of the polyline.
 * @public
 * @return {bemap.LineStyle} Return the style of the polyline.
 */
bemap.Polyline.prototype.getStyle = function() {
    return this.style;
};

/**
 * Remove the Polyline from the layer.
 * @public
 * @return {bemap.Polyline} this
 */
bemap.Polyline.prototype.remove = function() {
    if (this.map !== null && bemap.inheritsof(this.map, bemap.Map)) {
        this.map.removePolyline(this);
    }
    return this;
};

/**
 * Set the listner when an specified eventType occur on bemap.Polyline.
 * @public
 * @param {bemap.Map.EventType} eventType Event type.
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options options.
 * @return {bemap.Polyline} this.
 */
bemap.Polyline.prototype.on = function(eventType, callback, options) {
    if (this.map !== null && bemap.inheritsof(this.map, bemap.Map)) {
        this.map.onPolyline(this, eventType, callback, options);
    }
    return this;
};

/**
 * Define the draggable capability for bemap.Polyline.
 * @protected
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options Options.
 * @param {bemap.Layer} options.layerFilter set the bemap layer used as filter.
 * @return {bemap.Listener} bemap.listener.
 */
bemap.Polyline.prototype.draggable = function(callback, options) {
    if (this.map !== null && bemap.inheritsof(this.map, bemap.Map)) {
        return this.map.draggablePolyline(this, callback, options);
    }
    return new bemap.Listener();
};

/**
 * BeNomad BeMap JavaScript API - Popup
 */

/**
 * @classdesc
 * Base class for popup.
 * @public
 * @constructor
 * @param {Object} options See below the available values.
 * @param {String} options.name Name of popup.
 * @param {Object} options.properties custom object.
 */
bemap.Popup = function(options) {
  var opts = options || {};

  /**
   * @type {Object}
   * @protected
   */
  this.native = null;

  /**
   * @type {Object}
   * @protected
   */
  this.container_ = null;

  /**
   * @type {Object}
   * @protected
   */
  this.closer_ = null;

  /**
   * @type {Object}
   * @protected
   */
  this.content_ = null;

  /**
   * @type {String}
   * @protected
   */
  this.information = opts.information ? opts.information : null;

  /**
   * @type {Boolean}
   * @protected
   */
  this.visible = opts.visible !== undefined ? opts.visible : true;

  /**
   * @type {Object}
   * @protected
   */
  this.map = null;

  /**
   * @type {bemap.Coordinate}
   * @protected
   */
  this.coordinate = opts.coordinate ? opts.coordinate : undefined;

  /**
   * @type {String}
   * @protected
   */
  this.id = opts.id ? opts.id : null;

  /**
   * @type {String}
   * @protected
   */
  this.name = opts.name ? opts.name : null;

  /**
   * @type {Object}
   * @protected
   */
  this.properties = opts.properties ? opts.properties : null;
};

/**
 * Return the content of the popup.
 * @return {String} this.infomation;
 */
bemap.Popup.prototype.getInformation = function() {
  return this.information;
};

/**
 * Return the position of the popup.
 * @return {bemap.Coordinate} this.coordinate;
 */
bemap.Popup.prototype.getCoordinate = function() {
  return this.coordinate;
};

/**
 * Return the id of the popup.
 * @return {String} this.id;
 */
bemap.Popup.prototype.getId = function() {
  return this.id;
};

/**
 * Return the name of the popup.
 * @return {String} this.name;
 */
bemap.Popup.prototype.getName = function() {
  return this.name;
};

/**
 * Return the visibility of the popup.
 * @return {Boolean} visible the visibility of the popup (true is visible and false is hidden).
 */
bemap.Popup.prototype.isVisible = function() {
  return this.visible;
};

/**
 * Set the visibility of the popup.
 * @param {boolean} Set to true to show the popup, otherwise false to hide it.
 * @return {bemap.Popup} this.
 */
bemap.Popup.prototype.setVisible = function(visible) {
  this.map.setVisiblePopup(this, visible);
  return this;
};

/**
 * Hide the popup.
 * @return {bemap.Popup} this.
 */
bemap.Popup.prototype.hide = function() {
  this.map.setVisiblePopup(this, false);
  return this;
};

/**
 * Show the popup.
 * @return {bemap.Popup} this.
 */
bemap.Popup.prototype.show = function() {
  this.map.setVisiblePopup(this, true);
  return this;
};

/**
 * Change the current content of the popup to a new one.
 * @param {String} information the new content to set.
 * @return {bemap.Popup} this;
 */
bemap.Popup.prototype.setInformation = function(information) {
  this.information = information;
  if (this.content_) {
    this.content_.innerHTML = information;
  }
  return this;
};

/**
 * Return the id of the popup.
 * @param {String} id the new id to set.
 * @return {bemap.Popup} this;
 */
bemap.Popup.prototype.setId = function(id) {
  this.id = id;
  return this;
};

/**
 * Return the name of the popup.
 * @param {String} name the new name to set.
 * @return {bemap.Popup} this;
 */
bemap.Popup.prototype.setName = function(name) {
  this.name = name;
  return this;
};

/**
 * Set the position of the popup.
 * @param {bemap.Coordinate} coordinate the new coordinate to set.
 * @param {object} options Options.
 * @param {bemap.Layer} options.panningMap enable the map panning animation. move map from the current position to the popup anchor at the center of map.
 * @return {bemap.Popup} this;
 */
bemap.Popup.prototype.setCoordinate = function(coordinate, options) {
  this.map.setCoordinatePopup(this, coordinate, options);
  return this;
};

/**
 * Add the new content at the end of the current one.
 * @param {String} information the new content to add.
 * @return {bemap.Popup} this;
 */
bemap.Popup.prototype.addInformation = function(information) {
  this.information += information;
  if (this.content_) {
    this.content_.innerHTML = this.information;
  }
  return this;
};

/**
 * Remove the popup from his map.
 * @return {bemap.Popup} this;
 */
bemap.Popup.prototype.remove = function() {
  if (this.map && this.native) {
    this.map.removePopup(this);
  }
  return this;
};

/**
 * BeNomad BeMap JavaScript API - PostalAddress
 */

/**
 * @classdesc
 * Base class for postal address.
 * @public
 * @constructor
 * @abstract
 * @param {object} options see below the available values.
 * @param {String} options.countryCode
 * @param {String} options.country
 * @param {String} options.state
 * @param {String} options.county
 * @param {String} options.city
 * @param {String} options.district
 * @param {String} options.postalCode
 * @param {String} options.roadNumber
 * @param {String} options.street
 * @param {String} options.streetNumber
 */
bemap.PostalAddress = function(options) {
    var opts = options || {};

    /**
     * @type {String}
     * @protected
     */
    this.countryCode = opts.countryCode ? opts.countryCode : null;

    /**
     * @type {String}
     * @protected
     */
    this.country = opts.country ? opts.country : null;

    /**
     * @type {String}
     * @protected
     */
    this.state = opts.state ? opts.state : null;

    /**
     * @type {String}
     * @protected
     */
    this.county = opts.county ? opts.county : null;

    /**
     * @type {String}
     * @protected
     */
    this.city = opts.city ? opts.city : null;

    /**
     * @type {String}
     * @protected
     */
    this.district = opts.district ? opts.district : null;

    /**
     * @type {String}
     * @protected
     */
    this.postalCode = opts.postalCode ? opts.postalCode : null;

    /**
     * @type {String}
     * @protected
     */
    this.roadNumber = opts.roadNumber ? opts.roadNumber : null;

    /**
     * @type {String}
     * @protected
     */
    this.street = opts.street ? opts.street : null;

    /**
     * @type {String}
     * @protected
     */
    this.streetNumber = opts.streetNumber ? opts.streetNumber : null;
};

/**
 * Get country code.
 * @return {String} countryCode.
 */
bemap.PostalAddress.prototype.getCountryCode = function() {
    return this.countryCode;
};

/**
 * Get Country.
 * @return {String} country.
 */
bemap.PostalAddress.prototype.getCountry = function() {
    return this.country;
};

/**
 * Get State.
 * @return {String} state.
 */
bemap.PostalAddress.prototype.getState = function() {
    return this.state;
};

/**
 * Get county.
 * @return {String} county.
 */
bemap.PostalAddress.prototype.getCounty = function() {
    return this.county;
};

/**
 * Get city.
 * @return {String} city.
 */
bemap.PostalAddress.prototype.getCity = function() {
    return this.city;
};

/**
 * Get district.
 * @return {String} district.
 */
bemap.PostalAddress.prototype.getDistrict = function() {
    return this.district;
};

/**
 * Get postal code.
 * @return {String} postalCode.
 */
bemap.PostalAddress.prototype.getPostalCode = function() {
    return this.postalCode;
};

/**
 * Get road number
 * @return {String} roadNumber
 */
bemap.PostalAddress.prototype.getRoadNumber = function() {
    return this.roadNumber;
};

/**
 * Get street.
 * @return {String} street.
 */
bemap.PostalAddress.prototype.getStreet = function() {
    return this.street;
};

/**
 * Get street number
 * @return {String} streetNumber
 */
bemap.PostalAddress.prototype.getStreetNumber = function() {
    return this.streetNumber;
};

/**
 * BeNomad BeMap JavaScript API - RasterLayer class
 * Generic raster tile layer for satellite imagery, custom tile servers, etc.
 */

/**
 * @classdesc
 * Layer for raster tile sources (satellite, custom tiles).
 * @public
 * @constructor
 * @extends {bemap.Layer}
 * @param {Object} options
 * @param {String} options.url Raster tile URL template with {z}/{x}/{y}.
 * @param {Number} options.tileSize Tile size in pixels (default: 256).
 * @param {Number} options.opacity Layer opacity 0-1 (default: 1).
 * @param {String} options.attribution Attribution text.
 */
bemap.RasterLayer = function(options) {
  var opts = options || {};

  this.url = opts.url ? opts.url : null;
  this.tileSize = opts.tileSize ? opts.tileSize : 256;
  this.opacity = opts.opacity !== undefined ? opts.opacity : 1;
  this.attribution = opts.attribution ? opts.attribution : '';

  bemap.Layer.call(this, options);
};
bemap.inherits(bemap.RasterLayer, bemap.Layer);

/**
 * BeNomad BeMap JavaScript API - RevGeoSearchInfo
 */

/**
 * @classdesc
 * Base class for reverse geocoding search information.
 * @public
 * @constructor
 * @abstract
 * @param {object} options see below the available values.
 * @param {String} options.xy Mandatory
 * @param {String} options.radius Mandatory
 * @param {String} options.angle Accessor to the GPS angle measure (in degrees). Default is -1.
 * @param {String} options.speed Accessor to the GPS speed measure (in km/h).
 * @param {String} options.transportType Transportation mode. Available values: PEDESTRIAN BICYCLE MOTORCYCLE CAR TAXI PUBLIC_BUS EMERGENCY DELIVERY_TRUCK TRUCK
 * @param {String} options.language Define the language that will be used to perform the address lookup.
 * @param {Int} options.maxResult The maximum number of items used to perform the research and returned items by the server. Default is 1.
 * @param {String} options.options
 */
bemap.RevGeoSearchInfo = function(options) {
    var opts = options || {};

    /**
     * @type {String}
     * @protected
     */
    this.xy = opts.xy ? opts.xy : null;

    /**
     * @type {String}
     * @protected
     */
    this.angle = opts.angle ? opts.angle : null;

    /**
     * @type {String}
     * @protected
     */
    this.radius = opts.radius ? opts.radius : null;

    /**
     * @type {String}
     * @protected
     */
    this.speed = opts.speed ? opts.speed : null;

    /**
     * @type {String}
     * @protected
     */
    this.transportType = opts.transportType ? opts.transportType : null;

    /**
     * @type {String}
     * @protected
     */
    this.language = opts.language ? opts.language : null;

    /**
     * @type {int}
     * @protected
     */
    this.maxResult = opts.maxResult ? opts.maxResult : null;

    /**
     * @type {String}
     * @protected
     */
    this.options = opts.options ? opts.options : null;
};

/**
 * Get XY informations.
 * @return {String} xy.
 */
bemap.RevGeoSearchInfo.prototype.getXy = function() {
    return this.xy;
};

/**
 * Get the angle information.
 * @return {String} angle.
 */
bemap.RevGeoSearchInfo.prototype.getAngle = function() {
    return this.angle;
};

/**
 * Get the radius information.
 * @return {String}
 */
bemap.RevGeoSearchInfo.prototype.getRadius = function() {
    return this.radius;
};

/**
 * Get the speed information.
 * @return {String} speed.
 */
bemap.RevGeoSearchInfo.prototype.getSpeed = function() {
    return this.speed;
};

/**
 * Get then transport type information.
 * @return {String} transportType.
 */
bemap.RevGeoSearchInfo.prototype.getTransporType = function() {
    return this.transportType;
};

/**
 * Get the language information.
 * @return {String} language.
 */
bemap.RevGeoSearchInfo.prototype.getLanguage = function() {
    return this.language;
};

/**
 * Get the number maximum of result.
 * @return {Int} maxResult.
 */
bemap.RevGeoSearchInfo.prototype.getMaxResult = function() {
    return this.maxResult;
};

/**
 * Get the options of the research.
 * @return {String} options.
 */
bemap.RevGeoSearchInfo.prototype.getOptions = function() {
    return this.options;
};

/**
 * Set XY informations.
 * @param {String} xy the new xy information to set.
 * @return {bemap.RevGeoSearchInfo} this.
 */
bemap.RevGeoSearchInfo.prototype.setXy = function(xy) {
    this.xy = xy;
    return this;
};

/**
 * Set the angle information.
 * @param {String} angle the new angle to set.
 * @return {bemap.RevGeoSearchInfo} this.
 */
bemap.RevGeoSearchInfo.prototype.setAngle = function(angle) {
    this.angle = angle;
    return this;
};

/**
 * Set the radius information.
 * @param {String} radius the new radius to set.
 * @return {bemap.RevGeoSearchInfo} this.
 */
bemap.RevGeoSearchInfo.prototype.setRadius = function(radius) {
    this.radius = radius;
    return this;
};

/**
 * Set the speed information.
 * @param {String} speed the new speed to set.
 * @return {bemap.RevGeoSearchInfo} this.
 */
bemap.RevGeoSearchInfo.prototype.setSpeed = function(speed) {
    this.speed = speed;
    return this;
};

/**
 * Set then transport type information.
 * @param {String} transportType the new transport type to set.
 * @return {bemap.RevGeoSearchInfo} this.
 */
bemap.RevGeoSearchInfo.prototype.setTransporType = function(transportType) {
    this.transportType = transportType;
    return this;
};

/**
 * Set the language information.
 * @param {String} language the new language to set.
 * @return {bemap.RevGeoSearchInfo} this.
 */
bemap.RevGeoSearchInfo.prototype.setLanguage = function(language) {
    this.language = language;
    return this;
};

/**
 * Set the number maximum of result.
 * @param {Int} maxResult the new number max of results to set.
 * @return {bemap.RevGeoSearchInfo} this.
 */
bemap.RevGeoSearchInfo.prototype.setMaxResult = function(maxResult) {
    this.maxResult = maxResult;
    return this;
};

/**
 * Set the research options.
 * @param {String} options the new number max of results to set.
 * @return {bemap.RevGeoSearchInfo} this.
 */
bemap.RevGeoSearchInfo.prototype.setOptions = function(options) {
    this.options = options;
    return this;
};

/**
 * BeNomad BeMap JavaScript API - RoadFeature
 */

/**
 * @classdesc
 * Base class for road features.
 * @public
 * @constructor
 * @abstract
 * @param {object} options see below the available values.
 * @param {String} options.DirectionFlaw The direction of traffic flow per transportation modes. For each mode, possible values are: - CLOSE: closed in both directions.
     - OPEN_POS: open in positive direction.
     - OPEN_NEG: open in negative direction.
     - OPEN: open in both directions.
 * @param {Boolean} options.Urban Urban / not urban flag.
 * @param {Boolean} options.Tunnel A flag that indicates if road is part of a tunnel or not.
 * @param {Boolean} options.Bridge A flag that indicates if road is part of a bridge or not.
 * @param {Boolean} options.MaxSpeedVerified Max speed verified flag(true: verified, false: calculated).
 * @param {Boolean} options.CarPool : A flag that indicates if road is reserved to carpooling.
 * @param {Boolean} options.MainCategory A flag that enables discrimination within road 's of a same FCC type (depends of map provider).
 * @param {Int} options.DualCarriageway A flag that indicates if road is part of a dual carriageway(e.g.with physical separation between opposite traffic sides) .0: no or unknown, 1: yes.
 * @param {Int} options.NoThroughTr No through traffic restriction(0: no restriction, 1: restriction, 2: restriction for trucks only).
 * @param {Int} options.Toll Toll information: 0 no toll, 1 toll in positive direction, 2 toll in negative direction, 3 toll in both directions.
 * @param {Int} options.Tax This fields indicates if road is submitted to a government tax(like German MAUT, etc) .0 means no tax, 1 - 3 defines the tax category(country dependent).
 * @param {String} options.MatchDir The matching direction: - CLOSE: Undefined matched direction and closed in both directions.
     - OPEN_POS: Matched in positive direction.
     - OPEN_NEG: Matched in negative direction.
     - OPEN: Undefined matched direction and open in both directions.
 * @param {Int} options.NbLanePos The number of lanes in positive direction(0 if traffic closed in positive direction or if lane information is not available).
 * @param {Int} options.NbLaneNeg The number of lanes in negative direction(0 if traffic closed in negative direction or if lane information is not available).
 * @param {String} options.PedestrianInfrastructureType The pedestrian infrastructure type: -UNDEFINED = 0 Undefined.
     - ZONE = 1: Pedestrian Zone.
     - HIKING = 2 - Hiking.
     - UNPAVED_ROAD = 3 - Unpaved Road.
     - ROUGH_ROAD = 4 - Rough Road.
     - POOR_CONDITION_ROAD = 5 - Poor Condition Road.
     - STAIRS = 6 - Stairs.
     - TUNNEL = 7 - Tunnel.
     - ELEVATOR = 8 - Elevator.
     - ESCALATOR = 9 - Escalator.
     - FOOTBRIDGE = 10 - Footbridge.
* @param {Int} options.MaxSpeed The speed limit in kph(0 if not available).
* @param {Array.<bemap.CondMaxSpeed>} options.CondMaxSpeed A conditional speed limit.
* @param {Int} options.AverageSpeed The average speed in kph.
* @param {Int} options.Lenght The length in meters.
 */
bemap.RoadFeature = function(options) {
    var opts = options || {};

    /**
     * @type {String}
     * @protected
     */
    this.DirectionFlow = opts.DirectionFlow ? opts.DirectionFlow : null;

    /**
     * @type {Boolean}
     * @protected
     */
    this.Urban = opts.Urban !== undefined ? opts.Urban : null;

    /**
     * @type {Boolean}
     * @protected
     */
    this.Tunnel = opts.Tunnel !== undefined ? opts.Tunnel : null;

    /**
     * @type {Boolean}
     * @protected
     */
    this.Bridge = opts.Bridge !== undefined ? opts.Bridge : null;

    /**
     * @type {Boolean}
     * @protected
     */
    this.MaxSpeedVerified = opts.MaxSpeedVerified !== undefined ? opts.MaxSpeedVerified : null;

    /**
     * @type {Boolean}
     * @protected
     */
    this.CarPool = opts.CarPool !== undefined ? opts.CarPool : null;

    /**
     * @type {Boolean}
     * @protected
     */
    this.MainCategory = opts.MainCategory !== undefined ? opts.MainCategory : null;

    /**
     * @type {Int}
     * @protected
     */
    this.DualCarriageway = opts.hasOwnProperty("DualCarriageway") ? opts.DualCarriageway : null;

    /**
     * @type {Int}
     * @protected
     */
    this.NoThroughTr = opts.hasOwnProperty("NoThroughTr") ? opts.NoThroughTr : null;

    /**
     * @type {Int}
     * @protected
     */
    this.Toll = opts.hasOwnProperty("Toll") ? opts.Toll : null;

    /**
     * @type {Int}
     * @protected
     */
    this.Tax = opts.hasOwnProperty("Tax") ? opts.Tax : null;

    /**
     * @type {String}
     * @protected
     */
    this.MatchDir = opts.MatchDir ? opts.MatchDir : null;

    /**
     * @type {Int}
     * @protected
     */
    this.NbLanePos = opts.hasOwnProperty("NbLanePos") ? opts.NbLanePos : null;

    /**
     * @type {Int}
     * @protected
     */
    this.NbLaneNeg = opts.hasOwnProperty("NbLaneNeg") ? opts.NbLaneNeg : null;

    /**
     * @type {String}
     * @protected
     */
    this.PedestrianInfrastructureType = opts.PedestrianInfrastructureType ? opts.PedestrianInfrastructureType : null;

    /**
     * @type {Int}
     * @protected
     */
    this.MaxSpeed = opts.hasOwnProperty("MaxSpeed") ? opts.MaxSpeed : null;

    /**
     * @type {Int}
     * @protected
     */
    this.AverageSpeed = opts.hasOwnProperty("AverageSpeed") ? opts.AverageSpeed : null;

    /**
     * @type {Array.<bemap.CondMaxSpeed>}
     * @protected
     */
    this.CondMaxSpeed = opts.CondMaxSpeed ? opts.CondMaxSpeed : [];

    /**
     * @type {Int}
     * @protected
     */
    this.Length = opts.hasOwnProperty("Length") ? opts.Length : null;
};


/**
* Get the direction of traffic flow per transportation modes.
* @return {String}
*/
bemap.RoadFeature.prototype.getDirectionFlow = function() {
  return this.DirectionFlow;
};

/**
* Get the urban / not urban flag.
* @return {Boolean}
*/
bemap.RoadFeature.prototype.getUrban = function() {
  return this.Urban;
};

/**
* Get the flag that indicates if road is part of a tunnel or not.
* @return {Boolean}
*/
bemap.RoadFeature.prototype.getTunnel = function() {
  return this.Tunnel;
};

/**
* Get the flag that indicates if road is part of a bridge or not.
* @return {Boolean}
*/
bemap.RoadFeature.prototype.getBridge = function() {
  return this.Bridge;
};

/**
* Get max speed verified flag.
* @return {Boolean}
*/
bemap.RoadFeature.prototype.getMaxSpeedVerified = function() {
  return this.MaxSpeedVerified;
};

/**
* Get  the flag that indicates if road is reserved to carpooling.
* @return {Boolean}
*/
bemap.RoadFeature.prototype.getCarPool = function() {
  return this.CarPool;
};

/**
* Get the flag that enables discrimination within road 's of a same FCC type.
* @return {Boolean}
*/
bemap.RoadFeature.prototype.getMainCategory = function() {
  return this.MainCategory;
};

/**
* Get the flag that indicates if road is part of a dual carriageway(e.g.with physical separation between opposite traffic sides).
* @return {Int}
*/
bemap.RoadFeature.prototype.getDualCarriageway = function() {
  return this.DualCarriageway;
};

/**
* Get
* @return {Int}
*/
bemap.RoadFeature.prototype.getNoThroughTr = function() {
  return this.NoThroughTr;
};

/**
* Get toll information.
* @return {Int}
*/
bemap.RoadFeature.prototype.getToll = function() {
  return this.Toll;
};

/**
* Get the fields that indicates if road is submitted to a government tax(like German MAUT, etc).
* @return {Int}
*/
bemap.RoadFeature.prototype.getTax = function() {
  return this.Tax;
};

/**
* Get the matching direction.
* @return {String}
*/
bemap.RoadFeature.prototype.getMatchDir = function() {
  return this.MatchDir;
};

/**
* Get The number of lanes in positive direction.
* @return {Int}
*/
bemap.RoadFeature.prototype.getNbLanePos = function() {
  return this.NbLanePos;
};

/**
* Get The number of lanes in negative direction.
* @return {Int}
*/
bemap.RoadFeature.prototype.getNbLaneNeg = function() {
  return this.NbLaneNeg;
};

/**
* Get the pedestrian infrastructure type
* @return {String}
*/
bemap.RoadFeature.prototype.getPedestrianInfrastructureType = function() {
  return this.PedestrianInfrastructureType;
};

/**
* Get the speed limit in kph
* @return {Int}
*/
bemap.RoadFeature.prototype.getMaxSpeed = function() {
  return this.MaxSpeed;
};

/**
* Get the average speed in kph.
* @return {}
*/
bemap.RoadFeature.prototype.getAverageSpeed = function() {
  return this.AverageSpeed;
};

/**
* Get the conditional max speed.
* @return {Array.<bemap.CondMaxSpeed>}
*/
bemap.RoadFeature.prototype.getCondMaxSpeed = function() {
  return this.CondMaxSpeed;
};

/**
* Get the length in meters.
* @return {Int}
*/
bemap.RoadFeature.prototype.getLength = function() {
  return this.Length;
};

/**
 * BeNomad BeMap JavaScript API - Route class
 */

/**
 * @classdesc
 * Base class of route returned by the routing or isochrone calculation.
 * @public
 * @constructor
 */
bemap.Route = function() {

  /**
   * BeMap JS API map object represent the route geometry.
   * @type {bemap.mapobject}
   * @protected
   */
  this.geometryMapObject = undefined;

  /**
   * Geographical extent.
   * @type {bemap.BoundingBox}
   * @protected
   */
  this.extent = undefined;

  /**
   * List of route event.
   * @type {bemap.Route}
   * @protected
   */
  this.events = [];

  /**
   * Geometry of route (used by the isochrone calculation).
   * @type {bemap.Polyline}
   * @protected
   */
  this.poyline = undefined;

  /**
   * liste of charging station step(s).
   * @type {bemap.ChargingStationStep}
   * @protected
   */
  this.chargingStationSteps = [];

};

/**
 * @classdesc
 * Base class of route event returned by the routing calculation.
 * @public
 * @constructor
 */
bemap.Route.Event = function() {

  /**
   * Geometry object like bemap polyline or polygon.
   * @type {bemap.Polyline}
   * @type {bemap.Polygon}
   * @protected
   */
  this.geomatryMapObject = undefined;

  /**
   * Geometry of route event.
   * @type {bemap.Polyline}
   * @protected
   */
  this.poyline = undefined;

  /**
   * Route-sheet instruction of route.
   * @type {bemap.Route.RoutesheetInstruction}
   * @protected
   */
  this.routesheetInstruction = undefined;

};

/**
 * @classdesc
 * Base class of route-sheet instruction returned by the routing calculation.
 * @public
 * @constructor
 */
bemap.Route.RoutesheetInstruction = function() {

  this.type = undefined;
  this.geoElementType = undefined;
  this.coordinate = undefined;
  this.duration = undefined;
  this.second = undefined;
  this.fromName = undefined;
  this.length = undefined;
  this.manoeuvre = undefined;
  this.roundAboutExitNumber = undefined;
  this.toName = undefined;
  this.toOn = undefined;
  this.toRn = undefined;
  this.toSi = undefined;
  this.fromPhoneme = undefined;
  this.toOnPhoneme = undefined;
  this.toPhoneme = undefined;
  this.toRnPhoneme = undefined;
  this.toSiPhoneme = undefined;

};

/**
 l BeNomad BeMap JavaScript API - TextStyle
 */

/**
 * @classdesc
 * Base class for TextStyle.
 * @public
 * @constructor
 * @param {Object} options See below the available values.
 * @param {bemap.Color} options.color Set the volor of text.
 * @param {int} options.size Set the size of text.
 * @param {int} options.offsetX Set the offset X of text.
 * @param {int} options.offsetY Set the offset Y of text.
 * @param {bemap.Color} options.borderColor Set the color of text border.
 * @param {int} options.borderWidth Set the Width of text border in pixels.
 * @param {Boolean} options.type define the type of the line.
 */
bemap.TextStyle = function(options) {
    var opts = options || {};

    /**
     * @type {Object}
     * @protected
     */
    this.native = null;

    /**
     * Color of text.
     * @type {bemap.Color}
     * @protected
     */
    this.color = opts.color ? opts.color : new bemap.Color(0, 0, 0);

    /**
     * Width of text border.
     * @type {int}
     * @protected
     */
    this.size = opts.size ? opts.size : 1;

    /**
     * offset X of text in pixels.
     * @type {int}
     * @protected
     */
    this.offsetX = opts.offsetX ? opts.offsetX : 0;

    /**
     * offset Y of text in pixels.
     * @type {int}
     * @protected
     */
    this.offsetY = opts.offsetY ? opts.offsetY : 0;

    /**
     * Color of text border.
     * @type {bemap.Color}
     * @protected
     */
    this.borderColor = opts.borderColor ? opts.borderColor : new bemap.Color(255, 255, 255);

    /**
     * Width of text border.
     * @type {int}
     * @protected
     */
    this.borderWidth = opts.borderWidth ? opts.borderWidth : 2;
};

/**
 * Return the color of text.
 * @return {bemap.Color} Return the color of text.
 */
bemap.TextStyle.prototype.getColor = function() {
    return this.color;
};

/**
 * Set the color of text.
 * @param {bemap.Color} color the new color of text to set.
 * @return {bemap.TextStyle} Return this.
 */
bemap.TextStyle.prototype.setColor = function(color) {
    if (color && bemap.inheritsof(color, bemap.Color)) {
        this.color = color;
    }
    return this;
};

/**
 * Return the size of text.
 * @return {int} Return the size of text.
 */
bemap.TextStyle.prototype.getSize = function() {
    return this.size;
};

/**
 * Set the size of text.
 * @param {int} color the new size of text to set.
 * @return {bemap.TextStyle} Return this.
 */
bemap.TextStyle.prototype.setSize = function(size) {
    this.size = size;
    return this;
};

/**
 * Return the offset X of text.
 * @return {int} Return the offset X of text.
 */
bemap.TextStyle.prototype.getOffsetX = function() {
    return this.offsetX;
};

/**
 * Set the offset X of text.
 * @param {int} offsetX the new offset X of text to set.
 * @return {bemap.TextStyle} Return this.
 */
bemap.TextStyle.prototype.setOffsetX = function(offsetX) {
    this.offsetX = offsetX;
    return this;
};

/**
 * Return the offset Y of text.
 * @return {int} Return the offset Y of text.
 */
bemap.TextStyle.prototype.getOffsetY = function() {
    return this.offsetY;
};

/**
 * Set the offset Y of text.
 * @param {int} offsetY the new offset Y of text to set.
 * @return {bemap.TextStyle} Return this.
 */
bemap.TextStyle.prototype.setOffsetY = function(offsetY) {
    this.offsetY = offsetY;
    return this;
};

/**
 * Return the color of text border.
 * @return {bemap.Color} Return the color of text border.
 */
bemap.TextStyle.prototype.getBorderColor = function() {
    return this.borderColor;
};

/**
 * Set the color of text border.
 * @param {bemap.Color} borderColor the new color of text border to set.
 * @return {bemap.TextStyle} Return this.
 */
bemap.TextStyle.prototype.setBorderColor = function(borderColor) {
    if (borderColor && bemap.inheritsof(borderColor, bemap.Color)) {
        this.borderColor = borderColor;
    }
    return this;
};

/**
 * Return the width of text border in pixels.
 * @return {int} Return the width of text border in pixels.
 */
bemap.TextStyle.prototype.getBorderWidth = function() {
    return this.borderWidth;
};

/**
 * Set the width of text border in pixels.
 * @param {int} borderWidth the new width of text border to set (in pixels).
 * @return {bemap.TextStyle} Return this.
 */
bemap.TextStyle.prototype.setBorderWidth = function(borderWidth) {
    this.borderWidth = borderWidth;
    return this;
};

/**
 * BeNomad BeMap JavaScript API - VectorTileLayer class
 */

/**
 * @classdesc
 * Layer for vector tile sources. MapLibre only.
 * @public
 * @constructor
 * @extends {bemap.Layer}
 * @param {Object} options See below.
 * @param {String} options.url Vector tile URL template or TileJSON URL.
 * @param {String} options.sourceLayer Source layer name for filtering.
 */
bemap.VectorTileLayer = function(options) {
  var opts = options || {};

  /**
   * @type {String}
   * @protected
   */
  this.url = opts.url ? opts.url : null;

  /**
   * @type {String}
   * @protected
   */
  this.sourceLayer = opts.sourceLayer ? opts.sourceLayer : null;

  bemap.Layer.call(this, options);
};
bemap.inherits(bemap.VectorTileLayer, bemap.Layer);

/**
 * Add a bemap.Circle to the layer
 * @public
 * @param {bemap.Circle} bemap.Circle.
 * @param {object} options
 * @return {bemap.OlMap}
 */
bemap.OlMap.prototype.addCircle = function(circle, options) {
  if (circle && bemap.inheritsof(circle, bemap.Circle)) {
    circle.native = new ol.Feature({
      geometry: ol.geom.Polygon.circular(circle.getCoordinate().getLonLatArray(), circle.getRadius(), 128),
    });

    if (circle.map === null) {
      circle.map = this;
    }

    if (circle.id) {
      circle.native.setId(circle.id);
    }

    bemap.OlMap.prototype._addOwnToProperties(circle);

    circle.native.getGeometry().transform(bemap.Map.PROJ.EPSG_WGS84, this.native.getView().getProjection());

    if (circle.style) {
      if (circle.style.native === null) {
        this.buildCircleStyle(circle.style);
      }
      circle.native.setStyle(circle.style.native);
    }

    var opts = options || {};
    var l = null;

    if (opts.layer && bemap.inheritsof(opts.layer, bemap.VectorLayer)) {
      l = opts.layer;
    } else {
      l = this.getLayerByName(bemap.Map.DEFAULT_LAYER.CIRCLE);
      if (l === null) {
        l = new bemap.VectorLayer({
          name: bemap.Map.DEFAULT_LAYER.CIRCLE
        });
        this.addLayer(l);
      }
    }

    if (circle.layer === null) {
      circle.layer = l;
    }

    l.native.getSource().addFeature(circle.native);
  }
  return this;
};

/**
 * Set the coordinates of the circle.
 * @protected
 * @param {bemap.Circle} circle the circle object to remove.
 * @return {bemap.OlMap} this
 */
bemap.OlMap.prototype.setCoordinateCircle = function(circle) {
  var c = circle.getCenter();
  circle.native.getGeometry().setCoordinates(this._fromLonLat(c.getLon(), c.getLat()));
  return this;
};

/**
 * Set the radius of the circle.
 * @protected
 * @param {bemap.Circle} circle the circle object to remove.
 * @return {bemap.OlMap} this
 */
bemap.OlMap.prototype.setRadiusCircle = function(circle) {
  var c = circle.getCenter();
  circle.native.getGeometry().setCoordinates(this._fromLonLat(c.getLon(), c.getLat()));
  return this;
};

/**
 * Remove a circle from his layer.
 * @public
 * @param {bemap.Circle} circle the circle object to remove.
 */
bemap.OlMap.prototype.removeCircle = function(circle) {
  if (circle && circle.layer && circle.layer.native && bemap.inheritsof(circle, bemap.Circle)) {
    circle.layer.native.getSource().removeFeature(circle.native);
    circle.layer = null;
    circle.map = null;
  }
  return this;
};

/**
 * Set the listner when an specified eventType occur on bemap.Circle.
 * @public
 * @param {bemap.Circle} circle
 * @param {bemap.Map.EventType} eventType Event type.
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options options.
 * @return {bemap.Listener} this.
 */
bemap.OlMap.prototype.onCircle = function(circle, eventType, callback, options) {
  return this._onFeature(circle, eventType, callback, options, {
    singleFeature: true
  });
};

/**
 * Define the draggable capability for bemap.Circle.
 * @protected
 * @param {bemap.Circle} circle bemap object.
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options Options.
 * @param {bemap.Layer} options.layerFilter set the bemap layer used as filter.
 * @return {bemap.Listener} bemap.listener.
 */
bemap.OlMap.prototype.draggableCircle = function(circle, callback, options) {
  return this._draggableFeature(circle, callback, options, {
    singleFeature: true
  });
};

/**
 * Define the draggable capability for all bemap.Circle.
 * @protected
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options Options.
 * @param {bemap.Layer} options.layerFilter set the bemap layer used as filter.
 * @return {bemap.Listener} bemap.listener.
 */
bemap.OlMap.prototype.draggableCircles = function(callback, options) {
  return this._draggableFeature(null, callback, options, {
    circles: true
  });
};

/**
 * Update the coordinate from the native map browser.
 * @public
 */
bemap.OlMap.prototype.updateCircleCenter = function(circle) {
  var cir = circle.native.getGeometry().getExtent();
  var oo = ol.extent.getCenter(cir);
  var circ = ol.proj.transform(oo, this.native.getView().getProjection(), bemap.Map.PROJ.EPSG_WGS84);

  var coord = circle.coordinate;

  if (coord && coord !== null && bemap.inheritsof(coord, bemap.Coordinate)) {
    coord.setLon(circ[0]);
    coord.setLat(circ[1]);
  } else {
    circle.coordinate = new bemap.Coordinate(circ[0], circ[1]);
  }

  if (circle.coordinate.length > cir.length) {
    for (var j = cir.length; j < circle.coordinate.length; j++) {
      circle.coordinate.pop();
    }
  }
};

/**
 * BeNomad BeMap JavaScript API - OpenLayers v10 - Draw Interaction
 */

bemap.OlMap.prototype.drawPolygon = function(options, callback) {
  return this._startDraw('Polygon', options, callback);
};

bemap.OlMap.prototype.drawPolyline = function(options, callback) {
  return this._startDraw('LineString', options, callback);
};

bemap.OlMap.prototype.drawCircle = function(options, callback) {
  return this._startDraw('Circle', options, callback);
};

bemap.OlMap.prototype.drawRectangle = function(options, callback) {
  return this._startDraw('Circle', options, callback, true); // geometryFunction makes it a box
};

bemap.OlMap.prototype.drawMarker = function(options, callback) {
  return this._startDraw('Point', options, callback);
};

bemap.OlMap.prototype._startDraw = function(type, options, callback, isBox) {
  if (typeof ol === 'undefined' || !ol.interaction || !ol.interaction.Draw) {
    console.warn('ol.interaction.Draw not available');
    return new bemap.Listener();
  }
  var opts = options || {};
  var _this = this;

  // Cancel any existing draw
  this.cancelDraw();

  // Create a temporary vector source for drawing
  var drawSource = new ol.source.Vector({ features: [] });
  var drawLayer = new ol.layer.Vector({ source: drawSource });
  this.native.addLayer(drawLayer);

  // Build draw interaction options
  var drawOpts = { type: type, source: drawSource };

  if (isBox) {
    drawOpts.type = 'Circle';
    if (ol.interaction.Draw.createBox) drawOpts.geometryFunction = ol.interaction.Draw.createBox();
  }

  var interaction = new ol.interaction.Draw(drawOpts);

  interaction.on('drawend', function(evt) {
    var feature = evt.feature;
    var geom = feature.getGeometry();

    // Transform back to WGS84
    var cloned = geom.clone().transform(_this.native.getView().getProjection(), bemap.Map.PROJ.EPSG_WGS84);

    var defaultPolyStyle = opts.style || new bemap.PolygonStyle({
      fillColor: new bemap.Color(0, 102, 204, 0.2),
      borderColor: new bemap.Color(0, 102, 204, 1),
      borderWidth: 2
    });
    var bemapObj = null;

    if (type === 'Polygon' || isBox) {
      var ringCoords = cloned.getCoordinates()[0];
      var bemapCoords = [];
      for (var i = 0; i < ringCoords.length - 1; i++) { // skip closing coord
        bemapCoords.push(new bemap.Coordinate(ringCoords[i][0], ringCoords[i][1]));
      }
      bemapObj = new bemap.Polygon(bemapCoords, { style: defaultPolyStyle });

    } else if (type === 'LineString') {
      var lineCoords = cloned.getCoordinates();
      var bemapLineCoords = [];
      for (var j = 0; j < lineCoords.length; j++) {
        bemapLineCoords.push(new bemap.Coordinate(lineCoords[j][0], lineCoords[j][1]));
      }
      var defaultLineStyle = opts.style || new bemap.LineStyle({ color: new bemap.Color(230, 57, 70, 1), width: 3 });
      bemapObj = new bemap.Polyline(bemapLineCoords, { style: defaultLineStyle });

    } else if (type === 'Circle') {
      var center = cloned.getCenter();
      var centerCoord = new bemap.Coordinate(center[0], center[1]);
      // Compute real-Earth radius in meters via Haversine from center to edge point
      var mercCenter = geom.getCenter();
      var mercRadius = geom.getRadius();
      var edgeMerc = [mercCenter[0] + mercRadius, mercCenter[1]];
      var edgeWgs = ol.proj.transform(edgeMerc, _this.native.getView().getProjection(), bemap.Map.PROJ.EPSG_WGS84);
      var R = 6371000;
      var lat1 = center[1] * Math.PI / 180, lat2 = edgeWgs[1] * Math.PI / 180;
      var dLat = (edgeWgs[1] - center[1]) * Math.PI / 180;
      var dLon = (edgeWgs[0] - center[0]) * Math.PI / 180;
      var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon/2) * Math.sin(dLon/2);
      var radiusM = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      var circleStyle = opts.style || new bemap.CircleStyle({
        fillColor: new bemap.Color(0, 102, 204, 0.2),
        borderColor: new bemap.Color(0, 102, 204, 1),
        borderWidth: 2
      });
      bemapObj = new bemap.Circle(centerCoord, radiusM, { style: circleStyle });

    } else if (type === 'Point') {
      var pt = cloned.getCoordinates();
      bemapObj = new bemap.Marker(new bemap.Coordinate(pt[0], pt[1]));
    }

    // Clean up
    _this.native.removeInteraction(interaction);
    _this.native.removeLayer(drawLayer);
    _this._drawInteraction = null;

    if (bemapObj) {
      if (callback) {
        callback(new bemap.MapEvent({
          map: _this,
          bemapObject: bemapObj,
          coordinate: bemapObj.coordinate || (bemapObj.getCoordinates ? bemapObj.getCoordinates()[0] : null)
        }));
      }

      // Auto-add to map
      if (opts.addToMap !== false) {
        if (bemap.inheritsof(bemapObj, bemap.Polygon)) _this.addPolygon(bemapObj);
        else if (bemap.inheritsof(bemapObj, bemap.Polyline)) _this.addPolyline(bemapObj);
        else if (bemap.inheritsof(bemapObj, bemap.Circle)) _this.addCircle(bemapObj);
        else if (bemap.inheritsof(bemapObj, bemap.Marker)) _this.addMarker(bemapObj);
      }

      // Auto-enable vertex editing
      if (opts.editable !== false && bemap.inheritsof(bemapObj, bemap.Polygon)) {
        _this.editPolygon(bemapObj, callback);
      }
    }
  });

  this.native.addInteraction(interaction);
  this._drawInteraction = interaction;
  this._drawLayer = drawLayer;

  // Set crosshair cursor
  var container = document.getElementById(this.target);
  if (container) container.classList.add('bemap-drawing-active');

  return new bemap.Listener({ native: interaction, bemapObject: null, key: 'draw' });
};

bemap.OlMap.prototype.cancelDraw = function() {
  if (this._drawInteraction) {
    this.native.removeInteraction(this._drawInteraction);
    this._drawInteraction = null;
  }
  if (this._editInteraction) {
    this.native.removeInteraction(this._editInteraction);
    this._editInteraction = null;
  }
  if (this._drawLayer) {
    this.native.removeLayer(this._drawLayer);
    this._drawLayer = null;
  }
  var container = document.getElementById(this.target);
  if (container) container.classList.remove('bemap-drawing-active');
  return this;
};

bemap.OlMap.prototype.editPolygon = function(polygon, callback) {
  if (!polygon || !polygon.native) return new bemap.Listener();
  if (typeof ol === 'undefined' || !ol.interaction || !ol.interaction.Modify) return new bemap.Listener();
  var _this = this;

  // Remove previous edit interaction if any
  if (this._editInteraction) {
    this.native.removeInteraction(this._editInteraction);
    this._editInteraction = null;
  }

  var modify = new ol.interaction.Modify({
    features: new ol.Collection([polygon.native])
  });

  var MERGE_PX = 15;

  modify.on('modifyend', function() {
    var geom = polygon.native.getGeometry().clone().transform(
      _this.native.getView().getProjection(), bemap.Map.PROJ.EPSG_WGS84
    );
    var ringCoords = geom.getCoordinates()[0];
    var updatedCoords = [];
    for (var i = 0; i < ringCoords.length - 1; i++) {
      updatedCoords.push(new bemap.Coordinate(ringCoords[i][0], ringCoords[i][1]));
    }

    // Merge: remove near-duplicate vertices
    if (updatedCoords.length > 3) {
      var merged = [updatedCoords[0]];
      for (var m = 1; m < updatedCoords.length; m++) {
        var pxA = _this.native.getPixelFromCoordinate(ol.proj.transform(
          [updatedCoords[m].getLon(), updatedCoords[m].getLat()], bemap.Map.PROJ.EPSG_WGS84, _this.native.getView().getProjection()
        ));
        var tooClose = false;
        for (var n = 0; n < merged.length; n++) {
          var pxB = _this.native.getPixelFromCoordinate(ol.proj.transform(
            [merged[n].getLon(), merged[n].getLat()], bemap.Map.PROJ.EPSG_WGS84, _this.native.getView().getProjection()
          ));
          if (pxA && pxB && Math.sqrt(Math.pow(pxA[0] - pxB[0], 2) + Math.pow(pxA[1] - pxB[1], 2)) < MERGE_PX) {
            tooClose = true; break;
          }
        }
        if (!tooClose) merged.push(updatedCoords[m]);
      }
      updatedCoords = merged;
    }

    polygon.coords = updatedCoords;
    if (callback) {
      callback(new bemap.MapEvent({ map: _this, bemapObject: polygon }));
    }
  });

  // Right-click to delete nearest vertex
  var contextHandler = function(evt) {
    evt.preventDefault();
    var geom = polygon.native.getGeometry();
    var ringCoords = geom.getCoordinates()[0];
    if (ringCoords.length - 1 <= 3) return; // min 3 vertices (ring has closing coord)

    var pixel = _this.native.getEventPixel(evt);
    var coord = _this.native.getCoordinateFromPixel(pixel);
    var bestIdx = -1, bestDist = 20; // max 20px

    for (var v = 0; v < ringCoords.length - 1; v++) {
      var vPx = _this.native.getPixelFromCoordinate(ringCoords[v]);
      if (vPx) {
        var d = Math.sqrt(Math.pow(pixel[0] - vPx[0], 2) + Math.pow(pixel[1] - vPx[1], 2));
        if (d < bestDist) { bestDist = d; bestIdx = v; }
      }
    }

    if (bestIdx >= 0) {
      ringCoords.splice(bestIdx, 1);
      ringCoords[ringCoords.length - 1] = ringCoords[0]; // re-close ring
      geom.setCoordinates([ringCoords]);

      var wgs = geom.clone().transform(_this.native.getView().getProjection(), bemap.Map.PROJ.EPSG_WGS84).getCoordinates()[0];
      var newCoords = [];
      for (var nc = 0; nc < wgs.length - 1; nc++) {
        newCoords.push(new bemap.Coordinate(wgs[nc][0], wgs[nc][1]));
      }
      polygon.coords = newCoords;
      if (callback) callback(new bemap.MapEvent({ map: _this, bemapObject: polygon }));
    }
  };
  var mapEl = document.getElementById(_this.target);
  if (mapEl) mapEl.addEventListener('contextmenu', contextHandler);
  polygon._contextHandler = contextHandler;

  this.native.addInteraction(modify);
  this._editInteraction = modify;
  return new bemap.Listener({ native: modify, bemapObject: polygon, key: 'editPolygon' });
};

/**
 * Add a marker to the layer
 * @public
 * @param {bemap.Marker} marker
 * @param {object} options
 * @return {bemap.OlMap} this
 */
bemap.OlMap.prototype.addMarker = function(marker, options) {
  if (marker !== null && bemap.inheritsof(marker, bemap.Marker)) {
    marker.native = new ol.Feature({
      geometry: new ol.geom.Point(marker.getCoordinate().getLonLatArray()),
    });

    if (marker.map === null) {
      marker.map = this;
    }

    if (marker.id !== undefined && marker.id !== null) {
      marker.native.setId(marker.id);
    }

    bemap.OlMap.prototype._addOwnToProperties(marker);

    marker.native.getGeometry().transform(bemap.Map.PROJ.EPSG_WGS84, this.native.getView().getProjection());

    if (marker.icon !== null && marker.icon.native === null) {
      this.buildIcon(marker.icon);
    }

    var styleParams = {};
    if (marker.icon && marker.icon.native) {
      styleParams.image = marker.icon.native;
    } else {
      // Default marker style: blue circle
      styleParams.image = new ol.style.Circle({
        radius: 8,
        fill: new ol.style.Fill({ color: '#0066cc' }),
        stroke: new ol.style.Stroke({ color: '#fff', width: 2 })
      });
    }
    if (marker.name && marker.textStyle) {
      this.buildTextStyle(marker.textStyle, marker.name);
      styleParams.text = marker.textStyle.native;
    }
    marker.native.setStyle(new ol.style.Style(styleParams));

    var opts = options || {};
    var l = null;

    if (opts.layer !== undefined && (bemap.inheritsof(opts.layer, bemap.VectorLayer) || bemap.inheritsof(opts.layer, bemap.ClusterLayer))) {
      l = opts.layer;
    } else {
      l = this.getLayerByName(bemap.Map.DEFAULT_LAYER.MARKER);
      if (l === null) {
        l = new bemap.VectorLayer({
          name: bemap.Map.DEFAULT_LAYER.MARKER
        });
        this.addLayer(l);
      }
    }

    if (marker.layer === null) {
      marker.layer = l;
    }

    if (bemap.inheritsof(l, bemap.VectorLayer)) {
      l.native.getSource().addFeature(marker.native);
    } else {
      l.native.getSource().getSource().addFeature(marker.native);
    }
  }
  return this;
};

/**
 * Set the coordinates of the marker.
 * @protected
 * @param {bemap.Marker} marker the marker object to remove.
 * @return {bemap.OlMap} this
 */
bemap.OlMap.prototype.setCoordinateMarker = function(marker) {
  var c = marker.getCoordinate();
  marker.native.getGeometry().setCoordinates(this._fromLonLat(c.getLon(), c.getLat()));
  return this;
};

/**
 * Remove a marker from his layer.
 * @param {bemap.Marker} marker the marker object to remove.
 * @return {bemap.OlMap} this
 */
bemap.OlMap.prototype.removeMarker = function(marker) {
  if (marker !== null && bemap.inheritsof(marker, bemap.Marker) && marker.layer && marker.layer.native) {
    marker.layer.native.getSource().removeFeature(marker.native);
    marker.layer = null;
    marker.map = null;
  }
  return this;
};

/**
 * Set the listner when an specified eventType occur on bemap.Marker.
 * @public
 * @param {bemap.Marker} marker
 * @param {bemap.Map.EventType} eventType Event type.
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options options.
 * @return {bemap.Listener} this.
 */
bemap.OlMap.prototype.onMarker = function(marker, eventType, callback, options) {
  return this._onFeature(marker, eventType, callback, options, {
    singleFeature: true
  });
};

/**
 * Set the listner when an specified eventType occur on all bemap.Marker.
 * @public
 * @param {bemap.Map.EventType} eventType Event type.
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options options.
 * @return {bemap.Listener} this.
 */
bemap.OlMap.prototype.onMarkers = function(eventType, callback, options) {
  return this._onFeature(null, eventType, callback, options, {
    markers: true
  });
};

/**
 * Define the draggable capability for bemap.Marker.
 * @protected
 * @param {bemap.Marker} marker bemap object.
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options Options.
 * @param {bemap.Layer} options.layerFilter set the bemap layer used as filter.
 * @return {bemap.Listener} bemap.listener.
 */
bemap.OlMap.prototype.draggableMarker = function(marker, callback, options) {
  return this._draggableFeature(marker, callback, options, {
    singleFeature: true
  });
};

/**
 * Define the draggable capability for all bemap.Marker.
 * @protected
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options Options.
 * @param {bemap.Layer} options.layerFilter set the bemap layer used as filter.
 * @return {bemap.Listener} bemap.listener.
 */
bemap.OlMap.prototype.draggableMarkers = function(callback, options) {
  return this._draggableFeature(null, callback, options, {
    markers: true
  });
};

/**
 * Add a multimarker to the layer
 * @public
 * @param {bemap.Marker} multimarker
 * @param {object} options
 * @return {bemap.OlMap} this
 */
bemap.OlMap.prototype.addMultiMarker = function(multimarker, options) {
  if (multimarker !== null && bemap.inheritsof(multimarker, bemap.MultiMarker)) {
    multimarker.native = new ol.Feature({
      geometry: new ol.geom.MultiPoint(multimarker.getLonLatArrays())
    });

    if (multimarker.map === null) {
      multimarker.map = this;
    }

    if (multimarker.id !== undefined && multimarker.id !== null) {
      multimarker.native.setId(multimarker.id);
    }

    bemap.OlMap.prototype._addOwnToProperties(multimarker);

    multimarker.native.getGeometry().transform(bemap.Map.PROJ.EPSG_WGS84, this.native.getView().getProjection());

    if (multimarker.icon.native === null) {
      this.buildIcon(multimarker.icon);
    }

    var styleParams = {};
    if (multimarker.icon && multimarker.icon.native) {
      styleParams.image = multimarker.icon.native;
    }
    if (multimarker.name && multimarker.textStyle) {
      this.buildTextStyle(multimarker.textStyle, multimarker.name);
      styleParams.text = multimarker.textStyle.native;
    }
    multimarker.native.setStyle(new ol.style.Style(styleParams));

    var opts = options || {};
    var l = null;

    if (opts.layer && bemap.inheritsof(opts.layer, bemap.VectorLayer)) {
      l = opts.layer;
    } else {
      l = this.getLayerByName(bemap.Map.DEFAULT_LAYER.MARKER);
      if (l === null) {
        l = new bemap.VectorLayer({
          name: bemap.Map.DEFAULT_LAYER.MARKER
        });
        this.addLayer(l);
      }
    }

    if (multimarker.layer === null) {
      multimarker.layer = l;
    }

    l.native.getSource().addFeature(multimarker.native);
  }
  return this;
};

/**
 * Remove a multimarker from his layer.
 * @public
 * @param {bemap.MultiMarker} multimarker the multimarker object to remove.
 * @return {bemap.OlMap} this
 */
bemap.OlMap.prototype.removeMultimarker = function(multimarker) {
  if (multimarker !== null && bemap.inheritsof(multimarker, bemap.MultiMarker)) {
    multimarker.layer.native.getSource().removeFeature(multimarker.native);
    multimarker.layer = null;
    multimarker.map = null;
  }
  return this;
};

/**
 * Set the listner when an specified eventType occur on all bemap.MultiMarker.
 * @public
 * @param {bemap.Map.EventType} eventType Event type.
 * @param {function} listener Function will be called when the specified eventType is occur.
 * @param {object} options options.
 * @return {bemap.Listener} bemap.Listener.
 */
bemap.OlMap.prototype.onMultiMarkers = function(eventType, listener, options) {
  return this._onFeature(null, eventType, listener, options, {
    multiMarkers: true
  });
};

/**
 * Set the listner when an specified eventType occur on bemap.MultiMarker.
 * @public
 * @param {bemap.MultiMarker} multimarker
 * @param {bemap.Map.EventType} eventType Event type.
 * @param {function} listener Function will be called when the specified eventType is occur.
 * @param {object} options options.
 * @return {bemap.Listener} bemap.Listener.
 */
bemap.OlMap.prototype.onMultiMarker = function(multimarker, eventType, listener, options) {
  return this._onFeature(multimarker, eventType, listener, options, {
    singleFeature: true
  });
};

/**
 * Define the draggable capability for all bemap.MultiMarkers.
 * @protected
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options Options.
 * @param {bemap.Layer} options.layerFilter set the bemap layer used as filter.
 * @return {bemap.Listener} bemap.listener.
 */
bemap.OlMap.prototype.draggableMultiMarkers = function(callback, options) {
  return this._draggableFeature(null, callback, options, {
    multiMarkers: true
  });
};

/**
 * Add a bemap.Polygon to the layer
 * @public
 * @param {bemap.Polygon} bemap.Polygon.
 * @param {object} options
 * @return {bemap.OlMap}
 */
bemap.OlMap.prototype.addPolygon = function(polygon, options) {
    if (polygon && bemap.inheritsof(polygon, bemap.Polygon)) {
        polygon.native = new ol.Feature({
            geometry: new ol.geom.Polygon([polygon.getLonLatArrays()]),
        });

        if (polygon.map === null) {
            polygon.map = this;
        }

        if (polygon.id) {
            polygon.native.setId(polygon.id);
        }

        bemap.OlMap.prototype._addOwnToProperties(polygon);

        polygon.native.getGeometry().transform(bemap.Map.PROJ.EPSG_WGS84, this.native.getView().getProjection());

        if (polygon.style) {
            if (polygon.style.native === null) {
                this.buildPolygonStyle(polygon.style);
            }
            polygon.native.setStyle(polygon.style.native);
        }

        var opts = options || {};
        var l = null;

        if (opts.layer && bemap.inheritsof(opts.layer, bemap.VectorLayer)) {
            l = opts.layer;
        } else {
            l = this.getLayerByName(bemap.Map.DEFAULT_LAYER.POLYGON);
            if (l === null) {
                l = new bemap.VectorLayer({
                    name: bemap.Map.DEFAULT_LAYER.POLYGON
                });
                this.addLayer(l);
            }
        }

        if (polygon.layer === null) {
            polygon.layer = l;
        }

        l.native.getSource().addFeature(polygon.native);
    }
    return this;
};

/**
 * Remove a polygon from his layer.
 * @public
 * @param {bemap.Polygon} polygon the polygon object to remove.
 */
bemap.OlMap.prototype.removePolygon = function(polygon) {
    if (polygon && polygon.layer && polygon.layer.native && bemap.inheritsof(polygon, bemap.Polygon)) {
        // Clean up edit contextmenu handler if any
        if (polygon._contextHandler && this.target) {
            var mapEl = document.getElementById(this.target);
            if (mapEl) mapEl.removeEventListener('contextmenu', polygon._contextHandler);
            polygon._contextHandler = null;
        }
        polygon.layer.native.getSource().removeFeature(polygon.native);
        polygon.layer = null;
        polygon.map = null;
    }
    return this;
};

/**
 * Set the listner when an specified eventType occur on bemap.Polygon.
 * @public
 * @param {bemap.Polygon} polygon
 * @param {bemap.Map.EventType} eventType Event type.
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options options.
 * @return {bemap.Listener} this.
 */
bemap.OlMap.prototype.onPolygon = function(polygon, eventType, callback, options) {
    return this._onFeature(polygon, eventType, callback, options, {
        singleFeature: true
    });
};

/**
 * Set the listner when an specified eventType occur on all bemap.Polygon.
 * @public
 * @param {bemap.Map.EventType} eventType Event type.
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options options.
 * @return {bemap.Listener} this.
 */
bemap.OlMap.prototype.onPolygons = function(eventType, callback, options) {
    return this._onFeature(null, eventType, callback, options, {
        polygons: true
    });
};

/**
 * Define the draggable capability for bemap.Polygon.
 * @protected
 * @param {bemap.Polygon} polygon bemap object.
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options Options.
 * @param {bemap.Layer} options.layerFilter set the bemap layer used as filter.
 * @return {bemap.Listener} bemap.listener.
 */
bemap.OlMap.prototype.draggablePolygon = function(polygon, callback, options) {
    return this._draggableFeature(polygon, callback, options, {
        singleFeature: true
    });
};

/**
 * Define the draggable capability for all bemap.Polygon.
 * @protected
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options Options.
 * @param {bemap.Layer} options.layerFilter set the bemap layer used as filter.
 * @return {bemap.Listener} bemap.listener.
 */
bemap.OlMap.prototype.draggablePolygons = function(callback, options) {
    return this._draggableFeature(null, callback, options, {
        polygons: true
    });
};

/**
 * Update the coordinates from the native map browser.
 * @public
 */
bemap.OlMap.prototype.updatePolygonCoordinates = function(polygon) {
  var pol = polygon.native.getGeometry().getCoordinates(true)[0];

  for (var i = 0; i < pol.length; i++) {
    var polc = ol.proj.transform(pol[i], this.native.getView().getProjection(), bemap.Map.PROJ.EPSG_WGS84);
    var coord = polygon.coords[i];

    if(coord && coord !== null && bemap.inheritsof(coord, bemap.Coordinate)) {
      coord.setLon(polc[0]);
      coord.setLat(polc[1]);
    } else {
      polygon.coords[i] = new bemap.Coordinate(polc[0], polc[1]);
   }
  }

  if(polygon.coords.length > pol.length) {
    for (var j = pol.length; j < polygon.coords.length; j++) {
      polygon.coords.pop();
    }
  }
};

/**
 * Add a bemap.Polyline to the layer
 * @public
 * @param {bemap.Polyline} bemap.Polyline.
 * @param {object} options
 * @return {bemap.OlMap}
 */
bemap.OlMap.prototype.addPolyline = function(polyline, options) {
    if (polyline !== null && bemap.inheritsof(polyline, bemap.Polyline)) {
        polyline.native = new ol.Feature({
            geometry: new ol.geom.LineString(polyline.getLonLatArrays()),
        });

        if (polyline.map === null) {
            polyline.map = this;
        }

        if (polyline.id !== undefined && polyline.id !== null) {
            polyline.native.setId(polyline.id);
        }

        bemap.OlMap.prototype._addOwnToProperties(polyline);

        polyline.native.getGeometry().transform(bemap.Map.PROJ.EPSG_WGS84, this.native.getView().getProjection());

        if (polyline.style !== null) {
            if (polyline.style.native === null) {
                this.buildLineStyle(polyline.style);
            }
            polyline.native.setStyle(polyline.style.native);
        }

        var opts = options || {};
        var l = null;

        if (opts.layer && bemap.inheritsof(opts.layer, bemap.VectorLayer)) {
            l = opts.layer;
        } else {
            l = this.getLayerByName(bemap.Map.DEFAULT_LAYER.POLYLINE);
            if (l === null) {
                l = new bemap.VectorLayer({
                    name: bemap.Map.DEFAULT_LAYER.POLYLINE
                });
                this.addLayer(l);
            }
        }

        if (polyline.layer === null) {
            polyline.layer = l;
        }

        l.native.getSource().addFeature(polyline.native);
    }
    return this;
};

/**
 * Remove a polyline from his layer.
 * @public
 * @param {bemap.Polyline} polyline the polyline object to remove.
 */
bemap.OlMap.prototype.removePolyline = function(polyline) {
    if (polyline !== null && polyline.layer !== null && polyline.layer.native !== null && bemap.inheritsof(polyline, bemap.Polyline)) {
        polyline.layer.native.getSource().removeFeature(polyline.native);
        polyline.layer = null;
        polyline.map = null;
    }
    return this;
};

/**
 * Set the listner when an specified eventType occur on bemap.Polyline.
 * @public
 * @param {bemap.Polyline} polyline
 * @param {bemap.Map.EventType} eventType Event type.
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options options.
 * @return {bemap.Listener} this.
 */
bemap.OlMap.prototype.onPolyline = function(polyline, eventType, callback, options) {
    return this._onFeature(polyline, eventType, callback, options, {
        singleFeature: true
    });
};

/**
 * Set the listner when an specified eventType occur on all bemap.Polyline.
 * @public
 * @param {bemap.Map.EventType} eventType Event type.
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options options.
 * @return {bemap.Listener} this.
 */
bemap.OlMap.prototype.onPolylines = function(eventType, callback, options) {
    return this._onFeature(null, eventType, callback, options, {
        polylines: true
    });
};

/**
 * Define the draggable capability for bemap.Polyline.
 * @protected
 * @param {bemap.Polyline} polyline bemap object.
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options Options.
 * @param {bemap.Layer} options.layerFilter set the bemap layer used as filter.
 * @return {bemap.Listener} bemap.listener.
 */
bemap.OlMap.prototype.draggablePolyline = function(polyline, callback, options) {
    return this._draggableFeature(polyline, callback, options, {
        singleFeature: true
    });
};

/**
 * Define the draggable capability for all bemap.Polyline.
 * @protected
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options Options.
 * @param {bemap.Layer} options.layerFilter set the bemap layer used as filter.
 * @return {bemap.Listener} bemap.listener.
 */
bemap.OlMap.prototype.draggablePolylines = function(callback, options) {
    return this._draggableFeature(null, callback, options, {
        polylines: true
    });
};

/**
 * Add a popup to the map
 * @public
 * @param {bemap.Popup} popup
 * @param {object} options
 * @return {bemap.OlMap} this
 */
bemap.OlMap.prototype.addPopup = function(popup, options) {
    if (popup !== null && bemap.inheritsof(popup, bemap.Popup)) {

        if (popup.container_ === null) {
            popup.container_ = document.createElement("div");
            popup.closer_ = document.createElement("div");
            popup.content_ = document.createElement("div");
            popup.container_.id = 'popup';
            popup.container_.className = 'ol-popup';
            popup.closer_.className = 'ol-popup-closer';
            popup.container_.appendChild(popup.closer_);
            popup.container_.appendChild(popup.content_);
            popup.closer_.onclick = function() {
                popup.native.setPosition(undefined);
                popup.visible = false;
            };
            document.body.insertBefore(popup.container_, document.getElementById(this.native.target));
        }

        if (popup.information !== null) {
            popup.content_.innerHTML = popup.information;
        }

        popup.native = new ol.Overlay({
            autoPan: {
                animation: { duration: 250 }
            },
            element: popup.container_
        });

        if (popup.map === null) {
            popup.map = this;
        }

        bemap.OlMap.prototype._addOwnToProperties(popup);

        if (popup.coordinate !== undefined && popup.visible === true) {
            popup.native.setPosition(ol.proj.transform(popup.coordinate.getLonLatArray(), bemap.Map.PROJ.EPSG_WGS84, this.native.getView().getProjection()));
        } else if (popup.coordinate === undefined && popup.visible === true) {
            var center = this.native.getView().getCenter();
            popup.coordinate = new bemap.Coordinate(center[0], center[1]);
            popup.native.setPosition(this.native.getView().getCenter());
        } else {
            popup.native.setPosition(undefined);
        }

        this.native.addOverlay(popup.native);

    }
    return this;
};

/**
 * Remove a popup from the map.
 * @public
 * @param {bemap.Popup} popup the popup to remove from the map.
 * @return {bemap.OlMap} this;
 */
bemap.OlMap.prototype.removePopup = function(popup) {
    if (popup !== null && bemap.inheritsof(popup, bemap.Popup) && popup.container_ !== null) {
        this.native.removeOverlay(popup.native);
        popup.container_.removeChild(popup.closer_);
        popup.container_.removeChild(popup.content_);
        popup.container_.remove();
        popup.container_ = null;
        popup.content_ = null;
        popup.closer_ = null;
        popup.map = null;
        popup.native = null;
    }
    return this;
};

/**
 * Set the visiblility of the popup.
 * @param {bemap.Popup} popup the popup.
 * @param {Boolean} visible true for visible and false for hidden.
 * @return {bemap.Popup} this.
 */
bemap.OlMap.prototype.setVisiblePopup = function(popup, visible) {
    if (popup !== null && bemap.inheritsof(popup, bemap.Popup) && popup.native !== null) {
        popup.visible = visible;
        var _popup = popup;
        this.native.once('postrender', function(evt) {
            if (_popup.visible === true) {
                _popup.native.setPosition(ol.proj.transform(_popup.coordinate.getLonLatArray(), bemap.Map.PROJ.EPSG_WGS84, evt.map.getView().getProjection()));
            } else {
                _popup.native.setPosition(undefined);
            }
        });
    }
    return this;
};

/**
 * Remove all the popups from the map.
 * @return {bemap.OlMap} this;
 */
bemap.OlMap.prototype.clearPopup = function() {
    var overlays = this.native.getOverlays().getArray();
    while (overlays[0]) {
        var popup = this._getOwnFromProperties(overlays[0]);
        this.removePopup(popup);
    }
    return this;
};

/**
 * Set the coordinate of the popup.
 * @param {bemap.Popup} popup the popup of wich to set the coordinate.
 * @param {bemap.Coordinate} coordinate the new coordinate.
 * @param {object} options Options.
 * @param {bemap.Layer} options.panningMap enable the map panning animation. move map from the current position to the popup anchor at the center of map.
 * @return {bemap.OlMap} this.
 */
bemap.OlMap.prototype.setCoordinatePopup = function(popup, coordinate, options) {
    if (popup !== null && bemap.inheritsof(popup, bemap.Popup)) {
        popup.coordinate = coordinate;
        if (popup.native !== null) {
            var pos = ol.proj.transform(popup.coordinate.getLonLatArray(), bemap.Map.PROJ.EPSG_WGS84, this.native.getView().getProjection());
            popup.native.setPosition(pos);
            this.native.getView().animate({
                center: pos,
                duration: 250
            });
            if (options && options.panningMap) {
                this.native.getView().setCenter(pos);
            }
            popup.visible = true;
        }
    }
    return this;
};

/**
 * Add a bemap.Circle to the layer
 * @public
 * @param {bemap.Circle} bemap.Circle.
 * @param {object} options
 * @return {bemap.LeafletMap}
 */
bemap.LeafletMap.prototype.addCircle = function(circle, options) {
  if (circle && bemap.inheritsof(circle, bemap.Circle)) {
    var style = circle.getStyle();
    if (!style) {
      style = new bemap.PolygonStyle({
        fillColor: new bemap.Color(0, 102, 204, 0.2),
        borderColor: new bemap.Color(0, 102, 204, 1),
        borderWidth: 2
      });
    }
    var fillColor = style.getFillColor();
    var borderColor = style.getBorderColor();

    circle.native = L.circle(circle.getCoordinate().getLatLonArray(), circle.getRadius(), {
      fillColor: fillColor.getHex(),
      opacity: fillColor.getAlpha(),
      color: borderColor.getHex(),
      weight: style.getBorderWidth(),
    });

    if (circle.map === null) {
      circle.map = this;
    }

    var opts = options || {};
    var l = null;

    if (opts.layer !== undefined && (bemap.inheritsof(opts.layer, bemap.VectorLayer))) {
      l = opts.layer;
    } else {
      l = this.getLayerByName(bemap.Map.DEFAULT_LAYER.CIRCLE);
      if (l === null) {
        l = new bemap.VectorLayer({
          name: bemap.Map.DEFAULT_LAYER.CIRCLE
        });
        this.addLayer(l);
      }
    }

    if (circle.layer === null) {
      circle.layer = l;
    }

    circle.native.addTo(l.native);
  }

  return this;
};

/**
 * Set the coordinates of the circle.
 * @protected
 * @param {bemap.Circle} circle the circle object to remove.
 * @return {bemap.LeafletMap} this
 */
bemap.LeafletMap.prototype.setCoordinateCircle = function(circle) {
  var c = circle.getCoordinate();
  circle.native.setLatLng(L.latLng(c.getLat(), c.getLon()));
  return this;
};

/**
 * Set the radius of the circle.
 * @protected
 * @param {bemap.Circle} circle the circle object to remove.
 * @return {bemap.LeafletMap} this
 */
bemap.LeafletMap.prototype.setRadiusCircle = function(circle) {
  circle.native.setRadius(circle.getRadius());
  return this;
};

/**
 * Remove a circle from his layer.
 * @public
 * @param {bemap.Circle} circle the circle object to remove.
 */
bemap.LeafletMap.prototype.removeCircle = function(circle) {
  if (circle && circle.layer && circle.layer.native && bemap.inheritsof(circle, bemap.Circle)) {
    circle.map.native.removeLayer(circle.native);
    circle.layer = null;
    circle.map = null;
  }
  return this;
};

/**
 * Set the listner when an specified eventType occur on bemap.Circle.
 * @public
 * @param {bemap.Circle} circle
 * @param {bemap.Map.EventType} eventType Event type.
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options options.
 * @return {bemap.Listener} this.
 */
bemap.LeafletMap.prototype.onCircle = function(circle, eventType, callback, options) {

  var opts = options ? options : {};

  var nativeListener = circle.native.on(eventType, function(evt) {
    var mapEvent = new bemap.MapEvent({
      native: evt,
      bemapObject: circle,
      x: evt.containerPoint ? evt.containerPoint.x : undefined,
      y: evt.containerPoint ? evt.containerPoint.y : undefined,
      coordinate: evt.latlng ? new bemap.Coordinate(evt.latlng.lng, evt.latlng.lat) : undefined,
      properties: options,
      map: this
    });
    callback(mapEvent);
  });
  var listener = new bemap.Listener({
    native: nativeListener,
    callback: callback,
    key: eventType,
    bemapObject: circle
  });

  return listener;
};

/**
 * Define the draggable capability for bemap.Circle.
 * @protected
 * @param {bemap.Circle} circle bemap object.
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options Options.
 * @param {bemap.Layer} options.layerFilter set the bemap layer used as filter.
 * @return {bemap.Listener} bemap.listener.
 */
bemap.LeafletMap.prototype.draggableCircle = function(circle, callback, options) {
  var _this = this,
    opts = options ? options : {},
    startPixel, startCoordinate;

  circle.native.on('mousedown', function(evt) {
    _this.native.dragging.disable();
    startPixel = evt.containerPoint;

    var latlng = circle.native._latlng;
    var circleStartingLat = latlng.lat;
    var circleStartingLng = latlng.lng;

    startCoordinate = new bemap.Coordinate(circleStartingLng, circleStartingLat);

    latlng = evt.latlng;
    var mouseStartingLat = latlng.lat;
    var mouseStartingLng = latlng.lng;

    _this.native.on('mousemove', function(evt) {
      latlng = evt.latlng;
      var mouseNewLat = latlng.lat;
      var mouseNewLng = latlng.lng;

      var latDifference = mouseStartingLat - mouseNewLat;
      var lngDifference = mouseStartingLng - mouseNewLng;
      var center = [circleStartingLat - latDifference, circleStartingLng - lngDifference];
      circle.native.setLatLng(center);
    });
  });

  this.native.on('mouseup', function(evt) {
    _this.native.dragging.enable();
    _this.native.removeEventListener('mousemove');

    var mapEvent = new bemap.MapEvent({
      native: evt,
      bemapObject: circle,
      x: evt.containerPoint ? evt.containerPoint.x : undefined,
      y: evt.containerPoint ? evt.containerPoint.y : undefined,
      coordinate: evt.latlng ? new bemap.Coordinate(evt.latlng.lng, evt.latlng.lat) : undefined,
      //startX: startPixel.x,
      //startY: startPixel.y,
      //startCoordinate: startCoordinate,
      properties: options,
      map: this
    });

    callback(mapEvent);
  });

  this.events.dragFeature = new bemap.Listener({
    native: null,
    key: "dragFeature",
    bemapObject: circle
  });

  return this.events.dragFeature;
};

/**
 * BeNomad BeMap JavaScript API - Leaflet - Draw Interaction
 * Uses L.Draw if available, otherwise falls back to click-based drawing.
 */

bemap.LeafletMap.prototype.drawPolygon = function(options, callback) {
  var opts = options || {};
  var _this = this;
  this.cancelDraw();

  // If Leaflet.Draw is available, use it
  if (typeof L !== 'undefined' && L.Draw && L.Draw.Polygon) {
    var shapeOpts = {};
    if (opts.style) {
      if (opts.style.borderColor) shapeOpts.color = _this._colorToHex(opts.style.borderColor);
      if (opts.style.borderWidth) shapeOpts.weight = opts.style.borderWidth;
      if (opts.style.fillColor) shapeOpts.fillColor = _this._colorToHex(opts.style.fillColor);
      if (opts.style.fillColor) shapeOpts.fillOpacity = opts.style.fillColor.getAlpha ? opts.style.fillColor.getAlpha() : 0.3;
    }

    var drawer = new L.Draw.Polygon(this.native, { shapeOptions: shapeOpts });
    drawer.enable();

    var handler = function(e) {
      _this.native.off(L.Draw.Event.CREATED, handler);
      _this._drawHandler = null;

      var latlngs = e.layer.getLatLngs()[0];
      var coords = [];
      for (var i = 0; i < latlngs.length; i++) {
        coords.push(new bemap.Coordinate(latlngs[i].lng, latlngs[i].lat));
      }
      var drawStyle = opts.style || new bemap.PolygonStyle({
        fillColor: new bemap.Color(0, 102, 204, 0.2),
        borderColor: new bemap.Color(0, 102, 204, 1),
        borderWidth: 2
      });
      var polygon = new bemap.Polygon(coords, { style: drawStyle });

      var container = _this.native.getContainer();
      if (container) container.classList.remove('bemap-drawing-active');

      if (callback) {
        callback(new bemap.MapEvent({ map: _this, bemapObject: polygon, coordinate: coords[0] }));
      }

      // Add polygon to map using bemap's addPolygon (creates proper L.polygon)
      if (opts.addToMap !== false) {
        _this.addPolygon(polygon);
      }
      // Auto-enable vertex editing on the bemap-created native polygon
      if (opts.editable !== false) {
        _this.editPolygon(polygon, callback);
      }
    };
    this.native.on(L.Draw.Event.CREATED, handler);
    this._drawHandler = { drawer: drawer, handler: handler };

    var container = this.native.getContainer();
    if (container) container.classList.add('bemap-drawing-active');

    return new bemap.Listener({ native: drawer, bemapObject: null, key: 'drawPolygon' });
  }

  // Fallback: click-based drawing
  return this._clickDraw('Polygon', opts, callback);
};

bemap.LeafletMap.prototype.drawPolyline = function(options, callback) {
  var opts = options || {};
  var _this = this;
  this.cancelDraw();

  if (typeof L !== 'undefined' && L.Draw && L.Draw.Polyline) {
    var shapeOpts = {};
    if (opts.style) {
      if (opts.style.color) shapeOpts.color = _this._colorToHex(opts.style.color);
      if (opts.style.width) shapeOpts.weight = opts.style.width;
    }
    var drawer = new L.Draw.Polyline(this.native, { shapeOptions: shapeOpts });
    drawer.enable();

    var handler = function(e) {
      _this.native.off(L.Draw.Event.CREATED, handler);
      _this._drawHandler = null;
      var latlngs = e.layer.getLatLngs();
      var coords = [];
      for (var i = 0; i < latlngs.length; i++) {
        coords.push(new bemap.Coordinate(latlngs[i].lng, latlngs[i].lat));
      }
      var lineStyle = opts.style || new bemap.LineStyle({
        color: new bemap.Color(230, 57, 70, 1),
        width: 3
      });
      var polyline = new bemap.Polyline(coords, { style: lineStyle });
      var container = _this.native.getContainer();
      if (container) container.classList.remove('bemap-drawing-active');
      if (callback) {
        callback(new bemap.MapEvent({ map: _this, bemapObject: polyline, coordinate: coords[0] }));
      }
      if (opts.addToMap !== false) {
        _this.addPolyline(polyline);
      }
    };
    this.native.on(L.Draw.Event.CREATED, handler);
    this._drawHandler = { drawer: drawer, handler: handler };
    var container = this.native.getContainer();
    if (container) container.classList.add('bemap-drawing-active');
    return new bemap.Listener({ native: drawer, bemapObject: null, key: 'drawPolyline' });
  }

  return this._clickDraw('Polyline', opts, callback);
};

bemap.LeafletMap.prototype.drawRectangle = function(options, callback) {
  var opts = options || {};
  var _this = this;
  this.cancelDraw();

  if (typeof L !== 'undefined' && L.Draw && L.Draw.Rectangle) {
    var drawer = new L.Draw.Rectangle(this.native, {});
    drawer.enable();
    var handler = function(e) {
      _this.native.off(L.Draw.Event.CREATED, handler);
      _this._drawHandler = null;
      var latlngs = e.layer.getLatLngs()[0];
      var coords = [];
      for (var i = 0; i < latlngs.length; i++) {
        coords.push(new bemap.Coordinate(latlngs[i].lng, latlngs[i].lat));
      }
      var rectStyle = opts.style || new bemap.PolygonStyle({
        fillColor: new bemap.Color(0, 102, 204, 0.2),
        borderColor: new bemap.Color(0, 102, 204, 1),
        borderWidth: 2
      });
      var polygon = new bemap.Polygon(coords, { style: rectStyle });
      var container = _this.native.getContainer();
      if (container) container.classList.remove('bemap-drawing-active');
      if (callback) {
        callback(new bemap.MapEvent({ map: _this, bemapObject: polygon, coordinate: coords[0] }));
      }
      if (opts.addToMap !== false) _this.addPolygon(polygon);
      if (opts.editable !== false) _this.editPolygon(polygon, callback);
    };
    this.native.on(L.Draw.Event.CREATED, handler);
    this._drawHandler = { drawer: drawer, handler: handler };
    var containerR = this.native.getContainer();
    if (containerR) containerR.classList.add('bemap-drawing-active');
    return new bemap.Listener({ native: drawer, bemapObject: null, key: 'drawRectangle' });
  }

  return new bemap.Listener();
};

bemap.LeafletMap.prototype.drawCircle = function(options, callback) {
  var opts = options || {};
  var _this = this;
  this.cancelDraw();

  if (typeof L !== 'undefined' && L.Draw && L.Draw.Circle) {
    var drawer = new L.Draw.Circle(this.native, {});
    drawer.enable();
    var handler = function(e) {
      _this.native.off(L.Draw.Event.CREATED, handler);
      _this._drawHandler = null;
      var center = new bemap.Coordinate(e.layer.getLatLng().lng, e.layer.getLatLng().lat);
      var radius = e.layer.getRadius();
      var circle = new bemap.Circle(center, radius, { style: opts.style });
      var container = _this.native.getContainer();
      if (container) container.classList.remove('bemap-drawing-active');
      if (callback) callback(new bemap.MapEvent({ map: _this, bemapObject: circle, coordinate: center }));
      if (opts.addToMap !== false) _this.addCircle(circle);
    };
    this.native.on(L.Draw.Event.CREATED, handler);
    this._drawHandler = { drawer: drawer, handler: handler };
    var container = this.native.getContainer();
    if (container) container.classList.add('bemap-drawing-active');
    return new bemap.Listener({ native: drawer, bemapObject: null, key: 'drawCircle' });
  }
  return new bemap.Listener();
};

bemap.LeafletMap.prototype.drawMarker = function(options, callback) {
  var _this = this;
  this.cancelDraw();
  var clickHandler = function(e) {
    _this.native.off('click', clickHandler);
    var coord = new bemap.Coordinate(e.latlng.lng, e.latlng.lat);
    var marker = new bemap.Marker(coord, { icon: (options || {}).icon });
    if (callback) {
      callback(new bemap.MapEvent({ map: _this, bemapObject: marker, coordinate: coord }));
    }
    if ((options || {}).addToMap !== false) {
      _this.addMarker(marker);
    }
  };
  this.native.on('click', clickHandler);
  this._drawHandler = { clickHandler: clickHandler };
  return new bemap.Listener();
};

bemap.LeafletMap.prototype.cancelDraw = function() {
  if (this._drawHandler) {
    if (this._drawHandler.drawer) this._drawHandler.drawer.disable();
    if (this._drawHandler.handler) this.native.off(L.Draw.Event.CREATED, this._drawHandler.handler);
    if (this._drawHandler.clickHandler) this.native.off('click', this._drawHandler.clickHandler);
    if (this._drawHandler.dblclickHandler) this.native.off('dblclick', this._drawHandler.dblclickHandler);
    this._drawHandler = null;
  }
  // Clean up click-draw state
  if (this._clickDrawState) {
    var prevPoly = this._clickDrawState.getPreviewPolygon ? this._clickDrawState.getPreviewPolygon() : null;
    var prevLine = this._clickDrawState.getPreviewPolyline ? this._clickDrawState.getPreviewPolyline() : null;
    if (prevPoly) this.removePolygon(prevPoly);
    if (prevLine) this.removePolyline(prevLine);
    this._clickDrawState = null;
    this.native.doubleClickZoom.enable();
  }
  var container = this.native.getContainer();
  if (container) container.classList.remove('bemap-drawing-active');
  return this;
};

bemap.LeafletMap.prototype.editPolygon = function(polygon, callback) {
  if (!polygon || !polygon.native) return new bemap.Listener();
  var _this = this;
  var map = this.native;
  var MERGE_PX = 15;

  // Remove any previous vertex handles for this polygon
  if (polygon._vertexHandlesLayer) {
    map.removeLayer(polygon._vertexHandlesLayer);
  }

  var vertexHandlesLayer = L.layerGroup().addTo(map);
  polygon._vertexHandlesLayer = vertexHandlesLayer;

  var vertexIcon = L.divIcon({
    className: 'leaflet-div-icon leaflet-editing-icon',
    iconSize: [10, 10],
    iconAnchor: [5, 5]
  });

  var middleIcon = L.divIcon({
    className: 'leaflet-div-icon leaflet-editing-icon',
    iconSize: [10, 10],
    iconAnchor: [5, 5]
  });

  function syncCoords() {
    var latlngs = polygon.native.getLatLngs()[0];
    var coords = [];
    for (var i = 0; i < latlngs.length; i++) {
      coords.push(new bemap.Coordinate(latlngs[i].lng, latlngs[i].lat));
    }
    polygon.coords = coords;
  }

  function rebuildHandles() {
    vertexHandlesLayer.clearLayers();
    var latlngs = polygon.native.getLatLngs()[0];
    if (!latlngs || latlngs.length < 3) return;

    // Vertex handles
    for (var i = 0; i < latlngs.length; i++) {
      (function(idx) {
        var handle = L.marker(latlngs[idx], {
          icon: vertexIcon,
          draggable: true,
          zIndexOffset: 2000
        });

        handle.on('drag', function(ev) {
          var pos = ev.target.getLatLng();
          var pts = polygon.native.getLatLngs()[0];
          pts[idx] = pos;
          polygon.native.setLatLngs(pts);
          syncCoords();
        });

        handle.on('dragend', function(ev) {
          var pts = polygon.native.getLatLngs()[0];
          if (pts.length <= 3) { rebuildHandles(); return; }
          var dropPx = map.latLngToLayerPoint(ev.target.getLatLng());
          for (var j = 0; j < pts.length; j++) {
            if (j === idx) continue;
            var px = map.latLngToLayerPoint(pts[j]);
            if (dropPx.distanceTo(px) < MERGE_PX) {
              var next = pts.filter(function(_, k) { return k !== idx; });
              polygon.native.setLatLngs(next);
              syncCoords();
              rebuildHandles();
              if (callback) {
                callback(new bemap.MapEvent({ map: _this, bemapObject: polygon }));
              }
              return;
            }
          }
          rebuildHandles();
          if (callback) {
            callback(new bemap.MapEvent({ map: _this, bemapObject: polygon }));
          }
        });

        // Right-click to delete vertex
        handle.on('contextmenu', function(ev) {
          L.DomEvent.preventDefault(ev.originalEvent);
          L.DomEvent.stopPropagation(ev.originalEvent);
          var pts = polygon.native.getLatLngs()[0];
          if (pts.length <= 3) return;
          var next = pts.filter(function(_, k) { return k !== idx; });
          polygon.native.setLatLngs(next);
          syncCoords();
          rebuildHandles();
          if (callback) {
            callback(new bemap.MapEvent({ map: _this, bemapObject: polygon }));
          }
        });

        vertexHandlesLayer.addLayer(handle);
      })(i);
    }

    // Middle handles (click or drag to insert new vertex)
    for (var m = 0; m < latlngs.length; m++) {
      (function(idx) {
        var a = latlngs[idx];
        var b = latlngs[(idx + 1) % latlngs.length];
        var mid = L.latLng((a.lat + b.lat) / 2, (a.lng + b.lng) / 2);
        var midHandle = L.marker(mid, {
          icon: middleIcon,
          draggable: true,
          opacity: 0.5,
          zIndexOffset: 1500
        });

        midHandle.on('dragstart', function() {
          // Insert the new vertex
          var pts = polygon.native.getLatLngs()[0].slice();
          pts.splice(idx + 1, 0, midHandle.getLatLng());
          polygon.native.setLatLngs(pts);
          syncCoords();
        });

        midHandle.on('drag', function(ev) {
          var pos = ev.target.getLatLng();
          var pts = polygon.native.getLatLngs()[0];
          pts[idx + 1] = pos;
          polygon.native.setLatLngs(pts);
          syncCoords();
        });

        midHandle.on('dragend', function() {
          rebuildHandles();
          if (callback) {
            callback(new bemap.MapEvent({ map: _this, bemapObject: polygon }));
          }
        });

        vertexHandlesLayer.addLayer(midHandle);
      })(m);
    }
  }

  // Remove previous click handler if editPolygon was called before
  if (polygon._editClickHandler) {
    polygon.native.off('click', polygon._editClickHandler);
  }

  // Also allow clicking on polygon edge to insert vertex
  var editClickHandler = function(ev) {
    var pts = polygon.native.getLatLngs()[0];
    var clickPx = map.latLngToLayerPoint(ev.latlng);
    var bestIdx = 0, bestDist = Infinity;
    for (var i = 0; i < pts.length; i++) {
      var a = map.latLngToLayerPoint(pts[i]);
      var b = map.latLngToLayerPoint(pts[(i + 1) % pts.length]);
      var d = _this._distToSegmentPxLeaflet(clickPx, a, b);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    if (bestDist < 20) {
      var next = pts.slice();
      next.splice(bestIdx + 1, 0, ev.latlng);
      polygon.native.setLatLngs(next);
      syncCoords();
      rebuildHandles();
      if (callback) {
        callback(new bemap.MapEvent({ map: _this, bemapObject: polygon }));
      }
    }
  };
  polygon.native.on('click', editClickHandler);
  polygon._editClickHandler = editClickHandler;

  rebuildHandles();

  return new bemap.Listener({ native: polygon.native, bemapObject: polygon, key: 'editPolygon' });
};

bemap.LeafletMap.prototype._distToSegmentPxLeaflet = function(p, a, b) {
  var dx = b.x - a.x, dy = b.y - a.y;
  if (dx === 0 && dy === 0) return p.distanceTo(a);
  var t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
  var proj = L.point(a.x + t * dx, a.y + t * dy);
  return p.distanceTo(proj);
};

/**
 * Click-based drawing fallback (when L.Draw is not loaded).
 */
bemap.LeafletMap.prototype._clickDraw = function(type, opts, callback) {
  var _this = this;
  var coords = [];
  var previewPolyline = null;
  var previewPolygon = null;
  var defaultPolyStyle = new bemap.PolygonStyle({
    fillColor: new bemap.Color(0, 102, 204, 0.2),
    borderColor: new bemap.Color(0, 102, 204, 1),
    borderWidth: 2
  });
  var defaultLineStyle = new bemap.LineStyle({
    color: new bemap.Color(230, 57, 70, 1),
    width: 3
  });
  var style = opts.style || (type === 'Polyline' ? defaultLineStyle : defaultPolyStyle);

  this.native.doubleClickZoom.disable();

  var clickHandler = function(e) {
    coords.push(new bemap.Coordinate(e.latlng.lng, e.latlng.lat));

    // Update preview
    if (previewPolygon) { _this.removePolygon(previewPolygon); previewPolygon = null; }
    if (previewPolyline) { _this.removePolyline(previewPolyline); previewPolyline = null; }

    if (coords.length === 2) {
      previewPolyline = new bemap.Polyline(coords, { style: style });
      _this.addPolyline(previewPolyline);
    } else if (coords.length >= 3) {
      if (type === 'Polygon') {
        previewPolygon = new bemap.Polygon(coords, { style: style });
        _this.addPolygon(previewPolygon);
      } else {
        previewPolyline = new bemap.Polyline(coords, { style: style });
        _this.addPolyline(previewPolyline);
      }
    }
  };

  var dblclickHandler = function() {
    _this.native.off('click', clickHandler);
    _this.native.off('dblclick', dblclickHandler);
    _this.native.doubleClickZoom.enable();

    if (previewPolygon) { _this.removePolygon(previewPolygon); previewPolygon = null; }
    if (previewPolyline) { _this.removePolyline(previewPolyline); previewPolyline = null; }

    var container = _this.native.getContainer();
    if (container) container.classList.remove('bemap-drawing-active');

    if (coords.length >= 3 && type === 'Polygon') {
      var polygon = new bemap.Polygon(coords, { style: style });
      if (callback) callback(new bemap.MapEvent({ map: _this, bemapObject: polygon, coordinate: coords[0] }));
      if (opts.addToMap !== false) _this.addPolygon(polygon);
      if (opts.editable !== false) _this.editPolygon(polygon, callback);
    } else if (coords.length >= 2 && type === 'Polyline') {
      var polyline = new bemap.Polyline(coords, { style: style });
      if (callback) callback(new bemap.MapEvent({ map: _this, bemapObject: polyline, coordinate: coords[0] }));
      if (opts.addToMap !== false) _this.addPolyline(polyline);
    }
    _this._clickDrawState = null;
  };

  this.native.on('click', clickHandler);
  this.native.on('dblclick', dblclickHandler);
  this._drawHandler = { clickHandler: clickHandler, dblclickHandler: dblclickHandler };
  this._clickDrawState = {
    coords: coords,
    getPreviewPolygon: function() { return previewPolygon; },
    getPreviewPolyline: function() { return previewPolyline; }
  };

  var container = this.native.getContainer();
  if (container) container.classList.add('bemap-drawing-active');

  return new bemap.Listener();
};

/**
 * Helper: convert bemap.Color to hex string.
 */
bemap.LeafletMap.prototype._colorToHex = function(color) {
  if (!color) return '#000000';
  var r = color.getRed ? color.getRed() : 0;
  var g = color.getGreen ? color.getGreen() : 0;
  var b = color.getBlue ? color.getBlue() : 0;
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

/**
 * Add a marker to the layer
 * @public
 * @param {bemap.Marker} marker
 * @param {object} options
 * @return {bemap.LeafletMap} this
 */

bemap.LeafletMap.prototype.addMarker = function(marker, options) {
  if (marker !== null && bemap.inheritsof(marker, bemap.Marker)) {
    var opts = options || {};
    var l = null;

    if (opts.layer !== undefined && (bemap.inheritsof(opts.layer, bemap.VectorLayer) || bemap.inheritsof(opts.layer, bemap.ClusterLayer))) {
      l = opts.layer;
    } else {
      l = this.getLayerByName(bemap.Map.DEFAULT_LAYER.MARKER);
      if (l === null) {
        l = new bemap.VectorLayer({
          name: bemap.Map.DEFAULT_LAYER.MARKER
        });
        this.addLayer(l);
      }
    }

    var icon = marker.getIcon();
    var nativeIcon = null;

    if (icon) {
       if (!icon.native) {
         nativeIcon = L.icon({
           iconUrl: icon.getSrc(),
           iconSize: icon.scale && icon.height && icon.width ? [icon.width * icon.scale, icon.height * icon.scale] : '',
           iconAnchor: [icon.width * icon.scale * icon.getAnchorX(), icon.height * icon.scale * icon.getAnchorY()]
         });

         icon.native = nativeIcon;
       }

     } else if (bemap.inheritsof(l, bemap.ClusterLayer)) {

       icon = l.style.icon;
       if (icon && !icon.native) {
         nativeIcon = L.icon({
           iconUrl: icon.getSrc(),
           iconSize: icon.scale && icon.height && icon.width ? [icon.width * icon.scale, icon.height * icon.scale] : '',
           iconAnchor: [icon.width * icon.scale * icon.getAnchorX(), icon.height * icon.scale * icon.getAnchorY()]//piotr
         });

         icon.native = nativeIcon;

       }
     }

    // Use a default SVG icon if none provided (no PNG assets needed)
    var markerOpts = {};
    if (icon && icon.native) {
      markerOpts.icon = icon.native;
    } else {
      markerOpts.icon = L.divIcon({
        className: 'bemap-default-marker',
        html: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="36" viewBox="0 0 24 36"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z" fill="#0066cc" stroke="#fff" stroke-width="2"/><circle cx="12" cy="12" r="5" fill="#fff"/></svg>',
        iconSize: [24, 36],
        iconAnchor: [12, 36]
      });
    }
    marker.native = L.marker(marker.getCoordinate().getLatLonArray(), markerOpts);

    if (marker.map === null) {
      marker.map = this;
    }

    if (marker.layer === null) {
      marker.layer = l;
    }

    marker.native.addTo(l.native);
  }

  return this;
};

/**
 * Set the coordinates of the marker.
 * @protected
 * @param {bemap.Marker} marker the marker object to remove.
 * @return {bemap.LeafletMap} this
 */
bemap.LeafletMap.prototype.setCoordinateMarker = function(marker) {
  var c = marker.getCoordinate();
  marker.native.setLatLng(L.latLng(c.getLat(), c.getLon()));

  return this;
};

/**
 * Remove a marker from his layer.
 * @param {bemap.Marker} marker the marker object to remove.
 * @return {bemap.LeafletMap} this
 */
bemap.LeafletMap.prototype.removeMarker = function(marker) {
  if (marker !== null && bemap.inheritsof(marker, bemap.Marker) && marker.layer && marker.layer.native) {
    marker.map.native.removeLayer(marker.native);
    marker.layer = null;
    marker.map = null;
  }
  return this;
};

/**
 * Set the listner when an specified eventType occur on bemap.Marker.
 * @public
 * @param {bemap.Marker} marker
 * @param {bemap.Map.EventType} eventType Event type.
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options options.
 * @return {bemap.Listener} this.
 */
bemap.LeafletMap.prototype.onMarker = function(marker, eventType, callback, options) {
  var opts = options ? options : {};

  var nativeListener = marker.native.on(eventType, function(evt) {
    var mapEvent = new bemap.MapEvent({
      native: evt,
      bemapObject: marker,
      x: evt.containerPoint ? evt.containerPoint.x : undefined,
      y: evt.containerPoint ? evt.containerPoint.y : undefined,
      coordinate: evt.latlng ? new bemap.Coordinate(evt.latlng.lng, evt.latlng.lat) : undefined,
      properties: options,
      map: this
    });
    callback(mapEvent);
  });
  var listener = new bemap.Listener({
    native: nativeListener,
    callback: callback,
    key: eventType,
    bemapObject: marker
  });
  return listener;
};

/**
 * Define the draggable capability for bemap.Marker.
 * @protected
 * @param {bemap.Marker} marker bemap object.
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options Options.
 * @param {bemap.Layer} options.layerFilter set the bemap layer used as filter.
 * @return {bemap.Listener} bemap.listener.
 */
bemap.LeafletMap.prototype.draggableMarker = function(marker, callback, options) {
  var _this = this,
    opts = options ? options : {},
    startPixel, startCoordinate;

  marker.native.on('mousedown', function(evt) {
    _this.native.dragging.disable();
    startPixel = evt.containerPoint;

    var latlng = marker.native._latlng;
    var markerStartingLat = latlng.lat;
    var markerStartingLng = latlng.lng;

    startCoordinate = new bemap.Coordinate(markerStartingLat, markerStartingLng);

    latlng = evt.latlng;
    var mouseStartingLat = latlng.lat;
    var mouseStartingLng = latlng.lng;

    _this.native.on('mousemove', function(evt) {
      latlng = evt.latlng;
      var mouseNewLat = latlng.lat;
      var mouseNewLng = latlng.lng;

      var latDifference = mouseStartingLat - mouseNewLat;
      var lngDifference = mouseStartingLng - mouseNewLng;
      var center = [markerStartingLat - latDifference, markerStartingLng - lngDifference];
      marker.native.setLatLng(center);
    });
  });

  this.native.on('mouseup', function(evt) {
    _this.native.dragging.enable();
    _this.native.removeEventListener('mousemove');

    var mapEvent = new bemap.MapEvent({
      native: evt,
      bemapObject: marker,
      x: evt.containerPoint ? evt.containerPoint.x : undefined,
      y: evt.containerPoint ? evt.containerPoint.y : undefined,
      coordinate: evt.latlng ? new bemap.Coordinate(evt.latlng.lat, evt.latlng.lng) : undefined,
      //startX: startPixel.x,
      //startY: startPixel.y,
      //startCoordinate: startCoordinate,
      properties: options,
      map: this
    });

    callback(mapEvent);
  });

  this.events.dragFeature = new bemap.Listener({
    native: null,
    key: "dragFeature",
    bemapObject: marker
  });

  return this.events.dragFeature;
};

/**
 * Add a bemap.Polygon to the layer
 * @public
 * @param {bemap.Polygon} bemap.Polygon.
 * @param {object} options
 * @return {bemap.LeafletMap}
 */
bemap.LeafletMap.prototype.addPolygon = function(polygon, options) {
  if (polygon && bemap.inheritsof(polygon, bemap.Polygon)) {

    var style = polygon.getStyle();
    if (!style) {
      style = new bemap.PolygonStyle({
        fillColor: new bemap.Color(0, 102, 204, 0.2),
        borderColor: new bemap.Color(0, 102, 204, 1),
        borderWidth: 2
      });
    }
    var fillColor = style.getFillColor();
    var borderColor = style.getBorderColor();

    polygon.native = L.polygon(polygon.getLatLonArrays(), {
      fillColor: fillColor.getHex(),
      fillOpacity: fillColor.getAlpha(),
      color: borderColor.getHex(),
      opacity: borderColor.getAlpha(),
      weight: style.getBorderWidth(),
    });

    if (polygon.map === null) {
      polygon.map = this;
    }

    var opts = options || {};
    var l = null;

    if (opts.layer !== undefined && (bemap.inheritsof(opts.layer, bemap.VectorLayer))) {
      l = opts.layer;
    } else {
      l = this.getLayerByName(bemap.Map.DEFAULT_LAYER.POLYGON);
      if (l === null) {
        l = new bemap.VectorLayer({
          name: bemap.Map.DEFAULT_LAYER.POLYGON
        });
        this.addLayer(l);
      }
    }

    if (polygon.layer === null) {
      polygon.layer = l;
    }

    polygon.native.addTo(l.native);
  }
  return this;
};

/**
 * Remove a polygon from his layer.
 * @public
 * @param {bemap.Polygon} polygon the polygon object to remove.
 */
bemap.LeafletMap.prototype.updatePolygonCoordinates = function(polygon) {
  if (polygon && polygon.native && bemap.inheritsof(polygon, bemap.Polygon)) {
    polygon.native.setLatLngs(polygon.getLatLonArrays());
  }
  return this;
};

bemap.LeafletMap.prototype.removePolygon = function(polygon) {
  if (polygon && polygon.layer && polygon.layer.native && bemap.inheritsof(polygon, bemap.Polygon)) {
    // Clean up vertex handles if editing was enabled
    if (polygon._vertexHandlesLayer && polygon.map && polygon.map.native) {
      polygon.map.native.removeLayer(polygon._vertexHandlesLayer);
      polygon._vertexHandlesLayer = null;
    }
    polygon.map.native.removeLayer(polygon.native);
    polygon.layer = null;
    polygon.map = null;
  }
  return this;
};

/**
 * Set the listner when an specified eventType occur on bemap.Polygon.
 * @public
 * @param {bemap.Polygon} polygon
 * @param {bemap.Map.EventType} eventType Event type.
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options options.
 * @return {bemap.Listener} this.
 */
bemap.LeafletMap.prototype.onPolygon = function(polygon, eventType, callback, options) {

  var opts = options ? options : {};

  var nativeListener = polygon.native.on(eventType, function(evt) {
    var mapEvent = new bemap.MapEvent({
      native: evt,
      bemapObject: polygon,
      x: evt.containerPoint ? evt.containerPoint.x : undefined,
      y: evt.containerPoint ? evt.containerPoint.y : undefined,
      coordinate: evt.latlng ? new bemap.Coordinate(evt.latlng.lng, evt.latlng.lat) : undefined,
      properties: options,
      map: this
    });
    callback(mapEvent);
  });
  var listener = new bemap.Listener({
    native: nativeListener,
    callback: callback,
    key: eventType,
    bemapObject: polygon
  });

  return listener;
};

/**
 * Define the draggable capability for bemap.Polygon (Leaflet).
 * @param {bemap.Polygon} polygon
 * @param {function} callback
 * @param {object} options
 * @return {bemap.Listener}
 */
bemap.LeafletMap.prototype.draggablePolygon = function(polygon, callback, options) {
  var _this = this;

  polygon.native.on('mousedown', function(evt) {
    L.DomEvent.stopPropagation(evt);
    _this.native.dragging.disable();
    var mouseStartLat = evt.latlng.lat;
    var mouseStartLng = evt.latlng.lng;

    var onMove = function(e) {
      var dLat = e.latlng.lat - mouseStartLat;
      var dLng = e.latlng.lng - mouseStartLng;
      mouseStartLat = e.latlng.lat;
      mouseStartLng = e.latlng.lng;

      var rings = polygon.native.getLatLngs();
      var newRings = [];
      for (var r = 0; r < rings.length; r++) {
        var ring = rings[r];
        var newRing = [];
        for (var i = 0; i < ring.length; i++) {
          newRing.push(L.latLng(ring[i].lat + dLat, ring[i].lng + dLng));
        }
        newRings.push(newRing);
      }
      polygon.native.setLatLngs(newRings);

      var coords = polygon.getCoordinates();
      for (var j = 0; j < coords.length; j++) {
        coords[j].setLon(coords[j].getLon() + dLng).setLat(coords[j].getLat() + dLat);
      }
    };

    _this.native.on('mousemove', onMove);
    _this.native.once('mouseup', function(e) {
      _this.native.off('mousemove', onMove);
      _this.native.dragging.enable();
      if (callback) {
        callback(new bemap.MapEvent({
          native: e, bemapObject: polygon,
          coordinate: e.latlng ? new bemap.Coordinate(e.latlng.lng, e.latlng.lat) : undefined,
          map: _this
        }));
      }
    });
  });

  return new bemap.Listener({ native: polygon.native, bemapObject: polygon, key: 'dragFeature' });
};

/**
 * Add a bemap.Polyline to the layer
 * @public
 * @param {bemap.Polyline} bemap.Polyline.
 * @param {object} options
 * @return {bemap.LeafletMap}
 */
bemap.LeafletMap.prototype.addPolyline = function(polyline, options) {
  if (polyline !== null && bemap.inheritsof(polyline, bemap.Polyline)) {
    var style = polyline.getStyle();
    if (!style) {
      style = new bemap.LineStyle({ color: new bemap.Color(0, 0, 0, 1), width: 2 });
    }
    var color = style.getColor();

    polyline.native = L.polyline(polyline.getLatLonArrays(), {
      color: color.getHex(),
      opacity: color.getAlpha(),
      weight: style.getWidth(),
      bubblingMouseEvents: false,
      dashArray: style.type === "dash" ? "10":""
    });

    if (polyline.map === null) {
      polyline.map = this;
    }

    var opts = options || {};
    var l = null;

    if (opts.layer !== undefined && (bemap.inheritsof(opts.layer, bemap.VectorLayer))) {
      l = opts.layer;
    } else {
      l = this.getLayerByName(bemap.Map.DEFAULT_LAYER.POLYLINE);
      if (l === null) {
        l = new bemap.VectorLayer({
          name: bemap.Map.DEFAULT_LAYER.POLYLINE
        });
        this.addLayer(l);
      }
    }

    if (polyline.layer === null) {
      polyline.layer = l;
    }
    polyline.native.addTo(l.native);
  }

  return this;
};

/**
 * Remove a polyline from his layer.
 * @public
 * @param {bemap.Polyline} polyline the polyline object to remove.
 */
bemap.LeafletMap.prototype.removePolyline = function(polyline) {
  if (polyline !== null && polyline.layer !== null && polyline.layer.native !== null && bemap.inheritsof(polyline, bemap.Polyline)) {
    polyline.map.native.removeLayer(polyline.native);
    polyline.layer = null;
    polyline.map = null;
  }
  return this;
};

/**
 * Set the listner when an specified eventType occur on bemap.Polyline.
 * @public
 * @param {bemap.Polyline} polyline
 * @param {bemap.Map.EventType} eventType Event type.
 * @param {function} callback Function will be called when the specified eventType is occur.
 * @param {object} options options.
 * @return {bemap.Listener} this.
 */
bemap.LeafletMap.prototype.onPolyline = function(polyline, eventType, callback, options) {
  var opts = options ? options : {};

  var nativeListener = polyline.native.on(eventType, function(evt) {
    var mapEvent = new bemap.MapEvent({
      native: evt,
      bemapObject: polyline,
      x: evt.containerPoint ? evt.containerPoint.x : undefined,
      y: evt.containerPoint ? evt.containerPoint.y : undefined,
      coordinate: evt.latlng ? new bemap.Coordinate(evt.latlng.lng, evt.latlng.lat) : undefined,
      properties: options,
      map: this
    });
    callback(mapEvent);
  });
  var listener = new bemap.Listener({
    native: nativeListener,
    callback: callback,
    key: eventType,
    bemapObject: polyline
  });

  return listener;
};

/**
 * Define the draggable capability for bemap.Polyline (Leaflet).
 * @param {bemap.Polyline} polyline
 * @param {function} callback
 * @param {object} options
 * @return {bemap.Listener}
 */
bemap.LeafletMap.prototype.draggablePolyline = function(polyline, callback, options) {
  var _this = this;

  polyline.native.on('mousedown', function(evt) {
    L.DomEvent.stopPropagation(evt);
    _this.native.dragging.disable();
    var mouseStartLat = evt.latlng.lat;
    var mouseStartLng = evt.latlng.lng;

    var onMove = function(e) {
      var dLat = e.latlng.lat - mouseStartLat;
      var dLng = e.latlng.lng - mouseStartLng;
      mouseStartLat = e.latlng.lat;
      mouseStartLng = e.latlng.lng;

      var latlngs = polyline.native.getLatLngs();
      var newLatLngs = [];
      for (var i = 0; i < latlngs.length; i++) {
        newLatLngs.push(L.latLng(latlngs[i].lat + dLat, latlngs[i].lng + dLng));
      }
      polyline.native.setLatLngs(newLatLngs);

      var coords = polyline.getCoordinates();
      for (var j = 0; j < coords.length; j++) {
        coords[j].setLon(coords[j].getLon() + dLng).setLat(coords[j].getLat() + dLat);
      }
    };

    _this.native.on('mousemove', onMove);
    _this.native.once('mouseup', function(e) {
      _this.native.off('mousemove', onMove);
      _this.native.dragging.enable();
      if (callback) {
        callback(new bemap.MapEvent({
          native: e, bemapObject: polyline,
          coordinate: e.latlng ? new bemap.Coordinate(e.latlng.lng, e.latlng.lat) : undefined,
          map: _this
        }));
      }
    });
  });

  return new bemap.Listener({ native: polyline.native, bemapObject: polyline, key: 'dragFeature' });
};

/**
 * Add a popup to the map
 * @public
 * @param {bemap.Popup} popup
 * @param {object} options
 * @return {bemap.LeafletMap} this
 */
 bemap.LeafletMap.prototype.addPopup = function(popup, options) {
   if (popup !== null && bemap.inheritsof(popup, bemap.Popup)) {
     popup.native = L.popup({
       autoPan: true
     });

     if (popup.map === null) {
       popup.map = this;
     }
     popup.native.setLatLng(popup.getCoordinate().getLatLonArray());
     popup.native.setContent(popup.getInformation());
     if (!this.native.popups) {
       this.native.popups = [];
     }
     this.native.popups.push(popup.native);
     popup.native.addTo(this.native);
   }
   return this;
 };

/**
 * Remove a popup from the map.
 * @public
 * @param {bemap.Popup} popup the popup to remove from the map.
 * @return {bemap.LeafletMap} this;
 */
bemap.LeafletMap.prototype.removePopup = function(popup) {
  if (popup !== null && bemap.inheritsof(popup, bemap.Popup)) {
    this.native.removeLayer(popup.native);
    popup.map = null;
  }
  return this;
};

/**
* Remove all the popups from the map.
* @return {bemap.LeafletMap} this;
 */
bemap.LeafletMap.prototype.clearPopup = function() {
var that = this.native;
if (this.native.popups && this.native.popups.length !== 0) {
  this.native.popups.forEach(function(popup, index, object) {
    that.removeLayer(popup);
    object.splice(index, 1);
  });
  return that;
}
//alternative way to close all popups
 /*if ($(".leaflet-popup-close-button")[0]) {
    $(".leaflet-popup-close-button")[0].click();
  }*/
};

/**
 * Set the coordinate of the popup.
 * @param {bemap.Popup} popup the popup of wich to set the coordinate.
 * @param {bemap.Coordinate} coordinate the new coordinate.
 * @param {object} options Options.
 * @param {bemap.Layer} options.panningMap enable the map panning animation. move map from the current position to the popup anchor at the center of map.
 * @return {bemap.OlMap} this.
 */
bemap.LeafletMap.prototype.setCoordinatePopup = function(popup, coordinate, options) {
  if (popup !== null && bemap.inheritsof(popup, bemap.Popup)) {
    popup.coordinate = coordinate;
    if (popup.native !== null) {
      popup.native.setLatLng(popup.getCoordinate().getLatLonArray());
    }
  }
  return this;
};

/**
 * BeNomad BeMap JavaScript API - MapLibre v5 - 3D Buildings
 *
 * Usage:
 *   map.add3DBuildings({
 *     sourceId: 'openmaptiles',
 *     sourceLayer: 'building',
 *     heightProperty: 'render_height',
 *     color: '#ddd',
 *     opacity: 0.8,
 *     minZoom: 14
 *   });
 */

bemap.MapLibreMap.prototype.add3DBuildings = function(options) {
  var opts = options || {};
  var _this = this;

  this._buildingsLayerId = this._uniqueId('buildings-3d');

  var config = {
    id: this._buildingsLayerId,
    type: 'fill-extrusion',
    paint: {
      'fill-extrusion-color': opts.color || '#aaa',
      'fill-extrusion-height': ['get', opts.heightProperty || 'height'],
      'fill-extrusion-base': ['get', opts.baseHeightProperty || 'min_height'],
      'fill-extrusion-opacity': opts.opacity !== undefined ? opts.opacity : 0.6
    }
  };

  if (opts.minZoom) config.minzoom = opts.minZoom;
  if (opts.sourceId) config.source = opts.sourceId;
  if (opts.sourceLayer) config['source-layer'] = opts.sourceLayer;

  // If GeoJSON data is provided directly
  if (opts.data) {
    var sourceId = this._uniqueId('buildings-src');
    var addBuildings = function() {
      if (!_this.native.getSource(sourceId)) {
        _this.native.addSource(sourceId, { type: 'geojson', data: opts.data });
        config.source = sourceId;
        _this.native.addLayer(config);
      }
    };
    if (this.native.isStyleLoaded()) { addBuildings(); } else { this.native.on('load', addBuildings); }
  } else {
    // Use existing source (e.g., from vector tiles in the style)
    var addFromSource = function() {
      if (config.source && !_this.native.getLayer(_this._buildingsLayerId)) {
        _this.native.addLayer(config);
      }
    };
    if (this.native.isStyleLoaded()) { addFromSource(); } else { this.native.on('load', addFromSource); }
  }

  return this;
};

bemap.MapLibreMap.prototype.remove3DBuildings = function() {
  if (this._buildingsLayerId) {
    try {
      if (this.native.getLayer(this._buildingsLayerId)) {
        this.native.removeLayer(this._buildingsLayerId);
      }
    } catch(e) {}
    this._buildingsLayerId = null;
  }
  return this;
};

/**
 * BeNomad BeMap JavaScript API - MapLibre v5 - Animation
 *
 * Usage:
 *   // First add a GeoJSON source for the animated point
 *   map.addGeoJsonSource('moving-point', {
 *     type: 'Feature',
 *     geometry: { type: 'Point', coordinates: [0, 0] }
 *   });
 *
 *   // Then animate along a route
 *   var controller = map.animateAlongRoute({
 *     sourceId: 'moving-point',
 *     coordinates: [[2.35, 48.85], [7.26, 43.71], [5.37, 43.29]],
 *     speed: 0.005,
 *     loop: true,
 *     onUpdate: function(pos) { console.log(pos.lon, pos.lat); },
 *     onComplete: function() { console.log('Done!'); }
 *   });
 *
 *   // Control the animation
 *   controller.stop();
 *   controller.resume();
 */

bemap.MapLibreMap.prototype.animateAlongRoute = function(options) {
  var opts = options || {};
  var route = opts.coordinates || [];
  var speed = opts.speed || 0.005;
  var loop = opts.loop !== false;
  var sourceId = opts.sourceId;
  var onUpdate = opts.onUpdate;
  var onComplete = opts.onComplete;
  var _this = this;

  if (!route.length || !sourceId) {
    return { stop: function(){}, resume: function(){} };
  }

  var currentPosition = 0;
  var animating = true;
  var animFrameId = null;

  // Compute total route length for smooth interpolation
  var totalSegments = route.length - 1;

  function animate() {
    if (!animating) return;

    currentPosition += speed;

    if (currentPosition >= totalSegments) {
      if (loop) {
        currentPosition = 0;
      } else {
        animating = false;
        if (onComplete) onComplete();
        return;
      }
    }

    var index = Math.floor(currentPosition);
    var next = Math.min(index + 1, route.length - 1);
    var t = currentPosition - index;

    // Interpolate position
    var lon = route[index][0] + (route[next][0] - route[index][0]) * t;
    var lat = route[index][1] + (route[next][1] - route[index][1]) * t;

    // Update the GeoJSON source
    var src = _this.native.getSource(sourceId);
    if (src) {
      src.setData({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lon, lat] },
        properties: { bearing: Math.atan2(route[next][0] - route[index][0], route[next][1] - route[index][1]) * 180 / Math.PI }
      });
    }

    if (onUpdate) onUpdate({ lon: lon, lat: lat, progress: currentPosition / totalSegments });

    animFrameId = requestAnimationFrame(animate);
  }

  animFrameId = requestAnimationFrame(animate);

  return {
    stop: function() {
      animating = false;
      if (animFrameId) cancelAnimationFrame(animFrameId);
    },
    resume: function() {
      if (!animating) {
        animating = true;
        animFrameId = requestAnimationFrame(animate);
      }
    },
    reset: function() {
      currentPosition = 0;
    }
  };
};

/**
 * Animate drawing a line progressively. MapLibre only.
 * @param {object} options
 * @param {string} options.sourceId GeoJSON source ID (must exist).
 * @param {Array} options.coordinates Array of [lon, lat] for the full line.
 * @param {number} options.speed Points per frame (default: 1).
 * @return {object} Controller { stop, resume, reset }
 */
bemap.MapLibreMap.prototype.animateLine = function(options) {
  var opts = options || {};
  var route = opts.coordinates || [];
  var speed = opts.speed || 1;
  var sourceId = opts.sourceId;
  var onUpdate = opts.onUpdate;
  var onComplete = opts.onComplete;
  var _this = this;

  if (!route.length || !sourceId) return { stop: function(){}, resume: function(){} };

  var currentIndex = 0;
  var animating = true;
  var animFrameId = null;

  function animate() {
    if (!animating) return;
    currentIndex = Math.min(currentIndex + speed, route.length);

    var src = _this.native.getSource(sourceId);
    if (src) {
      src.setData({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: route.slice(0, Math.ceil(currentIndex)) }
      });
    }

    if (onUpdate) onUpdate({ index: Math.ceil(currentIndex), total: route.length, progress: currentIndex / route.length });

    if (currentIndex >= route.length) {
      animating = false;
      if (onComplete) onComplete();
      return;
    }
    animFrameId = requestAnimationFrame(animate);
  }

  animFrameId = requestAnimationFrame(animate);
  return {
    stop: function() { animating = false; if (animFrameId) cancelAnimationFrame(animFrameId); },
    resume: function() { if (!animating) { animating = true; animFrameId = requestAnimationFrame(animate); } },
    reset: function() { currentIndex = 0; }
  };
};

/**
 * Animate camera rotation around a point. MapLibre only.
 * @param {object} options
 * @param {Array} options.center [lon, lat] rotation center.
 * @param {number} options.zoom Zoom level (default: current).
 * @param {number} options.pitch Pitch angle (default: 60).
 * @param {number} options.speed Degrees per frame (default: 0.3).
 * @return {object} Controller { stop, resume }
 */
bemap.MapLibreMap.prototype.animateCameraOrbit = function(options) {
  var opts = options || {};
  var center = opts.center || [0, 0];
  var zoomLevel = opts.zoom || this.native.getZoom();
  var pitch = opts.pitch !== undefined ? opts.pitch : 60;
  var speed = opts.speed || 0.3;
  var _this = this;

  var bearing = this.native.getBearing();
  var animating = true;
  var animFrameId = null;

  function orbit() {
    if (!animating) return;
    bearing += speed;
    if (bearing > 360) bearing -= 360;

    _this.native.jumpTo({ center: center, zoom: zoomLevel, pitch: pitch, bearing: bearing });
    animFrameId = requestAnimationFrame(orbit);
  }

  animFrameId = requestAnimationFrame(orbit);
  return {
    stop: function() { animating = false; if (animFrameId) cancelAnimationFrame(animFrameId); },
    resume: function() { if (!animating) { animating = true; animFrameId = requestAnimationFrame(orbit); } }
  };
};

/**
 * Animate pulsing circle effect. MapLibre only.
 * Creates a pulsing circle at a coordinate using paint property animation.
 * @param {object} options
 * @param {Array} options.center [lon, lat].
 * @param {string} options.color Circle color (default: '#e74c3c').
 * @param {number} options.maxRadius Max radius in pixels (default: 30).
 * @param {number} options.speed Pulse speed (default: 0.05).
 * @return {object} Controller { stop, remove }
 */
bemap.MapLibreMap.prototype.animatePulse = function(options) {
  var opts = options || {};
  var center = opts.center || [0, 0];
  var color = opts.color || '#e74c3c';
  var maxRadius = opts.maxRadius || 30;
  var speed = opts.speed || 0.05;
  var _this = this;

  var sourceId = this._uniqueId('pulse-src');
  var layerId = this._uniqueId('pulse-layer');
  var phase = 0;
  var animating = true;
  var animFrameId = null;

  // Add source + layer
  var addPulse = function() {
    if (!_this.native.getSource(sourceId)) {
      _this.native.addSource(sourceId, {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'Point', coordinates: center } }
      });
      _this.native.addLayer({
        id: layerId, type: 'circle', source: sourceId,
        paint: { 'circle-radius': 10, 'circle-color': color, 'circle-opacity': 0.8, 'circle-stroke-width': 2, 'circle-stroke-color': color }
      });
    }
  };
  if (this.native.isStyleLoaded()) { addPulse(); } else { this.native.once('load', addPulse); }

  function pulse() {
    if (!animating) return;
    phase += speed;
    var t = (Math.sin(phase) + 1) / 2; // 0 to 1
    var radius = 5 + t * maxRadius;
    var opacity = 1 - t * 0.7;

    try {
      _this.native.setPaintProperty(layerId, 'circle-radius', radius);
      _this.native.setPaintProperty(layerId, 'circle-opacity', opacity);
    } catch(e) {}

    animFrameId = requestAnimationFrame(pulse);
  }

  animFrameId = requestAnimationFrame(pulse);

  return {
    stop: function() { animating = false; if (animFrameId) cancelAnimationFrame(animFrameId); },
    remove: function() {
      animating = false;
      if (animFrameId) cancelAnimationFrame(animFrameId);
      try {
        if (_this.native.getLayer(layerId)) _this.native.removeLayer(layerId);
        if (_this.native.getSource(sourceId)) _this.native.removeSource(sourceId);
      } catch(e) {}
    }
  };
};

/**
 * Spin the globe continuously. MapLibre only.
 * @param {object} options
 * @param {number} options.speed Degrees per frame (default: 0.3).
 * @return {object} Controller { stop, resume }
 */
bemap.MapLibreMap.prototype.spinGlobe = function(options) {
  var opts = options || {};
  var speed = opts.speed || 0.3;
  var _this = this;
  var animating = true;
  var animFrameId = null;

  function spin() {
    if (!animating) return;
    var center = _this.native.getCenter();
    _this.native.jumpTo({ center: [center.lng + speed, center.lat] });
    animFrameId = requestAnimationFrame(spin);
  }

  animFrameId = requestAnimationFrame(spin);
  return {
    stop: function() { animating = false; if (animFrameId) cancelAnimationFrame(animFrameId); },
    resume: function() { if (!animating) { animating = true; animFrameId = requestAnimationFrame(spin); } }
  };
};

/**
 * BeNomad BeMap JavaScript API - MapLibre v5 - Circle
 */

// Helper: generate polygon points for a circle (latitude-compensated)
bemap.MapLibreMap.prototype._generateCirclePolygon = function(lon, lat, radiusMeters, nPoints) {
  var points = [];
  var n = nPoints || 64;
  var latRad = lat * Math.PI / 180;
  for (var i = 0; i < n; i++) {
    var angle = (i / n) * 2 * Math.PI;
    var dx = (radiusMeters / 111320 / Math.cos(latRad)) * Math.cos(angle);
    var dy = (radiusMeters / 110540) * Math.sin(angle);
    points.push([lon + dx, lat + dy]);
  }
  points.push(points[0]);
  return points;
};

bemap.MapLibreMap.prototype.addCircle = function(circle, options) {
  if (!circle || !bemap.inheritsof(circle, bemap.Circle)) return this;

  var opts = options || {};
  this._addOwnToProperties(circle);

  var id = circle._bemapId;
  circle._maplibreSourceId = id + '-src';
  circle._maplibreFillLayerId = id + '-fill';
  circle._maplibreLineLayerId = id + '-line';

  var coord = circle.getCoordinate();
  var points = this._generateCirclePolygon(coord.getLon(), coord.getLat(), circle.getRadius());

  var fillColor = 'rgba(0,0,0,0.3)', borderColor = 'rgba(0,0,0,1)', borderWidth = 2;
  if (circle.style) {
    if (circle.style.fillColor) fillColor = this._colorToRgba(circle.style.fillColor);
    if (circle.style.borderColor) borderColor = this._colorToRgba(circle.style.borderColor);
    if (circle.style.borderWidth) borderWidth = circle.style.borderWidth;
  }

  var geojson = {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [points] },
    properties: { _bemapId: circle._bemapId }
  };

  var _this = this;
  this._geoJsonData[circle._maplibreSourceId] = geojson;
  var addToMap = function() {
    if (!_this.native.getSource(circle._maplibreSourceId)) {
      _this.native.addSource(circle._maplibreSourceId, { type: 'geojson', data: geojson });
      _this.native.addLayer({
        id: circle._maplibreFillLayerId, type: 'fill', source: circle._maplibreSourceId,
        paint: { 'fill-color': fillColor, 'fill-opacity': 0.4 }
      });
      _this.native.addLayer({
        id: circle._maplibreLineLayerId, type: 'line', source: circle._maplibreSourceId,
        paint: { 'line-color': borderColor, 'line-width': borderWidth }
      });
      _this._geoJsonLayerIds.push(circle._maplibreFillLayerId);
      _this._geoJsonLayerIds.push(circle._maplibreLineLayerId);
    }
  };

  if (this.native.isStyleLoaded()) { addToMap(); } else { this.native.on('load', addToMap); }

  circle.native = { sourceId: circle._maplibreSourceId };
  if (circle.map === null) circle.map = this;

  var l = opts.layer && bemap.inheritsof(opts.layer, bemap.Layer) ? opts.layer : this.getLayerByName(bemap.Map.DEFAULT_LAYER.CIRCLE);
  if (circle.layer === null) circle.layer = l;
  if (l && l.native && l.native.geoJsonIds) {
    l.native.geoJsonIds.push(circle._maplibreFillLayerId);
    l.native.geoJsonIds.push(circle._maplibreLineLayerId);
  }
  if (l && l.native && l.native.features) l.native.features.push(circle);

  return this;
};

bemap.MapLibreMap.prototype.removeCircle = function(circle) {
  if (circle && circle.native) {
    try {
      if (this.native.getLayer(circle._maplibreFillLayerId)) this.native.removeLayer(circle._maplibreFillLayerId);
      if (this.native.getLayer(circle._maplibreLineLayerId)) this.native.removeLayer(circle._maplibreLineLayerId);
      if (this.native.getSource(circle._maplibreSourceId)) this.native.removeSource(circle._maplibreSourceId);
      var idx1 = this._geoJsonLayerIds.indexOf(circle._maplibreFillLayerId);
      if (idx1 > -1) this._geoJsonLayerIds.splice(idx1, 1);
      var idx2 = this._geoJsonLayerIds.indexOf(circle._maplibreLineLayerId);
      if (idx2 > -1) this._geoJsonLayerIds.splice(idx2, 1);
    } catch(e) {}
    if (circle._bemapId) delete this._featureRegistry[circle._bemapId];
    if (circle._maplibreSourceId) delete this._geoJsonData[circle._maplibreSourceId];
    circle.map = null;
    circle.layer = null;
  }
  return this;
};

bemap.MapLibreMap.prototype.setCoordinateCircle = function(circle) {
  if (circle && circle.native && circle._maplibreSourceId) {
    var coord = circle.getCenter();
    var points = this._generateCirclePolygon(coord.getLon(), coord.getLat(), circle.getRadius());
    var src = this.native.getSource(circle._maplibreSourceId);
    if (src) {
      src.setData({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [points] }, properties: { _bemapId: circle._bemapId } });
    }
  }
  return this;
};

bemap.MapLibreMap.prototype.setRadiusCircle = function(circle) {
  return this.setCoordinateCircle(circle);
};

bemap.MapLibreMap.prototype.updateCircleCenter = function(circle) {};

bemap.MapLibreMap.prototype.onCircle = function(circle, eventType, callback, options) {
  return this._onFeature(circle, eventType, callback, options, { singleFeature: true });
};

bemap.MapLibreMap.prototype.draggableCircle = function(circle, callback, options) {
  return this._draggableFeature(circle, callback, options, { singleFeature: true });
};

bemap.MapLibreMap.prototype.draggableCircles = function(callback, options) {
  return this._draggableFeature(null, callback, options, { circles: true });
};

/**
 * BeNomad BeMap JavaScript API - MapLibre v5 - Clustering
 *
 * Enhances ClusterLayer support for MapLibre with native GeoJSON clustering.
 *
 * Usage:
 *   var points = [
 *     new bemap.Coordinate(2.35, 48.85),
 *     new bemap.Coordinate(7.26, 43.71),
 *     // ... hundreds/thousands of points
 *   ];
 *
 *   var clusterLayer = new bemap.ClusterLayer({
 *     name: 'stations',
 *     distance: 50,  // cluster radius in pixels
 *     style: new bemap.clusterStyle({
 *       color: new bemap.Color(0, 150, 255, 1),
 *       borderColor: new bemap.Color(255, 255, 255, 1),
 *       textColor: new bemap.Color(255, 255, 255, 1),
 *       icon: new bemap.Icon({ src: 'marker.svg' })
 *     })
 *   });
 *   map.addLayer(clusterLayer);
 *   map.addClusterPoints(clusterLayer, points, { properties: [...] });
 */

bemap.MapLibreMap.prototype.addClusterPoints = function(clusterLayer, points, options) {
  if (!clusterLayer || !bemap.inheritsof(clusterLayer, bemap.ClusterLayer)) return this;

  var opts = options || {};
  var _this = this;
  var sourceId = clusterLayer._sourceId || clusterLayer._maplibreId + '-cluster-src';
  clusterLayer._clusterSourceId = sourceId;
  clusterLayer._clusterLayerIds = [];

  // Build GeoJSON features from coordinates
  var features = [];
  for (var i = 0; i < points.length; i++) {
    var pt = points[i];
    var lon = pt.getLon ? pt.getLon() : pt.lon;
    var lat = pt.getLat ? pt.getLat() : pt.lat;
    var props = (opts.properties && opts.properties[i]) ? opts.properties[i] : {};
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lon, lat] },
      properties: props
    });
  }

  var cs = clusterLayer.style;
  var clusterColor = cs && cs.color ? this._colorToRgba(cs.color) : '#51bbd6';
  var borderColor = cs && cs.borderColor ? this._colorToRgba(cs.borderColor) : '#fff';
  var textColor = cs && cs.textColor ? this._colorToRgba(cs.textColor) : '#fff';
  var clusterSize = cs && cs.size ? cs.size : 20;

  var clustersId = sourceId + '-clusters';
  var countId = sourceId + '-count';
  var pointsId = sourceId + '-points';

  var addToMap = function() {
    if (_this.native.getSource(sourceId)) return;

    _this.native.addSource(sourceId, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: features },
      cluster: true,
      clusterRadius: clusterLayer.distance || 50,
      clusterMaxZoom: 14
    });

    // Cluster circles
    _this.native.addLayer({
      id: clustersId,
      type: 'circle',
      source: sourceId,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': clusterColor,
        'circle-radius': ['step', ['get', 'point_count'], clusterSize, 100, clusterSize * 1.5, 750, clusterSize * 2],
        'circle-stroke-width': cs && cs.borderSize ? cs.borderSize : 2,
        'circle-stroke-color': borderColor
      }
    });

    // Cluster count labels
    _this.native.addLayer({
      id: countId,
      type: 'symbol',
      source: sourceId,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-size': cs && cs.textSize ? cs.textSize * 6 : 12
      },
      paint: {
        'text-color': textColor
      }
    });

    // Unclustered individual points
    _this.native.addLayer({
      id: pointsId,
      type: 'circle',
      source: sourceId,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': clusterColor,
        'circle-radius': 6,
        'circle-stroke-width': 1,
        'circle-stroke-color': borderColor
      }
    });

    // Click on cluster → zoom in
    _this.native.on('click', clustersId, function(e) {
      var feat = _this.native.queryRenderedFeatures(e.point, { layers: [clustersId] });
      if (!feat.length) return;
      var clusterId = feat[0].properties.cluster_id;
      _this.native.getSource(sourceId).getClusterExpansionZoom(clusterId).then(function(zoom) {
        _this.native.easeTo({ center: feat[0].geometry.coordinates, zoom: zoom });
      });
    });

    // Cursor pointer on clusters
    _this.native.on('mouseenter', clustersId, function() { _this.native.getCanvas().style.cursor = 'pointer'; });
    _this.native.on('mouseleave', clustersId, function() { _this.native.getCanvas().style.cursor = ''; });

    clusterLayer._clusterLayerIds = [clustersId, countId, pointsId];
  };

  if (this.native.isStyleLoaded()) { addToMap(); } else { this.native.on('load', addToMap); }

  return this;
};

/**
 * BeNomad BeMap JavaScript API - MapLibre v5 - Draw Interaction
 * Manual implementation using GeoJSON sources + mouse events.
 */

bemap.MapLibreMap.prototype.drawPolygon = function(options, callback) {
  return this._startDraw('Polygon', options, callback);
};

bemap.MapLibreMap.prototype.drawPolyline = function(options, callback) {
  return this._startDraw('Polyline', options, callback);
};

bemap.MapLibreMap.prototype.drawRectangle = function(options, callback) {
  return this._startDraw('Rectangle', options, callback);
};

bemap.MapLibreMap.prototype.drawCircle = function(options, callback) {
  return this._startDraw('Circle', options, callback);
};

bemap.MapLibreMap.prototype.drawMarker = function(options, callback) {
  var _this = this;
  this.cancelDraw();

  var clickHandler = function(e) {
    _this.native.off('click', clickHandler);
    var container = _this.native.getContainer();
    if (container) container.classList.remove('bemap-drawing-active');

    var coord = new bemap.Coordinate(e.lngLat.lng, e.lngLat.lat);
    var marker = new bemap.Marker(coord, { icon: (options || {}).icon });
    if (callback) {
      callback(new bemap.MapEvent({ map: _this, bemapObject: marker, coordinate: coord }));
    }
    if ((options || {}).addToMap !== false) {
      _this.addMarker(marker);
    }
  };

  this.native.on('click', clickHandler);
  this._drawState = { clickHandler: clickHandler };

  var container = this.native.getContainer();
  if (container) container.classList.add('bemap-drawing-active');

  return new bemap.Listener();
};

bemap.MapLibreMap.prototype._startDraw = function(type, options, callback) {
  var opts = options || {};
  var _this = this;
  this.cancelDraw();

  var coords = [];
  var sourceId = '_bemap-draw-src';
  var lineLayerId = '_bemap-draw-line';
  var fillLayerId = '_bemap-draw-fill';
  var vertexLayerId = '_bemap-draw-vertices';
  var rubberLineId = '_bemap-draw-rubber';

  var lineColor = 'rgba(0,102,204,1)';
  var fillColor = 'rgba(0,102,204,0.2)';
  var lineWidth = 2;

  if (opts.style) {
    if (opts.style.borderColor) lineColor = this._colorToRgba(opts.style.borderColor);
    if (opts.style.fillColor) fillColor = this._colorToRgba(opts.style.fillColor);
    if (opts.style.borderWidth) lineWidth = opts.style.borderWidth;
  }

  // Disable double-click zoom during drawing
  this.native.doubleClickZoom.disable();

  // Create GeoJSON source for preview
  var emptyGeoJson = { type: 'FeatureCollection', features: [] };
  this.native.addSource(sourceId, { type: 'geojson', data: emptyGeoJson });

  // Fill layer (for polygon)
  if (type === 'Polygon') {
    this.native.addLayer({
      id: fillLayerId, type: 'fill', source: sourceId,
      filter: ['==', '$type', 'Polygon'],
      paint: { 'fill-color': fillColor, 'fill-opacity': 1 }
    });
  }

  // Line layer
  this.native.addLayer({
    id: lineLayerId, type: 'line', source: sourceId,
    filter: ['==', '$type', type === 'Polygon' ? 'Polygon' : 'LineString'],
    paint: { 'line-color': lineColor, 'line-width': lineWidth },
    layout: { 'line-cap': 'round', 'line-join': 'round' }
  });

  // Vertex dots layer
  this.native.addSource(vertexLayerId + '-src', { type: 'geojson', data: emptyGeoJson });
  this.native.addLayer({
    id: vertexLayerId, type: 'circle', source: vertexLayerId + '-src',
    paint: { 'circle-radius': 5, 'circle-color': lineColor, 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 }
  });

  // Rubber-band line (cursor to last point)
  this.native.addSource(rubberLineId + '-src', { type: 'geojson', data: emptyGeoJson });
  this.native.addLayer({
    id: rubberLineId, type: 'line', source: rubberLineId + '-src',
    paint: { 'line-color': lineColor, 'line-width': 1, 'line-dasharray': [4, 4] }
  });

  var updatePreview = function() {
    var lngLats = coords.map(function(c) { return [c.getLon(), c.getLat()]; });

    // Vertex dots
    var vertexFeatures = lngLats.map(function(ll) {
      return { type: 'Feature', geometry: { type: 'Point', coordinates: ll } };
    });
    _this.native.getSource(vertexLayerId + '-src').setData({ type: 'FeatureCollection', features: vertexFeatures });

    // Main shape
    var data;
    if (type === 'Rectangle' && lngLats.length >= 2) {
      // Show rectangle preview from 2 diagonal corners
      var c0 = lngLats[0], c1 = lngLats[lngLats.length - 1];
      var rectRing = [c0, [c1[0], c0[1]], c1, [c0[0], c1[1]], c0];
      data = { type: 'Feature', geometry: { type: 'Polygon', coordinates: [rectRing] } };
    } else if (type === 'Polygon' && lngLats.length >= 3) {
      var ring = lngLats.concat([lngLats[0]]); // close the ring
      data = { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] } };
    } else if (lngLats.length >= 2) {
      data = { type: 'Feature', geometry: { type: 'LineString', coordinates: lngLats } };
    } else {
      data = emptyGeoJson;
    }
    _this.native.getSource(sourceId).setData(data.type === 'FeatureCollection' ? data : { type: 'FeatureCollection', features: [data] });
  };

  // Mouse move → rubber-band line from last vertex to cursor
  var mouseMoveHandler = function(e) {
    if (coords.length === 0) return;
    var last = [coords[coords.length - 1].getLon(), coords[coords.length - 1].getLat()];
    var cursor = [e.lngLat.lng, e.lngLat.lat];
    _this.native.getSource(rubberLineId + '-src').setData({
      type: 'Feature', geometry: { type: 'LineString', coordinates: [last, cursor] }
    });
  };

  // Default styles
  var _defaultPolyStyle = opts.style || new bemap.PolygonStyle({
    fillColor: new bemap.Color(0, 102, 204, 0.2),
    borderColor: new bemap.Color(0, 102, 204, 1),
    borderWidth: 2
  });
  var _defaultLineStyle = opts.style || new bemap.LineStyle({
    color: new bemap.Color(230, 57, 70, 1),
    width: 3
  });

  // Click → add vertex (debounced to avoid dblclick phantom vertex)
  var CLOSE_PX = 15;
  var clickTimer = null;

  var clickHandler = function(e) {
    var _e = e;
    clickTimer = setTimeout(function() {
      clickTimer = null;

      // Polygon: close if clicking near first point
      if (type === 'Polygon' && coords.length >= 3) {
        var firstPx = _this.native.project([coords[0].getLon(), coords[0].getLat()]);
        var clickPx = _this.native.project([_e.lngLat.lng, _e.lngLat.lat]);
        var dist = Math.sqrt(Math.pow(firstPx.x - clickPx.x, 2) + Math.pow(firstPx.y - clickPx.y, 2));
        if (dist < CLOSE_PX) {
          finishDraw(_e);
          return;
        }
      }

      coords.push(new bemap.Coordinate(_e.lngLat.lng, _e.lngLat.lat));
      updatePreview();

      // Rectangle: auto-finish on 2nd click
      if (type === 'Rectangle' && coords.length >= 2) {
        finishDraw(_e);
      }
      // Circle: auto-finish on 2nd click (center + edge)
      if (type === 'Circle' && coords.length >= 2) {
        finishDraw(_e);
      }
    }, 220);
  };

  // Double-click → finish
  var dblclickHandler = function(e) {
    if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
    if (e && e.preventDefault) e.preventDefault();
    finishDraw(e);
  };

  // Finish drawing and create the shape
  var finishDraw = function(e) {
    cleanup();

    var bemapObj = null;
    if (type === 'Rectangle' && coords.length >= 2) {
      var c0 = coords[0], c1 = coords[coords.length - 1];
      var rectCoords = [
        c0,
        new bemap.Coordinate(c1.getLon(), c0.getLat()),
        c1,
        new bemap.Coordinate(c0.getLon(), c1.getLat())
      ];
      bemapObj = new bemap.Polygon(rectCoords, { style: _defaultPolyStyle });
    } else if (type === 'Circle' && coords.length >= 2) {
      var center = coords[0];
      var edge = coords[1];
      var R = 6371000;
      var dLat = (edge.getLat() - center.getLat()) * Math.PI / 180;
      var dLon = (edge.getLon() - center.getLon()) * Math.PI / 180;
      var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(center.getLat() * Math.PI / 180) * Math.cos(edge.getLat() * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
      var radius = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      var _circleStyle = opts.style || new bemap.CircleStyle({
        fillColor: new bemap.Color(0, 102, 204, 0.2),
        borderColor: new bemap.Color(0, 102, 204, 1),
        borderWidth: 2
      });
      bemapObj = new bemap.Circle(center, radius, { style: _circleStyle });
    } else if (type === 'Polygon' && coords.length >= 3) {
      bemapObj = new bemap.Polygon(coords, { style: _defaultPolyStyle });
    } else if (type === 'Polyline' && coords.length >= 2) {
      bemapObj = new bemap.Polyline(coords, { style: _defaultLineStyle });
    }

    if (bemapObj) {
      if (callback) callback(new bemap.MapEvent({ map: _this, bemapObject: bemapObj, coordinate: coords[0] }));

      // Auto-add to map
      if (opts.addToMap !== false) {
        if (bemap.inheritsof(bemapObj, bemap.Polygon)) _this.addPolygon(bemapObj);
        else if (bemap.inheritsof(bemapObj, bemap.Polyline)) _this.addPolyline(bemapObj);
        else if (bemap.inheritsof(bemapObj, bemap.Circle)) _this.addCircle(bemapObj);
        else if (bemap.inheritsof(bemapObj, bemap.Marker)) _this.addMarker(bemapObj);
      }

      // Auto-enable vertex editing for polygons
      if (opts.editable !== false && bemap.inheritsof(bemapObj, bemap.Polygon)) {
        _this.editPolygon(bemapObj, callback);
      }
    }
  };

  var cleanup = function() {
    if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
    _this.native.off('click', clickHandler);
    _this.native.off('dblclick', dblclickHandler);
    _this.native.off('mousemove', mouseMoveHandler);

    try { if (_this.native.getLayer(fillLayerId)) _this.native.removeLayer(fillLayerId); } catch(e) {}
    try { if (_this.native.getLayer(lineLayerId)) _this.native.removeLayer(lineLayerId); } catch(e) {}
    try { if (_this.native.getLayer(vertexLayerId)) _this.native.removeLayer(vertexLayerId); } catch(e) {}
    try { if (_this.native.getLayer(rubberLineId)) _this.native.removeLayer(rubberLineId); } catch(e) {}
    try { if (_this.native.getSource(sourceId)) _this.native.removeSource(sourceId); } catch(e) {}
    try { if (_this.native.getSource(vertexLayerId + '-src')) _this.native.removeSource(vertexLayerId + '-src'); } catch(e) {}
    try { if (_this.native.getSource(rubberLineId + '-src')) _this.native.removeSource(rubberLineId + '-src'); } catch(e) {}

    _this.native.doubleClickZoom.enable();
    var container = _this.native.getContainer();
    if (container) container.classList.remove('bemap-drawing-active');
    _this._drawState = null;
  };

  this.native.on('click', clickHandler);
  this.native.on('dblclick', dblclickHandler);
  this.native.on('mousemove', mouseMoveHandler);

  this._drawState = { cleanup: cleanup, coords: coords };

  var container = this.native.getContainer();
  if (container) container.classList.add('bemap-drawing-active');

  return new bemap.Listener();
};

bemap.MapLibreMap.prototype.cancelDraw = function() {
  if (this._drawState) {
    if (this._drawState.cleanup) this._drawState.cleanup();
    else {
      if (this._drawState.clickHandler) this.native.off('click', this._drawState.clickHandler);
      var container = this.native.getContainer();
      if (container) container.classList.remove('bemap-drawing-active');
    }
    this._drawState = null;
  }
  return this;
};

bemap.MapLibreMap.prototype.editPolygon = function(polygon, callback) {
  if (!polygon || !polygon.native) return new bemap.Listener();

  var _this = this;
  var MERGE_PX = 15;

  // Store edit state on polygon for rebuild
  polygon._editCallback = callback;
  polygon._editMap = this;

  this._rebuildVertexHandles(polygon);

  // Click on polygon layer to insert vertex on nearest edge
  var polyLayerId = polygon._maplibreFillLayerId || polygon._maplibreLayerId;
  if (polyLayerId && this.native.getLayer(polyLayerId)) {
    var insertHandler = function(e) {
      _this._insertVertexOnEdge(polygon, e.lngLat);
    };
    this.native.on('click', polyLayerId, insertHandler);
    polygon._insertHandler = insertHandler;
    polygon._insertLayerId = polyLayerId;
  }

  return new bemap.Listener({ native: null, bemapObject: polygon, key: 'editPolygon' });
};

/**
 * Rebuild all vertex handle markers for a polygon being edited.
 */
bemap.MapLibreMap.prototype._rebuildVertexHandles = function(polygon) {
  var _this = this;
  var coords = polygon.getCoordinates();
  var MERGE_PX = 15;
  var callback = polygon._editCallback;

  // Remove old handles
  if (polygon._vertexMarkers) {
    for (var r = 0; r < polygon._vertexMarkers.length; r++) {
      polygon._vertexMarkers[r].remove();
    }
  }
  polygon._vertexMarkers = [];

  for (var i = 0; i < coords.length; i++) {
    (function(index) {
      var el = document.createElement('div');
      el.className = 'bemap-vertex-handle';

      var vm = new maplibregl.Marker({ element: el, draggable: true })
        .setLngLat([coords[index].getLon(), coords[index].getLat()])
        .addTo(_this.native);

      // Real-time drag — update polygon during drag
      vm.on('drag', function() {
        var ll = vm.getLngLat();
        coords[index] = new bemap.Coordinate(ll.lng, ll.lat);
        polygon.coords = coords;
        _this._updatePolygonSource(polygon, coords);
      });

      // Dragend — merge check + callback
      vm.on('dragend', function() {
        var ll = vm.getLngLat();
        var dropPoint = _this.native.project([ll.lng, ll.lat]);

        // Merge: check distance to all other vertices
        if (coords.length > 3) {
          for (var j = 0; j < coords.length; j++) {
            if (j === index) continue;
            var otherPoint = _this.native.project([coords[j].getLon(), coords[j].getLat()]);
            var dist = Math.sqrt(Math.pow(dropPoint.x - otherPoint.x, 2) + Math.pow(dropPoint.y - otherPoint.y, 2));
            if (dist < MERGE_PX) {
              // Merge: remove dragged vertex
              coords.splice(index, 1);
              polygon.coords = coords;
              _this._updatePolygonSource(polygon, coords);
              _this._rebuildVertexHandles(polygon);
              if (callback) callback(new bemap.MapEvent({ map: _this, bemapObject: polygon }));
              return;
            }
          }
        }

        polygon.coords = coords;
        if (callback) callback(new bemap.MapEvent({ map: _this, bemapObject: polygon }));
      });

      // Right-click — delete vertex
      el.addEventListener('contextmenu', function(domEvt) {
        domEvt.preventDefault();
        domEvt.stopPropagation();
        if (coords.length <= 3) return; // min 3 vertices
        coords.splice(index, 1);
        polygon.coords = coords;
        _this._updatePolygonSource(polygon, coords);
        _this._rebuildVertexHandles(polygon);
        if (callback) callback(new bemap.MapEvent({ map: _this, bemapObject: polygon }));
      });

      polygon._vertexMarkers.push(vm);
    })(i);
  }
};

/**
 * Update polygon GeoJSON source from coordinates array.
 */
bemap.MapLibreMap.prototype._updatePolygonSource = function(polygon, coords) {
  var lngLats = coords.map(function(c) { return [c.getLon(), c.getLat()]; });
  var ring = lngLats.concat([lngLats[0]]);
  var sourceId = polygon._maplibreSourceId;
  if (sourceId && this.native.getSource(sourceId)) {
    this.native.getSource(sourceId).setData({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [ring] },
      properties: polygon.properties || {}
    });
  }
};

/**
 * Insert a vertex on the nearest polygon edge to the click point.
 */
bemap.MapLibreMap.prototype._insertVertexOnEdge = function(polygon, lngLat) {
  var coords = polygon.getCoordinates();
  var clickPx = this.native.project([lngLat.lng, lngLat.lat]);
  var bestIdx = 0, bestDist = Infinity;

  for (var i = 0; i < coords.length; i++) {
    var a = this.native.project([coords[i].getLon(), coords[i].getLat()]);
    var b = this.native.project([coords[(i + 1) % coords.length].getLon(), coords[(i + 1) % coords.length].getLat()]);
    var d = this._distToSegmentPx(clickPx, a, b);
    if (d < bestDist) { bestDist = d; bestIdx = i; }
  }

  // Only insert if click is reasonably close to an edge (within 20px)
  if (bestDist > 20) return;

  var newCoord = new bemap.Coordinate(lngLat.lng, lngLat.lat);
  coords.splice(bestIdx + 1, 0, newCoord);
  polygon.coords = coords;
  this._updatePolygonSource(polygon, coords);
  this._rebuildVertexHandles(polygon);
  if (polygon._editCallback) polygon._editCallback(new bemap.MapEvent({ map: this, bemapObject: polygon }));
};

/**
 * Distance from point P to segment AB (in pixels).
 */
bemap.MapLibreMap.prototype._distToSegmentPx = function(p, a, b) {
  var dx = b.x - a.x, dy = b.y - a.y;
  if (dx === 0 && dy === 0) return Math.sqrt(Math.pow(p.x - a.x, 2) + Math.pow(p.y - a.y, 2));
  var t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
  var projX = a.x + t * dx, projY = a.y + t * dy;
  return Math.sqrt(Math.pow(p.x - projX, 2) + Math.pow(p.y - projY, 2));
};

/**
 * BeNomad BeMap JavaScript API - MapLibre v5 - Heatmap
 *
 * Usage:
 *   var heatmap = new bemap.HeatmapLayer({
 *     name: 'earthquakes',
 *     points: [
 *       { lon: 2.35, lat: 48.85, weight: 5 },
 *       { lon: 7.26, lat: 43.71, weight: 3 }
 *     ],
 *     radius: 25,
 *     intensity: 1.5,
 *     colors: ['rgba(0,0,255,0)', 'royalblue', 'cyan', 'lime', 'yellow', 'red']
 *   });
 *   map.addHeatmap(heatmap);
 */

bemap.MapLibreMap.prototype.addHeatmap = function(layer, options) {
  if (!layer || !bemap.inheritsof(layer, bemap.HeatmapLayer)) return this;

  var _this = this;
  this._addOwnToProperties(layer);

  var sourceId = layer._bemapId + '-heatmap-src';
  var layerId = layer._bemapId + '-heatmap';
  layer._maplibreSourceId = sourceId;
  layer._maplibreLayerId = layerId;

  // Build GeoJSON FeatureCollection from points
  var features = [];
  for (var i = 0; i < layer.points.length; i++) {
    var pt = layer.points[i];
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [pt.lon, pt.lat] },
      properties: { weight: pt.weight || pt[layer.weightProperty] || 1 }
    });
  }

  var geojsonData = { type: 'FeatureCollection', features: features };

  // Build color ramp
  var colorRamp = ['interpolate', ['linear'], ['heatmap-density']];
  var colors = layer.colors;
  for (var c = 0; c < colors.length; c++) {
    colorRamp.push(c / (colors.length - 1));
    colorRamp.push(colors[c]);
  }

  var addToMap = function() {
    if (!_this.native.getSource(sourceId)) {
      _this.native.addSource(sourceId, { type: 'geojson', data: geojsonData });
      _this.native.addLayer({
        id: layerId,
        type: 'heatmap',
        source: sourceId,
        paint: {
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 10, 1],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, layer.intensity, 20, layer.intensity * 3],
          'heatmap-color': colorRamp,
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 20, layer.radius],
          'heatmap-opacity': layer.opacity
        }
      });
    }
  };

  if (this.native.isStyleLoaded()) { addToMap(); } else { this.native.on('load', addToMap); }

  layer.native = { sourceId: sourceId, layerId: layerId };
  if (layer.map === null) layer.map = this;

  return this;
};

bemap.MapLibreMap.prototype.removeHeatmap = function(layer) {
  if (layer && layer.native) {
    try {
      if (this.native.getLayer(layer._maplibreLayerId)) this.native.removeLayer(layer._maplibreLayerId);
      if (this.native.getSource(layer._maplibreSourceId)) this.native.removeSource(layer._maplibreSourceId);
    } catch(e) {}
    if (layer._bemapId) delete this._featureRegistry[layer._bemapId];
    layer.map = null;
  }
  return this;
};

bemap.MapLibreMap.prototype.updateHeatmap = function(layer, data) {
  if (layer && layer._maplibreSourceId) {
    var features = [];
    for (var i = 0; i < data.length; i++) {
      var pt = data[i];
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [pt.lon, pt.lat] },
        properties: { weight: pt.weight || 1 }
      });
    }
    var src = this.native.getSource(layer._maplibreSourceId);
    if (src) src.setData({ type: 'FeatureCollection', features: features });
    layer.points = data;
  }
  return this;
};

/**
 * BeNomad BeMap JavaScript API - MapLibre v5 - Marker
 */

bemap.MapLibreMap.prototype.addMarker = function(marker, options) {
  if (!marker || !bemap.inheritsof(marker, bemap.Marker)) return this;

  var opts = options || {};
  var coord = marker.getCoordinate();

  this._addOwnToProperties(marker);

  // Build marker element with icon
  var el = null;
  if (marker.icon && marker.icon.src) {
    el = document.createElement('div');
    el.style.cursor = 'pointer';
    var img = document.createElement('img');
    img.src = marker.icon.src;

    // Calculate final pixel dimensions (like Leaflet: width * scale)
    var _ico = marker.icon;
    var _scale = _ico.scale || 1;
    var finalW = _ico.width ? Math.round(_ico.width * _scale) : null;
    var finalH = _ico.height ? Math.round(_ico.height * _scale) : null;

    if (finalW) img.style.width = finalW + 'px';
    if (finalH) img.style.height = finalH + 'px';
    // No CSS transform:scale() — image is already at final pixel size

    // Apply icon className if set (e.g. 'selected-station-marker')
    if (_ico.className) {
      el.classList.add(_ico.className);
    }

    // Shadow on element
    el.style.filter = 'drop-shadow(2px 2px 3px #222)';

    el.appendChild(img);

    if (marker.name && marker.textStyle) {
      var label = document.createElement('div');
      label.textContent = marker.name;
      label.style.fontSize = (marker.textStyle.size || 12) + 'px';
      label.style.textAlign = 'center';
      label.style.marginTop = (marker.textStyle.offsetY || 0) + 'px';
      if (marker.textStyle.color) label.style.color = this._colorToRgba(marker.textStyle.color);
      el.appendChild(label);
    }
  }

  // Compute anchor offset (matching OL/Leaflet behavior)
  // MapLibre default anchor='center' does translate(-50%,-50%) automatically.
  // We only need offset for anchors that are NOT center (0.5, 0.5).
  var markerOpts = {};
  if (el) markerOpts.element = el;
  if (marker.icon) {
    var _ic = marker.icon;
    var _sc = _ic.scale || 1;
    var w = _ic.width ? Math.round(_ic.width * _sc) : 0;
    var h = _ic.height ? Math.round(_ic.height * _sc) : 0;
    var fracX, fracY;

    if (_ic.anchorXUnits === 'pixels') {
      fracX = w > 0 ? (_ic.anchorX || 0) / w : 0.5;
    } else {
      fracX = _ic.anchorX !== undefined ? _ic.anchorX : 0.5;
    }
    if (_ic.anchorYUnits === 'pixels') {
      fracY = h > 0 ? (_ic.anchorY || 0) / h : 0.5;
    } else {
      fracY = _ic.anchorY !== undefined ? _ic.anchorY : 0.5;
    }

    // anchor='center' means MapLibre already offsets by (-50%, -50%).
    // We adjust for non-center anchors: offset = (0.5 - frac) * dimension
    var offX = Math.round((0.5 - fracX) * w);
    var offY = Math.round((0.5 - fracY) * h);
    if (offX !== 0 || offY !== 0) {
      markerOpts.offset = [offX, offY];
    }
    // anchor stays default 'center' — no markerOpts.anchor needed
  }

  marker.native = new maplibregl.Marker(markerOpts)
    .setLngLat([coord.getLon(), coord.getLat()]);

  if (marker.map === null) marker.map = this;

  // Register for hit-testing
  var markerEl = marker.native.getElement();
  markerEl.classList.add('bemap-marker');
  this._markerElements[marker._bemapId] = { element: markerEl, bemapObject: marker };

  // Leaflet compatibility: _icon alias for element access (used by evmove5 highlightMarker)
  marker.native._icon = markerEl;

  marker.native.addTo(this.native);

  // Forward DOM events on marker element to bemap event system
  var _map = this;
  var domEvents = ['click', 'mouseup', 'mousedown', 'dblclick'];
  for (var di = 0; di < domEvents.length; di++) {
    (function(domEvtType) {
      markerEl.addEventListener(domEvtType, function(domEvt) {
        domEvt.stopPropagation();
        var lnglat = marker.native.getLngLat();
        var coord = new bemap.Coordinate(lnglat.lng, lnglat.lat);
        var mapEvent = new bemap.MapEvent({
          native: domEvt,
          map: _map,
          bemapObject: marker,
          coordinate: coord,
          properties: marker.properties
        });

        // Check all registered event types that map to this DOM event
        var bemapEvents = [];
        for (var bemapKey in bemap.MapLibreMap_eventMap) {
          if (bemap.MapLibreMap_eventMap[bemapKey] === domEvtType) bemapEvents.push(bemapKey);
        }
        if (bemapEvents.length === 0) bemapEvents.push(domEvtType);

        for (var ei = 0; ei < bemapEvents.length; ei++) {
          var evtType = bemapEvents[ei];
          var cb = _map._checkModeOfEvent({ singleFeature: true }, marker, evtType);
          if (cb) { cb(mapEvent); break; }
        }
      });
    })(domEvents[di]);
  }

  // Track in layer
  var l = null;
  if (opts.layer && bemap.inheritsof(opts.layer, bemap.Layer)) {
    l = opts.layer;
  } else {
    l = this.getLayerByName(bemap.Map.DEFAULT_LAYER.MARKER);
  }

  // If target is a ClusterLayer, keep the DOM marker but track for clustering
  if (l && bemap.inheritsof(l, bemap.ClusterLayer)) {
    // Hide initially — _refreshClusterVisibility will show unclustered ones
    marker.native.getElement().style.display = 'none';
    // Store cluster data — the DOM marker stays on the map
    if (!l._clusterFeatures) l._clusterFeatures = [];
    if (!l._clusterBemapObjects) l._clusterBemapObjects = {};
    if (!l._clusterMarkerNatives) l._clusterMarkerNatives = {};

    var feat = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [coord.getLon(), coord.getLat()] },
      properties: { _bemapId: marker._bemapId }
    };
    l._clusterFeatures.push(feat);
    l._clusterBemapObjects[marker._bemapId] = marker;
    l._clusterMarkerNatives[marker._bemapId] = marker.native;
    if (l && l.native && l.native.markers) l.native.markers.push(marker.native);
    if (l && l.native && l.native.features) l.native.features.push(marker);
    if (marker.layer === null) marker.layer = l;

    // Debounced cluster source update
    if (l._clusterUpdateTimer) clearTimeout(l._clusterUpdateTimer);
    l._clusterUpdateTimer = setTimeout(function() {
      _map._updateClusterSource(l);
    }, 50);

    return this;
  }

  if (l && l.native && l.native.markers) l.native.markers.push(marker.native);
  if (l && l.native && l.native.features) l.native.features.push(marker);
  if (marker.layer === null) marker.layer = l;

  return this;
};

/**
 * Create or update the MapLibre cluster source for a ClusterLayer.
 * Strategy: GeoJSON cluster source determines which points are clustered.
 * Original DOM markers are shown/hidden based on cluster state.
 * Cluster bubbles are DOM elements with Leaflet CSS classes.
 */
bemap.MapLibreMap.prototype._updateClusterSource = function(clusterLayer) {
  if (!clusterLayer || !clusterLayer._clusterFeatures) return;

  var sourceId = clusterLayer._sourceId || clusterLayer._maplibreId + '-src';
  var data = { type: 'FeatureCollection', features: clusterLayer._clusterFeatures };
  var _this = this;

  // If source already exists, just update data
  if (this.native.getSource(sourceId)) {
    this.native.getSource(sourceId).setData(data);
    this._refreshClusterVisibility(clusterLayer, sourceId);
    return;
  }

  // Create cluster source (no visible layers — we render everything via DOM)
  try {
    this.native.addSource(sourceId, {
      type: 'geojson',
      data: data,
      cluster: true,
      clusterRadius: clusterLayer.distance || 50,
      clusterMaxZoom: 14
    });

    // Add invisible layer so MapLibre generates tiles and querySourceFeatures works
    var hiddenLayerId = sourceId + '-hidden';
    this.native.addLayer({
      id: hiddenLayerId,
      type: 'circle',
      source: sourceId,
      paint: { 'circle-radius': 0, 'circle-opacity': 0 }
    });

    clusterLayer._clusterSourceId = sourceId;
    clusterLayer._clusterLayerIds = [hiddenLayerId];
    if (!clusterLayer._clusterBubbles) clusterLayer._clusterBubbles = [];

    // Refresh visibility on zoom/move
    var _refreshTimer = null;
    var _doRefresh = function() {
      if (_refreshTimer) clearTimeout(_refreshTimer);
      _refreshTimer = setTimeout(function() {
        _this._refreshClusterVisibility(clusterLayer, sourceId);
      }, 100);
    };
    this.native.on('moveend', _doRefresh);
    this.native.on('zoomend', _doRefresh);
    this.native.on('sourcedata', function(e) {
      if (e.sourceId === sourceId) _doRefresh();
    });
    // Initial refresh
    setTimeout(function() { _this._refreshClusterVisibility(clusterLayer, sourceId); }, 200);

  } catch(e) { /* cluster source creation failed */ }
};

/**
 * Show/hide DOM markers for unclustered points in a ClusterLayer.
 * Clustered points are hidden; unclustered ones show their real marker icon.
 */
/**
 * Show/hide original DOM markers based on cluster state.
 * Clustered markers are hidden, unclustered are shown.
 * Cluster bubbles (circles with count) are created as separate DOM elements.
 */
bemap.MapLibreMap.prototype._refreshClusterVisibility = function(clusterLayer, sourceId) {
  if (!clusterLayer || !clusterLayer._clusterMarkerNatives) return;
  if (!this.native.getSource(sourceId)) return;

  var _this = this;

  // Query source features to find clusters and unclustered points
  var allFeatures = [];
  try {
    allFeatures = this.native.querySourceFeatures(sourceId);
  } catch(e) { return; }

  // If source not ready yet, show all markers and no bubbles
  if (!allFeatures || allFeatures.length === 0) return;

  // Separate clusters from singles
  var clusters = {};
  for (var r = 0; r < allFeatures.length; r++) {
    var f = allFeatures[r];
    var props = f.properties || {};
    if (props.cluster_id !== undefined && props.point_count) {
      if (!clusters[props.cluster_id]) {
        clusters[props.cluster_id] = { coords: f.geometry.coordinates, count: props.point_count };
      }
    }
  }

  // If there are clusters, find which individual points are NOT clustered
  // A point is clustered if it's NOT returned as an individual feature
  var visibleSingles = {};
  for (var r2 = 0; r2 < allFeatures.length; r2++) {
    var f2 = allFeatures[r2];
    var p2 = f2.properties || {};
    if (p2._bemapId && !p2.cluster_id) {
      visibleSingles[p2._bemapId] = true;
    }
  }

  // Check if state changed
  var key = Object.keys(clusters).sort().join(',') + '|' + Object.keys(visibleSingles).sort().join(',');
  if (clusterLayer._lastClusterKey === key) return;
  clusterLayer._lastClusterKey = key;

  // Show/hide individual markers
  var hasAnyClusters = Object.keys(clusters).length > 0;
  for (var bid in clusterLayer._clusterMarkerNatives) {
    var mk = clusterLayer._clusterMarkerNatives[bid];
    if (mk && mk.getElement) {
      if (!hasAnyClusters || visibleSingles[bid]) {
        mk.getElement().style.display = '';
      } else {
        mk.getElement().style.display = 'none';
      }
    }
  }

  // Remove old cluster bubbles
  if (clusterLayer._clusterBubbles) {
    for (var b = 0; b < clusterLayer._clusterBubbles.length; b++) {
      clusterLayer._clusterBubbles[b].remove();
    }
  }
  clusterLayer._clusterBubbles = [];

  // Create cluster bubbles with Leaflet CSS classes
  for (var cid in clusters) {
    var cl = clusters[cid];
    var count = cl.count;
    var sizeClass = count < 10 ? 'small' : count < 100 ? 'medium' : 'large';

    var el = document.createElement('div');
    el.className = 'marker-cluster marker-cluster-' + sizeClass + ' bemap-cluster';
    var inner = document.createElement('div');
    var span = document.createElement('span');
    span.textContent = count;
    inner.appendChild(span);
    el.appendChild(inner);

    var bubble = new maplibregl.Marker({ element: el })
      .setLngLat(cl.coords)
      .addTo(_this.native);

    // Click cluster → zoom in
    (function(clusterId, bmk) {
      el.addEventListener('click', function(domEvt) {
        domEvt.stopPropagation();
        _this.native.getSource(sourceId).getClusterExpansionZoom(parseInt(clusterId)).then(function(zoom) {
          _this.native.easeTo({ center: bmk.getLngLat(), zoom: zoom });
        });
      });
    })(cid, bubble);

    clusterLayer._clusterBubbles.push(bubble);
  }
};

bemap.MapLibreMap.prototype.removeMarker = function(marker) {
  if (marker && marker.native) {
    marker.native.remove();
    if (marker._bemapId) {
      delete this._markerElements[marker._bemapId];
      delete this._featureRegistry[marker._bemapId];
    }
    marker.map = null;
    marker.layer = null;
  }
  return this;
};

bemap.MapLibreMap.prototype.setCoordinateMarker = function(marker) {
  if (marker && marker.native) {
    var c = marker.getCoordinate();
    marker.native.setLngLat([c.getLon(), c.getLat()]);
  }
  return this;
};

bemap.MapLibreMap.prototype.draggableMarker = function(marker, callback, options) {
  if (marker && marker.native) {
    marker.native.setDraggable(true);
    if (!marker.events) marker.events = {};
    if (!marker.callback) marker.callback = {};
    marker.events.draggable = true;
    marker.callback.draggable = callback;
    var _this = this;

    marker.native.on('drag', function() {
      var ll = marker.native.getLngLat();
      marker.coordinate.setLon(ll.lng).setLat(ll.lat);
    });

    marker.native.on('dragend', function() {
      var ll = marker.native.getLngLat();
      marker.coordinate.setLon(ll.lng).setLat(ll.lat);
      if (callback) {
        callback(new bemap.MapEvent({
          bemapObject: marker,
          coordinate: new bemap.Coordinate(ll.lng, ll.lat),
          map: _this
        }));
      }
    });
  }
  return new bemap.Listener({ native: marker ? marker.native : null, bemapObject: marker, key: 'dragFeature' });
};

bemap.MapLibreMap.prototype.draggableMarkers = function(callback, options) {
  var layer = this.getLayerByName(bemap.Map.DEFAULT_LAYER.MARKER);
  if (layer && layer.native && layer.native.features) {
    for (var i = 0; i < layer.native.features.length; i++) {
      var obj = layer.native.features[i];
      if (bemap.inheritsof(obj, bemap.Marker)) {
        this.draggableMarker(obj, callback, options);
      }
    }
  }
  return new bemap.Listener();
};

bemap.MapLibreMap.prototype.addMultiMarker = function(multimarker, options) {
  if (!multimarker) return this;
  this._addOwnToProperties(multimarker);
  multimarker._childMarkers = [];
  var coords = multimarker.getCoordinates();
  for (var i = 0; i < coords.length; i++) {
    var m = new bemap.Marker(coords[i], { icon: multimarker.icon, id: multimarker.id + '_' + i });
    this.addMarker(m, options);
    multimarker._childMarkers.push(m);
  }
  multimarker.map = this;
  return this;
};

bemap.MapLibreMap.prototype.removeMultimarker = function(multimarker) {
  if (multimarker && multimarker._childMarkers) {
    for (var i = 0; i < multimarker._childMarkers.length; i++) {
      this.removeMarker(multimarker._childMarkers[i]);
    }
    multimarker._childMarkers = [];
  }
  if (multimarker) multimarker.map = null;
  return this;
};

bemap.MapLibreMap.prototype.draggableMultiMarkers = function(callback, options) {
  return new bemap.Listener();
};

/**
 * BeNomad BeMap JavaScript API - MapLibre v5 - Polygon
 */

bemap.MapLibreMap.prototype.addPolygon = function(polygon, options) {
  if (!polygon || !bemap.inheritsof(polygon, bemap.Polygon)) return this;

  var opts = options || {};
  this._addOwnToProperties(polygon);

  var id = polygon._bemapId;
  polygon._maplibreSourceId = id + '-src';
  polygon._maplibreFillLayerId = id + '-fill';
  polygon._maplibreLineLayerId = id + '-line';

  var coords = [];
  var bemapCoords = polygon.getCoordinates();
  for (var i = 0; i < bemapCoords.length; i++) {
    coords.push([bemapCoords[i].getLon(), bemapCoords[i].getLat()]);
  }
  if (coords.length > 0 && (coords[0][0] !== coords[coords.length-1][0] || coords[0][1] !== coords[coords.length-1][1])) {
    coords.push(coords[0]);
  }

  var fillColor = 'rgba(0,0,0,0.3)', borderColor = 'rgba(0,0,0,1)', borderWidth = 2;
  if (polygon.style) {
    if (polygon.style.fillColor) fillColor = this._colorToRgba(polygon.style.fillColor);
    if (polygon.style.borderColor) borderColor = this._colorToRgba(polygon.style.borderColor);
    if (polygon.style.borderWidth) borderWidth = polygon.style.borderWidth;
  }

  var props = { _bemapId: polygon._bemapId };
  if (polygon.properties) { for (var k in polygon.properties) { props[k] = polygon.properties[k]; } }

  var geojson = {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [coords] },
    properties: props
  };

  this._geoJsonData[polygon._maplibreSourceId] = geojson;
  var _this = this;
  var addToMap = function() {
    if (!_this.native.getSource(polygon._maplibreSourceId)) {
      _this.native.addSource(polygon._maplibreSourceId, { type: 'geojson', data: geojson });
      _this.native.addLayer({
        id: polygon._maplibreFillLayerId, type: 'fill', source: polygon._maplibreSourceId,
        paint: { 'fill-color': fillColor, 'fill-opacity': 0.5 }
      });
      _this.native.addLayer({
        id: polygon._maplibreLineLayerId, type: 'line', source: polygon._maplibreSourceId,
        paint: { 'line-color': borderColor, 'line-width': borderWidth }
      });
      _this._geoJsonLayerIds.push(polygon._maplibreFillLayerId);
      _this._geoJsonLayerIds.push(polygon._maplibreLineLayerId);
    }
  };

  if (this.native.isStyleLoaded()) { addToMap(); } else { this.native.on('load', addToMap); }

  polygon.native = { sourceId: polygon._maplibreSourceId };
  if (polygon.map === null) polygon.map = this;

  var l = opts.layer && bemap.inheritsof(opts.layer, bemap.Layer) ? opts.layer : this.getLayerByName(bemap.Map.DEFAULT_LAYER.POLYGON);
  if (polygon.layer === null) polygon.layer = l;
  if (l && l.native && l.native.geoJsonIds) {
    l.native.geoJsonIds.push(polygon._maplibreFillLayerId);
    l.native.geoJsonIds.push(polygon._maplibreLineLayerId);
  }
  if (l && l.native && l.native.features) l.native.features.push(polygon);

  return this;
};

bemap.MapLibreMap.prototype.removePolygon = function(polygon) {
  if (polygon && polygon.native) {
    // Clean up edit handlers
    if (polygon._insertHandler && polygon._insertLayerId) {
      try { this.native.off('click', polygon._insertLayerId, polygon._insertHandler); } catch(e) {}
      polygon._insertHandler = null;
    }
    if (polygon._vertexMarkers) {
      for (var vi = 0; vi < polygon._vertexMarkers.length; vi++) {
        try { polygon._vertexMarkers[vi].remove(); } catch(e) {}
      }
      polygon._vertexMarkers = null;
    }
    try {
      if (this.native.getLayer(polygon._maplibreFillLayerId)) this.native.removeLayer(polygon._maplibreFillLayerId);
      if (this.native.getLayer(polygon._maplibreLineLayerId)) this.native.removeLayer(polygon._maplibreLineLayerId);
      if (this.native.getSource(polygon._maplibreSourceId)) this.native.removeSource(polygon._maplibreSourceId);
      var idx1 = this._geoJsonLayerIds.indexOf(polygon._maplibreFillLayerId);
      if (idx1 > -1) this._geoJsonLayerIds.splice(idx1, 1);
      var idx2 = this._geoJsonLayerIds.indexOf(polygon._maplibreLineLayerId);
      if (idx2 > -1) this._geoJsonLayerIds.splice(idx2, 1);
    } catch(e) {}
    if (polygon._bemapId) delete this._featureRegistry[polygon._bemapId];
    if (polygon._maplibreSourceId) delete this._geoJsonData[polygon._maplibreSourceId];
    polygon.map = null;
    polygon.layer = null;
  }
  return this;
};

bemap.MapLibreMap.prototype.updatePolygonCoordinates = function(polygon) {};

bemap.MapLibreMap.prototype.draggablePolygon = function(polygon, callback, options) {
  return this._draggableFeature(polygon, callback, options, { singleFeature: true });
};

bemap.MapLibreMap.prototype.draggablePolygons = function(callback, options) {
  return this._draggableFeature(null, callback, options, { polygons: true });
};

/**
 * BeNomad BeMap JavaScript API - MapLibre v5 - Polyline
 */

bemap.MapLibreMap.prototype.addPolyline = function(polyline, options) {
  if (!polyline || !bemap.inheritsof(polyline, bemap.Polyline)) return this;

  var opts = options || {};
  this._addOwnToProperties(polyline);

  var id = polyline._bemapId;
  polyline._maplibreSourceId = id + '-src';
  polyline._maplibreLayerId = id + '-layer';

  var coords = [];
  var bemapCoords = polyline.getCoordinates();
  for (var i = 0; i < bemapCoords.length; i++) {
    coords.push([bemapCoords[i].getLon(), bemapCoords[i].getLat()]);
  }

  var lineColor = 'rgba(0,0,0,1)', lineWidth = 3, lineDash = [];
  if (polyline.style) {
    if (polyline.style.color) lineColor = this._colorToRgba(polyline.style.color);
    if (polyline.style.width) lineWidth = polyline.style.width;
    if (polyline.style.type === bemap.LineStyle.TYPE.DASH) lineDash = [10, 5];
    else if (polyline.style.type === bemap.LineStyle.TYPE.DOT) lineDash = [2, 5];
    else if (polyline.style.type === bemap.LineStyle.TYPE.DOT_DASH) lineDash = [2, 5, 10, 5];
  }

  var props = { _bemapId: polyline._bemapId };
  if (polyline.properties) { for (var k in polyline.properties) { props[k] = polyline.properties[k]; } }

  var geojson = {
    type: 'Feature',
    geometry: { type: 'LineString', coordinates: coords },
    properties: props
  };

  this._geoJsonData[polyline._maplibreSourceId] = geojson;
  var _this = this;
  var _added = false;
  var addToMap = function() {
    if (_added) return;
    try {
      if (!_this.native.getSource(polyline._maplibreSourceId)) {
        _this.native.addSource(polyline._maplibreSourceId, { type: 'geojson', data: geojson });
        var layerDef = {
          id: polyline._maplibreLayerId,
          type: 'line',
          source: polyline._maplibreSourceId,
          paint: { 'line-color': lineColor, 'line-width': lineWidth, 'line-opacity': 1 },
          layout: { 'line-cap': 'round', 'line-join': 'round' }
        };
        if (lineDash.length > 0) layerDef.paint['line-dasharray'] = lineDash;
        _this.native.addLayer(layerDef);
        _this._geoJsonLayerIds.push(polyline._maplibreLayerId);
        _added = true;
      }
    } catch(e) { /* source/layer already exists or style not ready */ }
  };

  // Always try to add immediately — MapLibre handles concurrent addSource fine
  // isStyleLoaded() can return false during rapid add/remove cycles, causing polylines to be lost
  try {
    addToMap();
  } catch(e2) {
    // If style truly not ready, retry after a short delay
    setTimeout(function() { addToMap(); }, 100);
  }

  polyline.native = { sourceId: polyline._maplibreSourceId, layerId: polyline._maplibreLayerId };
  if (polyline.map === null) polyline.map = this;

  var l = opts.layer && bemap.inheritsof(opts.layer, bemap.Layer) ? opts.layer : this.getLayerByName(bemap.Map.DEFAULT_LAYER.POLYLINE);
  if (polyline.layer === null) polyline.layer = l;
  if (l && l.native && l.native.geoJsonIds) l.native.geoJsonIds.push(polyline._maplibreLayerId);
  if (l && l.native && l.native.features) l.native.features.push(polyline);

  return this;
};

bemap.MapLibreMap.prototype.removePolyline = function(polyline) {
  if (polyline && polyline.native) {
    try {
      if (this.native.getLayer(polyline._maplibreLayerId)) this.native.removeLayer(polyline._maplibreLayerId);
      if (this.native.getSource(polyline._maplibreSourceId)) this.native.removeSource(polyline._maplibreSourceId);
      var idx = this._geoJsonLayerIds.indexOf(polyline._maplibreLayerId);
      if (idx > -1) this._geoJsonLayerIds.splice(idx, 1);
    } catch(e) {}
    if (polyline._bemapId) delete this._featureRegistry[polyline._bemapId];
    if (polyline._maplibreSourceId) delete this._geoJsonData[polyline._maplibreSourceId];
    polyline.map = null;
    polyline.layer = null;
  }
  return this;
};

bemap.MapLibreMap.prototype.draggablePolyline = function(polyline, callback, options) {
  return this._draggableFeature(polyline, callback, options, { singleFeature: true });
};

bemap.MapLibreMap.prototype.draggablePolylines = function(callback, options) {
  return this._draggableFeature(null, callback, options, { polylines: true });
};

/**
 * BeNomad BeMap JavaScript API - MapLibre v5 - Popup
 */

bemap.MapLibreMap.prototype.addPopup = function(popup, options) {
  if (!popup || !bemap.inheritsof(popup, bemap.Popup)) return this;

  popup.native = new maplibregl.Popup({ closeOnClick: true, maxWidth: '300px' });
  if (popup.information) popup.native.setHTML(popup.information);
  if (popup.map === null) popup.map = this;

  if (popup.coordinate && popup.visible !== false) {
    popup.native.setLngLat([popup.coordinate.getLon(), popup.coordinate.getLat()]);
    popup.native.addTo(this.native);
    popup.visible = true;
  } else if (!popup.coordinate && popup.visible === true) {
    // Fallback: use map center (same as OlMap behavior)
    var center = this.native.getCenter();
    popup.coordinate = new bemap.Coordinate(center.lng, center.lat);
    popup.native.setLngLat([center.lng, center.lat]);
    popup.native.addTo(this.native);
  } else {
    popup.visible = false;
  }

  return this;
};

bemap.MapLibreMap.prototype.removePopup = function(popup) {
  if (popup && popup.native) {
    popup.native.remove();
    popup.map = null;
    popup.native = null;
  }
  return this;
};

bemap.MapLibreMap.prototype.setVisiblePopup = function(popup, visible) {
  if (popup && popup.native) {
    popup.visible = visible;
    if (visible && popup.coordinate) {
      popup.native.setLngLat([popup.coordinate.getLon(), popup.coordinate.getLat()]);
      popup.native.addTo(this.native);
    } else {
      popup.native.remove();
    }
  }
  return this;
};

bemap.MapLibreMap.prototype.clearPopup = function() {
  var popups = document.querySelectorAll('.maplibregl-popup');
  for (var i = 0; i < popups.length; i++) {
    popups[i].remove();
  }
  return this;
};

bemap.MapLibreMap.prototype.setCoordinatePopup = function(popup, coordinate, options) {
  if (popup && popup.native && coordinate) {
    popup.coordinate = coordinate;
    popup.native.setLngLat([coordinate.getLon(), coordinate.getLat()]);
    if (popup.information) popup.native.setHTML(popup.information);
    if (!popup.visible) {
      popup.native.addTo(this.native);
      popup.visible = true;
    }
  }
  return this;
};

/**
 * BeNomad BeMap JavaScript API - Autocomplete
 */

/**
 * @classdesc
 * Base class for Autocomplete.
 * @public
 * @constructor
 * @abstract
 * @param {bemap.Context} context BeMap-JS-API Context. Mandatory.
 * @param {object} options see below the available values.
 */
bemap.Autocomplete = function(context, options) {
  this.context = context;
  this.geoserver = context.geoserver;

  var opts = options ? options : {};

  if (opts.geoserver) {
    this.geoserver = opts.geoserver;
  }
};

/**
 * Generate the BeMap request in URL encoded format.
 * Excute the request by calling the BeMap server and wait the answer.
 * @ppublic
 * @param {bemap.map} map To get coords needed in autocomplete propositions.
 * @param {string} query String to search.
 * @param {function} listener The function to call to get click data.
 */
bemap.Autocomplete.prototype.query = function(map, query, listener) {
  if (!map) {
    console.error("Map is required!");
    return;
  }

  var c = map.getCenter();
  var url = bemapMainCtx.getBaseUrl() + 'service/geocoding/autocomplete/1.0?' + bemapMainCtx.getAuthUrlParams();
  var request = {
    "geoserver": this.geoserver,
    "addressDetails": false,
    "coordinate": {
      "longitude": c.getLon(),
      "latitude": c.getLat()
    },
    "place": query
  };

  bemap.ajax('POST', url, request, function(xhr, response) {
    var responseJson = JSON.parse(response);
    var data = [];
    var items = responseJson.items;

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var label = item.place.replace(/\|/g, '').replace(/ {2,}/g, ' ');
      data.push({
        value: label,
        label: label,
        item: item
      });
    }

    if (listener) {
      listener(data);
    }
  });
};

/**
 * Create the autocomplete event on input with animations if needed
 * @private
 * @param {object} options see below the available values.
 * @param {bemap.map} map Need map to create request.
 * @param {string} id Index of html element or object with html element.
 * @param {function} selectListener the function to call to get data from selected item
 * @param {boolean} animation Show or not animations (need bootstrap to work)
 * @return {boolean} true if selected item
 */
bemap.Autocomplete.prototype.autocomp = function(options, selectListener) {

  var map = options.map ? options.map : console.error("Map is required");
  var id = options.id ? options.id : console.error("Id is required");
  var animation = options.animation ? options.animation : false;
  var that = this;
  var tag = $(id);
  var parentTag = tag.parent();
  var feedbackTag = $('.form-control-feedback', parentTag);
  if (animation) {
    tag.keyup(function() {
      if ($(this).val() == "") {
        parentTag.parent().removeClass('has-success has-warning');
        feedbackTag.removeClass('glyphicon-ok glyphicon-refresh');
      }
    });
  }
  tag.autocomplete({
    source: function(request, response) {
      if (animation) {
        parentTag.parent().removeClass('has-success').addClass('has-warning');
        feedbackTag.removeClass('glyphicon-ok');
        feedbackTag.addClass('glyphicon-refresh');
      }
      //send request to server to get list of propositions
      that.query(map, request.term, function(data) {
        response(data);
      });
    },
    select: function(event, ui) {
      if (animation) {
        feedbackTag.addClass('glyphicon-refresh-animate');
        parentTag.parent().removeClass('has-warning').addClass('has-success');
        feedbackTag.removeClass('glyphicon-refresh-animate');
        feedbackTag.removeClass('glyphicon-refresh');
        feedbackTag.addClass('glyphicon-ok');
      }

      if (selectListener) {
        selectListener(ui.item.item);
      }
      return true;
    }
  });
};

/**
 * Parse data to create marker on map
 * @public
 * @param {bemap.Map} map for creating new marker.
 * @param {bemap.Coordinate} coordinates Array of bemap.Coordinate.
 * @param {object} options see below the available values.
 */
bemap.Autocomplete.prototype.showOnMap = function(map, coord, options) {
  var opts = options ? options : {};
  var layer = opts.layer ? opts.layer : '';

  if (!coord) {
    console.error("Coordinates are required!");
  }

  var coordinate = coord;
  var c = new bemap.Coordinate(coordinate.longitude, coordinate.latitude);

  var icon = new bemap.Icon({
    src: opts.src ? opts.src : 'start.svg',
    anchorX: opts.anchorX ? opts.anchorX : 0.25,
    anchorY: opts.anchorY ? opts.anchorY : 1,
    anchorXUnits: opts.anchorXUnits ? opts.anchorXUnits : 'fraction',
    anchorYUnits: opts.anchorYUnits ? opts.anchorYUnits : 'fraction',
    scale: opts.scale ? opts.scale : 1
  });

  if (!bemap.marker) {
    var marker = new bemap.Marker(c, {
      icon: icon
    });
    if (layer) {
      map.addMarker(marker, {
        layer: layer
      });
    } else {
      map.addMarker(marker);
    }
    bemap.marker = marker;
  }
  bemap.marker.setCoordinate(c);
};

/**
 * BeNomad BeMap JavaScript API - Routing, EVSE Routing.
 */


/**
* @classdesc
* Base class for EVSE Routing calculation.
* @public
* @constructor
* @abstract
* @param {bemap.Context} context BeMap-JS-API Context. Mandatory.
* @param {object} options see below the available values.
*/
bemap.EvseRouting = function(context, options) {
  bemap.Routing.call(this, context, options);

  /**
   * ID of geometry.
   * @type {String}
   * @protected
   */
  this.geometryId = 'evseRouting';
};
bemap.inherits(bemap.EvseRouting, bemap.Routing);

/**
 * Execute the EVSE Routing calculation.
 * @public
 * @param {object} options See below the available values.
 * @param {object} options.geoserver Geoserver name will be used for this computation.
 * @return {bemap.Isochrone} this
 */
bemap.EvseRouting.prototype.compute = function(options) {
  this.reset();

  if (this.destinations && this.destinations.length < 2) {
    console.error("Minimum of 2 destionations are required!");
    return;
  }

  var opts = options || {};
  var i = 0;
  var first = true;
  var url = this.ctx.getBaseUrl() + 'bnd';
  var data = 'version=1.0.0&action=routing&mode=MODE_VIAS&format=json&transportType=CAR&speedType=ETA';

  data += '&options=OPTIMIZED_ROUTE_FOR_CHARGING_STATION,EVENT,EVT_DUPLICATE_FILTER,EVT_CHARGING_STATION,EVT_POLYLINE';
  data += '&cf=5,80';
  data += '&cfCnnTypeIdFilters=8,9,10,11,12';
  //data += '&evf=0.75,0.012,0.693,22,1468,100,300,2.1,-2,20,22,31';

  if (this.ctx.isAuthInPost()) {
    data += '&' + this.ctx.getAuthUrlParams();
  } else {
    url += '?' + this.ctx.getAuthUrlParams();
  }

  data += this.buildRequest(opts);

  return this.execute(url, data, opts);
};

/**
 * BeNomad BeMap JavaScript API - GeoAutocomplete
 */

/**
 * @classdesc
 * Base class for GeoAutocomplete.
 * @public
 * @constructor
 * @abstract
 * @param {bemap.Context} context BeMap-JS-API Context. Mandatory.
 * @param {object} options see below the available values.
 */
bemap.GeoAutocomplete = function(context, options) {

  this.context = context;
  this.geoserver = context.geoserver;

  var opts = options ? options : {};

  if (opts.geoserver) {
    this.geoserver = opts.geoserver;
  }
};

/**
 *Autocomplete is sending only when user stop taping text in input and after option.timer time
 *@param options see below
 *@param listener return by function, list of autocomplete results
 */
bemap.GeoAutocomplete.prototype.autocomplete = function(options, listener) {

  if (!options) {
    console.error("Options required");
  };
  if (!options.inputId) {
    console.error("Input ID required");
  };
  if (!options.countryCode) {
    console.error("Country code required");
  };
  if (!options.target) {
    console.error("Target required");
  };
  //switch to allows list of autocomplete propositions
  var showList = true
  if (!options.showList && options.showList !== undefined) {
    showList = options.showList;
  }
  //stock this class event
  var _this = this;
  var id = options.inputId;
  //call geocoder methode and pass this context
  var geo = new bemap.Geocoder(this.context);

  //set timer to send the request to the geocoder
  var typingTimer; //timer identifier
  var doneTypingInterval = options.timer ? options.timer : 2000; //time in ms

  //on keyup, start the countdown
  id[0].addEventListener("input", function(e) {

    var countryCode = options.countryCode
    if (typeof countryCode !== 'string') {
      countryCode = options.countryCode.val()
    };
    //initialize geocoder elements
    var elements = {
      searchInfo: new bemap.GeoSearchInfo({
        searchType: options.searchType ? options.searchType : "CONTAINS",
        countryCode: countryCode,
        country: options.country,
        language: options.language ? options.language : '',
        maxResult: options.maxResult ? options.maxResult : 10
      })
    }
    //after every click
    clearTimeout(typingTimer);
    if ($(id).val()) {
      //requires city if search street if not algorythm not working
      if (options.target == "street") {
        if (!options.city) {
          console.error("City required");
        } else {
          var city = options.city;
          if (typeof city !== 'string') {
            city = options.city.val();
          }
          elements.searchInfo.city = city;
        };
      };
      //check if parametr of research exist
      if (elements.searchInfo[options.target] !== undefined) {
        elements.searchInfo[options.target] = $(id).val()
      } else {
        console.error("Target do not exist");
      }
      //the request is sending when user stop taping and after option.timer
      typingTimer = setTimeout(function() {
        //create success call for the geocode methode chack geocode documentation
        elements.success = function(response, doc, object, xhr) {

          //prepare list of results
          var countries = [];
          for (var i = 0; i < response.geocodingItems.length; i++) {
            var address = response.geocodingItems[i].PostalAddress[0][options.target]

            if (address !== null) {
              countries.push(address)
            }
          }
          //show list by calling showList methode if true
          if (countries.length !== 0) {
            if (showList) {
              _this.showList(id[0], countries);
            };
            //sent the result if listener
            if (listener) {
              listener(countries)
            };
          } else {
            console.log('The result of autocomplete not found');
          };
        } //end of success element

        //call geocode methode from Geocoding class
        console.log(elements);
        geo.geocode(elements);

      }, doneTypingInterval);
    } //end of input veryfication
  }); //end of input change
}

/**
 *This methode was found on the net to prevent charging jQuery UI lib with nice autocomplete functionality
 *@param inp - id of input field
 *@param arr - result of geocoding already filtred
 */
bemap.GeoAutocomplete.prototype.showList = function(inp, arr) {
  /*the autocomplete function takes two arguments,
  the text field element and an array of possible autocompleted values:*/
  var currentFocus;
  /*execute a function when someone writes in the text field:*/
  var a, b, i, val = inp.value;
  /*close any already open lists of autocompleted values*/
  closeAllLists();
  if (!val) {
    return false;
  }
  currentFocus = -1;
  /*create a DIV element that will contain the items (values):*/
  a = document.createElement("DIV");
  a.setAttribute("id", inp.id + "autocomplete-list");
  a.setAttribute("class", "autocomplete-items");
  /*append the DIV element as a child of the autocomplete container:*/
  inp.parentNode.appendChild(a);
  /*for each item in the array...*/
  for (i = 0; i < arr.length; i++) {
    //check at which position tapping value apears in arr stringify
    var item = arr[i].toUpperCase()
    var getIdx = item.indexOf(val.toUpperCase())
    /*create a DIV element for each matching element:*/
    b = document.createElement("DIV");
    /*make the matching letters bold:*/
    if (getIdx >= 0) {
      b.innerHTML += arr[i].substr(0, getIdx);
      b.innerHTML += "<strong>" + arr[i].substr(getIdx, val.length) + "</strong>";
      b.innerHTML += arr[i].substr(val.length + getIdx);
    } else {
      b.innerHTML = arr[i]
    }
    /*insert a input field that will hold the current array item's value:*/
    b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
    /*execute a function when someone clicks on the item value (DIV element):*/
    b.addEventListener("click", function(e) {
      /*insert the value for the autocomplete text field:*/
      inp.value = this.getElementsByTagName("input")[0].value;
      /*close the list of autocompleted values,
      (or any other open lists of autocompleted values:*/
      closeAllLists();
    });
    a.appendChild(b);
  }
  //detect if listener was already added to the input
  if (inp.getAttribute('listener') !== 'true') {
    /*execute a function presses a key on the keyboard:*/
    inp.addEventListener("keydown", function(e) {

      this.setAttribute('listener', 'true');
      var x = document.getElementById(this.id + "autocomplete-list");
      if (x) x = x.getElementsByTagName("div");
      if (e.keyCode == 40) {
        /*If the arrow DOWN key is pressed,
        increase the currentFocus variable:*/
        currentFocus++;
        /*and and make the current item more visible:*/
        addActive(x);
      } else if (e.keyCode == 38) { //up
        /*If the arrow UP key is pressed,
        decrease the currentFocus variable:*/
        currentFocus--;
        /*and and make the current item more visible:*/
        addActive(x);
      } else if (e.keyCode == 13) {
        /*If the ENTER key is pressed, prevent the form from being submitted,*/
        e.preventDefault();
        if (currentFocus > -1) {
          /*and simulate a click on the "active" item:*/
          if (x) x[currentFocus].click();
        }
      }
    });
  }

  function addActive(x) {
    /*a function to classify an item as "active":*/
    if (!x) return false;
    /*start by removing the "active" class on all items:*/
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = (x.length - 1);
    /*add class "autocomplete-active":*/
    x[currentFocus].classList.add("autocomplete-active");
  }

  function removeActive(x) {
    /*a function to remove the "active" class from all autocomplete items:*/
    for (var i = 0; i < x.length; i++) {
      x[i].classList.remove("autocomplete-active");
    }
  }

  function closeAllLists(elmnt) {
    /*close all autocomplete lists in the document,
    except the one passed as an argument:*/
    var x = document.getElementsByClassName("autocomplete-items");
    for (var i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != inp) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  }
  /*execute a function when someone clicks in the document:*/
  document.addEventListener("click", function(e) {
    closeAllLists(e.target);
  });
}

/**
 * BeNomad BeMap JavaScript API - Geocoder
 */

/**
 * @classdesc
 * Base class for geocoder.
 * @public
 * @constructor
 * @abstract
 * @param {bemap.Context} context BeMap-JS-API Context. Mandatory.
 * @param {object} options see below the available values.
 * @param {String} options.language Define the language that will be used to perform the address lookup.
 * @param {Int} options.maxResult The maximum number of items used to perform the research and returned items by the server. Default is 1.
 * @param {bemap.BoundingBox} options.boundingBox the bounding box that will limit the research to a specific area.
 */
bemap.Geocoder = function(context, options) {
  bemap.Service.call(this, context, options);

  var opts = options || {};

  /**
   * @type {String}
   * @protected
   */
  this.language = opts.language ? opts.language : null;

  /**
   * @type {int}
   * @protected
   */
  this.maxResult = opts.maxResult ? opts.maxResult : 1;

  /**
   * @type {bemap.BoundingBox}
   * @protected
   */
  this.bbox = opts.boundingBox ? opts.boundingBox : null;

};
bemap.inherits(bemap.Geocoder, bemap.Service);

/**
 * Get the language.
 * @return {String} language
 */
bemap.Geocoder.prototype.getLanguage = function() {
  return this.language;
};

/**
 * Get the number of max results.
 * @return {Int} maxResult
 */
bemap.Geocoder.prototype.getMaxResult = function() {
  return this.maxResult;
};

/**
 * Get the bounding box of the research.
 * @return {bemap.BoundingBox} bbox
 */
bemap.Geocoder.prototype.getBoundingBox = function() {
  return this.bbox;
};

/**
 * Set the language of the research.
 * @param {String} language the new language to set.
 * @return {bemap.Geocoder} this.
 */
bemap.Geocoder.prototype.setLanguage = function(language) {
  this.language = language;
  return this;
};

/**
 * Set the number of max results.
 * @param {Int} maxResult the new number of max results.
 * @return {bemap.Geocoder} this.
 */
bemap.Geocoder.prototype.setMaxResult = function(maxResult) {
  this.maxResult = maxResult;
  return this;
};

/**
 * Set the bounding box of the research.
 * @param {bemap.BoundingBox} bbox the new bounding box to set.
 * @return {bemap.Geocoder} this.
 */
bemap.Geocoder.prototype.setBoundingBox = function(bbox) {
  this.bbox = bbox;
  return this;
};

/**
 * Generate the BeMap request in URL encoded format.
 * @private
 * @param {object} options See below the available values.
 * @param {object} options.geoserver Geoserver name will be used for this computation.
 * @return {String} the request URL encoded.
 */
bemap.Geocoder.prototype.buildRequest = function(options) {
  var opts = options || {};
  var data = '&geoserver=' + (opts.geoserver ? opts.geoserver : this.ctx.getGeoserver());

  var searchInfo = opts.searchInfo;

  if (!searchInfo) {
    return;
  }

  for (var prop in this) {
    if (searchInfo.hasOwnProperty(prop) && searchInfo[prop]) {
      if (prop === "bbox") {
        data += "&" + prop + "=" + searchInfo[prop].minLon + "," + searchInfo[prop].minLat + "," + searchInfo[prop].maxLon + "," + searchInfo[prop].maxLat;
      } else {
        data += "&" + prop + "=" + encodeURI(searchInfo[prop]);
      }
    } else if (this[prop] && this.hasOwnProperty(prop) && prop !== 'ctx') {
      if (prop === "bbox") {
        data += "&" + prop + "=" + this[prop].minLon + "," + this[prop].minLat + "," + this[prop].maxLon + "," + this[prop].maxLat;
      } else {
        data += "&" + prop + "=" + encodeURI(this[prop]);
      }
    }
  }

  for (prop in searchInfo) {
    if (searchInfo[prop] && searchInfo.hasOwnProperty(prop)) {
      if (!this.hasOwnProperty(prop)) {
        data += "&" + prop + "=" + encodeURI(searchInfo[prop]);
      }
    }
  }

  return data;
};

/**
 * Execute the geocoding research.
 * @public
 * @param {object} options See below the available values.
 * @param {bemap.RevGeoSearchInfo} options.searchInfo the information to to search.
 * @param {object} options.geoserver Geoserver name will be used for this computation.
 * @param {function} options.success the function to call in case of successed request.
 * @param {function} options.failed the function to call in case of failed request.
 * @return {bemap.Geocoder} this.
 */
bemap.Geocoder.prototype.revGeocode = function(options) {
  //this.reset();

  var opts = options || {};

  if (!bemap.inheritsof(opts.searchInfo, bemap.RevGeoSearchInfo)) {
    console.error("SearchInfo is required!");
  }

  var i = 0;
  var first = true;
  var url = this.ctx.getBaseUrl() + 'bnd';
  var data = 'version=1.0.0&action=revgeocoding&format=json';

  if (this.ctx.isAuthInPost()) {
    data += '&' + this.ctx.getAuthUrlParams();
  } else {
    url += '?' + this.ctx.getAuthUrlParams();
  }

  data += this.buildRequest(opts);

  return this.execute(url, data, opts);
};

/**
 * Send a geocoding request to the bemap's server.
 * @public
 * @param {object} options See below the available values.
 * @param {bemap.GeoSearchInfo} options.searchInfo the information to to search.
 * @param {object} options.geoserver Geoserver name will be used for this computation.
 * @param {function} options.success the function to call in case of successed request.
 * @param {function} options.failed the function to call in case of failed request.
 * @return {bemap.Geocoder} this.
 */
bemap.Geocoder.prototype.geocode = function(options) {
  //this.reset();

  var opts = options || {};

  if (!bemap.inheritsof(opts.searchInfo, bemap.GeoSearchInfo)) {
    console.error("SearchInfo is required!");
  }

  var i = 0;
  var first = true;
  var url = this.ctx.getBaseUrl() + 'bnd';
  var data = 'version=1.0.0&action=geocoding&format=json';

  if (this.ctx.isAuthInPost()) {
    data += '&' + this.ctx.getAuthUrlParams();
  } else {
    url += '?' + this.ctx.getAuthUrlParams();
  }

  data += this.buildRequest(opts);

  return this.execute(url, data, opts);
};

/**
 * Excute the request by calling the BeMap server and wait the answer.
 * @private
 * @param {object} options Request options.
 * @return {bemap.Routing} this
 */
bemap.Geocoder.prototype.execute = function(url, data, options) {
  var opts = options || {};
  var _this = this;

  bemap.ajax(
    'POST',
    url,
    data,
    function(xhr, doc) {
      _this.responseParser(xhr, doc, opts);
    },
    function(xhr, doc) {
      _this.responseParser(xhr, doc, opts);
    }, {
      'requestFormat': 'urlencoded'
    }
  );

  return this;
};

/**
 * Convert the BeMap response to the BeMap JS API object.
 * @private
 **/
bemap.Geocoder.prototype.responseParser = function(xhr, doc, options) {
  var opts = options || {};

  doc = JSON.parse(doc);
  if (this.checkErrorParser(xhr, doc, options)) {
    return;
  }

  var bnd = doc.BND;
  var elements = bnd.Elements.Element;
  var response = new bemap.GeocodingResponse();
  if (elements !== undefined) {
    for (var i = 0; i < elements.length; i++) {
      var element = elements[i];
      var geocodingItem = new bemap.GeocodingItem();

      for (var prop in element) {
        var elementProp = element[prop];
        if (!elementProp || !element.hasOwnProperty(prop)) {
          continue;
        }
        //add id to easly get difference between elements
        geocodingItem['index'] = i + 1;
        if (prop === 'PostalAddress') {
          var newPostalAddress = new bemap.PostalAddress({
            countryCode: elementProp.CountryCode ? elementProp.CountryCode : '',
            country: elementProp.Country ? elementProp.Country : '',
            state: elementProp.State ? elementProp.State : '',
            county: elementProp.County ? elementProp.County : '',
            city: elementProp.City ? elementProp.City : '',
            district: elementProp.District ? elementProp.District : '',
            postalCode: elementProp.PostalCode ? elementProp.PostalCode : '',
            street: elementProp.Street ? elementProp.Street : '',
            streetNumber: elementProp.StreetNumber ? elementProp.StreetNumber : ''
          });
          if (!geocodingItem[prop]) { geocodingItem[prop] = []; }
          geocodingItem[prop].push(newPostalAddress);
        } else if (prop === 'Coordinate') {
          var newCoordinate = new bemap.Coordinate(elementProp.x, elementProp.y);
          geocodingItem[prop] = newCoordinate;
        } else if (prop === 'RoadFeature') {
          var newRoadFeature = new bemap.RoadFeature();
          for (var inf in elementProp) {
            newRoadFeature[inf] = elementProp[inf];
          }
          if (!geocodingItem[prop]) { geocodingItem[prop] = []; }
          geocodingItem[prop].push(newRoadFeature);
        } else {
          geocodingItem[prop] = elementProp;
        }
      }

      response.geocodingItems.push(geocodingItem);
    }
  } else {
    console.error("The result of geocoding not found");
  }
  if (bnd.Extent) {
    response.extent = new bemap.BoundingBox(bnd.Extent.minX, bnd.Extent.minY, bnd.Extent.maxX, bnd.Extent.maxY);
  }
  response.action = bnd.action;
  if (opts.success) {
    opts.success(response, doc, this, xhr);
  }
};

/**
 * Create table in selected div with data from parsing. Event click send by listener
 * @public
 * @param {Object} response data for create table.
 * @param {object} options see below the available values.
 * @param {DIV} container element to create table inside.
 * @param {function} listener the function to call to get click data
 */
bemap.Geocoder.prototype.createTable = function(options, listener) {
  //create list to store created markers
  if (!bemap.markerMapObject) {
    bemap.markerMapObject = [];
  };

  if (!options) {
    console.error("Options required");
  };

  if (!options.container) {
    console.error("Container required");
  };

  if (!options.response) {
    console.error("Response required");
  };

  var container = options.container;
  var doc = options.response;

  container.empty();

  var html = '<div><table class="table table-hover table-striped">';
  html += '<thead><th>City</th><th>Country</th><th>PostalCode</th><th>Place</th></thead><tbody>';

  for (var i = 0; i < doc.geocodingItems.length; i++) {

    var e = doc.geocodingItems[i];

    var p = e.PostalAddress[0];
    html += '<tr class="cursorPointer" onclick="myFunction(this)" data="' + i + '">';
    html += '<td>' + (p.city && p.city !== null ? p.city : '') + '</td>';
    html += '<td>' + (p.country && p.country !== null ? p.country : '') + '</td><td>' + (p.postalCode && p.postalCode !== null ? p.postalCode : '') + '</td>';
    html += '<td>' + (p.streetNumber && p.streetNumber !== null ? p.streetNumber : '') + ' ' + (p.street && p.street !== null ? p.street : '') + '</td></tr>';
  }

  html += '</tbody></table></div>';

  var theDiv = document.getElementById(container[0].id);
  theDiv.innerHTML += html;

  //var theTr = document.querySelector('#' + container[0].id + ' tbody tr');
  //used this solution because of deleting jquery
  myFunction = function(elem) {
    var index = elem.getAttribute('data');

    var e = doc.geocodingItems[index];

    if (listener) {
      listener(e);
    };
  };
};

/**
 * Parse data to create marker or markers on map
 * @public
 * @param {bemap.Map} map for creating new marker.
 * @param {Object} response data to parse in.
 * @param {object} options see below the available values.
 * @param {function} listener the function to call to get click data
 */
bemap.Geocoder.prototype.showOnMap = function(options, listener) {

  var map = options.map ? options.map : bemap.map;
  var layer = options.layer ? options.layer : '';

  if (!options) {
    console.error("Options required");
  }

  if (!options.response) {
    console.error("Response required");
  }

  var doc = options.response;

  var icone = options.icone ? options.icone : {};

  this.cleanMarkers();
  //check if there is list of markers or only one marker
  //if list make a for loop else send directly to create marker
  if (doc.geocodingItems) {
    for (var i = 0; i < doc.geocodingItems.length; i++) {

      var e = doc.geocodingItems[i];

      this.createMarker(map, e, icone, layer, function(data) {
        if (listener) {
          listener(data);
        }
      })
    }
  } else {
    this.createMarker(map, doc, icone, layer, function(data) {
      if (listener) {
        listener(data);
      };
    });
  };
};

/**
 * Reset the geocoding marker object. Clear the previous result.
 * @public
 * @return {bemap.markerMapObject} this
 */
bemap.Geocoder.prototype.cleanMarkers = function() {
  if (bemap.markerMapObject) {
    for (i = 0; i < bemap.markerMapObject.length; i++) {
      var marker = bemap.markerMapObject[i];
      marker.remove();
      marker = undefined;
    };
    bemap.markerMapObject = [];
  } else {
    bemap.markerMapObject = [];
  };
};

/**
 * Put markers on map
 * @private
 * @param {bemap.Map} map for creating new marker.
 * @param {Object} data data to pcreate marker.
 * @param {object} icone to personalize the marker.
 * @param {function} listener the function to call to get click data
 */
bemap.Geocoder.prototype.createMarker = function(map, data, icone, layer, listener) {

  map = map ? map : bemap.map;
  icone = icone ? icone : {};

  var posx = data.Coordinate.lon;
  var posy = data.Coordinate.lat;
  var c = new bemap.Coordinate(posx, posy);
  var icon = new bemap.Icon({
    src: icone.src ? icone.src : console.error("Check your icon adress REQUIRED ICON"),
    anchorX: icone.anchorX ? icone.anchorX : 0.25,
    anchorY: icone.anchorY ? icone.anchorY : 1,
    height: icone.height ? icone.height : '',
    width: icone.width ? icone.width : '',
    anchorXUnits: icone.anchorXUnits ? icone.anchorXUnits : 'fraction',
    anchorYUnits: icone.anchorYUnits ? icone.anchorYUnits : 'fraction',
    scale: icone.scale ? icone.scale : 1
  });
  //before creating new markers check if there was already created
  //this condition was made because of two posibilities of creation the markers
  //first by list second one by one
  if (bemap.markerMapObject) {
    for (var i = 0; i < bemap.markerMapObject.length; i++) {
      var mark = bemap.markerMapObject[i];
      if (mark.id == data.index) {
        map.move(posx, posy, 16);
        return
      };
    };
  };

  var marker = new bemap.Marker(
    c, {
      properties: data,
      icon: icon,
      id: data.index
    }
  );

  if (layer) {
    map.addMarker(marker, {
      layer: layer
    });
  } else {
    map.addMarker(marker);
  };
  //save list of markers to clean it later or to prevent dubbles
  bemap.markerMapObject.push(marker);

  marker.on(bemap.Map.EventType.CLICK, function(mapEvent) {
    if (listener) {
      listener(mapEvent);
    };
  });
};

/**
 * BeNomad BeMap JavaScript API - Routing, Isochrone
 */


/**
* @classdesc
* Base class for isochrone calculation.
* @public
* @constructor
* @abstract
* @param {bemap.Context} context BeMap-JS-API Context. Mandatory.
* @param {object} options see below the available values.
*/
bemap.Isochrone = function(context, options) {
  bemap.Routing.call(this, context, options);

  /**
   * ID of geometry.
   * @type {String}
   * @protected
   */
  this.geometryId = 'isochrone';

  /**
   * Draw a polygon with the polyline array.
   * @type {boolean}
   * @protected
   */
  this.poylineAsPolygon = true;
};
bemap.inherits(bemap.Isochrone, bemap.Routing);

/**
 * Execute the isochrone calculation.
 * @public
 * @param {object} options See below the available values.
 * @param {object} options.geoserver Geoserver name will be used for this computation.
 * @return {bemap.Isochrone} this
 */
bemap.Isochrone.prototype.compute = function(options) {
  this.reset();

  if (this.destinations && this.destinations.length != 1) {
    console.error("Only 1 destionation is required for an isochrone!");
    return;
  }

  var opts = options || {};
  var i = 0;
  var first = true;
  var url = this.ctx.getBaseUrl() + 'bnd';
  var data = 'version=1.0.0&action=routing&mode=MODE_ISOCHRONE&format=json&options=ISOCHRONE_FORWARD,POLYLINE';

  if (this.ctx.isAuthInPost()) {
    data += '&' + this.ctx.getAuthUrlParams();
  } else {
    url += '?' + this.ctx.getAuthUrlParams();
  }

  data += this.buildRequest(opts);

  return this.execute(url, data, opts);
};

/**
 * BeNomad BeMap JavaScript API - Trace route
 */

bemap.TraceRoute = function() {

};

bemap.gep = bemap.gep || {};

bemap.gep.version = '1.0.0';

/**
 * Decode the Google encoded polyline.
 * Originale source code form :
 * @see https://github.com/mapbox/polyline/blob/master/src/polyline.js
 * @see https://github.com/Project-OSRM/osrm-frontend/blob/master/WebContent/routing/OSRM.RoutingGeometry.js
 * @return List of BeMap JS coordinate.
 */
bemap.gep.decode = function(str, precision) {
  if(!precision || precision < 0) {
    precision = 5;
  }

  var index = 0,
    lat = 0,
    lng = 0,
    coordinates = [],
    shift = 0,
    result = 0,
    byte = null,
    latitude_change,
    longitude_change,
    factor = Math.pow(10, Number.isInteger(precision) ? precision : 5);

  // Coordinates have variable length when encoded, so just keep
  // track of whether we've hit the end of the string. In each
  // loop iteration, a single coordinate is decoded.
  while (index < str.length) {
    // Reset shift, result, and byte
    byte = null;
    shift = 0;
    result = 0;

    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

    shift = result = 0;

    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

    lat += latitude_change;
    lng += longitude_change;

    //coordinates.push([lat / factor, lng / factor]);
    coordinates.push(new bemap.Coordinate(lng / factor, lat / factor));
  }

  return coordinates;
};
