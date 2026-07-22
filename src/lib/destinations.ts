/* Data-driven destinations. Adding a future country = add one entry here; both the
   homepage teaser (Destinations.tsx) and the full /destinations page render from
   this array, no new markup needed. Flag colours are keyed by `name` in ui.tsx. */

export type Destination = {
  code: string;
  name: string;
  open: boolean;
  degrees: string[];
  universities: string;
  tuition: string;
  intakes: string;
  whatIs: string;
  whyCountry: string;
  whyStudents: string;
};

export const DESTINATIONS: Destination[] = [
  {
    code: "LT", name: "Lithuania", open: true,
    degrees: ["Bachelor", "Master"],
    universities: "10+ universities", tuition: "~€4,000 / year", intakes: "2 intakes / year",
    whatIs: "Lithuania is an EU member state in the Baltics with a modern, English-friendly higher-education system. Public and private universities offer internationally recognized Bachelor's and Master's degrees, many taught fully in English.",
    whyCountry: "It combines affordable tuition and living costs with EU-quality education and a straightforward student-visa route, making it one of the most accessible European destinations for non-EU students.",
    whyStudents: "Students choose Lithuania for low tuition, a safe and welcoming environment, growing tech and business programs, and the ability to work and travel across the EU during their studies.",
  },
  {
    code: "PL", name: "Poland", open: false,
    degrees: ["Bachelor", "Master"],
    universities: "Coming soon", tuition: "To be announced", intakes: "2 intakes / year",
    whatIs: "Poland is a large EU country with a long academic tradition and a wide range of English-taught programs across established public and private universities.",
    whyCountry: "It offers strong programs in engineering, medicine and business at competitive tuition, in major student cities with a low cost of living.",
    whyStudents: "Students are drawn by well-ranked universities, a big international community, and central-European location with easy travel.",
  },
  {
    code: "DE", name: "Germany", open: false,
    degrees: ["Bachelor", "Master"],
    universities: "Coming soon", tuition: "To be announced", intakes: "2 intakes / year",
    whatIs: "Germany is one of the world's leading study destinations, known for research universities and universities of applied sciences with strong industry links.",
    whyCountry: "Many public universities charge little or no tuition, and degrees carry global recognition, especially in engineering and sciences.",
    whyStudents: "Students choose Germany for world-class programs, strong career prospects, and a large, established international student community.",
  },
  {
    code: "HU", name: "Hungary", open: false,
    degrees: ["Bachelor", "Master"],
    universities: "Coming soon", tuition: "To be announced", intakes: "2 intakes / year",
    whatIs: "Hungary offers a well-regarded higher-education system in central Europe, with many English-taught programs and a strong reputation in medicine and engineering.",
    whyCountry: "Affordable tuition and living costs sit alongside historic university cities and EU-recognized qualifications.",
    whyStudents: "Students pick Hungary for value, respected medical and technical schools, and a central location in Europe.",
  },
  {
    code: "RU", name: "Russia", open: false,
    degrees: ["Bachelor", "Master"],
    universities: "Coming soon", tuition: "To be announced", intakes: "1–2 intakes / year",
    whatIs: "Russia has a large network of long-established universities offering programs across engineering, medicine, and the sciences, with options taught in English.",
    whyCountry: "It offers low tuition and living costs with globally recognized degrees at major research institutions.",
    whyStudents: "Students choose Russia for affordability and strong technical and medical programs.",
  },
  {
    code: "LV", name: "Latvia", open: false,
    degrees: ["Bachelor", "Master"],
    universities: "Coming soon", tuition: "To be announced", intakes: "2 intakes / year",
    whatIs: "Latvia is an EU member state in the Baltics with modern universities and a growing selection of English-taught Bachelor's and Master's programs.",
    whyCountry: "It pairs affordable EU education with a compact, safe environment and easy travel across Europe.",
    whyStudents: "Students choose Latvia for value, quality of life, and access to the EU during their studies.",
  },
];

export const destinationByCode = (code: string) => DESTINATIONS.find((d) => d.code === code) ?? null;
