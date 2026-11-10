import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Send,
  Quote,
  Eye,
  ArrowRight,
  X,
  RotateCcw,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  GHOSN_AL_BAN_META,
  SUGGESTED_QUESTIONS,
  searchGhosnAlBan,
  type BookSection
} from '@/data/ghosnAlBanKnowledge';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  section?: BookSection;
}

export default function HistoryAssistant() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [previewSection, setPreviewSection] = useState<BookSection | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking]);

  const handleAsk = (questionText?: string) => {
    const q = (questionText ?? query).trim();
    if (!q) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: q
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!questionText) setQuery('');
    setIsThinking(true);

    const grounded = searchGhosnAlBan(q);
    const primarySection = grounded.matchedSections[0];

    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: grounded.synthesizedAnswer,
        section: primarySection
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsThinking(false);
    }, 250);
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
            <div>
              <h1 className="font-thmanyah font-bold text-base sm:text-lg text-white">
                اسأل عن تاريخ وارجلان وسدراتة
              </h1>
              <p className="text-[11px] text-[#fae1b7]/75">
                إجابات تاريخية موثقة من المراجع المعتمدة
              </p>
            </div>
          </div>

          {messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMessages([])}
              className="h-9 rounded-xl border-[#b87a29]/60 bg-[#723c11]/40 text-[#fae1b7] hover:bg-[#b87a29] hover:text-[#301809] text-xs font-bold gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>سؤال جديد</span>
            </Button>
          )}
        </div>
      </header>

      {/* ── Main Centered Content (Single Clean Column) ───────────────── */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Intro & Search Box Card */}
        <div className="bg-white rounded-3xl border border-[#dbc397] shadow-sm p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#fae1b7]/70 border border-[#d4b174] flex items-center justify-center text-[#723c11] shrink-0">
              <BookOpen className="w-6 h-6 text-[#b87a29]" />
            </div>
            <div>
              <h2 className="font-thmanyah font-bold text-xl text-[#301809]">
                الباحث التاريخي لوارجلان وسدراتة
              </h2>
              <p className="text-xs sm:text-sm text-[#723c11] mt-0.5">
                المصدر المعتمد حالياً: كتاب «{GHOSN_AL_BAN_META.title}» — {GHOSN_AL_BAN_META.author}
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
          >
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="اكتب سؤالك هنا... (مثال: متى تأسست سدراتة؟ أو ما هي أبواب قصر وارجلان؟)"
              className="flex-1 h-12 rounded-2xl border-[#dbc397] bg-[#fdfbf7] text-sm font-medium focus-visible:ring-[#b87a29] px-4"
            />
            <Button
              type="submit"
              disabled={!query.trim() || isThinking}
              className="h-12 px-6 rounded-2xl bg-[#301809] hover:bg-[#723c11] text-[#fae1b7] font-bold text-sm gap-2 shrink-0 cursor-pointer shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>ابحث في المرجع</span>
            </Button>
          </form>

          {/* Suggested Questions (Clean wrapped buttons, NO scrollbars) */}
          <div className="pt-2 border-t border-[#f0e2c8]">
            <p className="text-xs font-bold text-[#723c11] mb-3 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-[#b87a29]" />
              أسئلة شائعة يمكنك الضغط عليها مباشرة:
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.slice(0, 6).map((sq) => (
                <button
                  key={sq}
                  type="button"
                  onClick={() => handleAsk(sq)}
                  className="text-right text-xs font-semibold px-3.5 py-2 rounded-xl bg-[#fdfbf7] hover:bg-[#fae1b7]/60 text-[#301809] border border-[#dbc397] transition-colors cursor-pointer"
                >
                  {sq}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Answers Area ──────────────────────────────────────────────── */}
        {messages.length > 0 && (
          <div className="space-y-5">
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.role === 'user' ? (
                  <div className="flex justify-start mb-2">
                    <div className="bg-[#301809] text-[#fae1b7] rounded-2xl px-4 py-2.5 text-sm font-bold shadow-sm">
                      سؤالك: {msg.text}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-[#dbc397] rounded-3xl p-6 shadow-sm space-y-4">
                    {/* Chapter Header & Page Number */}
                    {msg.section && (
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#f0e2c8]">
                        <div>
                          <span className="text-[11px] font-bold text-[#b87a29] block">
                            من كتاب «{GHOSN_AL_BAN_META.title}» • {msg.section.pages}
                          </span>
                          <h3 className="font-thmanyah font-bold text-base text-[#301809] mt-0.5">
                            {msg.section.chapterTitle}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPreviewSection(msg.section!)}
                          className="text-xs font-bold text-[#301809] bg-[#fae1b7]/60 hover:bg-[#301809] hover:text-[#fae1b7] px-3 py-1.5 rounded-xl border border-[#d4b174] flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>معاينة الصفحة الأصلية ({msg.section.pages})</span>
                        </button>
                      </div>
                    )}

                    {/* Answer Body */}
                    <div className="text-sm sm:text-base text-[#301809] leading-relaxed whitespace-pre-line">
                      {msg.text}
                    </div>

                    {/* Verbatim Quote from Book */}
                    {msg.section && (
                      <div className="bg-[#fdfbf7] border-r-4 border-[#b87a29] rounded-2xl p-4 space-y-1.5">
                        <span className="text-xs font-bold text-[#723c11] flex items-center gap-1.5">
                          <Quote className="w-3.5 h-3.5 text-[#b87a29]" />
                          نص المؤلف في الكتاب ({msg.section.pages}):
                        </span>
                        <p className="text-xs sm:text-sm font-thmanyah text-[#301809] leading-loose">
                          «{msg.section.verbatimQuote}»
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {isThinking && (
              <div className="bg-white border border-[#dbc397] rounded-2xl p-4 flex items-center gap-3 text-xs font-bold text-[#723c11]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#efa83f] animate-ping" />
                جاري استخراج الإجابة من المرجع...
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        )}
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
