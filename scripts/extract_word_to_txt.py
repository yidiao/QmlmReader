from pathlib import Path
from docx import Document

ROOT = Path(r"D:\AI Pj\金星与赤旗\著作提取")
OUT = ROOT / "_txt"
OUT.mkdir(exist_ok=True)
LOG = OUT / "_extract_log.txt"

lines = []
for docx_path in ROOT.rglob("*.docx"):
    try:
        doc = Document(str(docx_path))
        paragraphs = [p.text.strip() for p in doc.paragraphs if p.text and p.text.strip()]
        rel = docx_path.relative_to(ROOT)
        txt_path = (OUT / rel).with_suffix('.txt')
        txt_path.parent.mkdir(parents=True, exist_ok=True)
        txt_path.write_text("\n".join(paragraphs), encoding='utf-8')
        lines.append(f"OK {rel} -> {txt_path.relative_to(OUT)}")
    except Exception as exc:
        lines.append(f"ERR {docx_path} -> {exc}")

LOG.write_text("\n".join(lines), encoding='utf-8')
print(f"DONE {len(lines)} files")
