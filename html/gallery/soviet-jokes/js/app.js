(() => {
  'use strict';

  /* ============================ 基础 ============================ */

  // 页面相对路径（不以 ../ 开头，避免被 GitHub Pages 部署脚本剥层改写）
  const DATA_URL = new URL('data/app-data.json', location.href);
  const CLASSIC_URL = new URL('data/classic.json', location.href);
  const CURATION_URL = new URL('data/curation.json', location.href);
  const DIMS = ['theme', 'attribution', 'era', 'reliability'];
  const DIM_LABELS = { theme: '主题', attribution: '制度归因', era: '时代', reliability: '可靠性' };
  const DOMAIN_COLORS = ['#a4262c', '#b4691f', '#2c5f8a', '#4d6b3f', '#7a4b8c', '#8a5a2b', '#356b6b', '#6b5a2a', '#3f5b8a', '#8a3f5a', '#5a6b3f', '#7a5a8a'];
  const CHUNK = 24;
  const INITIAL_CHUNKS = 2;
  const DRAW_STORE = 'sj-archive-drawn';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const debounce = (fn, ms = 150) => {
    let timer = 0;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
  };

  const state = {
    jokes: [],
    terms: [],
    diagnoses: [],
    taxonomy: null,
    termByNum: new Map(),
    diagById: new Map(),
    classic: new Map(),
    onlyClassic: false,
    reliabilityNotes: new Map(),
    reliabilityGroups: { stance: [], evidence: [] },
    q: '',
    tags: { theme: new Set(), attribution: new Set(), era: new Set(), reliability: new Set() },
    term: null,
    sort: 'asc',
    filtered: [],
    rendered: 0,
    archiveColumns: [],
    deckColumns: null,
    loading: false,
    activeKey: null,
    deepLinkKey: null,
    pendingDeck: null,
    pendingPanel: null,
    panel: null,
    drawn: new Set(),
    drawBatch: [],
    deck: null,
  };

  const els = {};
  const overlayStack = [];
  let toastTimer = 0;
  let popoverAnchor = null;
  let observer = null;

  /* ============================ 工具 ============================ */

  function label(dim, key) {
    const vocab = state.taxonomy?.dimensions?.[dim]?.vocab || {};
    return vocab[key]?.label || String(key || '');
  }

  function prettyKey(key) {
    return String(key || '').replace(/[-_]/g, ' ').replace(/\b[a-z]/g, ch => ch.toUpperCase());
  }

  function hl(text, q) {
    const safe = esc(text);
    if (!q) return safe;
    const needle = esc(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    try {
      return safe.replace(new RegExp(`(${needle})`, 'gi'), '<mark>$1</mark>');
    } catch (error) {
      return safe;
    }
  }

  function toast(message) {
    const el = els.toast;
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2300);
  }

  function domainColorById(id) {
    const index = state.diagnoses.findIndex(diag => diag.id === id);
    if (index < 0) return DOMAIN_COLORS[0];
    return DOMAIN_COLORS[index % DOMAIN_COLORS.length];
  }

  function domainColor(joke) {
    return domainColorById(joke.domain);
  }

  function shuffle(items) {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function domainsOf(joke) {
    return (joke.domains || [joke.domain]).map(id => state.diagById.get(id)).filter(Boolean);
  }

  function termsOf(joke) {
    return state.termByNum.get(joke.num) || [];
  }

  /* ============================ 主题 ============================ */

  function setTheme(theme, persist = true) {
    document.documentElement.dataset.theme = theme;
    const dark = theme === 'dark';
    const btn = $('[data-theme-toggle]');
    if (btn) btn.setAttribute('aria-pressed', String(dark));
    if (persist) localStorage.setItem('sj-archive-theme', theme);
  }

  function initTheme() {
    const saved = localStorage.getItem('sj-archive-theme');
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    setTheme(saved || (prefersDark ? 'dark' : 'light'), false);
  }

  /* ============================ 数据 ============================ */

  async function loadData() {
    const [response, classicResponse, curationResponse] = await Promise.all([
      fetch(DATA_URL),
      fetch(CLASSIC_URL),
      fetch(CURATION_URL),
    ]);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const classic = classicResponse.ok ? await classicResponse.json() : { items: [] };
    const curation = curationResponse.ok ? await curationResponse.json() : { overrides: [] };

    state.jokes = Array.isArray(data.jokes) ? data.jokes.slice() : [];
    state.terms = data.glossary?.terms || data.terms || [];
    state.diagnoses = Array.isArray(data.diagnoses) ? data.diagnoses : [];
    state.taxonomy = data.taxonomy || null;

    state.diagById = new Map(state.diagnoses.map(diag => [diag.id, diag]));
    state.classic = new Map();
    state.reliabilityNotes = new Map();
    if (curation.reliabilityGroups) state.reliabilityGroups = curation.reliabilityGroups;

    const jokesByKey = new Map(state.jokes.map(joke => [joke.recordKey || joke.id, joke]));

    (curation.overrides || []).forEach(override => {
      const joke = jokesByKey.get(override.recordKey);
      if (!joke) return;
      if (!joke.tags) joke.tags = {};
      const tags = new Set(joke.tags.reliability || []);
      (override.remove || []).forEach(key => tags.delete(key));
      (override.add || []).forEach(key => tags.add(key));
      joke.tags.reliability = [...tags];
      if (override.note) state.reliabilityNotes.set(override.recordKey, override.note);
    });

    (classic.items || []).forEach(item => {
      const joke = jokesByKey.get(item.recordKey);
      if (!joke) return;
      state.classic.set(item.recordKey, item);
      joke.__classic = item;
    });

    const termByNum = new Map();
    state.terms.forEach(term => {
      (term.related_joke_nums || []).forEach(num => {
        if (!termByNum.has(num)) termByNum.set(num, []);
        termByNum.get(num).push(term);
      });
    });
    state.termByNum = termByNum;

    state.jokes.forEach(joke => {
      const classic = joke.__classic;
      const haystack = [
        joke.num, joke.id, joke.label, joke.form, joke.text, joke.lemma, joke.history, joke.genre,
        joke.domain, ...(joke.domains || []),
        ...Object.keys(joke.leader_mentions || {}),
        ...Object.values(joke.leader_mentions || {}),
        classic?.title, classic?.technique, classic?.why, classic?.craft, classic?.target, classic?.workshop,
        classic?.core, classic?.remix, classic?.drill,
        state.reliabilityNotes.get(joke.recordKey || joke.id),
      ];
      DIMS.forEach(dim => {
        (joke.tags?.[dim] || []).forEach(key => haystack.push(label(dim, key), key));
      });
      domainsOf(joke).forEach(diag => haystack.push(diag.label));
      termsOf(joke).forEach(term => haystack.push(term.term));
      joke.__hay = haystack.filter(Boolean).join(' ').toLocaleLowerCase();
    });

    $$('[data-stat="jokes"]').forEach(el => { el.textContent = state.jokes.length; });
    $$('[data-stat="diagnoses"]').forEach(el => { el.textContent = state.diagnoses.length; });
    $$('[data-stat="terms"]').forEach(el => { el.textContent = state.terms.length; });
    $$('[data-stat="classic"], [data-classic-count], [data-classic-total]').forEach(el => { el.textContent = state.classic.size; });
  }

  /* ============================ 筛选 ============================ */

  function buildFilters() {
    const container = els.filterRows;
    if (!container) return;

    const counts = {};
    DIMS.forEach(dim => {
      counts[dim] = {};
      state.jokes.forEach(joke => {
        (joke.tags?.[dim] || []).forEach(key => { counts[dim][key] = (counts[dim][key] || 0) + 1; });
      });
    });

    const chipHtml = (dim, key) => `<button type="button" class="chip" data-dim="${dim}" data-key="${esc(key)}" aria-pressed="false">${esc(label(dim, key))}<span class="chip-count">${counts[dim][key] || 0}</span></button>`;

    container.innerHTML = DIMS.map(dim => {
      const vocabKeys = Object.keys(state.taxonomy?.dimensions?.[dim]?.vocab || {});
      const extra = Object.keys(counts[dim]).filter(key => !vocabKeys.includes(key));
      const keys = [...vocabKeys, ...extra];

      if (dim === 'reliability') {
        const stance = state.reliabilityGroups.stance || [];
        const evidence = state.reliabilityGroups.evidence || [];
        const grouped = new Set([...stance, ...evidence]);
        const leftover = keys.filter(key => !grouped.has(key));
        const group = (title, list) => list.length
          ? `<div class="chip-group"><span class="chip-group-label">${title}</span>${list.map(key => chipHtml(dim, key)).join('')}</div>`
          : '';
        return `<div class="filter-row" data-dim="reliability">
          <span class="filter-label">${esc(DIM_LABELS[dim])}</span>
          <div class="filter-chips reliability-groups">
            ${group('立场', [...stance, ...leftover])}
            ${group('证据', evidence)}
            <p class="filter-hint">立场＝谁在说话；证据＝有没有史实锚点，二者可同时标注。疑似西方投放因来源不可考而保持少量，不臆测补标。</p>
          </div>
        </div>`;
      }

      return `<div class="filter-row" data-dim="${dim}">
        <span class="filter-label">${esc(DIM_LABELS[dim])}</span>
        <div class="filter-chips">${keys.map(key => chipHtml(dim, key)).join('')}</div>
      </div>`;
    }).join('');
  }

  function syncChips() {
    $$('.chip[data-dim]').forEach(chip => {
      chip.setAttribute('aria-pressed', String(state.tags[chip.dataset.dim].has(chip.dataset.key)));
    });
    const count = DIMS.reduce((sum, dim) => sum + state.tags[dim].size, 0);
    const badge = $('[data-filter-count]');
    if (badge) {
      badge.textContent = count;
      badge.hidden = count === 0;
    }
    const classicBtn = $('[data-action="toggle-classic"]');
    if (classicBtn) classicBtn.setAttribute('aria-pressed', String(state.onlyClassic));
    const reset = $('[data-action="reset"]');
    if (reset) reset.hidden = !(count || state.q || state.term || state.onlyClassic);
  }

  function toggleClassic() {
    state.onlyClassic = !state.onlyClassic;
    applyFilters();
    toast(state.onlyClassic ? `只看 ${state.classic.size} 则精注经典` : '已显示全部笑话');
  }

  function toggleTag(dim, key) {
    if (!state.tags[dim]) return;
    if (state.tags[dim].has(key)) state.tags[dim].delete(key);
    else state.tags[dim].add(key);
    applyFilters();
  }

  function searchHay(joke) {
    return joke.__hay || '';
  }

  function computeFiltered() {
    const q = state.q.trim().toLocaleLowerCase();
    let rows = state.jokes.filter(joke => {
      if (state.onlyClassic && !joke.__classic) return false;
      if (state.term && !(state.term.related_joke_nums || []).includes(joke.num)) return false;
      if (q && !searchHay(joke).includes(q)) return false;
      return DIMS.every(dim => {
        const wanted = state.tags[dim];
        if (!wanted.size) return true;
        const have = joke.tags?.[dim] || [];
        for (const key of wanted) if (have.includes(key)) return true;
        return false;
      });
    });
    rows.sort((a, b) => {
      const delta = (a.num || 0) - (b.num || 0);
      return state.sort === 'desc' ? -delta || String(a.recordKey).localeCompare(String(b.recordKey)) : delta || String(a.recordKey).localeCompare(String(b.recordKey));
    });
    return rows;
  }

  function applyFilters() {
    state.filtered = computeFiltered();
    syncChips();
    renderResults();
  }

  function resetFilters() {
    state.q = '';
    state.term = null;
    state.onlyClassic = false;
    DIMS.forEach(dim => state.tags[dim].clear());
    if (els.search) els.search.value = '';
    applyFilters();
    if (els.search) els.search.focus({ preventScroll: true });
  }

  /* ============================ 卡片与懒加载 ============================ */

  function tagsForCard(joke) {
    const caps = { attribution: 3, era: 2, theme: 2, reliability: 1 };
    const tags = [];
    DIMS.forEach(dim => {
      (joke.tags?.[dim] || []).slice(0, caps[dim]).forEach(key => {
        tags.push({ dim, key, label: label(dim, key) });
      });
    });
    return tags;
  }

  function cardHtml(joke) {
    const classic = joke.__classic;
    const tags = tagsForCard(joke);
    const domains = domainsOf(joke).length;
    const terms = termsOf(joke).length;
    const footBits = [
      `${domains} 个诊断域`,
      terms ? `${terms} 个术语` : '',
      classic ? '三层精注' : '',
    ].filter(Boolean);
    return `<article class="card${classic ? ' is-classic' : ''}" data-key="${esc(joke.recordKey || joke.id)}" style="--dot:${domainColor(joke)}">
      <div class="card-top">
        <span class="card-num">#${esc(joke.num)}</span>
        <span class="card-form">${esc(joke.form || '笑话')}</span>
        ${classic ? '<span class="card-classic">精注</span>' : ''}
        ${joke.tragic ? '<span class="card-tragic">含悲剧内容</span>' : ''}
      </div>
      ${classic ? `<h3 class="card-title">${esc(classic.title)}</h3>` : ''}
      <p class="card-text">${hl(joke.text || '', state.q)}</p>
      <div class="card-tags">${tags.map(tag => `<button type="button" class="tag" data-tag-dim="${tag.dim}" data-tag-key="${esc(tag.key)}" title="按此标签筛选">${esc(tag.label)}</button>`).join('')}</div>
      <div class="card-foot">
        <span>${esc(footBits.join(' · '))}</span>
        <button type="button" class="open-link" data-open-joke="${esc(joke.recordKey || joke.id)}">展开注解
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
        </button>
      </div>
    </article>`;
  }

  function columnCount() {
    if (window.innerWidth <= 640) return 1;
    if (window.innerWidth <= 1080) return 2;
    return 3;
  }

  function createColumns(container) {
    container.innerHTML = '';
    const columns = [];
    for (let i = 0; i < columnCount(); i += 1) {
      const column = document.createElement('div');
      column.className = 'masonry-col';
      container.appendChild(column);
      columns.push(column);
    }
    return columns;
  }

  function placeCards(columns, jokes) {
    jokes.forEach(joke => {
      let target = columns[0];
      columns.forEach(column => {
        if (column.offsetHeight < target.offsetHeight) target = column;
      });
      target.insertAdjacentHTML('beforeend', cardHtml(joke));
    });
  }

  function renderResults() {
    const list = els.list;
    if (!list) return;
    state.archiveColumns = createColumns(list);
    state.rendered = 0;
    if (els.empty) els.empty.hidden = state.filtered.length !== 0;
    if (els.loadEnd) els.loadEnd.hidden = true;
    updateCount();
    updateActiveTerm();
    if (state.filtered.length) {
      for (let i = 0; i < INITIAL_CHUNKS; i += 1) appendChunk();
    }
    updateSentinel();
    writeUrl();
  }

  function appendChunk() {
    if (state.rendered >= state.filtered.length) return false;
    const slice = state.filtered.slice(state.rendered, state.rendered + CHUNK);
    placeCards(state.archiveColumns, slice);
    state.rendered += slice.length;
    updateSentinel();
    return true;
  }

  function updateCount() {
    if (!els.count) return;
    els.count.innerHTML = `命中 <strong>${state.filtered.length}</strong> / ${state.jokes.length} 则`;
  }

  function updateActiveTerm() {
    const box = els.activeTerm;
    if (!box) return;
    if (!state.term) {
      box.hidden = true;
      box.innerHTML = '';
      return;
    }
    const count = state.filtered.length;
    box.hidden = false;
    box.innerHTML = `<span>术语筛选：<strong>${esc(state.term.term)}</strong> · ${count} 则</span><button type="button" data-clear-term aria-label="清除术语筛选">×</button>`;
  }

  function updateSentinel() {
    if (!els.sentinel) return;
    const more = state.rendered < state.filtered.length;
    els.sentinel.hidden = !more;
    if (els.loadEnd) {
      els.loadEnd.hidden = more || state.filtered.length === 0;
      const endCount = $('[data-end-count]', els.loadEnd);
      if (endCount) endCount.textContent = state.filtered.length;
    }
  }

  function loadMore() {
    if (state.loading) return;
    if (state.rendered >= state.filtered.length) return;
    state.loading = true;
    requestAnimationFrame(() => {
      appendChunk();
      state.loading = false;
    });
  }

  function setupObserver() {
    if (!els.sentinel) return;
    if (!('IntersectionObserver' in window)) {
      addEventListener('scroll', () => {
        if (!els.sentinel.hidden && els.sentinel.getBoundingClientRect().top < innerHeight + 600) loadMore();
      }, { passive: true });
      return;
    }
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) loadMore(); });
    }, { rootMargin: '700px 0px' });
    observer.observe(els.sentinel);
  }

  /* ============================ 随机十则 ============================ */

  function drawCardHtml(joke, index) {
    const diag = state.diagById.get(joke.domain);
    const text = (joke.text || '').replace(/\n+/g, ' ');
    const classic = joke.__classic;
    return `<button type="button" class="draw-card${classic ? ' is-classic' : ''}" data-draw-key="${esc(joke.recordKey || joke.id)}" style="animation-delay:${index * 45}ms" aria-label="第 ${esc(joke.num)} 则，打开详情">
      <span class="draw-top">
        <span class="draw-num">#${esc(joke.num)}</span>
        <span class="draw-form">${esc(joke.form || '笑话')}</span>
        ${classic ? '<span class="draw-classic">精注</span>' : ''}
        <span class="draw-dot" style="background:${domainColorById(joke.domain)}" aria-hidden="true"></span>
      </span>
      <span class="draw-text">${esc(text)}</span>
      <span class="draw-foot"><span>${esc(diag?.label || joke.label || '未分类')}</span><span class="draw-arrow" aria-hidden="true">↗</span></span>
    </button>`;
  }

  function renderDrawCards(jokes) {
    if (!els.drawGrid) return;
    els.drawGrid.innerHTML = jokes.map((joke, index) => drawCardHtml(joke, index)).join('');
    els.drawGrid.scrollLeft = 0;
  }

  function updateDrawProgress() {
    if (!els.drawProgress) return;
    const total = state.jokes.length;
    els.drawProgress.textContent = state.drawn.size >= total
      ? `整库 ${total} 则都抽过了`
      : `已抽 ${state.drawn.size} / ${total}`;
  }

  function loadDrawn() {
    try {
      const stored = JSON.parse(localStorage.getItem(DRAW_STORE) || '[]');
      if (!Array.isArray(stored)) return;
      const valid = new Set(state.jokes.map(joke => joke.recordKey || joke.id));
      state.drawn = new Set(stored.filter(key => typeof key === 'string' && valid.has(key)));
    } catch (error) {
      state.drawn = new Set();
    }
  }

  function saveDrawn() {
    try {
      localStorage.setItem(DRAW_STORE, JSON.stringify([...state.drawn]));
    } catch (error) {
      /* storage may be unavailable; the in-memory set still works */
    }
  }

  function drawFresh(silent = false) {
    if (!state.jokes.length) return;
    let pool = state.jokes.filter(joke => !state.drawn.has(joke.recordKey || joke.id));

    if (pool.length < 10) {
      state.drawn = new Set(state.drawBatch);
      pool = state.jokes.filter(joke => !state.drawn.has(joke.recordKey || joke.id));
      if (!pool.length) {
        state.drawn = new Set();
        pool = state.jokes.slice();
      } else if (!silent) {
        toast('这一轮已经抽完，重新洗牌');
      }
    }

    const picked = shuffle(pool).slice(0, 10);
    state.drawBatch = picked.map(joke => joke.recordKey || joke.id);
    state.drawBatch.forEach(key => state.drawn.add(key));
    renderDrawCards(picked);
    updateDrawProgress();
    saveDrawn();
  }

  /* ============================ 分类卡捆 ============================ */

  function renderDecks() {
    if (!els.deckGrid) return;
    els.deckGrid.innerHTML = state.diagnoses.map(diag => {
      const count = countByDomain(diag.id);
      return `<button type="button" class="deck" data-deck-id="${esc(diag.id)}" aria-expanded="false" style="--deck-color:${domainColorById(diag.id)}">
        <span class="deck-layers" aria-hidden="true"><span class="deck-layer"></span><span class="deck-layer"></span></span>
        <span class="deck-face">
          <span class="deck-top"><span class="deck-code">${esc(diag.id.slice(0, 3))}</span><span class="deck-count">${count} 则</span></span>
          <span class="deck-title">${esc(diag.label)}</span>
          <span class="deck-desc">${esc(diag.summary)}</span>
          <span class="deck-cue">翻开这一捆 <span aria-hidden="true">→</span></span>
        </span>
      </button>`;
    }).join('');
  }

  function openDeck(id) {
    const diag = state.diagById.get(id);
    if (!diag) return;
    const list = state.jokes
      .filter(joke => (joke.domains || [joke.domain]).includes(id))
      .sort((a, b) => (a.num || 0) - (b.num || 0));

    state.deck = { id, diag, list, rendered: 0 };

    $$('.deck').forEach(deck => {
      const on = deck.dataset.deckId === id;
      deck.classList.toggle('is-active', on);
      deck.setAttribute('aria-expanded', String(on));
      if (on) {
        deck.classList.remove('is-opening');
        void deck.offsetWidth;
        deck.classList.add('is-opening');
        setTimeout(() => deck.classList.remove('is-opening'), 520);
      }
    });

    if (els.deckTitle) els.deckTitle.textContent = diag.label;
    if (els.deckKicker) els.deckKicker.textContent = `${diag.id} / 制度诊断`;
    if (els.deckMeta) els.deckMeta.textContent = `${list.length} 则 · ${diag.summary || ''}`;
    if (els.deckCards) {
      els.deckCards.innerHTML = '';
      state.deckColumns = createColumns(els.deckCards);
    }
    if (els.deckViewer) {
      els.deckViewer.hidden = false;
      els.deckViewer.style.animation = 'none';
      void els.deckViewer.offsetWidth;
      els.deckViewer.style.animation = '';
      els.deckCards.scrollTop = 0;
    }

    appendDeckChunk();
    appendDeckChunk();
    updateDeckMore();
    writeUrl();

    requestAnimationFrame(() => {
      if (!els.deckViewer || els.deckViewer.hidden) return;
      const rect = els.deckViewer.getBoundingClientRect();
      if (rect.top > innerHeight - 180 || rect.top < 40) {
        els.deckViewer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  function appendDeckChunk() {
    if (!state.deck || !els.deckCards) return false;
    const { list } = state.deck;
    if (state.deck.rendered >= list.length) return false;
    const slice = list.slice(state.deck.rendered, state.deck.rendered + 12);
    if (!state.deckColumns) state.deckColumns = createColumns(els.deckCards);
    placeCards(state.deckColumns, slice);
    state.deck.rendered += slice.length;
    updateDeckMore();
    return true;
  }

  function updateDeckMore() {
    if (!els.deckMore) return;
    if (!state.deck) {
      els.deckMore.hidden = true;
      return;
    }
    const remaining = state.deck.list.length - state.deck.rendered;
    els.deckMore.hidden = remaining <= 0;
    els.deckMore.textContent = remaining > 0 ? `继续翻看（还有 ${remaining} 则）` : '';
  }

  function closeDeck() {
    state.deck = null;
    state.deckColumns = null;
    if (els.deckViewer) els.deckViewer.hidden = true;
    if (els.deckCards) els.deckCards.innerHTML = '';
    $$('.deck').forEach(deck => {
      deck.classList.remove('is-active');
      deck.setAttribute('aria-expanded', 'false');
    });
    writeUrl();
  }

  function filterDeck() {
    if (!state.deck) return;
    const diag = state.deck.diag;
    DIMS.forEach(dim => state.tags[dim].clear());
    state.tags.attribution.add(diag.attribution_key);
    state.q = '';
    state.term = null;
    if (els.search) els.search.value = '';
    closeDeck();
    applyFilters();
    toast(`已按「${diag.label}」筛出 ${state.filtered.length} 则`);
    scrollToArchive();
  }

  /* ============================ URL 状态 ============================ */

  function writeUrl() {
    const url = new URL(location.href);
    ['q', 'theme', 'attribution', 'era', 'reliability', 'term', 'joke', 'sort', 'deck', 'classic', 'panel'].forEach(key => url.searchParams.delete(key));
    if (state.q) url.searchParams.set('q', state.q);
    DIMS.forEach(dim => state.tags[dim].forEach(key => url.searchParams.append(dim, key)));
    if (state.onlyClassic) url.searchParams.set('classic', '1');
    if (state.term) url.searchParams.set('term', state.term.id);
    if (state.activeKey) url.searchParams.set('joke', state.activeKey);
    if (state.sort !== 'asc') url.searchParams.set('sort', state.sort);
    if (state.deck) url.searchParams.set('deck', state.deck.id);
    if (state.panel) url.searchParams.set('panel', state.panel);
    history.replaceState(null, '', url.pathname + url.search + url.hash);
  }

  function readUrl() {
    const params = new URLSearchParams(location.search);
    state.q = params.get('q') || '';
    DIMS.forEach(dim => {
      const keys = params.getAll(dim);
      state.tags[dim] = new Set(keys.filter(key => key));
    });
    const termId = params.get('term');
    state.term = termId ? state.terms.find(term => term.id === termId) || null : null;
    state.onlyClassic = params.get('classic') === '1';
    state.sort = params.get('sort') === 'desc' ? 'desc' : 'asc';
    state.deepLinkKey = params.get('joke') || null;
    state.pendingDeck = params.get('deck') || null;
    const panelType = params.get('panel');
    state.pendingPanel = ['diagnoses', 'glossary', 'writing', 'about'].includes(panelType) ? panelType : null;
    state.panel = null;
    if (els.search) els.search.value = state.q;
    const clear = $('[data-clear-search]');
    if (clear) clear.hidden = !state.q;
    syncChips();
    const sortLabel = $('[data-sort-label]');
    if (sortLabel) sortLabel.textContent = state.sort === 'desc' ? '编号 ↓' : '编号 ↑';
    const sortBtn = $('[data-action="toggle-sort"]');
    if (sortBtn) sortBtn.setAttribute('aria-pressed', String(state.sort === 'desc'));
  }

  /* ============================ 滚动锁定 ============================ */
  /*
   * 打开抽屉时只锁滚动，不动页面几何：
   * 1. html 上预留 scrollbar-gutter，滚动条消失时内容宽度不变，避免满屏重排；
   * 2. 不支持 scrollbar-gutter 的浏览器用 padding-right 兜底；
   * 3. 解锁时校验滚动位置，个别浏览器切换 overflow 会丢位置，这里补回来。
   * 这三条一起，才是“点开抽屉页面不会像刷新一样重排、重定位”的根因修复。
   */

  const hasScrollbarGutter = (() => {
    try { return typeof CSS !== 'undefined' && CSS.supports && CSS.supports('scrollbar-gutter', 'stable'); } catch (error) { return false; }
  })();

  let lockedScrollY = 0;
  let lockPadding = 0;

  function lockPageScroll() {
    lockedScrollY = window.scrollY;
    if (!hasScrollbarGutter) {
      lockPadding = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
      if (lockPadding) document.body.style.paddingRight = `${lockPadding}px`;
    }
    document.body.classList.add('is-locked');
  }

  function unlockPageScroll() {
    document.body.classList.remove('is-locked');
    if (lockPadding) {
      document.body.style.paddingRight = '';
      lockPadding = 0;
    }
    if (Math.abs(window.scrollY - lockedScrollY) > 1) {
      const html = document.documentElement;
      const previous = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto';
      window.scrollTo(0, lockedScrollY);
      html.style.scrollBehavior = previous;
    }
  }

  function scrollWithoutAnimation(top) {
    const html = document.documentElement;
    const previous = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    window.scrollTo(0, Math.max(0, top));
    html.style.scrollBehavior = previous;
  }

  /* 抽屉打开期间的重新渲染（窗口尺寸变化等）推迟到关闭之后，避免页面在用户脚下重排 */
  let layoutDeferred = false;

  function reflowLayout() {
    const next = columnCount();
    if (next === state.lastColumnCount) return;
    state.lastColumnCount = next;
    const y = window.scrollY;
    renderResults();
    if (state.deck) {
      const keep = Math.max(12, state.deck.rendered);
      state.deckColumns = createColumns(els.deckCards);
      state.deck.rendered = 0;
      const slice = state.deck.list.slice(0, keep);
      placeCards(state.deckColumns, slice);
      state.deck.rendered = slice.length;
      updateDeckMore();
    }
    if (Math.abs(window.scrollY - y) > 1) scrollWithoutAnimation(y);
  }

  function requestLayout() {
    if (overlayStack.length) {
      layoutDeferred = true;
      return;
    }
    reflowLayout();
  }

  function flushDeferredLayout() {
    if (!layoutDeferred) return;
    layoutDeferred = false;
    if (overlayStack.length) return;
    reflowLayout();
  }

  /* ============================ 抽屉 ============================ */

  function pushOverlay(name, trigger) {
    const sheet = name === 'drawer' ? els.drawer : els.panel;
    if (!sheet) return;
    sheet.setAttribute('aria-hidden', 'false');
    overlayStack.push({ name, trigger: trigger || document.activeElement });
    if (overlayStack.length === 1) lockPageScroll();
    requestAnimationFrame(() => {
      const panel = $('.sheet-panel', sheet);
      if (panel) panel.focus({ preventScroll: true });
    });
  }

  function popOverlay() {
    const top = overlayStack.pop();
    if (!top) return;
    const sheet = top.name === 'drawer' ? els.drawer : els.panel;
    if (sheet) sheet.setAttribute('aria-hidden', 'true');
    if (top.trigger && document.contains(top.trigger)) {
      try { top.trigger.focus({ preventScroll: true }); } catch (error) { /* ignore */ }
    }
    if (top.name === 'drawer') {
      state.activeKey = null;
      writeUrl();
    }
    if (top.name === 'panel' && state.panel) {
      state.panel = null;
      writeUrl();
    }
    if (!overlayStack.length) {
      unlockPageScroll();
      flushDeferredLayout();
    }
    hidePopover();
  }

  function topOverlayName() {
    return overlayStack.length ? overlayStack[overlayStack.length - 1].name : null;
  }

  function closeTopSheet() {
    popOverlay();
  }

  function accHtml(badge, title, hint, bodyHtml, open = false) {
    return `<section class="acc${open ? ' is-open' : ''}">
      <button type="button" class="acc-head" data-acc-toggle aria-expanded="${open}">
        <span class="acc-num">${esc(badge)}</span>
        <span class="acc-title">${esc(title)}</span>
        <span class="acc-hint">${esc(hint)}</span>
        <svg class="acc-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      <div class="acc-body"><div class="acc-inner"><div class="acc-content">${bodyHtml}</div></div></div>
    </section>`;
  }

  function renderDrawer(joke) {
    if (!joke) return;
    const classic = joke.__classic;
    const domains = domainsOf(joke);
    const terms = termsOf(joke);
    const tagButtons = DIMS.flatMap(dim => (joke.tags?.[dim] || []).map(key => `<button type="button" class="tag" data-tag-dim="${dim}" data-tag-key="${esc(key)}" title="按此标签筛选">${esc(label(dim, key))}</button>`));

    if (els.drawerKicker) {
      els.drawerKicker.textContent = classic
        ? `经典精注 · #${joke.num} · ${joke.form || '笑话'}`
        : `档案记录 · #${joke.num} · ${joke.form || '笑话'}`;
    }
    if (els.drawerTitle) els.drawerTitle.textContent = classic ? classic.title : `第 ${joke.num} 则`;

    const reliability = (joke.tags?.reliability || []).map(key => `<span class="tag" data-dim="reliability">${esc(label('reliability', key))}</span>`).join('');
    const sources = (joke.sources || []).map(src => `<span class="source-pill">${esc(src)}</span>`).join('');
    const leaders = joke.leader_mentions && Object.keys(joke.leader_mentions).length
      ? `<p class="note">文中代号保留原文：${Object.entries(joke.leader_mentions).map(([alias, real]) => `${esc(alias)}（${esc(real)}）`).join('；')}。</p>`
      : '';
    const tragic = joke.tragic ? '<div class="callout">本条涉及真实受害者与镇压记忆，请作为制度讽刺阅读，不轻佻消费。</div>' : '';

    const reliabilityNote = state.reliabilityNotes.get(joke.recordKey || joke.id);
    const sourceBody = `
      ${reliability ? `<div class="tag-list">${reliability}</div>` : '<p class="note">未标注可靠性。</p>'}
      ${reliabilityNote ? `<p class="reliability-note"><strong>可靠性修订</strong>${esc(reliabilityNote)}</p>` : ''}
      ${sources ? `<p class="section-label" style="margin-top:16px">来源标识</p><div class="source-list">${sources}</div>` : ''}
      ${leaders}
      ${tragic}
      <p class="note">笑话说的是感受，不是事实。数字与史实请回到诊断域的来源字段，不要从笑话正文直接抽引。</p>`;

    const whyLine = classic
      ? `<p class="why-line"><span>为什么选它</span>${esc(classic.why)}</p>`
      : '';

    const workshopBody = classic
      ? `<p class="workshop-core"><span>核心动作</span>${esc(classic.core)}</p>
        <p>${esc(classic.workshop)}</p>
        <div class="remix-box">
          <span class="remix-label">换一个靶子（不是填空，是换对象）</span>
          <p>${esc(classic.remix)}</p>
        </div>
        ${classic.caution ? `<p class="caution-line"><strong>边界</strong>${esc(classic.caution)}</p>` : ''}
        ${classic.drill ? `<p class="drill-line"><strong>自测</strong>${esc(classic.drill)}</p>` : ''}
        <p class="workshop-link"><button type="button" class="link-btn" data-panel="writing">打开写作课，看完整方法 →</button></p>`
      : '';

    const annotationBlock = classic
      ? `<p class="section-label">三层精注 · 写作向</p>
        ${accHtml('①', '机关解剖', classic.technique || '笑点机制', esc(classic.craft), true)}
        ${accHtml('②', '讽刺靶心', domains[0]?.label || '制度机制', esc(classic.target), false)}
        ${accHtml('③', '仿写工坊', '核心动作、换靶与自测', workshopBody, false)}`
      : `<p class="section-label">基础注释</p>
        ${accHtml('§', '字词与语境', '源数据注释', `
          ${joke.lemma ? `<p><strong>字词典故：</strong>${esc(joke.lemma)}</p>` : ''}
          ${joke.history ? `<p><strong>历史语境：</strong>${esc(joke.history)}</p>` : ''}
          ${joke.genre ? `<p><strong>叙事方式：</strong>${esc(joke.genre)}</p>` : ''}
        `, true)}`;

    els.drawerBody.innerHTML = `
      <blockquote class="joke-text">${esc(joke.text)}</blockquote>
      <div class="detail-meta">
        <span>${esc(joke.label || '未分类')}</span>
        <span class="dot"></span>
        <span>${domains.length} 个诊断域</span>
        ${terms.length ? `<span class="dot"></span><span>${terms.length} 个术语</span>` : ''}
        ${classic ? '<span class="dot"></span><span>精注经典</span>' : ''}
      </div>
      ${whyLine}

      <p class="section-label">四维标签</p>
      <div class="tag-list">${tagButtons.join('') || '<span class="note">无标签</span>'}</div>

      ${annotationBlock}

      <p class="section-label">制度诊断</p>
      <div class="diag-mini-list">
        ${domains.map(diag => `<button type="button" class="diag-mini" data-diag-open="${esc(diag.id)}">
          <span class="diag-code">${esc(diag.id.slice(0, 3))}</span>
          <span class="diag-mini-copy"><strong>${esc(diag.label)}</strong><span>${esc(diag.summary)}</span></span>
          <span class="diag-mini-arrow" aria-hidden="true">→</span>
        </button>`).join('') || '<p class="note">未关联诊断域。</p>'}
      </div>

      ${terms.length ? `<p class="section-label">相关术语</p><div class="tag-list">${terms.map(term => `<button type="button" class="term-chip" data-term-id="${esc(term.id)}">${esc(term.term)}</button>`).join('')}</div>` : ''}

      <p class="section-label">来源与可靠性</p>
      ${accHtml('§', '来源、可靠性与提示', reliability ? '立场与史料边界' : '阅读提示', sourceBody, false)}
    `;

    els.drawerFoot.innerHTML = `
      <button type="button" class="btn btn-ghost" data-copy-link>复制链接</button>
      <div class="prevnext">
        <button type="button" class="icon-btn" data-nav="prev" aria-label="上一则">←</button>
        <button type="button" class="icon-btn" data-nav="next" aria-label="下一则">→</button>
      </div>`;
  }

  function openJoke(joke, options = {}) {
    if (!joke) return;
    state.activeKey = joke.recordKey || joke.id;
    renderDrawer(joke);
    writeUrl();
    if (topOverlayName() !== 'drawer') {
      pushOverlay('drawer', options.trigger);
    } else {
      const panel = $('.sheet-panel', els.drawer);
      if (panel) panel.focus({ preventScroll: true });
    }
  }

  function navJoke(direction) {
    const base = state.filtered.length ? state.filtered : state.jokes;
    const index = base.findIndex(joke => (joke.recordKey || joke.id) === state.activeKey);
    if (index === -1) return;
    const next = base[index + direction];
    if (!next) {
      toast(direction > 0 ? '已经是最后一则了' : '已经是第一则了');
      return;
    }
    openJoke(next);
  }

  /* ============================ 面板 ============================ */

  function openPanel(type, focusId) {
    if (!els.panel) return;
    state.panel = type;
    renderPanel(type, focusId);
    if (topOverlayName() !== 'panel') {
      pushOverlay('panel', document.activeElement);
    } else {
      const panel = $('.sheet-panel', els.panel);
      if (panel) panel.focus({ preventScroll: true });
    }
    writeUrl();
  }

  function renderPanel(type, focusId) {
    const meta = {
      diagnoses: { kicker: 'REFERENCE / 制度诊断', title: '十二个制度诊断域' },
      glossary: { kicker: 'REFERENCE / 术语表', title: '二十条术语' },
      writing: { kicker: 'WRITING ROOM / 写作课', title: '怎样写一则政治讽刺笑话' },
      about: { kicker: 'READING ROOM / 阅读说明', title: '怎样读这本笑话集' },
    }[type] || { kicker: 'REFERENCE', title: '参考资料' };

    if (els.panelKicker) els.panelKicker.textContent = meta.kicker;
    if (els.panelTitle) els.panelTitle.textContent = meta.title;
    els.panelBody.scrollTop = 0;

    if (type === 'diagnoses') renderDiagnoses(focusId);
    else if (type === 'glossary') renderGlossary(focusId);
    else if (type === 'writing') renderWriting();
    else renderAbout();
  }

  function countByDomain(id) {
    return state.jokes.filter(joke => (joke.domains || [joke.domain]).includes(id)).length;
  }

  function countByAttribution(key) {
    return state.jokes.filter(joke => (joke.tags?.attribution || []).includes(key)).length;
  }

  function renderDiagnoses(focusId) {
    const narrativeOrder = ['来龙去脉', '失效机制', '如何走向反面', '多重叠加'];
    els.panelBody.innerHTML = `
      <p class="panel-intro">笑话指向的问题并非笼统的“体制”，而是可以逐项归因的机制。以下 <strong>${state.diagnoses.length}</strong> 个诊断域对应四维标签中的“制度归因”，点开任意一域可读其来龙去脉、失效机制与反方观点。</p>
      <div class="diag-list">
        ${state.diagnoses.map(diag => {
          const entries = Object.entries(diag.narrative || {});
          const ordered = narrativeOrder.map(key => [key, diag.narrative?.[key]]).filter(([, value]) => value);
          const extra = entries.filter(([key]) => !narrativeOrder.includes(key));
          const quads = [...ordered, ...extra];
          return `<article class="diag-card" id="diag-${esc(diag.id)}" data-diag-card="${esc(diag.id)}">
            <button type="button" class="diag-card-head" data-diag-toggle aria-expanded="false">
              <span class="diag-badge">${esc(diag.id.slice(0, 3))}</span>
              <span class="diag-titles"><strong>${esc(diag.label)}</strong><span>${esc(diag.summary)}</span></span>
              <span class="diag-count">${countByDomain(diag.id)} 则</span>
              <svg class="diag-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            <div class="diag-body"><div class="diag-body-inner"><div class="diag-content">
              <div class="diag-quad">
                ${quads.map(([title, text]) => `<div class="q"><h4>${esc(title)}</h4><p>${esc(text)}</p></div>`).join('')}
              </div>
              ${diag.joke_patterns ? `<div class="diag-pattern"><strong>笑话里的表现</strong>${esc(diag.joke_patterns)}</div>` : ''}
              ${diag.counterpoint ? `<div class="diag-counter"><strong>反方观点 / 替代方案</strong>${esc(diag.counterpoint)}</div>` : ''}
              <div class="diag-foot">
                <span class="meta">${(diag.sources || []).length} 组来源 · ${(diag.exhibition_nodes || []).length} 个知识库节点</span>
                <button type="button" class="btn btn-ghost" data-diag-filter="${esc(diag.attribution_key)}">查看相关笑话（${countByAttribution(diag.attribution_key)}）</button>
              </div>
            </div></div></div>
          </article>`;
        }).join('')}
      </div>`;

    if (focusId) {
      const card = $(`[data-diag-card="${CSS.escape(focusId)}"]`, els.panelBody);
      if (card) {
        expandDiag(card, true);
        requestAnimationFrame(() => card.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      }
    }
  }

  function expandDiag(card, open) {
    card.classList.toggle('is-open', open);
    const head = $('[data-diag-toggle]', card);
    if (head) head.setAttribute('aria-expanded', String(open));
  }

  function renderGlossary(focusId) {
    els.panelBody.innerHTML = `
      <p class="panel-intro">术语表解释笑话反复出现的名词。点开术语可读一句话定义，或直接筛出关联笑话。母站知识库中若已有同名词条，可另行跳转；此处只保证本地释义可用。</p>
      <div class="panel-search">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
        <input type="search" id="glossary-q" placeholder="筛选术语名称或释义……" autocomplete="off" aria-label="筛选术语">
      </div>
      <div class="term-list" id="glossary-list"></div>`;

    const list = $('#glossary-list', els.panelBody);
    const render = query => {
      const q = query.trim().toLocaleLowerCase();
      const terms = state.terms.filter(term => !q || `${term.term} ${term.def} ${term.period || ''}`.toLocaleLowerCase().includes(q));
      list.innerHTML = terms.map(term => {
        const match = /^(.*?)\s*\(([^)]+)\)\s*$/.exec(term.term || '');
        const title = match ? match[1] : term.term;
        const latin = match ? match[2] : '';
        const count = (term.related_joke_nums || []).length;
        return `<article class="term-row" id="term-${esc(term.id)}">
          <h3>${esc(title)}${latin ? `<span>${esc(latin)}</span>` : ''}</h3>
          ${term.period ? `<span class="period">${esc(term.period)}</span>` : ''}
          <p>${esc(term.def)}</p>
          <div class="term-foot">
            <span>关联 ${count} 则</span>
            <button type="button" class="link-btn" data-term-select="${esc(term.id)}">查看相关笑话 →</button>
          </div>
        </article>`;
      }).join('') || '<p class="note">没有匹配的术语。</p>';
    };

    render('');
    const input = $('#glossary-q', els.panelBody);
    input.addEventListener('input', debounce(() => render(input.value), 120));

    if (focusId) {
      const row = $(`#term-${CSS.escape(focusId)}`, els.panelBody);
      if (row) requestAnimationFrame(() => row.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    }
  }

  function renderWriting() {
    els.panelBody.innerHTML = `
      <p class="panel-intro">这本集子现在只给 <strong>${state.classic.size}</strong> 则笑话做精注。选它们，不是因为“最正确”，而是因为<strong>机关完整、可以迁移</strong>：读完能拆，拆完能写。三层精注分别是「机关解剖」「讽刺靶心」「仿写工坊」。</p>
      <p class="panel-intro">仿写工坊<strong>不是挖词填空</strong>：它先指出这则笑话的「核心动作」，再给一个换掉靶子的完整示例，最后留一道自测。你要学的是逻辑怎么转，而不是把原句抄一遍换几个名词。</p>

      <div class="writing-grid">
        <section class="writing-card">
          <span class="writing-num">01</span>
          <h3>靶子要具体</h3>
          <p>不要写“体制坏”，要写“把温度计调高四度”。对象越具体到某个动作、某句官话、某个流程，笑话越不容易退化成口号。</p>
          <p class="writing-eg">样本 #649：燃料紧缺 → 调高温度计</p>
        </section>
        <section class="writing-card">
          <span class="writing-num">02</span>
          <h3>落差要日常</h3>
          <p>宏大承诺必须撞上一个极小的生活事实：买不到肉、排队两公里、皮鞋太重。落差越日常，读者越不需要解释。</p>
          <p class="writing-eg">样本 #162：两公里的队，老吃白菜</p>
        </section>
        <section class="writing-card">
          <span class="writing-num">03</span>
          <h3>机关只用一个</h3>
          <p>双关、归谬、视角反转、清单递进、领域错位、改度量——一则笑话只用一个主机关。堆两个，包袱就散了。</p>
          <p class="writing-eg">样本 #461：单声道 → 只有一种声音</p>
        </section>
        <section class="writing-card">
          <span class="writing-num">04</span>
          <h3>收尾要短</h3>
          <p>包袱落地就停。不要补一句“这说明了……”，解释会把读者从笑话里推出去；把判断留给读者。</p>
          <p class="writing-eg">样本 #683：还是有人活下来了</p>
        </section>
      </div>

      <p class="section-label">三步写作法</p>
      <ol class="writing-steps">
        <li><strong>抄一句官方话术。</strong>新闻标题、会议通稿、标语、领导讲话都行。保留它的语气、排比和自信，别急着反驳。</li>
        <li><strong>找一个日常困境。</strong>排队、买菜、修车、请假、给孩子上户口。越普通越好，最好是读者今天刚遇到的。</li>
        <li><strong>用一个逻辑把两者焊死。</strong>让官话解释困境，或让困境证明官话。公式是：官方话术 + 日常困境 + 一个错位连接词。</li>
      </ol>

      <p class="section-label">六种常用机关</p>
      <div class="mechanism-list">
        <div class="mechanism"><span class="mechanism-name">归谬</span><p>把官方理由推到物理极限，让它自己变成笑话。</p><span class="mechanism-eg">#529 缺橡皮筋 → 因为要发射卫星</span></div>
        <div class="mechanism"><span class="mechanism-name">偷换指标</span><p>承认数字，换一个量把它变成坏消息。</p><span class="mechanism-eg">#156 产量两倍 → 重量四倍</span></div>
        <div class="mechanism"><span class="mechanism-name">双关</span><p>让技术词与政治词在同一句里重叠。</p><span class="mechanism-eg">#461 单声道 → 全是单方面</span></div>
        <div class="mechanism"><span class="mechanism-name">视角反转</span><p>换方向词或主客体，让“防御”变成“防自己人”。</p><span class="mechanism-eg">#509 墙把东方从西方隔开</span></div>
        <div class="mechanism"><span class="mechanism-name">清单递进</span><p>同一动词连用三次，最后一项把前两项变成危险。</p><span class="mechanism-eg">#343 收集笑话 → 收集说笑话的人</span></div>
        <div class="mechanism"><span class="mechanism-name">领域错位</span><p>用另一个行业的建议回答本行业的问题。</p><span class="mechanism-eg">#411 想入党 → 先看精神科</span></div>
      </div>

      <p class="section-label">今天就能练的三题</p>
      <div class="writing-prompts">
        <article><span>练习 01</span><p>用“资源要优先用于某项宏大计划”解释一个日常短缺。只写两句，第二句必须是回答，不许加评论。</p></article>
        <article><span>练习 02</span><p>写一个问答体：问题完全无害（比如“猪会秃顶吗”），答案用一句标准政治回避话术挡回。</p></article>
        <article><span>练习 03</span><p>把一句“为人民服务”式的口号按字面解释成一个空间或成本问题，让“中心”“身边”“基础”恢复物理含义。</p></article>
      </div>

      <div class="about-note">边界：不拿受害者、死者、族群刻板印象开玩笑；讽刺权力机制，不嘲弄弱者。写给自己看时也守住这条线，机关才立得住。涉及数字与史实，回到制度诊断的来源字段。</div>

      <p class="writing-actions">
        <button type="button" class="btn btn-primary" data-action="show-classics">只看 ${state.classic.size} 则精注经典 →</button>
      </p>`;
  }

  function renderAbout() {
    els.panelBody.innerHTML = `
      <div class="about-section">
        <p class="about-note">笑话说的是“感受”，不是“事实”。它的史料价值在于证明某个时期、某一群人相信什么、抱怨什么、害怕什么，而不直接证明产量、逮捕人数或饥荒死亡数。</p>
      </div>
      <div class="about-section">
        <h3>一、来源不可考</h3>
        <p>这批 ${state.jokes.length} 则编译自 1990—2000 年代从俄语世界回流的段子合集，绝大多数无作者、无首发年代、无首发地；同一则笑话常有多国异文。因此只能当作“后苏联民间记忆的样本”，不宜当作档案文献直接引用。</p>
      </div>
      <div class="about-section">
        <h3>二、精注不是逐条解释</h3>
        <p>672 则笑话里只有 <strong>${state.classic.size}</strong> 则获「精注」标签。其余条目保留原文、标签与制度诊断，但不再硬做三层解释——底蕴不深或机制重复的笑话，解释越多越像敷衍。</p>
        <ul>
          <li><strong>机关完整</strong>：铺垫与包袱之间有一次可复述的逻辑翻转；</li>
          <li><strong>可以迁移</strong>：读者能改写成自己的版本，学到方法而不只是懂这一条；</li>
          <li><strong>有历史锚点</strong>：讽刺对象能落到具体机制，不依赖族群偏见；</li>
          <li><strong>不消费苦难</strong>：涉及死亡与镇压的，靶子必须对准权力而非受害者。</li>
        </ul>
        <p>精注的三层也换了重心：<strong>机关解剖</strong>（怎么转）、<strong>讽刺靶心</strong>（刺谁）、<strong>仿写工坊</strong>（你怎么写）。<button type="button" class="link-btn" data-panel="writing">打开写作课 →</button></p>
      </div>
      <div class="about-section">
        <h3>三、四维标签</h3>
        <p>主题、制度归因、时代、立场与可靠性。归因标签对应十二个诊断域。</p>
        <p>“可靠性”其实混合了两个层面，界面里拆开显示：<strong>立场</strong>（民众怨气 / 精英讽谏 / 疑似西方投放 / 族群刻板印象）说明这则笑话站在谁的位置说话；<strong>证据</strong>（有历史事件原型 / 纯虚构调侃）说明它有没有可对应的史实锚点。两者可以同时存在——例如 #517 原标“民众怨气”，但“黄油在制度光芒下融化”明确锚定 1930 年代配给制与宣传语，因此改标“有历史事件原型”。</p>
        <p>“疑似西方投放”数量很少，是因为源数据缺少逐条传播链，无法可靠增补；宁可留白，也不臆测。所有改标都记录在 <code>data/curation.json</code> 的 <code>reliabilityOverrides</code> 中，并在对应条目的“来源与可靠性”里显示修订说明。</p>
      </div>
      <div class="about-section">
        <h3>四、族群梗的处理</h3>
        <p>以某一民族或国家人群为嘲讽对象的段子保留原文、打上“族群刻板印象”标签，但不隔离成特殊展区。这是帝国中心视角的民间偏见，是观察“中心心态”的材料，绝不是各民族真实处境的证据。</p>
      </div>
      <div class="about-section">
        <h3>五、与术语、诊断的联动</h3>
        <p>每则笑话可展开关联的诊断域与术语；诊断域面板提供“查看相关笑话”，术语面板提供按术语筛选。术语的本地释义独立可用，不会因为母站词条缺失而出现死链。</p>
      </div>
      <div class="about-section">
        <h3>六、引用方式</h3>
        <p>引用单则笑话时注明编号（如 <code>joke-083</code>）与本站；引用数字与史实时走诊断域的来源字段，不要从笑话正文直接抽引。涉及大清洗、饥荒、古拉格的条目已标注“含悲剧内容”。</p>
      </div>
      <div class="about-section">
        <p class="note">本站为外置阅读室，与 Qmlmreader 母站隔离：不读取、不修改母站文件。母站术语页存在同名条目时，可在后续接入中作为跳转目标。</p>
      </div>`;
  }

  /* ============================ 术语浮层 ============================ */

  function showTerm(term, anchor) {
    const pop = els.popover;
    if (!pop || !term) return;
    $('#popover-title', pop).textContent = term.term;
    $('#popover-period', pop).textContent = term.period ? `出现年代：${term.period}` : '';
    $('#popover-def', pop).textContent = term.def || '';
    $('#popover-count', pop).textContent = `关联 ${(term.related_joke_nums || []).length} 则`;
    pop.dataset.termId = term.id;
    pop.hidden = false;

    if (popoverAnchor && popoverAnchor !== anchor) popoverAnchor.setAttribute('aria-expanded', 'false');
    popoverAnchor = anchor;
    if (anchor) anchor.setAttribute('aria-expanded', 'true');

    const rect = anchor ? anchor.getBoundingClientRect() : { left: 20, right: 20, top: 80, bottom: 100 };
    const width = pop.offsetWidth;
    const height = pop.offsetHeight;
    let left = Math.min(Math.max(12, rect.left), innerWidth - width - 12);
    let top = rect.bottom + 10;
    if (top + height > innerHeight - 12) top = rect.top - height - 10;
    if (top < 12) top = 12;
    if (top + height > innerHeight - 12) top = Math.max(12, innerHeight - height - 12);
    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
  }

  function hidePopover() {
    if (!els.popover || els.popover.hidden) return;
    els.popover.hidden = true;
    if (popoverAnchor) {
      popoverAnchor.setAttribute('aria-expanded', 'false');
      popoverAnchor = null;
    }
  }

  /* ============================ 滚动定位 ============================ */

  function scrollToArchive() {
    const head = $('.archive-head');
    if (!head) return;
    requestAnimationFrame(() => head.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  /* ============================ 事件 ============================ */

  function bindEvents() {
    const searchInput = els.search;
    if (searchInput) {
      const runSearch = debounce(() => {
        state.q = searchInput.value;
        applyFilters();
      }, 160);
      searchInput.addEventListener('input', () => {
        const clear = $('[data-clear-search]');
        if (clear) clear.hidden = !searchInput.value;
        runSearch();
      });
      searchInput.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
          searchInput.value = '';
          state.q = '';
          const clear = $('[data-clear-search]');
          if (clear) clear.hidden = true;
          applyFilters();
          searchInput.blur();
        }
      });
    }

    document.addEventListener('click', event => {
      const target = event.target;

      if (target.closest('[data-theme-toggle]')) {
        setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
        return;
      }

      if (target.closest('[data-random]')) {
        const pool = state.filtered.length ? state.filtered : state.jokes;
        if (!pool.length) return;
        openJoke(pool[Math.floor(Math.random() * pool.length)], { trigger: target.closest('[data-random]') });
        return;
      }

      const refreshBtn = target.closest('[data-draw-refresh]');
      if (refreshBtn) {
        drawFresh();
        refreshBtn.classList.remove('is-spinning');
        void refreshBtn.offsetWidth;
        refreshBtn.classList.add('is-spinning');
        return;
      }

      const drawCard = target.closest('[data-draw-key]');
      if (drawCard) {
        const joke = state.jokes.find(item => (item.recordKey || item.id) === drawCard.dataset.drawKey);
        if (joke) openJoke(joke, { trigger: drawCard });
        return;
      }

      const deckBtn = target.closest('[data-deck-id]');
      if (deckBtn) {
        if (state.deck && state.deck.id === deckBtn.dataset.deckId) closeDeck();
        else openDeck(deckBtn.dataset.deckId);
        return;
      }

      if (target.closest('[data-deck-close]')) {
        closeDeck();
        return;
      }

      if (target.closest('[data-deck-more]')) {
        appendDeckChunk();
        return;
      }

      if (target.closest('[data-deck-filter]')) {
        filterDeck();
        return;
      }

      const panelBtn = target.closest('[data-panel]');
      if (panelBtn) {
        openPanel(panelBtn.dataset.panel);
        return;
      }

      if (target.closest('[data-close]')) {
        closeTopSheet();
        return;
      }

      if (target.closest('[data-clear-search]')) {
        if (els.search) els.search.value = '';
        state.q = '';
        applyFilters();
        if (els.search) els.search.focus({ preventScroll: true });
        return;
      }

      const filterBtn = target.closest('[data-action="toggle-filters"]');
      if (filterBtn) {
        const shell = els.filterShell;
        if (!shell) return;
        const open = !shell.classList.contains('is-open');
        shell.classList.toggle('is-open', open);
        filterBtn.setAttribute('aria-expanded', String(open));
        if (open && els.controlDeck && els.controlBar) {
          const headerH = window.innerWidth > 860 ? (els.topbar?.offsetHeight || 0) : 0;
          const barH = els.controlBar.offsetHeight;
          const deckDocTop = els.controlDeck.getBoundingClientRect().top + window.scrollY;
          const target = deckDocTop - headerH - barH - 8;
          if (Math.abs(window.scrollY - target) > 40) {
            window.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
          }
        }
        return;
      }

      if (target.closest('[data-action="toggle-classic"]')) {
        toggleClassic();
        return;
      }

      if (target.closest('[data-action="show-classics"]')) {
        state.onlyClassic = true;
        while (overlayStack.length) popOverlay();
        applyFilters();
        toast(`只看 ${state.classic.size} 则精注经典`);
        scrollToArchive();
        return;
      }

      if (target.closest('[data-action="toggle-sort"]')) {
        state.sort = state.sort === 'asc' ? 'desc' : 'asc';
        const sortLabel = $('[data-sort-label]');
        if (sortLabel) sortLabel.textContent = state.sort === 'desc' ? '编号 ↓' : '编号 ↑';
        const sortBtn = $('[data-action="toggle-sort"]');
        if (sortBtn) sortBtn.setAttribute('aria-pressed', String(state.sort === 'desc'));
        state.filtered = computeFiltered();
        renderResults();
        return;
      }

      if (target.closest('[data-action="reset"]')) {
        resetFilters();
        return;
      }

      const chip = target.closest('.chip[data-dim]');
      if (chip) {
        toggleTag(chip.dataset.dim, chip.dataset.key);
        return;
      }

      const tag = target.closest('[data-tag-dim]');
      if (tag) {
        event.stopPropagation();
        const insideSheet = !!target.closest('.sheet[aria-hidden="false"]');
        if (insideSheet) {
          while (overlayStack.length) popOverlay();
          toggleTag(tag.dataset.tagDim, tag.dataset.tagKey);
          toast(`已按「${label(tag.dataset.tagDim, tag.dataset.tagKey)}」筛选`);
          scrollToArchive();
        } else {
          toggleTag(tag.dataset.tagDim, tag.dataset.tagKey);
          toast(`已按「${label(tag.dataset.tagDim, tag.dataset.tagKey)}」筛选`);
        }
        return;
      }

      const termChip = target.closest('[data-term-id]');
      if (termChip) {
        const term = state.terms.find(item => item.id === termChip.dataset.termId);
        if (term) showTerm(term, termChip);
        return;
      }

      if (target.closest('[data-popover-close]')) {
        hidePopover();
        return;
      }

      const termFilter = target.closest('[data-term-filter]');
      if (termFilter) {
        const term = state.terms.find(item => item.id === els.popover?.dataset.termId);
        if (term) selectTerm(term);
        return;
      }

      if (target.closest('[data-clear-term]')) {
        state.term = null;
        applyFilters();
        return;
      }

      const termSelect = target.closest('[data-term-select]');
      if (termSelect) {
        const term = state.terms.find(item => item.id === termSelect.dataset.termSelect);
        if (term) selectTerm(term);
        return;
      }

      const diagOpen = target.closest('[data-diag-open]');
      if (diagOpen) {
        openPanel('diagnoses', diagOpen.dataset.diagOpen);
        return;
      }

      const diagToggle = target.closest('[data-diag-toggle]');
      if (diagToggle) {
        const card = diagToggle.closest('.diag-card');
        if (card) expandDiag(card, !card.classList.contains('is-open'));
        return;
      }

      const diagFilter = target.closest('[data-diag-filter]');
      if (diagFilter) {
        const key = diagFilter.dataset.diagFilter;
        DIMS.forEach(dim => state.tags[dim].clear());
        state.tags.attribution.add(key);
        state.q = '';
        state.term = null;
        if (els.search) els.search.value = '';
        while (overlayStack.length) popOverlay();
        applyFilters();
        toast(`已筛选「${label('attribution', key)}」相关笑话`);
        scrollToArchive();
        return;
      }

      const accToggle = target.closest('[data-acc-toggle]');
      if (accToggle) {
        const acc = accToggle.closest('.acc');
        if (acc) {
          const open = !acc.classList.contains('is-open');
          acc.classList.toggle('is-open', open);
          accToggle.setAttribute('aria-expanded', String(open));
        }
        return;
      }

      const nav = target.closest('[data-nav]');
      if (nav) {
        navJoke(nav.dataset.nav === 'next' ? 1 : -1);
        return;
      }

      if (target.closest('[data-copy-link]')) {
        copyCurrentLink();
        return;
      }

      const openBtn = target.closest('[data-open-joke]');
      if (openBtn) {
        event.stopPropagation();
        const joke = state.jokes.find(item => (item.recordKey || item.id) === openBtn.dataset.openJoke);
        if (joke) openJoke(joke, { trigger: openBtn });
        return;
      }

      const card = target.closest('.card[data-key]');
      if (card && !target.closest('button, a')) {
        const joke = state.jokes.find(item => (item.recordKey || item.id) === card.dataset.key);
        if (joke) openJoke(joke, { trigger: card.querySelector('.open-link') || card });
        return;
      }

      if (!target.closest('#popover')) hidePopover();
      if (target.closest('.mainnav a')) {
        $$('.mainnav a').forEach(link => link.classList.toggle('is-active', link === target.closest('a')));
      }
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        if (els.popover && !els.popover.hidden) { hidePopover(); return; }
        if (overlayStack.length) { closeTopSheet(); return; }
        if (state.deck) { closeDeck(); return; }
        return;
      }

      if (event.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')) {
        event.preventDefault();
        if (els.search) els.search.focus();
        return;
      }

      const current = topOverlayName();
      if (!current) return;

      if (event.key === 'Tab') {
        const sheet = current === 'drawer' ? els.drawer : els.panel;
        const panel = sheet ? $('.sheet-panel', sheet) : null;
        if (!panel) return;
        const focusables = $$('button, [href], input, [tabindex]:not([tabindex="-1"])', panel).filter(el => el.offsetParent !== null);
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }

      if (current === 'drawer' && (event.key === 'ArrowLeft' || event.key === 'ArrowRight') && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')) {
        event.preventDefault();
        navJoke(event.key === 'ArrowRight' ? 1 : -1);
      }
    });

    addEventListener('popstate', () => {
      readUrl();
      state.filtered = computeFiltered();
      renderResults();
      const key = state.deepLinkKey;
      const joke = key ? state.jokes.find(item => (item.recordKey || item.id) === key) : null;
      if (joke) openJoke(joke);
      else while (overlayStack.length) popOverlay();
      if (state.pendingDeck && state.diagById.has(state.pendingDeck)) openDeck(state.pendingDeck);
      else if (state.deck) closeDeck();
      if (!joke && state.pendingPanel) openPanel(state.pendingPanel);
    });

    let resizeTimer = 0;
    addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(requestLayout, 220);
    });

    let raf = 0;
    addEventListener('scroll', () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        els.topbar?.classList.toggle('is-stuck', window.scrollY > 8);
        const bar = els.controlBar;
        if (bar) {
          const headerH = window.innerWidth > 860 ? els.topbar?.offsetHeight || 0 : 0;
          bar.classList.toggle('is-stuck', bar.getBoundingClientRect().top <= headerH + 2);
        }
      });
    }, { passive: true });
  }

  function selectTerm(term) {
    state.term = term;
    DIMS.forEach(dim => state.tags[dim].clear());
    state.q = '';
    if (els.search) els.search.value = '';
    hidePopover();
    while (overlayStack.length) popOverlay();
    applyFilters();
    toast(`已筛出与「${term.term}」相关的 ${state.filtered.length} 则笑话`);
    scrollToArchive();
  }

  async function copyCurrentLink() {
    const url = location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast('链接已复制');
    } catch (error) {
      const area = document.createElement('textarea');
      area.value = url;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      try { document.execCommand('copy'); toast('链接已复制'); }
      catch (err) { toast('复制失败，请手动复制地址栏链接'); }
      area.remove();
    }
  }

  /* ============================ 初始化 ============================ */

  function cacheElements() {
    els.topbar = $('#topbar');
    els.controlDeck = $('.control-deck');
    els.controlBar = $('.control-bar');
    els.drawGrid = $('#draw-grid');
    els.drawProgress = $('#draw-progress');
    els.deckGrid = $('#deck-grid');
    els.deckViewer = $('#deck-viewer');
    els.deckKicker = $('#deck-kicker');
    els.deckTitle = $('#deck-title');
    els.deckMeta = $('#deck-meta');
    els.deckCards = $('#deck-cards');
    els.deckMore = $('[data-deck-more]');
    els.search = $('#q');
    els.count = $('#count');
    els.list = $('#list');
    els.empty = $('#empty');
    els.sentinel = $('#sentinel');
    els.loadEnd = $('#load-end');
    els.filterRows = $('#filter-rows');
    els.filterShell = $('#filter-shell');
    els.activeTerm = $('#active-term');
    els.drawer = $('#drawer');
    els.drawerKicker = $('#drawer-kicker');
    els.drawerTitle = $('#drawer-title');
    els.drawerBody = $('#drawer-body');
    els.drawerFoot = $('#drawer-foot');
    els.panel = $('#panel');
    els.panelKicker = $('#panel-kicker');
    els.panelTitle = $('#panel-title');
    els.panelBody = $('#panel-body');
    els.popover = $('#popover');
    els.toast = $('#toast');
  }

  async function init() {
    cacheElements();
    initTheme();
    const urlMode = new URLSearchParams(location.search).get('mode');
    if (urlMode === 'light' || urlMode === 'dark') setTheme(urlMode, false);
    if (!els.list) return;

    try {
      await loadData();
    } catch (error) {
      console.error('Unable to load archive data:', error);
      els.list.innerHTML = '<p class="empty" style="display:block">档案数据加载失败。请通过本地静态服务器打开本页，而不是直接双击 HTML。</p>';
      if (els.count) els.count.textContent = '读取失败';
      return;
    }

    buildFilters();
    readUrl();
    bindEvents();
    setupObserver();
    renderDecks();
    loadDrawn();
    drawFresh(true);

    if (window.innerWidth <= 860 && els.filterShell) {
      els.filterShell.classList.remove('is-open');
      const filterBtn = $('[data-action="toggle-filters"]');
      if (filterBtn) filterBtn.setAttribute('aria-expanded', 'false');
    }

    state.filtered = computeFiltered();
    state.lastColumnCount = columnCount();
    renderResults();
    syncChips();

    const jokeKey = state.deepLinkKey;
    if (jokeKey) {
      const joke = state.jokes.find(item => (item.recordKey || item.id) === jokeKey);
      if (joke) openJoke(joke);
    }

    if (state.pendingDeck && state.diagById.has(state.pendingDeck)) {
      openDeck(state.pendingDeck);
    }

    if (state.pendingPanel) openPanel(state.pendingPanel);

    if (state.jokes.length !== 672) {
      console.warn(`Expected 672 jokes; loaded ${state.jokes.length}.`);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
