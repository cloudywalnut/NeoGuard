-- NeoGuard Database Schema v1.0
-- Run in Supabase SQL Editor

-- ─────────────────────────────────────────
-- PROFILES (extends Supabase auth.users)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ng_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL CHECK (role IN ('doctor', 'patient')),
  full_name     TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT,
  avatar_seed   TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- DOCTORS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ng_doctors (
  id              UUID PRIMARY KEY REFERENCES ng_profiles(id) ON DELETE CASCADE,
  specialization  TEXT,
  hospital        TEXT,
  department      TEXT,
  license_number  TEXT,
  is_approved     BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- PATIENTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ng_patients (
  id                      UUID PRIMARY KEY REFERENCES ng_profiles(id) ON DELETE CASCADE,
  doctor_id               UUID NOT NULL REFERENCES ng_doctors(id),
  date_of_birth           DATE,
  lmp                     DATE NOT NULL,
  edd                     DATE,
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
);

-- ─────────────────────────────────────────
-- APPOINTMENTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ng_appointments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id       UUID NOT NULL REFERENCES ng_patients(id) ON DELETE CASCADE,
  doctor_id        UUID NOT NULL REFERENCES ng_doctors(id),
  scheduled_at     TIMESTAMPTZ NOT NULL,
  status           TEXT DEFAULT 'scheduled'
                   CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  appointment_type TEXT DEFAULT 'antenatal'
                   CHECK (appointment_type IN (
                     'antenatal', 'scan', 'follow_up', 'emergency', 'growth_check'
                   )),
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- VITALS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ng_vitals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id        UUID NOT NULL REFERENCES ng_patients(id) ON DELETE CASCADE,
  appointment_id    UUID REFERENCES ng_appointments(id),
  recorded_by       UUID NOT NULL REFERENCES ng_profiles(id),
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
);

-- ─────────────────────────────────────────
-- SCANS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ng_scans (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id            UUID NOT NULL REFERENCES ng_patients(id) ON DELETE CASCADE,
  appointment_id        UUID REFERENCES ng_appointments(id),
  doctor_id             UUID NOT NULL REFERENCES ng_doctors(id),
  scan_date             DATE NOT NULL,
  gestational_age_weeks INT NOT NULL,
  gestational_age_days  INT DEFAULT 0,
  scan_type             TEXT CHECK (scan_type IN (
                          'dating', 'nuchal', 'anomaly', 'growth', 'doppler', 'wellbeing'
                        )),
  bpd_mm                NUMERIC,
  hc_mm                 NUMERIC,
  ac_mm                 NUMERIC,
  fl_mm                 NUMERIC,
  efw_grams             NUMERIC,
  efw_percentile        NUMERIC,
  nuchal_thickness_mm   NUMERIC,
  ut_pi                 NUMERIC,
  ut_ri                 NUMERIC,
  ua_pi                 NUMERIC,
  ua_ri                 NUMERIC,
  mca_pi                NUMERIC,
  mca_ri                NUMERIC,
  cpr                   NUMERIC,
  papp_a_mom            NUMERIC,
  plgf_mom              NUMERIC,
  beta_hcg_mom          NUMERIC,
  sonographer_notes     TEXT,
  sga_risk_score        NUMERIC,
  sga_risk_label        TEXT CHECK (sga_risk_label IN ('low', 'moderate', 'high')),
  shap_values           JSONB,
  shap_narrative        TEXT,
  ale_flags             JSONB,
  ai_clinical_summary   TEXT,
  ai_patient_summary    TEXT,
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- PATIENT SELF-REPORTED VITALS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ng_patient_vitals_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID NOT NULL REFERENCES ng_patients(id) ON DELETE CASCADE,
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
);

-- ─────────────────────────────────────────
-- AI CHAT HISTORY
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ng_ai_conversations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id       UUID NOT NULL REFERENCES ng_patients(id) ON DELETE CASCADE,
  initiated_by     UUID NOT NULL REFERENCES ng_profiles(id),
  initiator_role   TEXT CHECK (initiator_role IN ('doctor', 'patient')),
  role             TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content          TEXT NOT NULL,
  context_snapshot JSONB,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ng_patients_doctor_id ON ng_patients(doctor_id);
CREATE INDEX IF NOT EXISTS idx_ng_scans_patient_id ON ng_scans(patient_id);
CREATE INDEX IF NOT EXISTS idx_ng_scans_doctor_id ON ng_scans(doctor_id);
CREATE INDEX IF NOT EXISTS idx_ng_vitals_patient_id ON ng_vitals(patient_id);
CREATE INDEX IF NOT EXISTS idx_ng_appointments_patient_id ON ng_appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_ng_appointments_doctor_id ON ng_appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_ng_ai_conversations_patient_id ON ng_ai_conversations(patient_id);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────
ALTER TABLE ng_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ng_doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ng_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ng_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ng_vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ng_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE ng_patient_vitals_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ng_ai_conversations ENABLE ROW LEVEL SECURITY;

-- Profiles: users see their own profile
CREATE POLICY "Users can view own profile" ON ng_profiles
  FOR SELECT USING (auth.uid() = id);

-- Doctors can read profiles of their own patients
CREATE POLICY "Doctors can view patient profiles" ON ng_profiles
  FOR SELECT USING (
    id IN (SELECT id FROM ng_patients WHERE doctor_id = auth.uid())
  );

CREATE POLICY "Users can update own profile" ON ng_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can insert profiles" ON ng_profiles
  FOR INSERT WITH CHECK (true);

-- Doctors: can see and update own doctor record
CREATE POLICY "Doctors can view own record" ON ng_doctors
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Doctors can update own record" ON ng_doctors
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can insert doctors" ON ng_doctors
  FOR INSERT WITH CHECK (true);

-- Patients: doctors see their own patients; patients see their own record
CREATE POLICY "Doctors can manage their patients" ON ng_patients
  FOR ALL USING (doctor_id = auth.uid());

CREATE POLICY "Patients can view own record" ON ng_patients
  FOR SELECT USING (id = auth.uid());

-- Appointments: doctor or patient involved
CREATE POLICY "Doctors see their appointments" ON ng_appointments
  FOR ALL USING (doctor_id = auth.uid());

CREATE POLICY "Patients see their appointments" ON ng_appointments
  FOR SELECT USING (patient_id = auth.uid());

-- Vitals: doctor manages, patient reads
CREATE POLICY "Doctors manage vitals" ON ng_vitals
  FOR ALL USING (
    recorded_by = auth.uid() OR
    patient_id IN (SELECT id FROM ng_patients WHERE doctor_id = auth.uid())
  );

CREATE POLICY "Patients read own vitals" ON ng_vitals
  FOR SELECT USING (patient_id = auth.uid());

-- Scans: doctor manages, patient reads
CREATE POLICY "Doctors manage scans" ON ng_scans
  FOR ALL USING (doctor_id = auth.uid());

CREATE POLICY "Patients read own scans" ON ng_scans
  FOR SELECT USING (patient_id = auth.uid());

-- Patient vitals log: patient manages own
CREATE POLICY "Patients manage own vitals log" ON ng_patient_vitals_log
  FOR ALL USING (patient_id = auth.uid());

CREATE POLICY "Doctors read patient vitals log" ON ng_patient_vitals_log
  FOR SELECT USING (
    patient_id IN (SELECT id FROM ng_patients WHERE doctor_id = auth.uid())
  );

-- AI conversations: doctor or patient involved
CREATE POLICY "Doctors manage AI conversations" ON ng_ai_conversations
  FOR ALL USING (
    initiated_by = auth.uid() OR
    patient_id IN (SELECT id FROM ng_patients WHERE doctor_id = auth.uid())
  );

CREATE POLICY "Patients manage own AI conversations" ON ng_ai_conversations
  FOR ALL USING (patient_id = auth.uid());

-- ─────────────────────────────────────────
-- TRIGGER: auto update updated_at
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON ng_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_patients
  BEFORE UPDATE ON ng_patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
