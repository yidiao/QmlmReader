// ==================== 导航栏自动注入 ====================
// 替代所有页面的硬编码 site-header。每页只需 <div id="nav-placeholder"></div>
(function(){
    var path = window.location.pathname;
    var dir = path.replace(/\/[^\/]*\.html$/, '');
    var parts = dir.split('/').filter(function(p){return p.length>0;});
    var htmlIdx = parts.indexOf('html');
    var depth = htmlIdx === -1 ? 0 : parts.length - htmlIdx - 1;
    var p = '';
    for (var i = 0; i < depth; i++) p += '../';

    var nav = '<header class="site-header"><div class="container">' +
        '<div class="logo"><span class="logo-icon">☭</span><div class="logo-text"><h1>青年马列毛主义驿站</h1><span class="logo-sub">Qmlm Reader</span></div></div>' +
        '<button class="hamburger-btn" id="hamburgerBtn" aria-label="打开菜单"><span></span><span></span><span></span></button>' +
        '<nav class="main-nav">' +
        '<button class="nav-close-btn" aria-label="关闭菜单">✕</button>' +
        '<a href="' + p + 'index.html">首页</a>' +
        '<a href="' + p + 'articles/articles.html">文章</a>' +
        '<a href="' + p + 'masters/masters.html">导师</a>' +
        '<a href="' + p + 'toolkit/toolkit.html">工具集</a>' +
        '<a href="' + p + 'gallery/gallery.html">文艺</a>' +
        '<a href="' + p + 'puzzle/puzzle.html" style="color:#ffd700;font-weight:bold;">🧩 理论拼图</a>' +
        '<a href="' + p + 'international/international.html">🌍 国际共运</a>' +
        '<a href="' + p + 'rectify/rectify.html">正名</a>' +
        '<a href="' + p + 'about/about.html">关于</a>' +
        '<button class="dark-mode-toggle" onclick="toggleDarkMode()" title="切换黑夜模式">🌙</button>' +
        '</nav></div></header>';

    var ph = document.getElementById('nav-placeholder');
    if (ph) { ph.outerHTML = nav; }
})();

// 标签切换功能
document.addEventListener('DOMContentLoaded', function() {
    // 标签切换 - 支持两种模式：
    // 1. data-tab 属性 + data-tab 选择器（articles.html等页面）
    // 2. id 属性 + onclick="switchTab(...)"（文章详情页）
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            // 如果按钮使用 onclick="switchTab(...)"，则不处理，让onclick处理
            // 只有使用 data-tab 属性的按钮才由这里处理
            const tabId = this.dataset.tab;
            
            if (!tabId) {
                // 没有 data-tab 属性，交给 onclick="switchTab(...)" 处理
                return;
            }
            
            // 移除所有活动状态
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // 添加当前活动状态
            this.classList.add('active');
            
            // 使用 data-tab 属性选择器
            const target = document.querySelector(`.tab-content[data-tab="${tabId}"]`);
            if (target) target.classList.add('active');
        });
    });
});

// 分类筛选切换
function toggleCategories() {
    const filters = document.getElementById('categoryFilters');
    filters.classList.toggle('active');
}

// 搜索功能
function performSearch() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    if (!query) return;

    // 获取所有文章卡片
    const cards = document.querySelectorAll('.article-card');
    
    cards.forEach(card => {
        const title = card.querySelector('.article-title').textContent.toLowerCase();
        const author = card.querySelector('.article-author').textContent.toLowerCase();
        const desc = card.querySelector('.article-desc').textContent.toLowerCase();
        
        if (title.includes(query) || author.includes(query) || desc.includes(query)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// 回车搜索
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
});

// 平滑滚动
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// 导航高亮
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.main-nav a');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});

// 文章筛选功能
function filterArticles(filterType, filterValue) {
    const cards = document.querySelectorAll('.article-card');
    
    cards.forEach(card => {
        if (filterType === 'all') {
            card.style.display = 'block';
        } else if (filterType === 'priority') {
            card.style.display = card.dataset.priority === filterValue ? 'block' : 'none';
        } else if (filterType === 'author') {
            card.style.display = card.dataset.author === filterValue ? 'block' : 'none';
        }
    });
}

// 复选框筛选
document.addEventListener('DOMContentLoaded', function() {
    const checkboxes = document.querySelectorAll('.category-filters input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            applyFilters();
        });
    });
});

function applyFilters() {
    const cards = document.querySelectorAll('.article-card');
    
    // 获取选中的筛选条件
    const selectedPriorities = Array.from(document.querySelectorAll('.filter-priority:checked')).map(cb => cb.value);
    const selectedAuthors = Array.from(document.querySelectorAll('.filter-author:checked')).map(cb => cb.value);
    const selectedTypes = Array.from(document.querySelectorAll('.filter-type:checked')).map(cb => cb.value);
    
    cards.forEach(card => {
        const priority = card.dataset.priority;
        const author = card.dataset.author;
        const type = card.dataset.type;
        
        let show = true;
        
        if (selectedPriorities.length > 0 && !selectedPriorities.includes(priority)) {
            show = false;
        }
        if (selectedAuthors.length > 0 && !selectedAuthors.includes(author)) {
            show = false;
        }
        if (selectedTypes.length > 0 && !selectedTypes.includes(type)) {
            show = false;
        }
        
        card.style.display = show ? 'block' : 'none';
    });
}

// ==================== 汉堡菜单 ====================
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger-btn');
    const nav = document.querySelector('.main-nav');
    if (!hamburger || !nav) return;

    // 点击汉堡按钮切换菜单
    hamburger.addEventListener('click', function(e) {
        e.stopPropagation();
        const isOpen = nav.classList.toggle('open');
        hamburger.classList.toggle('open', isOpen);
        // 菜单打开时禁止背景滚动
        document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // 点击菜单内关闭按钮（X）关闭菜单
    const closeBtn = nav.querySelector('.nav-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            nav.classList.remove('open');
            hamburger.classList.remove('open');
            document.body.style.overflow = '';
        });
    }

    // 点击菜单内链接后自动关闭
    nav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function() {
            nav.classList.remove('open');
            hamburger.classList.remove('open');
            document.body.style.overflow = '';
        });
    });

    // 点击遮罩（菜单外区域）关闭
    document.addEventListener('click', function(e) {
        if (nav.classList.contains('open') && !nav.contains(e.target) && e.target !== hamburger) {
            nav.classList.remove('open');
            hamburger.classList.remove('open');
            document.body.style.overflow = '';
        }
    });

    // ESC 键关闭菜单
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && nav.classList.contains('open')) {
            nav.classList.remove('open');
            hamburger.classList.remove('open');
            document.body.style.overflow = '';
        }
    });

    // 窗口调整大小时，如果从移动端切换到桌面端，强制关闭菜单
    window.addEventListener('resize', function() {
        if (window.innerWidth >= 769) {
            nav.classList.remove('open');
            hamburger.classList.remove('open');
            document.body.style.overflow = '';
        }
    });
});

// ==================== 文章页：章节导航 + Tab记忆 ====================
document.addEventListener('DOMContentLoaded', function() {
    // ---- Tab 状态记忆 ----
    var tabBtns = document.querySelectorAll('.tab-btn');
    if (tabBtns.length > 0) {
        var pagePath = window.location.pathname;
        var savedTab = sessionStorage.getItem('tab-' + pagePath);
        if (savedTab) {
            var targetBtn = document.querySelector('.tab-btn[onclick*="' + savedTab + '"]');
            if (targetBtn) targetBtn.click();
        }
        tabBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                var match = this.getAttribute('onclick').match(/switchTab\('(\w+)'/);
                if (match) sessionStorage.setItem('tab-' + pagePath, match[1]);
            });
        });
    }

    // ---- 动态章节侧边导航 ----
    var chapters = document.querySelectorAll('#original .chapter');
    if (chapters.length < 3) return;

    var nav = document.createElement('nav');
    nav.id = 'dynamicChapterNav';
    nav.className = 'dynamic-chapter-nav';
    nav.innerHTML = '<div class="dcn-title">📑 章节导航</div><div class="dcn-list"></div>';
    var list = nav.querySelector('.dcn-list');

    chapters.forEach(function(ch, i) {
        var titleEl = ch.querySelector('.chapter-title');
        if (!titleEl) return;
        var text = titleEl.textContent.replace(/[▼▶]/g, '').trim();
        if (text.length > 22) text = text.substring(0, 22) + '…';
        var id = 'ch-nav-' + i;
        ch.id = id;
        var a = document.createElement('a');
        a.href = '#' + id;
        a.textContent = text;
        a.className = 'dcn-item';
        a.addEventListener('click', function(e) {
            e.preventDefault();
            var target = document.getElementById(this.getAttribute('href').substring(1));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        list.appendChild(a);
    });

    // 侧边栏切换手柄
    var toggle = document.createElement('button');
    toggle.className = 'dcn-toggle';
    toggle.title = '显示/隐藏章节导航';
    toggle.textContent = '导航';
    toggle.addEventListener('click', function() {
        var visible = nav.classList.toggle('visible');
        toggle.classList.toggle('shifted', visible);
        try { sessionStorage.setItem('dcn-visible', visible ? '1' : '0'); } catch(e) {}
    });

    document.body.appendChild(nav);
    document.body.appendChild(toggle);

    // 恢复用户偏好：如果之前手动关闭过，则不自动展开
    var savedVis;
    try { savedVis = sessionStorage.getItem('dcn-visible'); } catch(e) {}
    if (savedVis !== '0') {
        setTimeout(function() { nav.classList.add('visible'); toggle.classList.add('shifted'); }, 300);
    }

    // 滚动高亮
    var ticking = false;
    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(function() {
                var scrollPos = window.scrollY + 120;
                var items = list.querySelectorAll('.dcn-item');
                chapters.forEach(function(ch, i) {
                    if (ch.offsetTop <= scrollPos && ch.offsetTop + ch.offsetHeight > scrollPos) {
                        items.forEach(function(it) { it.classList.remove('active'); });
                        if (items[i]) items[i].classList.add('active');
                    }
                });
                ticking = false;
            });
            ticking = true;
        }
    });
});

// ==================== 合集上下文导航（面包屑 + 上/下一章） ====================
var COLLECTIONS = [{"id":"mao-vol1","title":"毛泽东选集 · 第一卷","cover":"☭","articles":[{"title":"中国社会各阶级的分析","slug":null},{"title":"湖南农民运动考察报告","slug":"Mao/nong-min-yun-dong"},{"title":"中国的红色政权为什么能够存在？","slug":null},{"title":"井冈山的斗争","slug":null},{"title":"关于纠正党内的错误思想","slug":null},{"title":"星星之火，可以燎原","slug":null},{"title":"反对本本主义","slug":null},{"title":"必须注意经济工作","slug":null},{"title":"怎样分析农村阶级","slug":null},{"title":"我们的经济政策","slug":null},{"title":"关心群众生活，注意工作方法","slug":null},{"title":"论反对日本帝国主义的策略","slug":null},{"title":"中国革命战争的战略问题","slug":"Mao/zhan-lue-wen-ti"},{"title":"关于蒋介石声明的声明","slug":null},{"title":"中国共产党在抗日时期的任务","slug":null},{"title":"实践论","slug":"Mao/shi-jian-lun"},{"title":"矛盾论","slug":"Mao/mao-dun-lun"}]},{"id":"mao-vol2","title":"毛泽东选集 · 第二卷","cover":"☭","articles":[{"title":"反对日本进攻的方针、办法和前途","slug":null},{"title":"为动员一切力量争取抗战胜利而斗争","slug":null},{"title":"反对自由主义","slug":null},{"title":"上海太原失陷以后抗日战争的形势和任务","slug":null},{"title":"抗日游击战争的战略问题","slug":"Mao/you-ji-zhan"},{"title":"论持久战","slug":"Mao/lun-chi-jiu-zhan"},{"title":"中国共产党在民族战争中的地位","slug":null},{"title":"统一战线中的独立自主问题","slug":null},{"title":"战争和战略问题","slug":"Mao/zhan-zheng-zhan-lue"},{"title":"青年运动的方向","slug":null},{"title":"《共产党人》发刊词","slug":null},{"title":"中国革命和中国共产党","slug":null},{"title":"新民主主义论","slug":"Mao/xin-min-zhu"},{"title":"论政策","slug":null}]},{"id":"mao-military","title":"毛泽东军事思想","cover":"⚔️","articles":[{"title":"中国革命战争的战略问题","slug":"Mao/zhan-lue-wen-ti"},{"title":"抗日游击战争的战略问题","slug":"Mao/you-ji-zhan"},{"title":"论持久战","slug":"Mao/lun-chi-jiu-zhan"},{"title":"战争和战略问题","slug":"Mao/zhan-zheng-zhan-lue"}]},{"id":"mao-philosophy","title":"毛泽东哲学方法论","cover":"🧠","articles":[{"title":"实践论","slug":"Mao/shi-jian-lun"},{"title":"矛盾论","slug":"Mao/mao-dun-lun"}]},{"id":"marx-engels","title":"马克思恩格斯选集","cover":"📖","articles":[{"title":"1844年经济学哲学手稿","slug":"Marx/1844-nian-jing-ji-xue-zhe-xue-shou-gao"},{"title":"关于费尔巴哈的提纲","slug":"Marx/guan-yu-fei-er-ba-ha-de-ti-gang"},{"title":"德意志意识形态","slug":"Marx/de-yi-zhi-yi-xing-tai"},{"title":"共产党宣言","slug":"Marx/gongchan-dan-yuan"},{"title":"《政治经济学批判》序言","slug":null},{"title":"资本论（第一卷）","slug":null},{"title":"法兰西内战","slug":null},{"title":"哥达纲领批判","slug":"Marx/ge-da-gang-ling"},{"title":"反杜林论","slug":"Engels/fan-du-lin-lun"},{"title":"社会主义从空想到科学的发展","slug":null},{"title":"家庭、私有制和国家的起源","slug":"Engels/jia-ting-si-you-zhi-he-guo-jia-de-qi-yuan"},{"title":"费尔巴哈和德国古典哲学的终结","slug":"Marx/hei-ge-er-fa-zhe-xue-pi-pan-dao-yan"}]},{"id":"lenin","title":"列宁选集","cover":"🔴","articles":[{"title":"怎么办？","slug":"Lenin/zen-me-ban"},{"title":"唯物主义和经验批判主义","slug":"Lenin/wei-wu-zhu-yi-he-jing-yan-pi-pan-zhu-yi"},{"title":"马克思主义的三个来源和三个组成部分","slug":"Lenin/ma-ke-si-zhu-yi-de-san-ge-lai-yuan"},{"title":"帝国主义是资本主义的最高阶段","slug":"Lenin/di-guo-zhu-yi-shi-zi-ben-zhu-yi-de-zui-gao-jie-duan"},{"title":"国家与革命","slug":"Lenin/guo-jia-yu-ge-ming"},{"title":"无产阶级革命和叛徒考茨基","slug":null},{"title":"共产主义运动中的'左派'幼稚病","slug":null}]},{"id":"stalin","title":"斯大林著作选","cover":"⭐","articles":[{"title":"论列宁主义基础","slug":"Stalin/lun-lunen-zhu-yi-ji-chu"},{"title":"论列宁主义的几个问题","slug":null},{"title":"关于苏联宪法草案","slug":null},{"title":"论辩证唯物主义和历史唯物主义","slug":"Mao/lun-shi-da-guan-xi"},{"title":"马克思主义和语言学问题","slug":null},{"title":"苏联社会主义经济问题","slug":null}]},{"id":"political-economy","title":"政治经济学经典","cover":"💰","articles":[{"title":"1844年经济学哲学手稿","slug":"Marx/1844-nian-jing-ji-xue-zhe-xue-shou-gao"},{"title":"雇佣劳动与资本","slug":null},{"title":"《政治经济学批判》序言","slug":null},{"title":"工资、价格和利润","slug":null},{"title":"资本论（第一卷）","slug":null},{"title":"哥达纲领批判","slug":"Marx/ge-da-gang-ling"},{"title":"帝国主义是资本主义的最高阶段","slug":"Lenin/di-guo-zhu-yi-shi-zi-ben-zhu-yi-de-zui-gao-jie-duan"},{"title":"苏联社会主义经济问题","slug":null}]},{"id":"party-building","title":"党的建设与组织理论","cover":"🏛️","articles":[{"title":"怎么办？","slug":"Lenin/zen-me-ban"},{"title":"共产主义运动中的'左派'幼稚病","slug":null},{"title":"论列宁主义基础","slug":"Stalin/lun-lunen-zhu-yi-ji-chu"},{"title":"关于纠正党内的错误思想","slug":null},{"title":"《共产党人》发刊词","slug":null},{"title":"改造我们的学习","slug":null},{"title":"整顿党的作风","slug":null},{"title":"学习和时局","slug":"Mao/xue-xi-shi-ju"}]}];

// 合集弹窗 — 与 articles.html 同款
function injectCollModal() {
    if (document.getElementById('collModal')) return;
    var modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'collModal';
    modal.innerHTML =
        '<div class="modal-dialog">' +
        '<div class="modal-header"><div><h2 id="collModalTitle"></h2></div>' +
        '<button class="modal-close" onclick="closeCollModal()">✕</button></div>' +
        '<div class="modal-body" id="collModalBody"></div></div>';
    document.body.appendChild(modal);
    modal.addEventListener('click', function(e) { if (e.target === modal) closeCollModal(); });
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeCollModal(); });
}
function closeCollModal() {
    var m = document.getElementById('collModal');
    if (m) { m.classList.remove('open'); document.body.style.overflow = ''; }
}
var currentCollModalColl = null, currentCollModalAll = null;
function openCollModal(coll, allMatches) {
    injectCollModal();
    currentCollModalColl = coll;
    currentCollModalAll = allMatches || [coll];
    renderCollModalBody(coll);
}

function renderCollModalBody(coll) {
    currentCollModalColl = coll;
    var titleEl = document.getElementById('collModalTitle');
    var body = document.getElementById('collModalBody');

    // Title with collection selector if multiple
    var titleHTML = coll.cover + ' ' + coll.title;
    if (currentCollModalAll && currentCollModalAll.length > 1) {
        titleHTML += ' <span style="font-size:0.7rem;opacity:0.7;">(' + (currentCollModalAll.indexOf(coll) + 1) + '/' + currentCollModalAll.length + ')</span>';
    }
    titleEl.innerHTML = titleHTML;

    // Collection tabs if multiple
    var tabsHTML = '';
    if (currentCollModalAll && currentCollModalAll.length > 1) {
        tabsHTML = '<div style="display:flex;gap:4px;margin-bottom:1rem;flex-wrap:wrap;">';
        currentCollModalAll.forEach(function(m) {
            var active = m.coll.id === coll.id ? ' style="background:#c41e3a;color:white;font-weight:600;"' : ' style="background:#f0f0f0;color:#555;cursor:pointer;"';
            tabsHTML += '<button onclick="renderCollModalBody(currentCollModalAll[' + currentCollModalAll.indexOf(m) + '].coll)"' + active + ' class="tab-btn" style="padding:4px 12px;font-size:0.8rem;border-radius:15px;border:none;">' + m.coll.cover + ' ' + m.coll.title + '</button>';
        });
        tabsHTML += '</div>';
    }

    body.innerHTML = tabsHTML + coll.articles.map(function(a, i) {
        var href = a.slug ? '../articles/' + a.slug + '.html' : '#';
        var cls = a.slug ? 'modal-article' : 'modal-article wip';
        var badge = a.slug ? '<span class="ma-status ready">已收录</span>'
                        : '<span class="ma-status wip">筹备中</span>';
        return '<a href="' + href + '" class="' + cls + '">' +
            '<span class="ma-num">' + (i+1) + '</span>' +
            '<span class="ma-info"><span class="ma-title">' + a.title + '</span></span>' +
            badge + '</a>';
    }).join('');
    document.getElementById('collModal').classList.add('open');
    document.body.style.overflow = 'hidden';
}

document.addEventListener('DOMContentLoaded', function() {
    var backNav = document.querySelector('.back-nav .back-link');
    if (!backNav) return;

    var path = window.location.pathname;
    // Extract slug from path: /articles/xxx.html -> xxx
    var slugMatch = path.match(/\/([^\/]+)\.html$/);
    if (!slugMatch) return;
    var currentSlug = slugMatch[1];

    // Find ALL collections this article belongs to
    var matches = [];
    for (var ci = 0; ci < COLLECTIONS.length; ci++) {
        var articles = COLLECTIONS[ci].articles;
        for (var ai = 0; ai < articles.length; ai++) {
            if (articles[ai].slug === currentSlug) {
                matches.push({ coll: COLLECTIONS[ci], idx: ai });
                break;
            }
        }
    }
    if (matches.length === 0) return;

    // Use first match for breadcrumb, but track all for modal
    var foundColl = matches[0].coll;
    var foundIdx = matches[0].idx;
    var allMatches = matches; // for quick-jump

    var article = foundColl.articles[foundIdx];
    var total = foundColl.articles.length;
    var pos = foundIdx + 1;

    var container = backNav.parentElement;
    var bc = document.createElement('div');
    bc.style.cssText = 'display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.6rem;width:100%;';

    // Left: back + breadcrumb + quick-jump
    var left = document.createElement('span');
    left.style.cssText = 'display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;';
    left.innerHTML = '<a href="../articles.html" class="back-link" style="margin:0;"><span>←</span> 返回文章列表</a>';

    var sep = document.createElement('span');
    sep.style.cssText = 'color:#ccc;font-size:1.2rem;';
    sep.textContent = '|';
    left.appendChild(sep);

    var crumb = document.createElement('span');
    crumb.style.cssText = 'font-size:0.88rem;color:#555;';
    crumb.innerHTML = foundColl.cover + ' <strong>' + foundColl.title + '</strong> <span style="color:#aaa;">›</span> <em>' + article.title + '</em> <span style="font-size:0.78rem;color:#999;">(' + pos + '/' + total + ')</span>';
    if (allMatches.length > 1) {
        crumb.innerHTML += ' <span style="font-size:0.7rem;color:#999;">(+' + (allMatches.length - 1) + '个合集)</span>';
    }
    left.appendChild(crumb);
    bc.appendChild(left);

    // Right: prev/next + quick-jump
    var right = document.createElement('span');
    right.style.cssText = 'display:flex;align-items:center;gap:0.8rem;flex-shrink:0;';

    if (foundIdx > 0) {
        var prevA = foundColl.articles[foundIdx - 1];
        var prevHref = prevA.slug ? '../articles/' + prevA.slug + '.html' : '#';
        var prevDisabled = prevA.slug ? '' : ' style="opacity:0.35;pointer-events:none;"';
        right.innerHTML += '<a href="' + prevHref + '" class="back-link" style="margin:0;font-size:0.88rem;"' + prevDisabled + '>← 上一章</a>';
    } else {
        right.innerHTML += '<span style="color:#ccc;font-size:0.88rem;">← 上一章</span>';
    }

    if (foundIdx < total - 1) {
        var nextA = foundColl.articles[foundIdx + 1];
        var nextHref = nextA.slug ? '../articles/' + nextA.slug + '.html' : '#';
        var nextDisabled = nextA.slug ? '' : ' style="opacity:0.35;pointer-events:none;"';
        right.innerHTML += '<a href="' + nextHref + '" class="back-link" style="margin:0;font-size:0.88rem;"' + nextDisabled + '>下一章 →</a>';
    } else {
        right.innerHTML += '<span style="color:#ccc;font-size:0.88rem;">下一章 →</span>';
    }

    // Quick-jump button — shows all collections if article belongs to multiple
    var qjBtn = document.createElement('button');
    qjBtn.textContent = '📚';
    qjBtn.title = '浏览合集目录';
    qjBtn.style.cssText = 'background:none;border:1px solid #ddd;border-radius:6px;padding:2px 8px;cursor:pointer;font-size:1rem;';
    qjBtn.onclick = function(){ openCollModal(foundColl, allMatches); };
    right.appendChild(qjBtn);

    bc.appendChild(right);
    container.innerHTML = '';
    container.appendChild(bc);

    // Dark mode fix for new elements
    if (document.body.classList.contains('dark-mode')) {
        crumb.style.color = '#bbb';
    }
});
