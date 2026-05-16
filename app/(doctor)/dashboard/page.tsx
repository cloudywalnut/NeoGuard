import { createClient } from '@/lib/supabase/server'
import { StatCard, Card, CardTitle } from '@/components/ui/card'
import { RiskBadge } from '@/components/ui/badge'
import { formatDate, formatDateTime } from '@/lib/utils/format'
import { Users, Calendar, ScanLine } from 'lucide-react'
import Link from 'next/link'
import { startOfWeek, endOfWeek } from 'date-fns'

async function getDashboardData(userId: string) {
  const supabase = await createClient()

  const [patientsRes, weekAppts, allScans, upcomingAppts] = await Promise.all([
    supabase.from('ng_patients').select('id', { count: 'exact' }).eq('doctor_id', userId).eq('is_active', true),
    supabase.from('ng_appointments').select('id', { count: 'exact' }).eq('doctor_id', userId)
      .gte('scheduled_at', startOfWeek(new Date()).toISOString())
      .lte('scheduled_at', endOfWeek(new Date()).toISOString()),
    supabase.from('ng_scans')
      .select('id, sga_risk_label, scan_date, patient_id, patient:ng_patients!patient_id(profile:ng_profiles!id(full_name))')
      .eq('doctor_id', userId)
      .order('scan_date', { ascending: false })
      .limit(100),
    supabase.from('ng_appointments').select('*, ng_patients!inner(ng_profiles!id(full_name))')
      .eq('doctor_id', userId).eq('status', 'scheduled')
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true }).limit(7),
  ])

  const scans = allScans.data ?? []
  const patientLatestRisk: Record<string, string> = {}
  for (const s of [...scans].reverse()) { patientLatestRisk[s.patient_id] = s.sga_risk_label ?? 'low' }
  const highRisk = Object.values(patientLatestRisk).filter(r => r === 'high').length
  const riskDist = { low: 0, moderate: 0, high: 0 }
  for (const r of Object.values(patientLatestRisk)) { if (r in riskDist) riskDist[r as keyof typeof riskDist]++ }

  return {
    totalPatients: patientsRes.count ?? 0,
    weekAppts: weekAppts.count ?? 0,
    highRisk,
    scansTotal: scans.length,
    recentScans: scans.slice(0, 8),
    riskDist,
    upcomingAppts: upcomingAppts.data ?? [],
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('ng_profiles').select('full_name').eq('id', user!.id).single()
  const data = await getDashboardData(user!.id)

  const total = data.riskDist.low + data.riskDist.moderate + data.riskDist.high || 1
  const pct = (n: number) => Math.round((n / total) * 100)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-extrabold text-3xl text-purple-950 tracking-tight">
          Good {getGreeting()}, {profile?.full_name?.split(' ')[0] ?? 'Doctor'} 👋
        </h1>
        <p className="text-purple-400 font-medium mt-1">Here's your practice overview for today</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Patients" value={data.totalPatients} color="violet" />
        <StatCard label="Appointments This Week" value={data.weekAppts} color="rose" />
        <StatCard label="High-Risk Cases" value={data.highRisk} color="red" />
        <StatCard label="Scans on Record" value={data.scansTotal} color="amber" />
      </div>

      {/* Risk donut + upcoming */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Risk Distribution */}
        <Card className="lg:col-span-1">
          <CardTitle>SGA Risk Distribution</CardTitle>
          <p className="text-xs text-purple-400 mb-4">Across all active patients</p>
          <div className="space-y-3">
            {(['high', 'moderate', 'low'] as const).map(r => (
              <div key={r}>
                <div className="flex justify-between text-sm font-semibold text-purple-700 mb-1">
                  <span className="capitalize">{r}</span>
                  <span>{data.riskDist[r]} patients ({pct(data.riskDist[r])}%)</span>
                </div>
                <div className="h-2 rounded-full bg-purple-100">
                  <div
                    className={`h-2 rounded-full transition-all ${r === 'high' ? 'bg-red-400' : r === 'moderate' ? 'bg-amber-400' : 'bg-green-400'}`}
                    style={{ width: `${pct(data.riskDist[r])}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Upcoming appointments */}
        <Card className="lg:col-span-2">
          <CardTitle>Upcoming Appointments</CardTitle>
          <p className="text-xs text-purple-400 mb-4">Next 7 days</p>
          {data.upcomingAppts.length === 0 ? (
            <div className="text-center py-8 text-purple-300">
              <Calendar size={36} className="mx-auto mb-2 opacity-50" />
              <p className="font-medium">No upcoming appointments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.upcomingAppts.map((appt: Record<string, unknown>) => {
                const patient = (appt.ng_patients as Record<string, unknown>)
                const profileData = (patient?.['ng_profiles'] as Record<string, unknown>) ?? {}
                return (
                  <div key={appt.id as string} className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-purple-800 text-sm">{(profileData.full_name as string) ?? 'Unknown'}</p>
                      <p className="text-xs text-purple-400">{formatDateTime(appt.scheduled_at as string)}</p>
                    </div>
                    <span className="px-2 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-bold capitalize">
                      {(appt.appointment_type as string)?.replace('_', ' ')}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Recent scan activity */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Recent Scan Activity</CardTitle>
          <Link href="/scans" className="text-xs text-pink-600 font-semibold hover:underline">View all →</Link>
        </div>
        {data.recentScans.length === 0 ? (
          <div className="text-center py-8 text-purple-300">
            <ScanLine size={36} className="mx-auto mb-2 opacity-50" />
            <p className="font-medium">No scans recorded yet</p>
          </div>
        ) : (
          <div className="divide-y divide-purple-50">
            {data.recentScans.map((scan: Record<string, unknown>) => {
              const patientData  = scan.patient as Record<string, unknown> | null
              const profileData  = patientData?.['profile'] as Record<string, unknown> | null
              const patientName  = (profileData?.full_name as string) ?? 'Unknown patient'
              return (
                <Link
                  key={scan.id as string}
                  href={`/patients/${scan.patient_id as string}`}
                  className="flex items-center justify-between py-3 hover:bg-pink-50/60 -mx-6 px-6 transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-purple-800">{patientName}</p>
                    <p className="text-xs text-purple-400">{formatDate(scan.scan_date as string)}</p>
                  </div>
                  <RiskBadge label={scan.sga_risk_label as string} />
                </Link>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
