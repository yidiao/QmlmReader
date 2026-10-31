(function () {
    'use strict';

    function escapeHtml(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
        });
    }

    function splitContentToParagraphs(content) {
        if (!content) return [];
        var lines = String(content).replace(/^\uFEFF/, '').split(/\r?\n/).map(function (line) { return line.trim(); }).filter(Boolean);
        if (!lines.length) return [];
        var paragraphs = [];
        var current = '';
        lines.forEach(function (line) {
            if (!current) {
                current = line;
                return;
            }
            if (!/[。！？；：.!?]$/.test(current)) current += line;
            else {
                paragraphs.push(current);
                current = line;
            }
        });
        if (current) paragraphs.push(current);
        return paragraphs;
    }

    function normalizeParagraphs(paragraphs) {
        if (!Array.isArray(paragraphs)) return [];
        return paragraphs.map(function (p) {
            return String(p == null ? '' : p).trim();
        }).filter(Boolean);
    }

    function normalizeOriginal(article) {
        var original = article && article.original ? article.original : null;
        if (original) {
            var paragraphs = normalizeParagraphs(original.paragraphs);
            var chapters = Array.isArray(original.chapters) ? original.chapters.map(function (chapter) {
                return {
                    title: chapter && chapter.title ? String(chapter.title).trim() : '正文',
                    paragraphs: normalizeParagraphs(chapter && chapter.paragraphs)
                };
            }).filter(function (chapter) {
                return chapter.paragraphs.length;
            }) : [];

            if (!chapters.length && paragraphs.length) {
                chapters = [{ title: '正文', paragraphs: paragraphs }];
            }

            if (chapters.length) {
                return {
                    titleLine: original.titleLine || article && article.title || '',
                    paragraphs: paragraphs.length ? paragraphs : chapters.reduce(function (acc, chapter) {
                        return acc.concat(chapter.paragraphs);
                    }, []),
                    chapters: chapters
                };
            }
        }

        var fallbackParagraphs = splitContentToParagraphs(article && article.content);
        return {
            titleLine: article && article.title || '',
            paragraphs: fallbackParagraphs,
            chapters: fallbackParagraphs.length ? [{ title: '正文', paragraphs: fallbackParagraphs }] : []
        };
    }

    function renderStatus(type, heading, detail) {
        var target = document.querySelector('#original .original-text');
        if (!target) return;
        var boxClass = type === 'error' ? 'warning-box' : 'text-intro';
        var detailHtml = detail ? '<p>' + escapeHtml(detail) + '</p>' : '';
        target.innerHTML = '<div class="' + boxClass + '"><p><strong>' + escapeHtml(heading) + '</strong></p>' + detailHtml + '</div>';
        if (window.initDynamicChapterNav) window.initDynamicChapterNav();
    }

    function renderOriginal(article) {
        var target = document.querySelector('#original .original-text');
        if (!target) return;
        var original = normalizeOriginal(article);
        var chapters = Array.isArray(original.chapters) ? original.chapters : [];
        var titleLine = original.titleLine || article.title || '';

        if (!chapters.length) {
            renderStatus('error', '原文数据为空', '请检查对应的 articles-json 正文文件。');
            return;
        }

        target.innerHTML = '<div class="text-intro"><p><strong>原文：</strong>' + escapeHtml(titleLine) + '</p></div>' +
            '<div class="u-text-right"><button class="chapter-toggle-all" onclick="toggleAllChapters()" id="chapterToggleBtn">收起全部</button></div>' +
            chapters.map(function (chapter) {
                var title = chapter.title || '正文';
                var paragraphs = Array.isArray(chapter.paragraphs) ? chapter.paragraphs : [];
                return '<div class="chapter"><h3 class="chapter-title" onclick="toggleChapter(this)"><span class="toggle-icon"></span>' + escapeHtml(title) + '</h3><div class="chapter-content">' + paragraphs.map(function (p) { return '<p>' + escapeHtml(p) + '</p>'; }).join('') + '</div></div>';
            }).join('');
    }

    function applyMeta(article) {
        var meta = article && article.meta ? article.meta : {};
        var title = article && article.title ? article.title : meta.title;
        if (title) {
            document.title = title + ' - 青年马列毛主义驿站';
            var h1 = document.querySelector('.article-header h1');
            if (h1) h1.textContent = title;
        }
        var subtitle = document.querySelector('.article-subtitle');
        if (subtitle && meta.subtitle) subtitle.textContent = meta.subtitle;
        var author = document.querySelector('.article-meta .author');
        if (author && meta.author) author.textContent = meta.author;
        var date = document.querySelector('.article-meta .date');
        if (date && meta.date) date.textContent = meta.date;
        var category = document.querySelector('.article-meta .category');
        if (category && meta.category) category.textContent = meta.category;
        var wordCount = document.querySelector('.article-meta .word-count');
        if (wordCount && meta.wordCount) wordCount.textContent = meta.wordCount;
        var lengthTag = document.querySelector('.article-meta .length-tag');
        if (lengthTag && meta.lengthTag) lengthTag.textContent = ' ' + meta.lengthTag;
    }

    function loadArticleJson() {
        var jsonPath = document.body.getAttribute('data-article-json');
        if (!jsonPath) return;
        renderStatus('loading', '原文加载中…');
        fetch(jsonPath, { cache: 'no-store' })
            .then(function (response) {
                if (!response.ok) throw new Error('文章数据加载失败：' + jsonPath + '（HTTP ' + response.status + '）');
                return response.json();
            })
            .then(function (article) {
                applyMeta(article);
                renderOriginal(article);
                if (window.refreshArticleChapters) window.refreshArticleChapters();
                if (window.initDynamicChapterNav) window.initDynamicChapterNav();
                if (window.syncDynamicChapterNavVisibility) window.syncDynamicChapterNavVisibility();
                window.__QMLMArticleRendered = true;
                window.dispatchEvent(new Event('qmlm:article-rendered'));
            })
            .catch(function (error) {
                console.error(error);
                renderStatus('error', '原文加载失败', '请稍后刷新重试；若问题持续，请检查文章 JSON 路径与结构。');
            });
    }

    document.addEventListener('DOMContentLoaded', loadArticleJson);

    window.ArticleJsonRenderer = {
        splitContentToParagraphs: splitContentToParagraphs,
        normalizeOriginal: normalizeOriginal
    };
})();
