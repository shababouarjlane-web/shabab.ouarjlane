import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from '../hooks/use-toast';
import { QRCodeCanvas } from 'qrcode.react';
import { CSVLink } from 'react-csv';
import { MapPin, Calendar as CalendarIcon, Clock, Share2, Ticket, Users, Mail } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';

export default function EventDetails({ userRole: externalUserRole }: { userRole?: 'super_admin' | 'association' | 'attendee' | null }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [event, setEvent] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<'manager' | 'attendee' | 'guest'>(
    externalUserRole === 'super_admin' || externalUserRole === 'association' ? 'manager' : 
    externalUserRole === 'attendee' ? 'attendee' : 'guest'
  );
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [hasRsvpd, setHasRsvpd] = useState(false);
  
  const [guestEmail, setGuestEmail] = useState('');
  const [guestLoading, setGuestLoading] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      // Fetch Event
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*, associations(name, manager_id)')
        .eq('id', id)
        .single();

      if (eventError || !eventData) {
        toast({ variant: "destructive", title: "خطأ", description: "لم يتم العثور على الفعالية" });
        navigate('/');
        return;
      }
      setEvent(eventData);

      // Determine Role
      if (currentUser) {
        if (currentUser.id === eventData.associations?.manager_id) {
          setUserRole('manager');
          // Fetch RSVPs for manager
          const { data: rsvpData } = await supabase
            .from('rsvps')
            .select('*, users(email)')
            .eq('event_id', eventData.id)
            .eq('status', 'attending');
          
          setRsvps(rsvpData || []);
        } else {
          setUserRole('attendee');
          // Check if RSVP'd
          const { data: myRsvp } = await supabase
            .from('rsvps')
            .select('id')
            .eq('event_id', eventData.id)
            .eq('user_id', currentUser.id)
            .single();
          
          if (myRsvp) setHasRsvpd(true);
        }
      } else {
        setUserRole('guest');
      }

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRsvp = async () => {
    setRsvpLoading(true);
    try {
      const { error } = await supabase
        .from('rsvps')
        .insert({
          event_id: event.id,
          user_id: user.id,
          status: 'attending'
        });
      
      if (error) throw error;
      
      setHasRsvpd(true);
      toast({ title: "تم تأكيد الحضور!", description: "مبروك! حصلت على 10 نقاط جديدة."});
    } catch (error: any) {
      toast({ variant: "destructive", title: "خطأ", description: "لم نتمكن من تأكيد حجزك، قد تكون حجزت مسبقاً."});
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleGuestMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuestLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: guestEmail,
        options: {
          emailRedirectTo: window.location.href, // Redirect back to this event page
        },
      });
      if (error) throw error;
      toast({
        title: "تم إرسال الرابط السحري",
        description: "يرجى تفقد بريدك الإلكتروني لتسجيل الدخول السريع وتأكيد حضورك للفعالية.",
      });
      setGuestEmail('');
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل الإرسال. يرجى التأكد من صحة البريد." });
    } finally {
      setGuestLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "تم نسخ الرابط بنجاح" });
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-emerald-600 font-bold text-xl">جاري التحميل...</div>;
  if (!event) return null;

  // CSV Data format
  const csvData = rsvps.map(r => ({
    'البريد الإلكتروني': r.users?.email || 'N/A',
    'تاريخ التأكيد': new Date(r.created_at).toLocaleString('ar-DZ'),
    'الحالة': r.status === 'attending' ? 'مؤكد' : 'ملغى'
  }));

  return (
    <div className="min-h-screen bg-[#f9fafb] p-4 md:p-8" dir="rtl">
      
      {/* Back Nav */}
      <div className="container mx-auto max-w-5xl mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-500 hover:text-emerald-700">
          ← عودة
        </Button>
      </div>

      <div className="container mx-auto max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Cover Image */}
        <div className="h-64 md:h-96 w-full relative group bg-emerald-50 flex items-center justify-center overflow-hidden">
          {event.cover_image_url ? (
            <img 
              src={event.cover_image_url} 
              alt={event.title} 
              className="w-full h-full object-cover" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.parentElement?.querySelector('.event-cover-fallback');
                if (fallback) fallback.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`${event.cover_image_url ? 'hidden' : ''} event-cover-fallback absolute inset-0 bg-gradient-to-tr from-emerald-600 via-emerald-700 to-amber-500 flex items-center justify-center`}>
            <div className="text-center">
              <CalendarIcon size={120} className="text-white opacity-20 mx-auto" />
              <div className="mt-4 text-white/40 font-black text-4xl uppercase tracking-[0.5em] select-none">Sahara Connect</div>
            </div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/sandpaper.png')] opacity-10" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6 md:p-10">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-2 drop-shadow-lg">{event.title}</h1>
          </div>
        </div>

        <div className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8 text-gray-800">
            <div>
              <p className="text-emerald-700 font-bold text-lg mb-2">من تنظيم: {event.associations?.name}</p>
              <div className="flex flex-wrap gap-4 text-sm font-medium text-gray-500 border-b pb-6">
                <div className="flex items-center bg-gray-50 px-3 py-1.5 rounded-full"><CalendarIcon className="w-4 h-4 mr-2 text-emerald-500" /> {event.date}</div>
                <div className="flex items-center bg-gray-50 px-3 py-1.5 rounded-full"><Clock className="w-4 h-4 mr-2 text-amber-500" /> {event.start_time.substring(0,5)} - {event.end_time.substring(0,5)}</div>
                <div className="flex items-center bg-gray-50 px-3 py-1.5 rounded-full"><MapPin className="w-4 h-4 mr-2 text-blue-500" /> {event.location}</div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">عن الفعالية</h2>
              <div className="text-gray-600 leading-relaxed whitespace-pre-wrap text-lg">
                {event.description || 'لا يوجد وصف متاح.'}
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            
            {/* ACTION CARD BASED ON ROLE */}
            <Card className="shadow-lg border-emerald-100 bg-emerald-50/50">
              <CardContent className="p-6">
                
                {/* 1. MANAGER UI */}
                {userRole === 'manager' && (
                  <div className="text-center space-y-5">
                    <h3 className="text-lg font-bold text-emerald-800 border-b border-emerald-200 pb-3">إدارة الفعالية</h3>
                    
                    <div className="bg-white p-4 rounded-xl shadow-sm inline-block mx-auto border">
                      <QRCodeCanvas value={window.location.href} size={150} />
                    </div>
                    <p className="text-xs text-gray-500">امسح الكود ضوئياً أو شارك الرابط</p>
                    
                    <div className="flex flex-col gap-3 pt-2">
                      <Button onClick={copyLink} variant="outline" className="w-full text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                        <Share2 className="mr-2 h-4 w-4" />
                        نسخ رابط الفعالية
                      </Button>
                      
                      {rsvps.length > 0 && (
                        <CSVLink 
                          data={csvData} 
                          filename={`rsvps-${event.id}.csv`} 
                          className="w-full no-underline"
                          target="_blank"
                        >
                          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-12 rounded-xl">
                            <Users className="h-4 w-4" />
                            تصدير قائمة الحضور (CSV)
                          </Button>
                        </CSVLink>
                      )}
                      
                      <div className="mt-2 text-emerald-800 font-bold bg-emerald-100 py-2 rounded-lg">
                        إجمالي المسجلين: {rsvps.length}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. ATTENDEE UI */}
                {userRole === 'attendee' && (
                  <div className="text-center space-y-5">
                    {hasRsvpd ? (
                      <div className="bg-emerald-600 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-x-8 -translate-y-8" />
                        <Ticket className="w-12 h-12 mx-auto mb-3 opacity-90" />
                        <h3 className="text-xl font-bold mb-1">تذكرتك جاهزة!</h3>
                        <p className="text-emerald-100 text-sm mb-4">تم تأكيد حضورك</p>
                        
                        <div className="bg-white p-3 rounded-xl inline-block shadow-inner mt-2">
                          <QRCodeCanvas value={`valid_rsvp:${user.id}`} size={120} />
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">هل تود الحضور؟</h3>
                        <p className="text-gray-500 text-sm mb-6">سجل حضورك الآن لضمان مقعدك</p>
                        <Button 
                          onClick={handleRsvp} 
                          disabled={rsvpLoading}
                          className="w-full h-14 text-lg font-bold bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/30 text-white"
                        >
                          {rsvpLoading ? "جاري التسجيل..." : "أكد حضورك الآن"}
                        </Button>
                      </>
                    )}
                  </div>
                )}

                {/* 3. GUEST UI */}
                {userRole === 'guest' && (
                  <div className="text-center space-y-4">
                    <div className="bg-amber-100 p-3 rounded-full text-amber-600 w-16 h-16 flex items-center justify-center mx-auto mb-2">
                      <Ticket size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">سجل للحضور</h3>
                    <p className="text-gray-500 text-sm mb-6 leading-relaxed">أدخل بريدك الإلكتروني وسنرسل لك رابطاً سحرياً لتسجيل الدخول وحجز التذكرة فوراً</p>
                    
                    <form onSubmit={handleGuestMagicLink} className="space-y-3">
                      <div className="relative">
                        <Input 
                          type="email" 
                          placeholder="البريد الإلكتروني" 
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          required
                          dir="ltr"
                          className="pr-10 h-12 rounded-xl border-amber-200 focus-visible:ring-amber-500"
                        />
                        <Mail className="absolute right-3 top-3.5 h-5 w-5 text-amber-500" />
                      </div>
                      <Button 
                        type="submit" 
                        disabled={guestLoading}
                        className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-xl"
                      >
                        {guestLoading ? "جاري الإرسال..." : "أرسل رابط الدخول"}
                      </Button>
                    </form>
                  </div>
                )}

              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
