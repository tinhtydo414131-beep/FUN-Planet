export const ButtonFacets = () => {
  return (
    <>
      {/* Ambient diamond glow - subtle outer radiance */}
      <div 
        className="absolute inset-[-4px] rounded-2xl pointer-events-none opacity-40"
        style={{
          background: "radial-gradient(ellipse at center, rgba(255,255,255,0.2) 0%, rgba(167,139,250,0.1) 40%, transparent 70%)",
          filter: "blur(8px)"
        }}
      />
      
      {/* Diamond edge brilliance - crisp light reflection on edges */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top edge - bright reflection */}
        <div 
          className="absolute top-0 left-[8%] right-[8%] h-[1px]"
          style={{ 
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent 100%)",
            boxShadow: "0 0 4px 1px rgba(255,255,255,0.5)"
          }}
        />
        {/* Bottom edge */}
        <div 
          className="absolute bottom-0 left-[8%] right-[8%] h-[1px]"
          style={{ 
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 30%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.5) 70%, transparent 100%)",
            boxShadow: "0 0 3px 1px rgba(255,255,255,0.3)"
          }}
        />
        {/* Left edge */}
        <div 
          className="absolute left-0 top-[8%] bottom-[8%] w-[1px]"
          style={{ 
            background: "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.6) 30%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.6) 70%, transparent 100%)",
            boxShadow: "0 0 3px 1px rgba(255,255,255,0.4)"
          }}
        />
        {/* Right edge */}
        <div 
          className="absolute right-0 top-[8%] bottom-[8%] w-[1px]"
          style={{ 
            background: "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.6) 30%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.6) 70%, transparent 100%)",
            boxShadow: "0 0 3px 1px rgba(255,255,255,0.4)"
          }}
        />
        
        {/* Corner brilliance points */}
        <div 
          className="absolute top-0 left-0 w-3 h-3"
          style={{ 
            background: "radial-gradient(circle at 100% 100%, rgba(255,255,255,0.8) 0%, transparent 60%)",
          }}
        />
        <div 
          className="absolute top-0 right-0 w-3 h-3"
          style={{ 
            background: "radial-gradient(circle at 0% 100%, rgba(255,255,255,0.8) 0%, transparent 60%)",
          }}
        />
        <div 
          className="absolute bottom-0 left-0 w-3 h-3"
          style={{ 
            background: "radial-gradient(circle at 100% 0%, rgba(255,255,255,0.7) 0%, transparent 60%)",
          }}
        />
        <div 
          className="absolute bottom-0 right-0 w-3 h-3"
          style={{ 
            background: "radial-gradient(circle at 0% 0%, rgba(255,255,255,0.7) 0%, transparent 60%)",
          }}
        />
      </div>
      
      {/* Diamond brilliant cut facets at 30% visibility */}
      <div className="absolute inset-0 opacity-25 pointer-events-none">
        {/* Table facet - Center window */}
        <div 
          className="absolute top-[18%] left-1/2 -translate-x-1/2 w-[50%] h-[30%]"
          style={{ 
            clipPath: "polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)",
            background: "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.5) 100%)",
            filter: "blur(3px)",
          }}
        />
        
        {/* Crown star facets */}
        <div 
          className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[30%] h-[20%]"
          style={{ 
            clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.2) 100%)",
            filter: "blur(4px)",
          }}
        />
        
        {/* Bezel facets */}
        <div 
          className="absolute top-[8%] left-[5%] w-[30%] h-[35%]"
          style={{ 
            clipPath: "polygon(0% 0%, 100% 20%, 80% 100%, 0% 70%)",
            background: "linear-gradient(120deg, rgba(255,255,255,0.5) 0%, transparent 70%)",
            filter: "blur(5px)",
          }}
        />
        <div 
          className="absolute top-[8%] right-[5%] w-[30%] h-[35%]"
          style={{ 
            clipPath: "polygon(100% 0%, 100% 70%, 20% 100%, 0% 20%)",
            background: "linear-gradient(-120deg, rgba(255,255,255,0.5) 0%, transparent 70%)",
            filter: "blur(5px)",
          }}
        />
        
        {/* Pavilion main facets */}
        <div 
          className="absolute bottom-[5%] left-1/2 -translate-x-1/2 w-[45%] h-[35%]"
          style={{ 
            clipPath: "polygon(0% 0%, 100% 0%, 50% 100%)",
            background: "linear-gradient(0deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.2) 100%)",
            filter: "blur(4px)",
          }}
        />
        
        {/* Lower pavilion facets */}
        <div 
          className="absolute bottom-[10%] left-[5%] w-[30%] h-[35%]"
          style={{ 
            clipPath: "polygon(0% 30%, 80% 0%, 100% 60%, 20% 100%)",
            background: "linear-gradient(60deg, rgba(255,255,255,0.4) 0%, transparent 70%)",
            filter: "blur(5px)",
          }}
        />
        <div 
          className="absolute bottom-[10%] right-[5%] w-[30%] h-[35%]"
          style={{ 
            clipPath: "polygon(100% 30%, 20% 0%, 0% 60%, 80% 100%)",
            background: "linear-gradient(-60deg, rgba(255,255,255,0.4) 0%, transparent 70%)",
            filter: "blur(5px)",
          }}
        />
      </div>
      
      {/* Diamond facet grooves - refined brilliant cut lines */}
      <div className="absolute inset-0 opacity-40 pointer-events-none overflow-hidden">
        {/* Crown radial grooves from table center */}
        <div 
          className="absolute top-[28%] left-1/2 w-[1px] h-[18%] -translate-x-1/2"
          style={{ 
            background: "linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)",
          }}
        />
        <div 
          className="absolute top-[28%] left-1/2 w-[1px] h-[16%] origin-top"
          style={{ 
            transform: "translateX(-50%) rotate(35deg)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, transparent 100%)",
          }}
        />
        <div 
          className="absolute top-[28%] left-1/2 w-[1px] h-[16%] origin-top"
          style={{ 
            transform: "translateX(-50%) rotate(-35deg)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, transparent 100%)",
          }}
        />
        
        {/* Crown bezel grooves */}
        <div 
          className="absolute top-[10%] left-[12%] w-[28%] h-[1px]"
          style={{ 
            transform: "rotate(22deg)",
            background: "linear-gradient(90deg, rgba(255,255,255,0.5) 0%, transparent 100%)",
          }}
        />
        <div 
          className="absolute top-[10%] right-[12%] w-[28%] h-[1px]"
          style={{ 
            transform: "rotate(-22deg)",
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 100%)",
          }}
        />
        
        {/* Girdle line */}
        <div 
          className="absolute top-[48%] left-[8%] right-[8%] h-[1px]"
          style={{ 
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 25%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.4) 75%, transparent 100%)",
          }}
        />
        
        {/* Pavilion grooves converging to culet */}
        <div 
          className="absolute bottom-[10%] left-1/2 w-[1px] h-[35%] -translate-x-1/2"
          style={{ 
            background: "linear-gradient(0deg, rgba(255,255,255,0.6) 0%, transparent 100%)",
          }}
        />
        <div 
          className="absolute bottom-[10%] left-1/2 w-[1px] h-[32%] origin-bottom"
          style={{ 
            transform: "translateX(-50%) rotate(25deg)",
            background: "linear-gradient(0deg, rgba(255,255,255,0.5) 0%, transparent 100%)",
          }}
        />
        <div 
          className="absolute bottom-[10%] left-1/2 w-[1px] h-[32%] origin-bottom"
          style={{ 
            transform: "translateX(-50%) rotate(-25deg)",
            background: "linear-gradient(0deg, rgba(255,255,255,0.5) 0%, transparent 100%)",
          }}
        />
        <div 
          className="absolute bottom-[10%] left-1/2 w-[1px] h-[28%] origin-bottom"
          style={{ 
            transform: "translateX(-50%) rotate(50deg)",
            background: "linear-gradient(0deg, rgba(255,255,255,0.4) 0%, transparent 100%)",
          }}
        />
        <div 
          className="absolute bottom-[10%] left-1/2 w-[1px] h-[28%] origin-bottom"
          style={{ 
            transform: "translateX(-50%) rotate(-50deg)",
            background: "linear-gradient(0deg, rgba(255,255,255,0.4) 0%, transparent 100%)",
          }}
        />
      </div>
      
      {/* Diamond scintillation - animated light flashes */}
      <div className="absolute inset-0 pointer-events-none opacity-50">
        {/* Primary brilliance - table reflection */}
        <div 
          className="absolute top-[25%] left-1/2 -translate-x-1/2 w-2 h-2 animate-[sparkle_2s_ease-in-out_infinite]"
          style={{ 
            background: "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.5) 50%, transparent 80%)",
            boxShadow: "0 0 6px 2px rgba(255,255,255,0.6)"
          }}
        />
        
        {/* Fire sparkles - prismatic color flashes */}
        <div 
          className="absolute top-[18%] left-[30%] w-1 h-1 rounded-full animate-[sparkle_2.5s_ease-in-out_infinite]"
          style={{ 
            background: "rgba(255,255,255,0.85)",
            boxShadow: "0 0 3px 1px rgba(252,165,165,0.7)",
            animationDelay: "0.1s"
          }}
        />
        <div 
          className="absolute top-[15%] right-[32%] w-0.5 h-0.5 rounded-full animate-[sparkle_2.2s_ease-in-out_infinite]"
          style={{ 
            background: "rgba(255,255,255,0.9)",
            boxShadow: "0 0 3px 1px rgba(134,239,172,0.7)",
            animationDelay: "0.3s"
          }}
        />
        <div 
          className="absolute top-[35%] left-[18%] w-0.5 h-0.5 rounded-full animate-[sparkle_1.8s_ease-in-out_infinite]"
          style={{ 
            background: "rgba(255,255,255,0.85)",
            boxShadow: "0 0 3px 1px rgba(147,197,253,0.7)",
            animationDelay: "0.5s"
          }}
        />
        <div 
          className="absolute top-[40%] right-[22%] w-1 h-1 rounded-full animate-[sparkle_2.3s_ease-in-out_infinite]"
          style={{ 
            background: "rgba(255,255,255,0.8)",
            boxShadow: "0 0 3px 1px rgba(253,224,71,0.7)",
            animationDelay: "0.7s"
          }}
        />
        <div 
          className="absolute bottom-[35%] left-[28%] w-0.5 h-0.5 rounded-full animate-[sparkle_2.1s_ease-in-out_infinite]"
          style={{ 
            background: "rgba(255,255,255,0.9)",
            boxShadow: "0 0 3px 1px rgba(196,181,253,0.7)",
            animationDelay: "0.2s"
          }}
        />
        <div 
          className="absolute bottom-[30%] right-[30%] w-0.5 h-0.5 rounded-full animate-[sparkle_1.9s_ease-in-out_infinite]"
          style={{ 
            background: "rgba(255,255,255,0.85)",
            boxShadow: "0 0 3px 1px rgba(251,146,60,0.7)",
            animationDelay: "0.4s"
          }}
        />
        <div 
          className="absolute bottom-[25%] left-[38%] w-1 h-1 rounded-full animate-[sparkle_2.4s_ease-in-out_infinite]"
          style={{ 
            background: "rgba(255,255,255,0.8)",
            boxShadow: "0 0 3px 1px rgba(192,132,252,0.7)",
            animationDelay: "0.6s"
          }}
        />
        
        {/* Culet sparkle */}
        <div 
          className="absolute bottom-[12%] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full animate-[sparkle_1.6s_ease-in-out_infinite]"
          style={{ 
            background: "radial-gradient(circle, rgba(255,255,255,1) 0%, transparent 80%)",
            boxShadow: "0 0 4px 1px rgba(255,255,255,0.5)"
          }}
        />
      </div>
      
      {/* Subtle inner glow */}
      <div 
        className="absolute inset-[15%] rounded-lg pointer-events-none opacity-20"
        style={{ 
          background: "radial-gradient(ellipse at center, rgba(255,255,255,0.5) 0%, transparent 70%)",
        }}
      />
    </>
  );
};

export default ButtonFacets;