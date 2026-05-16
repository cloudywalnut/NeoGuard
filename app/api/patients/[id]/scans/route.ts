import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeScan } from '@/lib/gemini/scan-analysis'
import { differenceInYears, parseISO } from 'date-fns'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('ng_scans')
      .select('*')
      .eq('patient_id', id)
      .order('scan_date', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()

    // Verify doctor owns this patient
    const { data: patient } = await supabase
      .from('ng_patients')
      .select('doctor_id, date_of_birth')
      .eq('id', id)
      .single()

    if (!patient || patient.doctor_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const maternalAge = patient.date_of_birth
      ? differenceInYears(new Date(), parseISO(patient.date_of_birth))
      : undefined

    // Call Gemini for AI analysis
    const aiOutput = await analyzeScan(body, body.gestational_age_weeks, maternalAge)

    const scanRecord = {
      patient_id: id,
      doctor_id: user.id,
      appointment_id: body.appointment_id ?? null,
      scan_date: body.scan_date,
      gestational_age_weeks: body.gestational_age_weeks,
      gestational_age_days: body.gestational_age_days ?? 0,
      scan_type: body.scan_type ?? null,
      bpd_mm: body.bpd_mm ?? null,
      hc_mm: body.hc_mm ?? null,
      ac_mm: body.ac_mm ?? null,
      fl_mm: body.fl_mm ?? null,
      efw_grams: body.efw_grams ?? null,
      efw_percentile: body.efw_percentile ?? null,
      nuchal_thickness_mm: body.nuchal_thickness_mm ?? null,
      ut_pi: body.ut_pi ?? null,
      ut_ri: body.ut_ri ?? null,
      ua_pi: body.ua_pi ?? null,
      ua_ri: body.ua_ri ?? null,
      mca_pi: body.mca_pi ?? null,
      mca_ri: body.mca_ri ?? null,
      cpr: body.cpr ?? null,
      papp_a_mom: body.papp_a_mom ?? null,
      plgf_mom: body.plgf_mom ?? null,
      beta_hcg_mom: body.beta_hcg_mom ?? null,
      sonographer_notes: body.sonographer_notes ?? null,
      // AI outputs
      sga_risk_score: aiOutput?.sga_risk_score ?? null,
      sga_risk_label: aiOutput?.sga_risk_label ?? null,
      shap_values: aiOutput?.shap_values ?? null,
      shap_narrative: aiOutput?.shap_narrative ?? null,
      ale_flags: aiOutput?.ale_flags ?? null,
      ai_clinical_summary: aiOutput?.ai_clinical_summary ?? null,
      ai_patient_summary: aiOutput?.ai_patient_summary ?? null,
    }

    const { data, error } = await supabase.from('ng_scans').insert(scanRecord).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
