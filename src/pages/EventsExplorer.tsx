import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Calendar,
  MapPin,
  Clock,
  Search,
  Share2,
  Ticket,
  Sparkles,
  Building2,
  X,
  Heart,
  SlidersHorizontal,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { getFavoriteEventIds, toggleFavoriteEvent } from '../lib/helpers';
import {
  CATEGORY_ARABIC_LABELS,
  getSavedInterests,
} from '../lib/userInterests';
import UnifiedHeader from '../components/UnifiedHeader';

const EventImageFallback = ({ src, alt }: { src?: string; alt: string }) => {
  const [error, setError] = useState(!src);

  if (error || !src) {
    return (
      <div className="w-full h-full bg-gradient-to-tr from-[#301809] via-[#5c2d10] to-[#b87a29] flex flex-col items-center justify-center p-6 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,168,63,0.2),transparent_70%)]" />
        <div className="w-11 h-11 rounded-2xl bg-[#efa83f]/20 border border-[#efa83f]/40 flex items-center justify-center text-[#efa83f] mb-2">
          <Calendar size={20} />
        </div>
        <span className="font-thmanyah font-bold text-base text-[#fae1b7]">وارجلان (ورقلة)</span>
        <span className="text-[11px] text-[#fae1b7]/65">منصة تواصل صحراء</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      onError={() => setError(true)}
    />
  );
};

const CATEGORIES = [
  { id: 'all', label: 'الكل' },
  { id: 'interests', label: 'حسب اهتماماتي' },
  { id: 'favorites', label: 'المفضلة' },
  { id: 'Heritage', label: 'تراثي وأصالة' },
  { id: 'Religious', label: 'ديني وقرآني' },
  { id: 'Educational', label: 'تعليمي وتكويني' },
  { id: 'Cultural', label: 'ثقافي وفني' },
  { id: 'Sports', label: 'رياضي وشبابي' },
  { id: 'Social', label: 'اجتماعي وخيري' },
];

export default function EventsExplorer() {
  const navigate = useNavigate();

  const [events, setEvents] = useState<any[]>([]);
  const [associations, setAssociations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => getFavoriteEventIds());
  const [userInterests, setUserInterests] = useState<string[]>(() => getSavedInterests());

  // الفلاتر المبسطة
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAssociation, setSelectedAssociation] = useState('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'upcoming' | 'today' | 'week' | 'month' | 'past'>('upcoming');
  const [sortBy, setSortBy] = useState<'date_asc' | 'date_desc' | 'title'>('date_asc');

  useEffect(() => {
    fetchEventsAndAssociations();

    const syncInterests = () => setUserInterests(getSavedInterests());
    window.addEventListener('sahara-interests-updated', syncInterests);
    return () => window.removeEventListener('sahara-interests-updated', syncInterests);
  }, []);

  const handleToggleFav = (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    const added = toggleFavoriteEvent(eventId);
    setFavoriteIds(getFavoriteEventIds());
    toast.success(added ? 'تمت إضافة الفعالية إلى المفضلة' : 'تمت إزالة الفعالية من المفضلة');
  };

  const fetchEventsAndAssociations = async () => {
    setLoading(true);
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*, associations(id, name)')
        .eq('is_public', true)
        .order('date', { ascending: true });

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);

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

  const filteredEvents = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date();

    return events
      .filter((ev) => {
        const query = searchQuery.trim().toLowerCase();
        const matchesQuery =
          !query ||
          ev.title?.toLowerCase().includes(query) ||
          ev.location?.toLowerCase().includes(query) ||
          ev.description?.toLowerCase().includes(query) ||
          ev.associations?.name?.toLowerCase().includes(query);

        const matchesCategory =
          selectedCategory === 'all'
            ? true
            : selectedCategory === 'favorites'
            ? favoriteIds.includes(ev.id)
            : selectedCategory === 'interests'
            ? userInterests.length === 0 || userInterests.includes(ev.category)
            : ev.category === selectedCategory;

        const matchesAssociation =
          selectedAssociation === 'all' || ev.associations?.id === selectedAssociation;

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
        }
        if (sortBy === 'date_desc') {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        return a.title?.localeCompare(b.title, 'ar') || 0;
      });
  }, [events, searchQuery, selectedCategory, selectedAssociation, dateFilter, sortBy, favoriteIds, userInterests]);

  const copyEventShareLink = async (e: React.MouseEvent, eventId: string, title: string) => {
    e.stopPropagation();
    const url = `${window.location.origin}/event/${eventId}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `فعالية: ${title}`,
          text: `ندعوكم لحضور فعالية "${title}" في ورقلة عبر منصة تواصل صحراء:`,
          url,
        });
        return;
      } catch {
        // fallback
      }
    }
    navigator.clipboard.writeText(url);
    toast.success(`تم نسخ رابط فعالية "${title}" للمشاركة`);
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedAssociation('all');
    setDateFilter('upcoming');
    setSortBy('date_asc');
  };

  const hasActiveFilters =
    Boolean(searchQuery) ||
    selectedCategory !== 'all' ||
    selectedAssociation !== 'all' ||
    dateFilter !== 'upcoming';

  return (
    <div
      className="min-h-screen bg-[#fdfbf7] bg-[radial-gradient(ellipse_at_top,_rgba(239,168,63,0.12),_transparent_55%)] text-[#301809] flex flex-col"
      dir="rtl"
    >
      <UnifiedHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-7 sm:py-10 space-y-6">
        {/* ── 1. الرأس المدمج مع البحث بهوية تواصل صحراء ── */}
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-l from-[#301809] via-[#4a250e] to-[#2b1507] p-6 sm:p-8 shadow-[0_18px_48px_rgba(48,24,9,0.2)] ring-1 ring-[#efa83f]/30 space-y-5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(239,168,63,0.2),_transparent_60%)]" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-thmanyah font-bold text-white">
                دليل{' '}
                <span className="bg-gradient-to-l from-[#fae1b7] to-[#efa83f] bg-clip-text text-transparent">
                  الفعاليات
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-[#fae1b7]/80 max-w-xl">
                اكتشف الأنشطة واللقاءات المجتمعية في وارجلان وسدراتة واحجز تذكرتك الذكية QR مجاناً.
              </p>
            </div>

            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('sahara-open-interests-modal'))}
              className="self-start md:self-auto px-4 py-2.5 rounded-xl bg-[#efa83f]/20 hover:bg-[#efa83f]/30 border border-[#efa83f]/40 text-[#fae1b7] text-xs font-thmanyah font-bold flex items-center gap-2 transition-colors cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#efa83f]" />
              <span>
                {userInterests.length > 0
                  ? `اهتماماتي (${userInterests.length})`
                  : 'تخصيص اهتماماتي'}
              </span>
            </button>
          </div>

          {/* شريط البحث النظيف داخل الرأس */}
          <div className="relative z-10 bg-[#fdfbf7] rounded-2xl p-1.5 flex items-center gap-2 shadow-[0_12px_30px_rgba(0,0,0,0.25)] ring-1 ring-[#efa83f]/40 focus-within:ring-2 focus-within:ring-[#efa83f] transition-all">
            <Search className="w-5 h-5 text-[#b87a29] mr-3 shrink-0" />
            <input
              type="text"
              placeholder="ابحث بعنوان الفعالية، اسم الجمعية، أو مكان الانعقاد..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 h-10 bg-transparent text-sm sm:text-base text-[#301809] placeholder:text-[#723c11]/55 focus:outline-none min-w-0"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="w-8 h-8 rounded-full hover:bg-[#fae1b7]/60 text-[#723c11] flex items-center justify-center shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </section>

        {/* ── 2. شريط التصنيفات الهادئ + فلاتر مختصرة في سطر واحد ── */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((cat) => {
              if (cat.id === 'interests' && userInterests.length === 0) return null;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-full text-xs font-thmanyah font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#301809] text-[#fae1b7] shadow-sm'
                      : 'bg-white hover:bg-[#fae1b7]/55 text-[#301809] border border-[#dbc397]'
                  }`}
                >
                  {cat.id === 'interests' && <Sparkles className="w-3 h-3 text-[#efa83f]" />}
                  {cat.id === 'favorites' && <Heart className="w-3 h-3 text-rose-500" />}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 bg-white border border-[#dbc397] rounded-xl px-3 py-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#b87a29]" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="bg-transparent text-xs font-thmanyah font-bold text-[#301809] focus:outline-none cursor-pointer"
                >
                  <option value="upcoming">الفعاليات القادمة</option>
                  <option value="today">اليوم</option>
                  <option value="week">هذا الأسبوع</option>
                  <option value="month">هذا الشهر</option>
                  <option value="all">كل التواريخ</option>
                  <option value="past">أرشيف سابق</option>
                </select>
              </div>

              <div className="inline-flex items-center gap-1.5 bg-white border border-[#dbc397] rounded-xl px-3 py-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#b87a29]" />
                <select
                  value={selectedAssociation}
                  onChange={(e) => setSelectedAssociation(e.target.value)}
                  className="bg-transparent text-xs font-thmanyah font-bold text-[#301809] focus:outline-none cursor-pointer max-w-[180px]"
                >
                  <option value="all">كل الجمعيات</option>
                  {associations.map((assoc) => (
                    <option key={assoc.id} value={assoc.id}>
                      {assoc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="inline-flex items-center gap-1.5 bg-white border border-[#dbc397] rounded-xl px-3 py-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#b87a29]" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-xs font-thmanyah font-bold text-[#301809] focus:outline-none cursor-pointer"
                >
                  <option value="date_asc">الأقرب موعداً</option>
                  <option value="date_desc">الأحدث تاريخاً</option>
                  <option value="title">أبجدياً</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-[#723c11]">
              <span>
                <strong className="text-[#301809]">{filteredEvents.length}</strong> فعالية
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-[#b87a29] hover:text-[#301809] font-thmanyah font-bold flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>مسح الفلاتر</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── 3. شبكة بطاقات الفعاليات النظيفة ── */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-[#b87a29] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-thmanyah font-bold text-[#723c11]">
              جاري تحميل الفعاليات...
            </p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white rounded-[28px] p-12 text-center border border-[#dbc397] space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#fae1b7]/60 flex items-center justify-center mx-auto text-[#b87a29]">
              <Calendar className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-thmanyah font-bold text-[#301809]">
              لا توجد فعاليات مطابقة لبحثك حالياً
            </h3>
            <p className="text-xs text-[#723c11]/80 max-w-md mx-auto">
              جرّب تغيير التصنيف أو إعادة ضبط الفلاتر لعرض جميع الفعاليات المتاحة.
            </p>
            <button
              type="button"
              onClick={resetAllFilters}
              className="px-5 py-2.5 rounded-xl bg-[#301809] hover:bg-[#4a250e] text-[#fae1b7] text-xs font-thmanyah font-bold cursor-pointer transition-colors"
            >
              عرض جميع الفعاليات
            </button>
          </div>
        ) : (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredEvents.map((ev) => {
              const arabicCat = CATEGORY_ARABIC_LABELS[ev.category] || 'نشاط مجتمعي';
              const isMatchedInterest = userInterests.includes(ev.category);

              return (
                <article
                  key={ev.id}
                  onClick={() => navigate(`/event/${ev.id}`)}
                  className="group bg-white rounded-[24px] border border-[#e3d4b8] hover:border-[#b87a29] shadow-[0_6px_24px_rgba(48,24,9,0.05)] hover:shadow-[0_14px_38px_rgba(48,24,9,0.12)] overflow-hidden transition-all duration-300 cursor-pointer flex flex-col"
                >
                  {/* غلاف الفعالية */}
                  <div className="h-48 relative overflow-hidden bg-[#301809]">
                    <EventImageFallback src={ev.cover_image_url} alt={ev.title} />

                    {/* شارة التصنيف بالعربية */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                      <span className="px-2.5 py-1 rounded-full bg-[#fdfbf7]/95 backdrop-blur-md text-[#301809] text-[11px] font-thmanyah font-bold shadow-sm">
                        {arabicCat}
                      </span>
                      {isMatchedInterest && (
                        <span className="px-2 py-1 rounded-full bg-[#efa83f] text-[#301809] text-[10px] font-thmanyah font-bold shadow-sm">
                          يناسب اهتمامك
                        </span>
                      )}
                    </div>

                    {/* زر المفضلة */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleFav(e, ev.id)}
                      className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white backdrop-blur-sm flex items-center justify-center shadow-sm transition-transform hover:scale-110 z-10 cursor-pointer"
                      title={favoriteIds.includes(ev.id) ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                    >
                      <Heart
                        size={15}
                        className={
                          favoriteIds.includes(ev.id)
                            ? 'fill-rose-500 text-rose-500'
                            : 'text-[#723c11]'
                        }
                      />
                    </button>

                    {/* شارة تذكرة QR */}
                    <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-[#301809]/85 backdrop-blur-md text-[#fae1b7] text-[10px] font-thmanyah font-bold flex items-center gap-1">
                      <Ticket className="w-3 h-3 text-[#efa83f]" />
                      <span>تذكرة QR مجانية</span>
                    </div>
                  </div>

                  {/* تفاصيل البطاقة */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2.5">
                      {ev.associations?.name && (
                        <p className="text-[11px] font-thmanyah font-bold text-[#b87a29] truncate">
                          {ev.associations.name}
                        </p>
                      )}

                      <h3 className="text-base font-thmanyah font-bold text-[#301809] group-hover:text-[#723c11] transition-colors line-clamp-2 leading-snug">
                        {ev.title}
                      </h3>

                      <div className="space-y-1.5 text-xs text-[#723c11]/85 pt-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[#b87a29] shrink-0" />
                          <span>{ev.date}</span>
                          {ev.time && (
                            <>
                              <span className="text-[#dbc397]">•</span>
                              <Clock className="w-3.5 h-3.5 text-[#b87a29] shrink-0" />
                              <span>{ev.time}</span>
                            </>
                          )}
                        </div>
                        {ev.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-[#b87a29] shrink-0" />
                            <span className="truncate">{ev.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#f2e8d5] flex items-center justify-between gap-2">
                      <span className="text-xs font-thmanyah font-bold text-[#301809] group-hover:text-[#b87a29] flex items-center gap-1.5 transition-colors">
                        <span>التفاصيل والحجز</span>
                        <ArrowLeft className="w-3.5 h-3.5 text-[#b87a29] group-hover:-translate-x-0.5 transition-transform" />
                      </span>

                      <button
                        type="button"
                        onClick={(e) => copyEventShareLink(e, ev.id, ev.title)}
                        className="p-2 rounded-xl bg-[#fdfbf7] hover:bg-[#fae1b7]/60 border border-[#e5d8c0] text-[#723c11] hover:text-[#301809] transition-colors cursor-pointer"
                        title="مشاركة الفعالية"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
