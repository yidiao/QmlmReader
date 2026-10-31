(function () {
    'use strict';

    if (window.__QMLM_ARTICLES_INDEX_READY__) return;

    var DATA_URL = '../../data/articles.json';
    var COLLECTIONS_URL = '../../data/collections.json';
    var VIEW_MODE_KEY = 'qmlm:articles:view-mode';
    var state = {
        articles: [],
        collections: [],
        filters: {
            priority: 'all',
            author: 'all',
            category: 'all',
            search: ''
        },
        viewMode: 'grid'
    };

    function esc(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
        });
    }

    function normalizeText(value) {
        return String(value == null ? '' : value).toLowerCase();
    }

    function readStoredViewMode() {
        try {
            var stored = localStorage.getItem(VIEW_MODE_KEY);
            return stored === 'list' ? 'list' : 'grid';
        } catch (err) {
            return 'grid';
        }
    }

    function persistViewMode(mode) {
        try {
            localStorage.setItem(VIEW_MODE_KEY, mode);
        } catch (err) {}
    }

    function isImported(article) {
        return !!(article && article.file && String(article.file).indexOf('articles/imported/') === 0);
    }

    function isRenderable(article) {
        return !!article && !isImported(article);
    }

    function isWip(article) {
        return !article || article.ready === false || !article.file || isImported(article);
    }

    function priorityLabel(article) {
        var p = Number(article && article.priority || 0);
        if (p >= 5) return '五星';
        if (p === 4) return '四星';
        if (p === 3) return '三星';
        if (p === 2) return '二星';
        if (p === 1) return '一星';
        return '未定';
    }

    function categoryLabel(article) {
        return article && (article.category || article.type) ? String(article.category || article.type) : '未分类';
    }

    function yearLabel(article) {
        return article && (article.date || article.year) ? String(article.date || article.year) : '年份待补';
    }

    function articleHref(article) {
        if (!article || !article.file) return '';
        var href = String(article.file);
        href = href.replace(/^\.\//, '');
        href = href.replace(/^articles\//, '');
        href = href.replace(/^html\/articles\//, '');
        return href;
    }

    function articleSearchText(article) {
        var keywords = Array.isArray(article && article.keywords) ? article.keywords.join(' ') : '';
        return normalizeText([article && article.title, article && article.author, article && article.category, article && article.type, keywords].join(' '));
    }

    function compareArticles(a, b) {
        var ap = Number(a && a.priority || 0);
        var bp = Number(b && b.priority || 0);
        if (bp !== ap) return bp - ap;
        var ayMatch = String(a && (a.year || a.date) || '').match(/\d{4}/);
        var byMatch = String(b && (b.year || b.date) || '').match(/\d{4}/);
        var ay = parseInt(ayMatch ? ayMatch[0] : '9999', 10);
        var by = parseInt(byMatch ? byMatch[0] : '9999', 10);
        if (ay !== by) return ay - by;
        return String(a && a.title || '').localeCompare(String(b && b.title || ''), 'zh-Hans-CN');
    }

    function filterArticles(articles) {
        return articles.filter(function (article) {
            if (!isRenderable(article)) return false;
            var priority = Number(article.priority || 0);
            var authorKey = String(article.authorKey || '');
            var category = String(article.type || article.category || '');
            var status = isWip(article) ? 'wip' : String(priority || '');
            var searchText = articleSearchText(article);

            if (state.filters.priority !== 'all') {
                if (state.filters.priority === 'wip') {
                    if (status !== 'wip') return false;
                } else if (String(priority) !== String(state.filters.priority)) {
                    return false;
                }
            }
            if (state.filters.author !== 'all' && authorKey !== state.filters.author) return false;
            if (state.filters.category !== 'all' && category !== state.filters.category) return false;
            if (state.filters.search && searchText.indexOf(state.filters.search) === -1) return false;
            return true;
        });
    }

    function setButtonState(groupSelector, activeButton) {
        var buttons = document.querySelectorAll(groupSelector);
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].classList.remove('active');
        }
        if (activeButton) activeButton.classList.add('active');
    }

    function renderArticleCard(article) {
        var href = articleHref(article);
        var title = esc(article.title || '未命名文章');
        var author = esc(article.author || '');
        var desc = esc(article.description || article.summary || (Array.isArray(article.keywords) ? article.keywords.join(' · ') : ''));
        var categoryKey = esc(String(article.type || article.category || ''));
        var category = esc(categoryLabel(article));
        var year = esc(yearLabel(article));
        var priority = esc(priorityLabel(article));
        var isDisabled = isWip(article) || !href;
        var titleHtml = !isDisabled ? '<a href="' + esc(href) + '">' + title + '</a>' : '<span>' + title + '</span>';
        var readMoreHtml = !isDisabled ? '<a class="read-more" href="' + esc(href) + '">阅读全文</a>' : '<span class="read-more disabled">正在施工</span>';
        var metaKeyword = Array.isArray(article.keywords) && article.keywords.length ? '<span class="meta-pill">' + esc(article.keywords[0]) + '</span>' : '';

        return '<article class="article-card' + (isDisabled ? ' is-wip' : '') + '" data-author="' + esc(String(article.authorKey || '')) + '" data-category="' + esc(String(article.type || article.category || '')) + '" data-priority="' + esc(String(article.priority || 0)) + '" data-search="' + esc(articleSearchText(article)) + '">' +
            '<div class="card-top"><span class="' + (isDisabled ? 'badge gray' : 'badge') + '">' + priority + '</span><span class="card-date">' + year + '</span></div>' +
            '<h3 class="card-title">' + titleHtml + '</h3>' +
            '<p class="card-author">' + author + '</p>' +
            '<p class="article-desc">' + desc + '</p>' +
            '<div class="card-meta">' +
                '<span class="meta-pill">' + esc(String(article.authorKey || '')) + '</span>' +
                '<span class="article-category-tag" data-category="' + categoryKey + '">' + category + '</span>' +
                metaKeyword +
            '</div>' +
            '<div class="card-footer">' +
                '<span class="article-note">' + (isDisabled ? '此条目尚未生成正式详情页' : '正式详情页已接入') + '</span>' +
                '<span class="card-footer-actions">' +
                    readMoreHtml +
                '</span>' +
            '</div>' +
        '</article>';
    }

    function articleHrefFromTitle(articleTitle, articleMap) {
        var article = articleMap[articleTitle];
        return article ? articleHref(article) : '';
    }

    function buildArticleMap(articles) {
        var map = {};
        for (var i = 0; i < articles.length; i++) {
            var article = articles[i];
            if (!article || !article.title) continue;
            map[String(article.title)] = article;
        }
        return map;
    }

    function renderCollections(collections, articleMap) {
        var grid = document.getElementById('collectionsGrid');
        var count = document.getElementById('collectionCount');
        if (!grid || !count) return;

        if (!Array.isArray(collections) || !collections.length) {
            grid.innerHTML = '<div class="empty-state">暂无合集数据</div>';
            count.textContent = '0 个';
            return;
        }

        count.textContent = collections.length + ' 个';
        grid.innerHTML = collections.map(function (collection, index) {
            var articles = Array.isArray(collection.articles) ? collection.articles : [];
            var ready = 0;
            for (var i = 0; i < articles.length; i++) {
                if (articles[i] && articles[i].status === 'ready') ready++;
            }
            return '<div class="collection-card" data-index="' + index + '">' +
                '<h3 class="collection-title">' + esc(collection.title || '') + '</h3>' +
                '<div class="collection-sub">' + esc(collection.subtitle || '') + '</div>' +
                '<div class="collection-desc">' + esc(collection.desc || '') + '</div>' +
                '<div class="collection-count">' + ready + '/' + articles.length + ' 篇已接入</div>' +
            '</div>';
        }).join('');

        var cards = grid.querySelectorAll('.collection-card');
        for (var j = 0; j < cards.length; j++) {
            cards[j].addEventListener('click', function () {
                var index = Number(this.getAttribute('data-index'));
                openCollectionModal(collections[index], articleMap);
            });
        }
    }

    function openCollectionModal(collection, articleMap) {
        var overlay = document.getElementById('collectionModal');
        var titleEl = document.getElementById('modalTitle');
        var subEl = document.getElementById('modalSub');
        var descEl = document.getElementById('modalDesc');
        var listEl = document.getElementById('modalArticles');
        if (!overlay || !collection || !titleEl || !subEl || !descEl || !listEl) return;

        titleEl.textContent = collection.title || '合集';
        subEl.textContent = collection.subtitle || '';
        descEl.textContent = collection.desc || '';

        var articles = Array.isArray(collection.articles) ? collection.articles : [];
        listEl.innerHTML = articles.map(function (item, idx) {
            var articleTitle = item && item.title ? String(item.title) : '';
            var matchedHref = articleHrefFromTitle(articleTitle, articleMap);
            var fallbackHref = item && item.slug ? String(item.slug) + '.html' : '';
            var href = matchedHref || fallbackHref;
            var status = item && item.status === 'ready' ? 'ready' : 'wip';
            return '<div class="modal-article">' +
                '<div class="modal-num">' + (idx + 1) + '</div>' +
                (href ? '<a class="modal-title" href="' + esc(href) + '">' + esc(articleTitle) + '</a>' : '<div class="modal-title">' + esc(articleTitle) + '</div>') +
                '<div class="modal-status ' + status + '">' + status.toUpperCase() + '</div>' +
            '</div>';
        }).join('');

        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
    }

    function closeCollectionModal() {
        var overlay = document.getElementById('collectionModal');
        if (!overlay) return;
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
    }

    function renderFilters(articles) {
        var authorBar = document.getElementById('authorBar');
        var categoryBar = document.getElementById('categoryBar');
        if (!authorBar || !categoryBar) return;

        var authors = [];
        var categories = [];
        var authorSeen = {};
        var categorySeen = {};

        for (var i = 0; i < articles.length; i++) {
            var authorKey = String(articles[i].authorKey || '');
            var category = String(articles[i].type || articles[i].category || '');
            if (authorKey && !authorSeen[authorKey]) {
                authorSeen[authorKey] = true;
                authors.push(authorKey);
            }
            if (category && !categorySeen[category]) {
                categorySeen[category] = true;
                categories.push(category);
            }
        }

        authors.sort();
        categories.sort();

        authorBar.innerHTML = '<button class="filter-btn active" data-filter="author" data-value="all">全部作者</button>' + authors.map(function (author) {
            var label = { marx: '马恩', engels: '恩格斯', lenin: '列宁', mao: '毛泽东', stalin: '斯大林' }[author] || author;
            return '<button class="filter-btn" data-filter="author" data-value="' + esc(author) + '">' + esc(label) + '</button>';
        }).join('');

        categoryBar.innerHTML = '<button class="filter-btn active" data-filter="category" data-value="all">全部类别</button>' + categories.map(function (category) {
            var label = { military: '军事战略', philosophy: '哲学基础', economics: '政治经济学', politics: '政治理论', party: '党的建设', culture: '思想文化' }[category] || category;
            return '<button class="filter-btn" data-filter="category" data-value="' + esc(category) + '">' + esc(label) + '</button>';
        }).join('');
    }

    function renderStats(articles) {
        var readyCount = 0;
        for (var i = 0; i < articles.length; i++) {
            if (!isWip(articles[i])) readyCount++;
        }
        var wipCount = articles.length - readyCount;
        var heroStats = document.getElementById('heroStats');
        var articleCount = document.getElementById('articleCount');
        if (heroStats) {
            heroStats.innerHTML = [
                '<span class="hero-stat">正式条目 ' + readyCount + ' 篇</span>',
                '<span class="hero-stat">施工中 ' + wipCount + ' 篇</span>',
                '<span class="hero-stat">总索引 ' + articles.length + ' 篇</span>'
            ].join('');
        }
        if (articleCount) articleCount.textContent = articles.length + ' 篇';
    }

    function applyViewMode(mode) {
        state.viewMode = mode === 'list' ? 'list' : 'grid';
        persistViewMode(state.viewMode);
        var body = document.body;
        var grid = document.getElementById('articleGrid');
        if (body) body.setAttribute('data-view-mode', state.viewMode);
        if (grid) {
            if (state.viewMode === 'list') grid.classList.add('view-list');
            else grid.classList.remove('view-list');
        }
        var modeButtons = document.querySelectorAll('[data-view-mode-btn]');
        for (var i = 0; i < modeButtons.length; i++) {
            var btnMode = modeButtons[i].getAttribute('data-view-mode-btn');
            if (btnMode === state.viewMode) modeButtons[i].classList.add('active');
            else modeButtons[i].classList.remove('active');
        }
    }

    function applyFilters() {
        var grid = document.getElementById('articleGrid');
        var filtered = filterArticles(state.articles).sort(compareArticles);
        var resultCount = document.getElementById('resultCount');
        if (resultCount) resultCount.textContent = filtered.length + ' 篇';
        if (!grid) return;
        if (!filtered.length) {
            grid.innerHTML = '<div class="empty-state">没有找到符合条件的文章。</div>';
            return;
        }
        grid.innerHTML = filtered.map(renderArticleCard).join('');
        if (window.QMLMPreferences && typeof window.QMLMPreferences.syncArticleFavoriteButtons === 'function') {
            window.QMLMPreferences.syncArticleFavoriteButtons(grid);
        }
    }

    function bindFilterButtons() {
        var buttons = document.querySelectorAll('.filter-btn[data-filter]');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].addEventListener('click', function () {
                var filter = this.getAttribute('data-filter');
                var value = this.getAttribute('data-value') || 'all';
                if (filter === 'priority') state.filters.priority = value;
                if (filter === 'author') state.filters.author = value;
                if (filter === 'category') state.filters.category = value;
                setButtonState('.filter-btn[data-filter="' + filter + '"]', this);
                applyFilters();
            });
        }

        var searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', function () {
                state.filters.search = normalizeText(searchInput.value.trim());
                applyFilters();
            });
        }

        var modeButtons = document.querySelectorAll('[data-view-mode-btn]');
        for (var j = 0; j < modeButtons.length; j++) {
            modeButtons[j].addEventListener('click', function () {
                applyViewMode(this.getAttribute('data-view-mode-btn'));
            });
        }
    }

    function getEmbeddedArticles() {
        var dataEl = document.getElementById('articles-index-data');
        if (!dataEl || !dataEl.textContent) return [];
        try {
            var articles = JSON.parse(dataEl.textContent);
            return Array.isArray(articles) ? articles : [];
        } catch (error) {
            console.warn('内嵌文章索引数据无效，将回退到 articles.json。', error);
            return [];
        }
    }

    function getArticlesSource() {
        var embeddedArticles = getEmbeddedArticles();
        if (embeddedArticles.length) return embeddedArticles;
        if (window.SITE_DATA) {
            if (Array.isArray(window.SITE_DATA.articleIndex) && window.SITE_DATA.articleIndex.length) return window.SITE_DATA.articleIndex.slice();
            if (Array.isArray(window.SITE_DATA.articles) && window.SITE_DATA.articles.length) return window.SITE_DATA.articles.slice();
        }
        return fetch(DATA_URL).then(function (response) {
            if (!response.ok) throw new Error('文章索引加载失败');
            return response.json();
        });
    }

    function getCollectionsSource() {
        if (window.SITE_DATA && Array.isArray(window.SITE_DATA.collections) && window.SITE_DATA.collections.length) {
            return Promise.resolve(window.SITE_DATA.collections.slice());
        }
        return fetch(COLLECTIONS_URL).then(function (response) {
            if (!response.ok) throw new Error('主题合集加载失败');
            return response.json();
        });
    }

    function init() {
        state.viewMode = readStoredViewMode();
        applyViewMode(state.viewMode);

        Promise.resolve(getArticlesSource()).then(function (rawArticles) {
            state.articles = rawArticles.filter(isRenderable);
            renderStats(state.articles);
            renderFilters(state.articles);
            bindFilterButtons();
            applyFilters();

            var articleGrid = document.getElementById('articleGrid');
            if (articleGrid) {
                articleGrid.addEventListener('click', function (e) {
                    var link = e.target.closest('a.read-more');
                    if (link && link.classList.contains('disabled')) e.preventDefault();
                });
            }

            return Promise.resolve(getCollectionsSource()).then(function (collections) {
                state.collections = Array.isArray(collections) ? collections : [];
                renderCollections(state.collections, buildArticleMap(state.articles));
            }).catch(function (error) {
                console.error(error);
                state.collections = [];
                renderCollections(state.collections, buildArticleMap(state.articles));
            });
        }).catch(function (error) {
            console.error(error);
            var grid = document.getElementById('articleGrid');
            if (grid) grid.innerHTML = '<div class="empty-state">文章索引加载失败，请检查 `data/articles.json`。</div>';
            var resultCount = document.getElementById('resultCount');
            if (resultCount) resultCount.textContent = '加载失败';
        });
    }




    var modalClose = document.getElementById('modalClose');
    if (modalClose) modalClose.addEventListener('click', closeCollectionModal);

    var modal = document.getElementById('collectionModal');
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === this) closeCollectionModal();
        });
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeCollectionModal();
    });

    init();
    window.__QMLM_ARTICLES_INDEX_READY__ = true;
})();
