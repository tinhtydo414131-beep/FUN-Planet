export const ButtonFacets = () => {
  return (
    <>
      {/* Ambient diamond glow halo - Reduced intensity */}
      <div className="absolute inset-[-6px] rounded-2xl bg-gradient-radial from-cyan-400/15 via-purple-400/10 to-transparent blur-xl opacity-50 pointer-events-none" />
      
      {/* Luminous cut edges - outer ring - ENHANCED */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top edge facet - Enhanced */}
        <div 
          className="absolute top-0 left-[8%] right-[8%] h-[3px] animate-[shimmer_2s_ease-in-out_infinite]"
          style={{ 
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,1) 15%, rgba(103,232,249,0.95) 35%, rgba(255,255,255,1) 50%, rgba(196,181,253,0.95) 65%, rgba(255,255,255,1) 85%, transparent 100%)",
            boxShadow: "0 0 12px 4px rgba(255,255,255,0.9), 0 0 25px 8px rgba(103,232,249,0.6), 0 -2px 8px 2px rgba(255,255,255,0.8)",
            filter: "blur(0.3px)"
          }}
        />
        {/* Top edge inner highlight */}
        <div 
          className="absolute top-[1px] left-[12%] right-[12%] h-[1px]"
          style={{ 
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,1), transparent)",
            boxShadow: "0 0 6px 2px rgba(255,255,255,0.7)"
          }}
        />
        
        {/* Bottom edge facet - Enhanced */}
        <div 
          className="absolute bottom-0 left-[8%] right-[8%] h-[3px] animate-[shimmer_2s_ease-in-out_infinite]"
          style={{ 
            background: "linear-gradient(90deg, transparent 0%, rgba(196,181,253,1) 15%, rgba(255,255,255,1) 35%, rgba(167,139,250,0.95) 50%, rgba(255,255,255,1) 65%, rgba(196,181,253,1) 85%, transparent 100%)",
            boxShadow: "0 0 12px 4px rgba(255,255,255,0.9), 0 0 25px 8px rgba(196,181,253,0.6), 0 2px 8px 2px rgba(255,255,255,0.8)",
            filter: "blur(0.3px)",
            animationDelay: "0.5s"
          }}
        />
        {/* Bottom edge inner highlight */}
        <div 
          className="absolute bottom-[1px] left-[12%] right-[12%] h-[1px]"
          style={{ 
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,1), transparent)",
            boxShadow: "0 0 6px 2px rgba(255,255,255,0.7)"
          }}
        />
        
        {/* Left edge facet - Enhanced */}
        <div 
          className="absolute left-0 top-[8%] bottom-[8%] w-[3px] animate-[shimmer_2.2s_ease-in-out_infinite]"
          style={{ 
            background: "linear-gradient(180deg, transparent 0%, rgba(255,255,255,1) 15%, rgba(103,232,249,0.95) 35%, rgba(255,255,255,1) 50%, rgba(99,102,241,0.95) 65%, rgba(255,255,255,1) 85%, transparent 100%)",
            boxShadow: "0 0 12px 4px rgba(255,255,255,0.9), 0 0 25px 8px rgba(103,232,249,0.6), -2px 0 8px 2px rgba(255,255,255,0.8)",
            filter: "blur(0.3px)",
            animationDelay: "0.3s"
          }}
        />
        {/* Left edge inner highlight */}
        <div 
          className="absolute left-[1px] top-[12%] bottom-[12%] w-[1px]"
          style={{ 
            background: "linear-gradient(180deg, transparent, rgba(255,255,255,1), transparent)",
            boxShadow: "0 0 6px 2px rgba(255,255,255,0.7)"
          }}
        />
        
        {/* Right edge facet - Enhanced */}
        <div 
          className="absolute right-0 top-[8%] bottom-[8%] w-[3px] animate-[shimmer_2.2s_ease-in-out_infinite]"
          style={{ 
            background: "linear-gradient(180deg, transparent 0%, rgba(196,181,253,1) 15%, rgba(255,255,255,1) 35%, rgba(244,114,182,0.95) 50%, rgba(255,255,255,1) 65%, rgba(196,181,253,1) 85%, transparent 100%)",
            boxShadow: "0 0 12px 4px rgba(255,255,255,0.9), 0 0 25px 8px rgba(196,181,253,0.6), 2px 0 8px 2px rgba(255,255,255,0.8)",
            filter: "blur(0.3px)",
            animationDelay: "0.8s"
          }}
        />
        {/* Right edge inner highlight */}
        <div 
          className="absolute right-[1px] top-[12%] bottom-[12%] w-[1px]"
          style={{ 
            background: "linear-gradient(180deg, transparent, rgba(255,255,255,1), transparent)",
            boxShadow: "0 0 6px 2px rgba(255,255,255,0.7)"
          }}
        />
        
        {/* Corner cut facets - luminous diamonds - ENHANCED */}
        <div 
          className="absolute top-0 left-0 w-6 h-6 animate-[sparkle_1.5s_ease-in-out_infinite]"
          style={{ 
            background: "radial-gradient(circle at 100% 100%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.9) 15%, rgba(103,232,249,0.8) 35%, transparent 65%)",
            boxShadow: "3px 3px 15px rgba(255,255,255,0.8), 2px 2px 8px rgba(103,232,249,0.6)"
          }}
        />
        <div 
          className="absolute top-0 right-0 w-6 h-6 animate-[sparkle_1.5s_ease-in-out_infinite]"
          style={{ 
            background: "radial-gradient(circle at 0% 100%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.9) 15%, rgba(196,181,253,0.8) 35%, transparent 65%)",
            boxShadow: "-3px 3px 15px rgba(255,255,255,0.8), -2px 2px 8px rgba(196,181,253,0.6)",
            animationDelay: "0.4s"
          }}
        />
        <div 
          className="absolute bottom-0 left-0 w-6 h-6 animate-[sparkle_1.5s_ease-in-out_infinite]"
          style={{ 
            background: "radial-gradient(circle at 100% 0%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.9) 15%, rgba(251,207,232,0.8) 35%, transparent 65%)",
            boxShadow: "3px -3px 15px rgba(255,255,255,0.8), 2px -2px 8px rgba(251,207,232,0.6)",
            animationDelay: "0.7s"
          }}
        />
        <div 
          className="absolute bottom-0 right-0 w-6 h-6 animate-[sparkle_1.5s_ease-in-out_infinite]"
          style={{ 
            background: "radial-gradient(circle at 0% 0%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.9) 15%, rgba(254,240,138,0.8) 35%, transparent 65%)",
            boxShadow: "-3px -3px 15px rgba(255,255,255,0.8), -2px -2px 8px rgba(254,240,138,0.6)",
            animationDelay: "1s"
          }}
        />
        
        {/* Additional diagonal edge highlights */}
        <div 
          className="absolute top-[3px] left-[3px] w-[20%] h-[2px]"
          style={{ 
            transform: "rotate(45deg)",
            transformOrigin: "left center",
            background: "linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(103,232,249,0.7) 50%, transparent 100%)",
            boxShadow: "0 0 8px 2px rgba(255,255,255,0.7)"
          }}
        />
        <div 
          className="absolute top-[3px] right-[3px] w-[20%] h-[2px]"
          style={{ 
            transform: "rotate(-45deg)",
            transformOrigin: "right center",
            background: "linear-gradient(90deg, transparent 0%, rgba(196,181,253,0.7) 50%, rgba(255,255,255,0.95) 100%)",
            boxShadow: "0 0 8px 2px rgba(255,255,255,0.7)"
          }}
        />
        <div 
          className="absolute bottom-[3px] left-[3px] w-[20%] h-[2px]"
          style={{ 
            transform: "rotate(-45deg)",
            transformOrigin: "left center",
            background: "linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(99,102,241,0.7) 50%, transparent 100%)",
            boxShadow: "0 0 8px 2px rgba(255,255,255,0.7)"
          }}
        />
        <div 
          className="absolute bottom-[3px] right-[3px] w-[20%] h-[2px]"
          style={{ 
            transform: "rotate(45deg)",
            transformOrigin: "right center",
            background: "linear-gradient(90deg, transparent 0%, rgba(244,114,182,0.7) 50%, rgba(255,255,255,0.95) 100%)",
            boxShadow: "0 0 8px 2px rgba(255,255,255,0.7)"
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
            className="absolute inset-0"
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
      
      {/* Diamond facet grooves - brilliant cut pattern */}
      <div className="absolute inset-0 opacity-50 pointer-events-none overflow-hidden">
        {/* Crown star facet grooves - 8 lines radiating from center table */}
        <div 
          className="absolute top-[25%] left-1/2 w-[1px] h-[25%] -translate-x-1/2"
          style={{ 
            background: "linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.3) 100%)",
            boxShadow: "0 0 2px rgba(255,255,255,0.5)"
          }}
        />
        <div 
          className="absolute top-[25%] left-1/2 w-[1px] h-[22%] origin-top"
          style={{ 
            transform: "translateX(-50%) rotate(45deg)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(103,232,249,0.3) 100%)",
            boxShadow: "0 0 2px rgba(103,232,249,0.4)"
          }}
        />
        <div 
          className="absolute top-[25%] left-1/2 w-[1px] h-[22%] origin-top"
          style={{ 
            transform: "translateX(-50%) rotate(-45deg)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(196,181,253,0.3) 100%)",
            boxShadow: "0 0 2px rgba(196,181,253,0.4)"
          }}
        />
        <div 
          className="absolute top-[25%] left-1/2 w-[1px] h-[20%] origin-top"
          style={{ 
            transform: "translateX(-50%) rotate(22.5deg)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)",
          }}
        />
        <div 
          className="absolute top-[25%] left-1/2 w-[1px] h-[20%] origin-top"
          style={{ 
            transform: "translateX(-50%) rotate(-22.5deg)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)",
          }}
        />
        
        {/* Bezel facet grooves - crown edges */}
        <div 
          className="absolute top-[8%] left-[15%] w-[35%] h-[1px]"
          style={{ 
            transform: "rotate(25deg)",
            background: "linear-gradient(90deg, rgba(255,255,255,0.6) 0%, rgba(103,232,249,0.4) 50%, transparent 100%)",
            boxShadow: "0 0 2px rgba(255,255,255,0.3)"
          }}
        />
        <div 
          className="absolute top-[8%] right-[15%] w-[35%] h-[1px]"
          style={{ 
            transform: "rotate(-25deg)",
            background: "linear-gradient(90deg, transparent 0%, rgba(196,181,253,0.4) 50%, rgba(255,255,255,0.6) 100%)",
            boxShadow: "0 0 2px rgba(255,255,255,0.3)"
          }}
        />
        <div 
          className="absolute top-[18%] left-[8%] w-[25%] h-[1px]"
          style={{ 
            transform: "rotate(40deg)",
            background: "linear-gradient(90deg, rgba(255,255,255,0.5) 0%, transparent 100%)",
          }}
        />
        <div 
          className="absolute top-[18%] right-[8%] w-[25%] h-[1px]"
          style={{ 
            transform: "rotate(-40deg)",
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 100%)",
          }}
        />
        
        {/* Girdle groove - horizontal belt */}
        <div 
          className="absolute top-[48%] left-[5%] right-[5%] h-[1px]"
          style={{ 
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 20%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.5) 80%, transparent 100%)",
            boxShadow: "0 0 3px rgba(255,255,255,0.4)"
          }}
        />
        
        {/* Pavilion main facet grooves - 8 lines converging to culet */}
        <div 
          className="absolute bottom-[12%] left-1/2 w-[1px] h-[38%] -translate-x-1/2"
          style={{ 
            background: "linear-gradient(0deg, rgba(255,255,255,0.8) 0%, rgba(167,139,250,0.3) 100%)",
            boxShadow: "0 0 2px rgba(255,255,255,0.5)"
          }}
        />
        <div 
          className="absolute bottom-[12%] left-1/2 w-[1px] h-[35%] origin-bottom"
          style={{ 
            transform: "translateX(-50%) rotate(30deg)",
            background: "linear-gradient(0deg, rgba(255,255,255,0.7) 0%, rgba(99,102,241,0.3) 100%)",
            boxShadow: "0 0 2px rgba(99,102,241,0.4)"
          }}
        />
        <div 
          className="absolute bottom-[12%] left-1/2 w-[1px] h-[35%] origin-bottom"
          style={{ 
            transform: "translateX(-50%) rotate(-30deg)",
            background: "linear-gradient(0deg, rgba(255,255,255,0.7) 0%, rgba(244,114,182,0.3) 100%)",
            boxShadow: "0 0 2px rgba(244,114,182,0.4)"
          }}
        />
        <div 
          className="absolute bottom-[12%] left-1/2 w-[1px] h-[32%] origin-bottom"
          style={{ 
            transform: "translateX(-50%) rotate(55deg)",
            background: "linear-gradient(0deg, rgba(255,255,255,0.6) 0%, transparent 100%)",
          }}
        />
        <div 
          className="absolute bottom-[12%] left-1/2 w-[1px] h-[32%] origin-bottom"
          style={{ 
            transform: "translateX(-50%) rotate(-55deg)",
            background: "linear-gradient(0deg, rgba(255,255,255,0.6) 0%, transparent 100%)",
          }}
        />
        <div 
          className="absolute bottom-[12%] left-1/2 w-[1px] h-[28%] origin-bottom"
          style={{ 
            transform: "translateX(-50%) rotate(15deg)",
            background: "linear-gradient(0deg, rgba(255,255,255,0.5) 0%, transparent 100%)",
          }}
        />
        <div 
          className="absolute bottom-[12%] left-1/2 w-[1px] h-[28%] origin-bottom"
          style={{ 
            transform: "translateX(-50%) rotate(-15deg)",
            background: "linear-gradient(0deg, rgba(255,255,255,0.5) 0%, transparent 100%)",
          }}
        />
        
        {/* Lower girdle facet grooves */}
        <div 
          className="absolute bottom-[35%] left-[10%] w-[20%] h-[1px]"
          style={{ 
            transform: "rotate(-35deg)",
            background: "linear-gradient(90deg, rgba(255,255,255,0.5) 0%, transparent 100%)",
          }}
        />
        <div 
          className="absolute bottom-[35%] right-[10%] w-[20%] h-[1px]"
          style={{ 
            transform: "rotate(35deg)",
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 100%)",
          }}
        />
      </div>
      
      {/* Diamond fire glitter - scattered prismatic sparkles */}
      <div className="absolute inset-0 pointer-events-none opacity-60">
        {/* Central brilliance cluster */}
        <div 
          className="absolute top-[30%] left-1/2 -translate-x-1/2 w-3 h-3"
          style={{ 
            background: "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.6) 40%, transparent 70%)",
            boxShadow: "0 0 8px 3px rgba(255,255,255,0.8)"
          }}
        />
        
        {/* Scattered glitter particles - mimicking diamond's internal reflections */}
        {/* Upper crown area */}
        <div 
          className="absolute top-[15%] left-[25%] w-1 h-1 rounded-full animate-[sparkle_2.2s_ease-in-out_infinite]"
          style={{ 
            background: "rgba(255,255,255,0.9)",
            boxShadow: "0 0 4px 1px rgba(103,232,249,0.8)",
            animationDelay: "0.1s"
          }}
        />
        <div 
          className="absolute top-[12%] left-[45%] w-0.5 h-0.5 rounded-full animate-[sparkle_1.8s_ease-in-out_infinite]"
          style={{ 
            background: "rgba(255,255,255,0.95)",
            boxShadow: "0 0 3px 1px rgba(196,181,253,0.7)",
            animationDelay: "0.3s"
          }}
        />
        <div 
          className="absolute top-[18%] right-[28%] w-1 h-1 rounded-full animate-[sparkle_2s_ease-in-out_infinite]"
          style={{ 
            background: "rgba(255,255,255,0.85)",
            boxShadow: "0 0 4px 1px rgba(167,139,250,0.8)",
            animationDelay: "0.5s"
          }}
        />
        <div 
          className="absolute top-[22%] left-[18%] w-0.5 h-0.5 rounded-full animate-[sparkle_2.5s_ease-in-out_infinite]"
          style={{ 
            background: "rgba(255,255,255,0.9)",
            boxShadow: "0 0 3px 1px rgba(59,130,246,0.7)",
            animationDelay: "0.7s"
          }}
        />
        
        {/* Mid-section glitter */}
        <div 
          className="absolute top-[35%] left-[15%] w-1 h-1 rounded-full animate-[sparkle_1.9s_ease-in-out_infinite]"
          style={{ 
            background: "rgba(255,255,255,0.9)",
            boxShadow: "0 0 4px 1px rgba(254,240,138,0.8)",
            animationDelay: "0.2s"
          }}
        />
        <div 
          className="absolute top-[38%] right-[20%] w-0.5 h-0.5 rounded-full animate-[sparkle_2.3s_ease-in-out_infinite]"
          style={{ 
            background: "rgba(255,255,255,0.85)",
            boxShadow: "0 0 3px 1px rgba(251,207,232,0.7)",
            animationDelay: "0.4s"
          }}
        />
        <div 
          className="absolute top-[42%] left-[35%] w-1 h-1 rounded-full animate-[sparkle_2.1s_ease-in-out_infinite]"
          style={{ 
            background: "rgba(255,255,255,0.9)",
            boxShadow: "0 0 4px 1px rgba(134,239,172,0.8)",
            animationDelay: "0.6s"
          }}
        />
        <div 
          className="absolute top-[40%] right-[38%] w-0.5 h-0.5 rounded-full animate-[sparkle_1.7s_ease-in-out_infinite]"
          style={{ 
            background: "rgba(255,255,255,0.95)",
            boxShadow: "0 0 3px 1px rgba(103,232,249,0.7)",
            animationDelay: "0.8s"
          }}
        />
        
        {/* Lower pavilion glitter */}
        <div 
          className="absolute bottom-[35%] left-[22%] w-1 h-1 rounded-full animate-[sparkle_2.4s_ease-in-out_infinite]"
          style={{ 
            background: "rgba(255,255,255,0.85)",
            boxShadow: "0 0 4px 1px rgba(99,102,241,0.8)",
            animationDelay: "0.15s"
          }}
        />
        <div 
          className="absolute bottom-[38%] right-[25%] w-0.5 h-0.5 rounded-full animate-[sparkle_1.6s_ease-in-out_infinite]"
          style={{ 
            background: "rgba(255,255,255,0.9)",
            boxShadow: "0 0 3px 1px rgba(244,114,182,0.7)",
            animationDelay: "0.35s"
          }}
        />
        <div 
          className="absolute bottom-[28%] left-[40%] w-1 h-1 rounded-full animate-[sparkle_2s_ease-in-out_infinite]"
          style={{ 
            background: "rgba(255,255,255,0.9)",
            boxShadow: "0 0 4px 1px rgba(196,181,253,0.8)",
            animationDelay: "0.55s"
          }}
        />
        <div 
          className="absolute bottom-[32%] right-[42%] w-0.5 h-0.5 rounded-full animate-[sparkle_2.2s_ease-in-out_infinite]"
          style={{ 
            background: "rgba(255,255,255,0.85)",
            boxShadow: "0 0 3px 1px rgba(254,240,138,0.7)",
            animationDelay: "0.75s"
          }}
        />
        
        {/* Edge sparkles */}
        <div 
          className="absolute top-[50%] left-[10%] w-0.5 h-0.5 rounded-full animate-[sparkle_2.6s_ease-in-out_infinite]"
          style={{ 
            background: "rgba(255,255,255,0.8)",
            boxShadow: "0 0 3px 1px rgba(167,139,250,0.6)",
            animationDelay: "0.25s"
          }}
        />
        <div 
          className="absolute top-[55%] right-[12%] w-0.5 h-0.5 rounded-full animate-[sparkle_2.1s_ease-in-out_infinite]"
          style={{ 
            background: "rgba(255,255,255,0.8)",
            boxShadow: "0 0 3px 1px rgba(103,232,249,0.6)",
            animationDelay: "0.45s"
          }}
        />
        <div 
          className="absolute bottom-[22%] left-[30%] w-0.5 h-0.5 rounded-full animate-[sparkle_1.9s_ease-in-out_infinite]"
          style={{ 
            background: "rgba(255,255,255,0.85)",
            boxShadow: "0 0 3px 1px rgba(59,130,246,0.6)",
            animationDelay: "0.65s"
          }}
        />
        <div 
          className="absolute bottom-[25%] right-[32%] w-0.5 h-0.5 rounded-full animate-[sparkle_2.3s_ease-in-out_infinite]"
          style={{ 
            background: "rgba(255,255,255,0.85)",
            boxShadow: "0 0 3px 1px rgba(251,207,232,0.6)",
            animationDelay: "0.85s"
          }}
        />
        
        {/* Culet point sparkle */}
        <div 
          className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full animate-[sparkle_1.4s_ease-in-out_infinite]"
          style={{ 
            background: "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(167,139,250,0.5) 60%, transparent 90%)",
            boxShadow: "0 0 6px 2px rgba(255,255,255,0.7)"
          }}
        />
      </div>
    </>
  );
};

export default ButtonFacets;