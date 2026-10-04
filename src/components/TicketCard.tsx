import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import { Button } from './ui/button';
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

/** Builds a canonical ticket ID encoded in the QR code */
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
      <div className="w-full max-w-sm relative">
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute -top-4 -right-4 z-10 bg-white rounded-full p-1.5 shadow-lg text-gray-600 hover:text-red-500 transition-colors"
          >
            <X size={18} />
          </button>
        )}

        {/* Print button */}
        <div className="flex justify-end mb-3">
          <Button
            onClick={() => handlePrint()}
            variant="outline"
            size="sm"
            className="bg-white/90 border-[#b87a29] text-[#723c11] hover:bg-[#fae1b7] gap-2"
          >
            <Printer size={15} />
            طباعة التذكرة
          </Button>
        </div>

        {/* Ticket body — this gets printed */}
        <div ref={printRef} className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-[#dbc397]">

          {/* Header stripe */}
          <div className="bg-[#301809] px-6 pt-6 pb-8 text-center relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-[#723c11]/40" />
            <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-[#b87a29]/30" />

            {/* Tifinagh watermark */}
            <div className="text-[#d4b174]/20 text-5xl font-bold tracking-widest select-none absolute inset-0 flex items-center justify-center pointer-events-none">
              ⵡⴰⵔⴵⵍⴰⵏ
            </div>

            <div className="relative z-10">
              <div className="text-[#efa83f] text-xs font-bold tracking-[0.3em] uppercase mb-2">
                ⵜⴰⴼⵓⴽⵜ ⵏ ⵡⴰⵔⴵⵍⴰⵏ
              </div>
              <h2 className="text-white text-xl font-extrabold leading-tight line-clamp-2">
                {event.title}
              </h2>
              {event.associations?.name && (
                <p className="text-[#d4b174] text-sm mt-1">{event.associations.name}</p>
              )}
            </div>
          </div>

          {/* Tear line */}
          <div className="relative h-0">
            <div className="absolute -right-3 -top-4 w-8 h-8 rounded-full bg-[#f9fafb] border border-[#dbc397]" />
            <div className="absolute -left-3 -top-4 w-8 h-8 rounded-full bg-[#f9fafb] border border-[#dbc397]" />
            <div className="border-t-2 border-dashed border-[#dbc397] mx-6" />
          </div>

          {/* Body */}
          <div className="px-6 py-5 bg-[#fdfbf7]">

            {/* Event meta */}
            <div className="space-y-2.5 mb-5 text-sm">
              <div className="flex items-center gap-2 text-[#723c11]">
                <Calendar size={15} className="text-[#b87a29] shrink-0" />
                <span className="font-medium">{event.date}</span>
              </div>
              <div className="flex items-center gap-2 text-[#723c11]">
                <Clock size={15} className="text-[#b87a29] shrink-0" />
                <span className="font-medium">{event.start_time?.substring(0, 5)}</span>
              </div>
              <div className="flex items-center gap-2 text-[#723c11]">
                <MapPin size={15} className="text-[#b87a29] shrink-0" />
                <span className="font-medium line-clamp-1">{event.location}</span>
              </div>
              {userName && (
                <div className="flex items-center gap-2 text-[#723c11]">
                  <span className="text-[#b87a29] text-base shrink-0">🎟</span>
                  <span className="font-semibold">{userName}</span>
                </div>
              )}
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center gap-3 bg-white rounded-2xl p-4 shadow-inner border border-[#dbc397]/60">
              <QRCodeSVG
                value={ticketId}
                size={140}
                level="H"
                imageSettings={{
                  src: '/favicon.ico',
                  height: 22,
                  width: 22,
                  excavate: true,
                }}
                fgColor="#301809"
                bgColor="#ffffff"
              />
              <div className="text-center">
                <div className="font-mono text-[#723c11] font-bold tracking-widest text-xs bg-[#fae1b7] px-3 py-1 rounded-full">
                  #{shortId}
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5">
                  وارجلان (ورقلة) · منصة تواصل شباب وارجلان
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-[#301809] px-6 py-3 text-center">
            <p className="text-[#d4b174] text-[10px] tracking-wide">
              أبرز هذه التذكرة عند المدخل · هذا الرمز خاص بك فقط
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
