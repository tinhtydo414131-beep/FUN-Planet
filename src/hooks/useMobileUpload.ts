import { useState, useCallback, useRef } from 'react';
import { uploadToR2 } from '@/utils/r2Upload';
import type { R2Folder } from '@/utils/r2Upload';

interface UploadOptions {
  folder: R2Folder;
  file: File;
  onProgress?: (percent: number) => void;
}

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Hook for reliable file uploads on mobile using R2
 * Uses Cloudflare R2 via edge function for reliable uploads
 */
export function useMobileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const upload = useCallback(async ({
    folder,
    file,
    onProgress
  }: UploadOptions): Promise<UploadResult> => {
    setUploading(true);
    setProgress(0);

    // Create abort controller for cancel functionality
    abortControllerRef.current = new AbortController();

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const next = Math.min(prev + 10, 90);
          onProgress?.(next);
          return next;
        });
      }, 200);

      // Upload to R2
      console.log(`📤 [MobileUpload] Uploading to R2 folder: ${folder}`);
      const result = await uploadToR2(file, folder);

      clearInterval(progressInterval);

      if (!result.success) {
        console.error('[MobileUpload] R2 upload failed:', result.error);
        return {
          success: false,
          error: result.error || 'Upload failed'
        };
      }

      console.log('✅ [MobileUpload] Upload successful:', result.url);
      setProgress(100);
      onProgress?.(100);

      return {
        success: true,
        url: result.url
      };
    } catch (error: any) {
      console.error('[MobileUpload] Error:', error);
      return {
        success: false,
        error: error.message || 'Upload failed'
      };
    } finally {
      setUploading(false);
      setProgress(100);
      abortControllerRef.current = null;
    }
  }, []);

  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setUploading(false);
    setProgress(0);
  }, []);

  return {
    upload,
    cancelUpload,
    uploading,
    progress
  };
}

/**
 * Validate audio file for mobile upload
 */
export function validateAudioForMobile(file: File): { valid: boolean; message: string } {
  const MAX_SIZE = 50 * 1024 * 1024; // 50MB
  const SUPPORTED_TYPES = [
    'audio/mpeg', 'audio/mp3',
    'audio/mp4', 'audio/m4a', 'audio/x-m4a',
    'audio/wav', 'audio/x-wav', 'audio/wave',
    'audio/ogg', 'audio/vorbis',
    'audio/flac', 'audio/x-flac'
  ];

  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      message: `File quá lớn (${(file.size / 1024 / 1024).toFixed(1)}MB). Tối đa 50MB.`
    };
  }

  const isValidType = SUPPORTED_TYPES.some(type => 
    file.type.includes(type) || file.name.toLowerCase().match(/\.(mp3|m4a|wav|ogg|flac)$/i)
  );

  if (!isValidType) {
    return {
      valid: false,
      message: 'Định dạng không hỗ trợ. Chấp nhận: MP3, M4A, WAV, OGG, FLAC'
    };
  }

  return { valid: true, message: 'OK' };
}
