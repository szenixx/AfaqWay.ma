/* Optional modules: steps a student switches on, not steps everyone gets.
 *
 * The Excel describes the journey every student walks. Some students need extra
 * work that most do not — a sponsor's paperwork, for instance — and putting
 * those steps in the Excel would show four irrelevant uploads to every student
 * who funds their own studies.
 *
 * An optional module is therefore:
 *
 *   a PARENT step   which renders as an "Optional Feature" card until it is
 *                   switched on, and as an expandable container afterwards;
 *   CHILD steps     which exist in the database from the start, but are hidden,
 *                   uncounted and inert until the student enables the module.
 *
 * Enablement is per student and lives on the parent step's progress row
 * (meta.moduleEnabled), so no new table is needed and disabling is one write.
 *
 * These steps are declared HERE rather than in a standalone migration because
 * the importer archives any step in a stage it does not know about. A module
 * defined outside this file would be silently archived by the next
 * `node scripts/import-journey.mjs`, taking the student's uploads out of the
 * journey with it.
 *
 * Adding another optional module later means adding an entry to MODULES. The
 * roadmap, the dialogs and the progress rules are generic.
 */

/** The module key travels on both the parent and its children. */
const SPONSORSHIP = "sponsorship";

export const MODULES = {
  /* Appended after the Excel's own Stage 3 steps. */
  "migration Application Preparation": [
    {
      /* ── The parent ── */
      title: "Financial Sponsorship",
      description:
        "Need someone to financially support your studies? Enable this optional module to prepare and upload all sponsorship documents required for your application. This module is only required for students applying with a financial sponsor.",
      icon: "handshake",
      module: SPONSORSHIP,
      dialogs: {
        enable: {
          title: "Enable Financial Sponsorship?",
          body: "You are about to enable the Financial Sponsorship module. Additional document steps will be added to your Stage 3 journey. Only enable this feature if you are applying with a financial sponsor.",
          confirmLabel: "Start",
        },
        disable: {
          title: "Disable Sponsorship Module?",
          body: "Disabling this module will remove all sponsorship steps from your journey. Previously uploaded documents will remain stored in the Documents Module unless removed separately.",
          confirmLabel: "Disable",
        },
        /* Offered once, when every other step in the stage is settled and the
           module was never switched on. "No Thanks" dismisses it for good. */
        remind: {
          title: "Need Financial Sponsorship?",
          body: "If someone will financially support your studies, you can still enable the optional sponsorship module and upload the required documents.",
          confirmLabel: "Start",
          dismissLabel: "No Thanks",
        },
      },

      /* ── The children ──
         Learn is deliberately empty on all of them: "The Learn section should
         remain empty for now. Administrators will populate it later." Each is a
         document step, so it uses the upload workflow every other step uses. */
      children: [
        {
          title: "Affidavit / Sponsorship Letter",
          description:
            "Provide the official sponsorship letter containing the sponsor's personal information, relationship to you, and sponsorship period.",
          documents: ["Affidavit / Sponsorship Letter"],
        },
        {
          title: "Sponsor's Passport / ID",
          description:
            "Upload your sponsor's passport and residency document (Green Card if applicable).",
          documents: ["Sponsor's Passport", "Sponsor's Residency Document (if applicable)"],
        },
        {
          title: "Bank Maintenance (Translated)",
          description:
            "Upload the translated bank maintenance or bank statement document provided by your sponsor.",
          documents: ["Bank Maintenance (Translated)"],
        },
        {
          title: "Your & Sponsor's Unabridged Copy",
          description:
            "Upload the required unabridged copies proving your relationship with the sponsor.",
          documents: ["Your Unabridged Copy", "Sponsor's Unabridged Copy"],
        },
        {
          title: "Proof of Sponsor's Employment",
          description:
            "Upload official employment documents that prove your sponsor is currently employed and has a stable source of income. These documents help demonstrate the sponsor's financial ability to support your studies.",
          /* "The exact required documents may vary depending on the sponsor's
             country and employment situation", so only the letter is required
             and the rest are offered as optional uploads. */
          documents: [
            "Employment Verification Letter",
            { name: "Employment Contract", required: false },
            { name: "Recent Salary Slips / Payslips", required: false },
            { name: "Employer Certificate", required: false },
          ],
          /* The one child a student may pass on: an employed sponsor in some
             countries simply cannot obtain these. Skipping settles the step and
             leaves it visible, so they can come back and upload later. */
          allowSkip: true,
          skipConfirm: {
            title: "Skip employment proof?",
            question:
              "You can continue without these documents and add them later. Your journey will show this step as skipped.",
            confirmLabel: "Yes, skip for now",
          },
        },
      ],
    },
  ],
};

/** Every module parent title, for the importer's archive check. */
export const MODULE_TITLES = Object.values(MODULES).flatMap((list) =>
  list.flatMap((m) => [m.title, ...m.children.map((c) => c.title)]),
);
