// Copies the built index.html to 404.html so GitHub Pages serves the SPA on
// deep-link refreshes (Pages returns 404.html for unknown paths).
import { copyFileSync } from 'node:fs';

copyFileSync('dist/index.html', 'dist/404.html');
console.log('SPA fallback: dist/404.html written');
