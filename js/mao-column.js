(() => {
  const state = {
    mode: (location.hash || '').toLowerCase().includes('quotes') ? 'quotes' : 'poetry',
    poetryData: [],
    quoteChapters: [],
    query: '',
    activePoetryId: null,
    activeChapterId: null,
    poetry: { genre: '全部', stars: '全部', period: '全部', sort: 'time' },
    quotes: { chapter: '全部', stars: '全部', sort: 'chapter' },
    collapsed: { 'self-note': false, note: false, annotation: false }
  };

  const els = {
    body: document.body,
    modePoetry: document.querySelector('[data-mode-button="poetry"]'),
    modeQuotes: document.querySelector('[data-mode-button="quotes"]'),
    heroKicker: document.querySelector('#hero-kicker'),
    heroTitle: document.querySelector('#hero-title'),
    heroCopy: document.querySelector('#hero-copy'),
    stats: document.querySelector('#hero-stats'),
    search: document.querySelector('#search'),
    filterA: document.querySelector('#filter-a'),
    filterB: document.querySelector('#filter-b'),
    filterC: document.querySelector('#filter-c'),
    filterD: document.querySelector('#filter-d'),
    railTitle: document.querySelector('#rail-title'),
    list: document.querySelector('#list'),
    overviewPanel: document.querySelector('#overview-panel'),
    overviewList: document.querySelector('#overview-list'),
    overviewCount: document.querySelector('#overview-count'),
    poetryReader: document.querySelector('#poetry-reader'),
    quoteReader: document.querySelector('#quote-reader'),
    title: document.querySelector('#title'),
    meta: document.querySelector('#meta'),
    original: document.querySelector('#original'),
    translation: document.querySelector('#translation'),
    note: document.querySelector('#note'),
    annotation: document.querySelector('#annotation'),
    selfNote: document.querySelector('#self-note'),
    download: document.querySelector('#download'),
    quoteTitle: document.querySelector('#quote-title'),
    quoteMeta: document.querySelector('#quote-meta'),
    quoteChapterNote: document.querySelector('#quote-chapter-note'),
    quoteGrid: document.querySelector('#quote-grid')
  };

  function normalize(text) {
    return String(text || '').toLowerCase().replace(/\s+/g, '');
  }

  function escapeHtml(text) {
    return String(text || '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  }

  function highlight(text) {
    const raw = String(text || '');
    const q = state.query.trim();
    if (!q) return escapeHtml(raw);
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!escaped) return escapeHtml(raw);
    return escapeHtml(raw).replace(new RegExp(escaped, 'gi'), match => `<mark>${match}</mark>`);
  }

  function compareDate(a, b) {
    const av = a.dateSort || '9999-99-99';
    const bv = b.dateSort || '9999-99-99';
    return av.localeCompare(bv, 'zh-CN') || String(a.title).localeCompare(String(b.title), 'zh-CN');
  }

  function periodOf(item) {
    if (item.type === '概论') return '概论导读';
    const year = Number(String(item.dateSort || '').slice(0, 4));
    if (!year) return '时期待考';
    if (year <= 1924) return '少年与求学';
    if (year <= 1929) return '大革命前后';
    if (year <= 1936) return '土地革命与长征';
    if (year <= 1949) return '抗战与解放';
    if (year <= 1965) return '建国后高潮';
    return '晚年书写';
  }

  function genreOf(item) {
    if (item.type !== '诗词') return '概论';
    if (item.genre) return item.genre;
    const raw = String(item.docx || item.title || '');
    if (raw.includes('杂言诗')) return '杂言诗';
    if (raw.includes('韵语')) return '韵语';
    if (raw.includes('排律')) return '律诗';
    if (raw.includes('五律') || raw.includes('七律')) return '律诗';
    if (raw.includes('五绝') || raw.includes('七绝')) return '绝句';
    if (raw.includes('古') || raw.includes('赋')) return '古体诗';
    if (raw.includes('词')) return '词';
    return '其他';
  }

  function searchablePoetry(item) {
    return normalize([item.title, item.date, periodOf(item), genreOf(item), item.original, item.translation, item.note, item.annotation, item.selfNote].join(' '));
  }

  function searchableChapter(chapter) {
    return normalize([chapter.title, chapter.starsText, chapter.excerpt, chapter.quotes.map(q => `${q.text} ${q.source}`).join(' ')].join(' '));
  }

  function setOptions(select, options, value) {
    select.innerHTML = options.map(opt => `<option value="${escapeHtml(opt.value)}">${escapeHtml(opt.label)}</option>`).join('');
    select.value = value;
  }

  function setStats(stats) {
    els.stats.innerHTML = stats.map(stat => `<div class="stat"><strong>${escapeHtml(stat.value)}</strong><span>${escapeHtml(stat.label)}</span></div>`).join('');
  }

  function setupModeShell() {
    const quoteCount = state.quoteChapters.reduce((sum, ch) => sum + Number(ch.quoteCount || 0), 0);
    const fivePoems = state.poetryData.filter(item => item.type === '诗词' && item.stars === 5).length;
    const fiveChapters = state.quoteChapters.filter(ch => ch.stars === 5).length;

    els.modePoetry.classList.toggle('active', state.mode === 'poetry');
    els.modeQuotes.classList.toggle('active', state.mode === 'quotes');
    els.poetryReader.classList.toggle('active', state.mode === 'poetry');
    els.quoteReader.classList.toggle('active', state.mode === 'quotes');
    els.overviewPanel.style.display = state.mode === 'poetry' ? '' : 'none';

    if (state.mode === 'poetry') {
      document.title = '毛泽东诗词全编笺译 · 红色诗文专栏';
      els.heroKicker.textContent = '诗词 · 笺译 · 文献导读';
      els.heroTitle.textContent = '毛泽东诗词全编笺译';
      els.heroCopy.textContent = '以创作时间为经，以原文、题解、笺注、译文为纬，整理为可检索、可阅读、可迁移的纪念专栏。';
      els.search.placeholder = '搜索题名、日期、正文、题解、笺注、体裁';
      setStats([
        { value: state.poetryData.length, label: '篇内容' },
        { value: state.poetryData.filter(item => item.type === '诗词').length, label: '诗词' },
        { value: state.poetryData.filter(item => item.type === '概论').length, label: '概论' },
        { value: fivePoems, label: '五星精选' }
      ]);
      setOptions(els.filterA, [
        { value: '全部', label: '全部体裁' }, { value: '词', label: '词' }, { value: '律诗', label: '律诗' },
        { value: '绝句', label: '绝句' }, { value: '古体诗', label: '古体诗' }, { value: '杂言诗', label: '杂言诗' }, { value: '韵语', label: '韵语' }
      ], state.poetry.genre);
      setOptions(els.filterB, [
        { value: '全部', label: '全部星级' }, { value: '5', label: '五星' }, { value: '4', label: '四星' }, { value: '3', label: '三星' }, { value: '2', label: '二星' }
      ], state.poetry.stars);
      setOptions(els.filterC, [
        { value: '全部', label: '全部时期' }, { value: '少年与求学', label: '少年与求学' }, { value: '大革命前后', label: '大革命前后' },
        { value: '土地革命与长征', label: '土地革命与长征' }, { value: '抗战与解放', label: '抗战与解放' }, { value: '建国后高潮', label: '建国后高潮' },
        { value: '晚年书写', label: '晚年书写' }, { value: '时期待考', label: '时期待考' }
      ], state.poetry.period);
      setOptions(els.filterD, [{ value: 'time', label: '时间线' }, { value: 'stars', label: '精选优先' }], state.poetry.sort);
    } else {
      document.title = '毛主席语录分章选读 · 红色诗文专栏';
      els.heroKicker.textContent = '语录 · 分章 · 原文出处';
      els.heroTitle.textContent = '毛主席语录分章选读';
      els.heroCopy.textContent = '从原始 docx 分章提取语录正文与出处，保留 33 个主题章节，支持全文检索、星级筛选与章节切换。';
      els.search.placeholder = '搜索章节、语录正文、出处';
      setStats([
        { value: state.quoteChapters.length, label: '主题章节' },
        { value: quoteCount, label: '条语录' },
        { value: fiveChapters, label: '五星章' },
        { value: '原址', label: 'docx 留存' }
      ]);
      setOptions(els.filterA, [{ value: '全部', label: '全部章节' }].concat(state.quoteChapters.map(ch => ({ value: ch.id, label: ch.title }))), state.quotes.chapter);
      setOptions(els.filterB, [
        { value: '全部', label: '全部星级' }, { value: '5', label: '五星' }, { value: '4', label: '四星' }, { value: '3', label: '三星' }, { value: '2', label: '二星' }, { value: '1', label: '一星' }
      ], state.quotes.stars);
      setOptions(els.filterC, [{ value: 'chapter', label: '章节顺序' }, { value: 'stars', label: '精选优先' }, { value: 'count', label: '语录数量' }], state.quotes.sort);
      setOptions(els.filterD, [{ value: '全部', label: '语录分章' }], '全部');
    }
  }

  function getPoems() {
    const q = normalize(state.query);
    let items = state.poetryData.filter(item => {
      if (item.type !== '诗词') return false;
      if (state.poetry.stars !== '全部' && item.stars !== Number(state.poetry.stars)) return false;
      if (state.poetry.period !== '全部' && periodOf(item) !== state.poetry.period) return false;
      if (state.poetry.genre !== '全部' && genreOf(item) !== state.poetry.genre) return false;
      return !q || searchablePoetry(item).includes(q);
    });
    if (state.poetry.sort === 'stars') items = items.sort((a, b) => b.stars - a.stars || compareDate(a, b));
    else items = items.sort(compareDate);
    return items;
  }

  function getOverviews() {
    const q = normalize(state.query);
    return state.poetryData.filter(item => item.type === '概论' && (!q || searchablePoetry(item).includes(q)));
  }

  function getChapters() {
    const q = normalize(state.query);
    let chapters = state.quoteChapters.filter(ch => {
      if (state.quotes.chapter !== '全部' && ch.id !== state.quotes.chapter) return false;
      if (state.quotes.stars !== '全部' && ch.stars !== Number(state.quotes.stars)) return false;
      return !q || searchableChapter(ch).includes(q);
    });
    if (state.quotes.sort === 'stars') chapters = chapters.sort((a, b) => b.stars - a.stars || a.order - b.order);
    else if (state.quotes.sort === 'count') chapters = chapters.sort((a, b) => b.quoteCount - a.quoteCount || a.order - b.order);
    else chapters = chapters.sort((a, b) => a.order - b.order);
    return chapters;
  }

  function renderList(items) {
    els.list.innerHTML = '';
    const frag = document.createDocumentFragment();
    items.forEach(item => {
      const btn = document.createElement('button');
      btn.className = 'item-btn' + ((state.mode === 'poetry' ? item.id === state.activePoetryId : item.id === state.activeChapterId) ? ' active' : '');
      btn.type = 'button';
      btn.dataset.id = item.id;
      if (state.mode === 'poetry') {
        btn.innerHTML = `<span class="item-title">${highlight(item.title)}</span><span class="item-meta"><span>${highlight(item.date)}</span><span>${periodOf(item)}</span><span class="stars">${item.starsText}</span></span>`;
        btn.addEventListener('click', () => selectPoetry(item.id));
      } else {
        btn.innerHTML = `<span class="item-title">${highlight(item.title)}</span><span class="item-meta"><span>${item.quoteCount} 条</span><span class="stars">${item.starsText}</span></span>`;
        btn.addEventListener('click', () => selectChapter(item.id));
      }
      frag.appendChild(btn);
    });
    els.list.appendChild(frag);
  }

  function renderOverviews(items) {
    els.overviewList.innerHTML = '';
    els.overviewCount.textContent = `${items.length} 篇`;
    const frag = document.createDocumentFragment();
    items.forEach(item => {
      const btn = document.createElement('button');
      btn.className = 'overview-btn';
      btn.type = 'button';
      btn.innerHTML = `<strong>${highlight(item.title)}</strong><span>${item.starsText}</span>`;
      btn.addEventListener('click', () => selectPoetry(item.id));
      frag.appendChild(btn);
    });
    els.overviewList.appendChild(frag);
  }

  function setSection(id, content) {
    const node = document.querySelector(`#${id}-section`);
    const target = document.querySelector(`#${id}`);
    if (!content || !String(content).trim()) {
      if (node) node.style.display = 'none';
      return;
    }
    if (node) node.style.display = '';
    target.innerHTML = highlight(content);
    applyCollapsed(id);
  }

  function applyCollapsed(id) {
    const node = document.querySelector(`#${id}-section`);
    if (!node || !(id in state.collapsed)) return;
    node.classList.toggle('collapsed', state.collapsed[id]);
    const icon = node.querySelector('.toggle-icon');
    if (icon) icon.textContent = state.collapsed[id] ? '+' : '-';
  }

  function docxHref(item) {
    if (location.pathname.replace(/\\/g, '/').includes('/html/gallery/')) return '';
    const folder = item.docxType === '概论' ? '../概论/' : '../诗词/';
    return folder + encodeURIComponent(item.docx).replace(/%2F/g, '/');
  }

  function selectPoetry(id) {
    const item = state.poetryData.find(entry => entry.id === id) || getPoems()[0] || getOverviews()[0];
    if (!item) return;
    state.activePoetryId = item.id;
    els.title.innerHTML = highlight(item.title);
    const typeLabel = item.type === '诗词' ? periodOf(item) : '概论导读';
    const genreLabel = item.type === '诗词' ? genreOf(item) : '';
    els.meta.innerHTML = `<span class="pill">${escapeHtml(item.type)}</span><span class="pill">${highlight(item.date || '')}</span><span class="pill">${escapeHtml(typeLabel)}</span>${genreLabel ? `<span class="pill">${escapeHtml(genreLabel)}</span>` : ''}<span class="pill stars">${item.starsText || ''}</span>`;
    const href = docxHref(item);
    els.download.style.display = href ? 'inline-flex' : 'none';
    if (href) els.download.href = href;
    setSection('original', item.original || item.lead || item.note || item.excerpt);
    setSection('translation', item.translation);
    setSection('self-note', item.selfNote);
    setSection('note', item.type === '概论' ? '' : (item.note || item.excerpt));
    setSection('annotation', item.annotation);
    renderList(getPoems());
  }

  function selectChapter(id) {
    const chapter = state.quoteChapters.find(entry => entry.id === id) || getChapters()[0];
    if (!chapter) return;
    state.activeChapterId = chapter.id;
    els.quoteTitle.innerHTML = highlight(chapter.title);
    els.quoteMeta.innerHTML = `<span class="pill">第 ${chapter.order} 章</span><span class="pill">${chapter.quoteCount} 条语录</span><span class="pill stars">${chapter.starsText}</span><span class="pill">原始资料留存原路径</span>`;
    els.quoteChapterNote.textContent = `来源 docx：${chapter.docx}`;
    els.quoteGrid.innerHTML = '';
    const q = normalize(state.query);
    const frag = document.createDocumentFragment();
    chapter.quotes.forEach(quote => {
      if (q && !normalize(`${quote.text} ${quote.source}`).includes(q)) return;
      const card = document.createElement('article');
      card.className = 'quote-card';
      card.innerHTML = `<blockquote><p>${highlight(quote.text)}</p><cite>${highlight(quote.source || '出处暂缺')}</cite></blockquote>`;
      frag.appendChild(card);
    });
    if (!frag.childNodes.length) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = '当前章节没有匹配语录。';
      frag.appendChild(empty);
    }
    els.quoteGrid.appendChild(frag);
    renderList(getChapters());
  }

  function renderPoetry() {
    const poems = getPoems();
    const overviews = getOverviews();
    els.railTitle.textContent = `${poems.length} 首诗词`;
    if (!state.poetryData.some(item => item.id === state.activePoetryId) || (state.activePoetryId && ![...poems, ...overviews].some(item => item.id === state.activePoetryId))) {
      state.activePoetryId = poems[0] ? poems[0].id : (overviews[0] && overviews[0].id);
    }
    renderList(poems);
    renderOverviews(overviews);
    if (state.activePoetryId) selectPoetry(state.activePoetryId);
    else {
      els.title.textContent = '没有匹配结果';
      els.meta.innerHTML = '';
      els.original.textContent = '';
    }
  }

  function renderQuotes() {
    const chapters = getChapters();
    const quoteCount = chapters.reduce((sum, ch) => sum + Number(ch.quoteCount || 0), 0);
    els.railTitle.textContent = `${chapters.length} 章 · ${quoteCount} 条`;
    if (!chapters.some(ch => ch.id === state.activeChapterId)) state.activeChapterId = chapters[0] && chapters[0].id;
    renderList(chapters);
    if (state.activeChapterId) selectChapter(state.activeChapterId);
    else {
      els.quoteTitle.textContent = '没有匹配结果';
      els.quoteMeta.innerHTML = '';
      els.quoteGrid.innerHTML = '<p class="empty">没有匹配章节。</p>';
    }
  }

  function render() {
    setupModeShell();
    if (state.mode === 'poetry') renderPoetry();
    else renderQuotes();
  }

  function setMode(mode) {
    state.mode = mode;
    history.replaceState(null, '', mode === 'quotes' ? '#quotes' : '#poetry');
    render();
  }

  els.modePoetry.addEventListener('click', () => setMode('poetry'));
  els.modeQuotes.addEventListener('click', () => setMode('quotes'));
  els.search.addEventListener('input', event => { state.query = event.target.value; render(); });
  els.filterA.addEventListener('change', event => {
    if (state.mode === 'poetry') state.poetry.genre = event.target.value;
    else state.quotes.chapter = event.target.value;
    render();
  });
  els.filterB.addEventListener('change', event => {
    if (state.mode === 'poetry') state.poetry.stars = event.target.value;
    else state.quotes.stars = event.target.value;
    render();
  });
  els.filterC.addEventListener('change', event => {
    if (state.mode === 'poetry') state.poetry.period = event.target.value;
    else state.quotes.sort = event.target.value;
    render();
  });
  els.filterD.addEventListener('change', event => {
    if (state.mode === 'poetry') state.poetry.sort = event.target.value;
    render();
  });
  document.querySelectorAll('.section-toggle').forEach(button => {
    button.addEventListener('click', () => {
      const id = button.dataset.toggle;
      state.collapsed[id] = !state.collapsed[id];
      applyCollapsed(id);
    });
  });

  Promise.all([
    fetch('../../data/mao-poetry-data.json').then(response => response.json()),
    fetch('../../data/mao-quotes.json').then(response => response.json())
  ]).then(([poetry, quotes]) => {
    state.poetryData = poetry.items || [];
    state.quoteChapters = quotes.chapters || [];
    const first = state.poetryData.find(item => item.title === '沁园春·长沙') || state.poetryData.find(item => item.type === '诗词');
    state.activePoetryId = first && first.id;
    state.activeChapterId = state.quoteChapters[0] && state.quoteChapters[0].id;
    render();
  }).catch(error => {
    els.heroTitle.textContent = '数据载入失败';
    els.heroCopy.textContent = error.message;
  });
})();
