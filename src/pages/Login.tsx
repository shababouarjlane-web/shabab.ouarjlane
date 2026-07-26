import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useToast } from '../hooks/use-toast';
import { Mail, Lock, LogIn, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
  const { toast } = useToast();

  // Admin / Association State
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  // Attendee State
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [attendeePassword, setAttendeePassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [attendeeLoading, setAttendeeLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  // Handlers
  const handleAdminAuth = async (e: FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: adminEmail.trim().toLowerCase(),
        password: adminPassword,
      });
      if (error) throw error;
      // App.tsx auth observer will handle routing
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطأ في تسجيل الدخول",
        description: error.message || "الرقم السري أو البريد الإلكتروني غير صحيح",
      });
    } finally {
      setAdminLoading(false);
    }
  };

  const handleAttendeeAuth = async (e: FormEvent) => {
    e.preventDefault();
    setAttendeeLoading(true);
    try {
      if (isSignUp) {
        // Sign Up Flow
        const { data, error } = await supabase.auth.signUp({
          email: attendeeEmail.trim().toLowerCase(),
          password: attendeePassword,
          options: {
            data: { full_name: fullName }
          }
        });
        if (error) throw error;

        if (!data.session) {
          toast({
            title: "تنبيه: تأكيد البريد مطلوب",
            description: "تم إنشاء الحساب! يرجى مراجعة بريدك الإلكتروني لتأكيد التسجيل قبل الدخول.",
          });
        } else {
          toast({
            title: "تم إنشاء الحساب بنجاح!",
            description: "جاري تحويلك إلى لوحة التحكم...",
          });
        }
      } else {
        // Login Flow
        const { error } = await supabase.auth.signInWithPassword({
          email: attendeeEmail.trim().toLowerCase(),
          password: attendeePassword,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      let errorMessage = "فشل تسجيل الدخول، يرجى التحقق من بياناتك";
      
      if (error.message === "User already registered") {
        errorMessage = "هذا البريد الإلكتروني مسجل مسبقاً، يرجى تسجيل الدخول بدلاً من ذلك.";
      } else if (error.message === "Invalid login credentials") {
        errorMessage = "الرقم السري أو البريد الإلكتروني غير صحيح.";
      } else if (error.message === "Email not confirmed") {
        errorMessage = "يرجى تأكيد بريدك الإلكتروني أولاً.";
      }

      toast({
        variant: "destructive",
        title: "خطأ",
        description: errorMessage,
      });
    } finally {
      setAttendeeLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      // Supabase anonymous sign-in
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      // Will route to attendee mostly, assuming the trigger handles it or we assign temporary 'attendee' role
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "فشل الدخول التجريبي",
        description: error.message,
      });
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center p-4 bg-gradient-to-br from-[#fdfbf6] to-[#eae5dd]">
      <div className="grid md:grid-cols-2 w-full max-w-6xl rounded-[2rem] overflow-hidden shadow-2xl bg-white min-h-[600px]">

        {/* Right Side (Visual Right in RTL) - Admins & Associations - Green Palette */}
        <div className="p-8 md:p-12 flex flex-col justify-center bg-emerald-800 text-white relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-900 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-x-1/2 translate-y-1/2" />

          <div className="relative z-10 w-full max-w-sm mx-auto">
            <h2 className="text-3xl font-bold mb-2">إدارة المنصـة</h2>
            <p className="text-emerald-100 mb-8 opacity-80">تسجيل الدخول للمسؤولين والجمعيات</p>

            <form onSubmit={handleAdminAuth} className="space-y-5">
              <div className="space-y-2 text-right">
                <Label htmlFor="admin-email" className="text-emerald-50">البريد الإلكتروني</Label>
                <div className="relative">
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@example.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                    className="bg-emerald-900/50 border-emerald-700 text-white placeholder:text-emerald-300 w-full pr-10"
                    dir="ltr"
                  />
                  <Mail className="absolute right-3 top-3  h-4 w-4 text-emerald-400" />
                </div>
              </div>

              <div className="space-y-2 text-right">
                <Label htmlFor="admin-pass" className="text-emerald-50">كلمة المرور</Label>
                <div className="relative">
                  <Input
                    id="admin-pass"
                    type="password"
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    className="bg-emerald-900/50 border-emerald-700 text-white placeholder:text-emerald-300 w-full pr-10"
                    dir="ltr"
                  />
                  <Lock className="absolute right-3 top-3 h-4 w-4 text-emerald-400" />
                </div>
              </div>

              <Button
                type="submit"
                disabled={adminLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl py-6 text-lg font-bold shadow-lg shadow-emerald-500/30 transition-all"
              >
                {adminLoading ? "جاري التحميل..." : "تسجيل الدخول"}
              </Button>
            </form>
          </div>
        </div>

        {/* Left Side (Visual Left in RTL) - Attendees & Guests - Orange Palette */}
        <div className="p-8 md:p-12 flex flex-col justify-center bg-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-72 h-72 bg-amber-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 translate-x-1/2 translate-y-1/2" />

          <div className="relative z-10 w-full max-w-sm mx-auto">
            <h1 className="text-4xl font-extrabold text-amber-600 mb-2">تواصل صحراء</h1>
            <p className="text-gray-500 mb-8">اكتشف الفعاليات، شارك وتواصل مع مجتمعك.</p>

            <form onSubmit={handleAttendeeAuth} className="space-y-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={isSignUp ? 'signup' : 'login'}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {isSignUp && (
                    <div className="space-y-2 text-right">
                      <Label htmlFor="full-name" className="text-gray-700 font-semibold">الاسم الكامل</Label>
                      <div className="relative">
                        <Input
                          id="full-name"
                          type="text"
                          placeholder="الاسم واللقب"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          className="bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-amber-500 w-full pr-10 rounded-xl"
                        />
                        <User className="absolute right-3 top-3 h-4 w-4 text-amber-500" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 text-right">
                    <Label htmlFor="guest-email" className="text-gray-700 font-semibold">البريد الإلكتروني</Label>
                    <div className="relative">
                      <Input
                        id="guest-email"
                        type="email"
                        placeholder="user@example.com"
                        value={attendeeEmail}
                        onChange={(e) => setAttendeeEmail(e.target.value)}
                        required
                        className="bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-amber-500 w-full pr-10 rounded-xl"
                        dir="ltr"
                      />
                      <Mail className="absolute right-3 top-3 h-4 w-4 text-amber-500" />
                    </div>
                  </div>

                  <div className="space-y-2 text-right">
                    <Label htmlFor="attendee-pass" className="text-gray-700 font-semibold">كلمة المرور</Label>
                    <div className="relative">
                      <Input
                        id="attendee-pass"
                        type="password"
                        placeholder="••••••••"
                        value={attendeePassword}
                        onChange={(e) => setAttendeePassword(e.target.value)}
                        required
                        className="bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-amber-500 w-full pr-10 rounded-xl"
                        dir="ltr"
                      />
                      <Lock className="absolute right-3 top-3 h-4 w-4 text-amber-500" />
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              <Button
                type="submit"
                disabled={attendeeLoading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-xl py-6 text-lg font-bold shadow-lg shadow-amber-500/20 transition-all font-outfit"
              >
                {attendeeLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (isSignUp ? "إنشاء حساب" : "تسجيل الدخول")}
                {!attendeeLoading && <LogIn className="mr-2 h-5 w-5" />}
              </Button>

              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="w-full text-center text-sm text-amber-600 font-bold hover:underline py-2"
              >
                {isSignUp ? "لديك حساب بالفعل؟ تسجيل الدخول" : "ليس لديك حساب؟ إنشاء حساب جديد"}
              </button>
            </form>

            <div className="mt-8 flex items-center before:mt-0.5 before:flex-1 before:border-t before:border-gray-200 after:mt-0.5 after:flex-1 after:border-t after:border-gray-200">
              <p className="mx-4 mb-0 text-center font-semibold text-gray-400 text-sm">أو</p>
            </div>

            <Button
              onClick={handleDemoLogin}
              variant="outline"
              disabled={demoLoading}
              className="w-full mt-6 rounded-xl py-6 text-lg border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 transition-all"
            >
              {demoLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "دخول تجريبي سريع"}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
