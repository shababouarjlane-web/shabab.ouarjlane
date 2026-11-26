import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import UnifiedHeader from '../../components/UnifiedHeader';
import {
  CalendarPlus,
  Calendar as CalendarIcon,
  MapPin,
  Users,
  Archive,
  ArchiveRestore,
  Trash2,
  Edit,
  FileDown,
  MoreVertical,
  Send,
  Smartphone,
  Bell,
  Loader2,
  QrCode,
  X,
  CheckCircle2,
  Settings,
  KeyRound,
  LogOut,
  Search,
  Sparkles,
  Ticket,
  Building2,
  BarChart3,
  ExternalLink,
  Upload,
  Phone,
  Globe,
  Megaphone,
  Star,
  TrendingUp,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';
import { PrintableEventReport } from '../../components/PrintableEventReport';
import { QRCodeSVG } from 'qrcode.react';
import {
  parseUserContact,
  parseAssociationMeta,
  packAssociationMeta,
  parseGalleryAndReviews,
} from '../../lib/helpers';
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

export default function AssociationDashboard() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assocId, setAssocId] = useState<string>('');
  const [assocName, setAssocName] = useState<string>('');
  const [assocBio, setAssocBio] = useState<string>('');
  const [assocLogo, setAssocLogo] = useState<string>('');
  const [assocPhone, setAssocPhone] = useState<string>('');
  const [assocWebsite, setAssocWebsite] = useState<string>('');
  const [assocLocation, setAssocLocation] = useState<string>('ورقلة، الجزائر');
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Printing State
  const [reportData, setReportData] = useState<{ event: any; rsvps: any[] } | null>(null);
  const reportRef = React.useRef<HTMLDivElement>(null);

  // QR Check-in State
  const [checkinData, setCheckinData] = useState<{ event: any; rsvps: any[] } | null>(null);
  const [checkedIn, setCheckedIn] = useState<Set<string>>(new Set());

  // Broadcast Notification States
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastUrl, setBroadcastUrl] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  // Password Update Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

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
        password: newPassword,
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
      localStorage.removeItem('demo_role');
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error(error);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastBody) return;

    setBroadcasting(true);
    try {
      const channel = supabase.channel('notifications-broadcast', {
        config: { broadcast: { ack: true } },
      });

      await new Promise<void>((resolve, reject) => {
        channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            const resp = await channel.send({
              type: 'broadcast',
              event: 'alert',
              payload: {
                title: `${assocName || 'الجمعية'}: ${broadcastTitle}`,
                body: broadcastBody,
                url: broadcastUrl || undefined,
              },
            });

            if (resp === 'ok') {
              resolve();
            } else {
              reject(new Error('فشل إرسال البث عبر قناة Supabase.'));
            }
          } else if (status === 'TIMED_OUT') {
            reject(new Error('انتهت مهلة الاتصال بقناة البث.'));
          }
        });
      });

      toast.success('تم بث الإشعار بنجاح إلى هواتف جميع المشتركين النشطين!');
      setBroadcastTitle('');
      setBroadcastBody('');
      setBroadcastUrl('');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'حدث خطأ أثناء بث الإشعار.');
    } finally {
      setBroadcasting(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: reportData ? `Report-${reportData.event.title}` : 'Event-Report',
  });

  useEffect(() => {
    if (reportData) {
      handlePrint();
      setReportData(null);
    }
  }, [reportData]);

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: assoc } = await supabase
        .from('associations')
        .select('id, name, description')
        .eq('manager_id', user.id)
        .single();

      if (assoc) {
        setAssocId(assoc.id);
        setAssocName(assoc.name);
        const parsed = parseAssociationMeta(assoc.description);
        setAssocBio(parsed.bio || '');
        setAssocLogo(parsed.logo_url || '');
        setAssocPhone(parsed.phone || '');
        setAssocWebsite(parsed.website || '');
        setAssocLocation(parsed.location || 'ورقلة، الجزائر');

        const { data: eventsData } = await supabase
          .from('events')
          .select('*, rsvps(count)')
          .eq('association_id', assoc.id)
          .order('date', { ascending: true });

        setEvents(eventsData || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة صالح (PNG أو JPG أو WebP).');
      e.target.value = '';
      return;
    }

    setUploadingLogo(true);
    try {
      // 1) Compress large images automatically before uploading
      let fileToUpload: File = file;
      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 0.45,
          maxWidthOrHeight: 800,
          useWebWorker: true,
        });
        fileToUpload = new File([compressed], file.name, {
          type: compressed.type || file.type,
        });
      } catch (compErr) {
        console.warn('Logo compression skipped:', compErr);
      }

      const ext =
        (fileToUpload.name.split('.').pop() || 'png')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '') || 'png';
      const filePath = `associations/assoc_logo_${assocId || Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;

      // 2) Upload to the actual Supabase Storage bucket ('events')
      const { error } = await supabase.storage.from('events').upload(filePath, fileToUpload, {
        cacheControl: '3600',
        upsert: true,
        contentType: fileToUpload.type || 'image/png',
      });

      if (!error) {
        const { data: pub } = supabase.storage.from('events').getPublicUrl(filePath);
        if (pub?.publicUrl) {
          setAssocLogo(pub.publicUrl);
          toast.success('تم رفع شعار الجمعية بنجاح! اضغط على "حفظ وتحديث الملف" لتثبيته.');
          return;
        }
      }

      // 3) Graceful fallback if storage RLS blocks direct upload: store compact compressed Data URL
      console.warn('Supabase storage upload failed, using compressed inline logo fallback:', error);
      const compactBlob = await imageCompression(file, {
        maxSizeMB: 0.12,
        maxWidthOrHeight: 360,
        useWebWorker: true,
      });
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('تعذر قراءة ملف الصورة'));
        reader.readAsDataURL(compactBlob);
      });

      if (dataUrl) {
        setAssocLogo(dataUrl);
        toast.success('تم تجهيز شعار الجمعية بنجاح! اضغط على "حفظ وتحديث الملف" لتثبيته.');
      } else {
        throw error || new Error('تعذر معالجة الصورة');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.message ? `تعذر رفع الشعار: ${err.message}` : 'تعذر رفع الشعار، يرجى تجربة صورة أخرى.'
      );
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleSaveAssocProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assocId) return;
    setSavingProfile(true);
    try {
      const packedDescription = packAssociationMeta(assocBio, {
        logo_url: assocLogo.trim() || undefined,
        phone: assocPhone.trim() || undefined,
        website: assocWebsite.trim() || undefined,
        location: assocLocation.trim() || undefined,
      });
      const { error } = await supabase
        .from('associations')
        .update({
          name: assocName.trim(),
          description: packedDescription,
        })
        .eq('id', assocId);
      if (error) throw error;
      toast.success('تم تحديث الملف التعريفي للجمعية بنجاح!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'فشل حفظ بيانات الجمعية');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleArchiveToggle = async (
    e: React.MouseEvent,
    eventId: string,
    currentStatus: string
  ) => {
    e.stopPropagation();
    const newStatus = currentStatus === 'archived' ? 'active' : 'archived';

    const previousEvents = [...events];
    setEvents(events.map((ev) => (ev.id === eventId ? { ...ev, status: newStatus } : ev)));

    try {
      const { error } = await supabase
        .from('events')
        .update({ status: newStatus })
        .eq('id', eventId);
      if (error) throw error;
      toast.success(
        newStatus === 'archived' ? 'تمت أرشفة الفعالية بنجاح' : 'تمت استعادة الفعالية بنجاح'
      );
    } catch {
      setEvents(previousEvents);
      toast.error('حدث خطأ أثناء تحديث حالة الفعالية');
    }
  };

  const handleDeleteEvent = async (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    if (
      !window.confirm(
        'هل أنت متأكد من رغبتك في حذف هذه الفعالية نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.'
      )
    ) {
      return;
    }

    const previousEvents = [...events];
    setEvents(events.filter((ev) => ev.id !== eventId));

    try {
      const { error } = await supabase.from('events').delete().eq('id', eventId);
      if (error) throw error;
      toast.success('تم حذف الفعالية بنجاح');
    } catch {
      setEvents(previousEvents);
      toast.error('حدث خطأ أثناء حذف الفعالية');
    }
  };

  const activeEvents = events.filter((e) => e.status !== 'archived');
  const archivedEvents = events.filter((e) => e.status === 'archived');
  const totalRsvps = events.reduce((acc, ev) => acc + (ev.rsvps?.[0]?.count || 0), 0);
  const avgAttendees = events.length > 0 ? Math.round(totalRsvps / events.length) : 0;

  const filteredActiveEvents = activeEvents.filter(
    (e) =>
      e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.location && e.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const filteredArchivedEvents = archivedEvents.filter(
    (e) =>
      e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.location && e.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'Heritage':
        return 'bg-[#fae1b7] text-[#301809] border-[#dbc397]';
      case 'Sports':
        return 'bg-amber-50 text-amber-900 border-amber-200';
      case 'Educational':
        return 'bg-stone-100 text-stone-800 border-stone-200';
      case 'Religious':
        return 'bg-[#fae1b7]/80 text-[#301809] border-[#d4b174]';
      case 'Cultural':
        return 'bg-orange-50 text-orange-900 border-orange-200';
      default:
        return 'bg-[#fdfbf7] text-[#723c11] border-[#dbc397]';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'Heritage':
        return 'تراثي وأصالة';
      case 'Sports':
        return 'رياضي وشبابي';
      case 'Educational':
        return 'تعليمي وتكويني';
      case 'Religious':
        return 'ديني وقرآني';
      case 'Cultural':
        return 'ثقافي وفني';
      case 'Social':
        return 'اجتماعي وخيري';
      default:
        return 'نشاط مجتمعي';
    }
  };

  const renderEventCard = (event: any) => (
    <Card
      key={event.id}
      className="overflow-hidden border border-[#e3d4b8] hover:border-[#b87a29] rounded-2xl shadow-xs hover:shadow-lg transition-all duration-300 group cursor-pointer flex flex-col h-full relative bg-white"
      onClick={() => navigate(`/event/${event.id}`)}
    >
      {/* Category Badge */}
      <div
        className={`absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-xs backdrop-blur-sm ${getCategoryTheme(
          event.category
        )}`}
      >
        {getCategoryLabel(event.category)}
      </div>

      <div className="h-44 overflow-hidden relative bg-[#fdfbf7] flex items-center justify-center border-b border-[#e3d4b8]/60">
        {event.cover_image_url ? (
          <img
            src={event.cover_image_url}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.parentElement?.querySelector('.image-fallback');
              if (fallback) fallback.classList.remove('hidden');
            }}
          />
        ) : null}
        <div
          className={`${
            event.cover_image_url ? 'hidden' : ''
          } image-fallback absolute inset-0 bg-gradient-to-tr from-[#301809] via-[#5c2f10] to-[#b87a29] flex items-center justify-center text-white flex-col gap-1.5 p-4 text-center`}
        >
          <div className="w-11 h-11 rounded-2xl bg-[#efa83f]/20 border border-[#efa83f]/40 flex items-center justify-center text-[#efa83f]">
            <Building2 className="w-5 h-5" />
          </div>
          <span className="font-thmanyah font-bold text-base text-[#fae1b7] tracking-wide">
            تواصل صحراء
          </span>
          <span className="text-[11px] text-[#dbc397] font-medium line-clamp-1">
            {assocName || 'فعالية جمعية'}
          </span>
        </div>
      </div>

      <CardContent className="p-4.5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start gap-2 mb-2">
            <h3 className="font-thmanyah font-bold text-base text-[#301809] group-hover:text-[#b87a29] transition-colors line-clamp-1 flex-1">
              {event.title}
            </h3>

            <div className="flex items-center gap-1 shrink-0">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  event.is_public
                    ? 'bg-[#fae1b7]/60 text-[#723c11] border-[#dbc397]'
                    : 'bg-stone-100 text-stone-600 border-stone-200'
                }`}
              >
                {event.is_public ? 'عام' : 'خاص'}
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 hover:bg-[#fae1b7]/40 rounded-lg cursor-pointer"
                  >
                    <MoreVertical className="h-4 w-4 text-[#723c11]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-44 text-right font-sans rounded-2xl border border-[#dbc397] p-1.5 shadow-xl bg-white"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenuItem
                    className="flex justify-between items-center px-3 py-2 rounded-xl text-xs font-bold text-[#723c11] hover:bg-[#fae1b7]/40 cursor-pointer"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const { data } = await supabase
                          .from('rsvps')
                          .select('*, users(email, full_name)')
                          .eq('event_id', event.id)
                          .eq('status', 'attending');

                        setReportData({ event, rsvps: data || [] });
                      } catch {
                        toast.error('حدث خطأ أثناء تحضير التقرير');
                      }
                    }}
                  >
                    <span>طباعة تقرير</span>
                    <FileDown className="w-4 h-4 text-[#b87a29]" />
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="flex justify-between items-center px-3 py-2 rounded-xl text-xs font-bold text-[#301809] hover:bg-[#fae1b7]/40 cursor-pointer"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const { data } = await supabase
                          .from('rsvps')
                          .select('id, user_id, users(email, full_name)')
                          .eq('event_id', event.id)
                          .eq('status', 'attending');
                        setCheckedIn(new Set());
                        setCheckinData({ event, rsvps: data || [] });
                      } catch {
                        toast.error('خطأ في تحميل قائمة الحضور');
                      }
                    }}
                  >
                    <span>تسجيل الحضور QR</span>
                    <QrCode className="w-4 h-4 text-[#b87a29]" />
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="flex justify-between items-center px-3 py-2 rounded-xl text-xs font-bold text-[#723c11] hover:bg-[#fae1b7]/40 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/association/edit-event/${event.id}`);
                    }}
                  >
                    <span>تعديل الفعالية</span>
                    <Edit className="w-4 h-4 text-[#b87a29]" />
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="flex justify-between items-center px-3 py-2 rounded-xl text-xs font-bold text-[#723c11] hover:bg-[#fae1b7]/40 cursor-pointer"
                    onClick={(e) => handleArchiveToggle(e, event.id, event.status)}
                  >
                    <span>{event.status === 'archived' ? 'استعادة النشاط' : 'أرشفة الفعالية'}</span>
                    {event.status === 'archived' ? (
                      <ArchiveRestore className="w-4 h-4 text-[#b87a29]" />
                    ) : (
                      <Archive className="w-4 h-4 text-[#b87a29]" />
                    )}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-[#dbc397]/50 my-1" />

                  <DropdownMenuItem
                    className="flex justify-between items-center px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer"
                    onClick={(e) => handleDeleteEvent(e, event.id)}
                  >
                    <span>حذف الفعالية</span>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="space-y-2 mt-2.5 text-xs text-[#723c11]">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-3.5 h-3.5 text-[#b87a29] shrink-0" />
              <span className="font-semibold">
                {event.date} • {event.start_time?.substring(0, 5)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#b87a29] shrink-0" />
              <span className="truncate font-medium">{event.location || 'ورقلة'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#e3d4b8]/60 pt-3 mt-4 text-xs">
          <span className="text-[#723c11]/80 font-semibold">المشاركون المسجلون</span>
          <span className="font-bold text-[#301809] bg-[#fae1b7]/50 border border-[#dbc397]/80 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#b87a29]" />
            {event.rsvps?.[0]?.count || 0} مسجل
          </span>
        </div>
      </CardContent>
    </Card>
  );

  const accountMenuSlot = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="w-10 h-10 rounded-xl border border-[#dbc397] bg-white hover:bg-[#fae1b7]/40 text-[#301809] cursor-pointer"
          title="إعدادات الحساب"
        >
          <Settings className="w-4 h-4 text-[#723c11]" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className="w-56 bg-white/95 backdrop-blur-md rounded-2xl border border-[#dbc397] p-1.5 shadow-xl font-sans text-right"
      >
        <DropdownMenuLabel className="px-3 py-2 text-right">
          <p className="text-xs font-bold text-[#301809]">حساب ممثل الجمعية</p>
          <p className="text-[11px] text-[#723c11]/75 truncate mt-0.5">
            {assocName || 'مساحة الجمعية'}
          </p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-[#dbc397]/50 my-1" />

        {assocId && (
          <DropdownMenuItem
            onClick={() => navigate(`/association-profile/${assocId}`)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[#723c11] hover:bg-[#fae1b7]/40 cursor-pointer"
          >
            <ExternalLink className="w-4 h-4 text-[#b87a29]" />
            <span>معاينة صفحة الجمعية</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          onClick={() => setIsPasswordModalOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[#723c11] hover:bg-[#fae1b7]/40 cursor-pointer"
        >
          <KeyRound className="w-4 h-4 text-[#b87a29]" />
          <span>تغيير كلمة المرور</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-[#dbc397]/50 my-1" />

        <DropdownMenuItem
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-red-500" />
          <span>تسجيل الخروج</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div
      className="min-h-screen bg-[#fdfbf7] bg-[radial-gradient(ellipse_at_top,_rgba(239,168,63,0.12),_transparent_55%)] text-[#301809] pb-16"
      dir="rtl"
    >
      {/* Hidden Report for Printing */}
      <div style={{ display: 'none' }}>
        {reportData && (
          <PrintableEventReport
            ref={reportRef}
            event={reportData.event}
            rsvps={reportData.rsvps}
            assocName={assocName}
          />
        )}
      </div>

      {/* Unified Platform Header */}
      <UnifiedHeader rightSlot={accountMenuSlot} />

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Regal Sahara Association Hero */}
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-l from-[#301809] via-[#4a250e] to-[#2b1507] text-white p-6 md:p-7 border border-[#b87a29]/30 shadow-lg">
          <div className="absolute -left-20 -top-20 w-64 h-64 rounded-full bg-[#efa83f]/15 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Brand & Identity */}
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-16 h-16 md:w-18 md:h-18 rounded-2xl bg-white/95 border-2 border-[#efa83f]/70 flex items-center justify-center text-[#301809] font-thmanyah font-bold text-2xl shadow-md shrink-0 overflow-hidden">
                {assocLogo ? (
                  <img
                    src={assocLogo}
                    alt={assocName}
                    className="w-full h-full object-contain p-1.5"
                  />
                ) : (
                  <Building2 className="w-8 h-8 text-[#b87a29]" />
                )}
              </div>
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#efa83f]/20 border border-[#efa83f]/40 text-[#fae1b7] text-[11px] font-bold mb-1.5">
                  <Sparkles className="w-3 h-3 text-[#efa83f]" />
                  <span>مساحة الجمعية المعتمدة</span>
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-thmanyah font-bold text-[#fae1b7] truncate">
                  {assocName || 'لوحة إدارة الجمعية'}
                </h1>
                <p className="text-xs sm:text-sm text-[#dbc397]/90 mt-1">
                  إدارة فعالياتكم، توثيق الحضور برمز QR، والتواصل المباشر مع جمهور ورقلة.
                </p>
              </div>
            </div>

            {/* Primary Actions */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Button
                onClick={() => navigate('/association/create-event')}
                className="h-11 px-5 rounded-xl bg-gradient-to-l from-[#b87a29] to-[#efa83f] hover:from-[#a06720] hover:to-[#e0982e] text-[#301809] font-thmanyah font-bold shadow-md cursor-pointer flex items-center gap-2 text-sm"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>إنشاء فعالية جديدة</span>
              </Button>

              {assocId && (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/association-profile/${assocId}`)}
                  className="h-11 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-[#fae1b7] border border-[#efa83f]/35 font-bold cursor-pointer flex items-center gap-1.5 text-xs sm:text-sm"
                >
                  <ExternalLink className="w-4 h-4 text-[#efa83f]" />
                  <span>معاينة صفحة الجمعية</span>
                </Button>
              )}
            </div>
          </div>

          {/* Inline Compact KPI Strip */}
          <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
            <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#dbc397] font-medium">فعاليات نشطة</p>
                <p className="text-2xl font-thmanyah font-bold text-white mt-0.5">
                  {activeEvents.length}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#efa83f]/20 flex items-center justify-center text-[#efa83f]">
                <CalendarIcon className="w-4 h-4" />
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#dbc397] font-medium">إجمالي المسجلين</p>
                <p className="text-2xl font-thmanyah font-bold text-[#fae1b7] mt-0.5">
                  {totalRsvps}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#efa83f]/20 flex items-center justify-center text-[#efa83f]">
                <Ticket className="w-4 h-4" />
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#dbc397] font-medium">متوسط الحضور</p>
                <p className="text-2xl font-thmanyah font-bold text-white mt-0.5">
                  {avgAttendees}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#efa83f]/20 flex items-center justify-center text-[#efa83f]">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#dbc397] font-medium">إجمالي الأنشطة</p>
                <p className="text-2xl font-thmanyah font-bold text-white mt-0.5">
                  {events.length}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#efa83f]/20 flex items-center justify-center text-[#efa83f]">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
          </div>
        </section>

        {/* Tabs System + Compact Search */}
        <Tabs defaultValue="active" className="w-full space-y-6" dir="rtl">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <TabsList className="bg-white p-1.5 rounded-2xl border border-[#dbc397]/70 shadow-xs h-auto w-full xl:w-auto flex flex-wrap gap-1">
              <TabsTrigger
                value="active"
                className="flex-1 sm:flex-initial px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl text-[#723c11] data-[state=active]:bg-[#301809] data-[state=active]:text-[#fae1b7] data-[state=active]:shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CalendarIcon className="w-4 h-4" />
                <span>النشطة ({activeEvents.length})</span>
              </TabsTrigger>
              <TabsTrigger
                value="archived"
                className="flex-1 sm:flex-initial px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl text-[#723c11] data-[state=active]:bg-[#301809] data-[state=active]:text-[#fae1b7] data-[state=active]:shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Archive className="w-4 h-4" />
                <span>الأرشيف ({archivedEvents.length})</span>
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="flex-1 sm:flex-initial px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl text-[#723c11] data-[state=active]:bg-[#301809] data-[state=active]:text-[#fae1b7] data-[state=active]:shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <BarChart3 className="w-4 h-4" />
                <span>الإحصائيات</span>
              </TabsTrigger>
              <TabsTrigger
                value="profile"
                className="flex-1 sm:flex-initial px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl text-[#723c11] data-[state=active]:bg-[#301809] data-[state=active]:text-[#fae1b7] data-[state=active]:shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Building2 className="w-4 h-4" />
                <span>ملف الجمعية والشعار</span>
              </TabsTrigger>
              <TabsTrigger
                value="broadcast"
                className="flex-1 sm:flex-initial px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl text-[#723c11] data-[state=active]:bg-[#301809] data-[state=active]:text-[#fae1b7] data-[state=active]:shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Megaphone className="w-4 h-4" />
                <span>بث تنبيه</span>
              </TabsTrigger>
            </TabsList>

            {/* Compact Search */}
            <div className="relative w-full xl:w-80">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b87a29]" />
              <Input
                type="text"
                placeholder="ابحث في فعاليات الجمعية..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 pl-9 h-11 bg-white border border-[#dbc397] rounded-2xl font-medium text-sm focus-visible:border-[#b87a29] shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#723c11]/70 hover:text-[#301809] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Active Events Tab */}
          <TabsContent value="active" className="mt-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#723c11]">
                <Loader2 className="w-8 h-8 animate-spin text-[#b87a29]" />
                <p className="font-bold text-sm">جاري تحميل فعاليات الجمعية...</p>
              </div>
            ) : filteredActiveEvents.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-[#dbc397] flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-[#fae1b7]/50 border border-[#dbc397] flex items-center justify-center text-[#b87a29] mb-4">
                  <CalendarIcon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-thmanyah font-bold text-[#301809] mb-1.5">
                  لا توجد فعاليات نشطة مطابقة
                </h3>
                <p className="text-xs text-[#723c11]/80 mb-6 max-w-md font-medium">
                  {searchQuery
                    ? 'لم يتم العثور على فعاليات تطابق كلمة البحث الحالية.'
                    : 'ابدأ بإنشاء أول فعالية لجمعيتك ودع مجتمع ورقلة يتعرف على أنشطتكم.'}
                </p>
                <Button
                  onClick={() => navigate('/association/create-event')}
                  className="bg-gradient-to-l from-[#b87a29] to-[#efa83f] hover:from-[#723c11] hover:to-[#b87a29] text-[#301809] hover:text-white font-thmanyah font-bold rounded-xl h-11 px-6 shadow-sm cursor-pointer transition-all"
                >
                  <CalendarPlus className="w-4 h-4 ml-2" />
                  إنشاء فعالية جديدة
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredActiveEvents.map(renderEventCard)}
              </div>
            )}
          </TabsContent>

          {/* Archived Events Tab */}
          <TabsContent value="archived" className="mt-0">
            {filteredArchivedEvents.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-[#dbc397] flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-[#fae1b7]/50 border border-[#dbc397] flex items-center justify-center text-[#b87a29] mb-4">
                  <Archive className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-thmanyah font-bold text-[#301809] mb-1.5">
                  الأرشيف فارغ
                </h3>
                <p className="text-xs text-[#723c11]/80 font-medium">
                  لا توجد فعاليات مؤرشفة في الوقت الحالي.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 opacity-95">
                {filteredArchivedEvents.map(renderEventCard)}
              </div>
            )}
          </TabsContent>

          {/* Visual Analytics Tab */}
          <TabsContent value="analytics" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: RSVPs per Event Bar Chart */}
              <Card className="border border-[#e3d4b8] rounded-3xl bg-white shadow-xs">
                <CardContent className="p-6 md:p-7">
                  <h3 className="text-lg font-thmanyah font-bold text-[#301809] flex items-center gap-2 mb-1">
                    <BarChart3 className="w-5 h-5 text-[#b87a29]" />
                    <span>معدل الإقبال والحجوزات لكل فعالية</span>
                  </h3>
                  <p className="text-xs text-[#723c11]/80 mb-6">
                    مقارنة عدد المسجلين ونسبة امتلاء المقاعد في أبرز فعالياتكم
                  </p>

                  {events.length === 0 ? (
                    <p className="text-center text-xs text-[#723c11] py-10">
                      لا توجد فعاليات لعرض إحصائياتها بعد.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {events.slice(0, 8).map((ev) => {
                        const count = ev.rsvps?.[0]?.count || 0;
                        const maxCap = ev.max_capacity || Math.max(count, 50);
                        const pct = Math.min(100, Math.round((count / maxCap) * 100));
                        const { reviews } = parseGalleryAndReviews(ev.gallery_urls);
                        const avgScore =
                          reviews.length > 0
                            ? (
                                reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
                              ).toFixed(1)
                            : null;
                        return (
                          <div key={ev.id} className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs font-bold">
                              <span className="text-[#301809] truncate max-w-[60%]">
                                {ev.title}
                              </span>
                              <div className="flex items-center gap-2">
                                {avgScore && (
                                  <span className="text-[11px] bg-[#fae1b7]/60 text-[#301809] px-2 py-0.5 rounded-full border border-[#dbc397] inline-flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-[#efa83f] text-[#b87a29]" />
                                    {avgScore}
                                  </span>
                                )}
                                <span className="text-[#723c11]">
                                  {count} {ev.max_capacity ? `/ ${ev.max_capacity}` : 'مسجل'} ({pct}
                                  %)
                                </span>
                              </div>
                            </div>
                            <div className="h-2.5 w-full bg-[#fae1b7]/40 rounded-full overflow-hidden border border-[#dbc397]/50">
                              <div
                                className="h-full bg-gradient-to-l from-[#301809] via-[#b87a29] to-[#efa83f] rounded-full transition-all duration-700"
                                style={{ width: `${Math.max(pct, count > 0 ? 8 : 0)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Chart 2: Events Distribution by Category */}
              <Card className="border border-[#e3d4b8] rounded-3xl bg-white shadow-xs">
                <CardContent className="p-6 md:p-7">
                  <h3 className="text-lg font-thmanyah font-bold text-[#301809] flex items-center gap-2 mb-1">
                    <Sparkles className="w-5 h-5 text-[#b87a29]" />
                    <span>توزيع أنشطة الجمعية حسب التصنيف</span>
                  </h3>
                  <p className="text-xs text-[#723c11]/80 mb-6">
                    تحليل مجالات تركيز الجمعية وتفاعل الجمهور مع كل فئة
                  </p>

                  {(() => {
                    const cats = ['Heritage', 'Cultural', 'Educational', 'Religious', 'Sports'];
                    return (
                      <div className="space-y-3.5">
                        {cats.map((cat) => {
                          const catEvents = events.filter((e) => e.category === cat);
                          const catRsvps = catEvents.reduce(
                            (acc, ev) => acc + (ev.rsvps?.[0]?.count || 0),
                            0
                          );
                          const pct =
                            events.length > 0
                              ? Math.round((catEvents.length / events.length) * 100)
                              : 0;
                          return (
                            <div
                              key={cat}
                              className="p-3.5 rounded-2xl bg-[#fdfbf7] border border-[#e3d4b8]"
                            >
                              <div className="flex justify-between items-center text-xs font-bold mb-2">
                                <span className="text-[#301809]">{getCategoryLabel(cat)}</span>
                                <span className="text-[#723c11]">
                                  {catEvents.length} فعالية • {catRsvps} تذكرة ({pct}%)
                                </span>
                              </div>
                              <div className="h-2 w-full bg-[#fae1b7]/40 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#b87a29] rounded-full transition-all duration-700"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Association Public Profile & Logo Editor Tab */}
          <TabsContent value="profile" className="mt-0">
            <Card className="border border-[#e3d4b8] rounded-3xl bg-white shadow-sm overflow-hidden max-w-3xl mx-auto">
              <div className="bg-gradient-to-l from-[#301809] via-[#4a250e] to-[#2b1507] text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white p-1.5 border-2 border-[#efa83f] flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                    {assocLogo ? (
                      <img
                        src={assocLogo}
                        alt={assocName}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Building2 className="w-8 h-8 text-[#b87a29]" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-thmanyah font-bold text-[#fae1b7]">
                      ملف الجمعية والشعار الرسمي
                    </h3>
                    <p className="text-xs text-[#dbc397] mt-0.5">
                      تظهر هذه البيانات والشعار في صفحتكم العامة ودليل الجمعيات.
                    </p>
                  </div>
                </div>
                {assocId && (
                  <Button
                    type="button"
                    onClick={() => navigate(`/association-profile/${assocId}`)}
                    className="bg-[#efa83f] hover:bg-[#e0982e] text-[#301809] font-thmanyah font-bold rounded-xl h-10 px-4 text-xs gap-1.5 cursor-pointer shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>فتح صفحة الجمعية</span>
                  </Button>
                )}
              </div>

              <CardContent className="p-6 md:p-7">
                <form onSubmit={handleSaveAssocProfile} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-[#301809]">اسم الجمعية الرسمي</Label>
                      <Input
                        required
                        value={assocName}
                        onChange={(e) => setAssocName(e.target.value)}
                        className="h-11 rounded-xl border border-[#dbc397] bg-[#fdfbf7] focus-visible:border-[#b87a29]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-[#301809]">
                        المقر / العنوان في ورقلة
                      </Label>
                      <Input
                        value={assocLocation}
                        onChange={(e) => setAssocLocation(e.target.value)}
                        placeholder="مثال: حي القصر القديم، ورقلة"
                        className="h-11 rounded-xl border border-[#dbc397] bg-[#fdfbf7] focus-visible:border-[#b87a29]"
                      />
                    </div>
                  </div>

                  {/* Logo Upload + URL */}
                  <div className="space-y-2.5 p-4 rounded-2xl bg-[#fdfbf7] border border-dashed border-[#dbc397]">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-[#301809]">
                        شعار الجمعية (Logo)
                      </Label>
                      <span className="text-[11px] text-[#723c11]/75">
                        يتم ضغط الصورة تلقائياً (PNG / JPG / WebP)
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 h-11 rounded-xl bg-[#fae1b7]/70 hover:bg-[#fae1b7] text-[#301809] border border-[#dbc397] text-xs font-bold transition-colors shrink-0">
                        {uploadingLogo ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[#b87a29]" />
                        ) : (
                          <Upload className="w-4 h-4 text-[#b87a29]" />
                        )}
                        <span>{uploadingLogo ? 'جاري رفع الشعار...' : 'رفع شعار من جهازك'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoUpload}
                          disabled={uploadingLogo}
                        />
                      </label>
                      <Input
                        dir="ltr"
                        value={assocLogo}
                        onChange={(e) => setAssocLogo(e.target.value)}
                        placeholder="أو الصق رابط الشعار مباشرة https://..."
                        className="h-11 rounded-xl border border-[#dbc397] bg-white text-xs focus-visible:border-[#b87a29]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-[#301809]">
                      نبذة تعريفية عن الجمعية وأهدافها
                    </Label>
                    <Textarea
                      rows={4}
                      value={assocBio}
                      onChange={(e) => setAssocBio(e.target.value)}
                      placeholder="اكتب نبذة شاملة عن تاريخ الجمعية، رسالتها، وأبرز مجالات نشاطها في ورقلة..."
                      className="rounded-xl border border-[#dbc397] bg-[#fdfbf7] focus-visible:border-[#b87a29]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-[#301809] flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#b87a29]" />
                        <span>رقم هاتف التواصل للجمهور</span>
                      </Label>
                      <Input
                        dir="ltr"
                        value={assocPhone}
                        onChange={(e) => setAssocPhone(e.target.value)}
                        placeholder="06XXXXXXXX"
                        className="h-11 rounded-xl border border-[#dbc397] bg-[#fdfbf7] text-right font-mono focus-visible:border-[#b87a29]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-[#301809] flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-[#b87a29]" />
                        <span>صفحة فيسبوك أو الموقع الإلكتروني</span>
                      </Label>
                      <Input
                        dir="ltr"
                        value={assocWebsite}
                        onChange={(e) => setAssocWebsite(e.target.value)}
                        placeholder="https://facebook.com/..."
                        className="h-11 rounded-xl border border-[#dbc397] bg-[#fdfbf7] text-xs focus-visible:border-[#b87a29]"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={savingProfile || uploadingLogo}
                    className="w-full h-12 rounded-xl bg-gradient-to-l from-[#301809] to-[#723c11] hover:from-[#4a250e] hover:to-[#b87a29] text-[#fae1b7] font-thmanyah font-bold cursor-pointer shadow-sm"
                  >
                    {savingProfile ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      'حفظ وتحديث الملف التعريفي للجمعية'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Broadcast Notification Tab */}
          <TabsContent
            value="broadcast"
            className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Broadcast Form */}
              <Card className="lg:col-span-7 shadow-sm border border-[#e3d4b8] rounded-3xl bg-white overflow-hidden">
                <div className="bg-gradient-to-l from-[#301809] via-[#4a250e] to-[#2b1507] text-white p-6">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-[#efa83f]/20 border border-[#efa83f]/40 flex items-center justify-center text-[#efa83f] shrink-0">
                      <Megaphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-thmanyah font-bold text-[#fae1b7]">
                        بث تنبيه مباشر للمجتمع
                      </h3>
                      <p className="text-xs text-[#dbc397] font-medium mt-0.5">
                        يصل هذا الإشعار كتنبيه فوري لكافة زوار ومشاركي المنصة النشطين.
                      </p>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6 md:p-7">
                  <form onSubmit={handleSendBroadcast} className="space-y-5 text-right">
                    <div className="space-y-1.5">
                      <Label htmlFor="broadcast-title" className="font-bold text-xs text-[#301809]">
                        عنوان التنبيه
                      </Label>
                      <Input
                        id="broadcast-title"
                        required
                        value={broadcastTitle}
                        onChange={(e) => setBroadcastTitle(e.target.value)}
                        placeholder="مثال: انطلاق التسجيل في ورشة الخط العربي"
                        className="h-11 font-bold border border-[#dbc397] bg-[#fdfbf7] rounded-xl focus-visible:border-[#b87a29]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="broadcast-body" className="font-bold text-xs text-[#301809]">
                        نص التنبيه (رسالة الإشعار)
                      </Label>
                      <Textarea
                        id="broadcast-body"
                        required
                        value={broadcastBody}
                        onChange={(e) => setBroadcastBody(e.target.value)}
                        placeholder="اكتب رسالة الإشعار بالتفصيل هنا. ستظهر على شاشات هواتف الزوار..."
                        rows={5}
                        className="font-medium border border-[#dbc397] bg-[#fdfbf7] rounded-xl focus-visible:border-[#b87a29]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="broadcast-url" className="font-bold text-xs text-[#301809]">
                        رابط التوجيه (اختياري)
                      </Label>
                      <Input
                        id="broadcast-url"
                        value={broadcastUrl}
                        onChange={(e) => setBroadcastUrl(e.target.value)}
                        placeholder="مثال: /event/123"
                        dir="ltr"
                        className="h-11 font-sans text-left border border-[#dbc397] bg-[#fdfbf7] rounded-xl focus-visible:border-[#b87a29]"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={broadcasting}
                      className="w-full h-12 text-sm font-thmanyah font-bold bg-gradient-to-l from-[#b87a29] to-[#efa83f] hover:from-[#723c11] hover:to-[#b87a29] text-[#301809] hover:text-white shadow-sm rounded-xl gap-2 mt-2 cursor-pointer transition-all"
                    >
                      {broadcasting ? (
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                      ) : (
                        <>
                          <Send className="w-4 h-4 ml-1" />
                          <span>بث التنبيه فوراً للهواتف</span>
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Mobile Phone Mockup Preview */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <span className="text-xs font-bold text-[#723c11] mb-4 flex items-center gap-2 bg-white border border-[#dbc397] px-4 py-1.5 rounded-full shadow-xs">
                  <Smartphone className="w-4 h-4 text-[#b87a29]" />
                  معاينة الإشعار على هاتف المستخدم
                </span>

                <div className="w-full max-w-[300px] aspect-[9/18] bg-[#1a0c04] rounded-[40px] p-2.5 shadow-xl border-4 border-[#301809] relative overflow-hidden ring-4 ring-[#dbc397]/40">
                  <div className="w-28 h-5 bg-[#301809] absolute top-0 left-1/2 -translate-x-1/2 rounded-b-2xl z-20 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-stone-900 border border-white/10" />
                  </div>

                  <div className="w-full h-full bg-gradient-to-b from-[#251206] via-[#301809] to-[#1a0c04] rounded-[32px] p-4 flex flex-col justify-between relative text-right">
                    <div className="flex justify-between items-center text-[10px] text-[#fae1b7]/60 font-sans pt-1">
                      <span>12:00</span>
                      <span>4G</span>
                    </div>

                    {/* Simulated Banner */}
                    <div className="mt-8">
                      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-xl border border-[#dbc397] text-slate-800 text-right">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[10px] font-bold text-[#723c11] flex items-center gap-1 bg-[#fae1b7]/60 px-2 py-0.5 rounded-md border border-[#dbc397]">
                            <Bell className="w-3 h-3 text-[#b87a29]" />
                            تواصل صحراء
                          </span>
                          <span className="text-[9px] text-slate-400 font-semibold">الآن</span>
                        </div>
                        <h5 className="font-bold text-xs text-[#301809] truncate mt-1">
                          {broadcastTitle
                            ? `${assocName || 'الجمعية'}: ${broadcastTitle}`
                            : 'عنوان الإشعار يظهر هنا'}
                        </h5>
                        <p className="text-[10px] text-[#723c11] mt-1 font-medium leading-relaxed break-words line-clamp-3">
                          {broadcastBody ||
                            'محتوى رسالة الإشعار كما تكتبه في النموذج سيظهر هنا في شاشة هاتف المستخدم...'}
                        </p>
                      </div>
                    </div>

                    <div className="text-center text-[#fae1b7]/35 text-[10px] font-medium mb-3">
                      حرك للأعلى لإلغاء القفل
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent
          className="font-sans border border-[#dbc397] rounded-3xl bg-white max-w-md"
          dir="rtl"
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-thmanyah font-bold text-[#301809]">
              تغيير كلمة المرور
            </DialogTitle>
            <DialogDescription className="text-xs text-[#723c11] font-medium mt-1">
              أدخل كلمة المرور الجديدة الخاصة بحساب ممثل الجمعية.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdatePassword} className="space-y-4 pt-3 text-right">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#301809]">كلمة المرور الجديدة</Label>
              <Input
                type="password"
                required
                placeholder="6 أحرف على الأقل..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-11 border border-[#dbc397] rounded-xl focus-visible:border-[#b87a29]"
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
                className="h-11 border border-[#dbc397] rounded-xl focus-visible:border-[#b87a29]"
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
                className="flex-1 rounded-xl h-11 bg-gradient-to-l from-[#b87a29] to-[#efa83f] text-[#301809] font-thmanyah font-bold cursor-pointer"
              >
                {isUpdatingPassword ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  'حفظ التغيير'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* QR Check-in Modal */}
      {checkinData && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
          dir="rtl"
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-6 border border-[#dbc397] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-l from-[#301809] via-[#4a250e] to-[#2b1507] text-white px-6 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-thmanyah font-bold text-[#efa83f]">
                  تسجيل الحضور برمز QR
                </h2>
                <p className="text-[#fae1b7] text-xs mt-0.5 line-clamp-1">
                  {checkinData.event.title}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-[#efa83f]/20 border border-[#efa83f]/40 px-3 py-1.5 rounded-full text-xs font-bold text-[#fae1b7]">
                  {checkedIn.size} / {checkinData.rsvps.length} حضور
                </div>
                <button
                  onClick={() => setCheckinData(null)}
                  className="text-white/70 hover:text-white cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Attendee list with QR codes */}
            <div className="p-5 space-y-3 max-h-[65vh] overflow-y-auto custom-scrollbar">
              {checkinData.rsvps.length === 0 ? (
                <div className="text-center py-12 text-[#723c11] font-bold">
                  لا يوجد مسجلون في هذه الفعالية بعد
                </div>
              ) : (
                checkinData.rsvps.map((rsvp: any) => {
                  const ticketId = `OUARJLANE::${checkinData.event.id}::${
                    rsvp.id || rsvp.user_id
                  }`;
                  const isChecked = checkedIn.has(rsvp.user_id);
                  const contact = parseUserContact(rsvp.users?.full_name, rsvp.users?.email);
                  return (
                    <div
                      key={rsvp.user_id}
                      className={`flex items-center gap-4 p-3.5 rounded-2xl border transition-all ${
                        isChecked
                          ? 'border-emerald-400 bg-emerald-50/70'
                          : 'border-[#e3d4b8] bg-[#fdfbf7] hover:border-[#b87a29]'
                      }`}
                    >
                      {/* QR Code */}
                      <div className="shrink-0 bg-white p-2 rounded-xl border border-[#dbc397]">
                        <QRCodeSVG
                          value={ticketId}
                          size={60}
                          fgColor={isChecked ? '#16a34a' : '#301809'}
                          bgColor="#ffffff"
                          level="M"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-[#301809] truncate text-sm">
                            {contact.name}
                          </p>
                          {contact.phone && (
                            <span
                              dir="ltr"
                              className="text-[11px] font-mono bg-[#fae1b7]/60 text-[#301809] px-2 py-0.5 rounded-md border border-[#dbc397]"
                            >
                              {contact.phone}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#723c11]/80 truncate">{rsvp.users?.email}</p>
                        <p className="font-mono text-[10px] text-slate-400 mt-1">
                          #{ticketId.slice(-8).toUpperCase()}
                        </p>
                      </div>

                      {/* Check-in toggle */}
                      <button
                        onClick={() => {
                          setCheckedIn((prev) => {
                            const next = new Set(prev);
                            if (next.has(rsvp.user_id)) next.delete(rsvp.user_id);
                            else next.add(rsvp.user_id);
                            return next;
                          });
                        }}
                        className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-white border border-[#dbc397] text-[#723c11] hover:bg-[#fae1b7]/40'
                        }`}
                      >
                        <CheckCircle2 size={20} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#e3d4b8] bg-[#fdfbf7] flex justify-between items-center">
              <p className="text-xs text-[#723c11] font-medium">
                اضغط على علامة التحقق لتأكيد حضور المشارك عند مدخل الفعالية
              </p>
              <Button
                onClick={() => setCheckinData(null)}
                className="bg-gradient-to-l from-[#b87a29] to-[#efa83f] text-[#301809] rounded-xl text-xs font-thmanyah font-bold cursor-pointer"
              >
                إغلاق
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
