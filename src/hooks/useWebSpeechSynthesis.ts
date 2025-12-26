import { useState, useCallback, useEffect, useRef } from 'react';

interface UseWebSpeechSynthesisOptions {
  language?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

const STORAGE_KEY = 'angel_ai_voice_settings';

export const useWebSpeechSynthesis = (options: UseWebSpeechSynthesisOptions = {}) => {
  const {
    language = 'vi-VN',
    rate: initialRate = 0.8,
    pitch: initialPitch = 1.3,
    volume: initialVolume = 1,
    onStart,
    onEnd,
    onError
  } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [rate, setRate] = useState(initialRate);
  const [pitch, setPitch] = useState(initialPitch);
  const [volume, setVolume] = useState(initialVolume);
  const [autoRead, setAutoRead] = useState(true);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      setIsSupported(true);
      
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
        
        // Check for saved settings
        const savedSettings = localStorage.getItem(STORAGE_KEY);
        if (savedSettings) {
          try {
            const settings = JSON.parse(savedSettings);
            const savedVoice = availableVoices.find(v => v.name === settings.voiceName);
            if (savedVoice) {
              setSelectedVoice(savedVoice);
            }
            setRate(settings.rate ?? initialRate);
            setPitch(settings.pitch ?? initialPitch);
            setVolume(settings.volume ?? initialVolume);
            setAutoRead(settings.autoRead ?? true);
            console.log('[Angel AI Voice] 📂 Loaded saved settings:', settings);
            if (savedVoice) return;
          } catch (e) {
            console.log('[Angel AI Voice] ⚠️ Failed to load saved settings');
          }
        }
        
        // Priority order for sweet female Vietnamese voice:
        const femaleVoiceNames = [
          'hoaimy', 'hoai my', 'an', 'linh', 'nữ',
          'zira', 'hazel', 'susan', 'catherine', 'linda', 'jenny',
          'samantha', 'victoria', 'karen', 'moira', 'fiona',
          'female', 'woman', 'girl'
        ];
        
        const vietnameseVoice = availableVoices.find(
          voice => (voice.lang.includes('vi') || voice.lang.includes('VI')) &&
                   femaleVoiceNames.some(name => voice.name.toLowerCase().includes(name))
        );
        
        const googleVietnameseVoice = availableVoices.find(
          voice => (voice.lang.includes('vi') || voice.lang.includes('VI')) &&
                   voice.name.includes('Google')
        );
        
        const anyVietnameseVoice = availableVoices.find(
          voice => voice.lang.includes('vi') || voice.lang.includes('VI')
        );
        
        const qualityFemaleVoice = availableVoices.find(
          voice => ['zira', 'samantha', 'hazel', 'susan', 'victoria', 'karen', 'jenny']
                   .some(name => voice.name.toLowerCase().includes(name))
        );
        
        const anyFemaleVoice = availableVoices.find(
          voice => femaleVoiceNames.some(name => voice.name.toLowerCase().includes(name))
        );
        
        const selectedVoiceResult = vietnameseVoice || 
                                    googleVietnameseVoice || 
                                    anyVietnameseVoice ||
                                    qualityFemaleVoice ||
                                    anyFemaleVoice || 
                                    availableVoices[0] || 
                                    null;
        
        console.log('[Angel AI Voice] 🎤 Available voices:', availableVoices.map(v => `${v.name} (${v.lang})`));
        console.log('[Angel AI Voice] ✨ Selected voice:', selectedVoiceResult?.name, `(${selectedVoiceResult?.lang})`);
        
        setSelectedVoice(selectedVoiceResult);
      };

      loadVoices();
      
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [initialRate, initialPitch, initialVolume]);

  const speak = useCallback((text: string) => {
    if (!isSupported || !text.trim()) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      if (onStart) onStart();
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    };

    utterance.onerror = (event) => {
      setIsSpeaking(false);
      if (onError) onError(event.error);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, language, rate, pitch, volume, selectedVoice, onStart, onEnd, onError]);

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const pause = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.resume();
    }
  }, []);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isSupported,
    voices,
    selectedVoice,
    setSelectedVoice,
    rate,
    setRate,
    pitch,
    setPitch,
    volume,
    setVolume,
    autoRead,
    setAutoRead
  };
};
