import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Volume2, Settings, Play, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface VoiceSettings {
  voiceName: string;
  rate: number;
  pitch: number;
}

interface VoiceSettingsPanelProps {
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  currentRate: number;
  currentPitch: number;
  onSelectVoice: (voice: SpeechSynthesisVoice) => void;
  onRateChange: (rate: number) => void;
  onPitchChange: (pitch: number) => void;
  onTestVoice: (text: string) => void;
  onSave: () => void;
  onClose: () => void;
}

const STORAGE_KEY = 'angel_ai_voice_settings';

export const saveVoiceSettings = (settings: VoiceSettings) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};

export const loadVoiceSettings = (): VoiceSettings | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export function VoiceSettingsPanel({
  voices,
  selectedVoice,
  currentRate,
  currentPitch,
  onSelectVoice,
  onRateChange,
  onPitchChange,
  onTestVoice,
  onSave,
  onClose,
}: VoiceSettingsPanelProps) {
  const [rate, setRate] = useState(currentRate);
  const [pitch, setPitch] = useState(currentPitch);

  useEffect(() => {
    setRate(currentRate);
    setPitch(currentPitch);
  }, [currentRate, currentPitch]);

  // Group voices by language
  const groupedVoices = voices.reduce((acc, voice) => {
    const lang = voice.lang.split('-')[0].toUpperCase();
    const langName = getLanguageName(lang);
    if (!acc[langName]) acc[langName] = [];
    acc[langName].push(voice);
    return acc;
  }, {} as Record<string, SpeechSynthesisVoice[]>);

  // Sort to put Vietnamese first
  const sortedGroups = Object.entries(groupedVoices).sort((a, b) => {
    if (a[0].includes('Việt')) return -1;
    if (b[0].includes('Việt')) return 1;
    if (a[0].includes('Anh')) return -1;
    if (b[0].includes('Anh')) return 1;
    return a[0].localeCompare(b[0]);
  });

  const handleRateChange = (value: number[]) => {
    const newRate = value[0];
    setRate(newRate);
    onRateChange(newRate);
  };

  const handlePitchChange = (value: number[]) => {
    const newPitch = value[0];
    setPitch(newPitch);
    onPitchChange(newPitch);
  };

  const handleTestVoice = () => {
    onTestVoice("Xin chào bé yêu! Angel rất vui được nói chuyện với bé!");
  };

  const handleSave = () => {
    if (selectedVoice) {
      saveVoiceSettings({
        voiceName: selectedVoice.name,
        rate,
        pitch,
      });
    }
    onSave();
  };

  const isVoiceFemale = (voiceName: string) => {
    const femaleIndicators = ['female', 'woman', 'girl', 'zira', 'samantha', 'victoria', 'karen', 
      'hazel', 'susan', 'jenny', 'hoaimy', 'linh', 'an', 'catherine', 'moira', 'fiona'];
    return femaleIndicators.some(name => voiceName.toLowerCase().includes(name));
  };

  const isVoiceMale = (voiceName: string) => {
    const maleIndicators = ['male', 'man', 'boy', 'david', 'mark', 'james', 'daniel', 'alex'];
    return maleIndicators.some(name => voiceName.toLowerCase().includes(name));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute inset-0 bg-gradient-to-br from-white/98 via-yellow-50/98 to-pink-50/98 dark:from-slate-900/98 dark:via-purple-900/98 dark:to-pink-900/98 backdrop-blur-xl z-10 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-yellow-200/30 dark:border-yellow-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-lg">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-base bg-gradient-to-r from-purple-600 via-pink-500 to-yellow-500 bg-clip-text text-transparent">
              Cài đặt giọng nói
            </h3>
            <p className="text-xs text-muted-foreground">
              Chọn giọng nói yêu thích cho Angel
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-muted/50 transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Voice List */}
        <div className="flex-1 p-4 overflow-hidden">
          <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-3">
            <Volume2 className="w-4 h-4 text-purple-500" />
            Chọn giọng nói
          </label>
          
          <ScrollArea className="h-[180px] rounded-xl border border-purple-200/50 dark:border-purple-500/30 bg-white/50 dark:bg-slate-800/50">
            <div className="p-2 space-y-3">
              {sortedGroups.map(([langName, langVoices]) => (
                <div key={langName}>
                  <p className="text-xs font-semibold text-muted-foreground mb-1.5 px-2">
                    {langName} ({langVoices.length})
                  </p>
                  <div className="space-y-1">
                    {langVoices.map((voice) => (
                      <button
                        key={voice.name}
                        onClick={() => onSelectVoice(voice)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all ${
                          selectedVoice?.name === voice.name
                            ? 'bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 border border-purple-300 dark:border-purple-500'
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {selectedVoice?.name === voice.name && (
                            <Check className="w-4 h-4 text-purple-500 flex-shrink-0" />
                          )}
                          <span className="text-sm truncate">
                            {voice.name.replace(/Microsoft|Google|Apple/gi, '').trim()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {isVoiceFemale(voice.name) && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-pink-100 text-pink-600 dark:bg-pink-900/50 dark:text-pink-300">
                              Nữ
                            </Badge>
                          )}
                          {isVoiceMale(voice.name) && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300">
                              Nam
                            </Badge>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Sliders */}
        <div className="px-4 pb-3 space-y-4">
          {/* Rate Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                🚀 Tốc độ nói
              </label>
              <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded">
                {rate.toFixed(1)}x
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Chậm</span>
              <Slider
                value={[rate]}
                min={0.5}
                max={1.5}
                step={0.1}
                onValueChange={handleRateChange}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground">Nhanh</span>
            </div>
          </div>

          {/* Pitch Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                🎵 Cao độ
              </label>
              <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded">
                {pitch.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Trầm</span>
              <Slider
                value={[pitch]}
                min={0.5}
                max={2.0}
                step={0.1}
                onValueChange={handlePitchChange}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground">Cao</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-yellow-200/30 dark:border-yellow-500/20 flex gap-3">
          <Button
            variant="outline"
            onClick={handleTestVoice}
            className="flex-1 border-purple-200 hover:bg-purple-50 dark:border-purple-500/30"
          >
            <Play className="w-4 h-4 mr-2" />
            Thử giọng
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          >
            <Check className="w-4 h-4 mr-2" />
            Lưu cài đặt
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function getLanguageName(langCode: string): string {
  const langMap: Record<string, string> = {
    'VI': 'Tiếng Việt 🇻🇳',
    'EN': 'Tiếng Anh 🇬🇧',
    'ZH': 'Tiếng Trung 🇨🇳',
    'JA': 'Tiếng Nhật 🇯🇵',
    'KO': 'Tiếng Hàn 🇰🇷',
    'FR': 'Tiếng Pháp 🇫🇷',
    'DE': 'Tiếng Đức 🇩🇪',
    'ES': 'Tiếng Tây Ban Nha 🇪🇸',
    'IT': 'Tiếng Ý 🇮🇹',
    'PT': 'Tiếng Bồ Đào Nha 🇵🇹',
    'RU': 'Tiếng Nga 🇷🇺',
    'TH': 'Tiếng Thái 🇹🇭',
  };
  return langMap[langCode] || `${langCode}`;
}
