import React from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Music } from "lucide-react";

interface AudioControlsProps {
  isSoundEnabled: boolean;
  onToggleSound: () => void;
}

export const AudioControls = React.forwardRef<HTMLDivElement, AudioControlsProps>(
  ({ isSoundEnabled, onToggleSound }, ref) => {
    const handleMusicClick = () => {
      window.dispatchEvent(new CustomEvent('fp-music:toggle'));
    };

    return (
      <div ref={ref} className="flex gap-3 items-center justify-center">
        {/* Music Button with Diamond Effect */}
        <div className="relative group">
          {/* Ambient glow halo */}
          <div className="absolute inset-[-4px] rounded-lg bg-gradient-to-br from-purple-400/40 via-pink-400/30 to-cyan-400/40 blur-md opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
          
          <Button
            variant="outline"
            size="icon"
            enableEffects={false}
            onClick={handleMusicClick}
            className="relative flex items-center justify-center w-10 h-10 p-0 rounded-lg bg-gradient-to-br from-white via-purple-50/80 to-pink-50/60 border border-purple-300/60 hover:border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.25)] hover:shadow-[0_0_18px_rgba(168,85,247,0.45)] hover:scale-105 transition-all duration-300 overflow-hidden"
            title="Mở nhạc nền"
          >
            {/* Shimmer overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
            
            {/* Corner sparkles */}
            <div className="absolute top-0.5 left-0.5 w-1 h-1 rounded-full bg-white/80 animate-pulse" />
            <div className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-purple-300/80 animate-pulse delay-150" />
            <div className="absolute bottom-0.5 left-0.5 w-1 h-1 rounded-full bg-pink-300/80 animate-pulse delay-300" />
            <div className="absolute bottom-0.5 right-0.5 w-1 h-1 rounded-full bg-cyan-300/80 animate-pulse delay-450" />
            
            {/* Inner diamond highlight */}
            <div className="absolute inset-1 rounded-md bg-gradient-to-br from-white/60 via-transparent to-purple-100/40 pointer-events-none" />
            
            <Music className="h-5 w-5 text-purple-600 relative z-10 drop-shadow-sm" />
          </Button>
        </div>
        
        {/* Sound Toggle Button with Diamond Effect */}
        <div className="relative group">
          {/* Ambient glow halo */}
          <div className="absolute inset-[-4px] rounded-lg bg-gradient-to-br from-purple-400/40 via-pink-400/30 to-cyan-400/40 blur-md opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
          
          <Button
            variant="outline"
            size="icon"
            enableEffects={false}
            onClick={onToggleSound}
            className="relative flex items-center justify-center w-10 h-10 p-0 rounded-lg bg-gradient-to-br from-white via-purple-50/80 to-pink-50/60 border border-purple-300/60 hover:border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.25)] hover:shadow-[0_0_18px_rgba(168,85,247,0.45)] hover:scale-105 transition-all duration-300 overflow-hidden"
            title={isSoundEnabled ? "Tắt hiệu ứng âm thanh" : "Bật hiệu ứng âm thanh"}
          >
            {/* Shimmer overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
            
            {/* Corner sparkles */}
            <div className="absolute top-0.5 left-0.5 w-1 h-1 rounded-full bg-white/80 animate-pulse" />
            <div className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-purple-300/80 animate-pulse delay-150" />
            <div className="absolute bottom-0.5 left-0.5 w-1 h-1 rounded-full bg-pink-300/80 animate-pulse delay-300" />
            <div className="absolute bottom-0.5 right-0.5 w-1 h-1 rounded-full bg-cyan-300/80 animate-pulse delay-450" />
            
            {/* Inner diamond highlight */}
            <div className="absolute inset-1 rounded-md bg-gradient-to-br from-white/60 via-transparent to-purple-100/40 pointer-events-none" />
            
            {isSoundEnabled ? (
              <Volume2 className="h-5 w-5 text-purple-600 relative z-10 drop-shadow-sm" />
            ) : (
              <VolumeX className="h-5 w-5 text-purple-400 relative z-10 opacity-60 drop-shadow-sm" />
            )}
          </Button>
        </div>
      </div>
    );
  }
);

AudioControls.displayName = 'AudioControls';
