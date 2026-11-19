import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  HERITAGE_QUEST_RANKS,
  QUEST_STORAGE_KEY,
  generateRandomHeritageQuest,
  getRandomQuestionForStage,
  type QuestQuestion
} from '@/data/heritageQuestData';
import {
  Sparkles,
  Search,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  X,
  Shuffle,
  ChevronLeft
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
  // 1. توليد أو استرجاع أسئلة الجلسة مع خلط عشوائي كامل
  const [questStages, setQuestStages] = useState<QuestQuestion[]>(() => {
    return generateRandomHeritageQuest();
  });

  // 2. استرجاع التقدم المحفوظ دون إجبار الأسئلة على التكرار
  const [currentStageIdx, setCurrentStageIdx] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(QUEST_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.currentStageIdx === 'number' && parsed.currentStageIdx >= 0 && parsed.currentStageIdx < 5) {
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
          isCompletedAll: completed
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

  // تبديل اللغز الحالي فقط لنفس المرحلة دون تصفير التقدم أو النقاط
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

  // إعادة التحدي من البداية عند الرغبة
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
      className={`rounded-3xl border border-amber-400/25 bg-[#060e1a] text-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.7)] overflow-hidden font-sans ${
        isModal ? 'w-full max-w-3xl mx-auto my-auto flex flex-col max-h-[90vh]' : 'my-8'
      }`}
      style={{ backgroundColor: '#060e1a' }}
    >
      {/* ══════════════════════════════════════════════════════════════════
          1. رأس التحدي: أزرق كحلي ليلي فاخر بلمسات ذهبية متوازنة (غير روبوتي)
      ══════════════════════════════════════════════════════════════════ */}
      <div className="px-5 py-4 sm:px-7 border-b border-amber-400/20 bg-gradient-to-b from-[#0c1c30] to-[#071221] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-sm shrink-0">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-thmanyah font-bold text-white leading-tight">
              تحدي الباحث التاريخي
            </h3>
            <p className="text-xs text-slate-400 font-thmanyah mt-0.5">
              المحطة {currentStageIdx + 1} من 5 • رتبة: <span className="text-amber-300 font-bold">{currentQuest.rankTitle}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* زر تبديل السؤال الحالي بسلاسة */}
          <button
            type="button"
            onClick={handleSwitchCurrentQuestion}
            className="px-3 py-1.5 rounded-xl border border-amber-400/30 hover:border-amber-400/70 bg-[#0d2238] hover:bg-[#132f4c] text-amber-300 hover:text-white flex items-center gap-1.5 text-xs font-thmanyah font-bold transition-all cursor-pointer shadow-xs"
            title="تبديل هذا السؤال بلغز آخر دون خسارة رصيدك"
          >
            <Shuffle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">تغيير اللغز</span>
          </button>

          {/* رصيد النقاط */}
          <div className="px-3 py-1.5 rounded-xl border border-amber-400/35 bg-amber-400/10 flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-thmanyah font-bold text-amber-300">
              🪙 {score}
            </span>
            <span className="text-[11px] font-thmanyah text-amber-200/70">نقطة</span>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800/70 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer mr-1"
              title="إغلاق التحدي"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          2. مسار التدرج في الرتب (RTL: قارئ 1 -> مستكشف 2 -> فارس 3 -> علاّمة 4 -> مؤرخ 5)
          الأسهم متجهة لليسار في اتجاه القراءة والتقدم الطبيعي
      ══════════════════════════════════════════════════════════════════ */}
      <div className="px-5 sm:px-7 py-3 border-b border-amber-400/15 bg-[#040911]/90">
        <div className="flex items-center justify-between max-w-xl mx-auto">
          {HERITAGE_QUEST_RANKS.map((r, idx) => {
            const isCurrent = idx === currentStageIdx;
            const isDone = idx < currentStageIdx;
            const isLast = idx === HERITAGE_QUEST_RANKS.length - 1;

            return (
              <React.Fragment key={r.rank}>
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-thmanyah font-bold transition-all ${
                      isDone
                        ? 'bg-amber-400 border border-amber-300 text-slate-950 font-black shadow-xs'
                        : isCurrent
                        ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.5)] ring-2 ring-amber-300/60 scale-105'
                        : 'bg-[#0a1727] border border-slate-700/70 text-slate-500'
                    }`}
                  >
                    {isDone ? '✓' : r.icon}
                  </div>
                  <span
                    className={`text-[10px] sm:text-[11px] font-thmanyah ${
                      isCurrent
                        ? 'text-amber-300 font-bold'
                        : isDone
                        ? 'text-slate-300 font-medium'
                        : 'text-slate-500'
                    }`}
                  >
                    {r.rank}
                  </span>
                </div>

                {/* السهم المتجه نحو اليسار (اتجاه التقدم في العربية من اليمين إلى اليسار) */}
                {!isLast && (
                  <div className="flex items-center justify-center flex-1 px-1 sm:px-2">
                    <div className="h-[1.5px] w-full bg-gradient-to-l from-slate-700 to-slate-800 relative flex items-center justify-center">
                      <ChevronLeft
                        className={`w-3.5 h-3.5 -mr-1 transition-colors ${
                          isDone ? 'text-amber-400' : 'text-slate-600'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          3. منطقة اللغز والخيارات (تصميم انسيابي، رحب، مريح دون تعقيد)
      ══════════════════════════════════════════════════════════════════ */}
      <div className="p-5 sm:p-6 overflow-y-auto flex-1 flex flex-col justify-between space-y-5">
        {isCompletedAll ? (
          /* شاشة تتويج المؤرخ */
          <div className="text-center py-8 space-y-5 my-auto">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(245,158,11,0.4)] text-3xl">
              👑
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h4 className="text-xl sm:text-2xl font-thmanyah font-bold text-white">
                طوبى لك يا مؤرخ وارجلان العظيم!
              </h4>
              <p className="text-xs sm:text-sm font-thmanyah text-slate-300 leading-relaxed">
                أتممت رحلة المعرفة عبر مراتب الواحة: (قارئ ← مستكشف ← فارس ← علاّمة ← مؤرخ)، وأحطت بأسرار تاريخ وارجلان وسدراتة من بطون المراجع التراثية.
              </p>
              <div className="pt-2">
                <span className="inline-block px-4 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-xs font-thmanyah font-bold">
                  مجموع رصيدك النهائي: {score} نقطة
                </span>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-center gap-3">
              <Button
                onClick={handleResetQuest}
                variant="outline"
                className="border-amber-400/40 bg-[#0c1c30] text-amber-200 hover:bg-[#132c4a] hover:text-white rounded-xl px-5 h-10 text-xs font-thmanyah font-bold gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>إعادة المغامرة</span>
              </Button>
              {onClose && (
                <Button
                  onClick={onClose}
                  className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-thmanyah font-bold rounded-xl px-6 h-10 text-xs cursor-pointer shadow-md"
                >
                  إغلاق النافذة
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* المرحلة الفعالة */
          <div className="space-y-4">
            {/* بطاقة السؤال المضيئة بدون تعقيد أو صناديق متداخلة */}
            <div className="rounded-2xl bg-gradient-to-b from-[#0b1a2e]/95 to-[#071322] border border-amber-400/25 p-4 sm:p-5 shadow-md">
              <div className="flex items-center justify-between text-xs font-thmanyah pb-2.5 border-b border-slate-800/80">
                <span className="text-amber-300 font-medium">
                  المصدر: كتاب «{currentQuest.bookTitle}» ({currentQuest.pageReference})
                </span>
                <button
                  type="button"
                  onClick={handleAskResearcher}
                  className="inline-flex items-center gap-1.5 text-[11px] font-thmanyah font-bold text-amber-300 hover:text-white bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 rounded-lg px-2.5 py-1 transition-all cursor-pointer"
                  title="استعن بالباحث التاريخي"
                >
                  <Search className="w-3 h-3 text-amber-400" />
                  <span>تلميح الباحث</span>
                </button>
              </div>

              {/* نص السؤال بخط ثمانية بولد واضح ومريح */}
              <div className="pt-3.5 pb-1 text-right">
                <h4 className="font-thmanyah text-base sm:text-xl text-white font-bold leading-relaxed">
                  «{currentQuest.riddle}»
                </h4>
              </div>
            </div>

            {/* شبكة خيارات الإجابة (موزعة ومخلوطة عشوائياً، وليست ثابتة في الخيار الأول) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentQuest.options.map((opt, idx) => {
                const isSelected = selectedOption === opt.id;
                let cardClass =
                  'border border-slate-800/80 hover:border-amber-400/50 bg-[#081525] hover:bg-[#0c1e34] text-slate-200';

                if (isSelected && !isSubmitted) {
                  cardClass =
                    'border-2 border-amber-400 bg-gradient-to-r from-amber-500/20 via-[#0d2238] to-[#081525] text-white font-bold shadow-[0_0_15px_rgba(245,158,11,0.2)]';
                } else if (isSubmitted) {
                  if (opt.isCorrect) {
                    cardClass =
                      'border-2 border-emerald-400 bg-emerald-950/70 text-emerald-100 font-bold shadow-sm';
                  } else if (isSelected && !opt.isCorrect) {
                    cardClass =
                      'border-2 border-rose-500 bg-rose-950/70 text-rose-200 line-through opacity-80';
                  } else {
                    cardClass = 'border border-slate-800/50 bg-slate-900/30 opacity-40 text-slate-500';
                  }
                }

                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isSubmitted}
                    onClick={() => handleSelectOption(opt.id)}
                    className={`w-full text-right p-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 ${cardClass}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-6 h-6 rounded-lg text-xs font-thmanyah font-bold flex items-center justify-center shrink-0 border transition-all ${
                          isSelected && !isSubmitted
                            ? 'bg-amber-400 border-amber-300 text-slate-950 font-black'
                            : 'bg-slate-800/80 border-slate-700 text-slate-300'
                        }`}
                      >
                        {['أ', 'ب', 'ج', 'د'][idx]}
                      </span>
                      <span className="text-xs sm:text-sm font-thmanyah font-bold leading-normal">
                        {opt.text}
                      </span>
                    </div>

                    {isSubmitted && opt.isCorrect && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    {isSubmitted && isSelected && !opt.isCorrect && (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* التوثيق والشاهد بعد التحقق */}
            {isSubmitted && (
              <div className="bg-[#08182a] border border-amber-400/30 rounded-xl p-3.5 space-y-1 animate-in fade-in duration-200">
                <div className="flex items-center gap-1.5 text-xs font-thmanyah font-bold text-amber-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>التوثيق والشاهد التاريخي:</span>
                </div>
                <p className="text-xs font-thmanyah text-slate-300 leading-relaxed text-right">
                  {currentQuest.explanation}
                </p>
              </div>
            )}

            {/* شريط الإجراء السفلي */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-400 font-thmanyah hidden sm:inline">
                {!isSubmitted ? 'اختر الإجابة المناسبة ثم اضغط للتحقق' : 'أحسنت، واصل رحلتك في تاريخ الواحة'}
              </span>

              {!isSubmitted ? (
                <Button
                  onClick={handleVerifyAnswer}
                  disabled={!selectedOption}
                  className="px-6 py-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-thmanyah font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-40 mr-auto border border-amber-200/50"
                >
                  <span>تحقق من الإجابة</span>
                </Button>
              ) : (
                <Button
                  onClick={handleNextStage}
                  className="px-6 py-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-thmanyah font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer gap-2 mr-auto border border-amber-200/50"
                >
                  <span>{isLastStage ? 'ختام التحدي وتتويج المؤرخ' : 'المحطة التالية'}</span>
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
