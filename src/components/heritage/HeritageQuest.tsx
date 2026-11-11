import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  HERITAGE_QUEST_STAGES,
  HERITAGE_QUEST_RANKS,
  QUEST_STORAGE_KEY,
  type QuestQuestion
} from '@/data/heritageQuestData';
import {
  Sparkles,
  Search,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Award,
  X
} from 'lucide-react';

interface HeritageQuestProps {
  onSearchHint?: (hint: string) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const HeritageQuest: React.FC<HeritageQuestProps> = ({
  onSearchHint,
  onClose,
  isModal = false
}) => {
  const [currentStageIdx, setCurrentStageIdx] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [isCompletedAll, setIsCompletedAll] = useState<boolean>(false);

  // Load progress
  useEffect(() => {
    try {
      const saved = localStorage.getItem(QUEST_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.currentStageIdx === 'number') {
          setCurrentStageIdx(Math.min(parsed.currentStageIdx, HERITAGE_QUEST_STAGES.length - 1));
        }
        if (typeof parsed.score === 'number') {
          setScore(parsed.score);
        }
        if (Array.isArray(parsed.earnedBadges)) {
          setEarnedBadges(parsed.earnedBadges);
        }
        if (parsed.isCompletedAll) {
          setIsCompletedAll(true);
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  const saveProgress = (nextIdx: number, newScore: number, newBadges: string[], completed: boolean) => {
    try {
      localStorage.setItem(
        QUEST_STORAGE_KEY,
        JSON.stringify({
          currentStageIdx: nextIdx,
          score: newScore,
          earnedBadges: newBadges,
          isCompletedAll: completed
        })
      );
    } catch {
      // Ignore
    }
  };

  const currentQuest: QuestQuestion = HERITAGE_QUEST_STAGES[currentStageIdx];
  const isLastStage = currentStageIdx === HERITAGE_QUEST_STAGES.length - 1;

  const handleSelectOption = (optId: string) => {
    if (isSubmitted) return;
    setSelectedOption(optId);
  };

  const handleVerifyAnswer = () => {
    if (!selectedOption || isSubmitted) return;
    setIsSubmitted(true);
    const chosen = currentQuest.options.find((o) => o.id === selectedOption);
    if (chosen && chosen.isCorrect) {
      const newScore = score + 20;
      setScore(newScore);
      const newBadges = [...earnedBadges];
      if (currentQuest.badgeReward && !newBadges.includes(currentQuest.badgeReward.name)) {
        newBadges.push(currentQuest.badgeReward.name);
      }
      setEarnedBadges(newBadges);
    }
  };

  const handleNextStage = () => {
    if (isLastStage) {
      setIsCompletedAll(true);
      saveProgress(currentStageIdx, score, earnedBadges, true);
    } else {
      const nextIdx = currentStageIdx + 1;
      setCurrentStageIdx(nextIdx);
      setSelectedOption(null);
      setIsSubmitted(false);
      saveProgress(nextIdx, score, earnedBadges, false);
    }
  };

  const handleResetQuest = () => {
    setCurrentStageIdx(0);
    setSelectedOption(null);
    setIsSubmitted(false);
    setScore(0);
    setEarnedBadges([]);
    setIsCompletedAll(false);
    localStorage.removeItem(QUEST_STORAGE_KEY);
  };

  const handleAskResearcher = () => {
    if (onSearchHint && currentQuest.researchHint) {
      onSearchHint(currentQuest.researchHint);
    }
  };

  return (
    <div
      className={`rounded-3xl border-2 border-amber-500/50 bg-[#09111c] text-slate-100 shadow-2xl overflow-hidden font-sans ${
        isModal ? 'max-w-3xl lg:max-w-4xl w-full mx-auto my-auto min-h-[580px] md:min-h-[640px] flex flex-col' : 'my-8'
      }`}
      style={{ backgroundColor: '#09111c' }}
    >
      {/* ══════════════════════════════════════════════════════════════════
          1. Header: فخم وأكبر حجماً ومريح للعين
      ══════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-[#06101c] via-[#0d1e34] to-[#06101c] px-6 py-4 sm:px-8 sm:py-5 border-b border-amber-500/30 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400/30 to-amber-700/20 border-2 border-amber-400/60 flex items-center justify-center text-2xl shadow-md">
            🏺
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg sm:text-xl font-thmanyah font-bold text-amber-100">
                تحدي الباحث التاريخي
              </h3>
              <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-thmanyah font-bold text-xs px-3 py-0.5 rounded-full shadow-xs">
                {currentQuest.rankIcon} رتبة: {currentQuest.rankTitle}
              </span>
            </div>
            <p className="text-xs text-amber-200/70 font-thmanyah hidden sm:block mt-0.5">
              ألغاز تاريخ وارجلان وحاضرة سدراتة من أمهات المراجع الـ 11
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#06111f] px-4 py-1.5 rounded-2xl border border-amber-500/40 text-center shadow-inner">
            <span className="text-sm font-thmanyah font-bold text-amber-400">
              🪙 {score} <span className="text-xs font-normal text-amber-200/70">نقطة</span>
            </span>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              title="إغلاق التحدي"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          2. شريط الرتب الـ 5 المترقية: قارئ ➔ مستكشف ➔ فارس ➔ علاّمة ➔ مؤرخ
      ══════════════════════════════════════════════════════════════════ */}
      <div className="bg-[#06111f] border-b border-amber-500/20 px-6 py-3 shrink-0 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[380px] max-w-2xl mx-auto">
          {HERITAGE_QUEST_RANKS.map((r, idx) => {
            const isCurrent = idx === currentStageIdx;
            const isDone = idx < currentStageIdx;

            let pillStyle = 'text-slate-400 border-slate-800 bg-slate-900/40';
            if (isDone) {
              pillStyle = 'text-amber-300 border-amber-500/60 bg-amber-500/10 font-bold';
            } else if (isCurrent) {
              pillStyle = 'text-slate-950 border-amber-300 bg-gradient-to-r from-amber-400 to-amber-500 font-bold shadow-lg ring-2 ring-amber-400/30 scale-105';
            }

            return (
              <React.Fragment key={r.rank}>
                <div className={`px-3 py-1 rounded-xl border text-xs sm:text-sm font-thmanyah flex items-center gap-1.5 transition-all ${pillStyle}`}>
                  <span>{isDone ? '✓' : r.icon}</span>
                  <span>{r.rank}</span>
                </div>
                {idx < HERITAGE_QUEST_RANKS.length - 1 && (
                  <span className={`text-xs ${idx < currentStageIdx ? 'text-amber-400 font-bold' : 'text-slate-700'}`}>
                    ➔
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          3. جسم التحدي: مساحات رحبة وخطوط عريضة ومريحة
      ══════════════════════════════════════════════════════════════════ */}
      <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 bg-[#09111c] text-slate-100 flex flex-col justify-between">
        {/* If Completed All Stages */}
        {isCompletedAll ? (
          <div className="text-center py-10 space-y-6 my-auto">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400/30 to-amber-700/30 border-3 border-amber-400 flex items-center justify-center mx-auto shadow-2xl text-5xl animate-bounce">
              👑
            </div>
            <div className="max-w-lg mx-auto space-y-2">
              <span className="text-sm font-thmanyah font-bold text-amber-400 tracking-wider">
                ✦ ارتقيت إلى أعلى المراتب: مؤرخ الواحة الأكبر ✦
              </span>
              <h4 className="text-2xl sm:text-3xl font-thmanyah font-bold text-amber-200">
                طوبى لك يا مؤرخ وارجلان العظيم! 🎉
              </h4>
              <p className="text-sm font-thmanyah text-amber-100/90 leading-loose">
                اجتزت مراتب: قارئ ➔ مستكشف ➔ فارس ➔ علاّمة ➔ مؤرخ، وبرهنت على إحاطة شاملة بتاريخ الواحة وسدراتة من بطون الكتب الـ 11.
              </p>
            </div>

            {/* Badges Collection */}
            <div className="bg-[#06111f] border-2 border-amber-500/40 rounded-3xl p-5 max-w-xl mx-auto shadow-inner">
              <h5 className="text-sm font-thmanyah font-bold text-amber-400 mb-3.5 flex items-center justify-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>أوسمة الواحة المحفورة في سجلك:</span>
              </h5>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {HERITAGE_QUEST_STAGES.map((s) => (
                  <div
                    key={s.id}
                    className="bg-[#0f2136] border border-amber-400/50 text-amber-100 px-4 py-2 rounded-2xl shadow-xs flex items-center gap-2"
                  >
                    <span className="text-base">{s.badgeReward?.icon || '⭐'}</span>
                    <span className="text-xs sm:text-sm font-thmanyah font-bold">{s.badgeReward?.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 flex items-center justify-center gap-3">
              <Button
                onClick={handleResetQuest}
                variant="outline"
                className="border-amber-500/50 bg-[#0f2136] text-amber-200 hover:bg-[#173252] hover:text-white rounded-2xl px-6 h-12 text-sm font-thmanyah font-bold gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>إعادة الرحلة</span>
              </Button>
              {onClose && (
                <Button
                  onClick={onClose}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-thmanyah font-bold rounded-2xl px-8 h-12 text-sm cursor-pointer shadow-lg"
                >
                  إغلاق النافذة
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Active Stage */
          <div className="space-y-6">
            {/* ══════════════════════════════════════════════════════════════════
                بطاقة اللغز الأثرية (رحبة وأكبر حجماً)
            ══════════════════════════════════════════════════════════════════ */}
            <div className="rounded-3xl bg-gradient-to-b from-[#101f33] via-[#0c1827] to-[#08121e] border-2 border-amber-500/50 p-5 sm:p-7 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between text-xs sm:text-sm font-thmanyah text-amber-300 pb-2.5 border-b border-amber-500/20">
                <span className="font-bold flex items-center gap-2">
                  <span className="text-amber-400">❖</span>
                  <span>المحطة {currentQuest.stage} من 5: {currentQuest.title}</span>
                </span>
                <button
                  type="button"
                  onClick={handleAskResearcher}
                  className="inline-flex items-center gap-1.5 text-xs font-thmanyah font-bold text-amber-300 hover:text-amber-100 bg-amber-400/10 hover:bg-amber-400/25 border border-amber-400/30 rounded-xl px-3 py-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Search className="w-3.5 h-3.5 text-amber-400" />
                  <span>تلميح من الباحث التاريخي 🏺</span>
                </button>
              </div>

              {/* نص السؤال المباشر والواضح بحجم خط كبير وفخم */}
              <div className="my-4 py-3 px-4 sm:px-5 rounded-2xl bg-amber-500/5 border-r-4 border-amber-400">
                <p className="font-thmanyah text-base sm:text-xl text-amber-50 font-bold leading-relaxed text-right">
                  «{currentQuest.riddle}»
                </p>
              </div>

              <div className="text-xs font-thmanyah text-amber-200/70 flex items-center justify-between pt-1">
                <span>المصدر التاريخي: {currentQuest.bookTitle}</span>
                <span className="text-amber-400 font-bold bg-amber-400/10 px-2.5 py-0.5 rounded-lg border border-amber-400/20">
                  {currentQuest.pageReference}
                </span>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                ألواح الإجابة (أزرار كبيرة ورحبة ومريحة جداً للنقر)
            ══════════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {currentQuest.options.map((opt, idx) => {
                const isSelected = selectedOption === opt.id;
                let cardStyle =
                  'border border-amber-500/30 bg-[#0e1d2f] text-slate-100 hover:border-amber-400/80 hover:bg-[#152a42] hover:shadow-lg';
                if (isSelected && !isSubmitted) {
                  cardStyle = 'border-2 border-amber-400 bg-gradient-to-r from-amber-950/70 to-[#1b2b40] text-amber-100 font-bold shadow-xl ring-2 ring-amber-400/20';
                } else if (isSubmitted) {
                  if (opt.isCorrect) {
                    cardStyle = 'border-2 border-emerald-400 bg-gradient-to-r from-emerald-950 to-[#0e2a22] text-emerald-100 font-bold shadow-xl';
                  } else if (isSelected && !opt.isCorrect) {
                    cardStyle = 'border-2 border-rose-500 bg-rose-950/70 text-rose-200 line-through opacity-85';
                  } else {
                    cardStyle = 'border border-slate-800 bg-slate-900/40 opacity-35 text-slate-400';
                  }
                }

                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isSubmitted}
                    onClick={() => handleSelectOption(opt.id)}
                    className={`w-full text-right p-4 sm:p-5 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-3 transform hover:-translate-y-0.5 ${cardStyle}`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-thmanyah font-bold text-sm flex items-center justify-center shrink-0 shadow-md">
                        {['أ', 'ب', 'ج', 'د'][idx]}
                      </span>
                      <span className="text-sm sm:text-base font-thmanyah font-medium leading-relaxed">{opt.text}</span>
                    </div>
                    {isSubmitted && opt.isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    )}
                    {isSubmitted && isSelected && !opt.isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                الشرح والتوثيق بعد الإجابة
            ══════════════════════════════════════════════════════════════════ */}
            {isSubmitted && (
              <div className="bg-[#0e1d2f] border-2 border-amber-400/50 rounded-2xl p-4 space-y-2 animate-in fade-in duration-200 shadow-lg">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-thmanyah font-bold text-amber-300">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>التوثيق والشاهد التاريخي المباشر:</span>
                </div>
                <p className="text-xs sm:text-sm font-thmanyah text-amber-100 leading-relaxed text-right">
                  {currentQuest.explanation}
                </p>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                زر الإجراء الفخم
            ══════════════════════════════════════════════════════════════════ */}
            <div className="flex items-center justify-between pt-2">
              {!isSubmitted ? (
                <Button
                  onClick={handleVerifyAnswer}
                  disabled={!selectedOption}
                  className="px-8 py-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-thmanyah font-bold text-sm sm:text-base shadow-xl hover:shadow-amber-400/20 transition-all cursor-pointer disabled:opacity-40 gap-2 border border-amber-200/50 mr-auto"
                >
                  <span>اكشف سرّ اللغز 📜</span>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                </Button>
              ) : (
                <Button
                  onClick={handleNextStage}
                  className="px-8 py-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-thmanyah font-bold text-sm sm:text-base shadow-xl transition-all cursor-pointer gap-2 border border-amber-200/50 mr-auto"
                >
                  <span>{isLastStage ? 'ختام الرحلة واستلام الأوسمة 👑' : 'الانتقال إلى المحطة التالية 🏺 ❯'}</span>
                  <ArrowRight className="w-4 h-4 rotate-180 text-slate-950" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
