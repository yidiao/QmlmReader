(function () {
    'use strict';

    function hasStateCenter() {
        return !!(window.QMLMState && typeof window.QMLMState.patchDomain === 'function');
    }

    function normalizeDomain(domain) {
        domain = String(domain || '').trim();
        return /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(domain) ? domain : 'page';
    }

    function get(domain) {
        domain = normalizeDomain(domain);
        if (window.QMLMState && typeof window.QMLMState.getDomain === 'function') {
            return window.QMLMState.getDomain(domain) || {};
        }
        return {};
    }

    function set(domain, value, source) {
        domain = normalizeDomain(domain);
        if (window.QMLMState && typeof window.QMLMState.setDomain === 'function') {
            return window.QMLMState.setDomain(domain, value || {}, source || 'page-state-adapter');
        }
        return value || {};
    }

    function patch(domain, value, source) {
        domain = normalizeDomain(domain);
        if (window.QMLMState && typeof window.QMLMState.patchDomain === 'function') {
            return window.QMLMState.patchDomain(domain, value || {}, source || 'page-state-adapter');
        }
        return value || {};
    }

    function normalizeSelector(selector) {
        selector = String(selector || '').trim();
        return /^[a-zA-Z][a-zA-Z0-9_-]*(\.[a-zA-Z][a-zA-Z0-9_-]*)*$/.test(selector) ? selector : 'page';
    }

    function subscribe(selector, callback) {
        selector = normalizeSelector(selector);
        if (window.QMLMState && typeof window.QMLMState.subscribe === 'function') {
            return window.QMLMState.subscribe(selector, callback);
        }
        return function () {};
    }

    function bindToggle(options) {
        options = options || {};
        var domain = normalizeDomain(options.domain);
        var key = options.key || 'open';
        var root = options.root || document;
        var trigger = typeof options.trigger === 'string' ? root.querySelector(options.trigger) : options.trigger;
        var target = typeof options.target === 'string' ? root.querySelector(options.target) : options.target;
        var activeClass = options.activeClass || 'active';
        if (!trigger || !target) return function () {};

        function apply(value) {
            target.classList.toggle(activeClass, !!value);
            trigger.setAttribute('aria-expanded', value ? 'true' : 'false');
        }

        trigger.addEventListener('click', function () {
            var current = get(domain);
            var next = !current[key];
            apply(next);
            patch(domain, Object.assign({}, current, { [key]: next }), options.source || 'page-toggle');
        });

        var initial = get(domain);
        if (typeof initial[key] === 'boolean') apply(initial[key]);

        return subscribe(domain + '.' + key, function (value) {
            if (typeof value === 'boolean') apply(value);
        });
    }

    function onReady(callback) {
        if (hasStateCenter()) {
            callback(window.QMLMState);
            return;
        }
        window.addEventListener('qmlm:state-ready', function () {
            callback(window.QMLMState);
        }, { once: true });
    }

    window.QMLMPageState = {
        get: get,
        set: set,
        patch: patch,
        subscribe: subscribe,
        bindToggle: bindToggle,
        onReady: onReady
    };
})();
