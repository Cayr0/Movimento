// Gera dist/ (versão instalável PWA) a partir de src/app.html.
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
const app = readFileSync('src/app.html', 'utf8');
const app0 = readFileSync('src/app.html', 'utf8');
const versaoApp = (app0.match(/const VERSAO_APP = '([^']+)'/) || [])[1] || '0';
const versao = `${versaoApp}-${new Date().toISOString()}`;
// config.json (opcional): { "googleClientId": "...apps.googleusercontent.com" }. O Client ID é público, pode ir no site.
const config = existsSync('config.json') ? JSON.parse(readFileSync('config.json', 'utf8')) : {};
const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="icon-192.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Empréstimos">
<script>window.__PWA__ = true; window.__CONFIG__ = ${JSON.stringify(config)}; window.__BUILD__ = '${new Date().toISOString()}';</script>
</head>
<body>
${app}
</body>
</html>
`;
writeFileSync('dist/index.html', html);
writeFileSync('dist/manifest.webmanifest', JSON.stringify({
  name: 'Controle de Empréstimos', short_name: 'Empréstimos', lang: 'pt-BR', start_url: './', scope: './',
  display: 'standalone', background_color: '#f5f4ef', theme_color: '#1f2328',
  icons: [
    { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' },
  ],
}, null, 2));
writeFileSync('dist/sw.js', `// Cache para funcionar offline. Versão: ${versao}
const CACHE = 'emprestimos-${versao}';
const ARQUIVOS = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return; // Google e afins vão direto
  // Rede primeiro (pega atualizações), cache se estiver offline.
  e.respondWith(fetch(e.request).then(r => { if (r.ok && new URL(e.request.url).origin === location.origin) { const c = r.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); } return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});
`);
copyFileSync('icon.svg', 'dist/icon.svg');
writeFileSync('dist/.nojekyll', ''); // GitHub Pages: servir os arquivos como estão
console.log('ok');
