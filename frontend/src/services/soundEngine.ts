// Web Audio API Retro & Fantasy RPG Synthesizer
// Zero external audio files — 100% reliable, zero latency, runs offline!

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.35;

  constructor() {
    const savedMute = localStorage.getItem('chronoslayer_muted');
    this.isMuted = savedMute === 'true';
    const savedVol = localStorage.getItem('chronoslayer_volume');
    if (savedVol) {
      this.volume = parseFloat(savedVol);
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('chronoslayer_muted', String(this.isMuted));
    if (!this.isMuted) {
      this.playCoinClink();
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    localStorage.setItem('chronoslayer_volume', String(this.volume));
  }

  // 1. Triumphant Quest Completion Chime (C5 -> E5 -> G5 -> C6)
  public playQuestComplete() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const startTime = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = idx === notes.length - 1 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, startTime + idx * 0.08);

      gain.gain.setValueAtTime(0, startTime + idx * 0.08);
      gain.gain.linearRampToValueAtTime(this.volume * 0.4, startTime + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime + idx * 0.08);
      osc.stop(startTime + idx * 0.08 + 0.4);
    });
  }

  // 2. Epic Level-Up Heroic Fanfare
  public playLevelUp() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const startTime = ctx.currentTime;
    const arpeggio = [
      { f: 440, t: 0 },       // A4
      { f: 554.37, t: 0.1 },  // C#5
      { f: 659.25, t: 0.2 },  // E5
      { f: 880, t: 0.3 },     // A5
      { f: 1108.73, t: 0.45 },// C#6
      { f: 1318.51, t: 0.6 }  // E6
    ];

    arpeggio.forEach(({ f, t }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, startTime + t);

      gain.gain.setValueAtTime(0, startTime + t);
      gain.gain.linearRampToValueAtTime(this.volume * 0.5, startTime + t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + t + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime + t);
      osc.stop(startTime + t + 0.6);
    });

    // Glorious final sustained harmony
    setTimeout(() => {
      const chords = [880, 1108.73, 1318.51, 1760];
      chords.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(this.volume * 0.3, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 1.3);
      });
    }, 600);
  }

  // 3. Crisp Gold Coin Drop
  public playCoinClink() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const freqs = [1800, 2400];

    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t + i * 0.04);

      gain.gain.setValueAtTime(this.volume * 0.35, t + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.04 + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t + i * 0.04);
      osc.stop(t + i * 0.04 + 0.25);
    });
  }

  // 4. Swift Blade Slash / Attack Swoosh
  public playSwordSlash() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    // White noise buffer for blade swoosh
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2800, t);
    filter.frequency.exponentialRampToValueAtTime(400, t + 0.14);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.volume * 0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(t);
    noise.stop(t + 0.15);
  }

  // 5. Critical Strike Crystal Hit
  public playCriticalHit() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;

    // Bass punch
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(160, t);
    subOsc.frequency.exponentialRampToValueAtTime(35, t + 0.25);
    subGain.gain.setValueAtTime(this.volume * 0.7, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(t);
    subOsc.stop(t + 0.25);

    // High shimmer
    const shimmer = ctx.createOscillator();
    const sGain = ctx.createGain();
    shimmer.type = 'triangle';
    shimmer.frequency.setValueAtTime(1400, t);
    shimmer.frequency.exponentialRampToValueAtTime(2800, t + 0.15);
    sGain.gain.setValueAtTime(this.volume * 0.4, t);
    sGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    shimmer.connect(sGain);
    sGain.connect(ctx.destination);
    shimmer.start(t);
    shimmer.stop(t + 0.22);
  }

  // 6. Boss Defeated Victory Cadence
  public playBossVictory() {
    if (this.isMuted) return;
    this.playLevelUp();
    setTimeout(() => {
      this.playCoinClink();
    }, 400);
  }

  // 7. Equip Gear Latch
  public playEquipItem() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.setValueAtTime(440, t + 0.05);

    gain.gain.setValueAtTime(this.volume * 0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.13);
  }
}

export const soundEngine = new SoundEngine();
