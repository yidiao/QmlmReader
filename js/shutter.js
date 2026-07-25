/**
 * 百叶窗轮播 — 垂直叶片 Y轴翻转效果
 * 16 片叶片，顺序翻转过渡，5秒自动轮播
 */
(function() {
    var NUM_BLADES = 16;
    var AUTO_MS = 7000;
    var BLADE_FLIP_MS = 550;

    // 8 张卡片：渐变背景 + 标题文字（无外部图片依赖）
    var carouselItems = [
        {
            title: '实践论',
            subtitle: '毛泽东 · 1937',
            link: 'articles/Mao/shi-jian-lun.html',
            gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            emoji: '📖'
        },
        {
            title: '矛盾论',
            subtitle: '毛泽东 · 1937',
            link: 'articles/Mao/mao-dun-lun.html',
            gradient: 'linear-gradient(135deg, #2d1b00 0%, #5c2d00 50%, #8b4513 100%)',
            emoji: '⚡'
        },
        {
            title: '共产党宣言',
            subtitle: '马克思·恩格斯 · 1848',
            link: 'articles/Marx/gongchan-dan-yuan.html',
            gradient: 'linear-gradient(135deg, #3d0000 0%, #8b0000 50%, #c41e3a 100%)',
            emoji: '🚩'
        },
        {
            title: '国家与革命',
            subtitle: '列宁 · 1917',
            link: 'articles/Lenin/guo-jia-yu-ge-ming.html',
            gradient: 'linear-gradient(135deg, #1a0033 0%, #4a0e6b 50%, #7b1fa2 100%)',
            emoji: '🏛️'
        },
        {
            title: '论持久战',
            subtitle: '毛泽东 · 1938',
            link: 'articles/Mao/lun-chi-jiu-zhan.html',
            gradient: 'linear-gradient(135deg, #002b1a 0%, #004d2e 50%, #006644 100%)',
            emoji: '⚔️'
        },
        {
            title: '铁流与先锋',
            subtitle: '专栏 · 中俄革命史',
            link: 'international/international-column/tieliu-yu-xianfeng.html',
            gradient: 'linear-gradient(135deg, #1a1a1a 0%, #333 50%, #555 100%)',
            emoji: '🔨'
        },
        {
            title: '历史的审判台',
            subtitle: '正名 · 斯大林时代',
            link: 'rectify/leaders/stalin-era.html',
            gradient: 'linear-gradient(135deg, #330000 0%, #660000 50%, #990000 100%)',
            emoji: '⚖️'
        },
        {
            title: '帝国主义论',
            subtitle: '列宁 · 1916',
            link: 'articles/Lenin/di-guo-zhu-yi-shi-zi-ben-zhu-yi-de-zui-gao-jie-duan.html',
            gradient: 'linear-gradient(135deg, #000033 0%, #000066 50%, #000099 100%)',
            emoji: '🌍'
        }
    ];

    // 随机打乱卡片顺序
    function shuffle(arr) {
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
        }
    }
    shuffle(carouselItems);

    var currentIndex = 0;
    var isAnimating = false;
    var autoTimer = null;
    var initialized = false; // 防止重复初始化

    var container = document.getElementById('shutterCarousel');
    var bladesEl = document.getElementById('shutterContainer');
    var dotsEl = document.getElementById('shutterDots');
    if (!container || !bladesEl) return;

    function buildBlades() {
        bladesEl.innerHTML = '';
        for (var i = 0; i < NUM_BLADES; i++) {
            var blade = document.createElement('div');
            blade.className = 'shutter-blade';

            var inner = document.createElement('div');
            inner.className = 'blade-inner';
            inner.style.setProperty('--i', i);

            var front = document.createElement('div');
            front.className = 'blade-face';

            var back = document.createElement('div');
            back.className = 'blade-back-face';

            inner.appendChild(front);
            inner.appendChild(back);
            blade.appendChild(inner);
            bladesEl.appendChild(blade);
        }
    }

    function buildDots() {
        dotsEl.innerHTML = '';
        for (var i = 0; i < carouselItems.length; i++) {
            var dot = document.createElement('button');
            dot.className = 'shutter-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', carouselItems[i].title);
            dot.addEventListener('click', (function(idx) {
                return function(e) {
                    e.stopPropagation();
                    goToSlide(idx);
                };
            })(i));
            dotsEl.appendChild(dot);
        }
    }

    // 用 Canvas 预渲染卡片图片（渐变 + 文字），切割到每个叶片
    function renderCardImage(item) {
        var w = 900;
        var h = Math.round(w * 9 / 16); // 16:9
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');

        // 背景渐变
        var grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, '#1a1a1a');
        grad.addColorStop(0.5, '#333');
        grad.addColorStop(1, '#1a1a1a');
        // 使用 item 的渐变方向
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, w, h);

        // 绘制装饰条纹
        ctx.fillStyle = 'rgba(196,30,58,0.12)';
        for (var x = 0; x < w; x += 60) {
            ctx.fillRect(x, 0, 2, h);
        }

        // 左上角大号 emoji
        ctx.font = '120px serif';
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.textAlign = 'center';
        ctx.fillText(item.emoji, w * 0.25, h * 0.55);

        // 红色装饰线
        ctx.fillStyle = '#c41e3a';
        ctx.fillRect(w * 0.12, h * 0.42, 60, 4);

        // 标题
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 52px "STSong","SimSun","Noto Serif SC",serif';
        ctx.textAlign = 'left';
        ctx.fillText(item.title, w * 0.12, h * 0.48);

        // 副标题
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '20px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
        ctx.fillText(item.subtitle, w * 0.12, h * 0.58);

        // 右下角装饰圆
        ctx.strokeStyle = 'rgba(196,30,58,0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(w * 0.85, h * 0.7, 80, 0, Math.PI * 2);
        ctx.stroke();

        return canvas.toDataURL('image/jpeg', 0.85);
    }

    // 预渲染所有卡片
    var cardImages = [];
    function prerenderAll() {
        cardImages = carouselItems.map(function(item) {
            return renderCardImage(item);
        });
    }

    function setBladeFaces(imgDataUrl, isBack) {
        var blades = bladesEl.querySelectorAll('.shutter-blade');
        var bw = 100 / (NUM_BLADES - 1);
        blades.forEach(function(blade, i) {
            var inner = blade.querySelector('.blade-inner');
            var face = isBack ? inner.querySelector('.blade-back-face') : inner.querySelector('.blade-face');
            face.style.backgroundImage = 'url(' + imgDataUrl + ')';
            face.style.backgroundSize = (NUM_BLADES * 100) + '% 100%';
            face.style.backgroundPosition = (i * bw) + '% 50%';
        });
    }

    function goToSlide(index) {
        if (isAnimating || index === currentIndex) return;
        isAnimating = true;

        var prevIndex = currentIndex;
        currentIndex = index;

        // 新图放到背面
        setBladeFaces(cardImages[index], true);

        // 翻转所有叶片
        var inners = bladesEl.querySelectorAll('.blade-inner');
        inners.forEach(function(inner) {
            inner.classList.add('flipped');
        });

        // 动画完成后重置
        setTimeout(function() {
            // 把新图放到正面
            setBladeFaces(cardImages[index], false);
            inners.forEach(function(inner) {
                inner.classList.remove('flipped');
                void inner.offsetWidth; // reflow to reset
            });
            updateDots();
            isAnimating = false;
            resetAuto();
        }, BLADE_FLIP_MS + NUM_BLADES * 40 + 50);
    }

    function advanceNext() {
        var next = (currentIndex + 1) % carouselItems.length;
        goToSlide(next);
    }

    function updateDots() {
        var dots = dotsEl.querySelectorAll('.shutter-dot');
        dots.forEach(function(d, i) {
            d.classList.toggle('active', i === currentIndex);
        });
    }

    function resetAuto() {
        if (autoTimer) clearTimeout(autoTimer);
        autoTimer = setTimeout(advanceNext, AUTO_MS);
    }

    // 点击跳转
    bladesEl.addEventListener('click', function() {
        var item = carouselItems[currentIndex];
        if (item && item.link) {
            window.location.href = item.link;
        }
    });

    // 初始化
    prerenderAll();
    buildBlades();
    buildDots();
    setBladeFaces(cardImages[0], false);

    // 开屏动画结束后的回调
    function showCarousel() {
        if (initialized) return;
        initialized = true;
        container.classList.add('visible');
        resetAuto();
    }

    // 等待开屏动画结束（2.8s fade delay + 0.6s fade = 3.4s）
    var opening = document.getElementById('heroOpening');
    if (opening) {
        setTimeout(function() {
            if (opening && opening.parentNode) opening.remove();
            showCarousel();
        }, 3400);
    } else {
        showCarousel();
    }
})();
