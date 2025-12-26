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

export const useWebSpeechSynthesis = (options: UseWebSpeechSynthesisOptions = {}) => {
  const {
    language = 'vi-VN',
    rate = 0.8,  // Slower, sweeter, more gentle speech
    pitch = 1.3, // Higher pitch for cute young female voice
    volume = 1,
    onStart,
    onEnd,
    onError
  } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      setIsSupported(true);
      
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
        
        // Priority order for sweet female Vietnamese voice:
        // 1. HoaiMy, An (Microsoft Edge Vietnamese - very natural)
        // 2. Vietnamese female voices
        // 3. Google Vietnamese voice
        // 4. Microsoft female voices (Zira, Hazel, Susan, Catherine)
        // 5. Apple female voices (Samantha, Victoria, Karen)
        // 6. Any female voice
        // 7. First available voice
        
        const femaleVoiceNames = [
          'hoaimy', 'hoai my', 'an', 'linh', 'nữ',  // Vietnamese female names
          'zira', 'hazel', 'susan', 'catherine', 'linda', 'jenny', // Microsoft
          'samantha', 'victoria', 'karen', 'moira', 'fiona', // Apple
          'female', 'woman', 'girl'
        ];
        
        // Find best Vietnamese voice
        const vietnameseVoice = availableVoices.find(
          voice => (voice.lang.includes('vi') || voice.lang.includes('VI')) &&
                   femaleVoiceNames.some(name => voice.name.toLowerCase().includes(name))
        );
        
        // Google Vietnamese (usually good quality)
        const googleVietnameseVoice = availableVoices.find(
          voice => (voice.lang.includes('vi') || voice.lang.includes('VI')) &&
                   voice.name.includes('Google')
        );
        
        // Any Vietnamese voice
        const anyVietnameseVoice = availableVoices.find(
          voice => voice.lang.includes('vi') || voice.lang.includes('VI')
        );
        
        // Microsoft/Apple female voices (good quality)
        const qualityFemaleVoice = availableVoices.find(
          voice => ['zira', 'samantha', 'hazel', 'susan', 'victoria', 'karen', 'jenny']
                   .some(name => voice.name.toLowerCase().includes(name))
        );
        
        // Any female voice
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
      
      // Chrome loads voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!isSupported || !text.trim()) return;

    // Cancel any ongoing speech
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
    setSelectedVoice
  };
};
