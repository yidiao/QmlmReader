(function() {
  var DOCX_CDN = 'https://unpkg.com/docx@8.5.0/build/index.umd.js';

  function ensureDocxLib() {
    if (window.docx) return Promise.resolve(window.docx);
    if (window.__docxLoading) return window.__docxLoading;
    window.__docxLoading = new Promise(function(resolve, reject) {
      var script = document.createElement('script');
      script.src = DOCX_CDN;
      script.onload = function() { resolve(window.docx); };
      script.onerror = function() { reject(new Error('DOCX 库加载失败')); };
      document.head.appendChild(script);
    });
    return window.__docxLoading;
  }

  function filenameSafe(name) {
    return (name || 'article').replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim();
  }

  function triggerDownload(blob, fileName) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 800);
  }

  function textFromNode(node) {
    return node ? (node.textContent || '').replace(/\s+/g, ' ').trim() : '';
  }

  function collectParagraphs(root) {
    var selectors = [
      '.original-text .chapter-content p',
      '.original-text p',
      '.article-content p',
      'main p'
    ];
    for (var i = 0; i < selectors.length; i++) {
      var nodes = Array.prototype.slice.call(root.querySelectorAll(selectors[i]));
      var texts = nodes.map(textFromNode).filter(Boolean);
      if (texts.length) return texts;
    }
    return [];
  }

  function extractArticlePayloadFromDocument(doc, fallbackFileName) {
    var title = textFromNode(doc.querySelector('h1')) || fallbackFileName || '未命名文章';
    var author = textFromNode(doc.querySelector('.article-meta .author')) || textFromNode(doc.querySelector('.article-author')) || '';
    var date = textFromNode(doc.querySelector('.article-meta .date')) || '';
    var category = textFromNode(doc.querySelector('.article-meta .category')) || '';
    var paragraphs = collectParagraphs(doc);
    return {
      title: title,
      author: author,
      date: date,
      category: category,
      paragraphs: paragraphs,
      fileName: filenameSafe(title)
    };
  }

  async function fetchArticlePayload(relativeHtmlPath, fallbackTitle) {
    var resp = await fetch(relativeHtmlPath, { cache: 'no-store' });
    if (!resp.ok) throw new Error('无法读取文章源文件：' + relativeHtmlPath);
    var html = await resp.text();
    var parser = new DOMParser();
    var doc = parser.parseFromString(html, 'text/html');
    return extractArticlePayloadFromDocument(doc, fallbackTitle || relativeHtmlPath);
  }

  function buildTxtContent(payload) {
    var lines = [payload.title];
    if (payload.author) lines.push('作者：' + payload.author);
    if (payload.date) lines.push('时间：' + payload.date);
    if (payload.category) lines.push('分类：' + payload.category);
    lines.push('');
    return lines.concat(payload.paragraphs).join('\r\n');
  }

  async function downloadArticleAsTxt(payload) {
    var content = buildTxtContent(payload);
    triggerDownload(new Blob([content], { type: 'text/plain;charset=utf-8' }), payload.fileName + '.txt');
  }

  async function downloadArticleAsDocx(payload) {
    var lib = await ensureDocxLib();
    var paragraphs = [
      new lib.Paragraph({ text: payload.title, heading: lib.HeadingLevel.TITLE })
    ];
    if (payload.author || payload.date || payload.category) {
      var meta = [payload.author, payload.date, payload.category].filter(Boolean).join(' · ');
      paragraphs.push(new lib.Paragraph({ text: meta }));
      paragraphs.push(new lib.Paragraph({ text: '' }));
    }
    payload.paragraphs.forEach(function(text) {
      paragraphs.push(new lib.Paragraph({ text: text }));
    });
    var doc = new lib.Document({ sections: [{ properties: {}, children: paragraphs }] });
    var blob = await lib.Packer.toBlob(doc);
    triggerDownload(blob, payload.fileName + '.docx');
  }

  function buildStandardDownloadLinks() {
    return [
      { href: '#', label: '下载 TXT', format: 'txt', source: window.location.href },
      { href: '#', label: '下载 DOCX', format: 'docx', source: window.location.href }
    ];
  }

  async function handleStandardLinkClick(evt) {
    var link = evt.target.closest('a[data-download-format]');
    if (!link) return;
    evt.preventDefault();
    var format = link.getAttribute('data-download-format');
    var source = link.getAttribute('data-download-source') || window.location.href;
    try {
      var payload;
      if (source === window.location.href || source === location.pathname) {
        payload = extractArticlePayloadFromDocument(document, document.title);
      } else {
        payload = await fetchArticlePayload(source, document.title);
      }
      if (format === 'docx') await downloadArticleAsDocx(payload);
      else await downloadArticleAsTxt(payload);
    } catch (err) {
      alert(err && err.message ? err.message : '下载失败');
    }
  }

  document.addEventListener('click', function(evt) {
    if (evt.target.closest('a[data-download-format]')) {
      handleStandardLinkClick(evt);
    }
  });

  window.DownloadExport = {
    ensureDocxLib: ensureDocxLib,
    buildStandardDownloadLinks: buildStandardDownloadLinks,
    extractArticlePayloadFromDocument: extractArticlePayloadFromDocument,
    fetchArticlePayload: fetchArticlePayload,
    downloadArticleAsTxt: downloadArticleAsTxt,
    downloadArticleAsDocx: downloadArticleAsDocx
  };
  window.buildStandardDownloadLinks = buildStandardDownloadLinks;
})();
