import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { CalendarIcon, MapPin, Compass, CalendarHeart, History, ArrowLeft, Search, X, Settings, Trophy, Star, Check } from 'lucide-react';
import { Input } from '../../components/ui/input';
import PartnerAdsBanner from '../../components/PartnerAdsBanner';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

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
  
  // New States for Personalization & Gamification
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showAll, setShowAll] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Use a ref to always have the latest myEvents for the real-time listener
  const myEventsRef = useRef(myEvents);
  useEffect(() => {
    myEventsRef.current = myEvents;
  }, [myEvents]);

  useEffect(() => {
    fetchEvents();

    // Phase 6: Real-time Notifications for attendees
    const channel = supabase
      .channel('attendee-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'events' },
        (payload) => {
          // Check if this event is in the user's RSVP list (using ref to avoid loop)
          const relevantEvent = myEventsRef.current.find(e => e.id === payload.new.id);
          if (relevantEvent) {
             const oldData = relevantEvent;
             const newData = payload.new as any;
             
             // Build a list of what changed (only real changes)
             const changes: string[] = [];
             
             // Helper to clean values and avoid undefined/null issues
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
             
             // Only notify if there are real changes
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
        .gte('date', new Date().toISOString().split('T')[0]) // Only future/today
        .order('date', { ascending: true });
        
      setPublicEvents(publicData || []);

      // Fetch my RSVPs
      const { data: rsvpData } = await supabase
        .from('rsvps')
        .select('event_id, events(*, associations(name))')
        .eq('user_id', user.id)
        .eq('status', 'attending');

      const myEventsExtracted = rsvpData?.map((r: any) => r.events).filter(e => e) || [];
      // sort by date
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

  const EventCardList = ({ events, emptyMsg }: { events: any[], emptyMsg: string }) => {
    const filteredEvents = events.filter(e => 
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className="text-center py-12 text-gray-500">جاري التحميل...</div>;
    if (filteredEvents.length === 0) return (
      <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-dashed border-gray-300">
        <h3 className="text-xl font-medium text-gray-500">
          {searchQuery ? `لا توجد نتائج تطابق "${searchQuery}"` : emptyMsg}
        </h3>
      </div>
    );

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => (
          <Card key={event.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 shadow-md group cursor-pointer" onClick={() => navigate(`/event/${event.id}`)}>
            <div className="h-48 overflow-hidden relative bg-emerald-50 flex items-center justify-center">
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
              <div className={`${event.cover_image_url ? 'hidden' : ''} event-card-fallback absolute inset-0 bg-gradient-to-tr from-emerald-500 to-amber-400 opacity-90 flex items-center justify-center text-white flex-col gap-2`}>
                <span className="font-bold text-xl drop-shadow-md">Sahara Connect</span>
                <CalendarIcon size={24} className="opacity-50" />
              </div>
            </div>
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-xl line-clamp-1">{event.title}</h3>
              </div>
              <p className="text-sm text-gray-400 mb-4">{event.associations?.name}</p>
              
              <div className="space-y-2 mt-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-2 text-emerald-600" />
                  <span className="font-medium">{event.date} • {event.start_time.substring(0,5)}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-amber-600" />
                  <span className="truncate">{event.location}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">مرحباً بك في تواصل صحراء</h1>
          <p className="text-gray-500 mt-1">اكتشف الفعاليات القادمة في منطقتك</p>
        </div>
        
        <div className="relative w-full md:w-96 group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-emerald-600" />
          <Input 
            placeholder="ابحث عن فعالية باسمها أو موقعها..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 h-11 bg-gray-50 border-gray-200 rounded-xl"
            dir="rtl"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <Button variant="outline" onClick={() => supabase.auth.signOut()} className="rounded-xl border-gray-200">
          تسجيل الخروج
        </Button>
      </div>

      <Tabs defaultValue="discover" dir="rtl" className="w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <TabsList className="grid w-full grid-cols-4 max-w-[600px] bg-white border shadow-sm p-1 rounded-xl h-14">
            <TabsTrigger value="discover" className="rounded-lg text-sm md:text-base h-full data-[state=active]:bg-amber-100 data-[state=active]:text-amber-800 transition-all font-bold">
              <Compass className="w-4 h-4 ml-1 md:ml-2" />
              اكتشف
            </TabsTrigger>
            <TabsTrigger value="calendar" className="rounded-lg text-sm md:text-base h-full data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800 transition-all font-bold">
              <CalendarHeart className="w-4 h-4 ml-1 md:ml-2" />
              فعالياتي
            </TabsTrigger>
            <TabsTrigger value="prefs" className="rounded-lg text-sm md:text-base h-full data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800 transition-all font-bold">
              <Settings className="w-4 h-4 ml-1 md:ml-2" />
              اهتماماتي
            </TabsTrigger>
            <TabsTrigger value="profile" className="rounded-lg text-sm md:text-base h-full data-[state=active]:bg-purple-100 data-[state=active]:text-purple-800 transition-all font-bold">
              <Trophy className="w-4 h-4 ml-1 md:ml-2" />
              إنجازاتي
            </TabsTrigger>
          </TabsList>

          <Button 
            onClick={() => navigate('/heritage')}
            className="w-full md:w-auto bg-amber-900 border-amber-800 hover:bg-amber-950 text-amber-50 rounded-xl px-6 h-14 flex items-center justify-center gap-3 shadow-lg shadow-amber-900/20 group"
          >
            <History className="w-5 h-5 text-amber-400 group-hover:rotate-12 transition-transform" />
            <div className="text-right">
              <div className="text-xs opacity-70">استكشف كنوزنا</div>
              <div className="font-bold">الأرشيف التراثي</div>
            </div>
            <ArrowLeft className="w-4 h-4 mr-2" />
          </Button>
        </div>
        
        <AnimatePresence mode="wait">
          <TabsContent value="discover" key="discover" className="mt-0 outline-none space-y-8">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <PartnerAdsBanner />
              <div className="mt-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                    <div className="w-2 h-8 bg-amber-500 rounded-full" />
                    فعاليات بانتظارك
                  </h2>
                  {userProfile?.interests?.length > 0 && (
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border shadow-sm">
                      <span className="text-sm font-bold text-slate-600">تصفية ذكية</span>
                      <button 
                        onClick={() => setShowAll(!showAll)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${showAll ? 'bg-slate-200' : 'bg-emerald-500'}`}
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
                  emptyMsg={showAll ? "لا توجد فعاليات عامة قادمة حالياً." : "لا توجد فعاليات تطابق اهتماماتك حالياً. جرب تفعيل 'عرض الكل' أو تعديل اهتماماتك."} 
                />
              </div>
            </motion.div>
          </TabsContent>
          
          <TabsContent value="calendar" key="calendar" className="mt-0 outline-none">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <EventCardList events={myEvents} emptyMsg="لم تقم بالتسجيل في أي فعالية بعد." />
            </motion.div>
          </TabsContent>

          <TabsContent value="prefs" key="prefs" className="mt-0 outline-none">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="border-0 shadow-xl rounded-[2.5rem] overflow-hidden">
                <CardContent className="p-8 md:p-12">
                  <div className="text-center mb-10">
                    <div className="bg-blue-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <Star className="w-10 h-10 text-blue-600" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-4">ما الذي تود اكتشافه؟</h2>
                    <p className="text-slate-500 text-lg max-w-md mx-auto">اختر الفئات التي تهمك وسنقوم بتخصيص لوحة التحكم الخاصة بك تلقائياً.</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                    {CATEGORIES.map((cat) => {
                      const isSelected = userProfile?.interests?.includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          onClick={() => toggleInterest(cat.id)}
                          className={`flex flex-col items-center gap-4 p-8 rounded-[2rem] border-2 transition-all duration-300 relative group ${
                            isSelected 
                            ? 'bg-blue-50 border-blue-500 shadow-blue-200/50 shadow-lg scale-105' 
                            : 'bg-white border-slate-100 hover:border-blue-200 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-4xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                          <span className={`font-black text-xl ${isSelected ? 'text-blue-900' : 'text-slate-600'}`}>{cat.label}</span>
                          {isSelected && (
                            <div className="absolute -top-2 -right-2 bg-blue-500 text-white p-1.5 rounded-full shadow-lg">
                              <Check className="w-4 h-4" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="mt-12 text-center text-slate-400 font-medium">
                    {savingPrefs ? 'جاري الحفظ...' : 'تُحفظ التغييرات تلقائياً'}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="profile" key="profile" className="mt-0 outline-none">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Points Card */}
                <Card className="col-span-1 md:col-span-2 border-0 shadow-xl rounded-[2.5rem] bg-gradient-to-br from-purple-900 to-indigo-950 text-white overflow-hidden relative">
                   <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -mr-32 -mt-32" />
                      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full blur-3xl -ml-32 -mb-32" />
                   </div>
                   <CardContent className="p-10 relative z-10 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex items-center gap-4 mb-8">
                           <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                              <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                           </div>
                           <div>
                              <p className="text-purple-200 font-bold">رصيد النقاط</p>
                              <h3 className="text-4xl font-black">{userProfile?.points || 0} نقطة</h3>
                           </div>
                        </div>

                        <div className="space-y-4">
                           <div className="flex justify-between font-bold">
                              <span>مستوى المكتشف</span>
                              <span>{Math.floor((userProfile?.points || 0) / 100) + 1}</span>
                           </div>
                           <div className="h-4 bg-white/10 rounded-full overflow-hidden border border-white/10 p-0.5">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(userProfile?.points || 0) % 100}%` }}
                                className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.5)]"
                              />
                           </div>
                           <p className="text-purple-300 text-sm font-medium">باقي {100 - ((userProfile?.points || 0) % 100)} نقطة للمستوى القادم</p>
                        </div>
                      </div>

                      <div className="mt-12 grid grid-cols-2 gap-4">
                         <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <p className="text-xs text-purple-300 mb-1">الفعاليات المحضورة</p>
                            <p className="text-2xl font-black">{myEvents.length}</p>
                         </div>
                         <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <p className="text-xs text-purple-300 mb-1">المرتبة المحلية</p>
                            <p className="text-2xl font-black">#--</p>
                         </div>
                      </div>
                   </CardContent>
                </Card>

                {/* Badges Card */}
                <Card className="border-0 shadow-xl rounded-[2.5rem] bg-white p-8">
                   <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
                      <Trophy className="w-6 h-6 text-amber-500" />
                      أوسمـتي
                   </h2>

                   <div className="space-y-6">
                      {/* Active Attendee Badge */}
                      <div className={`p-4 rounded-3xl border-2 flex items-center gap-4 transition-all ${userProfile?.badge === 'Active Attendee' || (userProfile?.points || 0) >= 50 ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-slate-50 border-transparent grayscale opacity-50'}`}>
                         <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg ${userProfile?.badge === 'Active Attendee' || (userProfile?.points || 0) >= 50 ? 'bg-amber-400' : 'bg-slate-400'}`}>
                            <CalendarHeart className="w-7 h-7" />
                         </div>
                         <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <p className="font-black text-slate-800">حاضر نشط</p>
                              <span className="text-[10px] font-bold bg-white/50 px-2 py-0.5 rounded-full border border-black/5">
                                {Math.min(userProfile?.points || 0, 50)}/50
                              </span>
                            </div>
                            <div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(((userProfile?.points || 0) / 50) * 100, 100)}%` }}
                                className="h-full bg-amber-500 rounded-full"
                              />
                            </div>
                            {userProfile?.badge === 'Active Attendee' && (
                              <p className="text-[10px] text-amber-600 font-bold mt-1">✨ تم فتح الوسام!</p>
                            )}
                         </div>
                      </div>

                      {/* Explorer Badge (Placeholder logic) */}
                      <div className={`p-4 rounded-3xl border-2 flex items-center gap-4 transition-all opacity-50 grayscale`}>
                         <div className="w-14 h-14 rounded-full bg-emerald-400 flex items-center justify-center text-white shadow-lg">
                            <Compass className="w-7 h-7" />
                         </div>
                         <div>
                            <p className="font-black text-slate-800">مكتشف التراث</p>
                            <p className="text-xs text-slate-500">قريباً</p>
                         </div>
                      </div>
                   </div>
                </Card>
              </div>
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
