/* ======================================================================
 * CONFIGURATION BEMAP
 *
 * Environment selection, credentials, bemap.Context building.
 *
 * Credential storage strategy (v1.2.0+):
 *   - Default: sessionStorage (creds cleared on tab close)
 *   - "Remember me" checkbox: localStorage (persists across sessions)
 *   - Password is base64-obfuscated at rest (defeats casual inspection only;
 *     NOT a cryptographic control - Basic Auth ultimately transits over
 *     HTTPS on every API call)
 * ====================================================================== */

ZO.Config = {};

ZO.Config.ENVIRONMENTS = [
    { label: 'Beta',    host: 'bemap-beta.benomad.com',    baseUrl: 'https://bemap-beta.benomad.com/bgis' },
    { label: 'Preprod', host: 'bemap-preprod.benomad.com',  baseUrl: 'https://bemap-preprod.benomad.com/bgis' },
    { label: 'Prod',    host: 'bemap.benomad.com',          baseUrl: 'https://bemap.benomad.com/bgis' }
];

/**
 * Base64 obfuscation. UTF-8 safe via TextEncoder.
 * Trivially reversible - defeats shoulder-surfing of DevTools only.
 * @param {string} s
 * @returns {string} base64 string, prefixed with "b64:" marker
 */
ZO.Config._obfuscate = function (s) {
    if (!s) return '';
    try {
        var bytes = new TextEncoder().encode(s);
        var bin = '';
        for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        return 'b64:' + btoa(bin);
    } catch (e) { return ''; }
};

/**
 * Inverse of _obfuscate. If the input lacks the "b64:" prefix, returns
 * it unchanged - this enables transparent migration from v1.1.0 plaintext.
 * @param {string} s
 * @returns {string}
 */
ZO.Config._unobfuscate = function (s) {
    if (!s) return '';
    if (s.indexOf('b64:') !== 0) return s; // legacy plaintext -> return as-is
    try {
        var bin = atob(s.slice(4));
        var bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return new TextDecoder().decode(bytes);
    } catch (e) { return ''; }
};

/**
 * Reads a key trying sessionStorage first, then localStorage.
 * sessionStorage takes precedence so a "Remember me off" save during
 * an active session overrides any older localStorage value.
 * @param {string} k
 * @returns {string}
 */
ZO.Config._readKey = function (k) {
    return sessionStorage.getItem(k) || localStorage.getItem(k) || '';
};

/**
 * Reads current credentials. Password is unobfuscated on read.
 * @returns {{ env: string, user: string, pass: string, remember: boolean }}
 */
ZO.Config.getCreds = function () {
    return {
        env:      ZO.Config._readKey('bemap_env'),
        user:     ZO.Config._readKey('bemap_user'),
        pass:     ZO.Config._unobfuscate(ZO.Config._readKey('bemap_pass')),
        remember: localStorage.getItem('bemap_remember') === '1'
    };
};

/**
 * Saves credentials. Password is obfuscated before storage.
 * @param {string} env
 * @param {string} user
 * @param {string} pass
 * @param {boolean} remember - true = localStorage, false = sessionStorage
 */
ZO.Config.saveCreds = function (env, user, pass, remember) {
    var store = remember ? localStorage : sessionStorage;
    var other = remember ? sessionStorage : localStorage;
    /* Clear the "other" store so the chosen store is authoritative */
    other.removeItem('bemap_env');
    other.removeItem('bemap_user');
    other.removeItem('bemap_pass');
    store.setItem('bemap_env',  env);
    store.setItem('bemap_user', user);
    store.setItem('bemap_pass', ZO.Config._obfuscate(pass));
    localStorage.setItem('bemap_remember', remember ? '1' : '0');
};

/**
 * One-shot migration from v1.1.0 plaintext localStorage to obfuscated format.
 * If a legacy plaintext password is detected (no "b64:" prefix), re-save it
 * obfuscated with Remember=true (matches prior behavior where localStorage
 * was always used).
 */
ZO.Config._migrate = function () {
    var raw = localStorage.getItem('bemap_pass');
    if (raw && raw.indexOf('b64:') !== 0) {
        var env  = localStorage.getItem('bemap_env')  || '';
        var user = localStorage.getItem('bemap_user') || '';
        if (env && user) {
            ZO.Config.saveCreds(env, user, raw, true);
        }
    }
};

/** Returns readable label for an environment baseUrl. */
ZO.Config.envLabel = function (value) {
    var e = ZO.Config.ENVIRONMENTS.find(function (x) { return x.baseUrl === value; });
    return e ? e.label : value;
};

/** Finds environment config by baseUrl. */
ZO.Config.findEnv = function (baseUrl) {
    return ZO.Config.ENVIRONMENTS.find(function (x) { return x.baseUrl === baseUrl; }) || null;
};

/**
 * Builds a bemap.Context from current credentials.
 * Always returns a valid context (empty creds are OK - tiles will 401 quietly).
 * @returns {bemap.Context}
 */
ZO.Config.buildContext = function () {
    var c = ZO.Config.getCreds();
    var envConfig = ZO.Config.findEnv(c.env) || ZO.Config.ENVIRONMENTS[0];
    return new bemap.Context({
        login: c.user || '',
        password: c.pass || '',
        secure: true,
        host: envConfig.host,
        authInPost: false,
        geoserver: 'here'
    });
};

/** Renders config summary in the sidebar. */
ZO.Config.renderSummary = function () {
    var c = ZO.Config.getCreds();
    var $el = $('#config-summary');
    if (!c.env || !c.user) {
        $el.html('<span class="empty">Not configured</span>');
        return;
    }
    $el.empty()
       .append($('<div>').append($('<span>').addClass('label').text('Env: ')).append(document.createTextNode(ZO.Config.envLabel(c.env))))
       .append($('<div>').append($('<span>').addClass('label').text('User: ')).append(document.createTextNode(c.user)));
};

/** Fills the environment <select> in the modal. */
ZO.Config.fillEnvSelect = function () {
    var $sel = $('#modal-env');
    $.each(ZO.Config.ENVIRONMENTS, function (i, e) {
        $sel.append($('<option>')
            .val(e.baseUrl)
            .text(e.label + ' \u2014 ' + e.baseUrl));
    });
};

/** Opens the config modal. */
ZO.Config.openModal = function () {
    var c = ZO.Config.getCreds();
    $('#modal-env').val(c.env || ZO.Config.ENVIRONMENTS[0].baseUrl);
    $('#modal-user').val(c.user);
    $('#modal-pass').val(c.pass);
    $('#modal-remember').prop('checked', c.remember);
    $('#modal-err').text('');
    $('#config-modal').addClass('open');
    setTimeout(function () { $('#modal-user').trigger('focus'); }, 50);
};

/** Closes the config modal. */
ZO.Config.closeModal = function () {
    $('#config-modal').removeClass('open');
};

/** Initializes config UI event handlers. */
ZO.Config.init = function () {
    /* Migrate any v1.1.0 plaintext password first */
    ZO.Config._migrate();

    ZO.Config.fillEnvSelect();

    $('#open-config-btn').on('click', ZO.Config.openModal);

    $('#modal-cancel').on('click', function () {
        var c = ZO.Config.getCreds();
        if (!c.env || !c.user) {
            $('#modal-err').text('Configuration is required to use the application.');
            return;
        }
        ZO.Config.closeModal();
    });

    $('#modal-save').on('click', function () {
        var env      = $('#modal-env').val();
        var user     = $('#modal-user').val().trim();
        var pass     = $('#modal-pass').val();
        var remember = $('#modal-remember').is(':checked');
        if (!env || !user || !pass) {
            $('#modal-err').text('All fields are required.');
            return;
        }
        ZO.Config.saveCreds(env, user, pass, remember);
        ZO.Map.rebuildBaseLayer();
        ZO.Config.renderSummary();
        ZO.Config.closeModal();
        if (ZO.UI) ZO.UI.refresh();
    });

    /* Esc / Enter keyboard shortcuts inside the modal */
    $(document).on('keydown', function (e) {
        if (!$('#config-modal').hasClass('open')) return;
        if (e.key === 'Escape') $('#modal-cancel').trigger('click');
        else if (e.key === 'Enter' && $(e.target).is('#modal-user, #modal-pass, #modal-env, #modal-remember')) {
            $('#modal-save').trigger('click');
        }
    });

    ZO.Config.renderSummary();
};
