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
    <div className="flex min-h-screen w-full items-center justify-center p-4 bg-gradient-to-br from-[#fdfbf7] via-[#f5efe4] to-[#e8decb]">
      <div className="grid md:grid-cols-2 w-full max-w-6xl rounded-[2.5rem] overflow-hidden shadow-2xl bg-white min-h-[620px] border border-[#dbc397]/50">

        {/* Right Side (Visual Right in RTL) - Admins & Associations - Deep Espresso Palette */}
        <div className="p-8 md:p-12 flex flex-col justify-center bg-gradient-to-br from-[#301809] via-[#4a2711] to-[#723c11] text-white relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#efa83f]/20 rounded-full mix-blend-screen filter blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#b87a29]/20 rounded-full mix-blend-screen filter blur-3xl opacity-50 -translate-x-1/2 translate-y-1/2" />

          <div className="relative z-10 w-full max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-[#efa83f]/20 border border-[#efa83f]/40 flex items-center justify-center text-[#efa83f] font-black text-xl mb-4">
              ص
            </div>
            <h2 className="text-3xl font-black mb-2 text-[#fae1b7]">بوابة الإشراف</h2>
            <p className="text-[#fae1b7]/70 mb-8 font-medium">تسجيل الدخول للمسؤولين وممثلي الجمعيات</p>

            <form onSubmit={handleAdminAuth} className="space-y-5">
              <div className="space-y-2 text-right">
                <Label htmlFor="admin-email" className="text-[#fae1b7] text-xs font-bold">البريد الإلكتروني</Label>
                <div className="relative">
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@example.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                    className="bg-black/30 border-[#d4b174]/40 text-white placeholder:text-white/40 w-full pr-10 rounded-xl focus-visible:ring-[#efa83f]"
                    dir="ltr"
                  />
                  <Mail className="absolute right-3 top-3 h-4 w-4 text-[#efa83f]" />
                </div>
              </div>

              <div className="space-y-2 text-right">
                <Label htmlFor="admin-pass" className="text-[#fae1b7] text-xs font-bold">كلمة المرور</Label>
                <div className="relative">
                  <Input
                    id="admin-pass"
                    type="password"
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    className="bg-black/30 border-[#d4b174]/40 text-white placeholder:text-white/40 w-full pr-10 rounded-xl focus-visible:ring-[#efa83f]"
                    dir="ltr"
                  />
                  <Lock className="absolute right-3 top-3 h-4 w-4 text-[#efa83f]" />
                </div>
              </div>

              <Button
                type="submit"
                disabled={adminLoading}
                className="w-full bg-gradient-to-r from-[#b87a29] to-[#efa83f] hover:from-[#c98730] hover:to-[#f0b24d] text-[#301809] rounded-xl py-6 text-lg font-black shadow-glow-amber transition-all"
              >
                {adminLoading ? "جاري التحميل..." : "تسجيل الدخول"}
              </Button>
            </form>
          </div>
        </div>

        {/* Left Side (Visual Left in RTL) - Attendees & Guests - Warm Sand & Pop Sunset Amber */}
        <div className="p-8 md:p-12 flex flex-col justify-center bg-[#fdfbf7] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-72 h-72 bg-[#efa83f]/15 rounded-full mix-blend-multiply filter blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-[#fae1b7]/40 rounded-full mix-blend-multiply filter blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

          <div className="relative z-10 w-full max-w-sm mx-auto">
            <h1 className="text-4xl font-black text-[#301809] mb-2">تواصل صحراء</h1>
            <p className="text-[#723c11]/80 mb-8 font-medium">اكتشف الفعاليات، شارك وتواصل مع مجتمعك.</p>

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
                      <Label htmlFor="full-name" className="text-[#301809] font-bold text-xs">الاسم الكامل</Label>
                      <div className="relative">
                        <Input
                          id="full-name"
                          type="text"
                          placeholder="الاسم واللقب"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          className="bg-white border-[#dbc397] text-[#301809] focus-visible:ring-[#efa83f] w-full pr-10 rounded-xl"
                        />
                        <User className="absolute right-3 top-3 h-4 w-4 text-[#b87a29]" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 text-right">
                    <Label htmlFor="guest-email" className="text-[#301809] font-bold text-xs">البريد الإلكتروني</Label>
                    <div className="relative">
                      <Input
                        id="guest-email"
                        type="email"
                        placeholder="user@example.com"
                        value={attendeeEmail}
                        onChange={(e) => setAttendeeEmail(e.target.value)}
                        required
                        className="bg-white border-[#dbc397] text-[#301809] focus-visible:ring-[#efa83f] w-full pr-10 rounded-xl"
                        dir="ltr"
                      />
                      <Mail className="absolute right-3 top-3 h-4 w-4 text-[#b87a29]" />
                    </div>
                  </div>

                  <div className="space-y-2 text-right">
                    <Label htmlFor="attendee-pass" className="text-[#301809] font-bold text-xs">كلمة المرور</Label>
                    <div className="relative">
                      <Input
                        id="attendee-pass"
                        type="password"
                        placeholder="••••••••"
                        value={attendeePassword}
                        onChange={(e) => setAttendeePassword(e.target.value)}
                        required
                        className="bg-white border-[#dbc397] text-[#301809] focus-visible:ring-[#efa83f] w-full pr-10 rounded-xl"
                        dir="ltr"
                      />
                      <Lock className="absolute right-3 top-3 h-4 w-4 text-[#b87a29]" />
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              <Button
                type="submit"
                disabled={attendeeLoading}
                className="w-full bg-gradient-to-r from-[#efa83f] to-[#b87a29] hover:from-[#f0b24d] hover:to-[#854515] text-white rounded-xl py-6 text-lg font-black shadow-glow-amber transition-all"
              >
                {attendeeLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (isSignUp ? "إنشاء حساب" : "تسجيل الدخول")}
                {!attendeeLoading && <LogIn className="mr-2 h-5 w-5" />}
              </Button>

              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="w-full text-center text-sm text-[#b87a29] font-bold hover:underline py-2"
              >
                {isSignUp ? "لديك حساب بالفعل؟ تسجيل الدخول" : "ليس لديك حساب؟ إنشاء حساب جديد"}
              </button>
            </form>

            <div className="mt-8 flex items-center before:mt-0.5 before:flex-1 before:border-t before:border-[#dbc397]/50 after:mt-0.5 after:flex-1 after:border-t after:border-[#dbc397]/50">
              <p className="mx-4 mb-0 text-center font-bold text-[#723c11]/60 text-xs">أو</p>
            </div>

            <Button
              onClick={handleDemoLogin}
              variant="outline"
              disabled={demoLoading}
              className="w-full mt-6 rounded-xl py-6 text-base font-bold border-[#d4b174] text-[#723c11] hover:bg-[#fae1b7]/40 transition-all"
            >
              {demoLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "دخول تجريبي سريع كزائر ⚡"}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
