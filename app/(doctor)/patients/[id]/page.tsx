'use client'
import { useEffect, useState, use } from 'react'
import { calculateGestationalAge, formatGA, daysUntilEDD, getTrimester } from '@/lib/utils/gestational-age'
import { formatDate, riskColor } from '@/lib/utils/format'
import { Card, CardTitle } from '@/components/ui/card'
import { RiskBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScanForm } from '@/components/scans/ScanForm'
import { SHAPBarChart } from '@/components/charts/SHAPBarChart'
import { VitalsChart } from '@/components/charts/VitalsChart'
import { BiometryTrendChart } from '@/components/charts/BiometryTrendChart'
import { SGARiskGauge } from '@/components/charts/SGARiskGauge'
import type { Patient, Scan, Vital, Appointment } from '@/types/database'
import { Plus, Calendar, ScanLine, Activity, ChevronDown, ChevronUp } from 'lucide-react'

type Tab = 'overview' | 'appointments' | 'scans' | 'vitals' | 'insights'

interface SelfLog {
  id: string; logged_at: string
  systolic_bp?: number; diastolic_bp?: number; heart_rate?: number
  weight_kg?: number; fetal_movements?: number; sleep_hours?: number
  mood?: string; symptoms?: string[]
}

interface PatientData {
  patient: Patient & { profile: { full_name: string; email: string; avatar_seed: string | null } }
  scans: Scan[]
  vitals: Vital[]
  appointments: Appointment[]
  ai_conversations: Array<{ role: string; content: string; created_at: string }>
  patient_vitals_log: SelfLog[]
}

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [data, setData] = useState<PatientData | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [scanFormOpen,    setScanFormOpen]    = useState(false)
  const [expandedScan,    setExpandedScan]    = useState<string | null>(null)
  const [vitalFormOpen,   setVitalFormOpen]   = useState(false)
  const [vitalSaving,     setVitalSaving]     = useState(false)
  const [vitalForm, setVitalForm] = useState({
    systolic_bp: '', diastolic_bp: '', heart_rate: '',
    weight_kg: '', fundal_height_cm: '', urine_protein: 'negative', oedema: 'none', notes: '',
  })

  async function loadData() {
    const res = await fetch(`/api/patients/${id}`)
    if (res.ok) setData(await res.json())
  }

  async function saveVitals(e: React.FormEvent) {
    e.preventDefault()
    setVitalSaving(true)
    const toNum = (v: string) => { const n = parseFloat(v); return isNaN(n) ? null : n }
    await fetch(`/api/patients/${id}/vitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systolic_bp:      toNum(vitalForm.systolic_bp),
        diastolic_bp:     toNum(vitalForm.diastolic_bp),
        heart_rate:       toNum(vitalForm.heart_rate),
        weight_kg:        toNum(vitalForm.weight_kg),
        fundal_height_cm: toNum(vitalForm.fundal_height_cm),
        urine_protein:    vitalForm.urine_protein,
        oedema:           vitalForm.oedema,
        notes:            vitalForm.notes || null,
      }),
    })
    setVitalSaving(false)
    setVitalFormOpen(false)
    setVitalForm({ systolic_bp: '', diastolic_bp: '', heart_rate: '', weight_kg: '', fundal_height_cm: '', urine_protein: 'negative', oedema: 'none', notes: '' })
    loadData()
  }

  useEffect(() => { loadData() }, [id])

  if (!data) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-pink-100 rounded-2xl" />
          <div className="h-64 bg-purple-50 rounded-2xl" />
        </div>
      </div>
    )
  }

  const { patient, scans, vitals, appointments, patient_vitals_log } = data
  const ga = calculateGestationalAge(patient.lmp)
  const countdown = patient.edd ? daysUntilEDD(patient.edd) : null
  const latestScan = scans.length > 0 ? scans[scans.length - 1] : null
  const latestVital = vitals.length > 0 ? vitals[0] : null

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'appointments', label: 'Appointments' },
    { id: 'scans', label: 'Scans' },
    { id: 'vitals', label: 'Vitals' },
    { id: 'insights', label: 'AI Insights' },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Patient Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-pink-50 to-violet-50 border-b border-purple-100 px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-400 to-violet-500 flex items-center justify-center text-white font-extrabold text-2xl flex-shrink-0">
              {(patient.profile?.full_name ?? 'P')[0]}
            </div>
            <div>
              <h1 className="font-extrabold text-2xl text-purple-950">{patient.profile?.full_name ?? 'Unknown patient'}</h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="font-bold text-pink-600 text-lg">{formatGA(ga.weeks, ga.days)}</span>
                {countdown !== null && (
                  <span className="text-sm text-purple-400">EDD in {countdown} days</span>
                )}
                {patient.blood_type && (
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full text-xs font-bold">{patient.blood_type}</span>
                )}
                {latestScan && <RiskBadge label={latestScan.sga_risk_label} />}
              </div>
              {patient.risk_factors && patient.risk_factors.length > 0 && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  {patient.risk_factors.map(r => (
                    <span key={r} className="px-2 py-0.5 bg-red-50 text-red-500 border border-red-100 rounded-full text-xs">{r}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button size="sm" variant="outline" onClick={() => setScanFormOpen(true)}>
              <ScanLine size={14} /> Scan
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.id ? 'bg-pink-500 text-white' : 'text-purple-500 hover:bg-pink-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <>
            <div className="grid lg:grid-cols-3 gap-6">
              <Card>
                <CardTitle>SGA Risk Score</CardTitle>
                {latestScan?.sga_risk_score != null ? (
                  <SGARiskGauge score={latestScan.sga_risk_score} label={latestScan.sga_risk_label} />
                ) : (
                  <p className="text-purple-400 text-sm py-4">No scan data yet</p>
                )}
              </Card>

              <Card className="lg:col-span-2">
                <CardTitle>SHAP Feature Importance</CardTitle>
                <p className="text-xs text-purple-400 mb-2">Last scan — top contributors to SGA risk</p>
                {latestScan?.shap_values ? (
                  <SHAPBarChart shapValues={latestScan.shap_values} />
                ) : (
                  <p className="text-purple-400 text-sm py-4">Add a scan to see feature analysis</p>
                )}
              </Card>
            </div>

            {/* ALE Flags */}
            {latestScan?.ale_flags && (
              <Card>
                <CardTitle>ALE Clinical Flags</CardTitle>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
                  {[
                    { key: 'ac_flagged', label: 'AC', val: latestScan.ac_mm, unit: 'mm', cutoff: '< 253mm' },
                    { key: 'nt_flagged', label: 'NT', val: latestScan.nuchal_thickness_mm, unit: 'mm', cutoff: '< 10th centile' },
                    { key: 'ut_ri_flagged', label: 'Ut RI', val: latestScan.ut_ri, unit: '', cutoff: '> 0.58' },
                    { key: 'ut_pi_flagged', label: 'Ut PI', val: latestScan.ut_pi, unit: '', cutoff: '> 1.0' },
                  ].map(f => {
                    const flagged = (latestScan.ale_flags as Record<string, boolean>)[f.key]
                    return (
                      <div key={f.key} className={`p-3 rounded-xl border ${flagged ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                        <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-1">{f.label}</p>
                        <p className={`font-bold text-lg ${flagged ? 'text-amber-600' : 'text-green-600'}`}>
                          {f.val != null ? `${f.val}${f.unit}` : '—'}
                        </p>
                        <p className="text-xs text-purple-400">{f.cutoff}</p>
                        <p className={`text-xs font-bold mt-1 ${flagged ? 'text-amber-600' : 'text-green-600'}`}>
                          {flagged ? '⚠️ Flagged' : '✅ Normal'}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}

            {/* Vitals snapshot */}
            {latestVital && (
              <Card>
                <CardTitle>Latest Vitals</CardTitle>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
                  {[
                    { label: 'Blood Pressure', val: latestVital.systolic_bp ? `${latestVital.systolic_bp}/${latestVital.diastolic_bp} mmHg` : '—', warn: latestVital.systolic_bp != null && latestVital.systolic_bp >= 140 },
                    { label: 'Heart Rate', val: latestVital.heart_rate ? `${latestVital.heart_rate} bpm` : '—', warn: false },
                    { label: 'Weight', val: latestVital.weight_kg ? `${latestVital.weight_kg} kg` : '—', warn: false },
                    { label: 'Fundal Height', val: latestVital.fundal_height_cm ? `${latestVital.fundal_height_cm} cm` : '—', warn: false },
                  ].map(v => (
                    <div key={v.label} className={`p-3 rounded-xl border ${v.warn ? 'bg-red-50 border-red-200' : 'bg-purple-50 border-purple-100'}`}>
                      <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-1">{v.label}</p>
                      <p className={`font-bold ${v.warn ? 'text-red-600' : 'text-purple-800'}`}>{v.val}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Gemini clinical summary */}
            {latestScan?.ai_clinical_summary && (
              <Card>
                <CardTitle>AI Clinical Summary</CardTitle>
                <p className="text-xs text-purple-400 mb-3">Gemini interpretation — {formatDate(latestScan.scan_date)}</p>
                <p className="text-sm text-purple-700 leading-relaxed">{latestScan.ai_clinical_summary}</p>
              </Card>
            )}

            {/* Pregnancy progress */}
            <Card>
              <CardTitle>Pregnancy Progress</CardTitle>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-purple-400 mb-1">
                  <span>Week 0</span>
                  <span className="font-bold text-purple-700">{formatGA(ga.weeks, ga.days)}</span>
                  <span>Week 40</span>
                </div>
                <div className="h-3 bg-purple-100 rounded-full">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-pink-400 to-violet-500 transition-all"
                    style={{ width: `${Math.min((ga.weeks / 40) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-purple-300 mt-1">
                  <span>T1</span><span>T2 (14w)</span><span>T3 (28w)</span><span>Term</span>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* APPOINTMENTS */}
        {activeTab === 'appointments' && (
          <div className="space-y-3">
            {appointments.length === 0 ? (
              <div className="text-center py-12 text-purple-300">
                <Calendar size={40} className="mx-auto mb-2 opacity-40" />
                <p>No appointments yet</p>
              </div>
            ) : appointments.map(appt => (
              <Card key={appt.id} className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-purple-800">{formatDate(appt.scheduled_at)}</p>
                  <p className="text-sm text-purple-500 capitalize">{appt.appointment_type?.replace('_', ' ')}</p>
                  {appt.notes && <p className="text-sm text-purple-400 mt-1">{appt.notes}</p>}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                  appt.status === 'completed' ? 'bg-green-100 text-green-700'
                  : appt.status === 'cancelled' ? 'bg-red-100 text-red-700'
                  : 'bg-violet-100 text-violet-700'
                }`}>
                  {appt.status}
                </span>
              </Card>
            ))}
          </div>
        )}

        {/* SCANS */}
        {activeTab === 'scans' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setScanFormOpen(true)}>
                <Plus size={14} /> New Scan
              </Button>
            </div>
            {scans.length === 0 ? (
              <div className="text-center py-12 text-purple-300">
                <ScanLine size={40} className="mx-auto mb-2 opacity-40" />
                <p>No scans recorded yet</p>
              </div>
            ) : (
              <>
                <BiometryTrendChart scans={scans} />
                {[...scans].reverse().map(scan => (
                  <Card key={scan.id}>
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedScan(expandedScan === scan.id ? null : scan.id)}
                    >
                      <div className="flex items-center gap-3">
                        <RiskBadge label={scan.sga_risk_label} />
                        <div>
                          <p className="font-semibold text-purple-800">{formatDate(scan.scan_date)}</p>
                          <p className="text-xs text-purple-400">GA {scan.gestational_age_weeks}w {scan.gestational_age_days}d · {scan.scan_type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm flex-wrap justify-end">
                        {scan.ac_mm            != null && <span className="text-purple-600">AC <strong>{scan.ac_mm}mm</strong></span>}
                        {scan.nuchal_thickness_mm != null && <span className="text-pink-600">NT <strong>{scan.nuchal_thickness_mm}mm</strong></span>}
                        {scan.efw_percentile   != null && <span className="text-purple-600">EFW <strong>{scan.efw_percentile}th</strong></span>}
                        {expandedScan === scan.id ? <ChevronUp size={16} className="text-purple-400" /> : <ChevronDown size={16} className="text-purple-400" />}
                      </div>
                    </div>

                    {expandedScan === scan.id && (
                      <div className="mt-4 pt-4 border-t border-purple-100 space-y-4">
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          {[
                            ['BPD', scan.bpd_mm, 'mm'], ['HC', scan.hc_mm, 'mm'], ['AC', scan.ac_mm, 'mm'],
                            ['FL', scan.fl_mm, 'mm'], ['EFW', scan.efw_grams, 'g'], ['EFW %ile', scan.efw_percentile, ''],
                            ['NT', scan.nuchal_thickness_mm, 'mm'], ['Ut PI', scan.ut_pi, ''], ['Ut RI', scan.ut_ri, ''],
                            ['UA PI', scan.ua_pi, ''], ['MCA PI', scan.mca_pi, ''], ['CPR', scan.cpr, ''],
                          ].map(([label, val, unit]) => val != null && (
                            <div key={label as string} className="p-2 bg-purple-50 rounded-lg">
                              <p className="text-xs text-purple-400">{label}</p>
                              <p className="font-bold text-purple-800">{val}{unit}</p>
                            </div>
                          ))}
                        </div>
                        {scan.shap_narrative && (
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-1">SHAP Analysis</p>
                            <p className="text-sm text-purple-700">{scan.shap_narrative}</p>
                          </div>
                        )}
                        {scan.ai_clinical_summary && (
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-1">AI Clinical Summary</p>
                            <p className="text-sm text-purple-700">{scan.ai_clinical_summary}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </>
            )}
          </div>
        )}

        {/* VITALS */}
        {activeTab === 'vitals' && (
          <div className="space-y-5">

            {/* Log vitals form */}
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setVitalFormOpen(o => !o)}>
                <Plus size={14} /> Log vitals
              </Button>
            </div>

            {vitalFormOpen && (
              <Card>
                <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-3">Record Clinic Vitals</p>
                <form onSubmit={saveVitals} className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    {[
                      { label: 'Systolic BP', key: 'systolic_bp', placeholder: '120' },
                      { label: 'Diastolic BP', key: 'diastolic_bp', placeholder: '80' },
                      { label: 'Heart Rate', key: 'heart_rate', placeholder: '72' },
                      { label: 'Weight (kg)', key: 'weight_kg', placeholder: '65' },
                      { label: 'Fundal Height (cm)', key: 'fundal_height_cm', placeholder: '28' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="text-xs text-purple-400 mb-1 block">{f.label}</label>
                        <input
                          type="number" step="any" placeholder={f.placeholder}
                          value={vitalForm[f.key as keyof typeof vitalForm]}
                          onChange={e => setVitalForm(v => ({ ...v, [f.key]: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border border-purple-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="text-xs text-purple-400 mb-1 block">Urine Protein</label>
                      <select value={vitalForm.urine_protein} onChange={e => setVitalForm(v => ({ ...v, urine_protein: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-purple-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white">
                        {['negative', '+', '++', '+++'].map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-purple-400 mb-1 block">Oedema</label>
                      <select value={vitalForm.oedema} onChange={e => setVitalForm(v => ({ ...v, oedema: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-purple-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white">
                        {['none', 'mild', 'moderate', 'severe'].map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                  <input placeholder="Notes (optional)" value={vitalForm.notes}
                    onChange={e => setVitalForm(v => ({ ...v, notes: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button type="button" size="sm" variant="outline" onClick={() => setVitalFormOpen(false)}>Cancel</Button>
                    <Button type="submit" size="sm" loading={vitalSaving}>Save</Button>
                  </div>
                </form>
              </Card>
            )}

            <VitalsChart vitals={vitals} />

            {/* Clinic vitals */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-purple-400">Clinic Vitals</p>
              {vitals.length === 0
                ? <p className="text-sm text-purple-300 py-2">No clinic vitals recorded yet</p>
                : vitals.map(v => (
                  <Card key={v.id}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-purple-800">{formatDate(v.recorded_at)}</p>
                        <div className="flex gap-3 mt-1 text-sm text-purple-600 flex-wrap">
                          {v.systolic_bp      && <span>BP {v.systolic_bp}/{v.diastolic_bp}</span>}
                          {v.heart_rate       && <span>HR {v.heart_rate}</span>}
                          {v.weight_kg        && <span>Wt {v.weight_kg}kg</span>}
                          {v.fundal_height_cm && <span>FH {v.fundal_height_cm}cm</span>}
                          {v.urine_protein && v.urine_protein !== 'negative' && <span className="text-amber-600">Protein {v.urine_protein}</span>}
                          {v.oedema && v.oedema !== 'none' && <span className="text-amber-600">Oedema: {v.oedema}</span>}
                        </div>
                      </div>
                      {v.systolic_bp != null && v.systolic_bp >= 140 &&
                        <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">⚠️ High BP</span>}
                    </div>
                  </Card>
                ))
              }
            </div>

            {/* Patient self-logs */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-purple-400">Patient Self-Logs</p>
              {patient_vitals_log.length === 0
                ? <p className="text-sm text-purple-300 py-2">No self-logs yet</p>
                : patient_vitals_log.map(log => (
                  <Card key={log.id}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-purple-400">{formatDate(log.logged_at)}</p>
                        <div className="flex gap-3 mt-1 text-sm text-purple-600 flex-wrap">
                          {log.systolic_bp     && <span className={log.systolic_bp >= 140 ? 'text-red-600 font-semibold' : ''}>BP {log.systolic_bp}/{log.diastolic_bp}</span>}
                          {log.heart_rate      && <span>HR {log.heart_rate}</span>}
                          {log.weight_kg       && <span>Wt {log.weight_kg}kg</span>}
                          {log.fetal_movements != null && <span>Kicks {log.fetal_movements}</span>}
                        </div>
                        {log.symptoms && log.symptoms.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {log.symptoms.map(s => <span key={s} className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full text-xs">{s}</span>)}
                          </div>
                        )}
                      </div>
                      <span className="text-lg ml-2">
                        {log.mood === 'great' ? '😊' : log.mood === 'good' ? '🙂' : log.mood === 'fair' ? '😐' : log.mood === 'poor' ? '😔' : null}
                      </span>
                    </div>
                  </Card>
                ))
              }
            </div>
          </div>
        )}

        {/* AI INSIGHTS */}
        {activeTab === 'insights' && (
          <div className="space-y-4">
            <Card>
              <CardTitle>Risk Trajectory</CardTitle>
              <div className="mt-3 space-y-2">
                {scans.map(scan => (
                  <div key={scan.id} className="flex items-center gap-3">
                    <span className="text-xs text-purple-400 w-24">{formatDate(scan.scan_date)}</span>
                    <div className="flex-1 h-2 bg-purple-100 rounded-full">
                      <div
                        className={`h-2 rounded-full ${scan.sga_risk_label === 'high' ? 'bg-red-400' : scan.sga_risk_label === 'moderate' ? 'bg-amber-400' : 'bg-green-400'}`}
                        style={{ width: `${(scan.sga_risk_score ?? 0) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-purple-700 w-8">{scan.sga_risk_score != null ? `${Math.round(scan.sga_risk_score * 100)}%` : '—'}</span>
                  </div>
                ))}
              </div>
            </Card>

            {scans.filter(s => s.ai_clinical_summary).map(scan => (
              <Card key={scan.id}>
                <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2">
                  Scan {formatDate(scan.scan_date)} — GA {scan.gestational_age_weeks}w
                </p>
                <RiskBadge label={scan.sga_risk_label} />
                <p className="text-sm text-purple-700 mt-3 leading-relaxed">{scan.ai_clinical_summary}</p>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ScanForm
        open={scanFormOpen}
        onClose={() => setScanFormOpen(false)}
        patientId={id}
        onSaved={loadData}
        appointments={appointments}
      />
    </div>
  )
}
