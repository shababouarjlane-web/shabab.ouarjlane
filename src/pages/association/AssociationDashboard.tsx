import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import { CalendarPlus, Calendar as CalendarIcon, MapPin, Users, Archive, ArchiveRestore, Trash2, Edit, FileDown, History as HistoryIcon, MoreVertical, Megaphone, Send, Smartphone, Bell, Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';
import { PrintableEventReport } from '../../components/PrintableEventReport';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

export default function AssociationDashboard() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assocName, setAssocName] = useState<string>('');
  
  // Printing State
  const [reportData, setReportData] = useState<{ event: any, rsvps: any[] } | null>(null);
  const reportRef = React.useRef<HTMLDivElement>(null);
  
  // Broadcast Notification States
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastUrl, setBroadcastUrl] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

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
                title: `${assocName}: ${broadcastTitle}`,
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
      setReportData(null); // Reset after printing
    }
  }, [reportData]);

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      // First get the association ID for the current manager
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: assoc } = await supabase
        .from('associations')
        .select('id, name')
        .eq('manager_id', user.id)
        .single();

      if (assoc) {
        setAssocName(assoc.name);
        // Now fetch events for this association
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
    
    // optimistic update
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

  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'Heritage': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Sports': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Educational': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Religious': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Cultural': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
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
    <Card key={event.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 shadow-md group cursor-pointer flex flex-col h-full relative" onClick={() => navigate(`/event/${event.id}`)}>
      {/* Category Badge */}
      <div className={`absolute top-4 right-4 z-10 px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${getCategoryTheme(event.category)}`}>
        {getCategoryLabel(event.category)}
      </div>

      <div className="h-48 overflow-hidden relative bg-emerald-50 flex items-center justify-center">
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
        <div className={`${event.cover_image_url ? 'hidden' : ''} image-fallback absolute inset-0 bg-gradient-to-tr from-emerald-500 to-amber-400 opacity-90 flex items-center justify-center text-white flex-col gap-2`}>
          <span className="font-bold text-xl drop-shadow-md">Sahara Connect</span>
          <CalendarIcon size={24} className="opacity-50" />
        </div>
      </div>
      <CardContent className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-xl line-clamp-1 flex-1 pr-2">{event.title}</h3>
          
          <div className="flex items-center gap-2">
            <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md ${event.is_public ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
              {event.is_public ? 'عام' : 'خاص'}
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full">
                  <MoreVertical className="h-5 w-5 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 text-right font-medium" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem 
                  className="flex justify-end gap-2 cursor-pointer text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50"
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
                  <span>تقرير</span>
                  <FileDown className="w-4 h-4" />
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  className="flex justify-end gap-2 cursor-pointer text-blue-600 focus:text-blue-700 focus:bg-blue-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/association/edit-event/${event.id}`);
                  }}
                >
                  <span>تعديل</span>
                  <Edit className="w-4 h-4" />
                </DropdownMenuItem>

                <DropdownMenuItem 
                  className="flex justify-end gap-2 cursor-pointer text-amber-600 focus:text-amber-700 focus:bg-amber-50"
                  onClick={(e) => handleArchiveToggle(e, event.id, event.status)}
                >
                  <span>{event.status === 'archived' ? 'استعادة' : 'أرشفة'}</span>
                  {event.status === 'archived' ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                </DropdownMenuItem>

                <DropdownMenuItem 
                  className="flex justify-end gap-2 cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
                  onClick={(e) => handleDeleteEvent(e, event.id)}
                >
                  <span>حذف</span>
                  <Trash2 className="w-4 h-4" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="space-y-2 mt-4 text-sm text-gray-600 flex-1">
          <div className="flex items-center">
            <CalendarIcon className="w-4 h-4 ml-2 text-emerald-600" />
            <span>{event.date} • {event.start_time?.substring(0,5)}</span>
          </div>
          <div className="flex items-center">
            <MapPin className="w-4 h-4 ml-2 text-amber-600" />
            <span className="truncate">{event.location}</span>
          </div>
          <div className="flex items-center border-t pt-3 mt-3">
            <Users className="w-4 h-4 ml-2 text-blue-600" />
            <span className="font-semibold">{event.rsvps?.[0]?.count || 0} مشارك محتمل</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6" dir="rtl">
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-2xl font-black shadow-md border-4 border-emerald-50">
            {assocName ? assocName.charAt(0) : 'ج'}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 to-emerald-500">
              مساحة الجمعية: <span className="text-gray-800">{assocName || '...'}</span>
            </h1>
            <p className="text-gray-500 mt-1 font-medium">أدر فعالياتك وتواصل مع المجتمع بكل سهولة</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/heritage')} 
            className="border-amber-200 text-amber-700 hover:bg-amber-50 h-10 px-4 rounded-xl flex items-center gap-2"
          >
            <HistoryIcon className="w-5 h-5" />
            الأرشيف التراثي
          </Button>
          <Button onClick={() => navigate('/association/create-event')} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg">
            <CalendarPlus className="mr-2 h-5 w-5" />
            إنشاء فعالية جديدة
          </Button>
          <Button variant="outline" onClick={() => supabase.auth.signOut()}>
            خروج
          </Button>
        </div>
      </div>

      <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-emerald-600 to-amber-600 pb-2">
        الفعاليات القادمة والسابقة
      </h2>

      <Tabs defaultValue="active" className="w-full" dir="rtl">
        <TabsList className="mb-6 bg-slate-100 p-1 rounded-xl h-12 w-full max-w-xl flex flex-row-reverse">
          <TabsTrigger value="active" className="flex-1 text-base font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">
            الفعاليات النشطة ({activeEvents.length})
          </TabsTrigger>
          <TabsTrigger value="archived" className="flex-1 text-base font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-sm">
            الأرشيف ({archivedEvents.length})
          </TabsTrigger>
          <TabsTrigger value="broadcast" className="flex-1 text-base font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">
            بث إشعار للهواتف 📣
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-0">
          {loading ? (
            <div className="text-center text-gray-500 py-12">جاري التحميل...</div>
          ) : activeEvents.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-dashed border-gray-300 flex flex-col items-center justify-center">
              <div className="bg-emerald-100 p-4 rounded-full text-emerald-600 mb-4">
                <CalendarIcon size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">لا توجد فعاليات نشطة!</h3>
              <p className="text-gray-500 mb-6 max-w-md">ابدأ بإنشاء أول فعالية لجمعيتك ودع المجتمع يتعرف على نشاطاتك الرائعة.</p>
              <Button onClick={() => navigate('/association/create-event')} className="bg-emerald-600 hover:bg-emerald-700">
                إنشاء فعالية جديدة
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeEvents.map(renderEventCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="archived" className="mt-0">
          {archivedEvents.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-dashed border-gray-300 flex flex-col items-center justify-center">
              <div className="bg-gray-100 p-4 rounded-full text-gray-400 mb-4">
                <Archive size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">الأرشيف فارغ!</h3>
              <p className="text-gray-500">لا توجد فعاليات مؤرشفة في الوقت الحالي.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
              {archivedEvents.map(renderEventCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="broadcast" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Broadcast Form */}
            <Card className="lg:col-span-7 shadow-xl border-none rounded-3xl bg-white overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-700 to-blue-600 text-white p-6">
                <CardTitle className="text-xl font-black flex items-center gap-2">
                  <Megaphone className="h-6 w-6" />
                  بث تنبيه مباشر للمجتمع
                </CardTitle>
                <p className="text-xs text-blue-100 font-medium mt-1">
                  سيصل هذا الإشعار كـ تنبيه هاتف أصيل (Push Notification) لكل زوار ومشاركي المنصة المشتركين.
                </p>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleSendBroadcast} className="space-y-6 text-right">
                  <div className="space-y-2">
                    <Label htmlFor="broadcast-title" className="font-bold text-slate-700">عنوان التنبيه</Label>
                    <Input 
                      id="broadcast-title"
                      required
                      value={broadcastTitle}
                      onChange={e => setBroadcastTitle(e.target.value)}
                      placeholder="أدخل عنواناً جذاباً ومختصراً (مثال: هام: تم تغيير موقع الفعالية)"
                      className="h-12 font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="broadcast-body" className="font-bold text-slate-700">محتوى التنبيه (رسالة الإشعار)</Label>
                    <Textarea 
                      id="broadcast-body"
                      required
                      value={broadcastBody}
                      onChange={e => setBroadcastBody(e.target.value)}
                      placeholder="اكتب رسالة الإشعار بالتفصيل هنا. ستظهر على شاشة قفل الهاتف للزوار..."
                      rows={5}
                      className="font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="broadcast-url" className="font-bold text-slate-700">رابط التوجيه (اختياري)</Label>
                    <Input 
                      id="broadcast-url"
                      value={broadcastUrl}
                      onChange={e => setBroadcastUrl(e.target.value)}
                      placeholder="مثال: /event/your-event-id (سيتم فتح الرابط عند النقر على الإشعار)"
                      dir="ltr"
                      className="h-12 font-sans text-left"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={broadcasting}
                    className="w-full h-14 text-lg font-black bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/10 rounded-2xl gap-2 mt-4"
                  >
                    {broadcasting ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>بث التنبيه فوراً للهواتف</span>
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Mobile Phone Mockup Preview */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <span className="text-sm font-black text-slate-500 mb-4 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                معاينة الإشعار على هاتف المستخدم
              </span>

              <div className="w-full max-w-[320px] aspect-[9/18.5] bg-slate-950 rounded-[40px] p-3 shadow-2xl border-4 border-slate-800 relative overflow-hidden">
                <div className="w-32 h-6 bg-slate-800 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-2xl z-20" />
                
                <div className="w-full h-full bg-gradient-to-b from-slate-900 to-slate-950 rounded-[32px] p-4 flex flex-col justify-between relative text-right">
                  <div className="flex justify-between items-center text-[10px] text-white/40 font-sans">
                    <span>الآن</span>
                    <span>📶🔋</span>
                  </div>

                  {/* Simulated Banner */}
                  <div className="mt-6">
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-blue-500/20 text-slate-800 text-right">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-black text-blue-700 flex items-center gap-1">
                          <Bell className="w-3 h-3 text-blue-600 animate-bounce" />
                          تواصل صحراء
                        </span>
                        <span className="text-[8px] text-slate-400">الآن</span>
                      </div>
                      <h5 className="font-black text-xs text-slate-900 truncate">
                        {broadcastTitle ? `${assocName}: ${broadcastTitle}` : 'عنوان الإشعار يظهر هنا'}
                      </h5>
                      <p className="text-[10px] text-slate-500 mt-1 font-medium leading-relaxed break-words line-clamp-3">
                        {broadcastBody || 'محتوى ونصوص رسالة الإشعار كما قمت بكتابتها في النموذج ستظهر هنا في شاشة الهاتف...'}
                      </p>
                    </div>
                  </div>

                  <div className="text-center text-white/20 text-[9px] mb-4">
                    حرك للأعلى لإلغاء القفل
                  </div>
                </div>
              </div>
            </div>

          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
