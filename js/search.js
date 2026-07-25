// ============================================================
// 搜索索引 v2 — 覆盖：经典文章 / 文艺视频 / 正名文章 / 历史大事件
// ============================================================

// ------ 1. 经典文章索引 ------
const articleIndex = [
    // 五星 - 毛泽东
    { title: '论持久战', file: 'articles/Mao/lun-chi-jiu-zhan.html', author: '毛泽东', authorKey: 'mao', year: '1938', priority: '5', category: '军事战略', keywords: ['抗日战争', '持久战', '军事', '战略'] },
    { title: '实践论', file: 'articles/Mao/shi-jian-lun.html', author: '毛泽东', authorKey: 'mao', year: '1937', priority: '5', category: '哲学基础', keywords: ['认识论', '辩证法', '实践', '知行'] },
    { title: '矛盾论', file: 'articles/Mao/mao-dun-lun.html', author: '毛泽东', authorKey: 'mao', year: '1937', priority: '5', category: '哲学基础', keywords: ['辩证法', '矛盾', '对立统一', '主要矛盾'] },
    { title: '中国革命战争的战略问题', file: 'articles/Mao/zhan-lue-wen-ti.html', author: '毛泽东', authorKey: 'mao', year: '1936', priority: '5', category: '军事战略', keywords: ['革命战争', '战略', '游击战'] },
    { title: '抗日游击战争的战略问题', file: 'articles/Mao/you-ji-zhan.html', author: '毛泽东', authorKey: 'mao', year: '1938', priority: '5', category: '军事战略', keywords: ['游击战', '抗日', '战略地位'] },
    { title: '战争和战略问题', file: 'articles/Mao/zhan-zheng-zhan-lue.html', author: '毛泽东', authorKey: 'mao', year: '1938', priority: '5', category: '军事战略', keywords: ['武装斗争', '战略转变'] },
    { title: '新民主主义论', file: 'articles/Mao/xin-min-zhu.html', author: '毛泽东', authorKey: 'mao', year: '1940', priority: '5', category: '政治理论', keywords: ['新民主主义', '政治', '经济', '文化'] },
    { title: '在延安文艺座谈会上的讲话', file: 'articles/Mao/wen-yi-zuo-tan.html', author: '毛泽东', authorKey: 'mao', year: '1942', priority: '5', category: '思想文化', keywords: ['文艺', '文学', '为人民服务', '延安'] },
    { title: '学习和时局', file: 'articles/Mao/xue-xi-shi-ju.html', author: '毛泽东', authorKey: 'mao', year: '1944', priority: '5', category: '思想文化', keywords: ['学习', '时局', '精神解放'] },
    { title: '关于正确处理人民内部矛盾的问题', file: 'articles/Mao/ren-min-nei-bu-mao-dun.html', author: '毛泽东', authorKey: 'mao', year: '1957', priority: '5', category: '政治理论', keywords: ['人民内部矛盾', '敌我矛盾', '两类矛盾'] },
    // 五星 - 列宁
    { title: '怎么办？', file: 'articles/Lenin/zen-me-ban.html', author: '列宁', authorKey: 'lenin', year: '1902', priority: '5', category: '党的建设', keywords: ['建党', '灌输论', '先锋队', '经济派'] },
    { title: '唯物主义和经验批判主义', file: 'articles/Lenin/wei-wu-zhu-yi-he-jing-yan-pi-pan-zhu-yi.html', author: '列宁', authorKey: 'lenin', year: '1909', priority: '5', category: '哲学基础', keywords: ['认识论', '马赫主义', '辩证唯物主义'] },
    { title: '国家与革命', file: 'articles/Lenin/guo-jia-yu-ge-ming.html', author: '列宁', authorKey: 'lenin', year: '1917', priority: '5', category: '政治理论', keywords: ['国家', '无产阶级专政', '打碎国家机器', '公社'] },
    // 五星 - 马克思恩格斯
    { title: '共产党宣言', file: 'articles/Marx/gongchan-dan-yuan.html', author: '马克思 · 恩格斯', authorKey: 'marx', year: '1848', priority: '5', category: '政治理论', keywords: ['科学社会主义', '阶级斗争', '无产阶级', '共产主义'] },
    // 五星 - 斯大林
    { title: '论列宁主义基础', file: 'articles/Stalin/lun-lunen-zhu-yi-ji-chu.html', author: '斯大林', authorKey: 'stalin', year: '1924', priority: '5', category: '政治理论', keywords: ['列宁主义', '帝国主义', '无产阶级革命', '无产阶级专政'] },
    { title: '论中国革命的前途', file: 'articles/Stalin/lun-zhongguo-ge-ming-de-qiantu.html', author: '斯大林', authorKey: 'stalin', year: '1926', priority: '5', category: '政治理论', keywords: ['中国革命', '农民问题', '无产阶级领导权', '非资本主义道路'] },
    // 四星
    { title: '湖南农民运动考察报告', file: 'articles/Mao/nong-min-yun-dong.html', author: '毛泽东', authorKey: 'mao', year: '1927', priority: '4', category: '政治理论', keywords: ['农民运动', '阶级分析', '农村'] },
    // 五星 - 马克思恩格斯（补充）
    { title: '德意志意识形态', file: 'articles/Marx/de-yi-zhi-yi-xing-tai.html', author: '马克思 · 恩格斯', authorKey: 'marx', year: '1845', priority: '5', category: '哲学基础', keywords: ['历史唯物主义', '意识形态', '费尔巴哈', '生产力', '交往形式'] },
    { title: '关于费尔巴哈的提纲', file: 'articles/Marx/guan-yu-fei-er-ba-ha-de-ti-gang.html', author: '马克思', authorKey: 'marx', year: '1845', priority: '5', category: '哲学基础', keywords: ['费尔巴哈', '实践', '唯物主义', '提纲', '十一条'] },
    { title: '1844年经济学哲学手稿', file: 'articles/Marx/1844-nian-jing-ji-xue-zhe-xue-shou-gao.html', author: '马克思', authorKey: 'marx', year: '1844', priority: '4', category: '哲学基础', keywords: ['异化劳动', '手稿', '经济学', '哲学', '共产主义'] },
    { title: '哥达纲领批判', file: 'articles/Marx/ge-da-gang-ling.html', author: '马克思', authorKey: 'marx', year: '1875', priority: '5', category: '政治理论', keywords: ['哥达纲领', '科学社会主义', '按劳分配', '共产主义两个阶段'] },
    { title: '反杜林论', file: 'articles/Engels/fan-du-lin-lun.html', author: '恩格斯', authorKey: 'engels', year: '1878', priority: '5', category: '哲学基础', keywords: ['杜林', '马克思主义哲学', '政治经济学', '科学社会主义', '百科全书'] },
    { title: '家庭、私有制和国家的起源', file: 'articles/Engels/jia-ting-si-you-zhi-he-guo-jia-de-qi-yuan.html', author: '恩格斯', authorKey: 'engels', year: '1884', priority: '4', category: '政治理论', keywords: ['家庭', '私有制', '国家', '起源', '摩尔根'] },
    // 五星 - 列宁（补充）
    { title: '帝国主义是资本主义的最高阶段', file: 'articles/Lenin/di-guo-zhu-yi-shi-zi-ben-zhu-yi-de-zui-gao-jie-duan.html', author: '列宁', authorKey: 'lenin', year: '1916', priority: '5', category: '政治经济学', keywords: ['帝国主义', '垄断资本主义', '列宁', '资本主义发展', '殖民'] },
    // 四星 - 毛泽东（补充）
    { title: '论十大关系', file: 'articles/Mao/lun-shi-da-guan-xi.html', author: '毛泽东', authorKey: 'mao', year: '1956', priority: '4', category: '政治理论', keywords: ['十大关系', '社会主义建设', '中国', '1956', '工业化'] },
];

// ------ 2. 文艺视频索引 ------
const galleryIndex = [
    // 经典影视
    { title: '大型音乐舞蹈史诗《东方红》', file: 'gallery/videos.html', type: 'video', category: '经典影视', year: '1965', keywords: ['东方红', '歌舞', '革命史诗', '国庆', '经典'] },
    { title: '电影《列宁在十月》', file: 'gallery/videos.html', type: 'video', category: '经典影视', year: '1937', keywords: ['列宁', '十月革命', '苏联电影', '历史影片'] },
    { title: '电影《列宁在1918》', file: 'gallery/videos.html', type: 'video', category: '经典影视', year: '1939', keywords: ['列宁', '苏维埃', '保卫革命', '苏联电影'] },
    { title: '《大决战》系列', file: 'gallery/videos.html', type: 'video', category: '经典影视', year: '1991', keywords: ['大决战', '辽沈战役', '淮海战役', '平津战役', '解放战争', '战争'] },
    { title: '【白噪音】跟列宁一起学习', file: 'gallery/videos.html', type: 'video', category: '趣味视频', year: '', keywords: ['白噪音', '列宁', '学习', '氛围', '专注'] },
    // 笔者推荐
    { title: '【补档】坦坦荡荡', file: 'gallery/videos.html', type: 'video', category: '趣味视频', year: '', keywords: ['坦坦荡荡', '理直气壮', '视频'] },
    { title: '【雷锋】"光阴啊..."', file: 'gallery/videos.html', type: 'video', category: '趣味视频', year: '', keywords: ['雷锋', '感人', '剪辑', '光阴'] },
    { title: '社会的本质是弱肉强食？放屁', file: 'gallery/videos.html', type: 'video', category: '视频', year: '', keywords: ['弱肉强食', '反驳', '阶级', '批判'] },
    { title: '社会主义苏式美学海报', file: 'gallery/videos.html', type: 'video', category: '趣味视频', year: '', keywords: ['苏式美学', '海报', '苏联', '美术'] },
    { title: '"麦子在垄上熟几十个暑和寒"', file: 'gallery/videos.html', type: 'video', category: '趣味视频', year: '', keywords: ['麦子', '井冈山', '视频', '革命'] },
    { title: '"柏林大墙东"历史的必然', file: 'gallery/videos.html', type: 'video', category: '趣味视频', year: '', keywords: ['柏林墙', '东德', '历史', '社会主义'] },
    // 正名视频
    { title: '讲集体化还耍春秋笔法？', file: 'gallery/videos.html', type: 'video', category: '正名视频', year: '', keywords: ['集体化', '人民公社', '农业', '正名', '经济'] },
    { title: '乌克兰大饥荒的历史真相', file: 'gallery/videos.html', type: 'video', category: '正名视频', year: '', keywords: ['乌克兰', '大饥荒', '苏联', '正名', '天灾'] },
    // 音乐
    { title: '国际歌', file: 'gallery/music.html', type: 'music', category: '革命歌曲', year: '1888', keywords: ['国际歌', '革命', '歌曲', '音乐', '全世界'] },
    { title: '东方红', file: 'gallery/music.html', type: 'music', category: '革命歌曲', year: '1943', keywords: ['东方红', '毛主席', '歌曲', '颂歌', '音乐'] },
    { title: '义勇军进行曲', file: 'gallery/music.html', type: 'music', category: '革命歌曲', year: '1935', keywords: ['义勇军', '国歌', '歌曲', '抗日', '音乐'] },
    { title: '牢不可破的联盟', file: 'gallery/music.html', type: 'music', category: '苏联歌曲', year: '1944', keywords: ['苏联国歌', '苏维埃', '联盟', '音乐', '苏联'] },
    { title: '歌唱祖国', file: 'gallery/music.html', type: 'music', category: '革命歌曲', year: '1950', keywords: ['歌唱祖国', '五星红旗', '歌曲', '音乐'] },
    { title: '华沙曲', file: 'gallery/music.html', type: 'music', category: '革命歌曲', year: '1905', keywords: ['华沙曲', '俄国', '革命', '音乐'] },
    { title: '打靶归来', file: 'gallery/music.html', type: 'music', category: '革命歌曲', year: '', keywords: ['打靶归来', '日落西山', '解放军', '歌曲', '音乐'] },
    { title: '咱们工人有力量', file: 'gallery/music.html', type: 'music', category: '革命歌曲', year: '', keywords: ['工人', '力量', '劳动', '歌曲', '音乐'] },
    { title: '社会主义好', file: 'gallery/music.html', type: 'music', category: '革命歌曲', year: '', keywords: ['社会主义好', '歌曲', '音乐', '建设'] },
    // 宣传画
    { title: '中国宣传画', file: 'gallery/propaganda.html', type: 'poster', category: '宣传画', year: '', keywords: ['宣传画', '海报', '美术', '文艺', '革命画'] },
    { title: '苏联海报', file: 'gallery/soviet.html', type: 'poster', category: '苏联美术', year: '', keywords: ['苏联', '海报', '美术', '社会主义', '文艺'] },
];

// ------ 3. 正名文章索引 ------
const rectifyIndex = [
    // 领导人正名
    {
        title: '历史的审判台：苏联七十年兴亡再思考',
        file: 'rectify/leaders/stalin-era.html',
        type: 'rectify',
        category: '领导人正名',
        summary: '驳斥"生于不义，死于耻辱"的简化叙事，深入苏联七十年兴亡的结构性困境，还原大清洗真实数据、1991年公投真相。',
        keywords: ['斯大林', '苏联', '大清洗', '正名', '苏联解体', '七十年', '历史']
    },
    {
        title: '高尔基与列宁决裂，因为列宁滥杀知识分子、破坏文化？',
        file: 'rectify/leaders/gorky-lenin.html',
        type: 'rectify',
        category: '领导人正名',
        summary: '解析列宁与高尔基决裂的真正根源：两种革命路线的碰撞，驳斥列宁"摧毁文化"之说。',
        keywords: ['列宁', '高尔基', '知识分子', '正名', '决裂', '文化', '暴君']
    },
    // 军事行动正名
    {
        title: '苏联攻打芬兰是侵略？过当防卫！',
        file: 'rectify/military/finland-war.html',
        type: 'rectify',
        category: '军事行动正名',
        summary: '1939年苏芬战争的真相：芬兰白卫军的反苏挑衅、列宁格勒的安全威胁、苏联的自卫反击。',
        keywords: ['苏芬战争', '芬兰', '苏联', '自卫', '正名', '军事', '侵略', '列宁格勒']
    },
    {
        title: '苏联"入侵"阿富汗？还原1979年出兵决策的真实逻辑',
        file: 'rectify/military/soviet-afghanistan.html',
        type: 'rectify',
        category: '军事行动正名',
        summary: '解密档案揭示：苏联最初三次拒绝出兵；美国在苏军入境前五个月已秘密扶植反政府武装。',
        keywords: ['阿富汗', '苏联', '1979', '出兵', '正名', '军事', '美国', '入侵']
    },
    // 经济模式正名
    {
        title: '农业集体化的历史再评价',
        file: 'rectify/economy/soviet-agriculture.html',
        type: 'rectify',
        category: '经济模式正名',
        summary: '重新评价苏联农业集体化政策的历史必要性与实际成就，驳斥单纯否定的叙事。',
        keywords: ['集体化', '苏联农业', '经济', '正名', '人民公社', '农村', '集体农庄']
    },
    // 思想辩护
    {
        title: '"人性本善"还是阶级分析——批判人性论',
        file: 'rectify/myths/human-nature.html',
        type: 'rectify',
        category: '思想辩护',
        summary: '批判"人性自私"等形而上学观点，以唯物辩证法还原人的社会本质。',
        keywords: ['人性论', '人性', '阶级', '唯物主义', '正名', '批判', '自私']
    },
    {
        title: '精英智慧——革命需要精英领导？',
        file: 'rectify/myths/wisdom-of-elites.html',
        type: 'rectify',
        category: '思想辩护',
        summary: '破除"精英主义"迷信，从群众史观出发批判精英治理论。',
        keywords: ['精英', '群众', '领导', '正名', '精英主义', '群众路线', '智慧']
    },
];

// ------ 4. 历史大事件索引（动态从 historyData 构建，若已加载） ------
// 这部分在 performSearch 中动态引用 historyData

// ============================================================
// 全局筛选状态
// ============================================================
let currentFilters = {
    authors: [],
    categories: [],
    priorities: []
};

function updateFilters(author) {
    if (author) {
        const idx = currentFilters.authors.indexOf(author);
        if (idx === -1) currentFilters.authors.push(author);
        else currentFilters.authors.splice(idx, 1);
    }
}

function resetFilters() {
    currentFilters = { authors: [], categories: [], priorities: [] };
}

// ============================================================
// 执行搜索
// ============================================================
function performSearch() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    const resultsContainer = document.getElementById('searchResults');

    if (!query) {
        resultsContainer.innerHTML = '';
        resultsContainer.classList.remove('active');
        return;
    }

    const allResults = [];

    // ---- 搜索经典文章 ----
    let filteredArticles = articleIndex;
    if (currentFilters.authors.length > 0)
        filteredArticles = filteredArticles.filter(i => currentFilters.authors.includes(i.authorKey));
    if (currentFilters.priorities.length > 0)
        filteredArticles = filteredArticles.filter(i => currentFilters.priorities.includes(i.priority));

    filteredArticles.forEach(item => {
        const text = [item.title, item.author, item.category, item.year, item.keywords.join(' ')].join(' ').toLowerCase();
        if (text.includes(query)) {
            allResults.push({ _type: 'article', _score: item.priority === '5' ? 3 : 2, ...item });
        }
    });

    // ---- 搜索文艺内容 ----
    galleryIndex.forEach(item => {
        const text = [item.title, item.category, item.year || '', item.keywords.join(' ')].join(' ').toLowerCase();
        if (text.includes(query)) {
            allResults.push({ _type: 'gallery', _score: 1, ...item });
        }
    });

    // ---- 搜索正名文章 ----
    rectifyIndex.forEach(item => {
        const text = [item.title, item.category, item.summary, item.keywords.join(' ')].join(' ').toLowerCase();
        if (text.includes(query)) {
            allResults.push({ _type: 'rectify', _score: 2, ...item });
        }
    });

    // ---- 搜索历史大事件 ----
    const eventResults = [];
    if (typeof historyData !== 'undefined') {
        Object.values(historyData).forEach(monthEvents => {
            monthEvents.forEach(event => {
                const text = [event.title, event.desc, event.date, String(event.year), event.category || ''].join(' ').toLowerCase();
                if (text.includes(query)) {
                    eventResults.push({
                        _type: 'event',
                        _score: 1,
                        title: event.title,
                        year: String(event.year),
                        date: event.date,
                        desc: event.desc,
                        nature: event.nature,
                        category: event.category || 'neutral',
                        file: 'international/international-calendar.html'
                    });
                }
            });
        });
        // 最多显示 5 条历史事件，按年份倒序
        eventResults.sort((a, b) => parseInt(b.year) - parseInt(a.year));
        allResults.push(...eventResults.slice(0, 5));
    }

    // 按 _score 降序、_type:article 优先排序
    allResults.sort((a, b) => b._score - a._score);

    // ---- 渲染结果 ----
    if (allResults.length === 0) {
        resultsContainer.innerHTML = `
            <div class="search-no-results">
                <div style="font-size:2rem;margin-bottom:8px;">🔍</div>
                <div style="font-weight:600;margin-bottom:6px;">暂无结果</div>
                <div style="font-size:0.9em;color:#999;">或许你搜索错了，或许笔者还未施工</div>
                <div style="margin-top:12px;font-size:0.85em;color:#aaa;">建议尝试：简化关键词 · 不同作者 · 不同分类</div>
            </div>`;
        resultsContainer.classList.add('active');
        return;
    }

    // 统计各类数量
    const counts = { article: 0, gallery: 0, rectify: 0, event: 0 };
    allResults.forEach(r => counts[r._type]++);
    const summaryParts = [];
    if (counts.article) summaryParts.push(`文章 ${counts.article}`);
    if (counts.gallery) summaryParts.push(`文艺 ${counts.gallery}`);
    if (counts.rectify) summaryParts.push(`正名 ${counts.rectify}`);
    if (counts.event) summaryParts.push(`大事件 ${counts.event}`);

    let html = `<div class="search-results-header">共找到 ${allResults.length} 条结果（${summaryParts.join(' · ')}）</div>`;
    html += '<div class="search-results-list">';

    allResults.forEach(item => {
        if (item._type === 'article') {
            html += renderArticleResult(item);
        } else if (item._type === 'gallery') {
            html += renderGalleryResult(item);
        } else if (item._type === 'rectify') {
            html += renderRectifyResult(item);
        } else if (item._type === 'event') {
            html += renderEventResult(item);
        }
    });

    html += '</div>';
    resultsContainer.innerHTML = html;
    resultsContainer.classList.add('active');
}

// ============================================================
// 各类结果卡片渲染
// ============================================================
const categoryColors = {
    '哲学基础': '#8b0000', '政治理论': '#1a237e', '军事战略': '#1b5e20',
    '政治经济学': '#e65100', '党的建设': '#6a1b9a', '思想文化': '#00695c'
};

function renderArticleResult(item) {
    const priorityClass = item.priority === '5' ? 'priority-5' : 'priority-4';
    const stars = item.priority === '5' ? '⭐⭐⭐⭐⭐' : '⭐⭐⭐⭐';
    const catColor = categoryColors[item.category] || '#666';
    return `
        <div class="search-result-item ${priorityClass}">
            <div class="result-header">
                <span class="result-priority">${stars}</span>
                <span class="result-year">${item.year}年</span>
                <span class="result-category" style="background:${catColor}20;color:${catColor};border:1px solid ${catColor}40;">${item.category}</span>
                <span class="result-type-tag" style="background:#f3f3f3;color:#888;font-size:0.75em;padding:2px 7px;border-radius:3px;">📖 文章</span>
            </div>
            <h4 class="result-title"><a href="${item.file}">${item.title}</a></h4>
            <p class="result-meta">${item.author}</p>
            <p class="result-keywords">关键词：${item.keywords.slice(0, 4).join('、')}</p>
        </div>`;
}

function renderGalleryResult(item) {
    const typeIcon = { video: '🎬', music: '🎵', poster: '🖼️' }[item.type] || '🎨';
    const typeName = { video: '视频', music: '音乐', poster: '宣传画' }[item.type] || '文艺';
    const yearStr = item.year ? item.year + '年' : '';
    return `
        <div class="search-result-item" style="border-left:3px solid #c41e3a;">
            <div class="result-header">
                <span class="result-type-tag" style="background:#fff0f3;color:#c41e3a;font-size:0.8em;padding:2px 8px;border-radius:3px;font-weight:600;">${typeIcon} ${typeName}</span>
                <span class="result-year" style="color:#888;font-size:0.85em;">${item.category}${yearStr ? ' · ' + yearStr : ''}</span>
            </div>
            <h4 class="result-title"><a href="${item.file}">${item.title}</a></h4>
            <p class="result-keywords" style="margin:0;font-size:0.8em;color:#999;">关键词：${item.keywords.slice(0, 4).join('、')}</p>
        </div>`;
}

function renderRectifyResult(item) {
    return `
        <div class="search-result-item" style="border-left:3px solid #1565c0;">
            <div class="result-header">
                <span class="result-type-tag" style="background:#e3f2fd;color:#1565c0;font-size:0.8em;padding:2px 8px;border-radius:3px;font-weight:600;">⚖️ 正名</span>
                <span class="result-year" style="color:#888;font-size:0.85em;">${item.category}</span>
            </div>
            <h4 class="result-title"><a href="${item.file}">${item.title}</a></h4>
            <p class="result-meta" style="font-size:0.88em;color:#555;margin:4px 0;">${item.summary}</p>
            <p class="result-keywords" style="margin:0;font-size:0.8em;color:#999;">关键词：${item.keywords.slice(0, 4).join('、')}</p>
        </div>`;
}

function renderEventResult(item) {
    const natureColor = { positive: '#2e7d32', negative: '#b71c1c', neutral: '#e65100' }[item.nature] || '#555';
    const natureIcon = { positive: '✓', negative: '✗', neutral: '•' }[item.nature] || '•';
    return `
        <div class="search-result-item" style="border-left:3px solid ${natureColor};">
            <div class="result-header">
                <span class="result-type-tag" style="background:#fff8e1;color:#f57f17;font-size:0.8em;padding:2px 8px;border-radius:3px;font-weight:600;">📅 大事件</span>
                <span class="result-year" style="color:#e6a817;font-weight:bold;font-size:0.88em;">${item.year}年 · ${item.date}</span>
                <span style="color:${natureColor};font-size:0.85em;font-weight:bold;">${natureIcon}</span>
            </div>
            <h4 class="result-title"><a href="${item.file}">${item.title}</a></h4>
            <p class="result-meta" style="font-size:0.88em;color:#555;margin:4px 0;">${item.desc}</p>
        </div>`;
}

// ============================================================
// 兼容筛选同步（articles.html 页面）
// ============================================================
function syncFiltersFromPage() {
    const authorBtns = document.querySelectorAll('.filter-btn[data-filter]');
    const priorityBtns = document.querySelectorAll('.filter-btn[data-priority]');
    currentFilters.authors = [];
    currentFilters.priorities = [];
    authorBtns.forEach(btn => {
        if (btn.classList.contains('active')) {
            const f = btn.dataset.filter;
            if (['mao', 'lenin', 'marx', 'stalin', 'engels'].includes(f))
                currentFilters.authors.push(f);
        }
    });
    priorityBtns.forEach(btn => {
        if (btn.classList.contains('active')) {
            const p = btn.dataset.priority;
            if (['5', '4', '3'].includes(p)) currentFilters.priorities.push(p);
        }
    });
}

// ============================================================
// 事件绑定
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    // 回车搜索
    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            if (typeof syncFiltersFromPage === 'function') syncFiltersFromPage();
            performSearch();
        }
    });

    // 实时搜索（300ms 防抖）
    searchInput.addEventListener('input', debounce(function () {
        if (typeof syncFiltersFromPage === 'function') syncFiltersFromPage();
        performSearch();
    }, 300));

    // 点击空白关闭
    document.addEventListener('click', function (e) {
        const si = document.getElementById('searchInput');
        const rc = document.getElementById('searchResults');
        if (si && rc && !si.contains(e.target) && !rc.contains(e.target)) {
            rc.classList.remove('active');
        }
    });
});

// 防抖工具
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
