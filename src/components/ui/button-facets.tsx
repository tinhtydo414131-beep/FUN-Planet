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
      
      {/* Diamond brilliant cut facets at 30% visibility */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        {/* Crown facets - Upper triangular cuts radiating from center */}
        {/* Star facet - Top */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-[35%]"
          style={{ 
            clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
            filter: "blur(6px)",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-300/70 via-white/50 to-transparent" />
          <div 
            className="absolute inset-0 animate-[shimmer_3s_ease-in-out_infinite]"
            style={{ 
              background: "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(103,232,249,0.6) 50%, transparent 100%)",
              boxShadow: "inset 0 0 15px rgba(255,255,255,0.7)"
            }}
          />
        </div>
        
        {/* Bezel facets - Upper left */}
        <div 
          className="absolute top-[5%] left-0 w-[35%] h-[40%]"
          style={{ 
            clipPath: "polygon(0% 0%, 100% 30%, 70% 100%, 0% 60%)",
            filter: "blur(7px)",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-300/60 via-cyan-200/40 to-transparent" />
          <div 
            className="absolute inset-0 animate-[shimmer_3.5s_ease-in-out_infinite]"
            style={{ 
              background: "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, transparent 60%)",
              boxShadow: "inset 0 0 12px rgba(103,232,249,0.5)",
              animationDelay: "0.3s"
            }}
          />
        </div>
        
        {/* Bezel facets - Upper right */}
        <div 
          className="absolute top-[5%] right-0 w-[35%] h-[40%]"
          style={{ 
            clipPath: "polygon(100% 0%, 100% 60%, 30% 100%, 0% 30%)",
            filter: "blur(7px)",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-bl from-purple-300/60 via-violet-200/40 to-transparent" />
          <div 
            className="absolute inset-0 animate-[shimmer_3.5s_ease-in-out_infinite]"
            style={{ 
              background: "linear-gradient(-135deg, rgba(255,255,255,0.85) 0%, transparent 60%)",
              boxShadow: "inset 0 0 12px rgba(196,181,253,0.5)",
              animationDelay: "0.6s"
            }}
          />
        </div>
        
        {/* Pavilion facets - Lower triangular cuts */}
        {/* Main pavilion - Bottom */}
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[50%] h-[40%]"
          style={{ 
            clipPath: "polygon(0% 0%, 100% 0%, 50% 100%)",
            filter: "blur(6px)",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-violet-400/60 via-purple-200/40 to-transparent" />
          <div 
            className="absolute inset-0 animate-[shimmer_3s_ease-in-out_infinite]"
            style={{ 
              background: "linear-gradient(0deg, rgba(255,255,255,0.9) 0%, rgba(167,139,250,0.5) 50%, transparent 100%)",
              boxShadow: "inset 0 0 15px rgba(255,255,255,0.6)",
              animationDelay: "0.9s"
            }}
          />
        </div>
        
        {/* Lower pavilion - Left */}
        <div 
          className="absolute bottom-[5%] left-0 w-[35%] h-[40%]"
          style={{ 
            clipPath: "polygon(0% 40%, 70% 0%, 100% 70%, 0% 100%)",
            filter: "blur(7px)",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-400/50 via-blue-200/30 to-transparent" />
          <div 
            className="absolute inset-0 animate-[shimmer_3.2s_ease-in-out_infinite]"
            style={{ 
              background: "linear-gradient(45deg, rgba(255,255,255,0.8) 0%, transparent 60%)",
              boxShadow: "inset 0 0 10px rgba(99,102,241,0.4)",
              animationDelay: "1.2s"
            }}
          />
        </div>
        
        {/* Lower pavilion - Right */}
        <div 
          className="absolute bottom-[5%] right-0 w-[35%] h-[40%]"
          style={{ 
            clipPath: "polygon(100% 40%, 30% 0%, 0% 70%, 100% 100%)",
            filter: "blur(7px)",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-tl from-pink-400/50 via-rose-200/30 to-transparent" />
          <div 
            className="absolute inset-0 animate-[shimmer_3.2s_ease-in-out_infinite]"
            style={{ 
              background: "linear-gradient(-45deg, rgba(255,255,255,0.8) 0%, transparent 60%)",
              boxShadow: "inset 0 0 10px rgba(251,207,232,0.4)",
              animationDelay: "1.5s"
            }}
          />
        </div>
        
        {/* Table facet - Center octagonal */}
        <div 
          className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[45%] h-[35%]"
          style={{ 
            clipPath: "polygon(25% 0%, 75% 0%, 100% 35%, 100% 65%, 75% 100%, 25% 100%, 0% 65%, 0% 35%)",
            filter: "blur(5px)",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-cyan-100/40 to-purple-100/30" />
          <div 
            className="absolute inset-0 animate-[pulse_2.5s_ease-in-out_infinite]"
            style={{ 
              background: "radial-gradient(ellipse at center, rgba(255,255,255,0.9) 0%, rgba(207,250,254,0.5) 50%, transparent 80%)",
              boxShadow: "inset 0 0 20px rgba(255,255,255,0.8)"
            }}
          />
        </div>
        
        {/* Culet - Bottom point radiance */}
        <div 
          className="absolute bottom-[8%] left-1/2 -translate-x-1/2 w-[20%] h-[15%]"
          style={{ 
            clipPath: "polygon(50% 100%, 0% 0%, 100% 0%)",
            filter: "blur(4px)",
          }}
        >
          <div 
            className="absolute inset-0 animate-[shimmer_2s_ease-in-out_infinite]"
            style={{ 
              background: "radial-gradient(circle at 50% 0%, rgba(255,255,255,1) 0%, rgba(167,139,250,0.6) 60%, transparent 100%)",
              boxShadow: "0 0 12px rgba(255,255,255,0.7)"
            }}
          />
        </div>
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
