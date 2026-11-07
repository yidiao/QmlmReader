// ============================================================
// 搜索索引 v2 — 覆盖：经典文章 / 文艺视频 / 正名文章 / 历史大事件
// ============================================================

// ------ 1. 经典文章索引 ------
var articleIndex = (window.SITE_DATA && window.SITE_DATA.articleIndex) ? window.SITE_DATA.articleIndex : [];

// ------ 2. 文艺视频索引 ------
var galleryIndex = (window.SITE_DATA && window.SITE_DATA.galleryIndex) ? window.SITE_DATA.galleryIndex : [];

// ------ 3. 正名文章索引 ------
var rectifyIndex = (window.SITE_DATA && window.SITE_DATA.rectifyIndex) ? window.SITE_DATA.rectifyIndex : [];
// 数据源统一为 js/site-data.js（架构规则：所有页面在 search.js 之前同步加载它）。
// SITE_DATA 缺失时索引降级为空数组：performSearch 走“暂无结果”空态，不抛异常。
if (!(window.SITE_DATA && window.SITE_DATA.articleIndex)) {
    console.error('[search] js/site-data.js 未加载或缺少 SITE_DATA.articleIndex，搜索索引不可用（搜索返回空结果）。请确认页面在 js/search.js 之前同步加载 js/site-data.js。');
}

// ------ 4. 国际专栏索引 ------
var columnIndex = (window.SITE_DATA && window.SITE_DATA.columnIndex) ? window.SITE_DATA.columnIndex : [
    {
        title: '铁流与先锋——中俄早期革命中的党与阶级',
        file: 'international/international-column/tieliu-yu-xianfeng.html',
        type: 'column',
        category: '国际专栏',
        summary: '从中俄早期革命经验考察政党、阶级与革命先锋之间的关系。',
        keywords: ['中俄革命', '先锋队', '政党', '阶级', '国际共运']
    },
    {
        title: '包围圈的破产——苏联反法西斯集体安全的失败（1921—1939）',
        file: 'international/international-column/encirclement.html',
        type: 'column',
        category: '国际专栏',
        summary: '回顾两次世界大战之间苏联集体安全政策及反法西斯包围圈的形成与破产。',
        keywords: ['苏联', '反法西斯', '集体安全', '国际关系', '包围圈']
    },
    {
        title: '地基——自然条件对社会制度的制约',
        file: 'international/international-column/foundations.html',
        type: 'column',
        category: '国际专栏',
        summary: '讨论自然条件、生产基础与社会制度形成之间的约束关系。',
        keywords: ['自然条件', '社会制度', '生产力', '历史唯物主义', '地基']
    }
];

// ------ 5. 历史大事件索引（动态从 historyData 构建，若已加载） ------
// 这部分在 performSearch 中动态引用 historyData

// ============================================================
// 全局筛选状态
// ============================================================
let currentFilters = {
    authors: [],
    categories: [],
    priorities: []
};

function getHtmlPrefix() {
    var path = window.location.pathname;
    var dir = path.replace(/\/[^\/]*\.html$/, '');
    var parts = dir.split('/').filter(function (p) { return p.length > 0; });
    var htmlIdx = parts.indexOf('html');
    var depth = htmlIdx === -1 ? 0 : parts.length - htmlIdx - 1;
    var p = '';
    for (var i = 0; i < depth; i++) p += '../';
    return p;
}

function resolveSearchHref(file) {
    if (!file) return '';
    var href = String(file).replace(/^\.\//, '');
    if (/^(?:[a-z]+:)?\/\//i.test(href) || href.charAt(0) === '#') return href;
    return getHtmlPrefix() + href;
}

function getSearchInputs() {
    var inputs = Array.prototype.slice.call(document.querySelectorAll('[data-search-input]'));
    var fallback = document.getElementById('searchInput');
    if (fallback && inputs.indexOf(fallback) === -1) inputs.push(fallback);
    return inputs;
}

function getSearchResultsContainer(inputEl) {
    if (inputEl && inputEl.dataset && inputEl.dataset.resultsTarget) {
        var target = document.getElementById(inputEl.dataset.resultsTarget);
        if (target) return target;
    }
    return document.getElementById('searchResults');
}

function getSearchInputValue(inputEl) {
    var input = inputEl || getSearchInputs()[0] || null;
    return input ? input.value.trim().toLowerCase() : '';
}

function publishSearchState(query, resultCounts) {
    if (!window.QMLMState || typeof window.QMLMState.dispatch !== 'function') return;
    window.QMLMState.dispatch('search/patch', {
        query: query || '',
        filters: {
            authors: currentFilters.authors.slice(),
            categories: currentFilters.categories.slice(),
            priorities: currentFilters.priorities.slice()
        },
        resultCounts: resultCounts || null
    }, 'search');
}

function readSearchState() {
    if (!window.QMLMState || typeof window.QMLMState.getSearch !== 'function') return null;
    return window.QMLMState.getSearch();
}

function normalizeSearchFilters(filters) {
    filters = filters && typeof filters === 'object' ? filters : {};
    return {
        authors: Array.isArray(filters.authors) ? filters.authors.slice() : [],
        categories: Array.isArray(filters.categories) ? filters.categories.slice() : [],
        priorities: Array.isArray(filters.priorities) ? filters.priorities.slice() : []
    };
}

function applySearchStateToPage(searchState) {
    if (!searchState || typeof searchState !== 'object') return;
    const filters = normalizeSearchFilters(searchState.filters);
    currentFilters = filters;

    getSearchInputs().forEach(function (searchInput) {
        if (typeof searchState.query === 'string' && searchInput.value !== searchState.query) {
            searchInput.value = searchState.query;
        }
    });

    document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
        const value = btn.dataset.filter;
        if (['mao', 'lenin', 'marx', 'stalin', 'engels'].includes(value)) {
            btn.classList.toggle('active', filters.authors.includes(value));
        }
    });

    document.querySelectorAll('.filter-btn[data-priority]').forEach(btn => {
        const value = btn.dataset.priority;
        if (['5', '4', '3'].includes(value)) {
            btn.classList.toggle('active', filters.priorities.includes(value));
        }
    });
}

function updateFilters(author) {
    if (author) {
        const idx = currentFilters.authors.indexOf(author);
        if (idx === -1) currentFilters.authors.push(author);
        else currentFilters.authors.splice(idx, 1);
    }
    publishSearchState(getSearchInputValue(), null);
}

function resetFilters() {
    currentFilters = { authors: [], categories: [], priorities: [] };
    getSearchInputs().forEach(function (searchInput) { searchInput.value = ''; });
    applySearchStateToPage({ query: '', filters: currentFilters, resultCounts: null });
    publishSearchState('', null);
}

// ============================================================
// 执行搜索
// ============================================================
function performSearch(inputEl) {
    const searchInput = inputEl || getSearchInputs()[0];
    const query = getSearchInputValue(searchInput);
    const resultsContainer = getSearchResultsContainer(searchInput);
    if (!resultsContainer) return;

    if (!query) {
        resultsContainer.innerHTML = '';
        resultsContainer.classList.remove('active');
        publishSearchState('', null);
        return;
    }

    const allResults = [];

    // ---- 搜索经典文章 ----
    let filteredArticles = articleIndex;
    if (currentFilters.authors.length > 0)
        filteredArticles = filteredArticles.filter(i => currentFilters.authors.includes(i.authorKey));
    if (currentFilters.priorities.length > 0)
        filteredArticles = filteredArticles.filter(i => currentFilters.priorities.includes(i.priority));

    filteredArticles.forEach(item => {
        const text = [item.title, item.author, item.category, item.year, item.keywords.join(' ')].join(' ').toLowerCase();
        if (text.includes(query)) {
            allResults.push({ _type: 'article', _score: item.priority === '5' ? 3 : 2, ...item });
        }
    });

    // ---- 搜索文艺内容 ----
    galleryIndex.forEach(item => {
        const text = [item.title, item.category, item.year || '', item.keywords.join(' ')].join(' ').toLowerCase();
        if (text.includes(query)) {
            allResults.push({ _type: 'gallery', _score: 1, ...item });
        }
    });

    // ---- 搜索正名文章 ----
    rectifyIndex.forEach(item => {
        const text = [item.title, item.category, item.summary, item.keywords.join(' ')].join(' ').toLowerCase();
        if (text.includes(query)) {
            allResults.push({ _type: 'rectify', _score: 2, ...item });
        }
    });

    // ---- 搜索国际专栏 ----
    columnIndex.forEach(item => {
        const text = [item.title, item.category, item.summary, item.keywords.join(' ')].join(' ').toLowerCase();
        if (text.includes(query)) {
            allResults.push({ _type: 'column', _score: 2, ...item });
        }
    });

    // ---- 搜索历史大事件 ----
    const eventResults = [];
    if (typeof historyData !== 'undefined') {
        Object.values(historyData).forEach(monthEvents => {
            monthEvents.forEach(event => {
                const text = [event.title, event.desc, event.date, String(event.year), event.category || ''].join(' ').toLowerCase();
                if (text.includes(query)) {
                    eventResults.push({
                        _type: 'event',
                        _score: 1,
                        title: event.title,
                        year: String(event.year),
                        date: event.date,
                        desc: event.desc,
                        nature: event.nature,
                        category: event.category || 'neutral',
                        file: 'international/international-calendar.html'
                    });
                }
            });
        });
        // 最多显示 5 条历史事件，按年份倒序
        eventResults.sort((a, b) => parseInt(b.year) - parseInt(a.year));
        allResults.push(...eventResults.slice(0, 5));
    }

    // 按 _score 降序、_type:article 优先排序
    allResults.sort((a, b) => b._score - a._score);

    // ---- 渲染结果 ----
    if (allResults.length === 0) {
        publishSearchState(query, { total: 0, article: 0, gallery: 0, rectify: 0, column: 0, event: 0 });
        resultsContainer.innerHTML = `
            <div class="search-no-results">
                <div style="font-size:2rem;margin-bottom:8px;">🔍</div>
                <div style="font-weight:600;margin-bottom:6px;">暂无结果</div>
                <div style="font-size:0.9em;color:#999;">或许你搜索错了，或许笔者还未施工</div>
                <div style="margin-top:12px;font-size:0.85em;color:#aaa;">建议尝试：简化关键词 · 不同作者 · 不同分类</div>
            </div>`;
        resultsContainer.classList.add('active');
        return;
    }

    // 统计各类数量
    const counts = { article: 0, gallery: 0, rectify: 0, column: 0, event: 0 };
    allResults.forEach(r => counts[r._type]++);
    publishSearchState(query, {
        total: allResults.length,
        article: counts.article,
        gallery: counts.gallery,
        rectify: counts.rectify,
        column: counts.column,
        event: counts.event
    });
    const summaryParts = [];
    if (counts.article) summaryParts.push(`文章 ${counts.article}`);
    if (counts.gallery) summaryParts.push(`文艺 ${counts.gallery}`);
    if (counts.rectify) summaryParts.push(`正名 ${counts.rectify}`);
    if (counts.column) summaryParts.push(`专栏 ${counts.column}`);
    if (counts.event) summaryParts.push(`大事件 ${counts.event}`);

    let html = `<div class="search-results-header">共找到 ${allResults.length} 条结果（${summaryParts.join(' · ')}）</div>`;
    html += '<div class="search-results-list">';

    allResults.forEach(item => {
        if (item._type === 'article') {
            html += renderArticleResult(item);
        } else if (item._type === 'gallery') {
            html += renderGalleryResult(item);
        } else if (item._type === 'rectify') {
            html += renderRectifyResult(item);
        } else if (item._type === 'column') {
            html += renderColumnResult(item);
        } else if (item._type === 'event') {
            html += renderEventResult(item);
        }
    });

    html += '</div>';
    resultsContainer.innerHTML = html;
    resultsContainer.classList.add('active');
}

// ============================================================
// 各类结果卡片渲染
// ============================================================
const categoryColors = {
    '哲学基础': '#8b0000', '政治理论': '#1a237e', '军事战略': '#1b5e20',
    '政治经济学': '#e65100', '党的建设': '#6a1b9a', '思想文化': '#00695c'
};

function renderArticleResult(item) {
    const priorityClass = item.priority === '5' ? 'priority-5' : 'priority-4';
    const stars = item.priority === '5' ? '⭐⭐⭐⭐⭐' : '⭐⭐⭐⭐';
    const catColor = categoryColors[item.category] || '#666';
    return `
        <div class="search-result-item ${priorityClass}">
            <div class="result-header">
                <span class="result-priority">${stars}</span>
                <span class="result-year">${item.year}年</span>
                <span class="result-category" style="background:${catColor}20;color:${catColor};border:1px solid ${catColor}40;">${item.category}</span>
                <span class="result-type-tag" style="background:#f3f3f3;color:#888;font-size:0.75em;padding:2px 7px;border-radius:3px;">📖 文章</span>
            </div>
            <h4 class="result-title"><a href="${resolveSearchHref(item.file)}">${item.title}</a></h4>
            <p class="result-meta">${item.author}</p>
            <p class="result-keywords">关键词：${item.keywords.slice(0, 4).join('、')}</p>
        </div>`;
}

function renderGalleryResult(item) {
    const typeIcon = { video: '🎬', music: '🎵', poster: '🖼️' }[item.type] || '🎨';
    const typeName = { video: '视频', music: '音乐', poster: '宣传画' }[item.type] || '文艺';
    const yearStr = item.year ? item.year + '年' : '';
    return `
        <div class="search-result-item" style="border-left:3px solid #c41e3a;">
            <div class="result-header">
                <span class="result-type-tag" style="background:#fff0f3;color:#c41e3a;font-size:0.8em;padding:2px 8px;border-radius:3px;font-weight:600;">${typeIcon} ${typeName}</span>
                <span class="result-year" style="color:#888;font-size:0.85em;">${item.category}${yearStr ? ' · ' + yearStr : ''}</span>
            </div>
            <h4 class="result-title"><a href="${resolveSearchHref(item.file)}">${item.title}</a></h4>
            <p class="result-keywords" style="margin:0;font-size:0.8em;color:#999;">关键词：${item.keywords.slice(0, 4).join('、')}</p>
        </div>`;
}

function renderRectifyResult(item) {
    return `
        <div class="search-result-item" style="border-left:3px solid #1565c0;">
            <div class="result-header">
                <span class="result-type-tag" style="background:#e3f2fd;color:#1565c0;font-size:0.8em;padding:2px 8px;border-radius:3px;font-weight:600;">⚖️ 正名</span>
                <span class="result-year" style="color:#888;font-size:0.85em;">${item.category}</span>
            </div>
            <h4 class="result-title"><a href="${resolveSearchHref(item.file)}">${item.title}</a></h4>
            <p class="result-meta" style="font-size:0.88em;color:#555;margin:4px 0;">${item.summary}</p>
            <p class="result-keywords" style="margin:0;font-size:0.8em;color:#999;">关键词：${item.keywords.slice(0, 4).join('、')}</p>
        </div>`;
}

function renderColumnResult(item) {
    return `
        <div class="search-result-item search-result-column">
            <div class="result-header">
                <span class="result-type-tag result-type-column">专栏</span>
                <span class="result-year">${item.category}</span>
            </div>
            <h4 class="result-title"><a href="${resolveSearchHref(item.file)}">${item.title}</a></h4>
            <p class="result-meta">${item.summary}</p>
            <p class="result-keywords">关键词：${item.keywords.slice(0, 4).join('、')}</p>
        </div>`;
}

function renderEventResult(item) {
    const natureColor = { positive: '#2e7d32', negative: '#b71c1c', neutral: '#e65100' }[item.nature] || '#555';
    const natureIcon = { positive: '✓', negative: '✗', neutral: '•' }[item.nature] || '•';
    return `
        <div class="search-result-item" style="border-left:3px solid ${natureColor};">
            <div class="result-header">
                <span class="result-type-tag" style="background:#fff8e1;color:#f57f17;font-size:0.8em;padding:2px 8px;border-radius:3px;font-weight:600;">📅 大事件</span>
                <span class="result-year" style="color:#e6a817;font-weight:bold;font-size:0.88em;">${item.year}年 · ${item.date}</span>
                <span style="color:${natureColor};font-size:0.85em;font-weight:bold;">${natureIcon}</span>
            </div>
            <h4 class="result-title"><a href="${resolveSearchHref(item.file)}">${item.title}</a></h4>
            <p class="result-meta" style="font-size:0.88em;color:#555;margin:4px 0;">${item.desc}</p>
        </div>`;
}

// ============================================================
// 兼容筛选同步（articles.html 页面）
// ============================================================
function syncFiltersFromPage() {
    const authorBtns = document.querySelectorAll('.filter-btn[data-filter]');
    const priorityBtns = document.querySelectorAll('.filter-btn[data-priority]');
    currentFilters.authors = [];
    currentFilters.priorities = [];
    authorBtns.forEach(btn => {
        if (btn.classList.contains('active')) {
            const f = btn.dataset.filter;
            if (['mao', 'lenin', 'marx', 'stalin', 'engels'].includes(f))
                currentFilters.authors.push(f);
        }
    });
    priorityBtns.forEach(btn => {
        if (btn.classList.contains('active')) {
            const p = btn.dataset.priority;
            if (['5', '4', '3'].includes(p)) currentFilters.priorities.push(p);
        }
    });
}

// ============================================================
// 事件绑定
// ============================================================
function initSearchBindings() {
    const searchInputs = getSearchInputs();
    if (!searchInputs.length) return false;

    applySearchStateToPage(readSearchState());
    if (window.QMLMState && typeof window.QMLMState.subscribe === 'function' && !window.__QMLM_SEARCH_SUBSCRIBED__) {
        window.__QMLM_SEARCH_SUBSCRIBED__ = true;
        window.QMLMState.subscribe('search', function (searchState, rootState, meta) {
            if (meta && meta.source === 'search') return;
            applySearchStateToPage(searchState);
        });
    }

    searchInputs.forEach(function (searchInput) {
        if (searchInput.__qmlmSearchBound) return;
        searchInput.__qmlmSearchBound = true;

        searchInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (typeof syncFiltersFromPage === 'function') syncFiltersFromPage();
                performSearch(searchInput);
            }
        });

        searchInput.addEventListener('input', debounce(function () {
            if (typeof syncFiltersFromPage === 'function') syncFiltersFromPage();
            performSearch(searchInput);
        }, 220));

        searchInput.addEventListener('focus', function () {
            const results = getSearchResultsContainer(searchInput);
            if (results && results.innerHTML.trim()) results.classList.add('active');
        });
    });

    document.addEventListener('click', function (e) {
        searchInputs.forEach(function (searchInput) {
            const results = getSearchResultsContainer(searchInput);
            if (results && !searchInput.contains(e.target) && !results.contains(e.target)) {
                results.classList.remove('active');
            }
        });
    });

    return true;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearchBindings);
} else {
    initSearchBindings();
}

// 防抖工具
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
