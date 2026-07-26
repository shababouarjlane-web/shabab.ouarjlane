import React from 'react';
import { Calendar, MapPin, Users, CheckCircle2 } from 'lucide-react';

interface PrintableEventReportProps {
  event: any;
  rsvps: any[];
  assocName: string;
}

export const PrintableEventReport = React.forwardRef<HTMLDivElement, PrintableEventReportProps>(
  ({ event, rsvps, assocName }, ref) => {
    return (
      <div ref={ref} className="p-12 bg-white text-slate-900 font-sans" dir="rtl">
        {/* Header */}
        <div className="flex justify-between items-start border-b-4 border-emerald-600 pb-8 mb-10">
          <div>
            <h1 className="text-4xl font-black mb-2 text-emerald-800">تقرير حضور الفعالية</h1>
            <p className="text-emerald-600 font-bold text-xl uppercase tracking-widest">Sahara Gather Connect</p>
          </div>
          <div className="text-left font-bold text-slate-500">
            <p>تاريخ التقرير: {new Date().toLocaleDateString('ar-DZ')}</p>
            <p>الجهة المنظمة: {assocName}</p>
          </div>
        </div>

        {/* Event Summary Card */}
        <div className="bg-emerald-50 rounded-3xl p-8 mb-10 border border-emerald-100">
          <h2 className="text-2xl font-black mb-6 text-emerald-900 border-b border-emerald-200 pb-2">تفاصيل الفعالية</h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="text-emerald-600 h-5 w-5" />
                <span className="font-bold">العنوان:</span> {event.title}
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="text-emerald-600 h-5 w-5" />
                <span className="font-bold">التاريخ:</span> {event.date}
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="text-emerald-600 h-5 w-5" />
                <span className="font-bold">الموقع:</span> {event.location}
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Users className="text-emerald-600 h-5 w-5" />
                <span className="font-bold">إجمالي الحجز:</span> {rsvps.length} شخص
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-emerald-600 h-5 w-5" />
                <span className="font-bold">الحالة:</span> {event.status === 'archived' ? 'مؤرشفة' : 'فعلية'}
              </div>
            </div>
          </div>
        </div>

        {/* Attendee Table */}
        <div className="mb-10">
          <h2 className="text-2xl font-black mb-6 text-slate-800 flex items-center gap-3">
             <Users className="text-emerald-600" /> قائمة الحضور المؤكدة
          </h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-emerald-600 text-white">
                <th className="p-4 text-right rounded-tr-xl">#</th>
                <th className="p-4 text-right">البريد الإلكتروني</th>
                <th className="p-4 text-right">تاريخ التأكيد</th>
                <th className="p-4 text-right rounded-tl-xl">حالة الحضور</th>
              </tr>
            </thead>
            <tbody>
              {rsvps.map((rsvp, index) => (
                <tr key={rsvp.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="p-4 border-b border-slate-100 font-bold">{index + 1}</td>
                  <td className="p-4 border-b border-slate-100 font-medium font-sans" dir="ltr">{rsvp.users?.email}</td>
                  <td className="p-4 border-b border-slate-100">{new Date(rsvp.created_at).toLocaleDateString('ar-DZ')}</td>
                  <td className="p-4 border-b border-slate-100">
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                      مؤكد
                    </span>
                  </td>
                </tr>
              ))}
              {rsvps.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-slate-400 font-bold italic">
                    لا يوجد حضور مسجل لهذه الفعالية بعد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Signature */}
        <div className="mt-20 pt-10 border-t border-slate-200 flex justify-between items-center text-slate-400 text-sm font-bold">
          <div>تم التوليد تلقائياً عبر منصة تواصل صحراء - حوض سدراتة</div>
          <div className="text-left">ختم وتوقيع الجمعية</div>
        </div>
      </div>
    );
  }
);

PrintableEventReport.displayName = 'PrintableEventReport';
