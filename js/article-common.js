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

    if (tabId === 'visual') {
        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                initArticleCharts();
            });
        });
    }
};

// ==================== 章节折叠 ====================
var chapterAccordionBound = false;

function getChapterFromTarget(titleEl) {
    if (!titleEl) return null;
    if (titleEl.closest) return titleEl.closest('.chapter');
    return titleEl.parentElement || null;
}

function getChapterTitleLabel(titleEl) {
    if (!titleEl) return '';
    var cached = titleEl.getAttribute('data-chapter-label');
    if (cached) return cached;
    var clone = titleEl.cloneNode(true);
    var icon = clone.querySelector('.toggle-icon');
    if (icon && icon.parentNode) icon.parentNode.removeChild(icon);
    var text = (clone.textContent || '').replace(/\s+/g, ' ').trim();
    if (text) titleEl.setAttribute('data-chapter-label', text);
    return text;
}

function syncChapterToggleIcon(chapter, expanded) {
    if (!chapter) return;
    var titleEl = chapter.querySelector('.chapter-title');
    var icon = titleEl ? titleEl.querySelector('.toggle-icon') : null;
    if (!icon) return;
    icon.textContent = expanded ? '▾' : '▸';
    icon.setAttribute('aria-hidden', 'true');
}

function updateToggleAllButton() {
    var btn = document.getElementById('chapterToggleBtn');
    if (!btn) return;
    var chapters = document.querySelectorAll('.chapter');
    if (!chapters.length) return;
    var allExpanded = true;
    chapters.forEach(function(ch) {
        if (ch.classList.contains('collapsed')) allExpanded = false;
    });
    btn.textContent = allExpanded ? '收起全部' : '展开全部';
    btn.setAttribute('aria-pressed', allExpanded ? 'true' : 'false');
}

function setChapterContentState(contentEl, expanded, animate) {
    if (!contentEl) return;
    if (contentEl.__chapterHeightTimer) {
        window.clearTimeout(contentEl.__chapterHeightTimer);
        contentEl.__chapterHeightTimer = 0;
    }
    contentEl.style.overflow = 'hidden';
    if (!animate) {
        contentEl.style.maxHeight = expanded ? 'none' : '0px';
        contentEl.style.opacity = expanded ? '1' : '0';
        return;
    }

    if (expanded) {
        contentEl.style.opacity = '1';
        contentEl.style.maxHeight = contentEl.scrollHeight + 'px';
        contentEl.__chapterHeightTimer = window.setTimeout(function() {
            if (!contentEl.parentElement || !contentEl.parentElement.classList.contains('collapsed')) {
                contentEl.style.maxHeight = 'none';
            }
            contentEl.__chapterHeightTimer = 0;
        }, 360);
    } else {
        contentEl.style.maxHeight = contentEl.scrollHeight + 'px';
        contentEl.offsetHeight;
        window.requestAnimationFrame(function() {
            contentEl.style.maxHeight = '0px';
            contentEl.style.opacity = '0';
        });
    }
}

function setChapterState(chapter, expanded, animate) {
    if (!chapter) return;
    chapter.classList.toggle('collapsed', !expanded);
    var titleEl = chapter.querySelector('.chapter-title');
    var contentEl = chapter.querySelector('.chapter-content');
    if (titleEl) {
        titleEl.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        titleEl.setAttribute('data-chapter-label', getChapterTitleLabel(titleEl));
    }
    syncChapterToggleIcon(chapter, expanded);
    if (contentEl) {
        contentEl.setAttribute('aria-hidden', expanded ? 'false' : 'true');
        setChapterContentState(contentEl, expanded, animate);
    }
}

function refreshChapterSizing() {
    document.querySelectorAll('.chapter:not(.collapsed) .chapter-content').forEach(function(contentEl) {
        if (contentEl.style.maxHeight !== 'none') {
            contentEl.style.maxHeight = contentEl.scrollHeight + 'px';
        }
    });
}

function bindChapterAccordion() {
    var chapters = document.querySelectorAll('.chapter');
    chapters.forEach(function(chapter, index) {
        var titleEl = chapter.querySelector('.chapter-title');
        var contentEl = chapter.querySelector('.chapter-content');
        if (!titleEl || !contentEl) return;
        if (!chapter.id) chapter.id = 'chapter-' + (index + 1);
        if (!contentEl.id) contentEl.id = chapter.id + '-content';
        titleEl.setAttribute('role', 'button');
        titleEl.setAttribute('tabindex', '0');
        titleEl.setAttribute('aria-controls', contentEl.id);
        titleEl.setAttribute('data-chapter-label', getChapterTitleLabel(titleEl));
        titleEl.style.cursor = 'pointer';
        titleEl.style.touchAction = 'manipulation';
        titleEl.style.userSelect = 'none';
        setChapterState(chapter, !chapter.classList.contains('collapsed'), false);
    });

    updateToggleAllButton();
    if (chapterAccordionBound) return;
    chapterAccordionBound = true;

    document.addEventListener('click', function(e) {
        var chapterTitle = e.target && e.target.closest ? e.target.closest('.chapter-title') : null;
        if (chapterTitle) {
            var chapter = getChapterFromTarget(chapterTitle);
            if (!chapter) return;
            e.preventDefault();
            e.stopPropagation();
            if (e.stopImmediatePropagation) e.stopImmediatePropagation();
            toggleChapter(chapterTitle);
            return;
        }

        var toggleAll = e.target && e.target.closest ? e.target.closest('#chapterToggleBtn') : null;
        if (toggleAll) {
            e.preventDefault();
            e.stopPropagation();
            if (e.stopImmediatePropagation) e.stopImmediatePropagation();
            toggleAllChapters();
        }
    }, true);

    document.addEventListener('keydown', function(e) {
        var chapterTitle = e.target && e.target.closest ? e.target.closest('.chapter-title') : null;
        if (!chapterTitle) return;
        if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
        e.preventDefault();
        toggleChapter(chapterTitle);
    }, true);

    window.addEventListener('resize', refreshChapterSizing);
}

window.toggleChapter = function(titleEl, forceState) {
    var chapter = getChapterFromTarget(titleEl);
    if (!chapter) return;
    var shouldCollapse = typeof forceState === 'boolean' ? forceState : !chapter.classList.contains('collapsed');
    setChapterState(chapter, !shouldCollapse, true);
    updateToggleAllButton();
};

window.toggleAllChapters = function() {
    var chapters = document.querySelectorAll('.chapter');
    if (!chapters.length) return;
    var allExpanded = true;
    chapters.forEach(function(chapter) {
        if (chapter.classList.contains('collapsed')) allExpanded = false;
    });
    chapters.forEach(function(chapter) {
        setChapterState(chapter, !allExpanded, true);
    });
    updateToggleAllButton();
};

document.addEventListener('DOMContentLoaded', bindChapterAccordion);

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
function initDownloads() {
    var fab = document.getElementById('downloadFab');
    var menu = document.getElementById('downloadMenu');
    var linksDiv = document.getElementById('downloadLinks');
    if (!fab || !menu) return;

    if (linksDiv && typeof DOWNLOAD_LINKS !== 'undefined' && DOWNLOAD_LINKS.length) {
        linksDiv.innerHTML = DOWNLOAD_LINKS.map(function(l) {
            var attrs = '';
            if (l.format) attrs += ' data-download-format="' + l.format + '"';
            if (l.source) attrs += ' data-download-source="' + l.source + '"';
            var downloadAttr = l.format ? '' : ' download';
            return '<a class="dl-link" href="' + l.href + '"' + downloadAttr + attrs + '>' + l.label + '</a>';
        }).join('');
    }

    fab.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        menu.classList.toggle('show');
    });

    document.addEventListener('click', function(e) {
        if (!fab.contains(e.target) && !menu.contains(e.target)) menu.classList.remove('show');
    });
}

document.addEventListener('DOMContentLoaded', initDownloads);

})();
