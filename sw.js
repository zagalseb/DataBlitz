'use strict';

const CACHE_NAME = 'datablitz-v8';

const FILES_TO_CACHE = [
  '/DataBlitz/',
  '/DataBlitz/index.html',
  '/DataBlitz/login.html',
  '/DataBlitz/admin.html',
  '/DataBlitz/onboarding.html',
  '/DataBlitz/games.html',
  '/DataBlitz/game.html',
  '/DataBlitz/playbook.html',
  '/DataBlitz/summary.html',
  '/DataBlitz/analysis.html',
  '/DataBlitz/opponent.html',
  '/DataBlitz/js/app.js',
  '/DataBlitz/js/state.js',
  '/DataBlitz/js/data.js',
  '/DataBlitz/js/teamConfig.js',
  '/DataBlitz/js/supabase.js',
  '/DataBlitz/js/gameManager.js',
  '/DataBlitz/js/history.js',
  '/DataBlitz/js/drives.js',
  '/DataBlitz/js/field.js',
  '/DataBlitz/js/selectors.js',
  '/DataBlitz/js/counters.js',
  '/DataBlitz/js/export.js',
  '/DataBlitz/js/defense.js',
  '/DataBlitz/js/motionChip.js',
  '/DataBlitz/js/playLogic.js',
  '/DataBlitz/js/playbookEditor.js',
  '/DataBlitz/js/playEditor.js',
  '/DataBlitz/js/historyOverlay.js',
  '/DataBlitz/js/opponent.js',
  '/DataBlitz/css/reset.css',
  '/DataBlitz/css/tokens.css',
  '/DataBlitz/css/layout.css',
  '/DataBlitz/css/components.css',
  '/DataBlitz/Player Participation/index.html',
  '/DataBlitz/Player Participation/grade.html',
  '/DataBlitz/Player Participation/roster.html',
  '/DataBlitz/Player Participation/formations.html',
  '/DataBlitz/Player Participation/season.html',
  '/DataBlitz/Player Participation/report.html',
  '/DataBlitz/Player Participation/app.js',
  '/DataBlitz/Player Participation/styles.css',
  '/DataBlitz/icons/icon-192.png',
  '/DataBlitz/icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Solo interceptar GET requests del mismo origen
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      // Cache first: si está en caché, devuelve directo
      if (cached) return cached;
      // Si no, fetch de la red y guarda en caché
      return fetch(e.request).then(response => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return response;
      });
    })
  );
});
