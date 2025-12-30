import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

// App version for cache busting - force new version
const APP_VERSION = "2024-12-30-v2";
console.log(`[FunPlanet] App starting, version: ${APP_VERSION}`);

// Force clear ALL caches immediately
const clearAllCaches = async () => {
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      console.log(`[FunPlanet] Found ${cacheNames.length} caches:`, cacheNames);
      
      await Promise.all(cacheNames.map(async (name) => {
        const deleted = await caches.delete(name);
        console.log(`[FunPlanet] Deleted cache "${name}": ${deleted}`);
      }));
      
      console.log('[FunPlanet] All caches cleared successfully');
    } catch (error) {
      console.error('[FunPlanet] Cache clear error:', error);
    }
  }
};

// Force unregister ALL service workers immediately
const unregisterAllServiceWorkers = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log(`[FunPlanet] Found ${registrations.length} service workers`);
      
      await Promise.all(registrations.map(async (registration) => {
        const result = await registration.unregister();
        console.log(`[FunPlanet] Unregistered SW: ${result}`);
      }));
      
      console.log('[FunPlanet] All service workers unregistered');
    } catch (error) {
      console.error('[FunPlanet] SW unregister error:', error);
    }
  }
};

// Clear localStorage cache keys
const clearLocalStorageCache = () => {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('cache') || key.includes('sw') || key.includes('workbox'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`[FunPlanet] Removed localStorage key: ${key}`);
    });
  } catch (error) {
    console.error('[FunPlanet] LocalStorage clear error:', error);
  }
};

// Run cache clearing immediately - always clear on every app start
(async () => {
  console.log('[FunPlanet] Clearing all caches and service workers...');
  clearLocalStorageCache();
  await clearAllCaches();
  await unregisterAllServiceWorkers();
  console.log('[FunPlanet] Cache clearing complete');
})();

// Listen for SW updates and reload immediately
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('[FunPlanet] SW controller changed, reloading...');
    window.location.reload();
  });
}

createRoot(document.getElementById("root")!).render(<App />);
