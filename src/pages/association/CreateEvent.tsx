import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { useToast } from '../../hooks/use-toast';

import { AlertCircle, CalendarPlus, CheckCircle2, UploadCloud, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import imageCompression from 'browser-image-compression';

export default function CreateEvent() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [coverUrl, setCoverUrl] = useState('');

  const [maxCapacity, setMaxCapacity] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [category, setCategory] = useState('Other');
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [loading, setLoading] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [forceSave, setForceSave] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (startTime >= endTime) {
      toast({ variant: "destructive", title: "خطأ في الوقت", description: "وقت النهاية يجب أن يكون بعد وقت البداية." });
      return;
    }

    if (galleryFiles.length > 3) {
      toast({ variant: "destructive", title: "خطأ في الصور", description: "الحد الأقصى لمعرض الصور هو 3 صور." });
      return;
    }

    setLoading(true);

    try {
      if (!forceSave) {
        // Step 1: Conflict Detection
        const { data: conflicts, error: conflictError } = await supabase
          .from('events')
          .select('title, start_time, end_time')
          .eq('date', date);

        if (conflictError) throw conflictError;

        if (conflicts && conflicts.length > 0) {
          // Check for time overlap
          // Logic: (new_start < existing_end) AND (new_end > existing_start)
          const hasOverlap = conflicts.some(c => {
            return (startTime < c.end_time) && (endTime > c.start_time);
          });

          if (hasOverlap) {
            setConflictWarning('تنبيه: يوجد تعارض زمني مع فعاليات أخرى في نفس اليوم والوقت. هل أنت متأكد من رغبتك في حفظ الفعالية؟');
            setForceSave(true);
            setLoading(false);
            return; // Stop here, show warning!
          }
        }
      }

      // Step 2: Save Event
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("غير مسجل الدخول");

      const { data: assoc } = await supabase
        .from('associations')
        .select('id')
        .eq('manager_id', user.id)
        .single();

      if (!assoc) throw new Error("لم يتم العثور على جمعية مرتبطة بحسابك");

      // Step 2.4: Handle Cover Image Upload
      let finalCoverUrl = coverUrl;
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1200,
        useWebWorker: true
      };

      if (coverFile) {
        setUploadingCover(true);
        const compressedCover = await imageCompression(coverFile, options);
        const ext = coverFile.name.split('.').pop() || 'jpg';
        const coverPath = `covers/${Date.now()}_cover.${ext}`;
        
        const { error: coverErr } = await supabase.storage.from('events').upload(coverPath, compressedCover);
        if (coverErr) throw new Error('فشل رفع صورة الغلاف.');
        
        const { data: coverData } = supabase.storage.from('events').getPublicUrl(coverPath);
        finalCoverUrl = coverData.publicUrl;
        setUploadingCover(false);
      }

      // Step 2.5: Optimize and Upload Images
      setUploadingImages(true);
      let uploadedUrls: string[] = [];

      for (const file of galleryFiles) {
        try {
          const compressedFile = await imageCompression(file, options);
          const ext = file.name.split('.').pop() || 'jpg';
          const filePath = `gallery/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

          // Try to upload to an 'events' bucket
          const { error: uploadError } = await supabase.storage.from('events').upload(filePath, compressedFile);
          if (uploadError) {
            console.error('Storage error:', uploadError);
            throw new Error('فشل رفع الصور إلى خادم التخزين. تأكد من إعداد دلو (Bucket) بالاسم "events" بصلاحيات عامة.');
          }

          const { data: publicData } = supabase.storage.from('events').getPublicUrl(filePath);
          uploadedUrls.push(publicData.publicUrl);
        } catch (imgErr: any) {
          throw new Error('فشل رفع إحدى الصور: ' + imgErr.message);
        }
      }
      setUploadingImages(false);

      const { error: insertError } = await supabase
        .from('events')
        .insert({
          association_id: assoc.id,
          title,
          description,
          date,
          start_time: startTime,
          end_time: endTime,
          location,
          category,
          cover_image_url: finalCoverUrl || null,
          max_capacity: maxCapacity ? parseInt(maxCapacity) : null,
          gallery_urls: uploadedUrls,
          is_public: isPublic
        });

      if (insertError) throw insertError;

      toast({
        title: "تم الحفظ بنجاح",
        description: "تم إنشاء الفعالية الخاصة بك.",
      });
      navigate('/association');

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "حدث خطأ",
        description: error.message,
      });
    } finally {
      if (!forceSave) {
        setLoading(false);
        setUploadingImages(false);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (galleryFiles.length + newFiles.length > 3) {
        toast({ variant: "destructive", title: "تجاوز الحد", description: "يمكنك رفع 3 صور كحد أقصى." });
        return;
      }
      setGalleryFiles([...galleryFiles, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setGalleryFiles(galleryFiles.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] py-10 px-4 text-right" dir="rtl">
      <div className="container mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/association')} 
            className="text-[#723c11] hover:text-[#301809] hover:bg-[#fae1b7]/40 font-bold rounded-xl gap-2"
          >
            ← العودة للوحة الجمعية
          </Button>
          <span className="text-xs font-bold text-[#b87a29] bg-[#fae1b7]/50 px-3 py-1 rounded-full border border-[#dbc397]">
            لوحة الجمعيات • ورقلة
          </span>
        </div>

        <Card className="border-2 border-[#dbc397]/70 shadow-xl rounded-3xl overflow-hidden bg-white">
          <div className="bg-gradient-to-l from-[#301809] via-[#723c11] to-[#301809] p-7 md:p-8 text-white relative overflow-hidden border-b-4 border-[#efa83f]">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#efa83f_1px,transparent_1px)] [background-size:16px_16px]" />
            <CalendarPlus className="absolute left-6 top-1/2 -translate-y-1/2 w-24 h-24 text-[#efa83f] opacity-20 pointer-events-none" />
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#efa83f] bg-[#efa83f]/15 px-3 py-1 rounded-full mb-2 border border-[#efa83f]/30">
                ✨ فعالية جديدة
              </span>
              <CardTitle className="text-2xl md:text-3xl font-black text-[#fae1b7] tracking-tight">إنشاء فعالية جديدة</CardTitle>
              <CardDescription className="text-[#dbc397] text-sm md:text-base mt-1 font-medium">أدخل تفاصيل الفعالية لجدولتها وإتاحتها لجمهور ورقلة</CardDescription>
            </div>
          </div>

          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">

              {conflictWarning && (
                <Alert variant="destructive" className="bg-red-50 text-red-900 border-2 border-red-300 rounded-2xl">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <AlertTitle className="text-base font-bold mr-2 text-red-700">تنبيه التعارض الزمني!</AlertTitle>
                  <AlertDescription className="text-red-800 text-sm mt-1 font-medium">
                    {conflictWarning}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-black text-[#301809]">عنوان الفعالية <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="bg-[#fdfbf7] border-2 border-[#dbc397] focus-visible:border-[#b87a29] rounded-xl h-12 font-medium"
                  placeholder="مثال: ندوة التراث الصحراوي وتاريخ قصر ورقلة"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-black text-[#301809]">وصف مفصل</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-[#fdfbf7] border-2 border-[#dbc397] focus-visible:border-[#b87a29] rounded-xl min-h-[120px] font-medium"
                  placeholder="تفاصيل وأهداف الفعالية وبرنامج الأنشطة..."
                />
              </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-black text-[#301809]">التاريخ <span className="text-red-500">*</span></Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setForceSave(false);
                    setConflictWarning(null);
                  }}
                  required
                  className="bg-[#fdfbf7] border-2 border-[#dbc397] focus-visible:border-[#b87a29] rounded-xl h-12 font-medium"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start" className="text-sm font-black text-[#301809]">وقت البداية <span className="text-red-500">*</span></Label>
                <Input
                  id="start"
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    setForceSave(false);
                    setConflictWarning(null);
                  }}
                  required
                  className="bg-[#fdfbf7] border-2 border-[#dbc397] focus-visible:border-[#b87a29] rounded-xl h-12 font-medium"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end" className="text-sm font-black text-[#301809]">وقت النهاية <span className="text-red-500">*</span></Label>
                <Input
                  id="end"
                  type="time"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    setForceSave(false);
                    setConflictWarning(null);
                  }}
                  required
                  className="bg-[#fdfbf7] border-2 border-[#dbc397] focus-visible:border-[#b87a29] rounded-xl h-12 font-medium"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-black text-[#301809]">تصنيف الفعالية <span className="text-red-500">*</span></Label>
              <select 
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-12 bg-[#fdfbf7] border-2 border-[#dbc397] rounded-xl px-4 font-bold text-[#301809] focus:border-[#b87a29] outline-none transition-colors"
              >
                <option value="Heritage">تراثي وتقليدي</option>
                <option value="Religious">ديني وروحي</option>
                <option value="Educational">تعليمي وتدريبي</option>
                <option value="Cultural">ثقافي وفني</option>
                <option value="Sports">رياضي وترفيهي</option>
                <option value="Other">أخرى</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-black text-[#301809]">وصف الموقع / الرابط <span className="text-red-500">*</span></Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  className="bg-[#fdfbf7] border-2 border-[#dbc397] focus-visible:border-[#b87a29] rounded-xl h-12 font-medium"
                  placeholder="مثال: قصر ورقلة العتيق، أو مدرج ابن رشد"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxCapacity" className="text-sm font-black text-[#301809]">السعة القصوى للمشاركين (اختياري)</Label>
                <Input
                  id="maxCapacity"
                  type="number"
                  min="1"
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(e.target.value)}
                  className="bg-[#fdfbf7] border-2 border-[#dbc397] focus-visible:border-[#b87a29] rounded-xl h-12 font-medium"
                  placeholder="مثال: 150"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t-2 border-[#fae1b7]">
              <Label htmlFor="cover" className="text-sm font-black text-[#301809] block">صورة الغلاف الرئيسية</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-[#723c11] font-bold">رابط خارجي (اختياري)</Label>
                  <Input 
                    id="cover" 
                    type="url"
                    value={coverUrl} 
                    onChange={(e) => setCoverUrl(e.target.value)} 
                    placeholder="https://images.unsplash.com/..."
                    className="bg-[#fdfbf7] border-2 border-[#dbc397] focus-visible:border-[#b87a29] rounded-xl h-12 font-medium"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-[#723c11] font-bold">أو ارفع صورة من جهازك</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      onChange={e => setCoverFile(e.target.files?.[0] || null)}
                      className="bg-[#fdfbf7] border-2 border-[#dbc397] rounded-xl h-12 pt-2 cursor-pointer font-medium"
                    />
                    {coverFile && (
                      <Button type="button" variant="ghost" onClick={() => setCoverFile(null)} className="text-red-500 hover:bg-red-50 h-12 rounded-xl">
                        <X size={20} />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              {(coverFile || coverUrl) && (
                <div className="mt-2 text-xs font-bold text-[#723c11] bg-[#fae1b7]/60 p-2.5 rounded-xl inline-flex items-center gap-2 border border-[#dbc397]">
                  <CheckCircle2 className="w-4 h-4 text-[#b87a29]" />
                  {coverFile ? `تم اختيار: ${coverFile.name}` : "رابط الصورة نشط وجاهز للعرض"}
                </div>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <Label className="text-sm font-black text-[#301809] block">معرض الصور الإضافية (3 صور كحد أقصى)</Label>
              <p className="text-xs text-[#723c11]/80 font-medium">سيتم ضغط الصور تلقائياً لتسريع التصفح في الهواتف. الأبعاد المفضلة: عرضية (16:9).</p>

              <div className="flex items-center gap-4 flex-wrap">
                {galleryFiles.map((f, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#dbc397] shadow-sm group">
                    <img src={URL.createObjectURL(f)} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeFile(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {galleryFiles.length < 3 && (
                  <Label htmlFor="gallery" className="w-24 h-24 rounded-2xl border-2 border-dashed border-[#dbc397] bg-[#fdfbf7] hover:bg-[#fae1b7]/30 hover:border-[#b87a29] flex flex-col items-center justify-center cursor-pointer transition-colors">
                    <UploadCloud className="w-6 h-6 text-[#b87a29]" />
                    <span className="text-[11px] font-bold text-[#723c11] mt-1">رفع صورة</span>
                    <input id="gallery" type="file" multiple accept="image/*" onChange={handleFileSelect} className="hidden" />
                  </Label>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t-2 border-[#fae1b7]">
              <Label className="text-sm font-black text-[#301809]">نوع الفعالية (الخصوصية)</Label>
              <div className="flex gap-4 items-center mt-2">
                <Label className={`flex items-center gap-3 cursor-pointer p-4 rounded-2xl border-2 flex-1 transition-all ${isPublic ? 'border-[#b87a29] bg-[#fae1b7]/40 shadow-xs' : 'border-[#dbc397] bg-[#fdfbf7] hover:border-[#b87a29]'}`}>
                  <input type="radio" checked={isPublic} onChange={() => setIsPublic(true)} className="accent-[#b87a29] w-5 h-5" />
                  <div>
                    <span className="font-black text-[#301809] text-base block">عامة (متاحة للجميع)</span>
                    <span className="text-[11px] text-[#723c11]/80 font-medium">تظهر في المستكشف واستكشاف ورقلة</span>
                  </div>
                </Label>
                <Label className={`flex items-center gap-3 cursor-pointer p-4 rounded-2xl border-2 flex-1 transition-all ${!isPublic ? 'border-[#301809] bg-[#fae1b7]/40 shadow-xs' : 'border-[#dbc397] bg-[#fdfbf7] hover:border-[#301809]'}`}>
                  <input type="radio" checked={!isPublic} onChange={() => setIsPublic(false)} className="accent-[#301809] w-5 h-5" />
                  <div>
                    <span className="font-black text-[#301809] text-base block">خاصة (برابط مباشر فقط)</span>
                    <span className="text-[11px] text-[#723c11]/80 font-medium">للمدعوين وأعضاء الجمعية حصراً</span>
                  </div>
                </Label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || uploadingCover || uploadingImages}
              className={`w-full h-14 text-lg font-black rounded-2xl transition-all shadow-md ${forceSave
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/30'
                : 'bg-gradient-to-r from-[#b87a29] to-[#efa83f] hover:from-[#723c11] hover:to-[#b87a29] text-[#301809] hover:text-[#fae1b7] shadow-[#b87a29]/30'
                }`}
            >
              {loading ? (uploadingCover ? "جاري رفع صورة الغلاف..." : uploadingImages ? "جاري ضغط ورفع الصور..." : "جاري المعالجة...") : forceSave ? (
                <><CheckCircle2 className="mr-2 h-5 w-5" /> تأكيد الحفظ بالرغم من التعارض</>
              ) : (
                "حفظ ونشر الفعالية"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  </div>
  );
}
