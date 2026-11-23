import React, { useState, useRef } from 'react';
import {
  SAMPLE_MANUSCRIPTS,
  type SampleManuscript
} from '@/data/sampleManuscriptsData';
import {
  processManuscriptImage,
  type ManuscriptAnalysisResult
} from '@/lib/manuscriptAIEngine';
import {
  Sparkles,
  BookOpen,
  Upload,
  Camera,
  Copy,
  Check,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  HelpCircle,
  X,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ManuscriptReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearchInHeritageAssistant?: (query: string) => void;
}

export const ManuscriptReaderModal: React.FC<ManuscriptReaderModalProps> = ({
  isOpen,
  onClose,
  onSearchInHeritageAssistant
}) => {
  const [activeTab, setActiveTab] = useState<'samples' | 'upload'>('samples');
  const [selectedSample, setSelectedSample] = useState<SampleManuscript>(SAMPLE_MANUSCRIPTS[0]);

  // رفع الصورة والفحص
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [progressLabel, setProgressLabel] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<ManuscriptAnalysisResult | null>(null);

  // إعدادات عرض الصورة
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [imageFilter, setImageFilter] = useState<'normal' | 'high_contrast' | 'grayscale' | 'invert'>('normal');

  const [copied, setCopied] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // اختيار نموذج تراثي محقق
  const handleSelectSample = (sample: SampleManuscript) => {
    setSelectedSample(sample);
    setUploadedImage(null);
    setAnalysisResult(null);
    setZoomLevel(1);
    setRotation(0);
    setImageFilter('normal');
  };

  // معالجة صورة مرفوعة عبر OCR
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

      try {
        const res = await processManuscriptImage(dataUrl, (p, label) => {
          setProgress(p);
          setProgressLabel(label);
        });
        setAnalysisResult(res);
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
        meaning: a.explanation
      }));

  const currentReferences = analysisResult
    ? analysisResult.matchedBooks
    : selectedSample.matchedBookReferences.map((r) => ({
        bookTitle: r.bookTitle,
        chapterTitle: r.author,
        pages: r.pages,
        summary: r.quote
      }));

  const handleCopy = () => {
    navigator.clipboard.writeText(currentTextToDisplay);
    setCopied(true);
    toast.success('تم نسخ النص المحقق بنجاح');
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  // فلتر CSS لمعالجة الصورة
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

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl bg-[#060e1a] border border-amber-400/30 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[92vh] text-slate-100"
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: '#060e1a' }}
      >
        {/* ══════════════════════════════════════════════════════════════════
            1. الرأس: محلل ومفسر المخطوطات بالذكاء الاصطناعي
        ══════════════════════════════════════════════════════════════════ */}
        <div className="px-5 py-4 sm:px-7 border-b border-amber-400/20 bg-gradient-to-b from-[#0c1e34] to-[#071322] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-sm shrink-0">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-thmanyah font-bold text-white">
                  محلل ومفسر المخطوطات والوثائق التاريخية
                </h3>
                <span className="text-[10px] font-thmanyah font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full hidden sm:inline-block">
                  AI OCR & Deep Grounding
                </span>
              </div>
              <p className="text-xs text-slate-400 font-thmanyah mt-0.5">
                فك الخط المغربي، كشف الاختصارات، والربط التلقائي بمراجع واحة وارجلان الـ 22
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* تبديل التبويب */}
            <div className="bg-[#0b1b2d] p-1 rounded-xl border border-slate-700 flex items-center gap-1 text-xs font-thmanyah font-bold">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('samples');
                  setUploadedImage(null);
                }}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'samples'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                النماذج التراثية
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('upload');
                  fileInputRef.current?.click();
                }}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'upload'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>فحص وثيقة جديدة</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800/70 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            2. شريط اختيار النماذج التراثية (في تبويب النماذج)
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'samples' && (
          <div className="px-4 sm:px-6 py-2.5 border-b border-amber-400/15 bg-[#040a13] overflow-x-auto no-scrollbar flex items-center gap-2 shrink-0">
            {SAMPLE_MANUSCRIPTS.map((ms) => {
              const isSelected = selectedSample.id === ms.id;
              return (
                <button
                  key={ms.id}
                  type="button"
                  onClick={() => handleSelectSample(ms)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-thmanyah font-bold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-400/20 via-[#102742] to-amber-400/10 border-amber-400 text-amber-300 shadow-sm'
                      : 'bg-[#091524] border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>{ms.titleAr}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            3. منطقة التحليل المزدوجة (الصورة + النص والتحقيق)
        ══════════════════════════════════════════════════════════════════ */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* شريط حالة المعالجة الحية */}
          {isProcessing && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-amber-300 flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="flex justify-between text-xs font-thmanyah font-bold">
                  <span>{progressLabel}</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* ── العمود الأيمن: عارض المخطوطة والعدسة التفاعلية ── */}
            <div className="lg:col-span-5 flex flex-col space-y-3">
              <div className="relative rounded-2xl bg-[#081525] border border-amber-400/25 overflow-hidden flex flex-col min-h-[340px] max-h-[460px]">
                {/* شريط أدوات تصفية الصورة والتكبير */}
                <div className="px-3 py-2 border-b border-slate-800 bg-[#06101c] flex items-center justify-between text-xs">
                  <span className="text-amber-300 font-thmanyah font-bold text-[11px]">
                    عدسة الفحص البصري
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                      className="p-1 rounded hover:bg-slate-800 text-slate-300"
                      title="تكبير"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
                      className="p-1 rounded hover:bg-slate-800 text-slate-300"
                      title="تصغير"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRotation((r) => (r + 90) % 360)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-300"
                      title="تدوير"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <div className="h-3 w-px bg-slate-700 mx-1" />
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
                      className="px-2 py-0.5 rounded bg-[#0e243a] text-amber-300 text-[10px] font-thmanyah"
                      title="تغيير فلتر الحبر والتباين"
                    >
                      {imageFilter === 'normal'
                        ? 'عادي'
                        : imageFilter === 'high_contrast'
                        ? 'تباين عالي'
                        : imageFilter === 'grayscale'
                        ? 'أبيض وأسود'
                        : 'معكوس'}
                    </button>
                  </div>
                </div>

                {/* لوحة عرض المخطوطة القابلة للتحريك والتكبير */}
                <div className="flex-1 overflow-auto p-2 flex items-center justify-center bg-black/40">
                  <img
                    src={currentDisplayImage}
                    alt="وثيقة تاريخية"
                    className="max-w-full max-h-[380px] object-contain rounded-lg transition-transform duration-200 select-none shadow-md"
                    style={{
                      transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                      filter: getImageFilterStyle()
                    }}
                  />
                </div>

                {/* وسام تاريخ الوثيقة */}
                <div className="p-2.5 border-t border-slate-800 bg-[#06101c] flex items-center justify-between text-[11px] font-thmanyah text-slate-400">
                  <span>الموقع: {selectedSample.originLocation}</span>
                  <span className="text-amber-300 font-bold">{selectedSample.estimatedDate}</span>
                </div>
              </div>

              {/* زر رفع صورة أخرى */}
              {activeTab === 'upload' && (
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full border-amber-400/30 text-amber-200 hover:bg-[#0d2238] font-thmanyah font-bold text-xs rounded-xl h-10 gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-amber-400" />
                  <span>التقاط أو رفع صورة وثيقة أخرى</span>
                </Button>
              )}
            </div>

            {/* ── العمود الأيسر: النص المحقق والاختصارات والمراجع ── */}
            <div className="lg:col-span-7 space-y-4">
              {/* بطاقة النص المحقق */}
              <div className="p-4 rounded-2xl bg-[#081525] border border-amber-400/25 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-thmanyah">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>النص المحقق بالذكاء الاصطناعي:</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="px-2.5 py-1 rounded-lg border border-amber-400/30 bg-amber-400/10 text-amber-300 hover:text-white flex items-center gap-1 text-[11px] font-thmanyah cursor-pointer"
                      title="نسخ النص المحقق"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePrint}
                      className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                      title="طباعة تقرير التحقيق"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="bg-[#050e18] p-3.5 rounded-xl border border-slate-800/80 min-h-[110px] text-right">
                  <p className="font-thmanyah text-sm sm:text-base text-slate-100 font-bold leading-relaxed whitespace-pre-wrap">
                    {currentTextToDisplay}
                  </p>
                </div>
              </div>

              {/* بطاقة كشف الاختصارات والرموز الفقهية القديمة */}
              {currentAbbreviations.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-[#09182a] border border-amber-400/20 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-thmanyah font-bold text-amber-300">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>كاشف الاختصارات والرموز التراثية المكتشفة ({currentAbbreviations.length}):</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentAbbreviations.map((abbr, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-[#06111f] border border-slate-800 space-y-0.5 text-right"
                      >
                        <div className="flex items-center justify-between text-xs font-thmanyah">
                          <span className="font-black text-amber-300 bg-amber-400/15 px-2 py-0.5 rounded-md">
                            «{abbr.term}»
                          </span>
                          <span className="text-slate-300 font-bold">➔ {abbr.expansion}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-thmanyah leading-tight mt-1">
                          {abbr.meaning}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* الربط التلقائي بأمهات الكتب الـ 22 */}
              <div className="p-3.5 rounded-2xl bg-[#071322] border border-slate-800 space-y-2 text-xs font-thmanyah">
                <div className="flex items-center justify-between text-amber-300 font-bold">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>الشواهد المتطابقة في مراجع المنصة الـ 22:</span>
                  </span>
                  {onSearchInHeritageAssistant && (
                    <button
                      type="button"
                      onClick={() =>
                        onSearchInHeritageAssistant(
                          selectedSample.namedEntities.persons[0] || selectedSample.titleAr
                        )
                      }
                      className="text-[11px] text-amber-300 hover:text-white underline cursor-pointer"
                    >
                      افتح في الباحث التاريخي ❯
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {currentReferences.map((ref, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#09182a]/60 border border-slate-800/80 space-y-1 text-right"
                    >
                      <div className="flex items-center justify-between text-slate-200">
                        <span className="font-bold text-amber-200/90">
                          كتاب «{ref.bookTitle}»
                        </span>
                        <span className="text-slate-400 text-[11px]">{ref.pages}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {ref.summary}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
