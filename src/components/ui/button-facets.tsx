export const ButtonFacets = () => {
  return (
    <>
      {/* Ambient diamond glow halo - Reduced intensity */}
      <div className="absolute inset-[-6px] rounded-2xl bg-gradient-radial from-cyan-400/15 via-purple-400/10 to-transparent blur-xl opacity-50 pointer-events-none" />
      
      {/* Luminous cut edges - outer ring */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top edge facet */}
        <div 
          className="absolute top-0 left-[10%] right-[10%] h-[2px] animate-[shimmer_2s_ease-in-out_infinite]"
          style={{ 
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.9), rgba(103,232,249,0.8), rgba(255,255,255,0.9), transparent)",
            boxShadow: "0 0 8px 2px rgba(255,255,255,0.6), 0 0 15px 4px rgba(103,232,249,0.4)",
            filter: "blur(0.5px)"
          }}
        />
        {/* Bottom edge facet */}
        <div 
          className="absolute bottom-0 left-[10%] right-[10%] h-[2px] animate-[shimmer_2s_ease-in-out_infinite]"
          style={{ 
            background: "linear-gradient(90deg, transparent, rgba(196,181,253,0.8), rgba(255,255,255,0.9), rgba(196,181,253,0.8), transparent)",
            boxShadow: "0 0 8px 2px rgba(255,255,255,0.6), 0 0 15px 4px rgba(196,181,253,0.4)",
            filter: "blur(0.5px)",
            animationDelay: "0.5s"
          }}
        />
        {/* Left edge facet */}
        <div 
          className="absolute left-0 top-[10%] bottom-[10%] w-[2px] animate-[shimmer_2.2s_ease-in-out_infinite]"
          style={{ 
            background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.9), rgba(103,232,249,0.8), rgba(255,255,255,0.9), transparent)",
            boxShadow: "0 0 8px 2px rgba(255,255,255,0.6), 0 0 15px 4px rgba(103,232,249,0.4)",
            filter: "blur(0.5px)",
            animationDelay: "0.3s"
          }}
        />
        {/* Right edge facet */}
        <div 
          className="absolute right-0 top-[10%] bottom-[10%] w-[2px] animate-[shimmer_2.2s_ease-in-out_infinite]"
          style={{ 
            background: "linear-gradient(180deg, transparent, rgba(196,181,253,0.8), rgba(255,255,255,0.9), rgba(196,181,253,0.8), transparent)",
            boxShadow: "0 0 8px 2px rgba(255,255,255,0.6), 0 0 15px 4px rgba(196,181,253,0.4)",
            filter: "blur(0.5px)",
            animationDelay: "0.8s"
          }}
        />
        
        {/* Corner cut facets - luminous diamonds */}
        <div 
          className="absolute top-0 left-0 w-4 h-4 animate-[sparkle_1.5s_ease-in-out_infinite]"
          style={{ 
            background: "radial-gradient(circle at 100% 100%, rgba(255,255,255,0.9) 0%, rgba(103,232,249,0.6) 30%, transparent 70%)",
            boxShadow: "2px 2px 10px rgba(255,255,255,0.5)"
          }}
        />
        <div 
          className="absolute top-0 right-0 w-4 h-4 animate-[sparkle_1.5s_ease-in-out_infinite]"
          style={{ 
            background: "radial-gradient(circle at 0% 100%, rgba(255,255,255,0.9) 0%, rgba(196,181,253,0.6) 30%, transparent 70%)",
            boxShadow: "-2px 2px 10px rgba(255,255,255,0.5)",
            animationDelay: "0.4s"
          }}
        />
        <div 
          className="absolute bottom-0 left-0 w-4 h-4 animate-[sparkle_1.5s_ease-in-out_infinite]"
          style={{ 
            background: "radial-gradient(circle at 100% 0%, rgba(255,255,255,0.9) 0%, rgba(251,207,232,0.6) 30%, transparent 70%)",
            boxShadow: "2px -2px 10px rgba(255,255,255,0.5)",
            animationDelay: "0.7s"
          }}
        />
        <div 
          className="absolute bottom-0 right-0 w-4 h-4 animate-[sparkle_1.5s_ease-in-out_infinite]"
          style={{ 
            background: "radial-gradient(circle at 0% 0%, rgba(255,255,255,0.9) 0%, rgba(254,240,138,0.6) 30%, transparent 70%)",
            boxShadow: "-2px -2px 10px rgba(255,255,255,0.5)",
            animationDelay: "1s"
          }}
        />
      </div>
      
      {/* Simplified diamond facets - classic brilliant cut pattern */}
      <div className="absolute inset-0 opacity-75 pointer-events-none">
        {/* Table (top center) facet */}
        <div 
          className="absolute top-[15%] left-[25%] w-[50%] h-[35%]"
          style={{ 
            clipPath: "polygon(15% 0, 85% 0, 100% 100%, 0 100%)",
          }}
        >
          <div 
            className="absolute inset-0 bg-gradient-to-b from-white/60 via-cyan-100/40 to-transparent"
            style={{ filter: "blur(0.3px)" }}
          />
          <div 
            className="absolute inset-0 animate-[shimmer_3s_ease-in-out_infinite]"
            style={{ 
              background: "linear-gradient(180deg, rgba(255,255,255,0.8) 0%, transparent 60%)",
              boxShadow: "inset 0 0 15px rgba(255,255,255,0.5)"
            }}
          />
        </div>
        
        {/* Center diamond (culet reflection) */}
        <div 
          className="absolute top-[35%] left-[30%] w-[40%] h-[30%]"
          style={{ 
            clipPath: "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)",
          }}
        >
          <div 
            className="absolute inset-0 bg-gradient-to-br from-white/50 via-cyan-200/30 to-purple-200/20"
            style={{ filter: "blur(0.5px)" }}
          />
          <div 
            className="absolute inset-0 animate-[pulse_2s_ease-in-out_infinite]"
            style={{ 
              background: "radial-gradient(ellipse at center, rgba(255,255,255,0.7) 0%, transparent 70%)",
              boxShadow: "inset 0 0 12px rgba(255,255,255,0.6)"
            }}
          />
        </div>
        
        {/* Left pavilion facet */}
        <div 
          className="absolute top-[40%] left-[8%] w-[30%] h-[45%]"
          style={{ 
            clipPath: "polygon(100% 0, 100% 60%, 0 100%)",
          }}
        >
          <div 
            className="absolute inset-0 bg-gradient-to-br from-blue-300/40 via-indigo-200/30 to-transparent"
          />
          <div 
            className="absolute inset-0 animate-[shimmer_3.5s_ease-in-out_infinite]"
            style={{ 
              background: "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 50%)",
              animationDelay: "0.5s"
            }}
          />
        </div>
        
        {/* Right pavilion facet */}
        <div 
          className="absolute top-[40%] right-[8%] w-[30%] h-[45%]"
          style={{ 
            clipPath: "polygon(0 0, 0 60%, 100% 100%)",
          }}
        >
          <div 
            className="absolute inset-0 bg-gradient-to-bl from-purple-300/40 via-violet-200/30 to-transparent"
          />
          <div 
            className="absolute inset-0 animate-[shimmer_3.5s_ease-in-out_infinite]"
            style={{ 
              background: "linear-gradient(-135deg, rgba(255,255,255,0.5) 0%, transparent 50%)",
              animationDelay: "1s"
            }}
          />
        </div>
      </div>
      
      {/* Simplified diamond cut lines - main facet edges */}
      <div className="absolute inset-0 opacity-60 pointer-events-none overflow-hidden">
        {/* Horizontal girdle line */}
        <div 
          className="absolute top-[45%] left-[5%] w-[90%] h-[2px] animate-[shimmer_2.5s_ease-in-out_infinite]"
          style={{ 
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 30%, rgba(103,232,249,0.8) 50%, rgba(255,255,255,0.9) 70%, transparent 100%)",
            boxShadow: "0 0 6px 2px rgba(255,255,255,0.5)",
            filter: "blur(0.3px)"
          }}
        />
        {/* Left diagonal cut */}
        <div 
          className="absolute top-[20%] left-[25%] w-[2px] h-[50%] animate-[shimmer_3s_ease-in-out_infinite]"
          style={{ 
            transform: "rotate(25deg)", 
            transformOrigin: "top", 
            background: "linear-gradient(180deg, transparent 0%, rgba(196,181,253,0.8) 40%, rgba(255,255,255,0.9) 50%, rgba(196,181,253,0.8) 60%, transparent 100%)",
            boxShadow: "0 0 4px 1px rgba(196,181,253,0.5)",
            filter: "blur(0.2px)",
            animationDelay: "0.3s"
          }}
        />
        {/* Right diagonal cut */}
        <div 
          className="absolute top-[20%] right-[25%] w-[2px] h-[50%] animate-[shimmer_3s_ease-in-out_infinite]"
          style={{ 
            transform: "rotate(-25deg)", 
            transformOrigin: "top", 
            background: "linear-gradient(180deg, transparent 0%, rgba(103,232,249,0.8) 40%, rgba(255,255,255,0.9) 50%, rgba(103,232,249,0.8) 60%, transparent 100%)",
            boxShadow: "0 0 4px 1px rgba(103,232,249,0.5)",
            filter: "blur(0.2px)",
            animationDelay: "0.6s"
          }}
        />
      </div>
      
      {/* Key diamond sparkle highlights */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Main table sparkle */}
        <div 
          className="absolute top-[18%] left-[45%] w-3 h-3 bg-white rounded-full blur-[2px] opacity-90 animate-[sparkle_1.5s_ease-in-out_infinite]"
          style={{ boxShadow: "0 0 10px 3px rgba(255,255,255,0.8)" }}
        />
        {/* Secondary sparkles */}
        <div 
          className="absolute top-[35%] left-[25%] w-2 h-2 bg-cyan-100 rounded-full blur-[1px] opacity-75 animate-[sparkle_1.8s_ease-in-out_infinite]"
          style={{ animationDelay: "0.4s", boxShadow: "0 0 6px 2px rgba(103,232,249,0.6)" }}
        />
        <div 
          className="absolute top-[35%] right-[25%] w-2 h-2 bg-purple-200 rounded-full blur-[1px] opacity-75 animate-[sparkle_1.8s_ease-in-out_infinite]"
          style={{ animationDelay: "0.8s", boxShadow: "0 0 6px 2px rgba(196,181,253,0.6)" }}
        />
      </div>
      
      {/* Luminous glow overlay */}
      <div 
        className="absolute inset-0 rounded-xl opacity-25 pointer-events-none animate-[pulse_3s_ease-in-out_infinite]"
        style={{ 
          background: "radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.5) 0%, rgba(103,232,249,0.15) 40%, transparent 70%)",
          filter: "blur(4px)"
        }}
      />
    </>
  );
};
