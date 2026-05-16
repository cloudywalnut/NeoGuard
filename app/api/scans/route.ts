import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(req.url)
    const riskLabel = url.searchParams.get('risk')
    const patientId = url.searchParams.get('patient_id')

    let query = supabase
      .from('ng_scans')
      .select(`
        *,
        patient:ng_patients!patient_id(
          ng_profiles!id(full_name)
        )
      `)
      .eq('doctor_id', user.id)
      .order('scan_date', { ascending: false })

    if (riskLabel) query = query.eq('sga_risk_label', riskLabel)
    if (patientId) query = query.eq('patient_id', patientId)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
