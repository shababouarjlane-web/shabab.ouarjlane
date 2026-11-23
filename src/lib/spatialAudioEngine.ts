// محرك الصوت المكاني ثلاثي الأبعاد والبيئة الصحراوية - Spatial Audio Engine
// Web Audio API Native Procedural Engine + Speech Synthesis

type AmbientType = 'desert_wind' | 'market_caravan' | 'water_spring' | 'sacred_mosque' | 'library_scrolls';

export interface SpatialAudioState {
  isPlaying: boolean;
  isPaused: boolean;
  currentStopId: string | null;
  progressPercent: number;
  currentSentence: string;
  pan: number; // -1 (left) to +1 (right)
  distanceMeters: number;
  masterVolume: number;
  ambientVolume: number;
  voiceVolume: number;
}

class SpatialAudioEngine {
  private ctx: AudioContext | null = null;
  private pannerNode: StereoPannerNode | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private voiceGain: GainNode | null = null;

  // Ambient nodes
  private ambientSourceNode: AudioNode | null = null;

  // Speech narration
  private narrationTimer: number | null = null;
  private currentText = '';
  private totalDurationSec = 60;
  private elapsedSeconds = 0;

  // State callbacks
  private onStateChangeCallback: ((state: SpatialAudioState) => void) | null = null;

  private state: SpatialAudioState = {
    isPlaying: false,
    isPaused: false,
    currentStopId: null,
    progressPercent: 0,
    currentSentence: '',
    pan: 0,
    distanceMeters: 50,
    masterVolume: 0.85,
    ambientVolume: 0.65,
    voiceVolume: 0.95
  };

  private ensureAudioContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.state.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Stereo Panner (3D Spatial Effect)
      if (this.ctx.createStereoPanner) {
        this.pannerNode = this.ctx.createStereoPanner();
        this.pannerNode.pan.setValueAtTime(0, this.ctx.currentTime);
        this.pannerNode.connect(this.masterGain);
      } else {
        this.pannerNode = null;
      }

      // Sub-gains
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(this.state.ambientVolume, this.ctx.currentTime);

      this.voiceGain = this.ctx.createGain();
      this.voiceGain.gain.setValueAtTime(this.state.voiceVolume, this.ctx.currentTime);

      if (this.pannerNode) {
        this.ambientGain.connect(this.pannerNode);
        this.voiceGain.connect(this.pannerNode);
      } else {
        this.ambientGain.connect(this.masterGain);
        this.voiceGain.connect(this.masterGain);
      }
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    return this.ctx;
  }

  public subscribe(cb: (state: SpatialAudioState) => void) {
    this.onStateChangeCallback = cb;
    cb(this.state);
  }

  private notify() {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback({ ...this.state });
    }
  }

  // حساب الموضع المكاني (Panning) بناءً على إحداثيات المستخدم والمعلم
  public updateSpatialCoordinates(
    userLat: number,
    userLng: number,
    targetLat: number,
    targetLng: number,
    userHeadingDeg = 0
  ) {
    // 1. حساب المسافة بالأمتار (Haversine approximation)
    const R = 6371000;
    const dLat = ((targetLat - userLat) * Math.PI) / 180;
    const dLng = ((targetLng - userLng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userLat * Math.PI) / 180) *
        Math.cos((targetLat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distMeters = Math.max(5, Math.round(R * c));

    // 2. حساب الزاوية النسبية (Bearing)
    const y = Math.sin(dLng) * Math.cos((targetLat * Math.PI) / 180);
    const x =
      Math.cos((userLat * Math.PI) / 180) * Math.sin((targetLat * Math.PI) / 180) -
      Math.sin((userLat * Math.PI) / 180) * Math.cos((targetLat * Math.PI) / 180) * Math.cos(dLng);
    const bearingDeg = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;

    // الزاوية النسبية لمقدمة المستخدم
    const relAngleDeg = (bearingDeg - userHeadingDeg + 360) % 360;

    // Pan: من -1 (أقصى اليسار 270°) إلى 0 (أمام 0°) إلى +1 (أقصى اليمين 90°)
    let pan = Math.sin((relAngleDeg * Math.PI) / 180);
    pan = Math.max(-1, Math.min(1, pan));

    this.state.pan = Number(pan.toFixed(2));
    this.state.distanceMeters = distMeters;

    // تطبيق الـ Pan في الـ Web Audio API
    if (this.pannerNode && this.ctx) {
      this.pannerNode.pan.setTargetAtTime(pan, this.ctx.currentTime, 0.1);
    }

    this.notify();
  }

  // تشغيل المؤثرات الصوتية التوليدية للبيئة المحيطة (Procedural Ambient Soundscapes)
  private startAmbientSoundscape(type: AmbientType) {
    this.stopAmbientSoundscape();
    const ctx = this.ensureAudioContext();

    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // توليد ضجيج وردي/أبيض مخصص للرياح أو الماء أو الأسواق
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // فلتر تشكيل الصوت (Biquad Filter)
    const filter = ctx.createBiquadFilter();

    switch (type) {
      case 'desert_wind':
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(380, ctx.currentTime);
        filter.Q.setValueAtTime(3.5, ctx.currentTime);
        break;
      case 'water_spring':
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(850, ctx.currentTime);
        filter.Q.setValueAtTime(2.0, ctx.currentTime);
        break;
      case 'market_caravan':
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(550, ctx.currentTime);
        filter.Q.setValueAtTime(1.5, ctx.currentTime);
        break;
      case 'sacred_mosque':
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(260, ctx.currentTime);
        filter.Q.setValueAtTime(4.0, ctx.currentTime);
        break;
      case 'library_scrolls':
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1200, ctx.currentTime);
        filter.Q.setValueAtTime(0.5, ctx.currentTime);
        break;
    }

    // تذبذب دوري للرياح والمحيط عبر LFO
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.2, ctx.currentTime); // 0.2 Hz
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(120, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    if (this.ambientGain) {
      whiteNoise.connect(filter);
      filter.connect(this.ambientGain);
      whiteNoise.start();
      this.ambientSourceNode = whiteNoise;
    }
  }

  private stopAmbientSoundscape() {
    if (this.ambientSourceNode) {
      try {
        (this.ambientSourceNode as AudioScheduledSourceNode).stop();
        this.ambientSourceNode.disconnect();
      } catch {
        // ignore
      }
      this.ambientSourceNode = null;
    }
  }

  // تشغيل المحطة الصوتية الكاملة (السرد التاريخي + المؤثر المكاني)
  public playStop(
    stopId: string,
    narrationText: string,
    durationSec: number,
    ambientPreset: AmbientType
  ) {
    this.stop();
    this.ensureAudioContext();

    this.state.currentStopId = stopId;
    this.state.isPlaying = true;
    this.state.isPaused = false;
    this.state.progressPercent = 0;
    this.state.currentSentence = '';
    this.currentText = narrationText;
    this.totalDurationSec = durationSec || 60;
    this.elapsedSeconds = 0;

    // تشغيل المحيط الصوتي المكاني
    this.startAmbientSoundscape(ambientPreset);

    // تقسيم النص إلى جمل تفاعلية متزامنة
    const sentences = narrationText.split(/(?<=[.،؛!?؟])\s+/).filter(Boolean);
    const intervalPerSentence = Math.max(4, Math.floor(this.totalDurationSec / Math.max(1, sentences.length)));

    let currentSentenceIdx = 0;
    this.state.currentSentence = sentences[0] || narrationText;
    this.notify();

    // تشغيل القارئ الصوتي العربي عبر SpeechSynthesis إن كان متاحاً
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(narrationText);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.92; // وتيرة هادئة وقورة تليق بالرواية التاريخية
      utterance.pitch = 0.95;

      // اختيار صوت عربي إذا وجد في المتصفح
      const voices = window.speechSynthesis.getVoices();
      const arabicVoice = voices.find((v) => v.lang.startsWith('ar'));
      if (arabicVoice) {
        utterance.voice = arabicVoice;
      }

      utterance.onend = () => {
        this.onPlaybackFinished();
      };

      utterance.onerror = () => {
        // إكمال المحاكاة الزمنية حتى لو تعذر الصوت الاصطناعي
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        // Fallback to timer
      }
    }

    // مؤقت مزامنة النص والتقدم
    this.narrationTimer = window.setInterval(() => {
      this.elapsedSeconds += 1;
      const progress = Math.min(100, Math.round((this.elapsedSeconds / this.totalDurationSec) * 100));
      this.state.progressPercent = progress;

      // تحديث الجملة الحالية
      const newIdx = Math.min(sentences.length - 1, Math.floor(this.elapsedSeconds / intervalPerSentence));
      if (newIdx !== currentSentenceIdx && sentences[newIdx]) {
        currentSentenceIdx = newIdx;
        this.state.currentSentence = sentences[newIdx];
      }

      this.notify();

      if (this.elapsedSeconds >= this.totalDurationSec) {
        this.onPlaybackFinished();
      }
    }, 1000);
  }

  private onPlaybackFinished() {
    this.state.isPlaying = false;
    this.state.isPaused = false;
    this.state.progressPercent = 100;
    if (this.narrationTimer) {
      clearInterval(this.narrationTimer);
      this.narrationTimer = null;
    }
    this.stopAmbientSoundscape();
    this.notify();
  }

  public pause() {
    if (!this.state.isPlaying) return;
    this.state.isPaused = true;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
    if (this.narrationTimer) {
      clearInterval(this.narrationTimer);
      this.narrationTimer = null;
    }
    this.stopAmbientSoundscape();
    this.notify();
  }

  public resume(ambientPreset: AmbientType = 'desert_wind') {
    if (!this.state.isPaused || !this.state.currentStopId) return;
    this.state.isPaused = false;
    this.startAmbientSoundscape(ambientPreset);

    if ('speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }

    const sentences = this.currentText.split(/(?<=[.،؛!?؟])\s+/).filter(Boolean);
    const intervalPerSentence = Math.max(4, Math.floor(this.totalDurationSec / Math.max(1, sentences.length)));

    this.narrationTimer = window.setInterval(() => {
      this.elapsedSeconds += 1;
      const progress = Math.min(100, Math.round((this.elapsedSeconds / this.totalDurationSec) * 100));
      this.state.progressPercent = progress;

      const newIdx = Math.min(sentences.length - 1, Math.floor(this.elapsedSeconds / intervalPerSentence));
      if (sentences[newIdx]) {
        this.state.currentSentence = sentences[newIdx];
      }

      this.notify();

      if (this.elapsedSeconds >= this.totalDurationSec) {
        this.onPlaybackFinished();
      }
    }, 1000);

    this.notify();
  }

  public stop() {
    this.state.isPlaying = false;
    this.state.isPaused = false;
    this.state.progressPercent = 0;
    this.state.currentSentence = '';
    this.elapsedSeconds = 0;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (this.narrationTimer) {
      clearInterval(this.narrationTimer);
      this.narrationTimer = null;
    }
    this.stopAmbientSoundscape();
    this.notify();
  }

  public setMasterVolume(val: number) {
    this.state.masterVolume = val;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(val, this.ctx.currentTime);
    }
    this.notify();
  }

  public setAmbientVolume(val: number) {
    this.state.ambientVolume = val;
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(val, this.ctx.currentTime);
    }
    this.notify();
  }

  public setPanManual(pan: number) {
    this.state.pan = Number(pan.toFixed(2));
    if (this.pannerNode && this.ctx) {
      this.pannerNode.pan.setValueAtTime(pan, this.ctx.currentTime);
    }
    this.notify();
  }
}

export const spatialAudio = new SpatialAudioEngine();
