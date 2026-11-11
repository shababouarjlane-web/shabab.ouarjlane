import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  HERITAGE_QUEST_STAGES,
  QUEST_STORAGE_KEY,
  type QuestQuestion
} from '@/data/heritageQuestData';
import {
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
      className={`rounded-3xl border-2 border-amber-500/50 bg-[#09111c] text-slate-100 shadow-2xl overflow-hidden font-sans ${
        isModal ? 'max-w-2xl w-full mx-auto my-auto max-h-[92vh] flex flex-col' : 'my-8'
      }`}
      style={{ backgroundColor: '#09111c' }}
    >
      {/* ══════════════════════════════════════════════════════════════════
          Header: واجهة التحدي التراثية الأصيلة
      ══════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-[#06101c] via-[#0d1e34] to-[#06101c] p-5 md:p-6 relative overflow-hidden border-b border-amber-500/30 shrink-0">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-400/30 to-amber-700/20 border-2 border-amber-400/60 flex items-center justify-center shrink-0 shadow-lg text-2xl">
              🏺
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-thmanyah font-bold text-[11px] px-2.5 py-0.5 rounded-full inline-block shadow-xs">
                  مغامرة باحث الواحة
                </span>
                <span className="text-[11px] font-thmanyah text-amber-200/80">مستقاة من أمهات المراجع الـ 11</span>
              </div>
              <h3 className="text-lg md:text-xl font-thmanyah font-bold text-amber-100 mt-1">
                تحدي الباحث التاريخي ✦ أسرار وارجلان وسدراتة
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* رصيد النقاط المعرب دون انقلاب */}
            <div className="bg-[#06111f] px-3.5 py-2 rounded-2xl border border-amber-500/40 text-center shadow-inner">
              <span className="text-[10px] font-thmanyah text-amber-300 block">الرصيد العلمي</span>
              <span className="text-sm font-thmanyah font-bold text-amber-400">
                {score} <span className="text-[11px] font-normal text-amber-200/70">نقطة</span>
              </span>
            </div>

            {/* المرحلة الحالية */}
            <div className="bg-[#06111f] px-3.5 py-2 rounded-2xl border border-amber-500/40 text-center shadow-inner">
              <span className="text-[10px] font-thmanyah text-amber-300 block">المحطة الحالية</span>
              <span className="text-sm font-thmanyah font-bold text-slate-100">
                {isCompletedAll ? 'مكتمل 🏆' : `اللغز ${currentStageIdx + 1} من ${HERITAGE_QUEST_STAGES.length}`}
              </span>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer mr-1"
                title="إغلاق التحدي"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-5 md:p-6 overflow-y-auto flex-1 space-y-6 bg-[#09111c] text-slate-100">
        {/* If Completed All Stages */}
        {isCompletedAll ? (
          <div className="text-center py-8 space-y-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400/30 to-amber-700/30 border-3 border-amber-400 flex items-center justify-center mx-auto shadow-2xl text-5xl animate-bounce">
              👑
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <span className="text-xs font-thmanyah font-bold text-amber-400 tracking-wider">
                ✦ وسام التميز التراثي الأعلى ✦
              </span>
              <h4 className="text-2xl md:text-3xl font-thmanyah font-bold text-amber-200">
                طوبى لك يا مؤرخ وارجلان العظيم! 🎉
              </h4>
              <p className="text-xs md:text-sm font-thmanyah text-amber-100/90 leading-loose">
                لقد طفت في مجاهل حوض سدراتة، وسبرت أغوار قصر وارجلان العتيق، وحفظت حيلة الزيت في قارة كريمة، وبرهنت على بصيرة علمية بكتب الأئمة ورجالات الواحة.
              </p>
            </div>

            {/* Badges Collection */}
            <div className="bg-[#06111f] border-2 border-amber-500/40 rounded-3xl p-5 max-w-lg mx-auto shadow-inner">
              <h5 className="text-xs font-thmanyah font-bold text-amber-400 mb-3.5 flex items-center justify-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span>أوسمة الواحة المحفورة في سجلك:</span>
              </h5>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {HERITAGE_QUEST_STAGES.map((s) => (
                  <div
                    key={s.id}
                    className="bg-[#0f2136] border border-amber-400/50 text-amber-100 px-3.5 py-2 rounded-2xl shadow-xs flex items-center gap-2"
                  >
                    <span className="text-base">{s.badgeReward?.icon || '⭐'}</span>
                    <span className="text-xs font-thmanyah font-bold">{s.badgeReward?.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <Button
                onClick={handleResetQuest}
                variant="outline"
                className="border-amber-500/50 bg-[#0f2136] text-amber-200 hover:bg-[#173252] hover:text-white rounded-xl px-4 h-11 text-xs font-thmanyah font-bold gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>إعادة خوض التحدي</span>
              </Button>
              {onClose && (
                <Button
                  onClick={onClose}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-thmanyah font-bold rounded-xl px-6 h-11 text-xs cursor-pointer shadow-lg"
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
                مسار الأختام التاريخية الـ 5 (Milestone Seals Journey)
            ══════════════════════════════════════════════════════════════════ */}
            <div className="bg-[#06111f] border border-amber-500/30 rounded-2xl p-3 md:p-4">
              <div className="flex items-center justify-between relative px-2">
                {/* Connecting Thread */}
                <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-0.5 bg-gradient-to-r from-amber-900 via-amber-600 to-amber-900 pointer-events-none" />

                {HERITAGE_QUEST_STAGES.map((stage, idx) => {
                  const isCurrent = idx === currentStageIdx;
                  const isDone = idx < currentStageIdx;

                  let sealStyle = 'border-slate-700 bg-slate-900 text-slate-500';
                  if (isDone) {
                    sealStyle = 'border-amber-400 bg-amber-500 text-slate-950 font-bold shadow-md';
                  } else if (isCurrent) {
                    sealStyle = 'border-amber-300 bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black shadow-lg ring-4 ring-amber-400/30 scale-110';
                  }

                  return (
                    <div key={stage.id} className="relative z-10 flex flex-col items-center gap-1">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-thmanyah transition-all ${sealStyle}`}>
                        {isDone ? '✓' : idx + 1}
                      </div>
                      <span className={`text-[10px] font-thmanyah hidden sm:block ${isCurrent ? 'text-amber-300 font-bold' : 'text-slate-400'}`}>
                        {stage.badgeReward?.name ? stage.badgeReward.name.split(' ')[0] : `لغز ${idx + 1}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                رق اللغز التراثي (The Heritage Manuscript Scroll)
            ══════════════════════════════════════════════════════════════════ */}
            <div className="relative rounded-3xl bg-gradient-to-b from-[#101f33] via-[#0c1827] to-[#08121e] border-2 border-amber-500/50 p-5 md:p-6 shadow-2xl overflow-hidden">
              {/* زخارف أركان اللوح التراثي */}
              <div className="absolute top-3 right-3 text-amber-500/40 text-xs font-serif select-none pointer-events-none">❖</div>
              <div className="absolute top-3 left-3 text-amber-500/40 text-xs font-serif select-none pointer-events-none">❖</div>
              <div className="absolute bottom-3 right-3 text-amber-500/40 text-xs font-serif select-none pointer-events-none">❖</div>
              <div className="absolute bottom-3 left-3 text-amber-500/40 text-xs font-serif select-none pointer-events-none">❖</div>

              {/* عنوان اللغز والمرجع */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 border-b border-amber-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 text-sm">✦</span>
                  <h4 className="text-base sm:text-lg font-thmanyah font-bold text-amber-200">
                    {currentQuest.title}
                  </h4>
                </div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-thmanyah text-amber-300/80 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>المرجع: {currentQuest.bookTitle}</span>
                </div>
              </div>

              {/* نص اللغز المخطوط */}
              <div className="my-4 py-3.5 px-4 sm:px-6 rounded-2xl bg-amber-500/5 border-r-4 border-l-4 border-amber-400/60 shadow-inner">
                <span className="text-2xl text-amber-400/50 font-serif block -mb-2">❝</span>
                <p className="font-thmanyah text-base sm:text-lg text-amber-50 leading-loose tracking-wide text-right">
                  {currentQuest.riddle}
                </p>
                <span className="text-2xl text-amber-400/50 font-serif block -mt-2 text-left">❞</span>
              </div>

              {/* استشارة خزانة الباحث التاريخي */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-amber-500/20">
                <div className="text-[11px] font-thmanyah text-amber-200/70 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>هل استشكل عليك حل هذا اللغز التراثي؟</span>
                </div>
                <button
                  type="button"
                  onClick={handleAskResearcher}
                  className="inline-flex items-center gap-2 text-xs font-thmanyah font-bold text-amber-300 hover:text-amber-100 bg-amber-400/10 hover:bg-amber-400/25 border border-amber-400/30 rounded-xl px-3 py-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Search className="w-3.5 h-3.5 text-amber-400" />
                  <span>استشر خزانة الباحث التاريخي 🏺</span>
                </button>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                ألواح الروايات التاريخية (Options - Engraved Tablets)
            ══════════════════════════════════════════════════════════════════ */}
            <div className="space-y-2.5">
              <h5 className="text-xs font-thmanyah font-bold text-amber-300 px-1 flex items-center gap-1.5">
                <span>✦</span>
                <span>أيّ هذه الروايات هي الثابتة في أمهات كتب الواحة؟</span>
              </h5>
              <div className="grid grid-cols-1 gap-2.5">
                {currentQuest.options.map((opt, idx) => {
                  const isSelected = selectedOption === opt.id;
                  let cardStyle =
                    'border border-amber-500/30 bg-[#0e1d2f] text-slate-100 hover:border-amber-400/80 hover:bg-[#152a42] hover:shadow-md';
                  if (isSelected && !isSubmitted) {
                    cardStyle = 'border-2 border-amber-400 bg-gradient-to-r from-amber-950/60 to-[#1b2b40] text-amber-100 font-bold shadow-lg ring-2 ring-amber-400/20';
                  } else if (isSubmitted) {
                    if (opt.isCorrect) {
                      cardStyle = 'border-2 border-emerald-400 bg-gradient-to-r from-emerald-950 to-[#0e2a22] text-emerald-100 font-bold shadow-lg';
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
                      className={`w-full text-right p-4 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-3.5 transform hover:-translate-y-0.5 ${cardStyle}`}
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
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                شهادة المخطوط الأكاديمية (Explanation Testimony Card)
            ══════════════════════════════════════════════════════════════════ */}
            {isSubmitted && (
              <div className="bg-gradient-to-b from-[#0e1d2f] to-[#071320] border-2 border-amber-400/60 rounded-2xl p-5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300 shadow-xl">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-thmanyah font-bold text-amber-300">شهادة التوثيق والشاهد الأكاديمي:</span>
                </div>
                <p className="text-xs sm:text-sm font-thmanyah text-amber-100 leading-loose text-right">
                  {currentQuest.explanation}
                </p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-thmanyah text-amber-200/90 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30 gap-1.5">
                  <span>📖 المصدر التاريخي: {currentQuest.bookTitle}</span>
                  <span className="font-bold text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-md">{currentQuest.pageReference}</span>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                زر الإجراء التراثي (Action Button)
            ══════════════════════════════════════════════════════════════════ */}
            <div className="flex items-center justify-between pt-2">
              {!isSubmitted ? (
                <Button
                  onClick={handleVerifyAnswer}
                  disabled={!selectedOption}
                  className="w-full sm:w-auto px-8 py-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-thmanyah font-bold text-sm shadow-xl hover:shadow-amber-400/20 transition-all cursor-pointer disabled:opacity-40 gap-2 border border-amber-200/50 mr-auto"
                >
                  <span>اكشف سرّ اللغز 📜</span>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                </Button>
              ) : (
                <Button
                  onClick={handleNextStage}
                  className="w-full sm:w-auto px-8 py-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-thmanyah font-bold text-sm shadow-xl transition-all cursor-pointer gap-2 border border-amber-200/50 mr-auto"
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
