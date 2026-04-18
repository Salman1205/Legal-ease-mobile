import fs from 'fs';
import path from 'path';

const root = process.cwd();
const src = path.join(root, 'data');
const dest = path.join(root, 'dist', 'data');

if (!fs.existsSync(src)) {
  console.warn('No data directory found to copy.');
  process.exit(0);
}

fs.mkdirSync(dest, { recursive: true });

for (const file of fs.readdirSync(src)) {
  const from = path.join(src, file);
  const to = path.join(dest, file);
  if (fs.statSync(from).isFile()) {
    fs.copyFileSync(from, to);
  }
}

console.log(`Copied data files to ${dest}`);
