import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';

const distDir = resolve('dist');
const assetsDir = resolve(distDir, 'assets');
const localAssetPattern = /([`'])((?:\/?|\.\.?\/)assets\/[^`'$]+?\.(?:avif|gif|jpe?g|png|svg|webp))\1/gi;
const compatibleAssetPattern = /"((?:\/?|\.\.?\/)assets\/[^"$]+?\.(?:avif|gif|jpe?g|png|svg|webp))"/gi;

async function listJavaScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listJavaScriptFiles(path));
    else if (extname(entry.name) === '.js') files.push(path);
  }

  return files;
}

const files = await listJavaScriptFiles(assetsDir);
const assetReferences = new Set();
let convertedCount = 0;

for (const file of files) {
  const source = await readFile(file, 'utf8');
  const prepared = source.replace(localAssetPattern, (_literal, _quote, assetReference) => {
    convertedCount += 1;
    assetReferences.add(assetReference);
    return JSON.stringify(assetReference);
  });

  for (const match of prepared.matchAll(compatibleAssetPattern)) assetReferences.add(match[1]);
  if (prepared !== source) await writeFile(file, prepared);
}

if (!assetReferences.size) {
  throw new Error('qupload 资源准备失败：构建 JS 中没有发现本地图片引用');
}

for (const assetReference of assetReferences) {
  const relativePath = assetReference.replace(/^\.\//, '').replace(/^\//, '');
  await access(resolve(distDir, relativePath));
}

console.log(`qupload 资源准备完成：${convertedCount} 处字符串已转换，${assetReferences.size} 个本地图片等待上传`);
