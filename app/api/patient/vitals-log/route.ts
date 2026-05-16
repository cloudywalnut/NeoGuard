import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('ng_patient_vitals_log')
      .select('*')
      .eq('patient_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(30)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { data, error } = await supabase.from('ng_patient_vitals_log').insert({
      patient_id: user.id,
      systolic_bp: body.systolic_bp ?? null,
      diastolic_bp: body.diastolic_bp ?? null,
      heart_rate: body.heart_rate ?? null,
      weight_kg: body.weight_kg ?? null,
      fetal_movements: body.fetal_movements ?? null,
      sleep_hours: body.sleep_hours ?? null,
      mood: body.mood ?? null,
      symptoms: body.symptoms ?? null,
      notes: body.notes ?? null,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
