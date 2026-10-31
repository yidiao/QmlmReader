(function () {
    'use strict';

    var STATE_KEY = 'qmlm:state:v1';
    var LEGACY_PREFERENCES_KEY = 'qmlm:preferences:v1';
    var LEGACY_DARK_MODE_KEY = 'darkMode';

    function clone(value) {
        if (value == null || typeof value !== 'object') return value;
        return JSON.parse(JSON.stringify(value));
    }

    function isObject(value) {
        return !!value && typeof value === 'object' && !Array.isArray(value);
    }

    function mergeDeep(base, patch) {
        if (Array.isArray(patch)) return patch.slice();
        if (!isObject(patch)) return patch;

        var output = isObject(base) ? clone(base) : {};
        Object.keys(patch).forEach(function (key) {
            var next = patch[key];
            if (Array.isArray(next)) {
                output[key] = next.slice();
            } else if (isObject(next)) {
                output[key] = mergeDeep(output[key], next);
            } else {
                output[key] = next;
            }
        });
        return output;
    }

    function readJSON(key) {
        try {
            var raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch (err) {
            return null;
        }
    }

    function normalizePreferences(raw) {
        var state = isObject(raw) ? clone(raw) : {};
        state.favorites = Array.isArray(state.favorites) ? state.favorites : [];
        state.history = Array.isArray(state.history) ? state.history : [];
        state.view = isObject(state.view) ? state.view : {};
        state.view.mode = state.view.mode || 'card';
        state.view.density = state.view.density || 'normal';
        state.ui = isObject(state.ui) ? state.ui : {};
        state.ui.section = state.ui.section || 'favorites';
        return state;
    }

    function normalizeTheme(raw) {
        var state = isObject(raw) ? clone(raw) : {};
        if (typeof state.darkMode !== 'boolean') {
            try {
                state.darkMode = localStorage.getItem(LEGACY_DARK_MODE_KEY) === 'true';
            } catch (err) {
                state.darkMode = false;
            }
        }
        return state;
    }

    function normalizeRoot(raw) {
        var state = {
            preferences: normalizePreferences(),
            theme: normalizeTheme(),
            reader: {},
            search: {
                query: '',
                filters: {
                    authors: [],
                    categories: [],
                    priorities: []
                },
                resultCounts: null
            },
            ui: {}
        };

        if (!isObject(raw)) return state;

        if (raw.preferences || raw.theme || raw.reader || raw.search || raw.ui) {
            state = mergeDeep(state, raw);
        } else {
            state.preferences = normalizePreferences(raw);
        }

        state.preferences = normalizePreferences(state.preferences);
        state.theme = normalizeTheme(state.theme);
        state.reader = isObject(state.reader) ? state.reader : {};
        state.search = isObject(state.search) ? mergeDeep({
            query: '',
            filters: { authors: [], categories: [], priorities: [] },
            resultCounts: null
        }, state.search) : { query: '', filters: { authors: [], categories: [], priorities: [] }, resultCounts: null };
        state.search.filters = isObject(state.search.filters) ? state.search.filters : {};
        state.search.filters.authors = Array.isArray(state.search.filters.authors) ? state.search.filters.authors : [];
        state.search.filters.categories = Array.isArray(state.search.filters.categories) ? state.search.filters.categories : [];
        state.search.filters.priorities = Array.isArray(state.search.filters.priorities) ? state.search.filters.priorities : [];
        state.ui = isObject(state.ui) ? state.ui : {};
        return state;
    }

    function mergeUniqueByKey(primary, secondary) {
        var output = [];
        var seen = {};
        function addList(list) {
            if (!Array.isArray(list)) return;
            list.forEach(function (item) {
                if (!item || !item.key || seen[item.key]) return;
                seen[item.key] = true;
                output.push(clone(item));
            });
        }
        addList(primary);
        addList(secondary);
        return output;
    }

    function mergePreferences(current, legacy) {
        current = normalizePreferences(current);
        legacy = normalizePreferences(legacy);
        return normalizePreferences({
            favorites: mergeUniqueByKey(current.favorites, legacy.favorites),
            history: mergeUniqueByKey(current.history, legacy.history).slice(0, 50),
            view: mergeDeep(legacy.view, current.view),
            ui: mergeDeep(legacy.ui, current.ui)
        });
    }

    function loadState() {
        var root = normalizeRoot(readJSON(STATE_KEY));
        var legacy = readJSON(LEGACY_PREFERENCES_KEY);
        if (legacy) {
            root.preferences = mergePreferences(root.preferences, legacy);
        }
        return root;
    }

    var state = loadState();
    var listeners = [];
    var listenerId = 0;

    function selectValue(selector, snapshot) {
        if (!selector) return snapshot;
        if (typeof selector === 'function') return selector(snapshot);
        if (typeof selector === 'string') {
            var parts = selector.split('.');
            var current = snapshot;
            for (var i = 0; i < parts.length; i++) {
                if (!current) return undefined;
                current = current[parts[i]];
            }
            return current;
        }
        return snapshot;
    }

    function emitChange(domain, source, previous) {
        var snapshot = clone(state);
        var prevSnapshot = previous ? clone(previous) : null;

        for (var i = 0; i < listeners.length; i++) {
            var listener = listeners[i];
            if (!listener || typeof listener.callback !== 'function') continue;
            try {
                var nextValue = selectValue(listener.selector, snapshot);
                var prevValue = prevSnapshot ? selectValue(listener.selector, prevSnapshot) : undefined;
                if (listener.selector && JSON.stringify(nextValue) === JSON.stringify(prevValue)) continue;
                listener.callback(nextValue, snapshot, {
                    domain: domain || null,
                    source: source || 'state-center',
                    previous: prevSnapshot
                });
            } catch (err) {
                // 单个订阅失败不影响其他订阅者
            }
        }

        window.dispatchEvent(new CustomEvent('qmlm:state-changed', {
            detail: {
                domain: domain || null,
                source: source || 'state-center',
                state: snapshot,
                previous: prevSnapshot
            }
        }));

        if (domain === 'preferences') {
            window.dispatchEvent(new CustomEvent('qmlm:preferences-changed', {
                detail: {
                    source: source || 'state-center',
                    state: clone(state.preferences)
                }
            }));
        }

        if (domain === 'theme') {
            window.dispatchEvent(new CustomEvent('qmlm:theme-changed', {
                detail: {
                    source: source || 'state-center',
                    state: clone(state.theme)
                }
            }));
        }
    }

    function persistentSnapshot() {
        return {
            preferences: clone(state.preferences),
            theme: clone(state.theme)
        };
    }

    function persist() {
        try {
            localStorage.setItem(STATE_KEY, JSON.stringify(persistentSnapshot()));
            localStorage.setItem(LEGACY_PREFERENCES_KEY, JSON.stringify(state.preferences));
            localStorage.setItem(LEGACY_DARK_MODE_KEY, state.theme.darkMode ? 'true' : 'false');
        } catch (err) {
            // localStorage 不可用时保持内存态
        }
    }

    function hydrate() {
        var previous = clone(state);
        state = loadState();
        persist();
        emitChange('state', 'hydrate', previous);
        return getState();
    }

    function getState() {
        return clone(state);
    }

    function getPreferences() {
        return clone(state.preferences);
    }

    function getTheme() {
        return clone(state.theme);
    }

    function getSearch() {
        return clone(state.search);
    }

    function normalizeDomainName(domain) {
        domain = String(domain || '').trim();
        return /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(domain) ? domain : '';
    }

    function getDomain(domain) {
        domain = normalizeDomainName(domain);
        if (!domain) return undefined;
        return clone(state[domain]);
    }

    function applyRootPatch(patch, source) {
        var previous = clone(state);
        state = normalizeRoot(mergeDeep(state, patch));
        persist();
        emitChange(null, source || 'state-center', previous);
        return getState();
    }

    function setPreferences(nextPreferences, source) {
        var previous = clone(state);
        state.preferences = normalizePreferences(nextPreferences);
        persist();
        emitChange('preferences', source || 'preferences', previous);
        return getPreferences();
    }

    function setTheme(nextTheme, source) {
        var previous = clone(state);
        state.theme = normalizeTheme(nextTheme);
        persist();
        emitChange('theme', source || 'theme', previous);
        return getTheme();
    }

    function setReader(nextReader, source) {
        var previous = clone(state);
        state.reader = isObject(nextReader) ? clone(nextReader) : {};
        emitChange('reader', source || 'reader', previous);
        return clone(state.reader);
    }

    function patchReader(patch, source) {
        return setReader(mergeDeep(state.reader, patch || {}), source || 'reader/patch');
    }

    function setSearch(nextSearch, source) {
        var previous = clone(state);
        state.search = normalizeRoot({ search: nextSearch }).search;
        emitChange('search', source || 'search', previous);
        return clone(state.search);
    }

    function patchSearch(patch, source) {
        return setSearch(mergeDeep(state.search, patch || {}), source || 'search/patch');
    }

    function setUi(nextUi, source) {
        var previous = clone(state);
        state.ui = isObject(nextUi) ? clone(nextUi) : {};
        emitChange('ui', source || 'ui', previous);
        return clone(state.ui);
    }

    function patchUi(patch, source) {
        return setUi(mergeDeep(state.ui, patch || {}), source || 'ui/patch');
    }

    function setDomain(domain, value, source) {
        domain = normalizeDomainName(domain);
        if (!domain) return undefined;
        if (domain === 'preferences') return setPreferences(value, source || 'domain/set');
        if (domain === 'theme') return setTheme(value, source || 'domain/set');
        if (domain === 'reader') return setReader(value, source || 'domain/set');
        if (domain === 'search') return setSearch(value, source || 'domain/set');
        if (domain === 'ui') return setUi(value, source || 'domain/set');
        var previous = clone(state);
        state[domain] = isObject(value) ? clone(value) : value;
        emitChange(domain, source || 'domain/set', previous);
        return getDomain(domain);
    }

    function patchDomain(domain, patch, source) {
        domain = normalizeDomainName(domain);
        if (!domain) return undefined;
        var current = state[domain];
        var next = isObject(current) ? mergeDeep(current, patch || {}) : patch;
        return setDomain(domain, next, source || 'domain/patch');
    }

    function unsubscribe(token) {
        for (var i = listeners.length - 1; i >= 0; i--) {
            if (listeners[i] === token || listeners[i].id === token) {
                listeners.splice(i, 1);
                break;
            }
        }
    }

    function subscribe(selector, callback) {
        if (typeof selector === 'function') {
            callback = selector;
            selector = null;
        }
        if (typeof callback !== 'function') return function () {};
        var entry = { id: ++listenerId, selector: selector, callback: callback };
        listeners.push(entry);
        var remove = function () { unsubscribe(entry); };
        remove.id = entry.id;
        return remove;
    }

    function dispatch(action, payload, source) {
        switch (action) {
            case 'preferences/set':
                return setPreferences(payload, source || action);
            case 'preferences/patch':
                return setPreferences(mergeDeep(getPreferences(), payload), source || action);
            case 'preferences/section':
                return setPreferences(mergeDeep(getPreferences(), { ui: { section: payload } }), source || action);
            case 'theme/set':
                return setTheme(payload, source || action);
            case 'theme/toggle':
                return setTheme({ darkMode: !state.theme.darkMode }, source || action);
            case 'reader/set':
                return setReader(payload, source || action);
            case 'reader/patch':
                return patchReader(payload, source || action);
            case 'search/set':
                return setSearch(payload, source || action);
            case 'search/patch':
                return patchSearch(payload, source || action);
            case 'ui/set':
                return setUi(payload, source || action);
            case 'ui/patch':
                return patchUi(payload, source || action);
            case 'domain/set':
                return payload ? setDomain(payload.domain, payload.value, source || action) : undefined;
            case 'domain/patch':
                return payload ? patchDomain(payload.domain, payload.patch, source || action) : undefined;
            case 'state/set':
                return applyRootPatch(payload, source || action);
            default:
                return getState();
        }
    }

    function syncFromStorage(storageKey) {
        if (storageKey === STATE_KEY) {
            var nextRoot = readJSON(STATE_KEY);
            if (nextRoot) {
                var previousRoot = clone(state);
                state = normalizeRoot(nextRoot);
                emitChange(null, 'storage', previousRoot);
                return;
            }
        }

        if (storageKey === LEGACY_PREFERENCES_KEY) {
            var nextPrefs = readJSON(LEGACY_PREFERENCES_KEY);
            if (nextPrefs) {
                setPreferences(nextPrefs, 'storage');
            }
            return;
        }

        if (storageKey === LEGACY_DARK_MODE_KEY) {
            setTheme({ darkMode: localStorage.getItem(LEGACY_DARK_MODE_KEY) === 'true' }, 'storage');
        }
    }

    window.addEventListener('storage', function (e) {
        if (!e || !e.key) return;
        if (e.key === STATE_KEY || e.key === LEGACY_PREFERENCES_KEY || e.key === LEGACY_DARK_MODE_KEY) {
            syncFromStorage(e.key);
        }
    });

    try {
        persist();
    } catch (err) {
        // ignore
    }

    window.QMLMState = {
        getState: getState,
        getPreferences: getPreferences,
        setPreferences: setPreferences,
        getTheme: getTheme,
        setTheme: setTheme,
        setReader: setReader,
        patchReader: patchReader,
        getSearch: getSearch,
        setSearch: setSearch,
        patchSearch: patchSearch,
        getDomain: getDomain,
        setDomain: setDomain,
        patchDomain: patchDomain,
        setUi: setUi,
        patchUi: patchUi,
        setState: applyRootPatch,
        subscribe: subscribe,
        unsubscribe: unsubscribe,
        dispatch: dispatch,
        hydrate: hydrate,
        persist: persist,
        normalizePreferences: normalizePreferences,
        normalizeTheme: normalizeTheme
    };

    window.dispatchEvent(new CustomEvent('qmlm:state-ready', {
        detail: { state: getState() }
    }));
})();
