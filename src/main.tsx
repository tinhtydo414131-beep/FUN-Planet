import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

// App version for cache busting - force new version
const APP_VERSION = "2026-01-16-v4";
const VERSION_KEY = 'fun-planet-app-version';

console.log(`[FunPlanet] App starting, version: ${APP_VERSION}`);

// Theme version for automatic preference reset when theme updates
const THEME_VERSION = "2026-01-11-v1";
const THEME_VERSION_KEY = "fun-planet-theme-version";
const THEME_KEY = "fun-planet-theme";

// Force clear ALL caches with timeout protection
const clearAllCaches = async () => {
  if ('caches' in window) {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<void>((_, reject) => 
        window.setTimeout(() => reject(new Error('Cache clear timeout')), 3000)
      );
      
      const clearPromise = (async () => {
        const cacheNames = await caches.keys();
        console.log(`[FunPlanet] Found ${cacheNames.length} caches:`, cacheNames);
        
        await Promise.all(cacheNames.map(async (name) => {
          const deleted = await caches.delete(name);
          console.log(`[FunPlanet] Deleted cache "${name}": ${deleted}`);
        }));
        
        console.log('[FunPlanet] All caches cleared successfully');
      })();
      
      await Promise.race([clearPromise, timeoutPromise]);
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

// Clear old theme when version changes - auto-reset theme preferences on updates
const clearOldTheme = () => {
  try {
    const savedThemeVersion = localStorage.getItem(THEME_VERSION_KEY);
    
    if (savedThemeVersion !== THEME_VERSION) {
      // Theme version has changed - clear old theme preference
      localStorage.removeItem(THEME_KEY);
      localStorage.setItem(THEME_VERSION_KEY, THEME_VERSION);
      
      // Remove dark class to ensure fresh start with light theme
      document.documentElement.classList.remove("dark");
      
      console.log(`[FunPlanet] Theme version updated: ${savedThemeVersion} → ${THEME_VERSION}`);
      console.log('[FunPlanet] Old theme preference cleared');
    }
  } catch (error) {
    console.error('[FunPlanet] Theme clear error:', error);
  }
};

// Clear old cookies including sidebar state
const clearOldCookies = () => {
  try {
    document.cookie = "sidebar:state=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    console.log('[FunPlanet] Old cookies cleared');
  } catch (error) {
    console.error('[FunPlanet] Cookie clear error:', error);
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

// Run synchronous operations first (non-blocking)
clearOldTheme();
clearOldCookies();
clearLocalStorageCache();

// Listen for SW updates with reload protection
let refreshing = false;
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    console.log('[FunPlanet] SW controller changed, reloading...');
    window.location.reload();
  });
}

// Render app immediately - không dùng version check để tránh reload loop
createRoot(document.getElementById("root")!).render(<App />);

// Clear caches and service workers asynchronously (after render)
(async () => {
  console.log('[FunPlanet] Clearing caches in background...');
  try {
    await clearAllCaches();
    await unregisterAllServiceWorkers();
    console.log('[FunPlanet] Background cache clearing complete');
  } catch (error) {
    console.error('[FunPlanet] Background cache clearing error:', error);
  }
})();
