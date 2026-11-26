export interface InterestOption {
  id: string;
  label: string;
  description: string;
}

export const USER_INTEREST_CATEGORIES: InterestOption[] = [
  {
    id: 'Heritage',
    label: 'التراث والأصالة',
    description: 'القصر العتيق، سدراتة، والمعمار الواحاتي',
  },
  {
    id: 'Religious',
    label: 'الديني والقرآني',
    description: 'حلقات العلم، المساجد العتيقة، والندوات الدينية',
  },
  {
    id: 'Educational',
    label: 'التعليم والتكوين',
    description: 'الورشات العلمية، الدورات، والمحاضرات',
  },
  {
    id: 'Cultural',
    label: 'الثقافة والفن',
    description: 'الأمسيات الشعرية، المعارض، والخط العربي',
  },
  {
    id: 'Sports',
    label: 'الرياضة والشباب',
    description: 'المبادرات الشبابية والأنشطة الرياضية',
  },
  {
    id: 'Social',
    label: 'الاجتماعي والخيري',
    description: 'التطوع، التكافل، والمبادرات المجتمعية',
  },
];

export const CATEGORY_ARABIC_LABELS: Record<string, string> = {
  Heritage: 'تراثي وأصالة',
  Religious: 'ديني وقرآني',
  Educational: 'تعليمي وتكويني',
  Cultural: 'ثقافي وفني',
  Sports: 'رياضي وشبابي',
  Social: 'اجتماعي وخيري',
  Other: 'نشاط مجتمعي',
};

const INTERESTS_KEY = 'sahara_user_interests_v1';
const SEEN_PREFIX = 'sahara_onboarding_seen_v1_';

export function getSavedInterests(): string[] {
  try {
    const raw = localStorage.getItem(INTERESTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function saveUserInterests(interests: string[], userId?: string | null) {
  try {
    localStorage.setItem(INTERESTS_KEY, JSON.stringify(interests));
    if (userId) {
      localStorage.setItem(`${SEEN_PREFIX}${userId}`, '1');
    }
    window.dispatchEvent(new CustomEvent('sahara-interests-updated', { detail: interests }));
  } catch {
    // ignore storage errors
  }
}

export function hasSeenOnboarding(userId?: string | null): boolean {
  if (!userId) return true;
  try {
    return localStorage.getItem(`${SEEN_PREFIX}${userId}`) === '1';
  } catch {
    return true;
  }
}

export function markOnboardingSeen(userId?: string | null) {
  if (!userId) return;
  try {
    localStorage.setItem(`${SEEN_PREFIX}${userId}`, '1');
  } catch {
    // ignore
  }
}
