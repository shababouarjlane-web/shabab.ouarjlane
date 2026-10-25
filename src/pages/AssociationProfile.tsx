import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import {
  Building2,
  Calendar,
  MapPin,
  Users,
  Share2,
  ArrowRight,
  Phone,
  Globe,
  CheckCircle2,
  Sparkles,
  Image as ImageIcon,
  Clock,
  Star,
  Loader2,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { parseAssociationMeta, parseGalleryAndReviews } from '../lib/helpers';

export default function AssociationProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [association, setAssociation] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchAssociationData(id);
    }
  }, [id]);

  const fetchAssociationData = async (assocId: string) => {
    setLoading(true);
    try {
      const { data: assocData, error: assocErr } = await supabase
        .from('associations')
        .select('*')
        .eq('id', assocId)
        .maybeSingle();

      if (assocErr || !assocData) {
        toast.error('لم يتم العثور على صفحة الجمعية');
        navigate('/events');
        return;
      }

      setAssociation(assocData);

      const { data: eventsData } = await supabase
        .from('events')
        .select('*, rsvps(count)')
        .eq('association_id', assocId)
        .eq('is_public', true)
        .order('date', { ascending: false });

      setEvents(eventsData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex flex-col items-center justify-center gap-3" dir="rtl">
        <Loader2 className="w-10 h-10 animate-spin text-[#b87a29]" />
        <p className="text-sm font-bold text-[#723c11]">جاري تحميل الملف التعريفي للجمعية...</p>
      </div>
    );
  }

  if (!association) return null;

  const meta = parseAssociationMeta(association.description);
  const todayStr = new Date().toISOString().split('T')[0];

  const upcomingEvents = events.filter(e => e.status === 'active' && e.date >= todayStr);
  const pastEvents = events.filter(e => e.status === 'archived' || e.date < todayStr);
  const totalRsvps = events.reduce((sum, ev) => sum + (ev.rsvps?.[0]?.count || 0), 0);

  // Aggregate all photos & reviews across all events of this association
  const allPhotos: { url: string; eventTitle: string; eventId: string }[] = [];
  let totalReviewsCount = 0;
  let totalRatingSum = 0;

  events.forEach(ev => {
    const { photos, reviews } = parseGalleryAndReviews(ev.gallery_urls);
    photos.forEach(url => allPhotos.push({ url, eventTitle: ev.title, eventId: ev.id }));
    reviews.forEach(r => {
      totalReviewsCount += 1;
      totalRatingSum += Number(r.rating) || 5;
    });
  });

  const avgRating = totalReviewsCount > 0 ? (totalRatingSum / totalReviewsCount).toFixed(1) : '5.0';

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'Heritage': return 'تراث وأصالة';
      case 'Sports': return 'رياضي وشبابي';
      case 'Educational': return 'تعليمي وتدريبي';
      case 'Religious': return 'ديني ومناسباتي';
      case 'Cultural': return 'ثقافي وفكري';
      default: return 'نشاط عام';
    }
  };

  const handleShareProfile = () => {
    const url = window.location.href;
    const text = `🏛️ تعرف على أنشطة وفعاليات *${association.name}* عبر منصة تواصل صحراء - وارجلان:\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('تم نسخ رابط صفحة الجمعية بنجاح!');
  };

  const renderEventCard = (ev: any) => {
    const rsvpCount = ev.rsvps?.[0]?.count || 0;
    const { photos } = parseGalleryAndReviews(ev.gallery_urls);
    return (
      <Card
        key={ev.id}
        onClick={() => navigate(`/event/${ev.id}`)}
        className="overflow-hidden border-2 border-[#dbc397]/70 hover:border-[#b87a29] rounded-3xl bg-white shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col justify-between"
      >
        <div>
          <div className="h-48 relative overflow-hidden bg-[#fdfbf7] border-b border-[#dbc397]/40">
            {ev.cover_image_url ? (
              <img
                src={ev.cover_image_url}
                alt={ev.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#301809] via-[#723c11] to-[#b87a29] flex flex-col items-center justify-center text-[#fae1b7] p-4 text-center">
                <span className="text-3xl mb-1">🏺</span>
                <span className="font-thmanyah font-bold text-base">{association.name}</span>
              </div>
            )}
            <div className="absolute top-3 right-3 bg-[#301809]/85 backdrop-blur-md text-[#fae1b7] text-[11px] font-bold px-3 py-1 rounded-full border border-[#dbc397]/40">
              {getCategoryLabel(ev.category)}
            </div>
            {photos.length > 0 && (
              <div className="absolute bottom-3 left-3 bg-black/70 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                <ImageIcon className="w-3 h-3 text-[#efa83f]" />
                <span>{photos.length} صور تغطية</span>
              </div>
            )}
          </div>

          <CardContent className="p-5">
            <h3 className="font-thmanyah font-bold text-lg text-[#301809] group-hover:text-[#b87a29] transition-colors line-clamp-1 mb-2">
              {ev.title}
            </h3>
            <p className="text-xs text-[#723c11]/80 line-clamp-2 mb-4 leading-relaxed">
              {ev.description || 'فعالية مجتمعية من تنظيم الجمعية في وارجلان.'}
            </p>
            <div className="space-y-1.5 text-xs text-[#723c11] font-medium">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#b87a29]" />
                <span>{ev.date}</span>
                <Clock className="w-3.5 h-3.5 text-[#b87a29] mr-2" />
                <span>{ev.start_time?.substring(0, 5)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#b87a29]" />
                <span className="truncate">{ev.location}</span>
              </div>
            </div>
          </CardContent>
        </div>

        <div className="px-5 pb-4 pt-3 border-t border-[#dbc397]/40 flex items-center justify-between text-xs">
          <span className="font-bold text-[#723c11] flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-[#b87a29]" />
            {rsvpCount} مشارك مسجل
          </span>
          <span className="bg-[#fae1b7] group-hover:bg-[#efa83f] text-[#301809] font-bold px-3 py-1 rounded-xl transition-colors">
            عرض التفاصيل ←
          </span>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-[#301809] pb-20" dir="rtl">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#dbc397]/60">
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-[#723c11] hover:bg-[#fae1b7]/40 font-bold rounded-xl gap-2 cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="border-[#dbc397] text-[#723c11] hover:bg-[#fae1b7]/40 rounded-xl text-xs font-bold h-9 px-3 cursor-pointer"
            >
              نسخ الرابط
            </Button>
            <Button
              onClick={handleShareProfile}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold h-9 px-3.5 gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>مشاركة عبر واتساب</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Profile Header */}
      <section className="relative bg-gradient-to-br from-[#301809] via-[#4a250d] to-[#723c11] text-white py-12 md:py-16 border-b-4 border-[#efa83f] overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none select-none flex items-center justify-center text-[140px] font-black">
          ⵡⴰⵔⴵⵍⴰⵏ
        </div>

        <div className="container mx-auto px-6 relative z-10 max-w-6xl">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 text-center md:text-right">
            {/* Logo / Avatar */}
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-3xl bg-white p-2 border-4 border-[#efa83f] shadow-2xl flex items-center justify-center shrink-0 overflow-hidden">
              {meta.logo_url ? (
                <img
                  src={meta.logo_url}
                  alt={association.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#fae1b7] to-[#efa83f] flex items-center justify-center text-[#301809] font-thmanyah font-black text-4xl">
                  {association.name?.charAt(0) || '🏛️'}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-3">
              <div className="inline-flex items-center gap-1.5 bg-[#efa83f]/20 border border-[#efa83f]/50 text-[#fae1b7] px-3 py-1 rounded-full text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#efa83f]" />
                <span>جمعية معتمدة في شبكة تواصل صحراء • وارجلان</span>
              </div>

              <h1 className="text-3xl md:text-5xl font-thmanyah font-bold text-white">
                {association.name}
              </h1>

              <p className="text-sm md:text-base text-[#fae1b7]/90 max-w-3xl leading-relaxed font-normal">
                {meta.bio && meta.bio !== association.name
                  ? meta.bio
                  : `جمعية فاعلة في ولاية ورقلة وحوض سدراتة تساهم في تأطير وتنشيط الفعاليات الثقافية، التراثية، والشبابية لخدمة المجتمع المحلي.`}
              </p>

              {/* Contact Pills */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2 text-xs">
                {meta.location && (
                  <span className="bg-white/10 backdrop-blur-sm border border-white/15 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-[#fae1b7]">
                    <MapPin className="w-3.5 h-3.5 text-[#efa83f]" />
                    {meta.location}
                  </span>
                )}
                {meta.phone && (
                  <a
                    href={`tel:${meta.phone}`}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/15 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-[#fae1b7] font-mono"
                    dir="ltr"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#efa83f]" />
                    {meta.phone}
                  </a>
                )}
                {meta.website && (
                  <a
                    href={meta.website}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-[#efa83f] hover:bg-[#b87a29] text-[#301809] font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>صفحة الجمعية / تواصل</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Stats Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 pt-8 border-t border-white/15">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10">
              <div className="text-2xl md:text-3xl font-black text-[#efa83f]">{events.length}</div>
              <div className="text-xs text-[#fae1b7] font-bold mt-1">إجمالي الفعاليات</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10">
              <div className="text-2xl md:text-3xl font-black text-emerald-400">{upcomingEvents.length}</div>
              <div className="text-xs text-[#fae1b7] font-bold mt-1">فعاليات قادمة متاحة</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10">
              <div className="text-2xl md:text-3xl font-black text-white">{totalRsvps}</div>
              <div className="text-xs text-[#fae1b7] font-bold mt-1">إجمالي المشاركين المسجلين</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10">
              <div className="text-2xl md:text-3xl font-black text-yellow-400 flex items-center justify-center gap-1">
                <span>{avgRating}</span>
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              </div>
              <div className="text-xs text-[#fae1b7] font-bold mt-1">تقييم أنشطة الجمعية</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Tabs */}
      <div className="container mx-auto px-4 md:px-8 max-w-6xl mt-10">
        <Tabs defaultValue="upcoming" className="w-full" dir="rtl">
          <TabsList className="bg-white p-1.5 rounded-2xl border-2 border-[#dbc397] mb-8 flex flex-wrap h-auto gap-1.5 w-full md:w-fit">
            <TabsTrigger
              value="upcoming"
              className="rounded-xl px-5 py-2.5 font-bold text-xs md:text-sm data-[state=active]:bg-[#301809] data-[state=active]:text-[#fae1b7] cursor-pointer"
            >
              📅 الفعاليات القادمة ({upcomingEvents.length})
            </TabsTrigger>
            <TabsTrigger
              value="past"
              className="rounded-xl px-5 py-2.5 font-bold text-xs md:text-sm data-[state=active]:bg-[#301809] data-[state=active]:text-[#fae1b7] cursor-pointer"
            >
              🏛️ الفعاليات السابقة والأرشيف ({pastEvents.length})
            </TabsTrigger>
            <TabsTrigger
              value="gallery"
              className="rounded-xl px-5 py-2.5 font-bold text-xs md:text-sm data-[state=active]:bg-[#301809] data-[state=active]:text-[#fae1b7] cursor-pointer"
            >
              📸 ألبوم صور التغطيات ({allPhotos.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {upcomingEvents.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-[#dbc397]">
                <Sparkles className="w-12 h-12 text-[#b87a29] mx-auto mb-3 opacity-70" />
                <h3 className="text-xl font-thmanyah font-bold text-[#301809] mb-1">
                  لا توجد فعاليات قادمة معلنة حالياً
                </h3>
                <p className="text-xs text-[#723c11]/80">
                  يمكنك استعراض الفعاليات السابقة للجمعية أو متابعة الإشعارات لمعرفة المواعيد الجديدة فور نشرها.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEvents.map(renderEventCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            {pastEvents.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-[#dbc397]">
                <Building2 className="w-12 h-12 text-[#b87a29] mx-auto mb-3 opacity-70" />
                <h3 className="text-xl font-thmanyah font-bold text-[#301809] mb-1">
                  لا توجد فعاليات سابقة في الأرشيف
                </h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastEvents.map(renderEventCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="gallery">
            {allPhotos.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-[#dbc397]">
                <ImageIcon className="w-12 h-12 text-[#b87a29] mx-auto mb-3 opacity-70" />
                <h3 className="text-xl font-thmanyah font-bold text-[#301809] mb-1">
                  لا توجد صور تغطية مرفوعة بعد
                </h3>
                <p className="text-xs text-[#723c11]/80">
                  ستظهر هنا جميع الصور التوثيقية لأنشطة وفعاليات الجمعية فور رفعها.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {allPhotos.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => setLightboxImg(item.url)}
                    className="group relative aspect-square rounded-2xl overflow-hidden border-2 border-[#dbc397] bg-white cursor-pointer shadow-xs hover:shadow-lg transition-all"
                  >
                    <img
                      src={item.url}
                      alt={item.eventTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3">
                      <p className="text-white text-xs font-bold truncate">{item.eventTitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Lightbox Modal */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <button
            onClick={() => setLightboxImg(null)}
            className="absolute top-6 right-6 bg-white/20 hover:bg-white/30 text-white rounded-full p-2.5 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxImg}
            alt="تغطية الفعالية"
            className="max-h-[85vh] max-w-[90vw] rounded-2xl shadow-2xl border-2 border-[#dbc397] object-contain"
          />
        </div>
      )}
    </div>
  );
}
