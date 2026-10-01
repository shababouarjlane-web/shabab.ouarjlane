import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { 
  ArrowRight, 
  MapPin, 
  BookOpen, 
  ZoomIn, 
  History, 
  Star, 
  Sliders, 
  RotateCcw, 
  Copy, 
  Check, 
  X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// ─── بيانات المعالم التاريخية ──────────────────────────────────────────
interface Landmark {
  id: string;
  nameAr: string;
  nameTifinagh: string;
  nameTranslit: string;
  badge?: string;
  badgeColor?: string;
  lat: number;
  lng: number;
  period: string;
  image: string;
  description: string;
  category: 'mosque' | 'urban' | 'ruins';
  /** إحداثيات مضلع لتمثيل المنطقة الكاملة (اختياري) */
  polygon?: [number, number][];
}

// مركز القصر العتيق الافتراضي
const KSAR_CENTER = [31.9655, 5.3284] as const;

// الإحداثيات الأساسية لمحيط القصر العتيق الكامل (الدائرة الحمراء)
const DEFAULT_KSAR_POLYGON: [number, number][] = [
  [31.9712, 5.3280], // شمال القصر
  [31.9708, 5.3300],
  [31.9700, 5.3318],
  [31.9688, 5.3333],
  [31.9670, 5.3340], // شرق القصر
  [31.9650, 5.3340],
  [31.9632, 5.3332],
  [31.9616, 5.3315],
  [31.9604, 5.3294], // جنوب-شرق
  [31.9596, 5.3270], // أقصى جنوب القصر
  [31.9602, 5.3248],
  [31.9616, 5.3234], // جنوب-غرب
  [31.9636, 5.3226],
  [31.9658, 5.3225], // غرب القصر
  [31.9680, 5.3232],
  [31.9698, 5.3248], // شمال-غرب
  [31.9708, 5.3265],
];

// دالة حساب الإحداثيات المعدلة حسب التحريك والتكبير والدوران
function computeTransformedPolygon(
  base: [number, number][],
  center: readonly [number, number],
  offsetLat: number,
  offsetLng: number,
  scaleLat: number,
  scaleLng: number,
  rotationDeg: number
): [number, number][] {
  const rad = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return base.map(([lat, lng]) => {
    // القياس انطلاقاً من المركز
    const dLat = (lat - center[0]) * scaleLat;
    const dLng = (lng - center[1]) * scaleLng;
    // الدوران
    const rotLat = dLat * cos - dLng * sin;
    const rotLng = dLat * sin + dLng * cos;
    // التحريك
    return [
      Number((center[0] + offsetLat + rotLat).toFixed(6)),
      Number((center[1] + offsetLng + rotLng).toFixed(6)),
    ];
  });
}

// المعالم التاريخية (الترتيب: 1. مسجد لالة عزة، 2. القصر العتيق، 3. مدينة سدراتة)
const LANDMARKS: Landmark[] = [
  {
    id: 'lalla-azza',
    nameAr: 'مسجد لالة عزة الإباضي',
    nameTifinagh: 'ⵜⴰⵎⵣⴳⵉⴷⴰ ⵏ ⵍⴰⵍⵍⴰ ⵄⵣⵣⴰ',
    nameTranslit: 'Tajmegida n Lalla Azza',
    badge: 'المسجد الإباضي الجامع',
    badgeColor: 'bg-[#b87a29] text-white',
    lat: 31.966643,
    lng: 5.326884,
    period: 'العهد الرستمي المتأخر — القصر العتيق',
    image: '/hero-bg.jpg',
    description:
      'المسجد التاريخي الجامع في قلب القصر العتيق بوارجلان، بُني كامتداد روحي وحضاري بعد سقوط العاصمة الأولى تيهرت وتأسيس سدراتة. يشتهر ببابه الخشبي العتيق المحفور بعبارة: "بادروا بالصلاة قبل الموت وبادروا بالتوبة قبل الفوت"، وأعمدته اللولبية الفريدة وزجاجه الملون الذي يعكس فن العمارة الإباضية الزناتية الأصيلة.',
    category: 'mosque',
  },
  {
    id: 'ksar-atiq',
    nameAr: 'القصر العتيق بوارجلان',
    nameTifinagh: 'ⴰⵖⵔⴰⵎ ⴰⵇⴱⵓⵔ',
    nameTranslit: 'Aghram Aqbur',
    badge: 'المحيط التاريخي للقصر',
    badgeColor: 'bg-red-600 text-white',
    lat: 31.9655,
    lng: 5.3284,
    period: 'ما قبل الإسلام — القرون الوسطى وما بعدها',
    image: '/hero-bg.jpg',
    description:
      'أقدم نسيج عمراني واحاتي متصل في الصحراء الجزائرية، بناه الوارجلانيون بطراز بيئي عبقري يحمي من قيظ الصحراء عبر أزقة مغطاة (السقائف) ونظام دفاعي محكم ببواباته التاريخية. يعكس عبقرية العمارة الزناتية في التكيف مع المناخ الصحراوي القاسي.',
    category: 'urban',
    polygon: DEFAULT_KSAR_POLYGON,
  },
  {
    id: 'sedrata',
    nameAr: 'مدينة سدراتة الأثرية',
    nameTifinagh: 'ⵉⵙⴷⵔⴰⵜⵏ',
    nameTranslit: 'Isedraten',
    badge: 'العاصمة الرستمية الثانية',
    badgeColor: 'bg-[#efa83f] text-[#301809]',
    lat: 31.8720,
    lng: 5.2850,
    period: 'القرن 10 — 13م (العهد الرستمي الإباضي)',
    image: '/hero-bg.jpg',
    description:
      'العاصمة الثانية للدولة الرستمية الإباضية بعد سقوط تيهرت سنة 909م. كانت قطباً حضارياً واقتصادياً عالمياً ومفترق طرق تجارة الذهب والقوافل عبر الصحراء الإفريقية. تميزت بنسيجها العمراني الفريد وقصورها المزينة بأعظم الزخارف الجصية المنحوتة في شمال إفريقيا، والتي دفنتها الرمال بعد خرابها في القرن 11/13م لتظل شاهدة على عصر ذهبي وارجلاني أصيل.',
    category: 'ruins',
  },
];

// ألوان الفئات
const CATEGORY_COLORS: Record<Landmark['category'], string> = {
  mosque: '#b87a29',
  urban: '#ef4444',
  ruins: '#efa83f',
};

const CATEGORY_LABELS: Record<Landmark['category'], string> = {
  mosque: 'مسجد تاريخي',
  urban: 'نسيج عمراني',
  ruins: 'موقع أثري',
};

// ─── إنشاء أيقونة SVG مخصصة ─────────────────────────────────────────
function createCustomIcon(color: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="38" height="46" viewBox="0 0 38 46">
      <filter id="glow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <ellipse cx="19" cy="43" rx="7" ry="3" fill="rgba(0,0,0,0.18)"/>
      <path d="M19 2 C10.163 2 3 9.163 3 18 C3 29 19 44 19 44 C19 44 35 29 35 18 C35 9.163 27.837 2 19 2Z"
        fill="${color}" filter="url(#glow)" stroke="#fdfbf7" stroke-width="2.5"/>
      <circle cx="19" cy="18" r="7" fill="#fdfbf7" opacity="0.92"/>
      <circle cx="19" cy="18" r="4" fill="${color}" opacity="0.7"/>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [38, 46],
    iconAnchor: [19, 46],
    popupAnchor: [0, -48],
  });
}

// ─── المكوّن الرئيسي ─────────────────────────────────────────────────
export default function HeritageMap() {
  const navigate = useNavigate();
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const ksarPolygonRef = useRef<L.Polygon | null>(null);
  const ksarGlowRef = useRef<L.Polygon | null>(null);

  const [selected, setSelected] = useState<Landmark>(LANDMARKS[0]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ─── حالات التحكم بمحيط القصر (تموضع + حجم + دوران) ───────────────────
  const [showControls, setShowControls] = useState(false);
  const [offsetLat, setOffsetLat] = useState<number>(() => {
    const v = localStorage.getItem('ksar_offsetLat');
    return v !== null ? parseFloat(v) : 0;
  });
  const [offsetLng, setOffsetLng] = useState<number>(() => {
    const v = localStorage.getItem('ksar_offsetLng');
    return v !== null ? parseFloat(v) : 0;
  });
  const [scaleLat, setScaleLat] = useState<number>(() => {
    const v = localStorage.getItem('ksar_scaleLat');
    return v !== null ? parseFloat(v) : 1;
  });
  const [scaleLng, setScaleLng] = useState<number>(() => {
    const v = localStorage.getItem('ksar_scaleLng');
    return v !== null ? parseFloat(v) : 1;
  });
  const [rotation, setRotation] = useState<number>(() => {
    const v = localStorage.getItem('ksar_rotation');
    return v !== null ? parseFloat(v) : 0;
  });
  const [copied, setCopied] = useState(false);

  // تحديث المحيط لحظياً عند تعديل أي قيمة من شرائط التحكم
  useEffect(() => {
    const newCoords = computeTransformedPolygon(
      DEFAULT_KSAR_POLYGON,
      KSAR_CENTER,
      offsetLat,
      offsetLng,
      scaleLat,
      scaleLng,
      rotation
    );

    if (ksarPolygonRef.current) {
      ksarPolygonRef.current.setLatLngs(newCoords);
    }
    if (ksarGlowRef.current) {
      ksarGlowRef.current.setLatLngs(newCoords);
    }

    // حفظ في localStorage للاحتفاظ بالإعدادات
    localStorage.setItem('ksar_offsetLat', String(offsetLat));
    localStorage.setItem('ksar_offsetLng', String(offsetLng));
    localStorage.setItem('ksar_scaleLat', String(scaleLat));
    localStorage.setItem('ksar_scaleLng', String(scaleLng));
    localStorage.setItem('ksar_rotation', String(rotation));
  }, [offsetLat, offsetLng, scaleLat, scaleLng, rotation]);

  // تهيئة الخريطة
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [31.95, 5.31],
      zoom: 13,
      zoomControl: false,
      attributionControl: true,
    });

    // طبقة أقمار صناعية — ESRI World Imagery (مجانية بدون مفتاح API)
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Esri, Maxar, Earthstar Geographics | تواصل صحراء — وارجلان',
        maxZoom: 18,
      }
    ).addTo(map);

    // التحكم في التكبير — جانب أيسر
    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    // إضافة الماركرات
    LANDMARKS.forEach((lm) => {
      const color = CATEGORY_COLORS[lm.category];
      const marker = L.marker([lm.lat, lm.lng], {
        icon: createCustomIcon(color),
        title: lm.nameAr,
      }).addTo(map);

      // Tooltip
      marker.bindTooltip(
        `<div style="font-family:'IBM Plex Sans Arabic',sans-serif;direction:rtl;font-weight:700;font-size:13px;color:#301809;padding:4px 8px;border-radius:8px">${lm.nameAr}</div>`,
        { direction: 'top', permanent: false, opacity: 0.97 }
      );

      marker.on('click', () => {
        setSelected(lm);
        setSidebarOpen(true);
      });

      markersRef.current[lm.id] = marker;
    });

    // ── رسم مضلع القصر العتيق المُضاء باللون الأحمر ───────────────────
    const initialCoords = computeTransformedPolygon(
      DEFAULT_KSAR_POLYGON,
      KSAR_CENTER,
      offsetLat,
      offsetLng,
      scaleLat,
      scaleLng,
      rotation
    );

    // المضلع الأساسي — الدائرة الحمراء
    const ksarPolygon = L.polygon(initialCoords, {
      color: '#ef4444',
      weight: 3.5,
      opacity: 0.95,
      fillColor: '#ef4444',
      fillOpacity: 0.16,
      lineJoin: 'round',
    }).addTo(map);

    // تأثير وهج خارجي (glow)
    const ksarGlow = L.polygon(initialCoords, {
      color: '#ef4444',
      weight: 12,
      opacity: 0.25,
      fillOpacity: 0,
      lineJoin: 'round',
      interactive: false,
    }).addTo(map);

    ksarPolygonRef.current = ksarPolygon;
    ksarGlowRef.current = ksarGlow;

    // Tooltip مميز عند الـ hover على المضلع
    ksarPolygon.bindTooltip(
      `<div style="font-family:'IBM Plex Sans Arabic',sans-serif;direction:rtl;font-weight:800;font-size:13px;color:#301809;padding:6px 12px;border-radius:10px;border:2px solid #ef4444">
        🏛️ محيط القصر العتيق بوارجلان
        <div style="font-size:10px;color:#723c11;font-weight:600;margin-top:2px">ⴰⵖⵔⴰⵎ ⴰⵇⴱⵓⵔ</div>
      </div>`,
      { direction: 'top', sticky: true, opacity: 0.97 }
    );

    const ksarLandmark = LANDMARKS.find((lm) => lm.id === 'ksar-atiq');
    ksarPolygon.on('click', () => {
      if (ksarLandmark) {
        setSelected(ksarLandmark);
        setSidebarOpen(true);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // التحليق إلى المعلم المحدد
  const flyTo = (lm: Landmark) => {
    setSelected(lm);
    setSidebarOpen(true);
    if (lm.id === 'ksar-atiq' && mapRef.current) {
      const currentCoords = computeTransformedPolygon(
        DEFAULT_KSAR_POLYGON,
        KSAR_CENTER,
        offsetLat,
        offsetLng,
        scaleLat,
        scaleLng,
        rotation
      );
      const bounds = L.latLngBounds(currentCoords.map(([lat, lng]) => L.latLng(lat, lng)));
      mapRef.current.fitBounds(bounds, { padding: [40, 40], animate: true, duration: 1.2 });
    } else {
      mapRef.current?.flyTo([lm.lat, lm.lng], 16, { duration: 1.4 });
    }
  };

  // نسخ الإحداثيات المعدلة
  const handleCopyCoords = () => {
    const currentCoords = computeTransformedPolygon(
      DEFAULT_KSAR_POLYGON,
      KSAR_CENTER,
      offsetLat,
      offsetLng,
      scaleLat,
      scaleLng,
      rotation
    );
    navigator.clipboard.writeText(JSON.stringify(currentCoords, null, 2));
    setCopied(true);
    toast.success('تم نسخ إحداثيات المحيط الجديدة بنجاح!');
    setTimeout(() => setCopied(false), 2000);
  };

  // إعادة ضبط المحيط
  const handleReset = () => {
    setOffsetLat(0);
    setOffsetLng(0);
    setScaleLat(1);
    setScaleLng(1);
    setRotation(0);
    localStorage.removeItem('ksar_offsetLat');
    localStorage.removeItem('ksar_offsetLng');
    localStorage.removeItem('ksar_scaleLat');
    localStorage.removeItem('ksar_scaleLng');
    localStorage.removeItem('ksar_rotation');
    toast.info('تمت إعادة ضبط المحيط إلى الإحداثيات الافتراضية');
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[#fdfbf7] overflow-hidden" dir="rtl">

      {/* ── شريط العنوان ─────────────────────────────────────── */}
      <header className="flex-shrink-0 h-14 bg-[#301809] flex items-center gap-3 px-4 shadow-lg z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="text-[#fae1b7] hover:bg-[#4a2510] rounded-xl h-9 w-9"
        >
          <ArrowRight className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#efa83f]/20 border border-[#efa83f]/40 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-[#efa83f]" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm leading-none">خريطة تراث وارجلان</h1>
            <p className="text-[#fae1b7]/60 text-[10px]">ⵜⴰⵡⵉⵍⴰ ⵏ ⵡⴰⵔⴵⵍⴰⵏ</p>
          </div>
        </div>

        <div className="mr-auto flex items-center gap-2">
          {/* زر فتح/إغلاق أداة ضبط المحيط */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const next = !showControls;
              setShowControls(next);
              if (next) {
                const ksar = LANDMARKS.find((l) => l.id === 'ksar-atiq');
                if (ksar) flyTo(ksar);
              }
            }}
            className={`rounded-xl text-xs h-8 px-3 flex items-center gap-1.5 transition-all ${
              showControls
                ? 'bg-red-600 text-white hover:bg-red-700 shadow-md'
                : 'text-[#fae1b7]/90 bg-[#4a2510]/80 hover:bg-[#4a2510] hover:text-white border border-[#efa83f]/30'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showControls ? 'إخفاء أداة المحيط' : 'ضبط محيط القصر'}</span>
          </Button>

          {/* زر عرض/إخفاء الشريط الجانبي */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-[#fae1b7]/80 hover:text-white hover:bg-[#4a2510] rounded-xl text-xs h-8 px-3"
          >
            {sidebarOpen ? 'إخفاء التفاصيل' : 'إظهار التفاصيل'}
          </Button>
        </div>
      </header>

      {/* ── جسم الصفحة ───────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* ── الخريطة ───────────────────────────── */}
        <div ref={mapContainerRef} className="flex-1 z-10" />

        {/* ── لوحة التحكم التفاعلية في المحيط والتموضع ─────────────────── */}
        {showControls && (
          <div className="absolute top-4 left-4 z-40 w-80 bg-[#301809]/95 backdrop-blur-xl border border-[#efa83f]/40 rounded-2xl shadow-2xl p-4 text-white animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#fae1b7]/15 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-red-600/30 flex items-center justify-center">
                  <Sliders className="w-3.5 h-3.5 text-red-400" />
                </div>
                <h3 className="font-bold text-xs text-[#fae1b7]">أداة ضبط محيط القصر</h3>
              </div>
              <button
                onClick={() => setShowControls(false)}
                className="text-[#fae1b7]/60 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-[#fae1b7]/70 leading-relaxed mb-3">
              عدّل الشرائط لمعاينة تحريك وتكبير الدائرة الحمراء فورياً فوق صور الأقمار الصناعية:
            </p>

            <div className="space-y-3 text-xs">
              {/* تحريك شمال / جنوب */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#fae1b7]/80">↕️ إزاحة شمال / جنوب:</span>
                  <span className="font-mono text-[#efa83f]" dir="ltr">
                    {(offsetLat * 111000).toFixed(0)} م ({offsetLat > 0 ? '+' : ''}{offsetLat.toFixed(4)}°)
                  </span>
                </div>
                <input
                  type="range"
                  min="-0.0030"
                  max="0.0030"
                  step="0.0001"
                  value={offsetLat}
                  onChange={(e) => setOffsetLat(parseFloat(e.target.value))}
                  className="w-full accent-red-500 cursor-pointer h-1.5 bg-[#4a2510] rounded-lg"
                />
              </div>

              {/* تحريك شرق / غرب */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#fae1b7]/80">↔️ إزاحة شرق / غرب:</span>
                  <span className="font-mono text-[#efa83f]" dir="ltr">
                    {(offsetLng * 94000).toFixed(0)} م ({offsetLng > 0 ? '+' : ''}{offsetLng.toFixed(4)}°)
                  </span>
                </div>
                <input
                  type="range"
                  min="-0.0030"
                  max="0.0030"
                  step="0.0001"
                  value={offsetLng}
                  onChange={(e) => setOffsetLng(parseFloat(e.target.value))}
                  className="w-full accent-red-500 cursor-pointer h-1.5 bg-[#4a2510] rounded-lg"
                />
              </div>

              {/* الامتداد الطولي */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#fae1b7]/80">📏 الحجم الطولي (ارتفاع):</span>
                  <span className="font-mono text-[#efa83f]">{(scaleLat * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.4"
                  step="0.02"
                  value={scaleLat}
                  onChange={(e) => setScaleLat(parseFloat(e.target.value))}
                  className="w-full accent-red-500 cursor-pointer h-1.5 bg-[#4a2510] rounded-lg"
                />
              </div>

              {/* الامتداد العرضي */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#fae1b7]/80">📐 الحجم العرضي (عرض):</span>
                  <span className="font-mono text-[#efa83f]">{(scaleLng * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.4"
                  step="0.02"
                  value={scaleLng}
                  onChange={(e) => setScaleLng(parseFloat(e.target.value))}
                  className="w-full accent-red-500 cursor-pointer h-1.5 bg-[#4a2510] rounded-lg"
                />
              </div>

              {/* زاوية الدوران */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#fae1b7]/80">🔄 زاوية الدوران:</span>
                  <span className="font-mono text-[#efa83f]" dir="ltr">{rotation}°</span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  step="1"
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value))}
                  className="w-full accent-red-500 cursor-pointer h-1.5 bg-[#4a2510] rounded-lg"
                />
              </div>
            </div>

            {/* أزرار الإجراءات */}
            <div className="flex items-center gap-2 pt-3 mt-3 border-t border-[#fae1b7]/15">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="flex-1 bg-[#4a2510] hover:bg-[#5e3116] text-[#fae1b7] text-[11px] h-8 rounded-xl flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                إعادة ضبط
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyCoords}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-[11px] h-8 rounded-xl flex items-center justify-center gap-1 font-bold"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'تم النسخ!' : 'نسخ الإحداثيات'}
              </Button>
            </div>
          </div>
        )}

        {/* ── قائمة المعالم (أيقونات دائرية سريعة على الخريطة) ── */}
        <div className="absolute bottom-6 right-4 z-20 flex flex-col gap-2">
          {LANDMARKS.map((lm) => (
            <button
              key={lm.id}
              onClick={() => flyTo(lm)}
              title={lm.nameAr}
              className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95 ${
                selected.id === lm.id
                  ? 'border-[#efa83f] bg-[#301809]'
                  : 'border-white/60 bg-[#301809]/80'
              }`}
              style={{ boxShadow: selected.id === lm.id ? '0 0 16px rgba(239,168,63,0.5)' : undefined }}
            >
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: CATEGORY_COLORS[lm.category] }}
              />
            </button>
          ))}
        </div>

        {/* ── الشريط الجانبي ───────────────────── */}
        <aside
          className={`
            absolute top-0 left-0 h-full z-30
            transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            w-full sm:w-[380px]
            bg-[#fdfbf7] shadow-2xl border-r border-[#dbc397]/50
            flex flex-col overflow-hidden
          `}
        >
          {/* رأس الشريط */}
          <div className="flex-shrink-0 bg-gradient-to-b from-[#301809] to-[#4a2510] px-5 pt-5 pb-6">
            {/* بادج الفئة */}
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${selected.badgeColor ?? 'bg-[#efa83f] text-[#301809]'}`}>
                {selected.badge ?? CATEGORY_LABELS[selected.category]}
              </span>
              <span className="text-[10px] text-[#fae1b7]/60 font-medium">
                {CATEGORY_LABELS[selected.category]}
              </span>
            </div>

            {/* الاسم العربي */}
            <h2 className="text-xl font-bold text-white leading-snug mb-1" style={{ fontFamily: '"Thmanyah Serif Display", serif' }}>
              {selected.nameAr}
            </h2>

            {/* الاسم الأمازيغي بالتيفيناغ */}
            <p className="text-[#efa83f] text-sm font-semibold tracking-wider mb-0.5" dir="ltr">
              {selected.nameTifinagh}
            </p>
            <p className="text-[#fae1b7]/60 text-xs italic" dir="ltr">
              {selected.nameTranslit}
            </p>
          </div>

          {/* صورة المعلم */}
          <div className="flex-shrink-0 relative h-44 overflow-hidden">
            <img
              src={selected.image}
              alt={selected.nameAr}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#fdfbf7]" />
            {/* زر التحليق */}
            <button
              onClick={() => flyTo(selected)}
              className="absolute bottom-3 left-3 bg-[#efa83f] text-[#301809] font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg hover:bg-[#d4a035] transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
              تحليق للموقع
            </button>
          </div>

          {/* محتوى التفاصيل */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

            {/* الفترة الزمنية */}
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#fae1b7] flex items-center justify-center flex-shrink-0 mt-0.5">
                <History className="w-4 h-4 text-[#b87a29]" />
              </div>
              <div>
                <p className="text-[10px] text-[#723c11]/70 font-semibold uppercase tracking-wider mb-0.5">الحقبة التاريخية</p>
                <p className="text-sm font-bold text-[#301809]">{selected.period}</p>
              </div>
            </div>

            {/* الإحداثيات */}
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#fae1b7] flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-[#b87a29]" />
              </div>
              <div>
                <p className="text-[10px] text-[#723c11]/70 font-semibold uppercase tracking-wider mb-0.5">الإحداثيات</p>
                <p className="text-xs font-mono text-[#301809]/70" dir="ltr">
                  {selected.lat.toFixed(4)}° N, {selected.lng.toFixed(4)}° E
                </p>
              </div>
            </div>

            {/* الوصف التاريخي */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <BookOpen className="w-3.5 h-3.5 text-[#b87a29]" />
                <p className="text-[10px] text-[#723c11]/70 font-semibold uppercase tracking-wider">السياق التاريخي</p>
              </div>
              <p className="text-sm text-[#301809]/80 leading-relaxed">
                {selected.description}
              </p>
            </div>

            {/* ─ قائمة المعالم مرتبة بدقة ─ */}
            <div className="border-t border-[#dbc397]/50 pt-4">
              <p className="text-[10px] text-[#723c11]/70 font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Star className="w-3 h-3 text-[#efa83f]" />
                جميع المعالم ({LANDMARKS.length})
              </p>
              <div className="space-y-2">
                {LANDMARKS.map((lm, idx) => (
                  <button
                    key={lm.id}
                    onClick={() => flyTo(lm)}
                    className={`w-full text-right flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                      selected.id === lm.id
                        ? 'bg-[#301809] text-white shadow-md'
                        : 'bg-white border border-[#dbc397]/50 text-[#301809] hover:border-[#efa83f]/60 hover:bg-[#fae1b7]/30'
                    }`}
                  >
                    <div className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold bg-[#fae1b7]/40 text-[#723c11]">
                      {idx + 1}
                    </div>
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[lm.category] }}
                    />
                    <span className="font-semibold flex-1 text-right truncate">{lm.nameAr}</span>
                    {lm.badge && (
                      <span
                        className="text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                        style={{
                          backgroundColor:
                            selected.id === lm.id ? 'rgba(255,255,255,0.15)' : CATEGORY_COLORS[lm.category] + '22',
                          color: selected.id === lm.id ? '#fae1b7' : CATEGORY_COLORS[lm.category],
                        }}
                      >
                        {CATEGORY_LABELS[lm.category]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* ذيل الشريط */}
          <div className="flex-shrink-0 px-5 py-3 border-t border-[#dbc397]/40 bg-[#fdfbf7] flex items-center justify-between">
            <span className="text-[10px] text-[#723c11]/50 font-medium">وارجلان — ⵡⴰⵔⴵⵍⴰⵏ</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-[10px] text-[#723c11]/60 hover:text-[#b87a29] transition-colors font-semibold"
            >
              طيّ القائمة ←
            </button>
          </div>
        </aside>

      </div>
    </div>
  );
}
