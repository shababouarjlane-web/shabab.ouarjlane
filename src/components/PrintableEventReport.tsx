import React from 'react';
import { Calendar, MapPin, Users, CheckCircle2 } from 'lucide-react';
import { parseUserContact } from '../lib/helpers';

interface PrintableEventReportProps {
  event: any;
  rsvps: any[];
  assocName: string;
}

export const PrintableEventReport = React.forwardRef<HTMLDivElement, PrintableEventReportProps>(
  ({ event, rsvps, assocName }, ref) => {
    return (
      <div ref={ref} className="p-10 bg-white text-[#301809] font-sans" dir="rtl">
        {/* Header */}
        <div className="flex justify-between items-start border-b-4 border-[#b87a29] pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-black mb-1 text-[#301809]">كشف وتقرير حضور الفعالية</h1>
            <p className="text-[#b87a29] font-bold text-base tracking-wide">منصة تواصل صحراء • وارجلان (ورقلة)</p>
          </div>
          <div className="text-left font-bold text-[#723c11] text-sm space-y-1">
            <p>تاريخ التقرير: {new Date().toLocaleDateString('ar-DZ')}</p>
            <p>الجهة المنظمة: {assocName}</p>
          </div>
        </div>

        {/* Event Summary Card */}
        <div className="bg-[#fdfbf7] rounded-3xl p-6 mb-8 border-2 border-[#dbc397]">
          <h2 className="text-xl font-black mb-4 text-[#301809] border-b border-[#dbc397] pb-2">تفاصيل الفعالية</h2>
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="text-[#b87a29] h-4 w-4" />
                <span className="font-bold">العنوان:</span> {event.title}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="text-[#b87a29] h-4 w-4" />
                <span className="font-bold">التاريخ:</span> {event.date} ({event.start_time?.substring(0, 5)})
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="text-[#b87a29] h-4 w-4" />
                <span className="font-bold">الموقع:</span> {event.location}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="text-[#b87a29] h-4 w-4" />
                <span className="font-bold">إجمالي المسجلين:</span> {rsvps.length} مشارك
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-[#b87a29] h-4 w-4" />
                <span className="font-bold">الحالة:</span> {event.status === 'archived' ? 'مؤرشفة' : 'نشطة'}
              </div>
            </div>
          </div>
        </div>

        {/* Attendee Table */}
        <div className="mb-10">
          <h2 className="text-xl font-black mb-4 text-[#301809] flex items-center gap-2">
             <Users className="text-[#b87a29]" /> قائمة المشاركين المسجلين
          </h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#301809] text-[#fae1b7]">
                <th className="p-3 text-right rounded-tr-xl">#</th>
                <th className="p-3 text-right">الاسم الكامل</th>
                <th className="p-3 text-right">رقم الهاتف</th>
                <th className="p-3 text-right">البريد الإلكتروني</th>
                <th className="p-3 text-right">تاريخ التسجيل</th>
                <th className="p-3 text-right rounded-tl-xl">التوقيع / الحضور</th>
              </tr>
            </thead>
            <tbody>
              {rsvps.map((rsvp, index) => {
                const contact = parseUserContact(rsvp.users?.full_name, rsvp.users?.email);
                return (
                  <tr key={rsvp.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-[#fdfbf7]'}>
                    <td className="p-3 border-b border-[#dbc397]/50 font-bold">{index + 1}</td>
                    <td className="p-3 border-b border-[#dbc397]/50 font-bold text-[#301809]">{contact.name}</td>
                    <td className="p-3 border-b border-[#dbc397]/50 font-mono font-bold text-[#723c11]" dir="ltr">{contact.phone || '—'}</td>
                    <td className="p-3 border-b border-[#dbc397]/50 font-medium font-sans text-xs" dir="ltr">{rsvp.users?.email || '—'}</td>
                    <td className="p-3 border-b border-[#dbc397]/50 text-xs">{rsvp.created_at ? new Date(rsvp.created_at).toLocaleDateString('ar-DZ') : '—'}</td>
                    <td className="p-3 border-b border-[#dbc397]/50">
                      <span className="bg-[#fae1b7]/70 text-[#723c11] border border-[#dbc397] px-2.5 py-0.5 rounded-full text-xs font-bold">
                        مؤكد ✓
                      </span>
                    </td>
                  </tr>
                );
              })}
              {rsvps.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-bold">
                    لا يوجد حضور مسجل لهذه الفعالية بعد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Signature */}
        <div className="mt-16 pt-8 border-t-2 border-[#dbc397] flex justify-between items-center text-[#723c11] text-xs font-bold">
          <div>تم التوليد رسمياً عبر منصة تواصل صحراء - وارجلان وحوض سدراتة</div>
          <div className="text-left">ختم وتوقيع رئيس الجمعية</div>
        </div>
      </div>
    );
  }
);

PrintableEventReport.displayName = 'PrintableEventReport';
