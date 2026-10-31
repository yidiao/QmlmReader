(() => {
  const MAX_INITIAL_CARDS = 66;
  const DATA_URL = '../../data/mao-quotes.json';
  const grid = document.getElementById('quotesGrid');
  if (!grid) return;

  function escapeHtml(text) {
    return String(text || '').replace(/[&<>"]/g, ch => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;'
    }[ch]));
  }

  function shortText(text, limit) {
    const raw = String(text || '').trim();
    return raw.length > limit ? raw.slice(0, limit - 1) + '…' : raw;
  }

  function chapterTag(chapter) {
    return String(chapter.title || '').replace(/^[一二三四五六七八九十百〇零、]+、?/, '') || '毛主席语录';
  }

  function buildBackground(chapter, quote) {
    return `本条出自《毛主席语录》${chapter.title}。原始资料按章节保留为 docx：${chapter.docx}。本页从分章文档提取正文与出处，并按原章节归入“毛主席语录”分类，便于和站内既有经典语录一起检索、浏览。`;
  }

  function buildMeaning(chapter, quote) {
    return `所属主题：${chapter.title}。可结合本章其他 ${chapter.quoteCount} 条语录一起阅读，重点关注其论述对象、历史语境与出处文本，避免脱离章节主题作孤立理解。`;
  }

  function buildWarning(quote) {
    return quote.source ? '本条保留原文出处；阅读时请结合出处、年代与全文语境。' : '本条出处信息缺失，建议回到原 docx 资料核对。';
  }

  function ensureQuotesData() {
    if (!window.quotesData) window.quotesData = {};
    return window.quotesData;
  }

  function addCategorySummary(payload) {
    const categoryBtn = document.querySelector('.category-btn[data-filter="mao-book"]');
    if (!categoryBtn) return;
    categoryBtn.textContent = `毛主席语录（${payload.counts.chapters}章）`;
  }

  function makeCard(chapter, quote, index) {
    const id = `mao-book-${quote.id}`;
    const tag = chapterTag(chapter);
    const card = document.createElement('div');
    card.className = 'quote-detail-card mao';
    card.dataset.category = 'mao-book';
    card.dataset.chapter = chapter.id;
    card.onclick = () => window.openQuote && window.openQuote(id);
    card.innerHTML = `
      <span class="quote-click-hint">点击查看简介 </span>
      <blockquote>
        <p>"${escapeHtml(shortText(quote.text, 96))}"</p>
        <cite>${escapeHtml(shortText(quote.source, 68))}</cite>
      </blockquote>
      <span class="quote-tag">${escapeHtml(tag)}</span>
    `;
    return card;
  }

  function addMoreCard(hiddenCards, payload) {
    if (!hiddenCards.length) return;
    const more = document.createElement('div');
    more.className = 'quote-detail-card mao';
    more.dataset.category = 'mao-book';
    more.innerHTML = `
      <span class="quote-click-hint">点击展开 </span>
      <blockquote>
        <p>"继续展开《毛主席语录》全部条目"</p>
        <cite>已载入 ${payload.counts.chapters} 章 ${payload.counts.quotes} 条</cite>
      </blockquote>
      <span class="quote-tag">展开全部</span>
    `;
    more.onclick = () => {
      const frag = document.createDocumentFragment();
      hiddenCards.forEach(card => frag.appendChild(card));
      more.replaceWith(frag);
      const active = document.querySelector('.category-btn.active');
      if (active && active.dataset.filter !== 'all' && active.dataset.filter !== 'mao-book') {
        document.querySelectorAll('.quote-detail-card[data-category="mao-book"]').forEach(card => { card.style.display = 'none'; });
      }
    };
    grid.appendChild(more);
  }

  function registerModalData(payload) {
    const data = ensureQuotesData();
    payload.chapters.forEach(chapter => {
      chapter.quotes.forEach(quote => {
        const id = `mao-book-${quote.id}`;
        data[id] = {
          text: `"${quote.text}"`,
          source: quote.source || '出处暂缺',
          background: buildBackground(chapter, quote),
          meaning: buildMeaning(chapter, quote),
          warning: buildWarning(quote)
        };
      });
    });
  }

  function applyCurrentFilter() {
    const active = document.querySelector('.category-btn.active');
    const filter = active ? active.dataset.filter : 'all';
    document.querySelectorAll('.quote-detail-card').forEach(card => {
      card.style.display = (filter === 'all' || card.dataset.category === filter) ? 'block' : 'none';
    });
  }

  function renderCards(payload) {
    const visible = [];
    const hidden = [];
    let index = 0;
    payload.chapters.forEach(chapter => {
      chapter.quotes.forEach(quote => {
        const card = makeCard(chapter, quote, index);
        if (index < MAX_INITIAL_CARDS) visible.push(card);
        else hidden.push(card);
        index += 1;
      });
    });
    const frag = document.createDocumentFragment();
    visible.forEach(card => frag.appendChild(card));
    grid.appendChild(frag);
    addMoreCard(hidden, payload);
    applyCurrentFilter();
  }

  function reopenIfRequested() {
    const targetId = sessionStorage.getItem('openQuote');
    if (targetId && targetId.startsWith('mao-book-')) {
      sessionStorage.removeItem('openQuote');
      setTimeout(() => window.openQuote && window.openQuote(targetId), 300);
    }
  }

  fetch(DATA_URL)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(payload => {
      registerModalData(payload);
      renderCards(payload);
      addCategorySummary(payload);
      reopenIfRequested();
    })
    .catch(error => {
      const warn = document.createElement('div');
      warn.className = 'quote-detail-card mao';
      warn.dataset.category = 'mao-book';
      warn.innerHTML = `<blockquote><p>"毛主席语录数据载入失败"</p><cite>${escapeHtml(error.message)}</cite></blockquote><span class="quote-tag">数据错误</span>`;
      grid.appendChild(warn);
    });
})();
