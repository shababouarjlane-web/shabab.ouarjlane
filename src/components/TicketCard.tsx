import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import { Calendar, Clock, MapPin, Printer, X } from 'lucide-react';

interface TicketCardProps {
  event: {
    id: string;
    title: string;
    date: string;
    start_time: string;
    location: string;
    associations?: { name: string };
  };
  userId: string;
  rsvpId?: string;
  userName?: string;
  onClose?: () => void;
}

function buildTicketId(eventId: string, userId: string, rsvpId?: string) {
  return rsvpId
    ? `OUARJLANE::${eventId}::${rsvpId}`
    : `OUARJLANE::${eventId}::${userId}`;
}

export default function TicketCard({ event, userId, rsvpId, userName, onClose }: TicketCardProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `تذكرة - ${event.title}`,
  });

  const ticketId = buildTicketId(event.id, userId, rsvpId);
  const shortId = ticketId.slice(-8).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" dir="rtl">
      <div className="w-full max-w-xs relative">

        {/* Action buttons above ticket */}
        <div className="flex justify-between items-center mb-3">
          {onClose && (
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors"
            >
              <X size={18} />
            </button>
          )}
          <button
            onClick={() => handlePrint()}
            className="mr-auto flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
          >
            <Printer size={15} />
            طباعة
          </button>
        </div>

        {/* Ticket */}
        <div ref={printRef} className="rounded-[28px] overflow-hidden shadow-2xl">

          {/* Top — dark header */}
          <div className="bg-[#1e0f04] px-6 pt-6 pb-5 relative overflow-hidden">
            {/* Subtle pattern circles */}
            <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-[#b87a29]/15 blur-xl" />
            <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-[#efa83f]/10 blur-xl" />

            {/* Association */}
            {event.associations?.name && (
              <p className="text-[#b87a29] text-xs font-bold tracking-widest uppercase mb-2 relative z-10">
                {event.associations.name}
              </p>
            )}

            {/* Event title */}
            <h2 className="text-white text-2xl font-extrabold leading-snug relative z-10">
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
            <div className="flex-1 mx-6 border-t-2 border-dashed border-[#d4b174]/40" />
          </div>

          {/* Body */}
          <div className="bg-[#fdfbf7] px-6 py-5">

            {/* Event meta — compact row */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm mb-5">
              <div className="flex items-center gap-1.5 text-[#723c11]">
                <Calendar size={13} className="text-[#b87a29]" />
                <span className="font-semibold">{event.date}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#723c11]">
                <Clock size={13} className="text-[#b87a29]" />
                <span className="font-semibold">{event.start_time?.substring(0, 5)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#723c11] w-full">
                <MapPin size={13} className="text-[#b87a29] shrink-0" />
                <span className="font-semibold line-clamp-1">{event.location}</span>
              </div>
            </div>

            {/* QR Code — centrepiece */}
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-2xl shadow-md border border-[#e8d9c0]">
                <QRCodeSVG
                  value={ticketId}
                  size={160}
                  level="H"
                  fgColor="#1e0f04"
                  bgColor="#ffffff"
                  imageSettings={{
                    src: '/favicon.ico',
                    height: 24,
                    width: 24,
                    excavate: true,
                  }}
                />
              </div>

              {/* Ticket ID badge */}
              <div className="mt-3 bg-[#1e0f04] text-[#efa83f] font-mono font-bold text-xs tracking-[0.25em] px-4 py-1.5 rounded-full">
                #{shortId}
              </div>

              {/* Holder name */}
              {userName && (
                <p className="mt-2 text-[#301809]/50 text-xs font-medium">{userName}</p>
              )}
            </div>
          </div>

          {/* Footer strip */}
          <div className="bg-[#1e0f04] px-6 py-3 text-center">
            <p className="text-[#d4b174]/70 text-[11px] tracking-wide">أبرز هذه التذكرة عند المدخل</p>
          </div>
        </div>
      </div>
    </div>
  );
}
