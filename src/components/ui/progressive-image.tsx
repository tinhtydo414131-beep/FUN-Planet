import React, { useState, useEffect, useRef, forwardRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ShimmerSkeleton } from './shimmer-skeleton';

interface ProgressiveImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'onLoad' | 'onError'> {
  /** Image source URL */
  src: string;
  /** Alt text (required for accessibility) */
  alt: string;
  /** Blur placeholder - tiny base64 image or URL */
  blurPlaceholder?: string;
  /** Width for aspect ratio container */
  width?: number;
  /** Height for aspect ratio container */
  height?: number;
  /** Whether to use holographic shimmer skeleton */
  holographic?: boolean;
  /** Callback when image loads successfully */
  onLoadComplete?: () => void;
  /** Callback when image fails to load */
  onLoadError?: (error: Error) => void;
  /** Container class name */
  containerClassName?: string;
  /** Border radius variant */
  variant?: 'default' | 'rounded' | 'card';
}

type LoadingState = 'skeleton' | 'blur' | 'loaded' | 'error';

/**
 * Progressive Image component
 * Loading stages:
 * 1. Shimmer skeleton (holographic)
 * 2. Blur placeholder (if provided)
 * 3. Full image with fade-in
 * 
 * Respects reduced-motion preferences
 */
const ProgressiveImage = forwardRef<HTMLImageElement, ProgressiveImageProps>(
  (
    {
      src,
      alt,
      blurPlaceholder,
      width,
      height,
      holographic = true,
      onLoadComplete,
      onLoadError,
      className,
      containerClassName,
      variant = 'default',
      ...props
    },
    ref
  ) => {
    const [loadingState, setLoadingState] = useState<LoadingState>('skeleton');
    const imgRef = useRef<HTMLImageElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const [isInView, setIsInView] = useState(false);

    const radiusClasses = {
      default: 'rounded-md',
      rounded: 'rounded-xl',
      card: 'rounded-2xl',
    };

    // Intersection Observer for lazy loading
    useEffect(() => {
      const element = imgRef.current;
      if (!element) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsInView(true);
              observerRef.current?.disconnect();
            }
          });
        },
        {
          rootMargin: '100px', // Start loading 100px before entering viewport
          threshold: 0.01,
        }
      );

      observerRef.current.observe(element);

      return () => {
        observerRef.current?.disconnect();
      };
    }, []);

    // Load blur placeholder first (if provided)
    useEffect(() => {
      if (!isInView) return;
      
      if (blurPlaceholder) {
        const blurImg = new Image();
        blurImg.onload = () => {
          setLoadingState('blur');
        };
        blurImg.src = blurPlaceholder;
      }
    }, [isInView, blurPlaceholder]);

    // Load main image
    useEffect(() => {
      if (!isInView) return;
      if (!src) return;

      const img = new Image();
      
      img.onload = () => {
        setLoadingState('loaded');
        onLoadComplete?.();
      };
      
      img.onerror = () => {
        setLoadingState('error');
        onLoadError?.(new Error(`Failed to load image: ${src}`));
      };

      img.src = src;
    }, [isInView, src, onLoadComplete, onLoadError]);

    const handleImageRef = useCallback(
      (node: HTMLImageElement | null) => {
        imgRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref]
    );

    const aspectRatio = width && height ? width / height : undefined;

    return (
      <div
        className={cn(
          'relative overflow-hidden',
          radiusClasses[variant],
          containerClassName
        )}
        style={{
          aspectRatio: aspectRatio,
          width: width ? `${width}px` : undefined,
          height: height ? `${height}px` : undefined,
        }}
      >
        {/* Shimmer Skeleton - shown while loading */}
        {loadingState === 'skeleton' && (
          <ShimmerSkeleton
            holographic={holographic}
            className="absolute inset-0 w-full h-full"
            variant={variant}
          />
        )}

        {/* Blur Placeholder - shown after skeleton, before full image */}
        {loadingState === 'blur' && blurPlaceholder && (
          <img
            src={blurPlaceholder}
            alt=""
            aria-hidden="true"
            className={cn(
              'absolute inset-0 w-full h-full object-cover',
              'filter blur-lg scale-110', // Extra scale to cover blur edges
              radiusClasses[variant]
            )}
          />
        )}

        {/* Main Image */}
        <img
          ref={handleImageRef}
          src={isInView ? src : undefined}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={cn(
            'w-full h-full object-cover',
            radiusClasses[variant],
            // Fade-in transition
            'transition-opacity duration-300 ease-out',
            'motion-reduce:transition-none',
            loadingState === 'loaded' ? 'opacity-100' : 'opacity-0',
            className
          )}
          {...props}
        />

        {/* Error State */}
        {loadingState === 'error' && (
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center',
              'bg-muted/80 backdrop-blur-sm',
              radiusClasses[variant]
            )}
            role="img"
            aria-label={`Failed to load: ${alt}`}
          >
            <span className="text-muted-foreground text-sm">📷</span>
          </div>
        )}
      </div>
    );
  }
);

ProgressiveImage.displayName = 'ProgressiveImage';

export { ProgressiveImage };
export type { ProgressiveImageProps };
