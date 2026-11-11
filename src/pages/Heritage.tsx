import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  ArrowRight,
  MapPin,
  Eye,
  Search,
  X,
  BookOpen,
  Send,
  HelpCircle,
  Quote,
  Share2,
  Copy,
  Check,
  Tag,
  Trophy,
  Sparkles
} from 'lucide-react';
import UnifiedHeader from '../components/UnifiedHeader';
import { HeritageQuest } from '../components/heritage/HeritageQuest';
import {
  GHOSN_AL_BAN_META,
  SUGGESTED_QUESTIONS,
  QUICK_TOPIC_CHIPS,
  searchGhosnAlBan,
  type BookSection
} from '../data/ghosnAlBanKnowledge';
import { getAllActiveSections } from '../lib/historyReferencesStore';
import { toast } from 'sonner';

interface ActiveAnswer {
  question: string;
  answerText: string;
  section?: BookSection;
}

export default function Heritage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Historical Assistant State
  const [assistantQuery, setAssistantQuery] = useState('');
  const [activeSections, setActiveSections] = useState<BookSection[]>([]);
  const [activeAnswer, setActiveAnswer] = useState<ActiveAnswer | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [previewSection, setPreviewSection] = useState<BookSection | null>(null);
  const [copiedAnswer, setCopiedAnswer] = useState(false);
  const [isQuestOpen, setIsQuestOpen] = useState(false);
  const answerRef = useRef<HTMLDivElement>(null);
  const lastHandledQParam = useRef<string | null>(null);

  useEffect(() => {
    if (searchParams.get('quest') === 'open') {
      setIsQuestOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    getAllActiveSections().then((secs) => {
      setActiveSections(secs);
      const qParam = searchParams.get('q')?.trim();
      if (qParam && lastHandledQParam.current !== qParam) {
        lastHandledQParam.current = qParam;
        setAssistantQuery(qParam);
        const grounded = searchGhosnAlBan(qParam, secs);
        setActiveAnswer({
          question: qParam,
          answerText: grounded.synthesizedAnswer,
          section: grounded.matchedSections[0]
        });
        setTimeout(() => {
          answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
      }
    });
  }, [searchParams]);

  const handleAsk = (questionText?: string) => {
    const q = (questionText ?? assistantQuery).trim();
    if (!q) return;

    if (questionText) {
      setAssistantQuery(questionText);
    }

    if (activeAnswer && activeAnswer.question === q) {
      answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsThinking(true);
    setCopiedAnswer(false);

    const grounded = searchGhosnAlBan(q, activeSections);
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

  const buildShareText = (ans: ActiveAnswer) => {
    const sourceLine = ans.section
      ? `📚 المصدر: «${ans.section.bookTitle || GHOSN_AL_BAN_META.title}» — ${ans.section.bookAuthor || GHOSN_AL_BAN_META.author} (${ans.section.pages})`
      : `📚 المصدر: «${GHOSN_AL_BAN_META.title}»`;
    const quoteLine = ans.section?.verbatimQuote
      ? `\n\n📜 نص المؤلف في الكتاب:\n«${ans.section.verbatimQuote}»`
      : '';
    const linkUrl = `${window.location.origin}/heritage?q=${encodeURIComponent(ans.question)}`;
    return `❓ *${ans.question}*\n\n${ans.answerText}${quoteLine}\n\n${sourceLine}\n🔗 طالع المرجع والصفحة المصوّرة عبر منصة تواصل صحراء:\n${linkUrl}`;
  };

  const handleShareWhatsApp = (ans: ActiveAnswer) => {
    const text = buildShareText(ans);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopyAnswer = (ans: ActiveAnswer) => {
    const text = buildShareText(ans);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedAnswer(true);
      toast.success('تم نسخ الإجابة الموثقة مع المصدر ورقم الصفحة!');
      setTimeout(() => setCopiedAnswer(false), 2500);
    });
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col" dir="rtl">
      {/* Dynamic Background Pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-0"
        style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/sandpaper.png")' }}
      />

      {/* Unified Top Navbar */}
      <UnifiedHeader />

      {/* Main Content Container */}
      <main className="flex-1 container mx-auto px-4 md:px-8 py-10 relative z-20 max-w-4xl space-y-6">
        {/* ══════════════════════════════════════════════════════════════════
            1. الباحث التاريخي لوارجلان وسدراتة
        ══════════════════════════════════════════════════════════════════ */}
        <div className="space-y-5">
          {/* Prominent Search Box Card (Title + Input + Search Button ONLY) */}
          <div className="bg-gradient-to-br from-[#301809] via-[#43230e] to-[#301809] rounded-3xl border-2 border-[#efa83f] shadow-2xl p-6 sm:p-9 space-y-6">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#efa83f]/20 border border-[#efa83f]/60 flex items-center justify-center text-[#efa83f] shrink-0 shadow-sm">
                <BookOpen className="w-6 h-6" />
              </div>
              <h1 className="font-thmanyah font-bold text-2xl sm:text-3xl text-white tracking-wide">
                الباحث التاريخي لوارجلان وسدراتة
              </h1>
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
                  type="search"
                  name="historical-reference-question"
                  autoComplete="off"
                  value={assistantQuery}
                  onChange={(e) => setAssistantQuery(e.target.value)}
                  placeholder="اكتب سؤالك هنا... (مثال: متى تأسست سدراتة؟ أو ما هي أبواب قصر وارجلان؟)"
                  className="w-full h-14 rounded-2xl border-2 border-[#fae1b7] bg-white text-[#301809] text-sm sm:text-base font-semibold placeholder:text-[#723c11]/55 focus-visible:ring-2 focus-visible:ring-[#efa83f] pr-12 pl-4 shadow-inner"
                />
              </div>
              <Button
                type="submit"
                disabled={!assistantQuery.trim() || isThinking}
                className="h-14 px-7 rounded-2xl bg-gradient-to-r from-[#efa83f] to-[#b87a29] hover:from-[#f3b557] hover:to-[#c98730] text-[#301809] font-black text-base gap-2 shrink-0 cursor-pointer shadow-lg transition-all"
              >
                <Send className="w-4 h-4" />
                <span>ابحث في المرجع</span>
              </Button>
            </form>
          </div>

          {/* Visually Separated Suggested Questions & Quick Topic Chips */}
          <div className="bg-white rounded-3xl border border-[#dbc397] shadow-sm p-5 sm:p-6 space-y-5">
            {/* Quick Topic Chips */}
            <div>
              <p className="text-xs sm:text-sm font-bold text-[#723c11] mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#b87a29]" />
                <span>أبرز مواضيع وأبواب المرجع (اضغط للاستكشاف السريع):</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_TOPIC_CHIPS.map((chip) => {
                  const isSelected = activeAnswer?.question === chip.question;
                  return (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => handleAsk(chip.question)}
                      className={`text-xs font-bold px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#301809] text-[#efa83f] border-[#301809] shadow-sm'
                          : 'bg-[#fae1b7]/35 hover:bg-[#fae1b7]/80 text-[#301809] border-[#d4b174]'
                      }`}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-[#f0e2c8] pt-4">
              <p className="text-xs sm:text-sm font-bold text-[#723c11] mb-3 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#b87a29]" />
                <span>أسئلة شائعة يمكنك الضغط عليها مباشرة:</span>
              </p>
              <div className="flex flex-wrap gap-2.5">
                {SUGGESTED_QUESTIONS.map((sq) => {
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
          </div>

          {/* Single Active Answer Area (Never Duplicates!) */}
          <div ref={answerRef}>
            {isThinking ? (
              <div className="bg-white border border-[#dbc397] rounded-3xl p-6 flex items-center gap-3 text-sm font-bold text-[#723c11] shadow-sm">
                <div className="w-3 h-3 rounded-full bg-[#efa83f] animate-ping" />
                جاري استخراج الإجابة الموثقة من المرجع...
              </div>
            ) : (
              activeAnswer && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  {/* Question Pill + Close Answer */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="bg-[#301809] text-[#fae1b7] rounded-2xl px-4 py-2.5 text-sm font-bold shadow-sm">
                      سؤالك: {activeAnswer.question}
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveAnswer(null)}
                      className="text-xs font-bold text-[#723c11] hover:text-red-700 bg-white border border-[#dbc397] px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>إغلاق الإجابة</span>
                    </button>
                  </div>

                  {/* Answer Card */}
                  <div className="bg-white border-2 border-[#dbc397] rounded-3xl p-6 sm:p-7 shadow-md space-y-5">
                    {/* Source Attribution + Chapter Title + Page Scan Button */}
                    {activeAnswer.section && (
                      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[#f0e2c8]">
                        <div className="space-y-1">
                          <span className="inline-block text-xs font-bold text-[#723c11] bg-[#fae1b7]/60 px-3 py-1 rounded-lg border border-[#d4b174]">
                            المصدر المعتمد: «{activeAnswer.section.bookTitle || GHOSN_AL_BAN_META.title}» — {activeAnswer.section.bookAuthor || GHOSN_AL_BAN_META.author} ({activeAnswer.section.pages})
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

                    {/* Share & Copy Actions Footer */}
                    <div className="pt-4 border-t border-[#f0e2c8] flex flex-wrap items-center justify-between gap-2.5">
                      <span className="text-xs font-bold text-[#723c11]/80">
                        هل أعجبتك هذه المعلومة الموثقة؟ شاركها مع المهتمين بتراث وارجلان:
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleShareWhatsApp(activeAnswer)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>مشاركة عبر واتساب</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyAnswer(activeAnswer)}
                          className="bg-[#fdfbf7] hover:bg-[#fae1b7]/60 text-[#301809] border border-[#dbc397] text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          {copiedAnswer ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">تم نسخ النص مع المصدر</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-[#b87a29]" />
                              <span>نسخ الإجابة مع المصدر</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            2. شريط إطلاق تحدي الباحث التاريخي (Compact Trigger Banner)
        ══════════════════════════════════════════════════════════════════ */}
        <div 
          className="mt-8 rounded-3xl bg-[#180f07] bg-gradient-to-r from-[#221409] via-[#38210d] to-[#221409] border-2 border-amber-400 p-5 md:p-6 shadow-[0_0_35px_rgba(245,158,11,0.25)] flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ backgroundColor: '#180f07' }}
        >
          <div className="flex items-center gap-3.5 text-right w-full sm:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 border-2 border-amber-300 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.4)] text-[#1a0e05]">
              <Trophy className="w-6 h-6 text-[#1a0e05]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-[#1a0e05] bg-gradient-to-r from-amber-400 to-yellow-400 px-2.5 py-0.5 rounded-full inline-block border border-amber-200">
                  مغامرة تفاعلية
                </span>
                <span className="text-xs text-amber-200/90 font-semibold">5 ألغاز موثقة من أمهات كتب الواحة</span>
              </div>
              <h4 className="text-base md:text-lg font-thmanyah font-bold text-amber-100 mt-1">
                هل أنت مستعد لخوض «تحدي الباحث التاريخي»؟ 🏺
              </h4>
            </div>
          </div>

          <Button
            onClick={() => setIsQuestOpen(true)}
            className="w-full sm:w-auto bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-[#1a0e05] font-black px-6 py-5 rounded-2xl text-xs md:text-sm shadow-[0_4px_20px_rgba(245,158,11,0.4)] cursor-pointer shrink-0 gap-2 border-2 border-amber-200"
          >
            <Sparkles className="w-4 h-4 text-[#1a0e05]" />
            <span>ابدأ التحدي الآن</span>
            <ArrowRight className="w-4 h-4 mr-1 rotate-180 text-[#1a0e05]" />
          </Button>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            3. نافذة التحدي المنبثقة بخلفية داكنة فاخرة (Quest Dark Modal)
        ══════════════════════════════════════════════════════════════════ */}
        {isQuestOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
            onClick={() => setIsQuestOpen(false)}
          >
            <div
              className="w-full max-w-3xl lg:max-w-4xl animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <HeritageQuest
                isModal={true}
                onClose={() => setIsQuestOpen(false)}
                onSearchHint={(hint) => {
                  setIsQuestOpen(false);
                  setAssistantQuery(hint);
                  handleAsk(hint);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            3. شريط الخريطة التفاعلية للأقمار الصناعية
        ══════════════════════════════════════════════════════════════════ */}
        <div
          onClick={() => navigate('/map')}
          className="cursor-pointer mt-8 rounded-3xl bg-gradient-to-r from-[#301809] via-[#4a2711] to-[#723c11] p-6 md:p-8 border border-[#efa83f]/40 shadow-xl relative overflow-hidden group hover:border-[#efa83f]/80 hover:shadow-glow-amber transition-all duration-300"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#efa83f]/15 via-transparent to-transparent pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2.5 text-right">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#efa83f]/20 border border-[#efa83f]/40 text-[#efa83f] text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#efa83f] animate-ping" />
                <span>خريطة تفاعلية حية • ⵜⴰⵡⵉⵍⴰ ⵏ ⵡⴰⵔⴵⵍⴰⵏ</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white font-thmanyah leading-snug">
                استكشف المعالم الأثرية والفعاليات الميدانية لـ وارجلان وسدراتة من الفضاء
              </h3>
              <p className="text-xs sm:text-sm text-[#fae1b7]/80 max-w-2xl leading-relaxed">
                تجوّل عبر صور الأقمار الصناعية العالية الدقة: طالع المحيط التاريخي للقصر العتيق، موقع مسجد لالة عزة الإباضي، والمدن الأثرية.
              </p>
            </div>

            <Button
              className="bg-gradient-to-r from-[#efa83f] to-[#b87a29] hover:from-[#f0b24d] hover:to-[#854515] text-[#301809] font-bold px-6 py-5 rounded-2xl text-sm shadow-glow-amber group-hover:scale-105 transition-all shrink-0 flex items-center gap-2.5 self-stretch lg:self-auto justify-center"
            >
              <MapPin className="w-5 h-5 text-[#301809]" />
              <span>فتح خريطة المعالم</span>
              <ArrowRight className="w-4 h-4 mr-1 rotate-180" />
            </Button>
          </div>
        </div>
      </main>

      {/* Modal: Original Book Page Scan Lightbox */}
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
                  نسخة مصوّرة من «{previewSection.bookTitle || GHOSN_AL_BAN_META.title}» • {previewSection.pages}
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
