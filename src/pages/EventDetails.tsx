import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { useToast } from '../hooks/use-toast';
import { CSVLink } from 'react-csv';
import {
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  Share2,
  Ticket,
  Users,
  Mail,
  Phone,
  User,
  Star,
  Image as ImageIcon,
  Plus,
  Trash2,
  Download,
  ArrowRight,
  Sparkles,
  Loader2,
  X,
  Heart,
  Navigation,
  Hourglass,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import TicketCard from '../components/TicketCard';
import {
  packUserContact,
  parseUserContact,
  parseGalleryAndReviews,
  packReviewItem,
  buildGoogleCalendarUrl,
  downloadEventIcs,
  buildWhatsAppShareUrl,
  calculateBadgeFromPoints,
  isEventFavorite,
  toggleFavoriteEvent,
  buildGoogleMapsDirectionsUrl,
  type EventReview
} from '../lib/helpers';

export default function EventDetails({ userRole: externalUserRole }: { userRole?: 'super_admin' | 'association' | 'attendee' | null }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [event, setEvent] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<'manager' | 'attendee' | 'guest'>(
    externalUserRole === 'super_admin' || externalUserRole === 'association' ? 'manager' :
    externalUserRole === 'attendee' ? 'attendee' : 'guest'
  );
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [waitlistRsvps, setWaitlistRsvps] = useState<any[]>([]);
  const [totalAttendingCount, setTotalAttendingCount] = useState<number>(0);
  const [totalWaitlistCount, setTotalWaitlistCount] = useState<number>(0);
  const [hasRsvpd, setHasRsvpd] = useState(false);
  const [isWaitlisted, setIsWaitlisted] = useState(false);
  const [waitlistPosition, setWaitlistPosition] = useState<number>(0);
  const [showTicket, setShowTicket] = useState(false);
  const [myRsvpId, setMyRsvpId] = useState<string | undefined>(undefined);
  const [isFav, setIsFav] = useState<boolean>(false);

  // Attendee Contact Info (Full Name & Phone)
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeePhone, setAttendeePhone] = useState('');
  const [savingContact, setSavingContact] = useState(false);

  // Guest Magic Link
  const [guestEmail, setGuestEmail] = useState('');
  const [guestLoading, setGuestLoading] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Reviews & Gallery State
  const [rating, setRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

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
        .select('*, associations(id, name, manager_id, description)')
        .eq('id', id)
        .single();

      if (eventError || !eventData) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'لم يتم العثور على الفعالية' });
        navigate('/');
        return;
      }
      setEvent(eventData);
      setIsFav(isEventFavorite(eventData.id));

      // Count total attending RSVPs
      const { count: attendingCount } = await supabase
        .from('rsvps')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventData.id)
        .eq('status', 'attending');

      setTotalAttendingCount(attendingCount || 0);

      // Fetch Waitlist RSVPs ordered by oldest first (FIFO queue)
      const { data: wlData } = await supabase
        .from('rsvps')
        .select('*, users(email, full_name)')
        .eq('event_id', eventData.id)
        .eq('status', 'waitlist')
        .order('created_at', { ascending: true });

      const wlList = wlData || [];
      setWaitlistRsvps(wlList);
      setTotalWaitlistCount(wlList.length);

      // Determine Role & Fetch User Profile
      if (currentUser) {
        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUser.id)
          .maybeSingle();

        setUserProfile(profileData);
        const parsed = parseUserContact(profileData?.full_name, currentUser.email);
        setAttendeeName(parsed.name);
        setAttendeePhone(parsed.phone);

        if (currentUser.id === eventData.associations?.manager_id || profileData?.role === 'super_admin') {
          setUserRole('manager');
          const { data: rsvpData } = await supabase
            .from('rsvps')
            .select('*, users(email, full_name)')
            .eq('event_id', eventData.id)
            .eq('status', 'attending');

          setRsvps(rsvpData || []);
        } else {
          setUserRole('attendee');
          const { data: myRsvp } = await supabase
            .from('rsvps')
            .select('id, status')
            .eq('event_id', eventData.id)
            .eq('user_id', currentUser.id)
            .maybeSingle();

          if (myRsvp && myRsvp.status === 'attending') {
            setHasRsvpd(true);
            setIsWaitlisted(false);
            setMyRsvpId(myRsvp.id);
          } else if (myRsvp && myRsvp.status === 'waitlist') {
            setHasRsvpd(false);
            setIsWaitlisted(true);
            setMyRsvpId(myRsvp.id);
            const idx = wlList.findIndex((w: any) => w.user_id === currentUser.id);
            setWaitlistPosition(idx >= 0 ? idx + 1 : wlList.length || 1);
          }
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

  const handleSaveContactInfo = async () => {
    if (!user) return;
    setSavingContact(true);
    try {
      const packed = packUserContact(attendeeName, attendeePhone);
      const { error } = await supabase
        .from('users')
        .update({ full_name: packed })
        .eq('id', user.id);
      if (error) throw error;
      toast({ title: 'تم تحديث بيانات التذكرة بنجاح ✓', description: 'سيظهر اسمك ورقم هاتفك في التذكرة وكشف الجمعية.' });
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'تعذر حفظ البيانات.' });
    } finally {
      setSavingContact(false);
    }
  };

  const handleToggleFavorite = () => {
    if (!event) return;
    const nextState = toggleFavoriteEvent(event.id);
    setIsFav(nextState);
    toast({
      title: nextState ? '❤️ تمت إضافة الفعالية إلى المفضلة' : 'تمت إزالة الفعالية من المفضلة',
      description: nextState ? 'يمكنك الرجوع إليها سريعاً من قسم المفضلة.' : undefined
    });
  };

  const handleRsvp = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'تنبيه', description: 'يرجى تسجيل الدخول أولاً لتأكيد الحجز.' });
      return;
    }

    if (!attendeeName.trim()) {
      toast({ variant: 'destructive', title: 'تنبيه', description: 'يرجى إدخال اسمك الكامل لإصدار التذكرة.' });
      return;
    }

    setRsvpLoading(true);
    try {
      const packedContact = packUserContact(attendeeName, attendeePhone);

      // 1. Check capacity before booking
      const maxCap = event.max_capacity || event.capacity;
      let shouldWaitlist = false;
      if (maxCap && maxCap > 0) {
        const { count, error: countErr } = await supabase
          .from('rsvps')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .eq('status', 'attending');

        if (!countErr && typeof count === 'number' && count >= maxCap) {
          shouldWaitlist = true;
        }
      }

      const targetStatus = shouldWaitlist ? 'waitlist' : 'attending';

      // 2. Check if already registered
      const { data: existing } = await supabase
        .from('rsvps')
        .select('id, status')
        .eq('event_id', event.id)
        .eq('user_id', user.id)
        .maybeSingle();

      let insertedId = existing?.id;
      let isNewBooking = false;

      if (existing) {
        if (existing.status === 'attending') {
          await supabase.from('users').update({ full_name: packedContact }).eq('id', user.id);
          setHasRsvpd(true);
          setIsWaitlisted(false);
          setMyRsvpId(existing.id);
          setShowTicket(true);
          toast({ title: 'أنت مسجل بالفعل! 🎟', description: 'تذكرتك جاهزة للعرض.' });
          setRsvpLoading(false);
          return;
        } else {
          const { error: updateErr } = await supabase
            .from('rsvps')
            .update({ status: targetStatus })
            .eq('id', existing.id);
          if (updateErr) throw updateErr;
          isNewBooking = true;
        }
      } else {
        const { data: insertedRsvp, error } = await supabase
          .from('rsvps')
          .insert({
            event_id: event.id,
            user_id: user.id,
            status: targetStatus
          })
          .select('id')
          .single();

        if (error) throw error;
        insertedId = insertedRsvp?.id;
        isNewBooking = true;
      }

      // 3. Update contact info & award points if confirmed
      const currentPoints = Number(userProfile?.points || 0);
      const updatedPoints = !shouldWaitlist && isNewBooking ? currentPoints + 10 : currentPoints;
      const updatedBadge = calculateBadgeFromPoints(updatedPoints);

      await supabase
        .from('users')
        .update({
          full_name: packedContact,
          points: updatedPoints,
          badge: updatedBadge
        })
        .eq('id', user.id);

      setUserProfile((prev: any) => ({ ...prev, full_name: packedContact, points: updatedPoints, badge: updatedBadge }));
      if (insertedId) setMyRsvpId(insertedId);

      if (shouldWaitlist) {
        setHasRsvpd(false);
        setIsWaitlisted(true);
        const newRank = totalWaitlistCount + 1;
        setTotalWaitlistCount(newRank);
        setWaitlistPosition(newRank);
        toast({
          title: `⏳ أنت في قائمة الانتظار الذكية (الترتيب #${newRank})`,
          description: 'اكتملت المقاعد حالياً، وسيتم ترقية حجزك تلقائياً إلى تذكرة مؤكدة فور شغور أي مقعد!'
        });
      } else {
        setHasRsvpd(true);
        setIsWaitlisted(false);
        setTotalAttendingCount(prev => prev + 1);
        setShowTicket(true);
        toast({ title: '🎟 تذكرتك جاهزة!', description: 'تم تأكيد حضورك وحصلت على +10 نقاط في رصيدك الشرفي.' });
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: error?.message || 'لم نتمكن من تأكيد حجزك، يرجى المحاولة لاحقاً.' });
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleCancelRsvp = async () => {
    const confirmMsg = isWaitlisted
      ? 'هل أنت متأكد من رغبتك في الانسحاب من قائمة الانتظار؟'
      : 'هل أنت متأكد من رغبتك في إلغاء حجز هذه التذكرة؟';
    if (!window.confirm(confirmMsg)) return;

    const wasAttending = hasRsvpd;
    setRsvpLoading(true);
    try {
      const { error } = await supabase
        .from('rsvps')
        .update({ status: 'cancelled' })
        .eq('event_id', event.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setHasRsvpd(false);
      setIsWaitlisted(false);
      setMyRsvpId(undefined);
      setShowTicket(false);

      if (wasAttending) {
        // Smart Waitlist Auto-Promotion: check oldest waitlisted user
        const { data: nextInLine } = await supabase
          .from('rsvps')
          .select('id, user_id')
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
          setTotalWaitlistCount(prev => Math.max(0, prev - 1));
          toast({
            title: 'تم إلغاء الحجز وترقية أول منتظر تلقائياً 🔄',
            description: 'تم منح مقعدك تلقائياً لأول مشارك في قائمة الانتظار الذكية.'
          });
        } else {
          setTotalAttendingCount(prev => Math.max(0, prev - 1));
          toast({ title: 'تم إلغاء الحجز بنجاح', description: 'تم إخلاء مقعدك وإتاحته لمشاركين آخرين.' });
        }
      } else {
        setTotalWaitlistCount(prev => Math.max(0, prev - 1));
        toast({ title: 'تم الانسحاب من قائمة الانتظار' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'تعذر إلغاء الحجز حالياً.' });
    } finally {
      setRsvpLoading(false);
    }
  };

  const handlePromoteWaitlistUser = async (waitlistRsvp: any) => {
    try {
      const { error } = await supabase
        .from('rsvps')
        .update({ status: 'attending' })
        .eq('id', waitlistRsvp.id);
      if (error) throw error;

      setWaitlistRsvps(prev => prev.filter(w => w.id !== waitlistRsvp.id));
      setTotalWaitlistCount(prev => Math.max(0, prev - 1));
      setRsvps(prev => [...prev, { ...waitlistRsvp, status: 'attending' }]);
      setTotalAttendingCount(prev => prev + 1);
      toast({
        title: 'تمت ترقية المشارك إلى مقعد مؤكد ✓',
        description: 'أصبحت تذكرته جاهزة وفعالة الآن.'
      });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'خطأ في الترقية', description: err.message });
    }
  };

  const handleGuestMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuestLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: guestEmail,
        options: {
          emailRedirectTo: window.location.href,
        },
      });
      if (error) throw error;
      toast({
        title: 'تم إرسال الرابط السحري ✨',
        description: 'يرجى تفقد بريدك الإلكتروني لتسجيل الدخول السريع وتأكيد حضورك للفعالية.',
      });
      setGuestEmail('');
    } catch {
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل الإرسال. يرجى التأكد من صحة البريد.' });
    } finally {
      setGuestLoading(false);
    }
  };

  // Upload Coverage Photo (Manager)
  const handleUploadCoveragePhoto = async (file?: File | null) => {
    if (!event) return;
    setUploadingPhoto(true);
    try {
      let finalUrl = newPhotoUrl.trim();
      if (file) {
        const ext = file.name.split('.').pop();
        const fileName = `coverage/${event.id}-${Math.random().toString(36).substring(7)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('events').upload(fileName, file);
        if (upErr) throw upErr;
        const { data: pubData } = supabase.storage.from('events').getPublicUrl(fileName);
        finalUrl = pubData.publicUrl;
      }

      if (!finalUrl) {
        setUploadingPhoto(false);
        return;
      }

      const currentGallery: string[] = Array.isArray(event.gallery_urls) ? event.gallery_urls : [];
      const updatedGallery = [...currentGallery, finalUrl];

      const { error } = await supabase
        .from('events')
        .update({ gallery_urls: updatedGallery })
        .eq('id', event.id);

      if (error) throw error;

      setEvent({ ...event, gallery_urls: updatedGallery });
      setNewPhotoUrl('');
      toast({ title: 'تمت إضافة صورة التغطية بنجاح 📸' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'خطأ في رفع الصورة', description: err.message });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemoveGalleryItem = async (targetUrl: string) => {
    if (!event) return;
    const currentGallery: string[] = Array.isArray(event.gallery_urls) ? event.gallery_urls : [];
    const updatedGallery = currentGallery.filter(u => u !== targetUrl);
    const { error } = await supabase
      .from('events')
      .update({ gallery_urls: updatedGallery })
      .eq('id', event.id);
    if (!error) {
      setEvent({ ...event, gallery_urls: updatedGallery });
      toast({ title: 'تم حذف الصورة من الألبوم' });
    }
  };

  // Submit Review & Rating
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: 'destructive', title: 'تنبيه', description: 'يرجى تسجيل الدخول لإضافة تقييمك.' });
      return;
    }
    if (!reviewComment.trim()) return;

    setSubmittingReview(true);
    try {
      const reviewObj: EventReview = {
        id: Math.random().toString(36).substring(2, 10),
        userId: user.id,
        userName: attendeeName || user.email?.split('@')[0] || 'مشارك',
        rating,
        comment: reviewComment.trim(),
        createdAt: new Date().toISOString()
      };

      const packed = packReviewItem(reviewObj);
      const currentGallery: string[] = Array.isArray(event.gallery_urls) ? event.gallery_urls : [];
      const updatedGallery = [...currentGallery, packed];

      const { error } = await supabase
        .from('events')
        .update({ gallery_urls: updatedGallery })
        .eq('id', event.id);

      if (error) throw error;

      // Award +5 points for reviewing
      const currentPoints = Number(userProfile?.points || 0);
      const updatedPoints = currentPoints + 5;
      await supabase
        .from('users')
        .update({ points: updatedPoints, badge: calculateBadgeFromPoints(updatedPoints) })
        .eq('id', user.id);

      setEvent({ ...event, gallery_urls: updatedGallery });
      setReviewComment('');
      toast({ title: 'شكراً لتقييمك! ⭐', description: 'تم نشر رأيك وحصلت على +5 نقاط إضافية.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: err.message || 'تعذر إرسال التقييم.' });
    } finally {
      setSubmittingReview(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: 'تم نسخ رابط الفعالية بنجاح 🔗' });
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#fdfbf7] gap-3" dir="rtl">
        <Loader2 className="w-10 h-10 animate-spin text-[#b87a29]" />
        <span className="text-[#723c11] font-bold text-base">جاري تحميل تفاصيل الفعالية...</span>
      </div>
    );
  }
  if (!event) return null;

  const { photos, reviews } = parseGalleryAndReviews(event.gallery_urls);
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + Number(r.rating || 5), 0) / reviews.length).toFixed(1)
    : null;

  const maxCap = event.max_capacity || event.capacity;

  // CSV Data format with Full Name & Phone Number
  const csvData = rsvps.map((r, idx) => {
    const contact = parseUserContact(r.users?.full_name, r.users?.email);
    return {
      '#': idx + 1,
      'الاسم الكامل': contact.name,
      'رقم الهاتف': contact.phone || 'غير مدرج',
      'البريد الإلكتروني': r.users?.email || 'N/A',
      'تاريخ التأكيد': new Date(r.created_at).toLocaleString('ar-DZ'),
      'الحالة': r.status === 'attending' ? 'مؤكد' : 'ملغى'
    };
  });

  return (
    <>
      <div className="min-h-screen bg-[#fdfbf7] text-[#301809] p-4 md:p-8 pb-20" dir="rtl">
        {/* Top Navigation & Share Strip */}
        <div className="container mx-auto max-w-5xl mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-[#723c11] hover:bg-[#fae1b7]/40 font-bold rounded-xl gap-2 cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة</span>
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={handleToggleFavorite}
              className={`rounded-xl text-xs font-bold h-9 px-3.5 gap-1.5 cursor-pointer transition-colors ${
                isFav
                  ? 'bg-rose-50 border-rose-300 text-rose-600 hover:bg-rose-100'
                  : 'border-[#dbc397] text-[#723c11] hover:bg-[#fae1b7]/40 bg-white'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : 'text-rose-500'}`} />
              <span>{isFav ? 'محفوظة في المفضلة' : 'حفظ الفعالية'}</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => window.open(buildGoogleCalendarUrl(event), '_blank')}
              className="border-[#dbc397] text-[#723c11] hover:bg-[#fae1b7]/40 rounded-xl text-xs font-bold h-9 px-3 gap-1.5 cursor-pointer bg-white"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-[#b87a29]" />
              <span>أضف لتقويم Google</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => downloadEventIcs(event)}
              className="border-[#dbc397] text-[#723c11] hover:bg-[#fae1b7]/40 rounded-xl text-xs font-bold h-9 px-3 gap-1.5 cursor-pointer bg-white"
            >
              <Download className="w-3.5 h-3.5 text-[#b87a29]" />
              <span>تقويم الهاتف (.ics)</span>
            </Button>

            <Button
              onClick={() => window.open(buildWhatsAppShareUrl(event, window.location.href), '_blank')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold h-9 px-3.5 gap-1.5 cursor-pointer shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>مشاركة واتساب</span>
            </Button>
          </div>
        </div>

        <div className="container mx-auto max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-[#dbc397]/70">
          {/* Cover Image */}
          <div className="h-64 md:h-96 w-full relative group bg-[#301809] flex items-center justify-center overflow-hidden">
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
            <div className={`${event.cover_image_url ? 'hidden' : ''} event-cover-fallback absolute inset-0 bg-gradient-to-tr from-[#301809] via-[#723c11] to-[#b87a29] flex items-center justify-center`}>
              <div className="text-center">
                <CalendarIcon size={110} className="text-[#fae1b7] opacity-20 mx-auto" />
                <div className="mt-4 text-[#fae1b7]/40 font-black text-3xl md:text-4xl uppercase tracking-[0.4em] select-none">
                  تواصل صحراء
                </div>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#1e0f04]/95 via-black/30 to-transparent flex flex-col justify-end p-6 md:p-10">
              {avgRating && (
                <div className="inline-flex items-center gap-1.5 bg-[#efa83f] text-[#301809] px-3 py-1 rounded-full text-xs font-black w-fit mb-3 shadow-md">
                  <Star className="w-3.5 h-3.5 fill-[#301809]" />
                  <span>{avgRating} ({reviews.length} تقييم)</span>
                </div>
              )}
              <h1 className="text-2xl md:text-5xl font-thmanyah font-bold text-white leading-tight drop-shadow-lg">
                {event.title}
              </h1>
            </div>
          </div>

          <div className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-10">
              {/* Organizer & Meta Bar */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-[#fdfbf7] p-4 rounded-2xl border border-[#dbc397]">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#301809] to-[#723c11] text-[#efa83f] flex items-center justify-center font-black text-lg shadow-xs">
                      {event.associations?.name?.charAt(0) || '🏛️'}
                    </div>
                    <div>
                      <span className="text-[11px] text-[#723c11] font-bold block">الجهة المنظمة للفعالية</span>
                      <button
                        onClick={() => event.association_id && navigate(`/association-profile/${event.association_id}`)}
                        className="text-base md:text-lg font-thmanyah font-bold text-[#301809] hover:text-[#b87a29] transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <span>{event.associations?.name || 'جمعية معتمدة'}</span>
                        <span className="text-xs text-[#b87a29] font-sans underline">(عرض صفحة الجمعية ←)</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 text-xs md:text-sm font-bold text-[#723c11] border-b border-[#dbc397]/60 pb-6">
                  <div className="flex items-center bg-[#fae1b7]/40 border border-[#dbc397] px-3.5 py-2 rounded-xl gap-2">
                    <CalendarIcon className="w-4 h-4 text-[#b87a29]" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center bg-[#fae1b7]/40 border border-[#dbc397] px-3.5 py-2 rounded-xl gap-2">
                    <Clock className="w-4 h-4 text-[#b87a29]" />
                    <span>{event.start_time?.substring(0, 5)} {event.end_time ? `- ${event.end_time.substring(0, 5)}` : ''}</span>
                  </div>
                  <div className="flex items-center bg-[#fae1b7]/40 border border-[#dbc397] px-3.5 py-2 rounded-xl gap-2">
                    <MapPin className="w-4 h-4 text-[#b87a29]" />
                    <span>{event.location}</span>
                  </div>
                  <a
                    href={buildGoogleMapsDirectionsUrl(event.location || 'ورقلة')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3.5 py-2 rounded-xl gap-1.5 transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                    <span>التوجيه عبر Google Maps</span>
                  </a>
                  <div className="flex items-center bg-[#fae1b7]/40 border border-[#dbc397] px-3.5 py-2 rounded-xl gap-2">
                    <Users className="w-4 h-4 text-[#b87a29]" />
                    <span>
                      {totalAttendingCount} مسجل {maxCap ? `من أصل ${maxCap} مقعد` : ''}
                    </span>
                  </div>
                  {totalWaitlistCount > 0 && (
                    <div className="flex items-center bg-amber-50 text-amber-800 border border-amber-300 px-3.5 py-2 rounded-xl gap-1.5">
                      <Hourglass className="w-3.5 h-3.5 text-amber-600" />
                      <span>قائمة الانتظار: {totalWaitlistCount}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="text-xl md:text-2xl font-thmanyah font-bold text-[#301809] mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#b87a29]" />
                  <span>تفاصيل ومحاور الفعالية</span>
                </h2>
                <div className="text-[#301809]/90 leading-relaxed whitespace-pre-wrap text-base bg-[#fdfbf7] p-6 rounded-2xl border border-[#dbc397]/60">
                  {event.description || 'لا يوجد وصف مفصل متاح لهذه الفعالية.'}
                </div>
              </div>

              {/* Coverage Photo Album Section */}
              <div className="pt-4 border-t border-[#dbc397]/60 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xl md:text-2xl font-thmanyah font-bold text-[#301809] flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-[#b87a29]" />
                    <span>ألبوم صور التغطية والتوثيق ({photos.length})</span>
                  </h2>
                </div>

                {/* Manager Upload Controls */}
                {userRole === 'manager' && (
                  <div className="bg-[#fdfbf7] p-4 rounded-2xl border-2 border-dashed border-[#dbc397] space-y-3">
                    <p className="text-xs font-bold text-[#723c11]">
                      📸 إضافة صور تغطية إعلامية لهذه الفعالية (تظهر للزوار وفي صفحة الجمعية):
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        disabled={uploadingPhoto}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUploadCoveragePhoto(f);
                        }}
                        className="bg-white border-[#dbc397] rounded-xl text-xs cursor-pointer h-10 pt-2"
                      />
                      <div className="flex gap-2 flex-1">
                        <Input
                          value={newPhotoUrl}
                          onChange={(e) => setNewPhotoUrl(e.target.value)}
                          placeholder="أو ألصق رابط صورة مباشر https://..."
                          dir="ltr"
                          className="bg-white border-[#dbc397] rounded-xl text-xs h-10"
                        />
                        <Button
                          type="button"
                          disabled={uploadingPhoto || !newPhotoUrl.trim()}
                          onClick={() => handleUploadCoveragePhoto(null)}
                          className="bg-[#301809] hover:bg-[#723c11] text-[#fae1b7] rounded-xl h-10 px-4 text-xs font-bold shrink-0 cursor-pointer"
                        >
                          {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                          <span>إضافة</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {photos.length === 0 ? (
                  <div className="bg-[#fdfbf7] rounded-2xl p-8 text-center border border-[#dbc397]/60 text-xs text-[#723c11]/80 font-medium">
                    سيتم نشر صور التغطية الإعلامية والتوثيق لهذه الفعالية هنا.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {photos.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className="group relative aspect-video rounded-2xl overflow-hidden border-2 border-[#dbc397] bg-slate-100 shadow-xs"
                      >
                        <img
                          src={imgUrl}
                          alt={`تغطية ${idx + 1}`}
                          onClick={() => setLightboxImg(imgUrl)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                        />
                        {userRole === 'manager' && (
                          <button
                            onClick={() => handleRemoveGalleryItem(imgUrl)}
                            className="absolute top-2 left-2 bg-red-600/90 hover:bg-red-700 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="حذف الصورة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reviews & Ratings Section */}
              <div className="pt-6 border-t border-[#dbc397]/60 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl md:text-2xl font-thmanyah font-bold text-[#301809] flex items-center gap-2">
                    <Star className="w-5 h-5 text-[#efa83f] fill-[#efa83f]" />
                    <span>تقييمات وانطباعات المشاركين ({reviews.length})</span>
                  </h2>
                  {avgRating && (
                    <span className="bg-[#fae1b7] text-[#301809] border border-[#dbc397] px-3 py-1 rounded-full text-xs font-black">
                      المعدل العام: {avgRating} / 5 ⭐
                    </span>
                  )}
                </div>

                {/* Add Review Form */}
                {user && (
                  <form onSubmit={handleSubmitReview} className="bg-[#fdfbf7] p-5 rounded-2xl border-2 border-[#dbc397] space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Label className="text-xs font-black text-[#301809]">أضف تقييمك ورأيك حول الفعالية (+5 نقاط شرفية):</Label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="p-1 cursor-pointer transition-transform hover:scale-110"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                star <= rating ? 'text-[#efa83f] fill-[#efa83f]' : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <Textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="شارك انطباعك أو اقتراحاتك حول تنظيم هذه الفعالية..."
                      rows={3}
                      required
                      className="bg-white border-[#dbc397] rounded-xl text-sm"
                    />

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={submittingReview || !reviewComment.trim()}
                        className="bg-gradient-to-r from-[#b87a29] to-[#efa83f] hover:from-[#723c11] hover:to-[#b87a29] text-white font-bold rounded-xl px-6 h-10 text-xs cursor-pointer"
                      >
                        {submittingReview ? 'جاري النشر...' : 'نشر التقييم (+5 نقاط)'}
                      </Button>
                    </div>
                  </form>
                )}

                {/* Reviews List */}
                {reviews.length === 0 ? (
                  <p className="text-xs text-[#723c11]/70 italic text-center py-4">
                    كن أول من يشارك رأيه وتقييمه لهذه الفعالية!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((rev) => (
                      <div key={rev.id} className="bg-white p-4 rounded-2xl border border-[#dbc397]/70 shadow-2xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-[#301809] flex items-center gap-1.5">
                            <span className="w-6 h-6 rounded-full bg-[#fae1b7] text-[#723c11] text-xs flex items-center justify-center font-black">
                              {rev.userName.charAt(0)}
                            </span>
                            {rev.userName}
                          </span>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < rev.rating ? 'text-[#efa83f] fill-[#efa83f]' : 'text-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs md:text-sm text-[#723c11] leading-relaxed">{rev.comment}</p>
                        <span className="text-[10px] text-gray-400 block">
                          {new Date(rev.createdAt).toLocaleDateString('ar-DZ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Area */}
            <div className="space-y-6">
              <Card className="shadow-xl border-2 border-[#dbc397] bg-[#fdfbf7] rounded-3xl overflow-hidden sticky top-24">
                <CardContent className="p-6">
                  {/* 1. MANAGER UI */}
                  {userRole === 'manager' && (
                    <div className="text-center space-y-5">
                      <h3 className="text-lg font-thmanyah font-bold text-[#301809] border-b border-[#dbc397] pb-3">
                        لوحة تحكم المنظم
                      </h3>

                      <div className="bg-white p-4 rounded-2xl shadow-xs inline-block mx-auto border border-[#dbc397]">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.href)}`}
                          alt="QR Code"
                          width={140}
                          height={140}
                          className="rounded-lg"
                        />
                      </div>
                      <p className="text-xs text-[#723c11] font-medium">رمز QR لصفحة الفعالية</p>

                      <div className="flex flex-col gap-2.5 pt-2">
                        <Button
                          onClick={copyLink}
                          variant="outline"
                          className="w-full text-[#301809] border-[#dbc397] hover:bg-[#fae1b7]/40 rounded-xl font-bold h-11 cursor-pointer"
                        >
                          <Share2 className="ml-2 h-4 w-4 text-[#b87a29]" />
                          نسخ رابط الفعالية
                        </Button>

                        {rsvps.length > 0 && (
                          <CSVLink
                            data={csvData}
                            filename={`attendees-${event.id.slice(0, 8)}.csv`}
                            className="w-full no-underline"
                            target="_blank"
                          >
                            <Button className="w-full bg-gradient-to-r from-[#b87a29] to-[#efa83f] hover:from-[#723c11] hover:to-[#b87a29] text-white font-bold gap-2 h-11 rounded-xl cursor-pointer shadow-md">
                              <Users className="h-4 w-4" />
                              تصدير كشف الحضور بالأسماء والهواتف (CSV)
                            </Button>
                          </CSVLink>
                        )}

                        <div className="mt-2 text-[#301809] font-black bg-[#fae1b7]/70 border border-[#dbc397] py-2.5 rounded-xl text-sm">
                          إجمالي المسجلين: {rsvps.length} {maxCap ? `/ ${maxCap}` : ''}
                        </div>
                        {waitlistRsvps.length > 0 && (
                          <div className="text-amber-900 font-black bg-amber-100/80 border border-amber-300 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5">
                            <Hourglass className="w-3.5 h-3.5 text-amber-700" />
                            <span>قائمة الانتظار الذكية: {waitlistRsvps.length} منتظر</span>
                          </div>
                        )}
                      </div>

                      {/* Quick Attendee Contact Preview for Manager */}
                      {rsvps.length > 0 && (
                        <div className="text-right pt-3 border-t border-[#dbc397] space-y-2">
                          <p className="text-xs font-black text-[#301809]">قائمة المسجلين المؤكدين ({rsvps.length}):</p>
                          <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                            {rsvps.map((r, i) => {
                              const c = parseUserContact(r.users?.full_name, r.users?.email);
                              return (
                                <div key={r.id || i} className="bg-white p-2.5 rounded-xl border border-[#dbc397]/60 text-xs flex items-center justify-between gap-2">
                                  <div className="truncate">
                                    <p className="font-bold text-[#301809] truncate">{c.name}</p>
                                    <p className="text-[10px] text-[#723c11]/70 truncate" dir="ltr">{r.users?.email}</p>
                                  </div>
                                  {c.phone && (
                                    <a
                                      href={`tel:${c.phone}`}
                                      className="bg-[#fae1b7]/60 text-[#301809] font-mono font-bold px-2 py-1 rounded-lg text-[10px] shrink-0"
                                      dir="ltr"
                                    >
                                      {c.phone}
                                    </a>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Waitlist Preview & Manual Promotion for Manager */}
                      {waitlistRsvps.length > 0 && (
                        <div className="text-right pt-3 border-t border-amber-300 space-y-2">
                          <p className="text-xs font-black text-amber-900 flex items-center gap-1">
                            <Hourglass className="w-3.5 h-3.5 text-amber-700" />
                            <span>قائمة الانتظار بالترتيب ({waitlistRsvps.length}):</span>
                          </p>
                          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                            {waitlistRsvps.map((w, idx) => {
                              const c = parseUserContact(w.users?.full_name, w.users?.email);
                              return (
                                <div key={w.id || idx} className="bg-amber-50/80 p-2.5 rounded-xl border border-amber-200 text-xs flex items-center justify-between gap-2">
                                  <div className="truncate">
                                    <p className="font-bold text-[#301809] truncate">
                                      <span className="text-amber-700 font-black ml-1">#{idx + 1}</span>
                                      {c.name}
                                    </p>
                                    {c.phone && <p className="text-[10px] text-[#723c11] font-mono" dir="ltr">{c.phone}</p>}
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => handlePromoteWaitlistUser(w)}
                                    className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg gap-1 shrink-0"
                                  >
                                    <CheckCircle2 className="w-3 h-3" /> ترقية لمقعد
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. ATTENDEE UI */}
                  {userRole === 'attendee' && (
                    <div className="space-y-5">
                      {hasRsvpd ? (
                        <div className="space-y-4">
                          <div className="bg-gradient-to-br from-[#301809] to-[#723c11] text-white p-6 rounded-2xl shadow-xl relative overflow-hidden text-center">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-x-8 -translate-y-8" />
                            <Ticket className="w-12 h-12 mx-auto mb-2 text-[#efa83f]" />
                            <h3 className="text-xl font-thmanyah font-bold mb-1 text-[#fae1b7]">تذكرتك جاهزة!</h3>
                            <p className="text-[#d4b174] text-xs mb-4">تم تأكيد مقعدك وحفظ التذكرة</p>
                            <div className="space-y-2">
                              <Button
                                onClick={() => setShowTicket(true)}
                                className="w-full h-12 bg-[#efa83f] hover:bg-[#b87a29] text-[#301809] font-black rounded-xl gap-2 shadow-lg cursor-pointer"
                              >
                                <Ticket className="h-5 w-5" />
                                عرض وطباعة التذكرة (QR)
                              </Button>
                              <Button
                                onClick={handleCancelRsvp}
                                disabled={rsvpLoading}
                                variant="ghost"
                                className="w-full h-9 text-xs text-red-200 hover:text-white hover:bg-red-500/20 rounded-xl cursor-pointer"
                              >
                                إلغاء حجز هذه التذكرة
                              </Button>
                            </div>
                          </div>

                          {/* Edit Contact Details on Ticket */}
                          <div className="bg-white p-4 rounded-2xl border border-[#dbc397] space-y-3 text-right">
                            <p className="text-xs font-black text-[#301809] flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-[#b87a29]" />
                              <span>بيانات حامل التذكرة:</span>
                            </p>
                            <div className="space-y-2">
                              <Input
                                value={attendeeName}
                                onChange={(e) => setAttendeeName(e.target.value)}
                                placeholder="الاسم الكامل على التذكرة"
                                className="h-10 text-xs border-[#dbc397] rounded-xl"
                              />
                              <Input
                                value={attendeePhone}
                                onChange={(e) => setAttendeePhone(e.target.value)}
                                placeholder="رقم الهاتف (مثال: 0661234567)"
                                dir="ltr"
                                className="h-10 text-xs border-[#dbc397] rounded-xl text-left font-mono"
                              />
                              <Button
                                type="button"
                                onClick={handleSaveContactInfo}
                                disabled={savingContact}
                                variant="outline"
                                className="w-full h-9 text-xs font-bold border-[#dbc397] text-[#723c11] hover:bg-[#fae1b7]/40 rounded-xl cursor-pointer"
                              >
                                {savingContact ? 'جاري الحفظ...' : 'تحديث الاسم ورقم الهاتف في التذكرة'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : isWaitlisted ? (
                        <div className="space-y-4">
                          <div className="bg-gradient-to-br from-amber-700 via-[#723c11] to-[#301809] text-white p-6 rounded-2xl shadow-xl relative overflow-hidden text-center border-2 border-[#efa83f]/40">
                            <Hourglass className="w-12 h-12 mx-auto mb-2 text-[#efa83f] animate-pulse" />
                            <h3 className="text-xl font-thmanyah font-bold mb-1 text-[#fae1b7]">أنت في قائمة الانتظار الذكية</h3>
                            <div className="inline-block bg-[#efa83f] text-[#301809] font-black text-sm px-4 py-1 rounded-full my-2 shadow">
                              ترتيبك الحالي في القائمة: #{waitlistPosition || 1}
                            </div>
                            <p className="text-[#fae1b7]/85 text-xs leading-relaxed mb-4">
                              سيتم ترقية حجزك تلقائياً إلى تذكرة مؤكدة فور اعتذار أو إلغاء أي مشارك لحجزه!
                            </p>
                            <Button
                              onClick={handleCancelRsvp}
                              disabled={rsvpLoading}
                              variant="ghost"
                              className="w-full h-9 text-xs text-red-200 hover:text-white hover:bg-red-500/20 rounded-xl cursor-pointer"
                            >
                              الانسحاب من قائمة الانتظار
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-right space-y-4">
                          <div className="text-center">
                            <div className="w-14 h-14 rounded-2xl bg-[#fae1b7]/70 border border-[#dbc397] flex items-center justify-center mx-auto mb-3 text-[#b87a29]">
                              {maxCap && totalAttendingCount >= maxCap ? (
                                <Hourglass className="w-7 h-7 text-amber-700" />
                              ) : (
                                <Ticket className="w-7 h-7" />
                              )}
                            </div>
                            <h3 className="text-xl font-thmanyah font-bold text-[#301809]">
                              {maxCap && totalAttendingCount >= maxCap
                                ? 'اكتملت المقاعد — قائمة الانتظار الذكية متاحة'
                                : 'احجز مقعدك المجاني'}
                            </h3>
                            <p className="text-[#723c11]/80 text-xs mt-1">
                              {maxCap && totalAttendingCount >= maxCap
                                ? 'سجّل بياناتك للانضمام لقائمة الانتظار وستحصل على تذكرتك تلقائياً فور شغور مقعد'
                                : 'أدخل اسمك ورقم هاتفك لإصدار تذكرتك الفورية برمز QR (+10 نقاط)'}
                            </p>
                          </div>

                          <div className="space-y-3 pt-2">
                            <div className="space-y-1">
                              <Label className="text-xs font-bold text-[#301809]">الاسم الكامل للمشارك *</Label>
                              <div className="relative">
                                <Input
                                  value={attendeeName}
                                  onChange={(e) => setAttendeeName(e.target.value)}
                                  placeholder="مثال: محمد بن عبد الله"
                                  required
                                  className="h-11 pr-9 border-2 border-[#dbc397] rounded-xl bg-white"
                                />
                                <User className="w-4 h-4 text-[#b87a29] absolute right-3 top-3.5" />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs font-bold text-[#301809]">رقم الهاتف للتواصل (اختياري)</Label>
                              <div className="relative">
                                <Input
                                  value={attendeePhone}
                                  onChange={(e) => setAttendeePhone(e.target.value)}
                                  placeholder="0661 00 00 00"
                                  dir="ltr"
                                  className="h-11 pr-9 border-2 border-[#dbc397] rounded-xl bg-white text-left font-mono"
                                />
                                <Phone className="w-4 h-4 text-[#b87a29] absolute right-3 top-3.5" />
                              </div>
                            </div>
                          </div>

                          <Button
                            onClick={handleRsvp}
                            disabled={rsvpLoading}
                            className="w-full h-13 text-base font-black bg-gradient-to-r from-[#b87a29] to-[#efa83f] hover:from-[#723c11] hover:to-[#b87a29] shadow-lg text-white rounded-xl cursor-pointer transition-all"
                          >
                            {rsvpLoading
                              ? 'جاري المعالجة...'
                              : maxCap && totalAttendingCount >= maxCap
                                ? '⏳ انضم إلى قائمة الانتظار الذكية'
                                : 'أكد حضورك واستلم التذكرة 🎟️'}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. GUEST UI */}
                  {userRole === 'guest' && (
                    <div className="text-center space-y-4">
                      <div className="bg-[#fae1b7]/70 border border-[#dbc397] p-3 rounded-2xl text-[#b87a29] w-16 h-16 flex items-center justify-center mx-auto mb-2">
                        <Ticket size={28} />
                      </div>
                      <h3 className="text-xl font-thmanyah font-bold text-[#301809]">سجل لحضور الفعالية</h3>
                      <p className="text-[#723c11]/80 text-xs leading-relaxed">
                        أدخل بريدك الإلكتروني وسنرسل لك رابطاً سحرياً لتسجيل الدخول وحجز التذكرة فوراً، أو سجل دخولك المباشر.
                      </p>

                      <form onSubmit={handleGuestMagicLink} className="space-y-3">
                        <div className="relative">
                          <Input
                            type="email"
                            placeholder="البريد الإلكتروني"
                            value={guestEmail}
                            onChange={(e) => setGuestEmail(e.target.value)}
                            required
                            dir="ltr"
                            className="pr-10 h-11 rounded-xl border-2 border-[#dbc397] bg-white"
                          />
                          <Mail className="absolute right-3 top-3 h-5 w-5 text-[#b87a29]" />
                        </div>
                        <Button
                          type="submit"
                          disabled={guestLoading}
                          className="w-full h-11 bg-[#301809] hover:bg-[#723c11] text-[#fae1b7] font-bold rounded-xl cursor-pointer"
                        >
                          {guestLoading ? 'جاري الإرسال...' : 'أرسل رابط الدخول السريع'}
                        </Button>
                      </form>

                      <div className="pt-2 border-t border-[#dbc397]/60">
                        <Button
                          variant="outline"
                          onClick={() => navigate('/login')}
                          className="w-full h-10 border-[#dbc397] text-[#723c11] hover:bg-[#fae1b7]/40 font-bold rounded-xl text-xs cursor-pointer"
                        >
                          الذهاب لصفحة تسجيل الدخول / حساب تجريبي ⚡
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <button
            onClick={() => setLightboxImg(null)}
            className="absolute top-6 right-6 bg-white/20 hover:bg-white/30 text-white rounded-full p-2.5 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxImg}
            alt="تغطية الفعالية"
            className="max-h-[85vh] max-w-[90vw] rounded-2xl shadow-2xl border-2 border-[#dbc397] object-contain"
          />
        </div>
      )}

      {/* QR Ticket Modal */}
      {showTicket && event && user && (
        <TicketCard
          event={event}
          userId={user.id}
          rsvpId={myRsvpId}
          userName={attendeeName || user.email?.split('@')[0]}
          userPhone={attendeePhone}
          onClose={() => setShowTicket(false)}
        />
      )}
    </>
  );
}
