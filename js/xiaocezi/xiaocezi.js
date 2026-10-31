// ============================================================
// 小册子核心：Word 解析 → 结构映射 → 自写分页（按内容高度切 A5 页）
// 每页带页眉（书名）+ 页脚（页码）；封面/尾页整页无页眉页脚。
// ============================================================
(function () {
    var metaTitle = document.getElementById('xc-meta-title');
    var metaSubtitle = document.getElementById('xc-meta-subtitle');
    var metaAuthor = document.getElementById('xc-meta-author');
    var coverTitle = document.getElementById('xc-cover-title');
    var coverSubtitle = document.getElementById('xc-cover-subtitle');
    var coverAuthor = document.getElementById('xc-cover-author');

    var fileInput = document.getElementById('xc-file-input');
    var bodyContent = document.getElementById('xc-body-content');
    var prefaceSection = document.getElementById('xc-preface');
    var prefaceContent = document.getElementById('xc-preface-content');
    var tocList = document.getElementById('xc-toc-list');
    var pagesEl = document.getElementById('xc-pages');

    var SAVE_KEY = 'xiaocezi-state';

    var MM = 96 / 25.4;
    // A5 210mm - 页眉 11mm - 页脚 11mm - 内容上 padding 12mm（下 0）
    var CONTENT_H = (210 - 11 - 11 - 12) * MM;

    // ---- 分页 ----
    var renderTimer = null;
    function schedulePaginate() {
        clearTimeout(renderTimer);
        renderTimer = setTimeout(paginate, 200);
    }

    function paginate() {
        if (!pagesEl) return;
        pagesEl.innerHTML = '';
        var title = metaTitle ? (metaTitle.value || '') : '';
        var pageNum = 0;

        function renderPage(blocks, withChrome) {
            pageNum++;
            var page = document.createElement('div');
            page.className = 'xc-page';
            if (withChrome) {
                var hdr = document.createElement('div');
                hdr.className = 'xc-page-header';
                hdr.textContent = title || '　';
                page.appendChild(hdr);

                var cnt = document.createElement('div');
                cnt.className = 'xc-page-content xc-body-content';
                blocks.forEach(function (b) { cnt.appendChild(b.cloneNode(true)); });
                page.appendChild(cnt);

                var ftr = document.createElement('div');
                ftr.className = 'xc-page-footer';
                ftr.textContent = '— ' + pageNum + ' —';
                page.appendChild(ftr);
            } else {
                page.classList.add('xc-page-plain');
                blocks.forEach(function (b) {
                    var clone = b.cloneNode(true);
                    clone.classList.remove('xc-section');
                    clone.style.flex = '1';
                    page.appendChild(clone);
                });
            }
            pagesEl.appendChild(page);
        }

        // 封面（整页）
        var cover = document.querySelector('.xc-cover');
        if (cover) renderPage([cover], false);

        // 序言（分页）
        if (prefaceSection && prefaceSection.style.display !== 'none' && prefaceContent) {
            splitBlocks(Array.from(prefaceContent.children)).forEach(function (pb) {
                renderPage(pb, true);
            });
        }

        // 目录（分页）
        var toc = document.querySelector('.xc-toc');
        if (toc) {
            var tBlocks = [];
            var th = toc.querySelector('.xc-toc-heading');
            if (th) tBlocks.push(th);
            toc.querySelectorAll('.xc-toc-item').forEach(function (li) { tBlocks.push(li); });
            splitBlocks(tBlocks).forEach(function (pb) {
                renderPage(pb, true);
            });
        }

        // 正文（分页）
        if (bodyContent) {
            splitBlocks(Array.from(bodyContent.children)).forEach(function (pb) {
                renderPage(pb, true);
            });
        }

        // 尾页（整页）
        var back = document.querySelector('.xc-back');
        if (back) renderPage([back], false);
    }

    function splitBlocks(blocks) {
        if (!blocks || blocks.length === 0) return [];
        var heights = blocks.map(function (b, i) {
            if (i < blocks.length - 1) {
                return blocks[i + 1].offsetTop - b.offsetTop;
            }
            var mb = 0;
            try { mb = parseFloat(getComputedStyle(b).marginBottom) || 0; } catch (e) {}
            return b.offsetHeight + mb;
        });
        var pages = [], cur = [], curH = 0;
        for (var i = 0; i < blocks.length; i++) {
            if (cur.length > 0 && curH + heights[i] > CONTENT_H) {
                pages.push(cur);
                cur = [];
                curH = 0;
            }
            cur.push(blocks[i]);
            curH += heights[i];
        }
        if (cur.length > 0) pages.push(cur);
        return pages;
    }

    // ---- 元数据绑定 ----
    if (metaTitle) {
        metaTitle.addEventListener('input', function () {
            if (coverTitle) coverTitle.textContent = metaTitle.value || '未命名小册子';
            schedulePaginate();
        });
    }
    if (metaSubtitle && coverSubtitle) {
        metaSubtitle.addEventListener('input', function () {
            coverSubtitle.textContent = metaSubtitle.value;
            schedulePaginate();
        });
    }
    if (metaAuthor && coverAuthor) {
        metaAuthor.addEventListener('input', function () {
            coverAuthor.textContent = metaAuthor.value;
            schedulePaginate();
        });
    }

    // ---- 解析 Word HTML ----
    function parseDoc(html) {
        var c = document.createElement('div');
        c.innerHTML = html;
        var blocks = Array.from(c.children);

        var title = '', subtitle = '';
        var introEl = document.createElement('div');
        var bodyEl = document.createElement('div');
        var toc = [];

        var idx = 0;
        while (idx < blocks.length && !blocks[idx].textContent.trim()) idx++;
        if (idx < blocks.length) { title = blocks[idx].textContent.trim(); idx++; }
        if (idx < blocks.length) {
            var t = blocks[idx].textContent.trim();
            if (/^[—\-–]/.test(t)) { subtitle = t.replace(/^[—\-–]\s*/, '').trim(); idx++; }
        }

        var inIntro = false;
        for (; idx < blocks.length; idx++) {
            var b = blocks[idx];
            var text = b.textContent.trim();
            if (!text) continue;
            var isChapter = /^[一二三四五六七八九十]+、/.test(text);
            var isSection = /^\d+(\.\d+)+/.test(text);
            var isIntro = /^(引言|序言|前言|导言|写在前面|导读)/.test(text);
            if (isChapter || isSection) {
                inIntro = false;
                var tag = isChapter ? 'h2' : 'h3';
                var h = document.createElement(tag);
                h.textContent = text;
                bodyEl.appendChild(h);
                toc.push({ text: text, level: tag });
            } else if (isIntro) {
                inIntro = true;
                var h2 = document.createElement('h2');
                h2.textContent = text;
                introEl.appendChild(h2);
            } else if (inIntro) {
                introEl.appendChild(b.cloneNode(true));
            } else {
                bodyEl.appendChild(b.cloneNode(true));
            }
        }

        return { title: title, subtitle: subtitle, intro: introEl.innerHTML, body: bodyEl.innerHTML, toc: toc };
    }

    function updateToc(toc) {
        if (!tocList) return;
        tocList.innerHTML = '';
        toc.forEach(function (item) {
            var li = document.createElement('li');
            li.className = 'xc-toc-item';
            li.textContent = item.text;
            if (item.level === 'h3') li.style.paddingLeft = '1.6em';
            tocList.appendChild(li);
        });
    }

    function setInput(input, value) {
        if (!input) return;
        input.value = value;
        input.dispatchEvent(new Event('input'));
    }

    function applyParsed(parsed) {
        if (parsed.title) setInput(metaTitle, parsed.title);
        if (parsed.subtitle) setInput(metaSubtitle, parsed.subtitle);
        if (prefaceContent) prefaceContent.innerHTML = parsed.intro || '';
        if (prefaceSection) prefaceSection.style.display = parsed.intro ? '' : 'none';
        if (bodyContent) bodyContent.innerHTML = parsed.body || '<p><br></p>';
        updateToc(parsed.toc);
        paginate();
    }

    // ---- 持久化 ----
    function save() {
        var state = {
            title: metaTitle ? metaTitle.value : '',
            subtitle: metaSubtitle ? metaSubtitle.value : '',
            author: metaAuthor ? metaAuthor.value : '',
            preface: prefaceContent ? prefaceContent.innerHTML : '',
            body: bodyContent ? bodyContent.innerHTML : ''
        };
        try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {}
    }

    function updateTocFromBody() {
        if (!tocList || !bodyContent) return;
        tocList.innerHTML = '';
        bodyContent.querySelectorAll('h2, h3').forEach(function (h) {
            var li = document.createElement('li');
            li.className = 'xc-toc-item';
            li.textContent = h.textContent.trim();
            if (h.tagName === 'H3') li.style.paddingLeft = '1.6em';
            tocList.appendChild(li);
        });
    }

    function load() {
        var state = null;
        try { state = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (e) {}
        if (state) {
            if (state.title) setInput(metaTitle, state.title);
            if (state.subtitle) setInput(metaSubtitle, state.subtitle);
            if (state.author) setInput(metaAuthor, state.author);
            if (prefaceContent && state.preface) {
                prefaceContent.innerHTML = state.preface;
                if (prefaceSection) prefaceSection.style.display = '';
            }
            if (bodyContent && state.body) {
                bodyContent.innerHTML = state.body;
                updateTocFromBody();
            }
        }
        paginate();
    }

    // ---- Word 上传 ----
    if (fileInput) {
        fileInput.addEventListener('change', function (e) {
            var file = e.target.files[0];
            if (!file) return;
            if (typeof mammoth === 'undefined') {
                alert('解析组件未加载（可能需要联网）。请检查网络后重试。');
                return;
            }
            var reader = new FileReader();
            reader.onload = function () {
                mammoth.convertToHtml({ arrayBuffer: reader.result })
                    .then(function (result) {
                        var parsed = parseDoc(result.value || '');
                        applyParsed(parsed);
                        save();
                    })
                    .catch(function (err) {
                        alert('解析失败：' + (err && err.message ? err.message : err));
                    });
            };
            reader.readAsArrayBuffer(file);
        });
    }

    load();
})();
