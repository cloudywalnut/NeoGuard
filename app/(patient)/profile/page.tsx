import { createClient } from '@/lib/supabase/server'
import { Card, CardTitle } from '@/components/ui/card'
import { calculateGestationalAge, formatGA } from '@/lib/utils/gestational-age'
import { formatDate } from '@/lib/utils/format'

export default async function PatientSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: patient } = await supabase.from('ng_patients').select('*, ng_profiles!id(full_name, email)').eq('id', user!.id).single()
  if (!patient) return <div className="p-6 text-purple-400">Profile not found.</div>

  const ga = calculateGestationalAge(patient.lmp)
  const profile = patient['ng_profiles'] as { full_name: string; email: string }

  return (
    <div className="p-6 space-y-6 max-w-xl">
      <div>
        <h1 className="font-extrabold text-3xl text-purple-950 tracking-tight">My Profile</h1>
        <p className="text-purple-400 font-medium mt-1">Your pregnancy details</p>
      </div>

      <Card>
        <CardTitle>Account</CardTitle>
        <div className="mt-3 space-y-3">
          {[
            ['Name', profile?.full_name],
            ['Email', profile?.email],
            ['Current GA', formatGA(ga.weeks, ga.days)],
            ['LMP', formatDate(patient.lmp)],
            ['EDD', patient.edd ? formatDate(patient.edd) : '—'],
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between py-2 border-b border-purple-50 last:border-0">
              <span className="text-xs font-bold uppercase tracking-widest text-purple-400">{l}</span>
              <span className="font-semibold text-purple-800">{v ?? '—'}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle>Pregnancy Details</CardTitle>
        <div className="mt-3 space-y-3">
          {[
            ['Blood Type', patient.blood_type],
            ['Gravida', patient.gravida],
            ['Parity', patient.parity],
            ['Height', patient.height_cm ? `${patient.height_cm} cm` : '—'],
            ['Pre-pregnancy Weight', patient.pre_pregnancy_weight_kg ? `${patient.pre_pregnancy_weight_kg} kg` : '—'],
            ['Ethnicity', patient.ethnicity],
          ].map(([l, v]) => (
            <div key={String(l)} className="flex justify-between py-2 border-b border-purple-50 last:border-0">
              <span className="text-xs font-bold uppercase tracking-widest text-purple-400">{l}</span>
              <span className="font-semibold text-purple-800">{v ?? '—'}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
