import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url          = new URL(req.url)
    const statusFilter = url.searchParams.get('status')

    let query = supabase
      .from('ng_appointments')
      .select('*, patient:ng_patients!patient_id(profile:ng_profiles!id(full_name))')
      .eq('doctor_id', user.id)
      .order('scheduled_at', { ascending: false })

    if (statusFilter) query = query.eq('status', statusFilter)

    const { data, error } = await query
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
    const { data, error } = await supabase.from('ng_appointments').insert({
      patient_id: body.patient_id,
      doctor_id: user.id,
      scheduled_at: body.scheduled_at,
      status: body.status ?? 'scheduled',
      appointment_type: body.appointment_type ?? 'antenatal',
      notes: body.notes ?? null,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
