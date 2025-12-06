// Nexus 2048 Premium Audio System
export class NexusAudioSystem {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isMusicPlaying = false;
  private musicOscillators: OscillatorNode[] = [];
  private musicIntervalId: number | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.musicGain = this.audioContext.createGain();
      this.sfxGain = this.audioContext.createGain();
      
      this.masterGain.connect(this.audioContext.destination);
      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      
      this.masterGain.gain.value = 0.5;
      this.musicGain.gain.value = 0.15;
      this.sfxGain.gain.value = 0.4;
    } catch (e) {
      console.warn('Audio not supported');
    }
  }

  async resume() {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  // Futuristic slide swoosh
  playSlide() {
    if (!this.audioContext || !this.sfxGain) return;
    this.resume();
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // Swoosh with noise and pitch sweep
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(800, now);
    oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.15);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, now);
    filter.frequency.exponentialRampToValueAtTime(500, now + 0.15);
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    
    oscillator.start(now);
    oscillator.stop(now + 0.15);
  }

  // Deep bass boom + crystalline chime for merges
  playMerge(tileValue: number) {
    if (!this.audioContext || !this.sfxGain) return;
    this.resume();
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const pitchMultiplier = Math.log2(tileValue) / 11; // Higher pitch for bigger merges
    
    // Deep bass boom
    const bass = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bass.type = 'sine';
    bass.frequency.setValueAtTime(60 + pitchMultiplier * 40, now);
    bass.frequency.exponentialRampToValueAtTime(30, now + 0.3);
    bassGain.gain.setValueAtTime(0.6, now);
    bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    bass.connect(bassGain);
    bassGain.connect(this.sfxGain);
    bass.start(now);
    bass.stop(now + 0.3);
    
    // Crystalline chime
    const chime = ctx.createOscillator();
    const chimeGain = ctx.createGain();
    const chimeFreq = 800 + pitchMultiplier * 1200;
    chime.type = 'sine';
    chime.frequency.setValueAtTime(chimeFreq, now);
    chimeGain.gain.setValueAtTime(0.4, now);
    chimeGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    chime.connect(chimeGain);
    chimeGain.connect(this.sfxGain);
    chime.start(now);
    chime.stop(now + 0.4);
    
    // Sparkle harmonics
    [1.5, 2, 2.5].forEach((mult, i) => {
      const harmonic = ctx.createOscillator();
      const hGain = ctx.createGain();
      harmonic.type = 'sine';
      harmonic.frequency.value = chimeFreq * mult;
      hGain.gain.setValueAtTime(0.15 / (i + 1), now + i * 0.05);
      hGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      harmonic.connect(hGain);
      hGain.connect(this.sfxGain);
      harmonic.start(now + i * 0.05);
      harmonic.stop(now + 0.35);
    });
  }

  // Soft pop with sparkle
  playSpawn() {
    if (!this.audioContext || !this.sfxGain) return;
    this.resume();
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    const pop = ctx.createOscillator();
    const popGain = ctx.createGain();
    pop.type = 'sine';
    pop.frequency.setValueAtTime(1200, now);
    pop.frequency.exponentialRampToValueAtTime(600, now + 0.08);
    popGain.gain.setValueAtTime(0.25, now);
    popGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    pop.connect(popGain);
    popGain.connect(this.sfxGain);
    pop.start(now);
    pop.stop(now + 0.1);
    
    // Sparkle tinkle
    setTimeout(() => {
      const sparkle = ctx.createOscillator();
      const sGain = ctx.createGain();
      sparkle.type = 'sine';
      sparkle.frequency.value = 2400;
      sGain.gain.setValueAtTime(0.1, ctx.currentTime);
      sGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      sparkle.connect(sGain);
      sGain.connect(this.sfxGain!);
      sparkle.start();
      sparkle.stop(ctx.currentTime + 0.1);
    }, 50);
  }

  // Dramatic game over
  playGameOver() {
    if (!this.audioContext || !this.sfxGain) return;
    this.resume();
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // Descending synth fail
    [400, 350, 300, 200].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      gain.gain.setValueAtTime(0, now + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.3, now + i * 0.15 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.3);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.3);
    });
  }

  // Triumphant win fanfare
  playWin() {
    if (!this.audioContext || !this.sfxGain) return;
    this.resume();
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // Orchestral chime progression
    const notes = [523, 659, 784, 1047, 1319, 1568]; // C major arpeggio
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.4, now + i * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.5);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.5);
    });
  }

  // Synthwave background music
  startMusic() {
    if (!this.audioContext || !this.musicGain || this.isMusicPlaying) return;
    this.resume();
    
    this.isMusicPlaying = true;
    const ctx = this.audioContext;
    
    // Arpeggio pattern (A minor / cyber feel)
    const pattern = [220, 262, 330, 392, 330, 262]; // Am arpeggio
    let noteIndex = 0;
    
    const playNote = () => {
      if (!this.isMusicPlaying || !ctx || !this.musicGain) return;
      
      const now = ctx.currentTime;
      const freq = pattern[noteIndex % pattern.length];
      
      // Main synth pad
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.type = 'triangle';
      osc.frequency.value = freq;
      filter.type = 'lowpass';
      filter.frequency.value = 1200 + Math.sin(now * 0.5) * 400;
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      osc.start(now);
      osc.stop(now + 0.45);
      
      // Sub bass (every 4th note)
      if (noteIndex % 4 === 0) {
        const bass = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bass.type = 'sine';
        bass.frequency.value = freq / 2;
        bassGain.gain.setValueAtTime(0.2, now);
        bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        bass.connect(bassGain);
        bassGain.connect(this.musicGain);
        bass.start(now);
        bass.stop(now + 0.85);
      }
      
      noteIndex++;
    };
    
    playNote();
    this.musicIntervalId = window.setInterval(playNote, 250);
  }

  stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicIntervalId) {
      clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }
    this.musicOscillators.forEach(osc => {
      try { osc.stop(); } catch {}
    });
    this.musicOscillators = [];
  }

  setMasterVolume(value: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = value;
    }
  }

  setMusicVolume(value: number) {
    if (this.musicGain) {
      this.musicGain.gain.value = value;
    }
  }

  setSfxVolume(value: number) {
    if (this.sfxGain) {
      this.sfxGain.gain.value = value;
    }
  }

  destroy() {
    this.stopMusic();
    this.audioContext?.close();
  }
}
