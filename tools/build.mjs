import { mkdir, copyFile, readFile, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const files = ['index.html', 'style.css', 'scripts.js', 'assets/favicon.svg',
  'assets/louayPic.jpg', 'assets/sudoku.png', 'assets/FR.png',
  'assets/Chess.zip', 'assets/FlappyBird.zip', 'assets/Louay-Dridi-Resume.pdf',
  'assets/neural-learning-curves.png'];
const html = await readFile(resolve(root, 'index.html'), 'utf8');
for (const match of html.matchAll(/(?:href|src)="(assets\/[^"?#]+)"/g)) {
  if (!files.includes(match[1])) throw new Error(`Local asset is not included in the build: ${match[1]}`);
}
for (const file of files) {
  const source = resolve(root, file);
  if (!(await stat(source)).isFile()) throw new Error(`Missing public asset: ${file}`);
  const destination = resolve(root, 'dist', file);
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(source, destination);
}
console.log(`Built ${files.length} public files in dist/. Server code, dependencies, and secrets are excluded.`);
