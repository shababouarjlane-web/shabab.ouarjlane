import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
    <Card
      className={`rounded-3xl border-2 border-[#efa83f]/60 bg-linear-to-b from-[#1e120a] via-[#26150b] to-[#170c06] text-white shadow-2xl overflow-hidden font-sans ${
        isModal ? 'max-w-2xl w-full mx-auto my-auto max-h-[90vh] flex flex-col' : 'my-8'
      }`}
    >
      {/* Header Banner */}
      <div className="bg-linear-to-r from-[#723c11] via-[#8c4b18] to-[#301809] p-5 md:p-6 relative overflow-hidden border-b border-[#efa83f]/30 shrink-0">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#efa83f]/20 border border-[#efa83f]/50 flex items-center justify-center shrink-0 shadow-inner">
              <Trophy className="w-6 h-6 text-[#efa83f] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#efa83f] text-[#301809] font-black text-[10px] px-2.5 py-0.5 rounded-full inline-block">
                  تحدي واحة وارجلان
                </span>
                <span className="text-[11px] text-[#fae1b7]">مستند إلى المراجع الـ 11</span>
              </div>
              <h3 className="text-lg md:text-xl font-thmanyah font-black text-white mt-1">
                تحدي الباحث التاريخي 🏺
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
            <div className="bg-black/30 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/10 text-center">
              <span className="text-[9px] text-[#fae1b7] block">النقاط</span>
              <span className="text-base font-black text-[#efa83f]">{score} / 100</span>
            </div>
            <div className="bg-black/30 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/10 text-center">
              <span className="text-[9px] text-[#fae1b7] block">المرحلة</span>
              <span className="text-base font-black text-white">
                {isCompletedAll ? 'مكتمل 🏆' : `${currentStageIdx + 1}/${HERITAGE_QUEST_STAGES.length}`}
              </span>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer mr-1"
                title="إغلاق التحدي"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <CardContent className="p-5 md:p-6 overflow-y-auto flex-1 space-y-6">
        {/* If Completed All Stages */}
        {isCompletedAll ? (
          <div className="text-center py-6 space-y-5">
            <div className="w-20 h-20 rounded-full bg-[#efa83f]/20 border-3 border-[#efa83f] flex items-center justify-center mx-auto shadow-xl text-4xl animate-bounce">
              👑
            </div>
            <div className="max-w-md mx-auto">
              <h4 className="text-xl md:text-2xl font-thmanyah font-black text-[#efa83f]">
                تهانينا يا مؤرخ وارجلان العظيم! 🎉
              </h4>
              <p className="text-xs md:text-sm text-[#fae1b7]/90 mt-2 leading-relaxed">
                لقد اجتزت جميع مراحل تحدي الباحث التاريخي بنجاح، وبرهنت على معرفة عميقة بأسرار مدينة سدراتة، وقصر
                وارجلان، وخزائن المخطوطات، وتاريخ العزابة وحيلة الزيت في قارة كريمة.
              </p>
            </div>

            {/* Badges Collection */}
            <div className="bg-black/40 border border-[#efa83f]/30 rounded-2xl p-4 max-w-lg mx-auto">
              <h5 className="text-xs font-bold text-[#efa83f] mb-3 flex items-center justify-center gap-1.5">
                <Award className="w-4 h-4 text-[#efa83f]" />
                <span>أوسمتك التاريخية المحققة:</span>
              </h5>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {HERITAGE_QUEST_STAGES.map((s) => (
                  <span
                    key={s.id}
                    className="bg-white/10 border border-[#efa83f]/40 text-[#fae1b7] px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5"
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
                className="border-[#efa83f]/50 text-[#fae1b7] hover:bg-[#efa83f]/20 rounded-xl px-4 h-10 text-xs font-bold gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#efa83f]" />
                <span>إعادة خوض التحدي</span>
              </Button>
              {onClose && (
                <Button
                  onClick={onClose}
                  className="bg-[#efa83f] hover:bg-[#b87a29] text-[#301809] font-black rounded-xl px-5 h-10 text-xs cursor-pointer shadow-lg"
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
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="bg-linear-to-r from-[#efa83f] to-[#b87a29] h-2 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${((currentStageIdx + (isSubmitted ? 1 : 0)) / HERITAGE_QUEST_STAGES.length) * 100}%`
                }}
              />
            </div>

            {/* Riddle Box */}
            <div className="bg-black/40 border border-[#efa83f]/40 rounded-2xl p-4 md:p-5 shadow-xs relative">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-black text-[#301809] bg-[#efa83f] px-2.5 py-0.5 rounded-md">
                  المرحلة {currentQuest.stage} من {HERITAGE_QUEST_STAGES.length}
                </span>
                <span className="text-[11px] text-[#fae1b7]/80 font-medium flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-[#efa83f]" />
                  <span>المرجع: {currentQuest.bookTitle}</span>
                </span>
              </div>

              <h4 className="text-base md:text-lg font-thmanyah font-bold text-white leading-snug">
                {currentQuest.title}
              </h4>
              <p className="text-xs md:text-sm text-[#fae1b7] mt-2.5 leading-relaxed bg-[#301809]/60 p-3.5 rounded-xl border border-white/5">
                «{currentQuest.riddle}»
              </p>

              {/* Research Hint Helper Button */}
              <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
                <div className="flex items-center gap-1.5 text-[11px] text-[#fae1b7]/70">
                  <HelpCircle className="w-3.5 h-3.5 text-[#efa83f]" />
                  <span>هل استشكل عليك الحل؟</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAskResearcher}
                  className="border-[#efa83f]/50 bg-[#efa83f]/10 text-[#fae1b7] hover:bg-[#efa83f]/30 hover:text-white rounded-xl h-7 text-[11px] font-bold gap-1.5 cursor-pointer shadow-xs"
                >
                  <Search className="w-3 h-3 text-[#efa83f]" />
                  <span>ابحث عنها في الباحث التاريخي 🔎</span>
                </Button>
              </div>
            </div>

            {/* Options List */}
            <div className="space-y-2.5">
              <h5 className="text-[11px] font-bold text-[#fae1b7]/80 px-1">اختر الإجابة الصحيحة الموثقة:</h5>
              <div className="grid grid-cols-1 gap-2">
                {currentQuest.options.map((opt, idx) => {
                  const isSelected = selectedOption === opt.id;
                  let cardStyle =
                    'border border-white/10 bg-white/5 text-white hover:border-[#efa83f]/60 hover:bg-[#efa83f]/10';
                  if (isSelected && !isSubmitted) {
                    cardStyle = 'border-2 border-[#efa83f] bg-[#efa83f]/20 text-[#efa83f] font-bold shadow-xs';
                  } else if (isSubmitted) {
                    if (opt.isCorrect) {
                      cardStyle = 'border-2 border-emerald-400 bg-emerald-950/80 text-emerald-200 font-bold';
                    } else if (isSelected && !opt.isCorrect) {
                      cardStyle = 'border-2 border-rose-500 bg-rose-950/80 text-rose-200 line-through';
                    } else {
                      cardStyle = 'border border-white/5 bg-black/40 opacity-40';
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
                        <span className="w-6 h-6 rounded-lg bg-white/10 text-[#efa83f] font-black text-xs flex items-center justify-center shrink-0 border border-white/10">
                          {['أ', 'ب', 'ج', 'د'][idx]}
                        </span>
                        <span className="text-xs md:text-sm leading-relaxed">{opt.text}</span>
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
              <div className="bg-linear-to-b from-black/60 to-black/80 border border-[#efa83f]/40 rounded-xl p-4 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#efa83f]" />
                  <span className="text-xs font-black text-[#efa83f]">التوثيق والشاهد الأكاديمي:</span>
                </div>
                <p className="text-xs text-[#fae1b7] leading-relaxed">{currentQuest.explanation}</p>
                <div className="flex items-center justify-between text-[11px] text-[#fae1b7]/80 bg-white/5 p-2 rounded-lg border border-white/10">
                  <span>📖 المصدر: {currentQuest.bookTitle}</span>
                  <span className="font-bold text-[#efa83f]">{currentQuest.pageReference}</span>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2">
              {!isSubmitted ? (
                <Button
                  onClick={handleVerifyAnswer}
                  disabled={!selectedOption}
                  className="bg-[#efa83f] hover:bg-[#b87a29] text-[#301809] font-black px-6 h-10 rounded-xl cursor-pointer disabled:opacity-40 shadow-lg gap-2 mr-auto text-xs"
                >
                  <span>تحقق من الإجابة</span>
                  <CheckCircle2 className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleNextStage}
                  className="bg-linear-to-r from-[#efa83f] to-[#b87a29] hover:from-[#f0b24d] hover:to-[#8c4b18] text-[#301809] font-black px-6 h-10 rounded-xl cursor-pointer shadow-lg gap-2 mr-auto text-xs"
                >
                  <span>{isLastStage ? 'إنهاء التحدي واستلام الشارات 👑' : 'المرحلة التالية ⏩'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
