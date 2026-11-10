import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Calendar,
  Building2,
  BookOpen,
  Sparkles,
  MapPin,
  LogIn,
  User,
  Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

interface UnifiedHeaderProps {
  rightSlot?: React.ReactNode;
}

export default function UnifiedHeader({ rightSlot }: UnifiedHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [hasSession, setHasSession] = useState(false);
  const [userRole, setUserRole] = useState<string>('attendee');

  useEffect(() => {
    const demoRole = localStorage.getItem('demo_role');
    if (demoRole) {
      setHasSession(true);
      setUserRole(demoRole);
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setHasSession(true);
        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();
        if (data?.role) setUserRole(data.role);
      }
    });
  }, [location.pathname]);

  const navItems = [
    { path: '/', label: 'الرئيسية', icon: Home },
    { path: '/events', label: 'دليل الفعاليات', icon: Calendar },
    { path: '/associations', label: 'دليل الجمعيات', icon: Building2 },
    { path: '/heritage', label: 'الأرشيف التراثي', icon: BookOpen },
    { path: '/history-assistant', label: 'الباحث التاريخي', icon: Sparkles },
    { path: '/map', label: 'خريطة التراث', icon: MapPin }
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#fdfbf7]/95 backdrop-blur-md border-b border-[#dbc397]/70 shadow-sm" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-3 cursor-pointer py-1 shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#301809] to-[#b87a29] flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0">
            ص
          </div>
          <div className="flex flex-col text-right whitespace-nowrap">
            <span className="text-lg sm:text-xl font-bold text-[#301809] leading-tight">
              تواصل صحراء
            </span>
            <span className="text-[10px] sm:text-[11px] text-[#723c11]/75 font-medium">
              بوابة وارجلان (ورقلة) وحوض سدراتة
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1.5 xl:gap-2 text-sm font-semibold whitespace-nowrap">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#301809] text-[#fae1b7] font-bold shadow-xs'
                    : 'text-[#723c11] hover:bg-[#fae1b7]/50 hover:text-[#301809]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#efa83f]' : 'text-[#b87a29]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Actions (Right Slot + Login/Dashboard) */}
        <div className="flex items-center gap-2 shrink-0">
          {rightSlot}

          {hasSession ? (
            <Button
              onClick={() => {
                const dest =
                  userRole === 'super_admin'
                    ? '/admin'
                    : userRole === 'association'
                    ? '/association'
                    : '/attendee';
                navigate(dest);
              }}
              className="h-10 sm:h-11 px-3.5 sm:px-4 rounded-xl bg-gradient-to-r from-[#b87a29] to-[#efa83f] hover:from-[#723c11] hover:to-[#b87a29] text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              <User className="w-4 h-4 text-white shrink-0" />
              <span>
                {userRole === 'super_admin'
                  ? 'لوحة الإدارة 🛡️'
                  : userRole === 'association'
                  ? 'لوحة الجمعية 🏛️'
                  : 'حسابي وتذاكري 🎟'}
              </span>
            </Button>
          ) : (
            <Button
              onClick={() => navigate('/login')}
              className="h-10 sm:h-11 px-4 rounded-xl bg-[#301809] hover:bg-[#723c11] text-[#fae1b7] text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              <LogIn className="w-4 h-4 text-[#efa83f] shrink-0" />
              <span>تسجيل الدخول</span>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile & Tablet Navigation Bar */}
      <div className="lg:hidden border-t border-[#dbc397]/40 bg-[#fdfbf7] px-3 py-2 flex items-center justify-start sm:justify-center gap-1.5 overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer whitespace-nowrap ${
                active
                  ? 'bg-[#301809] text-[#fae1b7] shadow-xs'
                  : 'bg-white text-[#723c11] border border-[#dbc397]/70 hover:bg-[#fae1b7]/40'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-[#efa83f]' : 'text-[#b87a29]'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
