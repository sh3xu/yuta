import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'data', 'example-character', 'hiyori');
const dest = join(root, 'apps', 'desktop', 'public', 'characters', 'hiyori');
const coreDest = join(root, 'apps', 'desktop', 'public', 'lib', 'live2dcubismcore.min.js');
const coreUrl = 'https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js';

function copyDir(from, to) {
  mkdirSync(to, { recursive: true });
  for (const entry of readdirSync(from)) {
    const fromPath = join(from, entry);
    const toPath = join(to, entry);
    if (statSync(fromPath).isDirectory()) {
      copyDir(fromPath, toPath);
    } else {
      copyFileSync(fromPath, toPath);
    }
  }
}

if (existsSync(source)) {
  copyDir(source, dest);
  console.log('Copied Hiyori model into the desktop public folder.');
} else {
  console.warn('Hiyori source missing at data/example-character/hiyori');
}

if (!existsSync(coreDest)) {
  mkdirSync(dirname(coreDest), { recursive: true });
  const response = await fetch(coreUrl);
  if (!response.ok) {
    throw new Error(`Failed to download Cubism Core: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const { writeFileSync } = await import('node:fs');
  writeFileSync(coreDest, buffer);
  console.log('Downloaded live2dcubismcore.min.js');
} else {
  console.log('Cubism Core already present.');
}
