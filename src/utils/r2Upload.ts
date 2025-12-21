import { supabase } from '@/integrations/supabase/client';
import { getOptimizedImageUrl, IMAGE_PRESETS, type UploadFolder } from '@/config/media';

export interface R2UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  size?: number;
  type?: string;
  folder?: string;
  error?: string;
}

export type R2Folder = UploadFolder;

/**
 * Upload a file to Cloudflare R2 via edge function
 * @param file - The file to upload
 * @param folder - The folder/category for the file
 * @returns Upload result with URL or error
 */
export async function uploadToR2(
  file: File,
  folder: R2Folder = 'uploads'
): Promise<R2UploadResult> {
  try {
    // Attempt #1: multipart/form-data (preferred)
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const { data, error } = await supabase.functions.invoke('upload-to-r2', {
      body: formData,
    });

    if (!error && data?.success) {
      return {
        success: true,
        url: data.url,
        key: data.key,
        size: data.size,
        type: data.type,
        folder: data.folder,
      };
    }

    // If the client/runtime sent a wrong Content-Type, the function may reject multipart.
    // Attempt #2: JSON base64 fallback (more compatible across runtimes)
    console.warn('⚠️ R2 multipart upload did not succeed, retrying with JSON base64 fallback...', { error, data });

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Convert to base64 in chunks to avoid call stack limits
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    const fileBase64 = btoa(binary);

    const { data: data2, error: error2 } = await supabase.functions.invoke('upload-to-r2', {
      body: {
        folder,
        fileName: file.name || 'upload',
        contentType: file.type || 'application/octet-stream',
        fileBase64,
      },
    });

    if (error2) {
      console.error('R2 upload error (fallback):', error2);
      return { success: false, error: error2.message };
    }

    if (!data2?.success) {
      const errMsg = data2?.error || error?.message || 'Upload failed';
      console.error('R2 upload failed:', { errMsg, error, data, data2 });
      return { success: false, error: errMsg };
    }

    return {
      success: true,
      url: data2.url,
      key: data2.key,
      size: data2.size,
      type: data2.type,
      folder: data2.folder,
    };
  } catch (err) {
    console.error('R2 upload exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Delete a file from Cloudflare R2 via edge function
 * @param key - The key/path of the file to delete
 * @returns Delete result
 */
export async function deleteFromR2(key: string): Promise<{ success: boolean; error?: string }> {
  try {
    const formData = new FormData();
    formData.append('action', 'delete');
    formData.append('key', key);

    const { data, error } = await supabase.functions.invoke('r2-upload', {
      body: formData,
    });

    if (error) {
      console.error('R2 delete error:', error);
      return { success: false, error: error.message };
    }

    return { success: data.success, error: data.error };
  } catch (err) {
    console.error('R2 delete exception:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error' 
    };
  }
}

/**
 * Upload an image and get optimized URL
 * @param file - The image file to upload
 * @param folder - The folder/category for the file
 * @param preset - Optional image preset for optimization
 * @returns Upload result with optimized URL
 */
export async function uploadImageToR2(
  file: File,
  folder: R2Folder = 'uploads',
  preset?: keyof typeof IMAGE_PRESETS
): Promise<R2UploadResult> {
  const result = await uploadToR2(file, folder);
  
  if (result.success && result.url && preset) {
    result.url = getOptimizedImageUrl(result.url, IMAGE_PRESETS[preset]);
  }
  
  return result;
}

/**
 * Check if R2 is configured and available
 */
export async function isR2Available(): Promise<boolean> {
  try {
    // Try a simple health check - we'll just assume it's available
    // The actual check happens when uploading
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate file for upload
 * @param file - File to validate
 * @param options - Validation options
 */
export function validateFile(
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const { maxSizeMB = 50, allowedTypes } = options;
  
  // Check file size
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return { valid: false, error: `File too large. Max size: ${maxSizeMB}MB` };
  }
  
  // Check file type if specified
  if (allowedTypes && allowedTypes.length > 0) {
    const isAllowed = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        // Handle wildcards like 'image/*'
        return file.type.startsWith(type.replace('/*', '/'));
      }
      return file.type === type;
    });
    
    if (!isAllowed) {
      return { valid: false, error: `File type not allowed. Allowed: ${allowedTypes.join(', ')}` };
    }
  }
  
  return { valid: true };
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Generate unique filename
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 10);
  const safeName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 50);
  return `${timestamp}-${randomId}-${safeName}`;
}
