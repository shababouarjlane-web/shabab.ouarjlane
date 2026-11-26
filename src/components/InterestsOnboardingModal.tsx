import React, { useEffect, useState } from 'react';
import {
  USER_INTEREST_CATEGORIES,
  getSavedInterests,
  saveUserInterests,
  markOnboardingSeen,
} from '@/lib/userInterests';
import {
  Bell,
  Check,
  X,
  Landmark,
  BookOpen,
  GraduationCap,
  Palette,
  Trophy,
  HeartHandshake,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

interface InterestsOnboardingModalProps {
  isOpen: boolean;
  userId?: string | null;
  userName?: string | null;
  onClose: () => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Heritage: Landmark,
  Religious: BookOpen,
  Educational: GraduationCap,
  Cultural: Palette,
  Sports: Trophy,
  Social: HeartHandshake,
};

export const InterestsOnboardingModal: React.FC<InterestsOnboardingModalProps> = ({
  isOpen,
  userId,
  userName,
  onClose,
}) => {
  const [selected, setSelected] = useState<string[]>(() => getSavedInterests());
  const [enableAlerts, setEnableAlerts] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      setSelected(getSavedInterests());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleInterest = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    saveUserInterests(selected, userId);
    if (enableAlerts && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
    toast.success(
      selected.length > 0
        ? `تم حفظ ${selected.length} اهتمامات بنجاح! ستصلك تنبيهات الجمعيات والفعاليات المناسبة لك.`
        : 'تم حفظ تفضيلاتك بنجاح!'
    );
    onClose();
  };

  const handleSkip = () => {
    markOnboardingSeen(userId);
    onClose();
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[130] bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={handleSkip}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-[32px] bg-[#fdfbf7] text-[#301809] shadow-[0_30px_90px_rgba(24,10,2,0.5)] ring-1 ring-[#dbc397] overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* الرأس بهوية تواصل صحراء */}
        <div className="px-6 py-5 sm:px-7 bg-gradient-to-l from-[#301809] via-[#4a250e] to-[#2b1507] text-white relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(239,168,63,0.22),_transparent_60%)]" />

          <div className="relative z-10 flex items-start justify-between gap-3">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#efa83f]/20 border border-[#efa83f]/35 text-[#fae1b7] text-[11px] font-thmanyah font-bold">
                <Sparkles className="w-3 h-3 text-[#efa83f]" />
                <span>مرحباً بك{userName ? ` يا ${userName}` : ''} في تواصل صحراء</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-thmanyah font-bold text-white leading-snug">
                اختر اهتماماتك المجتمعية
              </h2>
              <p className="text-xs text-[#fae1b7]/80">
                لنخصص لك دليل الفعاليات وتصلك تنبيهات الجمعيات التي تهمك فقط.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSkip}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* شبكة الاهتمامات الستة */}
        <div className="p-5 sm:p-7 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {USER_INTEREST_CATEGORIES.map((item) => {
              const Icon = ICON_MAP[item.id] || Sparkles;
              const isSelected = selected.includes(item.id);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleInterest(item.id)}
                  className={`text-right p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-[#301809] border-[#301809] text-[#fae1b7] shadow-md'
                      : 'bg-white hover:bg-[#fae1b7]/35 border-[#e5d8c0] hover:border-[#b87a29] text-[#301809]'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-[#efa83f] text-[#301809]'
                          : 'bg-[#fae1b7]/65 text-[#b87a29]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-thmanyah font-bold truncate">
                        {item.label}
                      </p>
                      <p
                        className={`text-[11px] leading-snug mt-0.5 line-clamp-2 ${
                          isSelected ? 'text-[#fae1b7]/75' : 'text-[#723c11]/75'
                        }`}
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border transition-colors ${
                      isSelected
                        ? 'bg-[#efa83f] border-[#efa83f] text-[#301809]'
                        : 'border-[#dbc397] bg-[#fdfbf7]'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </span>
                </button>
              );
            })}
          </div>

          {/* خيار تفعيل التنبيهات */}
          <label className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#fae1b7]/35 border border-[#e5d5b7] cursor-pointer">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-[#b87a29] shrink-0" />
              <div>
                <p className="text-xs font-thmanyah font-bold text-[#301809]">
                  تفعيل تنبيهات الجمعيات والفعاليات الجديدة
                </p>
                <p className="text-[11px] text-[#723c11]/75">
                  إشعارات هادئة فقط عند نشر فعالية تطابق اختياراتك
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={enableAlerts}
              onChange={(e) => setEnableAlerts(e.target.checked)}
              className="w-4 h-4 accent-[#b87a29] cursor-pointer"
            />
          </label>

          {/* أزرار الحفظ والتخطي */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={handleSkip}
              className="text-xs font-thmanyah font-bold text-[#723c11]/75 hover:text-[#301809] px-3 py-2 cursor-pointer transition-colors"
            >
              تخطي الآن
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-3 rounded-xl bg-gradient-to-l from-[#b87a29] to-[#efa83f] hover:from-[#a56b20] hover:to-[#f5b44c] text-[#301809] font-thmanyah font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              {selected.length > 0
                ? `حفظ اهتماماتي (${selected.length})`
                : 'المتابعة إلى المنصة'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
