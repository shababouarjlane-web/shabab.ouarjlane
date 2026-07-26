import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { Users, Building2, Calendar, Ticket, ChevronDown, ChevronUp, History, Plus, Trash2, Megaphone, Link as LinkIcon, Edit, Smartphone, Send, Loader2, Bell } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Textarea } from '../../components/ui/textarea';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '../../components/ui/dialog';

interface DashboardStats {
  total_users: number;
  total_associations: number;
  total_events: number;
  total_rsvps: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    total_users: 0,
    total_associations: 0,
    total_events: 0,
    total_rsvps: 0
  });

  const [assocName, setAssocName] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [associationsDetails, setAssociationsDetails] = useState<any[]>([]);
  const [expandedAssocId, setExpandedAssocId] = useState<string | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<any[]>([]);

  // Heritage & Ads State
  const [heritageItems, setHeritageItems] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  
  const [newHeritage, setNewHeritage] = useState({ title: '', content: '', image_url: '' });
  const [editingHeritage, setEditingHeritage] = useState<any | null>(null);
  const [isHeritageEditOpen, setIsHeritageEditOpen] = useState(false);
  
  const [newAd, setNewAd] = useState({ partner_name: '', image_url: '', link: '' });
  const [adFile, setAdFile] = useState<File | null>(null);
  const [adUploading, setAdUploading] = useState(false);

  // Broadcast Notification States
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastUrl, setBroadcastUrl] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const [notificationHistory, setNotificationHistory] = useState<any[]>([]);

  // Password Reset State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordUpdating, setPasswordUpdating] = useState(false);

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
                title: `إدارة المنصة: ${broadcastTitle}`,
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

      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        const { error: insertError } = await supabase.from('notifications_history').insert({
          title: broadcastTitle,
          body: broadcastBody,
          url: broadcastUrl || null,
          sent_by: userData.user.id
        });
        
        if (insertError) {
          console.error("Insert history error:", insertError);
          toast.error("لم يتم حفظ الإشعار في الأرشيف: " + insertError.message);
        } else {
          fetchNotificationHistory();
        }
      } else {
        console.warn("User not authenticated, skipping history insert.");
        toast.error("لم يتم الحفظ في الأرشيف: غير مسجل الدخول.");
      }

      toast.success('تم بث الإشعار بنجاح إلى هواتف جميع المشتركين!');
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

  useEffect(() => {
    fetchStats();
    fetchHeritageAndAds();
    fetchNotificationHistory();

    const sub = supabase.channel('public-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchStats();
        fetchHeritageAndAds();
        fetchNotificationHistory();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, []);

  const fetchHeritageAndAds = async () => {
    const { data: hData } = await supabase.from('heritage_archive').select('*').order('created_at', { ascending: false });
    const { data: aData } = await supabase.from('partner_ads').select('*').order('created_at', { ascending: false });
    setHeritageItems(hData || []);
    setAds(aData || []);
  };

  const fetchNotificationHistory = async () => {
    const { data } = await supabase.from('notifications_history').select('*').order('created_at', { ascending: false }).limit(5);
    setNotificationHistory(data || []);
  };

  const handleCreateHeritage = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('heritage_archive').insert(newHeritage);
    if (error) toast.error('خطأ في إضافة التراث');
    else {
      toast.success('تمت إضافة مادة تراثية جديدة');
      setNewHeritage({ title: '', content: '', image_url: '' });
      fetchHeritageAndAds();
    }
  };

  const handleUpdateHeritage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHeritage) return;
    
    const { error } = await supabase
      .from('heritage_archive')
      .update({
        title: editingHeritage.title,
        content: editingHeritage.content,
        image_url: editingHeritage.image_url
      })
      .eq('id', editingHeritage.id);

    if (error) toast.error('خطأ في تحديث التراث');
    else {
      toast.success('تم تحديث المادة التراثية');
      setIsHeritageEditOpen(false);
      setEditingHeritage(null);
      fetchHeritageAndAds();
    }
  };

  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdUploading(true);
    
    try {
      let finalImageUrl = newAd.image_url;

      if (adFile) {
        const ext = adFile.name.split('.').pop();
        const fileName = `ads/${Math.random().toString(36).substring(7)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('events').upload(fileName, adFile);
        
        if (uploadError) throw new Error('فشل رفع صورة الإعلان');
        
        const { data: publicUrlData } = supabase.storage.from('events').getPublicUrl(fileName);
        finalImageUrl = publicUrlData.publicUrl;
      }

      if (!finalImageUrl) throw new Error('يجب توفير صورة (رابط أو ملف)');

      const { error } = await supabase.from('partner_ads').insert({
        partner_name: newAd.partner_name,
        image_url: finalImageUrl,
        link: newAd.link || null
      });

      if (error) throw error;

      toast.success('تمت إضافة إعلان جديد');
      setNewAd({ partner_name: '', image_url: '', link: '' });
      setAdFile(null);
      fetchHeritageAndAds();
    } catch (error: any) {
      toast.error(error.message || 'خطأ في إضافة الإعلان');
    } finally {
      setAdUploading(false);
    }
  };

  const handleDeleteItem = async (table: string, id: string) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
      toast.error('خطأ في الحذف: ' + error.message);
    } else {
      toast.success('تم الحذف بنجاح');
      fetchHeritageAndAds();
      if (table === 'notifications_history') fetchNotificationHistory();
    }
  };

  const ARABIC_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  const fetchStats = async () => {
    try {
      const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
      const { count: assocCount } = await supabase.from('associations').select('*', { count: 'exact', head: true });
      const { count: eventsCount } = await supabase.from('events').select('*', { count: 'exact', head: true });
      const { count: rsvpsCount } = await supabase.from('rsvps').select('*', { count: 'exact', head: true });

      const today = new Date().toISOString().split('T')[0];
      const { data: assocDetails } = await supabase
        .from('associations')
        .select('*, users(email), events(*)')
        .gte('events.date', today);

      // Fetch monthly stats (last 6 months)
      const { data: allEvents } = await supabase.from('events').select('date');
      const { data: allRsvps } = await supabase.from('rsvps').select('created_at');

      const monthMap: Record<string, { events: number; visitors: number }> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthMap[key] = { events: 0, visitors: 0 };
      }

      allEvents?.forEach((ev: any) => {
        if (!ev.date) return;
        const key = ev.date.substring(0, 7); // "YYYY-MM"
        if (monthMap[key] !== undefined) monthMap[key].events++;
      });

      allRsvps?.forEach((r: any) => {
        if (!r.created_at) return;
        const key = r.created_at.substring(0, 7);
        if (monthMap[key] !== undefined) monthMap[key].visitors++;
      });

      const monthly = Object.entries(monthMap).map(([key, val]) => {
        const monthIndex = parseInt(key.split('-')[1]) - 1;
        return {
          name: ARABIC_MONTHS[monthIndex],
          الفعاليات: val.events,
          الزوار: val.visitors,
        };
      });
      setMonthlyStats(monthly);

      setStats({
        total_users: usersCount || 0,
        total_associations: assocCount || 0,
        total_events: eventsCount || 0,
        total_rsvps: rsvpsCount || 0
      });

      if (assocDetails) {
        setAssociationsDetails(assocDetails);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const toggleAccordion = (id: string) => {
    setExpandedAssocId(expandedAssocId === id ? null : id);
  };

  const handleCreateAssociation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assocName || !managerEmail) return;

    setLoading(true);
    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', managerEmail.toLowerCase().trim())
        .single();

      if (userError || !user) {
        throw new Error('لم يتم العثور على مستخدم بهذا البريد الإلكتروني. يجب أن يسجل الدخول كزائر أولاً.');
      }

      const { error: assocError } = await supabase
        .from('associations')
        .insert({ name: assocName, manager_id: user.id, is_active: true });

      if (assocError) throw assocError;

      const { error: roleError } = await supabase
        .from('users')
        .update({ role: 'association' })
        .eq('id', user.id);

      if (roleError) throw roleError;

      toast.success(`تم إنشاء جمعية "${assocName}" بنجاح!`);
      setAssocName('');
      setManagerEmail('');
      fetchStats();

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.');
      return;
    }
    setPasswordUpdating(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordUpdating(false);
    if (error) {
      toast.error('حدث خطأ أثناء تغيير كلمة المرور: ' + error.message);
    } else {
      toast.success('تم تغيير كلمة المرور بنجاح!');
      setIsPasswordModalOpen(false);
      setNewPassword('');
    }
  };



  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 font-sans" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800">لوحة تحكم الإدارة</h1>
          <p className="text-slate-500 mt-1 font-bold">نظرة عامة على نشاط منصة تواصل صحراء (بيانات حية)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsPasswordModalOpen(true)} className="font-bold rounded-xl border-slate-200">
            تغيير كلمة المرور
          </Button>
          <Button variant="destructive" onClick={handleLogout} className="font-bold rounded-xl">
            تسجيل الخروج
          </Button>
        </div>
      </div>

      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="font-sans" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-800 mb-2">تغيير كلمة المرور</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              أدخل كلمة المرور الجديدة لحسابك.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePassword} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>كلمة المرور الجديدة</Label>
              <Input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="******"
                className="bg-slate-50"
              />
            </div>
            <Button type="submit" disabled={passwordUpdating} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 rounded-xl">
              {passwordUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'حفظ كلمة المرور'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-emerald-50 border-emerald-100 rounded-3xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-emerald-800 font-bold">إجمالي المستخدمين</CardTitle>
            <Users className="h-6 w-6 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-black text-emerald-600">{stats.total_users}</div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-100 rounded-3xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-amber-800 font-bold">الجمعيات النشطة</CardTitle>
            <Building2 className="h-6 w-6 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-black text-amber-600">{stats.total_associations}</div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-100 rounded-3xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-blue-800 font-bold">الفعاليات المنظمة</CardTitle>
            <Calendar className="h-6 w-6 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-black text-blue-600">{stats.total_events}</div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-100 rounded-3xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-purple-800 font-bold">تأكيدات الحضور</CardTitle>
            <Ticket className="h-6 w-6 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-black text-purple-600">{stats.total_rsvps}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="bg-slate-100 p-1 rounded-2xl h-14 w-full max-w-3xl border">
          <TabsTrigger value="overview" className="flex-1 text-lg font-bold rounded-xl data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">إحصائيات ومنظمات</TabsTrigger>
          <TabsTrigger value="heritage" className="flex-1 text-lg font-bold rounded-xl data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-sm">الأرشيف التراثي</TabsTrigger>
          <TabsTrigger value="ads" className="flex-1 text-lg font-bold rounded-xl data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">إدارة الإعلانات</TabsTrigger>
          <TabsTrigger value="broadcast" className="flex-1 text-lg font-bold rounded-xl data-[state=active]:bg-white data-[state=active]:text-red-700 data-[state=active]:shadow-sm">بث إشعار عام 📣</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 shadow-xl border-none rounded-3xl bg-white overflow-hidden">
              <CardHeader className="bg-slate-50 border-b pb-4">
                <CardTitle className="text-xl font-black text-slate-800">النشاط الشهري — الفعاليات والزوار</CardTitle>
              </CardHeader>
              <CardContent className="h-80 w-full pt-6" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fill: '#6b7280', fontWeight: 'bold', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#6b7280', fontWeight: 'bold' }} allowDecimals={false} />
                    <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold', direction: 'rtl' }} />
                    <Legend wrapperStyle={{ fontWeight: 'bold', direction: 'rtl' }} />
                    <Bar dataKey="الفعاليات" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="الزوار" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-2 border-amber-500 rounded-3xl overflow-hidden">
              <CardHeader className="bg-amber-500 text-white text-center pb-6">
                <CardTitle className="text-xl font-black">إضافة جمعية جديدة</CardTitle>
              </CardHeader>
              <CardContent className="pt-8">
                <form onSubmit={handleCreateAssociation} className="space-y-6 text-right">
                  <div className="space-y-2">
                    <Label htmlFor="assocName" className="font-bold text-slate-700">اسم الجمعية</Label>
                    <Input
                      id="assocName"
                      value={assocName}
                      onChange={(e) => setAssocName(e.target.value)}
                      placeholder="مثال: جمعية الإحسان"
                      required
                      className="h-12 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="managerEmail" className="font-bold text-slate-700">البريد الإلكتروني للمدير</Label>
                    <Input
                      id="managerEmail"
                      type="email"
                      value={managerEmail}
                      onChange={(e) => setManagerEmail(e.target.value)}
                      placeholder="manager@example.com"
                      className="h-12 text-left font-sans"
                      dir="ltr"
                      required
                    />
                    <p className="text-[10px] text-slate-500 font-bold bg-slate-50 p-2 rounded-lg border mt-2">
                      * يجب أن يمتلك المدير حساباً مسبقاً (دخول كزائر لمرة واحدة يكفي لإنشاء حسابه).
                    </p>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full h-14 text-lg font-black bg-amber-600 hover:bg-amber-700 text-white mt-4 shadow-lg rounded-xl">
                    {loading ? "جاري الحفظ..." : "اعتماد الجمعية"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-black text-slate-800 mb-6 border-b pb-2 flex items-center gap-3">
              <Building2 className="text-emerald-600" /> تفاصيل الجمعيات والفعاليات
            </h2>
            <div className="space-y-4">
              {associationsDetails.length === 0 ? (
                <div className="text-center text-gray-500 py-8 bg-slate-50 rounded-2xl border border-slate-200">
                  لا توجد جمعيات حتى الآن.
                </div>
              ) : (
                associationsDetails.map((assoc) => (
                  <Card key={assoc.id} className="overflow-hidden shadow-sm border border-slate-200 rounded-2xl">
                    <div 
                      className="flex items-center justify-between p-5 cursor-pointer bg-white hover:bg-slate-50 transition-colors"
                      onClick={() => toggleAccordion(assoc.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-emerald-100 p-3 rounded-xl">
                          <Building2 className="text-emerald-600 h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">{assoc.name}</h3>
                          <p className="text-sm text-slate-500 font-sans" dir="ltr">{assoc.users?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold border border-emerald-100">
                          {assoc.events?.filter((e: any) => e !== null).length || 0} فعالية نشطة
                        </div>
                        {expandedAssocId === assoc.id ? (
                          <ChevronUp className="h-5 w-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                    </div>
                    
                    {expandedAssocId === assoc.id && (
                      <div className="bg-slate-50 border-t border-slate-100 p-5">
                        {assoc.events && assoc.events.filter((e: any) => e !== null).length > 0 ? (
                          <ul className="space-y-3">
                            {assoc.events.filter((e: any) => e !== null).map((event: any) => (
                              <li key={event.id} className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                  <span className="font-bold text-slate-700">{event.title}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                                  <Calendar className="h-4 w-4" />
                                  <span dir="ltr">{event.date}</span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-slate-500 text-center py-4 bg-white rounded-xl border border-dashed border-slate-300">
                            لا توجد فعاليات لهذه الجمعية.
                          </p>
                        )}
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="heritage" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="shadow-lg border-2 border-amber-600 rounded-3xl overflow-hidden">
               <CardHeader className="bg-amber-600 text-white p-6">
                 <CardTitle className="flex items-center gap-3"><Plus /> إضافة مادة تراثية</CardTitle>
               </CardHeader>
               <CardContent className="p-6">
                 <form onSubmit={handleCreateHeritage} className="space-y-4">
                   <div className="space-y-2">
                     <Label className="font-bold">العنوان</Label>
                     <Input required value={newHeritage.title} onChange={e => setNewHeritage({...newHeritage, title: e.target.value})} placeholder="مثال: القصر القديم بالرويسات" />
                   </div>
                   <div className="space-y-2">
                     <Label className="font-bold">المحتوى / الوصف</Label>
                     <Textarea required value={newHeritage.content} onChange={e => setNewHeritage({...newHeritage, content: e.target.value})} placeholder="تفاصيل تاريخية..." rows={5} />
                   </div>
                   <div className="space-y-2">
                     <Label className="font-bold">رابط الصورة (اختياري)</Label>
                     <Input value={newHeritage.image_url} onChange={e => setNewHeritage({...newHeritage, image_url: e.target.value})} placeholder="https://..." dir="ltr" />
                   </div>
                   <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 h-12 font-bold rounded-xl">حفظ في الأرشيف</Button>
                 </form>
               </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-4">
               <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-4">
                 <History className="text-amber-600" /> المواد المسجلة حالياً ({heritageItems.length})
               </h3>
               {heritageItems.map(item => (
                 <Card key={item.id} className="p-4 flex gap-4 items-center bg-white shadow-sm border rounded-2xl">
                   <div className="w-20 h-20 rounded-xl bg-amber-50 flex items-center justify-center overflow-hidden shrink-0 relative">
                     <img 
                       src={item.image_url} 
                       className="object-cover h-full w-full" 
                       onError={(e) => {
                         e.currentTarget.style.display = 'none';
                         const fallback = e.currentTarget.parentElement?.querySelector('.admin-heritage-thumb-fallback');
                         if (fallback) fallback.classList.remove('hidden');
                       }}
                     />
                     <div className="admin-heritage-thumb-fallback hidden absolute inset-0 bg-amber-100 flex items-center justify-center">
                       <History size={24} className="text-amber-300" />
                     </div>
                   </div>
                   <div className="flex-1">
                     <h4 className="font-bold text-slate-800">{item.title}</h4>
                     <p className="text-xs text-slate-500 line-clamp-2 mt-1">{item.content}</p>
                   </div>
                   <div className="flex gap-2">
                     <Button 
                       variant="ghost" 
                       onClick={() => {
                         setEditingHeritage(item);
                         setIsHeritageEditOpen(true);
                       }} 
                       className="text-amber-600 hover:bg-amber-50 p-2 h-auto"
                     >
                       <Edit size={20} />
                     </Button>
                     <Button variant="ghost" onClick={() => handleDeleteItem('heritage_archive', item.id)} className="text-red-500 hover:bg-red-50 p-2 h-auto">
                       <Trash2 size={20} />
                     </Button>
                   </div>
                 </Card>
               ))}
            </div>
          </div>

          <Dialog open={isHeritageEditOpen} onOpenChange={setIsHeritageEditOpen}>
            <DialogContent className="sm:max-w-[500px]" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-right text-2xl font-black text-amber-700">تعديل مادة تراثية</DialogTitle>
                <DialogDescription className="sr-only">استخدم هذا النموذج لتعديل تفاصيل المادة التراثية المختارة.</DialogDescription>
              </DialogHeader>
              {editingHeritage && (
                <form onSubmit={handleUpdateHeritage} className="space-y-4 text-right pt-4">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">العنوان</Label>
                    <Input 
                      required 
                      value={editingHeritage.title} 
                      onChange={e => setEditingHeritage({...editingHeritage, title: e.target.value})} 
                      className="h-12 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">المحتوى</Label>
                    <Textarea 
                      required 
                      value={editingHeritage.content} 
                      onChange={e => setEditingHeritage({...editingHeritage, content: e.target.value})} 
                      rows={6} 
                      className="font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">رابط الصورة</Label>
                    <Input 
                      value={editingHeritage.image_url} 
                      onChange={e => setEditingHeritage({...editingHeritage, image_url: e.target.value})} 
                      dir="ltr" 
                      className="h-12 font-sans"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 h-14 text-lg font-black text-white mt-6 shadow-lg rounded-xl">
                    حفظ التغييرات
                  </Button>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="ads" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="shadow-lg border-2 border-blue-600 rounded-3xl overflow-hidden">
               <CardHeader className="bg-blue-600 text-white p-6">
                 <CardTitle className="flex items-center gap-3"><Plus /> إضافة إعلان شريك</CardTitle>
               </CardHeader>
               <CardContent className="p-6">
                 <form onSubmit={handleCreateAd} className="space-y-4 text-right">
                   <div className="space-y-2">
                     <Label className="font-bold text-slate-700">اسم الشريك</Label>
                     <Input 
                        required 
                        value={newAd.partner_name} 
                        onChange={e => setNewAd({...newAd, partner_name: e.target.value})} 
                        placeholder="مثال: اتصالات الجزائر" 
                        className="h-12 font-bold"
                     />
                   </div>
                   <div className="space-y-2">
                     <Label className="font-bold text-slate-700">رابط الصورة (اختياري)</Label>
                     <Input 
                        value={newAd.image_url} 
                        onChange={e => setNewAd({...newAd, image_url: e.target.value})} 
                        placeholder="https://..." 
                        dir="ltr" 
                        className="h-12 font-sans"
                     />
                   </div>
                   
                   <div className="space-y-2 pt-2 border-t mt-2">
                      <Label className="font-bold text-blue-800">أو قم برفع ملف الصورة</Label>
                      <div className="flex items-center gap-4">
                        <Input 
                          type="file" 
                          accept="image/*" 
                          onChange={e => setAdFile(e.target.files?.[0] || null)}
                          className="bg-blue-50/50 border-dashed border-2 cursor-pointer h-14 pt-3 font-bold"
                        />
                        {adFile && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => setAdFile(null)}
                            className="text-red-500 hover:bg-red-50"
                          >
                            <Trash2 size={20} />
                          </Button>
                        )}
                      </div>
                    </div>

                   <div className="space-y-2">
                     <Label className="font-bold text-slate-700">الرابط الموجه (URL)</Label>
                     <Input 
                        value={newAd.link} 
                        onChange={e => setNewAd({...newAd, link: e.target.value})} 
                        placeholder="https://..." 
                        dir="ltr" 
                        className="h-12 font-sans"
                     />
                   </div>
                   <Button 
                      type="submit" 
                      disabled={adUploading} 
                      className="w-full bg-blue-600 hover:bg-blue-700 h-14 text-lg font-black text-white mt-4 shadow-lg rounded-xl"
                   >
                     {adUploading ? "جاري الرفع والنشر..." : "نشر الإعلان"}
                   </Button>
                 </form>
               </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-4">
               <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-4">
                 <Megaphone className="text-blue-600" /> الإعلانات الحالية ({ads.length})
               </h3>
               {ads.map(ad => (
                 <Card key={ad.id} className="p-4 flex gap-4 items-center bg-white shadow-sm border rounded-2xl relative overflow-hidden">
                   <div className="w-32 h-20 rounded-xl bg-blue-50 flex items-center justify-center overflow-hidden shrink-0 relative">
                     <img 
                       src={ad.image_url} 
                       className="object-cover h-full w-full" 
                       onError={(e) => {
                         e.currentTarget.style.display = 'none';
                         const fallback = e.currentTarget.parentElement?.querySelector('.admin-thumb-fallback');
                         if (fallback) fallback.classList.remove('hidden');
                       }}
                     />
                     <div className="admin-thumb-fallback hidden absolute inset-0 bg-blue-100 flex items-center justify-center">
                       <Megaphone size={24} className="text-blue-300" />
                     </div>
                   </div>
                   <div className="flex-1">
                     <h4 className="font-bold text-slate-800">{ad.partner_name}</h4>
                     {ad.link && <LinkIcon size={12} className="inline ml-1 text-slate-400" />}
                     <p className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-2">نشط</p>
                   </div>
                   <Button variant="ghost" onClick={() => handleDeleteItem('partner_ads', ad.id)} className="text-red-500 hover:bg-red-50 p-2 h-auto"><Trash2 size={20} /></Button>
                 </Card>
               ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="broadcast" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Broadcast Form */}
            <Card className="lg:col-span-7 shadow-xl border-none rounded-[2rem] bg-white overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-red-600 to-rose-600 text-white p-6">
                <CardTitle className="text-xl font-black flex items-center gap-2">
                  <Megaphone className="h-6 w-6" />
                  إرسال إشعار عام للنظام
                </CardTitle>
                <p className="text-xs text-red-100 font-medium mt-1">
                  بصفتك مديراً عاماً للمنصة، سيتم إرسال هذا التنبيه لكافة المستخدمين والزوار فورياً كإشعار هاتف أصيل.
                </p>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleSendBroadcast} className="space-y-6 text-right">
                  <div className="space-y-2">
                    <Label htmlFor="admin-broadcast-title" className="font-bold text-slate-700">عنوان الإشعار</Label>
                    <Input 
                      id="admin-broadcast-title"
                      required
                      value={broadcastTitle}
                      onChange={e => setBroadcastTitle(e.target.value)}
                      placeholder="عنوان التنبيه الرئيسي..."
                      className="h-12 font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-broadcast-body" className="font-bold text-slate-700">نص الرسالة</Label>
                    <Textarea 
                      id="admin-broadcast-body"
                      required
                      value={broadcastBody}
                      onChange={e => setBroadcastBody(e.target.value)}
                      placeholder="اكتب تفاصيل التنبيه الهام هنا..."
                      rows={5}
                      className="font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-broadcast-url" className="font-bold text-slate-700">رابط التوجيه (اختياري)</Label>
                    <Input 
                      id="admin-broadcast-url"
                      value={broadcastUrl}
                      onChange={e => setBroadcastUrl(e.target.value)}
                      placeholder="مثال: /heritage (سيتم فتح صفحة التراث عند الضغط)"
                      dir="ltr"
                      className="h-12 font-sans text-left"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={broadcasting}
                    className="w-full h-14 text-lg font-black bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/10 rounded-2xl gap-2 mt-4"
                  >
                    {broadcasting ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>بث التنبيه العام للهواتف</span>
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
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-red-500/20 text-slate-800 text-right">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-black text-red-700 flex items-center gap-1">
                          <Bell className="w-3 h-3 text-red-600 animate-bounce" />
                          تواصل صحراء
                        </span>
                        <span className="text-[8px] text-slate-400">الآن</span>
                      </div>
                      <h5 className="font-black text-xs text-slate-900 truncate">
                        {broadcastTitle ? `إدارة المنصة: ${broadcastTitle}` : 'عنوان الإشعار يظهر هنا'}
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

            {/* Notification History */}
            <div className="col-span-1 lg:col-span-12 mt-8">
               <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-4">
                 <History className="text-red-600" /> أرشيف الإشعارات المرسلة
               </h3>
               <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                 <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                   {notificationHistory.length === 0 ? (
                     <div className="text-center py-8 text-slate-500 font-bold">
                       لا توجد إشعارات سابقة.
                     </div>
                   ) : (
                     notificationHistory.map(notif => (
                       <div key={notif.id} className="bg-white border border-slate-200 shadow-sm rounded-xl p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-red-200 transition-colors">
                         <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2 mb-1">
                             <h4 className="font-bold text-slate-800 text-sm truncate">{notif.title}</h4>
                             <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0" dir="ltr">
                               {new Date(notif.created_at).toLocaleDateString('ar-DZ')}
                             </span>
                           </div>
                           <p className="text-xs text-slate-500 truncate">{notif.body}</p>
                         </div>
                         <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                           <Button 
                             variant="outline" 
                             className="flex-1 sm:flex-none border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 rounded-lg text-xs font-bold h-9 px-3"
                             onClick={() => {
                               setBroadcastTitle(notif.title);
                               setBroadcastBody(notif.body);
                               setBroadcastUrl(notif.url || '');
                               window.scrollTo({ top: 0, behavior: 'smooth' });
                             }}
                           >
                             <History className="w-3 h-3 ml-1" />
                             إعادة استخدام
                           </Button>
                           <Button 
                             variant="ghost" 
                             className="text-red-500 hover:bg-red-50 hover:text-red-700 h-9 w-9 p-0 rounded-lg shrink-0"
                             onClick={() => handleDeleteItem('notifications_history', notif.id)}
                             title="حذف الإشعار"
                           >
                             <Trash2 size={16} />
                           </Button>
                         </div>
                       </div>
                     ))
                   )}
                 </div>
               </div>
            </div>

          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}