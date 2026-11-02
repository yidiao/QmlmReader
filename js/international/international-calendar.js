/**
 * 国际共运日历 · 页面逻辑
 * 数据源: data/history-events.js（全局 historyData，641 条史实）
 * 职责: 月份导航 / 分类·时代·搜索三维筛选 / 日期抽屉 / 想一想 / 文献串联 / 随机回眸
 */
(function () {
    'use strict';

    if (typeof historyData === 'undefined') {
        console.error('[international-calendar] historyData 未加载');
        return;
    }

    /* ---------------- 元数据 ---------------- */

    const CATEGORIES = {
        revolution: '革命事件',
        war: '战争军事',
        political: '政治事件',
        person: '人物',
        culture: '文化思想'
    };

    const NATURES = { positive: '积极', negative: '挫折', neutral: '转折' };

    // 时代分区（按年份区间，用于筛选与计数）
    const ERAS = [
        { id: 'awakening', label: '觉醒年代', from: 1789, to: 1863 },
        { id: 'first-intl', label: '第一国际', from: 1864, to: 1876 },
        { id: 'second-intl', label: '第二国际', from: 1877, to: 1916 },
        { id: 'october-wave', label: '十月革命与世界浪潮', from: 1917, to: 1936 },
        { id: 'antifascist', label: '反法西斯战争', from: 1937, to: 1945 },
        { id: 'liberation', label: '解放与建国', from: 1946, to: 1956 },
        { id: 'debate', label: '论战与探索', from: 1957, to: 1976 },
        { id: 'epilogue', label: '剧变与回望', from: 1977, to: 1999 }
    ];
    const ERA_MAP = {};
    ERAS.forEach(e => { ERA_MAP[e.id] = e; });

    // 想一想兜底题：事件自带 think 时优先，否则按类目给一条
    const FALLBACK_THINK = {
        war: '革命者为何而战？正义战争与"反战争"的理念如何统一？',
        revolution: '这场斗争改变了什么？群众是怎样被动员和组织起来的？',
        political: '决策背后的路线考量是什么？它给后来留下了怎样的经验教训？',
        person: '他们为什么能把个人命运投入到人类解放事业之中？',
        culture: '文化与革命是什么关系？为什么"笔杆子"同样重要？'
    };

    const DRAWN_KEY = 'qmlm:calendar-drawn';

    /* ---------------- 数据索引 ---------------- */

    const index = {};   // index[m][d] = [event]
    const all = [];     // 全部事件（附 __m / __d / id）
    let minYear = 9999;
    let maxYear = 0;

    for (let m = 1; m <= 12; m++) {
        index[m] = {};
        (historyData[m] || []).forEach((e, i) => {
            const mm = /(\d+)月(\d+)日/.exec(e.date || '');
            if (!mm) return;
            const day = +mm[2];
            const ev = Object.assign({}, e, { __m: m, __d: day, id: m + '-' + day + '-' + e.year + '-' + i });
            (index[m][day] || (index[m][day] = [])).push(ev);
            all.push(ev);
            if (e.year < minYear) minYear = e.year;
            if (e.year > maxYear) maxYear = e.year;
        });
    }

    // 同一天内按年份升序，预览与抽屉更符合编年直觉
    for (let m = 1; m <= 12; m++) {
        Object.keys(index[m]).forEach(d => { index[m][d].sort((a, b) => a.year - b.year); });
    }

    /* ---------------- 状态 ---------------- */

    const today = new Date();
    const state = {
        month: today.getMonth() + 1,
        selectedDay: today.getDate(),
        cats: new Set(),   // 空 = 全部
        eras: new Set(),   // 空 = 全部
        query: ''
    };

    let drawerOpener = null; // 关闭抽屉后归还焦点

    /* ---------------- 工具 ---------------- */

    const $ = sel => document.querySelector(sel);

    const escapeHtml = s => String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    const matchesFilters = ev => {
        if (state.cats.size && !state.cats.has(ev.category)) return false;
        if (state.eras.size) {
            let inEra = false;
            state.eras.forEach(id => {
                const era = ERA_MAP[id];
                if (era && ev.year >= era.from && ev.year <= era.to) inEra = true;
            });
            if (!inEra) return false;
        }
        if (state.query) {
            const q = state.query.toLowerCase();
            const hay = (ev.title + ' ' + (ev.desc || '') + ' ' + ev.year).toLowerCase();
            if (!hay.includes(q)) return false;
        }
        return true;
    };

    // 抽屉展示当日"全部"史实（不受筛选影响，筛选只作用于月历网格）
    const rawEventsForDay = (m, d) => (index[m] && index[m][d]) || [];
    const eventsForDay = (m, d) => rawEventsForDay(m, d).filter(matchesFilters);
    const monthCount = m => Object.keys(index[m] || {})
        .reduce((s, d) => s + eventsForDay(m, d).length, 0);

    /* ---------------- 渲染：统计 ---------------- */

    function renderStats() {
        const el = $('#calStats');
        if (!el) return;
        el.innerHTML =
            '<span class="stat-chip"><b>' + all.length + '</b> 条史实</span>' +
            '<span class="stat-chip">覆盖 <b>' + minYear + '–' + maxYear + '</b> 年</span>' +
            '<span class="stat-chip">' + ERAS.length + ' 个时代</span>';
    }

    /* ---------------- 渲染：月份侧栏 ---------------- */

    function renderMonthList() {
        const list = $('#monthList');
        if (!list) return;
        const counts = [];
        let max = 1;
        for (let m = 1; m <= 12; m++) {
            const c = monthCount(m);
            counts.push(c);
            if (c > max) max = c;
        }
        let html = '';
        for (let m = 1; m <= 12; m++) {
            const active = state.month === m;
            const step = Math.round(counts[m - 1] / max * 10) * 10; // 10~100，柱宽档位
            const barCls = 'month-bar-fill b' + Math.max(step, counts[m - 1] ? 10 : 0);
            html +=
                '<button type="button" class="month-item' + (active ? ' active' : '') + '" data-month="' + m + '"' +
                (active ? ' aria-current="true"' : '') + '>' +
                '<span class="month-name">' + m + '月</span>' +
                '<span class="month-count">' + counts[m - 1] + '</span>' +
                '<span class="month-bar"><i class="' + barCls + '"></i></span>' +
                '</button>';
        }
        list.innerHTML = html;
        list.querySelectorAll('.month-item').forEach(btn => {
            btn.addEventListener('click', () => {
                state.month = +btn.dataset.month;
                state.selectedDay = null;
                renderMonthList();
                renderGrid();
            });
        });
    }

    /* ---------------- 渲染：筛选 chips ---------------- */

    function renderCategoryChips() {
        const wrap = $('#categoryFilters');
        if (!wrap) return;
        const counts = {};
        all.forEach(e => { counts[e.category] = (counts[e.category] || 0) + 1; });

        let html = '<button type="button" class="filter-chip' + (state.cats.size ? '' : ' active') + '" data-cat="">' +
            '全部 <i>' + all.length + '</i></button>';
        Object.keys(CATEGORIES).forEach(c => {
            const active = state.cats.has(c);
            html +=
                '<button type="button" class="filter-chip has-dot' + (active ? ' active' : '') + '" data-cat="' + c + '"' +
                ' aria-pressed="' + active + '">' +
                '<span class="dot dot-' + c + '"></span>' + CATEGORIES[c] + ' <i>' + (counts[c] || 0) + '</i></button>';
        });
        wrap.innerHTML = html;

        wrap.querySelectorAll('.filter-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                const c = btn.dataset.cat;
                if (!c) state.cats.clear();
                else if (state.cats.has(c)) state.cats.delete(c);
                else state.cats.add(c);
                state.selectedDay = null;
                renderCategoryChips();
                renderMonthList();
                renderGrid();
            });
        });
    }

    function renderEraChips() {
        const wrap = $('#eraFilters');
        if (!wrap) return;
        const counts = {};
        all.forEach(e => {
            ERAS.forEach(era => {
                if (e.year >= era.from && e.year <= era.to) {
                    counts[era.id] = (counts[era.id] || 0) + 1;
                }
            });
        });
        let html = '<span class="era-label">时代</span>';
        ERAS.forEach(era => {
            const active = state.eras.has(era.id);
            html +=
                '<button type="button" class="era-chip' + (active ? ' active' : '') + '" data-era="' + era.id + '"' +
                ' aria-pressed="' + active + '">' + era.label + ' <i>' + (counts[era.id] || 0) + '</i></button>';
        });
        wrap.innerHTML = html;

        wrap.querySelectorAll('.era-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.era;
                if (state.eras.has(id)) state.eras.delete(id);
                else state.eras.add(id);
                state.selectedDay = null;
                renderEraChips();
                renderMonthList();
                renderGrid();
            });
        });
    }

    /* ---------------- 渲染：日历网格 ---------------- */

    function renderGrid() {
        const grid = $('#daysGrid');
        if (!grid) return;
        const year = today.getFullYear();
        const first = new Date(year, state.month - 1, 1).getDay();
        const days = new Date(year, state.month, 0).getDate();

        let html = '';
        for (let i = 0; i < first; i++) {
            html += '<div class="day-cell is-empty" aria-hidden="true"></div>';
        }
        for (let d = 1; d <= days; d++) {
            const evs = eventsForDay(state.month, d);
            const isToday = today.getDate() === d && today.getMonth() + 1 === state.month;
            const cls = ['day-cell'];
            if (!evs.length) cls.push('is-blank');
            if (isToday) cls.push('is-today');
            if (state.selectedDay === d) cls.push('is-selected');

            let dots = '';
            evs.slice(0, 4).forEach(e => { dots += '<span class="dot dot-' + e.category + '"></span>'; });
            if (evs.length > 4) dots += '<span class="dot-more">+' + (evs.length - 4) + '</span>';

            const preview = evs.length
                ? '<span class="cell-preview">' + evs[0].year + ' · ' + escapeHtml(evs[0].title) + '</span>'
                : '';

            html +=
                '<button type="button" class="' + cls.join(' ') + '" data-day="' + d + '"' +
                ' aria-label="' + state.month + '月' + d + '日，' + evs.length + '条史实">' +
                '<span class="day-number">' + d + '</span>' +
                '<span class="cell-dots">' + dots + '</span>' +
                preview +
                '</button>';
        }
        grid.innerHTML = html;

        grid.querySelectorAll('.day-cell[data-day]').forEach(cell => {
            cell.addEventListener('click', () => { openDrawer(+cell.dataset.day, cell); });
        });
    }

    /* ---------------- 抽屉 ---------------- */

    function eventCardHtml(e) {
        const anniv = today.getFullYear() - e.year;
        const annivHtml = anniv > 0 ? '<span class="event-anniv">' + anniv + ' 周年</span>' : '';

        let media = '';
        if ('img' in e) {
            media = e.img
                ? '<figure class="event-media"><img src="' + escapeHtml(e.img) + '" alt="' + escapeHtml(e.title) + ' 史料图" loading="lazy"></figure>'
                : '<figure class="event-media is-placeholder"><span class="media-star">★</span><span class="media-text">史料图 · 待补</span></figure>';
        }

        const think = e.think || FALLBACK_THINK[e.category];
        const thinkHtml = think
            ? '<aside class="event-think"><span class="think-mark">✦</span><div class="think-body"><h5>想一想</h5><p>' +
              escapeHtml(think) + '</p></div></aside>'
            : '';

        const linksHtml = (e.links && e.links.length)
            ? '<div class="event-links">' + e.links.map(l =>
                '<a class="event-link" href="' + escapeHtml(l.href) + '">' +
                escapeHtml(l.label) + '<span class="arrow">↗</span></a>').join('') + '</div>'
            : '';

        return (
            '<article class="popup-event">' +
                '<header class="event-head">' +
                    '<span class="event-year">' + e.year + '</span>' +
                    annivHtml +
                    '<span class="event-chip chip-' + e.category + '">' + (CATEGORIES[e.category] || e.category) + '</span>' +
                    '<span class="event-nature nature-' + e.nature + '">' + (NATURES[e.nature] || '') + '</span>' +
                '</header>' +
                '<h4 class="event-title">' + escapeHtml(e.title) + '</h4>' +
                media +
                '<p class="event-desc">' + escapeHtml(e.desc || '') + '</p>' +
                thinkHtml +
                linksHtml +
            '</article>'
        );
    }

    function openDrawer(day, opener) {
        state.selectedDay = day;
        drawerOpener = opener || null;

        const evs = rawEventsForDay(state.month, day);
        $('#popupTitle').textContent = state.month + '月' + day + '日';
        $('#popupSub').textContent = evs.length ? evs.length + ' 条史实' : '这一天暂无记录';

        const body = $('#popupBody');
        body.innerHTML = evs.length
            ? evs.map(eventCardHtml).join('')
            : '<div class="popup-empty"><span class="empty-star">★</span>这一天没有记录，换个日子看看。</div>';

        const popup = $('#dayPopup');
        const overlay = $('#popupOverlay');
        popup.hidden = false;
        overlay.hidden = false;
        // 强制回流后再加类，保证过渡从初始态开始（rAF 在节流环境不可靠）
        void popup.offsetWidth;
        popup.classList.add('is-open');
        overlay.classList.add('is-open');
        document.body.classList.add('cal-locked');
        $('#popupClose').focus();
        renderGrid();
    }

    function closeDrawer() {
        const popup = $('#dayPopup');
        const overlay = $('#popupOverlay');
        popup.classList.remove('is-open');
        overlay.classList.remove('is-open');
        document.body.classList.remove('cal-locked');
        window.setTimeout(() => { popup.hidden = true; overlay.hidden = true; }, 220);
        state.selectedDay = null;
        if (drawerOpener && document.contains(drawerOpener)) drawerOpener.focus();
        drawerOpener = null;
        renderGrid();
    }

    /* ---------------- 随机回眸 ---------------- */

    function randomDraw() {
        let drawn = [];
        try { drawn = JSON.parse(localStorage.getItem(DRAWN_KEY) || '[]'); } catch (err) { drawn = []; }
        let pool = all.filter(e => drawn.indexOf(e.id) === -1);
        if (!pool.length) { drawn = []; pool = all; }
        const pick = pool[Math.floor(Math.random() * pool.length)];
        drawn.push(pick.id);
        try { localStorage.setItem(DRAWN_KEY, JSON.stringify(drawn)); } catch (err) { /* 存储不可用时忽略 */ }

        state.month = pick.__m;
        renderMonthList();
        renderGrid();
        openDrawer(pick.__d, $('#randomBtn'));
        announce('抽中 ' + pick.year + ' 年：' + pick.title);
    }

    function announce(text) {
        const el = $('#calA11y');
        if (el) el.textContent = text;
    }

    /* ---------------- 回到今天 ---------------- */

    function backToday() {
        state.month = today.getMonth() + 1;
        state.selectedDay = today.getDate();
        renderMonthList();
        renderGrid();
        announce('已回到今天：' + (today.getMonth() + 1) + '月' + today.getDate() + '日');
    }

    /* ---------------- 初始化 ---------------- */

    function init() {
        renderStats();
        renderMonthList();
        renderCategoryChips();
        renderEraChips();
        renderGrid();

        $('#popupClose').addEventListener('click', closeDrawer);
        $('#popupOverlay').addEventListener('click', closeDrawer);
        $('#randomBtn').addEventListener('click', randomDraw);
        $('#backTodayBtn').addEventListener('click', backToday);

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && !$('#dayPopup').hidden) closeDrawer();
        });

        // 搜索（防抖）
        let timer = null;
        $('#calSearch').addEventListener('input', e => {
            window.clearTimeout(timer);
            timer = window.setTimeout(() => {
                state.query = e.target.value.trim();
                state.selectedDay = null;
                renderMonthList();
                renderGrid();
            }, 200);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
