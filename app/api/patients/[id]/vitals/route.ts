import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('ng_vitals')
      .select('*')
      .eq('patient_id', id)
      .order('recorded_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (e) {
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
    const bmi = body.weight_kg && body.height_cm
      ? +(body.weight_kg / Math.pow(body.height_cm / 100, 2)).toFixed(1)
      : null

    const { data, error } = await supabase.from('ng_vitals').insert({
      patient_id: id,
      recorded_by: user.id,
      appointment_id: body.appointment_id ?? null,
      systolic_bp: body.systolic_bp ?? null,
      diastolic_bp: body.diastolic_bp ?? null,
      heart_rate: body.heart_rate ?? null,
      temperature_c: body.temperature_c ?? null,
      weight_kg: body.weight_kg ?? null,
      bmi,
      fundal_height_cm: body.fundal_height_cm ?? null,
      urine_protein: body.urine_protein ?? null,
      urine_glucose: body.urine_glucose ?? null,
      oedema: body.oedema ?? null,
      notes: body.notes ?? null,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
