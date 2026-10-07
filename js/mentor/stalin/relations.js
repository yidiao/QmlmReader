(function () {
  'use strict';

  var ROOT = '../../../data/masters/stalin/';
  var state = { data: null, filter: 'all', query: '', selected: 'stalin', route: 'all' };
  var labels = {
    center: '恒星', inheritance: '理论航线', conflict: '路线斗争', organization: '组织近轨',
    war: '战争星云', diplomacy: '外交星云', legacy: '遗产远轨', alliance: '同盟行星', military: '军事星体'
  };
  var celestialLabels = { star: '恒星', mentor: '导师恒星', planet: '行星', comet: '彗星', belt: '小星星带', satellite: '卫星' };
  var colors = {
    center: '#c92135', inheritance: '#e1b84f', conflict: '#f0783d', organization: '#9faa68',
    alliance: '#9faa68', war: '#50b9c9', military: '#50b9c9', diplomacy: '#50b9c9', legacy: '#a979ba'
  };
  var routeCaptions = {
    all: '从一颗恒星出发，测试未来大星图的视觉语法。',
    inheritance: '理论继承航线亮起：前辈恒星的引力穿过列宁，汇入斯大林局部系统。',
    conflict: '彗星轨迹亮起：路线分歧者以高能轨道切入、偏离、拖出长尾。',
    organization: '近轨行星亮起：组织、治理与政治机器围绕恒星形成稳定轨道。',
    war: '战争星云亮起：卫国战争、外交同盟与战争对手扩张为蓝色星云。',
    legacy: '远轨遗产亮起：后斯大林时代的继承、否定、停滞与解体缓慢运行。'
  };

  function id(value) { return document.getElementById(value); }
  function safe(value) { return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&#039;'); }
  function norm(value) { return String(value == null ? '' : value).toLowerCase(); }
  function unique(list) { var seen = {}; return (list || []).filter(function (item) { if (!item || seen[item]) return false; seen[item] = true; return true; }); }
  function edgeType(edge) { return edge.type === 'military' || edge.type === 'diplomacy' ? 'war' : edge.type; }
  function groupOf(node) { return node.group === 'military' || node.group === 'diplomacy' ? 'war' : node.group; }
  function celestialOf(node) { return node.celestialType || (groupOf(node) === 'conflict' ? 'comet' : groupOf(node) === 'legacy' ? 'satellite' : groupOf(node) === 'inheritance' ? 'mentor' : 'planet'); }
  function edgesOf(data, nodeId) { return data.edges.filter(function (edge) { return edge.source === nodeId || edge.target === nodeId; }); }
  function nodeById(data, nodeId) { return data.nodes.find(function (node) { return node.id === nodeId; }); }
  function groupLabel(data, groupId) { var group = (data.groups || []).find(function (item) { return item.id === groupId; }); return group ? group.label : (labels[groupId] || groupId); }
  function edgeFor(data, node) { return edgesOf(data, node.id)[0] || { type: node.group, label: '' }; }
  function portraitOf(node) {
    if (!node) return '';
    if (node.portrait && typeof node.portrait === 'string') return node.portrait;
    if (node.portrait && node.portrait.src) return node.portrait.src;
    if (node.visual && node.visual.portrait) return node.visual.portrait;
    return '';
  }
  function displayModeOf(node) {
    return (node.visual && node.visual.displayMode) || node.displayMode || (portraitOf(node) ? 'portrait' : 'celestial');
  }
  function searchableText(data, node) {
    return norm([node.id, node.name, node.role, node.summary, node.group, node.rank, node.celestialType, node.orbit, node.nebula, portraitOf(node), (node.aliases || []).join(' '), (node.organizations || []).join(' '), (node.events || []).join(' '), (node.sourceSections || []).join(' '), edgesOf(data, node.id).map(function (edge) { return edge.label + ' ' + edge.type + ' ' + (edge.sourceSections || []).join(' '); }).join(' ')].join(' '));
  }
  function visibleNodes(data) {
    var query = norm(state.query).trim();
    return data.nodes.filter(function (node) {
      if (node.id === data.center) return false;
      var nodeEdges = edgesOf(data, node.id);
      var typeHit = state.filter === 'all' || groupOf(node) === state.filter || nodeEdges.some(function (edge) { return edgeType(edge) === state.filter; });
      var routeHit = state.route === 'all' || groupOf(node) === state.route || (node.routes || []).indexOf(state.route) !== -1 || nodeEdges.some(function (edge) { return edgeType(edge) === state.route || (edge.routes || []).indexOf(state.route) !== -1; });
      var queryHit = !query || searchableText(data, node).indexOf(query) !== -1;
      return typeHit && routeHit && queryHit;
    });
  }
  function polarPosition(node, index, total) {
    if (node.position && typeof node.position.x === 'number' && typeof node.position.y === 'number') return node.position;
    var orbit = node.orbit || (groupOf(node) === 'inheritance' ? 'outer' : groupOf(node) === 'organization' ? 'inner' : groupOf(node) === 'conflict' ? 'comet' : groupOf(node) === 'legacy' ? 'far' : 'middle');
    var radius = { inner: 21, middle: 31, outer: 39, far: 45, comet: 35, belt: 36, satellite: 26 }[orbit] || 32;
    var seeds = { inheritance: -92, conflict: 196, organization: 24, war: 72, legacy: 122 };
    var angle = (node.angle != null ? node.angle : ((seeds[groupOf(node)] || -90) + index * (360 / Math.max(total, 8)))) * Math.PI / 180;
    var stretchY = orbit === 'far' ? .78 : orbit === 'inner' ? .62 : .72;
    return { x: 50 + Math.cos(angle) * radius, y: 50 + Math.sin(angle) * radius * stretchY };
  }
  function controlPoint(pos, node) {
    var pull = celestialOf(node) === 'comet' ? .18 : .42;
    return { x: 50 + (pos.x - 50) * pull + (celestialOf(node) === 'comet' ? -9 : 0), y: 50 + (pos.y - 50) * pull + (celestialOf(node) === 'comet' ? 7 : 0) };
  }
  function relationClass(type) { return 'relation-line-' + safe(edgeType({ type: type })); }
  function setCaption() { var cap = id('stage-caption'); if (cap) cap.textContent = routeCaptions[state.route] || routeCaptions[state.filter] || routeCaptions.all; }

  function render(data) {
    var target = id('relation-nodes'), lines = id('relation-lines'), count = id('relations-count'), status = id('relations-status');
    if (!target || !lines) return;
    var nodes = visibleNodes(data), positions = {};
    target.innerHTML = nodes.map(function (node, index) {
      var pos = polarPosition(node, index, nodes.length); positions[node.id] = pos;
      var celestial = celestialOf(node), edge = edgeFor(data, node), type = edgeType(edge), tail = node.tailAngle || (pos.x < 50 ? 18 : -18), portrait = portraitOf(node), mode = displayModeOf(node);
      var portraitStyle = portrait ? ';--portrait-url:url(&quot;' + safe(portrait) + '&quot;)' : '';
      return '<button type="button" class="relation-node relation-group-' + safe(type) + ' celestial-' + safe(celestial) + (portrait && mode === 'portrait' ? ' has-portrait' : '') + '" data-node-id="' + safe(node.id) + '" data-display-mode="' + safe(mode) + '" style="--x:' + pos.x + '%;--y:' + pos.y + '%;--tail-angle:' + tail + 'deg' + portraitStyle + '" aria-label="观测' + safe(node.name) + '"><strong>' + safe(node.name) + '</strong><small>' + safe(celestialLabels[celestial] || labels[type] || type) + '</small></button>';
    }).join('');
    lines.setAttribute('viewBox', '0 0 100 100');
    lines.innerHTML = nodes.map(function (node) {
      var pos = positions[node.id], edge = edgeFor(data, node), cp = controlPoint(pos, node);
      return '<path class="relation-line ' + relationClass(edge.type) + '" data-node-line="' + safe(node.id) + '" d="M50,50 Q' + cp.x.toFixed(2) + ',' + cp.y.toFixed(2) + ' ' + pos.x.toFixed(2) + ',' + pos.y.toFixed(2) + '"></path>';
    }).join('');
    target.querySelectorAll('.relation-node').forEach(function (button) { button.addEventListener('click', function () { selectNode(data, button.dataset.nodeId); }); });
    if (count) count.textContent = nodes.length + ' / ' + Math.max(0, data.nodes.length - 1) + ' 星体';
    if (status) status.textContent = (data.purpose || '局部恒星系') + '。当前观测：' + (state.route !== 'all' ? (routeCaptions[state.route] || state.route) : (state.filter === 'all' ? '全星系' : (labels[state.filter] || state.filter))) + (state.query ? ' · 检索“' + state.query + '”' : '');
    setCaption();
    if (state.selected && (state.selected === data.center || nodes.some(function (node) { return node.id === state.selected; }))) selectNode(data, state.selected, true);
    else if (nodes.length) selectNode(data, nodes[0].id, true);
    else renderEmptyDetail();
  }

  function renderEmptyDetail() {
    var detail = id('relation-detail');
    if (detail) detail.innerHTML = '<div class="detail-placeholder"><span>∅</span><h2>没有匹配星体</h2><p>请清除检索词、切换航线，或重置星图。数据没有消失，只是当前观测层将它们隐藏了。</p></div>';
  }

  function selectNode(data, nodeId, silent) {
    var node = nodeById(data, nodeId); if (!node) return;
    state.selected = nodeId;
    var detail = id('relation-detail'), target = id('relation-nodes'), lines = id('relation-lines'), center = id('relation-center');
    var nodeEdges = edgesOf(data, node.id), type = groupOf(node), color = colors[type] || colors.center, celestial = node.id === data.center ? 'star' : celestialOf(node), portrait = portraitOf(node), mode = displayModeOf(node);
    if (target) target.querySelectorAll('.relation-node').forEach(function (item) { item.classList.toggle('is-active', item.dataset.nodeId === node.id); item.classList.toggle('is-muted', state.route !== 'all' && item.dataset.nodeId !== node.id); });
    if (lines) lines.querySelectorAll('path').forEach(function (line) { line.classList.toggle('is-active', line.getAttribute('data-node-line') === node.id); });
    if (center) center.classList.toggle('is-active', node.id === data.center);
    if (!detail) return;
    var activeYears = node.activeYears || node.years || '待补';
    var orgs = node.organizations || [];
    var events = unique((node.events || []).concat(nodeEdges.reduce(function (acc, edge) { return acc.concat(edge.events || []); }, [])));
    var sections = unique((node.sourceSections || []).concat(nodeEdges.reduce(function (acc, edge) { return acc.concat(edge.sourceSections || []); }, [])));
    detail.style.setProperty('--detail-color', color);
    var orbStyle = portrait ? ' style="--portrait-url:url(&quot;' + safe(portrait) + '&quot;)"' : '';
    detail.innerHTML = '<div class="detail-topline"><span class="detail-kicker">Celestial Archive</span><span class="detail-group">' + safe(celestialLabels[celestial] || groupLabel(data, type)) + '</span></div>' +
      '<div class="detail-celestial"><div class="detail-orb' + (portrait && mode === 'portrait' ? ' has-portrait' : '') + '" aria-hidden="true"' + orbStyle + '></div><div class="detail-name"><h2>' + safe(node.name) + '</h2><p class="detail-role">' + safe(node.role || groupLabel(data, type)) + '</p></div></div>' +
      '<p class="detail-summary">' + safe(node.summary || '人物摘要字段待补。') + '</p>' +
      '<div class="detail-block"><strong>轨道位置</strong><p><span class="detail-meta-label">Rank</span> ' + safe(node.rank || 'B') + '　<span class="detail-meta-label">Orbit</span> ' + safe(node.orbit || 'local') + '　<span class="detail-meta-label">Nebula</span> ' + safe(node.nebula || groupLabel(data, type)) + '</p><p class="detail-muted">肖像接口：portrait / visual.portrait；展示模式：displayMode / visual.displayMode = portrait 或 celestial。当前：' + safe(mode) + '</p></div>' +
      '<div class="detail-block"><strong>关系引力</strong>' + (nodeEdges.length ? nodeEdges.map(function (edge) { return '<p>' + safe(labels[edgeType(edge)] || edge.type) + '：' + safe(edge.label || '关系说明待补') + '</p>'; }).join('') : '<p>恒星节点：所有轨道从这里展开。</p>') + '</div>' +
      '<div class="detail-block"><strong>时间 / 组织 / 事件</strong><p><span class="detail-meta-label">Years</span> ' + safe(activeYears) + '</p>' + (orgs.length ? '<div class="detail-tags">' + orgs.map(function (item) { return '<span>' + safe(item) + '</span>'; }).join('') + '</div>' : '<p class="detail-muted">organizations 字段已预留。</p>') + (events.length ? '<div class="detail-tags">' + events.map(function (item) { return '<span>' + safe(item) + '</span>'; }).join('') + '</div>' : '<p class="detail-muted">events 字段已预留。</p>') + '</div>' +
      '<div class="detail-block"><strong>从这里出发</strong><div class="detail-route"><button type="button" data-jump-route="' + safe(type) + '">点亮同类星体：' + safe(groupLabel(data, type)) + '</button><button type="button" data-random-neighbor="true">随机跳转到相关人物</button></div><p class="detail-muted">相关章节：' + safe(sections.length ? sections.join('、') : 'sourceSections 字段待补') + '</p></div>';
    detail.querySelectorAll('[data-jump-route]').forEach(function (button) { button.addEventListener('click', function () { activateRoute(button.dataset.jumpRoute); }); });
    detail.querySelectorAll('[data-random-neighbor]').forEach(function (button) { button.addEventListener('click', function () { randomNode(data, nodeEdges); }); });
    if (!silent && detail.scrollIntoView && window.matchMedia('(max-width: 1180px)').matches) detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function activateRoute(route) {
    state.route = route || 'all';
    state.filter = route || 'all';
    document.querySelectorAll('.route-card').forEach(function (item) { item.classList.toggle('is-active', item.dataset.route === state.route); });
    document.querySelectorAll('[data-relation-filter]').forEach(function (item) { item.classList.toggle('is-active', item.dataset.relationFilter === state.filter || (state.route === 'all' && item.dataset.relationFilter === 'all')); });
    render(state.data);
  }
  function randomNode(data, preferredEdges) {
    var pool = preferredEdges && preferredEdges.length ? preferredEdges.map(function (edge) { return edge.source === state.selected ? edge.target : edge.source; }) : visibleNodes(data).map(function (node) { return node.id; });
    pool = pool.filter(function (nodeId) { return nodeId && nodeId !== state.selected && nodeById(data, nodeId); });
    if (!pool.length) pool = visibleNodes(data).map(function (node) { return node.id; });
    if (!pool.length) return;
    selectNode(data, pool[Math.floor(Math.random() * pool.length)]);
  }
  function bindControls() {
    document.querySelectorAll('[data-relation-filter]').forEach(function (button) { button.addEventListener('click', function () { state.filter = button.dataset.relationFilter; state.route = state.filter; document.querySelectorAll('[data-relation-filter]').forEach(function (item) { item.classList.toggle('is-active', item === button); }); document.querySelectorAll('.route-card').forEach(function (item) { item.classList.toggle('is-active', item.dataset.route === state.route); }); render(state.data); }); });
    document.querySelectorAll('.route-card').forEach(function (button) { button.addEventListener('click', function () { activateRoute(button.dataset.route); }); });
    var search = id('relations-search'); if (search) search.addEventListener('input', function () { state.query = search.value.trim(); render(state.data); });
    var reset = id('relations-reset'); if (reset) reset.addEventListener('click', function () { state.filter = 'all'; state.route = 'all'; state.query = ''; state.selected = state.data ? state.data.center : 'stalin'; if (search) search.value = ''; document.querySelectorAll('[data-relation-filter]').forEach(function (item) { item.classList.toggle('is-active', item.dataset.relationFilter === 'all'); }); document.querySelectorAll('.route-card').forEach(function (item) { item.classList.toggle('is-active', item.dataset.route === 'all'); }); document.body.classList.remove('starmap-dim'); var dim = id('relations-dim'); if (dim) dim.setAttribute('aria-pressed', 'false'); render(state.data); });
    var random = id('relations-random'); if (random) random.addEventListener('click', function () { randomNode(state.data); });
    var dim = id('relations-dim'); if (dim) dim.addEventListener('click', function () { var on = !document.body.classList.contains('starmap-dim'); document.body.classList.toggle('starmap-dim', on); dim.setAttribute('aria-pressed', on ? 'true' : 'false'); dim.classList.toggle('is-active', on); });
    var center = id('relation-center'); if (center) center.addEventListener('click', function () { if (state.data) selectNode(state.data, state.data.center); });
  }

  fetch(ROOT + 'relations.json').then(function (response) { if (!response.ok) throw new Error(response.status); return response.json(); }).then(function (data) { state.data = data; bindControls(); render(data); }).catch(function (error) { var status = id('relations-status'); if (status) status.textContent = '关系数据加载失败：' + error.message; renderEmptyDetail(); });
})();
