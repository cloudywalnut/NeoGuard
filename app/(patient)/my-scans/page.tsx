import { createClient } from '@/lib/supabase/server'
import { Card, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils/format'
import type { Scan } from '@/types/database'

function StatusLabel({ label }: { label: string | null }) {
  if (label === 'high') return <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl"><span className="text-xl">💜</span><p className="font-semibold text-red-700">Please talk to your doctor</p></div>
  if (label === 'moderate') return <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl"><span className="text-xl">🔍</span><p className="font-semibold text-amber-700">Being closely monitored</p></div>
  return <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl"><span className="text-xl">✅</span><p className="font-semibold text-green-700">Growing beautifully</p></div>
}

function ALEFlag({ flagged, label }: { flagged: boolean; label: string }) {
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${flagged ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
      {label} {flagged ? '⚠️' : '✅'}
    </span>
  )
}

export default async function PatientScansPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: scans } = await supabase
    .from('ng_scans')
    .select('*')
    .eq('patient_id', user!.id)
    .order('scan_date', { ascending: false })

  const scanList = (scans ?? []) as Scan[]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-extrabold text-3xl text-purple-950 tracking-tight">My Scans</h1>
        <p className="text-purple-400 font-medium mt-1">{scanList.length} scans from your care team</p>
      </div>

      {scanList.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-4xl mb-3">🔬</p>
          <p className="font-bold text-purple-800">No scans yet</p>
          <p className="text-purple-400 text-sm mt-1">Your doctor will add your scan results here</p>
        </Card>
      ) : (
        <>
          {/* EFW trend in friendly language */}
          <Card>
            <CardTitle>Your Baby's Growth Timeline</CardTitle>
            <div className="mt-4 space-y-3">
              {scanList.map(scan => (
                <div key={scan.id} className="flex items-center gap-4 p-3 bg-purple-50 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-300 to-violet-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {scan.gestational_age_weeks}w
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-purple-800">{formatDate(scan.scan_date)}</p>
                    {scan.efw_percentile != null && (
                      <div className="mt-1">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-purple-100 rounded-full max-w-xs">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-pink-400 to-violet-500"
                              style={{ width: `${Math.min(scan.efw_percentile, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-purple-500">{scan.efw_percentile}th percentile</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Scan cards */}
          {scanList.map(scan => (
            <Card key={scan.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-purple-800">{formatDate(scan.scan_date)}</p>
                  <p className="text-xs text-purple-400">Week {scan.gestational_age_weeks} + {scan.gestational_age_days} days</p>
                </div>
              </div>

              <StatusLabel label={scan.sga_risk_label} />

              {scan.ale_flags && (
                <div className="flex flex-wrap gap-2 mt-3">
                  <ALEFlag flagged={(scan.ale_flags as Record<string, boolean>).ac_flagged} label="Tummy measurement" />
                  <ALEFlag flagged={(scan.ale_flags as Record<string, boolean>).nt_flagged} label="Neck measurement" />
                  <ALEFlag flagged={(scan.ale_flags as Record<string, boolean>).ut_ri_flagged || (scan.ale_flags as Record<string, boolean>).ut_pi_flagged} label="Uterine blood flow" />
                </div>
              )}

              {scan.ai_patient_summary && (
                <div className="mt-3 p-3 bg-violet-50 rounded-xl">
                  <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-1">From your care team</p>
                  <p className="text-sm text-purple-700">{scan.ai_patient_summary}</p>
                </div>
              )}
            </Card>
          ))}
        </>
      )}
    </div>
  )
}
