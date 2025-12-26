import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Volume2, Settings, Play, Check, X, Sparkles, Zap, Heart, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface VoiceSettings {
  voiceName: string;
  rate: number;
  pitch: number;
  volume: number;
  autoRead: boolean;
  genderFilter: 'all' | 'female' | 'male';
  languageFilter: string;
}

interface VoiceSettingsPanelProps {
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  currentRate: number;
  currentPitch: number;
  currentVolume: number;
  autoRead: boolean;
  onSelectVoice: (voice: SpeechSynthesisVoice) => void;
  onRateChange: (rate: number) => void;
  onPitchChange: (pitch: number) => void;
  onVolumeChange: (volume: number) => void;
  onAutoReadChange: (autoRead: boolean) => void;
  onTestVoice: (text: string) => void;
  onSave: () => void;
  onClose: () => void;
}

const STORAGE_KEY = 'angel_ai_voice_settings';

// Presets for quick settings
const PRESETS = [
  { id: 'cute', icon: Heart, label: 'Dễ thương', color: 'pink', rate: 0.7, pitch: 1.5, description: 'Giọng ngọt ngào' },
  { id: 'pro', icon: Settings, label: 'Chuyên nghiệp', color: 'blue', rate: 0.9, pitch: 1.0, description: 'Giọng chuẩn' },
  { id: 'relax', icon: Coffee, label: 'Thư giãn', color: 'green', rate: 0.6, pitch: 0.9, description: 'Giọng chậm rãi' },
  { id: 'fast', icon: Zap, label: 'Nhanh', color: 'orange', rate: 1.3, pitch: 1.1, description: 'Giọng nhanh' },
];

const LANGUAGES = [
  { code: 'all', name: 'Tất cả ngôn ngữ 🌍' },
  { code: 'vi', name: 'Tiếng Việt 🇻🇳' },
  { code: 'en', name: 'Tiếng Anh 🇬🇧' },
  { code: 'zh', name: 'Tiếng Trung 🇨🇳' },
  { code: 'ja', name: 'Tiếng Nhật 🇯🇵' },
  { code: 'ko', name: 'Tiếng Hàn 🇰🇷' },
  { code: 'fr', name: 'Tiếng Pháp 🇫🇷' },
  { code: 'de', name: 'Tiếng Đức 🇩🇪' },
];

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
  currentVolume,
  autoRead,
  onSelectVoice,
  onRateChange,
  onPitchChange,
  onVolumeChange,
  onAutoReadChange,
  onTestVoice,
  onSave,
  onClose,
}: VoiceSettingsPanelProps) {
  const [rate, setRate] = useState(currentRate);
  const [pitch, setPitch] = useState(currentPitch);
  const [volume, setVolume] = useState(currentVolume);
  const [genderFilter, setGenderFilter] = useState<'all' | 'female' | 'male'>('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [activePreset, setActivePreset] = useState<string | null>(null);

  useEffect(() => {
    setRate(currentRate);
    setPitch(currentPitch);
    setVolume(currentVolume);
  }, [currentRate, currentPitch, currentVolume]);

  // Check if voice is female
  const isVoiceFemale = (voiceName: string) => {
    const femaleIndicators = ['female', 'woman', 'girl', 'zira', 'samantha', 'victoria', 'karen', 
      'hazel', 'susan', 'jenny', 'hoaimy', 'linh', 'an', 'catherine', 'moira', 'fiona', 'tessa', 'monica'];
    return femaleIndicators.some(name => voiceName.toLowerCase().includes(name));
  };

  // Check if voice is male
  const isVoiceMale = (voiceName: string) => {
    const maleIndicators = ['male', 'man', 'boy', 'david', 'mark', 'james', 'daniel', 'alex', 'google us english', 'google uk english male'];
    return maleIndicators.some(name => voiceName.toLowerCase().includes(name));
  };

  // Filter voices by gender and language
  const filteredVoices = voices.filter(voice => {
    // Gender filter
    if (genderFilter === 'female' && !isVoiceFemale(voice.name)) return false;
    if (genderFilter === 'male' && !isVoiceMale(voice.name)) return false;
    
    // Language filter
    if (languageFilter !== 'all') {
      const voiceLang = voice.lang.toLowerCase().split('-')[0];
      if (voiceLang !== languageFilter.toLowerCase()) return false;
    }
    
    return true;
  });

  // Group filtered voices by language
  const groupedVoices = filteredVoices.reduce((acc, voice) => {
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
    setActivePreset(null);
  };

  const handlePitchChange = (value: number[]) => {
    const newPitch = value[0];
    setPitch(newPitch);
    onPitchChange(newPitch);
    setActivePreset(null);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    onVolumeChange(newVolume);
  };

  const handlePresetClick = (preset: typeof PRESETS[0]) => {
    setRate(preset.rate);
    setPitch(preset.pitch);
    onRateChange(preset.rate);
    onPitchChange(preset.pitch);
    setActivePreset(preset.id);
    
    // Apply female filter for cute preset
    if (preset.id === 'cute') {
      setGenderFilter('female');
    }
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
        volume,
        autoRead,
        genderFilter,
        languageFilter,
      });
    }
    onSave();
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
              Tùy chỉnh giọng nói của Angel
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
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          {/* Quick Presets */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              Cài đặt nhanh
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRESETS.map((preset) => {
                const Icon = preset.icon;
                const isActive = activePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetClick(preset)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all ${
                      isActive
                        ? `bg-${preset.color}-100 dark:bg-${preset.color}-900/30 border-${preset.color}-300 dark:border-${preset.color}-500 shadow-md`
                        : 'border-muted hover:bg-muted/50 hover:border-purple-200'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? `text-${preset.color}-600` : 'text-muted-foreground'}`} />
                    <span className={`text-xs font-medium ${isActive ? `text-${preset.color}-700 dark:text-${preset.color}-300` : 'text-foreground'}`}>
                      {preset.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gender Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              👤 Loại giọng
            </label>
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'Tất cả', emoji: '🎭' },
                { value: 'female', label: 'Nữ', emoji: '👩' },
                { value: 'male', label: 'Nam', emoji: '👨' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setGenderFilter(option.value as 'all' | 'female' | 'male')}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border transition-all text-sm font-medium ${
                    genderFilter === option.value
                      ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-500 text-purple-700 dark:text-purple-300'
                      : 'border-muted hover:bg-muted/50'
                  }`}
                >
                  <span>{option.emoji}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Language Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              🌍 Ngôn ngữ
            </label>
            <Select value={languageFilter} onValueChange={setLanguageFilter}>
              <SelectTrigger className="w-full bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-border z-50">
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Voice List */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-purple-500" />
              Chọn giọng nói
              <span className="text-xs text-muted-foreground">({filteredVoices.length} giọng)</span>
            </label>
            
            <div className="h-[140px] rounded-xl border border-purple-200/50 dark:border-purple-500/30 bg-white/50 dark:bg-slate-800/50 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-2 space-y-3">
                  {sortedGroups.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      Không tìm thấy giọng nói phù hợp
                    </p>
                  ) : (
                    sortedGroups.map(([langName, langVoices]) => (
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
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-4">
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
                <span className="text-xs text-muted-foreground w-10">Chậm</span>
                <Slider
                  value={[rate]}
                  min={0.5}
                  max={1.5}
                  step={0.1}
                  onValueChange={handleRateChange}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-10 text-right">Nhanh</span>
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
                <span className="text-xs text-muted-foreground w-10">Trầm</span>
                <Slider
                  value={[pitch]}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  onValueChange={handlePitchChange}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-10 text-right">Cao</span>
              </div>
            </div>

            {/* Volume Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  🔊 Âm lượng
                </label>
                <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded">
                  {Math.round(volume * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-10">Nhỏ</span>
                <Slider
                  value={[volume]}
                  min={0}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-10 text-right">To</span>
              </div>
            </div>
          </div>

          {/* Auto Read Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-100 dark:border-purple-500/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                <Volume2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Tự động đọc tin nhắn</p>
                <p className="text-xs text-muted-foreground">Angel tự động đọc mỗi tin nhắn mới</p>
              </div>
            </div>
            <Switch
              checked={autoRead}
              onCheckedChange={onAutoReadChange}
            />
          </div>
        </div>
      </ScrollArea>

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
