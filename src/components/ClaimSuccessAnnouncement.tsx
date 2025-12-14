import { useEffect, useRef } from 'react';
import { fireDiamondConfetti } from './DiamondConfetti';
import { playBlingSound } from './SoundEffects528Hz';

interface ClaimSuccessAnnouncementProps {
  amount: number;
  onComplete?: () => void;
}

// Use Web Speech API to announce reward
const announceReward = (amount: number) => {
  if ('speechSynthesis' in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const formattedAmount = amount.toLocaleString();
    const messages = [
      `Chúc mừng! Bạn đã nhận được ${formattedAmount} CAMLY!`,
      `Congratulations! You received ${formattedAmount} CAMLY!`,
    ];
    
    // Try Vietnamese first, fallback to English
    const utterance = new SpeechSynthesisUtterance(messages[0]);
    utterance.lang = 'vi-VN';
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 0.8;
    
    // Get available voices and try to find Vietnamese
    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find(v => v.lang.includes('vi'));
    const enVoice = voices.find(v => v.lang.includes('en'));
    
    if (viVoice) {
      utterance.voice = viVoice;
    } else if (enVoice) {
      utterance.text = messages[1];
      utterance.lang = 'en-US';
      utterance.voice = enVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  }
};

// Play celebratory 528Hz melody
const playCelebrationMelody = () => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;

  const audioContext = new AudioContext();
  
  // 528Hz is the "Love Frequency" - we'll create a harmonious progression
  const frequencies = [528, 594, 660, 528]; // 528Hz melody progression
  const durations = [0.3, 0.3, 0.3, 0.6];
  
  let startTime = audioContext.currentTime;
  
  frequencies.forEach((freq, index) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, startTime);
    
    // Create harmonics for richer sound
    const oscillator2 = audioContext.createOscillator();
    const gainNode2 = audioContext.createGain();
    oscillator2.type = 'sine';
    oscillator2.frequency.setValueAtTime(freq * 2, startTime); // Octave higher
    gainNode2.gain.setValueAtTime(0.15, startTime);
    
    gainNode.gain.setValueAtTime(0.3, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + durations[index]);
    gainNode2.gain.exponentialRampToValueAtTime(0.001, startTime + durations[index]);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator2.connect(gainNode2);
    gainNode2.connect(audioContext.destination);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + durations[index]);
    oscillator2.start(startTime);
    oscillator2.stop(startTime + durations[index]);
    
    startTime += durations[index];
  });
};

export const ClaimSuccessAnnouncement = ({ amount, onComplete }: ClaimSuccessAnnouncementProps) => {
  const hasPlayed = useRef(false);

  useEffect(() => {
    if (hasPlayed.current) return;
    hasPlayed.current = true;

    // Play celebration effects with slight delays for layered effect
    playBlingSound();
    
    setTimeout(() => {
      fireDiamondConfetti('rainbow');
    }, 100);
    
    setTimeout(() => {
      playCelebrationMelody();
    }, 200);
    
    setTimeout(() => {
      announceReward(amount);
    }, 500);
    
    // Call onComplete after all effects
    const timer = setTimeout(() => {
      onComplete?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [amount, onComplete]);

  return null;
};

// Export helper functions
export { announceReward, playCelebrationMelody };
