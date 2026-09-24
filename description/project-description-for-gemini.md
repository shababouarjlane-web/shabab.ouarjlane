# مشروع "تواصل صحراء" — وثيقة المشروع الكاملة (لـ Gemini)

---

## 🌐 هوية المشروع

**الاسم:** تواصل صحراء | Sahara Gather Connect  
**المنطقة:** وارجلان (Wardjlan) — الاسم الأمازيغي الأصيل لمحافظة ورقلة، الجزائر  
**الجمهور:** مجتمع **أمازيغي زناتي** بالدرجة الأولى — العربية لغة الواجهة والكتابة لكن الهوية الثقافية أمازيغية  
**اللغة المحلية الأصيلة:** تزناتيت (Taznatit) — لهجة أمازيغية زناتية خاصة بمنطقة وارجلان  
**السياق التاريخي:** سدراتة (Sedrata) كانت عاصمة الدولة الرستمية الأمازيغية (الإباضية) في القرون الوسطى

---

## 📂 هيكل المشروع (File Structure)

```
Ouarjlane-connect-pro/
├── public/
│   ├── hero-bg.jpg              ← صورة الخلفية الرئيسية (باب أندلسي)
│   ├── fonts/
│   │   ├── thmanyahserifdisplay-Regular.woff2
│   │   └── thmanyahserifdisplay-Bold.woff2
│   ├── favicon.svg
│   ├── pwa-192x192.png
│   └── pwa-512x512.png
├── src/
│   ├── pages/
│   │   ├── LandingPage.tsx      ← الصفحة الرئيسية (960 سطر)
│   │   ├── Heritage.tsx         ← أرشيف التراث (324 سطر)
│   │   ├── Login.tsx            ← تسجيل الدخول
│   │   └── association/
│   │       └── CreateEvent.tsx  ← إنشاء فعالية
│   ├── components/
│   │   └── ui/                  ← shadcn/ui components
│   ├── lib/
│   │   └── supabase.ts          ← Supabase client
│   ├── index.css                ← CSS vars + @font-face + utilities
│   └── main.tsx
├── index.html                   ← Google Fonts link (IBM Plex Sans Arabic)
├── tailwind.config.js           ← sahara.* color tokens + keyframes
├── vite.config.ts               ← Vite + PWA config
└── package.json
```

---

## 🛠️ Stack التقني الكامل

```json
{
  "runtime": "React 19 + TypeScript 5",
  "build": "Vite 8.0.8 + Rolldown",
  "styling": "Tailwind CSS 3.4.1",
  "ui": "shadcn/ui (Radix UI primitives)",
  "backend": "Supabase (PostgreSQL + Auth + Storage)",
  "pwa": "vite-plugin-pwa 1.2.0 + Workbox (generateSW mode)",
  "icons": "Lucide React",
  "fonts": {
    "headings": "Thmanyah Serif Display (local .woff2)",
    "body": "IBM Plex Sans Arabic (Google Fonts)"
  },
  "direction": "RTL (عربي)",
  "shell": "PowerShell (Windows) — use ; not &&"
}
```

---

## 🎨 نظام التصميم

### ألوان (Tailwind tokens: `sahara.*`)
```js
// tailwind.config.js → theme.extend.colors.sahara
{
  950: '#1a0d04',
  900: '#301809',   // espresso — خلفيات داكنة
  800: '#4a2510',
  700: '#723c11',   // umber — ألوان ثانوية
  600: '#8c4e18',
  500: '#b87a29',   // bronze — تفاصيل
  400: '#d4b174',   // gold
  300: '#efa83f',   // amber — اللون المميز الرئيسي
  200: '#dbc397',   // sandstone
  100: '#fae1b7',   // champagne
  50:  '#fdfbf7',   // parchment — خلفية الصفحات
}
```

### CSS Variables (src/index.css)
```css
--primary: #efa83f;
--primary-dark: #b87a29;
--deep: #301809;
--bg: #fdfbf7;
```

### Box Shadows (Tailwind)
```js
'glow-amber': '0 0 20px rgba(239,168,63,0.35)',
'glow-gold':  '0 0 30px rgba(212,177,116,0.4)',
'glow-deep':  '0 0 40px rgba(48,24,9,0.3)',
```

---

## 🗄️ قاعدة البيانات (Supabase Schema)

```sql
-- الفعاليات
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  location TEXT,
  cover_image_url TEXT,
  category TEXT,  -- 'cultural' | 'sport' | 'religious' | 'educational' | 'other'
  organizer_id UUID REFERENCES associations(id),
  is_free BOOLEAN DEFAULT true,
  max_attendees INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- الجمعيات
CREATE TABLE associations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  city TEXT,
  contact TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- المستخدمون
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT,
  email TEXT,
  role TEXT DEFAULT 'attendee',  -- 'attendee' | 'association_admin' | 'super_admin'
  association_id UUID REFERENCES associations(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- التذاكر
CREATE TABLE rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  event_id UUID REFERENCES events(id),
  ticket_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- الأرشيف التراثي
CREATE TABLE heritage_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  category TEXT,  -- 'architecture' | 'craft' | 'music' | 'history' | 'language'
  author TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- إعلانات الشركاء
CREATE TABLE partner_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  image_url TEXT,
  link TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 📄 الصفحات والمكونات الرئيسية

### LandingPage.tsx (960 سطر)
```
Header        → شعار + nav + زر تسجيل دخول
Hero          → صورة خلفية + عنوان h1 + وصف + CTAs + بطاقة تذكرة
Stats         → 4 إحصائيات حية من Supabase
Heritage      → معاينة التراث + زر استكشاف
Events        → قائمة فعاليات قادمة + تصفية + تسجيل
Footer        → 3 أعمدة + حقوق
LoginDialog   → نافذة تسجيل الدخول المضمّنة
```

### Heritage.tsx (324 سطر)
```
Hero          → صورة كاملة + عنوان "الأرشيف التراثي لوارجلان"
SearchBar     → بحث في المقالات
Grid          → بطاقات المقالات (3 أعمدة)
ArticleModal  → قراءة تفصيلية
```

### Login.tsx
```
TabSwitcher   → مشارك / جمعية
Form          → email + password + Supabase Auth
```

---

## ✅ الميزات المنجزة

- [x] Landing page كاملة بتصميم sahara palette
- [x] أرشيف تراثي مع بحث
- [x] RSVP / تذاكر رقمية
- [x] Supabase Auth (مشارك + مشرف)
- [x] PWA (قابل للتثبيت)
- [x] RTL Arabic throughout
- [x] Thmanyah + IBM Plex Sans Arabic fonts
- [x] اسم "وارجلان (ورقلة)" موحّد في كل المنصة

---

## 🔮 ميزات مقترحة لتطوير المنصة (طلب من Gemini)

### أولاً: ميزات الهوية الأمازيغية (الأولوية القصوى)

**1. قاموس تزناتيت تفاعلي**
- جدول `taznatit_dictionary` (كلمة أمازيغية، نطق، ترجمة عربية، صوت mp3)
- صفحة بحث + كلمة اليوم في الـ footer
- دعم كتابة تيفيناغ (Tifinagh unicode)

**2. أرشيف صوتي/مرئي**
- رفع مقاطع صوتية لأغاني تزناتيت / حكايات
- ربط بـ Supabase Storage
- مشغّل صوت مدمج

**3. تقويم أمازيغي**
- عرض المواسم الأمازيغية (ييناير، تيمشرط...)
- تذكيرات للفعاليات المرتبطة

**4. خريطة التراث**
- خريطة تفاعلية (Leaflet.js) لمعالم وارجلان وسدراتة
- نقاط تراثية: قصر سدراتة، القصور، المساجد التاريخية، الآبار...

### ثانياً: ميزات المجتمع

**5. دليل الحرفيين والمهن التقليدية**
- قائمة بحرفيي المنطقة (نسيج، زرابي، صياغة، جلود)
- ملفات تعريفية + طريقة التواصل

**6. نظام عضوية الجمعيات**
- طلب انضمام للجمعية من المنصة
- جدول `memberships` (user_id, association_id, status, role)

**7. تقييم الفعاليات**
- تقييم نجوم بعد الفعالية
- جدول `event_reviews` (user_id, event_id, rating, comment)

### ثالثاً: ميزات تقنية

**8. وضع Offline أفضل**
- تخزين آخر 20 فعالية + آخر 10 مقالات تراثية في localStorage
- عرض "أنت غير متصل" مع البيانات المخزنة

**9. إشعارات Push (PWA)**
- إشعار قبل يوم من الفعالية المسجل فيها

**10. QR Code للتذاكر**
- توليد QR code حقيقي لكل تذكرة (مكتبة qrcode.react)
- صفحة مسح QR للمشرفين

---

## 🚀 أوامر مفيدة للتطوير

```powershell
# تشغيل السيرفر المحلي
npm run dev      # http://localhost:5173

# بناء للإنتاج
npm run build

# دفع للـ GitHub
git add -A; git commit -m "message"; git push origin main
```

**تنبيه:** PowerShell لا يدعم `&&` — استخدم `;` لتسلسل الأوامر

---

## 📌 قيود مهمة

- **Supabase Free Tier:** 500MB DB, 2GB bandwidth/month
- **PWA Image Limit:** الصور في `public/` يجب أن تكون < 2MB لتُضاف لـ precache
- **Build:** TypeScript صارم — كل import غير مستخدم يكسر البناء
- **الخطوط:** Thmanyah محلي في `public/fonts/` — لا CDN

---

*هذا الملف مُعَدّ لـ Gemini Antigravity AI لأغراض التطوير المستمر للمشروع*
