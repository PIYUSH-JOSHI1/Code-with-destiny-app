// Service Worker for Code with Destiny PWA
const CACHE_NAME = 'code-with-destiny-v1';
const RUNTIME_CACHE = 'code-with-destiny-runtime';

// Assets to cache on install
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/manifest.json',
  '/public/images/1.png',
  '/public/images/2.png',
  '/public/images/3.png',
  '/public/images/4.png',
  '/public/images/image copy.png',
  '/public/images/image.png'
];

// External CDN resources
const CDN_RESOURCES = [
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://checkout.razorpay.com/v1/checkout.js',
  'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollToPlugin.min.js'
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    }).catch((error) => {
      console.error('[ServiceWorker] Install error:', error);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        // Cache hit - return response
        return response;
      }

      // Clone the request
      const fetchRequest = request.clone();

      return fetch(fetchRequest).then((response) => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Clone response for caching
        const responseToCache = response.clone();

        // Cache successful network responses (runtime cache)
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      }).catch((error) => {
        console.error('[ServiceWorker] Fetch error:', error);
        
        // Return offline fallback if available
        return caches.match('/index.html');
      });
    })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(RUNTIME_CACHE).then(() => {
      console.log('[ServiceWorker] Runtime cache cleared');
    });
  }
});

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-form') {
    event.waitUntil(syncFormData());
  }
});

async function syncFormData() {
  try {
    const db = await openIndexedDB();
    const forms = await getOfflineFormsFromDB(db);
    
    for (const form of forms) {
      try {
        await fetch(form.action, {
          method: form.method,
          body: JSON.stringify(form.data),
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        // Remove from DB after successful sync
        await removeFormFromDB(db, form.id);
      } catch (error) {
        console.error('[ServiceWorker] Form sync failed:', error);
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Background sync error:', error);
    throw error;
  }
}

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CodeWithDestiny', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offlineForms')) {
        db.createObjectStore('offlineForms', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getOfflineFormsFromDB(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offlineForms'], 'readonly');
    const store = transaction.objectStore('offlineForms');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function removeFormFromDB(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offlineForms'], 'readwrite');
    const store = transaction.objectStore('offlineForms');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

console.log('[ServiceWorker] Service Worker loaded');
