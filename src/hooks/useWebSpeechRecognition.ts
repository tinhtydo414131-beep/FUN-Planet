import { useState, useCallback, useRef, useEffect } from 'react';

interface UseWebSpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

// Type definitions for Web Speech API
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

// Extend Window interface for Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

export type MicPermissionStatus = 'granted' | 'denied' | 'prompt' | 'unknown';

const getErrorMessage = (error: string): string => {
  switch (error) {
    case 'no-speech':
      return 'Không phát hiện giọng nói. Hãy nói gần microphone hơn!';
    case 'audio-capture':
      return 'Không thể truy cập microphone. Hãy kiểm tra kết nối micro.';
    case 'not-allowed':
      return 'Quyền truy cập microphone bị từ chối. Click biểu tượng 🔒 trên thanh địa chỉ → Cho phép Microphone.';
    case 'network':
      return 'Lỗi kết nối mạng.';
    case 'aborted':
      return 'Đã dừng ghi âm.';
    case 'service-not-allowed':
      return 'Dịch vụ nhận diện giọng nói không khả dụng.';
    case 'mic-not-found':
      return 'Không tìm thấy microphone. Hãy kiểm tra kết nối micro.';
    case 'mic-permission-denied':
      return 'Quyền micro bị từ chối. Click 🔒 trên thanh địa chỉ → Site Settings → Microphone → Allow';
    case 'mic-no-audio':
      return 'Microphone không thu được âm thanh. Hãy kiểm tra micro có bật không và thử nói gần hơn.';
    default:
      return `Có lỗi xảy ra (${error}). Hãy thử lại!`;
  }
};

// Helper function to check mic permission
const checkMicPermission = async (): Promise<MicPermissionStatus> => {
  try {
    if (navigator.permissions) {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return result.state as MicPermissionStatus;
    }
    return 'unknown';
  } catch {
    return 'unknown';
  }
};

// Helper function to test mic audio level
const testMicAudioLevel = async (stream: MediaStream, durationMs: number = 1000): Promise<number> => {
  return new Promise((resolve) => {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      microphone.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let maxLevel = 0;
      let samples = 0;
      const maxSamples = durationMs / 50; // Sample every 50ms
      
      const checkLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const normalized = average / 255; // Normalize to 0-1
        
        if (normalized > maxLevel) {
          maxLevel = normalized;
        }
        
        samples++;
        if (samples < maxSamples) {
          setTimeout(checkLevel, 50);
        } else {
          audioContext.close();
          resolve(maxLevel);
        }
      };
      
      checkLevel();
    } catch (e) {
      console.error('[WebSpeech] Error testing mic level:', e);
      resolve(0);
    }
  });
};

export const useWebSpeechRecognition = (options: UseWebSpeechRecognitionOptions = {}) => {
  const {
    language = 'vi-VN',
    continuous = true,
    onResult,
    onError
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [isCheckingMic, setIsCheckingMic] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [micPermission, setMicPermission] = useState<MicPermissionStatus>('unknown');
  const [micLevel, setMicLevel] = useState<number>(0);
  
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  const isListeningRef = useRef(false);
  const shouldContinueListeningRef = useRef(false);

  // Keep callback refs updated
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Check initial permission on mount
  useEffect(() => {
    checkMicPermission().then(setMicPermission);
  }, []);

  // Initialize Speech Recognition once
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.log('[WebSpeech] Speech Recognition NOT supported in this browser');
      setIsSupported(false);
      return;
    }

    console.log('[WebSpeech] Speech Recognition is supported');
    setIsSupported(true);
    
    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = continuous;
    recognition.interimResults = true;

    recognition.onstart = () => {
      console.log('[WebSpeech] Recognition started');
      isListeningRef.current = true;
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const currentTranscript = finalTranscript || interimTranscript;
      console.log('[WebSpeech] Transcript:', currentTranscript);
      setTranscript(currentTranscript);
      
      if (finalTranscript && onResultRef.current) {
        onResultRef.current(finalTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('[WebSpeech] Error:', event.error, event.message);
      
      // Handle no-speech error - auto restart
      if (event.error === 'no-speech') {
        console.log('[WebSpeech] No speech detected, auto-restarting...');
        if (shouldContinueListeningRef.current) {
          setTimeout(() => {
            try {
              recognition.start();
              console.log('[WebSpeech] Restarted after no-speech');
            } catch (e) {
              console.log('[WebSpeech] Could not restart:', e);
            }
          }, 100);
        }
        return;
      }
      
      // Handle aborted - user stopped, no error shown
      if (event.error === 'aborted') {
        console.log('[WebSpeech] Recognition aborted by user');
        return;
      }
      
      const errorMessage = getErrorMessage(event.error);
      setError(errorMessage);
      isListeningRef.current = false;
      shouldContinueListeningRef.current = false;
      setIsListening(false);
      
      if (onErrorRef.current) {
        onErrorRef.current(errorMessage);
      }
    };

    recognition.onend = () => {
      console.log('[WebSpeech] Recognition ended, shouldContinue:', shouldContinueListeningRef.current);
      
      // Auto restart if still listening
      if (shouldContinueListeningRef.current) {
        console.log('[WebSpeech] Auto-restarting recognition...');
        setTimeout(() => {
          try {
            recognition.start();
            console.log('[WebSpeech] Recognition restarted');
          } catch (e) {
            console.log('[WebSpeech] Could not restart recognition:', e);
            isListeningRef.current = false;
            shouldContinueListeningRef.current = false;
            setIsListening(false);
          }
        }, 100);
        return;
      }
      
      isListeningRef.current = false;
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [language, continuous]);

  // Preflight check microphone before starting recognition
  const preflightMic = useCallback(async (): Promise<boolean> => {
    setIsCheckingMic(true);
    setError(null);
    setMicLevel(0);
    
    try {
      console.log('[WebSpeech] Preflight: Requesting mic access...');
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('[WebSpeech] Preflight: Mic access granted');
      
      setMicPermission('granted');
      
      // Test audio level for 800ms
      console.log('[WebSpeech] Preflight: Testing audio level...');
      const level = await testMicAudioLevel(stream, 800);
      console.log('[WebSpeech] Preflight: Audio level:', level);
      setMicLevel(level);
      
      // Stop the stream tracks
      stream.getTracks().forEach(track => track.stop());
      
      // If audio level is too low, warn but continue
      if (level < 0.01) {
        console.log('[WebSpeech] Preflight: Low audio level detected');
        // Don't block - just warn, the mic might work anyway
      }
      
      setIsCheckingMic(false);
      return true;
      
    } catch (e) {
      const err = e as Error;
      console.error('[WebSpeech] Preflight error:', err.name, err.message);
      
      setIsCheckingMic(false);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicPermission('denied');
        const errorMessage = getErrorMessage('mic-permission-denied');
        setError(errorMessage);
        if (onErrorRef.current) onErrorRef.current(errorMessage);
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        const errorMessage = getErrorMessage('mic-not-found');
        setError(errorMessage);
        if (onErrorRef.current) onErrorRef.current(errorMessage);
      } else {
        const errorMessage = getErrorMessage('audio-capture');
        setError(errorMessage);
        if (onErrorRef.current) onErrorRef.current(errorMessage);
      }
      
      return false;
    }
  }, []);

  const startListening = useCallback(async () => {
    if (!recognitionRef.current) {
      console.log('[WebSpeech] Recognition not initialized');
      return;
    }
    
    if (!isSupported) {
      console.log('[WebSpeech] Not supported');
      setError('Trình duyệt không hỗ trợ nhận diện giọng nói. Hãy sử dụng Chrome hoặc Edge.');
      return;
    }

    // Already listening or checking
    if (isListeningRef.current) {
      console.log('[WebSpeech] Already listening, ignoring start request');
      return;
    }

    // Run preflight check
    const micOk = await preflightMic();
    if (!micOk) {
      console.log('[WebSpeech] Preflight failed, not starting recognition');
      return;
    }

    setError(null);
    setTranscript('');
    shouldContinueListeningRef.current = true;
    
    try {
      console.log('[WebSpeech] Starting recognition...');
      recognitionRef.current.start();
    } catch (e) {
      const err = e as Error;
      console.error('[WebSpeech] Error starting:', err.message);
      
      if (err.message?.includes('already started')) {
        console.log('[WebSpeech] Recognition already running, aborting and restarting...');
        recognitionRef.current.abort();
        setTimeout(() => {
          try {
            recognitionRef.current?.start();
          } catch (retryError) {
            console.error('[WebSpeech] Retry failed:', retryError);
            shouldContinueListeningRef.current = false;
          }
        }, 100);
      } else {
        shouldContinueListeningRef.current = false;
      }
    }
  }, [isSupported, preflightMic]);

  const stopListening = useCallback(() => {
    console.log('[WebSpeech] Stopping recognition...');
    shouldContinueListeningRef.current = false;
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort(); // Use abort for faster stop
      } catch (e) {
        console.log('[WebSpeech] Error stopping:', e);
      }
    }
    
    isListeningRef.current = false;
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    console.log('[WebSpeech] Toggle listening, current state:', isListeningRef.current);
    if (isListeningRef.current) {
      stopListening();
    } else {
      startListening();
    }
  }, [startListening, stopListening]);

  return {
    isListening,
    isCheckingMic,
    transcript,
    isSupported,
    error,
    micPermission,
    micLevel,
    startListening,
    stopListening,
    toggleListening
  };
};
