const CACHE_NAME = 'emera-player-v1';

// Lista de ficheiros e bibliotecas essenciais para guardar no cache offline
const urlsToCache = [
    './',
    './index.html',
    'https://cdnjs.cloudflare.com/ajax/libs/jsmediatags/3.9.5/jsmediatags.min.js',
    'https://cdn.jsdelivr.net/npm/mobile-drag-drop@2.3.0-rc.2/default.css',
    'https://cdn.jsdelivr.net/npm/mobile-drag-drop@2.3.0-rc.2/index.min.js',
    'https://cdn.tailwindcss.com'
];

self.addEventListener('install', event => {
    // Força a ativação imediata do novo Service Worker
    self.skipWaiting();
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[ServiceWorker] A criar cache da aplicação...');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[ServiceWorker] A limpar cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Garante que a página atual comece a usar o SW atualizado imediatamente
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    // Apenas lidamos com requisições GET (ignora POST e extensões do Chrome)
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Retorna do cache se encontrar, senão vai à internet (rede)
                return response || fetch(event.request).then(fetchResponse => {
                    // Armazena dinamicamente novos ficheiros carregados na rede
                    return caches.open(CACHE_NAME).then(cache => {
                        // Só guarda no cache requisições HTTP válidas
                        if (event.request.url.startsWith('http')) {
                            cache.put(event.request, fetchResponse.clone());
                        }
                        return fetchResponse;
                    });
                });
            }).catch(() => {
                // Opcional: Retornar uma resposta em branco ou um alerta caso esteja totalmente offline e sem cache
                return new Response('Offline - O recurso não está disponível no cache local.');
            })
    );
});
