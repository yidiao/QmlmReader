// 母站接入层：实测 .site-header 高度写入 --masthead-h，
// 供 css/mentor/stalin/stellar-masters.css 偏移星图顶部 UI 使用。
// 母站导航在窄屏/暗色切换下高度会变化，ResizeObserver 保证持续同步。
(function () {
    var root = document.documentElement;

    function sync() {
        var header = document.querySelector('.site-header');
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
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
