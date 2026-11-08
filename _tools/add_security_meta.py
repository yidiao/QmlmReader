# -*- coding: utf-8 -*-
"""为全站 HTML 页面注入 meta 形式安全头（GitHub Pages 无法自定义响应头）。

注入内容（v1）：
- <meta name="referrer"> 强制生效；
- 强制 CSP：object-src/base-uri/form-action 三条（2026-11-08 扫描确认全站无
  object/embed/base/form/iframe 标签，零破坏风险）；
- Report-Only CSP：全量允许清单，转正前观察用（开控制台看违规报告）。

模式：
  --scan    扫描外部资源引用 + 强制 CSP 前提条件核查 + 允许清单比对（只读）
  --apply   注入（默认）；已含 security-meta 标记的文件跳过（幂等可复跑）
  --remove  摘除本工具注入的块（回滚用）

meta 形式的固有限制（无法下发，留待反代层）：X-Content-Type-Options、
frame-ancestors；Report-Only 无收集端点，违规仅进浏览器控制台。

插入位置：紧跟 </title> 行之后；无 </title> 时紧跟 <head> 行之后。
保留 UTF-8 BOM 与原有 CRLF/LF 行尾风格。
范围：根目录 index.html + html/ 全部 .html；跳过任何 data/ 子目录（数据目录不动）。
downloads/ 为导出产物，不在范围内。
"""
import os
import re
import sys
from urllib.parse import urlparse

ROOT = r"D:\AI Pj\myProject\Qmlmreader"
SKIP_DIRS = {"data", ".git", "node_modules", "_tools", "doc", "downloads"}

# ---- 策略定稿（2026-11-08 全站扫描）----
CSP_ENFORCED = "object-src 'none'; base-uri 'self'; form-action 'self'"
CSP_REPORT_ONLY = (
    "default-src 'self'; "
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com; "
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
    "font-src 'self' data: https://fonts.gstatic.com; "
    "img-src 'self' data:; "
    "connect-src 'self' https://api.deepseek.com https://qmlm-reader.vercel.app"
)

# 允许清单（与上面策略字符串保持一致；--scan 用它比对新增外域）
ALLOW = {
    "script-src": {"cdn.jsdelivr.net", "unpkg.com"},
    "style-src": {"fonts.googleapis.com"},
    "font-src": {"fonts.gstatic.com"},
    "img-src": set(),  # 全站图片本地 + data:，无外域
    "connect-src": {"api.deepseek.com", "qmlm-reader.vercel.app"},
}
# 纯超链接外域（导航不受 CSP 约束，出现即视为正常）
KNOWN_LINK_ONLY = {"www.bilibili.com", "space.bilibili.com", "pan.baidu.com",
                   "platform.deepseek.com", "s.shuge.org"}
# 已知非网络资源（SVG xmlns 等）
KNOWN_NON_RESOURCE = {"www.w3.org"}

MARKER = "<!-- security-meta v1 (_tools/add_security_meta.py) -->"
RE_TITLE = re.compile(r"([ \t]*)(</title>[^\n]*?\n)")
RE_HEAD = re.compile(r"([ \t]*)(<head[^>]*>[^\n]*?\n)")

# --scan 用：按标签属性上下文归类外域
SCAN_ATTRS = [
    ("script-src", re.compile(r"<script[^>]+src=[\"'](https?:[^\"']+)", re.I)),
    ("style-src", re.compile(r"<link[^>]+href=[\"'](https?:[^\"']+)", re.I)),
    ("font-src", re.compile(r"<link[^>]+href=[\"'](https?:[^\"']+)", re.I)),
    ("img-src", re.compile(r"<(?:img|source)[^>]+src=[\"'](https?:[^\"']+)", re.I)),
    ("connect-src", re.compile(r"<iframe[^>]+src=[\"'](https?:[^\"']+)", re.I)),
    ("纯链接", re.compile(r"<a[^>]+href=[\"'](https?:[^\"']+)", re.I)),
]
SCAN_JS_URL = re.compile(r"https?://([a-zA-Z0-9.-]+[a-zA-Z0-9])")
# 强制 CSP 前提条件核查：这些标签存在与否决定 object-src/base-uri/form-action 是否安全
SAFE_CHECKS = {
    "<base>": re.compile(r"<base[\s>]", re.I),
    "<object/embed>": re.compile(r"<(?:object|embed|applet)[\s>]", re.I),
    "<form>": re.compile(r"<form[\s>]", re.I),
    "<iframe>": re.compile(r"<iframe[\s>]", re.I),
}


def targets():
    out = [os.path.join(ROOT, "index.html")]
    html_dir = os.path.join(ROOT, "html")
    for dirpath, dirnames, filenames in os.walk(html_dir):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in filenames:
            if fn.lower().endswith(".html"):
                out.append(os.path.join(dirpath, fn))
    return out


def code_files(ext):
    out = []
    for base in ("js", "css", "html"):
        b = os.path.join(ROOT, base)
        if not os.path.isdir(b):
            continue
        for dirpath, dirnames, filenames in os.walk(b):
            dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
            for fn in filenames:
                if fn.lower().endswith(ext):
                    out.append(os.path.join(dirpath, fn))
    return out


def read_text(p):
    with open(p, "rb") as f:
        raw = f.read()
    has_bom = raw.startswith(b"\xef\xbb\xbf")
    return raw, has_bom, (raw.decode("utf-8-sig" if has_bom else "utf-8"))


def write_text(p, text, has_bom):
    data = text.encode("utf-8")
    if has_bom:
        data = b"\xef\xbb\xbf" + data
    with open(p, "wb") as f:
        f.write(data)


def block_lines(indent, eol):
    return [
        f"{indent}{MARKER}{eol}",
        f'{indent}<meta name="referrer" content="strict-origin-when-cross-origin">{eol}',
        f'{indent}<meta http-equiv="Content-Security-Policy" content="{CSP_ENFORCED}">{eol}',
        f'{indent}<meta http-equiv="Content-Security-Policy-Report-Only" content="{CSP_REPORT_ONLY}">{eol}',
    ]


def host_of(url):
    return (urlparse(url).netloc or "").lower()


# ---- --remove：按标记行 + 后续 meta 行摘除 ----
def strip_block(text):
    lines = text.split("\n")
    out, skipping = [], False
    for ln in lines:
        if MARKER in ln:
            skipping = True
            # 吃掉行尾换行符归属：保留行结构，标记行整行删
            continue
        if skipping:
            s = ln.lstrip()
            if s.startswith('<meta name="referrer"') or s.startswith('<meta http-equiv="Content-Security-Policy'):
                continue
            skipping = False
        out.append(ln)
    return "\n".join(out)


def cmd_scan():
    files = targets()
    buckets = {}   # host -> {context: n}
    file_hits = {}  # host -> set(rel paths, capped at print time)
    safe_counts = {k: 0 for k in SAFE_CHECKS}
    for p in files:
        rel = os.path.relpath(p, ROOT)
        _, _, text = read_text(p)
        for label, rx in SAFE_CHECKS.items():
            safe_counts[label] += len(rx.findall(text))
        for label, rx in SCAN_ATTRS:
            for m in rx.findall(text):
                h = host_of(m)
                if not h:
                    continue
                buckets.setdefault(h, {})
                buckets[h][label] = buckets[h].get(label, 0) + 1
                file_hits.setdefault(h, set()).add(rel)
    js_hosts, css_hosts = {}, {}
    for p in code_files(".js"):
        _, _, text = read_text(p)
        for h in SCAN_JS_URL.findall(text):
            js_hosts[h] = js_hosts.get(h, 0) + 1
    for p in code_files(".css"):
        _, _, text = read_text(p)
        for h in SCAN_JS_URL.findall(text):
            css_hosts[h] = css_hosts.get(h, 0) + 1

    print(f"scan: html files={len(files)}")
    print(f"safety preconditions (应为0): "
          + " ".join(f"{k}={v}" for k, v in safe_counts.items()))
    print("\n== HTML 外域引用 ==")
    for h, ctx in sorted(buckets.items(), key=lambda kv: -sum(kv[1].values())):
        ctx_str = " ".join(f"{k}:{v}" for k, v in sorted(ctx.items()))
        print(f"  {h}  [{ctx_str}]  files={len(file_hits[h])}")
    print("\n== JS 中外域（connect-src 候选，需人工判读）==")
    for h, n in sorted(js_hosts.items(), key=lambda kv: -kv[1]):
        tag = ""
        if h in KNOWN_NON_RESOURCE:
            tag = "（非网络资源，忽略）"
        elif h in KNOWN_LINK_ONLY:
            tag = "（纯链接外域）"
        elif h in ALLOW["connect-src"]:
            tag = "（已在 connect-src 允许清单）"
        elif h not in {x for s in ALLOW.values() for x in s}:
            tag = "  ⚠ 不在任何允许清单，若被 fetch/img 使用需更新策略"
        print(f"  {h}  x{n}{tag}")
    if css_hosts:
        print("\n== CSS 中外域 ==")
        for h, n in sorted(css_hosts.items(), key=lambda kv: -kv[1]):
            print(f"  {h}  x{n}")
    print("\n提示：出现'⚠'则说明新增了外域资源，先核对用途再更新 CSP_ENFORCED/REPORT_ONLY。")


def cmd_apply():
    changed, already, skipped = [], [], []
    for p in targets():
        rel = os.path.relpath(p, ROOT)
        raw, has_bom, text = read_text(p)
        if MARKER in text:
            already.append(rel)
            continue
        m = RE_TITLE.search(text)
        if m:
            indent, eol = m.group(1), "\r\n" if m.group(2).endswith("\r\n") else "\n"
            new_text = text[: m.end()] + "".join(block_lines(indent, eol)) + text[m.end():]
        else:
            m = RE_HEAD.search(text)
            if not m:
                skipped.append(rel)
                continue
            indent, eol = m.group(1), "\r\n" if m.group(2).endswith("\r\n") else "\n"
            new_text = text[: m.end()] + "".join(block_lines(indent, eol)) + text[m.end():]
        write_text(p, new_text, has_bom)
        changed.append(rel)
    print(f"total={len(targets())} changed={len(changed)} already={len(already)} skipped={len(skipped)}")
    if skipped:
        print("NO head/title, skipped:")
        for r in skipped:
            print("  ", r)


def cmd_remove():
    changed, not_found = [], []
    for p in targets():
        rel = os.path.relpath(p, ROOT)
        raw, has_bom, text = read_text(p)
        if MARKER not in text:
            not_found.append(rel)
            continue
        write_text(p, strip_block(text), has_bom)
        changed.append(rel)
    print(f"total={len(targets())} removed={len(changed)} not_found={len(not_found)}")


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    mode = sys.argv[1] if len(sys.argv) > 1 else "--apply"
    if mode == "--scan":
        cmd_scan()
    elif mode == "--remove":
        cmd_remove()
    else:
        cmd_apply()


if __name__ == "__main__":
    main()
