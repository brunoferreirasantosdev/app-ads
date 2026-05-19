import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFilePath = fileURLToPath(import.meta.url);
const appAdsRoot = path.dirname(currentFilePath);
const repoRoot = path.resolve(appAdsRoot, "..");
const sourceRoot = path.join(repoRoot, "palmfit-site", "out");
const sourceIndexPath = path.join(sourceRoot, "index.html");
const appAdsIndexPath = path.join(appAdsRoot, "index.html");
const domain = readFileSync(path.join(appAdsRoot, "CNAME"), "utf8").trim();

let html = readFileSync(sourceIndexPath, "utf8");

const stylesheetTags = [
  ...html.matchAll(/<link rel="stylesheet" href="([^"]+)"[^>]*\/>/g),
];
const inlineStyles = stylesheetTags
  .map(([, href]) => {
    const cssPath = path.join(
      sourceRoot,
      href.replace(/^\//, "").replaceAll("/", path.sep),
    );
    const css = readFileSync(cssPath, "utf8").replaceAll(
      "url(/_next/static/media/",
      "url(./fonts/",
    );

    return `<style>${css}</style>`;
  })
  .join("");

html = html.replace(/<link rel="stylesheet" href="[^"]+"[^>]*\/>/g, "");
html = html.replace(/<link rel="preload" as="script"[^>]*\/>/g, "");
html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/g, "");
html = html.replace("</head>", `${inlineStyles}</head>`);
html = html.replaceAll('href="/media/', 'href="./media/');
html = html.replaceAll('src="/media/', 'src="./media/');
html = html.replaceAll(
  'content="https://palmfit-site.vercel.app/"',
  `content="https://${domain}/"`,
);
html = html.replaceAll(
  'content="https://palmfit-site.vercel.app"',
  `content="https://${domain}"`,
);

writeFileSync(appAdsIndexPath, html);

const sourceFontsPath = path.join(sourceRoot, "_next", "static", "media");
const destinationFontsPath = path.join(appAdsRoot, "fonts");

mkdirSync(appAdsRoot, { recursive: true });

if (existsSync(destinationFontsPath)) {
  rmSync(destinationFontsPath, { recursive: true, force: true });
}

cpSync(sourceFontsPath, destinationFontsPath, { recursive: true });

console.log(`app-ads index synced from palmfit-site for https://${domain}/`);
