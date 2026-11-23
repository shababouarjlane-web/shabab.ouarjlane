// نماذج المخطوطات والوثائق التاريخية المحققة - واحة وارجلان وسدراتة
// Sample Historical Manuscripts for AI Manuscript Reader

export interface SampleManuscript {
  id: string;
  titleAr: string;
  category: 'usul_fiqh' | 'water_contracts' | 'stucco_kufic' | 'trade_convoy';
  categoryLabel: string;
  centuryHegira: string;
  estimatedDate: string;
  originLocation: string;
  imageUrl: string;
  thumbnailUrl: string;
  transcriptionOriginal: string;
  transcriptionNormalized: string;
  englishSummary: string;
  abbreviationsFound: {
    term: string;
    expansion: string;
    explanation: string;
  }[];
  namedEntities: {
    persons: string[];
    locations: string[];
    dates: string[];
  };
  matchedBookReferences: {
    bookTitle: string;
    author: string;
    pages: string;
    quote: string;
  }[];
  expertNotes: string[];
}

export const SAMPLE_MANUSCRIPTS: SampleManuscript[] = [
  {
    id: 'ms-ikhtisar-mawarith',
    titleAr: 'مخطوطة «اختصار المواريث والفرائض» للشيخ أبي عمار عبد الكافي',
    category: 'usul_fiqh',
    categoryLabel: 'فقه ومواريث وقضاء',
    centuryHegira: 'القرن السادس الهجري',
    estimatedDate: 'حوالي 570هـ / 1175م',
    originLocation: 'قصر وارجلان العتيق (خزانة بني سيسين)',
    imageUrl: '/book-ref/bajou/bajou_scholarly_movement.jpg',
    thumbnailUrl: '/book-ref/bajou/bajou_scholarly_movement.jpg',
    transcriptionOriginal:
      'بسم الله الرحمن الرحيم صلى الله على سيدنا محمد.. هذا مختصر وجيز في علم الفرائض والمواريث، لخصه الشيخ الفقيه أبو عمار عبد الكافي بن أبي يعقوب الوارجلاني رحمه الله تعالى، صم، في بيان سهام الورثة وحجب النقصان والحرمان، وقسمة التركات بين أصحاب الفروض والعصبات، اهـ. والعمل به جارٍ في أحكام قضاة وارجلان وسدراتة بإقرار حلقة العزابة.',
    transcriptionNormalized:
      'بسم الله الرحمن الرحيم صلى الله على سيدنا محمد. هذا مختصر وجيز في علم الفرائض والمواريث، لخصه الشيخ الفقيه أبو عمار عبد الكافي بن أبي يعقوب الوارجلاني رحمه الله تعالى (صح معلوم)، في بيان سهام الورثة وحجب النقصان والحرمان، وقسمة التركات بين أصحاب الفروض والعصبات (انتهى كلام المصنف). والعمل به جارٍ في أحكام قضاة وارجلان وسدراتة بإقرار حلقة العزابة.',
    englishSummary:
      'A rare medieval legal manuscript on inheritance division and estate rights by Sheikh Abu Ammar Abd al-Kafi of Ouarjlane (6th century AH), confirmed by the Azzaba council.',
    abbreviationsFound: [
      {
        term: 'صم',
        expansion: 'صح معلوم',
        explanation: 'رمز توثيقي استعمله النساخ والفقهاء المغاربيون لتأكيد صحة الرواية وضبط النص عن الأصل المقروء.'
      },
      {
        term: 'اهـ',
        expansion: 'انتهى كلامه',
        explanation: 'اختصار يفيد نهاية نص الماتن أو انتهاء الاقتباس الفقهي المنقول.'
      },
      {
        term: 'حلقة العزابة',
        expansion: 'الهيئة الشورية الدينية والاجتماعية',
        explanation: 'المجلس القضائي والتشريعي المكون من 12 عضواً الذي أدار شؤون واحة وارجلان في العصر الوسيط.'
      }
    ],
    namedEntities: {
      persons: ['أبو عمار عبد الكافي بن أبي يعقوب الوارجلاني', 'النبي محمد صلى الله عليه وسلم'],
      locations: ['وارجلان', 'سدراتة', 'القصر العتيق'],
      dates: ['القرن السادس الهجري', '570هـ']
    },
    matchedBookReferences: [
      {
        bookTitle: 'تحقيق كتاب اختصار المواريث والفرائض',
        author: 'الشيخ أبو عمار عبد الكافي الوارجلاني',
        pages: 'ص 15 - 28',
        quote: 'يعد مصنف اختصار المواريث للعلامة أبي عمار التناوتي العمدة المعول عليها في فقه القضاء والفرائض في عموم واحات المغرب الأوسط.'
      },
      {
        bookTitle: 'ملامح الحركة العلمية في وارجلان',
        author: 'أ.د. عمرو خليفة النامي',
        pages: 'ص 44',
        quote: 'ترجم لأبي عمار كأبرز فقهاء الأصول والفروع الذين جمعوا بين رئاسة حلقة العزابة والتأليف المحكم.'
      }
    ],
    expertNotes: [
      'كُتبت المخطوطة بالخط المغربي الصحراوي الدقيق بحبر صمغي محلي مقاوم للتلاشي.',
      'تتضمن المخطوطة جداول حسابية دقيقة لكيفية قسمة العقارات والبساتين دون الإضرار بنظام السقي.'
    ]
  },
  {
    id: 'ms-water-contract-gadous',
    titleAr: 'وثيقة «عقد قسمة مياه عين البيضاء القديمة ونظام القدوس»',
    category: 'water_contracts',
    categoryLabel: 'عقود المياه والفقارات',
    centuryHegira: 'القرن السابع الهجري',
    estimatedDate: '642هـ / 1244م',
    originLocation: 'واحة وارجلان — محيط عين البيضاء وقصر بني واقين',
    imageUrl: '/book-ref/bajou/bajou_ouarjlane_geography.jpg',
    thumbnailUrl: '/book-ref/bajou/bajou_ouarjlane_geography.jpg',
    transcriptionOriginal:
      'الحمد لله وحده.. حضر شهود التوثيق وأهل الخبرة من قسامي الماء بوارجلان، فضبطوا ميزان نوبة ماء عين البيضاء بين نخيل بني واقين وبني سيسين على قدر ثلاثة قداديس وقيراطين في كل دورة شمسية، حبة بحبة وسهماً بسهم، برعاية أمين الماء وشيخ الحلقة، صم، فمن بدّل أو حوّل مجرى الساقية فعليه غرامة الزيت لحبس المسجد، اهـ.',
    transcriptionNormalized:
      'الحمد لله وحده. حضر شهود التوثيق وأهل الخبرة من قسامي الماء بوارجلان، فضبطوا ميزان نوبة ماء عين البيضاء بين نخيل بني واقين وبني سيسين على قدر ثلاثة قداديس وقيراطين في كل دورة شمسية، حبة بحبة وسهماً بسهم، برعاية أمين الماء وشيخ الحلقة (صح معلوم)، فمن بدّل أو حوّل مجرى الساقية فعليه غرامة الزيت لحبس المسجد (انتهى كلامه).',
    englishSummary:
      'An ancient water rights and irrigation distribution deed from Ouarjlane (642 AH), using the historical Gadous water-clock system among oasis tribes.',
    abbreviationsFound: [
      {
        term: 'القدوس (Gadous)',
        expansion: 'إناء حساب تدفق الماء بالساعة المائية',
        explanation: 'إناء نحاسي مثقوب يُوضع في حوض الماء، وامتلاؤه وغرقه يمثل وحدة زمنية مقننة لسقي حصة معينة من النخيل.'
      },
      {
        term: 'حبة وسهم',
        expansion: 'أجزاء حسابية دقيقة لملكية المياه',
        explanation: 'يقسم اليوم المائي إلى أسهم وحبات لتحديد عدد ساعات وصول الماء لكل بستان بدقة متناهية.'
      },
      {
        term: 'حبس المسجد',
        expansion: 'وقف المسجد الجامع',
        explanation: 'عقوبة مالية تدفع في صورة زيت لإضاءة قناديل جامع القصر عند ارتكاب مخالفة مائية.'
      }
    ],
    namedEntities: {
      persons: ['أمين الماء', 'شيخ الحلقة', 'قسامي الماء'],
      locations: ['عين البيضاء', 'بني واقين', 'بني سيسين', 'وارجلان'],
      dates: ['642هـ', 'القرن السابع الهجري']
    },
    matchedBookReferences: [
      {
        bookTitle: 'مصادر المياه والنشاط الفلاحي بوارجلان',
        author: 'أ. إلياس حاج عيسى',
        pages: 'ص 12 - 19',
        quote: 'اعتمد الفلاح الورقلي على أداة القدوس المائية لتوزيع مياه العيون الارتوازية بعدالة مطلقة تحت إشراف أمين السواقي.'
      },
      {
        bookTitle: 'الاقتصاد والمجتمع في وارجلان',
        author: 'د. يحياوي سعد',
        pages: 'ص 95',
        quote: 'تشير وثائق عقود الماء إلى مدى التطور القانوني والضبط الإداري للثروة المائية في الواحة منذ العصر الوسيط.'
      }
    ],
    expertNotes: [
      'تعد الوثيقة نموذجاً نادراً لعقود الوقف المائي الواحاتي التي منعت النزاعات القبلية لقرون.',
      'تتضمن أسماء الشهود وتوقيعاتهم برسم الخط المغربي المجوهر مع أختام قضاة القصر.'
    ]
  },
  {
    id: 'ms-sedrata-kufic-stucco',
    titleAr: 'نقيشة جصية سدراتية بالخط الكوفي المورّق (حفريات 1950)',
    category: 'stucco_kufic',
    categoryLabel: 'نقوش وزخارف أثرية',
    centuryHegira: 'القرن الرابع الهجري',
    estimatedDate: 'حوالي 360هـ / 970م',
    originLocation: 'مدينة سدراتة الأثرية (قصر الحاكم المستخرج من الرمال)',
    imageUrl: '/book-ref/bajou/bajou_scientific_works.jpg',
    thumbnailUrl: '/book-ref/bajou/bajou_scientific_works.jpg',
    transcriptionOriginal:
      '«الملك لله والقدرة لله.. بركة كاملة ويمن دائم وسعادة للمتوكل على الله، صنعة المعلم الوارجلاني بسدراتة المحروسة، في سنة ستين وثلثمائة».',
    transcriptionNormalized:
      '«الملك لله والقدرة لله. بركة كاملة ويمن دائم وسعادة للمتوكل على الله، صنعة المعلم الوارجلاني بسدراتة المحروسة، في سنة ستين وثلاثمائة (360هـ)».',
    englishSummary:
      'Foliated Kufic stucco inscription excavated in 1950 by Marguerite van Berchem at the Sedrata archaeological site, praising God and dating to 360 AH.',
    abbreviationsFound: [
      {
        term: 'الكوفي المورّق',
        expansion: 'طراز خط كوفي مزخرف بوريقات نباتية',
        explanation: 'أسلوب فني إسلامي رفيع تنتهي فيه حروف الألف واللام والراء بزخارف نباتية مورقة نحتت باليد في الجص الرطب.'
      },
      {
        term: 'المحروسة',
        expansion: 'لقب تكريم للمدن ذات الأسوار الحصينة',
        explanation: 'لقب رسمي أطلق على حاضرة سدراتة وقصر وارجلان دلالة على منعة أسوارهما وجيشهما.'
      }
    ],
    namedEntities: {
      persons: ['المعلم الوارجلاني', 'المتوكل على الله'],
      locations: ['سدراتة', 'سدراتة المحروسة', 'وارجلان'],
      dates: ['360هـ', 'القرن الرابع الهجري']
    },
    matchedBookReferences: [
      {
        bookTitle: 'Sedrata et les anciennes villes du Sahara (1960)',
        author: 'Marguerite van Berchem',
        pages: 'ص 293 - 296',
        quote: 'Les panneaux de stuc ciselé de Sedrata présentent des inscriptions koufiques fleuries d’une finesse comparable aux plus beaux monuments du Caire et de Cordoue.'
      },
      {
        bookTitle: 'معالم الحضارة الإسلامية بوارجلان',
        author: 'سليمان بوعصبانة',
        pages: 'ص 210',
        quote: 'أثبتت نقوش سدراتة الجصية بلوغ الصناعة الفنية والزخرفية في الواحة ذروة الإتقان في أواخر القرن الرابع الهجري.'
      }
    ],
    expertNotes: [
      'استخرجت هذه القطعة بحالة ممتازة بفضل الرمال الصحراوية الجافة التي حفظت الجص من الرطوبة والتفتت.',
      'تعتبر مرجعاً أرخ به علماء الآثار عصر ازدهار قصور سدراتة وعلاقاتها المعمارية بالأندلس والقيروان.'
    ]
  },
  {
    id: 'ms-trans-saharan-convoy',
    titleAr: 'رسالة «طريق الذهب وقوافل تادمكت وغانة التجارية»',
    category: 'trade_convoy',
    categoryLabel: 'وثائق التجارة والقوافل',
    centuryHegira: 'القرن الخامس الهجري',
    estimatedDate: '488هـ / 1095م',
    originLocation: 'محطة قوافل وارجلان (باب السلطان)',
    imageUrl: '/book-ref/bajou/bajou_andalus_journey.jpg',
    thumbnailUrl: '/book-ref/bajou/bajou_andalus_journey.jpg',
    transcriptionOriginal:
      'من عبد الله بن محمد التاجر الوارجلاني إلى إخواننا بتادمكت وغانة.. أما بعد، فقد وصلت قافلة الخريف سالمة محملة بستين حملاً من تمور الدقلة والمناقر، ومائتي كيس من الملح، وقبضنا بحمد الله تبر الذهب الخالص والأبنوس، صم، وسنوافيكم بوفد الشتاء مع أدلاء بني وارجلان المأمونين، والسلام، اهـ.',
    transcriptionNormalized:
      'من عبد الله بن محمد التاجر الوارجلاني إلى إخواننا بتادمكت وغانة. أما بعد، فقد وصلت قافلة الخريف سالمة محملة بستين حملاً من تمور الدقلة والمناقر، ومائتي كيس من الملح، وقبضنا بحمد الله تبر الذهب الخالص والأبنوس (صح معلوم)، وسنوافيكم بوفد الشتاء مع أدلاء بني وارجلان المأمونين، والسلام (انتهى كلامه).',
    englishSummary:
      'A medieval Trans-Saharan merchant letter documenting caravan trade of dates, salt, and gold dust between Ouarjlane, Tadmakkat, and ancient Ghana (488 AH).',
    abbreviationsFound: [
      {
        term: 'تبر الذهب',
        expansion: 'شذرات وغبار الذهب الخام غير المسكوك',
        explanation: 'العملة التجارية الرئيسية التي كانت تجلبها قوافل وارجلان من أودغشت وبلاد السودان لمقايضتها بالملح والتمور.'
      },
      {
        term: 'حمل (Heml)',
        expansion: 'حمولة البعير الواحد (نحو 200 كغ)',
        explanation: 'وحدة قياس حمولات القوافل الصحراوية المعتمدة في أسواق المغرب الأوسط.'
      }
    ],
    namedEntities: {
      persons: ['عبد الله بن محمد الوارجلاني', 'أدلاء بني وارجلان'],
      locations: ['وارجلان', 'تادمكت', 'غانة', 'باب السلطان'],
      dates: ['488هـ', 'القرن الخامس الهجري']
    },
    matchedBookReferences: [
      {
        bookTitle: 'تاريخ وارجلان وأثرها في نشر الإسلام بالسودان',
        author: 'د. خليفة محمد ود. محمد الطيب',
        pages: 'ص 14 - 18',
        quote: 'كان التجار الوارجلانيون همزة الوصل الأهم بين موانئ شمال إفريقيا وأسواق الذهب والملح في السودان الغربي.'
      },
      {
        bookTitle: 'الاقتصاد والمجتمع في وارجلان',
        author: 'د. يحياوي سعد',
        pages: 'ص 162',
        quote: 'شكل طريق وارجلان - تادمكت شرياناً تجارياً استراتيجياً غذى خزائن الدولة بالذهب وعزز مكانة الواحة الدولية.'
      }
    ],
    expertNotes: [
      'كُتبت على رقعة جلدية غليظة دُبغت بالعرعار والصمغ لتتحمل وعثاء السفر في الصحراء.',
      'تثبت الدور الريادي لأهل وارجلان في الأمانة ونشر الدين الحنيف عبر المعاملات التجارية الصادقة.'
    ]
  }
];
