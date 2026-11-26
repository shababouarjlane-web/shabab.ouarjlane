import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { parseAssociationMeta, packHeritageMeta } from '@/lib/helpers';
import {
  getFollowedAssociations,
  toggleFollowAssociation,
} from '@/lib/userInterests';
import {
  Building2,
  Search,
  MapPin,
  Calendar,
  CheckCircle2,
  PlusCircle,
  Send,
  Bell,
  BellRing,
  ArrowLeft,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import UnifiedHeader from '@/components/UnifiedHeader';

export default function AssociationsDirectory() {
  const navigate = useNavigate();
  const [associations, setAssociations] = useState<any[]>([]);
  const [eventsByAssoc, setEventsByAssoc] = useState<
    Record<string, { total: number; upcoming: number }>
  >({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'following' | 'upcoming'>('all');
  const [followedIds, setFollowedIds] = useState<string[]>(() => getFollowedAssociations());

  // نافذة طلب انضمام جمعية جديدة
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinName, setJoinName] = useState('');
  const [joinManager, setJoinManager] = useState('');
  const [joinPhone, setJoinPhone] = useState('');
  const [joinEmail, setJoinEmail] = useState('');
  const [joinDesc, setJoinDesc] = useState('');
  const [submittingJoin, setSubmittingJoin] = useState(false);

  useEffect(() => {
    const syncFollows = () => setFollowedIds(getFollowedAssociations());
    window.addEventListener('sahara-follows-updated', syncFollows);

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
            .eq('status', 'active'),
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
    return () => window.removeEventListener('sahara-follows-updated', syncFollows);
  }, []);

  const handleToggleFollow = (e: React.MouseEvent, assocId: string, assocName: string) => {
    e.stopPropagation();
    const nowFollowing = toggleFollowAssociation(assocId);
    setFollowedIds(getFollowedAssociations());
    toast.success(
      nowFollowing
        ? `تمت متابعة «${assocName}» — ستصلك تنبيهات فعالياتها القادمة`
        : `تم إلغاء متابعة «${assocName}»`
    );
  };

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
          requestType: 'association_join',
        }
      );

      const { error } = await supabase.from('heritage_archive').insert([
        {
          title: `[طلب انضمام جمعية] ${joinName.trim()}`,
          content: packed,
        },
      ]);

      if (error) throw error;

      toast.success('تم إرسال طلب الانضمام بنجاح! سيتواصل معكم فريق تواصل صحراء قريباً.');
      setJoinOpen(false);
      setJoinName('');
      setJoinManager('');
      setJoinPhone('');
      setJoinEmail('');
      setJoinDesc('');
    } catch (err: any) {
      toast.error('تعذر إرسال الطلب: ' + (err.message || 'حاول لاحقاً'));
    } finally {
      setSubmittingJoin(false);
    }
  };

  const filteredAssociations = useMemo(() => {
    return associations.filter((assoc) => {
      if (filterTab === 'following' && !followedIds.includes(assoc.id)) return false;
      if (filterTab === 'upcoming' && !(eventsByAssoc[assoc.id]?.upcoming > 0)) return false;

      if (!searchQuery.trim()) return true;
      const meta = parseAssociationMeta(assoc.description);
      const q = searchQuery.toLowerCase();
      return (
        (assoc.name || '').toLowerCase().includes(q) ||
        (meta.bio || '').toLowerCase().includes(q) ||
        (meta.location || '').toLowerCase().includes(q)
      );
    });
  }, [associations, filterTab, followedIds, eventsByAssoc, searchQuery]);

  const totalEventsCount = Object.values(eventsByAssoc).reduce((sum, c) => sum + c.total, 0);

  return (
    <div
      className="min-h-screen bg-[#fdfbf7] bg-[radial-gradient(ellipse_at_top,_rgba(239,168,63,0.12),_transparent_55%)] text-[#301809] flex flex-col"
      dir="rtl"
    >
      <UnifiedHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-7 sm:py-10 space-y-6">
        {/* ── 1. الرأس المدمج بهوية تواصل صحراء ── */}
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-l from-[#301809] via-[#4a250e] to-[#2b1507] p-6 sm:p-8 shadow-[0_18px_48px_rgba(48,24,9,0.2)] ring-1 ring-[#efa83f]/30 space-y-5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(239,168,63,0.2),_transparent_60%)]" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-thmanyah font-bold text-white">
                دليل{' '}
                <span className="bg-gradient-to-l from-[#fae1b7] to-[#efa83f] bg-clip-text text-transparent">
                  الجمعيات
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-[#fae1b7]/80 max-w-xl">
                تابع الجمعيات والنوادي الثقافية والتراثية المعتمدة في وارجلان لتصلك أحدث برامجها وفعالياتها.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <span className="px-3 py-2 rounded-xl bg-white/10 text-[#fae1b7] text-xs font-thmanyah font-bold">
                {associations.length} جمعية • {totalEventsCount} فعالية
              </span>
              <button
                type="button"
                onClick={() => setJoinOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-l from-[#b87a29] to-[#efa83f] hover:from-[#a56b20] hover:to-[#f5b44c] text-[#301809] text-xs font-thmanyah font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>انضمام جمعية</span>
              </button>
            </div>
          </div>

          {/* شريط البحث داخل الرأس */}
          <div className="relative z-10 bg-[#fdfbf7] rounded-2xl p-1.5 flex items-center gap-2 shadow-[0_12px_30px_rgba(0,0,0,0.25)] ring-1 ring-[#efa83f]/40 focus-within:ring-2 focus-within:ring-[#efa83f] transition-all">
            <Search className="w-5 h-5 text-[#b87a29] mr-3 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن اسم الجمعية، تخصصها، أو المنطقة..."
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

        {/* ── 2. شريط التصفية البسيط ── */}
        <section className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: `الكل (${associations.length})` },
              { id: 'following', label: `أتابعها (${followedIds.length})` },
              { id: 'upcoming', label: 'لديها فعاليات قادمة' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-full text-xs font-thmanyah font-bold transition-all cursor-pointer ${
                  filterTab === tab.id
                    ? 'bg-[#301809] text-[#fae1b7] shadow-sm'
                    : 'bg-white hover:bg-[#fae1b7]/55 text-[#301809] border border-[#dbc397]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-[#723c11]">
            <strong className="text-[#301809]">{filteredAssociations.length}</strong> جمعية
          </span>
        </section>

        {/* ── 3. شبكة الجمعيات النظيفة مع زر المتابعة ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-60 bg-white rounded-[24px] border border-[#e3d4b8] animate-pulse p-6"
              />
            ))}
          </div>
        ) : filteredAssociations.length === 0 ? (
          <div className="bg-white rounded-[28px] p-12 text-center border border-[#dbc397] space-y-3">
            <Building2 className="w-12 h-12 text-[#b87a29]/50 mx-auto" />
            <h3 className="text-lg font-thmanyah font-bold text-[#301809]">
              {filterTab === 'following'
                ? 'لم تتابع أي جمعية بعد'
                : 'لا توجد جمعيات مطابقة لبحثك'}
            </h3>
            <p className="text-xs text-[#723c11]/80 max-w-md mx-auto">
              {filterTab === 'following'
                ? 'اضغط على زر «متابعة» في أي جمعية لتصلك تنبيهات فعالياتها الجديدة.'
                : 'جرّب كلمات بحث أخرى أو استعرض جميع الجمعيات المعتمدة.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterTab('all');
              }}
              className="px-5 py-2.5 rounded-xl bg-[#301809] hover:bg-[#4a250e] text-[#fae1b7] text-xs font-thmanyah font-bold cursor-pointer transition-colors"
            >
              عرض كل الجمعيات
            </button>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAssociations.map((assoc) => {
              const meta = parseAssociationMeta(assoc.description, assoc.id);
              const stats = eventsByAssoc[assoc.id] || { total: 0, upcoming: 0 };
              const isFollowing = followedIds.includes(assoc.id);

              return (
                <article
                  key={assoc.id}
                  onClick={() => navigate(`/association-profile/${assoc.id}`)}
                  className="group bg-white rounded-[24px] border border-[#e3d4b8] hover:border-[#b87a29] shadow-[0_6px_24px_rgba(48,24,9,0.05)] hover:shadow-[0_14px_36px_rgba(48,24,9,0.12)] p-5 transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3.5">
                    {/* شعار الجمعية + زر المتابعة */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-14 h-14 rounded-2xl bg-[#fdfbf7] border border-[#e5d8c0] flex items-center justify-center overflow-hidden shrink-0">
                          {meta.logo_url ? (
                            <img
                              src={meta.logo_url}
                              alt={assoc.name}
                              className="w-full h-full object-contain p-1.5"
                            />
                          ) : (
                            <Building2 className="w-7 h-7 text-[#b87a29]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="inline-flex items-center gap-1 text-[10px] font-thmanyah font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>معتمدة</span>
                          </span>
                          <h3 className="text-base font-thmanyah font-bold text-[#301809] group-hover:text-[#b87a29] transition-colors line-clamp-1 mt-1">
                            {assoc.name}
                          </h3>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleToggleFollow(e, assoc.id, assoc.name)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-thmanyah font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                          isFollowing
                            ? 'bg-[#301809] text-[#fae1b7] shadow-xs'
                            : 'bg-[#fae1b7]/55 hover:bg-[#fae1b7] text-[#301809] border border-[#dbc397]'
                        }`}
                        title={isFollowing ? 'إلغاء المتابعة' : 'متابعة الجمعية'}
                      >
                        {isFollowing ? (
                          <>
                            <BellRing className="w-3.5 h-3.5 text-[#efa83f]" />
                            <span>متابَع</span>
                          </>
                        ) : (
                          <>
                            <Bell className="w-3.5 h-3.5 text-[#b87a29]" />
                            <span>متابعة</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-[#723c11]/85 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                      {meta.bio || 'جمعية فاعلة في التنشيط الثقافي والتراثي والعمل التطوعي بوارجلان.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#723c11]">
                      <span className="inline-flex items-center gap-1 bg-[#fdfbf7] px-2.5 py-1 rounded-full border border-[#e5d8c0]">
                        <MapPin className="w-3 h-3 text-[#b87a29]" />
                        <span>{meta.location || 'ورقلة'}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 bg-[#fdfbf7] px-2.5 py-1 rounded-full border border-[#e5d8c0]">
                        <Calendar className="w-3 h-3 text-[#b87a29]" />
                        <span>{stats.total} فعالية</span>
                      </span>
                      {stats.upcoming > 0 && (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full font-bold">
                          {stats.upcoming} قادمة
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#f2e8d5] flex items-center justify-between text-xs font-thmanyah font-bold text-[#301809] group-hover:text-[#b87a29] transition-colors">
                    <span>ملف الجمعية والفعاليات</span>
                    <ArrowLeft className="w-3.5 h-3.5 text-[#b87a29] group-hover:-translate-x-0.5 transition-transform" />
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>

      {/* نافذة طلب انضمام جمعية جديدة */}
      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent className="sm:max-w-[500px] font-sans rounded-3xl border border-[#dbc397]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-thmanyah font-bold text-[#301809] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#b87a29]" />
              <span>طلب اعتماد وانضمام جمعية جديدة</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-[#723c11]/80">
              أدخل بيانات جمعيتكم أو ناديكم ليقوم مشرفو المنصة بمراجعتها وتفعيل حساب الجمعية.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitJoinRequest} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-[#301809] mb-1 block">اسم الجمعية أو النادي *</label>
              <Input
                required
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                placeholder="مثال: جمعية الأصالة للتراث السياحي بورقلة"
                className="rounded-xl border-[#dbc397]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#301809] mb-1 block">اسم المسؤول *</label>
                <Input
                  required
                  value={joinManager}
                  onChange={(e) => setJoinManager(e.target.value)}
                  placeholder="الاسم الكامل"
                  className="rounded-xl border-[#dbc397]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#301809] mb-1 block">رقم الهاتف *</label>
                <Input
                  required
                  value={joinPhone}
                  onChange={(e) => setJoinPhone(e.target.value)}
                  placeholder="06XXXXXXXX"
                  dir="ltr"
                  className="rounded-xl border-[#dbc397] text-right"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#301809] mb-1 block">البريد الإلكتروني (اختياري)</label>
              <Input
                type="email"
                value={joinEmail}
                onChange={(e) => setJoinEmail(e.target.value)}
                placeholder="association@example.com"
                dir="ltr"
                className="rounded-xl border-[#dbc397] text-right"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#301809] mb-1 block">نبذة عن نشاط الجمعية *</label>
              <Textarea
                required
                value={joinDesc}
                onChange={(e) => setJoinDesc(e.target.value)}
                placeholder="اذكر مجال عمل الجمعية، مقرها، وأبرز الفعاليات التي تنظمها..."
                className="rounded-xl border-[#dbc397] min-h-[90px]"
              />
            </div>

            <Button
              type="submit"
              disabled={submittingJoin}
              className="w-full bg-gradient-to-l from-[#b87a29] to-[#efa83f] hover:from-[#a56b20] hover:to-[#f5b44c] text-[#301809] font-thmanyah font-bold h-11 rounded-xl gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{submittingJoin ? 'جاري إرسال الطلب...' : 'إرسال طلب الانضمام'}</span>
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
