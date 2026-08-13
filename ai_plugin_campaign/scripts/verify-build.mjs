import { access, readFile, readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const dist = new URL('../dist/', import.meta.url);
const entry = new URL('ai-plugin-campaign.html', dist);
const html = await readFile(entry, 'utf8');
const assets = await readdir(new URL('assets/', dist));
const localReferences = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((reference) => !/^(?:[a-z]+:|#|data:)/i.test(reference));

if (/\b(?:src|href)="\/assets\//.test(html)) {
  throw new Error('Build contains absolute /assets paths and cannot be deployed beneath a CDN subdirectory.');
}

if (!html.includes('./assets/') || !assets.some((name) => name.endsWith('.js')) || !assets.some((name) => name.endsWith('.css'))) {
  throw new Error('Build output is incomplete: expected relative JS and CSS assets.');
}

for (const reference of localReferences) {
  await access(resolve('dist', reference.replace(/^\.\//, '').split(/[?#]/, 1)[0]));
}

const javascriptFiles = assets.filter((name) => name.endsWith('.js'));
if (javascriptFiles.length !== 1) {
  throw new Error(`在线构建只允许生成一个 JavaScript 入口，当前生成了 ${javascriptFiles.length} 个：${javascriptFiles.join(', ')}`);
}

const incompatibleAssetReferences = [];
for (const file of javascriptFiles) {
  const javascript = await readFile(new URL(`assets/${file}`, dist), 'utf8');
  incompatibleAssetReferences.push(...javascript.matchAll(/(?:`|')((?:\/?|\.\.?\/)assets\/[^`'$]+?\.(?:avif|gif|jpe?g|png|svg|webp))(?:`|')/gi));
}

if (incompatibleAssetReferences.length) {
  throw new Error(`在线构建仍有 ${incompatibleAssetReferences.length} 个 qupload 无法识别的图片字符串`);
}

const files = await Promise.all(
  assets.map(async (name) => ({ name, size: (await stat(new URL(`assets/${name}`, dist))).size })),
);

console.log('Build verified:', {
  entry: 'dist/ai-plugin-campaign.html',
  assets: files,
});
