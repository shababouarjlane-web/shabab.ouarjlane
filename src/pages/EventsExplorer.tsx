import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Search, 
  Share2, 
  Ticket, 
  ArrowRight, 
  Sparkles, 
  Building2, 
  BookOpen, 
  Layers, 
  Grid, 
  List, 
  X
} from 'lucide-react';
import { toast } from 'sonner';

// Helper component for event cover fallback
const EventImageFallback = ({ src, alt }: { src?: string; alt: string; category?: string }) => {
  const [error, setError] = useState(!src);

  if (error || !src) {
    return (
      <div className="w-full h-full bg-gradient-to-tr from-[#301809] via-[#723c11] to-[#b87a29] flex flex-col items-center justify-center p-6 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,168,63,0.15),transparent_70%)]" />
        <div className="w-12 h-12 rounded-2xl bg-[#efa83f]/20 border border-[#efa83f]/40 flex items-center justify-center text-[#efa83f] mb-2 shadow-sm">
          <Calendar size={22} />
        </div>
        <span className="font-thmanyah font-bold text-lg text-[#fae1b7]">وارجلان (ورقلة)</span>
        <span className="text-[11px] text-[#fae1b7]/60 font-medium">منصة تواصل صحراء</span>
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
      onError={() => setError(true)}
    />
  );
};

const CATEGORIES = [
  { id: 'all', label: 'الكل', icon: '✨' },
  { id: 'Heritage', label: 'تراثي وأصالة', icon: '🏺' },
  { id: 'Religious', label: 'ديني وقرآني', icon: '🕌' },
  { id: 'Educational', label: 'تعليمي وتكويني', icon: '📚' },
  { id: 'Cultural', label: 'ثقافي وفني', icon: '🎨' },
  { id: 'Sports', label: 'رياضي وشبابي', icon: '⚽' },
  { id: 'Social', label: 'اجتماعي وخيري', icon: '🤝' },
];

export default function EventsExplorer() {
  const navigate = useNavigate();

  // Data states
  const [events, setEvents] = useState<any[]>([]);
  const [associations, setAssociations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAssociation, setSelectedAssociation] = useState('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'upcoming' | 'today' | 'week' | 'month' | 'past'>('upcoming');
  const [sortBy, setSortBy] = useState<'date_asc' | 'date_desc' | 'title'>('date_asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchEventsAndAssociations();
  }, []);

  const fetchEventsAndAssociations = async () => {
    setLoading(true);
    try {
      // 1. Fetch public active events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*, associations(id, name)')
        .eq('is_public', true)
        .order('date', { ascending: true });

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);

      // 2. Fetch associations list for filtering
      const { data: assocData } = await supabase
        .from('associations')
        .select('id, name')
        .order('name');
      setAssociations(assocData || []);
    } catch (err: any) {
      console.error('Error fetching events:', err);
      toast.error('حدث خطأ أثناء تحميل الفعاليات');
    } finally {
      setLoading(false);
    }
  };

  // Filter & Sort Logic
  const filteredEvents = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date();

    return events
      .filter((ev) => {
        // Search query
        const query = searchQuery.trim().toLowerCase();
        const matchesQuery = !query || 
          ev.title?.toLowerCase().includes(query) ||
          ev.location?.toLowerCase().includes(query) ||
          ev.description?.toLowerCase().includes(query) ||
          ev.associations?.name?.toLowerCase().includes(query);

        // Category
        const matchesCategory = selectedCategory === 'all' || ev.category === selectedCategory;

        // Association
        const matchesAssociation = selectedAssociation === 'all' || ev.associations?.id === selectedAssociation;

        // Date timeframe filter
        let matchesDate = true;
        if (ev.date) {
          const evDate = new Date(ev.date);
          if (dateFilter === 'upcoming') {
            matchesDate = ev.date >= todayStr;
          } else if (dateFilter === 'today') {
            matchesDate = ev.date === todayStr;
          } else if (dateFilter === 'week') {
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);
            matchesDate = evDate >= today && evDate <= nextWeek;
          } else if (dateFilter === 'month') {
            const nextMonth = new Date(today);
            nextMonth.setDate(today.getDate() + 30);
            matchesDate = evDate >= today && evDate <= nextMonth;
          } else if (dateFilter === 'past') {
            matchesDate = ev.date < todayStr;
          }
        }

        return matchesQuery && matchesCategory && matchesAssociation && matchesDate;
      })
      .sort((a, b) => {
        if (sortBy === 'date_asc') {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        } else if (sortBy === 'date_desc') {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        } else {
          return a.title?.localeCompare(b.title, 'ar') || 0;
        }
      });
  }, [events, searchQuery, selectedCategory, selectedAssociation, dateFilter, sortBy]);

  const copyEventShareLink = (e: React.MouseEvent, eventId: string, title: string) => {
    e.stopPropagation();
    const url = `${window.location.origin}/event/${eventId}`;
    navigator.clipboard.writeText(url);
    toast.success(`تم نسخ رابط فعالية "${title}" للمشاركة`);
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedAssociation('all');
    setDateFilter('all');
    setSortBy('date_asc');
  };

  const hasActiveFilters = searchQuery || selectedCategory !== 'all' || selectedAssociation !== 'all' || dateFilter !== 'upcoming';

  const getCategoryBadgeColor = (cat: string) => {
    switch (cat) {
      case 'Heritage': return 'bg-[#fae1b7] text-[#723c11] border-[#d4b174]';
      case 'Religious': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Educational': return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Sports': return 'bg-orange-50 text-orange-800 border-orange-200';
      case 'Cultural': return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'Social': return 'bg-amber-50 text-amber-800 border-amber-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-[#301809] font-sans selection:bg-[#efa83f]/20" dir="rtl">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#fdfbf7]/90 backdrop-blur-md border-b border-[#dbc397]/50 shadow-xs">
        <div className="container mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          
          {/* Logo & Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 p-2 rounded-xl text-[#723c11] hover:bg-[#fae1b7]/40 transition-colors"
              title="العودة للرئيسية"
            >
              <ArrowRight className="w-5 h-5 text-[#b87a29]" />
              <span className="text-sm font-bold hidden sm:inline">الرئيسية</span>
            </button>
            <div className="h-5 w-px bg-[#dbc397]" />
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#301809] to-[#723c11] flex items-center justify-center text-[#efa83f] font-black text-lg shadow-sm">
                و
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-thmanyah font-bold leading-tight text-[#301809]">
                  دليل فعاليات وارجلان
                </h1>
                <p className="text-[10px] text-[#723c11] font-semibold tracking-wider">
                  ⵜⴰⵎⵙⵉⵔⵜ ⵏ ⵡⴰⵔⴵⵍⴰⵏ · استكشف وشارك
                </p>
              </div>
            </div>
          </div>

          {/* Quick Page Links */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/map')}
              className="hidden md:flex items-center gap-1.5 border-[#dbc397] text-[#723c11] hover:bg-[#fae1b7]/40 rounded-xl h-10 px-3.5 text-xs font-bold"
            >
              <MapPin className="w-3.5 h-3.5 text-[#b87a29]" />
              <span>خريطة التراث</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/heritage')}
              className="hidden md:flex items-center gap-1.5 border-[#dbc397] text-[#723c11] hover:bg-[#fae1b7]/40 rounded-xl h-10 px-3.5 text-xs font-bold"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#b87a29]" />
              <span>الأرشيف</span>
            </Button>
            <Button
              onClick={() => navigate('/login')}
              className="bg-[#301809] hover:bg-[#723c11] text-[#fae1b7] rounded-xl h-10 px-4 text-xs font-bold shadow-sm transition-all"
            >
              دخول الحساب
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Banner with Search */}
      <section className="bg-gradient-to-b from-[#fae1b7]/30 via-[#fdfbf7] to-[#fdfbf7] pt-10 pb-8 border-b border-[#dbc397]/30">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl text-center space-y-6">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#fae1b7] border border-[#d4b174]/70 text-xs font-bold text-[#723c11] shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#efa83f]" />
            <span>دليل الفعاليات العامة والأنشطة المجتمعية</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-thmanyah font-bold text-[#301809] leading-tight max-w-3xl mx-auto">
            اكتشف كل ما يحدث في <br />
            <span className="text-[#b87a29]">وارجلان (ورقلة) وحوض سدراتة</span>
          </h2>

          <p className="text-sm sm:text-base text-[#723c11]/80 max-w-2xl mx-auto leading-relaxed">
            استعرض الفعاليات القادمة من مختلف الجمعيات والمؤسسات المحلية، واحصل على تذكرتك الذكية QR فوراً مجاناً بدون تعقيد.
          </p>

          {/* Search Box Input */}
          <div className="max-w-2xl mx-auto relative pt-2">
            <div className="relative flex items-center">
              <Search className="absolute right-4 w-5 h-5 text-[#b87a29]" />
              <Input
                type="text"
                placeholder="ابحث بعنوان الفعالية، اسم الجمعية، أو مكان الانعقاد..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-12 pl-12 h-14 bg-white rounded-2xl border-2 border-[#dbc397] focus-visible:border-[#b87a29] focus-visible:ring-[#efa83f]/20 shadow-md text-sm md:text-base font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs ${
                    isSelected
                      ? 'bg-[#301809] text-[#efa83f] shadow-md scale-105'
                      : 'bg-white text-[#723c11] border border-[#dbc397] hover:bg-[#fae1b7]/40'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

        </div>
      </section>

      {/* Main Content Area */}
      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl space-y-6">
        
        {/* Filters Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-[#dbc397]/50 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Timeframe Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-[#723c11]/70 ml-2 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#b87a29]" />
              <span>الموعد:</span>
            </span>
            {[
              { id: 'upcoming', label: 'القادمة' },
              { id: 'all', label: 'جميع التواريخ' },
              { id: 'today', label: 'اليوم' },
              { id: 'week', label: 'هذا الأسبوع' },
              { id: 'month', label: 'هذا الشهر' },
              { id: 'past', label: 'أرشيف سابق' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setDateFilter(t.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  dateFilter === t.id
                    ? 'bg-[#b87a29] text-white'
                    : 'bg-[#fdfbf7] text-[#723c11] border border-[#dbc397]/60 hover:bg-[#fae1b7]/30'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Right side controls: Association, Sort, View mode */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Association selector */}
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#b87a29]" />
              <select
                value={selectedAssociation}
                onChange={(e) => setSelectedAssociation(e.target.value)}
                className="bg-[#fdfbf7] border border-[#dbc397] rounded-xl px-3 py-1.5 text-xs font-bold text-[#301809] focus:outline-none focus:border-[#b87a29]"
              >
                <option value="all">كل الجمعيات المنظمة</option>
                {associations.map((assoc) => (
                  <option key={assoc.id} value={assoc.id}>
                    {assoc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort selector */}
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#b87a29]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#fdfbf7] border border-[#dbc397] rounded-xl px-3 py-1.5 text-xs font-bold text-[#301809] focus:outline-none focus:border-[#b87a29]"
              >
                <option value="date_asc">الأقرب موعداً</option>
                <option value="date_desc">الأحدث تاريخاً</option>
                <option value="title">أبجدياً (أ-ي)</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="inline-flex items-center bg-[#fdfbf7] p-1 rounded-xl border border-[#dbc397]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-[#301809] text-[#efa83f]' : 'text-slate-400 hover:text-slate-600'}`}
                title="عرض شبكي"
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-[#301809] text-[#efa83f]' : 'text-slate-400 hover:text-slate-600'}`}
                title="عرض أفقي"
              >
                <List size={16} />
              </button>
            </div>

          </div>

        </div>

        {/* Results summary header */}
        <div className="flex items-center justify-between text-xs font-bold text-[#723c11]/80 px-1">
          <div className="flex items-center gap-2">
            <span>تم العثور على <strong className="text-[#301809] text-sm">{filteredEvents.length}</strong> فعالية</span>
            {hasActiveFilters && (
              <span className="bg-[#fae1b7] text-[#723c11] px-2 py-0.5 rounded-md text-[11px]">
                مُصفاة
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="text-[#b87a29] hover:underline flex items-center gap-1 font-bold"
            >
              <X size={13} />
              إعادة ضبط الفلاتر
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-12 h-12 border-3 border-[#b87a29] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-bold text-[#723c11] animate-pulse">جاري تحميل الفعاليات من سدراتة ووارجلان...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-3xl p-12 md:p-16 text-center border-2 border-dashed border-[#dbc397]/60 space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-[#fae1b7]/60 flex items-center justify-center mx-auto text-[#b87a29]">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-thmanyah font-bold text-[#301809]">
              لا توجد فعاليات مطابقة لمعايير البحث الحالية
            </h3>
            <p className="text-xs sm:text-sm text-[#723c11]/80 max-w-md mx-auto">
              جرب البحث بكلمات مختلفة أو إزالة بعض الفلاتر (مثل التاريخ أو التصنيف) لتظهر لك نتائج أوسع.
            </p>
            <div className="pt-2">
              <Button
                onClick={resetAllFilters}
                className="bg-[#301809] hover:bg-[#723c11] text-[#fae1b7] rounded-xl px-5 text-xs font-bold"
              >
                عرض جميع الفعاليات
              </Button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((ev) => (
              <Card
                key={ev.id}
                onClick={() => navigate(`/event/${ev.id}`)}
                className="group overflow-hidden rounded-3xl border border-[#dbc397]/60 bg-white hover:border-[#b87a29] shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col"
              >
                {/* Image */}
                <div className="h-52 relative overflow-hidden bg-slate-100">
                  <EventImageFallback src={ev.cover_image_url} alt={ev.title} category={ev.category} />
                  
                  {/* Category Pill */}
                  {ev.category && (
                    <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[11px] font-bold border shadow-xs ${getCategoryBadgeColor(ev.category)}`}>
                      {ev.category}
                    </div>
                  )}

                  {/* Free Ticket Badge */}
                  <div className="absolute bottom-3 left-3 bg-[#301809]/85 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-[#efa83f] flex items-center gap-1 shadow-xs border border-[#efa83f]/30">
                    <Ticket size={13} />
                    <span>تذكرة QR</span>
                  </div>
                </div>

                {/* Content */}
                <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {ev.associations?.name && (
                      <p className="text-xs font-bold text-[#b87a29] mb-1.5 flex items-center gap-1">
                        <Building2 size={13} />
                        <span>{ev.associations.name}</span>
                      </p>
                    )}
                    <h3 className="text-lg font-thmanyah font-bold text-[#301809] group-hover:text-[#b87a29] transition-colors line-clamp-2 leading-snug">
                      {ev.title}
                    </h3>
                    <p className="text-xs text-[#723c11]/80 mt-2 line-clamp-2 leading-relaxed">
                      {ev.description || 'اضغط لاستكشاف التفاصيل الكاملة وبرنامج الفعالية والموقع...'}
                    </p>
                  </div>

                  {/* Meta Details */}
                  <div className="pt-3 border-t border-[#dbc397]/30 space-y-2 text-xs text-[#723c11]">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-[#efa83f] shrink-0" />
                      <span className="font-semibold">{ev.date}</span>
                      {ev.start_time && (
                        <>
                          <span className="text-[#dbc397]">•</span>
                          <Clock size={14} className="text-[#efa83f] shrink-0" />
                          <span className="font-semibold">{ev.start_time.substring(0, 5)}</span>
                        </>
                      )}
                    </div>
                    {ev.location && (
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-[#b87a29] shrink-0" />
                        <span className="truncate">{ev.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center gap-2">
                    <Button
                      onClick={() => navigate(`/event/${ev.id}`)}
                      className="flex-1 bg-[#301809] hover:bg-[#723c11] text-[#efa83f] font-bold text-xs h-10 rounded-xl shadow-xs"
                    >
                      حجز تذكرة / تفاصيل
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => copyEventShareLink(e, ev.id, ev.title)}
                      className="h-10 w-10 p-0 rounded-xl border-[#dbc397] text-[#723c11] hover:bg-[#fae1b7]/40 shrink-0"
                      title="مشاركة الرابط"
                    >
                      <Share2 size={15} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-4">
            {filteredEvents.map((ev) => (
              <Card
                key={ev.id}
                onClick={() => navigate(`/event/${ev.id}`)}
                className="group overflow-hidden rounded-2xl border border-[#dbc397]/60 bg-white hover:border-[#b87a29] shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row items-stretch"
              >
                {/* Thumbnail */}
                <div className="sm:w-56 h-48 sm:h-auto shrink-0 relative bg-slate-100 overflow-hidden">
                  <EventImageFallback src={ev.cover_image_url} alt={ev.title} category={ev.category} />
                  {ev.category && (
                    <div className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryBadgeColor(ev.category)}`}>
                      {ev.category}
                    </div>
                  )}
                </div>

                {/* Details */}
                <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      {ev.associations?.name && (
                        <p className="text-xs font-bold text-[#b87a29] flex items-center gap-1">
                          <Building2 size={13} />
                          <span>{ev.associations.name}</span>
                        </p>
                      )}
                      <span className="text-[10px] font-bold bg-[#fae1b7] text-[#723c11] px-2 py-0.5 rounded-md">
                        تذكرة QR مجانية
                      </span>
                    </div>

                    <h3 className="text-lg font-thmanyah font-bold text-[#301809] group-hover:text-[#b87a29] transition-colors leading-snug">
                      {ev.title}
                    </h3>
                    <p className="text-xs text-[#723c11]/80 mt-1 line-clamp-2">
                      {ev.description || 'اضغط لمشاهدة التفاصيل الكاملة والموقع...'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#dbc397]/30">
                    <div className="flex items-center gap-4 text-xs text-[#723c11]">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <Calendar size={14} className="text-[#efa83f]" />
                        <span>{ev.date}</span>
                      </div>
                      {ev.location && (
                        <div className="flex items-center gap-1.5 font-medium">
                          <MapPin size={14} className="text-[#b87a29]" />
                          <span className="truncate max-w-[200px]">{ev.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => copyEventShareLink(e, ev.id, ev.title)}
                        className="h-9 px-3 rounded-xl border-[#dbc397] text-[#723c11] hover:bg-[#fae1b7]/40 text-xs font-bold flex items-center gap-1"
                      >
                        <Share2 size={13} />
                        <span>مشاركة</span>
                      </Button>
                      <Button
                        onClick={() => navigate(`/event/${ev.id}`)}
                        className="bg-[#301809] hover:bg-[#723c11] text-[#efa83f] font-bold text-xs h-9 px-4 rounded-xl shadow-xs"
                      >
                        حجز تذكرة
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-[#dbc397]/50 bg-white py-8 text-center text-xs text-[#723c11]/70">
        <div className="container mx-auto px-4 space-y-2">
          <p className="font-bold text-[#301809]">
            منصة تواصل صحراء · وارجلان (ورقلة) وسدراتة
          </p>
          <p className="text-[11px]">
            جميع الحقوق محفوظة لمجتمع شباب وارجلan والجمعيات الشريكة © {new Date().getFullYear()}
          </p>
        </div>
      </footer>

    </div>
  );
}
