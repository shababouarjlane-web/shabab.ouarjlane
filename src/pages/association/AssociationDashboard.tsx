import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { useNavigate } from 'react-router-dom';
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
  History as HistoryIcon, 
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
  ArrowRight,
  Search,
  Sparkles,
  Ticket,
  Building2
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';
import { PrintableEventReport } from '../../components/PrintableEventReport';
import { QRCodeSVG } from 'qrcode.react';
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
  const [assocName, setAssocName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Printing State
  const [reportData, setReportData] = useState<{ event: any, rsvps: any[] } | null>(null);
  const reportRef = React.useRef<HTMLDivElement>(null);

  // QR Check-in State
  const [checkinData, setCheckinData] = useState<{ event: any, rsvps: any[] } | null>(null);
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
        password: newPassword
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
        config: { broadcast: { ack: true } }
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
                url: broadcastUrl || undefined
              }
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: assoc } = await supabase
        .from('associations')
        .select('id, name')
        .eq('manager_id', user.id)
        .single();

      if (assoc) {
        setAssocName(assoc.name);
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

  const handleArchiveToggle = async (e: React.MouseEvent, eventId: string, currentStatus: string) => {
    e.stopPropagation();
    const newStatus = currentStatus === 'archived' ? 'active' : 'archived';
    
    const previousEvents = [...events];
    setEvents(events.map(ev => ev.id === eventId ? { ...ev, status: newStatus } : ev));
    
    try {
      const { error } = await supabase.from('events').update({ status: newStatus }).eq('id', eventId);
      if (error) throw error;
      toast.success(newStatus === 'archived' ? 'تمت أرشفة الفعالية بنجاح' : 'تم استعادة الفعالية بنجاح');
    } catch (error: any) {
      setEvents(previousEvents);
      toast.error('حدث خطأ أثناء تحديث حالة الفعالية');
    }
  };

  const handleDeleteEvent = async (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذه الفعالية نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      return;
    }

    const previousEvents = [...events];
    setEvents(events.filter(ev => ev.id !== eventId));
    
    try {
      const { error } = await supabase.from('events').delete().eq('id', eventId);
      if (error) throw error;
      toast.success('تم حذف الفعالية بنجاح');
    } catch (error: any) {
      setEvents(previousEvents);
      toast.error('حدث خطأ أثناء حذف الفعالية');
    }
  };

  const activeEvents = events.filter(e => e.status !== 'archived');
  const archivedEvents = events.filter(e => e.status === 'archived');
  const totalRsvps = events.reduce((acc, ev) => acc + (ev.rsvps?.[0]?.count || 0), 0);

  const filteredActiveEvents = activeEvents.filter(e => 
    e.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (e.location && e.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const filteredArchivedEvents = archivedEvents.filter(e => 
    e.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (e.location && e.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'Heritage': return 'bg-[#fae1b7] text-[#723c11] border-[#dbc397]';
      case 'Sports': return 'bg-amber-100/90 text-amber-900 border-amber-300';
      case 'Educational': return 'bg-stone-100 text-stone-800 border-stone-300';
      case 'Religious': return 'bg-[#fae1b7]/80 text-[#301809] border-[#d4b174]';
      case 'Cultural': return 'bg-orange-100/80 text-orange-900 border-orange-300';
      default: return 'bg-[#fdfbf7] text-[#723c11] border-[#dbc397]';
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

  const renderEventCard = (event: any) => (
    <Card 
      key={event.id} 
      className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-[#dbc397]/60 hover:border-[#b87a29] rounded-3xl shadow-md group cursor-pointer flex flex-col h-full relative bg-white" 
      onClick={() => navigate(`/event/${event.id}`)}
    >
      {/* Category Badge */}
      <div className={`absolute top-4 right-4 z-10 px-3 py-1 rounded-full text-xs font-black border shadow-sm ${getCategoryTheme(event.category)}`}>
        {getCategoryLabel(event.category)}
      </div>

      <div className="h-48 overflow-hidden relative bg-[#fdfbf7] flex items-center justify-center border-b border-[#dbc397]/40">
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
        <div className={`${event.cover_image_url ? 'hidden' : ''} image-fallback absolute inset-0 bg-gradient-to-tr from-[#301809] via-[#723c11] to-[#b87a29] flex items-center justify-center text-white flex-col gap-2 p-4 text-center`}>
          <div className="w-12 h-12 rounded-2xl bg-[#efa83f]/20 border border-[#efa83f]/40 flex items-center justify-center text-[#efa83f] text-2xl shadow-sm">
            🏛️
          </div>
          <span className="font-thmanyah font-bold text-lg text-[#fae1b7] drop-shadow-sm tracking-wide">تواصل صحراء</span>
          <span className="text-xs text-[#dbc397] font-bold line-clamp-1">{assocName || 'فعالية جمعية'}</span>
        </div>
      </div>

      <CardContent className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-thmanyah font-bold text-lg text-[#301809] line-clamp-1 flex-1 pr-2">{event.title}</h3>
            
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                event.is_public 
                  ? 'bg-[#fae1b7]/60 text-[#723c11] border-[#dbc397]' 
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {event.is_public ? 'عام' : 'خاص'}
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-[#fae1b7]/30 rounded-xl cursor-pointer">
                    <MoreVertical className="h-4 w-4 text-[#723c11]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 text-right font-sans rounded-2xl border-2 border-[#dbc397] p-1.5 shadow-xl bg-white" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem 
                    className="flex justify-between items-center px-3 py-2 rounded-xl text-xs font-bold text-[#723c11] hover:bg-[#fae1b7]/40 cursor-pointer"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const { data } = await supabase
                          .from('rsvps')
                          .select('*, users(email)')
                          .eq('event_id', event.id)
                          .eq('status', 'attending');
                        
                        setReportData({ event, rsvps: data || [] });
                      } catch (err) {
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
                          .select('id, user_id, users(email)')
                          .eq('event_id', event.id)
                          .eq('status', 'attending');
                        setCheckedIn(new Set());
                        setCheckinData({ event, rsvps: data || [] });
                      } catch (err) {
                        toast.error('خطأ في تحميل قائمة الحضور');
                      }
                    }}
                  >
                    <span>تسجيل الحضور QR</span>
                    <QrCode className="w-4 h-4 text-[#efa83f]" />
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
                    {event.status === 'archived' ? <ArchiveRestore className="w-4 h-4 text-[#b87a29]" /> : <Archive className="w-4 h-4 text-[#b87a29]" />}
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

          <div className="space-y-2.5 mt-3 text-xs text-[#723c11]">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[#b87a29] shrink-0" />
              <span className="font-semibold">{event.date} • {event.start_time?.substring(0,5)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#b87a29] shrink-0" />
              <span className="truncate font-medium">{event.location || 'ورقلة'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#dbc397]/40 pt-3 mt-4 text-xs">
          <span className="text-[#723c11]/80 font-bold">المشاركون:</span>
          <span className="font-black text-[#301809] bg-[#fae1b7]/60 border border-[#dbc397] px-2.5 py-1 rounded-xl flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#b87a29]" />
            {event.rsvps?.[0]?.count || 0} مسجل
          </span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-[#301809] pb-16" dir="rtl">
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

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b-2 border-[#dbc397]/60 shadow-xs">
        <div className="container mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
          
          {/* Association Brand & Name */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#301809] to-[#723c11] border border-[#dbc397] flex items-center justify-center text-[#efa83f] font-black text-xl shadow-sm shrink-0">
              {assocName ? assocName.charAt(0) : '🏛️'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base md:text-xl font-thmanyah font-bold text-[#301809]">
                  {assocName || 'مساحة الجمعية'}
                </h1>
                <span className="bg-[#fae1b7] text-[#723c11] border border-[#d4b174] text-[10px] font-black px-2 py-0.5 rounded-full hidden sm:inline-block">
                  ممثل جمعية
                </span>
              </div>
              <p className="text-xs text-[#723c11]/80 font-medium hidden sm:block">
                إدارة الفعاليات وتوثيق الحضور والتواصل مع أهالي ورقلة
              </p>
            </div>
          </div>

          {/* Quick Actions & Settings Gear */}
          <div className="flex items-center gap-2 md:gap-3">
            <Button
              onClick={() => navigate('/association/create-event')}
              className="bg-gradient-to-r from-[#b87a29] to-[#efa83f] hover:from-[#723c11] hover:to-[#b87a29] text-white font-bold h-10 px-4 rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2 text-xs md:text-sm"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>إنشاء فعالية جديدة</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate('/heritage')}
              className="border-2 border-[#dbc397] text-[#723c11] hover:bg-[#fae1b7]/40 h-10 px-3 md:px-4 rounded-xl font-bold cursor-pointer hidden md:flex items-center gap-1.5 text-xs md:text-sm"
            >
              <HistoryIcon className="w-4 h-4 text-[#b87a29]" />
              <span>الأرشيف التراثي</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="border-2 border-[#dbc397] text-[#723c11] hover:bg-[#fae1b7]/40 h-10 px-3 md:px-4 rounded-xl font-bold cursor-pointer hidden sm:flex items-center gap-1.5 text-xs md:text-sm"
            >
              <span>الموقع الرئيسي</span>
              <ArrowRight className="w-4 h-4 text-[#b87a29]" />
            </Button>

            {/* Gear Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-10 h-10 rounded-xl border-2 border-[#dbc397] bg-white hover:bg-[#fae1b7]/40 text-[#301809] cursor-pointer"
                  title="إعدادات الحساب"
                >
                  <Settings className="w-5 h-5 text-[#723c11]" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="start"
                sideOffset={8}
                className="w-60 bg-white/95 backdrop-blur-md rounded-2xl border-2 border-[#dbc397] p-1.5 shadow-2xl font-sans text-right"
              >
                <DropdownMenuLabel className="px-3 py-2 text-right">
                  <p className="text-xs font-black text-[#301809]">حساب الجمعية</p>
                  <p className="text-[10px] text-slate-500 font-mono truncate mt-0.5">{assocName || 'Association Manager'}</p>
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="bg-[#dbc397]/50 my-1" />

                <DropdownMenuItem
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-[#723c11] hover:bg-[#fae1b7]/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-[#b87a29]" />
                    <span>تغيير كلمة المرور</span>
                  </div>
                  <span className="text-[10px]">🔑</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => navigate('/heritage')}
                  className="md:hidden flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-[#723c11] hover:bg-[#fae1b7]/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <HistoryIcon className="w-4 h-4 text-[#b87a29]" />
                    <span>الأرشيف التراثي</span>
                  </div>
                  <span className="text-[10px]">🏺</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => navigate('/')}
                  className="sm:hidden flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-[#723c11] hover:bg-[#fae1b7]/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-[#b87a29]" />
                    <span>الانتقال للموقع الرئيسي</span>
                  </div>
                  <span className="text-[10px]">🌐</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-[#dbc397]/50 my-1" />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>تسجيل الخروج</span>
                  </div>
                  <span className="text-[10px] text-red-400">خروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 md:px-8 pt-8 space-y-8">

        {/* Association KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Card 1: Active Events */}
          <div className="relative overflow-hidden bg-white rounded-3xl p-6 border-2 border-[#dbc397]/50 shadow-md hover:shadow-xl hover:border-[#b87a29] transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#723c11] uppercase tracking-wider">الفعاليات النشطة</span>
              <div className="w-12 h-12 rounded-2xl bg-[#fae1b7]/40 border border-[#dbc397] flex items-center justify-center text-[#723c11] shadow-xs group-hover:scale-110 transition-transform">
                <CalendarIcon className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-4xl md:text-5xl font-black text-[#301809] tracking-tight">{activeEvents.length}</span>
              <span className="text-xs font-bold text-[#723c11] bg-[#fae1b7]/60 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#b87a29]" /> نشطة
              </span>
            </div>
            <div className="mt-3 h-1.5 w-full bg-[#fae1b7]/30 rounded-full overflow-hidden">
              <div className="h-full bg-[#b87a29] rounded-full" style={{ width: '100%' }} />
            </div>
          </div>

          {/* Card 2: Total RSVPs */}
          <div className="relative overflow-hidden bg-white rounded-3xl p-6 border-2 border-[#dbc397]/50 shadow-md hover:shadow-xl hover:border-[#b87a29] transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#723c11] uppercase tracking-wider">تأكيدات الحضور (RSVPs)</span>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-[#b87a29] shadow-xs group-hover:scale-110 transition-transform">
                <Ticket className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-4xl md:text-5xl font-black text-[#301809] tracking-tight">{totalRsvps}</span>
              <span className="text-xs font-bold text-[#b87a29] bg-amber-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> مسجل
              </span>
            </div>
            <div className="mt-3 h-1.5 w-full bg-[#fae1b7]/30 rounded-full overflow-hidden">
              <div className="h-full bg-[#efa83f] rounded-full" style={{ width: '100%' }} />
            </div>
          </div>

          {/* Card 3: Archived Events */}
          <div className="relative overflow-hidden bg-white rounded-3xl p-6 border-2 border-[#dbc397]/50 shadow-md hover:shadow-xl hover:border-[#b87a29] transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#723c11] uppercase tracking-wider">الفعاليات السابقة / الأرشيف</span>
              <div className="w-12 h-12 rounded-2xl bg-[#fae1b7]/60 border border-[#d4b174] flex items-center justify-center text-[#723c11] shadow-xs group-hover:scale-110 transition-transform">
                <Archive className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-4xl md:text-5xl font-black text-[#301809] tracking-tight">{archivedEvents.length}</span>
              <span className="text-xs font-bold text-[#723c11] bg-[#fae1b7]/60 px-2.5 py-1 rounded-full flex items-center gap-1">
                مؤرشفة
              </span>
            </div>
            <div className="mt-3 h-1.5 w-full bg-[#fae1b7]/30 rounded-full overflow-hidden">
              <div className="h-full bg-[#723c11] rounded-full" style={{ width: '100%' }} />
            </div>
          </div>

          {/* Card 4: Total Events Created */}
          <div className="relative overflow-hidden bg-white rounded-3xl p-6 border-2 border-[#dbc397]/50 shadow-md hover:shadow-xl hover:border-[#b87a29] transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#723c11] uppercase tracking-wider">إجمالي كافة الفعاليات</span>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#301809] to-[#723c11] border border-[#dbc397] flex items-center justify-center text-[#efa83f] shadow-xs group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-4xl md:text-5xl font-black text-[#301809] tracking-tight">{events.length}</span>
              <span className="text-xs font-bold text-[#efa83f] bg-[#301809] px-2.5 py-1 rounded-full flex items-center gap-1">
                فعالية
              </span>
            </div>
            <div className="mt-3 h-1.5 w-full bg-[#fae1b7]/30 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#b87a29] to-[#efa83f] rounded-full" style={{ width: '100%' }} />
            </div>
          </div>
        </div>

        {/* Toolbar: Search & Filter */}
        <div className="bg-white border-2 border-[#dbc397]/60 rounded-3xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b87a29]" />
            <Input
              type="text"
              placeholder="ابحث في فعاليات الجمعية بالعنوان أو الموقع..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 h-11 bg-[#fdfbf7] border-2 border-[#dbc397] rounded-xl font-medium focus-visible:border-[#b87a29]"
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#723c11] w-full md:w-auto justify-end">
            <span>عدد الفعاليات:</span>
            <span className="bg-[#fae1b7]/60 border border-[#dbc397] px-3 py-1 rounded-xl text-[#301809]">
              {events.length} فعالية
            </span>
          </div>
        </div>

        {/* Tabs System */}
        <Tabs defaultValue="active" className="w-full space-y-6" dir="rtl">
          <TabsList className="bg-white/80 backdrop-blur-md p-1.5 rounded-3xl border-2 border-[#dbc397]/60 shadow-sm h-auto min-h-14 w-full max-w-xl grid grid-cols-3 gap-1.5">
            <TabsTrigger 
              value="active" 
              className="text-xs md:text-sm font-bold rounded-2xl data-[state=active]:bg-[#301809] data-[state=active]:text-[#fae1b7] data-[state=active]:shadow-md py-3 transition-all cursor-pointer"
            >
              ⚡ الفعاليات النشطة ({activeEvents.length})
            </TabsTrigger>
            <TabsTrigger 
              value="archived" 
              className="text-xs md:text-sm font-bold rounded-2xl data-[state=active]:bg-[#301809] data-[state=active]:text-[#fae1b7] data-[state=active]:shadow-md py-3 transition-all cursor-pointer"
            >
              📦 الأرشيف ({archivedEvents.length})
            </TabsTrigger>
            <TabsTrigger 
              value="broadcast" 
              className="text-xs md:text-sm font-bold rounded-2xl data-[state=active]:bg-[#301809] data-[state=active]:text-[#fae1b7] data-[state=active]:shadow-md py-3 transition-all cursor-pointer"
            >
              📣 بث تنبيه للهواتف
            </TabsTrigger>
          </TabsList>

          {/* Active Events Tab */}
          <TabsContent value="active" className="mt-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#723c11]">
                <Loader2 className="w-8 h-8 animate-spin text-[#b87a29]" />
                <p className="font-bold text-sm">جاري تحميل فعاليات الجمعية...</p>
              </div>
            ) : filteredActiveEvents.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center shadow-sm border-2 border-dashed border-[#dbc397] flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-[#fae1b7]/40 border border-[#dbc397] flex items-center justify-center text-[#723c11] mb-4 text-2xl">
                  📅
                </div>
                <h3 className="text-xl font-thmanyah font-bold text-[#301809] mb-2">لا توجد فعاليات نشطة مطابقة</h3>
                <p className="text-xs text-[#723c11]/80 mb-6 max-w-md font-medium">
                  {searchQuery ? 'لم يتم العثور على فعاليات تطابق كلمة البحث.' : 'ابدأ بإنشاء أول فعالية لجمعيتك ودع المجتمع يتعرف على نشاطاتك الرائعة.'}
                </p>
                <Button 
                  onClick={() => navigate('/association/create-event')} 
                  className="bg-gradient-to-r from-[#b87a29] to-[#efa83f] hover:from-[#723c11] hover:to-[#b87a29] text-white font-bold rounded-xl h-12 px-6 shadow-md cursor-pointer transition-all"
                >
                  <CalendarPlus className="w-4 h-4 ml-2" />
                  إنشاء فعالية جديدة
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredActiveEvents.map(renderEventCard)}
              </div>
            )}
          </TabsContent>

          {/* Archived Events Tab */}
          <TabsContent value="archived" className="mt-0">
            {filteredArchivedEvents.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center shadow-sm border-2 border-dashed border-[#dbc397] flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-[#fae1b7]/40 border border-[#dbc397] flex items-center justify-center text-[#723c11] mb-4 text-2xl">
                  📦
                </div>
                <h3 className="text-xl font-thmanyah font-bold text-[#301809] mb-2">الأرشيف فارغ</h3>
                <p className="text-xs text-[#723c11]/80 font-medium">لا توجد فعاليات مؤرشفة في الوقت الحالي.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-90">
                {filteredArchivedEvents.map(renderEventCard)}
              </div>
            )}
          </TabsContent>

          {/* Broadcast Notification Tab */}
          <TabsContent value="broadcast" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Broadcast Form */}
              <Card className="lg:col-span-7 shadow-xl border-2 border-[#dbc397] rounded-3xl bg-white overflow-hidden">
                <div className="bg-gradient-to-br from-[#301809] to-[#723c11] text-white p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#efa83f]/20 border border-[#efa83f]/40 flex items-center justify-center text-[#efa83f] text-2xl shadow-sm shrink-0">
                      📣
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-[#fae1b7] flex items-center gap-2">
                        بث تنبيه مباشر للمجتمع
                      </h3>
                      <p className="text-xs text-[#d4b174] font-medium mt-1">
                        سيصل هذا الإشعار كتنبيه هاتف وتطبيق فوري لكافة زوار ومشاركي المنصة المشتركين.
                      </p>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6 md:p-8">
                  <form onSubmit={handleSendBroadcast} className="space-y-5 text-right">
                    <div className="space-y-1.5">
                      <Label htmlFor="broadcast-title" className="font-bold text-xs text-[#301809]">عنوان التنبيه</Label>
                      <Input 
                        id="broadcast-title"
                        required
                        value={broadcastTitle}
                        onChange={e => setBroadcastTitle(e.target.value)}
                        placeholder="أدخل عنواناً جذاباً (مثال: هام: انطلاق التسجيل في ورشة الخط العربي)"
                        className="h-11 font-bold border-2 border-[#dbc397] rounded-xl focus-visible:border-[#b87a29]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="broadcast-body" className="font-bold text-xs text-[#301809]">نص التنبيه (رسالة الإشعار)</Label>
                      <Textarea 
                        id="broadcast-body"
                        required
                        value={broadcastBody}
                        onChange={e => setBroadcastBody(e.target.value)}
                        placeholder="اكتب رسالة الإشعار بالتفصيل هنا. ستظهر على شاشات هواتف الزوار..."
                        rows={5}
                        className="font-medium border-2 border-[#dbc397] rounded-xl focus-visible:border-[#b87a29]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="broadcast-url" className="font-bold text-xs text-[#301809]">رابط التوجيه (اختياري)</Label>
                      <Input 
                        id="broadcast-url"
                        value={broadcastUrl}
                        onChange={e => setBroadcastUrl(e.target.value)}
                        placeholder="مثال: /event/123 (يفتح صفحة الفعالية مباشرة عند الضغط)"
                        dir="ltr"
                        className="h-11 font-sans text-left border-2 border-[#dbc397] rounded-xl focus-visible:border-[#b87a29]"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      disabled={broadcasting}
                      className="w-full h-12 text-sm font-black bg-gradient-to-r from-[#b87a29] to-[#efa83f] hover:from-[#723c11] hover:to-[#b87a29] text-white shadow-lg rounded-xl gap-2 mt-4 cursor-pointer transition-all"
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
                <span className="text-sm font-black text-[#723c11] mb-4 flex items-center gap-2 bg-[#fae1b7]/50 border border-[#dbc397] px-4 py-1.5 rounded-full">
                  <Smartphone className="w-4 h-4 text-[#b87a29]" />
                  معاينة الإشعار على هاتف المستخدم
                </span>

                <div className="w-full max-w-[320px] aspect-[9/18.5] bg-[#1a0c04] rounded-[44px] p-3 shadow-2xl border-4 border-[#301809] relative overflow-hidden ring-4 ring-[#dbc397]/40">
                  <div className="w-32 h-6 bg-[#301809] absolute top-0 left-1/2 -translate-x-1/2 rounded-b-2xl z-20 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-slate-900 border border-white/10" />
                  </div>
                  
                  <div className="w-full h-full bg-gradient-to-b from-[#251206] via-[#301809] to-[#1a0c04] rounded-[34px] p-4 flex flex-col justify-between relative text-right">
                    <div className="flex justify-between items-center text-[10px] text-[#fae1b7]/60 font-sans pt-1">
                      <span>12:00</span>
                      <span>📶 4G 🔋</span>
                    </div>

                    {/* Simulated Banner */}
                    <div className="mt-8">
                      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border-2 border-[#dbc397] text-slate-800 text-right">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[10px] font-black text-[#723c11] flex items-center gap-1.5 bg-[#fae1b7]/60 px-2 py-0.5 rounded-md border border-[#dbc397]">
                            <Bell className="w-3 h-3 text-[#b87a29] animate-bounce" />
                            تواصل صحراء
                          </span>
                          <span className="text-[8px] text-slate-400 font-bold">الآن</span>
                        </div>
                        <h5 className="font-black text-xs text-[#301809] truncate mt-1">
                          {broadcastTitle ? `${assocName || 'الجمعية'}: ${broadcastTitle}` : 'عنوان الإشعار يظهر هنا'}
                        </h5>
                        <p className="text-[10px] text-[#723c11] mt-1 font-medium leading-relaxed break-words line-clamp-3">
                          {broadcastBody || 'محتوى ونصوص رسالة الإشعار كما قمت بكتابتها في النموذج ستظهر هنا في شاشة هاتف المستخدم...'}
                        </p>
                      </div>
                    </div>

                    <div className="text-center text-[#fae1b7]/30 text-[10px] font-bold mb-4">
                      حرك للأعلى لإلغاء القفل 🔒
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
        <DialogContent className="font-sans border-2 border-[#dbc397] rounded-3xl bg-white max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-thmanyah font-bold text-[#301809]">تغيير كلمة المرور</DialogTitle>
            <DialogDescription className="text-xs text-[#723c11] font-medium mt-1">
              أدخل كلمة المرور الجديدة الخاصة بحساب ممثل الجمعية.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdatePassword} className="space-y-4 pt-4 text-right">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#301809]">كلمة المرور الجديدة</Label>
              <Input
                type="password"
                required
                placeholder="6 أحرف على الأقل..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-11 border-2 border-[#dbc397] rounded-xl focus-visible:border-[#b87a29]"
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
                className="h-11 border-2 border-[#dbc397] rounded-xl focus-visible:border-[#b87a29]"
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
                className="flex-1 rounded-xl h-11 bg-gradient-to-r from-[#b87a29] to-[#efa83f] text-white font-bold cursor-pointer"
              >
                {isUpdatingPassword ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'حفظ التغيير'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* QR Check-in Modal */}
      {checkinData && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-6 border-2 border-[#dbc397] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-br from-[#301809] to-[#723c11] text-white px-6 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-thmanyah font-bold text-[#efa83f]">تسجيل الحضور برمز QR</h2>
                <p className="text-[#fae1b7] text-xs mt-0.5 line-clamp-1">{checkinData.event.title}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-[#efa83f]/20 border border-[#efa83f]/40 px-3 py-1.5 rounded-full text-xs font-black text-[#fae1b7]">
                  ✓ {checkedIn.size} / {checkinData.rsvps.length} حضور
                </div>
                <button onClick={() => setCheckinData(null)} className="text-white/60 hover:text-white cursor-pointer">
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Attendee list with QR codes */}
            <div className="p-5 space-y-3 max-h-[65vh] overflow-y-auto custom-scrollbar">
              {checkinData.rsvps.length === 0 ? (
                <div className="text-center py-12 text-[#723c11] font-bold">لا يوجد مسجلون في هذه الفعالية بعد</div>
              ) : (
                checkinData.rsvps.map((rsvp: any) => {
                  const ticketId = `OUARJLANE::${checkinData.event.id}::${rsvp.id || rsvp.user_id}`;
                  const isChecked = checkedIn.has(rsvp.user_id);
                  return (
                    <div
                      key={rsvp.user_id}
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                        isChecked
                          ? 'border-emerald-400 bg-emerald-50/70'
                          : 'border-[#dbc397]/60 bg-[#fdfbf7] hover:border-[#b87a29]'
                      }`}
                    >
                      {/* QR Code */}
                      <div className="shrink-0 bg-white p-2 rounded-xl border border-[#dbc397] shadow-xs">
                        <QRCodeSVG
                          value={ticketId}
                          size={64}
                          fgColor={isChecked ? '#16a34a' : '#301809'}
                          bgColor="#ffffff"
                          level="M"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#301809] truncate text-sm">
                          {rsvp.users?.email?.split('@')[0] || 'مشارك'}
                        </p>
                        <p className="text-xs text-[#723c11]/80 truncate">{rsvp.users?.email}</p>
                        <p className="font-mono text-[10px] text-slate-400 mt-1">
                          #{ticketId.slice(-8).toUpperCase()}
                        </p>
                      </div>

                      {/* Check-in toggle */}
                      <button
                        onClick={() => {
                          setCheckedIn(prev => {
                            const next = new Set(prev);
                            if (next.has(rsvp.user_id)) next.delete(rsvp.user_id);
                            else next.add(rsvp.user_id);
                            return next;
                          });
                        }}
                        className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
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
            <div className="px-6 py-4 border-t border-[#dbc397]/50 bg-[#fdfbf7] flex justify-between items-center">
              <p className="text-xs text-[#723c11] font-semibold">
                💡 اضغط على الزر لتأكيد حضور كل مشارك عند مدخل الفعالية
              </p>
              <Button
                onClick={() => setCheckinData(null)}
                className="bg-gradient-to-r from-[#b87a29] to-[#efa83f] hover:from-[#723c11] hover:to-[#b87a29] text-white rounded-xl text-xs font-bold cursor-pointer"
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
