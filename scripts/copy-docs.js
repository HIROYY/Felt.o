import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const docsDir = path.resolve('docs');

if (fs.existsSync(distDir)) {
  // Ensure .nojekyll exists in dist, docs, and root to disable Jekyll processing on GitHub Pages
  fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
  fs.writeFileSync(path.resolve('.nojekyll'), '');

  // Copy dist/index.html to dist/404.html for GitHub Pages SPA fallback
  const distIndex = path.join(distDir, 'index.html');
  if (fs.existsSync(distIndex)) {
    fs.copyFileSync(distIndex, path.join(distDir, '404.html'));
  }

  // Copy dist to docs directory for "Deploy from /docs folder" support
  fs.cpSync(distDir, docsDir, { recursive: true, force: true });
  fs.writeFileSync(path.join(docsDir, '.nojekyll'), '');
  
  console.log('✓ Compilación copiada a docs/ con .nojekyll y 404.html para máxima compatibilidad con GitHub Pages.');
}
