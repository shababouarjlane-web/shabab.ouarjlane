// محرك الصوت الاستوديو والمحيط التراثي - Spatial Audio Engine
// يعتمد على ملفات صوتية استوديو عالية النقاء (Neural High-Definition Studio Audio)
// متصل بـ Web Audio API للتجسيم والتوزيع المكاني، مع محيط هادئ ناعم لا يطغى على الراوي

type AmbientType = 'desert_wind' | 'market_caravan' | 'water_spring' | 'sacred_mosque' | 'library_scrolls';

export interface SpatialAudioState {
  isPlaying: boolean;
  isPaused: boolean;
  currentStopId: string | null;
  currentTime: number;
  duration: number;
  progressPercent: number;
  currentSentence: string;
  pan: number; // -1 (left) to +1 (right)
  masterVolume: number;
  ambientVolume: number;
  playbackRate: number;
  isAmbientMuted: boolean;
}

class SpatialAudioEngine {
  private ctx: AudioContext | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private mediaSourceNode: MediaElementAudioSourceNode | null = null;
  private pannerNode: StereoPannerNode | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private voiceGain: GainNode | null = null;

  // Ambient procedural background nodes
  private ambientSourceNode: AudioScheduledSourceNode | null = null;

  // State callbacks
  private onStateChangeCallback: ((state: SpatialAudioState) => void) | null = null;

  private state: SpatialAudioState = {
    isPlaying: false,
    isPaused: false,
    currentStopId: null,
    currentTime: 0,
    duration: 38,
    progressPercent: 0,
    currentSentence: '',
    pan: 0,
    masterVolume: 1.0,
    ambientVolume: 0.08, // صوت محيطي خافت جداً وناعم لا يشوش على نبرة الراوي
    playbackRate: 1.0,
    isAmbientMuted: false
  };

  private currentSentences: string[] = [];

  constructor() {
    // إعداد عنصر الصوت الأساسي
    if (typeof window !== 'undefined') {
      this.audioEl = new Audio();
      this.audioEl.preload = 'auto';

      this.audioEl.addEventListener('timeupdate', () => this.onTimeUpdate());
      this.audioEl.addEventListener('ended', () => this.onPlaybackEnded());
      this.audioEl.addEventListener('loadedmetadata', () => {
        if (this.audioEl && !isNaN(this.audioEl.duration) && this.audioEl.duration > 0) {
          this.state.duration = this.audioEl.duration;
          this.notify();
        }
      });
      this.audioEl.addEventListener('error', (e) => {
        console.warn('Audio element error:', e);
      });
    }
  }

  private ensureAudioContext(): AudioContext {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.state.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Stereo Panner (3D Spatial Effect)
      if (this.ctx.createStereoPanner) {
        this.pannerNode = this.ctx.createStereoPanner();
        this.pannerNode.pan.setValueAtTime(this.state.pan, this.ctx.currentTime);
        this.pannerNode.connect(this.masterGain);
      } else {
        this.pannerNode = null;
      }

      // Voice Gain
      this.voiceGain = this.ctx.createGain();
      this.voiceGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

      // Ambient Gain (خافت وناعم)
      this.ambientGain = this.ctx.createGain();
      const currentAmbVol = this.state.isAmbientMuted ? 0 : this.state.ambientVolume;
      this.ambientGain.gain.setValueAtTime(currentAmbVol, this.ctx.currentTime);

      if (this.pannerNode) {
        this.voiceGain.connect(this.pannerNode);
        this.ambientGain.connect(this.pannerNode);
      } else {
        this.voiceGain.connect(this.masterGain);
        this.ambientGain.connect(this.masterGain);
      }

      // ربط HTMLAudioElement بمسار الـ Web Audio لضمان المعالجة المكانية
      if (this.audioEl && !this.mediaSourceNode) {
        try {
          this.mediaSourceNode = this.ctx.createMediaElementSource(this.audioEl);
          this.mediaSourceNode.connect(this.voiceGain);
        } catch {
          // If already connected or cross-origin restrictions apply, let standard playback run
        }
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    return this.ctx!;
  }

  public subscribe(cb: (state: SpatialAudioState) => void) {
    this.onStateChangeCallback = cb;
    cb({ ...this.state });
  }

  private notify() {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback({ ...this.state });
    }
  }

  private onTimeUpdate() {
    if (!this.audioEl) return;
    const cur = this.audioEl.currentTime;
    const dur = this.audioEl.duration || this.state.duration || 1;

    this.state.currentTime = cur;
    this.state.duration = dur;
    this.state.progressPercent = Math.min(100, (cur / dur) * 100);

    // مزامنة الجملة الحالية مع التوقيت
    if (this.currentSentences.length > 0) {
      const sentenceDuration = dur / this.currentSentences.length;
      const idx = Math.min(
        this.currentSentences.length - 1,
        Math.floor(cur / sentenceDuration)
      );
      this.state.currentSentence = this.currentSentences[idx] || '';
    }

    this.notify();
  }

  private onPlaybackEnded() {
    this.state.isPlaying = false;
    this.state.isPaused = false;
    this.state.progressPercent = 100;
    this.stopAmbientSoundscape();
    this.notify();
  }

  // تشغيل مؤثرات المحيط الصحراوي الخافتة والدافئة (Soft Organic Ambient)
  private startAmbientSoundscape(type: AmbientType) {
    this.stopAmbientSoundscape();
    if (this.state.isAmbientMuted) return;

    try {
      const ctx = this.ensureAudioContext();
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      // توليد ضجيج دافئ بني/وردي ناعم جداً
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // فلترة براونية ناعمة تمنع أي خشونة أو صوت هسيس
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 2.5; // تسوية النطاق
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const filter = ctx.createBiquadFilter();

      switch (type) {
        case 'desert_wind':
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(220, ctx.currentTime);
          filter.Q.setValueAtTime(1.0, ctx.currentTime);
          break;
        case 'water_spring':
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(420, ctx.currentTime);
          filter.Q.setValueAtTime(1.2, ctx.currentTime);
          break;
        case 'market_caravan':
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(280, ctx.currentTime);
          filter.Q.setValueAtTime(1.0, ctx.currentTime);
          break;
        case 'sacred_mosque':
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(180, ctx.currentTime);
          filter.Q.setValueAtTime(1.5, ctx.currentTime);
          break;
        case 'library_scrolls':
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(200, ctx.currentTime);
          filter.Q.setValueAtTime(0.8, ctx.currentTime);
          break;
      }

      if (this.ambientGain) {
        noiseSource.connect(filter);
        filter.connect(this.ambientGain);
        noiseSource.start();
        this.ambientSourceNode = noiseSource;
      }
    } catch {
      // Fallback gracefully
    }
  }

  private stopAmbientSoundscape() {
    if (this.ambientSourceNode) {
      try {
        this.ambientSourceNode.stop();
        this.ambientSourceNode.disconnect();
      } catch {
        // ignore
      }
      this.ambientSourceNode = null;
    }
  }

  // تشغيل المحطة بالملف الصوتي المسجل عالي الجودة
  public playStop(
    stopId: string,
    narrationText: string,
    audioFileUrl: string,
    durationSec?: number,
    ambientPreset: AmbientType = 'desert_wind'
  ) {
    this.stop();
    this.ensureAudioContext();

    this.state.currentStopId = stopId;
    this.state.isPlaying = true;
    this.state.isPaused = false;
    this.state.currentTime = 0;
    this.state.duration = durationSec || 38;
    this.state.progressPercent = 0;

    // تفكيك النص لجمل متناسقة للقراءة المزامنة
    this.currentSentences = narrationText.split(/(?<=[.،؛!?؟])\s+/).filter(Boolean);
    this.state.currentSentence = this.currentSentences[0] || narrationText;

    // تشغيل المحيط الخافت
    this.startAmbientSoundscape(ambientPreset);

    // تشغيل الملف الصوتي الحقيقي
    if (this.audioEl) {
      this.audioEl.src = audioFileUrl;
      this.audioEl.playbackRate = this.state.playbackRate;
      this.audioEl.currentTime = 0;
      this.audioEl.play().catch((err) => {
        console.warn('Audio play request interrupted or prevented:', err);
      });
    }

    this.notify();
  }

  public pause() {
    if (!this.state.isPlaying) return;
    this.state.isPaused = true;
    if (this.audioEl) {
      this.audioEl.pause();
    }
    this.stopAmbientSoundscape();
    this.notify();
  }

  public resume(ambientPreset: AmbientType = 'desert_wind') {
    if (!this.state.isPaused || !this.audioEl) return;
    this.ensureAudioContext();
    this.state.isPaused = false;
    this.startAmbientSoundscape(ambientPreset);
    this.audioEl.play().catch(() => {});
    this.notify();
  }

  public stop() {
    this.state.isPlaying = false;
    this.state.isPaused = false;
    this.state.currentTime = 0;
    this.state.progressPercent = 0;
    this.state.currentSentence = '';

    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.currentTime = 0;
    }
    this.stopAmbientSoundscape();
    this.notify();
  }

  // القفز إلى نسبة معينة (0 - 100)
  public seekToPercent(percent: number) {
    if (!this.audioEl) return;
    const dur = this.audioEl.duration || this.state.duration || 1;
    const targetTime = Math.max(0, Math.min(dur, (percent / 100) * dur));
    this.audioEl.currentTime = targetTime;
    this.state.currentTime = targetTime;
    this.state.progressPercent = percent;
    this.notify();
  }

  // تقديم أو ترجيع بعدد محدد من الثواني (مثل مشغلات البودكاست العالمية: 10 ثوانٍ)
  public skipSeconds(seconds: number) {
    if (!this.audioEl) return;
    const dur = this.audioEl.duration || this.state.duration || 1;
    const newTime = Math.max(0, Math.min(dur, this.audioEl.currentTime + seconds));
    this.audioEl.currentTime = newTime;
    this.state.currentTime = newTime;
    this.state.progressPercent = (newTime / dur) * 100;
    this.notify();
  }

  // تبديل سرعة الإلقاء (1.0x, 1.25x, 0.9x)
  public setPlaybackRate(rate: number) {
    this.state.playbackRate = rate;
    if (this.audioEl) {
      this.audioEl.playbackRate = rate;
    }
    this.notify();
  }

  // كتم أو تشغيل المحيط الصوتي الخلفي
  public toggleAmbientMute() {
    this.state.isAmbientMuted = !this.state.isAmbientMuted;
    if (this.ambientGain && this.ctx) {
      const vol = this.state.isAmbientMuted ? 0 : this.state.ambientVolume;
      this.ambientGain.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
    this.notify();
  }

  public setMasterVolume(val: number) {
    this.state.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.state.masterVolume, this.ctx.currentTime);
    }
    if (this.audioEl) {
      this.audioEl.volume = this.state.masterVolume;
    }
    this.notify();
  }

  public setAmbientVolume(val: number) {
    this.state.ambientVolume = Math.max(0, Math.min(0.3, val)); // حد أقصى 30% لضمان عدم طغيانه على الراوي إطلاقاً
    if (this.ambientGain && this.ctx && !this.state.isAmbientMuted) {
      this.ambientGain.gain.setValueAtTime(this.state.ambientVolume, this.ctx.currentTime);
    }
    this.notify();
  }

  public setPan(val: number) {
    const clamped = Math.max(-1, Math.min(1, val));
    this.state.pan = Number(clamped.toFixed(2));
    if (this.pannerNode && this.ctx) {
      this.pannerNode.pan.setValueAtTime(clamped, this.ctx.currentTime);
    }
    this.notify();
  }

  // توجيه الصوت الميداني بناءً على الإحداثيات
  public updateSpatialCoordinates(
    userLat: number,
    userLng: number,
    targetLat: number,
    targetLng: number,
    userHeadingDeg = 0
  ) {
    const dLng = ((targetLng - userLng) * Math.PI) / 180;
    const y = Math.sin(dLng) * Math.cos((targetLat * Math.PI) / 180);
    const x =
      Math.cos((userLat * Math.PI) / 180) * Math.sin((targetLat * Math.PI) / 180) -
      Math.sin((userLat * Math.PI) / 180) * Math.cos((targetLat * Math.PI) / 180) * Math.cos(dLng);
    const bearingDeg = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
    const relAngleDeg = (bearingDeg - userHeadingDeg + 360) % 360;

    let pan = Math.sin((relAngleDeg * Math.PI) / 180);
    pan = Math.max(-0.85, Math.min(0.85, pan)); // تجسيم مريح للأذن

    this.setPan(pan);
  }
}

export const spatialAudio = new SpatialAudioEngine();
