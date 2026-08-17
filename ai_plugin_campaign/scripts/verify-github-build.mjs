import { access, readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const distDirectory = resolve('dist');
const entryPath = resolve(distDirectory, 'index.html');
const html = await readFile(entryPath, 'utf8');
const localReferences = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((reference) => !/^(?:[a-z]+:|#|data:)/i.test(reference));

if (/\b(?:src|href)="\//.test(html)) {
  throw new Error('GitHub Pages 构建包含根路径资源，部署到仓库子目录后会失效');
}

for (const reference of localReferences) {
  await access(resolve(distDirectory, reference.replace(/^\.\//, '').split(/[?#]/, 1)[0]));
}

const assets = await readdir(resolve(distDirectory, 'assets'));
if (!assets.some((name) => name.endsWith('.js')) || !assets.some((name) => name.endsWith('.css'))) {
  throw new Error('GitHub Pages 构建缺少 JavaScript 或 CSS 入口');
}

const javascriptFiles = assets.filter((name) => name.endsWith('.js'));
const javascript = (await Promise.all(
  javascriptFiles.map((name) => readFile(resolve(distDirectory, 'assets', name), 'utf8')),
)).join('\n');

if (/(["'`])\/assets\//.test(javascript)) {
  throw new Error('GitHub Pages 构建仍包含绝对 /assets/ 路径');
}

for (const preview of [
  'learning-locked',
  'learning-unlocked',
  'competition-before',
  'competition-submission',
  'competition-review',
  'competition-showcase',
  'competition-awards',
  'login',
  'rules',
  'submission-ended',
  'certificate',
  'browser-gate',
]) {
  if (!javascript.includes(preview)) throw new Error(`构建缺少静态预览：${preview}`);
}

console.log('GitHub Pages build verified:', {
  entry: 'dist/index.html',
  previews: 12,
  assets: assets.length,
});
