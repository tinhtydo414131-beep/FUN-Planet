export const ButtonFacets = () => {
  return (
    <>
      {/* Diamond glass base - crystal clear with depth */}
      <div 
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.1) 100%)",
          backdropFilter: "blur(1px)"
        }}
      />
      
      {/* Brilliant cut facets - Crown (top portion) */}
      <div className="absolute inset-0 opacity-30 pointer-events-none overflow-hidden">
        {/* Table facet - center top (the flat top of a brilliant cut) */}
        <div 
          className="absolute top-[20%] left-[25%] w-[50%] h-[25%]"
          style={{ 
            clipPath: "polygon(15% 0, 85% 0, 100% 100%, 0 100%)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(240,249,255,0.6) 50%, rgba(255,255,255,0.3) 100%)",
            filter: "blur(1px)"
          }}
        />
        
        {/* Star facets - 8 triangular facets around the table */}
        <div 
          className="absolute top-[15%] left-[20%] w-[20%] h-[20%]"
          style={{ 
            clipPath: "polygon(100% 100%, 50% 0, 0 80%)",
            background: "linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(224,242,254,0.4) 100%)",
            filter: "blur(0.5px)"
          }}
        />
        <div 
          className="absolute top-[15%] right-[20%] w-[20%] h-[20%]"
          style={{ 
            clipPath: "polygon(0 100%, 50% 0, 100% 80%)",
            background: "linear-gradient(-135deg, rgba(255,255,255,0.8) 0%, rgba(233,213,255,0.4) 100%)",
            filter: "blur(0.5px)"
          }}
        />
        
        {/* Bezel facets - kite-shaped facets */}
        <div 
          className="absolute top-[10%] left-[10%] w-[25%] h-[35%]"
          style={{ 
            clipPath: "polygon(80% 0, 100% 50%, 50% 100%, 0 40%)",
            background: "linear-gradient(160deg, rgba(255,255,255,0.7) 0%, rgba(186,230,253,0.3) 60%, transparent 100%)",
            filter: "blur(0.8px)"
          }}
        />
        <div 
          className="absolute top-[10%] right-[10%] w-[25%] h-[35%]"
          style={{ 
            clipPath: "polygon(20% 0, 100% 40%, 50% 100%, 0 50%)",
            background: "linear-gradient(-160deg, rgba(255,255,255,0.7) 0%, rgba(221,214,254,0.3) 60%, transparent 100%)",
            filter: "blur(0.8px)"
          }}
        />
        
        {/* Upper girdle facets */}
        <div 
          className="absolute top-[35%] left-[5%] w-[20%] h-[20%]"
          style={{ 
            clipPath: "polygon(100% 0, 100% 100%, 0 60%, 30% 0)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(165,243,252,0.3) 100%)",
            filter: "blur(0.5px)"
          }}
        />
        <div 
          className="absolute top-[35%] right-[5%] w-[20%] h-[20%]"
          style={{ 
            clipPath: "polygon(0 0, 70% 0, 100% 60%, 0 100%)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(196,181,253,0.3) 100%)",
            filter: "blur(0.5px)"
          }}
        />
      </div>
      
      {/* Pavilion facets - Bottom portion creating the fire */}
      <div className="absolute inset-0 opacity-25 pointer-events-none overflow-hidden">
        {/* Main pavilion facets - creating the V pattern */}
        <div 
          className="absolute bottom-[15%] left-[15%] w-[35%] h-[40%]"
          style={{ 
            clipPath: "polygon(0 0, 100% 20%, 85% 100%, 15% 80%)",
            background: "linear-gradient(200deg, rgba(255,255,255,0.6) 0%, rgba(103,232,249,0.4) 40%, rgba(59,130,246,0.2) 100%)",
            filter: "blur(1px)"
          }}
        />
        <div 
          className="absolute bottom-[15%] right-[15%] w-[35%] h-[40%]"
          style={{ 
            clipPath: "polygon(100% 0, 0 20%, 15% 100%, 85% 80%)",
            background: "linear-gradient(-200deg, rgba(255,255,255,0.6) 0%, rgba(196,181,253,0.4) 40%, rgba(139,92,246,0.2) 100%)",
            filter: "blur(1px)"
          }}
        />
        
        {/* Lower girdle facets */}
        <div 
          className="absolute bottom-[25%] left-[25%] w-[25%] h-[30%]"
          style={{ 
            clipPath: "polygon(50% 0, 100% 30%, 80% 100%, 20% 100%, 0 30%)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(251,207,232,0.3) 50%, rgba(244,114,182,0.15) 100%)",
            filter: "blur(0.8px)"
          }}
        />
        <div 
          className="absolute bottom-[25%] right-[25%] w-[25%] h-[30%]"
          style={{ 
            clipPath: "polygon(50% 0, 100% 30%, 80% 100%, 20% 100%, 0 30%)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(254,240,138,0.3) 50%, rgba(250,204,21,0.15) 100%)",
            filter: "blur(0.8px)"
          }}
        />
        
        {/* Culet - bottom point reflection */}
        <div 
          className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-[30%] h-[25%]"
          style={{ 
            clipPath: "polygon(50% 100%, 0 0, 100% 0)",
            background: "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.8) 0%, rgba(224,242,254,0.4) 50%, transparent 100%)",
            filter: "blur(1px)"
          }}
        />
      </div>
      
      {/* Fire - Rainbow light dispersion (signature of real diamonds) */}
      <div className="absolute inset-0 opacity-40 pointer-events-none overflow-hidden">
        {/* Spectral fire flashes */}
        <div 
          className="absolute top-[30%] left-[20%] w-[15%] h-[8%] animate-[shimmer_2s_ease-in-out_infinite]"
          style={{ 
            background: "linear-gradient(90deg, rgba(239,68,68,0.6) 0%, rgba(249,115,22,0.6) 25%, rgba(234,179,8,0.6) 50%, rgba(34,197,94,0.6) 75%, rgba(59,130,246,0.6) 100%)",
            filter: "blur(2px)",
            transform: "rotate(-15deg)"
          }}
        />
        <div 
          className="absolute top-[25%] right-[25%] w-[12%] h-[6%] animate-[shimmer_2.5s_ease-in-out_infinite]"
          style={{ 
            background: "linear-gradient(90deg, rgba(168,85,247,0.6) 0%, rgba(236,72,153,0.6) 33%, rgba(239,68,68,0.6) 66%, rgba(249,115,22,0.6) 100%)",
            filter: "blur(2px)",
            transform: "rotate(20deg)",
            animationDelay: "0.5s"
          }}
        />
        <div 
          className="absolute bottom-[35%] left-[30%] w-[18%] h-[5%] animate-[shimmer_3s_ease-in-out_infinite]"
          style={{ 
            background: "linear-gradient(90deg, rgba(34,197,94,0.5) 0%, rgba(6,182,212,0.5) 33%, rgba(59,130,246,0.5) 66%, rgba(139,92,246,0.5) 100%)",
            filter: "blur(2px)",
            transform: "rotate(10deg)",
            animationDelay: "1s"
          }}
        />
        <div 
          className="absolute bottom-[40%] right-[20%] w-[10%] h-[4%] animate-[shimmer_2.2s_ease-in-out_infinite]"
          style={{ 
            background: "linear-gradient(90deg, rgba(234,179,8,0.6) 0%, rgba(132,204,22,0.6) 50%, rgba(34,197,94,0.6) 100%)",
            filter: "blur(1.5px)",
            transform: "rotate(-25deg)",
            animationDelay: "0.8s"
          }}
        />
      </div>
      
      {/* Brilliance - Internal white light reflections */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Primary brilliance flash */}
        <div 
          className="absolute top-[25%] left-[30%] w-[40%] h-[20%] animate-[pulse_2s_ease-in-out_infinite]"
          style={{ 
            background: "radial-gradient(ellipse at center, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 40%, transparent 70%)",
            filter: "blur(3px)"
          }}
        />
        
        {/* Secondary brilliance points */}
        <div 
          className="absolute top-[40%] left-[15%] w-4 h-4 animate-[sparkle_1.5s_ease-in-out_infinite]"
          style={{ 
            background: "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.5) 30%, transparent 70%)",
            filter: "blur(1px)"
          }}
        />
        <div 
          className="absolute top-[35%] right-[18%] w-3 h-3 animate-[sparkle_1.8s_ease-in-out_infinite]"
          style={{ 
            background: "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.5) 30%, transparent 70%)",
            filter: "blur(1px)",
            animationDelay: "0.4s"
          }}
        />
        <div 
          className="absolute bottom-[30%] left-[35%] w-3.5 h-3.5 animate-[sparkle_2s_ease-in-out_infinite]"
          style={{ 
            background: "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.5) 30%, transparent 70%)",
            filter: "blur(1px)",
            animationDelay: "0.7s"
          }}
        />
        <div 
          className="absolute bottom-[35%] right-[30%] w-2.5 h-2.5 animate-[sparkle_1.6s_ease-in-out_infinite]"
          style={{ 
            background: "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.5) 30%, transparent 70%)",
            filter: "blur(0.8px)",
            animationDelay: "1s"
          }}
        />
      </div>
      
      {/* Scintillation - Sharp sparkle points that flash */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Star-shaped sparkles */}
        <div 
          className="absolute top-[20%] left-[25%] w-2 h-2"
          style={{ animationDelay: "0s" }}
        >
          <div className="absolute inset-0 bg-white rounded-full blur-[0.5px] opacity-90 animate-[sparkle_1.2s_ease-in-out_infinite]" />
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-4 bg-white/80 animate-[sparkle_1.2s_ease-in-out_infinite]"
            style={{ filter: "blur(0.3px)" }}
          />
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-[1px] bg-white/80 animate-[sparkle_1.2s_ease-in-out_infinite]"
            style={{ filter: "blur(0.3px)" }}
          />
        </div>
        
        <div 
          className="absolute top-[30%] right-[20%] w-1.5 h-1.5"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="absolute inset-0 bg-white rounded-full blur-[0.5px] opacity-85 animate-[sparkle_1.5s_ease-in-out_infinite]" style={{ animationDelay: "0.3s" }} />
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-3 bg-white/70 animate-[sparkle_1.5s_ease-in-out_infinite]"
            style={{ filter: "blur(0.3px)", animationDelay: "0.3s" }}
          />
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-[1px] bg-white/70 animate-[sparkle_1.5s_ease-in-out_infinite]"
            style={{ filter: "blur(0.3px)", animationDelay: "0.3s" }}
          />
        </div>
        
        <div 
          className="absolute bottom-[25%] left-[22%] w-1.5 h-1.5"
        >
          <div className="absolute inset-0 bg-white rounded-full blur-[0.5px] opacity-80 animate-[sparkle_1.8s_ease-in-out_infinite]" style={{ animationDelay: "0.6s" }} />
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-3 bg-white/60 animate-[sparkle_1.8s_ease-in-out_infinite]"
            style={{ filter: "blur(0.3px)", animationDelay: "0.6s" }}
          />
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-[1px] bg-white/60 animate-[sparkle_1.8s_ease-in-out_infinite]"
            style={{ filter: "blur(0.3px)", animationDelay: "0.6s" }}
          />
        </div>
        
        <div 
          className="absolute bottom-[30%] right-[25%] w-2 h-2"
        >
          <div className="absolute inset-0 bg-white rounded-full blur-[0.5px] opacity-90 animate-[sparkle_1.4s_ease-in-out_infinite]" style={{ animationDelay: "0.9s" }} />
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-4 bg-white/80 animate-[sparkle_1.4s_ease-in-out_infinite]"
            style={{ filter: "blur(0.3px)", animationDelay: "0.9s" }}
          />
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-[1px] bg-white/80 animate-[sparkle_1.4s_ease-in-out_infinite]"
            style={{ filter: "blur(0.3px)", animationDelay: "0.9s" }}
          />
        </div>
      </div>
      
      {/* Edge brilliance - Girdle light catch */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute top-0 left-[10%] right-[10%] h-[2px] animate-[shimmer_2s_ease-in-out_infinite]"
          style={{ 
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.95) 20%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.95) 80%, transparent 100%)",
            boxShadow: "0 0 10px 2px rgba(255,255,255,0.6), 0 0 20px 4px rgba(255,255,255,0.3)"
          }}
        />
        <div 
          className="absolute bottom-0 left-[10%] right-[10%] h-[2px] animate-[shimmer_2s_ease-in-out_infinite]"
          style={{ 
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 20%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.9) 80%, transparent 100%)",
            boxShadow: "0 0 10px 2px rgba(255,255,255,0.5), 0 0 20px 4px rgba(255,255,255,0.25)",
            animationDelay: "0.5s"
          }}
        />
        <div 
          className="absolute left-0 top-[10%] bottom-[10%] w-[2px] animate-[shimmer_2.2s_ease-in-out_infinite]"
          style={{ 
            background: "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.95) 20%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.95) 80%, transparent 100%)",
            boxShadow: "0 0 10px 2px rgba(255,255,255,0.6), 0 0 20px 4px rgba(255,255,255,0.3)",
            animationDelay: "0.25s"
          }}
        />
        <div 
          className="absolute right-0 top-[10%] bottom-[10%] w-[2px] animate-[shimmer_2.2s_ease-in-out_infinite]"
          style={{ 
            background: "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.9) 20%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.9) 80%, transparent 100%)",
            boxShadow: "0 0 10px 2px rgba(255,255,255,0.5), 0 0 20px 4px rgba(255,255,255,0.25)",
            animationDelay: "0.75s"
          }}
        />
      </div>
      
      {/* Corner facet catches */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute top-0 left-0 w-5 h-5 animate-[sparkle_1.5s_ease-in-out_infinite]"
          style={{ 
            background: "radial-gradient(circle at 100% 100%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.5) 30%, transparent 60%)",
            boxShadow: "3px 3px 12px rgba(255,255,255,0.4)"
          }}
        />
        <div 
          className="absolute top-0 right-0 w-5 h-5 animate-[sparkle_1.5s_ease-in-out_infinite]"
          style={{ 
            background: "radial-gradient(circle at 0% 100%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.5) 30%, transparent 60%)",
            boxShadow: "-3px 3px 12px rgba(255,255,255,0.4)",
            animationDelay: "0.4s"
          }}
        />
        <div 
          className="absolute bottom-0 left-0 w-5 h-5 animate-[sparkle_1.5s_ease-in-out_infinite]"
          style={{ 
            background: "radial-gradient(circle at 100% 0%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.5) 30%, transparent 60%)",
            boxShadow: "3px -3px 12px rgba(255,255,255,0.4)",
            animationDelay: "0.7s"
          }}
        />
        <div 
          className="absolute bottom-0 right-0 w-5 h-5 animate-[sparkle_1.5s_ease-in-out_infinite]"
          style={{ 
            background: "radial-gradient(circle at 0% 0%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.5) 30%, transparent 60%)",
            boxShadow: "-3px -3px 12px rgba(255,255,255,0.4)",
            animationDelay: "1s"
          }}
        />
      </div>
    </>
  );
};