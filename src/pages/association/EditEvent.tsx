import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { useToast } from '../../hooks/use-toast';
import { AlertCircle, Edit, CheckCircle2, UploadCloud, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import imageCompression from 'browser-image-compression';

export default function EditEvent() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
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
  const [existingGalleryUrls, setExistingGalleryUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [forceSave, setForceSave] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      if (!id) return;
      const { data: eventData, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      if (eventData) {
        setTitle(eventData.title || '');
        setDescription(eventData.description || '');
        setDate(eventData.date || '');
        setStartTime(eventData.start_time || '');
        setEndTime(eventData.end_time || '');
        setLocation(eventData.location || '');
        setCoverUrl(eventData.cover_image_url || '');
        setMaxCapacity(eventData.max_capacity ? eventData.max_capacity.toString() : '');
        setExistingGalleryUrls(eventData.gallery_urls || []);
        setIsPublic(eventData.is_public ?? true);
        setCategory(eventData.category || 'Other');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطأ في الجلب",
        description: "تعذر تحميل تفاصيل الفعالية.",
      });
      navigate('/association');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (startTime >= endTime) {
      toast({ variant: "destructive", title: "خطأ في الوقت", description: "وقت النهاية يجب أن يكون بعد وقت البداية." });
      return;
    }

    if (existingGalleryUrls.length + galleryFiles.length > 3) {
      toast({ variant: "destructive", title: "خطأ في الصور", description: "الحد الأقصى لمعرض الصور هو 3 صور." });
      return;
    }

    setLoading(true);

    try {
      if (!forceSave) {
        // Step 1: Conflict Detection (excluding current event)
        const { data: conflicts, error: conflictError } = await supabase
          .from('events')
          .select('id, title, start_time, end_time')
          .eq('date', date)
          .neq('id', id);

        if (conflictError) throw conflictError;

        if (conflicts && conflicts.length > 0) {
          const hasOverlap = conflicts.some(c => {
            return (startTime < c.end_time) && (endTime > c.start_time);
          });

          if (hasOverlap) {
            setConflictWarning('تنبيه: يوجد تعارض زمني مع فعاليات أخرى في نفس اليوم والوقت. هل أنت متأكد من رغبتك في تعديل الفعالية؟');
            setForceSave(true);
            setLoading(false);
            return;
          }
        }
      }

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

      // Step 2.5: Optimize and Upload New Images
      setUploadingImages(true);
      let newUploadedUrls: string[] = [];

      for (const file of galleryFiles) {
        try {
          const compressedFile = await imageCompression(file, options);
          const ext = file.name.split('.').pop() || 'jpg';
          const filePath = `gallery/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
          
          const { error: uploadError } = await supabase.storage.from('events').upload(filePath, compressedFile);
          if (uploadError) throw new Error('فشل رفع الصور إلى خادم التخزين.');
          
          const { data: publicData } = supabase.storage.from('events').getPublicUrl(filePath);
          newUploadedUrls.push(publicData.publicUrl);
        } catch (imgErr: any) {
          throw new Error('فشل رفع إحدى الصور: ' + imgErr.message);
        }
      }
      setUploadingImages(false);

      const finalGalleryUrls = [...existingGalleryUrls, ...newUploadedUrls];

      // Step 2: Update Event
      const { error: updateError } = await supabase
        .from('events')
        .update({
          title,
          description,
          date,
          start_time: startTime,
          end_time: endTime,
          location,
          category,
          cover_image_url: finalCoverUrl || null,
          max_capacity: maxCapacity ? parseInt(maxCapacity) : null,
          gallery_urls: finalGalleryUrls,
          is_public: isPublic
        })
        .eq('id', id);

      if (updateError) throw updateError;

      toast({
        title: "تم التعديل بنجاح",
        description: "تم تحديث تفاصيل الفعالية بنجاح.",
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
      if (existingGalleryUrls.length + galleryFiles.length + newFiles.length > 3) {
        toast({ variant: "destructive", title: "تجاوز الحد", description: "يمكنك رفع 3 صور كحد أقصى." });
        return;
      }
      setGalleryFiles([...galleryFiles, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setGalleryFiles(galleryFiles.filter((_, i) => i !== index));
  };

  const removeExistingUrl = (index: number) => {
    setExistingGalleryUrls(existingGalleryUrls.filter((_, i) => i !== index));
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center text-[#723c11] font-bold py-20 text-lg">
        جاري تحميل تفاصيل الفعالية...
      </div>
    );
  }

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
            تعديل بيانات الفعالية
          </span>
        </div>

        <Card className="border-2 border-[#dbc397]/70 shadow-xl rounded-3xl overflow-hidden bg-white">
          <div className="bg-gradient-to-l from-[#301809] via-[#723c11] to-[#301809] p-7 md:p-8 text-white relative overflow-hidden border-b-4 border-[#efa83f]">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#efa83f_1px,transparent_1px)] [background-size:16px_16px]" />
            <Edit className="absolute left-6 top-1/2 -translate-y-1/2 w-24 h-24 text-[#efa83f] opacity-20 pointer-events-none" />
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#efa83f] bg-[#efa83f]/15 px-3 py-1 rounded-full mb-2 border border-[#efa83f]/30">
                ✏️ تحديث الفعالية
              </span>
              <CardTitle className="text-2xl md:text-3xl font-black text-[#fae1b7] tracking-tight">تعديل الفعالية</CardTitle>
              <CardDescription className="text-[#dbc397] text-sm md:text-base mt-1 font-medium">قم بتحديث معلومات وجدولة الفعالية وتفاصيل الحضور</CardDescription>
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-black text-[#301809]">وصف مفصل</Label>
                <Textarea 
                  id="description" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  className="bg-[#fdfbf7] border-2 border-[#dbc397] focus-visible:border-[#b87a29] rounded-xl min-h-[120px] font-medium"
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
                    {coverFile ? `تم اختيار: ${coverFile.name}` : "رابط الصورة نشط حالياً"}
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-2">
                <Label className="text-sm font-black text-[#301809] block">معرض الصور الإضافية (3 صور كحد أقصى)</Label>
                <p className="text-xs text-[#723c11]/80 font-medium">سيتم ضغط الصور الجديدة تلقائياً لتسريع العرض. الأبعاد المفضلة: عرضية.</p>
                
                <div className="flex items-center gap-4 flex-wrap">
                  {existingGalleryUrls.map((url, i) => (
                    <div key={`ext-${i}`} className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#dbc397] shadow-sm group">
                      <img src={url} alt="Existing" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeExistingUrl(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-0 inset-x-0 bg-[#301809]/80 text-[10px] text-[#fae1b7] font-bold text-center py-0.5">حالية</div>
                    </div>
                  ))}
                  
                  {galleryFiles.map((f, i) => (
                    <div key={`new-${i}`} className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#dbc397] shadow-sm group">
                      <img src={URL.createObjectURL(f)} alt="Preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeFile(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-0 inset-x-0 bg-[#b87a29]/90 text-[10px] text-white font-bold text-center py-0.5">جديدة</div>
                    </div>
                  ))}
                  
                  {(existingGalleryUrls.length + galleryFiles.length) < 3 && (
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
                className={`w-full h-14 text-lg font-black rounded-2xl transition-all shadow-md ${
                  forceSave 
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/30' 
                  : 'bg-gradient-to-r from-[#b87a29] to-[#efa83f] hover:from-[#723c11] hover:to-[#b87a29] text-[#301809] hover:text-[#fae1b7] shadow-[#b87a29]/30'
                }`}
              >
                {loading ? (uploadingCover ? "جاري رفع صورة الغلاف..." : uploadingImages ? "جاري ضغط ورفع الصور..." : "جاري المعالجة...") : forceSave ? (
                  <><CheckCircle2 className="mr-2 h-5 w-5" /> تأكيد الحفظ بالرغم من التعارض</>
                ) : (
                  "حفظ التعديلات"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
