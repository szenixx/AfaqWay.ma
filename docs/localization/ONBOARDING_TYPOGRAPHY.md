# AfaqWay — Onboarding Typography

Every piece of text a student reads during onboarding (`/profile-setup`), written
out in the order they meet it.

Copied exactly as it appears in the product: nothing reworded, shortened,
corrected, merged or de-duplicated. Dynamic values stay as `{placeholders}`.

**Nothing in the application has been changed.** This file is for translation only.

- **Entries:** 367
- **Steps covered:** 22, plus the global chrome and the plan appendix
- **Generated:** 23 August 2026
- **Scope:** onboarding only. The workspace, dashboard, admin and marketing pages are not covered.

## How to use this file

Write your Darija/Arabic on the `- **AR:**` line under each entry. Leave the
`Current text` line exactly as it is, so the two can be compared later.

Where a string already ships in Arabic (the plan comparison sheet and the device
banner), it is marked and needs review rather than translation.

**Placeholders must survive translation.** `{firstName}`, `{planName}`, `{n}`,
`{tuition}` and the rest are substituted at runtime; a translated string that drops
one will render broken.

---


## Global — chrome shown on every step


### ONB-001
- **Type:** Loading state
- **Current text:** Loading your profile…
- **AR:** 

### ONB-002
- **Type:** Button (utility)
- **Current text:** Log out
- **AR:** 

### ONB-003
- **Type:** Modal title
- **Current text:** Log out?
- **AR:** 

### ONB-004
- **Type:** Modal body
- **Current text:** Every answer so far is saved. Sign back in and you will land on this exact question.
- **AR:** 

### ONB-005
- **Type:** Button
- **Current text:** Stay here
- **AR:** 

### ONB-006
- **Type:** Button
- **Current text:** Log out
- **AR:** 

### ONB-007
- **Type:** Language menu
- **Current text:** English
- **AR:** 

### ONB-008
- **Type:** Language menu
- **Current text:** العربية
- **AR:** 

### ONB-009
- **Type:** Language tag
- **Current text:** Current
- **AR:** 

### ONB-010
- **Type:** Language tag
- **Current text:** Coming soon
- **AR:** 

### ONB-011
- **Type:** aria-label
- **Current text:** Back to the previous question
- **AR:** 

### ONB-012
- **Type:** aria-label
- **Current text:** About this question
- **AR:** 

### ONB-013
- **Type:** Helper (info popover)
- **Current text:** Your answers save as you go, and you can change them later with your advisor.
- **AR:** 

### ONB-014
- **Type:** Helper (info popover)
- **Current text:** Your answers save as you go, and you can change any of them later with your advisor.
- **AR:** 

### ONB-015
- **Type:** Button
- **Current text:** Continue
- **AR:** 

### ONB-016
- **Type:** Save state
- **Current text:** Saving…
- **AR:** 

### ONB-017
- **Type:** Save state
- **Current text:** Couldn’t save, retrying
- **AR:** 

### ONB-018
- **Type:** aria-label
- **Current text:** Notifications
- **AR:** 

### ONB-019
- **Type:** Handoff (loading)
- **Current text:** Opening your dashboard
- **Condition:** shown when after Enter my dashboard is pressed
- **AR:** 

## Step 1 — Welcome


### ONB-020
- **Type:** Title
- **Current text:** Let's build your study plan.
- **AR:** 

### ONB-021
- **Type:** Body
- **Current text:** A few short questions, about two minutes. Every answer shapes the programmes, the price and the roadmap we prepare for you.
- **AR:** 

### ONB-022
- **Type:** CTA
- **Current text:** Get started
- **AR:** 

## Step 2 — Where do you want to study?


### ONB-023
- **Type:** Title
- **Current text:** Where do you want to study?
- **AR:** 

### ONB-024
- **Type:** Subtitle
- **Current text:** This one answer decides your programmes, your paperwork and the whole plan we build.
- **AR:** 

### ONB-025
- **Type:** Validation
- **Current text:** Please choose an available destination.
- **AR:** 

### ONB-026
- **Type:** Country option
- **Current text:** Lithuania
- **AR:** 

### ONB-027
- **Type:** Country option
- **Current text:** Hungary
- **AR:** 

### ONB-028
- **Type:** Country option
- **Current text:** Latvia
- **AR:** 

### ONB-029
- **Type:** Country option
- **Current text:** Poland
- **AR:** 

### ONB-030
- **Type:** Option hint
- **Current text:** Available now
- **AR:** 

### ONB-031
- **Type:** Option hint
- **Current text:** Coming soon
- **AR:** 


### ONB-032
- **Type:** Title
- **Current text:** Switch destination?
- **AR:** 

### ONB-033
- **Type:** Label / option
- **Current text:** Switch anyway
- **AR:** 
## Step 3 — What is your full name?


### ONB-034
- **Type:** Title
- **Current text:** What is your full name?
- **AR:** 

### ONB-035
- **Type:** Subtitle
- **Current text:** Exactly as it is written in your passport, it goes on every document we prepare.
- **AR:** 

### ONB-036
- **Type:** Placeholder
- **Current text:** First name
- **AR:** 

### ONB-037
- **Type:** Placeholder
- **Current text:** Last name
- **AR:** 

### ONB-038
- **Type:** aria-label
- **Current text:** First name
- **AR:** 

### ONB-039
- **Type:** aria-label
- **Current text:** Last name
- **AR:** 

### ONB-040
- **Type:** Validation
- **Current text:** Please enter both your first and last name.
- **AR:** 

## Step 4 — How do you identify?


### ONB-041
- **Type:** Title
- **Current text:** How do you identify?
- **AR:** 

### ONB-042
- **Type:** Subtitle
- **Current text:** It sets your profile picture and how your advisor addresses you.
- **AR:** 

### ONB-043
- **Type:** Validation
- **Current text:** Please pick one.
- **AR:** 

### ONB-044
- **Type:** Option
- **Current text:** Male
- **AR:** 

### ONB-045
- **Type:** Option
- **Current text:** Female
- **AR:** 

### ONB-046
- **Type:** Option
- **Current text:** Prefer not to say
- **AR:** 

## Step 5 — When were you born?


### ONB-047
- **Type:** Title
- **Current text:** When were you born?
- **AR:** 

### ONB-048
- **Type:** Subtitle
- **Current text:** Age rules differ per programme and per visa step, so we check them for you.
- **AR:** 

### ONB-049
- **Type:** Validation
- **Current text:** You need to be over 16 to apply. Check the date you entered.
- **Condition:** shown when age 16 or under, or the date is empty/invalid. `16` is MIN_AGE-1, computed
- **AR:** 

## Step 6 — Which city do you live in?


### ONB-050
- **Type:** Title
- **Current text:** Which city do you live in?
- **AR:** 

### ONB-051
- **Type:** Subtitle
- **Current text:** It decides which consulate and appointment centre your file goes through.
- **AR:** 

### ONB-052
- **Type:** Placeholder
- **Current text:** e.g. Casablanca
- **AR:** 

### ONB-053
- **Type:** Validation
- **Current text:** Please enter your city.
- **AR:** 

## Step 7 — What is your WhatsApp number?


### ONB-054
- **Type:** Title
- **Current text:** What is your WhatsApp number?
- **AR:** 

### ONB-055
- **Type:** Subtitle
- **Current text:** Your advisor reaches you here. We never share it with anyone.
- **AR:** 

### ONB-056
- **Type:** Placeholder
- **Current text:** 6 12 34 56 78
- **AR:** 

### ONB-057
- **Type:** aria-label
- **Current text:** Country dialling code
- **AR:** 

### ONB-058
- **Type:** aria-label
- **Current text:** WhatsApp number
- **AR:** 

### ONB-059
- **Type:** Validation
- **Current text:** Enter a Moroccan mobile: 06/07 and ten digits, or 6/7 and nine.
- **Condition:** shown when dialling code is +212
- **AR:** 

### ONB-060
- **Type:** Validation
- **Current text:** Enter a valid WhatsApp number.
- **Condition:** shown when any other dialling code
- **AR:** 

## Step 8 — Nice to meet you (note)


### ONB-061
- **Type:** Title
- **Current text:** Nice to meet you, {firstName}.
- **Condition:** shown when a name is known; otherwise the variant below
- **AR:** 

### ONB-062
- **Type:** Title
- **Current text:** Nice to meet you.
- **Condition:** shown when no first name stored yet
- **AR:** 

### ONB-063
- **Type:** Body
- **Current text:** Now the part that decides everything: what you have studied so far, and what you want to study next.
- **AR:** 

### ONB-064
- **Type:** CTA
- **Current text:** Continue
- **AR:** 

## Step 9 — Your studies and timing


### ONB-065
- **Type:** Title
- **Current text:** When do you want to start?
- **AR:** 

### ONB-066
- **Type:** Title
- **Current text:** What is your last degree?
- **AR:** 

### ONB-067
- **Type:** Title
- **Current text:** Which year did you finish it?
- **AR:** 

### ONB-068
- **Type:** Title
- **Current text:** What did you study?
- **AR:** 

### ONB-069
- **Type:** Subtitle
- **Current text:** The subject written on your diploma.
- **AR:** 

### ONB-070
- **Type:** Title
- **Current text:** What was your final grade?
- **AR:** 

### ONB-071
- **Type:** Subtitle
- **Current text:** Out of 20. You need at least 10 to apply.
- **AR:** 

### ONB-072
- **Type:** Section title
- **Current text:** Your studies and timing
- **AR:** 


### ONB-073
- **Type:** Label / option
- **Current text:** High school
- **AR:** 

### ONB-074
- **Type:** Label / option
- **Current text:** Bachelor's degree
- **AR:** 

### ONB-075
- **Type:** Label / option
- **Current text:** Master's degree
- **AR:** 

### ONB-076
- **Type:** Label / option
- **Current text:** Natural Sciences
- **AR:** 

### ONB-077
- **Type:** Label / option
- **Current text:** Social Sciences
- **AR:** 

### ONB-078
- **Type:** Label / option
- **Current text:** Your last degree and when you'd like to start, so we can match programs to you.
- **AR:** 

### ONB-079
- **Type:** Label / option
- **Current text:** Your timing
- **AR:** 

### ONB-080
- **Type:** Label / option
- **Current text:** When you want to start
- **AR:** 

### ONB-081
- **Type:** Placeholder
- **Current text:** Select an intake
- **AR:** 

### ONB-082
- **Type:** Label / option
- **Current text:** Your education
- **AR:** 

### ONB-083
- **Type:** Label / option
- **Current text:** What you've done and what's next
- **AR:** 

### ONB-084
- **Type:** Label / option
- **Current text:** High school - Baccalauréat
- **AR:** 

### ONB-085
- **Type:** Label / option
- **Current text:** Bachelor's - Licence
- **AR:** 

### ONB-086
- **Type:** Label / option
- **Current text:** Year of last degree
- **AR:** 

### ONB-087
- **Type:** Placeholder
- **Current text:** Select year
- **AR:** 

### ONB-088
- **Type:** Label / option
- **Current text:** Field of study
- **AR:** 

### ONB-089
- **Type:** Title
- **Current text:** What degree do you want to study abroad?
- **AR:** 

### ONB-090
- **Type:** Helper note (conditional)
- **Current text:** Master's requires a completed Bachelor's degree.
- **AR:** 
## Step 10 — Now the interesting part (note)


### ONB-091
- **Type:** Title
- **Current text:** Now the interesting part.
- **AR:** 

### ONB-092
- **Type:** Body
- **Current text:** Tell us what you want to study and what you can spend, and we will rank real programmes against it.
- **AR:** 

## Step 11 — Set up your program profile


### ONB-093
- **Type:** Section title
- **Current text:** Set up your program profile
- **AR:** 

### ONB-094
- **Type:** Title
- **Current text:** What do you want to study abroad?
- **AR:** 

### ONB-095
- **Type:** Title
- **Current text:** Which fields interest you?
- **AR:** 

### ONB-096
- **Type:** Subtitle
- **Current text:** Pick up to 2. We rank real programmes against them.
- **AR:** 

### ONB-097
- **Type:** Title
- **Current text:** What is your yearly tuition budget?
- **AR:** 

### ONB-098
- **Type:** Subtitle
- **Current text:** In euros per year. Most programmes start around 4,500 €.
- **AR:** 


### ONB-099
- **Type:** Label / option
- **Current text:** Arts & Design
- **AR:** 

### ONB-100
- **Type:** Label / option
- **Current text:** Computer & IT
- **AR:** 

### ONB-101
- **Type:** Label / option
- **Current text:** Finance & Economics
- **AR:** 

### ONB-102
- **Type:** Label / option
- **Current text:** Languages & Humanities
- **AR:** 

### ONB-103
- **Type:** Label / option
- **Current text:** Logistics & Transport
- **AR:** 

### ONB-104
- **Type:** Label / option
- **Current text:** Mechatronics & TECH
- **AR:** 

### ONB-105
- **Type:** Label / option
- **Current text:** Media & Communication
- **AR:** 

### ONB-106
- **Type:** Label / option
- **Current text:** Medicine & Health
- **AR:** 

### ONB-107
- **Type:** Label / option
- **Current text:** Tourism & Hospitality
- **AR:** 

### ONB-108
- **Type:** Label / option
- **Current text:** Tell us what you're looking for, and we'll match you to real Lithuanian programs from our database.
- **AR:** 

### ONB-109
- **Type:** Label / option
- **Current text:** What you're looking for
- **AR:** 

### ONB-110
- **Type:** Label / option
- **Current text:** Your program preferences
- **AR:** 

### ONB-111
- **Type:** Label / option
- **Current text:** Field of interest
- **AR:** 

### ONB-112
- **Type:** Label / option
- **Current text:** Max tuition budget
- **AR:** 

### ONB-113
- **Type:** Helper note
- **Current text:** The lowest tuition we can match you to is 2,800 € per year.
- **AR:** 
## Step 12 — Do you already have an English test?


### ONB-114
- **Type:** Title
- **Current text:** Do you already have an English test?
- **AR:** 

### ONB-115
- **Type:** Option
- **Current text:** Yes
- **AR:** 

### ONB-116
- **Type:** Option
- **Current text:** No
- **AR:** 

### ONB-117
- **Type:** Title
- **Current text:** Which test did you take?
- **Condition:** shown when has_english_test = yes
- **AR:** 

### ONB-118
- **Type:** Placeholder
- **Current text:** Choose a test
- **Condition:** shown when has_english_test = yes
- **AR:** 

### ONB-119
- **Type:** Test option
- **Current text:** Duolingo English Test
- **AR:** 

### ONB-120
- **Type:** Test option
- **Current text:** IELTS
- **AR:** 

### ONB-121
- **Type:** Test option
- **Current text:** TOEFL
- **AR:** 

### ONB-122
- **Type:** Test option
- **Current text:** Cambridge (FCE/CAE)
- **AR:** 

### ONB-123
- **Type:** Test option
- **Current text:** English Test Core
- **AR:** 

### ONB-124
- **Type:** Test option
- **Current text:** Other
- **AR:** 

### ONB-125
- **Type:** Title
- **Current text:** Which test is it?
- **Condition:** shown when english_test_type = other
- **AR:** 

### ONB-126
- **Type:** Placeholder
- **Current text:** e.g. PTE Academic
- **Condition:** shown when english_test_type = other
- **AR:** 

### ONB-127
- **Type:** Label
- **Current text:** Test name
- **Condition:** shown when english_test_type = other
- **AR:** 

### ONB-128
- **Type:** Title
- **Current text:** What score did you get?
- **Condition:** shown when a test other than Other is chosen
- **AR:** 

### ONB-129
- **Type:** Subtitle
- **Current text:** Numbers only, exactly as it appears on your certificate.
- **AR:** 

### ONB-130
- **Type:** Placeholder
- **Current text:** your test score
- **AR:** 

### ONB-131
- **Type:** Hint
- **Current text:** numbers only
- **AR:** 

### ONB-132
- **Type:** Label
- **Current text:** Test score
- **AR:** 

### ONB-133
- **Type:** Score helper note
- **Current text:** IELTS bands run 0 to 9, in half steps.
- **Condition:** shown when selected test is IELTS
- **AR:** 

### ONB-134
- **Type:** Validation
- **Current text:** That score is outside the range for this test. IELTS bands run 0 to 9, in half steps.
- **Condition:** shown when IELTS chosen and the score is out of range
- **AR:** 

### ONB-135
- **Type:** Score helper note
- **Current text:** TOEFL runs 1 to 6 in half points. A 0 to 120 total is still accepted.
- **Condition:** shown when selected test is TOEFL
- **AR:** 

### ONB-136
- **Type:** Validation
- **Current text:** That score is outside the range for this test. TOEFL runs 1 to 6 in half points. A 0 to 120 total is still accepted.
- **Condition:** shown when TOEFL chosen and the score is out of range
- **AR:** 

### ONB-137
- **Type:** Score helper note
- **Current text:** On the Cambridge English Scale, 80 to 230 depending on the exam.
- **Condition:** shown when selected test is Cambridge
- **AR:** 

### ONB-138
- **Type:** Validation
- **Current text:** That score is outside the range for this test. On the Cambridge English Scale, 80 to 230 depending on the exam.
- **Condition:** shown when Cambridge chosen and the score is out of range
- **AR:** 

### ONB-139
- **Type:** Score helper note
- **Current text:** Duolingo scores run 10 to 160, in steps of 5.
- **Condition:** shown when selected test is Duolingo
- **AR:** 

### ONB-140
- **Type:** Validation
- **Current text:** That score is outside the range for this test. Duolingo scores run 10 to 160, in steps of 5.
- **Condition:** shown when Duolingo chosen and the score is out of range
- **AR:** 

### ONB-141
- **Type:** Score helper note
- **Current text:** English Test Core runs 0 to 599.
- **Condition:** shown when selected test is EnglishCore
- **AR:** 

### ONB-142
- **Type:** Validation
- **Current text:** That score is outside the range for this test. English Test Core runs 0 to 599.
- **Condition:** shown when EnglishCore chosen and the score is out of range
- **AR:** 

### ONB-143
- **Type:** Title
- **Current text:** How well do you speak English?
- **AR:** 

### ONB-144
- **Type:** Placeholder
- **Current text:** Choose a level
- **AR:** 

### ONB-145
- **Type:** Level option
- **Current text:** A1 — Beginner
- **AR:** 

### ONB-146
- **Type:** Level option
- **Current text:** A2 — Elementary
- **AR:** 

### ONB-147
- **Type:** Level option
- **Current text:** B1 — Intermediate
- **AR:** 

### ONB-148
- **Type:** Level option
- **Current text:** B2 — Upper intermediate
- **AR:** 

### ONB-149
- **Type:** Level option
- **Current text:** C1 — Advanced
- **AR:** 

### ONB-150
- **Type:** Level option
- **Current text:** C2 — Proficient
- **AR:** 


### ONB-151
- **Type:** Title
- **Current text:** Do you have an English test?
- **AR:** 

### ONB-152
- **Type:** Title
- **Current text:** Which English test?
- **AR:** 

### ONB-153
- **Type:** Label / option
- **Current text:** Your English speaking level
- **AR:** 
## Step 13 — Pick your programme


### ONB-154
- **Type:** Title
- **Current text:** Pick your programme
- **AR:** 

### ONB-155
- **Type:** Subtitle
- **Current text:** One programme, the one we build your whole file around. You can ask your advisor to change it later.
- **AR:** 

### ONB-156
- **Type:** Mode option
- **Current text:** Help me choose
- **AR:** 

### ONB-157
- **Type:** Mode option sub
- **Current text:** Ranked against your answers
- **AR:** 

### ONB-158
- **Type:** Mode option
- **Current text:** I'll choose myself
- **AR:** 

### ONB-159
- **Type:** Mode option sub
- **Current text:** Search the full catalogue
- **AR:** 

### ONB-160
- **Type:** Placeholder
- **Current text:** Search programmes or universities
- **AR:** 

### ONB-161
- **Type:** List note
- **Current text:** Your {n} closest matches out of {total}, best first
- **Condition:** shown when help mode, profile complete
- **AR:** 

### ONB-162
- **Type:** List note
- **Current text:** Fill in your field of interest and budget to see these ranked for you.
- **Condition:** shown when help mode, profile incomplete
- **AR:** 

### ONB-163
- **Type:** List note
- **Current text:** {n} programmes matching “{query}”
- **Condition:** shown when search mode with a query
- **AR:** 

### ONB-164
- **Type:** List note
- **Current text:** Every programme we work with. Showing {n} of {total}.
- **Condition:** shown when search mode, empty query
- **AR:** 

### ONB-165
- **Type:** Score badge
- **Current text:** Perfect match
- **Condition:** shown when programme is a perfect match
- **AR:** 

### ONB-166
- **Type:** Score badge
- **Current text:** {score}%
- **AR:** 

### ONB-167
- **Type:** Tuition (beside university)
- **Current text:** €{tuition}/year
- **AR:** 

### ONB-168
- **Type:** aria-label
- **Current text:** About {programmeName}
- **AR:** 


### ONB-169
- **Type:** Title
- **Current text:** How do you want to pick?
- **AR:** 

### ONB-170
- **Type:** Placeholder
- **Current text:** Search by name, field or university
- **AR:** 

### ONB-171
- **Type:** Empty state
- **Current text:** Nothing matches that. Try a shorter word, or clear the search.
- **AR:** 
## Step 13a — Programme information modal


### ONB-172
- **Type:** Fact label
- **Current text:** Field
- **AR:** 

### ONB-173
- **Type:** Fact label
- **Current text:** Tuition
- **AR:** 

### ONB-174
- **Type:** Fact label
- **Current text:** Application fee
- **AR:** 

### ONB-175
- **Type:** Fact label
- **Current text:** Intake
- **AR:** 

### ONB-176
- **Type:** Fact label
- **Current text:** Study period
- **AR:** 

### ONB-177
- **Type:** Fact label
- **Current text:** Deadline
- **AR:** 

### ONB-178
- **Type:** Fact label
- **Current text:** Minimum grade
- **AR:** 

### ONB-179
- **Type:** Fact label
- **Current text:** English required
- **AR:** 

### ONB-180
- **Type:** Fact value
- **Current text:** €{amount} per year
- **AR:** 

### ONB-181
- **Type:** Fact value
- **Current text:** Not published
- **Condition:** shown when the programme has no published tuition
- **AR:** 

### ONB-182
- **Type:** Fact value
- **Current text:** {grade} / 20
- **AR:** 

### ONB-183
- **Type:** Modal section title
- **Current text:** Where you fall short today
- **Condition:** shown when the ranking found gaps
- **AR:** 

### ONB-184
- **Type:** Button
- **Current text:** Got it
- **AR:** 

### ONB-185
- **Type:** aria-label
- **Current text:** Close
- **AR:** 

## Step 14 — How much help do you want?


### ONB-186
- **Type:** Title
- **Current text:** How much help do you want?
- **AR:** 

### ONB-187
- **Type:** Subtitle
- **Current text:** Two ways to do this: drive it yourself, or hand the paperwork to an advisor. You can change plan later.
- **Condition:** shown when DESKTOP ONLY — hidden on phones
- **AR:** 

### ONB-188
- **Type:** Notice
- **Current text:** Important:
- **AR:** 

### ONB-189
- **Type:** Notice (desktop)
- **Current text:** Please read what each plan includes before you choose, and our Refund Policy before you pay.
- **AR:** 

### ONB-190
- **Type:** Notice (mobile)
- **Current text:** Read what each plan includes before you choose, and our Refund Policy before you pay.
- **Condition:** shown when MOBILE ONLY
- **AR:** 

### ONB-191
- **Type:** Link
- **Current text:** Refund Policy
- **AR:** 

### ONB-192
- **Type:** Button (mobile)
- **Current text:** Compare plans
- **Condition:** shown when MOBILE ONLY
- **AR:** 

### ONB-193
- **Type:** Button (mobile)
- **Current text:** Free consultation
- **Condition:** shown when MOBILE ONLY, support number configured
- **AR:** 

### ONB-194
- **Type:** Button (desktop)
- **Current text:** Free consultation about the plans
- **Condition:** shown when DESKTOP ONLY
- **AR:** 

### ONB-195
- **Type:** WhatsApp prefill
- **Current text:** Hello AfaqWay, I am choosing a plan and I would like a free consultation about which one fits me.
- **AR:** 

### ONB-196
- **Type:** Badge
- **Current text:** Most popular
- **Condition:** shown when the plan is flagged popular
- **AR:** 

### ONB-197
- **Type:** Button (desktop)
- **Current text:** Choose {planName}
- **AR:** 

### ONB-198
- **Type:** Button (mobile)
- **Current text:** Continue with {planName}
- **AR:** 

### ONB-199
- **Type:** Button (mobile)
- **Current text:** Pick a plan to continue
- **Condition:** shown when MOBILE ONLY, no plan picked
- **AR:** 

### ONB-200
- **Type:** Button (mobile)
- **Current text:** Read all {n} features
- **Condition:** shown when MOBILE ONLY, plan picked
- **AR:** 

### ONB-201
- **Type:** Plan name
- **Current text:** Self Service
- **AR:** 

### ONB-202
- **Type:** Plan tagline
- **Current text:** For students who drive it themselves.
- **AR:** 

### ONB-203
- **Type:** Plan name
- **Current text:** Full Service
- **AR:** 

### ONB-204
- **Type:** Plan tagline
- **Current text:** We handle it, you just track it.
- **AR:** 

### ONB-205
- **Type:** Currency
- **Current text:** {price} MAD
- **AR:** 


### ONB-206
- **Type:** Label / option
- **Current text:** Pricing & Checkout
- **AR:** 

### ONB-207
- **Type:** Label / option
- **Current text:** Pick the level of hand-holding that fits you, then complete your payment.
- **AR:** 
## Step 14a — Plan comparison sheet


### ONB-208
- **Type:** Modal title
- **Current text:** Your plans, compared in full
- **AR:** 

### ONB-209
- **Type:** Modal title (Arabic, already present)
- **Current text:** مقارنة الخطتين
- **AR:** 

### ONB-210
- **Type:** Modal subtitle
- **Current text:** Everything each plan includes.
- **AR:** 

### ONB-211
- **Type:** Modal subtitle (Arabic, already present)
- **Current text:** كل ما تحصل عليه في كل خطة.
- **AR:** 

### ONB-212
- **Type:** Language toggle
- **Current text:** EN
- **AR:** 

### ONB-213
- **Type:** Language toggle
- **Current text:** ع
- **AR:** 

### ONB-214
- **Type:** Button (mobile)
- **Current text:** Done
- **Condition:** shown when MOBILE ONLY
- **AR:** 

### ONB-215
- **Type:** Button (mobile, Arabic)
- **Current text:** تم
- **Condition:** shown when MOBILE ONLY, Arabic selected
- **AR:** 

### ONB-216
- **Type:** aria-label
- **Current text:** Plan features
- **AR:** 
## Step 15 — Complete your payment


### ONB-217
- **Type:** Title
- **Current text:** Complete your payment
- **AR:** 

### ONB-218
- **Type:** Subtitle
- **Current text:** Transfer the amount, then upload the receipt. We verify it by hand.
- **AR:** 

### ONB-219
- **Type:** Payment reference
- **Current text:** Payment ID {ref}
- **AR:** 

### ONB-220
- **Type:** Payment method
- **Current text:** Cash Plus
- **AR:** 

### ONB-221
- **Type:** Payment method desc
- **Current text:** Pay cash at any Cash Plus agency
- **AR:** 

### ONB-222
- **Type:** Payment method
- **Current text:** Attijariwafa Bank
- **AR:** 

### ONB-223
- **Type:** Payment method desc
- **Current text:** Bank transfer or deposit
- **AR:** 

### ONB-224
- **Type:** Payment method
- **Current text:** Simple
- **AR:** 

### ONB-225
- **Type:** Payment method desc
- **Current text:** Transfer via Simple
- **AR:** 

### ONB-226
- **Type:** Payment method
- **Current text:** Bank Transfer
- **AR:** 

### ONB-227
- **Type:** Payment method desc
- **Current text:** Transfer from any bank
- **AR:** 

### ONB-228
- **Type:** Payment method
- **Current text:** PayPal
- **AR:** 

### ONB-229
- **Type:** Payment method desc
- **Current text:** Instant online payment
- **AR:** 

### ONB-230
- **Type:** Payment method
- **Current text:** Credit / Debit Card
- **AR:** 

### ONB-231
- **Type:** Payment method desc
- **Current text:** Visa or Mastercard
- **AR:** 

### ONB-232
- **Type:** Badge
- **Current text:** Recommended
- **Condition:** shown when method is flagged recommended
- **AR:** 

### ONB-233
- **Type:** Badge
- **Current text:** Coming soon
- **Condition:** shown when method is not yet available
- **AR:** 

### ONB-234
- **Type:** Button
- **Current text:** Back to the plans
- **AR:** 

### ONB-235
- **Type:** Button
- **Current text:** Continue
- **AR:** 

## Step 15a — Invoice details and upload


### ONB-236
- **Type:** Section title
- **Current text:** Invoice details
- **AR:** 

### ONB-237
- **Type:** Row label
- **Current text:** Amount
- **AR:** 

### ONB-238
- **Type:** Row label
- **Current text:** RIB
- **AR:** 

### ONB-239
- **Type:** Row label
- **Current text:** Full name
- **AR:** 

### ONB-240
- **Type:** Section title
- **Current text:** Note
- **AR:** 

### ONB-241
- **Type:** Section title
- **Current text:** Invoice receipt
- **AR:** 

### ONB-242
- **Type:** Upload hint
- **Current text:** Upload the receipt / reçu here
- **AR:** 

### ONB-243
- **Type:** Rule
- **Current text:** Do not send fake or edited receipts, they will be rejected.
- **AR:** 

### ONB-244
- **Type:** Rule
- **Current text:** Your receipt must clearly show the transaction number.
- **AR:** 

### ONB-245
- **Type:** Rule
- **Current text:** Image or PDF, maximum 4 MB.
- **AR:** 

### ONB-246
- **Type:** Button
- **Current text:** Submit for review
- **AR:** 

### ONB-247
- **Type:** Button (busy)
- **Current text:** Submitting…
- **AR:** 

### ONB-248
- **Type:** Button
- **Current text:** Back to payment methods
- **AR:** 

### ONB-249
- **Type:** aria-label
- **Current text:** Copy {label}
- **AR:** 

### ONB-250
- **Type:** Empty state
- **Current text:** {method} will be available soon. For now, please pick Cash Plus or a bank transfer to complete your payment.
- **Condition:** shown when chosen method is not manual/available
- **AR:** 

## Step 15b — Payment states


### ONB-251
- **Type:** Overlay title
- **Current text:** Under review
- **Condition:** shown when payment submitted, awaiting verification
- **AR:** 

### ONB-252
- **Type:** Overlay body
- **Current text:** Verifying your payment, usually a few hours. Safe to close this page, we'll save your place.
- **AR:** 

### ONB-253
- **Type:** Link
- **Current text:** Contact support on WhatsApp
- **AR:** 

### ONB-254
- **Type:** Button
- **Current text:** Cancel this payment
- **AR:** 

### ONB-255
- **Type:** Dialog title
- **Current text:** Cancel this payment?
- **Condition:** shown when Cancel this payment pressed
- **AR:** 

### ONB-256
- **Type:** Dialog body
- **Current text:** We won't process your invoice, and you'll have to submit your receipt again.
- **AR:** 

### ONB-257
- **Type:** Button
- **Current text:** Keep waiting
- **AR:** 

### ONB-258
- **Type:** Button
- **Current text:** Yes, cancel
- **AR:** 

### ONB-259
- **Type:** Rejected title
- **Current text:** Your payment was rejected
- **Condition:** shown when status = rejected
- **AR:** 

### ONB-260
- **Type:** Rejected body
- **Current text:** Please upload a valid receipt and submit again, or contact support.
- **AR:** 

### ONB-261
- **Type:** aria-label
- **Current text:** Payment under review
- **AR:** 

## Step 16 — Your AfaqWay plan is ready


### ONB-262
- **Type:** Title
- **Current text:** Your AfaqWay plan is ready.
- **AR:** 

### ONB-263
- **Type:** Checkbox
- **Current text:** I have read and agree to the Terms of Service.
- **AR:** 

### ONB-264
- **Type:** Checkbox
- **Current text:** I have read and agree to the Refund Policy.
- **AR:** 

### ONB-265
- **Type:** Button
- **Current text:** Read
- **AR:** 

### ONB-266
- **Type:** Button
- **Current text:** Enter my dashboard
- **AR:** 

### ONB-267
- **Type:** Validation
- **Current text:** Please accept both before entering your dashboard.
- **Condition:** shown when Continue pressed with either checkbox unticked
- **AR:** 


### ONB-268
- **Type:** Label / option
- **Current text:** Study goal
- **AR:** 

### ONB-269
- **Type:** Label / option
- **Current text:** To be chosen with your advisor
- **AR:** 

### ONB-270
- **Type:** Label / option
- **Current text:** Advisor support
- **AR:** 

### ONB-271
- **Type:** Label / option
- **Current text:** Included, end to end
- **AR:** 

### ONB-272
- **Type:** Label / option
- **Current text:** On request, you drive it
- **AR:** 

### ONB-273
- **Type:** Label / option
- **Current text:** I have read the Refund Policy.
- **AR:** 

### ONB-274
- **Type:** Label / option
- **Current text:** Please accept both before we start your file.
- **AR:** 

### ONB-275
- **Type:** Label / option
- **Current text:** Your roadmap is ready
- **AR:** 

### ONB-276
- **Type:** Label / option
- **Current text:** Review everything below. Once you click Done, we generate your personalized roadmap.
- **AR:** 
## Mobile-only — device recommendation banner


### ONB-277
- **Type:** Banner (EN)
- **Current text:** For a smoother journey, we recommend a desktop, laptop or tablet.
- **Condition:** shown when MOBILE ONLY; hidden on the Dashboard; dismissed for the session via X
- **AR:** 

### ONB-278
- **Type:** Banner (AR, already present)
- **Current text:** لتجربة أسهل، ننصح باستخدام حاسوب مكتبي أو محمول أو جهاز لوحي.
- **AR:** 

### ONB-279
- **Type:** aria-label
- **Current text:** Dismiss this recommendation
- **AR:** 


---

## Appendix — Plan highlights and features


Kept apart from the steps above because these are long lists rather than single
strings. The Arabic already exists for the full feature lists and needs review
rather than translation.


### Self Service — Plan highlight (card)


**ONB-280**
- **Current text:** Free program-matching before you pay
- **AR:** 

**ONB-281**
- **Current text:** Personalized 6-stage roadmap
- **AR:** 

**ONB-282**
- **Current text:** Human review on every document
- **AR:** 

**ONB-283**
- **Current text:** Live document status on every upload
- **AR:** 

**ONB-284**
- **Current text:** Learning resources on every step
- **AR:** 

**ONB-285**
- **Current text:** 24/7 support access
- **AR:** 

**ONB-286**
- **Current text:** Reminders before every deadline
- **AR:** 

**ONB-287**
- **Current text:** A calendar with every deadline and intake
- **AR:** 

**ONB-288**
- **Current text:** One inbox for every update on your file
- **AR:** 

**ONB-289**
- **Current text:** A downloadable invoice for every payment
- **AR:** 

**ONB-290**
- **Current text:** Fees and English requirements kept current
- **AR:** 

**ONB-291**
- **Current text:** You mark your own steps done
- **AR:** 

### Self Service — Plan feature (comparison sheet, EN)


**ONB-292**
- **Current text:** Free program-matching guidance before you pay for anything
- **AR:** 

**ONB-293**
- **Current text:** A personalized 6-stage roadmap with step-by-step checklists you tick off yourself
- **AR:** 

**ONB-294**
- **Current text:** Human document review on every upload, a real reviewer, not a robot (avg 48h)
- **AR:** 

**ONB-295**
- **Current text:** Learning resources on every step: links, PDFs, videos, and plain-language explanations
- **AR:** 

**ONB-296**
- **Current text:** Full visibility into document status: Under review, Needs changes, or Approved
- **AR:** 

**ONB-297**
- **Current text:** 24/7 support access
- **AR:** 

**ONB-298**
- **Current text:** Automatic reminders before every deadline and appointment
- **AR:** 

**ONB-299**
- **Current text:** A calendar carrying every deadline, appointment and intake date
- **AR:** 

**ONB-300**
- **Current text:** One inbox for every update on your file, so nothing arrives only by email
- **AR:** 

**ONB-301**
- **Current text:** Your programme's fees, deadlines and English requirements kept current for you
- **AR:** 

**ONB-302**
- **Current text:** The steps that are genuinely yours to call, you mark done yourself
- **AR:** 

**ONB-303**
- **Current text:** A downloadable invoice for every payment you make
- **AR:** 

### Self Service — Plan feature (comparison sheet, AR — already translated)


**ONB-304**
- **Current text:** توجيه مجاني لاختيار البرنامج المناسب قبل أن تدفع أي شيء
- **AR:** 

**ONB-305**
- **Current text:** خارطة طريق مخصّصة من 6 مراحل مع قوائم مهام تنجزها بنفسك خطوة بخطوة
- **AR:** 

**ONB-306**
- **Current text:** مراجعة بشرية لكل وثيقة ترفعها، مراجِع حقيقي وليس آلة (بمعدّل 48 ساعة)
- **AR:** 

**ONB-307**
- **Current text:** موارد تعليمية في كل خطوة: روابط وملفات PDF وفيديوهات وشروحات مبسّطة
- **AR:** 

**ONB-308**
- **Current text:** رؤية كاملة لحالة كل وثيقة: قيد المراجعة، تحتاج تعديلات، أو مقبولة
- **AR:** 

**ONB-309**
- **Current text:** دعم متاح على مدار الساعة طوال أيام الأسبوع
- **AR:** 

**ONB-310**
- **Current text:** تذكيرات تلقائية قبل كل موعد نهائي وكل موعد رسمي
- **AR:** 

**ONB-311**
- **Current text:** تقويم يجمع كل المواعيد النهائية والمواعيد الرسمية وتواريخ الالتحاق
- **AR:** 

**ONB-312**
- **Current text:** صندوق واحد يجمع كل التحديثات على ملفك، فلا يصلك شيء عبر البريد وحده
- **AR:** 

**ONB-313**
- **Current text:** رسوم برنامجك ومواعيده وشروط اللغة الإنجليزية، محدّثة لك دائماً
- **AR:** 

**ONB-314**
- **Current text:** الخطوات التي يعود قرارها إليك حقاً، تؤشّر إنجازها بنفسك
- **AR:** 

**ONB-315**
- **Current text:** فاتورة قابلة للتحميل عن كل دفعة تقوم بها
- **AR:** 

### Full Service — Plan highlight (card)


**ONB-316**
- **Current text:** Everything in Self Service, done for you
- **AR:** 

**ONB-317**
- **Current text:** A dedicated admin runs your whole file
- **AR:** 

**ONB-318**
- **Current text:** Live tracker of your application
- **AR:** 

**ONB-319**
- **Current text:** Document requests and updates by chat
- **AR:** 

**ONB-320**
- **Current text:** Interview preparation coaching
- **AR:** 

**ONB-321**
- **Current text:** Priority review, from start to settled
- **AR:** 

**ONB-322**
- **Current text:** Service and support after you arrive
- **AR:** 

**ONB-323**
- **Current text:** Post-arrival checklist once your permit lands
- **AR:** 

**ONB-324**
- **Current text:** One inbox for every update on your file
- **AR:** 

**ONB-325**
- **Current text:** Fees and requirements kept current for you
- **AR:** 

**ONB-326**
- **Current text:** The platform drives every step, not just guides it
- **AR:** 

**ONB-327**
- **Current text:** Human document review, average 48 hours
- **AR:** 

### Full Service — Plan feature (comparison sheet, EN)


**ONB-328**
- **Current text:** Free program-matching guidance before you pay for anything
- **AR:** 

**ONB-329**
- **Current text:** A personalized 6-stage roadmap with step-by-step checklists
- **AR:** 

**ONB-330**
- **Current text:** Human document review on every upload, a real reviewer, not a robot (avg 48h)
- **AR:** 

**ONB-331**
- **Current text:** Learning resources on every step: links, PDFs, videos, and plain-language explanations
- **AR:** 

**ONB-332**
- **Current text:** Full visibility into document status: Under review, Needs changes, or Approved
- **AR:** 

**ONB-333**
- **Current text:** 24/7 support access
- **AR:** 

**ONB-334**
- **Current text:** Automatic reminders before every deadline and appointment
- **AR:** 

**ONB-335**
- **Current text:** A calendar carrying every deadline, appointment and intake date
- **AR:** 

**ONB-336**
- **Current text:** One inbox for every update on your file, so nothing arrives only by email
- **AR:** 

**ONB-337**
- **Current text:** Your programme's fees, deadlines and English requirements kept current for you
- **AR:** 

**ONB-338**
- **Current text:** The steps that are genuinely yours to call, you mark done yourself
- **AR:** 

**ONB-339**
- **Current text:** A downloadable invoice for every payment you make
- **AR:** 

**ONB-340**
- **Current text:** The platform drives every step for you, not just guides it
- **AR:** 

**ONB-341**
- **Current text:** A dedicated admin manages your entire application file
- **AR:** 

**ONB-342**
- **Current text:** Live tracker showing exactly where your application stands
- **AR:** 

**ONB-343**
- **Current text:** Dedicated service and support after you arrive in your study country
- **AR:** 

**ONB-344**
- **Current text:** Document requests and updates sent to you by chat
- **AR:** 

**ONB-345**
- **Current text:** Full interview preparation coaching for university and migration interviews
- **AR:** 

**ONB-346**
- **Current text:** Post-arrival support checklist after your residence permit is approved
- **AR:** 

**ONB-347**
- **Current text:** Priority human review and hands-on guidance from start to settled
- **AR:** 

### Full Service — Plan feature (comparison sheet, AR — already translated)


**ONB-348**
- **Current text:** توجيه مجاني لاختيار البرنامج المناسب قبل أن تدفع أي شيء
- **AR:** 

**ONB-349**
- **Current text:** خارطة طريق مخصّصة من 6 مراحل مع قوائم مهام خطوة بخطوة
- **AR:** 

**ONB-350**
- **Current text:** مراجعة بشرية لكل وثيقة ترفعها، مراجِع حقيقي وليس آلة (بمعدّل 48 ساعة)
- **AR:** 

**ONB-351**
- **Current text:** موارد تعليمية في كل خطوة: روابط وملفات PDF وفيديوهات وشروحات مبسّطة
- **AR:** 

**ONB-352**
- **Current text:** رؤية كاملة لحالة كل وثيقة: قيد المراجعة، تحتاج تعديلات، أو مقبولة
- **AR:** 

**ONB-353**
- **Current text:** دعم متاح على مدار الساعة طوال أيام الأسبوع
- **AR:** 

**ONB-354**
- **Current text:** تذكيرات تلقائية قبل كل موعد نهائي وكل موعد رسمي
- **AR:** 

**ONB-355**
- **Current text:** تقويم يجمع كل المواعيد النهائية والمواعيد الرسمية وتواريخ الالتحاق
- **AR:** 

**ONB-356**
- **Current text:** صندوق واحد يجمع كل التحديثات على ملفك، فلا يصلك شيء عبر البريد وحده
- **AR:** 

**ONB-357**
- **Current text:** رسوم برنامجك ومواعيده وشروط اللغة الإنجليزية، محدّثة لك دائماً
- **AR:** 

**ONB-358**
- **Current text:** الخطوات التي يعود قرارها إليك حقاً، تؤشّر إنجازها بنفسك
- **AR:** 

**ONB-359**
- **Current text:** فاتورة قابلة للتحميل عن كل دفعة تقوم بها
- **AR:** 

**ONB-360**
- **Current text:** المنصّة تتولّى كل خطوة نيابةً عنك، لا تكتفي بالإرشاد فقط
- **AR:** 

**ONB-361**
- **Current text:** مستشار مخصّص يدير ملف طلبك بالكامل
- **AR:** 

**ONB-362**
- **Current text:** متابعة مباشرة تُظهر بالضبط أين وصل طلبك
- **AR:** 

**ONB-363**
- **Current text:** خدمة ومرافقة مخصّصة بعد وصولك إلى بلد الدراسة
- **AR:** 

**ONB-364**
- **Current text:** طلبات الوثائق وتحديثاتها تصلك عبر المحادثة
- **AR:** 

**ONB-365**
- **Current text:** تدريب كامل على مقابلات الجامعة ومكتب الهجرة
- **AR:** 

**ONB-366**
- **Current text:** قائمة دعم ما بعد الوصول بعد الموافقة على تصريح الإقامة
- **AR:** 

**ONB-367**
- **Current text:** مراجعة بشرية ذات أولوية ومرافقة عملية من البداية حتى الاستقرار
- **AR:** 


---

## Not included

- University and programme names. They come from the programme catalogue rather
  than from onboarding, and they are proper nouns.
- Bank account details (RIB, account holder). Literals that must not be translated.
- Everything after `Enter my dashboard`, which is the workspace, not onboarding.
- Anything the student never sees.

