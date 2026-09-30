/**
 * Zero-dependency Web Audio API Synthesizer for IPL Auction Sound Effects
 * Synthesizes gavel strikes, timer ticks, bid chimes, sold fanfares, and warning buzzers.
 */

class SoundEffectsEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    // Read persisted sound setting
    try {
      const stored = localStorage.getItem('ipl_auction_muted');
      if (stored !== null) {
        this.muted = JSON.parse(stored);
      }
    } catch {
      this.muted = false;
    }
  }

  private initAudio() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    try {
      localStorage.setItem('ipl_auction_muted', JSON.stringify(muted));
    } catch (err) {
      console.error('Failed to save audio preference:', err);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /**
   * Wood gavel strike sound (low thump + wooden smack)
   */
  public playGavel() {
    if (this.muted) return;
    try {
      this.initAudio();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // 1. Thump Oscillator (Low frequency impact)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);

      gain.gain.setValueAtTime(1.0, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);

      // 2. High Frequency Click / Wood Crack Noise
      const bufferSize = this.ctx.sampleRate * 0.05;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.Q.setValueAtTime(2.0, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.8, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + 0.05);
    } catch (e) {
      console.warn('Audio playback prevented:', e);
    }
  }

  /**
   * Crisp Woodblock Timer Tick (used during final 5 seconds)
   */
  public playTimerTick() {
    if (this.muted) return;
    try {
      this.initAudio();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5 note
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.03);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {
      console.warn('Timer tick error:', e);
    }
  }

  /**
   * Upbeat double-chime for placing a bid
   */
  public playBidChime() {
    if (this.muted) return;
    try {
      this.initAudio();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Note 1: E5 (659.25Hz)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.12);

      // Note 2: B5 (987.77Hz)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, now + 0.08);
      gain2.gain.setValueAtTime(0.45, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.25);
    } catch (e) {
      console.warn('Bid chime error:', e);
    }
  }

  /**
   * Low warning buzz tone for bid error / purse safety block
   */
  public playWarning() {
    if (this.muted) return;
    try {
      this.initAudio();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.setValueAtTime(120, now + 0.1);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      console.warn('Warning audio error:', e);
    }
  }

  /**
   * Sold Fanfare - Major triad arpeggio flourish (C5 -> E5 -> G5 -> C6)
   */
  public playSoldFanfare() {
    if (this.muted) return;
    try {
      this.initAudio();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const start = now + idx * 0.07;
        const duration = idx === notes.length - 1 ? 0.4 : 0.12;

        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.3, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(start);
        osc.stop(start + duration);
      });
    } catch (e) {
      console.warn('Fanfare sound error:', e);
    }
  }

  /**
   * RTM Siren sound effect
   */
  public playRtmAlert() {
    if (this.muted) return;
    try {
      this.initAudio();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.linearRampToValueAtTime(900, now + 0.15);
      osc.frequency.linearRampToValueAtTime(500, now + 0.3);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn('RTM siren error:', e);
    }
  }
}

export const soundEffects = new SoundEffectsEngine();
