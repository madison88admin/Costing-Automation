/**
 * Service Worker for Authentication Security
 * Prevents cached access to authenticated pages after logout
 */

const CACHE_NAME = 'auth-security-v1';
const LOGOUT_TOKEN_KEY = 'logoutToken';

// Install event
self.addEventListener('install', function(event) {
    console.log('Service Worker: Installing...');
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', function(event) {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch event - intercept all requests
self.addEventListener('fetch', function(event) {
    // Only handle navigation requests (page loads)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            checkAuthenticationAndServe(event.request)
        );
    }
});

async function checkAuthenticationAndServe(request) {
    try {
        // Check if there's a logout token in localStorage
        // Note: Service workers can't directly access localStorage, so we'll use a different approach
        const response = await fetch(request, {
            cache: 'no-store', // Force fresh request
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        
        // If this is the login page, allow it
        if (request.url.includes('login.html')) {
            return response;
        }
        
        // For other pages, check if they should be accessible
        // We'll let the client-side authentication handle this
        // but ensure we're not serving cached content
        if (response.ok) {
            // Clone the response to modify headers
            const newResponse = new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: new Headers(response.headers)
            });
            
            // Add security headers
            newResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
            newResponse.headers.set('Pragma', 'no-cache');
            newResponse.headers.set('Expires', '0');
            newResponse.headers.set('X-Frame-Options', 'DENY');
            newResponse.headers.set('X-Content-Type-Options', 'nosniff');
            
            return newResponse;
        }
        
        return response;
    } catch (error) {
        console.error('Service Worker: Error serving request:', error);
        // Fallback to network request
        return fetch(request);
    }
}

// Message event for communication with main thread
self.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'LOGOUT') {
        console.log('Service Worker: Logout detected, clearing caches...');
        // Clear all caches when logout occurs
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    return caches.delete(cacheName);
                })
            );
        });
    }
});
