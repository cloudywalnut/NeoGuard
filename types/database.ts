export type Role = 'doctor' | 'patient'
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled'
export type AppointmentType = 'antenatal' | 'scan' | 'follow_up' | 'emergency' | 'growth_check'
export type ScanType = 'dating' | 'nuchal' | 'anomaly' | 'growth' | 'doppler' | 'wellbeing'
export type RiskLabel = 'low' | 'moderate' | 'high'
export type UrineLevel = 'negative' | '+' | '++' | '+++'
export type OedemaLevel = 'none' | 'mild' | 'moderate' | 'severe'
export type Mood = 'great' | 'good' | 'fair' | 'poor'

export interface Profile {
  id: string
  role: Role
  full_name: string
  email: string
  phone: string | null
  avatar_seed: string | null
  created_at: string
  updated_at: string
}

export interface Doctor {
  id: string
  specialization: string | null
  hospital: string | null
  department: string | null
  license_number: string | null
  is_approved: boolean
  created_at: string
}

export interface DoctorWithProfile extends Doctor {
  profile: Profile
}

export interface Patient {
  id: string
  doctor_id: string
  date_of_birth: string | null
  lmp: string
  edd: string | null
  gravida: number
  parity: number
  blood_type: string | null
  height_cm: number | null
  pre_pregnancy_weight_kg: number | null
  ethnicity: string | null
  medical_history: string[] | null
  risk_factors: string[] | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PatientWithProfile extends Patient {
  profile: Profile
}

export interface Appointment {
  id: string
  patient_id: string
  doctor_id: string
  scheduled_at: string
  status: AppointmentStatus
  appointment_type: AppointmentType
  notes: string | null
  created_at: string
}

export interface Vital {
  id: string
  patient_id: string
  appointment_id: string | null
  recorded_by: string
  recorded_at: string
  systolic_bp: number | null
  diastolic_bp: number | null
  heart_rate: number | null
  temperature_c: number | null
  weight_kg: number | null
  bmi: number | null
  fundal_height_cm: number | null
  urine_protein: UrineLevel | null
  urine_glucose: UrineLevel | null
  oedema: OedemaLevel | null
  notes: string | null
}

export interface Scan {
  id: string
  patient_id: string
  appointment_id: string | null
  doctor_id: string
  scan_date: string
  gestational_age_weeks: number
  gestational_age_days: number
  scan_type: ScanType | null
  bpd_mm: number | null
  hc_mm: number | null
  ac_mm: number | null
  fl_mm: number | null
  efw_grams: number | null
  efw_percentile: number | null
  nuchal_thickness_mm: number | null
  ut_pi: number | null
  ut_ri: number | null
  ua_pi: number | null
  ua_ri: number | null
  mca_pi: number | null
  mca_ri: number | null
  cpr: number | null
  papp_a_mom: number | null
  plgf_mom: number | null
  beta_hcg_mom: number | null
  sonographer_notes: string | null
  sga_risk_score: number | null
  sga_risk_label: RiskLabel | null
  shap_values: Record<string, number> | null
  shap_narrative: string | null
  ale_flags: Record<string, boolean> | null
  ai_clinical_summary: string | null
  ai_patient_summary: string | null
  created_at: string
}

export interface PatientVitalsLog {
  id: string
  patient_id: string
  logged_at: string
  systolic_bp: number | null
  diastolic_bp: number | null
  heart_rate: number | null
  weight_kg: number | null
  fetal_movements: number | null
  sleep_hours: number | null
  mood: Mood | null
  symptoms: string[] | null
  notes: string | null
}

export interface AIConversation {
  id: string
  patient_id: string
  initiated_by: string
  initiator_role: Role
  role: 'user' | 'assistant'
  content: string
  context_snapshot: Record<string, unknown> | null
  created_at: string
}

export interface GeminiScanOutput {
  sga_risk_score: number
  sga_risk_label: RiskLabel
  shap_values: Record<string, number>
  shap_narrative: string
  ale_flags: {
    ac_flagged: boolean
    nt_flagged: boolean
    ut_ri_flagged: boolean
    ut_pi_flagged: boolean
  }
  ai_clinical_summary: string
  ai_patient_summary: string
}
