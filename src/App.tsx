import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import { supabase, type Profile } from './lib/supabase';
import { AnimatePresence } from 'framer-motion';
import PageTransition from './components/PageTransition';

// الصفحات
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import AssociationDashboard from './pages/association/AssociationDashboard';
import CreateEvent from './pages/association/CreateEvent';
import EditEvent from './pages/association/EditEvent';
import AttendeeDashboard from './pages/attendee/AttendeeDashboard';
import EventDetails from './pages/EventDetails';
import Heritage from './pages/Heritage';
import HeritageMap from './pages/HeritageMap';
import { useNotifications } from './hooks/useNotifications';

function AppRoutes({ session, profile, loading }: { session: any, profile: Profile | null, loading: boolean }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
        
        <Route path="/login" element={
          <PageTransition>
            {!session ? (
              <Login />
            ) : loading || !profile ? (
              <div className="h-screen flex flex-col items-center justify-center bg-white">
                <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h2 className="text-xl font-bold text-amber-700 animate-pulse">جاري تجهيز حسابك...</h2>
              </div>
            ) : (
              <Navigate to={
                profile.role === 'super_admin' ? '/admin' :
                  profile.role === 'association' ? '/association' : '/attendee'
              } replace />
            )}
          </PageTransition>
        } />

        <Route path="/heritage" element={<PageTransition><Heritage /></PageTransition>} />
        <Route path="/map" element={<PageTransition><HeritageMap /></PageTransition>} />
        <Route path="/event/:id" element={<PageTransition><EventDetails userRole={profile?.role || null} /></PageTransition>} />

        <Route path="/admin" element={session && profile?.role === 'super_admin' ? <PageTransition><AdminDashboard /></PageTransition> : (loading ? <div className="h-screen flex items-center justify-center font-bold text-emerald-600">جاري التحميل...</div> : <Navigate to="/" replace />)} />
        <Route path="/association" element={session && profile?.role === 'association' ? <PageTransition><AssociationDashboard /></PageTransition> : (loading ? <div className="h-screen flex items-center justify-center font-bold text-emerald-600">جاري التحميل...</div> : <Navigate to="/" replace />)} />
        <Route path="/association/create-event" element={session && profile?.role === 'association' ? <PageTransition><CreateEvent /></PageTransition> : (loading ? <div className="h-screen flex items-center justify-center font-bold text-emerald-600">جاري التحميل...</div> : <Navigate to="/" replace />)} />
        <Route path="/association/edit-event/:id" element={session && profile?.role === 'association' ? <PageTransition><EditEvent /></PageTransition> : (loading ? <div className="h-screen flex items-center justify-center font-bold text-emerald-600">جاري التحميل...</div> : <Navigate to="/" replace />)} />
        <Route path="/attendee" element={session && profile?.role === 'attendee' ? <PageTransition><AttendeeDashboard /></PageTransition> : (loading ? <div className="h-screen flex items-center justify-center font-bold text-emerald-600">جاري التحميل...</div> : <Navigate to="/" replace />)} />

        <Route path="*" element={<Navigate to={session ? (profile?.role === 'super_admin' ? '/admin' : profile?.role === 'association' ? '/association' : '/attendee') : '/'} replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize notifications globally
  useNotifications();

  useEffect(() => {
    const fetchProfile = async (userId: string, attempts = 3) => {
      setLoading(true);
      try {
        for (let i = 0; i < attempts; i++) {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          if (data) {
            setProfile(data);
            return;
          }

          if (i < attempts - 1) {
            console.log(`محاولة جلب البروفايل (${i + 1}/${attempts})...`);
            await new Promise(resolve => setTimeout(resolve, 1500)); // Wait 1.5s
          }
        }
        console.warn("لم يتم العثور على البروفايل بعد عدة محاولات.");
      } catch (err) {
        console.error("خطأ في جلب البروفايل:", err);
      } finally {
        setLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div dir="rtl">
      <Toaster />
      <SonnerToaster position="top-center" dir="rtl" richColors closeButton duration={15000} />
      <Router>
        <AppRoutes session={session} profile={profile} loading={loading} />
      </Router>
    </div>
  );
}