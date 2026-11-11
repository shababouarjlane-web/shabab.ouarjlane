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
      className={`rounded-3xl border-2 border-amber-400 bg-[#140d07] text-amber-50 shadow-[0_0_50px_rgba(245,158,11,0.22)] overflow-hidden font-sans ${
        isModal ? 'max-w-3xl lg:max-w-4xl w-full mx-auto my-auto min-h-[580px] md:min-h-[640px] flex flex-col' : 'my-8'
      }`}
      style={{ backgroundColor: '#140d07' }}
    >
      {/* ══════════════════════════════════════════════════════════════════
          1. Header: فخم وموشح بالذهب الصحراوي الأصيل
      ══════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-[#221409] via-[#38210d] to-[#221409] px-6 py-4 sm:px-8 sm:py-5 border-b-2 border-amber-400/60 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 border-2 border-amber-300 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(245,158,11,0.4)] text-[#1a0e05]">
            🏺
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg sm:text-xl font-thmanyah font-bold text-amber-100">
                تحدي الباحث التاريخي
              </h3>
              <span className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-[#1a0e05] font-thmanyah font-bold text-xs px-3 py-0.5 rounded-full shadow-md border border-amber-200">
                {currentQuest.rankIcon} رتبة: {currentQuest.rankTitle}
              </span>
            </div>
            <p className="text-xs text-amber-200/80 font-thmanyah hidden sm:block mt-0.5">
              ألغاز تاريخ وارجلان وحاضرة سدراتة من بطون الكتب والمراجع التاريخية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* زر تغيير اللغز الحالي فقط دون فقدان المرحلة أو النقاط */}
          <button
            type="button"
            onClick={handleSwitchCurrentQuestion}
            className="bg-[#24160a] hover:bg-[#38220f] px-3.5 py-1.5 rounded-2xl border-2 border-amber-400/80 hover:border-amber-300 text-amber-300 hover:text-amber-100 flex items-center gap-1.5 text-xs font-thmanyah font-bold transition-all cursor-pointer shadow-md"
            title="تبديل هذا السؤال بلغز آخر لنفس المرحلة دون فقدان تقدمك أو رصيدك"
          >
            <Shuffle className="w-3.5 h-3.5 text-amber-400" />
            <span>تغيير اللغز 🎲</span>
          </button>

          <div className="bg-[#24160a] px-3.5 py-1.5 rounded-2xl border-2 border-amber-400/80 text-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <span className="text-sm font-thmanyah font-bold text-amber-300">
              🪙 {score} <span className="text-xs font-normal text-amber-200/70">نقطة</span>
            </span>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-[#24160a] hover:bg-[#38220f] border-2 border-amber-400/50 text-amber-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
              title="إغلاق التحدي"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          2. شريط الرتب الـ 5 مع أسهم معكوسة موجهة يساراً (اتجاه القراءة العربي RTL)
             قارئ ← مستكشف ← فارس ← علاّمة ← مؤرخ
      ══════════════════════════════════════════════════════════════════ */}
      <div className="bg-[#1b1007] border-b-2 border-amber-500/30 px-6 py-3 shrink-0 overflow-x-auto shadow-inner">
        <div className="flex items-center justify-between min-w-[380px] max-w-2xl mx-auto">
          {HERITAGE_QUEST_RANKS.map((r, idx) => {
            const isCurrent = idx === currentStageIdx;
            const isDone = idx < currentStageIdx;

            let pillStyle = 'text-amber-200/40 border-amber-900/50 bg-[#160d05]';
            if (isDone) {
              pillStyle = 'text-amber-300 border-2 border-amber-400/70 bg-amber-500/20 font-bold shadow-xs';
            } else if (isCurrent) {
              pillStyle = 'text-[#1a0e05] border-2 border-amber-200 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 font-black shadow-[0_0_20px_rgba(245,158,11,0.5)] scale-105';
            }

            return (
              <React.Fragment key={r.rank}>
                <div className={`px-3 py-1 rounded-xl border text-xs sm:text-sm font-thmanyah flex items-center gap-1.5 transition-all ${pillStyle}`}>
                  <span>{isDone ? '✓' : r.icon}</span>
                  <span>{r.rank}</span>
                </div>
                {idx < HERITAGE_QUEST_RANKS.length - 1 && (
                  <span className={`text-base font-bold ${idx < currentStageIdx ? 'text-amber-400' : 'text-amber-900/60'}`}>
                    ←
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          3. جسم التحدي: ذهبي دافئ ومريح للنظر
      ══════════════════════════════════════════════════════════════════ */}
      <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 bg-[#140d07] text-amber-50 flex flex-col justify-between">
        {/* If Completed All Stages */}
        {isCompletedAll ? (
          <div className="text-center py-10 space-y-6 my-auto">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 border-4 border-amber-200 flex items-center justify-center mx-auto shadow-[0_0_35px_rgba(245,158,11,0.5)] text-5xl animate-bounce">
              👑
            </div>
            <div className="max-w-lg mx-auto space-y-3">
              <span className="text-sm font-thmanyah font-bold text-amber-400 tracking-wider">
                ✦ ارتقيت إلى أعلى المراتب: مؤرخ الواحة الأكبر ✦
              </span>
              <h4 className="text-2xl sm:text-3xl font-thmanyah font-bold text-amber-200">
                طوبى لك يا مؤرخ وارجلان العظيم! 🎉
              </h4>
              <p className="text-sm font-thmanyah text-amber-100/90 leading-loose">
                اجتزت مراتب: قارئ ← مستكشف ← فارس ← علاّمة ← مؤرخ، وبرهنت على إحاطة شاملة بتاريخ الواحة وسدراتة من بطون أمهات الكتب والمخطوطات التاريخية.
              </p>
            </div>

            <div className="pt-4 flex items-center justify-center gap-3">
              <Button
                onClick={handleResetQuest}
                variant="outline"
                className="border-2 border-amber-400/80 bg-[#24160a] text-amber-200 hover:bg-[#38220f] hover:text-white rounded-2xl px-6 h-12 text-sm font-thmanyah font-bold gap-2 cursor-pointer shadow-md"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>إعادة الرحلة</span>
              </Button>
              {onClose && (
                <Button
                  onClick={onClose}
                  className="bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-[#1a0e05] font-thmanyah font-black rounded-2xl px-8 h-12 text-sm cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.4)] border border-amber-200"
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
                بطاقة اللغز الأثرية (ذهبية فاخرة)
            ══════════════════════════════════════════════════════════════════ */}
            <div className="rounded-3xl bg-gradient-to-b from-[#24160a] via-[#1d1107] to-[#170e06] border-2 border-amber-400/70 p-5 sm:p-7 shadow-[0_0_25px_rgba(245,158,11,0.2)] relative overflow-hidden">
              <div className="flex items-center justify-between text-xs sm:text-sm font-thmanyah text-amber-300 pb-2.5 border-b border-amber-500/30">
                <span className="font-bold flex items-center gap-2">
                  <span className="text-amber-400">❖</span>
                  <span>المحطة {currentQuest.stage} من 5: {currentQuest.title}</span>
                </span>
                <button
                  type="button"
                  onClick={handleAskResearcher}
                  className="inline-flex items-center gap-1.5 text-xs font-thmanyah font-bold text-amber-200 hover:text-white bg-amber-500/20 hover:bg-amber-500/35 border-2 border-amber-400/60 rounded-xl px-3.5 py-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Search className="w-3.5 h-3.5 text-amber-400" />
                  <span>تلميح من الباحث التاريخي 🏺</span>
                </button>
              </div>

              {/* نص السؤال المباشر والواضح بحجم خط كبير وفخم */}
              <div className="my-4 py-3.5 px-4 sm:px-5 rounded-2xl bg-[#2e1c0d] border-r-4 border-amber-400 shadow-inner">
                <p className="font-thmanyah text-base sm:text-xl text-amber-50 font-bold leading-relaxed text-right">
                  «{currentQuest.riddle}»
                </p>
              </div>

              <div className="text-xs font-thmanyah text-amber-200/80 flex items-center justify-between pt-1">
                <span>المصدر التاريخي: {currentQuest.bookTitle}</span>
                <span className="text-amber-300 font-bold bg-amber-400/20 px-2.5 py-0.5 rounded-lg border border-amber-400/50">
                  {currentQuest.pageReference}
                </span>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                ألواح الإجابة (أزرار كبيرة ورحبة ومريحة جداً للنقر بلون ذهبي فخم)
            ══════════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {currentQuest.options.map((opt, idx) => {
                const isSelected = selectedOption === opt.id;
                let cardStyle =
                  'border-2 border-amber-500/40 bg-[#22140a] text-amber-100 hover:border-amber-400 hover:bg-[#2e1d0e] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]';
                if (isSelected && !isSubmitted) {
                  cardStyle = 'border-2 border-amber-300 bg-gradient-to-r from-amber-600/30 via-[#3b230f] to-amber-600/20 text-amber-100 font-bold shadow-[0_0_25px_rgba(245,158,11,0.45)] ring-2 ring-amber-400/40';
                } else if (isSubmitted) {
                  if (opt.isCorrect) {
                    cardStyle = 'border-2 border-emerald-400 bg-gradient-to-r from-emerald-950 to-[#0e2a22] text-emerald-100 font-bold shadow-xl';
                  } else if (isSelected && !opt.isCorrect) {
                    cardStyle = 'border-2 border-rose-500 bg-rose-950/70 text-rose-200 line-through opacity-85';
                  } else {
                    cardStyle = 'border border-amber-900/40 bg-[#160d05]/60 opacity-35 text-amber-200/40';
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
                      <span className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-[#1a0e05] font-thmanyah font-bold text-sm flex items-center justify-center shrink-0 shadow-md border border-amber-200/50">
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
              <div className="bg-[#24160a] border-2 border-amber-400/80 rounded-2xl p-4 space-y-2 animate-in fade-in duration-200 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
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
                زر الإجراء الفخم بالذهب الصحراوي
            ══════════════════════════════════════════════════════════════════ */}
            <div className="flex items-center justify-between pt-2">
              {!isSubmitted ? (
                <Button
                  onClick={handleVerifyAnswer}
                  disabled={!selectedOption}
                  className="px-8 py-5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 hover:from-amber-300 hover:to-yellow-400 text-[#1a0e05] font-thmanyah font-black text-sm sm:text-base shadow-[0_4px_25px_rgba(245,158,11,0.5)] hover:shadow-amber-400/30 transition-all cursor-pointer disabled:opacity-40 gap-2 border-2 border-amber-200 mr-auto"
                >
                  <span>اكشف سرّ اللغز 📜</span>
                  <Sparkles className="w-4 h-4 text-[#1a0e05]" />
                </Button>
              ) : (
                <Button
                  onClick={handleNextStage}
                  className="px-8 py-5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 hover:from-amber-300 hover:to-yellow-400 text-[#1a0e05] font-thmanyah font-black text-sm sm:text-base shadow-[0_4px_25px_rgba(245,158,11,0.5)] transition-all cursor-pointer gap-2 border-2 border-amber-200 mr-auto"
                >
                  <span>{isLastStage ? 'ختام الرحلة واستلام التتويج 👑' : 'الانتقال إلى المحطة التالية 🏺 ❯'}</span>
                  <ArrowRight className="w-4 h-4 rotate-180 text-[#1a0e05]" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
