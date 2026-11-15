/**
 * 国际共运图房 · 画布页逻辑 v2.2（international-canvas.js）
 * 数据源：data/international/atlas.json（经 international-atlas.js 公开钩子）+ data/history-events.js
 * 职责：主从时间之轴（时代行可选中，截面行只列所选时代）/ 站牌拖拽折叠与引导线 /
 *       四室抽屉（时事·纪念抓取子页保持单一数据源）/ 图志检索室 / 导览巡航 /
 *       地图详情面板（×清空选中，点空白海面关闭一切浮层）/ 封面首访频控
 * 约定：不重复实现地图逻辑——相机/截面/详情全部委托 international-atlas.js 的公开钩子。
 */
(function () {
    'use strict';

    var ATLAS = null;          // window.QMLMInternationalAtlas（地图钩子）
    var DATA = null;           // atlas.json
    var DRAWN_KEY = 'qmlm:canvas-drawn';
    var POS_KEY = 'qmlm:canvas:stations:v2';   // 版本化：布局大改即作废旧键，防调试期拖拽残留污染（BUG-3）
    var POS_KEY_LEGACY = 'qmlm:canvas:stations:v1';
    var SEEN_KEY = 'qmlm:canvas:seen';

    /* ============ 工具 ============ */
    function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

    /* ============ 站牌锚点（经纬度，用户指定：一牌一城，固定指向） ============ */
    var ANCHORS = {
        cal: [37.6, 55.75],   // 历史日历 → 莫斯科
        col: [2.35, 48.85],   // 深度专栏 → 巴黎
        mem: [20, 2],         // 为了忘却的纪念 → 非洲中部
        cur: [121.47, 31.23]  // 时事档案 → 上海
    };

    /* ============ 引导线（屏幕空间，随地图重绘重算；锚点出视口或过远则不画，防跑飞） ============ */
    var overlay, NS = 'http://www.w3.org/2000/svg', tourSpot = null;
    function fitOverlay() { overlay.setAttribute('width', innerWidth); overlay.setAttribute('height', innerHeight); }
    function anchorScreen(ll) {
        if (!ATLAS) return null;
        var vb = ATLAS.projectLL(ll);
        if (!vb) return null;
        /* 关键：锚点屏位必须过相机变换——(P−中心)×zoom+中心+pan。
           此前漏乘相机，引导线永远钉在初始屏位（"静态/指老位置"的根源） */
        var cam = ATLAS.getCamera();
        var x = (vb[0] - 500) * cam.zoom + 500 + cam.pan[0];
        var y = (vb[1] - 280) * cam.zoom + 280 + cam.pan[1];
        var svg = document.getElementById('atlasSvg');
        var ctm = svg.getScreenCTM();
        if (!ctm) return null;
        var pt = svg.createSVGPoint(); pt.x = x; pt.y = y;
        var sp = pt.matrixTransform(ctm);
        return [sp.x, sp.y];
    }
    /* 环绕感知锚点：主世界锚点出视口时尝试 ±1 世界周期的副本位置（屏上周期 = W×zoom×ctm.a） */
    function anchorScreenWrapped(ll) {
        var sp = anchorScreen(ll);
        if (!sp) return null;
        var m = 24;
        function inV(p) { return p[0] > -m && p[0] < innerWidth + m && p[1] > -m && p[1] < innerHeight + m; }
        if (inV(sp)) return sp;
        var W = ATLAS.getWrapWidth ? ATLAS.getWrapWidth() : 0;
        if (!W) return null;
        var svg = document.getElementById('atlasSvg');
        var ctm = svg.getScreenCTM(); if (!ctm) return null;
        var cam = ATLAS.getCamera();
        var Ws = W * (cam.zoom || 1) * ctm.a;
        for (var k = -1; k <= 1; k += 2) {
            var cand = [sp[0] + k * Ws, sp[1]];
            if (inV(cand)) return cand;
        }
        return null;
    }
    function drawLeaders() {
        overlay.innerHTML = '';
        /* 端点已相机感知：站牌拖拽/地图拖拽期间实时跟随（不再冻结——冻结+不补画=静态线根源）。
           折叠卡照画：折叠只是收起面板，钉靠关系不解除 */
        document.querySelectorAll('.cv-station').forEach(function (card) {
            var ll = ANCHORS[card.dataset.key];
            var sp = anchorScreenWrapped(ll);
            if (!sp) return;
            var ax = sp[0], ay = sp[1];
            if (ax < -24 || ax > innerWidth + 24 || ay < -24 || ay > innerHeight + 24) return;
            var r = card.getBoundingClientRect();
            var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
            var dx = ax - cx, dy = ay - cy, sx, sy;
            if (Math.abs(dx) >= Math.abs(dy)) { sx = dx > 0 ? r.right + 4 : r.left - 4; sy = cy; }
            else { sy = dy > 0 ? r.bottom + 4 : r.top - 4; sx = cx; }
            var elbow = Math.abs(dx) >= Math.abs(dy) ? [ax - (ax - sx) * .35, sy] : [sx, ay - (ay - sy) * .35];
            var col = card.style.getPropertyValue('--st') || '#e8c36a';
            var g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'leader' + (card.dataset.hot ? ' hot' : ''));
            g.setAttribute('stroke', col);
            /* 箭头沿终段方向指向锚点（原先恒朝下，锚点在上时箭头背向） */
            var ang = Math.atan2(ay - elbow[1], ax - elbow[0]);
            var bx = ax - Math.cos(ang) * 10, by = ay - Math.sin(ang) * 10;
            var pxn = Math.cos(ang + Math.PI / 2), pyn = Math.sin(ang + Math.PI / 2);
            var p = document.createElementNS(NS, 'path');
            p.setAttribute('d', 'M' + sx + ',' + sy + ' L' + elbow[0] + ',' + elbow[1] + ' L' + bx.toFixed(1) + ',' + by.toFixed(1));
            g.append(p);
            var dot = document.createElementNS(NS, 'circle');
            dot.setAttribute('cx', sx); dot.setAttribute('cy', sy); dot.setAttribute('r', 3.5); dot.setAttribute('fill', col);
            g.append(dot);
            var pulse = document.createElementNS(NS, 'circle');
            pulse.setAttribute('cx', ax); pulse.setAttribute('cy', ay); pulse.setAttribute('r', 5);
            pulse.setAttribute('fill', 'none'); pulse.setAttribute('stroke', col); pulse.setAttribute('class', 'pulse');
            g.append(pulse);
            var arrow = document.createElementNS(NS, 'path');
            arrow.setAttribute('class', 'arrow');
            arrow.setAttribute('d', 'M' + (bx + pxn * 5).toFixed(1) + ',' + (by + pyn * 5).toFixed(1) + ' L' + ax + ',' + ay + ' L' + (bx - pxn * 5).toFixed(1) + ',' + (by - pyn * 5).toFixed(1) + ' Z');
            arrow.setAttribute('fill', col);
            g.append(arrow);
            overlay.append(g);
        });
        if (tourSpot) {
            var sp2 = anchorScreenWrapped(tourSpot);
            if (sp2 && sp2[0] > -24 && sp2[0] < innerWidth + 24 && sp2[1] > -24 && sp2[1] < innerHeight + 24) {
                var g2 = document.createElementNS(NS, 'g');
                var c = document.createElementNS(NS, 'circle');
                c.setAttribute('cx', sp2[0]); c.setAttribute('cy', sp2[1]); c.setAttribute('r', 6);
                c.setAttribute('fill', 'none'); c.setAttribute('stroke', '#ffd700'); c.setAttribute('class', 'pulse');
                g2.append(c); overlay.append(g2);
            }
        }
    }

    /* ============ 通用拖动（站牌头部 / 顶栏手柄；位移≤5px 视为点击） ============
       垂直下限 = 站头底边（铁律 2：一切 HUD 位移不得高于站头下缘） */
    function mastheadH() {
        var v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--masthead-h'));
        return isNaN(v) ? 0 : v;
    }
    function makeDraggable(el, handle, onClick) {
        var st = null;
        handle.addEventListener('pointerdown', function (e) {
            if (e.button !== 0) return;
            var r = el.getBoundingClientRect();
            st = { px: r.left, py: r.top, moved: false, sx: e.clientX, sy: e.clientY, id: e.pointerId };
            el.style.left = r.left + 'px'; el.style.top = r.top + 'px';
            el.style.right = 'auto'; el.style.bottom = 'auto'; el.style.transform = 'none';
            if (handle.setPointerCapture) { try { handle.setPointerCapture(e.pointerId); } catch (_) { } }
            document.body.classList.add('dragging');
            e.preventDefault();
        });
        handle.addEventListener('pointermove', function (e) {
            if (!st || st.id !== e.pointerId) return;
            var dx = e.clientX - st.sx, dy = e.clientY - st.sy;
            if (!st.moved && Math.hypot(dx, dy) > 5) st.moved = true;
            if (st.moved) {
                var w = el.offsetWidth, h = el.offsetHeight;
                el.style.left = clamp(st.px + dx, 6, innerWidth - w - 6) + 'px';
                el.style.top = clamp(st.py + dy, mastheadH() + 4, innerHeight - h - 6) + 'px';
                drawLeaders();
            }
        });
        handle.addEventListener('pointerup', function (e) {
            if (!st || st.id !== e.pointerId) return;
            document.body.classList.remove('dragging');
            var wasMoved = st.moved; st = null;
            if (!wasMoved && onClick) onClick(e);
            savePositions();
        });
        handle.addEventListener('pointercancel', function () { st = null; document.body.classList.remove('dragging'); });
    }
    function savePositions() {
        try {
            var pos = {};
            document.querySelectorAll('.cv-station').forEach(function (s) {
                pos[s.id] = { left: s.style.left, top: s.style.top, right: s.style.right, bottom: s.style.bottom, folded: s.classList.contains('folded') };
            });
            localStorage.setItem(POS_KEY, JSON.stringify(pos));
        } catch (_) { }
    }
    /* 恢复站牌位置（BUG-3）：v2 键 + 两道防线。
       防线一：px 值直接按视口/masthead 夹取——不依赖测量矩形，免受恢复期瞬态
              （历史滚动复原、宿主动画 transform）影响；
       防线二：两两重叠检测用同一包含块内的相对矩形（transform/scroll 对全体等移，
              相对关系不变），任一重叠整批弃用回默认布局——QA 拖拽残留由此拦截。 */
    function px(v) { return /^-?[\d.]+px$/.test(v) ? parseFloat(v) : null; }
    function restorePositions() {
        try { localStorage.removeItem(POS_KEY_LEGACY); } catch (_) { }
        if (innerWidth < 900) return;
        var raw = null;
        try { raw = JSON.parse(localStorage.getItem(POS_KEY) || 'null'); } catch (_) { }
        if (!raw) return;
        var stations = Array.prototype.slice.call(document.querySelectorAll('.cv-station'));
        var defaults = stations.map(function (s) {
            return { left: s.style.left, top: s.style.top, right: s.style.right, bottom: s.style.bottom };
        });
        var mh = mastheadH();
        stations.forEach(function (s) {
            var p = raw[s.id]; if (!p) return;
            if (p.left) s.style.left = p.left;
            if (p.top) s.style.top = p.top;
            s.style.right = p.right || 'auto';
            s.style.bottom = p.bottom || 'auto';
            var l = px(s.style.left), t = px(s.style.top), w = s.offsetWidth, h = s.offsetHeight;
            if (l != null) s.style.left = clamp(l, 6, Math.max(6, innerWidth - w - 6)) + 'px';
            if (t != null) s.style.top = clamp(t, mh + 4, Math.max(mh + 4, innerHeight - h - 6)) + 'px';
            if (p.folded) { s.classList.add('folded'); s.querySelector('.fold').textContent = '+'; }
        });
        var rects = stations.map(function (s) { return s.getBoundingClientRect(); });
        var ok = true;
        for (var i = 0; ok && i < rects.length; i++) {
            for (var j = i + 1; j < rects.length; j++) {
                var a = rects[i], b = rects[j];
                if (a.left < b.right - 4 && b.left < a.right - 4 && a.top < b.bottom - 4 && b.top < a.bottom - 4) { ok = false; break; }
            }
        }
        if (!ok) {
            try { localStorage.removeItem(POS_KEY); } catch (_) { }
            stations.forEach(function (s, i) {
                var d = defaults[i];
                s.style.left = d.left; s.style.top = d.top; s.style.right = d.right; s.style.bottom = d.bottom;
                s.classList.remove('folded');
                var f = s.querySelector('.fold'); if (f) f.textContent = '—';
            });
        }
    }
    /* 恢复时机：DOMContentLoaded 时布局视口可能仍在变化（窗口动画/系统缩放/恢复窗口），
       过早测量会误判越界或重叠。等连续 N 帧尺寸一致再恢复（上限 60 帧兜底）。 */
    function restoreWhenViewportSettled(n, w, h) {
        if (innerWidth === w && innerHeight === h && n >= 4) { restorePositions(); return; }
        if (n > 60) { restorePositions(); return; }
        requestAnimationFrame(function () { restoreWhenViewportSettled(n + 1, innerWidth, innerHeight); });
    }

    /* ============ 抽屉系统（四档案室 + 图志检索室；互斥） ============ */
    var drawers = {}, openDrawerKey = null;
    function registerDrawer(key, el) { drawers[key] = el; }
    function openDrawer(key) {
        Object.keys(drawers).forEach(function (k) { drawers[k].classList.toggle('open', k === key); });
        openDrawerKey = key;
        drawLeaders();
    }
    function closeDrawers() {
        Object.keys(drawers).forEach(function (k) { drawers[k].classList.remove('open'); });
        openDrawerKey = null;
        drawLeaders();
    }
    function toggleDrawer(key) { openDrawerKey === key ? closeDrawers() : openDrawer(key); }

    /* ---- 图志资料库双视图：资料库 / 方法与来源（身份重定） ---- */
    function setAtlasMode(mode) {
        var lib = document.getElementById('atlasLibView');
        var src = document.getElementById('atlasSourcesView');
        if (!lib || !src) return;
        lib.hidden = mode !== 'lib';
        src.hidden = mode !== 'sources';
        var bl = document.getElementById('atlasModeLib'), bs = document.getElementById('atlasModeSources');
        if (bl) bl.setAttribute('aria-pressed', String(mode === 'lib'));
        if (bs) bs.setAttribute('aria-pressed', String(mode === 'sources'));
    }

    /* ---- 日历室：historyData 实时构建 ---- */
    var calState = { m: new Date().getMonth() + 1, d: null };
    function calEventsByDay(m) {
        var map = {};
        (historyData[m] || []).forEach(function (e) {
            var mm = /(\d+)月(\d+)日/.exec(e.date || '');
            if (mm) (map[+mm[2]] || (map[+mm[2]] = [])).push(e);
        });
        return map;
    }
    function eventCard(e) {
        var CATS = { revolution: ['革命事件', '#e77776'], war: ['战争军事', '#9d4039'], political: ['政治事件', '#e8c36a'], person: ['人物', '#596d60'], culture: ['文化思想', '#366c9a'] };
        var cat = CATS[e.category] || [e.category, '#6d736a'];
        var think = e.think ? '<p class="cv-think">✦ 想一想：' + esc(e.think) + '</p>' : '';
        return '<div class="cv-entry" style="--ec:' + cat[1] + '"><div class="meta"><span class="yr">' + e.year + '</span><span>' + cat[0] + '</span><span>' + (e.nature === 'positive' ? '积极' : e.nature === 'negative' ? '挫折' : '转折') + '</span></div><h4>' + esc(e.title) + '</h4><p>' + esc(e.desc || '') + '</p>' + think + '</div>';
    }
    function calHTML() {
        var now = new Date();
        var year = now.getFullYear();
        var byDay = calEventsByDay(calState.m);
        var first = new Date(year, calState.m - 1, 1).getDay();
        var days = new Date(year, calState.m, 0).getDate();
        var wd = ['日', '一', '二', '三', '四', '五', '六'];
        var html = '<div class="cv-cal-grid">';
        wd.forEach(function (w) { html += '<div class="wd">' + w + '</div>'; });
        for (var i = 0; i < first; i++) html += '<div class="d"></div>';
        for (var d = 1; d <= days; d++) {
            var has = byDay[d] && byDay[d].length;
            html += '<div class="d' + (has ? ' has' : '') + (calState.m === now.getMonth() + 1 && d === now.getDate() ? ' today' : '') + '" data-day="' + d + '">' + d + '</div>';
        }
        html += '</div>';
        var shown = calState.d ? (byDay[calState.d] || []) : (byDay[now.getDate()] || []);
        var label = calState.m + '月' + (calState.d || now.getDate()) + '日';
        html += '<h3 class="cv-blocktitle">' + label + ' · ' + shown.length + ' 条史实</h3>';
        html += shown.length ? shown.slice(0, 5).map(eventCard).join('') : '<div class="drawer-fallback">这一天暂无记录。</div>';
        var drawnCount = 0;
        try { drawnCount = JSON.parse(localStorage.getItem(DRAWN_KEY) || '[]').length; } catch (_) { }
        html += '<button type="button" class="cv-mock-btn" data-random>🎲 随机回眸</button>';
        html += '<a class="cv-full-link" href="international-calendar.html?m=' + calState.m + (calState.d ? '&d=' + calState.d : '') + '">进入完整日历（641 条 · 时代筛选 · 文献串联）→</a>';
        return html;
    }
    function bindRandom(body) {
        var rnd = body.querySelector('[data-random]');
        if (!rnd) return;
        rnd.onclick = function () {
            var all = [];
            for (var m = 1; m <= 12; m++) (historyData[m] || []).forEach(function (e, i) { all.push({ m: m, e: e, i: i }); });
            var drawn = [];
            try { drawn = JSON.parse(localStorage.getItem(DRAWN_KEY) || '[]'); } catch (_) { }
            var pool = all.filter(function (x) { return drawn.indexOf(x.m + '-' + x.i) === -1; });
            if (!pool.length) { drawn = []; pool = all; }
            var pick = pool[Math.floor(Math.random() * pool.length)];
            drawn.push(pick.m + '-' + pick.i);
            try { localStorage.setItem(DRAWN_KEY, JSON.stringify(drawn)); } catch (_) { }
            calState.m = pick.m; calState.d = +(/(\d+)月(\d+)日/.exec(pick.e.date) || [0, 0, 1])[2];
            body.innerHTML = calHTML();
            bindRandom(body);
        };
    }
    function bindCalDrawer(body) {
        body.addEventListener('click', function (e) {
            var d = e.target.closest('.cv-cal-grid .d[data-day]');
            if (d) { calState.d = +d.dataset.day; body.innerHTML = calHTML(); bindRandom(body); }
        });
        bindRandom(body);
    }

    /* ---- 时事室 / 纪念室：抓取子页静态内容，保持单一数据源 ---- */
    function fetchExtract(url, pick) {
        return fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
            .then(function (text) {
                var doc = new DOMParser().parseFromString(text, 'text/html');
                return pick(doc);
            });
    }
    function curHTML(items) {
        return items.map(function (it) {
            return '<div class="cv-entry" style="--ec:#9d4039"><div class="meta"><span class="yr">' + esc(it.date) + '</span><span>' + esc(it.tag) + '</span></div><h4>' + esc(it.title) + '</h4><p>' + esc(it.desc) + '</p>' + (it.src ? '<a class="src" href="' + esc(it.src.href) + '" target="_blank" rel="noopener">' + esc(it.src.label) + ' ↗</a>' : '') + '</div>';
        }).join('') + '<a class="cv-full-link" href="international-current.html">进入时事档案 →</a>';
    }
    function memHTML(cards) {
        return cards.map(function (c) {
            return '<div class="cv-entry" style="--ec:#596d60"><div class="meta"><span class="yr">' + esc(c.years) + '</span></div><h4>' + esc(c.name) + '</h4><p>' + esc(c.desc) + '</p><p>“' + esc(c.quote) + '”</p>' + (c.src ? '<a class="src" href="' + esc(c.src.href) + '" target="_blank" rel="noopener">' + esc(c.src.label) + ' ↗</a>' : '') + '</div>';
        }).join('') + '<a class="cv-full-link" href="international-memorial.html">进入纪念页 →</a>';
    }
    function colHTML() {
        return '<div class="cv-entry" style="--ec:#366c9a"><div class="meta"><span class="yr">连载中</span><span>长文 · 人物谱系</span></div><h4>铁流与先锋</h4><p>国际共运人物群像的长卷写法：从第一国际的匠人，到十月浪潮里的先锋，再到散落各洲的坚守者。</p><a class="src" href="international-column/tieliu-yu-xianfeng.html">阅读全文 ↗</a></div>'
            + '<div class="cv-entry" style="--ec:#9d4039"><div class="meta"><span class="yr">专题</span><span>长文</span></div><h4>围剿与反围剿</h4><p>把"围堵"与"突围"作为一对互为条件的运动来写：资本主义的封锁线如何划定，社会主义的突破线如何落笔。</p><a class="src" href="international-column/encirclement.html">阅读全文 ↗</a></div>'
            + '<div class="cv-entry" style="--ec:#596d60"><div class="meta"><span class="yr">专题</span><span>组织史</span></div><h4>美共基础建设</h4><p>美国共产主义运动的组织史切片：支部、报刊、工分会与它的对手。</p><a class="src" href="international-column/foundations.html">阅读全文 ↗</a></div>'
            + '<div class="cv-entry" style="--ec:#6d736a"><div class="meta"><span class="yr">筹备</span></div><h4>红色高棉研究笔记 / 阿尔巴尼亚的孤立年代</h4><p>档案整理中，稍后开放。</p></div>'
            + '<a class="cv-full-link" href="international-column.html">进入专栏目录 →</a>';
    }

    /* ============ 主从时间之轴 ============
       第一行（era-row）：六个时代，语义名+年份，点击选中（联动 atlas 时代筛选）；
       第二行（tick-row）：只列所选时代的截面——它是第一行的附庸与细化。 */
    var eraRow = null, tickRow = null, ticks = [], activeEraId = null, rulerReady = false;
    var ERA_COLORS = { origins: '#627389', revolution: '#df444a', decolonization: '#e8c36a', turning: '#9d4039', reorganization: '#65bac5', present: '#596d60' };
    function eraOfYear(y) {
        return DATA.eras.find(function (e) { return y >= e.start && y <= e.end; }) || DATA.eras[DATA.eras.length - 1];
    }
    function densityByYear() {
        var d = {};
        for (var m = 1; m <= 12; m++) (historyData[m] || []).forEach(function (e) { d[e.year] = (d[e.year] || 0) + 1; });
        var out = {};
        DATA.camps.snapshots.forEach(function (s) {
            var y = parseInt(s.date, 10), sum = 0;
            for (var k = y - 2; k <= y + 2; k++) sum += d[k] || 0;
            out[y] = sum;
        });
        return out;
    }
    function eraDisplayName(era) {
        var parts = era.title.split('·');
        return (parts[1] || parts[0]).trim();
    }
    function buildEraRow() {
        eraRow.innerHTML = '';
        DATA.eras.forEach(function (era) {
            var seg = document.createElement('div');
            seg.className = 'era-seg';
            seg.dataset.era = era.id;
            seg.style.setProperty('--ec', ERA_COLORS[era.id] || '#627389');
            seg.style.setProperty('--w', Math.max(1, (era.end - era.start) / 40).toFixed(2));
            var name = document.createElement('div');
            name.className = 'era-name';
            name.innerHTML = '<b>' + esc(eraDisplayName(era)) + '</b><small>' + era.start + '–' + era.end + '</small>';
            name.title = era.title;
            seg.append(name);
            seg.addEventListener('click', function () { selectEra(era.id); });
            eraRow.append(seg);
        });
    }
    /* ============ 截面行（第二层）可见性：钉住 或 已选时代 ============
       默认只陈列时代层（52px）；点时代 → 截面行自动展开并常驻；右缘固定钮手动钉住/收起；
       钉住且未选时代时，截面行列出全部截面。 */
    var ROW2_KEY = 'qmlm:canvas:axis-row2-pinned';
    var row2Pinned = false;
    function applyAxisRows() {
        var ruler = document.getElementById('cvAxis');
        var btn = document.getElementById('cvAxisFold');
        if (!ruler || !btn) return;
        var showRow2 = row2Pinned || !!activeEraId;
        ruler.classList.toggle('tickless', !showRow2);
        btn.textContent = showRow2 ? '▴' : '▾';
        btn.setAttribute('aria-expanded', String(showRow2));
        btn.title = showRow2 ? '收起截面行（第二层）' : '钉住截面行（第二层常驻）';
        drawLeaders();
    }
    function initAxisPin() {
        var btn = document.getElementById('cvAxisFold');
        if (!btn) return;
        try { row2Pinned = localStorage.getItem(ROW2_KEY) === '1'; } catch (_) { }
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            row2Pinned = !row2Pinned;
            try { localStorage.setItem(ROW2_KEY, row2Pinned ? '1' : '0'); } catch (_) { }
            if (row2Pinned && !activeEraId && ticks.length === 0) buildTickRow(null);
            applyAxisRows();
        });
    }
    function buildTickRow(eraId) {
        var era = eraId ? DATA.eras.find(function (e) { return e.id === eraId; }) : null;
        tickRow.innerHTML = '';
        ticks = [];
        var density = densityByYear();
        DATA.camps.snapshots.filter(function (s) {
            if (!era) return true;   // 未选时代：列出全部截面
            var y = parseInt(s.date, 10);
            return y >= era.start && y <= era.end;
        }).forEach(function (s) {
            var y = parseInt(s.date, 10);
            var dup = DATA.camps.snapshots.filter(function (x) { return parseInt(x.date, 10) === y; }).length > 1;
            var tick = document.createElement('div');
            tick.className = 'tick';
            tick.dataset.snap = s.id;
            tick.dataset.year = y;
            tick.style.setProperty('--h', clamp(Math.round((density[y] || 2) * .45), 6, 26) + 'px');
            var bar = document.createElement('span'); bar.className = 'bar';
            var yr = document.createElement('span'); yr.className = 'yr';
            yr.textContent = dup ? y + '·' + s.date.slice(5, 7) : y;
            var nm = document.createElement('span'); nm.className = 'nm';
            nm.textContent = s.title.slice(0, 6);
            nm.title = s.date + ' ' + s.title;
            tick.append(bar, yr, nm);
            tick.addEventListener('click', function (e) { e.stopPropagation(); setTick(tick); });
            tickRow.append(tick);
            ticks.push(tick);
        });
        /* 密度自适应（为后续补充更多年份预留）：>16 隐国名，>30 再缩年份 */
        tickRow.classList.toggle('dense', ticks.length > 16 && ticks.length <= 30);
        tickRow.classList.toggle('very-dense', ticks.length > 30);
    }
    function markTick(snapId) {
        ticks.forEach(function (t) { t.classList.toggle('active', t.dataset.snap === snapId); });
    }
    function selectEra(eraId, keepSnap, applyFilter) {
        /* 再点已选时代 = 退出：清时代筛选，第二行回到全部截面（给时代锁一扇门） */
        if (activeEraId === eraId && !keepSnap && applyFilter !== false) {
            activeEraId = null;
            eraRow.querySelectorAll('.era-seg').forEach(function (x) { x.classList.remove('era-on'); });
            buildTickRow(null);
            setEraFilter('all');
            applyAxisRows();
            return;
        }
        activeEraId = eraId;
        eraRow.querySelectorAll('.era-seg').forEach(function (x) { x.classList.toggle('era-on', x.dataset.era === eraId); });
        buildTickRow(eraId);
        var era = DATA.eras.find(function (e) { return e.id === eraId; });
        var st = ATLAS.getState();
        var curYear = parseInt((DATA.camps.snapshots.find(function (s) { return s.id === st.map.snapshot; }) || {}).date || '0', 10);
        var inEra = curYear >= era.start && curYear <= era.end;
        if (!keepSnap && !inEra) {
            /* 当前截面不在所选时代内：跳到该时代第一个截面 */
            var first = ticks[0];
            if (first) {
                var sel = document.getElementById('atlasSnapshot');
                if (sel && sel.value !== first.dataset.snap) {
                    sel.value = first.dataset.snap;
                    sel.dispatchEvent(new Event('change', { bubbles: true }));
                }
                markTick(first.dataset.snap);
            }
        } else {
            markTick(st.map.snapshot);
        }
        if (applyFilter !== false) setEraFilter(eraId);
        applyAxisRows();
    }
    function setTick(tick) {
        if (!tick || tick.classList.contains('active')) return;
        markTick(tick.dataset.snap);
        var sel = document.getElementById('atlasSnapshot');
        if (sel && sel.value !== tick.dataset.snap) {
            sel.value = tick.dataset.snap;
            sel.dispatchEvent(new Event('change', { bubbles: true }));
        }
        plane.classList.remove('flash'); void plane.offsetWidth; plane.classList.add('flash');
        drawLeaders();
    }
    function setEraFilter(eraId) {
        var form = document.getElementById('atlasFilters');
        if (!form || !form.elements.era) return;
        if (form.elements.era.value !== eraId) {
            form.elements.era.value = eraId;
            form.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
    /* 按住横扫：在第二行上滑动即连续切换所选时代内的截面 */
    var scrubbing = false, scrubLast = null;
    function scrubAt(e) {
        var el = document.elementFromPoint(e.clientX, e.clientY);
        var t = el && el.closest ? el.closest('#tickRow .tick') : null;
        if (t && t !== scrubLast) { scrubLast = t; setTick(t); }
    }
    /* ← → 键在所选时代的截面内逐格翻 */
    function tickStep(dir) {
        var i = ticks.findIndex(function (t) { return t.classList.contains('active'); });
        var n = clamp(i + dir, 0, ticks.length - 1);
        if (n !== i) setTick(ticks[n]);
    }

    /* ============ 导览 ============ */
    var tourBar, tT, tX, tDots, tourActive = false, tourStep = 0;
    var TOUR = [
        { t: '欢迎来到图房', x: '整张世界地图就是展厅的地面——脚下没有展墙，只有<b>1949 年岁末的世界</b>。社会主义阵营红、资本主义阵营蓝、分治之地斜纹；往任意方向拖动，地图就跟着你的手走。', ll: [45, 26], z: 1 },
        { t: '中央画布 · 历史阵营地图', x: '地图承载 <b>24 个历史截面</b>与 212 个国家参考面。中国自 1949 年起固定红——这是展示约定，历史记录不随底色改写；德国与朝鲜半岛的斜纹，表示同一地理单元内的分治。', ll: [14, 50], z: 2.3, spot: [13.4, 52.5] },
        { t: '时间之轴 · 图房的唯一时钟', x: '底缘这根轴分两层：<b>第一行是六个时代</b>，点一个时代，第二行就只列出它里面的截面——大看清轮廓，小选定年份。← → 键在截面间逐格翻。', axisHot: true },
        { t: '左上 · 历史日历', x: '日历室收着 <b>641 条"历史上的今天"</b>——每一天都可能改写世界。抽屉展示当日与月历，随机回眸就在里面；完整玩法在子页。', ll: [30.3, 59.9], z: 2.4, station: 'cal' },
        { t: '右下 · 时事档案', x: '时事室按<b>档案口径</b>收录今天的斗争，每条注明出处与观察立场——报纸会老，出处不会。', ll: [2.35, 48.85], z: 2.4, station: 'cur' },
        { t: '左下 · 为了忘却的纪念', x: '纪念室里是被记住的名字，每句名言都附<b>文献出处</b>。纪念不是装饰，是史料的另一种读法。', ll: [13.4, 52.5], z: 2.4, station: 'mem' },
        { t: '图房的门开着', x: '<b>现在交给你。</b>双击任意站牌进入完整页面；站牌头部可以拖着走，把四间档案室摆成你顺手的布局。单击空白海面可收起一切浮层，Esc 随时退出。', ll: [45, 26], z: 1 }
    ];
    function renderDots() {
        tDots.innerHTML = TOUR.map(function (_, i) { return '<i' + (i === tourStep ? ' class="on"' : '') + '></i>'; }).join('');
    }
    function tourGo(n) {
        if (n < 0 || n >= TOUR.length) return;
        tourStep = n;
        var st = TOUR[n];
        tT.textContent = st.t; tX.innerHTML = st.x;
        renderDots();
        document.querySelectorAll('.leader').forEach(function (g) { g.classList.remove('hot'); });
        document.querySelectorAll('.cv-station').forEach(function (s) { s.classList.remove('hot'); delete s.dataset.hot; });
        var axis = document.getElementById('cvAxis');
        if (axis) axis.classList.toggle('hot', !!st.axisHot);
        tourSpot = st.spot || null;
        closeDrawers();
        /* 地图未就绪时优雅降级：跳过镜头飞行与站牌开抽屉，解说照常进行（BUG-4） */
        if (st.ll && ATLAS && ATLAS.flyToLL) ATLAS.flyToLL(st.ll, st.z || 1);
        drawLeaders();
        if (st.station) {
            var card = document.querySelector('.cv-station[data-key="' + st.station + '"]');
            if (card) { card.classList.add('hot'); card.dataset.hot = '1'; }
            setTimeout(function () { if (tourActive && TOUR[tourStep] === st && ATLAS) openDrawer(st.station); }, 1200);
        }
    }
    function startTour() {
        tourActive = true;
        document.body.classList.add('touring');
        tourBar.classList.add('open');
        tourGo(0);
    }
    function stopTour() {
        if (!tourActive) return;
        tourActive = false;
        document.body.classList.remove('touring');
        tourBar.classList.remove('open');
        tourSpot = null;
        document.querySelectorAll('.cv-station').forEach(function (s) { s.classList.remove('hot'); delete s.dataset.hot; });
        var axis = document.getElementById('cvAxis');
        if (axis) axis.classList.remove('hot');
        closeDrawers();
        drawLeaders();
    }

    /* ============ 详情面板 / 南海附图：状态驱动显隐（BUG-1 + 铁律 9） ============
       唯一事实源 = ATLAS.getState()：map.state（点国别）或 filters.entry（点标点/检索）
       任一存在即开面板，双空即关。onDraw 每帧调用；clearSelection 后必然触发一次 drawMap，
       因此"× / 空白海面 / Esc → 清空 → 重绘 → 面板关闭"链路自动成立。
       南海附图：仅选中中国（state=CHN，或条目属中国）时陈列。 */
    function syncDetailPanel() {
        if (!ATLAS || !mapDetailWrap) return;
        var st = ATLAS.getState();
        var hasState = !!(st.map && st.map.state);
        var hasEntry = !!(st.filters && st.filters.entry);
        mapDetailWrap.classList.toggle('open', hasState || hasEntry);
        /* 选中中国 = 国家选择为 CHN，或当前条目属于中国（与 atlas 侧附图保留口径一致） */
        var china = hasState && st.map.state === 'CHN';
        if (!china && hasEntry && DATA) {
            var pool = DATA.events.concat(DATA.organizations);
            for (var i = 0; i < pool.length; i++) {
                if (pool[i].id === st.filters.entry) { china = pool[i].country === 'CHN'; break; }
            }
        }
        /* 南海附图安全网：atlas 已在 renderDetail/showStateDetail 内按国别保留附图；
           此处兜底把仍在文档别处的附图收进详情面板，一帧后复查吃掉同任务内的后续 wipe */
        if (china) {
            var reattachInset = function () {
                var p = document.getElementById('chinaInset'), d = document.getElementById('atlasDetail');
                if (p && d && !d.contains(p)) d.append(p);
            };
            reattachInset();
            requestAnimationFrame(reattachInset);
        }
        /* 左侧站牌让位：详情面板展开时滑到面板右侧且不低于顶栏底缘（防钻入顶栏背后），关闭时归位 */
        if (innerWidth > 900) {
            var tb = document.getElementById('cvTopbar');
            var tbBottom = tb ? tb.getBoundingClientRect().bottom + 8 : 0;
            document.querySelectorAll('.cv-station[data-side="left"]').forEach(function (s) {
                if (mapDetailWrap.classList.contains('open')) {
                    if (!s.dataset.preLeft) {
                        s.dataset.preLeft = s.style.left || '16px';
                        s.dataset.preTop = s.style.top || '';
                    }
                    s.style.left = '428px';
                    var t = parseFloat(s.style.top);
                    if (!isNaN(t) && t < tbBottom) s.style.top = Math.round(tbBottom) + 'px';
                } else if (s.dataset.preLeft) {
                    s.style.left = s.dataset.preLeft;
                    s.style.top = s.dataset.preTop || '';
                    delete s.dataset.preLeft;
                    delete s.dataset.preTop;
                }
            });
        }
        drawLeaders();
    }

    /* ============ 主流程 ============ */
    var plane, topbar, legendPop, mapDetailWrap;
    function init() {
        plane = document.getElementById('cvPlane');
        overlay = document.getElementById('leaderOverlay');
        eraRow = document.getElementById('eraRow');
        tickRow = document.getElementById('tickRow');
        tourBar = document.getElementById('cvTourBar');
        tT = document.getElementById('cvTourTitle');
        tX = document.getElementById('cvTourText');
        tDots = document.getElementById('cvTourDots');
        legendPop = document.getElementById('cvLegendPop');
        mapDetailWrap = document.getElementById('cvMapDetailWrap');
        fitOverlay();
        window.addEventListener('resize', function () { fitOverlay(); syncMasthead(); drawLeaders(); });
        /* 导航收起/展开（body.nav-collapsed 切换）→ masthead 约束即时归零/恢复 */
        if ('MutationObserver' in window) {
            new MutationObserver(syncMasthead).observe(document.body, { attributes: true, attributeFilter: ['class'] });
        }

        registerDrawer('cal', document.getElementById('drawerCal'));
        registerDrawer('col', document.getElementById('drawerCol'));
        registerDrawer('cur', document.getElementById('drawerCur'));
        registerDrawer('mem', document.getElementById('drawerMem'));
        registerDrawer('atlas', document.getElementById('drawerAtlas'));

        syncMasthead();          // 先量站头：恢复校验与默认 calc() 都依赖 --masthead-h
        restoreWhenViewportSettled(0, innerWidth, innerHeight);
        document.querySelectorAll('.cv-station').forEach(function (s) {
            var key = s.dataset.key;
            s.querySelector('.go').addEventListener('click', function (e) { e.stopPropagation(); toggleDrawer(key); });
            makeDraggable(s, s.querySelector('.head'), function () {
                s.classList.toggle('folded');
                s.querySelector('.fold').textContent = s.classList.contains('folded') ? '+' : '—';
                drawLeaders();
            });
            s.querySelector('.fold').addEventListener('click', function (e) {
                e.stopPropagation();
                s.classList.toggle('folded');
                s.querySelector('.fold').textContent = s.classList.contains('folded') ? '+' : '—';
                drawLeaders();
            });
        });

        topbar = document.getElementById('cvTopbar');
        makeDraggable(topbar, document.getElementById('cvTopbarGrip'), function () {
            topbar.classList.toggle('folded');
        });
        document.getElementById('cvSearchBtn').addEventListener('click', function () {
            openDrawer('atlas');
            setTimeout(function () { var q = document.querySelector('#atlasFilters input[name="query"]'); if (q) q.focus(); }, 320);
        });
        document.getElementById('cvViewHistory').addEventListener('click', function () {
            openDrawer('atlas');
            var b = document.getElementById('atlasTabHistory');
            if (b && b.getAttribute('aria-pressed') !== 'true') b.click();
            this.classList.add('active');
            document.getElementById('cvViewOrgs').classList.remove('active');
        });
        document.getElementById('cvViewOrgs').addEventListener('click', function () {
            openDrawer('atlas');
            var b = document.getElementById('atlasTabOrgs');
            if (b && b.getAttribute('aria-pressed') !== 'true') b.click();
            this.classList.add('active');
            document.getElementById('cvViewHistory').classList.remove('active');
        });
        document.getElementById('cvTourChip').addEventListener('click', function () { tourActive ? stopTour() : startTour(); });
        document.getElementById('cvLegendChip').addEventListener('click', function () { legendPop.classList.toggle('open'); });
        document.getElementById('cvThemeChip').addEventListener('click', function () {
            var t = document.querySelector('.dark-mode-toggle');
            if (t) t.click();
            else {
                var on = !document.documentElement.classList.contains('dark-mode');
                document.documentElement.classList.toggle('dark-mode', on);
                document.body.classList.toggle('dark-mode', on);
                try { localStorage.setItem('darkMode', on ? 'true' : 'false'); } catch (_) { }
            }
        });
        /* 关于 = 重新翻开封面（封面本身即方法与来源的入口） */
        document.getElementById('cvAboutChip').addEventListener('click', function () {
            document.getElementById('cvCover').classList.remove('hidden');
        });

        document.querySelectorAll('.cv-drawer .x').forEach(function (x) {
            x.addEventListener('click', closeDrawers);
        });
        /* 资料库 / 方法与来源 顶层视图切换 */
        document.getElementById('atlasModeLib').addEventListener('click', function () { setAtlasMode('lib'); });
        document.getElementById('atlasModeSources').addEventListener('click', function () { setAtlasMode('sources'); });
        document.querySelectorAll('#drawerAtlas .atlas-tab').forEach(function (b) {
            b.addEventListener('click', function () {
                document.querySelectorAll('#drawerAtlas .atlas-tab').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
            });
        });

        /* 相机控制 */
        document.getElementById('cvFitBtn').addEventListener('click', function () {
            ATLAS.flyToLL([45, 26], 1);
        });
        document.getElementById('cvThemeBtn').addEventListener('click', function () {
            var t = document.querySelector('.dark-mode-toggle');
            if (t) t.click();
        });

        /* 时间之轴：横扫（第二行内连续切换）+ 截面行钉住 */
        var ruler = document.getElementById('cvAxis');
        initAxisPin();
        ruler.addEventListener('pointerdown', function (e) {
            if (e.target.closest('.era-name') || e.target.closest('.era-seg')) return;
            scrubbing = true; scrubLast = null;
            if (ruler.setPointerCapture) { try { ruler.setPointerCapture(e.pointerId); } catch (_) { } }
            scrubAt(e);
        });
        ruler.addEventListener('pointermove', function (e) { if (scrubbing) scrubAt(e); });
        ruler.addEventListener('pointerup', function () { scrubbing = false; });
        ruler.addEventListener('pointercancel', function () { scrubbing = false; });

        /* 单击空白海面 = 收起一切浮层并清空选中（拖动不算点击；铁律 6：关闭是完备交互） */
        var svg = document.getElementById('atlasSvg');
        var svgDown = null;
        svg.addEventListener('pointerdown', function (e) { svgDown = { x: e.clientX, y: e.clientY }; });
        svg.addEventListener('click', function (e) {
            if (!svgDown || Math.hypot(e.clientX - svgDown.x, e.clientY - svgDown.y) > 6) return;
            var blank = e.target.id === 'atlasSphere' || e.target.id === 'atlasSea' || e.target.id === 'atlasGraticule' || e.target === svg;
            if (!blank) return;
            if (tourActive) stopTour();
            closeDrawers();
            legendPop.classList.remove('open');
            if (ATLAS.clearSelection) ATLAS.clearSelection();
        });

        /* 地图详情面板：× 清空选中；显隐由 syncDetailPanel 以 getState() 状态驱动（BUG-1） */
        document.getElementById('cvDetailClose').addEventListener('click', function () {
            if (ATLAS.clearSelection) ATLAS.clearSelection(); else closeDrawers();
        });

        /* 键盘 */
        document.addEventListener('keydown', function (e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
            if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                openDrawer('atlas');
                setTimeout(function () { var q = document.querySelector('#atlasFilters input[name="query"]'); if (q) q.focus(); }, 320);
                return;
            }
            if (e.key === 'Escape') {
                /* 兜底关闭链：封面 → 抽屉 → 图例 → 详情 → 导览 */
                var coverEl = document.getElementById('cvCover');
                if (coverEl && !coverEl.classList.contains('hidden')) { hideCover(); return; }
                if (openDrawerKey) closeDrawers();
                else if (legendPop.classList.contains('open')) legendPop.classList.remove('open');
                else if (mapDetailWrap && mapDetailWrap.classList.contains('open') && ATLAS && ATLAS.clearSelection) ATLAS.clearSelection();
                else if (tourActive) stopTour();
                return;
            }
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                if (tourActive) { tourGo(tourStep + (e.key === 'ArrowRight' ? 1 : -1)); return; }
                tickStep(e.key === 'ArrowRight' ? 1 : -1);
            }
        });

        /* 导览按钮 */
        document.getElementById('cvTourNext').onclick = function () { if (tourStep < TOUR.length - 1) tourGo(tourStep + 1); else stopTour(); };
        document.getElementById('cvTourPrev').onclick = function () { tourGo(tourStep - 1); };
        document.getElementById('cvTourExit').onclick = stopTour;

        /* 封面：HTML 默认渲染为隐藏（BUG-5 处方），仅 !seen 首访时揭开；之后从"关于"唤起 */
        var cover = document.getElementById('cvCover');
        var seen = false;
        try { seen = localStorage.getItem(SEEN_KEY) === '1'; } catch (_) { }
        if (!seen) cover.classList.remove('hidden');
        function hideCover() {
            cover.classList.add('hidden');
            try { localStorage.setItem(SEEN_KEY, '1'); } catch (_) { }
        }
        document.getElementById('cvCoverEnter').onclick = hideCover;
        document.getElementById('cvCoverX').onclick = hideCover;
        document.getElementById('cvCoverAbout').onclick = function () { hideCover(); openDrawer('atlas'); setAtlasMode('sources'); };
        document.getElementById('cvCoverTour').onclick = function () { hideCover(); setTimeout(startTour, 300); };

        /* 站头高度测量已在 init 前段执行（restorePositions 依赖）；此处仅留说明 */

        /* 等地图钩子就绪 */
        waitAtlas(function () {
            try {
                DATA = ATLAS.getData();
                buildEraRow();
                /* 载入不选时代：只陈列时代层（第二层由钉住或选时代唤出）；
                   截面行数据照建（隐藏态），← → 键与 URL 同步照常工作 */
                buildTickRow(null);
                markTick(ATLAS.getState().map.snapshot);
                applyAxisRows();
                ATLAS.onDraw(function () {
                    syncDetailPanel();   /* 内部已含 drawLeaders */
                    /* URL/外部改截面时同步标尺（不回写，避免循环） */
                    var snapNow = ATLAS.getState().map.snapshot;
                    var active = ticks.find(function (t) { return t.classList.contains('active'); });
                    if (active && active.dataset.snap !== snapNow) {
                        var target = ticks.find(function (t) { return t.dataset.snap === snapNow; });
                        if (target) { markTick(snapNow); }
                        else { selectEra(eraOfYear(parseInt((DATA.camps.snapshots.find(function (s) { return s.id === snapNow; }) || {}).date || '0', 10)).id, true); markTick(snapNow); }
                    }
                });
                /* 抽屉内容 */
                document.getElementById('drawerCal').querySelector('.body').innerHTML = calHTML();
                bindCalDrawer(document.getElementById('drawerCal').querySelector('.body'));
                document.getElementById('drawerCol').querySelector('.body').innerHTML = colHTML();
                fetchExtract('international-current.html', function (doc) {
                    return [].map.call(doc.querySelectorAll('.news-item'), function (n) {
                        return {
                            date: n.querySelector('.month') ? n.querySelector('.month').textContent.trim() + '.' + n.querySelector('.day').textContent.trim() : '',
                            title: n.querySelector('.news-title') ? n.querySelector('.news-title').textContent : '',
                            desc: n.querySelector('.news-desc') ? n.querySelector('.news-desc').textContent : '',
                            tag: n.querySelector('.news-tag') ? n.querySelector('.news-tag').textContent.trim() : '',
                            src: (function () { var a = n.querySelector('.news-source'); return a ? { href: a.href, label: a.textContent.replace('↗', '').trim() } : null; })()
                        };
                    });
                }).then(function (items) { document.getElementById('drawerCur').querySelector('.body').innerHTML = curHTML(items); })
                    .catch(function () { document.getElementById('drawerCur').querySelector('.body').innerHTML = '<div class="drawer-fallback">时事室暂未开放，<a href="international-current.html">进入完整页</a>查看。</div>'; });
                fetchExtract('international-memorial.html', function (doc) {
                    return [].map.call(doc.querySelectorAll('.memorial-card'), function (n) {
                        return {
                            name: n.querySelector('.memorial-name') ? n.querySelector('.memorial-name').textContent : '',
                            years: n.querySelector('.memorial-years') ? n.querySelector('.memorial-years').textContent : '',
                            desc: n.querySelector('.memorial-desc') ? n.querySelector('.memorial-desc').textContent : '',
                            quote: n.querySelector('.memorial-quote') ? n.querySelector('.memorial-quote').textContent.replace(/[“”]/g, '') : '',
                            src: (function () { var a = n.querySelector('.quote-source'); return a ? { href: a.href, label: a.textContent.replace('↗', '').trim() } : null; })()
                        };
                    });
                }).then(function (cards) { document.getElementById('drawerMem').querySelector('.body').innerHTML = memHTML(cards); })
                    .catch(function () { document.getElementById('drawerMem').querySelector('.body').innerHTML = '<div class="drawer-fallback">纪念室暂未开放，<a href="international-memorial.html">进入完整页</a>查看。</div>'; });
                /* 南海附图不再预搬挂点：syncDetailPanel 在选中中国时收入详情面板（铁律 9） */
                drawLeaders();
                window.__cvCb = 'done';
            } catch (e) { window.__cvCb = 'error: ' + e.message; console.error('[canvas] atlas-cb', e); }
        });
    }

    /* 站头高度：顶栏与站牌让位；导航收起（translateY 滑走，布局高度不变）时约束归零 */
    function syncMasthead() {
        var h = 0;
        var header = document.querySelector('.site-header');
        if (header && !document.body.classList.contains('nav-collapsed')) h = header.offsetHeight;
        document.documentElement.style.setProperty('--masthead-h', h + 'px');
    }

    function waitAtlas(cb) {
        var n = 0;
        (function poll() {
            ATLAS = window.QMLMInternationalAtlas;
            if (ATLAS && ATLAS.getData && ATLAS.getData() && ATLAS.projectLL && ATLAS.clearSelection) { cb(); return; }
            if (++n > 120) { window.__cvWait = 'timeout'; return; }
            setTimeout(poll, 250);
        })();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            try { init(); window.__cvInit = 'done'; }
            catch (e) { window.__cvInit = 'error: ' + e.message + ' | ' + (e.stack || '').split('\n')[1]; console.error('[canvas] init', e); }
        });
    } else {
        try { init(); window.__cvInit = 'done'; }
        catch (e) { window.__cvInit = 'error: ' + e.message + ' | ' + (e.stack || '').split('\n')[1]; console.error('[canvas] init', e); }
    }
})();
