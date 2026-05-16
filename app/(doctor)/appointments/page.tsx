'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { FormField, Input, Select, Textarea } from '@/components/ui/input'
import { formatDateTime } from '@/lib/utils/format'

interface Appt {
  id: string
  patient_id: string
  scheduled_at: string
  status: string
  appointment_type: string
  notes: string | null
  patient?: { profile?: { full_name: string } }
}

interface PatientOption {
  id: string
  profile: { full_name: string }
}

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
  scheduled:  'bg-amber-100 text-amber-700',
}

export default function AppointmentsPage() {
  const [appts,     setAppts]     = useState<Appt[]>([])
  const [patients,  setPatients]  = useState<PatientOption[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [loading,   setLoading]   = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [form, setForm] = useState({
    patient_id: '', scheduled_at: '', appointment_type: 'antenatal', notes: '',
  })

  async function load() {
    setLoading(true)
    const url    = statusFilter ? `/api/appointments?status=${statusFilter}` : '/api/appointments'
    const [r1, r2] = await Promise.all([fetch(url), fetch('/api/patients')])
    const apptData    = await r1.json()
    const patientData = await r2.json()
    setAppts(Array.isArray(apptData) ? apptData : [])
    setPatients(Array.isArray(patientData) ? patientData : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [statusFilter])

  async function createAppt(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setModalOpen(false)
    setForm({ patient_id: '', scheduled_at: '', appointment_type: 'antenatal', notes: '' })
    load()
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-extrabold text-3xl text-purple-950 tracking-tight">Appointments</h1>
          <p className="text-purple-400 font-medium mt-1">{appts.length} appointment{appts.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus size={16} /> New Appointment</Button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2">
        {[['', 'All'], ['scheduled', 'Scheduled'], ['completed', 'Completed'], ['cancelled', 'Cancelled']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setStatusFilter(val)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              statusFilter === val
                ? 'bg-pink-500 text-white'
                : 'bg-white border border-purple-200 text-purple-600 hover:border-pink-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-purple-50 rounded-2xl animate-pulse" />)}
        </div>
      ) : appts.length === 0 ? (
        <div className="text-center py-16 text-purple-300">
          <Calendar size={48} className="mx-auto mb-3 opacity-40" />
          <p className="font-bold text-lg">No appointments found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appts.map(appt => {
            const patientName = appt.patient?.profile?.full_name ?? 'Unknown patient'
            return (
              <Card key={appt.id} className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <Link
                    href={`/patients/${appt.patient_id}`}
                    className="font-semibold text-purple-800 hover:text-pink-600 hover:underline transition-colors"
                  >
                    {patientName}
                  </Link>
                  <p className="text-sm text-purple-400 mt-0.5">{formatDateTime(appt.scheduled_at)}</p>
                  {appt.notes && <p className="text-xs text-purple-400 mt-0.5 truncate">{appt.notes}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-bold capitalize whitespace-nowrap">
                    {appt.appointment_type.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${STATUS_STYLES[appt.status] ?? 'bg-purple-100 text-purple-700'}`}>
                    {appt.status}
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Appointment">
        <form onSubmit={createAppt} className="space-y-4">
          <FormField label="Patient" required>
            <Select value={form.patient_id} onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))} required>
              <option value="">Select patient…</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.profile.full_name}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Date & Time" required>
            <Input
              type="datetime-local"
              value={form.scheduled_at}
              onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
              required
            />
          </FormField>
          <FormField label="Type">
            <Select value={form.appointment_type} onChange={e => setForm(f => ({ ...f, appointment_type: e.target.value }))}>
              {['antenatal', 'scan', 'follow_up', 'emergency', 'growth_check'].map(t => (
                <option key={t} value={t}>{t.replace('_', ' ')}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Notes">
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          </FormField>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
