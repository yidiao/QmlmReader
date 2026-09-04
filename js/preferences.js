(function () {
    'use strict';

    var STORAGE_KEY = 'qmlm:preferences:v1';
    var DEFAULTS = {
        favorites: [],
        history: [],
        view: {
            mode: 'card',
            density: 'normal'
        },
        ui: {
            section: 'favorites'
        }
    };

    function safeJsonParse(text, fallback) {
        try {
            return JSON.parse(text);
        } catch (err) {
            return fallback;
        }
    }

    function cloneDefaults() {
        return {
            favorites: [],
            history: [],
            view: {
                mode: DEFAULTS.view.mode,
                density: DEFAULTS.view.density
            },
            ui: {
                section: DEFAULTS.ui.section
            }
        };
    }

    function readState() {
        var raw = localStorage.getItem(STORAGE_KEY);
        var state = raw ? safeJsonParse(raw, null) : null;
        if (!state || typeof state !== 'object') return cloneDefaults();
        state.favorites = Array.isArray(state.favorites) ? state.favorites : [];
        state.history = Array.isArray(state.history) ? state.history : [];
        state.view = state.view && typeof state.view === 'object' ? state.view : {};
        state.view.mode = state.view.mode || DEFAULTS.view.mode;
        state.view.density = state.view.density || DEFAULTS.view.density;
        state.ui = state.ui && typeof state.ui === 'object' ? state.ui : {};
        state.ui.section = state.ui.section || DEFAULTS.ui.section;
        return state;
    }

    function writeState(state) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value).replace(/[&<>'"]/g, function (ch) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
        });
    }

    function articleKeyFromBody() {
        var body = document.body;
        if (!body) return '';
        return body.getAttribute('data-preference-key') || window.location.pathname || body.getAttribute('data-article-json') || '';
    }

    function getCurrentChapterInfo() {
        var chapters = document.querySelectorAll('.chapter');
        if (!chapters.length) return { id: '', label: '' };
        var scrollTop = window.pageYOffset || (document.documentElement && document.documentElement.scrollTop) || 0;
        var probe = scrollTop + 140;
        var picked = null;
        for (var i = 0; i < chapters.length; i++) {
            var chapter = chapters[i];
            var top = chapter.offsetTop || 0;
            if (top <= probe) picked = chapter;
            else break;
        }
        if (!picked) picked = chapters[0];
        var titleEl = picked.querySelector('.chapter-title');
        var label = titleEl ? titleEl.textContent.replace(/\s+/g, ' ').trim() : (picked.id || '');
        return {
            id: picked.id || '',
            label: label
        };
    }

    function getActiveTab() {
        var active = document.querySelector('.tab-btn.active');
        return active ? (active.dataset.tab || active.textContent.trim()) : '';
    }

    function getScrollPosition() {
        var body = document.documentElement || document.body;
        var scrollTop = window.pageYOffset || body.scrollTop || 0;
        var height = Math.max(body.scrollHeight - window.innerHeight, 1);
        return {
            y: scrollTop,
            percent: Math.max(0, Math.min(100, Math.round(scrollTop / height * 100)))
        };
    }

    function getArticleMeta() {
        var chapterInfo = getCurrentChapterInfo();
        return {
            title: document.title.replace(/\s*[-|]\s*青年马列毛主义驿站.*$/, '').trim(),
            url: window.location.href,
            path: window.location.pathname,
            key: articleKeyFromBody(),
            tab: getActiveTab(),
            chapter: chapterInfo.label,
            chapterId: chapterInfo.id,
            position: getScrollPosition(),
            updatedAt: new Date().toISOString()
        };
    }

    function getStoredEntry(listName, key) {
        var state = readState();
        var list = state[listName] || [];
        for (var i = 0; i < list.length; i++) {
            if (list[i] && list[i].key === key) return list[i];
        }
        return null;
    }

    var TAB_LABELS = {
        original: '原文',
        reading: '读法提示',
        difficulty: '难点解析',
        dialogue: '对话空间',
        action: '行动实验',
        visual: '一目了然',
        puzzle: '理论拼图',
        further: '延伸阅读'
    };

    function findTabButton(tabId) {
        if (!tabId) return null;
        var exactLabel = TAB_LABELS[tabId] || tabId;
        var buttons = document.querySelectorAll('.tab-btn');
        for (var i = 0; i < buttons.length; i++) {
            var btn = buttons[i];
            var text = btn && btn.textContent ? btn.textContent.replace(/\s+/g, '') : '';
            if (btn.dataset && btn.dataset.tab === tabId) return btn;
            if (text === exactLabel || text.indexOf(exactLabel) >= 0 || text.indexOf(tabId) >= 0) return btn;
        }
        return null;
    }

    function restoreReadingState() {
        var key = articleKeyFromBody();
        if (!key) return;
        var entry = getStoredEntry('history', key);
        if (!entry) return;
        var attempts = 0;
        var run = function () {
            attempts += 1;
            var tabBtn = findTabButton(entry.tab);
            if (!tabBtn) {
                if (attempts < 10) window.setTimeout(run, 200);
                return;
            }
            tabBtn.click();
            var scrollTarget = null;
            if (entry.chapterId) scrollTarget = document.getElementById(entry.chapterId);
            if (!scrollTarget && typeof entry.position === 'object' && entry.position && typeof entry.position.y === 'number') {
                scrollTarget = { y: entry.position.y };
            }
            if (!scrollTarget) return;
            window.setTimeout(function () {
                if (scrollTarget && scrollTarget.nodeType === 1 && scrollTarget.scrollIntoView) {
                    scrollTarget.scrollIntoView({ behavior: 'auto', block: 'start' });
                } else if (typeof scrollTarget.y === 'number') {
                    window.scrollTo(0, scrollTarget.y);
                }
                upsertHistory(getArticleMeta());
            }, 180);
        };
        window.setTimeout(run, 250);
    }

    function upsertFavorite(article) {
        var state = readState();
        var idx = state.favorites.findIndex(function (item) { return item.key === article.key; });
        var entry = {
            key: article.key,
            title: article.title,
            url: article.url,
            path: article.path,
            updatedAt: article.updatedAt
        };
        if (idx >= 0) state.favorites[idx] = entry;
        else state.favorites.unshift(entry);
        writeState(state);
        return state;
    }

    function upsertHistory(article) {
        var state = readState();
        var idx = state.history.findIndex(function (item) { return item.key === article.key; });
        var entry = {
            key: article.key,
            title: article.title,
            url: article.url,
            path: article.path,
            tab: article.tab,
            chapter: article.chapter,
            chapterId: article.chapterId || '',
            position: article.position,
            updatedAt: article.updatedAt
        };
        if (idx >= 0) state.history.splice(idx, 1);
        state.history.unshift(entry);
        state.history = state.history.slice(0, 50);
        writeState(state);
        return state;
    }

    function removeFavoriteByKey(key) {
        var state = readState();
        state.favorites = state.favorites.filter(function (item) { return item.key !== key; });
        writeState(state);
    }

    function removeHistoryByKey(key) {
        var state = readState();
        state.history = state.history.filter(function (item) { return item.key !== key; });
        writeState(state);
    }

    function isArticleFavorite(key) {
        if (!key) return false;
        var state = readState();
        return state.favorites.some(function (item) { return item.key === key; });
    }

    function updateFavoriteButtonState(button, key) {
        if (!button) return;
        if (isArticleFavorite(key)) {
            button.textContent = '已收藏';
            button.classList.add('is-active');
            button.setAttribute('aria-pressed', 'true');
        } else {
            button.textContent = '收藏本文';
            button.classList.remove('is-active');
            button.setAttribute('aria-pressed', 'false');
        }
    }

    function notifyPreferenceChange() {
        window.dispatchEvent(new CustomEvent('qmlm:preferences-changed', { detail: { key: articleKeyFromBody() } }));
        syncArticleFavoriteButtons(document);
    }

    function decorateFavoriteButtons(root) {
        var scope = root || document;
        var buttons = scope.querySelectorAll('[data-qmlm-favorite-btn]');
        for (var i = 0; i < buttons.length; i++) {
            var button = buttons[i];
            var key = button.getAttribute('data-qmlm-favorite-btn') || articleKeyFromBody();
            updateFavoriteButtonState(button, key);
        }
    }

    function createFavoriteButton(label) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'qmlm-favorite-btn';
        button.textContent = label || '收藏本文';
        return button;
    }

    function bindFavoriteButton(button, metaProvider) {
        if (!button || button.__qmlmFavoriteBound) return;
        button.__qmlmFavoriteBound = true;
        var getMeta = typeof metaProvider === 'function' ? metaProvider : getArticleMeta;
        var key = button.getAttribute('data-qmlm-favorite-btn') || '';
        if (!key) {
            var meta = getMeta();
            key = meta && meta.key ? meta.key : articleKeyFromBody();
            button.setAttribute('data-qmlm-favorite-btn', key);
        }
        updateFavoriteButtonState(button, key);
        button.addEventListener('click', function () {
            var article = getMeta();
            if (!article.key) article.key = key;
            upsertFavorite(article);
            updateFavoriteButtonState(button, article.key || key);
            notifyPreferenceChange();
        });
    }

    function getCardArticleMeta(card) {
        if (!card) return null;
        var titleLink = card.querySelector('.article-title a');
        var readLink = card.querySelector('.read-more');
        var link = titleLink || readLink || card.querySelector('a[href]');
        if (!link) return null;
        var rawHref = link.getAttribute('href') || '';
        if (!rawHref || rawHref === '#') return null;
        var resolvedUrl = rawHref;
        var resolvedPath = rawHref;
        try {
            var parsed = new URL(rawHref, window.location.href);
            resolvedUrl = parsed.href;
            resolvedPath = parsed.pathname;
        } catch (err) {
            resolvedUrl = rawHref;
            resolvedPath = rawHref;
        }
        var title = titleLink ? titleLink.textContent.replace(/\s+/g, ' ').trim() : (card.querySelector('.article-title') ? card.querySelector('.article-title').textContent.replace(/\s+/g, ' ').trim() : link.textContent.replace(/\s+/g, ' ').trim());
        return {
            key: resolvedPath || articleKeyFromBody(),
            url: resolvedUrl,
            path: resolvedPath || resolvedUrl,
            title: title,
            tab: '',
            chapter: '',
            chapterId: '',
            position: { y: 0, percent: 0 },
            updatedAt: new Date().toISOString()
        };
    }

    function ensureCardFooterActions(card) {
        var footer = card && card.querySelector('.card-footer');
        if (!footer) return null;
        var actions = footer.querySelector('.card-footer-actions');
        if (!actions) {
            actions = document.createElement('div');
            actions.className = 'card-footer-actions';
            var readMore = footer.querySelector('.read-more');
            if (readMore && readMore.parentNode === footer) {
                footer.insertBefore(actions, readMore);
                actions.appendChild(readMore);
            } else {
                footer.appendChild(actions);
            }
        }
        return actions;
    }

    function decorateArticleCard(card) {
        var meta = getCardArticleMeta(card);
        if (!meta || !meta.key) return;
        var actions = ensureCardFooterActions(card);
        if (!actions) return;
        var button = actions.querySelector('[data-qmlm-favorite-btn]');
        if (!button) {
            button = createFavoriteButton('收藏本文');
            button.classList.add('article-card-favorite');
            button.setAttribute('data-qmlm-favorite-btn', meta.key);
            var readMore = actions.querySelector('.read-more');
            if (readMore) actions.insertBefore(button, readMore);
            else actions.appendChild(button);
        } else {
            button.setAttribute('data-qmlm-favorite-btn', meta.key);
        }
        bindFavoriteButton(button, function () { return getCardArticleMeta(card) || meta; });
        updateFavoriteButtonState(button, meta.key);
    }

    function syncArticleFavoriteButtons(root) {
        var scope = root || document;
        decorateFavoriteButtons(scope);
        var cards = scope.querySelectorAll('.article-card');
        for (var i = 0; i < cards.length; i++) {
            decorateArticleCard(cards[i]);
        }
    }

    function installFavoriteObserver() {
        if (window.__qmlmFavoriteObserver) return;
        var syncTimer = 0;
        var observer = new MutationObserver(function () {
            if (syncTimer) return;
            syncTimer = window.setTimeout(function () {
                syncTimer = 0;
                syncArticleFavoriteButtons(document);
            }, 40);
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
        window.__qmlmFavoriteObserver = observer;
    }

    function normalizeText(value) {
        return String(value == null ? '' : value).toLowerCase();
    }

    function itemMatchesQuery(item, query) {
        if (!query) return true;
        var q = normalizeText(query);
        var source = [item.title, item.url, item.path, item.tab, item.chapter, item.chapterId, item.updatedAt].map(normalizeText).join(' | ');
        return source.indexOf(q) >= 0;
    }

    function getViewModeLabel(mode) {
        return mode === 'compact' ? '紧凑' : mode === 'mixed' ? '混合' : '卡片';
    }

    function getDensityLabel(density) {
        return density === 'dense' ? '紧凑密度' : '标准密度';
    }

    function renderList(container, items, emptyText, itemRenderer) {
        var html;
        if (!items.length) {
            html = '<div class="prefs-empty-card"><strong>暂无内容</strong><span>' + escapeHtml(emptyText) + '</span></div>';
        } else {
            html = items.map(itemRenderer).join('');
        }
        if (container) container.innerHTML = html;
        return html;
    }

    function renderPreferencesPage() {
        var state = readState();
        var favoritesList = document.getElementById('favoritesList');
        var historyList = document.getElementById('historyList');
        var viewModeSelect = document.getElementById('viewModeSelect');
        var densitySelect = document.getElementById('densitySelect');
        var favoriteCount = document.getElementById('favoriteCount');
        var historyCount = document.getElementById('historyCount');
        var favoritesCountLabel = document.getElementById('favoritesCountLabel');
        var historyCountLabel = document.getElementById('historyCountLabel');
        var navFavoritesCount = document.getElementById('navFavoritesCount');
        var navHistoryCount = document.getElementById('navHistoryCount');
        var viewModeLabel = document.getElementById('viewModeLabel');
        var densityLabel = document.getElementById('densityLabel');
        var dataStateLabel = document.getElementById('dataStateLabel');
        var searchInput = document.getElementById('prefsSearchInput');
        var searchWrap = document.getElementById('prefsSearchWrap');
        var sectionBody = document.getElementById('prefsSectionBody');
        var sectionTitle = document.getElementById('prefsSectionTitle');
        var sectionDesc = document.getElementById('prefsSectionDesc');
        var sectionKicker = document.getElementById('prefsSectionKicker');
        var sidebarNote = document.getElementById('prefsSidebarNote');
        var currentSection = state.ui.section || 'favorites';
        var query = searchInput ? searchInput.value.trim() : '';

        function renderItemTools(item, kind) {
            var actions = [];
            if (item.url) actions.push('<a class="prefs-btn secondary" href="' + escapeHtml(item.url) + '">打开</a>');
            if (kind === 'history' && item.url) actions.push('<a class="prefs-btn primary" href="' + escapeHtml(item.url) + '">继续</a>');
            actions.push('<button class="prefs-btn secondary" data-item-delete="' + escapeHtml(item.key) + '" data-item-kind="' + kind + '">删除</button>');
            return '<div class="prefs-item-tools">' + actions.join('') + '</div>';
        }

        function renderMetaChips(item, kind) {
            var chips = [];
            if (kind === 'favorite') chips.push('<span class="prefs-chip">收藏</span>');
            if (kind === 'history') chips.push('<span class="prefs-chip">历史</span>');
            if (item.tab) chips.push('<span class="prefs-chip">' + escapeHtml(item.tab) + '</span>');
            if (item.chapter) chips.push('<span class="prefs-chip">' + escapeHtml(item.chapter) + '</span>');
            if (item.chapterId) chips.push('<span class="prefs-chip">#' + escapeHtml(item.chapterId) + '</span>');
            if (item.position && typeof item.position.percent === 'number') chips.push('<span class="prefs-chip">' + escapeHtml('约 ' + item.position.percent + '%') + '</span>');
            return chips.join('');
        }

        function setSectionMeta(section) {
            if (section === 'favorites') {
                if (sectionTitle) sectionTitle.textContent = '收藏';
                if (sectionDesc) sectionDesc.textContent = '查看你在当前浏览器保存的文章收藏，直接打开、删除或快速检索。';
                if (sectionKicker) sectionKicker.textContent = '本地收藏';
                if (sidebarNote) sidebarNote.textContent = '收藏用于快速回到你最常回看的文章。';
                if (searchWrap) searchWrap.style.display = '';
            } else if (section === 'history') {
                if (sectionTitle) sectionTitle.textContent = '阅读历史';
                if (sectionDesc) sectionDesc.textContent = '记录最近阅读位置，支持继续阅读与单条删除。';
                if (sectionKicker) sectionKicker.textContent = '最近阅读';
                if (sidebarNote) sidebarNote.textContent = '历史会保留 Tab、章节、位置和更新时间。';
                if (searchWrap) searchWrap.style.display = '';
            } else {
                if (sectionTitle) sectionTitle.textContent = '视图设置';
                if (sectionDesc) sectionDesc.textContent = '这里保留站点展示模式、密度设置与本地数据管理入口。';
                if (sectionKicker) sectionKicker.textContent = '设置中心';
                if (sidebarNote) sidebarNote.textContent = '视图设置先保留接口，后续可以继续接入统一布局。';
                if (searchWrap) searchWrap.style.display = 'none';
            }
        }

        function renderFavoritesSection(items) {
            return '<div class="prefs-content-grid">' + items.map(function (item) {
                var pathText = item.path || item.url || '';
                return '<article class="prefs-entry-card"><div class="prefs-entry-head"><div><div class="prefs-entry-title">' + escapeHtml(item.title) + '</div><div class="prefs-entry-sub">' + escapeHtml(pathText) + '</div></div>' + renderItemTools(item, 'favorite') + '</div><div class="prefs-chip-row">' + renderMetaChips(item, 'favorite') + '</div></article>';
            }).join('') + '</div>';
        }

        function renderHistorySection(items) {
            return '<div class="prefs-content-grid">' + items.map(function (item) {
                var pos = item.position && typeof item.position.percent === 'number' ? ('约 ' + item.position.percent + '%') : '位置未记录';
                var tab = item.tab ? ('Tab：' + item.tab) : 'Tab：未记录';
                var chapter = item.chapter ? ('章节：' + item.chapter) : '章节：未记录';
                var chapterId = item.chapterId ? (' · #' + item.chapterId) : '';
                return '<article class="prefs-entry-card"><div class="prefs-entry-head"><div><div class="prefs-entry-title">' + escapeHtml(item.title) + '</div><div class="prefs-entry-sub">' + escapeHtml(tab) + ' · ' + escapeHtml(chapter + chapterId) + ' · ' + escapeHtml(pos) + '</div><div class="prefs-entry-sub">' + escapeHtml(item.updatedAt || '') + '</div></div>' + renderItemTools(item, 'history') + '</div><div class="prefs-chip-row">' + renderMetaChips(item, 'history') + '</div></article>';
            }).join('') + '</div>';
        }

        function renderSettingsSection() {
            return [
                '<div class="prefs-content-grid">',
                '<section class="prefs-panel-card">',
                '<div class="prefs-panel-head"><div><div class="prefs-panel-kicker">视图设置</div><div class="prefs-panel-title">展示模式</div><div class="prefs-panel-desc">先保留接口，后续可统一管理展示模式。</div></div></div>',
                '<div class="prefs-field"><label for="viewModeSelect">展示模式</label><select id="viewModeSelect"><option value="card">卡片模式</option><option value="compact">紧凑列表</option><option value="mixed">混合模式</option></select></div>',
                '<div class="prefs-field"><label for="densitySelect">密度</label><select id="densitySelect"><option value="normal">标准</option><option value="dense">紧凑</option></select></div>',
                '<div class="prefs-setting-grid">',
                '<div class="prefs-setting-tile"><div class="prefs-setting-label">显示重点</div><div class="prefs-setting-value">统一卡片 / 列表切换</div></div>',
                '<div class="prefs-setting-tile"><div class="prefs-setting-label">后续接入</div><div class="prefs-setting-value">文章、文艺、下载…</div></div>',
                '</div>',
                '<div class="prefs-setting-note">当前仅保存本地偏好，具体页面适配会逐步接入。此处保留为全站展示模式的入口。</div>',
                '</section>',
                '<section class="prefs-panel-card">',
                '<div class="prefs-panel-head"><div><div class="prefs-panel-kicker">数据管理</div><div class="prefs-panel-title">偏好导入导出</div><div class="prefs-panel-desc">导出或导入当前浏览器里的本地偏好，方便迁移和备份。</div></div></div>',
                '<div class="prefs-field"><label for="prefsDataBox">偏好 JSON</label><textarea id="prefsDataBox" rows="7" placeholder="点击导出后会显示当前偏好；也可以粘贴 JSON 后导入。"></textarea></div>',
                '<div id="prefsDataMessage" class="prefs-help"></div>',
                '<div class="prefs-actions"><button class="prefs-btn primary" id="exportPrefsBtn">导出</button><button class="prefs-btn secondary" id="importPrefsBtn">导入</button><button class="prefs-btn secondary" id="resetPrefsBtn">重置全部</button></div>',
                '</section>',
                '</div>'
            ].join('');
        }

        var filteredFavorites = state.favorites.filter(function (item) { return itemMatchesQuery(item, query); });
        var filteredHistory = state.history.filter(function (item) { return itemMatchesQuery(item, query); });

        var sections = {
            favorites: {
                title: '收藏',
                kicker: '本地收藏',
                desc: '查看你在当前浏览器保存的文章收藏，直接打开、删除或快速检索。',
                count: filteredFavorites.length,
                total: state.favorites.length,
                html: renderFavoritesSection(filteredFavorites)
            },
            history: {
                title: '阅读历史',
                kicker: '最近阅读',
                desc: '记录最近阅读位置，支持继续阅读与单条删除。',
                count: filteredHistory.length,
                total: state.history.length,
                html: renderHistorySection(filteredHistory)
            },
            settings: {
                title: '设置',
                kicker: '设置中心',
                desc: '这里保留站点展示模式、密度设置与本地数据管理入口。',
                count: '',
                total: '',
                html: renderSettingsSection()
            }
        };

        if (!sections[currentSection]) currentSection = 'favorites';

        var navButtons = document.querySelectorAll('.prefs-nav-item');
        for (var n = 0; n < navButtons.length; n++) {
            var btn = navButtons[n];
            var section = btn.getAttribute('data-prefs-section');
            if (section === currentSection) btn.classList.add('active');
            else btn.classList.remove('active');
        }

        if (sectionBody) sectionBody.innerHTML = sections[currentSection].html;
        setSectionMeta(currentSection);

        var renderedViewModeSelect = document.getElementById('viewModeSelect');
        var renderedDensitySelect = document.getElementById('densitySelect');
        if (currentSection === 'settings') {
            if (renderedViewModeSelect) renderedViewModeSelect.value = state.view.mode || DEFAULTS.view.mode;
            if (renderedDensitySelect) renderedDensitySelect.value = state.view.density || DEFAULTS.view.density;
        }

        if (favoriteCount) favoriteCount.textContent = String(state.favorites.length);
        if (historyCount) historyCount.textContent = String(state.history.length);
        if (favoritesCountLabel) favoritesCountLabel.textContent = String(state.favorites.length) + ' 项';
        if (historyCountLabel) historyCountLabel.textContent = String(state.history.length) + ' 项';
        if (navFavoritesCount) navFavoritesCount.textContent = String(state.favorites.length);
        if (navHistoryCount) navHistoryCount.textContent = String(state.history.length);
        if (viewModeLabel) viewModeLabel.textContent = getViewModeLabel(state.view.mode);
        if (densityLabel) densityLabel.textContent = getDensityLabel(state.view.density);
        if (dataStateLabel) dataStateLabel.textContent = '本地';

        if (viewModeSelect) viewModeSelect.value = state.view.mode || DEFAULTS.view.mode;
        if (densitySelect) densitySelect.value = state.view.density || DEFAULTS.view.density;

        if (sectionBody) {
            if (currentSection === 'settings') {
                var settingsRender = renderSettingsSection();
                sectionBody.innerHTML = settingsRender;
                if (viewModeSelect) viewModeSelect.value = state.view.mode || DEFAULTS.view.mode;
                if (densitySelect) densitySelect.value = state.view.density || DEFAULTS.view.density;
            }
        }
    }

    function bindPageActions() {
        var root = document.querySelector('.prefs-page');
        if (!root || root.__prefsBound) return;
        root.__prefsBound = true;
        var prefsSearchInput = document.getElementById('prefsSearchInput');
        var prefsDataBox = document.getElementById('prefsDataBox');
        var prefsDataMessage = document.getElementById('prefsDataMessage');

        function setMessage(text) {
            if (prefsDataMessage) prefsDataMessage.textContent = text || '';
        }

        function exportToBox() {
            if (!prefsDataBox) return;
            prefsDataBox.value = JSON.stringify(readState(), null, 2);
            setMessage('已导出当前偏好。');
        }

        root.addEventListener('click', function (e) {
            var target = e.target;
            if (!target) return;

            var navBtn = target.closest ? target.closest('.prefs-nav-item') : null;
            if (navBtn && root.contains(navBtn)) {
                var section = navBtn.getAttribute('data-prefs-section');
                if (section) {
                    var stateNav = readState();
                    stateNav.ui.section = section;
                    writeState(stateNav);
                    renderPreferencesPage();
                }
                return;
            }

            var deleteBtn = target.closest ? target.closest('[data-item-delete]') : null;
            if (deleteBtn && root.contains(deleteBtn)) {
                var key = deleteBtn.getAttribute('data-item-delete');
                var kind = deleteBtn.getAttribute('data-item-kind');
                if (!key) return;
                if (kind === 'favorite') removeFavoriteByKey(key);
                if (kind === 'history') removeHistoryByKey(key);
                renderPreferencesPage();
                setMessage(kind === 'favorite' ? '已删除一条收藏。' : '已删除一条历史。');
                return;
            }

            if (target.id === 'clearFavoritesBtn') {
                var stateFav = readState();
                stateFav.favorites = [];
                writeState(stateFav);
                renderPreferencesPage();
                setMessage('收藏已清空。');
                return;
            }

            if (target.id === 'clearHistoryBtn') {
                var stateHist = readState();
                stateHist.history = [];
                writeState(stateHist);
                renderPreferencesPage();
                setMessage('历史已清空。');
                return;
            }

            if (target.id === 'exportPrefsBtn' || target.id === 'exportQuickBtn') {
                exportToBox();
                return;
            }

            if (target.id === 'importPrefsBtn') {
                if (!prefsDataBox) return;
                var parsed = safeJsonParse(prefsDataBox.value, null);
                if (!parsed || typeof parsed !== 'object') {
                    setMessage('JSON 格式无效，未导入。');
                    return;
                }
                var next = cloneDefaults();
                next.favorites = Array.isArray(parsed.favorites) ? parsed.favorites : [];
                next.history = Array.isArray(parsed.history) ? parsed.history : [];
                next.view = parsed.view && typeof parsed.view === 'object' ? parsed.view : cloneDefaults().view;
                next.ui = parsed.ui && typeof parsed.ui === 'object' ? parsed.ui : cloneDefaults().ui;
                writeState(next);
                renderPreferencesPage();
                setMessage('偏好已导入。');
                return;
            }

            if (target.id === 'resetPrefsBtn') {
                writeState(cloneDefaults());
                renderPreferencesPage();
                if (prefsDataBox) prefsDataBox.value = '';
                setMessage('全部偏好已重置。');
                return;
            }

            if (target.id === 'refreshPrefsBtn') {
                renderPreferencesPage();
                setMessage('列表已刷新。');
                return;
            }
        });

        root.addEventListener('change', function (e) {
            var target = e.target;
            if (!target) return;
            if (target.id === 'viewModeSelect') {
                var stateMode = readState();
                stateMode.view.mode = target.value;
                writeState(stateMode);
                renderPreferencesPage();
                setMessage('展示模式已保存。');
                return;
            }
            if (target.id === 'densitySelect') {
                var stateDensity = readState();
                stateDensity.view.density = target.value;
                writeState(stateDensity);
                renderPreferencesPage();
                setMessage('显示密度已保存。');
            }
        });

        if (prefsSearchInput) {
            prefsSearchInput.addEventListener('input', function () {
                renderPreferencesPage();
            });
        }

        root.addEventListener('input', function (e) {
            if (e.target && e.target.id === 'prefsSearchInput') {
                renderPreferencesPage();
            }
        });
    }

    function injectArticleControls() {
        var header = document.querySelector('.article-header');
        if (!header) return;
        if (document.getElementById('articlePreferenceControls')) return;
        var controls = document.createElement('div');
        controls.id = 'articlePreferenceControls';
        controls.className = 'prefs-actions article-preference-controls';
        controls.style.marginTop = '0.85rem';
        controls.innerHTML = '<button type="button" class="prefs-btn primary article-favorite-btn" data-qmlm-favorite-btn="">收藏本文</button><button type="button" class="prefs-btn secondary" id="recordReadingBtn">记录当前位置</button>';
        header.appendChild(controls);
        var favoriteBtn = controls.querySelector('.article-favorite-btn');
        var recordBtn = document.getElementById('recordReadingBtn');
        var articleInfo = getArticleMeta();
        if (favoriteBtn) {
            favoriteBtn.setAttribute('data-qmlm-favorite-btn', articleInfo.key || articleKeyFromBody());
            bindFavoriteButton(favoriteBtn, getArticleMeta);
        }
        if (recordBtn) {
            recordBtn.addEventListener('click', function () {
                upsertHistory(getArticleMeta());
                recordBtn.textContent = '已记录';
            });
        }
        var updateAndSave = function () {
            upsertHistory(getArticleMeta());
        };
        window.addEventListener('beforeunload', updateAndSave);
        if (articleInfo && articleInfo.key) {
            updateFavoriteButtonState(favoriteBtn, articleInfo.key);
        }
        var restoreOnce = function () {
            restoreReadingState();
        };
        if (window.__QMLMArticleRendered) {
            restoreOnce();
        } else {
            window.addEventListener('qmlm:article-rendered', restoreOnce, { once: true });
        }
    }

    function boot() {
        if (document.getElementById('favoritesList') || document.getElementById('prefsSectionBody')) {
            renderPreferencesPage();
            bindPageActions();
        }
        if (document.querySelector('.article-header')) {
            injectArticleControls();
            var saveArticleHistory = function () {
                upsertHistory(getArticleMeta());
                syncArticleFavoriteButtons(document);
            };
            if (window.__QMLMArticleRendered) {
                window.setTimeout(saveArticleHistory, 0);
            } else {
                window.addEventListener('qmlm:article-rendered', saveArticleHistory, { once: true });
            }
            window.setTimeout(saveArticleHistory, 1200);
        }
        syncArticleFavoriteButtons(document);
        installFavoriteObserver();
        window.addEventListener('qmlm:preferences-changed', function () {
            syncArticleFavoriteButtons(document);
        });
        window.addEventListener('storage', function (e) {
            if (e && e.key === STORAGE_KEY) syncArticleFavoriteButtons(document);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    window.QMLMPreferences = {
        readState: readState,
        writeState: writeState,
        upsertFavorite: upsertFavorite,
        upsertHistory: upsertHistory,
        getArticleMeta: getArticleMeta,
        syncArticleFavoriteButtons: syncArticleFavoriteButtons
    };
})();
