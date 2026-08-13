import { readFile, readdir, stat } from 'node:fs/promises';

const dist = new URL('../dist/', import.meta.url);
const entry = new URL('ai-plugin-campaign.html', dist);
const html = await readFile(entry, 'utf8');
const assets = await readdir(new URL('assets/', dist));

if (/\b(?:src|href)="\/assets\//.test(html)) {
  throw new Error('Build contains absolute /assets paths and cannot be deployed beneath a CDN subdirectory.');
}

if (!html.includes('./assets/') || !assets.some((name) => name.endsWith('.js')) || !assets.some((name) => name.endsWith('.css'))) {
  throw new Error('Build output is incomplete: expected relative JS and CSS assets.');
}

const files = await Promise.all(
  assets.map(async (name) => ({ name, size: (await stat(new URL(`assets/${name}`, dist))).size })),
);

console.log('Build verified:', {
  entry: 'dist/ai-plugin-campaign.html',
  assets: files,
});
