import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Send,
  Sparkles,
  FileText,
  Quote,
  Eye,
  ArrowRight,
  Search,
  Plus,
  X,
  CheckCircle2,
  Compass,
  Library,
  KeyRound,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  GHOSN_AL_BAN_META,
  BOOK_SECTIONS,
  SUGGESTED_QUESTIONS,
  searchGhosnAlBan,
  type BookSection
} from '@/data/ghosnAlBanKnowledge';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  citations?: BookSection[];
  timestamp: string;
}

const EXTRA_REFS_STORAGE_KEY = 'ouarjlane_book_ref_extra_sections_v1';
const GEMINI_KEY_STORAGE = 'ouarjlane_gemini_api_key';

export default function HistoryAssistant() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [chapterFilter, setChapterFilter] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  // Scanned page viewer modal
  const [previewSection, setPreviewSection] = useState<BookSection | null>(null);
  const [showIndexModal, setShowIndexModal] = useState(false);
  const [indexSpreadNum, setIndexSpreadNum] = useState<number>(230);

  // Extra custom references added by user
  const [extraSections, setExtraSections] = useState<BookSection[]>(() => {
    try {
      const raw = localStorage.getItem(EXTRA_REFS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [showAddRefModal, setShowAddRefModal] = useState(false);
  const [newRefTitle, setNewRefTitle] = useState('');
  const [newRefPages, setNewRefPages] = useState('');
  const [newRefContent, setNewRefContent] = useState('');

  // Optional Gemini API Key for enhanced synthesis
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem(GEMINI_KEY_STORAGE) || '';
  });
  const [showKeyModal, setShowKeyModal] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      text: `مرحباً بك في **الباحث التاريخي الذكي لوارجلان وسدراتة** (بأسلوب NotebookLM).\n\nأنا مرتبط مباشرة بكتاب **«${GHOSN_AL_BAN_META.title}»** للشيخ **إبراهيم بن صالح باباحمو أعزام** (تحقيق أ.د. إبراهيم بحاز وأ. سليمان بومعقل) الموجود في مجلد \`Book_Ref\`.\n\nاسألني عن **مدينة سدراتة وتخريبها، أبواب القصر العتيق الثمانية، مسجد لالة عزة ومحرابه، أعراش وارجلان وراياتها، نظام الغطاسة والعيون، القرى العامرة (نقوصة، الشط، اعجاجة...)، أو تراجم العلماء والمشايخ**، وسأجيبك بدقة مع الاقتباس الحرفي ورقم الصفحة وصورة الصفحة الأصلية من الكتاب!`,
      citations: [BOOK_SECTIONS[2], BOOK_SECTIONS[3], BOOK_SECTIONS[12]],
      timestamp: 'الآن'
    }
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const allSections = [...extraSections, ...BOOK_SECTIONS];

  const categories = [
    'الكل',
    'سدراتة والعهود الأولى',
    'القصر العتيق والعمران',
    'المساجد والمحاضر',
    'القرى والأعراش والمياه',
    'العلماء والأعلام',
    'الفتن والعهود السياسية',
    'الزيارات والمخطوطات'
  ];

  const filteredSections = allSections.filter((sec) => {
    const matchesCat = selectedCategory === 'الكل' || sec.category === selectedCategory;
    const matchesSearch =
      !chapterFilter.trim() ||
      sec.chapterTitle.includes(chapterFilter) ||
      sec.summary.includes(chapterFilter) ||
      sec.keywords.some((k) => k.includes(chapterFilter));
    return matchesCat && matchesSearch;
  });

  const handleAsk = async (questionText?: string) => {
    const q = (questionText ?? query).trim();
    if (!q) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!questionText) setQuery('');
    setIsThinking(true);

    // 1. Retrieve grounded sections from Ghosn Al-Ban
    const grounded = searchGhosnAlBan(q, extraSections);

    let finalAnswerText = grounded.synthesizedAnswer;

    // 2. If Gemini API Key is provided, synthesize a natural grounded answer strictly from the retrieved passages
    if (geminiApiKey.trim()) {
      try {
        const contextBlocks = grounded.matchedSections
          .map(
            (s, idx) =>
              `[مرجع ${idx + 1}: ${s.chapterTitle} (${s.pages})]\nالملخص: ${s.summary}\nالنص الحرفي: "${s.verbatimQuote}"\nالتفاصيل:\n${s.details.join('\n')}`
          )
          .join('\n\n---\n\n');

        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
            geminiApiKey.trim()
          )}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `أنت مؤرخ وباحث أكاديمي متخصص في تاريخ وارجلان (ورقلة) وسدراتة، وتعمل مثل NotebookLM.
أجب عن سؤال الزائر بالاعتماد حصرياً على المقتطفات التالية من كتاب "غصن البان في تاريخ وارجلان" للشيخ إبراهيم بن صالح باباحمو أعزام.
اذكر أرقام الصفحات في إجابتك ولا تؤلف أي معلومة من خارج النص المرفق.

المقتطفات الموثقة من الكتاب:
${contextBlocks}

سؤال الزائر:
${q}`
                    }
                  ]
                }
              ]
            })
          }
        );

        if (resp.ok) {
          const data = await resp.json();
          const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            finalAnswerText = candidateText;
          }
        }
      } catch {
        // Fallback silently to built-in grounded synthesis
      }
    }

    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: finalAnswerText,
        citations: grounded.matchedSections,
        timestamp: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsThinking(false);
    }, 380);
  };

  const handleAddExtraReference = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRefTitle.trim() || !newRefContent.trim()) {
      toast.error('يرجى إدخال عنوان المرجع/الفصل والنص الموثق');
      return;
    }
    const newSec: BookSection = {
      id: `custom-${Date.now()}`,
      chapterTitle: newRefTitle.trim(),
      category: 'الزيارات والمخطوطات',
      pages: newRefPages.trim() || 'مرجع إضافي في Book_Ref',
      spreadImage: '/book-ref/spread_1.jpg',
      keywords: newRefTitle.trim().split(/\s+/),
      summary: newRefContent.trim().slice(0, 320),
      verbatimQuote: newRefContent.trim(),
      details: newRefContent
        .trim()
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
    };
    const updated = [newSec, ...extraSections];
    setExtraSections(updated);
    localStorage.setItem(EXTRA_REFS_STORAGE_KEY, JSON.stringify(updated));
    setNewRefTitle('');
    setNewRefPages('');
    setNewRefContent('');
    setShowAddRefModal(false);
    toast.success('تمت إضافة المرجع إلى قاعدة معرفة الباحث التاريخي بنجاح!');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setNewRefTitle(file.name.replace(/\.[^.]+$/, ''));
      setNewRefPages(`ملف مرفوع: ${file.name}`);
      setNewRefContent(text.slice(0, 6000));
      toast.info('تم استيراد النص من الملف، اضغط حفظ لإضافته للمصادر.');
    } catch {
      toast.error('تعذر قراءة الملف النصي');
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-[#301809] flex flex-col" dir="rtl">
      {/* ── Top Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#301809] text-[#fae1b7] border-b border-[#723c11] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="text-[#fae1b7] hover:bg-[#4a2510] rounded-xl h-9 w-9 cursor-pointer"
              title="العودة للرئيسية"
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#efa83f] to-[#b87a29] flex items-center justify-center text-[#301809] shadow-md">
              <Library className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-thmanyah font-bold text-base sm:text-lg text-white">
                  الباحث التاريخي الذكي — وارجلان وسدراتة
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold bg-[#efa83f]/20 text-[#efa83f] border border-[#efa83f]/40 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3" />
                  NotebookLM المراجع
                </span>
              </div>
              <p className="text-[11px] text-[#fae1b7]/75 truncate max-w-[260px] sm:max-w-none">
                إجابات موثّقة بالأدلة وأرقام الصفحات من مرجع «غصن البان في تاريخ وارجلان» (Book_Ref)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowIndexModal(true)}
              className="hidden md:inline-flex bg-[#4a2510] border-[#b87a29]/50 text-[#fae1b7] hover:bg-[#723c11] text-xs rounded-xl gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#efa83f]" />
              فهرس الكتاب الأصلي
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/map')}
              className="bg-[#4a2510] border-[#b87a29]/50 text-[#fae1b7] hover:bg-[#723c11] text-xs rounded-xl gap-1.5 cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-[#efa83f]" />
              <span className="hidden sm:inline">خريطة التراث</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowKeyModal(true)}
              className="bg-[#4a2510] border-[#b87a29]/50 text-[#fae1b7] hover:bg-[#723c11] text-xs rounded-xl gap-1 cursor-pointer"
              title="إعداد مفتاح Gemini API (اختياري)"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#efa83f]" />
              <span className="hidden lg:inline">Gemini AI</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main Two-Column NotebookLM Layout ──────────────────────── */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* RIGHT COLUMN: Book_Ref Sources & Chapters (4 cols on desktop) */}
        <aside className="lg:col-span-4 space-y-4">
          {/* Primary Book Card */}
          <div className="bg-white rounded-3xl border-2 border-[#dbc397] p-4 shadow-sm">
            <div className="flex items-start gap-3.5">
              <img
                src={GHOSN_AL_BAN_META.coverImage}
                alt={GHOSN_AL_BAN_META.title}
                onClick={() =>
                  setPreviewSection({
                    id: 'cover',
                    chapterTitle: GHOSN_AL_BAN_META.title,
                    category: 'الزيارات والمخطوطات',
                    pages: 'الغلاف الأصلي',
                    spreadImage: GHOSN_AL_BAN_META.coverImage,
                    keywords: [],
                    summary: GHOSN_AL_BAN_META.description,
                    verbatimQuote: `${GHOSN_AL_BAN_META.author} — ${GHOSN_AL_BAN_META.editors}`,
                    details: []
                  })
                }
                className="w-20 h-28 object-cover rounded-xl border border-[#dbc397] shadow cursor-pointer hover:scale-105 transition-transform shrink-0"
              />
              <div className="space-y-1 min-w-0 flex-1">
                <div className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  مرجع نشط من Book_Ref
                </div>
                <h2 className="font-thmanyah font-bold text-base text-[#301809] leading-snug">
                  {GHOSN_AL_BAN_META.title}
                </h2>
                <p className="text-[11px] text-[#723c11] font-medium leading-relaxed">
                  {GHOSN_AL_BAN_META.author}
                </p>
                <p className="text-[10px] text-[#84939c] leading-relaxed">
                  {GHOSN_AL_BAN_META.editors}
                </p>
                <div className="pt-1 flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setShowIndexModal(true)}
                    className="text-[11px] font-bold text-[#b87a29] hover:text-[#301809] underline cursor-pointer"
                  >
                    تصفح فهرس صفحات الكتاب (467 ص)
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-[#dbc397]/50 flex items-center justify-between gap-2">
              <span className="text-[11px] text-[#723c11] font-bold">
                الأبواب المفهرسة: {allSections.length} باباً تاريخياً
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddRefModal(true)}
                className="h-8 text-xs rounded-xl border-[#dbc397] text-[#723c11] hover:bg-[#fae1b7]/40 gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                إضافة مرجع/نص
              </Button>
            </div>
          </div>

          {/* Chapters Explorer Card */}
          <div className="bg-white rounded-3xl border border-[#dbc397] p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-thmanyah font-bold text-sm text-[#301809] flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#b87a29]" />
                أبواب وفصول المرجع (اضغط للسؤال أو المعاينة)
              </h3>
            </div>

            {/* Search inside chapters */}
            <div className="relative">
              <Input
                value={chapterFilter}
                onChange={(e) => setChapterFilter(e.target.value)}
                placeholder="ابحث في فصول الكتاب (مثال: سدراتة، لالة عزة، نقوصة)..."
                className="h-9 pr-8 text-xs rounded-xl border-[#dbc397]"
              />
              <Search className="w-3.5 h-3.5 text-[#b87a29] absolute right-2.5 top-2.5" />
            </div>

            {/* Category Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#301809] text-[#fae1b7] shadow-sm'
                      : 'bg-[#fdfbf7] text-[#723c11] border border-[#dbc397] hover:bg-[#fae1b7]/40'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Chapters List */}
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {filteredSections.map((sec) => (
                <div
                  key={sec.id}
                  className="p-3 rounded-2xl border border-[#dbc397]/60 bg-[#fdfbf7] hover:border-[#b87a29] hover:bg-[#fae1b7]/20 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => handleAsk(`حدثني بالتفصيل عن: ${sec.chapterTitle}`)}
                      className="text-right flex-1 cursor-pointer"
                    >
                      <span className="inline-block text-[10px] font-bold text-[#b87a29] bg-[#fae1b7]/60 px-2 py-0.5 rounded-md mb-1">
                        {sec.pages}
                      </span>
                      <h4 className="text-xs font-bold text-[#301809] group-hover:text-[#b87a29] leading-snug">
                        {sec.chapterTitle}
                      </h4>
                    </button>
                    <button
                      onClick={() => setPreviewSection(sec)}
                      className="p-1.5 rounded-lg bg-white border border-[#dbc397] text-[#723c11] hover:bg-[#301809] hover:text-[#fae1b7] transition-colors shrink-0 cursor-pointer"
                      title="معاينة صفحة الكتاب الممسوحة ضوئياً"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-[#723c11]/80 line-clamp-2 mt-1 leading-relaxed">
                    {sec.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* LEFT COLUMN: Interactive Q&A Chat Studio (8 cols on desktop) */}
        <main className="lg:col-span-8 flex flex-col bg-white rounded-3xl border-2 border-[#dbc397] shadow-sm overflow-hidden min-h-[680px]">
          {/* Studio Top Bar */}
          <div className="px-5 py-3.5 bg-gradient-to-l from-[#fdfbf7] to-[#fae1b7]/30 border-b border-[#dbc397] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#b87a29]" />
              <span className="font-thmanyah font-bold text-sm text-[#301809]">
                حوار مع المرجع التاريخي (مرتبط حصرياً بكتاب غصن البان)
              </span>
            </div>
            <button
              onClick={() => setMessages([messages[0]])}
              className="text-xs text-[#723c11] hover:text-[#301809] flex items-center gap-1 font-bold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              محادثة جديدة
            </button>
          </div>

          {/* Suggested Questions Strip */}
          <div className="px-4 py-3 bg-[#fdfbf7] border-b border-[#dbc397]/60">
            <p className="text-[11px] font-bold text-[#723c11] mb-2">
              أسئلة مقترحة من فصول الكتاب (اضغط على أي سؤال لتجربته فوراً):
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {SUGGESTED_QUESTIONS.map((sq, i) => (
                <button
                  key={i}
                  onClick={() => handleAsk(sq)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#dbc397] hover:border-[#b87a29] hover:bg-[#fae1b7]/30 text-xs font-bold text-[#301809] whitespace-nowrap transition-all shadow-2xs cursor-pointer"
                >
                  {sq}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[540px]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-start' : 'items-stretch'}`}
              >
                {msg.role === 'user' ? (
                  <div className="max-w-[85%] bg-[#301809] text-[#fae1b7] px-4 py-3 rounded-2xl rounded-tr-none shadow-md">
                    <p className="text-sm font-bold leading-relaxed">{msg.text}</p>
                    <span className="text-[10px] text-[#fae1b7]/60 mt-1 block">{msg.timestamp}</span>
                  </div>
                ) : (
                  <div className="bg-[#fdfbf7] border-2 border-[#dbc397] rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-[#dbc397]/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#301809] text-[#efa83f] flex items-center justify-center">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <span className="font-thmanyah font-bold text-sm text-[#301809]">
                          إجابة موثّقة من «غصن البان في تاريخ وارجلان»
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-[#b87a29] bg-[#fae1b7]/50 px-2.5 py-0.5 rounded-full">
                        {msg.timestamp}
                      </span>
                    </div>

                    {/* Main Answer Text */}
                    <div className="text-sm text-[#301809] leading-relaxed whitespace-pre-line space-y-2">
                      {msg.text}
                    </div>

                    {/* Verbatim Quote Box from Primary Citation */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="bg-[#fae1b7]/35 border-r-4 border-[#b87a29] rounded-2xl p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-[#723c11] flex items-center gap-1.5">
                            <Quote className="w-4 h-4 text-[#b87a29]" />
                            نص صريح من الكتاب ({msg.citations[0].pages}):
                          </span>
                          <button
                            onClick={() => setPreviewSection(msg.citations![0])}
                            className="text-[11px] font-bold text-[#301809] bg-white hover:bg-[#301809] hover:text-[#fae1b7] px-2.5 py-1 rounded-lg border border-[#dbc397] flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            رؤية الصفحة المصوّرة
                          </button>
                        </div>
                        <p className="text-xs sm:text-sm font-thmanyah text-[#301809] leading-loose italic">
                          «{msg.citations[0].verbatimQuote}»
                        </p>
                      </div>
                    )}

                    {/* Source Citation Cards */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="pt-2">
                        <p className="text-[11px] font-bold text-[#723c11] mb-2 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-[#b87a29]" />
                          المصادر والصفحات المعتمدة في هذه الإجابة (اضغط لمعاينة الصفحة الأصلية):
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {msg.citations.map((cit) => (
                            <div
                              key={cit.id}
                              onClick={() => setPreviewSection(cit)}
                              className="flex items-center gap-3 p-2.5 rounded-2xl bg-white border border-[#dbc397] hover:border-[#b87a29] hover:shadow-md transition-all cursor-pointer group"
                            >
                              <img
                                src={cit.spreadImage}
                                alt={cit.chapterTitle}
                                className="w-12 h-14 object-cover rounded-lg border border-[#dbc397] shrink-0 group-hover:scale-105 transition-transform"
                              />
                              <div className="min-w-0 flex-1">
                                <span className="text-[10px] font-black text-[#b87a29] block">
                                  غصن البان • {cit.pages}
                                </span>
                                <h5 className="text-xs font-bold text-[#301809] truncate group-hover:text-[#b87a29]">
                                  {cit.chapterTitle}
                                </h5>
                                <span className="text-[10px] text-[#723c11] underline flex items-center gap-1 mt-0.5">
                                  <Eye className="w-3 h-3" />
                                  فتح صورة الصفحة من الكتاب
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {isThinking && (
              <div className="bg-[#fdfbf7] border border-[#dbc397] rounded-2xl p-4 flex items-center gap-3 text-xs font-bold text-[#723c11]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#efa83f] animate-ping" />
                جاري البحث في فصول وصفحات كتاب «غصن البان في تاريخ وارجلان»...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            className="p-4 bg-[#fdfbf7] border-t border-[#dbc397] flex items-center gap-2.5"
          >
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="اسأل أي سؤال عن تاريخ وارجلان، سدراتة، المساجد، الأعراش، العيون، أو العلماء..."
              className="flex-1 h-12 rounded-2xl border-2 border-[#dbc397] bg-white px-4 text-sm focus-visible:ring-[#b87a29]"
            />
            <Button
              type="submit"
              disabled={isThinking || !query.trim()}
              className="h-12 px-6 rounded-2xl bg-[#301809] hover:bg-[#723c11] text-[#fae1b7] font-bold gap-2 cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>اسأل المرجع</span>
            </Button>
          </form>
        </main>
      </div>

      {/* ── Modal 1: Scanned Book Page Lightbox ────────────────────── */}
      {previewSection && (
        <div
          onClick={() => setPreviewSection(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#fdfbf7] border-2 border-[#dbc397] rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="px-5 py-3.5 bg-[#301809] text-[#fae1b7] flex items-center justify-between">
              <div>
                <span className="text-[11px] text-[#efa83f] font-bold block">
                  غصن البان في تاريخ وارجلان — {previewSection.pages}
                </span>
                <h3 className="font-thmanyah font-bold text-sm sm:text-base text-white">
                  {previewSection.chapterTitle}
                </h3>
              </div>
              <button
                onClick={() => setPreviewSection(null)}
                className="p-1.5 rounded-xl bg-[#4a2510] text-[#fae1b7] hover:bg-red-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="bg-white p-3 rounded-2xl border border-[#dbc397] shadow-inner">
                <img
                  src={previewSection.spreadImage}
                  alt={previewSection.chapterTitle}
                  className="w-full h-auto rounded-xl mx-auto"
                />
              </div>

              <div className="bg-[#fae1b7]/35 border-r-4 border-[#b87a29] p-4 rounded-2xl space-y-2">
                <h4 className="text-xs font-black text-[#723c11]">النص المستخرج من هذه الصفحة:</h4>
                <p className="text-sm font-thmanyah text-[#301809] leading-loose">
                  «{previewSection.verbatimQuote}»
                </p>
                {previewSection.details.length > 0 && (
                  <ul className="text-xs text-[#301809] space-y-1 pt-2 border-t border-[#dbc397]">
                    {previewSection.details.map((d, i) => (
                      <li key={i}>• {d}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 2: Original Book Table of Contents Viewer ─────────── */}
      {showIndexModal && (
        <div
          onClick={() => setShowIndexModal(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#fdfbf7] border-2 border-[#dbc397] rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="px-5 py-3.5 bg-[#301809] text-[#fae1b7] flex items-center justify-between">
              <h3 className="font-thmanyah font-bold text-base">
                فهرس المحتويات الأصلي لكتاب «غصن البان في تاريخ وارجلان» (ص 455 – 467)
              </h3>
              <button
                onClick={() => setShowIndexModal(false)}
                className="p-1.5 rounded-xl bg-[#4a2510] text-[#fae1b7] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 py-2.5 bg-[#fae1b7]/40 border-b border-[#dbc397] flex items-center justify-center gap-2 flex-wrap">
              {[230, 231, 232, 233, 234, 235, 236].map((sp, idx) => (
                <button
                  key={sp}
                  onClick={() => setIndexSpreadNum(sp)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer ${
                    indexSpreadNum === sp
                      ? 'bg-[#301809] text-[#fae1b7]'
                      : 'bg-white text-[#723c11] border border-[#dbc397]'
                  }`}
                >
                  صفحة الفهرس {idx + 1}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-white">
              <img
                src={`/book-ref/spread_${indexSpreadNum}.jpg`}
                alt={`فهرس الكتاب ${indexSpreadNum}`}
                className="w-full h-auto rounded-xl border border-[#dbc397]"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 3: Add Extra Reference / Text ─────────────────────── */}
      {showAddRefModal && (
        <div
          onClick={() => setShowAddRefModal(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#fdfbf7] border-2 border-[#dbc397] rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-thmanyah font-bold text-lg text-[#301809]">
                إضافة وثيقة أو فصل مرجعي جديد
              </h3>
              <button onClick={() => setShowAddRefModal(false)} className="text-[#723c11] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-[#723c11]">
              يمكنك لصق نص تاريخي من أي كتاب جديد أو رفع ملف نصي (`.txt` / `.md`) ليعتمد عليه الباحث الذكي في الإجابة عن أسئلة الزوار.
            </p>
            <form onSubmit={handleAddExtraReference} className="space-y-3">
              <div>
                <label className="text-xs font-bold block mb-1">استيراد ملف نصي (اختياري):</label>
                <input
                  type="file"
                  accept=".txt,.md"
                  onChange={handleFileUpload}
                  className="text-xs w-full file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[#301809] file:text-[#fae1b7] file:font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1">عنوان الكتاب أو الفصل *</label>
                <Input
                  value={newRefTitle}
                  onChange={(e) => setNewRefTitle(e.target.value)}
                  placeholder="مثال: وثيقة أحباس القصر العتيق..."
                  required
                  className="rounded-xl border-[#dbc397] bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1">رقم الصفحة / المصدر</label>
                <Input
                  value={newRefPages}
                  onChange={(e) => setNewRefPages(e.target.value)}
                  placeholder="مثال: مرجع Book_Ref - ص 12"
                  className="rounded-xl border-[#dbc397] bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1">النص التاريخي الموثّق *</label>
                <textarea
                  value={newRefContent}
                  onChange={(e) => setNewRefContent(e.target.value)}
                  rows={5}
                  required
                  placeholder="الصق فقرات المرجع هنا..."
                  className="w-full rounded-xl border border-[#dbc397] bg-white p-3 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddRefModal(false)}
                  className="rounded-xl"
                >
                  إلغاء
                </Button>
                <Button type="submit" className="bg-[#301809] text-[#fae1b7] rounded-xl">
                  حفظ في قاعدة المعرفة
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 4: Optional Gemini API Key ────────────────────────── */}
      {showKeyModal && (
        <div
          onClick={() => setShowKeyModal(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#fdfbf7] border-2 border-[#dbc397] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-thmanyah font-bold text-lg text-[#301809]">
                ربط محرك Google Gemini AI (اختياري)
              </h3>
              <button onClick={() => setShowKeyModal(false)} className="text-[#723c11] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-[#723c11] leading-relaxed">
              يعمل الباحث التاريخي تلقائياً **بدون أي مفتاح** بالاعتماد على الفهرسة المباشرة لكتاب «غصن البان». وإذا رغبت في صياغة لغوية توليدية إضافية عبر Gemini 2.5 Flash، يمكنك وضع مفتاح Gemini API المجاني هنا:
            </p>
            <Input
              type="password"
              dir="ltr"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="rounded-xl border-[#dbc397] bg-white font-mono text-xs"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setGeminiApiKey('');
                  localStorage.removeItem(GEMINI_KEY_STORAGE);
                  toast.info('تمت العودة للمحرك المحلي المباشر');
                  setShowKeyModal(false);
                }}
                className="rounded-xl text-xs"
              >
                استخدام المحرك المحلي فقط
              </Button>
              <Button
                onClick={() => {
                  localStorage.setItem(GEMINI_KEY_STORAGE, geminiApiKey.trim());
                  toast.success('تم حفظ مفتاح Gemini API بنجاح');
                  setShowKeyModal(false);
                }}
                className="bg-[#301809] text-[#fae1b7] rounded-xl text-xs"
              >
                حفظ وتفعيل
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
