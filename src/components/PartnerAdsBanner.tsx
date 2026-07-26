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
      <div className="overflow-hidden rounded-[2rem] shadow-2xl bg-white border border-amber-50 h-[180px] md:h-[240px]">
        {ads.map((ad, index) => (
          <div
            key={ad.id}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${
              index === currentIndex ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
            }`}
          >
            <div className="flex h-full flex-col md:flex-row">
              {/* Image Side */}
              <div className="w-full md:w-1/2 h-1/2 md:h-full relative overflow-hidden bg-slate-100 flex items-center justify-center">
                <img
                  src={ad.image_url}
                  alt={ad.partner_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.parentElement?.querySelector('.ad-image-fallback');
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
                <div className="ad-image-fallback hidden absolute inset-0 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center">
                  <Megaphone className="w-16 h-16 text-white/40 animate-pulse" />
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/sandpaper.png')] opacity-20" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-l from-black/20 to-transparent" />
              </div>
              
              {/* Content Side */}
              <div className="w-full md:w-1/2 h-1/2 md:h-full p-6 md:p-10 flex flex-col justify-center bg-gradient-to-br from-amber-50 to-white text-right relative">
                <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold text-amber-800 border border-amber-100 uppercase tracking-widest">
                  إعلان ممول
                </div>
                <h3 className="text-xl md:text-3xl font-black text-slate-800 mb-2 truncate">
                  {ad.partner_name}
                </h3>
                <p className="text-sm md:text-lg text-slate-500 mb-4 md:mb-6 line-clamp-2">
                  اكتشف فرصة مميزة مقدمة من شركاء مجتمع "تواصل صحراء".
                </p>
                {ad.link && (
                  <a
                    href={ad.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-amber-600 font-black hover:text-amber-700 transition-colors group/link"
                  >
                    عرض التفاصيل <ExternalLink className="mr-2 h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      {ads.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 md:p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 z-30"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-slate-700" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 md:p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 z-30"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-slate-700" />
          </button>

          {/* Indicators */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {ads.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === currentIndex ? 'bg-amber-500 w-8' : 'bg-slate-300'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
