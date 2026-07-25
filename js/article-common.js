/**
 * 文章页通用 JS — 所有文章共享
 * 依赖：Chart.js（CDN）、articles-detail.css
 */
(function() {

// ==================== Tab 切换 ====================
window.switchTab = function(tabId, btn) {
    document.querySelectorAll('.tab-content').forEach(function(el) { el.classList.remove('active'); });
    document.querySelectorAll('.tab-btn').forEach(function(el) { el.classList.remove('active'); });
    var target = document.getElementById(tabId);
    if (target) target.classList.add('active');
    if (btn) btn.classList.add('active');

    // 切换到"一目了然"时初始化图表
    if (tabId === 'visual') {
        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                initArticleCharts();
            });
        });
    }
};

// ==================== 章节折叠 ====================
window.toggleChapter = function(titleEl) {
    var chapter = titleEl.parentElement;
    chapter.classList.toggle('collapsed');
};

window.toggleAllChapters = function() {
    var chapters = document.querySelectorAll('.chapter');
    var btn = document.getElementById('chapterToggleBtn');
    var allExpanded = true;
    chapters.forEach(function(ch) {
        if (ch.classList.contains('collapsed')) {
            allExpanded = false;
        }
    });
    chapters.forEach(function(ch) {
        if (allExpanded) {
            ch.classList.add('collapsed');
        } else {
            ch.classList.remove('collapsed');
        }
    });
    if (btn) btn.textContent = allExpanded ? '展开全部' : '收起全部';
};

// ==================== 图表初始化 ====================
var chartsInited = false;

function initArticleCharts() {
    if (chartsInited) return;
    chartsInited = true;

    if (typeof ARTICLE_CHARTS === 'undefined' || !ARTICLE_CHARTS.length) return;

    ARTICLE_CHARTS.forEach(function(cfg) {
        var canvas = document.getElementById(cfg.id);
        if (!canvas) return;
        var ctx = canvas.getContext('2d');
        new Chart(ctx, cfg.config);
    });
}

// ==================== 下载浮动按钮 ====================
document.addEventListener('DOMContentLoaded', function() {
    var fab = document.getElementById('downloadFab');
    var menu = document.getElementById('downloadMenu');
    var linksDiv = document.getElementById('downloadLinks');
    if (!fab || !menu) return;

    // 填充下载链接
    if (linksDiv && typeof DOWNLOAD_LINKS !== 'undefined' && DOWNLOAD_LINKS.length) {
        linksDiv.innerHTML = DOWNLOAD_LINKS.map(function(l) {
            return '<a class="dl-link" href="' + l.href + '" download>' + l.label + '</a>';
        }).join('');
    }

    fab.addEventListener('click', function() {
        menu.classList.toggle('show');
    });

    document.addEventListener('click', function(e) {
        if (!fab.contains(e.target) && !menu.contains(e.target)) {
            menu.classList.remove('show');
        }
    });
});

})();
