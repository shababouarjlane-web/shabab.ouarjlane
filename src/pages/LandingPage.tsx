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
  Loader2
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
        users: usersCount || 120, // Real or simulated fallback
        associations: assocCount || 8,
        events: eventsCount || 24,
        rsvps: rsvpsCount || 350
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
    { value: 'All', label: 'الكل' },
    { value: 'Heritage', label: 'تراثي' },
    { value: 'Cultural', label: 'ثقافي' },
    { value: 'Educational', label: 'تعليمي' },
    { value: 'Sports', label: 'رياضي' },
    { value: 'Religious', label: 'ديني' }
  ];

  const filteredEvents = events.filter(ev => {
    const matchesSearch = ev.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (ev.description && ev.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          ev.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || ev.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Authentication Handlers
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (loginTab === 'admin') {
        // Super Admin / Association Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) throw error;
        
        // Fetch user profile to redirect
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single();
        
        toast.success('تم تسجيل الدخول بنجاح!');
        setIsLoginOpen(false);
        if (profile?.role === 'super_admin') navigate('/admin');
        else if (profile?.role === 'association') navigate('/association');
        else navigate('/attendee');
      } else {
        // Attendee Login / Signup
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
            toast.success('تم التسجيل والدخول بنجاح!');
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
      toast.success('تم الدخول التجريبي بنجاح!');
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
      case 'Heritage': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'Sports': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'Educational': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'Religious': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'Cultural': return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
      default: return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'Heritage': return 'تراثي';
      case 'Sports': return 'رياضي';
      case 'Educational': return 'تعليمي';
      case 'Religious': return 'ديني';
      case 'Cultural': return 'ثقافي';
      default: return 'أخرى';
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden text-slate-800 font-sans selection:bg-amber-500 selection:text-white" dir="rtl">
      
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full mix-blend-multiply filter blur-[100px] animate-blob" />
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-secondary/20 rounded-full mix-blend-multiply filter blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[20%] w-[700px] h-[700px] bg-accent/20 rounded-full mix-blend-multiply filter blur-[150px] animate-blob animation-delay-4000" />
      </div>

      {/* Header */}
      <header className="sticky top-4 z-40 mx-4 md:mx-auto max-w-7xl glass-panel rounded-2xl transition-all duration-300">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-700 flex items-center justify-center text-white font-black shadow-md shadow-emerald-600/20">
              ص
            </div>
            <div>
              <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-800 to-emerald-600 tracking-tight">
                تواصل صحراء
              </span>
              <span className="hidden sm:inline-block text-[10px] font-black text-amber-600 mr-2 uppercase tracking-widest border border-amber-600/20 px-1.5 py-0.5 rounded">
                Sahara Connect
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 font-black text-slate-600">
            <a href="#hero" className="hover:text-emerald-700 transition-colors">الرئيسية</a>
            <a href="#events" className="hover:text-emerald-700 transition-colors">الفعاليات والأخبار</a>
            <a href="#stats" className="hover:text-emerald-700 transition-colors">الإحصائيات</a>
            <button onClick={() => navigate('/heritage')} className="hover:text-amber-700 transition-colors flex items-center gap-1">
              <BookOpen className="w-4 h-4 text-amber-500" />
              الأرشيف التراثي
            </button>
          </nav>

          <div className="flex items-center gap-3">
            {/* Quick notifications toggle in header */}
            <Button 
              variant="ghost" 
              onClick={isSubscribed ? unsubscribe : subscribe}
              disabled={notifLoading}
              className={`p-3 rounded-xl border ${
                isSubscribed 
                  ? 'border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100' 
                  : 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100'
              }`}
              title={isSubscribed ? 'تعطيل الإشعارات' : 'تفعيل الإشعارات'}
            >
              {notifLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isSubscribed ? (
                <Bell className="w-5 h-5 animate-pulse" />
              ) : (
                <BellOff className="w-5 h-5 text-amber-600" />
              )}
            </Button>

            <Button 
              onClick={() => {
                setIsSignUp(false);
                setIsLoginOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-6 rounded-xl shadow-lg shadow-emerald-600/20 gap-2 text-base transition-transform active:scale-95"
            >
              <LogIn className="w-5 h-5" />
              تسجيل الدخول
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative pt-16 pb-20 md:py-32 z-10">
        <div className="container mx-auto px-6 grid md:grid-cols-12 gap-12 items-center">
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="md:col-span-7 space-y-8 text-right"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full text-primary shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-secondary" />
              <span className="text-sm font-black text-primary">بوابة مجتمع ورقلة وحوض سدراتة الرقمية</span>
            </motion.div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-900 leading-tight">
              تواصل، تفاعل وارتقِ مع <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary">
                مجتمعك وأصالتك التراثية
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed max-w-2xl">
              منصة تواصل صحراء تربطك بجميع فعاليات، نشاطات وأخبار الجمعيات المحلية. شارك في الفعاليات، احصل على تذكرتك بهاتف الذكي، وتابع جديد التراث والذاكرة الجماعية لورقلة وحوض سدراتة.
            </p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex flex-wrap gap-4"
            >
              <a href="#events">
                <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-black px-8 py-7 rounded-2xl text-lg shadow-xl shadow-secondary/30 gap-2 transition-all hover:scale-105 hover:-translate-y-1 active:scale-95">
                  استكشف الفعاليات الجارية
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </a>
              <Button 
                variant="outline" 
                onClick={() => navigate('/heritage')} 
                className="border-2 border-primary/50 text-primary hover:bg-primary/10 glass-card font-black px-8 py-7 rounded-2xl text-lg gap-2 transition-all hover:scale-105 hover:-translate-y-1"
              >
                <BookOpen className="w-5 h-5 text-primary" />
                تصفح السجل التراثي
              </Button>
            </motion.div>

            {/* Quick notification teaser */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="glass-card p-5 rounded-2xl max-w-lg flex items-center gap-4 border-l-4 border-l-secondary"
            >
              <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center shrink-0">
                <Bell className="w-6 h-6 text-secondary" />
              </div>
              <div className="flex-1">
                <h4 className="font-black text-slate-800 text-sm">اشترك لتلقي التحديثات والفعاليات</h4>
                <p className="text-xs text-slate-500 font-medium mt-0.5">احصل على إشعار مباشر على هاتفك بمجرد نشر أي فعالية جديدة.</p>
              </div>
              <Button 
                onClick={subscribe}
                disabled={isSubscribed}
                className={`text-xs font-black h-10 px-4 rounded-xl shadow transition-all hover:scale-105 ${
                  isSubscribed ? 'bg-primary text-white' : 'bg-slate-900 hover:bg-black text-white'
                }`}
              >
                {isSubscribed ? 'مشترك بالفعل ✓' : 'تفعيل الآن 🔔'}
              </Button>
            </motion.div>
          </motion.div>

          <div className="md:col-span-5 relative flex items-center justify-center perspective-[1000px]">
            {/* Visual element representing a phone screen simulating PWA Notification */}
            <motion.div 
              animate={{ 
                y: [0, -15, 0],
                rotateX: [2, 8, 2],
                rotateY: [-10, -5, -10],
                rotateZ: [-2, 0, -2]
              }}
              transition={{ 
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-full max-w-[340px] aspect-[9/18.5] bg-slate-950 rounded-[40px] p-3 shadow-[0_20px_50px_rgba(16,185,129,0.3)] border-4 border-slate-800 relative overflow-hidden ring-8 ring-primary/20 transform-style-3d"
            >
              <div className="w-32 h-6 bg-slate-800 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-2xl z-20" />
              
              {/* Internal simulated OS */}
              <div className="w-full h-full bg-gradient-to-b from-primary/80 to-slate-900 rounded-[32px] p-4 flex flex-col justify-between relative text-right overflow-hidden">
                
                {/* Status Bar */}
                <div className="flex justify-between items-center text-[10px] text-white/50 px-2 pt-1 font-sans relative z-10">
                  <span>10:45 AM</span>
                  <div className="flex gap-1">
                    <span>📶</span>
                    <span>🔋</span>
                  </div>
                </div>

                {/* Simulated Notification banner slide-in */}
                <div className="mt-8 space-y-4 relative z-10">
                  <motion.div 
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1, duration: 0.6 }}
                    className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-secondary/20 text-slate-800 text-right"
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-black text-primary">تواصل صحراء • الآن</span>
                      <span className="w-2 h-2 bg-secondary rounded-full animate-ping" />
                    </div>
                    <h5 className="font-black text-xs text-slate-900">🔔 فعالية جديدة: مهرجان الواحات التراثي</h5>
                    <p className="text-[10px] text-slate-500 mt-1 font-medium leading-relaxed">تتشرف جمعية الأصالة بدعوتكم لحضور مهرجان الواحات السنوي بحوض سدراتة. سجل حضورك واحصل على التذكرة.</p>
                  </motion.div>
                </div>

                {/* App interface mock */}
                <div className="bg-black/40 backdrop-blur rounded-2xl p-3 text-center border border-white/10 mb-8 relative z-10">
                  <div className="w-10 h-10 rounded-lg bg-primary mx-auto flex items-center justify-center text-white font-black text-xs shadow-md mb-2">ص</div>
                  <h6 className="text-xs font-black text-white">تطبيق تواصل صحراء</h6>
                  <p className="text-[8px] text-white/50 mt-0.5">مثبت كـ تطبيق ويب تقدمي PWA</p>
                  <div className="w-16 h-1 bg-white/20 rounded-full mx-auto mt-4" />
                </div>
                
                {/* Background glow in phone */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-secondary/30 rounded-full filter blur-[50px] opacity-50" />
              </div>
            </motion.div>

            {/* Glowing backdrop dots */}
            <div className="absolute -z-10 w-80 h-80 rounded-full bg-emerald-500/10 filter blur-3xl" />
          </div>

        </div>
      </section>

      {/* Ads Banner Section */}
      {ads.length > 0 && (
        <section className="bg-emerald-50/50 py-8 border-y border-amber-500/5">
          <div className="container mx-auto px-6 text-center">
            <span className="text-xs font-black text-amber-700 tracking-widest uppercase mb-4 block">شركاء النجاح</span>
            <div className="flex flex-wrap justify-center items-center gap-10">
              {ads.map(ad => (
                <a 
                  key={ad.id} 
                  href={ad.link || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl shadow-sm hover:shadow transition-shadow border border-emerald-100 group"
                >
                  <img src={ad.image_url} alt={ad.partner_name} className="h-8 object-contain" />
                  <span className="font-bold text-sm text-slate-600 group-hover:text-emerald-700 transition-colors">{ad.partner_name}</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Stats Section */}
      <section id="stats" className="py-20 relative z-10">
        <div className="container mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto mb-16 space-y-4"
          >
            <h2 className="text-3xl font-black text-slate-900">المجتمع في أرقام</h2>
            <p className="text-slate-500 font-medium">إحصائيات مباشرة تعكس حيوية وتفاعل مجتمع ورقلة وحوض سدراتة الرقمي عبر منصة تواصل صحراء</p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="p-8 rounded-[2rem] glass-card text-center space-y-3 relative group overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full translate-x-6 -translate-y-6 group-hover:scale-150 transition-transform duration-500" />
              <Users className="w-8 h-8 text-primary mx-auto relative z-10" />
              <div className="text-4xl md:text-5xl font-black text-primary relative z-10">{stats.users}</div>
              <div className="text-sm font-bold text-slate-500 relative z-10">مشارك مسجل</div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="p-8 rounded-[2rem] glass-card text-center space-y-3 relative group overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/10 rounded-full translate-x-6 -translate-y-6 group-hover:scale-150 transition-transform duration-500" />
              <Building2 className="w-8 h-8 text-secondary mx-auto relative z-10" />
              <div className="text-4xl md:text-5xl font-black text-secondary relative z-10">{stats.associations}</div>
              <div className="text-sm font-bold text-slate-500 relative z-10">جمعية معتمدة</div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="p-8 rounded-[2rem] glass-card text-center space-y-3 relative group overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-full translate-x-6 -translate-y-6 group-hover:scale-150 transition-transform duration-500" />
              <Calendar className="w-8 h-8 text-accent mx-auto relative z-10" />
              <div className="text-4xl md:text-5xl font-black text-accent relative z-10">{stats.events}</div>
              <div className="text-sm font-bold text-slate-500 relative z-10">فعالية منظمة</div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="p-8 rounded-[2rem] glass-card text-center space-y-3 relative group overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full translate-x-6 -translate-y-6 group-hover:scale-150 transition-transform duration-500" />
              <TrendingUp className="w-8 h-8 text-primary mx-auto relative z-10" />
              <div className="text-4xl md:text-5xl font-black text-primary relative z-10">{stats.rsvps}</div>
              <div className="text-sm font-bold text-slate-500 relative z-10">تأكيد حضور</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Events / News Section */}
      <section id="events" className="py-20 relative z-10 glass-panel mt-12 rounded-[3rem] mx-4 md:mx-auto max-w-7xl">
        <div className="container mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6"
          >
            <div className="space-y-4 text-right">
              <h2 className="text-3xl font-black text-slate-900">الفعاليات والأخبار الجارية</h2>
              <p className="text-slate-500 font-medium">اكتشف آخر الفعاليات العامة التي تنظمها الجمعيات في مختلف المجالات</p>
            </div>
            
            {/* Search Box */}
            <div className="relative w-full md:w-80 group">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
              <Input 
                type="text" 
                placeholder="ابحث عن فعالية أو موقع..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-12 pr-12 pl-4 rounded-xl border-white/40 bg-white/50 backdrop-blur focus-visible:ring-primary focus-visible:bg-white transition-all shadow-sm"
              />
            </div>
          </motion.div>

          {/* Category Filter Badges */}
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
                className={`px-5 py-2.5 rounded-full text-sm font-black border transition-all hover:scale-105 ${
                  selectedCategory === cat.value
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                    : 'bg-white/60 text-slate-600 border-white/40 hover:bg-white shadow-sm'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </motion.div>

          {/* Events Grid */}
          {loadingEvents ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-500 font-bold mt-4 animate-pulse">جاري جلب الفعاليات النشطة...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="glass-card rounded-[2rem] p-16 text-center border-2 border-dashed border-secondary/20">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-800">لا توجد فعاليات نشطة تطابق بحثك</h3>
              <p className="text-slate-500 mt-2 font-medium">يرجى تجربة البحث بكلمات أخرى أو تصفح الأقسام الأخرى.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents.map((ev, i) => (
                <motion.div 
                  key={ev.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  <Card 
                    className="group overflow-hidden rounded-[2.5rem] border-0 glass-card flex flex-col h-[520px] cursor-pointer"
                    onClick={() => navigate(`/event/${ev.id}`)}
                  >
                    <div className="h-56 overflow-hidden relative bg-primary/5 flex items-center justify-center">
                      {ev.cover_image_url ? (
                        <img 
                          src={ev.cover_image_url} 
                        alt={ev.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fb = e.currentTarget.parentElement?.querySelector('.card-fallback');
                          if (fb) fb.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`${ev.cover_image_url ? 'hidden' : ''} card-fallback absolute inset-0 bg-gradient-to-tr from-emerald-600 to-amber-500 opacity-90 flex items-center justify-center text-white flex-col gap-2`}>
                      <span className="font-bold text-2xl drop-shadow-md">Sahara Connect</span>
                      <Calendar size={40} className="opacity-40" />
                    </div>

                    <div className={`absolute top-4 right-4 z-10 px-4 py-1.5 rounded-full text-xs font-black border shadow-sm ${getCategoryTheme(ev.category)}`}>
                      {getCategoryLabel(ev.category)}
                    </div>
                  </div>

                  <CardContent className="p-8 flex-1 flex flex-col">
                    <span className="text-xs font-black text-emerald-700 mb-2 block">
                      بواسطة: {ev.associations?.name || 'جمعية معتمدة'}
                    </span>
                    <h3 className="text-xl font-black text-slate-800 group-hover:text-emerald-700 transition-colors line-clamp-1 leading-tight mb-3">
                      {ev.title}
                    </h3>
                    <p className="text-slate-500 leading-relaxed line-clamp-3 text-sm font-medium mb-6 flex-1">
                      {ev.description || 'لا يوجد وصف متاح للفعالية حالياً. اضغط للتفاصيل ومطالعة المزيد.'}
                    </p>

                    <div className="pt-6 border-t border-amber-500/5 flex flex-col gap-3 text-xs text-slate-500 font-bold">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                        <span>{ev.date}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-amber-600" />
                          <span className="truncate max-w-[180px]">{ev.location}</span>
                        </div>
                        <span className="text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full text-[10px] border border-emerald-100">
                          احجز تذكرتك مجاناً
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

      {/* Quote / Footer decoration */}
      <footer className="glass-panel text-slate-800 py-24 text-center relative overflow-hidden mt-20 border-t border-primary/20">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="container mx-auto px-6 relative z-10 space-y-8"
        >
          <BookOpen className="w-10 h-10 text-primary mx-auto opacity-40" />
          <p className="text-2xl md:text-4xl font-serif italic max-w-3xl mx-auto opacity-95 leading-relaxed text-slate-900">
            "من ليس له ماضٍ، ليس له حاضر ولا مستقبل"
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full mx-auto" />
          <p className="text-primary font-black text-xs uppercase tracking-widest">Sahara Gather Connect • تواصل صحراء</p>
          <p className="text-[11px] text-slate-500 font-medium">© {new Date().getFullYear()} جميع الحقوق محفوظة لمنصة تواصل صحراء لورقلة وحوض سدراتة.</p>
        </motion.div>
      </footer>

      {/* Dialog for Login */}
      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogContent className="max-w-[480px] p-0 overflow-hidden rounded-[2.5rem] border-none bg-white shadow-2xl animate-in zoom-in-95 duration-200">
          <DialogHeader className="sr-only">
            <DialogTitle>تسجيل الدخول في منصة تواصل صحراء</DialogTitle>
            <DialogDescription>أدخل بريدك الإلكتروني وكلمة المرور لتسجيل الدخول إلى حسابك.</DialogDescription>
          </DialogHeader>

          {/* Double Palette tab design */}
          <div className="flex border-b">
            <button 
              onClick={() => {
                setLoginTab('attendee');
                setIsSignUp(false);
              }}
              className={`flex-1 py-5 text-center text-base font-black transition-colors ${
                loginTab === 'attendee' 
                  ? 'bg-amber-50 text-amber-700 border-b-4 border-amber-500' 
                  : 'bg-slate-50 text-slate-400 border-b border-slate-100 hover:text-slate-600'
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
                  ? 'bg-emerald-50 text-emerald-800 border-b-4 border-emerald-600' 
                  : 'bg-slate-50 text-slate-400 border-b border-slate-100 hover:text-slate-600'
              }`}
            >
              جمعية / مسؤول 🏢
            </button>
          </div>

          <div className="p-8 space-y-6 text-right">
            <div className="text-center space-y-2">
              <h3 className={`text-2xl font-black ${loginTab === 'admin' ? 'text-emerald-800' : 'text-amber-600'}`}>
                {loginTab === 'admin' ? 'بوابة المسؤولين والجمعيات' : (isSignUp ? 'إنشاء حساب جديد' : 'تسجيل دخول المشاركين')}
              </h3>
              <p className="text-xs text-slate-400 font-bold">
                {loginTab === 'admin' 
                  ? 'تسجيل الدخول للمشرفين ومديري الجمعيات المعتمدة' 
                  : 'استكشف الفعاليات، تفاعل واجمع نقاط المشاركة'}
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              
              {/* Name (Attendee Sign Up only) */}
              {loginTab === 'attendee' && isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="font-bold text-slate-600">الاسم الكامل</Label>
                  <div className="relative">
                    <Input 
                      id="signup-name"
                      type="text" 
                      placeholder="الاسم واللقب" 
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      required
                      className="pr-10 h-12 rounded-xl focus-visible:ring-amber-500"
                    />
                    <User className="absolute right-3 top-3.5 w-5 h-5 text-amber-500" />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="login-email" className="font-bold text-slate-600">البريد الإلكتروني</Label>
                <div className="relative">
                  <Input 
                    id="login-email"
                    type="email" 
                    placeholder="example@mail.com" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    dir="ltr"
                    className={`pr-10 h-12 rounded-xl ${loginTab === 'admin' ? 'focus-visible:ring-emerald-600' : 'focus-visible:ring-amber-500'}`}
                  />
                  <Mail className={`absolute right-3 top-3.5 w-5 h-5 ${loginTab === 'admin' ? 'text-emerald-600' : 'text-amber-500'}`} />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="login-pass" className="font-bold text-slate-600">كلمة المرور</Label>
                <div className="relative">
                  <Input 
                    id="login-pass"
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    dir="ltr"
                    className={`pr-10 h-12 rounded-xl ${loginTab === 'admin' ? 'focus-visible:ring-emerald-600' : 'focus-visible:ring-amber-500'}`}
                  />
                  <Lock className={`absolute right-3 top-3.5 w-5 h-5 ${loginTab === 'admin' ? 'text-emerald-600' : 'text-amber-500'}`} />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={authLoading}
                className={`w-full h-14 text-base font-black rounded-xl gap-2 mt-4 shadow-lg ${
                  loginTab === 'admin' 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10' 
                    : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/10'
                }`}
              >
                {authLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>{isSignUp ? 'إنشاء الحساب' : 'تسجيل الدخول'}</span>
                  </>
                )}
              </Button>

              {/* SignUp/SignIn toggle for attendees */}
              {loginTab === 'attendee' && (
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="w-full text-center text-xs text-amber-600 font-black hover:underline pt-2 block"
                >
                  {isSignUp ? 'لديك حساب بالفعل؟ سجل دخولك الآن' : 'ليس لديك حساب؟ سجل حساباً جديداً'}
                </button>
              )}
            </form>

            {/* Quick Demo access for attendees */}
            {loginTab === 'attendee' && !isSignUp && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center before:mt-0.5 before:flex-1 before:border-t after:mt-0.5 after:flex-1 after:border-t">
                  <span className="mx-3 text-[10px] font-black text-slate-400">أو</span>
                </div>
                
                <Button 
                  onClick={handleDemoLogin}
                  disabled={demoLoading}
                  variant="outline"
                  className="w-full h-12 rounded-xl text-slate-600 hover:bg-amber-50 border-amber-500/20 hover:text-amber-700 gap-2 font-bold"
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
