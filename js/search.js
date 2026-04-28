// 文章搜索索引
const searchIndex = [
    // 五星文章 - 毛泽东
    { title: '论持久战', file: 'articles/lun-chi-jiu-zhan.html', author: '毛泽东', authorKey: 'mao', year: '1938', priority: '5', category: '军事战略', keywords: ['抗日战争', '持久战', '军事', '战略'] },
    { title: '实践论', file: 'articles/shi-jian-lun.html', author: '毛泽东', authorKey: 'mao', year: '1937', priority: '5', category: '哲学基础', keywords: ['认识论', '辩证法', '实践', '知行'] },
    { title: '矛盾论', file: 'articles/mao-dun-lun.html', author: '毛泽东', authorKey: 'mao', year: '1937', priority: '5', category: '哲学基础', keywords: ['辩证法', '矛盾', '对立统一', '主要矛盾'] },
    { title: '中国革命战争的战略问题', file: 'articles/zhan-lue-wen-ti.html', author: '毛泽东', authorKey: 'mao', year: '1936', priority: '5', category: '军事战略', keywords: ['革命战争', '战略', '游击战'] },
    { title: '抗日游击战争的战略问题', file: 'articles/you-ji-zhan.html', author: '毛泽东', authorKey: 'mao', year: '1938', priority: '5', category: '军事战略', keywords: ['游击战', '抗日', '战略地位'] },
    { title: '战争和战略问题', file: 'articles/zhan-zheng-zhan-lue.html', author: '毛泽东', authorKey: 'mao', year: '1938', priority: '5', category: '军事战略', keywords: ['武装斗争', '战略转变'] },
    { title: '新民主主义论', file: 'articles/xin-min-zhu.html', author: '毛泽东', authorKey: 'mao', year: '1940', priority: '5', category: '政治理论', keywords: ['新民主主义', '政治', '经济', '文化'] },
    { title: '在延安文艺座谈会上的讲话', file: 'articles/wen-yi-zuo-tan.html', author: '毛泽东', authorKey: 'mao', year: '1942', priority: '5', category: '思想文化', keywords: ['文艺', '文学', '为人民服务'] },
    { title: '学习和时局', file: 'articles/xue-xi-shi-ju.html', author: '毛泽东', authorKey: 'mao', year: '1944', priority: '5', category: '思想文化', keywords: ['学习', '时局', '精神解放'] },
    { title: '关于正确处理人民内部矛盾的问题', file: 'articles/ren-min-nei-bu-mao-dun.html', author: '毛泽东', authorKey: 'mao', year: '1957', priority: '5', category: '政治理论', keywords: ['人民内部矛盾', '敌我矛盾', '两类矛盾'] },
    // 五星文章 - 列宁
    { title: '怎么办？', file: 'articles/zen-me-ban.html', author: '列宁', authorKey: 'lenin', year: '1902', priority: '5', category: '党的建设', keywords: ['建党', '灌输论', '先锋队', '经济派'] },
    { title: '唯物主义和经验批判主义', file: 'articles/wei-wu-zhu-yi-he-jing-yan-pi-pan-zhu-yi.html', author: '列宁', authorKey: 'lenin', year: '1909', priority: '5', category: '哲学基础', keywords: ['认识论', '马赫主义', '辩证唯物主义'] },
    { title: '国家与革命', file: 'articles/guo-jia-yu-ge-ming.html', author: '列宁', authorKey: 'lenin', year: '1917', priority: '5', category: '政治理论', keywords: ['国家', '无产阶级专政', '打碎国家机器'] },
    // 五星文章 - 马克思恩格斯
    { title: '共产党宣言', file: 'articles/gongchan-dan-yuan.html', author: '马克思 · 恩格斯', authorKey: 'marx', year: '1848', priority: '5', category: '政治理论', keywords: ['科学社会主义', '阶级斗争', '无产阶级', '共产主义'] },
    // 五星文章 - 斯大林
    { title: '论列宁主义基础', file: 'articles/lun-lunen-zhu-yi-ji-chu.html', author: '斯大林', authorKey: 'stalin', year: '1924', priority: '5', category: '政治理论', keywords: ['列宁主义', '帝国主义', '无产阶级革命', '无产阶级专政'] },
    { title: '论中国革命的前途', file: 'articles/lun-zhongguo-ge-ming-de-qiantu.html', author: '斯大林', authorKey: 'stalin', year: '1926', priority: '5', category: '政治理论', keywords: ['中国革命', '农民问题', '无产阶级领导权', '非资本主义道路'] },
    // 四星文章
    { title: '湖南农民运动考察报告', file: 'articles/nong-min-yun-dong.html', author: '毛泽东', authorKey: 'mao', year: '1927', priority: '4', category: '政治理论', keywords: ['农民运动', '阶级分析', '农村'] },
];

// 全局筛选状态
let currentFilters = {
    authors: [],      // ['mao', 'lenin', 'marx', 'stalin']
    categories: [],   // ['哲学基础', '政治理论', '军事战略', '政治经济学', '党的建设', '思想文化']
    priorities: []     // ['5', '4']
};

// 更新筛选状态
function updateFilters(author, priority) {
    if (author) {
        const idx = currentFilters.authors.indexOf(author);
        if (idx === -1) {
            currentFilters.authors.push(author);
        } else {
            currentFilters.authors.splice(idx, 1);
        }
    }
}

// 重置筛选
function resetFilters() {
    currentFilters = { authors: [], categories: [], priorities: [] };
}

// 执行搜索
function performSearch() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    const resultsContainer = document.getElementById('searchResults');

    if (!query) {
        resultsContainer.innerHTML = '';
        resultsContainer.classList.remove('active');
        return;
    }

    // 根据筛选条件过滤索引
    let filteredIndex = searchIndex;

    // 作者筛选
    if (currentFilters.authors.length > 0) {
        filteredIndex = filteredIndex.filter(item => currentFilters.authors.includes(item.authorKey));
    }

    // 优先级筛选
    if (currentFilters.priorities.length > 0) {
        filteredIndex = filteredIndex.filter(item => currentFilters.priorities.includes(item.priority));
    }

    // 执行搜索
    const results = filteredIndex.filter(item => {
        const searchText = [
            item.title,
            item.author,
            item.category,
            item.year,
            item.keywords.join(' ')
        ].join(' ').toLowerCase();
        return searchText.includes(query);
    });

    // 显示结果
    if (results.length > 0) {
        let html = '<div class="search-results-header">找到 ' + results.length + ' 篇相关文章';

        // 显示当前筛选条件
        const activeFilters = [];
        if (currentFilters.authors.length > 0) {
            const authorNames = currentFilters.authors.map(a => {
                const names = { 'mao': '毛泽东', 'lenin': '列宁', 'marx': '马恩', 'stalin': '斯大林' };
                return names[a] || a;
            });
            activeFilters.push('作者：' + authorNames.join('、'));
        }
        if (currentFilters.priorities.length > 0) {
            const priorityNames = currentFilters.priorities.map(p => p === '5' ? '五星' : '四星');
            activeFilters.push('等级：' + priorityNames.join('、'));
        }
        if (activeFilters.length > 0) {
            html += ' <span class="filter-indicator">[' + activeFilters.join(', ') + ']</span>';
        }
        html += '</div>';

        html += '<div class="search-results-list">';

        results.forEach(item => {
            const priorityClass = item.priority === '5' ? 'priority-5' : 'priority-4';
            const priorityLabel = item.priority === '5' ? '⭐⭐⭐⭐⭐' : '⭐⭐⭐⭐';

            // 内容类型颜色
            const categoryColors = {
                '哲学基础': '#8b0000',
                '政治理论': '#1a237e',
                '军事战略': '#1b5e20',
                '政治经济学': '#e65100',
                '党的建设': '#6a1b9a',
                '思想文化': '#00695c'
            };
            const categoryColor = categoryColors[item.category] || '#666';

            html += `
                <div class="search-result-item ${priorityClass}">
                    <div class="result-header">
                        <span class="result-priority">${priorityLabel}</span>
                        <span class="result-year">${item.year}年</span>
                        <span class="result-category" style="background:${categoryColor}20;color:${categoryColor};border:1px solid ${categoryColor}40;">${item.category}</span>
                    </div>
                    <h4 class="result-title"><a href="${item.file}">${item.title}</a></h4>
                    <p class="result-meta">${item.author}</p>
                    <p class="result-keywords">关键词：${item.keywords.slice(0, 4).join('、')}</p>
                </div>
            `;
        });

        html += '</div>';
        resultsContainer.innerHTML = html;
    } else {
        // 空结果提示
        resultsContainer.innerHTML = `
            <div class="search-no-results">
                <div class="no-results-icon">🔍</div>
                <div class="no-results-title">暂无结果</div>
                <div class="no-results-hint">或许你搜索错了，或许笔者还未施工</div>
                <div class="no-results-suggest">
                    <p>建议尝试：</p>
                    <ul>
                        <li>简化关键词</li>
                        <li>检查拼写</li>
                        <li>尝试不同的作者或分类</li>
                        <li>浏览全部文章</li>
                    </ul>
                </div>
            </div>
        `;
    }

    resultsContainer.classList.add('active');
}

// 从articles.html页面获取当前筛选状态
function syncFiltersFromPage() {
    // 从articles.html的筛选按钮获取当前激活的筛选
    const authorBtns = document.querySelectorAll('.filter-btn[data-filter]');
    const priorityBtns = document.querySelectorAll('.filter-btn[data-priority]');

    currentFilters.authors = [];
    currentFilters.priorities = [];

    authorBtns.forEach(btn => {
        if (btn.classList.contains('active')) {
            const filter = btn.dataset.filter;
            if (['mao', 'lenin', 'marx', 'stalin'].includes(filter)) {
                currentFilters.authors.push(filter);
            }
        }
    });

    priorityBtns.forEach(btn => {
        if (btn.classList.contains('active')) {
            const priority = btn.dataset.priority;
            if (['5', '4'].includes(priority)) {
                currentFilters.priorities.push(priority);
            }
        }
    });
}

// 回车键搜索
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                // 在articles页面，同步筛选状态
                if (typeof syncFiltersFromPage === 'function') {
                    syncFiltersFromPage();
                }
                performSearch();
            }
        });

        // 输入时实时搜索（300ms防抖）
        searchInput.addEventListener('input', debounce(function() {
            if (typeof syncFiltersFromPage === 'function') {
                syncFiltersFromPage();
            }
            performSearch();
        }, 300));
    }

    // 点击空白处关闭搜索结果
    document.addEventListener('click', function(e) {
        const searchInput = document.getElementById('searchInput');
        const resultsContainer = document.getElementById('searchResults');

        if (searchInput && resultsContainer) {
            if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
                resultsContainer.classList.remove('active');
            }
        }
    });
});

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
