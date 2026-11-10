import { useEffect, useState, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import {
  Archive,
  ArrowRight,
  History,
  MapPin,
  Eye,
  Calendar,
  Clock,
  Search,
  X,
  BookOpen,
  PlusCircle,
  Send,
  Share2,
  User,
  Sparkles,
  Tag,
  HelpCircle,
  Quote
} from 'lucide-react';
import UnifiedHeader from '../components/UnifiedHeader';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription
} from '../components/ui/dialog';
import {
  HERITAGE_CATEGORIES,
  parseHeritageMeta,
  packHeritageMeta
} from '../lib/helpers';
import { useToast } from '../hooks/use-toast';
import {
  GHOSN_AL_BAN_META,
  SUGGESTED_QUESTIONS,
  searchGhosnAlBan,
  type BookSection
} from '../data/ghosnAlBanKnowledge';
import { getAllActiveSections } from '../lib/historyReferencesStore';

interface ActiveAnswer {
  question: string;
  answerText: string;
  section?: BookSection;
}

// Helper component for professional gradient fallback
const ImageWithFallback = ({ src, alt, className }: { src?: string, alt: string, className?: string }) => {
  const [error, setError] = useState(!src);

  if (error || !src) {
    return (
      <div className={`bg-gradient-to-br from-amber-200 via-orange-100 to-emerald-100 flex flex-col items-center justify-center p-6 text-amber-800/40 ${className}`}>
        <History size={60} strokeWidth={1.5} />
        <span className="text-xs font-bold mt-2 opacity-50 uppercase tracking-widest">Sahara Heritage</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
};

export default function Heritage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');

  // Historical Assistant State (Top of /heritage)
  const [assistantQuery, setAssistantQuery] = useState('');
  const [activeSections, setActiveSections] = useState<BookSection[]>([]);
  const [activeAnswer, setActiveAnswer] = useState<ActiveAnswer | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [previewSection, setPreviewSection] = useState<BookSection | null>(null);
  const assistantCardRef = useRef<HTMLDivElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);
  const lastHandledQParam = useRef<string | null>(null);

  // Article Reading Modal State
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Suggest Heritage Item Modal State
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [sugTitle, setSugTitle] = useState('');
  const [sugCategory, setSugCategory] = useState<string>(HERITAGE_CATEGORIES[0]);
  const [sugContributor, setSugContributor] = useState('');
  const [sugContent, setSugContent] = useState('');
  const [sugImageUrl, setSugImageUrl] = useState('');
  const [sugImageFile, setSugImageFile] = useState<File | null>(null);
  const [submittingSug, setSubmittingSug] = useState(false);

  useEffect(() => {
    fetchHeritage();
  }, []);

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

  const fetchHeritage = async () => {
    try {
      const { data, error } = await supabase
        .from('heritage_archive')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Parse metadata and only show approved heritage items publicly
      const enriched = (data || [])
        .map((row: any) => {
          const meta = parseHeritageMeta(row.content, row.title);
          return {
            ...row,
            cleanContent: meta.cleanContent,
            category: meta.category,
            contributor: meta.contributor,
            metaStatus: meta.status
          };
        })
        .filter((row: any) => row.metaStatus === 'approved');

      setItems(enriched);
    } catch (error) {
      console.error('Error fetching heritage:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sugTitle.trim() || !sugContent.trim()) return;
    setSubmittingSug(true);
    try {
      let finalImageUrl = sugImageUrl.trim();
      if (sugImageFile) {
        const ext = sugImageFile.name.split('.').pop();
        const fileName = `heritage/suggestion-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('events').upload(fileName, sugImageFile);
        if (!upErr) {
          const { data: pubData } = supabase.storage.from('events').getPublicUrl(fileName);
          finalImageUrl = pubData.publicUrl;
        }
      }

      const packedContent = packHeritageMeta(sugContent, {
        category: sugCategory,
        contributor: sugContributor.trim() || 'مساهم من المجتمع',
        status: 'pending'
      });

      const { error } = await supabase.from('heritage_archive').insert([{
        title: sugTitle.trim(),
        content: packedContent,
        image_url: finalImageUrl || null
      }]);

      if (error) throw error;

      toast({
        title: 'شكراً لمساهمتك في توثيق تراث وارجلان! 🏺',
        description: 'تم إرسال مقترحك إلى إدارة المنصة للمراجعة والاعتماد قبل نشره في الأرشيف.'
      });
      setSuggestOpen(false);
      setSugTitle('');
      setSugContributor('');
      setSugContent('');
      setSugImageUrl('');
      setSugImageFile(null);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'تعذر إرسال المساهمة',
        description: err.message
      });
    } finally {
      setSubmittingSug(false);
    }
  };

  // Filter logic by search query + category
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesCat = selectedCategory === 'الكل' || item.category === selectedCategory;
      if (!matchesCat) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (item.title || '').toLowerCase().includes(q) ||
        (item.cleanContent || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q) ||
        (item.contributor || '').toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedCategory, items]);

  const shareArticleWhatsApp = (item: any) => {
    const text = `🏺 *${item.title}* (${item.category})\n\n${(item.cleanContent || '').slice(0, 180)}...\n\n📖 اقرأ المزيد في الأرشيف التراثي لوارجلان عبر منصة تواصل صحراء:\n${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#faf9f6]" dir="rtl">
      {/* Dynamic Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/sandpaper.png")' }} />

      {/* Unified Top Navbar */}
      <UnifiedHeader
        rightSlot={
          <Button
            onClick={() => setSuggestOpen(true)}
            size="sm"
            className="bg-gradient-to-r from-[#b87a29] to-[#efa83f] hover:from-[#723c11] hover:to-[#b87a29] text-white rounded-xl h-10 px-3.5 text-xs font-black gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
          >
            <PlusCircle className="w-3.5 h-3.5 shrink-0" />
            <span>اقترح معلماً تراثياً</span>
          </Button>
        }
      />

      {/* Hero Section */}
      <div className="relative h-[370px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/hero-bg.jpg"
            alt="Sahara Heritage"
            className="w-full h-full object-cover brightness-[0.35]"
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&q=80&w=2000";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#301809]/80 via-transparent to-[#faf9f6]" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl -mt-6">
          <div className="inline-flex items-center gap-2 bg-[#efa83f]/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-[#efa83f]/40 text-[#efa83f] mb-4">
            <BookOpen className="w-4 h-4" />
            <span className="text-xs sm:text-sm font-black tracking-wider uppercase">المراجع التاريخية وسجل الذاكرة الجماعية</span>
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white mb-4 drop-shadow-2xl tracking-tight">
            الأرشيف التراثي والباحث التاريخي
          </h1>
          <p className="text-base sm:text-xl text-[#fae1b7] font-medium leading-relaxed drop-shadow-md">
            اسأل المراجع التاريخية الموثقة لوارجلان وسدراتة أو تصفح سجلات ووثائق الأرشيف التراثي.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 -mt-16 relative z-20 pb-20">
        {/* ══════════════════════════════════════════════════════════════════
            1. الباحث التاريخي لوارجلان وسدراتة (مُدمج في أعلى الأرشيف)
        ══════════════════════════════════════════════════════════════════ */}
        <div ref={assistantCardRef} className="max-w-4xl mx-auto mb-14 space-y-5">
          {/* Prominent Search Box Card (Title + Input + Search Button ONLY) */}
          <div className="bg-gradient-to-br from-[#301809] via-[#43230e] to-[#301809] rounded-3xl border-2 border-[#efa83f] shadow-2xl p-6 sm:p-8 space-y-5">
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

          {/* Visually Separated Suggested Questions Section */}
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
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            2. شريط الخريطة التفاعلية للأقمار الصناعية
        ══════════════════════════════════════════════════════════════════ */}
        <div
          onClick={() => navigate('/map')}
          className="cursor-pointer mb-14 rounded-3xl bg-gradient-to-r from-[#301809] via-[#4a2711] to-[#723c11] p-6 md:p-8 border border-[#efa83f]/40 shadow-xl relative overflow-hidden group hover:border-[#efa83f]/80 hover:shadow-glow-amber transition-all duration-300"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#efa83f]/15 via-transparent to-transparent pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2.5 text-right">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#efa83f]/20 border border-[#efa83f]/40 text-[#efa83f] text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#efa83f] animate-ping" />
                <span>خريطة تفاعلية حية • ⵜⴰⵡⵉⵍⴰ ⵏ ⵡⴰⵔⴵⵍⴰⵏ</span>
              </div>
              <h3 className="text-xl md:text-3xl font-bold text-white font-thmanyah leading-snug">
                استكشف المعالم الأثرية والفعاليات الميدانية لـ وارجلان وسدراتة من الفضاء
              </h3>
              <p className="text-sm md:text-base text-[#fae1b7]/80 max-w-2xl leading-relaxed">
                تجوّل عبر صور الأقمار الصناعية العالية الدقة: طالع المحيط التاريخي للقصر العتيق، موقع مسجد لالة عزة الإباضي، والفعاليات الجارية مع التوجيه المباشر عبر Google Maps.
              </p>
            </div>

            <Button
              className="bg-gradient-to-r from-[#efa83f] to-[#b87a29] hover:from-[#f0b24d] hover:to-[#854515] text-[#301809] font-bold px-7 py-6 rounded-2xl text-base shadow-glow-amber group-hover:scale-105 transition-all shrink-0 flex items-center gap-2.5 self-stretch lg:self-auto justify-center"
            >
              <MapPin className="w-5 h-5 text-[#301809]" />
              <span>فتح خريطة المعالم والفعاليات</span>
              <ArrowRight className="w-4 h-4 mr-1 rotate-180" />
            </Button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            3. سجل المقالات والوثائق والصور التراثية (الأرشيف المجتمعي)
        ══════════════════════════════════════════════════════════════════ */}
        <div className="mb-10 space-y-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 max-w-4xl mx-auto">
            <div>
              <h2 className="text-2xl sm:text-3xl font-thmanyah font-bold text-[#301809]">
                سجل المقالات والوثائق التراثية المعتمدة
              </h2>
              <p className="text-xs sm:text-sm text-[#723c11]/80 mt-1">
                تصفح مساهمات الباحثين والجمعيات أو شاركنا بتوثيق معلم أو وثيقة تاريخية جديدة.
              </p>
            </div>
            <Button
              onClick={() => setSuggestOpen(true)}
              className="bg-[#301809] hover:bg-[#723c11] text-[#fae1b7] font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm shadow-md gap-2 cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4 text-[#efa83f]" />
              <span>شارك في إثراء الأرشيف</span>
            </Button>
          </div>

          <div className="relative group max-w-4xl mx-auto">
            <Search className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#b87a29] transition-colors group-focus-within:text-[#efa83f]" />
            <Input
              type="search"
              name="heritage-archive-filter-query"
              autoComplete="off"
              placeholder="فلترة بطاقات الأرشيف التراثي... (مثال: قصور عتيقة، شخصيات، مخطوطات)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/95 backdrop-blur-md shadow-md border-2 border-[#dbc397]/70 focus-visible:ring-[#efa83f] focus-visible:border-[#b87a29] h-14 pr-14 pl-12 rounded-2xl text-sm md:text-base font-bold placeholder:text-[#301809]/45"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-5 top-1/2 -translate-y-1/2 hover:text-red-500 text-gray-400 transition-colors p-1"
                title="مسح البحث"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
            {['الكل', ...HERITAGE_CATEGORIES].map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                    active
                      ? 'bg-[#301809] text-[#efa83f] scale-105 shadow-md'
                      : 'bg-white text-[#723c11] border border-[#dbc397] hover:bg-[#fae1b7]/40'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-600 shadow-xl"></div>
              <History className="absolute inset-0 m-auto h-6 w-6 text-amber-600 animate-pulse" />
            </div>
            <p className="mt-6 text-amber-900 font-black text-xl tracking-tight animate-pulse">جاري استحضار كنوز الذاكرة...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white/50 backdrop-blur-sm rounded-[3rem] p-20 text-center shadow-inner border-2 border-dashed border-amber-200 animate-in fade-in zoom-in duration-500">
            <div className="bg-amber-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
              <Archive className="w-12 h-12 text-amber-400" />
            </div>
            <h3 className="text-3xl font-black text-slate-800 mb-4">{searchQuery || selectedCategory !== 'الكل' ? 'لم يتم العثور على نتائج مطابقة' : 'الأرشيف قيد النمو'}</h3>
            <p className="text-slate-500 max-w-md mx-auto leading-relaxed text-lg font-medium mb-6">
              {searchQuery ? `لم نجد مقالات تطابق "${searchQuery}" في هذا التصنيف.` : 'نعمل حالياً على توثيق المزيد من الكنوز التراثية. شاركونا قصصكم ووثائقكم!'}
            </p>
            <div className="flex justify-center gap-3">
              {(searchQuery || selectedCategory !== 'الكل') && (
                <Button
                  variant="outline"
                  onClick={() => { setSearchQuery(''); setSelectedCategory('الكل'); }}
                  className="rounded-xl font-bold border-[#dbc397]"
                >
                  عرض جميع المواد التراثية
                </Button>
              )}
              <Button
                onClick={() => setSuggestOpen(true)}
                className="bg-[#723c11] text-[#fae1b7] rounded-xl font-bold gap-2"
              >
                <PlusCircle className="w-4 h-4" /> إضافة مساهمة تراثية
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className="group overflow-hidden rounded-[2.5rem] border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-white flex flex-col h-[530px] cursor-pointer ring-1 ring-amber-50"
                onClick={() => {
                  setSelectedItem(item);
                  setIsDialogOpen(true);
                }}
              >
                <div className="h-64 overflow-hidden relative">
                  <ImageWithFallback
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md text-amber-900 px-4 py-1.5 rounded-2xl text-xs font-black shadow-xl border border-amber-100 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    {new Date(item.created_at).toLocaleDateString('ar-DZ')}
                  </div>
                  <div className="absolute top-4 left-4 bg-[#301809]/90 backdrop-blur-md text-[#efa83f] px-3.5 py-1.5 rounded-2xl text-xs font-black shadow-xl border border-[#efa83f]/40">
                    {item.category}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <CardContent className="p-8 flex-1 flex flex-col">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      {item.category || 'تراث وارجلان'}
                    </div>
                    {item.contributor && (
                      <span className="text-[11px] font-bold text-[#723c11] bg-[#fae1b7]/50 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                        <User className="w-3 h-3 text-[#b87a29]" />
                        {item.contributor}
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-black text-slate-800 mb-3 group-hover:text-amber-700 transition-colors line-clamp-2 leading-tight">
                    {item.title}
                  </h3>

                  <p className="text-slate-500 leading-relaxed line-clamp-3 text-base font-medium mb-6">
                    {item.cleanContent}
                  </p>

                  <div className="mt-auto pt-5 border-t border-amber-50 flex items-center justify-between">
                    <div className="flex items-center text-slate-400 font-bold group-hover:text-amber-800 transition-colors">
                      <MapPin className="ml-1.5 h-4 w-4" />
                      <span className="text-xs uppercase">الواحة · ورقلة</span>
                    </div>
                    <Button
                      variant="ghost"
                      className="bg-amber-600 text-white hover:bg-amber-700 hover:text-white rounded-xl font-black px-5 h-10 shadow-lg shadow-amber-600/20 gap-2 shrink-0 group-hover:scale-105 transition-transform"
                    >
                      <span className="text-sm">اقرأ المقال</span>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

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

      {/* Article Details Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-[3rem] border-none bg-white shadow-2xl animate-in zoom-in-95 duration-300">
          {selectedItem && (
            <div className="flex flex-col h-[90vh] md:h-auto max-h-[90vh]">
              {/* Cover Image & Header Overlay */}
              <div className="h-64 md:h-[400px] w-full relative shrink-0">
                <ImageWithFallback
                  src={selectedItem.image_url}
                  alt={selectedItem.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#faf9f6] via-transparent to-black/30" />
                <button
                  onClick={() => setIsDialogOpen(false)}
                  className="absolute top-6 left-6 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors z-30"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="absolute bottom-8 right-8 left-8 text-right z-20" dir="rtl">
                  <div className="flex flex-wrap items-center gap-2.5 mb-4">
                    <div className="flex items-center gap-2 bg-[#301809] text-[#efa83f] px-4 py-1.5 rounded-2xl text-xs font-black shadow-xl">
                      <Tag className="w-3.5 h-3.5" />
                      {selectedItem.category}
                    </div>
                    <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md text-slate-900 px-4 py-1.5 rounded-2xl text-xs font-black shadow-xl">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      {new Date(selectedItem.created_at).toLocaleDateString('ar-DZ')}
                    </div>
                    <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md text-slate-900 px-4 py-1.5 rounded-2xl text-xs font-black shadow-xl">
                      <Clock className="w-4 h-4 text-amber-600" />
                      {new Date(selectedItem.created_at).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {selectedItem.contributor && (
                      <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md text-[#723c11] px-4 py-1.5 rounded-2xl text-xs font-black shadow-xl">
                        <User className="w-3.5 h-3.5 text-[#b87a29]" />
                        <span>توثيق: {selectedItem.contributor}</span>
                      </div>
                    )}
                  </div>
                  <DialogTitle className="text-2xl md:text-5xl font-black text-slate-900 drop-shadow-sm leading-tight">
                    {selectedItem.title}
                  </DialogTitle>
                </div>
              </div>

              {/* Scrollable Content Body */}
              <div className="flex-1 overflow-y-auto p-8 md:p-12 text-right bg-[#faf9f6]" dir="rtl">
                <div className="max-w-3xl mx-auto">
                  <div className="flex items-center gap-3 text-emerald-700 font-black mb-8 bg-emerald-50 inline-flex px-5 py-2.5 rounded-2xl border border-emerald-100 shadow-sm">
                    <History className="w-5 h-5" />
                    <span className="text-base">سلسلة كنوز وارجلان (ورقلة) وحوض سدراتة</span>
                  </div>

                  <div className="text-slate-700 text-lg md:text-2xl leading-[1.9] whitespace-pre-wrap font-medium tracking-tight">
                    {selectedItem.cleanContent}
                  </div>
                </div>
              </div>

              {/* Modal Footer (Action Panel) */}
              <div className="p-6 border-t bg-white flex flex-wrap justify-between items-center gap-3 px-8 shrink-0" dir="rtl">
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={() => shareArticleWhatsApp(selectedItem)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl gap-2 h-11 px-5 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" /> مشاركة عبر واتساب
                  </Button>
                  <Button
                    onClick={() => {
                      const qText = `ماذا ذكر كتاب غصن البان عن ${selectedItem.title}؟`;
                      setIsDialogOpen(false);
                      assistantCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      handleAsk(qText);
                    }}
                    className="bg-[#301809] hover:bg-[#723c11] text-[#fae1b7] font-bold rounded-xl gap-2 h-11 px-5 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-[#efa83f]" /> اسأل الباحث التاريخي عنه
                  </Button>
                </div>
                <Button
                  onClick={() => setIsDialogOpen(false)}
                  className="bg-slate-900 hover:bg-black text-white font-black rounded-xl px-8 h-11 text-sm shadow-xl"
                >
                  إغلاق المقال
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Suggest Heritage Item Modal */}
      <Dialog open={suggestOpen} onOpenChange={setSuggestOpen}>
        <DialogContent className="sm:max-w-[540px] rounded-3xl border-2 border-[#dbc397] font-sans" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-[#301809] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#b87a29]" />
              <span>اقتراح معلم أو وثيقة للأرشيف التراثي</span>
            </DialogTitle>
            <DialogDescription className="text-xs font-bold text-[#723c11]/80">
              ساهم معنا في توثيق المعالم، الشخصيات، المخطوطات، أو العادات الأصيلة في ورقلة وسدراتة. ستتم مراجعة المساهمة من طرف الإدارة ونشرها باسمك.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitSuggestion} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-[#301809] mb-1 block">عنوان المعلم أو المقال التراثي *</label>
              <Input
                required
                value={sugTitle}
                onChange={e => setSugTitle(e.target.value)}
                placeholder="مثال: تاريخ باب عمي وعمران في القصر العتيق"
                className="rounded-xl border-[#dbc397]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#301809] mb-1 block">التصنيف التراثي *</label>
                <select
                  value={sugCategory}
                  onChange={e => setSugCategory(e.target.value)}
                  className="w-full h-10 rounded-xl border border-[#dbc397] bg-white px-3 text-xs font-bold text-[#301809]"
                >
                  {HERITAGE_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-[#301809] mb-1 block">اسم المساهم / الجمعية (اختياري)</label>
                <Input
                  value={sugContributor}
                  onChange={e => setSugContributor(e.target.value)}
                  placeholder="اسمك أو اسم جمعيتك"
                  className="rounded-xl border-[#dbc397]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#301809] mb-1 block">المادة التاريخية / الوصف التفصيلي *</label>
              <Textarea
                required
                value={sugContent}
                onChange={e => setSugContent(e.target.value)}
                placeholder="اكتب المعلومات التاريخية، المصادر، أو الوصف الكامل للمعلم..."
                className="rounded-xl border-[#dbc397] min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#301809] block">صورة توثيقية (رفع من جهازك أو رابط مباشر)</label>
              <Input
                type="file"
                accept="image/*"
                onChange={e => setSugImageFile(e.target.files?.[0] || null)}
                className="rounded-xl border-[#dbc397] text-xs cursor-pointer"
              />
              <Input
                value={sugImageUrl}
                onChange={e => setSugImageUrl(e.target.value)}
                placeholder="أو ضع رابط صورة مباشر https://..."
                dir="ltr"
                className="rounded-xl border-[#dbc397] text-xs"
              />
            </div>

            <Button
              type="submit"
              disabled={submittingSug}
              className="w-full bg-[#723c11] hover:bg-[#301809] text-[#fae1b7] font-black h-12 rounded-xl gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              {submittingSug ? 'جاري إرسال المساهمة...' : 'إرسال المساهمة للمراجعة والاعتماد'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quote Footer Section */}
      <footer className="bg-slate-950 text-white py-28 text-center relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <History className="w-12 h-12 text-amber-500 mx-auto mb-8 opacity-50" />
          <p className="text-3xl md:text-5xl font-serif italic mb-10 opacity-90 leading-tight max-w-4xl mx-auto">
            "من ليس له ماضٍ، ليس له حاضر ولا مستقبل"
          </p>
          <div className="inline-flex flex-col items-center gap-4">
            <div className="w-32 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full shadow-lg shadow-amber-500/50" />
            <p className="text-amber-500 font-black tracking-[0.3em] uppercase text-xs">Sahara Gather Connect</p>
          </div>
        </div>

        {/* Background Decorative Emblems */}
        <Archive className="absolute -bottom-10 -right-10 w-64 h-64 text-white/[0.02] -rotate-12" />
        <History className="absolute -top-10 -left-10 w-64 h-64 text-white/[0.02] rotate-12" />
      </footer>
    </div>
  );
}
