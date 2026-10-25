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
