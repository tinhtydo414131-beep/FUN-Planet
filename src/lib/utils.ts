import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert a relative path to an absolute URL for Edge Function consumption
 * Handles: R2 URLs, Supabase storage URLs, and relative paths
 */
export function getAbsoluteAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  
  // Already absolute URL (R2, Supabase, or any https URL)
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Relative path - convert to absolute using current origin
  if (path.startsWith('/')) {
    return `${window.location.origin}${path}`;
  }
  
  // Relative without leading slash
  return `${window.location.origin}/${path}`;
}
