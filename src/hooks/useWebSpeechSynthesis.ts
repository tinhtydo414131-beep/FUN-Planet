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
    rate = 0.85, // Slower for clearer, sweeter speech
    pitch = 1.25, // Higher pitch for cute, young female voice
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
        // 1. HoaiMy (Microsoft Edge - very natural and sweet)
        // 2. Any Vietnamese female voice
        // 3. Google Vietnamese voice
        // 4. Any female voice
        // 5. First available voice
        
        const hoaiMyVoice = availableVoices.find(
          voice => voice.name.toLowerCase().includes('hoaimy') || 
                   voice.name.includes('HoaiMy')
        );
        
        const vietnameseFemaleVoice = availableVoices.find(
          voice => (voice.lang.includes('vi') || voice.lang.includes('VI')) &&
                   (voice.name.toLowerCase().includes('female') || 
                    voice.name.toLowerCase().includes('woman') ||
                    voice.name.toLowerCase().includes('nữ') ||
                    voice.name.toLowerCase().includes('hoai') ||
                    voice.name.toLowerCase().includes('linh') ||
                    voice.name.toLowerCase().includes('an'))
        );
        
        const googleVietnameseVoice = availableVoices.find(
          voice => (voice.lang.includes('vi') || voice.lang.includes('VI')) &&
                   voice.name.includes('Google')
        );
        
        const anyVietnameseVoice = availableVoices.find(
          voice => voice.lang.includes('vi') || voice.lang.includes('VI')
        );
        
        const anyFemaleVoice = availableVoices.find(
          voice => voice.name.toLowerCase().includes('female') || 
                   voice.name.toLowerCase().includes('woman') ||
                   voice.name.toLowerCase().includes('zira') ||
                   voice.name.toLowerCase().includes('samantha')
        );
        
        const selectedVoiceResult = hoaiMyVoice || 
                                    vietnameseFemaleVoice || 
                                    googleVietnameseVoice || 
                                    anyVietnameseVoice ||
                                    anyFemaleVoice || 
                                    availableVoices[0] || 
                                    null;
        
        console.log('[WebSpeech TTS] Available voices:', availableVoices.map(v => `${v.name} (${v.lang})`));
        console.log('[WebSpeech TTS] Selected voice:', selectedVoiceResult?.name);
        
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
