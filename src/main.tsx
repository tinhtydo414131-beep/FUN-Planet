import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

// Force clear Supabase cache on app start to ensure fresh data
const clearSupabaseCache = async () => {
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        if (name.includes('supabase') || name.includes('workbox-runtime')) {
          await caches.delete(name);
          console.log(`Cleared cache: ${name}`);
        }
      }
    } catch (error) {
      console.log('Cache clear error:', error);
    }
  }
};

// Force clear outdated caches on app start
if ('serviceWorker' in navigator) {
  clearSupabaseCache();
  
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.update();
    });
  });
  
  // Listen for SW updates and reload immediately
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}

createRoot(document.getElementById("root")!).render(<App />);
