import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Eye,
  Search,
  X,
  BookOpen,
  Quote,
  Share2,
  Copy,
  Check,
  Trophy,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import UnifiedHeader from '../components/UnifiedHeader';
import { HeritageQuest } from '../components/heritage/HeritageQuest';
import {
  GHOSN_AL_BAN_META,
  SUGGESTED_QUESTIONS,
  QUICK_TOPIC_CHIPS,
  searchGhosnAlBan,
  type BookSection,
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

  const [assistantQuery, setAssistantQuery] = useState('');
  const [activeSections, setActiveSections] = useState<BookSection[]>([]);
  const [activeAnswer, setActiveAnswer] = useState<ActiveAnswer | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [previewSection, setPreviewSection] = useState<BookSection | null>(null);
  const [copiedAnswer, setCopiedAnswer] = useState(false);
  const [isQuestOpen, setIsQuestOpen] = useState(false);
  const [showAllTopics, setShowAllTopics] = useState(false);
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
          section: grounded.matchedSections[0],
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
    setShowAllTopics(false);

    const grounded = searchGhosnAlBan(q, activeSections);
    const primarySection = grounded.matchedSections[0];

    setTimeout(() => {
      setActiveAnswer({
        question: q,
        answerText: grounded.synthesizedAnswer,
        section: primarySection,
      });
      setIsThinking(false);
      setTimeout(() => {
        answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 80);
    }, 180);
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

  const featuredQuestions = SUGGESTED_QUESTIONS.slice(0, 4);

  return (
    <div
      className="min-h-screen bg-[#fdfbf7] bg-[radial-gradient(ellipse_at_top,_rgba(239,168,63,0.14),_transparent_55%)] flex flex-col text-[#301809]"
      dir="rtl"
    >
      <UnifiedHeader />

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-10 sm:py-16 max-w-3xl flex flex-col justify-between">
        {/* ── 1. منطقة البحث الرئيسية بهوية تواصل صحراء الأصيلة ── */}
        <section className="space-y-6">
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#301809] via-[#4a250e] to-[#261206] p-7 sm:p-10 shadow-[0_22px_55px_rgba(48,24,9,0.22)] ring-1 ring-[#efa83f]/35 space-y-6">
            {/* توهّج ذهبي صحراوي خفيف */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(239,168,63,0.22),_transparent_62%)]" />

            <div className="relative z-10 text-center space-y-2.5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#efa83f]/15 border border-[#efa83f]/35 text-[#fae1b7] text-xs font-thmanyah font-bold">
                <BookOpen className="w-3.5 h-3.5 text-[#efa83f]" />
                <span>أرشيف وارجلان وسدراتة الموثق</span>
              </div>
              <h1 className="font-thmanyah font-bold text-3xl sm:text-4xl text-white tracking-tight">
                الباحث{' '}
                <span className="bg-gradient-to-l from-[#fae1b7] to-[#efa83f] bg-clip-text text-transparent">
                  التاريخي
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-[#fae1b7]/80 max-w-lg mx-auto leading-relaxed">
                اسأل عن تاريخ القصر العتيق، سدراتة، أو أعلام الواحة، واحصل على إجابة موثقة بالمصدر ورقم الصفحة.
              </p>
            </div>

            {/* شريط البحث المتوهّج بألوان الهوية */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAsk();
              }}
              className="relative z-10 bg-[#fdfbf7] rounded-2xl p-1.5 sm:p-2 flex items-center gap-2 shadow-[0_14px_35px_rgba(0,0,0,0.3)] ring-2 ring-[#efa83f]/45 focus-within:ring-[#efa83f] transition-all"
            >
              <Search className="w-5 h-5 text-[#b87a29] mr-3 shrink-0" />
              <input
                type="search"
                name="historical-reference-question"
                autoComplete="off"
                value={assistantQuery}
                onChange={(e) => setAssistantQuery(e.target.value)}
                placeholder="اكتب سؤالك... (مثال: متى تأسست سدراتة؟ أو ما هي أبواب القصر؟)"
                className="flex-1 h-11 bg-transparent text-sm sm:text-base text-[#301809] font-medium placeholder:text-[#723c11]/55 focus:outline-none min-w-0"
              />
              {assistantQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setAssistantQuery('');
                    setActiveAnswer(null);
                  }}
                  className="w-8 h-8 rounded-full hover:bg-[#fae1b7]/60 text-[#723c11] flex items-center justify-center shrink-0 cursor-pointer"
                  title="مسح"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                disabled={!assistantQuery.trim() || isThinking}
                className="h-11 px-6 rounded-xl bg-gradient-to-l from-[#b87a29] to-[#efa83f] hover:from-[#a56b20] hover:to-[#f5b44c] disabled:opacity-80 text-[#301809] font-thmanyah font-bold text-sm transition-all shadow-md cursor-pointer shrink-0"
              >
                بحث
              </button>
            </form>
          </div>

          {/* اقتراحات سريعة ومختصرة */}
          {!activeAnswer && !isThinking && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-center gap-2">
                {featuredQuestions.map((sq) => (
                  <button
                    key={sq}
                    type="button"
                    onClick={() => handleAsk(sq)}
                    className="text-xs sm:text-[13px] font-medium px-3.5 py-2 rounded-full bg-white hover:bg-[#fae1b7]/55 text-[#301809] border border-[#dbc397] transition-colors cursor-pointer"
                  >
                    {sq}
                  </button>
                ))}
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowAllTopics((v) => !v)}
                  className="inline-flex items-center gap-1 text-xs font-thmanyah font-bold text-[#723c11] hover:text-[#301809] transition-colors cursor-pointer"
                >
                  <span>{showAllTopics ? 'إخفاء المواضيع الإضافية' : 'استعراض كل مواضيع المرجع'}</span>
                  {showAllTopics ? (
                    <ChevronUp className="w-3.5 h-3.5 text-[#b87a29]" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-[#b87a29]" />
                  )}
                </button>
              </div>

              {showAllTopics && (
                <div className="bg-white rounded-2xl border border-[#dbc397] p-4 flex flex-wrap justify-center gap-2 animate-in fade-in duration-200">
                  {QUICK_TOPIC_CHIPS.map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => handleAsk(chip.question)}
                      className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-[#fae1b7]/45 hover:bg-[#fae1b7] text-[#301809] border border-[#dbc397] transition-colors cursor-pointer"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── 2. بطاقة الإجابة الموثقة ── */}
          <div ref={answerRef}>
            {isThinking ? (
              <div className="bg-white border border-[#dbc397] rounded-3xl p-6 flex items-center justify-center gap-3 text-sm font-thmanyah font-bold text-[#723c11] shadow-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-[#efa83f] animate-ping" />
                <span>جاري البحث في المراجع الموثقة...</span>
              </div>
            ) : (
              activeAnswer && (
                <article className="bg-white border border-[#dbc397] rounded-[28px] p-6 sm:p-8 shadow-[0_14px_45px_rgba(48,24,9,0.08)] space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#fae1b7]">
                    <div className="space-y-1.5">
                      <span className="inline-block text-xs font-bold text-[#723c11] bg-[#fae1b7]/60 px-3 py-1 rounded-full border border-[#dbc397]">
                        {activeAnswer.section
                          ? `«${activeAnswer.section.bookTitle || GHOSN_AL_BAN_META.title}» • ${activeAnswer.section.pages}`
                          : GHOSN_AL_BAN_META.title}
                      </span>
                      <h2 className="font-thmanyah font-bold text-xl sm:text-2xl text-[#301809] leading-snug pt-1">
                        {activeAnswer.section?.chapterTitle || activeAnswer.question}
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveAnswer(null)}
                      className="w-8 h-8 rounded-full bg-[#fae1b7]/50 hover:bg-[#fae1b7] text-[#301809] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                      title="سؤال جديد"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-sm sm:text-base text-[#301809] leading-[1.9] whitespace-pre-line">
                    {activeAnswer.answerText}
                  </div>

                  {activeAnswer.section?.verbatimQuote && (
                    <blockquote className="bg-[#fae1b7]/25 border-r-[3px] border-[#efa83f] rounded-2xl p-4 sm:p-5 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#723c11]">
                        <Quote className="w-3.5 h-3.5 text-[#b87a29]" />
                        <span>نص المؤلف ({activeAnswer.section.pages})</span>
                      </div>
                      <p className="text-xs sm:text-sm font-thmanyah text-[#301809] leading-loose">
                        «{activeAnswer.section.verbatimQuote}»
                      </p>
                    </blockquote>
                  )}

                  <div className="pt-4 border-t border-[#fae1b7] flex flex-wrap items-center justify-between gap-2.5">
                    {activeAnswer.section ? (
                      <button
                        type="button"
                        onClick={() => setPreviewSection(activeAnswer.section!)}
                        className="text-xs font-thmanyah font-bold text-[#fae1b7] bg-[#301809] hover:bg-[#723c11] px-4 py-2 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#efa83f]" />
                        <span>معاينة الصفحة الأصلية</span>
                      </button>
                    ) : (
                      <div />
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyAnswer(activeAnswer)}
                        className="text-xs font-thmanyah font-bold text-[#301809] bg-[#fdfbf7] hover:bg-[#fae1b7]/60 border border-[#dbc397] px-3.5 py-2 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedAnswer ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-[#b87a29]" />
                            <span>نسخ</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleShareWhatsApp(activeAnswer)}
                        className="text-xs font-thmanyah font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>مشاركة</span>
                      </button>
                    </div>
                  </div>
                </article>
              )
            )}
          </div>
        </section>

        {/* ── 3. روابط سريعة هادئة وموحّدة بهوية تواصل صحراء ── */}
        <section className="mt-14 pt-8 border-t border-[#dbc397]/70">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setIsQuestOpen(true)}
              className="group text-right bg-white hover:bg-[#fae1b7]/30 border border-[#dbc397] hover:border-[#b87a29] rounded-2xl p-4 flex items-center justify-between gap-3 transition-all cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#301809] to-[#723c11] text-[#efa83f] flex items-center justify-center shrink-0">
                  <Trophy className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-thmanyah font-bold text-[#301809] truncate">تحدي الباحث</p>
                  <p className="text-[11px] text-[#723c11]/80 truncate">5 ألغاز من المراجع</p>
                </div>
              </div>
              <ArrowLeft className="w-4 h-4 text-[#b87a29] group-hover:-translate-x-0.5 transition-transform shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/manuscripts')}
              className="group text-right bg-white hover:bg-[#fae1b7]/30 border border-[#dbc397] hover:border-[#b87a29] rounded-2xl p-4 flex items-center justify-between gap-3 transition-all cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#301809] to-[#723c11] text-[#efa83f] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-thmanyah font-bold text-[#301809] truncate">محلل المخطوطات</p>
                  <p className="text-[11px] text-[#723c11]/80 truncate">فك الخط المغربي</p>
                </div>
              </div>
              <ArrowLeft className="w-4 h-4 text-[#b87a29] group-hover:-translate-x-0.5 transition-transform shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/map')}
              className="group text-right bg-white hover:bg-[#fae1b7]/30 border border-[#dbc397] hover:border-[#b87a29] rounded-2xl p-4 flex items-center justify-between gap-3 transition-all cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#301809] to-[#723c11] text-[#efa83f] flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-thmanyah font-bold text-[#301809] truncate">خريطة التراث 3D</p>
                  <p className="text-[11px] text-[#723c11]/80 truncate">القصر وسدراتة</p>
                </div>
              </div>
              <ArrowLeft className="w-4 h-4 text-[#b87a29] group-hover:-translate-x-0.5 transition-transform shrink-0" />
            </button>
          </div>
        </section>
      </main>

      {/* نافذة تحدي الباحث التاريخي */}
      {isQuestOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
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

      {/* نافذة معاينة الصفحة المصوّرة من الكتاب */}
      {previewSection && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewSection(null)}
        >
          <div
            className="bg-[#fdfbf7] rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-[#dbc397] shadow-2xl"
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
