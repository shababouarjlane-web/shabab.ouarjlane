import { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  UploadCloud,
  Trash2,
  FileText,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  CheckCircle2,
  Loader2,
  KeyRound,
  Eye,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  getAllReferenceBooks,
  deleteUploadedBook,
  deleteSingleSection,
  restoreBuiltinGhosnAlBan,
  processDroppedReferenceFile,
  getAdminOcrApiKey,
  setAdminOcrApiKey,
  getDeletedBuiltinIds,
  type ReferenceBookRecord
} from '@/lib/historyReferencesStore';

export default function AdminHistoryRefsTab() {
  const navigate = useNavigate();
  const [books, setBooks] = useState<ReferenceBookRecord[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null);

  // Drag & Drop State
  const [isDragging, setIsDragging] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customAuthor, setCustomAuthor] = useState('');
  const [maxOcrPages, setMaxOcrPages] = useState(20);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [progressPct, setProgressPct] = useState(0);

  // Optional Gemini OCR Key
  const [ocrKey, setOcrKey] = useState(() => getAdminOcrApiKey());
  const [showOcrKeyBox, setShowOcrKeyBox] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadBooks = async () => {
    setLoadingBooks(true);
    try {
      const list = await getAllReferenceBooks();
      setBooks(list);
    } catch {
      toast.error('تعذر تحميل قائمة المراجع');
    } finally {
      setLoadingBooks(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    setIsProcessing(true);
    setProgressPct(5);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setStatusText(`جاري معالجة الملف (${i + 1}/${files.length}): ${file.name}...`);
        const record = await processDroppedReferenceFile({
          file,
          customTitle: files.length === 1 ? customTitle : undefined,
          customAuthor: customAuthor || undefined,
          maxOcrPages,
          onStatus: (msg, pct) => {
            setStatusText(msg);
            setProgressPct(pct);
          }
        });
        toast.success(
          `تمت إضافة وفهرسة «${record.title}» (${record.sections.length} قسماً/صفحة) بنجاح!`
        );
      }
      setCustomTitle('');
      setCustomAuthor('');
      await loadBooks();
    } catch (err: any) {
      toast.error(err?.message || 'حدث خطأ أثناء قراءة الملف وفهرسته.');
    } finally {
      setIsProcessing(false);
      setStatusText('');
      setProgressPct(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteBook = async (book: ReferenceBookRecord) => {
    if (!window.confirm(`هل أنت متأكد من حذف المرجع «${book.title}» بالكامل من الباحث التاريخي؟`)) {
      return;
    }
    await deleteUploadedBook(book.id);
    toast.success(`تم حذف المرجع «${book.title}» بنجاح.`);
    await loadBooks();
  };

  const handleDeleteSection = async (bookId: string, sectionId: string, chapterTitle: string) => {
    await deleteSingleSection(bookId, sectionId);
    toast.success(`تم حذف الباب: «${chapterTitle}»`);
    await loadBooks();
  };

  const handleRestoreDefault = async () => {
    await restoreBuiltinGhosnAlBan();
    toast.success('تمت استعادة جميع أبواب كتاب «غصن البان في تاريخ وارجلان» الافتراضية.');
    await loadBooks();
  };

  const hasDeletedBuiltin = getDeletedBuiltinIds().size > 0;

  const getFileTypeBadge = (type: ReferenceBookRecord['fileType']) => {
    switch (type) {
      case 'builtin':
        return { label: 'مرجع أساسي مفهرس', cls: 'bg-[#fae1b7] text-[#301809] border-[#b87a29]' };
      case 'pdf-scanned':
        return { label: 'PDF مصوّر (OCR)', cls: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'pdf-text':
        return { label: 'ملف PDF نصي', cls: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      case 'word':
        return { label: 'مستند Word (.docx)', cls: 'bg-blue-100 text-blue-900 border-blue-300' };
      case 'image-ocr':
        return { label: 'وثيقة مصوّرة (OCR)', cls: 'bg-purple-100 text-purple-900 border-purple-300' };
      default:
        return { label: 'ملف نصي', cls: 'bg-slate-100 text-slate-800 border-slate-300' };
    }
  };

  return (
    <div className="space-y-8" dir="rtl">
      {/* ── Top Bar: Summary & Open Visitor Page ─────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-[#301809] to-[#4a2610] text-[#fae1b7] p-6 rounded-3xl border-2 border-[#b87a29] shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#efa83f]/20 border border-[#efa83f] flex items-center justify-center text-[#efa83f] shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-thmanyah font-bold text-xl text-white">
              إدارة مراجع «الباحث التاريخي لوارجلان وسدراتة»
            </h2>
            <p className="text-xs sm:text-sm text-[#fae1b7]/80 mt-0.5">
              اسحب وأفلت الكتب والملفات (PDF عادي، PDF مصوّر ممسوح ضوئياً، Word، أو صور وثائق) ليتم فهرستها تلقائياً للزوار.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowOcrKeyBox(!showOcrKeyBox)}
            className="h-10 rounded-xl border-[#efa83f]/60 bg-white/10 text-[#fae1b7] hover:bg-white/20 text-xs font-bold gap-1.5 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#efa83f]" />
            <span>إعدادات القراءة الضوئية (OCR)</span>
          </Button>
          <Button
            type="button"
            onClick={() => navigate('/heritage')}
            className="h-10 rounded-xl bg-[#efa83f] hover:bg-[#b87a29] text-[#301809] font-black text-xs gap-1.5 cursor-pointer shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>معاينة صفحة الزوار</span>
          </Button>
        </div>
      </div>

      {/* ── Optional OCR Acceleration Settings ───────────────────────── */}
      {showOcrKeyBox && (
        <Card className="border-2 border-[#b87a29] rounded-3xl bg-[#fdfbf7] shadow-md">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-[#301809] flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#b87a29]" />
                <span>تسريع قراءة الكتب المصوّرة (Scanned PDF OCR)</span>
              </h4>
              <span className="text-[11px] font-semibold text-[#723c11]">
                يعمل النظام تلقائياً بـ Tesseract العربي مجاناً، أو بمفتاح Gemini لدقة وسرعة مضاعفة
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Input
                  type="password"
                  value={ocrKey}
                  onChange={(e) => setOcrKey(e.target.value)}
                  placeholder="اختياري: ضع مفتاح Gemini API (AIzaSy...) لقراءة الكتب المصوّرة القديمة بدقة عالية"
                  className="h-10 rounded-xl border-[#dbc397] bg-white text-xs"
                  dir="ltr"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={() => {
                    setAdminOcrApiKey(ocrKey);
                    toast.success('تم حفظ إعدادات القراءة الضوئية (OCR)');
                    setShowOcrKeyBox(false);
                  }}
                  className="h-10 flex-1 rounded-xl bg-[#301809] text-[#fae1b7] text-xs font-bold cursor-pointer"
                >
                  حفظ الإعدادات
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Drag & Drop Upload Card ──────────────────────────────────── */}
      <Card className="shadow-xl border-2 border-[#dbc397] rounded-3xl bg-white overflow-hidden">
        <CardHeader className="bg-[#fdfbf7] border-b border-[#dbc397]/50 pb-4">
          <CardTitle className="text-lg font-thmanyah font-bold text-[#301809] flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-[#b87a29]" />
            <span>إضافة مرجع جديد بالسحب والإفلات (Drag & Drop)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          {/* Optional Metadata Inputs Before Dropping */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#301809]">
                اسم الكتاب / المرجع (اختياري — يُؤخذ من اسم الملف تلقائياً)
              </Label>
              <Input
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="مثال: تاريخ وارجلان وحضارة سدراتة"
                className="h-11 rounded-xl border-[#dbc397]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#301809]">
                اسم المؤلف أو المحقق (اختياري)
              </Label>
              <Input
                value={customAuthor}
                onChange={(e) => setCustomAuthor(e.target.value)}
                placeholder="مثال: الشيخ إبراهيم بن صالح أعزام"
                className="h-11 rounded-xl border-[#dbc397]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#301809]">
                الحد الأقصى لصفحات OCR في الملف المصوّر الواحد
              </Label>
              <Input
                type="number"
                min={1}
                max={200}
                value={maxOcrPages}
                onChange={(e) => setMaxOcrPages(Number(e.target.value) || 20)}
                className="h-11 rounded-xl border-[#dbc397]"
              />
            </div>
          </div>

          {/* Dropzone Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isProcessing) setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
              if (!isProcessing) {
                handleFiles(e.dataTransfer.files);
              }
            }}
            onClick={() => {
              if (!isProcessing) fileInputRef.current?.click();
            }}
            className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-[#b87a29] bg-[#fae1b7]/40 scale-[1.01]'
                : 'border-[#dbc397] bg-[#fdfbf7] hover:bg-[#fae1b7]/20 hover:border-[#b87a29]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.txt,.md,.jpg,.jpeg,.png,.webp"
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />

            {isProcessing ? (
              <div className="max-w-md mx-auto space-y-4 py-2">
                <Loader2 className="w-10 h-10 text-[#b87a29] animate-spin mx-auto" />
                <p className="font-bold text-sm text-[#301809]">{statusText}</p>
                <div className="w-full h-3 bg-[#fae1b7] rounded-full overflow-hidden border border-[#dbc397]">
                  <div
                    className="h-full bg-gradient-to-r from-[#301809] via-[#b87a29] to-[#efa83f] transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-[#723c11] block">{progressPct}%</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-[#fae1b7]/70 border border-[#d4b174] flex items-center justify-center mx-auto text-[#723c11]">
                  <UploadCloud className="w-8 h-8 text-[#b87a29]" />
                </div>
                <h3 className="font-thmanyah font-bold text-lg text-[#301809]">
                  اسحب وأفلت ملفات المراجع هنا، أو اضغط لاختيار ملف من جهازك
                </h3>
                <p className="text-xs sm:text-sm text-[#723c11] max-w-xl mx-auto leading-relaxed">
                  يدعم: <strong>ملفات PDF النصية</strong>، <strong>الكتب المصوّرة (Scanned PDF بالـ OCR العربي)</strong>، <strong>ملفات Word (.docx)</strong>، <strong>الصور الممسوحة ضوئياً (.jpg/.png)</strong>، والملفات النصية.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Active Reference Books List (View / Delete Books or Chapters) ── */}
      <Card className="shadow-xl border-2 border-[#dbc397] rounded-3xl bg-white overflow-hidden">
        <CardHeader className="bg-[#fdfbf7] border-b border-[#dbc397]/50 pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-thmanyah font-bold text-[#301809] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#b87a29]" />
            <span>المراجع المعتمدة حالياً في الباحث التاريخي ({books.length})</span>
          </CardTitle>

          {hasDeletedBuiltin && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRestoreDefault}
              className="rounded-xl border-[#b87a29] text-[#301809] hover:bg-[#fae1b7]/50 text-xs font-bold gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#b87a29]" />
              <span>استعادة المحذوف من «غصن البان»</span>
            </Button>
          )}
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {loadingBooks ? (
            <div className="py-12 text-center text-sm font-bold text-[#723c11]">
              جاري تحميل المراجع...
            </div>
          ) : books.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-sm font-bold text-[#723c11]">
                لا توجد مراجع مفعّلة حالياً. ارفع ملفاً من الأعلى أو استعد المرجع الافتراضي.
              </p>
              {hasDeletedBuiltin && (
                <Button
                  type="button"
                  onClick={handleRestoreDefault}
                  className="rounded-xl bg-[#301809] text-[#fae1b7] text-xs font-bold gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>استعادة كتاب «غصن البان في تاريخ وارجلان»</span>
                </Button>
              )}
            </div>
          ) : (
            books.map((book) => {
              const badge = getFileTypeBadge(book.fileType);
              const isExpanded = expandedBookId === book.id;

              return (
                <div
                  key={book.id}
                  className="border-2 border-[#dbc397]/80 rounded-2xl bg-[#fdfbf7] overflow-hidden transition-all"
                >
                  {/* Book Row Header */}
                  <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 bg-white">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-[#301809] text-[#efa83f] flex items-center justify-center shrink-0 mt-0.5">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-thmanyah font-bold text-base sm:text-lg text-[#301809]">
                            {book.title}
                          </h4>
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.cls}`}
                          >
                            {badge.label}
                          </span>
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#fdfbf7] text-[#723c11] border border-[#dbc397]">
                            {book.sections.length} باب / صفحة مفهرسة
                          </span>
                        </div>
                        <p className="text-xs text-[#723c11] font-medium">{book.author}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedBookId(isExpanded ? null : book.id)}
                        className="h-9 rounded-xl border-[#dbc397] text-[#301809] hover:bg-[#fae1b7]/40 text-xs font-bold gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#b87a29]" />
                        <span>{isExpanded ? 'إخفاء الأبواب' : 'عرض وحذف الأبواب'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteBook(book)}
                        className="h-9 rounded-xl border-red-200 bg-red-50/70 text-red-700 hover:bg-red-600 hover:text-white text-xs font-bold gap-1.5 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف المرجع</span>
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Sections List */}
                  {isExpanded && (
                    <div className="p-4 sm:p-5 border-t border-[#dbc397]/60 space-y-2.5 bg-[#fdfbf7]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-[#723c11] flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          الأبواب والصفحات المفهرسة من هذا المرجع ({book.sections.length}):
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5 max-h-96 overflow-y-auto pr-1">
                        {book.sections.map((sec) => (
                          <div
                            key={sec.id}
                            className="bg-white border border-[#dbc397] rounded-xl p-3.5 flex items-start justify-between gap-3"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-[#b87a29] bg-[#fae1b7]/50 px-2 py-0.5 rounded-md">
                                  {sec.pages}
                                </span>
                                <h5 className="font-bold text-xs sm:text-sm text-[#301809] truncate">
                                  {sec.chapterTitle}
                                </h5>
                              </div>
                              <p className="text-xs text-[#723c11] line-clamp-2 leading-relaxed">
                                {sec.summary}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteSection(book.id, sec.id, sec.chapterTitle)
                              }
                              className="px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                              title="حذف هذا الباب من المرجع"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>حذف</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
