import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
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
  Building2,
  Sparkles,
  Tag
} from 'lucide-react';
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
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');

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

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#fdfbf7]/95 backdrop-blur-md border-b border-[#dbc397]/50 shadow-xs">
        <div className="container mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">

          {/* Back to Home Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 p-2 px-3 rounded-xl text-[#723c11] hover:bg-[#fae1b7]/40 transition-colors group"
              title="العودة للصفحة الرئيسية"
            >
              <ArrowRight className="w-5 h-5 text-[#b87a29] group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-sm font-bold text-[#301809]">الرئيسية</span>
            </button>
            <div className="h-5 w-px bg-[#dbc397]" />
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#301809] to-[#723c11] flex items-center justify-center text-[#efa83f] font-black text-base shadow-sm">
                ت
              </div>
              <div className="hidden sm:block">
                <h2 className="text-sm font-thmanyah font-bold leading-tight text-[#301809]">
                  الأرشيف التراثي لوارجلان
                </h2>
                <p className="text-[10px] text-[#723c11]/80 font-semibold tracking-wider">
                  سجل ذاكرة الواحات وسدراتة
                </p>
              </div>
            </div>
          </div>

          {/* Quick Page Links */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              onClick={() => setSuggestOpen(true)}
              size="sm"
              className="bg-gradient-to-r from-[#b87a29] to-[#efa83f] hover:from-[#723c11] hover:to-[#b87a29] text-white rounded-xl h-9 px-3.5 text-xs font-black gap-1.5 shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>اقترح معلماً تراثياً</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/associations')}
              className="hidden md:flex items-center gap-1.5 border-[#dbc397] text-[#723c11] hover:bg-[#fae1b7]/40 rounded-xl h-9 px-3.5 text-xs font-bold"
            >
              <Building2 className="w-3.5 h-3.5 text-[#b87a29]" />
              <span>دليل الجمعيات</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/events')}
              className="hidden sm:flex items-center gap-1.5 border-[#dbc397] text-[#723c11] hover:bg-[#fae1b7]/40 rounded-xl h-9 px-3.5 text-xs font-bold"
            >
              <Calendar className="w-3.5 h-3.5 text-[#b87a29]" />
              <span>دليل الفعاليات</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/map')}
              className="flex items-center gap-1.5 border-[#dbc397] text-[#723c11] hover:bg-[#fae1b7]/40 rounded-xl h-9 px-3.5 text-xs font-bold"
            >
              <MapPin className="w-3.5 h-3.5 text-[#b87a29]" />
              <span>خريطة التراث</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative h-[450px] flex items-center justify-center overflow-hidden">
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

        <div className="relative z-10 text-center px-4 max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-[#efa83f]/20 backdrop-blur-md px-4 py-2 rounded-full border border-[#efa83f]/40 text-[#efa83f] mb-6 animate-in fade-in slide-in-from-top-4 duration-1000">
            <BookOpen className="w-4 h-4" />
            <span className="text-sm font-black tracking-wider uppercase">سجل الذاكرة الجماعية</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-5 drop-shadow-2xl tracking-tight">
            الأرشيف التراثي لوارجلان (ورقلة)
          </h1>
          <p className="text-lg md:text-2xl text-[#fae1b7] font-medium leading-relaxed drop-shadow-md mb-6">
            نافذتكم على كنوز حوض سدراتة.. نحفظ التاريخ لنلهم المستقبل.
          </p>
          <Button
            onClick={() => setSuggestOpen(true)}
            className="bg-[#efa83f] hover:bg-[#b87a29] text-[#301809] hover:text-white font-black px-6 py-5 rounded-2xl text-sm shadow-xl gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" /> شارك في إثراء الأرشيف (اقترح معلماً أو وثيقة تاريخية)
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 -mt-20 relative z-20 pb-20">
        {/* Search Bar & Category Filter Pills */}
        <div className="mb-10 space-y-4">
          <div className="relative group max-w-4xl mx-auto">
            <Search className="absolute right-5 top-1/2 -translate-y-1/2 h-6 w-6 text-[#b87a29] transition-colors group-focus-within:text-[#efa83f]" />
            <Input
              placeholder="ابحث في سجلات التراث... (مثال: قصور، سدراتة، حرف تقليدية، مخطوطات، لالة عزيزة)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/95 backdrop-blur-md shadow-xl border-2 border-[#dbc397]/70 focus-visible:ring-[#efa83f] focus-visible:border-[#b87a29] h-16 pr-16 pl-14 rounded-2xl text-base md:text-lg font-bold placeholder:text-[#301809]/40"
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

        {/* Interactive Satellite Heritage Map Banner */}
        <div
          onClick={() => navigate('/map')}
          className="cursor-pointer mb-12 rounded-3xl bg-gradient-to-r from-[#301809] via-[#4a2711] to-[#723c11] p-6 md:p-8 border border-[#efa83f]/40 shadow-xl relative overflow-hidden group hover:border-[#efa83f]/80 hover:shadow-glow-amber transition-all duration-300"
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
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => shareArticleWhatsApp(selectedItem)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl gap-2 h-11 px-5"
                  >
                    <Share2 className="w-4 h-4" /> مشاركة عبر واتساب
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
