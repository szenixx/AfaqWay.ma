/* Per-step behaviour and content, transcribed from the Excel's
 * "CLAUDE Prompt (claude read this)" column.
 *
 * The Excel's Stage / Steps / description / upload req / learn columns describe
 * the SHAPE of the journey, and scripts/import-journey.mjs reads them
 * structurally. The Claude Prompt column describes BEHAVIOUR — which steps a
 * student may complete themselves, which open a dialog, which show a red
 * warning card, which pull a fee out of the programme engine. None of that can
 * be inferred from a title, so it is written down here, once, and turned into
 * journey_steps.rules + journey_blocks rows.
 *
 * Keyed by STAGE, then by step: "CV (Resume)" is a step of Stage 1 and a
 * different step of Stage 3, with different content, and a flat map would
 * silently merge them.
 *
 * Nothing here is invented. Every string is either quoted from the Excel or is
 * the label of a control the Excel explicitly asks for. Where the Excel names a
 * website as a button ("opens the Air Arabia website") the canonical address of
 * that site is used; where it names no destination, no button is emitted.
 *
 * Keys:
 *   program        pull a fact from the programme catalogue at read time
 *   completion     "review" (default: submit → advisor approves)
 *                  "self"     the student completes it themselves
 *                  "decision" the TRP outcome modal decides it
 *   confirm        confirmation dialog shown before a self-completion
 *   capture        a form whose answers are saved before completing
 *   gate           checklist that must be ticked before completing
 *   allowSkip      the student may skip; skipping settles the step
 *   requiresSteps  locked until every earlier step in the stage is settled
 *   photo          this upload accepts an image as well as a PDF
 *   example        the admin-editable Example section is switched on
 *   replaceLearn   plan → message that REPLACES the Excel prose for that plan
 *   banner         red preparation banner pinned above the Learn content
 *   blocks         extra Learn blocks, in the order the Excel asks for them
 *   announce       fired once, when this step's stage unlocks
 */

/* "Add an optional Example section that the admin can enable, edit, or hide for
   each step." Seeded switched off, so nothing empty ever reaches a student. */
const ADMIN_EXAMPLE = { example: true };

export const SPEC = {
  /* ── Stage 1 · Pre-Application ─────────────────────────────────────────── */
  "Pre-Application": {
    /* "retrieve the official program URL from the Excel program engine we built
       earlier and display it in the Learn section for the selected program."
       The Learn cell reads "link of the program page" — a note to the author
       describing what belongs there, not text for a student. The programme
       block supplies the real content, so the cell itself is not rendered. */
    "Explore Your Program": { program: "url", ignoreLearn: true },

    /* "list only the English language certificates accepted by that
       university/program, based on the program requirements stored in the
       Excel file." */
    "English Certificate": { program: "english" },

    "Motivation Letter": ADMIN_EXAMPLE,
    "CV (Resume)": ADMIN_EXAMPLE,

    /* "this step is optional and is not required to continue the journey. Allow
       the user to Skip this step at any time. When skipped, automatically mark
       the step as Approved so it does not block progress to the next stage." */
    "Additional Courses": { allowSkip: true },

    /* "pdf is not required here it can be photo form. or pdf, both accepted but
       other uploaded doc is required to be a pdf form." */
    "Personal Photo": { photo: true },

    /* "retrieve the Application Fee from the Programs Excel database … Display
       the fee above the Learn section." */
    "Application Fees": { program: "app_fee" },

    /* "Self Service: display the Apply Now button/link that takes the student
       directly to the university application page. Full Service: do not display
       the Apply Now link. Instead, show a reminder that our support team will
       submit the university application on the student's behalf after all
       required documents have been reviewed and approved." */
    "Submit Your Application": {
      blocks: [
        { kind: "program", data: { field: "apply" }, plan: "self_service" },
        {
          kind: "info", plan: "full_service", title: "We submit this for you",
          body: "Do not submit anything yourself. Our support team submits your university application on your behalf once all of your required documents have been reviewed and approved.",
        },
      ],
    },

    /* "for Full Service users, expand the Learn section with extra preparation
       materials." Tips, a tutorial video placeholder, a reminder to read the
       preparation PDFs, and encouragement to practise. */
    "Motivational Interview": {
      blocks: [
        {
          kind: "list", plan: "full_service", title: "How to prepare",
          data: {
            entries: [
              "Be confident and communicate clearly.",
              "Answer every question honestly.",
              "Explain why you chose this program.",
              "Discuss your study and career goals.",
              "Dress appropriately for the interview.",
              "Maintain eye contact.",
              "Test your microphone and camera if the interview is online.",
              "Be on time.",
            ],
          },
        },
        {
          kind: "note", plan: "full_service", title: "Before the interview",
          body: "Read all of the preparation PDFs provided in this step before your interview. Practise your answers beforehand, and contact our support team if you need help.",
        },
      ],
      /* "A Tutorial Video section with a placeholder link: Watch Tutorial:
         [Mockup Link] (this will be replaced later)."

         The Excel names no address, and inventing one would put a dead link in
         front of a student. The slot is seeded switched OFF instead, exactly
         like the Example section: an administrator pastes the real URL into the
         waiting block and enables it, with nothing to create from scratch. */
      videoSlot: { title: "Watch Tutorial", plan: "full_service" },
    },
  },

  /* ── Stage 2 · University Admission ────────────────────────────────────── */
  "University Admission": {
    "University Review": {
      replaceLearn: {
        full_service:
          "Our team has already submitted your application and we are waiting for the university's admission decision. You do not need to take any action at this stage. If the university requests additional documents, an interview, or any other information, our support team will contact you immediately.",
      },
    },

    "E-Sign Agreement of Studies": {
      replaceLearn: {
        full_service:
          "Our team has already reviewed the Agreement of Studies with the university. You only need to review the agreement carefully and complete the electronic signature when requested. Your tuition fee payment can only be completed after the Agreement of Studies has been successfully signed. If you have any questions about the agreement, or you notice incorrect information, contact our support team before signing.",
      },
    },

    /* "retrieve the Tuition Fee from the Programs Excel database … Display the
       tuition fee above the Learn section." */
    "Pay Tuition Fees": { program: "tuition" },
  },

  /* ── Stage 3 · Migration Application Preparation ───────────────────────── */
  "migration Application Preparation": {
    "Academic Documents (Apostille & Translation)": {
      replaceLearn: {
        full_service:
          "Our team will verify all of your academic documents, confirm they match the ones submitted to your university, and review the apostille and certified translations before the MIGRIS application begins. If anything is missing or incorrect, we will notify you with the required corrections before you move on.",
      },
    },

    "Passport & National ID Card": {
      replaceLearn: {
        full_service:
          "Our team will verify your passport validity, your personal information and the quality of every document before submitting the immigration application. We will contact you if updated documents are required.",
      },
    },

    "MIGRIS Motivation Letter": {
      replaceLearn: {
        full_service:
          "Our immigration team will prepare and review your MIGRIS motivation letter based on your academic profile. You will only be asked to review and approve the final version if necessary.",
      },
    },

    "CV (Resume)": {
      replaceLearn: {
        full_service:
          "Our team will review and optimise your CV to make sure it is consistent with the rest of your immigration documents before submission.",
      },
    },

    "University Acceptance Letter": {
      replaceLearn: {
        full_service:
          "Our team has already verified your Acceptance Letter and will include it in your residence permit application. No additional action is required unless the university issues an updated letter.",
      },
    },

    "Wait for Mediation Letter": {
      replaceLearn: {
        full_service:
          "Our team monitors the university's mediation process and will notify you immediately once the Mediation Letter and the Mediation Code are available. No action is required until then.",
      },
    },

    "English Language Certificate": {
      replaceLearn: {
        full_service:
          "Our team will verify that your uploaded English language certificate matches the one accepted by your university before it is submitted with your immigration application.",
      },
    },

    "Criminal Record Certificate": {
      replaceLearn: {
        full_service:
          "Our team will verify your Criminal Record Certificate, its apostille and its certified translation before adding them to your residence permit application.",
      },
    },

    "Health Insurance": {
      replaceLearn: {
        full_service:
          "Our team will pay for and verify your insurance validity period, coverage amount and compliance with Lithuanian immigration requirements before submission.",
      },
    },

    "Bank Statement (Last 6 Months)": {
      replaceLearn: {
        full_service:
          "Our team will review your financial statements to make sure they meet the Lithuanian immigration requirements before submission.",
      },
    },

    "Bank Maintenance Certificate (Attestation de tenue de compte)": {
      replaceLearn: {
        full_service:
          "Our team will verify both the original Bank Maintenance Certificate and its certified translation before including them in your MIGRIS application.",
      },
    },

    "Create MIGRIS Account": {
      replaceLearn: {
        full_service:
          "Our immigration team will prepare and guide the MIGRIS registration process. You may only be asked to confirm your email address or complete identity verification if MIGRIS requires it. If any further action is needed we will notify you through the platform and by email. At this stage no action is required unless our support team asks for it.",
      },
    },

    /* "This step must remain locked and cannot be marked as completed until
       every previous step in Stage 3 has been completed and all required
       documents have been uploaded and verified. Display a checklist showing
       any incomplete prerequisites. Once all prerequisites are satisfied,
       automatically unlock this step." */
    "Complete & Submit MIGRIS Application": {
      requiresSteps: true,
      replaceLearn: {
        full_service:
          "Our immigration team will complete and submit your MIGRIS application on your behalf using all of your verified documents. You will only be contacted if additional information or confirmation is required.",
      },
    },
  },

  /* ── Stage 4 · VFS Appointment & Biometrics ────────────────────────────── */
  "VFS Appointment & Biometrics": {
    /* "Display a prominent Mark as Completed button on this step. Do not
       require admin approval. … Show a confirmation dialog before marking the
       step complete." */
    "MIGRIS Application Approved": {
      completion: "self",
      confirm: {
        title: "MIGRIS approval",
        question:
          "Have you received the official MIGRIS approval email allowing you to continue to the VFS appointment stage?",
        confirmLabel: "Yes, I received it",
      },
      replaceLearn: {
        full_service:
          "Our team continuously monitors your MIGRIS application status and will notify you as soon as the approval is received.",
      },
    },

    /* "When the student clicks Mark as Completed, do not immediately complete
       the step. Instead, open a modern confirmation modal titled Confirm Your
       VFS Appointment." Saves the date, time and timezone, creates the Schedule
       event and the four reminders. */
    "Book Your VFS Appointment": {
      completion: "self",
      capture: "vfs_appointment",
      replaceLearn: {
        full_service:
          "Our immigration team will help you book the earliest available VFS appointment and will share the confirmed appointment details as soon as they are available.",
      },
    },

    /* "Display two quick action buttons inside the Learn section … Display a
       Mark as Completed button. When the student clicks the button, show a
       confirmation dialog." */
    "Book Your Flight & Hostels": {
      completion: "self",
      confirm: {
        title: "Travel booking",
        question: "Have you successfully booked your flight and accommodation for your trip to Turkey?",
        confirmLabel: "Yes, both are booked",
      },
      blocks: [
        { kind: "link", data: { url: "https://www.airarabia.com", label: "✈️ Book Flights with Air Arabia", newTab: true, internal: false } },
        { kind: "link", data: { url: "https://www.booking.com", label: "🏨 Book Accommodation on Booking.com", newTab: true, internal: false } },
      ],
      replaceLearn: {
        full_service:
          "Our team can recommend suitable flights and accommodation based on your confirmed VFS appointment date and city.",
      },
    },

    /* Two prominent red warning cards before any other content, a checklist
       that must be satisfied before completing, and the pinned stage-unlock
       announcement. */
    "Attend Your VFS Appointment": {
      completion: "self",
      banner: {
        title: "🔴 Before You Travel",
        entries: [
          "Arrive at the VFS center at least 2 hours before your appointment.",
          "Bring all original documents submitted to the MIGRIS system.",
          "Bring one extra photocopy of your passport.",
          "Bring €190 for the required processing fee (if applicable).",
          "Complete your fingerprint scan and digital photograph during the appointment.",
        ],
      },
      blocks: [
        {
          kind: "important", first: true, title: "🔴 Important Requirement #1",
          body: "Bring €190 with you for the VFS appointment (if applicable). This is one of the most important requirements and should not be forgotten.",
        },
        {
          kind: "important", first: true, title: "🔴 Important Requirement #2",
          body: "Bring one extra photocopy of your passport in addition to your original passport. This is required during document verification.",
        },
      ],
      gate: [
        "All original documents from the MIGRIS application",
        "Original passport",
        "One extra passport photocopy",
        "€190 available (if applicable)",
      ],
      confirm: {
        title: "VFS appointment",
        question: "Have you attended your appointment and completed your biometric verification?",
        confirmLabel: "Yes, I attended",
      },
      /* "The platform notification and WhatsApp message should be sent only
         once, immediately when Stage 4 is unlocked."
         The wording lives in TEMPLATES; the step only names the event, so an
         administrator can reword it without a re-import. */
      announce: {
        event: "vfs_prepare",
        /* "If the student has not opened the step within 48 hours, automatically
           send one reminder through both the platform and WhatsApp." */
        followUpEvent: "vfs_prepare_followup",
        followUpHours: 48,
      },
      replaceLearn: {
        full_service:
          "Our team has already prepared and reviewed your application. You only need to attend your VFS appointment with the required original documents.",
      },
    },

    /* "Display a Common Interview Questions accordion … Add a blue Tips &
       Advice card … show a confirmation dialog." */
    "Residence Permit Interview": {
      completion: "self",
      confirm: {
        title: "VFS interview",
        question: "Have you completed your VFS interview successfully?",
        confirmLabel: "Yes, it is done",
      },
      blocks: [
        {
          kind: "accordion", title: "Common Interview Questions",
          data: {
            entries: [
              { title: "Why did you choose Lithuania?", body: "Talk about the university, the program and the country. Keep your answer consistent with the motivation letter you submitted." },
              { title: "Which university and study program will you attend?", body: "Name your university and your exact study program, as they appear on your Acceptance Letter." },
              { title: "Who will finance your studies and living expenses?", body: "Explain who is funding you, and keep your answer consistent with the bank statement and the bank maintenance certificate you submitted." },
              { title: "Where will you stay after arriving in Lithuania?", body: "Describe your accommodation plan. If it is not confirmed yet, say so honestly and explain what you are arranging." },
              { title: "What are your future study or career plans?", body: "Describe your plans after graduation, consistent with the goals you wrote in your motivation letter." },
            ],
          },
        },
        {
          kind: "info", title: "Tips & Advice",
          data: { entries: [
            "Stay calm and confident.",
            "Be honest in every answer.",
            "Keep your answers consistent with your submitted documents.",
            "Answer briefly unless additional details are requested.",
          ] },
        },
      ],
      replaceLearn: {
        full_service:
          "Our advisors have already prepared you for this interview and reviewed the expected questions with you.",
      },
    },

    /* "Disable the Mark as Completed button. This step cannot be completed
       manually" for Full Service; Self Service gets the decision modal. */
    "Waiting for Final Decision": {
      completion: "decision",
      decision: "trp",
      blocks: [
        { kind: "review_status", first: true, title: "Application Under Review" },
        {
          kind: "info", title: "No action is required",
          body: "Processing times vary depending on the workload of the Lithuanian Migration Department and on individual circumstances. You do not need to do anything unless they contact you.",
        },
        {
          kind: "tip", title: "Tips & Advice",
          data: { entries: [
            "Monitor your email inbox, including the spam folder.",
            "Check your MIGRIS account for status updates.",
            "Keep an eye on your AfaqWay notifications.",
          ] },
        },
      ],
      replaceLearn: {
        full_service:
          "Our team is actively monitoring your application status with the Lithuanian Migration Department. If additional documents or information are requested, we will contact you immediately through the platform, by email and on WhatsApp.",
      },
    },
  },
};

/* ── Stage-level rules ───────────────────────────────────────────────────── */

export const STAGES = {
  /* Stage 4's last step decides the outcome, so Stage 5 opens on that decision
     rather than on an advisor's stage approval. */
  "VFS Appointment & Biometrics": { unlock: "auto" },
};

/* Stage 5 is the one stage the Excel does not describe. Its steps and Learn
   modules are written in scripts/stage5-content.mjs and imported here, so the
   importer builds all five stages through one path. */
import { STAGE5_TITLE, STAGE5_STEPS } from "./stage5-content.mjs";

/**
 * Stage 5 — After Arrival in Lithuania.
 *
 * Two rules make it different from every stage before it:
 *
 *   requiresPlan   it belongs to Full Service. A Self Service student sees it
 *                  at the end of their roadmap and can read what it covers, but
 *                  it never opens, however far they get.
 *   unlockedBy     its first step is a support request. An administrator
 *                  approving that request opens the other twelve at once,
 *                  rather than the student working through them in order.
 */
export const EXTRA_STAGES = [
  {
    title: STAGE5_TITLE,
    icon: "plane",
    tone: "teal",
    status: "published",
    rules: { requiresPlan: "full_service" },
    steps: STAGE5_STEPS,
  },
];

/** Kept for the importer's archive check, which only needs the titles. */
export const PLACEHOLDER_STAGES = EXTRA_STAGES;

/* ── Link and video labels ───────────────────────────────────────────────── */

/* "Never show raw URLs. Use proper buttons." Every address that appears in a
   Learn cell gets the button label the Excel's own wording implies. */
const LINK_LABELS = [
  [/passeport\.ma/i, "Apply for your passport"],
  [/apostille\.ma/i, "Open the Apostille portal"],
  [/atajtraduction/i, "Find a certified translator"],
  [/wafaimaassistance/i, "Buy your health insurance"],
  [/airarabia/i, "Book flights with Air Arabia"],
  [/booking\.com/i, "Book accommodation on Booking.com"],
];

export const linkLabel = (url) => LINK_LABELS.find(([re]) => re.test(url))?.[1] ?? "Open the official website";

const VIDEO_TITLES = [
  [/i1_pQvKonRA/, "Passport application tutorial"],
  [/LxsxxVM6Y-I/, "Criminal record certificate tutorial"],
];

export const videoTitle = (url) => VIDEO_TITLES.find(([re]) => re.test(url))?.[1] ?? "Tutorial";

/* ── Message templates ──────────────────────────────────────────────────────
   Every automated message the journey sends, keyed by the event that raises it
   and the channel it travels on. Seeded into public.journey_templates, where an
   administrator can reword it without a deploy.

   {{placeholders}} are filled from the context the caller passes to
   journey_emit. A channel a step should not use is simply absent.

   WhatsApp rows are written now and queued now; only the transport is missing.
   That is the whole point of the outbox: switching the channel on later drains
   a queue instead of touching a single caller. */

export const TEMPLATES = {
  /* Stage 4 unlock. "Automatically send an Important Preparation notification
     inside the platform. Pin the notification at the top of the Notifications
     page until the student opens this Journey step. Mark it High Priority." */
  vfs_prepare: {
    platform: {
      title: "🔴 Prepare for Your VFS Appointment",
      body: "Your VFS appointment stage is now available. Before attending your appointment, please review the important requirements and travel instructions inside your Journey. Some documents and payments are mandatory for your appointment.",
      link: "journey",
      priority: "high",
      pinned: true,
    },
    whatsapp: {
      body: [
        "🎉 Congratulations! Your MIGRIS application stage has been completed.",
        "",
        "Your next step is preparing for your VFS appointment in Turkey.",
        "",
        "Before traveling, please review the important checklist inside your AfaqWay Journey. It contains mandatory documents, payment requirements, and appointment guidance.",
        "",
        "Open your Journey to continue.",
      ].join("\n"),
      link: "journey",
    },
  },

  /* "If the student has not opened the step within 48 hours, automatically send
     one reminder through both the platform and WhatsApp." */
  vfs_prepare_followup: {
    platform: {
      title: "🔴 Prepare for Your VFS Appointment",
      body: "You have not opened the VFS appointment step yet. It contains mandatory documents, payment requirements and appointment guidance you need before you travel.",
      link: "journey",
      priority: "high",
    },
    whatsapp: {
      body: [
        "A reminder about your VFS appointment in Turkey.",
        "",
        "Please open your AfaqWay Journey and review the preparation checklist. It contains mandatory documents and payment requirements you need before you travel.",
      ].join("\n"),
      link: "journey",
    },
  },

  /* The four appointment reminders. "Each reminder should include: appointment
     date, appointment time, VFS appointment title, reminder to bring all
     required original documents, reminder to arrive at least 15–30 minutes
     early." */
  vfs_reminder: {
    platform: {
      title: "VFS Appointment in {{when}}",
      body: "Your VFS appointment is on {{date}} at {{time}}.\n\nBring all of the required original documents.\nArrive at least 15–30 minutes before your appointment time.",
      link: "journey",
      priority: "high",
    },
    whatsapp: {
      body: "VFS Appointment in {{when}}\n\nYour VFS appointment is on {{date}} at {{time}}.\n\nBring all of the required original documents.\nArrive at least 15–30 minutes before your appointment time.",
      link: "journey",
    },
  },

  /* Residence permit approved. */
  trp_approved: {
    platform: {
      title: "🎉 Your Temporary Residence Permit has been approved",
      body: "Congratulations. Open your Journey to continue to the next stage.",
      link: "journey",
      priority: "high",
    },
    chat: {
      body: [
        "🎉 Congratulations on receiving your Lithuanian Temporary Residence Permit!",
        "",
        "We are incredibly happy for you and proud to have been part of your journey.",
        "",
        "Your next stage is preparing for your arrival in Lithuania. If you need any assistance, our team is here to help.",
      ].join("\n"),
    },
    whatsapp: {
      body: [
        "🎉 Congratulations!",
        "",
        "Great news! Your Lithuanian Temporary Residence Permit has been approved.",
        "",
        "We wish you safe travels and every success in your studies.",
        "",
        "Welcome to the AfaqWay family! 🇱🇹💙",
      ].join("\n"),
    },
    email: {
      title: "Your Lithuanian Temporary Residence Permit has been approved",
      body: "Great news! Your Lithuanian Temporary Residence Permit has been approved. Open your AfaqWay Journey to continue to the next stage.",
    },
  },

  /* Residence permit rejected. "Automatically open the Platform Chat. Create a
     new support conversation if one does not already exist. Send an automatic
     first message from the system." */
  trp_rejected: {
    platform: {
      title: "Your residence permit decision needs our support",
      body: "Open your conversation so our advisors can review your case with you.",
      link: "messages",
      priority: "high",
    },
    chat: {
      body: [
        "We are sorry to hear that your residence permit application was not approved.",
        "",
        "Please send us your rejection letter or explain the reason provided by the Migration Department so our advisors can review your case and discuss the available options with you.",
      ].join("\n"),
    },
    whatsapp: {
      body: [
        "We noticed that your TRP application was rejected.",
        "",
        "Please contact our support team as soon as possible so we can review your case and discuss the next available options.",
      ].join("\n"),
      link: "messages",
    },
    email: {
      title: "About your Lithuanian residence permit decision",
      body: "We noticed that your residence permit application was not approved. Please contact our support team so we can review your case and discuss the available options with you.",
    },
  },

  /* Generic, raised by the roadmap whenever a stage opens. */
  stage_unlocked: {
    platform: {
      title: "Stage unlocked: {{stage}}",
      body: "Your next stage is open. Open your Journey to see what comes next.",
      link: "journey",
    },
  },

  /* Raised when a step the Excel lets the student settle themselves is done. */
  step_completed: {
    platform: {
      title: "Step completed: {{step}}",
      body: "Your Journey has been updated.",
      link: "journey",
    },
  },
};

/** The four VFS appointment reminders, exactly as the Excel lists them. */
export const VFS_REMINDERS = [
  { hoursBefore: 24 * 7, when: "7 days" },
  { hoursBefore: 24 * 3, when: "3 days" },
  { hoursBefore: 24, when: "24 hours" },
  { hoursBefore: 2, when: "2 hours" },
];
