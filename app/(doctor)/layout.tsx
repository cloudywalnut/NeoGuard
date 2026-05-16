import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SideDrawer } from '@/components/layout/SideDrawer'

export default async function DoctorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('ng_profiles').select('role, full_name').eq('id', user.id).single()
  if (profile?.role !== 'doctor') redirect('/home')

  return (
    <div className="flex h-screen overflow-hidden bg-pink-50">
      <SideDrawer role="doctor" userName={profile.full_name} />
      <main className="flex-1 overflow-y-auto scrollbar-thin">{children}</main>
    </div>
  )
}
