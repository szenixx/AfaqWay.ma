"use client";

import { ExternalLink } from "lucide-react";
import { PROGRAMS } from "@/lib/programs/catalog";
import { PROGRAM_FIELD_LABEL, type ProgramField } from "@/lib/journeyBlocks";
import { EUR_TO_MAD, RATE_SET_ON, eurToMad, formatEur } from "@/config/pricing";
import type { StudyApp } from "@/lib/studyApplication";

/* Facts pulled from the student's own programme.

   The Excel deliberately does not repeat a fee or a URL that the programme
   engine already stores: those steps carry a "program" block naming the field,
   and it is resolved here against the student's selected programme. Change the
   programme and this content follows, with no journey edit. */

/** Matches the student's programme against the catalogue, name first. */
export function findProgram(study: StudyApp | null) {
  if (!study?.program || study.program === "—") return null;
  const name = study.program.trim().toLowerCase();
  const university = (study.university ?? "").trim().toLowerCase();
  return (
    PROGRAMS.find((p) => p.name.toLowerCase() === name && p.university.toLowerCase() === university)
    ?? PROGRAMS.find((p) => p.name.toLowerCase() === name)
    ?? null
  );
}

/** The English certificates this programme actually accepts, from its record. */
function englishOptions(p: NonNullable<ReturnType<typeof findProgram>>): string[] {
  const out: string[] = [];
  if (p.duolingo_min) out.push(`Duolingo English Test — minimum ${p.duolingo_min}`);
  if (p.cefr_min) out.push(`IELTS, TOEFL iBT, Cambridge English or PTE at CEFR ${p.cefr_min} or above`);
  if (p.english_core && p.english_core !== "-") out.push(`EnglishCore — ${p.english_core}`);
  return out;
}

export function ProgramBlock({ field, study }: { field: ProgramField; study: StudyApp | null }) {
  const program = findProgram(study);

  if (!program) {
    return (
      <p className="stp-hint stp-hint-grey">
        {PROGRAM_FIELD_LABEL[field]} appears here once your programme is confirmed.
      </p>
    );
  }

  if (field === "url" || field === "apply") {
    /* Same destination, two different jobs. "Explore Your Program" points at the
       page to read; "Submit Your Application" points at the page to act on, and
       the Excel shows that one only to Self Service students. */
    const apply = field === "apply";
    return (
      <p className="lrn-linkrow">
        <span className="lrn-linklabel">{program.name} · {program.university}</span>
        <a className="lrn-link" href={program.url} target="_blank" rel="noopener noreferrer">
          {apply ? "Apply Now on the university website" : "Open the official programme page"}
          <ExternalLink size={13} />
        </a>
        {apply && program.deadline && (
          <span className="lrn-linknote">Application deadline: {program.deadline}</span>
        )}
      </p>
    );
  }

  if (field === "english") {
    const options = englishOptions(program);
    return (
      <>
        <h4 className="lrn-sub">Accepted by {program.university}</h4>
        {options.length === 0
          ? <p className="lrn-p">Your programme does not list an English requirement. Ask our support team before you book a test.</p>
          : <ul className="lrn-ul">{options.map((o, i) => <li key={i}>{o}</li>)}</ul>}
      </>
    );
  }

  /* Fees are stated above the written guidance, as the Excel asks, in euros and
     again in dirhams: a student in Morocco cannot judge €4,000 at a glance. */
  const amount = field === "app_fee" ? program.app_fee_eur : program.tuition_eur;
  const mad = eurToMad(amount);
  return (
    <>
      <dl className="pgm-fee">
        <div>
          <dt>{field === "app_fee" ? "Application fee" : "Tuition fee"}</dt>
          <dd>{formatEur(amount)}</dd>
        </div>
        {mad !== null && (
          <div>
            <dt>Approx. in MAD</dt>
            <dd>{mad.toLocaleString("en-US")} MAD</dd>
          </div>
        )}
        <div>
          <dt>Programme</dt>
          <dd>{program.name}</dd>
        </div>
        <div>
          <dt>University</dt>
          <dd>{program.university}</dd>
        </div>
      </dl>
      {mad !== null && (
        /* Never presented as the amount they will be charged: the rate is
           indicative and dated, so an out-of-date figure is visible as one. */
        <p className="pgm-fee-note">
          Indicative only, at €1 = {EUR_TO_MAD} MAD as of{" "}
          {new Date(RATE_SET_ON).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.
          Your bank sets the rate on the day you pay.
        </p>
      )}
    </>
  );
}

export default ProgramBlock;
