/* ================================================================
   ui.js — DOM 渲染与交互
   青马的奇妙冒险 v0.1
   ================================================================ */

const UI = (() => {

  // ── 缓存 DOM 引用 ──────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  let dom = {};

  function cacheDom() {
    dom.titleScreen    = $('#screen-title');
    dom.battleScreen   = $('#screen-battle');
    dom.gameOverScreen = $('#screen-gameover');
    dom.overlayResult  = $('#overlay-result');

    dom.enemyName      = $('#enemy-name');
    dom.enemyFaction   = $('#enemy-faction');
    dom.enemyAvatar    = $('#enemy-avatar');
    dom.enemyContent   = $('#enemy-content');
    dom.optionsContainer = $('#options-container');
    dom.comboIndicator = $('#combo-indicator');
    dom.enemyCard      = $('#enemy-card');
    dom.enemyEliteTag  = $('#enemy-elite-tag');
    dom.enemyEliteHpWrap = $('#enemy-elite-hp-wrap');
    dom.enemyEliteHpLabel = $('#enemy-elite-hp-label');
    dom.enemyEliteHpBar  = $('#enemy-elite-hp-bar');
    dom.enemyEliteHpVal  = $('#enemy-elite-hp-val');
    dom.enemyWeakness    = $('#enemy-weakness');

    dom.statHp         = $('#stat-hp');
    dom.statConfidence = $('#stat-confidence');
    dom.statDialectic  = $('#stat-dialectic');
    dom.statClassStand = $('#stat-classstand');

    dom.statHpBar      = $('#stat-hp .stat-bar-fill');
    dom.statConfBar    = $('#stat-confidence .stat-bar-fill');
    dom.statDialBar    = $('#stat-dialectic .stat-bar-fill');
    dom.statClassBar   = $('#stat-classstand .stat-bar-fill');

    dom.itemPanel      = $('#item-panel');
    dom.itemList       = $('#item-list');
    dom.btnShop        = $('#btn-shop');
    dom.overlayShop    = $('#overlay-shop');
    dom.shopResources  = $('#shop-resources');
    dom.shopList       = $('#shop-list');
    dom.shopClose      = $('#shop-close');
    dom.progressText   = $('#progress-text');
    dom.progressBar    = $('#progress-bar-fill');

    dom.resultTitle    = $('#result-title');
    dom.resultDetail   = $('#result-detail');
    dom.resultStats    = $('#result-stats');
    dom.resultContinue = $('#result-continue');

    dom.comboText      = $('#combo-text');

    dom.gameOverTitle  = $('#gameover-title');
    dom.gameOverSub    = $('#gameover-sub');
    dom.gameOverStats  = $('#gameover-stats');
    dom.gameOverLog    = $('#gameover-log');
    dom.btnRestart     = $('#btn-restart');
    dom.btnStart       = $('#btn-start');
    dom.btnScorecard   = $('#btn-scorecard');

    // 三属性状态条挂 debuff 贴条元素
    [dom.statConfidence, dom.statDialectic, dom.statClassStand].forEach(el => {
      if (!el) return;
      const tag = document.createElement('span');
      tag.className = 'debuff-tag hidden';
      el.appendChild(tag);
    });

    // 测试台
    dom.btnDebug        = $('#btn-debug');
    dom.overlayDebug    = $('#overlay-debug');
    dom.dbgConfidence   = $('#dbg-confidence');
    dom.dbgConfidenceVal = $('#dbg-confidence-val');
    dom.dbgDialectic    = $('#dbg-dialectic');
    dom.dbgDialecticVal = $('#dbg-dialectic-val');
    dom.dbgClassStand   = $('#dbg-classstand');
    dom.dbgClassStandVal = $('#dbg-classstand-val');
    dom.dbgHp           = $('#dbg-hp');
    dom.dbgHpVal        = $('#dbg-hp-val');
    dom.dbgJumpKill     = $('#dbg-jump-kill');
    dom.dbgOpenShop     = $('#dbg-open-shop');
    dom.dbgElite        = $('#dbg-elite');
    dom.dbgGiveItem     = $('#dbg-give-item');
    dom.dbgClose        = $('#dbg-close');

    // 事件
    dom.overlayEvent   = $('#overlay-event');
    dom.eventTitle     = $('#event-title');
    dom.eventDesc      = $('#event-desc');
    dom.eventOptions   = $('#event-options');

    // 图鉴
    dom.btnCodex       = $('#btn-codex');
    dom.overlayCodex   = $('#overlay-codex');
    dom.codexGrid      = $('#codex-grid');
    dom.codexDetail    = $('#codex-detail');
    dom.codexClose     = $('#codex-close');
    dom.sideCodexToggle = $('#side-codex-toggle');
    dom.sideCodex      = $('#side-codex');
    dom.btnEventCodex   = $('#btn-event-codex');
    dom.overlayEventCodex = $('#overlay-event-codex');
    dom.eventCodexGrid  = $('#event-codex-grid');
    dom.eventCodexDetail = $('#event-codex-detail');
    dom.eventCodexClose = $('#event-codex-close');

    // 自制题
    dom.btnCustom      = $('#btn-custom-question');
    dom.overlayCustom  = $('#overlay-custom');
    dom.customEnemy    = $('#custom-enemy');
    dom.customContent  = $('#custom-content');
    dom.customWeakness = $('#custom-weakness');
    dom.customSubmit   = $('#custom-submit');
    dom.customClose    = $('#custom-close');
  }

  // ── 屏幕切换 ────────────────────────────────────────
  function showScreen(screen) {
    [dom.titleScreen, dom.battleScreen, dom.gameOverScreen, dom.dlcScreen].forEach(s => {
      if (s) s.classList.add('hidden');
    });
    if (screen) screen.classList.remove('hidden');
  }

  function showOverlay(overlay) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    // 强制重触发弹窗动画（display 切换不一定自动重播）
    const card = overlay.querySelector('.overlay-card');
    if (card) {
      card.style.animation = 'none';
      void card.offsetWidth;
      card.style.animation = '';
    }
  }

  function hideOverlay(overlay) {
    if (overlay) overlay.classList.add('hidden');
  }

  // ── 渲染战斗界面 ────────────────────────────────────
  function renderBattle(state) {
    const q = state.currentQuestion;
    if (!q) return;

    const enemy = GameEngine.getEnemyInfo(q.enemyType);
    if (!enemy) return;

    // 敌人信息
    dom.enemyName.textContent = enemy.name;
    dom.enemyFaction.textContent = enemy.faction;
    dom.enemyContent.textContent = q.content;
    dom.enemyAvatar.textContent = enemy.name[0];

    // 敌人血量条（普通怪也显示血量）+ 精英标注
    const inBattle = state.eliteBattle && state.eliteBattle.enemyType === q.enemyType;
    if (inBattle) {
      dom.enemyEliteHpWrap.classList.remove('hidden');
      const pct = (state.eliteBattle.hp / state.eliteBattle.maxHp) * 100;
      dom.enemyEliteHpBar.style.width = pct + '%';
      dom.enemyEliteHpVal.textContent = state.eliteBattle.hp;
      if (dom.enemyEliteHpLabel) {
        dom.enemyEliteHpLabel.textContent = state.eliteBattle.isElite ? '精英血量' : '血量';
      }
    } else {
      dom.enemyEliteHpWrap.classList.add('hidden');
    }

    if (inBattle && state.eliteBattle.isElite) {
      dom.enemyCard.classList.add('is-elite');
      dom.enemyEliteTag.textContent = '精英';
      dom.enemyEliteTag.classList.remove('hidden');
      dom.enemyAvatar.style.background = '#c9a84c';
      dom.enemyAvatar.style.color = '#1a1a18';
    } else {
      dom.enemyCard.classList.remove('is-elite');
      dom.enemyEliteTag.classList.add('hidden');
      dom.enemyAvatar.style.background = '#c41e3a';
      dom.enemyAvatar.style.color = '#f4f0e6';
    }

    // 弱点提示（感性弱点特殊标注）
    dom.enemyWeakness.textContent = '弱点：' + q.weakness;
    dom.enemyWeakness.className = 'enemy-weakness' + (q.weakness === ArgumentType.EMOTIONAL ? ' weakness-emotional' : '');

    // 连环指示器
    if (state.comboRemaining > 0) {
      dom.comboIndicator.classList.remove('hidden');
      dom.comboIndicator.textContent = `连环追击 · 剩余 ${state.comboRemaining} 题`;
    } else {
      dom.comboIndicator.classList.add('hidden');
    }

    // 渲染选项
    renderOptions(q, state);

    // 更新状态条
    updateStats(state);
    updateProgress(state);
    updateItemPanel(state);
  }

  function renderOptions(question, state) {
    dom.optionsContainer.innerHTML = '';

    // 分离常规选项（无 requires）与特殊选项（有 requires，如杀招）
    const withIndex = question.options.map((opt, i) => ({ opt, i }));
    const regular = withIndex.filter(x => !x.opt.requires);
    const special = withIndex.filter(x => x.opt.requires);

    // 常规选项打乱渲染
    const order = shuffle(regular.map((_, k) => k));
    order.forEach(k => {
      const { opt, i } = regular[k];
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.dataset.index = i;

      const locked = checkLocked(opt, state);
      if (locked) {
        btn.classList.add('locked');
        btn.innerHTML = `
          <span class="option-type">${opt.type}</span>
          <span class="option-text">${opt.text}</span>
          <span class="option-lock-reason">${locked}</span>
        `;
        btn.disabled = true;
      } else {
        btn.innerHTML = `
          <span class="option-type">${opt.type}</span>
          <span class="option-text">${opt.text}</span>
        `;
        btn.addEventListener('click', () => onOptionClick(i));
      }
      dom.optionsContainer.appendChild(btn);
    });

    // 特殊选项：杀招（需属性解锁，最多 1 个）
    special.slice(0, 1).forEach(({ opt, i }) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn option-special';
      btn.dataset.index = i;
      const locked = checkLocked(opt, state);
      if (locked) {
        btn.classList.add('locked');
        btn.innerHTML = `
          <span class="option-type">${opt.type}</span>
          <span class="option-text">${opt.text}</span>
          <span class="option-lock-reason">${locked}</span>
        `;
        btn.disabled = true;
      } else {
        btn.innerHTML = `
          <span class="option-type">${opt.type}</span>
          <span class="option-text">${opt.text}</span>
        `;
        btn.addEventListener('click', () => onOptionClick(i));
      }
      dom.optionsContainer.appendChild(btn);
    });

    // 特殊选项：置之不理
    const ignoreBtn = document.createElement('button');
    ignoreBtn.className = 'option-btn option-ignore option-special';
    ignoreBtn.innerHTML = `
      <span class="option-type">置之不理</span>
      <span class="option-text">避其锋芒，不与纠缠</span>
      <span class="option-ignore-hint">免于连环追击 · 随机掉 1 点属性</span>
    `;
    ignoreBtn.addEventListener('click', onIgnoreClick);
    dom.optionsContainer.appendChild(ignoreBtn);

    // 特殊选项：教化（可争取敌人，需高觉悟）
    const enemyInfo = ENEMIES[question.enemyType];
    if (enemyInfo && enemyInfo.redeemable) {
      const redeemBtn = document.createElement('button');
      redeemBtn.className = 'option-btn option-special';
      const canRedeem = state.classStand >= 7;
      if (!canRedeem) {
        redeemBtn.classList.add('locked');
        redeemBtn.innerHTML = `
          <span class="option-type">教化</span>
          <span class="option-text">感召对方，化敌为友</span>
          <span class="option-lock-reason">需要阶级觉悟≥7</span>
        `;
        redeemBtn.disabled = true;
      } else {
        redeemBtn.innerHTML = `
          <span class="option-type">教化</span>
          <span class="option-text">感召对方，化敌为友</span>
        `;
        redeemBtn.addEventListener('click', onRedeemClick);
      }
      dom.optionsContainer.appendChild(redeemBtn);
    }

    // 杀招（build / 职业专精）：已解锁杀招按钮
    ULTIMATES.filter(u => state.unlockedUltimates.includes(u.id)).forEach(u => {
      const btn = document.createElement('button');
      btn.className = 'option-btn option-ultimate';
      const usable = GameEngine.canUseUltimate(u.id);
      if (!usable) {
        btn.classList.add('locked');
        let reason = '冷却中';
        if (state.ultimatesCooldown <= 0 && u.condition) {
          reason = state[u.condition.attr] < u.condition.above
            ? `需属性≥${u.condition.above}`
            : `需精准打击×${u.condition.preciseHits}`;
        }
        btn.innerHTML = `
          <span class="option-type">杀招·${u.name}</span>
          <span class="option-text">${u.desc}</span>
          <span class="option-lock-reason">${reason}</span>
        `;
        btn.disabled = true;
      } else {
        btn.innerHTML = `
          <span class="option-type">杀招·${u.name}</span>
          <span class="option-text">${u.desc}</span>
        `;
        btn.addEventListener('click', () => onUltimateClick(u.id));
      }
      dom.optionsContainer.appendChild(btn);
    });
  }

  function checkLocked(option, state) {
    if (state.unlockAllOptions) return null; // 革命战友道具效果
    const names = { confidence: '理论信心', dialectic: '辩证力', classStand: '阶级觉悟' };
    if (option.lockedBy) {
      const { attr, below } = option.lockedBy;
      if (state[attr] < below) {
        return `${names[attr]}不足（需≥${below}）`;
      }
    }
    if (option.requires) {
      const { attr, above } = option.requires;
      if (state[attr] < above) {
        return `${names[attr]}需≥${above}才能施展`;
      }
    }
    // 属性过低锁定：理性→信心、归谬→辩证、阶级批判→觉悟（感性攻击不受属性影响）
    const attrMap = {
      [ArgumentType.RATIONAL]: 'confidence',
      [ArgumentType.REDUCTIO]: 'dialectic',
      [ArgumentType.CLASS_CRITIQUE]: 'classStand',
    };
    const attr = attrMap[option.type];
    if (attr && state[attr] < GAME_CONFIG.lowConfidenceThreshold) {
      return `${names[attr]}不足（${state[attr]}<${GAME_CONFIG.lowConfidenceThreshold}），此选项不可用`;
    }
    return null;
  }

  // ── 选项点击 ────────────────────────────────────────
  let pendingOptionIndex = -1;
  let pendingItemId = null;

  function onOptionClick(index) {
    pendingOptionIndex = index;
    // 道具在答题前通过面板点击设置，答题不再弹窗
    executeResolution();
  }

  function executeResolution() {
    const result = GameEngine.resolveAnswer(pendingOptionIndex, pendingItemId);
    if (!result) return;

    if (result.locked) {
      // 不应该到这里，但做保护
      return;
    }

    pendingItemId = null; // 消耗后清空待生效道具
    showResultOverlay(result);
  }

  // ── 置之不理 ────────────────────────────────────────
  function onIgnoreClick() {
    const result = GameEngine.resolveIgnore();
    if (!result) return;
    showIgnoreResult(result);
  }

  function showIgnoreResult(result) {
    const names = { confidence: '理论信心', dialectic: '辩证力', classStand: '阶级觉悟' };
    dom.resultTitle.textContent = '避其锋芒';
    dom.resultTitle.className = 'result-title result-poor';
    dom.resultDetail.innerHTML =
      `<p>你选择不与敌人纠缠，避开了对方的连环追击。</p>` +
      `<p class="stat-changes">代价：${names[result.ignoreAttr]} -1</p>`;

    const state = GameEngine.getState();
    dom.resultStats.innerHTML = `
      <div class="mini-stat">HP <span class="mini-val">${state.hp}/${GAME_CONFIG.hpMax}</span></div>
      <div class="mini-stat">信心 <span class="mini-val">${state.confidence}</span></div>
      <div class="mini-stat">辩证 <span class="mini-val">${state.dialectic}</span></div>
      <div class="mini-stat">觉悟 <span class="mini-val">${state.classStand}</span></div>
    `;

    dom.comboText.classList.add('hidden');
    showOverlay(dom.overlayResult);

    dom.resultContinue.onclick = () => {
      hideOverlay(dom.overlayResult);
      continueGame();
    };
  }

  // ── 教化 ────────────────────────────────────────
  function onRedeemClick() {
    const result = GameEngine.resolveRedeem();
    if (!result) return;
    showRedeemResult(result);
  }

  function showRedeemResult(result) {
    dom.resultTitle.textContent = '教化成功';
    dom.resultTitle.className = 'result-title result-great';
    dom.resultDetail.innerHTML =
      `<p>对方被你的立场教化，放下成见，成为同志。</p>` +
      `<p class="stat-changes">理论信心 +2 · 阶级觉悟 +1</p>`;
    const state = GameEngine.getState();
    dom.resultStats.innerHTML = `
      <div class="mini-stat">HP <span class="mini-val">${state.hp}/${GAME_CONFIG.hpMax}</span></div>
      <div class="mini-stat">信心 <span class="mini-val">${state.confidence}</span></div>
      <div class="mini-stat">辩证 <span class="mini-val">${state.dialectic}</span></div>
      <div class="mini-stat">觉悟 <span class="mini-val">${state.classStand}</span></div>
    `;
    dom.comboText.classList.add('hidden');
    showOverlay(dom.overlayResult);
    dom.resultContinue.onclick = () => {
      hideOverlay(dom.overlayResult);
      continueGame();
    };
  }

  // ── 杀招释放 ──────────────────────────────────────
  function onUltimateClick(id) {
    const result = GameEngine.useUltimate(id);
    if (!result.ok) {
      flashMessage(result.reason);
      return;
    }
    showUltimateResult(result);
  }

  function showUltimateResult(result) {
    dom.resultTitle.textContent = '杀招释放！';
    dom.resultTitle.className = 'result-title result-great';
    const selfHarmText = result.selfHarm ? `<p class="stat-changes">副作用：HP ${result.selfHarm > 0 ? '+' : ''}${result.selfHarm}</p>` : '';
    dom.resultDetail.innerHTML =
      `<div class="result-damage dmg-great">-${result.damage}</div>` +
      `<p>杀招「${result.ultimate.name}」${result.weaknessMatch ? '（命中弱点！）' : ''}</p>` +
      selfHarmText;
    const state = GameEngine.getState();
    dom.resultStats.innerHTML = `
      <div class="mini-stat">HP <span class="mini-val">${state.hp}/${GAME_CONFIG.hpMax}</span></div>
      <div class="mini-stat">信心 <span class="mini-val">${state.confidence}</span></div>
      <div class="mini-stat">辩证 <span class="mini-val">${state.dialectic}</span></div>
      <div class="mini-stat">觉悟 <span class="mini-val">${state.classStand}</span></div>
    `;
    dom.comboText.classList.add('hidden');
    showOverlay(dom.overlayResult);
    dom.resultContinue.onclick = () => {
      hideOverlay(dom.overlayResult);
      continueGame();
    };
  }

  // ── 道具选择弹窗 ────────────────────────────────────
  function showItemPicker(items, onSelect, onSkip) {
    // 简单实现：创建一个临时弹窗
    const overlay = document.createElement('div');
    overlay.className = 'item-picker-overlay';
    overlay.innerHTML = `
      <div class="item-picker-card">
        <h3>使用道具？</h3>
        <div class="item-picker-list"></div>
        <button class="btn btn-skip">不使用道具</button>
      </div>
    `;
    document.body.appendChild(overlay);

    const list = overlay.querySelector('.item-picker-list');
    items.forEach(item => {
      const btn = document.createElement('button');
      btn.className = 'item-picker-item';
      btn.innerHTML = `<span class="item-icon">${item.icon}</span> ${item.name}<br><small>${item.desc}</small>`;
      btn.addEventListener('click', () => {
        document.body.removeChild(overlay);
        onSelect(item.id);
      });
      list.appendChild(btn);
    });

    overlay.querySelector('.btn-skip').addEventListener('click', () => {
      document.body.removeChild(overlay);
      onSkip();
    });
  }

  // ── 商店 ────────────────────────────────────────
  const SHOP_CURRENCY_NAMES = { confidence: '理论信心', dialectic: '辩证力', classStand: '阶级觉悟', hp: 'HP' };

  let shopFromEvent = false;
  let shopAfterBoss = false;

  function openShop(fromEvent) {
    shopFromEvent = !!fromEvent;
    renderShop();
    showOverlay(dom.overlayShop);
  }

  function openShopAfterBoss() {
    shopAfterBoss = true;
    renderShop();
    showOverlay(dom.overlayShop);
  }

  function closeShop() {
    hideOverlay(dom.overlayShop);
    if (shopFromEvent) {
      shopFromEvent = false;
      const nextQ = GameEngine.drawNextQuestion();
      if (!nextQ) { showGameOver(GameEngine.getState()); return; }
      renderBattle(GameEngine.getState());
    } else if (shopAfterBoss) {
      shopAfterBoss = false;
      continueGame();
    }
  }

  function renderShop() {
    const state = GameEngine.getState();

    dom.shopResources.innerHTML = `
      <span class="shop-res">HP <b>${state.hp}</b></span>
      <span class="shop-res">信心 <b>${state.confidence}</b></span>
      <span class="shop-res">辩证 <b>${state.dialectic}</b></span>
      <span class="shop-res">觉悟 <b>${state.classStand}</b></span>
      <span class="shop-res">道具 <b>${state.items.length}/${GAME_CONFIG.maxItems}</b></span>
    `;

    const itemHtml = ITEMS.map(item => {
      const { currency, cost } = item.price;
      const affordable = currency === 'hp' ? state.hp > cost : state[currency] >= cost;
      return `
        <div class="shop-item ${affordable ? '' : 'unaffordable'}">
          <div class="shop-item-info">
            <span class="shop-item-icon">${item.icon}</span>
            <div class="shop-item-text">
              <div class="shop-item-name">${item.name}</div>
              <div class="shop-item-desc">${item.desc}</div>
            </div>
          </div>
          <button class="shop-buy" data-shop-buy="${item.id}" ${affordable ? '' : 'disabled'}>
            购 ${SHOP_CURRENCY_NAMES[currency]}${cost}
          </button>
        </div>
      `;
    }).join('');

    const ultimateHtml = `
      <div class="shop-ultimate-title">杀招 · 职业专精</div>
      ${ULTIMATES.map(u => {
        const unlocked = state.unlockedUltimates.includes(u.id);
        return `
          <div class="shop-item ${unlocked ? 'unaffordable' : ''}">
            <div class="shop-item-info">
              <span class="shop-item-icon">★</span>
              <div class="shop-item-text">
                <div class="shop-item-name">${u.name}${unlocked ? '（已解锁）' : ''}</div>
                <div class="shop-item-desc">${u.desc}</div>
              </div>
            </div>
            <button class="shop-buy" data-shop-ultimate="${u.id}" ${unlocked ? 'disabled' : ''}>解锁</button>
          </div>
        `;
      }).join('')}
    `;

    dom.shopList.innerHTML = itemHtml + ultimateHtml;

    dom.shopList.querySelectorAll('[data-shop-buy]').forEach(btn => {
      btn.addEventListener('click', () => {
        const result = GameEngine.buyItem(btn.dataset.shopBuy);
        if (result.ok) {
          flashMessage(`购入「${result.item.name}」`);
          renderShop();
        } else {
          flashMessage(result.reason);
        }
      });
    });

    dom.shopList.querySelectorAll('[data-shop-ultimate]').forEach(btn => {
      btn.addEventListener('click', () => {
        const ok = GameEngine.unlockUltimate(btn.dataset.shopUltimate);
        if (ok) {
          flashMessage('解锁杀招！');
          renderShop();
        }
      });
    });
  }

  // ── 测试台 ──────────────────────────────────────
  function openDebug() {
    if (!GameEngine.getState().currentQuestion) {
      startGame();
    }
    syncDebugSliders();
    showOverlay(dom.overlayDebug);
  }

  function closeDebug() {
    hideOverlay(dom.overlayDebug);
  }

  function syncDebugSliders() {
    const state = GameEngine.getState();
    dom.dbgConfidence.value = state.confidence;
    dom.dbgConfidenceVal.textContent = state.confidence;
    dom.dbgDialectic.value = state.dialectic;
    dom.dbgDialecticVal.textContent = state.dialectic;
    dom.dbgClassStand.value = state.classStand;
    dom.dbgClassStandVal.textContent = state.classStand;
    dom.dbgHp.value = state.hp;
    dom.dbgHpVal.textContent = state.hp;
  }

  function bindDebugSlider(input, valEl, attr) {
    input.addEventListener('input', () => {
      const v = parseInt(input.value, 10);
      valEl.textContent = v;
      GameEngine.debugSetStat(attr, v);
      renderBattle(GameEngine.getState());
    });
  }

  function initDebug() {
    bindDebugSlider(dom.dbgConfidence, dom.dbgConfidenceVal, 'confidence');
    bindDebugSlider(dom.dbgDialectic, dom.dbgDialecticVal, 'dialectic');
    bindDebugSlider(dom.dbgClassStand, dom.dbgClassStandVal, 'classStand');
    bindDebugSlider(dom.dbgHp, dom.dbgHpVal, 'hp');

    dom.dbgJumpKill.addEventListener('click', () => {
      GameEngine.debugJumpTo('huang_han_01');
      closeDebug();
      renderBattle(GameEngine.getState());
    });
    dom.dbgOpenShop.addEventListener('click', () => {
      closeDebug();
      openShop();
    });
    dom.dbgElite.addEventListener('click', () => {
      GameEngine.debugTriggerElite();
      closeDebug();
      renderBattle(GameEngine.getState());
    });
    dom.dbgGiveItem.addEventListener('click', () => {
      const item = GameEngine.debugGiveItem();
      if (item) {
        renderBattle(GameEngine.getState());
        flashMessage('发放道具「' + item.name + '」');
      } else {
        flashMessage('道具已满或无可发');
      }
    });
    dom.dbgClose.addEventListener('click', closeDebug);
  }

  // ── 事件系统 ──────────────────────────────────────
  function formatEffectText(effect) {
    const parts = [];
    const names = { confidence: '信心', dialectic: '辩证', classStand: '觉悟', hp: 'HP' };
    for (const k in (effect || {})) {
      if (k === 'flag') continue;
      const v = effect[k];
      if (!v) continue;
      parts.push(`${names[k] || k}${v > 0 ? '+' : ''}${v}`);
    }
    return parts.join(' · ');
  }

  function showRandomEvent() {
    const state = GameEngine.getState();
    const tier = Math.min(2, Math.floor(state.questionIndex / 10));
    const negative = EVENTS.filter(e => e.negative);
    const others = EVENTS.filter(e => !e.negative);
    let negProb = [0.12, 0.22, 0.35][tier];
    if (state.eventGuardTurns > 0) negProb /= 2;
    let ev;
    if (negative.length && Math.random() < negProb) {
      ev = negative[Math.floor(Math.random() * negative.length)];
    } else {
      ev = others[Math.floor(Math.random() * others.length)];
    }
    renderEvent(ev);
  }

  function renderEvent(ev) {
    if (ev.shop) {
      openShop(true);
      return;
    }
    dom.eventTitle.textContent = ev.title;
    dom.eventDesc.textContent = ev.desc;

    if (ev.chooseEnemy) {
      dom.eventOptions.innerHTML = Object.keys(ENEMIES).map(key => {
        const e = ENEMIES[key];
        return `<button class="option-btn event-enemy" data-enemy="${key}">
          <span class="option-type">${e.faction}</span>
          <span class="option-text">${e.name}</span>
        </button>`;
      }).join('');
      dom.eventOptions.querySelectorAll('[data-enemy]').forEach(btn => {
        btn.onclick = () => {
          GameEngine.drawEnemyQuestion(btn.dataset.enemy);
          hideOverlay(dom.overlayEvent);
          renderBattle(GameEngine.getState());
        };
      });
    } else {
      dom.eventOptions.innerHTML = ev.options.map((opt, i) => {
        const fx = formatEffectText(opt.effect);
        return `<button class="option-btn event-opt" data-event-opt="${i}">
          <span class="option-text">${opt.text}</span>
          ${fx ? `<span class="event-effect">${fx}</span>` : ''}
        </button>`;
      }).join('');
      dom.eventOptions.querySelectorAll('[data-event-opt]').forEach(btn => {
        btn.onclick = () => {
          const opt = ev.options[parseInt(btn.dataset.eventOpt, 10)];
          GameEngine.applyEventEffect(opt.effect || {});
          hideOverlay(dom.overlayEvent);
          const fx = formatEffectText(opt.effect || {});
          if (fx) flashMessage(fx);
          const nextQ = GameEngine.drawNextQuestion();
          if (!nextQ) { showGameOver(GameEngine.getState()); return; }
          renderBattle(GameEngine.getState());
        };
      });
    }

    showOverlay(dom.overlayEvent);
  }

  // ── 图鉴 / 敌人档案 ──────────────────────────────
  function openCodex() {
    renderCodex();
    showOverlay(dom.overlayCodex);
  }

  function closeCodex() {
    hideOverlay(dom.overlayCodex);
  }

  function renderCodex(initialKey) {
    // 渲染图标网格（植物大战僵尸式）
    dom.codexGrid.innerHTML = Object.keys(ENEMIES).map(key => {
      const e = ENEMIES[key];
      return `<button class="codex-grid-item" data-enemy="${key}">
        <img src="../../images/icons/qingma/${key}.png" alt="${e.name}" onerror="this.style.visibility='hidden'">
        <span class="codex-grid-name">${e.name}</span>
      </button>`;
    }).join('');

    dom.codexGrid.querySelectorAll('.codex-grid-item').forEach(btn => {
      btn.addEventListener('click', () => {
        dom.codexGrid.querySelectorAll('.codex-grid-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderCodexDetail(btn.dataset.enemy);
      });
    });

    const key = initialKey || Object.keys(ENEMIES)[0];
    if (key) {
      renderCodexDetail(key);
      const targetBtn = dom.codexGrid.querySelector(`[data-enemy="${key}"]`);
      if (targetBtn) targetBtn.classList.add('active');
    }
  }

  function renderCodexDetail(key) {
    const e = ENEMIES[key];
    if (!e) return;
    const spec = ENEMY_SPECIALS[key] || {};
    dom.codexDetail.innerHTML = `
      <div class="codex-detail-head">
        <div class="codex-detail-img">
          <img src="../../images/icons/qingma/${key}.png" alt="${e.name}" onerror="this.style.visibility='hidden'">
        </div>
        <div class="codex-detail-title">
          <div class="codex-detail-name">${e.name}</div>
          <div class="codex-detail-faction">${e.faction}</div>
        </div>
      </div>
      <div class="codex-detail-stats">
        <span class="codex-stat">血量 ${e.hp}</span>
        <span class="codex-stat">弱点 ${e.weakness}</span>
      </div>
      <div class="codex-detail-block">
        <div class="codex-block-label">特点</div>
        <div class="codex-detail-desc">${spec.trait || e.desc}</div>
      </div>
      <div class="codex-detail-block">
        <div class="codex-block-label">特殊能力</div>
        <div class="codex-detail-guide">${spec.special || '无'}</div>
      </div>
      <div class="codex-detail-block">
        <div class="codex-block-label">常见话术</div>
        <div class="codex-detail-taunt">${e.taunt}</div>
      </div>
      <div class="codex-detail-block">
        <div class="codex-block-label">原型</div>
        <div class="codex-detail-desc">${e.desc}</div>
      </div>
      <div class="codex-detail-block">
        <div class="codex-block-label">攻略</div>
        <div class="codex-detail-guide">${e.guide}</div>
      </div>
      <div class="codex-detail-block">
        <div class="codex-block-label">档案小故事</div>
        <div class="codex-detail-story">${e.story}</div>
      </div>
    `;
  }

  // 折叠图鉴（右边竖列）
  function renderSideCodex() {
    dom.sideCodex.innerHTML = Object.keys(ENEMIES).map(key => {
      const e = ENEMIES[key];
      return `<button class="side-codex-item" data-enemy="${key}" title="${e.name}">
        <img src="../../images/icons/qingma/${key}.png" alt="${e.name}" onerror="this.textContent='${e.name[0]}'">
      </button>`;
    }).join('');
    dom.sideCodex.querySelectorAll('.side-codex-item').forEach(btn => {
      btn.addEventListener('click', () => {
        renderCodex(btn.dataset.enemy);
        showOverlay(dom.overlayCodex);
      });
    });
  }

  function toggleSideCodex() {
    const hidden = dom.sideCodex.classList.contains('hidden');
    if (hidden) {
      renderSideCodex();
      dom.sideCodex.classList.remove('hidden');
      dom.sideCodexToggle.textContent = '敌人图鉴 ▴';
    } else {
      dom.sideCodex.classList.add('hidden');
      dom.sideCodexToggle.textContent = '敌人图鉴 ▾';
    }
  }

  // 事件图鉴
  function openEventCodex() {
    renderEventCodex();
    showOverlay(dom.overlayEventCodex);
  }

  function closeEventCodex() {
    hideOverlay(dom.overlayEventCodex);
  }

  function renderEventCodex() {
    const EVENT_ICONS = { rally: '🏙', reading: '📖', comrade_hurt: '🤝', choose_enemy: '⚔', shop: '📚' };
    dom.eventCodexGrid.innerHTML = EVENTS.map(ev => {
      const icon = EVENT_ICONS[ev.id] || '◆';
      return `<button class="codex-grid-item" data-event="${ev.id}">
        <span class="codex-grid-emoji">${icon}</span>
        <span class="codex-grid-name">${ev.title}</span>
      </button>`;
    }).join('');

    dom.eventCodexGrid.querySelectorAll('.codex-grid-item').forEach(btn => {
      btn.addEventListener('click', () => {
        dom.eventCodexGrid.querySelectorAll('.codex-grid-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderEventCodexDetail(btn.dataset.event);
      });
    });

    const firstEv = EVENTS[0];
    if (firstEv) {
      renderEventCodexDetail(firstEv.id);
      const firstBtn = dom.eventCodexGrid.querySelector(`[data-event="${firstEv.id}"]`);
      if (firstBtn) firstBtn.classList.add('active');
    }
  }

  function renderEventCodexDetail(id) {
    const ev = EVENTS.find(x => x.id === id);
    if (!ev) return;
    const tag = ev.shop ? '商店' : ev.chooseEnemy ? '选敌' : '事件';
    const effects = ev.options.map(o => `${o.text}（${formatEffectText(o.effect)}）`).join('<br>');
    dom.eventCodexDetail.innerHTML = `
      <div class="codex-detail-name">${ev.title}</div>
      <div class="codex-detail-faction">${tag}</div>
      <div class="codex-detail-desc">${ev.desc}</div>
      ${effects ? `<div class="codex-detail-guide">选项：<br>${effects}</div>` : ''}
    `;
  }

  // ── 战绩卡 ──────────────────────────────────────
  function generateScoreCard() {
    const state = GameEngine.getState();
    const W = 640, H = 900;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f4f0e6';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#c41e3a';
    ctx.lineWidth = 12;
    ctx.strokeRect(20, 20, W - 40, H - 40);

    ctx.fillStyle = '#1a1a18';
    ctx.font = 'bold 44px "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('青 马 战 绩', W / 2, 90);

    ctx.fillStyle = state.victory ? '#2c7a2c' : '#c41e3a';
    ctx.font = 'bold 30px "PingFang SC", sans-serif';
    ctx.fillText(state.victory ? '闯 关 成 功' : '被错误思想吞噬', W / 2, 150);

    ctx.strokeStyle = '#c9a84c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 180); ctx.lineTo(W - 60, 180);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#c9a84c';
    ctx.font = 'bold 22px "PingFang SC", sans-serif';
    ctx.fillText('战役数据', 70, 230);

    const rows = [
      ['完成题数', `${state.questionIndex} / ${state.totalQuestions}`],
      ['剩余血量', `${state.hp} / ${GAME_CONFIG.hpMax}`],
      ['理论信心', state.confidence],
      ['辩证力', state.dialectic],
      ['阶级觉悟', state.classStand],
    ];
    rows.forEach(([label, val], i) => {
      const y = 280 + i * 44;
      ctx.fillStyle = '#888';
      ctx.font = '22px "PingFang SC", sans-serif';
      ctx.fillText(label, 70, y);
      ctx.fillStyle = '#1a1a18';
      ctx.textAlign = 'right';
      ctx.fillText(String(val), W - 70, y);
      ctx.textAlign = 'left';
    });

    ctx.fillStyle = '#c9a84c';
    ctx.font = 'bold 22px "PingFang SC", sans-serif';
    ctx.fillText('击败的敌人', 70, 540);

    const defeated = [...(state.defeatedEnemies || [])].map(k => ENEMIES[k] ? ENEMIES[k].name : null).filter(Boolean);
    ctx.fillStyle = '#1a1a18';
    ctx.font = '18px "PingFang SC", sans-serif';
    if (defeated.length === 0) {
      ctx.fillText('（无）', 70, 580);
    } else {
      defeated.forEach((name, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        ctx.fillText(name, 70 + col * 130, 580 + row * 34);
      });
    }

    const link = document.createElement('a');
    link.download = '青马战绩.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    flashMessage('战绩卡已生成');
  }

  // ── 自制题 ──────────────────────────────────────
  function openCustom() {
    dom.customEnemy.innerHTML = Object.keys(ENEMIES).map(key => {
      return `<option value="${key}">${ENEMIES[key].name}（${ENEMIES[key].faction}）</option>`;
    }).join('');
    dom.customContent.value = '';
    showOverlay(dom.overlayCustom);
  }

  function closeCustom() {
    hideOverlay(dom.overlayCustom);
  }

  function submitCustom() {
    const enemyType = dom.customEnemy.value;
    const content = dom.customContent.value.trim();
    const weakness = dom.customWeakness.value;
    if (!content) { flashMessage('请填写题目内容'); return; }
    const q = {
      id: 'custom_' + Date.now(),
      enemyType,
      content,
      weakness,
      custom: true,
    };
    const ok = GameEngine.addCustomQuestion(q);
    if (ok) {
      closeCustom();
      flashMessage('自制题已提交，可在简答题模式中抽到');
    } else {
      flashMessage('提交失败（存储不可用）');
    }
  }

  // ── 结果显示 ────────────────────────────────────────
  function showResultOverlay(result) {
    const { option, totalDamage, weaknessMatch, comboTriggered, statChanges } = result;

    // 标题
    if (totalDamage >= 3) {
      dom.resultTitle.textContent = '精准打击！';
      dom.resultTitle.className = 'result-title result-great';
    } else if (totalDamage >= 2) {
      dom.resultTitle.textContent = '有效命中';
      dom.resultTitle.className = 'result-title result-good';
    } else {
      dom.resultTitle.textContent = '收效甚微';
      dom.resultTitle.className = 'result-title result-poor';
    }

    // 详情（含大号伤害数字）
    const dmgClass = totalDamage >= 3 ? 'dmg-great' : totalDamage >= 2 ? 'dmg-good' : 'dmg-poor';
    let detailHtml = `<div class="result-damage ${dmgClass}">-${totalDamage}</div>`;
    detailHtml += `<p>论证类型：<strong>${option.type}</strong> · ${'★'.repeat(option.stars)}</p>`;
    if (weaknessMatch) detailHtml += `<p><span class="bonus-tag">论证匹配 +1</span></p>`;
    if (result.itemUsed) detailHtml += `<p><span class="bonus-tag">道具：${result.itemUsed.name}</span></p>`;
    if (result.eliteDefeated) {
      detailHtml += result.isElite
        ? `<p class="elite-defeat">精英怪被击败！</p>`
        : `<p class="elite-defeat">敌人被击败</p>`;
    } else if (result.eliteHp !== null && result.eliteHp > 0) {
      detailHtml += `<p class="elite-remain">${result.isElite ? '精英怪' : '敌人'}还剩 ${result.eliteHp} 点血量</p>`;
    }

    // 属性变化
    const changes = [];
    if (statChanges.confidence) changes.push(`理论信心 ${statChanges.confidence > 0 ? '+' : ''}${statChanges.confidence}`);
    if (statChanges.dialectic) changes.push(`辩证力 ${statChanges.dialectic > 0 ? '+' : ''}${statChanges.dialectic}`);
    if (statChanges.classStand) changes.push(`阶级觉悟 ${statChanges.classStand > 0 ? '+' : ''}${statChanges.classStand}`);
    if (changes.length > 0) {
      detailHtml += `<p class="stat-changes">${changes.join(' · ')}</p>`;
    }

    // 精英掉落
    if (result.eliteDrop) {
      detailHtml += `<p class="elite-drop">击败精英！获得 <strong>${result.eliteDrop.icon} ${result.eliteDrop.name}</strong></p>`;
    }

    dom.resultDetail.innerHTML = detailHtml;

    // 敌人受击动效
    dom.enemyCard.classList.add('shake');
    setTimeout(() => dom.enemyCard.classList.remove('shake'), 450);

    // 属性条
    const state = GameEngine.getState();
    dom.resultStats.innerHTML = `
      <div class="mini-stat">HP <span class="mini-val">${state.hp}/${GAME_CONFIG.hpMax}</span></div>
      <div class="mini-stat">信心 <span class="mini-val">${state.confidence}</span></div>
      <div class="mini-stat">辩证 <span class="mini-val">${state.dialectic}</span></div>
      <div class="mini-stat">觉悟 <span class="mini-val">${state.classStand}</span></div>
    `;

    // 连环提示
    if (comboTriggered && comboTriggered.triggered) {
      dom.comboText.textContent = comboTriggered.reason;
      dom.comboText.classList.remove('hidden');
    } else {
      dom.comboText.classList.add('hidden');
    }

    showOverlay(dom.overlayResult);

    // 继续按钮
    dom.resultContinue.onclick = () => {
      hideOverlay(dom.overlayResult);
      continueGame();
    };
  }

  // ── 继续游戏 ────────────────────────────────────────
  function continueGame() {
    const state = GameEngine.getState();

    if (state.gameOver) {
      showGameOver(state);
      return;
    }

    // 仅当一个敌人遭遇结束（击败/跳过/教化后 eliteBattle 已清空）才推进关卡并触发 BOSS/事件；
    // 连环追问（同一个敌人还没死）不触发这些。
    if (!state.eliteBattle) {
      const interval = GAME_CONFIG.questionsPerRun / 3;
      const nextMilestone = (state.bossIndex + 1) * interval;
      if (state.questionIndex >= nextMilestone && state.bossIndex < 3) {
        startBossBattle();
        return;
      }
      if (Math.random() < 0.2) {
        showRandomEvent();
        return;
      }
    }

    const nextQ = GameEngine.drawNextQuestion();
    if (!nextQ) {
      showGameOver(GameEngine.getState());
      return;
    }

    renderBattle(GameEngine.getState());
  }

  // ── BOSS 战（三段论证） ────────────────────────────
  function startBossBattle() {
    const boss = GameEngine.startBossBattle();
    showScreen(dom.battleScreen);
    showBossIntro(boss.title, () => renderBossBattle());
  }

  function showBossIntro(title, onDone) {
    const banner = document.createElement('div');
    banner.className = 'boss-intro-banner';
    banner.innerHTML = `<div class="boss-intro-title">BOSS · ${title}</div>`;
    document.body.appendChild(banner);
    setTimeout(() => {
      document.body.removeChild(banner);
      onDone();
    }, 1800);
  }

  function renderBossBattle() {
    const boss = GameEngine.getBossBattle();
    if (!boss) return;
    const enemy = GameEngine.getEnemyInfo(boss.enemyType);

    dom.enemyName.textContent = boss.title;
    dom.enemyFaction.textContent = 'BOSS · ' + (enemy ? enemy.faction : '');
    dom.enemyContent.textContent = enemy ? enemy.taunt : '';
    dom.enemyAvatar.textContent = enemy ? enemy.name[0] : 'BOSS';
    dom.enemyCard.classList.add('is-elite');
    dom.enemyEliteTag.classList.remove('hidden');
    dom.enemyEliteTag.textContent = 'BOSS';
    dom.enemyAvatar.style.background = '#8b1a2b';
    dom.enemyAvatar.style.color = '#f4f0e6';

    // BOSS 血量条
    dom.enemyEliteHpWrap.classList.remove('hidden');
    const pct = (boss.hp / boss.maxHp) * 100;
    dom.enemyEliteHpBar.style.width = pct + '%';
    dom.enemyEliteHpVal.textContent = boss.hp;
    if (dom.enemyEliteHpLabel) dom.enemyEliteHpLabel.textContent = 'BOSS 血量';

    // 姿态 + 克制提示（意图可见，彩色闪烁）
    const stanceClass = {
      [BossStance.ATTACK]: 'stance-attack',
      [BossStance.DEFEND]: 'stance-defend',
      [BossStance.PROVOKE]: 'stance-provoke',
    }[boss.stance] || '';
    dom.enemyWeakness.textContent = `姿态：${boss.stance}`;
    dom.enemyWeakness.className = 'enemy-weakness ' + stanceClass;

    // 论证链（论点 → 论据 → 反击）
    const chainLabels = ['论点', '论据', '反击'];
    const chainText = chainLabels.map((label, i) => {
      if (i < boss.chain) return `${label}✓`;
      if (i === boss.chain) return `▶${label}`;
      return label;
    }).join(' → ');
    dom.comboIndicator.classList.remove('hidden');
    dom.comboIndicator.textContent = `论证链：${chainText}　|　攻←归谬 · 守←理性 · 挑衅←阶级`;

    // 当前步（论点/论据/反击）的论证选项
    const stepDef = BOSS_ARG_STEPS[boss.chain] || BOSS_ARG_STEPS[0];
    dom.optionsContainer.innerHTML = '';
    stepDef.options.forEach(arg => {
      const sealed = boss.sealedType === arg.type;
      const btn = document.createElement('button');
      btn.className = 'option-btn option-boss';
      if (sealed) {
        btn.classList.add('locked');
        btn.innerHTML = `
          <span class="option-type">${arg.type}</span>
          <span class="option-text">${arg.text}</span>
          <span class="option-lock-reason">被封印</span>
        `;
        btn.disabled = true;
      } else {
        btn.innerHTML = `
          <span class="option-type">${arg.type}</span>
          <span class="option-text">${arg.text}</span>
        `;
        btn.addEventListener('click', () => onBossStepClick(arg.type));
      }
      dom.optionsContainer.appendChild(btn);
    });

    updateStats(GameEngine.getState());
    updateProgress(GameEngine.getState());
    updateItemPanel(GameEngine.getState());
  }

  function onBossStepClick(type) {
    const result = GameEngine.resolveBossStep(type);
    if (!result) return;

    if (result.success) {
      flashMessage(result.finisher
        ? `三段论证成立！杀招对 BOSS 造成 ${result.damage} 伤害！`
        : `拆招成功！造成 ${result.damage} 伤害，论证链 +1`);
    } else if (result.stance === BossStance.ATTACK) {
      flashMessage(`拆招失败！BOSS 攻势凌厉，你 -${result.playerDamage} HP，论证链被打断`);
    } else if (result.stance === BossStance.DEFEND) {
      flashMessage(`拆招失败！BOSS 固守，恢复 ${result.bossHeal} HP，论证链被打断`);
    } else {
      flashMessage(`拆招失败！BOSS 挑衅动摇军心，${result.attrDebuff} -1，论证链被打断`);
    }

    if (result.bossDefeated) {
      onBossDefeated();
      return;
    }
    if (result.playerDead) {
      showGameOver(GameEngine.getState());
      return;
    }
    renderBossBattle();
  }

  function onBossDefeated() {
    const boss = GameEngine.getBossBattle();
    const title = boss ? boss.title : 'BOSS';
    GameEngine.finishBossBattle();
    flashMessage(`击败 ${title}！`);
    // 击败 BOSS 后必接商店（#6 将升级为杀招 build 商店）
    setTimeout(() => openShopAfterBoss(), 1200);
  }

  // ── 游戏结束 ────────────────────────────────────────
  function showGameOver(state) {
    showScreen(dom.gameOverScreen);

    // 保存最佳战绩
    if (state.victory) {
      try {
        const best = parseInt(localStorage.getItem('qingma_best') || '0', 10);
        if (state.questionIndex > best) {
          localStorage.setItem('qingma_best', String(state.questionIndex));
        }
      } catch (e) { /* 忽略 */ }
    }

    if (state.victory) {
      dom.gameOverTitle.textContent = '闯关成功';
      dom.gameOverSub.textContent = `你以坚定的马克思主义立场，击败了全部 ${state.totalQuestions} 个敌人，捍卫了真理。`;
    } else {
      dom.gameOverTitle.textContent = '被错误思想吞噬';
      dom.gameOverSub.textContent = `第 ${state.questionIndex} 个敌人面前，你败下阵来。理论不精、立场不坚，就会在舆论场上迷失方向。`;
    }

    dom.gameOverStats.innerHTML = `
      <div class="final-stat">
        <span class="final-label">击败敌人</span>
        <span class="final-value">${state.questionIndex} / ${state.totalQuestions}</span>
      </div>
      <div class="final-stat">
        <span class="final-label">总伤害输出</span>
        <span class="final-value">${state.totalDamageDealt}</span>
      </div>
      <div class="final-stat">
        <span class="final-label">承受伤害</span>
        <span class="final-value">${state.totalDamageTaken}</span>
      </div>
      <div class="final-stat">
        <span class="final-label">剩余血量</span>
        <span class="final-value">${state.hp} / ${GAME_CONFIG.hpMax}</span>
      </div>
      <div class="final-stat">
        <span class="final-label">理论信心</span>
        <span class="final-value">${state.confidence}</span>
      </div>
      <div class="final-stat">
        <span class="final-label">辩证力</span>
        <span class="final-value">${state.dialectic}</span>
      </div>
      <div class="final-stat">
        <span class="final-label">阶级觉悟</span>
        <span class="final-value">${state.classStand}</span>
      </div>
    `;

    // 按敌人聚合总伤害（不再是逐题重复）
    const dmgByEnemy = {};
    state.log.forEach(entry => {
      dmgByEnemy[entry.enemyType] = (dmgByEnemy[entry.enemyType] || 0) + entry.totalDamage;
    });
    const logHtml = Object.entries(dmgByEnemy)
      .sort((a, b) => b[1] - a[1])
      .map(([enemyType, dmg]) => {
        const enemy = ENEMIES[enemyType];
        const tier = dmg >= 6 ? 'good' : dmg >= 3 ? 'ok' : 'bad';
        return `<li class="log-entry log-${tier}">
          <span class="log-icon">${dmg >= 6 ? '✓' : dmg >= 3 ? '~' : '✗'}</span>
          <span class="log-enemy">${enemy ? enemy.name : '?'}</span>
          <span class="log-dmg">总伤害 ${dmg}</span>
        </li>`;
      }).join('');

    dom.gameOverLog.innerHTML = `<ul class="log-list">${logHtml}</ul>`;
  }

  // ── 更新状态条 ──────────────────────────────────────
  function updateStats(state) {
    dom.statHpBar.style.width = `${(state.hp / GAME_CONFIG.hpMax) * 100}%`;
    dom.statConfBar.style.width = `${(state.confidence / GAME_CONFIG.statMax) * 100}%`;
    dom.statDialBar.style.width = `${(state.dialectic / GAME_CONFIG.statMax) * 100}%`;
    dom.statClassBar.style.width = `${(state.classStand / GAME_CONFIG.statMax) * 100}%`;

    dom.statHp.querySelector('.stat-val').textContent = state.hp;
    dom.statConfidence.querySelector('.stat-val').textContent = state.confidence;
    dom.statDialectic.querySelector('.stat-val').textContent = state.dialectic;
    dom.statClassStand.querySelector('.stat-val').textContent = state.classStand;

    // 低属性警告 + debuff 贴条
    const attrMeta = [
      { el: dom.statConfidence, key: 'confidence', name: '信心动摇' },
      { el: dom.statDialectic, key: 'dialectic', name: '辩证不足' },
      { el: dom.statClassStand, key: 'classStand', name: '觉悟薄弱' },
    ];
    attrMeta.forEach(({ el, key, name }) => {
      const val = state[key];
      const tag = el.querySelector('.debuff-tag');
      if (val < GAME_CONFIG.lowConfidenceThreshold) {
        el.classList.add('stat-warning');
        if (tag) { tag.textContent = '⚠ ' + name; tag.classList.remove('hidden'); }
      } else {
        el.classList.remove('stat-warning');
        if (tag) tag.classList.add('hidden');
      }
    });

    if (state.hp <= 3) {
      dom.statHp.classList.add('stat-danger');
    } else {
      dom.statHp.classList.remove('stat-danger');
    }
  }

  function updateProgress(state) {
    dom.progressText.textContent = `${state.questionIndex} / ${state.totalQuestions}`;
    dom.progressBar.style.width = `${(state.questionIndex / state.totalQuestions) * 100}%`;
  }

  function updateItemPanel(state) {
    dom.itemPanel.classList.remove('hidden');
    if (state.items.length === 0) {
      dom.itemList.innerHTML = '<span class="item-empty">暂无道具</span>';
    } else {
      dom.itemList.innerHTML = state.items.map(item => `
        <button class="item-chip" title="${item.desc}" data-item-id="${item.id}">
          <span class="item-icon">${item.icon}</span>${item.name}
        </button>
      `).join('');

      // 绑定点击事件
      dom.itemList.querySelectorAll('.item-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          const itemId = chip.dataset.itemId;
          const item = state.items.find(it => it.id === itemId);
          if (!item) return;

          // 只能在 battle 外使用的道具，在面板点击时直接使用
          if (item.usableIn === 'any' && (item.effect.type === 'restoreHp' || item.effect.type === 'lockAttr' || item.effect.type === 'boostAttr' || item.effect.type === 'unlockOption')) {
            const result = GameEngine.useItemBeforeBattle(itemId);
            if (result) {
              const newState = GameEngine.getState();
              renderBattle(newState);
              flashMessage(`使用了「${item.name}」`);
            }
          } else if (item.usableIn === 'battle') {
            // 答题前使用：设置待生效道具，下一题生效
            pendingItemId = itemId;
            flashMessage('「' + item.name + '」将在本题生效');
          }
        });
      });
    }
  }

  function flashMessage(msg) {
    const el = document.createElement('div');
    el.className = 'flash-msg';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => {
      el.classList.add('fade-out');
      setTimeout(() => document.body.removeChild(el), 300);
    }, 1200);
  }

  // ── 开场动画 ────────────────────────────────────────
  function showTitleScreen() {
    showScreen(dom.titleScreen);
  }

  function startGame() {
    const state = GameEngine.initGame();
    const firstQ = GameEngine.drawNextQuestion();
    showScreen(dom.battleScreen);
    renderBattle(GameEngine.getState());
  }

  // ── DLC · 简答题模式 ────────────────────────────────
  let dlcCurrentQuestion = null;

  function cacheDlcDom() {
    dom.dlcScreen      = $('#screen-dlc');
    dom.btnDlc         = $('#btn-dlc');
    dom.dlcBack        = $('#dlc-back');
    dom.dlcStatus       = $('#dlc-status');
    dom.dlcQuestion     = $('#dlc-question-display');
    dom.dlcEnemyName    = $('#dlc-enemy-name');
    dom.dlcEnemyFaction = $('#dlc-enemy-faction');
    dom.dlcEnemyContent = $('#dlc-enemy-content');
    dom.dlcAnswer       = $('#dlc-answer');
    dom.dlcSubmit       = $('#dlc-submit');
    dom.dlcSkip         = $('#dlc-skip');
    dom.dlcResult       = $('#dlc-result');
    dom.dlcResultType   = $('#dlc-result-type');
    dom.dlcResultStars  = $('#dlc-result-stars');
    dom.dlcResultBrief  = $('#dlc-result-brief');
    dom.dlcApikey       = $('#dlc-apikey');
  }

  function startDlc() {
    showScreen(dom.dlcScreen);
    loadDlcQuestion();
  }

  function loadDlcQuestion() {
    // 从题库 + 自制题中随机抽一题
    const custom = GameEngine.getCustomQuestions();
    const all = QUESTIONS.concat(custom);
    const idx = Math.floor(Math.random() * all.length);
    dlcCurrentQuestion = all[idx];
    const enemy = ENEMIES[dlcCurrentQuestion.enemyType];

    dom.dlcEnemyName.textContent = enemy.name;
    dom.dlcEnemyFaction.textContent = enemy.faction;
    dom.dlcEnemyContent.textContent = dlcCurrentQuestion.content;
    dom.dlcQuestion.classList.remove('hidden');
    dom.dlcResult.classList.add('hidden');
    dom.dlcAnswer.value = '';
    dom.dlcAnswer.disabled = false;
    dom.dlcSubmit.disabled = false;
    dom.dlcStatus.textContent = '';
  }

  async function submitDlcAnswer() {
    const apiKey = dom.dlcApikey.value.trim();
    if (!apiKey) {
      dom.dlcStatus.textContent = '请先填写 API Key';
      return;
    }
    const answer = dom.dlcAnswer.value.trim();
    if (!answer) {
      dom.dlcStatus.textContent = '请先输入你的回答';
      return;
    }

    dom.dlcSubmit.disabled = true;
    dom.dlcAnswer.disabled = true;
    dom.dlcStatus.textContent = 'AI 裁判评判中...';

    try {
      const result = await GameEngine.judgeAnswer(dlcCurrentQuestion, answer, apiKey);
      dom.dlcResultType.textContent = result.type;
      dom.dlcResultType.className = 'dlc-result-type type-' + (
        result.type === ArgumentType.RATIONAL ? 'rational' :
        result.type === ArgumentType.REDUCTIO ? 'reductio' : 'emotional'
      );
      dom.dlcResultStars.textContent = '★'.repeat(result.stars) + '☆'.repeat(3 - result.stars);
      dom.dlcResultBrief.textContent = result.brief;

      // 显示弱点是否匹配
      if (result.type === dlcCurrentQuestion.weakness) {
        dom.dlcResultBrief.textContent += ' （论证类型匹配！）';
      }

      dom.dlcResult.classList.remove('hidden');
      dom.dlcStatus.textContent = '评判完成';
    } catch (err) {
      dom.dlcStatus.textContent = '错误：' + err.message;
      dom.dlcAnswer.disabled = false;
    }
    dom.dlcSubmit.disabled = false;
  }

  function skipDlcQuestion() {
    loadDlcQuestion();
    dom.dlcStatus.textContent = '已换题';
  }

  // ── 初始化事件 ──────────────────────────────────────
  function initEvents() {
    dom.btnStart.addEventListener('click', startGame);
    dom.btnRestart.addEventListener('click', startGame);
    dom.btnDlc.addEventListener('click', startDlc);
    dom.dlcBack.addEventListener('click', showTitleScreen);
    dom.dlcSubmit.addEventListener('click', submitDlcAnswer);
    dom.dlcSkip.addEventListener('click', skipDlcQuestion);
    dom.btnShop.addEventListener('click', openShop);
    dom.shopClose.addEventListener('click', closeShop);
    dom.btnDebug.addEventListener('click', openDebug);
    dom.btnCodex.addEventListener('click', openCodex);
    dom.codexClose.addEventListener('click', closeCodex);
    dom.sideCodexToggle.addEventListener('click', toggleSideCodex);
    dom.btnEventCodex.addEventListener('click', openEventCodex);
    dom.eventCodexClose.addEventListener('click', closeEventCodex);
    dom.btnCustom.addEventListener('click', openCustom);
    dom.customSubmit.addEventListener('click', submitCustom);
    dom.customClose.addEventListener('click', closeCustom);
    dom.btnScorecard.addEventListener('click', generateScoreCard);
  }

  // ── 公开初始化 ──────────────────────────────────────
  function init() {
    cacheDom();
    cacheDlcDom();
    initEvents();
    initDebug();
    showTitleScreen();
  }

  return { init, startGame, showTitleScreen };

})();
