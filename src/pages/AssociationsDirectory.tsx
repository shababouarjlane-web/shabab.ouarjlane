import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { parseAssociationMeta, packHeritageMeta } from '@/lib/helpers';
import {
  Building2, Search, MapPin, Phone, Globe, Calendar,
  CheckCircle2, Sparkles, ArrowRight, ExternalLink, PlusCircle, Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function AssociationsDirectory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [associations, setAssociations] = useState<any[]>([]);
  const [eventsByAssoc, setEventsByAssoc] = useState<Record<string, { total: number; upcoming: number }>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Join Request Modal State
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinName, setJoinName] = useState('');
  const [joinManager, setJoinManager] = useState('');
  const [joinPhone, setJoinPhone] = useState('');
  const [joinEmail, setJoinEmail] = useState('');
  const [joinDesc, setJoinDesc] = useState('');
  const [submittingJoin, setSubmittingJoin] = useState(false);

  useEffect(() => {
    const fetchDirectory = async () => {
      setLoading(true);
      try {
        const [{ data: assocData }, { data: eventsData }] = await Promise.all([
          supabase
            .from('associations')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false }),
          supabase
            .from('events')
            .select('id, association_id, date, status')
            .eq('status', 'active')
        ]);

        setAssociations(assocData || []);

        const today = new Date().toISOString().split('T')[0];
        const counts: Record<string, { total: number; upcoming: number }> = {};
        for (const ev of eventsData || []) {
          if (!ev.association_id) continue;
          if (!counts[ev.association_id]) {
            counts[ev.association_id] = { total: 0, upcoming: 0 };
          }
          counts[ev.association_id].total += 1;
          if (ev.date >= today) {
            counts[ev.association_id].upcoming += 1;
          }
        }
        setEventsByAssoc(counts);
      } catch (err) {
        console.error('Error fetching associations directory:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDirectory();
  }, []);

  const handleSubmitJoinRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinName.trim() || !joinPhone.trim()) return;
    setSubmittingJoin(true);
    try {
      const packed = packHeritageMeta(
        `طلب انضمام جمعية: ${joinName.trim()}\nالمسؤول: ${joinManager.trim() || 'غير محدد'}\nنبذة عن النشاط: ${joinDesc.trim() || 'غير محدد'}`,
        {
          category: 'طلب انضمام جمعية',
          contributor: joinManager.trim() || joinName.trim(),
          status: 'contact_request',
          contactPhone: joinPhone.trim(),
          contactEmail: joinEmail.trim(),
          requestType: 'association_join'
        }
      );

      const { error } = await supabase.from('heritage_archive').insert([{
        title: `[طلب انضمام جمعية] ${joinName.trim()}`,
        content: packed
      }]);

      if (error) throw error;

      toast({
        title: 'تم إرسال طلب الانضمام بنجاح! 🎉',
        description: 'سيقوم فريق إدارة منصة تواصل صحراء بمراجعة طلبكم والتواصل معكم قريباً.'
      });
      setJoinOpen(false);
      setJoinName('');
      setJoinManager('');
      setJoinPhone('');
      setJoinEmail('');
      setJoinDesc('');
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'تعذر إرسال الطلب',
        description: err.message
      });
    } finally {
      setSubmittingJoin(false);
    }
  };

  const filteredAssociations = associations.filter(assoc => {
    if (!searchQuery.trim()) return true;
    const meta = parseAssociationMeta(assoc.description);
    const q = searchQuery.toLowerCase();
    return (
      (assoc.name || '').toLowerCase().includes(q) ||
      (meta.bio || '').toLowerCase().includes(q) ||
      (meta.location || '').toLowerCase().includes(q)
    );
  });

  const totalEventsCount = Object.values(eventsByAssoc).reduce((sum, c) => sum + c.total, 0);

  return (
    <div className="min-h-screen bg-[#fdfbf7] font-sans text-[#301809]" dir="rtl">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-[#301809]/95 backdrop-blur-md border-b border-[#b87a29]/30 text-[#fae1b7] px-4 md:px-8 h-20 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <img
            src="/logo.png"
            alt="تواصل صحراء"
            className="h-12 w-auto object-contain rounded-xl bg-[#fdfbf7] p-1 border border-[#b87a29]"
          />
          <div>
            <h1 className="font-extrabold text-lg text-[#fae1b7] leading-tight">دليل الجمعيات المعتمدة</h1>
            <p className="text-xs text-[#efa83f] font-medium">النسيج الجمعوي والثقافي لولاية ورقلة</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate('/events')}
            className="text-[#fae1b7] hover:text-[#efa83f] hover:bg-white/5 font-bold text-sm hidden sm:flex"
          >
            الفعاليات
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate('/heritage')}
            className="text-[#fae1b7] hover:text-[#efa83f] hover:bg-white/5 font-bold text-sm hidden sm:flex"
          >
            الأرشيف التراثي
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate('/map')}
            className="text-[#fae1b7] hover:text-[#efa83f] hover:bg-white/5 font-bold text-sm hidden sm:flex"
          >
            الخريطة التفاعلية
          </Button>
          <Button
            onClick={() => setJoinOpen(true)}
            className="bg-[#efa83f] hover:bg-[#b87a29] text-[#301809] hover:text-white font-black rounded-xl text-xs sm:text-sm gap-1.5"
          >
            <PlusCircle className="w-4 h-4" /> طلب انضمام جمعية
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="border-[#b87a29]/50 bg-transparent text-[#fae1b7] hover:bg-[#b87a29] hover:text-white rounded-xl gap-1.5 font-bold text-xs sm:text-sm"
          >
            الرئيسية <ArrowRight className="w-4 h-4 rotate-180" />
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative bg-gradient-to-br from-[#301809] via-[#4a2610] to-[#723c11] text-white py-14 px-4 overflow-hidden border-b-4 border-[#b87a29]">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#efa83f]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-5">
          <span className="bg-[#efa83f]/20 text-[#fae1b7] border border-[#efa83f]/40 px-4 py-1.5 text-xs font-extrabold rounded-full inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#efa83f]" /> الفاعلون في الميدان الثقافي والاجتماعي
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-[#fae1b7] leading-tight">
            دليل الجمعيات والنوادي المعتمدة بورقلة
          </h1>
          <p className="text-[#fae1b7]/80 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            تعرّف على الجمعيات الثقافية، العلمية، التراثية، والشبابية الناشطة عبر منصة تواصل صحراء، وتابع أحدث برامجها وفعالياتها الميدانية.
          </p>

          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <div className="bg-white/10 backdrop-blur-sm border border-[#fae1b7]/20 rounded-2xl px-6 py-3 text-center">
              <p className="text-2xl font-black text-[#efa83f]">{associations.length}</p>
              <p className="text-xs font-bold text-[#fae1b7]/80">جمعية معتمدة</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-[#fae1b7]/20 rounded-2xl px-6 py-3 text-center">
              <p className="text-2xl font-black text-emerald-400">{totalEventsCount}</p>
              <p className="text-xs font-bold text-[#fae1b7]/80">فعالية ونشاط مسجل</p>
            </div>
          </div>

          {/* Search Input */}
          <div className="max-w-xl mx-auto pt-4">
            <div className="relative">
              <Search className="w-5 h-5 text-[#b87a29] absolute right-4 top-3.5" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ابحث عن اسم الجمعية، تخصصها، أو البلدية..."
                className="pr-12 pl-4 h-12 rounded-2xl bg-white text-[#301809] border-2 border-[#efa83f]/50 font-bold shadow-xl focus-visible:ring-[#efa83f]"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="h-72 bg-white rounded-3xl border border-[#dbc397]/50 animate-pulse p-6" />
            ))}
          </div>
        ) : filteredAssociations.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-[#dbc397] p-8 max-w-xl mx-auto">
            <Building2 className="w-14 h-14 text-[#b87a29]/40 mx-auto mb-3" />
            <h3 className="text-xl font-black text-[#301809] mb-2">لا توجد جمعيات مطابقة لبحثك</h3>
            <p className="text-sm text-[#723c11]/70 mb-6">جرب البحث بكلمات أخرى أو استعرض القائمة الكاملة.</p>
            {searchQuery && (
              <Button onClick={() => setSearchQuery('')} className="bg-[#723c11] text-[#fae1b7] rounded-xl font-bold">
                عرض كل الجمعيات
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssociations.map(assoc => {
              const meta = parseAssociationMeta(assoc.description);
              const stats = eventsByAssoc[assoc.id] || { total: 0, upcoming: 0 };

              return (
                <Card
                  key={assoc.id}
                  onClick={() => navigate(`/association-profile/${assoc.id}`)}
                  className="group cursor-pointer rounded-3xl border-2 border-[#dbc397]/60 hover:border-[#b87a29] bg-white shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* Top Decorative Banner */}
                    <div className="h-20 bg-gradient-to-l from-[#301809] via-[#723c11] to-[#b87a29] relative">
                      <span className="absolute top-3 left-3 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> معتمدة
                      </span>
                    </div>

                    <CardContent className="p-6 pt-0 relative">
                      {/* Avatar / Logo */}
                      <div className="-mt-10 mb-4 flex items-end justify-between">
                        <div className="w-20 h-20 rounded-2xl bg-[#fdfbf7] border-4 border-white shadow-md flex items-center justify-center overflow-hidden shrink-0">
                          {meta.logo_url ? (
                            <img src={meta.logo_url} alt={assoc.name} className="w-full h-full object-contain p-1.5" />
                          ) : (
                            <Building2 className="w-9 h-9 text-[#b87a29]" />
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-[#fae1b7]/50 text-[#723c11] border border-[#dbc397]">
                            <Calendar className="w-3 h-3 inline ml-1 text-[#b87a29]" />
                            {stats.total} فعالية
                          </span>
                          {stats.upcoming > 0 && (
                            <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {stats.upcoming} قادمة
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className="text-xl font-black text-[#301809] group-hover:text-[#b87a29] transition-colors line-clamp-1 mb-2">
                        {assoc.name}
                      </h3>

                      <p className="text-sm text-[#723c11]/80 line-clamp-3 leading-relaxed min-h-[3.75rem]">
                        {meta.bio || 'جمعية فاعلة في التنشيط الثقافي والتراثي والعمل التطوعي بولاية ورقلة.'}
                      </p>

                      {/* Contact & Location pills */}
                      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-[#fae1b7]/60 text-xs font-bold text-[#723c11]">
                        <span className="inline-flex items-center gap-1 bg-[#fdfbf7] px-2.5 py-1 rounded-lg border border-[#dbc397]/60">
                          <MapPin className="w-3.5 h-3.5 text-[#b87a29]" />
                          {meta.location || 'ورقلة'}
                        </span>
                        {meta.phone && (
                          <span className="inline-flex items-center gap-1 bg-[#fdfbf7] px-2.5 py-1 rounded-lg border border-[#dbc397]/60" dir="ltr">
                            <Phone className="w-3.5 h-3.5 text-[#b87a29]" />
                            {meta.phone}
                          </span>
                        )}
                        {meta.website && (
                          <span className="inline-flex items-center gap-1 bg-[#fdfbf7] px-2.5 py-1 rounded-lg border border-[#dbc397]/60 text-[#b87a29]">
                            <Globe className="w-3.5 h-3.5" /> موقع إلكتروني
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </div>

                  <div className="px-6 pb-5">
                    <Button className="w-full bg-[#fdfbf7] hover:bg-[#723c11] text-[#723c11] hover:text-[#fae1b7] border border-[#dbc397] font-extrabold rounded-xl gap-2 transition-colors">
                      استعراض ملف الجمعية والفعاليات <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Bottom CTA Banner for New Associations */}
        <div className="mt-16 bg-gradient-to-r from-[#301809] via-[#592e0d] to-[#723c11] rounded-3xl p-8 md:p-10 text-white shadow-xl border-2 border-[#b87a29]/40 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-right">
            <h3 className="text-2xl font-black text-[#fae1b7]">هل تمثل جمعية أو نادياً ثقافياً في ورقلة؟</h3>
            <p className="text-sm md:text-base text-[#fae1b7]/80 max-w-xl">
              انضم إلى شبكة الجمعيات المعتمدة في منصة تواصل صحراء لنشر فعالياتكم، إدارة التذاكر والحجوزات بـ QR Code، وتوثيق أنشطتكم مجاناً.
            </p>
          </div>
          <Button
            onClick={() => setJoinOpen(true)}
            className="bg-[#efa83f] hover:bg-[#b87a29] text-[#301809] hover:text-white font-black px-8 py-6 rounded-2xl text-base shadow-lg shrink-0 gap-2"
          >
            <PlusCircle className="w-5 h-5" /> قدّم طلب انضمام جمعيتك الآن
          </Button>
        </div>
      </main>

      {/* Association Join Request Modal */}
      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent className="sm:max-w-[500px] font-sans rounded-3xl border-2 border-[#dbc397]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-[#301809] flex items-center gap-2">
              <Building2 className="w-6 h-6 text-[#b87a29]" /> طلب اعتماد وانضمام جمعية جديدة
            </DialogTitle>
            <DialogDescription className="text-xs font-bold text-[#723c11]/80">
              أدخل بيانات جمعيتكم أو ناديكم ليقوم مشرفو المنصة بمراجعتها وتفعيل حساب الجمعية.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitJoinRequest} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-[#301809] mb-1 block">اسم الجمعية أو النادي *</label>
              <Input
                required
                value={joinName}
                onChange={e => setJoinName(e.target.value)}
                placeholder="مثال: جمعية الأصالة للتراث السياحي بورقلة"
                className="rounded-xl border-[#dbc397]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#301809] mb-1 block">اسم رئيس الجمعية / المسؤول *</label>
                <Input
                  required
                  value={joinManager}
                  onChange={e => setJoinManager(e.target.value)}
                  placeholder="الاسم الكامل"
                  className="rounded-xl border-[#dbc397]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#301809] mb-1 block">رقم الهاتف للتواصل *</label>
                <Input
                  required
                  value={joinPhone}
                  onChange={e => setJoinPhone(e.target.value)}
                  placeholder="06XXXXXXXX"
                  dir="ltr"
                  className="rounded-xl border-[#dbc397] text-right"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#301809] mb-1 block">البريد الإلكتروني للجمعية (اختياري)</label>
              <Input
                type="email"
                value={joinEmail}
                onChange={e => setJoinEmail(e.target.value)}
                placeholder="association@example.com"
                dir="ltr"
                className="rounded-xl border-[#dbc397] text-right"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#301809] mb-1 block">نبذة عن تخصص الجمعية وأنشطتها *</label>
              <Textarea
                required
                value={joinDesc}
                onChange={e => setJoinDesc(e.target.value)}
                placeholder="اذكر مجال عمل الجمعية، مقرها البلدي، وأبرز الفعاليات التي تنظمها..."
                className="rounded-xl border-[#dbc397] min-h-[90px]"
              />
            </div>

            <Button
              type="submit"
              disabled={submittingJoin}
              className="w-full bg-[#723c11] hover:bg-[#301809] text-[#fae1b7] font-black h-12 rounded-xl gap-2"
            >
              <Send className="w-4 h-4" />
              {submittingJoin ? 'جاري إرسال الطلب...' : 'إرسال طلب الانضمام للإدارة'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
