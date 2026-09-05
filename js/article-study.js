(function () {
    'use strict';

    function escapeHtml(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
        });
    }

    function asArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function renderListItems(items) {
        return asArray(items).map(function (item) {
            return '<li>' + escapeHtml(item) + '</li>';
        }).join('');
    }

    function renderItemBody(item) {
        var html = '';
        if (item && item.content) {
            html += '<p>' + escapeHtml(item.content) + '</p>';
        }
        if (Array.isArray(item && item.items) && item.items.length) {
            html += '<ul>' + renderListItems(item.items) + '</ul>';
        }
        return html;
    }

    function renderStatusCard(title, detail) {
        return '<div class="warning-box"><p><strong>' + escapeHtml(title) + '</strong></p>' + (detail ? '<p>' + escapeHtml(detail) + '</p>' : '') + '</div>';
    }

    function ensureTabTarget(tabId, wrapperClass, heading) {
        var tab = document.getElementById(tabId);
        if (!tab) return null;
        var wrapper = tab.querySelector('.' + wrapperClass);
        if (wrapper) return wrapper;
        tab.innerHTML = '<div class="' + wrapperClass + '"><h2 class="tab-heading"> ' + escapeHtml(heading) + '</h2></div>';
        return tab.querySelector('.' + wrapperClass);
    }

    function renderReading(items) {
        var target = ensureTabTarget('reading', 'reading-guide', '如何阅读本文');
        if (!target) return;
        var list = asArray(items);
        target.innerHTML = '<h2 class="tab-heading"> 如何阅读本文</h2>' + list.map(function (item) {
            return '<div class="guide-block"><h3>' + escapeHtml(item.title || '') + '</h3>' + renderItemBody(item) + '</div>';
        }).join('');
    }

    function renderDifficulty(items) {
        var target = ensureTabTarget('difficulty', 'difficulty-section', '容易读错的地方');
        if (!target) return;
        var list = asArray(items);
        target.innerHTML = '<h2 class="tab-heading"> 容易读错的地方</h2>' + list.map(function (item) {
            return '<div class="diff-item"><div class="wrong"> 常见误读：' + escapeHtml(item.wrong || '') + '</div><div class="correct"> 正解：' + escapeHtml(item.correct || '') + '</div></div>';
        }).join('');
    }

    function renderDialogue(items) {
        var target = ensureTabTarget('dialogue', 'dialogue-section', '这篇文章在回应谁？');
        if (!target) return;
        var list = asArray(items);
        target.innerHTML = '<h2 class="tab-heading"> 这篇文章在回应谁？</h2>' + list.map(function (item) {
            return '<div class="dialogue-block"><h3>' + escapeHtml(item.title || '') + '</h3>' + renderItemBody(item) + '</div>';
        }).join('');
    }

    function renderAction(items) {
        var target = ensureTabTarget('action', 'action-section', '读完之后可以做什么');
        if (!target) return;
        var list = asArray(items);
        target.innerHTML = '<h2 class="tab-heading"> 读完之后可以做什么</h2>' + list.map(function (item) {
            return '<div class="action-item"><h3>' + escapeHtml(item.title || '') + '</h3>' + renderItemBody(item) + '</div>';
        }).join('');
    }

    function getDirectionLabel(item) {
        if (item && item.directionLabel) return String(item.directionLabel);
        switch (item && item.direction) {
            case 'source': return '理论来源';
            case 'output': return '输出影响';
            case 'mutual': return '相互支撑';
            default: return '';
        }
    }

    function normalizeFurther(further) {
        var config = Array.isArray(further) ? { items: further } : (further && typeof further === 'object' ? further : {});
        var items = asArray(config.items || config);
        var isNetwork = items.some(function (item) {
            return item && (item.direction || item.directionLabel || item.relation || item.label || item.category);
        });
        return {
            title: config.title || (isNetwork ? '文章联结网络' : '延伸阅读'),
            note: config.note || (isNetwork ? '点击已收录文章直接跳转阅读；箭头方向表示思想影响流向（输出影响 · 理论来源 · 相互支撑）' : ''),
            items: items,
            isNetwork: isNetwork
        };
    }

    function renderFurther(further) {
        var target = document.querySelector('#puzzle .puzzle-links');
        if (!target) return;
        var config = normalizeFurther(further);
        var cardsHtml = config.items.map(function (item) {
            var directionLabel = getDirectionLabel(item);
            var directionHtml = directionLabel ? '<span class="conn-dir" data-direction="' + escapeHtml(item.direction || '') + '">' + escapeHtml(directionLabel) + '</span>' : '';
            var labelHtml = item && item.label ? '<span class="conn-label">' + escapeHtml(item.label) + '</span>' : '';
            var relationHtml = item && item.relation ? '<span class="conn-relation">' + escapeHtml(item.relation) + '</span>' : (item && item.content ? '<span class="conn-relation">' + escapeHtml(item.content) + '</span>' : '');
            var cardInner = directionHtml + '<span class="conn-title">' + escapeHtml(item && item.title || '') + '</span>' + labelHtml + relationHtml;
            var categoryAttr = item && item.category ? ' data-category="' + escapeHtml(item.category) + '"' : '';
            if (item && item.href) {
                return '<a href="' + escapeHtml(item.href) + '" class="conn-card"' + categoryAttr + '>' + cardInner + '</a>';
            }
            return '<div class="conn-card"' + categoryAttr + '>' + cardInner + '</div>';
        }).join('');

        target.innerHTML = '<h3>' + escapeHtml(config.title) + '</h3>' +
            (config.note ? '<p class="puzzle-links-note">' + escapeHtml(config.note) + '</p>' : '') +
            (cardsHtml ? '<div class="conn-grid">' + cardsHtml + '</div>' : renderStatusCard('暂无联结文章', '当前还没有配置这一页的关系网络。'));
    }

    function applyVisualConfig(visual) {
        var charts = visual && Array.isArray(visual.charts) ? visual.charts : [];
        if (!charts.length) return;
        window.ARTICLE_CHARTS = charts;
        var visualTab = document.getElementById('visual');
        if (visualTab && visualTab.classList.contains('active') && window.initArticleChartsNow) {
            window.initArticleChartsNow();
        }
    }

    function renderErrorState() {
        var reading = document.querySelector('#reading .reading-guide');
        if (reading) reading.innerHTML = '<h2 class="tab-heading"> 如何阅读本文</h2>' + renderStatusCard('精读数据加载失败', '请稍后刷新重试。');

        var difficulty = document.querySelector('#difficulty .difficulty-section');
        if (difficulty) difficulty.innerHTML = '<h2 class="tab-heading"> 容易读错的地方</h2>' + renderStatusCard('精读数据加载失败', '当前未能读取难点解析数据。');

        var dialogue = document.querySelector('#dialogue .dialogue-section');
        if (dialogue) dialogue.innerHTML = '<h2 class="tab-heading"> 这篇文章在回应谁？</h2>' + renderStatusCard('精读数据加载失败', '当前未能读取对话空间数据。');

        var action = document.querySelector('#action .action-section');
        if (action) action.innerHTML = '<h2 class="tab-heading"> 读完之后可以做什么</h2>' + renderStatusCard('精读数据加载失败', '当前未能读取行动实验数据。');

        var puzzleLinks = document.querySelector('#puzzle .puzzle-links');
        if (puzzleLinks) puzzleLinks.innerHTML = '<h3>文章联结网络</h3>' + renderStatusCard('精读数据加载失败', '当前未能读取文章联结网络数据。');
    }

    function renderStudy(article) {
        if (!article) return;
        renderReading(article.reading);
        renderDifficulty(article.difficulty);
        renderDialogue(article.dialogue);
        renderAction(article.action);
        renderFurther(article.further);
        applyVisualConfig(article.visual);
    }

    function markStudyRendered() {
        window.__QMLMStudyRendered = true;
        window.dispatchEvent(new Event('qmlm:article-study-rendered'));
    }

    function loadStudyJson() {
        var jsonPath = document.body.getAttribute('data-study-json');
        if (!jsonPath) return;
        fetch(jsonPath, { cache: 'no-store' })
            .then(function (response) {
                if (!response.ok) throw new Error('精读数据加载失败：' + jsonPath + '（HTTP ' + response.status + '）');
                return response.json();
            })
            .then(function (article) {
                renderStudy(article);
                markStudyRendered();
            })
            .catch(function (error) {
                console.error(error);
                renderErrorState();
                markStudyRendered();
            });
    }

    document.addEventListener('DOMContentLoaded', loadStudyJson);

    window.ArticleStudyRenderer = {
        renderStudy: renderStudy,
        normalizeFurther: normalizeFurther
    };
})();
