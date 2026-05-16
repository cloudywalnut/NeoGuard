import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { patientChat } from '@/lib/gemini/patient-agent'
import { calculateGestationalAge, daysUntilEDD } from '@/lib/utils/gestational-age'
import { getBabySize } from '@/lib/utils/baby-size'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { message } = await req.json()
    if (!message) return NextResponse.json({ error: 'Missing message' }, { status: 400 })

    const { data: patient } = await supabase
      .from('ng_patients')
      .select('lmp, edd')
      .eq('id', user.id)
      .single()

    const ga = patient?.lmp ? calculateGestationalAge(patient.lmp) : { weeks: 0, days: 0 }
    const eddCountdown = patient?.edd ? daysUntilEDD(patient.edd) : null
    const babySize = getBabySize(ga.weeks)

    const { data: latestScan } = await supabase
      .from('ng_scans')
      .select('ai_patient_summary')
      .eq('patient_id', user.id)
      .order('scan_date', { ascending: false })
      .limit(1)
      .single()

    const { data: history } = await supabase
      .from('ng_ai_conversations')
      .select('role, content')
      .eq('patient_id', user.id)
      .eq('initiator_role', 'patient')
      .order('created_at', { ascending: true })
      .limit(10)

    const patientContext = {
      ga_weeks: ga.weeks,
      ga_days: ga.days,
      edd_countdown: eddCountdown,
      baby_size: `${babySize.name} ${babySize.emoji}`,
      latest_patient_summary: latestScan?.ai_patient_summary ?? null,
    }

    const aiResponse = await patientChat(
      message,
      patientContext,
      (history ?? []) as Array<{ role: 'user' | 'assistant'; content: string }>
    )

    await supabase.from('ng_ai_conversations').insert([
      { patient_id: user.id, initiated_by: user.id, initiator_role: 'patient', role: 'user', content: message },
      { patient_id: user.id, initiated_by: user.id, initiator_role: 'patient', role: 'assistant', content: aiResponse },
    ])

    return NextResponse.json({ response: aiResponse })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
