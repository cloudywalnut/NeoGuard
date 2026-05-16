import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateGestationalAge, daysUntilEDD } from '@/lib/utils/gestational-age'
import { getBabySize } from '@/lib/utils/baby-size'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [patientRes, latestScanRes, nextApptRes] = await Promise.all([
      supabase.from('ng_patients').select('*, ng_profiles!id(full_name)').eq('id', user.id).single(),
      supabase.from('ng_scans').select('ai_patient_summary, sga_risk_label, scan_date, gestational_age_weeks').eq('patient_id', user.id).order('scan_date', { ascending: false }).limit(1).single(),
      supabase.from('ng_appointments').select('*').eq('patient_id', user.id).eq('status', 'scheduled').gte('scheduled_at', new Date().toISOString()).order('scheduled_at', { ascending: true }).limit(1).single(),
    ])

    const patient = patientRes.data
    if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 })

    const ga = calculateGestationalAge(patient.lmp)
    const edd_countdown = patient.edd ? daysUntilEDD(patient.edd) : null
    const baby_size = getBabySize(ga.weeks)

    return NextResponse.json({
      patient,
      ga_weeks: ga.weeks,
      ga_days: ga.days,
      edd_countdown,
      baby_size,
      latest_scan: latestScanRes.data,
      next_appointment: nextApptRes.data,
    })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
