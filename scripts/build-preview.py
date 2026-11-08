"""
Собирает одну HTML-страницу для просмотра проекта в браузере (без установки чего-либо).

Что внутри: живая вёрстка главной и каталога + концепция и технический план.
Как запустить:
    npm run build && npx next start -p 3100   # в одном терминале
    python3 scripts/build-preview.py          # в другом
Результат: docs/preview/index.html
"""

import pathlib
import re
import urllib.request

import markdown

ROOT = pathlib.Path(__file__).resolve().parent.parent
BASE = "http://localhost:3100"
OUT = ROOT / "docs" / "preview" / "index.html"


def fetch(path: str) -> str:
    with urllib.request.urlopen(BASE + path) as r:
        return r.read().decode("utf-8")


def body_of(html: str) -> str:
    body = re.search(r"<body[^>]*>(.*)</body>", html, re.S).group(1)
    body = re.sub(r"<script.*?</script>", "", body, flags=re.S)
    body = re.sub(r"<template.*?</template>", "", body, flags=re.S)
    # Внутренние ссылки → вкладки этой страницы
    body = body.replace('href="/circles"', 'href="#catalog"')
    body = body.replace('href="/#how"', 'href="#how"').replace('href="/#safety"', 'href="#safety"')
    body = body.replace('href="/"', 'href="#home"')
    return body


def css_of(html: str) -> str:
    css = ""
    for href in re.findall(r'href="(/_next/static/[^"]+\.css)"', html):
        css += fetch(href)
    # Локальные файлы шрифтов здесь недоступны — убираем @font-face, шрифты берём с Google Fonts
    css = re.sub(r"@font-face\s*{[^}]*}", "", css)
    return css


def md(path: str) -> str:
    text = (ROOT / path).read_text(encoding="utf-8")
    html = markdown.markdown(text, extensions=["tables", "fenced_code"])
    # Ссылки на файлы репозитория ведут на GitHub
    html = re.sub(r'href="(?!https?:|#)([^"]+)"', r'href="https://github.com/ditriX8/soobsha/blob/main/docs/\1"', html)
    return html


home = fetch("/")
catalog = fetch("/circles")
css = css_of(home)

page = f"""<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Сообща — превью проекта</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700&family=Unbounded:wght@400;500;600&display=swap">
<style>
{css}
:root {{ --font-display: "Unbounded", system-ui, sans-serif; --font-sans: "Onest", system-ui, sans-serif; }}
body {{ font-family: "Onest", system-ui, sans-serif; }}
.font-display {{ font-family: "Unbounded", system-ui, sans-serif !important; }}
.pv-bar {{ position: sticky; top: 0; z-index: 60; display: flex; gap: 6px; overflow-x: auto; padding: 10px 14px;
  background: #17201c; scrollbar-width: none; }}
.pv-bar a {{ flex: none; color: #f8f5ef; text-decoration: none; font: 600 14px/1 "Onest", sans-serif;
  padding: 10px 14px; border-radius: 999px; }}
.pv-bar a[aria-current="page"] {{ background: #f8f5ef; color: #17201c; }}
.pv-bar span {{ flex: none; color: #ddeee6; font: 500 13px/1 "Onest", sans-serif; padding: 10px 6px 10px 0; }}
.pv-view {{ display: none; }}
.pv-view.on {{ display: flex; flex-direction: column; min-height: 100vh; }}
/* Внутри превью шапка сайта прилипает под панелью вкладок */
.pv-view header.sticky {{ top: 52px; }}
.doc {{ max-width: 860px; margin: 0 auto; padding: 32px 20px 80px; color: #17201c; line-height: 1.65; font-size: 16px; }}
.doc h1 {{ font: 500 34px/1.15 "Unbounded", sans-serif; letter-spacing: -0.04em; margin: 8px 0 20px; }}
.doc h2 {{ font: 500 24px/1.25 "Unbounded", sans-serif; letter-spacing: -0.02em; margin: 40px 0 14px; }}
.doc h3 {{ font: 600 18px/1.3 "Onest", sans-serif; margin: 28px 0 10px; }}
.doc p, .doc ul, .doc ol {{ margin: 0 0 14px; }}
.doc ul, .doc ol {{ padding-left: 22px; }} .doc ul {{ list-style: disc; }} .doc ol {{ list-style: decimal; }}
.doc li {{ margin: 4px 0; }}
.doc a {{ color: #1e5c4a; text-decoration: underline; }}
.doc strong {{ font-weight: 650; }}
.doc code {{ background: #e3d8c5; padding: 1px 6px; border-radius: 6px; font-size: 0.92em; }}
.doc pre {{ background: #f8f5ef; border: 1px solid #ddd3c2; border-radius: 16px; padding: 16px; overflow-x: auto; margin: 0 0 16px; }}
.doc pre code {{ background: none; padding: 0; font-size: 13px; line-height: 1.45; display: block; }}
.doc hr {{ border: 0; border-top: 1px solid #ddd3c2; margin: 32px 0; }}
.doc table {{ display: block; overflow-x: auto; border-collapse: collapse; margin: 0 0 18px; font-size: 14.5px;
  background: #f8f5ef; border-radius: 14px; border: 1px solid #ddd3c2; }}
.doc th, .doc td {{ text-align: left; padding: 9px 12px; border-bottom: 1px solid #ddd3c2; vertical-align: top; }}
.doc th {{ background: #e3d8c5; font-weight: 600; }}
.doc tr:last-child td {{ border-bottom: 0; }}
</style>
</head>
<body class="bg-paper">
<nav class="pv-bar" aria-label="Разделы превью">
  <span>Сообща · превью</span>
  <a href="#home">Главная</a>
  <a href="#catalog">Каталог</a>
  <a href="#concept">Концепция</a>
  <a href="#plan">Технический план</a>
</nav>
<div class="pv-view" id="v-home">{body_of(home)}</div>
<div class="pv-view" id="v-catalog">{body_of(catalog)}</div>
<div class="pv-view" id="v-concept"><article class="doc">{md("docs/concept.md")}</article></div>
<div class="pv-view" id="v-plan"><article class="doc">{md("docs/tech-plan.md")}</article></div>
<script>
(function () {{
  var views = {{ home: 1, catalog: 1, concept: 1, plan: 1 }};
  function show() {{
    var h = (location.hash || "#home").slice(1);
    var view = views[h] ? h : "home";
    document.querySelectorAll(".pv-view").forEach(function (v) {{ v.classList.toggle("on", v.id === "v-" + view); }});
    document.querySelectorAll(".pv-bar a").forEach(function (a) {{
      if (a.getAttribute("href") === "#" + view) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    }});
    var target = !views[h] && h ? document.getElementById(h) : null;
    if (target) target.scrollIntoView({{ behavior: "smooth" }}); else window.scrollTo(0, 0);
  }}
  // Кнопки прототипа, которые пока никуда не ведут
  document.addEventListener("click", function (e) {{
    var a = e.target.closest('a[href="#"]');
    if (a) {{ e.preventDefault(); }}
  }});
  window.addEventListener("hashchange", show);
  show();
}})();
</script>
</body>
</html>
"""

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(page, encoding="utf-8")
print(f"OK: {OUT} ({len(page) // 1024} KB)")
