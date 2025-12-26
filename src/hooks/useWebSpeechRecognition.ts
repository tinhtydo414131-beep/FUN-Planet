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

const getErrorMessage = (error: string): string => {
  switch (error) {
    case 'no-speech':
      return 'Không phát hiện giọng nói. Hãy thử lại nhé!';
    case 'audio-capture':
      return 'Không thể truy cập microphone. Hãy cho phép quyền truy cập.';
    case 'not-allowed':
      return 'Quyền truy cập microphone bị từ chối. Hãy cho phép trong cài đặt trình duyệt.';
    case 'network':
      return 'Lỗi kết nối mạng.';
    case 'aborted':
      return 'Đã dừng ghi âm.';
    case 'service-not-allowed':
      return 'Dịch vụ nhận diện giọng nói không khả dụng.';
    default:
      return `Có lỗi xảy ra (${error}). Hãy thử lại!`;
  }
};

export const useWebSpeechRecognition = (options: UseWebSpeechRecognitionOptions = {}) => {
  const {
    language = 'vi-VN',
    continuous = false,
    onResult,
    onError
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  const isListeningRef = useRef(false);

  // Keep callback refs updated
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

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
      const errorMessage = getErrorMessage(event.error);
      setError(errorMessage);
      isListeningRef.current = false;
      setIsListening(false);
      
      if (onErrorRef.current) {
        onErrorRef.current(errorMessage);
      }
    };

    recognition.onend = () => {
      console.log('[WebSpeech] Recognition ended');
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

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      console.log('[WebSpeech] Recognition not initialized');
      return;
    }
    
    if (!isSupported) {
      console.log('[WebSpeech] Not supported');
      setError('Trình duyệt không hỗ trợ nhận diện giọng nói. Hãy sử dụng Chrome hoặc Edge.');
      return;
    }

    // Already listening
    if (isListeningRef.current) {
      console.log('[WebSpeech] Already listening, ignoring start request');
      return;
    }

    setError(null);
    setTranscript('');
    
    try {
      console.log('[WebSpeech] Starting recognition...');
      recognitionRef.current.start();
    } catch (e) {
      const err = e as Error;
      console.error('[WebSpeech] Error starting:', err.message);
      
      // Handle "already started" error
      if (err.message?.includes('already started')) {
        console.log('[WebSpeech] Recognition already running, stopping and restarting...');
        recognitionRef.current.stop();
        setTimeout(() => {
          try {
            recognitionRef.current?.start();
          } catch (retryError) {
            console.error('[WebSpeech] Retry failed:', retryError);
          }
        }, 100);
      }
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListeningRef.current) {
      console.log('[WebSpeech] Stopping recognition...');
      recognitionRef.current.stop();
      isListeningRef.current = false;
      setIsListening(false);
    }
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
    transcript,
    isSupported,
    error,
    startListening,
    stopListening,
    toggleListening
  };
};
