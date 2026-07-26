import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

// Standard base64 URL-safe to Uint8Array helper (for VAPID keys)
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Public VAPID Key placeholder. 
// A real production VAPID key would be generated. We provide a default one.
const VAPID_PUBLIC_KEY = 'BJ4_7t_64U8Cyp0RScG7i4B6mGjCgXJz6eM0Z2Uo9Z5299qT7bVz1sP9yQ82-4fBqW-vX9wzG-PqY2g1u4p2L-E';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    'default'
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sync state with browser capabilities and current subscription
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      
      const checkSubscription = async () => {
        const swReg = await navigator.serviceWorker.ready.catch(() => null);
        if (swReg && swReg.pushManager) {
          const sub = await swReg.pushManager.getSubscription();
          setIsSubscribed(!!sub || localStorage.getItem('pwa_push_subscribed') === 'true');
        } else {
          setIsSubscribed(localStorage.getItem('pwa_push_subscribed') === 'true');
        }
      };
      
      checkSubscription();
    }
  }, []);

  // Set up real-time listener for broadcasts and new events
  useEffect(() => {
    if (!isSubscribed) return;

    // 1. Listen to manual broadcasts sent by associations/admins
    const channel = supabase.channel('notifications-broadcast', {
      config: { broadcast: { self: true } }
    });

    channel.on('broadcast', { event: 'alert' }, ({ payload }) => {
      showNativeNotification(payload.title, payload.body, payload.url);
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('متصل بقناة البث المباشر للإشعارات.');
      }
    });

    // 2. Listen to newly created events to notify subscribers automatically
    const eventChannel = supabase.channel('realtime-events')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'events' },
        (payload) => {
          const newEvent = payload.new;
          if (newEvent && newEvent.is_public) {
            showNativeNotification(
              `فعالية جديدة: ${newEvent.title}`,
              newEvent.description || 'تم نشر فعالية جديدة في مجتمعنا، سارع بالتسجيل!',
              `/event/${newEvent.id}`
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(eventChannel);
    };
  }, [isSubscribed]);

  // Function to show a native OS notification
  const showNativeNotification = useCallback((title: string, body: string, urlPath?: string) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    // Use Service Worker if available for better PWA integration
    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification(title, {
        body,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        dir: 'rtl',
        vibrate: [200, 100, 200],
        data: { url: urlPath || '/' }
      } as any);
    }).catch(() => {
      // Fallback to standard client Notification if Service Worker is not available
      const notification = new Notification(title, {
        body,
        icon: '/favicon.svg',
        dir: 'rtl'
      });
      notification.onclick = () => {
        window.focus();
        if (urlPath) {
          window.location.href = urlPath;
        }
      };
    });
  }, []);

  // Request permission and subscribe
  const subscribe = async () => {
    if (!('Notification' in window)) {
      toast.error('متصفحك لا يدعم الإشعارات الفورية.');
      return false;
    }

    setLoading(true);
    try {
      const authState = await supabase.auth.getSession();
      const currentUserId = authState.data.session?.user?.id || null;

      // 1. Request Permission
      const userPerm = await Notification.requestPermission();
      setPermission(userPerm);

      if (userPerm !== 'granted') {
        toast.error('تم رفض إذن الإشعارات. يرجى تفعيلها من إعدادات المتصفح.');
        setLoading(false);
        return false;
      }

      // 2. Register Service Worker Subscription if available
      let subscriptionData = null;
      try {
        const swReg = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Service Worker timeout (dev mode)')), 2000))
        ]);
        if (swReg && swReg.pushManager) {
          const options = {
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
          };
          const subscription = await swReg.pushManager.subscribe(options);
          subscriptionData = subscription;
        }
      } catch (swErr) {
        console.warn('تعذر التسجيل في PushManager (قد يكون ذلك غير مدعوم محلياً):', swErr);
      }

      // 3. Save to database or fallback to localStorage
      if (subscriptionData) {
        const { endpoint, keys } = subscriptionData.toJSON();
        if (endpoint) {
          const { error } = await supabase.from('notifications_subscriptions').insert({
            user_id: currentUserId,
            endpoint,
            keys_auth: keys?.auth || '',
            keys_p256dh: keys?.p256dh || ''
          });

          if (error) {
            console.warn('خطأ أثناء حفظ الاشتراك بقاعدة البيانات، سيتم التخزين محلياً:', error);
          }
        }
      }

      // Save success locally
      setIsSubscribed(true);
      localStorage.setItem('pwa_push_subscribed', 'true');
      toast.success('تم تفعيل الإشعارات بنجاح! ستصلك تنبيهات الفعاليات والأخبار مباشرة على هاتفك.');
      
      // Test notification
      showNativeNotification(
        'تم تفعيل الإشعارات بنجاح! 🔔',
        'أهلاً بك في شبكة تواصل صحراء، ستصلك أخبار وإعلانات الجمعيات فور نشرها.'
      );

      return true;
    } catch (err: any) {
      console.error('فشل تفعيل الإشعارات:', err);
      toast.error('حدث خطأ أثناء تفعيل الإشعارات. يرجى المحاولة لاحقاً.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Unsubscribe
  const unsubscribe = async () => {
    setLoading(true);
    try {
      const swReg = await navigator.serviceWorker.ready.catch(() => null);
      if (swReg && swReg.pushManager) {
        const sub = await swReg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          // Remove from db
          await supabase
            .from('notifications_subscriptions')
            .delete()
            .eq('endpoint', sub.endpoint);
        }
      }
      setIsSubscribed(false);
      localStorage.removeItem('pwa_push_subscribed');
      toast.info('تم إيقاف الإشعارات بنجاح.');
      return true;
    } catch (err) {
      console.error('فشل إلغاء الاشتراك:', err);
      toast.error('حدث خطأ أثناء إلغاء تفعيل الإشعارات.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    permission,
    isSubscribed,
    loading,
    subscribe,
    unsubscribe,
    showNativeNotification
  };
}
