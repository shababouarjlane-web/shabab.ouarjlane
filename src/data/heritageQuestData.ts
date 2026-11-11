// Heritage Quest Data & Types - Ouarjlane Connect Pro (Sahara Pro 01)
// مستند من بطون المخطوطات وأمهات كتب الواحة

export interface QuestQuestion {
  id: string;
  stage: number; // 1 to 5
  rankTitle: string; // قارئ -> مستكشف -> فارس -> علاّمة -> مؤرخ
  rankIcon: string;
  title: string;
  riddle: string; // سؤال مباشر وموجز
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

// بنك الأسئلة التراثية المتنوعة حسب الرتب الخمس
export const HERITAGE_QUESTION_BANK: Record<number, QuestQuestion[]> = {
  // ── المحطة 1: رتبة قارئ 📖 ──
  1: [
    {
      id: 'q1-wamm-library',
      stage: 1,
      rankTitle: 'قارئ',
      rankIcon: '📖',
      title: 'خزانة قصر «وَمّ»',
      riddle: 'كم جزءاً من كتب المشرق طالع وتخيّر عالم وارجلان في خزانة قصر «وَمّ» خلال 4 أشهر؟',
      options: [
        { id: 'opt-1', text: '33 ألف جزء', isCorrect: true },
        { id: 'opt-2', text: '5 آلاف مجلد', isCorrect: false },
        { id: 'opt-3', text: 'ألف جزء فقط', isCorrect: false },
        { id: 'opt-4', text: 'مائة مخطوطة', isCorrect: false }
      ],
      explanation: 'طالع نحو 33 ألف جزء في 4 أشهر متواصلة وجلب نفائسها إلى واحة وارجلان.',
      bookTitle: 'ملامح الحركة العلمية في وارجلان',
      pageReference: 'ص 37',
      researchHint: 'مكتبة قصر وم 33 ألف جزء عمرو خليفة النامي',
      badgeReward: { name: 'قارئ المخطوطات', icon: '📖', title: 'عاشق الكتب' }
    },
    {
      id: 'q1-quran-tafsir-70',
      stage: 1,
      rankTitle: 'قارئ',
      rankIcon: '📖',
      title: 'تفسير القرآن العظيم',
      riddle: 'في كم جزءاً وضع الإمام أبو يعقوب الوارجلاني تفسيره الشهير للقرآن الكريم؟',
      options: [
        { id: 'opt-1', text: 'في 70 جزءاً', isCorrect: true },
        { id: 'opt-2', text: 'في 30 جزءاً', isCorrect: false },
        { id: 'opt-3', text: 'في 10 أجزاء', isCorrect: false },
        { id: 'opt-4', text: 'في 5 أجزاء', isCorrect: false }
      ],
      explanation: 'ألّف الإمام أبو يعقوب تفسيراً ضخماً للقرآن الكريم في سبعين جزءاً اشتهر في ربوع المغرب الإسلامي.',
      bookTitle: 'أبو يعقوب الوارجلاني أصولياً',
      pageReference: 'ص 112',
      researchHint: 'أبو يعقوب الوارجلاني تفسير القرآن 70 جزءا',
      badgeReward: { name: 'قارئ التفاسير', icon: '📖', title: 'قارئ واعي' }
    },
    {
      id: 'q1-ikhtisar-mawarith',
      stage: 1,
      rankTitle: 'قارئ',
      rankIcon: '📖',
      title: 'كتاب اختصار المواريث',
      riddle: 'من هو الشيخ الوارجلاني مؤلف كتاب «اختصار المواريث والفرائض» التراثي الشهير؟',
      options: [
        { id: 'opt-1', text: 'الشيخ أبو عمار عبد الكافي', isCorrect: true },
        { id: 'opt-2', text: 'الشيخ إبراهيم أعزام', isCorrect: false },
        { id: 'opt-3', text: 'الشيخ باسة بن موسى', isCorrect: false },
        { id: 'opt-4', text: 'الشيخ عبد العزيز الثميني', isCorrect: false }
      ],
      explanation: 'ألّف العلامة أبو عمار عبد الكافي بن أبي يعقوب التناوتي كتابه المرجعي في علم الفرائض والمواريث.',
      bookTitle: 'كتاب اختصار المواريث والفرائض',
      pageReference: 'ص 15',
      researchHint: 'تحقيق كتاب اختصار المواريث أبو عمار عبد الكافي',
      badgeReward: { name: 'قارئ الفرائض', icon: '📖', title: 'متقن الأصول' }
    }
  ],

  // ── المحطة 2: رتبة مستكشف 🧭 ──
  2: [
    {
      id: 'q2-stucco-tunnel',
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
      explanation: 'نفق مائي مسقوف (تيسكفين نيسدراتن) ربط سدراتة بقلب قصر وارجلان لتأمين المؤن والماء أثناء الحصار.',
      bookTitle: 'Marguerite van Berchem (1960)',
      pageReference: 'ص 291',
      researchHint: 'النفق المائي السري سدراتة وارجلان مارغريت فان برشم',
      badgeReward: { name: 'مستكشف الرمال', icon: '🧭', title: 'مكتشف الأنفاق' }
    },
    {
      id: 'q2-springs-1051',
      stage: 2,
      rankTitle: 'مستكشف',
      rankIcon: '🧭',
      title: 'عيون واحة وارجلان',
      riddle: 'كم عدد العيون والآبار الارتوازية التي وثقها الجغرافيون القدماء في واحة وارجلان؟',
      options: [
        { id: 'opt-1', text: '1051 عيناً ارتوازية', isCorrect: true },
        { id: 'opt-2', text: '360 عيناً فقط', isCorrect: false },
        { id: 'opt-3', text: '100 بئر سطحية', isCorrect: false },
        { id: 'opt-4', text: '50 عيناً كبريتية', isCorrect: false }
      ],
      explanation: 'وثّق ابن خلدون والمؤرخون أن واحة وارجلان تفجرت فيها 1051 عيناً ارتوازية سقت بساتين النخيل بحكمة نادرة.',
      bookTitle: 'معالم الحضارة الإسلامية بوارجلان',
      pageReference: 'ص 118',
      researchHint: '1051 عين ارتوازية واحة وارجلان ابن خلدون',
      badgeReward: { name: 'مستكشف الواحة', icon: '🧭', title: 'خبير العيون' }
    },
    {
      id: 'q2-kufic-stucco',
      stage: 2,
      rankTitle: 'مستكشف',
      rankIcon: '🧭',
      title: 'زخارف سدراتة الجصية',
      riddle: 'بأي خط عربي أصيل نُقشت الجداريات والزخارف الجصية المكتشفة في قصر سدراتة؟',
      options: [
        { id: 'opt-1', text: 'الخط الكوفي الأندلسي المورّق', isCorrect: true },
        { id: 'opt-2', text: 'خط الرقعة الحديث', isCorrect: false },
        { id: 'opt-3', text: 'الخط الفارسي النستعليق', isCorrect: false },
        { id: 'opt-4', text: 'الخط الديواني العثماني', isCorrect: false }
      ],
      explanation: 'أبهرت جداريات سدراتة العالم بنقوشها الكوفية الأندلسية المورقة المحفوظة اليوم في متحف باردو واللوفر.',
      bookTitle: 'سدراتة والمدن القديمة بالصحراء',
      pageReference: 'ص 42',
      researchHint: 'زخارف جصية كوفية سدراتة مارغريت فان برشم',
      badgeReward: { name: 'مستكشف الآثار', icon: '🧭', title: 'قارئ النقوش' }
    }
  ],

  // ── المحطة 3: رتبة فارس 🛡️ ──
  3: [
    {
      id: 'q3-oil-siege',
      stage: 3,
      rankTitle: 'فارس',
      rankIcon: '🛡️',
      title: 'حيلة جبل كريمة',
      riddle: 'ما الحيلة الذكية التي فاجأ بها أهل وارجلان جيش ابن غانية المحاصر لجبل كريمة؟',
      options: [
        { id: 'opt-1', text: 'سكب قدور زيت الزيتون على صخور الجبل', isCorrect: true },
        { id: 'opt-2', text: 'إشعال نيران ليلية للإيهام بقدوم إمدادات', isCorrect: false },
        { id: 'opt-3', text: 'إطلاق حمام زاجل برسائل استغاثة مزيفة', isCorrect: false },
        { id: 'opt-4', text: 'حفر بئر ارتوازية في ليلة واحدة', isCorrect: false }
      ],
      explanation: 'صبوا الزيت ليوهموه بوفرة طعامهم، فقال: «قوم يسيل إدامهم على الحجارة لا مطمع في قهرهم!» فارتحل.',
      bookTitle: 'غصن البان في تاريخ وارجلان',
      pageReference: 'ص 48',
      researchHint: 'حيلة الزيت حصار جبل كريمة غصن البان',
      badgeReward: { name: 'فارس جبل كريمة', icon: '🛡️', title: 'حامي الواحة' }
    },
    {
      id: 'q3-old-ksar-gates',
      stage: 3,
      rankTitle: 'فارس',
      rankIcon: '🛡️',
      title: 'أبواب قصر وارجلان',
      riddle: 'أيّ من الأبواب التالية يُعد من الأبواب التاريخية الحصينة لسور قصر وارجلان العتيق؟',
      options: [
        { id: 'opt-1', text: 'باب بستان وباب عزي وباب الشرفة', isCorrect: true },
        { id: 'opt-2', text: 'باب دمشق وباب العمود', isCorrect: false },
        { id: 'opt-3', text: 'باب الفتوح وباب زويلة', isCorrect: false },
        { id: 'opt-4', text: 'باب المنصور وباب دكالة', isCorrect: false }
      ],
      explanation: 'قصر وارجلان كان محصناً بسور عظيم وأبواب رئيسية منها باب بستان وباب عزي وباب الشرفة وباب حمودة.',
      bookTitle: 'معالم الحضارة الإسلامية بوارجلان',
      pageReference: 'ص 64',
      researchHint: 'أبواب قصر وارجلان العتيق باب بستان باب عزي',
      badgeReward: { name: 'فارس الأسوار', icon: '🛡️', title: 'حارس القصر' }
    },
    {
      id: 'q3-sedrata-defense',
      stage: 3,
      rankTitle: 'فارس',
      rankIcon: '🛡️',
      title: 'صمود حاضرة سدراتة',
      riddle: 'أين اعتصم أهل سدراتة ووارجلان للدفاع عن أنفسهم بعد سقوط حاضرتهم تحت زحف الرمال والغزوات؟',
      options: [
        { id: 'opt-1', text: 'اعتصموا بحصن قصر وارجلان وجبل كريمة المنيع', isCorrect: true },
        { id: 'opt-2', text: 'هاجروا جميعاً إلى أقصى بلاد السودان', isCorrect: false },
        { id: 'opt-3', text: 'استسلموا وتخلوا عن الواحة', isCorrect: false },
        { id: 'opt-4', text: 'اعتصموا بسفن بحرية في شط ملغيغ', isCorrect: false }
      ],
      explanation: 'انتقل مركز الثقل الدفاعي والحضاري من سدراتة إلى قصر وارجلان العتيق المحصن الذي حافظ على شعلة الواحة.',
      bookTitle: 'غصن البان في تاريخ وارجلان',
      pageReference: 'ص 52',
      researchHint: 'انتقال سكان سدراتة إلى قصر وارجلان',
      badgeReward: { name: 'فارس الصمود', icon: '🛡️', title: 'درع الواحة' }
    }
  ],

  // ── المحطة 4: رتبة علاّمة 📜 ──
  4: [
    {
      id: 'q4-jahiz-cordoba',
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
      badgeReward: { name: 'علاّمة قرطبة', icon: '📜', title: 'حكيم الأصول' }
    },
    {
      id: 'q4-azzaba-council',
      stage: 4,
      rankTitle: 'علاّمة',
      rankIcon: '📜',
      title: 'نظام حلقة العزابة',
      riddle: 'ما هو المجلس العلمي والاجتماعي الذي تولى إدارة شؤون وارجلان وسدراتة بالشورى والعدل؟',
      options: [
        { id: 'opt-1', text: 'حلقة العزابة ومجالس الشورى', isCorrect: true },
        { id: 'opt-2', text: 'حامية المماليك العسكرية', isCorrect: false },
        { id: 'opt-3', text: 'مجلس ديوان الإنكشارية', isCorrect: false },
        { id: 'opt-4', text: 'محكمة التفتيش القشتالية', isCorrect: false }
      ],
      explanation: 'أدارت «حلقة العزابة» شؤون القضاء والأوقاف والتعليم والمياه في الواحة بنظام شوري دقيق أشاد به المؤرخون.',
      bookTitle: 'ملامح الحركة العلمية في وارجلان',
      pageReference: 'ص 88',
      researchHint: 'نظام حلقة العزابة في وارجلان وسدراتة',
      badgeReward: { name: 'علاّمة الشورى', icon: '📜', title: 'فقيه المجلس' }
    },
    {
      id: 'q4-musnad-rabia',
      stage: 4,
      rankTitle: 'علاّمة',
      rankIcon: '📜',
      title: 'ترتيب مسند الحديث',
      riddle: 'من هو العالم الوارجلاني الذي قام بترتيب أحاديث «مسند الإمام الربيع بن حبيب» على الأبواب الفقهية؟',
      options: [
        { id: 'opt-1', text: 'الإمام أبو يعقوب يوسف الوارجلاني', isCorrect: true },
        { id: 'opt-2', text: 'الشيخ باسة بن موسى', isCorrect: false },
        { id: 'opt-3', text: 'أبو عمار عبد الكافي', isCorrect: false },
        { id: 'opt-4', text: 'عمرو خليفة النامي', isCorrect: false }
      ],
      explanation: 'رتب أبو يعقوب الوارجلاني المسند وبوّبه وضبط أسانيده، وهو المعتمد إلى يومنا هذا.',
      bookTitle: 'أبو يعقوب الوارجلاني أصولياً',
      pageReference: 'ص 140',
      researchHint: 'ترتيب مسند الربيع بن حبيب أبو يعقوب الوارجلاني',
      badgeReward: { name: 'علاّمة الحديث', icon: '📜', title: 'محدث الواحة' }
    }
  ],

  // ── المحطة 5: رتبة مؤرخ 👑 ──
  5: [
    {
      id: 'q5-city-state',
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
      explanation: 'أثبتت أبحاث سدراتة 2016م أن وارجلان شكلت نموذج «المدينة-الدولة» (City-State) ذات السيادة والمؤسسات المستقلة.',
      bookTitle: 'أعمال المهرجان الوطني لسدراتة 2016م',
      pageReference: 'ص 51',
      researchHint: 'وارجلان مدينة الدولة المهرجان الوطني سدراتة 2016',
      badgeReward: { name: 'مؤرخ الواحة الأكبر', icon: '👑', title: 'خبير التراث الأول' }
    },
    {
      id: 'q5-water-gadous',
      stage: 5,
      rankTitle: 'مؤرخ',
      rankIcon: '👑',
      title: 'هندسة توزيع المياه',
      riddle: 'ما هي الآلة المائية التراثية الشهيرة التي استعملها أهالي وارجلان لقياس وتوزيع حصص مياه السقي بالعدل؟',
      options: [
        { id: 'opt-1', text: 'القدّوس (الساعة المائية المثقوبة)', isCorrect: true },
        { id: 'opt-2', text: 'الساقية البخارية', isCorrect: false },
        { id: 'opt-3', text: 'المضخة الهوائية', isCorrect: false },
        { id: 'opt-4', text: 'الميزان الزئبقي', isCorrect: false }
      ],
      explanation: 'استعمل الوارجلانيون «القدّوس» وهو إناء نحاسي مثقوب يُوضع في الماء لقياس الدقائق وتوزيع مياه العيون بدقة متناهية.',
      bookTitle: 'معالم الحضارة الإسلامية بوارجلان',
      pageReference: 'ص 122',
      researchHint: 'القدوس توزيع مياه العيون واحة وارجلان',
      badgeReward: { name: 'مؤرخ العيون', icon: '👑', title: 'حكيم المياه' }
    },
    {
      id: 'q5-neolithic-history',
      stage: 5,
      rankTitle: 'مؤرخ',
      rankIcon: '👑',
      title: 'جذور استيطان وادي مية',
      riddle: 'إلى أي عصر تاريخي موغل في القدم تعود أقدم آثار الاستيطان البشري المكتشفة في حوض وارجلان؟',
      options: [
        { id: 'opt-1', text: 'إلى العصر النيوليتيكي (الحجري الحديث)', isCorrect: true },
        { id: 'opt-2', text: 'إلى القرن السابع عشر الميلادي فقط', isCorrect: false },
        { id: 'opt-3', text: 'إلى العصر البيزنطي المتأخر فقط', isCorrect: false },
        { id: 'opt-4', text: 'إلى العهد العثماني الأول', isCorrect: false }
      ],
      explanation: 'كشفت الحفريات عن أدوات صوانية وفؤوس حجرية تثبت استيطان الإنسان لحوض وادي مية منذ آلاف السنين قبل الميلاد.',
      bookTitle: 'معالم الحضارة الإسلامية بوارجلان',
      pageReference: 'ص 11',
      researchHint: 'استيطان وادي مية العصر النيوليتيكي الحجري الحديث',
      badgeReward: { name: 'مؤرخ الأزمنة', icon: '👑', title: 'حارس الذاكرة' }
    }
  ]
};

// خوارزمية خلط الخيارات (Fisher-Yates Shuffle) لضمان عدم ظهور الإجابة الصحيحة في الخيار الأول دائماً
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// دالة اختيار لغز بديل ومختلف للمرحلة الحالية مع خلط خياراته دون إعادة التحدي من البداية
export function getRandomQuestionForStage(stage: number, currentQuestionId?: string): QuestQuestion {
  const pool = HERITAGE_QUESTION_BANK[stage] || [];
  if (pool.length === 0) {
    throw new Error(`No questions found for stage ${stage}`);
  }

  // فلترة اللغز الحالي لتجنب تكرار نفس اللغز عند التبديل
  const candidatePool = pool.filter((q) => q.id !== currentQuestionId);
  const selectedPool = candidatePool.length > 0 ? candidatePool : pool;
  const chosenIdx = Math.floor(Math.random() * selectedPool.length);
  const chosenQuestion = selectedPool[chosenIdx];

  // خلط الخيارات عشوائياً
  const shuffledOptions = shuffleArray(chosenQuestion.options);

  return {
    ...chosenQuestion,
    options: shuffledOptions
  };
}

// دالة توليد مسابقة فريدة ومحدثة لكل مستخدم وجلسة
export function generateRandomHeritageQuest(): QuestQuestion[] {
  const quest: QuestQuestion[] = [];

  for (let stage = 1; stage <= 5; stage++) {
    const q = getRandomQuestionForStage(stage);
    quest.push(q);
  }

  return quest;
}

// القائمة الافتراضية للبداية
export const HERITAGE_QUEST_STAGES: QuestQuestion[] = generateRandomHeritageQuest();

export const QUEST_STORAGE_KEY = 'ouarjlane_heritage_quest_progress_v2';
export const QUEST_QUESTIONS_KEY = 'ouarjlane_heritage_quest_active_set_v2';
