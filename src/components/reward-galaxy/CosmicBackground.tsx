import React from 'react';

export const CosmicBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient - Light pastel white theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-purple-50/50 to-pink-50/50" />
      
      {/* Radial center glow - soft pastel center */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(255,235,180,0.2) 0%, rgba(255,182,193,0.1) 30%, transparent 70%)',
        }}
      />
      
      {/* Soft vignette for depth */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 60%, rgba(255,240,245,0.3) 100%)',
        }}
      />
    </div>
  );
};
