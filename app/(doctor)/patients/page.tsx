'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { RiskBadge } from '@/components/ui/badge'
import { NewPatientModal } from '@/components/patients/NewPatientModal'
import { calculateGestationalAge, formatGA, daysUntilEDD } from '@/lib/utils/gestational-age'
import { formatDate } from '@/lib/utils/format'

interface Patient {
  id: string; lmp: string; edd: string | null
  profile: { full_name: string; avatar_seed: string | null }
  latest_scan?: { sga_risk_label: string | null; scan_date: string } | null
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  async function loadPatients() {
    setLoading(true)
    const res = await fetch('/api/patients')
    const data = await res.json()
    setPatients(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { loadPatients() }, [])

  const filtered = patients.filter(p => {
    const name = (p.profile?.full_name ?? '').toLowerCase()
    const matchesSearch = name.includes(search.toLowerCase())
    const matchesRisk = !riskFilter || p.latest_scan?.sga_risk_label === riskFilter
    return matchesSearch && matchesRisk
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-extrabold text-3xl text-purple-950 tracking-tight">My Patients</h1>
          <p className="text-purple-400 font-medium mt-1">{patients.length} active patients</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> New Patient
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-300" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patients..." className="pl-9" />
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

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-pink-100 p-5 animate-pulse h-40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-purple-300">
          <Users size={48} className="mx-auto mb-3 opacity-40" />
          <p className="font-bold text-lg">No patients found</p>
          <p className="text-sm mt-1">Add your first patient to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(patient => {
            const ga = calculateGestationalAge(patient.lmp)
            const countdown = patient.edd ? daysUntilEDD(patient.edd) : null
            return (
              <Link key={patient.id} href={`/patients/${patient.id}`}>
                <Card className="hover:shadow-md hover:border-pink-200 transition-all cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-pink-300 to-violet-400 flex items-center justify-center text-white font-bold text-lg">
                      {(patient.profile?.full_name ?? 'P')[0]}
                    </div>
                    <RiskBadge label={patient.latest_scan?.sga_risk_label ?? null} />
                  </div>
                  <h3 className="font-bold text-purple-900">{patient.profile?.full_name ?? 'Unknown patient'}</h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm font-semibold text-pink-600">
                      {formatGA(ga.weeks, ga.days)}
                    </p>
                    {countdown !== null && (
                      <p className="text-xs text-purple-400">EDD in {countdown} days</p>
                    )}
                    {patient.latest_scan && (
                      <p className="text-xs text-purple-400">Last scan: {formatDate(patient.latest_scan.scan_date)}</p>
                    )}
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      <NewPatientModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={loadPatients}
      />
    </div>
  )
}
