import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { 
  CalendarIcon, 
  MapPin, 
  Compass, 
  CalendarHeart, 
  History, 
  Search, 
  X, 
  Settings, 
  Trophy, 
  Star, 
  Check,
  KeyRound,
  LogOut,
  ArrowRight,
  Ticket,
  Sparkles,
  Loader2
} from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import PartnerAdsBanner from '../../components/PartnerAdsBanner';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import TicketCard from '../../components/TicketCard';
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

const CATEGORIES = [
  { id: 'Heritage', label: 'تراثي', icon: '🏺' },
  { id: 'Religious', label: 'ديني', icon: '🕌' },
  { id: 'Educational', label: 'تعليمي', icon: '📚' },
  { id: 'Cultural', label: 'ثقافي', icon: '🎨' },
  { id: 'Sports', label: 'رياضي', icon: '⚽' }
];

export default function AttendeeDashboard() {
  const navigate = useNavigate();
  const [publicEvents, setPublicEvents] = useState<any[]>([]);
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // States for Personalization & Gamification
  const [userProfile, setUserProfile] = useState<any>(null);
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
        password: newPassword
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
          const relevantEvent = myEventsRef.current.find(e => e.id === payload.new.id);
          if (relevantEvent) {
             const oldData = relevantEvent;
             const newData = payload.new as any;
             
             const changes: string[] = [];
             const getVal = (val: any) => (val === null || val === undefined ? '' : String(val).trim());
             
             const titleChanged = getVal(oldData.title) !== getVal(newData.title);
             const dateChanged = getVal(oldData.date) !== getVal(newData.date);
             const timeChanged = getVal(oldData.start_time).substring(0, 5) !== getVal(newData.start_time).substring(0, 5);
             const locationChanged = getVal(oldData.location) !== getVal(newData.location);
             const privacyChanged = oldData.is_public !== newData.is_public;
             const statusChanged = getVal(oldData.status) !== getVal(newData.status);

             if (titleChanged && newData.title) {
               changes.push(`📝 العنوان الجديد: "${newData.title}"`);
             }
             if (dateChanged && newData.date) {
               changes.push(`📅 التاريخ: ${newData.date}`);
             }
             if (timeChanged && newData.start_time) {
               changes.push(`⏰ الوقت: ${newData.start_time.substring(0, 5)}`);
             }
             if (locationChanged && newData.location) {
               changes.push(`📍 المكان: "${newData.location}"`);
             }
             if (privacyChanged) {
               changes.push(newData.is_public ? '🔓 أصبحت الفعالية عامة' : '🔒 أصبحت الفعالية خاصة بالمسجلين');
             }
             if (statusChanged) {
               changes.push(newData.status === 'archived' ? '📦 تم نقلها للأرشيف' : '📤 تمت استعادتها من الأرشيف');
             }
             
             if (changes.length === 0) {
               fetchEvents();
               return;
             }

             const description = changes.join(' | ');
             const isNoLongerAvailable = newData.is_public === false || newData.status === 'archived';

             if (isNoLongerAvailable) {
               let alertTitle = `⚠️ تغيير في خصوصية الفعالية: "${newData.title}"`;
               if (newData.status === 'archived') {
                 alertTitle = `📦 تم أرشفة الفعالية: "${newData.title}"`;
               } else if (newData.is_public === false) {
                 alertTitle = `🔒 أصبحت الفعالية خاصة: "${newData.title}"`;
               }

               toast.warning(alertTitle, {
                 description: description || 'تم تحديث حالة الفعالية ونوع خصوصيتها.',
                 duration: 40000,
               });
             } else {
               toast.info(`🔔 تحديث في فعالية: "${newData.title}"`, {
                 description,
                 action: {
                   label: 'عرض التفاصيل',
                   onClick: () => navigate(`/event/${newData.id}`)
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
              filter: `id=eq.${user.id}` 
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);

      // Fetch User Profile (Interests/Points/Badge)
      const { data: profileData } = await supabase
        .from('users')
        .select('interests, points, badge')
        .eq('id', user.id)
        .single();
      
      setUserProfile(profileData || { interests: [], points: 0, badge: 'Newcomer' });

      // Fetch public events
      const { data: publicData } = await supabase
        .from('events')
        .select('*, associations(name)')
        .eq('is_public', true)
        .eq('status', 'active')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true });
        
      setPublicEvents(publicData || []);

      // Fetch my RSVPs
      const { data: rsvpData } = await supabase
        .from('rsvps')
        .select('event_id, events(*, associations(name))')
        .eq('user_id', user.id)
        .eq('status', 'attending');

      const myEventsExtracted = rsvpData?.map((r: any) => r.events).filter(e => e) || [];
      myEventsExtracted.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setMyEvents(myEventsExtracted);
      
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = async (categoryId: string) => {
    if (!userProfile) return;
    
    const currentInterests = userProfile.interests || [];
    const newInterests = currentInterests.includes(categoryId)
      ? currentInterests.filter((id: string) => id !== categoryId)
      : [...currentInterests, categoryId];
      
    setUserProfile({ ...userProfile, interests: newInterests });
    setSavingPrefs(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
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

  const EventCardList = ({ events, emptyMsg, showTicketButton }: { events: any[], emptyMsg: string, showTicketButton?: boolean }) => {
    const filteredEvents = events.filter(e => 
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
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm border-2 border-dashed border-[#dbc397] flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-[#fae1b7]/40 border border-[#dbc397] flex items-center justify-center text-[#723c11] mb-4 text-2xl">
            📅
          </div>
          <h3 className="text-xl font-thmanyah font-bold text-[#301809] mb-2">
            {searchQuery ? `لا توجد نتائج تطابق "${searchQuery}"` : emptyMsg}
          </h3>
          <p className="text-xs text-[#723c11]/80 max-w-md font-medium">
            استكشف الفعاليات العامة المتاحة في ورقلة وشارك مع مجتمعك.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => (
          <Card 
            key={event.id} 
            className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-[#dbc397]/60 hover:border-[#b87a29] rounded-3xl shadow-md group bg-white flex flex-col justify-between"
          >
            <div>
              <div 
                className="h-48 overflow-hidden relative bg-[#fdfbf7] flex items-center justify-center cursor-pointer border-b border-[#dbc397]/40" 
                onClick={() => navigate(`/event/${event.id}`)}
              >
                {event.cover_image_url ? (
                  <img 
                    src={event.cover_image_url} 
                    alt={event.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.parentElement?.querySelector('.event-card-fallback');
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`${event.cover_image_url ? 'hidden' : ''} event-card-fallback absolute inset-0 bg-gradient-to-tr from-[#301809] via-[#723c11] to-[#b87a29] flex items-center justify-center text-white flex-col gap-2 p-4 text-center`}>
                  <div className="w-12 h-12 rounded-2xl bg-[#efa83f]/20 border border-[#efa83f]/40 flex items-center justify-center text-[#efa83f] text-2xl shadow-sm">
                    🏺
                  </div>
                  <span className="font-thmanyah font-bold text-lg text-[#fae1b7] drop-shadow-sm tracking-wide">تواصل صحراء</span>
                  <span className="text-xs text-[#dbc397] font-bold line-clamp-1">{event.associations?.name || 'فعالية معتمدة'}</span>
                </div>
              </div>

              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 
                    className="font-thmanyah font-bold text-lg text-[#301809] line-clamp-1 cursor-pointer hover:text-[#b87a29] transition-colors" 
                    onClick={() => navigate(`/event/${event.id}`)}
                  >
                    {event.title}
                  </h3>
                </div>
                <p className="text-xs text-[#b87a29] font-bold mb-3 flex items-center gap-1">
                  <span>🏛️ تنظيم:</span>
                  <span>{event.associations?.name || 'جمعية معتمدة'}</span>
                </p>
                
                <div className="space-y-2 mt-2 text-xs text-[#723c11]">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-[#b87a29] shrink-0" />
                    <span className="font-semibold">{event.date} • {event.start_time?.substring(0,5)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#b87a29] shrink-0" />
                    <span className="truncate font-medium">{event.location || 'ورقلة'}</span>
                  </div>
                </div>
              </CardContent>
            </div>

            {showTicketButton && (
              <div className="px-5 pb-5 pt-0">
                <div className="flex gap-2 pt-3 border-t border-[#dbc397]/40">
                  <Button
                    onClick={(e) => { e.stopPropagation(); setActiveTicketEvent(event); }}
                    className="flex-1 h-11 bg-gradient-to-r from-[#b87a29] to-[#efa83f] hover:from-[#723c11] hover:to-[#b87a29] text-white font-bold rounded-xl gap-1.5 text-xs cursor-pointer shadow-sm transition-all"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>عرض تذكرتي</span>
                  </Button>
                  <Button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!window.confirm('هل أنت متأكد من رغبتك في إلغاء حجز تذكرة هذه الفعالية؟')) return;
                      try {
                        const { data: { user } } = await supabase.auth.getUser();
                        if (!user) return;
                        const { error } = await supabase
                          .from('rsvps')
                          .update({ status: 'cancelled' })
                          .eq('event_id', event.id)
                          .eq('user_id', user.id);
                        if (error) throw error;
                        toast.success('تم إلغاء الحجز بنجاح وإخلاء المقعد.');
                        fetchEvents();
                      } catch {
                        toast.error('فشل إلغاء الحجز.');
                      }
                    }}
                    variant="outline"
                    className="h-11 text-xs text-red-600 border-red-200 hover:bg-red-50 rounded-xl px-4 cursor-pointer font-bold"
                    title="إلغاء الحجز"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-[#301809] pb-16" dir="rtl">
      {/* Sticky Blur Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b-2 border-[#dbc397]/60 shadow-xs">
        <div className="container mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
          
          {/* User Brand & Welcome */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#301809] to-[#723c11] border border-[#dbc397] flex items-center justify-center text-[#efa83f] font-black text-xl shadow-sm shrink-0">
              {currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : '👤'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base md:text-xl font-thmanyah font-bold text-[#301809]">
                  مرحباً بك في تواصل صحراء
                </h1>
                <span className="bg-[#fae1b7] text-[#723c11] border border-[#d4b174] text-[10px] font-black px-2 py-0.5 rounded-full hidden sm:inline-block">
                  مشارك / زائر
                </span>
              </div>
              <p className="text-xs text-[#723c11]/80 font-medium hidden sm:block">
                اكتشف الفعاليات وتذاكرك وأرصدة نقاطك في مجتمع ورقلة
              </p>
            </div>
          </div>

          {/* Quick Actions & Settings Gear */}
          <div className="flex items-center gap-2 md:gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/heritage')}
              className="border-2 border-[#dbc397] text-[#723c11] hover:bg-[#fae1b7]/40 h-10 px-3 md:px-4 rounded-xl font-bold cursor-pointer hidden md:flex items-center gap-1.5 text-xs md:text-sm"
            >
              <History className="w-4 h-4 text-[#b87a29]" />
              <span>الأرشيف التراثي</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="border-2 border-[#dbc397] text-[#723c11] hover:bg-[#fae1b7]/40 h-10 px-3 md:px-4 rounded-xl font-bold cursor-pointer hidden sm:flex items-center gap-1.5 text-xs md:text-sm"
            >
              <span>الموقع الرئيسي</span>
              <ArrowRight className="w-4 h-4 text-[#b87a29]" />
            </Button>

            {/* Gear Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-10 h-10 rounded-xl border-2 border-[#dbc397] bg-white hover:bg-[#fae1b7]/40 text-[#301809] cursor-pointer"
                  title="إعدادات الحساب"
                >
                  <Settings className="w-5 h-5 text-[#723c11]" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="start"
                sideOffset={8}
                className="w-60 bg-white/95 backdrop-blur-md rounded-2xl border-2 border-[#dbc397] p-1.5 shadow-2xl font-sans text-right"
              >
                <DropdownMenuLabel className="px-3 py-2 text-right">
                  <p className="text-xs font-black text-[#301809]">حسابي الشخصي</p>
                  <p className="text-[10px] text-slate-500 font-mono truncate mt-0.5">{currentUser?.email || 'Attendee User'}</p>
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="bg-[#dbc397]/50 my-1" />

                <DropdownMenuItem
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-[#723c11] hover:bg-[#fae1b7]/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-[#b87a29]" />
                    <span>تغيير كلمة المرور</span>
                  </div>
                  <span className="text-[10px]">🔑</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => navigate('/heritage')}
                  className="md:hidden flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-[#723c11] hover:bg-[#fae1b7]/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-[#b87a29]" />
                    <span>الأرشيف التراثي</span>
                  </div>
                  <span className="text-[10px]">🏺</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => navigate('/')}
                  className="sm:hidden flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-[#723c11] hover:bg-[#fae1b7]/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-[#b87a29]" />
                    <span>الانتقال للموقع الرئيسي</span>
                  </div>
                  <span className="text-[10px]">🌐</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-[#dbc397]/50 my-1" />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>تسجيل الخروج</span>
                  </div>
                  <span className="text-[10px] text-red-400">خروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="container mx-auto px-4 md:px-8 pt-5 md:pt-6 space-y-5 md:space-y-6">

        {/* Attendee Quick KPI Cards (Compact & Elegant) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {/* Card 1: My Tickets */}
          <div className="relative overflow-hidden bg-white rounded-2xl p-3.5 sm:p-4 border border-[#dbc397]/70 shadow-xs hover:shadow-md hover:border-[#b87a29] transition-all group">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[11px] sm:text-xs font-bold text-[#723c11] block truncate">تذاكري المؤكدة</span>
                <span className="text-[10px] text-[#723c11]/70 block truncate">فعاليات قادمة</span>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#fae1b7]/40 border border-[#dbc397] flex items-center justify-center text-[#723c11] shrink-0 group-hover:scale-105 transition-transform">
                <Ticket className="w-4 h-4 text-[#b87a29]" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between gap-2">
              <span className="text-2xl sm:text-3xl font-black text-[#301809] tracking-tight">{myEvents.length}</span>
              <span className="text-[10px] sm:text-xs font-bold text-[#723c11] bg-[#fae1b7]/60 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                <Sparkles className="w-3 h-3 text-[#b87a29]" /> تذكرة
              </span>
            </div>
            <div className="mt-2 h-1 w-full bg-[#fae1b7]/30 rounded-full overflow-hidden">
              <div className="h-full bg-[#b87a29] rounded-full" style={{ width: '100%' }} />
            </div>
          </div>

          {/* Card 2: Points (Gaming Purple/Gold accent) */}
          <div className="relative overflow-hidden bg-white rounded-2xl p-3.5 sm:p-4 border border-[#dbc397]/70 shadow-xs hover:shadow-md hover:border-purple-600 transition-all group">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[11px] sm:text-xs font-bold text-purple-900 block truncate">رصيد النقاط</span>
                <span className="text-[10px] text-purple-700/70 block truncate">التفاعل والمشاركة</span>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0 group-hover:scale-105 transition-transform">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between gap-2">
              <span className="text-2xl sm:text-3xl font-black text-purple-950 tracking-tight">{userProfile?.points || 0}</span>
              <span className="text-[10px] sm:text-xs font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                ⭐ نقطة
              </span>
            </div>
            <div className="mt-2 h-1 w-full bg-purple-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full" style={{ width: `${(userProfile?.points || 0) % 100}%` }} />
            </div>
          </div>

          {/* Card 3: Level (Gaming Trophy) */}
          <div className="relative overflow-hidden bg-white rounded-2xl p-3.5 sm:p-4 border border-[#dbc397]/70 shadow-xs hover:shadow-md hover:border-amber-500 transition-all group">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[11px] sm:text-xs font-bold text-[#723c11] block truncate">مستوى المكتشف</span>
                <span className="text-[10px] text-[#723c11]/70 block truncate">{userProfile?.badge || 'عضو نشط'}</span>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0 group-hover:scale-105 transition-transform">
                <Trophy className="w-4 h-4 text-amber-500" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between gap-2">
              <span className="text-xl sm:text-2xl font-black text-[#301809] tracking-tight whitespace-nowrap">
                مستوى {Math.floor((userProfile?.points || 0) / 100) + 1}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-[#b87a29] bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                رتبة
              </span>
            </div>
            <div className="mt-2 h-1 w-full bg-amber-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full" style={{ width: '100%' }} />
            </div>
          </div>

          {/* Card 4: Available Events in Ouargla */}
          <div className="relative overflow-hidden bg-white rounded-2xl p-3.5 sm:p-4 border border-[#dbc397]/70 shadow-xs hover:shadow-md hover:border-[#b87a29] transition-all group">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[11px] sm:text-xs font-bold text-[#723c11] block truncate">الفعاليات المتاحة</span>
                <span className="text-[10px] text-[#723c11]/70 block truncate">قصور وبلديات ورقلة</span>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#301809] to-[#723c11] border border-[#dbc397] flex items-center justify-center text-[#efa83f] shrink-0 group-hover:scale-105 transition-transform">
                <Compass className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between gap-2">
              <span className="text-2xl sm:text-3xl font-black text-[#301809] tracking-tight">{publicEvents.length}</span>
              <span className="text-[10px] sm:text-xs font-bold text-[#efa83f] bg-[#301809] px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                فعالية
              </span>
            </div>
            <div className="mt-2 h-1 w-full bg-[#fae1b7]/30 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#b87a29] to-[#efa83f] rounded-full" style={{ width: '100%' }} />
            </div>
          </div>
        </div>

        {/* Search Bar Toolbar */}
        <div className="bg-white border-2 border-[#dbc397]/60 rounded-3xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#b87a29]" />
            <Input 
              placeholder="ابحث عن فعالية باسمها أو موقعها..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 h-11 bg-[#fdfbf7] border-2 border-[#dbc397] rounded-xl font-medium focus-visible:border-[#b87a29]"
              dir="rtl"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#723c11] hover:text-red-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-[#723c11] w-full md:w-auto justify-end">
            <span>تصفية الفعاليات:</span>
            <span className="bg-[#fae1b7]/60 border border-[#dbc397] px-3 py-1 rounded-xl text-[#301809]">
              {publicEvents.length} فعالية نشطة
            </span>
          </div>
        </div>

        {/* Tabs System */}
        <Tabs defaultValue="discover" dir="rtl" className="w-full space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <TabsList className="bg-white/80 backdrop-blur-md p-1.5 rounded-3xl border-2 border-[#dbc397]/60 shadow-sm h-auto min-h-14 w-full max-w-2xl grid grid-cols-4 gap-1.5">
              <TabsTrigger 
                value="discover" 
                className="text-xs md:text-sm font-bold rounded-2xl data-[state=active]:bg-[#301809] data-[state=active]:text-[#fae1b7] data-[state=active]:shadow-md py-3 transition-all cursor-pointer"
              >
                <Compass className="w-4 h-4 ml-1.5" />
                اكتشف
              </TabsTrigger>
              <TabsTrigger 
                value="calendar" 
                className="text-xs md:text-sm font-bold rounded-2xl data-[state=active]:bg-[#301809] data-[state=active]:text-[#fae1b7] data-[state=active]:shadow-md py-3 transition-all cursor-pointer"
              >
                <CalendarHeart className="w-4 h-4 ml-1.5" />
                فعالياتي ({myEvents.length})
              </TabsTrigger>
              <TabsTrigger 
                value="prefs" 
                className="text-xs md:text-sm font-bold rounded-2xl data-[state=active]:bg-[#301809] data-[state=active]:text-[#fae1b7] data-[state=active]:shadow-md py-3 transition-all cursor-pointer"
              >
                <Settings className="w-4 h-4 ml-1.5" />
                اهتماماتي
              </TabsTrigger>
              <TabsTrigger 
                value="profile" 
                className="text-xs md:text-sm font-bold rounded-2xl data-[state=active]:bg-purple-900 data-[state=active]:text-yellow-300 data-[state=active]:shadow-md py-3 transition-all cursor-pointer"
              >
                <Trophy className="w-4 h-4 ml-1.5 text-yellow-400" />
                إنجازاتي
              </TabsTrigger>
            </TabsList>
          </div>
          
          <AnimatePresence mode="wait">
            {/* Discover Tab */}
            <TabsContent value="discover" key="discover" className="mt-0 outline-none space-y-8">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <PartnerAdsBanner />
                <div className="mt-8">
                  <div className="flex justify-between items-center mb-6 pb-2 border-b-2 border-[#dbc397]/40">
                    <h2 className="text-xl md:text-2xl font-thmanyah font-bold text-[#301809] flex items-center gap-3">
                      <span>✨ فعاليات بانتظارك في ورقلة</span>
                    </h2>
                    {userProfile?.interests?.length > 0 && (
                      <div className="flex items-center gap-2.5 bg-white px-4 py-2 rounded-2xl border-2 border-[#dbc397] shadow-xs">
                        <span className="text-xs font-bold text-[#723c11]">تصفية بحسب اهتماماتي</span>
                        <button 
                          onClick={() => setShowAll(!showAll)}
                          className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${showAll ? 'bg-slate-200' : 'bg-[#b87a29]'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showAll ? 'left-1' : 'right-1'}`} />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <EventCardList 
                    events={publicEvents.filter(e => {
                      if (showAll || !userProfile?.interests?.length) return true;
                      return userProfile.interests.includes(e.category);
                    })} 
                    emptyMsg={showAll ? "لا توجد فعاليات عامة قادمة حالياً." : "لا توجد فعاليات تطابق اهتماماتك حالياً. جرب إيقاف التصفية أو تعديل اهتماماتك."} 
                  />
                </div>
              </motion.div>
            </TabsContent>
            
            {/* My Events Tab */}
            <TabsContent value="calendar" key="calendar" className="mt-0 outline-none">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="mb-6 pb-2 border-b-2 border-[#dbc397]/40">
                  <h2 className="text-xl md:text-2xl font-thmanyah font-bold text-[#301809] flex items-center gap-2">
                    <span>🎟️ تذاكري والفعاليات المحجوزة ({myEvents.length})</span>
                  </h2>
                  <p className="text-xs text-[#723c11]/80 mt-1">
                    يمكنك استعراض تذكرتك في أي وقت أو إبراز رمز QR عند الدخول.
                  </p>
                </div>
                <EventCardList events={myEvents} emptyMsg="لم تقم بالتسجيل في أي فعالية بعد. استكشف فعاليات ورقلة واحجز تذكرتك مجاناً!" showTicketButton={true} />
              </motion.div>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="prefs" key="prefs" className="mt-0 outline-none">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Card className="border-2 border-[#dbc397] shadow-xl rounded-3xl overflow-hidden bg-white">
                  <CardContent className="p-8 md:p-12">
                    <div className="text-center mb-10">
                      <div className="bg-[#fae1b7]/60 w-20 h-20 rounded-3xl border-2 border-[#dbc397] flex items-center justify-center mx-auto mb-5 text-3xl shadow-sm">
                        ⭐
                      </div>
                      <h2 className="text-2xl md:text-3xl font-thmanyah font-bold text-[#301809] mb-2">ما الذي تود استكشافه؟</h2>
                      <p className="text-xs md:text-sm text-[#723c11] max-w-md mx-auto font-medium">
                        اختر الفئات المفضلة لديك لنقوم باقتراح الفعاليات التي تهمك في ورقلة تلقائياً.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 max-w-4xl mx-auto">
                      {CATEGORIES.map((cat) => {
                        const isSelected = userProfile?.interests?.includes(cat.id);
                        return (
                          <button
                            key={cat.id}
                            onClick={() => toggleInterest(cat.id)}
                            className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all duration-300 relative cursor-pointer ${
                              isSelected 
                              ? 'bg-[#fae1b7]/50 border-[#b87a29] shadow-md scale-105' 
                              : 'bg-[#fdfbf7] border-[#dbc397]/60 hover:border-[#b87a29] hover:bg-[#fae1b7]/20'
                            }`}
                          >
                            <span className="text-4xl">{cat.icon}</span>
                            <span className={`font-bold text-base ${isSelected ? 'text-[#301809]' : 'text-[#723c11]'}`}>
                              {cat.label}
                            </span>
                            {isSelected && (
                              <div className="absolute -top-2 -right-2 bg-[#b87a29] text-white p-1 rounded-full shadow-md">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    
                    <div className="mt-10 text-center text-xs text-[#723c11]/80 font-bold">
                      {savingPrefs ? 'جاري حفظ التفضيلات...' : '✨ تُحفظ التغييرات تلقائياً في حسابك'}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Achievements & Gamification Tab (Preserving beloved Purple/Gold aesthetic) */}
            <TabsContent value="profile" key="profile" className="mt-0 outline-none">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Points Card (Vibrant Deep Purple & Gold) */}
                  <Card className="col-span-1 md:col-span-2 border-0 shadow-2xl rounded-3xl bg-gradient-to-br from-purple-900 via-indigo-950 to-purple-950 text-white overflow-hidden relative">
                     <div className="absolute inset-0 opacity-20 pointer-events-none">
                        <div className="absolute top-0 right-0 w-72 h-72 bg-yellow-400 rounded-full blur-3xl -mr-32 -mt-32" />
                        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500 rounded-full blur-3xl -ml-32 -mb-32" />
                     </div>
                     <CardContent className="p-8 md:p-10 relative z-10 flex flex-col justify-between h-full">
                        <div>
                          <div className="flex items-center gap-4 mb-8">
                             <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg">
                                <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                             </div>
                             <div>
                                <p className="text-purple-200 text-xs font-bold">رصيد النقاط التراكمي</p>
                                <h3 className="text-3xl md:text-4xl font-black text-white">{userProfile?.points || 0} نقطة</h3>
                             </div>
                          </div>

                          <div className="space-y-4">
                             <div className="flex justify-between font-bold text-sm">
                                <span className="text-purple-200">مستوى المكتشف</span>
                                <span className="text-yellow-400 font-black">المستوى {Math.floor((userProfile?.points || 0) / 100) + 1}</span>
                             </div>
                             <div className="h-4 bg-white/10 rounded-full overflow-hidden border border-white/10 p-0.5">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(userProfile?.points || 0) % 100}%` }}
                                  className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.6)]"
                                />
                             </div>
                             <p className="text-purple-300 text-xs font-semibold">باقي {100 - ((userProfile?.points || 0) % 100)} نقطة للترقية للمستوى القادم 🚀</p>
                          </div>
                        </div>

                        <div className="mt-10 grid grid-cols-2 gap-4">
                           <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                              <p className="text-xs text-purple-200 mb-1 font-semibold">الفعاليات المسجلة</p>
                              <p className="text-2xl font-black text-yellow-300">{myEvents.length}</p>
                           </div>
                           <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                              <p className="text-xs text-purple-200 mb-1 font-semibold">الشارة الشرفية</p>
                              <p className="text-lg font-black text-white truncate">{userProfile?.badge || 'عضو نشط'}</p>
                           </div>
                        </div>
                     </CardContent>
                  </Card>

                  {/* Badges Card */}
                  <Card className="border-2 border-[#dbc397] shadow-xl rounded-3xl bg-white p-6 md:p-8 flex flex-col justify-between">
                     <div>
                       <h2 className="text-xl font-thmanyah font-bold text-[#301809] mb-6 flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-amber-500" />
                          <span>أوسمـتي الشرفية</span>
                       </h2>

                       <div className="space-y-4">
                          {/* Active Attendee Badge */}
                          <div className={`p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${userProfile?.badge === 'Active Attendee' || (userProfile?.points || 0) >= 50 ? 'bg-amber-50 border-amber-300 shadow-xs' : 'bg-slate-50 border-slate-200 grayscale opacity-60'}`}>
                             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md ${userProfile?.badge === 'Active Attendee' || (userProfile?.points || 0) >= 50 ? 'bg-amber-500' : 'bg-slate-400'}`}>
                                <CalendarHeart className="w-6 h-6" />
                             </div>
                             <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                  <p className="font-black text-xs text-[#301809]">حاضر نشط</p>
                                  <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded-full border border-amber-200">
                                    {Math.min(userProfile?.points || 0, 50)}/50
                                  </span>
                                </div>
                                <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(((userProfile?.points || 0) / 50) * 100, 100)}%` }}
                                    className="h-full bg-amber-500 rounded-full"
                                  />
                                </div>
                                {userProfile?.badge === 'Active Attendee' && (
                                  <p className="text-[10px] text-amber-700 font-bold mt-1">✨ تم فتح هذا الوسام!</p>
                                )}
                             </div>
                          </div>

                          {/* Explorer Badge */}
                          <div className={`p-4 rounded-2xl border-2 flex items-center gap-4 transition-all opacity-60 grayscale bg-slate-50 border-slate-200`}>
                             <div className="w-12 h-12 rounded-2xl bg-[#efa83f] flex items-center justify-center text-white shadow-md">
                                <Compass className="w-6 h-6" />
                             </div>
                             <div>
                                <p className="font-black text-xs text-[#301809]">مكتشف التراث</p>
                                <p className="text-[10px] text-slate-500 font-semibold">يُفتح بحضور 3 فعاليات تراثية</p>
                             </div>
                          </div>
                       </div>
                     </div>

                     <div className="mt-6 pt-4 border-t border-[#dbc397]/40 text-center">
                       <p className="text-[11px] text-[#723c11] font-semibold">
                         💡 احضر الفعاليات وأكّد حضورك برمز QR لزيادة نقاطك وفتح أوسمة جديدة
                       </p>
                     </div>
                  </Card>
                </div>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="font-sans border-2 border-[#dbc397] rounded-3xl bg-white max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-thmanyah font-bold text-[#301809]">تغيير كلمة المرور</DialogTitle>
            <DialogDescription className="text-xs text-[#723c11] font-medium mt-1">
              أدخل كلمة المرور الجديدة لحسابك الشخصي.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdatePassword} className="space-y-4 pt-4 text-right">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#301809]">كلمة المرور الجديدة</Label>
              <Input
                type="password"
                required
                placeholder="6 أحرف على الأقل..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-11 border-2 border-[#dbc397] rounded-xl focus-visible:border-[#b87a29]"
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
                className="h-11 border-2 border-[#dbc397] rounded-xl focus-visible:border-[#b87a29]"
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
                className="flex-1 rounded-xl h-11 bg-gradient-to-r from-[#b87a29] to-[#efa83f] text-white font-bold cursor-pointer"
              >
                {isUpdatingPassword ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'حفظ التغيير'}
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
          userName={currentUser.email?.split('@')[0]}
          onClose={() => setActiveTicketEvent(null)}
        />
      )}
    </div>
  );
}
