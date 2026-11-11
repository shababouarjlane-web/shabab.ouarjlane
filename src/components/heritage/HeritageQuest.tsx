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
  Award
} from 'lucide-react';

interface HeritageQuestProps {
  onSearchHint?: (hint: string) => void;
}

export const HeritageQuest: React.FC<HeritageQuestProps> = ({ onSearchHint }) => {
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
      // Trigger visual celebration
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
    <Card className="rounded-3xl border-2 border-[#dbc397] bg-linear-to-b from-white via-[#fcfaf7] to-[#fae1b7]/20 shadow-xl overflow-hidden font-sans my-8">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-[#723c11] via-[#8c4b18] to-[#301809] text-white p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#efa83f]/20 border border-[#efa83f]/50 flex items-center justify-center shrink-0 shadow-inner">
              <Trophy className="w-6 h-6 text-[#efa83f] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#efa83f] text-[#301809] font-black text-[10px] px-2 py-0.5 rounded-full inline-block">
                  تحدي واحة وارجلان
                </span>
                <span className="text-xs text-[#fae1b7]">مستند إلى المراجع الـ 11 الأكاديمية</span>
              </div>
              <h3 className="text-xl md:text-2xl font-thmanyah font-black text-white mt-1">
                تحدي الباحث التاريخي 🏺
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-white/20 text-center">
              <span className="text-[10px] text-[#fae1b7] block">مجموع النقاط</span>
              <span className="text-lg font-black text-[#efa83f]">{score} / 100</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-white/20 text-center">
              <span className="text-[10px] text-[#fae1b7] block">المرحلة الحالية</span>
              <span className="text-lg font-black text-white">
                {isCompletedAll ? 'مكتمل 🏆' : `${currentStageIdx + 1} من ${HERITAGE_QUEST_STAGES.length}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-6 md:p-8">
        {/* If Completed All Stages */}
        {isCompletedAll ? (
          <div className="text-center py-8 space-y-6">
            <div className="w-24 h-24 rounded-full bg-[#fae1b7]/50 border-4 border-[#efa83f] flex items-center justify-center mx-auto shadow-xl text-5xl">
              👑
            </div>
            <div className="max-w-lg mx-auto">
              <h4 className="text-2xl font-thmanyah font-black text-[#301809]">
                تهانينا يا مؤرخ وارجلان العظيم! 🎉
              </h4>
              <p className="text-sm text-[#723c11] mt-2 leading-relaxed">
                لقد اجتزت جميع مراحل تحدي الباحث التاريخي بنجاح، وبرهنت على معرفة عميقة بأسرار مدينة سدراتة، وقصر
                وارجلان، وخزائن المخطوطات، وتاريخ العزابة وحيلة الزيت في قارة كريمة.
              </p>
            </div>

            {/* Badges Collection */}
            <div className="bg-[#fae1b7]/30 border border-[#dbc397] rounded-2xl p-4 max-w-xl mx-auto">
              <h5 className="text-xs font-bold text-[#723c11] mb-3 flex items-center justify-center gap-1.5">
                <Award className="w-4 h-4 text-[#b87a29]" />
                <span>أوسمتك التاريخية المحققة:</span>
              </h5>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {HERITAGE_QUEST_STAGES.map((s) => (
                  <span
                    key={s.id}
                    className="bg-white border-2 border-[#dbc397] text-[#301809] px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5"
                  >
                    <span className="text-base">{s.badgeReward?.icon || '⭐'}</span>
                    <span className="text-xs font-bold">{s.badgeReward?.name}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleResetQuest}
                variant="outline"
                className="border-2 border-[#dbc397] text-[#723c11] hover:bg-[#fae1b7]/50 rounded-xl px-5 h-11 font-bold gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-[#b87a29]" />
                <span>إعادة خوض التحدي من البداية</span>
              </Button>
            </div>
          </div>
        ) : (
          /* Active Stage */
          <div className="space-y-6">
            {/* Stage Progress Bar */}
            <div className="w-full bg-[#ebd5b3]/40 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-linear-to-r from-[#efa83f] to-[#b87a29] h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${((currentStageIdx + (isSubmitted ? 1 : 0)) / HERITAGE_QUEST_STAGES.length) * 100}%`
                }}
              />
            </div>

            {/* Riddle Box */}
            <div className="bg-white border-2 border-[#dbc397] rounded-2xl p-5 md:p-6 shadow-xs relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-[#b87a29] bg-[#fae1b7]/40 px-2.5 py-1 rounded-lg">
                  المرحلة {currentQuest.stage}
                </span>
                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-[#b87a29]" />
                  <span>المرجع: {currentQuest.bookTitle}</span>
                </span>
              </div>

              <h4 className="text-lg md:text-xl font-thmanyah font-bold text-[#301809] leading-snug">
                {currentQuest.title}
              </h4>
              <p className="text-sm md:text-base text-[#723c11] mt-3 leading-relaxed bg-[#fcfaf7] p-4 rounded-xl border border-[#ebd5b3]">
                «{currentQuest.riddle}»
              </p>

              {/* Research Hint Helper Button */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#ebd5b3]/60">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <HelpCircle className="w-4 h-4 text-[#efa83f]" />
                  <span>هل استشكل عليك الحل؟</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAskResearcher}
                  className="border-[#dbc397] text-[#723c11] hover:bg-[#fae1b7]/40 rounded-xl h-8 text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
                >
                  <Search className="w-3.5 h-3.5 text-[#b87a29]" />
                  <span>ابحث عنها في الباحث التاريخي 🔎</span>
                </Button>
              </div>
            </div>

            {/* Options List */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-600 px-1">اختر الإجابة الصحيحة الموثقة:</h5>
              <div className="grid grid-cols-1 gap-2.5">
                {currentQuest.options.map((opt, idx) => {
                  const isSelected = selectedOption === opt.id;
                  let cardStyle = 'border-2 border-[#dbc397]/70 bg-white hover:border-[#b87a29] hover:bg-[#fae1b7]/20';
                  if (isSelected && !isSubmitted) {
                    cardStyle = 'border-2 border-[#b87a29] bg-[#fae1b7]/40 shadow-xs';
                  } else if (isSubmitted) {
                    if (opt.isCorrect) {
                      cardStyle = 'border-2 border-emerald-500 bg-emerald-50/90 text-emerald-950 font-bold';
                    } else if (isSelected && !opt.isCorrect) {
                      cardStyle = 'border-2 border-rose-500 bg-rose-50/90 text-rose-950 line-through';
                    } else {
                      cardStyle = 'border border-slate-200 bg-slate-50 opacity-50';
                    }
                  }

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isSubmitted}
                      onClick={() => handleSelectOption(opt.id)}
                      className={`w-full text-right p-4 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-3 ${cardStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-[#fae1b7]/60 text-[#723c11] font-bold text-xs flex items-center justify-center shrink-0">
                          {['أ', 'ب', 'ج', 'د'][idx]}
                        </span>
                        <span className="text-xs md:text-sm leading-relaxed text-[#301809]">{opt.text}</span>
                      </div>
                      {isSubmitted && opt.isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      )}
                      {isSubmitted && isSelected && !opt.isCorrect && (
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Explanation Card after Submission */}
            {isSubmitted && (
              <div className="bg-linear-to-b from-[#fae1b7]/30 to-white border-2 border-[#dbc397] rounded-2xl p-5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#efa83f]" />
                  <span className="text-xs font-black text-[#723c11]">التوثيق والشاهد الأكاديمي:</span>
                </div>
                <p className="text-xs md:text-sm text-[#301809] leading-relaxed">{currentQuest.explanation}</p>
                <div className="flex items-center justify-between text-[11px] text-[#723c11] bg-white/80 p-2.5 rounded-xl border border-[#ebd5b3]">
                  <span>📖 المصدر: {currentQuest.bookTitle}</span>
                  <span className="font-bold">{currentQuest.pageReference}</span>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2">
              {!isSubmitted ? (
                <Button
                  onClick={handleVerifyAnswer}
                  disabled={!selectedOption}
                  className="bg-[#b87a29] hover:bg-[#8c4b18] text-white px-6 h-11 rounded-xl font-bold cursor-pointer disabled:opacity-50 shadow-md gap-2 mr-auto"
                >
                  <span>تحقق من الإجابة</span>
                  <CheckCircle2 className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleNextStage}
                  className="bg-linear-to-r from-[#723c11] to-[#b87a29] hover:from-[#301809] hover:to-[#723c11] text-white px-6 h-11 rounded-xl font-bold cursor-pointer shadow-lg gap-2 mr-auto"
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
