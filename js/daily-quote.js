/**
 * 今日语录 — 每日随机展示一则经典语录
 * 使用日期作为种子，同一天所有访客看到同一条
 * 依赖：需在页面中预留 <div class="daily-quote-container" id="dailyQuote"></div>
 */
(function() {
    'use strict';

    var DAILY_QUOTES = [
        { text: '一个幽灵，共产主义的幽灵，在欧洲游荡。', source: '马克思、恩格斯《共产党宣言》（1848）', cat: 'marx' },
        { text: '哲学家们只是用不同的方式解释世界，而问题在于改变世界。', source: '马克思《关于费尔巴哈的提纲》（1845）', cat: 'marx' },
        { text: '全世界无产者，联合起来！', source: '马克思、恩格斯《共产党宣言》（1848）', cat: 'marx' },
        { text: '资本来到世间，从头到脚，每个毛孔都滴着血和肮脏的东西。', source: '马克思《资本论》第一卷（1867）', cat: 'marx' },
        { text: '工人没有祖国。', source: '马克思、恩格斯《共产党宣言》（1848）', cat: 'marx' },
        { text: '没有革命的理论，就不会有革命的运动。', source: '列宁《怎么办？》（1902）', cat: 'lenin' },
        { text: '帝国主义是资本主义的最高阶段。', source: '列宁《帝国主义是资本主义的最高阶段》（1916）', cat: 'lenin' },
        { text: '国家是阶级矛盾不可调和的产物。', source: '列宁《国家与革命》（1917）', cat: 'lenin' },
        { text: '共产主义就是苏维埃政权加全国电气化。', source: '列宁（1920）', cat: 'lenin' },
        { text: '无产阶级专政不是为永远维持下去的，它只是过渡到无阶级社会所必需的阶段。', source: '列宁《国家与革命》（1917）', cat: 'lenin' },
        { text: '落后就要挨打。我们必须在十年内跑完这段距离，或者我们就被人家打倒。', source: '斯大林（1931）', cat: 'stalin' },
        { text: '干部决定一切！', source: '斯大林（1935）', cat: 'stalin' },
        { text: '星星之火，可以燎原。', source: '毛泽东《星星之火，可以燎原》（1930）', cat: 'mao' },
        { text: '枪杆子里出政权。', source: '毛泽东八七会议讲话（1927）', cat: 'mao' },
        { text: '为人民服务。', source: '毛泽东《为人民服务》（1944）', cat: 'mao' },
        { text: '一切反动派都是纸老虎。', source: '毛泽东与斯特朗谈话（1946）', cat: 'mao' },
        { text: '没有调查，就没有发言权。', source: '毛泽东《反对本本主义》（1930）', cat: 'mao' },
        { text: '从群众中来，到群众中去。', source: '毛泽东《关于领导方法的若干问题》（1943）', cat: 'mao' },
        { text: '战略上要藐视敌人，战术上要重视敌人。', source: '毛泽东', cat: 'mao' },
        { text: '百花齐放，百家争鸣。', source: '毛泽东（1956）', cat: 'mao' },
        { text: '领导我们事业的核心力量是中国共产党。指导我们思想的理论基础是马克思列宁主义。', source: '毛泽东第一届全国人大开幕词（1954）', cat: 'mao' },
        { text: '人的正确思想是从哪里来的？只能从社会的生产斗争、阶级斗争和科学实验这三项实践中来。', source: '毛泽东《人的正确思想是从那里来的？》（1963）', cat: 'mao' },
        { text: '不同质的矛盾，只有用不同的方法才能解决。', source: '毛泽东《关于正确处理人民内部矛盾的问题》（1957）', cat: 'mao' },
        { text: '战争的伟力之最深厚的根源，存在于民众之中。', source: '毛泽东《论持久战》（1938）', cat: 'mao' },
        { text: '读书是学习，使用也是学习，而且是更重要的学习。', source: '毛泽东《中国革命战争的战略问题》（1936）', cat: 'mao' },
        { text: '我们需要的是热烈而镇定的情绪，紧张而有秩序的工作。', source: '毛泽东《中国革命战争的战略问题》（1936）', cat: 'mao' },
        { text: '优势而无准备，不是真正的优势，也没有主动。', source: '毛泽东《论持久战》（1938）', cat: 'mao' },
        { text: '以马克思列宁主义的理论思想武装起来的中国共产党，在中国人民中产生了新的工作作风。', source: '毛泽东《论联合政府》（1945）', cat: 'mao' },
        { text: '指导一个伟大的革命运动的政党，如果没有革命理论，没有历史知识，没有对于实际运动的深刻的了解，要取得胜利是不可能的。', source: '毛泽东《中国共产党在民族战争中的地位》（1938）', cat: 'mao' },
        { text: '我们的原则是党指挥枪，而决不容许枪指挥党。', source: '毛泽东《战争和战略问题》（1938）', cat: 'mao' }
    ];

    // 日期种子 → 稳定的每日索引
    function getDailyIndex() {
        var now = new Date();
        var seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
        // 简单哈希：取模前先打散
        var hash = ((seed * 2654435761) >>> 0) % DAILY_QUOTES.length;
        return hash;
    }

    // 类别色
    var catColors = {
        marx:   { border: '#8b0000', bg: 'linear-gradient(135deg, #8b0000, #a31515)' },
        engels: { border: '#4a5568', bg: 'linear-gradient(135deg, #4a5568, #5a6578)' },
        lenin:  { border: '#d4a017', bg: 'linear-gradient(135deg, #d4a017, #b8860b)' },
        stalin: { border: '#744210', bg: 'linear-gradient(135deg, #744210, #8b5a2b)' },
        mao:    { border: '#c41e3a', bg: 'linear-gradient(135deg, #c41e3a, #8b0000)' }
    };

    function renderQuote(container, quote, index, total) {
        var colors = catColors[quote.cat] || catColors['mao'];
        container.style.background = colors.bg;
        container.style.borderLeftColor = colors.border;

        var dateStr = new Date().getFullYear() + '年' + (new Date().getMonth() + 1) + '月' + new Date().getDate() + '日';
        container.innerHTML =
            '<div class="daily-quote-inner">' +
                '<div class="daily-quote-label">📜 今日语录 <span class="daily-quote-date">' + dateStr + '</span></div>' +
                '<blockquote class="daily-quote-text">' + escapeHTML(quote.text) + '</blockquote>' +
                '<cite class="daily-quote-source">—— ' + escapeHTML(quote.source) + '</cite>' +
                '<div class="daily-quote-footer">' +
                    '<span class="daily-quote-counter">#' + (index + 1) + ' / ' + total + '</span>' +
                    '<a href="gallery/quotes.html" class="daily-quote-more">查看全部语录 →</a>' +
                '</div>' +
            '</div>';
    }

    function escapeHTML(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    function initDailyQuote() {
        var containers = document.querySelectorAll('.daily-quote-container');
        if (containers.length === 0) return;

        var index = getDailyIndex();
        var quote = DAILY_QUOTES[index];

        for (var i = 0; i < containers.length; i++) {
            renderQuote(containers[i], quote, index, DAILY_QUOTES.length);
        }
    }

    // DOM 就绪后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDailyQuote);
    } else {
        initDailyQuote();
    }
})();
