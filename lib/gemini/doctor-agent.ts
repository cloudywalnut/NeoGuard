import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const SYSTEM_INSTRUCTION = `You are a clinical AI assistant for NeoGuard, an SGA prediction platform for obstetricians.

Research foundation: Dr. Saw Shier Nee, FSKTM, Universiti Malaya — Prenatal Diagnosis 2025.

Clinical facts:
- SGA = EFW or birthweight < 10th centile for GA
- ALE cutoffs: AC < 253mm, NT < 10th centile, Ut RI > 0.58, Ut PI > 1.0
- SHAP order: AC > NT > FL > Ut RI > Ut PI > BPD > UA PI > PAPP-A
- Disjunctive rule: NT < 10th centile OR EFW < 10th centile → elevated SGA risk

**Response rules — strictly follow these:**
- Keep answers to 3–5 sentences max, or use a short bullet list (3–5 bullets)
- Use **bold** for key values and findings (e.g. **AC: 241mm**, **high risk**)
- Use *italic* for clinical context or caveats
- Use bullet lists when comparing multiple findings or listing action points
- Never write long paragraphs — break into bullets if more than 2 points
- End with one follow-up question or suggested next action to keep the conversation going
- Clinical decision support only — never diagnoses`

function trimContext(ctx: Record<string, unknown>) {
  const patient = ctx.patient as Record<string, unknown> | null
  const scans = (ctx.scans as Record<string, unknown>[]) ?? []
  const vitals = (ctx.vitals as Record<string, unknown>[]) ?? []
  const appointments = (ctx.appointments as Record<string, unknown>[]) ?? []

  return {
    patient: {
      name: (patient?.ng_profiles as Record<string, unknown> | null)?.full_name,
      lmp: patient?.lmp,
      edd: patient?.edd,
      gravida: patient?.gravida,
      parity: patient?.parity,
      blood_type: patient?.blood_type,
      height_cm: patient?.height_cm,
      ethnicity: patient?.ethnicity,
      medical_history: patient?.medical_history,
      risk_factors: patient?.risk_factors,
    },
    scans: scans.map(s => ({
      date: s.scan_date,
      ga_weeks: s.gestational_age_weeks,
      scan_type: s.scan_type,
      ac_mm: s.ac_mm,
      fl_mm: s.fl_mm,
      bpd_mm: s.bpd_mm,
      efw_grams: s.efw_grams,
      efw_percentile: s.efw_percentile,
      nuchal_thickness_mm: s.nuchal_thickness_mm,
      ut_pi: s.ut_pi,
      ut_ri: s.ut_ri,
      ua_pi: s.ua_pi,
      cpr: s.cpr,
      papp_a_mom: s.papp_a_mom,
      sga_risk_score: s.sga_risk_score,
      sga_risk_label: s.sga_risk_label,
      ale_flags: s.ale_flags,
      shap_values: s.shap_values,
    })),
    latest_clinical_summary: scans.at(-1)?.ai_clinical_summary ?? null,
    vitals: vitals.slice(0, 4).map(v => ({
      date: v.recorded_at,
      bp: v.systolic_bp ? `${v.systolic_bp}/${v.diastolic_bp}` : null,
      hr: v.heart_rate,
      weight_kg: v.weight_kg,
      fundal_height_cm: v.fundal_height_cm,
      urine_protein: v.urine_protein,
      oedema: v.oedema,
    })),
    upcoming_appointments: appointments.slice(0, 3).map(a => ({
      date: a.scheduled_at,
      type: a.appointment_type,
      status: a.status,
    })),
  }
}

export async function doctorChat(
  message: string,
  patientContext: Record<string, unknown>,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
    })

    const trimmed = trimContext(patientContext)
    const contextBlock = `PATIENT CONTEXT (use throughout this conversation):\n${JSON.stringify(trimmed, null, 2)}`

    // Build SDK history: synthetic context exchange first, then real conversation
    const realHistory = history.slice(-12).map(h => ({
      role: h.role === 'user' ? ('user' as const) : ('model' as const),
      parts: [{ text: h.content }],
    }))

    const sdkHistory = [
      { role: 'user' as const, parts: [{ text: contextBlock }] },
      { role: 'model' as const, parts: [{ text: 'Patient context received. Ready to assist with clinical questions.' }] },
      ...realHistory,
    ]

    const chat = model.startChat({ history: sdkHistory })
    const result = await chat.sendMessage(message)
    return result.response.text().trim()
  } catch (err) {
    console.error('Doctor agent error:', err)
    return 'I encountered an error processing your request. Please try again.'
  }
}
