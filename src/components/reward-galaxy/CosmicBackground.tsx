import React from 'react';

export const CosmicBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Holographic gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, hsl(340 70% 92%) 0%, hsl(280 65% 90%) 25%, hsl(200 70% 92%) 50%, hsl(175 55% 92%) 75%, hsl(340 70% 92%) 100%)',
          backgroundSize: '400% 400%',
          animation: 'holographic-shift 15s ease infinite',
        }}
      />
      
      {/* Radial center glow - soft holographic center */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, hsla(280, 65%, 85%, 0.3) 0%, hsla(340, 70%, 90%, 0.2) 30%, transparent 70%)',
        }}
      />
      
      {/* Soft vignette for depth */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 60%, hsla(200, 70%, 95%, 0.4) 100%)',
        }}
      />
    </div>
  );
};
