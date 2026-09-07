// Copies the pdf.js worker into /public so the PDF reader never depends on a CDN.
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const pdfjsRoot = dirname(require.resolve("pdfjs-dist/package.json"));

mkdirSync("public", { recursive: true });
copyFileSync(join(pdfjsRoot, "build", "pdf.worker.min.mjs"), join("public", "pdf.worker.min.mjs"));
console.log("[pdf] worker copied to public/pdf.worker.min.mjs");
