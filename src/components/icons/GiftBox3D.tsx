import React from 'react';

interface GiftBox3DProps {
  size?: number | string;
  className?: string;
}

export const GiftBox3D: React.FC<GiftBox3DProps> = ({ size = 64, className = '' }) => {
  const numericSize = typeof size === 'string' ? parseInt(size, 10) : size;
  
  return (
    <svg
      width={numericSize}
      height={numericSize}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ filter: 'drop-shadow(0 4px 8px rgba(234, 88, 12, 0.4))' }}
    >
      <defs>
        {/* Main gradient - Golden Orange */}
        <linearGradient id="giftBoxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
        
        {/* Lid gradient - Lighter */}
        <linearGradient id="giftLidGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        
        {/* Ribbon gradient */}
        <linearGradient id="ribbonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#FBBF24" />
        </linearGradient>
        
        {/* Shadow gradient */}
        <linearGradient id="shadowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#C2410C" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#7C2D12" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      
      {/* Box body */}
      <rect
        x="10"
        y="28"
        width="44"
        height="30"
        rx="4"
        fill="url(#giftBoxGradient)"
      />
      
      {/* Box body shadow/depth */}
      <rect
        x="10"
        y="48"
        width="44"
        height="10"
        rx="0"
        fill="url(#shadowGradient)"
        style={{ borderRadius: '0 0 4px 4px' }}
      />
      
      {/* Lid */}
      <rect
        x="6"
        y="20"
        width="52"
        height="10"
        rx="3"
        fill="url(#giftLidGradient)"
      />
      
      {/* Left bow loop */}
      <ellipse
        cx="24"
        cy="14"
        rx="8"
        ry="10"
        fill="url(#ribbonGradient)"
        stroke="#F59E0B"
        strokeWidth="1.5"
      />
      
      {/* Right bow loop */}
      <ellipse
        cx="40"
        cy="14"
        rx="8"
        ry="10"
        fill="url(#ribbonGradient)"
        stroke="#F59E0B"
        strokeWidth="1.5"
      />
      
      {/* Bow center knot */}
      <circle
        cx="32"
        cy="16"
        r="5"
        fill="url(#giftBoxGradient)"
        stroke="#EA580C"
        strokeWidth="1"
      />
      
      {/* Vertical ribbon on box */}
      <rect
        x="29"
        y="20"
        width="6"
        height="38"
        fill="url(#ribbonGradient)"
      />
      
      {/* Horizontal ribbon on box */}
      <rect
        x="10"
        y="36"
        width="44"
        height="6"
        fill="url(#ribbonGradient)"
      />
      
      {/* Ribbon intersection highlight */}
      <rect
        x="29"
        y="36"
        width="6"
        height="6"
        fill="#FEF3C7"
        opacity="0.6"
      />
      
      {/* Shine highlights */}
      <rect
        x="14"
        y="32"
        width="8"
        height="3"
        rx="1.5"
        fill="white"
        opacity="0.4"
      />
      <rect
        x="42"
        y="44"
        width="6"
        height="2"
        rx="1"
        fill="white"
        opacity="0.3"
      />
    </svg>
  );
};

export default GiftBox3D;
