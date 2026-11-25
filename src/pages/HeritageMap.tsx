import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { supabase } from '@/lib/supabase';
import {
  resolveOuarglaLocationCoords,
  buildGoogleMapsDirectionsUrl,
  HERITAGE_CATEGORIES,
  packHeritageMeta,
  parseHeritageMeta,
} from '@/lib/helpers';
import { createMapLibre3DModelLayer } from '@/lib/maplibre3dLayer';
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
  X,
  Calendar,
  Compass,
  Ticket,
  Sparkles,
  PlusCircle,
  Send,
  Headphones,
  Box,
  RotateCw,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
} from '@/components/ui/dialog';
import UnifiedHeader from '@/components/UnifiedHeader';
import {
  FloatingAudioBar,
  resolveAudioStopForLandmark,
} from '@/components/heritage/FloatingAudioBar';
import { type AudioTourStop } from '@/data/heritageAudioTourData';
import { spatialAudio } from '@/lib/spatialAudioEngine';
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
  plusCode?: string;
  period: string;
  image: string;
  description: string;
  category: 'mosque' | 'urban' | 'ruins';
  has3dModel?: boolean;
  /** إحداثيات مضلع لتمثيل المنطقة الكاملة (اختياري) */
  polygon?: [number, number][];
}

// مركز القصر العتيق المعتمد
const KSAR_CENTER = [31.9661, 5.3270] as const;

// الإحداثيات المعتمدة لمحيط القصر العتيق الكامل
const DEFAULT_KSAR_POLYGON: [number, number][] = [
  [31.970313, 5.328037],
  [31.969671, 5.329096],
  [31.968774, 5.329951],
  [31.967639, 5.330545],
  [31.966208, 5.330546],
  [31.964754, 5.330102],
  [31.963586, 5.329243],
  [31.962722, 5.327912],
  [31.962218, 5.326441],
  [31.962058, 5.324886],
  [31.962880, 5.323757],
  [31.964143, 5.323264],
  [31.965737, 5.323250],
  [31.967353, 5.323681],
  [31.968829, 5.324572],
  [31.969857, 5.325890],
  [31.970285, 5.327087],
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
    const dLat = (lat - center[0]) * scaleLat;
    const dLng = (lng - center[1]) * scaleLng;
    const rotLat = dLat * cos - dLng * sin;
    const rotLng = dLat * sin + dLng * cos;
    return [
      Number((center[0] + offsetLat + rotLat).toFixed(6)),
      Number((center[1] + offsetLng + rotLng).toFixed(6)),
    ];
  });
}

// تحويل مصفوفة [lat, lng] إلى GeoJSON Polygon مغلق بترتيب [lng, lat]
function toGeoJsonPolygon(coords: [number, number][]) {
  const ring = coords.map(([lat, lng]) => [lng, lat]);
  if (ring.length > 0) {
    ring.push(ring[0]);
  }
  return {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'Polygon' as const,
      coordinates: [ring],
    },
  };
}

// الإحداثيات الدقيقة لمحيط مسجد لالة عزة الإباضي
const LALLA_AZZA_POLYGON: [number, number][] = [
  [31.966461, 5.327037],
  [31.966318, 5.326621],
  [31.966580, 5.326393],
  [31.966751, 5.326867],
];

// المعالم التاريخية
const LANDMARKS: Landmark[] = [
  {
    id: 'lalla-azza',
    nameAr: 'مسجد لالة عزة الإباضي',
    nameTifinagh: 'ⵜⴰⵎⵣⴳⵉⴷⴰ ⵏ ⵍⴰⵍⵍⴰ ⵄⵣⵣⴰ',
    nameTranslit: 'Tajmegida n Lalla Azza',
    badge: 'المسجد الإباضي الجامع',
    badgeColor: 'bg-[#b87a29] text-white',
    lat: 31.966528,
    lng: 5.326730,
    period: 'العهد الرستمي المتأخر — القصر العتيق',
    image: '/hero-bg.jpg',
    description:
      'المسجد التاريخي الجامع في قلب القصر العتيق بوارجلان، بُني كامتداد روحي وحضاري بعد سقوط العاصمة الأولى تيهرت وتأسيس سدراتة. يشتهر ببابه الخشبي العتيق المحفور بعبارة: "بادروا بالصلاة قبل الموت وبادروا بالتوبة قبل الفوت"، وأعمدته اللولبية الفريدة وزجاجه الملون الذي يعكس فن العمارة الإباضية الزناتية الأصيلة.',
    category: 'mosque',
    polygon: LALLA_AZZA_POLYGON,
  },
  {
    id: 'ksar-atiq',
    nameAr: 'القصر العتيق بوارجلان',
    nameTifinagh: 'ⴰⵖⵔⴰⵎ ⴰⵇⴱⵓⵔ',
    nameTranslit: 'Aghram Aqbur',
    badge: 'المحيط التاريخي للقصر',
    badgeColor: 'bg-red-600 text-white',
    lat: 31.966825,
    lng: 5.327198,
    period: 'ما قبل الإسلام — القرون الوسطى وما بعدها',
    image: '/hero-bg.jpg',
    description:
      'أقدم نسيج عمراني واحاتي متصل في الصحراء الجزائرية، بناه الوارجلانيون بطراز بيئي عبقري يحمي من قيظ الصحراء عبر أزقة مغطاة (السقائف) ونظام دفاعي محكم ببواباته التاريخية. يعكس عبقرية العمارة الزناتية في التكيف مع المناخ الصحراوي القاسي.',
    category: 'urban',
    polygon: DEFAULT_KSAR_POLYGON,
  },
  {
    id: 'sedrata',
    nameAr: 'المدينة الأثرية سدراتة',
    nameTifinagh: 'ⵉⵙⴷⵔⴰⵜⵏ',
    nameTranslit: 'Isedraten',
    badge: 'العاصمة الرستمية الثانية',
    badgeColor: 'bg-[#efa83f] text-[#301809]',
    lat: 31.894988,
    lng: 5.310891,
    plusCode: 'V8V6+X9R، ورقلة',
    period: 'القرن 10 — 13م (العهد الرستمي الإباضي)',
    image: '/sedrata-cinematic.jpg',
    description:
      'العاصمة الثانية للدولة الرستمية الإباضية بعد سقوط تيهرت سنة 909م. كانت قطباً حضارياً واقتصادياً عالمياً ومفترق طرق تجارة الذهب والقوافل عبر الصحراء الإفريقية. تميزت بنسيجها العمراني الفريد وقصورها المزينة بأعظم الزخارف الجصية المنحوتة في شمال إفريقيا، والتي دفنتها الرمال بعد خرابها في القرن 11/13م لتظل شاهدة على عصر ذهبي وارجلاني أصيل.',
    category: 'ruins',
    has3dModel: true,
  },
];

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

// إنشاء عنصر ماركر مخصص لـ MapLibre GL
// يدعم وضع "نقطة ذهبية تومض" للمعالم غير المختارة عند التركيز على معلم آخر
function createMarkerElement(
  color: string,
  label: string,
  options?: { is3d?: boolean; isEvent?: boolean; isPulsingDot?: boolean }
): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'group relative flex flex-col items-center cursor-pointer select-none';

  // وضع النقطة الذهبية الوامضة للمعالم الأخرى عند التركيز على معلم
  if (options?.isPulsingDot) {
    wrapper.title = label;
    wrapper.innerHTML = `
      <div class="relative flex items-center justify-center w-8 h-8">
        <span class="absolute inline-flex h-7 w-7 rounded-full bg-amber-400/55 animate-ping"></span>
        <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-400 ring-2 ring-white shadow-[0_0_14px_rgba(251,191,36,0.95)] transition-transform duration-200 group-hover:scale-125"></span>
        <span dir="rtl" class="pointer-events-none absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity px-2.5 py-0.5 rounded-full bg-[#111318]/90 backdrop-blur-md text-amber-300 text-[10px] font-bold whitespace-nowrap border border-white/15 shadow-lg">${label}</span>
      </div>
    `;
    return wrapper;
  }

  // شارة الاسم العائمة فوق الماركر
  const badge = document.createElement('div');
  badge.dir = 'rtl';
  badge.className = options?.is3d
    ? 'mb-1.5 px-3 py-1 rounded-full bg-[#111318]/85 backdrop-blur-xl text-amber-300 text-[11px] font-bold shadow-xl border border-amber-400/40 whitespace-nowrap flex items-center gap-1.5 transition-transform group-hover:scale-105'
    : 'mb-1 px-2.5 py-0.5 rounded-full bg-[#111318]/80 backdrop-blur-xl text-stone-100 text-[11px] font-bold shadow-lg border border-white/15 whitespace-nowrap opacity-95 group-hover:opacity-100 group-hover:scale-105 transition-all';

  badge.innerHTML = options?.is3d
    ? `<span style="display:inline-block;width:7px;height:7px;border-radius:9999px;background:#fbbf24;box-shadow:0 0 8px #fbbf24"></span><span>${label}</span><span style="font-size:9px;background:#fbbf24;color:#111827;padding:1px 6px;border-radius:9999px;font-weight:800">3D</span>`
    : options?.isEvent
    ? `<span>📅 ${label}</span>`
    : `<span>${label}</span>`;

  wrapper.appendChild(badge);

  if (options?.is3d) {
    const stem = document.createElement('div');
    stem.style.cssText =
      'width:2px;height:18px;background:linear-gradient(to bottom,#fbbf24,transparent);';
    wrapper.appendChild(stem);
  } else {
    const pin = document.createElement('div');
    pin.className = 'transition-transform duration-200 group-hover:scale-110';
    pin.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 38 46">
        <ellipse cx="19" cy="43" rx="7" ry="3" fill="rgba(0,0,0,0.28)"/>
        <path d="M19 2 C10.163 2 3 9.163 3 18 C3 29 19 44 19 44 C19 44 35 29 35 18 C35 9.163 27.837 2 19 2Z"
          fill="${color}" stroke="#fdfbf7" stroke-width="2.5"/>
        <circle cx="19" cy="18" r="6.5" fill="#fdfbf7" opacity="0.94"/>
        <circle cx="19" cy="18" r="3.5" fill="${color}" opacity="0.8"/>
      </svg>
    `;
    wrapper.appendChild(pin);
  }

  return wrapper;
}

// ─── المكوّن الرئيسي ─────────────────────────────────────────────────
export default function HeritageMap() {
  const navigate = useNavigate();
  const mapRef = useRef<maplibregl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const landmarkMarkersRef = useRef<Record<string, maplibregl.Marker>>({});
  const eventMarkersRef = useRef<maplibregl.Marker[]>([]);
  const orbitFrameRef = useRef<number | null>(null);

  const [selected, setSelected] = useState<Landmark>(LANDMARKS[2]); // البدء بسدراتة لإبراز المجسم 3D
  const [dynamicLandmarks, setDynamicLandmarks] = useState<Landmark[]>([]);
  const [focusedLandmarkId, setFocusedLandmarkId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [mapEvents, setMapEvents] = useState<any[]>([]);
  const [layerFilter, setLayerFilter] = useState<'all' | 'landmarks' | 'events'>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [floatingBarOpen, setFloatingBarOpen] = useState<boolean>(false);
  const [mapReady, setMapReady] = useState<boolean>(false);

  // حالات الكاميرا ثلاثية الأبعاد وتحميل المجسم فوق الخريطة
  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [isOrbiting, setIsOrbiting] = useState<boolean>(false);
  const [model3DProgress, setModel3DProgress] = useState<number>(0);
  const [model3DLoaded, setModel3DLoaded] = useState<boolean>(false);

  const allLandmarks = [...LANDMARKS, ...dynamicLandmarks];

  // ─── التحقق الفعلي من صلاحيات الأدمن ───
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    localStorage.removeItem('is_heritage_admin');
    const demoRole = localStorage.getItem('demo_role');
    if (demoRole === 'super_admin') {
      setIsAdmin(true);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        if (demoRole !== 'super_admin') {
          setIsAdmin(false);
          setShowControls(false);
        }
        return;
      }
      supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.role === 'super_admin') {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
            setShowControls(false);
          }
        });
    });

    // جلب الفعاليات النشطة
    supabase
      .from('events')
      .select('*, associations(id, name)')
      .eq('is_public', true)
      .eq('status', 'active')
      .order('date', { ascending: true })
      .then(({ data }) => {
        if (data) {
          const enriched = data.map((ev, idx) => {
            const [lat, lng] = resolveOuarglaLocationCoords(ev.location, idx);
            return { ...ev, lat, lng };
          });
          setMapEvents(enriched);
        }
      });

    // جلب المعالم المعتمدة ديناميكياً
    supabase
      .from('heritage_archive')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (!data) return;
        const coreNames = ['مسجد لالة عزة', 'القصر العتيق', 'سدراتة'];
        const extra: Landmark[] = [];
        data.forEach((row: any, idx: number) => {
          const meta = parseHeritageMeta(row.content, row.title);
          if (meta.status !== 'approved') return;
          const titleClean = (row.title || '').trim();
          if (!titleClean || coreNames.some((cn) => titleClean.includes(cn))) return;

          const [fallbackLat, fallbackLng] = resolveOuarglaLocationCoords(
            `${titleClean} ${meta.cleanContent}`,
            idx + 3
          );
          const lat = typeof meta.lat === 'number' && !isNaN(meta.lat) ? meta.lat : fallbackLat;
          const lng = typeof meta.lng === 'number' && !isNaN(meta.lng) ? meta.lng : fallbackLng;
          const isMosque = /مسجد|جامع|زاوية|مصلى/i.test(titleClean);
          const isUrban = /قصر|قصبة|باب|سور|حي/i.test(titleClean);
          const cat: Landmark['category'] = isMosque ? 'mosque' : isUrban ? 'urban' : 'ruins';

          extra.push({
            id: `dyn-${row.id}`,
            nameAr: titleClean,
            nameTifinagh: 'ⵡⴰⵔⴵⵍⴰⵏ',
            nameTranslit: meta.category || 'معلم تراثي',
            badge: meta.category || 'معلم موثق',
            badgeColor: CATEGORY_COLORS[cat],
            lat,
            lng,
            period: meta.period || (meta.contributor ? `توثيق: ${meta.contributor}` : 'تراث وارجلان وسدراتة'),
            image: row.image_url || '/hero-bg.jpg',
            description: meta.cleanContent,
            category: cat,
          });
        });
        setDynamicLandmarks(extra);
      });
  }, []);

  // ─── حالات التحكم بمحيط القصر (أدمن فقط) ───────────────────
  const [showControls, setShowControls] = useState(false);
  const [offsetLat, setOffsetLat] = useState<number>(() => {
    const v = localStorage.getItem('ksar_v2_offsetLat');
    return v !== null ? parseFloat(v) : 0;
  });
  const [offsetLng, setOffsetLng] = useState<number>(() => {
    const v = localStorage.getItem('ksar_v2_offsetLng');
    return v !== null ? parseFloat(v) : 0;
  });
  const [scaleLat, setScaleLat] = useState<number>(() => {
    const v = localStorage.getItem('ksar_v2_scaleLat');
    return v !== null ? parseFloat(v) : 1;
  });
  const [scaleLng, setScaleLng] = useState<number>(() => {
    const v = localStorage.getItem('ksar_v2_scaleLng');
    return v !== null ? parseFloat(v) : 1;
  });
  const [rotation, setRotation] = useState<number>(() => {
    const v = localStorage.getItem('ksar_v2_rotation');
    return v !== null ? parseFloat(v) : 0;
  });
  const [copied, setCopied] = useState(false);

  // ─── نافذة اقتراح معلم تاريخي جديد ───────────────────────────
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [sugTitle, setSugTitle] = useState('');
  const [sugCategory, setSugCategory] = useState<string>(HERITAGE_CATEGORIES[0]);
  const [sugContributor, setSugContributor] = useState('');
  const [sugContent, setSugContent] = useState('');
  const [sugImageUrl, setSugImageUrl] = useState('');
  const [sugImageFile, setSugImageFile] = useState<File | null>(null);
  const [submittingSug, setSubmittingSug] = useState(false);

  const handleSubmitSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sugTitle.trim() || !sugContent.trim()) return;
    setSubmittingSug(true);
    try {
      let finalImageUrl = sugImageUrl.trim();
      if (sugImageFile) {
        const ext = sugImageFile.name.split('.').pop();
        const fileName = `heritage/suggestion-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('events').upload(fileName, sugImageFile);
        if (!upErr) {
          const { data: pubData } = supabase.storage.from('events').getPublicUrl(fileName);
          finalImageUrl = pubData.publicUrl;
        }
      }

      const packedContent = packHeritageMeta(sugContent, {
        category: sugCategory,
        contributor: sugContributor.trim() || 'مساهم من المجتمع',
        status: 'pending',
      });

      const { error } = await supabase.from('heritage_archive').insert([
        {
          title: sugTitle.trim(),
          content: packedContent,
          image_url: finalImageUrl || null,
        },
      ]);

      if (error) throw error;

      toast.success('شكراً لمساهمتك! تم إرسال المعلم المقترح إلى إدارة المنصة للمراجعة والاعتماد.');
      setSuggestOpen(false);
      setSugTitle('');
      setSugContributor('');
      setSugContent('');
      setSugImageUrl('');
      setSugImageFile(null);
    } catch (err: any) {
      toast.error('تعذر إرسال المساهمة: ' + (err.message || 'حاول لاحقاً'));
    } finally {
      setSubmittingSug(false);
    }
  };

  // إغلاق البطاقة الجانبية تلقائياً عند بدء الاستماع للصوت
  useEffect(() => {
    const unsubscribe = spatialAudio.subscribe((st) => {
      if (st.isPlaying && !st.isPaused) {
        setSidebarOpen(false);
      }
    });
    return unsubscribe;
  }, []);

  // تحديث مضلع القصر العتيق لحظياً عند تعديل أشرطة الأدمن
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const src = map.getSource('ksar-polygon') as maplibregl.GeoJSONSource | undefined;
    if (src) {
      const newCoords = computeTransformedPolygon(
        DEFAULT_KSAR_POLYGON,
        KSAR_CENTER,
        offsetLat,
        offsetLng,
        scaleLat,
        scaleLng,
        rotation
      );
      src.setData(toGeoJsonPolygon(newCoords));
    }

    localStorage.setItem('ksar_v2_offsetLat', String(offsetLat));
    localStorage.setItem('ksar_v2_offsetLng', String(offsetLng));
    localStorage.setItem('ksar_v2_scaleLat', String(scaleLat));
    localStorage.setItem('ksar_v2_scaleLng', String(scaleLng));
    localStorage.setItem('ksar_v2_rotation', String(rotation));
  }, [offsetLat, offsetLng, scaleLat, scaleLng, rotation, mapReady]);

  // حلقة الدوران السينمائي 360° حول المعلم
  useEffect(() => {
    if (!isOrbiting || !mapRef.current) {
      if (orbitFrameRef.current) {
        cancelAnimationFrame(orbitFrameRef.current);
        orbitFrameRef.current = null;
      }
      return;
    }

    const map = mapRef.current;
    const rotateCamera = () => {
      if (!mapRef.current) return;
      map.rotateTo((map.getBearing() + 0.25) % 360, { duration: 0 });
      orbitFrameRef.current = requestAnimationFrame(rotateCamera);
    };
    orbitFrameRef.current = requestAnimationFrame(rotateCamera);

    return () => {
      if (orbitFrameRef.current) {
        cancelAnimationFrame(orbitFrameRef.current);
        orbitFrameRef.current = null;
      }
    };
  }, [isOrbiting]);

  // ─── تهيئة خريطة MapLibre GL 3D + طبقة مجسم سدراتة Three.js ───
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    const sedrata = LANDMARKS.find((l) => l.id === 'sedrata')!;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          'esri-satellite': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            maxzoom: 17,
            attribution: 'Esri, Maxar, Earthstar Geographics | تواصل صحراء — وارجلان',
          },
        },
        layers: [
          {
            id: 'esri-satellite-layer',
            type: 'raster',
            source: 'esri-satellite',
            minzoom: 0,
            maxzoom: 22,
          },
        ],
      },
      // نظرة شاملة أنيقة على المعالم الثلاثة عند الفتح
      center: [5.318, 31.932],
      zoom: 12.1,
      pitch: 42,
      bearing: -12,
      maxPitch: 78,
      canvasContextAttributes: { antialias: true },
    });

    // أدوات التكبير والبوصلة 3D
    map.addControl(
      new maplibregl.NavigationControl({
        visualizePitch: true,
        showCompass: true,
        showZoom: true,
      }),
      'bottom-left'
    );

    // إيقاف الدوران التلقائي عند لمس المستخدم للخريطة
    map.on('mousedown', () => setIsOrbiting(false));
    map.on('touchstart', () => setIsOrbiting(false));

    map.on('load', () => {
      // 1. مضلع القصر العتيق الأحمر
      const initialKsarCoords = computeTransformedPolygon(
        DEFAULT_KSAR_POLYGON,
        KSAR_CENTER,
        offsetLat,
        offsetLng,
        scaleLat,
        scaleLng,
        rotation
      );

      map.addSource('ksar-polygon', {
        type: 'geojson',
        data: toGeoJsonPolygon(initialKsarCoords),
      });

      map.addLayer({
        id: 'ksar-polygon-fill',
        type: 'fill',
        source: 'ksar-polygon',
        paint: {
          'fill-color': '#ef4444',
          'fill-opacity': 0.16,
        },
      });

      map.addLayer({
        id: 'ksar-polygon-glow',
        type: 'line',
        source: 'ksar-polygon',
        paint: {
          'line-color': '#ef4444',
          'line-width': 10,
          'line-opacity': 0.25,
          'line-blur': 4,
        },
      });

      map.addLayer({
        id: 'ksar-polygon-outline',
        type: 'line',
        source: 'ksar-polygon',
        paint: {
          'line-color': '#ef4444',
          'line-width': 3,
          'line-opacity': 0.95,
        },
      });

      const ksarLandmark = LANDMARKS.find((lm) => lm.id === 'ksar-atiq');
      map.on('click', 'ksar-polygon-fill', () => {
        if (!ksarLandmark) return;
        setIsOrbiting(false);
        setSelectedEvent(null);
        setSelected(ksarLandmark);
        setFocusedLandmarkId(ksarLandmark.id);
        setFloatingBarOpen(true);
        setSidebarOpen(false);
        map.flyTo({
          center: [ksarLandmark.lng, ksarLandmark.lat],
          zoom: 15.5,
          pitch: is3DMode ? 55 : 0,
          duration: 1200,
        });
      });

      map.on('mouseenter', 'ksar-polygon-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'ksar-polygon-fill', () => {
        map.getCanvas().style.cursor = '';
      });

      // 2. مربع محيط جامع لالة عزة الذهبي
      map.addSource('lalla-azza-polygon', {
        type: 'geojson',
        data: toGeoJsonPolygon(LALLA_AZZA_POLYGON),
      });

      map.addLayer({
        id: 'lalla-azza-fill',
        type: 'fill',
        source: 'lalla-azza-polygon',
        paint: {
          'fill-color': '#efa83f',
          'fill-opacity': 0.24,
        },
      });

      map.addLayer({
        id: 'lalla-azza-outline',
        type: 'line',
        source: 'lalla-azza-polygon',
        paint: {
          'line-color': '#efa83f',
          'line-width': 3.5,
          'line-opacity': 0.98,
        },
      });

      const lallaLandmark = LANDMARKS.find((lm) => lm.id === 'lalla-azza');
      map.on('click', 'lalla-azza-fill', () => {
        if (!lallaLandmark) return;
        setIsOrbiting(false);
        setSelectedEvent(null);
        setSelected(lallaLandmark);
        setFocusedLandmarkId(lallaLandmark.id);
        setFloatingBarOpen(true);
        setSidebarOpen(false);
        map.flyTo({
          center: [lallaLandmark.lng, lallaLandmark.lat],
          zoom: 17.2,
          pitch: is3DMode ? 60 : 0,
          duration: 1200,
        });
      });

      // 3. دمج مجسم سدراتة الحقيقي ثلاثي الأبعاد (.glb) مباشرة فوق إحداثيات سدراتة!
      const sedrata3DLayer = createMapLibre3DModelLayer({
        id: 'sedrata-3d-model-layer',
        modelUrl: '/models/base_basic_pbr.glb',
        lng: sedrata.lng,
        lat: sedrata.lat,
        altitude: 0,
        sizeMeters: 230,
        rotationDeg: 25,
        onLoadStart: () => {
          setModel3DLoaded(false);
          setModel3DProgress(5);
        },
        onProgress: (p) => setModel3DProgress(p),
        onLoadComplete: () => {
          setModel3DProgress(100);
          setModel3DLoaded(true);
        },
        onError: () => {
          setModel3DLoaded(true);
        },
      });
      map.addLayer(sedrata3DLayer);

      setMapReady(true);
    });

    mapRef.current = map;

    return () => {
      if (orbitFrameRef.current) cancelAnimationFrame(orbitFrameRef.current);
      Object.values(landmarkMarkersRef.current).forEach((m) => m.remove());
      landmarkMarkersRef.current = {};
      eventMarkersRef.current.forEach((m) => m.remove());
      eventMarkersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ─── تحديث ماركرات المعالم والفعاليات وطبقات المضلعات حسب الفلتر ───
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    // 1. إزالة ماركرات الفعاليات السابقة وإعادة بنائها
    eventMarkersRef.current.forEach((m) => m.remove());
    eventMarkersRef.current = [];

    const showEventsLayer =
      (layerFilter === 'all' || layerFilter === 'events') && !focusedLandmarkId;

    if (showEventsLayer) {
      mapEvents.forEach((ev) => {
        if (selectedEvent && selectedEvent.id !== ev.id) return;
        const el = createMarkerElement('#10b981', ev.title, { isEvent: true });
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          setIsOrbiting(false);
          setFocusedLandmarkId(null);
          setSelectedEvent(ev);
          setSidebarOpen(true);
          map.flyTo({
            center: [ev.lng, ev.lat],
            zoom: 15.5,
            pitch: is3DMode ? 50 : 0,
            duration: 1200,
          });
        });

        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([ev.lng, ev.lat])
          .addTo(map);
        eventMarkersRef.current.push(marker);
      });
    }

    // 2. إظهار / إخفاء المعالم التاريخية
    const showLandmarksLayer =
      (layerFilter === 'all' || layerFilter === 'landmarks') && !selectedEvent;

    // إعادة بناء ماركرات المعالم
    Object.values(landmarkMarkersRef.current).forEach((m) => m.remove());
    landmarkMarkersRef.current = {};

    if (showLandmarksLayer) {
      allLandmarks.forEach((lm) => {
        const isOtherWhileFocused = Boolean(focusedLandmarkId && focusedLandmarkId !== lm.id);
        // وسم 3D يظهر حصرياً عند الضغط على سدراتة
        const show3dTag = Boolean(lm.has3dModel && focusedLandmarkId === 'sedrata');
        const el = createMarkerElement(CATEGORY_COLORS[lm.category], lm.nameAr, {
          is3d: show3dTag,
          isPulsingDot: isOtherWhileFocused,
        });
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          setIsOrbiting(false);
          setSelectedEvent(null);
          setSelected(lm);
          setFocusedLandmarkId(lm.id);
          setFloatingBarOpen(true);
          setSidebarOpen(false);
          map.flyTo({
            center: [lm.lng, lm.lat],
            zoom: lm.has3dModel ? 16.3 : lm.id === 'lalla-azza' ? 17.2 : 15.8,
            pitch: is3DMode ? (lm.has3dModel ? 64 : 56) : 0,
            bearing: lm.has3dModel ? -22 : map.getBearing(),
            duration: 1300,
          });
        });

        const marker = new maplibregl.Marker({
          element: el,
          anchor: isOtherWhileFocused ? 'center' : 'bottom',
          offset: show3dTag ? [0, -34] : [0, 0],
        })
          .setLngLat([lm.lng, lm.lat])
          .addTo(map);

        landmarkMarkersRef.current[lm.id] = marker;
      });
    }

    // 3. التحكم بظهور المضلعات وطبقات 3D
    const setLayerVis = (layerId: string, visible: boolean) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
      }
    };

    const showKsar =
      showLandmarksLayer && (!focusedLandmarkId || focusedLandmarkId === 'ksar-atiq');
    setLayerVis('ksar-polygon-fill', showKsar);
    setLayerVis('ksar-polygon-glow', showKsar);
    setLayerVis('ksar-polygon-outline', showKsar);

    const showLalla =
      showLandmarksLayer && (!focusedLandmarkId || focusedLandmarkId === 'lalla-azza');
    setLayerVis('lalla-azza-fill', showLalla);
    setLayerVis('lalla-azza-outline', showLalla);

    const showSedrata3D =
      showLandmarksLayer && (!focusedLandmarkId || focusedLandmarkId === 'sedrata');
    setLayerVis('sedrata-3d-model-layer', showSedrata3D);
  }, [mapEvents, dynamicLandmarks, layerFilter, focusedLandmarkId, selectedEvent, mapReady, is3DMode]);

  // تبديل وضع الكاميرا 3D / 2D
  const toggle3DView = () => {
    const next = !is3DMode;
    setIs3DMode(next);
    if (!next) setIsOrbiting(false);
    mapRef.current?.easeTo({
      pitch: next ? 60 : 0,
      bearing: next ? -20 : 0,
      duration: 900,
    });
  };

  // التحليق إلى المعلم المحدد وإخفاء بقية المعالم وفتح بطاقة الصورة والصوت
  const flyTo = (lm: Landmark) => {
    setIsOrbiting(false);
    setSelectedEvent(null);
    setSelected(lm);
    setFocusedLandmarkId(lm.id);
    setFloatingBarOpen(true);
    setSidebarOpen(false);
    if (!mapRef.current) return;

    mapRef.current.flyTo({
      center: [lm.lng, lm.lat],
      zoom: lm.has3dModel ? 16.3 : lm.id === 'lalla-azza' ? 17.2 : 15.8,
      pitch: is3DMode ? (lm.has3dModel ? 64 : 56) : 0,
      bearing: lm.has3dModel ? -22 : -10,
      duration: 1350,
    });
  };

  // التحليق إلى محطة من محطات الجولة الصوتية
  const handleSelectTourStop = (stop: AudioTourStop) => {
    setIsOrbiting(false);
    setSelectedEvent(null);
    const matched =
      stop.id === 'stop-lalla-azza'
        ? LANDMARKS.find((l) => l.id === 'lalla-azza')
        : stop.id === 'stop-ksar-atiq'
        ? LANDMARKS.find((l) => l.id === 'ksar-atiq')
        : stop.id === 'stop-sedrata-ruins'
        ? LANDMARKS.find((l) => l.id === 'sedrata')
        : LANDMARKS.find((l) => l.id === stop.id);

    if (matched) {
      setSelected(matched);
      setFocusedLandmarkId(matched.id);
    } else {
      setSelected({
        id: stop.id,
        nameAr: stop.titleAr,
        nameTifinagh: stop.categoryLabel,
        nameTranslit: stop.subtitleAr,
        badge: stop.categoryLabel,
        lat: stop.lat,
        lng: stop.lng,
        period: stop.period,
        image: stop.image || '/hero-bg.jpg',
        description: stop.audioNarrationText,
        category: stop.category === 'ruins' ? 'ruins' : 'urban',
      });
      setFocusedLandmarkId(stop.id);
    }

    setFloatingBarOpen(true);
    mapRef.current?.flyTo({
      center: [stop.lng, stop.lat],
      zoom: stop.id === 'stop-sedrata-ruins' ? 16.3 : 16,
      pitch: is3DMode ? 62 : 0,
      duration: 1300,
    });
  };

  // إعادة إظهار جميع المعالم
  const showAllLandmarks = () => {
    setIsOrbiting(false);
    setFocusedLandmarkId(null);
    setSelectedEvent(null);
    if (mapRef.current && allLandmarks.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      allLandmarks.forEach((l) => bounds.extend([l.lng, l.lat]));
      mapRef.current.fitBounds(bounds, {
        padding: 90,
        pitch: is3DMode ? 45 : 0,
        duration: 1200,
      });
    }
  };

  // التحليق إلى فعالية
  const flyToEvent = (ev: any) => {
    setIsOrbiting(false);
    setFocusedLandmarkId(null);
    setSelectedEvent(ev);
    setSidebarOpen(true);
    mapRef.current?.flyTo({
      center: [ev.lng, ev.lat],
      zoom: 15.5,
      pitch: is3DMode ? 50 : 0,
      duration: 1200,
    });
  };

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

  const handleReset = () => {
    setOffsetLat(0);
    setOffsetLng(0);
    setScaleLat(1);
    setScaleLng(1);
    setRotation(0);
    localStorage.removeItem('ksar_v2_offsetLat');
    localStorage.removeItem('ksar_v2_offsetLng');
    localStorage.removeItem('ksar_v2_scaleLat');
    localStorage.removeItem('ksar_v2_scaleLng');
    localStorage.removeItem('ksar_v2_rotation');
    toast.info('تمت إعادة ضبط المحيط إلى الإحداثيات المعتمدة');
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[#fdfbf7] overflow-hidden" dir="rtl">
      {/* ── الشريط العلوي الموحّد ─────────────────────────────────────── */}
      <UnifiedHeader
        rightSlot={
          <div className="flex items-center gap-2">
            {isAdmin && (
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
                className={`rounded-xl text-xs h-9 px-3 flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  showControls
                    ? 'bg-red-600 text-white hover:bg-red-700 shadow-md'
                    : 'text-[#301809] bg-[#fae1b7]/70 hover:bg-[#fae1b7] border border-[#dbc397]'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{showControls ? 'إخفاء أداة المحيط' : 'ضبط المحيط'}</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="border-[#dbc397] text-[#301809] hover:bg-[#fae1b7]/40 rounded-xl text-xs h-9 px-3 font-thmanyah font-bold whitespace-nowrap cursor-pointer"
            >
              {sidebarOpen ? 'إخفاء الدليل' : 'دليل المعالم'}
            </Button>
          </div>
        }
      />

      {/* ── جسم الصفحة ───────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* ── خريطة MapLibre 3D ───────────────────────────── */}
        <div ref={mapContainerRef} className="flex-1 z-10 w-full h-full" />

        {/* ── شريط التحكم العلوي النظيف (بدون أي تداخل بين الأزرار) ── */}
        <div className="absolute top-3.5 right-3.5 left-3.5 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          {/* يمين: زر العودة لكل المعالم + أزرار 3D (تظهر فقط عند اختيار سدراتة) */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {focusedLandmarkId && (
              <button
                type="button"
                onClick={showAllLandmarks}
                className="px-3.5 py-1.5 rounded-full bg-[#111318]/85 hover:bg-[#111318] backdrop-blur-xl text-white text-xs font-thmanyah font-bold flex items-center gap-1.5 shadow-lg transition-all cursor-pointer border border-white/15"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>كل المعالم</span>
              </button>
            )}

            {focusedLandmarkId === 'sedrata' && (
              <>
                <button
                  type="button"
                  onClick={toggle3DView}
                  className={`px-3 py-1.5 rounded-full backdrop-blur-xl text-xs font-thmanyah font-bold flex items-center gap-1.5 shadow-lg transition-all cursor-pointer border ${
                    is3DMode
                      ? 'bg-amber-400 text-stone-950 border-amber-300'
                      : 'bg-[#111318]/85 text-white/90 hover:text-white border-white/15'
                  }`}
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>{is3DMode ? '3D' : '2D'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!is3DMode) setIs3DMode(true);
                    setIsOrbiting((v) => !v);
                  }}
                  className={`px-3 py-1.5 rounded-full backdrop-blur-xl text-xs font-thmanyah font-bold flex items-center gap-1.5 shadow-lg transition-all cursor-pointer border ${
                    isOrbiting
                      ? 'bg-emerald-400 text-stone-950 border-emerald-300'
                      : 'bg-[#111318]/85 text-white/90 hover:text-white border-white/15'
                  }`}
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isOrbiting ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{isOrbiting ? 'إيقاف' : 'دوران 360°'}</span>
                </button>
              </>
            )}
          </div>

          {/* يسار: كبسولة الفلاتر الزجاجية الموحدة */}
          <div className="pointer-events-auto flex items-center gap-1 bg-[#111318]/80 backdrop-blur-2xl p-1 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.35)] border border-white/15">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'landmarks', label: 'المعالم' },
              { id: 'events', label: `الفعاليات (${mapEvents.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setLayerFilter(tab.id as any)}
                className={`px-3 py-1 rounded-full text-[11px] font-thmanyah font-bold transition-all cursor-pointer whitespace-nowrap ${
                  layerFilter === tab.id
                    ? 'bg-white text-stone-950 shadow-sm'
                    : 'text-white/75 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* شارة تحميل مجسم سدراتة 3D فوق الخريطة */}
        {!model3DLoaded && model3DProgress > 0 && focusedLandmarkId === 'sedrata' && (
          <div className="absolute top-16 right-3.5 z-20 bg-[#111318]/85 backdrop-blur-xl text-amber-300 px-3.5 py-1.5 rounded-full shadow-xl border border-amber-400/30 flex items-center gap-2 text-[11px] font-thmanyah font-bold">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>تحميل مجسم سدراتة 3D... {model3DProgress}%</span>
          </div>
        )}

        {/* ── لوحة التحكم التفاعلية في المحيط (للأدمن فقط) ── */}
        {showControls && isAdmin && (
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

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#fae1b7]/80">↕️ إزاحة شمال / جنوب:</span>
                  <span className="font-mono text-[#efa83f]" dir="ltr">
                    {(offsetLat * 111000).toFixed(0)} م
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

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#fae1b7]/80">↔️ إزاحة شرق / غرب:</span>
                  <span className="font-mono text-[#efa83f]" dir="ltr">
                    {(offsetLng * 94000).toFixed(0)} م
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

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#fae1b7]/80">📏 الحجم الطولي:</span>
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

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#fae1b7]/80">📐 الحجم العرضي:</span>
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

        {/* ── بطاقة الدليل الجانبية العائمة (Drawer Card) ───────────────────── */}
        <aside
          className={`
            absolute top-3 bottom-3 left-3 z-30
            transition-all duration-300 ease-out
            ${sidebarOpen ? 'translate-x-0 opacity-100 pointer-events-auto' : '-translate-x-[115%] opacity-0 pointer-events-none'}
            w-[calc(100%-1.5rem)] sm:w-[360px]
            bg-[#fdfbf7]/95 backdrop-blur-xl shadow-[0_24px_65px_rgba(0,0,0,0.45)] rounded-3xl ring-1 ring-[#dbc397]/60
            flex flex-col overflow-hidden
          `}
        >
          {selectedEvent ? (
            <>
              <div className="flex-shrink-0 bg-gradient-to-b from-emerald-900 to-[#301809] px-5 pt-5 pb-6">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-500 text-white">
                    📅 فعالية ميدانية نشطة
                  </span>
                  <button
                    onClick={showAllLandmarks}
                    className="text-[11px] text-[#fae1b7]/80 hover:text-white underline cursor-pointer"
                  >
                    إظهار جميع المعالم ←
                  </button>
                </div>
                <h2 className="text-xl font-thmanyah font-bold text-white leading-snug mb-1">
                  {selectedEvent.title}
                </h2>
                <p className="text-[#efa83f] text-xs font-bold">
                  تنظيم: {selectedEvent.associations?.name || 'جمعية محلية معتمدة'}
                </p>
              </div>

              <div className="flex-shrink-0 relative h-44 overflow-hidden bg-[#301809]">
                <img
                  src={selectedEvent.cover_image_url || '/hero-bg.jpg'}
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#fdfbf7]" />
                <button
                  onClick={() => flyToEvent(selectedEvent)}
                  className="absolute bottom-3 left-3 bg-emerald-600 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg hover:bg-emerald-700 transition-colors"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  تحليق لموقع الفعالية
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Calendar className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#723c11]/70 font-semibold mb-0.5">تاريخ وموعد الانعقاد</p>
                    <p className="text-sm font-bold text-[#301809]">{selectedEvent.date}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#fae1b7] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4 text-[#b87a29]" />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#723c11]/70 font-semibold mb-0.5">الموقع الميداني</p>
                    <p className="text-xs font-bold text-[#301809]">{selectedEvent.location}</p>
                  </div>
                </div>

                <p className="text-xs text-[#301809]/80 leading-relaxed bg-white p-3.5 rounded-xl border border-[#dbc397]/50">
                  {selectedEvent.description || 'انقر على زر التفاصيل أدناه للاطلاع على برنامج الفعالية وحجز تذكرتك الإلكترونية مجاناً.'}
                </p>

                <div className="space-y-2.5 pt-1">
                  <Button
                    onClick={() => navigate(`/event/${selectedEvent.id}`)}
                    className="w-full h-11 rounded-xl bg-gradient-to-r from-[#b87a29] to-[#efa83f] text-[#301809] font-thmanyah font-bold text-xs gap-2 shadow-md cursor-pointer"
                  >
                    <Ticket className="w-4 h-4" />
                    عرض تفاصيل الفعالية وحجز تذكرة QR
                  </Button>
                  <a
                    href={buildGoogleMapsDirectionsUrl([selectedEvent.lat, selectedEvent.lng])}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-10 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <Compass className="w-4 h-4 text-emerald-700" />
                    التوجيه عبر Google Maps
                  </a>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex-shrink-0 bg-gradient-to-b from-[#301809] to-[#4a2510] px-5 pt-5 pb-6">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${selected.badgeColor ?? 'bg-[#efa83f] text-[#301809]'}`}>
                      {selected.badge ?? CATEGORY_LABELS[selected.category]}
                    </span>
                    <span className="text-[10px] text-[#fae1b7]/60 font-medium">
                      {CATEGORY_LABELS[selected.category]}
                    </span>
                  </div>
                  <button
                    onClick={showAllLandmarks}
                    className="text-[10px] bg-white/10 hover:bg-white/20 text-[#fae1b7] px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer"
                  >
                    عرض الكل
                  </button>
                </div>

                <h2 className="text-xl font-thmanyah font-bold text-white leading-snug mb-1">
                  {selected.nameAr}
                </h2>
                <p className="text-[#efa83f] text-sm font-semibold tracking-wider mb-0.5" dir="ltr">
                  {selected.nameTifinagh}
                </p>
                <p className="text-[#fae1b7]/60 text-xs italic" dir="ltr">
                  {selected.nameTranslit}
                </p>
              </div>

              <div className="flex-shrink-0 relative h-44 overflow-hidden">
                <img
                  src={selected.image}
                  alt={selected.nameAr}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#fdfbf7]" />
                <button
                  onClick={() => flyTo(selected)}
                  className="absolute bottom-3 left-3 bg-[#efa83f] text-[#301809] font-thmanyah font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg hover:bg-[#d4a035] transition-colors cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  تحليق 3D للموقع
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#fae1b7] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <History className="w-4 h-4 text-[#b87a29]" />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#723c11]/70 font-semibold mb-0.5">الحقبة التاريخية</p>
                    <p className="text-sm font-bold text-[#301809]">{selected.period}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#fae1b7] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-[#b87a29]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#723c11]/70 font-semibold mb-0.5">الإحداثيات والموقع</p>
                      <p className="text-xs font-mono text-[#301809]/70" dir="ltr">
                        {selected.lat.toFixed(4)}° N, {selected.lng.toFixed(4)}° E
                      </p>
                    </div>
                  </div>
                  <a
                    href={buildGoogleMapsDirectionsUrl([selected.lat, selected.lng])}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-[11px] flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <Compass className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Google Maps</span>
                  </a>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <BookOpen className="w-3.5 h-3.5 text-[#b87a29]" />
                    <p className="text-[10px] text-[#723c11]/70 font-semibold">السياق التاريخي</p>
                  </div>
                  <p className="text-sm text-[#301809]/80 leading-relaxed">
                    {selected.description}
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() =>
                      navigate(
                        `/heritage?q=${encodeURIComponent(
                          `ماذا ذكر كتاب غصن البان عن ${selected.nameAr}؟`
                        )}`
                      )
                    }
                    className="w-full bg-gradient-to-r from-[#301809] to-[#4a2510] hover:from-[#4a2510] hover:to-[#301809] border border-[#efa83f] text-[#fae1b7] font-thmanyah font-bold rounded-2xl text-xs py-3.5 px-4 flex items-center justify-between transition-all shadow-md group cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#efa83f] shrink-0" />
                      <span>اقرأ ما ذُكر عن «{selected.nameAr}» في المراجع</span>
                    </div>
                    <ArrowRight className="w-4 h-4 rotate-180 text-[#efa83f] group-hover:-translate-x-1 transition-transform shrink-0" />
                  </button>

                  <button
                    onClick={() => {
                      const stop = resolveAudioStopForLandmark(selected.id);
                      setSidebarOpen(false);
                      setFloatingBarOpen(true);
                      spatialAudio.playStop(
                        stop.id,
                        stop.audioNarrationText,
                        stop.audioFileUrl,
                        stop.durationSeconds,
                        stop.ambientPreset
                      );
                    }}
                    className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-thmanyah font-bold rounded-2xl text-xs py-3.5 px-4 flex items-center justify-between transition-all shadow-md group cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Headphones className="w-4 h-4 text-slate-950 shrink-0" />
                      <span>استمع للشرح الصوتي المباشر للمعلم</span>
                    </div>
                    <ArrowRight className="w-4 h-4 rotate-180 text-slate-950 group-hover:-translate-x-1 transition-transform shrink-0" />
                  </button>
                </div>

                {/* قائمة المعالم */}
                <div className="border-t border-[#dbc397]/50 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] text-[#723c11]/70 font-semibold flex items-center gap-1.5">
                      <Star className="w-3 h-3 text-[#efa83f]" />
                      المعالم التاريخية ({allLandmarks.length})
                    </p>
                  </div>
                  <div className="space-y-2">
                    {allLandmarks.map((lm, idx) => (
                      <button
                        key={lm.id}
                        onClick={() => flyTo(lm)}
                        className={`w-full text-right flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm cursor-pointer ${
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
                        <span className="font-thmanyah font-bold flex-1 text-right truncate">{lm.nameAr}</span>
                        {lm.has3dModel && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-stone-950">
                            3D
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSuggestOpen(true)}
                    className="mt-3 w-full bg-[#fae1b7]/45 hover:bg-[#fae1b7] border border-dashed border-[#b87a29] text-[#301809] font-thmanyah font-bold rounded-xl text-xs py-2.5 px-3.5 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4 text-[#b87a29] shrink-0" />
                    <span>هل تعرف معلماً تاريخياً آخر؟ اقترح إضافته</span>
                  </button>
                </div>

                {mapEvents.length > 0 && (
                  <div className="border-t border-[#dbc397]/50 pt-4">
                    <p className="text-[10px] text-emerald-800 font-bold mb-3 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      الفعاليات الميدانية الجارية ({mapEvents.length})
                    </p>
                    <div className="space-y-2">
                      {mapEvents.map((ev) => (
                        <button
                          key={ev.id}
                          onClick={() => flyToEvent(ev)}
                          className="w-full text-right flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-300/70 text-[#301809] transition-all text-xs cursor-pointer"
                        >
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                          <div className="flex-1 min-w-0 text-right">
                            <p className="font-bold truncate">{ev.title}</p>
                            <p className="text-[10px] text-[#723c11]/70 truncate">📍 {ev.location} • {ev.date}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex-shrink-0 px-5 py-3 border-t border-[#dbc397]/40 bg-[#fdfbf7] flex items-center justify-between">
            <span className="text-[10px] text-[#723c11]/50 font-medium">وارجلان — ⵡⴰⵔⴵⵍⴰⵏ</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-[10px] text-[#723c11]/60 hover:text-[#b87a29] transition-colors font-semibold cursor-pointer"
            >
              طيّ الدليل ←
            </button>
          </div>
        </aside>
      </div>

      {/* ─── نافذة اقتراح معلم تاريخي جديد ─────────────────── */}
      <Dialog open={suggestOpen} onOpenChange={setSuggestOpen}>
        <DialogContent className="sm:max-w-[520px] rounded-3xl border-2 border-[#dbc397] font-sans" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-thmanyah font-bold text-[#301809] flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-[#b87a29]" />
              <span>اقترح معلماً تاريخياً لإضافته إلى خريطة التراث</span>
            </DialogTitle>
            <DialogDescription className="text-xs font-bold text-[#723c11]/80">
              ساهم معنا في توثيق المعالم، القصور، المساجد العتيقة، أو المواقع الأثرية في وارجلان وسدراتة.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitSuggestion} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-[#301809] mb-1 block">اسم المعلم التاريخي المقترح *</label>
              <Input
                required
                value={sugTitle}
                onChange={(e) => setSugTitle(e.target.value)}
                placeholder="مثال: باب عمي وعمران / قصر أنقوصة العتيق / عين الصفا"
                className="rounded-xl border-[#dbc397]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#301809] mb-1 block">تصنيف المعلم *</label>
                <select
                  value={sugCategory}
                  onChange={(e) => setSugCategory(e.target.value)}
                  className="w-full h-10 rounded-xl border border-[#dbc397] bg-white px-3 text-xs font-bold text-[#301809]"
                >
                  {HERITAGE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-[#301809] mb-1 block">اسم المساهم / الجمعية (اختياري)</label>
                <Input
                  value={sugContributor}
                  onChange={(e) => setSugContributor(e.target.value)}
                  placeholder="اسمك أو اسم جمعيتك"
                  className="rounded-xl border-[#dbc397]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#301809] mb-1 block">موقع المعلم ونبذة تاريخية عنه *</label>
              <Textarea
                required
                value={sugContent}
                onChange={(e) => setSugContent(e.target.value)}
                placeholder="اذكر موقع المعلم (أو إحداثياته إن وجدت) وأهم المعلومات التاريخية المعروفة عنه..."
                className="rounded-xl border-[#dbc397] min-h-[110px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#301809] block">صورة للمعلم (اختياري)</label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setSugImageFile(e.target.files?.[0] || null)}
                className="rounded-xl border-[#dbc397] text-xs cursor-pointer"
              />
              <Input
                value={sugImageUrl}
                onChange={(e) => setSugImageUrl(e.target.value)}
                placeholder="أو ضع رابط صورة مباشر https://..."
                dir="ltr"
                className="rounded-xl border-[#dbc397] text-xs"
              />
            </div>

            <Button
              type="submit"
              disabled={submittingSug}
              className="w-full bg-[#301809] hover:bg-[#723c11] text-[#fae1b7] font-thmanyah font-bold h-12 rounded-xl gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4 text-[#efa83f]" />
              {submittingSug ? 'جاري إرسال المقترح...' : 'إرسال المعلم المقترح للإدارة'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── المشغل السفلي المدمج بأسلوب Apple ── */}
      {!selectedEvent && (
        <FloatingAudioBar
          activeLandmark={selected}
          isOpen={floatingBarOpen}
          onClose={() => setFloatingBarOpen(false)}
          onOpenTour={() => setFloatingBarOpen(true)}
          onSelectTourStop={handleSelectTourStop}
          onOpenResearch={(query) => navigate(`/heritage?q=${encodeURIComponent(query)}`)}
        />
      )}
    </div>
  );
}
