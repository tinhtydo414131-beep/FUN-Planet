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
      
      {/* Diamond-cut facet layers matching natural light refraction pattern */}
      <div className="absolute inset-[8%] opacity-90 pointer-events-none overflow-hidden rounded-lg">
        {/* Crown facets - upper triangular sections */}
        {/* Star facet - top */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[50%] h-[40%]"
          style={{ 
            clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(207,250,254,0.7) 60%, transparent 100%)",
            boxShadow: "inset 0 0 10px rgba(255,255,255,0.8)",
          }}
        />
        
        {/* Star facet - bottom */}
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[50%] h-[40%]"
          style={{ 
            clipPath: "polygon(50% 100%, 100% 0%, 0% 0%)",
            background: "linear-gradient(0deg, rgba(196,181,253,0.9) 0%, rgba(255,255,255,0.7) 60%, transparent 100%)",
            boxShadow: "inset 0 0 10px rgba(196,181,253,0.7)",
          }}
        />
        
        {/* Star facet - left */}
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[40%] h-[50%]"
          style={{ 
            clipPath: "polygon(0% 50%, 100% 0%, 100% 100%)",
            background: "linear-gradient(90deg, rgba(103,232,249,0.85) 0%, rgba(255,255,255,0.7) 60%, transparent 100%)",
            boxShadow: "inset 0 0 10px rgba(103,232,249,0.6)",
          }}
        />
        
        {/* Star facet - right */}
        <div 
          className="absolute right-0 top-1/2 -translate-y-1/2 w-[40%] h-[50%]"
          style={{ 
            clipPath: "polygon(100% 50%, 0% 0%, 0% 100%)",
            background: "linear-gradient(-90deg, rgba(167,139,250,0.85) 0%, rgba(255,255,255,0.7) 60%, transparent 100%)",
            boxShadow: "inset 0 0 10px rgba(167,139,250,0.6)",
          }}
        />
        
        {/* Kite facets - diagonal corners */}
        <div 
          className="absolute top-0 left-0 w-[40%] h-[40%]"
          style={{ 
            clipPath: "polygon(0% 0%, 100% 0%, 100% 100%)",
            background: "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(207,250,254,0.5) 50%, transparent 100%)",
          }}
        />
        
        <div 
          className="absolute top-0 right-0 w-[40%] h-[40%]"
          style={{ 
            clipPath: "polygon(0% 0%, 100% 0%, 0% 100%)",
            background: "linear-gradient(-135deg, rgba(255,255,255,0.75) 0%, rgba(196,181,253,0.5) 50%, transparent 100%)",
          }}
        />
        
        <div 
          className="absolute bottom-0 left-0 w-[40%] h-[40%]"
          style={{ 
            clipPath: "polygon(0% 100%, 100% 0%, 100% 100%)",
            background: "linear-gradient(45deg, rgba(103,232,249,0.7) 0%, rgba(255,255,255,0.5) 50%, transparent 100%)",
          }}
        />
        
        <div 
          className="absolute bottom-0 right-0 w-[40%] h-[40%]"
          style={{ 
            clipPath: "polygon(0% 0%, 0% 100%, 100% 100%)",
            background: "linear-gradient(-45deg, rgba(167,139,250,0.7) 0%, rgba(255,255,255,0.5) 50%, transparent 100%)",
          }}
        />
        
        {/* Table facet - central octagon */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50%] h-[50%]"
          style={{ 
            clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
            background: "radial-gradient(ellipse at center, rgba(255,255,255,0.95) 0%, rgba(207,250,254,0.7) 50%, rgba(196,181,253,0.5) 100%)",
            boxShadow: "inset 0 0 15px rgba(255,255,255,0.9)",
          }}
        />
        
        {/* Culet - center diamond brilliance */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[25%] h-[25%] animate-[pulse_2.5s_ease-in-out_infinite]"
          style={{ 
            clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
            background: "radial-gradient(circle at center, rgba(255,255,255,1) 0%, rgba(255,255,255,0.95) 50%, rgba(207,250,254,0.8) 100%)",
            boxShadow: "0 0 12px rgba(255,255,255,0.95), 0 0 20px rgba(103,232,249,0.5)"
          }}
        />
      </div>
      
      {/* Enhanced prismatic light refraction lines with luminous cut effect */}
      <div className="absolute inset-0 opacity-70 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-0 left-1/4 w-[3px] h-full animate-[shimmer_2.5s_ease-in-out_infinite]"
          style={{ 
            transform: "rotate(15deg)", 
            transformOrigin: "top", 
            background: "linear-gradient(180deg, transparent 0%, rgba(103,232,249,0.9) 30%, rgba(255,255,255,1) 50%, rgba(103,232,249,0.9) 70%, transparent 100%)",
            boxShadow: "0 0 6px 2px rgba(103,232,249,0.6), 0 0 12px 4px rgba(255,255,255,0.3)",
            filter: "blur(0.3px)"
          }}
        />
        <div 
          className="absolute top-0 right-1/4 w-[3px] h-full animate-[shimmer_2.5s_ease-in-out_infinite]"
          style={{ 
            transform: "rotate(-15deg)", 
            transformOrigin: "top", 
            background: "linear-gradient(180deg, transparent 0%, rgba(196,181,253,0.9) 30%, rgba(255,255,255,1) 50%, rgba(196,181,253,0.9) 70%, transparent 100%)",
            boxShadow: "0 0 6px 2px rgba(196,181,253,0.6), 0 0 12px 4px rgba(255,255,255,0.3)",
            filter: "blur(0.3px)",
            animationDelay: "0.4s"
          }}
        />
        <div 
          className="absolute top-1/2 left-0 w-full h-[3px] animate-[shimmer_2s_ease-in-out_infinite]"
          style={{ 
            background: "linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.9) 30%, rgba(255,255,255,1) 50%, rgba(59,130,246,0.9) 70%, transparent 100%)",
            boxShadow: "0 0 6px 2px rgba(59,130,246,0.6), 0 0 12px 4px rgba(255,255,255,0.3)",
            filter: "blur(0.3px)",
            animationDelay: "0.2s"
          }}
        />
        <div 
          className="absolute top-0 left-1/3 w-[2px] h-full animate-[shimmer_2.8s_ease-in-out_infinite]"
          style={{ 
            transform: "rotate(25deg)", 
            transformOrigin: "top", 
            background: "linear-gradient(180deg, transparent 0%, rgba(251,207,232,0.9) 30%, rgba(255,255,255,1) 50%, rgba(251,207,232,0.9) 70%, transparent 100%)",
            boxShadow: "0 0 5px 1px rgba(251,207,232,0.6), 0 0 10px 3px rgba(255,255,255,0.3)",
            filter: "blur(0.2px)",
            animationDelay: "0.6s"
          }}
        />
        <div 
          className="absolute top-0 right-1/3 w-[2px] h-full animate-[shimmer_2.8s_ease-in-out_infinite]"
          style={{ 
            transform: "rotate(-25deg)", 
            transformOrigin: "top", 
            background: "linear-gradient(180deg, transparent 0%, rgba(167,139,250,0.9) 30%, rgba(255,255,255,1) 50%, rgba(167,139,250,0.9) 70%, transparent 100%)",
            boxShadow: "0 0 5px 1px rgba(167,139,250,0.6), 0 0 10px 3px rgba(255,255,255,0.3)",
            filter: "blur(0.2px)",
            animationDelay: "0.8s"
          }}
        />
        {/* Diagonal cross veins */}
        <div 
          className="absolute top-0 left-[45%] w-[2px] h-full animate-[shimmer_3s_ease-in-out_infinite]"
          style={{ 
            transform: "rotate(40deg)", 
            transformOrigin: "center", 
            background: "linear-gradient(180deg, transparent 0%, rgba(254,240,138,0.8) 40%, rgba(255,255,255,0.9) 50%, rgba(254,240,138,0.8) 60%, transparent 100%)",
            boxShadow: "0 0 4px 1px rgba(254,240,138,0.5), 0 0 8px 2px rgba(255,255,255,0.2)",
            filter: "blur(0.2px)",
            animationDelay: "1s"
          }}
        />
        <div 
          className="absolute top-0 right-[45%] w-[2px] h-full animate-[shimmer_3s_ease-in-out_infinite]"
          style={{ 
            transform: "rotate(-40deg)", 
            transformOrigin: "center", 
            background: "linear-gradient(180deg, transparent 0%, rgba(134,239,172,0.8) 40%, rgba(255,255,255,0.9) 50%, rgba(134,239,172,0.8) 60%, transparent 100%)",
            boxShadow: "0 0 4px 1px rgba(134,239,172,0.5), 0 0 8px 2px rgba(255,255,255,0.2)",
            filter: "blur(0.2px)",
            animationDelay: "1.2s"
          }}
        />
      </div>
      
      {/* Enhanced sparkling highlights with luminous glow */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Primary sparkles */}
        <div 
          className="absolute top-[15%] left-[20%] w-3 h-3 bg-white rounded-full blur-[2px] opacity-90 animate-[sparkle_1.5s_ease-in-out_infinite]"
          style={{ animationDelay: "0s", boxShadow: "0 0 8px 2px rgba(255,255,255,0.8)" }}
        />
        <div 
          className="absolute top-[25%] right-[25%] w-2.5 h-2.5 bg-cyan-200 rounded-full blur-[2px] opacity-85 animate-[sparkle_1.8s_ease-in-out_infinite]"
          style={{ animationDelay: "0.3s", boxShadow: "0 0 10px 3px rgba(103,232,249,0.7)" }}
        />
        <div 
          className="absolute bottom-[30%] left-[30%] w-2 h-2 bg-purple-300 rounded-full blur-[2px] opacity-80 animate-[sparkle_1.6s_ease-in-out_infinite]"
          style={{ animationDelay: "0.6s", boxShadow: "0 0 8px 2px rgba(196,181,253,0.7)" }}
        />
        <div 
          className="absolute bottom-[20%] right-[20%] w-2.5 h-2.5 bg-white rounded-full blur-[2px] opacity-90 animate-[sparkle_1.4s_ease-in-out_infinite]"
          style={{ animationDelay: "0.9s", boxShadow: "0 0 10px 3px rgba(255,255,255,0.8)" }}
        />
        
        {/* Secondary smaller sparkles */}
        <div 
          className="absolute top-[40%] left-[15%] w-1.5 h-1.5 bg-yellow-200 rounded-full blur-[1px] opacity-75 animate-[sparkle_2s_ease-in-out_infinite]"
          style={{ animationDelay: "0.2s", boxShadow: "0 0 6px 2px rgba(254,240,138,0.6)" }}
        />
        <div 
          className="absolute top-[10%] right-[40%] w-1.5 h-1.5 bg-pink-200 rounded-full blur-[1px] opacity-70 animate-[sparkle_2.2s_ease-in-out_infinite]"
          style={{ animationDelay: "0.8s", boxShadow: "0 0 6px 2px rgba(251,207,232,0.6)" }}
        />
        <div 
          className="absolute bottom-[15%] left-[45%] w-2 h-2 bg-cyan-100 rounded-full blur-[1px] opacity-75 animate-[sparkle_1.7s_ease-in-out_infinite]"
          style={{ animationDelay: "1.1s", boxShadow: "0 0 8px 2px rgba(207,250,254,0.7)" }}
        />
        <div 
          className="absolute top-[50%] right-[15%] w-1.5 h-1.5 bg-white rounded-full blur-[1px] opacity-80 animate-[sparkle_1.9s_ease-in-out_infinite]"
          style={{ animationDelay: "1.4s", boxShadow: "0 0 6px 2px rgba(255,255,255,0.7)" }}
        />
      </div>
      
      {/* Luminous glow overlay */}
      <div 
        className="absolute inset-0 rounded-xl opacity-30 pointer-events-none animate-[pulse_3s_ease-in-out_infinite]"
        style={{ 
          background: "radial-gradient(ellipse at center, rgba(255,255,255,0.4) 0%, rgba(103,232,249,0.2) 40%, transparent 70%)",
          filter: "blur(4px)"
        }}
      />
    </>
  );
};
