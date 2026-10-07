import { build } from 'vite';
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { resolve, relative, extname } from 'node:path';

const project = resolve(import.meta.dirname, '..');
const dist = resolve(project, 'dist');
const releases = resolve(project, 'releases');
await build({ root: project, logLevel: 'warn' });

const mime = {
  '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.woff': 'font/woff', '.woff2': 'font/woff2',
};
const embedded = new Map();

async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await collect(path);
    else if (mime[extname(path)]) {
      const url = `/${relative(dist, path).replaceAll('\\', '/')}`;
      embedded.set(url, `data:${mime[extname(path)]};base64,${(await readFile(path)).toString('base64')}`);
    }
  }
}
await collect(dist);

function embedAssets(text) {
  for (const [url, data] of embedded) text = text.replaceAll(url, data);
  return text;
}

let html = await readFile(resolve(dist, 'index.html'), 'utf8');
const scriptTags = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)];
const styleTags = [...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"[^>]*>/g)];
if (scriptTags.length !== 1 || styleTags.length !== 1) throw new Error('Expected a single Vite script and stylesheet; update the standalone packager for this build.');

for (const [tag, url] of scriptTags) {
  const js = embedAssets(await readFile(resolve(dist, `.${url}`), 'utf8')).replace(/<\/script/gi, '<\\/script');
  // Keep module semantics: an inline module executes after the document is parsed.
  html = html.replace(tag, () => `<script type="module">${js}</script>`);
}
for (const [tag, url] of styleTags) {
  const css = embedAssets(await readFile(resolve(dist, `.${url}`), 'utf8'));
  html = html.replace(tag, () => `<style>${css}</style>`);
}
html = embedAssets(html);
if (/(?:src|href)="\/assets\//.test(html) || /url\(["']?\/assets\//.test(html)) throw new Error('An external asset remains in the standalone build.');

await mkdir(releases, { recursive: true });
const output = resolve(releases, 'Tiholesye.html');
await writeFile(output, html);
console.log(`Standalone game: ${output} (${(Buffer.byteLength(html) / 1024 / 1024).toFixed(1)} MiB)`);
console.log('Open this HTML file directly in Chrome or Edge. No installation or web server is required.');
