import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

// App version for cache busting
const APP_VERSION = Date.now().toString();
console.log(`[FunPlanet] App starting, version: ${APP_VERSION}`);

// Force clear ALL caches on app start
const clearAllCaches = async () => {
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      console.log(`[FunPlanet] Found ${cacheNames.length} caches:`, cacheNames);
      
      for (const name of cacheNames) {
        await caches.delete(name);
        console.log(`[FunPlanet] Deleted cache: ${name}`);
      }
      
      console.log('[FunPlanet] All caches cleared successfully');
    } catch (error) {
      console.error('[FunPlanet] Cache clear error:', error);
    }
  }
};

// Force unregister ALL service workers
const unregisterAllServiceWorkers = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log(`[FunPlanet] Found ${registrations.length} service workers`);
      
      for (const registration of registrations) {
        const result = await registration.unregister();
        console.log(`[FunPlanet] Unregistered SW: ${result}`);
      }
      
      if (registrations.length > 0) {
        console.log('[FunPlanet] All service workers unregistered, will reload once');
      }
    } catch (error) {
      console.error('[FunPlanet] SW unregister error:', error);
    }
  }
};

// Initialize cache clearing on production
const initCacheClearing = async () => {
  // Check if we're on production domain
  const isProduction = window.location.hostname.includes('fun.rich') || 
                       window.location.hostname.includes('funplanet') ||
                       !window.location.hostname.includes('localhost');
  
  if (isProduction) {
    console.log('[FunPlanet] Production detected, clearing caches...');
    await clearAllCaches();
    await unregisterAllServiceWorkers();
  }
};

// Run cache clearing
initCacheClearing();

// Listen for SW updates and reload immediately
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('[FunPlanet] SW controller changed, reloading...');
    window.location.reload();
  });
}

createRoot(document.getElementById("root")!).render(<App />);
