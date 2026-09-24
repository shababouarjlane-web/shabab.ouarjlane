import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
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
  BookOpen
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
} from '../components/ui/dialog';

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
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching heritage:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    return items.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, items]);

  return (
    <div className="min-h-screen bg-[#faf9f6]" dir="rtl">
      {/* Dynamic Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/sandpaper.png")' }} />

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
          <div className="inline-flex items-center gap-2 bg-[#efa83f]/20 backdrop-blur-md px-4 py-2 rounded-full border border-[#efa83f]/40 text-[#efa83f] mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
            <BookOpen className="w-4 h-4" />
            <span className="text-sm font-black tracking-wider uppercase">سجل الذاكرة الجماعية</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 drop-shadow-2xl tracking-tight">
            الأرشيف التراثي لوارجلان (ورقلة)
          </h1>
          <p className="text-xl md:text-2xl text-[#fae1b7] font-medium leading-relaxed drop-shadow-md">
            نافذتكم على كنوز حوض سدراتة.. نحفظ التاريخ لنلهم المستقبل.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 -mt-24 relative z-20 pb-20">
        {/* Search & Navigation Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-12 items-stretch md:items-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)} 
            className="bg-white/90 backdrop-blur-md shadow-lg hover:bg-white text-[#301809] font-black rounded-2xl px-8 h-14 border border-[#dbc397]/50 shrink-0"
          >
            <ArrowRight className="ml-2 h-5 w-5 text-[#b87a29]" /> عودة
          </Button>

          <div className="relative flex-1 group">
            <Search className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#b87a29] transition-colors group-focus-within:text-[#efa83f]" />
            <Input 
              placeholder="ابحث في سجلات التراث... (مثال: تقاليد، مقتنيات، سدراتة)" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/90 backdrop-blur-md shadow-lg border-[#dbc397]/50 focus-visible:ring-[#efa83f] focus-visible:border-[#efa83f] h-14 pr-14 pl-12 rounded-2xl text-lg font-bold placeholder:text-[#301809]/40"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute left-5 top-1/2 -translate-y-1/2 hover:text-red-500 text-gray-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
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
          <div className="bg-white/50 backdrop-blur-sm rounded-[3rem] p-24 text-center shadow-inner border-2 border-dashed border-amber-200 animate-in fade-in zoom-in duration-500">
            <div className="bg-amber-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
              <Archive className="w-12 h-12 text-amber-400" />
            </div>
            <h3 className="text-3xl font-black text-slate-800 mb-4">{searchQuery ? 'لم يتم العثور على نتائج' : 'الأرشيف قيد النمو'}</h3>
            <p className="text-slate-500 max-w-md mx-auto leading-relaxed text-lg font-medium">
              {searchQuery ? `لم نجد مقالات تطابق "${searchQuery}" في سجلاتنا حالياً.` : 'نعمل حالياً على توثيق المزيد من الكنوز التراثية. شاركونا قصصكم!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item) => (
              <Card 
                key={item.id} 
                className="group overflow-hidden rounded-[2.5rem] border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-white flex flex-col h-[520px] cursor-pointer ring-1 ring-amber-50"
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
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md text-amber-900 px-5 py-2 rounded-2xl text-xs font-black shadow-xl border border-amber-100 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    {new Date(item.created_at).toLocaleDateString('ar-DZ')}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <CardContent className="p-8 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest mb-4">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    تراث وارجلان (ورقلة)
                  </div>
                  
                  <h3 className="text-2xl font-black text-slate-800 mb-4 group-hover:text-amber-700 transition-colors line-clamp-2 leading-tight">
                    {item.title}
                  </h3>
                  
                  <p className="text-slate-500 leading-relaxed line-clamp-3 text-lg font-medium mb-6">
                    {item.content}
                  </p>
                  
                  <div className="mt-auto pt-6 border-t border-amber-50 flex items-center justify-between">
                    <div className="flex items-center text-slate-400 font-bold group-hover:text-amber-800 transition-colors">
                      <MapPin className="ml-2 h-4 w-4" />
                      <span className="text-xs uppercase">الواحة</span>
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

      {/* Details Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-[3rem] border-none bg-white shadow-2xl animate-in zoom-in-95 duration-300">
          {selectedItem && (
            <div className="flex flex-col h-[90vh] md:h-auto max-h-[90vh]">
              {/* Cover Image & Header Overlay */}
              <div className="h-64 md:h-[450px] w-full relative shrink-0">
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
                
                <div className="absolute bottom-10 right-10 left-10 text-right z-20" dir="rtl">
                   <div className="flex items-center gap-3 mb-6">
                      <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md text-slate-900 px-4 py-2 rounded-2xl text-xs font-black shadow-xl">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                        {new Date(selectedItem.created_at).toLocaleDateString('ar-DZ')}
                      </div>
                      <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md text-slate-900 px-4 py-2 rounded-2xl text-xs font-black shadow-xl">
                        <Clock className="w-4 h-4 text-amber-600" />
                        {new Date(selectedItem.created_at).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                   </div>
                   <DialogTitle className="text-3xl md:text-6xl font-black text-slate-900 drop-shadow-sm leading-tight">
                    {selectedItem.title}
                   </DialogTitle>
                </div>
              </div>

              {/* Scrollable Content Body */}
              <div className="flex-1 overflow-y-auto p-8 md:p-14 text-right bg-[#faf9f6]" dir="rtl">
                <div className="max-w-3xl mx-auto">
                  <div className="flex items-center gap-3 text-emerald-700 font-black mb-10 bg-emerald-50 inline-flex px-6 py-3 rounded-2xl border border-emerald-100 shadow-sm">
                    <History className="w-5 h-5" />
                    <span className="text-lg">سلسلة كنوز وارجلان (ورقلة) وحوض سدراتة</span>
                  </div>
                  
                  <div className="text-slate-700 text-xl md:text-2xl leading-[1.8] whitespace-pre-wrap font-medium tracking-tight">
                    {selectedItem.content}
                  </div>
                  
                  {/* Article Footer Decoration */}
                  <div className="mt-20 pt-10 border-t border-amber-100 flex flex-col items-center gap-6">
                     <div className="w-12 h-1 bg-amber-200 rounded-full" />
                     <p className="text-amber-800/40 text-sm font-black tracking-widest uppercase">تم الانتهاء من القراءة</p>
                  </div>
                </div>
              </div>

              {/* Modal Footer (Action Panel) */}
              <div className="p-8 border-t bg-white flex justify-between items-center px-12 shrink-0">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                       <MapPin className="w-5 h-5" />
                    </div>
                    <span className="font-black text-slate-700">منطقة الواحات، وارجلان (ورقلة)</span>
                 </div>
                 <Button 
                   onClick={() => setIsDialogOpen(false)} 
                   className="bg-slate-900 hover:bg-black text-white font-black rounded-2xl px-12 h-14 text-lg shadow-xl"
                 >
                   إغلاق المقال
                 </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quote Footer Section */}
      <footer className="bg-slate-950 text-white py-32 text-center relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <History className="w-12 h-12 text-amber-500 mx-auto mb-10 opacity-50" />
          <p className="text-3xl md:text-5xl font-serif italic mb-12 opacity-90 leading-tight max-w-4xl mx-auto">
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
