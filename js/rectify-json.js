(function () {
    'use strict';

    function escapeHtml(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
        });
    }

    function inline(text) {
        var safe = escapeHtml(text);
        // **bold** markers restored as <strong>, applied after escaping
        safe = safe.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        return safe;
    }

    function el(tag, cls, html) {
        return '<' + tag + (cls ? ' class="' + cls + '"' : '') + '>' + html + '</' + tag + '>';
    }

    function renderBlock(b) {
        if (!b || !b.t) return '';
        switch (b.t) {
            case 'h2': return el('h2', '', inline(b.x || ''));
            case 'h3': return el('h3', '', inline(b.x || ''));
            case 'h4': return el('h4', '', inline(b.x || ''));
            case 'p':
                var cls = '';
                if (b.x && b.x.indexOf('关键词：') === 0) cls = 'keywords';
                return el('p', cls, inline(b.x || ''));
            case 'ul':
                var items = (b.items || []).map(function (i) {
                    return el('li', '', inline(i.x || ''));
                }).join('');
                return el('ul', '', items);
            case 'quote':
                return el('blockquote', '', el('p', '', inline(b.x || '')));
            case 'box':
                var children = (b.children || []).map(renderBlock).join('');
                return el('div', b.cls || 'highlight-box', children);
            case 'table':
                var rows = (b.rows || []).map(function (row) {
                    var tag = row.h ? 'th' : 'td';
                    var cells = (row.cells || []).map(function (c) {
                        return el(tag, '', inline(c || ''));
                    }).join('');
                    return el('tr', '', cells);
                }).join('');
                return el('table', 'data-table', rows);
            case 'timeline':
                var items = (b.items || []).map(function (i) {
                    return el('div', 'timeline-item',
                        el('div', 'timeline-year', inline(i.y || '')) +
                        el('p', '', inline(i.x || '')));
                }).join('');
                return el('div', 'timeline', items);
            case 'hr': return '<hr>';
            default: return '';
        }
    }

    function renderStatus(heading, detail) {
        var target = document.querySelector('.article-content');
        if (!target) return;
        var box = el('div', 'warning-box',
            el('p', '', '<strong>' + escapeHtml(heading) + '</strong>' + (detail ? el('p', '', escapeHtml(detail)) : '')));
        var old = target.querySelector('.rectify-loading');
        if (old) old.remove();
        var footer = target.querySelector('.article-footer');
        if (footer) footer.insertAdjacentHTML('beforebegin', box);
        else target.insertAdjacentHTML('afterbegin', box);
    }

    function render(jsonUrl) {
        var target = document.querySelector('.article-content');
        if (!target) return;
        fetch(jsonUrl, { cache: 'no-store' }).then(function (resp) {
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            return resp.json();
        }).then(function (article) {
            var chapters = (article && article.original && article.original.chapters) || [];
            var html = chapters.map(function (ch) {
                var parts = [];
                if (ch.title) parts.push(el('h2', '', inline(ch.title)));
                (ch.blocks || []).forEach(function (b) { parts.push(renderBlock(b)); });
                return parts.join('\n');
            }).join('\n');
            var placeholder = target.querySelector('.rectify-loading');
            if (placeholder) placeholder.remove();
            var footer = target.querySelector('.article-footer');
            if (footer) footer.insertAdjacentHTML('beforebegin', html);
            else target.insertAdjacentHTML('afterbegin', html);
            document.dispatchEvent(new CustomEvent('qmlm:article-rendered', { detail: { slug: article && article.slug } }));
        }).catch(function (err) {
            renderStatus('正文加载失败', (err && err.message ? err.message : '') + '（' + jsonUrl + '）');
        });
    }

    var jsonUrl = document.body.getAttribute('data-article-json');
    if (jsonUrl) render(jsonUrl);
})();
