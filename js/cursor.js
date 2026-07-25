/**
 * 自定义光标 — 红五星SVG / 镰刀锤头PNG（随机）+ CSS光辉跟随
 * 移动端自动禁用
 *
 * PNG 存放位置：images/icons/cursor/hammer-sickle.png（建议 72×72 或 96×96 px）
 */
(function() {
    if ('ontouchstart' in window || window.innerWidth <= 768) return;

    // 随机选择图标
    var isStar = Math.random() < 0.5;

    // 红五星 SVG（红底黄边）
    var starSVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36" height="36">' +
        '<polygon points="18,2 22,13 33,13 24.5,19.5 27.5,30 18,24 8.5,30 11.5,19.5 3,13 14,13" fill="#c41e3a" stroke="#ffd700" stroke-width="1.8" stroke-linejoin="round"/>' +
        '</svg>';

    // 光标容器
    var cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    cursor.style.cssText = 'position:fixed;width:36px;height:36px;pointer-events:none;z-index:10001;transform:translate(-50%,-50%);transition:width 0.2s,height 0.2s;filter:drop-shadow(0 0 8px rgba(255,215,0,0.6));';

    if (isStar) {
        // 红五星：直接用 SVG
        cursor.innerHTML = starSVG;
    } else {
        // 镰刀锤头：加载 PNG
        var path = window.location.pathname;
        var htmlIdx = path.indexOf('/html/');
        var relPath = htmlIdx >= 0 ? path.substring(htmlIdx + 6) : path;
        var depth = (relPath.match(/\//g) || []).length;
        var pngSrc = '../'.repeat(depth + 1) + 'images/icons/cursor/hammer-sickle.png';

        var img = document.createElement('img');
        img.src = pngSrc;
        img.width = 36;
        img.height = 36;
        img.style.cssText = 'display:block;width:36px;height:36px;object-fit:contain;';
        img.onerror = function() {
            img.style.display = 'none';
            glow.style.display = 'none';
            document.body.style.cursor = '';
        };
        cursor.appendChild(img);
    }

    document.body.appendChild(cursor);

    // 光辉元素
    var glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(glow);

    // 隐藏原生光标
    document.body.style.cursor = 'none';
    var styleEl = document.createElement('style');
    styleEl.textContent = 'a,button,input,textarea,select,[role="button"],[onclick],.clickable{cursor:none!important}';
    document.head.appendChild(styleEl);

    // 鼠标跟踪
    var mouseX = 0, mouseY = 0;
    document.addEventListener('mousemove', function(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursor.style.left = mouseX + 'px';
        cursor.style.top = mouseY + 'px';
        glow.style.left = mouseX + 'px';
        glow.style.top = mouseY + 'px';
    });

    // Hover 放大
    document.addEventListener('mouseover', function(e) {
        var el = e.target;
        if (el.closest('a, button, input, textarea, select, [role="button"], [onclick]')) {
            cursor.style.width = '44px';
            cursor.style.height = '44px';
            if (img) { img.style.width = '44px'; img.style.height = '44px'; }
        }
    });
    document.addEventListener('mouseout', function(e) {
        var el = e.target;
        if (el.closest('a, button, input, textarea, select, [role="button"], [onclick]')) {
            cursor.style.width = '36px';
            cursor.style.height = '36px';
            if (img) { img.style.width = '36px'; img.style.height = '36px'; }
        }
    });

    // 鼠标离开窗口时隐藏
    document.addEventListener('mouseleave', function() {
        cursor.style.opacity = '0';
        glow.style.opacity = '0';
    });
    document.addEventListener('mouseenter', function() {
        cursor.style.opacity = '1';
        glow.style.opacity = '1';
    });

    // 光标按下时缩小
    document.addEventListener('mousedown', function() {
        cursor.style.width = '30px';
        cursor.style.height = '30px';
        if (typeof img !== 'undefined') { img.style.width = '30px'; img.style.height = '30px'; }
    });
    document.addEventListener('mouseup', function() {
        cursor.style.width = '36px';
        cursor.style.height = '36px';
        if (typeof img !== 'undefined') { img.style.width = '36px'; img.style.height = '36px'; }
    });
})();
