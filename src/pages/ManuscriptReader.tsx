import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UnifiedHeader from '@/components/UnifiedHeader';
import { ManuscriptReaderModal } from '@/components/heritage/ManuscriptReaderModal';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  BookOpen,
  ArrowRight,
  FileText
} from 'lucide-react';
import { SAMPLE_MANUSCRIPTS } from '@/data/sampleManuscriptsData';

export default function ManuscriptReaderPage() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(true);

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfbf7]" dir="rtl">
      <UnifiedHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* شريط العنوان التراثي */}
        <div className="rounded-3xl bg-gradient-to-r from-[#1b0d05] via-[#3d1e0a] to-[#1b0d05] p-6 sm:p-10 border border-[#b87a29]/40 shadow-xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#efa83f]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#efa83f]/20 border border-[#efa83f]/40 text-[#efa83f] text-xs font-thmanyah font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>محلل الذكاء الاصطناعي للمخطوطات • ⵜⵉⵔⵔⴰ ⵏ ⵡⴰⵔⴵⵍⴰⵏ</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-thmanyah font-bold leading-tight">
              فك رقوق ووثائق واحة وارجلان وسدراتة التاريخية
            </h1>

            <p className="text-xs sm:text-sm text-[#fae1b7]/80 font-thmanyah leading-relaxed">
              محرك رؤية حاسوبية ذكي مخصص للخط المغربي الصحراوي وفك الاختصارات الفقهية
              وعقود قسمة مياه العيون والفقارات، مع المطابقة الفورية مع أمهات المراجع الـ 22.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-[#efa83f] to-[#b87a29] hover:from-[#f0b24d] hover:to-[#854515] text-[#301809] font-thmanyah font-bold px-7 py-5 rounded-2xl text-xs sm:text-sm shadow-md transition-all cursor-pointer gap-2"
              >
                <Sparkles className="w-4 h-4 text-[#301809]" />
                <span>فتح منصة التحقيق والفحص</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate('/heritage')}
                className="border-[#efa83f]/40 text-[#fae1b7] hover:bg-[#efa83f]/15 font-thmanyah font-bold px-6 py-5 rounded-2xl text-xs sm:text-sm cursor-pointer gap-2"
              >
                <BookOpen className="w-4 h-4 text-[#efa83f]" />
                <span>الباحث التاريخي</span>
              </Button>
            </div>
          </div>
        </div>

        {/* شبكة النماذج المتاحة */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-thmanyah font-bold text-[#301809]">
              خزانة المخطوطات والوثائق المتاحة للتحقيق
            </h2>
            <span className="text-xs font-thmanyah text-[#723c11]">
              {SAMPLE_MANUSCRIPTS.length} وثائق نموذجية نادرة
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SAMPLE_MANUSCRIPTS.map((ms) => (
              <div
                key={ms.id}
                onClick={() => setIsModalOpen(true)}
                className="p-5 rounded-2xl bg-white border border-[#e7dfd1] hover:border-[#b87a29] hover:shadow-lg transition-all cursor-pointer space-y-3 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] font-thmanyah font-bold text-[#b87a29] bg-[#fae1b7]/40 px-2.5 py-0.5 rounded-full inline-block">
                      {ms.categoryLabel} • {ms.centuryHegira}
                    </span>
                    <h3 className="text-base font-thmanyah font-bold text-[#301809] group-hover:text-[#b87a29] transition-colors">
                      {ms.titleAr}
                    </h3>
                  </div>
                  <FileText className="w-5 h-5 text-[#b87a29] shrink-0" />
                </div>

                <p className="text-xs font-thmanyah text-[#723c11] line-clamp-2 leading-relaxed">
                  {ms.transcriptionNormalized}
                </p>

                <div className="pt-2 border-t border-[#e7dfd1] flex items-center justify-between text-xs font-thmanyah text-[#b87a29] font-bold">
                  <span>المصدر: {ms.originLocation}</span>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>فحص الوثيقة</span>
                    <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* النافذة التفاعلية للتحقيق */}
      <ManuscriptReaderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSearchInHeritageAssistant={(q) => {
          setIsModalOpen(false);
          navigate(`/heritage?q=${encodeURIComponent(q)}`);
        }}
      />
    </div>
  );
}
