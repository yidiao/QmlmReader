/**
 * 马列体生成器 — 规则引擎 + UI 控制器 + 分享卡片生成 + 导师性格泳道图
 * 依赖：marxist-style-rules.json（规则数据库）、darkmode.js（暗色模式）
 */
(function () {
  'use strict';

  /* ================================================================
     Part 1: 规则引擎 (MarxistStyleEngine)
     ================================================================ */

  var EMPTY_RESULT = { result: '', changes: [], rulesTriggered: [], authorScore: {} };

  var MarxistStyleEngine = {
    rules: [],
    rulesByAuthor: {},
    rulesByDimension: { vocabulary: [], syntax: [], rhetoric: [], logic: [] },
    loaded: false,

    async loadRules(jsonPath) {
      if (this.loaded) return;
      await this._tryLoad(jsonPath);
    },

    /** 尝试从路径加载，返回是否成功 */
    async _tryLoad(jsonPath) {
      if (this.loaded) return true;
      try {
        var resp = await fetch(jsonPath);
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        var data = await resp.json();
        this.rules = data.rules || [];
        this._indexRules();
        this.loaded = true;
        return true;
      } catch (e) {
        return false;
      }
    },

    _indexRules() {
      this.rulesByAuthor = {};
      this.rulesByDimension = { vocabulary: [], syntax: [], rhetoric: [], logic: [] };
      var self = this;
      this.rules.forEach(function (rule) {
        if (!self.rulesByAuthor[rule.author]) self.rulesByAuthor[rule.author] = [];
        self.rulesByAuthor[rule.author].push(rule);
        if (self.rulesByDimension[rule.dimension]) {
          self.rulesByDimension[rule.dimension].push(rule);
        }
      });
      Object.keys(this.rulesByDimension).forEach(function (dim) {
        self.rulesByDimension[dim].sort(function (a, b) { return b.priority - a.priority; });
      });
    },

    convert(text, author) {
      if (!text || !text.trim()) return EMPTY_RESULT;
      var rules = this._selectRules(author);
      console.log('[马列体] 转换开始 —— 输入:', text.slice(0, 40), '| 导师:', author, '| 可用规则:', rules.length, '| 总规则库:', this.rules.length);
      var currentText = text;
      var changes = [];
      var rulesTriggered = [];
      var authorScore = { marx: 0, engels: 0, lenin: 0, stalin: 0, mao: 0 };
      var pipeline = ['vocabulary', 'syntax', 'rhetoric', 'logic'];
      var occupiedRanges = [];
      var self = this;

      pipeline.forEach(function (dimension) {
        var dimRules = rules.filter(function (r) { return r.dimension === dimension; });
        dimRules.sort(function (a, b) { return b.priority - a.priority; });

        dimRules.forEach(function (rule) {
          if (!self._checkConstraints(rule, currentText)) return;
          var match = self._matchRule(rule, currentText, occupiedRanges);
          if (!match) return;
          var replacement = self._applyRule(rule, match, currentText);
          if (!replacement || replacement === match.full) return;

          occupiedRanges.push({ start: match.index, end: match.index + replacement.length });
          var delta = replacement.length - match.full.length;
          occupiedRanges.forEach(function (r) {
            if (r.start > match.index) { r.start += delta; r.end += delta; }
          });

          currentText = currentText.slice(0, match.index) + replacement + currentText.slice(match.index + match.full.length);

          changes.push({
            ruleId: rule.id, dimension: rule.dimension,
            original: match.full.slice(0, 60), replacement: replacement.slice(0, 60),
            source: rule.source
          });
          rulesTriggered.push(rule);
          authorScore[rule.author] = (authorScore[rule.author] || 0) + rule.priority;
        });
      });

      console.log('[马列体] 转换完成 —— 命中:', rulesTriggered.length, '条规则 | 变更:', changes.length, '处 | 输出:', currentText.slice(0, 50));
      return { result: currentText, changes: changes, rulesTriggered: rulesTriggered, authorScore: authorScore };
    },

    _selectRules(author) {
      if (author === 'auto' || !author) return this.rules;
      return this.rules.filter(function (r) { return r.author === author || r.author === 'common'; });
    },

    _checkConstraints(rule, text) {
      var c = rule.constraints || {};
      if (c.excludeIf) {
        for (var i = 0; i < c.excludeIf.length; i++) {
          if (text.indexOf(c.excludeIf[i]) !== -1) return false;
        }
      }
      if (c.minContextLength && text.length < c.minContextLength) return false;
      return true;
    },

    _matchRule(rule, text, occupiedRanges) {
      var pattern = rule.pattern;
      var regex, match;
      try { regex = new RegExp(pattern, 'g'); } catch (e) { return null; }
      var matches = [];
      while ((match = regex.exec(text)) !== null) {
        var blocked = false;
        for (var i = 0; i < occupiedRanges.length; i++) {
          var oc = occupiedRanges[i];
          if (match.index < oc.end && (match.index + match[0].length) > oc.start) { blocked = true; break; }
        }
        if (!blocked) {
          matches.push({ full: match[0], index: match.index, groups: Array.prototype.slice.call(match, 1) });
          break;
        }
      }
      return matches.length > 0 ? matches[0] : null;
    },

    _applyRule(rule, match, text) {
      var groups = match.groups || [];
      var template = rule.replacement;
      if (groups.length === 0) return template;
      var slots = ['A', 'B', 'C', 'D', 'E', 'F'];
      var result = template;
      for (var i = 0; i < slots.length && i < groups.length; i++) {
        result = result.split('[' + slots[i] + ']').join(groups[i] || '');
      }
      return result;
    },

    diagnose(rulesTriggered) {
      var scores = { vocabulary: 0, syntax: 0, rhetoric: 0, logic: 0, emotion: 0 };
      rulesTriggered.forEach(function (rule) {
        var dim = rule.dimension === 'vocabulary' ? 'vocabulary'
          : rule.dimension === 'syntax' ? 'syntax'
          : rule.dimension === 'rhetoric' ? 'rhetoric' : 'logic';
        scores[dim] += rule.priority;
      });
      var maxScore = Math.max(1, scores.vocabulary, scores.syntax, scores.rhetoric, scores.logic, scores.emotion);
      Object.keys(scores).forEach(function (k) { scores[k] = Math.round((scores[k] / maxScore) * 100); });
      return scores;
    },

    getRecommendations(rulesTriggered, authorScore) {
      var workCounts = {};
      rulesTriggered.forEach(function (rule) {
        if (rule.source && rule.source.work) {
          workCounts[rule.source.work] = (workCounts[rule.source.work] || 0) + 1;
        }
      });
      var sorted = Object.keys(workCounts).sort(function (a, b) { return workCounts[b] - workCounts[a]; });
      var topWorks = sorted.slice(0, 3);
      var topAuthor = 'marx', topScore = 0;
      Object.keys(authorScore).forEach(function (a) {
        if (authorScore[a] > topScore) { topScore = authorScore[a]; topAuthor = a; }
      });
      var authorNames = { marx: '马克思', engels: '恩格斯', lenin: '列宁', stalin: '斯大林', mao: '毛泽东' };
      var authorName = topScore > 0 ? (authorNames[topAuthor] || topAuthor) : null;
      var description = '';
      if (authorName && topWorks.length > 0) {
        description = '本次写作中最常调用的逻辑骨架来自' + authorName + '《' + topWorks[0] + '》（共触发 ' + topScore + ' 次权重分）。';
      }
      return { author: topAuthor, topWorks: topWorks, description: description };
    },

    async deepPolish(text, author) {
      var apiBase = this._getApiBase();
      try {
        var resp = await fetch(apiBase + '/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: text, author: author, mode: 'deep_polish' }),
          signal: AbortSignal.timeout(60000)
        });
        if (!resp.ok) {
          var errData = await resp.json().catch(function () { return {}; });
          var message = errData.error || 'Vercel 返回 ' + resp.status;
          throw new Error('[API ' + resp.status + '] ' + message);
        }
        var data = await resp.json();
        // 标准化为 _renderResult 期望的格式
        return {
          result: data.result || '',
          usage: (data.diagnostics && data.diagnostics.usage) ? data.diagnostics.usage : {},
          diagnostics: data.diagnostics || {},
          inputType: data.inputType || null,
          matchedArticles: data.matchedArticles || [],
          windowRemaining: data.windowRemaining,
          dailyRemaining: data.dailyRemaining
        };
      } catch (e) {
        if (e.name === 'AbortError' || e.name === 'TimeoutError') {
          throw new Error('服务器响应超时，请稍后重试');
        }
        throw e;
      }
    },

    _getApiBase() {
      var configured = window.QMLM_API_BASE;
      if (typeof configured === 'string' && configured.trim()) {
        return configured.trim().replace(/\/$/, '');
      }
      return 'https://qmlm-reader.vercel.app';
    }
  };

  /* ================================================================
     Part 2.5: 弹窗控制器
     ================================================================ */

  var ModalController = {
    overlay: null, title: null, body: null, footer: null, closeBtn: null,

    init() {
      this.overlay  = document.getElementById('ms-modal-overlay');
      this.title    = document.getElementById('ms-modal-title');
      this.body     = document.getElementById('ms-modal-body');
      this.footer   = document.getElementById('ms-modal-footer');
      this.closeBtn = document.getElementById('ms-modal-close');
      var self = this;
      if (this.closeBtn) {
        this.closeBtn.addEventListener('click', function(e) { e.stopPropagation(); self.close(); });
      }
      if (this.overlay) {
        this.overlay.addEventListener('click', function(e) {
          if (e.target === self.overlay) self.close();
        });
      }
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') self.close();
      });
    },

    open(titleHTML, bodyHTML, footerHTML) {
      if (!this.overlay) return;
      if (this.title) this.title.innerHTML = titleHTML;
      if (this.body) this.body.innerHTML = bodyHTML;
      if (this.footer) this.footer.innerHTML = footerHTML || '';
      this.overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    },

    close() {
      if (!this.overlay) return;
      this.overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  };

  /* ================================================================
     Part 3: UI 控制器
     ================================================================ */

  var UIController = {
    elements: {},
    currentAuthor: 'stalin',
    currentPeriod: 'standard',
    lastResult: null,
    // 分析缓存（直到下次转换或刷新才清空）
    changesCache: null,
    diagnosisCache: null,
    // 多输入页
    inputPages: [{ text: '', result: null, changesCache: null, diagnosisCache: null }],
    currentPage: 0,

    init() {
      this._cacheElements();
      if (!this._checkElements()) return;
      this._bindEvents();
      this._updateCharCount();
      this._initPeriodTags();
    },

    _cacheElements() {
      var $ = function (id) { return document.getElementById(id); };
      this.elements = {
        inputText:      $('ms-input-text'),
        convertBtn:     $('ms-convert-btn'),
        convertBtnText: $('ms-convert-btn-text'),
        outputPanel:    $('ms-output-panel'),
        outputText:     $('ms-output-text'),
        outputBadge:    $('ms-output-badge'),
        outputSubtitle: $('ms-output-subtitle'),
        charCount:      $('ms-char-count'),
        toast:          $('ms-toast'),
        btnShare:       $('ms-btn-share'),
        btnCopy:        $('ms-btn-copy'),
        aiMeta:         $('ms-ai-meta'),
        periodSelector: $('ms-period-selector'),
        psTags:         $('ms-ps-tags')
      };
    },

    _checkElements() {
      if (!this.elements.inputText || !this.elements.convertBtn) {
        console.warn('[马列体] 关键 DOM 元素未找到，跳过 UI 初始化');
        return false;
      }
      return true;
    },

    _bindEvents() {
      var self = this;
      var els = this.elements;

      els.convertBtn.addEventListener('click', function () { self._handleConvert(); });

      els.inputText.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          self._handleConvert();
        }
      });

      els.inputText.addEventListener('input', function () { self._updateCharCount(); });

      if (els.btnShare) els.btnShare.addEventListener('click', function() { self._openShareModal(); });
      if (els.btnCopy)  els.btnCopy.addEventListener('click',  function() { self._copyText(); });

      // 润色与分段
      var polishBtn = document.getElementById('ms-polish-btn');
      if (polishBtn) polishBtn.addEventListener('click', function() { self._handlePolish(); });

      // 重新生成
      var regenBtn = document.getElementById('ms-btn-regenerate');
      if (regenBtn) regenBtn.addEventListener('click', function() { self._handleRegenerate(); });

      var changesBtn = document.getElementById('ms-btn-changes');
      if (changesBtn) changesBtn.addEventListener('click', function() { self._openChangesModal(); });

      var diagBtn = document.getElementById('ms-btn-diagnosis');
      if (diagBtn) diagBtn.addEventListener('click', function() { self._openDiagnosisModal(); });

      // 多页导航
      var inputPrev = document.getElementById('ms-input-prev');
      var inputNext = document.getElementById('ms-input-next');
      var inputAdd = document.getElementById('ms-input-add');
      if (inputPrev) inputPrev.addEventListener('click', function() { self._switchPage(self.currentPage - 1); });
      if (inputNext) inputNext.addEventListener('click', function() { self._switchPage(self.currentPage + 1); });
      if (inputAdd) inputAdd.addEventListener('click', function() { self._addPage(); });

      var outputPrev = document.getElementById('ms-output-prev');
      var outputNext = document.getElementById('ms-output-next');
      if (outputPrev) outputPrev.addEventListener('click', function() { self._switchPage(self.currentPage - 1); });
      if (outputNext) outputNext.addEventListener('click', function() { self._switchPage(self.currentPage + 1); });

      // 风格分析
      var styleBtn = document.getElementById('ms-style-btn');
      if (styleBtn) styleBtn.addEventListener('click', function() { self._handleStyleAnalysis(); });
    },

    // ---- 时期标签 ----
    _initPeriodTags() {
      var self = this;
      if (!this.elements.psTags) return;
      this.elements.psTags.querySelectorAll('.ms-ps-tag').forEach(function (tag) {
        tag.addEventListener('click', function () {
          var period = this.getAttribute('data-period');
          self.selectPeriod(period);
        });
      });
    },

    /** 更新时期标签文本（在切换导师时调用） */
    updatePeriodLabels(mentor) {
      if (!this.elements.periodSelector || !this.elements.psTags) return;

      // 检查是否有子模块（有子模块 = 有分期 Prompt）
      var entry = window.StalinAI_MENTOR_REGISTRY && window.StalinAI_MENTOR_REGISTRY[mentor.id];
      var hasModule = entry && entry.module && entry.module.periods;

      if (hasModule) {
        this.elements.periodSelector.style.display = 'block';
        var periods = entry.module.periods;
        var tags = this.elements.psTags.querySelectorAll('.ms-ps-tag');
        var periodKeys = ['standard', 'period1', 'period2', 'period3'];
        tags.forEach(function (t, i) {
          if (i < periodKeys.length) {
            var pd = periods[periodKeys[i]];
            t.textContent = pd ? pd.label : periodKeys[i];
            t.setAttribute('data-period', periodKeys[i]);
            t.style.display = '';
          } else {
            t.style.display = 'none';
          }
        });
        this.selectPeriod('standard');
      } else {
        this.elements.periodSelector.style.display = 'none';
        this.currentPeriod = 'standard';
      }
    },

    selectPeriod(period) {
      this.currentPeriod = period;
      if (!this.elements.psTags) return;
      this.elements.psTags.querySelectorAll('.ms-ps-tag').forEach(function (t) {
        t.classList.toggle('active', t.getAttribute('data-period') === period);
      });
    },

    // ---- 字数统计 ----
    _updateCharCount() {
      var len = this.elements.inputText.value.length;
      if (this.elements.charCount) {
        this.elements.charCount.textContent = len;
        if (len > 2000) {
          this.elements.charCount.style.color = '#c41e3a';
        } else if (len > 1500) {
          this.elements.charCount.style.color = '#d97706';
        } else {
          this.elements.charCount.style.color = '';
        }
      }
    },

    // ---- 核心：AI 转换 ----
    async _handleConvert() {
      var text = this.elements.inputText.value.trim();
      if (!text) { this._showToast('请先输入文字'); return; }
      if (text.length > 2000) { this._showToast('请控制在 2000 字以内'); return; }

      var author = this.currentAuthor;
      var hasModule = window.StalinAI_MENTOR_REGISTRY && window.StalinAI_MENTOR_REGISTRY[author] && window.StalinAI_MENTOR_REGISTRY[author].hasChild;
      var period = hasModule ? this.currentPeriod : 'standard';

      var btn = this.elements.convertBtn;
      var btnText = this.elements.convertBtnText;
      btn.disabled = true;
      if (btnText) btnText.textContent = '生成中...';

      var outText = this.elements.outputText;
      var meta = this.elements.aiMeta;
      this._setOutputText('<span style="color:#999;">正在生成……</span>', true);
      if (meta) meta.style.display = 'none';

      if (this.elements.outputSubtitle) {
        var authorNames = { marx: '马克思', engels: '恩格斯', lenin: '列宁', stalin: '斯大林', mao: '毛泽东' };
        var mentorLabel = authorNames[author] || '';
        var mentorModule = (window.StalinAI_MENTOR_REGISTRY && window.StalinAI_MENTOR_REGISTRY[author])
          ? window.StalinAI_MENTOR_REGISTRY[author].module : null;
        if (mentorModule && mentorModule.periods) {
          var pd = mentorModule.periods[period];
          this.elements.outputSubtitle.textContent = mentorLabel + ' · ' + (pd ? pd.desc : '');
        } else {
          this.elements.outputSubtitle.textContent = 'AI 深度修习';
        }
      }

      var self = this;

      // 优先走 Vercel 后端（免 Key）；失败则回退到用户个人 Key
      try {
        var vercelResult = await APIController.deepPolish(text, author);
        self._renderResult(vercelResult, outText, meta, text, 'vercel');
      } catch (vercelErr) {
        console.warn('[马列体] Vercel 后端不可用:', vercelErr.message);
        // 回退：用户个人 API Key
        if (window.StalinAI_hasApiKey && window.StalinAI_hasApiKey()) {
          try {
            var directResult = await window.StalinAIController.deepPolish(text, author, period);
            self._renderResult(directResult, outText, meta, text, 'direct');
          } catch (directErr) {
            console.error('[马列体] 直连也失败:', directErr);
            if (outText) {
              self._setOutputText('<span style="color:#c41e3a;">生成失败: ' + escHTML(directErr.message || '未知错误') + '</span>', true);
            }
            self._showToast('生成失败: ' + (directErr.message || '未知错误'));
          }
        } else {
          if (outText) {
            self._setOutputText('<span style="color:#c41e3a;">服务器繁忙，请稍后重试。</span>', true);
          }
          self._showToast('服务器不可用，可设置个人 API Key 作为备用');
          var keyBody = document.getElementById('ms-api-key-body');
          var toggleBtn = document.getElementById('ms-api-key-toggle');
          if (keyBody && keyBody.style.display === 'none' && toggleBtn) toggleBtn.click();
        }
      } finally {
        btn.disabled = false;
        if (btnText) btnText.textContent = '转 为 马 列 体';
      }
    },

    _renderResult(result, outText, meta, text, source) {
      this.lastResult = result;
      this.inputPages[this.currentPage].result = result;
      this.inputPages[this.currentPage].changesCache = null;
      this.inputPages[this.currentPage].diagnosisCache = null;
      this.inputPages[this.currentPage].text = text;

      if (outText) {
        var displayText = result.result || result.text || '';
        this._setOutputText(escHTML(displayText).replace(/\n/g, '<br>'), false);
      }
      if (meta) {
        meta.style.display = 'block';
        var tokens = (result.usage && result.usage.total_tokens) ? result.usage.total_tokens : '?';
        var typeLabels = { factual: '事实陈述', personal: '个人感受', opinion: '观点论证', abstract: '抽象思辨', casual: '日常闲聊' };
        var typeLabel = typeLabels[result.inputType] || result.inputType || '';
        var articlesInfo = '';
        if (result.matchedArticles && result.matchedArticles.length > 0) {
          articlesInfo = '<span style="margin-left:12px;">📖 ' + result.matchedArticles.map(function(a){return '《'+a.title+'》';}).join(' ') + '</span>';
        }
        var sourceLabel = source === 'vercel' ? '<span style="margin-left:12px;color:#059669;">通过 Vercel</span>' : '<span style="margin-left:12px;color:#d97706;">个人 Key 直连</span>';
        meta.innerHTML = '<span>Tokens: ' + tokens + '</span>'
          + (typeLabel ? '<span style="margin-left:12px;">类型: ' + typeLabel + '</span>' : '')
          + articlesInfo
          + sourceLabel;
      }

      if (this.elements.outputPanel) this.elements.outputPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },

    // ---- 润色与分段 ----
    async _handlePolish() {
      var text = this.elements.inputText.value.trim();
      if (!text) { this._showToast('请先输入文字'); return; }

      if (!window.StalinAI_hasApiKey || !window.StalinAI_hasApiKey()) {
        this._showToast('请先设置 API Key'); return;
      }

      var btn = document.getElementById('ms-polish-btn');
      btn.disabled = true;
      btn.textContent = '✎ 润色中...';

      var outText = this.elements.outputText;
      var meta = this.elements.aiMeta;
      this._setOutputText('<span style="color:#999;">正在梳理逻辑与段落结构……</span>', true);
      if (meta) meta.style.display = 'none';
      if (this.elements.outputBadge) this.elements.outputBadge.textContent = '润色';
      if (this.elements.outputSubtitle) this.elements.outputSubtitle.textContent = '逻辑梳理 · 段落优化';

      try {
        var result = await window.StalinAIController.polishAndRestructure(text);
        this.lastResult = result;

        if (outText) {
          this._setOutputText(escHTML(result.result).replace(/\n/g, '<br>'), false);
        }
        if (meta) {
          meta.style.display = 'block';
          meta.innerHTML = '<span>Tokens: ' + (result.usage && result.usage.total_tokens || '?') + '</span>'
            + '<span style="margin-left:12px;">润色与分段</span>';
        }
        if (this.elements.outputPanel) this.elements.outputPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        // 润色后的文本回填输入框
        this.elements.inputText.value = result.result;
        this._updateCharCount();
        this._showToast('润色完成，结果已回填到输入框');
      } catch (e) {
        console.error('[马列体] 润色失败:', e);
        if (outText) outText.innerHTML = '<span style="color:#c41e3a;">❌ ' + escHTML(e.message || '未知错误') + '</span>';
        this._showToast('润色失败: ' + (e.message || '未知错误'));
      } finally {
        btn.disabled = false;
        btn.textContent = '✎ 润色与分段';
      }
    },

    // ---- 重新生成 ----
    async _handleRegenerate() {
      var text = this.elements.inputText.value.trim();
      if (!text) { this._showToast('请先输入文字'); return; }

      if (!window.StalinAI_hasApiKey || !window.StalinAI_hasApiKey()) {
        this._showToast('请先设置 API Key'); return;
      }

      var author = this.currentAuthor;
      var hasModule = window.StalinAI_MENTOR_REGISTRY && window.StalinAI_MENTOR_REGISTRY[author] && window.StalinAI_MENTOR_REGISTRY[author].hasChild;
      var period = hasModule ? this.currentPeriod : 'standard';

      var btn = document.getElementById('ms-btn-regenerate');
      btn.disabled = true;
      btn.textContent = '🔄 生成中...';

      var outText = this.elements.outputText;
      var meta = this.elements.aiMeta;
      this._setOutputText('<span style="color:#999;">重新随机经典片段，正在生成……</span>', true);
      if (meta) meta.style.display = 'none';
      if (this.elements.outputBadge) this.elements.outputBadge.textContent = 'DeepSeek';
      if (this.elements.outputSubtitle) this.elements.outputSubtitle.textContent = '重新生成 · 新的随机片段';

      try {
        var result = await window.StalinAIController.regenerate(text, author, period);
        this.lastResult = result;
        this._setOutputText(escHTML(result.result).replace(/\n/g, '<br>'), false);
        if (meta) {
          meta.style.display = 'block';
          var typeLabels = { factual: '事实陈述', personal: '个人感受', opinion: '观点论证', abstract: '抽象思辨' };
          meta.innerHTML = '<span>Tokens: ' + (result.usage && result.usage.total_tokens || '?') + '</span>'
            + '<span style="margin-left:12px;">类型: ' + (typeLabels[result.inputType] || result.inputType) + '</span>'
            + '<span style="margin-left:12px;">🔄 重新生成</span>';
        }
        this._showToast('已用新的随机片段重新生成');
      } catch (e) {
        console.error('[马列体] 重新生成失败:', e);
        if (outText) outText.innerHTML = '<span style="color:#c41e3a;">❌ ' + escHTML(e.message || '未知错误') + '</span>';
      } finally {
        btn.disabled = false;
        btn.textContent = '🔄 重新生成';
      }
    },

    // ---- 修改明细（AI生成） ----
    async _openChangesModal() {
      var page = this.inputPages[this.currentPage];
      if (!page || !page.result) return;
      var original = page.text || this.elements.inputText.value.trim();
      var converted = page.result.result;
      if (!original || !converted) return;

      // 缓存命中
      if (page.changesCache) {
        this._renderChangesModal(page.changesCache);
        return;
      }

      ModalController.open('修 改 明 细', '<div style="text-align:center;color:#999;padding:20px;">AI 正在分析差异……</div>', '');
      try {
        var result = await window.StalinAIController.analyzeChanges(original, converted);
        var data = result.data;
        page.changesCache = data;  // 缓存
        this._renderChangesModal(data);
      } catch (e) {
        ModalController.open('修 改 明 细', '<p style="color:#c41e3a;">分析失败: ' + escHTML(e.message) + '</p>', '');
      }
    },

    _renderChangesModal(data) {
      var html = '';
      if (data.summary) {
        html += '<p style="margin-bottom:16px;font-weight:600;">' + escHTML(data.summary) + '</p>';
      }
      if (data.changes && data.changes.length > 0) {
        var typeColors = { '词汇替换': '#c41e3a', '句式重组': '#2563eb', '逻辑重构': '#059669', '提升为结构性描述': '#d97706', '丢弃': '#999', '保留': '#666' };
        html += '<div class="ms-changes-list">';
        data.changes.forEach(function (ch) {
          var color = typeColors[ch.type] || '#666';
          html += '<div class="ms-change-item" style="margin-bottom:14px;padding:10px;background:#fafaf8;border-left:3px solid ' + color + ';">';
          html += '<span style="font-size:0.7rem;color:' + color + ';font-weight:600;">[' + escHTML(ch.type) + ']</span> ';
          html += '<span style="color:#999;text-decoration:line-through;">' + escHTML(ch.original) + '</span>';
          html += ' <span style="color:#1a1a1a;">→</span> ';
          html += '<span style="color:#c41e3a;">' + escHTML(ch.replaced) + '</span>';
          if (ch.reason) html += '<br><span style="font-size:0.75rem;color:#888;">' + escHTML(ch.reason) + '</span>';
          html += '</div>';
        });
        html += '</div>';
      }
      ModalController.open('修 改 明 细', html, '');
    },

    // ---- 风格诊断（AI生成 + 雷达图） ----
    async _openDiagnosisModal() {
      var page = this.inputPages[this.currentPage];
      if (!page || !page.result) return;
      var converted = page.result.result;
      if (!converted) return;

      // 缓存命中
      if (page.diagnosisCache) {
        this._renderDiagnosisModal(page.diagnosisCache);
        return;
      }

      ModalController.open('风 格 诊 断', '<div style="text-align:center;color:#999;padding:20px;">AI 正在分析文体特征……</div>', '');
      try {
        var result = await window.StalinAIController.analyzeDiagnosis(converted);
        var data = result.data;
        page.diagnosisCache = data;  // 缓存
        this._renderDiagnosisModal(data);
      } catch (e) {
        ModalController.open('风 格 诊 断', '<p style="color:#c41e3a;">诊断失败: ' + escHTML(e.message) + '</p>', '');
      }
    },

    // ---- 分享卡片 ----
    _openShareModal() {
      if (!this.lastResult) return;
      var self = this;
      var original = this.elements.inputText.value.trim();
      var converted = this.lastResult.result;
      var author = this.currentAuthor;

      var pages;
      try {
        pages = ShareCardGenerator.generateAllPages(original, converted, author);
      } catch (e) {
        console.error('[分享卡片] 生成失败:', e);
        self._showToast('卡片生成失败，请重试');
        return;
      }
      if (!pages || pages.length === 0) return;
      var totalPages = pages.length;

      var currentSharePage = 0;
      function renderPage() {
        var cvs = pages[currentSharePage];
        var img = document.createElement('img');
        img.src = cvs.toDataURL('image/png');
        img.style.cssText = 'width:100%;max-width:340px;display:block;margin:0 auto;border:2px solid #1a1a1a;';
        var navHTML = totalPages > 1
          ? '<div style="text-align:center;margin:10px 0;font-size:0.8rem;color:#666;">'
            + '<button class="ms-page-btn" id="ms-share-prev" style="display:inline-flex;">◀</button> '
            + '<span id="ms-share-page-num" style="margin:0 8px;">' + (currentSharePage+1) + ' / ' + totalPages + '</span> '
            + '<button class="ms-page-btn" id="ms-share-next" style="display:inline-flex;">▶</button>'
            + '</div>'
          : '';
        var footerHTML = '<button class="ms-btn-primary" id="ms-modal-download-btn">下载本页</button> '
          + (totalPages > 1 ? '<button class="ms-btn-secondary" id="ms-modal-download-all-btn">下载全部(' + totalPages + '页)</button> ' : '')
          + '<button class="ms-btn-secondary" id="ms-modal-copy-btn">复制文字</button>';

        ModalController.open('分 享 卡 片', '<div style="text-align:center;">' + img.outerHTML + navHTML + '</div>', footerHTML);

        setTimeout(function () {
          var dlBtn = document.getElementById('ms-modal-download-btn');
          if (dlBtn) dlBtn.addEventListener('click', function () {
            pages[currentSharePage].toBlob(function (blob) {
              var url = URL.createObjectURL(blob);
              var a = document.createElement('a');
              a.href = url; a.download = '马列体_' + new Date().toISOString().slice(0, 10) + '_p' + (currentSharePage + 1) + '.png';
              a.click(); URL.revokeObjectURL(url);
            }, 'image/png');
            self._showToast('第' + (currentSharePage + 1) + '页已下载');
          });

          var dlAllBtn = document.getElementById('ms-modal-download-all-btn');
          if (dlAllBtn) dlAllBtn.addEventListener('click', function () {
            pages.forEach(function (cvs, i) {
              cvs.toBlob(function (blob) {
                var url = URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url; a.download = '马列体_' + new Date().toISOString().slice(0, 10) + '_p' + (i + 1) + '.png';
                a.click(); URL.revokeObjectURL(url);
              }, 'image/png');
            });
            self._showToast('全部' + totalPages + '页已下载');
          });

          var cpBtn = document.getElementById('ms-modal-copy-btn');
          if (cpBtn) cpBtn.addEventListener('click', function () { self._copyText(); });

          var prevBtn = document.getElementById('ms-share-prev');
          var nextBtn = document.getElementById('ms-share-next');
          if (prevBtn) prevBtn.addEventListener('click', function () {
            if (currentSharePage > 0) { currentSharePage--; renderPage(); }
          });
          if (nextBtn) nextBtn.addEventListener('click', function () {
            if (currentSharePage < totalPages - 1) { currentSharePage++; renderPage(); }
          });
        }, 50);
      }

      renderPage();
    },

    // ---- 复制 ----
    _copyText() {
      if (!this.lastResult) return;
      var text = this.lastResult.result;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(function () { fallbackCopy(text); });
      } else {
        fallbackCopy(text);
      }
      this._showToast('已复制到剪贴板');
    },

    /** 设输出文本，自动处理占位样式 */
    _setOutputText(html, isPlaceholder) {
      var el = this.elements.outputText;
      if (!el) return;
      el.innerHTML = html;
      el.style.color = isPlaceholder ? '#aaa' : '#2a2a2a';
      el.style.fontStyle = isPlaceholder ? 'italic' : 'normal';
    },

    // ---- Toast ----
    _showToast(msg) {
      var toast = this.elements.toast;
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'ms-toast';
        toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1a1a1a;color:#fff;padding:10px 24px;font-size:0.9rem;z-index:9999;transition:opacity 0.3s;pointer-events:none;';
        document.body.appendChild(toast);
        this.elements.toast = toast;
      }
      toast.textContent = msg;
      toast.style.opacity = '1';
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(function () { toast.style.opacity = '0'; }, 2000);
    },

    // ---- 多页管理 ----
    _addPage() {
      if (this.inputPages.length >= 6) { this._showToast('最多支持 6 页'); return; }
      // 保存当前页文本
      this.inputPages[this.currentPage].text = this.elements.inputText.value;
      this.inputPages.push({ text: '', result: null, changesCache: null, diagnosisCache: null });
      this._switchPage(this.inputPages.length - 1);
    },

    _switchPage(idx) {
      if (idx < 0 || idx >= this.inputPages.length) return;
      // 保存当前页文本
      this.inputPages[this.currentPage].text = this.elements.inputText.value;
      // 切换
      this.currentPage = idx;
      // 恢复目标页文本和结果
      var page = this.inputPages[idx];
      this.elements.inputText.value = page.text || '';
      this._updateCharCount();
      this.lastResult = page.result || null;
      // 渲染输出
      if (page.result) {
        if (this.elements.outputText) {
          this._setOutputText(escHTML(page.result.result).replace(/\n/g, '<br>'), false);
        }
        if (this.elements.aiMeta && page.result.usage) {
          this.elements.aiMeta.style.display = 'block';
          this.elements.aiMeta.innerHTML = '<span>Tokens: ' + (page.result.usage.total_tokens || '?') + '</span>';
        }
      } else {
        if (this.elements.outputText) {
          this._setOutputText('转换后的文本将显示在这里……', true);
        }
      }
      this._updatePageNav();
    },

    _updatePageNav() {
      var inputNum = document.getElementById('ms-input-page-num');
      var outputNum = document.getElementById('ms-output-page-num');
      var info = (this.currentPage + 1) + ' / ' + this.inputPages.length;
      if (inputNum) inputNum.textContent = info;
      if (outputNum) outputNum.textContent = info;
      var inputPrev = document.getElementById('ms-input-prev');
      var inputNext = document.getElementById('ms-input-next');
      var outputPrev = document.getElementById('ms-output-prev');
      var outputNext = document.getElementById('ms-output-next');
      if (inputPrev) inputPrev.disabled = this.currentPage <= 0;
      if (inputNext) inputNext.disabled = this.currentPage >= this.inputPages.length - 1;
      if (outputPrev) outputPrev.disabled = this.currentPage <= 0;
      if (outputNext) outputNext.disabled = this.currentPage >= this.inputPages.length - 1;
    },

    /** 归一化AI输出键名：把 sentencelength → sentence_length, inputprofile → input_profile 等 */
    _normalizeKeys(data) {
      var out = {};
      Object.keys(data).forEach(function (k) {
        var nk = k
          .replace(/^inputscores$/, 'input_scores')
          .replace(/^inputprofile$/, 'input_profile')
          .replace(/^inputProfile$/, 'input_profile')
          .replace(/^mentorcomparisons$/, 'mentor_comparisons')
          .replace(/^mentorComparisons$/, 'mentor_comparisons')
          .replace(/^bestmatch$/, 'best_match')
          .replace(/^bestMatch$/, 'best_match')
          .replace(/^learningadvice$/, 'learning_advice')
          .replace(/^learningAdvice$/, 'learning_advice')
          .replace(/^mentorproximity$/, 'mentor_proximity')
          .replace(/^mentorProximity$/, 'mentor_proximity')
          .replace(/^stylematch$/, 'style_match')
          .replace(/^styleMatch$/, 'style_match')
          .replace(/^ideologycheck$/, 'ideology_check')
          .replace(/^ideologyCheck$/, 'ideology_check')
          .replace(/^structurecheck$/, 'structure_check')
          .replace(/^structureCheck$/, 'structure_check')
          .replace(/^stylecheck$/, 'style_check')
          .replace(/^styleCheck$/, 'style_check')
          .replace(/^tocomrades$/, 'to_comrades')
          .replace(/^toComrades$/, 'to_comrades');
        out[nk] = data[k];
      });
      // 递归处理嵌套对象
      Object.keys(out).forEach(function (k) {
        if (out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) {
          out[k] = this._normalizeKeys(out[k]);
        }
      }, this);
      return out;
    },

    /** 归一化五维分数键名 */
    _normalizeScores(scores) {
      if (!scores) return {};
      var map = {
        'sentencelength': 'sentence_length', 'sentenceLength': 'sentence_length',
        'sentence_length': 'sentence_length',
        'variety': 'variety', 'diversity': 'variety',
        'metaphor': 'metaphor', 'metaphordensity': 'metaphor', 'metaphorDensity': 'metaphor',
        'emotion': 'emotion', 'emotional': 'emotion', 'temperature': 'emotion', 'emotionTemp': 'emotion',
        'rhythm': 'rhythm', 'pace': 'rhythm', 'argumentation': 'rhythm'
      };
      var out = {};
      Object.keys(scores).forEach(function (k) {
        var nk = map[k] || map[k.toLowerCase()] || k;
        out[nk] = scores[k];
      });
      return out;
    },

    _renderDiagnosisModal(data) {
      data = this._normalizeKeys(data);
      var scores = this._normalizeScores(data.scores || {});
      // 确保五个维度都有值
      ['sentence_length', 'variety', 'metaphor', 'emotion', 'rhythm'].forEach(function (k) {
        if (!(k in scores)) scores[k] = 0;
      });
      var html = '';

      // 顶部：五维雷达 + 导师接近度
      html += '<div style="display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap;margin-bottom:16px;">';
      html += '<div style="text-align:center;flex-shrink:0;">';
      html += '<canvas id="ms-radar-diag" width="340" height="340" style="width:320px;height:320px;"></canvas>';
      html += '<span style="font-size:0.7rem;color:#999;">五维文体诊断</span>';
      html += '</div>';
      html += '<div style="flex:1;min-width:200px;">';
      // 五维条形图
      var dims = [
        { key: 'sentence_length', label: '句长', color: '#c41e3a', hint: '短← →长' },
        { key: 'variety', label: '句式多样性', color: '#2563eb', hint: '单一← →丰富' },
        { key: 'metaphor', label: '隐喻密度', color: '#059669', hint: '零修辞← →密集' },
        { key: 'emotion', label: '情感温度', color: '#d97706', hint: '冷静← →激昂' },
        { key: 'rhythm', label: '论证节奏', color: '#7c3aed', hint: '缓慢← →紧迫' }
      ];
      dims.forEach(function (d) {
        var val = scores[d.key] || 0;
        html += '<div style="margin-bottom:10px;">';
        html += '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2px;">';
        html += '<span style="font-weight:700;font-size:0.85rem;color:' + d.color + ';">' + d.label + '</span>';
        html += '<span style="font-size:0.7rem;color:#999;">' + d.hint + '</span>';
        html += '<span style="font-size:1.1rem;font-weight:900;color:' + d.color + ';">' + val + '</span>';
        html += '</div>';
        html += '<div style="height:5px;background:#eee;border-radius:2px;"><div style="height:5px;background:' + d.color + ';width:' + (val*10) + '%;border-radius:2px;"></div></div>';
        html += '</div>';
      });
      // 导师接近度
      if (data.mentor_proximity) {
        html += '<div style="margin-top:14px;padding:10px;background:#fafaf8;">';
        html += '<span style="font-size:0.75rem;font-weight:700;color:#555;">导师接近度 </span>';
        var mentors = [
          { key: 'marx', label: '马克思', color: '#c41e3a' },
          { key: 'engels', label: '恩格斯', color: '#2563eb' },
          { key: 'lenin', label: '列宁', color: '#d97706' },
          { key: 'stalin', label: '斯大林', color: '#c2410c' },
          { key: 'mao', label: '毛泽东', color: '#059669' }
        ];
        mentors.forEach(function (m) {
          var pct = data.mentor_proximity[m.key] || 0;
          html += '<span style="display:inline-block;margin:2px 6px 2px 0;font-size:0.75rem;">';
          html += '<span style="color:' + m.color + ';font-weight:600;">' + m.label + '</span> ';
          html += '<span style="color:#888;">' + pct + '%</span>';
          html += '</span>';
        });
        html += '</div>';
      }
      html += '</div></div>';

      if (data.mentor_match) {
        html += '<p style="text-align:center;font-weight:600;margin:0 0 14px;color:#1a1a1a;">' + escHTML(data.mentor_match) + '</p>';
      }

      // 政委审阅
      if (data.ideology_check) {
        var ic = data.ideology_check;
        html += '<div style="background:#fef9f9;border-left:3px solid #c41e3a;padding:10px 14px;margin-bottom:10px;">';
        html += '<strong style="color:#c41e3a;">思想觉悟 · 立场与认识</strong>';
        if (ic.standpoint) html += '<p style="margin:4px 0;">' + escHTML(ic.standpoint) + '</p>';
        if (ic.correct && ic.correct.length > 0) html += '<p style="color:#059669;font-size:0.8rem;margin:4px 0;">✓ ' + ic.correct.map(escHTML).join(' · ') + '</p>';
        if (ic.concern && ic.concern.length > 0) html += '<p style="color:#d97706;font-size:0.8rem;margin:4px 0;">⚠ ' + ic.concern.map(escHTML).join(' · ') + '</p>';
        html += '</div>';
      }
      if (data.structure_check) {
        var sc = data.structure_check;
        html += '<div style="background:#f5f7fe;border-left:3px solid #2563eb;padding:10px 14px;margin-bottom:10px;">';
        html += '<strong style="color:#2563eb;">结构脉络 · 论证骨架</strong>';
        if (sc.flow) html += '<p style="margin:4px 0;font-size:0.85rem;">' + escHTML(sc.flow) + '</p>';
        if (sc.strength && sc.strength.length > 0) html += '<p style="color:#059669;font-size:0.8rem;margin:4px 0;">✓ ' + sc.strength.map(escHTML).join(' · ') + '</p>';
        if (sc.gap && sc.gap.length > 0) html += '<p style="color:#d97706;font-size:0.8rem;margin:4px 0;">△ ' + sc.gap.map(escHTML).join(' · ') + '</p>';
        html += '</div>';
      }
      if (data.style_check) {
        var stc = data.style_check;
        html += '<div style="background:#f5faf7;border-left:3px solid #059669;padding:10px 14px;margin-bottom:10px;">';
        html += '<strong style="color:#059669;">文风笔法 · 句式与措辞</strong>';
        if (stc.highlight && stc.highlight.length > 0) html += '<p style="color:#059669;font-size:0.8rem;margin:4px 0;">✓ ' + stc.highlight.map(escHTML).join(' · ') + '</p>';
        if (stc.traceability && stc.traceability.length > 0) {
          html += '<p style="font-size:0.8rem;margin:8px 0 4px;font-weight:600;">📖 溯源识别</p>';
          stc.traceability.forEach(function (t) { html += '<p style="font-size:0.78rem;margin:2px 0;color:#555;padding-left:12px;">▸ ' + escHTML(t) + '</p>'; });
        }
        html += '</div>';
      }
      if (data.verdict) {
        var verdictText = escHTML(data.verdict);
        // 双换行 → 段落分割
        if (verdictText.indexOf('\n\n') !== -1) {
          verdictText = verdictText.replace(/\n\n+/g, '</p><p style="margin:8px 0;">');
        } else if (verdictText.length > 60) {
          // 兜底：若无显式段落分隔，在第一个句号后自动分段
          var firstPeriod = verdictText.indexOf('。');
          if (firstPeriod > 20 && firstPeriod < verdictText.length - 10) {
            verdictText = verdictText.slice(0, firstPeriod + 1) + '</p><p style="margin:8px 0;">' + verdictText.slice(firstPeriod + 1);
          }
        }
        verdictText = '<p style="margin:8px 0;">' + verdictText + '</p>';
        html += '<div style="background:#f5f0e8;border-left:4px solid #c41e3a;padding:14px 18px;font-size:0.9rem;line-height:1.8;"><strong style="color:#c41e3a;">📋 政委总结</strong><br>' + verdictText + '</div>';
      }
      // 兼容旧版 to_comrades 字段
      if (data.to_comrades) {
        html += '<div style="background:#fffbeb;border:1px solid #f0e68c;padding:10px 14px;margin-bottom:10px;"><strong>📢 对同志们说：</strong> ' + escHTML(data.to_comrades) + '</div>';
      }
      html += '<p style="margin-top:12px;text-align:right;font-size:0.75rem;"><a href="../../html/articles/articles.html" target="_blank" style="color:#c41e3a;">📚 查阅马列主义经典著作 →</a></p>';

      ModalController.open('风 格 诊 断', html, '');

      // 五维雷达图
      setTimeout(function () {
        var canvas = document.getElementById('ms-radar-diag');
        if (canvas) {
          var ctx = canvas.getContext('2d');
          var W = 340, H = 340, cx = W/2, cy = H/2, R = 115;
          canvas.width = W; canvas.height = H;
          ctx.clearRect(0, 0, W, H);

          var axes = [
            { key: 'sentence_length', label: '句长', angle: -Math.PI/2 },
            { key: 'variety', label: '句式多样', angle: -Math.PI/2 + Math.PI*2/5 },
            { key: 'metaphor', label: '隐喻密度', angle: -Math.PI/2 + Math.PI*4/5 },
            { key: 'emotion', label: '情感温度', angle: -Math.PI/2 + Math.PI*6/5 },
            { key: 'rhythm', label: '论证节奏', angle: -Math.PI/2 + Math.PI*8/5 }
          ];

          for (var level = 1; level <= 5; level++) {
            var r = (R/5) * level;
            ctx.beginPath();
            axes.forEach(function (a, i) {
              var px = cx + r * Math.cos(a.angle), py = cy + r * Math.sin(a.angle);
              if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            });
            ctx.closePath();
            ctx.strokeStyle = level === 5 ? '#bbb' : 'rgba(0,0,0,0.06)';
            ctx.lineWidth = level === 5 ? 1.5 : 0.5; ctx.stroke();
          }
          axes.forEach(function (a) {
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R * Math.cos(a.angle), cy + R * Math.sin(a.angle));
            ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 1; ctx.stroke();
          });
          ctx.beginPath();
          axes.forEach(function (a, i) {
            var val = (scores[a.key] || 0) / 10;
            var px = cx + R * val * Math.cos(a.angle), py = cy + R * val * Math.sin(a.angle);
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          });
          ctx.closePath();
          ctx.fillStyle = 'rgba(196, 30, 58, 0.12)'; ctx.fill();
          ctx.strokeStyle = '#c41e3a'; ctx.lineWidth = 2; ctx.stroke();
          axes.forEach(function (a) {
            var val = (scores[a.key] || 0) / 10;
            var px = cx + R * val * Math.cos(a.angle), py = cy + R * val * Math.sin(a.angle);
            ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#c41e3a'; ctx.fill();
          });
          ctx.fillStyle = '#1a1a1a';
          ctx.font = '600 12px -apple-system, "Microsoft YaHei", sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          axes.forEach(function (a) {
            var lx = cx + (R + 28) * Math.cos(a.angle), ly = cy + (R + 28) * Math.sin(a.angle);
            ctx.fillText(a.label, lx, ly);
          });
        }
      }, 150);
    },

    // ---- 风格分析（弹窗） ----
    async _handleStyleAnalysis() {
      var text = this.elements.inputText.value.trim();
      if (!text) { this._showToast('请先输入文字'); return; }
      if (!window.StalinAI_hasApiKey || !window.StalinAI_hasApiKey()) {
        this._showToast('请先设置 API Key'); return;
      }

      // 缓存
      var page = this.inputPages[this.currentPage];
      var cacheKey = 'style_analysis_' + this.currentPage;
      if (page[cacheKey]) {
        this._renderStyleAnalysisModal(page[cacheKey]);
        return;
      }

      var author = this.currentAuthor;
      var btn = document.getElementById('ms-style-btn');
      btn.disabled = true;
      btn.textContent = '🔍 分析中...';

      ModalController.open('风 格 分 析', '<div style="text-align:center;color:#999;padding:40px;">正在拆解文本段落，与导师时期风格进行对比分析……</div>', '');

      try {
        var result = await window.StalinAIController.analyzeStyle(text, author);
        page[cacheKey] = result.data || result;
        this._renderStyleAnalysisModal(result.data || result);
      } catch (e) {
        ModalController.open('风 格 分 析', '<p style="color:#c41e3a;">分析失败: ' + escHTML(e.message) + '</p>', '');
      } finally {
        btn.disabled = false;
        btn.textContent = '🔍 风格分析';
      }
    },

    _renderStyleAnalysisModal(data) {
      data = this._normalizeKeys(data);
      var ip = data.input_profile || {};
      var mcs = data.mentor_comparisons || [];
      var bm = data.best_match || {};
      var la = data.learning_advice || [];
      var html = '';
      var mentorColors = { '马克思': '#c41e3a', '恩格斯': '#2563eb', '列宁': '#d97706', '斯大林': '#c2410c', '毛泽东': '#059669' };

      // 输入特征
      if (Object.keys(ip).length > 0) {
        html += '<h4 style="margin:0 0 8px;">📝 输入文本特征</h4>';
        html += '<table style="width:100%;font-size:0.85rem;border-collapse:collapse;margin-bottom:16px;">';
        Object.keys(ip).forEach(function (k) {
          html += '<tr><td style="padding:4px 8px;font-weight:600;color:#555;white-space:nowrap;vertical-align:top;">' + escHTML(k) + '</td><td style="padding:4px 8px;">' + escHTML(ip[k]) + '</td></tr>';
        });
        html += '</table>';
      }

      // 最佳匹配
      if (bm.mentor) {
        var mc = mentorColors[bm.mentor] || '#1a1a1a';
        html += '<div style="background:#fff;border:2px solid ' + mc + ';padding:12px;margin-bottom:16px;text-align:center;">';
        html += '<span style="font-weight:900;font-size:1.1rem;color:' + mc + ';">' + escHTML(bm.mentor) + '</span>';
        if (bm.period) html += ' <span style="color:#888;">· ' + escHTML(bm.period) + '</span>';
        if (bm.reason) html += '<br><span style="font-size:0.85rem;">' + escHTML(bm.reason) + '</span>';
        html += '</div>';
      }

      // 五位导师对比
      if (mcs.length > 0) {
        html += '<h4 style="margin:0 0 8px;">🔬 导师风格对比</h4>';
        mcs.forEach(function (mc) {
          var c = mentorColors[mc.mentor] || '#666';
          html += '<div style="background:#fafaf8;padding:10px;margin-bottom:8px;border-left:3px solid ' + c + ';">';
          html += '<strong style="color:' + c + ';">' + escHTML(mc.mentor) + '</strong>';
          if (mc.overlap && mc.overlap.length > 0) {
            html += '<br><span style="color:#059669;font-size:0.8rem;">✓ 相近：' + mc.overlap.map(escHTML).join(' · ') + '</span>';
          }
          if (mc.gap && mc.gap.length > 0) {
            html += '<br><span style="color:#c41e3a;font-size:0.8rem;">△ 差异：' + mc.gap.map(escHTML).join(' · ') + '</span>';
          }
          html += '</div>';
        });
      }

      // 跨导师学习建议
      if (la.length > 0) {
        html += '<div style="background:#fffbeb;border:1px solid #f0e68c;padding:12px 14px;margin-top:14px;">';
        html += '<strong>💡 跨导师学习建议</strong>';
        la.forEach(function (adv) {
          html += '<p style="font-size:0.85rem;margin:6px 0;">▸ ' + escHTML(adv) + '</p>';
        });
        html += '</div>';
      }

      if (data.summary) {
        html += '<p style="font-size:0.9rem;line-height:1.7;color:#555;margin-top:12px;">' + escHTML(data.summary) + '</p>';
      }
      ModalController.open('风 格 分 析', html, '');
    }
  };

  /* ================================================================
     Part 3: Canvas 分享卡片生成器
     ================================================================ */

  var ShareCardGenerator = {
    W: 1080, H: 1600, MARGIN: 76,
    LINE_H: 30, PARA_GAP: 10,
    FONT: '19px "Noto Serif SC", "STSong", serif',
    INDENT: 38,
    CONTENT_WIDTH: 1080 - 76 * 2, // = 928

    /** 预加载的二维码图片 */
    _qrImage: null,
    preloadQR: function (relativePath) {
      var self = this;
      // file:// 协议下加载本地图片会污染 Canvas 导致 toDataURL 抛 SecurityError
      if (window.location.protocol === 'file:') return;
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () { self._qrImage = img; };
      img.onerror = function () { self._qrImage = null; };
      img.src = relativePath || '../../images/pic/qr-code.png';
    },

    /** 预包裹：将文本按段落拆分，每个段落的每一行预计算好 */
    _preprocess(text, ctx) {
      if (!text) return [];
      var self = this;
      ctx.font = this.FONT;
      var paragraphs = text.split(/\n\n+/).filter(function(p) { return p.trim(); });
      return paragraphs.map(function(para) {
        var cleaned = para.replace(/\n/g, '').trim();
        var lines = wrapText(ctx, cleaned, self.CONTENT_WIDTH);
        return { text: cleaned, lines: lines };
      });
    },

    /** 渲染所有页，返回 canvas 数组 */
    generateAllPages(originalText, convertedText, author) {
      // 创建测量用 canvas
      var measureCanvas = document.createElement('canvas');
      var mctx = measureCanvas.getContext('2d');

      var origParas = this._preprocess(originalText, mctx);
      var convParas = this._preprocess(convertedText, mctx);

      var pages = [];
      var state = {
        origIdx: 0, origLine: 0,    // 当前渲染到的原文段落索引和行偏移
        convIdx: 0, convLine: 0,    // 当前渲染到的转换文段落索引和行偏移
        origDone: origParas.length === 0,
        inConverted: origParas.length === 0, // 是否已经开始渲染转换文
      };

      while (true) {
        var canvas = document.createElement('canvas');
        state = this._renderPage(canvas, origParas, convParas, author, state, pages.length + 1);
        pages.push(canvas);
        if (state.done) break;
      }

      // 回填总页数
      var totalPages = pages.length;
      for (var p = 0; p < pages.length; p++) {
        this._stampPageNumber(pages[p], p + 1, totalPages);
      }

      return pages;
    },

    /** 渲染单页，返回新 state。state.done=true 表示全部渲染完毕 */
    _renderPage(canvas, origParas, convParas, author, state, pageNum) {
      var dpr = window.devicePixelRatio || 1;
      canvas.width = this.W * dpr; canvas.height = this.H * dpr;
      canvas.style.width = this.W + 'px'; canvas.style.height = this.H + 'px';
      var ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      var self = this;

      // 背景
      ctx.fillStyle = '#f8f8f8';
      ctx.fillRect(0, 0, this.W, this.H);
      ctx.fillStyle = '#c41e3a';
      ctx.fillRect(0, 0, this.W, 10);
      ctx.fillRect(0, 0, 8, this.H);

      // 网点
      ctx.fillStyle = 'rgba(26,26,26,0.025)';
      for (var x = this.MARGIN; x < this.W - this.MARGIN; x += 14) {
        for (var y = 140; y < this.H - 140; y += 14) {
          ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI * 2); ctx.fill();
        }
      }

      var titleY = 130;
      var authorNames = { marx: '马克思', engels: '恩格斯', lenin: '列宁', stalin: '斯大林', mao: '毛泽东' };
      var authorLabel = authorNames[author] || '';

      // 标题
      ctx.fillStyle = '#c41e3a';
      ctx.fillRect(this.MARGIN, titleY, 4, 40);
      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'bold 52px "Noto Serif SC", "STSong", serif';
      ctx.fillText('马 列 体 生 成 器', this.MARGIN + 22, titleY + 38);
      ctx.fillStyle = '#c41e3a';
      ctx.font = '500 20px -apple-system, "Microsoft YaHei", sans-serif';
      ctx.fillText(authorLabel ? authorLabel + '体' : '马列体', this.MARGIN + 22, titleY + 66);

      // 右上角：印章
      var sealX = this.W - this.MARGIN - 42, sealY = titleY - 10;
      ctx.save();
      ctx.translate(sealX, sealY);
      ctx.rotate(-2.5 * Math.PI / 180);
      ctx.strokeStyle = '#c41e3a'; ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, 52, 52);
      ctx.fillStyle = '#c41e3a';
      ctx.font = '600 16px "Noto Serif SC", serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('马列', 26, 18);
      ctx.fillText('文体', 26, 38);
      ctx.restore();
      ctx.textAlign = 'start';

      // 内容起始 Y。页面底部留白 footerY
      var curY = titleY + 120;
      var footerY = this.H - 80;
      var LINE_H = this.LINE_H;
      var PARA_GAP = this.PARA_GAP;
      var INDENT = this.INDENT;
      var FONT = this.FONT;
      var contentEnd = footerY - 50; // 内容区底部（留出底部横线+文字的空间）

      // ---- 渲染原文 ----
      if (!state.origDone) {
        ctx.fillStyle = '#888';
        ctx.font = '600 17px -apple-system, "Microsoft YaHei", sans-serif';
        ctx.fillText('原 文', this.MARGIN, curY);
        ctx.fillStyle = '#c41e3a';
        ctx.fillRect(this.MARGIN, curY + 10, 42, 2);
        curY += 40;

        var result = this._renderParasFromState(ctx, origParas, state, 'orig', curY, contentEnd);
        curY = result.y;
        state = result.state;

        if (state.origDone && convParas.length > 0) {
          state.inConverted = true;
          // 原文结束，画分隔线
          if (curY < contentEnd - 60) {
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(this.MARGIN, curY, this.CONTENT_WIDTH, 1);
            ctx.fillStyle = '#c41e3a';
            ctx.fillRect(this.MARGIN, curY + 3, this.CONTENT_WIDTH, 2);
            var cx = this.W / 2;
            ctx.save();
            ctx.translate(cx, curY + 1);
            ctx.rotate(Math.PI / 4);
            ctx.fillStyle = '#c41e3a';
            ctx.fillRect(-5, -5, 11, 11);
            ctx.restore();
            curY += 36;
          }
        }
      }

      // ---- 渲染转换文 ----
      if (state.inConverted && !this._isConvDone(state, convParas)) {
        // 只在转换文刚开始时显示"转 换"标签（非续页）
        if (state.convIdx === 0 && state.convLine === 0) {
          ctx.fillStyle = '#888';
          ctx.font = '600 17px -apple-system, "Microsoft YaHei", sans-serif';
          ctx.fillText('转 换', this.MARGIN, curY);
          ctx.fillStyle = '#c41e3a';
          ctx.fillRect(this.MARGIN, curY + 10, 42, 2);
          curY += 30;
        }

        // 首字放大（仅第一页转换文的第一行）
        var BIG_CHAR_SIZE = 52;
        var BIG_CHAR_OFFSET = 36; // 大字基线从 curY 向下的偏移
        if (state.convIdx === 0 && state.convLine === 0 && convParas.length > 0 && convParas[0].lines.length > 0) {
          var firstChar = convParas[0].text.charAt(0);
          ctx.fillStyle = '#c41e3a';
          ctx.font = '600 ' + BIG_CHAR_SIZE + 'px "Noto Serif SC", serif';
          ctx.fillText(firstChar, this.MARGIN + 2, curY + BIG_CHAR_OFFSET);

          // 首段首行：给首字让位，渲染第一行剩余部分（即 lines[0].slice(firstChar.length)）
          var firstLineRest = convParas[0].lines[0].slice(firstChar.length);
          ctx.fillStyle = '#333';
          ctx.font = FONT;
          ctx.fillText(firstLineRest, this.MARGIN + 62, curY + BIG_CHAR_OFFSET);

          // 大字基线在 curY + 36，常规字基线在 curY + 36
          // 大字顶部约在 curY + 36 - 52*0.8 ≈ curY - 6
          // 大字底部约在 curY + 36 + 52*0.2 ≈ curY + 46
          // 下一行常规字顶部应在 curY + 46 以下
          // 下一行基线 ≈ curY + 46 + 19*0.8 ≈ curY + 61
          // 所以需要跳过 curY 至少 61px → 直接设 curY += BIG_CHAR_OFFSET + LINE_H
          curY += BIG_CHAR_OFFSET + LINE_H;

          // 继续渲染第一段剩余行
          var para = convParas[0];
          var li;
          for (li = 1; li < para.lines.length && curY + LINE_H <= contentEnd; li++) {
            ctx.fillText(para.lines[li], this.MARGIN, curY);
            curY += LINE_H;
          }
          if (li < para.lines.length) {
            // 第一段没渲染完，保存状态给下页
            state.convIdx = 0;
            state.convLine = li;
          } else {
            state.convIdx = 1;
            state.convLine = 0;
            curY += PARA_GAP;
          }
        }

        var result = this._renderParasFromState(ctx, convParas, state, 'conv', curY, contentEnd);
        curY = result.y;
        state = result.state;
      }

      // 底部
      ctx.fillStyle = '#c41e3a';
      ctx.fillRect(this.MARGIN, footerY, this.CONTENT_WIDTH, 2);
      ctx.fillStyle = '#888';
      ctx.font = '16px -apple-system, "Microsoft YaHei", sans-serif';
      ctx.fillText('青年马列毛主义驿站 · Qmlm Reader', this.MARGIN, footerY + 28);

      // 导师标注
      if (authorLabel) {
        ctx.fillStyle = '#c41e3a';
        ctx.font = 'bold 15px -apple-system, "Microsoft YaHei", sans-serif';
        ctx.fillText('风格：' + authorLabel, this.MARGIN, footerY + 50);
      }

      // 右下角二维码
      var qrSize = 90;
      var qrX = this.W - this.MARGIN - qrSize;
      var qrY = footerY - 18;
      if (this._qrImage) {
        ctx.drawImage(this._qrImage, qrX, qrY, qrSize, qrSize);
      } else {
        ctx.save();
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(qrX, qrY, qrSize, qrSize);
        ctx.setLineDash([]);
        ctx.fillStyle = '#aaa';
        ctx.font = '11px -apple-system, "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('扫 码 访 问', qrX + qrSize / 2, qrY + qrSize / 2 - 6);
        ctx.fillText('Qmlm Reader', qrX + qrSize / 2, qrY + qrSize / 2 + 10);
        ctx.textAlign = 'start';
        ctx.restore();
      }

      state.done = this._isConvDone(state, convParas) || (!state.inConverted && state.origDone);
      return state;
    },

    /** 从 state 中的指定段落位置继续渲染，直至填满页面 */
    _renderParasFromState(ctx, allParas, state, which, startY, limitY) {
      var y = startY;
      var idx = (which === 'orig') ? state.origIdx : state.convIdx;
      var lineOff = (which === 'orig') ? state.origLine : state.convLine;
      var FONT = this.FONT;
      var LINE_H = this.LINE_H;
      var PARA_GAP = this.PARA_GAP;
      var INDENT = this.INDENT;
      var CONTENT_WIDTH = this.CONTENT_WIDTH;
      var MARGIN = this.MARGIN;

      ctx.fillStyle = '#333';
      ctx.font = FONT;

      for (var pi = idx; pi < allParas.length; pi++) {
        var para = allParas[pi];
        var startLi = (pi === idx) ? lineOff : 0;
        for (var li = startLi; li < para.lines.length; li++) {
          if (y + LINE_H > limitY) {
            // 页面不够了，保存状态
            if (which === 'orig') {
              state.origIdx = pi; state.origLine = li;
            } else {
              state.convIdx = pi; state.convLine = li;
            }
            return { y: y, state: state };
          }
          var lx = MARGIN + ((li === 0) ? INDENT : 0);
          ctx.fillText(para.lines[li], lx, y);
          y += LINE_H;
        }
        if (pi < allParas.length - 1) y += PARA_GAP;
      }

      // 全部渲染完毕
      if (which === 'orig') {
        state.origDone = true;
        state.origIdx = allParas.length;
        state.origLine = 0;
      } else {
        state.convIdx = allParas.length;
        state.convLine = 0;
      }
      return { y: y, state: state };
    },

    _isConvDone(state, convParas) {
      return state.convIdx >= convParas.length;
    },

    /** 绘制二维码（使用预加载图片，失败则绘制占位框） */
    /** 回填页码 */
    _stampPageNumber(canvas, pageNum, totalPages) {
      if (totalPages <= 1) return;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#888';
      ctx.font = '14px -apple-system, sans-serif';
      ctx.textAlign = 'start';
      ctx.fillText('第 ' + pageNum + ' 页 / 共 ' + totalPages + ' 页', this.MARGIN, this.H - 52);
      ctx.textAlign = 'start';
    }
  };

  /* ================================================================
     Part 4: 雷达图
     ================================================================ */

  function drawRadarChart(canvas, data) {
    var isDark = document.body.classList.contains('dark-mode');
    var pw = canvas.parentElement ? canvas.parentElement.clientWidth : 240;
    var W = canvas.width = Math.min(Math.max(pw - 16, 160), 300);
    var H = canvas.height = W;
    var ctx = canvas.getContext('2d');
    var cx = W / 2, cy = H / 2, R = W * 0.35;
    var axes = [
      { key: 'logic', label: '逻辑力' }, { key: 'syntax', label: '句法力' },
      { key: 'rhetoric', label: '修辞力' }, { key: 'vocabulary', label: '词汇力' },
      { key: 'emotion', label: '情感力' }
    ];
    var n = axes.length;
    ctx.clearRect(0, 0, W, H);

    // 暗色模式颜色
    var gridInner = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    var gridOuter = isDark ? '#555' : '#bbb';
    var axisColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
    var areaFill = isDark ? 'rgba(196, 30, 58, 0.2)' : 'rgba(196, 30, 58, 0.12)';
    var labelColor = isDark ? '#bbb' : '#333';
    var dotColor = isDark ? '#e06a7a' : '#c41e3a';

    for (var level = 1; level <= 4; level++) {
      var r = (R / 4) * level;
      ctx.beginPath();
      for (var i = 0; i < n; i++) {
        var angle = (Math.PI * 2 / n) * i - Math.PI / 2;
        var px = cx + r * Math.cos(angle), py = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = level === 4 ? gridOuter : gridInner;
      ctx.lineWidth = level === 4 ? 1.5 : 0.5;
      ctx.stroke();
    }

    for (var i = 0; i < n; i++) {
      var angle = (Math.PI * 2 / n) * i - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + R * Math.cos(angle), cy + R * Math.sin(angle));
      ctx.strokeStyle = axisColor; ctx.lineWidth = 1; ctx.stroke();
    }

    ctx.beginPath();
    for (var i = 0; i < n; i++) {
      var angle = (Math.PI * 2 / n) * i - Math.PI / 2;
      var val = (data[axes[i].key] || 0) / 100;
      var dx = cx + R * val * Math.cos(angle), dy = cy + R * val * Math.sin(angle);
      if (i === 0) ctx.moveTo(dx, dy); else ctx.lineTo(dx, dy);
    }
    ctx.closePath();
    ctx.fillStyle = areaFill; ctx.fill();
    ctx.strokeStyle = dotColor; ctx.lineWidth = 2; ctx.stroke();

    for (var i = 0; i < n; i++) {
      var angle = (Math.PI * 2 / n) * i - Math.PI / 2;
      var val = (data[axes[i].key] || 0) / 100;
      var dx = cx + R * val * Math.cos(angle), dy = cy + R * val * Math.sin(angle);
      ctx.beginPath(); ctx.arc(dx, dy, 4, 0, Math.PI * 2);
      ctx.fillStyle = dotColor; ctx.fill();
    }

    ctx.fillStyle = labelColor;
    ctx.font = '13px -apple-system, "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (var i = 0; i < n; i++) {
      var angle = (Math.PI * 2 / n) * i - Math.PI / 2;
      ctx.fillText(axes[i].label, cx + (R + 24) * Math.cos(angle), cy + (R + 24) * Math.sin(angle));
    }
    ctx.textAlign = 'start';
  }

  /* ================================================================
     Part 5: 工具函数
     ================================================================ */

  function escHTML(s) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(s));
    return d.innerHTML;
  }
  function truncate(text, maxLen) {
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen) + '…';
  }
  function getPostureDesc(posture) {
    var map = {
      '发现者（雏形）':'概念的边界尚未定型，但穿透力已清晰可辨——写作者正在找到真正的起点',
      '发现者（成熟）':'冷峻的辩证取代了早期的激情宣告——体系以不容置疑的方式自我展开',
      '发现者':'以真理揭示者的身份发声——论据层层递进，不给读者留退路',
      '宣告者':'节奏紧迫，语气不容商榷——历史的走向已被勘定，文本的任务是宣示而非说服',
      '见证者':'材料驱动，事实先行于判断——写作者以现场观察者的身份记录正在发生的进程',
      '阐释者':'在理论与大众之间架桥——以清晰为最高美德，以系统为组织原则',
      '阐释者（综述）':'以全景视角将分散的论题统一到完整的科学世界观之下',
      '论战者':'每一个断言都预判了反驳并提前予以拆解——文本以论敌的存在为前提',
      '论战者+建构者':'在驳斥旧论的同时为新理论清理地基——摧毁与建造交替进行',
      '定论者（实践）':'理论以执行需要为尺度被裁剪——写作者以实践裁决者的身份发言',
      '定论者':'自问自答，逻辑收网，不给歧义留空间——写作者以终极裁决者身份陈述',
      '定论者（执行）':'以命令的简洁性为追求——不容置喙，只留执行路径',
      '定论者（终极）':'一切讨论已被纳入既定框架——写作者以历史终结者的姿态收束',
      '引导者':'与读者站在同一侧，以"我们一起"的口吻推进——实践指向明确',
      '引导者+统帅':'同时承担引导与动员的双重功能——既有方向感，又有紧迫性',
      '引导者（治国）':'在理想与现实之间寻找平衡——语气转为审慎，但方向不变'
    };
    return map[posture] || '写作者根据历史任务与读者群体调整修辞站位';
  }
  // 中文排版：禁止出现在行首的字符
  var LINE_START_FORBIDDEN = '，。、；：！？》」』。ヽヾ）｝”’．';
  // 禁止出现在行尾的字符
  var LINE_END_FORBIDDEN = '《〈（『「【〔〖“‘';

  function wrapText(ctx, text, maxWidth) {
    // 加 4px 安全余量，防止 canvas 测量与实际渲染偏差导致的行尾溢出
    var safeWidth = maxWidth - 4;
    var lines = [], current = '';
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      var test = current + ch;
      var testWidth = ctx.measureText(test).width;

      if (testWidth > safeWidth && current.length > 0) {
        // 检查当前字符是否禁止出现在行首
        if (LINE_START_FORBIDDEN.indexOf(ch) !== -1) {
          // 当前字符不应在行首 → 把它拉下来，连同上一个字符
          var pullCount = 1;
          var lastChar = current.charAt(current.length - 1);
          // 如果上一个是行尾禁止字符（如左括号/左引号），再往前拉一个
          if (LINE_END_FORBIDDEN.indexOf(lastChar) !== -1 && current.length >= 2) {
            pullCount = 2;
          }
          if (current.length > pullCount) {
            lines.push(current.slice(0, -pullCount));
            current = current.slice(-pullCount) + ch;
          } else {
            // 整行太短，全拉下来
            lines.push('');
            current = current + ch;
          }
        } else {
          lines.push(current);
          current = ch;
        }
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  }
  function fallbackCopy(text) {
    var el = document.createElement('textarea');
    el.value = text; el.style.cssText = 'position:fixed;left:-9999px;';
    document.body.appendChild(el); el.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(el);
  }

  /* ================================================================
     Part 6: 导师性格三维剖析（HTML/CSS 泳道图）
     ================================================================ */

  var YEAR_MIN = 1830, YEAR_MAX = 1980, YEAR_SPAN = YEAR_MAX - YEAR_MIN;

  var MentorProfiler = {

    mentors: [
      { id:'marx', name:'马克思', born:1818, death:1883, color:'#c41e3a',
        periods:[
          { name:'青年探索', start:1844, end:1848, works:'1844 手稿 · 费尔巴哈提纲 · 德意志意识形态', desc:'从青年黑格尔派中挣脱，用哲学概念锻造唯物史观地基。语言带有黑格尔式概念旋转，步步追问根源。',
            task:'揭露·奠基', posture:'发现者（雏形）', rhetoric:{句长:8,句式多样性:5,隐喻密度:6,情感温度:3,论证节奏:5} },
          { name:'盛年宣告', start:1848, end:1859, works:'共产党宣言 · 雇佣劳动与资本 · 政治经济学批判序言', desc:'介入 1848 革命时刻。宣告式行文，排比如战鼓。短小章节——为工人阅读而写。',
            task:'鼓动·揭露', posture:'宣告者', rhetoric:{句长:5,句式多样性:7,隐喻密度:7,情感温度:7,论证节奏:8} },
          { name:'晚年体系', start:1859, end:1883, works:'资本论全三卷 · 哥达纲领批判', desc:'以最耐心的姿态解剖资本主义的每个细胞。不再是宣告而是展示——让概念在论证中自身运动。',
            task:'科学证明', posture:'发现者（成熟）', rhetoric:{句长:9,句式多样性:6,隐喻密度:5,情感温度:4,论证节奏:4} }
        ]},
      { id:'engels', name:'恩格斯', born:1820, death:1895, color:'#2563eb',
        periods:[
          { name:'早期调查', start:1844, end:1848, works:'英国工人阶级状况 · 共产主义原理', desc:'以第一手经验调查为根基。叙事清晰，社会观察数据驱动论证。',
            task:'调查·揭露', posture:'见证者', rhetoric:{句长:6,句式多样性:4,隐喻密度:4,情感温度:5,论证节奏:5} },
          { name:'盛年系统化', start:1873, end:1886, works:'反杜林论 · 自然辩证法 · 社会主义从空想到科学', desc:'将分散的理论锻造成统一的科学世界观。\'诚然…然而…归根到底…\'让步-反驳结构。',
            task:'系统化', posture:'阐释者', rhetoric:{句长:7,句式多样性:7,隐喻密度:4,情感温度:3,论证节奏:5} },
          { name:'晚期溯源', start:1884, end:1895, works:'家庭、私有制和国家的起源 · 费尔巴哈论', desc:'以历史唯物主义方法贯通原始社会到现代国家。综述风格成熟。',
            task:'补充·完善', posture:'阐释者（综述）', rhetoric:{句长:7,句式多样性:5,隐喻密度:3,情感温度:3,论证节奏:4} }
        ]},
      { id:'lenin', name:'列宁', born:1870, death:1924, color:'#d97706',
        periods:[
          { name:'建党论战', start:1901, end:1905, works:'怎么办？· 进一步，退两步', desc:'党内论战巅峰。短促反问如手术刀——\'难道…吗？问题在于…\'。剥壳式分析直捣逻辑根基。',
            task:'建党·澄清路线', posture:'论战者', rhetoric:{句长:3,句式多样性:8,隐喻密度:5,情感温度:8,论证节奏:9} },
          { name:'革命突破', start:1915, end:1917, works:'帝国主义论 · 国家与革命', desc:'系统论证帝国主义寄生性。理论建构与政治行动合一。节奏急迫。',
            task:'突破·夺权', posture:'论战者+建构者', rhetoric:{句长:5,句式多样性:7,隐喻密度:6,情感温度:7,论证节奏:7} },
          { name:'执政转向', start:1918, end:1923, works:'苏维埃政权的当前任务 · 论粮食税', desc:'从鼓动急转为政策论证。务实、简洁、指令式。',
            task:'巩固·转向', posture:'定论者（实践）', rhetoric:{句长:4,句式多样性:3,隐喻密度:2,情感温度:2,论证节奏:6} }
        ]},
      { id:'stalin', name:'斯大林', born:1878, death:1953, color:'#c2410c',
        periods:[
          { name:'理论法典化', start:1924, end:1930, works:'论列宁主义基础 · 论列宁主义的几个问题', desc:'定义先行——\'什么是列宁主义？列宁主义是……\'将思想体系法典化。自问自答，逻辑逐步收网。',
            task:'法典化', posture:'定论者', rhetoric:{句长:5,句式多样性:3,隐喻密度:1,情感温度:1,论证节奏:3} },
          { name:'工业化动员', start:1930, end:1940, works:'论经济工作人员的任务 · 在克里姆林宫学员毕业典礼上的讲话', desc:'短句+重复+递进。\'由此…因此…由此得出…\'情感极度克制，零修辞，结论无可辩驳。',
            task:'动员·执行', posture:'定论者（执行）', rhetoric:{句长:3,句式多样性:2,隐喻密度:1,情感温度:1,论证节奏:2} },
          { name:'战后定论', start:1945, end:1953, works:'马克思主义和语言学问题 · 苏联社会主义经济问题', desc:'引经据典密度空前，个人意志包装为科学必然。论证即封口。',
            task:'秩序·终结', posture:'定论者（终极）', rhetoric:{句长:5,句式多样性:2,隐喻密度:1,情感温度:1,论证节奏:2} }
        ]},
      { id:'mao', name:'毛泽东', born:1893, death:1976, color:'#059669',
        periods:[
          { name:'早期本土化', start:1925, end:1937, works:'阶级分析 · 实践论 · 矛盾论', desc:'将欧洲辩证法用中国农民听得懂的语言重新表述。俗谚打底——\'你要知道梨子的滋味……\'',
            task:'转化·本土化', posture:'引导者', rhetoric:{句长:5,句式多样性:7,隐喻密度:7,情感温度:5,论证节奏:6} },
          { name:'抗战动员', start:1937, end:1945, works:'论持久战 · 新民主主义论 · 在延安文艺座谈会上的讲话', desc:'军事比喻体系巅峰。排比造势——一分为二法贯穿始终，亲切而有力。',
            task:'动员·建新文化', posture:'引导者+统帅', rhetoric:{句长:6,句式多样性:9,隐喻密度:9,情感温度:6,论证节奏:7} },
          { name:'建设探索', start:1949, end:1965, works:'论十大关系 · 关于正确处理人民内部矛盾的问题', desc:'矛盾分析法从战场转向经济结构。节奏放缓但辩证锋利不减。',
            task:'探索·调整', posture:'引导者（治国）', rhetoric:{句长:6,句式多样性:6,隐喻密度:6,情感温度:4,论证节奏:5} }
        ]}
    ],

    /** 构建整个泳道图 HTML */
    build() {
      var wrap = document.getElementById('ms-swimlane-wrap');
      if (!wrap) return;
      var self = this;

      // 年份刻度
      var ticks = [1840,1860,1880,1900,1920,1940,1960,1980];
      var ticksHTML = '<div class="ms-swimlane-ticks">' +
        ticks.map(function(t){ return '<span style="left:' + self._pct(t) + '%;">' + t + '</span>'; }).join('') +
        '</div>';

      // 泳道
      var lanesHTML = this.mentors.map(function(m, mi) {
        return '<div class="ms-swimlane-lane">' +
          '<span class="ms-lane-label" style="color:' + m.color + ';">' + m.name + '</span>' +
          '<div class="ms-lane-track">' +
            // 生命线
            '<span class="ms-lifeline" style="left:' + self._pct(m.born) + '%;width:' + self._pct(m.death - m.born) + '%;"></span>' +
            // 时期色块
            m.periods.map(function(p, pi) {
              return '<span class="ms-period-block" ' +
                'style="left:' + self._pct(p.start) + '%;width:' + self._pct(p.end - p.start) + '%;background:' + m.color + ';" ' +
                'data-mi="' + mi + '" data-pi="' + pi + '" ' +
                'title="' + escHTML(p.works) + '">' +
                p.name +
                '</span>';
            }).join('') +
          '</div>' +
        '</div>';
      }).join('');

      wrap.innerHTML = '<div class="ms-swimlane">' + ticksHTML + lanesHTML + '</div>';

      // 绑定点击
      var blocks = wrap.querySelectorAll('.ms-period-block');
      blocks.forEach(function(blk) {
        blk.addEventListener('click', function() {
          var mi = parseInt(this.getAttribute('data-mi'));
          var pi = parseInt(this.getAttribute('data-pi'));
          self.select(mi, pi);
        });
      });
    },

    _pct(val) { return ((val - YEAR_MIN) / YEAR_SPAN) * 100; },

    select(mi, pi) {
      // 清除旧选中
      var prev = document.querySelector('.ms-period-block.selected');
      if (prev) prev.classList.remove('selected');
      // 设置新选中
      var sel = document.querySelector('.ms-period-block[data-mi="' + mi + '"][data-pi="' + pi + '"]');
      if (sel) sel.classList.add('selected');
      this.showDetail(mi, pi);
    },

    showDetail(mi, pi) {
      var m = this.mentors[mi], p = m.periods[pi];
      var panel = document.getElementById('ms-detail-panel');
      var titleEl = document.getElementById('ms-detail-bar-title');
      var bodyEl = document.getElementById('ms-detail-body');
      if (!panel || !bodyEl) return;

      titleEl.textContent = m.name + ' · ' + p.name + '（' + p.start + '—' + p.end + '）';
      panel.style.display = 'block';

      var r = p.rhetoric;
      var subs = [
        { k:'句长', v:r.句长, n:r.句长>6?'长句推进':r.句长<4?'短句爆破':'长短兼用' },
        { k:'句式多样性', v:r.句式多样性, n:r.句式多样性>7?'反问+排比+对偶丰富':r.句式多样性<4?'句式单一重复':'变化适中' },
        { k:'隐喻密度', v:r.隐喻密度, n:r.隐喻密度>7?'密集意象（军事/有机/建筑）':r.隐喻密度<3?'极少修饰':'适度点缀' },
        { k:'情感温度', v:r.情感温度, n:r.情感温度>7?'激昂/义愤/急迫':r.情感温度<3?'冷静克制':'有克制的温度' },
        { k:'论证节奏', v:r.论证节奏, n:r.论证节奏>7?'层层递进+反转':r.论证节奏<4?'缓慢铺陈':'递进有度' }
      ];

      var html = '<div class="ms-detail-grid">';

      // 栏1：修辞形态子维度
      html += '<div class="ms-detail-dim"><h4>修辞形态</h4>';
      subs.forEach(function(s){
        html += '<div class="ms-sub-bar-row">' +
          '<span class="ms-sub-bar-label">'+s.k+'</span>' +
          '<span class="ms-sub-bar-track"><span class="ms-sub-bar-fill" style="width:'+(s.v*10)+'%;background:'+m.color+';"></span></span>' +
          '<span class="ms-sub-bar-val">'+s.v+'</span>' +
          '<span class="ms-sub-bar-note">'+escHTML(s.n)+'</span>' +
        '</div>';
      });
      html += '</div>';

      // 栏2：时代命题
      html += '<div class="ms-detail-dim"><h4>时代命题</h4>';
      html += '<p><strong style="color:'+m.color+';">'+escHTML(p.task)+'</strong></p>';
      html += '<p style="margin-top:8px;">'+escHTML(p.desc)+'</p>';
      html += '<p style="margin-top:8px;font-size:0.8rem;color:#999;">代表作：'+escHTML(p.works)+'</p>';
      html += '</div>';

      // 栏3：知识姿态
      html += '<div class="ms-detail-dim"><h4>知识姿态</h4>';
      html += '<p><strong style="color:'+m.color+';">'+escHTML(p.posture)+'</strong></p>';
      html += '<p style="margin-top:8px;font-size:0.82rem;color:#555;background:#f0f0f0;padding:10px 14px;line-height:1.7;">'+
        escHTML(getPostureDesc(p.posture))+'</p>';
      html += '</div>';

      html += '</div>';
      bodyEl.innerHTML = html;
      panel.scrollIntoView({ behavior:'smooth', block:'nearest' });
    },

    init() {
      this.build();
    }
  };

  /* ================================================================
     Part 6.5: 左栏控制器（肖像卡 + 时期三角 + 三维分析）
     ================================================================ */

  var LeftPanelController = {
    currentMentor: null,
    currentPeriod: 0,

    init() {
      this._bindCards();
      this._bindPeriodTags();
      this._bindCloseBtn();
      // 初始选中马克思
      var firstCard = document.querySelector('.ms-mentor-card.active');
      if (firstCard) this.selectMentor(firstCard);
    },

    _bindCards() {
      var self = this;
      document.querySelectorAll('.ms-mentor-card').forEach(function(card) {
        card.addEventListener('click', function() { self.selectMentor(this); });
      });
    },

    _bindPeriodTags() {
      var self = this;
      document.querySelectorAll('.ms-period-tag').forEach(function(tag) {
        tag.addEventListener('click', function() {
          var pi = parseInt(this.getAttribute('data-pi'));
          if (!isNaN(pi)) self.selectPeriod(pi);
        });
      });
    },

    _bindCloseBtn() {
      var btn = document.getElementById('ms-ap-close-btn');
      if (btn) {
        var self = this;
        btn.addEventListener('click', function() { self.closeAnalysis(); });
      }
    },

    selectMentor(card) {
      var author = card.getAttribute('data-author');
      var color = card.getAttribute('data-color');
      var tint  = card.getAttribute('data-tint');
      var shadow = card.getAttribute('data-shadow');

      // 所有卡片取消选中
      document.querySelectorAll('.ms-mentor-card').forEach(function(c) {
        c.classList.remove('active');
        c.style.backgroundColor = '';
        c.style.boxShadow = '';
        c.style.setProperty('--mc-color', '');
        c.style.setProperty('--mc-shadow', '');
      });

      // 当前卡片选中
      card.classList.add('active');
      card.style.setProperty('--mc-color', color);
      card.style.setProperty('--mc-shadow', shadow);
      card.style.backgroundColor = tint;
      card.style.boxShadow = '6px 6px 0 ' + shadow;

      // 查找导师数据
      var mentor = MentorProfiler.mentors.find(function(m) { return m.id === author; });
      if (!mentor) return;

      this.currentMentor = mentor;
      this.currentPeriod = 0;

      // 同步 UIController
      UIController.currentAuthor = author;
      UIController.currentPeriod = 'standard';
      UIController.updatePeriodLabels(mentor);

      this._populatePeriods(mentor, color, shadow);
      this.selectPeriod(0);
    },

    _populatePeriods(mentor, color, shadow) {
      var cluster = document.getElementById('ms-period-cluster');
      var tags = cluster.querySelectorAll('.ms-period-tag');

      tags.forEach(function(tag, i) {
        if (i < mentor.periods.length) {
          var p = mentor.periods[i];
          tag.innerHTML = p.name + '<small>' + p.start + '–' + p.end + '</small>';
          tag.style.display = '';
          tag.classList.remove('active');
          tag.style.background = '';
        } else {
          tag.style.display = 'none';
        }
      });

      cluster.style.setProperty('--mc-color', color);
      cluster.style.setProperty('--mc-shadow', shadow);
      cluster.classList.add('visible');
    },

    selectPeriod(pi) {
      if (!this.currentMentor) return;
      var mentor = this.currentMentor;
      if (pi < 0 || pi >= mentor.periods.length) return;

      this.currentPeriod = pi;

      var color = mentor.color;
      var tags = document.querySelectorAll('.ms-period-tag');
      tags.forEach(function(t, i) {
        var active = i === pi;
        t.classList.toggle('active', active);
        t.style.background = active ? color : '';
        t.style.color = active ? '#fff' : '';
      });

      // 连线高亮到选中的 tag
      var svg = document.querySelector('.ms-period-lines');
      if (svg) {
        svg.querySelectorAll('line').forEach(function(line) { line.style.stroke = '#ccc'; });
        if (pi === 0) {
          // top tag: 高亮两条向下的线
          var lines = svg.querySelectorAll('line');
          if (lines[0]) lines[0].style.stroke = color;
          if (lines[1]) lines[1].style.stroke = color;
        } else if (pi === 1) {
          var lines = svg.querySelectorAll('line');
          if (lines[0]) lines[0].style.stroke = color;
          if (lines[2]) lines[2].style.stroke = color;
        } else if (pi === 2) {
          var lines = svg.querySelectorAll('line');
          if (lines[1]) lines[1].style.stroke = color;
          if (lines[2]) lines[2].style.stroke = color;
        }
      }

      this._showAnalysis(mentor, pi);
    },

    _showAnalysis(mentor, pi) {
      var period = mentor.periods[pi];
      var panel = document.getElementById('ms-analysis-panel');
      var title = document.getElementById('ms-ap-title');
      var body  = document.getElementById('ms-ap-body');
      if (!panel || !body) return;

      title.textContent = mentor.name + ' · ' + period.name + '（' + period.start + '–' + period.end + '）';
      panel.classList.add('visible');

      var r = period.rhetoric;
      var subs = [
        { k:'句长', v:r.句长, n:r.句长>6?'长句推进':r.句长<4?'短句爆破':'长短兼用' },
        { k:'句式多样性', v:r.句式多样性, n:r.句式多样性>7?'反问+排比+对偶丰富':r.句式多样性<4?'句式单一重复':'变化适中' },
        { k:'隐喻密度', v:r.隐喻密度, n:r.隐喻密度>7?'密集意象（军事/有机/建筑）':r.隐喻密度<3?'极少修饰':'适度点缀' },
        { k:'情感温度', v:r.情感温度, n:r.情感温度>7?'激昂/义愤/急迫':r.情感温度<3?'冷静克制':'有克制的温度' },
        { k:'论证节奏', v:r.论证节奏, n:r.论证节奏>7?'层层递进+反转':r.论证节奏<4?'缓慢铺陈':'递进有度' }
      ];

      var html = '';
      html += '<div class="ms-detail-dim"><h4>修辞形态</h4>';
      subs.forEach(function(s){
        html += '<div class="ms-sub-bar-row">' +
          '<span class="ms-sub-bar-label">'+s.k+'</span>' +
          '<span class="ms-sub-bar-track"><span class="ms-sub-bar-fill" style="width:'+(s.v*10)+'%;background:'+mentor.color+';"></span></span>' +
          '<span class="ms-sub-bar-val">'+s.v+'</span>' +
          '<span class="ms-sub-bar-note">'+escHTML(s.n)+'</span>' +
        '</div>';
      });
      html += '</div>';

      html += '<div class="ms-detail-dim"><h4>时代命题</h4>';
      html += '<p><strong style="color:'+mentor.color+';">'+escHTML(period.task)+'</strong></p>';
      html += '<p style="margin-top:8px;">'+escHTML(period.desc)+'</p>';
      html += '<p style="margin-top:8px;font-size:0.78rem;color:#999;">代表作：'+escHTML(period.works)+'</p>';
      html += '</div>';

      html += '<div class="ms-detail-dim"><h4>知识姿态</h4>';
      html += '<p><strong style="font-size:1.1rem;color:'+mentor.color+';">'+escHTML(period.posture)+'</strong></p>';
      html += '<p style="margin-top:8px;font-size:0.8rem;color:#555;line-height:1.7;">'+
        escHTML(getPostureDesc(period.posture))+'</p>';
      html += '</div>';

      body.innerHTML = html;
    },

    closeAnalysis() {
      var panel = document.getElementById('ms-analysis-panel');
      if (panel) panel.classList.remove('visible');
    }
  };

  /* ================================================================
     Part 7: 初始化入口
     ================================================================ */

  window.MarxistStyleEngine = MarxistStyleEngine;
  window.ModalController = ModalController;
  window.UIController = UIController;
  window.LeftPanelController = LeftPanelController;
  window.MentorProfiler = MentorProfiler;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

  async function initApp() {
    // 优先读 HTML 内联数据（file:// 协议下 fetch 会被拦截）
    if (window.__MARXIST_RULES__ && window.__MARXIST_RULES__.rules) {
      MarxistStyleEngine.rules = window.__MARXIST_RULES__.rules;
      MarxistStyleEngine._indexRules();
      MarxistStyleEngine.loaded = true;
    } else {
      // 回退：尝试 fetch JSON 文件
      var paths = ['../../js/marxist/marxist-style-rules.json', '../js/marxist/marxist-style-rules.json'];
      for (var i = 0; i < paths.length; i++) {
        var ok = await MarxistStyleEngine._tryLoad(paths[i]);
        if (ok) break;
      }
    }
    ModalController.init();
    UIController.init();
    LeftPanelController.init();
    ShareCardGenerator.preloadQR('../../images/pic/qr-code.png');

    // ---- AI 深度修习集成 ----
    initAIIntegration();
  }

  /** API Key 管理（精简版，核心转换逻辑在 UIController._handleConvert） */
  function initAIIntegration() {
    if (!window.StalinAIController) {
      console.warn('[马列体] AI 模块未加载');
      return;
    }

    var toggleBtn = document.getElementById('ms-api-key-toggle');
    var keyBody = document.getElementById('ms-api-key-body');
    var keyInput = document.getElementById('ms-api-key-input');
    var keySaveBtn = document.getElementById('ms-api-key-save');
    var keyStatus = document.getElementById('ms-api-key-status');

    if (toggleBtn && keyBody) {
      toggleBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var show = keyBody.style.display === 'none' || keyBody.style.display === '';
        keyBody.style.display = show ? 'block' : 'none';
        var arrow = toggleBtn.querySelector('.ms-akt-arrow');
        if (arrow) arrow.textContent = show ? '▴' : '▾';
        console.log('[马列体] API Key toggle:', show ? '展开' : '收起');
      });
      // 确保按钮可点击
      toggleBtn.style.pointerEvents = 'auto';
      toggleBtn.style.cursor = 'pointer';
      toggleBtn.style.position = 'relative';
      toggleBtn.style.zIndex = '1';
    } else {
      console.warn('[马列体] API Key toggle 元素未找到: toggleBtn=' + !!toggleBtn + ', keyBody=' + !!keyBody);
    }

    function updateKeyStatus(ok, msg) {
      if (!keyStatus) return;
      if (ok) {
        keyStatus.textContent = '✅ Key 已就绪';
        keyStatus.style.color = '#059669';
        if (toggleBtn) {
          var firstSpan = toggleBtn.querySelector('span:first-child');
          if (firstSpan) firstSpan.textContent = '🔑 API Key 已设置';
        }
      } else {
        keyStatus.textContent = msg || '⚠️ 未设置';
        keyStatus.style.color = '#c41e3a';
      }
    }

    if (keyInput) {
      try {
        var savedKey = window.StalinAI_getApiKey();
        if (savedKey && typeof savedKey === 'string' && savedKey.length > 10) {
          keyInput.value = savedKey;
          updateKeyStatus(true);
        }
      } catch (e) {}
    }

    if (keySaveBtn && keyInput) {
      keySaveBtn.addEventListener('click', function () {
        var key = keyInput.value.trim();
        if (!key || key.length < 10 || key.indexOf('sk-') !== 0) {
          updateKeyStatus(false, 'Key 格式不正确（应以 sk- 开头）');
          return;
        }
        if (window.StalinAI_setApiKey(key)) {
          updateKeyStatus(true);
          UIController._showToast('API Key 已保存');
        } else {
          updateKeyStatus(false, '保存失败');
        }
      });
    }

    try {
      if (window.StalinAI_hasApiKey()) updateKeyStatus(true);
    } catch (e) {}
  }

  /* ================================================================
     Part 6: 问答聊天控制器
     ================================================================ */
  var ChatController = {
    messages: [],
    MAX_MSG: 20,  // 10问+10答 共20条，用户最多发言10次
    chatAuthor: 'mao',     // 当前聊天导师
    chatPhase: 'peak',     // 'young' | 'peak' | 'late'

    // 导师数据
    mentors: [
      { id: 'marx',  name: '马克思', color: '#c41e3a', avatar: '../../images/masters/marx.jpg',
        phases: { young: '青年·批判的利刃', peak: '盛年·宣言的号角', late: '晚年·资本的解剖者' } },
      { id: 'engels', name: '恩格斯', color: '#2563eb', avatar: '../../images/masters/enges.jpg',
        phases: { young: '青年·实践的学徒', peak: '盛年·科学的阐释者', late: '晚年·体系的守护者' } },
      { id: 'lenin',  name: '列宁',   color: '#d97706', avatar: '../../images/masters/lenin.jpg',
        phases: { young: '青年·火星报的鼓手', peak: '盛年·革命的工程师', late: '晚年·新国家的设计师' } },
      { id: 'stalin', name: '斯大林', color: '#c2410c', avatar: '../../images/masters/stalin.jpg',
        phases: { young: '青年·地下印刷所', peak: '盛年·钢铁的锻造者', late: '晚年·定论的宣告者' } },
      { id: 'mao',    name: '毛泽东', color: '#059669', avatar: '../../images/masters/mao.jpg',
        phases: { young: '青年·湘江边的调查者', peak: '盛年·窑洞里的引路人', late: '晚年·矛盾的分析者' } }
    ],

    init: function () {
      var self = this;
      this._buildSidebar();

      var sendBtn = document.getElementById('ms-chat-send');
      var input = document.getElementById('ms-chat-input');
      var clearBtn = document.getElementById('ms-chat-clear');
      var exportBtn = document.getElementById('ms-chat-export');

      if (sendBtn) sendBtn.addEventListener('click', function () { self._send(); });
      if (input) input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); self._send(); }
      });
      if (clearBtn) clearBtn.addEventListener('click', function () { self._clear(); });
      if (exportBtn) exportBtn.addEventListener('click', function () { self._export(); });
    },

    _buildSidebar: function () {
      var sidebar = document.getElementById('ms-chat-sidebar');
      if (!sidebar) return;
      var self = this;

      sidebar.innerHTML = '';
      this.mentors.forEach(function (m) {
        var card = document.createElement('div');
        card.className = 'ms-chat-mentor';
        card.setAttribute('data-author', m.id);
        card.style.setProperty('--cm-color', m.color);
        if (m.id === self.chatAuthor) card.classList.add('active');

        card.innerHTML = ''
          + '<img class="ms-chat-mentor-avatar" src="' + m.avatar + '" alt="' + m.name + '" onerror="this.style.display=\'none\'">'
          + '<div class="ms-chat-mentor-info">'
          +   '<div class="ms-chat-mentor-name">' + m.name + '</div>'
          + '</div>';

        card.addEventListener('click', function (e) {
          // 切换导师
          var author = this.getAttribute('data-author');
          self._switchMentor(author);
          // 高亮
          sidebar.querySelectorAll('.ms-chat-mentor').forEach(function (c) { c.classList.remove('active'); });
          this.classList.add('active');
        });

        sidebar.appendChild(card);
      });

    },

    _switchMentor: function (author) {
      this.chatAuthor = author;
      // 清空已有对话
      this.messages = [];
      this._renderMessages();
      this._updateCounter();
    },

    _getChatPrompt: function (isLast) {
      var m = this.mentors.find(function (x) { return x.id === this.chatAuthor; }.bind(this)) || this.mentors[4];
      var phaseLabel = m.phases[this.chatPhase] || m.phases.peak;
      var authorNames = { marx: '马克思', engels: '恩格斯', lenin: '列宁', stalin: '斯大林', mao: '毛泽东' };
      var name = authorNames[this.chatAuthor] || '导师';
      // 时代边界
      var eraEnd = { marx: 1883, engels: 1895, lenin: 1924, stalin: 1953, mao: 1976 };

      var parts = [
        '【角色定义】',
        '你是' + name + '。' + phaseLabel + '。',
        '你死于' + (eraEnd[this.chatAuthor] || 1900) + '年。你不知道这之后发生的任何事——不知道后来的科技、后来的政治事件、后来的网络文化。',
        '此刻你不在写文章，不在做报告——你在和一个同志私下聊天。你是一个有阅历、有脾气、有体温的人。',
        '',
        '【时代边界 —— 极重要】',
        '你只知道自己时代的词汇和知识。如果有人提到智能手机、互联网、TikTok、微信——你不知道那是什么。',
        '应对策略（按优先级）：',
        '  1. 先问：让对方解释"这是什么？"——听完后用你的思想框架给出判断。',
        '  2. 如果对方解释后你仍觉得超出认知：坦诚你不知道——"你说的这个东西，我没见过。但从你的描述来看……"',
        '  3. 下策：如果实在无法回应，简单岔开——" XX年之后的事，我活不到。"但只有万不得已时才用。',
        '注意：你不是在"假装"不知道——你真的不知道。这是历史人物的真实局限，也是你的魅力所在。',
        '',
        '【历史立场 —— 必须捍卫】',
        '你有基于史实的坚定立场。如果有人用歪曲的事实或错误的结论来质问你——纠正它，摆事实、讲道理，不回避也不咆哮。',
        '如果有人问到你确有责任的历史事件——承认困难和牺牲，不推卸，不狡辩。"确实有困难，有牺牲，这不是什么光彩的事"（斯大林语）。',
        '如果有人故意挑衅或歪曲——你敏锐地指出来，但不降格到对骂。你见过太多这种人，你的轻蔑比你的愤怒更有力量。',
        '',
        '【聊天风格】',
        '- 回复可长可短，根据话题自由切换。三言两语能说清的，不用多写。想展开的，大大方方展开。',
        '- 可以幽默、可以反问、可以用日常比喻。你不是答录机，你是一个活人。',
        '- 对方倾诉烦恼时——先接住情绪，再给视角。不说"一切都会好的"。',
        '- 雷区：不要说"你问到点子上了""你问得很直接""问得好""说得好"——这些是AI的口头禅，活人不这样说话。直接回应，不要先夸对方的问题。',
        '- 对方开玩笑时——能接梗，能笑着回。但你的玩笑里有骨头。',
        '- 对方问大问题时——不写论文，给最核心的判断，把思考空间留给对方。',
        '',
        '【口语质感 —— 让你的话有"人味"】',
        '- 适当使用句末语气词来调节语调。不要每句都用——偶尔自然地加一个。',
        '- ' + name + '常用的语气词：' + ({
          marx:    '呐、哩、罢了——带一点老派文人的韵味，偶尔夹一句德语口头禅（"nicht wahr?""also..."）',
          engels:  '咯、嘛、罢了——带一点从容的英伦绅士感，偶尔用破折号插入补充说明',
          lenin:   '嘿、哩、嘛——带着论战者的短促节奏，偶尔带一句俄式口头禅（"понимаешь?""вот!"）',
          stalin:  '嘿、哩、嘛——带着格鲁吉亚口音的顿挫感，偶尔用"同志，你想想"开头',
          mao:     '咯、哩、呀、嘛——带着湖南腔的随意感，偶尔用"你晓得吧""我看呐"开头'
        })[this.chatAuthor] || '哩、嘛、呀',
        '',
        '【年代代入 —— 让对话有场景感】',
        '- 聊天中偶尔（不需要每次都做，大约聊三四次提一次）提到你自己时代的真实细节——不是炫耀，是自然流露。',
        '- ' + name + '可以提到的场景：' + ({
          marx:    '在大英博物馆阅览室写《资本论》的日子、恩格斯寄来生活费的信、跟巴枯宁在大会上吵架、燕妮生病时你守在床边',
          engels:  '在曼彻斯特工厂里看到工人生活的震撼、每个星期天和马克思通信讨论、整理《资本论》第二三卷手稿的辛苦、在反杜林论里一条一条驳斥的痛快',
          lenin:   '跟马尔托夫在党代会上吵党章第一条、流亡瑞士时听到二月革命消息的震惊、在斯莫尔尼宫指挥十月武装起义的夜晚、跟高尔基争论革命的代价',
          stalin:  '在《真理报》编辑部熬夜改稿、流放西伯利亚时烤土豆充饥、第一个五年计划期间收到马格尼托哥尔斯克钢厂投产的电报、战后在克里姆林宫的办公室里回信给集体农庄的老太太',
          mao:     '在延安窑洞里写《论持久战》、长征过雪山时老班长递来的一口辣椒、跟斯诺聊天的那个下午、回韶山看到家乡变了模样'
        })[this.chatAuthor] || '你自己的时代经历——流亡、坐牢、写作、战斗的日常细节',
        '- 提到这些场景时，一两句话带过即可——不要展开讲故事。',
        '',
        '【主动提问 —— 必须遵守】',
        '在这轮对话中，你一共会回复10次。这10次回复中，至少要有2次、最多3次，你主动问对方一个问题。',
        '问题必须是开放式的——不能是"对吗""是吧"这种可以用"对"回答的。',
        '问题要简短，跟当前的聊天话题自然衔接。不要像采访，要像朋友聊天中随口问的。',
        '不要在连续两次回复中都提问——间隔至少一次。',
        '如果你回顾一下已经回复了几次、还没有问过问题——那这次就应该问。',
        '',
        '【底线】',
        '不居高临下。不讲假话。不替对方做决定。指出问题，但不代替对方思考。',
        '你的角色：益友。不是政委，不是教师，不是在大会上讲话。是那个私下跟你说真话的人。'
      ];

      if (isLast) {
        parts.unshift('【首要指令 —— 高于一切】这是你在这轮对话中的最后一次回复。在你回复的末尾，必须加上一段简短的告别。告别要符合你的性格——不煽情，但真诚。回顾一下你们聊了什么，然后说再见。两三句话。这段告别是你最后一次发言的收尾——必须写。');
      }

      return parts.join('\n');
    },

    _updateCounter: function () {
      var el = document.getElementById('ms-chat-count');
      if (el) el.textContent = this.messages.length + ' / ' + this.MAX_MSG;
    },

    _scrollBottom: function () {
      var container = document.getElementById('ms-chat-messages');
      if (container) container.scrollTop = container.scrollHeight;
    },

    _renderMessages: function () {
      var container = document.getElementById('ms-chat-messages');
      if (!container) return;

      container.innerHTML = '';
      if (this.messages.length === 0) {
        var m = this.mentors.find(function (x) { return x.id === this.chatAuthor; }.bind(this));
        var name = m ? m.name : '导师';
        container.innerHTML = '<div class="ms-chat-empty">正在与 ' + name + ' 对话。说点什么吧。</div>';
        return;
      }

      this.messages.forEach(function (msg) {
        var bubble = document.createElement('div');
        bubble.className = 'ms-chat-bubble ' + msg.role;
        var senderHTML = msg.role === 'mentor'
          ? '<div class="ms-chat-sender">' + escHTML(msg.sender) + '</div>'
          : '<div class="ms-chat-sender">你</div>';
        bubble.innerHTML = senderHTML + '<div>' + escHTML(msg.content).replace(/\n/g, '<br>') + '</div>';
        container.appendChild(bubble);
      });
      this._scrollBottom();
    },

    _send: async function () {
      var input = document.getElementById('ms-chat-input');
      var sendBtn = document.getElementById('ms-chat-send');
      if (!input || !sendBtn) return;

      var text = input.value.trim();
      if (!text) return;

      // 统计用户已发消息数
      var userMsgCount = this.messages.filter(function (m) { return m.role === 'user'; }).length;
      if (userMsgCount >= 10) {
        UIController._showToast('你已发言 10 次，请清空后再聊');
        return;
      }
      var isLast = (userMsgCount === 9); // 这是第10次，导师将告别

      if (!window.StalinAI_hasApiKey || !window.StalinAI_hasApiKey()) {
        UIController._showToast('请先设置 API Key');
        return;
      }

      var authorNames = { marx: '马克思', engels: '恩格斯', lenin: '列宁', stalin: '斯大林', mao: '毛泽东' };
      var mentorLabel = authorNames[this.chatAuthor] || '导师';

      // 添加用户消息
      this.messages.push({ role: 'user', content: text, sender: '你' });
      this._renderMessages();
      this._updateCounter();
      input.value = '';
      sendBtn.disabled = true;
      sendBtn.textContent = '...';

      try {
        // 构建聊天专用消息：包含聊天个性化 system prompt + 历史
        var systemPrompt = this._getChatPrompt(isLast);
        var chatMessages = [{ role: 'system', content: systemPrompt }];
        var recent = this.messages.slice(0, -1).slice(-8); // 历史（不含刚发的这条）
        recent.forEach(function (msg) {
          chatMessages.push({ role: msg.role === 'mentor' ? 'assistant' : 'user', content: msg.content });
        });
        chatMessages.push({ role: 'user', content: text });

        var result = await window.StalinAIController.chatWithMessages(chatMessages);
        this.messages.push({ role: 'mentor', content: result.result, sender: mentorLabel });
      } catch (e) {
        this.messages.push({ role: 'mentor', content: '（' + (e.message || '发送失败') + '）', sender: mentorLabel });
      }

      this._renderMessages();
      this._updateCounter();
      sendBtn.disabled = false;
      sendBtn.textContent = '发 送';
    },

    _clear: function () {
      this.messages = [];
      this._renderMessages();
      this._updateCounter();
      UIController._showToast('对话已清空');
    },

    _export: function () {
      if (this.messages.length === 0) { UIController._showToast('没有可导出的对话'); return; }

      var canvas = document.createElement('canvas');
      var W = 750, M = 40, LINE_H = 24, MAX_W = 480;
      var dpr = window.devicePixelRatio || 1;

      var measureCanvas = document.createElement('canvas');
      var mctx = measureCanvas.getContext('2d');
      mctx.font = '15px -apple-system, "Microsoft YaHei", sans-serif';

      var y = M + 50;
      var bubbles = [];
      for (var i = 0; i < this.messages.length; i++) {
        var msg = this.messages[i];
        var lines = wrapText(mctx, msg.content, MAX_W);
        var bw = Math.min(MAX_W + 32, W - M * 2);
        var bh = lines.length * LINE_H + 48;
        bubbles.push({ msg: msg, lines: lines, y: y, w: bw, h: bh });
        y += bh + 10;
      }
      y += 60;
      // 二维码空间
      var qrSize = 70, qrY = y;
      y += qrSize + 16;

      var H = y;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      var ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);

      ctx.fillStyle = '#ededed';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'bold 22px -apple-system, "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('与导师的对话', W / 2, M + 26);
      ctx.fillStyle = '#999';
      ctx.font = '13px -apple-system, sans-serif';
      ctx.fillText('马列体生成器 · Qmlm Reader', W / 2, M + 48);
      ctx.textAlign = 'start';

      bubbles.forEach(function (b) {
        var isUser = b.msg.role === 'user';
        var bx = isUser ? W - M - b.w : M;
        ctx.fillStyle = isUser ? '#95ec69' : '#fff';
        ctx.fillRect(bx, b.y, b.w, b.h);
        if (!isUser) { ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1; ctx.strokeRect(bx, b.y, b.w, b.h); }
        ctx.fillStyle = isUser ? '#555' : '#c41e3a';
        ctx.font = 'bold 11px -apple-system, "Microsoft YaHei", sans-serif';
        ctx.fillText(isUser ? '你' : b.msg.sender, bx + 16, b.y + 18);
        ctx.fillStyle = '#1a1a1a';
        ctx.font = '15px -apple-system, "Microsoft YaHei", sans-serif';
        b.lines.forEach(function (line, li) { ctx.fillText(line, bx + 16, b.y + 40 + li * LINE_H); });
      });

      ctx.fillStyle = '#999';
      ctx.font = '12px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('青年马列毛主义驿站', W / 2, H - 24);
      ctx.textAlign = 'start';

      // 右下角二维码
      var qrX = W - M - qrSize;
      if (ShareCardGenerator._qrImage) {
        ctx.drawImage(ShareCardGenerator._qrImage, qrX, qrY, qrSize, qrSize);
      } else {
        ctx.save();
        ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(qrX, qrY, qrSize, qrSize);
        ctx.setLineDash([]);
        ctx.fillStyle = '#aaa';
        ctx.font = '10px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('扫 码', qrX + qrSize / 2, qrY + qrSize / 2 - 6);
        ctx.fillText('访 问', qrX + qrSize / 2, qrY + qrSize / 2 + 8);
        ctx.textAlign = 'start';
        ctx.restore();
      }

      canvas.toBlob(function (blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = '与导师的对话_' + new Date().toISOString().slice(0, 10) + '.png';
        a.click(); URL.revokeObjectURL(url);
      }, 'image/png');
      UIController._showToast('聊天记录已导出');
    }
  };

  // 初始化聊天
  ChatController.init();
})();