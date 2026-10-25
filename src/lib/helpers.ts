export interface EventReview {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface AssociationMeta {
  bio: string;
  logo_url?: string;
  phone?: string;
  website?: string;
  location?: string;
}

/**
 * Packs user full name and phone number into users.full_name column
 */
export function packUserContact(name: string, phone?: string): string {
  const cleanName = (name || '').trim();
  const cleanPhone = (phone || '').trim();
  if (cleanName && cleanPhone) {
    return `${cleanName} | ${cleanPhone}`;
  }
  return cleanName || cleanPhone || '';
}

/**
 * Parses users.full_name into { name, phone }
 */
export function parseUserContact(fullName?: string | null, email?: string | null): { name: string; phone: string } {
  const fallbackName = email ? email.split('@')[0] : 'مشارك';
  if (!fullName) {
    return { name: fallbackName, phone: '' };
  }
  if (fullName.includes('|')) {
    const [n, p] = fullName.split('|').map(s => s.trim());
    return {
      name: n || fallbackName,
      phone: p || ''
    };
  }
  return { name: fullName.trim() || fallbackName, phone: '' };
}

/**
 * Packs association bio and metadata into associations.description
 */
export function packAssociationMeta(bio: string, meta: Omit<AssociationMeta, 'bio'>): string {
  const cleanBio = (bio || '').trim();
  const hasMeta = meta.logo_url || meta.phone || meta.website || meta.location;
  if (!hasMeta) return cleanBio;
  return `${cleanBio}||META||${JSON.stringify(meta)}`;
}

/**
 * Parses associations.description into clean bio + optional metadata (logo_url, phone, website, location)
 */
export function parseAssociationMeta(description?: string | null): AssociationMeta {
  if (!description) {
    return { bio: '' };
  }
  if (description.includes('||META||')) {
    const [bioPart, metaPart] = description.split('||META||');
    try {
      const parsed = JSON.parse(metaPart);
      return {
        bio: (bioPart || '').trim(),
        logo_url: parsed.logo_url || '',
        phone: parsed.phone || '',
        website: parsed.website || '',
        location: parsed.location || ''
      };
    } catch {
      return { bio: (bioPart || '').trim() };
    }
  }
  return { bio: description.trim() };
}

/**
 * Separates photo URLs and encoded reviews from events.gallery_urls
 */
export function parseGalleryAndReviews(galleryUrls?: string[] | null): {
  photos: string[];
  reviews: EventReview[];
} {
  if (!Array.isArray(galleryUrls)) {
    return { photos: [], reviews: [] };
  }
  const photos: string[] = [];
  const reviews: EventReview[] = [];

  for (const item of galleryUrls) {
    if (!item || typeof item !== 'string') continue;
    if (item.startsWith('REVIEW::')) {
      try {
        const rev = JSON.parse(item.slice('REVIEW::'.length));
        if (rev && rev.rating) {
          reviews.push(rev);
        }
      } catch {
        // ignore malformed review
      }
    } else {
      photos.push(item);
    }
  }

  // Sort reviews newest first
  reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return { photos, reviews };
}

export function packReviewItem(review: EventReview): string {
  return `REVIEW::${JSON.stringify(review)}`;
}

/**
 * Builds Google Calendar template URL for an event
 */
export function buildGoogleCalendarUrl(event: {
  title: string;
  description?: string;
  date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
}): string {
  const dateClean = (event.date || '').replace(/-/g, '');
  const startTimeClean = (event.start_time || '09:00:00').replace(/:/g, '').padEnd(6, '0').slice(0, 6);
  const endTimeClean = (event.end_time || '12:00:00').replace(/:/g, '').padEnd(6, '0').slice(0, 6);
  const dates = `${dateClean}T${startTimeClean}/${dateClean}T${endTimeClean}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title || 'فعالية تواصل صحراء',
    dates,
    details: event.description || 'فعالية عبر منصة تواصل صحراء - وارجلان (ورقلة)',
    location: event.location || 'ورقلة، الجزائر'
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Downloads an .ics calendar file for mobile / Apple / Outlook calendars
 */
export function downloadEventIcs(event: {
  id: string;
  title: string;
  description?: string;
  date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
}) {
  const dateClean = (event.date || '').replace(/-/g, '');
  const startTimeClean = (event.start_time || '09:00:00').replace(/:/g, '').padEnd(6, '0').slice(0, 6);
  const endTimeClean = (event.end_time || '12:00:00').replace(/:/g, '').padEnd(6, '0').slice(0, 6);

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ouarjlane Connect Pro//Sahara Gather//AR',
    'BEGIN:VEVENT',
    `UID:${event.id}@ouarjlane-connect.dz`,
    `DTSTAMP:${dateClean}T${startTimeClean}Z`,
    `DTSTART:${dateClean}T${startTimeClean}`,
    `DTEND:${dateClean}T${endTimeClean}`,
    `SUMMARY:${(event.title || '').replace(/\n/g, ' ')}`,
    `DESCRIPTION:${(event.description || 'فعالية عبر منصة تواصل صحراء').replace(/\n/g, '\\n')}`,
    `LOCATION:${(event.location || 'ورقلة، الجزائر').replace(/\n/g, ' ')}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `event-${event.id.slice(0, 8)}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Builds a WhatsApp share link with rich Arabic formatting
 */
export function buildWhatsAppShareUrl(event: {
  title: string;
  date?: string;
  start_time?: string;
  location?: string;
  associations?: { name?: string };
}, pageUrl: string): string {
  const assocName = event.associations?.name ? `\n🏛️ تنظيم: ${event.associations.name}` : '';
  const dateStr = event.date ? `\n📅 التاريخ: ${event.date}` : '';
  const timeStr = event.start_time ? ` (${event.start_time.substring(0, 5)})` : '';
  const locStr = event.location ? `\n📍 المكان: ${event.location}` : '';

  const text = `✨ أدعوك لحضور فعالية: *${event.title}*${assocName}${dateStr}${timeStr}${locStr}\n\n🎟️ احجز تذكرتك المجانية الآن عبر منصة تواصل صحراء:\n${pageUrl}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/**
 * Calculates user badge title from points
 */
export function calculateBadgeFromPoints(points: number): string {
  if (points >= 100) return 'سفير وارجلان';
  if (points >= 50) return 'Active Attendee';
  if (points >= 20) return 'مشارك مبادر';
  return 'عضو جديد';
}

// ============================================================================
// FAVORITE EVENTS (❤️ حفظ الفعالية)
// ============================================================================
const FAVORITES_STORAGE_KEY = 'ouarjlane_favorite_events_v1';

export function getFavoriteEventIds(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isEventFavorite(eventId: string): boolean {
  if (!eventId) return false;
  return getFavoriteEventIds().includes(eventId);
}

export function toggleFavoriteEvent(eventId: string): boolean {
  if (!eventId) return false;
  const current = getFavoriteEventIds();
  const exists = current.includes(eventId);
  const next = exists ? current.filter(id => id !== eventId) : [...current, eventId];
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
  return !exists;
}

// ============================================================================
// HERITAGE ARCHIVE CATEGORIES & COMMUNITY SUGGESTIONS / CONTACT REQUESTS
// ============================================================================
export const HERITAGE_CATEGORIES = [
  'قصور عتيقة',
  'شخصيات وأعلام',
  'حرف تقليدية',
  'مخطوطات ووثائق',
  'عادات وتقاليد'
] as const;

export interface HeritageMeta {
  cleanContent: string;
  category: string;
  contributor?: string;
  status: 'approved' | 'pending' | 'contact_request';
  contactPhone?: string;
  contactEmail?: string;
  requestType?: string;
}

export function inferHeritageCategory(title = '', content = ''): string {
  const combined = `${title} ${content}`;
  if (/قصر|قصبة|سدراتة|بغداد|أجف|عمارة|برج|سوق|مسجد|عتيق/i.test(combined)) return 'قصور عتيقة';
  if (/شيخ|علامة|عالم|شخصية|أعلام|مؤسس|تاريخي|تاجر|قاضي/i.test(combined)) return 'شخصيات وأعلام';
  if (/حرف|خياطة|نسيج|سعف|نخيل|فخار|طرز|صناعة|تقليدي/i.test(combined)) return 'حرف تقليدية';
  if (/مخطوط|وثيقة|رسالة|كتاب|أرشيف|عقد|خزانة/i.test(combined)) return 'مخطوطات ووثائق';
  if (/عادات|تقاليد|عرس|موسم|فلكلور|احتفال|كرم|شاي|كسكس/i.test(combined)) return 'عادات وتقاليد';
  return 'قصور عتيقة';
}

export function packHeritageMeta(
  cleanContent: string,
  meta: {
    category?: string;
    contributor?: string;
    status?: 'approved' | 'pending' | 'contact_request';
    contactPhone?: string;
    contactEmail?: string;
    requestType?: string;
  }
): string {
  const body = (cleanContent || '').trim();
  const payload = {
    category: meta.category || 'قصور عتيقة',
    contributor: meta.contributor || '',
    status: meta.status || 'approved',
    contactPhone: meta.contactPhone || '',
    contactEmail: meta.contactEmail || '',
    requestType: meta.requestType || ''
  };
  return `${body}||HMETA||${JSON.stringify(payload)}`;
}

export function parseHeritageMeta(rawContent?: string | null, title = ''): HeritageMeta {
  if (!rawContent) {
    return {
      cleanContent: '',
      category: inferHeritageCategory(title, ''),
      status: 'approved'
    };
  }
  if (rawContent.includes('||HMETA||')) {
    const [textPart, metaPart] = rawContent.split('||HMETA||');
    try {
      const parsed = JSON.parse(metaPart);
      return {
        cleanContent: (textPart || '').trim(),
        category: parsed.category || inferHeritageCategory(title, textPart),
        contributor: parsed.contributor || '',
        status: parsed.status || 'approved',
        contactPhone: parsed.contactPhone || '',
        contactEmail: parsed.contactEmail || '',
        requestType: parsed.requestType || ''
      };
    } catch {
      return {
        cleanContent: (textPart || '').trim(),
        category: inferHeritageCategory(title, textPart),
        status: 'approved'
      };
    }
  }
  return {
    cleanContent: rawContent.trim(),
    category: inferHeritageCategory(title, rawContent),
    status: 'approved'
  };
}

// ============================================================================
// GOOGLE MAPS DIRECTIONS & OUARGLA LOCATION COORDINATES
// ============================================================================
export function buildGoogleMapsDirectionsUrl(locationOrCoords: string | [number, number]): string {
  if (Array.isArray(locationOrCoords)) {
    const [lat, lng] = locationOrCoords;
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  const cleanLoc = (locationOrCoords || '').trim();
  const query = cleanLoc.includes('ورقلة') ? cleanLoc : `${cleanLoc}، ورقلة، الجزائر`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function resolveOuarglaLocationCoords(locationText?: string | null, seedIndex = 0): [number, number] {
  const loc = (locationText || '').trim();
  if (/القصر|العتيق|سوق الاحد|القصبة|لالا عزيزة|لالا منصورة|الجامع الكبير|قصر ورقلة/i.test(loc)) {
    return [31.9628 + (seedIndex % 3) * 0.0006, 5.3248 + (seedIndex % 2) * 0.0006];
  }
  if (/سدراتة/i.test(loc)) {
    return [31.8602, 5.3185];
  }
  if (/دار الثقافة|مفدي زكرياء|المسرح|المكتبة/i.test(loc)) {
    return [31.9532, 5.3312];
  }
  if (/جامعة|قاصدي مرباح|كلية|القطب الجامعي/i.test(loc)) {
    return [31.9415, 5.2980];
  }
  if (/الرويسات/i.test(loc)) {
    return [31.9285, 5.3390];
  }
  if (/عين البيضاء/i.test(loc)) {
    return [31.9585, 5.3980];
  }
  if (/سيدي خويلد/i.test(loc)) {
    return [31.9760, 5.4190];
  }
  if (/تقرت|تماسين/i.test(loc)) {
    return [33.1050, 6.0580];
  }
  if (/انقوسة|أنقوسة|قصر عجاجة/i.test(loc)) {
    return [32.1420, 5.3090];
  }
  if (/بغداد|أجف|الحجيرة/i.test(loc)) {
    return [32.5150, 5.5650];
  }
  if (/دار الشباب|مركب رياضي|ملعب|قاعة/i.test(loc)) {
    return [31.9498, 5.3265];
  }
  // Default spread nicely around central Ouargla
  const angle = (seedIndex * 137.5) * (Math.PI / 180);
  const radius = 0.005 + (seedIndex % 4) * 0.003;
  return [
    Number((31.9527 + Math.cos(angle) * radius).toFixed(5)),
    Number((5.3335 + Math.sin(angle) * radius).toFixed(5))
  ];
}

