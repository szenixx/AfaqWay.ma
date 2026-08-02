/* Stage 5 — After Arrival in Lithuania.
 *
 * The first stage that does not come from the Excel. It is written here instead,
 * in the same shape the importer already understands, so it reaches the database
 * through exactly the same path as Stages 1-4 and an administrator edits it in
 * exactly the same screens.
 *
 * Content is Markdown, one document per Learn module, stored on a `module`
 * block. The brief asks for Markdown storage and for administrators to edit,
 * hide, reorder, publish and unpublish each module without a developer — all of
 * which a block already does.
 *
 * RESEARCHED, NOT INVENTED. Every fact below was checked against an official or
 * primary source in August 2026, and the module links to that source so a
 * student can confirm it and an administrator can re-check it later:
 *
 *   Migration Department            migracija.lt · migracija.lrv.lt
 *   Vilnius municipality            vilnius.lt · govilnius.lt
 *   Sodra (health insurance)        sodra.lt
 *   Lithuanian Student Card         lsp.lt        ISIC Lithuania  isic.lt
 *   Vilnius public transport        judu.lt       Vilnius Airport vilnius-airport.lt
 *   Banks                           swedbank.lt · seb.lt · luminor.lt
 *   Mobile operators                labas.lt · pildyk.lt · ezys.lt
 *   Employment Service              uzt.lt        Jobs            cvbankas.lt
 *   Study in Lithuania              studyin.lt
 *
 * PRICES ARE THE FIRST THING TO GO STALE. Where a figure genuinely helps a
 * student plan, it is given as a range, dated, and paired with the official page
 * that carries the current number — never presented as a quote.
 */

/* Every step after the first is opened by the support step, so its title is
   written once and referenced, rather than repeated thirteen times. */
export const STAGE5_TITLE = "Arrival in Lithuania";
const SUPPORT_STEP = "Congratulations! Welcome to Lithuania 🎉";

/** Shorthand: a Learn module is a title, a one-line summary and Markdown. */
const mod = (title, summary, body) => ({ kind: "module", title, data: { summary }, body: body.trim() });

export const STAGE5_STEPS = [
  /* ── 1 ─────────────────────────────────────────────────────────────────── */
  {
    title: SUPPORT_STEP,
    description:
      "Congratulations on successfully receiving your Temporary Residence Permit and arriving safely in Lithuania. You have officially started your new academic journey. If you need help with accommodation, university procedures, documents, banking, healthcare, transportation, or everyday life, the AfaqWay Support Team is ready to assist you. Complete this support step to unlock the remaining onboarding journey.",
    /* The one step in the stage an administrator has to answer. It is a request
       for help, so it is submitted for review and can only be approved. */
    cta: "Chat with Support",
    support: true,
    approveOnly: true,
    blocks: [
      mod(
        "Welcome to Your New Journey",
        "What to expect in your first days in Lithuania, and how this stage will help you settle in.",
        `
You made it. Getting a Temporary Residence Permit and moving to another country is genuinely hard, and you have already done the hardest part.

The next few weeks are about turning a place you have arrived in into a place you live. This stage walks you through that, one task at a time.

## What your first week usually looks like

- **Day 1** — get to your accommodation, buy a Lithuanian SIM card, get some cash or check your card works, eat, sleep.
- **Days 2-3** — find the nearest supermarket and pharmacy, work out how to reach your university, get a public transport card.
- **Days 4-7** — go to your university's international office, complete enrolment, collect your student ID, and start your residence declaration.

Do not try to do everything on the first day. Almost nothing here has a same-week deadline except your residence declaration, and we will remind you about that one.

## How this stage is organised

Each step below is a small, self-contained job with a Learn section that explains it and a **Done** button you press when you have finished. You can work through them in any order once this first step is approved.

Some steps are urgent, some can wait:

| Do first | Can wait a week or two |
| --- | --- |
| SIM card, university enrolment, residence registration | Banking, healthcare registration, transport card |
| | Finding a job, social activities, study habits |

## How AfaqWay keeps supporting you

Your relationship with us does not end when you land. Press **Chat with Support** on this step and a real person from our team will contact you on WhatsApp. Use it whenever something is confusing, not only when something is wrong.

> [!TIP] There is no such thing as a question that is too small. "Which bus goes to campus?" is a perfectly good reason to message us.

## What you'll accomplish in this stage

- [ ] Talk to the AfaqWay support team and unlock the rest of this stage
- [ ] Find safe, affordable accommodation and understand your rental contract
- [ ] Complete your first-week arrival checklist
- [ ] Get a Lithuanian phone number
- [ ] Finish your university enrolment and collect your student ID
- [ ] Declare your place of residence
- [ ] Open a Lithuanian bank account
- [ ] Understand how to see a doctor
- [ ] Get a student public transport card
- [ ] Build a realistic monthly budget
- [ ] Find part-time work, if you want it
- [ ] Meet people and settle into life here
- [ ] Set up study habits that will carry you through your degree
`,
      ),
      mod(
        "When to Contact Support",
        "Which situations you can handle yourself, and when to message the AfaqWay team.",
        `
Knowing when to ask for help saves you days. Here is how we think about it.

## Message us straight away

These are situations where a delay costs you money, time or legal standing:

- **Residence registration problems** — you have been refused, or you are close to the one-month deadline.
- **Anything official you do not understand** — a letter from the Migration Department, the municipality, or Sodra.
- **Accommodation gone wrong** — a landlord asking for money before a viewing, refusing a written contract, or keeping your deposit.
- **University enrolment blocked** — a missing or rejected document, or a deadline you cannot meet.
- **Bank account refused** — this is common and usually fixable, but it needs the right paperwork.
- **You are unwell and do not know where to go.**
- **Any request for payment you were not expecting.**

## You can usually handle these yourself

The Learn sections in this stage cover all of them:

- Buying a SIM card or topping it up
- Getting a public transport card and finding a bus route
- Everyday shopping, deliveries, and finding your way around
- Registering for a student club or event
- Setting up mobile banking once your account exists

> [!IMPORTANT] In a real emergency — a threat to life, health or safety — call **112** first, then tell us. 112 is free, works from any phone, and operators speak English.

## How to ask well

You will get a faster answer if your first message includes:

1. What you are trying to do
2. What happened instead
3. A photo of any document or error message
4. Your city and university

## Checklist

- [ ] Save the AfaqWay support number in your phone
- [ ] Save **112** in your phone
- [ ] Save your university's international office number
- [ ] Press **Chat with Support** below to start the conversation
`,
      ),
    ],
  },

  /* ── 2 ─────────────────────────────────────────────────────────────────── */
  {
    title: "Accommodation",
    description:
      "Finding safe and affordable accommodation is one of the first priorities after arriving in Lithuania. This step teaches you how to search for housing, compare options, understand rental agreements, and avoid common scams before signing a contract.",
    blocks: [
      mod(
        "Understanding Your Accommodation Options",
        "The housing options open to international students, and which suits you best.",
        `
There are five realistic options. Most students start with one and move to another after a few months.

## University dormitory

- **Cost** — usually the cheapest option, and billed monthly through the university.
- **Advantages** — no deposit games, no landlord, contract in English, other students around you, usually close to campus.
- **Disadvantages** — shared rooms or shared kitchens are common, limited places, and you often cannot choose your roommate.
- **Best for** — almost every new international student, for the first semester.

## Private student residence

- **Advantages** — modern buildings, private rooms, bills included, English-speaking staff.
- **Disadvantages** — more expensive than a dormitory; places fill early.
- **Best for** — students who want their own room without the risk of a private landlord.

## Shared apartment (a room in a flat)

- **Advantages** — cheaper than renting alone, and an easy way to meet people.
- **Disadvantages** — you inherit your flatmates and whatever contract already exists.
- **Best for** — the second semester onward, once you know the city.

## Private apartment

- **Advantages** — complete independence.
- **Disadvantages** — most expensive, needs a deposit, and the contract will often be in Lithuanian.
- **Best for** — students arriving with family, or in their second year.

## Temporary accommodation

A hostel or short-let for your first week, while you view places in person.

> [!TIP] Booking two weeks of temporary accommodation is not wasted money. It is what lets you refuse a bad apartment instead of signing it because you have nowhere to sleep.

## What things cost

Indicative monthly ranges for Vilnius as of early 2026. Kaunas, Klaipėda and Šiauliai are typically cheaper.

| Option | Typical monthly cost |
| --- | --- |
| University dormitory | Lowest — check your university's page |
| Room in a shared flat | around €280 |
| Studio apartment | around €460 |
| One-bedroom, city centre | €550-850 |

Always add utilities (heating, electricity, water, internet) unless the advert says they are included. Heating in winter is the item that surprises people.

## Recommended order

1. **Apply for a university dormitory** as early as you can — before you fly, if possible.
2. **Book temporary accommodation** for your first one to two weeks.
3. **Search verified long-term rentals** and view them in person.
4. **Sign only after a viewing**, with a written contract.

## Checklist

- [ ] Check whether your university still has dormitory places
- [ ] Book temporary accommodation for your first week
- [ ] Decide your maximum monthly budget, including utilities
- [ ] Shortlist three places to view in person
`,
      ),
      mod(
        "Safe Apartment Search",
        "Where Lithuanians actually look for rentals, and how to search them effectively.",
        `
## The main platforms

**[Aruodas.lt](https://en.aruodas.lt/)** — the largest property portal in Lithuania, with an English interface. Most serious long-term listings appear here first.

**[Skelbiu.lt](https://www.skelbiu.lt/)** — a large general classifieds site with a big rental section. More private landlords, fewer agencies.

**[Domoplius.lt](https://www.domoplius.lt/)** — a third portal worth checking; listings often overlap with Aruodas.

## How to search effectively

1. Set your **maximum price** and tick whether utilities are included.
2. Filter by **district**, not just city — then check the commute to your campus on Google Maps before you contact anyone.
3. Sort by **newest**. Good rentals in Vilnius are taken within days.
4. Save the search and check it every morning during your search week.

## How to contact a landlord

- Write in simple English. Most landlords in Vilnius and Kaunas manage.
- Say who you are in one line: *"I am an international student at [university], starting in September, looking for a long-term rental."*
- Ask three questions: is it still available, are utilities included, and when can you view it.

## Reading a listing properly

- **Photos** — too few, or clearly from a different season, is a bad sign.
- **Price against the table above** — anything far below market is bait.
- **Address** — a real listing names at least the district and street.

## Facebook Marketplace and Facebook groups

You will be pointed at student housing groups on Facebook. They do contain real rooms.

> [!WARNING] Facebook groups carry a much higher scam risk than Aruodas or Skelbiu. There is no verification, listings cannot be reported to a portal, and money sent to a stranger cannot be recovered. Treat anything found there with extra caution and never pay before a viewing.

## Checklist

- [ ] Create a saved search on Aruodas
- [ ] Create a saved search on Skelbiu
- [ ] Check the commute for every place before contacting the landlord
- [ ] Contact at least five listings — most will not reply
`,
      ),
      mod(
        "Avoiding Rental Scams",
        "The scams that target international students, and how to shut each one down.",
        `
International students are targeted because you are arranging housing from abroad, in a hurry, in a language you may not read. Every scam below relies on one thing: getting money before you see the apartment.

## The five common scams

**1. The listing that does not exist.** Photos stolen from a real advert, priced well below market, "available immediately".

**2. Deposit before viewing.** You are asked to "reserve" the flat. Once you pay, contact stops.

**3. The landlord who is abroad.** A convincing story about working in another country, so a viewing is "impossible", but they will "post the keys" after payment.

**4. Fake identity documents.** A scanned passport or ownership certificate sent to reassure you. Scans prove nothing.

**5. Invented fees.** "Agency processing fee", "reservation fee", "guarantee fee" — charges that do not exist in a normal Lithuanian rental.

## Warning signs

- Rent far below the ranges in the first module
- Pressure to decide today
- Refusal to do a video call, let alone a viewing
- Payment by Western Union, gift card, crypto, or to a personal account in another country
- The contract is refused, or only offered "after payment"
- The person's name does not match the ownership documents

## Safe practice

> [!IMPORTANT] Never pay a deposit or rent before you have seen the property in person and signed a written contract. There is no exception to this rule, however good the apartment looks.

- View in person. If you are still abroad, ask a friend, or wait until you arrive — this is exactly why you book temporary accommodation.
- Ask to see the owner's **ID and proof of ownership** and check the name matches the contract.
- Pay by **bank transfer only**, to a Lithuanian account in the landlord's name, once the contract is signed.
- Get a **receipt** for the deposit.
- Keep every message. A written trail is what makes a complaint possible.

## If you think you have been scammed

1. Stop paying immediately.
2. Contact your bank — a very recent transfer can sometimes be recalled.
3. Report it to the police by calling **112** or at your local station.
4. Message AfaqWay Support so we can help you with the report and find you somewhere to stay.

## Checklist

- [ ] I have seen the apartment in person
- [ ] I have seen the landlord's ID and proof of ownership
- [ ] I have a written contract in a language I can read
- [ ] I am paying by bank transfer to a Lithuanian account
- [ ] I have not paid anything before signing
`,
      ),
      mod(
        "Signing Your Rental Agreement",
        "What a Lithuanian rental contract should contain, and what to check before you sign.",
        `
A written contract protects you far more than it protects the landlord. Never rent without one.

## What the contract must state

- **Full names** of both parties, and the landlord's personal or company code
- **The exact address**, including apartment number
- **The monthly rent**, and the date it is due
- **The deposit amount** and the conditions for returning it
- **Which utilities are included** and which you pay separately
- **The contract length** and the notice period for ending it
- **An inventory** of furniture and appliances, with their condition

## The deposit

- Usually one month's rent, sometimes two.
- It is returned at the end of the contract, minus **documented** damage.
- Normal wear and tear is not damage.
- Photograph every room, including existing marks and scratches, on the day you move in, and email the photos to the landlord so they are timestamped.

## Utilities

Ask specifically whether the rent includes heating. Lithuanian winters are cold and heating is the largest variable bill, typically much higher between November and March. Also confirm electricity, water, internet and the building maintenance fee.

## Who is responsible for what

| Landlord | Tenant |
| --- | --- |
| Structural repairs, heating system, plumbing | Everyday cleaning and small repairs |
| Appliances that fail through normal use | Damage you or your guests cause |
| Registering the apartment for your residence declaration, if agreed | Paying rent and bills on time |

> [!MISTAKE] Signing a Lithuanian-only contract you cannot read. Ask for an English version or a translation. If the landlord refuses, that alone is a reason to walk away — and a good moment to message AfaqWay Support.

## Checklist before signing

- [ ] Names and address are correct
- [ ] Rent, due date and deposit are written down
- [ ] It says clearly which utilities are included
- [ ] Contract length and notice period are stated
- [ ] An inventory is attached
- [ ] I have move-in photos of every room
- [ ] I have a copy of the signed contract
- [ ] The landlord agrees to let me declare my residence at this address
`,
      ),
      mod(
        "Practical Tips",
        "Timing, districts, furniture and internet — the practical details that make a search work.",
        `
## When to search

- **July and August** are the busiest months, because every student is looking. Start early.
- **Mid-semester** (October, February) is quieter and prices soften.
- Dormitory applications usually open months before the semester — check your university's page now, not later.

## Choosing a district

Do not optimise for rent alone. A cheaper flat 45 minutes from campus costs you two hours a day and a transport card you use constantly. Check the door-to-door commute before you fall in love with a listing.

## Moving in

- **Furniture** — most Lithuanian rentals come furnished. If yours does not, IKEA delivers in Lithuania, and second-hand furniture is easy to find on Skelbiu.
- **Internet** — Telia, Bitė and Cgates all offer home broadband. Ask the landlord what is already installed; reusing an existing connection is much faster than a new installation.
- **Bedding and kitchen basics** are rarely included. Budget for one shopping trip in your first week.

## Winter, honestly

Lithuanian winters are long and dark. A flat with good heating and daylight matters more in January than it seems in September. Ask about window quality and heating type before signing.

## Accommodation Preparation Checklist

- [ ] Dormitory application submitted, or a decision made not to
- [ ] Temporary accommodation booked for arrival
- [ ] Budget set, including utilities
- [ ] Commute checked for each shortlisted place
- [ ] Viewings arranged in person
- [ ] Contract read, understood and signed
- [ ] Move-in photos taken
- [ ] Internet arranged
- [ ] Landlord agrees to the residence declaration
`,
      ),
    ],
  },

  /* ── 3 ─────────────────────────────────────────────────────────────────── */
  {
    title: "Arrived in Lithuania",
    description:
      "Congratulations on arriving safely. This step helps you complete your first arrival checklist and become familiar with your new environment.",
    blocks: [
      mod(
        "First Day Checklist",
        "What to do in your first 24 hours, in order.",
        `
Your first day has one goal: get safely to where you are sleeping, with a working phone and a way to pay for things. Everything else can wait.

## In order

1. **Passport control** — have your passport and your TRP or visa ready, plus your acceptance letter and accommodation address in case you are asked.
2. **Collect your luggage** and check nothing is missing before leaving the baggage hall.
3. **Get connected** — airport Wi-Fi first, then buy a Lithuanian SIM card (Step 4 covers which one).
4. **Cash or card** — Lithuania is close to cashless; contactless cards work almost everywhere, including on buses. Withdraw €50-100 for the rare cash-only situation.
5. **Travel to your accommodation** — public transport or a booked taxi. Do not accept an unofficial ride offered to you inside the terminal.
6. **Check in** and confirm you can get back in if you go out.
7. **Eat something** and buy water, bread and breakfast for the morning.
8. **Message your family** that you arrived.
9. **Lay out your university documents** for tomorrow — originals, not copies.

> [!TIP] Keep your passport, TRP, acceptance letter and rental contract together in one folder for your first month. You will be asked for them more often than you expect.

## First Day Checklist

- [ ] Cleared passport control
- [ ] Collected all luggage
- [ ] Lithuanian SIM card bought and working
- [ ] Some cash withdrawn
- [ ] Arrived at accommodation
- [ ] Food and water for tomorrow
- [ ] Family told you arrived safely
- [ ] University documents ready
`,
      ),
      mod(
        "Airport Guide",
        "Getting through a Lithuanian airport and into the city.",
        `
Most students arrive at **Vilnius Airport (VNO)**, some at Kaunas (KUN) or Palanga (PLQ).

## Arrivals, step by step

- **Passport control** — as a non-EU national you use the "All passports" lane. Have your TRP or visa, acceptance letter and accommodation address ready.
- **Baggage claim** — screens show your flight and belt number.
- **Customs** — green channel if you have nothing to declare. Cash of €10,000 or more must be declared.
- **Wi-Fi** — free at Vilnius Airport.
- **Currency exchange and ATMs** — available in Arrivals. Airport exchange rates are poor; withdraw from an ATM instead and change only what you need.

## From Vilnius Airport to the city

Buses leave from directly outside Arrivals.

- **Bus 3G** — Airport → city centre → Fabijoniškės
- **Bus 1** — Airport → central bus and railway stations (*Stotis*)
- Buses run roughly every 15-30 minutes and reach the centre in about 15 minutes
- A single ticket bought on board costs about **€1**, paid by contactless card at the validator
- You can also buy a transport card at the *Narvesen* shop in the terminal

There is also a short train link between the airport and the central railway station.

**Official page:** [Vilnius Airport — public transport](https://www.vilnius-airport.lt/en/before-the-flight/transport/by-public-transport) and [JUDU — Vilnius Airport by public transport](https://judu.lt/en/for-public-transport-passengers/vilnius-airport-by-public-transport/)

## Taxis

Use an app rather than a taxi rank: **Bolt** and **Uber** both operate in Lithuania, show the price before you accept, and keep a record of the trip.

> [!WARNING] Never accept a ride from someone who approaches you inside the terminal offering a taxi. Book through an app or use the official rank outside.

## Checklist

- [ ] Documents ready before passport control
- [ ] Connected to airport Wi-Fi
- [ ] Transport into the city decided before landing
- [ ] Bolt or Uber installed as a backup
`,
      ),
      mod(
        "Emergency Contacts",
        "Who to call, and when.",
        `
## 112 — the only number you must memorise

**112** is the single emergency number for Lithuania and the whole EU. It covers police, ambulance and fire.

- Free from any phone, including a phone with no credit and no SIM
- Works 24 hours
- Operators speak English
- Call it for any sudden threat to life, health, safety, the environment or property

**Official information:** [Migration Information Centre — what to do in an emergency](https://micenter.lt/en/what-to-do-in-a-case-of-emergency)

## When you call

Stay on the line and be ready to say:

1. **Where you are** — street, building number, city. If you do not know, describe what you can see.
2. **What happened**
3. **How many people are hurt**
4. **Your name and phone number**

> [!IMPORTANT] Do not hang up until the operator tells you to. They may need to give you instructions while help is on the way.

## Other numbers worth saving

| Who | When to contact them |
| --- | --- |
| **112** | Any emergency — police, ambulance, fire |
| Your university's international office | Enrolment, documents, university emergencies |
| Your dormitory reception or landlord | Water leak, heating failure, lock-out |
| Your embassy or consulate | Lost passport, serious legal trouble |
| AfaqWay Support | Anything you are unsure about |

Your country may not have an embassy in Vilnius; many are covered from Warsaw, Riga or Stockholm. Find yours now, before you need it, and save the number.

## Non-emergencies

For a health problem that is not an emergency, contact your family doctor or a clinic rather than calling 112 — Step 8 explains how. Pharmacies (*vaistinė*) can advise on minor issues and some are open late.

## Checklist

- [ ] 112 saved in my phone
- [ ] University international office saved
- [ ] Landlord or dormitory reception saved
- [ ] My embassy's details found and saved
- [ ] My own address written down somewhere I can read it aloud
`,
      ),
      mod(
        "First Week Recommendations",
        "Settling in comfortably over your first seven days.",
        `
## Groceries

The main chains are **Maxima**, **IKI**, **Rimi**, **Lidl** and **Norfa**. All have loyalty cards that are free and genuinely reduce prices — get one for whichever is nearest.

Open-air markets (*turgus*) are cheaper for fruit and vegetables. Halal shops exist in Vilnius and Kaunas; ask AfaqWay Support for the nearest one to you.

## Getting around

Walk your route to campus once before your first class, at the same time of day. Then set up your transport card — Step 9 covers student discounts, which are substantial.

## Banking

You do not need a Lithuanian account on day one; your existing card will work. But start the process in your first week, because it takes time and your university and landlord will both eventually want a local IBAN. Step 7 explains it.

## University orientation

Go, even if it is optional and even if you are tired. Orientation is where you meet the people who will answer your questions for the next three years, and where the international office explains things nobody writes down.

## Meet people early

The **Erasmus Student Network (ESN)** runs events in every Lithuanian university city and they are open to all international students, not only Erasmus. Going to one event in your first fortnight makes an enormous difference to how the year feels.

## Local rules worth knowing

- Drinking alcohol in public places is prohibited, and alcohol is not sold in shops after 20:00 (15:00 on Sundays).
- Smoking is banned on balconies of apartment buildings and in most public spaces.
- Jaywalking is fined; use crossings and wait for the green signal.
- Quiet hours apply at night in residential buildings.

## First Week Success Checklist

- [ ] Nearest supermarket and pharmacy found
- [ ] Loyalty card for the nearest supermarket
- [ ] Route to campus walked once
- [ ] University orientation attended
- [ ] Public transport card obtained
- [ ] Bank account application started
- [ ] One social event attended
- [ ] Residence declaration started
`,
      ),
      mod(
        "Useful Maps & Apps",
        "The applications that make daily life in Lithuania easier.",
        `
Install these in your first week. All have English interfaces.

## Getting around

- **Google Maps** — reliable public transport directions in Lithuanian cities, including live bus times.
- **[Trafi](https://www.trafi.com/)** — built in Lithuania. Combines buses, trolleybuses, scooters and taxis in one journey planner, and is what many locals actually use in Vilnius.
- **Bolt** — taxis, e-scooters and food delivery, all in one app.
- **Google Maps offline** — download the map of your city before you arrive, so navigation works before you have a SIM.

## Transport tickets

- **[JUDU](https://judu.lt/en/)** — the official Vilnius public transport app for tickets and timetables.
- **Kaunas** and other cities have their own official ticket apps; your university will tell you which.

## Daily life

- **Wolt** and **Bolt Food** — food delivery, and useful for groceries late at night.
- **Google Translate** — download Lithuanian for offline use. The camera translation is genuinely useful for reading official letters and food labels.
- Your **bank's app** — once your account exists, this is where Smart-ID lives, and Smart-ID is what logs you into government services.

## Government and health

- **[Sodra](https://www.sodra.lt/en)** — social insurance and health insurance status.
- **[e-Health portal](https://www.esveikata.lt/)** — appointments, prescriptions and medical records.
- **Smart-ID** — the digital identity most Lithuanian services expect. You set it up through your bank.

> [!TIP] Smart-ID is the single most useful thing you can set up after your bank account. It logs you into healthcare, government portals and your bank without a card reader.

## Checklist

- [ ] Google Maps with your city downloaded offline
- [ ] Trafi or your city's transport app installed
- [ ] Bolt installed
- [ ] Google Translate with Lithuanian downloaded
- [ ] Delivery app installed
- [ ] Smart-ID planned for after your bank account opens
`,
      ),
    ],
  },

  /* ── 4 ─────────────────────────────────────────────────────────────────── */
  {
    title: "Lithuanian SIM / eSIM",
    description:
      "A Lithuanian mobile number is essential for daily life. Learn how to choose the best provider, activate your SIM, and register your number correctly.",
    blocks: [
      mod(
        "Choosing the Best Mobile Provider",
        "How the Lithuanian market works and which operator suits a new international student.",
        `
Lithuania has three network operators — **Telia**, **Tele2** and **Bitė** — and each sells a cheaper prepaid brand on the same network.

| Prepaid brand | Network | Notes |
| --- | --- | --- |
| **[Labas](https://www.labas.lt/)** | Bitė | Popular with students, self-service through the *Mano Labas* app |
| **[Pildyk](https://pildyk.lt/)** | Tele2 | Consistently among the cheapest bundles; offers eSIM |
| **[Ežys](https://ezys.lt/)** | Telia | Simple plans on Telia's network; offers eSIM |
| Telia / Tele2 / Bitė contracts | — | Monthly contracts, usually need a Lithuanian bank account and TRP |

## What actually differs

- **Coverage** — all three cover the cities well. Bitė is generally strongest for speed in Vilnius and Kaunas; Tele2 usually wins on price.
- **Price** — the prepaid brands are much cheaper than contracts and need no credit check.
- **eSIM** — available on Ežys and Pildyk, useful if your phone supports it and you want to keep your home number active on the same device.
- **EU roaming** — included on Lithuanian plans, so your number works across the EU at no extra cost.

## Our recommendation for a new student

Start with **prepaid** — Labas, Pildyk or Ežys. You need no bank account, no contract and no credit history, and you can switch later once you are settled and know which network works best where you live.

**[Labas](https://www.labas.lt/)** is a reasonable default: widely available, well known among students, and managed through the *Mano Labas* self-service app.

> [!TIP] Do not sign a 24-month contract in your first week. Prepaid costs a little more per month but commits you to nothing while you are still working out where you will live.

## Checklist

- [ ] Checked whether my phone is unlocked
- [ ] Checked whether my phone supports eSIM
- [ ] Chosen a prepaid brand to start with
- [ ] Decided how much mobile data I actually need
`,
      ),
      mod(
        "Registration Requirements",
        "What you must bring, and why buying a SIM now requires ID.",
        `
## Registration is mandatory

Since **1 January 2025**, every prepaid SIM card in Lithuania must be registered to an identified person. This followed an amendment to the Electronic Communications Law. An unregistered card will not activate.

## What to bring

- **Your passport** — this is the document used for registration
- **Your TRP**, if you already have it — useful, though a passport is normally what is required
- A method of payment

## Where to register

- **In the shop** — the assistant registers the card while you wait. This is the simplest route and what we recommend for your first SIM.
- **Online** — some operators allow self-registration through their website or app after purchase. This can be harder with a non-Lithuanian document and no Smart-ID yet.

## Where to buy

- Operator shops in any shopping centre
- Supermarkets — Maxima, IKI, Rimi
- *Narvesen* and *Lietuvos spauda* kiosks
- Vilnius Airport, in Arrivals

> [!MISTAKE] Buying a SIM from an informal seller or accepting a "pre-registered" card from someone else. A number registered in another person's name can be cut off, and you cannot use it to verify a bank account or a government service.

## Checklist

- [ ] Passport with me when buying
- [ ] SIM registered at the point of sale
- [ ] Registration confirmed before leaving the shop
- [ ] Number saved and sent to family
`,
      ),
      mod(
        "SIM Activation",
        "Getting the card working, and what to do when it does not.",
        `
## Activating your card

1. Turn the phone off and insert the SIM, or scan the eSIM QR code.
2. Turn the phone on and enter the **PIN** printed on the card holder.
3. Wait for the network name to appear — this can take a few minutes.
4. Top up if the card did not come with credit.
5. Call or message someone to confirm it works both ways.

Keep the plastic card holder. It carries your **PUK** code, which is the only way to unlock the SIM if the PIN is entered wrongly three times.

## Getting mobile internet working

Data usually configures itself. If it does not:

- Check that **mobile data** is switched on
- Check that **data roaming** is off while you are in Lithuania
- Restart the phone
- If it still fails, ask the operator to send the **APN settings** by SMS

## Topping up

- The operator's own app — *Mano Labas*, *Pildyk*, *Ežys*
- Supermarket checkouts and kiosks
- Online with a card
- ATMs of the major banks

## Troubleshooting

| Problem | Usual cause |
| --- | --- |
| No network at all | SIM not registered, or the phone is locked to a foreign operator |
| "Emergency calls only" | Registration incomplete — go back to the shop with your passport |
| Calls work, internet does not | APN settings, or no data left in the bundle |
| SIM blocked | Wrong PIN three times — use the PUK from the card holder |

> [!WARNING] If you enter the PUK wrongly ten times the SIM is permanently dead and you have to buy a new one. If you are unsure, stop and go to the operator's shop.

## Checklist

- [ ] SIM inserted and network showing
- [ ] PUK code stored somewhere safe
- [ ] Test call made and received
- [ ] Mobile data working
- [ ] Top-up method set up
`,
      ),
      mod(
        "Choosing a Monthly Plan",
        "Matching a bundle to how you actually use your phone.",
        `
## What the bundles contain

Lithuanian prepaid bundles are usually monthly and combine minutes, SMS and data. Because your accommodation will have Wi-Fi and your university certainly will, most students need less mobile data than they expect.

| If you | Look for |
| --- | --- |
| Use Wi-Fi at home and on campus | A small bundle, a few GB |
| Navigate and stream on the move | A mid bundle, 20-50 GB |
| Tether your laptop regularly | Unlimited data |
| Call family abroad often | A bundle with international minutes, or use WhatsApp over data |

## Calling home

Do not pay for international minutes by default. WhatsApp, Telegram and similar apps work over data and cost nothing extra. Buy international minutes only if you need to reach a landline.

## EU roaming

Lithuanian plans include roaming across the EU under "roam like at home" rules, so your bundle works when you travel in Europe. Check the fair-use limit for data if you plan a long trip.

## Advice on budget

Start with the smallest bundle that covers a week, watch your actual usage for a month in the operator's app, then move up or down. Guessing high wastes money every month.

> [!TIP] Set a data warning in your phone's settings on the day you activate the SIM. It is much easier than discovering the bundle is gone on the 20th.

## Checklist

- [ ] Chosen a starting bundle
- [ ] Auto top-up or a monthly reminder set
- [ ] Data warning configured on the phone
- [ ] Family calling set up over WhatsApp rather than paid minutes
- [ ] Usage reviewed after the first month
`,
      ),
    ],
  },

  /* ── 5 ─────────────────────────────────────────────────────────────────── */
  {
    title: "University Enrollment",
    description: "Complete your university enrollment and activate all academic services.",
    blocks: [
      mod(
        "Enrollment Process",
        "The route from arriving in the city to being a formally enrolled student.",
        `
Every Lithuanian university runs this slightly differently, but the shape is the same everywhere. Your international office is the authority — this is the map.

## The roadmap

1. **Contact the international office** before or immediately after you arrive, and ask when to come in.
2. **Book an arrival appointment**, if your university uses appointments. Many do in September.
3. **Bring your original documents** — the same ones you submitted during your application, not copies.
4. **Identity verification** — passport and TRP checked against your file.
5. **Sign the study agreement**, if you have not already signed it electronically.
6. **Confirm tuition payment status** with the finance office.
7. **Receive your student ID** and your student number.
8. **Activate your university account** — email, student portal, Wi-Fi.
9. **Collect your timetable** and confirm your study group.

> [!IMPORTANT] Do not leave enrolment until the week classes start. September is the busiest period of the year for every international office in the country, and some steps have queues.

## If something is missing

Missing or incorrect documents are common and almost always fixable. Tell the international office immediately rather than waiting — and tell AfaqWay Support at the same time, so we can help you get a replacement or a translation.
`,
      ),
      mod(
        "University Checklist",
        "Every enrolment task, with a note on which are universal and which vary.",
        `
Universities differ. Items marked *(varies)* are required by some Lithuanian universities and not others — always confirm with your own international office.

## Documents and identity

- **Submit original documents** — diploma, transcript, passport, TRP. Universal.
- **Certified translations** *(varies)* — required where your originals are not in English or Lithuanian.
- **Photograph for your student ID** *(varies)* — some take it on the spot, some want one in advance.

## Accounts and access

- **Student ID card** — universal. This is also your library card and often your building access.
- **University email address** — universal, and it becomes the official channel for everything. Check it.
- **Student portal account** — universal. Grades, registration, certificates.
- **Moodle or equivalent** *(varies by system)* — where course materials and assignments live.
- **Campus Wi-Fi / eduroam** — universal. Set it up while you are on campus and someone can help.
- **Building access activation** *(varies)* — dormitories and some faculties.

## Money and status

- **Confirm tuition payment** — universal. Ask for written confirmation your balance is clear.
- **Student status certificate** — request one immediately. You will need it for your bank, your transport discount and sometimes your residence declaration.

## Academic

- **Timetable access** — universal.
- **Study group assignment** *(varies)* — common on programmes with seminar groups.
- **Elective / optional course registration** *(varies)* — often has an early deadline. Ask.

## Enrollment Checklist

- [ ] Original documents submitted
- [ ] Identity verified
- [ ] Student ID collected
- [ ] University email working
- [ ] Student portal password set
- [ ] Moodle or learning platform accessible
- [ ] Campus Wi-Fi connected
- [ ] Tuition status confirmed in writing
- [ ] **Student status certificate obtained**
- [ ] Timetable found
- [ ] Elective registration deadline checked
`,
      ),
      mod(
        "Required Documents",
        "What universities ask for, why, and the mistakes that cause delays.",
        `
## The documents

**Passport** — proves your identity and your right to be in the country. Must be valid; a passport expiring during the academic year causes problems with both the university and the Migration Department.

**Temporary Residence Permit (TRP)** — proves your legal status. Take the physical card, not a photograph of it.

**Original diploma and transcript** — the university must see the originals it admitted you on. They may photocopy and return them, or hold them briefly.

**Certified translations** — where your documents are not in English or Lithuanian. The translation must be done by a certified translator; a translation you did yourself is not accepted.

**Legalisation or apostille** — you completed this in Stage 1. Bring the apostilled versions, not only the plain originals.

**Acceptance letter and study agreement** — your proof of admission and its terms.

**Photograph** — passport-style, for your student ID, where the university does not take one on site.

**Proof of tuition payment** — a bank confirmation or receipt.

## Common mistakes

> [!MISTAKE] Bringing photocopies instead of originals. This is the single most common reason a student is sent away and asked to come back.

- Leaving originals in your home country because you were worried about losing them
- A translation that does not include the translator's certification
- A name spelled differently across documents — passport, diploma and acceptance letter must match
- An apostille attached to the translation rather than the original, or the other way round, depending on what your university asked for
- Assuming a document accepted for your visa is automatically accepted by the university

## Verification notes

Keep a **digital copy of everything** in cloud storage before you hand anything over, and note the date you submitted each document and who took it. If a document goes missing, that record is what resolves it.

## Checklist

- [ ] All originals physically with me
- [ ] Certified translations included
- [ ] Apostilles attached correctly
- [ ] Names match across every document
- [ ] Digital copies stored in the cloud
- [ ] Record kept of what I submitted and when
`,
      ),
      mod(
        "University Resources",
        "The services you are already paying for and should start using.",
        `
## The international office

Your first stop for anything about documents, status, visas or enrolment. They deal with these questions daily and will know your situation better than a general enquiry desk.

## The library

More than books: study spaces, computers, printing, and access to academic databases you would otherwise pay for. Your student ID is your library card.

## The student portal

Where grades, course registration, certificates and your academic record live. Learn to download a **student status certificate** yourself — you will need one repeatedly, and self-service is faster than asking.

## Moodle or your learning platform

Course materials, assignment submission and deadlines. Turn on notifications; missed deadlines in the first semester are almost always missed announcements.

## Academic support

Most universities offer writing help, language support and study skills workshops, usually free and usually under-used. If academic English is hard for you, this is the cheapest fix available.

## Career centre

Part-time jobs, internships and CV help. Step 11 covers the job search itself, but the career centre is where the university-vetted opportunities are.

## Student union

Represents students, runs events, and is the right place to go if you have a problem with a course or a grade and do not know the process.

## Finding your own university's links

Search your university's site for "international students", or ask the international office for their student handbook. Every Lithuanian university publishes one, usually in English, and it answers most of these questions in one document.

National information for international students: **[Study in Lithuania](https://studyin.lt/)**

## Checklist

- [ ] International office location and email saved
- [ ] Library visited and card working
- [ ] Student portal bookmarked
- [ ] Learning platform notifications on
- [ ] Student handbook downloaded
- [ ] Career centre location noted
- [ ] Student union channel followed
`,
      ),
    ],
  },

  /* ── 6 ─────────────────────────────────────────────────────────────────── */
  {
    title: "Residence Registration",
    description:
      "After settling into your accommodation, you may need to register your place of residence depending on your municipality and university requirements. This step explains the complete process and helps you understand what is required.",
    blocks: [
      mod(
        "Understanding Residence Registration",
        "What declaring your place of residence means, and when you have to do it.",
        `
## What it is

Declaring your place of residence (*gyvenamosios vietos deklaravimas*) tells the Lithuanian state the address where you actually live. It is a civil registration, not an immigration application, and it is separate from your TRP.

Your declared address is what the state, your municipality and many services use to reach you.

## Why it matters to you

- It is a **legal obligation** for residents of Lithuania, including foreign students.
- Banks, clinics and municipal services may ask for it.
- Some student discounts and municipal services are tied to a declared address.
- Failing to declare can result in **administrative liability**.

## When you declare it

You have a choice, and this is the part most students get wrong:

1. **When applying for your residence permit** — if you indicated your Lithuanian address in your residence permit application, the address is recorded then and **you do not need to declare separately**.
2. **After collecting your TRP** — declare at your local **eldership** (*seniūnija*) or the Migration Department, normally **within one month**.

> [!IMPORTANT] Check which of these applies to you before queuing anywhere. If you gave an address in your MIGRIS application, you may already be declared. If you are not sure, ask AfaqWay Support or the Migration Department.

## The space requirement

Foreign nationals coming to Lithuania for studies must have a living space of **at least 4 square metres** per person at the declared address. A landlord or dormitory that cannot meet this cannot host your declaration.

## Official sources

- [Migration Department — declaring your place of residence](https://www.migracija.lt/en/-/foreigners-can-also-declare-their-place-of-residence-at-the-migration-department)
- [Migration Department (Ministry of the Interior)](https://migracija.lrv.lt/en/)

## Checklist

- [ ] Checked whether I already declared an address in my MIGRIS application
- [ ] Confirmed the one-month deadline from collecting my TRP, if it applies
- [ ] Confirmed my accommodation meets the 4 m² requirement
- [ ] Confirmed my landlord or dormitory will consent
`,
      ),
      mod(
        "Municipality Registration Process",
        "How the declaration actually works, step by step.",
        `
## The roadmap

1. **Find your eldership** (*seniūnija*). Each municipality is divided into elderships, and you go to the one covering your address. Your municipality's website lists them.
2. **Check whether an appointment is needed.** Larger cities generally use booking systems; some elderships accept walk-ins.
3. **Bring the landlord, or bring their consent.** The property owner normally has to consent to your declaration — either in person, or with a written, signed consent form.
4. **Submit the declaration** with your documents.
5. **Receive confirmation.** Ask for a printed or electronic confirmation and keep it.

## Online options

Lithuania has strong e-government, and declaration can often be completed electronically through the national portal — but this generally requires **Smart-ID or a qualified electronic signature**, which you will only have after your bank account exists. For most new students the in-person route is faster on arrival.

You can also declare at the **Migration Department** rather than the eldership.

## Processing time

The declaration itself is usually completed during the visit. Delays come from appointments and from landlord consent, not from the processing.

## Common mistakes

> [!MISTAKE] Arriving without the property owner or their written consent. This is the most common reason students are turned away and have to book a second appointment.

- Going to the wrong eldership for your address
- Bringing a rental contract that does not name you
- Assuming a dormitory has already declared you — ask reception explicitly
- Leaving it past the one-month deadline

## Checklist

- [ ] Correct eldership identified
- [ ] Appointment booked, if required
- [ ] Landlord attending, or written consent obtained
- [ ] Documents gathered
- [ ] Confirmation received and saved
`,
      ),
      mod(
        "Required Documents",
        "What to bring, and why each item is asked for.",
        `
## What you may be asked for

**Passport** — proves your identity. Always required.

**Temporary Residence Permit (TRP)** — proves you are legally resident and entitled to declare an address. Bring the card.

**Rental agreement** — proves you have a right to live at the address you are declaring. It must name you as the tenant.

**Owner's consent** — the property owner agreeing to your declaration at their address. Either the owner attends in person with their ID, or provides a signed consent form.

**Dormitory confirmation** — if you live in university accommodation, a letter from the university or dormitory administration replaces the rental agreement and owner consent.

**University confirmation / student status certificate** — not always required for the declaration itself, but useful to have and often requested alongside.

**Completed declaration form** — provided at the eldership, or downloadable from your municipality's website.

## Why each is required

The declaration links a *person* to an *address*. So the officer needs to establish three things: that you are who you say you are (passport), that you may legally reside in Lithuania (TRP), and that you have a genuine right to that specific address (contract plus owner consent, or dormitory confirmation).

## Verification notes

Take **originals and one photocopy of each**. Bring your landlord's phone number in case a question comes up that only they can answer. Photograph the completed form before you hand it in.

## Checklist

- [ ] Passport
- [ ] TRP card
- [ ] Rental agreement naming me, or dormitory confirmation
- [ ] Owner present or written consent signed
- [ ] Photocopies of everything
- [ ] Landlord reachable by phone during the appointment
`,
      ),
      mod(
        "City-Specific Information",
        "Where to start in the main Lithuanian student cities.",
        `
Procedures are set nationally, but the office you visit and the booking system are local. Start with your own municipality.

## Vilnius

Vilnius publishes a dedicated English page for foreign nationals declaring residence, including which documents to bring and how to book.

- [Vilnius municipality — declaration of foreign nationals' place of residence](https://vilnius.lt/savivaldybe/deklaravimas/declaration-of-foreign-nationals-place-of-residence-in-vilnius)
- [Go Vilnius — practical information for newcomers](https://www.govilnius.lt/)

## Kaunas, Klaipėda, Šiauliai, Panevėžys and elsewhere

Search your municipality's own site for *deklaravimas* (declaration) or ask your university's international office, which handles this every September and will know the local office and its habits.

## If you are not sure which city applies

It is the municipality of the address where you **actually live**, not where you study, if the two differ.

## A national fallback

The **Migration Department** accepts declarations regardless of municipality, which is useful if your local eldership has no appointments.

- [Migration Department](https://www.migracija.lt/en)
- [Migration Information Centre — practical guides in English](https://micenter.lt/en/declaration-of-residence)

## Checklist

- [ ] My municipality's declaration page found
- [ ] The correct office and its address noted
- [ ] Booking method understood
- [ ] Opening hours checked
`,
      ),
      mod(
        "Practical Advice",
        "Avoiding the delays that catch students out.",
        `
## Start early

The one-month clock, where it applies, runs from collecting your TRP — not from when you find an apartment. If you are still in temporary accommodation, tell AfaqWay Support so we can help you plan.

## Landlord reluctance

Some landlords hesitate to allow a declaration. It is worth knowing:

- Declaration does not give you ownership rights.
- It does not prevent the landlord from ending the tenancy under the contract.
- Agree it **before you sign** the rental contract, and get it in writing. A landlord who refuses is a reason to keep looking.

> [!WARNING] Never declare an address you do not actually live at, and never accept an offer to "register" you at an address for a fee. A false declaration is a legal problem for you, not for the person selling it.

## What to expect on the day

- Bring everything on the document list, plus photocopies.
- Not every officer speaks fluent English. Google Translate on your phone is genuinely useful, and so is asking a Lithuanian-speaking friend to come.
- The visit itself is usually short.

## Keep the confirmation

Save the confirmation digitally and on paper. Banks, clinics and the university may all ask for it, and getting a duplicate is slower than keeping the original.

## Where to ask for help

- Your university's international office
- [Migration Information Centre](https://micenter.lt/en) — free advice for foreigners in Lithuania
- AfaqWay Support

## Residence Registration Checklist

- [ ] Established whether I already declared during my MIGRIS application
- [ ] Landlord consent agreed in writing
- [ ] Correct office identified and appointment booked
- [ ] Passport, TRP, contract and consent gathered
- [ ] Declaration submitted
- [ ] Confirmation saved digitally and on paper
- [ ] Deadline met
`,
      ),
    ],
  },

  /* ── 7 ─────────────────────────────────────────────────────────────────── */
  {
    title: "Banking",
    description:
      "Opening a local bank account will make it easier to receive payments, pay rent, manage daily expenses, and access many university and government services.",
    blocks: [
      mod(
        "Why You Need a Lithuanian Bank Account",
        "What a local IBAN unlocks that a foreign card does not.",
        `
You can survive on a foreign card for a few weeks. You cannot run your life here on one.

## What needs a local account

- **Rent** — most landlords expect a transfer from a Lithuanian account, and some will not accept anything else.
- **Tuition instalments** — paying from abroad each time means transfer fees and delays.
- **A salary** — if you take a part-time job, your employer will need a Lithuanian IBAN.
- **Utility bills and your phone contract** — direct debits need a local account.
- **Smart-ID** — the digital identity that logs you into government services, healthcare and your university is set up through a Lithuanian bank. This is the quiet reason a local account matters most.

## What it saves you

- No foreign transaction fees on daily spending
- No poor exchange rate on every coffee
- Instant SEPA transfers within the EU
- Student discounts some banks offer on account fees

> [!TIP] Open the account early even if you do not need it yet. The process takes time, and Smart-ID depends on it.

## Checklist

- [ ] Understood why a local account matters
- [ ] Decided roughly when to open it
- [ ] Kept my foreign card as a backup
`,
      ),
      mod(
        "Choosing the Best Student Bank",
        "How the main options compare for an international student.",
        `
## The traditional banks

**[Swedbank](https://www.swedbank.lt/)** — the largest retail bank in Lithuania, with the widest branch and ATM network. Runs a youth programme for customers under 22, which can mean reduced fees. Good English support online.

**[SEB](https://www.seb.lt/en)** — large, well-established, strong mobile app, English interface.

**[Luminor](https://www.luminor.lt/en)** — present across the Baltics. Allows remote account opening for non-citizens who already have a qualified Smart-ID or mobile signature; without those you visit a branch.

**Šiaulių bankas** — smaller Lithuanian bank, sometimes more flexible with newcomers, but a smaller branch network and less English-language support online.

## The fintech option

**Revolut** — a licensed Lithuanian institution, so a Revolut account carries a Lithuanian IBAN. Opening is fast and entirely in-app, and it is excellent for spending and currency exchange.

> [!WARNING] Do not rely on a fintech account alone. Some landlords, employers and institutions still expect a traditional bank, and Smart-ID generally comes through a traditional bank. Many students use Revolut for daily spending and a traditional bank for everything official.

## Comparison

| | Branch network | English support | Remote opening | Smart-ID | Best for |
| --- | --- | --- | --- | --- | --- |
| Swedbank | Largest | Good | Usually in branch | Yes | Most students |
| SEB | Large | Good | Usually in branch | Yes | Strong app |
| Luminor | Medium | Good | With Smart-ID | Yes | Baltic-wide |
| Šiaulių bankas | Smaller | Limited | In branch | Yes | Flexibility |
| Revolut | None | Excellent | Fully in-app | No | Daily spending |

## Our recommendation

Open a **traditional bank account** — Swedbank or SEB are the safest defaults for a new international student — and add **Revolut** alongside it if you travel or send money home.

## Checklist

- [ ] Chosen a main bank
- [ ] Checked whether it has a student or youth account
- [ ] Located the nearest branch
- [ ] Decided whether to add a fintech account
`,
      ),
      mod(
        "Opening Your Account",
        "The route from booking an appointment to a working card.",
        `
## The roadmap

1. **Book an appointment.** Walk-ins are often refused. Book online or by phone, and ask for an English-speaking adviser.
2. **Gather your documents** — see below.
3. **Attend the appointment.** Expect 30-60 minutes and questions about why you need the account.
4. **Sign the agreement.**
5. **Receive your IBAN** — usually the same day.
6. **Set up online banking** before you leave the branch.
7. **Receive your debit card** — normally posted within about a week, or collected from the branch.
8. **Activate the card** at an ATM with its PIN.
9. **Set up Smart-ID** once your account is active.

## What to bring

- **Passport** — always required.
- **Temporary Residence Permit** — or a certificate from the Migration Department confirming your right to reside.
- **Student status certificate** from your university — this is the document that explains *why* you need a Lithuanian account, and it is the one students most often forget.
- **Proof of address** — rental contract or dormitory confirmation.
- **Your Lithuanian phone number** — needed for verification.
- Sometimes: a document showing your **country of tax residence**.

> [!MISTAKE] Arriving without a student status certificate. Banks must document why a non-resident needs an account, and "I am studying here" is not enough without proof. Get the certificate during enrolment (Step 5).

## If you are refused

It happens, and it is usually about missing documentation rather than about you. Ask exactly which document is missing, get it, and rebook — or try another bank. Tell AfaqWay Support and we will help.

## Checklist

- [ ] Appointment booked
- [ ] Passport, TRP, student certificate and proof of address gathered
- [ ] Lithuanian phone number active
- [ ] Account opened and IBAN received
- [ ] Online banking working
- [ ] Card received and activated
- [ ] Smart-ID set up
`,
      ),
      mod(
        "Online Banking",
        "Day-to-day digital banking in Lithuania.",
        `
## Mobile banking

Every major Lithuanian bank has a good mobile app in English. Install it at the branch while someone can help you log in for the first time.

## Smart-ID

**Smart-ID** is the digital identity most Lithuanian services expect. Once set up through your bank, it logs you into:

- Your bank
- Government and municipal e-services
- The [e-Health portal](https://www.esveikata.lt/)
- Many university systems

You approve each login by entering a PIN on your phone. Set it up as soon as your account is open — it removes friction from almost everything else in this stage.

## Transfers

- **Within Lithuania and the EU** — SEPA transfers, usually instant or same-day, and typically free or very cheap.
- **Outside the EU** — slower and more expensive. For sending money home, compare your bank against Revolut or Wise before assuming the bank is best.

To make a transfer you need the recipient's **IBAN** and name. Always check the IBAN twice; a transfer to a wrong-but-valid IBAN is very hard to recover.

## Cards and payments

- Contactless is accepted almost everywhere, including on buses.
- **Apple Pay** and **Google Pay** are supported by the major Lithuanian banks.
- Freeze and unfreeze your card from the app if you misplace it — faster than calling.

## Security

> [!IMPORTANT] No bank will ever ask for your Smart-ID PIN, your password or a code by phone, email or WhatsApp. Anyone who does is stealing from you. Approve a Smart-ID request only when you started the action yourself.

- Turn on transaction notifications
- Never approve a login you did not initiate
- Use the official app, not a link from a message

## Checklist

- [ ] Mobile banking app installed and working
- [ ] Smart-ID set up and tested
- [ ] Transaction notifications on
- [ ] Apple Pay or Google Pay added
- [ ] Card freeze feature located in the app
`,
      ),
      mod(
        "Financial Tips",
        "Keeping control of your money as a student.",
        `
## Separate your money

Keep two pots: one for **fixed costs** (rent, bills, phone) and one for **spending**. Move the fixed amount aside on the day money arrives. Most banking apps support a savings space or second account for exactly this.

## Avoid the common fees

- **Foreign currency** — spending on a home-country card in Lithuania costs you on every purchase. Move to your local card.
- **ATM withdrawals** — use your own bank's ATMs; other networks charge.
- **Airport exchange** — the worst rate you will find. Withdraw from an ATM instead.
- **Monthly account fees** — ask about a student or youth account.

## Sending money home

Compare your bank against Revolut and Wise. Look at the **total** cost — fee plus exchange margin — not the headline fee.

## Build a small buffer

Aim for one month of rent set aside. It turns a broken laptop or an unexpected trip from a crisis into an inconvenience.

> [!MISTAKE] Keeping everything in one account and judging your budget by the balance. The balance always looks fine until rent day.

## Student Banking Checklist

- [ ] Lithuanian account open and card working
- [ ] Smart-ID active
- [ ] Fixed costs separated from spending money
- [ ] Rent standing order or reminder set
- [ ] Cheapest route for sending money home identified
- [ ] Emergency buffer started
- [ ] Account fees checked and a student account requested
`,
      ),
    ],
  },

  /* ── 8 ─────────────────────────────────────────────────────────────────── */
  {
    title: "Healthcare",
    description:
      "Understanding the healthcare system will help you receive medical assistance quickly and confidently whenever you need it.",
    blocks: [
      mod(
        "Understanding Healthcare in Lithuania",
        "How the system is organised, and where you fit into it.",
        `
Lithuania has a public healthcare system funded through compulsory health insurance, alongside a private sector.

## Public healthcare

Funded through **compulsory health insurance** (*privalomasis sveikatos draudimas*, **PSD**), administered by **[Sodra](https://www.sodra.lt/en)**. If you are covered, it pays for:

- Your family doctor (GP)
- Specialist appointments, with a referral
- Hospital treatment
- Prescription medicines at a reduced price

Public care is inexpensive once you are insured, but waiting times for non-urgent specialists can be long.

## Private healthcare

Pay-per-visit clinics. More expensive, but you can usually be seen within days, often in English, and without a referral. Many international students use private clinics for minor issues and the public system for anything serious.

## The family doctor is the front door

Lithuanian healthcare is built around the **family doctor** (*šeimos gydytojas*). For anything that is not an emergency, you see them first, and they refer you onward if needed. You cannot normally book a public specialist directly.

## Emergency care

**112** for emergencies. Emergency treatment is provided regardless of insurance status — never delay calling because you are unsure about cover.

## Official sources

- [Sodra — compulsory health insurance](https://www.sodra.lt/en)
- [Migration Information Centre — healthcare system](https://micenter.lt/en/healthcare-system)

## Checklist

- [ ] Understood the difference between public and private care
- [ ] Understood that the family doctor comes first
- [ ] Saved 112
`,
      ),
      mod(
        "Health Insurance",
        "What cover you have, and what you may need to arrange.",
        `
## You already have insurance

You bought health insurance for your TRP application in Stage 3 — valid for at least two years with minimum coverage of €30,000. **Keep the certificate.** It is your proof of cover and you may be asked for it.

## How PSD works

**PSD** is Lithuania's compulsory health insurance and it is what gives access to the public system.

- **If you work in Lithuania** — contributions are deducted automatically from your salary, and you become covered.
- **If you do not work** — you are not automatically covered by PSD, and you rely on your private policy, or you pay PSD contributions yourself. Self-paid PSD is tied to the national minimum wage and was in the region of €80 per month during 2026.

> [!IMPORTANT] This is the point most students misunderstand. Holding a TRP does not by itself make you publicly insured. Check your status on the Sodra portal once you have Smart-ID, and ask AfaqWay Support if you are unsure.

## If you take a part-time job

Your employer registers you with Sodra and PSD contributions start automatically. Once insured you can register with a family doctor and use the public system.

## What your private policy covers

Read your own certificate. Policies differ on dental care, chronic conditions, pregnancy and repatriation. Know what is excluded *before* you need it.

## Official source

- [Sodra — self-paid compulsory health insurance contributions](https://sodra.lt/imokos/savarankiskai-moku-privalomojo-sveikatos-draudimo-psd-imokas?lang=en)

## Checklist

- [ ] Insurance certificate saved digitally and on paper
- [ ] Policy read, exclusions understood
- [ ] PSD status checked on Sodra
- [ ] Renewal date noted in my calendar
`,
      ),
      mod(
        "Registering with a Clinic",
        "Choosing a family doctor and booking your first appointment.",
        `
## Choosing a clinic

Pick a clinic (*poliklinika*) near where you live that has a contract with your territorial health insurance fund. Your university's international office will usually recommend one used to international students.

## How to register

1. Go to the clinic with your **passport**, **TRP** and **insurance details**.
2. Complete the registration form (*prašymas*) choosing a family doctor.
3. You are attached to that doctor from then on.
4. You may change clinic later, though switching too often can incur a fee.

## Booking appointments

- **By phone** — the standard route, though English is not guaranteed.
- **Online** — through the [e-Health portal](https://www.esveikata.lt/) or your clinic's own system, usually needing Smart-ID.
- **In person** — at the registration desk.

For non-urgent matters expect to book days ahead. Ask for the first available English-speaking doctor when you book.

## Private clinics

If you need to be seen quickly or want a guaranteed English-speaking doctor, private clinics take direct bookings and often have appointments within a day or two. You pay per visit.

## Prescriptions

Prescriptions are electronic. Your doctor issues one to the national system and you collect it at any pharmacy (*vaistinė*) with your ID.

## Checklist

- [ ] Clinic near home identified
- [ ] Registered with a family doctor
- [ ] Booking method understood
- [ ] Nearest pharmacy located
- [ ] e-Health portal access set up
`,
      ),
      mod(
        "Medical Emergencies",
        "What to do when it is urgent.",
        `
## Call 112

**112** is free, works from any phone with or without a SIM, and operators speak English. Call it for:

- Loss of consciousness, difficulty breathing, chest pain
- Serious injury or heavy bleeding
- Suspected stroke — face drooping, arm weakness, speech difficulty
- Severe allergic reaction
- Any situation where someone's life may be at risk

Give **your location first**, then what happened. Stay on the line.

## Hospital emergency departments

Go directly to a hospital emergency department for urgent problems that are not life-threatening — a bad fracture, a deep cut, a high fever that will not come down. You do not need a referral.

Bring your passport, TRP and insurance certificate if you can, but **never delay treatment to fetch documents**.

## Urgent but not an emergency

- Your **family doctor** — same-day slots often exist for urgent cases.
- A **private clinic** — fastest route to an English-speaking doctor.
- A **pharmacy** — pharmacists in Lithuania are well trained and can advise on minor problems and over-the-counter treatment.

## Pharmacies

*Vaistinė*. Widely available, and larger cities have late-night and 24-hour ones. Many medicines that need a prescription elsewhere also need one here.

## Mental health

Moving countries is genuinely hard, and struggling with it is common rather than shameful. Most Lithuanian universities offer free psychological support to students — ask your international office or student union. If you are in crisis, call 112.

## Checklist

- [ ] 112 saved and understood
- [ ] Nearest hospital emergency department located
- [ ] Nearest 24-hour pharmacy located
- [ ] Insurance certificate on my phone
- [ ] University psychological support contact found
`,
      ),
      mod(
        "Useful Healthcare Resources",
        "The official services and tools worth having.",
        `
## Official portals

- **[Sodra](https://www.sodra.lt/en)** — health insurance status, contributions, and your social insurance record. Check here to confirm whether you are covered by PSD.
- **[e-Health (esveikata.lt)](https://www.esveikata.lt/)** — appointments, electronic prescriptions and your medical records in one place. Needs Smart-ID.
- **[Migration Information Centre](https://micenter.lt/en/healthcare-system)** — plain-English explanations of the healthcare system for foreigners, run as a public information service.

## On your phone

- Your **clinic's app or booking page**
- **e-Health**, once Smart-ID is set up
- **Google Translate** with Lithuanian downloaded — useful for medicine packaging and instructions
- Your **insurance provider's** contact details and policy number

## Words worth knowing

| Lithuanian | English |
| --- | --- |
| *Vaistinė* | Pharmacy |
| *Poliklinika* | Clinic |
| *Šeimos gydytojas* | Family doctor |
| *Greitoji pagalba* | Ambulance |
| *Skubi pagalba* | Emergency department |
| *Receptas* | Prescription |

## Healthcare Checklist

- [ ] Insurance certificate stored digitally
- [ ] PSD status checked on Sodra
- [ ] Registered with a family doctor
- [ ] e-Health access working
- [ ] Nearest pharmacy and emergency department known
- [ ] 112 saved
- [ ] University psychological support contact saved
`,
      ),
    ],
  },

  /* ── 9 ─────────────────────────────────────────────────────────────────── */
  {
    title: "Public Transport",
    description:
      "Public transportation is the easiest and most affordable way to travel around Lithuania. This step explains everything you need to start using buses, trolleybuses, and other local transportation services.",
    blocks: [
      mod(
        "Understanding Public Transport",
        "How buses, trolleybuses and trains work in Lithuanian cities.",
        `
Public transport in Lithuania is cheap, punctual and easy to use once you have a card.

## In the cities

- **Buses** — everywhere, and the backbone of every city network.
- **Trolleybuses** — electric buses on overhead wires, in Vilnius and Kaunas. Same tickets, same cards.
- **Kaunas funicular** — two historic funicular railways, more charming than practical.

Vilnius transport is run by **[JUDU](https://judu.lt/en/)**, which is also the name of the app and the card.

## Between cities

- **Intercity buses** — the most common way to travel between Lithuanian cities. Frequent, comfortable and inexpensive. Book at [autobusubilietai.lt](https://autobusubilietai.lt/).
- **Trains** — [LTG Link](https://ltglink.lt/en) runs the passenger network. Often more comfortable than buses on the routes it serves.

Both offer student discounts with the right card.

## How you pay

You validate every journey. There is no conductor and no gate — you tap your card or your bank card on the validator when you board, and inspectors check at random.

> [!WARNING] Always validate, on every leg of every journey, even when the bus is empty and even if you have a monthly pass. Travelling without a validated ticket is treated as fare evasion and fined.

## Checklist

- [ ] Identified which company runs transport in my city
- [ ] Understood that I must validate on every boarding
- [ ] Found the routes between home and campus
`,
      ),
      mod(
        "Transport Cards",
        "Getting the card, loading it and using it.",
        `
## What to get

In **Vilnius**, the **[JUDU](https://judu.lt/en/)** card (also called the *Vilniečio kortelė*). Other cities have their own equivalent.

## Where to buy

- *Narvesen* and *Lietuvos spauda* kiosks
- Customer service centres
- Vilnius Airport, in Arrivals — useful on your first day
- Supermarkets in some cities

The card itself costs a small one-off fee.

## Registering it

Register the card online or in the app and link it to your name. Two reasons this matters:

1. A registered card can be **blocked and replaced** with its balance if you lose it.
2. Your **student discount can only be attached to a registered card**.

## Loading it

- The operator's app
- Kiosks and customer service points
- Online with a bank card
- Ticket machines

You can load either a **single-journey balance** or a **period pass** (month, term, or a set number of days).

## Using a bank card instead

In Vilnius you can tap a contactless bank card directly on the validator for a single ticket, around €1. Convenient for a visitor — but it does **not** carry your student discount, so it is not what you want day to day.

> [!TIP] Buy the card in your first week and register it immediately, even before your student status is confirmed. You can attach the discount later without buying a new card.

## Checklist

- [ ] Transport card bought
- [ ] Card registered in my name
- [ ] Balance or period pass loaded
- [ ] Top-up method saved
`,
      ),
      mod(
        "Transport Applications",
        "The apps that make journeys easy.",
        `
## Ticketing

- **[JUDU](https://judu.lt/en/)** — official Vilnius transport app. Buy tickets, top up your card, check timetables, plan journeys.
- Your own city's official app, if you are not in Vilnius. Ask your international office.

## Journey planning

- **[Trafi](https://www.trafi.com/)** — built in Lithuania and what many locals use. Combines buses, trolleybuses, e-scooters and taxis into a single plan, with live arrival times.
- **Google Maps** — reliable public transport directions with live departures in Lithuanian cities. The easiest starting point.

## Intercity

- **[Autobusų bilietai](https://autobusubilietai.lt/)** — intercity bus tickets across Lithuania.
- **[LTG Link](https://ltglink.lt/en)** — train tickets and timetables.

## Micromobility

- **Bolt** — e-scooters and taxis in one app.
- Seasonal city bike schemes operate in the larger cities in summer.

## Why each matters

Google Maps answers *"how do I get there"*. Trafi answers *"what is the fastest way right now"*. JUDU answers *"how do I pay"*. Most students end up with all three.

## Checklist

- [ ] Official ticket app installed
- [ ] Trafi or Google Maps set up for my city
- [ ] Intercity booking site bookmarked
- [ ] Home and campus saved as favourite locations
`,
      ),
      mod(
        "Student Discounts",
        "The discount is large — make sure you actually claim it.",
        `
Student transport discounts in Lithuania are among the best in Europe, and many international students never claim them.

## The two cards

**[LSP — Lithuanian Student Identity Card](https://lsp.lt/en)** (*Lietuvos studento pažymėjimas*)

- Around **80% off city public transport**
- Around **50% off intercity** travel
- Issued to students at Lithuanian institutions
- Can integrate a Vilnius or Kaunas transport e-ticket into the same card

**[ISIC Lithuania](https://www.isic.lt/en/)** — the international student card

- Around **50% off public transport**
- Also gives discounts in shops, cinemas and museums, and works abroad
- Can also carry an integrated Vilnius or Kaunas e-ticket

> [!TIP] If you are choosing purely on transport cost, the **LSP** discount is larger. Many students hold both: LSP for transport, ISIC for international and retail discounts.

## Eligibility

- You must be a **full-time** student. Part-time students are generally not eligible for transport concessions.
- Your student status must be active and verifiable.

## How to get one

1. Enrol and confirm your student status (Step 5).
2. Apply through [lsp.lt](https://lsp.lt/en) or [isic.lt](https://www.isic.lt/en/order-isic/), or through your university — many issue them centrally.
3. Provide your student number and a photograph.
4. Collect the card, or receive the virtual version.
5. **Attach the discount to your transport card** — this is the step people forget, and without it you keep paying full price.

## Validity

The discount follows your student status and must be renewed each academic year. Set a reminder.

## Checklist

- [ ] Confirmed I am registered as full-time
- [ ] Applied for LSP, ISIC, or both
- [ ] Card received
- [ ] **Discount attached to my transport card and tested on a journey**
- [ ] Renewal reminder set for next academic year
`,
      ),
      mod(
        "Travel Tips",
        "Travelling confidently and avoiding fines.",
        `
## Peak hours

Roughly 07:30-09:00 and 16:30-18:30 on weekdays. Buses on university routes get full. Leave earlier for anything that matters.

## Ticket inspections

Inspectors board at random, in plain clothes, and will ask to see a validated ticket and — if you travelled at a student rate — your **student card**.

> [!MISTAKE] Travelling on a student fare without carrying the student card. The discount is not valid without the card that proves it, and the fine applies exactly as if you had no ticket.

## Winter

Buses run through the winter and are heated. Stops are not. Use the live arrival times in the app rather than standing outside guessing — this is the single best reason to install Trafi.

## Night travel

City services thin out late in the evening. Check the last departure before a night out, or budget for a Bolt home.

## Weekends and holidays

Reduced timetables. Check the app rather than assuming the weekday schedule.

## Safety

Lithuanian public transport is safe, including at night. Ordinary precautions are enough: keep your phone in a pocket rather than your hand near the door, and keep your bag closed on a crowded bus.

## Public Transport Checklist

- [ ] Transport card bought and registered
- [ ] Student discount applied and tested
- [ ] Ticket app installed
- [ ] Journey planner installed
- [ ] Home-to-campus route known, with a backup
- [ ] Student card carried whenever I travel
- [ ] Last departure times checked for my route
`,
      ),
    ],
  },

  /* ── 10 ────────────────────────────────────────────────────────────────── */
  {
    title: "Financial Setup",
    description:
      "Managing your finances correctly is one of the most important skills for a successful student life. This step will help you create a realistic budget, understand your monthly expenses, and discover useful student discounts.",
    blocks: [
      mod(
        "Understanding Student Living Costs",
        "What a month in Lithuania actually costs a student.",
        `
Lithuania is one of the more affordable EU countries to study in, but costs have risen. These are indicative ranges for **2026**; Vilnius is the most expensive city, Kaunas, Klaipėda and Šiauliai are cheaper.

## Typical monthly costs

| Category | Typical range | Notes |
| --- | --- | --- |
| Accommodation | €150-450 | Dormitory at the low end, private studio at the high end |
| Utilities | €40-120 | Much higher in winter if heating is not included |
| Food (cooking at home) | €150-250 | Eating out regularly pushes this well up |
| Public transport | €5-25 | With the student discount |
| Mobile phone | €5-15 | Prepaid bundle |
| Home internet | €10-20 | Often included in dormitories |
| Study materials | €10-30 | Averaged across the year |
| Personal and social | €50-150 | Entirely up to you |

## Average Monthly Student Budget

| Living style | Realistic monthly total |
| --- | --- |
| Careful — dormitory, cooking at home | **€400-550** |
| Comfortable — shared flat, some eating out | **€600-800** |
| Private apartment in central Vilnius | **€900+** |

> [!IMPORTANT] These are living costs only. Tuition, insurance and travel home are separate and should be planned annually, not monthly.

## Costs students forget

- Winter clothing in your first year — a proper coat and boots are not optional here
- Heating in January and February
- Document fees, translations and card renewals
- Flights home at the end of the year
- The deposit on a new apartment if you move

## Checklist

- [ ] Estimated my own monthly total from the table
- [ ] Added winter costs to the plan
- [ ] Confirmed whether my rent includes heating
- [ ] Separated annual costs from monthly ones
`,
      ),
      mod(
        "Creating Your Monthly Budget",
        "A simple budget that survives contact with real life.",
        `
## The method

Split every euro into three:

1. **Fixed** — rent, utilities, phone, transport pass, insurance. Same every month.
2. **Variable** — food, study materials, social life. You control these.
3. **Savings** — even €20 a month builds a buffer.

## A worked example

A student with €650 a month:

| | Amount |
| --- | --- |
| Dormitory rent | €200 |
| Utilities | €50 |
| Phone | €10 |
| Transport (with student discount) | €15 |
| **Fixed total** | **€275** |
| Groceries | €200 |
| Personal and social | €100 |
| **Variable total** | **€300** |
| **Savings** | **€75** |

The discipline is in the order. On the day money arrives, move the fixed total and the savings out of your spending account. What is left is genuinely yours to spend, and you cannot accidentally spend the rent.

## Setting goals

- **Month 1** — build a €100 emergency buffer
- **Month 3** — one month's rent saved
- **Year 1** — enough for a flight home plus a deposit

## Reviewing it

Look at your actual spending once a month, in your banking app. The first review is always a surprise. Adjust the plan to reality rather than pretending the plan was right.

## Checklist

- [ ] Listed my fixed costs
- [ ] Set a realistic variable budget
- [ ] Chosen a savings amount, however small
- [ ] Set up a separate space or account for fixed costs
- [ ] Put a monthly review in my calendar
`,
      ),
      mod(
        "Saving Money as a Student",
        "Where the savings actually are.",
        `
## The big three

**1. Cook at home.** The single largest lever. Cooking most meals instead of eating out typically saves €150-250 a month.

**2. Claim your transport discount.** Up to 80% off city travel with an LSP card (Step 9). Students who never register the discount pay several times more all year.

**3. Get the right accommodation.** A dormitory place versus a private studio can be a €250 monthly difference.

## Groceries

- **Loyalty cards** — Maxima, IKI, Rimi, Lidl. Free, and prices genuinely differ with and without them.
- **Lidl and Norfa** are usually cheapest for a weekly shop.
- **Markets** (*turgus*) beat supermarkets on fruit and vegetables.
- Shop with a list, after eating, once a week.

## Student discounts beyond transport

Your **ISIC** card and often your university ID get you reduced prices at:

- Museums and galleries
- Cinemas and theatres
- Some restaurants and cafés
- Software and online services — many offer large student discounts on an academic email

## Free through your university

- Library books, databases and printing quotas
- Sports facilities and gyms
- Language courses, including Lithuanian
- Academic writing and study skills support
- Psychological support

These are paid for by your tuition. Not using them is leaving money behind.

## Small habits

- Refill a water bottle rather than buying
- Buy the second-hand textbook, or borrow it
- Use student-priced software licences

## Checklist

- [ ] Loyalty cards for my nearest supermarkets
- [ ] Cooking most meals at home
- [ ] Transport discount active
- [ ] ISIC or LSP card in my wallet
- [ ] University free services identified
`,
      ),
      mod(
        "Useful Financial Applications",
        "Tools that make tracking money easy rather than a chore.",
        `
## Start with your bank

Every major Lithuanian banking app categorises your spending automatically and shows where the money went. For most students this is enough, and it needs no setup.

- Turn on **transaction notifications**
- Use **savings spaces** or a second account to separate fixed costs
- Check the **monthly spending summary**

## Multi-currency and sending money home

- **Revolut** — spending analytics, savings vaults, currency exchange at good rates. A Lithuanian IBAN.
- **Wise** — usually the cheapest way to send money to a non-EU country. Compare before every large transfer.

## Budgeting apps

If your bank's app is not enough, general budgeting tools that let you set category limits and track manually are widely available. Choose one that lets you **enter cash spending manually** — cash is where budgets leak.

> [!WARNING] Never connect an app to your bank account unless it is your bank's own app or a regulated provider you have checked. Some "free" budgeting apps make money from your data, and some are outright fraudulent. If in doubt, track manually.

## What matters more than the app

Reviewing your spending once a month. A simple spreadsheet you actually look at beats a sophisticated app you installed and forgot.

## Checklist

- [ ] Bank app notifications on
- [ ] Spending categories reviewed once
- [ ] Method chosen for sending money home
- [ ] A monthly review reminder set
`,
      ),
      mod(
        "Financial Checklist",
        "Everything to have in place by the end of your first month.",
        `
Work through this during your first month. It takes an hour in total and prevents most money problems students run into.

## Accounts and payments

- [ ] Lithuanian bank account open, card working
- [ ] Smart-ID active
- [ ] Rent standing order or a monthly reminder set
- [ ] Cheapest route for sending money home identified

## Budget

- [ ] Monthly income written down
- [ ] Fixed costs listed and totalled
- [ ] Variable budget set
- [ ] Savings amount chosen
- [ ] Fixed money kept separate from spending money

## Discounts

- [ ] LSP or ISIC card obtained
- [ ] Transport discount attached and tested
- [ ] Supermarket loyalty cards
- [ ] University free services identified

## Safety net

- [ ] Emergency buffer started
- [ ] Insurance renewal date in my calendar
- [ ] Annual costs — flights, tuition, renewals — planned separately

## Habit

- [ ] Monthly spending review in my calendar
- [ ] Transaction notifications on

> [!TIP] If you only do three things: separate rent from spending money, cook at home, and claim your transport discount. Those three cover most of the gap between a tight month and a comfortable one.
`,
      ),
    ],
  },

  /* ── 11 ────────────────────────────────────────────────────────────────── */
  {
    title: "Find a Job (Optional)",
    description:
      "If you would like to earn extra income while studying, this step explains how to prepare for the Lithuanian job market and where to find trusted opportunities. This step is optional and you may skip it.",
    allowSkip: true,
    blocks: [
      mod(
        "Working While Studying",
        "Your right to work on a student residence permit, and its limits.",
        `
## You may work

Your **Temporary Residence Permit for studies gives you the right to work**. You do not need a separate work permit — this is one of the genuine advantages of studying in Lithuania compared with many other countries.

## The hour limits

| Who | During the academic year | During official holidays |
| --- | --- | --- |
| Non-EU **bachelor's** students | up to **20 hours per week** | full-time, up to 40 hours |
| Non-EU master's and PhD students | generally full-time | full-time |
| EU / EEA / Swiss students | no limit | no limit |

As a bachelor's student on a TRP, plan around **20 hours a week** in term time.

> [!IMPORTANT] These limits are conditions of your residence permit. Exceeding them puts your permit at risk, which is a far bigger problem than the extra income is worth. Keep your contracted hours within the limit and keep your payslips.

## What your employer must do

A legitimate employer will:

- Give you a **written employment contract** before you start
- Register you with **Sodra**, which also starts your health insurance
- Pay into a **bank account**, not in cash
- Deduct taxes and contributions from your salary

> [!WARNING] Undeclared work — cash in hand, no contract — is illegal, leaves you with no rights if you are not paid, gives you no health insurance, and can affect your residence permit. Do not accept it, however convenient it looks.

## Official sources

- [Study in Lithuania — working in Lithuania](https://studyin.lt/about-lithuania/work-in-lithuania/)
- [Employment Service of Lithuania](https://uzt.lt/en/)
- [Migration Department](https://www.migracija.lt/en)

Rules change. Confirm the current limits with your international office or the Migration Department before signing a contract.

## Checklist

- [ ] Confirmed my weekly hour limit
- [ ] Understood I need a written contract
- [ ] Understood the employer must register me with Sodra
- [ ] Bank account ready to receive a salary
`,
      ),
      mod(
        "Preparing Your CV",
        "A CV that works in the Lithuanian market, with little experience.",
        `
## What a Lithuanian CV looks like

- **One to two pages**, no more
- Reverse chronological — most recent first
- **In English** for international companies, Lithuanian for local ones
- A photograph is common in Lithuania, though never required
- Clean and plain: no elaborate graphics

## What to include

1. **Contact details** — name, Lithuanian phone number, professional email, city
2. **Short profile** — two or three lines on who you are and what you are looking for
3. **Education** — your current degree, university, expected graduation
4. **Experience** — any work, including part-time, volunteering and university projects
5. **Skills** — languages with levels, software, technical skills
6. **Languages** — state your English level honestly; note any Lithuanian, even basic

## With little experience

This is the normal position for a first-year student, and employers hiring students know it.

- Lead with **education and skills** rather than experience
- Include **university projects** and describe what you actually did
- Include **volunteering** — it counts
- List **languages** prominently; multilingual students are genuinely valuable here
- Name concrete things: "served 50+ customers a day in a busy café" beats "good communication skills"

## Free tools

- Your university's **career centre** — free CV reviews, and the most useful option
- **Europass** ([europass.europa.eu](https://europass.europa.eu/en)) — the free EU standard CV builder, recognised everywhere in Europe
- **LinkedIn** — keep it consistent with your CV; recruiters check

## Where to look for work

- **[CVbankas.lt](https://en.cvbankas.lt/)** — the most visited job portal in Lithuania
- **CV.lt**, **CVonline.lt**, **CVmarket.lt** — other established general portals
- **[LinkedIn Jobs](https://www.linkedin.com/jobs/)** — strongest for international companies and internships
- **[Employment Service (Užimtumo tarnyba)](https://uzt.lt/en/)** — the official state employment service
- Your **university career centre and career days**

## Checklist

- [ ] CV written, one to two pages
- [ ] Reviewed by the university career centre
- [ ] Language levels stated honestly
- [ ] LinkedIn profile matching my CV
- [ ] Accounts created on CVbankas and one other portal
`,
      ),
      mod(
        "Finding Job Opportunities",
        "Where student jobs actually are, and how to apply safely.",
        `
## Jobs students realistically get

- **Hospitality** — cafés, restaurants, hotels
- **Retail** — supermarkets and shops
- **Delivery** — Bolt Food, Wolt
- **Customer support** — international companies in Vilnius hire for language skills, and this is where being multilingual pays
- **IT and tech internships** — Vilnius has a large tech and fintech sector
- **On-campus work** — library, labs, student services
- **Tutoring** — your own language, or a subject you are strong in

> [!TIP] If you speak Arabic, French or another language alongside English, look at the international business services companies in Vilnius. They pay better than hospitality and actively want language skills.

## Your university first

Before the public portals:

- The **career centre** — vetted employers used to student schedules
- **Career days** — most Lithuanian universities run them, and international students are welcome
- **Department noticeboards and mailing lists** — research assistant and lab roles are often advertised nowhere else

## Applying safely

- Apply through the **company's own site or an established portal**
- Research the employer before an interview
- Meet in a **public place or the company's office**
- Never pay a fee to get a job — legitimate employers and agencies never charge candidates
- Never hand over your passport; showing it is normal, surrendering it is not
- Be cautious about "agents" who promise a job for a fee

> [!WARNING] If an offer arrives without an interview, promises unusually high pay for simple work, or asks you to receive and forward money, it is a scam. Some of these involve money laundering, which is a criminal matter for you as well as for them.

## Balancing work and study

You came here to get a degree. Twenty hours a week is a real commitment on top of a full course load — start with fewer hours, see how the first month goes, and increase only if your studies hold up.

## Checklist

- [ ] University career centre visited
- [ ] Profiles created on the main portals
- [ ] Job alerts set up
- [ ] Employers researched before applying
- [ ] Decided a realistic weekly hour target
`,
      ),
      mod(
        "Interview Preparation",
        "Getting through your first interview in Lithuania.",
        `
## What to expect

Interviews for student jobs are usually short and practical. For hospitality and retail, expect a single conversation with a manager. For office roles, expect two rounds and possibly a task.

## Common questions

- Tell me about yourself
- Why do you want this job?
- What is your availability? *(Be exact — days and hours. Bring your timetable.)*
- How long do you plan to stay in Lithuania?
- Do you have the right to work here? *(Yes — your TRP for studies gives it, up to 20 hours a week in term time.)*
- Describe a time you handled a difficult situation
- What is your English level? Do you speak any Lithuanian?

## How to prepare

1. Research the company — 10 minutes on their website is enough and it shows.
2. Prepare **three concrete examples** from study, work or volunteering.
3. Know your **timetable** precisely; availability is often the deciding factor for a student role.
4. Prepare two questions to ask them — about the team, the schedule, or training.
5. Practise out loud in English at least once.

## Practical details

- **Dress** — smart casual for hospitality and retail; business casual for an office. Clean and tidy matters more than expensive.
- **Arrive 10 minutes early.** Punctuality is taken seriously in Lithuania.
- **Bring** a printed CV, your passport or TRP, and your student certificate.
- **Online interviews** — test camera and microphone beforehand, sit somewhere quiet with a plain background.

## During the interview

- Greet with a handshake and eye contact
- Be honest about your experience — enthusiasm and reliability are what student employers want
- Be clear about your hour limit; a good employer respects it
- Ask when you will hear back

## Checklist

- [ ] Company researched
- [ ] Three examples prepared
- [ ] Timetable and exact availability known
- [ ] Two questions ready
- [ ] Outfit decided
- [ ] Documents ready
- [ ] Practised out loud once
`,
      ),
      mod(
        "Taxes and Employment Basics",
        "An introduction only — the official sources are authoritative.",
        `
> [!IMPORTANT] This module is a plain-English introduction, not tax advice. Rates and thresholds change every year. Confirm anything that affects your money with [Sodra](https://www.sodra.lt/en), the [State Tax Inspectorate (VMI)](https://www.vmi.lt/) or your employer's HR department.

## Your employment contract

Read it before signing. It should state your job title, hours, salary, start date, holiday entitlement and notice period. You are entitled to a copy — keep it.

## Gross and net pay

Lithuanian salaries are usually advertised **gross** (*bruto*), before deductions. What reaches your account is **net** (*neto*), and the difference is significant.

Deducted from your gross salary:

- **Personal income tax (GPM)**
- **Social insurance contributions**, including your **compulsory health insurance (PSD)**

> [!TIP] Always ask whether a quoted salary is gross or net. Confusing the two is the most common mistake students make in Lithuanian salary negotiations.

## Why the deductions are good news

Your PSD contribution is what enrols you in the **public healthcare system** (Step 8). Once employed and registered with Sodra, you can register with a family doctor and use public healthcare.

## What your employer does

- Registers you with Sodra **before** your first working day
- Deducts and pays your taxes
- Gives you payslips

You generally do not have to file anything yourself for ordinary employment income — but check your situation, especially if you have income from more than one source or from abroad.

## Holiday and rights

Employees in Lithuania are entitled to paid annual leave, and the Labour Code protects part-time workers as well as full-time ones. Your working time limit as a student is a condition of your permit, not of the Labour Code.

## Official sources

- [Sodra](https://www.sodra.lt/en) — social and health insurance
- [State Tax Inspectorate (VMI)](https://www.vmi.lt/) — income tax
- [Employment Service](https://uzt.lt/en/) — jobseeker rights and support

## Checklist

- [ ] Contract read before signing, copy kept
- [ ] Confirmed whether the salary quoted is gross or net
- [ ] Confirmed my employer registers me with Sodra
- [ ] Payslips saved
- [ ] Working hours within my permit limit
- [ ] Checked my insurance status on Sodra after the first month
`,
      ),
    ],
  },

  /* ── 12 ────────────────────────────────────────────────────────────────── */
  {
    title: "Social Integration",
    description:
      "Studying abroad is more than attending classes. This step helps you build friendships, adapt to Lithuanian culture, and enjoy university life.",
    blocks: [
      mod(
        "Everyday Life in Lithuania",
        "Local customs and everyday etiquette, so you feel at ease quickly.",
        `
Lithuanians are often described as reserved. It is worth understanding this correctly: it is politeness, not coldness. People are quieter with strangers and genuinely warm once they know you.

## Everyday etiquette

- **Greetings** — *Labas* (hello) or *Laba diena* (good day). A handshake is normal in formal settings.
- **Punctuality matters.** Being late without warning is read as inconsiderate, at university and at work.
- **Take your shoes off** when entering someone's home. Always.
- **Quiet in public.** Loud conversation on buses stands out.
- **Queue properly** and let people off before boarding.
- **Personal space** is a little larger than in southern Europe or the Middle East.

## In the classroom

- Professors are addressed formally unless invited otherwise.
- Deadlines are firm. An extension needs a genuine reason and an early request.
- Questions are welcome, but there is less spontaneous debate than in some cultures. Silence after a question is normal, not hostility.

## Rules to know

- **No alcohol in public places.** Shops stop selling at 20:00, and at 15:00 on Sundays.
- **Smoking** is banned in most public spaces, including apartment balconies.
- **Jaywalking is fined.** Wait for the green signal even on an empty street — locals do.
- **Quiet hours** at night in residential buildings.

## Religion and diversity

Lithuania is predominantly Catholic and religious practice is treated as private. There are mosques and Muslim communities in Vilnius and Kaunas, and halal food is available in the larger cities. Ask AfaqWay Support for what is near you.

## Weather, honestly

Winter is long, cold and dark, with sunset in mid-afternoon in December. This affects mood, and it affects most newcomers in their first year. Invest in a proper coat and waterproof boots early, get outside in daylight when you can, and consider vitamin D. If the darkness starts weighing on you, that is common — talk to your university's psychological support.

## Checklist

- [ ] Learned *Labas* and *Ačiū*
- [ ] Understood the alcohol and smoking rules
- [ ] Bought proper winter clothing
- [ ] Understood that reserve is not unfriendliness
`,
      ),
      mod(
        "Student Communities",
        "Where to meet people, and why it matters more than it sounds.",
        `
The students who settle well are almost always the ones who joined something in their first month. This is the highest-return item in the whole stage.

## ESN — Erasmus Student Network

**[ESN](https://esn.lt/)** has sections at every major Lithuanian university. Despite the name, events are generally open to **all international students**, not only Erasmus exchange students.

They run city tours, trips around Lithuania and the Baltics, language cafés, parties and buddy programmes.

> [!TIP] Many ESN sections run a **buddy or mentor programme** pairing you with a local student. If yours does, sign up. It is the single fastest way to understand how things actually work here.

## Your student union

Every Lithuanian university has one. They represent students, run events, and are who to ask when you have a problem with a course or a grade and do not know the process.

## Clubs and societies

Sports teams, debate, music, photography, volunteering, faculty societies. Most are free or nearly free and welcome beginners.

## National and cultural associations

Student associations for particular nationalities and regions exist in most university cities — a good source of practical advice from people who arrived a year or two before you.

## Volunteering

A genuine way to meet Lithuanians rather than only other internationals, to practise the language, and to build something for your CV.

## Why it matters

Beyond friendship: your classmates are who you revise with, who tells you an assignment brief changed, and who notices when you have not been seen for a week. Loneliness in the first winter is the most common reason international students struggle, and it is much easier to prevent than to fix.

## Checklist

- [ ] Found my university's ESN section
- [ ] Joined the international students group chat
- [ ] Signed up for a buddy programme if one exists
- [ ] Attended one social event in my first month
- [ ] Joined one club or society
`,
      ),
      mod(
        "Learning Basic Lithuanian",
        "You do not need fluency. A hundred words changes daily life.",
        `
Lithuanian is one of the oldest living Indo-European languages, and it is genuinely difficult. Nobody expects you to be fluent. But a small effort is noticed and appreciated far more than you might expect.

## Absolute essentials

| Lithuanian | English |
| --- | --- |
| *Labas* | Hello (informal) |
| *Laba diena* | Good day (formal) |
| *Ačiū* | Thank you |
| *Prašau* | Please / you're welcome |
| *Atsiprašau* | Sorry / excuse me |
| *Taip* / *Ne* | Yes / No |
| *Viso gero* | Goodbye |
| *Ar kalbate angliškai?* | Do you speak English? |
| *Nesuprantu* | I don't understand |

## Shopping

| Lithuanian | English |
| --- | --- |
| *Kiek kainuoja?* | How much does it cost? |
| *Kur yra...?* | Where is...? |
| *Sąskaitą, prašau* | The bill, please |
| *Maišelis* | Bag |
| *Nuolaida* | Discount |

## Transport

| Lithuanian | English |
| --- | --- |
| *Autobusas* / *Troleibusas* | Bus / Trolleybus |
| *Stotelė* | Stop |
| *Bilietas* | Ticket |
| *Traukinys* | Train |
| *Oro uostas* | Airport |

## Emergencies

| Lithuanian | English |
| --- | --- |
| *Padėkite!* | Help! |
| *Man reikia gydytojo* | I need a doctor |
| *Iškvieskite greitąją* | Call an ambulance |
| *Vaistinė* | Pharmacy |
| *Policija* | Police |

## Where to learn

- **Your university** — most offer free or subsidised Lithuanian courses to international students. This is the best option and it is usually already paid for by your tuition.
- **[Duolingo](https://www.duolingo.com/)** — has a Lithuanian course; good for vocabulary and daily habit.
- **ESN language cafés** — informal practice with native speakers.
- **Google Translate** — download Lithuanian for offline use; the camera mode reads official letters and food labels.

## Realistic goal

Aim for greetings, numbers, and being able to order coffee by the end of your first semester. That is enough to change how daily interactions feel.

## Checklist

- [ ] Learned the ten essential phrases
- [ ] Checked whether my university offers free Lithuanian classes
- [ ] Downloaded Lithuanian for offline translation
- [ ] Used *Labas* and *Ačiū* at least once today
`,
      ),
      mod(
        "Useful Applications",
        "The apps that make everyday life in Lithuania simpler.",
        `
## Getting around

- **Google Maps** — navigation and live public transport
- **[Trafi](https://www.trafi.com/)** — Lithuanian-built multimodal journey planner
- **Bolt** — taxis and e-scooters

## Food

- **Wolt** and **Bolt Food** — restaurant and grocery delivery
- Supermarket apps — **Maxima**, **Rimi**, **IKI**, **Lidl** — for loyalty pricing and offers

## Money

- Your **bank's app**
- **Smart-ID** — your digital identity for banking, government and healthcare
- **Revolut** or **Wise** — currency exchange and sending money home

## Everyday services

- **[e-Health](https://www.esveikata.lt/)** — appointments and prescriptions
- **[Sodra](https://www.sodra.lt/en)** — insurance status
- Your **transport app** — JUDU in Vilnius
- Your **university's app or portal**

## Buying and selling

- **[Skelbiu.lt](https://www.skelbiu.lt/)** — second-hand furniture, bikes and electronics, which is how most students furnish a room affordably
- **Vinted** — founded in Lithuania and used everywhere here for second-hand clothing

## Communication

- **WhatsApp** — how you will reach AfaqWay Support and most international friends
- **Messenger** — widely used by Lithuanian students; many course groups live there
- **Google Translate** — with Lithuanian downloaded

## Culture and events

- **[Go Vilnius](https://www.govilnius.lt/)** — the official city guide: events, museums, what is on
- **[Lithuania Travel](https://lithuania.travel/en)** — the official national tourism site

## Checklist

- [ ] Navigation and transport apps installed
- [ ] Delivery app installed
- [ ] Banking and Smart-ID working
- [ ] Second-hand marketplace installed
- [ ] Course group chats joined
- [ ] City events source bookmarked
`,
      ),
      mod(
        "Exploring Lithuania",
        "The country beyond your campus.",
        `
Lithuania is small, travel within it is cheap, and you can reach most of the country in a few hours. Students who explore it enjoy their degree considerably more.

## In Vilnius

- **Vilnius Old Town** — one of the largest surviving medieval old towns in Europe and a UNESCO World Heritage Site
- **Gediminas Castle Tower** — the view over the city
- **Užupis** — the self-declared "republic" of artists, with its own constitution on a wall in many languages
- **The National Museum of Lithuania** and the **MO Museum** of modern art
- **Vingis** and **Bernardinai** parks

## Elsewhere in the country

- **Trakai** — the island castle on a lake, half an hour from Vilnius, and the classic first day trip
- **Kaunas** — a European Capital of Culture with strong interwar modernist architecture
- **Curonian Spit** — UNESCO-listed sand dunes and forest on the Baltic coast
- **Klaipėda and Palanga** — the seaside, best in summer
- **Hill of Crosses**, near Šiauliai — hundreds of thousands of crosses on one hill
- **Aukštaitija** and **Dzūkija** national parks — lakes and forest

## Beyond Lithuania

Riga is about four hours by bus, Warsaw is reachable overnight, and Tallinn is a little further. Flights from Vilnius across Europe are inexpensive if booked early. Your student status and ISIC card reduce many of these costs.

## How to do it cheaply

- **ESN trips** are organised, subsidised and social — the easiest way to start
- **Intercity buses** are cheap, and cheaper still with a student discount
- **Museums** are often free or reduced for students, and some have free days
- Travel **off-season** for the coast

## Official resources

- [Lithuania Travel](https://lithuania.travel/en) — the national tourism board
- [Go Vilnius](https://www.govilnius.lt/) — the official Vilnius city guide

## Checklist

- [ ] Explored my own city's old town or centre
- [ ] Visited one museum with my student discount
- [ ] Taken one trip outside my city
- [ ] Joined one ESN trip
- [ ] Made a list of three places to see before I graduate
`,
      ),
    ],
  },

  /* ── 13 ────────────────────────────────────────────────────────────────── */
  {
    title: "Academic Success",
    description:
      "This final learning step provides practical strategies for academic success throughout your university journey.",
    blocks: [
      mod(
        "Building Effective Study Habits",
        "Study methods that are actually supported by evidence.",
        `
University study is different from school: less supervision, more reading, and results that depend on what you do between classes.

## What works

**Active recall.** Test yourself instead of re-reading. Close the book and write what you remember, then check. This feels harder than re-reading, which is exactly why it works better.

**Spaced repetition.** Review material after a day, then a week, then a month. Spacing the same total study time across days beats cramming it into one.

**Practice under real conditions.** Do past papers with a timer. The skill of answering an exam question is separate from knowing the material.

**Teach it.** Explaining a topic to a classmate exposes what you only half understand.

## What does not work

> [!MISTAKE] Highlighting and re-reading feel productive and are close to useless on their own. Recognising a page is not the same as being able to reproduce its argument in an exam.

Cramming the night before also fails twice: it produces a worse grade *and* nothing you can build on next semester.

## Note-taking

- **Cornell method** — split the page: notes on the right, cue questions on the left, a summary at the bottom. Built for later self-testing.
- **Write in your own words.** Transcribing the lecturer verbatim is typing, not learning.
- **Review notes within 24 hours** — a ten-minute pass makes them usable months later.

## Planning your week

1. Block your fixed commitments — lectures, seminars, work shifts
2. Add study blocks for each subject, ideally the same times each week
3. Protect one full day off
4. Plan the week on Sunday, in ten minutes

## Preparing for exams

- Start **three weeks out**, not three days
- Find out the **format** early — essay, multiple choice, oral — and practise that format
- Prioritise by weighting and by what you are weakest at
- Sleep before the exam. A tired brain loses more marks than an extra hour of revision gains.

## Checklist

- [ ] Chosen a note-taking method
- [ ] Weekly study blocks in my calendar
- [ ] Reviewing notes within 24 hours
- [ ] Testing myself instead of re-reading
- [ ] Exam formats identified for this semester
`,
      ),
      mod(
        "Time Management",
        "Balancing study, work and a life.",
        `
## Three horizons

**The semester.** In week one, put every exam and assignment deadline into one calendar. Nearly every "sudden" crisis was visible in the syllabus in September.

**The week.** Plan on Sunday. Fixed commitments first, then study blocks, then social time. Ten minutes.

**The day.** Choose the two or three things that actually matter. A list of fifteen items is a wish, not a plan.

## Making it work

- **Time-block** — decide *when* you will do something, not just that you will
- **Do the hardest thing first**, when you are freshest
- **Work in focused blocks** with real breaks — 45 to 50 minutes is a reasonable unit
- **Batch small tasks** — email, admin, printing — into one slot instead of letting them interrupt study

## If you are working part-time

Twenty hours of work plus a full course load is a real load. Protect study time by putting it in the calendar *before* you agree your shifts, and be honest with your employer about exam periods — a good employer expects this from student staff.

## Prioritising

Ask two questions: **when is it due**, and **how much is it worth**. A 40%-weighted assignment due in two weeks beats a 5% quiz due tomorrow, even though the quiz feels more urgent.

## Beating procrastination

- Start with **five minutes**. Starting is the hard part; continuing is easier.
- Break large tasks into pieces small enough to be obvious.
- Remove the phone from the room. Not face-down — out.
- Study where you do not sleep. Your brain associates places with behaviours.

## Tools

Anything you will actually open: Google Calendar, Notion, Todoist, or paper. The best system is the one you look at daily.

## Checklist

- [ ] All semester deadlines in one calendar
- [ ] Sunday planning slot booked
- [ ] Study blocks protected before agreeing work shifts
- [ ] A place to study that is not my bed
- [ ] One day off per week
`,
      ),
      mod(
        "University Learning Resources",
        "What your tuition already pays for.",
        `
## The library

Books, quiet study space, group rooms, printing, and — most valuably — **access to academic databases** you would otherwise pay for. Librarians will show you how to search properly; twenty minutes with one saves hours on every assignment afterwards.

## Academic writing support

Most Lithuanian universities offer writing centres or academic English support. If English is not your first language, this is the highest-value free service available to you, and it is consistently under-used by the students who need it most.

## Office hours

Every lecturer has them. Almost nobody comes. Turning up with a specific question is the single most efficient way to fix a misunderstanding, and lecturers remember the students who do.

## Tutoring and peer support

Many faculties run peer tutoring or mentoring, often with senior students. Free, and less intimidating than asking a professor.

## The learning platform

Moodle or your university's equivalent holds materials, deadlines and announcements. **Turn on notifications.** Most missed deadlines in first year are missed announcements.

## Online, free

- **[Coursera](https://www.coursera.org/)** and **[edX](https://www.edx.org/)** — university courses, many auditable free
- **[Khan Academy](https://www.khanacademy.org/)** — strong for maths and statistics foundations
- **[MIT OpenCourseWare](https://ocw.mit.edu/)** — full course materials, free
- **Google Scholar** — academic search; link it to your university library for full-text access

## Accessibility and support

If you have a condition affecting your studies, universities have formal support and adjustments. Talk to student services early rather than struggling quietly.

## Checklist

- [ ] Library visited and databases accessed once
- [ ] Writing support located
- [ ] One lecturer's office hours attended
- [ ] Learning platform notifications on
- [ ] Peer tutoring checked
`,
      ),
      mod(
        "Productivity Tools",
        "A small, reliable toolkit.",
        `
## Notes

- **Notion** — notes, databases and planning in one place; free personal plan, and students often get more
- **OneNote** — free with a university Microsoft account, good for handwriting on a tablet
- **Obsidian** — plain-text notes stored locally, good for linking ideas across a degree
- **Paper** — genuinely fine, and better for recall in lectures

## Calendar

**Google Calendar** or **Outlook**. One calendar, with everything in it. Two calendars means missing whatever is in the other one.

## Tasks

**Todoist**, **Microsoft To Do**, or your notes app. Keep exactly one list.

## Cloud storage

**Google Drive** or **OneDrive**, usually free and generous through your university account.

> [!IMPORTANT] Keep your university work in cloud storage, not only on your laptop. A stolen or broken laptop the week before a deadline is a disaster that costs nothing to prevent.

## Writing and referencing

- **Zotero** — free reference manager. Collects sources and generates your bibliography in the required style. Learn it in first year and it saves you days over a degree.
- **Grammarly** or your word processor's checker for a final pass
- Your university's **citation style guide** — ask which style your faculty requires

## Focus

- **Forest** or any focus timer
- Website blockers during study blocks
- Phone in another room

## Do not over-build

Three tools you use beat ten you configured once. Notes, calendar, cloud storage. Add anything else only when you feel the need.

## Checklist

- [ ] One notes app chosen
- [ ] One calendar with everything in it
- [ ] Cloud storage set up and syncing
- [ ] Zotero installed and citation style confirmed
- [ ] University Microsoft or Google account activated
`,
      ),
      mod(
        "Long-Term Academic Success",
        "Finishing your degree well, and what comes after.",
        `
You have moved country, arranged a residence permit, found somewhere to live and enrolled at a university in a language that is not your first. Everything after this is smaller than what you have already done.

## Across the degree

**First year** — build habits, pass everything, make friends, get comfortable. Grades matter less than not falling behind.

**Second year** — go deeper. Start looking for internships and think about what you actually enjoy.

**Final year** — thesis, serious job search, and decisions about staying or moving on.

## Build skills, not only grades

Employers look at your degree, then at everything else: languages, part-time work, volunteering, projects, societies. Your multilingualism and the fact that you moved countries at eighteen are genuine advantages — learn to describe them as such.

## Networking, without the awkwardness

- Keep in touch with classmates; they become your professional network
- Go to guest lectures and career days
- Keep LinkedIn current
- Stay in touch with lecturers whose subjects you enjoyed — they write references

## Staying in Lithuania after graduation

Lithuania offers routes for graduates to remain and look for work. Rules change, so confirm with the [Migration Department](https://www.migracija.lt/en) in your final year — but know the option exists and plan for it early rather than in your last month.

## Look after yourself

Your degree depends on your health more than on any study technique.

- Sleep properly; all-nighters cost more than they gain
- Get outside in daylight, especially in winter
- Eat and move
- Use your university's psychological support if you are struggling. Being far from family is hard, and asking for help is not failure.

## Stay in touch with us

AfaqWay does not disappear at graduation. If you need advice on internships, staying in Lithuania, or another degree, message us.

## Academic Success Checklist

- [ ] Study habits established and working
- [ ] All deadlines in one calendar
- [ ] Library and academic support used at least once
- [ ] One lecturer I could ask for a reference
- [ ] One society, club or volunteering commitment
- [ ] LinkedIn current
- [ ] Post-graduation options understood
- [ ] Sleep, daylight and exercise treated as part of studying
- [ ] AfaqWay Support saved for whatever comes next
`,
      ),
    ],
  },
];
