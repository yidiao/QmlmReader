(function () {
    'use strict';

    var labels = {
        philosophy: '哲学基础',
        economics: '政治经济学',
        politics: '政治理论',
        party: '党的建设',
        military: '军事战略',
        culture: '思想文化'
    };
    var aliases = {
        '哲学基础': 'philosophy', '政治经济学': 'economics', '政治理论': 'politics',
        '党的建设': 'party', '军事战略': 'military', '思想文化': 'culture',
        economy: 'economics', philosophy: 'philosophy', politics: 'politics', party: 'party', military: 'military', culture: 'culture'
    };

    function normalize(category) {
        return aliases[String(category == null ? '' : category).trim().toLowerCase()] || '';
    }

    function get(category) {
        var key = normalize(category);
        return key ? { key: key, label: labels[key] } : null;
    }

    function applyTo(element, category) {
        if (!element) return null;
        var theme = get(category);
        if (!theme) return null;
        element.setAttribute('data-category', theme.key);
        element.setAttribute('data-category-label', theme.label);
        return theme;
    }

    function color(category, token) {
        var theme = get(category);
        if (!theme || !document.documentElement) return '';
        return getComputedStyle(document.documentElement).getPropertyValue('--category-' + theme.key + '-' + (token || 'primary')).trim();
    }

    function applyDocument(root) {
        var scope = root || document;
        if (document.body && document.body.getAttribute('data-category')) applyTo(document.body, document.body.getAttribute('data-category'));
        var nodes = scope.querySelectorAll ? scope.querySelectorAll('[data-category]') : [];
        for (var i = 0; i < nodes.length; i++) {
            applyTo(nodes[i], nodes[i].getAttribute('data-category'));
        }
    }

    window.QMLMCategoryTheme = { labels: labels, normalize: normalize, get: get, color: color, applyTo: applyTo, applyDocument: applyDocument };
    applyDocument(document);
    window.dispatchEvent(new CustomEvent('qmlm:category-theme-ready'));
})();
