"""
Превращает документ Markdown в красивую HTML-страницу для чтения в браузере.
    python3 scripts/build-doc-page.py docs/planner-v2.md docs/preview/planner-v2.html "Заголовок вкладки"
"""
import pathlib
import re
import sys

import markdown

src, out, title = sys.argv[1], sys.argv[2], sys.argv[3]
html = markdown.markdown(pathlib.Path(src).read_text(encoding="utf-8"), extensions=["tables", "fenced_code"])
html = re.sub(r'href="(?!https?:|#)([^"]+)"', r'href="https://github.com/ditriX8/soobsha/blob/main/docs/\1"', html)

page = f"""<!DOCTYPE html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700&family=Unbounded:wght@500&display=swap">
<style>
body {{ margin: 0; background: #ede5d7; color: #17201c; font: 16px/1.65 "Onest", system-ui, sans-serif; }}
.doc {{ max-width: 860px; margin: 0 auto; padding: 28px 18px 80px; }}
h1 {{ font: 500 32px/1.15 "Unbounded", sans-serif; letter-spacing: -0.04em; margin: 8px 0 18px; }}
h2 {{ font: 500 23px/1.25 "Unbounded", sans-serif; letter-spacing: -0.02em; margin: 40px 0 14px; }}
h3 {{ font-weight: 650; font-size: 18px; margin: 26px 0 10px; }}
p, ul, ol {{ margin: 0 0 14px; }} ul, ol {{ padding-left: 22px; }} li {{ margin: 4px 0; }}
a {{ color: #1e5c4a; }} strong {{ font-weight: 650; }}
code {{ background: #e3d8c5; padding: 1px 6px; border-radius: 6px; font-size: .92em; }}
pre {{ background: #f8f5ef; border: 1px solid #ddd3c2; border-radius: 16px; padding: 16px; overflow-x: auto; }}
pre code {{ background: none; padding: 0; font-size: 12.5px; line-height: 1.45; display: block; }}
hr {{ border: 0; border-top: 1px solid #ddd3c2; margin: 32px 0; }}
table {{ display: block; overflow-x: auto; border-collapse: collapse; margin: 0 0 18px; font-size: 14.5px; background: #f8f5ef; border: 1px solid #ddd3c2; border-radius: 14px; }}
th, td {{ text-align: left; padding: 9px 12px; border-bottom: 1px solid #ddd3c2; vertical-align: top; }}
th {{ background: #e3d8c5; font-weight: 600; }} tr:last-child td {{ border-bottom: 0; }}
</style></head><body><article class="doc">{html}</article></body></html>"""
pathlib.Path(out).write_text(page, encoding="utf-8")
print("OK:", out)
