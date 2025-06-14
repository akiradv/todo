// Nome do cache
const CACHE_NAME = 'todo-app-v2';

// Arquivos para cache
const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './manifest.json',
  './icons/icon.svg',
  './icons/icon-72x72.png',
  './icons/icon-96x96.png',
  './icons/icon-128x128.png',
  './icons/icon-144x144.png',
  './icons/icon-152x152.png',
  './icons/icon-192x192.png',
  './icons/icon-384x384.png',
  './icons/icon-512x512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap'
];

// Instalação do service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Ativação do service worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptação de requisições
self.addEventListener('fetch', event => {
  // Estratégia de cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - retorna a resposta do cache
        if (response) {
          // Para recursos não críticos, retorna do cache imediatamente
          // e atualiza o cache em segundo plano
          const fetchPromise = fetch(event.request).then(networkResponse => {
            // Verifica se a resposta é válida
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                if (!event.request.url.includes('?')) {
                  cache.put(event.request, responseToCache);
                }
              });
            }
            return networkResponse;
          }).catch(() => {
            // Falha na rede, já estamos retornando do cache
            console.log('Falha na rede, usando cache para:', event.request.url);
          });
          
          // Para recursos não HTML, retorna do cache imediatamente
          if (!event.request.url.endsWith('.html') && !event.request.url.endsWith('/')) {
            // Atualiza o cache em segundo plano
            event.waitUntil(fetchPromise);
            return response;
          }
          
          // Para HTML, tenta a rede primeiro para obter a versão mais recente
          return fetchPromise.catch(() => response);
        }

        // Não encontrado no cache, tenta a rede
        return fetch(event.request.clone()).then(response => {
          // Verifica se a resposta é válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone da resposta
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            // Não armazena em cache requisições com query strings
            if (!event.request.url.includes('?')) {
              cache.put(event.request, responseToCache);
            }
          });

          return response;
        });
      })
  );
});

// Evento de sincronização em segundo plano
self.addEventListener('sync', event => {
  if (event.tag === 'sync-tasks') {
    console.log('Sincronizando tarefas em segundo plano');
    // Aqui poderia implementar sincronização com um servidor
  }
});