export const ButtonLightRays = ({ isHovered }: { isHovered: boolean }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {isHovered && (
        <>
          {/* Top rays with rainbow spectrum - reduced */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-[1.5px] h-16 bg-gradient-to-t from-cyan-400/40 via-purple-400/25 to-transparent animate-[fade-in_0.3s_ease-out,rainbow-spectrum_4s_linear_infinite] origin-bottom" 
               style={{ transform: 'translateX(-50%) translateY(-100%) rotate(-15deg)' }} />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-[1.5px] h-20 bg-gradient-to-t from-purple-400/35 via-pink-400/20 to-transparent animate-[fade-in_0.35s_ease-out,rainbow-spectrum_4s_linear_infinite] origin-bottom" 
               style={{ animationDelay: '0s, 0.5s' }} />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-[1.5px] h-16 bg-gradient-to-t from-pink-400/40 via-cyan-400/25 to-transparent animate-[fade-in_0.4s_ease-out,rainbow-spectrum_4s_linear_infinite] origin-bottom" 
               style={{ transform: 'translateX(-50%) translateY(-100%) rotate(15deg)', animationDelay: '0s, 1s' }} />
          
          {/* Right rays with rainbow spectrum - reduced */}
          <div className="absolute top-1/2 right-0 translate-x-full -translate-y-1/2 w-16 h-[1.5px] bg-gradient-to-r from-cyan-400/40 via-purple-400/25 to-transparent animate-[fade-in_0.3s_ease-out,rainbow-spectrum_4s_linear_infinite] origin-left" 
               style={{ transform: 'translateX(100%) translateY(-50%) rotate(-15deg)', animationDelay: '0s, 1.5s' }} />
          <div className="absolute top-1/2 right-0 translate-x-full -translate-y-1/2 w-20 h-[1.5px] bg-gradient-to-r from-purple-400/35 via-pink-400/20 to-transparent animate-[fade-in_0.35s_ease-out,rainbow-spectrum_4s_linear_infinite] origin-left" 
               style={{ animationDelay: '0s, 2s' }} />
          <div className="absolute top-1/2 right-0 translate-x-full -translate-y-1/2 w-16 h-[1.5px] bg-gradient-to-r from-pink-400/40 via-cyan-400/25 to-transparent animate-[fade-in_0.4s_ease-out,rainbow-spectrum_4s_linear_infinite] origin-left" 
               style={{ transform: 'translateX(100%) translateY(-50%) rotate(15deg)', animationDelay: '0s, 2.5s' }} />
          
          {/* Bottom rays with rainbow spectrum - reduced */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-[1.5px] h-16 bg-gradient-to-b from-cyan-400/40 via-purple-400/25 to-transparent animate-[fade-in_0.3s_ease-out,rainbow-spectrum_4s_linear_infinite] origin-top" 
               style={{ transform: 'translateX(-50%) translateY(100%) rotate(-15deg)', animationDelay: '0s, 3s' }} />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-[1.5px] h-20 bg-gradient-to-b from-purple-400/35 via-pink-400/20 to-transparent animate-[fade-in_0.35s_ease-out,rainbow-spectrum_4s_linear_infinite] origin-top" 
               style={{ animationDelay: '0s, 3.5s' }} />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-[1.5px] h-16 bg-gradient-to-b from-pink-400/40 via-cyan-400/25 to-transparent animate-[fade-in_0.4s_ease-out,rainbow-spectrum_4s_linear_infinite] origin-top" 
               style={{ transform: 'translateX(-50%) translateY(100%) rotate(15deg)', animationDelay: '0s, 0.2s' }} />
          
          {/* Left rays with rainbow spectrum - reduced */}
          <div className="absolute top-1/2 left-0 -translate-x-full -translate-y-1/2 w-16 h-[1.5px] bg-gradient-to-l from-cyan-400/40 via-purple-400/25 to-transparent animate-[fade-in_0.3s_ease-out,rainbow-spectrum_4s_linear_infinite] origin-right" 
               style={{ transform: 'translateX(-100%) translateY(-50%) rotate(-15deg)', animationDelay: '0s, 0.7s' }} />
          <div className="absolute top-1/2 left-0 -translate-x-full -translate-y-1/2 w-20 h-[1.5px] bg-gradient-to-l from-purple-400/35 via-pink-400/20 to-transparent animate-[fade-in_0.35s_ease-out,rainbow-spectrum_4s_linear_infinite] origin-right" 
               style={{ animationDelay: '0s, 1.2s' }} />
          <div className="absolute top-1/2 left-0 -translate-x-full -translate-y-1/2 w-16 h-[1.5px] bg-gradient-to-l from-pink-400/40 via-cyan-400/25 to-transparent animate-[fade-in_0.4s_ease-out,rainbow-spectrum_4s_linear_infinite] origin-right" 
               style={{ transform: 'translateX(-100%) translateY(-50%) rotate(15deg)', animationDelay: '0s, 1.7s' }} />
          
          {/* Diagonal rays - reduced */}
          <div className="absolute top-0 left-0 w-20 h-[1px] bg-gradient-to-br from-cyan-300/25 via-purple-300/15 to-transparent animate-[fade-in_0.4s_ease-out,rainbow-spectrum_4s_linear_infinite] origin-top-left rotate-45" 
               style={{ transform: 'rotate(45deg) translateX(-50%) translateY(-50%)', animationDelay: '0s, 2.2s' }} />
          
          {/* Diagonal rays - top right to bottom left - reduced */}
          <div className="absolute top-0 right-0 w-20 h-[1px] bg-gradient-to-bl from-pink-300/25 via-purple-300/15 to-transparent animate-[fade-in_0.4s_ease-out,rainbow-spectrum_4s_linear_infinite] origin-top-right -rotate-45" 
               style={{ transform: 'rotate(-45deg) translateX(50%) translateY(-50%)', animationDelay: '0s, 2.8s' }} />
          
          {/* Pulsing core light - reduced */}
          <div className="absolute inset-0 bg-gradient-radial from-white/5 via-transparent to-transparent animate-[pulse_2s_ease-in-out_infinite,rainbow-spectrum_4s_linear_infinite]" />
        </>
      )}
    </div>
  );
};
