import React, { useState } from 'react';
import {
  HERITAGE_QUEST_RANKS,
  QUEST_STORAGE_KEY,
  generateRandomHeritageQuest,
  getRandomQuestionForStage,
  type QuestQuestion,
} from '@/data/heritageQuestData';
import {
  Sparkles,
  Search,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  RotateCcw,
  X,
  Shuffle,
  Award,
  BookOpen,
} from 'lucide-react';

interface HeritageQuestProps {
  onSearchHint?: (hint: string) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const HeritageQuest: React.FC<HeritageQuestProps> = ({
  onSearchHint,
  onClose,
  isModal = false,
}) => {
  const [questStages, setQuestStages] = useState<QuestQuestion[]>(() =>
    generateRandomHeritageQuest()
  );

  const [currentStageIdx, setCurrentStageIdx] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(QUEST_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          typeof parsed.currentStageIdx === 'number' &&
          parsed.currentStageIdx >= 0 &&
          parsed.currentStageIdx < 5
        ) {
          return parsed.currentStageIdx;
        }
      }
    } catch {
      // Ignore
    }
    return 0;
  });

  const [score, setScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(QUEST_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.score === 'number') {
          return parsed.score;
        }
      }
    } catch {
      // Ignore
    }
    return 0;
  });

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isCompletedAll, setIsCompletedAll] = useState<boolean>(false);

  const saveProgress = (nextIdx: number, newScore: number, completed: boolean) => {
    try {
      localStorage.setItem(
        QUEST_STORAGE_KEY,
        JSON.stringify({
          currentStageIdx: nextIdx,
          score: newScore,
          isCompletedAll: completed,
        })
      );
    } catch {
      // Ignore
    }
  };

  const currentQuest: QuestQuestion = questStages[currentStageIdx] || questStages[0];
  const isLastStage = currentStageIdx === questStages.length - 1;

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
      saveProgress(currentStageIdx, newScore, false);
    }
  };

  const handleNextStage = () => {
    if (isLastStage) {
      setIsCompletedAll(true);
      saveProgress(currentStageIdx, score, true);
    } else {
      const nextIdx = currentStageIdx + 1;
      setCurrentStageIdx(nextIdx);
      setSelectedOption(null);
      setIsSubmitted(false);
      saveProgress(nextIdx, score, false);
    }
  };

  const handleSwitchCurrentQuestion = () => {
    const stageNum = currentStageIdx + 1;
    const currentQId = currentQuest?.id;
    const newQuestion = getRandomQuestionForStage(stageNum, currentQId);

    const updated = [...questStages];
    updated[currentStageIdx] = newQuestion;
    setQuestStages(updated);
    setSelectedOption(null);
    setIsSubmitted(false);
  };

  const handleResetQuest = () => {
    const fresh = generateRandomHeritageQuest();
    setQuestStages(fresh);
    setCurrentStageIdx(0);
    setSelectedOption(null);
    setIsSubmitted(false);
    setScore(0);
    setIsCompletedAll(false);
    try {
      localStorage.removeItem(QUEST_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  const handleAskResearcher = () => {
    if (onSearchHint && currentQuest.researchHint) {
      onSearchHint(currentQuest.researchHint);
    }
  };

  return (
    <div
      dir="rtl"
      className={`rounded-[32px] bg-[#fdfbf7] text-[#301809] shadow-[0_30px_90px_rgba(24,10,2,0.5)] ring-1 ring-[#dbc397] overflow-hidden ${
        isModal ? 'w-full max-w-2xl mx-auto my-auto flex flex-col max-h-[90vh]' : 'my-8'
      }`}
    >
      {/* ── 1. الرأس بهوية تواصل صحراء (بني قهوائي دافئ وذهبي) ── */}
      <div className="px-6 py-4 sm:px-7 bg-gradient-to-l from-[#301809] via-[#43210c] to-[#301809] text-white flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-[#efa83f]/20 border border-[#efa83f]/40 flex items-center justify-center text-[#efa83f] shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-thmanyah font-bold text-white truncate">
              تحدي الباحث التاريخي
            </h3>
            <p className="text-xs text-[#fae1b7]/75 font-thmanyah">
              المحطة {currentStageIdx + 1} من 5 • رتبة{' '}
              <span className="text-[#efa83f] font-bold">{currentQuest.rankTitle}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isCompletedAll && (
            <button
              type="button"
              onClick={handleSwitchCurrentQuestion}
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#fae1b7] text-xs font-thmanyah font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="تبديل اللغز الحالي"
            >
              <Shuffle className="w-3.5 h-3.5 text-[#efa83f]" />
              <span className="hidden sm:inline">تغيير اللغز</span>
            </button>
          )}

          <div className="px-3 py-1.5 rounded-full bg-[#efa83f]/20 border border-[#efa83f]/35 text-xs font-thmanyah font-bold text-[#fae1b7]">
            {score} نقطة
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── 2. شريط التقدم النظيف والمرتب (بدون دوائر أو أسهم مزدحمة) ── */}
      <div className="px-6 sm:px-7 pt-4 pb-3 bg-[#f7f0e2]/70 border-b border-[#ebe0cb] shrink-0">
        <div className="grid grid-cols-5 gap-2">
          {HERITAGE_QUEST_RANKS.map((r, idx) => {
            const isCurrent = idx === currentStageIdx && !isCompletedAll;
            const isDone = idx < currentStageIdx || isCompletedAll;

            return (
              <div key={r.rank} className="space-y-1.5 text-center">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isDone
                      ? 'bg-[#b87a29]'
                      : isCurrent
                      ? 'bg-gradient-to-l from-[#b87a29] to-[#efa83f]'
                      : 'bg-[#e3d5bc]'
                  }`}
                />
                <span
                  className={`block text-[10px] sm:text-[11px] font-thmanyah transition-colors ${
                    isCurrent
                      ? 'text-[#301809] font-bold'
                      : isDone
                      ? 'text-[#723c11] font-medium'
                      : 'text-[#723c11]/45'
                  }`}
                >
                  {r.rank}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3. مساحة السؤال والخيارات الهادئة ── */}
      <div className="p-6 sm:p-8 overflow-y-auto flex-1">
        {isCompletedAll ? (
          <div className="text-center py-6 space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#301809] to-[#b87a29] text-[#efa83f] flex items-center justify-center mx-auto shadow-lg">
              <Award className="w-8 h-8" />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h4 className="text-xl sm:text-2xl font-thmanyah font-bold text-[#301809]">
                مبارك لك رتبة مؤرخ وارجلان
              </h4>
              <p className="text-xs sm:text-sm text-[#723c11]/85 leading-relaxed">
                أتممت المحطات الخمس بنجاح واكتشفت شواهد موثقة من تاريخ وارجلان وسدراتة.
              </p>
              <div className="pt-2">
                <span className="inline-block px-4 py-1.5 rounded-full bg-[#fae1b7]/70 border border-[#dbc397] text-[#301809] text-xs font-thmanyah font-bold">
                  رصيدك النهائي: {score} نقطة
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleResetQuest}
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-[#fae1b7]/50 border border-[#dbc397] text-[#301809] text-xs font-thmanyah font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#b87a29]" />
                <span>إعادة التحدي</span>
              </button>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-l from-[#b87a29] to-[#efa83f] hover:from-[#a56b20] hover:to-[#f5b44c] text-[#301809] text-xs font-thmanyah font-bold shadow-sm transition-all cursor-pointer"
                >
                  إغلاق
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* المصدر وتلميح الباحث */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#723c11] bg-[#fae1b7]/45 px-3 py-1 rounded-full border border-[#e5d5b7]">
                <BookOpen className="w-3.5 h-3.5 text-[#b87a29]" />
                <span>
                  «{currentQuest.bookTitle}» ({currentQuest.pageReference})
                </span>
              </span>

              <button
                type="button"
                onClick={handleAskResearcher}
                className="inline-flex items-center gap-1.5 text-xs font-thmanyah font-bold text-[#723c11] hover:text-[#301809] hover:bg-[#fae1b7]/50 px-3 py-1 rounded-full transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-[#b87a29]" />
                <span>تلميح الباحث</span>
              </button>
            </div>

            {/* نص السؤال مباشرة بدون صندوق داخلي ثقيل */}
            <h4 className="font-thmanyah font-bold text-xl sm:text-2xl text-[#301809] leading-relaxed">
              {currentQuest.riddle}
            </h4>

            {/* خيارات الإجابة (بطاقات نظيفة ومريحة) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQuest.options.map((opt, idx) => {
                const isSelected = selectedOption === opt.id;
                let cardClass =
                  'bg-white hover:bg-[#fae1b7]/35 border border-[#e5d8c0] hover:border-[#b87a29] text-[#301809]';
                let badgeClass = 'bg-[#f5ebd9] text-[#723c11]';

                if (isSelected && !isSubmitted) {
                  cardClass =
                    'bg-[#301809] border border-[#301809] text-[#fae1b7] shadow-md';
                  badgeClass = 'bg-[#efa83f] text-[#301809]';
                } else if (isSubmitted) {
                  if (opt.isCorrect) {
                    cardClass =
                      'bg-emerald-50 border-2 border-emerald-500 text-emerald-950 font-bold';
                    badgeClass = 'bg-emerald-500 text-white';
                  } else if (isSelected && !opt.isCorrect) {
                    cardClass =
                      'bg-rose-50 border-2 border-rose-400 text-rose-900 line-through opacity-80';
                    badgeClass = 'bg-rose-500 text-white';
                  } else {
                    cardClass =
                      'bg-white/60 border border-[#ebe0cb] text-[#723c11]/45 opacity-60';
                    badgeClass = 'bg-[#f2eadb] text-[#723c11]/40';
                  }
                }

                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isSubmitted}
                    onClick={() => handleSelectOption(opt.id)}
                    className={`w-full text-right p-4 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs ${cardClass}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-7 h-7 rounded-full text-xs font-thmanyah font-bold flex items-center justify-center shrink-0 transition-colors ${badgeClass}`}
                      >
                        {['أ', 'ب', 'ج', 'د'][idx]}
                      </span>
                      <span className="text-xs sm:text-sm font-thmanyah font-bold leading-snug">
                        {opt.text}
                      </span>
                    </div>

                    {isSubmitted && opt.isCorrect && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    {isSubmitted && isSelected && !opt.isCorrect && (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* الشاهد التاريخي بعد الإجابة */}
            {isSubmitted && (
              <div className="bg-[#fae1b7]/35 border-r-[3px] border-[#efa83f] rounded-2xl p-4 space-y-1 animate-in fade-in duration-200">
                <div className="flex items-center gap-1.5 text-xs font-thmanyah font-bold text-[#723c11]">
                  <Sparkles className="w-3.5 h-3.5 text-[#b87a29]" />
                  <span>التوثيق التاريخي</span>
                </div>
                <p className="text-xs sm:text-sm text-[#301809] leading-relaxed">
                  {currentQuest.explanation}
                </p>
              </div>
            )}

            {/* شريط الإجراء السفلي */}
            <div className="flex items-center justify-between pt-2 border-t border-[#efe4d0]">
              <span className="text-xs text-[#723c11]/70 hidden sm:inline">
                {!isSubmitted ? 'اختر الإجابة ثم اضغط للتحقق' : 'واصل رحلتك في تاريخ الواحة'}
              </span>

              {!isSubmitted ? (
                <button
                  type="button"
                  onClick={handleVerifyAnswer}
                  disabled={!selectedOption}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-l from-[#b87a29] to-[#efa83f] hover:from-[#a56b20] hover:to-[#f5b44c] disabled:opacity-45 text-[#301809] font-thmanyah font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer mr-auto"
                >
                  تحقق من الإجابة
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextStage}
                  className="px-6 py-2.5 rounded-xl bg-[#301809] hover:bg-[#4a250e] text-[#fae1b7] font-thmanyah font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer flex items-center gap-2 mr-auto"
                >
                  <span>{isLastStage ? 'عرض النتيجة النهائية' : 'المحطة التالية'}</span>
                  <ArrowLeft className="w-4 h-4 text-[#efa83f]" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
