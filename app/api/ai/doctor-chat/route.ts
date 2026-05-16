import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { doctorChat } from '@/lib/gemini/doctor-agent'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { message, patient_id } = await req.json()
    if (!message || !patient_id) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    // Load full patient context
    const [patientRes, scansRes, vitalsRes, appointmentsRes] = await Promise.all([
      supabase.from('ng_patients').select('*, ng_profiles!id(full_name, email)').eq('id', patient_id).single(),
      supabase.from('ng_scans').select('*').eq('patient_id', patient_id).order('scan_date', { ascending: true }),
      supabase.from('ng_vitals').select('*').eq('patient_id', patient_id).order('recorded_at', { ascending: false }).limit(10),
      supabase.from('ng_appointments').select('*').eq('patient_id', patient_id).order('scheduled_at', { ascending: false }).limit(5),
    ])

    const patientContext = {
      patient: patientRes.data,
      scans: scansRes.data ?? [],
      vitals: vitalsRes.data ?? [],
      appointments: appointmentsRes.data ?? [],
    }

    // Load conversation history
    const { data: history } = await supabase
      .from('ng_ai_conversations')
      .select('role, content')
      .eq('patient_id', patient_id)
      .eq('initiator_role', 'doctor')
      .order('created_at', { ascending: true })
      .limit(20)

    const aiResponse = await doctorChat(
      message,
      patientContext,
      (history ?? []) as Array<{ role: 'user' | 'assistant'; content: string }>
    )

    // Persist both messages
    await supabase.from('ng_ai_conversations').insert([
      { patient_id, initiated_by: user.id, initiator_role: 'doctor', role: 'user', content: message },
      { patient_id, initiated_by: user.id, initiator_role: 'doctor', role: 'assistant', content: aiResponse },
    ])

    return NextResponse.json({ response: aiResponse })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
