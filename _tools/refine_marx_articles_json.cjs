const fs = require('fs');
const path = require('path');

const root = 'D:\\AI_Pj\\Qmlmreader';
const dataRoot = path.join(root, 'data', 'articles-json', 'Marx');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function splitParagraphText(text, maxLen = 240) {
  const cleaned = String(text == null ? '' : text).replace(/^\uFEFF/, '').trim();
  if (!cleaned) return [];
  if (cleaned.length <= maxLen) return [cleaned];

  const sentenceParts = cleaned
    .split(/(?<=[。！？；：])\s*/)
    .map(part => part.trim())
    .filter(Boolean);

  if (sentenceParts.length === 1 && sentenceParts[0].length > maxLen) {
    const chunks = [];
    for (let i = 0; i < cleaned.length; i += maxLen) chunks.push(cleaned.slice(i, i + maxLen));
    return chunks.filter(Boolean);
  }

  const chunks = [];
  let buffer = '';
  for (const part of sentenceParts) {
    if (!buffer) {
      buffer = part;
      continue;
    }
    if ((buffer + part).length <= maxLen) {
      buffer += part;
      continue;
    }
    chunks.push(buffer);
    buffer = part;
  }
  if (buffer) chunks.push(buffer);
  return chunks.filter(Boolean);
}

function collectParagraphs(lines) {
  const paragraphs = [];
  for (const line of lines) {
    const trimmed = String(line == null ? '' : line).trim();
    if (!trimmed) continue;
    paragraphs.push(...splitParagraphText(trimmed));
  }
  return paragraphs;
}

function buildOriginal(titleLine, bodyLines, chapters) {
  const paragraphs = collectParagraphs(bodyLines);
  return {
    titleLine,
    paragraphs,
    chapters: chapters.map(chapter => ({
      title: chapter.title,
      paragraphs: collectParagraphs(bodyLines.slice(chapter.from - 1, chapter.to)),
    })).filter(chapter => chapter.paragraphs.length),
  };
}

const configs = [
  {
    file: path.join(dataRoot, '★★★★★', 'de-yi-zhi-yi-xing-tai.json'),
    meta: {
      author: '马克思 · 恩格斯',
      subtitle: '对费尔巴哈、鲍威尔和施蒂纳所代表的德国哲学以及德国社会主义的批判',
      date: '1845-1846年',
      category: '哲学基础 · 历史唯物主义',
      wordCount: '约30,000字（节选）',
      lengthTag: '长篇',
    },
    chapters: [
      { title: '开篇：青年黑格尔派的解体', from: 2, to: 3 },
      { title: '一 费尔巴哈：一般意识形态，特别是德国哲学', from: 4, to: 9 },
      { title: '共同利益、国家与分工', from: 10, to: 12 },
      { title: '历史不外是各个世代的依次交替', from: 13, to: 17 },
      { title: '共产主义与现实革命', from: 18, to: 23 },
      { title: '征服、占领与生产方式', from: 24, to: 28 },
      { title: '分工、意识形态与传统', from: 29, to: 35 },
    ],
  },
  {
    file: path.join(dataRoot, '★★★★★', 'ge-da-gang-ling.json'),
    meta: {
      author: '马克思',
      subtitle: '对德国工人党纲领草案的批判',
      date: '1875年',
      category: '政治理论 · 科学社会主义',
      wordCount: '约15,000字',
      lengthTag: '中篇',
    },
    chapters: [
      { title: '恩格斯写的1891年版序言', from: 2, to: 3 },
      { title: '德国工人党纲领批注一', from: 4, to: 8 },
      { title: '德国工人党纲领批注二', from: 9, to: 12 },
      { title: 'A. 国家的自由的基础', from: 13, to: 14 },
      { title: 'B. 德国工人党提出的国家精神与道德基础', from: 15, to: 18 },
    ],
  },
  {
    file: path.join(dataRoot, '★★★★★', 'guan-yu-fei-er-ba-ha-de-ti-gang.json'),
    meta: {
      author: '马克思',
      subtitle: '关于费尔巴哈的提纲',
      date: '1845年春',
      category: '哲学基础 · 实践唯物主义',
      wordCount: '约1,500字',
      lengthTag: '短篇',
    },
    chapters: [
      { title: '十一条提纲', from: 2, to: 3 },
      { title: '马克思论费尔巴哈', from: 4, to: 4 },
    ],
  },
  {
    file: path.join(dataRoot, '★★★★☆', 'hei-ge-er-fa-zhe-xue-pi-pan-dao-yan.json'),
    meta: {
      author: '马克思',
      subtitle: '从宗教批判走向政治批判',
      date: '1843年末—1844年初',
      category: '哲学基础 · 政治批判',
      wordCount: '约10,000字（节选）',
      lengthTag: '短篇',
    },
    chapters: [
      { title: '一 宗教批判与人的解放', from: 2, to: 2 },
      { title: '二 对德国现状的否定', from: 3, to: 3 },
      { title: '三 现实压迫与搏斗式批判', from: 4, to: 5 },
    ],
  },
  {
    file: path.join(dataRoot, '★★★☆☆', '1844-nian-jing-ji-xue-zhe-xue-shou-gao.json'),
    meta: {
      author: '马克思',
      subtitle: '异化劳动与共产主义问题的节选',
      date: '1844年',
      category: '哲学基础 · 政治经济学批判',
      wordCount: '约10,000字（节选）',
      lengthTag: '中篇',
    },
    chapters: [
      { title: '异化劳动和私有财产（节选一）', from: 2, to: 3 },
      { title: '异化劳动和私有财产（节选二）', from: 4, to: 4 },
      { title: '异化劳动与共产主义（节选）', from: 5, to: 5 },
    ],
  },
];

const results = [];
for (const config of configs) {
  const article = readJson(config.file);
  const contentLines = String(article.content == null ? '' : article.content)
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  const sourceLines = config.sourceLines ?? 1;
  const bodyStart = 2;
  const bodyEnd = Math.max(bodyStart - 1, contentLines.length - sourceLines);
  const bodyLines = contentLines.slice(bodyStart - 1, bodyEnd);

  article.meta = {
    ...(article.meta || {}),
    ...config.meta,
  };
  article.original = buildOriginal(
    article.title || '',
    bodyLines,
    config.chapters,
  );
  delete article.content;

  writeJson(config.file, article);
  results.push({
    file: path.relative(root, config.file),
    paragraphs: article.original.paragraphs.length,
    chapters: article.original.chapters.length,
  });
}

console.log(JSON.stringify(results, null, 2));
