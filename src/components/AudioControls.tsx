import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Music } from "lucide-react";

interface AudioControlsProps {
  isSoundEnabled: boolean;
  onToggleSound: () => void;
}

export const AudioControls = ({ 
  isSoundEnabled, 
  onToggleSound 
}: AudioControlsProps) => {
  
  const handleMusicClick = () => {
    // Dispatch event to BackgroundMusicPlayer
    window.dispatchEvent(new CustomEvent('fp-music:toggle'));
  };

  return (
    <div className="flex gap-2 items-center justify-center">
      <Button
        variant="outline"
        size="icon"
        enableEffects={false}
        onClick={handleMusicClick}
        className="flex items-center justify-center w-10 h-10 p-0 rotate-45 bg-white/90 backdrop-blur-sm border-purple-300/50 hover:bg-purple-50 hover:border-purple-400 shadow-md"
        title="Mở nhạc nền"
      >
        <Music className="h-5 w-5 text-purple-500 -rotate-45" />
      </Button>
      
      <Button
        variant="outline"
        size="icon"
        enableEffects={false}
        onClick={onToggleSound}
        className="flex items-center justify-center w-10 h-10 p-0 rotate-45 bg-white/90 backdrop-blur-sm border-purple-300/50 hover:bg-purple-50 hover:border-purple-400 shadow-md"
        title={isSoundEnabled ? "Tắt hiệu ứng âm thanh" : "Bật hiệu ứng âm thanh"}
      >
        {isSoundEnabled ? (
          <Volume2 className="h-5 w-5 text-purple-500 -rotate-45" />
        ) : (
          <VolumeX className="h-5 w-5 text-purple-500 opacity-50 -rotate-45" />
        )}
      </Button>
    </div>
  );
};
