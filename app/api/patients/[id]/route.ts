import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: patient, error } = await supabase
      .from('ng_patients')
      .select(`*, profile:ng_profiles!id(full_name, email, phone, avatar_seed)`)
      .eq('id', id)
      .single()

    if (error || !patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    if (patient.doctor_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const [scansRes, vitalsRes, appointmentsRes, aiRes, patientVitalsRes] = await Promise.all([
      supabase.from('ng_scans').select('*').eq('patient_id', id).order('scan_date', { ascending: true }),
      supabase.from('ng_vitals').select('*').eq('patient_id', id).order('recorded_at', { ascending: false }),
      supabase.from('ng_appointments').select('*').eq('patient_id', id).order('scheduled_at', { ascending: false }),
      supabase.from('ng_ai_conversations').select('*').eq('patient_id', id).order('created_at', { ascending: true }).limit(50),
      supabase.from('ng_patient_vitals_log').select('*').eq('patient_id', id).order('logged_at', { ascending: false }).limit(20),
    ])

    return NextResponse.json({
      patient,
      scans: scansRes.data ?? [],
      vitals: vitalsRes.data ?? [],
      appointments: appointmentsRes.data ?? [],
      ai_conversations: aiRes.data ?? [],
      patient_vitals_log: patientVitalsRes.data ?? [],
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { data, error } = await supabase
      .from('ng_patients')
      .update(body)
      .eq('id', id)
      .eq('doctor_id', user.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
