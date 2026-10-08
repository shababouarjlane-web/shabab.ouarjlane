import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

import { ChevronRight, ChevronLeft, ExternalLink, Megaphone } from 'lucide-react';


export default function PartnerAdsBanner() {
  const [ads, setAds] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAds();
  }, []);

  useEffect(() => {
    if (ads.length > 1) {
      const timer = setInterval(() => {
        nextSlide();
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [ads.length, currentIndex]);

  const fetchAds = async () => {
    try {
      const { data, error } = await supabase
        .from('partner_ads')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAds(data || []);
    } catch (error) {
      console.error('Error fetching ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    if (ads.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % ads.length);
  };

  const prevSlide = () => {
    if (ads.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
  };

  if (loading || ads.length === 0) return null;

  return (
    <div className="relative group w-full mb-10" dir="rtl">
      <div className="overflow-hidden rounded-3xl shadow-xl bg-white border-2 border-[#dbc397]/60 h-[190px] md:h-[240px]">
        {ads.map((ad, index) => {
          let adPhoto = ad.image_url || '';
          let adLogo = '';
          if (ad.image_url && ad.image_url.includes('||')) {
            const parts = ad.image_url.split('||');
            adPhoto = parts[0] || parts[1] || '';
            adLogo = parts[1] || '';
          }

          return (
            <div
              key={ad.id}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${
                index === currentIndex ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
              }`}
            >
              <div className="flex h-full flex-col md:flex-row">
                {/* Image Side - Activity / Product Photo */}
                <div className="w-full md:w-1/2 h-1/2 md:h-full relative overflow-hidden bg-slate-100 flex items-center justify-center">
                  {adPhoto ? (
                    <img
                      src={adPhoto}
                      alt={ad.partner_name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.parentElement?.querySelector('.ad-image-fallback');
                        if (fallback) fallback.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`ad-image-fallback ${adPhoto ? 'hidden' : ''} absolute inset-0 bg-gradient-to-br from-[#301809] via-[#723c11] to-[#b87a29] flex items-center justify-center`}>
                    <Megaphone className="w-14 h-14 text-[#efa83f]/60 animate-pulse" />
                  </div>
                </div>
                
                {/* Content Side */}
                <div className="w-full md:w-1/2 h-1/2 md:h-full p-6 md:p-8 flex flex-col justify-center bg-gradient-to-br from-[#fdfbf7] via-white to-[#fae1b7]/20 text-right relative border-t md:border-t-0 md:border-r border-[#dbc397]/50">
                  <div className="absolute top-4 left-4 bg-[#fae1b7]/70 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black text-[#723c11] border border-[#dbc397] uppercase tracking-wider">
                    شريك معتمد • رعاية
                  </div>
                  
                  <div className="flex items-center gap-3 mb-2">
                    {adLogo && (
                      <div className="h-9 px-2 bg-white rounded-xl border border-[#dbc397]/60 shadow-xs flex items-center justify-center shrink-0">
                        <img src={adLogo} alt={ad.partner_name} className="max-h-7 max-w-[80px] object-contain" />
                      </div>
                    )}
                    <h3 className="text-xl md:text-3xl font-thmanyah font-bold text-[#301809] truncate">
                      {ad.partner_name}
                    </h3>
                  </div>

                  <p className="text-xs md:text-sm text-[#723c11]/80 mb-3 md:mb-5 line-clamp-2 font-medium">
                  اكتشف العروض والخدمات المتميزة من شركاء ورعاة فعاليات وارجلان وحوض سدراتة.
                </p>
                {ad.link && (
                  <a
                    href={ad.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs md:text-sm font-black text-[#b87a29] hover:text-[#723c11] transition-colors group/link gap-1.5"
                  >
                    <span>زيارة الشريك والاطلاع على التفاصيل</span>
                    <ExternalLink className="h-3.5 w-3.5 group-hover/link:-translate-x-1 transition-transform" />
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })}
      </div>

      {/* Navigation Buttons */}
      {ads.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border border-[#dbc397] p-2 md:p-2.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 text-[#723c11] cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Next Slide"
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border border-[#dbc397] p-2 md:p-2.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 text-[#723c11] cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Indicators */}
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5">
            {ads.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  i === currentIndex ? 'bg-[#b87a29] w-6' : 'bg-[#dbc397] w-1.5'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
