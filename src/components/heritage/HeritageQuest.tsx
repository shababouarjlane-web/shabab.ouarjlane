import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  HERITAGE_QUEST_RANKS,
  QUEST_STORAGE_KEY,
  QUEST_QUESTIONS_KEY,
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
  Shuffle
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
  // توليد أسئلة عشوائية فريدة لكل مستخدم مع خلط الإجابات
  const [questStages, setQuestStages] = useState<QuestQuestion[]>(() => {
    try {
      const saved = localStorage.getItem(QUEST_QUESTIONS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 5) {
          return parsed;
        }
      }
    } catch {
      // Ignore
    }
    const fresh = generateRandomHeritageQuest();
    try {
      localStorage.setItem(QUEST_QUESTIONS_KEY, JSON.stringify(fresh));
    } catch {
      // Ignore
    }
    return fresh;
  });

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
          setCurrentStageIdx(Math.min(parsed.currentStageIdx, questStages.length - 1));
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
  }, [questStages.length]);

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

  // تبديل وتغيير اللغز الحالي فقط لنفس المرحلة دون تصفير التقدم أو النقاط
  const handleSwitchCurrentQuestion = () => {
    const stageNum = currentStageIdx + 1;
    const currentQId = currentQuest?.id;
    const newQuestion = getRandomQuestionForStage(stageNum, currentQId);

    const updated = [...questStages];
    updated[currentStageIdx] = newQuestion;
    setQuestStages(updated);
    setSelectedOption(null);
    setIsSubmitted(false);

    try {
      localStorage.setItem(QUEST_QUESTIONS_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  // إعادة الرحلة بالكامل من الصفر (فقط عند انتهاء الرحلة أو الرغبة بالبدء من جديد)
  const handleResetQuest = () => {
    const fresh = generateRandomHeritageQuest();
    setQuestStages(fresh);
    setCurrentStageIdx(0);
    setSelectedOption(null);
    setIsSubmitted(false);
    setScore(0);
    setEarnedBadges([]);
    setIsCompletedAll(false);
    try {
      localStorage.setItem(QUEST_QUESTIONS_KEY, JSON.stringify(fresh));
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
      className={`rounded-3xl border border-amber-500/30 bg-[#07111e] text-slate-100 shadow-2xl overflow-hidden font-sans ${
        isModal ? 'max-w-3xl lg:max-w-4xl w-full mx-auto my-auto min-h-[560px] md:min-h-[620px] flex flex-col' : 'my-8'
      }`}
      style={{ backgroundColor: '#07111e' }}
    >
      {/* ══════════════════════════════════════════════════════════════════
          1. Header: نظيف، فاخر، بخلفية كحلية عميقة ولمسات ذهبية راقية
      ══════════════════════════════════════════════════════════════════ */}
      <div className="px-6 py-5 sm:px-8 border-b border-amber-500/20 bg-gradient-to-b from-[#0c1b2f] to-[#07111e] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/40 flex items-center justify-center text-xl shadow-xs text-amber-300">
            🏺
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg sm:text-xl font-thmanyah font-bold text-white">
                تحدي الباحث التاريخي
              </h3>
              <span className="text-[11px] font-thmanyah font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                {currentQuest.rankIcon} رتبة: {currentQuest.rankTitle}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-thmanyah hidden sm:block mt-0.5">
              أسرار وارجلان وسدراتة من بطون الكتب والمراجع التاريخية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* زر تبديل السؤال الحالي بتصميم انسيابي أنيق */}
          <button
            type="button"
            onClick={handleSwitchCurrentQuestion}
            className="px-3 py-1.5 rounded-xl border border-amber-400/30 hover:border-amber-400/70 bg-[#0d2038] hover:bg-[#122b4a] text-amber-300 hover:text-amber-100 flex items-center gap-1.5 text-xs font-thmanyah transition-all cursor-pointer shadow-xs"
            title="تبديل هذا السؤال بلغز آخر للمرحلة دون خسارة رصيدك"
          >
            <Shuffle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">سؤال آخر</span>
          </button>

          {/* رصيد النقاط الذهبي */}
          <div className="px-3.5 py-1.5 rounded-xl border border-amber-400/40 bg-amber-400/10 text-center">
            <span className="text-xs sm:text-sm font-thmanyah font-bold text-amber-300">
              🪙 {score} <span className="text-[11px] font-normal text-amber-200/70">نقطة</span>
            </span>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              title="إغلاق التحدي"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          2. مسار الرتب المتصل بانسيابية (Timeline Flow بدون بوكسات روبوتية)
      ══════════════════════════════════════════════════════════════════ */}
      <div className="px-6 sm:px-8 py-3.5 border-b border-amber-500/10 bg-[#050c15]">
        <div className="flex items-center justify-between max-w-xl mx-auto relative">
          {/* خط المسار الواصل في الخلفية */}
          <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-800 -translate-y-1/2 z-0" />

          {HERITAGE_QUEST_RANKS.map((r, idx) => {
            const isCurrent = idx === currentStageIdx;
            const isDone = idx < currentStageIdx;

            let markerClass = 'w-7 h-7 rounded-full flex items-center justify-center text-xs border transition-all z-10 ';
            if (isDone) {
              markerClass += 'bg-amber-400 border-amber-300 text-slate-950 font-black shadow-xs';
            } else if (isCurrent) {
              markerClass += 'bg-gradient-to-br from-amber-400 to-amber-500 border-2 border-white text-slate-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-110';
            } else {
              markerClass += 'bg-[#0a1626] border-slate-700 text-slate-500';
            }

            return (
              <div key={r.rank} className="flex flex-col items-center gap-1 z-10">
                <div className={markerClass}>
                  {isDone ? '✓' : isCurrent ? r.icon : idx + 1}
                </div>
                <span
                  className={`text-[11px] font-thmanyah font-medium transition-colors ${
                    isCurrent ? 'text-amber-300 font-bold' : isDone ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  {r.rank}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          3. قلب التحدي: مساحة رحبة، نصوص مقروءة، وتصميم غير روبوتي
      ══════════════════════════════════════════════════════════════════ */}
      <div className="p-6 sm:p-8 overflow-y-auto flex-1 flex flex-col justify-between space-y-6">
        {/* شاشة إتمام التحدي */}
        {isCompletedAll ? (
          <div className="text-center py-10 space-y-6 my-auto">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 border border-amber-300 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(245,158,11,0.4)] text-4xl animate-bounce">
              👑
            </div>
            <div className="max-w-lg mx-auto space-y-2">
              <span className="text-xs font-thmanyah font-bold text-amber-400 tracking-wider">
                ✦ وسام الإنجاز التاريخي ✦
              </span>
              <h4 className="text-2xl sm:text-3xl font-thmanyah font-bold text-white">
                طوبى لك يا مؤرخ وارجلان العظيم! 🎉
              </h4>
              <p className="text-sm font-thmanyah text-slate-300 leading-loose">
                اجتزت مراتب: قارئ ← مستكشف ← فارس ← علاّمة ← مؤرخ، وبرهنت على إحاطة شاملة بتاريخ الواحة وسدراتة من بطون أمهات الكتب والمخطوطات التاريخية.
              </p>
            </div>

            <div className="pt-4 flex items-center justify-center gap-3">
              <Button
                onClick={handleResetQuest}
                variant="outline"
                className="border-amber-500/40 bg-[#0c1b2f] text-amber-200 hover:bg-[#122947] hover:text-white rounded-xl px-6 h-11 text-xs font-thmanyah font-bold gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>إعادة الرحلة</span>
              </Button>
              {onClose && (
                <Button
                  onClick={onClose}
                  className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-thmanyah font-bold rounded-xl px-7 h-11 text-xs cursor-pointer shadow-md"
                >
                  إغلاق النافذة
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* المرحلة النشطة */
          <div className="space-y-6">
            {/* بطاقة السؤال المفتوحة والأنيقة بدون مربعات متداخلة */}
            <div className="rounded-2xl bg-gradient-to-b from-[#0c1b2f]/90 to-[#081424] border border-amber-500/25 p-5 sm:p-7 shadow-lg relative">
              <div className="flex items-center justify-between text-xs font-thmanyah pb-3 border-b border-slate-800 text-slate-400">
                <span className="text-amber-300/90 font-medium flex items-center gap-1.5">
                  <span>المحطة {currentQuest.stage} من 5</span>
                  <span>•</span>
                  <span>من كتاب «{currentQuest.bookTitle}» ({currentQuest.pageReference})</span>
                </span>
                <button
                  type="button"
                  onClick={handleAskResearcher}
                  className="inline-flex items-center gap-1 text-[11px] font-thmanyah font-bold text-amber-300 hover:text-amber-100 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 rounded-lg px-2.5 py-1 transition-all cursor-pointer"
                >
                  <Search className="w-3 h-3 text-amber-400" />
                  <span>تلميح الباحث 🏺</span>
                </button>
              </div>

              {/* نص اللغز بمساحة مفتوحة وخط عربي دافئ ومريح */}
              <div className="pt-5 pb-2 text-right">
                <h4 className="font-thmanyah text-lg sm:text-2xl text-slate-50 font-bold leading-relaxed">
                  «{currentQuest.riddle}»
                </h4>
              </div>
            </div>

            {/* قائمة الخيارات الانسيابية */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQuest.options.map((opt, idx) => {
                const isSelected = selectedOption === opt.id;
                let cardStyle =
                  'border border-slate-800 hover:border-amber-400/50 bg-[#0a1626] hover:bg-[#0e1f36] text-slate-200';
                if (isSelected && !isSubmitted) {
                  cardStyle =
                    'border-2 border-amber-400 bg-gradient-to-r from-amber-500/15 via-[#0e223a] to-[#0a1626] text-white font-bold shadow-[0_0_15px_rgba(245,158,11,0.25)]';
                } else if (isSubmitted) {
                  if (opt.isCorrect) {
                    cardStyle =
                      'border-2 border-emerald-400 bg-emerald-950/60 text-emerald-100 font-bold shadow-md';
                  } else if (isSelected && !opt.isCorrect) {
                    cardStyle =
                      'border-2 border-rose-500 bg-rose-950/60 text-rose-200 line-through opacity-85';
                  } else {
                    cardStyle = 'border border-slate-800/60 bg-slate-900/30 opacity-40 text-slate-500';
                  }
                }

                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isSubmitted}
                    onClick={() => handleSelectOption(opt.id)}
                    className={`w-full text-right p-4 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 ${cardStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-lg text-xs font-thmanyah font-bold flex items-center justify-center shrink-0 border transition-all ${
                          isSelected && !isSubmitted
                            ? 'bg-amber-400 border-amber-300 text-slate-950 font-black'
                            : 'bg-slate-800/70 border-slate-700 text-slate-300'
                        }`}
                      >
                        {['أ', 'ب', 'ج', 'د'][idx]}
                      </span>
                      <span className="text-sm sm:text-base font-thmanyah font-medium leading-relaxed">
                        {opt.text}
                      </span>
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

            {/* بطاقة الشاهد والتوثيق بعد الإجابة */}
            {isSubmitted && (
              <div className="bg-[#0b1b2d] border border-amber-400/30 rounded-xl p-4 space-y-1.5 animate-in fade-in duration-200">
                <div className="flex items-center gap-1.5 text-xs font-thmanyah font-bold text-amber-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>التوثيق والشاهد التاريخي:</span>
                </div>
                <p className="text-xs sm:text-sm font-thmanyah text-slate-300 leading-relaxed text-right">
                  {currentQuest.explanation}
                </p>
              </div>
            )}

            {/* شريط الإجراء السفلي بتوازن راقٍ */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400 font-thmanyah hidden sm:inline">
                {!isSubmitted ? 'اختر الإجابة ثم اضغط على زر التحقق' : 'أحسنت، واصل رحلتك الاستكشافية'}
              </span>

              {!isSubmitted ? (
                <Button
                  onClick={handleVerifyAnswer}
                  disabled={!selectedOption}
                  className="px-7 py-5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-thmanyah font-bold text-sm shadow-lg hover:shadow-amber-400/25 transition-all cursor-pointer disabled:opacity-40 gap-2 border border-amber-200/50 mr-auto"
                >
                  <span>تحقق من الإجابة ✦</span>
                </Button>
              ) : (
                <Button
                  onClick={handleNextStage}
                  className="px-7 py-5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-thmanyah font-bold text-sm shadow-lg transition-all cursor-pointer gap-2 border border-amber-200/50 mr-auto"
                >
                  <span>{isLastStage ? 'ختام الرحلة واستلام التتويج 👑' : 'المحطة التالية ❯'}</span>
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
