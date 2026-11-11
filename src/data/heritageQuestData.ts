// Heritage Quest Data & Types - Ouarjlane Connect Pro (Sahara Pro 01)
// المستند من المراجع الـ 11 لتاريخ وارجلان وسدراتة

export interface QuestQuestion {
  id: string;
  stage: number; // 1 to 5
  rankTitle: string; // قارئ -> مستكشف -> فارس -> علاّمة -> مؤرخ
  rankIcon: string;
  title: string;
  riddle: string; // سؤال مباشر وشيق
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
  explanation: string; // شرح موجز جداً ومركّز
  bookTitle: string;
  pageReference: string;
  researchHint: string;
  badgeReward?: {
    name: string;
    icon: string;
    title: string;
  };
}

export const HERITAGE_QUEST_RANKS = [
  { rank: 'قارئ', icon: '📖', stage: 1 },
  { rank: 'مستكشف', icon: '🧭', stage: 2 },
  { rank: 'فارس', icon: '🛡️', stage: 3 },
  { rank: 'علاّمة', icon: '📜', stage: 4 },
  { rank: 'مؤرخ', icon: '👑', stage: 5 },
];

export const HERITAGE_QUEST_STAGES: QuestQuestion[] = [
  {
    id: 'quest-1-wamm-library',
    stage: 1,
    rankTitle: 'قارئ',
    rankIcon: '📖',
    title: 'خزانة قصر «وَمّ»',
    riddle: 'كم جزءاً من كتب المشرق طالع وتخيّر عالم وارجلان في خزانة قصر «وَمّ» خلال 4 أشهر؟',
    options: [
      { id: 'opt-1', text: '33 ألف جزء', isCorrect: true },
      { id: 'opt-2', text: '5 آلاف مجلد', isCorrect: false },
      { id: 'opt-3', text: 'ألف جزء', isCorrect: false },
      { id: 'opt-4', text: 'مائة مخطوطة', isCorrect: false }
    ],
    explanation: 'طالع نحو 33 ألف جزء في 4 أشهر لا ينام إلا بين الصبح والشروق وجلب أصولها إلى وارجلان.',
    bookTitle: 'ملامح الحركة العلمية في وارجلان',
    pageReference: 'ص 37',
    researchHint: 'مكتبة قصر وم 33 ألف جزء عمرو خليفة النامي',
    badgeReward: {
      name: 'قارئ مخطوطات الواحة',
      icon: '📖',
      title: 'عاشق الكتب'
    }
  },
  {
    id: 'quest-2-stucco-secret',
    stage: 2,
    rankTitle: 'مستكشف',
    rankIcon: '🧭',
    title: 'نفق سدراتة السري',
    riddle: 'إلى أين كان ينفذ النفق المائي السري المكتشف تحت رمال سدراتة بطول 8 كم؟',
    options: [
      { id: 'opt-1', text: 'إلى وسط قصر وارجلان العتيق', isCorrect: true },
      { id: 'opt-2', text: 'إلى بحيرة عين البيضاء', isCorrect: false },
      { id: 'opt-3', text: 'إلى قلعة تاهرت الرستمية', isCorrect: false },
      { id: 'opt-4', text: 'إلى واحات وادي ريغ', isCorrect: false }
    ],
    explanation: 'نفق مائي مسقوف (تيسكفين نيسدراتن) ربط سدراتة بقصر وارجلان لتأمين النجدة والماء أثناء الحصار.',
    bookTitle: 'Marguerite van Berchem (1960)',
    pageReference: 'ص 291',
    researchHint: 'النفق المائي السري سدراتة وارجلان مارغريت فان برشم',
    badgeReward: {
      name: 'مستكشف سدراتة الغارقة',
      icon: '🧭',
      title: 'مكتشف الرمال'
    }
  },
  {
    id: 'quest-3-krima-siege',
    stage: 3,
    rankTitle: 'فارس',
    rankIcon: '🛡️',
    title: 'حيلة جبل كريمة',
    riddle: 'ما الحيلة الذكية التي فاجأ بها أهل وارجلان جيش ابن غانية المحاصر لجبل كريمة؟',
    options: [
      { id: 'opt-1', text: 'سكب قدور زيت الزيتون على صخور الجبل', isCorrect: true },
      { id: 'opt-2', text: 'إشعال نيران ليلية للإيهام بقدوم إمدادات', isCorrect: false },
      { id: 'opt-3', text: 'إطلاق حمام زاجل برسائل مزيفة', isCorrect: false },
      { id: 'opt-4', text: 'حفر بئر ارتوازية في ليلة واحدة', isCorrect: false }
    ],
    explanation: 'صبوا الزيت ليوهموه بوفرة طعامهم، فقال قائدهم: «قوم يسيل إدامهم على الحجارة لا مطمع في قهرهم!» فارتحل.',
    bookTitle: 'غصن البان في تاريخ وارجلان',
    pageReference: 'ص 48',
    researchHint: 'حيلة الزيت حصار جبل كريمة غصن البان',
    badgeReward: {
      name: 'فارس قارة كريمة',
      icon: '🛡️',
      title: 'حامي الواحة'
    }
  },
  {
    id: 'quest-4-cordoba-journey',
    stage: 4,
    rankTitle: 'علاّمة',
    rankIcon: '📜',
    title: 'جاحظ إفريقية في قرطبة',
    riddle: 'من العالم الوارجلاني الملقب بـ «جاحظ إفريقية» الذي رحل للأندلس وصنف «العدل والإنصاف»؟',
    options: [
      { id: 'opt-1', text: 'أبو يعقوب يوسف الوارجلاني', isCorrect: true },
      { id: 'opt-2', text: 'أبو عمار عبد الكافي', isCorrect: false },
      { id: 'opt-3', text: 'أبو صالح جنون', isCorrect: false },
      { id: 'opt-4', text: 'سعيد بن يخلف السدراتي', isCorrect: false }
    ],
    explanation: 'هو الإمام أبو يعقوب يوسف بن إبراهيم (ت 570هـ)، رحل إلى قرطبة ونقل علومها وصنف كتب الأصول والمنطق.',
    bookTitle: 'أبو يعقوب الوارجلاني أصولياً',
    pageReference: 'ص 102',
    researchHint: 'أبو يعقوب يوسف بن إبراهيم الوارجلاني رحلته لقرطبة',
    badgeReward: {
      name: 'علاّمة قرطبة ووارجلان',
      icon: '📜',
      title: 'حكيم الأصول'
    }
  },
  {
    id: 'quest-5-city-state',
    stage: 5,
    rankTitle: 'مؤرخ',
    rankIcon: '👑',
    title: 'وارجلان وسدراتة',
    riddle: 'ما النموذج السياسي والحضاري الذي جسدته وارجلان وسدراتة بنظامهما القضائي والمائي؟',
    options: [
      { id: 'opt-1', text: 'نموذج «المدينة - الدولة» المستقلة', isCorrect: true },
      { id: 'opt-2', text: 'نموذج الإقطاعيات الزراعية التابعة', isCorrect: false },
      { id: 'opt-3', text: 'نموذج المخيمات العسكرية المؤقتة', isCorrect: false },
      { id: 'opt-4', text: 'نموذج القرى المنعزلة بلا نظام', isCorrect: false }
    ],
    explanation: 'أثبتت الأبحاث أن وارجلان شكلت نموذج «المدينة-الدولة» (City-State) ذات السيادة وشورى العزابة وإدارة المياه.',
    bookTitle: 'أعمال المهرجان الوطني لسدراتة 2016م',
    pageReference: 'ص 51',
    researchHint: 'وارجلان مدينة الدولة المهرجان الوطني سدراتة 2016',
    badgeReward: {
      name: 'مؤرخ الواحة الأكبر',
      icon: '👑',
      title: 'خبير التراث الأول'
    }
  }
];

export const QUEST_STORAGE_KEY = 'ouarjlane_heritage_quest_progress_v1';
