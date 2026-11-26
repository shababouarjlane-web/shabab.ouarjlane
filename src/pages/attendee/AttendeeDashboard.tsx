import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import UnifiedHeader from '../../components/UnifiedHeader';
import {
  CalendarIcon,
  MapPin,
  Compass,
  CalendarHeart,
  Search,
  X,
  Settings,
  Trophy,
  Star,
  Check,
  KeyRound,
  LogOut,
  Ticket,
  Sparkles,
  Loader2,
  Share2,
  User,
  Phone,
  Medal,
  Heart,
  Hourglass,
  Building2,
  SlidersHorizontal,
  Landmark,
  BookOpen,
  GraduationCap,
  Palette,
  Dumbbell,
  HandHeart,
} from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import PartnerAdsBanner from '../../components/PartnerAdsBanner';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import TicketCard from '../../components/TicketCard';
import {
  packUserContact,
  parseUserContact,
  buildGoogleCalendarUrl,
  buildWhatsAppShareUrl,
  getFavoriteEventIds,
  toggleFavoriteEvent,
} from '../../lib/helpers';
import {
  USER_INTEREST_CATEGORIES,
  CATEGORY_ARABIC_LABELS,
  getSavedInterests,
  saveUserInterests,
} from '../../lib/userInterests';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Heritage: Landmark,
  Religious: BookOpen,
  Educational: GraduationCap,
  Cultural: Palette,
  Sports: Dumbbell,
  Social: HandHeart,
};

export default function AttendeeDashboard() {
  const navigate = useNavigate();
  const [publicEvents, setPublicEvents] = useState<any[]>([]);
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => getFavoriteEventIds());
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // States for Personalization & Gamification
  const [userProfile, setUserProfile] = useState<any>(null);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [savingContact, setSavingContact] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  // QR Ticket modal state
  const [activeTicketEvent, setActiveTicketEvent] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Use a ref to always have the latest myEvents for the real-time listener
  const myEventsRef = useRef(myEvents);
  useEffect(() => {
    myEventsRef.current = myEvents;
  }, [myEvents]);

  const handleToggleFav = (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    const added = toggleFavoriteEvent(eventId);
    setFavoriteIds(getFavoriteEventIds());
    toast.success(added ? 'تمت إضافة الفعالية إلى المفضلة' : 'تمت إزالة الفعالية من المفضلة');
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('كلمة المرور يجب أن لا تقل عن 6 أحرف');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('كلمتا المرور غير متطابقتين');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      toast.success('تم تحديث كلمة المرور بنجاح!');
      setNewPassword('');
      setConfirmPassword('');
      setIsPasswordModalOpen(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'فشل تحديث كلمة المرور');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('demo_role');
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchEvents();

    // Real-time Notifications for attendees
    const channel = supabase
      .channel('attendee-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'events' },
        (payload) => {
          const relevantEvent = myEventsRef.current.find((e) => e.id === payload.new.id);
          if (relevantEvent) {
            const oldData = relevantEvent;
            const newData = payload.new as any;

            const changes: string[] = [];
            const getVal = (val: any) =>
              val === null || val === undefined ? '' : String(val).trim();

            const titleChanged = getVal(oldData.title) !== getVal(newData.title);
            const dateChanged = getVal(oldData.date) !== getVal(newData.date);
            const timeChanged =
              getVal(oldData.start_time).substring(0, 5) !==
              getVal(newData.start_time).substring(0, 5);
            const locationChanged = getVal(oldData.location) !== getVal(newData.location);
            const privacyChanged = oldData.is_public !== newData.is_public;
            const statusChanged = getVal(oldData.status) !== getVal(newData.status);

            if (titleChanged && newData.title) {
              changes.push(`العنوان الجديد: "${newData.title}"`);
            }
            if (dateChanged && newData.date) {
              changes.push(`التاريخ: ${newData.date}`);
            }
            if (timeChanged && newData.start_time) {
              changes.push(`الوقت: ${newData.start_time.substring(0, 5)}`);
            }
            if (locationChanged && newData.location) {
              changes.push(`المكان: "${newData.location}"`);
            }
            if (privacyChanged) {
              changes.push(
                newData.is_public ? 'أصبحت الفعالية عامة' : 'أصبحت الفعالية خاصة بالمسجلين'
              );
            }
            if (statusChanged) {
              changes.push(
                newData.status === 'archived'
                  ? 'تم نقلها للأرشيف'
                  : 'تمت استعادتها من الأرشيف'
              );
            }

            if (changes.length === 0) {
              fetchEvents();
              return;
            }

            const description = changes.join(' | ');
            const isNoLongerAvailable =
              newData.is_public === false || newData.status === 'archived';

            if (isNoLongerAvailable) {
              let alertTitle = `تغيير في خصوصية الفعالية: "${newData.title}"`;
              if (newData.status === 'archived') {
                alertTitle = `تم أرشفة الفعالية: "${newData.title}"`;
              } else if (newData.is_public === false) {
                alertTitle = `أصبحت الفعالية خاصة: "${newData.title}"`;
              }

              toast.warning(alertTitle, {
                description: description || 'تم تحديث حالة الفعالية ونوع خصوصيتها.',
                duration: 40000,
              });
            } else {
              toast.info(`تحديث في فعالية: "${newData.title}"`, {
                description,
                action: {
                  label: 'عرض التفاصيل',
                  onClick: () => navigate(`/event/${newData.id}`),
                },
                duration: 30000,
              });
            }

            fetchEvents();
          }
        }
      )
      .subscribe();

    // Real-time Profile Updates (Points & Badges)
    let profileChannel: any;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        profileChannel = supabase
          .channel('profile-realtime')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'users',
              filter: `id=eq.${user.id}`,
            },
            (payload) => {
              setUserProfile(payload.new);
            }
          )
          .subscribe();
      }
    });

    return () => {
      supabase.removeChannel(channel);
      if (profileChannel) supabase.removeChannel(profileChannel);
    };
  }, []);

  const fetchEvents = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);

      // Fetch User Profile (Full Name/Interests/Points/Badge)
      const { data: profileData } = await supabase
        .from('users')
        .select('full_name, interests, points, badge')
        .eq('id', user.id)
        .single();

      const savedLocal = getSavedInterests();
      const mergedInterests =
        profileData?.interests && profileData.interests.length > 0
          ? profileData.interests
          : savedLocal;

      setUserProfile({
        full_name: profileData?.full_name || '',
        interests: mergedInterests,
        points: profileData?.points || 0,
        badge: profileData?.badge || 'عضو نشط',
      });
      const parsedContact = parseUserContact(profileData?.full_name, user.email);
      setContactName(parsedContact.name);
      setContactPhone(parsedContact.phone);

      // Fetch public events
      const { data: publicData } = await supabase
        .from('events')
        .select('*, associations(id, name)')
        .eq('is_public', true)
        .eq('status', 'active')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true });

      setPublicEvents(publicData || []);

      // Fetch my RSVPs (both attending & waitlist) with rsvpId for unified QR code
      const { data: rsvpData } = await supabase
        .from('rsvps')
        .select('id, status, event_id, events(*, associations(id, name))')
        .eq('user_id', user.id)
        .in('status', ['attending', 'waitlist']);

      const myEventsExtracted =
        rsvpData
          ?.filter((r: any) => r.events)
          .map((r: any) => ({ ...r.events, rsvpId: r.id, rsvpStatus: r.status })) || [];
      myEventsExtracted.sort(
        (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      setMyEvents(myEventsExtracted);

      // Fetch Community Leaderboard (top active attendees)
      const { data: topUsers } = await supabase
        .from('users')
        .select('id, full_name, email, points, badge, role')
        .order('points', { ascending: false })
        .limit(10);

      setLeaderboard(topUsers || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSavingContact(true);
    try {
      const packed = packUserContact(contactName, contactPhone);
      const { error } = await supabase
        .from('users')
        .update({ full_name: packed })
        .eq('id', currentUser.id);
      if (error) throw error;
      setUserProfile((prev: any) => ({ ...prev, full_name: packed }));
      toast.success('تم حفظ بياناتك الشخصية (الاسم ورقم الهاتف) للتذاكر بنجاح!');
    } catch (err) {
      console.error(err);
      toast.error('تعذر حفظ البيانات الشخصية');
    } finally {
      setSavingContact(false);
    }
  };

  const toggleInterest = async (categoryId: string) => {
    if (!userProfile) return;

    const currentInterests = userProfile.interests || [];
    const newInterests = currentInterests.includes(categoryId)
      ? currentInterests.filter((id: string) => id !== categoryId)
      : [...currentInterests, categoryId];

    setUserProfile({ ...userProfile, interests: newInterests });
    saveUserInterests(newInterests, currentUser?.id);
    setSavingPrefs(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('users').update({ interests: newInterests }).eq('id', user.id);
      }
    } catch (err) {
      console.error(err);
      toast.error('فشل حفظ التفضيلات');
    } finally {
      setSavingPrefs(false);
    }
  };

  const EventCardList = ({
    events,
    emptyMsg,
    showTicketButton,
  }: {
    events: any[];
    emptyMsg: string;
    showTicketButton?: boolean;
  }) => {
    const filteredEvents = events.filter(
      (e) =>
        e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.location && e.location.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#723c11]">
          <Loader2 className="w-8 h-8 animate-spin text-[#b87a29]" />
          <p className="font-bold text-sm">جاري تحميل الفعاليات...</p>
        </div>
      );
    }

    if (filteredEvents.length === 0) {
      return (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-[#dbc397] flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-[#fae1b7]/50 border border-[#dbc397] flex items-center justify-center text-[#b87a29] mb-4">
            <CalendarIcon className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-thmanyah font-bold text-[#301809] mb-1.5">
            {searchQuery ? `لا توجد نتائج تطابق "${searchQuery}"` : emptyMsg}
          </h3>
          <p className="text-xs text-[#723c11]/80 max-w-md font-medium">
            استكشف الفعاليات العامة المتاحة في ورقلة وشارك مع مجتمعك.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEvents.map((event) => (
          <Card
            key={event.id}
            className="overflow-hidden border border-[#e3d4b8] hover:border-[#b87a29] rounded-2xl shadow-xs hover:shadow-lg transition-all duration-300 group bg-white flex flex-col justify-between"
          >
            <div>
              <div
                className="h-44 overflow-hidden relative bg-[#fdfbf7] flex items-center justify-center cursor-pointer border-b border-[#e3d4b8]/60"
                onClick={() => navigate(`/event/${event.id}`)}
              >
                {/* Category badge */}
                {event.category && (
                  <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#fae1b7]/95 text-[#301809] border border-[#dbc397] shadow-xs">
                    {CATEGORY_ARABIC_LABELS[event.category] || 'نشاط مجتمعي'}
                  </div>
                )}

                {/* Favorite Button */}
                <button
                  type="button"
                  onClick={(e) => handleToggleFav(e, event.id)}
                  className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/90 hover:bg-white backdrop-blur-sm flex items-center justify-center shadow-sm transition-transform hover:scale-105 z-10 cursor-pointer"
                  title={favoriteIds.includes(event.id) ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                >
                  <Heart
                    className={`w-4 h-4 ${
                      favoriteIds.includes(event.id)
                        ? 'fill-rose-500 text-rose-500'
                        : 'text-[#723c11]'
                    }`}
                  />
                </button>

                {event.rsvpStatus === 'waitlist' && (
                  <div className="absolute bottom-3 right-3 bg-amber-600/95 text-white px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 shadow-sm z-10">
                    <Hourglass className="w-3 h-3" />
                    <span>في قائمة الانتظار</span>
                  </div>
                )}

                {event.cover_image_url ? (
                  <img
                    src={event.cover_image_url}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback =
                        e.currentTarget.parentElement?.querySelector('.event-card-fallback');
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div
                  className={`${
                    event.cover_image_url ? 'hidden' : ''
                  } event-card-fallback absolute inset-0 bg-gradient-to-tr from-[#301809] via-[#5c2f10] to-[#b87a29] flex items-center justify-center text-white flex-col gap-1.5 p-4 text-center`}
                >
                  <div className="w-11 h-11 rounded-2xl bg-[#efa83f]/20 border border-[#efa83f]/40 flex items-center justify-center text-[#efa83f]">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <span className="font-thmanyah font-bold text-base text-[#fae1b7] tracking-wide">
                    تواصل صحراء
                  </span>
                  <span className="text-[11px] text-[#dbc397] font-medium line-clamp-1">
                    {event.associations?.name || 'فعالية معتمدة'}
                  </span>
                </div>
              </div>

              <CardContent className="p-4.5">
                <h3
                  className="font-thmanyah font-bold text-base text-[#301809] line-clamp-1 cursor-pointer hover:text-[#b87a29] transition-colors mb-1.5"
                  onClick={() => navigate(`/event/${event.id}`)}
                >
                  {event.title}
                </h3>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const assocId = event.association_id || event.associations?.id;
                    if (assocId) navigate(`/association-profile/${assocId}`);
                  }}
                  className="text-xs text-[#b87a29] hover:text-[#301809] hover:underline font-bold mb-3 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{event.associations?.name || 'جمعية معتمدة'}</span>
                </button>

                <div className="space-y-2 text-xs text-[#723c11]">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-3.5 h-3.5 text-[#b87a29] shrink-0" />
                    <span className="font-semibold">
                      {event.date} • {event.start_time?.substring(0, 5)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#b87a29] shrink-0" />
                    <span className="truncate font-medium">{event.location || 'ورقلة'}</span>
                  </div>
                </div>
              </CardContent>
            </div>

            {showTicketButton && (
              <div className="px-4.5 pb-4.5 pt-0 space-y-2">
                <div className="flex gap-2 pt-3 border-t border-[#e3d4b8]/60">
                  {event.rsvpStatus === 'waitlist' ? (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/event/${event.id}`);
                      }}
                      className="flex-1 h-10 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl gap-1.5 text-xs cursor-pointer shadow-xs transition-all"
                    >
                      <Hourglass className="w-4 h-4" />
                      <span>متابعة الانتظار</span>
                    </Button>
                  ) : (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTicketEvent(event);
                      }}
                      className="flex-1 h-10 bg-gradient-to-l from-[#b87a29] to-[#efa83f] hover:from-[#723c11] hover:to-[#b87a29] text-[#301809] hover:text-white font-thmanyah font-bold rounded-xl gap-1.5 text-xs cursor-pointer shadow-xs transition-all"
                    >
                      <Ticket className="w-4 h-4" />
                      <span>عرض تذكرتي QR</span>
                    </Button>
                  )}
                  <Button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const isWL = event.rsvpStatus === 'waitlist';
                      if (
                        !window.confirm(
                          isWL
                            ? 'هل تود الانسحاب من قائمة الانتظار؟'
                            : 'هل أنت متأكد من رغبتك في إلغاء حجز تذكرة هذه الفعالية؟'
                        )
                      )
                        return;
                      try {
                        const {
                          data: { user },
                        } = await supabase.auth.getUser();
                        if (!user) return;
                        const { error } = await supabase
                          .from('rsvps')
                          .update({ status: 'cancelled' })
                          .eq('event_id', event.id)
                          .eq('user_id', user.id);
                        if (error) throw error;

                        if (!isWL) {
                          const { data: nextInLine } = await supabase
                            .from('rsvps')
                            .select('id')
                            .eq('event_id', event.id)
                            .eq('status', 'waitlist')
                            .order('created_at', { ascending: true })
                            .limit(1)
                            .maybeSingle();

                          if (nextInLine) {
                            await supabase
                              .from('rsvps')
                              .update({ status: 'attending' })
                              .eq('id', nextInLine.id);
                          }
                        }

                        toast.success(
                          isWL
                            ? 'تم الانسحاب من قائمة الانتظار.'
                            : 'تم إلغاء الحجز بنجاح وإخلاء المقعد.'
                        );
                        fetchEvents();
                      } catch {
                        toast.error('فشل إلغاء الحجز.');
                      }
                    }}
                    variant="outline"
                    className="h-10 text-xs text-red-600 border-red-200 hover:bg-red-50 rounded-xl px-3.5 cursor-pointer font-bold"
                    title="إلغاء الحجز"
                  >
                    إلغاء
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={buildGoogleCalendarUrl(event)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="h-9 rounded-xl bg-[#fdfbf7] border border-[#dbc397] hover:bg-[#fae1b7]/40 text-[#723c11] text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <CalendarIcon className="w-3.5 h-3.5 text-[#b87a29]" />
                    <span>إضافة للتقويم</span>
                  </a>
                  <a
                    href={buildWhatsAppShareUrl(
                      event,
                      `${window.location.origin}/event/${event.id}`
                    )}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="h-9 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>مشاركة واتساب</span>
                  </a>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    );
  };

  const userPoints = userProfile?.points || 0;
  const userLevel = Math.floor(userPoints / 100) + 1;
  const levelProgress = userPoints % 100;

  const accountMenuSlot = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="w-10 h-10 rounded-xl border border-[#dbc397] bg-white hover:bg-[#fae1b7]/40 text-[#301809] cursor-pointer"
          title="إعدادات الحساب"
        >
          <Settings className="w-4 h-4 text-[#723c11]" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className="w-56 bg-white/95 backdrop-blur-md rounded-2xl border border-[#dbc397] p-1.5 shadow-xl font-sans text-right"
      >
        <DropdownMenuLabel className="px-3 py-2 text-right">
          <p className="text-xs font-bold text-[#301809]">حسابي الشخصي</p>
          <p className="text-[11px] text-[#723c11]/75 font-mono truncate mt-0.5">
            {currentUser?.email || 'مشارك تواصل صحراء'}
          </p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-[#dbc397]/50 my-1" />

        <DropdownMenuItem
          onClick={() => setIsPasswordModalOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[#723c11] hover:bg-[#fae1b7]/40 cursor-pointer"
        >
          <KeyRound className="w-4 h-4 text-[#b87a29]" />
          <span>تغيير كلمة المرور</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-[#dbc397]/50 my-1" />

        <DropdownMenuItem
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-red-500" />
          <span>تسجيل الخروج</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div
      className="min-h-screen bg-[#fdfbf7] bg-[radial-gradient(ellipse_at_top,_rgba(239,168,63,0.12),_transparent_55%)] text-[#301809] pb-16"
      dir="rtl"
    >
      {/* Unified Platform Header */}
      <UnifiedHeader rightSlot={accountMenuSlot} />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Regal Sahara Attendee Hero */}
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-l from-[#301809] via-[#4a250e] to-[#2b1507] text-white p-6 md:p-7 border border-[#b87a29]/30 shadow-lg">
          <div className="absolute -left-20 -top-20 w-64 h-64 rounded-full bg-[#efa83f]/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-[#efa83f]/20 border border-[#efa83f]/45 flex items-center justify-center text-[#fae1b7] font-thmanyah font-bold text-2xl shadow-sm shrink-0">
                {contactName
                  ? contactName.charAt(0)
                  : currentUser?.email
                  ? currentUser.email.charAt(0).toUpperCase()
                  : 'م'}
              </div>
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#efa83f]/20 border border-[#efa83f]/40 text-[#fae1b7] text-[11px] font-bold mb-1.5">
                  <Sparkles className="w-3 h-3 text-[#efa83f]" />
                  <span>مساحة المشارك والزائر</span>
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-thmanyah font-bold text-[#fae1b7] truncate">
                  مرحباً بك{contactName ? `، ${contactName}` : ' في تواصل صحراء'}
                </h1>
                <p className="text-xs sm:text-sm text-[#dbc397]/90 mt-1">
                  تابع تذاكرك الذكية، استكشف فعاليات ورقلة، وارتقِ برصيد نقاطك المجتمعية.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Button
                onClick={() => navigate('/events')}
                className="h-11 px-5 rounded-xl bg-gradient-to-l from-[#b87a29] to-[#efa83f] hover:from-[#a06720] hover:to-[#e0982e] text-[#301809] font-thmanyah font-bold shadow-md cursor-pointer flex items-center gap-2 text-sm"
              >
                <Compass className="w-4 h-4" />
                <span>استكشف دليل الفعاليات</span>
              </Button>
            </div>
          </div>

          {/* Inline Compact KPI Strip */}
          <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
            <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#dbc397] font-medium">تذاكري المؤكدة</p>
                <p className="text-2xl font-thmanyah font-bold text-white mt-0.5">
                  {myEvents.length}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#efa83f]/20 flex items-center justify-center text-[#efa83f]">
                <Ticket className="w-4 h-4" />
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#dbc397] font-medium">رصيد النقاط</p>
                <p className="text-2xl font-thmanyah font-bold text-[#fae1b7] mt-0.5">
                  {userPoints}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#efa83f]/20 flex items-center justify-center text-[#efa83f]">
                <Star className="w-4 h-4 fill-[#efa83f]" />
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#dbc397] font-medium">مستوى المكتشف</p>
                <p className="text-xl font-thmanyah font-bold text-white mt-0.5">
                  المستوى {userLevel}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#efa83f]/20 flex items-center justify-center text-[#efa83f]">
                <Trophy className="w-4 h-4" />
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#dbc397] font-medium">الفعاليات المتاحة</p>
                <p className="text-2xl font-thmanyah font-bold text-white mt-0.5">
                  {publicEvents.length}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#efa83f]/20 flex items-center justify-center text-[#efa83f]">
                <Compass className="w-4 h-4" />
              </div>
            </div>
          </div>
        </section>

        {/* Tabs System + Compact Search */}
        <Tabs defaultValue="discover" dir="rtl" className="w-full space-y-6">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <TabsList className="bg-white p-1.5 rounded-2xl border border-[#dbc397]/70 shadow-xs h-auto w-full xl:w-auto flex flex-wrap gap-1">
              <TabsTrigger
                value="discover"
                className="flex-1 sm:flex-initial px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl text-[#723c11] data-[state=active]:bg-[#301809] data-[state=active]:text-[#fae1b7] data-[state=active]:shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Compass className="w-4 h-4" />
                <span>اكتشف</span>
              </TabsTrigger>
              <TabsTrigger
                value="calendar"
                className="flex-1 sm:flex-initial px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl text-[#723c11] data-[state=active]:bg-[#301809] data-[state=active]:text-[#fae1b7] data-[state=active]:shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Ticket className="w-4 h-4" />
                <span>تذاكري ({myEvents.length})</span>
              </TabsTrigger>
              <TabsTrigger
                value="prefs"
                className="flex-1 sm:flex-initial px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl text-[#723c11] data-[state=active]:bg-[#301809] data-[state=active]:text-[#fae1b7] data-[state=active]:shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>اهتماماتي وبياناتي</span>
              </TabsTrigger>
              <TabsTrigger
                value="profile"
                className="flex-1 sm:flex-initial px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl text-[#723c11] data-[state=active]:bg-[#301809] data-[state=active]:text-[#fae1b7] data-[state=active]:shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trophy className="w-4 h-4 text-[#b87a29] data-[state=active]:text-[#efa83f]" />
                <span>إنجازاتي</span>
              </TabsTrigger>
            </TabsList>

            {/* Compact Search */}
            <div className="relative w-full xl:w-80">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#b87a29]" />
              <Input
                placeholder="ابحث عن فعالية باسمها أو موقعها..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 pl-9 h-11 bg-white border border-[#dbc397] rounded-2xl font-medium text-sm focus-visible:border-[#b87a29] shadow-xs"
                dir="rtl"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#723c11]/70 hover:text-[#301809] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* Discover Tab */}
            <TabsContent value="discover" key="discover" className="mt-0 outline-none space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <PartnerAdsBanner />
                <div className="mt-6">
                  <div className="flex flex-wrap justify-between items-center gap-3 mb-5 pb-3 border-b border-[#e3d4b8]">
                    <div>
                      <h2 className="text-lg md:text-xl font-thmanyah font-bold text-[#301809]">
                        فعاليات قادمة في ورقلة
                      </h2>
                      <p className="text-xs text-[#723c11]/80 mt-0.5">
                        تصفح الأنشطة المتاحة واحجز تذكرتك المجانية فوراً
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setOnlyFavorites(!onlyFavorites)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          onlyFavorites
                            ? 'bg-rose-50 border-rose-300 text-rose-600'
                            : 'bg-white border-[#dbc397] text-[#723c11] hover:bg-[#fae1b7]/30'
                        }`}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            onlyFavorites ? 'fill-rose-500 text-rose-500' : 'text-rose-500'
                          }`}
                        />
                        <span>المفضلة ({favoriteIds.length})</span>
                      </button>

                      {userProfile?.interests?.length > 0 && (
                        <div className="flex items-center gap-2.5 bg-white px-3.5 py-2 rounded-xl border border-[#dbc397]">
                          <span className="text-xs font-bold text-[#723c11]">حسب اهتماماتي</span>
                          <button
                            type="button"
                            onClick={() => setShowAll(!showAll)}
                            className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                              showAll ? 'bg-stone-200' : 'bg-[#b87a29]'
                            }`}
                          >
                            <div
                              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-xs ${
                                showAll ? 'left-0.5' : 'right-0.5'
                              }`}
                            />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <EventCardList
                    events={publicEvents.filter((e) => {
                      if (onlyFavorites && !favoriteIds.includes(e.id)) return false;
                      if (showAll || !userProfile?.interests?.length) return true;
                      return userProfile.interests.includes(e.category);
                    })}
                    emptyMsg={
                      onlyFavorites
                        ? 'لا توجد فعاليات محفوظة في المفضلة بعد.'
                        : showAll
                        ? 'لا توجد فعاليات عامة قادمة حالياً.'
                        : 'لا توجد فعاليات تطابق اهتماماتك حالياً. جرب عرض كل الفعاليات أو تعديل اهتماماتك.'
                    }
                  />
                </div>
              </motion.div>
            </TabsContent>

            {/* My Events Tab */}
            <TabsContent value="calendar" key="calendar" className="mt-0 outline-none">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="mb-5 pb-3 border-b border-[#e3d4b8]">
                  <h2 className="text-lg md:text-xl font-thmanyah font-bold text-[#301809]">
                    تذاكري والفعاليات المحجوزة ({myEvents.length})
                  </h2>
                  <p className="text-xs text-[#723c11]/80 mt-0.5">
                    يمكنك استعراض تذكرتك في أي وقت وإبراز رمز QR عند الدخول.
                  </p>
                </div>
                <EventCardList
                  events={myEvents}
                  emptyMsg="لم تقم بالتسجيل في أي فعالية بعد. استكشف فعاليات ورقلة واحجز تذكرتك مجاناً!"
                  showTicketButton={true}
                />
              </motion.div>
            </TabsContent>

            {/* Preferences & Personal Info Tab */}
            <TabsContent value="prefs" key="prefs" className="mt-0 outline-none">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Personal Ticket Contact Info Card */}
                <Card className="border border-[#e3d4b8] shadow-xs rounded-3xl overflow-hidden bg-white">
                  <CardContent className="p-6 md:p-7">
                    <div className="mb-5">
                      <h2 className="text-lg md:text-xl font-thmanyah font-bold text-[#301809] flex items-center gap-2">
                        <User className="w-5 h-5 text-[#b87a29]" />
                        <span>بياناتي الشخصية على التذاكر</span>
                      </h2>
                      <p className="text-xs text-[#723c11]/80 mt-1">
                        تُطبع هذه البيانات على تذاكرك الرسمية وتظهر للجمعيات المنظمة في كشوفات
                        الحضور.
                      </p>
                    </div>

                    <form
                      onSubmit={handleSaveContact}
                      className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
                    >
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-[#301809] flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#b87a29]" />
                          <span>الاسم الكامل</span>
                        </Label>
                        <Input
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="أدخل اسمك ولقبك الكامل..."
                          className="h-11 rounded-xl border border-[#dbc397] bg-[#fdfbf7] focus-visible:border-[#b87a29]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-[#301809] flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-[#b87a29]" />
                          <span>رقم الهاتف للتواصل</span>
                        </Label>
                        <Input
                          dir="ltr"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          placeholder="06XXXXXXXX / 07XXXXXXXX"
                          className="h-11 rounded-xl border border-[#dbc397] bg-[#fdfbf7] text-right font-mono focus-visible:border-[#b87a29]"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={savingContact}
                        className="h-11 rounded-xl bg-gradient-to-l from-[#301809] to-[#723c11] hover:from-[#4a250e] hover:to-[#b87a29] text-[#fae1b7] font-thmanyah font-bold cursor-pointer shadow-xs"
                      >
                        {savingContact ? (
                          <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                        ) : (
                          'حفظ بيانات التذكرة'
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Category Interests Card */}
                <Card className="border border-[#e3d4b8] shadow-xs rounded-3xl overflow-hidden bg-white">
                  <CardContent className="p-6 md:p-8">
                    <div className="text-center mb-7">
                      <div className="bg-[#fae1b7]/60 w-14 h-14 rounded-2xl border border-[#dbc397] flex items-center justify-center mx-auto mb-3.5 text-[#b87a29]">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <h2 className="text-xl md:text-2xl font-thmanyah font-bold text-[#301809] mb-1.5">
                        اهتماماتك الثقافية والمجتمعية
                      </h2>
                      <p className="text-xs sm:text-sm text-[#723c11]/80 max-w-md mx-auto">
                        اختر المجالات التي تهمك لنقترح لك الفعاليات والجمعيات المناسبة تلقائياً.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 max-w-3xl mx-auto">
                      {USER_INTEREST_CATEGORIES.map((cat) => {
                        const isSelected = userProfile?.interests?.includes(cat.id);
                        const Icon = CATEGORY_ICONS[cat.id] || Sparkles;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => toggleInterest(cat.id)}
                            className={`flex flex-col items-start text-right gap-2 p-4 rounded-2xl border transition-all duration-200 relative cursor-pointer ${
                              isSelected
                                ? 'bg-[#fae1b7]/45 border-[#b87a29] shadow-xs'
                                : 'bg-[#fdfbf7] border-[#e3d4b8] hover:border-[#b87a29] hover:bg-[#fae1b7]/20'
                            }`}
                          >
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                isSelected
                                  ? 'bg-[#301809] text-[#efa83f]'
                                  : 'bg-[#fae1b7]/60 text-[#723c11]'
                              }`}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-thmanyah font-bold text-sm text-[#301809]">
                                {cat.label}
                              </p>
                              <p className="text-[11px] text-[#723c11]/80 mt-0.5 line-clamp-2">
                                {cat.description}
                              </p>
                            </div>
                            {isSelected && (
                              <div className="absolute top-3 left-3 bg-[#b87a29] text-white p-1 rounded-full">
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-6 text-center text-xs text-[#723c11]/80 font-medium">
                      {savingPrefs
                        ? 'جاري مزامنة اهتماماتك...'
                        : 'تُحفظ التغييرات تلقائياً في حسابك وتُطبَّق فوراً في دليل الفعاليات'}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Achievements & Gamification Tab (Cohesive Sahara Espresso & Gold) */}
            <TabsContent value="profile" key="profile" className="mt-0 outline-none">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Points Card (Regal Sahara Espresso & Gold) */}
                  <Card className="col-span-1 md:col-span-2 border border-[#b87a29]/40 shadow-lg rounded-3xl bg-gradient-to-bl from-[#301809] via-[#4a250e] to-[#241106] text-white overflow-hidden relative">
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                      <div className="absolute top-0 right-0 w-72 h-72 bg-[#efa83f] rounded-full blur-3xl -mr-32 -mt-32" />
                      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#b87a29] rounded-full blur-3xl -ml-28 -mb-28" />
                    </div>
                    <CardContent className="p-7 md:p-8 relative z-10 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex items-center gap-4 mb-7">
                          <div className="w-15 h-15 rounded-2xl bg-[#efa83f]/20 border border-[#efa83f]/40 flex items-center justify-center shadow-sm">
                            <Star className="w-7 h-7 text-[#efa83f] fill-[#efa83f]" />
                          </div>
                          <div>
                            <p className="text-[#dbc397] text-xs font-bold">رصيد النقاط التراكمي</p>
                            <h3 className="text-3xl md:text-4xl font-thmanyah font-bold text-[#fae1b7]">
                              {userPoints} نقطة
                            </h3>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between font-bold text-sm">
                            <span className="text-[#dbc397]">مستوى المكتشف</span>
                            <span className="text-[#efa83f]">المستوى {userLevel}</span>
                          </div>
                          <div className="h-3.5 bg-white/10 rounded-full overflow-hidden border border-white/10 p-0.5">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${levelProgress}%` }}
                              className="h-full bg-gradient-to-l from-[#efa83f] to-[#fae1b7] rounded-full"
                            />
                          </div>
                          <p className="text-[#dbc397]/90 text-xs font-medium">
                            باقي {100 - levelProgress} نقطة للترقية للمستوى القادم (+10 نقاط لكل
                            حجز، +5 نقاط لكل تقييم)
                          </p>
                        </div>
                      </div>

                      <div className="mt-8 grid grid-cols-2 gap-3.5">
                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                          <p className="text-xs text-[#dbc397] mb-1 font-medium">
                            الفعاليات المسجلة
                          </p>
                          <p className="text-2xl font-thmanyah font-bold text-[#efa83f]">
                            {myEvents.length}
                          </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                          <p className="text-xs text-[#dbc397] mb-1 font-medium">الشارة الشرفية</p>
                          <p className="text-lg font-thmanyah font-bold text-white truncate">
                            {userProfile?.badge || 'عضو نشط'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Badges Card */}
                  <Card className="border border-[#e3d4b8] shadow-xs rounded-3xl bg-white p-6 flex flex-col justify-between">
                    <div>
                      <h2 className="text-lg font-thmanyah font-bold text-[#301809] mb-5 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-[#b87a29]" />
                        <span>أوسمتي الشرفية</span>
                      </h2>

                      <div className="space-y-3.5">
                        {/* Active Attendee Badge */}
                        <div
                          className={`p-3.5 rounded-2xl border flex items-center gap-3.5 transition-all ${
                            userPoints >= 30 || myEvents.length >= 1
                              ? 'bg-[#fae1b7]/35 border-[#b87a29]/60'
                              : 'bg-stone-50 border-stone-200 grayscale opacity-60'
                          }`}
                        >
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 ${
                              userPoints >= 30 || myEvents.length >= 1
                                ? 'bg-[#b87a29]'
                                : 'bg-stone-400'
                            }`}
                          >
                            <CalendarHeart className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                              <p className="font-bold text-xs text-[#301809]">حاضر نشط</p>
                              <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded-full border border-[#dbc397]">
                                {Math.min(userPoints, 50)}/50
                              </span>
                            </div>
                            <div className="h-1.5 bg-[#dbc397]/40 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((userPoints / 50) * 100, 100)}%` }}
                                className="h-full bg-[#b87a29] rounded-full"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Heritage Explorer Badge */}
                        {(() => {
                          const heritageCount = myEvents.filter(
                            (e: any) => e.category === 'Heritage'
                          ).length;
                          const isUnlocked = heritageCount >= 2 || userPoints >= 100;
                          return (
                            <div
                              className={`p-3.5 rounded-2xl border flex items-center gap-3.5 transition-all ${
                                isUnlocked
                                  ? 'bg-[#fae1b7]/45 border-[#b87a29]'
                                  : 'opacity-60 grayscale bg-stone-50 border-stone-200'
                              }`}
                            >
                              <div className="w-11 h-11 rounded-xl bg-[#efa83f] flex items-center justify-center text-[#301809] shrink-0">
                                <Compass className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-xs text-[#301809]">مكتشف التراث</p>
                                <p className="text-[11px] text-[#723c11] mt-0.5">
                                  {isUnlocked
                                    ? 'وسام مفعّل — من حماة تراث وارجلان'
                                    : 'يُفتح بحضور فعاليتين تراثيتين أو 100 نقطة'}
                                </p>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Saharan Ambassador Badge */}
                        {(() => {
                          const isUnlocked = userPoints >= 200;
                          return (
                            <div
                              className={`p-3.5 rounded-2xl border flex items-center gap-3.5 transition-all ${
                                isUnlocked
                                  ? 'bg-[#301809]/5 border-[#301809]/40'
                                  : 'opacity-60 grayscale bg-stone-50 border-stone-200'
                              }`}
                            >
                              <div className="w-11 h-11 rounded-xl bg-[#301809] flex items-center justify-center text-[#efa83f] shrink-0">
                                <Medal className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-xs text-[#301809]">سفير وارجلان</p>
                                <p className="text-[11px] text-[#723c11] mt-0.5">
                                  {isUnlocked
                                    ? 'أعلى وسام مجتمعي في تواصل صحراء'
                                    : 'يُفتح عند الوصول إلى 200 نقطة'}
                                </p>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-[#e3d4b8] text-center">
                      <p className="text-[11px] text-[#723c11] font-medium">
                        احجز الفعاليات وشارك تقييماتك لزيادة نقاطك وتصدّر لوحة الشرف
                      </p>
                    </div>
                  </Card>
                </div>

                {/* Community Leaderboard Card */}
                <Card className="border border-[#e3d4b8] shadow-xs rounded-3xl bg-white overflow-hidden">
                  <CardContent className="p-6 md:p-7">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-[#e3d4b8]">
                      <div>
                        <h3 className="text-lg md:text-xl font-thmanyah font-bold text-[#301809] flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-[#b87a29]" />
                          <span>لوحة شرف رواد وارجلان</span>
                        </h3>
                        <p className="text-xs text-[#723c11]/80 mt-0.5">
                          ترتيب الأعضاء الأكثر حضوراً ومشاركة في الفعاليات الثقافية والتراثية
                        </p>
                      </div>
                      <span className="text-xs font-bold bg-[#fae1b7]/60 text-[#301809] px-3 py-1 rounded-full border border-[#dbc397] self-start sm:self-auto">
                        تحديث مباشر
                      </span>
                    </div>

                    {leaderboard.length === 0 ? (
                      <p className="text-center text-xs text-[#723c11] py-8">
                        لا توجد بيانات نقاط مسجلة حالياً.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {leaderboard.map((u, idx) => {
                          const parsed = parseUserContact(u.full_name, u.email);
                          const isCurrentUser = currentUser?.id === u.id;
                          return (
                            <div
                              key={u.id}
                              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                                isCurrentUser
                                  ? 'bg-[#fae1b7]/45 border-[#b87a29]'
                                  : idx < 3
                                  ? 'bg-[#fdfbf7] border-[#dbc397]'
                                  : 'bg-white border-[#e3d4b8]/70'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                    idx === 0
                                      ? 'bg-gradient-to-br from-[#efa83f] to-[#b87a29] text-[#301809]'
                                      : idx === 1
                                      ? 'bg-[#301809] text-[#fae1b7]'
                                      : idx === 2
                                      ? 'bg-[#723c11] text-[#fae1b7]'
                                      : 'bg-[#fae1b7]/60 text-[#723c11]'
                                  }`}
                                >
                                  #{idx + 1}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-xs text-[#301809] truncate flex items-center gap-1.5">
                                    <span>{parsed.name}</span>
                                    {isCurrentUser && (
                                      <span className="text-[10px] bg-[#301809] text-[#efa83f] px-2 py-0.5 rounded-full font-bold">
                                        أنت
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-[10px] text-[#723c11]/80 font-medium">
                                    {u.badge || 'عضو مجتمع وارجلان'}
                                  </p>
                                </div>
                              </div>
                              <div className="text-left shrink-0">
                                <span className="font-bold text-xs text-[#301809] bg-[#fae1b7]/60 px-3 py-1 rounded-xl border border-[#dbc397]">
                                  {u.points || 0} نقطة
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent
          className="font-sans border border-[#dbc397] rounded-3xl bg-white max-w-md"
          dir="rtl"
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-thmanyah font-bold text-[#301809]">
              تغيير كلمة المرور
            </DialogTitle>
            <DialogDescription className="text-xs text-[#723c11] font-medium mt-1">
              أدخل كلمة المرور الجديدة لحسابك الشخصي.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdatePassword} className="space-y-4 pt-3 text-right">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#301809]">كلمة المرور الجديدة</Label>
              <Input
                type="password"
                required
                placeholder="6 أحرف على الأقل..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-11 border border-[#dbc397] rounded-xl focus-visible:border-[#b87a29]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#301809]">تأكيد كلمة المرور</Label>
              <Input
                type="password"
                required
                placeholder="أعد إدخال كلمة المرور..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 border border-[#dbc397] rounded-xl focus-visible:border-[#b87a29]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPasswordModalOpen(false)}
                className="flex-1 rounded-xl h-11 border-[#dbc397] text-[#723c11] font-bold cursor-pointer"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={isUpdatingPassword}
                className="flex-1 rounded-xl h-11 bg-gradient-to-l from-[#b87a29] to-[#efa83f] text-[#301809] font-thmanyah font-bold cursor-pointer"
              >
                {isUpdatingPassword ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  'حفظ التغيير'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* QR Ticket Modal */}
      {activeTicketEvent && currentUser && (
        <TicketCard
          event={activeTicketEvent}
          userId={currentUser.id}
          rsvpId={activeTicketEvent.rsvpId}
          userName={contactName || currentUser.email?.split('@')[0]}
          userPhone={contactPhone}
          onClose={() => setActiveTicketEvent(null)}
        />
      )}
    </div>
  );
}
