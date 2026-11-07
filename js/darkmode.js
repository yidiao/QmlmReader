// 黑夜模式切换（所有页面共享）
// 类同时挂在 <html> 与 <body> 上：<html> 供首帧预渲染（head 内联脚本）与
// `.dark-mode body` 选择器使用，<body> 供 main.js / marxist-style.js 等读取。
(function() {
    function applyDarkMode(isDark) {
        document.documentElement.classList.toggle('dark-mode', !!isDark);
        if (document.body) document.body.classList.toggle('dark-mode', !!isDark);
        updateDarkModeIcon();
    }

    function syncFromState() {
        if (window.QMLMState && typeof window.QMLMState.getTheme === 'function') {
            applyDarkMode(!!window.QMLMState.getTheme().darkMode);
            return true;
        }
        return false;
    }

    if (!syncFromState()) {
        applyDarkMode(localStorage.getItem('darkMode') === 'true');
    }

    var themeStateBound = false;

    function bindThemeState() {
        if (themeStateBound || !window.QMLMState || typeof window.QMLMState.subscribe !== 'function') return;
        themeStateBound = true;
        window.QMLMState.subscribe('theme.darkMode', function (darkMode) {
            applyDarkMode(!!darkMode);
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        syncFromState();
        bindThemeState();
        updateDarkModeIcon();
    });

    window.addEventListener('qmlm:state-ready', function() {
        syncFromState();
        bindThemeState();
    });
})();

function toggleDarkMode() {
    var next = !(document.body && document.body.classList.contains('dark-mode'));
    if (window.QMLMState && typeof window.QMLMState.dispatch === 'function') {
        window.QMLMState.dispatch('theme/toggle', null, 'darkmode-toggle');
    } else {
        var next = !(document.documentElement.classList.contains('dark-mode'));
        document.documentElement.classList.toggle('dark-mode', next);
        document.body.classList.toggle('dark-mode', next);
        localStorage.setItem('darkMode', next ? 'true' : 'false');
        updateDarkModeIcon();
    }
}

function updateDarkModeIcon() {
    var btn = document.querySelector('.dark-mode-toggle');
    if (btn) {
        btn.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
    }
}
