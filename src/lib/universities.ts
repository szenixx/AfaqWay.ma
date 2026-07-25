/* University registry — the single source of truth for university branding and
   facts across the platform. Nothing about a university is hardcoded in a
   component: cards, heroes, the Journey and Documents panels and the profile
   modal all read from here, matched by name.

   Visual assets (logo, hero, campus, student life, gallery) are produced for
   every entry by the AI Asset Service and resolved through
   src/lib/universityAssets.ts — nothing is collected manually. */

export type University = {
  slug: string;
  name: string;
  short: string;
  city: string;
  site: string;
  /** English-taught fields the institution is known for. */
  programs: string[];
  tuition: string;
  students?: string;
  ranking?: string;
  international: boolean;
  /** Brand colour used for the fallback lettermark and accents. */
  color: string;
  desc: string;
  support: string;
};

export const UNIVERSITIES: University[] = [
  {
    slug: "vilnius-university", name: "Vilnius University", short: "VU", city: "Vilnius",
    site: "https://www.vu.lt/en", programs: ["Software Engineering", "Business & Economics", "Medicine", "Data Science"],
    tuition: "€3,000–6,500 / year", students: "≈ 19,000", ranking: "QS ~400", international: true, color: "#8A1538",
    desc: "Founded in 1579, the oldest university in the Baltic states and the country's largest, with a UNESCO-listed old campus in the heart of Vilnius.",
    support: "International Relations Office, buddy programme, arrival support",
  },
  {
    slug: "vilnius-tech", name: "Vilnius Gediminas Technical University", short: "VILNIUS TECH", city: "Vilnius",
    site: "https://vilniustech.lt/en", programs: ["Civil Engineering", "Aviation", "Mechatronics", "Business Informatics"],
    tuition: "€3,500–5,500 / year", students: "≈ 9,000", ranking: "QS ~800", international: true, color: "#E4002B",
    desc: "The country's leading technical university, strong in engineering, architecture, aviation and the built environment.",
    support: "International Studies Centre, mentor scheme, career centre",
  },
  {
    slug: "ktu", name: "Kaunas University of Technology", short: "KTU", city: "Kaunas",
    site: "https://en.ktu.edu", programs: ["Informatics", "Mechanical Engineering", "Industrial Engineering", "Business"],
    tuition: "€3,500–6,000 / year", students: "≈ 8,000", ranking: "QS ~700", international: true, color: "#00A0AF",
    desc: "A major research and innovation hub with one of the largest ranges of English-taught engineering and IT degrees in the region.",
    support: "International Relations Department, KTU Startup Space, buddy programme",
  },
  {
    slug: "vmu", name: "Vytautas Magnus University", short: "VMU", city: "Kaunas",
    site: "https://www.vdu.lt/en", programs: ["International Business", "Political Science", "Psychology", "Arts"],
    tuition: "€3,000–5,500 / year", students: "≈ 8,500", international: true, color: "#00693E",
    desc: "A liberal-arts oriented university where students combine a main subject with electives across faculties.",
    support: "Very international campus, language centre, ESN section",
  },
  {
    slug: "lsmu", name: "Lithuanian University of Health Sciences", short: "LSMU", city: "Kaunas",
    site: "https://lsmu.lt/en", programs: ["Medicine", "Dentistry", "Veterinary Medicine", "Pharmacy"],
    tuition: "€10,000–15,000 / year", students: "≈ 7,000", international: true, color: "#004B87",
    desc: "The country's medical university, with its own hospital complex and a large international cohort.",
    support: "International Relations & Study Centre, strong alumni network",
  },
  {
    slug: "klaipeda-university", name: "Klaipėda University", short: "KU", city: "Klaipėda",
    site: "https://www.ku.lt/en", programs: ["Marine Technology", "Maritime Transport", "Ecology", "Business"],
    tuition: "€2,800–4,500 / year", students: "≈ 3,500", international: true, color: "#0067B1",
    desc: "The seaside university, specialised in marine sciences, maritime engineering and coastal economics.",
    support: "Small campus, close staff contact, harbour industry links",
  },
  {
    slug: "mruni", name: "Mykolas Romeris University", short: "MRU", city: "Vilnius",
    site: "https://www.mruni.eu/en", programs: ["Law", "Public Governance", "Psychology", "Cybersecurity Management"],
    tuition: "€3,000–5,000 / year", students: "≈ 6,000", international: true, color: "#00539B",
    desc: "A social-sciences university known for law, public administration and a very international student body.",
    support: "International office, legal clinic, mentor programme",
  },
  {
    slug: "ism", name: "ISM University of Management and Economics", short: "ISM", city: "Vilnius",
    site: "https://www.ism.lt/en", programs: ["Economics & Data Analytics", "International Business", "Finance"],
    tuition: "€4,500–7,000 / year", students: "≈ 2,000", international: true, color: "#003DA5",
    desc: "A private business university with strong corporate links and a management-focused curriculum.",
    support: "Career centre, exchange partners, small cohorts",
  },
  {
    slug: "lcc", name: "LCC International University", short: "LCC", city: "Klaipėda",
    site: "https://lcc.lt", programs: ["International Business", "Psychology", "English & Communication"],
    tuition: "€3,500–6,000 / year", students: "≈ 700", international: true, color: "#00447C",
    desc: "A liberal-arts university teaching entirely in English, with students from more than 50 countries.",
    support: "Residential campus, very high share of international students",
  },
  {
    slug: "smk", name: "SMK University of Applied Sciences", short: "SMK", city: "Klaipėda",
    site: "https://www.smk.lt/en", programs: ["Digital Marketing", "Media Production", "Health Management"],
    tuition: "€2,500–4,000 / year", international: true, color: "#E4002B",
    desc: "An applied-sciences institution focused on practice-led programmes in media, business and health.",
    support: "Practical placements, industry mentors",
  },
  {
    slug: "kauko", name: "Kauno kolegija Higher Education Institution", short: "KK", city: "Kaunas",
    site: "https://en.kaunokolegija.lt", programs: ["Business", "Engineering", "Health Sciences", "Arts"],
    tuition: "€2,300–3,800 / year", international: true, color: "#005CA9",
    desc: "One of the largest colleges in Lithuania, awarding professional Bachelor degrees with a practical focus.",
    support: "Career services, internship network",
  },
  {
    slug: "lsu", name: "Lithuanian Sports University", short: "LSU", city: "Kaunas",
    site: "https://www.lsu.lt/en", programs: ["Sports Science", "Physiotherapy", "Coaching", "Sports Management"],
    tuition: "€3,000–4,500 / year", international: true, color: "#004C97",
    desc: "The country's specialist sports university, combining sports science, coaching and rehabilitation.",
    support: "Athletic facilities, sports clubs, applied research",
  },
  {
    slug: "vvk", name: "Vilnius Business College", short: "VVK", city: "Vilnius",
    site: "https://www.kolegija.lt/en", programs: ["International Business", "Programming", "Digital Marketing"],
    tuition: "€2,500–3,900 / year", international: true, color: "#F5A623",
    desc: "A compact business college with practice-oriented English-taught programmes.",
    support: "Small groups, business mentors",
  },
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Finds a university from any stored name (profile, programme catalogue…). */
export function findUniversity(name: string | null | undefined): University | null {
  if (!name) return null;
  const n = norm(name);
  return (
    UNIVERSITIES.find((u) => norm(u.name) === n) ??
    UNIVERSITIES.find((u) => norm(u.short) === n) ??
    UNIVERSITIES.find((u) => n.includes(norm(u.short)) || norm(u.name).includes(n) || n.includes(norm(u.name))) ??
    null
  );
}
