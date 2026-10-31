// 母站接入层：实测 .site-header 高度写入 --masthead-h，
// 供 css/masters/stalin/stellar-masters.css 偏移星图顶部 UI 使用。
// 母站导航在窄屏/暗色切换下高度会变化，ResizeObserver 保证持续同步。
// 导航收起为悬浮球时（body.nav-collapsed / QMLMState.ui.navCollapsed），星图铺满全屏，--masthead-h 记 0。
(function () {
    var root = document.documentElement;

    function navCollapsed() {
        if (document.body.classList.contains('nav-collapsed')) return true;
        if (window.QMLMState && typeof window.QMLMState.getDomain === 'function') {
            var ui = window.QMLMState.getDomain('ui');
            return !!(ui && ui.navCollapsed);
        }
        return false;
    }

    function sync() {
        var header = document.querySelector('.site-header');
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
        var header = document.querySelector('.site-header');
        if (header && 'ResizeObserver' in window) {
            new ResizeObserver(sync).observe(header);
        }
        window.addEventListener('resize', sync);
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
