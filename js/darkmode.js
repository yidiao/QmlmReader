// 黑夜模式切换（所有页面共享）
(function() {
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }
    document.addEventListener('DOMContentLoaded', function() {
        updateDarkModeIcon();
    });
})();

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    var isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark ? 'true' : 'false');
    updateDarkModeIcon();
}

function updateDarkModeIcon() {
    var btn = document.querySelector('.dark-mode-toggle');
    if (btn) {
        btn.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
    }
}
