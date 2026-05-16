import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SideDrawer } from '@/components/layout/SideDrawer'

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('ng_profiles').select('role, full_name').eq('id', user.id).single()
  if (profile?.role !== 'patient') redirect('/dashboard')

  return (
    <div className="flex h-screen overflow-hidden bg-violet-50">
      <SideDrawer role="patient" userName={profile.full_name} />
      <main className="flex-1 overflow-y-auto scrollbar-thin">{children}</main>
    </div>
  )
}
