import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { 
  Users, 
  Building2, 
  Calendar, 
  Ticket, 
  ChevronDown, 
  ChevronUp, 
  History, 
  Trash2, 
  Megaphone, 
  Link as LinkIcon, 
  Edit, 
  Smartphone, 
  Send, 
  Loader2, 
  Bell, 
  ShieldCheck, 
  UserX, 
  Search, 
  RefreshCw,
  Settings,
  KeyRound,
  LogOut,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Activity
} from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

interface DashboardStats {
  total_users: number;
  total_associations: number;
  total_events: number;
  total_rsvps: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
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

  // Users Management State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'super_admin' | 'association' | 'attendee'>('all');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

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
    fetchUsers();

    const sub = supabase.channel('public-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchStats();
        fetchHeritageAndAds();
        fetchNotificationHistory();
        fetchUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, []);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsersList(data || []);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      toast.error('حدث خطأ أثناء تحميل بيانات المستخدمين');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: 'super_admin' | 'association' | 'attendee') => {
    setUpdatingUserId(userId);
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      const roleLabels: Record<string, string> = {
        super_admin: 'مدير عام',
        association: 'ممثل جمعية',
        attendee: 'مشارك / زائر'
      };

      toast.success(`تم تحديث الرتبة بنجاح إلى "${roleLabels[newRole]}"`);
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      fetchStats();
    } catch (err: any) {
      toast.error('فشل تعديل الرتبة: ' + (err.message || ''));
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف المستخدم (${userEmail || userId}) نهائياً؟`)) return;
    try {
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) throw error;

      toast.success('تم حذف المستخدم بنجاح');
      setUsersList(prev => prev.filter(u => u.id !== userId));
      fetchStats();
    } catch (err: any) {
      toast.error('فشل حذف المستخدم: ' + (err.message || ''));
    }
  };

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

  const filteredUsers = usersList.filter(user => {
    const query = userSearchQuery.trim().toLowerCase();
    const matchesSearch = !query ||
      (user.email && user.email.toLowerCase().includes(query)) ||
      (user.id && user.id.toLowerCase().includes(query));
    const matchesRole = userRoleFilter === 'all' || user.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-[#301809] font-sans pb-16 selection:bg-[#efa83f]/30" dir="rtl">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#dbc397]/50 shadow-xs">
        <div className="container mx-auto px-4 md:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Logo & Platform Info */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#301809] to-[#723c11] border border-[#efa83f]/40 flex items-center justify-center text-[#efa83f] font-black text-xl shadow-md shrink-0">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-thmanyah font-bold text-[#301809] leading-none">
                  لوحة الإدارة المركزية
                </h1>
                <span className="hidden sm:inline-block bg-[#efa83f]/20 text-[#723c11] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#efa83f]/40">
                  سوبر أدمن
                </span>
              </div>
              <p className="text-[11px] text-[#723c11]/80 font-medium mt-1">
                تواصل صحراء · ولاية ورقلة (بيانات حية متزامنة)
              </p>
            </div>
          </div>

          {/* Header Action Buttons & Settings Gear */}
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="hidden sm:flex items-center gap-1.5 border-[#dbc397] text-[#723c11] hover:bg-[#fae1b7]/40 rounded-xl h-10 px-3.5 text-xs font-bold transition-all cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5 text-[#b87a29]" />
              <span>الموقع الرئيسي</span>
            </Button>

            {/* Gear Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-11 h-11 rounded-2xl border-2 border-[#dbc397] bg-white hover:bg-[#fae1b7]/30 text-[#301809] shadow-xs hover:border-[#b87a29] transition-all cursor-pointer focus-visible:ring-[#b87a29]"
                  title="الإعدادات والحساب"
                >
                  <Settings className="w-5 h-5 text-[#723c11] animate-hover-spin" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="start"
                sideOffset={8}
                className="w-60 bg-white/95 backdrop-blur-md rounded-2xl border-2 border-[#dbc397] p-1.5 shadow-2xl font-sans text-right"
              >
                <DropdownMenuLabel className="px-3 py-2 text-right">
                  <p className="text-xs font-black text-[#301809]">حساب الإدارة</p>
                  <p className="text-[10px] text-slate-500 font-mono truncate mt-0.5">Super Admin Session</p>
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
                  <span className="text-[10px] text-slate-400">🔑</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => navigate('/')}
                  className="sm:hidden flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-[#723c11] hover:bg-[#fae1b7]/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-[#b87a29]" />
                    <span>الانتقال للموقع الرئيسي</span>
                  </div>
                  <span className="text-[10px] text-slate-400">🌐</span>
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

      <div className="container mx-auto px-4 md:px-8 pt-8 space-y-8">

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

      {/* Modern Dashboard KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Users */}
        <div className="relative overflow-hidden bg-white rounded-3xl p-6 border-2 border-[#dbc397]/50 shadow-md hover:shadow-xl hover:border-[#b87a29] transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#723c11] uppercase tracking-wider">إجمالي المستخدمين</span>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shadow-xs group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-4xl md:text-5xl font-black text-[#301809] tracking-tight">{stats.total_users}</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> نشط
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Card 2: Associations */}
        <div className="relative overflow-hidden bg-white rounded-3xl p-6 border-2 border-[#dbc397]/50 shadow-md hover:shadow-xl hover:border-[#b87a29] transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#723c11] uppercase tracking-wider">الجمعيات المعتمدة</span>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-[#b87a29] shadow-xs group-hover:scale-110 transition-transform">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-4xl md:text-5xl font-black text-[#301809] tracking-tight">{stats.total_associations}</span>
            <span className="text-xs font-bold text-[#b87a29] bg-amber-50 px-2.5 py-1 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> مرخص
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#b87a29] to-[#efa83f] rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Card 3: Events */}
        <div className="relative overflow-hidden bg-white rounded-3xl p-6 border-2 border-[#dbc397]/50 shadow-md hover:shadow-xl hover:border-[#b87a29] transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#723c11] uppercase tracking-wider">الفعاليات المنظمة</span>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shadow-xs group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-4xl md:text-5xl font-black text-[#301809] tracking-tight">{stats.total_events}</span>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> فعالية
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Card 4: RSVPs */}
        <div className="relative overflow-hidden bg-white rounded-3xl p-6 border-2 border-[#dbc397]/50 shadow-md hover:shadow-xl hover:border-[#b87a29] transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#723c11] uppercase tracking-wider">تأكيدات الحضور (RSVP)</span>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200/80 flex items-center justify-center text-purple-600 shadow-xs group-hover:scale-110 transition-transform">
              <Ticket className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-4xl md:text-5xl font-black text-[#301809] tracking-tight">{stats.total_rsvps}</span>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> تذكرة
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="bg-white/80 backdrop-blur-md p-1.5 rounded-3xl border-2 border-[#dbc397]/60 shadow-sm h-auto min-h-14 w-full max-w-4xl grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
          <TabsTrigger value="overview" className="text-xs md:text-sm font-bold rounded-2xl data-[state=active]:bg-[#301809] data-[state=active]:text-[#fae1b7] data-[state=active]:shadow-md py-3 transition-all cursor-pointer">
            📊 إحصائيات ومنظمات
          </TabsTrigger>
          <TabsTrigger value="users" className="text-xs md:text-sm font-bold rounded-2xl data-[state=active]:bg-[#301809] data-[state=active]:text-[#fae1b7] data-[state=active]:shadow-md py-3 transition-all cursor-pointer">
            👥 المستخدمون والأدوار
          </TabsTrigger>
          <TabsTrigger value="heritage" className="text-xs md:text-sm font-bold rounded-2xl data-[state=active]:bg-[#301809] data-[state=active]:text-[#fae1b7] data-[state=active]:shadow-md py-3 transition-all cursor-pointer">
            🏺 الأرشيف التراثي
          </TabsTrigger>
          <TabsTrigger value="ads" className="text-xs md:text-sm font-bold rounded-2xl data-[state=active]:bg-[#301809] data-[state=active]:text-[#fae1b7] data-[state=active]:shadow-md py-3 transition-all cursor-pointer">
            📢 إدارة الإعلانات
          </TabsTrigger>
          <TabsTrigger value="broadcast" className="text-xs md:text-sm font-bold rounded-2xl data-[state=active]:bg-[#301809] data-[state=active]:text-[#fae1b7] data-[state=active]:shadow-md py-3 transition-all cursor-pointer">
            📣 بث إشعار عام
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 shadow-xl border-2 border-[#dbc397]/50 rounded-3xl bg-white overflow-hidden">
              <CardHeader className="bg-[#fdfbf7] border-b border-[#dbc397]/40 pb-4">
                <CardTitle className="text-lg md:text-xl font-thmanyah font-bold text-[#301809] flex items-center gap-2">
                  <span>📈 النشاط الشهري — الفعاليات وتأكيدات الحضور</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-80 w-full pt-6" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fill: '#723c11', fontWeight: 'bold', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#723c11', fontWeight: 'bold' }} allowDecimals={false} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(239, 168, 63, 0.1)' }} 
                      contentStyle={{ 
                        borderRadius: '16px', 
                        border: '2px border #dbc397', 
                        boxShadow: '0 10px 25px -5px rgba(48, 24, 9, 0.15)', 
                        fontWeight: 'bold', 
                        direction: 'rtl', 
                        backgroundColor: '#ffffff',
                        color: '#301809'
                      }}
                      itemStyle={{ color: '#301809', fontWeight: 'bold' }}
                      labelStyle={{ color: '#b87a29', fontWeight: 'black', marginBottom: '4px' }}
                    />
                    <Legend wrapperStyle={{ fontWeight: 'bold', direction: 'rtl', paddingTop: '10px' }} />
                    <Bar dataKey="الفعاليات" fill="#b87a29" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="الزوار" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Create Association Card */}
            <Card className="shadow-xl border-2 border-[#dbc397] rounded-3xl overflow-hidden bg-white">
              <div className="bg-gradient-to-br from-[#301809] to-[#723c11] text-white p-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#efa83f]/20 border border-[#efa83f]/40 flex items-center justify-center text-[#efa83f] mx-auto mb-2 text-2xl shadow-sm">
                  🏛️
                </div>
                <h3 className="text-lg font-black text-[#fae1b7]">اعتماد جمعية جديدة</h3>
                <p className="text-xs text-[#d4b174] mt-1">تفعيل صلاحيات تنظيم الفعاليات لممثل جمعية</p>
              </div>
              <CardContent className="pt-6">
                <form onSubmit={handleCreateAssociation} className="space-y-5 text-right">
                  <div className="space-y-1.5">
                    <Label htmlFor="assocName" className="font-bold text-xs text-[#301809]">اسم الجمعية الرسمية</Label>
                    <Input
                      id="assocName"
                      value={assocName}
                      onChange={(e) => setAssocName(e.target.value)}
                      placeholder="مثال: جمعية الإحسان للتراث"
                      required
                      className="h-11 font-medium border-2 border-[#dbc397] rounded-xl focus-visible:border-[#b87a29]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="managerEmail" className="font-bold text-xs text-[#301809]">البريد الإلكتروني لممثل الجمعية</Label>
                    <Input
                      id="managerEmail"
                      type="email"
                      value={managerEmail}
                      onChange={(e) => setManagerEmail(e.target.value)}
                      placeholder="manager@example.com"
                      className="h-11 text-left font-sans border-2 border-[#dbc397] rounded-xl focus-visible:border-[#b87a29]"
                      dir="ltr"
                      required
                    />
                    <p className="text-[10px] text-[#723c11] font-semibold bg-[#fae1b7]/40 p-2.5 rounded-xl border border-[#dbc397]/60 mt-2 leading-relaxed">
                      💡 ملاحظة: يجب أن يكون الممثل قد سجل دخوله مسبقاً في المنصة ليرتبط حسابه بالجمعية تلقائياً.
                    </p>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full h-12 text-sm font-black bg-gradient-to-r from-[#b87a29] to-[#efa83f] hover:from-[#723c11] hover:to-[#b87a29] text-white shadow-lg rounded-xl cursor-pointer transition-all">
                    {loading ? "جاري الاعتماد..." : "اعتماد الجمعية وتفعيل الصلاحيات"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <h2 className="text-xl md:text-2xl font-thmanyah font-bold text-[#301809] mb-5 pb-3 border-b-2 border-[#dbc397]/40 flex items-center gap-3">
              <Building2 className="text-[#b87a29]" />
              <span>تفاصيل الجمعيات والفعاليات المعتمدة</span>
            </h2>
            <div className="space-y-4">
              {associationsDetails.length === 0 ? (
                <div className="text-center text-[#723c11] py-12 bg-white rounded-3xl border-2 border-dashed border-[#dbc397] font-bold">
                  لا توجد جمعيات مسجلة حتى الآن.
                </div>
              ) : (
                associationsDetails.map((assoc) => (
                  <Card key={assoc.id} className="overflow-hidden shadow-sm hover:shadow-md transition-all border-2 border-[#dbc397]/60 rounded-3xl bg-white">
                    <div 
                      className="flex items-center justify-between p-5 cursor-pointer bg-white hover:bg-[#fae1b7]/20 transition-colors"
                      onClick={() => toggleAccordion(assoc.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#301809] to-[#723c11] flex items-center justify-center text-[#efa83f] font-bold text-lg shadow-sm shrink-0">
                          🏛️
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-[#301809]">{assoc.name}</h3>
                          <p className="text-xs text-[#723c11]/80 font-mono mt-0.5" dir="ltr">{assoc.users?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="bg-[#fae1b7]/70 text-[#723c11] border border-[#d4b174]/60 px-3 py-1 rounded-full text-xs font-bold shadow-2xs">
                          {assoc.events?.filter((e: any) => e !== null).length || 0} فعالية نشطة
                        </span>
                        {expandedAssocId === assoc.id ? (
                          <ChevronUp className="h-5 w-5 text-[#b87a29]" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-[#b87a29]" />
                        )}
                      </div>
                    </div>
                    
                    {expandedAssocId === assoc.id && (
                      <div className="bg-[#fdfbf7] border-t border-[#dbc397]/50 p-5">
                        {assoc.events && assoc.events.filter((e: any) => e !== null).length > 0 ? (
                          <ul className="space-y-3">
                            {assoc.events.filter((e: any) => e !== null).map((event: any) => (
                              <li key={event.id} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#dbc397]/60 shadow-xs">
                                <div className="flex items-center gap-3">
                                  <div className="w-2.5 h-2.5 rounded-full bg-[#efa83f] animate-ping" />
                                  <span className="font-bold text-sm text-[#301809]">{event.title}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold text-[#723c11] bg-[#fae1b7]/50 px-3 py-1.5 rounded-xl border border-[#dbc397]">
                                  <Calendar className="h-3.5 w-3.5 text-[#b87a29]" />
                                  <span dir="ltr">{event.date}</span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[#723c11]/70 text-center py-5 bg-white rounded-2xl border border-dashed border-[#dbc397] text-xs font-bold">
                            لا توجد فعاليات قادمة لهذه الجمعية حتى الآن.
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

        <TabsContent value="users" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header & Stats Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white border-2 border-[#dbc397]/50 rounded-3xl shadow-sm hover:shadow-md hover:border-[#b87a29] transition-all p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#723c11]">إجمالي الحسابات</p>
                  <p className="text-3xl font-black text-[#301809] mt-1">{usersList.length}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#fae1b7]/40 border border-[#dbc397] flex items-center justify-center text-[#723c11]">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </Card>

            <Card className="bg-white border-2 border-[#dbc397]/50 rounded-3xl shadow-sm hover:shadow-md hover:border-[#b87a29] transition-all p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#723c11]">الزوار والمشاركون</p>
                  <p className="text-3xl font-black text-[#b87a29] mt-1">
                    {usersList.filter(u => u.role === 'attendee').length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-[#b87a29]">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </Card>

            <Card className="bg-white border-2 border-[#dbc397]/50 rounded-3xl shadow-sm hover:shadow-md hover:border-[#b87a29] transition-all p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#723c11]">مسؤولو الجمعيات</p>
                  <p className="text-3xl font-black text-[#723c11] mt-1">
                    {usersList.filter(u => u.role === 'association').length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#fae1b7]/60 border border-[#d4b174] flex items-center justify-center text-[#723c11]">
                  <Building2 className="w-6 h-6" />
                </div>
              </div>
            </Card>

            <Card className="bg-white border-2 border-[#dbc397]/50 rounded-3xl shadow-sm hover:shadow-md hover:border-[#b87a29] transition-all p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#723c11]">المدراء العامون</p>
                  <p className="text-3xl font-black text-[#301809] mt-1">
                    {usersList.filter(u => u.role === 'super_admin').length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#301809] to-[#723c11] border border-[#dbc397] flex items-center justify-center text-[#efa83f]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>
            </Card>
          </div>

          {/* Search, Filter & Actions Toolbar */}
          <Card className="bg-white border-2 border-[#dbc397]/60 rounded-3xl shadow-sm p-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b87a29]" />
                <Input
                  type="text"
                  placeholder="ابحث بالبريد الإلكتروني أو المعرّف..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="pr-10 h-11 bg-[#fdfbf7] border-2 border-[#dbc397] rounded-xl font-medium focus-visible:border-[#b87a29]"
                />
              </div>

              {/* Role filter buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant={userRoleFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUserRoleFilter('all')}
                  className={`rounded-xl text-xs font-bold h-10 px-4 transition-all cursor-pointer ${
                    userRoleFilter === 'all' 
                      ? 'bg-[#301809] text-[#fae1b7] border-[#301809] shadow-sm' 
                      : 'border-[#dbc397] text-[#723c11] hover:bg-[#fae1b7]/30'
                  }`}
                >
                  الكل ({usersList.length})
                </Button>
                <Button
                  type="button"
                  variant={userRoleFilter === 'attendee' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUserRoleFilter('attendee')}
                  className={`rounded-xl text-xs font-bold h-10 px-4 transition-all cursor-pointer ${
                    userRoleFilter === 'attendee' 
                      ? 'bg-[#b87a29] text-white border-[#b87a29] shadow-sm' 
                      : 'border-[#dbc397] text-[#723c11] hover:bg-[#fae1b7]/30'
                  }`}
                >
                  زوار / مشاركون
                </Button>
                <Button
                  type="button"
                  variant={userRoleFilter === 'association' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUserRoleFilter('association')}
                  className={`rounded-xl text-xs font-bold h-10 px-4 transition-all cursor-pointer ${
                    userRoleFilter === 'association' 
                      ? 'bg-[#723c11] text-[#fae1b7] border-[#723c11] shadow-sm' 
                      : 'border-[#dbc397] text-[#723c11] hover:bg-[#fae1b7]/30'
                  }`}
                >
                  جمعيات
                </Button>
                <Button
                  type="button"
                  variant={userRoleFilter === 'super_admin' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUserRoleFilter('super_admin')}
                  className={`rounded-xl text-xs font-bold h-10 px-4 transition-all cursor-pointer ${
                    userRoleFilter === 'super_admin' 
                      ? 'bg-[#301809] text-[#efa83f] border-[#301809] shadow-sm' 
                      : 'border-[#dbc397] text-[#723c11] hover:bg-[#fae1b7]/30'
                  }`}
                >
                  مدراء
                </Button>

                {/* Refresh */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={fetchUsers}
                  disabled={usersLoading}
                  className="rounded-xl h-10 w-10 p-0 border-[#dbc397] text-[#723c11] hover:bg-[#fae1b7]/30 hover:text-[#301809] cursor-pointer"
                  title="تحديث القائمة"
                >
                  <RefreshCw className={`w-4 h-4 ${usersLoading ? 'animate-spin text-[#b87a29]' : ''}`} />
                </Button>
              </div>
            </div>
          </Card>

          {/* Users Table / List */}
          <Card className="bg-white border-2 border-[#dbc397]/60 rounded-3xl shadow-sm overflow-hidden">
            {usersLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#723c11]">
                <Loader2 className="w-8 h-8 animate-spin text-[#b87a29]" />
                <p className="font-bold text-sm">جاري تحميل بيانات المستخدمين...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-16 px-4">
                <UserX className="w-12 h-12 text-[#dbc397] mx-auto mb-3" />
                <h3 className="text-base font-bold text-[#301809]">لم يتم العثور على أي مستخدمين</h3>
                <p className="text-xs text-[#723c11]/80 mt-1">جرب تغيير كلمات البحث أو الفلتر أعلاه</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-[#fdfbf7] border-b-2 border-[#dbc397]/50 text-[#723c11] text-xs font-bold">
                      <th className="p-4">المستخدم</th>
                      <th className="p-4">تاريخ التسجيل</th>
                      <th className="p-4">النقاط والشارة</th>
                      <th className="p-4">الرتبة الحالية</th>
                      <th className="p-4 text-center">تغيير الرتبة</th>
                      <th className="p-4 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dbc397]/30 text-sm font-medium">
                    {filteredUsers.map((user) => {
                      const isCurrentUserUpdating = updatingUserId === user.id;
                      return (
                        <tr key={user.id} className="hover:bg-[#fae1b7]/15 transition-colors">
                          {/* User info */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#fae1b7] to-[#dbc397] border border-[#d4b174] flex items-center justify-center font-black text-[#301809] uppercase shrink-0 shadow-2xs">
                                {user.email ? user.email.charAt(0) : 'U'}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-[#301809] truncate" dir="ltr">
                                  {user.email || 'بدون بريد'}
                                </p>
                                <p className="text-[11px] text-[#723c11]/70 font-mono truncate" dir="ltr">
                                  ID: {user.id.substring(0, 8)}...
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Created date */}
                          <td className="p-4 text-[#723c11] text-xs font-semibold">
                            {user.created_at ? new Date(user.created_at).toLocaleDateString('ar-DZ', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            }) : '—'}
                          </td>

                          {/* Points & badge */}
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="bg-[#fae1b7]/50 text-[#723c11] border border-[#dbc397] px-2.5 py-0.5 rounded-lg text-xs font-bold">
                                {user.points ?? 0} نقطة
                              </span>
                              {user.badge && (
                                <span className="text-[11px] text-[#301809] bg-[#fae1b7]/80 border border-[#d4b174] px-2 py-0.5 rounded-md font-semibold">
                                  {user.badge}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Role Badge */}
                          <td className="p-4">
                            {user.role === 'super_admin' ? (
                              <span className="inline-flex items-center gap-1.5 bg-[#301809] text-[#efa83f] border border-[#b87a29] px-3 py-1 rounded-full text-xs font-black shadow-xs">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                مدير عام (Super Admin)
                              </span>
                            ) : user.role === 'association' ? (
                              <span className="inline-flex items-center gap-1.5 bg-[#fae1b7] text-[#723c11] border border-[#d4b174] px-3 py-1 rounded-full text-xs font-black shadow-xs">
                                <Building2 className="w-3.5 h-3.5" />
                                ممثل جمعية (Association)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 bg-[#fdfbf7] text-[#723c11] border border-[#dbc397] px-3 py-1 rounded-full text-xs font-black shadow-xs">
                                <Users className="w-3.5 h-3.5" />
                                مشارك / زائر (Attendee)
                              </span>
                            )}
                          </td>

                          {/* Quick Role Changer */}
                          <td className="p-4 text-center">
                            <div className="inline-flex items-center gap-1 bg-[#fdfbf7] p-1 rounded-xl border border-[#dbc397]">
                              <button
                                type="button"
                                disabled={isCurrentUserUpdating || user.role === 'attendee'}
                                onClick={() => handleUpdateUserRole(user.id, 'attendee')}
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                  user.role === 'attendee'
                                    ? 'bg-[#b87a29] text-white shadow-xs'
                                    : 'text-[#723c11] hover:text-[#301809] hover:bg-[#fae1b7]/40'
                                } disabled:opacity-50`}
                                title="تحويل لمشارك"
                              >
                                زائر
                              </button>
                              <button
                                type="button"
                                disabled={isCurrentUserUpdating || user.role === 'association'}
                                onClick={() => handleUpdateUserRole(user.id, 'association')}
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                  user.role === 'association'
                                    ? 'bg-[#723c11] text-[#fae1b7] shadow-xs'
                                    : 'text-[#723c11] hover:text-[#301809] hover:bg-[#fae1b7]/40'
                                } disabled:opacity-50`}
                                title="ترقية لممثل جمعية"
                              >
                                جمعية
                              </button>
                              <button
                                type="button"
                                disabled={isCurrentUserUpdating || user.role === 'super_admin'}
                                onClick={() => handleUpdateUserRole(user.id, 'super_admin')}
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                  user.role === 'super_admin'
                                    ? 'bg-[#301809] text-[#efa83f] shadow-xs'
                                    : 'text-[#723c11] hover:text-[#301809] hover:bg-[#fae1b7]/40'
                                } disabled:opacity-50`}
                                title="ترقية لمدير عام"
                              >
                                مدير
                              </button>
                            </div>
                          </td>

                          {/* Delete action */}
                          <td className="p-4 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id, user.email)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-9 w-9 p-0 rounded-xl cursor-pointer"
                              title="حذف المستخدم نهائياً"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="heritage" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="shadow-xl border-2 border-[#dbc397] rounded-3xl overflow-hidden bg-white">
               <div className="bg-gradient-to-br from-[#301809] to-[#723c11] text-white p-6 text-center">
                 <div className="w-12 h-12 rounded-2xl bg-[#efa83f]/20 border border-[#efa83f]/40 flex items-center justify-center text-[#efa83f] mx-auto mb-2 text-2xl shadow-sm">
                   🏺
                 </div>
                 <h3 className="text-lg font-black text-[#fae1b7]">إضافة مادة تراثية جديدة</h3>
                 <p className="text-xs text-[#d4b174] mt-1">توثيق تاريخ ومعالم ورقلة وقصورها العريقة</p>
               </div>
               <CardContent className="p-6">
                 <form onSubmit={handleCreateHeritage} className="space-y-4 text-right">
                   <div className="space-y-1.5">
                     <Label className="font-bold text-xs text-[#301809]">عنوان المعلم أو المادة التراثية</Label>
                     <Input required value={newHeritage.title} onChange={e => setNewHeritage({...newHeritage, title: e.target.value})} placeholder="مثال: القصر القديم بالرويسات" className="h-11 font-medium border-2 border-[#dbc397] rounded-xl focus-visible:border-[#b87a29]" />
                   </div>
                   <div className="space-y-1.5">
                     <Label className="font-bold text-xs text-[#301809]">المحتوى / الوصف التاريخي</Label>
                     <Textarea required value={newHeritage.content} onChange={e => setNewHeritage({...newHeritage, content: e.target.value})} placeholder="تفاصيل تاريخية وأصل المادة..." rows={5} className="font-medium border-2 border-[#dbc397] rounded-xl focus-visible:border-[#b87a29]" />
                   </div>
                   <div className="space-y-1.5">
                     <Label className="font-bold text-xs text-[#301809]">رابط الصورة (اختياري)</Label>
                     <Input value={newHeritage.image_url} onChange={e => setNewHeritage({...newHeritage, image_url: e.target.value})} placeholder="https://..." dir="ltr" className="h-11 border-2 border-[#dbc397] rounded-xl text-left font-sans focus-visible:border-[#b87a29]" />
                   </div>
                   <Button type="submit" className="w-full bg-gradient-to-r from-[#b87a29] to-[#efa83f] hover:from-[#723c11] hover:to-[#b87a29] h-12 text-sm font-black text-white rounded-xl shadow-md cursor-pointer transition-all">حفظ وتوثيق في الأرشيف</Button>
                 </form>
               </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-4">
               <h3 className="text-xl font-thmanyah font-bold text-[#301809] flex items-center gap-2 mb-4 pb-2 border-b-2 border-[#dbc397]/40">
                 <History className="text-[#b87a29]" />
                 <span>المواد الموثقة بالأرشيف حالياً ({heritageItems.length})</span>
               </h3>
               {heritageItems.map(item => (
                 <Card key={item.id} className="p-4 flex gap-4 items-center bg-white shadow-xs hover:shadow-md transition-all border-2 border-[#dbc397]/60 rounded-3xl">
                   <div className="w-20 h-20 rounded-2xl bg-[#fae1b7]/40 border border-[#dbc397] flex items-center justify-center overflow-hidden shrink-0 relative shadow-2xs">
                     <img 
                       src={item.image_url} 
                       className="object-cover h-full w-full" 
                       onError={(e) => {
                         e.currentTarget.style.display = 'none';
                         const fallback = e.currentTarget.parentElement?.querySelector('.admin-heritage-thumb-fallback');
                         if (fallback) fallback.classList.remove('hidden');
                       }}
                     />
                     <div className="admin-heritage-thumb-fallback hidden absolute inset-0 bg-[#fae1b7] flex items-center justify-center">
                       <History size={24} className="text-[#b87a29]" />
                     </div>
                   </div>
                   <div className="flex-1 min-w-0">
                     <h4 className="font-bold text-base text-[#301809] truncate">{item.title}</h4>
                     <p className="text-xs text-[#723c11]/80 line-clamp-2 mt-1 leading-relaxed">{item.content}</p>
                   </div>
                   <div className="flex gap-1.5 shrink-0">
                     <Button 
                       variant="ghost" 
                       size="icon"
                       onClick={() => {
                         setEditingHeritage(item);
                         setIsHeritageEditOpen(true);
                       }} 
                       className="text-[#b87a29] hover:bg-[#fae1b7]/40 h-9 w-9 rounded-xl cursor-pointer"
                       title="تعديل"
                     >
                       <Edit size={18} />
                     </Button>
                     <Button 
                       variant="ghost" 
                       size="icon"
                       onClick={() => handleDeleteItem('heritage_archive', item.id)} 
                       className="text-red-500 hover:bg-red-50 h-9 w-9 rounded-xl cursor-pointer"
                       title="حذف"
                     >
                       <Trash2 size={18} />
                     </Button>
                   </div>
                 </Card>
               ))}
            </div>
          </div>

          <Dialog open={isHeritageEditOpen} onOpenChange={setIsHeritageEditOpen}>
            <DialogContent className="sm:max-w-[500px] border-2 border-[#dbc397] rounded-3xl bg-white" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-right text-2xl font-thmanyah font-bold text-[#301809]">تعديل مادة تراثية</DialogTitle>
                <DialogDescription className="sr-only">استخدم هذا النموذج لتعديل تفاصيل المادة التراثية المختارة.</DialogDescription>
              </DialogHeader>
              {editingHeritage && (
                <form onSubmit={handleUpdateHeritage} className="space-y-4 text-right pt-4">
                  <div className="space-y-1.5">
                    <Label className="font-bold text-xs text-[#301809]">العنوان</Label>
                    <Input 
                      required 
                      value={editingHeritage.title} 
                      onChange={e => setEditingHeritage({...editingHeritage, title: e.target.value})} 
                      className="h-11 font-bold border-2 border-[#dbc397] rounded-xl focus-visible:border-[#b87a29]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-xs text-[#301809]">المحتوى والتفاصيل</Label>
                    <Textarea 
                      required 
                      value={editingHeritage.content} 
                      onChange={e => setEditingHeritage({...editingHeritage, content: e.target.value})} 
                      rows={5} 
                      className="font-medium border-2 border-[#dbc397] rounded-xl focus-visible:border-[#b87a29]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-xs text-[#301809]">رابط الصورة</Label>
                    <Input 
                      value={editingHeritage.image_url} 
                      onChange={e => setEditingHeritage({...editingHeritage, image_url: e.target.value})} 
                      dir="ltr" 
                      className="h-11 font-sans text-left border-2 border-[#dbc397] rounded-xl focus-visible:border-[#b87a29]"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-[#b87a29] to-[#efa83f] hover:from-[#723c11] hover:to-[#b87a29] h-12 text-sm font-black text-white mt-4 shadow-lg rounded-xl cursor-pointer transition-all">
                    حفظ التغييرات
                  </Button>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="ads" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="shadow-xl border-2 border-[#dbc397] rounded-3xl overflow-hidden bg-white">
               <div className="bg-gradient-to-br from-[#301809] to-[#723c11] text-white p-6 text-center">
                 <div className="w-12 h-12 rounded-2xl bg-[#efa83f]/20 border border-[#efa83f]/40 flex items-center justify-center text-[#efa83f] mx-auto mb-2 text-2xl shadow-sm">
                   📢
                 </div>
                 <h3 className="text-lg font-black text-[#fae1b7]">إضافة إعلان شريك</h3>
                 <p className="text-xs text-[#d4b174] mt-1">عرض شعارات ورعاة فعاليات ورقلة</p>
               </div>
               <CardContent className="p-6">
                 <form onSubmit={handleCreateAd} className="space-y-4 text-right">
                   <div className="space-y-1.5">
                     <Label className="font-bold text-xs text-[#301809]">اسم الشريك</Label>
                     <Input 
                        required 
                        value={newAd.partner_name} 
                        onChange={e => setNewAd({...newAd, partner_name: e.target.value})} 
                        placeholder="مثال: اتصالات الجزائر" 
                        className="h-11 font-medium border-2 border-[#dbc397] rounded-xl focus-visible:border-[#b87a29]"
                     />
                   </div>
                   <div className="space-y-1.5">
                     <Label className="font-bold text-xs text-[#301809]">رابط الصورة (اختياري)</Label>
                     <Input 
                        value={newAd.image_url} 
                        onChange={e => setNewAd({...newAd, image_url: e.target.value})} 
                        placeholder="https://..." 
                        dir="ltr" 
                        className="h-11 border-2 border-[#dbc397] rounded-xl text-left font-sans focus-visible:border-[#b87a29]"
                     />
                   </div>
                   
                   <div className="space-y-2 pt-2 border-t border-[#dbc397]/50 mt-2">
                      <Label className="font-bold text-xs text-[#301809]">أو قم برفع ملف الصورة</Label>
                      <div className="flex items-center gap-4">
                        <Input 
                          type="file" 
                          accept="image/*" 
                          onChange={e => setAdFile(e.target.files?.[0] || null)}
                          className="bg-[#fdfbf7] border-dashed border-2 border-[#dbc397] cursor-pointer h-14 pt-3 font-bold rounded-xl text-[#723c11]"
                        />
                        {adFile && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => setAdFile(null)}
                            className="text-red-500 hover:bg-red-50 rounded-xl"
                          >
                            <Trash2 size={20} />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-bold text-xs text-[#301809]">الرابط الموجه للشريك (URL)</Label>
                      <Input 
                         value={newAd.link} 
                         onChange={e => setNewAd({...newAd, link: e.target.value})} 
                         placeholder="https://ignatex.com أو صفحة فيسبوك/إنستغرام" 
                         dir="ltr" 
                         className="h-11 border-2 border-[#dbc397] rounded-xl text-left font-sans focus-visible:border-[#b87a29]"
                      />
                      <p className="text-[11px] text-[#723c11]/80 font-medium">
                        💡 نصيحة: يفضل رفع شعار بخلفية شفافة (PNG) أو صورة عالية الجودة ليظهر الشريك بأعلى درجات الاحترافية في شريط الرعاة والبنر الترويجي.
                      </p>
                    </div>
                    <Button 
                       type="submit" 
                       disabled={adUploading} 
                       className="w-full bg-gradient-to-r from-[#b87a29] to-[#efa83f] hover:from-[#723c11] hover:to-[#b87a29] h-12 text-sm font-black text-white mt-4 shadow-lg rounded-xl cursor-pointer transition-all"
                    >
                      {adUploading ? "جاري الرفع والنشر..." : "نشر الإعلان والشراكة"}
                    </Button>
                  </form>
                </CardContent>
             </Card>

             <div className="lg:col-span-2 space-y-4">
                <h3 className="text-xl font-thmanyah font-bold text-[#301809] flex items-center gap-3 mb-4 pb-2 border-b-2 border-[#dbc397]/40">
                  <Megaphone className="text-[#b87a29]" /> الشركاء والرعاة الحاليون ({ads.length})
                </h3>
                {ads.length === 0 ? (
                  <div className="text-center text-[#723c11] py-12 bg-white rounded-3xl border-2 border-dashed border-[#dbc397] font-bold">
                    لا توجد إعلانات شركاء نشطة حالياً.
                  </div>
                ) : (
                  ads.map(ad => (
                    <Card key={ad.id} className="p-4 flex gap-4 items-center bg-white shadow-sm hover:shadow-md border-2 border-[#dbc397]/60 rounded-3xl relative overflow-hidden transition-all">
                      <div className="w-32 h-20 rounded-2xl bg-[#fdfbf7] border border-[#dbc397] flex items-center justify-center p-2 overflow-hidden shrink-0 relative">
                        <img 
                          src={ad.image_url} 
                          alt={ad.partner_name}
                          className="object-contain max-h-full max-w-full" 
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.parentElement?.querySelector('.admin-thumb-fallback');
                            if (fallback) fallback.classList.remove('hidden');
                          }}
                        />
                        <div className="admin-thumb-fallback hidden absolute inset-0 bg-[#fae1b7]/40 flex items-center justify-center">
                          <Megaphone size={24} className="text-[#b87a29]" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-[#301809] text-base">{ad.partner_name}</h4>
                        {ad.link && (
                          <a href={ad.link} target="_blank" rel="noreferrer" className="text-xs text-[#b87a29] hover:underline flex items-center gap-1 mt-1 truncate" dir="ltr">
                            <LinkIcon size={12} className="inline shrink-0" />
                            {ad.link}
                          </a>
                        )}
                        <span className="text-xs font-bold text-[#723c11] bg-[#fae1b7]/70 border border-[#dbc397] px-2.5 py-0.5 rounded-full inline-block mt-2">
                          نشط في شريط الرعاة والبنر
                        </span>
                      </div>
                      <Button variant="ghost" onClick={() => handleDeleteItem('partner_ads', ad.id)} className="text-red-500 hover:bg-red-50 p-2 h-10 w-10 rounded-xl cursor-pointer shrink-0">
                        <Trash2 size={18} />
                      </Button>
                    </Card>
                  ))
                )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="broadcast" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                      إرسال إشعار عام للمنصة
                    </h3>
                    <p className="text-xs text-[#d4b174] font-medium mt-1">
                      بصفتك مديراً عاماً، سيتم إرسال هذا التنبيه لكافة المستخدمين والزوار فورياً كإشعار هاتف وتطبيق أصيل.
                    </p>
                  </div>
                </div>
              </div>
              <CardContent className="p-6 md:p-8">
                <form onSubmit={handleSendBroadcast} className="space-y-5 text-right">
                  <div className="space-y-1.5">
                    <Label htmlFor="admin-broadcast-title" className="font-bold text-xs text-[#301809]">عنوان الإشعار</Label>
                    <Input 
                      id="admin-broadcast-title"
                      required
                      value={broadcastTitle}
                      onChange={e => setBroadcastTitle(e.target.value)}
                      placeholder="مثال: انطلاق فعاليات موسم القصور العتيقة..."
                      className="h-11 font-bold border-2 border-[#dbc397] rounded-xl focus-visible:border-[#b87a29]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="admin-broadcast-body" className="font-bold text-xs text-[#301809]">نص الرسالة</Label>
                    <Textarea 
                      id="admin-broadcast-body"
                      required
                      value={broadcastBody}
                      onChange={e => setBroadcastBody(e.target.value)}
                      placeholder="اكتب تفاصيل التنبيه الهام هنا..."
                      rows={5}
                      className="font-medium border-2 border-[#dbc397] rounded-xl focus-visible:border-[#b87a29]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="admin-broadcast-url" className="font-bold text-xs text-[#301809]">رابط التوجيه (اختياري)</Label>
                    <Input 
                      id="admin-broadcast-url"
                      value={broadcastUrl}
                      onChange={e => setBroadcastUrl(e.target.value)}
                      placeholder="/heritage أو https://..."
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
                        <span>بث التنبيه العام لجميع الهواتف</span>
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
                        <span className="text-[9px] text-slate-400 font-bold">الآن</span>
                      </div>
                      <h5 className="font-black text-xs text-[#301809] truncate mt-1">
                        {broadcastTitle ? broadcastTitle : 'عنوان الإشعار يظهر هنا'}
                      </h5>
                      <p className="text-[10px] text-[#723c11] mt-1 font-medium leading-relaxed break-words line-clamp-3">
                        {broadcastBody || 'محتوى ونصوص رسالة الإشعار كما قمت بكتابتها في النموذج ستظهر هنا في شاشة الهاتف...'}
                      </p>
                    </div>
                  </div>

                  <div className="text-center text-[#fae1b7]/30 text-[10px] font-bold mb-4">
                    حرك للأعلى لإلغاء القفل 🔒
                  </div>
                </div>
              </div>
            </div>

            {/* Notification History */}
            <div className="col-span-1 lg:col-span-12 mt-8">
               <h3 className="text-xl font-thmanyah font-bold text-[#301809] flex items-center gap-3 mb-4 pb-2 border-b-2 border-[#dbc397]/40">
                 <History className="text-[#b87a29]" /> أرشيف الإشعارات المرسلة
               </h3>
               <div className="bg-white border-2 border-[#dbc397]/60 rounded-3xl p-5 shadow-sm">
                 <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                   {notificationHistory.length === 0 ? (
                     <div className="text-center py-8 text-[#723c11] font-bold">
                       لا توجد إشعارات سابقة.
                     </div>
                   ) : (
                     notificationHistory.map(notif => (
                       <div key={notif.id} className="bg-[#fdfbf7] border border-[#dbc397] shadow-xs rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-[#b87a29] transition-colors">
                         <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2 mb-1">
                             <h4 className="font-bold text-[#301809] text-sm truncate">{notif.title}</h4>
                             <span className="text-[10px] text-[#723c11] bg-[#fae1b7]/60 border border-[#dbc397] px-2.5 py-0.5 rounded-full shrink-0 font-bold" dir="ltr">
                               {new Date(notif.created_at).toLocaleDateString('ar-DZ')}
                             </span>
                           </div>
                           <p className="text-xs text-[#723c11]/80 truncate">{notif.body}</p>
                         </div>
                         <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                           <Button 
                             variant="outline" 
                             className="flex-1 sm:flex-none border-[#dbc397] text-[#723c11] hover:bg-[#fae1b7]/40 hover:text-[#301809] rounded-xl text-xs font-bold h-9 px-3 cursor-pointer"
                             onClick={() => {
                               setBroadcastTitle(notif.title);
                               setBroadcastBody(notif.body);
                               setBroadcastUrl(notif.url || '');
                               window.scrollTo({ top: 0, behavior: 'smooth' });
                             }}
                           >
                             <History className="w-3 h-3 ml-1 text-[#b87a29]" />
                             إعادة استخدام
                           </Button>
                           <Button 
                             variant="ghost" 
                             className="text-red-500 hover:bg-red-50 hover:text-red-700 h-9 w-9 p-0 rounded-xl shrink-0 cursor-pointer"
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
    </div>
  );
}