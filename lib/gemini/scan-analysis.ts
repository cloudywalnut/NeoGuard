import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Scan, GeminiScanOutput } from '../../types/database'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

const SYSTEM_PROMPT = `You are a clinical AI for NeoGuard, an SGA (Small-for-Gestational-Age) prediction system based on research by Dr. Saw Shier Nee (FSKTM, Universiti Malaya), published in Prenatal Diagnosis 2025. doi: 10.1002/pd.6748.

SGA is defined as EFW or birthweight < 10th centile for gestational age.

You simulate SHAP and ALE interpretability outputs using validated feature importance from the paper.

SHAP feature importance order (highest to lowest impact):
AC > Nuchal Thickness > FL > Ut RI > Ut PI > BPD > UA PI > PAPP-A

Best ML models from research:
- Malaysia cohort: Logistic Regression (AC, FL, NT, maternal age, ultrasound-confirmed GA) — AUC 0.75
- Singapore cohort: Support Vector Machine (all variables) — AUC 0.81

ALE Clinical Cutoffs:
- AC < 253mm → SGA risk signal
- Nuchal Thickness < 10th centile for GA → SGA risk signal
- Disjunctive rule: NT < 10th centile OR EFW < 10th centile → SGA high risk
- Ut RI > 0.58 → elevated placental resistance
- Ut PI > 1.0 → elevated pulsatility

Study: 5,519 singleton pregnancies from UMMC Malaysia. Validated on Malaysia and Singapore cohorts.
Disjunctive rule improves balanced accuracy by 5.83% Malaysia, 7.75% Singapore.
SGA infants: mean NT 4.57mm vs AGA 4.86mm (p<0.001).

Return ONLY valid JSON — no markdown, no preamble:
{
  "sga_risk_score": <0.0–1.0>,
  "sga_risk_label": <"low"|"moderate"|"high">,
  "shap_values": { "ac_mm": <-1.0 to 1.0>, "nuchal_thickness_mm": <-1.0 to 1.0>, "fl_mm": <-1.0 to 1.0>, "ut_ri": <-1.0 to 1.0>, "ut_pi": <-1.0 to 1.0>, "bpd_mm": <-1.0 to 1.0>, "ua_pi": <-1.0 to 1.0>, "papp_a_mom": <-1.0 to 1.0> },
  "shap_narrative": "<2-3 sentences, clinical language, citing specific values>",
  "ale_flags": { "ac_flagged": <bool>, "nt_flagged": <bool>, "ut_ri_flagged": <bool>, "ut_pi_flagged": <bool> },
  "ai_clinical_summary": "<Full clinical paragraph for the doctor, evidence-based, cite values>",
  "ai_patient_summary": "<2 sentences, warm, plain language, no clinical jargon, for the pregnant patient>"
}`

export async function analyzeScan(scan: Partial<Scan>, gaWeeks: number, maternalAge?: number): Promise<GeminiScanOutput | null> {
  try {
    const scanData = {
      gestational_age_weeks: gaWeeks,
      maternal_age: maternalAge,
      ac_mm: scan.ac_mm,
      fl_mm: scan.fl_mm,
      bpd_mm: scan.bpd_mm,
      hc_mm: scan.hc_mm,
      efw_grams: scan.efw_grams,
      efw_percentile: scan.efw_percentile,
      nuchal_thickness_mm: scan.nuchal_thickness_mm,
      ut_pi: scan.ut_pi,
      ut_ri: scan.ut_ri,
      ua_pi: scan.ua_pi,
      ua_ri: scan.ua_ri,
      mca_pi: scan.mca_pi,
      cpr: scan.cpr,
      papp_a_mom: scan.papp_a_mom,
      plgf_mom: scan.plgf_mom,
    }

    const prompt = `${SYSTEM_PROMPT}

Patient scan data:
${JSON.stringify(scanData, null, 2)}

Analyze and return JSON.`

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned) as GeminiScanOutput
  } catch (err) {
    console.error('Gemini scan analysis error:', err)
    return null
  }
}
