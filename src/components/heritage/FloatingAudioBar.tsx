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
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  X,
  BookOpen,
  Compass,
  Headphones,
  Sparkles,
  FileText,
  Image as ImageIcon,
  MapPin,
  RotateCcw,
} from 'lucide-react';

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
}

interface FloatingAudioBarProps {
  /** المعلم المختار حالياً من الخريطة (إن وُجد) */
  activeLandmark: FloatingLandmarkInfo | null;
  /** هل البطاقة ظاهرة أم مصغّرة */
  isOpen: boolean;
  /** إغلاق/تصغير البطاقة */
  onClose: () => void;
  /** فتح البطاقة والبدء بالجولة */
  onOpenTour: () => void;
  /** تحليق الكاميرا لمحطة صوتية عند التنقل بالتالي/السابق */
  onSelectTourStop: (stop: AudioTourStop) => void;
  /** فتح صفحة الباحث التاريخي للمرجع */
  onOpenResearch: (query: string) => void;
  /** فتح الشريط الجانبي الكامل لقائمة المعالم والفعاليات */
  onOpenFullSidebar: () => void;
  /** إظهار جميع المعالم على الخريطة */
  hasFocusFilter?: boolean;
  onShowAllLandmarks?: () => void;
}

/** ربط معرف المعلم على الخريطة بأقرب محطة صوتية مسجلة */
export function resolveAudioStopForLandmark(landmarkId?: string | null): AudioTourStop {
  if (!landmarkId) return AUDIO_TOUR_STOPS[1]; // جامع لالة عزة كمحطة افتتاحية مميزة
  if (landmarkId === 'lalla-azza' || landmarkId === 'stop-lalla-azza') {
    return AUDIO_TOUR_STOPS.find((s) => s.id === 'stop-lalla-azza') || AUDIO_TOUR_STOPS[1];
  }
  if (landmarkId === 'ksar-atiq' || landmarkId === 'stop-ksar-atiq') {
    return AUDIO_TOUR_STOPS.find((s) => s.id === 'stop-ksar-atiq') || AUDIO_TOUR_STOPS[0];
  }
  if (landmarkId === 'sedrata' || landmarkId === 'stop-sedrata-ruins') {
    return AUDIO_TOUR_STOPS.find((s) => s.id === 'stop-sedrata-ruins') || AUDIO_TOUR_STOPS[2];
  }
  const exact = AUDIO_TOUR_STOPS.find((s) => s.id === landmarkId);
  return exact || AUDIO_TOUR_STOPS[0];
}

export const FloatingAudioBar: React.FC<FloatingAudioBarProps> = ({
  activeLandmark,
  isOpen,
  onClose,
  onOpenTour,
  onSelectTourStop,
  onOpenResearch,
  onOpenFullSidebar,
  hasFocusFilter,
  onShowAllLandmarks,
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

  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedTab, setExpandedTab] = useState<'story' | 'transcript' | 'stops'>('story');
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = spatialAudio.subscribe((st) => {
      setAudioState(st);
    });
    return unsubscribe;
  }, []);

  // تحديد المحطة الصوتية المرتبطة بالمعلم المختار
  const activeStop = resolveAudioStopForLandmark(activeLandmark?.id);
  const activeStopIdx = Math.max(
    0,
    AUDIO_TOUR_STOPS.findIndex((s) => s.id === activeStop.id)
  );

  const isThisStopPlaying =
    audioState.isPlaying &&
    !audioState.isPaused &&
    audioState.currentStopId === activeStop.id;

  const isThisStopLoaded = audioState.currentStopId === activeStop.id;

  const displayTitle = activeLandmark?.nameAr || activeStop.titleAr;
  const displaySubtitle =
    activeLandmark?.nameTifinagh || activeStop.subtitleAr;
  const displayPeriod = activeLandmark?.period || activeStop.period;
  const displayImage = activeStop.image || activeLandmark?.image || '/hero-bg.jpg';
  const displayDescription =
    activeLandmark?.description || activeStop.audioNarrationText;
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

  const handleJumpToStop = (idx: number, autoPlay = true) => {
    const target = AUDIO_TOUR_STOPS[idx];
    if (!target) return;
    onSelectTourStop(target);
    if (autoPlay) {
      spatialAudio.playStop(
        target.id,
        target.audioNarrationText,
        target.audioFileUrl,
        target.durationSeconds,
        target.ambientPreset
      );
    }
  };

  const handleNext = () => {
    const nextIdx = (activeStopIdx + 1) % AUDIO_TOUR_STOPS.length;
    handleJumpToStop(nextIdx, true);
  };

  const handlePrev = () => {
    const prevIdx = (activeStopIdx - 1 + AUDIO_TOUR_STOPS.length) % AUDIO_TOUR_STOPS.length;
    handleJumpToStop(prevIdx, true);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    // شريط التقدم RTL: البداية من اليمين
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
    setIsExpanded(false);
    onClose();
  };

  // الحالة المصغّرة: زر عائم أنيق وغير مزعج أسفل الخريطة
  if (!isOpen) {
    return (
      <div
        dir="rtl"
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3"
      >
        <button
          type="button"
          onClick={onOpenTour}
          className="bg-[#141a26]/95 hover:bg-[#1b2333] backdrop-blur-xl text-stone-100 px-5 py-3 rounded-2xl shadow-[0_14px_40px_rgba(0,0,0,0.45)] flex items-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer font-thmanyah font-bold text-xs sm:text-sm"
        >
          <span className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center shrink-0 shadow-md">
            <Headphones className="w-4 h-4" />
          </span>
          <span className="whitespace-nowrap">
            {audioState.isPlaying && !audioState.isPaused
              ? 'جاري الاستماع للدليل الصوتي • اضغط للعرض'
              : 'ابدأ الجولة الصوتية التفاعلية (6 محطات)'}
          </span>
          {audioState.isPlaying && !audioState.isPaused && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
          )}
        </button>

        {hasFocusFilter && onShowAllLandmarks && (
          <button
            type="button"
            onClick={onShowAllLandmarks}
            className="bg-[#301809]/95 hover:bg-[#4a2510] backdrop-blur-xl text-[#fae1b7] px-3.5 py-3 rounded-2xl shadow-xl flex items-center gap-1.5 text-xs font-thmanyah font-bold cursor-pointer transition-all"
            title="إظهار جميع المعالم"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">كل المعالم</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-1.5rem)] max-w-2xl transition-all duration-300"
    >
      <div className="bg-[#121722]/95 backdrop-blur-2xl text-stone-100 rounded-3xl shadow-[0_24px_70px_rgba(0,0,0,0.65)] overflow-hidden ring-1 ring-amber-400/20">
        {/* ── الجزء الموسّع للأعلى (الصور + الوصف + النص المسموع + المحطات) ── */}
        {isExpanded && (
          <div className="border-b border-white/10 bg-[#0d111a]/80 max-h-[52vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* تبويبات سريعة داخل البطاقة */}
            <div className="sticky top-0 z-10 bg-[#0d111a]/95 backdrop-blur-md px-4 pt-3 pb-2.5 flex items-center justify-between gap-2 border-b border-white/5">
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setExpandedTab('story')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-thmanyah font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    expandedTab === 'story'
                      ? 'bg-amber-400 text-stone-950'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>الصورة والنبذة</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExpandedTab('transcript')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-thmanyah font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    expandedTab === 'transcript'
                      ? 'bg-amber-400 text-stone-950'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>النص المسموع</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExpandedTab('stops')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-thmanyah font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    expandedTab === 'stops'
                      ? 'bg-amber-400 text-stone-950'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>المحطات ({AUDIO_TOUR_STOPS.length})</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onOpenFullSidebar}
                className="text-[11px] font-thmanyah font-bold text-amber-300 hover:text-amber-200 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap"
              >
                دليل المعالم الكامل
              </button>
            </div>

            <div className="p-4 space-y-3.5">
              {expandedTab === 'story' && (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                  {/* صورة المعلم */}
                  <div className="sm:col-span-5 relative rounded-2xl overflow-hidden h-40 sm:h-44 bg-stone-900">
                    <img
                      src={displayImage}
                      alt={displayTitle}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                    <span className="absolute bottom-2.5 right-2.5 text-[10px] font-thmanyah font-bold bg-black/60 backdrop-blur-sm text-amber-300 px-2.5 py-1 rounded-full">
                      {displayPeriod}
                    </span>
                  </div>

                  {/* النبذة والروابط السريعة */}
                  <div className="sm:col-span-7 space-y-3">
                    <p className="text-xs sm:text-sm text-stone-200 leading-relaxed font-thmanyah">
                      {displayDescription}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          onOpenResearch(
                            `ماذا ذكر كتاب غصن البان عن ${displayTitle}؟`
                          )
                        }
                        className="px-3 py-2 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 text-xs font-thmanyah font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>اقرأ في المراجع</span>
                      </button>

                      <a
                        href={buildGoogleMapsDirectionsUrl([displayLat, displayLng])}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-thmanyah font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>التوجيه عبر Google Maps</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {expandedTab === 'transcript' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-stone-400">
                    <span className="flex items-center gap-1.5 text-amber-300 font-thmanyah font-bold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>السرد الوثائقي بصوت جورج</span>
                    </span>
                    <span className="text-[11px] font-thmanyah text-stone-400">
                      المرجع: {activeStop.bookReference} ({activeStop.pageRef})
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-stone-100 font-thmanyah font-bold bg-white/5 p-3.5 rounded-2xl select-text">
                    {activeStop.audioNarrationText}
                  </p>
                  <ul className="space-y-1.5 text-xs text-stone-300 font-thmanyah">
                    {activeStop.historicalInsights.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {expandedTab === 'stops' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {AUDIO_TOUR_STOPS.map((stop, idx) => {
                    const isCurrent = stop.id === activeStop.id;
                    return (
                      <button
                        key={stop.id}
                        type="button"
                        onClick={() => handleJumpToStop(idx, true)}
                        className={`p-2.5 rounded-xl text-right flex items-center justify-between gap-2 transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-amber-400/20 text-white ring-1 ring-amber-400/40'
                            : 'bg-white/5 hover:bg-white/10 text-stone-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-lg shrink-0">{stop.icon}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-thmanyah font-bold truncate">
                              {stop.titleAr}
                            </p>
                            <p className="text-[10px] text-stone-400 truncate">
                              {stop.categoryLabel}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-amber-300 shrink-0">
                          {stop.durationLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── الشريط الرئيسي المدمج (البطاقة العائمة الفورية) ── */}
        <div className="px-3.5 py-3 sm:px-5 sm:py-3.5 space-y-2.5">
          {/* الصف العلوي: الصورة المصغرة + العنوان + أزرار التشغيل والتحكم */}
          <div className="flex items-center justify-between gap-3">
            {/* يمين: الصورة المصغرة + اسم المعلم */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-3 min-w-0 flex-1 text-right group cursor-pointer"
              title="اضغط لعرض الصورة والتفاصيل والنص"
            >
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden shrink-0 bg-stone-800 shadow-md">
                <img
                  src={displayImage}
                  alt={displayTitle}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {isThisStopPlaying && (
                  <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-thmanyah font-bold text-white truncate">
                    {displayTitle}
                  </h3>
                  <span className="hidden sm:inline-flex items-center text-[10px] font-thmanyah font-bold px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 shrink-0">
                    {activeStopIdx + 1}/{AUDIO_TOUR_STOPS.length}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 font-thmanyah truncate mt-0.5">
                  {isThisStopPlaying && audioState.currentSentence
                    ? audioState.currentSentence
                    : displaySubtitle}
                </p>
              </div>
            </button>

            {/* يسار: أزرار التحكم الصوتي المباشر */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* المحطة السابقة */}
              <button
                type="button"
                onClick={handlePrev}
                className="w-8 h-8 rounded-full hover:bg-white/10 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="المحطة السابقة"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              {/* زر التشغيل / الإيقاف المؤقت */}
              <button
                type="button"
                onClick={handleTogglePlay}
                className="w-11 h-11 rounded-full bg-amber-400 hover:bg-amber-300 text-stone-950 flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                title={isThisStopPlaying ? 'إيقاف مؤقت' : 'استمع للشرح الصوتي'}
              >
                {isThisStopPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current translate-x-[-1px]" />
                )}
              </button>

              {/* المحطة التالية */}
              <button
                type="button"
                onClick={handleNext}
                className="w-8 h-8 rounded-full hover:bg-white/10 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="المحطة التالية"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              {/* كتم/تشغيل المؤثرات الخلفية */}
              <button
                type="button"
                onClick={() => spatialAudio.toggleAmbientMute()}
                className={`hidden sm:flex w-8 h-8 rounded-full hover:bg-white/10 items-center justify-center transition-colors cursor-pointer ${
                  audioState.isAmbientMuted ? 'text-stone-500' : 'text-amber-300'
                }`}
                title={audioState.isAmbientMuted ? 'تشغيل صوت الواحة الخافت' : 'كتم الخلفية الصوتية'}
              >
                {audioState.isAmbientMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>

              {/* توسيع / طي الصور والنص */}
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-amber-300 flex items-center justify-center transition-colors cursor-pointer"
                title={isExpanded ? 'تصغير التفاصيل' : 'عرض الصور والنص والمراجع'}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>

              {/* إغلاق / تصغير البطاقة */}
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 rounded-full hover:bg-white/10 text-stone-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="تصغير البطاقة"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* شريط التقدم الزمني السلس (Scrubber) */}
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-mono text-stone-400 w-8 text-center shrink-0">
              {isThisStopLoaded ? formatSeconds(audioState.currentTime) : '0:00'}
            </span>
            <div
              ref={progressBarRef}
              onClick={handleSeek}
              className="flex-1 h-1.5 bg-white/15 rounded-full overflow-hidden cursor-pointer group hover:h-2 transition-all"
              title="اسحب أو اضغط للانتقال في التسجيل الصوتي"
            >
              <div
                className="h-full bg-gradient-to-l from-amber-300 to-amber-500 rounded-full transition-all duration-150"
                style={{
                  width: `${isThisStopLoaded ? audioState.progressPercent : 0}%`,
                }}
              />
            </div>
            <span className="text-[10px] font-mono text-stone-400 w-8 text-center shrink-0">
              {formatSeconds(
                isThisStopLoaded ? audioState.duration : activeStop.durationSeconds
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
