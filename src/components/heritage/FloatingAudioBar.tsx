import React, { useEffect, useRef, useState } from 'react';
import {
  AUDIO_TOUR_STOPS,
  type AudioTourStop,
} from '@/data/heritageAudioTourData';
import {
  spatialAudio,
  type SpatialAudioState,
} from '@/lib/spatialAudioEngine';
import { buildGoogleMapsDirectionsUrl } from '@/lib/helpers';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  X,
  BookOpen,
  Compass,
  Headphones,
  FileText,
  Box,
} from 'lucide-react';
import { GlbModelViewer } from '@/components/heritage/GlbModelViewer';

export interface FloatingLandmarkInfo {
  id: string;
  nameAr: string;
  nameTifinagh?: string;
  period: string;
  image: string;
  description: string;
  lat: number;
  lng: number;
  badge?: string;
  has3dModel?: boolean;
}

/** المحطات الثلاث المعتمدة فقط (المسجد، القصر، سدراتة) */
const CORE_STOP_IDS = ['stop-lalla-azza', 'stop-ksar-atiq', 'stop-sedrata-ruins'] as const;

export const CORE_AUDIO_STOPS: AudioTourStop[] = CORE_STOP_IDS.map(
  (id) => AUDIO_TOUR_STOPS.find((s) => s.id === id)!
).filter(Boolean);

interface FloatingAudioBarProps {
  activeLandmark: FloatingLandmarkInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenTour: () => void;
  onSelectTourStop: (stop: AudioTourStop) => void;
  onOpenResearch: (query: string) => void;
}

export function resolveAudioStopForLandmark(landmarkId?: string | null): AudioTourStop {
  if (landmarkId === 'sedrata' || landmarkId === 'stop-sedrata-ruins') {
    return CORE_AUDIO_STOPS.find((s) => s.id === 'stop-sedrata-ruins') || CORE_AUDIO_STOPS[2];
  }
  if (landmarkId === 'ksar-atiq' || landmarkId === 'stop-ksar-atiq') {
    return CORE_AUDIO_STOPS.find((s) => s.id === 'stop-ksar-atiq') || CORE_AUDIO_STOPS[1];
  }
  return CORE_AUDIO_STOPS.find((s) => s.id === 'stop-lalla-azza') || CORE_AUDIO_STOPS[0];
}

export const FloatingAudioBar: React.FC<FloatingAudioBarProps> = ({
  activeLandmark,
  isOpen,
  onClose,
  onOpenTour,
  onSelectTourStop,
  onOpenResearch,
}) => {
  const [audioState, setAudioState] = useState<SpatialAudioState>({
    isPlaying: false,
    isPaused: false,
    currentStopId: null,
    currentTime: 0,
    duration: 38,
    progressPercent: 0,
    currentSentence: '',
    pan: 0,
    masterVolume: 1.0,
    ambientVolume: 0.08,
    playbackRate: 1.0,
    isAmbientMuted: false,
  });

  const [activeSheet, setActiveSheet] = useState<'none' | 'transcript' | 'model3d'>('none');
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = spatialAudio.subscribe((st) => {
      setAudioState(st);
    });
    return unsubscribe;
  }, []);

  const activeStop = resolveAudioStopForLandmark(activeLandmark?.id);
  const activeStopIdx = Math.max(
    0,
    CORE_AUDIO_STOPS.findIndex((s) => s.id === activeStop.id)
  );

  // إغلاق لوحة 3D تلقائياً إذا انتقل الزائر من سدراتة إلى معلم آخر
  const isSedrata = activeLandmark?.id === 'sedrata' || activeStop.id === 'stop-sedrata-ruins';
  useEffect(() => {
    if (activeSheet === 'model3d' && !isSedrata) {
      setActiveSheet('none');
    }
  }, [isSedrata, activeSheet]);

  const isThisStopPlaying =
    audioState.isPlaying &&
    !audioState.isPaused &&
    audioState.currentStopId === activeStop.id;

  const isThisStopLoaded = audioState.currentStopId === activeStop.id;

  const displayTitle = activeLandmark?.nameAr || activeStop.titleAr;
  const displayPeriod = activeLandmark?.period || activeStop.period;
  const displayImage = activeStop.image || activeLandmark?.image || '/hero-bg.jpg';
  const displayDescription = activeLandmark?.description || activeStop.subtitleAr;
  const displayLat = activeLandmark?.lat ?? activeStop.lat;
  const displayLng = activeLandmark?.lng ?? activeStop.lng;

  const formatSeconds = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleTogglePlay = () => {
    if (audioState.isPlaying && audioState.currentStopId === activeStop.id) {
      if (audioState.isPaused) {
        spatialAudio.resume(activeStop.ambientPreset);
      } else {
        spatialAudio.pause();
      }
    } else {
      spatialAudio.playStop(
        activeStop.id,
        activeStop.audioNarrationText,
        activeStop.audioFileUrl,
        activeStop.durationSeconds,
        activeStop.ambientPreset
      );
    }
  };

  const handleNext = () => {
    const nextStop = CORE_AUDIO_STOPS[(activeStopIdx + 1) % CORE_AUDIO_STOPS.length];
    if (!nextStop) return;
    setActiveSheet('none');
    onSelectTourStop(nextStop);
    spatialAudio.playStop(
      nextStop.id,
      nextStop.audioNarrationText,
      nextStop.audioFileUrl,
      nextStop.durationSeconds,
      nextStop.ambientPreset
    );
  };

  const handlePrev = () => {
    const prevStop =
      CORE_AUDIO_STOPS[(activeStopIdx - 1 + CORE_AUDIO_STOPS.length) % CORE_AUDIO_STOPS.length];
    if (!prevStop) return;
    setActiveSheet('none');
    onSelectTourStop(prevStop);
    spatialAudio.playStop(
      prevStop.id,
      prevStop.audioNarrationText,
      prevStop.audioFileUrl,
      prevStop.durationSeconds,
      prevStop.ambientPreset
    );
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percent = Math.max(0, Math.min(100, (1 - clickX / width) * 100));
    if (!isThisStopLoaded) {
      spatialAudio.playStop(
        activeStop.id,
        activeStop.audioNarrationText,
        activeStop.audioFileUrl,
        activeStop.durationSeconds,
        activeStop.ambientPreset
      );
    }
    spatialAudio.seekToPercent(percent);
  };

  const handleClose = () => {
    setActiveSheet('none');
    onClose();
  };

  // الحالة المصغّرة: كبسولة Apple زجاجية هادئة أسفل الشاشة
  if (!isOpen) {
    return (
      <div
        dir="rtl"
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30"
      >
        <button
          type="button"
          onClick={onOpenTour}
          className="bg-[#111318]/80 hover:bg-[#111318]/95 backdrop-blur-2xl text-white px-5 py-2.5 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.45)] border border-white/15 flex items-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer font-thmanyah font-bold text-xs"
        >
          <Headphones className="w-4 h-4 text-amber-400" />
          <span>الجولة الصوتية</span>
          {audioState.isPlaying && !audioState.isPaused && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          )}
        </button>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-1.5rem)] max-w-[540px] transition-all duration-300"
    >
      {/* اللوحة الفرعية الاختيارية فوق البطاقة (النص أو مجسم 3D لسدراتة فقط) */}
      {activeSheet !== 'none' && (
        <div className="mb-2.5 bg-[#111318]/85 backdrop-blur-2xl rounded-[24px] border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.55)] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
          {activeSheet === 'model3d' && isSedrata && activeStop.model3dUrl && (
            <div className="p-2.5">
              <GlbModelViewer
                modelUrl={activeStop.model3dUrl}
                altModelUrl={activeStop.model3dAltUrl}
                title={displayTitle}
              />
            </div>
          )}

          {activeSheet === 'transcript' && (
            <div className="p-4 sm:p-5 space-y-2.5 max-h-56 overflow-y-auto">
              <div className="flex items-center justify-between text-[11px] text-white/50">
                <span className="font-thmanyah font-bold text-amber-300">
                  السرد الوثائقي
                </span>
                <span className="truncate max-w-[240px]">
                  {activeStop.bookReference}
                </span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-white/90 font-thmanyah select-text">
                {activeStop.audioNarrationText}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── البطاقة الرئيسية بأسلوب Apple Liquid Glass ── */}
      <div className="bg-[#111318]/85 backdrop-blur-2xl text-white rounded-[28px] border border-white/15 shadow-[0_24px_65px_rgba(0,0,0,0.55)] p-3.5 sm:p-4">
        <div className="flex items-stretch gap-3.5 sm:gap-4">
          {/* صورة المعلم الوحيدة (مربعة فائقة النظافة) */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 bg-white/5 ring-1 ring-white/10">
            <img
              src={displayImage}
              alt={displayTitle}
              className="w-full h-full object-cover"
            />
            {isThisStopPlaying && (
              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/65 backdrop-blur-md flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[9px] font-thmanyah font-bold text-white/90">يُبث</span>
              </div>
            )}
          </div>

          {/* المحتوى الأيسر: العنوان + الوصف + المشغل + الإجراءات */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            {/* العنوان وزر الإغلاق */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-thmanyah font-bold text-white truncate leading-snug">
                  {displayTitle}
                </h3>
                <p className="text-[11px] text-white/55 font-thmanyah truncate mt-0.5">
                  {isThisStopPlaying && audioState.currentSentence
                    ? audioState.currentSentence
                    : displayPeriod}
                </p>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                title="إغلاق"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* سطر نبذة مختصر أنيق */}
            <p className="text-[11px] text-white/70 leading-relaxed line-clamp-1 hidden sm:block mt-1">
              {displayDescription}
            </p>

            {/* مشغل الصوت المدمج فائق البساطة */}
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={handleTogglePlay}
                className="w-9 h-9 rounded-full bg-white hover:bg-amber-300 text-stone-950 flex items-center justify-center shrink-0 shadow-md transition-all active:scale-95 cursor-pointer"
                title={isThisStopPlaying ? 'إيقاف مؤقت' : 'استمع'}
              >
                {isThisStopPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current translate-x-[-1px]" />
                )}
              </button>

              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <div
                  ref={progressBarRef}
                  onClick={handleSeek}
                  className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden cursor-pointer hover:h-2 transition-all"
                >
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-150"
                    style={{
                      width: `${isThisStopLoaded ? audioState.progressPercent : 0}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-white/45">
                  <span>{isThisStopLoaded ? formatSeconds(audioState.currentTime) : '0:00'}</span>
                  <span>
                    {formatSeconds(
                      isThisStopLoaded ? audioState.duration : activeStop.durationSeconds
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="w-7 h-7 rounded-full hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="المعلم السابق"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-7 h-7 rounded-full hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="المعلم التالي"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* شريط الإجراءات المبسّط (بدون حشو) */}
        <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() =>
                setActiveSheet((s) => (s === 'transcript' ? 'none' : 'transcript'))
              }
              className={`px-3 py-1.5 rounded-full text-[11px] font-thmanyah font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeSheet === 'transcript'
                  ? 'bg-white text-stone-950'
                  : 'bg-white/10 hover:bg-white/15 text-white/85'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>النص</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onOpenResearch(`ماذا ذكر كتاب غصن البان عن ${displayTitle}؟`)
              }
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white/85 text-[11px] font-thmanyah font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <BookOpen className="w-3 h-3 text-amber-300" />
              <span>المراجع</span>
            </button>

            <a
              href={buildGoogleMapsDirectionsUrl([displayLat, displayLng])}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white/85 text-[11px] font-thmanyah font-bold flex items-center gap-1.5 transition-colors"
            >
              <Compass className="w-3 h-3 text-emerald-300" />
              <span>الاتجاهات</span>
            </a>
          </div>

          {/* وسم وزر 3D يظهر حصرياً عند اختيار سدراتة */}
          {isSedrata && activeStop.model3dUrl && (
            <button
              type="button"
              onClick={() =>
                setActiveSheet((s) => (s === 'model3d' ? 'none' : 'model3d'))
              }
              className={`px-3 py-1.5 rounded-full text-[11px] font-thmanyah font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                activeSheet === 'model3d'
                  ? 'bg-amber-400 text-stone-950 shadow-md'
                  : 'bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
