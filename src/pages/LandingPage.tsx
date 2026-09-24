import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useNotifications } from '../hooks/useNotifications';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Bell, 
  BellOff, 
  LogIn, 
  User, 
  Building2, 
  Search, 
  BookOpen, 
  TrendingUp, 
  Sparkles, 
  Mail, 
  Lock, 
  ChevronLeft,
  Loader2,
  Ticket,
  ArrowUpRight,
  CheckCircle2
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isSubscribed, subscribe, unsubscribe, loading: notifLoading } = useNotifications();
  
  // App States
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState({ users: 0, associations: 0, events: 0, rsvps: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Login Modal State
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginTab, setLoginTab] = useState<'attendee' | 'admin'>('attendee');
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  // Partner Ads State
  const [ads, setAds] = useState<any[]>([]);

  useEffect(() => {
    fetchPublicData();
  }, []);

  const fetchPublicData = async () => {
    try {
      setLoadingEvents(true);
      const { data: eventsData } = await supabase
        .from('events')
        .select('*, associations(name)')
        .eq('is_public', true)
        .eq('status', 'active')
        .order('date', { ascending: true });
      
      setEvents(eventsData || []);

      const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
      const { count: assocCount } = await supabase.from('associations').select('*', { count: 'exact', head: true });
      const { count: eventsCount } = await supabase.from('events').select('*', { count: 'exact', head: true });
      const { count: rsvpsCount } = await supabase.from('rsvps').select('*', { count: 'exact', head: true });

      setStats({
        users: usersCount || 148,
        associations: assocCount || 12,
        events: eventsCount || 28,
        rsvps: rsvpsCount || 420
      });

      const { data: adsData } = await supabase
        .from('partner_ads')
        .select('*')
        .eq('is_active', true)
        .limit(3);
      setAds(adsData || []);

    } catch (err) {
      console.error('Error fetching landing page data:', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const categories = [
    { value: 'All', label: 'جميع الفعاليات' },
    { value: 'Heritage', label: 'تراث وأصالة' },
    { value: 'Cultural', label: 'ثقافي وفكري' },
    { value: 'Educational', label: 'تعليمي وتدريبي' },
    { value: 'Sports', label: 'رياضي وشبابي' },
    { value: 'Religious', label: 'ديني ومناسباتي' }
  ];

  const filteredEvents = events.filter(ev => {
    const matchesSearch = ev.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (ev.description && ev.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          ev.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || ev.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (loginTab === 'admin') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) throw error;
        
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single();
        
        toast.success('مرحباً بك! تم تسجيل الدخول بنجاح.');
        setIsLoginOpen(false);
        if (profile?.role === 'super_admin') navigate('/admin');
        else if (profile?.role === 'association') navigate('/association');
        else navigate('/attendee');
      } else {
        if (isSignUp) {
          const { data, error } = await supabase.auth.signUp({
            email: email.trim().toLowerCase(),
            password,
            options: { data: { full_name: fullName } }
          });
          if (error) throw error;
          
          if (!data.session) {
            toast.success('تم إنشاء الحساب! يرجى مراجعة بريدك الإلكتروني لتأكيد التسجيل.');
          } else {
            toast.success('أهلاً بك في منصة تواصل صحراء!');
            navigate('/attendee');
          }
          setIsLoginOpen(false);
        } else {
          const { error } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
          });
          if (error) throw error;
          
          toast.success('تم تسجيل الدخول بنجاح!');
          setIsLoginOpen(false);
          navigate('/attendee');
        }
      }
    } catch (error: any) {
      let msg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
      if (error.message === 'User already registered') {
        msg = 'هذا البريد الإلكتروني مسجل مسبقاً، يرجى تسجيل الدخول بدلاً من ذلك.';
      }
      toast.error(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      toast.success('تم الدخول التجريبي كزائر بنجاح!');
      setIsLoginOpen(false);
      navigate('/attendee');
    } catch (err: any) {
      toast.error('خطأ في الدخول التجريبي: ' + err.message);
    } finally {
      setDemoLoading(false);
    }
  };

  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'Heritage': return 'bg-[#fae1b7] text-[#723c11] border-[#d4b174]';
      case 'Sports': return 'bg-[#efa83f]/20 text-[#301809] border-[#efa83f]/60';
      case 'Educational': return 'bg-[#dbc397]/50 text-[#301809] border-[#d4b174]';
      case 'Religious': return 'bg-[#84939c]/20 text-[#301809] border-[#84939c]/50';
      case 'Cultural': return 'bg-[#b87a29]/20 text-[#723c11] border-[#b87a29]/40';
      default: return 'bg-[#f4eee4] text-[#723c11] border-[#d2cfca]';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'Heritage': return 'تراث وأصالة';
      case 'Sports': return 'رياضي';
      case 'Educational': return 'تعليمي';
      case 'Religious': return 'ديني';
      case 'Cultural': return 'ثقافي';
      default: return 'عام';
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] relative overflow-x-hidden text-[#301809] selection:bg-[#efa83f] selection:text-[#301809] font-sans" dir="rtl">
      
      {/* Warm Ambient Atmosphere */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#efa83f]/10 rounded-full filter blur-[140px] animate-blob" />
        <div className="absolute top-[30%] left-[-15%] w-[550px] h-[550px] bg-[#d4b174]/15 rounded-full filter blur-[150px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] right-[20%] w-[650px] h-[650px] bg-[#723c11]/8 rounded-full filter blur-[160px] animate-blob animation-delay-4000" />
      </div>

      {/* Floating Header */}
      <header className="sticky top-4 z-50 mx-4 md:mx-auto max-w-7xl glass-panel rounded-2xl transition-all duration-300 shadow-sm border border-[#dbc397]/50">
        <div className="container mx-auto px-6 h-18 flex items-center justify-between">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3 cursor-pointer py-1" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#301809] to-[#b87a29] flex items-center justify-center text-white font-bold text-lg shadow-sm">
              ص
            </div>
            <div className="flex flex-col text-right">
              <span className="text-xl font-bold text-[#301809] leading-tight">
                تواصل صحراء
              </span>
              <span className="text-[11px] text-[#723c11]/70 font-medium">
                بوابة وارجلان (ورقلة) وحوض سدراتة
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-[#301809]/80">
            <a href="#hero" className="hover:text-[#b87a29] transition-colors">الرئيسية</a>
            <a href="#events" className="hover:text-[#b87a29] transition-colors">الفعاليات والأخبار</a>
            <a href="#heritage-spotlight" className="hover:text-[#b87a29] transition-colors">أصالة سدراتة</a>
            <a href="#stats" className="hover:text-[#b87a29] transition-colors">المجتمع بالأرقام</a>
            <button 
              onClick={() => navigate('/heritage')} 
              className="hover:text-[#b87a29] transition-colors flex items-center gap-1.5 text-[#723c11]"
            >
              <BookOpen className="w-4 h-4 text-[#b87a29]" />
              الأرشيف التراثي
            </button>
            <button
              onClick={() => navigate('/map')}
              className="hover:text-[#b87a29] transition-colors flex items-center gap-1.5 text-[#723c11]"
            >
              <MapPin className="w-4 h-4 text-[#b87a29]" />
              خريطة التراث
            </button>
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Notifications Toggle */}
            <Button 
              variant="ghost" 
              onClick={isSubscribed ? unsubscribe : subscribe}
              disabled={notifLoading}
              className={`h-11 w-11 p-0 rounded-xl border transition-all flex items-center justify-center ${
                isSubscribed 
                  ? 'border-[#efa83f] text-[#723c11] bg-[#fae1b7]/70 hover:bg-[#fae1b7]' 
                  : 'border-[#dbc397] text-[#723c11] bg-white/80 hover:bg-[#fae1b7]/40'
              }`}
              title={isSubscribed ? 'تعطيل الإشعارات' : 'تفعيل إشعارات الفعاليات'}
            >
              {notifLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#b87a29]" />
              ) : isSubscribed ? (
                <Bell className="w-4 h-4 text-[#efa83f] fill-[#efa83f]" />
              ) : (
                <BellOff className="w-4 h-4 text-[#723c11]/60" />
              )}
            </Button>

            {/* Login / Auth Button */}
            <Button 
              onClick={() => {
                setIsSignUp(false);
                setIsLoginOpen(true);
              }}
              className="h-11 px-5 rounded-xl bg-[#301809] hover:bg-[#723c11] text-white text-sm font-semibold flex items-center gap-2 shadow-sm transition-all"
            >
              <LogIn className="w-4 h-4 text-[#efa83f]" />
              <span>تسجيل الدخول</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative pt-12 pb-16 md:py-24 z-10">
        <div className="container mx-auto px-6 grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Hero Copy (Text Column) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="lg:col-span-7 space-y-6 text-right"
          >
            {/* Heritage Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#fae1b7]/70 border border-[#d4b174]/60 text-xs font-semibold text-[#723c11]">
              <span className="w-2 h-2 rounded-full bg-[#efa83f] animate-ping" />
              <Sparkles className="w-3.5 h-3.5 text-[#b87a29]" />
              <span>بوابة مجتمع وارجلان (ورقلة) وحوض سدراتة الرقمية الموحدة</span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-thmanyah font-bold text-[#301809] leading-[1.25] tracking-normal">
              تواصل، تفاعل وارتقِ مع <br />
              <span className="text-[#b87a29]">مجتمعك وأصالتك التراثية</span>
            </h1>
            
            {/* Subtitle Description */}
            <p className="text-base sm:text-lg text-[#554030] leading-relaxed max-w-xl font-normal">
              منصة رقمية رائدة تجمع أهالي وجمعيات وارجلان (ورقلة) وحوض سدراتة التاريخي. شارك في الفعاليات الحية، احصل على تذكرتك الذكية بلمسة واحدة، وساهم في إحياء الذاكرة التراثية لوحاتنا الخالدة.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <a href="#events">
                <Button className="h-13 py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#b87a29] to-[#efa83f] hover:from-[#c98730] hover:to-[#f0b24d] text-white font-bold text-base shadow-glow-amber transition-all flex items-center gap-2">
                  <span>استكشف الفعاليات الجارية</span>
                  <ChevronLeft className="w-4 h-4 text-white" />
                </Button>
              </a>

              <Button 
                variant="outline" 
                onClick={() => navigate('/heritage')} 
                className="h-13 py-3.5 px-6 rounded-xl bg-white hover:bg-[#fae1b7]/30 text-[#723c11] border border-[#d4b174] font-bold text-base shadow-sm transition-all flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-[#b87a29]" />
                <span>تصفح السجل التراثي</span>
              </Button>
            </div>

            {/* Clean Notification Banner Card */}
            <div className="bg-white/90 backdrop-blur border border-[#dbc397]/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#fae1b7] flex items-center justify-center text-[#723c11] shrink-0">
                  <Bell className="w-5 h-5 text-[#b87a29]" />
                </div>
                <div className="text-right">
                  <h4 className="font-bold text-sm text-[#301809]">تنبيهات الفعاليات الفورية على هاتفك</h4>
                  <p className="text-xs text-[#723c11]/70 mt-0.5">كن أول من يعلم بمواعيد المهرجانات والنشاطات المجتمعية.</p>
                </div>
              </div>
              <Button 
                onClick={subscribe}
                disabled={isSubscribed}
                className={`text-xs font-semibold h-10 px-4 rounded-xl shrink-0 transition-all ${
                  isSubscribed 
                    ? 'bg-[#fae1b7] text-[#723c11] border border-[#d4b174]' 
                    : 'bg-[#301809] hover:bg-[#723c11] text-white shadow-sm'
                }`}
              >
                {isSubscribed ? 'الإشعارات مفعلة ✓' : 'تفعيل التنبيهات 🔔'}
              </Button>
            </div>
          </motion.div>

          {/* Hero Visual Showcase Card (Clean, Symmetrical, No Overflowing Pills) */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            
            {/* Subtle Radiant Halo */}
            <div className="absolute w-[320px] h-[320px] rounded-full bg-[#efa83f]/20 filter blur-3xl -z-10" />

            {/* Showcase Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="w-full max-w-[420px] bg-white rounded-3xl border border-[#dbc397]/70 shadow-xl p-4 text-right"
            >
              {/* High-Res Fortress Photo */}
               <div className="relative h-60 rounded-2xl overflow-hidden group">
                <img 
                  src="/hero-bg.jpg" 
                  alt="تراث وارجلان (ورقلة) وسدراتة" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#301809]/90 via-transparent to-black/20" />

                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-white text-[11px] font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#efa83f]" />
                  <span>تراث وارجلان (ورقلة) وسدراتة</span>
                </div>

                <div className="absolute top-3 left-3 bg-[#efa83f] text-[#301809] px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                  فعالية مميزة
                </div>

                <div className="absolute bottom-3 right-3 left-3">
                  <span className="text-[10px] text-[#fae1b7] font-semibold block mb-0.5">الملتقى السنوي</span>
                  <h3 className="text-white font-thmanyah font-bold text-lg leading-snug">
                    مهرجان الواحات والقصور العتيقة
                  </h3>
                </div>
              </div>

              {/* Event Meta */}
              <div className="pt-4 space-y-3.5">
                <div className="flex items-center justify-between text-xs text-[#723c11] font-medium">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#efa83f]" />
                    <span>موسم الخريف والشتاء • وارجلان (ورقلة)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#b87a29]" />
                    <span>حوض سدراتة الأثري</span>
                  </div>
                </div>

                {/* Digital Ticket Preview */}
                <div className="bg-[#fae1b7]/40 border border-[#d4b174]/50 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#efa83f] to-[#b87a29] flex items-center justify-center text-white shadow-sm">
                      <Ticket className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#301809]">تذكرة إلكترونية فورية QR</div>
                      <div className="text-[10px] text-[#723c11]/80">حضور مجاني برمز الاستجابة</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#723c11] bg-white px-2 py-0.5 rounded-md border border-[#d4b174]/50">
                    متاح الآن
                  </span>
                </div>

                {/* Attendance Ticker */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex -space-x-1.5 space-x-reverse overflow-hidden">
                    <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-[#723c11] text-white text-[9px] font-bold flex items-center justify-center">أ</div>
                    <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-[#b87a29] text-white text-[9px] font-bold flex items-center justify-center">م</div>
                    <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-[#efa83f] text-[#301809] text-[9px] font-bold flex items-center justify-center">ع</div>
                  </div>
                  <span className="text-xs font-semibold text-[#301809]">
                    +420 مشارك مسجل هذا الأسبوع
                  </span>
                </div>
              </div>

            </motion.div>
          </div>

        </div>
      </section>

      {/* Partner Ads Banner (If Available) */}
      {ads.length > 0 && (
        <section className="bg-[#fae1b7]/20 py-6 border-y border-[#d4b174]/30">
          <div className="container mx-auto px-6 text-center">
            <span className="text-xs font-semibold text-[#723c11] tracking-wider uppercase mb-3 block">
              شركاء النجاح والرعاية
            </span>
            <div className="flex flex-wrap justify-center items-center gap-6">
              {ads.map(ad => (
                <a 
                  key={ad.id} 
                  href={ad.link || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-2.5 bg-white px-5 py-2.5 rounded-xl shadow-sm hover:shadow transition-shadow border border-[#dbc397]/40 group"
                >
                  <img src={ad.image_url} alt={ad.partner_name} className="h-7 object-contain" />
                  <span className="font-semibold text-xs text-[#301809] group-hover:text-[#b87a29] transition-colors">{ad.partner_name}</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Community Stats Section */}
      <section id="stats" className="py-16 relative z-10">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fae1b7]/60 text-[#723c11] text-xs font-semibold border border-[#d4b174]/40">
              <TrendingUp className="w-3.5 h-3.5 text-[#efa83f]" />
              أرقام ونمو المجتمع
            </div>
            <h2 className="text-3xl sm:text-4xl font-thmanyah font-bold text-[#301809]">
              حيوية متجددة وتفاعل مستمر
            </h2>
            <p className="text-[#723c11]/80 text-sm md:text-base font-normal">
              إحصائيات حية تعكس عمق التفاعل بين الجمعيات والمشاركين في وارجلان (ورقلة) ومحيط حوض سدراتة.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            
            <div className="p-6 rounded-2xl glass-card text-center space-y-2.5 border border-[#dbc397]/50">
              <div className="w-12 h-12 rounded-xl bg-[#fae1b7] flex items-center justify-center mx-auto text-[#723c11]">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-3xl sm:text-4xl font-thmanyah font-bold text-[#301809]">{stats.users}</div>
              <div className="text-xs font-medium text-[#723c11]/80">مشارك مسجل بالمنصة</div>
            </div>

            <div className="p-6 rounded-2xl glass-card text-center space-y-2.5 border border-[#dbc397]/50">
              <div className="w-12 h-12 rounded-xl bg-[#fae1b7] flex items-center justify-center mx-auto text-[#b87a29]">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="text-3xl sm:text-4xl font-thmanyah font-bold text-[#301809]">{stats.associations}</div>
              <div className="text-xs font-medium text-[#723c11]/80">جمعية محلية معتمدة</div>
            </div>

            <div className="p-6 rounded-2xl glass-card text-center space-y-2.5 border border-[#dbc397]/50">
              <div className="w-12 h-12 rounded-xl bg-[#fae1b7] flex items-center justify-center mx-auto text-[#723c11]">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="text-3xl sm:text-4xl font-thmanyah font-bold text-[#301809]">{stats.events}</div>
              <div className="text-xs font-medium text-[#723c11]/80">فعالية منشورة ومنظمة</div>
            </div>

            <div className="p-6 rounded-2xl glass-card text-center space-y-2.5 border border-[#dbc397]/50">
              <div className="w-12 h-12 rounded-xl bg-[#fae1b7] flex items-center justify-center mx-auto text-[#efa83f]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="text-3xl sm:text-4xl font-thmanyah font-bold text-[#301809]">{stats.rsvps}</div>
              <div className="text-xs font-medium text-[#723c11]/80">تذكرة وتأكيد حضور</div>
            </div>

          </div>
        </div>
      </section>

      {/* Heritage Spotlight Feature Section */}
      <section id="heritage-spotlight" className="py-10 relative z-10 mx-4 md:mx-auto max-w-7xl">
        <div className="rounded-3xl bg-gradient-to-br from-[#301809] via-[#4a2711] to-[#723c11] text-white p-8 md:p-12 relative overflow-hidden shadow-xl border border-[#d4b174]/30">
          
          <div className="grid lg:grid-cols-12 gap-8 items-center relative z-10">
            
            <div className="lg:col-span-7 space-y-5 text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#efa83f]/20 border border-[#efa83f]/40 text-[#efa83f] text-xs font-semibold">
                <BookOpen className="w-3.5 h-3.5" />
                ذاكرة الواحات وأصالة سدراتة
              </div>

              <h2 className="text-3xl sm:text-4xl font-thmanyah font-bold leading-tight">
                روح التاريخ تلهم الحاضر، <br />
                <span className="text-[#efa83f]">وجسور التراث تمتد للأجيال</span>
              </h2>

              <p className="text-[#fae1b7]/80 text-sm md:text-base leading-relaxed font-normal">
                تحتفظ منطقة وارجلان (ورقلة) وحوض سدراتة بكنوز معمارية وثقافية فريدة. نربط حاضر المجتمع الحي بعراقة أسلافنا عبر أرشفة المعالم التاريخية، القصص، والحرف التقليدية.
              </p>

              <div className="flex flex-wrap gap-3 pt-1">
                <Button 
                  onClick={() => navigate('/heritage')}
                  className="bg-gradient-to-r from-[#efa83f] to-[#b87a29] hover:from-[#f0b24d] hover:to-[#854515] text-[#301809] font-bold px-6 py-5 rounded-xl text-sm shadow-glow-amber transition-all"
                >
                  استكشف الأرشيف التراثي
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                </Button>
                <a href="#events">
                  <Button 
                    variant="outline" 
                    className="border-white/30 text-white hover:bg-white/10 font-medium px-5 py-5 rounded-xl text-sm"
                  >
                    فعاليات التراث القادمة
                  </Button>
                </a>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden border border-[#d4b174]/40 shadow-lg">
                <img 
                  src="/hero-bg.jpg" 
                  alt="قصر سدراتة وتراث ورقلة" 
                  className="w-full h-72 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 right-4 left-4 text-right">
                  <span className="text-[#efa83f] text-xs font-bold">حوض سدراتة الأثري</span>
                  <p className="text-white text-xs mt-0.5 font-normal">
                    شاهد على حضارة عريقة تلتقي فيها العمارة الصحراوية بجمال الواحة.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Events / News Section */}
      <section id="events" className="py-16 relative z-10 glass-panel mt-10 rounded-3xl mx-4 md:mx-auto max-w-7xl border border-[#dbc397]/50">
        <div className="container mx-auto px-6">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-5">
            <div className="space-y-2 text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fae1b7] text-[#723c11] text-xs font-semibold border border-[#d4b174]/50">
                <Sparkles className="w-3.5 h-3.5 text-[#efa83f]" />
                دليل الأنشطة العامة
              </div>
              <h2 className="text-3xl sm:text-4xl font-thmanyah font-bold text-[#301809]">
                الفعاليات والأخبار الجارية
              </h2>
              <p className="text-[#723c11]/80 text-sm font-normal">
                اكتشف آخر الفعاليات، الورشات والمبادرات التي تنظمها الجمعيات في مختلف المجالات
              </p>
            </div>
            
            {/* Search Box */}
            <div className="relative w-full md:w-80">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b87a29]" />
              <Input 
                type="text" 
                placeholder="ابحث عن فعالية، موقع، جمعية..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-11 pr-10 pl-4 rounded-xl border-[#dbc397] bg-white/80 focus-visible:ring-[#efa83f] text-xs"
              />
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === cat.value
                    ? 'bg-gradient-to-r from-[#efa83f] to-[#b87a29] text-white shadow-sm'
                    : 'bg-white/80 text-[#301809] border border-[#dbc397]/50 hover:bg-[#fae1b7]/40'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Events Grid */}
          {loadingEvents ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-3 border-[#efa83f] border-t-transparent rounded-full animate-spin" />
              <p className="text-[#723c11] text-xs font-semibold mt-3 animate-pulse">جاري جلب الفعاليات...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center border-2 border-dashed border-[#dbc397]/60">
              <Calendar className="w-12 h-12 text-[#d4b174] mx-auto mb-3" />
              <h3 className="text-lg font-bold text-[#301809]">لا توجد فعاليات مطابقة في هذا التصنيف حالياً</h3>
              <p className="text-[#723c11]/70 text-xs mt-1.5 font-normal">يرجى تجربة البحث بكلمات أخرى أو تغيير تصنيف الفعالية.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((ev) => (
                <Card 
                  key={ev.id}
                  className="group overflow-hidden rounded-2xl border border-[#dbc397]/40 glass-card flex flex-col h-[490px] cursor-pointer hover:border-[#efa83f]/70"
                  onClick={() => navigate(`/event/${ev.id}`)}
                >
                  <div className="h-52 overflow-hidden relative bg-[#fae1b7]/20 flex items-center justify-center">
                    {ev.cover_image_url ? (
                      <img 
                        src={ev.cover_image_url} 
                        alt={ev.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fb = e.currentTarget.parentElement?.querySelector('.card-fallback');
                          if (fb) fb.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`${ev.cover_image_url ? 'hidden' : ''} card-fallback absolute inset-0 bg-gradient-to-tr from-[#301809] via-[#723c11] to-[#b87a29] flex items-center justify-center text-white flex-col gap-2 p-6 text-center`}>
                      <div className="w-10 h-10 rounded-xl bg-[#efa83f]/20 border border-[#efa83f]/40 flex items-center justify-center mb-1">
                        <Calendar className="w-5 h-5 text-[#efa83f]" />
                      </div>
                      <span className="font-bold text-lg text-[#fae1b7]">تواصل صحراء</span>
                      <span className="text-xs text-white/70">وارجلان (ورقلة) • حوض سدراتة</span>
                    </div>

                    <div className={`absolute top-3 right-3 z-10 px-3 py-1 rounded-full text-[11px] font-bold border shadow-sm ${getCategoryTheme(ev.category)}`}>
                      {getCategoryLabel(ev.category)}
                    </div>

                    <div className="absolute bottom-3 left-3 bg-[#301809]/80 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-bold text-[#efa83f] border border-[#efa83f]/30">
                      تذكرة مجانية
                    </div>
                  </div>

                  <CardContent className="p-6 flex-1 flex flex-col text-right">
                    <span className="text-xs font-semibold text-[#b87a29] mb-1.5 block">
                      تنظيم: {ev.associations?.name || 'جمعية معتمدة'}
                    </span>
                    <h3 className="text-lg font-bold text-[#301809] group-hover:text-[#b87a29] transition-colors line-clamp-1 leading-snug mb-2 font-thmanyah">
                      {ev.title}
                    </h3>
                    <p className="text-[#723c11]/80 leading-relaxed line-clamp-3 text-xs font-normal mb-5 flex-1">
                      {ev.description || 'لا يوجد وصف متاح للفعالية حالياً. اضغط للاطلاع على التفاصيل ومكان الانعقاد.'}
                    </p>

                    <div className="pt-4 border-t border-[#dbc397]/40 flex flex-col gap-2 text-xs text-[#723c11]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#efa83f]" />
                        <span>{ev.date}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#b87a29]" />
                          <span className="truncate max-w-[160px]">{ev.location}</span>
                        </div>
                        <span className="text-[#301809] bg-[#fae1b7] group-hover:bg-[#efa83f] group-hover:text-white transition-colors px-2.5 py-1 rounded-lg text-[10px] font-bold border border-[#d4b174]/50">
                          احجز مقعدك
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Structured, Balanced Footer */}
      <footer className="bg-[#301809] text-white pt-16 pb-12 relative overflow-hidden mt-20 border-t border-[#d4b174]/30">
        
        <div className="container mx-auto px-6 relative z-10 space-y-12">
          
          {/* Quote Section at Top of Footer */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#efa83f]/20 border border-[#efa83f]/40 flex items-center justify-center mx-auto text-[#efa83f] shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <p className="text-xl sm:text-2xl font-thmanyah font-bold text-[#fae1b7] leading-relaxed">
              "من ليس له ماضٍ، ليس له حاضر ولا مستقبل"
            </p>
          </div>

          <div className="w-full h-px bg-[#d4b174]/20 max-w-4xl mx-auto" />

          {/* 3-Column Structured Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-right max-w-5xl mx-auto text-sm">
            
            {/* Column 1: Platform About */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#efa83f] text-[#301809] font-bold flex items-center justify-center text-sm">
                  ص
                </div>
                <span className="font-bold text-base text-white">تواصل صحراء</span>
              </div>
              <p className="text-xs text-[#fae1b7]/70 leading-relaxed font-normal">
                منصة رقمية موحدة لربط جمعيات وارجلان (ورقلة) وحوض سدراتة، وإتاحة الفعاليات العامة والأرشيف التراثي في متناول الجميع.
              </p>
            </div>

            {/* Column 2: Navigation Links */}
            <div className="space-y-2.5">
              <h5 className="font-bold text-xs uppercase tracking-wider text-[#efa83f]">روابط سريعة</h5>
              <ul className="space-y-1.5 text-xs text-[#fae1b7]/80">
                <li><a href="#hero" className="hover:text-white transition-colors">الصفحة الرئيسية</a></li>
                <li><a href="#events" className="hover:text-white transition-colors">دليل الفعاليات والأخبار</a></li>
                <li><button onClick={() => navigate('/heritage')} className="hover:text-white transition-colors">الأرشيف التراثي لسدراتة</button></li>
                <li><a href="#stats" className="hover:text-white transition-colors">إحصائيات المجتمع</a></li>
              </ul>
            </div>

            {/* Column 3: Portals */}
            <div className="space-y-2.5">
              <h5 className="font-bold text-xs uppercase tracking-wider text-[#efa83f]">بوابات الحسابات</h5>
              <ul className="space-y-1.5 text-xs text-[#fae1b7]/80">
                <li><button onClick={() => { setLoginTab('attendee'); setIsLoginOpen(true); }} className="hover:text-white transition-colors">بوابة المشاركين والزوار</button></li>
                <li><button onClick={() => { setLoginTab('admin'); setIsLoginOpen(true); }} className="hover:text-white transition-colors">بوابة الجمعيات والمشرفين</button></li>
                <li><span className="text-[#fae1b7]/50">وارجلان (ورقلة) • الجزائر</span></li>
              </ul>
            </div>

          </div>

          <div className="w-full h-px bg-[#d4b174]/15 max-w-5xl mx-auto" />

          {/* Bottom Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-[#fae1b7]/60 max-w-5xl mx-auto gap-3">
            <p>© {new Date().getFullYear()} جميع الحقوق محفوظة لمنصة تواصل صحراء.</p>
            <span className="text-[11px] font-semibold text-[#efa83f]/90 tracking-wide">
              Sahara Gather Connect • Ouargla & Sedrata
            </span>
          </div>

        </div>
      </footer>

      {/* Login Dialog Harmonized with the Theme */}
      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogContent className="max-w-[460px] p-0 overflow-hidden rounded-3xl border border-[#dbc397]/50 bg-[#fdfbf7] shadow-2xl animate-in zoom-in-95 duration-200">
          <DialogHeader className="sr-only">
            <DialogTitle>تسجيل الدخول في منصة تواصل صحراء</DialogTitle>
            <DialogDescription>أدخل بريدك الإلكتروني وكلمة المرور لتسجيل الدخول إلى حسابك.</DialogDescription>
          </DialogHeader>

          {/* Palette Tabs */}
          <div className="flex border-b border-[#dbc397]/40">
            <button 
              onClick={() => {
                setLoginTab('attendee');
                setIsSignUp(false);
              }}
              className={`flex-1 py-4 text-center text-sm font-bold transition-colors ${
                loginTab === 'attendee' 
                  ? 'bg-[#fae1b7]/70 text-[#723c11] border-b-2 border-[#efa83f]' 
                  : 'bg-white/50 text-[#723c11]/50 border-b border-transparent hover:text-[#723c11]'
              }`}
            >
              مشارك / زائر 👤
            </button>
            <button 
              onClick={() => {
                setLoginTab('admin');
                setIsSignUp(false);
              }}
              className={`flex-1 py-4 text-center text-sm font-bold transition-colors ${
                loginTab === 'admin' 
                  ? 'bg-[#301809] text-[#fae1b7] border-b-2 border-[#efa83f]' 
                  : 'bg-white/50 text-[#723c11]/50 border-b border-transparent hover:text-[#723c11]'
              }`}
            >
              جمعية / مسؤول 🏢
            </button>
          </div>

          <div className="p-7 space-y-5 text-right">
            <div className="text-center space-y-1">
              <h3 className={`text-xl font-bold font-thmanyah ${loginTab === 'admin' ? 'text-[#301809]' : 'text-[#723c11]'}`}>
                {loginTab === 'admin' ? 'بوابة المسؤولين والجمعيات' : (isSignUp ? 'إنشاء حساب جديد' : 'تسجيل دخول المشاركين')}
              </h3>
              <p className="text-xs text-[#723c11]/70 font-normal">
                {loginTab === 'admin' 
                  ? 'تسجيل الدخول للمشرفين ومديري الجمعيات المعتمدة' 
                  : 'استكشف الفعاليات، احجز تذاكرك وتفاعل مع مجتمعك'}
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              
              {loginTab === 'attendee' && isSignUp && (
                <div className="space-y-1.5">
                  <Label htmlFor="signup-name" className="font-semibold text-[#301809] text-xs">الاسم واللقب</Label>
                  <div className="relative">
                    <Input 
                      id="signup-name"
                      type="text" 
                      placeholder="الاسم الكامل" 
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      required
                      className="pr-10 h-11 rounded-xl border-[#dbc397] focus-visible:ring-[#efa83f] text-xs"
                    />
                    <User className="absolute right-3 top-3 w-4 h-4 text-[#b87a29]" />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="font-semibold text-[#301809] text-xs">البريد الإلكتروني</Label>
                <div className="relative">
                  <Input 
                    id="login-email"
                    type="email" 
                    placeholder="example@mail.com" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    dir="ltr"
                    className="pr-10 h-11 rounded-xl border-[#dbc397] focus-visible:ring-[#efa83f] text-xs"
                  />
                  <Mail className="absolute right-3 top-3 w-4 h-4 text-[#b87a29]" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="login-pass" className="font-semibold text-[#301809] text-xs">كلمة المرور</Label>
                <div className="relative">
                  <Input 
                    id="login-pass"
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    dir="ltr"
                    className="pr-10 h-11 rounded-xl border-[#dbc397] focus-visible:ring-[#efa83f] text-xs"
                  />
                  <Lock className="absolute right-3 top-3 w-4 h-4 text-[#b87a29]" />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={authLoading}
                className={`w-full h-12 text-sm font-bold rounded-xl gap-2 mt-3 shadow-md transition-all ${
                  loginTab === 'admin' 
                    ? 'bg-[#301809] hover:bg-[#4a2711] text-white' 
                    : 'bg-gradient-to-r from-[#efa83f] to-[#b87a29] text-white shadow-glow-amber'
                }`}
              >
                {authLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto text-white" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>{isSignUp ? 'تأكيد إنشاء الحساب' : 'تسجيل الدخول'}</span>
                  </>
                )}
              </Button>

              {loginTab === 'attendee' && (
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="w-full text-center text-xs text-[#b87a29] font-semibold hover:underline pt-1 block"
                >
                  {isSignUp ? 'لديك حساب بالفعل؟ سجل دخولك الآن' : 'ليس لديك حساب؟ سجل حساباً جديداً'}
                </button>
              )}
            </form>

            {loginTab === 'attendee' && !isSignUp && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center before:mt-0.5 before:flex-1 before:border-t before:border-[#dbc397]/50 after:mt-0.5 after:flex-1 after:border-t after:border-[#dbc397]/50">
                  <span className="mx-3 text-[10px] font-semibold text-[#723c11]/60">أو</span>
                </div>
                
                <Button 
                  onClick={handleDemoLogin}
                  disabled={demoLoading}
                  variant="outline"
                  className="w-full h-11 rounded-xl text-[#301809] hover:bg-[#fae1b7]/40 border-[#d4b174] text-xs font-semibold"
                >
                  {demoLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'دخول تجريبي سريع كـ زائر ⚡'}
                </Button>
              </div>
            )}

          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
