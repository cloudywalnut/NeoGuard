import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('ng_patients')
      .select(`
        *,
        profile:ng_profiles!id(full_name, email, avatar_seed),
        latest_scan:ng_scans(
          id, scan_date, gestational_age_weeks, gestational_age_days,
          sga_risk_score, sga_risk_label, ac_mm, efw_percentile, nuchal_thickness_mm
        )
      `)
      .eq('doctor_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // get only latest scan per patient
    const patients = (data ?? []).map(p => ({
      ...p,
      latest_scan: Array.isArray(p.latest_scan)
        ? p.latest_scan.sort((a: { scan_date: string }, b: { scan_date: string }) => b.scan_date.localeCompare(a.scan_date))[0] ?? null
        : p.latest_scan,
    }))

    return NextResponse.json(patients)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
