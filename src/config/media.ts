/**
 * Cloudflare R2 CDN Configuration for FUN Planet
 * All media files are served from this CDN
 */

export const R2_CDN_BASE = "https://pub-f2a4321a84154942a59e7ed2e803b52c.r2.dev";

/**
 * Get the full CDN URL for a media file
 * @param path - The path to the media file (e.g., "/videos/hero.mp4")
 * @returns The full CDN URL
 */
export const getMediaUrl = (path: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${R2_CDN_BASE}/${cleanPath}`;
};

/**
 * Image optimization parameters for Cloudflare Images
 */
export interface ImageOptimizationParams {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png' | 'auto';
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
}

/**
 * Get optimized image URL with Cloudflare Image Resizing params
 * @param url - The original image URL
 * @param params - Optimization parameters
 * @returns Optimized image URL
 */
export const getOptimizedImageUrl = (
  url: string,
  params: ImageOptimizationParams = {}
): string => {
  const {
    width = 800,
    height,
    quality = 80,
    format = 'webp',
    fit = 'scale-down'
  } = params;

  const queryParams = new URLSearchParams();
  queryParams.set('width', width.toString());
  if (height) queryParams.set('height', height.toString());
  queryParams.set('quality', quality.toString());
  queryParams.set('format', format);
  queryParams.set('fit', fit);

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${queryParams.toString()}`;
};

/**
 * Preset image sizes for common use cases
 */
export const IMAGE_PRESETS = {
  thumbnail: { width: 150, height: 150, quality: 75, format: 'webp' as const },
  small: { width: 320, quality: 80, format: 'webp' as const },
  medium: { width: 640, quality: 80, format: 'webp' as const },
  large: { width: 1024, quality: 85, format: 'webp' as const },
  hero: { width: 1920, quality: 90, format: 'webp' as const },
  avatar: { width: 200, height: 200, quality: 80, format: 'webp' as const, fit: 'cover' as const },
  gameThumbnail: { width: 400, height: 300, quality: 80, format: 'webp' as const, fit: 'cover' as const },
};

/**
 * Get image URL with preset optimization
 * @param url - The original image URL
 * @param preset - Preset name from IMAGE_PRESETS
 * @returns Optimized image URL
 */
export const getPresetImageUrl = (
  url: string,
  preset: keyof typeof IMAGE_PRESETS
): string => {
  return getOptimizedImageUrl(url, IMAGE_PRESETS[preset]);
};

// Pre-defined media URLs for common assets
export const MEDIA_URLS = {
  // Audio files
  audio: {
    coinReward: `${R2_CDN_BASE}/audio/coin-reward.mp3`,
    rich1: `${R2_CDN_BASE}/audio/rich1.mp3`,
    rich1_3: `${R2_CDN_BASE}/audio/rich1-3.mp3`,
    rich1_5: `${R2_CDN_BASE}/audio/rich1-5.mp3`,
    rich1_6: `${R2_CDN_BASE}/audio/rich1-6.mp3`,
    radiantDreamland: `${R2_CDN_BASE}/audio/radiant-dreamland.mp3`,
    angelOfTheStars: `${R2_CDN_BASE}/audio/angel-of-the-stars.mp3`,
  },
  // Video files
  videos: {
    heroBackground: `${R2_CDN_BASE}/videos/hero-background.mp4`,
    heroBackgroundLatest: `${R2_CDN_BASE}/videos/hero-background-latest.mp4`,
  },
  // Game images
  games: {
    platformer: `${R2_CDN_BASE}/images/games/platformer.jpg`,
    cityCreator: `${R2_CDN_BASE}/images/games/city-creator.jpg`,
    happyKitchenJoy: `${R2_CDN_BASE}/images/games/happy-kitchen-joy.jpg`,
  },
} as const;

/**
 * Supported upload folders
 */
export const UPLOAD_FOLDERS = [
  'avatars',
  'games',
  'music',
  'videos',
  'chat-attachments',
  'voice-messages',
  'stories',
  'posts',
  'covers',
  'uploads',
] as const;

export type UploadFolder = typeof UPLOAD_FOLDERS[number];
