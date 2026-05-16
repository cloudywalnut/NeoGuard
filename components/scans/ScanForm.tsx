'use client'
import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input, FormField, Select, Textarea } from '@/components/ui/input'
import { format } from 'date-fns'

interface Props {
  open: boolean
  onClose: () => void
  patientId: string
  onSaved: () => void
  appointments?: Array<{ id: string; scheduled_at: string; appointment_type: string }>
}

export function ScanForm({ open, onClose, patientId, onSaved, appointments = [] }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    scan_date: format(new Date(), 'yyyy-MM-dd'),
    gestational_age_weeks: '', gestational_age_days: '0',
    scan_type: 'growth', appointment_id: '',
    bpd_mm: '', hc_mm: '', ac_mm: '', fl_mm: '',
    efw_grams: '', efw_percentile: '', nuchal_thickness_mm: '',
    ut_pi: '', ut_ri: '', ua_pi: '', ua_ri: '', mca_pi: '', mca_ri: '', cpr: '',
    papp_a_mom: '', plgf_mom: '', beta_hcg_mom: '',
    sonographer_notes: '',
  })

  function set(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))
  }

  function toNum(v: string) { const n = parseFloat(v); return isNaN(n) ? null : n }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.gestational_age_weeks) { setError('Gestational age is required'); return }
    setLoading(true)
    setError('')

    const body: Record<string, unknown> = {
      scan_date: form.scan_date,
      gestational_age_weeks: parseInt(form.gestational_age_weeks),
      gestational_age_days: parseInt(form.gestational_age_days) || 0,
      scan_type: form.scan_type || null,
      appointment_id: form.appointment_id || null,
      bpd_mm: toNum(form.bpd_mm), hc_mm: toNum(form.hc_mm), ac_mm: toNum(form.ac_mm), fl_mm: toNum(form.fl_mm),
      efw_grams: toNum(form.efw_grams), efw_percentile: toNum(form.efw_percentile),
      nuchal_thickness_mm: toNum(form.nuchal_thickness_mm),
      ut_pi: toNum(form.ut_pi), ut_ri: toNum(form.ut_ri), ua_pi: toNum(form.ua_pi), ua_ri: toNum(form.ua_ri),
      mca_pi: toNum(form.mca_pi), mca_ri: toNum(form.mca_ri), cpr: toNum(form.cpr),
      papp_a_mom: toNum(form.papp_a_mom), plgf_mom: toNum(form.plgf_mom), beta_hcg_mom: toNum(form.beta_hcg_mom),
      sonographer_notes: form.sonographer_notes || null,
    }

    const res = await fetch(`/api/patients/${patientId}/scans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Failed to save scan'); return }
    onSaved()
    onClose()
  }

  const inputRow = (label: string, key: string, placeholder?: string) => (
    <FormField label={label}>
      <Input type="number" step="0.01" value={(form as Record<string, string>)[key]} onChange={set(key)} placeholder={placeholder} />
    </FormField>
  )

  return (
    <Modal open={open} onClose={onClose} title="Record New Scan" size="xl">
      <form onSubmit={handleSubmit} className="space-y-5 max-h-[75vh] overflow-y-auto pr-1 scrollbar-thin">
        {/* Basic */}
        <div className="grid grid-cols-3 gap-3">
          <FormField label="Scan Date" required>
            <Input type="date" value={form.scan_date} onChange={set('scan_date')} required />
          </FormField>
          <FormField label="GA Weeks" required>
            <Input type="number" min={10} max={42} value={form.gestational_age_weeks} onChange={set('gestational_age_weeks')} placeholder="22" required />
          </FormField>
          <FormField label="GA Days">
            <Input type="number" min={0} max={6} value={form.gestational_age_days} onChange={set('gestational_age_days')} placeholder="0" />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Scan Type">
            <Select value={form.scan_type} onChange={set('scan_type')}>
              {['dating','nuchal','anomaly','growth','doppler','wellbeing'].map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </Select>
          </FormField>
          {appointments.length > 0 && (
            <FormField label="Appointment">
              <Select value={form.appointment_id} onChange={set('appointment_id')}>
                <option value="">None</option>
                {appointments.map(a => (
                  <option key={a.id} value={a.id}>
                    {format(new Date(a.scheduled_at), 'dd MMM yyyy')} — {a.appointment_type}
                  </option>
                ))}
              </Select>
            </FormField>
          )}
        </div>

        {/* Biometry */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-3">Ultrasound Biometry (mm)</p>
          <div className="grid grid-cols-3 gap-3">
            {inputRow('AC (mm) ★', 'ac_mm', '230')}
            {inputRow('FL (mm) ★', 'fl_mm', '42')}
            {inputRow('BPD (mm)', 'bpd_mm', '58')}
            {inputRow('HC (mm)', 'hc_mm', '210')}
            {inputRow('EFW (g)', 'efw_grams', '600')}
            {inputRow('EFW Percentile', 'efw_percentile', '45')}
            {inputRow('NT (mm) ★', 'nuchal_thickness_mm', '4.5')}
          </div>
        </div>

        {/* Doppler */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-3">Doppler Velocimetry</p>
          <div className="grid grid-cols-3 gap-3">
            {inputRow('Ut PI ★', 'ut_pi', '1.0')}
            {inputRow('Ut RI ★', 'ut_ri', '0.58')}
            {inputRow('UA PI', 'ua_pi', '1.0')}
            {inputRow('UA RI', 'ua_ri', '0.6')}
            {inputRow('MCA PI', 'mca_pi', '1.7')}
            {inputRow('MCA RI', 'mca_ri', '0.8')}
            {inputRow('CPR', 'cpr', '2.0')}
          </div>
        </div>

        {/* Biomarkers */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-3">Serum Biomarkers (MoM)</p>
          <div className="grid grid-cols-3 gap-3">
            {inputRow('PAPP-A (MoM)', 'papp_a_mom', '1.0')}
            {inputRow('PlGF (MoM)', 'plgf_mom', '1.0')}
            {inputRow('β-hCG (MoM)', 'beta_hcg_mom', '1.0')}
          </div>
        </div>

        <FormField label="Sonographer Notes">
          <Textarea value={form.sonographer_notes} onChange={set('sonographer_notes')} rows={2} placeholder="Additional observations..." />
        </FormField>

        {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-xl">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" loading={loading} className="flex-1">
            {loading ? 'Analyzing with AI...' : 'Save & Analyze'}
          </Button>
        </div>
        <p className="text-xs text-center text-purple-300">★ Key SGA predictors. Gemini AI analysis runs on save.</p>
      </form>
    </Modal>
  )
}
