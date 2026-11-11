import type { BookReferenceMeta, BookSection } from './ghosnAlBanKnowledge';

export const VAN_BERCHEM_META: BookReferenceMeta = {
  id: 'van-berchem-sedrata-1960',
  title:
    'سدراتة والمدن الأمازيغية الإباضية القديمة في الصحراء في كتابات مستكشفي القرن 19م (Sedrata et les anciennes villes berbères du Sahara)',
  author: 'عالمة الآثار السويسرية مارغريت فان برشم (Marguerite van Berchem)',
  editors:
    'نشرة المعهد الفرنسي للآثار الشرقية بالقاهرة — BIFAO 59 (1960), ص 289–308 (مع 8 لوحات أثرية مصوّرة) • تعريب وتوثيق: منصة تواصل صحراء',
  publisher: 'Institut Français d’Archéologie Orientale (IFAO) — Le Caire',
  yearWritten: '1960م (حفريات 1950 - 1956م)',
  totalPages: 29,
  pdfPathInRepo:
    'Book_Ref/Marguerite_van_Berchem_Sedrata_et_les_anciennes_villes_du_Sahara_1960.pdf',
  coverImage: '/book-ref/van-berchem/page_289.jpg',
  description:
    'دراسة أثرية وتاريخية مرجعية لعالمة الآثار السويسرية مارغريت فان برشم التي قادت حفريات سدراتة بين 1950 و1956م، تجمع فيها وتحلل كافة تقارير ومخطوطات ومشاهدات المستكشفين والمهندسين في القرن التاسع عشر حول سدراتة ووادي مية وقارة كريمة وجبل العباد، مرفقة بـ 8 لوحات تصوير جوي وصور المنحوتات الجبسية المكتشفة عام 1952م.'
};

export const VAN_BERCHEM_SECTIONS: BookSection[] = [
  {
    id: 'vb-intro-dead-rivers-berbrugger',
    bookId: VAN_BERCHEM_META.id,
    bookTitle: VAN_BERCHEM_META.title,
    bookAuthor: VAN_BERCHEM_META.author,
    chapterTitle:
      'مدخل الدراسة: الأنهار الصحراوية القديمة (وادي مية وإيغرحر) وأولى المشاهدات الأثرية لسدراتة وقارة كريمة (1857م)',
    category: 'سدراتة والعهود الأولى',
    pages: 'BIFAO 59, ص 289 - 291',
    spreadImage: '/book-ref/van-berchem/page_289.jpg',
    keywords: [
      'مارغريت فان برشم',
      'فان برشم',
      'Marguerite van Berchem',
      'BIFAO',
      'الأنهار الميتة',
      'وادي مية',
      'وادي إيغرحر',
      'وادي ريغ',
      'بيربروغر',
      'Berbrugger',
      'جريدة المبشر',
      'قارة كريمة',
      'آثار رومانية'
    ],
    summary:
      'تستهل مارغريت فان برشم دراستها بوضع حاضرة سدراتة (الواقعة على بعد 14 كلم جنوب وارجلان والمطمورة تحت الرمال منذ أكثر من سبعة قرون) في إطارها الجغرافي الطبيعي على ضفاف الأودية الصحراوية الكبرى («الأنهار الميتة»: وادي مية، وادي إيغرحر، ووادي ريغ)، وتوثق أقدم الإشارات الأثرية للموقع منذ عام 1857م وأبحاث العالم بيربروغر (A. Berbrugger) الذي أثبت أن جميع أطلال واحات الجنوب (ورقلة ومزاب) هي أطلال أمازيغية وإسلامية وليست رومانية.',
    verbatimQuote:
      '« En attendant la publication prochaine des recherches et des fouilles que nous avons poursuivies de 1950 à 1956 sur le site de Sedrata, l’ancienne capitale des Ibadites, dont les ruines, situées à 14 kilomètres au Sud de Ouargla, sont recouvertes depuis plus de sept siècles par les sables... L’oued Mya, sur les bords duquel Sedrata fut construite, prend sa source sur le plateau du Tademaït et se dirige sur Ouargla... A. Berbrugger dit : "J’ai visité avec soin toutes nos oasis méridionales, grandes ou petites, et je n’ai pu y découvrir le plus léger vestige d’une construction romaine." » — (الترجمة: في انتظار نشر أبحاثنا وحفرياتنا التي أجريناها من 1950 إلى 1956 في موقع سدراتة، العاصمة القديمة للإباضية التي تقع أطلالها على بعد 14 كلم جنوب وارجلان تحت الرمال منذ أكثر من سبعة قرون... إن وادي مية الذي شُيدت سدراتة على ضفافه ينبع من هضبة تادمايت ويتجه نحو وارجلان... ويقول بيربروغر: لقد زرت بعناية جميع واحاتنا الجنوبية كبيرة أو صغيرة، فلم أعثر فيها على أدنى أثر لأي بناء روماني).',
    details: [
      'حفريات مارغريت فان برشم: تشير المؤلفة في الهامش (ص 289) إلى أنها قادت حملات التنقيب الأثري في سدراتة بشكل متواصل بين عامي 1950 و1956م.',
      'شبكة الأودية الصحراوية الكبرى (ص 290): تفسر الباحثة تمركز الحواضر الإباضية والتجارة الصحراوية بين البحر المتوسط والسودان والنيجر بوجود الأودية الجوفية الكبرى التي يسميها الأهالي «الأنهار الميتة» (les fleuves morts): 1) وادي إيغرحر المنحدر من الهقار نحو تقرت، 2) وادي مية المنحدر من هضبة تادمايت والذي بُنيت على ضفافه سدراتة ووارجلان، 3) وادي ريغ الممتد نحو بسكرة.',
      'أول استكشاف سنة 1857م (ص 290–291): أشارت جريدة «المبشر» (Le Mobacher) الصادرة بالعربية والفرنسية في الجزائر بتاريخ 29 يناير 1881م تحت عنوان «متفرقات وسدراتة» إلى أن أطلال سدراتة وقارة كريمة زارتها الفرق العسكرية منذ يناير 1857م.',
      'شهادة عالم الآثار بيربروغر (A. Berbrugger) عام 1857–1858م: طاف بالمنطقة الممتدة شمال وارجلان ومزاب وأثبت علمياً خلوها التام من أي بناء روماني، مؤكداً أن القصور والأطلال كلها من تشييد السكان الأمازيغ المحليين.'
    ]
  },
  {
    id: 'vb-duveyrier-and-ville-1859-1861',
    bookId: VAN_BERCHEM_META.id,
    bookTitle: VAN_BERCHEM_META.title,
    bookAuthor: VAN_BERCHEM_META.author,
    chapterTitle:
      'رحلة هنري دوفيريي (1859–1861م) والمخطوطات الإباضية الأربعة، والدراسة الهيدرولوجية للمهندس فيل (L. Ville) عن عين الصفا',
    category: 'سدراتة والعهود الأولى',
    pages: 'BIFAO 59, ص 291 - 294',
    spreadImage: '/book-ref/van-berchem/page_292.jpg',
    keywords: [
      'هنري دوفيريي',
      'Henri Duveyrier',
      'مخطوطات سدراتة',
      'تخريب سدراتة 1274',
      'فران',
      'هيما',
      'حمراء',
      'بستان الخلاء',
      'الشماخي',
      'المهندس فيل',
      'L. Ville',
      'عين الصفا',
      'معنى وادي مية',
      'الطبقة الألبية'
    ],
    summary:
      'توثق فان برشم إسهام المستكشف الشهير هنري دوفيريي (Henri Duveyrier) الذي اعتمد على أربع مخطوطات إباضية نادرة باللغة العربية (من جبل نفوسة وغرداية ومخطوطتين جُلبتا من وارجلان) كشفت تاريخ سدراتة في القرنين 8 و9م وأسماء القرى التابعة لها (فران، هيما، حمراء وبستانها الشهير الخلاء) وسلسلة مشايخها، ثم تعرض دراسة كبير مهندسي المعادن ل. فيل (L. Ville) عام 1861م حول المياه الجوفية لوادي مية وبئر «عين الصفا» الشهيرة بسدراتة.',
    verbatimQuote:
      '« A l’aide des manuscrits ibadites qu’avec mille peines il réussit à se faire communiquer, l’un dans le Djebel Nefousa, l’autre à Ghardaïa et de deux autres manuscrits rapportés de Ouargla par H. Tarry (tous quatre rédigés en arabe), Duveyrier jette une lumière nouvelle sur un passé obscur. Il trouve dans ces anciens écrits le récit d’événements remontant au VIIIe et au IXe siècle, puis la destruction de Sedrata, celle des villages qui en dépendaient : Frân, Hîma, Hamrâ, ce dernier avec un jardin célèbre appelé El-Khalà. » — (الترجمة: بفضل المخطوطات الإباضية الأربع المكتوبة بالعربية — إحداها من جبل نفوسة والثانية من غرداية واثنتان جلبهما طاري من وارجلان — ألقى دوفيريي ضوءاً جديداً على تاريخ سدراتة في القرنين الثامن والتاسع الميلاديين، وتخريب سدراتة والقرى التابعة لها: فران، وهيما، وحمراء ذات البستان الشهير المسمى الخلاء).',
    details: [
      'دراسة هنري دوفيريي (Isedraten et le schisme ibadite, 1883): رغم أن دوفيريي لم يمكث بوارجلان سوى يوم واحد عام 1859م، فإنه نشر لاحقاً دراسة تاريخية رائدة استندت إلى 4 مخطوطات عربية (منها كتاب السير للشماخي ومخطوطتا وارجلان).',
      'القرى التابعة لسدراتة في المخطوطات (ص 292): ذكرت المخطوطات قرى عامرة كانت تتبع سدراتة قبل تخريبها، ومنها: «فران (Frân)»، و«هيما (Hîma)»، و«حمراء (Hamrâ)» التي اشتهرت ببستانها العظيم المسمى «الخلاء (El-Khalà)»، كما تضمنت إحدى المخطوطات تراجم كافة مشايخ وعلماء سدراتة حتى سنة 1543م.',
      'الموسم السنوي في سدراتة (ص 292): تذكر فان برشم أنه في نهاية شهر أبريل من كل عام، يجتمع الإباضية أحفاد أهل سدراتة القادمون من الجزائر وتونس وطرابلس فوق أطلال عاصمتهم القديمة للصلاة والدعاء معاً.',
      'الدراسة الهيدرولوجية للمهندس ل. فيل (L. Ville) عام 1861م (ص 292–294):',
      '• درس الطبقات المائية الارتوازية لوادي مية والآبار التي حفرها الإباضية قديماً، وخص بالذكر بئر «عين الصفا (Aïn Sfa)» غرب سدراتة التي تغنّى بها المؤرخون القدامى لغزارة تدفقها الذي كان يسقي الواحات المجاورة أيضاً.',
      '• وصف أطلال القصر التحصيني والبئر المطمورة جزئياً فوق القمة المسطحة لقارة كريمة (Gara Krima).',
      '• أورد تفسير اسم «وادي مية»: أنه يعني «نهر المائة رافد» لكثرة الشعاب والأودية العميقة التي تنحدر إليه من الجرف الغربي، وأشارت فان برشم في الهامش (ص 294) إلى أن الطبقة المائية التي استغلها الإباضية تقع على عمق نحو 60 متراً.'
    ]
  },
  {
    id: 'vb-feraud-ngoussa-manuscript-125-villages',
    bookId: VAN_BERCHEM_META.id,
    bookTitle: VAN_BERCHEM_META.title,
    bookAuthor: VAN_BERCHEM_META.author,
    chapterTitle:
      'تحقيقات شارل فيرو (1871–1872م) ومخطوطة مسجد نقوصة: حواضر «إيسدراتن» السبع، الـ 125 قرية، والـ 1051 عيناً',
    category: 'القرى والأعراش والمياه',
    pages: 'BIFAO 59, ص 294 - 296',
    spreadImage: '/book-ref/van-berchem/page_294.jpg',
    keywords: [
      'شارل فيرو',
      'Ch. Féraud',
      'مخطوطة مسجد نقوصة',
      'إيسدراتن',
      'Issedraten',
      'تالا أزدوس',
      'مكيعد الغربي',
      'تالا مغنرت',
      'تالا مماس',
      'تالا إزغارن',
      'محروز',
      'ملوش',
      'تامزوريت',
      'تارمونت',
      '125 قرية',
      '325 قرية',
      '1051 عين',
      'جبل العباد'
    ],
    summary:
      'تستعرض الباحثة رواية المترجم والمؤرخ ل. شارل فيرو (L.-Ch. Féraud) الذي أقام طويلاً في وارجلان سنتي 1871 و1872م واطلع على مخطوطة تاريخية محفوظة في مسجد نقوصة تتضمن «أخبار جميع مشايخ سدراتة وأسماء المدن التابعة لهم»، محدداً مواقع إحدى عشرة مدينة وقرية قديمة، وموثقاً الرواية التاريخية عن وجود 125 (أو 325) قرية تسقيها 1051 عيناً جارية بين جبل العباد وقرية فران على امتداد 45 كيلومتراً.',
    verbatimQuote:
      '« Après beaucoup de démarches, Féraud réussit à se faire communiquer ce document déposé à la mosquée de N’goussa qui contient "la chronique de la totalité des cheikhs de Sedrata" avec les noms de ces cheikhs et celui des villes qui dépendaient d’eux... La chronique raconte encore que "du Djebel Eibad, qui était la limite méridionale du groupe de peuplement, jusqu’à Feran qui en était le dernier village au Nord, c’est-à-dire sur une longueur d’environ 45 kilomètres, il existait trois cent vingt-cinq (ou 125) villages arrosés par mille cinquante et une (1051) fontaines... Sur plus de 40 kilomètres, on pouvait voyager à l’ombre des palmes, tandis que les marchandises du Soudan affluaient dans l’oued Mya." » — (الترجمة: بعد مساعٍ حثيثة، تمكن فيرو من الاطلاع على هذه الوثيقة المودعة بمسجد نقوصة والتي تتضمن تاريخ جميع مشايخ سدراتة وأسماء المدن التابعة لهم... وتروي الوثيقة أنه من جبل العباد جنوباً إلى قرية فران شمالاً، أي على طول 45 كلم، كانت توجد 325 (أو 125) قرية تسقيها 1051 عيناً... وكان المسافر يسير لأكثر من 40 كيلومتراً تحت ظلال النخيل المتصلة بينما تتدفق بضائع السودان إلى وادي مية).',
    details: [
      'المراكز السبعة الكبرى لـ «إيسدراتن (Issedraten)» (ص 294): نقل فيرو أن المنطقة الواقعة شمال جبل كريمة كانت خضراء عامرة بسبعة مراكز سكانية كبرى تُعرف مجتمعة بالاسم الأمازيغي «إيسدراتن» (الذي عُرّب إلى سدراتة)، وكانت سهولها تعج بأسراب النعام والأعشاب ومجاري المياه.',
      'أسماء ومواقع المدن الإحدى عشرة المذكورة في مخطوطة مسجد نقوصة (ص 294):',
      '1) تالا أزدوس (Tala-Azdous): وهي نقوصة نفسها (تالي اندوسن).',
      '2) مكيعد الغربي (Mekied el-Ouest): أطلال بجانب نقوصة قرب العين المسماة «تالا مغنرت (Tala-Megnert)».',
      '3) تالا مماس (Tala Memas): شرق نقوصة.',
      '4) حيمة (Haïma): جنوب نقوصة قرب العين المسماة «تالا إزغارن (Tala Izgaren)».',
      '5) فران (Feran): على بعد 20 كلم شمال وارجلان (وهي آخر قرى الإقليم شمالاً).',
      '6) تالا موسى (Tala-Mouça)، و7) محروز (Maharouz): شمال نقوصة.',
      '8) ملوش (Melouch): من جهة شط وارجلان.',
      '9) تامزوريت (Tamezour’et): بين وارجلان وجبل كريمة.',
      '10) تارمونت (Tarmount): عند أطلال إيسدراتن/سدراتة، و11) عين بغل (Aïn Beghel).',
      'مشاهدات فيرو الميدانية وجبل العباد (ص 295): سجل وجود بقايا مساكن وقنوات وسواقي (aqueducs) وجذوع أشجار متفحمة وأصداف مياه عذبة في مجرى الوادي، وأشار إلى وجود أكثر من مائة محراب تعبد في «جبل العباد» (Montagne des adorateurs de Dieu) الذي يبلغ ارتفاعه نحو 80 متراً مثل قارة كريمة.'
    ]
  },
  {
    id: 'vb-victor-largeau-barhad-bamenndil',
    bookId: VAN_BERCHEM_META.id,
    bookTitle: VAN_BERCHEM_META.title,
    bookAuthor: VAN_BERCHEM_META.author,
    chapterTitle:
      'استكشافات فيكتور لارجو (1872–1879م): أول دراسة أثرية لسدراتة، مدينتا «بغداد الصغيرة والكبيرة»، الحجيرة، نقوصة، وبامنديل',
    category: 'سدراتة والعهود الأولى',
    pages: 'BIFAO 59, ص 296 - 300',
    spreadImage: '/book-ref/van-berchem/page_298.jpg',
    keywords: [
      'فيكتور لارجو',
      'Victor Largeau',
      'بغداد الصغيرة',
      'بغداد الكبيرة',
      'Barhad es-Cegir',
      'Barhad el-Kebir',
      'الحجيرة',
      'El-Hadjira',
      'بامنديل',
      'Ba Menndil',
      'حاسي بوريحرة',
      '15 مدينة أثرية',
      'دوران وتوماس',
      'حلي ذهبية'
    ],
    summary:
      'تفرد مارغريت فان برشم قسماً مهماً لرحلات المستكشف الفرنسي فيكتور لارجو (Victor Largeau) بين 1872 و1879م الذي تنسب إليه الفضل في إنجاز «أول دراسة أثرية علمية لموقع سدراتة» وأطلال وادي مية ووادي ريغ؛ حيث وثّق في ربيع وصيف 1877م خمسة عشر موقعاً لمدن وقرى أثرية على طول 132 كلم في وادي مية، منها المدينتان التوأمان «بغداد الصغيرة» و«بغداد الكبيرة»، وأطلال مسجد الحجيرة، وقصر نقوصة، وحصن بامنديل، وأحد عشر موقعاً في حوض سدراتة وحده.',
    verbatimQuote:
      '« Revenu à Touggourt, au printemps 1877, Largeau s’engage dans l’oued Mya, en direction de Ouargla. Il ne tarde pas à être frappé par le nombre de ruines qu’il y découvre. Ce sont d’abord, à trois journées de marche de Touggourt, celles de deux villes jumelles, Barhad es-Cegir (Bagdad la Petite) perchée sur un monticule et entourée d’une enceinte et, non loin de là, celles de Barhad el-Kebir (Bagdad la Grande)... Et le voyageur conclut : "cette vallée de l’oued Mya, que j’ai explorée sur une longueur de 132 kilomètres, n’était au Moyen Age qu’une suite de riants villages et de jardins. Pour ma part, j’ai rencontré quinze ruines de lieux habités dans le parcours de Barhad au Hassi Bou Rihra et je n’ai pas tout vu." » — (الترجمة: عند عودته إلى تقرت في ربيع 1877م، سلك لارجو وادي مية باتجاه وارجلان، فادهشه عدد الأطلال التي اكتشفها؛ فوجد أولاً على مسيرة ثلاثة أيام من تقرت أطلال مدينتين توأمين هما: «بغداد الصغيرة» المحاطة بسور فوق تلة، وقريباً منها «بغداد الكبيرة»... ويختم الرحالة بقوله: إن وادي مية هذا الذي استكشفته على طول 132 كلم لم يكن في العصر الوسيط سوى سلسلة متصلة من القرى الغناء والبساتين؛ وقد صادفت بنفسي 15 موقعاً لأطلال مدن مأهولة من بغداد إلى حاسي بوريحرة ولم أرَ كل شيء).',
    details: [
      'أطلال المدينتين التوأمين «بغداد الصغيرة» و«بغداد الكبيرة» (ص 298): اكتشفهما لارجو على مسيرة 3 أيام من تقرت نحو وارجلان، ومنازلهما مبنية بالحجارة الكلسية وملاط الجبس الجيري وعليها آثار حريق قديم وبئر باقية، وأشار البروفيسور تاديوس لوفيكي (T. Lewicki) في الهامش إلى أن «بغداد» هذه كانت مركزاً إباضياً مهماً سُمي تيمناً بعاصمة العباسيين ودُمّر في نفس حقبة تخريب سدراتة.',
      'أطلال الحجيرة ونقوصة وبامنديل (ص 298):',
      '• الحجيرة (El-Hadjira): شاهد فيها لارجو صفوف أعمدة (colonnades) لمسجد قديم مندثر.',
      '• نقوصة (N’Goussa): وصفها بأنها قصر عريق ساحر محاط بسور مدعم بأبراج مربعة وسط بساتين غناء، ورصد شرق الطريق المؤدي إلى وارجلان أطلال مدينة أمازيغية قديمة بارزة نصفها من الرمال.',
      '• حصن بامنديل (Ba Menndil): قصر قديم مهجور يتوج بسوره الكبير وأبراجه المربعة قمة قارة صخرية تشرف على الشط الأبيض وواحة وارجلان بمآذنها ونخيلها.',
      'إحصاء لارجو في حوض سدراتة ووادي مية (ص 299–300): أقام لارجو في وارجلان طوال صيف 1877م، ورصد في منطقة سدراتة وحدها 11 مدينة أو قرية مندثرة، وتابع الاستكشاف جنوب قارة كريمة حتى بئر «حاسي بوريحرة (Hassi Bou Rihra)» على بعد 33 فرسخاً جنوب وارجلان، كما سمع بمدينتين مندثرتين في العرق الشرقي هما «منزة (Mennza)» و«صهود (Sohoûd)».',
      'حفريات دوران وتوماس (MM. Durand et Thomas) في فبراير ومارس 1875م (ص 300): ذكرت جريدة المبشر أنهما زارا أطلال سدراتة ونقّبا فيها فعثرا على حليّ من الذهب، وحليّ من قشور بيض النعام، وأوانٍ فخارية وأصداف مياه عذبة.'
    ]
  },
  {
    id: 'vb-roland-tarry-excavations-1881',
    bookId: VAN_BERCHEM_META.id,
    bookTitle: VAN_BERCHEM_META.title,
    bookAuthor: VAN_BERCHEM_META.author,
    chapterTitle:
      'بعثة الجيولوجي رولان (1879–1883م) والحفريات الكبرى للمهندس هارولد طاري بسدراتة (1881م)',
    category: 'سدراتة والعهود الأولى',
    pages: 'BIFAO 59, ص 300 - 305',
    spreadImage: '/book-ref/van-berchem/page_303.jpg',
    keywords: [
      'رولان',
      'G. Rolland',
      'شوازي',
      'Choisy',
      'فايسبيرغر',
      'Weisgerber',
      'الزجاج الملون',
      'هارولد طاري',
      'Harold Tarry',
      'حفريات سدراتة 1881',
      'فلاترز',
      'Flatters',
      'حمولتي جمل',
      'متحف التروكاديرو',
      'الرسوم الجدارية بسدراتة',
      'El-Frane'
    ],
    summary:
      'توثق المؤلفة أعمال بعثة المهندس شوازي والجيولوجي ج. رولان (G. Rolland) الذي أثبت ثبات الكثبان الرملية الكبرى ورسم خريطة دقيقة لإقليم وارجلان وسدراتة، ثم تفصّل قصة الحفريات الكبرى التي أجراها مفتش المالية هارولد طاري (Harold Tarry) مطلع عام 1881م في سدراتة بعد أن حذره أهالي وارجلان من الكمين الذي سيقع فيه العقيد فلاترز، فاستخرج طاري فوهة «عين الصفا» وشغّل 80 عاملاً وكشف عن المسجد الرئيسي والمحكمة و9 منازل مقببة وغنية بالزخارف والنقوش الجدارية.',
    verbatimQuote:
      '« Ayant retrouvé sous une dune l’orifice de l’Aïn Sfa, l’ancien puits de Sedrata lui fournit la quantité d’eau nécessaire à un chantier qui n’occupait pas moins de 80 hommes. Il s’installe alors dans une des maisons qu’il a dégagées et la fait recouvrir d’un toit... Une mosquée — la mosquée principale — un palais (probablement une mahakma) et neuf maisons dont il a dressé des plans ont été partiellement dégagés... Et quand Tarry nous dit qu’il a trouvé encore en place "toutes les voûtes de la mosquée supportées par des piliers", que dans d’autres maisons il a trouvé "d’élégantes colonnes soutenant des arcades en plein cintre, des dessins représentant des cavaliers montés à méhari et des fantassins armés de lances, des chameaux, des autruches, un lion, des palmiers et un cavalier targui emmenant un prisonnier", nos regrets n’en deviennent que plus vifs. » — (الترجمة: بعد أن عثر تحت كثيب رملي على فوهة عين الصفا، وفرت له البئر القديمة بسدراتة المياه اللازمة لورشة تنقيب ضمت ما لا يقل عن 80 رجلاً، فاستقر في أحد المنازل التي كشفها وسقفه... وكشف جزئياً عن المسجد الرئيسي وقصر المحكمة وتسعة منازل رسم مخططاتها... وحين يخبرنا طاري أنه وجد جميع عقود المسجد قائمة على دعاماتها، وأنه وجد في منازل أخرى أعمدة أنيقة تحمل أقواساً نصف دائرية ورسوماً تمثل فرساناً على المهاري ومشاة مسلحين بالرماح وجمالاً ونعاماً وأسداً ونخيلاً، فإن أسفنا يزداد لضياعها لاحقاً).',
    details: [
      'إسهام الجيولوجي ج. رولان (G. Rolland) والدكتور فايسبيرغر (1879–1883م) (ص 300–301):',
      '• وضع رولان خريطة دقيقة لإقليم وارجلان وسدراتة بمقياس 1/40,000 وأثبت نظرية «ثبات الكثبان الرملية الكبرى» في الصحراء (تتغير قممها فقط بالرياح بينما تظل مواقعها ثابتة عبر القرون)، وأكدت فان برشم صحة ذلك خلال حفرياتها.',
      '• جمع الدكتور فايسبيرغر (H. Weisgerber) وسط أطلال سدراتة وعند سفح جبل كريمة عدداً كبيراً من شظايا الزجاج الملون القديم، كما وصف المدافن الإباضية القديمة.',
      'قصة حفريات هارولد طاري (Harold Tarry) سنة 1881م (ص 301–305):',
      '• لما وصل طاري طليعةً لبعثة فلاترز إلى وارجلان، حذّره السكان المحليون من المؤامرة التي تُحاك ضد البعثة في الجنوب، فأرسل رسولين لتحذير العقيد فلاترز في الأغواط، ثم فضّل البقاء في سدراتة لإجراء حفريات أثرية وإحياء وادي مية.',
      '• استخرج طاري فوهة «عين الصفا» من تحت الرمال فوفرت الماء لـ 80 عاملاً، واستخرج من أعيان وارجلان ونقوصة مخطوطتين إباضيتين تاريخيتين عُرضت ترجمة إحداهما أمام أكاديمية النقوش والآداب بباريس في 2 يونيو 1882م.',
      '• كشف المسجد الرئيسي (الذي كانت قبابه وعقوده لا تزال قائمة آنذاك قبل أن تنهار لاحقاً)، وقصر «المحكمة»، و9 منازل (تعرفت فان برشم على المسجد والمحكمة و4 منازل منها يقيناً)، كما حدد مواقع 5 مدن مطمورة بين وارجلان ونقوصة منها مدينة «فران (El-Frane)» على بعد 8 كلم شمال نقوصة.',
      '• تنتقد فان برشم قيام طاري بنقل «حمولتي جمل (نحو 300 كيلوغرام)» من منحوتات الجبس السدراتي وتوزيعها بين متاحف الجزائر وقسنطينة ومتحف التروكاديرو بباريس (حيث فُقد أثرها لاحقاً) وترك المباني مكشوفة للعوامل الجوية.'
    ]
  },
  {
    id: 'vb-blanchet-1898-and-art-conclusion',
    bookId: VAN_BERCHEM_META.id,
    bookTitle: VAN_BERCHEM_META.title,
    bookAuthor: VAN_BERCHEM_META.author,
    chapterTitle:
      'حفريات بول بلانشي (1898م) وخاتمة مارغريت فان برشم: أصالة الفن السدراتي ومكانة سدراتة كـ «درة الصحراء»',
    category: 'المساجد والمحاضر',
    pages: 'BIFAO 59, ص 305 - 308',
    spreadImage: '/book-ref/van-berchem/page_308.jpg',
    keywords: [
      'بول بلانشي',
      'Paul Blanchet',
      'حفريات 1898',
      '60 متراً مربعاً',
      'محكمة سدراتة',
      'بوحجر',
      'وادي جدي',
      'الفن السدراتي',
      'الزخرفة الجبسية',
      'الدرة الثمينة',
      'la pierre précieuse',
      'غدامس',
      'طرابلس',
      'تاديوس لوفيكي'
    ],
    summary:
      'تستعرض الباحثة في القسم الأخير حفريات العالم الشاب بول بلانشي (Paul Blanchet) مطلع عام 1898م الذي كشف 13 غرفة من قصر «المحكمة» بسدراتة وعثر على 60 متراً مربعاً من النقوش والزخارف الجبسية السليمة على الجدران، ثم تختم دراستها بخلاصة علمية عميقة تبرهن فيها على أن سدراتة كانت «الدرة الثمينة» في شبكة حواضر إباضية مزدهرة، وأن فنها الجبسي في القرن 11م (5هـ) بلغ درجة مذهلة من الرقي والأصالة المستقلة عن الفن الأغلبي والفاطمي والحمادي.',
    verbatimQuote:
      '« Dans les comptes rendus de l’Académie il est dit que Blanchet a "déjà dégagé 13 pièces du palais signalé par Tarry (la Mahakma) et trouvé intacts sur murailles 60 mètres carrés de sculpture décorative et d’inscriptions, enfin qu’il a déblayé à demi la mosquée, où les voûtes subsistent et remis à jour une maison ornée d’arceaux et de colonnes"... Ce qu’on peut déjà avancer, c’est que Sedrata, qui a joué un rôle si important dans l’histoire religieuse du Maghreb, en était le centre. Elle était, dans cet écrin, la pierre précieuse : ville sainte dont le rayonnement spirituel a été assez fort pour survivre jusqu’à nos jours, mais aussi ville riche, commerçante et active, qui attirait les artistes et encourageait les arts. » — (الترجمة: ورد في محاضر الأكاديمية أن بلانشي كشف بالفعل 13 غرفة من القصر الذي أشار إليه طاري [المحكمة] ووجد على الجدران 60 متراً مربعاً من المنحوتات الزخرفية والنقوش سليمة تماماً، كما أزال الرمال عن نصف المسجد حيث كانت العقود لا تزال قائمة، وكشف منزلاً مزيناً بالأقواس والأعمدة... وما يمكننا الجزم به هو أن سدراتة، التي لعبت دوراً بالغ الأهمية في التاريخ الديني للمغرب، كانت مركز هذا الإقليم؛ فقد كانت في هذا العقد بمثابة الدرة الثمينة: مدينة مقدسة ظل إشعاعها الروحي قوياً حتى يومنا هذا، ومدينة غنية تجارية ونشطة استقطبت الفنانين وشجعت الفنون).',
    details: [
      'نتائج حفريات بول بلانشي (Paul Blanchet) سنة 1898م (ص 305–307):',
      '• بدعم من أكاديمية النقوش والآداب، كشف بلانشي 13 قاعة في قصر «المحكمة» ووجد 60م² من الزخارف الجبسية والكتابات الكوفية سليمة على الجدران، وكشف نصف المسجد ومنزلاً ذا أقواس وأعمدة، لكن وفاته المبكرة في العام التالي (1899م) حالت دون نشر مذكرته التفصيلية.',
      '• نشر بلانشي دراسة جغرافية وسكانية مهمة عن واحة وارجلان وقبائلها (L’oasis et le pays de Ouargla, 1900) ولاحظ كثرة الأطلال بين نقوصة ووارجلان في «بوحجر (Bou Hadjar)» و«فران (Feran)».',
      '• استكشف أيضاً الأطلال الأمازيغية في وادي جدي ووادي إيتل (جنوب بسكرة ووادي ريغ) مثل كاف مكلح وبوغمولة وقصر وادي فوار وهنشير ماجن وستاركرفاه، وأثبت أنها قلاع ومخازن محصنة ومصليات أمازيغية وليست رومانية.',
      'الخاتمة العلمية لمارغريت فان برشم (ص 307–308):',
      '1) سدراتة لم تكن ظاهرة معزولة في الصحراء، بل كانت حاضرة كبرى ضمن شبكة مدن أمازيغية وإباضية مترابطة عبر طرق القوافل بين مصر وغدامس وجبل نفوسة ووادي مية والمغرب الأقصى والسودان.',
      '2) تفرد الفن السدراتي: تتساءل الباحثة بإعجاب كيف استطاعت مدينة تقع على بعد 800 كلم جنوب ساحل البحر المتوسط في النصف الثاني من القرن 11م (5هـ) أن تبتكر فناً معمارياً وجبسياً بهذا الرقي الفائق والشخصية المستقلة التي لا تشبه زخارف الأغالبة والفاطميين في تونس ولا الزخارف الخشنة في قلعة بني حماد أو آشير.',
      '3) تصف سدراتة بأنها «الدرة الثمينة (la pierre précieuse)»: مدينة مقدسة حية في وجدان الإباضية، وحاضرة اقتصادية ثرية جذبت أمهر الصناع والفنانين.'
    ]
  },
  {
    id: 'vb-aerial-plates-ouargla-sedrata-krima',
    bookId: VAN_BERCHEM_META.id,
    bookTitle: VAN_BERCHEM_META.title,
    bookAuthor: VAN_BERCHEM_META.author,
    chapterTitle:
      'اللوحات الجوية التاريخية (Pl. I – Pl. V): صور الطيران لواحة وارجلان، أطلال سدراتة ومخطط المحكمة، قارة كريمة، وجبل العباد',
    category: 'القصر العتيق والعمران',
    pages: 'BIFAO 59, اللوحات Pl. I - Pl. V',
    spreadImage: '/book-ref/van-berchem/plate_05.jpg',
    keywords: [
      'صور جوية',
      'التصوير الجوي',
      'لوحات فان برشم',
      'منظر جوي لوارجلان',
      'صورة جوية لسدراتة',
      'صورة قارة كريمة',
      'صورة جبل العباد',
      'مخطط محكمة سدراتة',
      'أسوار سدراتة',
      'بئر كريمة'
    ],
    summary:
      'تضم الدراسة خمس لوحات تصوير جوي نادرة التقطها الطيران العسكري بطلب من مارغريت فان برشم، وتُعد من أقدم وأدق الوثائق البصرية التي تُظهر النسيج العمراني للقصر العتيق بوارجلان، وتخطيط مدينة سدراتة وقصر المحكمة والأسوار وأبراج الدفاع والبساتين تحت الكثبان، وقمة قارة كريمة بمساكنها وبئرها الوسطى، وسلسلة جبل العباد.',
    verbatimQuote:
      '« Pl. I : Oasis de Ouargla. La ville indigène, au fond le Chott. — Pl. II : Le désert entre les ruines de Sedrata et la Gara Krima au fond. Au premier plan, à gauche, l’enceinte d’un ancien jardin. — Pl. III : La Gara Krima. Au centre, l’ancien puits, le chemin de hâlage et les traces des habitations ibadites. — Pl. IV : Le Djebel Abbad ou "Montagne des adorateurs de Dieu", aux environs de Ouargla. — Pl. V : Les ruines de Sedrata. Au centre le Palais (Mahakma), les remparts avec leurs tours de défense, les rues et les maisons. A l’extérieur de l’enceinte, à droite, les traces des anciens jardins. »',
    details: [
      'اللوحة الأولى (Pl. I — /book-ref/van-berchem/plate_01.jpg): منظر جوي بانورامي لواحة وارجلان يظهر فيه القصر العتيق المستدير محاطاً بخندقه وبساتين النخيل، وفي الخلفية السبخة البيضاء (الشط).',
      'اللوحة الثانية (Pl. II — /book-ref/van-berchem/plate_02.jpg): المجال الصحراوي الفاصل بين أطلال سدراتة (المغطاة بالكثبان الرملية يميناً) وبين هضبة قارة كريمة في الأفق، ويظهر في المقدمة يساراً سور بستان قديم واضح المعالم.',
      'اللوحة الثالثة (Pl. III — /book-ref/van-berchem/plate_03.jpg): لقطة جوية مذهلة لقمة «قارة كريمة» يظهر في وسطها تماماً فوهة البئر الصخرية العميقة وممر سحب الدلاء (chemin de hâlage) وتقاسيم جدران المساكن والتحصينات الإباضية فوق سطح الجبل.',
      'اللوحة الرابعة (Pl. IV — /book-ref/van-berchem/plate_04.jpg): لقطة جوية لسلسلة «جبل العباد» (جبل عباد الله) المكوّنة من ست قور صخرية متصلة ببعضها عبر أعناق رملية ضيقة.',
      'اللوحة الخامسة (Pl. V — /book-ref/van-berchem/plate_05.jpg): صورة جوية عمودية لأطلال مدينة سدراتة تكشف بوضوح في المركز هندسة قصر «المحكمة»، والأسوار المحيطة المدعمة بأبراج دفاعية، وتفرعات الشوارع والمنازل، وإلى اليمين خارج السور تقاسيم البساتين والسواقي القديمة.'
    ]
  },
  {
    id: 'vb-stucco-plates-1952-excavations',
    bookId: VAN_BERCHEM_META.id,
    bookTitle: VAN_BERCHEM_META.title,
    bookAuthor: VAN_BERCHEM_META.author,
    chapterTitle:
      'اللوحات الأثرية (Pl. VI – Pl. VIII): روائع الزخارف والعقود والحنايا الجبسية المنحوتة من حفريات مارغريت فان برشم بسدراتة (1952م)',
    category: 'القصر العتيق والعمران',
    pages: 'BIFAO 59, اللوحات Pl. VI - Pl. VIII',
    spreadImage: '/book-ref/van-berchem/plate_08.jpg',
    keywords: [
      'زخارف سدراتة',
      'الجبس المنحوت',
      'plâtre sculpté',
      'حفريات 1952',
      'إيوان سدراتة',
      'قبة محارية',
      'حنية ركنية',
      'فن سدراتة',
      'متحف الجزائر',
      'نقش سدراتة'
    ],
    summary:
      'توثق اللوحات الثلاث الأخيرة (Pl. VI, VII, VIII) ثلاث قطع فنية نادرة من الجبس المنحوت استخرجتها بعثة مارغريت فان برشم عام 1952م من داخل المنازل الخاصة في سدراتة، وتُبرز الدقة الهندسية والنباتية الفائقة في تزيين الجدران وعقود الأواوين والحنايا الركنية المحارية المطرزة بحبيبات اللؤلؤ.',
    verbatimQuote:
      '« Pl. VI : Fragment de décoration murale en plâtre sculpté provenant d’une habitation privée à Sedrata. Fouilles de M. van Berchem, 1952. — Pl. VII : Fragment de décoration en plâtre sculpté provenant d’une maison privée à Sedrata. Cet arc, placé à l’entrée d’un "iwān", était soutenu par deux colonnettes rondes. Fouilles de M. van Berchem, 1952. — Pl. VIII : Reconstitution partielle d’une des deux niches d’angle placées au-dessus de l’arc et servant de trompes d’angle. Intérieur d’une maison privée, Sedrata. La voûte en forme de coquille est ornée de grosses nervures perlées. Fouilles de M. van Berchem, 1952. »',
    details: [
      'اللوحة السادسة (Pl. VI — /book-ref/van-berchem/plate_06.jpg): جزء من كسوة جدارية بالجبس المنحوت عُثر عليها في مسكن خاص بسدراتة (حفريات فان برشم 1952م)، تتألف من أشرطة عمودية تعلوها أفاريز من المراوح النخيلية (palmettes) وشبكة دقيقة من المعينات الزهرية والدوائر المتشابكة.',
      'اللوحة السابعة (Pl. VII — /book-ref/van-berchem/plate_07.jpg): قوس (عقد) جبسي منحوت من منزل خاص بسدراتة (حفريات 1952م)، كان يتصدر مدخل «إيوان» ويرتكز على عمودين أسطوانيين رشيقين، وتزدان كوّته بدوائر هندسية مشبكة بالوريدات.',
      'اللوحة الثامنة (Pl. VIII — /book-ref/van-berchem/plate_08.jpg): إعادة تركيب جزئية لإحدى الحنيتين الركنيتين (المقرنصات / trompes d’angle) الموضوعتين أعلى القوس داخل منزل خاص بسدراتة (حفريات 1952م)، وتتميز طاقيتها المعقودة على هيئة صدفة بحرية (coquille) مضلعة بعروق بارزة مرصعة بحبيبات شبيهة باللؤلؤ (nervures perlées) وإطار من اللفائف الحلزونية المتتابعة.'
    ]
  }
];
