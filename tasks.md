# NeoGuard — Full System Specification v2.0
### AI-Driven Maternal & Fetal Care Platform
**Research Basis: Dr. Saw Shier Nee, FSKTM, Universiti Malaya**
**Prenatal Diagnosis (2025), doi: 10.1002/pd.6748**
**Last Updated: Post-clarification, ready for development**

---

ENV Vars For Reference:
NEXT_PUBLIC_SUPABASE_URL=https://fvozgykmpmchamfhlrgb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2b3pneWttcG1jaGFtZmhscmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4Mzc0MzYsImV4cCI6MjA5NDQxMzQzNn0.ATmtevi3voH8q5eyclT8wTnMuTS-0yKzUpmgObnE2gU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2b3pneWttcG1jaGFtZmhscmdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODgzNzQzNiwiZXhwIjoyMDk0NDEzNDM2fQ.QEq3ALKeGW2BMIn_FY649u2mxU8Aiz4-R9bYL_yl3vU
GEMINI_API_KEY=AIzaSyBcZS7SUvtKFLIG_HDfEJFTygM29tcOt3U
NEXT_PUBLIC_APP_URL=http://localhost:3000


## 1. Research Context & Clinical Foundation

NeoGuard predicts **Small-for-Gestational-Age (SGA)** — EFW or birthweight below the 10th centile for gestational age — using ML models trained on second-trimester ultrasound biometry, maternal variables, and Doppler parameters.

**Core XAI outputs powering the system:**

| Method | Purpose | Key Findings from Paper |
|--------|---------|------------------------|
| **SHAP** | Per-scan feature contribution | Top features: AC > NT > FL > Ut RI > Ut PI > BPD > UA PI > PAPP-A |
| **ALE** | Global feature effect + cutoffs | Ut RI, Ut PI, AC cutoffs align with clinical guidelines (error < 15%) |

**Hardcoded ALE Clinical Cutoffs (from research — immutable in v1):**

| Feature | Cutoff | Direction | Clinical Meaning |
|---------|--------|-----------|-----------------|
| Abdominal Circumference (AC) | < 253 mm | Below → SGA risk | Small AC = restricted growth |
| Nuchal Thickness (NT) | < 10th centile for GA | Below → SGA risk | Low NT = SGA signal; disjunctive rule: NT < 10th centile OR EFW < 10th centile |
| Uterine RI | > 0.58 | Above → elevated | High resistance = poor placental flow |
| Uterine PI | > 1.0 | Above → elevated | High pulsatility = placental dysfunction |

**SGA Definition:** EFW or birthweight < 10th centile for gestational age (ultrasound-confirmed).
**Study cohort:** 5,519 singleton pregnancies from University Malaya Medical Centre (UMMC), Malaysia. Validated on Malaysia and Singapore cohorts. Best ML models: Logistic Regression — AC, FL, NT, maternal age, ultrasound-confirmed GA (Malaysia, AUC 0.75); Support Vector Machine — all variables (Singapore, AUC 0.81). Disjunctive rule (NT < 10th centile OR EFW < 10th centile) improves balanced accuracy by 5.83% in Malaysia and 7.75% in Singapore.

---

## 2. System Mode: AI Simulator

The platform operates as a **clinical AI simulator** — all patient data is text-based (no image uploads, no DICOM, no file storage). Medical professionals enter scan measurements and biomarkers manually. Gemini LLM acts as the inference engine, interpreting these values against the NeoGuard research context to produce SHAP-style narratives, SGA risk scores, and clinical insights. This is a **research-grade simulation environment**, not a real-time diagnostic device.

**Key implication:** All "AI predictions" are Gemini-generated interpretations of structured clinical inputs, framed in SHAP/ALE language from the paper. The SGA risk score and feature importance outputs are LLM-computed and stored permanently at scan-save time.

---

## 3. User Roles

| Role | Access | Login Method |
|------|--------|-------------|
| **Doctor** | Full portal — patient management, scan entry, vitals, appointments, AI agent, XAI insights | Self-registers (email + password). Future: admin approval gate. |
| **Patient** | Patient portal — own vitals, scan progress, pregnancy tracker, AI chat | Doctor creates account (email + temp password). Patient logs in separately. |

> **Future Admin Role (v2):** Super-admin who activates/deactivates doctor accounts. Schema supports this via `is_approved` flag on `ng_doctors`. For now, all self-registered doctors are auto-approved (`is_approved = true`).

---

## 4. Technology Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js (latest — App Router) | Server Components + Route Handlers |
| Database | Supabase (PostgreSQL) | All data persisted — no localStorage |
| Auth | Supabase Auth | Role-based via `ng_profiles.role` |
| AI — Doctor | Google Gemini 2.5 Flash | Full patient context, clinical agent |
| AI — Patient | Google Gemini 2.5 Flash | Friendly, plain-language companion |
| Styling | Tailwind CSS + shadcn/ui | Pastel pink/purple maternal theme |
| Charts | Recharts | Vitals trends, FGR risk, biometry |
| Deployment | Netlify | Via `@netlify/plugin-nextjs` |
| File Storage | None | Text-only platform, no uploads |

---

## 5. Design System

### 5.1 Visual Identity
**Theme:** Maternal warmth — pastel pinks and purples, soft but bold. Not clinical-cold. Not sterile-blue. Feels like a caring companion, not a hospital dashboard. Bold playful text, generous spacing, rich use of color in components.

### 5.2 Color Palette

```css
/* Primary Palette */
--neoguard-rose:        #F9A8D4   /* pink-300 — primary accent */
--neoguard-rose-deep:   #EC4899   /* pink-500 — CTAs, active states */
--neoguard-lavender:    #C4B5FD   /* violet-300 — secondary accent */
--neoguard-purple:      #7C3AED   /* violet-600 — headers, bold text */
--neoguard-blush:       #FDF2F8   /* pink-50 — doctor page backgrounds */
--neoguard-soft:        #FAF5FF   /* violet-50 — patient page backgrounds */

/* Status Colors */
--status-safe:          #86EFAC   /* green-300 — low risk */
--status-warn:          #FDE68A   /* amber-200 — moderate risk */
--status-alert:         #FCA5A5   /* red-300 — high risk */

/* Text */
--text-heading:         #3B0764   /* purple-950 — headings */
--text-body:            #6B21A8   /* purple-800 — body text */
--text-muted:           #A78BFA   /* violet-400 — labels, captions */
--text-white:           #FFFFFF
```

### 5.3 Typography Rules
- **Page headings:** `font-extrabold text-3xl text-purple-950 tracking-tight`
- **Section headings:** `font-bold text-xl text-purple-800`
- **Body:** `font-medium text-purple-700`
- **Labels/badges:** `text-xs font-bold uppercase tracking-widest`
- **Key stat numbers:** `font-extrabold text-4xl` — these should feel bold and impactful

### 5.4 Layout Principles
- **No empty spaces.** Every section must feel populated. Use skeleton states, ambient stat cards, illustrated empty states (not blank boxes). Charts with no data show a placeholder with soft illustration + "Add your first scan to see trends".
- **Cards:** `rounded-2xl shadow-sm` with gradient backgrounds or colored left-accent borders.
- **Filled layouts:** Use grid layouts (2-col, 3-col on desktop) that collapse gracefully. Stat rows, chart rows, and list rows are always composed together — no orphaned single-column sections where content could be denser.
- **Side drawer:** Both doctor AND patient portals use a proper side drawer. Collapsible on desktop (240px → 64px icon-only), slides in as overlay on mobile.
- **Responsive:** Mobile-first throughout. Grids collapse, charts reflow, drawer becomes full-height slide-in overlay on mobile.

---

## 6. Database Schema

### 6.1 Naming Convention
All custom tables use the prefix `ng_` (NeoGuard).

```sql
-- ─────────────────────────────────────────
-- PROFILES (extends Supabase auth.users)
-- ─────────────────────────────────────────
ng_profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL CHECK (role IN ('doctor', 'patient')),
  full_name     TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT,
  avatar_seed   TEXT,           -- DiceBear seed for deterministic avatar
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
)

-- ─────────────────────────────────────────
-- DOCTORS
-- ─────────────────────────────────────────
ng_doctors (
  id              uuid PRIMARY KEY REFERENCES ng_profiles(id) ON DELETE CASCADE,
  specialization  TEXT,
  hospital        TEXT,
  department      TEXT,
  license_number  TEXT,
  is_approved     BOOLEAN DEFAULT true,   -- Future: admin sets false until reviewed
  created_at      TIMESTAMPTZ DEFAULT now()
)

-- ─────────────────────────────────────────
-- PATIENTS (pregnant women)
-- ─────────────────────────────────────────
ng_patients (
  id                      uuid PRIMARY KEY REFERENCES ng_profiles(id) ON DELETE CASCADE,
  doctor_id               uuid NOT NULL REFERENCES ng_doctors(id),
  date_of_birth           DATE,
  lmp                     DATE NOT NULL,     -- Last Menstrual Period
  edd                     DATE,              -- LMP + 280 days
  gravida                 INT DEFAULT 1,
  parity                  INT DEFAULT 0,
  blood_type              TEXT,
  height_cm               NUMERIC,
  pre_pregnancy_weight_kg NUMERIC,
  ethnicity               TEXT,
  medical_history         TEXT[],
  risk_factors            TEXT[],
  notes                   TEXT,
  is_active               BOOLEAN DEFAULT true,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
)

-- ─────────────────────────────────────────
-- APPOINTMENTS
-- ─────────────────────────────────────────
ng_appointments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id       uuid NOT NULL REFERENCES ng_patients(id) ON DELETE CASCADE,
  doctor_id        uuid NOT NULL REFERENCES ng_doctors(id),
  scheduled_at     TIMESTAMPTZ NOT NULL,
  status           TEXT DEFAULT 'scheduled'
                   CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  appointment_type TEXT DEFAULT 'antenatal'
                   CHECK (appointment_type IN (
                     'antenatal', 'scan', 'follow_up', 'emergency', 'growth_check'
                   )),
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
)

-- ─────────────────────────────────────────
-- VITALS (doctor-recorded, per appointment)
-- ─────────────────────────────────────────
ng_vitals (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id        uuid NOT NULL REFERENCES ng_patients(id) ON DELETE CASCADE,
  appointment_id    uuid REFERENCES ng_appointments(id),
  recorded_by       uuid NOT NULL REFERENCES ng_profiles(id),
  recorded_at       TIMESTAMPTZ DEFAULT now(),
  systolic_bp       INT,
  diastolic_bp      INT,
  heart_rate        INT,
  temperature_c     NUMERIC,
  weight_kg         NUMERIC,
  bmi               NUMERIC,
  fundal_height_cm  NUMERIC,
  urine_protein     TEXT CHECK (urine_protein IN ('negative', '+', '++', '+++')),
  urine_glucose     TEXT CHECK (urine_glucose IN ('negative', '+', '++', '+++')),
  oedema            TEXT CHECK (oedema IN ('none', 'mild', 'moderate', 'severe')),
  notes             TEXT
)

-- ─────────────────────────────────────────
-- SCANS (text-based features only, no images)
-- ─────────────────────────────────────────
ng_scans (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id            uuid NOT NULL REFERENCES ng_patients(id) ON DELETE CASCADE,
  appointment_id        uuid REFERENCES ng_appointments(id),
  doctor_id             uuid NOT NULL REFERENCES ng_doctors(id),
  scan_date             DATE NOT NULL,
  gestational_age_weeks INT NOT NULL,
  gestational_age_days  INT DEFAULT 0,
  scan_type             TEXT CHECK (scan_type IN (
                          'dating', 'nuchal', 'anomaly', 'growth', 'doppler', 'wellbeing'
                        )),

  -- Ultrasound Biometry
  bpd_mm                NUMERIC,     -- Biparietal Diameter
  hc_mm                 NUMERIC,     -- Head Circumference
  ac_mm                 NUMERIC,     -- Abdominal Circumference ← TOP SHAP FEATURE
  fl_mm                 NUMERIC,     -- Femur Length
  efw_grams             NUMERIC,     -- Estimated Fetal Weight
  efw_percentile        NUMERIC,     -- EFW centile for GA
  nuchal_thickness_mm   NUMERIC,     -- Nuchal Thickness ← SGA signal below 10th centile for GA

  -- Doppler Velocimetry
  ut_pi                 NUMERIC,     -- Uterine PI ← ALE cutoff > 1.0
  ut_ri                 NUMERIC,     -- Uterine RI ← ALE cutoff > 0.58
  ua_pi                 NUMERIC,     -- Umbilical Artery PI
  ua_ri                 NUMERIC,     -- Umbilical Artery RI
  mca_pi                NUMERIC,     -- Middle Cerebral Artery PI
  mca_ri                NUMERIC,     -- MCA RI
  cpr                   NUMERIC,     -- Cerebroplacental Ratio (MCA_PI / UA_PI)

  -- Serum Biomarkers (optional)
  papp_a_mom            NUMERIC,     -- PAPP-A in Multiples of Median
  plgf_mom              NUMERIC,     -- PlGF in MoM
  beta_hcg_mom          NUMERIC,     -- Free Beta-hCG in MoM

  sonographer_notes     TEXT,

  -- ── Gemini AI outputs — stored permanently at scan-save time ──
  sga_risk_score        NUMERIC,
  sga_risk_label        TEXT CHECK (sga_risk_label IN ('low', 'moderate', 'high')),
  shap_values           JSONB,        -- { ac_mm: 0.42, nuchal_thickness_mm: -0.18, ... }
  shap_narrative        TEXT,         -- Gemini SHAP explanation for doctor
  ale_flags             JSONB,        -- { ac_flagged: true, ut_pi_flagged: false, ... }
  ai_clinical_summary   TEXT,         -- Full Gemini clinical paragraph for doctor
  ai_patient_summary    TEXT,         -- Plain-language summary for patient

  created_at            TIMESTAMPTZ DEFAULT now()
)

-- ─────────────────────────────────────────
-- PATIENT SELF-REPORTED VITALS
-- ─────────────────────────────────────────
ng_patient_vitals_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      uuid NOT NULL REFERENCES ng_patients(id) ON DELETE CASCADE,
  logged_at       TIMESTAMPTZ DEFAULT now(),
  systolic_bp     INT,
  diastolic_bp    INT,
  heart_rate      INT,
  weight_kg       NUMERIC,
  fetal_movements INT,
  sleep_hours     NUMERIC,
  mood            TEXT CHECK (mood IN ('great', 'good', 'fair', 'poor')),
  symptoms        TEXT[],
  notes           TEXT
)

-- ─────────────────────────────────────────
-- AI CHAT HISTORY
-- ─────────────────────────────────────────
ng_ai_conversations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id       uuid NOT NULL REFERENCES ng_patients(id) ON DELETE CASCADE,
  initiated_by     uuid NOT NULL REFERENCES ng_profiles(id),
  initiator_role   TEXT CHECK (initiator_role IN ('doctor', 'patient')),
  role             TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content          TEXT NOT NULL,
  context_snapshot JSONB,
  created_at       TIMESTAMPTZ DEFAULT now()
)
```

### 6.2 Row Level Security
- Doctors: read/write only their own patients, scans, appointments, vitals (enforced via `doctor_id` match in RLS policies)
- Patients: read own records only; insert into `ng_patient_vitals_log` and `ng_ai_conversations` for self
- All enforced at DB level — not just application middleware

### 6.3 Computed Values (Application Layer)

| Value | Logic |
|-------|-------|
| EDD | `LMP + 280 days` |
| Gestational Age | `floor((today - LMP) / 7) weeks + ((today - LMP) % 7) days` |
| Trimester | `GA < 14w → T1 | 14–27w → T2 | 28w+ → T3` |
| CPR | `MCA_PI / UA_PI` |
| ALE flags | Each field compared to hardcoded cutoff constants |
| BMI | `weight_kg / (height_m²)` |

---

## 7. ALE Cutoff Constants

```typescript
// lib/constants/ale-cutoffs.ts
export const ALE_CUTOFFS = {
  ac_mm:               { threshold: 253,  direction: 'below' as const, label: 'Abdominal Circumference' },
  nuchal_thickness_mm: { threshold: 10,   direction: 'below' as const, label: 'Nuchal Thickness (10th centile)' },
  // threshold of 10 represents the 10th centile — GA-adjusted centile must be computed from NT reference chart
  ut_ri:               { threshold: 0.58, direction: 'above' as const, label: 'Uterine Resistance Index' },
  ut_pi:               { threshold: 1.0,  direction: 'above' as const, label: 'Uterine Pulsatility Index' },
} as const

export const SHAP_FEATURE_ORDER = [
  'ac_mm', 'nuchal_thickness_mm', 'fl_mm', 'ut_ri', 'ut_pi',
  'bpd_mm', 'ua_pi', 'papp_a_mom'
] as const

export function isFlagged(feature: keyof typeof ALE_CUTOFFS, value: number): boolean {
  const cutoff = ALE_CUTOFFS[feature]
  return cutoff.direction === 'below'
    ? value < cutoff.threshold
    : value > cutoff.threshold
}
```

---

## 8. Gemini AI Architecture

### 8.1 Scan Analysis (server-side, triggered at scan save)

```typescript
// lib/gemini/scan-analysis.ts
// Called from POST /api/patients/[id]/scans
// Returns structured JSON stored permanently in ng_scans
```

**Gemini 2.5 Flash prompt — returns strict JSON:**
```
SYSTEM:
You are a clinical AI for NeoGuard, an SGA (Small-for-Gestational-Age) prediction system based on research by
Dr. Saw Shier Nee (FSKTM, Universiti Malaya), published in Prenatal Diagnosis 2025.

SGA is defined as EFW or birthweight < 10th centile for gestational age.

You simulate SHAP and ALE interpretability outputs using the validated feature
importance order and ALE cutoffs from the paper.

SHAP feature importance order (highest → lowest impact):
AC > Nuchal Thickness > FL > Ut RI > Ut PI > BPD > UA PI > PAPP-A

Best ML models from research:
- Malaysia cohort: Logistic Regression (AC, FL, NT, maternal age, ultrasound-confirmed GA) — AUC 0.75
- Singapore cohort: Support Vector Machine (all variables) — AUC 0.81

ALE Clinical Cutoffs:
- AC < 253mm → SGA risk signal
- Nuchal Thickness < 10th centile for GA → SGA risk signal
- Disjunctive rule: NT < 10th centile OR EFW < 10th centile → improved SGA prediction
- Ut RI > 0.58 → elevated placental resistance
- Ut PI > 1.0 → elevated pulsatility

Return ONLY valid JSON, no markdown, no preamble:
{
  "sga_risk_score": <0.0–1.0>,
  "sga_risk_label": <"low"|"moderate"|"high">,
  "shap_values": { "ac_mm": <-1.0 to 1.0>, "nuchal_thickness_mm": <...>, ... },
  "shap_narrative": "<2–3 sentence SHAP explanation, clinical language>",
  "ale_flags": { "ac_flagged": <bool>, "nt_flagged": <bool>, "ut_ri_flagged": <bool>, "ut_pi_flagged": <bool> },
  "ai_clinical_summary": "<Full clinical paragraph for the doctor, evidence-based>",
  "ai_patient_summary": "<2 sentences, warm, plain language, no jargon, for pregnant patient>"
}
```

### 8.2 Doctor AI Agent

- **Model:** Gemini 2.5 Flash
- **Location:** Server-side Route Handler only (`/api/ai/doctor-chat`)
- **Context injected per request:** Trimmed patient profile, all scans (key fields only — no raw AI summaries), last 4 vitals, upcoming appointments
- **Conversation history:** Last 12 messages from `ng_ai_conversations` via `startChat()` SDK history
- **Patient awareness:** Context block injected as synthetic first turn — model cannot be confused across patients

### 8.3 Patient AI Companion

- **Model:** Gemini 2.5 Flash
- **Location:** Server-side Route Handler only (`/api/ai/patient-chat`)
- **Context:** Patient's own profile, scan summaries (`ai_patient_summary` only), vitals log, GA, EDD
- **Rules in system prompt:** No clinical jargon; risk only as friendly labels; always defer serious concerns to doctor; warm and encouraging tone

### 8.4 Response Format (both agents)
- Short answers: 3–5 sentences or 3–5 bullets max — no walls of text
- `**bold**` for key values and findings; `*italic*` for caveats/context
- Bullet lists for multi-point answers; ends with follow-up question
- UI renders markdown via `react-markdown` with `@tailwindcss/typography` prose classes

---

## 9. Doctor Portal — Feature Specification

### Layout
- Side drawer (240px) — collapsible to 64px icon-only on desktop; full overlay on mobile
- Drawer items with icons: Dashboard | My Patients | Appointments | All Scans | AI Agent | Settings
- Top bar: active patient context pill + doctor avatar + name
- Background: `bg-pink-50`

### 9.1 Auth
- Register: Full name, email, password, hospital, specialization, license number → auto-approved
- Login: Email + password → redirected to `/doctor/dashboard`

### 9.2 Dashboard
Never empty — always has stat cards, a recent activity feed, and an upcoming appointments strip.
- **Stat cards (4-grid):** Total patients | Appointments this week | High-risk count | Scans this month
- **SGA risk donut chart:** Distribution of low / moderate / high across all patients
- **Recent activity feed:** Latest scan entries, vital recordings, new appointments
- **Upcoming appointments (7-day strip):** Timeline of next 7 days

### 9.3 My Patients
- 3-column card grid (desktop) → 1-column (mobile)
- Each card: patient name (bold), GA week badge, EDD countdown, FGR risk pill (color-coded), last scan date, quick-action icons
- Search bar + filter by: risk level, trimester, name
- "+ New Patient" button → modal:
  - Creates Supabase auth user (email + temp password entered by doctor)
  - Creates `ng_profiles` (role: patient) + `ng_patients` (doctor_id = current doctor)
  - Shows temp password in a copy-to-clipboard step after creation

### 9.4 Patient Detail

**Patient Header (sticky within detail view):**
- Name, age, GA ("28 weeks + 4 days" — large bold), EDD countdown, gravida/parity, blood type, risk factors chips
- Mini SGA risk gauge + quick-action buttons: + Appointment | + Scan | + Vitals | Chat AI

**Tabs:**

**Overview**
- Large SGA risk gauge (dial 0–100%)
- SHAP bar chart (last scan — top 6 features, horizontal, positive = risk-increasing in rose, negative = protective in violet)
- ALE flags panel (4 features, each showing actual value vs cutoff, pass ✅ / warn ⚠️)
- Vital snapshot cards (latest BP, weight, HR, fundal height)
- Pregnancy progress bar (GA / 40 weeks with milestone markers)
- Latest Gemini clinical summary card
- Next appointment card

**Appointments**
- Vertical timeline (past + upcoming, newest at top)
- Each: type badge, date/time, status chip, notes, vitals recorded that day (expandable)
- "+ New Appointment" button inline

**Scans**
- Scan cards (date, GA, type, SGA risk badge, key values highlighted: AC, EFW%, NT)
- Expand any scan → full panel: Biometry | Doppler | Biomarkers | Gemini Clinical Summary | SHAP breakdown
- Growth charts (Recharts, all with reference lines):
  - AC (mm) over GA + 253mm ALE cutoff dashed line
  - EFW percentile over GA + 10th centile reference
  - NT (mm) over GA + 10th centile reference band (from NT reference chart)
  - BPD and FL over GA
  - Ut PI over GA + 1.0 cutoff
  - Ut RI over GA + 0.58 cutoff
  - SGA risk score trend (line chart across all scans)

**Vitals**
- BP trend chart (systolic + diastolic, dual line, 140/90 reference)
- Weight gain vs expected (IOM guideline band shaded)
- HR over time
- Fundal height vs expected
- Oedema + urine protein history (table)
- Patient self-log section (read-only, pulled from `ng_patient_vitals_log`)

**AI Insights**
- SHAP beeswarm across all scans (dot plot per feature, Recharts scatter)
- ALE-style line charts per top feature (value effect on risk)
- SGA risk history line chart
- Full Gemini clinical summaries per scan (expandable accordion)

### 9.5 All Scans
- Table view (all doctor's patients' scans)
- Columns: Patient | Date | GA | Scan Type | SGA Risk | AC | NT | Ut PI | Ut RI
- Filter: patient, date, risk label, scan type
- Click row → scan detail side panel

### 9.6 AI Agent Page
- Full-screen chat interface with patient selector (autocomplete)
- Patient selected → banner shows patient context (name, GA, risk)
- Chat bubbles (doctor = right, AI = left)
- Conversation persisted in `ng_ai_conversations`
- "New conversation" button (new session, history still in DB)
- Suggested prompts when empty: "Why is risk increasing?", "Summarise latest scan", "Compare AC trend"

---

## 10. Patient Portal — Feature Specification

### Layout
- **Side drawer** — same collapsible pattern as doctor, but with patient colour theme (violet-50 background, purple accents)
- Nav items: Home | My Vitals | My Scans | My Pregnancy | Chat 💜
- Mobile: drawer becomes slide-in overlay on hamburger tap

### 10.1 Home
- **Hero card:** "You are **28 weeks + 4 days** pregnant 💜" — large, bold, centred
- Baby size card: "Your baby is about the size of a corn cob 🌽"
- EDD countdown chip: "67 days to go 🌸"
- Next appointment card
- Mood check-in: tap emoji (😊 😐 😔 😴)
- Latest AI insight card (1-sentence from `ai_patient_summary` of last scan)
- Quick vitals log button (floating action button, pink)

### 10.2 My Vitals
- Log form: BP, weight, HR, kick count, sleep hours, mood (chip select), symptoms (multi-chip: headache, swelling, nausea, back pain, spotting, other)
- History charts:
  - BP over time (with 140/90 soft red reference line)
  - Weight gain curve vs expected
  - Kick count bar chart
  - Mood history (emoji timeline strip)
- Recent entries list (card per entry, last 10)

### 10.3 My Scans
- Timeline of all scans (doctor-entered, read-only for patient)
- Per scan: GA week, date, friendly EFW growth indicator, `ai_patient_summary` (plain language)
- EFW percentile trend chart (labeled: "Your baby's size over time")
- SGA status label only — no raw scores:
  - ✅ "Growing beautifully"
  - 🔍 "Being closely monitored"
  - 💜 "Please talk to your doctor"
- ALE flags as simple readable labels: "Tummy measurement ✅" | "Uterine blood flow ⚠️"

### 10.4 My Pregnancy
- GA progress bar (large, pink gradient, 0–40 weeks)
- Current week milestone card (what's happening with baby, what mum may feel)
- Trimester sections (T1 / T2 / T3) with milestone markers
- Upcoming milestones (next scan, next appointment)
- Weekly tips (sleep, hydration, nutrition, movement)

### 10.5 Chat with NeoGuard
- Warm chat UI with soft purple AI avatar
- Suggested prompts when empty (chips): "How is my baby growing?", "What did my last scan mean?", "I feel fewer kicks today", "Is my blood pressure okay?"
- Persistent history from `ng_ai_conversations`
- Gemini Flash — friendly, non-intimidating, always defers clinical concerns to doctor

---

## 11. API Route Handlers

All calls are server-side Next.js Route Handlers. Supabase server client validates auth session on every request. `GEMINI_API_KEY` is server-only env var — never exposed to client.

```
POST   /api/auth/register-doctor         Create doctor (auth + ng_profiles + ng_doctors)
POST   /api/auth/create-patient          Doctor creates patient (auth + ng_profiles + ng_patients)

GET    /api/doctor/dashboard             Aggregated stats for dashboard
GET    /api/patients                     Doctor's patient list
POST   /api/patients                     Create patient record
GET    /api/patients/[id]               Full patient detail + all related data
PATCH  /api/patients/[id]              Update patient info

GET    /api/patients/[id]/scans          All scans for patient
POST   /api/patients/[id]/scans          Save scan → call Gemini → store XAI results
GET    /api/patients/[id]/vitals         All vitals (doctor-recorded)
POST   /api/patients/[id]/vitals         Record vitals for appointment
GET    /api/patients/[id]/appointments   All appointments

POST   /api/appointments                 Create appointment
PATCH  /api/appointments/[id]           Update status / notes

GET    /api/scans                        All scans across doctor's patients (filterable)
GET    /api/scans/[id]                   Single scan detail

POST   /api/ai/doctor-chat               Doctor agent (body: { message, patient_id })
POST   /api/ai/patient-chat              Patient companion (body: { message })

GET    /api/patient/home                 Patient home data (GA, EDD, latest scan, next appt)
GET    /api/patient/vitals-log           Patient self-reported vitals history
POST   /api/patient/vitals-log           Patient logs vitals entry
GET    /api/patient/clinic-vitals        Patient reads their own clinic-recorded vitals (ng_vitals)

GET    /api/appointments                 Doctor's all appointments (supports ?status= filter)
```

---

## 12. Seed Script (`supabase/seed.sql`)

Creates fully realistic dummy data:

**2 Doctors:**
- Dr. Aisha Rahman — Obstetrics & Gynaecology, UMMC
- Dr. Raj Krishnan — Maternal-Fetal Medicine, Hospital Kuala Lumpur

**6 Patients (3 per doctor):**
- 2 high-risk SGA: low AC (<253mm), elevated Ut PI (>1.0), elevated Ut RI (>0.58), low NT (<10th centile), low EFW (<10th centile), sga_risk_score 0.68–0.82
- 2 moderate-risk: some borderline values, risk_score 0.38–0.52
- 2 low-risk: all values within range, risk_score 0.12–0.22

**Per patient:**
- 3–5 appointments (mix completed/upcoming)
- 3–5 scans with progressive GA, biometry + Doppler + biomarkers
- Vitals for each completed appointment
- 8–12 patient self-reported vitals log entries
- Pre-written mock Gemini outputs: `shap_values` JSONB, `shap_narrative`, `ale_flags`, `ai_clinical_summary`, `ai_patient_summary`
- 3–5 AI conversation entries (realistic doctor-AI dialogue)

---

## 13. Project Folder Structure

```
neoguard/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (doctor)/
│   │   ├── layout.tsx                  ← Doctor side drawer layout
│   │   ├── dashboard/page.tsx
│   │   ├── patients/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx           ← Tabbed patient detail
│   │   ├── appointments/page.tsx
│   │   ├── scans/page.tsx
│   │   └── ai/page.tsx
│   ├── (patient)/
│   │   ├── layout.tsx                  ← Patient side drawer layout
│   │   ├── home/page.tsx
│   │   ├── vitals/page.tsx
│   │   ├── scans/page.tsx
│   │   ├── pregnancy/page.tsx
│   │   └── chat/page.tsx
│   ├── api/
│   │   ├── auth/
│   │   ├── patients/[id]/
│   │   ├── appointments/
│   │   ├── scans/
│   │   ├── ai/
│   │   └── patient/
│   └── layout.tsx
├── components/
│   ├── layout/
│   │   ├── SideDrawer.tsx
│   │   ├── TopBar.tsx
│   │   └── PatientContextBanner.tsx
│   ├── charts/
│   │   ├── SGARiskGauge.tsx
│   │   ├── SHAPBarChart.tsx
│   │   ├── SHAPBeeswarm.tsx
│   │   ├── ALEPlot.tsx
│   │   ├── VitalsChart.tsx
│   │   ├── BiometryTrendChart.tsx
│   │   ├── DopplerTrendChart.tsx
│   │   ├── EFWPercentileChart.tsx
│   │   └── RiskTrendLine.tsx
│   ├── patients/
│   │   ├── PatientCard.tsx
│   │   ├── PatientHeader.tsx
│   │   ├── NewPatientModal.tsx
│   │   └── PatientDetailTabs.tsx
│   ├── scans/
│   │   ├── ScanCard.tsx
│   │   ├── ScanForm.tsx
│   │   ├── ScanDetailPanel.tsx
│   │   └── ALEFlagsPanel.tsx
│   ├── vitals/
│   │   ├── DoctorVitalsForm.tsx
│   │   ├── VitalsSnapshot.tsx
│   │   └── PatientVitalsLogger.tsx
│   ├── ai/
│   │   ├── DoctorChat.tsx
│   │   ├── PatientChat.tsx
│   │   └── ChatBubble.tsx
│   ├── patient/
│   │   ├── WeekHeroCard.tsx
│   │   ├── BabySizeCard.tsx
│   │   ├── PregnancyTimeline.tsx
│   │   └── MoodCheckIn.tsx
│   └── ui/                             ← shadcn/ui + themed variants
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── gemini/
│   │   ├── scan-analysis.ts
│   │   ├── doctor-agent.ts
│   │   └── patient-agent.ts
│   ├── constants/
│   │   └── ale-cutoffs.ts
│   └── utils/
│       ├── gestational-age.ts
│       ├── baby-size.ts
│       ├── fgr-helpers.ts
│       └── format.ts
├── types/
│   └── database.ts
├── supabase/
│   ├── migrations/
│   │   └── 001_ng_schema.sql
│   └── seed.sql
├── middleware.ts                       ← Supabase auth + role-based redirect
├── netlify.toml
└── .env.local.example
```

---

## 14. Netlify Deployment

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NEXT_PUBLIC_SUPABASE_URL      = ""
  NEXT_PUBLIC_SUPABASE_ANON_KEY = ""
  SUPABASE_SERVICE_ROLE_KEY     = ""
  GEMINI_API_KEY                = ""     # Server-only — never exposed to client
```

---

## 15. Clinical Business Rules

| Rule | Trigger | UI Behaviour |
|------|---------|-------------|
| AC < 253mm | Scan save | ALE flag stored; orange badge on scan card |
| NT < 10th centile for GA | Scan save | ALE flag; NT cell highlighted in scan panel |
| NT < 10th centile OR EFW < 10th centile | Scan save | Disjunctive rule triggers; sga_risk_label = 'high' |
| Ut RI > 0.58 | Scan save | ALE flag; Doppler panel cell in amber |
| Ut PI > 1.0 | Scan save | ALE flag; Doppler panel cell in amber |
| EFW < 10th centile | Scan save | sga_risk_label = 'high' |
| BP ≥ 140/90 | Vital entry | Warning card shown in vitals panel |
| Scan without appointment | Scan form | Appointment selection required (blocked) |
| Patient not owned by doctor | Any mutation | Blocked at RLS + middleware |
| is_approved = false | Doctor login | Middleware blocks access (future v2) |

---

## 16. Out of Scope (v2)

- Admin approval workflow for doctors
- Email / push notifications for high-risk events
- Multi-doctor patient sharing / specialist referral
- DICOM / real ultrasound image viewing
- PDF clinical report export
- Audit log / change history
- Mobile native app

---

*Specification Version 2.0 — Finalized. All decisions confirmed. Ready for development.*
*Research basis: Saw SN et al., Prenatal Diagnosis 2025 | Teng LY et al., Scientific Reports 2022*