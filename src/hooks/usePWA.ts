import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    // Check if running in standalone mode (already installed app)
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    // Listen for install prompt from browser
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Online / Offline listeners
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('تمت استعادة الاتصال بالإنترنت! 🌐', {
        description: 'المنصة متزامنة الآن مع أحدث الفعاليات والتذاكر.',
        duration: 4000
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('أنت تعمل الآن في وضع عدم الاتصال (Offline) 📡', {
        description: 'تذاكرك المحفوظة ومعالم الخريطة متاحة للاستعراض دون إنترنت.',
        duration: 6000
      });
    };

    // Fired by the browser once the app has been installed (any method)
    const handleAppInstalled = () => {
      setIsStandalone(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) {
      // If iOS Safari or unsupported, show friendly instructions
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOS) {
        toast.info('تثبيت التطبيق على آيفون / آيباد 📲', {
          description: 'اضغط على زر المشاركة (Share) في أسفل الشاشة، ثم اختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).',
          duration: 8000
        });
      } else {
        toast.info('يمكنك تثبيت التطبيق من قائمة المتصفح (⋮) ➔ "تثبيت التطبيق" أو "Add to Home screen".');
      }
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        toast.success('تم تثبيت تطبيق تواصل صحراء بنجاح! 🎉');
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.error('Error during PWA install:', err);
    }
    return false;
  };

  return {
    isInstallable,
    isStandalone,
    isOnline,
    hasNativePrompt: !!deferredPrompt,
    installApp
  };
}

// ─── دوال التخزين المحلي للتذاكر أوفلاين (Offline Tickets Storage) ───
const OFFLINE_TICKETS_KEY = 'ouarjlane_offline_tickets_vault';

export interface OfflineTicket {
  ticketId: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  associationName?: string;
  userName?: string;
  savedAt: string;
}

export function saveTicketOffline(ticket: OfflineTicket) {
  try {
    const existing: OfflineTicket[] = JSON.parse(localStorage.getItem(OFFLINE_TICKETS_KEY) || '[]');
    const filtered = existing.filter(t => t.ticketId !== ticket.ticketId);
    filtered.unshift(ticket);
    localStorage.setItem(OFFLINE_TICKETS_KEY, JSON.stringify(filtered.slice(0, 50)));
  } catch (err) {
    console.error('Failed to save ticket offline:', err);
  }
}

export function getOfflineTickets(): OfflineTicket[] {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_TICKETS_KEY) || '[]');
  } catch (err) {
    return [];
  }
}
