import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ShimmerSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Width of skeleton */
  width?: string | number;
  /** Height of skeleton */
  height?: string | number;
  /** Use holographic gradient */
  holographic?: boolean;
  /** Border radius variant */
  variant?: 'default' | 'rounded' | 'circle' | 'card';
  /** Animation speed */
  speed?: 'slow' | 'normal' | 'fast';
}

/**
 * Shimmer Skeleton component with holographic gradient effect
 * Respects reduced-motion preferences
 */
const ShimmerSkeleton = forwardRef<HTMLDivElement, ShimmerSkeletonProps>(
  (
    {
      className,
      width,
      height,
      holographic = true,
      variant = 'default',
      speed = 'normal',
      style,
      ...props
    },
    ref
  ) => {
    const radiusClasses = {
      default: 'rounded-md',
      rounded: 'rounded-xl',
      circle: 'rounded-full',
      card: 'rounded-2xl',
    };

    const speedClasses = {
      slow: 'animate-shimmer-slow',
      normal: 'animate-shimmer',
      fast: 'animate-shimmer-fast',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden bg-muted',
          radiusClasses[variant],
          className
        )}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          ...style,
        }}
        aria-hidden="true"
        role="presentation"
        {...props}
      >
        {/* Shimmer overlay */}
        <div
          className={cn(
            'absolute inset-0',
            holographic
              ? 'bg-gradient-to-r from-transparent via-holo-shimmer to-transparent'
              : 'bg-gradient-to-r from-transparent via-white/20 to-transparent',
            speedClasses[speed],
            // Disable animation for reduced motion
            'motion-reduce:animate-none motion-reduce:bg-muted/80'
          )}
        />
      </div>
    );
  }
);

ShimmerSkeleton.displayName = 'ShimmerSkeleton';

/**
 * Pre-configured skeleton variants
 */
const CardSkeleton = forwardRef<HTMLDivElement, Omit<ShimmerSkeletonProps, 'variant'>>(
  (props, ref) => (
    <ShimmerSkeleton ref={ref} variant="card" holographic {...props} />
  )
);
CardSkeleton.displayName = 'CardSkeleton';

const AvatarSkeleton = forwardRef<HTMLDivElement, Omit<ShimmerSkeletonProps, 'variant'>>(
  ({ width = 40, height = 40, ...props }, ref) => (
    <ShimmerSkeleton ref={ref} variant="circle" width={width} height={height} holographic {...props} />
  )
);
AvatarSkeleton.displayName = 'AvatarSkeleton';

const TextSkeleton = forwardRef<HTMLDivElement, Omit<ShimmerSkeletonProps, 'variant' | 'height'>>(
  ({ width = '100%', ...props }, ref) => (
    <ShimmerSkeleton ref={ref} variant="default" width={width} height={16} holographic {...props} />
  )
);
TextSkeleton.displayName = 'TextSkeleton';

const TitleSkeleton = forwardRef<HTMLDivElement, Omit<ShimmerSkeletonProps, 'variant' | 'height'>>(
  ({ width = '60%', ...props }, ref) => (
    <ShimmerSkeleton ref={ref} variant="default" width={width} height={24} holographic {...props} />
  )
);
TitleSkeleton.displayName = 'TitleSkeleton';

/**
 * Game card skeleton with holographic effect
 */
const GameCardSkeleton = forwardRef<HTMLDivElement, { className?: string }>(
  ({ className }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex-shrink-0 w-[130px] md:w-[140px] rounded-2xl overflow-hidden',
        'bg-white/40 backdrop-blur-lg border border-white/50',
        'shadow-[0_8px_32px_rgba(243,196,251,0.15)]',
        className
      )}
    >
      {/* Thumbnail skeleton */}
      <ShimmerSkeleton variant="default" className="w-full h-[100px] md:h-[110px] rounded-none" />
      
      {/* Content */}
      <div className="p-2 space-y-1.5">
        <TextSkeleton width="80%" />
        <TextSkeleton width="50%" className="h-3" />
      </div>
    </div>
  )
);
GameCardSkeleton.displayName = 'GameCardSkeleton';

/**
 * Ranking item skeleton
 */
const RankingItemSkeleton = forwardRef<HTMLDivElement, { className?: string }>(
  ({ className }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl',
        'bg-white/35 backdrop-blur-sm border border-white/40',
        className
      )}
    >
      {/* Rank number */}
      <ShimmerSkeleton variant="circle" width={32} height={32} />
      
      {/* Avatar */}
      <AvatarSkeleton width={36} height={36} />
      
      {/* Name and stats */}
      <div className="flex-1 space-y-1.5">
        <TextSkeleton width="70%" />
        <TextSkeleton width="40%" className="h-3" />
      </div>
      
      {/* Score */}
      <ShimmerSkeleton variant="rounded" width={60} height={24} />
    </div>
  )
);
RankingItemSkeleton.displayName = 'RankingItemSkeleton';

/**
 * Leaderboard podium skeleton
 */
const PodiumSkeleton = forwardRef<HTMLDivElement, { className?: string }>(
  ({ className }, ref) => (
    <div ref={ref} className={cn('flex items-end justify-center gap-2', className)}>
      {/* 2nd place */}
      <div className="flex flex-col items-center">
        <AvatarSkeleton width={48} height={48} className="mb-2" />
        <ShimmerSkeleton variant="rounded" width={60} height={80} />
      </div>
      
      {/* 1st place */}
      <div className="flex flex-col items-center">
        <AvatarSkeleton width={56} height={56} className="mb-2" />
        <ShimmerSkeleton variant="rounded" width={70} height={100} />
      </div>
      
      {/* 3rd place */}
      <div className="flex flex-col items-center">
        <AvatarSkeleton width={44} height={44} className="mb-2" />
        <ShimmerSkeleton variant="rounded" width={55} height={60} />
      </div>
    </div>
  )
);
PodiumSkeleton.displayName = 'PodiumSkeleton';

export {
  ShimmerSkeleton,
  CardSkeleton,
  AvatarSkeleton,
  TextSkeleton,
  TitleSkeleton,
  GameCardSkeleton,
  RankingItemSkeleton,
  PodiumSkeleton,
};
