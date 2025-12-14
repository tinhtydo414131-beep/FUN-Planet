export const ButtonFacets = () => {
  return (
    <>
      {/* Ambient diamond glow halo */}
      <div className="absolute inset-[-8px] rounded-2xl bg-gradient-radial from-cyan-400/20 via-purple-400/15 to-transparent blur-xl opacity-60 pointer-events-none" />
      
      {/* Outer brilliant cut edge - the girdle */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute inset-[2px] rounded-xl animate-[shimmer_3s_ease-in-out_infinite]"
          style={{ 
            background: "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(103,232,249,0.6) 25%, rgba(196,181,253,0.6) 50%, rgba(255,255,255,0.9) 75%, rgba(103,232,249,0.6) 100%)",
            boxShadow: "inset 0 0 2px rgba(255,255,255,0.9), 0 0 8px rgba(255,255,255,0.5), 0 0 15px rgba(103,232,249,0.3)",
            opacity: 0.7
          }}
        />
      </div>

      {/* Diamond brilliant cut facets - 8-fold symmetry */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        
        {/* Table - center octagon (top flat surface of diamond) */}
        <div 
          className="absolute top-[30%] left-[30%] w-[40%] h-[40%] animate-[pulse_4s_ease-in-out_infinite]"
          style={{ 
            clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
            background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(207,250,254,0.8) 30%, rgba(255,255,255,0.9) 50%, rgba(233,213,255,0.8) 70%, rgba(255,255,255,0.95) 100%)",
            boxShadow: "inset 0 0 20px rgba(255,255,255,0.8), 0 0 10px rgba(255,255,255,0.6)",
          }}
        />

        {/* Crown facets - 8 triangular kite facets around the table */}
        {/* Top crown facet */}
        <div 
          className="absolute top-0 left-[25%] w-[50%] h-[35%] animate-[shimmer_2.5s_ease-in-out_infinite]"
          style={{ 
            clipPath: "polygon(50% 0%, 15% 100%, 85% 100%)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(103,232,249,0.7) 50%, rgba(255,255,255,0.6) 100%)",
            boxShadow: "inset 0 0 15px rgba(255,255,255,0.7)",
          }}
        />
        
        {/* Bottom crown facet */}
        <div 
          className="absolute bottom-0 left-[25%] w-[50%] h-[35%] animate-[shimmer_2.5s_ease-in-out_infinite]"
          style={{ 
            clipPath: "polygon(50% 100%, 15% 0%, 85% 0%)",
            background: "linear-gradient(0deg, rgba(255,255,255,0.9) 0%, rgba(196,181,253,0.7) 50%, rgba(255,255,255,0.6) 100%)",
            boxShadow: "inset 0 0 15px rgba(255,255,255,0.7)",
            animationDelay: "0.3s"
          }}
        />
        
        {/* Left crown facet */}
        <div 
          className="absolute top-[25%] left-0 w-[35%] h-[50%] animate-[shimmer_2.5s_ease-in-out_infinite]"
          style={{ 
            clipPath: "polygon(0% 50%, 100% 15%, 100% 85%)",
            background: "linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(99,102,241,0.7) 50%, rgba(255,255,255,0.6) 100%)",
            boxShadow: "inset 0 0 15px rgba(255,255,255,0.7)",
            animationDelay: "0.6s"
          }}
        />
        
        {/* Right crown facet */}
        <div 
          className="absolute top-[25%] right-0 w-[35%] h-[50%] animate-[shimmer_2.5s_ease-in-out_infinite]"
          style={{ 
            clipPath: "polygon(100% 50%, 0% 15%, 0% 85%)",
            background: "linear-gradient(-90deg, rgba(255,255,255,0.9) 0%, rgba(251,207,232,0.7) 50%, rgba(255,255,255,0.6) 100%)",
            boxShadow: "inset 0 0 15px rgba(255,255,255,0.7)",
            animationDelay: "0.9s"
          }}
        />

        {/* Star facets - 8 smaller triangles between crown and table */}
        {/* Top-left star */}
        <div 
          className="absolute top-[8%] left-[8%] w-[30%] h-[30%] animate-[shimmer_3s_ease-in-out_infinite]"
          style={{ 
            clipPath: "polygon(0% 0%, 100% 50%, 50% 100%)",
            background: "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(103,232,249,0.6) 100%)",
            boxShadow: "inset 0 0 10px rgba(255,255,255,0.6)",
            animationDelay: "0.2s"
          }}
        />
        
        {/* Top-right star */}
        <div 
          className="absolute top-[8%] right-[8%] w-[30%] h-[30%] animate-[shimmer_3s_ease-in-out_infinite]"
          style={{ 
            clipPath: "polygon(100% 0%, 0% 50%, 50% 100%)",
            background: "linear-gradient(-135deg, rgba(255,255,255,0.85) 0%, rgba(196,181,253,0.6) 100%)",
            boxShadow: "inset 0 0 10px rgba(255,255,255,0.6)",
            animationDelay: "0.4s"
          }}
        />
        
        {/* Bottom-left star */}
        <div 
          className="absolute bottom-[8%] left-[8%] w-[30%] h-[30%] animate-[shimmer_3s_ease-in-out_infinite]"
          style={{ 
            clipPath: "polygon(0% 100%, 100% 50%, 50% 0%)",
            background: "linear-gradient(45deg, rgba(255,255,255,0.85) 0%, rgba(134,239,172,0.6) 100%)",
            boxShadow: "inset 0 0 10px rgba(255,255,255,0.6)",
            animationDelay: "0.6s"
          }}
        />
        
        {/* Bottom-right star */}
        <div 
          className="absolute bottom-[8%] right-[8%] w-[30%] h-[30%] animate-[shimmer_3s_ease-in-out_infinite]"
          style={{ 
            clipPath: "polygon(100% 100%, 0% 50%, 50% 0%)",
            background: "linear-gradient(-45deg, rgba(255,255,255,0.85) 0%, rgba(254,240,138,0.6) 100%)",
            boxShadow: "inset 0 0 10px rgba(255,255,255,0.6)",
            animationDelay: "0.8s"
          }}
        />
      </div>

      {/* Internal light refraction lines - diamond fire effect */}
      <div className="absolute inset-0 opacity-60 pointer-events-none overflow-hidden">
        {/* Diagonal refractions */}
        <div 
          className="absolute top-[20%] left-[50%] w-[2px] h-[60%] animate-[shimmer_2s_ease-in-out_infinite]"
          style={{ 
            transform: "rotate(30deg)", 
            transformOrigin: "top",
            background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.9), rgba(103,232,249,0.8), transparent)",
            boxShadow: "0 0 6px rgba(255,255,255,0.7), 0 0 12px rgba(103,232,249,0.5)",
          }}
        />
        <div 
          className="absolute top-[20%] left-[50%] w-[2px] h-[60%] animate-[shimmer_2s_ease-in-out_infinite]"
          style={{ 
            transform: "rotate(-30deg)", 
            transformOrigin: "top",
            background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.9), rgba(196,181,253,0.8), transparent)",
            boxShadow: "0 0 6px rgba(255,255,255,0.7), 0 0 12px rgba(196,181,253,0.5)",
            animationDelay: "0.5s"
          }}
        />
        <div 
          className="absolute top-[50%] left-[20%] w-[60%] h-[2px] animate-[shimmer_2.5s_ease-in-out_infinite]"
          style={{ 
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.9), rgba(251,207,232,0.8), rgba(255,255,255,0.9), transparent)",
            boxShadow: "0 0 6px rgba(255,255,255,0.7), 0 0 12px rgba(251,207,232,0.5)",
            animationDelay: "0.3s"
          }}
        />
      </div>

      {/* Sparkle points at facet intersections */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Center sparkle */}
        <div 
          className="absolute top-[50%] left-[50%] w-4 h-4 -translate-x-1/2 -translate-y-1/2 animate-[sparkle_1.5s_ease-in-out_infinite]"
          style={{ 
            background: "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.8) 20%, transparent 70%)",
            boxShadow: "0 0 10px rgba(255,255,255,0.9), 0 0 20px rgba(103,232,249,0.6)"
          }}
        />
        
        {/* Corner sparkles */}
        <div 
          className="absolute top-[15%] left-[50%] w-3 h-3 -translate-x-1/2 animate-[sparkle_1.8s_ease-in-out_infinite]"
          style={{ 
            background: "radial-gradient(circle, rgba(255,255,255,1) 0%, transparent 70%)",
            boxShadow: "0 0 8px rgba(255,255,255,0.8), 0 0 15px rgba(103,232,249,0.5)",
            animationDelay: "0.2s"
          }}
        />
        <div 
          className="absolute bottom-[15%] left-[50%] w-3 h-3 -translate-x-1/2 animate-[sparkle_1.8s_ease-in-out_infinite]"
          style={{ 
            background: "radial-gradient(circle, rgba(255,255,255,1) 0%, transparent 70%)",
            boxShadow: "0 0 8px rgba(255,255,255,0.8), 0 0 15px rgba(196,181,253,0.5)",
            animationDelay: "0.5s"
          }}
        />
        <div 
          className="absolute top-[50%] left-[15%] w-3 h-3 -translate-y-1/2 animate-[sparkle_1.8s_ease-in-out_infinite]"
          style={{ 
            background: "radial-gradient(circle, rgba(255,255,255,1) 0%, transparent 70%)",
            boxShadow: "0 0 8px rgba(255,255,255,0.8), 0 0 15px rgba(99,102,241,0.5)",
            animationDelay: "0.8s"
          }}
        />
        <div 
          className="absolute top-[50%] right-[15%] w-3 h-3 -translate-y-1/2 animate-[sparkle_1.8s_ease-in-out_infinite]"
          style={{ 
            background: "radial-gradient(circle, rgba(255,255,255,1) 0%, transparent 70%)",
            boxShadow: "0 0 8px rgba(255,255,255,0.8), 0 0 15px rgba(251,207,232,0.5)",
            animationDelay: "1.1s"
          }}
        />
        
        {/* Diagonal corner sparkles */}
        <div 
          className="absolute top-[20%] left-[20%] w-2.5 h-2.5 animate-[sparkle_2s_ease-in-out_infinite]"
          style={{ 
            background: "radial-gradient(circle, rgba(255,255,255,1) 0%, transparent 70%)",
            boxShadow: "0 0 6px rgba(255,255,255,0.7), 0 0 12px rgba(103,232,249,0.4)",
            animationDelay: "0.3s"
          }}
        />
        <div 
          className="absolute top-[20%] right-[20%] w-2.5 h-2.5 animate-[sparkle_2s_ease-in-out_infinite]"
          style={{ 
            background: "radial-gradient(circle, rgba(255,255,255,1) 0%, transparent 70%)",
            boxShadow: "0 0 6px rgba(255,255,255,0.7), 0 0 12px rgba(196,181,253,0.4)",
            animationDelay: "0.6s"
          }}
        />
        <div 
          className="absolute bottom-[20%] left-[20%] w-2.5 h-2.5 animate-[sparkle_2s_ease-in-out_infinite]"
          style={{ 
            background: "radial-gradient(circle, rgba(255,255,255,1) 0%, transparent 70%)",
            boxShadow: "0 0 6px rgba(255,255,255,0.7), 0 0 12px rgba(134,239,172,0.4)",
            animationDelay: "0.9s"
          }}
        />
        <div 
          className="absolute bottom-[20%] right-[20%] w-2.5 h-2.5 animate-[sparkle_2s_ease-in-out_infinite]"
          style={{ 
            background: "radial-gradient(circle, rgba(255,255,255,1) 0%, transparent 70%)",
            boxShadow: "0 0 6px rgba(255,255,255,0.7), 0 0 12px rgba(254,240,138,0.4)",
            animationDelay: "1.2s"
          }}
        />
      </div>
      
      {/* Luminous glow overlay */}
      <div 
        className="absolute inset-0 rounded-xl opacity-25 pointer-events-none animate-[pulse_3s_ease-in-out_infinite]"
        style={{ 
          background: "radial-gradient(ellipse at center, rgba(255,255,255,0.5) 0%, rgba(103,232,249,0.3) 40%, transparent 70%)",
          filter: "blur(4px)"
        }}
      />
    </>
  );
};