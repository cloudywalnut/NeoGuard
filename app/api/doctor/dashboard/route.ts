import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { startOfWeek, endOfWeek } from 'date-fns'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [patientsRes, appointmentsRes, scansRes] = await Promise.all([
      supabase.from('ng_patients').select('id, sga_risk_label:ng_scans(sga_risk_label)', { count: 'exact' }).eq('doctor_id', user.id).eq('is_active', true),
      supabase.from('ng_appointments')
        .select('*')
        .eq('doctor_id', user.id)
        .gte('scheduled_at', startOfWeek(new Date()).toISOString())
        .lte('scheduled_at', endOfWeek(new Date()).toISOString()),
      supabase.from('ng_scans')
        .select('id, sga_risk_label, created_at, patient_id, ng_patients!inner(doctor_id)')
        .eq('ng_patients.doctor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50),
    ])

    const patients = patientsRes.data ?? []
    const totalPatients = patientsRes.count ?? 0
    const weekAppts = appointmentsRes.data ?? []
    const allScans = scansRes.data ?? []

    // Risk distribution from latest scan per patient
    const patientLatestRisk: Record<string, string> = {}
    for (const scan of [...allScans].reverse()) {
      patientLatestRisk[scan.patient_id] = scan.sga_risk_label ?? 'low'
    }
    const riskCounts = { low: 0, moderate: 0, high: 0 }
    for (const r of Object.values(patientLatestRisk)) {
      if (r in riskCounts) riskCounts[r as keyof typeof riskCounts]++
    }

    const recentActivity = allScans.slice(0, 10)
    const upcomingAppts = await supabase
      .from('ng_appointments')
      .select('*, ng_patients!inner(ng_profiles(full_name))')
      .eq('doctor_id', user.id)
      .eq('status', 'scheduled')
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(7)

    return NextResponse.json({
      total_patients: totalPatients,
      appointments_this_week: weekAppts.length,
      high_risk_count: riskCounts.high,
      scans_this_month: allScans.length,
      risk_distribution: riskCounts,
      recent_activity: recentActivity,
      upcoming_appointments: upcomingAppts.data ?? [],
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
