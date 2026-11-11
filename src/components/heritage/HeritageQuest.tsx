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
  BookOpen,
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
        isModal ? 'max-w-2xl w-full mx-auto my-auto max-h-[85vh] flex flex-col' : 'my-6'
      }`}
      style={{ backgroundColor: '#09111c' }}
    >
      {/* ══════════════════════════════════════════════════════════════════
          1. Header: مقتضب وأنيق
      ══════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-[#06101c] via-[#0d1e34] to-[#06101c] px-4 py-3 sm:px-5 sm:py-3.5 border-b border-amber-500/30 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-lg shadow-inner">
            🏺
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-thmanyah font-bold text-amber-100">
                تحدي الباحث التاريخي
              </h3>
              <span className="bg-amber-400 text-slate-950 font-thmanyah font-bold text-[10px] px-2 py-0.5 rounded-full">
                {currentQuest.rankIcon} رتبة: {currentQuest.rankTitle}
              </span>
            </div>
            <p className="text-[10px] text-amber-200/70 font-thmanyah hidden sm:block">
              مسابقة واحة وارجلان وسدراتة مستقاة من أمهات المراجع الـ 11
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="bg-[#06111f] px-3 py-1 rounded-xl border border-amber-500/40 text-center">
            <span className="text-xs font-thmanyah font-bold text-amber-400">
              🪙 {score} <span className="text-[10px] font-normal text-amber-200/70">نقطة</span>
            </span>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              title="إغلاق التحدي"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          2. شريط الرتب الـ 5: قارئ ➔ مستكشف ➔ فارس ➔ علاّمة ➔ مؤرخ
      ══════════════════════════════════════════════════════════════════ */}
      <div className="bg-[#06111f] border-b border-amber-500/20 px-3 py-2 shrink-0 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[340px] max-w-lg mx-auto">
          {HERITAGE_QUEST_RANKS.map((r, idx) => {
            const isCurrent = idx === currentStageIdx;
            const isDone = idx < currentStageIdx;

            let pillStyle = 'text-slate-400 border-slate-800 bg-slate-900/60';
            if (isDone) {
              pillStyle = 'text-amber-300 border-amber-500/60 bg-amber-500/10 font-bold';
            } else if (isCurrent) {
              pillStyle = 'text-slate-950 border-amber-300 bg-gradient-to-r from-amber-400 to-amber-500 font-bold shadow-md scale-105';
            }

            return (
              <React.Fragment key={r.rank}>
                <div className={`px-2 py-0.5 rounded-lg border text-[11px] font-thmanyah flex items-center gap-1 transition-all ${pillStyle}`}>
                  <span>{isDone ? '✓' : r.icon}</span>
                  <span>{r.rank}</span>
                </div>
                {idx < HERITAGE_QUEST_RANKS.length - 1 && (
                  <span className={`text-[10px] ${idx < currentStageIdx ? 'text-amber-400' : 'text-slate-700'}`}>
                    ➔
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          3. جسم التحدي المدمج
      ══════════════════════════════════════════════════════════════════ */}
      <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3.5 bg-[#09111c] text-slate-100">
        {/* If Completed All Stages */}
        {isCompletedAll ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400/30 to-amber-700/30 border-3 border-amber-400 flex items-center justify-center mx-auto shadow-2xl text-4xl animate-bounce">
              👑
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <span className="text-xs font-thmanyah font-bold text-amber-400 tracking-wider">
                ✦ ارتقيت إلى أعلى المراتب: مؤرخ الواحة الأكبر ✦
              </span>
              <h4 className="text-xl md:text-2xl font-thmanyah font-bold text-amber-200">
                طوبى لك يا مؤرخ وارجلان العظيم! 🎉
              </h4>
              <p className="text-xs font-thmanyah text-amber-100/90 leading-relaxed">
                اجتزت مراتب: قارئ ➔ مستكشف ➔ فارس ➔ علاّمة ➔ مؤرخ، وبرهنت على إحاطة شاملة بتاريخ الواحة وسدراتة من بطون الكتب الـ 11.
              </p>
            </div>

            {/* Badges Collection */}
            <div className="bg-[#06111f] border border-amber-500/40 rounded-2xl p-3.5 max-w-lg mx-auto shadow-inner">
              <h5 className="text-xs font-thmanyah font-bold text-amber-400 mb-2.5 flex items-center justify-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>أوسمة الواحة المحفورة في سجلك:</span>
              </h5>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {HERITAGE_QUEST_STAGES.map((s) => (
                  <div
                    key={s.id}
                    className="bg-[#0f2136] border border-amber-400/50 text-amber-100 px-3 py-1 rounded-xl shadow-xs flex items-center gap-1.5"
                  >
                    <span className="text-sm">{s.badgeReward?.icon || '⭐'}</span>
                    <span className="text-[11px] font-thmanyah font-bold">{s.badgeReward?.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <Button
                onClick={handleResetQuest}
                variant="outline"
                className="border-amber-500/50 bg-[#0f2136] text-amber-200 hover:bg-[#173252] hover:text-white rounded-xl px-4 h-10 text-xs font-thmanyah font-bold gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>إعادة الرحلة</span>
              </Button>
              {onClose && (
                <Button
                  onClick={onClose}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-thmanyah font-bold rounded-xl px-5 h-10 text-xs cursor-pointer shadow-lg"
                >
                  إغلاق النافذة
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Active Stage */
          <div className="space-y-3.5">
            {/* ══════════════════════════════════════════════════════════════════
                رق اللغز التراثي المحكم والمدمج
            ══════════════════════════════════════════════════════════════════ */}
            <div className="relative rounded-2xl bg-gradient-to-b from-[#101f33] via-[#0c1827] to-[#08121e] border border-amber-500/50 p-3.5 sm:p-4 shadow-xl">
              {/* شريط المرجع والاستشارة */}
              <div className="flex items-center justify-between text-xs font-thmanyah text-amber-300/90 pb-2 border-b border-amber-500/20">
                <span className="flex items-center gap-1.5 font-bold">
                  <span className="text-amber-400">❖</span>
                  <span>{currentQuest.title}</span>
                </span>
                <button
                  type="button"
                  onClick={handleAskResearcher}
                  className="inline-flex items-center gap-1 text-[11px] font-thmanyah text-amber-300 hover:text-amber-100 bg-amber-400/10 hover:bg-amber-400/25 border border-amber-400/30 rounded-lg px-2.5 py-1 transition-all cursor-pointer shadow-xs"
                >
                  <Search className="w-3 h-3 text-amber-400" />
                  <span>تلميح الباحث 🏺</span>
                </button>
              </div>

              {/* نص اللغز المخطوط */}
              <div className="my-2.5 py-2 px-3 rounded-xl bg-amber-500/5 border-r-3 border-amber-400/80">
                <p className="font-thmanyah text-sm sm:text-base text-amber-50 leading-relaxed text-right">
                  «{currentQuest.riddle}»
                </p>
              </div>

              {/* الشاهد والمصدر في سطر واحد */}
              <div className="text-[11px] font-thmanyah text-amber-200/70 flex items-center justify-between pt-1">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-amber-400" />
                  <span>المصدر: {currentQuest.bookTitle}</span>
                </span>
                <span className="text-amber-400 font-bold">{currentQuest.pageReference}</span>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                ألواح الروايات التاريخية (شبكة من عمودين لتقليل الارتفاع)
            ══════════════════════════════════════════════════════════════════ */}
            <div className="space-y-2">
              <h5 className="text-xs font-thmanyah font-bold text-amber-300 px-0.5 flex items-center gap-1">
                <span>✦</span>
                <span>اختر الرواية التاريخية الثابتة:</span>
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentQuest.options.map((opt, idx) => {
                  const isSelected = selectedOption === opt.id;
                  let cardStyle =
                    'border border-amber-500/30 bg-[#0e1d2f] text-slate-100 hover:border-amber-400/80 hover:bg-[#152a42] hover:shadow-md';
                  if (isSelected && !isSubmitted) {
                    cardStyle = 'border-2 border-amber-400 bg-gradient-to-r from-amber-950/60 to-[#1b2b40] text-amber-100 font-bold shadow-lg ring-1 ring-amber-400/20';
                  } else if (isSubmitted) {
                    if (opt.isCorrect) {
                      cardStyle = 'border-2 border-emerald-400 bg-gradient-to-r from-emerald-950 to-[#0e2a22] text-emerald-100 font-bold shadow-md';
                    } else if (isSelected && !opt.isCorrect) {
                      cardStyle = 'border-2 border-rose-500 bg-rose-950/70 text-rose-200 line-through opacity-85';
                    } else {
                      cardStyle = 'border border-slate-800 bg-slate-900/50 opacity-35 text-slate-400';
                    }
                  }

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isSubmitted}
                      onClick={() => handleSelectOption(opt.id)}
                      className={`w-full text-right p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2.5 ${cardStyle}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-thmanyah font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                          {['أ', 'ب', 'ج', 'د'][idx]}
                        </span>
                        <span className="text-xs sm:text-sm font-thmanyah font-medium leading-snug">{opt.text}</span>
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
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                شهادة المخطوط الأكاديمية بعد الإجابة
            ══════════════════════════════════════════════════════════════════ */}
            {isSubmitted && (
              <div className="bg-gradient-to-b from-[#0e1d2f] to-[#071320] border border-amber-400/60 rounded-xl p-3.5 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200 shadow-md">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-thmanyah font-bold text-amber-300">شهادة التوثيق والشاهد الأكاديمي:</span>
                </div>
                <p className="text-xs font-thmanyah text-amber-100 leading-relaxed text-right">
                  {currentQuest.explanation}
                </p>
                <div className="flex items-center justify-between text-[11px] font-thmanyah text-amber-200/90 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                  <span>📖 المصدر التاريخي: {currentQuest.bookTitle}</span>
                  <span className="font-bold text-amber-300">{currentQuest.pageReference}</span>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                زر الإجراء المدمج
            ══════════════════════════════════════════════════════════════════ */}
            <div className="flex items-center justify-between pt-1">
              {!isSubmitted ? (
                <Button
                  onClick={handleVerifyAnswer}
                  disabled={!selectedOption}
                  className="px-6 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-thmanyah font-bold text-xs shadow-lg transition-all cursor-pointer disabled:opacity-40 gap-1.5 border border-amber-200/50 mr-auto"
                >
                  <span>اكشف سرّ اللغز 📜</span>
                  <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                </Button>
              ) : (
                <Button
                  onClick={handleNextStage}
                  className="px-6 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-thmanyah font-bold text-xs shadow-lg transition-all cursor-pointer gap-1.5 border border-amber-200/50 mr-auto"
                >
                  <span>{isLastStage ? 'ختام الرحلة واستلام الأوسمة 👑' : 'الانتقال إلى المحطة التالية 🏺 ❯'}</span>
                  <ArrowRight className="w-3.5 h-3.5 rotate-180 text-slate-950" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
