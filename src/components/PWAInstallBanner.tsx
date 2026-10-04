import { useState } from 'react';
import { usePWA, getOfflineTickets, type OfflineTicket } from '../hooks/usePWA';
import { Download, WifiOff, X, Ticket, Calendar, MapPin, QrCode } from 'lucide-react';
import { Button } from './ui/button';
import { QRCodeSVG } from 'qrcode.react';

export default function PWAInstallBanner() {
  const { isInstallable, isStandalone, isOnline, installApp } = usePWA();
  const [dismissedInstall, setDismissedInstall] = useState(false);
  const [showVault, setShowVault] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<OfflineTicket | null>(null);

  const offlineTickets = getOfflineTickets();

  return (
    <>
      {/* ── 1. Offline Mode Alert Banner ─────────────────────── */}
      {!isOnline && (
        <aside aria-label="تنبيه حالة الاتصال" className="bg-[#301809] text-[#fae1b7] border-b-2 border-[#efa83f] px-4 py-2.5 shadow-lg relative z-[99] flex flex-wrap items-center justify-between gap-3 text-xs font-bold" dir="rtl">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#efa83f] animate-ping" />
            <WifiOff className="w-4 h-4 text-[#efa83f] shrink-0" />
            <span>
              وضع عدم الاتصال (Offline Mode) · المنصة تعمل من الذاكرة المحلية المخزنة.
            </span>
          </div>

          <div className="flex items-center gap-2">
            {offlineTickets.length > 0 && (
              <Button
                size="sm"
                onClick={() => setShowVault(true)}
                className="bg-[#efa83f] hover:bg-[#f0b24d] text-[#301809] font-black rounded-lg h-7 px-2.5 text-[11px] shadow-sm flex items-center gap-1"
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>تذاكري المحفوظة ({offlineTickets.length})</span>
              </Button>
            )}
          </div>
        </aside>
      )}

      {/* ── 2. Install App Prompt Banner ─────────────────────── */}
      {isInstallable && !isStandalone && !dismissedInstall && (
        <aside aria-label="تثبيت التطبيق" className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-md z-[90] bg-[#301809]/95 backdrop-blur-md text-white border-2 border-[#efa83f]/60 rounded-3xl p-4 shadow-2xl animate-in slide-in-from-bottom-5 duration-500" dir="rtl">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#efa83f] to-[#b87a29] flex items-center justify-center text-white shrink-0 shadow-md">
              <Download className="w-6 h-6" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-thmanyah font-bold text-sm text-[#fae1b7]">
                  تثبيت تطبيق تواصل صحراء
                </h4>
                <button
                  onClick={() => setDismissedInstall(true)}
                  className="text-white/40 hover:text-white transition-colors p-1"
                  title="إغلاق"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-[11px] text-[#fae1b7]/80 mt-1 leading-relaxed">
                ثبّت المنصة كتطبيق على شاشتك الرئيسية لتصفح الفعاليات وحفظ تذاكر QR للعمل دون الحاجة لشبكة إنترنت.
              </p>

              <div className="flex items-center gap-2 mt-3">
                <Button
                  onClick={installApp}
                  size="sm"
                  className="bg-gradient-to-r from-[#efa83f] to-[#b87a29] hover:from-[#f0b24d] hover:to-[#854515] text-[#301809] font-black rounded-xl h-8 px-4 text-xs shadow-glow-amber transition-all"
                >
                  تثبيت الآن 📲
                </Button>
                <button
                  onClick={() => setDismissedInstall(true)}
                  className="text-[11px] text-[#fae1b7]/60 hover:text-white font-semibold px-2 py-1"
                >
                  لاحقاً
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* ── 3. Offline Tickets Vault Modal ───────────────────── */}
      {showVault && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden my-6 border border-[#dbc397]">
            
            {/* Header */}
            <div className="bg-gradient-to-br from-[#301809] to-[#723c11] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#efa83f]/20 border border-[#efa83f]/40 flex items-center justify-center text-[#efa83f]">
                  <Ticket size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#fae1b7]">تذاكري المخزنة محلياً (Offline)</h3>
                  <p className="text-[11px] text-[#d4b174]">جاهزة للعرض والمسح الضوئي عند البوابة بدون إنترنت</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowVault(false);
                  setSelectedTicket(null);
                }}
                className="text-white/60 hover:text-white p-1.5 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4">
              {offlineTickets.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <Ticket className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="font-bold text-sm">لا توجد تذاكر محفوظة دون اتصال حتى الآن.</p>
                  <p className="text-xs">احجز أي تذكرة أو افتح تذكرتك أثناء اتصالك بالإنترنت ليتم حفظها تلقائياً هنا.</p>
                </div>
              ) : selectedTicket ? (
                /* Selected Ticket Detailed QR View */
                <div className="space-y-4 text-center">
                  <div className="bg-[#fdfbf7] p-5 rounded-2xl border-2 border-[#dbc397]/60 space-y-3">
                    <p className="text-xs font-bold text-[#b87a29]">{selectedTicket.associationName || 'وارجلان (ورقلة)'}</p>
                    <h4 className="text-xl font-thmanyah font-bold text-[#301809]">{selectedTicket.eventTitle}</h4>
                    
                    <div className="flex justify-center py-2">
                      <div className="bg-white p-4 rounded-2xl shadow-md border border-[#dbc397]">
                        <QRCodeSVG
                          value={selectedTicket.ticketId}
                          size={180}
                          level="H"
                          fgColor="#301809"
                          bgColor="#ffffff"
                        />
                      </div>
                    </div>

                    <div className="inline-block bg-[#301809] text-[#efa83f] font-mono font-bold text-xs tracking-widest px-4 py-1.5 rounded-full">
                      #{selectedTicket.ticketId.slice(-8).toUpperCase()}
                    </div>

                    <div className="text-xs text-[#723c11] space-y-1 pt-2 border-t border-[#dbc397]/40">
                      <p className="flex items-center justify-center gap-1.5 font-bold">
                        <Calendar size={14} className="text-[#efa83f]" />
                        <span>{selectedTicket.eventDate}</span>
                        {selectedTicket.eventTime && <span>• {selectedTicket.eventTime.substring(0, 5)}</span>}
                      </p>
                      <p className="flex items-center justify-center gap-1.5 text-slate-500">
                        <MapPin size={14} className="text-[#b87a29]" />
                        <span>{selectedTicket.eventLocation}</span>
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => setSelectedTicket(null)}
                    variant="outline"
                    className="w-full rounded-xl text-xs font-bold border-[#dbc397]"
                  >
                    ← العودة لقائمة التذاكر
                  </Button>
                </div>
              ) : (
                /* List of cached tickets */
                <div className="space-y-3">
                  {offlineTickets.map((t) => (
                    <div
                      key={t.ticketId}
                      onClick={() => setSelectedTicket(t)}
                      className="p-4 rounded-2xl border-2 border-[#dbc397]/60 bg-white hover:border-[#b87a29] transition-all cursor-pointer flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#fae1b7] flex items-center justify-center text-[#723c11] shrink-0">
                          <QrCode size={20} />
                        </div>
                        <div className="min-w-0 text-right">
                          <h4 className="font-bold text-sm text-[#301809] truncate">{t.eventTitle}</h4>
                          <p className="text-xs text-[#723c11]/80 mt-0.5">{t.eventDate} • {t.eventLocation}</p>
                        </div>
                      </div>

                      <span className="shrink-0 text-xs font-bold text-[#b87a29] bg-[#fae1b7]/60 px-3 py-1 rounded-xl">
                        عرض QR
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
              <Button
                onClick={() => {
                  setShowVault(false);
                  setSelectedTicket(null);
                }}
                className="bg-[#301809] hover:bg-[#723c11] text-[#fae1b7] rounded-xl px-6 text-xs font-bold"
              >
                إغلاق
              </Button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
