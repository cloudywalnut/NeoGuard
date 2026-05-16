/**
 * NeoGuard Database Setup Script
 * Runs migration SQL and seeds all records with real Supabase auth users.
 *
 * Usage:  npx tsx scripts/setup-db.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://fvozgykmpmchamfhlrgb.supabase.co'
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2b3pneWttcG1jaGFtZmhscmdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODgzNzQzNiwiZXhwIjoyMDk0NDEzNDM2fQ.QEq3ALKeGW2BMIn_FY649u2mxU8Aiz4-R9bYL_yl3vU'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Credentials table (printed at end) ───────────────────────────────────────
interface Credential {
  role: string
  name: string
  email: string
  password: string
  note: string
}
const credentials: Credential[] = []

// ─── Helper: upsert auth user + return UUID ───────────────────────────────────
async function createAuthUser(email: string, password: string, name: string): Promise<string> {
  const { data: existing } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const prev = existing?.users.find(u => u.email === email)

  if (prev) {
    // Update in place — no delete/recreate race condition
    const { data, error } = await supabase.auth.admin.updateUserById(prev.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    })
    if (error || !data.user) throw new Error(`Failed to update ${email}: ${error?.message}`)
    console.log(`  ♻️  Updated auth user: ${email} → ${data.user.id}`)
    return data.user.id
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  })
  if (error || !data.user) throw new Error(`Failed to create ${email}: ${error?.message}`)
  console.log(`  ✅ Created auth user: ${email} → ${data.user.id}`)
  return data.user.id
}

// ─── Seed all data ────────────────────────────────────────────────────────────
async function seed() {
  console.log('\n🌱 Creating auth users and seeding data...\n')

  // ── DOCTORS ──────────────────────────────────────────────────────────────────
  console.log('👩‍⚕️ Creating doctor accounts...')

  const doc1Pass = 'NeoGuard2026!'
  const doc2Pass = 'NeoGuard2026!'

  const doc1Id = await createAuthUser('aisha.rahman@ummc.edu.my', doc1Pass, 'Dr. Aisha Rahman')
  const doc2Id = await createAuthUser('raj.krishnan@hkl.gov.my', doc2Pass, 'Dr. Raj Krishnan')

  credentials.push(
    { role: 'DOCTOR', name: 'Dr. Aisha Rahman',  email: 'aisha.rahman@ummc.edu.my', password: doc1Pass, note: 'O&G, UMMC — 3 patients' },
    { role: 'DOCTOR', name: 'Dr. Raj Krishnan',   email: 'raj.krishnan@hkl.gov.my',  password: doc2Pass, note: 'MFM, HKL — 3 patients' },
  )

  // ── PATIENTS ─────────────────────────────────────────────────────────────────
  console.log('\n🤰 Creating patient accounts...')

  const patPass = 'NeoGuardPat2026!'

  const pat1Id = await createAuthUser('nurul.ain@email.com',    patPass, 'Nurul Ain Binti Hamid')
  const pat2Id = await createAuthUser('siti.rahayu@email.com',  patPass, 'Siti Rahayu Binti Aziz')
  const pat3Id = await createAuthUser('mei.ling@email.com',     patPass, 'Mei Ling Tan')
  const pat4Id = await createAuthUser('priya.k@email.com',      patPass, 'Priya Krishnamurthy')
  const pat5Id = await createAuthUser('fatimah.y@email.com',    patPass, 'Fatimah Binti Yusof')
  const pat6Id = await createAuthUser('sarah.lim@email.com',    patPass, 'Sarah Lim Wei Ling')

  credentials.push(
    { role: 'PATIENT', name: 'Nurul Ain Binti Hamid',  email: 'nurul.ain@email.com',   password: patPass, note: 'HIGH RISK — doc1' },
    { role: 'PATIENT', name: 'Siti Rahayu Binti Aziz', email: 'siti.rahayu@email.com', password: patPass, note: 'HIGH RISK — doc1' },
    { role: 'PATIENT', name: 'Mei Ling Tan',            email: 'mei.ling@email.com',    password: patPass, note: 'Moderate — doc1' },
    { role: 'PATIENT', name: 'Priya Krishnamurthy',     email: 'priya.k@email.com',     password: patPass, note: 'Low risk — doc2' },
    { role: 'PATIENT', name: 'Fatimah Binti Yusof',     email: 'fatimah.y@email.com',   password: patPass, note: 'Moderate — doc2' },
    { role: 'PATIENT', name: 'Sarah Lim Wei Ling',      email: 'sarah.lim@email.com',   password: patPass, note: 'Low risk — doc2' },
  )

  // ── PROFILES ─────────────────────────────────────────────────────────────────
  console.log('\n📋 Inserting profiles...')

  const { error: profErr } = await supabase.from('ng_profiles').upsert([
    { id: doc1Id, role: 'doctor',  full_name: 'Dr. Aisha Rahman',      email: 'aisha.rahman@ummc.edu.my', avatar_seed: 'aisha' },
    { id: doc2Id, role: 'doctor',  full_name: 'Dr. Raj Krishnan',       email: 'raj.krishnan@hkl.gov.my',  avatar_seed: 'raj'   },
    { id: pat1Id, role: 'patient', full_name: 'Nurul Ain Binti Hamid',  email: 'nurul.ain@email.com',       avatar_seed: 'nurul' },
    { id: pat2Id, role: 'patient', full_name: 'Siti Rahayu Binti Aziz', email: 'siti.rahayu@email.com',    avatar_seed: 'siti'  },
    { id: pat3Id, role: 'patient', full_name: 'Mei Ling Tan',           email: 'mei.ling@email.com',        avatar_seed: 'mei'   },
    { id: pat4Id, role: 'patient', full_name: 'Priya Krishnamurthy',    email: 'priya.k@email.com',         avatar_seed: 'priya' },
    { id: pat5Id, role: 'patient', full_name: 'Fatimah Binti Yusof',    email: 'fatimah.y@email.com',       avatar_seed: 'fatimah' },
    { id: pat6Id, role: 'patient', full_name: 'Sarah Lim Wei Ling',     email: 'sarah.lim@email.com',       avatar_seed: 'sarah' },
  ], { onConflict: 'id' })
  if (profErr) throw new Error(`Profiles: ${profErr.message}`)
  console.log('  ✅ Profiles inserted')

  // ── DOCTORS ──────────────────────────────────────────────────────────────────
  const { error: docErr } = await supabase.from('ng_doctors').upsert([
    { id: doc1Id, specialization: 'Obstetrics & Gynaecology', hospital: 'University Malaya Medical Centre', department: 'O&G',  license_number: 'MMC-12345', is_approved: true },
    { id: doc2Id, specialization: 'Maternal-Fetal Medicine',  hospital: 'Hospital Kuala Lumpur',             department: 'MFM', license_number: 'MMC-67890', is_approved: true },
  ], { onConflict: 'id' })
  if (docErr) throw new Error(`Doctors: ${docErr.message}`)
  console.log('  ✅ Doctors inserted')

  // ── PATIENTS ─────────────────────────────────────────────────────────────────
  const { error: patErr } = await supabase.from('ng_patients').upsert([
    { id: pat1Id, doctor_id: doc1Id, lmp: '2025-09-01', edd: '2026-06-09', date_of_birth: '1990-03-15', gravida: 2, parity: 1, blood_type: 'O+',  height_cm: 158, pre_pregnancy_weight_kg: 52, ethnicity: 'Malay',   medical_history: ['Hypertension'],            risk_factors: ['Previous SGA infant','Chronic hypertension'] },
    { id: pat2Id, doctor_id: doc1Id, lmp: '2025-10-15', edd: '2026-07-22', date_of_birth: '1993-07-22', gravida: 1, parity: 0, blood_type: 'A+',  height_cm: 155, pre_pregnancy_weight_kg: 49, ethnicity: 'Malay',   medical_history: [],                          risk_factors: ['Low BMI'] },
    { id: pat3Id, doctor_id: doc1Id, lmp: '2025-11-01', edd: '2026-08-09', date_of_birth: '1988-11-08', gravida: 3, parity: 2, blood_type: 'B+',  height_cm: 162, pre_pregnancy_weight_kg: 58, ethnicity: 'Chinese', medical_history: ['GDM previous pregnancy'],   risk_factors: ['Advanced maternal age'] },
    { id: pat4Id, doctor_id: doc2Id, lmp: '2025-12-01', edd: '2026-09-08', date_of_birth: '1995-05-30', gravida: 1, parity: 0, blood_type: 'AB+', height_cm: 160, pre_pregnancy_weight_kg: 55, ethnicity: 'Indian',  medical_history: [],                          risk_factors: [] },
    { id: pat5Id, doctor_id: doc2Id, lmp: '2025-10-01', edd: '2026-07-09', date_of_birth: '1991-09-14', gravida: 2, parity: 1, blood_type: 'O-',  height_cm: 157, pre_pregnancy_weight_kg: 51, ethnicity: 'Malay',   medical_history: ['Anaemia'],                 risk_factors: ['Smoking history'] },
    { id: pat6Id, doctor_id: doc2Id, lmp: '2025-11-15', edd: '2026-08-23', date_of_birth: '1997-01-25', gravida: 1, parity: 0, blood_type: 'A-',  height_cm: 164, pre_pregnancy_weight_kg: 60, ethnicity: 'Chinese', medical_history: [],                          risk_factors: [] },
  ], { onConflict: 'id' })
  if (patErr) throw new Error(`Patients: ${patErr.message}`)
  console.log('  ✅ Patients inserted')

  // ── APPOINTMENTS ─────────────────────────────────────────────────────────────
  const now = new Date()
  const inDays = (d: number) => new Date(now.getTime() + d * 86400000).toISOString()

  const { data: apptData } = await supabase.from('ng_appointments').insert([
    { patient_id: pat1Id, doctor_id: doc1Id, scheduled_at: '2026-02-10T09:00:00+08:00', status: 'completed', appointment_type: 'growth_check', notes: 'Routine growth scan at 22 weeks' },
    { patient_id: pat1Id, doctor_id: doc1Id, scheduled_at: '2026-03-10T10:00:00+08:00', status: 'completed', appointment_type: 'growth_check', notes: 'Follow-up growth scan, concerns noted' },
    { patient_id: pat1Id, doctor_id: doc1Id, scheduled_at: inDays(7),                   status: 'scheduled', appointment_type: 'follow_up',   notes: 'Risk review and management plan' },
    { patient_id: pat2Id, doctor_id: doc1Id, scheduled_at: inDays(3),                   status: 'scheduled', appointment_type: 'antenatal',   notes: null },
    { patient_id: pat3Id, doctor_id: doc1Id, scheduled_at: inDays(14),                  status: 'scheduled', appointment_type: 'scan',         notes: 'Anomaly scan' },
    { patient_id: pat4Id, doctor_id: doc2Id, scheduled_at: '2026-02-20T09:00:00+08:00', status: 'completed', appointment_type: 'scan',         notes: '20-week anomaly scan' },
    { patient_id: pat4Id, doctor_id: doc2Id, scheduled_at: inDays(10),                  status: 'scheduled', appointment_type: 'antenatal',   notes: null },
    { patient_id: pat5Id, doctor_id: doc2Id, scheduled_at: inDays(5),                   status: 'scheduled', appointment_type: 'growth_check', notes: 'Growth check' },
    { patient_id: pat6Id, doctor_id: doc2Id, scheduled_at: inDays(21),                  status: 'scheduled', appointment_type: 'antenatal',   notes: null },
  ]).select()
  console.log(`  ✅ ${apptData?.length ?? 0} appointments inserted`)

  // grab first two completed appointment IDs for scan linking
  const appt1Id = apptData?.find(a => a.patient_id === pat1Id && a.status === 'completed' && a.notes?.includes('22'))?.id
  const appt2Id = apptData?.find(a => a.patient_id === pat1Id && a.status === 'completed' && a.notes?.includes('Follow'))?.id
  const appt3Id = apptData?.find(a => a.patient_id === pat4Id && a.status === 'completed')?.id

  // ── SCANS ─────────────────────────────────────────────────────────────────────
  const { data: scansData } = await supabase.from('ng_scans').insert([
    // Pat1 — HIGH RISK scan 1 (22w)
    {
      patient_id: pat1Id, doctor_id: doc1Id, appointment_id: appt1Id ?? null,
      scan_date: '2026-02-10', gestational_age_weeks: 22, gestational_age_days: 3,
      scan_type: 'growth', bpd_mm: 52.1, hc_mm: 198.4, ac_mm: 188.2, fl_mm: 38.1,
      efw_grams: 485, efw_percentile: 4.2, nuchal_thickness_mm: 3.9,
      ut_pi: 1.32, ut_ri: 0.67, ua_pi: 0.89, ua_ri: 0.62, mca_pi: 1.45, cpr: 1.63, papp_a_mom: 0.72,
      sga_risk_score: 0.74, sga_risk_label: 'high',
      shap_values: { ac_mm: 0.52, nuchal_thickness_mm: 0.31, ut_pi: 0.28, ut_ri: 0.19, fl_mm: 0.12, bpd_mm: 0.04, ua_pi: 0.02, papp_a_mom: -0.08 },
      shap_narrative: 'The dominant risk contributors are a small AC (188.2mm, well below the 253mm ALE threshold) and low nuchal thickness (3.9mm, below the 10th centile for 22 weeks). Elevated uterine PI (1.32) indicates increased placental resistance, compounding the risk signal.',
      ale_flags: { ac_flagged: true, nt_flagged: true, ut_ri_flagged: true, ut_pi_flagged: true },
      ai_clinical_summary: 'This patient presents with multiple SGA risk signals at 22+3 weeks. AC of 188.2mm is significantly below the 253mm ALE threshold. NT of 3.9mm falls below the 10th centile for gestational age (~4.4mm at 22w), triggering the disjunctive SGA rule. EFW percentile of 4.2 confirms fetal smallness. Ut PI 1.32 and RI 0.67 indicate elevated placental vascular resistance. Recommend increased Doppler monitoring every 2 weeks and consultant review.',
      ai_patient_summary: 'Your scan today shows your baby is growing a little smaller than expected. Your care team is keeping a very close eye on things to make sure you and your baby stay as healthy as possible. 💜',
    },
    // Pat1 — HIGH RISK scan 2 (26w)
    {
      patient_id: pat1Id, doctor_id: doc1Id, appointment_id: appt2Id ?? null,
      scan_date: '2026-03-10', gestational_age_weeks: 26, gestational_age_days: 1,
      scan_type: 'growth', bpd_mm: 60.3, hc_mm: 231.2, ac_mm: 225.8, fl_mm: 44.2,
      efw_grams: 740, efw_percentile: 3.1, nuchal_thickness_mm: 4.1,
      ut_pi: 1.41, ut_ri: 0.71, ua_pi: 0.95, ua_ri: 0.66, mca_pi: 1.38, cpr: 1.45, papp_a_mom: 0.68,
      sga_risk_score: 0.81, sga_risk_label: 'high',
      shap_values: { ac_mm: 0.58, nuchal_thickness_mm: 0.29, ut_pi: 0.33, ut_ri: 0.22, fl_mm: 0.09, bpd_mm: 0.05, ua_pi: 0.04, papp_a_mom: -0.11 },
      shap_narrative: 'AC remains well below threshold at 225.8mm. SGA risk score increased to 0.81. Uterine PI has worsened to 1.41, reflecting progressive placental dysfunction. EFW percentile has dropped to 3.1.',
      ale_flags: { ac_flagged: true, nt_flagged: true, ut_ri_flagged: true, ut_pi_flagged: true },
      ai_clinical_summary: 'Interval growth scan at 26+1 weeks confirms worsening fetal growth. AC 225.8mm remains significantly below expected. EFW of 740g at the 3.1st centile is critically low. Ut PI increased to 1.41 indicating progressive placental insufficiency. UA PI 0.95, approaching abnormal. Recommend admission for monitoring, biophysical profile, antenatal corticosteroids, and delivery planning discussion.',
      ai_patient_summary: 'Your scan today shows your baby needs some extra care and monitoring. The doctors are watching very carefully and are ready to help if needed. Please talk to your doctor about next steps — they are here to support you. 💜',
    },
    // Pat2 — HIGH RISK scan (20w)
    {
      patient_id: pat2Id, doctor_id: doc1Id,
      scan_date: '2026-03-01', gestational_age_weeks: 20, gestational_age_days: 2,
      scan_type: 'anomaly', bpd_mm: 46.8, hc_mm: 176.3, ac_mm: 146.2, fl_mm: 32.8,
      efw_grams: 290, efw_percentile: 3.8, nuchal_thickness_mm: 3.7,
      ut_pi: 1.25, ut_ri: 0.64, ua_pi: 0.82, mca_pi: 1.62, cpr: 1.98, papp_a_mom: 0.61,
      sga_risk_score: 0.69, sga_risk_label: 'high',
      shap_values: { ac_mm: 0.49, nuchal_thickness_mm: 0.27, ut_pi: 0.22, ut_ri: 0.15, fl_mm: 0.10, bpd_mm: 0.03, ua_pi: 0.01, papp_a_mom: -0.06 },
      shap_narrative: 'AC 146.2mm and NT 3.7mm are both flagged. Elevated Ut PI (1.25) and RI (0.64) suggest early placental dysfunction at 20 weeks.',
      ale_flags: { ac_flagged: true, nt_flagged: true, ut_ri_flagged: true, ut_pi_flagged: true },
      ai_clinical_summary: 'At 20+2 weeks, AC 146.2mm and EFW at the 3.8th centile indicate early-onset fetal growth compromise. NT 3.7mm is below the 10th centile. Disjunctive SGA rule is met on both criteria. Ut PI 1.25 suggests placental resistance. Close surveillance with repeat scan in 2 weeks recommended.',
      ai_patient_summary: 'Your scan shows your baby is a little small right now. Your doctor will be monitoring you closely. Please come to all your appointments and contact your team if you notice anything unusual. 💜',
    },
    // Pat3 — MODERATE scan
    {
      patient_id: pat3Id, doctor_id: doc1Id,
      scan_date: '2026-03-20', gestational_age_weeks: 19, gestational_age_days: 5,
      scan_type: 'anomaly', bpd_mm: 46.1, hc_mm: 172.8, ac_mm: 148.6, fl_mm: 33.1,
      efw_grams: 296, efw_percentile: 18.4, nuchal_thickness_mm: 4.3,
      ut_pi: 1.05, ut_ri: 0.60, ua_pi: 0.76, mca_pi: 1.70, cpr: 2.24, papp_a_mom: 0.88,
      sga_risk_score: 0.44, sga_risk_label: 'moderate',
      shap_values: { ac_mm: 0.15, nuchal_thickness_mm: 0.08, ut_pi: 0.22, ut_ri: 0.12, fl_mm: -0.03, bpd_mm: -0.02, ua_pi: -0.01, papp_a_mom: 0.04 },
      shap_narrative: 'Borderline Ut PI (1.05) and Ut RI (0.60) are the primary risk contributors. AC and EFW are within normal limits. NT is above the 10th centile. Overall moderate risk profile.',
      ale_flags: { ac_flagged: false, nt_flagged: false, ut_ri_flagged: true, ut_pi_flagged: true },
      ai_clinical_summary: 'At 19+5 weeks, AC 148.6mm and EFW at 18th centile are within normal range. NT 4.3mm is above the 10th centile — NT criterion not met. Ut PI 1.05 and RI 0.60 are marginally elevated, warranting continued monitoring. Overall moderate SGA risk. Recommend repeat growth scan at 24 weeks.',
      ai_patient_summary: 'Good news — your baby is growing within the normal range! Your team noticed some minor changes in blood flow measurements, so they\'ll check again in a few weeks. This is routine careful monitoring. 💜',
    },
    // Pat4 — LOW RISK scan
    {
      patient_id: pat4Id, doctor_id: doc2Id, appointment_id: appt3Id ?? null,
      scan_date: '2026-02-20', gestational_age_weeks: 20, gestational_age_days: 0,
      scan_type: 'anomaly', bpd_mm: 48.2, hc_mm: 179.3, ac_mm: 155.4, fl_mm: 34.8,
      efw_grams: 330, efw_percentile: 52.4, nuchal_thickness_mm: 4.9,
      ut_pi: 0.82, ut_ri: 0.52, ua_pi: 0.74, mca_pi: 1.68, cpr: 2.27, papp_a_mom: 1.15,
      sga_risk_score: 0.14, sga_risk_label: 'low',
      shap_values: { ac_mm: -0.18, nuchal_thickness_mm: -0.12, ut_pi: -0.08, ut_ri: -0.06, fl_mm: -0.04, bpd_mm: -0.03, ua_pi: -0.02, papp_a_mom: 0.05 },
      shap_narrative: 'All biometric parameters within normal range. AC 155.4mm appropriate for 20 weeks. NT 4.9mm above 10th centile. EFW at 52nd centile. All ALE features within acceptable limits.',
      ale_flags: { ac_flagged: false, nt_flagged: false, ut_ri_flagged: false, ut_pi_flagged: false },
      ai_clinical_summary: 'Anomaly scan at 20+0 weeks demonstrates normal fetal morphology. AC 155.4mm and EFW 330g at 52nd centile are entirely within normal range. NT 4.9mm above 10th centile — disjunctive SGA rule not met. Ut PI 0.82 and RI 0.52 indicate normal uteroplacental flow. Routine antenatal care continues.',
      ai_patient_summary: 'Great news — your baby is growing beautifully and everything looks just right for this stage of pregnancy! Keep up the wonderful work. 💜',
    },
    // Pat5 — MODERATE scan
    {
      patient_id: pat5Id, doctor_id: doc2Id,
      scan_date: '2026-03-05', gestational_age_weeks: 22, gestational_age_days: 0,
      scan_type: 'growth', bpd_mm: 53.4, hc_mm: 201.6, ac_mm: 175.3, fl_mm: 39.8,
      efw_grams: 510, efw_percentile: 11.2, nuchal_thickness_mm: 4.2,
      ut_pi: 1.08, ut_ri: 0.61, ua_pi: 0.81, mca_pi: 1.55, cpr: 1.91, papp_a_mom: 0.79,
      sga_risk_score: 0.42, sga_risk_label: 'moderate',
      shap_values: { ac_mm: 0.28, nuchal_thickness_mm: 0.14, ut_pi: 0.19, ut_ri: 0.11, fl_mm: 0.03, bpd_mm: 0.01, ua_pi: -0.01, papp_a_mom: -0.04 },
      shap_narrative: 'AC 175.3mm is below but not critically low. EFW at 11th centile is near the SGA threshold. NT 4.2mm is borderline. Marginally elevated Ut PI adds to moderate risk profile.',
      ale_flags: { ac_flagged: true, nt_flagged: true, ut_ri_flagged: true, ut_pi_flagged: true },
      ai_clinical_summary: 'Growth scan at 22+0 weeks shows EFW at 11th centile, just above the SGA threshold of <10th centile. AC 175.3mm is below the 253mm reference but appropriate for early 22 weeks. NT borderline. Ut PI 1.08 slightly elevated. Overall moderate risk — recommend repeat scan in 3 weeks.',
      ai_patient_summary: 'Your baby is growing — they\'re a little on the smaller side, but your doctor is keeping a close eye on everything. Your next scan will give us more information. 💜',
    },
    // Pat6 — LOW RISK scan
    {
      patient_id: pat6Id, doctor_id: doc2Id,
      scan_date: '2026-03-15', gestational_age_weeks: 17, gestational_age_days: 3,
      scan_type: 'growth', bpd_mm: 40.8, hc_mm: 152.4, ac_mm: 128.7, fl_mm: 28.6,
      efw_grams: 195, efw_percentile: 45.8, nuchal_thickness_mm: 4.6,
      ut_pi: 0.91, ut_ri: 0.55, ua_pi: 0.79, mca_pi: 1.72, cpr: 2.18, papp_a_mom: 1.08,
      sga_risk_score: 0.12, sga_risk_label: 'low',
      shap_values: { ac_mm: -0.14, nuchal_thickness_mm: -0.09, ut_pi: -0.05, ut_ri: -0.04, fl_mm: -0.03, bpd_mm: -0.02, ua_pi: -0.01, papp_a_mom: 0.03 },
      shap_narrative: 'All measurements are reassuringly normal. EFW at 46th centile. NT above 10th centile. Doppler indices normal. Very low SGA risk.',
      ale_flags: { ac_flagged: false, nt_flagged: false, ut_ri_flagged: false, ut_pi_flagged: false },
      ai_clinical_summary: 'Growth scan at 17+3 weeks is entirely normal. EFW 195g at 46th centile. NT 4.6mm above 10th centile. All Doppler indices within normal limits. SGA risk is very low. Standard care continues.',
      ai_patient_summary: 'Everything looks wonderful! Your baby is growing right on track and all the measurements are normal. Keep doing what you\'re doing! 💜',
    },
  ]).select()
  console.log(`  ✅ ${scansData?.length ?? 0} scans inserted with AI outputs pre-loaded`)

  // ── VITALS ────────────────────────────────────────────────────────────────────
  await supabase.from('ng_vitals').insert([
    { patient_id: pat1Id, recorded_by: doc1Id, recorded_at: '2026-02-10T09:30:00+08:00', systolic_bp: 138, diastolic_bp: 88,  heart_rate: 86, weight_kg: 61.2, fundal_height_cm: 22, oedema: 'mild',   urine_protein: '+' },
    { patient_id: pat1Id, recorded_by: doc1Id, recorded_at: '2026-03-10T10:30:00+08:00', systolic_bp: 145, diastolic_bp: 92,  heart_rate: 90, weight_kg: 63.4, fundal_height_cm: 25, oedema: 'mild',   urine_protein: '++' },
    { patient_id: pat4Id, recorded_by: doc2Id, recorded_at: '2026-02-20T09:30:00+08:00', systolic_bp: 112, diastolic_bp: 72,  heart_rate: 74, weight_kg: 62.1, fundal_height_cm: 20, oedema: 'none',   urine_protein: 'negative' },
    { patient_id: pat5Id, recorded_by: doc2Id, recorded_at: '2026-03-05T10:00:00+08:00', systolic_bp: 120, diastolic_bp: 78,  heart_rate: 78, weight_kg: 58.8, fundal_height_cm: 22, oedema: 'none',   urine_protein: 'negative' },
  ])
  console.log('  ✅ Doctor vitals inserted')

  // ── PATIENT SELF-LOG ──────────────────────────────────────────────────────────
  const yesterday = (d: number) => new Date(now.getTime() - d * 86400000).toISOString()
  await supabase.from('ng_patient_vitals_log').insert([
    { patient_id: pat1Id, logged_at: yesterday(1), systolic_bp: 140, diastolic_bp: 90, heart_rate: 88, weight_kg: 63.8, fetal_movements: 8,  sleep_hours: 6.5, mood: 'fair', symptoms: ['headache','swelling'] },
    { patient_id: pat1Id, logged_at: yesterday(3), systolic_bp: 138, diastolic_bp: 87, heart_rate: 85, weight_kg: 63.2, fetal_movements: 10, sleep_hours: 7.0, mood: 'fair', symptoms: ['swelling'] },
    { patient_id: pat4Id, logged_at: yesterday(1), systolic_bp: 110, diastolic_bp: 70, heart_rate: 72, weight_kg: 62.5, fetal_movements: 15, sleep_hours: 8.0, mood: 'great', symptoms: [] },
    { patient_id: pat4Id, logged_at: yesterday(4), systolic_bp: 112, diastolic_bp: 72, heart_rate: 74, weight_kg: 62.1, fetal_movements: 12, sleep_hours: 7.5, mood: 'good', symptoms: ['nausea'] },
  ])
  console.log('  ✅ Patient self-log entries inserted')

  // ── AI CONVERSATIONS ──────────────────────────────────────────────────────────
  await supabase.from('ng_ai_conversations').insert([
    { patient_id: pat1Id, initiated_by: doc1Id, initiator_role: 'doctor', role: 'user',      content: 'Summarise the latest scan findings for Nurul Ain and explain the risk trajectory.' },
    { patient_id: pat1Id, initiated_by: doc1Id, initiator_role: 'doctor', role: 'assistant', content: 'At 26+1 weeks, Nurul Ain shows a worsening trajectory. SGA risk score increased from 0.74 to 0.81. Top SHAP contributors are AC (0.58) and Ut PI (0.33), both indicating progressive placental dysfunction. EFW percentile dropped from 4.2 to 3.1, and the disjunctive SGA rule is met on both NT and EFW criteria. Recommend escalating monitoring and consulting MFM for delivery planning.' },
    { patient_id: pat1Id, initiated_by: doc1Id, initiator_role: 'doctor', role: 'user',      content: 'What growth chart should I use given her Malay ethnicity?' },
    { patient_id: pat1Id, initiated_by: doc1Id, initiator_role: 'doctor', role: 'assistant', content: 'For Malaysian patients, the Ministry of Health Malaysia charts or INTERGROWTH-21st standards are preferred. The NeoGuard research was conducted at UMMC on a Malaysian cohort of 5,519 pregnancies, so SGA predictions are calibrated for this population. The 10th centile thresholds in the disjunctive rule are derived from this cohort.' },
    { patient_id: pat1Id, initiated_by: pat1Id, initiator_role: 'patient', role: 'user',     content: 'What did my scan mean? Am I okay?' },
    { patient_id: pat1Id, initiated_by: pat1Id, initiator_role: 'patient', role: 'assistant',content: 'Your doctor has shared your scan results with me. Your baby is being carefully monitored right now because they are growing a little smaller than usual for this stage. This is something your medical team is taking seriously and watching very closely. Please make sure to attend all your appointments, and don\'t hesitate to call your doctor if anything feels different. You are in good hands. 💜' },
  ])
  console.log('  ✅ AI conversation samples inserted')
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  NeoGuard Database Setup')
  console.log('═══════════════════════════════════════════════════════')

  await seed()

  // ─── Print credentials table ─────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════')
  console.log('  ✅ SETUP COMPLETE — LOGIN CREDENTIALS')
  console.log('═══════════════════════════════════════════════════════')
  console.log('\nAll accounts are in Supabase Auth and can be used to sign in immediately.\n')

  console.log('DOCTORS (go to /login → redirects to /dashboard)')
  console.log('─'.repeat(70))
  for (const c of credentials.filter(c => c.role === 'DOCTOR')) {
    console.log(`  Name:     ${c.name}`)
    console.log(`  Email:    ${c.email}`)
    console.log(`  Password: ${c.password}`)
    console.log(`  Note:     ${c.note}`)
    console.log()
  }

  console.log('PATIENTS (go to /login → redirects to /home)')
  console.log('─'.repeat(70))
  for (const c of credentials.filter(c => c.role === 'PATIENT')) {
    console.log(`  Name:     ${c.name}`)
    console.log(`  Email:    ${c.email}`)
    console.log(`  Password: ${c.password}`)
    console.log(`  Note:     ${c.note}`)
    console.log()
  }

  console.log('═══════════════════════════════════════════════════════\n')
}

main().catch(err => {
  console.error('\n❌ Setup failed:', err.message)
  process.exit(1)
})
