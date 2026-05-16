import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { calculateEDD } from '@/lib/utils/gestational-age'
import { addDays, format } from 'date-fns'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: doctor } = await supabase.from('ng_doctors').select('id').eq('id', user.id).single()
    if (!doctor) return NextResponse.json({ error: 'Not a doctor' }, { status: 403 })

    const body = await req.json()
    const { email, temp_password, full_name, lmp, date_of_birth, gravida, parity, blood_type, height_cm, pre_pregnancy_weight_kg, ethnicity } = body

    if (!email || !temp_password || !full_name || !lmp) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const serviceClient = await createServiceClient()

    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email,
      password: temp_password,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message ?? 'Failed to create patient account' }, { status: 400 })
    }

    const patientId = authData.user.id
    const edd = calculateEDD(lmp)

    const { error: profileError } = await serviceClient.from('ng_profiles').insert({
      id: patientId,
      role: 'patient',
      full_name,
      email,
    })
    if (profileError) {
      await serviceClient.auth.admin.deleteUser(patientId)
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    const { error: patientError } = await serviceClient.from('ng_patients').insert({
      id: patientId,
      doctor_id: user.id,
      lmp,
      edd,
      date_of_birth,
      gravida: gravida ?? 1,
      parity: parity ?? 0,
      blood_type,
      height_cm,
      pre_pregnancy_weight_kg,
      ethnicity,
    })

    if (patientError) {
      return NextResponse.json({ error: patientError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, patientId, temp_password })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
