(function () {
  'use strict';

  var DATA_ROOT = '../../../data/masters/stalin/';
  var state = { biography: null, activeSection: 'overview' };
  function byId(id) { return document.getElementById(id); }
  function safe(value) { return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&#039;'); }
  function sectionTimeline(data, sectionId) { return (data.timeline || []).filter(function (item) { return item.section === sectionId; }); }
  function noteById(data, noteId) { return ((data.enhancements && data.enhancements.notes) || []).find(function (note) { return note.id === noteId; }); }
  function highlightById(data, highlightId) { return ((data.enhancements && data.enhancements.highlights) || []).find(function (item) { return item.id === highlightId; }); }
  function noteLabel(kind) { return ({ background: '时代背景', concept: '概念解释', controversy: '争议提示', interpretation: '诠释提示' }[kind] || '补充说明'); }

  function renderMarkedText(text, marks) {
    var source = String(text == null ? '' : text);
    var usable = (marks || []).filter(function (mark) { return mark && mark.text && source.indexOf(mark.text) >= 0; })
      .sort(function (a, b) { return source.indexOf(a.text) - source.indexOf(b.text); });
    if (!usable.length) return safe(source).replace(/\n/g, '<br>');
    var html = '';
    var cursor = 0;
    usable.forEach(function (mark) {
      var index = source.indexOf(mark.text, cursor);
      if (index < 0) return;
      html += safe(source.slice(cursor, index)).replace(/\n/g, '<br>');
      html += '<span class="inline-mark inline-mark-' + safe(mark.style || mark.type || 'strong') + '" data-inline-type="' + safe(mark.type || '') + '" title="' + safe(mark.note || '') + '">' + safe(mark.text).replace(/\n/g, '<br>') + '</span>';
      cursor = index + mark.text.length;
    });
    html += safe(source.slice(cursor)).replace(/\n/g, '<br>');
    return html;
  }

  function renderOverview(data) {
    var target = byId('overview-content');
    if (!target) return;
    var count = data.enhancements ? (data.enhancements.highlights || []).length : 0;
    var inlineCount = 0;
    (data.sections || []).forEach(function (section) { (section.paragraphs || []).forEach(function (p) { inlineCount += (p.inlineMarks || []).length; }); });
    target.innerHTML = '<p class="intro-lead">' + safe(data.readingGuide.summary) + '</p><p>' + safe(data.readingGuide.notice) + '</p>' +
      '<p class="stalin-muted">本页已加入 ' + count + ' 处重点段落、' + inlineCount + ' 处句子级重点与若干背景/争议说明，均为候选阅读增强。</p>';
  }

  function renderNavigation(data) {
    var chapterNav = byId('chapter-nav');
    if (!chapterNav) return;
    chapterNav.innerHTML = '<ol class="chapter-thread-list">' + (data.sections || []).map(function (section) {
      var times = sectionTimeline(data, section.id);
      return '<li><a href="#' + safe(section.id) + '" data-section-link="' + safe(section.id) + '" class="chapter-thread-link ' + safe(section.navTone || '') + '"><span class="chapter-thread-num">' + safe(section.number) + '</span><span class="chapter-thread-text"><strong>' + safe(section.title) + '</strong><em>' + safe(section.focus || section.summary || '') + '</em>' + (times.length ? '<small>' + times.map(function (item) { return safe(item.date); }).join(' / ') + '</small>' : '') + '</span></a></li>';
    }).join('') + '</ol>';
  }

  function renderSectionNotes(data, section) {
    var ids = section.enhancementIds || [];
    if (!ids.length) return '';
    return '<div class="chapter-note-stack">' + ids.map(function (noteId) {
      var note = noteById(data, noteId);
      if (!note) return '';
      return '<aside class="chapter-note note-' + safe(note.kind) + '"><span>' + safe(noteLabel(note.kind)) + '</span><strong>' + safe(note.title) + '</strong><p>' + safe(note.body) + '</p></aside>';
    }).join('') + '</div>';
  }

  function renderBiography(data) {
    var target = byId('biography-content');
    if (!target) return;
    target.innerHTML = (data.sections || []).map(function (section) {
      var times = sectionTimeline(data, section.id);
      return '<article class="stalin-article-section chapter" id="' + safe(section.id) + '" data-section-id="' + safe(section.id) + '"><header class="article-chapter-head"><span class="article-chapter-num">' + safe(section.number) + '</span><div><h3 class="chapter-title">' + safe(section.title) + '</h3><p>' + safe(section.summary || '') + '</p>' + (times.length ? '<div class="chapter-timechips">' + times.map(function (item) { return '<span>' + safe(item.date) + ' · ' + safe(item.label) + '</span>'; }).join('') + '</div>' : '') + '</div></header><blockquote class="chapter-focus">' + safe(section.focus || '') + '</blockquote>' + renderSectionNotes(data, section) + section.paragraphs.map(function (paragraph) {
        var highlights = (paragraph.highlightIds || []).map(function (hid) { return highlightById(data, hid); }).filter(Boolean);
        return '<p id="' + safe(paragraph.id) + '" class="stalin-article-paragraph annotation-' + safe(paragraph.annotation) + (highlights.length ? ' is-highlight' : '') + '" data-paragraph-id="' + safe(paragraph.id) + '" data-annotation="' + safe(paragraph.annotation) + '">' + renderMarkedText(paragraph.text, paragraph.inlineMarks) + (highlights.length ? '<span class="paragraph-highlight-mark">重点</span>' : '') + '</p>';
      }).join('') + '</article>';
    }).join('');
    target.addEventListener('click', function (event) { var paragraph = event.target.closest('[data-paragraph-id]'); if (paragraph) history.replaceState(null, '', '#' + paragraph.dataset.paragraphId); });
    window.__QMLMArticleRendered = true;
    window.dispatchEvent(new CustomEvent('qmlm:article-rendered'));
    if (window.location.hash) { var anchored = byId(window.location.hash.slice(1)); if (anchored) { var revealAnchor = function () { anchored.scrollIntoView({ block:'center' }); anchored.classList.add('is-highlight'); }; [80, 350, 900, 1600].forEach(function (delay) { window.setTimeout(revealAnchor, delay); }); } }
    window.setTimeout(function () {
      if (window.QMLMPreferences && typeof window.QMLMPreferences.upsertHistory === 'function' && typeof window.QMLMPreferences.getArticleMeta === 'function') {
        window.QMLMPreferences.upsertHistory(window.QMLMPreferences.getArticleMeta());
      }
    }, 450);
  }

  function setActiveSection(sectionId) {
    if (!state.biography) return;
    state.activeSection = sectionId;
    document.querySelectorAll('[data-section-link]').forEach(function (link) { link.classList.toggle('is-active', link.dataset.sectionLink === sectionId); });
  }

  function bindScrollSpy(data) {
    var sections = data.sections.map(function (s) { return byId(s.id); }).filter(Boolean);
    if (!('IntersectionObserver' in window) || sections.length === 0) return;
    var observer = new IntersectionObserver(function (entries) { entries.forEach(function (entry) { if (entry.isIntersecting) setActiveSection(entry.target.id); }); }, { rootMargin: '-20% 0px -65% 0px', threshold: 0 });
    sections.forEach(function (section) { observer.observe(section); });
  }

  function loadJson(name) { return fetch(DATA_ROOT + name).then(function (response) { if (!response.ok) throw new Error(name + ': ' + response.status); return response.json(); }); }
  loadJson('biography.json').then(function (data) { state.biography = data; renderOverview(data); renderNavigation(data); renderBiography(data); bindScrollSpy(data); if (data.sections && data.sections[0]) setActiveSection(data.sections[0].id); }).catch(function (error) { var target = byId('overview-content'); if (target) target.innerHTML = '<p>专题数据加载失败：' + safe(error.message) + '</p>'; });
})();
