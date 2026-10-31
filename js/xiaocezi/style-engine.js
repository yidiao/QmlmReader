// ============================================================
// 风格引擎：切换风格 = 改 body 的 data-style 属性
// 风格 CSS 用 body[data-style] 作用域，切换只改属性、不动内容。
// ============================================================
(function () {
    var sw = document.getElementById('xc-style-switch');
    if (!sw) return;

    function applyStyle(name) {
        document.body.setAttribute('data-style', name);
        sw.querySelectorAll('.xc-style-btn').forEach(function (btn) {
            btn.classList.toggle('active', btn.dataset.style === name);
        });
    }

    sw.addEventListener('click', function (e) {
        var btn = e.target.closest('.xc-style-btn');
        if (btn) applyStyle(btn.dataset.style);
    });

    applyStyle('mimeo');
})();
