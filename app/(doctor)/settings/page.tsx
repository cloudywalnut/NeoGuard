import { createClient } from '@/lib/supabase/server'
import { Card, CardTitle } from '@/components/ui/card'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('ng_profiles').select('*').eq('id', user!.id).single()
  const { data: doctor } = await supabase.from('ng_doctors').select('*').eq('id', user!.id).single()

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="font-extrabold text-3xl text-purple-950 tracking-tight">Settings</h1>
        <p className="text-purple-400 font-medium mt-1">Your account and professional details</p>
      </div>

      <Card>
        <CardTitle>Account</CardTitle>
        <div className="mt-3 space-y-3">
          {[
            ['Full Name', profile?.full_name],
            ['Email', profile?.email],
            ['Role', profile?.role],
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between py-2 border-b border-purple-50 last:border-0">
              <span className="text-xs font-bold uppercase tracking-widest text-purple-400">{l}</span>
              <span className="font-semibold text-purple-800">{v ?? '—'}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle>Professional Details</CardTitle>
        <div className="mt-3 space-y-3">
          {[
            ['Hospital', doctor?.hospital],
            ['Specialization', doctor?.specialization],
            ['Department', doctor?.department],
            ['License Number', doctor?.license_number],
            ['Approval Status', doctor?.is_approved ? '✅ Approved' : '⏳ Pending'],
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between py-2 border-b border-purple-50 last:border-0">
              <span className="text-xs font-bold uppercase tracking-widest text-purple-400">{l}</span>
              <span className="font-semibold text-purple-800">{v ?? '—'}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle>Research Foundation</CardTitle>
        <div className="mt-3 space-y-2 text-sm text-purple-700">
          <p><strong>Paper:</strong> Saw SN et al. "Nuchal Thickness Reference Chart and SGA Prediction"</p>
          <p><strong>Journal:</strong> Prenatal Diagnosis 2025 · doi: 10.1002/pd.6748</p>
          <p><strong>Institution:</strong> FSKTM, Universiti Malaya</p>
          <p><strong>Cohort:</strong> 5,519 singleton pregnancies, UMMC Malaysia</p>
          <p><strong>Best model (Malaysia):</strong> Logistic Regression — AUC 0.75</p>
          <p><strong>Best model (Singapore):</strong> SVM — AUC 0.81</p>
        </div>
      </Card>
    </div>
  )
}
