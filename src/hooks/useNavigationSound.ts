import { useCallback, useRef } from 'react';

export const useNavigationSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Pop sound for desktop hover (higher pitch, shorter)
  const playPopSound = useCallback(() => {
    try {
      const audioContext = getAudioContext();
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
      oscillator.frequency.exponentialRampToValueAtTime(1320, audioContext.currentTime + 0.05); // E6
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.12, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.08);
    } catch (error) {
      // Silent fail for audio
    }
  }, [getAudioContext]);

  // Tap sound for mobile touch (deeper, satisfying)
  const playTapSound = useCallback(() => {
    try {
      const audioContext = getAudioContext();
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(660, audioContext.currentTime); // E5
      oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.06); // A5
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      // Silent fail for audio
    }
  }, [getAudioContext]);

  // Haptic feedback for mobile
  const triggerHaptic = useCallback(() => {
    if (navigator.vibrate) {
      navigator.vibrate(15);
    }
  }, []);

  return { playPopSound, playTapSound, triggerHaptic };
};
