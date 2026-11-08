/** Точка входа для превью одной HTML-страницей (собирается скриптом scripts/build-preview.mjs). */
import { createRoot } from "react-dom/client";
import { PrototypeApp } from "./app";

createRoot(document.getElementById("root")!).render(<PrototypeApp />);
