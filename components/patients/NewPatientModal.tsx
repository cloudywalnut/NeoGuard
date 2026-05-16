'use client'
import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input, FormField, Select } from '@/components/ui/input'
import { Copy, Check } from 'lucide-react'

interface Props { open: boolean; onClose: () => void; onCreated: () => void }

export function NewPatientModal({ open, onClose, onCreated }: Props) {
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdPassword, setCreatedPassword] = useState('')
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState({
    full_name: '', email: '', lmp: '', date_of_birth: '',
    gravida: '1', parity: '0', blood_type: '', height_cm: '',
    pre_pregnancy_weight_kg: '', ethnicity: '',
  })

  function set(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))
  }

  const tempPassword = `NeoG-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/create-patient', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, temp_password: tempPassword }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Failed to create patient'); return }
    setCreatedPassword(tempPassword)
    setStep('success')
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(createdPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleClose() {
    setStep('form')
    setError('')
    onClose()
    if (step === 'success') onCreated()
  }

  return (
    <Modal open={open} onClose={handleClose} title={step === 'form' ? 'Add New Patient' : 'Patient Created!'} size="lg">
      {step === 'form' ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FormField label="Full name" required>
                <Input value={form.full_name} onChange={set('full_name')} placeholder="Patient's full name" required />
              </FormField>
            </div>
            <div className="col-span-2">
              <FormField label="Email" required>
                <Input type="email" value={form.email} onChange={set('email')} placeholder="patient@email.com" required />
              </FormField>
            </div>
            <FormField label="Last Menstrual Period (LMP)" required>
              <Input type="date" value={form.lmp} onChange={set('lmp')} required />
            </FormField>
            <FormField label="Date of Birth">
              <Input type="date" value={form.date_of_birth} onChange={set('date_of_birth')} />
            </FormField>
            <FormField label="Gravida">
              <Input type="number" min={1} value={form.gravida} onChange={set('gravida')} />
            </FormField>
            <FormField label="Parity">
              <Input type="number" min={0} value={form.parity} onChange={set('parity')} />
            </FormField>
            <FormField label="Blood Type">
              <Select value={form.blood_type} onChange={set('blood_type')}>
                <option value="">Select</option>
                {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Ethnicity">
              <Input value={form.ethnicity} onChange={set('ethnicity')} placeholder="e.g. Malay, Chinese, Indian" />
            </FormField>
            <FormField label="Height (cm)">
              <Input type="number" value={form.height_cm} onChange={set('height_cm')} placeholder="158" />
            </FormField>
            <FormField label="Pre-pregnancy weight (kg)">
              <Input type="number" value={form.pre_pregnancy_weight_kg} onChange={set('pre_pregnancy_weight_kg')} placeholder="55" />
            </FormField>
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-xl">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">Cancel</Button>
            <Button type="submit" loading={loading} className="flex-1">Create Patient</Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-sm font-semibold text-green-700 mb-1">Account created successfully!</p>
            <p className="text-sm text-green-600">Share these login details with your patient:</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-xl space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-purple-400">Temporary Password</p>
            <div className="flex items-center gap-3">
              <code className="flex-1 text-lg font-mono font-bold text-purple-800">{createdPassword}</code>
              <button onClick={handleCopy} className="p-2 hover:bg-purple-100 rounded-lg text-purple-500">
                {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
              </button>
            </div>
          </div>
          <p className="text-xs text-purple-400">Ask the patient to change this password after first login.</p>
          <Button onClick={handleClose} className="w-full">Done</Button>
        </div>
      )}
    </Modal>
  )
}
