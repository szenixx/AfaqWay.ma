/* Moroccan Darija for the onboarding, in Arabic script.

   Keyed by the ENGLISH SOURCE STRING rather than by an invented key. Two
   reasons, and both matter here:

   1. The copy is built in journey.ts and the country flows as plain strings,
      long before any component sees it. Threading keys through all of that
      would have meant rewriting the flow; looking up the string at render time
      does not.
   2. Anything deliberately left in English by the translation review — country
      and programme names, test names, the plan names, `Compare plans`, the
      WhatsApp opener — is simply absent from this map and falls through
      untouched. Not translating is the default, which is the safe direction.

   Source: the reviewed Darija document, transcribed from the file itself so the
   Arabic is the approved text and not a re-typing of it. */

export type OnbLang = "en" | "ar";

const DARIJA: Record<string, string> = {
  /* Supplied by the product owner. 2,800 € is the floor and 4,500 € the
     average — the previous line read as though 4,500 € were the starting
     price, which is the thing being corrected. Both figures keep Western
     numerals and the € sign. */
  "In euros per year. Programmes start from around 2,800 €, with an average of around 4,500 €.":
    "باليورو فالسنة. البرامج كيبداو تقريباً من 2,800 €، والمتوسط تقريباً هو 4,500 €.",
  /* Supplied directly and approved by the product owner, so these sit with the
     reviewed text rather than in the pending block. */
  "How do you identify?": "شنو هو جنس ديالك ؟",
  "It sets your profile picture and how your advisor addresses you.":
    "هادشي كيحدد الصورة ديال البروفايل ديالك وكيفاش غادي يخاطبك المستشار ديالك.",
  "Male": "ذكر",
  "Female": "أنثى",
  "Prefer not to say": "ما بغيتش نحدد",
  "Please pick one.": "عافاك اختار واحد.",
  "Complete your payment": "كمّل الأداء ديالك",
  "Important:": "مهم:",
  /* Not separate entries in the review: this is the exact span the reviewer
     wrote INSIDE the plan notice, pulled out so the sentence can keep its link
     without being reassembled from fragments. Verified as a substring of both
     the desktop and the mobile notice. */
  "what each plan includes": "شنو كتشمل كل خطة",
  "24/7 support access": "دعم متاح 24/7",
  "A calendar carrying every deadline, appointment and intake date": "تقويم فيه جميع المواعيد النهائية والمواعيد وتواريخ الدخول",
  "A calendar with every deadline and intake": "تقويم فيه جميع المواعيد النهائية وتواريخ الدخول",
  "A dedicated admin manages your entire application file": "مسؤول مخصص كيتكلف بالملف كامل ديال التقديم ديالك",
  "A dedicated admin runs your whole file": "مسؤول مخصص كيتكلف بالملف كامل ديالك",
  "A downloadable invoice for every payment": "فاتورة قابلة للتحميل لكل عملية أداء",
  "A downloadable invoice for every payment you make": "فاتورة قابلة للتحميل لكل عملية أداء كتديرها",
  "A personalized 6-stage roadmap with step-by-step checklists": "خارطة طريق مخصصة من 6 مراحل مع لوائح مهام خطوة بخطوة",
  "A personalized 6-stage roadmap with step-by-step checklists you tick off yourself": "خارطة طريق مخصصة من 6 مراحل مع لوائح مهام كتأشر عليها بنفسك خطوة بخطوة",
  "Advisor support": "مواكبة المستشار",
  "Age rules differ per programme and per visa step, so we check them for you.": "شروط السن كتختلف حسب كل برنامج وكل مرحلة ديال الفيزا، وداكشي علاش كنتأكدو منها ليك.",
  "Automatic reminders before every deadline and appointment": "تذكيرات أوتوماتيكية قبل كل موعد نهائي وكل موعد",
  "Available now": "متاح دابا",
  "Choose a test": "اختار الامتحان",
  "Choose {planName}": "اختار {planName}",
  "Coming soon": "قريباً",
  "Continue with {planName}": "كمل مع {planName}",
  "Country dialling code": "رمز الاتصال ديال الدولة",
  "Dedicated service and support after you arrive in your study country": "خدمة ودعم مخصصين من بعد ما توصل لبلد الدراسة ديالك",
  "Do you already have an English test?": "واش عندك ديجا شي امتحان ديال الإنجليزية؟",
  "Document requests and updates by chat": "طلبات الوثائق والتحديثات عبر الشات",
  "Document requests and updates sent to you by chat": "طلبات الوثائق والتحديثات كيوصلوك عبر الشات",
  "Enter a Moroccan mobile: 06/07 and ten digits, or 6/7 and nine.": "دخل رقم هاتف مغربي: 06/07 مع 10 أرقام، أو 6/7 مع 9 أرقام.",
  "Enter a valid WhatsApp number.": "دخل رقم واتساب صحيح.",
  "Enter my dashboard": "دخل للداشبورد ديالي",
  "Everything in Self Service, done for you": "كلشي اللي كاين فـ Self Service، حنا كنتكلفو به بلاصتك",
  "Exactly as it is written in your passport, it goes on every document we prepare.": "خاصو يكون بالضبط كيف مكتوب فالباسبور ديالك، حيث غادي يتكتب فكل الوثائق اللي غادي نوجدو ليك.",
  "Fees and English requirements kept current": "معلومات محدثة ديماً حول الرسوم ومتطلبات اللغة الإنجليزية",
  "Fees and requirements kept current for you": "الرسوم والمتطلبات ديالك كيبقاو محدثين ديماً",
  "Field of interest": "المجال اللي كتهتم به",
  "First name": "الاسم الشخصي",
  "For students who drive it themselves.": "للطلاب اللي بغاو يسيرو كلشي بوحدهم.",
  "Free consultation about the plans": "استشارة مجانية على الخطط",
  "Free program-matching before you pay": "مساعدة مجانية باش نلقاو ليك البرنامج المناسب قبل ما تخلص",
  "Free program-matching guidance before you pay for anything": "توجيه مجاني باش نلقاو ليك البرنامج المناسب قبل ما تخلص أي حاجة",
  "Full interview preparation coaching for university and migration interviews": "تحضير ومواكبة كاملة لمقابلات الجامعة والهجرة",
  "Full visibility into document status: Under review, Needs changes, or Approved": "رؤية واضحة وكاملة لحالة كل وثيقة: قيد المراجعة، خاصها تعديلات، أو مقبولة",
  "Help me choose": "عاونّي نختار",
  "How much help do you want?": "أشمن خدمة بغيتي نوفر ليك؟",
  "How well do you speak English?": "شنو هو المستوى ديالك فالإنجليزية فالهضرة؟",
  "Human document review on every upload, a real reviewer, not a robot (avg 48h)": "مراجعة بشرية لكل وثيقة كترفعها، من طرف شخص حقيقي ماشي روبوت (في المتوسط 48 ساعة)",
  "Human document review, average 48 hours": "مراجعة بشرية للوثائق، في المتوسط 48 ساعة",
  "Human review on every document": "مراجعة بشرية لكل وثيقة",
  "I have read and agree to the Refund Policy.": "قريت ووافقت على سياسة استرجاع المبلغ.",
  "I have read and agree to the Terms of Service.": "قريت ووافقت على شروط الخدمة.",
  "I have read the Refund Policy.": "قريت سياسة استرجاع المبلغ.",
  "I'll choose myself": "غادي نختار بوحدي",
  "Important": "مهم:",
  "Included, end to end": "مشمولة من البداية حتى النهاية",
  "Interview preparation coaching": "مساعدة وتحضير لمقابلاتك",
  "It decides which consulate and appointment centre your file goes through.": "هادشي كيحدد القنصلية ومركز المواعيد اللي غادي يدوز منّو الملف ديالك.",
  "Last name": "النسب",
  "Learning resources on every step": "موارد تعليمية فكل مرحلة",
  "Learning resources on every step: links, PDFs, videos, and plain-language explanations": "موارد تعليمية فكل مرحلة: روابط، ملفات PDF، فيديوهات، وشروحات مبسطة",
  "Live document status on every upload": "تتبع مباشر لحالة كل وثيقة كترفعها",
  "Live tracker of your application": "تتبع مباشر لملف التقديم ديالك",
  "Live tracker showing exactly where your application stands": "تتبع مباشر كيبين بالضبط فين وصل ملف التقديم ديالك",
  "Max tuition budget": "أقصى ميزانية للرسوم الدراسية",
  "Most popular": "الأكثر شعبية",
  "On request, you drive it": "حسب الطلب، وانت كتسيرها بوحدك",
  "One inbox for every update on your file": "صندوق واحد لجميع التحديثات على الملف ديالك",
  "One inbox for every update on your file, so nothing arrives only by email": "صندوق واحد لجميع التحديثات على الملف ديالك، باش ما يبقاش شي تحديث كيوصلك غير بالإيميل",
  "One programme, the one we build your whole file around. You can ask your advisor to change it later.": "برنامج واحد، وهو اللي غادي نبنيو عليه الملف كامل ديالك. وتقدر تطلب من المستشار ديالك تبدلو من بعد.",
  "Out of 20. You need at least 10 to apply.": "على 20. خاصك تجيب على الأقل 10 باش تقدر تقدم.",
  "Personalized 6-stage roadmap": "خارطة طريق مخصصة من 6 مراحل",
  "Pick a plan to continue": "اختار خطة باش تكمل",
  "Pick the level of hand-holding that fits you, then complete your payment.": "اختار مستوى المساعدة اللي مناسب ليك، ومن بعد كمل عملية الأداء.",
  "Pick up to 2. We rank real programmes against them.": "اختار حتى لجوج. وغادي نرتبو ليك البرامج المناسبة حسب الاختيارات ديالك.",
  "Pick your programme": "اختار البرنامج ديالك",
  "Please accept both before entering your dashboard.": "عافاك وافق على بجوج قبل ما تدخل للداشبورد ديالك.",
  "Please accept both before we start your file.": "عافاك وافق على بجوج قبل ما نبداو الملف ديالك.",
  "Please choose an available destination.": "عافاك اختار وجهة متاحة.",
  "Please enter both your first and last name.": "عافاك دخل الاسم الشخصي والنسب ديالك.",
  "Please enter your city.": "عافاك دخل المدينة اللي ساكن فيها.",
  "Please read what each plan includes before you choose, and our Refund Policy before you pay.": "عافاك قرا شنو كتشمل كل خطة قبل ما تختار، وقرا سياسة استرجاع المبلغ قبل ما تخلص.",
  "Post-arrival checklist once your permit lands": "لائحة المهام من بعد الوصول ملي تحصل على تصريح الإقامة",
  "Post-arrival support checklist after your residence permit is approved": "لائحة دعم ما بعد الوصول من بعد ما تتم الموافقة على تصريح الإقامة ديالك",
  "Pricing & Checkout": "الثمن والأداء",
  "Priority human review and hands-on guidance from start to settled": "مراجعة بشرية بأولوية ومواكبة مباشرة من البداية حتى تستقر",
  "Priority review, from start to settled": "مراجعة بأولوية، من البداية حتى تستقر",
  "Ranked against your answers": "مرتبة حسب الأجوبة ديالك",
  "Read": "قرا",
  "Read all {n} features": "قرا جميع المميزات ({n})",
  "Read what each plan includes before you choose, and our Refund Policy before you pay.": "قرا شنو كتشمل كل خطة قبل ما تختار، وقرا سياسة استرجاع المبلغ قبل ما تخلص.",
  "Refund Policy": "سياسة استرجاع المبلغ",
  "Reminders before every deadline": "تذكيرات قبل كل موعد نهائي",
  "Review everything below. Once you click Done, we generate your personalized roadmap.": "راجع كلشي لتحت. ملي تضغط على \"Done\"، غادي نوجدو ليك خارطة الطريق الخاصة بيك.",
  "Search programmes or universities": "قلب على البرامج أو الجامعات",
  "Search the full catalogue": "قلب فالكاطالوغ كامل",
  "Service and support after you arrive": "خدمة ودعم من بعد ما توصل",
  "Study goal": "الهدف من القراية",
  "Switch anyway": "بدلها على أي حال",
  "Switch destination?": "تبدل الوجهة؟",
  "Tell us what you're looking for, and we'll match you to real Lithuanian programs from our database.": "قول لينا شنو كتقلب عليه، وغادي نلقاو ليك برامج حقيقية فليتوانيا من قاعدة البيانات ديالنا.",
  "Test name": "اسم الامتحان",
  "The lowest tuition we can match you to is 2,800 € per year.": "أقل رسوم دراسية نقدروا نلقاو ليك هي 2,800 € فالسنة.",
  "The platform drives every step for you, not just guides it": "المنصة كتتكلف بكل مرحلة بلاصتك، ماشي غير كتوجهك",
  "The platform drives every step, not just guides it": "المنصة كتتكلف بكل مرحلة، ماشي غير كتوجهك",
  "The steps that are genuinely yours to call, you mark done yourself": "المراحل اللي خاصك أنت تديرها، كتأشر عليها بنفسك ملي تكملها",
  "The subject written on your diploma.": "التخصص اللي مكتوب فالدبلوم ديالك.",
  "This one answer decides your programmes, your paperwork and the whole plan we build.": "هاد الجواب كيحدد البرامج ديالك، الوثائق ديالك، والخطة كاملة اللي غادي نوجدو ليك.",
  "To be chosen with your advisor": "غادي تختارو مع المستشار ديالك",
  "Two ways to do this: drive it yourself, or hand the paperwork to an advisor. You can change plan later.": "عندك جوج طرق: تسير كلشي بوحدك، ولا تخلي المستشار يتكلف بالوثائق ديالك. وتقدر تبدل الخطة من بعد.",
  "We handle it, you just track it.": "حنا كنتكلفو بكلشي، وانت غير تتبع التقدم ديالك.",
  "What did you study?": "شنو قريتي؟",
  "What do you want to study abroad?": "شنو بغيتي تقرا فالخارج؟",
  "What is your WhatsApp number?": "شنو هو رقم الواتساب ديالك؟",
  "What is your full name?": "شنو هو الاسم الكامل ديالك؟",
  "What is your last degree?": "شنو هو آخر دبلوم حصلتي عليه؟",
  "What is your yearly tuition budget?": "شحال هي الميزانية السنوية ديالك للرسوم الدراسية؟",
  "What score did you get?": "شحال جبتي فالنقطة؟",
  "What was your final grade?": "شحال جبتي فالنقطة النهائية؟",
  "What you're looking for": "شنو كتقلب عليه",
  "WhatsApp number": "رقم الواتساب",
  "When do you want to start?": "فاش بغيتي تبدا؟",
  "When were you born?": "فاش تزادّيتي؟",
  "Where do you want to study?": "فين بغيتي تقرا؟",
  "Which city do you live in?": "فأي مدينة ساكن؟",
  "Which fields interest you?": "شنو هي المجالات اللي كتهمك؟",
  "Which test did you take?": "شنو هو الامتحان اللي دوزتي؟",
  "Which test is it?": "شنو هو هاد الامتحان؟",
  "Which year did you finish it?": "إمتى كملتيه؟",
  "You mark your own steps done": "كتأشر بنفسك على المراحل اللي كملتي",
  "You need to be over 16 to apply. Check the date you entered.": "خاصك تكون فوق 16 عام باش تقدر تقدم. عافاك تأكد من تاريخ الازدياد اللي دخلتي.",
  "Your AfaqWay plan is ready.": "الخطة ديال AfaqWay ديالك واجدة.",
  "Your advisor reaches you here. We never share it with anyone.": "المستشار ديالك غادي يتواصل معاك هنا. عمرنا نشاركو رقمك مع حتى واحد.",
  "Your program preferences": "التفضيلات ديال البرنامج ديالك",
  "Your programme's fees, deadlines and English requirements kept current for you": "رسوم البرنامج ديالك، المواعيد النهائية ومتطلبات الإنجليزية كيبقاو محدثين ديماً",
  "Your roadmap is ready": "خارطة الطريق ديالك واجدة",
  "Your studies and timing": "قرايتك والتوقيت ديالك",
  "e.g. Casablanca": "مثلاً: الدار البيضاء",
  "e.g. PTE Academic": "مثلاً: PTE Academic",
};

/* ── Outside the reviewed document ──────────────────────────────────────
   The review covers the twenty question screens. It does not cover the chrome
   that sits around them on every one of those screens — the primary button,
   the log-out dialog, the save indicator, the recap labels — and leaving that
   in English would have put an English button under a Darija question on every
   single screen.

   These follow the reviewer's own register and vocabulary rather than
   inventing one: `كمل` is the verb the review itself uses for Continue in
   `كمل مع {planName}`, and the rest keeps the same second-person address
   (`ديالك`, `عافاك`) used throughout the approved text.

   FLAGGED FOR REVIEW: these are the strings to check and correct. Anything
   moved into DARIJA above becomes approved text. */
const PENDING_REVIEW: Record<string, string> = {
  // The primary action, on every screen.
  "Continue": "كمل",

  /* The between-stage transitions are deliberately ABSENT from both maps.
     They stay English, and `t()` returning its argument unchanged is what
     keeps them that way. Do not add them. */

  // The score subtitle, which the review did not reach.
  "Numbers only, exactly as it appears on your certificate.":
    "غير الأرقام، بالضبط كيف كاينة فالشهادة ديالك.",
  "Set up your program profile": "وجّد البروفيل ديال البرنامج ديالك",

  // The full plan-comparison sheet.
  "Plan features": "مميزات الخطط",
  "Language": "اللغة",
  "Your plans, compared in full": "الخطط ديالك، مقارنة كاملة",
  "Everything each plan includes.": "كلشي اللي كتشمل كل خطة.",
  "Done": "تم",

  "Transfer the amount, then upload the receipt. We verify it by hand.":
    "صيفط المبلغ، ومن بعد رفع الوصل. كنتحققو منو بيدينا.",

  // The payment step. Bank names, RIB, the beneficiary and the amounts are
  // identity and account data: they never pass through the translator.
  "Payment ID": "رقم الأداء",
  "Recommended": "منصوح بيه",
  "Back to the plans": "رجع للخطط",
  "Back to payment methods": "رجع لطرق الأداء",
  "Payment under review": "الأداء فطور المراجعة",
  "Under review": "فطور المراجعة",
  "Verifying your payment, usually a few hours. Safe to close this page, we'll save your place.":
    "كنتأكدو من الأداء ديالك، عادة كتاخد شي سوايع. تقدر تسد هاد الصفحة، غادي نحتافظو بالبلاصة ديالك.",
  "Chat with support": "هضر مع الدعم",
  "Cancel this payment": "لغي هاد الأداء",
  "Cancel this payment?": "تلغي هاد الأداء؟",
  "We won't process your invoice, and you'll have to submit your receipt again.":
    "ما غاديش نعالجو الفاتورة ديالك، وغادي تخصك تعاود تصيفط الوصل ديالك.",
  "Keep waiting": "بقا تسنى",
  "Yes, cancel": "أيه، لغي",
  "Your payment was rejected": "الأداء ديالك تّرفض",
  "Please upload a valid receipt and submit again, or contact support.":
    "عافاك رفع وصل صحيح وعاود صيفط، ولا تواصل مع الدعم.",
  "Invoice details": "تفاصيل الفاتورة",
  "Invoice receipt": "وصل الأداء",
  "Note": "ملاحظة",
  "Amount": "المبلغ",
  "Full name": "الاسم الكامل",
  "Upload the receipt / reçu here": "رفع الوصل / le reçu هنا",
  "Do not send fake or edited receipts, they will be rejected.":
    "ما تصيفطش وصولات مزورة ولا معدلة، غادي يتّرفضو.",
  "Your receipt must clearly show the transaction number.":
    "الوصل ديالك خاصو يبين رقم المعاملة بوضوح.",
  "Image or PDF, maximum 4 MB.": "صورة ولا PDF، ماكس 4 MB.",
  "Submitting…": "كيتصيفط…",
  "Submit for review": "صيفط للمراجعة",

  // The score-range notes under the English-test field, and the eligibility
  // note on the degree field. Every RANGE keeps its Western digits and every
  // TEST NAME keeps its Latin spelling; only the sentence around them moves.
  "IELTS bands run 0 to 9, in half steps.": "نقط IELTS كتمشي من 0 حتى 9، بنص نقطة.",
  "TOEFL runs 1 to 6 in half points. A 0 to 120 total is still accepted.":
    "TOEFL كيمشي من 1 حتى 6 بنص نقطة. المجموع من 0 حتى 120 مازال مقبول.",
  "On the Cambridge English Scale, 80 to 230 depending on the exam.":
    "على Cambridge English Scale، من 80 حتى 230 حسب الامتحان.",
  "Duolingo scores run 10 to 160, in steps of 5.": "نقط Duolingo كتمشي من 10 حتى 160، بخطوة ديال 5.",
  "English Test Core runs 0 to 599.": "English Test Core كيمشي من 0 حتى 599.",
  "Master's requires a completed Bachelor's degree.": "الماستر كيتطلب إجازة مكملة.",

  // Prose hints and select placeholders. The numeric specs beside them
  // ("min 10 / 20", "€ per year, min 2800", "recommended 4500+ €") are left in
  // English on purpose: they are ranges, not sentences.
  "numbers only": "غير الأرقام",
  "pick up to 2": "اختار حتى 2",
  "Choose a level": "اختار مستوى",
  "Select an intake": "اختار الدخول",
  "Select year": "اختار العام",
  "e.g. Economics": "مثلاً: Economics",
  "your test score": "النقطة ديالك",

  "Loading your profile…": "كنحملو البروفيل ديالك…",

  // Input hints and placeholders. Every numeral, currency symbol and score
  // range inside them stays exactly as it is: those are values, not words.
  "min 10 / 20": "الأقل 10 / 20",
  "€ per year, min 2800": "€ فالعام، الأقل 2800",
  "recommended 4500+ €": "منصوح بيه 4500+ €",
  "Select": "اختار",

  // The progress bar's group names.
  "You": "نتا",
  "Pricing": "الثمن",
  "Roadmap": "خارطة الطريق",

  // Progress and saving.
  "Setup progress": "تقدم الإعداد",
  "Saving…": "كيتسجل…",
  "Couldn’t save, retrying": "ما تسجلش، كنعاودو",
  "Opening your dashboard": "كنحلو الداشبورد ديالك",

  // Header controls.
  "About this question": "على هاد السؤال",
  "Back to the previous question": "رجع للسؤال اللي قبل",
  "Your answers save as you go, and you can change any of them later with your advisor.":
    "الأجوبة ديالك كتتسجل ملي كتكتبها، وتقدر تبدل أي واحد فيهم من بعد مع المستشار ديالك.",

  // Log-out dialog.
  "Log out": "خرج",
  "Log out?": "خرج؟",
  "Stay here": "بقا هنا",
  "Every answer so far is saved. Sign back in and you will land on this exact question.":
    "كل جواب عطيتي تسجل. دخل مرة أخرى وغادي تلقى راسك فنفس هاد السؤال.",

  // Switching destination.
  "Switching to {next} clears the {current} answers you have given so far.":
    "إلا بدلتي لـ {next}، غادي يتمسحو الأجوبة ديال {current} اللي عطيتي حتى دابا.",
  "Cancel": "إلغاء",

  // Programme step. The list itself — names, universities, fields, fees, match
  // percentages — is protected by the review and never passes through here.
  "Search programmes": "قلب على البرامج",
  "Search by name, field or university": "قلب بالاسم، المجال أو الجامعة",
  "How do you want to pick?": "كيفاش بغيتي تختار؟",
  "Programme": "البرنامج",
  "Nothing matches that. Try a shorter word, or clear the search.":
    "ماكاين حتى نتيجة. جرب كلمة قصيرة، ولا مسح البحث.",
  "Fill in your field of interest and budget to see these ranked for you.":
    "عمّر المجال اللي كيهمك والميزانية ديالك باش نرتبوهم ليك.",

  // Programme detail sheet. The facts inside it are protected programme data
  // and never reach the translator; only its own controls do.
  "Close": "سد",
  "Got it": "فهمت",
  "Where you fall short today": "فين ناقص ليك دابا",

  // Recap labels the review did not list.
  "Destination": "الوجهة",
  "Start": "البداية",
  "Service": "الخدمة",
  "Student": "الطالب",
  "{name}, this is what we build from here, under student number {ref}.":
    "{name}، هادشي هو اللي غادي نبنيو منو، تحت رقم الطالب {ref}.",
  "{name}, this is what we build from here.":
    "{name}، هادشي هو اللي غادي نبنيو منو.",
};

/* The English is returned whenever there is no approved Darija for it, so a
   string added to the product after this review still renders, in English,
   instead of disappearing or showing a key. */
export function t(lang: OnbLang, s: string | undefined | null): string {
  if (!s) return s ?? "";
  return lang === "ar" ? (DARIJA[s] ?? PENDING_REVIEW[s] ?? s) : s;
}

/** Approved strings, and the ones still waiting on a review pass. */
export const DARIJA_COUNT = Object.keys(DARIJA).length;
export const PENDING_COUNT = Object.keys(PENDING_REVIEW).length;
