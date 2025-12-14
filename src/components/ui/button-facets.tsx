export const ButtonFacets = () => {
  return (
    <>
      {/* Ambient purple diamond glow */}
      <div className="absolute inset-[-8px] rounded-2xl opacity-40 pointer-events-none" 
        style={{ 
          background: "radial-gradient(ellipse at center, rgba(168,85,247,0.4) 0%, rgba(139,92,246,0.2) 40%, transparent 70%)",
          filter: "blur(12px)"
        }} 
      />
      
      {/* Outer girdle ring with luminous edge */}
      <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
        <div 
          className="absolute inset-[1px] rounded-xl animate-[shimmer_4s_ease-in-out_infinite]"
          style={{ 
            border: "1px solid rgba(255,255,255,0.4)",
            boxShadow: "inset 0 0 8px rgba(168,85,247,0.3), 0 0 6px rgba(255,255,255,0.3)"
          }}
        />
      </div>

      {/* Brilliant cut diamond facet pattern */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        
        {/* Center star pattern - 8 triangular facets radiating from center */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <div 
            key={angle}
            className="absolute top-1/2 left-1/2 w-[45%] h-[3px] origin-left"
            style={{ 
              transform: `translate(-50%, -50%) rotate(${angle}deg) translateX(0)`,
              background: `linear-gradient(90deg, rgba(168,85,247,0.8) 0%, rgba(255,255,255,0.9) 40%, rgba(139,92,246,0.6) 70%, transparent 100%)`,
              boxShadow: "0 0 4px rgba(255,255,255,0.5)",
              opacity: 0.7 + (i % 2) * 0.2
            }}
          />
        ))}

        {/* Inner star rays - shorter accent lines */}
        {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((angle) => (
          <div 
            key={`inner-${angle}`}
            className="absolute top-1/2 left-1/2 w-[25%] h-[2px] origin-left"
            style={{ 
              transform: `translate(-50%, -50%) rotate(${angle}deg) translateX(0)`,
              background: `linear-gradient(90deg, rgba(216,180,254,0.9) 0%, rgba(255,255,255,0.8) 50%, transparent 100%)`,
              boxShadow: "0 0 3px rgba(255,255,255,0.4)",
              opacity: 0.6
            }}
          />
        ))}

        {/* Crown facets - 8 kite-shaped facets around the table */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <div 
            key={`crown-${angle}`}
            className="absolute top-1/2 left-1/2 w-[40%] h-[40%] animate-[shimmer_3s_ease-in-out_infinite]"
            style={{ 
              transform: `translate(-50%, -50%) rotate(${angle}deg)`,
              clipPath: "polygon(50% 0%, 65% 35%, 50% 50%, 35% 35%)",
              background: i % 2 === 0 
                ? "linear-gradient(180deg, rgba(168,85,247,0.5) 0%, rgba(139,92,246,0.7) 50%, rgba(88,28,135,0.4) 100%)"
                : "linear-gradient(180deg, rgba(216,180,254,0.6) 0%, rgba(168,85,247,0.5) 50%, rgba(107,33,168,0.4) 100%)",
              animationDelay: `${i * 0.15}s`
            }}
          />
        ))}

        {/* Pavilion main facets - larger triangular facets */}
        {[0, 90, 180, 270].map((angle, i) => (
          <div 
            key={`pavilion-${angle}`}
            className="absolute top-1/2 left-1/2 w-[70%] h-[70%]"
            style={{ 
              transform: `translate(-50%, -50%) rotate(${angle}deg)`,
              clipPath: "polygon(50% 50%, 15% 0%, 50% 0%, 85% 0%)",
              background: "linear-gradient(180deg, rgba(126,34,206,0.3) 0%, rgba(168,85,247,0.5) 40%, rgba(88,28,135,0.6) 100%)",
              opacity: 0.6
            }}
          />
        ))}

        {/* Secondary pavilion facets */}
        {[45, 135, 225, 315].map((angle, i) => (
          <div 
            key={`pavilion2-${angle}`}
            className="absolute top-1/2 left-1/2 w-[60%] h-[60%]"
            style={{ 
              transform: `translate(-50%, -50%) rotate(${angle}deg)`,
              clipPath: "polygon(50% 50%, 25% 0%, 50% 5%, 75% 0%)",
              background: "linear-gradient(180deg, rgba(192,132,252,0.4) 0%, rgba(139,92,246,0.5) 50%, rgba(107,33,168,0.5) 100%)",
              opacity: 0.5
            }}
          />
        ))}

        {/* Table facet - center octagon */}
        <div 
          className="absolute top-1/2 left-1/2 w-[30%] h-[30%] animate-[pulse_2.5s_ease-in-out_infinite]"
          style={{ 
            transform: "translate(-50%, -50%)",
            clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
            background: "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(216,180,254,0.4) 30%, rgba(168,85,247,0.5) 60%, rgba(139,92,246,0.6) 100%)",
            boxShadow: "inset 0 0 10px rgba(255,255,255,0.4)"
          }}
        />

        {/* Culet center point */}
        <div 
          className="absolute top-1/2 left-1/2 w-[8%] h-[8%] animate-[sparkle_1.5s_ease-in-out_infinite]"
          style={{ 
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(216,180,254,0.6) 40%, transparent 70%)",
            boxShadow: "0 0 8px rgba(255,255,255,0.8)"
          }}
        />
      </div>

      {/* Facet edge highlights - luminous cuts */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-70">
        {/* Radial facet edges */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
          <div 
            key={`edge-${angle}`}
            className="absolute top-1/2 left-1/2 w-[48%] h-[1px] origin-left animate-[shimmer_2.5s_ease-in-out_infinite]"
            style={{ 
              transform: `rotate(${angle}deg)`,
              background: "linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(216,180,254,0.7) 30%, rgba(168,85,247,0.5) 60%, transparent 100%)",
              boxShadow: "0 0 3px rgba(255,255,255,0.5)",
              animationDelay: `${i * 0.1}s`
            }}
          />
        ))}

        {/* Concentric octagon rings */}
        <div 
          className="absolute top-1/2 left-1/2 w-[60%] h-[60%]"
          style={{ 
            transform: "translate(-50%, -50%)",
            clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
            border: "1px solid rgba(255,255,255,0.4)",
            boxShadow: "0 0 4px rgba(168,85,247,0.5)"
          }}
        />
        <div 
          className="absolute top-1/2 left-1/2 w-[80%] h-[80%]"
          style={{ 
            transform: "translate(-50%, -50%)",
            clipPath: "polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)",
            border: "1px solid rgba(216,180,254,0.3)",
            boxShadow: "0 0 3px rgba(139,92,246,0.4)"
          }}
        />
      </div>

      {/* Sparkle highlights */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Primary sparkles */}
        <div 
          className="absolute top-[20%] left-[30%] w-3 h-3 bg-white rounded-full blur-[2px] opacity-90 animate-[sparkle_1.5s_ease-in-out_infinite]"
          style={{ boxShadow: "0 0 10px 3px rgba(255,255,255,0.8)" }}
        />
        <div 
          className="absolute top-[25%] right-[25%] w-2.5 h-2.5 bg-purple-200 rounded-full blur-[2px] opacity-80 animate-[sparkle_1.8s_ease-in-out_infinite]"
          style={{ animationDelay: "0.3s", boxShadow: "0 0 8px 2px rgba(216,180,254,0.7)" }}
        />
        <div 
          className="absolute bottom-[30%] left-[25%] w-2 h-2 bg-violet-300 rounded-full blur-[1px] opacity-75 animate-[sparkle_1.6s_ease-in-out_infinite]"
          style={{ animationDelay: "0.6s", boxShadow: "0 0 6px 2px rgba(167,139,250,0.6)" }}
        />
        <div 
          className="absolute bottom-[25%] right-[30%] w-2.5 h-2.5 bg-white rounded-full blur-[2px] opacity-85 animate-[sparkle_1.4s_ease-in-out_infinite]"
          style={{ animationDelay: "0.9s", boxShadow: "0 0 8px 3px rgba(255,255,255,0.8)" }}
        />
        {/* Center highlight */}
        <div 
          className="absolute top-1/2 left-1/2 w-4 h-4 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full blur-[3px] opacity-60 animate-[pulse_2s_ease-in-out_infinite]"
          style={{ boxShadow: "0 0 15px 5px rgba(255,255,255,0.5)" }}
        />
      </div>
      
      {/* Prismatic color overlay */}
      <div 
        className="absolute inset-0 rounded-xl opacity-20 pointer-events-none animate-[pulse_4s_ease-in-out_infinite]"
        style={{ 
          background: "conic-gradient(from 0deg at 50% 50%, rgba(168,85,247,0.5), rgba(139,92,246,0.4), rgba(216,180,254,0.5), rgba(192,132,252,0.4), rgba(168,85,247,0.5))",
          filter: "blur(8px)"
        }}
      />
    </>
  );
};