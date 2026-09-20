import { useEffect } from 'react';

class TacticalSoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  // Emergency WWII air-raid siren state
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private sirenFilter: BiquadFilterNode | null = null;
  private sirenInterval: number | null = null;
  private isSirenActive: boolean = false;

  // Proximity beep state
  private proximityInterval: number | null = null;
  private isProximityActive: boolean = false;

  // Repeating tactical alert loop state (for active unacknowledged threat approach)
  private alertInterval: number | null = null;
  private isAlertActive: boolean = false;

  constructor() {
    // Unlock audio context on first user interaction
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      };
      window.addEventListener('pointerdown', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopEmergencySiren();
      this.stopAlertLoop();
      this.stopProximity();
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * Tone 1: Tactical Detection Chirp
   * Triggered when an object/threat is first detected
   * Ascending radar chirp from 580Hz to 880Hz over 90ms
   */
  public playDetection() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch {
      // Audio context might be restricted or inactive
    }
  }

  /**
   * Tone 2: Urgent Proximity Warning
   * Triggered when a detected object gets close to the border (x > -90)
   * Sharp double-pulse staccato square wave (1050Hz + 1280Hz) repeating periodically
   */
  public startProximity() {
    if (this.isProximityActive) return;
    this.isProximityActive = true;
    if (this.isMuted) return;

    const playDoublePulse = () => {
      if (this.isMuted || !this.isProximityActive) return;
      const ctx = this.getContext();
      if (!ctx) return;

      try {
        const now = ctx.currentTime;

        // Pulse 1: 1050Hz
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'square';
        osc1.frequency.setValueAtTime(1050, now);
        gain1.gain.setValueAtTime(0.045, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.07);

        // Pulse 2: 1280Hz (90ms later)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(1280, now + 0.09);
        gain2.gain.setValueAtTime(0.05, now + 0.09);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.155);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.09);
        osc2.stop(now + 0.16);
      } catch {}
    };

    playDoublePulse();
    this.proximityInterval = window.setInterval(playDoublePulse, 1400);
  }

  public stopProximity() {
    this.isProximityActive = false;
    if (this.proximityInterval) {
      window.clearInterval(this.proximityInterval);
      this.proximityInterval = null;
    }
  }

  /**
   * Tone 2B: Tactical Warning Alert Loop
   * Repeats dual-frequency alert pulses (960Hz & 1200Hz) every 1.5s
   * Plays continuously while an unacknowledged threat approaches or remains active in the sector.
   */
  public startAlertLoop() {
    if (this.isAlertActive) return;
    this.isAlertActive = true;
    if (this.isMuted) return;

    const playAlertPulse = () => {
      if (this.isMuted || !this.isAlertActive) return;
      const ctx = this.getContext();
      if (!ctx) return;

      try {
        const now = ctx.currentTime;

        // Pulse 1: 960Hz
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(960, now);
        gain1.gain.setValueAtTime(0.06, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.095);

        // Pulse 2: 1200Hz (110ms later)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1200, now + 0.11);
        gain2.gain.setValueAtTime(0.065, now + 0.11);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.11);
        osc2.stop(now + 0.225);
      } catch {}
    };

    playAlertPulse();
    this.alertInterval = window.setInterval(playAlertPulse, 1500);
  }

  public stopAlertLoop() {
    this.isAlertActive = false;
    if (this.alertInterval) {
      window.clearInterval(this.alertInterval);
      this.alertInterval = null;
    }
  }

  /**
   * Tone 3: Continuous WWII Air-Raid Siren
   * Rising and falling wail (390Hz <-> 740Hz over 3.2s cycles)
   * Warm lowpass filter to mimic heavy mechanical horn resonance
   */
  public startEmergencySiren() {
    if (this.isSirenActive) return;
    this.isSirenActive = true;
    if (this.isMuted) return;

    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      this.sirenOsc = osc;
      this.sirenGain = gain;
      this.sirenFilter = filter;

      osc.start(now);

      const cycleTime = 3.2;
      const scheduleWail = (startTime: number) => {
        if (!this.isSirenActive || !this.sirenOsc || !this.sirenGain) return;

        // Pitch rise to 740Hz + volume swell
        this.sirenOsc.frequency.setValueAtTime(390, startTime);
        this.sirenOsc.frequency.linearRampToValueAtTime(740, startTime + 1.6);
        this.sirenGain.gain.setValueAtTime(0.045, startTime);
        this.sirenGain.gain.linearRampToValueAtTime(0.075, startTime + 1.6);

        // Pitch fall to 390Hz + volume dip
        this.sirenOsc.frequency.linearRampToValueAtTime(390, startTime + cycleTime);
        this.sirenGain.gain.linearRampToValueAtTime(0.045, startTime + cycleTime);
      };

      scheduleWail(now);

      this.sirenInterval = window.setInterval(() => {
        if (!this.isSirenActive || !this.ctx) return;
        scheduleWail(this.ctx.currentTime);
      }, 3200);
    } catch {}
  }

  public stopEmergencySiren() {
    if (!this.isSirenActive) return;
    this.isSirenActive = false;

    if (this.sirenInterval) {
      window.clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }

    if (this.sirenGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.sirenGain.gain.cancelScheduledValues(now);
        this.sirenGain.gain.linearRampToValueAtTime(0.0001, now + 0.35);
      } catch {}
    }

    const osc = this.sirenOsc;
    const filter = this.sirenFilter;
    setTimeout(() => {
      try {
        osc?.stop();
        osc?.disconnect();
        filter?.disconnect();
      } catch {}
    }, 400);

    this.sirenOsc = null;
    this.sirenGain = null;
    this.sirenFilter = null;
  }
}

export const soundManager = new TacticalSoundManager();

export function useAudioAlarm(isActive?: boolean) {
  useEffect(() => {
    // Backwards-compatible hook support if an external component passes isActive
    if (typeof isActive === 'boolean') {
      if (isActive) {
        soundManager.resume();
      }
    }
  }, [isActive]);
}
