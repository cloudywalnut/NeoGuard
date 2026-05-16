import { createClient } from '@/lib/supabase/server'
import { calculateGestationalAge, daysUntilEDD } from '@/lib/utils/gestational-age'
import { getBabySize } from '@/lib/utils/baby-size'
import { formatDate, formatDateTime } from '@/lib/utils/format'
import { Card, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default async function PatientHomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [patientRes, latestScanRes, nextApptRes] = await Promise.all([
    supabase.from('ng_patients').select('*').eq('id', user!.id).single(),
    supabase.from('ng_scans').select('ai_patient_summary, sga_risk_label, scan_date').eq('patient_id', user!.id).order('scan_date', { ascending: false }).limit(1).single(),
    supabase.from('ng_appointments').select('*').eq('patient_id', user!.id).eq('status', 'scheduled').gte('scheduled_at', new Date().toISOString()).order('scheduled_at', { ascending: true }).limit(1).single(),
  ])

  const patient = patientRes.data
  if (!patient) return <div className="p-6 text-purple-400">Patient profile not found.</div>

  const ga = calculateGestationalAge(patient.lmp)
  const countdown = patient.edd ? daysUntilEDD(patient.edd) : null
  const babySize = getBabySize(ga.weeks)
  const latestScan = latestScanRes.data
  const nextAppt = nextApptRes.data

  const patientLabel = (label: string | null) => {
    if (label === 'high') return { text: 'Please talk to your doctor', emoji: '💜', bg: 'bg-red-50', color: 'text-red-600' }
    if (label === 'moderate') return { text: 'Being closely monitored', emoji: '🔍', bg: 'bg-amber-50', color: 'text-amber-600' }
    return { text: 'Growing beautifully', emoji: '✅', bg: 'bg-green-50', color: 'text-green-600' }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Hero Card */}
      <div className="bg-linear-to-br from-pink-400 to-violet-500 rounded-3xl p-8 text-white text-center shadow-lg">
        <p className="text-lg font-medium opacity-90">You are</p>
        <p className="font-extrabold text-5xl tracking-tight mt-1">
          {ga.weeks}<span className="text-3xl"> weeks</span> + {ga.days}<span className="text-2xl"> days</span>
        </p>
        <p className="text-lg opacity-90 mt-1">pregnant 💜</p>
        {countdown !== null && (
          <div className="mt-4 inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
            <span className="text-sm font-semibold">{countdown} days until your due date 🌸</span>
          </div>
        )}
      </div>

      {/* Baby size + next appt */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="text-center">
          <p className="text-4xl mb-2">{babySize.emoji}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-1">Baby size</p>
          <p className="font-bold text-purple-800">About the size of a {babySize.name}</p>
        </Card>

        {nextAppt ? (
          <Card>
            <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2">Next Appointment</p>
            <p className="font-bold text-purple-800">{formatDateTime(nextAppt.scheduled_at)}</p>
            <p className="text-sm text-purple-500 capitalize mt-1">{nextAppt.appointment_type?.replace('_', ' ')}</p>
          </Card>
        ) : (
          <Card className="flex items-center justify-center text-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2">Next Appointment</p>
              <p className="text-purple-400 text-sm">No upcoming appointments</p>
            </div>
          </Card>
        )}
      </div>

      {/* Latest AI insight */}
      {latestScan?.ai_patient_summary && (
        <Card className={patientLabel(latestScan.sga_risk_label).bg}>
          <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2">
            Latest scan insight {latestScan.scan_date && `— ${formatDate(latestScan.scan_date)}`}
          </p>
          <p className="text-2xl mb-2">{patientLabel(latestScan.sga_risk_label).emoji}</p>
          <p className={`font-semibold ${patientLabel(latestScan.sga_risk_label).color} mb-2`}>
            {patientLabel(latestScan.sga_risk_label).text}
          </p>
          <p className="text-sm text-purple-700">{latestScan.ai_patient_summary}</p>
        </Card>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/vitals" className="block">
          <div className="p-4 bg-pink-50 border border-pink-100 rounded-2xl hover:border-pink-300 hover:shadow-sm transition-all text-center">
            <p className="text-2xl mb-1">📊</p>
            <p className="font-bold text-purple-800 text-sm">Log Vitals</p>
          </div>
        </Link>
        <Link href="/chat" className="block">
          <div className="p-4 bg-violet-50 border border-violet-100 rounded-2xl hover:border-violet-300 hover:shadow-sm transition-all text-center">
            <p className="text-2xl mb-1">💬</p>
            <p className="font-bold text-purple-800 text-sm">Chat with NeoGuard</p>
          </div>
        </Link>
        <Link href="/my-scans" className="block">
          <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl hover:border-purple-300 hover:shadow-sm transition-all text-center">
            <p className="text-2xl mb-1">🔬</p>
            <p className="font-bold text-purple-800 text-sm">My Scans</p>
          </div>
        </Link>
        <Link href="/pregnancy" className="block">
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl hover:border-rose-300 hover:shadow-sm transition-all text-center">
            <p className="text-2xl mb-1">🤰</p>
            <p className="font-bold text-purple-800 text-sm">My Pregnancy</p>
          </div>
        </Link>
      </div>

      {/* Pregnancy progress */}
      <Card>
        <CardTitle>Pregnancy Progress</CardTitle>
        <div className="mt-3">
          <div className="h-4 bg-purple-100 rounded-full overflow-hidden">
            <div
              className="h-4 rounded-full bg-linear-to-r from-pink-400 to-violet-500"
              style={{ width: `${Math.min((ga.weeks / 40) * 100, 100)}%`, transition: 'width 1s ease' }}
            />
          </div>
          <div className="flex justify-between text-xs text-purple-300 mt-2">
            <span>Week 1</span>
            <span className="font-bold text-purple-600">Week {ga.weeks}</span>
            <span>Week 40</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
