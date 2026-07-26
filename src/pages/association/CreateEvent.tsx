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
    <div className="container mx-auto p-4 max-w-3xl py-12 text-right text-gray-900" dir="rtl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/association')} className="text-gray-500 mb-4">
          ← العودة للوحة التحكم
        </Button>
      </div>

      <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white">
        <div className="bg-gradient-to-l from-emerald-600 to-emerald-400 p-8 text-white relative overflow-hidden">
          <CalendarPlus className="absolute left-6 top-1/2 -translate-y-1/2 w-24 h-24 opacity-20" />
          <CardTitle className="text-3xl font-extrabold pb-2">إنشاء فعالية جديدة</CardTitle>
          <CardDescription className="text-emerald-50 text-lg">أدخل تفاصيل الفعالية لجدولتها وإتاحتها للجمهور</CardDescription>
        </div>

        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">

            {conflictWarning && (
              <Alert variant="destructive" className="bg-red-50 text-red-900 border border-red-200">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <AlertTitle className="text-lg font-bold mr-2 text-red-700">تنبيه التعارض!</AlertTitle>
                <AlertDescription className="text-red-800 text-base mt-2 font-medium">
                  {conflictWarning}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="title" className="text-base text-gray-700 font-bold">عنوان الفعالية</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-gray-50 border-gray-200 h-12"
                placeholder="مثال: ندوة التوعية الصحية"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-base text-gray-700 font-bold">وصف مفصل</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-gray-50 border-gray-200 min-h-[120px]"
                placeholder="تفاصيل و أهداف الفعالية..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-base text-gray-700 font-bold">التاريخ</Label>
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
                  className="bg-gray-50 border-gray-200 h-12"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start" className="text-base text-gray-700 font-bold">وقت البداية</Label>
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
                  className="bg-gray-50 border-gray-200 h-12"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end" className="text-base text-gray-700 font-bold">وقت النهاية</Label>
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
                  className="bg-gray-50 border-gray-200 h-12"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-base text-gray-700 font-bold">تصنيف الفعالية</Label>
              <select 
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="Heritage">تراثي</option>
                <option value="Religious">ديني</option>
                <option value="Educational">تعليمي</option>
                <option value="Cultural">ثقافي</option>
                <option value="Sports">رياضي</option>
                <option value="Other">أخرى</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="location" className="text-base text-gray-700 font-bold">وصف الموقع / الرابط</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  className="bg-gray-50 border-gray-200 h-12"
                  placeholder="مثال: القاعة الكبرى، جامعة ورقلة"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxCapacity" className="text-base text-gray-700 font-bold">السعة القصوى (اختياري)</Label>
                <Input
                  id="maxCapacity"
                  type="number"
                  min="1"
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(e.target.value)}
                  className="bg-gray-50 border-gray-200 h-12"
                  placeholder="مثال: 150"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t mt-2">
              <Label htmlFor="cover" className="text-base text-gray-700 font-bold">صورة الغلاف الرئيسية</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500">رابط خارجي (اختياري)</Label>
                  <Input 
                    id="cover" 
                    type="url"
                    value={coverUrl} 
                    onChange={(e) => setCoverUrl(e.target.value)} 
                    placeholder="https://..."
                    className="bg-gray-50 border-gray-200 h-12"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500">أو ارفع صورة من جهازك</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      onChange={e => setCoverFile(e.target.files?.[0] || null)}
                      className="bg-gray-50 border-gray-200 h-12 pt-2 cursor-pointer"
                    />
                    {coverFile && (
                      <Button type="button" variant="ghost" onClick={() => setCoverFile(null)} className="text-red-500 h-12">
                        <X size={20} />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              {(coverFile || coverUrl) && (
                <div className="mt-2 text-xs font-bold text-emerald-600 bg-emerald-50 p-2 rounded-lg inline-block border border-emerald-100">
                  {coverFile ? `تم اختيار: ${coverFile.name}` : "رابط الصورة نشط حالياً"}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-base text-gray-700 font-bold">معرض الصور (3 صور كحد أقصى)</Label>
              <p className="text-xs text-gray-500 font-medium">سيتم ضغط الصور تلقائياً لتسريع العرض. الأبعاد المفضلة: عرضية.</p>

              <div className="flex items-center gap-4 flex-wrap">
                {galleryFiles.map((f, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 shadow-sm group">
                    <img src={URL.createObjectURL(f)} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeFile(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {galleryFiles.length < 3 && (
                  <Label htmlFor="gallery" className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-50 hover:border-emerald-400 transition-colors">
                    <UploadCloud className="w-6 h-6 text-gray-400" />
                    <span className="text-xs font-bold text-gray-500 mt-1">رفع صورة</span>
                    <input id="gallery" type="file" multiple accept="image/*" onChange={handleFileSelect} className="hidden" />
                  </Label>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-base text-gray-700 font-bold">نوع الفعالية (الخصوصية)</Label>
              <div className="flex gap-4 items-center mt-2">
                <Label className={`flex items-center gap-3 cursor-pointer p-4 rounded-xl border flex-1 transition-all ${isPublic ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white hover:border-emerald-300'}`}>
                  <input type="radio" checked={isPublic} onChange={() => setIsPublic(true)} className="accent-emerald-600 w-5 h-5" />
                  <span className="font-bold text-gray-800 text-lg">عامة (تظهر للجميع)</span>
                </Label>
                <Label className={`flex items-center gap-3 cursor-pointer p-4 rounded-xl border flex-1 transition-all ${!isPublic ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-white hover:border-amber-300'}`}>
                  <input type="radio" checked={!isPublic} onChange={() => setIsPublic(false)} className="accent-amber-600 w-5 h-5" />
                  <span className="font-bold text-gray-800 text-lg">خاصة (برابط فقط)</span>
                </Label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || uploadingCover || uploadingImages}
              className={`w-full h-14 text-lg font-bold rounded-xl transition-all shadow-lg ${forceSave
                ? 'bg-red-600 hover:bg-red-700 shadow-red-600/30'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
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
  );
}
