import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import UnifiedHeader from '@/components/UnifiedHeader';
import {
  SAMPLE_MANUSCRIPTS,
  type SampleManuscript,
} from '@/data/sampleManuscriptsData';
import {
  processManuscriptImage,
  type ManuscriptAnalysisResult,
} from '@/lib/manuscriptAIEngine';
import {
  BookOpen,
  Upload,
  Copy,
  Check,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  HelpCircle,
  Loader2,
  ArrowLeft,
  SlidersHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';

type AnalysisTab = 'text' | 'abbreviations' | 'references';

export default function ManuscriptReaderPage() {
  const navigate = useNavigate();
  const [selectedSample, setSelectedSample] = useState<SampleManuscript>(SAMPLE_MANUSCRIPTS[0]);
  const [activeTab, setActiveTab] = useState<AnalysisTab>('text');

  // رفع الصورة والفحص بالذكاء الاصطناعي
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [progressLabel, setProgressLabel] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<ManuscriptAnalysisResult | null>(null);

  // إعدادات عدسة الفحص
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [imageFilter, setImageFilter] = useState<'normal' | 'high_contrast' | 'grayscale' | 'invert'>('normal');

  const [copied, setCopied] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectSample = (sample: SampleManuscript) => {
    setSelectedSample(sample);
    setUploadedImage(null);
    setAnalysisResult(null);
    setZoomLevel(1);
    setRotation(0);
    setImageFilter('normal');
    setActiveTab('text');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setUploadedImage(dataUrl);
      setIsProcessing(true);
      setProgress(10);
      setProgressLabel('جاري قراءة المخطوطة...');
      setZoomLevel(1);
      setRotation(0);
      setImageFilter('normal');

      try {
        const res = await processManuscriptImage(dataUrl, (p, label) => {
          setProgress(p);
          setProgressLabel(label);
        });
        setAnalysisResult(res);
        setActiveTab('text');
        toast.success('تم فحص وتحقيق المخطوطة بنجاح!');
      } catch (err) {
        console.error(err);
        toast.error('تعذر معالجة المخطوطة، يرجى التأكد من وضوح الصورة');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const currentDisplayImage = uploadedImage || selectedSample.imageUrl;

  const currentTextToDisplay = analysisResult
    ? analysisResult.cleanedText
    : selectedSample.transcriptionNormalized;

  const currentAbbreviations = analysisResult
    ? analysisResult.abbreviationsDetected
    : selectedSample.abbreviationsFound.map((a) => ({
        term: a.term,
        expansion: a.expansion,
        meaning: a.explanation,
      }));

  const currentReferences = analysisResult
    ? analysisResult.matchedBooks
    : selectedSample.matchedBookReferences.map((r) => ({
        bookTitle: r.bookTitle,
        chapterTitle: r.author,
        pages: r.pages,
        summary: r.quote,
      }));

  const handleCopy = () => {
    navigator.clipboard.writeText(currentTextToDisplay);
    setCopied(true);
    toast.success('تم نسخ النص المحقق بنجاح');
    setTimeout(() => setCopied(false), 2500);
  };

  const getImageFilterStyle = () => {
    switch (imageFilter) {
      case 'high_contrast':
        return 'contrast(180%) brightness(110%) saturate(80%)';
      case 'grayscale':
        return 'grayscale(100%) contrast(150%)';
      case 'invert':
        return 'invert(100%) contrast(140%)';
      default:
        return 'none';
    }
  };

  const filterLabel =
    imageFilter === 'normal'
      ? 'عادي'
      : imageFilter === 'high_contrast'
      ? 'تباين عالي'
      : imageFilter === 'grayscale'
      ? 'أبيض وأسود'
      : 'معكوس';

  return (
    <div
      className="min-h-screen flex flex-col bg-[#fdfbf7] bg-[radial-gradient(ellipse_at_top,_rgba(239,168,63,0.12),_transparent_55%)] text-[#301809]"
      dir="rtl"
    >
      <UnifiedHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-7 sm:py-10 space-y-6">
        {/* ── 1. الرأس المدمج بهوية تواصل صحراء ── */}
        <section className="rounded-[28px] bg-gradient-to-l from-[#301809] via-[#4a250e] to-[#2b1507] p-6 sm:p-7 shadow-[0_18px_45px_rgba(48,24,9,0.18)] ring-1 ring-[#efa83f]/30 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(239,168,63,0.18),_transparent_55%)]" />

          <div className="relative z-10 space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-thmanyah font-bold text-white">
              محلل ومفسر{' '}
              <span className="bg-gradient-to-l from-[#fae1b7] to-[#efa83f] bg-clip-text text-transparent">
                المخطوطات
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-[#fae1b7]/80 max-w-xl">
              فك الخط المغربي الصحراوي، شرح الاختصارات الفقهية، والمطابقة الفورية مع مراجع وارجلان وسدراتة.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-3 rounded-xl bg-gradient-to-l from-[#b87a29] to-[#efa83f] hover:from-[#a56b20] hover:to-[#f5b44c] text-[#301809] font-thmanyah font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>رفع وثيقة للفحص</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </section>

        {/* ── 2. شريط النماذج التراثية النظيف (بدون شريط تمرير مزعج) ── */}
        <section className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-thmanyah font-bold text-[#723c11] ml-1">
            نماذج محققة:
          </span>
          {SAMPLE_MANUSCRIPTS.map((ms) => {
            const isSelected = !uploadedImage && selectedSample.id === ms.id;
            return (
              <button
                key={ms.id}
                type="button"
                onClick={() => handleSelectSample(ms)}
                className={`px-3.5 py-2 rounded-full text-xs font-thmanyah font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#301809] text-[#fae1b7] shadow-sm'
                    : 'bg-white hover:bg-[#fae1b7]/55 text-[#301809] border border-[#dbc397]'
                }`}
              >
                <FileText className={`w-3.5 h-3.5 ${isSelected ? 'text-[#efa83f]' : 'text-[#b87a29]'}`} />
                <span className="truncate max-w-[220px] sm:max-w-xs">{ms.titleAr}</span>
              </button>
            );
          })}
        </section>

        {/* شريط تقدم الفحص عند رفع صورة */}
        {isProcessing && (
          <div className="p-4 rounded-2xl bg-white border border-[#dbc397] shadow-sm flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-[#b87a29] animate-spin shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="flex justify-between text-xs font-thmanyah font-bold text-[#301809]">
                <span>{progressLabel}</span>
                <span className="text-[#b87a29]">{progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-[#fae1b7]/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-l from-[#b87a29] to-[#efa83f] transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── 3. مساحة العمل المزدوجة (المخطوطة يميناً + التحقيق المبوّب يساراً) ── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* العمود الأيمن: عارض المخطوطة */}
          <div className="lg:col-span-5 bg-white rounded-[24px] border border-[#dbc397] shadow-[0_10px_30px_rgba(48,24,9,0.06)] overflow-hidden flex flex-col">
            {/* أدوات العدسة */}
            <div className="px-4 py-3 border-b border-[#f0e4cd] bg-[#fdfbf7] flex items-center justify-between gap-2">
              <span className="text-xs font-thmanyah font-bold text-[#301809]">
                عدسة الفحص البصري
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                  className="p-1.5 rounded-lg hover:bg-[#fae1b7]/60 text-[#723c11] cursor-pointer"
                  title="تكبير"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
                  className="p-1.5 rounded-lg hover:bg-[#fae1b7]/60 text-[#723c11] cursor-pointer"
                  title="تصغير"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1.5 rounded-lg hover:bg-[#fae1b7]/60 text-[#723c11] cursor-pointer"
                  title="تدوير"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setImageFilter((f) =>
                      f === 'normal'
                        ? 'high_contrast'
                        : f === 'high_contrast'
                        ? 'grayscale'
                        : f === 'grayscale'
                        ? 'invert'
                        : 'normal'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-[#fae1b7]/60 hover:bg-[#fae1b7] text-[#301809] text-[11px] font-thmanyah font-bold flex items-center gap-1 cursor-pointer"
                  title="فلتر وضوح الحبر"
                >
                  <SlidersHorizontal className="w-3 h-3 text-[#b87a29]" />
                  <span>{filterLabel}</span>
                </button>
              </div>
            </div>

            {/* عرض الوثيقة */}
            <div className="bg-[#231208] p-4 min-h-[340px] max-h-[460px] overflow-auto flex items-center justify-center">
              <img
                src={currentDisplayImage}
                alt={uploadedImage ? 'وثيقة مرفوعة' : selectedSample.titleAr}
                className="max-w-full max-h-[400px] object-contain rounded-xl shadow-lg transition-transform duration-200 select-none"
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  filter: getImageFilterStyle(),
                }}
              />
            </div>

            {/* تذييل بيانات الوثيقة */}
            <div className="px-4 py-3 border-t border-[#f0e4cd] bg-[#fdfbf7] flex items-center justify-between text-xs text-[#723c11]">
              <span className="truncate">
                {uploadedImage ? 'وثيقة مرفوعة من جهازك' : selectedSample.originLocation}
              </span>
              <span className="font-thmanyah font-bold text-[#b87a29] shrink-0">
                {uploadedImage ? 'فحص مباشر' : selectedSample.estimatedDate}
              </span>
            </div>
          </div>

          {/* العمود الأيسر: بطاقة التحقيق الموحّدة بالتبويبات (بدون تكدس) */}
          <div className="lg:col-span-7 bg-white rounded-[24px] border border-[#dbc397] shadow-[0_10px_30px_rgba(48,24,9,0.06)] overflow-hidden">
            {/* شريط التبويبات النظيف */}
            <div className="px-4 sm:px-5 pt-4 pb-3 border-b border-[#f0e4cd] bg-[#fdfbf7] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1 bg-[#f3e8d3] p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('text')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-thmanyah font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'text'
                      ? 'bg-[#301809] text-[#fae1b7] shadow-xs'
                      : 'text-[#723c11] hover:text-[#301809]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>النص المحقق</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('abbreviations')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-thmanyah font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'abbreviations'
                      ? 'bg-[#301809] text-[#fae1b7] shadow-xs'
                      : 'text-[#723c11] hover:text-[#301809]'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>الاختصارات ({currentAbbreviations.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('references')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-thmanyah font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'references'
                      ? 'bg-[#301809] text-[#fae1b7] shadow-xs'
                      : 'text-[#723c11] hover:text-[#301809]'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>المراجع ({currentReferences.length})</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#fae1b7]/50 border border-[#dbc397] text-[#301809] text-xs font-thmanyah font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  {copied ? (
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
                  onClick={() => window.print()}
                  className="p-2 rounded-xl bg-white hover:bg-[#fae1b7]/50 border border-[#dbc397] text-[#723c11] hover:text-[#301809] cursor-pointer transition-colors"
                  title="طباعة"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* محتوى التبويب النشط */}
            <div className="p-5 sm:p-6 min-h-[340px]">
              {activeTab === 'text' && (
                <div className="space-y-4">
                  {!uploadedImage && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-thmanyah font-bold text-[#b87a29]">
                        {selectedSample.categoryLabel} • {selectedSample.centuryHegira}
                      </span>
                      <h2 className="text-lg font-thmanyah font-bold text-[#301809]">
                        {selectedSample.titleAr}
                      </h2>
                    </div>
                  )}

                  <div className="bg-[#fdfbf7] border-r-[3px] border-[#efa83f] rounded-2xl p-5">
                    <p className="font-thmanyah text-sm sm:text-base text-[#301809] leading-[2] whitespace-pre-wrap select-text">
                      {currentTextToDisplay}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'abbreviations' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentAbbreviations.length > 0 ? (
                    currentAbbreviations.map((abbr, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-2xl bg-[#fdfbf7] border border-[#e7dac2] space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-thmanyah font-bold text-[#301809] bg-[#fae1b7] px-2.5 py-0.5 rounded-full">
                            «{abbr.term}»
                          </span>
                          <span className="text-xs font-thmanyah font-bold text-[#b87a29]">
                            {abbr.expansion}
                          </span>
                        </div>
                        <p className="text-xs text-[#723c11] leading-relaxed">
                          {abbr.meaning}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#723c11]/70 col-span-2 text-center py-8">
                      لا توجد اختصارات فقهية مسجلة لهذه الوثيقة.
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'references' && (
                <div className="space-y-3">
                  {currentReferences.map((ref, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-[#fdfbf7] border border-[#e7dac2] space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs sm:text-sm font-thmanyah font-bold text-[#301809]">
                          كتاب «{ref.bookTitle}»
                        </span>
                        <span className="text-[11px] font-bold text-[#b87a29] bg-[#fae1b7]/60 px-2.5 py-0.5 rounded-full shrink-0">
                          {ref.pages}
                        </span>
                      </div>
                      <p className="text-xs text-[#723c11] leading-relaxed">
                        {ref.summary}
                      </p>
                    </div>
                  ))}

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/heritage?q=${encodeURIComponent(
                            selectedSample.namedEntities.persons[0] || selectedSample.titleAr
                          )}`
                        )
                      }
                      className="px-4 py-2 rounded-full bg-[#301809] hover:bg-[#4a250e] text-[#fae1b7] text-xs font-thmanyah font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>استكشف في الباحث التاريخي</span>
                      <ArrowLeft className="w-3.5 h-3.5 text-[#efa83f]" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
