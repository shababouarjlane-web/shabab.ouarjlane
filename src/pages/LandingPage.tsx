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
  Compass,
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
      // Fetch public and active events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*, associations(name)')
        .eq('is_public', true)
        .eq('status', 'active')
        .order('date', { ascending: true });
      
      setEvents(eventsData || []);

      // Fetch Stats
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

      // Fetch Ads
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

  // Filter Categories
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

  // Authentication Handlers
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
    <div className="min-h-screen bg-[#fdfbf7] relative overflow-x-hidden text-[#301809] selection:bg-[#efa83f] selection:text-[#301809]" dir="rtl">
      
      {/* Warm Ambient Atmosphere & Animated Glow Orbs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[650px] h-[650px] bg-[#efa83f]/15 rounded-full filter blur-[130px] animate-blob" />
        <div className="absolute top-[25%] left-[-15%] w-[600px] h-[600px] bg-[#d4b174]/20 rounded-full filter blur-[140px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-15%] right-[15%] w-[700px] h-[700px] bg-[#723c11]/10 rounded-full filter blur-[160px] animate-blob animation-delay-4000" />
        <div className="absolute top-[60%] right-[-10%] w-[450px] h-[450px] bg-[#84939c]/15 rounded-full filter blur-[120px]" />
      </div>

      {/* Floating Header */}
      <header className="sticky top-4 z-50 mx-4 md:mx-auto max-w-7xl glass-panel rounded-3xl transition-all duration-300 shadow-sm border border-[#dbc397]/50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#301809] via-[#723c11] to-[#efa83f] flex items-center justify-center text-white font-black text-xl shadow-md shadow-[#723c11]/25 ring-2 ring-[#efa83f]/30">
              ص
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-[#301809] tracking-tight">
                  تواصل صحراء
                </span>
                <span className="hidden sm:inline-block text-[10px] font-black text-[#723c11] bg-[#fae1b7] border border-[#d4b174]/60 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Sahara Connect
                </span>
              </div>
              <p className="text-[11px] text-[#723c11]/70 font-semibold hidden md:block">
                ورقلة • حوض سدراتة • الأصالة والمستقبل
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 font-black text-[#301809]/80">
            <a href="#hero" className="hover:text-[#b87a29] transition-colors">الرئيسية</a>
            <a href="#events" className="hover:text-[#b87a29] transition-colors">الفعاليات والأخبار</a>
            <a href="#heritage-spotlight" className="hover:text-[#b87a29] transition-colors">أصالة سدراتة</a>
            <a href="#stats" className="hover:text-[#b87a29] transition-colors">المجتمع بالأرقام</a>
            <button 
              onClick={() => navigate('/heritage')} 
              className="hover:text-[#b87a29] transition-colors flex items-center gap-1.5 text-[#723c11] bg-[#fae1b7]/60 px-3 py-1.5 rounded-xl border border-[#d4b174]/40"
            >
              <BookOpen className="w-4 h-4 text-[#b87a29]" />
              الأرشيف التراثي
            </button>
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Notifications Toggle */}
            <Button 
              variant="ghost" 
              onClick={isSubscribed ? unsubscribe : subscribe}
              disabled={notifLoading}
              className={`p-3 rounded-2xl border transition-all ${
                isSubscribed 
                  ? 'border-[#efa83f] text-[#723c11] bg-[#fae1b7]/70 hover:bg-[#fae1b7]' 
                  : 'border-[#dbc397] text-[#723c11] bg-white/80 hover:bg-[#fae1b7]/40'
              }`}
              title={isSubscribed ? 'تعطيل الإشعارات' : 'تفعيل إشعارات الفعاليات'}
            >
              {notifLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-[#b87a29]" />
              ) : isSubscribed ? (
                <Bell className="w-5 h-5 text-[#efa83f] fill-[#efa83f] animate-pulse" />
              ) : (
                <BellOff className="w-5 h-5 text-[#723c11]/60" />
              )}
            </Button>

            {/* Login / Auth Button */}
            <Button 
              onClick={() => {
                setIsSignUp(false);
                setIsLoginOpen(true);
              }}
              className="bg-gradient-to-r from-[#301809] via-[#723c11] to-[#301809] hover:from-[#723c11] hover:to-[#b87a29] text-white font-black px-6 py-6 rounded-2xl shadow-lg shadow-[#301809]/20 gap-2 text-base transition-all hover:scale-105 active:scale-95 border border-[#d4b174]/30"
            >
              <LogIn className="w-5 h-5 text-[#efa83f]" />
              تسجيل الدخول
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative pt-12 pb-20 md:py-28 z-10">
        <div className="container mx-auto px-6 grid lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          {/* Hero Copy (Text Column) */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-7 space-y-8 text-right"
          >
            {/* Heritage Badge */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#fae1b7]/80 border border-[#d4b174]/70 shadow-sm backdrop-blur-md"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#efa83f] animate-ping" />
              <Sparkles className="w-4 h-4 text-[#b87a29]" />
              <span className="text-xs sm:text-sm font-black text-[#723c11]">
                بوابة مجتمع ورقلة وحوض سدراتة الرقمية الموحدة
              </span>
            </motion.div>
            
            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-[#301809] leading-[1.18] tracking-tight">
              تواصل، تفاعل وارتقِ مع <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#723c11] via-[#b87a29] to-[#efa83f] drop-shadow-sm">
                مجتمعك وأصالتك التراثية
              </span>
            </h1>
            
            {/* Subtitle Description */}
            <p className="text-base sm:text-lg md:text-xl text-[#301809]/80 font-medium leading-relaxed max-w-2xl">
              منصة رقمية رائدة تجمع أهالي وجمعيات ورقلة وحوض سدراتة التاريخي. شارك في الفعاليات الحية، احصل على تذكرتك الذكية بلمسة واحدة، وساهم في إحياء الذاكرة التراثية لوحاتنا الخالدة.
            </p>

            {/* CTA Buttons with Maximum Pop */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="flex flex-wrap gap-4 pt-2"
            >
              <a href="#events">
                <Button className="bg-gradient-to-r from-[#efa83f] via-[#b87a29] to-[#723c11] hover:from-[#f0b24d] hover:to-[#854515] text-white font-black px-8 py-7 rounded-2xl text-lg shadow-glow-amber transition-all hover:scale-105 hover:-translate-y-0.5 active:scale-95 gap-3 border border-white/20">
                  <span>استكشف الفعاليات الجارية</span>
                  <ChevronLeft className="w-5 h-5 text-white" />
                </Button>
              </a>

              <Button 
                variant="outline" 
                onClick={() => navigate('/heritage')} 
                className="bg-white/85 hover:bg-white text-[#723c11] border-2 border-[#b87a29]/40 font-black px-8 py-7 rounded-2xl text-lg shadow-sm hover:shadow-md transition-all hover:scale-105 hover:-translate-y-0.5 gap-2"
              >
                <BookOpen className="w-5 h-5 text-[#b87a29]" />
                <span>تصفح السجل التراثي</span>
              </Button>
            </motion.div>

            {/* Quick Push Notification Banner Card */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="glass-card p-5 rounded-3xl max-w-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-r-4 border-r-[#efa83f]"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#fae1b7] border border-[#d4b174]/50 flex items-center justify-center shrink-0 shadow-sm">
                  <Bell className="w-6 h-6 text-[#723c11]" />
                </div>
                <div>
                  <h4 className="font-black text-[#301809] text-sm">تنبيهات الفعاليات الفورية على هاتفك</h4>
                  <p className="text-xs text-[#723c11]/70 font-medium mt-0.5">كن أول من يعلم بمواعيد المهرجانات، الندوات، والنشاطات المجتمعية.</p>
                </div>
              </div>
              <Button 
                onClick={subscribe}
                disabled={isSubscribed}
                className={`text-xs font-black h-11 px-5 rounded-xl shadow-md transition-all hover:scale-105 shrink-0 ${
                  isSubscribed 
                    ? 'bg-[#fae1b7] text-[#723c11] border border-[#d4b174]' 
                    : 'bg-[#301809] hover:bg-[#723c11] text-white'
                }`}
              >
                {isSubscribed ? 'الإشعارات مفعلة ✓' : 'تفعيل التنبيهات 🔔'}
              </Button>
            </motion.div>
          </motion.div>

          {/* Hero Visual Showcase (3D Perspective Showcase Card with Castle Motif) */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            
            {/* Radiant Golden Backdrop Glow */}
            <div className="absolute w-[360px] h-[360px] rounded-full bg-gradient-to-tr from-[#efa83f]/30 via-[#b87a29]/20 to-[#723c11]/20 filter blur-3xl -z-10" />

            {/* Main Interactive Showcase Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotateY: 5 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              whileHover={{ y: -6, transition: { duration: 0.3 } }}
              className="w-full max-w-[420px] bg-white/90 backdrop-blur-xl rounded-[2.5rem] border border-[#dbc397]/70 shadow-[0_25px_60px_-15px_rgba(48,24,9,0.18)] p-4 relative overflow-hidden"
            >
              {/* Top Scenic Photography Banner (Cropped Fortress / Water Reflection) */}
              <div className="relative h-60 rounded-[2rem] overflow-hidden group">
                <img 
                  src="/hero-bg.jpg" 
                  alt="قلعة وتراث صحراء الجزائر" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                />
                
                {/* Visual Gradient Shading */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#301809] via-transparent to-black/30" />

                {/* Floating Top Badges inside Photo */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-white text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#efa83f] animate-pulse" />
                  <span>تراث ورقلة وسدراتة</span>
                </div>

                <div className="absolute top-3 left-3 bg-[#efa83f] text-[#301809] px-2.5 py-1 rounded-full text-[10px] font-black shadow-md">
                  حدث مميز
                </div>

                {/* Caption at Bottom of Photo */}
                <div className="absolute bottom-3 right-3 left-3 text-right">
                  <span className="text-[10px] text-[#fae1b7] font-bold block mb-0.5">الملتقى التراثي السنوي</span>
                  <h3 className="text-white font-black text-lg drop-shadow-md">
                    مهرجان الواحات والقصور العتيقة
                  </h3>
                </div>
              </div>

              {/* Card Meta & Interactive Ticker */}
              <div className="p-4 space-y-4 text-right">
                
                <div className="flex items-center justify-between text-xs text-[#723c11] font-bold">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#efa83f]" />
                    <span>موسم الخريف والشتاء • ورقلة</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#b87a29]" />
                    <span>حوض سدراتة الأثري</span>
                  </div>
                </div>

                {/* Simulated Digital Ticket Teaser */}
                <div className="bg-[#fae1b7]/40 border border-[#d4b174]/50 rounded-2xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#efa83f] to-[#b87a29] flex items-center justify-center text-white shadow-sm">
                      <Ticket className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-[#301809]">تذكرة إلكترونية فورية QR</div>
                      <div className="text-[10px] text-[#723c11]/80 font-bold">حضور مجاني برمز الاستجابة</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-black text-[#723c11] bg-white px-2.5 py-1 rounded-lg border border-[#d4b174]/50">
                    متاح الآن
                  </span>
                </div>

                {/* Live Attendees Ticker */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex -space-x-2 space-x-reverse overflow-hidden">
                    <div className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-[#723c11] text-white text-[10px] font-bold flex items-center justify-center">أ</div>
                    <div className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-[#b87a29] text-white text-[10px] font-bold flex items-center justify-center">م</div>
                    <div className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-[#efa83f] text-[#301809] text-[10px] font-bold flex items-center justify-center">ع</div>
                  </div>
                  <span className="text-xs font-black text-[#301809]">
                    +420 مشارك مسجل هذا الأسبوع
                  </span>
                </div>

              </div>

              {/* Floating Notification Pill Widget (Overhanging for 3D Pop Effect) */}
              <motion.div 
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-3 -right-3 sm:-right-6 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-[#efa83f]/40 flex items-center gap-2.5 z-20 text-right"
              >
                <span className="w-3 h-3 rounded-full bg-[#efa83f] ring-4 ring-[#efa83f]/20" />
                <div>
                  <div className="text-[10px] font-bold text-[#723c11]">إشعار جديد بالمنصة</div>
                  <div className="text-xs font-black text-[#301809]">تم فتح باب التسجيل للورشات</div>
                </div>
              </motion.div>

              {/* Bottom Floating Badge */}
              <motion.div 
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-3 -left-3 sm:-left-6 bg-[#301809] text-white px-4 py-2 rounded-2xl shadow-xl border border-[#d4b174]/40 flex items-center gap-2 z-20 text-right"
              >
                <Compass className="w-4 h-4 text-[#efa83f]" />
                <span className="text-xs font-black">12 جمعية نشطة معتمدة</span>
              </motion.div>

            </motion.div>
          </div>

        </div>
      </section>

      {/* Partner Ads Banner (If Any Active Ads Exist) */}
      {ads.length > 0 && (
        <section className="bg-[#fae1b7]/30 py-8 border-y border-[#d4b174]/40">
          <div className="container mx-auto px-6 text-center">
            <span className="text-xs font-black text-[#723c11] tracking-widest uppercase mb-4 block">
              شركاء النجاح والرعاية المعتمدون
            </span>
            <div className="flex flex-wrap justify-center items-center gap-8">
              {ads.map(ad => (
                <a 
                  key={ad.id} 
                  href={ad.link || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-[#dbc397]/50 group"
                >
                  <img src={ad.image_url} alt={ad.partner_name} className="h-8 object-contain" />
                  <span className="font-bold text-sm text-[#301809] group-hover:text-[#b87a29] transition-colors">{ad.partner_name}</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Community Stats Section */}
      <section id="stats" className="py-20 relative z-10">
        <div className="container mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto mb-16 space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#fae1b7]/60 text-[#723c11] text-xs font-black border border-[#d4b174]/40">
              <TrendingUp className="w-3.5 h-3.5 text-[#efa83f]" />
              أرقام ونمو المجتمع
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#301809]">
              حيوية متجددة وتفاعل مستمر
            </h2>
            <p className="text-[#723c11]/80 font-medium">
              إحصائيات حية تعكس عمق التفاعل بين الجمعيات والمشاركين في ورقلة ومحيط حوض سدراتة.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            
            {/* Stat Card 1: Users */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="p-8 rounded-[2rem] glass-card text-center space-y-3 relative group overflow-hidden border border-[#dbc397]/50"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#b87a29]/10 rounded-full translate-x-6 -translate-y-6 group-hover:scale-150 transition-transform duration-500" />
              <div className="w-14 h-14 rounded-2xl bg-[#fae1b7] border border-[#d4b174]/50 flex items-center justify-center mx-auto text-[#723c11] shadow-sm">
                <Users className="w-7 h-7" />
              </div>
              <div className="text-4xl sm:text-5xl font-black text-[#301809] relative z-10">{stats.users}</div>
              <div className="text-sm font-bold text-[#723c11]/80 relative z-10">مشارك مسجل بالمنصة</div>
            </motion.div>

            {/* Stat Card 2: Associations */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="p-8 rounded-[2rem] glass-card text-center space-y-3 relative group overflow-hidden border border-[#dbc397]/50"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#efa83f]/15 rounded-full translate-x-6 -translate-y-6 group-hover:scale-150 transition-transform duration-500" />
              <div className="w-14 h-14 rounded-2xl bg-[#fae1b7] border border-[#d4b174]/50 flex items-center justify-center mx-auto text-[#b87a29] shadow-sm">
                <Building2 className="w-7 h-7" />
              </div>
              <div className="text-4xl sm:text-5xl font-black text-[#301809] relative z-10">{stats.associations}</div>
              <div className="text-sm font-bold text-[#723c11]/80 relative z-10">جمعية محلية معتمدة</div>
            </motion.div>

            {/* Stat Card 3: Events */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="p-8 rounded-[2rem] glass-card text-center space-y-3 relative group overflow-hidden border border-[#dbc397]/50"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#723c11]/10 rounded-full translate-x-6 -translate-y-6 group-hover:scale-150 transition-transform duration-500" />
              <div className="w-14 h-14 rounded-2xl bg-[#fae1b7] border border-[#d4b174]/50 flex items-center justify-center mx-auto text-[#723c11] shadow-sm">
                <Calendar className="w-7 h-7" />
              </div>
              <div className="text-4xl sm:text-5xl font-black text-[#301809] relative z-10">{stats.events}</div>
              <div className="text-sm font-bold text-[#723c11]/80 relative z-10">فعالية منشورة ومنظمة</div>
            </motion.div>

            {/* Stat Card 4: RSVPs */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="p-8 rounded-[2rem] glass-card text-center space-y-3 relative group overflow-hidden border border-[#dbc397]/50"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#efa83f]/20 rounded-full translate-x-6 -translate-y-6 group-hover:scale-150 transition-transform duration-500" />
              <div className="w-14 h-14 rounded-2xl bg-[#fae1b7] border border-[#d4b174]/50 flex items-center justify-center mx-auto text-[#efa83f] shadow-sm">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="text-4xl sm:text-5xl font-black text-[#301809] relative z-10">{stats.rsvps}</div>
              <div className="text-sm font-bold text-[#723c11]/80 relative z-10">تذكرة وتأكيد حضور</div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Heritage Spotlight Feature Section (Highlighting Castle Photo & Heritage Archive) */}
      <section id="heritage-spotlight" className="py-12 relative z-10 mx-4 md:mx-auto max-w-7xl">
        <div className="rounded-[3rem] bg-gradient-to-br from-[#301809] via-[#4a2711] to-[#723c11] text-white p-8 md:p-14 relative overflow-hidden shadow-2xl border border-[#d4b174]/30">
          
          {/* Background Ambient Elements */}
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#efa83f]/20 filter blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#b87a29]/20 filter blur-3xl pointer-events-none" />

          <div className="grid lg:grid-cols-12 gap-10 items-center relative z-10">
            
            <div className="lg:col-span-7 space-y-6 text-right">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#efa83f]/20 border border-[#efa83f]/40 text-[#efa83f] text-xs font-black">
                <BookOpen className="w-3.5 h-3.5" />
                ذاكرة الواحات وأصالة سدراتة
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight">
                روح التاريخ تلهم الحاضر، <br />
                <span className="text-[#efa83f]">وجسور التراث تمتد للأجيال</span>
              </h2>

              <p className="text-[#fae1b7]/80 text-base md:text-lg leading-relaxed font-normal">
                تحتفظ منطقة ورقلة وحوض سدراتة بكنوز معمارية وثقافية فريدة. من خلال منصة تواصل صحراء، نربط حاضر المجتمع الحي بعراقة أسلافنا عبر أرشفة المعالم التاريخية، القصص، والحرف التقليدية.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <Button 
                  onClick={() => navigate('/heritage')}
                  className="bg-gradient-to-r from-[#efa83f] to-[#b87a29] hover:from-[#f0b24d] hover:to-[#854515] text-[#301809] font-black px-7 py-6 rounded-2xl text-base shadow-glow-amber transition-all hover:scale-105"
                >
                  استكشف الأرشيف التراثي لسدراتة
                  <ArrowUpRight className="w-5 h-5 mr-1" />
                </Button>
                <a href="#events">
                  <Button 
                    variant="outline" 
                    className="border-white/30 text-white hover:bg-white/10 font-bold px-6 py-6 rounded-2xl text-base"
                  >
                    فعاليات التراث القادمة
                  </Button>
                </a>
              </div>
            </div>

            {/* Visual Photo Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden border-2 border-[#d4b174]/40 shadow-2xl group">
                <img 
                  src="/hero-bg.jpg" 
                  alt="قصر سدراتة وتراث ورقلة" 
                  className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 right-4 left-4 text-right">
                  <span className="text-[#efa83f] text-xs font-black">حوض سدراتة الأثري</span>
                  <p className="text-white text-sm font-bold mt-1">
                    شاهد على حضارة عريقة تلتقي فيها العمارة الصحراوية بجمال الطبيعة.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Events / News Section */}
      <section id="events" className="py-20 relative z-10 glass-panel mt-12 rounded-[3.5rem] mx-4 md:mx-auto max-w-7xl border border-[#dbc397]/60">
        <div className="container mx-auto px-6">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6"
          >
            <div className="space-y-3 text-right">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fae1b7] text-[#723c11] text-xs font-black border border-[#d4b174]/50">
                <Sparkles className="w-3.5 h-3.5 text-[#efa83f]" />
                دليل الأنشطة العامة
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-[#301809]">
                الفعاليات والأخبار الجارية
              </h2>
              <p className="text-[#723c11]/80 font-medium">
                اكتشف آخر الفعاليات، الورشات والمبادرات التي تنظمها الجمعيات في مختلف المجالات
              </p>
            </div>
            
            {/* Search Box with Gold Accent */}
            <div className="relative w-full md:w-80 group">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#b87a29] group-focus-within:text-[#efa83f] transition-colors" />
              <Input 
                type="text" 
                placeholder="ابحث عن فعالية، موقع، جمعية..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-12 pr-12 pl-4 rounded-2xl border-[#dbc397] bg-white/80 backdrop-blur focus-visible:ring-[#efa83f] focus-visible:border-[#efa83f] focus-visible:bg-white transition-all shadow-sm text-sm"
              />
            </div>
          </motion.div>

          {/* Category Filter Chips */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-wrap gap-2.5 mb-10"
          >
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-5 py-2.5 rounded-2xl text-sm font-black transition-all hover:scale-105 ${
                  selectedCategory === cat.value
                    ? 'bg-gradient-to-r from-[#efa83f] to-[#b87a29] text-white shadow-glow-amber border border-white/20'
                    : 'bg-white/80 text-[#301809] border border-[#dbc397]/50 hover:bg-[#fae1b7]/40 shadow-sm'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </motion.div>

          {/* Events Grid */}
          {loadingEvents ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-12 h-12 border-4 border-[#efa83f] border-t-transparent rounded-full animate-spin" />
              <p className="text-[#723c11] font-bold mt-4 animate-pulse">جاري جلب الفعاليات الحية...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="glass-card rounded-[2.5rem] p-16 text-center border-2 border-dashed border-[#dbc397]/60">
              <Calendar className="w-14 h-14 text-[#d4b174] mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[#301809]">لا توجد فعاليات مطابقة في هذا التصنيف حالياً</h3>
              <p className="text-[#723c11]/70 mt-2 font-medium">يرجى تجربة البحث بكلمات أخرى أو تغيير تصنيف الفعالية.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents.map((ev, i) => (
                <motion.div 
                  key={ev.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                >
                  <Card 
                    className="group overflow-hidden rounded-[2.5rem] border border-[#dbc397]/40 glass-card flex flex-col h-[530px] cursor-pointer hover:border-[#efa83f]/70"
                    onClick={() => navigate(`/event/${ev.id}`)}
                  >
                    <div className="h-56 overflow-hidden relative bg-[#fae1b7]/20 flex items-center justify-center">
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
                        <div className="w-12 h-12 rounded-2xl bg-[#efa83f]/20 border border-[#efa83f]/40 flex items-center justify-center mb-1">
                          <Calendar className="w-6 h-6 text-[#efa83f]" />
                        </div>
                        <span className="font-black text-xl text-[#fae1b7]">تواصل صحراء</span>
                        <span className="text-xs text-white/70">ورقلة • حوض سدراتة</span>
                      </div>

                      <div className={`absolute top-4 right-4 z-10 px-3.5 py-1.5 rounded-full text-xs font-black border shadow-sm ${getCategoryTheme(ev.category)}`}>
                        {getCategoryLabel(ev.category)}
                      </div>

                      <div className="absolute bottom-3 left-3 bg-[#301809]/80 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-black text-[#efa83f] border border-[#efa83f]/30">
                        تذكرة مجانية
                      </div>
                    </div>

                    <CardContent className="p-7 flex-1 flex flex-col">
                      <span className="text-xs font-black text-[#b87a29] mb-2 block">
                        تنظيم: {ev.associations?.name || 'جمعية معتمدة'}
                      </span>
                      <h3 className="text-xl font-black text-[#301809] group-hover:text-[#b87a29] transition-colors line-clamp-1 leading-tight mb-2.5">
                        {ev.title}
                      </h3>
                      <p className="text-[#723c11]/80 leading-relaxed line-clamp-3 text-sm font-medium mb-6 flex-1">
                        {ev.description || 'لا يوجد وصف متاح للفعالية حالياً. اضغط للاطلاع على التفاصيل ومكان الانعقاد.'}
                      </p>

                      <div className="pt-5 border-t border-[#dbc397]/40 flex flex-col gap-2.5 text-xs text-[#723c11] font-bold">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#efa83f]" />
                          <span>{ev.date}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-[#b87a29]" />
                            <span className="truncate max-w-[170px]">{ev.location}</span>
                          </div>
                          <span className="text-[#301809] bg-[#fae1b7] group-hover:bg-[#efa83f] group-hover:text-white transition-colors px-3 py-1.5 rounded-xl text-[11px] font-black border border-[#d4b174]/50">
                            احجز مقعدك
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer in Deep Espresso Luxury */}
      <footer className="bg-[#301809] text-white py-24 text-center relative overflow-hidden mt-24 border-t border-[#d4b174]/30">
        
        {/* Subtle Ambient Radial Lights */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-[#efa83f]/15 to-transparent filter blur-3xl pointer-events-none" />
        
        <div className="container mx-auto px-6 relative z-10 space-y-8">
          <div className="w-14 h-14 rounded-2xl bg-[#efa83f]/20 border border-[#efa83f]/40 flex items-center justify-center mx-auto text-[#efa83f] shadow-lg">
            <BookOpen className="w-7 h-7" />
          </div>

          <p className="text-2xl md:text-4xl font-serif italic max-w-3xl mx-auto text-[#fae1b7] leading-relaxed">
            "من ليس له ماضٍ، ليس له حاضر ولا مستقبل"
          </p>

          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-[#efa83f] to-transparent rounded-full mx-auto" />
          
          <div className="flex flex-wrap justify-center gap-6 text-sm font-bold text-[#fae1b7]/80">
            <a href="#hero" className="hover:text-[#efa83f] transition-colors">الرئيسية</a>
            <a href="#events" className="hover:text-[#efa83f] transition-colors">الفعاليات</a>
            <button onClick={() => navigate('/heritage')} className="hover:text-[#efa83f] transition-colors">أرشيف سدراتة</button>
            <button onClick={() => setIsLoginOpen(true)} className="hover:text-[#efa83f] transition-colors">بوابة الجمعيات</button>
          </div>

          <p className="text-[#efa83f] font-black text-xs uppercase tracking-widest">
            Sahara Gather Connect • تواصل صحراء
          </p>
          <p className="text-xs text-[#fae1b7]/60 font-medium">
            © {new Date().getFullYear()} جميع الحقوق محفوظة لمنصة تواصل صحراء لورقلة وحوض سدراتة.
          </p>
        </div>
      </footer>

      {/* Login Dialog Harmonized with the Theme */}
      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogContent className="max-w-[480px] p-0 overflow-hidden rounded-[2.5rem] border border-[#dbc397]/50 bg-[#fdfbf7] shadow-2xl animate-in zoom-in-95 duration-200">
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
              className={`flex-1 py-5 text-center text-base font-black transition-colors ${
                loginTab === 'attendee' 
                  ? 'bg-[#fae1b7]/70 text-[#723c11] border-b-4 border-[#efa83f]' 
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
              className={`flex-1 py-5 text-center text-base font-black transition-colors ${
                loginTab === 'admin' 
                  ? 'bg-[#301809] text-[#fae1b7] border-b-4 border-[#efa83f]' 
                  : 'bg-white/50 text-[#723c11]/50 border-b border-transparent hover:text-[#723c11]'
              }`}
            >
              جمعية / مسؤول 🏢
            </button>
          </div>

          <div className="p-8 space-y-6 text-right">
            <div className="text-center space-y-1.5">
              <h3 className={`text-2xl font-black ${loginTab === 'admin' ? 'text-[#301809]' : 'text-[#723c11]'}`}>
                {loginTab === 'admin' ? 'بوابة المسؤولين والجمعيات' : (isSignUp ? 'إنشاء حساب جديد' : 'تسجيل دخول المشاركين')}
              </h3>
              <p className="text-xs text-[#723c11]/70 font-bold">
                {loginTab === 'admin' 
                  ? 'تسجيل الدخول للمشرفين ومديري الجمعيات المعتمدة' 
                  : 'استكشف الفعاليات، احجز تذاكرك وتفاعل مع مجتمعك'}
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              
              {/* Name (Sign Up only) */}
              {loginTab === 'attendee' && isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="font-bold text-[#301809] text-xs">الاسم واللقب</Label>
                  <div className="relative">
                    <Input 
                      id="signup-name"
                      type="text" 
                      placeholder="الاسم الكامل" 
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      required
                      className="pr-10 h-12 rounded-xl border-[#dbc397] focus-visible:ring-[#efa83f]"
                    />
                    <User className="absolute right-3 top-3.5 w-5 h-5 text-[#b87a29]" />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="login-email" className="font-bold text-[#301809] text-xs">البريد الإلكتروني</Label>
                <div className="relative">
                  <Input 
                    id="login-email"
                    type="email" 
                    placeholder="example@mail.com" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    dir="ltr"
                    className="pr-10 h-12 rounded-xl border-[#dbc397] focus-visible:ring-[#efa83f]"
                  />
                  <Mail className="absolute right-3 top-3.5 w-5 h-5 text-[#b87a29]" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="login-pass" className="font-bold text-[#301809] text-xs">كلمة المرور</Label>
                <div className="relative">
                  <Input 
                    id="login-pass"
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    dir="ltr"
                    className="pr-10 h-12 rounded-xl border-[#dbc397] focus-visible:ring-[#efa83f]"
                  />
                  <Lock className="absolute right-3 top-3.5 w-5 h-5 text-[#b87a29]" />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={authLoading}
                className={`w-full h-14 text-base font-black rounded-2xl gap-2 mt-4 shadow-lg transition-all hover:scale-102 ${
                  loginTab === 'admin' 
                    ? 'bg-[#301809] hover:bg-[#4a2711] text-white shadow-[#301809]/20' 
                    : 'bg-gradient-to-r from-[#efa83f] to-[#b87a29] text-white shadow-glow-amber'
                }`}
              >
                {authLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-white" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>{isSignUp ? 'تأكيد إنشاء الحساب' : 'تسجيل الدخول'}</span>
                  </>
                )}
              </Button>

              {/* SignUp/SignIn toggle for attendees */}
              {loginTab === 'attendee' && (
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="w-full text-center text-xs text-[#b87a29] font-black hover:underline pt-2 block"
                >
                  {isSignUp ? 'لديك حساب بالفعل؟ سجل دخولك الآن' : 'ليس لديك حساب؟ سجل حساباً جديداً'}
                </button>
              )}
            </form>

            {/* Quick Demo access for attendees */}
            {loginTab === 'attendee' && !isSignUp && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center before:mt-0.5 before:flex-1 before:border-t before:border-[#dbc397]/50 after:mt-0.5 after:flex-1 after:border-t after:border-[#dbc397]/50">
                  <span className="mx-3 text-[10px] font-black text-[#723c11]/60">أو تصفح سريع</span>
                </div>
                
                <Button 
                  onClick={handleDemoLogin}
                  disabled={demoLoading}
                  variant="outline"
                  className="w-full h-12 rounded-xl text-[#301809] hover:bg-[#fae1b7]/40 border-[#d4b174] gap-2 font-bold"
                >
                  {demoLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'دخول تجريبي سريع كـ زائر ⚡'}
                </Button>
              </div>
            )}

          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
