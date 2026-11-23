import React, { useState, useEffect } from 'react';
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
  Sliders,
  Sparkles,
  BookOpen,
  Headphones,
  Wind,
  Navigation,
  X,
  Radio
} from 'lucide-react';

interface SpatialAudioTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStopId?: string;
  onFlyToLandmark?: (lat: number, lng: number) => void;
  onOpenResearch?: (hint: string) => void;
}

export const SpatialAudioTourModal: React.FC<SpatialAudioTourModalProps> = ({
  isOpen,
  onClose,
  initialStopId,
  onFlyToLandmark,
  onOpenResearch
}) => {
  const [selectedStopIdx, setSelectedStopIdx] = useState<number>(0);
  const [audioState, setAudioState] = useState<SpatialAudioState>({
    isPlaying: false,
    isPaused: false,
    currentStopId: null,
    progressPercent: 0,
    currentSentence: '',
    pan: 0,
    distanceMeters: 25,
    masterVolume: 0.85,
    ambientVolume: 0.65,
    voiceVolume: 0.95
  });

  const [isGpsMode, setIsGpsMode] = useState<boolean>(false);
  const [showMixer, setShowMixer] = useState<boolean>(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  // اشتراك في حالة المحرك الصوتي
  useEffect(() => {
    spatialAudio.subscribe((st) => {
      setAudioState(st);
    });
  }, []);

  // اختيار المحطة الابتدائية إن وُجدت
  useEffect(() => {
    if (initialStopId) {
      const idx = AUDIO_TOUR_STOPS.findIndex((s) => s.id === initialStopId);
      if (idx !== -1) {
        setSelectedStopIdx(idx);
      }
    }
  }, [initialStopId]);

  const activeStop: AudioTourStop = AUDIO_TOUR_STOPS[selectedStopIdx] || AUDIO_TOUR_STOPS[0];

  // تتبع الموقع الميداني الحي GPS
  useEffect(() => {
    if (!isGpsMode || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserCoords({ lat, lng });

        // تحديث التوجيه المكاني نحو المعلم النشط
        spatialAudio.updateSpatialCoordinates(lat, lng, activeStop.lat, activeStop.lng, pos.coords.heading || 0);
      },
      () => {
        setIsGpsMode(false);
      },
      { enableHighAccuracy: true }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isGpsMode, activeStop]);

  if (!isOpen) return null;

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
        activeStop.durationSeconds,
        activeStop.ambientPreset
      );

      if (onFlyToLandmark) {
        onFlyToLandmark(activeStop.lat, activeStop.lng);
      }
    }
  };

  const handleSelectStop = (idx: number) => {
    setSelectedStopIdx(idx);
    const stop = AUDIO_TOUR_STOPS[idx];
    if (onFlyToLandmark) {
      onFlyToLandmark(stop.lat, stop.lng);
    }
    // تشغيل المحطة الجديدة مباشرة
    spatialAudio.playStop(
      stop.id,
      stop.audioNarrationText,
      stop.durationSeconds,
      stop.ambientPreset
    );
  };

  const handleNextStop = () => {
    const nextIdx = (selectedStopIdx + 1) % AUDIO_TOUR_STOPS.length;
    handleSelectStop(nextIdx);
  };

  const handlePrevStop = () => {
    const prevIdx = (selectedStopIdx - 1 + AUDIO_TOUR_STOPS.length) % AUDIO_TOUR_STOPS.length;
    handleSelectStop(prevIdx);
  };

  const handleClose = () => {
    spatialAudio.stop();
    onClose();
  };

  // تسمية جهة الصوت المكاني
  const getPanLabel = (pan: number) => {
    if (pan < -0.2) return `أقصى اليسار (${Math.round(Math.abs(pan) * 100)}%) ⬅️`;
    if (pan > 0.2) return `أقصى اليمين (${Math.round(pan * 100)}%) ➡️`;
    return 'الوسط المباشر (تطابق أمامي) 🎯';
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-4xl bg-[#060e1a] border border-amber-400/30 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[92vh] text-slate-100"
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: '#060e1a' }}
      >
        {/* ══════════════════════════════════════════════════════════════════
            1. الرأس: دليل وارجلان وسدراتة الصوتي ثلاثي الأبعاد
        ══════════════════════════════════════════════════════════════════ */}
        <div className="px-5 py-4 sm:px-7 border-b border-amber-400/20 bg-gradient-to-b from-[#0c1e34] to-[#071322] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-sm shrink-0">
              <Headphones className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-thmanyah font-bold text-white">
                  الدليل الصوتي ثلاثي الأبعاد • ⵜⴰⵡⵉⵍⴰ ⵏ ⵡⴰⵔⴵⵍⴰⵏ
                </h3>
                <span className="text-[10px] font-thmanyah font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full hidden sm:inline-block">
                  Spatial 3D Audio
                </span>
              </div>
              <p className="text-xs text-slate-400 font-thmanyah mt-0.5">
                عش أجواء قوافل الصحراء وأسرار القصر العتيق عبر صوت مكاني مجسم
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* زر تفعيل GPS الميداني */}
            <button
              type="button"
              onClick={() => setIsGpsMode(!isGpsMode)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-thmanyah font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isGpsMode
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'bg-[#0d2238] border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="تفعيل التتبع الميداني الحي في الواحة"
            >
              <Navigation className={`w-3.5 h-3.5 ${isGpsMode ? 'text-emerald-400 animate-spin' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">{isGpsMode ? 'الوضع الميداني نشط' : 'تفعيل GPS'}</span>
            </button>

            {/* مفتاح خلاط الصوت */}
            <button
              type="button"
              onClick={() => setShowMixer(!showMixer)}
              className={`p-2 rounded-xl border text-xs transition-all cursor-pointer ${
                showMixer
                  ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="التحكم بمستوى المؤثرات والرياح"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* إغلاق */}
            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 rounded-xl bg-slate-800/70 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            2. شريط المحطات التاريخية (تصفح سلس وسريع)
        ══════════════════════════════════════════════════════════════════ */}
        <div className="px-4 sm:px-6 py-2.5 border-b border-amber-400/15 bg-[#040a13] overflow-x-auto no-scrollbar flex items-center gap-2 shrink-0">
          {AUDIO_TOUR_STOPS.map((stop, idx) => {
            const isCurrent = idx === selectedStopIdx;
            const isAudioActive = isCurrent && audioState.isPlaying;

            return (
              <button
                key={stop.id}
                type="button"
                onClick={() => handleSelectStop(idx)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-thmanyah font-bold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                  isCurrent
                    ? 'bg-gradient-to-r from-amber-400/20 via-[#102742] to-amber-400/10 border-amber-400 text-amber-300 shadow-sm'
                    : 'bg-[#091524] border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span className="text-sm">{stop.icon}</span>
                <span>{stop.titleAr}</span>
                {isAudioActive && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                )}
              </button>
            );
          })}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            3. قلب المشغل الصوتي المكاني
        ══════════════════════════════════════════════════════════════════ */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* بطاقة المعلم والمؤثر البصري */}
            <div className="lg:col-span-5 flex flex-col items-center text-center p-6 rounded-3xl bg-gradient-to-b from-[#0c2037] to-[#071322] border border-amber-400/25 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

              {/* أيقونة المعلم مع دوائر الموجات الصوتية المكانية */}
              <div className="relative my-4">
                {audioState.isPlaying && !audioState.isPaused && (
                  <>
                    <div className="absolute inset-0 rounded-full border-2 border-amber-400/40 animate-ping" />
                    <div className="absolute -inset-3 rounded-full border border-amber-400/20 animate-pulse" />
                  </>
                )}
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-400/20 via-[#10253e] to-amber-500/20 border-2 border-amber-400/60 flex items-center justify-center text-5xl shadow-[0_0_30px_rgba(245,158,11,0.25)] relative z-10">
                  {activeStop.icon}
                </div>
              </div>

              <span className="text-xs font-thmanyah font-bold text-amber-300 bg-amber-400/10 border border-amber-400/30 px-3 py-0.5 rounded-full mb-1">
                {activeStop.categoryLabel}
              </span>
              <h4 className="text-lg sm:text-xl font-thmanyah font-bold text-white leading-tight">
                {activeStop.titleAr}
              </h4>
              <p className="text-xs text-slate-300 font-thmanyah mt-1 max-w-xs">
                {activeStop.subtitleAr}
              </p>

              {/* رادار الموضع المكاني (3D Soundstage Meter) */}
              <div className="w-full mt-4 pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-thmanyah text-slate-400">
                  <span className="flex items-center gap-1 text-amber-300">
                    <Radio className="w-3 h-3 text-amber-400" />
                    <span>توجيه الصوت في السماعة:</span>
                  </span>
                  <span className="font-bold text-amber-300">{getPanLabel(audioState.pan)}</span>
                </div>

                {/* شريط توجيه الـ Pan */}
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-300"
                    style={{
                      width: '24px',
                      marginLeft: `${((audioState.pan + 1) / 2) * (100 - 15)}%`
                    }}
                  />
                </div>

                {/* مقبض تغيير الزاوية يدوياً في وضع الاستكشاف الافتراضي */}
                {!isGpsMode && (
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                    <span>يسار</span>
                    <input
                      type="range"
                      min="-1"
                      max="1"
                      step="0.05"
                      value={audioState.pan}
                      onChange={(e) => spatialAudio.setPanManual(parseFloat(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      title="تحريك مصدر الصوت بين الأذنين يدوياً"
                    />
                    <span>يمين</span>
                  </div>
                )}
              </div>
            </div>

            {/* تفاصيل الرواية التاريخية، الترجمة الفورية والتحكم */}
            <div className="lg:col-span-7 space-y-4">
              {/* شاشة النص المتزامن المباشر (Live Synced Transcript) */}
              <div className="p-4 rounded-2xl bg-[#081627] border border-amber-400/20 space-y-2">
                <div className="flex items-center justify-between text-xs font-thmanyah text-slate-400 pb-2 border-b border-slate-800">
                  <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>الرواية الصوتية التاريخية المباشرة:</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    المدة: {activeStop.durationLabel}
                  </span>
                </div>

                <div className="min-h-[90px] flex items-center justify-center text-right py-1">
                  <p className="text-sm sm:text-base font-thmanyah font-bold text-amber-50 leading-relaxed animate-in fade-in">
                    «{audioState.currentSentence || activeStop.audioNarrationText}»
                  </p>
                </div>

                {/* شريط التقدم الصوتي */}
                <div className="space-y-1 pt-1">
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 rounded-full transition-all duration-300"
                      style={{ width: `${audioState.progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-thmanyah">
                    <span>
                      {isGpsMode && userCoords
                        ? `إحداثياتك الميدانية: ${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}`
                        : `الموقع: ${activeStop.lat.toFixed(4)}, ${activeStop.lng.toFixed(4)}`}
                    </span>
                    <span>{audioState.progressPercent}% مكتمل</span>
                  </div>
                </div>
              </div>

              {/* أزرار التحكم الرئيسية الفاخرة */}
              <div className="flex items-center justify-center gap-4 py-2">
                <button
                  type="button"
                  onClick={handlePrevStop}
                  className="w-11 h-11 rounded-2xl bg-[#0a1c30] hover:bg-[#102742] border border-amber-400/30 text-amber-300 flex items-center justify-center transition-all cursor-pointer shadow-sm"
                  title="المحطة السابقة"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-thmanyah font-bold text-base shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center gap-3 transition-all cursor-pointer scale-105"
                >
                  {audioState.isPlaying && !audioState.isPaused ? (
                    <>
                      <Pause className="w-5 h-5 fill-current" />
                      <span>إيقاف مؤقت</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-current" />
                      <span>{audioState.isPaused ? 'استئناف الاستماع' : 'استمع للقصة ثلاثية الأبعاد'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleNextStop}
                  className="w-11 h-11 rounded-2xl bg-[#0a1c30] hover:bg-[#102742] border border-amber-400/30 text-amber-300 flex items-center justify-center transition-all cursor-pointer shadow-sm"
                  title="المحطة التالية"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* الخلاط الصوتي المنبثق للمؤثرات التراثية */}
              {showMixer && (
                <div className="p-3.5 rounded-2xl bg-[#071322] border border-amber-400/30 space-y-3 animate-in fade-in duration-200">
                  <div className="text-xs font-thmanyah font-bold text-amber-300 flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>خلاط الأصوات البيئية التراثية:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-thmanyah">
                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>الصوت العام</span>
                        <span>{Math.round(audioState.masterVolume * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={audioState.masterVolume}
                        onChange={(e) => spatialAudio.setMasterVolume(parseFloat(e.target.value))}
                        className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span className="flex items-center gap-1">
                          <Wind className="w-3 h-3 text-amber-400" />
                          <span>أصوات الرياح والواحة</span>
                        </span>
                        <span>{Math.round(audioState.ambientVolume * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={audioState.ambientVolume}
                        onChange={(e) => spatialAudio.setAmbientVolume(parseFloat(e.target.value))}
                        className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* الشواهد التاريخية والإحالات لبطون الكتب */}
              <div className="p-3.5 rounded-2xl bg-[#09182a]/70 border border-slate-800 text-xs font-thmanyah space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>المرجع المعتمد: «{activeStop.bookReference}» ({activeStop.pageRef})</span>
                  </span>
                  {onOpenResearch && (
                    <button
                      type="button"
                      onClick={() => onOpenResearch(activeStop.titleAr)}
                      className="text-amber-300 hover:text-white font-bold underline cursor-pointer"
                    >
                      طالع في الباحث التاريخي ❯
                    </button>
                  )}
                </div>

                <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
                  {activeStop.historicalInsights.slice(0, 2).map((ins, i) => (
                    <li key={i}>{ins}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
