/* Explore Lithuania — the guide's content.
   Written from official and community sources (listed in SOURCES below) and
   summarised, never copied. Prices are typical 2025/26 student ranges and are
   deliberately given as ranges: always confirm the current figure on the
   official page linked in the Sources section. */

export type Stat = { label: string; value: string; icon: string };
export type Item = { title: string; body: string };
export type Callout = { tone: "blue" | "amber" | "green" | "red"; title: string; body: string };

/* The seven supplied photographs, each used exactly once. */
export const PHOTOS = {
  hero: "/lithuania/lithuania-7.webp",
  universities: "/lithuania/lithuania-1.webp",
  cities: "/lithuania/lithuania-2.webp",
  housing: "/lithuania/lithuania-3.webp",
  transport: "/lithuania/lithuania-4.webp",
  studentLife: "/lithuania/lithuania-5.webp",
  tips: "/lithuania/lithuania-6.webp",
} as const;

export const HERO_STATS: Stat[] = [
  { label: "Capital", value: "Vilnius", icon: "capital" },
  { label: "Population", value: "≈ 2.9 million", icon: "population" },
  { label: "Currency", value: "Euro (€)", icon: "currency" },
  { label: "Time zone", value: "EET (UTC+2 / +3)", icon: "time" },
  { label: "Official language", value: "Lithuanian", icon: "language" },
  { label: "EU / Schengen", value: "Member of both", icon: "eu" },
  { label: "Climate", value: "−5 °C winter, 22 °C summer", icon: "climate" },
  { label: "Student budget", value: "€600–900 / month", icon: "budget" },
];

/* ── 1. Universities ──────────────────────────────────────────────────────── */

export const UNI_INTRO: Item[] = [
  { title: "How the system works", body: "Lithuanian higher education splits into universities (universitetas), which award Bachelor, Master and PhD degrees, and colleges (kolegija), which award professional Bachelor degrees with a strong practical focus. A Bachelor takes 3–4 years, a Master 1.5–2 years. All accredited degrees follow the Bologna system, use ECTS credits and are recognised across the EU." },
  { title: "Public vs private", body: "Most large institutions are public and state-funded, with lower tuition and bigger research budgets. Private universities are smaller, often more business or IT focused, and usually more flexible about intake dates. Both are supervised by the Ministry of Education, Science and Sport, and only accredited programmes appear in the official registry." },
  { title: "Degree recognition", body: "Foreign qualifications are assessed by SKVC, the Centre for Quality Assessment in Higher Education. Most universities submit the request on your behalf during admission. Allow several weeks and keep legalised or apostilled copies of your diploma and transcripts." },
  { title: "English-taught programmes", body: "There are several hundred degree programmes taught fully in English, concentrated in IT, engineering, business, economics, medicine and life sciences. Typical entry requirement is IELTS 6.0 / TOEFL iBT 75–80, or an accepted school certificate showing English as the language of instruction. Many universities also run their own online English test." },
  { title: "Tuition expectations", body: "Bachelor programmes usually run €2,000–€6,000 per year, Master programmes €3,000–€7,000. Medicine and dentistry are the exception at roughly €10,000–€15,000 per year. Colleges sit at the lower end. Fees are normally paid per semester or per year in advance." },
  { title: "Application periods", body: "The main intake is September, with applications typically opening in winter and closing between April and July depending on the university. A smaller February intake exists at several institutions. Apply early: the residence permit process afterwards needs months, not weeks." },
  { title: "Admission process", body: "Apply directly to the university or through its online portal, upload your diploma, transcripts, passport copy and English certificate, sit any entrance interview or test, then receive a conditional or unconditional offer. After paying the first instalment you get the documents needed for the national visa and residence permit." },
  { title: "Scholarships", body: "The main state route is the Education Exchange Support Foundation, which funds state scholarships and Lithuanian language courses for selected nationalities. Universities also run their own partial tuition discounts based on grades, and Erasmus+ covers exchange semesters. Full scholarships are competitive and rare, so plan a funded budget." },
  { title: "Exchange opportunities", body: "Every major university participates in Erasmus+, so you can spend a semester elsewhere in Europe while enrolled in Lithuania. There are also bilateral agreements with universities in Asia and the Americas, and Erasmus+ traineeships for internships abroad." },
];


/* ── 2. Cities ────────────────────────────────────────────────────────────── */

export type City = {
  key: string; name: string; tag: string; overview: string; atmosphere: string; costs: string;
  safety: string; nightlife: string; transport: string; neighbourhoods: string; nearby: string;
};
export const CITIES: City[] = [
  {
    key: "vilnius", name: "Vilnius", tag: "Capital · ≈ 600k people",
    overview: "The capital and the largest student city, with a baroque UNESCO old town, a growing fintech and IT sector, and the widest range of English-taught degrees.",
    atmosphere: "The most international crowd in the country. Erasmus and degree students mix in the old town, Užupis and the campuses spread across the centre.",
    costs: "The most expensive city, but still cheap by EU standards: expect €700–1,000 per month all-in as a student.",
    safety: "Very safe by European standards, including at night in the centre. Normal city caution around the bus station area late at night.",
    nightlife: "The densest scene: cocktail bars in the old town, clubs near Vokiečių street, craft beer, and student nights run by university clubs.",
    transport: "Buses and trolleybuses run by Judu, one flat network, plus e-scooters everywhere and a compact walkable centre.",
    neighbourhoods: "Students cluster in Naujamiestis, Žvėrynas, Šnipiškės and Antakalnis. Old town rents are highest, Fabijoniškės and Pilaitė are cheapest.",
    nearby: "Trakai castle (30 min), Europos Parkas, Kernavė, and Vilnius airport 6 km from the centre.",
  },
  {
    key: "kaunas", name: "Kaunas", tag: "Second city · ≈ 300k people",
    overview: "The interwar capital and the country's student heartland, home to KTU, VMU and LSMU, and a 2022 European Capital of Culture.",
    atmosphere: "The highest student-to-resident ratio in Lithuania. Compact, young and full of modernist architecture, cafés and university events.",
    costs: "Noticeably cheaper than Vilnius: €550–850 per month is realistic, with dorms among the cheapest in the country.",
    safety: "Safe and easy to navigate. Central districts are well lit and busy into the evening.",
    nightlife: "Concentrated on Laisvės alėja and Vilniaus street, with student bars, live music and cheaper drinks than the capital.",
    transport: "Buses and trolleybuses, plus the only funiculars in the country, and a very walkable centre along the pedestrian avenue.",
    neighbourhoods: "Centras and Žaliakalnis for atmosphere, Šilainiai and Dainava for the cheapest rents, Old Town for a short walk to VMU.",
    nearby: "Pažaislis monastery, Kaunas reservoir, Rumšiškės open-air museum, and Kaunas airport with low-cost flights.",
  },
  {
    key: "klaipeda", name: "Klaipėda", tag: "Port city · ≈ 150k people",
    overview: "Lithuania's only seaport, with German-influenced old-town architecture and direct access to the Curonian Spit.",
    atmosphere: "Smaller and calmer, with a maritime identity. Popular with students in marine sciences, logistics and engineering.",
    costs: "Cheaper than the two big cities: roughly €500–800 per month, though summer rents near the coast rise.",
    safety: "Quiet and safe, with the usual care near the port and at night.",
    nightlife: "Modest but lively in summer, when Klaipėda fills with visitors and the Sea Festival takes over the city.",
    transport: "City buses, a very walkable old town, and the ferry to Smiltynė on the Curonian Spit.",
    neighbourhoods: "Old Town and Centras for the atmosphere, Debrecenas and Rumpiškė for cheaper student rents.",
    nearby: "Curonian Spit and Nida, Palanga beach resort and Palanga airport, Dutchman's Cap cliffs.",
  },
  {
    key: "siauliai", name: "Šiauliai", tag: "Northern hub · ≈ 100k people",
    overview: "A northern industrial and aviation city, best known internationally for the Hill of Crosses.",
    atmosphere: "Small, quiet and inexpensive, with a tight-knit student community and short distances everywhere.",
    costs: "Among the cheapest options in the country, commonly €450–700 per month including rent.",
    safety: "Calm, low crime and easy to get around on foot or by bike.",
    nightlife: "Limited but friendly: a handful of bars and student events rather than a club scene.",
    transport: "City buses and cycling, with regular trains and coaches to Vilnius, Kaunas and Riga.",
    neighbourhoods: "Centras for convenience, Lieporiai and Dainai for the lowest rents.",
    nearby: "The Hill of Crosses, Kurtuvėnai regional park, and the Latvian border an hour away.",
  },
  {
    key: "panevezys", name: "Panevėžys", tag: "Fifth city · ≈ 85k people",
    overview: "A manufacturing and logistics centre in the north, sitting on the main highway between Vilnius and Riga.",
    atmosphere: "The most local of the student cities, with a small international community and strong industry placements.",
    costs: "The cheapest of the five, frequently €430–650 per month all-in.",
    safety: "Very safe, small-town feel with short commutes.",
    nightlife: "Low-key: cafés, a theatre with a national reputation and occasional festivals.",
    transport: "City buses and cycling, with fast coach links to Vilnius (about 1h40) and Riga.",
    neighbourhoods: "Centras and Klaipėdos street area for student housing.",
    nearby: "Bistrampolis manor, Krekenava regional park, and the Latvian border.",
  },
];

/* ── 3. Housing ───────────────────────────────────────────────────────────── */

export const HOUSING: Item[] = [
  { title: "University dormitories", body: "The cheapest and simplest option, usually €90–200 per month for a shared room including utilities. Apply through the university as soon as you accept your offer, because places are limited and allocated by date. Rooms are typically shared by two or three students with a communal kitchen and bathroom per block." },
  { title: "Private apartments", body: "A one-room flat costs roughly €350–550 per month in Vilnius, €280–450 in Kaunas and less in smaller cities, plus utilities. Furnished flats are the norm. Expect the landlord to ask for a one-month deposit and a signed contract." },
  { title: "Shared apartments", body: "Renting a room in a shared flat is the usual middle path: €200–350 per month in Vilnius and €150–280 elsewhere. It is also the fastest way to build a social circle in your first months." },
  { title: "Private student residences", body: "Purpose-built residences exist in Vilnius and Kaunas with private or twin rooms, gyms and study rooms, usually €300–500 per month. More expensive than dorms, cheaper and simpler than a private flat with bills." },
  { title: "The rental process", body: "View the flat (or ask for a live video tour), agree the price, sign a written contract, pay the deposit and the first month, and register your address for the residence permit. Never pay anything before you have seen the flat and the contract." },
  { title: "Lease contracts", body: "Contracts are usually 6 or 12 months, in Lithuanian, sometimes with an English translation. Check the notice period, who pays which utilities, whether the deposit is returnable, and that the landlord's name matches the property registry extract." },
  { title: "Deposits", body: "One month's rent is standard, occasionally two. Photograph the flat's condition on the day you move in and keep the photos: it is the simplest way to get the deposit back at the end." },
  { title: "Utility bills", body: "Heating, water, electricity, waste and building maintenance typically add €80–150 per month in winter and €40–80 in summer. Central heating in older blocks is the big winter variable, so ask for last January's bill before signing." },
  { title: "Where students search", body: "Aruodas.lt and Skelbiu.lt are the main listing sites, plus Facebook groups for each city, university housing offices and the ESN sections. Nuomininkas and Domoplius are also used." },
];

export const HOUSING_SCAMS: Callout[] = [
  { tone: "red", title: "Never pay before you see the property", body: "The most common scam is an attractive flat listed below market price, with a landlord who is 'abroad' and asks for a deposit by transfer before any viewing. If you cannot visit, ask a university buddy or ESN volunteer to view it for you." },
  { tone: "amber", title: "Check who actually owns the flat", body: "Ask for the owner's ID and the registry extract (Registrų centras). If the person renting to you is a tenant subletting without permission, your contract may be worthless." },
  { tone: "blue", title: "Get everything in writing", body: "Verbal promises about furniture, repairs or bills disappear when there is a dispute. A short written contract with an inventory protects both sides, and you need it for your address registration anyway." },
];

/* ── 4. Cost of living ────────────────────────────────────────────────────── */

export type Cost = { item: string; vilnius: string; other: string; note: string };
export const COSTS: Cost[] = [
  { item: "Rent (room in shared flat)", vilnius: "€250–350", other: "€150–280", note: "Dormitory is €90–200" },
  { item: "Food & groceries", vilnius: "€180–250", other: "€150–220", note: "Lidl, Maxima, Iki, Rimi" },
  { item: "Public transport", vilnius: "€5–10", other: "€5–8", note: "Student monthly pass" },
  { item: "Utilities", vilnius: "€60–120", other: "€50–100", note: "Higher Nov–Mar" },
  { item: "Internet", vilnius: "€10–15", other: "€10–15", note: "Fibre is fast and cheap" },
  { item: "Mobile plan", vilnius: "€6–15", other: "€6–15", note: "Telia, Bitė, Tele2" },
  { item: "Entertainment", vilnius: "€50–100", other: "€40–80", note: "Cinema ≈ €7" },
  { item: "Gym", vilnius: "€20–35", other: "€15–30", note: "Student rates common" },
  { item: "Health insurance", vilnius: "€6.5–35", other: "€6.5–35", note: "State scheme vs private" },
  { item: "Study materials", vilnius: "€10–25", other: "€10–25", note: "Libraries cover most" },
];

/* ── 5. Transport ─────────────────────────────────────────────────────────── */

export const TRANSPORT: Item[] = [
  { title: "City buses and trolleybuses", body: "Every student city runs a dense bus network, and Vilnius and Kaunas add trolleybuses. A single ticket bought in the app is around €0.65–1.00; buying from the driver costs more. Vilnius uses the Judu system, Kaunas its own city transport card." },
  { title: "Student discounts", body: "Holders of a Lithuanian student ID (LSP) get roughly 50% off city transport and heavily discounted monthly passes, often under €6. Apply for the LSP card as soon as you enrol: it also gives museum and cinema discounts." },
  { title: "Trains", body: "LTG Link runs comfortable, cheap intercity trains. Vilnius–Kaunas takes about 1h10 for a few euros, and there is a direct train from Vilnius airport to the central station. Students get a discount with the LSP." },
  { title: "Intercity coaches", body: "Buses cover more routes than trains, with Kautra, Toks and Ecolines serving all cities plus Riga, Warsaw and Tallinn. Book online for the cheapest fares." },
  { title: "Cycling and walking", body: "All the student cities are flat and compact, with growing bike lane networks and city bike schemes in Vilnius and Kaunas. Most students walk to campus, and winter cycling is common with proper tyres." },
  { title: "Airports", body: "Vilnius (VNO) is the main gateway, with Kaunas (KUN) serving low-cost carriers and Palanga (PLQ) the coast. Riga airport, 4 hours by coach, is often the cheapest option for long-haul connections." },
  { title: "Useful apps", body: "Judu and Trafi for Vilnius transport, m.Ticket and Kautra for coaches, LTG Link for trains, Bolt and Uber for rides, plus Bolt, CityBee and Citybee scooters and car-sharing." },
];

/* ── 6. Healthcare ────────────────────────────────────────────────────────── */

export const HEALTHCARE: Item[] = [
  { title: "Health insurance is mandatory", body: "You must be insured for the whole of your stay, and proof is required for the residence permit. EU/EEA students use the European Health Insurance Card. Non-EU students either join the compulsory state scheme once they have a residence permit or hold private insurance until then." },
  { title: "The state scheme (PSD)", body: "Non-EU students with a residence permit can pay the monthly compulsory health insurance contribution, historically around €6–7 per month for students, which gives access to public healthcare on the same terms as residents. It is handled through Sodra." },
  { title: "Public healthcare", body: "Register with a local polyclinic (poliklinika) near your address and choose a family doctor. Consultations and most treatment are then free or nearly free, but waiting times for specialists can be long." },
  { title: "Private clinics", body: "Private providers such as Medicina Practica, Northway, InMedica and Kardiolita offer fast appointments, English-speaking doctors and transparent pricing, typically €40–80 for a specialist consultation." },
  { title: "Emergency numbers", body: "112 is the single emergency number for ambulance, police and fire, works from any phone, and operators speak English. Emergency care is provided regardless of insurance status." },
  { title: "Pharmacies", body: "Pharmacies (vaistinė) are everywhere, with chains such as Eurovaistinė, Gintarinė and Camelia. Pharmacists usually speak English and can advise on over-the-counter treatment. Some are open 24 hours in the big cities." },
  { title: "University health services", body: "Most universities have a student health point or a partner clinic, plus free psychological counselling. Ask the International Relations Office in your first week, it is the fastest route into the system." },
];

/* ── 7. Banking ───────────────────────────────────────────────────────────── */

export const BANKING: Item[] = [
  { title: "Opening an account", body: "Bring your passport, residence permit or arrival documents, a proof of address and your university enrolment certificate. Traditional banks usually require an in-branch appointment; approval takes from a day to two weeks." },
  { title: "Main banks", body: "Swedbank, SEB and Luminor dominate the market and have the widest branch and ATM networks. Šiaulių bankas is a smaller local option, and Revolut is licensed in Lithuania and used by most students as a second account." },
  { title: "Digital banking", body: "Lithuania is one of Europe's fintech hubs. Revolut, Wise and N26 are widely accepted, open in minutes, and are ideal before you have a residence permit. Local salary payments and some official refunds still prefer a Lithuanian IBAN." },
  { title: "Student accounts", body: "Most banks waive or reduce the monthly fee for students under 26 with proof of enrolment. Ask specifically for the student plan, it is rarely offered by default." },
  { title: "International transfers", body: "SEPA transfers inside the euro area are cheap and same-day. For non-euro transfers, Wise and Revolut are consistently cheaper than a bank wire. Avoid dynamic currency conversion when paying by card." },
  { title: "Everyday payments", body: "Cards are accepted almost everywhere, including small shops and buses. Apple Pay and Google Pay are standard, and contactless is the norm. Carry a little cash only for markets and small towns." },
];

/* ── 8. Student life ──────────────────────────────────────────────────────── */

export const STUDENT_LIFE: Item[] = [
  { title: "Student organisations", body: "Every university has a students' representation body (Studentų atstovybė) plus faculty societies covering everything from robotics to debating. They organise integration weeks, trips and parties, and are the fastest way to meet people." },
  { title: "ESN Lithuania", body: "The Erasmus Student Network has sections in Vilnius, Kaunas, Klaipėda and Šiauliai. They run buddy programmes, weekly events, cheap trips around the Baltics and the ESNcard discounts, and they welcome degree students, not only exchange students." },
  { title: "University events", body: "Freshers' weeks, faculty balls, career fairs, hackathons and international food festivals run through the academic year. Watch your university's Facebook and Instagram rather than email for the social calendar." },
  { title: "Cafés and study spots", body: "Vilnius and Kaunas have a serious specialty-coffee culture, and most cafés tolerate long study sessions. University libraries are open late in exam periods, and the National Library in Vilnius is free to use." },
  { title: "Sports", body: "Basketball is the national sport and going to a Žalgiris or Rytas game is a rite of passage. Universities offer cheap gyms, swimming pools and team leagues, and the cities are full of outdoor courts and running routes." },
  { title: "Culture and museums", body: "MO Museum and the National Museum in Vilnius, M.K. Čiurlionis Museum in Kaunas, and the Sea Museum in Klaipėda all offer student rates. Many national museums are free on the last Sunday of the month." },
  { title: "Festivals", body: "Kaziukas craft fair in March, Street Music Day in May, the Song Celebration every few years, Kaunas Jazz, Vilnius Christmas market and the Sea Festival in Klaipėda in summer." },
  { title: "Weekend trips", body: "Trakai, Nida and the Curonian Spit, Hill of Crosses, Druskininkai spa town, plus Riga (4h) and Warsaw (8h) by coach. Baltic capitals are cheap to reach, so most students travel far more than they expected to." },
];

export const QUOTES: { text: string; who: string }[] = [
  { text: "Get the LSP student card in the first week. Half-price transport, cheaper museums, cheaper trains, and it pays for itself immediately.", who: "Degree student, Vilnius" },
  { text: "Winter is not as brutal as people warn, but the darkness is real. Buy a proper coat, get vitamin D, and plan something social midweek.", who: "Master's student, Kaunas" },
  { text: "Apply for the dormitory the day you accept your offer. I waited two weeks and ended up paying double for a private room.", who: "First-year student, Kaunas" },
];

/* ── 9. Tips before moving ────────────────────────────────────────────────── */

export const TIPS: Item[] = [
  { title: "SIM cards", body: "Telia, Bitė and Tele2 all sell prepaid SIMs in shops, supermarkets and kiosks for a few euros, with generous data bundles from about €6 per month. You need your passport to register the number. EU roaming is included." },
  { title: "Weather preparation", body: "Winter runs from November to March, typically −5 °C to 0 °C but dipping below −15 °C in cold snaps, with only 7–8 hours of daylight in December. Summer is mild and green, around 20–25 °C, with long evenings." },
  { title: "Winter clothing", body: "A properly insulated waterproof coat, thermal layers, waterproof boots with grip, gloves, hat and scarf. Buying locally is often cheaper and better suited than bringing gear from a warm country." },
  { title: "Local etiquette", body: "Lithuanians are reserved at first and warm once they know you. Punctuality matters, small talk is brief, shoes come off indoors, and a quiet voice in public is the norm. Learning labas and ačiū goes a long way." },
  { title: "Culture", body: "A strong national identity built around language, song and independence, with basketball as a shared obsession. Cepelinai, šaltibarščiai and dark rye bread are the food to try first." },
  { title: "Safety", body: "Lithuania is a safe country with low violent crime. Standard precautions apply: watch belongings in crowded places, avoid arguments outside clubs late at night, and use licensed taxi apps." },
  { title: "Emergency contacts", body: "112 for all emergencies. Save your university's international office number, your embassy's contact, and your landlord's number. Register with your embassy if it offers that service." },
  { title: "Shopping", body: "Maxima, Lidl, Iki, Rimi and Norfa cover groceries, with Lidl usually cheapest. Loyalty cards give real discounts, second-hand shops (Humana) are popular, and Akropolis and Ozas are the big malls." },
  { title: "Budget saving", body: "Cook at home, use the student card everywhere, choose a dormitory in year one, buy a monthly transport pass, use university gyms and libraries, and shop the loyalty-card promotions." },
  { title: "What students wish they had known", body: "Start the residence permit process the moment you have your acceptance, bring apostilled documents in duplicate, open a digital bank account before arrival, budget for the deposit plus first month together, and register your address quickly, it blocks several other steps." },
];

export const TIP_CALLOUTS: Callout[] = [
  { tone: "blue", title: "Start the residence permit early", body: "Non-EU students apply for a national D visa and then a temporary residence permit through the Migration Department's MIGRIS system. Processing takes weeks to months and every later step, from the state health scheme to a bank account, depends on it." },
  { tone: "green", title: "Get the LSP student card immediately", body: "The Lithuanian student ID unlocks around 50% off public transport, discounted trains, and cheaper museums and cinemas. It is the single highest-value thing to do in your first week." },
  { tone: "amber", title: "Register your address", body: "Declaring your place of residence at the municipality is needed for the residence permit, the health scheme and most bank accounts. Agree with your landlord before signing that they will allow the declaration." },
];

/* ── Sources ──────────────────────────────────────────────────────────────── */

export type Source = { name: string; url: string; kind: string };
export const SOURCES: Source[] = [
  { name: "Study in Lithuania", url: "https://www.studyin.lt", kind: "Official national portal" },
  { name: "Migration Department (MIGRIS)", url: "https://migracija.lrv.lt", kind: "Government" },
  { name: "Ministry of Education, Science and Sport", url: "https://smsm.lrv.lt", kind: "Government" },
  { name: "SKVC — Centre for Quality Assessment", url: "https://www.skvc.lt", kind: "Degree recognition" },
  { name: "Education Exchange Support Foundation", url: "https://smpf.lt", kind: "Scholarships" },
  { name: "Vilnius University", url: "https://www.vu.lt/en", kind: "University" },
  { name: "VILNIUS TECH", url: "https://vilniustech.lt/en", kind: "University" },
  { name: "Kaunas University of Technology", url: "https://en.ktu.edu", kind: "University" },
  { name: "Vytautas Magnus University", url: "https://www.vdu.lt/en", kind: "University" },
  { name: "Lithuanian University of Health Sciences", url: "https://lsmu.lt/en", kind: "University" },
  { name: "Klaipėda University", url: "https://www.ku.lt/en", kind: "University" },
  { name: "Vilnius City Municipality", url: "https://vilnius.lt/en", kind: "Municipality" },
  { name: "Kaunas City Municipality", url: "https://kaunas.lt/en", kind: "Municipality" },
  { name: "Klaipėda City Municipality", url: "https://www.klaipeda.lt/en", kind: "Municipality" },
  { name: "Judu — Vilnius public transport", url: "https://judu.lt", kind: "Transport" },
  { name: "LTG Link — Lithuanian Railways", url: "https://ltglink.lt/en", kind: "Transport" },
  { name: "Kautra coaches", url: "https://www.kautra.lt", kind: "Transport" },
  { name: "Sodra — State Social Insurance", url: "https://www.sodra.lt/en", kind: "Health insurance" },
  { name: "National Health Insurance Fund (VLK)", url: "https://ligoniukasa.lrv.lt", kind: "Healthcare" },
  { name: "Swedbank Lithuania", url: "https://www.swedbank.lt/en", kind: "Banking" },
  { name: "SEB Lithuania", url: "https://www.seb.lt/eng", kind: "Banking" },
  { name: "Luminor", url: "https://www.luminor.lt/en", kind: "Banking" },
  { name: "Revolut", url: "https://www.revolut.com", kind: "Digital banking" },
  { name: "ESN Lithuania", url: "https://esn.lt", kind: "Student network" },
  { name: "Lithuanian National Union of Students (LSS)", url: "https://lss.lt", kind: "Student organisation" },
  { name: "Aruodas.lt", url: "https://www.aruodas.lt", kind: "Housing listings" },
  { name: "Skelbiu.lt", url: "https://www.skelbiu.lt", kind: "Housing listings" },
  { name: "LSP — Lithuanian Student Card", url: "https://www.lsp.lt", kind: "Student services" },
  { name: "r/Lithuania and r/Vilnius", url: "https://www.reddit.com/r/lithuania", kind: "Student communities" },
  { name: "International students Facebook groups", url: "https://www.facebook.com", kind: "Student communities" },
];

export const MARQUEE_SOURCES = SOURCES.map((s) => s.name);

/* The academic year as a scroll timeline. Dates follow the Lithuanian
   university calendar and the national migration timelines: two intakes
   (September and February), a residence permit that must be applied for
   before arrival, and a declaration of place of residence once here. */
export type TimelineStop = { date: string; title: string; body: string };
export const YEAR_TIMELINE: TimelineStop[] = [
  { date: "Mar – Jun", title: "Apply", body: "Universities open applications for the September intake. Transcripts and diplomas are translated and legalised, which is the step that takes longest, so it starts first." },
  { date: "Jun – Jul", title: "Acceptance", body: "Offers arrive and the place is confirmed with a tuition deposit. The university issues the acceptance documents the migration office will ask for." },
  { date: "Jul – Aug", title: "Residence permit", body: "The national visa or temporary residence permit is applied for from your home country. Proof of funds, health insurance and accommodation are all part of the file." },
  { date: "Late Aug", title: "Arrival", body: "Fly in, collect keys, and declare your place of residence at the municipality within the first weeks. The student card and a local bank account follow." },
  { date: "Sep 1", title: "Semester starts", body: "Orientation week, then lectures. The autumn semester runs to late January, with the exam session in January." },
  { date: "Feb", title: "Spring semester", body: "The second semester begins, and the February intake starts here instead. The academic year closes in June." },
];
