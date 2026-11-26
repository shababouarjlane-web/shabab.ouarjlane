import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import UnifiedHeader from '../../components/UnifiedHeader';
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
  Sparkles,
  BarChart3,
  MapPin,
  BookOpen,
  CheckCircle2,
  Phone,
  Mail,
  Image as ImageIcon,
  Tag,
  ExternalLink,
  Layers,
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
import {
  HERITAGE_CATEGORIES,
  packHeritageMeta,
  parseHeritageMeta
} from '../../lib/helpers';
import AdminHistoryRefsTab from '../../components/admin/AdminHistoryRefsTab';

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
  const [categoryStats, setCategoryStats] = useState<{ name: string; count: number; pct: number }[]>([]);

  // Users Management State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'super_admin' | 'association' | 'attendee'>('all');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Heritage & Ads State
  const [heritageItems, setHeritageItems] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  
  const [newHeritage, setNewHeritage] = useState({
    title: '',
    category: HERITAGE_CATEGORIES[0] as string,
    content: '',
    image_url: '',
    lat: '',
    lng: ''
  });
  const [editingHeritage, setEditingHeritage] = useState<any | null>(null);
  const [isHeritageEditOpen, setIsHeritageEditOpen] = useState(false);
  
  const [newAd, setNewAd] = useState({ partner_name: '', logo_url: '', image_url: '', link: '' });
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
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
    const parsedLat = newHeritage.lat.trim() ? parseFloat(newHeritage.lat) : undefined;
    const parsedLng = newHeritage.lng.trim() ? parseFloat(newHeritage.lng) : undefined;
    const packedContent = packHeritageMeta(newHeritage.content, {
      category: newHeritage.category,
      contributor: 'إدارة المنصة',
      status: 'approved',
      lat: parsedLat,
      lng: parsedLng
    });
    const { error } = await supabase.from('heritage_archive').insert({
      title: newHeritage.title,
      content: packedContent,
      image_url: newHeritage.image_url || null
    });
    if (error) toast.error('خطأ في إضافة المعلم للخريطة');
    else {
      toast.success('تمت إضافة المعلم بنجاح وسيظهر فوراً على خريطة التراث! 🗺️');
      setNewHeritage({ title: '', category: HERITAGE_CATEGORIES[0], content: '', image_url: '', lat: '', lng: '' });
      fetchHeritageAndAds();
    }
  };

  const handleUpdateHeritage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHeritage) return;

    const parsedLat =
      editingHeritage.lat !== undefined && String(editingHeritage.lat).trim() !== ''
        ? parseFloat(String(editingHeritage.lat))
        : undefined;
    const parsedLng =
      editingHeritage.lng !== undefined && String(editingHeritage.lng).trim() !== ''
        ? parseFloat(String(editingHeritage.lng))
        : undefined;

    const packedContent = packHeritageMeta(editingHeritage.cleanContent ?? editingHeritage.content, {
      category: editingHeritage.category || HERITAGE_CATEGORIES[0],
      contributor: editingHeritage.contributor || 'إدارة المنصة',
      status: 'approved',
      lat: parsedLat,
      lng: parsedLng
    });

    const { error } = await supabase
      .from('heritage_archive')
      .update({
        title: editingHeritage.title,
        content: packedContent,
        image_url: editingHeritage.image_url
      })
      .eq('id', editingHeritage.id);

    if (error) toast.error('خطأ في تحديث المعلم');
    else {
      toast.success('تم تحديث بيانات المعلم على خريطة التراث');
      setIsHeritageEditOpen(false);
      setEditingHeritage(null);
      fetchHeritageAndAds();
    }
  };

  const handleApproveHeritageSuggestion = async (item: any) => {
    const parsed = parseHeritageMeta(item.content, item.title);
    const approvedContent = packHeritageMeta(parsed.cleanContent, {
      category: parsed.category,
      contributor: parsed.contributor || 'مساهم من المجتمع',
      status: 'approved',
      lat: parsed.lat,
      lng: parsed.lng
    });
    const { error } = await supabase
      .from('heritage_archive')
      .update({ content: approvedContent })
      .eq('id', item.id);
    if (error) {
      toast.error('تعذر اعتماد المعلم المقترح');
    } else {
      toast.success('تم اعتماد المعلم وإدراجه على خريطة التراث للزوار بنجاح! 🗺️✅');
      fetchHeritageAndAds();
    }
  };

  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdUploading(true);
    
    try {
      let finalLogoUrl = newAd.logo_url;
      let finalImageUrl = newAd.image_url;

      // 1. Upload Logo if provided
      if (logoFile) {
        const ext = logoFile.name.split('.').pop();
        const fileName = `logos/${Math.random().toString(36).substring(7)}.${ext}`;
        const { error: uploadLogoErr } = await supabase.storage.from('events').upload(fileName, logoFile);
        if (uploadLogoErr) throw new Error('فشل رفع ملف الشعار');
        const { data: publicUrlData } = supabase.storage.from('events').getPublicUrl(fileName);
        finalLogoUrl = publicUrlData.publicUrl;
      }

      // 2. Upload Ad Image / Product Photo if provided
      if (adFile) {
        const ext = adFile.name.split('.').pop();
        const fileName = `ads/${Math.random().toString(36).substring(7)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('events').upload(fileName, adFile);
        if (uploadError) throw new Error('فشل رفع صورة الإعلان');
        const { data: publicUrlData } = supabase.storage.from('events').getPublicUrl(fileName);
        finalImageUrl = publicUrlData.publicUrl;
      }

      // Pack both images into the image_url field: "ad_img_url||logo_img_url"
      let storedImageUrl: string | null = null;
      if (finalImageUrl || finalLogoUrl) {
        storedImageUrl = `${finalImageUrl || ''}||${finalLogoUrl || ''}`;
      }

      if (editingAdId) {
        const { error } = await supabase
          .from('partner_ads')
          .update({
            partner_name: newAd.partner_name,
            image_url: storedImageUrl || null,
            link: newAd.link || null,
          })
          .eq('id', editingAdId);
        if (error) throw error;
        toast.success('تم تحديث بيانات الشريك / الراعي بنجاح!');
      } else {
        const { error } = await supabase.from('partner_ads').insert({
          partner_name: newAd.partner_name,
          image_url: storedImageUrl || null,
          link: newAd.link || null,
        });
        if (error) throw error;
        toast.success('تمت إضافة الراعي والشراكة بنجاح');
      }

      setNewAd({ partner_name: '', logo_url: '', image_url: '', link: '' });
      setEditingAdId(null);
      setLogoFile(null);
      setAdFile(null);
      fetchHeritageAndAds();
    } catch (error: any) {
      toast.error(error.message || 'خطأ في حفظ الإعلان');
    } finally {
      setAdUploading(false);
    }
  };

  const handleStartEditAd = (ad: any) => {
    let adPhoto = ad.image_url || '';
    let adLogo = '';
    if (ad.image_url && ad.image_url.includes('||')) {
      const parts = ad.image_url.split('||');
      adPhoto = parts[0] || '';
      adLogo = parts[1] || '';
    } else if (ad.partner_name?.toLowerCase().includes('ignatex')) {
      adLogo = '/ignatex-logo.png';
    }
    setEditingAdId(ad.id);
    setNewAd({
      partner_name: ad.partner_name || '',
      logo_url: adLogo,
      image_url: adPhoto,
      link: ad.link || '',
    });
    setLogoFile(null);
    setAdFile(null);
    toast.info(`وضع التعديل مفعل للشريك: ${ad.partner_name}`);
  };

  const handleCancelEditAd = () => {
    setEditingAdId(null);
    setNewAd({ partner_name: '', logo_url: '', image_url: '', link: '' });
    setLogoFile(null);
    setAdFile(null);
  };

  const handleDeleteItem = async (table: string, id: string) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
      toast.error('خطأ في الحذف: ' + error.message);
    } else {
      toast.success('تم الحذف بنجاح');
      if (editingAdId === id) handleCancelEditAd();
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

      // Fetch monthly stats (last 6 months) + category stats
      const { data: allEvents } = await supabase.from('events').select('date, category');
      const { data: allRsvps } = await supabase.from('rsvps').select('created_at');

      const monthMap: Record<string, { events: number; visitors: number }> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthMap[key] = { events: 0, visitors: 0 };
      }

      const catCounts: Record<string, number> = {
        Heritage: 0,
        Cultural: 0,
        Educational: 0,
        Religious: 0,
        Sports: 0,
      };

      allEvents?.forEach((ev: any) => {
        if (ev.date) {
          const key = ev.date.substring(0, 7); // "YYYY-MM"
          if (monthMap[key] !== undefined) monthMap[key].events++;
        }
        if (ev.category && catCounts[ev.category] !== undefined) {
          catCounts[ev.category]++;
        }
      });

      const totalEvs = allEvents?.length || 0;
      const catLabels: Record<string, string> = {
        Heritage: 'تراثي وأصالة',
        Cultural: 'ثقافي وفني',
        Educational: 'تعليمي وتكويني',
        Religious: 'ديني وقرآني',
        Sports: 'رياضي وشبابي',
      };
      setCategoryStats(
        Object.entries(catCounts).map(([k, count]) => ({
          name: catLabels[k] || k,
          count,
          pct: totalEvs > 0 ? Math.round((count / totalEvs) * 100) : 0,
        }))
      );

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

  const pendingSuggestionsCount = heritageItems.filter(
    (item) => parseHeritageMeta(item.content, item.title).status === 'pending'
  ).length;
  const contactRequestsCount = heritageItems.filter(
    (item) => parseHeritageMeta(item.content, item.title).status === 'contact_request'
  ).length;

  const accountMenuSlot = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="w-10 h-10 rounded-xl border border-[#dbc397] bg-white hover:bg-[#fae1b7]/40 text-[#301809] cursor-pointer"
          title="الإعدادات والحساب"
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
          <p className="text-xs font-bold text-[#301809]">حساب الإدارة المركزية</p>
          <p className="text-[11px] text-[#723c11]/75 font-mono truncate mt-0.5">
            Super Admin
          </p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-[#dbc397]/50 my-1" />

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
      className="min-h-screen bg-[#fdfbf7] bg-[radial-gradient(ellipse_at_top,_rgba(239,168,63,0.12),_transparent_55%)] text-[#301809] font-sans pb-16 selection:bg-[#efa83f]/30"
      dir="rtl"
    >
      {/* Unified Platform Header */}
      <UnifiedHeader rightSlot={accountMenuSlot} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Password Change Modal */}
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
                أدخل كلمة المرور الجديدة لحساب الإدارة المركزية.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdatePassword} className="space-y-4 pt-3 text-right">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#301809]">كلمة المرور الجديدة</Label>
                <Input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="6 أحرف على الأقل..."
                  className="h-11 bg-[#fdfbf7] border border-[#dbc397] rounded-xl focus-visible:border-[#b87a29]"
                />
              </div>
              <Button
                type="submit"
                disabled={passwordUpdating}
                className="w-full h-11 rounded-xl bg-gradient-to-l from-[#b87a29] to-[#efa83f] text-[#301809] font-thmanyah font-bold cursor-pointer"
              >
                {passwordUpdating ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  'حفظ كلمة المرور'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Regal Sahara Admin Hero */}
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-l from-[#301809] via-[#4a250e] to-[#2b1507] text-white p-6 md:p-7 border border-[#b87a29]/30 shadow-lg">
          <div className="absolute -left-20 -top-20 w-64 h-64 rounded-full bg-[#efa83f]/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-[#efa83f]/20 border border-[#efa83f]/45 flex items-center justify-center text-[#efa83f] shadow-sm shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#efa83f]/20 border border-[#efa83f]/40 text-[#fae1b7] text-[11px] font-bold mb-1.5">
                  <Sparkles className="w-3 h-3 text-[#efa83f]" />
                  <span>لوحة التحكم المركزية — سوبر أدمن</span>
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-thmanyah font-bold text-[#fae1b7] truncate">
                  إدارة منصة تواصل صحراء
                </h1>
                <p className="text-xs sm:text-sm text-[#dbc397]/90 mt-1">
                  مراقبة حية للجمعيات والمستخدمين والفعاليات ومراجع التراث بولاية ورقلة.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Button
                variant="outline"
                onClick={() => {
                  fetchStats();
                  fetchHeritageAndAds();
                  fetchUsers();
                  toast.success('تم تحديث البيانات المباشرة');
                }}
                className="h-11 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-[#fae1b7] border border-[#efa83f]/35 font-bold cursor-pointer flex items-center gap-2 text-xs sm:text-sm"
              >
                <RefreshCw className="w-4 h-4 text-[#efa83f]" />
                <span>تحديث الإحصائيات</span>
              </Button>
            </div>
          </div>

          {/* Inline Compact KPI Strip */}
          <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
            <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#dbc397] font-medium">إجمالي المستخدمين</p>
                <p className="text-2xl font-thmanyah font-bold text-white mt-0.5">
                  {stats.total_users}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#efa83f]/20 flex items-center justify-center text-[#efa83f]">
                <Users className="w-4 h-4" />
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#dbc397] font-medium">الجمعيات المعتمدة</p>
                <p className="text-2xl font-thmanyah font-bold text-[#fae1b7] mt-0.5">
                  {stats.total_associations}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#efa83f]/20 flex items-center justify-center text-[#efa83f]">
                <Building2 className="w-4 h-4" />
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#dbc397] font-medium">الفعاليات المنظمة</p>
                <p className="text-2xl font-thmanyah font-bold text-white mt-0.5">
                  {stats.total_events}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#efa83f]/20 flex items-center justify-center text-[#efa83f]">
                <Calendar className="w-4 h-4" />
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#dbc397] font-medium">تأكيدات الحضور</p>
                <p className="text-2xl font-thmanyah font-bold text-[#fae1b7] mt-0.5">
                  {stats.total_rsvps}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#efa83f]/20 flex items-center justify-center text-[#efa83f]">
                <Ticket className="w-4 h-4" />
              </div>
            </div>
          </div>
        </section>

        {/* Tabs Navigation */}
        <Tabs defaultValue="overview" className="space-y-6" dir="rtl">
          <TabsList className="bg-white p-1.5 rounded-2xl border border-[#dbc397]/70 shadow-xs h-auto w-full flex flex-wrap gap-1">
            <TabsTrigger
              value="overview"
              className="flex-1 min-w-[130px] px-3.5 py-2.5 text-xs sm:text-sm font-bold rounded-xl text-[#723c11] data-[state=active]:bg-[#301809] data-[state=active]:text-[#fae1b7] data-[state=active]:shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <BarChart3 className="w-4 h-4" />
              <span>الإحصائيات والجمعيات</span>
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="flex-1 min-w-[130px] px-3.5 py-2.5 text-xs sm:text-sm font-bold rounded-xl text-[#723c11] data-[state=active]:bg-[#301809] data-[state=active]:text-[#fae1b7] data-[state=active]:shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Users className="w-4 h-4" />
              <span>المستخدمون والأدوار</span>
            </TabsTrigger>
            <TabsTrigger
              value="heritage"
              className="flex-1 min-w-[140px] px-3.5 py-2.5 text-xs sm:text-sm font-bold rounded-xl text-[#723c11] data-[state=active]:bg-[#301809] data-[state=active]:text-[#fae1b7] data-[state=active]:shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <MapPin className="w-4 h-4" />
              <span>المعالم والطلبات</span>
              {pendingSuggestionsCount + contactRequestsCount > 0 && (
                <span className="bg-[#efa83f] text-[#301809] text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {pendingSuggestionsCount + contactRequestsCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="history-refs"
              className="flex-1 min-w-[130px] px-3.5 py-2.5 text-xs sm:text-sm font-bold rounded-xl text-[#723c11] data-[state=active]:bg-[#301809] data-[state=active]:text-[#fae1b7] data-[state=active]:shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <BookOpen className="w-4 h-4" />
              <span>مراجع الباحث</span>
            </TabsTrigger>
            <TabsTrigger
              value="ads"
              className="flex-1 min-w-[120px] px-3.5 py-2.5 text-xs sm:text-sm font-bold rounded-xl text-[#723c11] data-[state=active]:bg-[#301809] data-[state=active]:text-[#fae1b7] data-[state=active]:shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Megaphone className="w-4 h-4" />
              <span>الشركاء والرعاة</span>
            </TabsTrigger>
            <TabsTrigger
              value="broadcast"
              className="flex-1 min-w-[120px] px-3.5 py-2.5 text-xs sm:text-sm font-bold rounded-xl text-[#723c11] data-[state=active]:bg-[#301809] data-[state=active]:text-[#fae1b7] data-[state=active]:shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>بث إشعار عام</span>
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent
            value="overview"
            className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 shadow-xs border border-[#e3d4b8] rounded-3xl bg-white overflow-hidden">
                <CardHeader className="bg-[#fdfbf7] border-b border-[#e3d4b8]/70 pb-4">
                  <CardTitle className="text-base md:text-lg font-thmanyah font-bold text-[#301809] flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#b87a29]" />
                    <span>النشاط الشهري — الفعاليات وتأكيدات الحضور</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-80 w-full pt-6" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyStats}
                      margin={{ top: 16, right: 24, left: 12, bottom: 5 }}
                    >
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#723c11', fontWeight: 'bold', fontSize: 12 }}
                      />
                      <YAxis
                        tick={{ fill: '#723c11', fontWeight: 'bold', fontSize: 12 }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(239, 168, 63, 0.1)' }}
                        contentStyle={{
                          borderRadius: '16px',
                          border: '1px solid #dbc397',
                          boxShadow: '0 10px 25px -5px rgba(48, 24, 9, 0.12)',
                          fontWeight: 'bold',
                          direction: 'rtl',
                          backgroundColor: '#ffffff',
                          color: '#301809',
                        }}
                        itemStyle={{ color: '#301809', fontWeight: 'bold' }}
                        labelStyle={{ color: '#b87a29', fontWeight: 'bold', marginBottom: '4px' }}
                      />
                      <Legend
                        wrapperStyle={{ fontWeight: 'bold', direction: 'rtl', paddingTop: '10px' }}
                      />
                      <Bar dataKey="الفعاليات" fill="#301809" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="الزوار" fill="#efa83f" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Create Association Card */}
              <Card className="shadow-xs border border-[#e3d4b8] rounded-3xl overflow-hidden bg-white">
                <div className="bg-gradient-to-l from-[#301809] via-[#4a250e] to-[#2b1507] text-white p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#efa83f]/20 border border-[#efa83f]/40 flex items-center justify-center text-[#efa83f] shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-thmanyah font-bold text-[#fae1b7]">
                        اعتماد جمعية جديدة
                      </h3>
                      <p className="text-[11px] text-[#dbc397] mt-0.5">
                        تفعيل صلاحيات تنظيم الفعاليات لممثل جمعية
                      </p>
                    </div>
                  </div>
                </div>
                <CardContent className="pt-5">
                  <form onSubmit={handleCreateAssociation} className="space-y-4 text-right">
                    <div className="space-y-1.5">
                      <Label htmlFor="assocName" className="font-bold text-xs text-[#301809]">
                        اسم الجمعية الرسمية
                      </Label>
                      <Input
                        id="assocName"
                        value={assocName}
                        onChange={(e) => setAssocName(e.target.value)}
                        placeholder="مثال: جمعية الإحسان للتراث"
                        required
                        className="h-11 font-medium border border-[#dbc397] bg-[#fdfbf7] rounded-xl focus-visible:border-[#b87a29]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="managerEmail" className="font-bold text-xs text-[#301809]">
                        البريد الإلكتروني لممثل الجمعية
                      </Label>
                      <Input
                        id="managerEmail"
                        type="email"
                        value={managerEmail}
                        onChange={(e) => setManagerEmail(e.target.value)}
                        placeholder="manager@example.com"
                        className="h-11 text-left font-sans border border-[#dbc397] bg-[#fdfbf7] rounded-xl focus-visible:border-[#b87a29]"
                        dir="ltr"
                        required
                      />
                      <p className="text-[11px] text-[#723c11] bg-[#fae1b7]/40 p-2.5 rounded-xl border border-[#dbc397]/60 mt-1.5 leading-relaxed">
                        يجب أن يكون الممثل قد سجّل دخوله مسبقاً في المنصة ليرتبط حسابه بالجمعية
                        تلقائياً.
                      </p>
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-11 text-sm font-thmanyah font-bold bg-gradient-to-l from-[#b87a29] to-[#efa83f] hover:from-[#723c11] hover:to-[#b87a29] text-[#301809] hover:text-white shadow-sm rounded-xl cursor-pointer transition-all"
                    >
                      {loading ? 'جاري الاعتماد...' : 'اعتماد الجمعية وتفعيل الصلاحيات'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Category Distribution Analytics Card */}
            <Card className="shadow-xs border border-[#e3d4b8] rounded-3xl bg-white overflow-hidden">
              <CardHeader className="bg-[#fdfbf7] border-b border-[#e3d4b8]/70 pb-4">
                <CardTitle className="text-base md:text-lg font-thmanyah font-bold text-[#301809] flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#b87a29]" />
                  <span>توزيع الفعاليات المعتمدة حسب المجالات</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                  {categoryStats.map((cat) => (
                    <div
                      key={cat.name}
                      className="p-4 rounded-2xl bg-[#fdfbf7] border border-[#e3d4b8] space-y-2.5"
                    >
                      <div className="flex justify-between items-center text-xs font-bold text-[#301809]">
                        <span>{cat.name}</span>
                        <span className="bg-[#fae1b7]/70 text-[#723c11] px-2 py-0.5 rounded-full border border-[#dbc397]">
                          {cat.count}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-[#fae1b7]/40 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-l from-[#301809] via-[#b87a29] to-[#efa83f] rounded-full transition-all duration-700"
                          style={{ width: `${Math.max(cat.pct, cat.count > 0 ? 12 : 0)}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-[#723c11]/80 font-semibold text-left">
                        {cat.pct}% من الإجمالي
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Associations Accordion */}
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#e3d4b8]">
                <h2 className="text-lg md:text-xl font-thmanyah font-bold text-[#301809] flex items-center gap-2.5">
                  <Building2 className="w-5 h-5 text-[#b87a29]" />
                  <span>الجمعيات المعتمدة وفعالياتها القادمة ({associationsDetails.length})</span>
                </h2>
              </div>
              <div className="space-y-3">
                {associationsDetails.length === 0 ? (
                  <div className="text-center text-[#723c11] py-12 bg-white rounded-3xl border border-dashed border-[#dbc397] font-bold text-sm">
                    لا توجد جمعيات مسجلة حتى الآن.
                  </div>
                ) : (
                  associationsDetails.map((assoc) => (
                    <Card
                      key={assoc.id}
                      className="overflow-hidden shadow-xs hover:shadow-md transition-all border border-[#e3d4b8] rounded-2xl bg-white"
                    >
                      <div
                        className="flex items-center justify-between p-4.5 cursor-pointer bg-white hover:bg-[#fae1b7]/15 transition-colors gap-3"
                        onClick={() => toggleAccordion(assoc.id)}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#301809] to-[#723c11] flex items-center justify-center text-[#efa83f] shrink-0">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm sm:text-base font-thmanyah font-bold text-[#301809] truncate">
                              {assoc.name}
                            </h3>
                            <p
                              className="text-xs text-[#723c11]/80 font-mono truncate mt-0.5"
                              dir="ltr"
                            >
                              {assoc.users?.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/association-profile/${assoc.id}`);
                            }}
                            className="h-8 px-3 rounded-xl border-[#dbc397] text-[#301809] hover:bg-[#fae1b7]/50 text-xs font-bold cursor-pointer gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-[#b87a29]" />
                            <span className="hidden sm:inline">صفحة الجمعية</span>
                          </Button>
                          <span className="bg-[#fae1b7]/60 text-[#723c11] border border-[#dbc397] px-2.5 py-1 rounded-full text-xs font-bold">
                            {assoc.events?.filter((e: any) => e !== null).length || 0} فعالية
                          </span>
                          {expandedAssocId === assoc.id ? (
                            <ChevronUp className="h-4 w-4 text-[#b87a29]" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-[#b87a29]" />
                          )}
                        </div>
                      </div>

                      {expandedAssocId === assoc.id && (
                        <div className="bg-[#fdfbf7] border-t border-[#e3d4b8] p-4.5">
                          {assoc.events && assoc.events.filter((e: any) => e !== null).length > 0 ? (
                            <ul className="space-y-2.5">
                              {assoc.events
                                .filter((e: any) => e !== null)
                                .map((event: any) => (
                                  <li
                                    key={event.id}
                                    className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-[#e3d4b8]"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="w-2 h-2 rounded-full bg-[#efa83f] shrink-0" />
                                      <span className="font-bold text-sm text-[#301809] truncate">
                                        {event.title}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#723c11] bg-[#fae1b7]/45 px-2.5 py-1 rounded-lg border border-[#dbc397] shrink-0">
                                      <Calendar className="h-3.5 w-3.5 text-[#b87a29]" />
                                      <span dir="ltr">{event.date}</span>
                                    </div>
                                  </li>
                                ))}
                            </ul>
                          ) : (
                            <p className="text-[#723c11]/75 text-center py-5 bg-white rounded-xl border border-dashed border-[#dbc397] text-xs font-semibold">
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

          {/* USERS TAB */}
          <TabsContent
            value="users"
            className="mt-0 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            {/* Compact Role Stats Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <Card className="bg-white border border-[#e3d4b8] rounded-2xl shadow-xs p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#723c11]">إجمالي الحسابات</p>
                    <p className="text-2xl font-thmanyah font-bold text-[#301809] mt-1">
                      {usersList.length}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#fae1b7]/45 border border-[#dbc397] flex items-center justify-center text-[#723c11]">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
              </Card>

              <Card className="bg-white border border-[#e3d4b8] rounded-2xl shadow-xs p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#723c11]">الزوار والمشاركون</p>
                    <p className="text-2xl font-thmanyah font-bold text-[#b87a29] mt-1">
                      {usersList.filter((u) => u.role === 'attendee').length}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-[#b87a29]">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
              </Card>

              <Card className="bg-white border border-[#e3d4b8] rounded-2xl shadow-xs p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#723c11]">مسؤولو الجمعيات</p>
                    <p className="text-2xl font-thmanyah font-bold text-[#723c11] mt-1">
                      {usersList.filter((u) => u.role === 'association').length}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#fae1b7]/60 border border-[#dbc397] flex items-center justify-center text-[#723c11]">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>
              </Card>

              <Card className="bg-white border border-[#e3d4b8] rounded-2xl shadow-xs p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#723c11]">المدراء العامون</p>
                    <p className="text-2xl font-thmanyah font-bold text-[#301809] mt-1">
                      {usersList.filter((u) => u.role === 'super_admin').length}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#301809] flex items-center justify-center text-[#efa83f]">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Search, Filter & Actions Toolbar */}
            <Card className="bg-white border border-[#e3d4b8] rounded-2xl shadow-xs p-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
                <div className="relative flex-1">
                  <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b87a29]" />
                  <Input
                    type="text"
                    placeholder="ابحث بالبريد الإلكتروني أو المعرّف..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="pr-10 h-10 bg-[#fdfbf7] border border-[#dbc397] rounded-xl font-medium text-sm focus-visible:border-[#b87a29]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    type="button"
                    variant={userRoleFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setUserRoleFilter('all')}
                    className={`rounded-xl text-xs font-bold h-10 px-3.5 transition-all cursor-pointer ${
                      userRoleFilter === 'all'
                        ? 'bg-[#301809] text-[#fae1b7] border-[#301809]'
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
                    className={`rounded-xl text-xs font-bold h-10 px-3.5 transition-all cursor-pointer ${
                      userRoleFilter === 'attendee'
                        ? 'bg-[#b87a29] text-white border-[#b87a29]'
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
                    className={`rounded-xl text-xs font-bold h-10 px-3.5 transition-all cursor-pointer ${
                      userRoleFilter === 'association'
                        ? 'bg-[#723c11] text-[#fae1b7] border-[#723c11]'
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
                    className={`rounded-xl text-xs font-bold h-10 px-3.5 transition-all cursor-pointer ${
                      userRoleFilter === 'super_admin'
                        ? 'bg-[#301809] text-[#efa83f] border-[#301809]'
                        : 'border-[#dbc397] text-[#723c11] hover:bg-[#fae1b7]/30'
                    }`}
                  >
                    مدراء
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={fetchUsers}
                    disabled={usersLoading}
                    className="rounded-xl h-10 w-10 p-0 border-[#dbc397] text-[#723c11] hover:bg-[#fae1b7]/30 hover:text-[#301809] cursor-pointer"
                    title="تحديث القائمة"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${usersLoading ? 'animate-spin text-[#b87a29]' : ''}`}
                    />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Users Table */}
            <Card className="bg-white border border-[#e3d4b8] rounded-3xl shadow-xs overflow-hidden">
              {usersLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#723c11]">
                  <Loader2 className="w-8 h-8 animate-spin text-[#b87a29]" />
                  <p className="font-bold text-sm">جاري تحميل بيانات المستخدمين...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <UserX className="w-11 h-11 text-[#dbc397] mx-auto mb-3" />
                  <h3 className="text-base font-thmanyah font-bold text-[#301809]">
                    لم يتم العثور على أي مستخدمين
                  </h3>
                  <p className="text-xs text-[#723c11]/80 mt-1">
                    جرب تغيير كلمات البحث أو الفلتر أعلاه
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-[#fdfbf7] border-b border-[#e3d4b8] text-[#723c11] text-xs font-bold">
                        <th className="p-4">المستخدم</th>
                        <th className="p-4">تاريخ التسجيل</th>
                        <th className="p-4">النقاط والشارة</th>
                        <th className="p-4">الرتبة الحالية</th>
                        <th className="p-4 text-center">تغيير الرتبة</th>
                        <th className="p-4 text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e3d4b8]/60 text-sm font-medium">
                      {filteredUsers.map((user) => {
                        const isCurrentUserUpdating = updatingUserId === user.id;
                        return (
                          <tr
                            key={user.id}
                            className="hover:bg-[#fae1b7]/15 transition-colors"
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-[#fae1b7]/70 border border-[#dbc397] flex items-center justify-center font-bold text-[#301809] uppercase shrink-0 text-xs">
                                  {user.email ? user.email.charAt(0) : 'U'}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-[#301809] truncate text-xs sm:text-sm" dir="ltr">
                                    {user.email || 'بدون بريد'}
                                  </p>
                                  <p
                                    className="text-[11px] text-[#723c11]/65 font-mono truncate"
                                    dir="ltr"
                                  >
                                    ID: {user.id.substring(0, 8)}...
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="p-4 text-[#723c11] text-xs font-semibold">
                              {user.created_at
                                ? new Date(user.created_at).toLocaleDateString('ar-DZ', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })
                                : '—'}
                            </td>

                            <td className="p-4">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="bg-[#fae1b7]/50 text-[#723c11] border border-[#dbc397] px-2.5 py-0.5 rounded-lg text-xs font-bold">
                                  {user.points ?? 0} نقطة
                                </span>
                                {user.badge && (
                                  <span className="text-[11px] text-[#301809] bg-[#fdfbf7] border border-[#dbc397] px-2 py-0.5 rounded-md font-semibold">
                                    {user.badge}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="p-4">
                              {user.role === 'super_admin' ? (
                                <span className="inline-flex items-center gap-1.5 bg-[#301809] text-[#efa83f] px-3 py-1 rounded-full text-xs font-bold">
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  مدير عام
                                </span>
                              ) : user.role === 'association' ? (
                                <span className="inline-flex items-center gap-1.5 bg-[#fae1b7] text-[#301809] border border-[#dbc397] px-3 py-1 rounded-full text-xs font-bold">
                                  <Building2 className="w-3.5 h-3.5 text-[#b87a29]" />
                                  ممثل جمعية
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 bg-[#fdfbf7] text-[#723c11] border border-[#dbc397] px-3 py-1 rounded-full text-xs font-bold">
                                  <Users className="w-3.5 h-3.5 text-[#b87a29]" />
                                  مشارك / زائر
                                </span>
                              )}
                            </td>

                            <td className="p-4 text-center">
                              <div className="inline-flex items-center gap-1 bg-[#fdfbf7] p-1 rounded-xl border border-[#dbc397]">
                                <button
                                  type="button"
                                  disabled={isCurrentUserUpdating || user.role === 'attendee'}
                                  onClick={() => handleUpdateUserRole(user.id, 'attendee')}
                                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                    user.role === 'attendee'
                                      ? 'bg-[#b87a29] text-white'
                                      : 'text-[#723c11] hover:text-[#301809] hover:bg-[#fae1b7]/40'
                                  } disabled:opacity-50`}
                                >
                                  زائر
                                </button>
                                <button
                                  type="button"
                                  disabled={isCurrentUserUpdating || user.role === 'association'}
                                  onClick={() => handleUpdateUserRole(user.id, 'association')}
                                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                    user.role === 'association'
                                      ? 'bg-[#723c11] text-[#fae1b7]'
                                      : 'text-[#723c11] hover:text-[#301809] hover:bg-[#fae1b7]/40'
                                  } disabled:opacity-50`}
                                >
                                  جمعية
                                </button>
                                <button
                                  type="button"
                                  disabled={isCurrentUserUpdating || user.role === 'super_admin'}
                                  onClick={() => handleUpdateUserRole(user.id, 'super_admin')}
                                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                    user.role === 'super_admin'
                                      ? 'bg-[#301809] text-[#efa83f]'
                                      : 'text-[#723c11] hover:text-[#301809] hover:bg-[#fae1b7]/40'
                                  } disabled:opacity-50`}
                                >
                                  مدير
                                </button>
                              </div>
                            </td>

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

          {/* HERITAGE TAB */}
          <TabsContent
            value="heritage"
            className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            {/* Incoming Association Join & Contact Requests */}
            {contactRequestsCount > 0 && (
              <Card className="border border-emerald-300 bg-emerald-50/40 rounded-3xl p-5 shadow-xs space-y-4">
                <h3 className="text-base md:text-lg font-thmanyah font-bold text-emerald-950 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-700" />
                  <span>طلبات انضمام الجمعيات ورسائل التواصل ({contactRequestsCount})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {heritageItems
                    .filter(
                      (item) => parseHeritageMeta(item.content, item.title).status === 'contact_request'
                    )
                    .map((item) => {
                      const meta = parseHeritageMeta(item.content, item.title);
                      return (
                        <div
                          key={item.id}
                          className="bg-white rounded-2xl p-4 border border-emerald-200 flex flex-col justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span className="text-xs font-bold bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full">
                                {meta.category || 'طلب تواصل'}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {new Date(item.created_at).toLocaleDateString('ar-DZ')}
                              </span>
                            </div>
                            <h4 className="font-thmanyah font-bold text-base text-[#301809] mb-1">
                              {item.title}
                            </h4>
                            <p className="text-xs text-[#723c11] whitespace-pre-wrap leading-relaxed">
                              {meta.cleanContent}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-emerald-100">
                            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                              {meta.contactPhone && (
                                <a
                                  href={`tel:${meta.contactPhone}`}
                                  className="inline-flex items-center gap-1.5 bg-[#fae1b7]/60 text-[#301809] px-2.5 py-1 rounded-lg font-mono"
                                  dir="ltr"
                                >
                                  <Phone className="w-3.5 h-3.5 text-[#b87a29]" />
                                  {meta.contactPhone}
                                </a>
                              )}
                              {meta.contactEmail && (
                                <a
                                  href={`mailto:${meta.contactEmail}`}
                                  className="inline-flex items-center gap-1.5 bg-stone-100 text-stone-700 px-2.5 py-1 rounded-lg font-mono"
                                  dir="ltr"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                  {meta.contactEmail}
                                </a>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteItem('heritage_archive', item.id)}
                              className="text-red-500 hover:bg-red-50 rounded-xl h-8 px-2.5 text-xs font-bold cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5 ml-1" /> أرشفة / حذف
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </Card>
            )}

            {/* Pending Community Heritage Suggestions */}
            {pendingSuggestionsCount > 0 && (
              <Card className="border border-amber-300 bg-amber-50/50 rounded-3xl p-5 shadow-xs space-y-4">
                <h3 className="text-base md:text-lg font-thmanyah font-bold text-[#301809] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#b87a29]" />
                  <span>معالم تاريخية مقترحة من الزوار ({pendingSuggestionsCount})</span>
                </h3>
                <div className="space-y-3">
                  {heritageItems
                    .filter((item) => parseHeritageMeta(item.content, item.title).status === 'pending')
                    .map((item) => {
                      const meta = parseHeritageMeta(item.content, item.title);
                      return (
                        <div
                          key={item.id}
                          className="bg-white rounded-2xl p-4 border border-[#dbc397] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="bg-[#301809] text-[#efa83f] text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                                {meta.category}
                              </span>
                              {meta.contributor && (
                                <span className="text-xs font-semibold text-[#723c11]">
                                  اقتراح من: {meta.contributor}
                                </span>
                              )}
                            </div>
                            <h4 className="font-thmanyah font-bold text-base text-[#301809]">
                              {item.title}
                            </h4>
                            <p className="text-xs text-[#723c11]/85 leading-relaxed whitespace-pre-wrap">
                              {meta.cleanContent}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              onClick={() => handleApproveHeritageSuggestion(item)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-9 px-3.5 cursor-pointer gap-1.5"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>اعتماد وإظهار</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteItem('heritage_archive', item.id)}
                              className="text-red-500 hover:bg-red-50 h-9 w-9 rounded-xl cursor-pointer"
                              title="رفض وحذف"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="shadow-xs border border-[#e3d4b8] rounded-3xl overflow-hidden bg-white">
                <div className="bg-gradient-to-l from-[#301809] via-[#4a250e] to-[#2b1507] text-white p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#efa83f]/20 border border-[#efa83f]/40 flex items-center justify-center text-[#efa83f] shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-thmanyah font-bold text-[#fae1b7]">
                        إضافة معلم تاريخي جديد
                      </h3>
                      <p className="text-[11px] text-[#dbc397] mt-0.5">
                        يُدرج مباشرة في أرشيف وخريطة التراث
                      </p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-5">
                  <form onSubmit={handleCreateHeritage} className="space-y-4 text-right">
                    <div className="space-y-1.5">
                      <Label className="font-bold text-xs text-[#301809]">
                        اسم المعلم التاريخي *
                      </Label>
                      <Input
                        required
                        value={newHeritage.title}
                        onChange={(e) => setNewHeritage({ ...newHeritage, title: e.target.value })}
                        placeholder="مثال: قصر أنقوصة العتيق / باب عمي"
                        className="h-11 font-medium border border-[#dbc397] bg-[#fdfbf7] rounded-xl focus-visible:border-[#b87a29]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-bold text-xs text-[#301809]">تصنيف المعلم</Label>
                      <select
                        value={newHeritage.category}
                        onChange={(e) =>
                          setNewHeritage({ ...newHeritage, category: e.target.value })
                        }
                        className="w-full h-11 rounded-xl border border-[#dbc397] bg-[#fdfbf7] px-3 text-xs font-bold text-[#301809] focus:outline-none focus:border-[#b87a29]"
                      >
                        {HERITAGE_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <Label className="font-bold text-[11px] text-[#301809]">
                          خط العرض (Lat)
                        </Label>
                        <Input
                          type="number"
                          step="any"
                          dir="ltr"
                          value={newHeritage.lat}
                          onChange={(e) => setNewHeritage({ ...newHeritage, lat: e.target.value })}
                          placeholder="31.9668"
                          className="h-10 border border-[#dbc397] bg-[#fdfbf7] rounded-xl text-left font-mono text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="font-bold text-[11px] text-[#301809]">
                          خط الطول (Lng)
                        </Label>
                        <Input
                          type="number"
                          step="any"
                          dir="ltr"
                          value={newHeritage.lng}
                          onChange={(e) => setNewHeritage({ ...newHeritage, lng: e.target.value })}
                          placeholder="5.3271"
                          className="h-10 border border-[#dbc397] bg-[#fdfbf7] rounded-xl text-left font-mono text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-bold text-xs text-[#301809]">
                        الوصف والسياق التاريخي *
                      </Label>
                      <Textarea
                        required
                        value={newHeritage.content}
                        onChange={(e) =>
                          setNewHeritage({ ...newHeritage, content: e.target.value })
                        }
                        placeholder="تفاصيل تاريخية عن المعلم وموقعه..."
                        rows={4}
                        className="font-medium border border-[#dbc397] bg-[#fdfbf7] rounded-xl focus-visible:border-[#b87a29]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-bold text-xs text-[#301809]">
                        رابط صورة المعلم (اختياري)
                      </Label>
                      <Input
                        value={newHeritage.image_url}
                        onChange={(e) =>
                          setNewHeritage({ ...newHeritage, image_url: e.target.value })
                        }
                        placeholder="https://..."
                        dir="ltr"
                        className="h-11 border border-[#dbc397] bg-[#fdfbf7] rounded-xl text-left font-sans focus-visible:border-[#b87a29]"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-l from-[#b87a29] to-[#efa83f] hover:from-[#723c11] hover:to-[#b87a29] h-11 text-sm font-thmanyah font-bold text-[#301809] hover:text-white rounded-xl shadow-sm cursor-pointer transition-all"
                    >
                      إضافة المعلم إلى الأرشيف
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="lg:col-span-2 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#e3d4b8]">
                  <h3 className="text-lg font-thmanyah font-bold text-[#301809] flex items-center gap-2">
                    <History className="w-5 h-5 text-[#b87a29]" />
                    <span>
                      المعالم المعتمدة (
                      {
                        heritageItems.filter(
                          (item) => parseHeritageMeta(item.content, item.title).status === 'approved'
                        ).length
                      }
                      )
                    </span>
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/map')}
                    className="h-9 rounded-xl border-[#dbc397] text-[#301809] hover:bg-[#fae1b7]/40 text-xs font-bold cursor-pointer gap-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#b87a29]" />
                    <span>معاينة خريطة التراث</span>
                  </Button>
                </div>

                {heritageItems
                  .filter(
                    (item) => parseHeritageMeta(item.content, item.title).status === 'approved'
                  )
                  .map((item) => {
                    const meta = parseHeritageMeta(item.content, item.title);
                    return (
                      <Card
                        key={item.id}
                        className="p-4 flex gap-4 items-center bg-white shadow-xs hover:shadow-md transition-all border border-[#e3d4b8] rounded-2xl"
                      >
                        <div className="w-18 h-18 rounded-xl bg-[#fae1b7]/40 border border-[#dbc397] flex items-center justify-center overflow-hidden shrink-0 relative">
                          <img
                            src={item.image_url}
                            className="object-cover h-full w-full"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback =
                                e.currentTarget.parentElement?.querySelector(
                                  '.admin-heritage-thumb-fallback'
                                );
                              if (fallback) fallback.classList.remove('hidden');
                            }}
                          />
                          <div className="admin-heritage-thumb-fallback hidden absolute inset-0 bg-[#fae1b7] flex items-center justify-center">
                            <History size={22} className="text-[#b87a29]" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="bg-[#fae1b7]/70 text-[#301809] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#dbc397]">
                              {meta.category}
                            </span>
                            {meta.lat !== undefined && meta.lng !== undefined && (
                              <span
                                className="text-[10px] font-mono bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md inline-flex items-center gap-1"
                                dir="ltr"
                              >
                                <MapPin className="w-3 h-3 text-[#b87a29]" />
                                {meta.lat.toFixed(4)}, {meta.lng.toFixed(4)}
                              </span>
                            )}
                            {meta.contributor && (
                              <span className="text-[10px] text-[#723c11]/75 font-semibold">
                                • {meta.contributor}
                              </span>
                            )}
                          </div>
                          <h4 className="font-thmanyah font-bold text-base text-[#301809] truncate">
                            {item.title}
                          </h4>
                          <p className="text-xs text-[#723c11]/80 line-clamp-2 mt-0.5 leading-relaxed">
                            {meta.cleanContent}
                          </p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingHeritage({
                                ...item,
                                cleanContent: meta.cleanContent,
                                category: meta.category,
                                contributor: meta.contributor,
                                lat: meta.lat ?? '',
                                lng: meta.lng ?? '',
                              });
                              setIsHeritageEditOpen(true);
                            }}
                            className="text-[#b87a29] hover:bg-[#fae1b7]/40 h-9 w-9 rounded-xl cursor-pointer"
                            title="تعديل"
                          >
                            <Edit size={17} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteItem('heritage_archive', item.id)}
                            className="text-red-500 hover:bg-red-50 h-9 w-9 rounded-xl cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 size={17} />
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
              </div>
            </div>

            <Dialog open={isHeritageEditOpen} onOpenChange={setIsHeritageEditOpen}>
              <DialogContent
                className="sm:max-w-[500px] border border-[#dbc397] rounded-3xl bg-white"
                dir="rtl"
              >
                <DialogHeader>
                  <DialogTitle className="text-right text-xl font-thmanyah font-bold text-[#301809]">
                    تعديل بيانات المعلم
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    استخدم هذا النموذج لتعديل تفاصيل وإحداثيات المعلم التاريخي.
                  </DialogDescription>
                </DialogHeader>
                {editingHeritage && (
                  <form onSubmit={handleUpdateHeritage} className="space-y-4 text-right pt-3">
                    <div className="space-y-1.5">
                      <Label className="font-bold text-xs text-[#301809]">اسم المعلم</Label>
                      <Input
                        required
                        value={editingHeritage.title}
                        onChange={(e) =>
                          setEditingHeritage({ ...editingHeritage, title: e.target.value })
                        }
                        className="h-11 font-bold border border-[#dbc397] bg-[#fdfbf7] rounded-xl focus-visible:border-[#b87a29]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-bold text-xs text-[#301809]">تصنيف المعلم</Label>
                      <select
                        value={editingHeritage.category || HERITAGE_CATEGORIES[0]}
                        onChange={(e) =>
                          setEditingHeritage({ ...editingHeritage, category: e.target.value })
                        }
                        className="w-full h-11 rounded-xl border border-[#dbc397] bg-[#fdfbf7] px-3 text-xs font-bold text-[#301809]"
                      >
                        {HERITAGE_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <Label className="font-bold text-[11px] text-[#301809]">
                          خط العرض (Lat)
                        </Label>
                        <Input
                          type="number"
                          step="any"
                          dir="ltr"
                          value={editingHeritage.lat ?? ''}
                          onChange={(e) =>
                            setEditingHeritage({ ...editingHeritage, lat: e.target.value })
                          }
                          placeholder="31.9668"
                          className="h-10 border border-[#dbc397] bg-[#fdfbf7] rounded-xl text-left font-mono text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="font-bold text-[11px] text-[#301809]">
                          خط الطول (Lng)
                        </Label>
                        <Input
                          type="number"
                          step="any"
                          dir="ltr"
                          value={editingHeritage.lng ?? ''}
                          onChange={(e) =>
                            setEditingHeritage({ ...editingHeritage, lng: e.target.value })
                          }
                          placeholder="5.3271"
                          className="h-10 border border-[#dbc397] bg-[#fdfbf7] rounded-xl text-left font-mono text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-bold text-xs text-[#301809]">الوصف التاريخي</Label>
                      <Textarea
                        required
                        value={editingHeritage.cleanContent ?? editingHeritage.content}
                        onChange={(e) =>
                          setEditingHeritage({
                            ...editingHeritage,
                            cleanContent: e.target.value,
                            content: e.target.value,
                          })
                        }
                        rows={4}
                        className="font-medium border border-[#dbc397] bg-[#fdfbf7] rounded-xl focus-visible:border-[#b87a29]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-bold text-xs text-[#301809]">رابط الصورة</Label>
                      <Input
                        value={editingHeritage.image_url || ''}
                        onChange={(e) =>
                          setEditingHeritage({ ...editingHeritage, image_url: e.target.value })
                        }
                        dir="ltr"
                        className="h-11 font-sans text-left border border-[#dbc397] bg-[#fdfbf7] rounded-xl focus-visible:border-[#b87a29]"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-l from-[#b87a29] to-[#efa83f] hover:from-[#723c11] hover:to-[#b87a29] h-11 text-sm font-thmanyah font-bold text-[#301809] hover:text-white mt-2 shadow-sm rounded-xl cursor-pointer transition-all"
                    >
                      حفظ التغييرات
                    </Button>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* HISTORY REFS TAB */}
          <TabsContent
            value="history-refs"
            className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <AdminHistoryRefsTab />
          </TabsContent>

          {/* ADS TAB */}
          <TabsContent
            value="ads"
            className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card
                className={`shadow-xs border ${
                  editingAdId
                    ? 'border-[#efa83f] ring-2 ring-[#efa83f]/25'
                    : 'border-[#e3d4b8]'
                } rounded-3xl overflow-hidden bg-white transition-all`}
              >
                <div className="bg-gradient-to-l from-[#301809] via-[#4a250e] to-[#2b1507] text-white p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#efa83f]/20 border border-[#efa83f]/40 flex items-center justify-center text-[#efa83f] shrink-0">
                      {editingAdId ? <Edit className="w-5 h-5" /> : <Megaphone className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="text-base font-thmanyah font-bold text-[#fae1b7]">
                        {editingAdId ? 'تعديل بيانات الشريك' : 'إضافة شريك أو راعٍ'}
                      </h3>
                      <p className="text-[11px] text-[#dbc397] mt-0.5">
                        {editingAdId
                          ? 'حدّث الشعار أو صورة التخصص أو الرابط ثم احفظ'
                          : 'عرض شعارات ورعاة فعاليات ورقلة'}
                      </p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-5">
                  <form onSubmit={handleCreateAd} className="space-y-4 text-right">
                    <div className="space-y-1.5">
                      <Label className="font-bold text-xs text-[#301809]">
                        اسم الشريك / الراعي *
                      </Label>
                      <Input
                        required
                        value={newAd.partner_name}
                        onChange={(e) => setNewAd({ ...newAd, partner_name: e.target.value })}
                        placeholder="مثال: Ignatex، اتصالات الجزائر..."
                        className="h-11 font-medium border border-[#dbc397] bg-[#fdfbf7] rounded-xl focus-visible:border-[#b87a29]"
                      />
                    </div>

                    {/* 1. Logo */}
                    <div className="p-3.5 rounded-2xl bg-[#fdfbf7] border border-[#dbc397] space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <Label className="font-bold text-xs text-[#301809] flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-[#b87a29]" />
                          <span>1. شعار الراعي (Logo)</span>
                        </Label>
                        <span className="text-[10px] font-bold text-[#723c11] bg-[#fae1b7]/70 px-2 py-0.5 rounded-full">
                          للصفحة الرئيسية
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                          className="bg-white border-dashed border border-[#dbc397] cursor-pointer h-11 pt-2 font-medium rounded-xl text-[#723c11] text-xs"
                        />
                        {logoFile && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setLogoFile(null)}
                            className="text-red-500 hover:bg-red-50 rounded-xl shrink-0 h-10 w-10 p-0"
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                      <Input
                        value={newAd.logo_url}
                        onChange={(e) => setNewAd({ ...newAd, logo_url: e.target.value })}
                        placeholder="أو رابط الشعار https://..."
                        dir="ltr"
                        className="h-10 border border-[#dbc397] rounded-xl text-left font-sans text-xs bg-white"
                      />
                    </div>

                    {/* 2. Ad Photo */}
                    <div className="p-3.5 rounded-2xl bg-[#fdfbf7] border border-[#dbc397] space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <Label className="font-bold text-xs text-[#301809] flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-[#b87a29]" />
                          <span>2. صورة الإعلان أو التخصص</span>
                        </Label>
                        <span className="text-[10px] font-bold text-[#723c11] bg-[#fae1b7]/70 px-2 py-0.5 rounded-full">
                          لبنر المشارك
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setAdFile(e.target.files?.[0] || null)}
                          className="bg-white border-dashed border border-[#dbc397] cursor-pointer h-11 pt-2 font-medium rounded-xl text-[#723c11] text-xs"
                        />
                        {adFile && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setAdFile(null)}
                            className="text-red-500 hover:bg-red-50 rounded-xl shrink-0 h-10 w-10 p-0"
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                      <Input
                        value={newAd.image_url}
                        onChange={(e) => setNewAd({ ...newAd, image_url: e.target.value })}
                        placeholder="أو رابط صورة الإعلان https://..."
                        dir="ltr"
                        className="h-10 border border-[#dbc397] rounded-xl text-left font-sans text-xs bg-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-bold text-xs text-[#301809]">
                        الرابط الموجه للشريك (URL)
                      </Label>
                      <Input
                        value={newAd.link}
                        onChange={(e) => setNewAd({ ...newAd, link: e.target.value })}
                        placeholder="https://facebook.com/..."
                        dir="ltr"
                        className="h-11 border border-[#dbc397] bg-[#fdfbf7] rounded-xl text-left font-sans"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      {editingAdId && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancelEditAd}
                          className="flex-1 h-11 rounded-xl border-[#dbc397] text-[#723c11] font-bold cursor-pointer"
                        >
                          إلغاء
                        </Button>
                      )}
                      <Button
                        type="submit"
                        disabled={adUploading}
                        className="flex-1 bg-gradient-to-l from-[#b87a29] to-[#efa83f] hover:from-[#723c11] hover:to-[#b87a29] h-11 text-sm font-thmanyah font-bold text-[#301809] hover:text-white shadow-sm rounded-xl cursor-pointer transition-all"
                      >
                        {adUploading
                          ? 'جاري الحفظ...'
                          : editingAdId
                          ? 'حفظ التعديلات'
                          : 'نشر الإعلان'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-lg font-thmanyah font-bold text-[#301809] flex items-center gap-2 pb-3 border-b border-[#e3d4b8]">
                  <Megaphone className="w-5 h-5 text-[#b87a29]" />
                  <span>الشركاء والرعاة الحاليون ({ads.length})</span>
                </h3>
                {ads.length === 0 ? (
                  <div className="text-center text-[#723c11] py-12 bg-white rounded-3xl border border-dashed border-[#dbc397] font-bold text-sm">
                    لا توجد إعلانات شركاء نشطة حالياً.
                  </div>
                ) : (
                  ads.map((ad) => {
                    let adPhoto = ad.image_url || '';
                    let adLogo = '';
                    if (ad.image_url && ad.image_url.includes('||')) {
                      const parts = ad.image_url.split('||');
                      adPhoto = parts[0] || '';
                      adLogo = parts[1] || '';
                    } else if (ad.partner_name?.toLowerCase().includes('ignatex')) {
                      adLogo = '/ignatex-logo.png';
                    }

                    const isBeingEdited = editingAdId === ad.id;

                    return (
                      <Card
                        key={ad.id}
                        className={`p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-white shadow-xs hover:shadow-md border ${
                          isBeingEdited
                            ? 'border-[#efa83f] bg-[#fae1b7]/15'
                            : 'border-[#e3d4b8]'
                        } rounded-2xl relative overflow-hidden transition-all`}
                      >
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-18 h-16 rounded-xl bg-[#fdfbf7] border border-[#dbc397] flex flex-col items-center justify-center p-1.5 overflow-hidden">
                            {adLogo ? (
                              <img
                                src={adLogo}
                                alt="الشعار"
                                className="object-contain max-h-9 max-w-full"
                              />
                            ) : (
                              <span className="text-[10px] text-stone-400 font-semibold">
                                بدون شعار
                              </span>
                            )}
                            <span className="text-[8px] font-bold text-[#b87a29] mt-auto">
                              الرئيسية
                            </span>
                          </div>

                          <div className="w-22 h-16 rounded-xl bg-[#fdfbf7] border border-[#dbc397] flex flex-col items-center justify-center p-1 overflow-hidden">
                            {adPhoto ? (
                              <img
                                src={adPhoto}
                                alt="صورة التخصص"
                                className="object-cover w-full h-10 rounded-lg"
                              />
                            ) : (
                              <Megaphone size={16} className="text-[#b87a29]" />
                            )}
                            <span className="text-[8px] font-bold text-[#723c11] mt-auto">
                              البنر
                            </span>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-thmanyah font-bold text-[#301809] text-base">
                            {ad.partner_name}
                          </h4>
                          {ad.link && (
                            <a
                              href={ad.link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-[#b87a29] hover:underline flex items-center gap-1 mt-1 truncate"
                              dir="ltr"
                            >
                              <LinkIcon size={12} className="inline shrink-0" />
                              {ad.link}
                            </a>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {adLogo && (
                              <span className="text-[10px] font-bold text-[#723c11] bg-[#fae1b7]/70 border border-[#dbc397] px-2 py-0.5 rounded-full">
                                شعار للرئيسية
                              </span>
                            )}
                            {adPhoto && (
                              <span className="text-[10px] font-bold text-[#723c11] bg-[#fdfbf7] border border-[#dbc397] px-2 py-0.5 rounded-full">
                                صورة للبنر
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                          <Button
                            variant="outline"
                            onClick={() => handleStartEditAd(ad)}
                            className="text-[#301809] border-[#dbc397] hover:bg-[#fae1b7]/50 px-3 h-9 rounded-xl cursor-pointer text-xs font-bold gap-1"
                          >
                            <Edit size={14} className="text-[#b87a29]" />
                            <span>تعديل</span>
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => handleDeleteItem('partner_ads', ad.id)}
                            className="text-red-500 hover:bg-red-50 p-2 h-9 w-9 rounded-xl cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          </TabsContent>

          {/* BROADCAST TAB */}
          <TabsContent
            value="broadcast"
            className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Broadcast Form */}
              <Card className="lg:col-span-7 shadow-xs border border-[#e3d4b8] rounded-3xl bg-white overflow-hidden">
                <div className="bg-gradient-to-l from-[#301809] via-[#4a250e] to-[#2b1507] text-white p-6">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-[#efa83f]/20 border border-[#efa83f]/40 flex items-center justify-center text-[#efa83f] shrink-0">
                      <Megaphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-thmanyah font-bold text-[#fae1b7]">
                        إرسال إشعار عام للمنصة
                      </h3>
                      <p className="text-xs text-[#dbc397] font-medium mt-0.5">
                        يصل هذا التنبيه فورياً لكافة المستخدمين والزوار المشتركين في الإشعارات.
                      </p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6 md:p-7">
                  <form onSubmit={handleSendBroadcast} className="space-y-5 text-right">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="admin-broadcast-title"
                        className="font-bold text-xs text-[#301809]"
                      >
                        عنوان الإشعار
                      </Label>
                      <Input
                        id="admin-broadcast-title"
                        required
                        value={broadcastTitle}
                        onChange={(e) => setBroadcastTitle(e.target.value)}
                        placeholder="مثال: انطلاق فعاليات موسم القصور العتيقة..."
                        className="h-11 font-bold border border-[#dbc397] bg-[#fdfbf7] rounded-xl focus-visible:border-[#b87a29]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="admin-broadcast-body"
                        className="font-bold text-xs text-[#301809]"
                      >
                        نص الرسالة
                      </Label>
                      <Textarea
                        id="admin-broadcast-body"
                        required
                        value={broadcastBody}
                        onChange={(e) => setBroadcastBody(e.target.value)}
                        placeholder="اكتب تفاصيل التنبيه الهام هنا..."
                        rows={5}
                        className="font-medium border border-[#dbc397] bg-[#fdfbf7] rounded-xl focus-visible:border-[#b87a29]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="admin-broadcast-url"
                        className="font-bold text-xs text-[#301809]"
                      >
                        رابط التوجيه (اختياري)
                      </Label>
                      <Input
                        id="admin-broadcast-url"
                        value={broadcastUrl}
                        onChange={(e) => setBroadcastUrl(e.target.value)}
                        placeholder="/heritage أو https://..."
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
                          <span>بث التنبيه العام لجميع الهواتف</span>
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
                          {broadcastTitle || 'عنوان الإشعار يظهر هنا'}
                        </h5>
                        <p className="text-[10px] text-[#723c11] mt-1 font-medium leading-relaxed break-words line-clamp-3">
                          {broadcastBody ||
                            'محتوى رسالة الإشعار كما تكتبه في النموذج سيظهر هنا في شاشة الهاتف...'}
                        </p>
                      </div>
                    </div>

                    <div className="text-center text-[#fae1b7]/35 text-[10px] font-medium mb-3">
                      حرك للأعلى لإلغاء القفل
                    </div>
                  </div>
                </div>
              </div>

              {/* Notification History */}
              <div className="col-span-1 lg:col-span-12 mt-4">
                <h3 className="text-lg font-thmanyah font-bold text-[#301809] flex items-center gap-2 mb-4 pb-2 border-b border-[#e3d4b8]">
                  <History className="w-5 h-5 text-[#b87a29]" />
                  <span>أرشيف الإشعارات المرسلة</span>
                </h3>
                <div className="bg-white border border-[#e3d4b8] rounded-3xl p-4.5 shadow-xs">
                  <div className="flex flex-col gap-3 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
                    {notificationHistory.length === 0 ? (
                      <div className="text-center py-8 text-[#723c11] font-bold text-sm">
                        لا توجد إشعارات سابقة.
                      </div>
                    ) : (
                      notificationHistory.map((notif) => (
                        <div
                          key={notif.id}
                          className="bg-[#fdfbf7] border border-[#e3d4b8] rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-[#b87a29] transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-[#301809] text-sm truncate">
                                {notif.title}
                              </h4>
                              <span
                                className="text-[10px] text-[#723c11] bg-[#fae1b7]/60 border border-[#dbc397] px-2.5 py-0.5 rounded-full shrink-0 font-bold"
                                dir="ltr"
                              >
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
                              <History className="w-3.5 h-3.5 ml-1 text-[#b87a29]" />
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