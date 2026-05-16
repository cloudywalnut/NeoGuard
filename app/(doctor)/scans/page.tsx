'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ScanLine, ChevronDown, ChevronUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { RiskBadge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils/format'
import { SHAPBarChart } from '@/components/charts/SHAPBarChart'
import { SGARiskGauge } from '@/components/charts/SGARiskGauge'

interface ScanRow {
  id: string
  patient_id: string
  scan_date: string
  gestational_age_weeks: number
  gestational_age_days: number | null
  scan_type: string | null
  sga_risk_label: string | null
  sga_risk_score: number | null
  // biometrics
  bpd_mm: number | null
  hc_mm: number | null
  ac_mm: number | null
  fl_mm: number | null
  efw_grams: number | null
  efw_percentile: number | null
  nuchal_thickness_mm: number | null
  // dopplers
  ut_pi: number | null
  ut_ri: number | null
  ua_pi: number | null
  ua_ri: number | null
  mca_pi: number | null
  cpr: number | null
  papp_a_mom: number | null
  // AI outputs
  shap_values: Record<string, number> | null
  shap_narrative: string | null
  ale_flags: Record<string, boolean> | null
  ai_clinical_summary: string | null
  // nested
  patient: { ng_profiles: { full_name: string } } | null
}

export default function AllScansPage() {
  const [scans, setScans]           = useState<ScanRow[]>([])
  const [loading, setLoading]       = useState(true)
  const [riskFilter, setRiskFilter] = useState('')
  const [expanded, setExpanded]     = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const url = riskFilter ? `/api/scans?risk=${riskFilter}` : '/api/scans'
      const res  = await fetch(url)
      const data = await res.json()
      setScans(Array.isArray(data) ? data : [])
      setLoading(false)
    }
    load()
  }, [riskFilter])

  const toggle = (id: string) => setExpanded(prev => (prev === id ? null : id))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-extrabold text-3xl text-purple-950 tracking-tight">All Scans</h1>
          <p className="text-purple-400 font-medium mt-1">{scans.length} scans across your patients</p>
        </div>
        <select
          value={riskFilter}
          onChange={e => setRiskFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-purple-200 text-sm text-purple-700 focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white"
        >
          <option value="">All risk levels</option>
          <option value="high">High risk</option>
          <option value="moderate">Moderate</option>
          <option value="low">Low risk</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-purple-50 rounded-2xl animate-pulse" />)}
        </div>
      ) : scans.length === 0 ? (
        <div className="text-center py-16 text-purple-300">
          <ScanLine size={48} className="mx-auto mb-3 opacity-40" />
          <p className="font-bold text-lg">No scans found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {scans.map(scan => {
            const name      = scan.patient?.ng_profiles?.full_name ?? '—'
            const isOpen    = expanded === scan.id
            const gaStr     = `${scan.gestational_age_weeks}w${scan.gestational_age_days ? ` ${scan.gestational_age_days}d` : ''}`

            return (
              <Card key={scan.id} className="p-0 overflow-hidden">
                {/* Summary row */}
                <button
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-pink-50/50 transition-colors"
                  onClick={() => toggle(scan.id)}
                >
                  <RiskBadge label={scan.sga_risk_label} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/patients/${scan.patient_id}`}
                        className="font-bold text-purple-800 hover:text-pink-600 hover:underline transition-colors"
                        onClick={e => e.stopPropagation()}
                      >
                        {name}
                      </Link>
                      <span className="text-xs text-purple-400">·</span>
                      <span className="text-xs font-semibold text-purple-500">{gaStr}</span>
                      <span className="text-xs text-purple-400">·</span>
                      <span className="text-xs text-purple-500 capitalize">{scan.scan_type ?? '—'}</span>
                    </div>
                    <p className="text-xs text-purple-400 mt-0.5">{formatDate(scan.scan_date)}</p>
                  </div>

                  <div className="hidden sm:flex items-center gap-4 text-sm shrink-0">
                    {scan.ac_mm    != null && <span className="text-purple-600">AC <strong>{scan.ac_mm}mm</strong></span>}
                    {scan.efw_percentile != null && <span className="text-purple-600">EFW <strong>{scan.efw_percentile}th</strong></span>}
                    {scan.ut_pi    != null && <span className="text-purple-600">Ut PI <strong>{scan.ut_pi}</strong></span>}
                  </div>

                  {isOpen
                    ? <ChevronUp  size={16} className="text-purple-400 shrink-0" />
                    : <ChevronDown size={16} className="text-purple-400 shrink-0" />}
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 border-t border-purple-100 space-y-5">

                    {/* Risk gauge + SHAP */}
                    {(scan.sga_risk_score != null || scan.shap_values) && (
                      <div className="grid sm:grid-cols-2 gap-5">
                        {scan.sga_risk_score != null && (
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2">SGA Risk Score</p>
                            <SGARiskGauge score={scan.sga_risk_score} label={scan.sga_risk_label} />
                          </div>
                        )}
                        {scan.shap_values && (
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2">Feature Importance (SHAP)</p>
                            <SHAPBarChart shapValues={scan.shap_values} />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Biometrics grid */}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2">Biometrics &amp; Dopplers</p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                        {([
                          ['BPD', scan.bpd_mm,             'mm'],
                          ['HC',  scan.hc_mm,              'mm'],
                          ['AC',  scan.ac_mm,              'mm'],
                          ['FL',  scan.fl_mm,              'mm'],
                          ['EFW', scan.efw_grams,          'g'],
                          ['EFW %ile', scan.efw_percentile,'th'],
                          ['NT',  scan.nuchal_thickness_mm,'mm'],
                          ['Ut PI', scan.ut_pi,            ''],
                          ['Ut RI', scan.ut_ri,            ''],
                          ['UA PI', scan.ua_pi,            ''],
                          ['MCA PI',scan.mca_pi,           ''],
                          ['CPR',   scan.cpr,              ''],
                        ] as [string, number | null, string][]).filter(([,v]) => v != null).map(([label, val, unit]) => (
                          <div key={label} className="p-2 bg-purple-50 rounded-xl text-center">
                            <p className="text-[10px] text-purple-400 font-semibold">{label}</p>
                            <p className="font-bold text-purple-800 text-sm">{val}{unit}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ALE flags */}
                    {scan.ale_flags && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2">ALE Clinical Flags</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {([
                            { key: 'ac_flagged',    label: 'AC',    val: scan.ac_mm,              unit: 'mm', cutoff: '< 253mm' },
                            { key: 'nt_flagged',    label: 'NT',    val: scan.nuchal_thickness_mm, unit: 'mm', cutoff: '< 10th centile' },
                            { key: 'ut_ri_flagged', label: 'Ut RI', val: scan.ut_ri,              unit: '',   cutoff: '> 0.58' },
                            { key: 'ut_pi_flagged', label: 'Ut PI', val: scan.ut_pi,              unit: '',   cutoff: '> 1.0' },
                          ]).map(f => {
                            const flagged = scan.ale_flags![f.key]
                            return (
                              <div key={f.key} className={`p-3 rounded-xl border text-center ${flagged ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-1">{f.label}</p>
                                <p className={`font-bold text-base ${flagged ? 'text-amber-600' : 'text-green-600'}`}>
                                  {f.val != null ? `${f.val}${f.unit}` : '—'}
                                </p>
                                <p className="text-[10px] text-purple-400">{f.cutoff}</p>
                                <p className={`text-[10px] font-bold mt-1 ${flagged ? 'text-amber-600' : 'text-green-600'}`}>
                                  {flagged ? '⚠️ Flagged' : '✅ Normal'}
                                </p>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* SHAP narrative */}
                    {scan.shap_narrative && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-1">SHAP Analysis</p>
                        <p className="text-sm text-purple-700 leading-relaxed">{scan.shap_narrative}</p>
                      </div>
                    )}

                    {/* AI clinical summary */}
                    {scan.ai_clinical_summary && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-1">AI Clinical Summary</p>
                        <p className="text-sm text-purple-700 leading-relaxed">{scan.ai_clinical_summary}</p>
                      </div>
                    )}

                    <div className="pt-1">
                      <Link
                        href={`/patients/${scan.patient_id}`}
                        className="text-sm font-semibold text-pink-600 hover:underline"
                      >
                        View full patient profile →
                      </Link>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
