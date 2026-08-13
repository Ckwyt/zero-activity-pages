import { access, rename } from 'node:fs/promises';
import { constants } from 'node:fs';

const source = new URL('../dist/index.html', import.meta.url);
const target = new URL('../dist/ai-plugin-campaign.html', import.meta.url);

await access(source, constants.R_OK);
await rename(source, target);
console.log('Online entry prepared: dist/ai-plugin-campaign.html');
