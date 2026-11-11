import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  HERITAGE_QUEST_STAGES,
  QUEST_STORAGE_KEY,
  type QuestQuestion
} from '@/data/heritageQuestData';
import {
  Trophy,
  Sparkles,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
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
      className={`rounded-3xl border-2 border-cyan-500/40 bg-[#0b172a] text-slate-100 shadow-2xl overflow-hidden font-sans ${
        isModal ? 'max-w-2xl w-full mx-auto my-auto max-h-[90vh] flex flex-col' : 'my-8'
      }`}
      style={{ backgroundColor: '#0b172a' }}
    >
      {/* Header Banner - Royal Indigo & Amber */}
      <div className="bg-gradient-to-r from-[#07162c] via-[#0f284d] to-[#07162c] p-5 md:p-6 relative overflow-hidden border-b border-cyan-500/30 shrink-0">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-400/50 flex items-center justify-center shrink-0 shadow-inner">
              <Trophy className="w-6 h-6 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full inline-block">
                  تحدي واحة وارجلان
                </span>
                <span className="text-[11px] text-cyan-200">مستند إلى المراجع الـ 11</span>
              </div>
              <h3 className="text-lg md:text-xl font-thmanyah font-black text-white mt-1">
                تحدي الباحث التاريخي 🏺
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
            <div className="bg-[#050f1d] px-3 py-1.5 rounded-xl border border-cyan-500/30 text-center">
              <span className="text-[9px] text-cyan-300 block">النقاط</span>
              <span className="text-base font-black text-amber-400">{score} / 100</span>
            </div>
            <div className="bg-[#050f1d] px-3 py-1.5 rounded-xl border border-cyan-500/30 text-center">
              <span className="text-[9px] text-cyan-300 block">المرحلة</span>
              <span className="text-base font-black text-white">
                {isCompletedAll ? 'مكتمل 🏆' : `${currentStageIdx + 1}/${HERITAGE_QUEST_STAGES.length}`}
              </span>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-600 text-white flex items-center justify-center transition-all cursor-pointer mr-1"
                title="إغلاق التحدي"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-5 md:p-6 overflow-y-auto flex-1 space-y-6 bg-[#0b172a] text-slate-100">
        {/* If Completed All Stages */}
        {isCompletedAll ? (
          <div className="text-center py-6 space-y-5">
            <div className="w-20 h-20 rounded-full bg-amber-400/20 border-3 border-amber-400 flex items-center justify-center mx-auto shadow-xl text-4xl animate-bounce">
              👑
            </div>
            <div className="max-w-md mx-auto">
              <h4 className="text-xl md:text-2xl font-thmanyah font-black text-amber-400">
                تهانينا يا مؤرخ وارجلان العظيم! 🎉
              </h4>
              <p className="text-xs md:text-sm text-slate-200 mt-2 leading-relaxed">
                لقد اجتزت جميع مراحل تحدي الباحث التاريخي بنجاح، وبرهنت على معرفة عميقة بأسرار مدينة سدراتة، وقصر
                وارجلان، وخزائن المخطوطات، وتاريخ العزابة وحيلة الزيت في قارة كريمة.
              </p>
            </div>

            {/* Badges Collection */}
            <div className="bg-[#050f1d] border border-cyan-500/40 rounded-2xl p-4 max-w-lg mx-auto">
              <h5 className="text-xs font-bold text-amber-400 mb-3 flex items-center justify-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span>أوسمتك التاريخية المحققة:</span>
              </h5>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {HERITAGE_QUEST_STAGES.map((s) => (
                  <span
                    key={s.id}
                    className="bg-[#10243e] border border-cyan-500/50 text-cyan-100 px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5"
                  >
                    <span className="text-sm">{s.badgeReward?.icon || '⭐'}</span>
                    <span className="text-xs font-bold">{s.badgeReward?.name}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <Button
                onClick={handleResetQuest}
                variant="outline"
                className="border-cyan-500/50 bg-[#10243e] text-cyan-200 hover:bg-[#1a3a63] hover:text-white rounded-xl px-4 h-10 text-xs font-bold gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>إعادة خوض التحدي</span>
              </Button>
              {onClose && (
                <Button
                  onClick={onClose}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl px-5 h-10 text-xs cursor-pointer shadow-lg"
                >
                  إغلاق النافذة
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Active Stage */
          <div className="space-y-5">
            {/* Stage Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-400 via-amber-400 to-amber-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${((currentStageIdx + (isSubmitted ? 1 : 0)) / HERITAGE_QUEST_STAGES.length) * 100}%`
                }}
              />
            </div>

            {/* Riddle Box */}
            <div className="bg-[#071322] border-2 border-cyan-500/30 rounded-2xl p-4 md:p-5 shadow-lg relative">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-black text-slate-950 bg-amber-400 px-2.5 py-0.5 rounded-md">
                  المرحلة {currentQuest.stage} من {HERITAGE_QUEST_STAGES.length}
                </span>
                <span className="text-[11px] text-cyan-300 font-medium flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  <span>المرجع: {currentQuest.bookTitle}</span>
                </span>
              </div>

              <h4 className="text-base md:text-lg font-thmanyah font-bold text-white mb-3">
                {currentQuest.title}
              </h4>

              <div className="bg-[#0b1c30] rounded-xl p-3.5 border border-cyan-800/60 mb-3 text-xs md:text-sm text-slate-200 leading-relaxed font-sans">
                «{currentQuest.riddle}»
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1 border-t border-cyan-900/40">
                <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                  <span>هل استشكل عليك الحل؟</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAskResearcher}
                  className="border-cyan-500/40 bg-[#0e233d] text-cyan-200 hover:bg-[#163861] hover:text-white rounded-xl h-7 text-[11px] font-bold gap-1.5 cursor-pointer shadow-xs"
                >
                  <Search className="w-3 h-3 text-cyan-400" />
                  <span>ابحث عنها في الباحث التاريخي 🔎</span>
                </Button>
              </div>
            </div>

            {/* Options List */}
            <div className="space-y-2.5">
              <h5 className="text-xs font-bold text-cyan-300 px-1">اختر الإجابة الصحيحة الموثقة:</h5>
              <div className="grid grid-cols-1 gap-2">
                {currentQuest.options.map((opt, idx) => {
                  const isSelected = selectedOption === opt.id;
                  let cardStyle =
                    'border border-cyan-800/80 bg-[#10243e] text-slate-100 hover:border-amber-400 hover:bg-[#163459]';
                  if (isSelected && !isSubmitted) {
                    cardStyle = 'border-2 border-amber-400 bg-amber-500/20 text-amber-200 font-bold shadow-md';
                  } else if (isSubmitted) {
                    if (opt.isCorrect) {
                      cardStyle = 'border-2 border-emerald-400 bg-emerald-950 text-emerald-100 font-bold shadow-md';
                    } else if (isSelected && !opt.isCorrect) {
                      cardStyle = 'border-2 border-rose-500 bg-rose-950 text-rose-200 line-through';
                    } else {
                      cardStyle = 'border border-slate-800 bg-slate-900/60 opacity-40 text-slate-400';
                    }
                  }

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isSubmitted}
                      onClick={() => handleSelectOption(opt.id)}
                      className={`w-full text-right p-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 ${cardStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-[#071322] text-amber-400 font-black text-xs flex items-center justify-center shrink-0 border border-cyan-700/60">
                          {['أ', 'ب', 'ج', 'د'][idx]}
                        </span>
                        <span className="text-xs md:text-sm leading-relaxed font-medium">{opt.text}</span>
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
            </div>

            {/* Explanation Card after Submission */}
            {isSubmitted && (
              <div className="bg-[#071322] border-2 border-amber-400/50 rounded-xl p-4 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black text-amber-400">التوثيق والشاهد الأكاديمي:</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">{currentQuest.explanation}</p>
                <div className="flex items-center justify-between text-[11px] text-cyan-200 bg-[#0d223a] p-2 rounded-lg border border-cyan-800/60">
                  <span>📖 المصدر: {currentQuest.bookTitle}</span>
                  <span className="font-bold text-amber-400">{currentQuest.pageReference}</span>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2">
              {!isSubmitted ? (
                <Button
                  onClick={handleVerifyAnswer}
                  disabled={!selectedOption}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-6 h-10 rounded-xl cursor-pointer disabled:opacity-40 shadow-lg gap-2 mr-auto text-xs"
                >
                  <span>تحقق من الإجابة</span>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                </Button>
              ) : (
                <Button
                  onClick={handleNextStage}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black px-6 h-10 rounded-xl cursor-pointer shadow-lg gap-2 mr-auto text-xs"
                >
                  <span>{isLastStage ? 'إنهاء التحدي واستلام الشارات 👑' : 'المرحلة التالية ⏩'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
