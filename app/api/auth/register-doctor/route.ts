import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { email, password, full_name, hospital, specialization, department, license_number } = await req.json()

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message ?? 'Failed to create user' }, { status: 400 })
    }

    const userId = authData.user.id

    const { error: profileError } = await supabase.from('ng_profiles').insert({
      id: userId,
      role: 'doctor',
      full_name,
      email,
    })

    if (profileError) {
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    const { error: doctorError } = await supabase.from('ng_doctors').insert({
      id: userId,
      hospital,
      specialization,
      department,
      license_number,
      is_approved: true,
    })

    if (doctorError) {
      return NextResponse.json({ error: doctorError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, userId })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
