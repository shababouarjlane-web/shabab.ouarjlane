import React, { useState, useEffect, useRef } from 'react';
import {
  AUDIO_TOUR_STOPS,
  type AudioTourStop
} from '@/data/heritageAudioTourData';
import {
  spatialAudio,
  type SpatialAudioState
} from '@/lib/spatialAudioEngine';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  BookOpen,
  Headphones,
  ListMusic,
  FileText,
  Info,
  X,
  MapPin,
  Sparkles
} from 'lucide-react';

interface SpatialAudioTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStopId?: string;
  onFlyToLandmark?: (lat: number, lng: number) => void;
  onOpenResearch?: (hint: string) => void;
}

type TabMode = 'transcript' | 'insights' | 'playlist';

export const SpatialAudioTourModal: React.FC<SpatialAudioTourModalProps> = ({
  isOpen,
  onClose,
  initialStopId,
  onFlyToLandmark,
  onOpenResearch
}) => {
  const [selectedStopIdx, setSelectedStopIdx] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<TabMode>('transcript');
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
    isAmbientMuted: false
  });

  const progressBarRef = useRef<HTMLDivElement>(null);

  // اشتراك في حالة المحرك الصوتي
  useEffect(() => {
    spatialAudio.subscribe((st) => {
      setAudioState(st);
    });
  }, []);

  // اختيار المحطة المبدئية عند الفتح
  useEffect(() => {
    if (initialStopId) {
      const idx = AUDIO_TOUR_STOPS.findIndex((s) => s.id === initialStopId);
      if (idx !== -1) {
        setSelectedStopIdx(idx);
      }
    }
  }, [initialStopId]);

  const activeStop: AudioTourStop = AUDIO_TOUR_STOPS[selectedStopIdx] || AUDIO_TOUR_STOPS[0];

  if (!isOpen) return null;

  // تشغيل / إيقاف مؤقت
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

      if (onFlyToLandmark) {
        onFlyToLandmark(activeStop.lat, activeStop.lng);
      }
    }
  };

  // اختيار محطة من القائمة
  const handleSelectStop = (idx: number, autoPlay = true) => {
    setSelectedStopIdx(idx);
    const stop = AUDIO_TOUR_STOPS[idx];
    if (onFlyToLandmark) {
      onFlyToLandmark(stop.lat, stop.lng);
    }
    if (autoPlay) {
      spatialAudio.playStop(
        stop.id,
        stop.audioNarrationText,
        stop.audioFileUrl,
        stop.durationSeconds,
        stop.ambientPreset
      );
    }
  };

  const handleNextStop = () => {
    const nextIdx = (selectedStopIdx + 1) % AUDIO_TOUR_STOPS.length;
    handleSelectStop(nextIdx, true);
  };

  const handlePrevStop = () => {
    const prevIdx = (selectedStopIdx - 1 + AUDIO_TOUR_STOPS.length) % AUDIO_TOUR_STOPS.length;
    handleSelectStop(prevIdx, true);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    // دعم الـ RTL
    const percent = Math.max(0, Math.min(100, (1 - clickX / width) * 100));
    spatialAudio.seekToPercent(percent);
  };

  const handleSpeedCycle = () => {
    const speeds = [1.0, 1.25, 0.9];
    const curIdx = speeds.indexOf(audioState.playbackRate);
    const nextSpeed = speeds[(curIdx + 1) % speeds.length];
    spatialAudio.setPlaybackRate(nextSpeed);
  };

  const handleClose = () => {
    spatialAudio.stop();
    onClose();
  };

  const formatSeconds = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isCurrentActive = audioState.isPlaying && audioState.currentStopId === activeStop.id;

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-300"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-2xl bg-gradient-to-b from-[#131722] via-[#0c1017] to-[#07090e] border border-stone-800/80 rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[92vh] text-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── شريط الرأس البسيط والأنيق ── */}
        <div className="px-5 py-4 sm:px-6 border-b border-stone-800/60 flex items-center justify-between shrink-0 bg-[#161c28]/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-thmanyah font-bold text-stone-100">
                الدليل الصوتي لوارجلان وسدراتة
              </h3>
              <p className="text-[11px] text-stone-400 font-thmanyah">
                سرد تاريخي أصيل بصوت وثائقي معتمد
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-stone-800/60 hover:bg-stone-700/80 text-stone-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── المحتوى الأساسي: المشغل الأنيق المستلهم من منصات الصوت العالمية ── */}
        <div className="p-5 sm:p-8 overflow-y-auto flex-1 flex flex-col items-center">
          {/* بطاقة العمل التراثي (Album/Stop Cover) */}
          <div className="w-full max-w-sm flex flex-col items-center text-center">
            <div className="relative group my-2">
              <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl bg-gradient-to-tr from-amber-950/40 via-stone-900 to-amber-900/30 border border-amber-500/20 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden transition-transform duration-300 group-hover:scale-102">
                <span className="text-6xl sm:text-7xl select-none filter drop-shadow-md">
                  {activeStop.icon}
                </span>

                {/* شارة الحقبة التاريخية */}
                <span className="absolute bottom-3 text-[10px] font-thmanyah font-bold px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-stone-700/60 text-amber-300">
                  {activeStop.period}
                </span>

                {isCurrentActive && !audioState.isPaused && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    <span className="text-[10px] font-thmanyah font-bold text-amber-300">جارٍ البث</span>
                  </div>
                )}
              </div>
            </div>

            {/* تفاصيل المحطة */}
            <div className="mt-4 space-y-1 w-full">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs font-thmanyah text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20 font-bold">
                  {activeStop.categoryLabel}
                </span>
                <span className="text-xs text-stone-400 font-thmanyah flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-stone-500" />
                  <span>المحطة {selectedStopIdx + 1} من {AUDIO_TOUR_STOPS.length}</span>
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-thmanyah font-bold text-white pt-1">
                {activeStop.titleAr}
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 font-thmanyah line-clamp-1">
                {activeStop.subtitleAr}
              </p>
            </div>

            {/* ── شريط التقدم الزمني (Scrubber) ── */}
            <div className="w-full mt-6 space-y-1.5">
              <div
                ref={progressBarRef}
                onClick={handleSeek}
                className="h-2 w-full bg-stone-800 rounded-full overflow-hidden cursor-pointer relative group/bar hover:h-2.5 transition-all"
                title="اضغط للتخطي داخل التسجيل"
              >
                <div
                  className="h-full bg-amber-400 group-hover/bar:bg-amber-300 rounded-full transition-all duration-150"
                  style={{ width: `${audioState.progressPercent}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[11px] text-stone-400 font-mono">
                <span>{formatSeconds(audioState.currentTime)}</span>
                <span>-{formatSeconds(Math.max(0, audioState.duration - audioState.currentTime))}</span>
              </div>
            </div>

            {/* ── أزرار التحكم بالمشغل (Playback Controls) ── */}
            <div className="w-full flex items-center justify-between mt-4 px-2">
              {/* زر كتم/تشغيل الهمس المحيطي الخافت */}
              <button
                type="button"
                onClick={() => spatialAudio.toggleAmbientMute()}
                className={`p-2 rounded-full transition-colors cursor-pointer text-xs flex items-center gap-1 ${
                  audioState.isAmbientMuted
                    ? 'text-stone-500 hover:text-stone-300'
                    : 'text-amber-400 hover:text-amber-300'
                }`}
                title={audioState.isAmbientMuted ? 'تفعيل الهمس الصوتي التراثي الخافت' : 'كتم أصوات الواحة الخلفية'}
              >
                {audioState.isAmbientMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* أزرار التنقل والتشغيل الرئيسية */}
              <div className="flex items-center gap-3">
                {/* المحطة السابقة */}
                <button
                  type="button"
                  onClick={handlePrevStop}
                  className="p-2 text-stone-400 hover:text-white transition-colors cursor-pointer"
                  title="المحطة السابقة"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                {/* ترجيع 10 ثوانٍ */}
                <button
                  type="button"
                  onClick={() => spatialAudio.skipSeconds(-10)}
                  className="p-2 text-stone-400 hover:text-white transition-colors cursor-pointer"
                  title="ترجيع 10 ثوانٍ"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* زر التشغيل والإيقاف الكبير */}
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="w-13 h-13 rounded-full bg-amber-400 hover:bg-amber-300 text-stone-950 flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                  title={isCurrentActive && !audioState.isPaused ? 'إيقاف مؤقت' : 'تشغيل'}
                >
                  {isCurrentActive && !audioState.isPaused ? (
                    <Pause className="w-6 h-6 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 fill-current translate-x-[-1px]" />
                  )}
                </button>

                {/* تقديم 10 ثوانٍ */}
                <button
                  type="button"
                  onClick={() => spatialAudio.skipSeconds(10)}
                  className="p-2 text-stone-400 hover:text-white transition-colors cursor-pointer"
                  title="تقديم 10 ثوانٍ"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                {/* المحطة التالية */}
                <button
                  type="button"
                  onClick={handleNextStop}
                  className="p-2 text-stone-400 hover:text-white transition-colors cursor-pointer"
                  title="المحطة التالية"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* محدد السرعة */}
              <button
                type="button"
                onClick={handleSpeedCycle}
                className="px-2 py-1 rounded-md text-[11px] font-mono text-stone-400 hover:text-amber-300 hover:bg-stone-800/80 transition-colors cursor-pointer"
                title="تعديل سرعة الإلقاء"
              >
                {audioState.playbackRate}x
              </button>
            </div>
          </div>

          {/* ── شريط التبويبات السفلي (النص المسموع / المراجع / قائمة المحطات) ── */}
          <div className="w-full mt-8 border-t border-stone-800/80 pt-4">
            <div className="flex items-center justify-center gap-1 bg-stone-900/60 p-1 rounded-xl max-w-sm mx-auto mb-4 border border-stone-800/60">
              <button
                type="button"
                onClick={() => setActiveTab('transcript')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-thmanyah font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'transcript'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>النص</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('insights')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-thmanyah font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'insights'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                <span>المراجع والمعلومات</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('playlist')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-thmanyah font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'playlist'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <ListMusic className="w-3.5 h-3.5" />
                <span>المحطات</span>
              </button>
            </div>

            {/* تبويب النص الكامل المشكول */}
            {activeTab === 'transcript' && (
              <div className="bg-stone-900/40 rounded-2xl p-4 sm:p-5 border border-stone-800/50 text-right space-y-3">
                <div className="flex items-center justify-between text-xs text-stone-400 pb-2 border-b border-stone-800/40">
                  <span className="flex items-center gap-1.5 text-amber-400 font-thmanyah font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>النص الوثائقي المنطوق</span>
                  </span>
                  <span className="text-[11px] text-stone-500 font-mono">
                    {activeStop.durationLabel}
                  </span>
                </div>

                <p className="text-sm sm:text-base leading-relaxed text-stone-200 font-thmanyah font-bold select-text">
                  {activeStop.audioNarrationText}
                </p>

                <div className="pt-2 text-[11px] text-stone-500 font-thmanyah flex items-center justify-between">
                  <span>الأصوات مسجلة بنبرة إلقاء وثائقية فصيحة</span>
                  <span>{activeStop.soundscapeDescription}</span>
                </div>
              </div>
            )}

            {/* تبويب المراجع التاريخية والشواهد */}
            {activeTab === 'insights' && (
              <div className="bg-stone-900/40 rounded-2xl p-4 sm:p-5 border border-stone-800/50 text-right space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-stone-800/40">
                  <span className="flex items-center gap-1.5 text-stone-300 font-thmanyah font-bold">
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>المرجع المعتمد: «{activeStop.bookReference}» ({activeStop.pageRef})</span>
                  </span>
                  {onOpenResearch && (
                    <button
                      type="button"
                      onClick={() => onOpenResearch(activeStop.titleAr)}
                      className="text-amber-400 hover:underline font-thmanyah text-xs cursor-pointer"
                    >
                      طالع في الباحث التاريخي ❯
                    </button>
                  )}
                </div>

                <ul className="space-y-2 text-xs sm:text-sm text-stone-300 font-thmanyah">
                  {activeStop.historicalInsights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-2 flex flex-wrap gap-1.5">
                  {activeStop.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-thmanyah bg-stone-800/80 text-stone-400 px-2.5 py-0.5 rounded-full border border-stone-700/50"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* تبويب قائمة المحطات */}
            {activeTab === 'playlist' && (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {AUDIO_TOUR_STOPS.map((stop, idx) => {
                  const isSelected = idx === selectedStopIdx;
                  return (
                    <button
                      key={stop.id}
                      type="button"
                      onClick={() => handleSelectStop(idx, true)}
                      className={`w-full p-2.5 rounded-xl border text-right flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/40 text-stone-100'
                          : 'bg-stone-900/30 border-stone-800/50 text-stone-400 hover:bg-stone-800/40 hover:text-stone-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-base">{stop.icon}</span>
                        <div>
                          <p className="text-xs sm:text-sm font-thmanyah font-bold text-stone-200">
                            {stop.titleAr}
                          </p>
                          <p className="text-[10px] text-stone-500 font-thmanyah">
                            {stop.subtitleAr}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-stone-400">{stop.durationLabel}</span>
                        {isSelected && audioState.isPlaying && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
