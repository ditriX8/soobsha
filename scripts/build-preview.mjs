/**
 * Собирает интерактивный прототип в ОДНУ HTML-страницу (для просмотра по ссылке без установки).
 *   node scripts/build-preview.mjs  →  docs/preview/index.html
 * Внутри: весь JavaScript и CSS. Шрифты — с Google Fonts.
 */
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const tmp = join(tmpdir(), "soobsha-preview");
mkdirSync(tmp, { recursive: true });

const js = await build({
  entryPoints: [join(root, "src/prototype/main.tsx")],
  bundle: true,
  minify: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  target: "es2020",
  define: { "process.env.NODE_ENV": '"production"' },
  logLevel: "error",
});
const script = js.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");

const cssFile = join(tmp, "out.css");
execFileSync("npx", ["@tailwindcss/cli", "-i", join(root, "src/styles/standalone.css"), "-o", cssFile, "--minify"], { cwd: root, stdio: "pipe" });
const css = readFileSync(cssFile, "utf8");
rmSync(tmp, { recursive: true, force: true });

const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Сообща — интерактивный прототип</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700&family=Unbounded:wght@400;500;600&display=swap">
<style>${css}</style>
</head>
<body class="bg-paper">
<div id="root"></div>
<script>${script}</script>
</body>
</html>
`;
mkdirSync(join(root, "docs/preview"), { recursive: true });
writeFileSync(join(root, "docs/preview/index.html"), html);
console.log(`OK: docs/preview/index.html (${Math.round(html.length / 1024)} KB)`);
