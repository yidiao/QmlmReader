/* ================================================================
   engine.js — 游戏状态管理与核心逻辑
   青马的奇妙冒险 v0.1
   ================================================================ */

const GameEngine = (() => {

  // ── 内部状态 ────────────────────────────────────────
  let state = {};

  function defaultState() {
    const attrs = randomStartAttrs();
    return {
      hp: GAME_CONFIG.startingHp,
      confidence: attrs.confidence,
      dialectic: attrs.dialectic,
      classStand: attrs.classStand,
      items: [],
      currentQuestion: null,
      questionIndex: 0,          // 已答题数
      totalQuestions: GAME_CONFIG.questionsPerRun,
      comboChain: 0,             // 当前连环数（0=不在连环中）
      comboRemaining: 0,         // 连环剩余题目数
      questionPool: [],          // 本局抽中的题ID列表
      usedQuestionIds: new Set(),// 已用过的题ID，避免重复
      activeBuffs: [],           // { id, attr, value, duration, remaining }
      unlockAllOptions: false,   // 革命战友道具效果
      gameOver: false,
      victory: false,
      log: [],                   // 战斗日志
      defeatedEnemies: new Set(),// 已击败的敌人类型
      eliteBattle: null,         // { enemyType, hp, maxHp } 精英战进行中
      bossIndex: 0,              // 当前 BOSS 序号（0/1/2）
      bossBattle: null,          // { enemyType, title, hp, maxHp, stance, chain }
      totalDamageDealt: 0,       // 对敌人累计总伤害
      totalDamageTaken: 0,       // 累计承受伤害
      unlockedUltimates: [],     // 已解锁杀招 id
      ultimatesCooldown: 0,      // 杀招共享冷却（0=可用）
      preciseHits: 0,            // 连续精准打击次数
      forcedElite: 0,            // 事件「接下来 N 次遭遇精英」
      forcedFaction: null,       // 事件「接下来 N 次遭遇 X 阵营」
      forcedFactionTurns: 0,
      noItemsTurns: 0,           // 事件「N 回合无法使用道具」
      lockedAttr: null,          // 事件「锁定属性上限」
      lockedAttrValue: 0,        // 锁定的上限值
      lockedAttrTurns: 0,
      eventGuardTurns: 0,        // 道具「负面事件概率减半」
    };
  }

  // ── 初始化 ──────────────────────────────────────────
  function initGame() {
    state = defaultState();

    // 读取已击败敌人（图鉴解锁持久化）
    try {
      const saved = JSON.parse(localStorage.getItem('qingma_defeated') || '[]');
      state.defeatedEnemies = new Set(saved);
    } catch (e) { /* 忽略损坏的存档 */ }

    // 构建题池：随机抽 totalQuestions 道题
    const allIds = QUESTIONS.map(q => q.id);
    const shuffled = shuffle([...allIds]);
    state.questionPool = shuffled.slice(0, state.totalQuestions);

    // 随机发放道具
    const itemPool = shuffle([...ITEMS]);
    state.items = itemPool.slice(0, GAME_CONFIG.startingItemCount).map(it => ({ ...it }));

    return { ...state };
  }

  // ── 抽取下一题 ──────────────────────────────────────
  function drawNextQuestion() {
    if (state.questionIndex >= state.totalQuestions) {
      state.gameOver = true;
      state.victory = true;
      return null;
    }

    let question = null;

    // 精英战进行中：优先从该敌人抽题
    if (state.eliteBattle && state.eliteBattle.hp > 0) {
      question = drawEliteQuestion();
    }

    // 连环题：从同类型敌人中抽
    if (!question && state.comboRemaining > 0 && state.currentQuestion) {
      const sameType = QUESTIONS.filter(
        q => q.enemyType === state.currentQuestion.enemyType
          && !state.usedQuestionIds.has(q.id)
      );
      if (sameType.length > 0) {
        question = sameType[Math.floor(Math.random() * sameType.length)];
        state.comboRemaining--;
        state.comboChain++;
      } else {
        // 同类型没新题了，结束连环
        state.comboRemaining = 0;
        state.comboChain = 0;
        question = drawFromPool();
      }
    }

    // 常规抽题
    if (!question) {
      state.comboChain = 0;
      question = drawFromPool();
    }

    if (!question) {
      state.gameOver = true;
      state.victory = true;
      return null;
    }

    state.currentQuestion = question;
    state.usedQuestionIds.add(question.id);
    state.unlockAllOptions = false;

    // 抽到新敌人：开启敌人战（基础血量 + 难度档加成；事件可强制精英/阵营）
    if (!state.eliteBattle) {
      const forced = state.forcedElite > 0;
      if (forced) state.forcedElite--;
      if (state.forcedFactionTurns > 0) state.forcedFactionTurns--;
      const isElite = !!question.isElite || forced;
      const tier = currentTier();
      const bonus = isElite
        ? GAME_CONFIG.diffHpBonusElite[tier]
        : GAME_CONFIG.diffHpBonusNormal[tier];
      const hp = (isElite ? GAME_CONFIG.eliteHp : GAME_CONFIG.normalHp) + bonus;
      state.eliteBattle = { enemyType: question.enemyType, hp, maxHp: hp, isElite };
    }

    return question;
  }

  function drawEliteQuestion() {
    const type = state.eliteBattle.enemyType;
    const eliteQs = QUESTIONS.filter(q => q.enemyType === type && !state.usedQuestionIds.has(q.id));
    if (eliteQs.length > 0) {
      return eliteQs[Math.floor(Math.random() * eliteQs.length)];
    }
    // 该敌人题用完，结束精英战（未击败）
    state.eliteBattle = null;
    return null;
  }

  function matchesForcedFaction(q) {
    if (!state.forcedFaction || state.forcedFactionTurns <= 0) return true;
    const enemy = ENEMIES[q.enemyType];
    return enemy && enemy.faction === state.forcedFaction;
  }

  function drawFromPool() {
    // 从题池中取下一道未用过的（事件「强制阵营」时按阵营过滤）
    for (let i = state.questionIndex; i < state.totalQuestions; i++) {
      const qId = state.questionPool[i];
      if (!state.usedQuestionIds.has(qId)) {
        const q = QUESTIONS.find(x => x.id === qId);
        if (q && matchesForcedFaction(q)) return q;
      }
    }
    // 题池用尽，随机抽一道未用过的
    const remaining = QUESTIONS.filter(q => !state.usedQuestionIds.has(q.id) && matchesForcedFaction(q));
    if (remaining.length === 0) return null;
    return remaining[Math.floor(Math.random() * remaining.length)];
  }

  // ── 解析答案 ────────────────────────────────────────
  function resolveAnswer(optionIndex, itemUsedId) {
    const question = state.currentQuestion;
    if (!question) return null;

    const option = question.options[optionIndex];
    if (!option) return null;

    // 检查是否被锁定（革命战友道具可解除）
    if (!state.unlockAllOptions) {
      const lockCheck = checkOptionLock(option);
      if (lockCheck.locked) return { locked: true, reason: lockCheck.reason };
      const reqCheck = checkOptionRequirement(option);
      if (reqCheck.blocked) return { locked: true, reason: reqCheck.reason };
    }

    let result = {
      question,
      option,
      baseDamage: 0,
      bonusDamage: 0,
      totalDamage: 0,
      weaknessMatch: false,
      statChanges: { ...option.effect },
      comboTriggered: false,
      comboReason: '',
      itemUsed: null,
    };

    // 基础伤害 = 星级
    result.baseDamage = option.stars;

    // 属性过低 → 伤害降低（不倒扣属性；感性攻击不受属性影响）
    let attrPenalty = false;
    if (option.type === ArgumentType.RATIONAL && state.confidence < GAME_CONFIG.lowConfidenceThreshold) {
      result.baseDamage -= 1;
      attrPenalty = true;
    }
    if (option.type === ArgumentType.REDUCTIO && state.dialectic < GAME_CONFIG.lowConfidenceThreshold) {
      result.baseDamage -= 1;
      attrPenalty = true;
    }
    if (option.type === ArgumentType.CLASS_CRITIQUE && state.classStand < GAME_CONFIG.lowConfidenceThreshold) {
      result.baseDamage -= 1;
      attrPenalty = true;
    }

    // 论证类型匹配加成（属性极低<2时，匹配无效）
    let matchBlocked = false;
    if (option.type === ArgumentType.RATIONAL && state.confidence < 2) matchBlocked = true;
    if (option.type === ArgumentType.REDUCTIO && state.dialectic < 2) matchBlocked = true;
    if (option.type === ArgumentType.EMOTIONAL && state.classStand < 2) matchBlocked = true;

    const enemyTier = (state.eliteBattle && state.eliteBattle.isElite) ? 1 : 0;
    const enemyAbilities = getActiveAbilities(question.enemyType, enemyTier);

    if (option.type === question.weakness && !matchBlocked) {
      result.bonusDamage += 1;
      result.weaknessMatch = true;
    }

    // 敌人特殊能力：弱点增伤 / 非弱点减伤
    const wa = enemyAbilities.find(a => a.type === 'weaknessAmplify');
    if (wa) {
      result.bonusDamage += result.weaknessMatch ? wa.bonus : (wa.penalty || 0);
    }

    // 道具加成
    if (itemUsedId) {
      const itemResult = applyItem(itemUsedId, question, option, result);
      if (itemResult) {
        result.itemUsed = itemResult;
        if (itemResult.bonusDamage) result.bonusDamage += itemResult.bonusDamage;
      }
    }

    // 总伤害：普通上限 3，杀招/特殊突破 3
    const isUltimate = option.isUltimate || option.stars >= 4;
    const damageCap = isUltimate ? GAME_CONFIG.ultimateDamageCap : 3;
    result.totalDamage = clamp(result.baseDamage + result.bonusDamage, 0, damageCap);
    const hpBefore = state.hp;

    // 困难档（第 21-30 题）：默认 -1 伤害；0 伤倒扣 1 HP；对应属性 > 阈值免罚
    result.selfHarm = false;
    if (currentTier() >= 2) {
      const optionAttr = attrOfOptionType(option.type);
      const immune = optionAttr && state[optionAttr] > GAME_CONFIG.immunityAttrThreshold;
      if (!immune) {
        result.totalDamage -= GAME_CONFIG.hardDamagePenalty;
        if (result.totalDamage <= 0) {
          result.totalDamage = 0;
          state.hp = clamp(state.hp - GAME_CONFIG.hardSelfHarmHp, GAME_CONFIG.statMin, GAME_CONFIG.hpMax);
          result.selfHarm = true;
        }
      }
    }

    // 应用属性变化
    applyStatChanges(result.statChanges);

    // 扣血：高分不扣，低分惩罚，连环额外扣
    // 3+伤害=碾压，0扣血；2=合格，0扣血；0-1=吃力，扣1-2血
    let hpCost = 0;
    if (result.totalDamage >= 3) {
      hpCost = 0;
    } else if (result.totalDamage >= 2) {
      hpCost = 0;
    } else {
      hpCost = 2; // 1星或更低，严重损耗
    }
    state.hp = clamp(state.hp - hpCost, GAME_CONFIG.statMin, GAME_CONFIG.hpMax);

    // 当前敌人扣血 + 精英结算（普通怪仅掉血，精英怪击败后恢复信心+掉落道具）
    result.eliteDrop = null;
    result.eliteDefeated = false;
    result.eliteHp = null;
    result.isElite = false;
    if (state.eliteBattle) {
      result.isElite = !!state.eliteBattle.isElite;
      state.eliteBattle.hp -= result.totalDamage;
      result.eliteHp = Math.max(0, state.eliteBattle.hp);
      if (state.eliteBattle.hp <= 0) {
        result.eliteDefeated = true;
        // 敌人特殊能力：死亡亡语（风险奖励）
        const dr = enemyAbilities.find(a => a.type === 'deathrattle');
        if (dr) {
          state[dr.attr] = clamp(state[dr.attr] + (state[dr.attr] < dr.threshold ? dr.below : dr.above), GAME_CONFIG.statMin, GAME_CONFIG.statMax);
        }
        if (state.eliteBattle.isElite) {
          // 精英击败奖励：恢复信心 + 掉落道具
          state.confidence = clamp(state.confidence + 1, GAME_CONFIG.statMin, GAME_CONFIG.overflowMax);
          if (state.items.length < GAME_CONFIG.maxItems) {
            const pool = ITEMS.filter(it => !state.items.find(si => si.id === it.id));
            if (pool.length > 0) {
              const drop = pool[Math.floor(Math.random() * pool.length)];
              state.items.push({ ...drop });
              result.eliteDrop = { id: drop.id, name: drop.name, icon: drop.icon };
            }
          }
        }
        state.eliteBattle = null;
      }
    }

    // 连环题判定（怪已被击败则不触发；连环追击不再额外扣血，自伤只由「收效甚微」的 hpCost 承担）
    result.comboTriggered = checkCombo(result);

    // 敌人回合能力：自愈 / 削弱主角 / 吸血（仅当敌人还活着）
    if (state.eliteBattle && state.eliteBattle.hp > 0) {
      const hpLossThisTurn = Math.max(0, hpBefore - state.hp);
      enemyAbilities.forEach(a => {
        if (a.type === 'buffSelf' && Math.random() < a.chance) {
          state.eliteBattle.hp = Math.min(state.eliteBattle.maxHp, state.eliteBattle.hp + a.value);
        }
        if (a.type === 'debuffPlayer' && Math.random() < a.chance) {
          state[a.attr] = clamp(state[a.attr] + a.value, GAME_CONFIG.statMin, GAME_CONFIG.statMax);
        }
        if (a.type === 'lifesteal' && hpLossThisTurn > 0) {
          state.eliteBattle.hp = Math.min(state.eliteBattle.maxHp, state.eliteBattle.hp + a.value);
        }
      });
    }

    // 处理 buff 倒计时
    tickBuffs();

    // 击败记录：有效命中即击败该敌人类型（图鉴解锁）
    if (result.totalDamage >= 2) {
      state.defeatedEnemies.add(question.enemyType);
      saveDefeated();
    }

    // 精准打击计数（杀招解锁条件用）
    if (result.totalDamage >= 3) state.preciseHits++;
    else state.preciseHits = 0;

    // 累计总伤 / 承伤
    state.totalDamageDealt += result.totalDamage;
    state.totalDamageTaken += Math.max(0, hpBefore - state.hp);

    // 记录日志
    state.log.push({
      questionId: question.id,
      enemyType: question.enemyType,
      optionIndex,
      totalDamage: result.totalDamage,
      weaknessMatch: result.weaknessMatch,
      hpAfter: state.hp,
    });

    // 击败当前敌人才推进遭遇计数（连环追问不算新遭遇）
    if (result.eliteDefeated) state.questionIndex++;

    // 检查游戏结束
    if (state.hp <= 0) {
      state.gameOver = true;
      state.victory = false;
    }

    // 清理 itemUsed（只移除一个，同 id 道具不误删）
    if (itemUsedId) {
      const idx = state.items.findIndex(it => it.id === itemUsedId);
      if (idx !== -1) state.items.splice(idx, 1);
    }

    tickUltimateCooldown();
    return result;
  }

  // ── 连环题检查 ──────────────────────────────────────
  function checkCombo(result) {
    // 怪已被击败，不触发连环（怪死了没法追击）
    if (result.eliteDefeated) return { triggered: false };

    // 火力不足（≤2伤害）且怪还活着，触发连环攻击
    if (result.totalDamage <= 2) {
      state.comboRemaining = 1 + Math.floor(Math.random() * 2); // 1-2道连环题
      return { triggered: true, reason: '论证火力不足，敌人穷追不舍！' };
    }

    // 理论信心低，概率触发连环
    if (state.confidence < GAME_CONFIG.lowConfidenceThreshold
        && Math.random() < GAME_CONFIG.comboChanceOnLowConfidence) {
      state.comboRemaining = 1 + Math.floor(Math.random() * 2);
      return { triggered: true, reason: '立场动摇，被敌人抓住破绽！' };
    }

    return { triggered: false };
  }

  // ── 选项锁定检查 ────────────────────────────────────
  function checkOptionLock(option) {
    if (!option.lockedBy) return { locked: false };
    const { attr, below } = option.lockedBy;
    const currentVal = state[attr];
    if (currentVal < below) {
      const attrNames = {
        confidence: '理论信心',
        dialectic: '辩证力',
        classStand: '阶级觉悟',
      };
      return {
        locked: true,
        reason: `${attrNames[attr]}不足（${currentVal}<${below}），此选项不可用`,
      };
    }
    return { locked: false };
  }

  // ── 杀招选项检查（高属性解锁） ──────────────────────
  function checkOptionRequirement(option) {
    if (!option.requires) return { blocked: false };
    const { attr, above } = option.requires;
    const currentVal = state[attr];
    if (currentVal < above) {
      const attrNames = {
        confidence: '理论信心',
        dialectic: '辩证力',
        classStand: '阶级觉悟',
      };
      return {
        blocked: true,
        reason: `${attrNames[attr]}需≥${above}才能施展此杀招`,
      };
    }
    return { blocked: false };
  }

  // ── 置之不理（避战，免连环但掉属性） ────────────────
  function resolveIgnore() {
    const question = state.currentQuestion;
    if (!question) return null;

    // 随机掉一个属性
    const attrs = ['confidence', 'dialectic', 'classStand'];
    const attr = attrs[Math.floor(Math.random() * attrs.length)];
    state[attr] = clamp(state[attr] - 1, GAME_CONFIG.statMin, GAME_CONFIG.statMax);

    // 免于连环：清空连环状态，且离开当前敌人（本遭遇结束）
    state.comboRemaining = 0;
    state.comboChain = 0;
    state.eliteBattle = null;

    // 记录日志
    state.log.push({
      questionId: question.id,
      enemyType: question.enemyType,
      optionIndex: -1,
      totalDamage: 0,
      weaknessMatch: false,
      hpAfter: state.hp,
    });

    state.questionIndex++;

    if (state.hp <= 0) {
      state.gameOver = true;
      state.victory = false;
    }

    tickUltimateCooldown();
    return {
      question,
      option: null,
      ignore: true,
      ignoreAttr: attr,
      totalDamage: 0,
      statChanges: { [attr]: -1 },
      comboTriggered: { triggered: false },
    };
  }

  // ── 应用道具 ────────────────────────────────────────
  function applyItem(itemId, question, option, result) {
    const item = state.items.find(it => it.id === itemId);
    if (!item) return null;

    const eff = item.effect;
    let bonusDamage = 0;
    let applied = true;

    switch (eff.type) {
      case 'boostMatch':
        if (option.type === question.weakness) bonusDamage += eff.value;
        break;
      case 'boostStar':
        bonusDamage += eff.value;
        break;
      case 'boostFaction': {
        const enemy = ENEMIES[question.enemyType];
        if (enemy && enemy.faction === eff.faction) bonusDamage += eff.value;
        break;
      }
      case 'skipFaction': {
        const enemy = ENEMIES[question.enemyType];
        if (enemy && enemy.faction === eff.faction) {
          bonusDamage = 99; // 秒杀
        }
        break;
      }
      case 'unlockOption':
        // 已经在 resolveAnswer 之前被调用，这里无需额外处理
        break;
      case 'restoreHp':
        state.hp = clamp(state.hp + eff.value, GAME_CONFIG.statMin, GAME_CONFIG.hpMax);
        break;
      case 'lockAttr':
        state.activeBuffs.push({
          id: itemId,
          attr: eff.attr,
          duration: eff.duration,
          remaining: eff.duration,
        });
        break;
      case 'boostAttr':
        state[eff.attr] = clamp(state[eff.attr] + eff.value, GAME_CONFIG.statMin, GAME_CONFIG.statMax);
        state.activeBuffs.push({
          id: itemId,
          attr: eff.attr,
          value: eff.value,
          duration: eff.duration,
          remaining: eff.duration,
        });
        break;
      case 'eventGuard':
        state.eventGuardTurns = eff.duration;
        break;
      default:
        applied = false;
    }

    return { id: itemId, name: item.name, applied, bonusDamage };
  }

  // ── 可以在战前使用的道具 ────────────────────────────
  function canUseItemBefore(itemId) {
    if (state.noItemsTurns > 0) return false;
    const item = state.items.find(it => it.id === itemId);
    if (!item) return false;
    return item.usableIn === 'any' || item.usableIn === 'battle';
  }

  function useItemBeforeBattle(itemId) {
    const item = state.items.find(it => it.id === itemId);
    if (!item) return null;

    const eff = item.effect;
    switch (eff.type) {
      case 'restoreHp':
        state.hp = clamp(state.hp + eff.value, GAME_CONFIG.statMin, GAME_CONFIG.hpMax);
        break;
      case 'lockAttr':
        state.activeBuffs.push({
          id: itemId,
          attr: eff.attr,
          duration: eff.duration,
          remaining: eff.duration,
        });
        break;
      case 'boostAttr':
        state[eff.attr] = clamp(state[eff.attr] + eff.value, GAME_CONFIG.statMin, GAME_CONFIG.statMax);
        state.activeBuffs.push({
          id: itemId,
          attr: eff.attr,
          value: eff.value,
          duration: eff.duration,
          remaining: eff.duration,
        });
        break;
      case 'unlockOption':
        // 对当前题目解锁全部选项
        state.unlockAllOptions = true;
        break;
      case 'eventGuard':
        state.eventGuardTurns = eff.duration;
        break;
      default:
        return null; // 只能在 battle 中使用的跳过
    }

    const idx = state.items.findIndex(it => it.id === itemId);
    if (idx !== -1) state.items.splice(idx, 1);
    return { id: itemId, name: item.name };
  }

  // ── 商店购买 ──────────────────────────────────────
  function buyItem(itemId) {
    const item = ITEMS.find(it => it.id === itemId);
    if (!item) return { ok: false, reason: '道具不存在' };
    if (state.items.length >= GAME_CONFIG.maxItems) return { ok: false, reason: '道具已满' };
    const { currency, cost } = item.price;
    if (currency === 'hp') {
      if (state.hp <= cost) return { ok: false, reason: 'HP 不足' };
      state.hp -= cost;
    } else {
      if (state[currency] < cost) return { ok: false, reason: '属性不足' };
      state[currency] -= cost;
    }
    state.items.push({ ...item });
    return { ok: true, item };
  }

  // ── 调试接口（测试台专用） ──────────────────────
  function debugSetStat(attr, val) {
    if (attr === 'hp') state.hp = clamp(val, 1, GAME_CONFIG.hpMax);
    else state[attr] = clamp(val, GAME_CONFIG.statMin, GAME_CONFIG.overflowMax);
  }
  function debugJumpTo(questionId) {
    const q = QUESTIONS.find(x => x.id === questionId);
    if (q) {
      state.currentQuestion = q;
      state.usedQuestionIds.add(q.id);
    }
    return q;
  }
  function debugGiveItem() {
    const pool = ITEMS.filter(it => !state.items.find(si => si.id === it.id));
    if (pool.length > 0 && state.items.length < GAME_CONFIG.maxItems) {
      const item = pool[Math.floor(Math.random() * pool.length)];
      state.items.push({ ...item });
      return item;
    }
    return null;
  }
  function debugTriggerElite() {
    const eliteQ = QUESTIONS.find(q => q.isElite && !state.usedQuestionIds.has(q.id)) || QUESTIONS.find(x => x.isElite);
    if (eliteQ) {
      state.currentQuestion = eliteQ;
      state.usedQuestionIds.add(eliteQ.id);
    }
    return eliteQ;
  }

  // ── 教化（针对可争取敌人，特殊选项） ──────────────
  function resolveRedeem() {
    const question = state.currentQuestion;
    if (!question) return null;
    const enemy = ENEMIES[question.enemyType];
    if (!enemy || !enemy.redeemable) return null;

    // 教化：直接击败（怪被感召），恢复属性
    if (state.eliteBattle) state.eliteBattle = null;
    state.confidence = clamp(state.confidence + 2, GAME_CONFIG.statMin, GAME_CONFIG.overflowMax);
    state.classStand = clamp(state.classStand + 1, GAME_CONFIG.statMin, GAME_CONFIG.overflowMax);

    state.log.push({
      questionId: question.id,
      enemyType: question.enemyType,
      optionIndex: -2,
      totalDamage: 99,
      weaknessMatch: false,
      hpAfter: state.hp,
    });

    state.questionIndex++;

    tickUltimateCooldown();
    return {
      question,
      option: null,
      redeem: true,
      totalDamage: 99,
      statChanges: { confidence: 2, classStand: 1 },
      comboTriggered: { triggered: false },
    };
  }

  // ── 事件系统 ──────────────────────────────────────
  function applyEventEffect(effect) {
    if (!effect) return;
    if (effect.flag === 'loseItems') {
      state.items = [];
      return;
    }
    if (effect.flag === 'elite3') {
      state.forcedElite = 3;
      return;
    }
    if (effect.flag === 'forceFaction') {
      state.forcedFaction = effect.faction;
      state.forcedFactionTurns = effect.turns || 3;
      return;
    }
    if (effect.flag === 'noItems') {
      state.noItemsTurns = effect.turns || 3;
      return;
    }
    if (effect.flag === 'lockAttr') {
      state.lockedAttr = effect.attr;
      state.lockedAttrValue = state[effect.attr];  // 锁定当前值为上限（只减不增）
      state.lockedAttrTurns = effect.turns || 5;
      return;
    }
    if (effect.flag === 'skipEnemies') {
      state.questionIndex += (effect.count || 3);
      state.hp = clamp(state.hp + (effect.hp || 0), GAME_CONFIG.statMin, GAME_CONFIG.hpMax);
      state.eliteBattle = null;
      return;
    }
    if (effect.hp) {
      state.hp = clamp(state.hp + effect.hp, GAME_CONFIG.statMin, GAME_CONFIG.hpMax);
    }
    applyStatChanges(effect);
  }
  function drawEnemyQuestion(enemyType) {
    const qs = QUESTIONS.filter(q => q.enemyType === enemyType && !state.usedQuestionIds.has(q.id));
    const q = qs.length > 0 ? qs[Math.floor(Math.random() * qs.length)] : QUESTIONS.find(x => x.enemyType === enemyType);
    if (q) {
      state.currentQuestion = q;
      state.usedQuestionIds.add(q.id);
      state.unlockAllOptions = false;
      if (!state.eliteBattle) {
        const forced = state.forcedElite > 0;
        if (forced) state.forcedElite--;
        const isElite = !!q.isElite || forced;
        const tier = currentTier();
        const bonus = isElite
          ? GAME_CONFIG.diffHpBonusElite[tier]
          : GAME_CONFIG.diffHpBonusNormal[tier];
        const hp = (isElite ? GAME_CONFIG.eliteHp : GAME_CONFIG.normalHp) + bonus;
        state.eliteBattle = { enemyType: q.enemyType, hp, maxHp: hp, isElite };
      }
    }
    return q;
  }

  // ── 自制题（DLC） ─────────────────────────────────
  function getCustomQuestions() {
    try { return JSON.parse(localStorage.getItem('qingma_custom') || '[]'); }
    catch (e) { return []; }
  }
  function addCustomQuestion(q) {
    const list = getCustomQuestions();
    list.push(q);
    try { localStorage.setItem('qingma_custom', JSON.stringify(list)); return true; }
    catch (e) { return false; }
  }

  // ── 属性变更 ────────────────────────────────────────
  function applyStatChanges(changes) {
    if (changes.confidence) {
      let v = clamp(state.confidence + changes.confidence, GAME_CONFIG.statMin, GAME_CONFIG.overflowMax);
      if (state.lockedAttr === 'confidence') v = Math.min(v, state.lockedAttrValue);
      state.confidence = v;
    }
    if (changes.dialectic) {
      let v = clamp(state.dialectic + changes.dialectic, GAME_CONFIG.statMin, GAME_CONFIG.overflowMax);
      if (state.lockedAttr === 'dialectic') v = Math.min(v, state.lockedAttrValue);
      state.dialectic = v;
    }
    if (changes.classStand) {
      let v = clamp(state.classStand + changes.classStand, GAME_CONFIG.statMin, GAME_CONFIG.overflowMax);
      if (state.lockedAttr === 'classStand') v = Math.min(v, state.lockedAttrValue);
      state.classStand = v;
    }
  }

  function saveDefeated() {
    try { localStorage.setItem('qingma_defeated', JSON.stringify([...state.defeatedEnemies])); }
    catch (e) { /* file:// 下 localStorage 可能不可用 */ }
  }

  function tickBuffs() {
    state.activeBuffs = state.activeBuffs.filter(buff => {
      buff.remaining--;
      if (buff.remaining <= 0 && buff.value) {
        // buff 到期，回退属性
        state[buff.attr] = clamp(state[buff.attr] - buff.value, GAME_CONFIG.statMin, GAME_CONFIG.statMax);
        return false;
      }
      return buff.remaining > 0;
    });
  }

  // ── 工具函数 ────────────────────────────────────────
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // 开局三属性：各 5~10、总和固定 24
  function randomStartAttrs() {
    let a, b, c;
    do {
      a = randInt(GAME_CONFIG.startAttrMin, GAME_CONFIG.startAttrMax);
      b = randInt(GAME_CONFIG.startAttrMin, GAME_CONFIG.startAttrMax);
      c = GAME_CONFIG.startAttrSum - a - b;
    } while (c < GAME_CONFIG.startAttrMin || c > GAME_CONFIG.startAttrMax);
    return { confidence: a, dialectic: b, classStand: c };
  }

  // 当前难度档：题 1-10 → 0，11-20 → 1，21-30 → 2
  function currentTier() {
    return Math.min(2, Math.floor(state.questionIndex / 10));
  }

  // 选项类型对应的属性；感性攻击不受属性影响返回 null
  function attrOfOptionType(type) {
    if (type === ArgumentType.RATIONAL) return 'confidence';
    if (type === ArgumentType.REDUCTIO) return 'dialectic';
    if (type === ArgumentType.CLASS_CRITIQUE) return 'classStand';
    return null;
  }

  // 敌人特殊能力分级：普通 1 个 / 精英 2 个 / BOSS 3 个
  function getActiveAbilities(enemyType, tier) {
    const spec = ENEMY_SPECIALS[enemyType];
    if (!spec || !spec.abilities) return [];
    return spec.abilities.slice(0, tier + 1);
  }

  // ── 获取当前状态 ────────────────────────────────────
  function getState() {
    return { ...state, currentQuestion: state.currentQuestion ? { ...state.currentQuestion } : null };
  }

  function getEnemyInfo(enemyType) {
    return ENEMIES[enemyType] || null;
  }

  // ── BOSS 战（三段论证专属） ────────────────────────
  function rollBossStance() {
    const stances = [BossStance.ATTACK, BossStance.DEFEND, BossStance.PROVOKE];
    return stances[Math.floor(Math.random() * stances.length)];
  }

  function startBossBattle() {
    const pool = BOSS_POOLS[state.bossIndex] || BOSS_POOLS[0];
    const enemyType = pool[Math.floor(Math.random() * pool.length)];
    const enemy = ENEMIES[enemyType];
    const hp = GAME_CONFIG.bossBaseHp + (GAME_CONFIG.diffHpBonusBoss[state.bossIndex] || 0);
    // BOSS 特殊能力：封印选项（概率）
    let sealedType = null;
    const bossAbilities = getActiveAbilities(enemyType, 2);
    const seal = bossAbilities.find(a => a.type === 'sealOption');
    if (seal && Math.random() < seal.chance) {
      const types = [ArgumentType.RATIONAL, ArgumentType.REDUCTIO, ArgumentType.CLASS_CRITIQUE];
      sealedType = types[Math.floor(Math.random() * types.length)];
    }
    state.bossBattle = {
      enemyType,
      title: BOSS_TITLES[enemyType] || (enemy ? enemy.name : '神秘BOSS'),
      hp,
      maxHp: hp,
      stance: rollBossStance(),
      chain: 0,           // 论证链：0=论点 / 1=论据 / 2=反击
      sealedType,
    };
    return { ...state.bossBattle };
  }

  function getBossBattle() {
    return state.bossBattle ? { ...state.bossBattle } : null;
  }

  // 玩家选一个论证类型回应 BOSS 当前姿态
  function resolveBossStep(argumentType) {
    const b = state.bossBattle;
    if (!b) return null;

    const success = (argumentType === BOSS_COUNTER[b.stance]);
    const result = {
      success,
      stance: b.stance,
      chain: b.chain,
      finisher: false,
      damage: 0,
      playerDamage: 0,
      bossHeal: 0,
      attrDebuff: null,
      bossDefeated: false,
      playerDead: false,
      bossHp: b.hp,
    };

    if (success) {
      b.chain++;
      if (b.chain >= 3) {
        const dmg = GAME_CONFIG.bossFinisherDamage;
        b.hp = Math.max(0, b.hp - dmg);
        b.chain = 0;
        result.finisher = true;
        result.damage = dmg;
      } else {
        const dmg = GAME_CONFIG.bossChainDamage;
        b.hp = Math.max(0, b.hp - dmg);
        result.damage = dmg;
      }
    } else {
      // 拆招失败：BOSS 姿态生效，且打断你的论证链
      if (b.stance === BossStance.ATTACK) {
        state.hp = clamp(state.hp - GAME_CONFIG.bossAttackDamage, GAME_CONFIG.statMin, GAME_CONFIG.hpMax);
        result.playerDamage = GAME_CONFIG.bossAttackDamage;
      } else if (b.stance === BossStance.DEFEND) {
        b.hp = clamp(b.hp + GAME_CONFIG.bossDefendHeal, 0, b.maxHp);
        result.bossHeal = GAME_CONFIG.bossDefendHeal;
      } else if (b.stance === BossStance.PROVOKE) {
        const attrs = ['confidence', 'dialectic', 'classStand'];
        const attr = attrs[Math.floor(Math.random() * attrs.length)];
        state[attr] = clamp(state[attr] - GAME_CONFIG.bossProvokeDebuff, GAME_CONFIG.statMin, GAME_CONFIG.statMax);
        result.attrDebuff = attr;
      }
      b.chain = 0;
    }

    b.stance = rollBossStance();  // 下一轮换姿态
    result.bossHp = b.hp;

    if (b.hp <= 0) result.bossDefeated = true;
    if (state.hp <= 0) {
      state.gameOver = true;
      state.victory = false;
      result.playerDead = true;
    }

    state.totalDamageDealt += result.damage;
    state.totalDamageTaken += result.playerDamage;

    return result;
  }

  function finishBossBattle() {
    const defeated = state.bossBattle;
    if (defeated) {
      state.defeatedEnemies.add(defeated.enemyType);
      saveDefeated();
    }
    state.bossBattle = null;
    state.bossIndex++;
    return { bossIndex: state.bossIndex };
  }

  // ── 杀招（build / 职业专精） ──────────────────────
  function getUltimate(id) {
    return ULTIMATES.find(u => u.id === id) || null;
  }

  function unlockUltimate(id) {
    const u = getUltimate(id);
    if (!u || state.unlockedUltimates.includes(id)) return false;
    state.unlockedUltimates.push(id);
    return true;
  }

  function canUseUltimate(id) {
    const u = getUltimate(id);
    if (!u || !state.unlockedUltimates.includes(id)) return false;
    if (state.ultimatesCooldown > 0) return false;
    if (u.condition) {
      if (state[u.condition.attr] < u.condition.above) return false;
      if (state.preciseHits < u.condition.preciseHits) return false;
    }
    return true;
  }

  function useUltimate(id) {
    const u = getUltimate(id);
    if (!u) return { ok: false, reason: '杀招不存在' };
    if (!state.unlockedUltimates.includes(id)) return { ok: false, reason: '未解锁此杀招' };
    if (state.ultimatesCooldown > 0) return { ok: false, reason: '杀招冷却中' };
    if (u.condition) {
      if (state[u.condition.attr] < u.condition.above) return { ok: false, reason: '属性不足' };
      if (state.preciseHits < u.condition.preciseHits) return { ok: false, reason: '精准打击不足' };
    }

    const question = state.currentQuestion;
    let damage = u.damage;
    let weaknessMatch = false;
    if (question && u.type === question.weakness) {
      damage += 1;
      weaknessMatch = true;
    }

    // 对当前敌人扣血
    let eliteDefeated = false;
    if (state.eliteBattle) {
      state.eliteBattle.hp -= damage;
      if (state.eliteBattle.hp <= 0) {
        state.eliteBattle = null;
        eliteDefeated = true;
        state.questionIndex++;
        state.defeatedEnemies.add(question.enemyType);
        saveDefeated();
      }
    }

    // 副作用
    let selfHarm = 0;
    if (u.sideEffect && u.sideEffect.hp) {
      selfHarm = -u.sideEffect.hp;
      state.hp = clamp(state.hp + u.sideEffect.hp, GAME_CONFIG.statMin, GAME_CONFIG.hpMax);
    }

    // 共享冷却 + 累计
    state.ultimatesCooldown = u.cooldown;
    state.totalDamageDealt += damage;
    state.totalDamageTaken += selfHarm;
    state.preciseHits = 0;

    if (state.hp <= 0) {
      state.gameOver = true;
      state.victory = false;
    }

    return { ok: true, ultimate: u, damage, weaknessMatch, eliteDefeated, selfHarm, playerDead: state.gameOver };
  }

  function tickUltimateCooldown() {
    if (state.ultimatesCooldown > 0) state.ultimatesCooldown--;
    if (state.noItemsTurns > 0) state.noItemsTurns--;
    if (state.lockedAttrTurns > 0) {
      state.lockedAttrTurns--;
      if (state.lockedAttrTurns <= 0) state.lockedAttr = null;
    }
    if (state.eventGuardTurns > 0) state.eventGuardTurns--;
  }

  // ── AI 裁判（简答题模式） ──────────────────────────
  async function judgeAnswer(question, playerAnswer, apiKey) {
    const prompt = `你是马克思主义辩论裁判。评审判定玩家对敌人言论的反驳。

敌人言论：${question.content}
本题最佳论证方式：${question.weakness}

玩家反驳：${playerAnswer}

请判定玩家的反驳属于哪种论证类型，并给出1-3星评价。
- 理性辩证：运用历史唯物主义、政治经济学、矛盾分析法进行理论拆解
- 归谬反诘：将对方逻辑推向极致暴露荒谬，或用对方自身矛盾反将一军
- 感性批判：以克制而有力的情感直击要害

返回纯JSON（不要markdown代码块，不要任何解释文字）：
{"type":"理性辩证","stars":2,"brief":"一句简短点评"}`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API 请求失败 (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();

    // 尝试解析 JSON（可能被包裹在代码块里）
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('AI 返回格式异常：' + content);
      }
    }

    return {
      type: parsed.type || ArgumentType.RATIONAL,
      stars: Math.max(1, Math.min(3, parseInt(parsed.stars) || 2)),
      brief: parsed.brief || '',
    };
  }

  // ── 公开 API ────────────────────────────────────────
  return {
    initGame,
    drawNextQuestion,
    resolveAnswer,
    resolveIgnore,
    resolveRedeem,
    canUseItemBefore,
    useItemBeforeBattle,
    buyItem,
    debugSetStat,
    debugJumpTo,
    debugGiveItem,
    debugTriggerElite,
    applyEventEffect,
    drawEnemyQuestion,
    getCustomQuestions,
    addCustomQuestion,
    getState,
    getEnemyInfo,
    startBossBattle,
    getBossBattle,
    resolveBossStep,
    finishBossBattle,
    unlockUltimate,
    canUseUltimate,
    useUltimate,
    judgeAnswer,
    GAME_CONFIG,
  };

})();
