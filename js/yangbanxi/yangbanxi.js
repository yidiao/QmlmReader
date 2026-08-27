/* ================================================================
   yangbanxi.js — 赛博样板戏 · 生成器 v3
   阶段一 定框架（题材/剧种/幕数/角色/核心唱段）
   阶段二 逐幕协作（AI 写唱词，用户改，可反复重新生成）
   阶段三 提示词（分镜 + AI 生图 prompt，导出）
   依赖：yangbanxi-prompt.js（window.YangbanxiPrompt）
   ================================================================ */
(function () {
  const $ = (s) => document.querySelector(s);

  const THEMES = [
    { id: 'labor', name: '劳动 vs 资本', heroType: '工人', heroDefault: '铁柱', enemyType: '黑心老板', enemyDefault: '周扒皮', massType: '工友', massDefault: '大伙', setting: '当代工厂车间', aria: '劳动者的尊严' },
    { id: 'bureaucracy', name: '群众 vs 官僚', heroType: '基层干部', heroDefault: '青山', enemyType: '腐败官僚', enemyDefault: '钱权', massType: '百姓', massDefault: '乡亲', setting: '基层单位', aria: '为民请命' },
    { id: 'integrity', name: '诚信 vs 造假', heroType: '维权者', heroDefault: '守正', enemyType: '造假者', enemyDefault: '贾仁', massType: '受害者', massDefault: '众人', setting: '市井街巷', aria: '守住良心' },
    { id: 'progress', name: '进步 vs 守旧', heroType: '改革者', heroDefault: '立新', enemyType: '守旧势力', enemyDefault: '陈规', massType: '受旧俗束缚的人', massDefault: '众人', setting: '城乡故土', aria: '破除枷锁' },
    { id: 'environment', name: '环保 vs 逐利', heroType: '环保者', heroDefault: '青山', enemyType: '污染企业', enemyDefault: '黑水', massType: '乡亲', massDefault: '村民', setting: '乡村河畔', aria: '还我青山' },
    { id: 'individual', name: '个体 vs 困境', heroType: '奋斗青年', heroDefault: '远志', enemyType: '焦虑与惰性', enemyDefault: '迷茫', massType: '同龄人', massDefault: '伙伴', setting: '城市出租屋', aria: '逆境奋进' },
  ];
  const GENRES = [
    { id: 'opera', name: '京剧' },
    { id: 'ballet', name: '芭蕾舞剧' },
    { id: 'symphony', name: '交响乐' },
  ];
  const MIDDLE_NAMES = ['初遇', '周旋', '受挫', '交锋', '危机', '发动', '转折', '暗涌', '较量'];
  const DESC_MAP = {
    初遇: '与敌初遇，暗流涌动', 周旋: '与敌周旋，暗藏关键', 受挫: '受挫受难，危机隐现',
    交锋: '正面交锋，一触即发', 危机: '危机爆发，身陷困局', 发动: '发动群众，凝聚力量',
    转折: '形势转折，柳暗花明', 暗涌: '暗中较量，胜负未分', 较量: '针锋相对，高下立判',
  };

  const state = { theme: null, genre: 'opera', actCount: 8, names: {}, aria: '', acts: [] };
  const CN = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

  // ── 幕弧线生成 ──
  function generateActArc() {
    const n = state.actCount;
    const middle = n - 3;
    const acts = [{ name: '亮相', desc: '英雄登场，矛盾初现' }];
    for (let i = 0; i < middle; i++) {
      const name = MIDDLE_NAMES[i % MIDDLE_NAMES.length];
      acts.push({ name, desc: DESC_MAP[name] || '推进矛盾' });
    }
    acts.push({ name: '核心唱段', desc: '情感政治顶点' });
    acts.push({ name: '胜利', desc: '正面交锋，胜利升华' });
    return acts;
  }

  // ── AI 写某一幕（agent 发任务：带全局梗概 + 前文进度 + 第N场 + 核心唱段唯一） ──
  function summarize(content) {
    if (!content) return '（未写）';
    const t = content.replace(/\s+/g, ' ').trim();
    return t.slice(0, 60) + (t.length > 60 ? '…' : '');
  }

  function buildContextForAct(index) {
    const s = state;
    const genreName = GENRES.find((g) => g.id === s.genre).name;
    const plotSummary =
      '本剧为' + genreName + '，题材「' + s.theme.name + '」，主角' + s.names.hero +
      '对抗敌人' + s.names.enemy + '，群众' + s.names.mass + '，核心唱段主题「' + s.aria + '」。' +
      '全剧共' + s.acts.length + '场：' + s.acts.map((a) => a.name).join(' → ') + '。';
    const prevScenes = s.acts.slice(0, index).map((a, i) =>
      '第' + CN[i] + '场「' + a.name + '」' + a.desc + '：' + summarize(a.content)
    );
    return {
      theme: s.theme.name, genre: s.genre,
      hero: s.names.hero, enemy: s.names.enemy, mass: s.names.mass, aria: s.aria,
      actIndex: index + 1, actTotal: s.acts.length,
      actName: s.acts[index].name, actDesc: s.acts[index].desc,
      coreActIndex: s.acts.length - 1,
      plotSummary: plotSummary, prevScenes: prevScenes,
    };
  }

  async function aiWriteAct(index) {
    const act = state.acts[index];
    const ta = document.querySelector(`[data-act-ta="${index}"]`);
    const btn = document.querySelector(`[data-act-ai="${index}"]`);
    btn.disabled = true;
    btn.textContent = 'AI 写作中…';
    try {
      const text = await window.YangbanxiPrompt.generate(buildContextForAct(index));
      act.content = text;
      ta.value = text;
    } catch (err) {
      flash('错误：' + err.message);
    }
    btn.disabled = false;
    btn.textContent = '重新生成';
  }

  async function aiWriteAll() {
    for (let i = 0; i < state.acts.length; i++) {
      await aiWriteAct(i);
    }
  }

  // ── 渲染 ──
  function renderThemePicker() {
    $('#theme-picker').innerHTML = THEMES.map((t) =>
      `<button class="yb-pick" data-theme="${t.id}"><strong>${t.name}</strong><small>${t.heroType} 战 ${t.enemyType}</small></button>`
    ).join('');
  }
  function renderGenrePicker() {
    $('#genre-picker').innerHTML = GENRES.map((g) =>
      `<button class="yb-pick" data-genre="${g.id}"><strong>${g.name}</strong></button>`
    ).join('');
  }
  function renderRoles() {
    const t = state.theme;
    $('#roles-box').innerHTML = [
      { key: 'hero', label: '主角 · ' + t.heroType, val: t.heroDefault },
      { key: 'enemy', label: '敌人 · ' + t.enemyType, val: t.enemyDefault },
      { key: 'mass', label: '群众 · ' + t.massType, val: t.massDefault },
    ].map((r) =>
      `<div class="yb-role"><label class="yb-role-label">${r.label}</label><input type="text" data-role="${r.key}" value="${r.val}"></div>`
    ).join('');
    $('#aria-input').value = t.aria;
  }
  function renderActs() {
    $('#acts-list').innerHTML = state.acts.map((a, i) =>
      `<div class="yb-act-card">
        <div class="yb-act-head">
          <strong>第${CN[i]}幕 · ${a.name}</strong>
          <span>${a.desc}</span>
          <button class="yb-btn-ai" data-act-ai="${i}">AI 写这幕</button>
        </div>
        <textarea class="yb-act-content" data-act-ta="${i}" rows="5" placeholder="（点「AI 写这幕」生成唱词，可修改）"></textarea>
      </div>`
    ).join('');
  }
  function renderShots() {
    const s = state;
    const shots = ['全景', '中景', '特写', '中景', '全景'];
    $('#view-shot').innerHTML = s.acts.map((a, i) =>
      `<div class="yb-shot-item"><div class="yb-shot-head"><strong>第${CN[i]}幕 · ${a.name}</strong><span>${shots[i % shots.length]}</span></div><p class="yb-shot-visual">${a.desc}</p><p class="yb-shot-line">${a.content || '（未生成）'}</p></div>`
    ).join('');
  }
  function renderPrompts() {
    const s = state;
    const shots = ['wide', 'medium', 'close-up', 'medium', 'wide'];
    $('#view-prompt').innerHTML = s.acts.map((a, i) => {
      const prompt = [
        `[第${CN[i]}幕 · ${a.name} · ${shots[i % shots.length]} shot]`,
        `画面：${a.desc}`,
        `情绪/台词：${a.content || ''}`,
        `风格：革命样板戏 · 乡村戏台 · 大红横幅 · 木台 · 三突出（英雄居中） · 朱红与金 · 戏剧追光`,
        `英文：${a.desc} Revolutionary model opera, rural Chinese stage, red banner, wood stage, vermilion red and gold, socialist realist poster, dramatic spotlight, hero centered`,
      ].join('\n');
      return `<div class="yb-prompt-item"><div class="yb-prompt-head">第${CN[i]}幕 · ${a.name}</div><pre>${prompt}</pre></div>`;
    }).join('');
  }

  function switchView(view) {
    ['shot', 'prompt'].forEach((v) => { $('#view-' + v).hidden = (v !== view); });
    document.querySelectorAll('.yb-tab').forEach((t) => t.classList.toggle('active', t.dataset.view === view));
  }

  function exportPrompts() {
    const s = state;
    const text = s.acts.map((a, i) =>
      `【第${CN[i]}幕 · ${a.name}】\n画面：${a.desc}\n台词：${a.content || '（未生成）'}\nPrompt：${a.desc} Revolutionary model opera, rural Chinese stage, red banner, wood stage, vermilion red and gold, socialist realist poster, dramatic spotlight`
    ).join('\n\n---\n\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '赛博样板戏-prompt包.txt';
    a.click();
    flash('已导出 Prompt 包');
  }

  function flash(msg) {
    const el = document.createElement('div');
    el.className = 'yb-flash';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.classList.add('fade'), 1400);
    setTimeout(() => el.remove(), 2000);
  }

  function showStage(n) {
    [1, 2, 3].forEach((i) => { $('#stage-' + i).hidden = (i !== n); });
  }

  function init() {
    renderThemePicker();
    renderGenrePicker();
    $('#api-key').value = window.YangbanxiPrompt.getApiKey();

    $('#theme-picker').addEventListener('click', (e) => {
      const btn = e.target.closest('.yb-pick');
      if (!btn) return;
      document.querySelectorAll('#theme-picker .yb-pick').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.theme = THEMES.find((t) => t.id === btn.dataset.theme);
      renderRoles();
    });
    $('#genre-picker').addEventListener('click', (e) => {
      const btn = e.target.closest('.yb-pick');
      if (!btn) return;
      document.querySelectorAll('#genre-picker .yb-pick').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.genre = btn.dataset.genre;
    });
    $('#act-count').addEventListener('input', (e) => {
      state.actCount = parseInt(e.target.value, 10);
      $('#act-count-val').textContent = state.actCount;
    });

    $('#btn-stage1').addEventListener('click', () => {
      if (!state.theme) { flash('请先选一个矛盾类型'); return; }
      state.names = {
        hero: document.querySelector('[data-role="hero"]').value.trim() || state.theme.heroDefault,
        enemy: document.querySelector('[data-role="enemy"]').value.trim() || state.theme.enemyDefault,
        mass: document.querySelector('[data-role="mass"]').value.trim() || state.theme.massDefault,
      };
      state.aria = $('#aria-input').value.trim() || state.theme.aria;
      const key = $('#api-key').value.trim();
      if (key) window.YangbanxiPrompt.setApiKey(key);
      state.acts = generateActArc();
      renderActs();
      showStage(2);
    });

    $('#acts-list').addEventListener('click', (e) => {
      const btn = e.target.closest('.yb-btn-ai');
      if (btn) aiWriteAct(parseInt(btn.dataset.actAi, 10));
    });
    $('#btn-ai-all').addEventListener('click', aiWriteAll);

    $('#btn-stage2').addEventListener('click', () => {
      renderShots();
      renderPrompts();
      switchView('shot');
      showStage(3);
    });
    ['#btn-back1'].forEach((sel) => { const el = $(sel); if (el) el.addEventListener('click', () => showStage(1)); });
    ['#btn-back2'].forEach((sel) => { const el = $(sel); if (el) el.addEventListener('click', () => showStage(2)); });

    document.querySelectorAll('.yb-tab').forEach((t) => t.addEventListener('click', () => switchView(t.dataset.view)));
    $('#btn-export').addEventListener('click', exportPrompts);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
