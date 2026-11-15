(function () {
    'use strict';
    var base = new URL('../../', document.currentScript.src), data, world, projection, path, featureNodes = [], countryNames = {};
    var svg = document.getElementById('atlasSvg'), scene = document.getElementById('atlasScene'), lands = document.getElementById('atlasLand'), markers = document.getElementById('atlasMarkers');
    var form = document.getElementById('atlasFilters'), list = document.getElementById('atlasResults'), detail = document.getElementById('atlasDetail');
    var current = { view: 'history', era: 'all', country: 'all', kind: 'all', lineage: 'all', q: '', entry: '' };
    var camera = { mode: 'flat', zoom: 1, pan: [0, 0], rotation: [-20, -12, 0], touch: false }, lastItems = [], frame = 0, searchTimer;
    var drawHooks = [];
    var mapState = { snapshot: '1976', layer: 'nature', state: '', armed: '' };
    var categories = { ideas: '纲领与理论', organization: '组织建立', revolution: '革命与国家', debate: '路线与论争', transition: '转型与挫折', present: '当代动态' };
    var forms = { armed: '涉及武装冲突', public: '公开政治与理论', transition: '和平与组织转型', uncertain: '历史／资料待更新' };
    var lineages = { maoist: '毛派／毛泽东思想', 'mao-origin': '具有毛派历史来源', communist: '其他共产主义传统', 'legacy-maoist': '毛派历史对照' };
    var colors = { ideas: '#e6ca7f', organization: '#91c7bd', revolution: '#e77776', debate: '#c5a6d8', transition: '#93b9e5', present: '#f0ad72', armed: '#e77776', public: '#91c7bd', uncertain: '#c5b7a2' };
    function node(tag, text, cls) { var n = document.createElement(tag); if (text != null) n.textContent = text; if (cls) n.className = cls; return n; }
    function snode(tag, attrs, text) { var n = document.createElementNS('http://www.w3.org/2000/svg', tag); Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); }); if (text != null) n.textContent = text; return n; }
    function getJSON(file) { return fetch(new URL(file, base), { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }); }
    function sources(refs) {
        var ul = node('ul'); refs.forEach(function (id) { var ref = data.sources[id], li = node('li'), a = node('a', ref.title); a.href = ref.url; a.target = '_blank'; a.rel = 'noopener'; li.append(a, node('span', ref.kind + ' · ' + ref.date, 'source-kind')); ul.append(li); }); return ul;
    }
    function option(select, value, label) { var o = node('option', label); o.value = value; select.append(o); }
    /* URL 仅承载 snapshot（时间点，供时间轴深链）；一切选中态（时代/国别/条目/查词）
       一律不进 URL——刷新即干净开局。旧参数在载入时整批剥除（用户的"换浏览器才能逃"
       就是被 ?country=… 复活锁死）。 */
    var URL_KEYS_LEGACY = ['view', 'era', 'country', 'kind', 'lineage', 'q', 'entry', 'state', 'armed', 'mapLayer'];
    function readURL() {
        current.view = 'history';
        ['era', 'country', 'kind', 'lineage'].forEach(function (k) { current[k] = 'all'; });
        current.q = ''; current.entry = '';
        mapState.layer = 'nature'; mapState.state = ''; mapState.armed = '';
        var p = new URLSearchParams(location.search);
        mapState.snapshot = data.camps.snapshots.some(function (s) { return s.id === p.get('snapshot'); }) ? p.get('snapshot') : data.camps.defaultSnapshot;
        /* 剥除遗留参数（含 ?snapshot 本身若为默认值），还用户一个干净 URL */
        var u = new URL(location.href);
        URL_KEYS_LEGACY.forEach(function (k) { u.searchParams.delete(k); });
        if (mapState.snapshot === data.camps.defaultSnapshot) u.searchParams.delete('snapshot');
        if (u.search !== location.search) history.replaceState(history.state, '', u.href);
    }
    function syncURL() {
        var u = new URL(location.href);
        if (mapState.snapshot && mapState.snapshot !== data.camps.defaultSnapshot) u.searchParams.set('snapshot', mapState.snapshot);
        else u.searchParams.delete('snapshot');
        URL_KEYS_LEGACY.forEach(function (k) { u.searchParams.delete(k); });
        if (u.search !== location.search) history.replaceState(history.state, '', u.href);
    }
    function populateFilters() {
        form.elements.era.replaceChildren(); option(form.elements.era, 'all', '全部时期'); data.eras.forEach(function (e) { option(form.elements.era, e.id, e.title); });
        form.elements.country.replaceChildren(); option(form.elements.country, 'all', '全部国家／地区');
        Object.entries(data.countries).forEach(function (c) { countryNames[c[0]] = c[1][0]; option(form.elements.country, c[0], c[1][0]); });
        form.elements.kind.replaceChildren(); option(form.elements.kind, 'all', '全部类别');
        Object.entries(current.view === 'history' ? categories : forms).forEach(function (e) { option(form.elements.kind, e[0], e[1]); });
        form.elements.lineage.replaceChildren(); option(form.elements.lineage, 'all', '全部思想传统'); Object.entries(lineages).forEach(function (e) { option(form.elements.lineage, e[0], e[1]); });
        ['era', 'country', 'kind', 'lineage'].forEach(function (k) { form.elements[k].value = current[k]; }); form.elements.query.value = current.q;
        document.getElementById('atlasEraLabel').hidden = current.view !== 'history'; document.getElementById('atlasLineageLabel').hidden = current.view === 'history';
        document.getElementById('atlasKindTitle').textContent = current.view === 'history' ? '事件类别' : '活动形式';
        document.querySelectorAll('[data-atlas-view]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.atlasView === current.view)); });
    }
    function filtered() {
        var items = current.view === 'history' ? data.events : data.organizations, q = current.q.toLocaleLowerCase();
        return items.filter(function (e) {
            return (current.country === 'all' || e.country === current.country) && (current.kind === 'all' || (e.category || e.form) === current.kind) &&
                (current.view !== 'history' || current.era === 'all' || e.era === current.era) && (current.view === 'history' || current.lineage === 'all' || e.lineage === current.lineage) &&
                (!q || [e.title, e.short, e.date, e.asOf, e.status, e.summary, ...(e.paragraphs || []), ...(e.keywords || []), e.history, e.position, e.limits, e.question, countryNames[e.country], e.lineage && lineages[e.lineage], ...e.sources.map(function (id) { var s = data.sources[id]; return s.title + ' ' + s.kind + ' ' + s.date; })].join(' ').toLocaleLowerCase().includes(q));
        });
    }
    function selectEntry(id, focus) {
        current.entry = id; var e = lastItems.find(function (i) { return i.id === id; }); if (!e) return;
        if (camera.mode === 'globe') { var c = data.countries[e.country][2]; camera.rotation = [-c[0], -c[1], 0]; }
        syncURL(); renderDetail(e); list.querySelectorAll('.atlas-record').forEach(function (card) { card.classList.toggle('selected', card.id === id); if (card.id === id) card.querySelector('details').open = true; }); drawMap();
        if (focus) { var h = detail.querySelector('h3'); h.tabIndex = -1; h.focus({ preventScroll: true }); detail.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
    }
    function renderDetail(e) {
        var insetPanel = document.getElementById('chinaInset');
        detail.replaceChildren(); var kicker = node('p', current.view === 'history' ? e.date : e.short + ' · ' + e.asOf, 'atlas-kicker'), h = node('h3', e.title);
        detail.append(kicker, h, node('p', countryNames[e.country] + ' · ' + (categories[e.category] || forms[e.form])), node('p', e.summary));
        if (e.status) detail.append(node('p', e.status)); else detail.append(node('p', e.paragraphs[0]));
        var open = node('button', '查看完整条目与来源 ↓'); open.type = 'button'; open.addEventListener('click', function () { var card = document.getElementById(e.id); if (!card) return; card.querySelector('details').open = true; card.scrollIntoView({ behavior: 'smooth', block: 'start' }); var heading = card.querySelector('h3'); heading.tabIndex = -1; heading.focus({ preventScroll: true }); }); detail.append(open);
        var ref = node('p'), a = node('a', '核对资料：' + data.sources[e.sources[0]].title); a.href = data.sources[e.sources[0]].url; a.target = '_blank'; a.rel = 'noopener'; ref.append(a); detail.append(ref);
        /* 南海附图随中国条目保留在详情内容流末尾（铁律 9：仅选中中国时出现） */
        if (e.country === 'CHN' && insetPanel) detail.append(insetPanel);
    }
    function resetDetail() {
        detail.replaceChildren(node('p', '一张地图，两条阅读线索', 'atlas-kicker'), node('h3', '从地点进入历史，从名称辨认组织'), node('p', '点击国别标点，筛选相关条目；再展开正文，阅读背景、争点与出处。图上的数字仅表示当前收录条目数。'), node('p', '历史事件用现代参考底图定位。当代组织仅作国别示意，不表示驻地、势力范围或武装控制区。'));
    }
    function renderRecords() {
        lastItems = filtered(); list.replaceChildren(); var isHistory = current.view === 'history';
        lastItems.forEach(function (e) {
            var article = node('article', null, 'atlas-record'); article.id = e.id; article.classList.toggle('selected', e.id === current.entry);
            var header = node('header'); header.append(node('span', isHistory ? e.date : e.short, 'record-date'), node('span', countryNames[e.country], 'record-country'));
            article.append(header, node('h3', e.title), node('p', e.summary));
            if (!isHistory) article.append(node('p', lineages[e.lineage] + ' · ' + forms[e.form], 'record-country'), node('p', e.status + ' · 证据截至 ' + e.asOf, 'record-status'));
            var select = node('button', '在地图中查看 →'); select.type = 'button'; select.addEventListener('click', function () { selectEntry(e.id, true); }); article.append(select);
            var details = node('details'); details.append(node('summary', isHistory ? '展开历史背景、问题与来源' : '展开组织沿革、主张与资料说明'));
            if (isHistory) { e.paragraphs.forEach(function (p) { details.append(node('p', p)); }); details.append(node('h4', '继续思考'), node('p', e.question)); }
            else [['组织沿革', e.history], ['思想与政治形式', e.position], ['资料边界', e.limits]].forEach(function (p) { details.append(node('h4', p[0]), node('p', p[1])); });
            details.append(node('h4', '核对来源'), sources(e.sources)); var share = node('a', '本条永久链接'); var u = new URL(location.pathname, location.origin); u.searchParams.set('view', current.view); u.searchParams.set('entry', e.id); share.href = u.pathname + u.search; details.append(share);
            if (e.id === 'nine-comments') { var p = node('p'), a = node('a', '原始文献：中苏论战资料目录 ↗'); a.href = 'https://www.marxists.org/chinese/reference-books/sino-soviet-debate/index.htm'; a.target='_blank'; a.rel='noopener'; p.append(a); details.append(p); }
            details.open = e.id === current.entry; article.append(details); list.append(article);
        });
        document.getElementById('atlasEmpty').hidden = lastItems.length > 0;
        document.getElementById('atlasResultsStatus').textContent = '当前显示 ' + lastItems.length + ' / ' + (isHistory ? data.events.length + ' 个历史节点' : data.organizations.length + ' 条组织资料') + '。' + (isHistory ? '点击“展开”阅读背景与问题。' : '活动形式与最近证据日期分别列明；不是完整名册或规模排名。');
        var active = lastItems.find(function (e) { return e.id === current.entry; }); if (active) renderDetail(active); else resetDetail();
        drawLegend(); drawMap(); syncURL();
    }
    function drawLegend() {
        var ul = document.getElementById('atlasLegend'); ul.replaceChildren(); Object.entries(current.view === 'history' ? categories : forms).concat([['mixed', '含多种类别']]).forEach(function (c) { var li = node('li'), dot = node('i'); dot.style.setProperty('--dot', colors[c[0]] || '#e2e2d4'); li.append(dot, document.createTextNode(c[1])); ul.append(li); });
    }
    function groups() {
        var groups = new Map(); lastItems.forEach(function (e) { if (!groups.has(e.country)) groups.set(e.country, []); groups.get(e.country).push(e); }); return groups;
    }
    function snapshot() { return data && data.camps.snapshots.find(function (s) { return s.id === mapState.snapshot; }); }
    function campSources(ids) { var ul = node('ul'); ids.forEach(function (id) { var ref = data.camps.sources[id]; if (!ref) return; var li = node('li'), a = node('a', ref.title); a.href = ref.url; a.target = '_blank'; a.rel = 'noopener'; li.append(a, node('span', ref.kind + ' · ' + ref.date, 'source-kind')); ul.append(li); }); return ul; }
    function countryName(id) { var f = world && world.features.find(function (f) { return f.id === id; }); return f ? f.properties.name : id; }
    function federation(id) { var s = snapshot(); if (!s) return null; var key = s.federations.find(function (k) { var f = data.camps.federations[k]; return (f.parts || f.members).includes(id); }); return key ? { ...data.camps.federations[key], id: key } : null; }
    function socialist(id) { var s = snapshot(); return s && data.camps.states.some(function (st) { return s.activeStates.includes(st.id) && st.kind !== 'orientation' && st.geography.includes(id); }); }
    function palette() { return mapState.layer === 'camps' ? data.camps.colors : data.camps.natureColors; }
    function countryCamp(id) { var s = snapshot(); return (mapState.layer === 'camps' ? s.members : s.nature)[id] || 'other'; }
    function chinaRed() { var s=snapshot(); return Number(s?s.date.slice(0,4):mapState.snapshot.slice(0,4))>=1949; }
    function countryFill(id) { var s=snapshot(), camp=s?countryCamp(id):'other'; return id==='CHN' && chinaRed() ? '#df444a' : mapState.layer==='neutral'||!s?'#607982':camp==='mixed'?'url(#atlasMixedPattern)':palette()[camp].color; }
    function republicName(id) {
        var c = data.camps.capitals[id], f = federation(id); if (!c || !f) return countryName(id);
        if (f.id === 'ussr1925') { var names = { GEO: '外高加索苏维埃联邦社会主义共和国', ARM: '亚美尼亚（属外高加索联邦）', AZE: '阿塞拜疆（属外高加索联邦）', KAZ: '哈萨克自治地区（属俄罗斯联邦）', KGZ: '吉尔吉斯自治地区（属俄罗斯联邦）', TJK: '塔吉克自治共和国（属乌兹别克）' }; if (names[id]) return names[id]; }
        var title = c[0]; if (+mapState.snapshot < 1963 && f.id === 'yugoslavia') title = title.replace('社会主义共和国', '人民共和国'); return title;
    }
    function showStateDetail() {
        if (!world || !data || !mapState.state) return;
        var id = mapState.state, f = world.features.find(function (f) { return f.id === id; }); if (!f) return;
        var insetPanel = document.getElementById('chinaInset');
        var s = snapshot(), fed = federation(id), camp = palette()[countryCamp(id)];
        detail.replaceChildren(node('p', s.date + ' · 国家与联邦资料', 'atlas-kicker'), node('h3', fed ? fed.title + ' · ' + republicName(id) : f.properties.name), node('p', id==='CHN'&&chinaRed()?'地图底色：中国1949年起固定红色；以下列出历史记录。':'历史分类：' + camp.name));
        var states = data.camps.states.filter(function (st) { return s.activeStates.includes(st.id) && st.geography.includes(id); }); states.forEach(function (st) { detail.append(node('h4', st.title), node('p', st.note)); var a = node('a', '本条历史出处 ↗'); a.href = st.url; a.target = '_blank'; a.rel = 'noopener'; detail.append(a); });
        if (states.some(function (st) { return s.uncertainStates.includes(st.id); })) detail.append(node('p', '转型日期待核：当前截面处于此条仅记录到年份的结束年末，不能确认当天仍属原阶段，因此采用斜纹，不继续涂作已确认的同一性质。'));
        if (['construction', 'revision'].includes(countryCamp(id))) detail.append(node('p', s.routeNote));
        if (id === 'CHN') detail.append(node('p', '大陆、台湾、西沙、南沙及其他中国南海群岛均归入中国区域。藏南等边界依据官方底图；中国1949年及以后固定红色是本站显示约定，历史路线资料保留原记录。群岛与范围线不代表实际控制范围。'));
        if (id === 'DEU' && s.members.DEU === 'mixed') detail.append(node('p', '本阶段德国分治：西德1955年加入北约，东德加入华约。斜纹表示现代德国地理单元内存在两种归属，不是实际两德国界。'));
        if (id === 'VNM' && s.members.VNM === 'mixed') detail.append(node('p', '本阶段越南分治；北越与南越不能按全境同一政权处理。这里保留现代越南地理单元，用斜纹标记，不伪绘历史分界。'));
        if (fed) { detail.append(node('p', fed.note)); var ul = node('ul'); fed.members.forEach(function (c) { var li = node('li'), b = node('button', republicName(c)); b.type = 'button'; b.addEventListener('click', function () { chooseState(c, false); }); li.append(b); ul.append(li); }); detail.append(ul); }
        if (socialist(id)) {
            if (camera.zoom < 1.8) detail.append(node('p', '已选中。用滚轮放大至180%，或点击下方按钮，即可显示本国／各加盟共和国的首都。'));
            var b = node('button', '放大查看首都'); b.type = 'button'; b.addEventListener('click', function () { chooseState(id, true); }); detail.append(b);
            if (camera.zoom >= 1.8) { var capitals = node('ul'); (fed ? fed.members : [id]).forEach(function (c) { var cap = capital(c); if (cap) capitals.append(node('li', republicName(c) + ' · ' + cap[1])); }); if (fed && fed.id === 'ussr' && +s.id <= 1955) capitals.append(node('li', '卡累利阿—芬兰苏维埃社会主义共和国 · 彼得罗扎沃茨克（边界未复原）')); detail.append(capitals); }
        }
        var clear = node('button', '取消国家选择'); clear.type = 'button'; clear.addEventListener('click', function () { mapState.state = ''; document.getElementById('atlasState').value = ''; resetDetail(); drawMap(); syncURL(); }); detail.append(clear, campSources(fed ? fed.sources : s.sources));
        /* 南海附图仅在选中中国时保留在详情内容流末尾（铁律 9） */
        if (id === 'CHN' && insetPanel) detail.append(insetPanel);
    }
    function chooseState(id, enlarge) {
        if (!world || !world.features.some(function (f) { return f.id === id; })) return;
        mapState.state = id; document.getElementById('atlasState').value = id;
        if (enlarge) { var cap = capital(id), center = cap && projectSymbol([cap[2], cap[3]]); if (!center) center = nativeCenter(id); var p = projection(center); camera.zoom = Math.max(2.5, camera.zoom); camera.pan = [(500 - p[0]) * camera.zoom, (280 - p[1]) * camera.zoom]; }
        drawMap(); showStateDetail(); syncURL();
    }
    function nativeCenter(id) {
        var f = world.features.find(function (f) { return f.id === id; }); if (!f) return null;
        var g = f.geometry, polygons = g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates];
        var largest = polygons.slice().sort(function (a, b) { return Math.abs(planarArea(b[0])) - Math.abs(planarArea(a[0])); })[0];
        return window.d3.geoPath().centroid({ type: 'Polygon', coordinates: largest });
    }
    function planarArea(ring) { return ring.reduce(function (sum, p, i) { var next = ring[(i + 1) % ring.length]; return sum + p[0] * next[1] - next[0] * p[1]; }, 0); }
    function projectSymbol(coords) {
        if (!world || !world.symbolGrid) return null; var lon = coords[0]; if (lon < 0) lon += 360; var lat = Math.max(-75, Math.min(75, coords[1]));
        var left = Math.floor(lon / 30) * 30, bottom = Math.min(60, Math.floor(lat / 15) * 15), fx = (lon - left) / 30, fy = (lat - bottom) / 15;
        function at(x, y) { return world.symbolGrid[(x > 180 ? x - 360 : x) + ',' + y]; }
        var a = at(left, bottom), b = at(left + 30, bottom), c = at(left, bottom + 15), d = at(left + 30, bottom + 15); if (!a || !b || !c || !d) return null;
        return [0, 1].map(function (i) { return a[i] * (1 - fx) * (1 - fy) + b[i] * fx * (1 - fy) + c[i] * (1 - fx) * fy + d[i] * fx * fy; });
    }
    function capital(id) {
        if (id === 'KARELIA') return ['卡累利阿—芬兰苏维埃社会主义共和国', '彼得罗扎沃茨克', 34.35, 61.78];
        if (id === 'SOUTH_VIETNAM') return ['越南南方共和国', '西贡（今胡志明市）', 106.7, 10.78];
        var a = data.camps.capitals[id]; if (!a) return null; a = a.slice();
        if (id === 'TJK' && snapshot().date < '1961-01-01') a[1] = '斯大林纳巴德（今杜尚别）';
        if (id === 'RUS' && snapshot().date < '1918-03-12') a = ['苏维埃俄国', '彼得格勒（今圣彼得堡）', 30.34, 59.94];
        if (id === 'CHN' && snapshot().activeStates.includes('chinese-soviet')) a = ['中华苏维埃共和国', '保安（今志丹县，1936年政府驻地）', 108.77, 36.82];
        if (id === 'DEU' && snapshot().activeStates.includes('bremen')) a = ['不来梅苏维埃共和国', '不来梅', 8.8, 53.08];
        if (id === 'DEU' && snapshot().activeStates.includes('bavaria')) a = ['巴伐利亚苏维埃共和国', '慕尼黑', 11.58, 48.14];
        if (id === 'SVK' && snapshot().activeStates.includes('slovakia-1919')) a = ['斯洛伐克苏维埃共和国', '普雷绍夫', 21.24, 49];
        if (id === 'PRK' && snapshot().date < '1972-12-27') a[1] = '平壤（政府驻地；旧宪法称首都为汉城）';
        if (['CZE', 'SVK'].includes(id) && snapshot().date >= '1948-02-25' && snapshot().date < '1969-01-01') a = ['捷克斯洛伐克', '布拉格', 14.42, 50.08];
        return a;
    }
    function renderCampControls() {
        if (!data) return;
        var select = document.getElementById('atlasSnapshot'); select.replaceChildren(); data.camps.snapshots.forEach(function (s) { option(select, s.id, s.date + ' · ' + s.title); }); select.value = mapState.snapshot;
        document.getElementById('atlasColorLayer').value = mapState.layer; document.getElementById('atlasArmedArea').value = mapState.armed;
        var countries = document.getElementById('atlasState'); countries.replaceChildren(); option(countries, '', '请选择国家／加盟共和国');
        if (world) world.features.slice().sort(function (a, b) { return a.properties.name.localeCompare(b.properties.name, 'zh-CN'); }).forEach(function (f) { option(countries, f.id, republicName(f.id)); });
        if (world && !world.features.some(function (f) { return f.id === mapState.state; })) mapState.state = '';
        countries.value = mapState.state; document.getElementById('atlasCampControls').inert = false;
        var s = snapshot(); document.getElementById('atlasSnapshotNote').textContent = '历史截面：' + s.date + '。' + s.notes + ' 中国：1949年起固定红色（显示约定，含台湾、西沙、南沙）；历史记录不随底色改写。';
        document.getElementById('atlasFallback').src=new URL('assets/international/world-'+(chinaRed()?'china-red':'neutral')+'.svg',base);
        var legend = document.getElementById('atlasCampLegend'); legend.replaceChildren(node('li', '国家底色：'));
        legend.hidden = false;
        var chinaRule=node('li','中国：1949年起固定红色（含南海诸岛）','china-rule'); legend.append(chinaRule);
        Object.entries(palette()).forEach(function (c) { var li = node('li'), dot = node('i'); dot.style.setProperty('--dot', c[1].color); li.append(dot, document.createTextNode(c[1].name)); legend.append(li); });
        var directory = document.getElementById('atlasCampDirectory'); directory.replaceChildren(node('p', s.date + ' · ' + s.notes));
        Object.entries(palette()).filter(function (c) { return c[0] !== 'other'; }).forEach(function (c) { var box = node('section'); box.append(node('h3', c[1].name)); var ul = node('ul'); Object.entries(mapState.layer === 'camps' ? s.members : s.nature).filter(function (m) { return m[1] === c[0]; }).forEach(function (m) { var li = node('li'), b = node('button', republicName(m[0])); b.type = 'button'; b.addEventListener('click', function () { chooseState(m[0], false); }); li.append(b); ul.append(li); }); if (!ul.children.length) ul.append(node('li', '此截面没有收录成员')); box.append(ul); directory.append(box); });
        directory.append(node('p', s.routeNote));
        directory.append(node('p', '底色采用制度与条约归属口径；“社会主义”自称、实际社会关系和本站反修判断须分别辨析。中国与苏联的路线阶段见分期说明，不以政党名称替代社会性质论证。'), campSources(s.sources));
        var armedNotes = document.getElementById('atlasArmedNotes'); armedNotes.hidden = !mapState.armed; armedNotes.replaceChildren();
        if (mapState.armed) { var area = data.camps.armedAreas[0]; armedNotes.append(node('h3', area.title), node('p', area.note), node('p', '橙色斜线：受影响县所在邦的行政外框，非武装控制边界。涉及：' + area.states.join('、') + '。'), campSources([area.source]), node('p', '菲律宾、土耳其等组织的实际控制边界未取得可核对底本，暂不绘制控制线；可在下方组织资料查看已核实的历史与状态。')); }
    }
    function drawCampExtras(scale) {
        var capitals = document.getElementById('atlasCapitals'); capitals.replaceChildren(); var s = snapshot(); if (!s) return;
        if (mapState.state && socialist(mapState.state) && camera.zoom >= 1.8) {
            var fed = federation(mapState.state), ids = (fed ? fed.members : [mapState.state]).slice(); var labels = [];
            if (fed && fed.id === 'ussr' && s.date <= '1956-07-15') ids.push('KARELIA');
            if (mapState.state === 'VNM' && s.activeStates.includes('south-vietnam-prg')) ids.push('SOUTH_VIETNAM');
            ids.forEach(function (id, index) { var cap = capital(id); if (!cap) return; var xy = projectSymbol([cap[2], cap[3]]); if (!xy) return; var p = projection(xy), g = snode('g', { class: 'atlas-capital', 'data-state': id });
                var short = id === 'KARELIA' ? '卡累利阿—芬兰' : id === 'SOUTH_VIETNAM' ? '越南南方共和国' : fed && fed.id === 'ussr1925' && id === 'GEO' ? '外高加索联邦' : ['CZE', 'SVK'].includes(id) && s.date < '1969-01-01' ? '捷克斯洛伐克' : countryName(id);
                var label = short + ' · ' + cap[1], x = p[0] + 7 / scale, y = p[1] - 7 / scale;
                while (labels.some(function (a) { return Math.abs(a[1] - y) < 17 / scale && Math.abs(a[0] - x) < 160 / scale; })) y -= 19 / scale;
                labels.push([x, y]); g.append(snode('title', {}, label + '（首都位置示意）'), snode('line', { x1: p[0], y1: p[1], x2: x, y2: y, stroke: '#fff0b4', 'stroke-width': 0.7 / scale }), snode('circle', { cx: p[0], cy: p[1], r: 3.8 / scale, fill: '#ffe18a', stroke: '#152c3e', 'stroke-width': 1 / scale }), snode('text', { x: x, y: y, style: 'font-size:' + 12 / scale + 'px' }, label)); capitals.append(g);
            });
        }
        var areas = document.getElementById('atlasArmedShapes'); areas.replaceChildren();
        if (mapState.armed && world.armedAreas) world.armedAreas.forEach(function (a) { var p = snode('path', { d: path(a), class: 'atlas-armed-area', 'clip-path': 'url(#atlasIndiaClip)' }); p.append(snode('title', {}, a.properties.name + ' · 2024年受影响县所在邦；非全邦控制区')); areas.append(p); });
    }
    function drawChinaIslands(scale) {
        if(!world.chineseIslands)return;
        var layer=document.getElementById('atlasChinaLabels');if(!layer){layer=snode('g',{id:'atlasChinaLabels'});scene.append(layer);}layer.replaceChildren();
        if(camera.zoom>=1.8)world.chineseIslands.groups.forEach(function(group){var xy=projection(projectSymbol(group.center));var g=snode('g',{tabindex:'0',role:'button','aria-label':group.name+'，选择中国','data-owner':'CHN'});g.append(snode('circle',{cx:xy[0],cy:xy[1],r:3/scale,fill:countryFill('CHN'),stroke:'#ffe08c','stroke-width':1/scale}),snode('text',{x:xy[0]+6/scale,y:xy[1]-5/scale,fill:'#ffe9b1',style:'font-size:'+11/scale+'px;paint-order:stroke;stroke:#102d3f;stroke-width:'+3/scale+'px'},group.name));g.addEventListener('click',function(){chooseState('CHN',false);});g.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();chooseState('CHN',false);}});layer.append(g);});
        var panel=document.getElementById('chinaInset');if(!panel){panel=node('section',null,'china-inset');panel.id='chinaInset';panel.append(node('h3','南海诸岛 · 中国'));var canvas=snode('svg',{id:'chinaInsetSvg',viewBox:'0 0 440 360',role:'group','aria-label':'中国南海诸岛附图，西沙和南沙等群岛均归入中国'});panel.append(canvas,node('p','岛屿陆地符号与归属范围线分别取自官方底图；群岛名称标注为位置示意。中国1949年起固定红色，海域不作陆地填色。'));var fit=node('button','查看中国及南海诸岛');fit.type='button';fit.addEventListener('click',function(){var bounds=path.bounds(world.features.find(function(f){return f.id==='CHN';})),cx=(bounds[0][0]+bounds[1][0])/2,cy=(bounds[0][1]+bounds[1][1])/2;camera.zoom=Math.min(4,Math.max(1.8,Math.min(860/(bounds[1][0]-bounds[0][0]),440/(bounds[1][1]-bounds[0][1]))));camera.pan=[(500-cx)*camera.zoom,(280-cy)*camera.zoom];chooseState('CHN',false);});panel.append(fit);document.getElementById('atlasMapStatus').after(panel);}
        var inset=document.getElementById('chinaInsetSvg');inset.replaceChildren();
        var geo=world.chineseIslands.land,extent={type:'FeatureCollection',features:[geo,{type:'Feature',properties:{},geometry:{type:'MultiPoint',coordinates:world.chineseIslands.groups.map(function(g){return projectSymbol(g.center);})}}]},ip=window.d3.geoIdentity().reflectY(true).fitExtent([[45,45],[350,325]],extent),pp=window.d3.geoPath(ip).digits(2).pointRadius(.55);
        inset.append(snode('defs',{}));var clip=snode('clipPath',{id:'chinaInsetClip'});clip.append(snode('rect',{x:0,y:0,width:440,height:360}));inset.querySelector('defs').append(clip);
        var shapes=snode('g',{'clip-path':'url(#chinaInsetClip)'});shapes.append(snode('path',{d:pp(world.features.find(function(f){return f.id==='CHN';})),fill:countryFill('CHN'),stroke:'#ecd08a','stroke-width':.6,'data-owner':'CHN','data-role':'island-land'}));
        var range=world.boundaries.find(function(b){return b.name==='南海诸岛归属范围线';});if(range)shapes.append(snode('path',{d:pp(range.geometry),fill:'none',stroke:'#cbd9d6','stroke-width':1,'stroke-dasharray':'4 3'}));inset.append(shapes);
        world.chineseIslands.groups.forEach(function(group,i){var p=ip(projectSymbol(group.center)),x=Math.max(12,Math.min(300,p[0]+8)),y=Math.max(20,Math.min(340,p[1]+(i===2?16:-10))),g=snode('g',{role:'button',tabindex:'0','aria-label':group.name+'，选择中国','data-group':group.id,'data-owner':'CHN'});g.append(snode('circle',{cx:p[0],cy:p[1],r:4,fill:countryFill('CHN'),stroke:'#ffdc82','data-island-group':group.id}),snode('text',{x:x,y:y},group.name));var activate=function(){chooseState('CHN',false);};g.addEventListener('click',activate);g.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}});inset.append(g);});
    }
    /* ============ HOI4 式横向环绕（BUG-6） ============
       世界坐标已平面化（等差分纬线投影，中心经线 150°E，切割线 30°W 同现左右缘）。
       陆地/界线/标点等以"陆地宽度"为周期向 ±1 个世界宽度克隆；经纬网以自身宽度为周期
       单独成层——两组周期各自首尾相接，赤道处陆地无缝续接。相机 pan.x 对周期取模归一，
       越过东西边界后从另一侧丝滑续接；上下不环绕。 */
    var wrapL, wrapR, wrapDynL, wrapDynR, wrapWidth = 0, lastSig = '';
    /* 归一周期必须 = 副本在 pan 单位下的间距 W×zoom：
       副本挂在 scale(zoom) 的场景内，屏上间距是 W×zoom 而非 W——
       按裸 W 归一会在每次越界时露出 W×(zoom−1) 的内容缺口。
       公式：先加 half 再取模，保证 [-half, half) 内的值恒等不跳
       （(x%P+P)%P-half 的写法会把 [-half,0) 区间整体抬 +half——抖动元凶） */
    function normalizePanX() {
        if (!wrapWidth) return;
        var period = wrapWidth * camera.zoom;
        var half = period / 2;
        camera.pan[0] = ((camera.pan[0] + half) % period + period) % period - half;
    }
    /* 最小缩放：视口恰好装下一份完整世界（"两个全景图"的根治）。
       可视 viewBox 尺寸由 slice 比例反推；宽、高两个覆盖条件取大者。 */
    function minZoom() {
        if (!wrapWidth || !svg) return 0.8;
        var r = svg.getBoundingClientRect();
        var s = Math.max(r.width / 1000, r.height / 560) || 1;
        var visW = r.width / s, visH = r.height / s;
        return Math.max(visW / wrapWidth, visH / 536, 0.5);
    }
    /* 纯相机更新：拖拽/惯性期间逐事件同步执行（不过 rAF），
       只有 transform 与归一化参与——内容重建仍走 drawMap 的 sig 缓存。 */
    function updateCameraOnly() {
        if (!world || !window.d3) return;
        normalizePanX();
        scene.setAttribute('transform', 'translate(' + (500 + camera.pan[0]) + ',' + (280 + camera.pan[1]) + ') scale(' + camera.zoom + ') translate(-500,-280)');
        drawHooks.forEach(function (fn) { try { fn(); } catch (e) { window.__hookErr = String(e && e.message || e); } });
    }
    function cloneInteractive(c, src) {
        /* 副本交互重绑：cloneNode 不复制 listener；tabindex 只保留在主世界 */
        c.removeAttribute('tabindex');
        if (src.classList && src.classList.contains('atlas-land') && c.dataset.state) {
            c.addEventListener('click', function () { if (Date.now() - lastDraggedAt < 250 || !data) return; chooseState(c.dataset.state, false); });
        } else if (src.__activate) {
            c.addEventListener('click', src.__activate);
            c.addEventListener('keydown', src.__keyactivate || function () { });
        }
        return c;
    }
    function buildWraps() {
        wrapL = document.getElementById('atlasWrapL'); wrapR = document.getElementById('atlasWrapR');
        wrapDynL = document.getElementById('atlasWrapDynL'); wrapDynR = document.getElementById('atlasWrapDynR');
        if (!wrapL || !wrapR || !window.d3) return;
        var landBounds = window.d3.geoPath(projection).bounds({ type: 'FeatureCollection', features: world.features });
        wrapWidth = landBounds[1][0] - landBounds[0][0];
        var gratBounds = window.d3.geoPath(projection).bounds(world.graticule);
        var gratWidth = gratBounds[1][0] - gratBounds[0][0];
        [wrapL, wrapR].forEach(function (wrap, side) {
            var dir = side === 0 ? -1 : 1;
            wrap.innerHTML = '';
            /* 静态层：陆地 + 官方界线 + 武装叠加（周期 = 陆地宽度），载入后克隆一次 */
            var stat = snode('g', { transform: 'translate(' + (dir * wrapWidth) + ',0)' });
            var landSrc = document.getElementById('atlasLand');
            Array.prototype.slice.call(landSrc.children).forEach(function (n) {
                var c = cloneInteractive(n.cloneNode(true), n);
                stat.append(c);
                var f = featureNodes.find(function (x) { return x.node === n; });
                if (f) f[side === 0 ? 'cloneL' : 'cloneR'] = c;
            });
            var bSrc = document.getElementById('atlasBoundaries');
            Array.prototype.slice.call(bSrc.children).forEach(function (n) { stat.append(n.cloneNode(true)); });
            var aSrc = document.getElementById('atlasArmedShapes');
            Array.prototype.slice.call(aSrc.children).forEach(function (n) { stat.append(n.cloneNode(true)); });
            wrap.append(stat);
            /* 动态层容器：标点/首都/南海标注随全量重绘重建 */
            var dyn = snode('g', { transform: 'translate(' + (dir * wrapWidth) + ',0)' });
            if (side === 0) wrapDynL = dyn; else wrapDynR = dyn;
            wrap.append(dyn);
            /* 经纬网：以自身宽度为周期，单独成层首尾相接 */
            var gr = document.getElementById('atlasGraticule');
            if (gr && gr.getAttribute('d')) {
                var g2 = snode('g', { transform: 'translate(' + (dir * gratWidth) + ',0)' });
                g2.append(gr.cloneNode(false));
                wrap.append(g2);
            }
        });
    }
    function syncDynamicWraps() {
        if (!wrapDynL || !wrapDynR) return;
        [wrapDynL, wrapDynR].forEach(function (dyn) {
            dyn.replaceChildren();
            ['atlasMarkers', 'atlasCapitals', 'atlasChinaLabels'].forEach(function (id) {
                var src = document.getElementById(id); if (!src) return;
                Array.prototype.slice.call(src.children).forEach(function (n) { dyn.append(cloneInteractive(n.cloneNode(true), n)); });
            });
        });
    }
    function drawMap(full) {
        if (!world || !window.d3) return;
        var d3 = window.d3, globe = false;
        projection = d3.geoIdentity().reflectY(true).fitExtent([[22, 12], [978, 548]], world.frame);
        path = d3.geoPath(projection).digits(2).pointRadius(0.55); var grouped = groups();
        normalizePanX();
        if (full && camera.zoom < minZoom()) camera.zoom = minZoom();   /* 窗口变宽后仍只显一份世界 */
        scene.setAttribute('transform', globe ? '' : 'translate(' + (500 + camera.pan[0]) + ',' + (280 + camera.pan[1]) + ') scale(' + camera.zoom + ') translate(-500,-280)');
        var graticuleEl = document.getElementById('atlasGraticule');
        if (graticuleEl && !graticuleEl.getAttribute('d')) graticuleEl.setAttribute('d', path(world.graticule));
        /* 纯相机位移（pan/resize 之外的 zoom 不变）只更新 transform 与钩子，跳过内容重建 */
        var sig = [camera.zoom, mapState.snapshot, mapState.layer, mapState.state, current.entry, current.view, mapState.armed].join('|');
        if (!full && sig === lastSig) { drawHooks.forEach(function (fn) { try { fn(); } catch (e) { window.__hookErr = String(e && e.message || e); } }); return; }
        lastSig = sig;
        var s = snapshot(); featureNodes.forEach(function (f) {
            if (!f.node.hasAttribute('d')) f.node.setAttribute('d', path(f.feature) || '');
            var camp = s ? countryCamp(f.feature.id) : 'other'; f.node.dataset.camp = camp;
            var fill = countryFill(f.feature.id);
            f.node.style.fill = fill;
            f.node.dataset.displayPolicy=f.feature.id==='CHN'&&chinaRed()?'china-red-from-1949':'historical';
            var fed = federation(mapState.state);
            var related = grouped.has(f.feature.id), sel = f.feature.id === mapState.state || !!(fed && (fed.parts || fed.members).includes(f.feature.id));
            f.node.classList.toggle('related', related); f.node.classList.toggle('state-selected', sel);
            var tip = f.feature.properties.name + (s ? ' · ' + s.date + ' · ' + palette()[camp].name : '');
            f.node.querySelector('title').textContent = tip;
            [f.cloneL, f.cloneR].forEach(function (c) {
                if (!c) return;
                c.style.fill = fill; c.dataset.camp = camp;
                c.classList.toggle('related', related); c.classList.toggle('state-selected', sel);
                var t = c.querySelector('title'); if (t) t.textContent = tip;
            });
        });
        var boundary = document.getElementById('atlasBoundaries'); if (!boundary.children.length) world.boundaries.forEach(function (b) { var p = snode('path', { d: path(b.geometry), class: 'atlas-official-boundary' + (/未定|停火|归属/.test(b.name) ? ' unsettled' : '') }); p.append(snode('title', {}, b.name)); boundary.append(p); });
        document.getElementById('atlasIndiaClipPath').setAttribute('d', path(world.features.find(function (f) { return f.id === 'IND'; })));
        markers.replaceChildren(); var visible = 0, placed = [], ctmM = svg.getScreenCTM(), mapScale = Math.max(0.25, ctmM && ctmM.a ? ctmM.a : svg.getBoundingClientRect().width / 1000), scale = mapScale * (globe ? 1 : camera.zoom), radius = 12 / scale;
        grouped.forEach(function (items, country) {
            var coords = data.countries[country][2]; if (globe && d3.geoDistance(coords, [-camera.rotation[0], -camera.rotation[1]]) >= Math.PI / 2 - 0.01) return;
            var native = nativeCenter(country); if (!native) return; var p = projection(native); if (!p || !p.every(Number.isFinite)) return; visible++;
            var original = p.slice(), collision = function (xy) { return placed.some(function (a) { return Math.hypot(a[0] - xy[0], a[1] - xy[1]) < radius * 2.2; }); };
            for (var attempt = 0; collision(p) && attempt < 100; attempt++) { var angle = attempt * 2.39996, distance = radius * (1.2 + Math.sqrt(attempt) * 0.65); p = [original[0] + Math.cos(angle) * distance, original[1] + Math.sin(angle) * distance]; }
            placed.push(p);
            if (Math.hypot(p[0] - original[0], p[1] - original[1]) > 1) { markers.append(snode('line', { x1: original[0], y1: original[1], x2: p[0], y2: p[1], stroke: '#bed1d4', 'stroke-width': 0.8 / scale, 'pointer-events': 'none' }), snode('circle', { cx: original[0], cy: original[1], r: 2 / scale, fill: '#e3e9dc', 'pointer-events': 'none' })); }
            var selected = items.some(function (e) { return e.id === current.entry; }), primary = items.find(function (e) { return e.id === current.entry; }) || items[0];
            var g = snode('g', { class: 'atlas-marker' + (selected ? ' selected' : ''), transform: 'translate(' + p[0] + ',' + p[1] + ')', tabindex: '0', role: 'button', 'aria-label': countryNames[country] + '，' + items.length + '条，点击筛选', 'data-country': country });
            var types = new Set(items.map(function (e) { return e.category || e.form; }));
            var label = snode('text', { 'text-anchor': 'middle', dy: '.35em', style: 'font-size:' + (11 / scale) + 'px' }, String(items.length));
            g.append(snode('title', {}, countryNames[country] + ' · ' + items.length + '条'), snode('circle', { r: radius, fill: selected || types.size === 1 ? colors[primary.category || primary.form] : '#e2e2d4' }), label);
            var activate = function () {
                /* 再点已选中国家的标点 = 退出该国（地图上的直接退路） */
                if (current.country === country && current.entry) {
                    current.country = 'all'; current.entry = '';
                    form.elements.country.value = 'all';
                    renderRecords();
                    return;
                }
                current.country = country; current.entry = primary.id; form.elements.country.value = country; renderRecords(); var h = detail.querySelector('h3'); h.tabIndex = -1; h.focus({ preventScroll: true });
            };
            var keyactivate = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); } };
            g.addEventListener('click', activate); g.addEventListener('keydown', keyactivate);
            g.__activate = activate; g.__keyactivate = keyactivate;
            markers.append(g);
        });
        drawCampExtras(scale); drawChinaIslands(scale); if (mapState.state) showStateDetail();
        document.getElementById('atlasMapStatus').textContent = '官方平面底图 · ' + (s ? s.date + ' · ' : '') + visible + ' 个国别资料点 · 缩放 ' + Math.round(camera.zoom * 100) + '% · 滚轮缩放，拖动平移';
        if (wrapWidth) syncDynamicWraps();
        drawHooks.forEach(function (fn) { try { fn(); } catch (e) { window.__hookErr = String(e && e.message || e); } });
    }
    function renderContext() {
        var eras = document.getElementById('atlasEraOverviews'); eras.replaceChildren(); data.eras.forEach(function (era) {
            var section = node('article', null, 'era-overview'); section.id = 'period-' + era.id; var head = node('div'); head.append(node('h3', era.title));
            var b = node('button', '查看本时期节点 →'); b.type = 'button'; b.addEventListener('click', function () { current.view = 'history'; current.era = era.id; current.country = 'all'; current.kind = 'all'; current.q = ''; current.entry = ''; populateFilters(); renderRecords(); document.getElementById('atlasExplorer').scrollIntoView({ behavior: 'smooth', block: 'start' }); }); head.append(b);
            var text = node('div'); text.append(node('p', era.subtitle)); era.paragraphs.forEach(function (p) { text.append(node('p', p)); }); section.append(head, text); eras.append(section);
        });
        var feature = document.getElementById('atlasComintern'); feature.replaceChildren(node('h2', data.features.comintern.title)); data.features.comintern.paragraphs.forEach(function (p) { feature.append(node('p', p)); }); feature.append(sources(data.features.comintern.sources));
        var genealogy = document.getElementById('atlasGenealogy'); genealogy.replaceChildren(); data.features.genealogy.forEach(function (g) { var a = node('article'); a.append(node('h3', g[0]), node('p', g[1])); genealogy.append(a); });
        var bibliography = document.getElementById('atlasBibliography'); bibliography.querySelectorAll(':scope > ul').forEach(function (n) { n.remove(); }); bibliography.append(sources(Object.keys(data.sources)));
        var campRefs = document.getElementById('atlasCampBibliography'); if (!campRefs) { campRefs = node('div'); campRefs.id = 'atlasCampBibliography'; bibliography.append(campRefs); } campRefs.replaceChildren(node('h3', '国家分期、联邦与范围资料'), campSources(Object.keys(data.camps.sources)));
        document.getElementById('atlasEventCount').textContent = data.events.length; document.getElementById('atlasOrgCount').textContent = data.organizations.length;
        document.getElementById('atlasSourceCount').textContent = Object.keys(data.sources).length;
        document.getElementById('atlasSnapshotCount').textContent = data.camps.snapshots.length; document.getElementById('atlasStateCount').textContent = data.camps.states.length;
        var histories = document.getElementById('atlasStateHistoryList'); histories.replaceChildren();
        data.camps.states.forEach(function (st) { var d = node('details', null, 'atlas-state-history'); d.id = 'state-history-' + st.id; d.append(node('summary', st.title + ' · ' + st.start + '—' + (st.end || '至今') + (st.precision === 'year' ? '（年份范围）' : ''))); d.append(node('p', (st.kind === 'orientation' ? '其他社会主义取向；不与马列主义国家混算。' : st.kind === 'partial' ? '分治或部分地区；不将整个现代国家当作其历史疆域。' : '国家制度沿革；路线性质另作辨析。') + st.note));
            var matching = data.camps.snapshots.filter(function (s) { return s.activeStates.includes(st.id); }); var links = node('div'); matching.forEach(function (s) { var b = node('button', s.date); b.type = 'button'; b.addEventListener('click', function () { mapState.snapshot = s.id; mapState.state = st.geography[0]; camera.zoom = 1; camera.pan = [0, 0]; renderCampControls(); renderRecords(); document.querySelector('.atlas-shell').scrollIntoView({ block: 'start', behavior: 'smooth' }); }); links.append(b); }); d.append(links); var a = node('a', '核对本条历史出处 ↗'); a.href = st.url; a.target = '_blank'; a.rel = 'noopener'; d.append(a, campSources(st.sources)); histories.append(d); });
    }
    function showMapError() {
        document.getElementById('atlasMapLoading').hidden = true; svg.hidden = true; var fallback = document.getElementById('atlasFallback'); fallback.src = new URL('assets/international/world-'+(chinaRed()?'china-red':'neutral')+'.svg', base); fallback.hidden = false; document.getElementById('atlasMapError').hidden = false;
        document.querySelectorAll('.atlas-controls button').forEach(function (b) { b.disabled = true; });
    }
    var projectionTask;
    function loadScript(file) { return new Promise(function (resolve, reject) { var s = document.createElement('script'); s.src = new URL(file, base); s.onload = resolve; s.onerror = function () { s.remove(); reject(new Error('Local map resource unavailable')); }; document.head.append(s); }); }
    function loadProjection() {
        if (window.d3 && window.d3.geoEqualEarth) return Promise.resolve();
        if (projectionTask) return projectionTask;
        projectionTask = (async function () { if (!window.d3 || !window.d3.Adder) await loadScript('js/vendor/d3-array-3.2.4.min.js'); await loadScript('js/vendor/d3-geo-3.1.1.min.js'); })().finally(function () { projectionTask = null; });
        return projectionTask;
    }
    async function loadMap() {
        try {
            await loadProjection();
            var result = await getJSON('assets/international/world-50m.json'); if (!result.features || result.features.length < 200 || result.coordinateSpace !== 'official-planar') throw new Error('Map data incomplete'); world = result;
            document.getElementById('atlasBoundaries').replaceChildren();
            lands.replaceChildren(); featureNodes = world.features.map(function (feature) { var n = snode('path', { class: 'atlas-land', 'data-state': feature.id }); n.append(snode('title', {}, feature.properties.name)); n.addEventListener('click', function () { if (Date.now() - lastDraggedAt < 250 || !data) return; chooseState(feature.id, false); }); lands.append(n); return { node: n, feature: feature }; });
            document.getElementById('atlasMapLoading').hidden = true; document.getElementById('atlasMapError').hidden = true; document.getElementById('atlasFallback').hidden = true; svg.hidden = false;
            document.querySelectorAll('.atlas-controls button').forEach(function (b) { b.disabled = false; });
            renderCampControls(); drawMap(); buildWraps();
            camera.zoom = minZoom();   /* 初始即"恰好一份完整世界"（两个全景图的根治） */
            drawMap(); syncDynamicWraps();
        } catch (_) { showMapError(); }
    }
    async function loadData() {
        try {
            var payload = await getJSON('data/international/atlas.json'); if (!payload || !Array.isArray(payload.events) || !Array.isArray(payload.organizations) || !Array.isArray(payload.eras) || !payload.countries || !payload.sources) throw new Error('Invalid atlas data');
            data = payload; readURL(); populateFilters(); renderContext(); renderCampControls(); renderRecords(); document.getElementById('atlasDataError').hidden = true; form.inert = false;
            if (current.entry) { var selected = lastItems.find(function (e) { return e.id === current.entry; }); if (selected) { selectEntry(selected.id, false); requestAnimationFrame(function () { var card = document.getElementById(selected.id); card.scrollIntoView({ block: 'start', behavior: 'instant' }); }); } }
            window.QMLMInternationalAtlas = {
                getState: function () { return { filters: { ...current }, camera: { ...camera }, map: { ...mapState }, shown: lastItems.length, mapFeatures: world ? world.features.length : 0 }; },
                getData: function () { return data; },
                getCamera: function () { return { zoom: camera.zoom, pan: camera.pan.slice(), mode: camera.mode }; },
                /* 世界横向周期（viewBox 单位）：供引导线/导览做环绕感知取模 */
                getWrapWidth: function () { return wrapWidth; },
                /* 经纬度 → 画布 viewBox 坐标（供引导线/导览锚点使用） */
                projectLL: function (ll) { if (!world || !projection) return null; var p = projectSymbol(ll); if (!p) return null; var out = projection(p); return out && out.every(Number.isFinite) ? out : null; },
                /* 镜头飞行：以给定经纬度为画面中心，设定缩放并重绘（下限=单份世界） */
                flyToLL: function (ll, zoom) {
                    if (!world || !projection) return false;
                    var p = projectSymbol(ll); if (!p) return false;
                    var xy = projection(p); if (!xy || !xy.every(Number.isFinite)) return false;
                    camera.zoom = Math.max(minZoom(), Math.min(6, zoom || 1));
                    camera.pan = [(500 - xy[0]) * camera.zoom, (280 - xy[1]) * camera.zoom];
                    drawMap();
                    return true;
                },
                onDraw: function (cb) { if (typeof cb === 'function') drawHooks.push(cb); },
                /* 清空全部选中态：条目 + 国家选择 + **国别筛选**（此前漏掉 current.country，
                   点国别后标记只剩它一个且空白点击退不出——用户暴怒项）。
                   必须走 renderRecords（重算筛选）而非裸 drawMap，否则 lastItems 仍旧锁死。 */
                clearSelection: function () {
                    current.entry = '';
                    current.country = 'all';
                    mapState.state = '';
                    var st = document.getElementById('atlasState');
                    if (st) st.value = '';
                    var fc = form.elements.country;
                    if (fc) fc.value = 'all';
                    renderRecords();
                }
            };
        } catch (error) { document.getElementById('atlasDataError').hidden = false; form.inert = true; document.getElementById('atlasResultsStatus').textContent = '资料暂未加载，地图仍可查看。'; }
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); clearTimeout(searchTimer); current.q = form.elements.query.value.trim(); current.entry = ''; renderRecords(); });
    form.addEventListener('change', function () { ['era', 'country', 'kind', 'lineage'].forEach(function (k) { current[k] = form.elements[k].value; }); current.entry = ''; renderRecords(); });
    form.elements.query.addEventListener('input', function () { clearTimeout(searchTimer); searchTimer = setTimeout(function () { current.q = form.elements.query.value.trim(); current.entry = ''; renderRecords(); }, 180); });
    form.addEventListener('reset', function (e) { e.preventDefault(); current = { ...current, era: 'all', country: 'all', kind: 'all', lineage: 'all', q: '', entry: '' }; populateFilters(); renderRecords(); });
    document.querySelectorAll('[data-atlas-view]').forEach(function (b) { b.addEventListener('click', function () { if (!data) return; clearTimeout(searchTimer); current.view = b.dataset.atlasView; current.kind = 'all'; current.entry = ''; populateFilters(); renderRecords(); }); });
    document.querySelectorAll('[data-projection]').forEach(function (b) { b.addEventListener('click', function () { camera.mode = b.dataset.projection; camera.zoom = 1; camera.pan = [0, 0]; document.querySelectorAll('[data-projection]').forEach(function (n) { n.setAttribute('aria-pressed', String(n === b)); }); var selected = lastItems.find(function (e) { return e.id === current.entry; }); if (selected && camera.mode === 'globe') { var c = data.countries[selected.country][2]; camera.rotation = [-c[0], -c[1], 0]; } drawMap(); }); });
    function zoom(factor, point) {
        var previous = camera.zoom;
        camera.zoom = Math.max(minZoom(), Math.min(6, previous * factor));
        if (point && camera.mode === 'flat') {
            var ratio = camera.zoom / previous;
            if (wrapWidth) {
                /* 环绕感知：以光标下"可见副本"的世界点为锚（k = 副本周期的阶数） */
                var q = (point[0] - 500 - camera.pan[0]) / previous + 500;
                var k = Math.round((500 - q) / wrapWidth);
                camera.pan = [point[0] - 500 - (point[0] - 500 - camera.pan[0] + k * wrapWidth * previous) * ratio, point[1] - 280 - (point[1] - 280 - camera.pan[1]) * ratio];
            } else {
                camera.pan = [point[0] - 500 - (point[0] - 500 - camera.pan[0]) * ratio, point[1] - 280 - (point[1] - 280 - camera.pan[1]) * ratio];
            }
        }
        if (!frame) frame = requestAnimationFrame(function () { frame = 0; drawMap(); });
    }
    svg.addEventListener('wheel', function (e) {
        if (!world || !projection || e.ctrlKey || e.metaKey) return;
        e.preventDefault();
        var pixels = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? svg.clientHeight : 1);
        var point = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse());
        zoom(Math.exp(-Math.max(-240, Math.min(240, pixels)) * 0.002), [point.x, point.y]);
    }, { passive: false });
    document.getElementById('atlasZoomIn').addEventListener('click', function () { zoom(1.25); }); document.getElementById('atlasZoomOut').addEventListener('click', function () { zoom(0.8); });
    document.getElementById('atlasResetCamera').addEventListener('click', function () { camera.zoom = minZoom(); camera.pan = [0, 0]; camera.rotation = [-20, -12, 0]; drawMap(); });
    document.getElementById('atlasRetryMap').addEventListener('click', loadMap); document.getElementById('atlasRetryData').addEventListener('click', loadData);
    document.getElementById('atlasSnapshot').addEventListener('change', function () { mapState.snapshot = this.value; mapState.state = ''; if (this.value !== '2024') mapState.armed = ''; renderCampControls(); renderRecords(); });
    document.getElementById('atlasColorLayer').addEventListener('change', function () { mapState.layer = this.value; renderCampControls(); drawMap(); syncURL(); });
    document.getElementById('atlasState').addEventListener('change', function () { mapState.state = this.value; if (this.value) chooseState(this.value, false); else { resetDetail(); drawMap(); syncURL(); } });
    document.getElementById('atlasArmedArea').addEventListener('change', function () { mapState.armed = this.value; if (this.value) { mapState.snapshot = '2024'; mapState.state = ''; camera.zoom = 1; camera.pan = [0, 0]; } renderCampControls(); renderRecords(); });
    var drag = null, lastDraggedAt = 0;
    svg.addEventListener('pointerdown', function (e) {
        if (e.button !== 0 || (e.pointerType === 'touch' && !camera.touch) || e.target.closest('.atlas-marker')) return;
        var land = e.target.closest('.atlas-land');
        drag = { id: e.pointerId, x: e.clientX, y: e.clientY, pan: camera.pan.slice(), rotation: camera.rotation.slice(), state: land ? land.dataset.state : '' };
        try { svg.setPointerCapture(e.pointerId); } catch (_) { /* 合成指针无活动捕获，忽略 */ }
        document.body.classList.add('map-dragging');
    });
    svg.addEventListener('pointermove', function (e) {
        if (!drag || drag.id !== e.pointerId) return;
        /* slice 裁切下 screen→viewBox 比例须取自 CTM（1000/宽 的旧算法在非 1000/560 视口比下漂移） */
        var ctmD = svg.getScreenCTM(); var scale = ctmD && ctmD.a ? 1 / ctmD.a : 1000 / svg.getBoundingClientRect().width;
        var dx = (e.clientX - drag.x) * scale, dy = (e.clientY - drag.y) * scale;
        if (Math.hypot(dx, dy) > 4) drag.moved = true;
        if (camera.mode === 'globe') camera.rotation = [drag.rotation[0] + dx * 0.22, Math.max(-85, Math.min(85, drag.rotation[1] - dy * 0.22)), 0];
        else camera.pan = [drag.pan[0] + dx, drag.pan[1] + dy];
        /* 逐事件同步更新相机（不过 rAF）：拖拽跟手，杜绝延迟回弹类抖动 */
        updateCameraOnly();
    });
    function endDrag(e) {
        if (!drag || drag.id !== e.pointerId) return;
        var selected = !drag.moved && e.type === 'pointerup' && drag.state;
        if (drag.moved || selected) lastDraggedAt = Date.now();
        drag = null;
        document.body.classList.remove('map-dragging');
        if (svg.hasPointerCapture(e.pointerId)) svg.releasePointerCapture(e.pointerId);
        if (selected && data) chooseState(selected, false);
    }
    svg.addEventListener('pointerup', endDrag); svg.addEventListener('pointercancel', endDrag);
    svg.addEventListener('keydown', function (e) {
        if (e.target !== svg || !world) return; var delta = { ArrowLeft: [-15, 0], ArrowRight: [15, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] }[e.key];
        if (delta) { e.preventDefault(); if (camera.mode === 'globe') camera.rotation = [camera.rotation[0] + delta[0], Math.max(-85, Math.min(85, camera.rotation[1] - delta[1])), 0]; else camera.pan = [camera.pan[0] + delta[0] * 2, camera.pan[1] + delta[1] * 2]; drawMap(); }
        else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoom(1.25); } else if (e.key === '-') { e.preventDefault(); zoom(0.8); }
    });
    window.addEventListener('popstate', function () { if (data) { readURL(); populateFilters(); renderCampControls(); renderRecords(); } });
    window.addEventListener('resize', function () { if (!frame) frame = requestAnimationFrame(function () { frame = 0; drawMap(true); }); });
    resetDetail(); Promise.allSettled([loadData(), loadMap()]);
})();
