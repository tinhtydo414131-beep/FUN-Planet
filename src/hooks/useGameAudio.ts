import { useEffect, useRef, useState } from 'react';

export const useGameAudio = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isMusicEnabled, setIsMusicEnabled] = useState(true);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const musicNodeRef = useRef<OscillatorNode | null>(null);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      stopBackgroundMusic();
      audioContextRef.current?.close();
    };
  }, []);

  const resumeAudioContext = async () => {
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }
  };

  const playSound = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (!isSoundEnabled || !audioContextRef.current) return;

    resumeAudioContext();

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  };

  const playClick = () => {
    playSound(800, 0.1, 'sine');
  };

  const playSuccess = () => {
    if (!isSoundEnabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    
    // Play a cheerful ascending melody
    [523, 659, 784, 1047].forEach((freq, i) => {
      setTimeout(() => playSound(freq, 0.2, 'sine'), i * 100);
    });
  };

  const playError = () => {
    if (!isSoundEnabled || !audioContextRef.current) return;
    playSound(200, 0.3, 'sawtooth');
  };

  const playPop = () => {
    playSound(1200, 0.1, 'sine');
  };

  const playJump = () => {
    if (!isSoundEnabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(300, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
    oscillator.type = 'square';

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  };

  const playScore = () => {
    playSound(1000, 0.15, 'triangle');
  };

  // "Bloop" sound for card hover (soft, short)
  const playBloop = () => {
    if (!isSoundEnabled || !audioContextRef.current) return;
    playSound(350, 0.08, 'sine');
  };

  // "Bling" sound for Play button click (ascending notes)
  const playBling = () => {
    if (!isSoundEnabled || !audioContextRef.current) return;
    [880, 1100, 1320].forEach((freq, i) => {
      setTimeout(() => playSound(freq, 0.1, 'sine'), i * 60);
    });
  };

  // "Pop" sound for card appearance (gentle)
  const playCardAppear = () => {
    if (!isSoundEnabled || !audioContextRef.current) return;
    playSound(600, 0.05, 'sine');
  };

  // Các hàm này giờ không làm gì - nhạc nền được quản lý bởi BackgroundMusicPlayer
  const startBackgroundMusic = async (_forceStart = false) => {
    // Không phát oscillator music nữa - dùng BackgroundMusicPlayer thay thế
  };

  const stopBackgroundMusic = () => {
    // Không cần dừng gì - nhạc nền được quản lý bởi BackgroundMusicPlayer
  };

  const toggleMusic = () => {
    setIsMusicEnabled(!isMusicEnabled);
    // State này giờ chỉ dùng cho UI, không còn điều khiển oscillator
  };

  const toggleSound = () => {
    setIsSoundEnabled(!isSoundEnabled);
  };

  return {
    playSound,
    playClick,
    playSuccess,
    playError,
    playPop,
    playJump,
    playScore,
    playBloop,
    playBling,
    playCardAppear,
    startBackgroundMusic,
    stopBackgroundMusic,
    toggleMusic,
    toggleSound,
    isMusicEnabled,
    isSoundEnabled,
  };
};
