import { readFile } from 'node:fs/promises';

const entry = 'output/ai-plugin-campaign.html';
const html = await readFile(entry, 'utf8');
const scriptUrl = html.match(/<script\b[^>]*\bsrc="(https?:\/\/[^\"]+)"/i)?.[1];

if (!scriptUrl) {
  throw new Error(`${entry} 中没有 CDN JavaScript 地址`);
}

const response = await fetch(scriptUrl);
if (!response.ok) {
  throw new Error(`部署校验失败：无法读取 CDN JavaScript，HTTP ${response.status}`);
}

const javascript = await response.text();
const unresolvedAssets = [...javascript.matchAll(/(?:"|'|`)((?:\/?|\.\.?\/)assets\/[^"'`$]+?\.(?:avif|gif|jpe?g|png|svg|webp))(?:"|'|`)/gi)]
  .map((match) => match[1]);
const imageCdnUrls = new Set(javascript.match(/https:\/\/img\d+\.zbrowser\.cn\/[^"'`\s)]+/gi) ?? []);
const unresolvedScriptChunks = [...javascript.matchAll(/\bimport\s*\(\s*["'`]((?:\.\.?\/)[^"'`]+\.js(?:[?#][^"'`]*)?)["'`]\s*\)/gi)]
  .map((match) => match[1]);

if (unresolvedScriptChunks.length) {
  throw new Error(`部署校验失败：CDN 主 JavaScript 仍依赖相对 JS 分包：${[...new Set(unresolvedScriptChunks)].join(', ')}`);
}

if (unresolvedAssets.length) {
  throw new Error(`部署校验失败：CDN JavaScript 中仍有本地图片路径：${[...new Set(unresolvedAssets)].slice(0, 5).join(', ')}`);
}

if (!imageCdnUrls.size) {
  throw new Error('部署校验失败：CDN JavaScript 中没有 ZERO 图片 CDN 地址');
}

console.log(`部署校验通过：入口 ${entry}，${imageCdnUrls.size} 个图片 CDN 地址，未发现本地 assets 图片路径`);
