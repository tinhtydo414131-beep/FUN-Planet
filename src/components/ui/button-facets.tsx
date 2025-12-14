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
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,1), rgba(103,232,249,0.96), rgba(255,255,255,1), transparent)",
            boxShadow: "0 0 10px 2.5px rgba(255,255,255,0.72), 0 0 18px 5px rgba(103,232,249,0.48)",
            filter: "blur(0.5px)"
          }}
        />
        {/* Bottom edge facet */}
        <div 
          className="absolute bottom-0 left-[10%] right-[10%] h-[2px] animate-[shimmer_2s_ease-in-out_infinite]"
          style={{ 
            background: "linear-gradient(90deg, transparent, rgba(196,181,253,0.96), rgba(255,255,255,1), rgba(196,181,253,0.96), transparent)",
            boxShadow: "0 0 10px 2.5px rgba(255,255,255,0.72), 0 0 18px 5px rgba(196,181,253,0.48)",
            filter: "blur(0.5px)",
            animationDelay: "0.5s"
          }}
        />
        {/* Left edge facet */}
        <div 
          className="absolute left-0 top-[10%] bottom-[10%] w-[2px] animate-[shimmer_2.2s_ease-in-out_infinite]"
          style={{ 
            background: "linear-gradient(180deg, transparent, rgba(255,255,255,1), rgba(103,232,249,0.96), rgba(255,255,255,1), transparent)",
            boxShadow: "0 0 10px 2.5px rgba(255,255,255,0.72), 0 0 18px 5px rgba(103,232,249,0.48)",
            filter: "blur(0.5px)",
            animationDelay: "0.3s"
          }}
        />
        {/* Right edge facet */}
        <div 
          className="absolute right-0 top-[10%] bottom-[10%] w-[2px] animate-[shimmer_2.2s_ease-in-out_infinite]"
          style={{ 
            background: "linear-gradient(180deg, transparent, rgba(196,181,253,0.96), rgba(255,255,255,1), rgba(196,181,253,0.96), transparent)",
            boxShadow: "0 0 10px 2.5px rgba(255,255,255,0.72), 0 0 18px 5px rgba(196,181,253,0.48)",
            filter: "blur(0.5px)",
            animationDelay: "0.8s"
          }}
        />
        
        {/* Corner cut facets - luminous diamonds */}
        <div 
          className="absolute top-0 left-0 w-4 h-4 animate-[sparkle_1.5s_ease-in-out_infinite]"
          style={{ 
            background: "radial-gradient(circle at 100% 100%, rgba(255,255,255,1) 0%, rgba(103,232,249,0.72) 30%, transparent 70%)",
            boxShadow: "2px 2px 12px rgba(255,255,255,0.6)"
          }}
        />
        <div 
          className="absolute top-0 right-0 w-4 h-4 animate-[sparkle_1.5s_ease-in-out_infinite]"
          style={{ 
            background: "radial-gradient(circle at 0% 100%, rgba(255,255,255,1) 0%, rgba(196,181,253,0.72) 30%, transparent 70%)",
            boxShadow: "-2px 2px 12px rgba(255,255,255,0.6)",
            animationDelay: "0.4s"
          }}
        />
        <div 
          className="absolute bottom-0 left-0 w-4 h-4 animate-[sparkle_1.5s_ease-in-out_infinite]"
          style={{ 
            background: "radial-gradient(circle at 100% 0%, rgba(255,255,255,1) 0%, rgba(251,207,232,0.72) 30%, transparent 70%)",
            boxShadow: "2px -2px 12px rgba(255,255,255,0.6)",
            animationDelay: "0.7s"
          }}
        />
        <div 
          className="absolute bottom-0 right-0 w-4 h-4 animate-[sparkle_1.5s_ease-in-out_infinite]"
          style={{ 
            background: "radial-gradient(circle at 0% 0%, rgba(255,255,255,1) 0%, rgba(254,240,138,0.72) 30%, transparent 70%)",
            boxShadow: "-2px -2px 12px rgba(255,255,255,0.6)",
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
      
    </>
  );
};

export default ButtonFacets;