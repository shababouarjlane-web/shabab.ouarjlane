import { useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import { Calendar, Clock, MapPin, Printer, X, Phone, User, Download, Share2 } from 'lucide-react';
import { saveTicketOffline } from '../hooks/usePWA';
import { buildGoogleCalendarUrl, downloadEventIcs, buildWhatsAppShareUrl, parseUserContact } from '../lib/helpers';

interface TicketCardProps {
  event: {
    id: string;
    title: string;
    description?: string;
    date: string;
    start_time: string;
    end_time?: string;
    location: string;
    associations?: { name: string };
  };
  userId: string;
  rsvpId?: string;
  userName?: string;
  userPhone?: string;
  onClose?: () => void;
}

export function buildTicketId(eventId: string, userId: string, rsvpId?: string) {
  return rsvpId
    ? `OUARJLANE::${eventId}::${rsvpId}`
    : `OUARJLANE::${eventId}::${userId}`;
}

export default function TicketCard({ event, userId, rsvpId, userName, userPhone, onClose }: TicketCardProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `تذكرة - ${event.title}`,
  });

  const ticketId = buildTicketId(event.id, userId, rsvpId);
  const shortId = ticketId.slice(-8).toUpperCase();

  const parsedContact = parseUserContact(userName);
  const displayHolderName = parsedContact.name;
  const displayHolderPhone = userPhone || parsedContact.phone;

  // Auto-save ticket to offline storage
  useEffect(() => {
    saveTicketOffline({
      ticketId,
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      eventTime: event.start_time,
      eventLocation: event.location,
      associationName: event.associations?.name,
      userName: displayHolderPhone ? `${displayHolderName} | ${displayHolderPhone}` : displayHolderName,
      savedAt: new Date().toISOString()
    });
  }, [ticketId, event, displayHolderName, displayHolderPhone]);

  const eventUrl = `${window.location.origin}/event/${event.id}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto" dir="rtl">
      <div className="w-full max-w-sm relative my-auto">

        {/* Action buttons above ticket */}
        <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
          {onClose && (
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X size={18} />
            </button>
          )}
          <div className="mr-auto flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => window.open(buildGoogleCalendarUrl(event), '_blank')}
              className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold px-2.5 py-2 rounded-full transition-colors cursor-pointer shadow-sm"
              title="إضافة إلى تقويم Google"
            >
              <Calendar size={13} />
              <span>تقويم Google</span>
            </button>
            <button
              onClick={() => downloadEventIcs(event)}
              className="flex items-center gap-1 bg-[#723c11] hover:bg-[#301809] text-[#fae1b7] text-[11px] font-bold px-2.5 py-2 rounded-full transition-colors cursor-pointer border border-[#dbc397]/40 shadow-sm"
              title="تحميل ملف التقويم للهاتف"
            >
              <Download size={13} />
              <span>تقويم الهاتف</span>
            </button>
            <button
              onClick={() => window.open(buildWhatsAppShareUrl(event, eventUrl), '_blank')}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-2 rounded-full transition-colors cursor-pointer shadow-sm"
              title="مشاركة عبر واتساب"
            >
              <Share2 size={13} />
              <span>واتساب</span>
            </button>
            <button
              onClick={() => handlePrint()}
              className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold px-3 py-2 rounded-full transition-colors cursor-pointer"
              title="طباعة التذكرة"
            >
              <Printer size={13} />
              <span>طباعة</span>
            </button>
          </div>
        </div>

        {/* Ticket */}
        <div ref={printRef} className="rounded-[28px] overflow-hidden shadow-2xl border-2 border-[#dbc397]/60">

          {/* Top — dark header */}
          <div className="bg-[#1e0f04] px-6 pt-6 pb-5 relative overflow-hidden">
            {/* Subtle pattern circles */}
            <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-[#b87a29]/15 blur-xl" />
            <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-[#efa83f]/10 blur-xl" />

            {/* Association */}
            {event.associations?.name && (
              <p className="text-[#efa83f] text-xs font-bold tracking-wider mb-1.5 relative z-10">
                🏛️ {event.associations.name}
              </p>
            )}

            {/* Event title */}
            <h2 className="text-white text-xl md:text-2xl font-extrabold leading-snug relative z-10">
              {event.title}
            </h2>

            {/* Tifinagh — subtle, decorative only */}
            <div className="text-[#ffffff]/5 text-6xl font-black select-none absolute inset-0 flex items-center justify-center tracking-wider pointer-events-none overflow-hidden">
              ⵡⴰⵔⴵⵍⴰⵏ
            </div>
          </div>

          {/* Ticket punch holes + divider */}
          <div className="bg-[#f5efe6] relative flex items-center">
            <div className="absolute -right-3 w-6 h-6 rounded-full bg-black/70 shadow-inner" />
            <div className="absolute -left-3 w-6 h-6 rounded-full bg-black/70 shadow-inner" />
            <div className="flex-1 mx-6 border-t-2 border-dashed border-[#d4b174]/50" />
          </div>

          {/* Body */}
          <div className="bg-[#fdfbf7] px-6 py-5">

            {/* Event meta — compact row */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs md:text-sm mb-4">
              <div className="flex items-center gap-1.5 text-[#723c11]">
                <Calendar size={14} className="text-[#b87a29]" />
                <span className="font-bold">{event.date}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#723c11]">
                <Clock size={14} className="text-[#b87a29]" />
                <span className="font-bold">{event.start_time?.substring(0, 5)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#723c11] w-full">
                <MapPin size={14} className="text-[#b87a29] shrink-0" />
                <span className="font-bold line-clamp-1">{event.location}</span>
              </div>
            </div>

            {/* Attendee Holder Details Box */}
            <div className="bg-[#fae1b7]/40 border border-[#dbc397] rounded-2xl p-3 mb-4 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-[#301809] font-bold truncate">
                <User size={15} className="text-[#b87a29] shrink-0" />
                <span className="truncate">{displayHolderName}</span>
              </div>
              {displayHolderPhone && (
                <div className="flex items-center gap-1 text-[#723c11] font-mono font-bold shrink-0 bg-white px-2.5 py-1 rounded-lg border border-[#dbc397]" dir="ltr">
                  <Phone size={12} className="text-[#b87a29]" />
                  <span>{displayHolderPhone}</span>
                </div>
              )}
            </div>

            {/* QR Code — centrepiece */}
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-2xl shadow-md border-2 border-[#e8d9c0]">
                <QRCodeSVG
                  value={ticketId}
                  size={155}
                  level="H"
                  fgColor="#1e0f04"
                  bgColor="#ffffff"
                />
              </div>

              {/* Ticket ID badge */}
              <div className="mt-3 bg-[#1e0f04] text-[#efa83f] font-mono font-bold text-xs tracking-[0.25em] px-4 py-1.5 rounded-full shadow-xs">
                #{shortId}
              </div>
              <p className="mt-1.5 text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                <span>✓ محفوظة تلقائياً للعمل بدون إنترنت</span>
              </p>
            </div>
          </div>

          {/* Footer strip */}
          <div className="bg-[#1e0f04] px-6 py-3 text-center">
            <p className="text-[#d4b174] text-[11px] font-bold tracking-wide">أبرز هذه التذكرة عند مدخل الفعالية</p>
          </div>
        </div>
      </div>
    </div>
  );
}
