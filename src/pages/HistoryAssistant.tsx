import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Send,
  Quote,
  Eye,
  ArrowRight,
  X,
  HelpCircle,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  GHOSN_AL_BAN_META,
  SUGGESTED_QUESTIONS,
  searchGhosnAlBan,
  type BookSection
} from '@/data/ghosnAlBanKnowledge';

interface ActiveAnswer {
  question: string;
  answerText: string;
  section?: BookSection;
}

export default function HistoryAssistant() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeAnswer, setActiveAnswer] = useState<ActiveAnswer | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [previewSection, setPreviewSection] = useState<BookSection | null>(null);
  const answerRef = useRef<HTMLDivElement>(null);

  const handleAsk = (questionText?: string) => {
    const q = (questionText ?? query).trim();
    if (!q) return;

    if (questionText) {
      setQuery(questionText);
    }

    // If the exact same question is already displayed, just scroll to the answer without duplicating
    if (activeAnswer && activeAnswer.question === q) {
      answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    setIsThinking(true);

    const grounded = searchGhosnAlBan(q);
    const primarySection = grounded.matchedSections[0];

    setTimeout(() => {
      setActiveAnswer({
        question: q,
        answerText: grounded.synthesizedAnswer,
        section: primarySection
      });
      setIsThinking(false);
      setTimeout(() => {
        answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 80);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-[#301809] flex flex-col" dir="rtl">
      {/* ── Simple Clean Header ───────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-[#301809] text-[#fae1b7] border-b border-[#723c11] shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-[#fae1b7] transition-colors cursor-pointer"
              title="العودة للرئيسية"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <h1 className="font-thmanyah font-bold text-base sm:text-lg text-white">
              اسأل عن تاريخ وارجلان وسدراتة
            </h1>
          </div>
        </div>
      </header>

      {/* ── Main Centered Content ─────────────────────────────────────── */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 flex flex-col gap-6">
        
        {/* 1. Prominent Search Box Card (Title + Input + Search Button ONLY) */}
        <div className="bg-gradient-to-br from-[#301809] via-[#43230e] to-[#301809] rounded-3xl border-2 border-[#efa83f] shadow-xl p-6 sm:p-9 space-y-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#efa83f]/20 border border-[#efa83f]/60 flex items-center justify-center text-[#efa83f] shrink-0 shadow-sm">
              <BookOpen className="w-6 h-6" />
            </div>
            <h2 className="font-thmanyah font-bold text-2xl sm:text-3xl text-white tracking-wide">
              الباحث التاريخي لوارجلان وسدراتة
            </h2>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
          >
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-[#723c11]/60 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="اكتب سؤالك هنا... (مثال: متى تأسست سدراتة؟ أو ما هي أبواب قصر وارجلان؟)"
                className="w-full h-14 rounded-2xl border-2 border-[#fae1b7] bg-white text-[#301809] text-sm sm:text-base font-semibold placeholder:text-[#723c11]/55 focus-visible:ring-2 focus-visible:ring-[#efa83f] pr-12 pl-4 shadow-inner"
              />
            </div>
            <Button
              type="submit"
              disabled={!query.trim() || isThinking}
              className="h-14 px-7 rounded-2xl bg-gradient-to-r from-[#efa83f] to-[#b87a29] hover:from-[#f3b557] hover:to-[#c98730] text-[#301809] font-black text-base gap-2 shrink-0 cursor-pointer shadow-lg transition-all"
            >
              <Send className="w-4 h-4" />
              <span>ابحث في المرجع</span>
            </Button>
          </form>
        </div>

        {/* 2. Visually Separated Suggested Questions Section */}
        <div className="bg-white rounded-3xl border border-[#dbc397] shadow-sm p-5 sm:p-6">
          <p className="text-xs sm:text-sm font-bold text-[#723c11] mb-3.5 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#b87a29]" />
            <span>أسئلة شائعة يمكنك الضغط عليها مباشرة:</span>
          </p>
          <div className="flex flex-wrap gap-2.5">
            {SUGGESTED_QUESTIONS.slice(0, 6).map((sq) => {
              const isSelected = activeAnswer?.question === sq;
              return (
                <button
                  key={sq}
                  type="button"
                  onClick={() => handleAsk(sq)}
                  className={`text-right text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#301809] text-[#fae1b7] border-[#301809] shadow-sm'
                      : 'bg-[#fdfbf7] hover:bg-[#fae1b7]/60 text-[#301809] border-[#dbc397]'
                  }`}
                >
                  {sq}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Single Active Answer Area (Never Duplicates!) */}
        <div ref={answerRef}>
          {isThinking ? (
            <div className="bg-white border border-[#dbc397] rounded-3xl p-6 flex items-center gap-3 text-sm font-bold text-[#723c11] shadow-sm">
              <div className="w-3 h-3 rounded-full bg-[#efa83f] animate-ping" />
              جاري استخراج الإجابة الموثقة من المرجع...
            </div>
          ) : (
            activeAnswer && (
              <div className="space-y-3">
                {/* Question Pill */}
                <div className="flex justify-start">
                  <div className="bg-[#301809] text-[#fae1b7] rounded-2xl px-4 py-2.5 text-sm font-bold shadow-sm">
                    سؤالك: {activeAnswer.question}
                  </div>
                </div>

                {/* Answer Card */}
                <div className="bg-white border-2 border-[#dbc397] rounded-3xl p-6 sm:p-7 shadow-md space-y-5">
                  {/* Source Attribution + Chapter Title + Page Scan Button */}
                  {activeAnswer.section && (
                    <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[#f0e2c8]">
                      <div className="space-y-1">
                        <span className="inline-block text-xs font-bold text-[#723c11] bg-[#fae1b7]/60 px-3 py-1 rounded-lg border border-[#d4b174]">
                          المصدر المعتمد: كتاب «{GHOSN_AL_BAN_META.title}» — {GHOSN_AL_BAN_META.author} ({activeAnswer.section.pages})
                        </span>
                        <h3 className="font-thmanyah font-bold text-lg text-[#301809] pt-1">
                          {activeAnswer.section.chapterTitle}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPreviewSection(activeAnswer.section!)}
                        className="text-xs font-bold text-[#301809] bg-[#fdfbf7] hover:bg-[#301809] hover:text-[#fae1b7] px-3.5 py-2 rounded-xl border border-[#b87a29] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        <Eye className="w-4 h-4 text-[#b87a29]" />
                        <span>معاينة الصفحة الأصلية ({activeAnswer.section.pages})</span>
                      </button>
                    </div>
                  )}

                  {/* Answer Body */}
                  <div className="text-sm sm:text-base text-[#301809] leading-relaxed whitespace-pre-line">
                    {activeAnswer.answerText}
                  </div>

                  {/* Verbatim Quote from Book */}
                  {activeAnswer.section && (
                    <div className="bg-[#fdfbf7] border-r-4 border-[#b87a29] rounded-2xl p-4 space-y-1.5">
                      <span className="text-xs font-bold text-[#723c11] flex items-center gap-1.5">
                        <Quote className="w-3.5 h-3.5 text-[#b87a29]" />
                        نص المؤلف في الكتاب ({activeAnswer.section.pages}):
                      </span>
                      <p className="text-xs sm:text-sm font-thmanyah text-[#301809] leading-loose">
                        «{activeAnswer.section.verbatimQuote}»
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </main>

      {/* ── Modal: Original Book Page Scan Lightbox ────────────────────── */}
      {previewSection && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewSection(null)}
        >
          <div
            className="bg-[#fdfbf7] rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border-2 border-[#b87a29] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#301809] text-[#fae1b7] px-5 py-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#efa83f] block">
                  نسخة مصوّرة من الكتاب الأصلي • {previewSection.pages}
                </span>
                <h3 className="font-thmanyah font-bold text-sm sm:text-base text-white">
                  {previewSection.chapterTitle}
                </h3>
              </div>
              <button
                onClick={() => setPreviewSection(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center bg-[#1e120a]">
              <img
                src={previewSection.spreadImage}
                alt={previewSection.chapterTitle}
                className="max-w-full h-auto rounded-xl shadow-lg border border-[#723c11]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
