// 马哲理论拼图（theory-map）页面逻辑
// 自 html/puzzle/theory-map.html 内联脚本迁出（2026-11）。
// 变更：删除与 js/main.js 重复绑定的汉堡菜单 IIFE；删除私有 toggleDarkMode
// /localStorage 恢复（js/darkmode.js 统一负责）；WIP 文章改为灰态占位，不再 alert。
(function () {
    'use strict';

    // ==================== 节点弹卡 ====================
    window.showCard = function (id) {
        const a = PUZZLE_ARTICLES[id];
        if (!a) return;
        document.getElementById('popupTitle').textContent = a.title;
        document.getElementById('popupMeta').textContent = a.meta;
        document.getElementById('popupDesc').textContent = a.desc;
        document.getElementById('popupPosition').textContent = a.position;
        const badge = document.getElementById('popupBadge');
        const categoryTheme = window.QMLMCategoryTheme && window.QMLMCategoryTheme.get(a.badge);
        const badgeColor = categoryTheme ? getComputedStyle(document.documentElement).getPropertyValue('--category-' + categoryTheme.key + '-primary').trim() : '#666666';
        badge.textContent = a.badge + ' ' + (a.stars || '');
        badge.style.background = badgeColor + '22';
        badge.style.color = badgeColor;
        badge.style.border = '1px solid ' + badgeColor;
        const popupLink = document.getElementById('popupLink');
        if (!a.link) {
            // 未施工文章：灰态「施工中」占位，不跳转、不 alert
            popupLink.removeAttribute('href');
            popupLink.onclick = null;
            popupLink.classList.add('is-wip');
            popupLink.textContent = ' 施工中';
        } else {
            popupLink.href = a.link;
            popupLink.onclick = null;
            popupLink.classList.remove('is-wip');
            popupLink.textContent = ' 进入精读';
        }
        document.getElementById('cardPopup').classList.add('active');
        document.getElementById('overlay').classList.add('active');
    };

    window.closeCard = function () {
        document.getElementById('cardPopup').classList.remove('active');
        document.getElementById('overlay').classList.remove('active');
    };

    // ==================== 导师筛选 ====================
    let currentFilter = null;

    window.filterByAuthor = function (author) {
        const buttons = document.querySelectorAll('.filter-btn');
        const nodes = document.querySelectorAll('.node-group');
        if (currentFilter === author) {
            currentFilter = null;
            buttons.forEach(btn => btn.classList.remove('active'));
            nodes.forEach(node => node.classList.remove('dimmed'));
        } else {
            currentFilter = author;
            buttons.forEach(btn => btn.classList.toggle('active', btn.dataset.author === author));
            nodes.forEach(node => node.classList.toggle('dimmed', node.dataset.author !== author));
        }
    };

    window.resetFilter = function () {
        currentFilter = null;
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.node-group').forEach(node => node.classList.remove('dimmed'));
    };

    // ==================== 画布平移缩放 ====================
    const container = document.getElementById('puzzleContainer');
    const canvas = document.getElementById('puzzleCanvas');
    let scale = 0.45;
    let translateX = 0, translateY = 20;
    let isDragging = false, startX, startY, startTX, startTY;

    function applyTransform() {
        canvas.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }
    applyTransform();

    container.addEventListener('mousedown', e => {
        if (e.target.closest('.node-group')) return;
        isDragging = true;
        startX = e.clientX; startY = e.clientY;
        startTX = translateX; startTY = translateY;
        e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
        if (!isDragging) return;
        translateX = startTX + (e.clientX - startX);
        translateY = startTY + (e.clientY - startY);
        applyTransform();
    });
    document.addEventListener('mouseup', () => isDragging = false);
    container.addEventListener('wheel', e => {
        e.preventDefault();
        scale = Math.max(0.2, Math.min(2, scale + (e.deltaY > 0 ? -0.05 : 0.05)));
        applyTransform();
    }, { passive: false });

    let lastTouchDist = null;
    container.addEventListener('touchstart', e => {
        if (e.touches.length === 1) {
            isDragging = true;
            startX = e.touches[0].clientX; startY = e.touches[0].clientY;
            startTX = translateX; startTY = translateY;
        }
    });
    container.addEventListener('touchmove', e => {
        e.preventDefault();
        if (e.touches.length === 1 && isDragging) {
            translateX = startTX + (e.touches[0].clientX - startX);
            translateY = startTY + (e.touches[0].clientY - startY);
            applyTransform();
        } else if (e.touches.length === 2) {
            const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
            if (lastTouchDist) {
                scale = Math.max(0.2, Math.min(2, scale * (dist / lastTouchDist)));
                applyTransform();
            }
            lastTouchDist = dist;
        }
    }, { passive: false });
    container.addEventListener('touchend', () => { isDragging = false; lastTouchDist = null; });

    window.zoomIn = function () { scale = Math.min(2, scale + 0.1); applyTransform(); };
    window.zoomOut = function () { scale = Math.max(0.2, scale - 0.1); applyTransform(); };
    window.resetView = function () { scale = 0.45; translateX = 0; translateY = 20; applyTransform(); };

    // ==================== 画布页导航适配 ====================
    // 实测 .site-header 高度写入 --masthead-h，供 theory-map.css 的
    // calc(100vh - var(--masthead-h)) 限定画布高度（参照 js/mentor/stalin/stellar-boot.js）。
    // 导航收起为悬浮球时（body.nav-collapsed / QMLMState.ui.navCollapsed），画布铺满全屏。
    (function () {
        const root = document.documentElement;

        function navCollapsed() {
            if (document.body.classList.contains('nav-collapsed')) return true;
            if (window.QMLMState && typeof window.QMLMState.getDomain === 'function') {
                const ui = window.QMLMState.getDomain('ui');
                return !!(ui && ui.navCollapsed);
            }
            return false;
        }

        function sync() {
            const header = document.querySelector('.site-header');
            // 收起态下 header 仅被 translateY 移出视野、仍占文档流，
            // 由 CSS 用 --masthead-flow-h 负 margin 抵消（见 theory-map.css）
            if (header && header.offsetHeight > 0) {
                root.style.setProperty('--masthead-flow-h', header.offsetHeight + 'px');
            }
            if (navCollapsed()) {
                root.style.setProperty('--masthead-h', '0px');
                return;
            }
            if (header && header.offsetHeight > 0) {
                root.style.setProperty('--masthead-h', header.offsetHeight + 'px');
            }
        }

        function boot() {
            sync();
            const header = document.querySelector('.site-header');
            if (header && 'ResizeObserver' in window) {
                new ResizeObserver(sync).observe(header);
            }
            window.addEventListener('resize', sync);
            // 首帧布局落定（纵向滚动条出现、末次换行）可能晚于 DOMContentLoaded，
            // load 与双 rAF 再各校一次，避免 --masthead-h 记住过渡态高度
            window.addEventListener('load', sync);
            requestAnimationFrame(function () { requestAnimationFrame(sync); });
            // 收起/展开不改变 header 尺寸，需订阅状态中心（含跨标签同步）
            function bindNavCollapse() {
                if (window.QMLMState && typeof window.QMLMState.subscribe === 'function') {
                    window.QMLMState.subscribe('ui.navCollapsed', sync);
                }
            }
            bindNavCollapse();
            window.addEventListener('qmlm:state-ready', bindNavCollapse);
            // 兜底：body class 直接变化（如 state-center 加载前的早期还原）
            new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'] });
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', boot);
        } else {
            boot();
        }
    })();
})();
